import puppeteer from 'puppeteer';

declare global {
  interface Window {
    __INITIAL_STATE__: {
      cidMap: any
    };
  }
}
module.exports = async function getBilibiliVideoEmbedUrl(specialName: string, comedianName: string) {
  const browser = await puppeteer.launch({
    product: 'chrome',
    headless: false
  });

  const profilePage = await browser.newPage();

  await profilePage
    .goto('https://search.bilibili.com/')

  await profilePage.waitForSelector('#search-keyword')

  await profilePage.type('#search-keyword', `${specialName} ${comedianName}`)
  
  await profilePage.click('.searchBtn')

  await profilePage.waitForSelector('.video-list')

  const videoUrl = await profilePage.evaluate(() => {
    const element = document.querySelector('.video-list div a[href]')
    return (element as HTMLAnchorElement)?.href || null
  })

  if (videoUrl) {
    await profilePage.goto(videoUrl)

    await profilePage.waitForSelector('#share-btn-iframe')
    
    const videoInfo = await profilePage.evaluate(() => {
        const state = window.__INITIAL_STATE__
        const {cidMap} = state
        const keys = Object.keys(cidMap)
        const key = keys[0]
        const videoInfo = cidMap[key]
        const { aid, bvid } = videoInfo
        const cid = key
        return {
          cid,
          aid,
          bvid
        }
      })

    const { aid, bvid, cid } = videoInfo
    
    const iframeUrl = `//player.bilibili.com/player.html?aid=${aid}&bvid=${bvid}&cid=${cid}&high_quality=1&autoplay=false`

    console.log(videoInfo, 'videoInfo', iframeUrl)

    // await profilePage.wait(5000000)  

    return iframeUrl
  }
}