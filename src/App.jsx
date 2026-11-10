import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Navbar from './Navbar';
import PerfilModal from './PerfilModal';

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [mostrarPerfilModal, setMostrarPerfilModal] = useState(false);
  const [pestanaActiva, setPestanaActiva] = useState('livetiming');

  // Estados para Eventos y Admin
  const [eventos, setEventos] = useState([
    { id: 1, titulo: 'Rally de Misiones - Fecha 1', fecha: '2026-04-12', circuito: 'Tramo Tierra Colorada', inscriptos: 12 },
    { id: 2, titulo: 'Desafío Asfalto Neuquén', fecha: '2026-04-28', circuito: 'Autovía Norte', inscriptos: 8 }
  ]);
  const [nuevoEvento, setNuevoEvento] = useState({ titulo: '', fecha: '', circuito: '' });
  const [esAdmin, setEsAdmin] = useState(false);

  // Cargar usuario actual y su perfil vinculado
  useEffect(() => {
    async function obtenerDatosSesion() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUsuario(session.user);
        cargarPerfil(session.user.id);
      }
    }

    obtenerDatosSesion();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUsuario(session?.user || null);
      if (session?.user) {
        cargarPerfil(session.user.id);
      } else {
        setPerfil(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function cargarPerfil(userId) {
    const { data, error } = await supabase
      .from('perfiles')
      .select('nombre_piloto, steam_id, nacionalidad, avatar_url')
      .eq('id', userId)
      .single();

    if (data) {
      setPerfil(data);
      if (usuario?.email === 'leosimracingok@gmail.com') {
        setEsAdmin(true);
      }
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleCrearEvento = (e) => {
    e.preventDefault();
    if (!nuevoEvento.titulo || !nuevoEvento.fecha) return;
    setEventos([...eventos, { id: Date.now(), ...nuevoEvento, inscriptos: 0 }]);
    setNuevoEvento({ titulo: '', fecha: '', circuito: '' });
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans relative overflow-x-hidden selection:bg-sky-500 selection:text-black">
      
      {/* Fondo con detalles sutiles estilo WRC / Competición */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))] pointer-events-none"></div>

      {/* Barra de Navegación Superior */}
      <Navbar 
        usuario={usuario} 
        perfil={perfil} 
        onOpenPerfil={() => setMostrarPerfilModal(true)} 
        onLogout={handleLogout}
      />

      {/* Menú de Pestañas Interactivas */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center justify-center gap-3 p-2 bg-neutral-900/60 backdrop-blur-md border border-amber-500/30 rounded-2xl shadow-2xl">
          <button
            onClick={() => setPestanaActiva('livetiming')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm tracking-wider uppercase transition-all duration-300 ${
              pestanaActiva === 'livetiming'
                ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-black shadow-lg shadow-sky-500/20 border border-sky-400'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            🏁 Live Timing
          </button>
          
          <button
            onClick={() => setPestanaActiva('eventos')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm tracking-wider uppercase transition-all duration-300 ${
              pestanaActiva === 'eventos'
                ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-black shadow-lg shadow-sky-500/20 border border-sky-400'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            📅 Eventos & Inscripciones
          </button>

          <button
            onClick={() => setPestanaActiva('fama')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm tracking-wider uppercase transition-all duration-300 ${
              pestanaActiva === 'fama'
                ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-black shadow-lg shadow-sky-500/20 border border-sky-400'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            🏆 Salón de la Fama
          </button>

          <button
            onClick={() => setPestanaActiva('perfil')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm tracking-wider uppercase transition-all duration-300 ${
              pestanaActiva === 'perfil'
                ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-black shadow-lg shadow-sky-500/20 border border-sky-400'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            👤 Mi Perfil
          </button>
        </div>

        {/* CONTENIDO DE LAS PESTAÑAS */}
        <main className="mt-8">
          
          {/* 1. LIVETIMING (Interfaz Propia con Tabla y Mapa del Tramo) */}
          {pestanaActiva === 'livetiming' && (
            <div className="space-y-6">
              <div className="bg-neutral-900/60 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
                
                {/* Cabecera */}
                <div className="flex flex-wrap justify-between items-center mb-6 border-b border-neutral-800 pb-4 gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-amber-400 uppercase tracking-wide">Live Timing & Telemetría - Espíndola Competición</h2>
                    <p className="text-neutral-400 text-sm">Servidor Activo: <span className="text-sky-400 font-mono">AssettoHosting - Servidor Oficial WRC</span></p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3.5 py-1.5 rounded-full text-xs font-bold border border-emerald-500/30">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span> Servidor Online
                    </span>
                    <button 
                      onClick={() => alert('Sincronizando con API de servidor...')} 
                      className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-neutral-700 transition"
                    >
                      🔄 Actualizar
                    </button>
                  </div>
                </div>

                {/* Grid principal: Tabla de Tiempos + Mapa del Tramo Actual */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Tabla de Posiciones y Pilotos en Pista (Ocupa 2 columnas) */}
                  <div className="lg:col-span-2 overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-950/70 shadow-inner">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-neutral-800 text-xs font-bold text-neutral-400 uppercase bg-neutral-900/50">
                          <th className="py-3 px-4">Pos</th>
                          <th className="py-3 px-4">Piloto</th>
                          <th className="py-3 px-4">Vehículo</th>
                          <th className="py-3 px-4">Mejor Vuelta</th>
                          <th className="py-3 px-4">Gap</th>
                          <th className="py-3 px-4 text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-900 text-sm font-medium">
                        <tr className="hover:bg-neutral-900/40 transition">
                          <td className="py-3 px-4 font-black text-amber-400">1</td>
                          <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                            <span className="text-xs">🇦🇷</span> Lucas Negri
                          </td>
                          <td className="py-3 px-4 text-neutral-300">Renault Clio Rally5</td>
                          <td className="py-3 px-4 font-mono text-sky-400">03:42.125</td>
                          <td className="py-3 px-4 font-mono text-neutral-400">Líder</td>
                          <td className="py-3 px-4 text-center">
                            <span className="bg-sky-500/10 text-sky-400 border border-sky-500/30 text-xs px-2.5 py-1 rounded-lg">En Pista</span>
                          </td>
                        </tr>
                        <tr className="hover:bg-neutral-900/40 transition">
                          <td className="py-3 px-4 font-black text-neutral-300">2</td>
                          <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                            <span className="text-xs">🇧🇷</span> Pedro Laninha
                          </td>
                          <td className="py-3 px-4 text-neutral-300">Peugeot 208 Rally4</td>
                          <td className="py-3 px-4 font-mono text-sky-400">03:43.890</td>
                          <td className="py-3 px-4 font-mono text-amber-500">+1.765</td>
                          <td className="py-3 px-4 text-center">
                            <span className="bg-sky-500/10 text-sky-400 border border-sky-500/30 text-xs px-2.5 py-1 rounded-lg">En Pista</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Panel Lateral: Mapa del Tramo Actual / Telemetría */}
                  <div className="bg-neutral-950/80 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between shadow-inner">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-black text-amber-400 uppercase tracking-wider">Tramo en Curso</h3>
                        <span className="text-xs font-mono text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded border border-sky-500/20">Stage 3</span>
                      </div>
                      <p className="text-xs text-neutral-400 mb-4">Rally de Misiones - Tierra Colorada (Gravel)</p>
                      
                      {/* Simulación del Mapa del Tramo / Radar */}
                      <div className="w-full h-48 bg-neutral-900 rounded-xl border border-neutral-800 relative flex items-center justify-center overflow-hidden shadow-inner group">
                        <div className="absolute inset-0 bg-[radial-gradient(#0ea5e9_1px,transparent_1px)] [background-size:16px_16px] opacity-20"></div>
                        
                        {/* Línea simulada del circuito */}
                        <svg className="w-full h-full p-4 absolute inset-0 text-amber-500/60" viewBox="0 0 100 100" fill="none">
                          <path d="M10 80 Q 30 20, 60 50 T 90 20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>

                        {/* Indicadores de posición de autos en tiempo real */}
                        <div className="absolute top-[35%] left-[55%] flex items-center gap-1 bg-neutral-950/90 px-2 py-1 rounded border border-sky-500 text-[10px] font-mono text-sky-400 shadow-lg">
                          <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span> Lucas N.
                        </div>

                        <div className="absolute bottom-[25%] left-[25%] flex items-center gap-1 bg-neutral-950/90 px-2 py-1 rounded border border-amber-500 text-[10px] font-mono text-amber-400">
                          <span>🚗</span> Pedro L.
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-neutral-900 text-xs text-neutral-400 flex justify-between items-center">
                      <span>Condición Clima: <strong className="text-white">Seco / Tierra</strong></span>
                      <span className="font-mono text-amber-400">Temp: 24°C</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* 2. EVENTOS & INSCRIPCIONES */}
          {pestanaActiva === 'eventos' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-amber-400 uppercase tracking-wide">Próximos Eventos y Rallies</h2>
                  <p className="text-neutral-400 text-sm">Inscribite a las fechas oficiales del campeonato.</p>
                </div>
                {esAdmin && (
                  <span className="bg-amber-500/20 text-amber-400 text-xs font-bold px-3 py-1.5 rounded-lg border border-amber-500/40">
                    Modo Administrador Activo
                  </span>
                )}
              </div>

              {esAdmin && (
                <div className="bg-neutral-900/60 backdrop-blur-md border border-amber-500/40 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-lg font-bold text-amber-400 mb-4 uppercase tracking-wider">Crear Nueva Fecha de Campeonato</h3>
                  <form onSubmit={handleCrearEvento} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input 
                      type="text" 
                      placeholder="Nombre del Rally / Evento" 
                      value={nuevoEvento.titulo}
                      onChange={(e) => setNuevoEvento({...nuevoEvento, titulo: e.target.value})}
                      className="bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-sky-500 outline-none"
                    />
                    <input 
                      type="date" 
                      value={nuevoEvento.fecha}
                      onChange={(e) => setNuevoEvento({...nuevoEvento, fecha: e.target.value})}
                      className="bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-sky-500 outline-none"
                    />
                    <input 
                      type="text" 
                      placeholder="Nombre del Tramo / Circuito" 
                      value={nuevoEvento.circuito}
                      onChange={(e) => setNuevoEvento({...nuevoEvento, circuito: e.target.value})}
                      className="bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-sky-500 outline-none"
                    />
                    <button 
                      type="submit"
                      className="bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-sm rounded-xl py-2.5 transition shadow-lg shadow-amber-500/20"
                    >
                      Publicar Evento
                    </button>
                  </form>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {eventos.map((ev) => (
                  <div key={ev.id} className="bg-neutral-900/40 backdrop-blur-xl border border-neutral-800 rounded-2xl p-6 hover:border-sky-500/50 transition shadow-lg relative group">
                    <div className="absolute top-4 right-4 text-sky-400 font-mono text-xs bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">
                      {ev.fecha}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-400 transition">{ev.titulo}</h3>
                    <p className="text-neutral-400 text-sm mb-4">📍 Tramo: <span className="text-white font-medium">{ev.circuito}</span></p>
                    <div className="flex justify-between items-center pt-4 border-t border-neutral-800">
                      <span className="text-xs text-neutral-400 font-medium">Pilotos Inscriptos: <strong className="text-amber-400">{ev.inscriptos}</strong></span>
                      <button 
                        onClick={() => alert(`¡Te has inscripto exitosamente a ${ev.titulo}!`)}
                        className="bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs uppercase px-4 py-2 rounded-xl transition shadow-md"
                      >
                        Inscribirse Ahora
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. SALÓN DE LA FAMA */}
          {pestanaActiva === 'fama' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-amber-400 uppercase tracking-wide">Salón de la Fama - Espindola Competición</h2>
                <p className="text-neutral-400 text-sm">Historial de títulos, podios y campeonatos obtenidos por nuestros pilotos.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-b from-neutral-900/80 to-neutral-950 border border-amber-500/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-amber-500 text-black font-black text-xs px-4 py-1 rounded-bl-xl">CAMPEÓN 2026</div>
                  <div className="text-4xl mb-3">🥇</div>
                  <h3 className="text-lg font-bold text-white">MIT CUP Championship</h3>
                  <p className="text-amber-400 text-sm font-semibold mt-1">Piloto: Lucas Negri</p>
                  <p className="text-neutral-400 text-xs mt-3">Categoría Rally4 - Renault Clio Rally5</p>
                </div>

                <div className="bg-gradient-to-b from-neutral-900/80 to-neutral-950 border border-neutral-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-sky-500/20 text-sky-400 font-bold text-xs px-4 py-1 rounded-bl-xl border-l border-b border-sky-500/30">PODIO</div>
                  <div className="text-4xl mb-3">🥉</div>
                  <h3 className="text-lg font-bold text-white">SIMRALLY Series</h3>
                  <p className="text-amber-400 text-sm font-semibold mt-1">Piloto: Pedro Laninha</p>
                  <p className="text-neutral-400 text-xs mt-3">Categoría Rally2 - Peugeot 208</p>
                </div>

                <div className="bg-gradient-to-b from-neutral-900/80 to-neutral-950 border border-neutral-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-neutral-800 text-neutral-300 font-bold text-xs px-4 py-1 rounded-bl-xl">TOP 2 MUNDIAL</div>
                  <div className="text-4xl mb-3">🌍</div>
                  <h3 className="text-lg font-bold text-white">Greece Gravel Challenge</h3>
                  <p className="text-amber-400 text-sm font-semibold mt-1">Equipo Espíndola</p>
                  <p className="text-neutral-400 text-xs mt-3">Setup por defecto - Etapa extrema</p>
                </div>
              </div>
            </div>
          )}

          {/* 4. MI PERFIL */}
          {pestanaActiva === 'perfil' && (
            <div className="max-w-2xl mx-auto bg-neutral-900/60 backdrop-blur-2xl border border-amber-500/30 rounded-3xl p-8 shadow-2xl">
              <div className="flex flex-col items-center text-center pb-6 border-b border-neutral-800">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sky-400 to-amber-500 p-1 mb-4 shadow-xl">
                  <div className="w-full h-full bg-neutral-950 rounded-full flex items-center justify-center overflow-hidden text-2xl font-black text-amber-400">
                    {perfil?.avatar_url ? (
                      <img src={perfil.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      perfil?.nombre_piloto ? perfil.nombre_piloto.charAt(0).toUpperCase() : 'E'
                    )}
                  </div>
                </div>
                <h2 className="text-2xl font-black text-white">{perfil?.nombre_piloto || 'Piloto sin configurar'}</h2>
                <p className="text-sky-400 text-sm font-mono mt-1">{usuario?.email}</p>
                <span className="mt-3 bg-neutral-800 text-neutral-300 px-4 py-1 rounded-full text-xs font-semibold border border-neutral-700">
                  Nacionalidad: {perfil?.nacionalidad || 'No especificada'}
                </span>
              </div>

              <div className="py-6 space-y-4">
                <div className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-4 flex justify-between items-center">
                  <span className="text-neutral-400 text-sm">Steam ID 64:</span>
                  <span className="font-mono text-amber-400 text-sm">{perfil?.steam_id || 'No vinculado'}</span>
                </div>
                <div className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-4 flex justify-between items-center">
                  <span className="text-neutral-400 text-sm">Estado de Licencia:</span>
                  <span className="text-emerald-400 text-sm font-bold">Activa 🟢</span>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  onClick={() => setMostrarPerfilModal(true)}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black uppercase text-sm py-3 rounded-xl transition shadow-lg shadow-amber-500/20"
                >
                  Editar Datos y Foto de Perfil
                </button>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Modal de edición de perfil */}
      {mostrarPerfilModal && (
        <PerfilModal 
          usuario={usuario} 
          onClose={() => setMostrarPerfilModal(false)} 
          onPerfilGuardado={() => cargarPerfil(usuario.id)}
        />
      )}
    </div>
  );
}
