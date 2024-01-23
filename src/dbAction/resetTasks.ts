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
      $exists: true,  // Checks if the name field exists
    }
  }, {
    $set: {
      specialInfoStatus: 0,
      // AIContentStatus: 1,
      wikiContentStatus: 0,
      status: 0
    }
  })
  await dbClient.close()
  console.log('done')
}

reset()