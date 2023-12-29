import { Browser } from 'puppeteer';
import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'

puppeteer.use(StealthPlugin())

export let browser: Browser;

export async function initBrowser() {
  if (browser) {
    return browser
  } else {
    browser = await puppeteer.launch({
      product: 'chrome',
      headless: true,
      // timeout: 60 * 1000,
      args: ['--start-maximized']
      // devtools: true
    });
  }

}
