import { searchGenius } from './genius';
import { searchMusixmatch } from './musixmatch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { artist, song, source = 'ambas' } = req.body;

  if (!artist || !song) {
    return res.status(400).json({ 
      success: false,
      error: 'Se requieren artist y song' 
    });
  }

  const results = {
    genius: null,
    musixmatch: null,
    success: false
  };

  try {
    // Buscar en Genius
    if (source === 'genius' || source === 'ambas') {
      try {
        const geniusData = await searchGenius(artist, song);
        if (geniusData) {
          results.genius = geniusData;
          results.success = true;
        }
      } catch (error) {
        console.error('Error Genius:', error.message);
      }
    }

    // Buscar en Musixmatch
    if (source === 'musixmatch' || source === 'ambas') {
      try {
        const musixData = await searchMusixmatch(artist, song);
        if (musixData) {
          results.musixmatch = musixData;
          results.success = true;
        }
      } catch (error) {
        console.error('Error Musixmatch:', error.message);
      }
    }

    if (!results.success) {
      return res.status(404).json({
        success: false,
        error: 'No se encontraron resultados en ninguna fuente'
      });
    }

    return res.status(200).json(results);

  } catch (error) {
    console.error('Error general:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Error al procesar la búsqueda' 
    });
  }
}
