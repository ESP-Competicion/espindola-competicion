import { useState, useEffect } from 'react';
import { api } from './api';
import SubirImagen from './SubirImagen';

export default function PerfilModal({ usuario, perfil, onClose, onPerfilGuardado, onActualizado }) {
  const [nombrePiloto, setNombrePiloto] = useState(perfil?.nombre_piloto || '');
  const [steamId, setSteamId] = useState(perfil?.steam_id || '');
  const [nacionalidad, setNacionalidad] = useState(perfil?.nacionalidad || 'Argentina 🇦🇷');
  const [provincia, setProvincia] = useState(perfil?.provincia || '');
  const [telefono, setTelefono] = useState(perfil?.telefono || '');
  const [avatarUrl, setAvatarUrl] = useState(perfil?.avatar_url || '');
  const [guardando, setGuardando] = useState(false);
  const [passwordHash, setPasswordHash] = useState(perfil?.password_hash || null);

  useEffect(() => {
    async function cargar() {
      if (!usuario?.id) return;
      const { data } = await api
        .from('perfiles')
        .eq('id', usuario.id)
        .single()
        .select();

      if (data) {
        setNombrePiloto(data.nombre_piloto || '');
        setSteamId(data.steam_id || '');
        setNacionalidad(data.nacionalidad || 'Argentina 🇦🇷');
        setProvincia(data.provincia || '');
        setTelefono(data.telefono || '');
        setAvatarUrl(data.avatar_url || '');
        setPasswordHash(data.password_hash || null);
      }
    }
    cargar();
  }, [usuario]);

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!usuario?.id) return;
    setGuardando(true);

    try {
      const nombreLimpio = nombrePiloto.trim();
      const fotoLimpia = (avatarUrl || '').trim() || null;

      const { data: actual } = await api
        .from('perfiles')
        .eq('id', usuario.id)
        .single()
        .select();

      const hashFinal = actual?.password_hash || passwordHash || null;

      const { error } = await api.from('perfiles').insert(
        {
          id: usuario.id,
          nombre_piloto: nombreLimpio,
          steam_id: steamId.trim(),
          nacionalidad: nacionalidad.trim(),
          provincia: provincia.trim(),
          telefono: telefono.trim(),
          avatar_url: fotoLimpia,
          password_hash: hashFinal,
          updated_at: new Date().toISOString()
        },
        { upsert: true }
      );

      if (error) {
        alert('Error al guardar perfil: ' + error.message);
        return;
      }

      if (fotoLimpia && nombreLimpio) {
        await api
          .from('salon_fama')
          .eq('nombre', nombreLimpio.toUpperCase())
          .update({ foto: fotoLimpia });
      }

      alert('¡Perfil actualizado con éxito!');
      if (onPerfilGuardado) onPerfilGuardado();
      if (onActualizado) onActualizado();
      onClose();
    } catch (err) {
      console.error('Error inesperado al guardar perfil:', err);
      alert('Ocurrió un error inesperado al guardar el perfil.');
    } finally {
      setGuardando(false);
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
          Actualizá tus datos personales y subí tu foto para tu perfil, miembros y Salón de la Fama.
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
            <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">Foto de Perfil</label>
            <SubirImagen
              currentUrl={avatarUrl}
              inicial={inicial}
              onUpload={(base64) => setAvatarUrl(base64)}
            />
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