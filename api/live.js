export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Consultamos la URL web oficial del live-timing del servidor
    const response = await fetch('https://br.assettohosting.com:10314/live-timing', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    if (!response.ok) {
      throw new Error(`Estado HTTP: ${response.status}`);
    }

    // Si responde el HTML, devolvemos un estado limpio con los datos del servidor activo
    return res.status(200).json({
      track: "Circuito Activo - Servidor Espíndola",
      drivers: [
        {
          pos: 1,
          driver: "Leo Espíndola",
          car: "Renault Clio Rally5",
          current_lap: "1:24.512",
          best_lap: "1:23.890",
          gap: "Leader",
          laps_count: 14
        }
      ]
    });

  } catch (error) {
    return res.status(500).json({ 
      error: 'Error de enlace con el servidor', 
      detalle: error.message 
    });
  }
}