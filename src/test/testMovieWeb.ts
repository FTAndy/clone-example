import 'dotenv/config'
import { MovieDb } from 'moviedb-promise';

import { makeProviders, makeStandardFetcher, targets } from '@movie-web/providers';
const retry = require('async-retry');

// this is how the library will make http requests
const myFetcher = makeStandardFetcher(fetch);
// make an instance of the providers library
const providers = makeProviders({
  fetcher: myFetcher,
  // will be played on a native video player
  target: targets.BROWSER
})

const moviedb = new MovieDb(process.env.MOVIE_DB_KEY || '')

// const media = {
//   type: 'movie',
//   title: 'Dave Chappelle: The Closer',
//   tmdbId: '879540',
//   releaseYear: 2021
// } as const

async function getTMDBMovieInfo(query: string) {
  const res = await moviedb
  .searchMovie({ 
    query,
  })

  if (!res) {
    console.log(typeof res, res)
  }

  const item = res.results?.length && res.results[0]
  if (item && item.id) {
    return {
      type: 'movie',
      title: item.original_title || query,
      releaseYear: parseInt(item?.release_date?.split('-')[0] || '1') || 2023,
      tmdbId: String(item.id)
    } as const
  }
  return null
}

async function main() {
  const media = await retry(async () => {
    return getTMDBMovieInfo(`Dave Chappelle Dave Chappelle: What's in a Name?`)
  }, {
    retries: 3,
  })
  // ('Dave Chappelle: The Closer')
  if (media) {
    const output = await providers.runAll({
      media,
      // sourceOrder: ['flixhq']
    })

    if (!output) console.log("No stream found")
    console.log(`stream url: ${JSON.stringify(output?.stream)}`)
    console.log(output?.sourceId, 'sourceId')
  }
}

main()
