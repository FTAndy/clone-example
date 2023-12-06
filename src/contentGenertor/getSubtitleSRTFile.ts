import 'dotenv/config'
import 'global-agent/bootstrap';
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { maxLimitedAsync } from '../utils/maxLimitedAsync'
const OpenSubtitles = require('opensubtitles-node-sdk');


let os: any

async function initOS() {
  os = new OpenSubtitles({
    apikey: process.env.OPEN_SUBTITLE,
    headers: {
      'User-Agent': 'family v0.1'
    }
  })

  await os.login({
    username: process.env.OPEN_SUBTITLE_USERNAME,
    password: process.env.OPEN_SUBTITLE_PASSWORD
  })
}

export default async function getSubtitleSRTFile(specialName: string, comedianName: string, format: string = 'srt') {
  if (!os) {
    await initOS()
  }

  const queryName = specialName

  const response = await os.subtitles({
    query: queryName
  })

  console.log(response, 'response', queryName)

  console.log(response?.data[0]?.attributes?.files)

  const fileId = response?.data[0]?.attributes?.files[0]?.file_id

  if (fileId) {
    const downloadResponse = await os.download({
      file_id: fileId
    })

    const link = downloadResponse?.link
    if (link) {
      const response = await axios({
        method: 'get',
        url: link,
        responseType: 'stream'
      })
      const srtFile = path.resolve(
        __dirname,
        '../../',
        'temp',
        // trimSpecial(`${comedianName}-${specialName}-${subtitle.lan}.srt`),
        specialName + '.srt'
      );

      response.data.pipe(fs.createWriteStream(srtFile));
    }
    
  }

}

async function main () {
  const specialList = [
    "Epilogue: The Punchline",
    "Dave Chappelle: What's in a Name?",
    "Dave Chappelle: The Closer",
    "Dave Chappelle: The Bird Revelation",
    "The Age of Spin: Dave Chappelle Live at the Hollywood Palladium",
    "Dave Chappelle: Sticks & Stones",
    "Deep in the Heart of Texas",
    "Dave Chappelle: Equanimity",
    "Dave Chappelle: For What It's Worth",
    "Dave Chappelle Unforgiven",
    "Dave Chappelle: 8:46",
    "Dave Chappelle: Killin' Them Softly"
  ]

  await maxLimitedAsync({
    max: 3,
    tasks: specialList.map(specialName => {
      return () => getSubtitleSRTFile(specialName, 'Dave Chapplle')
    })
  })
}

main()