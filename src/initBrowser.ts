import puppeteer, { Browser } from 'puppeteer';

export let browser: Browser;

export async function initBrowser() {
  if (browser) {
    return browser
  } else {
    browser = await puppeteer.launch({
      product: 'chrome',
      headless: false,
      timeout: 60 * 1000,
      // devtools: true
    });
  }

}
