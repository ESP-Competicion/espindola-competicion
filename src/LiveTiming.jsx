import { useState, useEffect, useRef } from 'react';

const API_BASE = "https://br.assettohosting.com:10314/api/v1";
const TOKEN = import.meta.env.VITE_ASSETTO_API_TOKEN;

export default function LiveTiming() {
  const [pestanaActiva, setPestanaActiva] = useState('vivo');
  const [servidor, setServidor] = useState(null);
  const [jugadores, setJugadores] = useState([]);
  const [resultadosLista, setResultadosLista] = useState([]);
  const [clasificacionSesion, setClasificacionSesion] = useState(null);
  
  const canvasRef = useRef(null);

  // 1. Cargar datos en vivo con protección de errores
  useEffect(() => {
    async function actualizarEnVivo() {
      if (!TOKEN) return;
      try {
        const headers = { Authorization: `Bearer ${TOKEN}` };
        
        const resServidor = await fetch(`${API_BASE}/server`, { headers });
        if (resServidor.ok) {
          const dataServidor = await resServidor.json();
          setServidor(dataServidor);
        }

        const resJugadores = await fetch(`${API_BASE}/players`, { headers });
        if (resJugadores.ok) {
          const dataJugadores = await resJugadores.json();
          if (dataJugadores?.data) setJugadores(dataJugadores.data);
        }
      } catch (err) {
        console.error("Error al conectar con AssettoHosting:", err);
      }
    }

    actualizarEnVivo();
    const intervalo = setInterval(actualizarEnVivo, 3000);
    return () => clearInterval(intervalo);
  }, []);

  // 2. Renderizar minimapa de forma segura
  useEffect(() => {
    if (pestanaActiva !== 'vivo' || !TOKEN) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    async function loopMinimapa() {
      try {
        const headers = { Authorization: `Bearer ${TOKEN}` };
        const mapRes = await fetch(`${API_BASE}/map`, { headers });
        if (!mapRes.ok) return;
        const mapData = await mapRes.json();
        
        const posRes = await fetch(`${API_BASE}/positions`, { headers });
        if (!posRes.ok) return;
        const posData = await posRes.json();

        if (mapData && mapData.width && posData?.cars) {
          const WIDTH = 400;
          const scale = WIDTH / mapData.width;
          canvas.width = WIDTH;
          canvas.height = Math.round(mapData.height * scale);

          const mapImg = new Image();
          const mapBlob = await (await fetch(`${API_BASE}/map.png`, { headers })).blob();
          mapImg.src = URL.createObjectURL(mapBlob);
          
          mapImg.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(mapImg, 0, 0, canvas.width, canvas.height);

            posData.cars.forEach(car => {
              if (car.mapX === null || car.mapY === null) return;
              const x = car.mapX * scale;
              const y = car.mapY * scale;

              ctx.fillStyle = '#f59e0b';
              ctx.beginPath();
              ctx.arc(x, y, 6, 0, 2 * Math.PI);
              ctx.fill();
              ctx.lineWidth = 2;
              ctx.strokeStyle = '#ffffff';
              ctx.stroke();

              ctx.fillStyle = '#ffffff';
              ctx.font = '10px sans-serif';
              ctx.fillText(car.name || 'Auto', x + 10, y + 4);
            });
          };
        }
      } catch (e) {
        // Silenciar errores de mapa si el servidor no mandó datos todavía
      }
    }

    const mapInterval = setInterval(loopMinimapa, 2000);
    return () => clearInterval(mapInterval);
  }, [pestanaActiva]);

  // 3. Resultados históricos
  useEffect(() => {
    if (pestanaActiva === 'resultados' && TOKEN) {
      fetch(`${API_BASE}/results?limit=10`, { headers: { Authorization: `Bearer ${TOKEN}` } })
        .then(res => res.json())
        .then(data => {
          if (data?.items) setResultadosLista(data.items);
        })
        .catch(err => console.error("Error cargando resultados:", err));
    }
  }, [pestanaActiva]);

  const verDetalleSesion = async (linkClassification) => {
    try {
      const res = await fetch(`${API_BASE}${linkClassification}`, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      });
      const data = await res.json();
      setClasificacionSesion(data);
    } catch (err) {
      console.error("Error al cargar clasificación:", err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 text-white font-wrc space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center bg-neutral-900/90 border border-white/10 p-4 rounded-2xl backdrop-blur-md shadow-xl gap-4">
        <div>
          <h2 className="text-2xl font-black text-amber-400 tracking-wider">ESPÍNDOLA COMPETICIÓN // LIVE TIMING</h2>
          <p className="text-xs text-neutral-400">TELEMETRÍA Y RESULTADOS OFICIALES EN TIEMPO REAL</p>
        </div>
        <div className="flex gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
          <button 
            onClick={() => { setPestanaActiva('vivo'); setClasificacionSesion(null); }}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${pestanaActiva === 'vivo' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-neutral-400 hover:text-white'}`}
          >
            🔴 EN VIVO
          </button>
          <button 
            onClick={() => setPestanaActiva('resultados')}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${pestanaActiva === 'resultados' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-neutral-400 hover:text-white'}`}
          >
            📊 RESULTADOS
          </button>
        </div>
      </div>

      {pestanaActiva === 'vivo' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-neutral-900/80 border border-white/10 rounded-3xl p-5 shadow-2xl backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
                <span className="text-sm font-bold text-amber-400">PISTA: {servidor?.track?.name || 'CONECTANDO...'}</span>
                <span className="text-xs px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30">
                  {servidor?.session?.type || 'ESPERANDO'}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-neutral-400">
                      <th className="pb-3">POS</th>
                      <th className="pb-3">PILOTO</th>
                      <th className="pb-3">AUTO</th>
                      <th className="pb-3">MEJOR VUELTA</th>
                      <th className="pb-3">VELOCIDAD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {jugadores.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-8 text-neutral-500">NO HAY PILOTOS CONECTADOS O SERVIDOR APAGADO.</td>
                      </tr>
                    ) : (
                      jugadores.map((p, idx) => (
                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 font-bold text-amber-400">#{idx + 1}</td>
                          <td className="py-3 font-bold text-white">{p.name}</td>
                          <td className="py-3 text-neutral-300">{p.car || 'Auto'}</td>
                          <td className="py-3 font-mono text-amber-300">
                            {p.bestLapMs ? `${Math.floor(p.bestLapMs / 60000)}:${((p.bestLapMs % 60000) / 1000).toFixed(3).padStart(6, '0')}` : '--:--.---'}
                          </td>
                          <td className="py-3 font-mono text-neutral-400">{p.speedKmh ? `${Math.round(p.speedKmh)} km/h` : '0 km/h'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-neutral-500 flex justify-between">
              <span>ESTADO: {servidor?.online ? '🟢 SERVIDOR EN LÍNEA' : '🔴 OFFLINE / APAGADO'}</span>
              <span>ACTUALIZACIÓN AUTOMÁTICA</span>
            </div>
          </div>

          <div className="bg-neutral-900/80 border border-white/10 rounded-3xl p-5 shadow-2xl backdrop-blur-md flex flex-col items-center justify-between">
            <h3 className="text-sm font-bold text-amber-400 mb-3 self-start">RADAR EN VIVO</h3>
            <div className="w-full bg-black/60 rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center p-2">
              <canvas ref={canvasRef} className="max-w-full h-auto rounded-lg" />
            </div>
            <p className="text-[10px] text-neutral-400 mt-4 text-center">POSICIÓN EN TIEMPO REAL DE LOS VEHÍCULOS SOBRE EL TRAZADO.</p>
          </div>
        </div>
      )}

      {pestanaActiva === 'resultados' && (
        <div className="bg-neutral-900/80 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-6">
          {!clasificacionSesion ? (
            <div>
              <h3 className="text-lg font-bold text-amber-400 mb-4">HISTORIAL DE SESIONES Y CARRERAS</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {resultadosLista.length === 0 ? (
                  <p className="text-neutral-500 text-xs">NO HAY RESULTADOS REGISTRADOS AÚN.</p>
                ) : (
                  resultadosLista.map((item, idx) => (
                    <div key={idx} className="bg-black/40 border border-white/10 p-4 rounded-2xl flex justify-between items-center hover:border-amber-500/50 transition-all">
                      <div>
                        <span className="text-xs text-amber-400 font-bold uppercase">{item.session} - {item.track}</span>
                        <p className="text-xs text-neutral-400">{item.date?.substring(0, 10)}</p>
                      </div>
                      <button 
                        onClick={() => verDetalleSesion(item.links.classification)}
                        className="bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/30 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                      >
                        VER CLASIFICACIÓN
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
                <h3 className="text-lg font-bold text-amber-400">CLASIFICACIÓN OFICIAL</h3>
                <button 
                  onClick={() => setClasificacionSesion(null)}
                  className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all"
                >
                  ← VOLVER A LISTA
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-neutral-400">
                      <th className="pb-3">POS</th>
                      <th className="pb-3">PILOTO</th>
                      <th className="pb-3">AUTO</th>
                      <th className="pb-3">MEJOR VUELTA</th>
                      <th className="pb-3">TIEMPO TOTAL / DIF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {clasificacionSesion.classification?.map((row, idx) => (
                      <tr key={idx} className="hover:bg-white/5">
                        <td className="py-3 font-bold text-amber-400">#{row.position}</td>
                        <td className="py-3 font-bold text-white">{row.name}</td>
                        <td className="py-3 text-neutral-300">{row.car?.name || row.carId}</td>
                        <td className="py-3 font-mono text-amber-300">
                          {row.bestLapMs ? `${Math.floor(row.bestLapMs / 60000)}:${((row.bestLapMs % 60000) / 1000).toFixed(3).padStart(6, '0')}` : '---'}
                        </td>
                        <td className="py-3 font-mono text-neutral-400">
                          {row.totalTimeMs ? `${(row.totalTimeMs / 1000).toFixed(3)}s` : '--'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}