import { useState, useEffect } from 'react';

const API_BASE = "https://br.assettohosting.com:10314/api/v1";
const TOKEN = import.meta.env.VITE_ASSETTO_API_TOKEN || "ahsm_0a5fdc7e3c9fa77fdba10849c6f9855212f3c4c4d403577";

export default function LiveTiming() {
  const [servidor, setServidor] = useState(null);
  const [jugadores, setJugadores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorLog, setErrorLog] = useState("");

  useEffect(() => {
    async function actualizarDatos() {
      try {
        const headers = { 
          'Authorization': `Bearer ${TOKEN}`,
          'Accept': 'application/json'
        };
        
        // 1. Obtener estado del servidor
        const resServidor = await fetch(`${API_BASE}/server`, { headers });
        if (!resServidor.ok) throw new Error(`Error servidor: ${resServidor.status}`);
        const dataServidor = await resServidor.json();
        setServidor(dataServidor);

        // 2. Obtener lista de jugadores / tiempos en vivo
        const resJugadores = await fetch(`${API_BASE}/players`, { headers });
        if (!resJugadores.ok) throw new Error(`Error jugadores: ${resJugadores.status}`);
        const dataJugadores = await resJugadores.json();
        
        // Manejamos las distintas estructuras posibles que devuelve la API
        const listaJugadores = Array.isArray(dataJugadores) 
          ? dataJugadores 
          : (dataJugadores?.data || dataJugadores?.players || []);

        setJugadores(listaJugadores);
        setErrorLog("");
      } catch (err) {
        console.error("Falla de conexión con AssettoHosting:", err);
        setErrorLog(err.message);
      } finally {
        setCargando(false);
      }
    }

    actualizarDatos();
    const intervalo = setInterval(actualizarDatos, 3000); // Actualiza cada 3 segundos
    return () => clearInterval(intervalo);
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6">
      {/* HEADER / INFO DE LA SESIÓN */}
      <div className="bg-neutral-900/80 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-wrc text-emerald-400 tracking-widest uppercase">TELEMETRÍA EN VIVO - ESPÍNDOLA COMPETICIÓN</span>
          </div>
          <h3 className="font-wrc text-2xl md:text-3xl text-white tracking-wide">
            {servidor?.name || "SERVIDOR OFICIAL - MONOMARCA SAVEIRO"}
          </h3>
        </div>

        <div className="flex flex-wrap gap-4 text-xs font-wrc">
          <div className="bg-neutral-950 px-4 py-2.5 rounded-2xl border border-neutral-800">
            <span className="text-neutral-400 block">PISTA</span>
            <span className="text-amber-400 text-sm">{servidor?.track?.name || 'CARGANDO...'}</span>
          </div>
          <div className="bg-neutral-950 px-4 py-2.5 rounded-2xl border border-neutral-800">
            <span className="text-neutral-400 block">ESTADO</span>
            <span className="text-white text-sm uppercase">{servidor?.session || 'PRACTICE'}</span>
          </div>
          <div className="bg-neutral-950 px-4 py-2.5 rounded-2xl border border-neutral-800">
            <span className="text-neutral-400 block">EN PISTA</span>
            <span className="text-amber-400 text-sm">{jugadores.length} PILOTOS</span>
          </div>
        </div>
      </div>

      {/* ERROR DE RED SI LLEGARA A HABER */}
      {errorLog && (
        <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-2xl text-xs font-wrc">
          <strong>⚠️ ERROR DE CONEXIÓN CON LA API:</strong> {errorLog}
        </div>
      )}

      {/* TABLA PROPIA DE POSICIONES Y TIEMPOS */}
      <div className="bg-neutral-900/70 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-wrc">
            <thead>
              <tr className="bg-black/60 border-b border-white/10 text-amber-400 text-xs md:text-sm tracking-wider">
                <th className="py-4 px-6">POS</th>
                <th className="py-4 px-6">PILOTO</th>
                <th className="py-4 px-6">AUTO</th>
                <th className="py-4 px-6 text-center">VUELTAS</th>
                <th className="py-4 px-6 text-right">MEJOR TIEMPO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {cargando ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-neutral-400 font-wrc">CONECTANDO CON EL SERVIDOR DE BRASIL...</td>
                </tr>
              ) : jugadores.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-neutral-400 font-wrc">NO HAY PILOTOS EN PISTA EN ESTE MOMENTO.</td>
                </tr>
              ) : (
                jugadores.map((jugador, index) => (
                  <tr key={jugador.id || index} className="hover:bg-white/5 transition">
                    <td className="py-4 px-6 font-black text-amber-400">#{index + 1}</td>
                    <td className="py-4 px-6 font-bold text-white flex items-center gap-2">
                      <span>{jugador.name || jugador.driverName || "PILOTO"}</span>
                    </td>
                    <td className="py-4 px-6 text-neutral-300 uppercase">{jugador.car || jugador.carModel || "---"}</td>
                    <td className="py-4 px-6 text-center text-white">{jugador.laps || 0}</td>
                    <td className="py-4 px-6 text-right font-mono text-amber-300">{jugador.bestLap || jugador.bestTime || "--:--.---"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}