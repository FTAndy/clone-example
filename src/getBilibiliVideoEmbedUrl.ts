const Nightmare = require('nightmare')

module.exports = async function getBilibiliVideoEmbedUrl(specialName, comedianName) {
  const bilibiliCrawler = Nightmare({ 
    show: true,
    waitTimeout: 30 * 1000,
    // openDevTools: {
    //   mode: 'detach'
    // },
  })

  const videoUrl = await bilibiliCrawler
    .useragent('chrome')
    .goto('https://search.bilibili.com/')
    .wait('#search-keyword')
    .type('#search-keyword', `${specialName} ${comedianName}`)
    .click('.searchBtn')
    .wait('.video-list')
    .evaluate(() => {
      return document.querySelector('.video-list div a[href]').href
    })

  const videoInfo = await bilibiliCrawler
    .goto(videoUrl)
    .wait('#share-btn-iframe')
    .evaluate(() => {
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

  // await bilibiliCrawler.wait(5000000)  

  await bilibiliCrawler.end()

  return iframeUrl
}