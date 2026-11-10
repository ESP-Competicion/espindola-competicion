import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [tab, setTab] = useState('tiempos');
  const [autoSeleccionado, setAutoSeleccionado] = useState('Peugeot 208 Rally4');
  
  // Modales
  const [mostrarAuthModal, setMostrarAuthModal] = useState(false);
  const [esRegistro, setEsRegistro] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombrePiloto, setNombrePiloto] = useState('');
  
  // Datos
  const [inscripciones, setInscripciones] = useState([]);

  // Detectar sesión al cargar
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUsuario(session?.user ?? null);
      if (session?.user) cargarPerfil(session.user.id);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUsuario(session?.user ?? null);
      if (session?.user) cargarPerfil(session.user.id);
      else setPerfil(null);
    });

    cargarInscripciones();

    return () => listener.subscription.unsubscribe();
  }, []);

  const cargarPerfil = async (userId) => {
    const { data } = await supabase.from('perfiles').select('*').eq('id', userId).single();
    if (data) setPerfil(data);
  };

  const cargarInscripciones = async () => {
    const { data } = await supabase.from('inscripciones').select('*');
    if (data) setInscripciones(data);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (esRegistro) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return alert("Error al registrar: " + error.message);
      if (data.user) {
        await supabase.from('perfiles').insert([{ id: data.user.id, nombre_piloto: nombrePiloto }]);
        alert("¡Cuenta creada! Ya podés iniciar sesión.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return alert("Error de inicio de sesión: " + error.message);
    }
    setMostrarAuthModal(false);
    setEmail('');
    setPassword('');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleInscripcion = async (campeonato) => {
    if (!usuario) {
      setEsRegistro(false);
      setMostrarAuthModal(true);
      return;
    }

    const { error } = await supabase.from('inscripciones').insert([
      {
        user_id: usuario.id,
        nombre_piloto: perfil?.nombre_piloto || usuario.email,
        auto: autoSeleccionado,
        campeonato: campeonato
      }
    ]);

    if (error) {
      alert("Error al inscribirse: " + error.message);
    } else {
      alert(`¡Inscripción confirmada para ${campeonato}!`);
      cargarInscripciones();
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans relative overflow-x-hidden">
      {/* Header */}
      <header className="relative z-10 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-md px-6 py-4 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center text-black font-black text-xl">
            E
          </div>
          <h1 className="text-xl font-black tracking-wider uppercase text-amber-500">
            Espíndola Competición
          </h1>
        </div>

        {/* Menú de Navegación */}
        <nav className="flex gap-2">
          <button 
            onClick={() => setTab('tiempos')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === 'tiempos' ? 'bg-amber-500 text-black' : 'hover:bg-neutral-800'}`}
          >
            Tiempos en Vivo
          </button>
          <button 
            onClick={() => setTab('campeonatos')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === 'campeonatos' ? 'bg-amber-500 text-black' : 'hover:bg-neutral-800'}`}
          >
            Campeonatos
          </button>
        </nav>

        {/* Zona de Usuario */}
        <div>
          {usuario ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-neutral-300">
                🏎️ {perfil?.nombre_piloto || usuario.email}
              </span>
              <button 
                onClick={handleLogout}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs text-red-400 rounded-md border border-neutral-700 transition"
              >
                Cerrar Sesión
              </button>
            </div>
          ) : (
            <button 
              onClick={() => { setEsRegistro(false); setMostrarAuthModal(true); }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-lg transition"
            >
              Iniciar Sesión / Registrarse
            </button>
          )}
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="relative z-10 max-w-6xl mx-auto p-6">
        {tab === 'tiempos' && (
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-amber-500 uppercase tracking-wide">Clasificación en Tiempo Real</h2>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Servidor Oficial Online
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-800/50 text-neutral-400 uppercase text-xs border-b border-neutral-700">
                  <tr>
                    <th className="p-3">Pos</th>
                    <th className="p-3">Piloto</th>
                    <th className="p-3">Vehículo</th>
                    <th className="p-3">Tiempo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  <tr className="hover:bg-neutral-800/30">
                    <td className="p-3 font-bold text-amber-500">1</td>
                    <td className="p-3 font-semibold">Lucas Negri</td>
                    <td className="p-3 text-neutral-400">Renault Clio Rally5</td>
                    <td className="p-3 font-mono text-emerald-400">03:42.103</td>
                  </tr>
                  <tr className="hover:bg-neutral-800/30">
                    <td className="p-3 font-bold text-amber-500">2</td>
                    <td className="p-3 font-semibold">Pedro Laninha</td>
                    <td className="p-3 text-neutral-400">Peugeot 208 Rally4</td>
                    <td className="p-3 font-mono text-emerald-400">03:44.890</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'campeonatos' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase text-amber-500 tracking-wider">Fecha Activa</span>
                <h3 className="text-xl font-black mt-1 mb-2">MIT CUP Virtual 2026</h3>
                <p className="text-neutral-400 text-sm mb-4">Etapa 4: Caminos de Misiones (Gravel / Tierra).</p>
                
                <label className="block text-xs font-semibold text-neutral-400 mb-2">Seleccioná tu auto:</label>
                <select 
                  value={autoSeleccionado}
                  onChange={(e) => setAutoSeleccionado(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-sm text-white mb-4 focus:outline-none focus:border-amber-500"
                >
                  <option value="Peugeot 208 Rally4">Peugeot 208 Rally4</option>
                  <option value="Renault Clio Rally5">Renault Clio Rally5</option>
                </select>
              </div>

              <button 
                onClick={() => handleInscripcion('MIT CUP Virtual 2026')}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm uppercase rounded-lg transition"
              >
                Inscribirme a la Fecha
              </button>
            </div>

            {/* Inscriptos Confirmados */}
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-amber-500 mb-4">Pilotos Inscriptos ({inscripciones.length})</h3>
              {inscripciones.length === 0 ? (
                <p className="text-sm text-neutral-500">Aún no hay inscriptos confirmados para esta fecha.</p>
              ) : (
                <ul className="space-y-2">
                  {inscripciones.map((item) => (
                    <li key={item.id} className="bg-neutral-800/50 p-3 rounded-lg border border-neutral-700/50 flex justify-between items-center text-sm">
                      <span className="font-semibold">{item.nombre_piloto}</span>
                      <span className="text-xs text-neutral-400 bg-neutral-700 px-2 py-1 rounded">{item.auto}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal Login / Registro */}
      {mostrarAuthModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 max-w-md w-full relative">
            <button 
              onClick={() => setMostrarAuthModal(false)}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white"
            >
              ✕
            </button>
            <h3 className="text-xl font-bold mb-4 text-amber-500">
              {esRegistro ? 'Registro de Piloto' : 'Iniciar Sesión'}
            </h3>
            
            <form onSubmit={handleAuth} className="space-y-4">
              {esRegistro && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">Nombre / Seudónimo de Piloto</label>
                  <input 
                    type="text" 
                    required 
                    value={nombrePiloto}
                    onChange={(e) => setNombrePiloto(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-amber-500" 
                    placeholder="Ej. Lucas Negri"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Email</label>
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-amber-500" 
                  placeholder="piloto@espindola.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Contraseña</label>
                <input 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-amber-500" 
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm uppercase rounded-lg transition"
              >
                {esRegistro ? 'Crear Cuenta' : 'Ingresar'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button 
                onClick={() => setEsRegistro(!esRegistro)}
                className="text-xs text-neutral-400 hover:text-amber-500 underline"
              >
                {esRegistro ? '¿Ya tenés cuenta? Iniciá sesión' : '¿No tenés cuenta? Registrate como piloto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
