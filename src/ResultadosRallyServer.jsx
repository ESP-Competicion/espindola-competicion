import { useState, useEffect, useMemo } from 'react';
import { api } from './api';

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

const detectarCategoria = (j, nombreAuto = '') => {
  const rawCat = extraerTexto(
    j?.carClass || j?.class || j?.category || j?.categoria || j?.car?.class || j?.car?.category || '',
    ''
  ).trim().toUpperCase();

  if (rawCat && rawCat !== '---') {
    return rawCat;
  }

  const autoUpper = String(nombreAuto || '').toUpperCase();

  const patronesConocidos = [
    'RALLY1', 'RC1',
    'RALLY2', 'RC2',
    'RALLY3', 'RC3',
    'RALLY4', 'RC4',
    'RALLY5', 'RC5',
    'AYGO CUP', 'AYGO',
    'GT3', 'GT4', 'GTE',
    'TCR', 'N5', 'MAXI', 'HISTORIC', 'GROUP A', 'GROUP B'
  ];

  for (const patron of patronesConocidos) {
    if (autoUpper.includes(patron)) {
      return patron;
    }
  }

  return 'GENERAL';
};

function formatearMilisegundos(ms) {
  if (!ms || isNaN(ms) || ms === 0) return "00:00.000";
  const totalSeconds = ms / 1000;
  const mins = Math.floor(totalSeconds / 60);
  const secs = (totalSeconds % 60).toFixed(3);
  const secsFormatted = Number(secs) < 10 ? `0${secs}` : secs;
  return `${mins}:${secsFormatted}`;
}

function parsearTiempoAMilisegundos(textoTiempo) {
  const limpio = String(textoTiempo || '').trim().replace(',', '.');
  if (!limpio) return 0;

  if (limpio.includes(':')) {
    const partes = limpio.split(':');
    if (partes.length !== 2) return NaN;
    const mins = Number(partes[0]);
    const segs = Number(partes[1]);
    if (isNaN(mins) || isNaN(segs) || mins < 0 || segs < 0) return NaN;
    return Math.round((mins * 60 + segs) * 1000);
  }

  const segsDirectos = Number(limpio);
  if (isNaN(segsDirectos) || segsDirectos < 0) return NaN;
  return Math.round(segsDirectos * 1000);
}

function convertirMsASegundos(ms) {
  return (Number(ms) || 0) / 1000;
}

function formatearFechaSesion(s) {
  const fechaRaw = s.fecha || s.created_at || s.inserted_at;
  if (!fechaRaw) return `SESIÓN #${s.id}`;
  return new Date(fechaRaw).toLocaleString();
}

