import { useState } from 'react';
import { api } from './api';

export default function AuthModal({ onClose, onLoginExitoso }) {
  const [modo, setModo] = useState('login');
  const [email, setEmail] = useState('');
  const [nombrePiloto, setNombrePiloto] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    const emailNormalizado = email.trim().toLowerCase();
    if (!emailNormalizado) return;
    setCargando(true);

    try {
      const { data: existentes } = await api.from('perfiles').select({
        eq_email: emailNormalizado
      });
      let piloto = Array.isArray(existentes) && existentes.length > 0 ? existentes[0] : null;

      if (modo === 'registro') {
        const idNuevo = piloto?.id || crypto.randomUUID();
        const { data: creado, error } = await api.from('perfiles').insert(
          {
            id: idNuevo,
            email: emailNormalizado,
            nombre_piloto: (nombrePiloto || emailNormalizado.split('@')[0]).trim()
          },
          { upsert: true }
        );
        if (error) throw error;
        piloto = creado || { id: idNuevo, email: emailNormalizado };
        if (onLoginExitoso) onLoginExitoso({ id: piloto.id, email: emailNormalizado });
        alert('¡Cuenta de piloto creada y sesión iniciada!');
        onClose();
      } else if (modo === 'login') {
        if (!piloto) {
          const idNuevo = crypto.randomUUID();
          await api.from('perfiles').insert({
            id: idNuevo,
            email: emailNormalizado,
            nombre_piloto: emailNormalizado.split('@')[0]
          });
          piloto = { id: idNuevo, email: emailNormalizado };
        }
        if (onLoginExitoso) onLoginExitoso({ id: piloto.id, email: emailNormalizado });
        onClose();
      } else if (modo === 'recuperar') {
        alert('Acceso directo habilitado por correo de piloto: ingresá con tu correo en "Iniciar Sesión".');
        setModo('login');
      }
    } catch (err) {
      alert('Error en el acceso: ' + (err.message || 'Error desconocido'));
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="bg-neutral-900 border border-amber-500/40 rounded-3xl p-8 max-w-md w-full shadow-2xl relative font-sans">
        <h2 className="font-wrc text-2xl font-black text-amber-400 mb-2 uppercase tracking-wide">
          {modo === 'registro' && 'Crear Cuenta de Piloto'}
          {modo === 'login' && 'Acceso Pilotos'}
          {modo === 'recuperar' && 'Recuperar Acceso'}
        </h2>

        <p className="text-neutral-400 text-xs mb-6 font-sans">
          {modo === 'registro' && 'Registrate para competir en las fechas oficiales.'}
          {modo === 'login' && 'Ingresá con tu correo para gestionar tu perfil e inscripciones.'}
          {modo === 'recuperar' && 'Ingresá tu correo de piloto para habilitar tu acceso.'}
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">Correo Electrónico</label>
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 outline-none"
              required
            />
          </div>

          {modo === 'registro' && (
            <div>
              <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">Nombre de Piloto</label>
              <input
                type="text"
                placeholder="Ej: Leonardo Espíndola"
                value={nombrePiloto}
                onChange={(e) => setNombrePiloto(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 outline-none"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-wrc font-black text-base uppercase py-3 rounded-xl transition shadow-lg shadow-amber-500/20 tracking-wider mt-2 cursor-pointer"
          >
            {cargando ? 'Procesando...' : modo === 'registro' ? 'Registrarse' : modo === 'login' ? 'Iniciar Sesión' : 'Continuar'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-neutral-800 flex justify-between items-center text-xs">
          {modo === 'recuperar' ? (
            <button
              onClick={() => setModo('login')}
              className="text-amber-400 hover:underline font-medium cursor-pointer"
            >
              Volver a Iniciar Sesión
            </button>
          ) : (
            <button
              onClick={() => setModo(modo === 'login' ? 'registro' : 'login')}
              className="text-amber-400 hover:underline font-medium cursor-pointer"
            >
              {modo === 'login' ? '¿No tenés cuenta? Registrate acá' : '¿Ya tenés cuenta? Inicia sesión'}
            </button>
          )}
          <button onClick={onClose} className="text-neutral-500 hover:text-white cursor-pointer">Cancelar</button>
        </div>
      </div>
    </div>
  );
}