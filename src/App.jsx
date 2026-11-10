import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import PerfilModal from './PerfilModal';

// Tus 4 fotos personalizadas de rally con mayor tiempo de transición
const fotosRally = [
  'https://files.catbox.moe/t5ffu8.png',
  'https://files.catbox.moe/pfh5gw.png',
  'https://files.catbox.moe/t5ffu8.png',
  'https://files.catbox.moe/jtgf56.png'
];

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [mostrarPerfilModal, setMostrarPerfilModal] = useState(false);
  const [pestanaActiva, setPestanaActiva] = useState('inicio');
  const [esAdmin, setEsAdmin] = useState(false);

  // Carrusel configurado a 9 segundos por foto y mayor visibilidad
  const [fondoActual, setFondoActual] = useState(0);
  const [eventos, setEventos] = useState([
    { id: 1, titulo: 'Rally de Misiones - Fecha 1', fecha: '2026-04-12', circuito: 'Tramo Tierra Colorada', inscriptos: 12 },
    { id: 2, titulo: 'Desafío Asfalto Neuquén', fecha: '2026-04-28', circuito: 'Autovía Norte', inscriptos: 8 }
  ]);
  const [nuevoEvento, setNuevoEvento] = useState({ titulo: '', fecha: '', circuito: '' });

  useEffect(() => {
    const intervaloFondo = setInterval(() => {
      setFondoActual((prev) => (prev + 1) % fotosRally.length);
    }, 9000); // 9 segundos por imagen
    return () => clearInterval(intervaloFondo);
  }, []);

  useEffect(() => {
    async function obtenerDatosSesion() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUsuario(session.user);
        verificarAdminYPerfil(session.user);
      }
    }

    obtenerDatosSesion();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUsuario(session?.user || null);
      if (session?.user) {
        verificarAdminYPerfil(session.user);
      } else {
        setPerfil(null);
        setEsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function verificarAdminYPerfil(user) {
    if (user.email === 'leosimracingok@gmail.com') {
      setEsAdmin(true);
    }

    const { data, error } = await supabase
      .from('perfiles')
      .select('nombre_piloto, steam_id, nacionalidad, avatar_url')
      .eq('id', user.id)
      .single();

    if (data) {
      setPerfil(data);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleCrearEvento = (e) => {
    e.preventDefault();
    if (!nuevoEvento.titulo || !nuevoEvento.fecha || !nuevoEvento.circuito) return;
    
    const eventoCreado = {
      id: Date.now(),
      titulo: nuevoEvento.titulo,
      fecha: nuevoEvento.fecha,
      circuito: nuevoEvento.circuito,
      inscriptos: 0
    };

    setEventos([eventoCreado, ...eventos]);
    setNuevoEvento({ titulo: '', fecha: '', circuito: '' });
  };

  const handleEliminarEvento = (id) => {
    setEventos(eventos.filter(ev => ev.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans relative overflow-x-hidden selection:bg-amber-500 selection:text-black">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,800;0,900;1,700&display=swap');
        
        .font-wrc {
          font-family: 'Barlow Condensed', sans-serif !important;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          font-weight: 800;
        }
      `}</style>

      {/* ENCABEZADO TRANSLÚCIDO ESTILO WRC */}
      <header 
        className="sticky top-0 z-50 backdrop-blur-md border-b border-white/10 px-6 py-3.5 shadow-xl"
        style={{ backgroundColor: 'rgba(5, 5, 5, 0.35)' }}
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setPestanaActiva('inicio')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center font-wrc font-black text-black text-xl shadow-lg shadow-amber-500/20 group-hover:scale-105 transition">
              E
            </div>
            <div>
              <h1 className="font-wrc text-xl font-black tracking-wider text-white">ESPÍNDOLA <span className="text-amber-400">COMPETICIÓN</span></h1>
              <p className="text-[10px] tracking-widest text-neutral-400 font-mono uppercase">Official WRC Hub {esAdmin && '• [ADMIN]'}</p>
            </div>
          </div>

          <nav className="flex items-center gap-1 p-1.5 rounded-full border border-white/10 shadow-inner overflow-x-auto" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
            <button
              onClick={() => setPestanaActiva('inicio')}
              className={`px-5 py-2 rounded-full font-wrc text-sm tracking-wider transition-all ${
                pestanaActiva === 'inicio' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30' : 'text-neutral-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Inicio
            </button>
            <button
              onClick={() => setPestanaActiva('livetiming')}
              className={`px-5 py-2 rounded-full font-wrc text-sm tracking-wider transition-all ${
                pestanaActiva === 'livetiming' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30' : 'text-neutral-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Live Timing
            </button>
            <button
              onClick={() => setPestanaActiva('eventos')}
              className={`px-5 py-2 rounded-full font-wrc text-sm tracking-wider transition-all ${
                pestanaActiva === 'eventos' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30' : 'text-neutral-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Eventos {esAdmin && '⚙️'}
            </button>
            <button
              onClick={() => setPestanaActiva('fama')}
              className={`px-5 py-2 rounded-full font-wrc text-sm tracking-wider transition-all ${
                pestanaActiva === 'fama' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30' : 'text-neutral-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Salón de la Fama
            </button>
          </nav>

          <div className="flex items-center gap-3">
            {usuario ? (
              <div className="flex items-center gap-3 border border-white/10 px-4 py-1.5 rounded-2xl shadow-inner" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                <button 
                  onClick={() => setMostrarPerfilModal(true)}
                  className="flex items-center gap-2 text-left group"
                >
                  <div className="w-8 h-8 rounded-full bg-neutral-800 border border-amber-500/50 flex items-center justify-center overflow-hidden font-wrc font-bold text-amber-400 text-xs">
                    {perfil?.avatar_url ? (
                      <img src={perfil.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      perfil?.nombre_piloto ? perfil.nombre_piloto.charAt(0).toUpperCase() : 'E'
                    )}
                  </div>
                  <span className="font-wrc text-sm tracking-wide text-neutral-200 group-hover:text-amber-400 transition">
                    {perfil?.nombre_piloto || usuario.email.split('@')[0]}
                  </span>
                </button>
                <button 
                  onClick={handleLogout}
                  className="font-wrc text-xs tracking-wider text-neutral-400 hover:text-red-400 transition pl-2 border-l border-white/10"
                  title="Cerrar sesión"
                >
                  Salir
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setMostrarPerfilModal(true)}
                className="bg-amber-500 hover:bg-amber-400 text-black font-wrc text-sm px-5 py-2.5 rounded-xl transition shadow-lg shadow-amber-500/20 tracking-wider"
              >
                Acceder / Registrarse
              </button>
            )}
          </div>

        </div>
      </header>

      {/* HERO SECTION CON FOTOS DE RALLY MÁS CLARAS Y LENTAS */}
      {pestanaActiva === 'inicio' && (
        <div className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
          {fotosRally.map((foto, index) => (
            <div
              key={index}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
                index === fondoActual ? 'opacity-85 scale-105' : 'opacity-0 scale-100'
              }`}
              style={{ backgroundImage: `url(${foto})` }}
            />
          ))}

          {/* Capas oscuras reducidas para que las fotos resalten mucho más */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/40 via-transparent to-[#050505]/40"></div>

          <div className="relative z-10 max-w-5xl mx-auto px-6 text-center space-y-6 py-20">
            <span className="inline-block bg-amber-500/20 text-amber-400 font-wrc text-sm tracking-widest px-4 py-1.5 rounded-full border border-amber-500/40 uppercase backdrop-blur-md">
              Temporada Oficial 2026 • Simracing Rally Hub {esAdmin && '• Panel Admin Activo'}
            </span>

            <h1 className="font-wrc text-6xl md:text-8xl font-black tracking-tight text-white uppercase drop-shadow-[0_4px_15px_rgba(0,0,0,0.9)]">
              PRECISIÓN, VELOCIDAD Y <span className="text-amber-400 drop-shadow-[0_0_25px_rgba(251,191,36,0.6)]">GLORIA</span>
            </h1>

            <p className="max-w-2xl mx-auto text-neutral-200 text-base md:text-lg font-medium leading-relaxed font-sans drop-shadow-md">
              Bienvenido al portal oficial de Espíndola Competición. Telemetría en vivo, campeonatos de rally de alta exigencia y gestión centralizada.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <button
                onClick={() => setPestanaActiva('livetiming')}
                className="bg-amber-500 hover:bg-amber-400 text-black font-wrc text-lg px-8 py-3.5 rounded-xl uppercase tracking-wider transition shadow-lg shadow-amber-500/30"
              >
                🏁 Ver Live Timing
              </button>
              <button
                onClick={() => setPestanaActiva('eventos')}
                className="bg-neutral-950/60 backdrop-blur-md hover:bg-neutral-900 text-white border border-white/20 font-wrc text-lg px-8 py-3.5 rounded-xl uppercase tracking-wider transition shadow-lg"
              >
                📅 Gestionar Eventos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO DE LAS PESTAÑAS */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        
        {/* 1. LIVETIMING */}
        {pestanaActiva === 'livetiming' && (
          <div className="space-y-6">
            <div className="bg-neutral-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="flex flex-wrap justify-between items-center mb-6 border-b border-neutral-800 pb-4 gap-4">
                <div>
                  <h2 className="font-wrc text-3xl text-amber-400 tracking-wide">Live Timing & Telemetría - Servidor Oficial</h2>
                  <p className="text-neutral-400 text-sm font-sans">Monitoreo en tiempo real de tramos y clasificaciones.</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3.5 py-1.5 rounded-full text-xs font-bold border border-emerald-500/30">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span> Servidor Online
                  </span>
                  <a 
                    href="https://br.assettohosting.com:10314/live-timing" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-wrc bg-neutral-800 hover:bg-neutral-700 text-amber-400 text-sm tracking-wider px-4 py-2 rounded-xl border border-white/10 transition flex items-center gap-1.5 shadow-md"
                  >
                    <span>↗</span> Pantalla Completa
                  </a>
                </div>
              </div>

              <div className="w-full h-[650px] bg-neutral-950 rounded-2xl border border-neutral-800 relative overflow-hidden shadow-inner">
                <iframe 
                  src="https://br.assettohosting.com:10314/live-timing" 
                  title="Espíndola Competición Live Timing"
                  className="w-full h-full border-0 rounded-2xl"
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. EVENTOS & PANEL DE ADMINISTRACIÓN */}
        {pestanaActiva === 'eventos' && (
          <div className="space-y-8">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <h2 className="font-wrc text-4xl text-amber-400 tracking-wide">Próximos Eventos y Rallies</h2>
                <p className="text-neutral-400 text-sm font-sans">Inscribite a las fechas oficiales o administra el calendario.</p>
              </div>
              {esAdmin ? (
                <span className="font-wrc bg-amber-500 text-black text-xs tracking-wider font-extrabold px-4 py-2 rounded-xl shadow-lg">
                  ⚙️ Modo Administrador Activo
                </span>
              ) : (
                <span className="text-xs text-neutral-400 font-mono">
                  Inicia sesión como {`leosimracingok@gmail.com`} para crear eventos.
                </span>
              )}
            </div>

            {/* PANEL DE CREACIÓN DE EVENTOS (SOLO ADMIN) */}
            {esAdmin && (
              <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-950 border border-amber-500/50 rounded-2xl p-6 shadow-2xl relative">
                <div className="absolute top-0 right-0 bg-amber-500/20 text-amber-400 font-wrc text-xs px-3 py-1 rounded-bl-xl border-l border-b border-amber-500/30">
                  Panel de Control Exclusivo
                </div>
                <h3 className="font-wrc text-xl text-amber-400 mb-4 tracking-wider flex items-center gap-2">
                  <span>➕</span> Crear Nueva Fecha de Campeonato
                </h3>
                <form onSubmit={handleCrearEvento} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input 
                    type="text" 
                    placeholder="Título del Rally (ej: Rally de Misiones)" 
                    value={nuevoEvento.titulo}
                    onChange={(e) => setNuevoEvento({...nuevoEvento, titulo: e.target.value})}
                    className="bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 outline-none font-sans"
                    required
                  />
                  <input 
                    type="date" 
                    value={nuevoEvento.fecha}
                    onChange={(e) => setNuevoEvento({...nuevoEvento, fecha: e.target.value})}
                    className="bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 outline-none font-sans"
                    required
                  />
                  <input 
                    type="text" 
                    placeholder="Circuito / Tramo (ej: Tierra Colorada)" 
                    value={nuevoEvento.circuito}
                    onChange={(e) => setNuevoEvento({...nuevoEvento, circuito: e.target.value})}
                    className="bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 outline-none font-sans"
                    required
                  />
                  <button 
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-400 text-black font-wrc font-black uppercase text-sm rounded-xl py-3 transition shadow-lg shadow-amber-500/20 tracking-wider flex items-center justify-center gap-2"
                  >
                    <span>🚀 Publicar Evento</span>
                  </button>
                </form>
              </div>
            )}

            {/* LISTA DE EVENTOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {eventos.map((ev) => (
                <div key={ev.id} className="bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-amber-500/50 transition shadow-lg relative group">
                  <div className="absolute top-4 right-4 text-amber-400 font-mono text-xs bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                    {ev.fecha}
                  </div>
                  <h3 className="font-wrc text-3xl text-white mb-2 group-hover:text-amber-400 transition">{ev.titulo}</h3>
                  <p className="text-neutral-400 text-sm mb-4 font-sans">📍 Tramo: <span className="text-white font-medium">{ev.circuito}</span></p>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-neutral-800 gap-4">
                    <span className="text-xs text-neutral-400 font-medium font-sans">Inscriptos: <strong className="text-amber-400">{ev.inscriptos}</strong></span>
                    
                    <div className="flex items-center gap-2">
                      {esAdmin && (
                        <button 
                          onClick={() => handleEliminarEvento(ev.id)}
                          className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white font-wrc text-xs uppercase px-3 py-2 rounded-xl transition border border-red-500/30"
                          title="Eliminar evento"
                        >
                          🗑️ Eliminar
                        </button>
                      )}
                      <button 
                        onClick={() => alert(`¡Te has inscripto exitosamente a ${ev.titulo}!`)}
                        className="bg-amber-500 hover:bg-amber-400 text-black font-wrc text-sm uppercase px-5 py-2 rounded-xl transition shadow-md tracking-wider font-bold"
                      >
                        Inscribirse
                      </button>
                    </div>
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
              <h2 className="font-wrc text-4xl text-amber-400 tracking-wide">Salón de la Fama - Espindola Competición</h2>
              <p className="text-neutral-400 text-sm font-sans">Historial de títulos, podios y campeonatos obtenidos por nuestros pilotos.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-b from-neutral-900/80 to-neutral-950 border border-amber-500/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-amber-500 text-black font-wrc text-xs px-4 py-1 rounded-bl-xl tracking-wider">CAMPEÓN 2026</div>
                <div className="text-4xl mb-3">🥇</div>
                <h3 className="font-wrc text-2xl text-white">MIT CUP Championship</h3>
                <p className="text-amber-400 text-sm font-semibold mt-1 font-sans">Piloto: Lucas Negri</p>
                <p className="text-neutral-400 text-xs mt-3 font-sans">Categoría Rally4 - Renault Clio Rally5</p>
              </div>

              <div className="bg-gradient-to-b from-neutral-900/80 to-neutral-950 border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-neutral-800 text-neutral-300 font-wrc text-xs px-4 py-1 rounded-bl-xl border-l border-b border-neutral-700 tracking-wider">PODIO</div>
                <div className="text-4xl mb-3">🥉</div>
                <h3 className="font-wrc text-2xl text-white">SIMRALLY Series</h3>
                <p className="text-amber-400 text-sm font-semibold mt-1 font-sans">Piloto: Pedro Laninha</p>
                <p className="text-neutral-400 text-xs mt-3 font-sans">Categoría Rally2 - Peugeot 208</p>
              </div>

              <div className="bg-gradient-to-b from-neutral-900/80 to-neutral-950 border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-neutral-800 text-neutral-300 font-wrc text-xs px-4 py-1 rounded-bl-xl tracking-wider">TOP 2 MUNDIAL</div>
                <div className="text-4xl mb-3">🌍</div>
                <h3 className="font-wrc text-2xl text-white">Greece Gravel Challenge</h3>
                <p className="text-amber-400 text-sm font-semibold mt-1 font-sans">Equipo Espíndola</p>
                <p className="text-neutral-400 text-xs mt-3 font-sans">Setup por defecto - Etapa extrema</p>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Modal de edición de perfil */}
      {mostrarPerfilModal && (
        <PerfilModal 
          usuario={usuario} 
          onClose={() => setMostrarPerfilModal(false)} 
          onPerfilGuardado={() => verificarAdminYPerfil(usuario)}
        />
      )}
    </div>
  );
}
