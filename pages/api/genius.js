import axios from 'axios';
import * as cheerio from 'cheerio';

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

    // 2. Scrapear las letras de la página CON MEJORES HEADERS
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
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0',
        'Referer': 'https://www.google.com/'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    
    // Buscar contenedores de letras
    let lyricsContainers = $('div[data-lyrics-container="true"]');
    
    if (lyricsContainers.length === 0) {
      lyricsContainers = $('div[class*="Lyrics__Container"]');
    }

    if (lyricsContainers.length === 0) {
      return null;
    }

    let allLyrics = [];
    
    lyricsContainers.each((i, container) => {
      const text = $(container).text();
      allLyrics.push(text);
    });

    let fullLyrics = allLyrics.join('\n');
    fullLyrics = fullLyrics.replace(/\n{3,}/g, '\n\n').trim();

    return fullLyrics;

  } catch (error) {
    console.error('Error scraping Genius:', error.message);
    return null;
  }
}
