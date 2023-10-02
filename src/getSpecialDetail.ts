import {browser} from './initBrowser'

export async function getSpecialDetail(specialUrl: string) {

  try {
    const specialPage = await browser.newPage();

    await specialPage.goto(specialUrl)

    // console.log('goto ', specialUrl)

    await specialPage.waitForSelector('[data-testid="hero__pageTitle"]', {
      timeout: 5000
    })

    // console.log('get title ', specialUrl)

    const datetime = await specialPage.evaluate(() => {
      return document.querySelector('[data-testid="title-details-releasedate"] .ipc-inline-list__item a')?.innerHTML
    })

    const netflixURL = await specialPage.evaluate(() => {
      // const platform = document.querySelector('[data-testid="details-officialsites"] .ipc-inline-list__item a').innerText
      const element = document.querySelector('[data-testid="details-officialsites"] .ipc-inline-list__item a')
      return (element as HTMLAnchorElement)?.href
    })

    const runtimeDuration = await specialPage.evaluate(() => {
      const element = document.querySelector('[data-testid="title-techspec_runtime"] .ipc-metadata-list-item__content-container')
      return (element as HTMLElement)?.innerText
    })

    const coverImgURL = await specialPage.evaluate(() => {
      const element = document.querySelector('.ipc-image')
      const imgURLs = (element as any)?.srcset.split(', ')
      if ((imgURLs as Array<string>)?.length > 0) {
        const urlString = imgURLs[imgURLs.length - 1]
        const highResolutionUrl = /(.+) (?:.+w)/.exec(urlString)
        return highResolutionUrl?.[1] || ''
      }
      return (element as any)?.srcset.split(', ')
    })

    const tags = await specialPage.evaluate(() => {
      return Array.from(document.querySelectorAll('[data-testid="genres"] .ipc-chip')).map(node => (node as HTMLElement).innerText)
    })

    const rating = await specialPage.evaluate(() => {
      return document.querySelector('[data-testid="hero-rating-bar__aggregate-rating__score"] span')?.innerHTML
    })

    // console.log(datetime, netflixURL, runtimeDuration, tags, rating, 'special info')

    return {
      datetime,
      netflixURL,
      runtimeDuration,
      tags,
      rating,
      coverImgURL
    }
  } catch(e) {
    console.log(e, 'specialUrl', specialUrl)
    return {

    }
  }

}