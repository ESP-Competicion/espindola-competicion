export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Intentamos consultar primero la API de S-Tracker usando HTTPS (como la URL de live-timing)
    const response = await fetch('https://br.assettohosting.com:10314/api/v1/live', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      // Si la ruta anterior no responde, probamos el endpoint general de la API v1
      const altResponse = await fetch('https://br.assettohosting.com:10314/api/v1/', {
        headers: { 'Accept': 'application/json' }
      });
      
      if (!altResponse.ok) {
        throw new Error(`El servidor respondió con estado ${response.status}`);
      }
      const altData = await altResponse.json();
      return res.status(200).json(altData);
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ 
      error: 'No se pudo conectar con la API', 
      detalle: error.message 
    });
  }
}