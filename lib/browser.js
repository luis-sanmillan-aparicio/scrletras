import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

let browser = null;

export async function getBrowser() {
  if (browser && browser.isConnected()) {
    return browser;
  }

  try {
    // Configuración especial para Vercel
    const executablePath = await chromium.executablePath();
    
    console.log('[DEBUG] Chromium path:', executablePath);

    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-sandbox',
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath,
      headless: true,
      ignoreHTTPSErrors: true,
    });

    console.log('[DEBUG] Browser lanzado correctamente');

    return browser;
  } catch (error) {
    console.error('[ERROR] Error lanzando browser:', error.message);
    throw error;
  }
}

export async function closeBrowser() {
  if (browser) {
    try {
      await browser.close();
      browser = null;
    } catch (error) {
      console.error('[ERROR] Error cerrando browser:', error.message);
    }
  }
}
