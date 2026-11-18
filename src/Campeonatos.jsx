import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function Campeonatos({ esAdmin }) {
  const [campeonatos, setCampeonatos] = useState([]);
  const [campeonatoSeleccionado, setCampeonatoSeleccionado] = useState(null);
  const [fechasCampeonato, setFechasCampeonato] = useState([]);
  const [tablaPosiciones, setTablaPosiciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Estados para crear un nuevo campeonato (Admin)
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [cantidadFechas, setCantidadFechas] = useState(5);
  const [puntosQ, setPuntosQ] = useState('10, 8, 6, 4, 2');
  const [puntosF1, setPuntosF1] = useState('25, 18, 15, 12, 10');
  const [puntosF2, setPuntosF2] = useState('25, 18, 15, 12, 10');

  useEffect(() => {
    cargarCampeonatos();
  }, []);

  async function cargarCampeonatos() {
    setCargando(true);
    const { data, error } = await supabase.from('campeonatos').select('*').order('created_at', { ascending: false });
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
    // Cargar fechas del campeonato
    const { data: fechas } = await supabase.from('campeonato_fechas').select('*').eq('campeonato_id', camp.id).order('numero_fecha', { ascending: true });
    if (fechas) setFechasCampeonato(fechas);

    // Cargar tabla de posiciones acumulada
    calcularTablaGeneral(camp.id);
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

    // Agrupar puntos por piloto
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

  async function handleCrearCampeonato(e) {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;

    // Crear el campeonato
    const { data: campNuevo, error } = await supabase.from('campeonatos').insert([{
      nombre: nuevoNombre.toUpperCase(),
      estado: 'activo'
    }]).select().single();

    if (error) {
      alert('Error al crear campeonato: ' + error.message);
      return;
    }

    // Generar las fechas automáticas según la cantidad elegida
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

  async function eliminarCampeonato(id) {
    if (!confirm('¿Estás seguro de eliminar este campeonato y todas sus fechas?')) return;
    await supabase.from('campeonatos').delete().eq('id', id);
    setCampeonatoSeleccionado(null);
    cargarCampeonatos();
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-wrc text-white uppercase">
      
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl text-amber-400 tracking-wide">CAMPEONATOS OFICIALES</h2>
          <p className="text-neutral-300 text-xs">TABLA DE POSICIONES, CALENDARIO DE FECHAS Y SISTEMA DE PUNTUACIÓN.</p>
        </div>

        {/* SELECTOR DE CAMPEONATOS */}
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

      {/* PANEL DE ADMIN: CREAR NUEVO CAMPEONATO */}
      {esAdmin && (
        <div className="bg-neutral-900/70 backdrop-blur-md border border-amber-500/50 rounded-2xl p-5 shadow-2xl space-y-3">
          <h3 className="text-sm text-amber-400 font-black">➕ CREAR NUEVO CAMPEONATO</h3>
          <form onSubmit={handleCrearCampeonato} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-[10px] text-neutral-300 mb-1">NOMBRE DEL CAMPEONATO</label>
              <input
                type="text"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                placeholder="EJ: MONOMARCA SAVEIRO"
                required
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white uppercase outline-none focus:border-amber-500"
              />
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
            <div>
              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black text-xs py-2.5 rounded-lg transition shadow cursor-pointer"
              >
                CREAR TORNEO
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL DEL CAMPEONATO SELECCIONADO */}
      {!campeonatoSeleccionado ? (
        <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-10 text-center text-neutral-400 text-xs">
          NO HAY CAMPEONATOS CREADOS TODAVÍA. CREÁ UNO NUEVO DESDE EL PANEL DE ADMINISTRACIÓN.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUMNA IZQUIERDA: FECHAS DEL TORNEO */}
          <div className="bg-neutral-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl space-y-3">
            <h3 className="text-amber-400 text-xs font-black border-b border-white/10 pb-2">
              FECHAS OFICIALES ({fechasCampeonato.length})
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
            <div className="bg-gradient-to-r from-amber-500/20 via-neutral-900 to-neutral-900 px-4 py-3 border-b border-amber-500/30 flex justify-between items-center">
              <h3 className="text-white text-xs tracking-wider font-black">
                🏆 TABLA DE POSICIONES - {campeonatoSeleccionado.nombre}
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
      )}

    </div>
  );
}