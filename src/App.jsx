import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import PerfilModal from './PerfilModal';

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

  const [fondoActual, setFondoActual] = useState(0);
  const [eventos, setEventos] = useState([
    { id: 1, titulo: 'Rally de Misiones - Fecha 1', fecha: '2026-04-12', circuito: 'Tramo Tierra Colorada', inscriptos: 12 },
    { id: 2, titulo: 'Desafío Asfalto Neuquén', fecha: '2026-04-28', circuito: 'Autovía Norte', inscriptos: 8 }
  ]);
  const [nuevoEvento, setNuevoEvento] = useState({ titulo: '', fecha: '', circuito: '' });

  // Estado inicial para el Salón de la Fama (Top 3 en podio + 9 pilotos en lista = 12 en total)
  const [hallFama, setHallFama] = useState([
    { id: 1, puesto: 1, nombre: 'Lucas Negri', categoria: 'Rally4 - Renault Clio', campeonatos: 5, foto: 'https://files.catbox.moe/f3xmld.png' },
    { id: 2, puesto: 2, nombre: 'Pedro Laninha', categoria: 'Rally2 - Peugeot 208', campeonatos: 3, foto: 'https://files.catbox.moe/t3phov.png' },
    { id: 3, puesto: 3, nombre: 'Marcos Espíndola', categoria: 'WRC - Ford Fiesta', campeonatos: 2, foto: 'https://files.catbox.moe/f3xmld.png' },
    { id: 4, puesto: 4, nombre: 'Matías Giménez', categoria: 'Rally3 - Renault Clio', campeonatos: 1, foto: '' },
    { id: 5, puesto: 5, nombre: 'Lucas Benítez', categoria: 'Rally4 - Opel Corsa', campeonatos: 1, foto: '' },
    { id: 6, puesto: 6, nombre: 'Gastón Duarte', categoria: 'Rally2 - Skoda Fabia', campeonatos: 1, foto: '' },
    { id: 7, puesto: 7, nombre: 'Rodrigo Vera', categoria: 'WRC - Toyota Yaris', campeonatos: 1, foto: '' },
    { id: 8, puesto: 8, nombre: 'Ezequiel Silva', categoria: 'Rally4 - Ford Fiesta', campeonatos: 1, foto: '' },
    { id: 9, puesto: 9, nombre: 'Nahuel Acosta', categoria: 'Rally3 - Ford Fiesta', campeonatos: 1, foto: '' },
    { id: 10, puesto: 10, nombre: 'Facundo Ramos', categoria: 'Rally2 - Hyundai i20', campeonatos: 1, foto: '' },
    { id: 11, puesto: 11, nombre: 'Brian Soria', categoria: 'WRC - Citroen C3', campeonatos: 1, foto: '' },
    { id: 12, puesto: 12, nombre: 'Alan Maidana', categoria: 'Rally4 - Peugeot 208', campeonatos: 1, foto: '' }
  ]);

  const [nuevoPilotoFama, setNuevoPilotoFama] = useState({ nombre: '', categoria: '', campeonatos: '', foto: '' });

  useEffect(() => {
    const intervaloFondo = setInterval(() => {
      setFondoActual((prev) => (prev + 1) % fotosRally.length);
    }, 9000);
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

  // Agregar piloto al Salón de la Fama y ordenar por campeonatos
  const handleAgregarPilotoFama = (e) => {
    e.preventDefault();
    if (!nuevoPilotoFama.nombre || !nuevoPilotoFama.campeonatos) return;

    const listaActualizada = [
      ...hallFama,
      {
        id: Date.now(),
        nombre: nuevoPilotoFama.nombre,
        categoria: nuevoPilotoFama.categoria || 'Categoría General',
        campeonatos: parseInt(nuevoPilotoFama.campeonatos) || 1,
        foto: nuevoPilotoFama.foto || 'https://files.catbox.moe/f3xmld.png'
      }
    ];

    // Ordenar de mayor a menor por cantidad de campeonatos y reasignar puestos
    listaActualizada.sort((a, b) => b.campeonatos - a.campeonatos);
    const listaConPuestos = listaActualizada.map((p, idx) => ({ ...p, puesto: idx + 1 }));

    setHallFama(listaConPuestos);
    setNuevoPilotoFama({ nombre: '', categoria: '', campeonatos: '', foto: '' });
  };

  const handleEliminarPilotoFama = (id) => {
    const listaFiltrada = hallFama.filter(p => p.id !== id);
    const listaConPuestos = listaFiltrada.map((p, idx) => ({ ...p, puesto: idx + 1 }));
    setHallFama(listaConPuestos);
  };

  // Separar Top 3 para el podio y el resto para la lista
  const top3 = hallFama.slice(0, 3);
  const restoPilotos = hallFama.slice(3);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans relative overflow-x-hidden selection:bg-amber-500 selection:text-black">
      
      {/* FONDO GLOBAL CON FOTOS DE RALLY CLARAS Y VISIBLES */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {fotosRally.map((foto, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
              index === fondoActual ? 'opacity-65 scale-105' : 'opacity-0 scale-100'
            }`}
            style={{ backgroundImage: `url(${foto})` }}
          />
        ))}
        <div className="absolute inset-0 bg-[#030303]/40 backdrop-blur-[0.5px]"></div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,800;0,900;1,700&display=swap');
        
        .font-wrc {
          font-family: 'Barlow Condensed', sans-serif !important;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          font-weight: 800;
        }
      `}</style>

      {/* ENCABEZADO TRANSLÚCIDO */}
      <header 
        className="sticky top-0 z-50 backdrop-blur-md border-b border-white/10 px-6 py-3 shadow-xl"
        style={{ backgroundColor: 'rgba(5, 5, 5, 0.7)' }}
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          
          <div 
            className="cursor-pointer group flex items-center" 
            onClick={() => setPestanaActiva('inicio')}
            title="Ir al inicio"
          >
            <img 
              src="https://files.catbox.moe/f3xmld.png" 
              alt="Logo Espíndola Competición" 
              className="h-12 w-auto object-contain group-hover:scale-105 transition drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
            />
          </div>

          <nav className="flex items-center gap-1 p-1.5 rounded-full border border-white/10 shadow-inner overflow-x-auto" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
            <button
              onClick={() => setPestanaActiva('inicio')}
              className={`px-4 py-2 rounded-full font-wrc text-sm tracking-wider transition-all ${
                pestanaActiva === 'inicio' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30' : 'text-neutral-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Inicio
            </button>
            <button
              onClick={() => setPestanaActiva('livetiming')}
              className={`px-4 py-2 rounded-full font-wrc text-sm tracking-wider transition-all ${
                pestanaActiva === 'livetiming' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30' : 'text-neutral-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Live Timing
            </button>
            <button
              onClick={() => setPestanaActiva('eventos')}
              className={`px-4 py-2 rounded-full font-wrc text-sm tracking-wider transition-all ${
                pestanaActiva === 'eventos' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30' : 'text-neutral-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Eventos {esAdmin && '⚙️'}
            </button>
            <button
              onClick={() => setPestanaActiva('fama')}
              className={`px-4 py-2 rounded-full font-wrc text-sm tracking-wider transition-all ${
                pestanaActiva === 'fama' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30' : 'text-neutral-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Salón de la Fama
            </button>
            <button
              onClick={() => setPestanaActiva('perfil')}
              className={`px-4 py-2 rounded-full font-wrc text-sm tracking-wider transition-all ${
                pestanaActiva === 'perfil' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30' : 'text-neutral-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Mi Perfil
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

      {/* CONTENIDO PRINCIPAL */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        
        {pestanaActiva === 'inicio' && (
          <div className="min-h-[75vh] flex items-center justify-center">
            <div className="max-w-4xl mx-auto text-center space-y-6 py-12">
              <span className="inline-block bg-amber-500/20 text-amber-400 font-wrc text-sm tracking-widest px-4 py-1.5 rounded-full border border-amber-500/40 uppercase backdrop-blur-md shadow-lg">
                Temporada Oficial 2026 • Simracing Rally Hub {esAdmin && '• Panel Admin Activo'}
              </span>

              <h1 className="font-wrc text-6xl md:text-8xl font-black tracking-tight text-white uppercase drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)]">
                PRECISIÓN, VELOCIDAD Y <span className="text-amber-400 drop-shadow-[0_0_25px_rgba(251,191,36,0.7)]">GLORIA</span>
              </h1>

              <p className="max-w-2xl mx-auto text-neutral-100 text-base md:text-lg font-medium leading-relaxed font-sans drop-shadow-md">
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
                  className="bg-neutral-950/70 backdrop-blur-md hover:bg-neutral-900 text-white border border-white/20 font-wrc text-lg px-8 py-3.5 rounded-xl uppercase tracking-wider transition shadow-lg"
                >
                  📅 Gestionar Eventos
                </button>
              </div>
            </div>
          </div>
        )}

        {pestanaActiva === 'livetiming' && (
          <div className="space-y-6">
            <div className="bg-neutral-900/70 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {eventos.map((ev) => (
                <div key={ev.id} className="bg-neutral-900/70 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-amber-500/50 transition shadow-lg relative group">
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

        {/* 3. SALÓN DE LA FAMA (PODIO + LISTA + ADMIN) */}
        {pestanaActiva === 'fama' && (
          <div className="space-y-12">
            <div>
              <h2 className="font-wrc text-4xl text-amber-400 tracking-wide">Salón de la Fama - Podio de Campeones</h2>
              <p className="text-neutral-300 text-sm font-sans">Los pilotos con más títulos oficiales en la historia de Espíndola Competición.</p>
            </div>

            {/* PANEL DE ADMIN PARA AGREGAR PILOTOS AL SALÓN DE LA FAMA */}
            {esAdmin && (
              <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-950 border border-amber-500/50 rounded-2xl p-6 shadow-2xl relative">
                <div className="absolute top-0 right-0 bg-amber-500/20 text-amber-400 font-wrc text-xs px-3 py-1 rounded-bl-xl border-l border-b border-amber-500/30">
                  Panel de Control Exclusivo (Salón de la Fama)
                </div>
                <h3 className="font-wrc text-xl text-amber-400 mb-4 tracking-wider flex items-center gap-2">
                  <span>🏆</span> Registrar / Actualizar Campeón
                </h3>
                <form onSubmit={handleAgregarPilotoFama} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input 
                    type="text" 
                    placeholder="Nombre del Piloto" 
                    value={nuevoPilotoFama.nombre}
                    onChange={(e) => setNuevoPilotoFama({...nuevoPilotoFama, nombre: e.target.value})}
                    className="bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 outline-none font-sans"
                    required
                  />
                  <input 
                    type="text" 
                    placeholder="Categoría (ej: Rally4 - Clio)" 
                    value={nuevoPilotoFama.categoria}
                    onChange={(e) => setNuevoPilotoFama({...nuevoPilotoFama, categoria: e.target.value})}
                    className="bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 outline-none font-sans"
                  />
                  <input 
                    type="number" 
                    placeholder="Cantidad de Campeonatos" 
                    value={nuevoPilotoFama.campeonatos}
                    onChange={(e) => setNuevoPilotoFama({...nuevoPilotoFama, campeonatos: e.target.value})}
                    className="bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 outline-none font-sans"
                    required
                  />
                  <input 
                    type="url" 
                    placeholder="URL de la Foto (Avatar)" 
                    value={nuevoPilotoFama.foto}
                    onChange={(e) => setNuevoPilotoFama({...nuevoPilotoFama, foto: e.target.value})}
                    className="bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 outline-none font-sans"
                  />
                  <div className="md:col-span-4 flex justify-end">
                    <button 
                      type="submit"
                      className="bg-amber-500 hover:bg-amber-400 text-black font-wrc font-black uppercase text-sm px-6 py-3 rounded-xl transition shadow-lg shadow-amber-500/20 tracking-wider"
                    >
                      ➕ Añadir al Salón de la Fama
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* DISEÑO DE ESCALONES DE PODIO PARA EL TOP 3 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-6 max-w-5xl mx-auto">
              
              {/* 2º PUESTO (Izquierda) */}
              {top3[1] && (
                <div className="bg-neutral-900/70 backdrop-blur-xl border border-neutral-700 rounded-3xl p-6 text-center shadow-2xl relative order-2 md:order-1 transform md:-translate-y-4">
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-neutral-400 text-black font-wrc font-black text-sm px-4 py-1 rounded-full shadow-lg border border-white">
                    🥈 2º PUESTO
                  </div>
                  <div className="w-24 h-24 mx-auto rounded-full bg-neutral-800 border-2 border-neutral-400 overflow-hidden mb-4 shadow-xl mt-2">
                    <img src={top3[1].foto || 'https://files.catbox.moe/f3xmld.png'} alt={top3[1].nombre} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="font-wrc text-2xl text-white font-bold">{top3[1].nombre}</h3>
                  <p className="text-neutral-400 text-xs font-sans mt-1">{top3[1].categoria}</p>
                  <div className="mt-4 bg-neutral-950/80 border border-neutral-800 py-2 px-4 rounded-xl inline-block">
                    <span className="text-neutral-400 text-xs uppercase font-sans">Títulos: </span>
                    <strong className="text-neutral-300 font-wrc text-lg">{top3[1].campeonatos} 🏆</strong>
                  </div>
                  {esAdmin && (
                    <button 
                      onClick={() => handleEliminarPilotoFama(top3[1].id)}
                      className="mt-4 text-xs text-red-400 hover:text-red-300 block mx-auto underline font-sans"
                    >
                      Eliminar del Podio
                    </button>
                  )}
                </div>
              )}

              {/* 1º PUESTO (Centro - Más alto) */}
              {top3[0] && (
                <div className="bg-gradient-to-b from-amber-500/20 via-neutral-900/80 to-neutral-950 backdrop-blur-2xl border-2 border-amber-500 rounded-3xl p-8 text-center shadow-2xl relative order-1 md:order-2 transform md:-translate-y-10">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-amber-500 text-black font-wrc font-black text-base px-6 py-1.5 rounded-full shadow-xl border-2 border-white tracking-widest">
                    👑 1º CAMPEÓN MUNDIAL
                  </div>
                  <div className="w-28 h-28 mx-auto rounded-full bg-neutral-800 border-4 border-amber-400 overflow-hidden mb-4 shadow-2xl mt-3">
                    <img src={top3[0].foto || 'https://files.catbox.moe/f3xmld.png'} alt={top3[0].nombre} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="font-wrc text-3xl text-amber-400 font-black">{top3[0].nombre}</h3>
                  <p className="text-neutral-300 text-xs font-sans mt-1">{top3[0].categoria}</p>
                  <div className="mt-4 bg-amber-500/10 border border-amber-500/40 py-2.5 px-6 rounded-2xl inline-block shadow-inner">
                    <span className="text-amber-300 text-xs uppercase font-sans">Títulos Absolutos: </span>
                    <strong className="text-amber-400 font-wrc text-xl">{top3[0].campeonatos} 🏆🏆🏆</strong>
                  </div>
                  {esAdmin && (
                    <button 
                      onClick={() => handleEliminarPilotoFama(top3[0].id)}
                      className="mt-4 text-xs text-red-400 hover:text-red-300 block mx-auto underline font-sans"
                    >
                      Eliminar del Podio
                    </button>
                  )}
                </div>
              )}

              {/* 3º PUESTO (Derecha) */}
              {top3[2] && (
                <div className="bg-neutral-900/70 backdrop-blur-xl border border-amber-700/50 rounded-3xl p-6 text-center shadow-2xl relative order-3">
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-amber-700 text-white font-wrc font-black text-sm px-4 py-1 rounded-full shadow-lg border border-white">
                    🥉 3º PUESTO
                  </div>
                  <div className="w-24 h-24 mx-auto rounded-full bg-neutral-800 border-2 border-amber-700 overflow-hidden mb-4 shadow-xl mt-2">
                    <img src={top3[2].foto || 'https://files.catbox.moe/f3xmld.png'} alt={top3[2].nombre} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="font-wrc text-2xl text-white font-bold">{top3[2].nombre}</h3>
                  <p className="text-neutral-400 text-xs font-sans mt-1">{top3[2].categoria}</p>
                  <div className="mt-4 bg-neutral-950/80 border border-neutral-800 py-2 px-4 rounded-xl inline-block">
                    <span className="text-neutral-400 text-xs uppercase font-sans">Títulos: </span>
                    <strong className="text-amber-600 font-wrc text-lg">{top3[2].campeonatos} 🏆</strong>
                  </div>
                  {esAdmin && (
                    <button 
                      onClick={() => handleEliminarPilotoFama(top3[2].id)}
                      className="mt-4 text-xs text-red-400 hover:text-red-300 block mx-auto underline font-sans"
                    >
                      Eliminar del Podio
                    </button>
                  )}
                </div>
              )}

            </div>

            {/* LISTADO DE LOS DEMÁS PILOTOS (4º en adelante) */}
            {restoPilotos.length > 0 && (
              <div className="space-y-4 pt-10">
                <h3 className="font-wrc text-2xl text-amber-400 tracking-wide border-b border-neutral-800 pb-3">
                  Resto del Salón de la Fama (Pilotos Destacados)
                </h3>
                
                <div className="bg-neutral-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="divide-y divide-neutral-800">
                    {restoPilotos.map((piloto) => (
                      <div key={piloto.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition">
                        <div className="flex items-center gap-4">
                          <span className="font-wrc text-xl font-bold text-amber-500 w-8 text-center">
                            #{piloto.puesto}
                          </span>
                          <div className="w-12 h-12 rounded-full bg-neutral-800 border border-neutral-700 overflow-hidden flex-shrink-0">
                            <img src={piloto.foto || 'https://files.catbox.moe/f3xmld.png'} alt={piloto.nombre} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h4 className="font-wrc text-lg text-white font-bold">{piloto.nombre}</h4>
                            <p className="text-neutral-400 text-xs font-sans">{piloto.categoria}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3.5 py-1.5 rounded-full text-xs font-wrc font-bold">
                            {piloto.campeonatos} 🏆 Título{piloto.campeonatos > 1 ? 's' : ''}
                          </span>
                          {esAdmin && (
                            <button 
                              onClick={() => handleEliminarPilotoFama(piloto.id)}
                              className="text-red-400 hover:text-red-300 text-xs font-mono bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-lg transition"
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {pestanaActiva === 'perfil' && (
          <div className="max-w-2xl mx-auto bg-neutral-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            <div className="flex flex-col items-center text-center pb-6 border-b border-neutral-800">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-500 to-amber-300 p-1 mb-4 shadow-xl">
                <div className="w-full h-full bg-neutral-950 rounded-full flex items-center justify-center overflow-hidden text-2xl font-wrc font-black text-amber-400">
                  {perfil?.avatar_url ? (
                    <img src={perfil.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    perfil?.nombre_piloto ? perfil.nombre_piloto.charAt(0).toUpperCase() : 'E'
                  )}
                </div>
              </div>
              <h2 className="font-wrc text-3xl text-white">{perfil?.nombre_piloto || 'Piloto sin configurar'}</h2>
              <p className="text-amber-400 text-sm font-mono mt-1">{usuario?.email || 'No ha iniciado sesión'}</p>
              <span className="mt-3 bg-white/5 text-neutral-300 px-4 py-1 rounded-full text-xs font-semibold border border-white/10 font-sans">
                Nacionalidad: {perfil?.nacionalidad || 'No especificada'}
              </span>
            </div>

            <div className="py-6 space-y-4">
              <div className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-4 flex justify-between items-center font-sans">
                <span className="text-neutral-400 text-sm">Steam ID 64:</span>
                <span className="font-mono text-amber-400 text-sm">{perfil?.steam_id || 'No vinculado'}</span>
              </div>
              <div className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-4 flex justify-between items-center font-sans">
                <span className="text-neutral-400 text-sm">Estado de Licencia:</span>
                <span className="text-emerald-400 text-sm font-bold">Activa 🟢</span>
              </div>
            </div>

            <div className="pt-4">
              <button 
                onClick={() => setMostrarPerfilModal(true)}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-wrc text-lg py-3 rounded-xl transition shadow-lg shadow-amber-500/20 tracking-wider"
              >
                ✏️ Editar Datos y Foto de Perfil
              </button>
            </div>
          </div>
        )}

      </main>

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
