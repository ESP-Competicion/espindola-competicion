import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function Campeonatos({ esAdmin }) {
  const [campeonatos, setCampeonatos] = useState([]);
  const [campeonatoSeleccionado, setCampeonatoSeleccionado] = useState(null);
  const [fechasCampeonato, setFechasCampeonato] = useState([]);
  const [tablaPosiciones, setTablaPosiciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Estados para el formulario de crear campeonato
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [cantidadFechas, setCantidadFechas] = useState(5);
  
  // Estados para configurar las escalas de puntos (ej: "10, 8, 6, 4, 2")
  const [strPuntosQ, setStrPuntosQ] = useState('10, 8, 6, 4, 2');
  const [strPuntosF1, setStrPuntosF1] = useState('25, 18, 15, 12, 10, 8, 6, 4, 2, 1');
  const [strPuntosF2, setStrPuntosF2] = useState('25, 18, 15, 12, 10, 8, 6, 4, 2, 1');

  // Estado para cargar resultados de una fecha específica (Admin)
  const [fechaSeleccionadaId, setFechaSeleccionadaId] = useState('');
  const [resultadosFecha, setResultadosFecha] = useState([]);
  const [formCargaPiloto, setFormCargaPiloto] = useState({
    piloto_nombre: '',
    pos_qualy: 1,
    pos_final1: 1,
    pos_final2: 1
  });

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
    
    // Cargar escalas configuradas si las tiene guardadas
    if (camp.puntos_qualy && Array.isArray(camp.puntos_qualy)) {
      setStrPuntosQ(camp.puntos_qualy.join(', '));
    }
    if (camp.puntos_final1 && Array.isArray(camp.puntos_final1)) {
      setStrPuntosF1(camp.puntos_final1.join(', '));
    }
    if (camp.puntos_final2 && Array.isArray(camp.puntos_final2)) {
      setStrPuntosF2(camp.puntos_final2.join(', '));
    }

    const { data: fechas } = await supabase.from('campeonato_fechas').select('*').eq('campeonato_id', camp.id).order('numero_fecha', { ascending: true });
    if (fechas) {
      setFechasCampeonato(fechas);
      if (fechas.length > 0 && !fechaSeleccionadaId) {
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
        acumulado[r.piloto_nombre] = { nombre: r.piloto_nombre, total: 0, q: 0, f1: 0, f2: 0 };
      }
      acumulado[r.piloto_nombre].total += r.puntos_total;
      acumulado[r.piloto_nombre].q += r.puntos_qualy;
      acumulado[r.piloto_nombre].f1 += r.puntos_final1;
      acumulado[r.piloto_nombre].f2 += r.puntos_final2;
    });

    const listaOrdenada = Object.values(acumulado).sort((a, b) => b.total - a.total);
    setTablaPosiciones(listaOrdenada);
  }

  // Convertir string "25, 18, 15" en array [25, 18, 15]
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
    alert('¡Campeonato y escala de puntos creados con éxito!');
    cargarCampeonatos();
  }

  // Guardar o actualizar puntos de un piloto en una fecha
  async function handleGuardarPuntosPiloto(e) {
    e.preventDefault();
    if (!fechaSeleccionadaId || !formCargaPiloto.piloto_nombre.trim()) return;

    const arrQ = campeonatoSeleccionado.puntos_qualy || [10, 8, 6];
    const arrF1 = campeonatoSeleccionado.puntos_final1 || [25, 18, 15];
    const arrF2 = campeonatoSeleccionado.puntos_final2 || [25, 18, 15];

    const posQ = parseInt(formCargaPiloto.pos_qualy) || 0;
    const posF1 = parseInt(formCargaPiloto.pos_final1) || 0;
    const posF2 = parseInt(formCargaPiloto.pos_final2) || 0;

    // Obtener puntos según la posición (si la posición es 1, toma el índice 0 del array)
    const ptsQ = posQ > 0 && posQ <= arrQ.length ? arrQ[posQ - 1] : 0;
    const ptsF1 = posF1 > 0 && posF1 <= arrF1.length ? arrF1[posF1 - 1] : 0;
    const ptsF2 = posF2 > 0 && posF2 <= arrF2.length ? arrF2[posF2 - 1] : 0;
    const total = ptsQ + ptsF1 + ptsF2;

    const nombrePiloto = formCargaPiloto.piloto_nombre.toUpperCase().trim();

    // Verificar si ya existe el registro para este piloto en esta fecha
    const { data: existente } = await supabase
      .from('campeonato_resultados_fecha')
      .select('id')
      .eq('fecha_id', fechaSeleccionadaId)
      .eq('piloto_nombre', nombrePiloto)
      .single();

    if (existente) {
      await supabase.from('campeonato_resultados_fecha').update({
        puntos_qualy: ptsQ,
        puntos_final1: ptsF1,
        puntos_final2: ptsF2,
        puntos_total: total
      }).eq('id', existente.id);
    } else {
      await supabase.from('campeonato_resultados_fecha').insert([{
        fecha_id: fechaSeleccionadaId,
        piloto_nombre: nombrePiloto,
        puntos_qualy: ptsQ,
        puntos_final1: ptsF1,
        puntos_final2: ptsF2,
        puntos_total: total
      }]);
    }

    setFormCargaPiloto({ piloto_nombre: '', pos_qualy: 1, pos_final1: 1, pos_final2: 1 });
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-wrc text-white uppercase">
      
      {/* CABECERA Y SELECTOR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl text-amber-400 tracking-wide">CAMPEONATOS OFICIALES</h2>
          <p className="text-neutral-300 text-xs">TABLA DE POSICIONES, ESCALA DE PUNTOS Y GESTIÓN DE FECHAS.</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={campeonatoSeleccionado?.id || ''}
            onChange={(e) => {
              const enc = campeonatos.find(c => c.id === e.target.value);
              if (enc) seleccionarCampeonato(enc);
            }}
            className="bg-neutral-900 border border-amber-500/50 text-white text-xs rounded-xl px-3 py-2 outline-none font-wrc cursor-pointer"
          >
            {campeonatos.map(c => (
              <option key={c.id} value={c.id}>{c.nombre} ({c.estado})</option>
            ))}
          </select>

          {esAdmin && campeonatoSeleccionado && (
            <button
              onClick={() => eliminarCampeonato(campeonatoSeleccionado.id)}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-2 rounded-xl text-xs cursor-pointer"
              title="Eliminar campeonato"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* PANEL DE ADMIN: CREAR CAMPEONATO CON ESCALA DE PUNTOS */}
      {esAdmin && (
        <div className="bg-neutral-900/80 backdrop-blur-md border border-amber-500/50 rounded-2xl p-5 shadow-2xl space-y-4">
          <h3 className="text-sm text-amber-400 font-black">➕ CREAR NUEVO CAMPEONATO Y CONFIGURAR PUNTUACIÓN</h3>
          
          <form onSubmit={handleCrearCampeonato} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-neutral-300 mb-1">NOMBRE DEL TORNEO</label>
                <input
                  type="text"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="EJ: SAVEIRO CUP 2027"
                  required
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white uppercase outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-neutral-300 mb-1">CANTIDAD DE FECHAS OFICIALES</label>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-white/10 pt-3">
              <div>
                <label className="block text-[10px] text-amber-400 mb-1">PUNTOS QUALY (1º, 2º, 3º... separadas por coma)</label>
                <input
                  type="text"
                  value={strPuntosQ}
                  onChange={(e) => setStrPuntosQ(e.target.value)}
                  placeholder="EJ: 10, 8, 6, 4, 2"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white uppercase outline-none focus:border-amber-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] text-amber-400 mb-1">PUNTOS FINAL 1 (Escala del 1º al último)</label>
                <input
                  type="text"
                  value={strPuntosF1}
                  onChange={(e) => setStrPuntosF1(e.target.value)}
                  placeholder="EJ: 25, 18, 15, 12, 10..."
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white uppercase outline-none focus:border-amber-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] text-amber-400 mb-1">PUNTOS FINAL 2 (Escala del 1º al último)</label>
                <input
                  type="text"
                  value={strPuntosF2}
                  onChange={(e) => setStrPuntosF2(e.target.value)}
                  placeholder="EJ: 25, 18, 15, 12, 10..."
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white uppercase outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-black font-black text-xs px-6 py-2.5 rounded-lg transition shadow cursor-pointer"
              >
                CREAR TORNEO CON ESTA PUNTUACIÓN
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VISTA PRINCIPAL DEL CAMPEONATO */}
      {!campeonatoSeleccionado ? (
        <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-10 text-center text-neutral-400 text-xs">
          NO HAY CAMPEONATOS CREADOS. CREÁ UNO NUEVO ARRIBA.
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* SECCIÓN DE ADMINISTRACIÓN DE RESULTADOS POR FECHA */}
          {esAdmin && (
            <div className="bg-neutral-950/90 border border-amber-500/40 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/10 pb-3">
                <h3 className="text-amber-400 text-xs font-black">
                  ⚙️ CARGAR O EDITAR RESULTADOS POR FECHA
                </h3>

                {/* Selector de Fecha */}
                <select
                  value={fechaSeleccionadaId}
                  onChange={(e) => {
                    setFechaSeleccionadaId(e.target.value);
                    cargarResultadosFecha(e.target.value);
                  }}
                  className="bg-neutral-900 border border-neutral-700 text-white text-xs rounded-lg px-3 py-1.5 outline-none font-wrc cursor-pointer"
                >
                  {fechasCampeonato.map(f => (
                    <option key={f.id} value={f.id}>{f.titulo_fecha}</option>
                  ))}
                </select>
              </div>

              {/* Formulario de Carga de Piloto */}
              <form onSubmit={handleGuardarPuntosPiloto} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-neutral-300 mb-1">NOMBRE DEL PILOTO</label>
                  <input
                    type="text"
                    value={formCargaPiloto.piloto_nombre}
                    onChange={(e) => setFormCargaPiloto({ ...formCargaPiloto, piloto_nombre: e.target.value })}
                    placeholder="EJ: JOACO CASTAÑO"
                    required
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white uppercase outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-neutral-300 mb-1">POSICIÓN QUALY</label>
                  <input
                    type="number"
                    value={formCargaPiloto.pos_qualy}
                    onChange={(e) => setFormCargaPiloto({ ...formCargaPiloto, pos_qualy: e.target.value })}
                    min="1" max="50"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white uppercase outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-neutral-300 mb-1">POSICIÓN FINAL 1</label>
                  <input
                    type="number"
                    value={formCargaPiloto.pos_final1}
                    onChange={(e) => setFormCargaPiloto({ ...formCargaPiloto, pos_final1: e.target.value })}
                    min="1" max="50"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white uppercase outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-neutral-300 mb-1">POSICIÓN FINAL 2</label>
                  <input
                    type="number"
                    value={formCargaPiloto.pos_final2}
                    onChange={(e) => setFormCargaPiloto({ ...formCargaPiloto, pos_final2: e.target.value })}
                    min="1" max="50"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white uppercase outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div className="sm:col-span-5 flex justify-end pt-1">
                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-400 text-black font-black text-xs px-5 py-2 rounded-lg transition cursor-pointer"
                  >
                    GUARDAR PUNTOS DE ESTA FECHA
                  </button>
                </div>
              </form>

              {/* Tabla de pilotos cargados en la fecha seleccionada */}
              {resultadosFecha.length > 0 && (
                <div className="pt-3 border-t border-white/10">
                  <h4 className="text-[11px] text-neutral-400 mb-2">PILOTOS CON PUNTOS CARGADOS EN ESTA FECHA:</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-neutral-400 border-b border-white/10">
                          <th className="py-1.5 px-2">PILOTO</th>
                          <th className="py-1.5 px-2 text-center">QUALY PTS</th>
                          <th className="py-1.5 px-2 text-center">FINAL 1 PTS</th>
                          <th className="py-1.5 px-2 text-center">FINAL 2 PTS</th>
                          <th className="py-1.5 px-2 text-right">TOTAL FECHA</th>
                          <th className="py-1.5 px-2 text-center">ACCIONES</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {resultadosFecha.map(rf => (
                          <tr key={rf.id}>
                            <td className="py-1.5 px-2 font-bold text-white">{rf.piloto_nombre}</td>
                            <td className="py-1.5 px-2 text-center font-mono text-neutral-300">+{rf.puntos_qualy}</td>
                            <td className="py-1.5 px-2 text-center font-mono text-neutral-300">+{rf.puntos_final1}</td>
                            <td className="py-1.5 px-2 text-center font-mono text-neutral-300">+{rf.puntos_final2}</td>
                            <td className="py-1.5 px-2 text-right font-mono font-black text-amber-400">{rf.puntos_total} PTS</td>
                            <td className="py-1.5 px-2 text-center">
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

          {/* TABLA DE POSICIONES GENERAL Y CALENDARIO */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* COLUMNA IZQUIERDA: FECHAS DEL TORNEO */}
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
                    <span className={`text-[9px] px-2 py-0.5 rounded ${f.estado === 'finalizada' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-neutral-800 text-neutral-400'}`}>
                      {f.estado.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMNA DERECHA: TABLA DE POSICIONES GENERAL */}
            <div className="lg:col-span-2 bg-neutral-950/85 backdrop-blur-md border border-white/15 rounded-2xl overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-amber-500/20 via-neutral-900 to-neutral-900 px-4 py-3 border-b border-amber-500/30">
                <h3 className="text-white text-xs tracking-wider font-black">
                  🏆 TABLA GENERAL - {campeonatoSeleccionado.nombre}
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
                  <thead>
                    <tr className="border-b border-white/15 text-amber-400 tracking-wider bg-black/70">
                      <th className="py-2.5 px-3 text-center w-10">POS</th>
                      <th className="py-2.5 px-3">PILOTO</th>
                      <th className="py-2.5 px-3 text-center">QUALY</th>
                      <th className="py-2.5 px-3 text-center">FINAL 1</th>
                      <th className="py-2.5 px-3 text-center">FINAL 2</th>
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
                            <td className="py-2.5 px-3 text-center font-mono text-neutral-300">{p.q} pts</td>
                            <td className="py-2.5 px-3 text-center font-mono text-neutral-300">{p.f1} pts</td>
                            <td className="py-2.5 px-3 text-center font-mono text-neutral-300">{p.f2} pts</td>
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