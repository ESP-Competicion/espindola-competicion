import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient'; // Ajustá la ruta si tu cliente de Supabase está en otra carpeta

export default function PerfilPiloto({ session }) {
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const [perfil, setPerfil] = useState({
    nombre_piloto: '',
    steam_id: '',
    nacionalidad: 'Argentina'
  });

  useEffect(() => {
    obtenerPerfil();
  }, [session]);

  const obtenerPerfil = async () => {
    try {
      setLoading(true);
      const { user } = session;

      let { data, error } = await supabase
        .from('perfiles')
        .select('nombre_piloto, steam_id, nacionalidad')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error al cargar perfil:', error);
      }

      if (data) {
        setPerfil({
          nombre_piloto: data.nombre_piloto || '',
          steam_id: data.steam_id || '',
          nacionalidad: data.nacionalidad || 'Argentina'
        });
      }
    } catch (error) {
      console.error('Error general:', error);
    } finally {
      setLoading(false);
    }
  };

  const actualizarPerfil = async (e) => {
    e.preventDefault();
    try {
      setGuardando(true);
      setMensaje(null);
      const { user } = session;

      const updates = {
        id: user.id,
        nombre_piloto: perfil.nombre_piloto,
        steam_id: perfil.steam_id,
        nacionalidad: perfil.nacionalidad,
      };

      let { error } = await supabase.from('perfiles').upsert(updates);

      if (error) throw error;
      setMensaje({ tipo: 'exito', texto: '¡Perfil actualizado correctamente!' });
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error al actualizar el perfil: ' + error.message });
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return <div className="text-center text-gray-400 py-8">Cargando perfil...</div>;
  }

  return (
    <div className="max-w-md mx-auto bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl text-white">
      <h2 className="text-xl font-bold text-amber-500 mb-4 uppercase tracking-wide">
        Perfil de Piloto
      </h2>

      {mensaje && (
        <div className={`p-3 rounded-lg text-sm mb-4 ${
          mensaje.tipo === 'exito' 
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
        }`}>
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={actualizarPerfil} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">
            Correo Electrónico
          </label>
          <input
            type="text"
            value={session.user.email}
            disabled
            className="w-full bg-neutral-800 text-gray-500 border border-neutral-700 rounded-lg px-3 py-2 text-sm cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">
            Nombre y Apellido (Piloto)
          </label>
          <input
            type="text"
            required
            placeholder="Ej: Lucas Negri"
            value={perfil.nombre_piloto}
            onChange={(e) => setPerfil({ ...perfil, nombre_piloto: e.target.value })}
            className="w-full bg-neutral-800 text-white border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">
            Steam ID 64
          </label>
          <input
            type="text"
            required
            placeholder="76561198xxxxxxxxx"
            value={perfil.steam_id}
            onChange={(e) => setPerfil({ ...perfil, steam_id: e.target.value })}
            className="w-full bg-neutral-800 text-white border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">
            Nacionalidad
          </label>
          <select
            value={perfil.nacionalidad}
            onChange={(e) => setPerfil({ ...perfil, nacionalidad: e.target.value })}
            className="w-full bg-neutral-800 text-white border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
          >
            <option value="Argentina">Argentina</option>
            <option value="Brasil">Brasil</option>
            <option value="Chile">Chile</option>
            <option value="Uruguay">Uruguay</option>
            <option value="Paraguay">Paraguay</option>
            <option value="Otro">Otro</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={guardando}
          className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-2 px-4 rounded-lg transition duration-200 uppercase text-sm disabled:opacity-50 mt-2"
        >
          {guardando ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </form>
    </div>
  );
}
