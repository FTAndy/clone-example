import { browser } from '../utils/initBrowser';


export default async function getSubtitleSRTFile(specialName: string, format: string = 'srt') {
  const subtitlePage = await browser.newPage();

  await subtitlePage.goto(`https://subtitlist.com/search?title=${encodeURI(specialName)}`, {
    timeout: 60 * 1000,
  });

  await subtitlePage.waitForSelector('.list-row')

  const subtitleUrl = await subtitlePage.evaluate(() => {
    const anchorElement = document.querySelector('.list-row p a') as HTMLAnchorElement;
    return anchorElement?.href;
  });

  if (subtitleUrl) {
    await subtitlePage.goto(subtitleUrl)

    await subtitlePage.waitForSelector('.list-group')

    const firstSubtitleUrl = await subtitlePage.evaluate(() => {
      let list = document.querySelectorAll('.list-group-item a')
      const listArray = Array.from(list)
      const firstSubtitle  = listArray.find(c => (c as HTMLAnchorElement).href.includes('english'))
      if (firstSubtitle) {
        return (firstSubtitle as HTMLAnchorElement).href
      }
    })

    if (firstSubtitleUrl) {
      await subtitlePage.goto(firstSubtitleUrl)

      await subtitlePage.waitForSelector('.fa-download')
      // TODO: use API to stably fetch subtitle https://opensubtitles.stoplight.io/docs/opensubtitles-api/e3750fd63a100-getting-started

    }

  }

}