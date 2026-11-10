export default async function handler(req, res) {
  try {
    const response = await fetch('http://br.assettohosting.com:10314/api/v1/live');
    const data = await response.json();
    
    // Permitir acceso desde tu web
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'No se pudo conectar con el servidor de Assetto' });
  }
}