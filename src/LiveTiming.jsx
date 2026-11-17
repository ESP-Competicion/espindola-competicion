import { useState, useEffect, Component } from 'react';

const API_BASE = "https://br.assettohosting.com:10314/api/v1";
const TOKEN = import.meta.env.VITE_ASSETTO_API_TOKEN || "ahsm_0a5fdc7e3c9fa77fdba10849c6f9855212f3c4c4d403577";

// CAZA-ERRORES PARA EVITAR PANTALLA NEGRA
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error atrapado en LiveTiming:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-950/80 border-2 border-red-500 text-white p-8 rounded-3xl max-w-4xl mx-auto my-10 font-wrc">
          <h2 className="text-3xl text-red-400 font-black mb-2">⚠️ ERROR DETECTADO EN EL COMPONENTE</h2>
          <p className="text-sm text-neutral-300 mb-4">El componente intentó renderizar algo inválido. Este es el detalle técnico:</p>
          <pre className="bg-black/80 p-4 rounded-xl text-xs text-red-300 overflow-auto border border-red-500/40">
            {this.state.error && this.state.error.toString()}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function ContenidoLiveTiming() {
  const [servidor, setServidor] = useState(null);
  const [jugadores, setJugadores] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let montado = true;

    async function obtenerTelemetria() {
      try {
        const headers = { 
          'Authorization': `Bearer ${TOKEN}`,
          'Accept': 'application/json'
        };
        
        const resServidor = await fetch(`${API_BASE}/server`, { headers });
        if (resServidor.ok) {
          const dataServidor = await resServidor.json();
          if (montado && dataServidor) setServidor(dataServidor);
        }

        const resJugadores = await fetch(`${API_BASE}/players`, { headers });
        if (resJugadores.ok) {
          const dataJugadores = await resJugadores.json();
          if (montado) {
            let lista = [];
            if (Array.isArray(dataJugadores)) {
              lista = dataJugadores;
            } else if (dataJugadores?.data && Array.isArray(dataJugadores.data)) {
              lista = dataJugadores.data;
            } else if (dataJugadores?.players && Array.isArray(dataJugadores.players)) {
              lista = dataJugadores.players;
            } else if (dataJugadores && typeof dataJugadores === 'object') {
              lista = Object.values(dataJugadores);
            }
            setJugadores(lista);
          }
        }

        if (montado) setCargando(false);
      } catch (err) {
        console.error("Error en fetch:", err);
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
      {/* PANEL SUPERIOR */}
      <div className="bg-neutral-900/90 backdrop-blur-md border border-amber-500/30 rounded-3xl p-6 shadow-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-xs text-emerald-400 tracking-widest">TELEMETRÍA EN VIVO • ESPÍNDOLA COMPETICIÓN</span>
          </div>
          <h2 className="text-2xl md:text-3xl text-white font-black tracking-wide">
            {String(servidor?.name || "SERVIDOR OFICIAL - MONOMARCA SAVEIRO")}
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs w-full lg:w-auto">
          <div className="bg-neutral-950 px-4 py-3 rounded-2xl border border-neutral-800">
            <span className="text-neutral-400 block text-[10px]">PISTA</span>
            <span className="text-amber-400 text-sm truncate block">{String(servidor?.track?.name || '---')}</span>
          </div>
          <div className="bg-neutral-950 px-4 py-3 rounded-2xl border border-neutral-800">
            <span className="text-neutral-400 block text-[10px]">ESTADO</span>
            <span className="text-white text-sm">{String(servidor?.session || 'PRACTICE')}</span>
          </div>
          <div className="bg-neutral-950 px-4 py-3 rounded-2xl border border-neutral-800">
            <span className="text-neutral-400 block text-[10px]">JUGADORES</span>
            <span className="text-amber-400 text-sm">{Array.isArray(jugadores) ? jugadores.length : 0} CONECTADOS</span>
          </div>
          <div className="bg-neutral-950 px-4 py-3 rounded-2xl border border-neutral-800">
            <span className="text-neutral-400 block text-[10px]">RED</span>
            <span className="text-emerald-400 text-sm">ONLINE</span>
          </div>
        </div>
      </div>

      {/* TABLA DE POSICIONES */}
      <div className="bg-neutral-900/80 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
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
                  <td colSpan="5" className="text-center py-16 text-neutral-400">SINCRONIZANDO DATOS...</td>
                </tr>
              ) : !Array.isArray(jugadores) || jugadores.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-16 text-neutral-400">NO HAY PILOTOS CONECTADOS EN PISTA.</td>
                </tr>
              ) : (
                jugadores.map((j, index) => (
                  <tr key={j?.id || index} className="hover:bg-white/5 transition">
                    <td className="py-3.5 px-5 font-black text-amber-400">#{index + 1}</td>
                    <td className="py-3.5 px-5 font-bold text-white">
                      {String(j?.name || j?.driverName || "PILOTO")}
                    </td>
                    <td className="py-3.5 px-5 text-neutral-300 text-xs">{String(j?.car || "---")}</td>
                    <td className="py-3.5 px-5 text-center text-white">{Number(j?.laps || 0)}</td>
                    <td className="py-3.5 px-5 text-right font-mono text-amber-300 font-bold">{String(j?.bestLap || "--:--.---")}</td>
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

export default function LiveTiming() {
  return (
    <ErrorBoundary>
      <ContenidoLiveTiming />
    </ErrorBoundary>
  );
}