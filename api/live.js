export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // S-Tracker expone los datos en vivo habitualmente mediante el endpoint de JSON del plugin o la raiz de estáticos
    const response = await fetch('http://br.assettohosting.com:10314/get', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      // Si la ruta /get da error, probamos la ruta estándar de s-tracker de JSON en vivo
      const altResponse = await fetch('http://br.assettohosting.com:10314/стрелка/live' , {
        headers: { 'Accept': 'application/json' }
      });
      
      if (!altResponse.ok) {
        throw new Error(`El servidor externo respondió con estado ${response.status}`);
      }
      const altData = await altResponse.json();
      return res.status(200).json(altData);
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    // Si la API externa requiere la estructura interna de S-Tracker, 
    // consultamos el exportador de JSON nativo del tracker:
    try {
      const trackerRes = await fetch('http://br.assettohosting.com:10314/s-tracker/json/livestats.json');
      if (trackerRes.ok) {
        const trackerData = await trackerRes.json();
        return res.status(200).json(trackerData);
      }
    } catch (e) {
      // Ignoramos y pasamos al error principal
    }

    return res.status(500).json({ 
      error: 'No se pudo conectar con la API', 
      detalle: error.message 
    });
  }
}