import axios from 'axios';
import * as cheerio from 'cheerio';

export async function searchMusixmatch(artist, song) {
  try {
    // TRIM para eliminar espacios al inicio y final
    artist = artist.trim();
    song = song.trim();
    
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
    
    console.log('[DEBUG] Artist:', artist);
    console.log('[DEBUG] Song:', song);
    console.log('[DEBUG] URL Musixmatch:', url);
    
    // HEADERS MEJORADOS
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
      maxRedirects: 5,
      validateStatus: function (status) {
        return status < 500; // Aceptar redirects
      }
    });
    
    console.log('[DEBUG] Status code:', response.status);
    
    if (response.status === 404) {
      console.log('[DEBUG] Página no encontrada (404) - Puede que el formato de URL no sea exacto');
      return {
        title: song,
        artist: artist,
        lyrics: null,
        url: url,
        found: false,
        error: 'No encontrado - verifica la ortografía o busca manualmente'
      };
    }
    
    // Extraer el JSON embebido de __NEXT_DATA__
    const $ = cheerio.load(response.data);
    const nextDataScript = $('#__NEXT_DATA__');
    
    if (nextDataScript.length === 0) {
      console.log('[DEBUG] No se encontró el script __NEXT_DATA__');
      return {
        title: song,
        artist: artist,
        lyrics: null,
        url: url,
        found: false,
        error: 'No se pudo extraer la información'
      };
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
      
      // Intentar obtener al menos el título real de la canción si existe
      const trackData = jsonData
        ?.props
        ?.pageProps
        ?.data
        ?.trackInfo
        ?.data
        ?.track || {};
      
      return {
        title: trackData.name || song,
        artist: trackData.artistName || artist,
        lyrics: null,
        url: url,
        found: false,
        error: 'Canción encontrada pero sin letras disponibles'
      };
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
    return {
      title: song,
      artist: artist,
      lyrics: null,
      url: `https://www.musixmatch.com/search/${encodeURIComponent(song + ' ' + artist)}`,
      found: false,
      error: 'Error en la búsqueda'
    };
  }
}
