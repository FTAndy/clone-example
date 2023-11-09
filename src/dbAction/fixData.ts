import 'dotenv/config'
import {dbClient, initDB} from '../utils/mongo'


async function main() {
  const Database = dbClient.db("standup-wiki");
  const Special = Database.collection("special");

  await initDB()

  await Special.updateMany(
    {}, // Filter (empty for all documents)
    [{
      $set: {
        'specialDetail.rating': {
          $convert: {
            input: "$specialDetail.rating",
            to: "double", // Use "decimal" for decimal numbers
            onError: "Error", // What to do if conversion fails
            onNull: 0 // What to do if the field is null
          }
        }
      }
    }]
  );
  await dbClient.close()
}

main()