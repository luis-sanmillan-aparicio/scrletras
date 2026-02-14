import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

let browser = null;

export async function getBrowser() {
  if (browser) {
    return browser;
  }

  browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });

  return browser;
}

export async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
