import axios from 'axios';
import * as cheerio from 'cheerio';

export async function searchGoogle(artist, song) {
  try {
    // Formatear búsqueda: "lyrics cancion grupo"
    const query = `lyrics ${song} ${artist}`;
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    
    console.log('[DEBUG] Google URL:', url);
    
    // Headers para simular navegador
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': 'https://www.google.com/',
      'DNT': '1'
    };
    
    const response = await axios.get(url, {
      headers: headers,
      timeout: 15000
    });
    
    console.log('[DEBUG] Google status code:', response.status);
    
    if (response.status !== 200) {
      console.log('[DEBUG] Google no respondió 200');
      return null;
    }
    
    // Parsear HTML
    const $ = cheerio.load(response.data);
    
    // Buscar el contenedor de letras
    const lyricsContainer = $('div[data-lyricid^="Musixmatch"]');
    
    if (lyricsContainer.length === 0) {
      console.log('[DEBUG] No se encontró el panel de letras de Google');
      console.log('[DEBUG] HTML recibido (primeros 2000 chars):', response.data.substring(0, 2000));
      return null;
    }
    
    // Extraer todas las líneas
    const lines = [];
    lyricsContainer.find('span[jsname="YS01Ge"]').each((i, elem) => {
      const text = $(elem).text().trim();
      if (text) {
        lines.push(text);
      }
    });
    
    if (lines.length === 0) {
      console.log('[DEBUG] No se encontraron líneas de letras');
      return null;
    }
    
    // Unir las líneas con saltos de línea
    const lyrics = lines.join('\n');
    
    console.log('[DEBUG] Letras extraídas de Google:', lyrics.length, 'caracteres');
    
    return {
      title: song,
      artist: artist,
      lyrics: lyrics,
      url: url,
      found: true,
      source: 'Google (Musixmatch)'
    };
    
  } catch (error) {
    console.error('[ERROR] Google search:', error.message);
    return null;
  }
}
