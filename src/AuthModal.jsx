import { useState } from 'react';
import { api } from './api';

async function hashearPassword(password) {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default function AuthModal({ onClose, onLoginExitoso }) {
  // 'login' | 'registro' | 'cambiar'
  const [modo, setModo] = useState('login');
  const [email, setEmail] = useState('');
  const [nombrePiloto, setNombrePiloto] = useState('');
  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    const emailNormalizado = email.trim().toLowerCase();
    if (!emailNormalizado) return;

    setCargando(true);

    try {
      if (modo === 'login') {
        const { data, error } = await api.login(emailNormalizado, password);
        if (error || !data?.user) {
          alert(error?.message || 'Correo o contraseña incorrectos.');
          setCargando(false);
          return;
        }

        if (onLoginExitoso) {
          onLoginExitoso({
            id: data.user.id,
            email: data.user.email || emailNormalizado,
            isAdmin: Boolean(data.isAdmin)
          });
        }
        onClose();
        return;
      }

      const { data: existentes, error: errBuscar } = await api.from('perfiles').select({
        eq_email: emailNormalizado
      });
      if (errBuscar) throw errBuscar;

      const piloto = Array.isArray(existentes) && existentes.length > 0 ? existentes[0] : null;

      if (modo === 'registro') {
        if (password.length < 6) {
          alert('La contraseña debe tener al menos 6 caracteres.');
          setCargando(false);
          return;
        }
        if (password !== confirmarPassword) {
          alert('Las contraseñas no coinciden.');
          setCargando(false);
          return;
        }
        if (piloto) {
          alert('Ya existe un perfil registrado con ese correo. Iniciá sesión o usá "Cambiar clave".');
          setModo('login');
          setCargando(false);
          return;
        }

        const hash = await hashearPassword(password);
        const idNuevo = crypto.randomUUID();

        const { data: creado, error } = await api.from('perfiles').insert({
          id: idNuevo,
          email: emailNormalizado,
          nombre_piloto: (nombrePiloto || emailNormalizado.split('@')[0]).trim(),
          password_hash: hash
        });
        if (error) throw error;

        // Intentamos iniciar sesión en el Worker para obtener el adminToken si corresponde
        const loginResp = await api.login(emailNormalizado, password);
        const cuenta = loginResp?.data?.user || creado || { id: idNuevo, email: emailNormalizado };

        if (onLoginExitoso) {
          onLoginExitoso({
            id: cuenta.id,
            email: emailNormalizado,
            isAdmin: Boolean(loginResp?.data?.isAdmin)
          });
        }
        alert('¡Cuenta creada con éxito! Ya iniciaste sesión.');
        onClose();
      } else if (modo === 'cambiar') {
        if (!piloto) {
          alert('No existe una cuenta registrada con ese correo.');
          setCargando(false);
          return;
        }
        if (nuevaPassword.length < 6) {
          alert('La nueva contraseña debe tener al menos 6 caracteres.');
          setCargando(false);
          return;
        }

        // Validamos la contraseña actual contra el Worker antes de cambiarla
        const checkLogin = await api.login(emailNormalizado, password);
        if (checkLogin.error || !checkLogin.data?.user) {
          alert('La contraseña actual no es correcta.');
          setCargando(false);
          return;
        }

        const nuevoHash = await hashearPassword(nuevaPassword);
        const { error } = await api.from('perfiles').update(
          { password_hash: nuevoHash },
          { eq_id: piloto.id }
        );
        if (error) throw error;

        api.logout();
        alert('¡Contraseña actualizada con éxito! Ahora iniciá sesión con tu nueva clave.');
        setPassword('');
        setNuevaPassword('');
        setModo('login');
      }
    } catch (err) {
      alert('Error en la autenticación: ' + (err.message || 'Error desconocido'));
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="bg-neutral-900 border border-[#38bdf8]/40 rounded-3xl p-8 max-w-md w-full shadow-2xl relative font-sans">
        <h2 className="font-wrc text-2xl font-black text-[#38bdf8] mb-2 uppercase tracking-wide">
          {modo === 'registro' && 'Crear Cuenta de Piloto'}
          {modo === 'login' && 'Acceso Pilotos'}
          {modo === 'cambiar' && 'Cambiar Contraseña'}
        </h2>

        <p className="text-neutral-400 text-xs mb-6 font-sans">
          {modo === 'registro' && 'Registrate con tu correo y contraseña para competir.'}
          {modo === 'login' && 'Ingresá con tu correo y contraseña.'}
          {modo === 'cambiar' && 'Ingresá tu correo, tu clave actual y la nueva contraseña.'}
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">Correo Electrónico</label>
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:border-[#38bdf8] outline-none"
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
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:border-[#38bdf8] outline-none"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">
              {modo === 'cambiar' ? 'Contraseña Actual' : 'Contraseña'}
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:border-[#38bdf8] outline-none"
              required
            />
          </div>

          {modo === 'registro' && (
            <div>
              <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">Confirmar Contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:border-[#38bdf8] outline-none"
                required
              />
            </div>
          )}

          {modo === 'cambiar' && (
            <div>
              <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">Nueva Contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:border-[#38bdf8] outline-none"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-[#38bdf8] hover:bg-[#7dd3fc] text-slate-950 font-wrc font-black text-base uppercase py-3 rounded-xl transition shadow-lg shadow-[#38bdf8]/20 tracking-wider mt-2 cursor-pointer"
          >
            {cargando
              ? 'Procesando...'
              : modo === 'registro'
                ? 'Crear Cuenta'
                : modo === 'login'
                  ? 'Iniciar Sesión'
                  : 'Actualizar Contraseña'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-neutral-800 flex flex-wrap justify-between items-center gap-2 text-xs">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setModo(modo === 'login' ? 'registro' : 'login')}
              className="text-[#38bdf8] hover:underline font-medium cursor-pointer"
            >
              {modo === 'login' ? 'Crear cuenta' : 'Iniciar sesión'}
            </button>
            {modo !== 'cambiar' && (
              <button
                type="button"
                onClick={() => setModo('cambiar')}
                className="text-neutral-300 hover:text-white hover:underline cursor-pointer"
              >
                Cambiar clave
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-500 hover:text-white cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}