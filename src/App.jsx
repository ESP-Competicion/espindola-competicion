import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import PerfilModal from './PerfilModal';
import InscripcionModal from './InscripcionModal';
import AuthModal from './AuthModal';
import CambiarPasswordModal from './CambiarPasswordModal';
import SubirImagen from './SubirImagen';

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
  const [mostrarAuthModal, setMostrarAuthModal] = useState(false);
  const [mostrarCambiarPasswordModal, setMostrarCambiarPasswordModal] = useState(false);
  const [mostrarMenuDropdown, setMostrarMenuDropdown] = useState(false);
  const [pestanaActiva, setPestanaActiva] = useState('inicio');
  const [esAdmin, setEsAdmin] = useState(false);

  const [fondoActual, setFondoActual] = useState(0);

  // CONFIGURACIÓN SOCIAL Y HISTORIA
  const [config, setConfig] = useState({
    instagram: 'https://instagram.com',
    discord: 'https://discord.gg',
    tiktok: 'https://tiktok.com',
    historia_texto: 'Espíndola Competición nació de la pasión por el rally de alta competencia y la simulación deportiva. Con dedicación en cada fecha, combinamos telemetría, puesta a punto y constancia para estar siempre peleando la punta del campeonato.',
    historia_imagen: 'https://files.catbox.moe/t5ffu8.png'
  });
  const [editandoConfig, setEditandoConfig] = useState(false);

  // ESTADOS DE GALERÍA Y ÁLBUMES
  const [albumes, setAlbumes] = useState([]);
  const [albumSeleccionado, setAlbumSeleccionado] = useState(null);
  const [fotosAlbumActual, setFotosAlbumActual] = useState([]);

  // FORMULARIOS ADMIN GALERIA
  const [nuevoAlbumNombre, setNuevoAlbumNombre] = useState('');
  const [portadaAlbumUrl, setPortadaAlbumUrl] = useState('');

  // EVENTOS DEL EQUIPO
  const [eventos, setEventos] = useState([]);
  const [nuevoEvento, setNuevoEvento] = useState({
    titulo: '',
    fecha: '',
    horario: '',
    categorias: '',
    modelos_autos: '',
    pais_origen: 'Argentina 🇦🇷'
  });
  const [eventoParaInscribir, setEventoParaInscribir] = useState(null);

  // CALENDARIO DE OTRAS COMUNIDADES (INDEPENDIENTE)
  const [calendarioFechas, setCalendarioFechas] = useState([]);
  const [nuevoCalendarioFecha, setNuevoCalendarioFecha] = useState({
    titulo: '',
    fecha: '',
    horario: '',
    categorias: '',
    modelos_autos: '',
    pais_origen: 'Argentina 🇦🇷'
  });
  const [modalAsistenciaFecha, setModalAsistenciaFecha] = useState(null);
  const [asistentesFecha, setAsistentesFecha] = useState([]);
  const [modalInscripcionCalendario, setModalInscripcionCalendario] = useState(null);

  // MIEMBROS
  const [miembros, setMiembros] = useState([]);

  // SALÓN DE LA FAMA
  const [hallFama, setHallFama] = useState([]);
  const [nuevoPilotoFama, setNuevoPilotoFama] = useState({ nombre: '', categoria: '', campeonatos: '', foto: '' });
  const [editandoId, setEditandoId] = useState(null);

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
    cargarConfiguracion();
    cargarAlbumes();
    cargarEventos();
    cargarCalendarioFechas();
    cargarMiembros();
    cargarSalónDeLaFama();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMostrarCambiarPasswordModal(true);
      }
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

  async function cargarConfiguracion() {
    const { data } = await supabase.from('configuracion_equipo').select('*').eq('id', 1).single();
    if (data) setConfig(data);
  }

  async function cargarAlbumes() {
    const { data } = await supabase.from('albumes_galeria').select('*').order('created_at', { ascending: false });
    if (data) setAlbumes(data);
  }

  async function cargarFotosDeAlbum(albumId) {
    const { data } = await supabase.from('fotos_galeria').select('*').eq('album_id', albumId).order('created_at', { ascending: false });
    if (data) setFotosAlbumActual(data);
  }

  async function cargarEventos() {
    const { data } = await supabase.from('eventos').select('*').order('created_at', { ascending: false });
    if (data) setEventos(data);
  }

  async function cargarCalendarioFechas() {
    const { data } = await supabase.from('calendario_fechas').select('*').order('created_at', { ascending: false });
    if (data) setCalendarioFechas(data);
  }

  async function cargarMiembros() {
    const { data } = await supabase.from('perfiles').select('*');
    if (data) setMiembros(data);
  }

  async function cargarAsistentes(fechaId) {
    const { data } = await supabase.from('calendario_inscripciones').select('*, perfiles(*)').eq('fecha_id', fechaId);
    if (data) setAsistentesFecha(data);
  }

  async function cargarSalónDeLaFama() {
    const { data } = await supabase.from('salon_fama').select('*').order('campeonatos', { ascending: false });
    if (data) {
      const listaConPuestos = data.map((p, idx) => ({ ...p, puesto: idx + 1 }));
      setHallFama(listaConPuestos);
    }
  }

  async function verificarAdminYPerfil(user) {
    if (user.email === 'leosimracingok@gmail.com') {
      setEsAdmin(true);
    } else {
      setEsAdmin(false);
    }

    const { data } = await supabase
      .from('perfiles')
      .select('nombre_piloto, steam_id, nacionalidad, avatar_url')
      .eq('id', user.id)
      .single();

    if (data) setPerfil(data);
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMostrarMenuDropdown(false);
  };

  const handleGuardarConfig = async (e) => {
    e.preventDefault();
    const { error } = await supabase
      .from('configuracion_equipo')
      .upsert({ id: 1, ...config, updated_at: new Date() });

    if (error) {
      alert('Error al guardar configuración: ' + error.message);
    } else {
      alert('¡Configuración guardada exitosamente!');
      setEditandoConfig(false);
    }
  };

  const handleCrearAlbum = async (e) => {
    e.preventDefault();
    if (!nuevoAlbumNombre.trim() || !portadaAlbumUrl) {
      alert('Por favor ingresa el nombre del evento y selecciona una foto de portada.');
      return;
    }

    const { error } = await supabase.from('albumes_galeria').insert([{
      nombre: nuevoAlbumNombre,
      portada_url: portadaAlbumUrl
    }]);

    if (error) {
      alert('Error al crear álbum: ' + error.message);
    } else {
      setNuevoAlbumNombre('');
      setPortadaAlbumUrl('');
      cargarAlbumes();
    }
  };

  const handleCrearEvento = async (e) => {
    e.preventDefault();
    if (!nuevoEvento.titulo || !nuevoEvento.fecha) return;

    const { error } = await supabase.from('eventos').insert([nuevoEvento]);

    if (error) {
      alert('Error al crear evento: ' + error.message);
    } else {
      setNuevoEvento({
        titulo: '',
        fecha: '',
        horario: '',
        categorias: '',
        modelos_autos: '',
        pais_origen: 'Argentina 🇦🇷'
      });
      cargarEventos();
    }
  };

  const handleEliminarEvento = async (id) => {
    if (!confirm('¿Seguro de eliminar este evento?')) return;
    const { error } = await supabase.from('eventos').delete().eq('id', id);
    if (!error) cargarEventos();
  };

  const handleCrearCalendarioFecha = async (e) => {
    e.preventDefault();
    if (!nuevoCalendarioFecha.titulo || !nuevoCalendarioFecha.fecha) return;

    const { error } = await supabase.from('calendario_fechas').insert([nuevoCalendarioFecha]);

    if (error) {
      alert('Error al crear fecha de calendario: ' + error.message);
    } else {
      setNuevoCalendarioFecha({
        titulo: '',
        fecha: '',
        horario: '',
        categorias: '',
        modelos_autos: '',
        pais_origen: 'Argentina 🇦🇷'
      });
      cargarCalendarioFechas();
    }
  };

  const handleEliminarCalendarioFecha = async (id) => {
    if (!confirm('¿Seguro de eliminar esta fecha del calendario?')) return;
    const { error } = await supabase.from('calendario_fechas').delete().eq('id', id);
    if (!error) cargarCalendarioFechas();
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans relative overflow-x-hidden selection:bg-sky-400 selection:text-black">
      
      {/* FONDO GLOBAL */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {fotosRally.map((foto, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
              index === fondoActual ? 'opacity-75 scale-105' : 'opacity-0 scale-100'
            }`}
            style={{ backgroundImage: `url(${foto})` }}
          />
        ))}
        <div className="absolute inset-0 bg-[#030303]/40 backdrop-blur-[0.3px]"></div>
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

      {/* ENCABEZADO TRANSLÚCIDO ESTILO ORIGINAL CON DETALLES DORADOS Y CELESTE */}
      <header 
        className="sticky top-0 z-50 backdrop-blur-md border-b border-amber-400/30 px-6 py-3 shadow-xl"
        style={{ backgroundColor: 'rgba(5, 5, 5, 0.75)' }}
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          
          {/* LOGO (Vuelve al inicio al hacer clic) */}
          <div 
            className="cursor-pointer group flex items-center" 
            onClick={() => { setPestanaActiva('inicio'); setAlbumSeleccionado(null); }}
            title="Ir al inicio"
          >
            <img 
              src="https://files.catbox.moe/f3xmld.png" 
              alt="Logo Espíndola Competición" 
              className="h-12 w-auto object-contain group-hover:scale-105 transition drop-shadow-[0_2px_10px_rgba(251,191,36,0.5)]"
            />
          </div>

          {/* MENÚ DE PESTAÑAS (SIN INICIO, MÁS COMPACTO) */}
          <nav className="flex items-center gap-1 p-1.5 rounded-full border border-amber-400/20 shadow-inner overflow-x-auto bg-black/40">
            <button onClick={() => { setPestanaActiva('historia'); setAlbumSeleccionado(null); }} className={`px-3.5 py-1.5 rounded-full font-wrc text-sm transition-all ${pestanaActiva === 'historia' ? 'bg-sky-400 text-black shadow-lg shadow-sky-400/40 font-bold' : 'text-neutral-300 hover:text-white hover:bg-white/10'}`}>Nuestra Historia</button>
            <button onClick={() => { setPestanaActiva('calendario'); setAlbumSeleccionado(null); }} className={`px-3.5 py-1.5 rounded-full font-wrc text-sm transition-all ${pestanaActiva === 'calendario' ? 'bg-sky-400 text-black shadow-lg shadow-sky-400/40 font-bold' : 'text-neutral-300 hover:text-white hover:bg-white/10'}`}>Calendario 📅</button>
            <button onClick={() => { setPestanaActiva('miembros'); setAlbumSeleccionado(null); }} className={`px-3.5 py-1.5 rounded-full font-wrc text-sm transition-all ${pestanaActiva === 'miembros' ? 'bg-sky-400 text-black shadow-lg shadow-sky-400/40 font-bold' : 'text-neutral-300 hover:text-white hover:bg-white/10'}`}>Miembros 👥</button>
            <button onClick={() => { setPestanaActiva('galeria'); setAlbumSeleccionado(null); }} className={`px-3.5 py-1.5 rounded-full font-wrc text-sm transition-all ${pestanaActiva === 'galeria' ? 'bg-sky-400 text-black shadow-lg shadow-sky-400/40 font-bold' : 'text-neutral-300 hover:text-white hover:bg-white/10'}`}>Galería</button>
            <button onClick={() => { setPestanaActiva('livetiming'); setAlbumSeleccionado(null); }} className={`px-3.5 py-1.5 rounded-full font-wrc text-sm transition-all ${pestanaActiva === 'livetiming' ? 'bg-sky-400 text-black shadow-lg shadow-sky-400/40 font-bold' : 'text-neutral-300 hover:text-white hover:bg-white/10'}`}>Live Timing</button>
            <button onClick={() => { setPestanaActiva('eventos'); setAlbumSeleccionado(null); }} className={`px-3.5 py-1.5 rounded-full font-wrc text-sm transition-all ${pestanaActiva === 'eventos' ? 'bg-sky-400 text-black shadow-lg shadow-sky-400/40 font-bold' : 'text-neutral-300 hover:text-white hover:bg-white/10'}`}>Eventos</button>
            <button onClick={() => { setPestanaActiva('fama'); setAlbumSeleccionado(null); }} className={`px-3.5 py-1.5 rounded-full font-wrc text-sm transition-all ${pestanaActiva === 'fama' ? 'bg-sky-400 text-black shadow-lg shadow-sky-400/40 font-bold' : 'text-neutral-300 hover:text-white hover:bg-white/10'}`}>Salón de la Fama</button>
          </nav>

          {/* PERFIL Y ENGRANAJE DE CONFIGURACIÓN */}
          <div className="flex items-center gap-3 relative">
            {usuario ? (
              <div className="flex items-center gap-2 border border-amber-400/30 px-3 py-1.5 rounded-2xl bg-black/40">
                <button onClick={() => setMostrarPerfilModal(true)} className="flex items-center gap-2 text-left group">
                  <div className="w-8 h-8 rounded-full bg-neutral-900 border border-amber-400 flex items-center justify-center overflow-hidden font-wrc font-bold text-amber-400 text-xs">
                    {perfil?.avatar_url ? <img src={perfil.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> : (perfil?.nombre_piloto ? perfil.nombre_piloto.charAt(0).toUpperCase() : 'E')}
                  </div>
                  <span className="font-wrc text-sm text-neutral-200 group-hover:text-amber-400 transition">{perfil?.nombre_piloto || usuario.email.split('@')[0]}</span>
                </button>
                
                {/* BOTÓN ENGRANAJE */}
                <div className="relative pl-2 border-l border-white/10">
                  <button 
                    onClick={() => setMostrarMenuDropdown(!mostrarMenuDropdown)}
                    className="p-1.5 text-neutral-400 hover:text-amber-400 transition rounded-lg hover:bg-white/5"
                    title="Configuración"
                  >
                    ⚙️
                  </button>

                  {/* MENÚ DESPLEGABLE */}
                  {mostrarMenuDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-neutral-900 border border-amber-400/40 rounded-2xl shadow-2xl py-2 z-50 backdrop-blur-xl">
                      <button 
                        onClick={() => { setMostrarPerfilModal(true); setMostrarMenuDropdown(false); }}
                        className="w-full text-left px-4 py-2 font-wrc text-sm text-neutral-200 hover:bg-sky-500/20 hover:text-sky-300 transition"
                      >
                        👤 Mi Perfil
                      </button>
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 font-wrc text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 transition border-t border-white/10"
                      >
                        🚪 Salir
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button onClick={() => setMostrarAuthModal(true)} className="bg-sky-400 hover:bg-sky-300 text-black font-wrc text-sm px-5 py-2.5 rounded-xl transition shadow-lg shadow-sky-400/20 tracking-wider font-bold">Acceder / Registrarse</button>
            )}
          </div>

        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        
        {/* 1. INICIO */}
        {pestanaActiva === 'inicio' && (
          <div className="min-h-[75vh] flex flex-col items-center justify-center">
            <div className="max-w-2xl mx-auto text-center space-y-6 py-12">
              <span className="inline-block bg-sky-500/20 text-sky-300 font-wrc text-sm tracking-widest px-4 py-1.5 rounded-full border border-sky-400/40 uppercase backdrop-blur-md shadow-lg">
                🇦🇷 Temporada Oficial 2026 • Espíndola Competición {esAdmin && '• Modo Admin'}
              </span>

              <h1 className="font-wrc text-6xl md:text-8xl font-black tracking-tight text-white uppercase drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)]">
                PRECISIÓN, VELOCIDAD Y <span className="text-amber-400 drop-shadow-[0_0_25px_rgba(251,191,36,0.7)]">GLORIA</span>
              </h1>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <a href={config.instagram || '#'} target="_blank" rel="noopener noreferrer" className="bg-neutral-900/60 backdrop-blur-md hover:bg-sky-500/20 text-sky-400 border border-sky-400/40 font-wrc text-sm px-6 py-3 rounded-full transition shadow-lg flex items-center gap-2.5 uppercase group">Instagram</a>
                <a href={config.discord || '#'} target="_blank" rel="noopener noreferrer" className="bg-neutral-900/60 backdrop-blur-md hover:bg-sky-500/20 text-sky-400 border border-sky-400/40 font-wrc text-sm px-6 py-3 rounded-full transition shadow-lg flex items-center gap-2.5 uppercase group">Discord</a>
                <a href={config.tiktok || '#'} target="_blank" rel="noopener noreferrer" className="bg-neutral-900/60 backdrop-blur-md hover:bg-sky-500/20 text-sky-400 border border-sky-400/40 font-wrc text-sm px-6 py-3 rounded-full transition shadow-lg flex items-center gap-2.5 uppercase group">TikTok</a>
              </div>
            </div>
          </div>
        )}

        {/* 2. NUESTRA HISTORIA (FOTO ARRIBA, TEXTO ABAJO - ESTILO PAINT) */}
        {pestanaActiva === 'historia' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div className="text-center">
              <h2 className="font-wrc text-4xl text-amber-400 tracking-wide">Nuestra Historia - Espíndola Competición</h2>
              <p className="text-neutral-300 text-sm font-sans">El origen, nuestros valores y la trayectoria del equipo.</p>
            </div>

            <div className="bg-neutral-900/60 backdrop-blur-md border border-amber-400/30 rounded-3xl p-8 shadow-2xl space-y-6">
              {/* FOTO ARRIBA */}
              <div className="rounded-2xl overflow-hidden border border-amber-400/50 shadow-xl max-h-[400px]">
                <img 
                  src={config.historia_imagen || 'https://files.catbox.moe/t5ffu8.png'} 
                  alt="Historia del equipo" 
                  className="w-full h-full object-cover hover:scale-105 transition duration-500"
                />
              </div>

              {/* TEXTO ABAJO */}
              <div className="space-y-4 pt-2">
                <h3 className="font-wrc text-2xl text-white text-center md:text-left">Pasión Por El Motor y La Competición</h3>
                <p className="text-neutral-200 text-base leading-relaxed font-sans whitespace-pre-line text-center md:text-left">
                  {config.historia_texto}
                </p>
              </div>
            </div>

            {esAdmin && (
              <div className="bg-neutral-900/80 backdrop-blur-md border border-amber-400/50 rounded-2xl p-6 shadow-2xl space-y-4">
                <h3 className="font-wrc text-xl text-amber-400">⚙️ Editar Reseña de Historia e Imagen</h3>
                <form onSubmit={handleGuardarConfig} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">Texto de la Historia</label>
                    <textarea
                      rows={5}
                      value={config.historia_texto}
                      onChange={(e) => setConfig({ ...config, historia_texto: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:border-sky-400 outline-none font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">Imagen Representativa</label>
                    <SubirImagen currentUrl={config.historia_imagen} onUpload={(url) => setConfig({ ...config, historia_imagen: url })} />
                  </div>
                  <button type="submit" className="bg-sky-400 hover:bg-sky-300 text-black font-wrc font-black text-sm uppercase px-6 py-2.5 rounded-xl transition shadow-lg shadow-sky-400/20">💾 Guardar Historia</button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* 3. CALENDARIO 📅 (INDEPENDIENTE DE EVENTOS) */}
        {pestanaActiva === 'calendario' && (
          <div className="space-y-8">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <h2 className="font-wrc text-4xl text-amber-400 tracking-wide">Calendario de Fechas 📅</h2>
                <p className="text-neutral-300 text-sm font-sans">Fechas de otras comunidades, circuitos y recordatorios para los pilotos.</p>
              </div>
              {esAdmin && (
                <button onClick={() => setModalInscripcionCalendario(true)} className="bg-sky-400 text-black font-wrc px-5 py-2.5 rounded-xl text-sm shadow-lg shadow-sky-400/20 font-bold">➕ Agregar Fecha al Calendario</button>
              )}
            </div>

            {/* FORMULARIO ADMIN PARA CREAR EN CALENDARIO */}
            {esAdmin && modalInscripcionCalendario && (
              <div className="bg-neutral-900/90 border border-amber-400/50 p-6 rounded-2xl shadow-2xl space-y-4 backdrop-blur-md">
                <div className="flex justify-between items-center">
                  <h3 className="font-wrc text-xl text-amber-400">Crear Fecha en Calendario</h3>
                  <button onClick={() => setModalInscripcionCalendario(false)} className="text-neutral-400 hover:text-white">✕</button>
                </div>
                <form onSubmit={handleCrearCalendarioFecha} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" placeholder="Título (Ej: Rally Ourense - Otra Comunidad)" value={nuevoCalendarioFecha.titulo} onChange={(e) => setNuevoCalendarioFecha({...nuevoCalendarioFecha, titulo: e.target.value})} className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-sm" required />
                  <input type="date" value={nuevoCalendarioFecha.fecha} onChange={(e) => setNuevoCalendarioFecha({...nuevoCalendarioFecha, fecha: e.target.value})} className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-sm" required />
                  <input type="text" placeholder="Horario (Ej: 21:00 hs)" value={nuevoCalendarioFecha.horario} onChange={(e) => setNuevoCalendarioFecha({...nuevoCalendarioFecha, horario: e.target.value})} className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-sm" />
                  <input type="text" placeholder="Categorías (Ej: RC2, Rally4)" value={nuevoCalendarioFecha.categorias} onChange={(e) => setNuevoCalendarioFecha({...nuevoCalendarioFecha, categorias: e.target.value})} className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-sm" />
                  <input type="text" placeholder="Autos permitidos" value={nuevoCalendarioFecha.modelos_autos} onChange={(e) => setNuevoCalendarioFecha({...nuevoCalendarioFecha, modelos_autos: e.target.value})} className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-sm md:col-span-2" />
                  <button type="submit" className="md:col-span-2 bg-sky-400 text-black font-wrc py-2.5 rounded-xl font-bold">Publicar en Calendario</button>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {calendarioFechas.map((cal) => (
                <div key={cal.id} className="bg-neutral-900/60 backdrop-blur-md border border-amber-400/20 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-xs bg-sky-400/20 text-sky-300 border border-sky-400/40 px-3 py-1 rounded-full font-wrc">{cal.fecha} • {cal.horario || '21:00 hs'}</span>
                    <h3 className="font-wrc text-2xl text-white">{cal.titulo}</h3>
                    <p className="text-sm text-neutral-300">🏁 Categorías: {cal.categorias || 'Libre'}</p>
                    <p className="text-sm text-neutral-300">🚗 Autos: {cal.modelos_autos || 'Libre'}</p>
                  </div>

                  <div className="pt-4 border-t border-white/10 space-y-2">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          if (!usuario) { alert('Debes iniciar sesión para confirmar asistencia.'); setMostrarAuthModal(true); return; }
                          setEventoParaInscribir({ ...cal, esCalendario: true });
                        }}
                        className="flex-1 bg-sky-400 hover:bg-sky-300 text-black font-wrc text-sm py-2.5 rounded-xl shadow-md transition text-center font-bold"
                      >
                        ¡Participo!
                      </button>
                      <button 
                        onClick={() => { setModalAsistenciaFecha(cal); cargarAsistentes(cal.id); }}
                        className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-wrc text-xs px-3 py-2.5 rounded-xl border border-white/10 transition"
                      >
                        📋 Lista de Asistencia
                      </button>
                    </div>
                    {esAdmin && (
                      <button onClick={() => handleEliminarCalendarioFecha(cal.id)} className="w-full text-red-400 hover:text-red-300 text-xs font-wrc pt-1">🗑️ Eliminar Fecha</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. MIEMBROS 👥 */}
        {pestanaActiva === 'miembros' && (
          <div className="space-y-8">
            <div>
              <h2 className="font-wrc text-4xl text-amber-400 tracking-wide">Miembros del Equipo 👥</h2>
              <p className="text-neutral-300 text-sm font-sans">Pilotos y integrantes dados de alta en la plataforma.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {miembros.map((m) => (
                <div key={m.id} className="bg-neutral-900/60 backdrop-blur-md border border-amber-400/20 rounded-3xl p-6 shadow-xl text-center space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-neutral-950 border-2 border-amber-400 overflow-hidden flex items-center justify-center font-wrc text-2xl text-amber-400">
                    {m.avatar_url ? <img src={m.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> : m.nombre_piloto?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <h3 className="font-wrc text-xl text-white">{m.nombre_piloto || 'Piloto Sin Nombre'}</h3>
                    <p className="text-xs text-amber-400 uppercase font-wrc">{m.nacionalidad || 'Argentina 🇦🇷'}</p>
                    <p className="text-xs text-neutral-400 pt-1">Steam ID: {m.steam_id || 'No vinculado'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. GALERÍA */}
        {pestanaActiva === 'galeria' && (
          <div className="space-y-8">
            {!albumSeleccionado ? (
              <div className="space-y-8">
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <h2 className="font-wrc text-4xl text-amber-400 tracking-wide">Álbumes de Eventos</h2>
                    <p className="text-neutral-300 text-sm font-sans">Selecciona una carpeta para ver las fotografías oficiales.</p>
                  </div>
                </div>

                {esAdmin && (
                  <div className="bg-neutral-900/60 backdrop-blur-md border border-amber-400/50 rounded-2xl p-6 shadow-2xl space-y-4">
                    <h3 className="font-wrc text-xl text-amber-400">📁 Crear Nueva Carpeta de Evento</h3>
                    <form onSubmit={handleCrearAlbum} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                      <div>
                        <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">Nombre del Álbum / Evento</label>
                        <input type="text" value={nuevoAlbumNombre} onChange={(e) => setNuevoAlbumNombre(e.target.value)} placeholder="Ej: Rally de Grecia 2026" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-sm text-white focus:border-sky-400 outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">Foto de Portada</label>
                        <SubirImagen currentUrl={portadaAlbumUrl} onUpload={(url) => setPortadaAlbumUrl(url)} />
                      </div>
                      <button type="submit" className="md:col-span-2 bg-sky-400 hover:bg-sky-300 text-black font-wrc text-sm uppercase px-6 py-2.5 rounded-xl transition shadow-lg font-bold">Crear Álbum</button>
                    </form>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {albumes.map((album) => (
                    <div key={album.id} onClick={() => { setAlbumSeleccionado(album); cargarFotosDeAlbum(album.id); }} className="cursor-pointer group bg-neutral-900/60 backdrop-blur-md border border-amber-400/20 rounded-3xl overflow-hidden shadow-xl hover:border-amber-400 transition">
                      <div className="h-48 overflow-hidden relative">
                        <img src={album.portada_url} alt={album.nombre} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      </div>
                      <div className="p-5">
                        <h3 className="font-wrc text-2xl text-white group-hover:text-amber-400 transition">{album.nombre}</h3>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <button onClick={() => setAlbumSeleccionado(null)} className="font-wrc text-sm bg-neutral-800 text-neutral-200 px-4 py-2 rounded-xl border border-white/10 hover:bg-neutral-700 transition">← Volver a Álbumes</button>
                <h2 className="font-wrc text-4xl text-amber-400">{albumSeleccionado.nombre}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {fotosAlbumActual.map((foto) => (
                    <div key={foto.id} className="h-40 rounded-xl overflow-hidden border border-white/10 shadow-md">
                      <img src={foto.imagen_url} alt="Foto evento" className="w-full h-full object-cover hover:scale-110 transition duration-300" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* MODAL DE LISTA DE ASISTENCIA PARA CALENDARIO */}
      {modalAsistenciaFecha && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-neutral-900 border border-amber-400/40 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="font-wrc text-2xl text-amber-400">Lista de Asistencia: {modalAsistenciaFecha.titulo}</h3>
              <button onClick={() => setModalAsistenciaFecha(null)} className="text-neutral-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {asistentesFecha.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-4">Aún no hay pilotos inscriptos en esta fecha.</p>
              ) : (
                asistentesFecha.map((asistente) => (
                  <div key={asistente.id} className="bg-neutral-950 border border-neutral-800 p-4 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="font-wrc text-lg text-white">{asistente.perfiles?.nombre_piloto || 'Piloto'} <span className="text-xs text-amber-400 ml-2">{asistente.perfiles?.nacionalidad || '🇦🇷'}</span></p>
                      <p className="text-xs text-neutral-400">🚗 Auto: {asistente.auto} | Categoría: {asistente.categoria}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button onClick={() => setModalAsistenciaFecha(null)} className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-wrc py-2.5 rounded-xl">Cerrar</button>
          </div>
        </div>
      )}

      {/* MODALES */}
      {mostrarPerfilModal && <PerfilModal user={usuario} onClose={() => setMostrarPerfilModal(false)} onUpdate={() => verificarAdminYPerfil(usuario)} />}
      {mostrarAuthModal && <AuthModal onClose={() => setMostrarAuthModal(false)} />}
      {mostrarCambiarPasswordModal && <CambiarPasswordModal onClose={() => setMostrarCambiarPasswordModal(false)} />}
      {eventoParaInscribir && <InscripcionModal evento={eventoParaInscribir} user={usuario} onClose={() => setEventoParaInscribir(null)} />}
    </div>
  );
}
