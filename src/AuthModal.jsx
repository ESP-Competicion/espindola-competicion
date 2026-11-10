import { useState } from 'react';
import { supabase } from './supabaseClient';

export default function AuthModal({ onClose }) {
  // Estados: 'login' | 'registro' | 'recuperar'
  const [modo, setModo] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setCargando(true);

    if (modo === 'registro') {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        alert('Error al registrarse: ' + error.message);
      } else {
        alert('¡Cuenta creada con éxito! Revisa tu casilla de correo para confirmar tu registro.');
        onClose();
      }
    } else if (modo === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        alert('Error al iniciar sesión: ' + error.message);
      } else {
        onClose();
      }
    } else if (modo === 'recuperar') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
      });
      if (error) {
        alert('Error al enviar el correo: ' + error.message);
      } else {
        alert('Te enviamos un enlace a tu correo electrónico para restablecer tu contraseña. Revisa tu bandeja de entrada o Spam.');
        onClose();
      }
    }
    setCargando(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="bg-neutral-900 border border-amber-500/40 rounded-3xl p-8 max-w-md w-full shadow-2xl relative font-sans">
        
        {/* Título dinámico */}
        <h2 className="font-wrc text-2xl font-black text-amber-400 mb-2 uppercase tracking-wide">
          {modo === 'registro' && 'Crear Cuenta de Piloto'}
          {modo === 'login' && 'Acceso Pilotos'}
          {modo === 'recuperar' && 'Recuperar Contraseña'}
        </h2>
        
        <p className="text-neutral-400 text-xs mb-6 font-sans">
          {modo === 'registro' && 'Registrate para competir en las fechas oficiales.'}
          {modo === 'login' && 'Ingresa con tu cuenta para gestionar tus inscripciones.'}
          {modo === 'recuperar' && 'Ingresá tu correo y te enviaremos las instrucciones para cambiar tu clave.'}
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

          {modo !== 'recuperar' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-neutral-300 uppercase">Contraseña</label>
                {modo === 'login' && (
                  <button 
                    type="button"
                    onClick={() => setModo('recuperar')}
                    className="text-[11px] text-amber-400 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 outline-none"
                required
              />
            </div>
          )}

          <button 
            type="submit"
            disabled={cargando}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-wrc font-black text-base uppercase py-3 rounded-xl transition shadow-lg shadow-amber-500/20 tracking-wider mt-2"
          >
            {cargando ? 'Procesando...' : modo === 'registro' ? 'Registrarse' : modo === 'login' ? 'Iniciar Sesión' : 'Enviar Enlace de Recuperación'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-neutral-800 flex justify-between items-center text-xs">
          {modo === 'recuperar' ? (
            <button 
              onClick={() => setModo('login')} 
              className="text-amber-400 hover:underline font-medium"
            >
              Volver a Iniciar Sesión
            </button>
          ) : (
            <button 
              onClick={() => setModo(modo === 'login' ? 'registro' : 'login')} 
              className="text-amber-400 hover:underline font-medium"
            >
              {modo === 'login' ? '¿No tenés cuenta? Registrate acá' : '¿Ya tenés cuenta? Inicia sesión'}
            </button>
          )}
          <button onClick={onClose} className="text-neutral-500 hover:text-white">Cancelar</button>
        </div>
      </div>
    </div>
  );
}
