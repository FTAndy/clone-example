import 'dotenv/config'
import { CarwlerTask } from '../types'
import { initBrowser, browser } from '../utils/initBrowser';
import {dbClient, initDB} from '../utils/mongo'

async function reset() {
  const Database = dbClient.db("standup-wiki");
  const CrawlerTask = Database.collection("crawlerTask");

  await initDB()

  const cursor = CrawlerTask.find<CarwlerTask>({})

  for await (const task of cursor) {
    await CrawlerTask.updateOne({
      _id: task._id
    }, {
      $set: {
        specialStatus: 0,
        AIContentStatus: 0,
        status: 0
      }
    })
  }
  await dbClient.close()
  console.log('done')
}

reset()