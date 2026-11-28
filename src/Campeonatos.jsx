import { useState, useEffect, useRef, useMemo } from 'react';
import { api } from './api';

export default function Campeonatos({ esAdmin }) {
  const [campeonatos, setCampeonatos] = useState([]);
  const [campeonatoSeleccionado, setCampeonatoSeleccionado] = useState(null);
  const [fechasCampeonato, setFechasCampeonato] = useState([]);
  const [todosResultadosCamp, setTodosResultadosCamp] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [calculandoAuto, setCalculandoAuto] = useState(false);

  // Panel de herramientas admin plegable
  const [mostrarHerramientasAdmin, setMostrarHerramientasAdmin] = useState(false);

  const cacheResultadosFecha = useRef({});
  const cacheTodosResultadosCamp = useRef({});
  const cacheFechasCamp = useRef({});

  // Formulario de creación de campeonato
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [modalidadTorneo, setModalidadTorneo] = useState('rally');
  const [cantidadFechas, setCantidadFechas] = useState(5);

  // Escalas de puntos
  const [strPuntosQ, setStrPuntosQ] = useState('10, 8, 6, 4, 2');
  const [strPuntosF1, setStrPuntosF1] = useState('25, 18, 15, 12, 10, 8, 6, 4, 2, 1');
  const [strPuntosF2, setStrPuntosF2] = useState('25, 18, 15, 12, 10, 8, 6, 4, 2, 1');
  const [strPuntosTramo, setStrPuntosTramo] = useState('25, 18, 15, 12, 10, 8, 6, 4, 2, 1');

  // Fecha activa, resultados de fecha y filtro por categoría
  const [fechaSeleccionadaId, setFechaSeleccionadaId] = useState('');
  const [resultadosFecha, setResultadosFecha] = useState([]);
  const [filtroCategoria, setFiltroCategoria] = useState('GENERAL');
  const [vistaTabla, setVistaTabla] = useState('acumulado'); // 'acumulado' (F1+F2...) o 'fecha'

  // Carga manual de piloto en la fecha
  const [formCargaPiloto, setFormCargaPiloto] = useState({
    piloto_nombre: '',
    categoria: 'RC2',
    posicion_final: 1,
    pos_qualy: 1,
    pos_final1: 1,
    pos_final2: 1,
    sancion: ''
  });

  useEffect(() => {
    cargarCampeonatos();
  }, []);

  async function cargarCampeonatos(forzarRefresco = false) {
    setCargando(true);
    const { data, error } = await api.from('campeonatos').select({
      order: 'created_at.desc'
    });

    if (error) {
      console.error('Error al cargar campeonatos:', error.message);
      setCargando(false);
      return;
    }

    if (data && data.length > 0) {
      setCampeonatos(data);
      const actual = forzarRefresco
        ? (data.find(c => c.id === campeonatoSeleccionado?.id) || data[0])
        : (campeonatoSeleccionado || data[0]);
      if (actual) {
        await seleccionarCampeonato(actual, forzarRefresco);
      }
    } else {
      setCampeonatos([]);
      setCampeonatoSeleccionado(null);
      setFechasCampeonato([]);
      setTodosResultadosCamp([]);
    }
    setCargando(false);
  }

  async function seleccionarCampeonato(camp, forzarRefresco = false) {
    setCampeonatoSeleccionado(camp);
    setFiltroCategoria('GENERAL');

    if (camp.puntos_final1 && Array.isArray(camp.puntos_final1)) {
      setStrPuntosF1(camp.puntos_final1.join(', '));
      setStrPuntosTramo(camp.puntos_final1.join(', '));
    }
    if (camp.puntos_qualy && Array.isArray(camp.puntos_qualy)) {
      setStrPuntosQ(camp.puntos_qualy.join(', '));
    }
    if (camp.puntos_final2 && Array.isArray(camp.puntos_final2)) {
      setStrPuntosF2(camp.puntos_final2.join(', '));
    }

    let fechas = cacheFechasCamp.current[camp.id];
    if (!fechas || forzarRefresco) {
      const { data } = await api.from('campeonato_fechas').select({
        eq_campeonato_id: camp.id,
        order: 'numero_fecha.asc'
      });
      fechas = data || [];
      cacheFechasCamp.current[camp.id] = fechas;
    }

    setFechasCampeonato(fechas);
    if (fechas.length > 0) {
      const existePrevia = fechas.some(f => String(f.id) === String(fechaSeleccionadaId));
      const fechaIdActiva = existePrevia ? fechaSeleccionadaId : fechas[0].id;
      setFechaSeleccionadaId(fechaIdActiva);
      await cargarResultadosFecha(fechaIdActiva, forzarRefresco);
    } else {
      setFechaSeleccionadaId('');
      setResultadosFecha([]);
    }

    await cargarTodosResultadosCampeonato(camp.id, fechas, forzarRefresco);
  }

  async function cargarResultadosFecha(fechaId, forzarRefresco = false) {
    if (!fechaId) {
      setResultadosFecha([]);
      return;
    }

    if (!forzarRefresco && cacheResultadosFecha.current[fechaId]) {
      setResultadosFecha(cacheResultadosFecha.current[fechaId]);
      return;
    }

    const { data } = await api.from('campeonato_resultados_fecha').select({
      eq_fecha_id: fechaId
    });

    const lista = data || [];
    cacheResultadosFecha.current[fechaId] = lista;
    setResultadosFecha(lista);
  }

  async function cargarTodosResultadosCampeonato(campId, fechasLista = fechasCampeonato, forzarRefresco = false) {
    if (!campId) {
      setTodosResultadosCamp([]);
      return;
    }

    if (!forzarRefresco && cacheTodosResultadosCamp.current[campId]) {
      setTodosResultadosCamp(cacheTodosResultadosCamp.current[campId]);
      return;
    }

    if (!Array.isArray(fechasLista) || fechasLista.length === 0) {
      setTodosResultadosCamp([]);
      return;
    }

    const idsFechas = fechasLista.map(f => f.id);
    const { data } = await api.from('campeonato_resultados_fecha').select({
      in_fecha_id: idsFechas.join(',')
    });

    const acumulado = Array.isArray(data) ? data : [];
    cacheTodosResultadosCamp.current[campId] = acumulado;
    setTodosResultadosCamp(acumulado);
  }

  function parsearEscalaPuntos(str) {
    return str.split(',').map(n => parseInt(n.trim()) || 0);
  }

  const categoriasDisponibles = useMemo(() => {
    const setCats = new Set();
    [...todosResultadosCamp, ...resultadosFecha].forEach((r) => {
      const cat = String(r.categoria || '').trim().toUpperCase();
      if (cat && cat !== 'GENERAL') {
        setCats.add(cat);
      }
    });
    return ['GENERAL', ...Array.from(setCats)];
  }, [todosResultadosCamp, resultadosFecha]);

  // Sumatoria de todas las fechas (F1 + F2 + ...) con soporte para categoría específica o general
  const filasAcumuladas = useMemo(() => {
    const mapaFechas = new Map();
    fechasCampeonato.forEach((f, idx) => {
      mapaFechas.set(String(f.id), Number(f.numero_fecha) || idx + 1);
    });

    const mapa = new Map();

    todosResultadosCamp.forEach((r) => {
      const piloto = String(r.piloto_nombre || '').trim().toUpperCase();
      if (!piloto) return;
      const categoria = String(r.categoria || 'GENERAL').trim().toUpperCase();
      const numFecha = mapaFechas.get(String(r.fecha_id)) || 1;
      const pts = Number(r.puntos_total) || 0;

      if (filtroCategoria !== 'GENERAL' && categoria !== filtroCategoria) {
        return;
      }

      const clave = filtroCategoria === 'GENERAL' ? `${piloto}__${categoria}` : piloto;
      if (!mapa.has(clave)) {
        mapa.set(clave, {
          id: r.id,
          nombre: piloto,
          categoria,
          total: 0,
          porFecha: {}
        });
      }

      const item = mapa.get(clave);
      item.porFecha[numFecha] = (item.porFecha[numFecha] || 0) + pts;
      item.total += pts;
    });

    return Array.from(mapa.values()).sort((a, b) => b.total - a.total);
  }, [todosResultadosCamp, fechasCampeonato, filtroCategoria]);

  // Filas de una fecha concreta filtradas por categoría
  const filasPorFecha = useMemo(() => {
    const normalizadas = resultadosFecha.map((r, idx) => ({
      id: r.id,
      nombre: String(r.piloto_nombre || '').trim().toUpperCase(),
      categoria: String(r.categoria || 'GENERAL').trim().toUpperCase(),
      posicion: Number(r.posicion_final) || idx + 1,
      total: Number(r.puntos_total) || 0
    }));

    const filtradas =
      filtroCategoria === 'GENERAL'
        ? normalizadas
        : normalizadas.filter((item) => item.categoria === filtroCategoria);

    return filtradas.sort((a, b) => {
      if (filtroCategoria === 'GENERAL' && a.categoria !== b.categoria) {
        return a.categoria.localeCompare(b.categoria);
      }
      if (a.posicion !== b.posicion) return a.posicion - b.posicion;
      return b.total - a.total;
    });
  }, [resultadosFecha, filtroCategoria]);

  async function handleFinalizarRallyPorCategoria() {
    if (!esAdmin || !campeonatoSeleccionado || !fechaSeleccionadaId || resultadosFecha.length === 0) return;

    try {
      setCalculandoAuto(true);

      const escala = Array.isArray(campeonatoSeleccionado?.puntos_final1) && campeonatoSeleccionado.puntos_final1.length > 0
        ? campeonatoSeleccionado.puntos_final1.map(n => Number(n) || 0)
        : parsearEscalaPuntos(strPuntosTramo);

      const porCategoria = new Map();
      resultadosFecha.forEach((r, idx) => {
        const cat = String(r.categoria || 'GENERAL').trim().toUpperCase();
        if (!porCategoria.has(cat)) porCategoria.set(cat, []);
        porCategoria.get(cat).push({
          ...r,
          categoria: cat,
          posicion_final: Number(r.posicion_final) || idx + 1
        });
      });

      for (const [, pilotosCat] of porCategoria.entries()) {
        const ordenados = [...pilotosCat].sort((a, b) => a.posicion_final - b.posicion_final);
        for (let i = 0; i < ordenados.length; i++) {
          const piloto = ordenados[i];
          const pts = i < escala.length ? escala[i] : 0;
          await api.from('campeonato_resultados_fecha').update(
            {
              categoria: piloto.categoria,
              posicion_final: i + 1,
              puntos_qualy: 0,
              puntos_final1: pts,
              puntos_final2: 0,
              puntos_tramo1: 0,
              puntos_tramo2: 0,
              puntos_tramo3: 0,
              puntos_tramo4: 0,
              puntos_total: pts
            },
            { eq_id: piloto.id }
          );
        }
      }

      await api.from('campeonato_fechas').update({ estado: 'finalizada' }, { eq_id: fechaSeleccionadaId });

      delete cacheFechasCamp.current[campeonatoSeleccionado.id];
      delete cacheResultadosFecha.current[fechaSeleccionadaId];
      delete cacheTodosResultadosCamp.current[campeonatoSeleccionado.id];

      const { data: fechasActualizadas } = await api.from('campeonato_fechas').select({
        eq_campeonato_id: campeonatoSeleccionado.id,
        order: 'numero_fecha.asc'
      });
      const listaFechas = fechasActualizadas || [];
      cacheFechasCamp.current[campeonatoSeleccionado.id] = listaFechas;
      setFechasCampeonato(listaFechas);

      await cargarResultadosFecha(fechaSeleccionadaId, true);
      await cargarTodosResultadosCampeonato(campeonatoSeleccionado.id, listaFechas, true);
    } finally {
      setCalculandoAuto(false);
    }
  }

  async function handleCrearCampeonato(e) {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;

    const esCreacionRally = modalidadTorneo === 'rally';
    const escalaFinal = parsearEscalaPuntos(strPuntosTramo);
    const arrQ = esCreacionRally ? [] : parsearEscalaPuntos(strPuntosQ);
    const arrF1 = esCreacionRally ? escalaFinal : parsearEscalaPuntos(strPuntosF1);
    const arrF2 = esCreacionRally ? [] : parsearEscalaPuntos(strPuntosF2);

    const { data: campNuevo, error } = await api.from('campeonatos').insert({
      nombre: nuevoNombre.toUpperCase(),
      modalidad: modalidadTorneo,
      estado: 'activo',
      puntos_qualy: arrQ,
      puntos_final1: arrF1,
      puntos_final2: arrF2
    });

    if (error || !campNuevo) {
      alert('Error al crear campeonato: ' + (error?.message || 'Error desconocido'));
      return;
    }

    const fechasInsertar = [];
    for (let i = 1; i <= parseInt(cantidadFechas, 10); i++) {
      fechasInsertar.push({
        campeonato_id: campNuevo.id,
        numero_fecha: i,
        titulo_fecha: `FECHA ${i}`,
        fecha_programada: new Date().toISOString().split('T')[0],
        estado: 'pendiente'
      });
    }

    await api.from('campeonato_fechas').insert(fechasInsertar);
    setNuevoNombre('');
    await cargarCampeonatos(true);
  }

  async function handleGuardarPuntosPiloto(e) {
    e.preventDefault();
    if (!fechaSeleccionadaId || !formCargaPiloto.piloto_nombre.trim()) return;

    const esRally = campeonatoSeleccionado?.modalidad === 'rally';
    const nombrePiloto = formCargaPiloto.piloto_nombre.toUpperCase().trim();
    const categoriaPiloto = (formCargaPiloto.categoria || 'RC2').toUpperCase().trim();
    const posFinal = Math.max(1, parseInt(formCargaPiloto.posicion_final, 10) || 1);

    let ptsQ = 0, ptsF1 = 0, ptsF2 = 0;

    if (!esRally) {
      const arrQ = campeonatoSeleccionado?.puntos_qualy || parsearEscalaPuntos(strPuntosQ);
      const arrF1 = campeonatoSeleccionado?.puntos_final1 || parsearEscalaPuntos(strPuntosF1);
      const arrF2 = campeonatoSeleccionado?.puntos_final2 || parsearEscalaPuntos(strPuntosF2);

      const pq = parseInt(formCargaPiloto.pos_qualy, 10) || 0;
      const pf1 = parseInt(formCargaPiloto.pos_final1, 10) || 0;
      const pf2 = parseInt(formCargaPiloto.pos_final2, 10) || 0;

      ptsQ = pq > 0 && pq <= arrQ.length ? arrQ[pq - 1] : 0;
      ptsF1 = pf1 > 0 && pf1 <= arrF1.length ? arrF1[pf1 - 1] : 0;
      ptsF2 = pf2 > 0 && pf2 <= arrF2.length ? arrF2[pf2 - 1] : 0;
    }

    const total = ptsQ + ptsF1 + ptsF2;

    const { data: existentes } = await api.from('campeonato_resultados_fecha').select({
      eq_fecha_id: fechaSeleccionadaId,
      eq_piloto_nombre: nombrePiloto
    });
    const existente = Array.isArray(existentes) && existentes.length > 0 ? existentes[0] : null;

    const datosPayload = {
      categoria: categoriaPiloto,
      posicion_final: posFinal,
      puntos_qualy: ptsQ,
      puntos_final1: ptsF1,
      puntos_final2: ptsF2,
      puntos_tramo1: 0,
      puntos_tramo2: 0,
      puntos_tramo3: 0,
      puntos_tramo4: 0,
      puntos_total: total,
      sancion_aplicada: formCargaPiloto.sancion.toUpperCase()
    };

    if (existente) {
      await api.from('campeonato_resultados_fecha').update(datosPayload, { eq_id: existente.id });
    } else {
      await api.from('campeonato_resultados_fecha').insert([{
        fecha_id: fechaSeleccionadaId,
        piloto_nombre: nombrePiloto,
        ...datosPayload
      }]);
    }

    setFormCargaPiloto({
      piloto_nombre: '',
      categoria: categoriaPiloto,
      posicion_final: posFinal + 1,
      pos_qualy: 1,
      pos_final1: 1,
      pos_final2: 1,
      sancion: ''
    });

    delete cacheResultadosFecha.current[fechaSeleccionadaId];
    delete cacheTodosResultadosCamp.current[campeonatoSeleccionado.id];
    await cargarResultadosFecha(fechaSeleccionadaId, true);
    await cargarTodosResultadosCampeonato(campeonatoSeleccionado.id, fechasCampeonato, true);
  }

  async function eliminarResultadoPiloto(id) {
    const { error } = await api.from('campeonato_resultados_fecha').eq('id', id).delete();
    if (error) {
      alert('Error al eliminar resultado: ' + error.message);
      return;
    }
    delete cacheResultadosFecha.current[fechaSeleccionadaId];
    delete cacheTodosResultadosCamp.current[campeonatoSeleccionado.id];
    await cargarResultadosFecha(fechaSeleccionadaId, true);
    await cargarTodosResultadosCampeonato(campeonatoSeleccionado.id, fechasCampeonato, true);
  }

  const filasActivas = vistaTabla === 'acumulado' ? filasAcumuladas : filasPorFecha;

  return (
    <div className="space-y-4 max-w-6xl mx-auto font-wrc text-white uppercase">

      {/* Barra superior: Título + Botón desplegable Admin */}
      <div className="flex flex-wrap justify-between items-center gap-3 bg-neutral-900/65 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3 shadow-xl">
        <h2 className="text-2xl md:text-3xl text-[#38bdf8] tracking-wide">
          CAMPEONATOS OFICIALES
        </h2>

        {esAdmin && (
          <button
            type="button"
            onClick={() => setMostrarHerramientasAdmin(!mostrarHerramientasAdmin)}
            className="bg-neutral-950 hover:bg-neutral-900 text-[#38bdf8] border border-[#38bdf8]/60 text-xs font-black px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition"
          >
            <span>⚙️ HERRAMIENTAS ADMIN</span>
            <span>{mostrarHerramientasAdmin ? '▲' : '▼'}</span>
          </button>
        )}
      </div>

      {/* Herramientas Admin desplegables */}
      {esAdmin && mostrarHerramientasAdmin && (
        <div className="bg-neutral-950/90 backdrop-blur-md border border-[#38bdf8]/40 rounded-2xl p-4 shadow-2xl space-y-4">
          <form onSubmit={handleCrearCampeonato} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end border-b border-white/10 pb-4">
            <div>
              <label className="block text-[10px] text-neutral-300 mb-1">NOMBRE CAMPEONATO</label>
              <input
                type="text"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                placeholder="EJ: RALLY ESPÍNDOLA"
                required
                className="w-full bg-neutral-900 border border-white/15 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#38bdf8] mb-1">MODALIDAD</label>
              <select
                value={modalidadTorneo}
                onChange={(e) => setModalidadTorneo(e.target.value)}
                className="w-full bg-neutral-900 border border-white/15 rounded-lg px-3 py-2 text-xs text-white outline-none cursor-pointer"
              >
                <option value="rally">RALLY</option>
                <option value="pista">PISTA</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-neutral-300 mb-1">CANT. FECHAS</label>
              <input
                type="number"
                value={cantidadFechas}
                onChange={(e) => setCantidadFechas(e.target.value)}
                min="1"
                max="30"
                required
                className="w-full bg-neutral-900 border border-white/15 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none focus:border-[#38bdf8]"
              />
            </div>
            <button
              type="submit"
              className="bg-[#38bdf8] hover:bg-[#7dd3fc] text-slate-950 font-black text-xs py-2 px-4 rounded-lg cursor-pointer transition"
            >
              + CREAR CAMPEONATO
            </button>
          </form>

          {campeonatoSeleccionado && fechaSeleccionadaId && (
            <div className="space-y-3">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <span className="text-xs text-[#38bdf8] font-bold">
                  CARGA DE RESULTADOS • {campeonatoSeleccionado.nombre}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={fechaSeleccionadaId}
                    onChange={(e) => {
                      setFechaSeleccionadaId(e.target.value);
                      cargarResultadosFecha(e.target.value);
                    }}
                    className="bg-neutral-900 border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white cursor-pointer"
                  >
                    {fechasCampeonato.map((f, i) => (
                      <option key={f.id} value={f.id}>
                        {f.titulo_fecha || `FECHA ${f.numero_fecha || i + 1}`}
                      </option>
                    ))}
                  </select>

                  {campeonatoSeleccionado.modalidad === 'rally' && (
                    <button
                      type="button"
                      onClick={handleFinalizarRallyPorCategoria}
                      disabled={calculandoAuto || resultadosFecha.length === 0}
                      className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/50 text-[11px] font-black px-3 py-1.5 rounded-lg cursor-pointer disabled:opacity-40"
                    >
                      {calculandoAuto ? 'CALCULANDO...' : 'TERMINAR RALLY Y DAR PUNTOS'}
                    </button>
                  )}
                </div>
              </div>

              <form onSubmit={handleGuardarPuntosPiloto} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="block text-[10px] text-neutral-300 mb-1">NOMBRE PILOTO</label>
                  <input
                    type="text"
                    value={formCargaPiloto.piloto_nombre}
                    onChange={(e) => setFormCargaPiloto({ ...formCargaPiloto, piloto_nombre: e.target.value })}
                    placeholder="NOMBRE PILOTO"
                    required
                    className="w-full bg-neutral-900 border border-white/15 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#38bdf8] mb-1">CATEGORÍA</label>
                  <input
                    type="text"
                    value={formCargaPiloto.categoria}
                    onChange={(e) => setFormCargaPiloto({ ...formCargaPiloto, categoria: e.target.value })}
                    placeholder="EJ: RC2 / AYGO CUP"
                    required
                    className="w-full bg-neutral-900 border border-white/15 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#38bdf8] mb-1">POSICIÓN EN CATEGORÍA</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formCargaPiloto.posicion_final}
                    onChange={(e) => setFormCargaPiloto({ ...formCargaPiloto, posicion_final: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/15 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none focus:border-[#38bdf8]"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-[#38bdf8] hover:bg-[#7dd3fc] text-slate-950 font-black text-xs py-2 px-4 rounded-lg cursor-pointer transition"
                >
                  GUARDAR PILOTO
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Cuerpo principal: Izquierda Historial de Campeonatos Activos | Derecha Tabla con Filtro por Categoría */}
      {cargando && campeonatos.length === 0 ? (
        <div className="bg-neutral-900/65 backdrop-blur-md border border-white/15 rounded-2xl p-8 text-center text-xs text-neutral-300">
          CARGANDO CAMPEONATOS...
        </div>
      ) : campeonatos.length === 0 ? (
        <div className="bg-neutral-900/65 backdrop-blur-md border border-white/15 rounded-2xl p-8 text-center text-xs text-neutral-400">
          NO HAY CAMPEONATOS CREADOS TODAVÍA.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

          {/* Columna izquierda: Historial de campeonatos activos y sus fechas */}
          <div className="lg:col-span-4 bg-neutral-900/65 backdrop-blur-md border border-white/15 rounded-2xl p-4 shadow-2xl space-y-3">
            <h3 className="text-xs font-black text-[#38bdf8] border-b border-white/10 pb-2 tracking-wider">
              HISTORIAL DE CAMPEONATOS ACTIVOS
            </h3>

            <div className="space-y-2.5">
              {campeonatos.map((camp) => {
                const seleccionado = String(camp.id) === String(campeonatoSeleccionado?.id);
                return (
                  <div
                    key={camp.id}
                    className={`rounded-xl border transition overflow-hidden ${
                      seleccionado
                        ? 'bg-neutral-950/90 border-[#38bdf8] shadow-[0_0_15px_rgba(56,189,248,0.2)]'
                        : 'bg-neutral-950/60 border-white/10 hover:border-white/25'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => seleccionarCampeonato(camp)}
                      className="w-full text-left px-3.5 py-2.5 flex justify-between items-center cursor-pointer"
                    >
                      <span className="text-sm font-black text-white">{camp.nombre}</span>
                      <span className="text-[10px] text-[#38bdf8]">{camp.modalidad || 'RALLY'}</span>
                    </button>

                    {seleccionado && fechasCampeonato.length > 0 && (
                      <div className="px-3 pb-3 pt-1 border-t border-white/10 space-y-1.5">
                        <button
                          type="button"
                          onClick={() => setVistaTabla('acumulado')}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] flex justify-between items-center cursor-pointer transition ${
                            vistaTabla === 'acumulado'
                              ? 'bg-[#38bdf8] text-slate-950 font-black'
                              : 'bg-neutral-900 text-neutral-200 hover:bg-neutral-800'
                          }`}
                        >
                          <span>SUMATORIA GENERAL (TODAS LAS FECHAS)</span>
                          <span>TOTAL</span>
                        </button>

                        {fechasCampeonato.map((f, idx) => {
                          const numF = Number(f.numero_fecha) || idx + 1;
                          const activaFecha = vistaTabla === 'fecha' && String(f.id) === String(fechaSeleccionadaId);
                          return (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => {
                                setVistaTabla('fecha');
                                setFechaSeleccionadaId(f.id);
                                cargarResultadosFecha(f.id);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] flex justify-between items-center cursor-pointer transition ${
                                activaFecha
                                  ? 'bg-[#38bdf8]/25 text-[#38bdf8] border border-[#38bdf8]/60 font-black'
                                  : 'bg-neutral-900/70 text-neutral-300 hover:bg-neutral-800'
                              }`}
                            >
                              <span>{f.titulo_fecha || `FECHA ${numF}`}</span>
                              <span className="text-[10px] font-mono text-neutral-400">{f.fecha_programada || ''}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Columna derecha: Selector de categoría + Tabla POSICION / NOMBRE / CATEGORIA / PUNTOS */}
          <div className="lg:col-span-8 bg-neutral-900/65 backdrop-blur-md border border-white/15 rounded-2xl p-4 shadow-2xl space-y-3">
            <div className="flex flex-wrap justify-between items-center gap-2 border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] text-[#38bdf8] font-bold">
                  {campeonatoSeleccionado?.nombre} • {vistaTabla === 'acumulado' ? 'ACUMULADO F1 + F2...' : 'POR FECHA'}
                </span>
                <h3 className="text-base md:text-lg font-black text-white">
                  {filtroCategoria === 'GENERAL' ? 'SUMATORIA GENERAL' : `CATEGORÍA: ${filtroCategoria}`}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-[10px] text-neutral-300">CATEGORÍA:</label>
                <select
                  value={filtroCategoria}
                  onChange={(e) => setFiltroCategoria(e.target.value)}
                  className="bg-neutral-950 border border-[#38bdf8]/60 text-[#38bdf8] text-xs font-black rounded-xl px-3 py-1.5 outline-none cursor-pointer"
                >
                  {categoriasDisponibles.map((cat) => (
                    <option key={cat} value={cat} className="bg-neutral-900 text-white">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto bg-neutral-950/80 border border-white/10 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/15 text-[#38bdf8] bg-black/60">
                    <th className="py-2.5 px-3 w-20">POSICION</th>
                    <th className="py-2.5 px-3">NOMBRE</th>
                    <th className="py-2.5 px-3">CATEGORIA</th>
                    {vistaTabla === 'acumulado' &&
                      fechasCampeonato.map((f, i) => (
                        <th key={f.id} className="py-2.5 px-2 text-center text-neutral-300">
                          F{Number(f.numero_fecha) || i + 1}
                        </th>
                      ))}
                    <th className="py-2.5 px-3 text-right">PUNTOS</th>
                    {esAdmin && vistaTabla === 'fecha' && <th className="py-2.5 px-3 text-center w-16">ACCION</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filasActivas.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4 + (vistaTabla === 'acumulado' ? fechasCampeonato.length : esAdmin ? 1 : 0)}
                        className="py-8 px-4 text-center text-neutral-400"
                      >
                        SIN PUNTOS REGISTRADOS PARA ESTE FILTRO.
                      </td>
                    </tr>
                  ) : (
                    filasActivas.map((fila, idx) => (
                      <tr key={`${fila.nombre}-${fila.categoria}-${idx}`} className="hover:bg-white/5 transition">
                        <td className="py-2.5 px-3 font-black text-[#38bdf8]">{idx + 1}º</td>
                        <td className="py-2.5 px-3 font-bold text-white">{fila.nombre}</td>
                        <td className="py-2.5 px-3 font-mono text-sky-200">{fila.categoria}</td>
                        {vistaTabla === 'acumulado' &&
                          fechasCampeonato.map((f, i) => {
                            const numF = Number(f.numero_fecha) || i + 1;
                            return (
                              <td key={f.id} className="py-2.5 px-2 text-center font-mono text-neutral-300">
                                {fila.porFecha?.[numF] || 0}
                              </td>
                            );
                          })}
                        <td className="py-2.5 px-3 text-right font-mono font-black text-[#38bdf8]">
                          {fila.total} PTS
                        </td>
                        {esAdmin && vistaTabla === 'fecha' && (
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => eliminarResultadoPiloto(fila.id)}
                              className="text-red-400 hover:text-red-300 cursor-pointer"
                            >
                              🗑️
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}