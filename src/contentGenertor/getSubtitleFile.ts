import 'dotenv/config'
import 'global-agent/bootstrap';
import axios from 'axios'
import { blobServiceClient } from '../utils/azureStorage';
import { maxLimitedAsync } from '../utils/maxLimitedAsync'
import { trimSpecial } from '../utils/utils';
const OpenSubtitles = require('opensubtitles-node-sdk');


let os: any

const CONTAINER_NAME = 'vtt-subtitle';

async function initOS() {
  os = new OpenSubtitles({
    apikey: process.env.OPEN_SUBTITLE,
    headers: {
      // 'User-Agent': 'family v0.1',
      'Content-Type': 'application/json',
      Accept: '*/*',
      'Accept-Encoding': 'gzip, deflate, br',
      'Api-Key': process.env.OPEN_SUBTITLE,
      'X-User-Agent': 'plussub'
    }
  })

  // await os.login({
  //   username: process.env.OPEN_SUBTITLE_USERNAME,
  //   password: process.env.OPEN_SUBTITLE_PASSWORD
  // })
}

export async function getSubtitleVTTFile(specialName: string) {
  if (!os) {
    await initOS()
  }

  const queryName = specialName

  // TODO: change to other subtitle download source
  const response = await os.subtitles({
    // tmdb_id: parseInt(TMDBId),
    query: queryName,
    languages: 'en'
  })
  // console.log(response?.data[0], 'response?.data', specialName)

  const fileId = response?.data[0]?.attributes?.files[0]?.file_id
  
  if (fileId) {
    let downloadResponse
    try {
      downloadResponse = await os.download({
        file_id: fileId
      })      
    } catch (error) {
      console.log(error, 'downloadResponse error')
      return ''
    }


    const link = downloadResponse?.link
    console.log(link, 'link')
    if (link) {
      const response = await axios({
        method: 'get',
        url: link,
      })

      try {
        const vttFileName = trimSpecial(`${specialName}.vtt`)

        const vttContent = await convertSrtToVtt(response.data)

        if (vttContent) {
          const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    
          // create blob client
          const blobClient = containerClient.getBlockBlobClient(vttFileName);
    
          await blobClient.upload(vttContent, vttContent.length)
    
          return `/${CONTAINER_NAME}/${vttFileName}`        
        }
  
      } catch (error) {
        console.log(error)
      }

      return ''


      // await fsPromise.writeFile(vttFile, vttContent, 'utf8')

      // response.data.pipe(fs.createWriteStream(srtFile));
    }
    
  }

}

async function convertSrtToVtt(srtContent: string) {
  const importDynamic = new Function('modulePath', 'return import(modulePath)')
  const subsrt = await importDynamic('subsrt-ts')
  const vtt = subsrt.convert(srtContent, 'vtt')
  return vtt
}
