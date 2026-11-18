import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const API_BASE = "https://br.assettohosting.com:10314/api/v1";
const TOKEN = import.meta.env.VITE_ASSETTO_API_TOKEN || "ahsm_0a5fdc7e3c9fa77fdba10849c6f9855212f3c4c4d403577";

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

const obtenerSectoresJugador = (j) => {
  if (Array.isArray(j?.sectors) && j.sectors.length > 0) {
    return j.sectors.map(s => Number(s) || 0);
  }
  if (j?.sector1 !== undefined || j?.sector2 !== undefined || j?.sector3 !== undefined) {
    return [Number(j?.sector1) || 0, Number(j?.sector2) || 0, Number(j?.sector3) || 0];
  }
  return [0, 0, 0];
};

export default function Resultados() {
  const [resultadosGuardados, setResultadosGuardados] = useState([]);
  const [sesionSeleccionada, setSesionSeleccionada] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [sesionAnteriorEnVivo, setSesionAnteriorEnVivo] = useState(null);

  useEffect(() => {
    cargarResultadosSupabase();

    // Verificador en tiempo real para autoguardar cuando cambie la sesión en el servidor
    const intervaloMonitoreo = setInterval(async () => {
      try {
        const headers = { 'Authorization': `Bearer ${TOKEN}`, 'Accept': 'application/json' };
        const resServidor = await fetch(`${API_BASE}/server`, { headers }).catch(() => null);
        if (!resServidor || !resServidor.ok) return;
        const dataServ = await resServidor.json();
        const tipoSesionActual = String(dataServ?.session?.type || dataServ?.session?.name || 'PRACTICE').toUpperCase();

        if (sesionAnteriorEnVivo && sesionAnteriorEnVivo !== tipoSesionActual) {
          // El servidor cambió de sesión (Ej: Práctica -> Qualy o Qualy -> Carrera)
          // Guardamos automáticamente los resultados de la sesión que acaba de terminar
          await capturarYGuardarSesion(sesionAnteriorEnVivo, dataServ);
          cargarResultadosSupabase();
        }
        setSesionAnteriorEnVivo(tipoSesionActual);
      } catch (err) {
        console.error("Error monitoreando sesión:", err);
      }
    }, 5000);

    return () => clearInterval(intervaloMonitoreo);
  }, [sesionAnteriorEnVivo]);

  async function cargarResultadosSupabase() {
    setCargando(true);
    const { data, error } = await supabase
      .from('resultados_sesiones')
      .select('*')
      .order('fecha', { ascending: false });

    if (error) {
      console.error('Error al cargar resultados:', error.message);
    } else if (data) {
      setResultadosGuardados(data);
      if (data.length > 0 && !sesionSeleccionada) {
        setSesionSeleccionada(data[0]);
      }
    }
    setCargando(false);
  }

  async function capturarYGuardarSesion(tipoSesion, datosServ) {
    try {
      const headers = { 'Authorization': `Bearer ${TOKEN}`, 'Accept': 'application/json' };
      const resJugadores = await fetch(`${API_BASE}/players`, { headers }).catch(() => null);
      if (!resJugadores || !resJugadores.ok) return;
      const dataJ = await resJugadores.json();

      let lista = [];
      if (Array.isArray(dataJ)) lista = dataJ;
      else if (dataJ?.data && Array.isArray(dataJ.data)) lista = dataJ.data;
      else if (dataJ?.players && Array.isArray(dataJ.players)) lista = dataJ.players;
      else if (dataJ && typeof dataJ === 'object') lista = Object.values(dataJ);

      if (lista.length === 0) return;

      const pistaNombre = datosServ?.track?.name || datosServ?.track || 'AUTÓDROMO';

      const datosProcesados = lista.map((j, idx) => ({
        pos: idx + 1,
        nombre: j?.name || 'PILOTO',
        auto: j?.car?.name || 'AUTO',
        bestLapMs: Number(j?.bestLapMs) || 0,
        lastLapMs: Number(j?.lastLapMs) || 0,
        vueltas: Number(j?.laps) || 0,
        sectores: obtenerSectoresJugador(j),
        posicionLargada: j?.startingPosition !== undefined ? Number(j.startingPosition) : (idx + 1)
      }));

      await supabase.from('resultados_sesiones').insert([{
        sesion_tipo: tipoSesion,
        pista: pistaNombre,
        datos_json: datosProcesados
      }]);

      console.log(`¡Resultados de ${tipoSesion} guardados automáticamente!`);
    } catch (err) {
      console.error("Error al autoguardar sesión:", err);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-wrc text-white uppercase">
      <div>
        <h2 className="font-wrc text-3xl text-amber-400 tracking-wide">RESULTADOS DE SESIONES</h2>
        <p className="text-neutral-300 text-xs font-wrc">HISTORIAL AUTOMÁTICO DE PRÁCTICAS, CLASIFICACIONES Y CARRERAS.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LISTA DE SESIONES GUARDADAS */}
        <div className="bg-neutral-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl space-y-2.5">
          <h3 className="text-amber-400 text-xs font-black tracking-wider border-b border-white/10 pb-2">
            SESIONES ARCHIVADAS ({resultadosGuardados.length})
          </h3>

          {cargando ? (
            <p className="text-neutral-400 text-xs text-center py-4">CARGANDO RESULTADOS...</p>
          ) : resultadosGuardados.length === 0 ? (
            <p className="text-neutral-400 text-xs text-center py-6">NO HAY SESIONES GUARDADAS TODAVÍA. SE GUARDARÁN AUTOMÁTICAMENTE AL CAMBIAR DE SESIÓN EN EL SERVIDOR.</p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {resultadosGuardados.map((sesion) => {
                const esActiva = sesionSeleccionada?.id === sesion.id;
                const fechaLegible = new Date(sesion.fecha).toLocaleString();

                return (
                  <div
                    key={sesion.id}
                    onClick={() => setSesionSeleccionada(sesion)}
                    className={`p-3 rounded-xl border transition cursor-pointer flex flex-col gap-1 ${
                      esActiva ? 'bg-amber-500/20 border-amber-500/80 shadow-md' : 'bg-neutral-950/50 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-amber-400 font-black text-xs">{sesion.sesion_tipo}</span>
                      <span className="text-[9px] text-neutral-400">{fechaLegible}</span>
                    </div>
                    <span className="text-[11px] text-white truncate">🏁 {sesion.pista}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* DETALLE DE LA SESIÓN SELECCIONADA */}
        <div className="lg:col-span-2 bg-neutral-950/85 backdrop-blur-md border border-white/15 rounded-2xl overflow-hidden shadow-2xl">
          {!sesionSeleccionada ? (
            <div className="p-10 text-center text-neutral-400 text-xs">
              SELECCIONA UNA SESIÓN DE LA IZQUIERDA PARA VER SUS DATOS.
            </div>
          ) : (
            <div>
              <div className="bg-gradient-to-r from-amber-500/20 via-neutral-900 to-neutral-900 px-4 py-3 border-b border-amber-500/30 flex justify-between items-center">
                <div>
                  <span className="bg-amber-500 text-black text-[10px] font-black px-2 py-0.5 rounded">
                    {sesionSeleccionada.sesion_tipo}
                  </span>
                  <h3 className="text-white text-xs tracking-wider font-black mt-1">
                    🏁 {sesionSeleccionada.pista}
                  </h3>
                </div>
                <span className="text-[10px] text-neutral-400">
                  {new Date(sesionSeleccionada.fecha).toLocaleString()}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
                  <thead>
                    <tr className="border-b border-white/15 text-amber-400 tracking-wider bg-black/70">
                      <th className="py-2.5 px-3 text-center w-10">POS</th>
                      {sesionSeleccionada.sesion_tipo.toUpperCase().includes('RACE') && (
                        <th className="py-2.5 px-2 text-center" title="Posiciones ganadas / perdidas respecto a la largada">+/-</th>
                      )}
                      <th className="py-2.5 px-3">PILOTO</th>
                      <th className="py-2.5 px-3">AUTO</th>
                      <th className="py-2.5 px-3 text-center">VUELTAS</th>
                      <th className="py-2.5 px-2 text-center">S1</th>
                      <th className="py-2.5 px-2 text-center">S2</th>
                      <th className="py-2.5 px-2 text-center">S3</th>
                      <th className="py-2.5 px-3 text-right text-purple-400">MEJOR TIEMPO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {sesionSeleccionada.datos_json.map((piloto, idx) => {
                      const posActual = piloto.pos || idx + 1;
                      const posLargada = piloto.posicionLargada || posActual;
                      const diferenciaPos = posLargada - posActual; // Positivo = ganó posiciones, Negativo = perdió

                      return (
                        <tr key={idx} className="hover:bg-white/5 transition">
                          <td className="py-2.5 px-3 text-center font-bold text-amber-400">#{posActual}</td>
                          
                          {sesionSeleccionada.sesion_tipo.toUpperCase().includes('RACE') && (
                            <td className="py-2.5 px-2 text-center font-mono">
                              {diferenciaPos > 0 ? (
                                <span className="text-emerald-400 font-bold">+{diferenciaPos}</span>
                              ) : diferenciaPos < 0 ? (
                                <span className="text-red-400 font-bold">{diferenciaPos}</span>
                              ) : (
                                <span className="text-neutral-500">=</span>
                              )}
                            </td>
                          )}

                          <td className="py-2.5 px-3 font-bold text-white">{piloto.nombre}</td>
                          <td className="py-2.5 px-3 text-neutral-300 text-[11px]">{piloto.auto}</td>
                          <td className="py-2.5 px-3 text-center text-white">{piloto.vueltas}</td>
                          
                          <td className="py-2.5 px-2 text-center font-mono text-[11px] text-neutral-300">
                            {formatearSector(piloto.sectores?.[0])}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono text-[11px] text-neutral-300">
                            {formatearSector(piloto.sectores?.[1])}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono text-[11px] text-neutral-300">
                            {formatearSector(piloto.sectores?.[2])}
                          </td>

                          <td className="py-2.5 px-3 text-right font-mono font-black text-purple-400 bg-purple-950/20">
                            {formatearTiempo(piloto.bestLapMs)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}