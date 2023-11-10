import 'dotenv/config'
import {dbClient, initDB} from '../utils/mongo'
import type { Document } from 'mongodb'
import { spec } from 'node:test/reporters';
import {getBilibiliVideoInfo} from '../contentGenertor/getBilibiliVideoInfo'
import { initBrowser } from '../utils/initBrowser'
import {maxLimitedAsync} from '../utils/maxLimitedAsync'

async function main() {

  const Database = dbClient.db("standup-wiki");
  const Special = Database.collection("special");

  await initDB()

  const pipeline: Array<Document> = [
    {
      $match: {
        bilibiliInfo: {}
      }
    },
    {
      $lookup: {
        from: "comedian", // The related collection you want to join with
        localField: "comedian_id", // The field from collection A that holds the reference
        foreignField: "_id", // The field from collection B that is referenced (usually the _id field)
        as: "comedian" // The name of the new array field to hold the joined documents
      }
    },
    {
      $addFields: {
        comedianName: "$comedian.name" 
      }
    },
    // {
    //   $limit: 1
    // }
  ]

  const wrongSpecials = await Special.aggregate(pipeline).toArray()

  await initBrowser()

  function createTask(specialName: string, comedianName: string) {
    return async () => {
      const bilibiliInfo = await getBilibiliVideoInfo(specialName, comedianName)
      await Special.updateOne({
        specialName: specialName
      }, {
        $set: {
          bilibiliInfo
        }
      })
      console.log(comedianName, specialName, 'done')
    }
  }

  await maxLimitedAsync({
    max: 5,
    tasks: wrongSpecials.map(special => {
      const comedianName = special.comedianName[0]
      const specialName = special.specialName
      return createTask(specialName, comedianName)
    })
  })

  // console.log(wrongSpecials, 'wrongSpecials')
  console.log('list done')

  await dbClient.close()
}

main()