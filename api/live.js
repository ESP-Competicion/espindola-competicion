export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    // Apuntamos al endpoint de datos JSON de Stracker / Live-timing del servidor
    const response = await fetch('https://br.assettohosting.com:10314/live-timing/json', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      // Si esa ruta no existe, probamos con la alternativa común de la API de Stracker
      const altResponse = await fetch('https://br.assettohosting.com:10314/api/live', {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
      });
      
      if (!altResponse.ok) {
        throw new Error(`Error al conectar con el live timing: ${response.status}`);
      }
      
      const altData = await altResponse.json();
      return res.status(200).json(altData);
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: 'No se pudo obtener la data del servidor', detalle: error.message });
  }
}
