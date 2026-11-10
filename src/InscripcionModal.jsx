import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// Diccionario de banderas SVG HD (Compatibilidad 100% garantizada en todos los navegadores)
const banderasPais = {
  'Argentina': { emoji: '🇦🇷', svg: 'https://flagcdn.com/w40/ar.png' },
  'Uruguay': { emoji: '🇺🇾', svg: 'https://flagcdn.com/w40/uy.png' },
  'Brasil': { emoji: '🇧🇷', svg: 'https://flagcdn.com/w40/br.png' },
  'Chile': { emoji: '🇨🇱', svg: 'https://flagcdn.com/w40/cl.png' },
  'Paraguay': { emoji: '🇵🇾', svg: 'https://flagcdn.com/w40/py.png' },
  'España': { emoji: '🇪🇸', svg: 'https://flagcdn.com/w40/es.png' },
  'México': { emoji: '🇲🇽', svg: 'https://flagcdn.com/w40/mx.png' },
  'Colombia': { emoji: '🇨🇴', svg: 'https://flagcdn.com/w40/co.png' },
  'Perú': { emoji: '🇵🇪', svg: 'https://flagcdn.com/w40/pe.png' },
  'Otro': { emoji: '🌐', svg: '' }
};

export default function InscripcionModal({ evento, modo, perfil, usuario, onClose }) {
  const [inscriptos, setInscriptos] = useState([]);
  const [cargando, setCargando] = useState(false);

  const [nombrePiloto, setNombrePiloto] = useState(perfil?.nombre_piloto || usuario?.email?.split('@')[0] || '');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [autoSeleccionado, setAutoSeleccionado] = useState('');
  const [paisOrigen, setPaisOrigen] = useState('Argentina');
  const [steamId, setSteamId] = useState(perfil?.steam_id || '');

  const categoriasArray = evento.categorias ? evento.categorias.split(',').map(c => c.trim()) : [];
  const modelosArray = evento.modelos_autos ? evento.modelos_autos.split(',').map(m => m.trim()) : [];

  useEffect(() => {
    if (categoriasArray.length > 0) setCategoriaSeleccionada(categoriasArray[0]);
    if (modelosArray.length > 0) setAutoSeleccionado(modelosArray[0]);
    cargarInscriptos();
  }, [evento]);

  async function cargarInscriptos() {
    const { data } = await supabase
      .from('inscripciones')
      .select('*')
      .eq('evento_id', evento.id)
      .order('created_at', { ascending: true });

    if (data) setInscriptos(data);
  }

  const handleInscribirse = async (e) => {
    e.preventDefault();
    if (!nombrePiloto) return;
    setCargando(true);

    const { error } = await supabase
      .from('inscripciones')
      .insert([{
        evento_id: evento.id,
        nombre_piloto: nombrePiloto,
        categoria_seleccionada: categoriaSeleccionada,
        auto_seleccionado: autoSeleccionado,
        pais_origen: paisOrigen,
        steam_id: steamId
      }]);

    setCargando(false);

    if (error) {
      alert('Error al inscribirse: ' + error.message);
    } else {
      alert('¡Inscripción confirmada con éxito! 🏁');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      {/* Contenedor ampliado a max-w-4xl con bordes más amplios y limpios */}
      <div className="bg-neutral-900/95 backdrop-blur-2xl border border-amber-500/40 rounded-3xl p-8 max-w-4xl w-full shadow-2xl relative">
        
        {/* Encabezado */}
        <div className="flex justify-between items-center pb-5 border-b border-neutral-800">
          <div>
            <span className="text-amber-400 font-wrc text-sm uppercase tracking-widest font-bold">
              {modo === 'formulario' ? '📝 Formulario de Inscripción' : '📋 Lista Oficial de Inscriptos'}
            </span>
            <h2 className="font-wrc text-3xl text-white font-extrabold tracking-wide mt-1">{evento.titulo}</h2>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white font-bold flex items-center justify-center transition border border-white/10"
          >
            ✕
          </button>
        </div>

        {/* MODO FORMULARIO */}
        {modo === 'formulario' && (
          <form onSubmit={handleInscribirse} className="space-y-6 pt-6 font-sans">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase mb-2">Nombre del Piloto</label>
                <input 
                  type="text"
                  value={nombrePiloto}
                  onChange={(e) => setNombrePiloto(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase mb-2">País de Origen</label>
                <select
                  value={paisOrigen}
                  onChange={(e) => setPaisOrigen(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 outline-none"
                >
                  {Object.keys(banderasPais).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {categoriasArray.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase mb-2">Categoría</label>
                  <select
                    value={categoriaSeleccionada}
                    onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 outline-none"
                  >
                    {categoriasArray.map((cat, i) => (
                      <option key={i} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}

              {modelosArray.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase mb-2">Modelo de Auto</label>
                  <select
                    value={autoSeleccionado}
                    onChange={(e) => setAutoSeleccionado(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 outline-none"
                  >
                    {modelosArray.map((m, i) => (
                      <option key={i} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-neutral-300 uppercase mb-2">Steam ID 64</label>
                <input 
                  type="text"
                  placeholder="76561198..."
                  value={steamId}
                  onChange={(e) => setSteamId(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
              <button 
                type="button" 
                onClick={onClose}
                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-wrc text-sm uppercase px-6 py-3 rounded-xl transition"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={cargando}
                className="bg-amber-500 hover:bg-amber-400 text-black font-wrc font-black text-base uppercase px-8 py-3 rounded-xl transition shadow-lg shadow-amber-500/20 tracking-wider"
              >
                {cargando ? 'Inscribiendo...' : 'Confirmar Inscripción'}
              </button>
            </div>
          </form>
        )}

        {/* MODO LISTA DE INSCRIPTOS (Vista ampliada y banderas en imagen HD) */}
        {modo === 'lista' && (
          <div className="space-y-5 pt-5">
            <div className="flex justify-between items-center text-xs font-sans text-neutral-400 bg-neutral-950/80 px-4 py-2.5 rounded-xl border border-neutral-800">
              <span>Pilotos inscriptos: <strong className="text-amber-400 font-bold text-sm">{inscriptos.length}</strong></span>
              <span>Sede del campeonato: <strong className="text-white text-sm">{evento.pais_origen || 'Internacional'}</strong></span>
            </div>

            {inscriptos.length === 0 ? (
              <p className="text-center py-12 text-neutral-500 font-sans">Aún no hay pilotos inscriptos a este evento.</p>
            ) : (
              <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2">
                {inscriptos.map((piloto, idx) => {
                  const infoBandera = banderasPais[piloto.pais_origen];
                  return (
                    <div 
                      key={piloto.id} 
                      className="bg-neutral-950/70 border border-neutral-800/80 hover:border-amber-500/50 rounded-2xl p-4 flex items-center justify-between transition font-sans shadow-md"
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-wrc font-black text-amber-500 text-lg w-8 text-center">
                          #{idx + 1}
                        </span>
                        
                        {/* Render de la bandera en imagen o fallback */}
                        {infoBandera?.svg ? (
                          <img 
                            src={infoBandera.svg} 
                            alt={piloto.pais_origen} 
                            className="w-7 h-5 object-cover rounded shadow-sm border border-white/20"
                            title={piloto.pais_origen}
                          />
                        ) : (
                          <span className="text-xl">{infoBandera?.emoji || '🌐'}</span>
                        )}

                        <div>
                          <h4 className="text-white font-bold text-base leading-snug">{piloto.nombre_piloto}</h4>
                          <span className="text-neutral-400 text-xs font-medium">
                            {piloto.categoria_seleccionada} • <strong className="text-neutral-200">{piloto.auto_seleccionado}</strong>
                          </span>
                        </div>
                      </div>

                      {piloto.steam_id && (
                        <div className="text-right">
                          <span className="text-[11px] font-mono text-amber-400/90 bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-800 tracking-wider">
                            ID: {piloto.steam_id}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
