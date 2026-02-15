import { searchGenius } from './genius';
import { searchMusixmatch } from './musixmatch';
import { searchGoogle } from './google';

export default async function handler(req, res) {
  // ===== CONFIGURAR CORS =====
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Manejar petición OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Obtener parámetros (POST o GET)
  let artist, song, source;
  if (req.method === 'POST') {
    ({ artist, song, source = 'ambas' } = req.body);
  } else {
    artist = req.query.artist;
    song = req.query.song;
    source = req.query.source || 'ambas';
  }

  if (!artist || !song) {
    return res.status(400).json({ 
      success: false,
      error: 'Se requieren artist y song' 
    });
  }

  const results = {
    genius: null,
    google: null,
    musixmatch: null,
    success: false
  };

  try {
    // Buscar en Genius (DESACTIVADO - Puppeteer no funciona en Vercel)
    if (source === 'genius') {
      try {
        const geniusData = await searchGenius(artist, song);
        if (geniusData) {
          results.genius = geniusData;
          results.success = true;
        }
