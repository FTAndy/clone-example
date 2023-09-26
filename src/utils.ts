import { Page } from 'puppeteer';

export function getRandom1to5 () {
  return Math.floor(Math.random() * 100 / 20) + 1
}

export async function exists(page: Page, elementName: string) {
  return page.evaluate(() => {
    return document.querySelector(elementName)
  })
}