import 'dotenv/config'
import { CarwlerTask } from './types'
import { initBrowser, browser } from './initBrowser';
import MongoClient from './mongo'

async function reset() {
  const Database = MongoClient.db("standup-wiki");
  const CrawlerTask = Database.collection("crawlerTask");

  await MongoClient.connect()

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
  await MongoClient.close()
  console.log('done')
}

reset()