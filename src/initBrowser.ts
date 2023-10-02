import puppeteer, { Browser } from 'puppeteer';

export let browser: Browser

export async function initBrowser(){
  browser = await puppeteer.launch({
    product: 'chrome',
    headless: false,
    // devtools: true
  });
}