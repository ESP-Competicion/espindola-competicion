export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    // Apuntamos al endpoint que maneja el live-timing en el servidor de AssettoHosting
    const response = await fetch('https://br.assettohosting.com:10314/live-timing', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/html, */*'
      }
    });

    if (!response.ok) {
      throw new Error(`El servidor respondió con status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // Si devuelve HTML, extraemos el texto o pasamos un objeto base
      const text = await response.text();
      data = { htmlContent: text };
    }

    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: 'No se pudo conectar con el servidor', detalle: error.message });
  }
}
