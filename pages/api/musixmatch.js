import axios from 'axios';
import * as cheerio from 'cheerio';

export async function searchMusixmatch(artist, song) {
  try {
    // Formatear URL (igual que en tu Python)
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
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      'Referer': 'https://www.musixmatch.com/'
    };
    
    const response = await axios.get(url, {
      headers: headers,
      timeout: 15000
    });
    
    console.log('[DEBUG] Status code:', response.status);
    
    if (response.status === 404) {
      console.log('[DEBUG] Página no encontrada (404)');
      return null;
    }
    
    // Extraer el JSON embebido de __NEXT_DATA__ (igual que tu Python)
    const $ = cheerio.load(response.data);
    const nextDataScript = $('#__NEXT_DATA__');
    
    if (nextDataScript.length === 0) {
      console.log('[DEBUG] No se encontró el script __NEXT_DATA__');
      return null;
    }
    
    const jsonData = JSON.parse(nextDataScript.html());
    console.log('[DEBUG] JSON parseado correctamente');
    
    // Navegar por el JSON (igual que tu Python)
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
    
    // Limpiar las letras (igual que tu Python)
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
    return null;
  }
}