export default function ResultadosRallyServer({
  esAdmin,
  eventoId = null,
  campeonatoId = null,
  tituloEvento = ''
}) {
  const [vistaPrincipal, setVistaPrincipal] = useState('rally');
  const [subVistaRally, setSubVistaRally] = useState('tramo1');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('TODAS');

  const [sesionesServidor, setSesionesServidor] = useState([]);
  const [sesionActivaId, setSesionActivaId] = useState(null);
  const [guardandoManual, setGuardandoManual] = useState(false);
  const [guardandoTiempoManual, setGuardandoTiempoManual] = useState(false);
  const [borrando, setBorrando] = useState(false);

  const [mostrarFormManual, setMostrarFormManual] = useState(false);
  const [formTiempoManual, setFormTiempoManual] = useState({
    tramoIndex: '0',
    piloto: '',
    auto: '',
    categoria: 'RC2',
    tiempoTexto: ''
  });

  useEffect(() => {
    cargarSesionesServidor();
  }, [eventoId]);

  async function cargarSesionesServidor() {
    const filtros = eventoId
      ? { eq_evento_id: String(eventoId), order: 'fecha.desc' }
      : { order: 'fecha.desc' };

    const { data, error } = await api.from('resultados_sesiones').select(filtros);

    if (error) {
      console.error("Error al cargar desde API:", error.message);
      return;
    }

    const filas = Array.isArray(data)
      ? (eventoId
          ? data.filter(s => String(s.evento_id) === String(eventoId))
          : data)
      : [];

    if (filas.length > 0) {
      setSesionesServidor(filas);
      setSesionActivaId((prevId) => {
        if (prevId && filas.some(s => s.id === prevId)) return prevId;
        return filas[0].id;
      });
    } else {
      setSesionesServidor([]);
      setSesionActivaId(null);
    }
  }

  const sesionesCronologicas = useMemo(() => [...sesionesServidor].reverse(), [sesionesServidor]);

  async function handleGuardarTiempoManual(e) {
    e.preventDefault();
    if (!esAdmin) return;

    const pilotoLimpio = formTiempoManual.piloto.trim().toUpperCase();
    if (!pilotoLimpio) {
      alert('Ingresá el nombre del piloto.');
      return;
    }

    const ms = parsearTiempoAMilisegundos(formTiempoManual.tiempoTexto);
    if (isNaN(ms) || ms <= 0) {
      alert('Formato de tiempo inválido. Usá por ejemplo 04:18.420 o 258.42');
      return;
    }

    const autoLimpio = (formTiempoManual.auto || 'AUTO').trim().toUpperCase();
    const categoriaLimpia = (formTiempoManual.categoria || 'GENERAL').trim().toUpperCase();
    const tramoIdx = Math.max(0, Number(formTiempoManual.tramoIndex) || 0);
    const nombreTramo = `TRAMO ${tramoIdx + 1}`;

    try {
      setGuardandoTiempoManual(true);
      const sesionExistente = sesionesCronologicas[tramoIdx] || null;

      const nuevoRegistroPiloto = {
        pos: 1,
        nombre: pilotoLimpio,
        auto: autoLimpio,
        categoria: categoriaLimpia,
        bestLapMs: ms,
        lastLapMs: ms,
        vueltas: 1
      };

      if (sesionExistente && Array.isArray(sesionExistente.datos_json)) {
        const listaActual = [...sesionExistente.datos_json];
        const idxExistente = listaActual.findIndex(
          (j) => String(j.nombre || j.driver || j.name || '').trim().toUpperCase() === pilotoLimpio
        );

        if (idxExistente >= 0) {
          listaActual[idxExistente] = {
            ...listaActual[idxExistente],
            nombre: pilotoLimpio,
            auto: autoLimpio,
            categoria: categoriaLimpia,
            bestLapMs: ms,
            lastLapMs: ms
          };
        } else {
          listaActual.push(nuevoRegistroPiloto);
        }

        const { error } = await api.from('resultados_sesiones').update(
          { datos_json: listaActual },
          { eq_id: sesionExistente.id }
        );

        if (error) {
          alert('Error al actualizar el tramo: ' + error.message);
          return;
        }
      } else {
        const payload = {
          sesion_tipo: 'RALLY_MANUAL',
          pista: tituloEvento ? `${tituloEvento} - ${nombreTramo}` : nombreTramo,
          datos_json: [nuevoRegistroPiloto]
        };
        if (eventoId) payload.evento_id = String(eventoId);
        if (campeonatoId) payload.campeonato_id = String(campeonatoId);

        const { error } = await api.from('resultados_sesiones').insert([payload]);
        if (error) {
          alert('Error al guardar el tiempo del tramo: ' + error.message);
          return;
        }
      }

      setFormTiempoManual((prev) => ({
        ...prev,
        piloto: '',
        tiempoTexto: ''
      }));
      await cargarSesionesServidor();
      alert(`Tiempo guardado en ${nombreTramo} para ${pilotoLimpio}.`);
    } finally {
      setGuardandoTiempoManual(false);
    }
  }

  async function eliminarSesionIndividual(id, e) {
    if (e) e.stopPropagation();
    if (!esAdmin) return;

    const confirmar = window.confirm('¿Seguro que querés borrar esta sesión guardada?');
    if (!confirmar) return;

    try {
      setBorrando(true);
      const { error } = await api.from('resultados_sesiones').eq('id', id).delete();

      if (error) {
        alert('Error al borrar la sesión: ' + error.message);
      } else {
        alert('Sesión eliminada correctamente.');
        await cargarSesionesServidor();
      }
    } catch (err) {
      console.error("Error al borrar sesión:", err);
      alert('Ocurrió un error al intentar borrar la sesión.');
    } finally {
      setBorrando(false);
    }
  }

  async function resetearTodosLosResultados() {
    if (!esAdmin) return;

    const confirmar1 = window.confirm(
      eventoId
        ? `¿Seguro que querés borrar TODOS los tramos/resultados guardados de "${tituloEvento || 'este evento'}"?`
        : '⚠️ ¿Seguro que querés borrar TODOS los resultados y sesiones guardadas para empezar de cero?'
    );
    if (!confirmar1) return;

    const confirmar2 = window.confirm('Última confirmación: se eliminarán estos registros de la tabla resultados_sesiones.');
    if (!confirmar2) return;

    try {
      setBorrando(true);
      for (const s of sesionesServidor) {
        const { error } = await api.from('resultados_sesiones').eq('id', s.id).delete();
        if (error) {
          alert('Error al borrar sesión #' + s.id + ': ' + error.message);
          await cargarSesionesServidor();
          return;
        }
      }

      alert('¡Resultados borrados correctamente!');
      setSesionesServidor([]);
      setSesionActivaId(null);
    } catch (err) {
      console.error("Error al resetear:", err);
      alert('Ocurrió un error al resetear los resultados.');
    } finally {
      setBorrando(false);
    }
  }

  async function forzarGuardadoManual() {
    try {
      setGuardandoManual(true);
      const headers = {
        'Authorization': `Bearer ${TOKEN_ST}`,
        'Accept': 'application/json'
      };

      const resServidor = await fetch(`${API_BASE_ST}/server`, { headers }).catch(() => null);
      if (!resServidor || !resServidor.ok) {
        alert(`Error (${resServidor?.status || 'sin conexión'}): No se pudo conectar con el servidor de Assetto Hosting.`);
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
        alert(`Error (${resJugadores?.status || 'sin conexión'}): No se pudieron obtener los jugadores actuales de la pista.`);
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

      const datosProcesados = jugadoresFiltrados.map((j, idx) => {
        const nombreAuto = extraerTexto(j?.car?.name || j?.car, 'AUTO');
        const categoriaDetectada = detectarCategoria(j, nombreAuto);

        return {
          pos: idx + 1,
          nombre: extraerTexto(j?.name, 'PILOTO'),
          auto: nombreAuto,
          categoria: categoriaDetectada,
          bestLapMs: Number(j?.bestLapMs) || 0,
          lastLapMs: Number(j?.lastLapMs) || 0,
          vueltas: Number(j?.laps) || 0,
          sectores: j?.lastLap?.sectors || [0, 0, 0],
          posicionLargada: j?.startingPosition !== undefined ? Number(j.startingPosition) : (idx + 1)
        };
      });

      const payload = {
        sesion_tipo: tipoSesionActual,
        pista: pistaNombre,
        datos_json: datosProcesados
      };
      if (eventoId) payload.evento_id = String(eventoId);
      if (campeonatoId) payload.campeonato_id = String(campeonatoId);

      const { error } = await api.from('resultados_sesiones').insert([payload]);

      if (error) {
        alert('Error al guardar en la API: ' + error.message);
      } else {
        alert('¡Sesión y tiempos guardados exitosamente en la base de datos!');
        await cargarSesionesServidor();
      }
    } catch (err) {
      console.error("Error al forzar guardado:", err);
      alert('Ocurrió un error inesperado al forzar el guardado.');
    } finally {
      setGuardandoManual(false);
    }
  }

  const categoriasDisponibles = useMemo(() => {
    const categoriasSet = new Set();
    sesionesCronologicas.forEach(s => {
      if (s.datos_json && Array.isArray(s.datos_json)) {
        s.datos_json.forEach(j => {
          const nombreAuto = typeof j.auto === 'object' ? (j.auto.name || 'AUTO') : (j.auto || j.car || 'AUTO');
          const cat = detectarCategoria(j, nombreAuto);
          if (cat && cat !== 'GENERAL') {
            categoriasSet.add(cat);
          }
        });
      }
    });
    return ['TODAS', ...Array.from(categoriasSet), 'GENERAL'];
  }, [sesionesCronologicas]);

  const datosTramo = useMemo(() => {
    let idx = 0;
    if (subVistaRally === 'tramo2') idx = 1;
    else if (subVistaRally === 'tramo3') idx = 2;
    else if (subVistaRally === 'tramo4') idx = 3;
    else if (subVistaRally === 'general') idx = Math.max(0, sesionesCronologicas.length - 1);

    const sesion = sesionesCronologicas[idx] || null;
    if (!sesion || !sesion.datos_json) return [];

    let lista = sesion.datos_json.map((j, i) => {
      const nombreAuto = typeof j.auto === 'object' ? (j.auto.name || 'AUTO') : (j.auto || j.car || 'AUTO');
      const cat = detectarCategoria(j, nombreAuto);
      const mejorMs = Number(j.bestLapMs || j.bestLap || j.tiempoMs || j.lastLapMs || 0);
      const nombrePiloto = j.nombre || j.driver || j.name || 'PILOTO';

      return {
        pos: i + 1,
        piloto: nombrePiloto,
        auto: nombreAuto,
        categoria: cat,
        tiempoMs: mejorMs,
        tiempoStr: formatearMilisegundos(mejorMs),
        segundos: convertirMsASegundos(mejorMs)
      };
    });

    if (categoriaSeleccionada !== 'TODAS' && categoriaSeleccionada !== 'GENERAL') {
      lista = lista.filter(p => p.categoria === categoriaSeleccionada);
    }

    lista.sort((a, b) => {
      if (a.segundos === 0) return 1;
      if (b.segundos === 0) return -1;
      return a.segundos - b.segundos;
    });

    return lista.map((p, i) => {
      const liderSeg = lista[0]?.segundos || 0;
      const difLider = i === 0 ? 0 : p.segundos - liderSeg;
      const difAnt = i === 0 ? 0 : p.segundos - lista[i - 1].segundos;

      return {
        ...p,
        pos: i + 1,
        difLider: i === 0 ? '0.0' : `+${difLider.toFixed(2)}`,
        difAnterior: i === 0 ? '-' : `+${difAnt.toFixed(2)}`
      };
    });
  }, [sesionesCronologicas, subVistaRally, categoriaSeleccionada]);

  const datosGeneral = useMemo(() => {
    let cantTramos = sesionesCronologicas.length;
    if (subVistaRally === 'tramo1') cantTramos = 1;
    if (subVistaRally === 'tramo2') cantTramos = 2;
    if (subVistaRally === 'tramo3') cantTramos = 3;
    if (subVistaRally === 'tramo4') cantTramos = 4;

    const tramosAIncluir = sesionesCronologicas.slice(0, cantTramos);
    if (tramosAIncluir.length === 0) return [];

    const acumulados = {};

    tramosAIncluir.forEach((ses) => {
      if (ses && ses.datos_json && Array.isArray(ses.datos_json)) {
        ses.datos_json.forEach(j => {
          const nombre = (j.nombre || j.driver || j.name || 'PILOTO').toUpperCase();
          const auto = typeof j.auto === 'object' ? (j.auto.name || 'AUTO') : (j.auto || j.car || 'AUTO');
          const cat = detectarCategoria(j, auto);
          const ms = Number(j.bestLapMs || j.bestLap || j.tiempoMs || j.lastLapMs || 0);

          if (!acumulados[nombre]) {
            acumulados[nombre] = { piloto: nombre, auto, categoria: cat, totalMs: 0, tramosConTiempo: 0 };
          }
          if (ms > 0) {
            acumulados[nombre].totalMs += ms;
            acumulados[nombre].tramosConTiempo += 1;
          }
        });
      }
    });

    let listaGen = Object.values(acumulados).filter(p => p.tramosConTiempo > 0);

    if (categoriaSeleccionada !== 'TODAS' && categoriaSeleccionada !== 'GENERAL') {
      listaGen = listaGen.filter(p => p.categoria === categoriaSeleccionada);
    }

    listaGen.sort((a, b) => a.totalMs - b.totalMs);

    return listaGen.map((p, idx) => {
      const totalSeg = convertirMsASegundos(p.totalMs);
      const liderSeg = listaGen.length > 0 ? convertirMsASegundos(listaGen[0].totalMs) : 0;
      const difLider = idx === 0 ? 0 : totalSeg - liderSeg;
      const difAnt = idx === 0 ? 0 : totalSeg - convertirMsASegundos(listaGen[idx - 1].totalMs);

      return {
        ...p,
        pos: idx + 1,
        tiempoTotal: formatearMilisegundos(p.totalMs),
        difLider: idx === 0 ? '0.0' : `+${difLider.toFixed(2)}`,
        difAnterior: idx === 0 ? '-' : `+${difAnt.toFixed(2)}`
      };
    });
  }, [sesionesCronologicas, subVistaRally, categoriaSeleccionada]);

  const sesionActualObj = useMemo(
    () => sesionesServidor.find(s => s.id === sesionActivaId),
    [sesionesServidor, sesionActivaId]
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-wrc text-white uppercase p-4">

      {eventoId && (
        <div className="bg-[#38bdf8]/10 border border-[#38bdf8]/40 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[10px] text-[#38bdf8] tracking-widest block">HISTORIAL DE TIEMPOS DEL EVENTO</span>
            <h3 className="text-base md:text-lg text-white font-black">{tituloEvento || `EVENTO #${eventoId}`}</h3>
          </div>
          <span className="text-[10px] font-mono text-sky-300">
            TRAMOS GUARDADOS: {sesionesCronologicas.length}
          </span>
        </div>
      )}

      <div className="flex flex-wrap justify-between items-center gap-4 bg-neutral-900/60 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVistaPrincipal('server')}
            className={`px-6 py-2.5 rounded-xl font-black text-xs tracking-wider transition cursor-pointer ${
              vistaPrincipal === 'server'
                ? 'bg-[#38bdf8] text-slate-950 shadow-lg shadow-[#38bdf8]/20'
                : 'bg-neutral-950/80 text-neutral-400 hover:text-white border border-white/5'
            }`}
          >
            RESULTADOS SERVER
          </button>
          <button
            onClick={() => setVistaPrincipal('rally')}
            className={`px-6 py-2.5 rounded-xl font-black text-xs tracking-wider transition cursor-pointer ${
              vistaPrincipal === 'rally'
                ? 'bg-[#38bdf8] text-slate-950 shadow-lg shadow-[#38bdf8]/20'
                : 'bg-neutral-950/80 text-neutral-400 hover:text-white border border-white/5'
            }`}
          >
            RESULTADOS RALLY
          </button>
        </div>

        {esAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setMostrarFormManual((prev) => !prev)}
              className="bg-[#38bdf8]/15 hover:bg-[#38bdf8]/25 text-[#38bdf8] border border-[#38bdf8]/50 font-black text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer"
            >
              ✍️ {mostrarFormManual ? 'OCULTAR CARGA MANUAL' : 'CARGAR TIEMPO MANUAL'}
            </button>

            <button
              onClick={forzarGuardadoManual}
              disabled={guardandoManual || borrando}
              className="bg-red-600 hover:bg-red-500 text-white font-black text-xs px-4 py-2.5 rounded-xl transition shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {guardandoManual ? 'GUARDANDO SESIÓN...' : '⚡ FORZAR GUARDADO DE SESIÓN'}
            </button>

            <button
              onClick={resetearTodosLosResultados}
              disabled={guardandoManual || borrando || sesionesServidor.length === 0}
              className="bg-neutral-900 hover:bg-neutral-800 text-red-400 border border-red-500/40 font-black text-xs px-4 py-2.5 rounded-xl transition shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-40"
              title="Borrar todas las sesiones guardadas para empezar de cero"
            >
              {borrando ? 'BORRANDO...' : '🗑️ RESETEAR TODO'}
            </button>
          </div>
        )}
      </div>

      {esAdmin && mostrarFormManual && (
        <form
          onSubmit={handleGuardarTiempoManual}
          className="bg-neutral-900/80 border border-[#38bdf8]/40 rounded-2xl p-4 shadow-xl space-y-3"
        >
          <div className="flex flex-wrap justify-between items-center gap-2 border-b border-white/10 pb-2">
            <h4 className="text-xs font-black text-[#38bdf8] tracking-wider">
              ✍️ CARGAR TIEMPO DE TRAMO MANUALMENTE (SIN SERVIDOR EN VIVO)
            </h4>
            <span className="text-[10px] font-mono text-neutral-400">
              FORMATO: MM:SS.MS (EJ: 04:18.420) O SEGUNDOS (EJ: 258.42)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            <div>
              <label className="block text-[10px] text-neutral-300 mb-1">TRAMO</label>
              <select
                value={formTiempoManual.tramoIndex}
                onChange={(e) => setFormTiempoManual({ ...formTiempoManual, tramoIndex: e.target.value })}
                className="w-full bg-neutral-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]"
              >
                <option value="0">TRAMO 1</option>
                <option value="1">TRAMO 2</option>
                <option value="2">TRAMO 3</option>
                <option value="3">TRAMO 4</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-neutral-300 mb-1">PILOTO</label>
              <input
                type="text"
                placeholder="EJ: LEO ESPINDOLA"
                value={formTiempoManual.piloto}
                onChange={(e) => setFormTiempoManual({ ...formTiempoManual, piloto: e.target.value })}
                className="w-full bg-neutral-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] text-neutral-300 mb-1">AUTO</label>
              <input
                type="text"
                placeholder="EJ: PEUGEOT 208 RALLY4"
                value={formTiempoManual.auto}
                onChange={(e) => setFormTiempoManual({ ...formTiempoManual, auto: e.target.value })}
                className="w-full bg-neutral-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]"
              />
            </div>

            <div>
              <label className="block text-[10px] text-neutral-300 mb-1">CATEGORÍA</label>
              <input
                type="text"
                placeholder="EJ: RC2 / RALLY4"
                value={formTiempoManual.categoria}
                onChange={(e) => setFormTiempoManual({ ...formTiempoManual, categoria: e.target.value })}
                className="w-full bg-neutral-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]"
              />
            </div>

            <div>
              <label className="block text-[10px] text-neutral-300 mb-1">TIEMPO DEL TRAMO</label>
              <input
                type="text"
                placeholder="04:18.420"
                value={formTiempoManual.tiempoTexto}
                onChange={(e) => setFormTiempoManual({ ...formTiempoManual, tiempoTexto: e.target.value })}
                className="w-full bg-neutral-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-[#38bdf8]"
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={guardandoTiempoManual}
              className="bg-[#38bdf8] hover:bg-[#7dd3fc] text-slate-950 font-black text-xs px-5 py-2 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              {guardandoTiempoManual ? 'GUARDANDO TIEMPO...' : '💾 GUARDAR TIEMPO EN TRAMO'}
            </button>
          </div>
        </form>
      )}

      {vistaPrincipal === 'server' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-neutral-950/90 border border-white/10 rounded-2xl p-5 shadow-2xl">
          <div className="space-y-3 bg-neutral-900/50 p-4 rounded-xl border border-white/5">
            <h3 className="text-xs text-[#38bdf8] font-bold">SESIONES GUARDADAS ({sesionesServidor.length})</h3>
            <div className="space-y-2 max-h-[350px] overflow-y-auto">
              {sesionesServidor.map(s => (
                <div
                  key={s.id}
                  onClick={() => setSesionActivaId(s.id)}
                  className={`p-3 rounded-xl cursor-pointer border transition flex justify-between items-start gap-2 ${
                    sesionActivaId === s.id
                      ? 'bg-[#38bdf8]/15 border-[#38bdf8] text-white'
                      : 'bg-neutral-950 border-white/5 text-neutral-400 hover:bg-white/5'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="text-[10px] text-[#38bdf8] font-bold">[{s.sesion_tipo}]</span>
                    <p className="text-xs font-bold text-white truncate">{s.pista}</p>
                    <span className="text-[9px] text-neutral-500">{formatearFechaSesion(s)}</span>
                  </div>

                  {esAdmin && (
                    <button
                      onClick={(e) => eliminarSesionIndividual(s.id, e)}
                      disabled={borrando}
                      className="text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 px-2 py-1 rounded text-[10px] cursor-pointer shrink-0"
                      title="Borrar esta sesión"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 bg-neutral-900/40 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
            {sesionActualObj ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <div>
                    <span className="text-xs text-[#38bdf8] font-bold">{sesionActualObj.sesion_tipo}</span>
                    <h3 className="text-sm font-black text-white">{sesionActualObj.pista}</h3>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono">{formatearFechaSesion(sesionActualObj)}</span>
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
                          <td className="py-2 px-2 text-[#38bdf8] font-bold">#{j.pos || idx + 1}</td>
                          <td className="py-2 px-2 font-bold text-white">{j.nombre || j.driver}</td>
                          <td className="py-2 px-2 text-neutral-300">{j.auto || j.car || 'AUTO'}</td>
                          <td className="py-2 px-2 text-center">{j.vueltas || j.laps || '-'}</td>
                          <td className="py-2 px-2 text-right text-sky-300">{formatearMilisegundos(j.bestLapMs || j.tiempoMs)}</td>
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

      {vistaPrincipal === 'rally' && (
        <div className="bg-neutral-950/90 border border-[#38bdf8]/40 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md">
          <div className="bg-neutral-900/90 p-3 border-b border-white/10 flex flex-wrap justify-between items-center gap-2">

            <div className="flex items-center gap-2">
              <select
                value={categoriaSeleccionada}
                onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                className="bg-neutral-950 border border-[#38bdf8]/60 text-[#38bdf8] text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer shadow"
              >
                {categoriasDisponibles.map(cat => (
                  <option key={cat} value={cat} className="bg-neutral-900 text-white">
                    {cat === 'TODAS' ? 'CAT: TODAS' : cat === 'GENERAL' ? 'GENERAL (TODOS)' : `CAT: ${cat}`}
                  </option>
                ))}
              </select>
            </div>

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
                        ? 'bg-[#38bdf8] text-slate-950 shadow'
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

            <div className="p-4 space-y-3 bg-neutral-900/20">
              <div className="flex justify-between items-center border-b border-[#38bdf8]/30 pb-2">
                <h4 className="text-[#38bdf8] text-xs font-black">
                  ⏱️ TIEMPO {subVistaRally === 'general' ? `TRAMO ${Math.max(1, sesionesCronologicas.length)} (ÚLTIMO)` : subVistaRally.toUpperCase()}
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
                          <td className="py-2.5 px-1 text-center font-bold text-[#38bdf8]">#{dt.pos}</td>
                          <td className="py-2 px-2">
                            <p className="font-bold text-white">{dt.piloto}</p>
                            <span className="text-[9px] text-[#38bdf8]">{dt.auto} — [{dt.categoria}]</span>
                          </td>
                          <td className="py-2 px-2 text-center text-white font-bold">{dt.tiempoStr}</td>
                          <td className="py-2 px-2 text-right text-sky-300">{dt.difLider}</td>
                          <td className="py-2 px-2 text-right text-neutral-400">{dt.difAnterior}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 space-y-3 bg-neutral-900/40">
              <div className="flex justify-between items-center border-b border-[#38bdf8]/30 pb-2">
                <h4 className="text-[#38bdf8] text-xs font-black">
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
                          <tr key={idx} className={`hover:bg-white/5 ${esPodio ? 'bg-[#38bdf8]/5' : ''}`}>
                            <td className="py-2.5 px-1 text-center font-black text-[#38bdf8]">#{dg.pos}</td>
                            <td className="py-2 px-2">
                              <p className="font-bold text-white">{dg.piloto}</p>
                              <span className="text-[9px] text-[#38bdf8]">{dg.auto} — [{dg.categoria}]</span>
                            </td>
                            <td className="py-2 px-2 text-center text-[#38bdf8] font-bold">{dg.tiempoTotal}</td>
                            <td className="py-2 px-2 text-right text-sky-300">{dg.difLider}</td>
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