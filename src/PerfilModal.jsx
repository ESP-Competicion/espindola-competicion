import { useState } from 'react';
import { supabase } from './supabaseClient';
import SubirImagen from './SubirImagen';

export default function PerfilModal({ usuario, onClose, onPerfilGuardado }) {
  const [nombrePiloto, setNombrePiloto] = useState('');
  const [steamId, setSteamId] = useState('');
  const [nacionalidad, setNacionalidad] = useState('Argentina');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Cargar datos actuales al abrir
  useState(() => {
    async function cargar() {
      if (!usuario) return;
      const { data } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', usuario.id)
        .single();
      
      if (data) {
        setNombrePiloto(data.nombre_piloto || '');
        setSteamId(data.steam_id || '');
        setNacionalidad(data.nacionalidad || 'Argentina');
        setAvatarUrl(data.avatar_url || '');
      }
    }
    cargar();
  }, [usuario]);

  const handleGuardar = async (e) => {
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
      alert('Error al guardar perfil: ' + error.message);
    } else {
      alert('¡Perfil actualizado con éxito!');
      onPerfilGuardado();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="bg-neutral-900 border border-amber-500/40 rounded-3xl p-8 max-w-lg w-full shadow-2xl relative font-sans">
        <h2 className="font-wrc text-2xl font-black text-amber-400 mb-2 uppercase tracking-wide">
          Configurar Perfil de Piloto
        </h2>
        <p className="text-neutral-400 text-xs mb-6">
          Actualiza tus datos personales y tu foto de perfil oficial.
        </p>

        <form onSubmit={handleGuardar} className="space-y-4">
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
            <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">Steam ID 64</label>
            <input 
              type="text" 
              value={steamId}
              onChange={(e) => setSteamId(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-500 outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">Nacionalidad</label>
            <input 
              type="text" 
              value={nacionalidad}
              onChange={(e) => setNacionalidad(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">Foto de Perfil (Desde la PC)</label>
            <SubirImagen currentUrl={avatarUrl} onUpload={(url) => setAvatarUrl(url)} />
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
              disabled={guardando}
              className="bg-amber-500 hover:bg-amber-400 text-black font-wrc font-black text-sm uppercase px-6 py-2.5 rounded-xl transition shadow-lg shadow-amber-500/20"
            >
              {guardando ? 'Guardando...' : 'Guardar Perfil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
