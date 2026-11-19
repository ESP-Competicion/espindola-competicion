import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import PerfilModal from './PerfilModal';
import AuthModal from './AuthModal';
import CambiarPasswordModal from './CambiarPasswordModal';
import LiveTiming from './LiveTiming';
import ResultadosRallyServer from './ResultadosRallyServer';
import Campeonatos from './Campeonatos';

const fotosRally = [
  '/FondoTaller.png'
];

const obtenerBanderaPais = (pais) => {
  if (!pais) return <span className="inline-flex items-center gap-1.5">ARGENTINA <img src="https://flagcdn.com/w20/ar.png" alt="AR" className="w-4 h-3 object-cover rounded-[2px] shadow-sm inline-block align-middle" /></span>;
  
  const p = pais.toUpperCase().trim();
  let codigoIso = 'ar';

  if (p.includes('ARGENTINA') || p === 'AR') codigoIso = 'ar';
  else if (p.includes('PERU') || p.includes('PERÚ') || p === 'PE') codigoIso = 'pe';
  else if (p.includes('BRASIL') || p.includes('BRAZIL') || p === 'BR') codigoIso = 'br';
  else if (p.includes('CHILE') || p === 'CL') codigoIso = 'cl';
  else if (p.includes('URUGUAY') || p === 'UY') codigoIso = 'uy';
  else if (p.includes('PARAGUAY') || p === 'PY') codigoIso = 'py';
  else if (p.includes('COLOMBIA') || p === 'CO') codigoIso = 'co';
  else if (p.includes('MEXICO') || p.includes('MÉXICO') || p === 'MX') codigoIso = 'mx';
  else if (p.includes('CANARIAS') || p.includes('ISLAS CANARIAS') || p === 'IC') codigoIso = 'ic';
  else if (p.includes('ESPAÑA') || p.includes('SPAIN') || p === 'ES') codigoIso = 'es';
  else if (p.includes('ESTADOS UNIDOS') || p.includes('USA') || p === 'EEUU' || p === 'US') codigoIso = 'us';
  else if (p.includes('ITALIA') || p === 'IT') codigoIso = 'it';
  else if (p.includes('FRANCIA') || p === 'FR') codigoIso = 'fr';

  let nombreLimpio = p.replace(/🇦🇷|🇧🇷|🇨🇱|🇺🇾|🇵🇾|🇨🇴|🇲🇽|🇪🇸|🇺🇸|🇮🇹|🇫🇷|🇵🇪|🇮🇨/g, '').trim();
  if (nombreLimpio === 'AR' || nombreLimpio === '') {
    nombreLimpio = 'ARGENTINA';
  }

  return (
    <span className="inline-flex items-center gap-1.5 align-middle">
      <span>{nombreLimpio}</span>
      <img 
        src={`https://flagcdn.com/w40/${codigoIso}.png`} 
        alt={codigoIso} 
        className="w-4 h-3 object-cover rounded-[2px] shadow-sm inline-block align-middle border border-white/20" 
      />
    </span>
  );
};

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [mostrarPerfilModal, setMostrarPerfilModal] = useState(false);
  const [mostrarAuthModal, setMostrarAuthModal] = useState(false);
  const [mostrarCambiarPasswordModal, setMostrarCambiarPasswordModal] = useState(false);
  const [pestanaActiva, setPestanaActiva] = useState('inicio');
  const [esAdmin, setEsAdmin] = useState(false);
  const [vistaAdminActiva, setVistaAdminActiva] = useState(true);

  const esAdminEfectivo = esAdmin && vistaAdminActiva;

  const [fondoActual, setFondoActual] = useState(0);
  const [menuPrincipalAbierto, setMenuPrincipalAbierto] = useState(false);
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);

  const [config, setConfig] = useState({
    instagram: 'https://instagram.com',
    discord: 'https://discord.gg',
    tiktok: 'https://tiktok.com',
    historia_texto: ''
  });
  const [editandoConfig, setEditandoConfig] = useState(false);

  const [eventos, setEventos] = useState([]);
  const [campeonatosDisponibles, setCampeonatosDisponibles] = useState([]);
  const [calendario, setCalendario] = useState([]);
  const [fechaActualCalendario, setFechaActualCalendario] = useState(new Date(2027, 0, 1));
  
  const [diaSeleccionadoModal, setDiaSeleccionadoModal] = useState(null);
  const [modoModalCalendario, setModoModalCalendario] = useState('detalle'); 
  const [asistentesEvento, setAsistentesEvento] = useState([]);
  const [formAsistencia, setFormAsistencia] = useState({ categoria: '', modelo_auto: '' });

  const [eventoModalActivo, setEventoModalActivo] = useState(null);
  const [modoModalEvento, setModoModalEvento] = useState('formulario');
  const [asistentesEventoEquipo, setAsistentesEventoEquipo] = useState([]);
  const [formAsistenciaEvento, setFormAsistenciaEvento] = useState({ categoria: '', modelo_auto: '' });

  const [nuevoEvento, setNuevoEvento] = useState({
    titulo: '',
    fecha: '',
    horario: '',
    categorias: '',
    modelos_autos: '',
    campeonato_id: ''
  });
  const [nuevoCalendario, setNuevoCalendario] = useState({
    titulo: '',
    fecha: '',
    descripcion: ''
  });

  const [hallFama, setHallFama] = useState([]);
  const [nuevoPilotoFama, setNuevoPilotoFama] = useState({ nombre: '', categoria: '', campeonatos: '', foto: '' });
  const [editandoId, setEditandoId] = useState(null);

  const [miembros, setMiembros] = useState([]);

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
    cargarEventos();
    cargarCampeonatosSelect();
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
        setVistaAdminActiva(false);
      }
    });

    const canalMiembros = supabase
      .channel('cambios-perfiles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'perfiles' },
        () => {
          cargarMiembros();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(canalMiembros);
    };
  }, []);

  async function cargarConfiguracion() {
    const { data } = await supabase.from('configuracion_equipo').select('*').eq('id', 1).single();
    if (data && data.historia_texto) {
      setConfig(prev => ({ ...prev, ...data }));
    }
  }

  async function cargarEventos() {
    const { data } = await supabase.from('eventos').select('*').order('created_at', { ascending: false });
    if (data) setEventos(data);
  }

  async function cargarCampeonatosSelect() {
    const { data } = await supabase.from('campeonatos').select('id, nombre').order('nombre', { ascending: true });
    if (data) setCampeonatosDisponibles(data);
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

  async function cargarAsistentesCalendario(calendarioId) {
    const { data } = await supabase.from('asistencias_calendario').select('*').eq('calendario_id', calendarioId);
    if (data) setAsistentesEvento(data);
  }

  async function cargarAsistentesEventoEquipo(eventoId) {
    const { data } = await supabase.from('asistencias_eventos').select('*').eq('evento_id', eventoId);
    if (data) setAsistentesEventoEquipo(data);
  }

  async function verificarAdminYPerfil(user) {
    if (user.email === 'leosimracingok@gmail.com') {
      setEsAdmin(true);
      setVistaAdminActiva(true);
    } else {
      setEsAdmin(false);
      setVistaAdminActiva(false);
    }

    const { data } = await supabase
      .from('perfiles')
      .select('*')
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
      alert('¡Historia guardada exitosamente!');
      setEditandoConfig(false);
    }
  };

  const handleCrearEvento = async (e) => {
    e.preventDefault();
    if (!nuevoEvento.titulo || !nuevoEvento.fecha) return;

    const datosInsertar = {
      titulo: nuevoEvento.titulo,
      fecha: nuevoEvento.fecha,
      horario: nuevoEvento.horario,
      categorias: nuevoEvento.categorias,
      modelos_autos: nuevoEvento.modelos_autos,
      campeonato_id: nuevoEvento.campeonato_id ? nuevoEvento.campeonato_id : null
    };

    const { error } = await supabase.from('eventos').insert([datosInsertar]);

    if (error) {
      alert('Error al crear evento: ' + error.message);
    } else {
      setNuevoEvento({
        titulo: '',
        fecha: '',
        horario: '',
        categorias: '',
        modelos_autos: '',
        campeonato_id: ''
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
      nombre: nuevoPilotoFama.nombre.toUpperCase(),
      categoria: (nuevoPilotoFama.categoria || 'CATEGORÍA GENERAL').toUpperCase(),
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

  const cambiarMes = (direccion) => {
    const nuevo = new Date(fechaActualCalendario);
    nuevo.setMonth(nuevo.getMonth() + direccion);
    if (nuevo.getFullYear() >= 2027) {
      setFechaActualCalendario(nuevo);
    }
  };

  const obtenerDiasDelMes = () => {
    const año = fechaActualCalendario.getFullYear();
    const mes = fechaActualCalendario.getMonth();
    const primerDiaIndex = new Date(año, mes, 1).getDay();
    const totalDias = new Date(año, mes + 1, 0).getDate();

    const dias = [];
    for (let i = 0; i < (primerDiaIndex === 0 ? 6 : primerDiaIndex - 1); i++) {
      dias.push(null);
    }
    for (let d = 1; d <= totalDias; d++) {
      const mesStr = String(mes + 1).padStart(2, '0');
      const diaStr = String(d).padStart(2, '0');
      const fechaFormato = `${año}-${mesStr}-${diaStr}`;
      
      const eventosDelDia = calendario.filter(c => c.fecha === fechaFormato);
      dias.push({ dia: d, fecha: fechaFormato, eventos: eventosDelDia });
    }
    return dias;
  };

  const nombresMeses = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ];

  const restoPilotos = hallFama.slice(3);
  const inicialUsuario = perfil?.nombre_piloto
    ? perfil.nombre_piloto.charAt(0).toUpperCase()
    : usuario?.email
      ? usuario.email.charAt(0).toUpperCase()
      : 'E';

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans relative overflow-x-hidden selection:bg-sky-400 selection:text-slate-950 flex flex-col justify-between uppercase text-xs md:text-sm">
      
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

      <header className="relative z-50 w-full max-w-[1400px] mx-auto px-4 pt-4 flex flex-wrap items-center justify-between gap-3">
        
        <button 
          onClick={() => { setPestanaActiva('inicio'); }}
          className="cursor-pointer group flex items-center focus:outline-none"
          title="Ir al inicio"
        >
          <img 
            src="/logo.svg" 
            alt="Logo Espíndola Competición" 
            onError={(e) => { e.target.src = 'https://files.catbox.moe/f3xmld.png'; }}
            className="h-7 md:h-8 w-auto object-contain group-hover:scale-105 transition drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] opacity-90"
          />
        </button>

        <div className="relative">
          <nav className="flex items-center gap-3 md:gap-5 px-4 md:px-6 py-2 rounded-full bg-black/50 backdrop-blur-md border border-white/30 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
            {[
              { id: 'historia', label: 'HISTORIA' },
              { id: 'eventos', label: `EVENTOS${esAdminEfectivo ? ' ⚙️' : ''}` },
              { id: 'livetiming', label: 'LIVETIMING' },
              { id: 'resultados', label: 'RESULTADOS' },
              { id: 'calendario', label: 'CALENDARIO' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => { setPestanaActiva(item.id); setMenuPrincipalAbierto(false); }}
                className={`text-[11px] md:text-xs font-wrc tracking-wider transition cursor-pointer ${
                  pestanaActiva === item.id ? 'text-[#38bdf8]' : 'text-white hover:text-white/75'
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
              className="pl-1 text-white hover:text-[#38bdf8] transition cursor-pointer focus:outline-none"
              aria-label="Más secciones"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </nav>

          {menuPrincipalAbierto && (
            <div className="absolute right-0 mt-2 w-52 rounded-xl bg-black/85 backdrop-blur-xl border border-white/30 shadow-2xl py-3 px-4 flex flex-col items-center gap-2.5 z-50">
              <button
                onClick={() => { setPestanaActiva('fama'); setMenuPrincipalAbierto(false); }}
                className={`text-xs font-wrc tracking-wider transition cursor-pointer ${pestanaActiva === 'fama' ? 'text-[#38bdf8]' : 'text-white hover:text-sky-300'}`}
              >
                SALON DE LA FAMA
              </button>
              <button
                onClick={() => { setPestanaActiva('campeonato'); setMenuPrincipalAbierto(false); }}
                className={`text-xs font-wrc tracking-wider transition cursor-pointer ${pestanaActiva === 'campeonato' ? 'text-[#38bdf8]' : 'text-white hover:text-sky-300'}`}
              >
                PUNTOS CAMPEONATOS 🏆
              </button>
              <button
                onClick={() => { setPestanaActiva('miembros'); setMenuPrincipalAbierto(false); }}
                className={`text-xs font-wrc tracking-wider transition cursor-pointer ${pestanaActiva === 'miembros' ? 'text-[#38bdf8]' : 'text-white hover:text-sky-300'}`}
              >
                MIEMBROS
              </button>
            </div>
          )}
        </div>

        <div className="relative">
          {usuario ? (
            <div className="flex items-center gap-2.5 pl-2 pr-4 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/30 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
              <button 
                onClick={() => setMostrarPerfilModal(true)}
                className="flex items-center gap-2 group cursor-pointer focus:outline-none"
              >
                <div className="w-7 h-7 rounded-full bg-neutral-900 border border-[#38bdf8]/50 flex items-center justify-center overflow-hidden font-wrc text-[#38bdf8] text-[11px]">
                  {perfil?.avatar_url ? (
                    <img
                      src={perfil.avatar_url}
                      alt=""
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.nextSibling) {
                          e.currentTarget.nextSibling.style.display = 'flex';
                        }
                      }}
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                  <span
                    style={{ display: perfil?.avatar_url ? 'none' : 'flex' }}
                    className="w-full h-full items-center justify-center"
                  >
                    {inicialUsuario}
                  </span>
                </div>
                <span className="font-wrc text-[11px] md:text-xs tracking-wider text-white group-hover:text-[#38bdf8] transition">
                  {(perfil?.nombre_piloto || usuario.email.split('@')[0]).toUpperCase()}
                </span>
              </button>
              
              <button
                onClick={() => {
                  setMenuUsuarioAbierto(!menuUsuarioAbierto);
                  setMenuPrincipalAbierto(false);
                }}
                className="pl-1 text-white hover:text-[#38bdf8] transition cursor-pointer focus:outline-none"
                aria-label="Menú de usuario"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setMostrarAuthModal(true)}
              className="bg-[#38bdf8] hover:bg-[#7dd3fc] text-slate-950 font-wrc text-xs px-4 py-2 rounded-full transition shadow-md shadow-[#38bdf8]/20 tracking-wider cursor-pointer font-black"
            >
              ACCEDER
            </button>
          )}

          {usuario && menuUsuarioAbierto && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-black/85 backdrop-blur-xl border border-white/30 shadow-2xl py-3 px-4 flex flex-col items-center gap-2.5 z-50">
              <button
                onClick={() => { setPestanaActiva('perfil'); setMenuUsuarioAbierto(false); }}
                className="text-xs font-wrc tracking-wider transition text-white hover:text-sky-300 cursor-pointer"
              >
                MI PERFIL
              </button>
              {esAdmin && (
                <button
                  onClick={() => { setVistaAdminActiva(!vistaAdminActiva); setMenuUsuarioAbierto(false); }}
                  className="text-xs font-wrc tracking-wider transition text-[#38bdf8] hover:text-sky-200 cursor-pointer"
                >
                  {vistaAdminActiva ? 'VER COMO PILOTO' : 'VOLVER A VISTA ADMIN'}
                </button>
              )}
              <button
                onClick={() => { setMostrarPerfilModal(true); setMenuUsuarioAbierto(false); }}
                className="text-xs font-wrc tracking-wider transition text-white hover:text-sky-300 cursor-pointer"
              >
                CONFIGURACION
              </button>
              <button
                onClick={() => { handleLogout(); setMenuUsuarioAbierto(false); }}
                className="text-xs font-wrc tracking-wider transition text-red-400 hover:text-red-300 cursor-pointer"
              >
                SALIR
              </button>
            </div>
          )}
        </div>

      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-6 flex-1 w-full">
        
        {pestanaActiva === 'inicio' && (
          <div className="min-h-[55vh] flex flex-col items-center justify-center">
            <div className="max-w-lg mx-auto text-center space-y-3 py-6">
              <span className="inline-block bg-[#38bdf8]/20 text-[#38bdf8] font-wrc text-[11px] tracking-widest px-3 py-1 rounded-full border border-[#38bdf8]/40 uppercase backdrop-blur-md shadow-md">
                TEMPORADA OFICIAL 2027 • ESPÍNDOLA COMPETICIÓN {esAdminEfectivo && '• MODO ADMIN'}
              </span>

              <h1 className="font-wrc text-3xl md:text-5xl font-black tracking-tight text-white uppercase drop-shadow-[0_3px_15px_rgba(0,0,0,0.95)]">
                PRECISIÓN, VELOCIDAD Y <span className="text-[#38bdf8] drop-shadow-[0_0_20px_rgba(56,189,248,0.55)]">GLORIA</span>
              </h1>
            </div>
          </div>
        )}

        {pestanaActiva === 'resultados' && (
          <ResultadosRallyServer esAdmin={esAdminEfectivo} />
        )}

        {pestanaActiva === 'campeonato' && (
          <Campeonatos esAdmin={esAdminEfectivo} />
        )}

        {pestanaActiva === 'historia' && (
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="bg-neutral-900/65 backdrop-blur-md border border-white/10 rounded-xl p-4 md:p-5 shadow-2xl space-y-3">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <h2 className="font-wrc text-xl md:text-2xl text-[#38bdf8] tracking-wide">HISTORIA DEL EQUIPO</h2>
                {esAdminEfectivo && !editandoConfig && (
                  <button
                    onClick={() => setEditandoConfig(true)}
                    className="bg-[#38bdf8] hover:bg-[#7dd3fc] text-slate-950 font-wrc text-[10px] px-3 py-1.5 rounded-lg transition cursor-pointer font-black"
                  >
                    ✏️ EDITAR HISTORIA
                  </button>
                )}
              </div>

              {!editandoConfig ? (
                <div className="text-neutral-200 text-[11px] md:text-xs leading-snug font-wrc whitespace-pre-line space-y-2.5">
                  {config.historia_texto || "HISTORIA NO DEFINIDA. PUEDES AGREGARLA DESDE EL PANEL DE ADMINISTRACIÓN."}
                </div>
              ) : (
                <form onSubmit={handleGuardarConfig} className="space-y-2.5">
                  <p className="text-[10px] text-[#38bdf8] font-wrc">MODIFICA EL TEXTO COMPLETO DE LA HISTORIA A TU GUSTO:</p>
                  <textarea
                    rows={12}
                    value={config.historia_texto}
                    onChange={(e) => setConfig({ ...config, historia_texto: e.target.value.toUpperCase() })}
                    className="w-full bg-neutral-950 border border-[#38bdf8]/50 rounded-xl p-3 text-[11px] text-white focus:border-[#38bdf8] outline-none font-wrc uppercase leading-snug"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditandoConfig(false)}
                      className="bg-neutral-800 text-neutral-300 font-wrc text-[10px] px-3 py-1.5 rounded-lg cursor-pointer"
                    >
                      CANCELAR
                    </button>
                    <button
                      type="submit"
                      className="bg-[#38bdf8] hover:bg-[#7dd3fc] text-slate-950 font-wrc text-[10px] font-black px-4 py-1.5 rounded-lg transition shadow cursor-pointer"
                    >
                      💾 GUARDAR CAMBIOS
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {pestanaActiva === 'calendario' && (
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
              <div>
                <h2 className="font-wrc text-xl md:text-2xl text-[#38bdf8] tracking-wide">CALENDARIO DE CARRERAS</h2>
                <p className="text-neutral-300 text-[10px] md:text-[11px] font-wrc">NAVEGA POR LOS MESES DEL 2027 EN ADELANTE Y CONFIRMA TU PARTICIPACIÓN.</p>
              </div>

              <div className="flex items-center gap-1.5 bg-neutral-900/80 border border-[#38bdf8]/40 px-2.5 py-1 rounded-lg shadow-lg">
                <button
                  onClick={() => cambiarMes(-1)}
                  className="text-[#38bdf8] hover:text-white font-wrc text-[10px] px-2 py-0.5 bg-neutral-950 rounded border border-neutral-800 transition cursor-pointer"
                >
                  ◀ ANTERIOR
                </button>
                <span className="font-wrc text-xs text-white tracking-wider px-1.5 min-w-[95px] text-center">
                  {nombresMeses[fechaActualCalendario.getMonth()]} {fechaActualCalendario.getFullYear()}
                </span>
                <button
                  onClick={() => cambiarMes(1)}
                  className="text-[#38bdf8] hover:text-white font-wrc text-[10px] px-2 py-0.5 bg-neutral-950 rounded border border-neutral-800 transition cursor-pointer"
                >
                  SIGUIENTE ▶
                </button>
              </div>
            </div>

            {esAdminEfectivo && (
              <form onSubmit={handleCrearCalendario} className="bg-neutral-900/75 backdrop-blur-md border border-[#38bdf8]/30 rounded-xl p-3.5 shadow-xl space-y-2">
                <h3 className="font-wrc text-xs text-[#38bdf8] tracking-wider">⚙️ AGREGAR FECHA AL CALENDARIO (ADMIN)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="TÍTULO DE LA FECHA"
                    value={nuevoCalendario.titulo}
                    onChange={(e) => setNuevoCalendario({ ...nuevoCalendario, titulo: e.target.value.toUpperCase() })}
                    className="bg-neutral-950 border border-white/15 rounded-lg px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-[#38bdf8]"
                    required
                  />
                  <input
                    type="date"
                    value={nuevoCalendario.fecha}
                    onChange={(e) => setNuevoCalendario({ ...nuevoCalendario, fecha: e.target.value })}
                    className="bg-neutral-950 border border-white/15 rounded-lg px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-[#38bdf8]"
                    required
                  />
                  <input
                    type="text"
                    placeholder="DESCRIPCIÓN / TRAMO"
                    value={nuevoCalendario.descripcion}
                    onChange={(e) => setNuevoCalendario({ ...nuevoCalendario, descripcion: e.target.value.toUpperCase() })}
                    className="bg-neutral-950 border border-white/15 rounded-lg px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-[#38bdf8]"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-[#38bdf8] hover:bg-[#7dd3fc] text-slate-950 font-wrc text-[10px] font-black px-3.5 py-1.5 rounded-lg transition cursor-pointer"
                  >
                    + GUARDAR FECHA
                  </button>
                </div>
              </form>
            )}

            <div className="bg-neutral-900/65 backdrop-blur-md border border-white/10 rounded-xl p-3.5 md:p-4 shadow-2xl space-y-2">
              <div className="grid grid-cols-7 gap-1 text-center font-wrc text-[#38bdf8] text-[10px] border-b border-white/10 pb-1.5">
                <span>LUN</span><span>MAR</span><span>MIÉ</span><span>JUE</span><span>VIE</span><span>SÁB</span><span>DOM</span>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {obtenerDiasDelMes().map((item, idx) => {
                  if (!item) {
                    return <div key={`empty-${idx}`} className="h-11 md:h-14 rounded-lg bg-black/20 border border-transparent"></div>;
                  }

                  const tieneCarrera = item.eventos.length > 0;

                  return (
                    <div
                      key={item.fecha}
                      onClick={() => {
                        if (tieneCarrera) {
                          setDiaSeleccionadoModal(item.eventos[0]);
                          setModoModalCalendario('detalle');
                          cargarAsistentesCalendario(item.eventos[0].id);
                        }
                      }}
                      className={`h-11 md:h-14 rounded-lg p-1.5 flex flex-col justify-between transition border relative overflow-hidden ${
                        tieneCarrera 
                          ? 'bg-[#38bdf8]/15 border-[#38bdf8]/60 shadow-[0_0_10px_rgba(56,189,248,0.22)] cursor-pointer hover:bg-[#38bdf8]/25' 
                          : 'bg-neutral-950/40 border-white/5 hover:border-white/20'
                      }`}
                    >
                      <span className={`font-wrc text-[11px] md:text-xs leading-none ${tieneCarrera ? 'text-[#38bdf8] font-black' : 'text-neutral-400'}`}>
                        {item.dia}
                      </span>

                      {tieneCarrera && (
                        <div className="flex items-center gap-0.5 text-[8px] font-wrc text-sky-200 uppercase bg-[#38bdf8]/20 px-1 py-0.5 rounded border border-[#38bdf8]/35 truncate leading-none">
                          <span>🏁</span>
                          <span className="truncate">{item.eventos[0].titulo}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {esAdminEfectivo && calendario.length > 0 && (
              <div className="bg-neutral-900/60 border border-white/10 rounded-xl p-3 space-y-1.5">
                <h3 className="font-wrc text-[11px] text-[#38bdf8]">FECHAS CARGADAS EN CALENDARIO</h3>
                <div className="divide-y divide-white/10">
                  {calendario.map((c) => (
                    <div key={c.id} className="py-1.5 flex justify-between items-center gap-2 text-[11px]">
                      <div className="truncate">
                        <span className="text-[#38bdf8] font-mono mr-2">{c.fecha}</span>
                        <span className="font-bold text-white">{c.titulo}</span>
                        {c.descripcion && <span className="text-neutral-400 ml-2 text-[10px]">— {c.descripcion}</span>}
                      </div>
                      <button
                        onClick={() => handleEliminarCalendario(c.id)}
                        className="text-red-400 hover:text-red-300 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded text-[10px] cursor-pointer shrink-0"
                      >
                        ELIMINAR
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {pestanaActiva === 'livetiming' && (
          <LiveTiming />
        )}

        {pestanaActiva === 'eventos' && (
          <div className="space-y-4 max-w-3xl mx-auto">
            <div>
              <h2 className="font-wrc text-xl md:text-2xl text-[#38bdf8] tracking-wide">INSCRIPCIONES Y CAMPEONATOS</h2>
              <p className="text-neutral-300 text-[10px] md:text-[11px] font-wrc">FECHAS ACTIVAS PARA ANOTARTE A COMPETIR Y VINCULAR AL TORNEO.</p>
            </div>

            {esAdminEfectivo && (
              <form onSubmit={handleCrearEvento} className="bg-neutral-900/75 backdrop-blur-md border border-[#38bdf8]/30 rounded-xl p-3.5 shadow-xl space-y-2.5">
                <h3 className="font-wrc text-xs text-[#38bdf8] tracking-wider">⚙️ CREAR NUEVO EVENTO (ADMIN)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="TÍTULO DEL EVENTO"
                    value={nuevoEvento.titulo}
                    onChange={(e) => setNuevoEvento({ ...nuevoEvento, titulo: e.target.value.toUpperCase() })}
                    className="bg-neutral-950 border border-white/15 rounded-lg px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-[#38bdf8]"
                    required
                  />
                  <input
                    type="date"
                    value={nuevoEvento.fecha}
                    onChange={(e) => setNuevoEvento({ ...nuevoEvento, fecha: e.target.value })}
                    className="bg-neutral-950 border border-white/15 rounded-lg px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-[#38bdf8]"
                    required
                  />
                  <input
                    type="text"
                    placeholder="HORARIO (EJ: 21:00 HS)"
                    value={nuevoEvento.horario}
                    onChange={(e) => setNuevoEvento({ ...nuevoEvento, horario: e.target.value.toUpperCase() })}
                    className="bg-neutral-950 border border-white/15 rounded-lg px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-[#38bdf8]"
                  />
                  <input
                    type="text"
                    placeholder="CATEGORÍAS (EJ: RC2 / AYGO)"
                    value={nuevoEvento.categorias}
                    onChange={(e) => setNuevoEvento({ ...nuevoEvento, categorias: e.target.value.toUpperCase() })}
                    className="bg-neutral-950 border border-white/15 rounded-lg px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-[#38bdf8]"
                  />
                  <input
                    type="text"
                    placeholder="MODELOS DE AUTOS"
                    value={nuevoEvento.modelos_autos}
                    onChange={(e) => setNuevoEvento({ ...nuevoEvento, modelos_autos: e.target.value.toUpperCase() })}
                    className="bg-neutral-950 border border-white/15 rounded-lg px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-[#38bdf8]"
                  />
                  <select
                    value={nuevoEvento.campeonato_id}
                    onChange={(e) => setNuevoEvento({ ...nuevoEvento, campeonato_id: e.target.value })}
                    className="bg-neutral-950 border border-white/15 rounded-lg px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-[#38bdf8]"
                  >
                    <option value="">SIN CAMPEONATO VINCULADO</option>
                    {campeonatosDisponibles.map((camp) => (
                      <option key={camp.id} value={camp.id}>{camp.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-[#38bdf8] hover:bg-[#7dd3fc] text-slate-950 font-wrc text-[10px] font-black px-4 py-1.5 rounded-lg transition cursor-pointer"
                  >
                    + PUBLICAR EVENTO
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2.5">
              {eventos.map((ev) => (
                <div key={ev.id} className="bg-neutral-900/50 backdrop-blur-md border border-white/10 rounded-xl p-3.5 md:p-4 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div className="space-y-0.5">
                    <span className="text-[#38bdf8] font-wrc text-[9px] tracking-widest uppercase">{ev.fecha} • {ev.horario || 'POR CONFIRMAR'}</span>
                    <h3 className="font-wrc text-base md:text-lg text-white leading-tight">{ev.titulo}</h3>
                    <p className="text-neutral-300 text-[10px] font-wrc uppercase">CATEGORÍAS: {ev.categorias || 'GENERAL'} | AUTOS: {ev.modelos_autos || 'LIBRE'}</p>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <button
                      onClick={() => {
                        setEventoModalActivo(ev);
                        setModoModalEvento('formulario');
                        cargarAsistentesEventoEquipo(ev.id);
                      }}
                      className="bg-[#38bdf8] hover:bg-[#7dd3fc] text-slate-950 font-wrc text-[10px] px-3 py-1.5 rounded-lg transition shadow tracking-wider cursor-pointer font-black uppercase"
                    >
                      INSCRIBIRSE
                    </button>
                    {esAdminEfectivo && (
                      <button
                        onClick={() => handleEliminarEvento(ev.id)}
                        className="bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/40 font-wrc text-[10px] px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        ELIMINAR
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {pestanaActiva === 'fama' && (
          <div className="space-y-5 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <h2 className="font-wrc text-xl md:text-2xl text-[#38bdf8] tracking-wide">
                  SALÓN DE LA FAMA - PODIO DE CAMPEONES
                </h2>
                <p className="text-neutral-200 text-[10px] md:text-xs font-wrc mt-0.5 uppercase">
                  LOS PILOTOS CON MÁS TÍTULOS OFICIALES EN LA HISTORIA DE ESPÍNDOLA COMPETICIÓN.
                </p>
              </div>

              <div className="bg-black/65 backdrop-blur-md border border-[#38bdf8]/40 px-3 py-1.5 rounded-xl flex items-center gap-2.5 shadow-xl">
                <div className="w-7 h-7 rounded-lg bg-[#38bdf8]/15 border border-[#38bdf8]/30 flex items-center justify-center text-sm">
                  🏆
                </div>
                <div>
                  <span className="block text-[9px] font-wrc text-neutral-400 uppercase tracking-widest">
                    CAMPEONATOS EN TOTAL
                  </span>
                  <span className="font-wrc text-base md:text-lg text-[#38bdf8] leading-none">
                    {totalCampeonatosEquipo} TÍTULOS
                  </span>
                </div>
              </div>
            </div>

            {esAdminEfectivo && (
              <form onSubmit={handleGuardarPilotoFama} className="bg-neutral-900/75 backdrop-blur-md border border-[#38bdf8]/30 rounded-xl p-3.5 shadow-xl space-y-2">
                <h3 className="font-wrc text-xs text-[#38bdf8] tracking-wider">
                  ⚙️ {editandoId !== null ? 'EDITAR PILOTO DEL SALÓN DE LA FAMA' : 'AGREGAR PILOTO AL SALÓN DE LA FAMA'} (ADMIN)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder="NOMBRE DEL PILOTO"
                    value={nuevoPilotoFama.nombre}
                    onChange={(e) => setNuevoPilotoFama({ ...nuevoPilotoFama, nombre: e.target.value.toUpperCase() })}
                    className="bg-neutral-950 border border-white/15 rounded-lg px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-[#38bdf8]"
                    required
                  />
                  <input
                    type="text"
                    placeholder="CATEGORÍA"
                    value={nuevoPilotoFama.categoria}
                    onChange={(e) => setNuevoPilotoFama({ ...nuevoPilotoFama, categoria: e.target.value.toUpperCase() })}
                    className="bg-neutral-950 border border-white/15 rounded-lg px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-[#38bdf8]"
                  />
                  <input
                    type="number"
                    placeholder="CAMPEONATOS"
                    value={nuevoPilotoFama.campeonatos}
                    onChange={(e) => setNuevoPilotoFama({ ...nuevoPilotoFama, campeonatos: e.target.value })}
                    className="bg-neutral-950 border border-white/15 rounded-lg px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-[#38bdf8]"
                    required
                  />
                  <input
                    type="text"
                    placeholder="URL FOTO (OPCIONAL)"
                    value={nuevoPilotoFama.foto}
                    onChange={(e) => setNuevoPilotoFama({ ...nuevoPilotoFama, foto: e.target.value })}
                    className="bg-neutral-950 border border-white/15 rounded-lg px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-[#38bdf8]"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  {editandoId !== null && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditandoId(null);
                        setNuevoPilotoFama({ nombre: '', categoria: '', campeonatos: '', foto: '' });
                      }}
                      className="bg-neutral-800 text-neutral-300 font-wrc text-[10px] px-3 py-1 rounded-lg cursor-pointer"
                    >
                      CANCELAR
                    </button>
                  )}
                  <button
                    type="submit"
                    className="bg-[#38bdf8] hover:bg-[#7dd3fc] text-slate-950 font-wrc text-[10px] font-black px-3.5 py-1.5 rounded-lg transition cursor-pointer"
                  >
                    {editandoId !== null ? 'GUARDAR CAMBIOS' : '+ AGREGAR AL SALÓN'}
                  </button>
                </div>
              </form>
            )}

            {hallFama.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-center pt-4 pb-1">
                {hallFama[1] && (
                  <div className="order-2 md:order-1 relative bg-black/70 backdrop-blur-md border border-neutral-400/50 rounded-xl p-3.5 text-center shadow-xl flex flex-col items-center justify-between">
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-neutral-200 text-slate-950 font-wrc text-[9px] px-2.5 py-0.5 rounded-full shadow tracking-wider flex items-center gap-1 whitespace-nowrap">
                      <span>🥈</span> 2º PUESTO
                    </div>
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-neutral-300 mt-2.5 mb-1.5 shadow bg-neutral-900">
                      <img src={hallFama[1].foto} alt={hallFama[1].nombre} className="w-full h-full object-cover" />
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="font-wrc text-base md:text-lg text-white tracking-wide leading-tight">{hallFama[1].nombre}</h3>
                      <p className="text-neutral-300 text-[10px] font-wrc uppercase">{hallFama[1].categoria}</p>
                    </div>
                    <div className="mt-2 bg-white/5 border border-white/15 rounded-lg px-3 py-1 font-wrc text-[11px] tracking-wider text-neutral-200">
                      TÍTULOS: <span className="text-white text-xs ml-1">{hallFama[1].campeonatos}</span> 🏆
                    </div>
                    {esAdminEfectivo && (
                      <div className="mt-2 flex gap-1.5">
                        <button
                          onClick={() => handleEditarPilotoFama(hallFama[1])}
                          className="text-[9px] bg-[#38bdf8]/20 text-sky-300 border border-[#38bdf8]/40 px-2 py-0.5 rounded cursor-pointer"
                        >
                          EDITAR
                        </button>
                        <button
                          onClick={() => handleEliminarPilotoFama(hallFama[1].id)}
                          className="text-[9px] bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded cursor-pointer"
                        >
                          BORRAR
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {hallFama[0] && (
                  <div className="order-1 md:order-2 relative bg-gradient-to-b from-[#38bdf8]/20 via-black/80 to-black/85 backdrop-blur-md border-2 border-[#38bdf8] rounded-xl p-4 text-center shadow-[0_0_25px_rgba(56,189,248,0.22)] flex flex-col items-center justify-between md:-translate-y-2">
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#38bdf8] text-slate-950 font-wrc text-[10px] px-3 py-0.5 rounded-full shadow tracking-wider flex items-center gap-1 whitespace-nowrap">
                      <span>🥇</span> 1º PUESTO
                    </div>
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#38bdf8] mt-2.5 mb-1.5 shadow-[0_0_12px_rgba(56,189,248,0.35)] bg-neutral-900">
                      <img src={hallFama[0].foto} alt={hallFama[0].nombre} className="w-full h-full object-cover" />
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="font-wrc text-lg md:text-xl text-[#38bdf8] tracking-wide leading-tight">{hallFama[0].nombre}</h3>
                      <p className="text-neutral-200 text-[10px] font-wrc uppercase">{hallFama[0].categoria}</p>
                    </div>
                    <div className="mt-2 bg-[#38bdf8]/15 border border-[#38bdf8]/50 rounded-lg px-3.5 py-1 font-wrc text-xs tracking-wider text-sky-200">
                      TÍTULOS ABSOLUTOS: <span className="text-[#38bdf8] text-sm ml-1">{hallFama[0].campeonatos}</span> 🏆
                    </div>
                    {esAdminEfectivo && (
                      <div className="mt-2 flex gap-1.5">
                        <button
                          onClick={() => handleEditarPilotoFama(hallFama[0])}
                          className="text-[9px] bg-[#38bdf8]/20 text-sky-300 border border-[#38bdf8]/40 px-2 py-0.5 rounded cursor-pointer"
                        >
                          EDITAR
                        </button>
                        <button
                          onClick={() => handleEliminarPilotoFama(hallFama[0].id)}
                          className="text-[9px] bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded cursor-pointer"
                        >
                          BORRAR
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {hallFama[2] && (
                  <div className="order-3 relative bg-black/70 backdrop-blur-md border border-sky-700/60 rounded-xl p-3.5 text-center shadow-xl flex flex-col items-center justify-between">
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-sky-700 text-white font-wrc text-[9px] px-2.5 py-0.5 rounded-full shadow tracking-wider flex items-center gap-1 whitespace-nowrap">
                      <span>🥉</span> 3º PUESTO
                    </div>
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-sky-500 mt-2.5 mb-1.5 shadow bg-neutral-900">
                      <img src={hallFama[2].foto} alt={hallFama[2].nombre} className="w-full h-full object-cover" />
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="font-wrc text-base md:text-lg text-white tracking-wide leading-tight">{hallFama[2].nombre}</h3>
                      <p className="text-neutral-300 text-[10px] font-wrc uppercase">{hallFama[2].categoria}</p>
                    </div>
                    <div className="mt-2 bg-white/5 border border-sky-700/40 rounded-lg px-3 py-1 font-wrc text-[11px] tracking-wider text-neutral-200">
                      TÍTULOS: <span className="text-sky-300 text-xs ml-1">{hallFama[2].campeonatos}</span> 🏆
                    </div>
                    {esAdminEfectivo && (
                      <div className="mt-2 flex gap-1.5">
                        <button
                          onClick={() => handleEditarPilotoFama(hallFama[2])}
                          className="text-[9px] bg-[#38bdf8]/20 text-sky-300 border border-[#38bdf8]/40 px-2 py-0.5 rounded cursor-pointer"
                        >
                          EDITAR
                        </button>
                        <button
                          onClick={() => handleEliminarPilotoFama(hallFama[2].id)}
                          className="text-[9px] bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded cursor-pointer"
                        >
                          BORRAR
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {restoPilotos.length > 0 && (
              <div className="bg-black/70 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-xl">
                <div className="px-4 py-2 bg-white/5 border-b border-white/10 flex justify-between items-center">
                  <h3 className="font-wrc text-xs text-[#38bdf8] tracking-wider">RANKING COMPLETO DEL SALÓN DE LA FAMA</h3>
                  <span className="text-[10px] text-neutral-400 font-mono">{hallFama.length} PILOTOS</span>
                </div>
                <div className="divide-y divide-white/10">
                  {restoPilotos.map((piloto, idx) => (
                    <div key={piloto.id || idx} className="px-4 py-2 flex flex-wrap justify-between items-center gap-2 hover:bg-white/5 transition">
                      <div className="flex items-center gap-2.5">
                        <span className="font-wrc text-[#38bdf8] text-xs w-6 text-center">#{idx + 4}</span>
                        <img
                          src={piloto.foto || 'https://files.catbox.moe/f3xmld.png'}
                          alt={piloto.nombre}
                          className="w-7 h-7 rounded-full object-cover border border-white/20 bg-neutral-900"
                        />
                        <div className="leading-tight">
                          <p className="font-wrc text-xs md:text-sm text-white">{piloto.nombre}</p>
                          <span className="text-[9px] text-neutral-400">{piloto.categoria || 'CATEGORÍA GENERAL'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[11px] text-sky-300 font-bold">
                          {piloto.campeonatos} TÍTULOS 🏆
                        </span>
                        {esAdminEfectivo && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditarPilotoFama(piloto)}
                              className="text-[9px] bg-[#38bdf8]/20 text-sky-300 border border-[#38bdf8]/40 px-2 py-0.5 rounded cursor-pointer"
                            >
                              EDITAR
                            </button>
                            <button
                              onClick={() => handleEliminarPilotoFama(piloto.id)}
                              className="text-[9px] bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded cursor-pointer"
                            >
                              BORRAR
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {pestanaActiva === 'miembros' && (
          <div className="space-y-4 max-w-4xl mx-auto">
            <div>
              <h2 className="font-wrc text-xl md:text-2xl text-[#38bdf8] tracking-wide">PILOTOS REGISTRADOS</h2>
              <p className="text-neutral-300 text-[10px] md:text-[11px] font-wrc">COMUNIDAD DE PILOTOS Y MIEMBROS DE ESPÍNDOLA COMPETICIÓN.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {miembros.length === 0 ? (
                <p className="text-neutral-400 col-span-full text-center py-6 font-wrc text-xs">NO HAY MIEMBROS REGISTRADOS TODAVÍA.</p>
              ) : (
                miembros.map((m) => {
                  const nombrePiloto = (m.nombre_piloto || 'PILOTO SIN NOMBRE').toUpperCase();
                  const inicial = m.nombre_piloto ? m.nombre_piloto.charAt(0).toUpperCase() : 'E';
                  const provinciaTexto = (m.provincia || '').toString().trim().toUpperCase();

                  return (
                    <div key={m.id} className="bg-neutral-900/55 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-lg flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-neutral-800 border border-[#38bdf8]/50 flex items-center justify-center overflow-hidden font-wrc text-[#38bdf8] text-sm flex-shrink-0">
                        {m.avatar_url ? (
                          <img
                            src={m.avatar_url}
                            alt=""
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.nextSibling) {
                                e.currentTarget.nextSibling.style.display = 'flex';
                              }
                            }}
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                        <span
                          style={{ display: m.avatar_url ? 'none' : 'flex' }}
                          className="w-full h-full items-center justify-center"
                        >
                          {inicial}
                        </span>
                      </div>

                      <div className="space-y-0.5 overflow-hidden leading-tight">
                        <h3 className="font-wrc text-sm text-white truncate">{nombrePiloto}</h3>
                        <p className="text-[10px] font-wrc uppercase truncate">
                          <span className="text-[#38bdf8]">PAÍS:</span> <span className="text-white">{obtenerBanderaPais(m.nacionalidad)}</span>
                        </p>
                        {provinciaTexto && (
                          <p className="text-[10px] font-wrc uppercase truncate">
                            <span className="text-[#38bdf8]">PROVINCIA:</span> <span className="text-neutral-200">{provinciaTexto}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {pestanaActiva === 'perfil' && usuario && (
          <div className="max-w-md mx-auto bg-neutral-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-wrc text-xl text-[#38bdf8]">MI PERFIL DE PILOTO</h2>
              {esAdmin && (
                <span className="text-[10px] font-wrc px-2.5 py-0.5 rounded-full border border-[#38bdf8]/40 bg-[#38bdf8]/15 text-[#38bdf8]">
                  {vistaAdminActiva ? 'MODO ADMIN' : 'MODO PILOTO'}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <div className="w-14 h-14 rounded-full bg-neutral-800 border-2 border-[#38bdf8] overflow-hidden flex items-center justify-center font-wrc text-[#38bdf8] text-lg flex-shrink-0">
                {perfil?.avatar_url ? (
                  <img
                    src={perfil.avatar_url}
                    alt=""
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      if (e.currentTarget.nextSibling) {
                        e.currentTarget.nextSibling.style.display = 'flex';
                      }
                    }}
                    className="w-full h-full object-cover"
                  />
                ) : null}
                <span
                  style={{ display: perfil?.avatar_url ? 'none' : 'flex' }}
                  className="w-full h-full items-center justify-center"
                >
                  {inicialUsuario}
                </span>
              </div>
              <div className="overflow-hidden">
                <h3 className="font-wrc text-lg text-white truncate">{(perfil?.nombre_piloto || usuario.email.split('@')[0]).toUpperCase()}</h3>
                <p className="text-neutral-400 text-[10px] font-wrc uppercase truncate">{usuario.email}</p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => setMostrarPerfilModal(true)}
                className="w-full bg-[#38bdf8] hover:bg-[#7dd3fc] text-slate-950 font-wrc text-xs font-black uppercase py-2 rounded-xl transition shadow cursor-pointer"
              >
                EDITAR DATOS PERSONALES
              </button>

              {esAdmin && (
                <button
                  onClick={() => setVistaAdminActiva(!vistaAdminActiva)}
                  className={`w-full font-wrc text-xs font-black uppercase py-2 rounded-xl transition shadow cursor-pointer border ${
                    vistaAdminActiva
                      ? 'bg-neutral-900 hover:bg-neutral-800 text-[#38bdf8] border-[#38bdf8]/50'
                      : 'bg-[#38bdf8] hover:bg-[#7dd3fc] text-slate-950 border-[#38bdf8]'
                  }`}
                >
                  {vistaAdminActiva ? '👁️ CAMBIAR A VISTA PILOTO' : '⚙️ CAMBIAR A VISTA ADMIN'}
                </button>
              )}
            </div>
          </div>
        )}

      </main>

      <footer className="relative z-40 w-full max-w-[1400px] mx-auto px-6 pb-4 flex items-center justify-center mt-6 text-xs">
        <div className="flex items-center justify-center w-full">
          <img 
            src="/sponsor.svg" 
            alt="Sponsors Espíndola Competición" 
            className="h-4 md:h-5 w-auto object-contain opacity-80 hover:opacity-100 transition drop-shadow-md mx-auto"
          />
        </div>
      </footer>

      {mostrarPerfilModal && (
        <PerfilModal usuario={usuario} perfil={perfil} onClose={() => setMostrarPerfilModal(false)} onActualizado={() => verificarAdminYPerfil(usuario)} />
      )}

      {mostrarAuthModal && (
        <AuthModal onClose={() => setMostrarAuthModal(false)} />
      )}

      {mostrarCambiarPasswordModal && (
        <CambiarPasswordModal onClose={() => setMostrarCambiarPasswordModal(false)} />
      )}
    </div>
  );
}