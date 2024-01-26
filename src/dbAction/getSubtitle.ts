import 'dotenv/config'
import { CarwlerTask } from '../types'
import { initBrowser, browser } from '../utils/initBrowser';
import {dbClient, initDB} from '../utils/mongo'
import crawlerWithList from '../crawler/crawlerWithList'


async function reset() {
  const Database = dbClient.db("standup-wiki");
  const CrawlerTask = Database.collection("crawlerTask");

  console.log('init')

  await initDB()

  console.log('query')

  const needToGetTasks = await CrawlerTask.find({
    status: 0,
    specialInfoStatus: 0,
  }).toArray()

  console.log(needToGetTasks, 'needToGetTasks')

  await crawlerWithList(needToGetTasks.map(t => t.name))

  // await CrawlerTask.updateMany({
  //   name: {
  //     $in: [
  //       'Louis C.K.',
  //     ]
  //   }
  // }, {
  //   $set: {
  //     specialInfoStatus: 0,
  //     AIContentStatus: 1,
  //     wikiContentStatus: 1,
  //     status: 0
  //   }
  // })
  await dbClient.close()
  console.log('done')
}


reset()