import axios from 'axios';
import { getBrowser } from '../../lib/browser';

const GENIUS_TOKEN = "TSXOya8akTDuIGu3KYKC7jThKjh2EpQkfbr8OB712B9IJSxtMM3CD7s6hBvrohp7";
const GENIUS_BASE_URL = "https://api.genius.com";

export async function searchGenius(artist, song) {
  try {
    // 1. Buscar canción en la API de Genius
    const query = `${artist} ${song}`;
    const searchUrl = `${GENIUS_BASE_URL}/search`;
    
    const searchResponse = await axios.get(searchUrl, {
      headers: {
        'Authorization': `Bearer ${GENIUS_TOKEN}`
      },
      params: { q: query },
      timeout: 10000
    });

    const hits = searchResponse.data.response.hits;
    
    if (!hits || hits.length === 0) {
      return null;
    }

    const result = hits[0].result;
    const songUrl = result.url;
    const title = result.title;
    const artistName = result.primary_artist.name;

    console.log('[DEBUG] Genius URL encontrada:', songUrl);

    // 2. Scrapear con Puppeteer (navegador real)
    const lyrics = await scrapeLyricsWithPuppeteer(songUrl);

    return {
      title: title,
      artist: artistName,
      lyrics: lyrics,
      url: songUrl,
      found: lyrics !== null
    };

  } catch (error) {
    console.error('[ERROR] searchGenius:', error.message);
    return null;
  }
}

async function scrapeLyricsWithPuppeteer(url) {
  let browser = null;
  let page = null;

  try {
    console.log('[DEBUG] Iniciando Puppeteer para Genius...');
    
    browser = await getBrowser();
    page = await browser.newPage();

    // Configurar headers realistas
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    });

    console.log('[DEBUG] Navegando a:', url);

    // Navegar a la página
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('[DEBUG] Página cargada, extrayendo letras...');

    // Esperar a que aparezcan las letras
    await page.waitForSelector('div[data-lyrics-container="true"], div[class*="Lyrics__Container"]', {
      timeout: 10000
    });

    // Extraer las letras
    const lyrics = await page.evaluate(() => {
      const containers = document.querySelectorAll('div[data-lyrics-container="true"]');
      
      if (containers.length === 0) {
        const altContainers = document.querySelectorAll('div[class*="Lyrics__Container"]');
        if (altContainers.length === 0) return null;
        
        let text = '';
        altContainers.forEach(container => {
          text += container.innerText + '\n';
        });
        return text.trim();
      }

      let text = '';
      containers.forEach(container => {
        text += container.innerText + '\n';
      });
      
      return text.trim();
    });

    await page.close();

    if (!lyrics) {
      console.log('[DEBUG] No se encontraron letras en la página');
      return null;
    }

    // Limpiar saltos de línea excesivos
    const cleanedLyrics = lyrics.replace(/\n{3,}/g, '\n\n');
    
    console.log('[DEBUG] Letras extraídas con Puppeteer:', cleanedLyrics.length, 'caracteres');

    return cleanedLyrics;

  } catch (error) {
    console.error('[ERROR] Puppeteer scraping:', error.message);
    
    if (page) {
      try {
        await page.close();
      } catch (e) {
        console.error('[ERROR] Error cerrando página:', e.message);
      }
    }
    
    return null;
  }
}
