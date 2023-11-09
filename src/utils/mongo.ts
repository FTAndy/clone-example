import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || '';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

const client = new MongoClient(uri, {});

client.connect()

let isConnected = false

client.on('connect', () => {
  isConnected = true
})

export const dbClient = client
export const initDB = async () => {
  if (!isConnected) {
    await client.connect()
  }
}