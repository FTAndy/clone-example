import 'dotenv/config'
import { CarwlerTask } from '../types'
import { initBrowser, browser } from '../utils/initBrowser';
import {dbClient, initDB} from '../utils/mongo'

async function reset() {
  const Database = dbClient.db("standup-wiki");
  const CrawlerTask = Database.collection("crawlerTask");

  await initDB()


  await CrawlerTask.updateMany({
    name: {
      $in: [
        'Jeff Dunham'
      ]
    }
  }, {
    $set: {
      specialStatus: 0,
      AIContentStatus: 1,
      status: 0
    }
  })
  await dbClient.close()
  console.log('done')
}

reset()