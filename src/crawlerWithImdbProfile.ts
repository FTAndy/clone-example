import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config'
import { getRandom, exists } from './utils';
import { initBrowser, browser } from './initBrowser';
import { getBilibiliVideoInfo } from './getBilibiliVideoInfo';
import MongoClient from './mongo'
import { getTheHighestResolutionImg } from './utils';
import { getSpecialDetail } from './getSpecialDetail';
import getAIGeneratedContent from './getAIGeneratedContent'
// list: https://www.imdb.com/list/ls003453197/

interface Props {
  imdbURL: string;
}

async function getSpecials(props: Props) {
  const { imdbURL } = props;

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
    const errorExist = await exists(profilePage, '[data-testid="retry-error"]');
    if (errorExist) {
      await profilePage.click('[data-testid="retry"]');
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

  const allSpecials = await profilePage.evaluate(() => {
    let specialElements = document.querySelectorAll(
      '.ipc-metadata-list-summary-item__tc',
    );
    if (specialElements) {
      const specialElementsArray = Array.from(specialElements);
      return specialElementsArray
        .filter(
          (e) =>
            e?.innerHTML.includes('Special') || e?.innerHTML.includes('Video'),
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

  return {
    allSpecials,
    comedianName,
    avatarImgURL,
  };
}

// TODO: get cover image from netflix: https://www.netflix.com/sg/title/81625055
async function startCrawlWithProfile(props: Props) {
  const { imdbURL } = props;

  const { allSpecials, comedianName, avatarImgURL } = await getSpecials({
    imdbURL,
  });

  if (allSpecials) {
    const specialsTasks = allSpecials
    .slice(0, 2)
    .map((s) => {
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
    });

    // const getWikiTask = getAIGeneratedContent(comedianName)
    const getSpecialsTasks = Promise.all(specialsTasks)
    
    const [
      specials, 
      // AIGeneratedContent
    ] = await Promise.all([
      getSpecialsTasks,
      // getWikiTask
    ]);

    const latestSpecialImg = (specials as any)?.[0]?.specialDetail?.coverImgURL

    return {
      name: comedianName,
      avatarImgURL: latestSpecialImg ? latestSpecialImg : avatarImgURL,
      specials,
      // AIGeneratedContent
    };
  }
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
      getSpecialDetail(specialUrl),
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

export default async function main(
  imdbURL = 'https://www.imdb.com/name/nm0152638/?ref_=nmls_hd',
) {
  await initBrowser();

  const Database = MongoClient.db("standup-wiki");
  const Comedian = Database.collection("comedian");

  await MongoClient.connect()

  const infos = await startCrawlWithProfile({
    imdbURL,
  });


  if (infos) {
    const filter = { name: infos?.name };
    const options = { upsert: true };
    const updateDoc = {
      $set: infos,
    };
    await Comedian.updateOne(filter, updateDoc, options)
  }

  await MongoClient.close()

  await fs.writeFile(
    path.resolve(__dirname, '..', 'temp', `${infos?.name}.json`),
    JSON.stringify(infos),
  );
  await browser.close();
}
