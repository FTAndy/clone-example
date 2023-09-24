const Nightmare = require('nightmare')
const fs = require('fs');
const path = require('path')
const getBilibiliVideoEmbedUrl = require('./getBilibiliVideoEmbedUrl')
const getSpecialDetail = require('./getSpecialDetail')
// list: https://www.imdb.com/list/ls003453197/

const comedianCrawler = Nightmare({ 
  show: true,
  waitTimeout: 60 * 1000,
  // openDevTools: {
  //   mode: 'detach'
  // },
})

function getRandom1to5 () {
  return Math.floor(Math.random() * 100 / 20) + 1
}


// TODO: get cover image from netflix: https://www.netflix.com/sg/title/81625055
async function start({
  imdbURL
}: {
  imdbURL: string
}) {
  await comedianCrawler
    .useragent('chrome')
    // .useragent('firefox')
    .goto(imdbURL)

  await comedianCrawler.wait('[data-testid="hero__pageTitle"] span')

  const comedianName = await comedianCrawler.evaluate(() => {
    return document.querySelector('[data-testid="hero__pageTitle"] span').innerText
  })

  let flag = true

  while (flag) {
    const isThereATag = await comedianCrawler.exists('.ipc-chip--active')
    if (isThereATag) {
      await comedianCrawler.click('.ipc-chip--active')
      await comedianCrawler.wait(1000 * getRandom1to5())
    } else {
      flag = false
    }
  }

  await comedianCrawler.click('#name-filmography-filter-writer')

  setTimeout(async () => {
    const errorExist = await comedianCrawler.exists('[data-testid="retry-error"]')
    if (errorExist) {
      await comedianCrawler.click('[data-testid="retry"]')
    }
  }, 5000)

  await comedianCrawler.wait('.filmo-section-writer')

  const allSpecials = await comedianCrawler.evaluate(() => {
    return {
      href: document.querySelector('.ipc-metadata-list-summary-item__t').href,
      name: document.querySelector('.ipc-metadata-list-summary-item__t').innerText
    }
  })

  // const specialInfo = await comedianCrawler.evaluate(() => {
  //   return {
  //     href: document.querySelector('.ipc-metadata-list-summary-item__t').href,
  //     name: document.querySelector('.ipc-metadata-list-summary-item__t').innerText
  //   }
  // })

  const {
    name: specialName,
    href: specialUrl
  } = specialInfo

  const bilibiliEmbedUrl = await getBilibiliVideoEmbedUrl(specialName, comedianName)

  const specialDetail = await getSpecialDetail(specialUrl)

  await comedianCrawler.end()

  return {
    name: comedianName,
    specialDetail,
    bilibiliEmbedUrl,
    imdbURL
  }
}

async function getOneSpecialInfo({ specialName, specialUrl }) {
  try {
    const [bilibiliEmbedUrl, specialDetail] = await Promise.all([getBilibiliVideoEmbedUrl(specialName, comedianName), getSpecialDetail(specialUrl)]) 
    return {
      bilibiliEmbedUrl, 
      specialDetail
    }
  } catch (error) {
    console.log('error getOneSpecialInfo', error)
  }
}

async function main(imdbURL = 'https://www.imdb.com/name/nm0152638/?ref_=nmls_hd') {
  const infos = await start({
    imdbURL
  })
  fs.writeFile(path.resolve(__dirname, 'settings.json'), JSON.stringify(infos), function(error) {
    if (error) {
      console.log(error)
    }
  })
}

main()

export {};