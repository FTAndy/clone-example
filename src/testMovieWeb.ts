import { makeProviders, makeStandardFetcher, targets } from '@movie-web/providers';
// this is how the library will make http requests
const myFetcher = makeStandardFetcher(fetch);
// make an instance of the providers library
const providers = makeProviders({
  fetcher: myFetcher,
  // will be played on a native video player
  target: targets.BROWSER
})

const media = {
  type: 'movie',
  title: 'Dave Chappelle: The Closer',
  tmdbId: '879540',
  releaseYear: 2021
  // type: 'movie',
  // title: "Hamilton",
  // releaseYear: 2020,
  // tmdbId: "556574"
} as const

async function main() {
  const output = await providers.runAll({
    media,
    sourceOrder: ['flixhq']
  })

  if (!output) console.log("No stream found")
  console.log(`stream url: ${JSON.stringify(output?.stream)}`)
}

main()
