import { useState, useEffect, useRef } from 'react';
import { api } from './api';

const normalizarCategoriaRally = (j, nombreAuto = '') => {
  const rawCat = String(
    j?.carClass ||
    j?.class ||
    j?.category ||
    j?.categoria ||
    j?.car?.class ||
    j?.car?.category ||
    ''
  ).trim().toUpperCase();

  if (rawCat && rawCat !== '---' && rawCat !== 'GENERAL') {
    return rawCat;
  }

  const autoUpper = String(nombreAuto || '').trim().toUpperCase();
  const clasesIndependientes = [
    'RALLY1', 'RC1',
    'RALLY2', 'RC2',
    'RALLY3', 'RC3',
    'RALLY4', 'RC4',
    'RALLY5', 'RC5',
    'AYGO CUP', 'AYGO',
    'GT3', 'GT4', 'GTE',
    'TCR', 'N5', 'MAXI', 'HISTORIC', 'GROUP A', 'GROUP B'
  ];

  for (const clase of clasesIndependientes) {
    if (autoUpper.includes(clase)) {
      return clase;
    }
  }

  return 'GENERAL';
};

export default function Campeonatos({ esAdmin }) {
  const [campeonatos, setCampeonatos] = useState([]);
  const [campeonatoSeleccionado, setCampeonatoSeleccionado] = useState(null);
  const [fechasCampeonato, setFechasCampeonato] = useState([]);
  const [tablaPosiciones, setTablaPosiciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [calculandoAuto, setCalculandoAuto] = useState(false);

  const cacheResultadosFecha = useRef({});
  const cacheTablasGenerales = useRef({});
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

  // Gestión de resultados por fecha
  const [fechaSeleccionadaId, setFechaSeleccionadaId] = useState('');
  const [resultadosFecha, setResultadosFecha] = useState([]);

  // Formulario de carga manual para Rally o Pista
  const [formCargaPiloto, setFormCargaPiloto] = useState({
    piloto_nombre: '',
    pos_qualy: 1,
    pos_final1: 1,
    pos_final2: 1,
    pos_tramo1: 1,
    pos_tramo2: 1,
    pos_tramo3: 1,
    pos_tramo4: 1,
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
        seleccionarCampeonato(actual, forzarRefresco);
      }
    } else {
      setCampeonatos([]);
      setCampeonatoSeleccionado(null);
      setFechasCampeonato([]);
      setTablaPosiciones([]);
    }
    setCargando(false);
  }

  async function seleccionarCampeonato(camp, forzarRefresco = false) {
    setCampeonatoSeleccionado(camp);

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
      const primeraFechaId = fechas[0].id;
      setFechaSeleccionadaId(primeraFechaId);
      cargarResultadosFecha(primeraFechaId, forzarRefresco);
    } else {
      setFechaSeleccionadaId('');
      setResultadosFecha([]);
    }

    calcularTablaGeneral(camp.id, forzarRefresco);
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

  async function calcularTablaGeneral(campId, forzarRefresco = false) {
    if (!forzarRefresco && cacheTablasGenerales.current[campId]) {
      setTablaPosiciones(cacheTablasGenerales.current[campId]);
      return;
    }

    const { data: listaOrdenada } = await api.getTablaCampeonato(campId);
    const tabla = listaOrdenada || [];
    cacheTablasGenerales.current[campId] = tabla;
    setTablaPosiciones(tabla);
  }

  function parsearEscalaPuntos(str) {
    return str.split(',').map(n => parseInt(n.trim()) || 0);
  }

  async function handleAutoCalcularPuntosRally() {
    if (!esAdmin || !campeonatoSeleccionado || !fechaSeleccionadaId) return;

    try {
      setCalculandoAuto(true);

      const fechaObj = fechasCampeonato.find(f => String(f.id) === String(fechaSeleccionadaId));
      const numFecha = Number(fechaObj?.numero_fecha) || 1;

      const { data: eventosCamp } = await api.from('eventos').select({
        eq_campeonato_id: String(campeonatoSeleccionado.id)
      });

      const eventosDeLaFecha = Array.isArray(eventosCamp)
        ? eventosCamp.filter(ev => Number(ev.numero_fecha || 1) === numFecha)
        : [];
      const idsEventosFecha = new Set(eventosDeLaFecha.map(ev => String(ev.id)));

      const { data: sesionesRaw, error: errSesiones } = await api.from('resultados_sesiones').select({
        eq_campeonato_id: String(campeonatoSeleccionado.id),
        order: 'fecha.asc'
      });

      if (errSesiones) {
        alert('Error al leer sesiones del rally: ' + errSesiones.message);
        return;
      }

      let sesiones = Array.isArray(sesionesRaw) ? sesionesRaw : [];
      if (idsEventosFecha.size > 0) {
        const filtradasPorEvento = sesiones.filter(s => s.evento_id && idsEventosFecha.has(String(s.evento_id)));
        if (filtradasPorEvento.length > 0) {
          sesiones = filtradasPorEvento;
        }
      }

      const tramosAProcesar = sesiones.slice(0, 4);
      if (tramosAProcesar.length === 0) {
        alert('No se encontraron sesiones guardadas en resultados_sesiones para este campeonato/fecha.');
        return;
      }

      const escala = Array.isArray(campeonatoSeleccionado?.puntos_final1) && campeonatoSeleccionado.puntos_final1.length > 0
        ? campeonatoSeleccionado.puntos_final1.map(n => Number(n) || 0)
        : parsearEscalaPuntos(strPuntosTramo);

      const puntosPorPiloto = {};

      const asegurarPiloto = (nombre) => {
        if (!puntosPorPiloto[nombre]) {
          puntosPorPiloto[nombre] = {
            piloto_nombre: nombre,
            puntos_qualy: 0,
            puntos_final1: 0,
            puntos_final2: 0,
            puntos_tramo1: 0,
            puntos_tramo2: 0,
            puntos_tramo3: 0,
            puntos_tramo4: 0,
            puntos_total: 0,
            sancion_aplicada: ''
          };
        }
        return puntosPorPiloto[nombre];
      };

      tramosAProcesar.forEach((sesion, tramoIdx) => {
        if (!Array.isArray(sesion?.datos_json)) return;

        const porCategoria = {};

        sesion.datos_json.forEach((j) => {
          const nombrePiloto = String(j?.nombre || j?.driver || j?.name || '').trim().toUpperCase();
          const ms = Number(j?.bestLapMs || j?.bestLap || j?.tiempoMs || j?.lastLapMs || 0);
          if (!nombrePiloto || !ms || ms <= 0) return;

          const nombreAuto = typeof j?.auto === 'object' ? (j.auto.name || 'AUTO') : (j?.auto || j?.car || 'AUTO');
          const cat = normalizarCategoriaRally(j, nombreAuto);

          if (!porCategoria[cat]) porCategoria[cat] = [];
          porCategoria[cat].push({ piloto: nombrePiloto, ms });
        });

        const campoTramo = `puntos_tramo${tramoIdx + 1}`;

        Object.values(porCategoria).forEach((pilotosCat) => {
          const ordenadosCat = [...pilotosCat].sort((a, b) => a.ms - b.ms);
          ordenadosCat.forEach((item, posIdx) => {
            const pts = posIdx < escala.length ? escala[posIdx] : 0;
            const reg = asegurarPiloto(item.piloto);
            reg[campoTramo] += pts;
          });
        });
      });

      const pilotosLista = Object.values(puntosPorPiloto);
      if (pilotosLista.length === 0) {
        alert('Las sesiones encontradas no tienen tiempos válidos para asignar puntos.');
        return;
      }

      const { data: existentes } = await api.from('campeonato_resultados_fecha').select({
        eq_fecha_id: fechaSeleccionadaId
      });
      const mapaExistentes = new Map(
        (Array.isArray(existentes) ? existentes : []).map(r => [String(r.piloto_nombre || '').trim().toUpperCase(), r])
      );

      for (const reg of pilotosLista) {
        const total =
          (reg.puntos_tramo1 || 0) +
          (reg.puntos_tramo2 || 0) +
          (reg.puntos_tramo3 || 0) +
          (reg.puntos_tramo4 || 0);

        const payload = {
          ...reg,
          puntos_total: total
        };

        const previo = mapaExistentes.get(reg.piloto_nombre);
        if (previo) {
          await api.from('campeonato_resultados_fecha').update(payload, { eq_id: previo.id });
        } else {
          await api.from('campeonato_resultados_fecha').insert([{
            fecha_id: fechaSeleccionadaId,
            ...payload
          }]);
        }
      }

      delete cacheResultadosFecha.current[fechaSeleccionadaId];
      delete cacheTablasGenerales.current[campeonatoSeleccionado.id];
      await cargarResultadosFecha(fechaSeleccionadaId, true);
      await calcularTablaGeneral(campeonatoSeleccionado.id, true);

      alert(`¡Puntos calculados por categoría para ${pilotosLista.length} pilotos en ${fechaObj?.titulo_fecha || 'la fecha'}!`);
    } catch (err) {
      console.error('Error al autocalcular puntos:', err);
      alert('Ocurrió un error al calcular los puntos automáticamente.');
    } finally {
      setCalculandoAuto(false);
    }
  }

  async function handleCrearCampeonato(e) {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;

    const esCreacionRally = modalidadTorneo === 'rally';
    const escalaTramo = parsearEscalaPuntos(strPuntosTramo);
    const arrQ = esCreacionRally ? escalaTramo : parsearEscalaPuntos(strPuntosQ);
    const arrF1 = esCreacionRally ? escalaTramo : parsearEscalaPuntos(strPuntosF1);
    const arrF2 = esCreacionRally ? escalaTramo : parsearEscalaPuntos(strPuntosF2);

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
    const escala = parsearEscalaPuntos(strPuntosTramo);

    const nombrePiloto = formCargaPiloto.piloto_nombre.toUpperCase().trim();

    let ptsQ = 0, ptsF1 = 0, ptsF2 = 0, ptsT1 = 0, ptsT2 = 0, ptsT3 = 0, ptsT4 = 0;

    if (esRally) {
      const p1 = parseInt(formCargaPiloto.pos_tramo1) || 0;
      const p2 = parseInt(formCargaPiloto.pos_tramo2) || 0;
      const p3 = parseInt(formCargaPiloto.pos_tramo3) || 0;
      const p4 = parseInt(formCargaPiloto.pos_tramo4) || 0;

      ptsT1 = p1 > 0 && p1 <= escala.length ? escala[p1 - 1] : 0;
      ptsT2 = p2 > 0 && p2 <= escala.length ? escala[p2 - 1] : 0;
      ptsT3 = p3 > 0 && p3 <= escala.length ? escala[p3 - 1] : 0;
      ptsT4 = p4 > 0 && p4 <= escala.length ? escala[p4 - 1] : 0;
    } else {
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

    setFormCargaPiloto({ piloto_nombre: '', pos_qualy: 1, pos_final1: 1, pos_final2: 1, pos_tramo1: 1, pos_tramo2: 1, pos_tramo3: 1, pos_tramo4: 1, sancion: '' });
    delete cacheResultadosFecha.current[fechaSeleccionadaId];
    delete cacheTablasGenerales.current[campeonatoSeleccionado.id];
    await cargarResultadosFecha(fechaSeleccionadaId, true);
    await calcularTablaGeneral(campeonatoSeleccionado.id, true);
  }

  async function eliminarResultadoPiloto(id) {
    const { error } = await api.from('campeonato_resultados_fecha').eq('id', id).delete();
    if (error) {
      alert('Error al eliminar resultado del piloto: ' + error.message);
      return;
    }
    delete cacheResultadosFecha.current[fechaSeleccionadaId];
    delete cacheTablasGenerales.current[campeonatoSeleccionado.id];
    await cargarResultadosFecha(fechaSeleccionadaId, true);
    await calcularTablaGeneral(campeonatoSeleccionado.id, true);
  }

  async function eliminarCampeonato(id) {
    if (!confirm('¿Estás seguro de eliminar este campeonato?')) return;
    const { error } = await api.from('campeonatos').eq('id', id).delete();
    if (error) {
      alert('Error al eliminar campeonato: ' + error.message);
      return;
    }
    delete cacheFechasCamp.current[id];
    delete cacheTablasGenerales.current[id];
    setCampeonatoSeleccionado(null);
    await cargarCampeonatos(true);
  }

  const esRallyActivo = campeonatoSeleccionado?.modalidad === 'rally';

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-wrc text-white uppercase">

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-neutral-900/40 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
        <div>
          <h2 className="text-3xl text-[#38bdf8] tracking-wide">CAMPEONATOS OFICIALES</h2>
          <p className="text-neutral-300 text-xs">GESTIÓN DE PISTA Y RALLY (TRAMOS ESPECIALES).</p>
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
                  <option value="rally">RALLY (TRAMOS ESPECIALES)</option>
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
                <label className="block text-[10px] text-[#38bdf8] mb-1">ESCALA DE PUNTOS POR TRAMO (1º, 2º, 3º... SEPARADAS POR COMA)</label>
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

          {esAdmin && (
            <div className="bg-neutral-950/90 border border-[#38bdf8]/40 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/10 pb-3">
                <h3 className="text-[#38bdf8] text-xs font-black">
                  🏁 CARGA MANUAL DE RESULTADOS ({campeonatoSeleccionado.modalidad?.toUpperCase()})
                </h3>

                <div className="flex flex-wrap items-center gap-2">
                  {esRallyActivo && (
                    <button
                      type="button"
                      onClick={handleAutoCalcularPuntosRally}
                      disabled={calculandoAuto || !fechaSeleccionadaId}
                      className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/50 font-black text-[10px] px-3 py-1.5 rounded-lg transition cursor-pointer disabled:opacity-50"
                    >
                      {calculandoAuto ? 'CALCULANDO...' : '⚡ AUTO-CALCULAR POR CATEGORÍA'}
                    </button>
                  )}

                  <select
                    value={fechaSeleccionadaId}
                    onChange={(e) => {
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

              <form onSubmit={handleGuardarPuntosPiloto} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                <div className="sm:col-span-2 lg:col-span-1">
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
                      <label className="block text-[10px] text-[#38bdf8] mb-1">POSICIÓN TRAMO 1</label>
                      <input type="number" value={formCargaPiloto.pos_tramo1} onChange={(e) => setFormCargaPiloto({ ...formCargaPiloto, pos_tramo1: e.target.value })} min="1" max="30" className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white font-mono" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#38bdf8] mb-1">POSICIÓN TRAMO 2</label>
                      <input type="number" value={formCargaPiloto.pos_tramo2} onChange={(e) => setFormCargaPiloto({ ...formCargaPiloto, pos_tramo2: e.target.value })} min="1" max="30" className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white font-mono" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#38bdf8] mb-1">POSICIÓN TRAMO 3</label>
                      <input type="number" value={formCargaPiloto.pos_tramo3} onChange={(e) => setFormCargaPiloto({ ...formCargaPiloto, pos_tramo3: e.target.value })} min="1" max="30" className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white font-mono" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#38bdf8] mb-1">POSICIÓN TRAMO 4</label>
                      <input type="number" value={formCargaPiloto.pos_tramo4} onChange={(e) => setFormCargaPiloto({ ...formCargaPiloto, pos_tramo4: e.target.value })} min="1" max="30" className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white font-mono" />
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

                <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-[#38bdf8] hover:bg-[#7dd3fc] text-slate-950 font-black text-xs px-6 py-2.5 rounded-lg transition shadow cursor-pointer"
                  >
                    GUARDAR RESULTADOS DE ESTA FECHA
                  </button>
                </div>
              </form>

              {resultadosFecha.length > 0 && (
                <div className="pt-3 border-t border-white/10">
                  <h4 className="text-[11px] text-neutral-400 mb-2">PILOTOS CARGADOS EN ESTA FECHA:</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-neutral-400 border-b border-white/10">
                          <th className="py-1.5 px-2">PILOTO</th>
                          {esRallyActivo ? (
                            <>
                              <th className="py-1.5 px-2 text-center">TRAMO 1</th>
                              <th className="py-1.5 px-2 text-center">TRAMO 2</th>
                              <th className="py-1.5 px-2 text-center">TRAMO 3</th>
                              <th className="py-1.5 px-2 text-center">TRAMO 4</th>
                            </>
                          ) : (
                            <>
                              <th className="py-1.5 px-2 text-center">QUALY</th>
                              <th className="py-1.5 px-2 text-center">FINAL 1</th>
                              <th className="py-1.5 px-2 text-center">FINAL 2</th>
                            </>
                          )}
                          <th className="py-1.5 px-2 text-right">TOTAL FECHA</th>
                          <th className="py-1.5 px-2 text-center">ACCIONES</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {resultadosFecha.map(rf => (
                          <tr key={rf.id}>
                            <td className="py-2 px-2 font-bold text-white">{rf.piloto_nombre}</td>
                            {esRallyActivo ? (
                              <>
                                <td className="py-2 px-2 text-center font-mono text-neutral-300">+{rf.puntos_tramo1}</td>
                                <td className="py-2 px-2 text-center font-mono text-neutral-300">+{rf.puntos_tramo2}</td>
                                <td className="py-2 px-2 text-center font-mono text-neutral-300">+{rf.puntos_tramo3}</td>
                                <td className="py-2 px-2 text-center font-mono text-neutral-300">+{rf.puntos_tramo4}</td>
                              </>
                            ) : (
                              <>
                                <td className="py-2 px-2 text-center font-mono text-neutral-300">+{rf.puntos_qualy}</td>
                                <td className="py-2 px-2 text-center font-mono text-neutral-300">+{rf.puntos_final1}</td>
                                <td className="py-2 px-2 text-center font-mono text-neutral-300">+{rf.puntos_final2}</td>
                              </>
                            )}
                            <td className="py-2 px-2 text-right font-mono font-black text-[#38bdf8]">{rf.puntos_total} PTS</td>
                            <td className="py-2 px-2 text-center">
                              <button onClick={() => eliminarResultadoPiloto(rf.id)} className="text-red-400 hover:text-red-300 text-xs cursor-pointer">🗑️</button>
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

          {/* TABLA GENERAL DEL TORNEO */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-neutral-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl space-y-3">
              <h3 className="text-[#38bdf8] text-xs font-black border-b border-white/10 pb-2">
                CALENDARIO DE FECHAS ({fechasCampeonato.length})
              </h3>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {fechasCampeonato.map((f) => (
                  <div key={f.id} className="bg-neutral-950/70 border border-white/5 rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-[#38bdf8] font-bold">{f.titulo_fecha}</span>
                      <p className="text-xs text-white">{f.fecha_programada}</p>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">
                      {f.estado.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 bg-neutral-950/85 backdrop-blur-md border border-white/15 rounded-2xl overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-[#38bdf8]/20 via-neutral-900 to-neutral-900 px-4 py-3 border-b border-[#38bdf8]/30">
                <h3 className="text-white text-xs tracking-wider font-black">
                  🏆 TABLA GENERAL - {campeonatoSeleccionado.nombre} ({campeonatoSeleccionado.modalidad?.toUpperCase()})
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
                  <thead>
                    <tr className="border-b border-white/15 text-[#38bdf8] tracking-wider bg-black/70">
                      <th className="py-2.5 px-3 text-center w-10">POS</th>
                      <th className="py-2.5 px-3">PILOTO</th>
                      {esRallyActivo ? (
                        <>
                          <th className="py-2.5 px-3 text-center">T1</th>
                          <th className="py-2.5 px-3 text-center">T2</th>
                          <th className="py-2.5 px-3 text-center">T3</th>
                          <th className="py-2.5 px-3 text-center">T4</th>
                        </>
                      ) : (
                        <>
                          <th className="py-2.5 px-3 text-center">QUALY</th>
                          <th className="py-2.5 px-3 text-center">FINAL 1</th>
                          <th className="py-2.5 px-3 text-center">FINAL 2</th>
                        </>
                      )}
                      <th className="py-2.5 px-3 text-right text-[#38bdf8] border-l border-white/10">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {tablaPosiciones.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-neutral-400 text-xs">
                          TODAVÍA NO HAY PUNTOS REGISTRADOS EN ESTE CAMPEONATO.
                        </td>
                      </tr>
                    ) : (
                      tablaPosiciones.map((p, idx) => {
                        const esPrimero = idx === 0;
                        const colorPos = esPrimero ? "bg-[#38bdf8] text-slate-950 font-black" : idx === 1 ? "bg-neutral-300 text-black font-black" : idx === 2 ? "bg-sky-700 text-white font-black" : "text-neutral-300 font-bold";

                        return (
                          <tr key={idx} className={`hover:bg-white/5 transition ${esPrimero ? 'bg-[#38bdf8]/10' : ''}`}>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`inline-block w-5 h-5 leading-5 rounded text-[11px] ${colorPos}`}>{idx + 1}</span>
                            </td>
                            <td className="py-2.5 px-3 font-bold text-white">{p.nombre}</td>
                            {esRallyActivo ? (
                              <>
                                <td className="py-2.5 px-3 text-center font-mono text-neutral-300">{p.t1}</td>
                                <td className="py-2.5 px-3 text-center font-mono text-neutral-300">{p.t2}</td>
                                <td className="py-2.5 px-3 text-center font-mono text-neutral-300">{p.t3}</td>
                                <td className="py-2.5 px-3 text-center font-mono text-neutral-300">{p.t4}</td>
                              </>
                            ) : (
                              <>
                                <td className="py-2.5 px-3 text-center font-mono text-neutral-300">{p.q}</td>
                                <td className="py-2.5 px-3 text-center font-mono text-neutral-300">{p.f1}</td>
                                <td className="py-2.5 px-3 text-center font-mono text-neutral-300">{p.f2}</td>
                              </>
                            )}
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