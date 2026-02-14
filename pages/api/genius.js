import axios from 'axios';
import * as cheerio from 'cheerio';

const GENIUS_TOKEN = "TSXOya8akTDuIGu3KYKC7jThKjh2EpQkfbr8OB712B9IJSxtMM3CD7s6hBvrohp7";
const GENIUS_BASE_URL = "https://api.genius.com";

// Función para esperar (delay)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

    // Pequeño delay antes de scrapear
    await sleep(500);

    // 2. Scrapear las letras con estrategia stealth
    const lyrics = await scrapeLyricsFromGenius(songUrl);

    return {
      title: title,
      artist: artistName,
      lyrics: lyrics,
      url: songUrl,
      found: lyrics !== null
    };

  } catch (error) {
    console.error('Error en searchGenius:', error.message);
    return null;
  }
}

async function scrapeLyricsFromGenius(url) {
  try {
    // Headers ultra-realistas simulando Chrome 120
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'cross-site',
      'Sec-Fetch-User': '?1',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Cache-Control': 'max-age=0',
      'Referer': 'https://www.google.com/',
      'DNT': '1',
      'TE': 'trailers'
    };

    console.log('[DEBUG] Intentando scrapear Genius:', url);

    const response = await axios.get(url, {
      headers: headers,
      timeout: 20000,
      maxRedirects: 5,
      validateStatus: function (status) {
        return status < 500; // Aceptar cualquier status < 500
      }
    });

    console.log('[DEBUG] Genius status code:', response.status);

    if (response.status === 403) {
      console.log('[ERROR] Genius bloqueó la petición (403 Forbidden)');
      return null;
    }

    if (response.status === 404) {
      console.log('[ERROR] Página no encontrada (404)');
      return null;
    }

    if (response.status !== 200) {
      console.log('[ERROR] Status inesperado:', response.status);
      return null;
    }

    const $ = cheerio.load(response.data);
    
    // Buscar contenedores de letras
    let lyricsContainers = $('div[data-lyrics-container="true"]');
    
    if (lyricsContainers.length === 0) {
      lyricsContainers = $('div[class*="Lyrics__Container"]');
    }

    if (lyricsContainers.length === 0) {
      lyricsContainers = $('div[class*="lyrics"]');
    }

    if (lyricsContainers.length === 0) {
      console.log('[DEBUG] No se encontraron contenedores de letras');
      console.log('[DEBUG] HTML snippet:', response.data.substring(0, 500));
      return null;
    }

    let allLyrics = [];
    
    lyricsContainers.each((i, container) => {
      const text = $(container).text();
      allLyrics.push(text);
    });

    let fullLyrics = allLyrics.join('\n');
    fullLyrics = fullLyrics.replace(/\n{3,}/g, '\n\n').trim();

    console.log('[DEBUG] Letras extraídas de Genius:', fullLyrics.length, 'caracteres');

    return fullLyrics;

  } catch (error) {
    if (error.response) {
      console.error('[ERROR] Genius scraping - Status:', error.response.status);
    } else {
      console.error('[ERROR] Genius scraping:', error.message);
    }
    return null;
  }
}
