import { useState } from 'react';
import { supabase } from './supabaseClient';

export default function PerfilModal({ usuario, onClose, onPerfilGuardado }) {
  const [nombrePiloto, setNombrePiloto] = useState('');
  const [steamId, setSteamId] = useState('');
  const [nacionalidad, setNacionalidad] = useState('Argentina 🇦🇷');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [guardando, setGuardando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!usuario) return;
    setGuardando(true);

    const { error } = await supabase
      .from('perfiles')
      .upsert({
        id: usuario.id,
        nombre_piloto: nombrePiloto,
        steam_id: steamId,
        nacionalidad: nacionalidad,
        avatar_url: avatarUrl,
        updated_at: new Date()
      });

    setGuardando(false);

    if (error) {
      alert('Error al guardar el perfil: ' + error.message);
    } else {
      onPerfilGuardado();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-amber-500/40 rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
        <h2 className="font-wrc text-2xl font-black text-amber-400 mb-2 uppercase tracking-wide">Configurar Perfil de Piloto</h2>
        <p className="text-neutral-400 text-xs mb-6 font-sans">Actualiza tus datos para que aparezcan en el equipo y las tablas.</p>

        <form onSubmit={handleSubmit} className="space-y-4 font-sans">
          <div>
            <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">Nombre de Piloto</label>
            <input 
              type="text" 
              placeholder="Ej: Leo Espíndola" 
              value={nombrePiloto}
              onChange={(e) => setNombrePiloto(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">URL de la Foto de Perfil (Avatar)</label>
            <input 
              type="url" 
              placeholder="https://ejemplo.com/tufoto.jpg" 
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-500 outline-none"
            />
            <p className="text-[10px] text-neutral-500 mt-1">Pega el enlace directo de una imagen (puedes usar Catbox o Imgur).</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">Steam ID 64</label>
            <input 
              type="text" 
              placeholder="76561198..." 
              value={steamId}
              onChange={(e) => setSteamId(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">Nacionalidad</label>
            <input 
              type="text" 
              placeholder="Argentina 🇦🇷" 
              value={nacionalidad}
              onChange={(e) => setNacionalidad(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-wrc text-sm uppercase py-3 rounded-xl transition tracking-wider"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={guardando}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-wrc font-black text-sm uppercase py-3 rounded-xl transition shadow-lg shadow-amber-500/25 tracking-wider"
            >
              {guardando ? 'Guardando...' : 'Guardar Perfil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
