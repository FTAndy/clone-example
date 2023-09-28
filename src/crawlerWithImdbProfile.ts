import fs from 'fs'
import path from 'path'
import { 
  getRandom1to5,
  exists 
} from './utils'
import { initBrowser, browser } from './initBrowser'
import {getBilibiliVideoEmbedUrl} from './getBilibiliVideoEmbedUrl'
import {getSpecialDetail} from './getSpecialDetail'
// list: https://www.imdb.com/list/ls003453197/

interface Props {
  imdbURL: string,
}

async function getSpecials(props: Props) {
  const { imdbURL } = props

  const profilePage = await browser.newPage();

  await profilePage.goto(imdbURL)

  await profilePage.waitForSelector('[data-testid="hero__pageTitle"] span')

  const comedianName = await profilePage.evaluate(() => {
    return document.querySelector('[data-testid="hero__pageTitle"] span')?.innerHTML
  }) || ''

  let flag = true

  console.log(comedianName, 'comedianName')

  while (flag) {
    const isThereATag = await exists(profilePage, '.ipc-chip--active')
    console.log(isThereATag, 'isThereATag')
    if (isThereATag) {
      await profilePage.click('.ipc-chip--active')
      await profilePage.waitForTimeout(1000 * getRandom1to5())
    } else {
      flag = false
    }
  }

  await profilePage.click('#name-filmography-filter-writer')

  setTimeout(async () => {
    const errorExist = await exists(profilePage, '[data-testid="retry-error"]')
    if (errorExist) {
      await profilePage.click('[data-testid="retry"]')
    }
  }, 5000)

  await profilePage.waitForSelector('.filmo-section-writer')

  const allSpecials = await profilePage.evaluate(() => {
    let specialElements = document.querySelectorAll('.ipc-metadata-list-summary-item__t')
    if (specialElements) {
      const specialElementsArray = Array.from(specialElements)
      return specialElementsArray.map(e => {
        return {
          href: (e as HTMLAnchorElement)?.href,
          name: (e as HTMLAnchorElement)?.innerText
        }
      })
    }
  })
  
  return {
    allSpecials,
    comedianName
  }
}


// TODO: get cover image from netflix: https://www.netflix.com/sg/title/81625055
async function startCrawlWithProfile(props: Props) {
  const { imdbURL } = props

  const { allSpecials, comedianName } = await getSpecials({
    imdbURL,
  })

  console.log(allSpecials, comedianName)

  if (allSpecials) {

    const crawelTasks = allSpecials
    .slice(0, 1)
    .map((s) => {
      return new Promise(async (resolve) => {
        const {
          bilibiliEmbedUrl, 
          specialDetail
        } = await getOneSpecialInfo({
          specialName: s.name,
          specialUrl: s.href,
          comedianName
        })

        resolve({
          bilibiliEmbedUrl,
          specialDetail
        })
      })
    })

    const specialDetails = await Promise.all(crawelTasks)
  
    return {
      name: comedianName,
      specialDetails,
    }
  }
}

async function getOneSpecialInfo({ specialName, specialUrl, comedianName } : {
  specialName: string, specialUrl: string, comedianName: string
}) {
  try {
    const [
      bilibiliEmbedUrl, 
      specialDetail
    ] = await Promise.all(
      [
        getBilibiliVideoEmbedUrl(specialName, comedianName), 
        getSpecialDetail(specialUrl)
      ]
    ) 
    return {
      bilibiliEmbedUrl, 
      specialDetail
    }
  } catch (error) {
    console.log('error getOneSpecialInfo', error)
    return {
      bilibiliEmbedUrl: '', 
      specialDetail: ''
    }
  }
}

export default async function main(imdbURL = 'https://www.imdb.com/name/nm0152638/?ref_=nmls_hd') {
  
  await initBrowser()

  const infos = await startCrawlWithProfile({
    imdbURL,
  })
  fs.writeFile(path.resolve(__dirname, 'settings.json'), JSON.stringify(infos), function(error) {
    if (error) {
      console.log(error)
    }
  })
  await browser.close();
}