import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function Campeonatos({ esAdmin }) {
  const [campeonatos, setCampeonatos] = useState([]);
  const [campeonatoSeleccionado, setCampeonatoSeleccionado] = useState(null);
  const [fechasCampeonato, setFechasCampeonato] = useState([]);
  const [tablaPosiciones, setTablaPosiciones] = useState([]);
  const [cargando, setCargando] = useState(true);

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

  const [pilotoEditando, setPilotoEditando] = useState(null);

  useEffect(() => {
    cargarCampeonatos();
  }, []);

  async function cargarCampeonatos() {
    setCargando(true);
    const { data } = await supabase.from('campeonatos').select('*').order('created_at', { ascending: false });
    if (data && data.length > 0) {
      setCampeonatos(data);
      if (!campeonatoSeleccionado) {
        seleccionarCampeonato(data[0]);
      }
    }
    setCargando(false);
  }

  async function seleccionarCampeonato(camp) {
    setCampeonatoSeleccionado(camp);
    
    if (camp.puntos_final1 && Array.isArray(camp.puntos_final1)) {
      setStrPuntosF1(camp.puntos_final1.join(', '));
      setStrPuntosTramo(camp.puntos_final1.join(', '));
    }

    const { data: fechas } = await supabase.from('campeonato_fechas').select('*').eq('campeonato_id', camp.id).order('numero_fecha', { ascending: true });
    if (fechas) {
      setFechasCampeonato(fechas);
      if (fechas.length > 0) {
        setFechaSeleccionadaId(fechas[0].id);
        cargarResultadosFecha(fechas[0].id);
      }
    }

    calcularTablaGeneral(camp.id);
  }

  async function cargarResultadosFecha(fechaId) {
    const { data } = await supabase.from('campeonato_resultados_fecha').select('*').eq('fecha_id', fechaId);
    if (data) setResultadosFecha(data);
  }

  async function calcularTablaGeneral(campId) {
    const { data: resultados } = await supabase
      .from('campeonato_resultados_fecha')
      .select('*, campeonato_fechas!inner(campeonato_id)')
      .eq('campeonato_fechas.campeonato_id', campId);

    if (!resultados) {
      setTablaPosiciones([]);
      return;
    }

    const acumulado = {};
    resultados.forEach(r => {
      if (!acumulado[r.piloto_nombre]) {
        acumulado[r.piloto_nombre] = { nombre: r.piloto_nombre, total: 0, q: 0, f1: 0, f2: 0, t1: 0, t2: 0, t3: 0, t4: 0 };
      }
      acumulado[r.piloto_nombre].total += r.puntos_total;
      acumulado[r.piloto_nombre].q += (r.puntos_qualy || 0);
      acumulado[r.piloto_nombre].f1 += (r.puntos_final1 || 0);
      acumulado[r.piloto_nombre].f2 += (r.puntos_final2 || 0);
      acumulado[r.piloto_nombre].t1 += (r.puntos_tramo1 || 0);
      acumulado[r.piloto_nombre].t2 += (r.puntos_tramo2 || 0);
      acumulado[r.piloto_nombre].t3 += (r.puntos_tramo3 || 0);
      acumulado[r.piloto_nombre].t4 += (r.puntos_tramo4 || 0);
    });

    const listaOrdenada = Object.values(acumulado).sort((a, b) => b.total - a.total);
    setTablaPosiciones(listaOrdenada);
  }

  function parsearEscalaPuntos(str) {
    return str.split(',').map(n => parseInt(n.trim()) || 0);
  }

  async function handleCrearCampeonato(e) {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;

    const arrQ = parsearEscalaPuntos(strPuntosQ);
    const arrF1 = parsearEscalaPuntos(strPuntosF1);
    const arrF2 = parsearEscalaPuntos(strPuntosF2);

    const { data: campNuevo, error } = await supabase.from('campeonatos').insert([{
      nombre: nuevoNombre.toUpperCase(),
      modalidad: modalidadTorneo,
      estado: 'activo',
      puntos_qualy: arrQ,
      puntos_final1: arrF1,
      puntos_final2: arrF2
    }]).select().single();

    if (error) {
      alert('Error al crear campeonato: ' + error.message);
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

    await supabase.from('campeonato_fechas').insert(fechasInsertar);

    setNuevoNombre('');
    alert('¡Campeonato creado con éxito!');
    cargarCampeonatos();
  }

  // Carga manual de puntos (para Rally o Pista)
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
      const arrQ = campeonatoSeleccionado?.puntos_qualy || [10, 8, 6];
      const arrF1 = campeonatoSeleccionado?.puntos_final1 || [25, 18, 15];
      const arrF2 = campeonatoSeleccionado?.puntos_final2 || [25, 18, 15];

      const pq = parseInt(formCargaPiloto.pos_qualy) || 0;
      const pf1 = parseInt(formCargaPiloto.pos_final1) || 0;
      const pf2 = parseInt(formCargaPiloto.pos_final2) || 0;

      ptsQ = pq > 0 && pq <= arrQ.length ? arrQ[pq - 1] : 0;
      ptsF1 = pf1 > 0 && pf1 <= arrF1.length ? arrF1[pf1 - 1] : 0;
      ptsF2 = pf2 > 0 && pf2 <= arrF2.length ? arrF2[pf2 - 1] : 0;
    }

    const total = ptsQ + ptsF1 + ptsF2 + ptsT1 + ptsT2 + ptsT3 + ptsT4;

    const { data: existente } = await supabase
      .from('campeonato_resultados_fecha')
      .select('id')
      .eq('fecha_id', fechaSeleccionadaId)
      .eq('piloto_nombre', nombrePiloto)
      .single();

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
      await supabase.from('campeonato_resultados_fecha').update(datosPayload).eq('id', existente.id);
    } else {
      await supabase.from('campeonato_resultados_fecha').insert([{
        fecha_id: fechaSeleccionadaId,
        piloto_nombre: nombrePiloto,
        ...datosPayload
      }]);
    }

    setFormCargaPiloto({ piloto_nombre: '', pos_qualy: 1, pos_final1: 1, pos_final2: 1, pos_tramo1: 1, pos_tramo2: 1, pos_tramo3: 1, pos_tramo4: 1, sancion: '' });
    cargarResultadosFecha(fechaSeleccionadaId);
    calcularTablaGeneral(campeonatoSeleccionado.id);
  }

  async function eliminarResultadoPiloto(id) {
    await supabase.from('campeonato_resultados_fecha').delete().eq('id', id);
    cargarResultadosFecha(fechaSeleccionadaId);
    calcularTablaGeneral(campeonatoSeleccionado.id);
  }

  async function eliminarCampeonato(id) {
    if (!confirm('¿Estás seguro de eliminar este campeonato?')) return;
    await supabase.from('campeonatos').delete().eq('id', id);
    setCampeonatoSeleccionado(null);
    cargarCampeonatos();
  }

  const esRallyActivo = campeonatoSeleccionado?.modalidad === 'rally';

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-wrc text-white uppercase">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-neutral-900/40 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
        <div>
          <h2 className="text-3xl text-amber-400 tracking-wide">CAMPEONATOS OFICIALES</h2>
          <p className="text-neutral-300 text-xs">GESTIÓN DE PISTA Y RALLY (TRAMOS ESPECIALES).</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={campeonatoSeleccionado?.id || ''}
            onChange={(e) => {
              const enc = campeonatos.find(c => c.id === e.target.value);
              if (enc) seleccionarCampeonato(enc);
            }}
            className="bg-neutral-950 border border-amber-500/60 text-white text-xs rounded-xl px-3 py-2.5 outline-none font-wrc cursor-pointer shadow-lg"
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
        <div className="bg-neutral-900/90 backdrop-blur-md border border-amber-500/50 rounded-2xl p-5 shadow-2xl space-y-4">
          <h3 className="text-sm text-amber-400 font-black">➕ CREAR NUEVO CAMPEONATO (ELEGIR MODALIDAD)</h3>
          
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
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white uppercase outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-amber-400 mb-1">MODALIDAD</label>
                <select
                  value={modalidadTorneo}
                  onChange={(e) => setModalidadTorneo(e.target.value)}
                  className="w-full bg-neutral-950 border border-amber-500/60 rounded-lg px-3 py-2 text-xs text-white outline-none cursor-pointer font-wrc"
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
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white uppercase outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="border-t border-white/10 pt-3">
              <label className="block text-[10px] text-amber-400 mb-1">ESCALA DE PUNTOS POR TRAMO / FINAL (1º, 2º, 3º... separadas por coma)</label>
              <input
                type="text"
                value={strPuntosF1}
                onChange={(e) => setStrPuntosF1(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white uppercase outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-black font-black text-xs px-6 py-2.5 rounded-lg transition shadow cursor-pointer"
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
          NO HAY CAMPEONATOS CREADOS. CREÁ UNO NUEVO ARRIBA.
        </div>
      ) : (
        <div className="space-y-6">
          
          {esAdmin && (
            <div className="bg-neutral-950/90 border border-amber-500/40 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/10 pb-3">
                <h3 className="text-amber-400 text-xs font-black">
                  🏁 CARGA MANUAL DE RESULTADOS ({campeonatoSeleccionado.modalidad?.toUpperCase()})
                </h3>

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

              {/* Formulario adaptado a RALLY o PISTA */}
              <form onSubmit={handleGuardarPuntosPiloto} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-[10px] text-neutral-300 mb-1">NOMBRE PILOTO</label>
                  <input
                    type="text"
                    value={formCargaPiloto.piloto_nombre}
                    onChange={(e) => setFormCargaPiloto({ ...formCargaPiloto, piloto_nombre: e.target.value })}
                    placeholder="EJ: LEO ESPINDOLA"
                    required
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white uppercase outline-none focus:border-amber-500"
                  />
                </div>

                {esRallyActivo ? (
                  <>
                    <div>
                      <label className="block text-[10px] text-amber-400 mb-1">POSICIÓN TRAMO 1</label>
                      <input type="number" value={formCargaPiloto.pos_tramo1} onChange={(e) => setFormCargaPiloto({ ...formCargaPiloto, pos_tramo1: e.target.value })} min="1" max="30" className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white font-mono" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-amber-400 mb-1">POSICIÓN TRAMO 2</label>
                      <input type="number" value={formCargaPiloto.pos_tramo2} onChange={(e) => setFormCargaPiloto({ ...formCargaPiloto, pos_tramo2: e.target.value })} min="1" max="30" className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white font-mono" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-amber-400 mb-1">POSICIÓN TRAMO 3</label>
                      <input type="number" value={formCargaPiloto.pos_tramo3} onChange={(e) => setFormCargaPiloto({ ...formCargaPiloto, pos_tramo3: e.target.value })} min="1" max="30" className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white font-mono" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-amber-400 mb-1">POSICIÓN TRAMO 4</label>
                      <input type="number" value={formCargaPiloto.pos_tramo4} onChange={(e) => setFormCargaPiloto({ ...formCargaPiloto, pos_tramo4: e.target.value })} min="1" max="30" className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white font-mono" />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-[10px] text-neutral-300 mb-1">POSICIÓN QUALY</label>
                      <input type="number" value={formCargaPiloto.pos_qualy} onChange={(e) => setFormCargaPiloto({ ...formCargaPiloto, pos_qualy: e.target.value })} min="1" max="30" className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white font-mono" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-300 mb-1">POSICIÓN FINAL 1</label>
                      <input type="number" value={formCargaPiloto.pos_final1} onChange={(e) => setFormCargaPiloto({ ...formCargaPiloto, pos_final1: e.target.value })} min="1" max="30" className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white font-mono" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-300 mb-1">POSICIÓN FINAL 2</label>
                      <input type="number" value={formCargaPiloto.pos_final2} onChange={(e) => setFormCargaPiloto({ ...formCargaPiloto, pos_final2: e.target.value })} min="1" max="30" className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white font-mono" />
                    </div>
                  </>
                )}

                <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-400 text-black font-black text-xs px-6 py-2.5 rounded-lg transition cursor-pointer"
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
                            <td className="py-2 px-2 text-right font-mono font-black text-amber-400">{rf.puntos_total} PTS</td>
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
              <h3 className="text-amber-400 text-xs font-black border-b border-white/10 pb-2">
                CALENDARIO DE FECHAS ({fechasCampeonato.length})
              </h3>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {fechasCampeonato.map((f) => (
                  <div key={f.id} className="bg-neutral-950/70 border border-white/5 rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-amber-400 font-bold">{f.titulo_fecha}</span>
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
              <div className="bg-gradient-to-r from-amber-500/20 via-neutral-900 to-neutral-900 px-4 py-3 border-b border-amber-500/30">
                <h3 className="text-white text-xs tracking-wider font-black">
                  🏆 TABLA GENERAL - {campeonatoSeleccionado.nombre} ({campeonatoSeleccionado.modalidad?.toUpperCase()})
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
                  <thead>
                    <tr className="border-b border-white/15 text-amber-400 tracking-wider bg-black/70">
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
                      <th className="py-2.5 px-3 text-right text-amber-400 border-l border-white/10">TOTAL</th>
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
                        const colorPos = esPrimero ? "bg-amber-400 text-black font-black" : idx === 1 ? "bg-neutral-300 text-black font-black" : idx === 2 ? "bg-amber-700 text-white font-black" : "text-neutral-300 font-bold";

                        return (
                          <tr key={idx} className={`hover:bg-white/5 transition ${esPrimero ? 'bg-amber-500/10' : ''}`}>
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
                            <td className="py-2.5 px-3 text-right font-mono font-black text-amber-400 border-l border-white/10 bg-amber-950/20 text-sm">
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