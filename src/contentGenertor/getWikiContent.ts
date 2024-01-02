import { browser } from '../utils/initBrowser';
import logger from '../utils/logger'

export async function getWikiContent(
  comedianName: string,
) {
  const wikiPage = await browser.newPage();


  try {

    await wikiPage.setViewport({ width: 1920, height: 1080 });

    await wikiPage.goto('https://en.wikipedia.org/wiki/Main_Page', {
      timeout: 120 * 1000,
    });
   
    // await wikiPage.click('.search-toggle')

    await wikiPage.waitForSelector('[name="search"]')

    await wikiPage.type('[name="search"]', `${comedianName}`);

    await wikiPage.evaluate(() => {
      const button = document.querySelector('.cdx-search-input__end-button');
      button && (button as HTMLAnchorElement).click();
    });

    await wikiPage.waitForSelector('#mw-content-text')

    const avatarSrcSet = await wikiPage.evaluate(() => {
      const imgElement = document.querySelector('.infobox-image img')
      if (imgElement) {
        return (imgElement as any).srcset
      }
      return ''
    })

    let avatarUrl = ''

    if (avatarSrcSet.length) {
      const importDynamic = new Function('modulePath', 'return import(modulePath)')
      const srcset = await importDynamic('srcset')
      console.log(avatarSrcSet, 'avatarSrcSet')
      const avatarSrcSetArray = srcset.parseSrcset(avatarSrcSet)
      avatarUrl = avatarSrcSetArray[avatarSrcSetArray.length - 1]?.url
    }

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
