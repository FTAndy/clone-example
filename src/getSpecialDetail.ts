import logger from './logger'
import { browser } from './initBrowser';
import { getTheHighestResolutionImg } from './utils';

export async function getSpecialDetail(specialUrl: string, comedianName: string, specialName: string) {
  try {
    const specialPage = await browser.newPage();

    await specialPage.goto(specialUrl, {
      timeout: 60 * 1000,
    });

    // console.log('goto ', specialUrl)

    await specialPage.waitForSelector('[data-testid="hero__pageTitle"]', {
      timeout: 5000,
    });

    // console.log('get title ', specialUrl)

    const datetime = await specialPage.evaluate(() => {
      return document.querySelector(
        '[data-testid="title-details-releasedate"] .ipc-inline-list__item a',
      )?.innerHTML;
    });

    const presentTime = new Date(datetime || '')

    const netflixURL = await specialPage.evaluate(() => {
      // const platform = document.querySelector('[data-testid="details-officialsites"] .ipc-inline-list__item a').innerText
      const element = document.querySelector(
        '[data-testid="details-officialsites"] .ipc-inline-list__item a',
      );
      return (element as HTMLAnchorElement)?.href;
    });

    const runtimeDuration = await specialPage.evaluate(() => {
      const element = document.querySelector(
        '[data-testid="title-techspec_runtime"] .ipc-metadata-list-item__content-container',
      );
      return (element as HTMLElement)?.innerText;
    });

    await specialPage.exposeFunction(
      '_getTheHighestResolutionImg',
      getTheHighestResolutionImg,
    );

    const coverImgURL = await specialPage.evaluate(async () => {
      const element = document.querySelector('.ipc-image');
      const imgURLs = (element as any)?.srcset.split(', ');
      const highResolutionUrl = (window as any)._getTheHighestResolutionImg(
        imgURLs,
      );
      return highResolutionUrl;
    });

    const tags = await specialPage.evaluate(() => {
      return Array.from(
        document.querySelectorAll('[data-testid="genres"] .ipc-chip'),
      ).map((node) => (node as HTMLElement).innerText);
    });

    const rating = await specialPage.evaluate(() => {
      return document.querySelector(
        '[data-testid="hero-rating-bar__aggregate-rating__score"] span',
      )?.innerHTML;
    });

    const isStarred = await specialPage.evaluate((_comedianName) => {
      let elements = document.querySelectorAll('.sc-dffc6c81-3 .ipc-metadata-list__item')
      if (elements) {
        const eleArray = Array.from(elements)
        const starredArea = eleArray.find(s => s.innerHTML.includes('Stars') || s.innerHTML.includes('Star'))
        if (starredArea) {
          return starredArea.innerHTML.includes(_comedianName)
        }
      }

      return false
    }, comedianName)

    console.log(isStarred, comedianName, specialName)

    await specialPage.close()

    // console.log(datetime, netflixURL, runtimeDuration, tags, rating, 'special info')

    return {
      isStarred,
      datetime,
      netflixURL,
      runtimeDuration,
      tags,
      rating: rating ? parseFloat(rating) : 0,
      coverImgURL,
      presentTime
    };
  } catch (e) {
    logger.log('error', 'specialUrl', specialUrl, e);
    return {};
  }
}
