"use strict";
// const Nightmare = require('nightmare')
// const specialCrawler = Nightmare({ 
//   show: true,
//   waitTimeout: 60 * 1000,
//   // openDevTools: {
//   //   mode: 'detach'
//   // },
// })
// module.exports = async function getSpecialDetail(specialUrl) {
//   await specialCrawler
//     .useragent('chrome')
//     // .useragent('firefox')
//     .goto(specialUrl)
//   await specialCrawler.wait('[data-testid="hero__pageTitle"]')
//   const datetime = await specialCrawler.evaluate(() => {
//     return document.querySelector('[data-testid="title-details-releasedate"] .ipc-inline-list__item a').innerText
//   })
//   const netflixURL = await specialCrawler.evaluate(() => {
//     // const platform = document.querySelector('[data-testid="details-officialsites"] .ipc-inline-list__item a').innerText
//     return document.querySelector('[data-testid="details-officialsites"] .ipc-inline-list__item a').href
//   })
//   const runtime = await specialCrawler.evaluate(() => {
//     return document.querySelector('[data-testid="title-techspec_runtime"] .ipc-metadata-list-item__content-container').innerText
//   })
//   const tags = await specialCrawler.evaluate(() => {
//     return Array.from(document.querySelectorAll('[data-testid="genres"] .ipc-chip')).map(node => node.innerText)
//   })
//   const rating = await specialCrawler.evaluate(() => {
//     return document.querySelector('[data-testid="hero-rating-bar__aggregate-rating__score"] span').innerText
//   })
//   console.log(datetime, netflixURL, runtime, tags, rating)
//   await specialCrawler.end()
//   return {
//     datetime,
//     netflixURL,
//     runtime,
//     tags,
//     rating
//   }
// }
