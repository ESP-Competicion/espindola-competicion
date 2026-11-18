import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function ResultadosRallyServer() {
  // Pestaña principal: 'server' o 'rally'
  const [vistaPrincipal, setVistaPrincipal] = useState('rally');

  // Sub-pestañas de Rally: 'categoria', 'tramo1', 'tramo2', 'tramo3', 'tramo4', 'general'
  const [subVistaRally, setSubVistaRally] = useState('tramo1');
  
  // Filtro de categoría seleccionada (ej: 'TODAS', 'RALLY4', 'RALLY2', 'RC5')
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('TODAS');
  const [categoriasDisponibles, setCategoriasDisponibles] = useState(['TODAS', 'RALLY4', 'RALLY2', 'RC5']);

  // Datos del servidor (sesiones guardadas automáticas)
  const [sesionesServidor, setSesionesServidor] = useState([]);
  const [sesionActivaId, setSesionActivaId] = useState(null);

  // Datos simulados o cargados de los tramos de rally
  // Cada elemento: { id, piloto, auto, categoria, t1, t2, t3, t4, segundosT1, segundosT2, segundosT3, segundosT4 }
  const [pilotosRally, setPilotosRally] = useState([
    { id: 1, piloto: 'LEO ESPINDOLA', auto: 'VW SAVEIRO G4', categoria: 'RALLY4', t1: '02:05.12', t2: '02:06.86', t3: '02:04.10', t4: '02:03.50', s1: 125.12, s2: 126.86, s3: 124.10, s4: 123.50 },
    { id: 2, piloto: 'PEDRIINHO LANINHA', auto: 'PEUGEOT 208 RALLY4', categoria: 'RALLY4', t1: '02:06.86', t2: '02:05.00', t3: '02:05.20', t4: '02:04.00', s1: 126.86, s2: 125.00, s3: 125.20, s4: 124.00 },
    { id: 3, piloto: 'MATEUS SILVA', auto: 'SKODA FABIA R5', categoria: 'RALLY2', t1: '02:01.50', t2: '02:02.10', t3: '02:00.80', t4: '01:59.90', s1: 121.50, s2: 122.10, s3: 120.80, s4: 119.90 },
    { id: 4, piloto: 'LUCAS HUTTER', auto: 'FORD FIESTA RC5', categoria: 'RC5', t1: '02:15.00', t2: '02:14.50', t3: '02:13.20', t4: '02:12.80', s1: 135.00, s2: 134.50, s3: 133.20, s4: 132.80 },
  ]);

  useEffect(() => {
    cargarSesionesServidor();
  }, []);

  async function cargarSesionesServidor() {
    const { data } = await supabase.from('resultados_sesiones').select('*').order('created_at', { ascending: false });
    if (data && data.length > 0) {
      setSesionesServidor(data);
      setSesionActivaId(data[0].id);
    }
  }

  // Función utilitaria para formatear segundos totales a formato mm:ss.ms
  function formatearSegundos(segundosTotales) {
    if (!segundosTotales || isNaN(segundosTotales)) return "+00.00";
    const mins = Math.floor(segundosTotales / 60);
    const secs = (segundosTotales % 60).toFixed(2);
    const secsFormatted = secs < 10 ? `0${secs}` : secs;
    if (mins > 0) {
      return `${mins}:${secsFormatted}`;
    }
    return `00:${secsFormatted}`;
  }

  // Filtrar pilotos por categoría seleccionada
  const pilotosFiltrados = pilotosRally.filter(p => {
    if (categoriaSeleccionada === 'TODAS') return true;
    return p.categoria === categoriaSeleccionada;
  });

  // Procesar datos para la vista izquierda (Tiempo Tramo actual)
  function obtenerDatosTramoActual() {
    let keySec = 's1';
    let keyStr = 't1';
    if (subVistaRally === 'tramo1') { keySec = 's1'; keyStr = 't1'; }
    if (subVistaRally === 'tramo2') { keySec = 's2'; keyStr = 't2'; }
    if (subVistaRally === 'tramo3') { keySec = 's3'; keyStr = 't3'; }
    if (subVistaRally === 'tramo4') { keySec = 's4'; keyStr = 't4'; }

    // Ordenar de menor a mayor tiempo en el tramo
    const ordenados = [...pilotosFiltrados].sort((a, b) => a[keySec] - b[keySec]);

    return ordenados.map((p, idx) => {
      const tiempoActual = p[keySec];
      const tiempoLider = ordenados[0][keySec];
      const difLider = idx === 0 ? 0 : tiempoActual - tiempoLider;
      
      let difAnterior = 0;
      if (idx > 0) {
        difAnterior = tiempoActual - ordenados[idx - 1][keySec];
      }

      return {
        pos: idx + 1,
        piloto: p.piloto,
        auto: p.auto,
        tiempo: p[keyStr],
        difLider: idx === 0 ? '0.0' : `+${difLider.toFixed(2)}`,
        difAnterior: idx === 0 ? '-' : `+${difAnterior.toFixed(2)}`
      };
    });
  }

  // Procesar datos para la vista derecha (Clasificación General Acumulada hasta el tramo actual)
  function obtenerClasificacionGeneral() {
    // Determinar hasta qué tramo sumar
    let tramosACalcular = 4;
    if (subVistaRally === 'tramo1') tramosACalcular = 1;
    if (subVistaRally === 'tramo2') tramosACalcular = 2;
    if (subVistaRally === 'tramo3') tramosACalcular = 3;
    if (subVistaRally === 'tramo4' || subVistaRally === 'general') tramosACalcular = 4;

    const conSuma = pilotosFiltrados.map(p => {
      let sumaTotal = 0;
      if (tramosACalcular >= 1) sumaTotal += p.s1;
      if (tramosACalcular >= 2) sumaTotal += p.s2;
      if (tramosACalcular >= 3) sumaTotal += p.s3;
      if (tramosACalcular >= 4) sumaTotal += p.s4;
      return { ...p, sumaTotal };
    });

    // Ordenar por menor tiempo acumulado
    const ordenadosGen = conSuma.sort((a, b) => a.sumaTotal - b.sumaTotal);

    return ordenadosGen.map((p, idx) => {
      const tiempoTotalSeg = p.sumaTotal;
      const liderSeg = ordenadosGen[0].sumaTotal;
      const difLider = idx === 0 ? 0 : tiempoTotalSeg - liderSeg;

      let difAnterior = 0;
      if (idx > 0) {
        difAnterior = tiempoTotalSeg - ordenadosGen[idx - 1].sumaTotal;
      }

      return {
        pos: idx + 1,
        piloto: p.piloto,
        auto: p.auto,
        tiempoTotal: formatearSegundos(tiempoTotalSeg),
        difLider: idx === 0 ? '0.0' : `+${difLider.toFixed(2)}`,
        difAnterior: idx === 0 ? '-' : `+${difAnterior.toFixed(2)}`
      };
    });
  }

  const datosTramo = obtenerDatosTramoActual();
  const datosGeneral = obtenerClasificacionGeneral();
  const sesionActualObj = sesionesServidor.find(s => s.id === sesionActivaId);

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-wrc text-white uppercase p-4">
      
      {/* 1. BOTONES SUPERIORES PRINCIPALES: RESULTADOS SERVER vs RESULTADOS RALLY */}
      <div className="flex justify-center items-center gap-4 bg-neutral-900/60 p-2 rounded-2xl border border-white/10 backdrop-blur-md">
        <button
          onClick={() => setVistaPrincipal('server')}
          className={`px-8 py-3 rounded-xl font-black text-sm tracking-wider transition cursor-pointer ${
            vistaPrincipal === 'server'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
              : 'bg-neutral-950/80 text-neutral-400 hover:text-white border border-white/5'
          }`}
        >
          RESULTADOS SERVER
        </button>
        <button
          onClick={() => setVistaPrincipal('rally')}
          className={`px-8 py-3 rounded-xl font-black text-sm tracking-wider transition cursor-pointer ${
            vistaPrincipal === 'rally'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
              : 'bg-neutral-950/80 text-neutral-400 hover:text-white border border-white/5'
          }`}
        >
          RESULTADOS RALLY
        </button>
      </div>

      {/* 2. VISTA 1: RESULTADOS AUTOMÁTICOS DEL SERVIDOR */}
      {vistaPrincipal === 'server' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-neutral-950/90 border border-white/10 rounded-2xl p-5 shadow-2xl">
          {/* Selector de sesiones archivadas */}
          <div className="space-y-3 bg-neutral-900/50 p-4 rounded-xl border border-white/5">
            <h3 className="text-xs text-amber-400 font-bold">SESIONES ARCHIVADAS ({sesionesServidor.length})</h3>
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

          {/* Detalle de la sesión seleccionada */}
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
                          <td className="py-2 px-2 font-bold text-white">{j.nombre}</td>
                          <td className="py-2 px-2 text-neutral-300">{j.auto || 'SAVEIRO G4'}</td>
                          <td className="py-2 px-2 text-center">{j.vueltas || '-'}</td>
                          <td className="py-2 px-2 text-right text-amber-300">{j.mejorTiempo || '1:31.382'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-neutral-500 text-xs">
                SELECCIONÁ UNA SESIÓN DE LA IZQUIERDA
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. VISTA 2: RESULTADOS RALLY (DOBLE COLUMNA CON NAVEGACIÓN) */}
      {vistaPrincipal === 'rally' && (
        <div className="bg-neutral-950/90 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md">
          
          {/* CABECERA / SUB-MENÚ DE RALLY */}
          <div className="bg-neutral-900/90 p-3 border-b border-white/10 flex flex-wrap justify-between items-center gap-2">
            
            {/* Botón de Categorías / Filtro */}
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

            {/* Sub-pestañas: Tramo 1, Tramo 2, Tramo 3, Tramo 4, Tiempo General */}
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

          {/* CUERPO PRINCIPAL: DOBLE COLUMNA (TIEMPO TRAMO vs CLASIFICACIÓN GENERAL) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
            
            {/* COLUMNA IZQUIERDA: TIEMPO TRAMO SELECCIONADO */}
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
                    {datosTramo.map((dt, idx) => (
                      <tr key={idx} className="hover:bg-white/5">
                        <td className="py-2.5 px-1 text-center font-bold text-amber-400">#{dt.pos}</td>
                        <td className="py-2 px-2">
                          <p className="font-bold text-white">{dt.piloto}</p>
                          <span className="text-[9px] text-neutral-400">{dt.auto}</span>
                        </td>
                        <td className="py-2 px-2 text-center text-white font-bold">{dt.tiempo}</td>
                        <td className="py-2 px-2 text-right text-amber-300">{dt.difLider}</td>
                        <td className="py-2 px-2 text-right text-neutral-400">{dt.difAnterior}</td>
                      </tr>
                    ))}
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
                    {datosGeneral.map((dg, idx) => {
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
                    })}
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