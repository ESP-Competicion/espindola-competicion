export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const response = await fetch('http://br.assettohosting.com:10314/api/v1/live', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*'
      }
    });

    // Leemos la respuesta como texto para ver qué dice exactamente el servidor
    const textData = await response.text();

    return res.status(200).json({
      statusRecibido: response.status,
      respuestaCruda: textData
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
