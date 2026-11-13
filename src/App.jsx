import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import PerfilModal from './PerfilModal';
import InscripcionModal from './InscripcionModal';
import AuthModal from './AuthModal';
import CambiarPasswordModal from './CambiarPasswordModal';
import SubirImagen from './SubirImagen';

const fotosRally = [
  '/fondo.jpg' // Cambialo por el nombre exacto de tu imagen en public
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

  // ESTADOS DE MENÚS DESPLEGABLES (HUD)
  const [menuPrincipalAbierto, setMenuPrincipalAbierto] = useState(false);
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);

  // CONFIGURACIÓN SOCIAL E HISTORIA (CON DOS FOTOS: RALLY Y CIRCUITO)
  const [config, setConfig] = useState({
    instagram: 'https://instagram.com',
    discord: 'https://discord.gg',
    tiktok: 'https://tiktok.com',
    historia_texto: 'Espíndola Competición abarca tanto la alta competencia en rally como el rendimiento en circuito, combinando telemetría, puesta a punto y constancia.',
    historia_imagen: 'https://files.catbox.moe/t5ffu8.png',
    historia_imagen_2: 'https://files.catbox.moe/pfh5gw.png'
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

  // EVENTOS Y CALENDARIO
  const [eventos, setEventos] = useState([]);
  const [calendario, setCalendario] = useState([]);
  const [nuevoEvento, setNuevoEvento] = useState({
    titulo: '',
    fecha: '',
    horario: '',
    categorias: '',
    modelos_autos: '',
    pais_origen: 'Argentina 🇦🇷'
  });
  const [nuevoCalendario, setNuevoCalendario] = useState({
    titulo: '',
    fecha: '',
    descripcion: ''
  });

  // MODAL INSCRIPCIÓN
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [modoModalInscripcion, setModoModalInscripcion] = useState('formulario');

  // SALÓN DE LA FAMA
  const [hallFama, setHallFama] = useState([]);
  const [nuevoPilotoFama, setNuevoPilotoFama] = useState({ nombre: '', categoria: '', campeonatos: '', foto: '' });
  const [editandoId, setEditandoId] = useState(null);

  // MIEMBROS REGISTRADOS
  const [miembros, setMiembros] = useState([]);

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
    cargarCalendario();
    cargarSalónDeLaFama();
    cargarMiembros();

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

  async function cargarCalendario() {
    const { data } = await supabase.from('calendario').select('*').order('fecha', { ascending: true });
    if (data) setCalendario(data);
  }

  async function cargarSalónDeLaFama() {
    const { data } = await supabase.from('salon_fama').select('*').order('campeonatos', { ascending: false });
    if (data) {
      const listaConPuestos = data.map((p, idx) => ({ ...p, puesto: idx + 1 }));
      setHallFama(listaConPuestos);
    }
  }

  async function cargarMiembros() {
    const { data } = await supabase.from('perfiles').select('*');
    if (data) setMiembros(data);
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

  const handleCrearCalendario = async (e) => {
    e.preventDefault();
    if (!nuevoCalendario.titulo || !nuevoCalendario.fecha) return;

    const { error } = await supabase.from('calendario').insert([nuevoCalendario]);

    if (error) {
      alert('Error al crear fecha de calendario: ' + error.message);
    } else {
      setNuevoCalendario({ titulo: '', fecha: '', descripcion: '' });
      cargarCalendario();
    }
  };

  const handleEliminarCalendario = async (id) => {
    if (!confirm('¿Eliminar esta fecha del calendario?')) return;
    const { error } = await supabase.from('calendario').delete().eq('id', id);
    if (!error) cargarCalendario();
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
    <div className="min-h-screen bg-[#050505] text-white font-sans relative overflow-x-hidden selection:bg-amber-500 selection:text-black flex flex-col justify-between">
      
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
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/10 to-black/80 pointer-events-none"></div>
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

      {/* ENCABEZADO / HUD FLOTANTE */}
      <header className="relative z-50 w-full max-w-[1600px] mx-auto px-6 pt-6 flex flex-wrap items-center justify-between gap-4">
        
        {/* Izquierda: Logo del equipo más sutil y pequeño (/logo.svg) */}
        <button 
          onClick={() => { setPestanaActiva('inicio'); setAlbumSeleccionado(null); }}
          className="cursor-pointer group flex items-center focus:outline-none"
          title="Ir al inicio"
        >
          <img 
            src="/logo.svg" 
            alt="Logo Espíndola Competición" 
            onError={(e) => { e.target.src = 'https://files.catbox.moe/f3xmld.png'; }}
            className="h-9 md:h-10 w-auto object-contain group-hover:scale-105 transition drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] opacity-90"
          />
        </button>

        {/* Centro: Píldora de Navegación + Menú Hamburguesa */}
        <div className="relative">
          <nav className="flex items-center gap-4 md:gap-6 px-6 md:px-8 py-3 rounded-full bg-black/45 backdrop-blur-md border border-white/45 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            {[
              { id: 'historia', label: 'HISTORIA' },
              { id: 'eventos', label: `EVENTOS${esAdmin ? ' ⚙️' : ''}` },
              { id: 'livetiming', label: 'LIVETIMING' },
              { id: 'fama', label: 'SALON DE LA FAMA' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => { setPestanaActiva(item.id); setAlbumSeleccionado(null); setMenuPrincipalAbierto(false); }}
                className={`text-xs md:text-sm font-wrc tracking-wider transition cursor-pointer ${
                  pestanaActiva === item.id ? 'text-amber-400' : 'text-white hover:text-white/75'
                }`}
              >
                {item.label}
              </button>
            ))}

            <button
              onClick={() => {
                setMenuPrincipalAbierto(!menuPrincipalAbierto);
                setMenuUsuarioAbierto(false);
              }}
              className="pl-2 text-white hover:text-amber-400 transition cursor-pointer focus:outline-none"
              aria-label="Más secciones"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </nav>

          {menuPrincipalAbierto && (
            <div className="absolute right-0 mt-3 w-52 rounded-2xl bg-black/75 backdrop-blur-xl border border-white/45 shadow-2xl py-4 px-5 flex flex-col items-center gap-3.5 z-50">
              <button
                onClick={() => { setPestanaActiva('calendario'); setAlbumSeleccionado(null); setMenuPrincipalAbierto(false); }}
                className={`text-sm font-wrc tracking-wider transition cursor-pointer ${pestanaActiva === 'calendario' ? 'text-amber-400' : 'text-white hover:text-amber-300'}`}
              >
                CALENDARIO
              </button>
              <button
                onClick={() => { setPestanaActiva('galeria'); setAlbumSeleccionado(null); setMenuPrincipalAbierto(false); }}
                className={`text-sm font-wrc tracking-wider transition cursor-pointer ${pestanaActiva === 'galeria' ? 'text-amber-400' : 'text-white hover:text-amber-300'}`}
              >
                GALERIA
              </button>
              <button
                onClick={() => { setPestanaActiva('miembros'); setAlbumSeleccionado(null); setMenuPrincipalAbierto(false); }}
                className={`text-sm font-wrc tracking-wider transition cursor-pointer ${pestanaActiva === 'miembros' ? 'text-amber-400' : 'text-white hover:text-amber-300'}`}
              >
                MIEMBROS
              </button>
            </div>
          )}
        </div>

        {/* Derecha: Píldora de Usuario */}
        <div className="relative">
          {usuario ? (
            <div className="flex items-center gap-3 pl-2 pr-5 py-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/45 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
              <button 
                onClick={() => setMostrarPerfilModal(true)}
                className="flex items-center gap-2.5 group cursor-pointer focus:outline-none"
              >
                <div className="w-9 h-9 rounded-full bg-neutral-900 border border-amber-500/50 flex items-center justify-center overflow-hidden font-wrc text-amber-400 text-xs">
                  {perfil?.avatar_url ? (
                    <img src={perfil.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    perfil?.nombre_piloto ? perfil.nombre_piloto.charAt(0).toUpperCase() : 'E'
                  )}
                </div>
                <span className="font-wrc text-xs md:text-sm tracking-wider text-white group-hover:text-amber-400 transition">
                  {perfil?.nombre_piloto || usuario.email.split('@')[0]}
                </span>
              </button>
              
              <button
                onClick={() => {
                  setMenuUsuarioAbierto(!menuUsuarioAbierto);
                  setMenuPrincipalAbierto(false);
                }}
                className="pl-1 text-white hover:text-amber-400 transition cursor-pointer focus:outline-none"
                aria-label="Menú de usuario"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setMostrarAuthModal(true)}
              className="bg-amber-500 hover:bg-amber-400 text-black font-wrc text-sm px-6 py-2.5 rounded-full transition shadow-lg shadow-amber-500/20 tracking-wider cursor-pointer"
            >
              Acceder
            </button>
          )}

          {usuario && menuUsuarioAbierto && (
            <div className="absolute right-0 mt-3 w-52 rounded-2xl bg-black/75 backdrop-blur-xl border border-white/45 shadow-2xl py-4 px-5 flex flex-col items-center gap-3.5 z-50">
              <button
                onClick={() => { setPestanaActiva('perfil'); setMenuUsuarioAbierto(false); }}
                className="text-sm font-wrc tracking-wider transition text-white hover:text-amber-300 cursor-pointer"
              >
                MI PERFIL
              </button>
              <button
                onClick={() => { setMostrarPerfilModal(true); setMenuUsuarioAbierto(false); }}
                className="text-sm font-wrc tracking-wider transition text-white hover:text-amber-300 cursor-pointer"
              >
                CONFIGURACION
              </button>
              <button
                onClick={() => { handleLogout(); setMenuUsuarioAbierto(false); }}
                className="text-sm font-wrc tracking-wider transition text-red-400 hover:text-red-300 cursor-pointer"
              >
                SALIR
              </button>
            </div>
          )}
        </div>

      </header>

      {/* CONTENIDO PRINCIPAL DINÁMICO */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-10 flex-1 w-full">
        
        {/* 1. INICIO */}
        {pestanaActiva === 'inicio' && (
          <div className="min-h-[65vh] flex flex-col items-center justify-center">
            <div className="max-w-xl mx-auto text-center space-y-6 py-12">
              <span className="inline-block bg-amber-500/20 text-amber-400 font-wrc text-sm tracking-widest px-4 py-1.5 rounded-full border border-amber-500/40 uppercase backdrop-blur-md shadow-lg">
                Temporada Oficial 2026 • Espíndola Competición {esAdmin && '• Modo Admin'}
              </span>

              <h1 className="font-wrc text-6xl md:text-8xl font-black tracking-tight text-white uppercase drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)]">
                PRECISIÓN, VELOCIDAD Y <span className="text-amber-400 drop-shadow-[0_0_25px_rgba(251,191,36,0.7)]">GLORIA</span>
              </h1>

              {esAdmin && (
                <div className="pt-2 max-w-xl mx-auto">
                  {!editandoConfig ? (
                    <button
                      onClick={() => setEditandoConfig(true)}
                      className="text-xs font-wrc bg-neutral-900/80 hover:bg-neutral-800 text-amber-400 border border-amber-500/40 px-5 py-2.5 rounded-xl transition shadow-md uppercase tracking-wider cursor-pointer"
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
                          className="text-xs font-wrc bg-neutral-800 text-neutral-300 px-4 py-2 rounded-xl cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="text-xs font-wrc bg-amber-500 text-black font-bold px-5 py-2 rounded-xl cursor-pointer"
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
            <div className="bg-neutral-900/50 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
              <p className="text-neutral-100 text-base md:text-lg leading-relaxed font-sans whitespace-pre-line">
                {config.historia_texto}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/10">
                <div className="space-y-2">
                  <span className="text-xs font-wrc text-amber-400 uppercase tracking-widest">Foto 1 (Rally)</span>
                  <div className="rounded-2xl overflow-hidden border border-amber-500/30 shadow-xl h-56 bg-neutral-950">
                    <img 
                      src={config.historia_imagen || 'https://files.catbox.moe/t5ffu8.png'} 
                      alt="Rally Espíndola" 
                      className="w-full h-full object-cover hover:scale-105 transition duration-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-wrc text-amber-400 uppercase tracking-widest">Foto 2 (Circuito)</span>
                  <div className="rounded-2xl overflow-hidden border border-amber-500/30 shadow-xl h-56 bg-neutral-950">
                    <img 
                      src={config.historia_imagen_2 || 'https://files.catbox.moe/pfh5gw.png'} 
                      alt="Circuito Espíndola" 
                      className="w-full h-full object-cover hover:scale-105 transition duration-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {esAdmin && (
              <div className="bg-neutral-900/70 backdrop-blur-md border border-amber-500/50 rounded-2xl p-6 shadow-2xl space-y-4">
                <h3 className="font-wrc text-xl text-amber-400">⚙️ Administrar Sección Historia</h3>
                <form onSubmit={handleGuardarConfig} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">Texto Principal</label>
                    <textarea
                      rows={5}
                      value={config.historia_texto}
                      onChange={(e) => setConfig({ ...config, historia_texto: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 outline-none font-sans"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">Foto 1 (Rally)</label>
                      <SubirImagen currentUrl={config.historia_imagen} onUpload={(url) => setConfig({ ...config, historia_imagen: url })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">Foto 2 (Circuito)</label>
                      <SubirImagen currentUrl={config.historia_imagen_2} onUpload={(url) => setConfig({ ...config, historia_imagen_2: url })} />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-400 text-black font-wrc font-black text-sm uppercase px-6 py-2.5 rounded-xl transition shadow-lg shadow-amber-500/20 cursor-pointer"
                  >
                    💾 Guardar Cambios de Historia
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* 3. CALENDARIO */}
        {pestanaActiva === 'calendario' && (
          <div className="space-y-8 max-w-5xl mx-auto">
            <div>
              <h2 className="font-wrc text-4xl text-amber-400 tracking-wide">Calendario Oficial</h2>
              <p className="text-neutral-300 text-sm font-sans">Fechas y cronograma general de la temporada.</p>
            </div>

            {esAdmin && (
              <div className="bg-neutral-900/60 backdrop-blur-md border border-amber-500/50 rounded-2xl p-6 shadow-2xl space-y-4">
                <h3 className="font-wrc text-xl text-amber-400">➕ Agregar Fecha al Calendario</h3>
                <form onSubmit={handleCrearCalendario} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-xs text-neutral-300 uppercase mb-1 font-bold">Título / Fecha</label>
                    <input
                      type="text"
                      value={nuevoCalendario.titulo}
                      onChange={(e) => setNuevoCalendario({ ...nuevoCalendario, titulo: e.target.value })}
                      placeholder="Ej: Gran Premio Apertura"
                      required
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2 text-sm text-white focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-300 uppercase mb-1 font-bold">Fecha</label>
                    <input
                      type="date"
                      value={nuevoCalendario.fecha}
                      onChange={(e) => setNuevoCalendario({ ...nuevoCalendario, fecha: e.target.value })}
                      required
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2 text-sm text-white focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <button
                      type="submit"
                      className="w-full bg-amber-500 hover:bg-amber-400 text-black font-wrc text-sm uppercase py-2.5 rounded-xl transition shadow-lg cursor-pointer font-black"
                    >
                      Guardar en Calendario
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-4">
              {calendario.length === 0 ? (
                <p className="text-neutral-400 text-center py-8">No hay fechas cargadas en el calendario todavía.</p>
              ) : (
                calendario.map((cal) => (
                  <div key={cal.id} className="bg-neutral-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl flex justify-between items-center">
                    <div>
                      <span className="text-amber-400 font-wrc text-xs tracking-widest uppercase">{cal.fecha}</span>
                      <h3 className="font-wrc text-2xl text-white mt-1">{cal.titulo}</h3>
                    </div>
                    {esAdmin && (
                      <button
                        onClick={() => handleEliminarCalendario(cal.id)}
                        className="bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-2 rounded-xl text-xs border border-red-500/30 cursor-pointer"
                      >
                        🗑️ Eliminar
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 4. GALERÍA DE EVENTOS */}
        {pestanaActiva === 'galeria' && (
          <div className="space-y-8 max-w-6xl mx-auto">
            {!albumSeleccionado ? (
              <div className="space-y-8">
                <div>
                  <h2 className="font-wrc text-4xl text-amber-400 tracking-wide">Álbumes de Eventos</h2>
                  <p className="text-neutral-300 text-sm font-sans">Selecciona una carpeta para ver las fotografías oficiales de cada competencia.</p>
                </div>

                {esAdmin && (
                  <div className="bg-neutral-900/60 backdrop-blur-md border border-amber-500/50 rounded-2xl p-6 shadow-2xl space-y-4">
                    <h3 className="font-wrc text-xl text-amber-400">📁 Crear Nueva Carpeta de Evento</h3>
                    <form onSubmit={handleCrearAlbum} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div>
                        <label className="block text-xs text-neutral-300 uppercase mb-1 font-bold">Nombre del Álbum / Evento</label>
                        <input
                          type="text"
                          value={nuevoAlbumNombre}
                          onChange={(e) => setNuevoAlbumNombre(e.target.value)}
                          placeholder="Ej: Rally de Córdoba 2026"
                          className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-300 uppercase mb-1 font-bold">Foto de Portada</label>
                        <SubirImagen currentUrl={portadaAlbumUrl} onUpload={(url) => setPortadaAlbumUrl(url)} />
                      </div>
                      <div>
                        <button
                          type="submit"
                          className="w-full bg-amber-500 hover:bg-amber-400 text-black font-wrc font-black text-sm uppercase px-6 py-2.5 rounded-xl transition shadow-lg cursor-pointer"
                        >
                          Crear Álbum
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {albumes.map((album) => (
                    <div
                      key={album.id}
                      onClick={() => { setAlbumSeleccionado(album); cargarFotosDeAlbum(album.id); }}
                      className="group relative bg-neutral-900/50 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl cursor-pointer hover:border-amber-500/50 transition duration-300"
                    >
                      <div className="h-48 overflow-hidden relative">
                        <img
                          src={album.portada_url}
                          alt={album.nombre}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                      </div>
                      <div className="p-5 flex justify-between items-center">
                        <h3 className="font-wrc text-xl text-white group-hover:text-amber-400 transition">{album.nombre}</h3>
                        {esAdmin && (
                          <button
                            onClick={(e) => handleEliminarAlbum(album.id, e)}
                            className="text-red-400 hover:text-red-300 text-xs px-3 py-1 bg-red-500/10 rounded-lg border border-red-500/30 cursor-pointer"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex flex-wrap justify-between items-center gap-4 border-b border-white/10 pb-4">
                  <div>
                    <button
                      onClick={() => setAlbumSeleccionado(null)}
                      className="text-xs font-wrc text-amber-400 hover:underline mb-1 inline-block cursor-pointer"
                    >
                      ← Volver a Álbumes
                    </button>
                    <h2 className="font-wrc text-4xl text-white">{albumSeleccionado.nombre}</h2>
                  </div>

                  {esAdmin && (
                    <div className="flex items-center gap-3">
                      <label className={`bg-amber-500 hover:bg-amber-400 text-black font-wrc text-sm px-5 py-2.5 rounded-xl transition shadow-lg cursor-pointer ${subiendoFotosMasivo ? 'opacity-50 pointer-events-none' : ''}`}>
                        {subiendoFotosMasivo ? 'Subiendo fotos...' : '📷 Subir Fotos al Álbum'}
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleSubirFotosMultiples}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {fotosAlbumActual.map((foto) => (
                    <div key={foto.id} className="relative group bg-neutral-900 rounded-xl overflow-hidden border border-white/10 aspect-video">
                      <img
                        src={foto.imagen_url}
                        alt="Foto competencia"
                        onClick={() => setFotoAmpliada(foto.imagen_url)}
                        className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition duration-300"
                      />
                      {esAdmin && (
                        <button
                          onClick={() => handleEliminarFotoAlbum(foto.id)}
                          className="absolute top-2 right-2 bg-red-600/80 hover:bg-red-600 text-white p-1.5 rounded-lg text-xs shadow transition opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Eliminar foto"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. LIVETIMING */}
        {pestanaActiva === 'livetiming' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            <div>
              <h2 className="font-wrc text-4xl text-amber-400 tracking-wide">Live Timing Oficial</h2>
              <p className="text-neutral-300 text-sm font-sans">Sigue en tiempo real las clasificaciones y tiempos de nuestras competencias.</p>
            </div>
            <div className="bg-neutral-900/40 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-2xl h-[70vh]">
              <iframe
                src="https://espindolacompeticion.assettocloud.com/live-timing"
                className="w-full h-full border-0"
                title="Live Timing Assetto Hosting"
              />
            </div>
          </div>
        )}

        {/* 6. EVENTOS */}
        {pestanaActiva === 'eventos' && (
          <div className="space-y-8 max-w-5xl mx-auto">
            <div>
              <h2 className="font-wrc text-4xl text-amber-400 tracking-wide">Inscripciones y Campeonatos</h2>
              <p className="text-neutral-300 text-sm font-sans">Fechas activas para anotarte a competir.</p>
            </div>

            {esAdmin && (
              <div className="bg-neutral-900/60 backdrop-blur-md border border-amber-500/50 rounded-2xl p-6 shadow-2xl space-y-4">
                <h3 className="font-wrc text-xl text-amber-400">➕ Crear Nuevo Evento / Inscripción</h3>
                <form onSubmit={handleCrearEvento} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-neutral-300 uppercase mb-1 font-bold">Título del Evento</label>
                    <input
                      type="text"
                      value={nuevoEvento.titulo}
                      onChange={(e) => setNuevoEvento({ ...nuevoEvento, titulo: e.target.value })}
                      placeholder="Ej: Fecha 1 - Rally MIT CUP"
                      required
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2 text-sm text-white focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-300 uppercase mb-1 font-bold">Fecha</label>
                    <input
                      type="date"
                      value={nuevoEvento.fecha}
                      onChange={(e) => setNuevoEvento({ ...nuevoEvento, fecha: e.target.value })}
                      required
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2 text-sm text-white focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-300 uppercase mb-1 font-bold">Horario</label>
                    <input
                      type="text"
                      value={nuevoEvento.horario}
                      onChange={(e) => setNuevoEvento({ ...nuevoEvento, horario: e.target.value })}
                      placeholder="Ej: 21:00 hs (Arg)"
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2 text-sm text-white focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-300 uppercase mb-1 font-bold">Categorías</label>
                    <input
                      type="text"
                      value={nuevoEvento.categorias}
                      onChange={(e) => setNuevoEvento({ ...nuevoEvento, categorias: e.target.value })}
                      placeholder="Ej: Rally2 / Rally4"
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2 text-sm text-white focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-300 uppercase mb-1 font-bold">Modelos de Autos</label>
                    <input
                      type="text"
                      value={nuevoEvento.modelos_autos}
                      onChange={(e) => setNuevoEvento({ ...nuevoEvento, modelos_autos: e.target.value })}
                      placeholder="Ej: Skoda Fabia / Peugeot 208"
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2 text-sm text-white focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full bg-amber-500 hover:bg-amber-400 text-black font-wrc text-sm uppercase py-2.5 rounded-xl transition shadow-lg cursor-pointer font-black"
                    >
                      Publicar Evento
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-4">
              {eventos.map((ev) => (
                <div key={ev.id} className="bg-neutral-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-1">
                    <span className="text-amber-400 font-wrc text-xs tracking-widest uppercase">{ev.fecha} • {ev.horario || 'Por confirmar'}</span>
                    <h3 className="font-wrc text-2xl text-white">{ev.titulo}</h3>
                    <p className="text-neutral-300 text-xs font-sans">Categorías: {ev.categorias || 'General'} | Autos: {ev.modelos_autos || 'Libre'}</p>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <button
                      onClick={() => { setEventoSeleccionado(ev); setModoModalInscripcion('formulario'); }}
                      className="bg-amber-500 hover:bg-amber-400 text-black font-wrc text-xs px-6 py-2.5 rounded-xl transition shadow tracking-wider cursor-pointer font-black uppercase"
                    >
                      Inscribirse
                    </button>

                    <button
                      onClick={() => { setEventoSeleccionado(ev); setModoModalInscripcion('lista'); }}
                      className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-wrc text-xs px-5 py-2.5 rounded-xl transition cursor-pointer uppercase"
                    >
                      Ver Inscriptos
                    </button>

                    {esAdmin && (
                      <button
                        onClick={() => handleEliminarEvento(ev.id)}
                        className="bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-2.5 rounded-xl text-xs border border-red-500/30 cursor-pointer"
                        title="Eliminar evento"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. SALÓN DE LA FAMA - PODIO ESCALONADO */}
        {pestanaActiva === 'fama' && (
          <div className="space-y-12 max-w-6xl mx-auto">
            
            {/* Encabezado y Contador Total */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h2 className="font-wrc text-4xl md:text-5xl text-amber-400 tracking-wide drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                  SALÓN DE LA FAMA - PODIO DE CAMPEONES
                </h2>
                <p className="text-neutral-200 text-sm md:text-base font-sans mt-1 drop-shadow">
                  Los pilotos con más títulos oficiales en la historia de Espíndola Competición.
                </p>
              </div>

              <div className="bg-black/65 backdrop-blur-md border border-amber-500/40 px-6 py-3.5 rounded-2xl flex items-center gap-4 shadow-2xl">
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-2xl">
                  🏆
                </div>
                <div>
                  <span className="block text-[11px] font-wrc text-neutral-400 uppercase tracking-widest">
                    CAMPEONATOS EN TOTAL
                  </span>
                  <span className="font-wrc text-3xl text-amber-400 leading-none">
                    {totalCampeonatosEquipo} TÍTULOS
                  </span>
                </div>
              </div>
            </div>

            {/* Formulario Admin */}
            {esAdmin && (
              <div className="bg-neutral-900/75 backdrop-blur-md border border-amber-500/50 rounded-2xl p-6 shadow-2xl space-y-4">
                <h3 className="font-wrc text-xl text-amber-400">
                  {editandoId !== null ? '✏️ Editar Piloto del Podio' : '🏆 Agregar Piloto al Salón de la Fama'}
                </h3>
                <form onSubmit={handleGuardarPilotoFama} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-xs text-neutral-300 uppercase mb-1 font-bold">Nombre Piloto</label>
                    <input
                      type="text"
                      value={nuevoPilotoFama.nombre}
                      onChange={(e) => setNuevoPilotoFama({ ...nuevoPilotoFama, nombre: e.target.value })}
                      placeholder="Ej: Joaco Castaño"
                      required
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2 text-sm text-white focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-300 uppercase mb-1 font-bold">Ciudad / Categoría</label>
                    <input
                      type="text"
                      value={nuevoPilotoFama.categoria}
                      onChange={(e) => setNuevoPilotoFama({ ...nuevoPilotoFama, categoria: e.target.value })}
                      placeholder="Ej: Posadas - Misiones"
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2 text-sm text-white focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-300 uppercase mb-1 font-bold">Campeonatos</label>
                    <input
                      type="number"
                      value={nuevoPilotoFama.campeonatos}
                      onChange={(e) => setNuevoPilotoFama({ ...nuevoPilotoFama, campeonatos: e.target.value })}
                      placeholder="Ej: 17"
                      required
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2 text-sm text-white focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-300 uppercase mb-1 font-bold">Foto Piloto</label>
                    <SubirImagen currentUrl={nuevoPilotoFama.foto} onUpload={(url) => setNuevoPilotoFama({ ...nuevoPilotoFama, foto: url })} />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-3 pt-2">
                    {editandoId !== null && (
                      <button
                        type="button"
                        onClick={() => { setEditandoId(null); setNuevoPilotoFama({ nombre: '', categoria: '', campeonatos: '', foto: '' }); }}
                        className="bg-neutral-800 text-neutral-300 font-wrc text-xs px-5 py-2.5 rounded-xl cursor-pointer"
                      >
                        Cancelar
                      </button>
                    )}
                    <button
                      type="submit"
                      className="bg-amber-500 hover:bg-amber-400 text-black font-wrc text-sm font-black uppercase px-6 py-2.5 rounded-xl transition shadow-lg cursor-pointer"
                    >
                      {editandoId !== null ? 'Actualizar Piloto' : 'Guardar en el Salón'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* PODIO ESCALONADO (2º IZQUIERDA - 1º CENTRO ARRIBA - 3º DERECHA) */}
            {top3.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-8 pb-4">
                
                {/* 2º PUESTO (Izquierda) */}
                {top3[1] && (
                  <div className="order-2 md:order-1 relative bg-black/70 backdrop-blur-md border border-neutral-400/50 rounded-3xl p-7 text-center shadow-2xl flex flex-col items-center justify-between md:min-h-[340px]">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-neutral-200 text-black font-wrc text-xs px-4 py-1 rounded-full shadow-lg tracking-wider flex items-center gap-1.5 whitespace-nowrap">
                      <span>🥈</span> 2º PUESTO
                    </div>

                    {esAdmin && (
                      <div className="absolute top-3 right-4 flex gap-2">
                        <button onClick={() => handleEditarPilotoFama(top3[1])} className="text-xs text-amber-400 hover:scale-110 transition cursor-pointer">✏️</button>
                        <button onClick={() => handleEliminarPilotoFama(top3[1].id)} className="text-xs text-red-400 hover:scale-110 transition cursor-pointer">🗑️</button>
                      </div>
                    )}

                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-neutral-300 mt-4 mb-3 shadow-lg bg-neutral-900">
                      <img src={top3[1].foto} alt={top3[1].nombre} className="w-full h-full object-cover" />
                    </div>

                    <div className="space-y-1 my-2">
                      <h3 className="font-wrc text-2xl md:text-3xl text-white tracking-wide">{top3[1].nombre}</h3>
                      <p className="text-neutral-300 text-xs font-sans">{top3[1].categoria}</p>
                    </div>

                    <div className="mt-4 bg-white/5 border border-white/15 rounded-xl px-5 py-2 font-wrc text-sm tracking-wider text-neutral-200">
                      TÍTULOS: <span className="text-white text-base ml-1">{top3[1].campeonatos}</span> 🏆
                    </div>
                  </div>
                )}

                {/* 1º PUESTO (Centro y Más Alto) */}
                {top3[0] && (
                  <div className="order-1 md:order-2 relative bg-gradient-to-b from-amber-500/20 via-black/80 to-black/85 backdrop-blur-md border-2 border-amber-400 rounded-3xl p-8 text-center shadow-[0_0_40px_rgba(251,191,36,0.25)] flex flex-col items-center justify-between md:min-h-[400px] md:-translate-y-4">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-black font-wrc text-sm px-5 py-1 rounded-full shadow-lg tracking-wider flex items-center gap-1.5 whitespace-nowrap">
                      <span>🥇</span> 1º PUESTO
                    </div>

                    {esAdmin && (
                      <div className="absolute top-3 right-4 flex gap-2">
                        <button onClick={() => handleEditarPilotoFama(top3[0])} className="text-xs text-amber-400 hover:scale-110 transition cursor-pointer">✏️</button>
                        <button onClick={() => handleEliminarPilotoFama(top3[0].id)} className="text-xs text-red-400 hover:scale-110 transition cursor-pointer">🗑️</button>
                      </div>
                    )}

                    <div className="w-28 h-28 rounded-full overflow-hidden border-[3px] border-amber-400 mt-4 mb-3 shadow-[0_0_20px_rgba(251,191,36,0.4)] bg-neutral-900">
                      <img src={top3[0].foto} alt={top3[0].nombre} className="w-full h-full object-cover" />
                    </div>

                    <div className="space-y-1 my-2">
                      <h3 className="font-wrc text-3xl md:text-4xl text-amber-400 tracking-wide drop-shadow">{top3[0].nombre}</h3>
                      <p className="text-neutral-200 text-xs md:text-sm font-sans">{top3[0].categoria}</p>
                    </div>

                    <div className="mt-4 bg-amber-500/15 border border-amber-400/50 rounded-xl px-6 py-2.5 font-wrc text-base tracking-wider text-amber-300">
                      TÍTULOS ABSOLUTOS: <span className="text-amber-400 text-xl ml-1">{top3[0].campeonatos}</span> 🏆
                    </div>
                  </div>
                )}

                {/* 3º PUESTO (Derecha) */}
                {top3[2] && (
                  <div className="order-3 relative bg-black/70 backdrop-blur-md border border-amber-700/60 rounded-3xl p-7 text-center shadow-2xl flex flex-col items-center justify-between md:min-h-[310px]">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-700 text-white font-wrc text-xs px-4 py-1 rounded-full shadow-lg tracking-wider flex items-center gap-1.5 whitespace-nowrap">
                      <span>🥉</span> 3º PUESTO
                    </div>

                    {esAdmin && (
                      <div className="absolute top-3 right-4 flex gap-2">
                        <button onClick={() => handleEditarPilotoFama(top3[2])} className="text-xs text-amber-400 hover:scale-110 transition cursor-pointer">✏️</button>
                        <button onClick={() => handleEliminarPilotoFama(top3[2].id)} className="text-xs text-red-400 hover:scale-110 transition cursor-pointer">🗑️</button>
                      </div>
                    )}

                    <div className="w-22 h-22 rounded-full overflow-hidden border-2 border-amber-600 mt-4 mb-3 shadow-lg bg-neutral-900">
                      <img src={top3[2].foto} alt={top3[2].nombre} className="w-full h-full object-cover" />
                    </div>

                    <div className="space-y-1 my-2">
                      <h3 className="font-wrc text-2xl text-white tracking-wide">{top3[2].nombre}</h3>
                      <p className="text-neutral-300 text-xs font-sans">{top3[2].categoria}</p>
                    </div>

                    <div className="mt-4 bg-white/5 border border-amber-700/40 rounded-xl px-5 py-2 font-wrc text-sm tracking-wider text-neutral-200">
                      TÍTULOS: <span className="text-amber-500 text-base ml-1">{top3[2].campeonatos}</span> 🏆
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* RESTO DE LA LISTA (4º PUESTO EN ADELANTE) */}
            {restoPilotos.length > 0 && (
              <div className="space-y-3 pt-4">
                {restoPilotos.map((piloto) => (
                  <div key={piloto.id} className="bg-black/55 backdrop-blur-md border border-white/10 hover:border-amber-500/40 rounded-2xl p-4 flex items-center justify-between shadow-lg transition">
                    <div className="flex items-center gap-4">
                      <span className="font-wrc text-amber-400 text-xl w-9 text-center">#{piloto.puesto}</span>
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-neutral-700 bg-neutral-900">
                        <img src={piloto.foto} alt={piloto.nombre} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-wrc text-xl text-white tracking-wide">{piloto.nombre}</h4>
                        <p className="text-xs text-neutral-400 font-sans">{piloto.categoria}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="font-wrc text-amber-400 text-base bg-amber-500/10 border border-amber-500/30 px-4 py-1.5 rounded-xl">
                        {piloto.campeonatos} TÍTULO(S) 🏆
                      </span>
                      {esAdmin && (
                        <div className="flex gap-3">
                          <button onClick={() => handleEditarPilotoFama(piloto)} className="text-xs text-amber-400 hover:scale-110 transition cursor-pointer">✏️</button>
                          <button onClick={() => handleEliminarPilotoFama(piloto.id)} className="text-xs text-red-400 hover:scale-110 transition cursor-pointer">🗑️</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 8. MIEMBROS */}
        {pestanaActiva === 'miembros' && (
          <div className="space-y-8 max-w-5xl mx-auto">
            <div>
              <h2 className="font-wrc text-4xl text-amber-400 tracking-wide">Pilotos Registrados</h2>
              <p className="text-neutral-300 text-sm font-sans">Comunidad de pilotos y miembros de Espíndola Competición.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {miembros.length === 0 ? (
                <p className="text-neutral-400 col-span-full text-center py-8">No hay miembros registrados todavía.</p>
              ) : (
                miembros.map((m) => (
                  <div key={m.id} className="bg-neutral-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-neutral-800 border border-amber-500/50 flex items-center justify-center overflow-hidden font-wrc text-amber-400 text-lg flex-shrink-0">
                      {m.avatar_url ? (
                        <img src={m.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        m.nombre_piloto ? m.nombre_piloto.charAt(0).toUpperCase() : 'E'
                      )}
                    </div>
                    <div className="space-y-1 overflow-hidden">
                      <h3 className="font-wrc text-xl text-white truncate">{m.nombre_piloto || 'Piloto sin nombre'}</h3>
                      <p className="text-xs text-amber-400 uppercase font-wrc">Nacionalidad: {m.nacionalidad || 'Argentina 🇦🇷'}</p>
                      {m.steam_id && <p className="text-xs text-neutral-400 truncate">Steam ID: {m.steam_id}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 9. MI PERFIL */}
        {pestanaActiva === 'perfil' && usuario && (
          <div className="max-w-xl mx-auto bg-neutral-900/60 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
            <h2 className="font-wrc text-3xl text-amber-400">Configuración de Perfil</h2>
            <div className="flex items-center gap-4 border-b border-white/10 pb-6">
              <div className="w-20 h-20 rounded-full bg-neutral-800 border-2 border-amber-500 overflow-hidden flex items-center justify-center font-wrc text-amber-400 text-2xl">
                {perfil?.avatar_url ? (
                  <img src={perfil.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  perfil?.nombre_piloto ? perfil.nombre_piloto.charAt(0).toUpperCase() : 'E'
                )}
              </div>
              <div>
                <h3 className="font-wrc text-2xl text-white">{perfil?.nombre_piloto || 'Piloto Espíndola'}</h3>
                <p className="text-neutral-400 text-xs font-sans">{usuario.email}</p>
              </div>
            </div>

            <button
              onClick={() => setMostrarPerfilModal(true)}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-wrc text-sm font-black uppercase py-3 rounded-xl transition shadow-lg cursor-pointer"
            >
              Editar Datos y Steam ID
            </button>

            <button
              onClick={() => setMostrarCambiarPasswordModal(true)}
              className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-wrc text-sm uppercase py-3 rounded-xl transition cursor-pointer"
            >
              Cambiar Contraseña
            </button>
          </div>
        )}

      </main>

      {/* BARRA INFERIOR / FOOTER FLOTANTE */}
      <footer className="relative z-40 w-full max-w-[1600px] mx-auto px-8 pb-6 flex flex-col md:flex-row items-center justify-between gap-4 mt-12">
        <div className="hidden md:block w-24" />

        <div className="flex items-center justify-center">
          <img 
            src="/sponsor.svg" 
            alt="Sponsors Espíndola Competición" 
            className="h-5 md:h-6 w-auto object-contain opacity-80 hover:opacity-100 transition drop-shadow-md"
          />
        </div>

        <div className="flex items-center gap-5 text-white">
          <a href={config.instagram} target="_blank" rel="noreferrer" className="hover:text-amber-400 transition" aria-label="Instagram">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>
          <a href={config.tiktok} target="_blank" rel="noreferrer" className="hover:text-amber-400 transition" aria-label="TikTok">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
            </svg>
          </a>
          <a href={config.discord} target="_blank" rel="noreferrer" className="hover:text-amber-400 transition" aria-label="Discord">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
          </a>
        </div>
      </footer>

      {/* MODALES AUXILIARES */}
      {mostrarPerfilModal && (
        <PerfilModal usuario={usuario} perfil={perfil} onClose={() => setMostrarPerfilModal(false)} onActualizado={() => verificarAdminYPerfil(usuario)} />
      )}

      {eventoSeleccionado && (
        <InscripcionModal evento={eventoSeleccionado} modoInicial={modoModalInscripcion} usuario={usuario} onClose={() => setEventoSeleccionado(null)} />
      )}

      {mostrarAuthModal && (
        <AuthModal onClose={() => setMostrarAuthModal(false)} />
      )}

      {mostrarCambiarPasswordModal && (
        <CambiarPasswordModal onClose={() => setMostrarCambiarPasswordModal(false)} />
      )}

      {fotoAmpliada && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setFotoAmpliada(null)}>
          <img src={fotoAmpliada} alt="Ampliación" className="max-w-full max-h-[90vh] object-contain rounded-xl border border-white/20 shadow-2xl" />
        </div>
      )}

    </div>
  );
}