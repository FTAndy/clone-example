import 'dotenv/config'
import MongoClient from './mongo'


async function main() {
  const Database = MongoClient.db("standup-wiki");
  const Special = Database.collection("special");

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
  await MongoClient.close()
}

main()