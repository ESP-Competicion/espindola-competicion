import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const API_BASE_ST = "https://br.assettohosting.com:10314/api/v1";
const TOKEN_ST = import.meta.env.VITE_ASSETTO_API_TOKEN || "ahsm_0a5fdc7e3c9fa77fdba10849c6f9855212f3c4c4d403577";

const extraerTexto = (valor, porDefecto = '---') => {
  if (valor === null || valor === undefined || valor === '') return porDefecto;
  if (typeof valor === 'string' || typeof valor === 'number') return String(valor);
  if (typeof valor === 'object') {
    return valor.name || valor.type || valor.model || valor.title || porDefecto;
  }
  return porDefecto;
};

export default function ResultadosRallyServer({ esAdmin }) {
  const [vistaPrincipal, setVistaPrincipal] = useState('rally'); // 'server' o 'rally'
  const [subVistaRally, setSubVistaRally] = useState('tramo1'); // 'tramo1', 'tramo2', 'tramo3', 'tramo4', 'general'
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('TODAS');
  
  const [sesionesServidor, setSesionesServidor] = useState([]);
  const [sesionActivaId, setSesionActivaId] = useState(null);
  const [guardandoManual, setGuardandoManual] = useState(false);

  useEffect(() => {
    cargarSesionesServidor();
  }, []);

  async function cargarSesionesServidor() {
    const { data } = await supabase
      .from('resultados_sesiones')
      .select('*')
      .order('created_at', { ascending: false }); // Ordenadas con la más reciente primero

    if (data && data.length > 0) {
      setSesionesServidor(data);
      if (!sesionActivaId) {
        setSesionActivaId(data[0].id);
      }
    } else {
      setSesionesServidor([]);
      setSesionActivaId(null);
    }
  }

  // FUNCIÓN PARA FORZAR EL GUARDADO MANUAL (MÉTODO LIMPIO Y ROBUSTO)
  async function forzarGuardadoManual() {
    try {
      setGuardandoManual(true);
      const headers = { 
        'Authorization': `Bearer ${TOKEN_ST}`,
        'Accept': 'application/json'
      };

      const resServidor = await fetch(`${API_BASE_ST}/server`, { headers }).catch(() => null);
      if (!resServidor || !resServidor.ok) {
        alert('Error: No se pudo conectar con el servidor de Assetto Hosting.');
        return;
      }
      const datosServ = await resServidor.json();

      const tipoSesionActual = extraerTexto(
        datosServ?.session?.type || 
        datosServ?.session?.name || 
        datosServ?.session, 
        'PRACTICE'
      ).toUpperCase();

      const pistaNombre = extraerTexto(datosServ?.track?.name || datosServ?.track, 'TRAMO DE RALLY');

      const resJugadores = await fetch(`${API_BASE_ST}/players`, { headers }).catch(() => null);
      if (!resJugadores || !resJugadores.ok) {
        alert('Error: No se pudieron obtener los jugadores actuales de la pista.');
        return;
      }
      const dataJ = await resJugadores.json();

      let lista = [];
      if (Array.isArray(dataJ)) {
        lista = dataJ;
      } else if (dataJ?.data && Array.isArray(dataJ.data)) {
        lista = dataJ.data;
      } else if (dataJ?.players && Array.isArray(dataJ.players)) {
        lista = dataJ.players;
      } else if (dataJ && typeof dataJ === 'object') {
        lista = Object.values(dataJ);
      }

      const jugadoresFiltrados = lista.filter(j => typeof j === 'object' && j !== null);

      if (jugadoresFiltrados.length === 0) {
        alert('Atención: No hay pilotos activos en este momento en la pista para guardar.');
        return;
      }

      const datosProcesados = jugadoresFiltrados.map((j, idx) => ({
        pos: idx + 1,
        nombre: extraerTexto(j?.name, 'PILOTO'),
        auto: extraerTexto(j?.car?.name, 'AUTO'),
        categoria: extraerTexto(j?.carClass || j?.categoria, 'GENERAL'),
        bestLapMs: Number(j?.bestLapMs) || 0,
        lastLapMs: Number(j?.lastLapMs) || 0,
        vueltas: Number(j?.laps) || 0,
        sectores: j?.lastLap?.sectors || [0, 0, 0],
        posicionLargada: j?.startingPosition !== undefined ? Number(j.startingPosition) : (idx + 1)
      }));

      const { error } = await supabase.from('resultados_sesiones').insert([{
        sesion_tipo: tipoSesionActual,
        pista: pistaNombre,
        datos_json: datosProcesados
      }]);

      if (error) {
        alert('Error al guardar en Supabase: ' + error.message);
      } else {
        alert('¡Sesión y tiempos guardados exitosamente en la base de datos!');
        await cargarSesionesServidor(); // Recarga inmediata para actualizar la interfaz al instante
      }
    } catch (err) {
      console.error("Error al forzar guardado:", err);
      alert('Ocurrió un error inesperado al forzar el guardado.');
    } finally {
      setGuardandoManual(false);
    }
  }

  function formatearMilisegundos(ms) {
    if (!ms || isNaN(ms) || ms === 0) return "00:00.000";
    const totalSeconds = ms / 1000;
    const mins = Math.floor(totalSeconds / 60);
    const secs = (totalSeconds % 60).toFixed(3);
    const secsFormatted = secs < 10 ? `0${secs}` : secs;
    return `${mins}:${secsFormatted}`;
  }

  function convertirMsASegundos(ms) {
    return (Number(ms) || 0) / 1000;
  }

  // Extraer categorías únicas de las sesiones guardadas
  const categoriasDisponibles = ['TODAS'];
  sesionesServidor.forEach(s => {
    if (s.datos_json && Array.isArray(s.datos_json)) {
      s.datos_json.forEach(j => {
        const cat = j.categoria || j.carClass || 'GENERAL';
        if (!categoriasDisponibles.includes(cat.toUpperCase())) {
          categoriasDisponibles.push(cat.toUpperCase());
        }
      });
    }
  });

  // Mapear las sesiones como Tramos de Rally
  function obtenerSesionPorTramo(keyTramo) {
    if (keyTramo === 'tramo1') return sesionesServidor[3] || sesionesServidor[0] || null; // O ajustá según orden de tramos guardados
    if (keyTramo === 'tramo2') return sesionesServidor[2] || null;
    if (keyTramo === 'tramo3') return sesionesServidor[1] || null;
    if (keyTramo === 'tramo4') return sesionesServidor[0] || null;
    return sesionesServidor[0] || null;
  }

  // Datos para la columna izquierda (Tiempo del Tramo actual seleccionado)
  function obtenerDatosTramoActual() {
    const sesion = obtenerSesionPorTramo(subVistaRally === 'general' ? 'tramo4' : subVistaRally);
    if (!sesion || !sesion.datos_json) return [];

    let lista = sesion.datos_json.map((j, idx) => {
      const cat = (j.categoria || j.carClass || 'GENERAL').toUpperCase();
      const mejorMs = Number(j.bestLapMs || j.bestLap || j.tiempoMs || j.lastLapMs || 0);
      const nombrePiloto = j.nombre || j.driver || j.name || 'PILOTO';
      const nombreAuto = typeof j.auto === 'object' ? (j.auto.name || 'AUTO') : (j.auto || j.car || 'AUTO');

      return {
        pos: idx + 1,
        piloto: nombrePiloto,
        auto: nombreAuto,
        categoria: cat,
        tiempoMs: mejorMs,
        tiempoStr: formatearMilisegundos(mejorMs),
        segundos: convertirMsASegundos(mejorMs)
      };
    });

    if (categoriaSeleccionada !== 'TODAS') {
      lista = lista.filter(p => p.categoria === categoriaSeleccionada);
    }

    lista.sort((a, b) => {
      if (a.segundos === 0) return 1;
      if (b.segundos === 0) return -1;
      return a.segundos - b.segundos;
    });

    return lista.map((p, idx) => {
      const liderSeg = lista[0]?.segundos || 0;
      const difLider = idx === 0 ? 0 : p.segundos - liderSeg;
      const difAnt = idx === 0 ? 0 : p.segundos - lista[idx - 1].segundos;

      return {
        ...p,
        pos: idx + 1,
        difLider: idx === 0 ? '0.0' : `+${difLider.toFixed(2)}`,
        difAnterior: idx === 0 ? '-' : `+${difAnt.toFixed(2)}`
      };
    });
  }

  // Datos para la columna derecha (Clasificación General Acumulada sumando los tramos)
  function obtenerClasificacionGeneral() {
    let cantTramos = 4;
    if (subVistaRally === 'tramo1') cantTramos = 1;
    if (subVistaRally === 'tramo2') cantTramos = 2;
    if (subVistaRally === 'tramo3') cantTramos = 3;
    if (subVistaRally === 'tramo4' || subVistaRally === 'general') cantTramos = sesionesServidor.length > 0 ? sesionesServidor.length : 1;

    const acumulados = {};

    for (let i = 0; i < Math.min(cantTramos, sesionesServidor.length); i++) {
      const ses = sesionesServidor[i];
      if (ses && ses.datos_json && Array.isArray(ses.datos_json)) {
        ses.datos_json.forEach(j => {
          const nombre = (j.nombre || j.driver || j.name || 'PILOTO').toUpperCase();
          const auto = typeof j.auto === 'object' ? (j.auto.name || 'AUTO') : (j.auto || j.car || 'AUTO');
          const cat = (j.categoria || j.carClass || 'GENERAL').toUpperCase();
          const ms = Number(j.bestLapMs || j.bestLap || j.tiempoMs || j.lastLapMs || 0);

          if (!acumulados[nombre]) {
            acumulados[nombre] = { piloto: nombre, auto, categoria: cat, totalMs: 0 };
          }
          acumulados[nombre].totalMs += ms;
        });
      }
    }

    let listaGen = Object.values(acumulados);

    if (categoriaSeleccionada !== 'TODAS') {
      listaGen = listaGen.filter(p => p.categoria === categoriaSeleccionada);
    }

    listaGen.sort((a, b) => a.totalMs - b.totalMs);

    return listaGen.map((p, idx) => {
      const totalSeg = convertirMsASegundos(p.totalMs);
      const liderSeg = listaGen.length > 0 ? convertirMsASegundos(listaGen[0].totalMs) : 0;
      const difLider = idx === 0 ? 0 : totalSeg - liderSeg;
      const difAnt = idx === 0 ? 0 : totalSeg - convertirMsASegundos(listaGen[idx - 1].totalMs);

      return {
        pos: idx + 1,
        piloto: p.piloto,
        auto: p.auto,
        tiempoTotal: formatearMilisegundos(p.totalMs),
        difLider: idx === 0 ? '0.0' : `+${difLider.toFixed(2)}`,
        difAnterior: idx === 0 ? '-' : `+${difAnt.toFixed(2)}`
      };
    });
  }

  const datosTramo = obtenerDatosTramoActual();
  const datosGeneral = obtenerClasificacionGeneral();
  const sesionActualObj = sesionesServidor.find(s => s.id === sesionActivaId);

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-wrc text-white uppercase p-4">
      
      {/* BOTONES SUPERIORES PRINCIPALES */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-neutral-900/60 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVistaPrincipal('server')}
            className={`px-6 py-2.5 rounded-xl font-black text-xs tracking-wider transition cursor-pointer ${
              vistaPrincipal === 'server'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-neutral-950/80 text-neutral-400 hover:text-white border border-white/5'
            }`}
          >
            RESULTADOS SERVER
          </button>
          <button
            onClick={() => setVistaPrincipal('rally')}
            className={`px-6 py-2.5 rounded-xl font-black text-xs tracking-wider transition cursor-pointer ${
              vistaPrincipal === 'rally'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-neutral-950/80 text-neutral-400 hover:text-white border border-white/5'
            }`}
          >
            RESULTADOS RALLY
          </button>
        </div>

        {/* BOTÓN DE FORZAR GUARDADO MANUAL (SOLO ADMIN) */}
        {esAdmin && (
          <button
            onClick={forzarGuardadoManual}
            disabled={guardandoManual}
            className="bg-red-600 hover:bg-red-500 text-white font-black text-xs px-4 py-2.5 rounded-xl transition shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {guardandoManual ? 'GUARDANDO SESIÓN...' : '⚡ FORZAR GUARDADO DE SESIÓN'}
          </button>
        )}
      </div>

      {/* VISTA 1: RESULTADOS AUTOMÁTICOS DEL SERVIDOR */}
      {vistaPrincipal === 'server' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-neutral-950/90 border border-white/10 rounded-2xl p-5 shadow-2xl">
          <div className="space-y-3 bg-neutral-900/50 p-4 rounded-xl border border-white/5">
            <h3 className="text-xs text-amber-400 font-bold">SESIONES GUARDADAS ({sesionesServidor.length})</h3>
            <div className="space-y-2 max-h-[350px] overflow-y-auto">
              {sesionesServidor.map(s => (
                <div
                  key={s.id}
                  onClick={() => setSesionActivaId(s.id)}
                  className={`p-3 rounded-xl cursor-pointer border transition ${
                    sesionActivaId === s.id
                      ? 'bg-amber-500/15 border-amber-500 text-white'
                      : 'bg-neutral-950 border-white/5 text-neutral-400 hover:bg-white/5'
                  }`}
                >
                  <span className="text-[10px] text-amber-400 font-bold">[{s.sesion_tipo}]</span>
                  <p className="text-xs font-bold text-white truncate">{s.pista}</p>
                  <span className="text-[9px] text-neutral-500">{new Date(s.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 bg-neutral-900/40 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
            {sesionActualObj ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <div>
                    <span className="text-xs text-amber-400 font-bold">{sesionActualObj.sesion_tipo}</span>
                    <h3 className="text-sm font-black text-white">{sesionActualObj.pista}</h3>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono">{new Date(sesionActualObj.created_at).toLocaleString()}</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-neutral-400 border-b border-white/10">
                        <th className="py-2 px-2">POS</th>
                        <th className="py-2 px-2">PILOTO</th>
                        <th className="py-2 px-2">AUTO</th>
                        <th className="py-2 px-2 text-center">VUELTAS</th>
                        <th className="py-2 px-2 text-right">MEJOR TIEMPO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {sesionActualObj.datos_json?.map((j, idx) => (
                        <tr key={idx} className="hover:bg-white/5">
                          <td className="py-2 px-2 text-amber-400 font-bold">#{j.pos || idx + 1}</td>
                          <td className="py-2 px-2 font-bold text-white">{j.nombre || j.driver}</td>
                          <td className="py-2 px-2 text-neutral-300">{j.auto || j.car || 'AUTO'}</td>
                          <td className="py-2 px-2 text-center">{j.vueltas || j.laps || '-'}</td>
                          <td className="py-2 px-2 text-right text-amber-300">{formatearMilisegundos(j.bestLapMs || j.tiempoMs)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-neutral-500 text-xs">
                NO HAY SESIONES REGISTRADAS POR EL SERVIDOR TODAVÍA
              </div>
            )}
          </div>
        </div>
      )}

      {/* VISTA 2: RESULTADOS RALLY CON DOBLE COLUMNA Y DATOS REALES */}
      {vistaPrincipal === 'rally' && (
        <div className="bg-neutral-950/90 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md">
          <div className="bg-neutral-900/90 p-3 border-b border-white/10 flex flex-wrap justify-between items-center gap-2">
            
            {/* FILTRO POR CATEGORÍA */}
            <div className="flex items-center gap-2">
              <select
                value={categoriaSeleccionada}
                onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                className="bg-neutral-950 border border-amber-500/60 text-amber-400 text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer shadow"
              >
                {categoriasDisponibles.map(cat => (
                  <option key={cat} value={cat} className="bg-neutral-900 text-white">
                    CAT: {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* SELECCIÓN DE TRAMOS */}
            <div className="flex flex-wrap items-center gap-1.5 bg-neutral-950/70 p-1 rounded-xl border border-white/5">
              {['tramo1', 'tramo2', 'tramo3', 'tramo4', 'general'].map((tramoKey) => {
                const labels = { tramo1: 'TRAMO 1', tramo2: 'TRAMO 2', tramo3: 'TRAMO 3', tramo4: 'TRAMO 4', general: 'TIEMPO GENERAL' };
                const activo = subVistaRally === tramoKey;
                return (
                  <button
                    key={tramoKey}
                    onClick={() => setSubVistaRally(tramoKey)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition cursor-pointer ${
                      activo
                        ? 'bg-amber-500 text-black shadow'
                        : 'text-neutral-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {labels[tramoKey]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
            
            {/* COLUMNA IZQUIERDA: TIEMPO DEL TRAMO */}
            <div className="p-4 space-y-3 bg-neutral-900/20">
              <div className="flex justify-between items-center border-b border-amber-500/30 pb-2">
                <h4 className="text-amber-400 text-xs font-black">
                  ⏱️ TIEMPO {subVistaRally === 'general' ? 'TRAMO 4 (PARCIAL)' : subVistaRally.toUpperCase()}
                </h4>
                <span className="text-[10px] text-neutral-400">FILTRO: {categoriaSeleccionada}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-neutral-400 border-b border-white/10 text-[10px]">
                      <th className="py-2 px-1 w-8 text-center">POS</th>
                      <th className="py-2 px-2">PILOTO / AUTO</th>
                      <th className="py-2 px-2 text-center font-mono">TIEMPO</th>
                      <th className="py-2 px-2 text-right font-mono">DIF 1º</th>
                      <th className="py-2 px-2 text-right font-mono">DIF ANT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {datosTramo.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-neutral-500 text-xs">
                          NO HAY DATOS EN ESTE TRAMO
                        </td>
                      </tr>
                    ) : (
                      datosTramo.map((dt, idx) => (
                        <tr key={idx} className="hover:bg-white/5">
                          <td className="py-2.5 px-1 text-center font-bold text-amber-400">#{dt.pos}</td>
                          <td className="py-2 px-2">
                            <p className="font-bold text-white">{dt.piloto}</p>
                            <span className="text-[9px] text-neutral-400">{dt.auto}</span>
                          </td>
                          <td className="py-2 px-2 text-center text-white font-bold">{dt.tiempoStr}</td>
                          <td className="py-2 px-2 text-right text-amber-300">{dt.difLider}</td>
                          <td className="py-2 px-2 text-right text-neutral-400">{dt.difAnterior}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* COLUMNA DERECHA: CLASIFICACIÓN GENERAL ACUMULADA */}
            <div className="p-4 space-y-3 bg-neutral-900/40">
              <div className="flex justify-between items-center border-b border-amber-500/30 pb-2">
                <h4 className="text-amber-400 text-xs font-black">
                  🏆 CLASIFICACIÓN GENERAL ACUMULADA
                </h4>
                <span className="text-[10px] text-neutral-400">
                  {subVistaRally === 'general' ? 'TOTAL FINAL' : `HASTA ${subVistaRally.toUpperCase()}`}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-neutral-400 border-b border-white/10 text-[10px]">
                      <th className="py-2 px-1 w-8 text-center">POS</th>
                      <th className="py-2 px-2">PILOTO / AUTO</th>
                      <th className="py-2 px-2 text-center font-mono">TOTAL</th>
                      <th className="py-2 px-2 text-right font-mono">DIF 1º</th>
                      <th className="py-2 px-2 text-right font-mono">DIF ANT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {datosGeneral.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-neutral-500 text-xs">
                          NO HAY TIEMPOS ACUMULADOS
                        </td>
                      </tr>
                    ) : (
                      datosGeneral.map((dg, idx) => {
                        const esPodio = idx < 3;
                        return (
                          <tr key={idx} className={`hover:bg-white/5 ${esPodio ? 'bg-amber-500/5' : ''}`}>
                            <td className="py-2.5 px-1 text-center font-black text-amber-400">#{dg.pos}</td>
                            <td className="py-2 px-2">
                              <p className="font-bold text-white">{dg.piloto}</p>
                              <span className="text-[9px] text-neutral-400">{dg.auto}</span>
                            </td>
                            <td className="py-2 px-2 text-center text-amber-400 font-bold">{dg.tiempoTotal}</td>
                            <td className="py-2 px-2 text-right text-amber-300">{dg.difLider}</td>
                            <td className="py-2 px-2 text-right text-neutral-400">{dg.difAnterior}</td>
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
      )}

    </div>
  );
}