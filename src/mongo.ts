import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || '';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

const client = new MongoClient(uri, {});

client.connect()

export default client
