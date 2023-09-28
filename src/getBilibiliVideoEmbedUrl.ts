import { browser } from './initBrowser'

declare global {
  interface Window {
    __INITIAL_STATE__: {
      cidMap: any
    };
  }
}

export async function getBilibiliVideoEmbedUrl(specialName: string, comedianName: string) {
  const bilibiliPage = await browser.newPage();

  await bilibiliPage
    .goto('https://search.bilibili.com/')

  await bilibiliPage.waitForSelector('.search-input-el')

  await bilibiliPage.type('.search-input-el', `${specialName} ${comedianName}`)
  
  await bilibiliPage.click('.search-button')

  await bilibiliPage.waitForSelector('.video-list div a[href]')

  const videoUrl = await bilibiliPage.evaluate(() => {
    const element = document.querySelector('.video-list div a[href]')
    return (element as HTMLAnchorElement)?.href
  })

  if (videoUrl) {
    await bilibiliPage.goto(videoUrl)

    await bilibiliPage.waitForSelector('#share-btn-iframe')
    
    const videoInfo = await bilibiliPage.evaluate(() => {
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

    return iframeUrl
  }
}