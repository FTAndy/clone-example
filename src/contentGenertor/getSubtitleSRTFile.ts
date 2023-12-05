import 'dotenv/config'
import 'global-agent/bootstrap';
const OpenSubtitles = require('opensubtitles-node-sdk');

export default async function getSubtitleSRTFile(specialName: string, format: string = 'srt') {
  console.log(process.env.OPEN_SUBTITLE, 'process.env.OPEN_SUBTITLE')
  const os = new OpenSubtitles({
    apikey: process.env.OPEN_SUBTITLE,
    headers: {
      'User-Agent': 'family v0.1'
    }
  })

  const passwordRes = await os.login({
    username: process.env.OPEN_SUBTITLE_USERNAME,
    password: process.env.OPEN_SUBTITLE_PASSWORD
  })

  const response = await os.subtitles({
    query: 'Dave Chappelle: Stick and Stones',
  })

  console.log(response.data[0].attributes.files)

  const fileId = response?.data[0]?.attributes?.files[0]?.file_id

  if (fileId) {
    const downloadResponse = await os.download({
      file_id: fileId
    })

    console.log(downloadResponse, 'downloadResponse')
    
  }

}

getSubtitleSRTFile('Dave Chappelle: Stick and Stones')