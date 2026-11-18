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

export default function Resultados() {
  const [resultadosGuardados, setResultadosGuardados] = useState([]);
  const [sesionSeleccionada, setSesionSeleccionada] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [guardandoManual, setGuardandoManual] = useState(false);

  useEffect(() => {
    verificarUsuario();
    cargarResultadosSupabase();

    let ultimaSesionDetectada = null;
    let datosUltimosJugadores = [];

    // MONITOREO INTELIGENTE DE CAMBIO DE SESIÓN
    const intervaloAutoGuardado = setInterval(async () => {
      try {
        const headers = { 'Authorization': `Bearer ${TOKEN}`, 'Accept': 'application/json' };
        
        const resServidor = await fetch(`${API_BASE}/server`, { headers }).catch(() => null);
        if (!resServidor || !resServidor.ok) return;
        const datosServ = await resServidor.json();
        
        const tipoSesionActual = String(
          datosServ?.session?.type || 
          datosServ?.session?.name || 
          datosServ?.session || 
          'PRACTICE'
        ).toUpperCase();
        
        const pistaNombre = datosServ?.track?.name || datosServ?.track || 'AUTÓDROMO';

        const resJugadores = await fetch(`${API_BASE}/players`, { headers }).catch(() => null);
        if (!resJugadores || !resJugadores.ok) return;
        const dataJ = await resJugadores.json();

        let lista = [];
        if (Array.isArray(dataJ)) lista = dataJ;
        else if (dataJ?.data && Array.isArray(dataJ.data)) lista = dataJ.data;
        else if (dataJ?.players && Array.isArray(dataJ.players)) lista = dataJ.players;
        else if (dataJ && typeof dataJ === 'object') lista = Object.values(dataJ);

        if (!ultimaSesionDetectada) {
          ultimaSesionDetectada = tipoSesionActual;
          if (lista.length > 0) datosUltimosJugadores = lista;
          return;
        }

        // SI CAMBIA DE SESIÓN (Ej: Practice -> Qualifying)
        if (ultimaSesionDetectada !== tipoSesionActual) {
          console.log(`[AutoGuardado] Transición detectada: ${ultimaSesionDetectada} ➔ ${tipoSesionActual}`);

          if (datosUltimosJugadores.length > 0) {
            const datosProcesados = datosUltimosJugadores.map((j, idx) => ({
              pos: idx + 1,
              nombre: j?.name || 'PILOTO',
              auto: j?.car?.name || 'AUTO',
              bestLapMs: Number(j?.bestLapMs) || 0,
              lastLapMs: Number(j?.lastLapMs) || 0,
              vueltas: Number(j?.laps) || 0,
              posicionLargada: j?.startingPosition !== undefined ? Number(j.startingPosition) : (idx + 1)
            }));

            // Guardamos automáticamente la sesión que acaba de terminar
            const { error } = await supabase.from('resultados_sesiones').insert([{
              sesion_tipo: ultimaSesionDetectada,
              pista: pistaNombre,
              datos_json: datosProcesados
            }]);

            if (!error) {
              cargarResultadosSupabase();
              console.log(`[AutoGuardado] ¡Sesión ${ultimaSesionDetectada} archivada con éxito en Supabase!`);
            }
          }

          ultimaSesionDetectada = tipoSesionActual;
          datosUltimosJugadores = [];
        }

        if (lista.length > 0) {
          datosUltimosJugadores = lista;
        }
      } catch (err) {
        console.error("Error en autoguardado:", err);
      }
    }, 5000);

    return () => clearInterval(intervaloAutoGuardado);
  }, []);

  async function verificarUsuario() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUsuarioActual(session.user);
    }
  }

  const esAdmin = usuarioActual?.email === 'leosimracingok@gmail.com';

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

  // GUARDADO MANUAL RÁPIDO
  async function guardarResultadosManualmente() {
    try {
      setGuardandoManual(true);
      const headers = { 'Authorization': `Bearer ${TOKEN}`, 'Accept': 'application/json' };
      const resServidor = await fetch(`${API_BASE}/server`, { headers }).catch(() => null);
      if (!resServidor || !resServidor.ok) {
        alert('No se pudo conectar con el servidor.');
        setGuardandoManual(false);
        return;
      }
      const datosServ = await resServidor.json();
      const tipoSesion = String(datosServ?.session?.type || datosServ?.session?.name || 'PRACTICE').toUpperCase();
      const pistaNombre = datosServ?.track?.name || datosServ?.track || 'AUTÓDROMO';

      const resJugadores = await fetch(`${API_BASE}/players`, { headers }).catch(() => null);
      if (!resJugadores || !resJugadores.ok) {
        alert('No se pudieron obtener los jugadores.');
        setGuardandoManual(false);
        return;
      }
      const dataJ = await resJugadores.json();

      let lista = [];
      if (Array.isArray(dataJ)) lista = dataJ;
      else if (dataJ?.data && Array.isArray(dataJ.data)) lista = dataJ.data;
      else if (dataJ?.players && Array.isArray(dataJ.players)) lista = dataJ.players;
      else if (dataJ && typeof dataJ === 'object') lista = Object.values(dataJ);

      if (lista.length === 0) {
        alert('No hay pilotos registrados en pista.');
        setGuardandoManual(false);
        return;
      }

      const datosProcesados = lista.map((j, idx) => ({
        pos: idx + 1,
        nombre: j?.name || 'PILOTO',
        auto: j?.car?.name || 'AUTO',
        bestLapMs: Number(j?.bestLapMs) || 0,
        lastLapMs: Number(j?.lastLapMs) || 0,
        vueltas: Number(j?.laps) || 0,
        posicionLargada: j?.startingPosition !== undefined ? Number(j.startingPosition) : (idx + 1)
      }));

      const { error } = await supabase.from('resultados_sesiones').insert([{
        sesion_tipo: tipoSesion,
        pista: pistaNombre,
        datos_json: datosProcesados
      }]);

      if (error) {
        alert('Error al guardar: ' + error.message);
      } else {
        alert(`¡Resultados de ${tipoSesion} guardados exitosamente!`);
        cargarResultadosSupabase();
      }
    } catch (err) {
      console.error("Error al guardar manualmente:", err);
    } finally {
      setGuardandoManual(false);
    }
  }

  async function eliminarResultado(id) {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;
    const { error } = await supabase.from('resultados_sesiones').delete().eq('id', id);
    if (!error) {
      cargarResultadosSupabase();
      setSesionSeleccionada(null);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-wrc text-white uppercase">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-wrc text-3xl text-amber-400 tracking-wide">RESULTADOS DE SESIONES</h2>
          <p className="text-neutral-300 text-xs font-wrc">HISTORIAL AUTOMÁTICO DE PRÁCTICAS, CLASIFICACIONES Y CARRERAS.</p>
        </div>

        {esAdmin && (
          <button
            onClick={guardarResultadosManualmente}
            disabled={guardandoManual}
            className={`bg-emerald-500 hover:bg-emerald-400 text-black font-wrc text-xs font-black px-4 py-2.5 rounded-xl transition shadow cursor-pointer uppercase ${guardandoManual ? 'opacity-50 pointer-events-none' : ''}`}
          >
            {guardandoManual ? 'GUARDANDO...' : '📥 FORZAR GUARDAR SESIÓN ACTUAL'}
          </button>
        )}
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
            <p className="text-neutral-400 text-xs text-center py-6">NO HAY SESIONES GUARDADAS TODAVÍA. SE ARCHIVARÁN SOLAS AL CAMBIAR DE FASE.</p>
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
                
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-neutral-400">
                    {new Date(sesionSeleccionada.fecha).toLocaleString()}
                  </span>
                  {esAdmin && (
                    <button
                      onClick={() => eliminarResultado(sesionSeleccionada.id)}
                      className="bg-red-500/10 text-red-400 hover:bg-red-500/20 px-2.5 py-1 rounded text-[10px] border border-red-500/30 cursor-pointer"
                    >
                      🗑️ ELIMINAR
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
                  <thead>
                    <tr className="border-b border-white/15 text-amber-400 tracking-wider bg-black/70">
                      <th className="py-2.5 px-3 text-center w-10">POS</th>
                      {sesionSeleccionada.sesion_tipo.toUpperCase().includes('RACE') && (
                        <th className="py-2.5 px-2 text-center" title="Posiciones ganadas / perdidas">+/-</th>
                      )}
                      <th className="py-2.5 px-3">PILOTO</th>
                      <th className="py-2.5 px-3">AUTO</th>
                      <th className="py-2.5 px-3 text-center">VUELTAS</th>
                      <th className="py-2.5 px-3 text-right text-purple-400">MEJOR TIEMPO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {sesionSeleccionada.datos_json.map((piloto, idx) => {
                      const posActual = piloto.pos || idx + 1;
                      const posLargada = piloto.posicionLargada || posActual;
                      const diferenciaPos = posLargada - posActual;

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