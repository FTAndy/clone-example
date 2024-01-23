import 'dotenv/config'
import { MovieDb } from 'moviedb-promise';
import logger from '../utils/logger'
const retry = require('async-retry');

import { makeProviders, makeStandardFetcher, targets } from '@movie-web/providers';
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

async function tryGetTMDBMovieInfo(query: string) {
  const res = await moviedb
  .searchMovie({ query })

  if (!res) {
    throw new Error(`No result found for ${query}`)
  }

  const item = res.results?.length && res.results[0]
  if (item && item.id) {
    // TODO: get vtt subtitle and upload to Azure
    return {
      type: 'movie',
      title: item.original_title || query,
      releaseYear: parseInt(item?.release_date?.split('-')[0] || '1') || 2023,
      tmdbId: String(item.id)
    } as const
  }
  return null
}

export async function getTMDBMovieInfo(specialName: string) {
  try {
    const media = await retry(async () => {
      return tryGetTMDBMovieInfo(specialName)
    }, {
      retries: 3
    })
    return media
  } catch (error) {
    logger.error(error)
    return
  }
}

// export async function getNoCORSVideo(specialName: string) {
//   try {
//     const media = await retry(async () => {
//       return getTMDBMovieInfo(specialName)
//     }, {
//       retries: 3
//     })
//     if (media) {
//       const output = await providers.runAll({
//         media,
//         // sourceOrder: ['flixhq']
//       })
  
//       if (!output) console.log("No stream found", specialName)
//       return output?.stream
//     }  
//     return    
//   } catch (error) {
//     logger.error(error)
//     return
//   }
// }
