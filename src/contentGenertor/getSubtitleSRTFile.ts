import 'dotenv/config'
import 'global-agent/bootstrap';
const OpenSubtitles = require('opensubtitles.com');

export default async function getSubtitleSRTFile(specialName: string, format: string = 'srt') {
  console.log(process.env.OPEN_SUBTITLE, 'process.env.OPEN_SUBTITLE')
  const os = new OpenSubtitles({
    apikey: process.env.OPEN_SUBTITLE
  })

  const response = await os.subtitles({
    query: 'Dave Chappelle: Stick and Stones',
  })

  console.log(response.data[0])
}

getSubtitleSRTFile('Dave Chappelle: Stick and Stones')