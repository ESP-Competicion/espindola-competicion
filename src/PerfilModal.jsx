import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function PerfilModal({ usuario, onClose, onPerfilGuardado, onActualizado }) {
  const [nombrePiloto, setNombrePiloto] = useState('');
  const [steamId, setSteamId] = useState('');
  const [nacionalidad, setNacionalidad] = useState('Argentina 🇦🇷');
  const [provincia, setProvincia] = useState('');
  const [telefono, setTelefono] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    async function cargar() {
      if (!usuario) return;
      const { data } = await supabase
        .from('perfiles')
        .select('nombre_piloto, steam_id, nacionalidad, provincia, telefono, avatar_url')
        .eq('id', usuario.id)
        .single();

      if (data) {
        setNombrePiloto(data.nombre_piloto || '');
        setSteamId(data.steam_id || '');
        setNacionalidad(data.nacionalidad || 'Argentina 🇦🇷');
        setProvincia(data.provincia || '');
        setTelefono(data.telefono || '');
        setAvatarUrl(data.avatar_url || '');
      }
    }
    cargar();
  }, [usuario]);

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!usuario) return;
    setGuardando(true);

    const urlLimpia = avatarUrl.trim();

    const { error } = await supabase
      .from('perfiles')
      .upsert({
        id: usuario.id,
        nombre_piloto: nombrePiloto.trim(),
        steam_id: steamId.trim(),
        nacionalidad: nacionalidad.trim(),
        provincia: provincia.trim(),
        telefono: telefono.trim(),
        avatar_url: urlLimpia || null,
        updated_at: new Date()
      });

    setGuardando(false);

    if (error) {
      alert('Error al guardar perfil: ' + error.message);
    } else {
      alert('¡Perfil actualizado con éxito!');
      if (onPerfilGuardado) onPerfilGuardado();
      if (onActualizado) onActualizado();
      onClose();
    }
  };

  const inicial = (nombrePiloto || usuario?.email || 'E').charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="bg-neutral-900 border border-[#38bdf8]/40 rounded-3xl p-8 max-w-lg w-full shadow-2xl relative font-sans max-h-[90vh] overflow-y-auto">
        <h2 className="font-wrc text-2xl font-black text-[#38bdf8] mb-2 uppercase tracking-wide">
          Configurar Perfil de Piloto
        </h2>
        <p className="text-neutral-400 text-xs mb-6">
          Actualiza tus datos personales y pega una URL para tu foto de perfil.
        </p>

        <form onSubmit={handleGuardar} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">Nombre y Apellido</label>
            <input
              type="text"
              value={nombrePiloto}
              onChange={(e) => setNombrePiloto(e.target.value)}
              placeholder="Ej: Leonardo Espíndola"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#38bdf8] outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">País</label>
              <input
                type="text"
                value={nacionalidad}
                onChange={(e) => setNacionalidad(e.target.value)}
                placeholder="Ej: Argentina 🇦🇷"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#38bdf8] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">Provincia</label>
              <input
                type="text"
                value={provincia}
                onChange={(e) => setProvincia(e.target.value)}
                placeholder="Ej: Misiones"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#38bdf8] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">Número de Teléfono (WhatsApp)</label>
            <input
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ej: +54 9 376..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#38bdf8] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">Steam ID 64</label>
            <input
              type="text"
              value={steamId}
              onChange={(e) => setSteamId(e.target.value)}
              placeholder="Ej: 76561199..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#38bdf8] outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">URL del Avatar (Imagen)</label>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-neutral-950 border border-[#38bdf8]/50 flex items-center justify-center overflow-hidden font-wrc text-[#38bdf8] text-base flex-shrink-0">
                {avatarUrl.trim() ? (
                  <img
                    src={avatarUrl.trim()}
                    alt="Vista previa"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      if (e.currentTarget.nextSibling) {
                        e.currentTarget.nextSibling.style.display = 'flex';
                      }
                    }}
                    className="w-full h-full object-cover"
                  />
                ) : null}
                <span
                  style={{ display: avatarUrl.trim() ? 'none' : 'flex' }}
                  className="w-full h-full items-center justify-center"
                >
                  {inicial}
                </span>
              </div>

              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#38bdf8] outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-wrc text-sm uppercase px-5 py-2.5 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="bg-[#38bdf8] hover:bg-[#7dd3fc] text-slate-950 font-wrc font-black text-sm uppercase px-6 py-2.5 rounded-xl transition shadow-lg shadow-[#38bdf8]/20 cursor-pointer"
            >
              {guardando ? 'Guardando...' : 'Guardar Perfil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}