import { useState, useEffect, Component } from 'react';

const API_BASE = "https://br.assettohosting.com:10314/api/v1";
const TOKEN = import.meta.env.VITE_ASSETTO_API_TOKEN || "ahsm_0a5fdc7e3c9fa77fdba10849c6f9855212f3c4c4d403577";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Error en LiveTiming:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-950/80 border-2 border-red-500 text-white p-6 rounded-2xl max-w-4xl mx-auto my-6 font-wrc text-sm">
          <h2 className="text-xl text-red-400 font-black mb-2">⚠️ ERROR EN EL COMPONENTE</h2>
          <pre className="text-xs text-red-300 overflow-auto">{this.state.error?.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const extraerTexto = (valor, porDefecto = '---') => {
  if (valor === null || valor === undefined || valor === '') return porDefecto;
  if (typeof valor === 'string' || typeof valor === 'number') return String(valor);
  if (typeof valor === 'object') {
    return valor.name || valor.type || valor.model || valor.title || porDefecto;
  }
  return porDefecto;
};

const formatearTiempo = (ms) => {
  if (!ms || ms <= 0 || isNaN(ms)) return "--:--.---";
  const minutos = Math.floor(ms / 60000);
  const segundos = Math.floor((ms % 60000) / 1000);
  const milesimas = Math.floor(ms % 1000);
  return `${minutos > 0 ? minutos + ':' : ''}${String(segundos).padStart(minutos > 0 ? 2 : 1, '0')}.${String(milesimas).padStart(3, '0')}`;
};

const formatearSector = (ms) => {
  if (!ms || ms <= 0 || isNaN(ms)) return "--.---";
  const segundos = Math.floor(ms / 1000);
  const milesimas = Math.floor(ms % 1000);
  return `${segundos}.${String(milesimas).padStart(3, '0')}`;
};

const formatearDiferencia = (ms) => {
  if (!ms || ms <= 0 || isNaN(ms)) return "---";
  return `+${(ms / 1000).toFixed(3)}`;
};

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
        
        const resServidor = await fetch(`${API_BASE}/server`, { headers }).catch(() => null);
        if (resServidor && resServidor.ok) {
          const dataServidor = await resServidor.json();
          if (montado && dataServidor) setServidor(dataServidor);
        }

        const resJugadores = await fetch(`${API_BASE}/players`, { headers }).catch(() => null);
        if (resJugadores && resJugadores.ok) {
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

  const nombrePista = extraerTexto(servidor?.track?.name || servidor?.track, 'AUTÓDROMO RÍO CUARTO');
  const estadoSesion = extraerTexto(servidor?.session?.type || servidor?.session?.name || servidor?.session, 'PRACTICE');

  const cantidadSectores = 3;
  const arraySectores = Array.from({ length: cantidadSectores }, (_, i) => i);

  const jugadoresOrdenados = [...jugadores].filter(j => typeof j === 'object' && j !== null).sort((a, b) => {
    const tA = Number(a?.bestLapMs) || Infinity;
    const tB = Number(b?.bestLapMs) || Infinity;
    return (tA === 0 ? Infinity : tA) - (tB === 0 ? Infinity : tB);
  });

  const mejorTiempoAbsoluto = jugadoresOrdenados.length > 0 ? Number(jugadoresOrdenados[0]?.bestLapMs) || null : null;

  return (
    <div className="w-full px-3 md:px-6 py-3 font-wrc text-white uppercase space-y-4 max-w-[1400px] mx-auto text-xs">
      
      {/* CABECERA COMPACTA */}
      <div className="bg-neutral-900/90 backdrop-blur-md border border-amber-500/40 rounded-2xl px-4 py-3 shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 w-full">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-[9px] text-emerald-400 tracking-widest font-bold">LIVE TIMING OFICIAL • ESPÍNDOLA COMPETICIÓN</span>
          </div>
          <h2 className="text-xs md:text-sm text-white font-black tracking-wide truncate max-w-[700px]">
            {extraerTexto(servidor?.name, "ESPINDOLA COMPETICION | SERVER OFICIAL")}
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-2 text-[11px] w-full lg:w-auto">
          <div className="bg-neutral-950/90 px-3 py-2 rounded-xl border border-white/10 text-center">
            <span className="text-neutral-400 block text-[9px]">SESIÓN</span>
            <span className="text-white text-xs">{estadoSesion}</span>
          </div>
          <div className="bg-neutral-950/90 px-3 py-2 rounded-xl border border-white/10 text-center">
            <span className="text-neutral-400 block text-[9px]">PILOTOS EN PISTA</span>
            <span className="text-amber-400 text-xs">{jugadoresOrdenados.length} / {servidor?.slots || 20}</span>
          </div>
          <div className="bg-neutral-950/90 px-3 py-2 rounded-xl border border-white/10 text-center">
            <span className="text-neutral-400 block text-[9px]">RÉCORD DE SESIÓN</span>
            <span className="text-purple-400 text-xs font-mono font-black">{formatearTiempo(mejorTiempoAbsoluto)}</span>
          </div>
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL: TABLA DE TIEMPOS */}
      <div className="w-full">
        <div className="bg-neutral-950/85 backdrop-blur-md border border-white/15 rounded-2xl overflow-hidden shadow-2xl w-full">
          <div className="bg-gradient-to-r from-amber-500/20 via-neutral-900 to-neutral-900 px-4 py-2.5 border-b border-amber-500/30 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="bg-amber-500 text-black text-[10px] font-black px-2 py-0.5 rounded">EN VIVO</span>
              <h3 className="text-white text-xs tracking-wider font-black">CLASIFICACIÓN Y TIEMPOS</h3>
            </div>
            <span className="text-[11px] text-amber-400 font-bold truncate max-w-[350px]">
              🏁 {nombrePista}
            </span>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
              <thead>
                <tr className="border-b border-white/15 text-amber-400 tracking-wider bg-black/70">
                  <th className="py-2.5 px-3 text-center w-10">POS</th>
                  <th className="py-2.5 px-3">PILOTO</th>
                  <th className="py-2.5 px-3">AUTO</th>
                  <th className="py-2.5 px-3 text-right">LAST LAP</th>
                  <th className="py-2.5 px-3 text-right">GAP</th>
                  <th className="py-2.5 px-3 text-right">DELTA</th>
                  <th className="py-2.5 px-3 text-center">VUELTAS</th>
                  <th className="py-2.5 px-3 text-right border-l border-white/10 text-purple-400">MEJOR TIEMPO</th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-white/10">
                {cargando ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-neutral-400 text-xs">
                      SINCRONIZANDO TELEMETRÍA...
                    </td>
                  </tr>
                ) : jugadoresOrdenados.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-neutral-400 text-xs">
                      ESPERANDO DATOS EN PISTA...
                    </td>
                  </tr>
                ) : (
                  jugadoresOrdenados.map((j, index) => {
                    const nombrePiloto = extraerTexto(j?.name, "PILOTO");
                    const modeloAuto = extraerTexto(j?.car?.name, "AUTO");
                    const vueltas = Number(j?.laps) || 0;
                    const mejorLapMs = Number(j?.bestLapMs) || 0;
                    const ultimoMs = Number(j?.lastLapMs) || 0;
                    const ultimoFormateado = formatearTiempo(ultimoMs);

                    let gapTexto = "---";
                    if (index === 0 && mejorLapMs > 0) {
                      gapTexto = "LÍDER";
                    } else if (mejorLapMs > 0 && mejorTiempoAbsoluto > 0) {
                      gapTexto = formatearDiferencia(mejorLapMs - mejorTiempoAbsoluto);
                    }

                    let deltaTexto = "---";
                    if (index > 0 && mejorLapMs > 0) {
                      const tiempoAdelante = Number(jugadoresOrdenados[index - 1]?.bestLapMs) || 0;
                      if (tiempoAdelante > 0) {
                        deltaTexto = formatearDiferencia(mejorLapMs - tiempoAdelante);
                      }
                    }

                    const esPrimero = index === 0;
                    const colorPos = esPrimero
                      ? "bg-amber-400 text-black font-black"
                      : index === 1
                      ? "bg-neutral-300 text-black font-black"
                      : index === 2
                      ? "bg-amber-700 text-white font-black"
                      : "text-neutral-300 font-bold";

                    return (
                      <tr key={j?.steamId || j?.carId || index} className={`transition ${esPrimero ? 'bg-amber-500/10 hover:bg-amber-500/15' : 'hover:bg-white/5'}`}>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-block w-5 h-5 leading-5 rounded text-[11px] ${colorPos}`}>{index + 1}</span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-white">{nombrePiloto}</td>
                        <td className="py-2.5 px-3 text-neutral-300 text-[11px]">{modeloAuto}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-amber-300 font-bold">{ultimoFormateado}</td>
                        <td className={`py-2.5 px-3 text-right font-mono text-[11px] ${index === 0 && mejorLapMs > 0 ? 'text-amber-400 font-bold' : 'text-neutral-300'}`}>{gapTexto}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-[11px] text-neutral-400">{deltaTexto}</td>
                        <td className="py-2.5 px-3 text-center text-white font-bold">{vueltas}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-purple-400 border-l border-white/10 bg-purple-950/20">
                          {formatearTiempo(mejorLapMs)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
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