import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import PerfilModal from './PerfilModal';

// Array de fotos de fondo estilo WRC para el carrusel dinámico
const fotosRally = [
  'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1541348263662-e0626628dcfc?q=80&w=1920&auto=format&fit=crop'
];

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [mostrarPerfilModal, setMostrarPerfilModal] = useState(false);
  const [pestanaActiva, setPestanaActiva] = useState('inicio');

  // Estado para el carrusel automático de fotos de fondo
  const [fondoActual, setFondoActual] = useState(0);

  useEffect(() => {
    const intervaloFondo = setInterval(() => {
      setFondoActual((prev) => (prev + 1) % fotosRally.length);
    }, 6000);
    return () => clearInterval(intervaloFondo);
  }, []);

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
    <div className="min-h-screen bg-[#050505] text-white font-sans relative overflow-x-hidden selection:bg-amber-500 selection:text-black">
      
      {/* Importación directa de la tipografía WRC Clean Negrita (Barlow Condensed) */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,800;0,900;1,700&display=swap');
        
        .font-wrc {
          font-family: 'Barlow Condensed', sans-serif !important;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          font-weight: 800;
        }
      `}</style>

      {/* ----------------- ENCABEZADO 100% FLOTANTE Y TRANSLÚCIDO REAL ----------------- */}
      <header 
        className="sticky top-0 z-50 backdrop-blur-md border-b border-white/10 px-6 py-3.5 shadow-xl"
        style={{ backgroundColor: 'rgba(5, 5, 5, 0.35)' }}
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          
          {/* Logo y Nombre de la Escudería */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setPestanaActiva('inicio')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center font-wrc font-black text-black text-xl shadow-lg shadow-amber-500/20 group-hover:scale-105 transition">
              E
            </div>
            <div>
              <h1 className="font-wrc text-xl font-black tracking-wider text-white">ESPÍNDOLA <span className="text-amber-400">COMPETICIÓN</span></h1>
              <p className="text-[10px] tracking-widest text-neutral-400 font-mono uppercase">Official WRC Hub</p>
            </div>
          </div>

          {/* Menú de Navegación Central */}
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
              Eventos
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

          {/* Bloque de Usuario / Perfil a la derecha */}
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

      {/* ----------------- HERO SECTION CON CARRUSEL DE FONDOS DE RALLY ----------------- */}
      {pestanaActiva === 'inicio' && (
        <div className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
          {fotosRally.map((foto, index) => (
            <div
              key={index}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
                index === fondoActual ? 'opacity-50 scale-105' : 'opacity-0 scale-100'
              }`}
              style={{ backgroundImage: `url(${foto})` }}
            />
          ))}

          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/70 via-transparent to-[#050505]/70"></div>

          <div className="relative z-10 max-w-5xl mx-auto px-6 text-center space-y-6 py-20">
            <span className="inline-block bg-amber-500/20 text-amber-400 font-wrc text-sm tracking-widest px-4 py-1.5 rounded-full border border-amber-500/40 uppercase backdrop-blur-md">
              Temporada Oficial 2026 • Simracing Rally Hub
            </span>

            <h1 className="font-wrc text-6xl md:text-8xl font-black tracking-tight text-white uppercase drop-shadow-2xl">
              PRECISIÓN, VELOCIDAD Y <span className="text-amber-400 drop-shadow-[0_0_25px_rgba(251,191,36,0.5)]">GLORIA</span>
            </h1>

            <p className="max-w-2xl mx-auto text-neutral-300 text-base md:text-lg font-medium leading-relaxed font-sans">
              Bienvenido al portal oficial de Espíndola Competición. Telemetría en vivo, campeonatos de rally de alta exigencia y la escudería líder en Argentina.
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
                className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border border-white/20 font-wrc text-lg px-8 py-3.5 rounded-xl uppercase tracking-wider transition shadow-lg"
              >
                📅 Inscribirse a Fechas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- CONTENIDO DE LAS PESTAÑAS ----------------- */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        
        {/* 1. LIVETIMING (AssettoHosting Directo) */}
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

        {/* 2. EVENTOS & INSCRIPCIONES */}
        {pestanaActiva === 'eventos' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-wrc text-4xl text-amber-400 tracking-wide">Próximos Eventos y Rallies</h2>
                <p className="text-neutral-400 text-sm font-sans">Inscribite a las fechas oficiales del campeonato.</p>
              </div>
              {esAdmin && (
                <span className="font-wrc bg-amber-500/20 text-amber-400 text-xs tracking-wider px-3 py-1.5 rounded-lg border border-amber-500/40">
                  Modo Administrador Activo
                </span>
              )}
            </div>

            {esAdmin && (
              <div className="bg-neutral-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
                <h3 className="font-wrc text-xl text-amber-400 mb-4 tracking-wider">Crear Nueva Fecha de Campeonato</h3>
                <form onSubmit={handleCrearEvento} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input 
                    type="text" 
                    placeholder="Nombre del Rally / Evento" 
                    value={nuevoEvento.titulo}
                    onChange={(e) => setNuevoEvento({...nuevoEvento, titulo: e.target.value})}
                    className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-500 outline-none font-sans"
                  />
                  <input 
                    type="date" 
                    value={nuevoEvento.fecha}
                    onChange={(e) => setNuevoEvento({...nuevoEvento, fecha: e.target.value})}
                    className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-500 outline-none font-sans"
                  />
                  <input 
                    type="text" 
                    placeholder="Nombre del Tramo / Circuito" 
                    value={nuevoEvento.circuito}
                    onChange={(e) => setNuevoEvento({...nuevoEvento, circuito: e.target.value})}
                    className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-500 outline-none font-sans"
                  />
                  <button 
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-400 text-black font-wrc uppercase text-sm rounded-xl py-2.5 transition shadow-lg shadow-amber-500/20 tracking-wider"
                  >
                    Publicar Evento
                  </button>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {eventos.map((ev) => (
                <div key={ev.id} className="bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-amber-500/50 transition shadow-lg relative group">
                  <div className="absolute top-4 right-4 text-amber-400 font-mono text-xs bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                    {ev.fecha}
                  </div>
                  <h3 className="font-wrc text-3xl text-white mb-2 group-hover:text-amber-400 transition">{ev.titulo}</h3>
                  <p className="text-neutral-400 text-sm mb-4 font-sans">📍 Tramo: <span className="text-white font-medium">{ev.circuito}</span></p>
                  <div className="flex justify-between items-center pt-4 border-t border-neutral-800">
                    <span className="text-xs text-neutral-400 font-medium font-sans">Pilotos Inscriptos: <strong className="text-amber-400">{ev.inscriptos}</strong></span>
                    <button 
                      onClick={() => alert(`¡Te has inscripto exitosamente a ${ev.titulo}!`)}
                      className="bg-amber-500 hover:bg-amber-400 text-black font-wrc text-sm uppercase px-5 py-2 rounded-xl transition shadow-md tracking-wider"
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
          onPerfilGuardado={() => cargarPerfil(usuario.id)}
        />
      )}
    </div>
  );
}
