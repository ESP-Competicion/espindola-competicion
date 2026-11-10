import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function PerfilModal({ usuario, perfilActual, onClose, onPerfilGuardado }) {
  const [nombrePiloto, setNombrePiloto] = useState(perfilActual?.nombre_piloto || '');
  const [steamId, setSteamId] = useState(perfilActual?.steam_id || '');
  const [nacionalidad, setNacionalidad] = useState(perfilActual?.nacionalidad || 'Argentina');
  const [guardando, setGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (perfilActual) {
      setNombrePiloto(perfilActual.nombre_piloto || '');
      setSteamId(perfilActual.steam_id || '');
      setNacionalidad(perfilActual.nacionalidad || 'Argentina');
    }
  }, [perfilActual]);

  const handleGuardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setErrorMsg('');

    const updates = {
      id: usuario.id,
      nombre_piloto: nombrePiloto,
      steam_id: steamId,
      nacionalidad: nacionalidad,
    };

    const { error } = await supabase.from('perfiles').upsert(updates);

    setGuardando(false);

    if (error) {
      setErrorMsg('Error al actualizar: ' + error.message);
    } else {
      onPerfilGuardado();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 max-w-md w-full relative text-white">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-500 hover:text-white font-bold"
        >
          ✕
        </button>

        <h3 className="text-xl font-bold mb-4 text-amber-500 uppercase tracking-wide">
          Perfil de Piloto
        </h3>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleGuardar} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">Email</label>
            <input 
              type="text" 
              disabled 
              value={usuario.email} 
              className="w-full bg-neutral-800 border border-neutral-700/50 text-neutral-500 rounded-lg p-2.5 text-sm cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">Nombre y Apellido (Piloto)</label>
            <input 
              type="text" 
              required 
              value={nombrePiloto}
              onChange={(e) => setNombrePiloto(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-amber-500" 
              placeholder="Ej. Lucas Negri"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">Steam ID 64</label>
            <input 
              type="text" 
              required 
              value={steamId}
              onChange={(e) => setSteamId(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-amber-500" 
              placeholder="76561198xxxxxxxxx"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">Nacionalidad</label>
            <select
              value={nacionalidad}
              onChange={(e) => setNacionalidad(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-amber-500"
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
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm uppercase rounded-lg transition disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>
      </div>
    </div>
  );
}
