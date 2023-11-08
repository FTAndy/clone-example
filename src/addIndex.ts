import 'dotenv/config'
import { CarwlerTask } from './types'
import { initBrowser, browser } from './initBrowser';
import {dbClient, initDB} from './mongo'

async function reset() {
  const Database = dbClient.db("standup-wiki");
  const CrawlerTask = Database.collection("crawlerTask");

  await initDB()

  const cursor = CrawlerTask.find<CarwlerTask>({})

  await dbClient.close()
  console.log('done')
}

reset()