import { maxLimitedAsync } from '../utils/maxLimitedAsync'
import { getSubtitleVTTFile } from '../contentGenertor/getSubtitleFile'

async function getSubtitleVTTFileFromList (list: Array<string>, comedianName: string) {
  const result = await maxLimitedAsync({
    max: 3,
    tasks: list.map(specialName => {
      return () => getSubtitleVTTFile(specialName)
    })
  })
  // console.log(result, 'result')
}


getSubtitleVTTFileFromList(
  [
    // "Epilogue: The Punchline",
    // "Dave Chappelle: What's in a Name?",
    "Dave Chappelle: The Closer",
    // "Dave Chappelle: The Bird Revelation",
    // "The Age of Spin: Dave Chappelle Live at the Hollywood Palladium",
    // "Dave Chappelle: Sticks & Stones",
    // "Deep in the Heart of Texas",
    // "Dave Chappelle: Equanimity",
    // "Dave Chappelle: For What It's Worth",
    // "Dave Chappelle Unforgiven",
    // "Dave Chappelle: 8:46",
    // "Dave Chappelle: Killin' Them Softly"
  ],
  'Dave Chappelle'
)