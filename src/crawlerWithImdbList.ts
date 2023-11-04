import 'dotenv/config'
import { initBrowser, browser } from './initBrowser';
import MongoClient from './mongo'
import { ObjectId } from 'mongodb'
import crawlerWithImdbProfile from './crawlerWithImdbProfile'
import { finished } from 'stream';
import { TaskStatus } from './types/index'

const START_URL = 'https://www.imdb.com/list/ls070242523/?sort=list_order,asc&mode=detail&page=1'


type CarwlerTask = {
  _id: ObjectId,
  name: string,
  type: string,
  specialStatus: TaskStatus,
  AIContentStatus: TaskStatus,
  imdbID: string
}

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
  .splice(0, 1)

  const Database = MongoClient.db("standup-wiki");
  const CrawlerTask = Database.collection("crawlerTask");

  await MongoClient.connect()

  for (const comedian of comedianList) {
    const existComedian = await CrawlerTask.findOne<CarwlerTask>({
      imdbID: comedian.imdbID
    })
    let needGenerateAIContent = TaskStatus.notStarted
    let needCrawlSpecialInfo = TaskStatus.notStarted

    if (existComedian) {
      needGenerateAIContent = existComedian.AIContentStatus
      needCrawlSpecialInfo = existComedian.specialStatus
    }

    console.log('start comedian', comedian.name, comedian.imdbID, comedian.profileLink)

    let now = Date.now()

    const success = await crawlerWithImdbProfile({
      imdbURL: comedian.profileLink,
      needGenerateAIContent,
      needCrawlSpecialInfo
    })

    console.log(Date.now() - now)

    await CrawlerTask.updateOne({
      _id: existComedian?._id
    },
    {
      $set: {
        specialStatus: 1,
        needGenerateAIContent: 1
      }
    },
    { upsert: true }
    )


    if (success) {
      // update
    } else {
      // record message
    }
  }
}

start()