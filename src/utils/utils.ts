import { Page } from 'puppeteer';

export function getRandom(toTime = 5) {
  return Math.floor(Math.random() * toTime) + 1;
}

export async function exists(page: Page, elementName: string) {
  return page.evaluate((name) => {
    console.log('name', name);
    return document.querySelector(name)?.innerHTML;
  }, elementName);
}

export function sleep(time: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(null);
    }, time);
  });
}

export function getTheHighestResolutionImg(imgURLs: Array<string>) {
  if ((imgURLs as Array<string>)?.length > 0) {
    const urlString = imgURLs[imgURLs.length - 1];
    const highResolutionUrl = /(.+) (?:.+w)/.exec(urlString);
    return highResolutionUrl?.[1] || '';
  }
  return '';
}

export function trimSpecial(string: string) {
  return string.replaceAll(' ', '').replaceAll('?', '').replaceAll("'", '')
}

export function retryRace({
  realEvent,
  retryEvent,
  retryTime = 3
}: {
  realEvent: () => Promise<any>,
  retryEvent: () => Promise<'retry'>,
  retryTime?: number
}) {
  return new Promise(async (resolve) => {
    const times = new Array(retryTime)

    for await (const _ of times) {
      const retryOrResult = await Promise.race([realEvent(), retryEvent()])
      if (retryOrResult === 'retry') {
        continue
      } else {
        resolve(true)
        return
      }
    }
    resolve(false)
  })
}