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
        <div className="bg-red-950/80 border-2 border-red-500 text-white p-8 rounded-3xl max-w-4xl mx-auto my-10 font-wrc">
          <h2 className="text-3xl text-red-400 font-black mb-2">⚠️ ERROR EN EL COMPONENTE</h2>
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

  const nombrePista = extraerTexto(servidor?.track?.name || servidor?.track, 'AUTÓDROMO PARQUE CIUDAD DE RÍO CUARTO');
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
    <div className="w-full px-4 md:px-8 py-4 font-wrc text-white uppercase space-y-6">
      
      {/* CABECERA */}
      <div className="bg-neutral-900/90 backdrop-blur-md border border-amber-500/40 rounded-3xl p-6 shadow-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 w-full">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs text-emerald-400 tracking-widest font-bold">LIVE TIMING OFICIAL • ESPÍNDOLA COMPETICIÓN</span>
          </div>
          <h2 className="text-2xl md:text-3xl text-white font-black tracking-wide">
            {extraerTexto(servidor?.name, "ESPINDOLA COMPETICION | SERVER OFICIAL")}
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs w-full lg:w-auto">
          <div className="bg-neutral-950/90 px-4 py-3 rounded-2xl border border-white/10">
            <span className="text-neutral-400 block text-[10px]">CIRCUITO / TRAMO</span>
            <span className="text-amber-400 text-sm truncate block max-w-[180px]" title={nombrePista}>{nombrePista}</span>
          </div>
          <div className="bg-neutral-950/90 px-4 py-3 rounded-2xl border border-white/10">
            <span className="text-neutral-400 block text-[10px]">SESIÓN</span>
            <span className="text-white text-sm">{estadoSesion}</span>
          </div>
          <div className="bg-neutral-950/90 px-4 py-3 rounded-2xl border border-white/10">
            <span className="text-neutral-400 block text-[10px]">PILOTOS EN PISTA</span>
            <span className="text-amber-400 text-sm">{jugadoresOrdenados.length} / {servidor?.slots || 20}</span>
          </div>
          <div className="bg-neutral-950/90 px-4 py-3 rounded-2xl border border-white/10">
            <span className="text-neutral-400 block text-[10px]">RÉCORD DE SESIÓN</span>
            <span className="text-emerald-400 text-sm font-mono">{formatearTiempo(mejorTiempoAbsoluto)}</span>
          </div>
        </div>
      </div>

      {/* TABLA PROPIA + MAPA */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start w-full">
        
        {/* TABLA DE POSICIONES (8 COLUMNAS) */}
        <div className="xl:col-span-8 bg-neutral-950/85 backdrop-blur-md border border-white/15 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)]">
          <div className="bg-gradient-to-r from-amber-500/20 via-neutral-900 to-neutral-900 px-6 py-4 border-b border-amber-500/30 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="bg-amber-500 text-black text-xs font-black px-2.5 py-0.5 rounded">EN VIVO</span>
              <h3 className="text-white text-lg tracking-wider font-black">CLASIFICACIÓN Y PARCIALES</h3>
            </div>
            <span className="text-xs text-emerald-400 font-bold">SISTEMA PROPIO</span>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-white/15 text-amber-400 text-xs tracking-wider bg-black/70">
                  <th className="py-3.5 px-3 text-center w-12">POS</th>
                  <th className="py-3.5 px-4">PILOTO</th>
                  <th className="py-3.5 px-4">AUTO</th>
                  <th className="py-3.5 px-3 text-right">BEST</th>
                  <th className="py-3.5 px-3 text-right">GAP</th>
                  <th className="py-3.5 px-3 text-right">DELTA</th>
                  <th className="py-3.5 px-3 text-center">VUELTAS</th>
                  {arraySectores.map((idx) => (
                    <th key={`header-s-${idx}`} className="py-3.5 px-2 text-center text-neutral-300 bg-white/[0.02] border-l border-white/5">
                      S{idx + 1}
                    </th>
                  ))}
                  <th className="py-3.5 px-4 text-right border-l border-white/10 text-emerald-400">MEJOR</th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-white/10 text-sm">
                {cargando ? (
                  <tr>
                    <td colSpan={8 + cantidadSectores} className="text-center py-16 text-neutral-400">
                      SINCRONIZANDO TELEMETRÍA...
                    </td>
                  </tr>
                ) : jugadoresOrdenados.length === 0 ? (
                  <tr>
                    <td colSpan={8 + cantidadSectores} className="text-center py-16 text-neutral-400">
                      ESPERANDO DATOS EN PISTA...
                    </td>
                  </tr>
                ) : (
                  jugadoresOrdenados.map((j, index) => {
                    const nombrePiloto = extraerTexto(j?.name, "PILOTO");
                    const modeloAuto = extraerTexto(j?.car?.name, "AUTO");
                    const vueltas = Number(j?.laps) || 0;
                    const tiempoMs = Number(j?.bestLapMs) || 0;
                    const tiempoFormateado = formatearTiempo(tiempoMs);
                    const ultimoMs = Number(j?.lastLapMs) || 0;

                    let gapTexto = "---";
                    if (index === 0 && tiempoMs > 0) {
                      gapTexto = "LÍDER";
                    } else if (tiempoMs > 0 && mejorTiempoAbsoluto > 0) {
                      gapTexto = formatearDiferencia(tiempoMs - mejorTiempoAbsoluto);
                    }

                    let deltaTexto = "---";
                    if (index > 0 && tiempoMs > 0) {
                      const tiempoAdelante = Number(jugadoresOrdenados[index - 1]?.bestLapMs) || 0;
                      if (tiempoAdelante > 0) {
                        deltaTexto = formatearDiferencia(tiempoMs - tiempoAdelante);
                      }
                    }

                    const sectoresPiloto = Array.isArray(j?.sectors) ? j.sectors : [j?.sector1, j?.sector2, j?.sector3];
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
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block w-6 h-6 leading-6 rounded-md text-xs ${colorPos}`}>{index + 1}</span>
                        </td>
                        <td className="py-3 px-4 font-bold text-white tracking-wide">{nombrePiloto}</td>
                        <td className="py-3 px-4 text-neutral-300 text-xs">{modeloAuto}</td>
                        <td className="py-3 px-3 text-right font-mono text-amber-300 font-bold">{tiempoFormateado}</td>
                        <td className={`py-3 px-3 text-right font-mono text-xs ${index === 0 && tiempoMs > 0 ? 'text-amber-400 font-bold' : 'text-neutral-300'}`}>{gapTexto}</td>
                        <td className="py-3 px-3 text-right font-mono text-xs text-neutral-400">{deltaTexto}</td>
                        <td className="py-3 px-3 text-center text-white font-bold">{vueltas}</td>
                        {arraySectores.map((sIdx) => (
                          <td key={`cell-s-${index}-${sIdx}`} className="py-3 px-2 text-center font-mono text-xs text-neutral-300 bg-white/[0.01] border-l border-white/5">
                            {formatearSector(sectoresPiloto[sIdx])}
                          </td>
                        ))}
                        <td className="py-3 px-4 text-right font-mono font-black text-emerald-400 border-l border-white/10 bg-emerald-950/10">
                          {formatearTiempo(ultimoMs > 0 ? ultimoMs : tiempoMs)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* COLUMNA DERECHA: MAPA EN VIVO CON TRAZADO Y PUNTO GPS */}
        <div className="xl:col-span-4 space-y-6 flex flex-col">
          <div className="bg-neutral-950/85 backdrop-blur-md border border-white/15 rounded-3xl p-6 shadow-xl flex flex-col min-h-[420px]">
            <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="text-amber-400 text-sm tracking-wider font-black">MAPA EN VIVO</h3>
              </div>
              <span className="text-[10px] bg-neutral-900 text-neutral-400 px-2.5 py-0.5 rounded border border-white/10 truncate max-w-[140px]">
                {nombrePista}
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center bg-neutral-900/60 rounded-2xl border border-neutral-800 p-4 relative overflow-hidden min-h-[320px]">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fbbf24_1px,transparent_1px)] [background-size:16px_16px]"></div>
              
              {/* TRAZADO VECTORIAL DE FONDO (CIRCUITO) */}
              <svg className="absolute inset-0 w-full h-full p-6 opacity-40 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path 
                  d="M 15 80 Q 15 20, 50 20 Q 85 20, 85 50 Q 85 85, 50 85 Q 25 85, 20 60" 
                  fill="none" 
                  stroke="#fbbf24" 
                  strokeWidth="3" 
                  strokeLinecap="round"
                  className="drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]"
                />
              </svg>

              {/* RENDERIZADO DEL PUNTO DEL AUTO USANDO mapX y mapY */}
              {jugadoresOrdenados.map((j, idx) => {
                const mapX = j?.position?.mapX;
                const mapY = j?.position?.mapY;
                if (mapX === undefined || mapY === undefined) return null;

                const leftPercent = Math.min(Math.max((mapX / 1000) * 100, 10), 90);
                const topPercent = Math.min(Math.max((mapY / 600) * 100, 10), 90);

                return (
                  <div 
                    key={`map-car-${idx}`}
                    className="absolute z-20 flex items-center gap-1.5 transition-all duration-300"
                    style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                  >
                    <span className="w-3 h-3 rounded-full bg-amber-400 border-2 border-black shadow-[0_0_10px_#fbbf24] animate-ping absolute"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-400 border-2 border-black shadow-[0_0_10px_#fbbf24] relative z-10"></span>
                    <span className="bg-black/90 text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-500/40 whitespace-nowrap">
                      {j?.name || 'PILOTO'}
                    </span>
                  </div>
                );
              })}

              {jugadoresOrdenados.length === 0 || !jugadoresOrdenados.some(j => j?.position?.mapX !== undefined) ? (
                <div className="text-center z-10 space-y-2">
                  <div className="inline-block p-3 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <svg className="w-7 h-7 mx-auto animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                    </svg>
                  </div>
                  <p className="text-xs text-neutral-300 tracking-wider font-bold">ESPERANDO POSICIÓN GPS...</p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="bg-neutral-950/85 backdrop-blur-md border border-white/15 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
                <h3 className="text-amber-400 text-sm tracking-wider font-black">FEED DE SESIÓN</h3>
                <span className="text-[10px] bg-neutral-900 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">ONLINE</span>
              </div>
              
              <div className="space-y-2.5 text-xs text-neutral-400">
                <div className="bg-neutral-900/80 p-3 rounded-2xl border border-neutral-800 flex items-center justify-between">
                  <span>Estado Servidor</span>
                  <span className="text-emerald-400 font-bold">ONLINE</span>
                </div>
                <div className="bg-neutral-900/80 p-3 rounded-2xl border border-neutral-800 flex items-center justify-between">
                  <span>Conexión sTracker</span>
                  <span className="text-emerald-400 font-bold">CONECTADO</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-white/10 text-center">
              <p className="text-[10px] text-neutral-500 tracking-wider">
                ESPÍNDOLA COMPETICIÓN
              </p>
            </div>
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