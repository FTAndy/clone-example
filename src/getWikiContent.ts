import { browser } from './initBrowser';
import logger from './logger'

export async function getWikiContent(
  comedianName: string,
) {
  const wikiPage = await browser.newPage();


  try {

    await wikiPage.setViewport({ width: 1920, height: 1080 });

    await wikiPage.goto('https://en.wikipedia.org/wiki/Main_Page', {
      timeout: 60 * 1000,
    });
   
    // await wikiPage.click('.search-toggle')

    await wikiPage.waitForSelector('[name="search"]')

    await wikiPage.type('[name="search"]', `${comedianName}`);

    await wikiPage.evaluate(() => {
      const button = document.querySelector('.cdx-search-input__end-button');
      button && (button as HTMLAnchorElement).click();
    });

    await wikiPage.waitForSelector('.infobox-image')

    const avatarUrl = await wikiPage.evaluate(() => {
      const imgElement = document.querySelector('.infobox-image img')
      if (imgElement) {
        return (imgElement as any).src
      }
      return ''
    })

    const wikiUrl = await wikiPage.evaluate(() => {
      return location.href
    })

    console.log(avatarUrl, 'avatarUrl')

    await wikiPage.close()

    return {
      avatarUrl,
      wikiUrl
    }
  } catch (error) {
    logger.log('error', 'wikiPage error', comedianName, error)
    await wikiPage.close()
    return {}
  }
}
