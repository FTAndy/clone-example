import { browser } from './initBrowser';
import bilibiliCookie from './bilibiliCookie.json';
import { generateSrtSubtitle } from './generateSrtSubtitle';
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob'
import fs from 'fs/promises';
import srtToAss from 'srt-to-ass';
import path from 'path';
import { getRandom, sleep, exists, trimSpecial, retryRace } from './utils';

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
if (!accountName) throw Error('Azure Storage accountName not found');
if (!accountKey) throw Error('Azure Storage accountKey not found');

const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  sharedKeyCredential
);

const containerName = 'subtitle2';



export async function getBilibiliVideoInfo(
  specialName: string,
  comedianName: string,
) {
  const bilibiliPage = await browser.newPage();

  bilibiliPage.setCookie(...bilibiliCookie);
  try {

    await bilibiliPage.goto('https://search.bilibili.com/', {
      timeout: 60 * 1000,
    });

    // await bilibiliPage.waitForTimeout(getRandom(10) * 1000)

    await bilibiliPage.waitForSelector('.search-input-el');

    await bilibiliPage.type('.search-input-el', `${specialName} ${comedianName}`);

    await bilibiliPage.evaluate(() => {
      const button = document.querySelector('.search-button');
      button && (button as HTMLAnchorElement).click();
    });

    await retryRace({
      realEvent: () => {
        return bilibiliPage.waitForSelector('.video-list div a[href]')
      },
      retryEvent: () => {
       return  new Promise((r) => {
          setTimeout(async () => {
            try {
              if (bilibiliPage && !bilibiliPage.isClosed()) {
                const errorExist = await exists(bilibiliPage, '.search-neterror-container');
                if (errorExist) {
                  await bilibiliPage.click('.search-button');
                }
              }        
            } catch (error) {
              // console.log(error, 'error')
            }
            r('retry')
          }, 2000)
        })
      }
    })

    const videoUrl = await bilibiliPage.evaluate(() => {
      const element = document.querySelector('.video-list div a[href]');
      return (element as HTMLAnchorElement)?.href;
    });

    if (videoUrl) {
      await bilibiliPage.goto(videoUrl, {
        timeout: 60 * 1000,
      });

      await bilibiliPage.waitForSelector('#share-btn-iframe');

      const videoInfo = await bilibiliPage.evaluate(async () => {
        const state = window.__INITIAL_STATE__;
        const { cidMap } = state;
        const keys = Object.keys(cidMap);
        const key = keys[0];
        const vInfo = cidMap[key];
        const { aid, bvid } = vInfo;
        const cid = key;
        let subtitles: Array<{
          // "en-US"
          lan: string;
          // "英语（美国）"
          lan_doc: string;
          subtitle_url: string;
          subtitleASSURL: string
        }> = [];

        // copy from https://github.com/IndieKKY/bilibili-subtitle/blob/eaf465a6a94872682fdb08f27404b16749aab7e2/src/chrome/content-script.cjs
        const pages = await fetch(
          `https://api.bilibili.com/x/player/pagelist?aid=${aid}`,
          { credentials: 'include' },
        )
          .then((res) => res.json())
          .then((res) => res.data);

        const subtitleCid = pages[0].cid;

        await fetch(
          `https://api.bilibili.com/x/player/v2?aid=${aid}&cid=${subtitleCid}`,
          { credentials: 'include' },
        )
          .then((res) => res.json())
          .then((res) => {
            subtitles = res.data.subtitle.subtitles;
          });

        return {
          subtitles,
          cid,
          aid,
          bvid,
        };
      });

      const { aid, bvid, cid, subtitles } = videoInfo;

      if (subtitles?.length) {
        for (const subtitle of subtitles) {
          const subtitleJSONData = await fetch(
            `https://${subtitle.subtitle_url}`,
          ).then((res) => res.json());
          const srtFormat = generateSrtSubtitle(subtitleJSONData);
          const srtFile = path.resolve(
            __dirname,
            '..',
            'temp',
            `${comedianName}-${specialName}-${subtitle.lan}.srt`,
          );
          const assFileName = trimSpecial(`${comedianName}-${specialName}-${subtitle.lan}.ass`)

          const assFile = path.resolve(
            __dirname,
            '..',
            'temp',
            assFileName
          );
          await fs.writeFile(srtFile, srtFormat);
          await new Promise((r) => {
            srtToAss.convert(srtFile, assFile, {}, (error: any) => {
              r(null)
            });                  
          })
          // create container client
          const containerClient = blobServiceClient.getContainerClient(containerName);

          // create blob client
          const blobClient = containerClient.getBlockBlobClient(assFileName);

          // upload file
          await blobClient.uploadFile(assFile);
          
          subtitle.subtitleASSURL = `https://andycdn-fndbfaewgxbve2ha.z01.azurefd.net/subtitle2/${assFileName}`
        }
      }

      const iframeUrl = `//player.bilibili.com/player.html?aid=${aid}&bvid=${bvid}&cid=${cid}&high_quality=1&autoplay=false`;

      await bilibiliPage.close()

      return {
        iframeUrl,
        subtitles,
        cid,
        aid,
        bvid,
      };
    }    
  } catch (error) {
    console.log(error, 'bilibili error')
    await bilibiliPage.close()
    return null
  }
}
