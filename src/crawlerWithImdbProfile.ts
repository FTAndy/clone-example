import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config'
import { getRandom, exists } from './utils';
import { initBrowser, browser } from './initBrowser';
import { getBilibiliVideoInfo } from './getBilibiliVideoInfo';
import MongoClient from './mongo'
import { ObjectId } from 'mongodb'
import { getTheHighestResolutionImg } from './utils';
import { omit } from 'lodash'
import { Special } from './types'
import { maxLimitedAsync } from './maxLimitedAsync'
import { getWikiContent } from './getWikiContent';
import { getSpecialDetail } from './getSpecialDetail';
import {AIGenerator} from './getAIGeneratedContent'
import { TaskStatus } from './types'
import { info } from 'console';
// list: https://www.imdb.com/list/ls003453197/

interface Props {
  imdbURL: string;
  needCrawlSpecialInfo: TaskStatus
  needGenerateAIContent: TaskStatus,
  eventSource?: 'solo' | 'list'
}

async function getSpecials(imdbURL: string) {

  const profilePage = await browser.newPage();

  await profilePage.goto(imdbURL);

  await profilePage.waitForSelector('[data-testid="hero__pageTitle"] span');

  const comedianName =
    (await profilePage.evaluate(() => {
      return document.querySelector('[data-testid="hero__pageTitle"] span')
        ?.innerHTML;
    })) || '';

  let flag = true;

  while (flag) {
    const isThereATag = await exists(profilePage, '.ipc-chip--active');
    if (isThereATag) {
      await profilePage.click('.ipc-chip--active');
      await profilePage.waitForTimeout(1000 * getRandom());
    } else {
      flag = false;
    }
  }

  await profilePage.click('#name-filmography-filter-writer');

  setTimeout(async () => {
    try {
      if (profilePage && !profilePage.isClosed()) {
        const errorExist = await exists(profilePage, '[data-testid="retry-error"]');
        if (errorExist) {
          await profilePage.click('[data-testid="retry"]');
        }
      }      
    } catch (error) {
      
    }
  }, 5000);

  await profilePage.waitForSelector('.filmo-section-writer');

  await profilePage.exposeFunction(
    '_getTheHighestResolutionImg',
    getTheHighestResolutionImg,
  );

  // TODO: get higher resolution
  const avatarImgURL = await profilePage.evaluate(async () => {
    const element = document.querySelector('.photos-image .ipc-image');
    const imgURLs = (element as any)?.srcset.split(', ');
    const highResolutionUrl = (window as any)._getTheHighestResolutionImg(
      imgURLs,
    );
    return highResolutionUrl;
  });

  const hasSeeMoreButton = await profilePage.evaluate(() => {
    const seeMoreButton = document.querySelector('.ipc-see-more__text');
    if (seeMoreButton) {
      (seeMoreButton as any).click();
    }
    return seeMoreButton;
  });

  if (hasSeeMoreButton) {
    await profilePage.waitForTimeout(1000);
  }

  let allSpecials: Array<Special> | undefined = await profilePage.evaluate(() => {
    let specialElements = document.querySelectorAll(
      '.ipc-metadata-list-summary-item__tc',
    );
    if (specialElements) {
      const specialElementsArray = Array.from(specialElements);
      return specialElementsArray
        .filter(
          (e) =>
            e?.innerHTML.includes('Special') 
            || e?.innerHTML.includes('Video') 
            // || e?.querySelectorAll('.sc-9814c2de-0 > span')?.length === 1,
        )
        .map((e) => e?.querySelector('.ipc-metadata-list-summary-item__t'))
        .map((e) => {
          return {
            href: (e as HTMLAnchorElement)?.href,
            name: (e as HTMLAnchorElement)?.innerText,
          };
        });
    }
  });


  await profilePage.close()

  return {
    allSpecials: allSpecials || [],
    comedianName,
    avatarImgURL,
  };
}

