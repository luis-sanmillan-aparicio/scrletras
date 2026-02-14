import { useState } from 'react';

export default function Home() {
  const [artist, setArtist] = useState('');
  const [song, setSong] = useState('');
  const [source, setSource] = useState('ambas');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchLyrics = async () => {
    if (!artist.trim() || !song.trim()) {
      setError('Por favor ingresa el artista y la canción');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);
    
    try {
      const response = await fetch('/api/lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artist, song, source })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        setError(data.error || 'No se encontraron resultados');
      } else {
        setResults(data);
      }
    } catch (err) {
      setError('Error al buscar las letras');
    }
    
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '30px auto', padding: '20px', fontFamily: 'Arial' }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>🎵 Buscador de Letras</h1>
      <p style={{ textAlign: 'center', color: '#666' }}>Genius & Musixmatch</p>
      
      {/* Campos de entrada */}
      <div style={{ marginBottom: '20px', marginTop: '30px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Grupo/Artista:
        </label>
        <input
          type="text"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && searchLyrics()}
          style={{ padding: '12px', width: '100%', fontSize: '16px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Canción:
        </label>
        <input
          type="text"
          value={song}
          onChange={(e) => setSong(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && searchLyrics()}
          style={{ padding: '12px', width: '100%', fontSize: '16px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
      </div>

      {/* Selector de fuente */}
      <div style={{ marginBottom: '25px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Fuente:
        </label>
        <div>
          <label style={{ marginRight: '20px' }}>
            <input
              type="radio"
              value="genius"
              checked={source === 'genius'}
              onChange={(e) => setSource(e.target.value)}
            /> Genius
          </label>
          <label style={{ marginRight: '20px' }}>
            <input
              type="radio"
              value="musixmatch"
              checked={source === 'musixmatch'}
              onChange={(e) => setSource(e.target.value)}
            /> Musixmatch
          </label>
          <label>
            <input
              type="radio"
              value="ambas"
              checked={source === 'ambas'}
              onChange={(e) => setSource(e.target.value)}
            /> Ambas
          </label>
        </div>
      </div>

      {/* Botón buscar */}
      <button 
        onClick={searchLyrics}
        disabled={loading}
        style={{ 
          padding: '12px 40px', 
          fontSize: '16px', 
          backgroundColor: loading ? '#ccc' : '#4CAF50', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          width: '100%',
          fontWeight: 'bold'
        }}
      >
        {loading ? 'Buscando...' : 'Buscar Letras'}
      </button>

      {/* Mensajes de error */}
      {error && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {/* Resultados */}
      {results && (
        <div style={{ marginTop: '30px' }}>
          {/* Genius */}
          {results.genius && (
            <div style={{ marginBottom: '30px' }}>
              <div style={{ borderBottom: '3px solid #333', paddingBottom: '10px', marginBottom: '15px' }}>
                <h2 style={{ margin: 0 }}>GENIUS</h2>
              </div>
              <p><strong>Título:</strong> {results.genius.title}</p>
              <p><strong>Artista:</strong> {results.genius.artist}</p>
              <p><strong>Enlace:</strong> <a href={results.genius.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2196F3' }}>{results.genius.url}</a></p>
              
              {results.genius.found ? (
                <pre style={{ 
                  whiteSpace: 'pre-wrap', 
                  backgroundColor: '#f5f5f5', 
                  padding: '20px', 
                  borderRadius: '4px',
                  fontFamily: 'Arial',
                  lineHeight: '1.6'
                }}>
                  {results.genius.lyrics}
                </pre>
              ) : (
                <p style={{ color: '#666', fontStyle: 'italic' }}>Letras no disponibles</p>
              )}
            </div>
          )}

          {/* Musixmatch */}
          {results.musixmatch && (
            <div>
              <div style={{ borderBottom: '3px solid #333', paddingBottom: '10px', marginBottom: '15px' }}>
                <h2 style={{ margin: 0 }}>MUSIXMATCH</h2>
              </div>
              <p><strong>Título:</strong> {results.musixmatch.title}</p>
              <p><strong>Artista:</strong> {results.musixmatch.artist}</p>
              <p><strong>Enlace:</strong> <a href={results.musixmatch.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2196F3' }}>{results.musixmatch.url}</a></p>
              
              <pre style={{ 
                whiteSpace: 'pre-wrap', 
                backgroundColor: '#f5f5f5', 
                padding: '20px', 
                borderRadius: '4px',
                fontFamily: 'Arial',
                lineHeight: '1.6'
              }}>
                {results.musixmatch.lyrics}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
