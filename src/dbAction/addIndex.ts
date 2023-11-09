import 'dotenv/config'
import { CarwlerTask } from '../types'
import { initBrowser, browser } from '../utils/initBrowser';
import {dbClient, initDB} from '../utils/mongo'

async function reset() {
  const Database = dbClient.db("standup-wiki");
  const Comedian = Database.collection("comedian");
  const Special = Database.collection('special')

  await initDB()

  await Comedian.createIndex({ name: "text" })
  await Special.createIndex({ name: 'text'})

  // const cursor = CrawlerTask.find<CarwlerTask>({})

  await dbClient.close()
  console.log('done')
}

reset()