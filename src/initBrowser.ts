import puppeteer, { Browser } from 'puppeteer';

export let browser: Browser

export async function initBrowser(){
  browser = await puppeteer.launch({
    product: 'chrome',
    headless: false,
    timeout: 60 * 1000
    // devtools: true
  });
}