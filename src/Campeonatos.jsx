import { useState, useEffect, useRef, useMemo } from 'react';
import { api } from './api';

export default function Campeonatos({ esAdmin }) {
  const [campeonatos, setCampeonatos] = useState([]);
  const [campeonatoSeleccionado, setCampeonatoSeleccionado] = useState(null);
  const [fechasCampeonato, setFechasCampeonato] = useState([]);
  const [todosResultadosCamp, setTodosResultadosCamp] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [calculandoAuto, setCalculandoAuto] = useState(false);

  const cacheResultadosFecha = useRef({});
  const cacheTodosResultadosCamp = useRef({});
  const cacheFechasCamp = useRef({});

  // Formulario de creación
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [modalidadTorneo, setModalidadTorneo] = useState('rally'); // 'rally' o 'pista'
  const [cantidadFechas, setCantidadFechas] = useState(5);

  // Escalas de puntos
  const [strPuntosQ, setStrPuntosQ] = useState('10, 8, 6, 4, 2');
  const [strPuntosF1, setStrPuntosF1] = useState('25, 18, 15, 12, 10, 8, 6, 4, 2, 1');
  const [strPuntosF2, setStrPuntosF2] = useState('25, 18, 15, 12, 10, 8, 6, 4, 2, 1');
  const [strPuntosTramo, setStrPuntosTramo] = useState('25, 18, 15, 12, 10, 8, 6, 4, 2, 1');

  // Gestión de resultados por fecha y filtros
  const [fechaSeleccionadaId, setFechaSeleccionadaId] = useState('');
  const [resultadosFecha, setResultadosFecha] = useState([]);
  const [categoriaFiltroFecha, setCategoriaFiltroFecha] = useState('TODAS');
  const [categoriaFiltroGeneral, setCategoriaFiltroGeneral] = useState('TODAS');

  // Formulario de carga manual
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
    setCategoriaFiltroFecha('TODAS');
    setCategoriaFiltroGeneral('TODAS');

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

  const categoriasEnFecha = useMemo(() => {
    const setCats = new Set();
    resultadosFecha.forEach((r) => {
      const cat = String(r.categoria || 'GENERAL').trim().toUpperCase();
      if (cat) setCats.add(cat);
    });
    return ['TODAS', ...Array.from(setCats)];
  }, [resultadosFecha]);

  const resultadosFechaFiltrados = useMemo(() => {
    const normalizados = resultadosFecha.map((r, idx) => ({
      ...r,
      categoria: String(r.categoria || 'GENERAL').trim().toUpperCase(),
      posicion_final: Number(r.posicion_final) || idx + 1,
      puntos_total: Number(r.puntos_total) || 0
    }));

    const filtrados =
      categoriaFiltroFecha === 'TODAS'
        ? normalizados
        : normalizados.filter((item) => item.categoria === categoriaFiltroFecha);

    return filtrados.sort((a, b) => {
      if (categoriaFiltroFecha === 'TODAS' && a.categoria !== b.categoria) {
        return a.categoria.localeCompare(b.categoria);
      }
      if (a.posicion_final !== b.posicion_final) {
        return a.posicion_final - b.posicion_final;
      }
      return b.puntos_total - a.puntos_total;
    });
  }, [resultadosFecha, categoriaFiltroFecha]);

  const categoriasEnGeneral = useMemo(() => {
    const setCats = new Set();
    todosResultadosCamp.forEach((r) => {
      const cat = String(r.categoria || 'GENERAL').trim().toUpperCase();
      if (cat) setCats.add(cat);
    });
    return ['TODAS', ...Array.from(setCats)];
  }, [todosResultadosCamp]);

  // Suma puntos de FECHA 1 + FECHA 2 + ... y permite filtrar por categoría
  const tablaGeneralCalculada = useMemo(() => {
    const mapaFechas = new Map();
    fechasCampeonato.forEach((f, i) => {
      mapaFechas.set(String(f.id), Number(f.numero_fecha) || i + 1);
    });

    const agrupado = new Map();

    todosResultadosCamp.forEach((r) => {
      const piloto = String(r.piloto_nombre || '').trim().toUpperCase();
      if (!piloto) return;
      const categoria = String(r.categoria || 'GENERAL').trim().toUpperCase();
      const numFecha = mapaFechas.get(String(r.fecha_id)) || 1;
      const pts = Number(r.puntos_total) || 0;

      if (categoriaFiltroGeneral !== 'TODAS' && categoria !== categoriaFiltroGeneral) {
        return;
      }

      const clave = categoriaFiltroGeneral === 'TODAS' ? `${piloto}__${categoria}` : piloto;
      if (!agrupado.has(clave)) {
        agrupado.set(clave, {
          nombre: piloto,
          categoria,
          total: 0,
          puntosPorFecha: {}
        });
      }

      const entry = agrupado.get(clave);
      entry.puntosPorFecha[numFecha] = (entry.puntosPorFecha[numFecha] || 0) + pts;
      entry.total += pts;
    });

    return Array.from(agrupado.values()).sort((a, b) => b.total - a.total);
  }, [todosResultadosCamp, fechasCampeonato, categoriaFiltroGeneral]);

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

      const fechaObj = listaFechas.find(f => String(f.id) === String(fechaSeleccionadaId));
      alert(`¡${fechaObj?.titulo_fecha || 'Fecha'} guardada en el historial y puntos sumados a la tabla general!`);
    } catch (err) {
      console.error('Error al asignar puntos al finalizar el rally:', err);
      alert('Ocurrió un error al asignar los puntos de la fecha.');
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
    for (let i = 1; i <= parseInt(cantidadFechas); i++) {
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
    alert('¡Campeonato creado con éxito!');
    await cargarCampeonatos(true);
  }

  async function handleGuardarPuntosPiloto(e) {
    e.preventDefault();
    if (!fechaSeleccionadaId || !formCargaPiloto.piloto_nombre.trim()) return;

    const esRally = campeonatoSeleccionado?.modalidad === 'rally';
    const nombrePiloto = formCargaPiloto.piloto_nombre.toUpperCase().trim();
    const categoriaPiloto = (formCargaPiloto.categoria || 'GENERAL').toUpperCase().trim();
    const posFinal = Math.max(1, parseInt(formCargaPiloto.posicion_final) || 1);

    let ptsQ = 0, ptsF1 = 0, ptsF2 = 0, ptsT1 = 0, ptsT2 = 0, ptsT3 = 0, ptsT4 = 0;

    if (!esRally) {
      const arrQ = campeonatoSeleccionado?.puntos_qualy || parsearEscalaPuntos(strPuntosQ);
      const arrF1 = campeonatoSeleccionado?.puntos_final1 || parsearEscalaPuntos(strPuntosF1);
      const arrF2 = campeonatoSeleccionado?.puntos_final2 || parsearEscalaPuntos(strPuntosF2);

      const pq = parseInt(formCargaPiloto.pos_qualy) || 0;
      const pf1 = parseInt(formCargaPiloto.pos_final1) || 0;
      const pf2 = parseInt(formCargaPiloto.pos_final2) || 0;

      ptsQ = pq > 0 && pq <= arrQ.length ? arrQ[pq - 1] : 0;
      ptsF1 = pf1 > 0 && pf1 <= arrF1.length ? arrF1[pf1 - 1] : 0;
      ptsF2 = pf2 > 0 && pf2 <= arrF2.length ? arrF2[pf2 - 1] : 0;
    }

    const total = ptsQ + ptsF1 + ptsF2 + ptsT1 + ptsT2 + ptsT3 + ptsT4;

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
      puntos_tramo1: ptsT1,
      puntos_tramo2: ptsT2,
      puntos_tramo3: ptsT3,
      puntos_tramo4: ptsT4,
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
      alert('Error al eliminar resultado del piloto: ' + error.message);
      return;
    }
    delete cacheResultadosFecha.current[fechaSeleccionadaId];
    delete cacheTodosResultadosCamp.current[campeonatoSeleccionado.id];
    await cargarResultadosFecha(fechaSeleccionadaId, true);
    await cargarTodosResultadosCampeonato(campeonatoSeleccionado.id, fechasCampeonato, true);
  }

  async function eliminarCampeonato(id) {
    if (!confirm('¿Estás seguro de eliminar este campeonato?')) return;
    const { error } = await api.from('campeonatos').eq('id', id).delete();
    if (error) {
      alert('Error al eliminar campeonato: ' + error.message);
      return;
    }
    delete cacheFechasCamp.current[id];
    delete cacheTodosResultadosCamp.current[id];
    setCampeonatoSeleccionado(null);
    await cargarCampeonatos(true);
  }

  const esRallyActivo = campeonatoSeleccionado?.modalidad === 'rally';
  const fechaActualObj = fechasCampeonato.find(f => String(f.id) === String(fechaSeleccionadaId));

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-wrc text-white uppercase">

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-neutral-900/40 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
        <div>
          <h2 className="text-3xl text-[#38bdf8] tracking-wide">CAMPEONATOS OFICIALES</h2>
          <p className="text-neutral-300 text-xs">
            {esRallyActivo
              ? 'RALLY: RESULTADOS POR FECHA Y TABLA GENERAL ACUMULADA POR CATEGORÍA.'
              : 'GESTIÓN DE PISTA (QUALY + FINALES).'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={campeonatoSeleccionado?.id || ''}
            onChange={(e) => {
              const enc = campeonatos.find(c => c.id === e.target.value);
              if (enc) seleccionarCampeonato(enc);
            }}
            className="bg-neutral-950 border border-[#38bdf8]/60 text-white text-xs rounded-xl px-3 py-2.5 outline-none font-wrc cursor-pointer shadow-lg"
          >
            {campeonatos.map(c => (
              <option key={c.id} value={c.id} className="bg-neutral-900 text-white">{c.nombre} ({c.modalidad?.toUpperCase()})</option>
            ))}
          </select>

          {esAdmin && campeonatoSeleccionado && (
            <button
              onClick={() => eliminarCampeonato(campeonatoSeleccionado.id)}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-2.5 rounded-xl text-xs cursor-pointer transition"
              title="Eliminar campeonato"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* PANEL DE ADMIN: CREAR TORNEO PISTA VS RALLY */}
      {esAdmin && (
        <div className="bg-neutral-900/90 backdrop-blur-md border border-[#38bdf8]/50 rounded-2xl p-5 shadow-2xl space-y-4">
          <h3 className="text-sm text-[#38bdf8] font-black">➕ CREAR NUEVO CAMPEONATO (ELEGIR MODALIDAD)</h3>

          <form onSubmit={handleCrearCampeonato} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-neutral-300 mb-1">NOMBRE DEL TORNEO</label>
                <input
                  type="text"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="EJ: RALLY MISIONES 2027"
                  required
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white uppercase outline-none focus:border-[#38bdf8]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#38bdf8] mb-1">MODALIDAD</label>
                <select
                  value={modalidadTorneo}
                  onChange={(e) => setModalidadTorneo(e.target.value)}
                  className="w-full bg-neutral-950 border border-[#38bdf8]/60 rounded-lg px-3 py-2 text-xs text-white outline-none cursor-pointer font-wrc"
                >
                  <option value="rally">RALLY (POR CATEGORÍA AL FINALIZAR)</option>
                  <option value="pista">PISTA (QUALY + FINALES)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-neutral-300 mb-1">CANTIDAD DE FECHAS</label>
                <input
                  type="number"
                  value={cantidadFechas}
                  onChange={(e) => setCantidadFechas(e.target.value)}
                  min="1" max="20"
                  required
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white uppercase outline-none focus:border-[#38bdf8]"
                />
              </div>
            </div>

            {modalidadTorneo === 'rally' ? (
              <div className="border-t border-white/10 pt-3">
                <label className="block text-[10px] text-[#38bdf8] mb-1">ESCALA DE PUNTOS POR POSICIÓN EN CATEGORÍA (1º, 2º, 3º... SEPARADAS POR COMA)</label>
                <input
                  type="text"
                  value={strPuntosTramo}
                  onChange={(e) => setStrPuntosTramo(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white uppercase outline-none focus:border-[#38bdf8] font-mono"
                />
              </div>
            ) : (
              <div className="border-t border-white/10 pt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] text-[#38bdf8] mb-1">PUNTOS QUALY (1º, 2º, 3º... SEPARADAS POR COMA)</label>
                  <input
                    type="text"
                    value={strPuntosQ}
                    onChange={(e) => setStrPuntosQ(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white uppercase outline-none focus:border-[#38bdf8] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#38bdf8] mb-1">PUNTOS FINAL 1 (1º, 2º, 3º... SEPARADAS POR COMA)</label>
                  <input
                    type="text"
                    value={strPuntosF1}
                    onChange={(e) => setStrPuntosF1(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white uppercase outline-none focus:border-[#38bdf8] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#38bdf8] mb-1">PUNTOS FINAL 2 (1º, 2º, 3º... SEPARADAS POR COMA)</label>
                  <input
                    type="text"
                    value={strPuntosF2}
                    onChange={(e) => setStrPuntosF2(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white uppercase outline-none focus:border-[#38bdf8] font-mono"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-[#38bdf8] hover:bg-[#7dd3fc] text-slate-950 font-black text-xs px-6 py-2.5 rounded-lg transition shadow cursor-pointer"
              >
                CREAR CAMPEONATO
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VISTA PRINCIPAL */}
      {!campeonatoSeleccionado ? (
        <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-10 text-center text-neutral-400 text-xs">
          {cargando ? 'CARGANDO CAMPEONATOS...' : 'NO HAY CAMPEONATOS CREADOS. CREÁ UNO NUEVO ARRIBA.'}
        </div>
      ) : (
        <div className="space-y-6">

          {/* RESULTADOS POR FECHA (FECHA 1, FECHA 2...) */}
          <div className="bg-neutral-950/90 border border-[#38bdf8]/40 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/10 pb-3">
              <div>
                <h3 className="text-[#38bdf8] text-xs font-black">
                  🏁 RESULTADOS DE LA FECHA ({fechaActualObj?.titulo_fecha || 'FECHA'}) • {campeonatoSeleccionado.modalidad?.toUpperCase()}
                </h3>
                <p className="text-[10px] text-neutral-400">
                  CARGÁ PILOTO, CATEGORÍA Y POSICIÓN; AL TERMINAR EL RALLY SE GUARDA COMO {fechaActualObj?.titulo_fecha || 'FECHA'}.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {esAdmin && esRallyActivo && (
                  <button
                    type="button"
                    onClick={handleFinalizarRallyPorCategoria}
                    disabled={calculandoAuto || !fechaSeleccionadaId || resultadosFecha.length === 0}
                    className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/50 font-black text-[10px] px-3 py-1.5 rounded-lg transition cursor-pointer disabled:opacity-50"
                  >
                    {calculandoAuto ? 'GUARDANDO...' : '🏁 TERMINAR RALLY Y DAR PUNTOS'}
                  </button>
                )}

                <select
                  value={fechaSeleccionadaId}
                  onChange={(e) => {
                    setCategoriaFiltroFecha('TODAS');
                    setFechaSeleccionadaId(e.target.value);
                    cargarResultadosFecha(e.target.value);
                  }}
                  className="bg-neutral-900 border border-neutral-700 text-white text-xs rounded-lg px-3 py-1.5 outline-none font-wrc cursor-pointer"
                >
                  {fechasCampeonato.map(f => (
                    <option key={f.id} value={f.id} className="bg-neutral-900 text-white">{f.titulo_fecha}</option>
                  ))}
                </select>
              </div>
            </div>

            {esAdmin && (
              <form onSubmit={handleGuardarPuntosPiloto} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="block text-[10px] text-neutral-300 mb-1">NOMBRE PILOTO</label>
                  <input
                    type="text"
                    value={formCargaPiloto.piloto_nombre}
                    onChange={(e) => setFormCargaPiloto({ ...formCargaPiloto, piloto_nombre: e.target.value })}
                    placeholder="EJ: LEO ESPINDOLA"
                    required
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white uppercase outline-none focus:border-[#38bdf8]"
                  />
                </div>

                {esRallyActivo ? (
                  <>
                    <div>
                      <label className="block text-[10px] text-[#38bdf8] mb-1">CATEGORÍA</label>
                      <input
                        type="text"
                        value={formCargaPiloto.categoria}
                        onChange={(e) => setFormCargaPiloto({ ...formCargaPiloto, categoria: e.target.value })}
                        placeholder="EJ: RC2, AYGO CUP"
                        required
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white uppercase outline-none focus:border-[#38bdf8]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#38bdf8] mb-1">POSICIÓN EN CATEGORÍA</label>
                      <input
                        type="number"
                        value={formCargaPiloto.posicion_final}
                        onChange={(e) => setFormCargaPiloto({ ...formCargaPiloto, posicion_final: e.target.value })}
                        min="1"
                        max="50"
                        required
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-[10px] text-[#38bdf8] mb-1">POSICIÓN QUALY</label>
                      <input type="number" value={formCargaPiloto.pos_qualy} onChange={(e) => setFormCargaPiloto({ ...formCargaPiloto, pos_qualy: e.target.value })} min="1" max="30" className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white font-mono" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#38bdf8] mb-1">POSICIÓN FINAL 1</label>
                      <input type="number" value={formCargaPiloto.pos_final1} onChange={(e) => setFormCargaPiloto({ ...formCargaPiloto, pos_final1: e.target.value })} min="1" max="30" className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white font-mono" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#38bdf8] mb-1">POSICIÓN FINAL 2</label>
                      <input type="number" value={formCargaPiloto.pos_final2} onChange={(e) => setFormCargaPiloto({ ...formCargaPiloto, pos_final2: e.target.value })} min="1" max="30" className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white font-mono" />
                    </div>
                  </>
                )}

                <div>
                  <button
                    type="submit"
                    className="w-full bg-[#38bdf8] hover:bg-[#7dd3fc] text-slate-950 font-black text-xs px-4 py-2 rounded-lg transition shadow cursor-pointer"
                  >
                    GUARDAR EN FECHA
                  </button>
                </div>
              </form>
            )}

            {/* Botones de filtro por categoría en la fecha */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/10">
              <span className="text-[10px] text-neutral-400 mr-1">FILTRAR FECHA POR CATEGORÍA:</span>
              {categoriasEnFecha.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoriaFiltroFecha(cat)}
                  className={`px-3 py-1 rounded-lg text-[10px] tracking-wider transition cursor-pointer ${
                    categoriaFiltroFecha === cat
                      ? 'bg-[#38bdf8] text-slate-950 font-black'
                      : 'bg-neutral-900 text-neutral-300 border border-white/15 hover:border-[#38bdf8]/50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Tabla de la fecha: POS, NOMBRE, CATEGORÍA, PUNTOS */}
            <div className="overflow-x-auto bg-black/50 border border-white/10 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[#38bdf8] border-b border-white/10 bg-white/5">
                    <th className="py-2 px-3 w-14">POS</th>
                    <th className="py-2 px-3">NOMBRE</th>
                    <th className="py-2 px-3">CATEGORÍA</th>
                    <th className="py-2 px-3 text-right">PUNTOS</th>
                    {esAdmin && <th className="py-2 px-3 text-center w-20">ACCIÓN</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {resultadosFechaFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={esAdmin ? 5 : 4} className="py-6 px-3 text-center text-neutral-400">
                        NO HAY PILOTOS CARGADOS EN ESTA FECHA PARA EL FILTRO SELECCIONADO.
                      </td>
                    </tr>
                  ) : (
                    resultadosFechaFiltrados.map((rf, idx) => (
                      <tr key={rf.id || idx} className="hover:bg-white/5">
                        <td className="py-2 px-3 font-mono text-[#38bdf8]">{rf.posicion_final || idx + 1}º</td>
                        <td className="py-2 px-3 font-bold text-white">{rf.piloto_nombre}</td>
                        <td className="py-2 px-3 font-mono text-sky-200">{rf.categoria}</td>
                        <td className="py-2 px-3 text-right font-mono font-black text-[#38bdf8]">
                          {Number(rf.puntos_total) || 0} PTS
                        </td>
                        {esAdmin && (
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => eliminarResultadoPiloto(rf.id)}
                              className="text-red-400 hover:text-red-300 text-xs cursor-pointer"
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

          {/* HISTORIAL DE FECHAS Y TABLA GENERAL ACUMULADA (FECHA 1 + FECHA 2...) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-neutral-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl space-y-3">
              <h3 className="text-[#38bdf8] text-xs font-black border-b border-white/10 pb-2">
                HISTORIAL DE FECHAS ({fechasCampeonato.length})
              </h3>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {fechasCampeonato.map((f, index) => {
                  const activa = String(f.id) === String(fechaSeleccionadaId);
                  const numF = Number(f.numero_fecha) || index + 1;
                  const ptsEnFecha = todosResultadosCamp
                    .filter(r => String(r.fecha_id) === String(f.id))
                    .reduce((acc, r) => acc + (Number(r.puntos_total) || 0), 0);

                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setCategoriaFiltroFecha('TODAS');
                        setFechaSeleccionadaId(f.id);
                        cargarResultadosFecha(f.id);
                      }}
                      className={`w-full text-left rounded-xl p-3 flex justify-between items-center border transition cursor-pointer ${
                        activa
                          ? 'bg-[#38bdf8]/15 border-[#38bdf8]'
                          : 'bg-neutral-950/70 border-white/5 hover:border-white/25'
                      }`}
                    >
                      <div>
                        <span className="text-[10px] text-[#38bdf8] font-bold">
                          {f.titulo_fecha || `FECHA ${numF}`}
                        </span>
                        <p className="text-xs text-white">{f.fecha_programada}</p>
                        <p className="text-[10px] text-neutral-400 font-mono">{ptsEnFecha} PTS REPARTIDOS</p>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                        {(f.estado || 'PENDIENTE').toUpperCase()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-2 bg-neutral-950/85 backdrop-blur-md border border-white/15 rounded-2xl overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-[#38bdf8]/20 via-neutral-900 to-neutral-900 px-4 py-3 border-b border-[#38bdf8]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-white text-xs tracking-wider font-black">
                  🏆 TABLA GENERAL - {campeonatoSeleccionado.nombre} ({campeonatoSeleccionado.modalidad?.toUpperCase()})
                </h3>

                <div className="flex flex-wrap items-center gap-1">
                  {categoriasEnGeneral.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoriaFiltroGeneral(cat)}
                      className={`px-2.5 py-0.5 rounded text-[10px] transition cursor-pointer ${
                        categoriaFiltroGeneral === cat
                          ? 'bg-[#38bdf8] text-slate-950 font-black'
                          : 'bg-neutral-900 text-neutral-300 border border-white/15 hover:border-[#38bdf8]/50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
                  <thead>
                    <tr className="border-b border-white/15 text-[#38bdf8] tracking-wider bg-black/70">
                      <th className="py-2.5 px-3 text-center w-10">POS</th>
                      <th className="py-2.5 px-3">PILOTO</th>
                      <th className="py-2.5 px-3">CATEGORÍA</th>
                      {fechasCampeonato.map((f, idx) => {
                        const numF = Number(f.numero_fecha) || idx + 1;
                        return (
                          <th key={f.id} className="py-2.5 px-2.5 text-center">
                            F{numF}
                          </th>
                        );
                      })}
                      <th className="py-2.5 px-3 text-right text-[#38bdf8] border-l border-white/10">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {tablaGeneralCalculada.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3 + fechasCampeonato.length + 1}
                          className="text-center py-10 text-neutral-400 text-xs"
                        >
                          TODAVÍA NO HAY PUNTOS REGISTRADOS EN ESTE CAMPEONATO.
                        </td>
                      </tr>
                    ) : (
                      tablaGeneralCalculada.map((p, idx) => {
                        const esPrimero = idx === 0;
                        const colorPos = esPrimero
                          ? 'bg-[#38bdf8] text-slate-950 font-black'
                          : idx === 1
                            ? 'bg-neutral-300 text-black font-black'
                            : idx === 2
                              ? 'bg-sky-700 text-white font-black'
                              : 'text-neutral-300 font-bold';

                        return (
                          <tr key={`${p.nombre}-${p.categoria}-${idx}`} className={`hover:bg-white/5 transition ${esPrimero ? 'bg-[#38bdf8]/10' : ''}`}>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`inline-block w-5 h-5 leading-5 rounded text-[11px] ${colorPos}`}>{idx + 1}</span>
                            </td>
                            <td className="py-2.5 px-3 font-bold text-white">{p.nombre}</td>
                            <td className="py-2.5 px-3 font-mono text-sky-200">{p.categoria}</td>
                            {fechasCampeonato.map((f, fIdx) => {
                              const numF = Number(f.numero_fecha) || fIdx + 1;
                              return (
                                <td key={f.id} className="py-2.5 px-2.5 text-center font-mono text-neutral-300">
                                  {p.puntosPorFecha[numF] || 0}
                                </td>
                              );
                            })}
                            <td className="py-2.5 px-3 text-right font-mono font-black text-[#38bdf8] border-l border-white/10 bg-sky-950/20 text-sm">
                              {p.total} PTS
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
      )}

    </div>
  );
}