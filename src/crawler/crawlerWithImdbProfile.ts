import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config'
import { getRandom, exists } from '../utils/utils';
import { initBrowser, browser } from '../utils/initBrowser';
import {dbClient, initDB} from '../utils/mongo'
import { ObjectId } from 'mongodb'
import { getTheHighestResolutionImg } from '../utils/utils';
import { omit } from 'lodash'
import { Special } from '../types'
import logger from '../utils/logger'
import { maxLimitedAsync } from '../utils/maxLimitedAsync'
import { getWikiContent } from '../contentGenertor/getWikiContent';
import { getSpecialDetail } from '../contentGenertor/getSpecialDetail';
import { getTMDBMovieInfo } from '../contentGenertor/getTMDBInfo';
import {AIGenerator} from '../contentGenertor/getAIGeneratedContent'
import { TaskStatus } from '../types'
// list: https://www.imdb.com/list/ls003453197/

interface Props {
  imdbURL: string;
  needCrawlSpecialInfo: TaskStatus
  needGenerateAIContent: TaskStatus,
  needCrawlWikiContent: TaskStatus,
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

  // const avatarImgURL = await profilePage.evaluate(async () => {
  //   const element = document.querySelector('.photos-image .ipc-image');
  //   const imgURLs = (element as any)?.srcset.split(', ');
  //   const highResolutionUrl = (window as any)._getTheHighestResolutionImg(
  //     imgURLs,
  //   );
  //   return highResolutionUrl;
  // });

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

  const allSpecials: Array<Special> | undefined = await profilePage.evaluate(() => {
    const specialElements = document.querySelectorAll(
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
    // avatarImgURL,
  };
}

async function startCrawlWithProfile(props: Props) {
  const { 
    imdbURL,
    needCrawlSpecialInfo,
    needGenerateAIContent,
    needCrawlWikiContent
  } = props;

  const { allSpecials, comedianName } = await getSpecials(imdbURL);

  let getSpecialsTasks: Promise<Array<any>> = Promise.resolve([])
  let getAIGeneratedContentTask = Promise.resolve({})
  let getWikiContentTask: Promise<{
    avatarUrl?: string,
    wikiUrl?: string
  }> = Promise.resolve({})

  if (allSpecials?.length && needCrawlSpecialInfo === TaskStatus.notStarted) {
    const specialsTasks = allSpecials
    .map((s) => {
      return () => {
        return getOneSpecialInfo({
          specialName: s.name,
          specialUrl: s.href,
          comedianName,
        })
        .then(({ specialDetail, TMDBInfo}) => {
          return ({
            specialDetail,
            TMDBInfo,
            specialName: s.name,
          });
        })
      }
    });

    getSpecialsTasks = maxLimitedAsync({
      max: 2,
      tasks: specialsTasks
    })

  }

  if (needGenerateAIContent === TaskStatus.notStarted) {
    getAIGeneratedContentTask = AIGenerator.getAllContent(comedianName)
  }

  if (needCrawlWikiContent === TaskStatus.notStarted) {
    getWikiContentTask = getWikiContent(comedianName)
  }

  let [
    specials, 
    AIGeneratedContent,
    wikiContent,
  ] = await Promise.all([
    getSpecialsTasks,
    getAIGeneratedContentTask,
    getWikiContentTask,
  ]);

  if (specials.length > 0) {
    specials = specials
    // filter out the specials that is starred by the comedian
    .filter(s => {
      return s?.specialDetail.isStarred
    })
    .filter(s => {
      return s?.specialDetail.TMDBInfo
    })
  }

  const latestSpecialImg = (specials as any)?.[0]?.specialDetail?.coverImgURL

  return {
    name: comedianName,
    ...wikiContent,
    ...(wikiContent?.avatarUrl ? {} : {
      avatarUrl: latestSpecialImg
    }),
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
    const [specialDetail, TMDBInfo ] = await Promise.all([
      getSpecialDetail(specialUrl, comedianName, specialName),
      getTMDBMovieInfo(`${comedianName} ${specialName}`)
    ]);
    return {
      specialDetail,
      TMDBInfo
    };
  } catch (error) {
    logger.error('error getOneSpecialInfo', error);
    return {
      specialDetail: '',
      TMDBInfo: null
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
  
    const Database = dbClient.db("standup-wiki");
    const Comedian = Database.collection("comedian");
    const Special = Database.collection('special')
  
    await initDB()
    
    const infos = await startCrawlWithProfile(props);
  
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
      // update newest data to comedian
      await Comedian.updateOne(filter, updateDoc, options)
      const updatedComedian = await Comedian.findOne({
        name: infos?.name
      })

      const comedianID = updatedComedian?._id

      // update specials info
      if (needCrawlSpecialInfo === TaskStatus.notStarted && comedianID && infos.specials.length > 0) {
        await Promise.all(infos.specials.map(special => {
          console.log(special, 'special')
          return Special.updateOne({
            comedian_id: comedianID,
            name: special.specialName,
          }, 
          {
            $set: special
          },
          { upsert: true }
          )
        }))
      }      
    }

    console.log('update to db done', infos?.name, eventSource)
  
    if (eventSource === 'solo') {
      await dbClient.close()
      await browser.close()
    }

  
    // await fs.writeFile(
    //   path.resolve(__dirname, '..', 'temp', `${infos?.name}.json`),
    //   JSON.stringify(infos),
    // );
    // await browser.close();
  
    return true    
  } catch (error) {
    logger.log('error', props.imdbURL, error)
    return false
  }
}
