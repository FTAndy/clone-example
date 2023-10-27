import { Page } from 'puppeteer';

export function getRandom (toTime = 5) {
  return Math.floor(Math.random() * toTime) + 1
}

export async function exists(page: Page, elementName: string) {
  return page.evaluate((name) => {
    console.log('name', name)
    return document.querySelector(name)?.innerHTML
  }, elementName)
}

export function sleep(time: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(null)
    }, time)
  })
}

export function getTheHighestResolutionImg(imgURLs: Array<string>) {
  if ((imgURLs as Array<string>)?.length > 0) {
    const urlString = imgURLs[imgURLs.length - 1]
    const highResolutionUrl = /(.+) (?:.+w)/.exec(urlString)
    return highResolutionUrl?.[1] || ''
  }
  return ''
}