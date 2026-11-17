import { useState, useEffect } from 'react';

const API_BASE = "https://br.assettohosting.com:10314/api/v1";
const TOKEN = import.meta.env.VITE_ASSETTO_API_TOKEN || "ahsm_0a5fdc7e3c9fa77fdba10849c6f9855212f3c4c4d403577";

export default function LiveTiming() {
  const [servidor, setServidor] = useState(null);
  const [jugadores, setJugadores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorLog, setErrorLog] = useState("");

  useEffect(() => {
    let montado = true;

    async function obtenerTelemetria() {
      try {
        const headers = { 
          'Authorization': `Bearer ${TOKEN}`,
          'Accept': 'application/json'
        };
        
        // 1. Servidor
        const resServidor = await fetch(`${API_BASE}/server`, { headers });
        const dataServidor = resServidor.ok ? await resServidor.json() : null;

        // 2. Jugadores
        const resJugadores = await fetch(`${API_BASE}/players`, { headers });
        const dataJugadores = resJugadores.ok ? await resJugadores.json() : null;
        
        if (!montado) return;

        // Procesamos los jugadores de forma ultra segura para que nunca rompa
        let lista = [];
        if (Array.isArray(dataJugadores)) {
          lista = dataJugadores;
        } else if (dataJugadores && Array.isArray(dataJugadores.data)) {
          lista = dataJugadores.data;
        } else if (dataJugadores && Array.isArray(dataJugadores.players)) {
          lista = dataJugadores.players;
        } else if (dataJugadores && typeof dataJugadores === 'object') {
          // Si viene como objeto con keys de IDs de jugadores
          lista = Object.values(dataJugadores);
        }

        setServidor(dataServidor || {});
        setJugadores(lista);
        setErrorLog("");
      } catch (err) {
        if (!montado) return;
        console.error("Error de telemetría:", err);
        setErrorLog(err.message || "Error desconocido");
      } finally {
        if (montado) setCargando(false);
      }
    }

    obtenerTelemetria();
    const intervalo = setInterval(obtenerTelemetria, 3000);
    
    return () => {
      montado = false;
      clearInterval(intervalo);
    };
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-4 font-wrc text-white uppercase">
      
      {/* 1. PANEL SUPERIOR: ESTADO DEL SERVIDOR Y PISTA */}
      <div className="bg-neutral-900/90 backdrop-blur-md border border-amber-500/30 rounded-3xl p-6 shadow-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-xs text-emerald-400 tracking-widest">TELEMETRÍA EN VIVO • ESPÍNDOLA COMPETICIÓN</span>
          </div>
          <h2 className="text-2xl md:text-3xl text-white font-black tracking-wide">
            {servidor?.name || "SERVIDOR OFICIAL - MONOMARCA SAVEIRO"}
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs w-full lg:w-auto">
          <div className="bg-neutral-950 px-4 py-3 rounded-2xl border border-neutral-800">
            <span className="text-neutral-400 block text-[10px]">PISTA</span>
            <span className="text-amber-400 text-sm truncate block">{servidor?.track?.name || '---'}</span>
          </div>
          <div className="bg-neutral-950 px-4 py-3 rounded-2xl border border-neutral-800">
            <span className="text-neutral-400 block text-[10px]">ESTADO</span>
            <span className="text-white text-sm">{servidor?.session?.type || servidor?.session || 'PRACTICE'}</span>
          </div>
          <div className="bg-neutral-950 px-4 py-3 rounded-2xl border border-neutral-800">
            <span className="text-neutral-400 block text-[10px]">JUGADORES</span>
            <span className="text-amber-400 text-sm">{servidor?.players ?? (Array.isArray(jugadores) ? jugadores.length : 0)} CONECTADOS</span>
          </div>
          <div className="bg-neutral-950 px-4 py-3 rounded-2xl border border-neutral-800">
            <span className="text-neutral-400 block text-[10px]">ESTADO RED</span>
            <span className="text-emerald-400 text-sm">ONLINE</span>
          </div>
        </div>
      </div>

      {errorLog && (
        <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-2xl text-xs">
          <strong>⚠️ AVISO:</strong> {errorLog}
        </div>
      )}

      {/* 2. GRILLA PRINCIPAL: TABLA DE TIEMPOS PROPIA + MAPA DE PISTA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* TABLA DE POSICIONES */}
        <div className="lg:col-span-2 bg-neutral-900/80 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
          <div className="bg-black/60 px-6 py-4 border-b border-white/10 flex justify-between items-center">
            <h3 className="text-amber-400 text-lg tracking-wider font-black">CLASIFICACIÓN EN TIEMPO REAL</h3>
            <span className="text-xs text-neutral-400">ACTUALIZACIÓN AUTOMÁTICA</span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-neutral-400 text-xs tracking-wider bg-neutral-950/50">
                  <th className="py-3.5 px-5">POS</th>
                  <th className="py-3.5 px-5">PILOTO</th>
                  <th className="py-3.5 px-5">AUTO</th>
                  <th className="py-3.5 px-5 text-center">VUELTAS</th>
                  <th className="py-3.5 px-5 text-right">MEJOR TIEMPO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {cargando ? (
                  <tr>
                    <td colSpan="5" className="text-center py-16 text-neutral-400">SINCRONIZANDO DATOS DEL SERVIDOR...</td>
                  </tr>
                ) : !Array.isArray(jugadores) || jugadores.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-16 text-neutral-400">NO HAY PILOTOS CONECTADOS EN PISTA.</td>
                  </tr>
                ) : (
                  jugadores.map((j, index) => (
                    <tr key={j?.id || j?.connectionId || index} className="hover:bg-white/5 transition">
                      <td className="py-3.5 px-5 font-black text-amber-400">#{index + 1}</td>
                      <td className="py-3.5 px-5 font-bold text-white flex items-center gap-2">
                        <span>{j?.name || j?.driverName || j?.playerName || "PILOTO"}</span>
                      </td>
                      <td className="py-3.5 px-5 text-neutral-300 text-xs">{j?.car || j?.carModel || j?.model || "---"}</td>
                      <td className="py-3.5 px-5 text-center text-white">{j?.laps || j?.completedLaps || 0}</td>
                      <td className="py-3.5 px-5 text-right font-mono text-amber-300 font-bold">{j?.bestLap || j?.bestTime || "--:--.---"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MAPA Y SECTORES */}
        <div className="space-y-6 flex flex-col">
          <div className="bg-neutral-900/80 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl flex-1 flex flex-col justify-between min-h-[260px]">
            <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
              <h3 className="text-amber-400 text-sm tracking-wider font-black">MAPA DEL CIRCUITO</h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">ONLINE</span>
            </div>
            
            <div className="flex-1 flex items-center justify-center bg-neutral-950/60 rounded-2xl border border-neutral-800 p-4 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fbbf24_1px,transparent_1px)] [background-size:16px_16px]"></div>
              <p className="text-xs text-neutral-500 text-center tracking-widest z-10">
                [ CONTENEDOR DE MAPA GPS / TRACKMAP ]<br/>
                <span className="text-[10px] text-neutral-600">LISTO PARA RENDERIZAR COORDENADAS</span>
              </p>
            </div>
          </div>

          <div className="bg-neutral-900/80 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-amber-400 text-sm tracking-wider font-black border-b border-white/10 pb-3 mb-4">CONTROL DE SECTORES</h3>
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800">
                <span className="text-neutral-500 block text-[10px]">SECTOR 1</span>
                <span className="text-white font-mono mt-1 block">--.---</span>
              </div>
              <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800">
                <span className="text-neutral-500 block text-[10px]">SECTOR 2</span>
                <span className="text-white font-mono mt-1 block">--.---</span>
              </div>
              <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800">
                <span className="text-neutral-500 block text-[10px]">SECTOR 3</span>
                <span className="text-white font-mono mt-1 block">--.---</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}