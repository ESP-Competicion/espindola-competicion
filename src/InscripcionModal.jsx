import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// Mapeo de banderas emoji por país
const banderasPais = {
  'Argentina': '🇦🇷',
  'Uruguay': '🇺🇾',
  'Brasil': '🇧🇷',
  'Chile': '🇨🇱',
  'Paraguay': '🇵🇾',
  'España': '🇪🇸',
  'México': '🇲🇽',
  'Colombia': '🇨🇴',
  'Perú': '🇵🇪',
  'Otro': '🌐'
};

export default function InscripcionModal({ evento, modo, perfil, usuario, onClose }) {
  const [inscriptos, setInscriptos] = useState([]);
  const [cargando, setCargando] = useState(false);

  // Campos del formulario
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-neutral-900/90 backdrop-blur-xl border border-amber-500/50 rounded-3xl p-6 max-w-2xl w-full shadow-2xl relative">
        
        {/* Cabecera del Modal */}
        <div className="flex justify-between items-center pb-4 border-b border-neutral-800">
          <div>
            <span className="text-amber-400 font-wrc text-xs uppercase tracking-widest font-bold">
              {modo === 'formulario' ? '📝 Formulario de Inscripción' : '📊 Lista de Pilotos Inscriptos'}
            </span>
            <h2 className="font-wrc text-2xl text-white font-extrabold">{evento.titulo}</h2>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white font-bold text-lg">✕</button>
        </div>

        {/* MODAL DE INCRIPCIÓN */}
        {modo === 'formulario' && (
          <form onSubmit={handleInscribirse} className="space-y-4 pt-4 font-sans">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">Nombre del Piloto</label>
                <input 
                  type="text"
                  value={nombrePiloto}
                  onChange={(e) => setNombrePiloto(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">País de Origen</label>
                <select
                  value={paisOrigen}
                  onChange={(e) => setPaisOrigen(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-500 outline-none"
                >
                  {Object.keys(banderasPais).map((p) => (
                    <option key={p} value={p}>{banderasPais[p]} {p}</option>
                  ))}
                </select>
              </div>

              {categoriasArray.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">Categoría</label>
                  <select
                    value={categoriaSeleccionada}
                    onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-500 outline-none"
                  >
                    {categoriasArray.map((cat, i) => (
                      <option key={i} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}

              {modelosArray.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">Modelo de Auto</label>
                  <select
                    value={autoSeleccionado}
                    onChange={(e) => setAutoSeleccionado(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-500 outline-none"
                  >
                    {modelosArray.map((m, i) => (
                      <option key={i} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">Steam ID 64</label>
                <input 
                  type="text"
                  placeholder="76561198..."
                  value={steamId}
                  onChange={(e) => setSteamId(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
              <button 
                type="button" 
                onClick={onClose}
                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-wrc text-sm uppercase px-5 py-2.5 rounded-xl transition"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={cargando}
                className="bg-amber-500 hover:bg-amber-400 text-black font-wrc font-black text-sm uppercase px-6 py-2.5 rounded-xl transition shadow-lg shadow-amber-500/20"
              >
                {cargando ? 'Inscribiendo...' : 'Confirmar Inscripción'}
              </button>
            </div>
          </form>
        )}

        {/* MODAL LISTA DE INSCRIPTOS CON BANDERAS */}
        {modo === 'lista' && (
          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-center text-xs text-neutral-400 font-sans">
              <span>Total inscriptos: <strong className="text-amber-400 font-bold">{inscriptos.length}</strong></span>
              <span>Lugar de competencia: <strong className="text-white">{evento.pais_origen || 'Internacional'}</strong></span>
            </div>

            {inscriptos.length === 0 ? (
              <p className="text-center py-8 text-neutral-500 font-sans">Aún no hay pilotos inscriptos a esta fecha.</p>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                {inscriptos.map((piloto, idx) => (
                  <div 
                    key={piloto.id} 
                    className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-3 flex items-center justify-between hover:border-amber-500/40 transition font-sans"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-wrc font-bold text-amber-500 text-sm w-6">#{idx + 1}</span>
                      <span className="text-xl">{banderasPais[piloto.pais_origen] || '🌐'}</span>
                      <div>
                        <h4 className="text-white font-bold text-sm leading-tight">{piloto.nombre_piloto}</h4>
                        <span className="text-neutral-400 text-xs">{piloto.categoria_seleccionada} • {piloto.auto_seleccionado}</span>
                      </div>
                    </div>
                    {piloto.steam_id && (
                      <span className="text-[10px] font-mono text-neutral-500 bg-neutral-900 px-2 py-1 rounded border border-neutral-800">
                        ID: {piloto.steam_id}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
