import axios from 'axios';
import * as cheerio from 'cheerio';

export async function searchMusixmatch(artist, song) {
  try {
    // Formatear URL
    const artistFormatted = artist
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '');
    
    const songFormatted = song
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '');
    
    const url = `https://www.musixmatch.com/lyrics/${artistFormatted}/${songFormatted}`;
    
    console.log('[DEBUG] URL Musixmatch:', url);
    
    // HEADERS MEJORADOS para simular navegador real
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0',
      'Referer': 'https://www.google.com/',
      'DNT': '1'
    };
    
    const response = await axios.get(url, {
      headers: headers,
      timeout: 15000,
      maxRedirects: 5
    });
    
    console.log('[DEBUG] Status code:', response.status);
    
    if (response.status === 404) {
      console.log('[DEBUG] Página no encontrada (404)');
      return null;
    }
    
    // Extraer el JSON embebido de __NEXT_DATA__
    const $ = cheerio.load(response.data);
    const nextDataScript = $('#__NEXT_DATA__');
    
    if (nextDataScript.length === 0) {
      console.log('[DEBUG] No se encontró el script __NEXT_DATA__');
      console.log('[DEBUG] HTML recibido (primeros 500 chars):', response.data.substring(0, 500));
      return null;
    }
    
    const jsonData = JSON.parse(nextDataScript.html());
    console.log('[DEBUG] JSON parseado correctamente');
    
    // Navegar por el JSON
    const lyricsBody = jsonData
      ?.props
      ?.pageProps
      ?.data
      ?.trackInfo
      ?.data
      ?.lyrics
      ?.body;
    
    if (!lyricsBody) {
      console.log('[DEBUG] No se encontró lyrics.body en el JSON');
      return null;
    }
    
    console.log('[DEBUG] Letras extraídas:', lyricsBody.length, 'caracteres');
    
    // Obtener título y artista
    const trackData = jsonData
      ?.props
      ?.pageProps
      ?.data
      ?.trackInfo
      ?.data
      ?.track || {};
    
    const title = trackData.name || song;
    const artistName = trackData.artistName || artist;
    
    console.log('[DEBUG] Título:', title, 'Artista:', artistName);
    
    // Limpiar las letras
    const lyrics = lyricsBody.replace(/\n{3,}/g, '\n\n').trim();
    
    return {
      title: title,
      artist: artistName,
      lyrics: lyrics,
      url: url,
      found: true
    };
    
  } catch (error) {
    console.error('[ERROR] Musixmatch:', error.message);
    if (error.response) {
      console.error('[ERROR] Status code:', error.response.status);
    }
    return null;
  }
}
