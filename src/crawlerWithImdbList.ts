import 'dotenv/config'
import { initBrowser, browser } from './initBrowser';
import MongoClient from './mongo'
import { CarwlerTask } from './types'
import crawlerWithImdbProfile from './crawlerWithImdbProfile'
import { TaskStatus } from './types/index'

const START_URL = 'https://www.imdb.com/list/ls003453197/'

// TODO: specific list to crawl
const FILTER_NAME = [
  `Patrice O'Neal`,
  `Lenny Bruce`,
  `Dick Gregory`,
  `Barry Crimmins`,
  `Steven Wright`,
  `Garry Shandling`,
  `Dennis Miller`,
  `Paul Mooney`,
  `Zach Galifianakis`,
  `Tommy Johnagin`,
  `Paul F. Tompkins`,
  `Jon Dore`,
  `Nick Swardson`,
  `Brian Posehn`,
  `Eddie Pepitone`,
  `Nick Thune`,
  `Dov Davidoff`,
  `Doug Benson`,
  `Ron Funches`,
  `Russell Brand`
]

async function start(){
  await initBrowser();

  const ListPage = await browser.newPage();

  await ListPage.goto(START_URL);

  await ListPage.waitForSelector('.lister-list');

  let comedianList = await ListPage.evaluate(() => {
    const element =  document.querySelectorAll('.lister-item-header a')
    const aElements = Array.from(element)
    let result = aElements.map((a: any) => {
      return {
        name: a.innerText,
        profileLink: a.href,
        imdbID: /https:\/\/www.imdb.com\/name\/(?:(.+))\?.+/.exec(a.href)?.[1]
      }
    })
    return result || []
  })

  comedianList = comedianList
  .filter(s => {
    return !FILTER_NAME.includes(s.name)
  })
  // .splice(0, 10)

  const Database = MongoClient.db("standup-wiki");
  const CrawlerTask = Database.collection("crawlerTask");

  await MongoClient.connect()

  for (const comedian of comedianList) {
    const existComedian = await CrawlerTask.findOne<CarwlerTask>({
      imdbID: comedian.imdbID
    })
    if (existComedian && existComedian.status === 1) {
      console.log(existComedian.name, ' skip!!!')
      continue
    }

    let needGenerateAIContent = TaskStatus.notStarted
    let needCrawlSpecialInfo = TaskStatus.notStarted

    if (existComedian) {
      needGenerateAIContent = existComedian.AIContentStatus
      needCrawlSpecialInfo = existComedian.specialStatus
    }

    console.log('start comedian', comedian.name, comedian.imdbID, comedian.profileLink)

    console.log('existComedian', existComedian)

    let now = Date.now()

    const success = await crawlerWithImdbProfile({
      imdbURL: comedian.profileLink,
      needGenerateAIContent,
      needCrawlSpecialInfo,
      eventSource: 'list'
    })

    console.log((Date.now() - now) / 60 / 1000, ' minutes')

    let whereOption = {
      name: comedian.name,
    }
    if (success) {
      console.log('success')
      // update
      await CrawlerTask.updateOne(whereOption,
      {
        $set: {
          name: comedian.name,
          specialStatus: 1,
          type: 'comedian',
          AIContentStatus: 1,
          imdbID: comedian.imdbID,
          status: 1
        }
      },
      { upsert: true }
      )
    } else {
      console.log('fail')
      await CrawlerTask.updateOne(whereOption,
      {
        $set: {
          name: comedian.name,
          specialStatus: 0,
          AIContentStatus: 0,
          type: 'comedian',
          imdbID: comedian.imdbID,
          status: 99 // fail
        }
      },
      { upsert: true }
      )
      // record message
    }
  }
  await MongoClient.close()
  console.log('list done')
}

start()