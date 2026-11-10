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

  // ESTADOS DE GALERÍA Y ÁLBUMES (CARPETAS)
  const [albumes, setAlbumes] = useState([]);
  const [albumSeleccionado, setAlbumSeleccionado] = useState(null);
  const [fotosAlbumActual, setFotosAlbumActual] = useState([]);
  const [fotoAmpliada, setFotoAmpliada] = useState(null);

  // FORMULARIOS ADMIN GALERIA
  const [nuevoAlbumNombre, setNuevoAlbumNombre] = useState('');
  const [portadaAlbumUrl, setPortadaAlbumUrl] = useState('');
  const [subiendoFotosMasivo, setSubiendoFotosMasivo] = useState(false);

  // EVENTOS
  const [eventos, setEventos] = useState([]);
  const [nuevoEvento, setNuevoEvento] = useState({
    titulo: '',
    fecha: '',
    horario: '',
    categorias: '',
    modelos_autos: '',
    pais_origen: 'Argentina 🇦🇷'
  });

  // MODAL INSCRIPCIÓN
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [modoModalInscripcion, setModoModalInscripcion] = useState('formulario');

  // SALÓN DE LA FAMA
  const [hallFama, setHallFama] = useState([]);
  const [nuevoPilotoFama, setNuevoPilotoFama] = useState({ nombre: '', categoria: '', campeonatos: '', foto: '' });
  const [editandoId, setEditandoId] = useState(null);

  // CÁLCULO AUTOMÁTICO DE CAMPEONATOS TOTALES
  const totalCampeonatosEquipo = hallFama.reduce((acc, piloto) => acc + (parseInt(piloto.campeonatos) || 0), 0);

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

  const handleEliminarAlbum = async (id, e) => {
    e.stopPropagation();
    if (!confirm('¿Seguro que deseas eliminar este álbum y todas sus fotos?')) return;
    await supabase.from('fotos_galeria').delete().eq('album_id', id);
    const { error } = await supabase.from('albumes_galeria').delete().eq('id', id);
    if (!error) cargarAlbumes();
  };

  // SUBIDA MÚLTIPLE DE FOTOS AL ÁLBUM (CORREGIDA)
  const handleSubirFotosMultiples = async (e) => {
    try {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      setSubiendoFotosMasivo(true);

      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `album_${albumSeleccionado.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('imagenes')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('imagenes')
          .getPublicUrl(fileName);

        const { error: dbError } = await supabase.from('fotos_galeria').insert([{
          album_id: albumSeleccionado.id,
          imagen_url: data.publicUrl
        }]);

        if (dbError) throw dbError;
      }

      cargarFotosDeAlbum(albumSeleccionado.id);
      alert(`¡Se subieron ${files.length} fotos exitosamente al álbum!`);
    } catch (error) {
      alert('Error al subir las fotos: ' + error.message);
    } finally {
      setSubiendoFotosMasivo(false);
    }
  };

  const handleEliminarFotoAlbum = async (fotoId) => {
    if (!confirm('¿Eliminar esta foto del álbum?')) return;
    const { error } = await supabase.from('fotos_galeria').delete().eq('id', fotoId);
    if (!error) cargarFotosDeAlbum(albumSeleccionado.id);
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

  const handleGuardarPilotoFama = async (e) => {
    e.preventDefault();
    if (!nuevoPilotoFama.nombre || !nuevoPilotoFama.campeonatos) return;

    const datosPiloto = {
      nombre: nuevoPilotoFama.nombre,
      categoria: nuevoPilotoFama.categoria || 'Categoría General',
      campeonatos: parseInt(nuevoPilotoFama.campeonatos) || 0,
      foto: nuevoPilotoFama.foto || 'https://files.catbox.moe/f3xmld.png'
    };

    if (editandoId !== null) {
      await supabase.from('salon_fama').update(datosPiloto).eq('id', editandoId);
      setEditandoId(null);
    } else {
      await supabase.from('salon_fama').insert([datosPiloto]);
    }

    setNuevoPilotoFama({ nombre: '', categoria: '', campeonatos: '', foto: '' });
    cargarSalónDeLaFama();
  };

  const handleEditarPilotoFama = (piloto) => {
    setEditandoId(piloto.id);
    setNuevoPilotoFama({
      nombre: piloto.nombre,
      categoria: piloto.categoria,
      campeonatos: piloto.campeonatos,
      foto: piloto.foto
    });
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleEliminarPilotoFama = async (id) => {
    if (!confirm('¿Eliminar del Salón de la Fama?')) return;
    await supabase.from('salon_fama').delete().eq('id', id);
    cargarSalónDeLaFama();
  };

  const top3 = hallFama.slice(0, 3);
  const restoPilotos = hallFama.slice(3);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans relative overflow-x-hidden selection:bg-amber-500 selection:text-black">
      
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
        <div className="absolute inset-0 bg-[#030303]/35 backdrop-blur-[0.3px]"></div>
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
        style={{ backgroundColor: 'rgba(5, 5, 5, 0.65)' }}
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          
          <div 
            className="cursor-pointer group flex items-center" 
            onClick={() => { setPestanaActiva('inicio'); setAlbumSeleccionado(null); }}
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
              onClick={() => { setPestanaActiva('inicio'); setAlbumSeleccionado(null); }}
              className={`px-4 py-2 rounded-full font-wrc text-sm tracking-wider transition-all ${
                pestanaActiva === 'inicio' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30' : 'text-neutral-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Inicio
            </button>
            <button
              onClick={() => { setPestanaActiva('historia'); setAlbumSeleccionado(null); }}
              className={`px-4 py-2 rounded-full font-wrc text-sm tracking-wider transition-all ${
                pestanaActiva === 'historia' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30' : 'text-neutral-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Nuestra Historia
            </button>
            <button
              onClick={() => { setPestanaActiva('galeria'); setAlbumSeleccionado(null); }}
              className={`px-4 py-2 rounded-full font-wrc text-sm tracking-wider transition-all ${
                pestanaActiva === 'galeria' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30' : 'text-neutral-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Galería
            </button>
            <button
              onClick={() => { setPestanaActiva('livetiming'); setAlbumSeleccionado(null); }}
              className={`px-4 py-2 rounded-full font-wrc text-sm tracking-wider transition-all ${
                pestanaActiva === 'livetiming' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30' : 'text-neutral-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Live Timing
            </button>
            <button
              onClick={() => { setPestanaActiva('eventos'); setAlbumSeleccionado(null); }}
              className={`px-4 py-2 rounded-full font-wrc text-sm tracking-wider transition-all ${
                pestanaActiva === 'eventos' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30' : 'text-neutral-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Eventos {esAdmin && '⚙️'}
            </button>
            <button
              onClick={() => { setPestanaActiva('fama'); setAlbumSeleccionado(null); }}
              className={`px-4 py-2 rounded-full font-wrc text-sm tracking-wider transition-all ${
                pestanaActiva === 'fama' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30' : 'text-neutral-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Salón de la Fama
            </button>
            <button
              onClick={() => { setPestanaActiva('perfil'); setAlbumSeleccionado(null); }}
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
                onClick={() => setMostrarAuthModal(true)}
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
        
        {/* 1. INICIO */}
        {pestanaActiva === 'inicio' && (
          <div className="min-h-[75vh] flex items-center justify-center">
            <div className="max-w-4xl mx-auto text-center space-y-6 py-12">
              <span className="inline-block bg-amber-500/20 text-amber-400 font-wrc text-sm tracking-widest px-4 py-1.5 rounded-full border border-amber-500/40 uppercase backdrop-blur-md shadow-lg">
                Temporada Oficial 2026 • Espíndola Competición {esAdmin && '• Modo Admin'}
              </span>

              <h1 className="font-wrc text-6xl md:text-8xl font-black tracking-tight text-white uppercase drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)]">
                PRECISIÓN, VELOCIDAD Y <span className="text-amber-400 drop-shadow-[0_0_25px_rgba(251,191,36,0.7)]">GLORIA</span>
              </h1>

              {/* BOTONES SOCIALES */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <a
                  href={config.instagram || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-neutral-900/60 backdrop-blur-md hover:bg-amber-500/20 text-amber-400 border border-amber-500/40 font-wrc text-sm px-6 py-3 rounded-full transition shadow-lg flex items-center gap-2.5 tracking-wider uppercase group"
                >
                  <svg className="w-5 h-5 fill-current group-hover:scale-110 transition" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  Instagram
                </a>

                <a
                  href={config.discord || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-neutral-900/60 backdrop-blur-md hover:bg-amber-500/20 text-amber-400 border border-amber-500/40 font-wrc text-sm px-6 py-3 rounded-full transition shadow-lg flex items-center gap-2.5 tracking-wider uppercase group"
                >
                  <svg className="w-5 h-5 fill-current group-hover:scale-110 transition" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  Discord
                </a>

                <a
                  href={config.tiktok || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-neutral-900/60 backdrop-blur-md hover:bg-amber-500/20 text-amber-400 border border-amber-500/40 font-wrc text-sm px-6 py-3 rounded-full transition shadow-lg flex items-center gap-2.5 tracking-wider uppercase group"
                >
                  <svg className="w-5 h-5 fill-current group-hover:scale-110 transition" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.5.18-1.92 1.12-3.72 2.5-5.02 1.65-1.53 3.92-2.3 6.16-2.05.02.66.02 1.32 0 1.98-.5-.1-1.02-.15-1.53-.13-1.31.05-2.55.67-3.37 1.69-.87 1.05-1.24 2.45-1.03 3.82.16 1.05.8 2.01 1.71 2.53 1.01.59 2.27.7 3.39.29 1.05-.39 1.88-1.25 2.22-2.32.18-.58.26-1.18.26-1.78.02-3.99-.01-7.98.02-11.97z"/>
                  </svg>
                  TikTok
                </a>
              </div>

              {esAdmin && (
                <div className="pt-8 max-w-xl mx-auto">
                  {!editandoConfig ? (
                    <button
                      onClick={() => setEditandoConfig(true)}
                      className="text-xs font-wrc bg-neutral-900/80 hover:bg-neutral-800 text-amber-400 border border-amber-500/40 px-5 py-2.5 rounded-xl transition shadow-md uppercase tracking-wider"
                    >
                      ⚙️ Editar Redes Sociales del Inicio
                    </button>
                  ) : (
                    <form onSubmit={handleGuardarConfig} className="bg-neutral-900/90 border border-amber-500/50 p-6 rounded-2xl text-left space-y-4 shadow-2xl backdrop-blur-md">
                      <h3 className="font-wrc text-lg text-amber-400 uppercase">Editar Enlaces de Redes Sociales</h3>
                      <div>
                        <label className="block text-xs text-neutral-400 uppercase mb-1">URL Instagram</label>
                        <input
                          type="url"
                          value={config.instagram}
                          onChange={(e) => setConfig({ ...config, instagram: e.target.value })}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-sm text-white focus:border-amber-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-400 uppercase mb-1">URL Discord</label>
                        <input
                          type="url"
                          value={config.discord}
                          onChange={(e) => setConfig({ ...config, discord: e.target.value })}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-sm text-white focus:border-amber-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-400 uppercase mb-1">URL TikTok</label>
                        <input
                          type="url"
                          value={config.tiktok}
                          onChange={(e) => setConfig({ ...config, tiktok: e.target.value })}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-sm text-white focus:border-amber-500 outline-none"
                        />
                      </div>
                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditandoConfig(false)}
                          className="text-xs font-wrc bg-neutral-800 text-neutral-300 px-4 py-2 rounded-xl"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="text-xs font-wrc bg-amber-500 text-black font-bold px-5 py-2 rounded-xl"
                        >
                          Guardar Cambios
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

            </div>
          </div>
        )}

        {/* 2. NUESTRA HISTORIA */}
        {pestanaActiva === 'historia' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div>
              <h2 className="font-wrc text-4xl text-amber-400 tracking-wide">Nuestra Historia - Espíndola Competición</h2>
              <p className="text-neutral-300 text-sm font-sans">El origen, nuestros valores y la trayectoria del equipo.</p>
            </div>

            <div className="bg-neutral-900/40 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <h3 className="font-wrc text-2xl text-white">Pasión Por El Motor y La Competición</h3>
                <p className="text-neutral-200 text-base leading-relaxed font-sans whitespace-pre-line">
                  {config.historia_texto}
                </p>
              </div>
              <div className="rounded-2xl overflow-hidden border border-amber-500/30 shadow-xl">
                <img 
                  src={config.historia_imagen || 'https://files.catbox.moe/t5ffu8.png'} 
                  alt="Historia del equipo" 
                  className="w-full h-72 object-cover hover:scale-105 transition duration-500"
                />
              </div>
            </div>

            {esAdmin && (
              <div className="bg-neutral-900/50 backdrop-blur-md border border-amber-500/50 rounded-2xl p-6 shadow-2xl space-y-4">
                <h3 className="font-wrc text-xl text-amber-400">⚙️ Editar Reseña de Historia e Imagen</h3>
                <form onSubmit={handleGuardarConfig} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">Texto de la Historia</label>
                    <textarea
                      rows={5}
                      value={config.historia_texto}
                      onChange={(e) => setConfig({ ...config, historia_texto: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 outline-none font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">Imagen Representativa (Desde PC)</label>
                    <SubirImagen currentUrl={config.historia_imagen} onUpload={(url) => setConfig({ ...config, historia_imagen: url })} />
                  </div>
                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-400 text-black font-wrc font-black text-sm uppercase px-6 py-2.5 rounded-xl transition shadow-lg shadow-amber-500/20"
                  >
                    💾 Guardar Historia
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* 3. GALERÍA DE EVENTOS */}
        {pestanaActiva === 'galeria' && (
          <div className="space-y-8">
            {!albumSeleccionado ? (
              <div className="space-y-8">
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <h2 className="font-wrc text-4xl text-amber-400 tracking-wide">Álbumes de Eventos</h2>
                    <p className="text-neutral-300 text-sm font-sans">Selecciona una carpeta para ver las fotografías oficiales de cada competencia.</p>
                  </div>
                </div>

                {esAdmin && (
                  <div className="bg-neutral-900/50 backdrop-blur-md border border-amber-500/50 rounded-2xl p-6 shadow-2xl space-y-4">
                    <h3 className="font-wrc text-xl text-amber-400">📁 Crear Nueva Carpeta de Evento</h3>
                    <form onSubmit={handleCrearAlbum} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                      <div>
                        <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">Nombre del Evento (ej: Rally Misiones)</label>
                        <input
                          type="text"
                          placeholder="Ej: Rally de Misiones"
                          value={nuevoAlbumNombre}
                          onChange={(e) => setNuevoAlbumNombre(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 outline-none font-sans"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">Foto de Portada (Desde la PC)</label>
                        <SubirImagen currentUrl={portadaAlbumUrl} onUpload={setPortadaAlbumUrl} />
                      </div>
                      <div className="md:col-span-2 flex justify-end">
                        <button
                          type="submit"
                          className="bg-amber-500 hover:bg-amber-400 text-black font-wrc font-black text-sm uppercase px-6 py-3 rounded-xl transition shadow-lg shadow-amber-500/20"
                        >
                          📂 Crear Carpeta
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {albumes.length === 0 ? (
                  <div className="text-center py-16 bg-neutral-900/40 border border-neutral-800 rounded-3xl">
                    <p className="text-neutral-400 font-sans">No hay carpetas de eventos creadas todavía.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {albumes.map((album) => (
                      <div 
                        key={album.id} 
                        onClick={() => { setAlbumSeleccionado(album); cargarFotosDeAlbum(album.id); }}
                        className="bg-neutral-900/40 backdrop-blur-md border border-white/10 hover:border-amber-500/50 rounded-2xl overflow-hidden group shadow-lg cursor-pointer transition transform hover:-translate-y-1 relative"
                      >
                        <div className="w-full h-60 overflow-hidden relative">
                          <img 
                            src={album.portada_url} 
                            alt={album.nombre} 
                            className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                          
                          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 flex items-center gap-2">
                            <span>📁</span>
                            <span className="font-wrc text-xs text-amber-400">Álbum Oficial</span>
                          </div>
                        </div>

                        <div className="p-5 absolute bottom-0 left-0 right-0 flex justify-between items-end">
                          <div>
                            <h4 className="font-wrc text-2xl text-white font-bold drop-shadow-md">{album.nombre}</h4>
                            <p className="text-neutral-300 text-xs font-sans mt-0.5">Clic para ver galería completa</p>
                          </div>
                          <span className="bg-amber-500 text-black font-wrc text-xs px-3 py-1.5 rounded-xl font-bold shadow-md">
                            Ver Fotos →
                          </span>
                        </div>

                        {esAdmin && (
                          <button
                            onClick={(e) => handleEliminarAlbum(album.id, e)}
                            className="absolute top-3 right-3 bg-red-600/80 hover:bg-red-600 text-white p-2 rounded-xl text-xs backdrop-blur-md transition shadow-md z-10"
                            title="Eliminar álbum"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex flex-wrap justify-between items-center gap-4 bg-neutral-900/60 backdrop-blur-md border border-white/10 p-6 rounded-3xl shadow-xl">
                  <div>
                    <button 
                      onClick={() => setAlbumSeleccionado(null)}
                      className="text-amber-400 font-wrc text-xs uppercase tracking-wider hover:underline mb-2 flex items-center gap-1"
                    >
                      ← Volver a todas las carpetas
                    </button>
                    <h2 className="font-wrc text-3xl text-white tracking-wide">📂 {albumSeleccionado.nombre}</h2>
                  </div>

                  {esAdmin && (
                    <label className="cursor-pointer bg-amber-500 hover:bg-amber-400 text-black font-wrc font-black text-sm uppercase px-6 py-3 rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center gap-2">
                      <span>{subiendoFotosMasivo ? '⏳ Subiendo fotos...' : '📸 + Subir Varias Fotos'}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple 
                        onChange={handleSubirFotosMultiples} 
                        disabled={subiendoFotosMasivo} 
                        className="hidden" 
                      />
                    </label>
                  )}
                </div>

                {fotosAlbumActual.length === 0 ? (
                  <div className="text-center py-16 bg-neutral-900/40 border border-neutral-800 rounded-3xl">
                    <p className="text-neutral-400 font-sans">Aún no hay fotos en este álbum.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {fotosAlbumActual.map((foto) => (
                      <div 
                        key={foto.id} 
                        onClick={() => setFotoAmpliada(foto.imagen_url)}
                        className="bg-neutral-900/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden group shadow-lg relative cursor-pointer transform hover:scale-[1.02] transition"
                      >
                        <div className="w-full h-64 overflow-hidden relative">
                          <img 
                            src={foto.imagen_url} 
                            alt="Foto Rally" 
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                            <span className="bg-black/70 text-amber-400 font-wrc text-xs px-4 py-2 rounded-xl backdrop-blur-md border border-white/10">
                              🔍 Clic para ver en alta resolución
                            </span>
                          </div>
                        </div>

                        {esAdmin && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEliminarFotoAlbum(foto.id); }}
                            className="absolute top-3 right-3 bg-red-600/80 hover:bg-red-600 text-white p-2 rounded-xl text-xs backdrop-blur-md transition shadow-md z-10"
                            title="Eliminar foto"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* 4. LIVE TIMING */}
        {pestanaActiva === 'livetiming' && (
          <div className="space-y-6">
            <div className="bg-neutral-900/40 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <div className="flex flex-wrap justify-between items-center mb-6 border-b border-neutral-800 pb-4 gap-4">
                <div>
                  <h2 className="font-wrc text-3xl text-amber-400 tracking-wide">Live Timing & Telemetría - Servidor Oficial</h2>
                  <p className="text-neutral-300 text-sm font-sans">Monitoreo en tiempo real de tramos y clasificaciones.</p>
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

        {/* 5. EVENTOS */}
        {pestanaActiva === 'eventos' && (
          <div className="space-y-8">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <h2 className="font-wrc text-4xl text-amber-400 tracking-wide">Próximos Eventos y Rallies</h2>
                <p className="text-neutral-200 text-sm font-sans">Inscribite a las fechas oficiales o consulta los inscriptos.</p>
              </div>
              {esAdmin && (
                <span className="font-wrc bg-amber-500 text-black text-xs tracking-wider font-extrabold px-4 py-2 rounded-xl shadow-lg">
                  ⚙️ Modo Administrador Activo
                </span>
              )}
            </div>

            {esAdmin && (
              <div className="bg-neutral-900/50 backdrop-blur-md border border-amber-500/50 rounded-2xl p-6 shadow-2xl relative">
                <div className="absolute top-0 right-0 bg-amber-500/20 text-amber-400 font-wrc text-xs px-3 py-1 rounded-bl-xl border-l border-b border-amber-500/30">
                  Panel de Control Exclusivo
                </div>
                <h3 className="font-wrc text-xl text-amber-400 mb-4 tracking-wider flex items-center gap-2">
                  <span>➕</span> Crear Nueva Fecha de Campeonato
                </h3>
                <form onSubmit={handleCrearEvento} className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    placeholder="Horario (ej: 21:00 hs ART)" 
                    value={nuevoEvento.horario}
                    onChange={(e) => setNuevoEvento({...nuevoEvento, horario: e.target.value})}
                    className="bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 outline-none font-sans"
                  />
                  <input 
                    type="text" 
                    placeholder="Categorías (ej: Rally4, Rally2)" 
                    value={nuevoEvento.categorias}
                    onChange={(e) => setNuevoEvento({...nuevoEvento, categorias: e.target.value})}
                    className="bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 outline-none font-sans"
                  />
                  <input 
                    type="text" 
                    placeholder="Modelos de Autos (ej: Clio, Fiesta)" 
                    value={nuevoEvento.modelos_autos}
                    onChange={(e) => setNuevoEvento({...nuevoEvento, modelos_autos: e.target.value})}
                    className="bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 outline-none font-sans"
                  />
                  <input 
                    type="text" 
                    placeholder="País de Origen de la Carrera (ej: Argentina)" 
                    value={nuevoEvento.pais_origen}
                    onChange={(e) => setNuevoEvento({...nuevoEvento, pais_origen: e.target.value})}
                    className="bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 outline-none font-sans"
                  />
                  <div className="md:col-span-3 flex justify-end">
                    <button 
                      type="submit"
                      className="bg-amber-500 hover:bg-amber-400 text-black font-wrc font-black uppercase text-sm px-6 py-3 rounded-xl transition shadow-lg shadow-amber-500/20 tracking-wider flex items-center gap-2"
                    >
                      <span>🚀 Publicar Carrera</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {eventos.map((ev) => (
                <div key={ev.id} className="bg-neutral-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-amber-500/50 transition shadow-lg relative group">
                  <div className="absolute top-4 right-4 text-amber-400 font-mono text-xs bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                    {ev.fecha} {ev.horario && `• ${ev.horario}`}
                  </div>
                  <h3 className="font-wrc text-3xl text-white mb-2 group-hover:text-amber-400 transition">{ev.titulo}</h3>
                  
                  <div className="space-y-1 text-neutral-300 text-xs font-sans mb-4">
                    {ev.categorias && <p>🏎️ Categorías: <span className="text-white font-medium">{ev.categorias}</span></p>}
                    {ev.modelos_autos && <p>🚗 Autos: <span className="text-white font-medium">{ev.modelos_autos}</span></p>}
                    {ev.pais_origen && <p>📍 Sede: <span className="text-white font-medium">{ev.pais_origen}</span></p>}
                  </div>

                  <div className="flex flex-wrap justify-between items-center pt-4 border-t border-neutral-800 gap-2">
                    <button 
                      onClick={() => { setEventoSeleccionado(ev); setModoModalInscripcion('lista'); }}
                      className="bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-amber-500/30 font-wrc text-xs uppercase px-4 py-2 rounded-xl transition flex items-center gap-1.5"
                    >
                      📋 Lista de Inscriptos
                    </button>

                    <div className="flex items-center gap-2">
                      {esAdmin && (
                        <button 
                          onClick={() => handleEliminarEvento(ev.id)}
                          className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white font-wrc text-xs uppercase px-3 py-2 rounded-xl transition border border-red-500/30"
                        >
                          🗑️
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          if (!usuario) {
                            setMostrarAuthModal(true);
                          } else {
                            setEventoSeleccionado(ev); 
                            setModoModalInscripcion('formulario');
                          }
                        }}
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

        {/* 6. SALÓN DE LA FAMA */}
        {pestanaActiva === 'fama' && (
          <div className="space-y-10">
            <div className="flex flex-wrap justify-between items-end gap-6 border-b border-white/10 pb-6">
              <div>
                <h2 className="font-wrc text-3xl md:text-4xl text-amber-400 tracking-wide">Salón de la Fama - Podio de Campeones</h2>
                <p className="text-neutral-300 text-xs md:text-sm font-sans">Los pilotos con más títulos oficiales en la historia de Espíndola Competición.</p>
              </div>

              {/* TARJETA CONTADOR DE CAMPEONATOS TOTALES */}
              <div className="bg-gradient-to-r from-neutral-900/80 via-neutral-900/60 to-neutral-950/80 backdrop-blur-md border border-amber-500/40 rounded-2xl px-5 py-3 flex items-center gap-4 shadow-2xl">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl shadow-inner">
                  🏆
                </div>
                <div>
                  <span className="block text-[10px] font-wrc text-neutral-400 tracking-widest uppercase">
                    Campeonatos en Total
                  </span>
                  <span className="font-wrc text-3xl font-black text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]">
                    {totalCampeonatosEquipo} <span className="text-base text-white font-normal">Títulos</span>
                  </span>
                </div>
              </div>
            </div>

            {esAdmin && (
              <div className="bg-neutral-900/50 backdrop-blur-md border border-amber-500/50 rounded-2xl p-6 shadow-2xl relative">
                <div className="absolute top-0 right-0 bg-amber-500/20 text-amber-400 font-wrc text-xs px-3 py-1 rounded-bl-xl border-l border-b border-amber-500/30">
                  {editandoId !== null ? '✏️ Modo Edición Activo' : 'Panel de Control Exclusivo'}
                </div>
                <h3 className="font-wrc text-xl text-amber-400 mb-4 tracking-wider flex items-center gap-2">
                  <span>🏆</span> {editandoId !== null ? 'Actualizar Campeón' : 'Registrar Nuevo Campeón'}
                </h3>
                <form onSubmit={handleGuardarPilotoFama} className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    placeholder="Categoría" 
                    value={nuevoPilotoFama.categoria}
                    onChange={(e) => setNuevoPilotoFama({...nuevoPilotoFama, categoria: e.target.value})}
                    className="bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 outline-none font-sans"
                  />
                  <input 
                    type="number" 
                    placeholder="Campeonatos" 
                    value={nuevoPilotoFama.campeonatos}
                    onChange={(e) => setNuevoPilotoFama({...nuevoPilotoFama, campeonatos: e.target.value})}
                    className="bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 outline-none font-sans"
                    required
                  />
                  
                  <div className="md:col-span-4">
                    <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">Foto del Piloto (Desde la PC)</label>
                    <SubirImagen currentUrl={nuevoPilotoFama.foto} onUpload={(url) => setNuevoPilotoFama({...nuevoPilotoFama, foto: url})} />
                  </div>

                  <div className="md:col-span-4 flex items-center justify-end gap-3">
                    {editandoId !== null && (
                      <button 
                        type="button"
                        onClick={() => { setEditandoId(null); setNuevoPilotoFama({ nombre: '', categoria: '', campeonatos: '', foto: '' }); }}
                        className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-wrc text-sm px-5 py-3 rounded-xl transition"
                      >
                        Cancelar Edición
                      </button>
                    )}
                    <button 
                      type="submit"
                      className="bg-amber-500 hover:bg-amber-400 text-black font-wrc font-black uppercase text-sm px-6 py-3 rounded-xl transition shadow-lg shadow-amber-500/20 tracking-wider"
                    >
                      {editandoId !== null ? '💾 Guardar Cambios' : '➕ Añadir'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center pt-2 max-w-4xl mx-auto">
              {top3[1] && (
                <div className="bg-neutral-900/40 backdrop-blur-md border border-neutral-700 rounded-2xl p-5 text-center shadow-xl relative order-2 md:order-1">
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-neutral-400 text-black font-wrc font-bold text-xs px-3 py-0.5 rounded-full shadow-md border border-white">
                    🥈 2º PUESTO
                  </div>
                  <div className="w-20 h-20 mx-auto rounded-full bg-neutral-800 border-2 border-neutral-400 overflow-hidden mb-3 shadow-lg mt-1">
                    <img src={top3[1].foto || 'https://files.catbox.moe/f3xmld.png'} alt={top3[1].nombre} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="font-wrc text-xl text-white font-bold">{top3[1].nombre}</h3>
                  <p className="text-neutral-300 text-[11px] font-sans mt-0.5">{top3[1].categoria}</p>
                  <div className="mt-3 bg-neutral-950/60 border border-neutral-800 py-1.5 px-3 rounded-xl inline-block">
                    <span className="text-neutral-400 text-[10px] uppercase font-sans">Títulos: </span>
                    <strong className="text-white font-wrc text-base">{top3[1].campeonatos} 🏆</strong>
                  </div>
                  {esAdmin && (
                    <div className="mt-3 flex items-center justify-center gap-2 font-sans text-[11px]">
                      <button onClick={() => handleEditarPilotoFama(top3[1])} className="text-amber-400 hover:underline font-bold">✏️ Editar</button>
                      <button onClick={() => handleEliminarPilotoFama(top3[1].id)} className="text-red-400 hover:underline">🗑️ Eliminar</button>
                    </div>
                  )}
                </div>
              )}

              {top3[0] && (
                <div className="bg-gradient-to-b from-amber-500/15 via-neutral-900/50 to-neutral-950/70 backdrop-blur-md border-2 border-amber-500 rounded-2xl p-6 text-center shadow-2xl relative order-1 md:order-2 transform md:-translate-y-3">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-black font-wrc font-black text-xs px-4 py-1 rounded-full shadow-lg border-2 border-white tracking-widest">
                    🥇 1º PUESTO
                  </div>
                  <div className="w-24 h-24 mx-auto rounded-full bg-neutral-800 border-3 border-amber-400 overflow-hidden mb-3 shadow-xl mt-1">
                    <img src={top3[0].foto || 'https://files.catbox.moe/f3xmld.png'} alt={top3[0].nombre} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="font-wrc text-2xl text-amber-400 font-black">{top3[0].nombre}</h3>
                  <p className="text-neutral-200 text-[11px] font-sans mt-0.5">{top3[0].categoria}</p>
                  <div className="mt-3 bg-amber-500/10 border border-amber-500/40 py-2 px-4 rounded-xl inline-block shadow-inner">
                    <span className="text-amber-300 text-[10px] uppercase font-sans">Títulos Absolutos: </span>
                    <strong className="text-amber-400 font-wrc text-lg">{top3[0].campeonatos} 🏆</strong>
                  </div>
                  {esAdmin && (
                    <div className="mt-3 flex items-center justify-center gap-2 font-sans text-[11px]">
                      <button onClick={() => handleEditarPilotoFama(top3[0])} className="text-amber-400 hover:underline font-bold">✏️ Editar</button>
                      <button onClick={() => handleEliminarPilotoFama(top3[0].id)} className="text-red-400 hover:underline">🗑️ Eliminar</button>
                    </div>
                  )}
                </div>
              )}

              {top3[2] && (
                <div className="bg-neutral-900/40 backdrop-blur-md border border-amber-700/50 rounded-2xl p-5 text-center shadow-xl relative order-3">
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-700 text-white font-wrc font-bold text-xs px-3 py-0.5 rounded-full shadow-md border border-white">
                    🥉 3º PUESTO
                  </div>
                  <div className="w-20 h-20 mx-auto rounded-full bg-neutral-800 border-2 border-amber-700 overflow-hidden mb-3 shadow-lg mt-1">
                    <img src={top3[2].foto || 'https://files.catbox.moe/f3xmld.png'} alt={top3[2].nombre} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="font-wrc text-xl text-white font-bold">{top3[2].nombre}</h3>
                  <p className="text-neutral-300 text-[11px] font-sans mt-0.5">{top3[2].categoria}</p>
                  <div className="mt-3 bg-neutral-950/60 border border-neutral-800 py-1.5 px-3 rounded-xl inline-block">
                    <span className="text-neutral-400 text-[10px] uppercase font-sans">Títulos: </span>
                    <strong className="text-amber-500 font-wrc text-base">{top3[2].campeonatos} 🏆</strong>
                  </div>
                  {esAdmin && (
                    <div className="mt-3 flex items-center justify-center gap-2 font-sans text-[11px]">
                      <button onClick={() => handleEditarPilotoFama(top3[2])} className="text-amber-400 hover:underline font-bold">✏️ Editar</button>
                      <button onClick={() => handleEliminarPilotoFama(top3[2].id)} className="text-red-400 hover:underline">🗑️ Eliminar</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {restoPilotos.length > 0 && (
              <div className="space-y-4 pt-6 max-w-4xl mx-auto">
                <h3 className="font-wrc text-xl text-amber-400 tracking-wide border-b border-neutral-800 pb-2">
                  Resto del Salón de la Fama
                </h3>
                
                <div className="bg-neutral-900/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                  <div className="divide-y divide-neutral-800">
                    {restoPilotos.map((piloto) => (
                      <div key={piloto.id} className="flex items-center justify-between p-3.5 hover:bg-white/5 transition">
                        <div className="flex items-center gap-3">
                          <span className="font-wrc text-lg font-bold text-amber-500 w-6 text-center">
                            #{piloto.puesto}
                          </span>
                          <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 overflow-hidden flex-shrink-0">
                            <img src={piloto.foto || 'https://files.catbox.moe/f3xmld.png'} alt={piloto.nombre} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h4 className="font-wrc text-base text-white font-bold">{piloto.nombre}</h4>
                            <p className="text-neutral-400 text-[11px] font-sans">{piloto.categoria}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-full text-xs font-wrc font-bold">
                            {piloto.campeonatos} 🏆 Título{piloto.campeonatos > 1 ? 's' : ''}
                          </span>
                          {esAdmin && (
                            <div className="flex items-center gap-2 font-sans text-xs">
                              <button 
                                onClick={() => handleEditarPilotoFama(piloto)}
                                className="text-amber-400 hover:underline font-bold px-1"
                              >
                                ✏️ Editar
                              </button>
                              <button 
                                onClick={() => handleEliminarPilotoFama(piloto.id)}
                                className="text-red-400 hover:underline px-1"
                              >
                                🗑️ Eliminar
                              </button>
                            </div>
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

        {/* 7. PERFIL DE USUARIO */}
        {pestanaActiva === 'perfil' && (
          <div className="max-w-2xl mx-auto bg-neutral-900/50 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl">
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
              <span className="mt-3 bg-white/5 text-neutral-200 px-4 py-1 rounded-full text-xs font-semibold border border-white/10 font-sans">
                Nacionalidad: {perfil?.nacionalidad || 'No especificada'}
              </span>
            </div>

            <div className="py-6 space-y-4">
              <div className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-4 flex justify-between items-center font-sans">
                <span className="text-neutral-300 text-sm">Steam ID 64:</span>
                <span className="font-mono text-amber-400 text-sm">{perfil?.steam_id || 'No vinculado'}</span>
              </div>
              <div className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-4 flex justify-between items-center font-sans">
                <span className="text-neutral-300 text-sm">Estado de Licencia:</span>
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

      {/* MODAL LIGHTBOX EN ALTA RESOLUCIÓN */}
      {fotoAmpliada && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex flex-col items-center justify-center p-4 md:p-8"
          onClick={() => setFotoAmpliada(null)}
        >
          <div className="relative max-w-7xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img 
              src={fotoAmpliada} 
              alt="Foto Alta Resolución" 
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl border border-amber-500/30 bg-neutral-950" 
            />
            
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 bg-neutral-900/90 border border-white/10 px-6 py-3 rounded-2xl shadow-xl backdrop-blur-md">
              <span className="text-xs text-neutral-300 font-sans hidden sm:inline">Visualización en resolución original</span>
              <a 
                href={fotoAmpliada} 
                download={`espindola_competicion_${Date.now()}.png`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-amber-500 hover:bg-amber-400 text-black font-wrc text-sm px-6 py-2.5 rounded-xl transition font-bold shadow-md flex items-center gap-2"
              >
                <span>⬇️ Descargar Imagen Original</span>
              </a>
              <button 
                onClick={() => setFotoAmpliada(null)}
                className="bg-neutral-800 hover:bg-neutral-700 text-white font-wrc text-sm px-5 py-2.5 rounded-xl transition"
              >
                Cerrar ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarAuthModal && (
        <AuthModal onClose={() => setMostrarAuthModal(false)} />
      )}

      {mostrarCambiarPasswordModal && (
        <CambiarPasswordModal onClose={() => setMostrarCambiarPasswordModal(false)} />
      )}

      {mostrarPerfilModal && (
        <PerfilModal 
          usuario={usuario} 
          onClose={() => setMostrarPerfilModal(false)} 
          onPerfilGuardado={() => verificarAdminYPerfil(usuario)}
        />
      )}

      {eventoSeleccionado && (
        <InscripcionModal
          evento={eventoSeleccionado}
          modo={modoModalInscripcion}
          perfil={perfil}
          usuario={usuario}
          onClose={() => setEventoSeleccionado(null)}
        />
      )}
    </div>
  );
}
