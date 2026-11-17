import { useState, useEffect } from 'react';

const API_BASE = "https://br.assettohosting.com:10314/api/v1";
// Fallback directo al token que validamos recién para asegurar que Vercel nunca falle
const TOKEN = import.meta.env.VITE_ASSETTO_API_TOKEN || "ahsm_0a5fdc7e3c9fa77fdba10849c6f9855212f3c4c4d403577";

export default function LiveTiming() {
  const [servidor, setServidor] = useState(null);
  const [jugadores, setJugadores] = useState([]);
  const [errorLog, setErrorLog] = useState("");

  useEffect(() => {
    async function actualizarEnVivo() {
      if (!TOKEN) {
        setErrorLog("Falta el Token VITE_ASSETTO_API_TOKEN en el archivo .env");
        return;
      }
      try {
        const headers = { 
          'Authorization': `Bearer ${TOKEN}`,
          'Accept': 'application/json'
        };
        
        const resServidor = await fetch(`${API_BASE}/server`, { headers });
        if (!resServidor.ok) throw new Error(`Error servidor: ${resServidor.status}`);
        const dataServidor = await resServidor.json();
        setServidor(dataServidor);

        const resJugadores = await fetch(`${API_BASE}/players`, { headers });
        if (!resJugadores.ok) throw new Error(`Error jugadores: ${resJugadores.status}`);
        const dataJugadores = await resJugadores.json();
        if (dataJugadores?.data) setJugadores(dataJugadores.data);
        
        setErrorLog(""); // Limpiar error si conecta bien
      } catch (err) {
        console.error("Falla de conexión con AssettoHosting:", err);
        setErrorLog(err.message);
      }
    }

    actualizarEnVivo();
    const intervalo = setInterval(actualizarEnVivo, 3000);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6 text-white space-y-6">
      <div className="bg-neutral-900 border border-white/10 p-6 rounded-2xl shadow-xl">
        <h2 className="text-xl font-bold text-amber-400 mb-2">DEBUG DE CONEXIÓN ASSETTO HOSTING</h2>
        <p className="text-xs text-neutral-400 mb-4">Token detectado: {TOKEN ? "🟢 SÍ (Activo)" : "🔴 NO"}</p>
        
        {errorLog && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-xl text-xs mb-4">
            <strong>⚠️ DETALLE DEL ERROR:</strong> {errorLog}
          </div>
        )}

        <div className="text-xs space-y-2">
          <p><strong>Estado Servidor:</strong> {servidor ? "🟢 Conectado con éxito" : "🔴 Esperando respuesta..."}</p>
          <p><strong>Nombre del Servidor:</strong> {servidor?.name || '---'}</p>
          <p><strong>Pista:</strong> {servidor?.track?.name || '---'}</p>
          <p><strong>Pilotos en pista:</strong> {jugadores.length}</p>
        </div>
      </div>
    </div>
  );
}