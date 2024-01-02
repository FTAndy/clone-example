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
    wikiContentStatus: 0,
  }).toArray()

  console.log(needToGetTasks, 'needToGetTasks')

  await crawlerWithList(needToGetTasks.map(t => t.name))
  await dbClient.close()
  console.log('done')
}


reset()