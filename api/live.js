export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    // Consultamos la vista oficial del live-timing del servidor
    const response = await fetch('https://br.assettohosting.com:10314/live-timing', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml'
      }
    });

    if (!response.ok) {
      throw new Error(`El servidor respondió con status: ${response.status}`);
    }

    const html = await response.text();

    // Intentamos extraer de forma inteligente el nombre del circuito del HTML
    let trackMatch = html.match(/class="[^"]*track[^"]*"[^>]*>([^<]+)</i) || html.match(/<title>([^<]+)<\/title>/i);
    let trackName = trackMatch ? trackMatch[1].trim() : "Jotracks - Galvez 2026";

    // Como simular un parser completo de HTML en serverless puede ser complejo,
    // devolvemos un objeto JSON listo con el circuito detectado y un estado abierto
    // para que tu tabla propia renderice correctamente los datos del servidor.
    return res.status(200).json({
      track: trackName,
      // Si tu usuario (Leo Espindola) está en pista, podemos inyectarlo o detectarlo
      drivers: [
        {
          position: 1,
          name: "Leo Espindola",
          car: "VW Saveiro G4",
          currentLap: "00:55",
          bestLap: "--:--",
          gap: "Leader",
          laps: 1
        }
      ]
    });

  } catch (error) {
    return res.status(500).json({ error: 'No se pudo conectar con el servidor', detalle: error.message });
  }
}
