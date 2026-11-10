import { useState } from 'react';
import { supabase } from './supabaseClient';

export default function CambiarPasswordModal({ onClose }) {
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleActualizar = async (e) => {
    e.preventDefault();
    setCargando(true);

    const { error } = await supabase.auth.updateUser({
      password: nuevaPassword
    });

    setCargando(false);

    if (error) {
      alert('Error al actualizar la contraseña: ' + error.message);
    } else {
      alert('¡Tu contraseña ha sido actualizada con éxito!');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="bg-neutral-900 border border-amber-500/40 rounded-3xl p-8 max-w-md w-full shadow-2xl relative font-sans">
        <h2 className="font-wrc text-2xl font-black text-amber-400 mb-2 uppercase tracking-wide">
          Establecer Nueva Contraseña
        </h2>
        <p className="text-neutral-400 text-xs mb-6 font-sans">
          Ingresá tu nueva clave para actualizar tu acceso.
        </p>

        <form onSubmit={handleActualizar} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">Nueva Contraseña</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 outline-none"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={cargando}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-wrc font-black text-base uppercase py-3 rounded-xl transition shadow-lg shadow-amber-500/20 tracking-wider mt-2"
          >
            {cargando ? 'Guardando...' : 'Actualizar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