// TODO: get cover image from netflix: https://www.netflix.com/sg/title/81625055
async function startCrawlWithProfile(props: Props) {
  const { 
    imdbURL,
    needCrawlSpecialInfo,
    needGenerateAIContent
  } = props;

  const { allSpecials, comedianName } = await getSpecials(imdbURL);

  let getSpecialsTasks: Promise<Array<any>> = Promise.resolve([])
  let getAIGeneratedContentTask = Promise.resolve({})
  let getWikiContentTask = Promise.resolve({})

  if (allSpecials?.length && needCrawlSpecialInfo === TaskStatus.notStarted) {
    const specialsTasks = allSpecials
    .map((s) => {
      return () => {
        return Promise.resolve()
        .then(() => {
          return getOneSpecialInfo({
            specialName: s.name,
            specialUrl: s.href,
            comedianName,
          });
        })
        .then(({bilibiliInfo, specialDetail}) => {
          return ({
            bilibiliInfo,
            specialDetail,
            specialName: s.name,
          });
        })
      }
    });

    // getSpecialsTasks = Promise.all(specialsTasks)
    getSpecialsTasks = maxLimitedAsync({
      max: 5,
      tasks: specialsTasks
    })

    getWikiContentTask = getWikiContent(comedianName)
  }

  if (needGenerateAIContent === TaskStatus.notStarted) {
    getAIGeneratedContentTask = AIGenerator.getAllContent(comedianName)
  }

  let [
    specials, 
    AIGeneratedContent,
    wikiContent
  ] = await Promise.all([
    getSpecialsTasks,
    getAIGeneratedContentTask,
    getWikiContentTask
  ]);

  if (specials.length > 0) {
    specials = specials
    .filter(s => {
      return s?.bilibiliInfo
    })
    .filter(s => {
      return s?.specialDetail.isStarred
    })
  }

  // const latestSpecialImg = (specials as any)?.[0]?.specialDetail?.coverImgURL

  return {
    name: comedianName,
    ...wikiContent,
    specials,
    AIGeneratedContent,
    IMDBURL: imdbURL
  };
}

async function getOneSpecialInfo({
  specialName,
  specialUrl,
  comedianName,
}: {
  specialName: string;
  specialUrl: string;
  comedianName: string;
}) {
  try {
    const [bilibiliInfo, specialDetail] = await Promise.all([
      getBilibiliVideoInfo(specialName, comedianName),
      getSpecialDetail(specialUrl, comedianName, specialName),
    ]);
    return {
      bilibiliInfo,
      specialDetail,
    };
  } catch (error) {
    console.log('error getOneSpecialInfo', error);
    return {
      bilibiliEmbedUrl: '',
      specialDetail: '',
    };
  }
}

export default async function main(props: Props) {
  try {
    const {
      imdbURL = 'https://www.imdb.com/name/nm0152638/?ref_=nmls_hd',
      needCrawlSpecialInfo,
      needGenerateAIContent,
      eventSource = 'solo'
    } = props
  
    await initBrowser();
  
    const Database = MongoClient.db("standup-wiki");
    const Comedian = Database.collection("comedian");
    const Special = Database.collection('special')
  
    await MongoClient.connect()
  
    console.log('start to crawler profile', imdbURL)
  
    const infos = await startCrawlWithProfile(props);
  

    console.log('get infos')

    if (infos) {
      let dataSet = {}
      if (needGenerateAIContent === TaskStatus.notStarted) {
        dataSet = {
          ...dataSet,
          AIGeneratedContent: infos.AIGeneratedContent
        }
      }
      dataSet = {
        ...dataSet,
        ...omit(infos, [
          'AIGeneratedContent',
          'specials'
        ])
      }
      const filter = { name: infos?.name };
      const options = { upsert: true };

      const updateDoc = {
        $set: dataSet
      };
      await Comedian.updateOne(filter, updateDoc, options)
      const updatedComedian = await Comedian.findOne({
        name: infos?.name
      })

      const comedianID = updatedComedian?._id

      if (needCrawlSpecialInfo === TaskStatus.notStarted && comedianID && infos.specials.length > 0) {
        await Promise.all(infos.specials.map(special => {
          return Special.updateOne({
            comedian_id: comedianID,
            name: special.specialName,
            bilibiliInfo: { $ne: null }
          }, 
          {
            $set: special
          },
          { upsert: true }
          )
        }))
      }      
    }

    console.log('update to db done', info?.name, eventSource)
  
    if (eventSource === 'solo') {
      await MongoClient.close()
    }

  
    // await fs.writeFile(
    //   path.resolve(__dirname, '..', 'temp', `${infos?.name}.json`),
    //   JSON.stringify(infos),
    // );
    // await browser.close();
  
    return true    
  } catch (error) {
    console.log(error, 'error')
    return false
  }
}
