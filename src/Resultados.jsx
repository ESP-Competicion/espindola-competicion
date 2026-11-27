import { useState, useEffect } from 'react';
import { api } from './api';

const API_BASE = "https://br.assettohosting.com:10314/api/v1";
const TOKEN = import.meta.env.VITE_ASSETTO_API_TOKEN || "ahsm_0a5fdc7e3c9fa77fdba10849c6f9855212f3c4c4d403577";

const formatearTiempo = (ms) => {
  if (!ms || ms <= 0 || isNaN(ms)) return "--:--.---";
  const minutos = Math.floor(ms / 60000);
  const segundos = Math.floor((ms % 60000) / 1000);
  const milesimas = Math.floor(ms % 1000);
  return `${minutos > 0 ? minutos + ':' : ''}${String(segundos).padStart(minutos > 0 ? 2 : 1, '0')}.${String(milesimas).padStart(3, '0')}`;
};

function leerUsuarioLocal() {
  try {
    const raw = localStorage.getItem('esp_sesion_usuario');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clasificarTipoSesionPista(tipoRaw, carrerasYaGuardadasEnFecha = 0) {
  const upper = String(tipoRaw || 'PRACTICE').toUpperCase();
  if (upper.includes('QUALY') || upper.includes('QUALIF')) return 'QUALY';
  if (upper.includes('FINAL 2') || upper.includes('RACE 2') || upper.includes('R2')) return 'FINAL 2';
  if (upper.includes('FINAL 1') || upper.includes('RACE 1') || upper.includes('R1')) return 'FINAL 1';
  if (upper.includes('RACE') || upper.includes('FINAL')) {
    return carrerasYaGuardadasEnFecha >= 1 ? 'FINAL 2' : 'FINAL 1';
  }
  return upper;
}

export default function Resultados() {
  const [resultadosGuardados, setResultadosGuardados] = useState([]);
  const [sesionSeleccionada, setSesionSeleccionada] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [usuarioActual, setUsuarioActual] = useState(() => leerUsuarioLocal());
  const [guardandoManual, setGuardandoManual] = useState(false);

  async function resolverContextoPistaYSumarPuntos(tipoSesionRaw, datosProcesados) {
    try {
      const { data: campeonatos } = await api.from('campeonatos').select({
        order: 'created_at.desc'
      });

      const campPista = Array.isArray(campeonatos)
        ? campeonatos.find(c => String(c.modalidad || '').toLowerCase() === 'pista')
        : null;

      if (!campPista) {
        return { campeonato_id: null, evento_id: null, sesion_tipo: tipoSesionRaw };
      }

      const { data: fechas } = await api.from('campeonato_fechas').select({
        eq_campeonato_id: campPista.id,
        order: 'numero_fecha.asc'
      });

      const fechaActiva = Array.isArray(fechas) && fechas.length > 0
        ? (fechas.find(f => String(f.estado || '').toLowerCase() !== 'finalizada') || fechas[fechas.length - 1])
        : null;

      const { data: eventos } = await api.from('eventos').select({
        eq_campeonato_id: campPista.id,
        order: 'created_at.desc'
      });

      const eventoActivo = Array.isArray(eventos) && eventos.length > 0
        ? (eventos.find(ev => !ev.archivado) || eventos[0])
        : null;

      const { data: sesionesPrevias } = await api.from('resultados_sesiones').select({
        eq_campeonato_id: campPista.id
      });

      const carrerasPrevias = Array.isArray(sesionesPrevias)
        ? sesionesPrevias.filter(s => ['FINAL 1', 'FINAL 2', 'RACE'].includes(String(s.sesion_tipo || '').toUpperCase())).length
        : 0;

      const sesionNormalizada = clasificarTipoSesionPista(tipoSesionRaw, carrerasPrevias);

      if (fechaActiva && ['QUALY', 'FINAL 1', 'FINAL 2'].includes(sesionNormalizada)) {
        const escala =
          sesionNormalizada === 'QUALY'
            ? (Array.isArray(campPista.puntos_qualy) ? campPista.puntos_qualy : [10, 8, 6, 4, 2])
            : sesionNormalizada === 'FINAL 2'
              ? (Array.isArray(campPista.puntos_final2) ? campPista.puntos_final2 : [25, 18, 15, 12, 10, 8, 6, 4, 2, 1])
              : (Array.isArray(campPista.puntos_final1) ? campPista.puntos_final1 : [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]);

        const ordenados = [...datosProcesados].sort((a, b) => {
          if (sesionNormalizada === 'QUALY') {
            const msA = Number(a.bestLapMs) || Infinity;
            const msB = Number(b.bestLapMs) || Infinity;
            return msA - msB;
          }
          return (Number(a.pos) || 999) - (Number(b.pos) || 999);
        });

        const { data: existentes } = await api.from('campeonato_resultados_fecha').select({
          eq_fecha_id: fechaActiva.id
        });
        const mapaExistentes = new Map(
          (Array.isArray(existentes) ? existentes : []).map(r => [String(r.piloto_nombre || '').trim().toUpperCase(), r])
        );

        for (let idx = 0; idx < ordenados.length; idx++) {
          const pilotoNombre = String(ordenados[idx]?.nombre || '').trim().toUpperCase();
          if (!pilotoNombre) continue;

          const ptsGanados = idx < escala.length ? (Number(escala[idx]) || 0) : 0;
          const previo = mapaExistentes.get(pilotoNombre);

          const ptsQ = sesionNormalizada === 'QUALY' ? ptsGanados : (Number(previo?.puntos_qualy) || 0);
          const ptsF1 = sesionNormalizada === 'FINAL 1' ? ptsGanados : (Number(previo?.puntos_final1) || 0);
          const ptsF2 = sesionNormalizada === 'FINAL 2' ? ptsGanados : (Number(previo?.puntos_final2) || 0);
          const ptsT1 = Number(previo?.puntos_tramo1) || 0;
          const ptsT2 = Number(previo?.puntos_tramo2) || 0;
          const ptsT3 = Number(previo?.puntos_tramo3) || 0;
          const ptsT4 = Number(previo?.puntos_tramo4) || 0;
          const total = ptsQ + ptsF1 + ptsF2 + ptsT1 + ptsT2 + ptsT3 + ptsT4;

          const payload = {
            puntos_qualy: ptsQ,
            puntos_final1: ptsF1,
            puntos_final2: ptsF2,
            puntos_tramo1: ptsT1,
            puntos_tramo2: ptsT2,
            puntos_tramo3: ptsT3,
            puntos_tramo4: ptsT4,
            puntos_total: total
          };

          if (previo) {
            await api.from('campeonato_resultados_fecha').update(payload, { eq_id: previo.id });
          } else {
            await api.from('campeonato_resultados_fecha').insert([{
              fecha_id: fechaActiva.id,
              piloto_nombre: pilotoNombre,
              ...payload
            }]);
          }
        }
      }

      return {
        campeonato_id: campPista.id,
        evento_id: eventoActivo?.id || null,
        sesion_tipo: sesionNormalizada
      };
    } catch (err) {
      console.error('Error al procesar puntos de pista:', err);
      return { campeonato_id: null, evento_id: null, sesion_tipo: tipoSesionRaw };
    }
  }

  useEffect(() => {
    setUsuarioActual(leerUsuarioLocal());
    cargarResultadosAPI();

    let ultimaSesionDetectada = null;
    let datosUltimosJugadores = [];

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

        if (ultimaSesionDetectada !== tipoSesionActual) {
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

            const ctxPista = await resolverContextoPistaYSumarPuntos(ultimaSesionDetectada, datosProcesados);

            const { error } = await api.from('resultados_sesiones').insert([{
              sesion_tipo: ctxPista.sesion_tipo,
              pista: pistaNombre,
              campeonato_id: ctxPista.campeonato_id,
              evento_id: ctxPista.evento_id,
              datos_json: datosProcesados
            }]);

            if (!error) {
              cargarResultadosAPI();
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

  const esAdmin = usuarioActual?.email === 'leosimracingok@gmail.com';

  async function cargarResultadosAPI() {
    setCargando(true);
    const { data, error } = await api.from('resultados_sesiones').select({
      order: 'fecha.desc'
    });

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

      const ctxPista = await resolverContextoPistaYSumarPuntos(tipoSesion, datosProcesados);

      const { error } = await api.from('resultados_sesiones').insert([{
        sesion_tipo: ctxPista.sesion_tipo,
        pista: pistaNombre,
        campeonato_id: ctxPista.campeonato_id,
        evento_id: ctxPista.evento_id,
        datos_json: datosProcesados
      }]);

      if (error) {
        alert('Error al guardar: ' + error.message);
      } else {
        alert(`¡Resultados de ${ctxPista.sesion_tipo} guardados exitosamente!`);
        cargarResultadosAPI();
      }
    } catch (err) {
      console.error("Error al guardar manualmente:", err);
    } finally {
      setGuardandoManual(false);
    }
  }

  async function eliminarResultado(id) {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;
    const { error } = await api.from('resultados_sesiones').eq('id', id).delete();
    if (error) {
      alert('Error al eliminar registro: ' + error.message);
      return;
    }
    setSesionSeleccionada(null);
    await cargarResultadosAPI();
  }

  const listaPilotos = Array.isArray(sesionSeleccionada?.datos_json) ? sesionSeleccionada.datos_json : [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-wrc text-white uppercase">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-wrc text-3xl text-[#38bdf8] tracking-wide">RESULTADOS DE SESIONES</h2>
          <p className="text-neutral-300 text-xs font-wrc">HISTORIAL AUTOMÁTICO DE PRÁCTICAS, CLASIFICACIONES Y CARRERAS.</p>
        </div>

        {esAdmin && (
          <button
            onClick={guardarResultadosManualmente}
            disabled={guardandoManual}
            className={`bg-[#38bdf8] hover:bg-[#7dd3fc] text-slate-950 font-wrc text-xs font-black px-4 py-2.5 rounded-xl transition shadow cursor-pointer uppercase ${guardandoManual ? 'opacity-50 pointer-events-none' : ''}`}
          >
            {guardandoManual ? 'GUARDANDO...' : '📥 FORZAR GUARDAR SESIÓN ACTUAL'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="bg-neutral-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl space-y-2.5">
          <h3 className="text-[#38bdf8] text-xs font-black tracking-wider border-b border-white/10 pb-2">
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
                      esActiva ? 'bg-[#38bdf8]/20 border-[#38bdf8]/80 shadow-md' : 'bg-neutral-950/50 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[#38bdf8] font-black text-xs">{sesion.sesion_tipo}</span>
                      <span className="text-[9px] text-neutral-400">{fechaLegible}</span>
                    </div>
                    <span className="text-[11px] text-white truncate">🏁 {sesion.pista}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-neutral-950/85 backdrop-blur-md border border-white/15 rounded-2xl overflow-hidden shadow-2xl">
          {!sesionSeleccionada ? (
            <div className="p-10 text-center text-neutral-400 text-xs">
              SELECCIONA UNA SESIÓN DE LA IZQUIERDA PARA VER SUS DATOS.
            </div>
          ) : (
            <div>
              <div className="bg-gradient-to-r from-[#38bdf8]/20 via-neutral-900 to-neutral-900 px-4 py-3 border-b border-[#38bdf8]/30 flex justify-between items-center">
                <div>
                  <span className="bg-[#38bdf8] text-slate-950 text-[10px] font-black px-2 py-0.5 rounded">
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
                    <tr className="border-b border-white/15 text-[#38bdf8] tracking-wider bg-black/70">
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
                    {listaPilotos.map((piloto, idx) => {
                      const posActual = piloto.pos || idx + 1;
                      const posLargada = piloto.posicionLargada || posActual;
                      const diferenciaPos = posLargada - posActual;

                      return (
                        <tr key={idx} className="hover:bg-white/5 transition">
                          <td className="py-2.5 px-3 text-center font-bold text-[#38bdf8]">#{posActual}</td>

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