import { useState, useEffect } from 'react';
import { api } from './api';
import PerfilModal from './PerfilModal';
import AuthModal from './AuthModal';
import CambiarPasswordModal from './CambiarPasswordModal';
import LiveTiming from './LiveTiming';
import ResultadosRallyServer from './ResultadosRallyServer';
import Campeonatos from './Campeonatos';

const fotosRally = [
  '/FondoTaller.png'
];

const ADMINS_EMAILS = [
  'leosimracingok@gmail.com',
  'lucashutter6@gmail.com'
];

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos
const SESION_STORAGE_KEY = 'esp_sesion_usuario';

const DEFAULT_INICIO_BADGE = 'TEMPORADA OFICIAL 2027 • 10 AÑOS DE ESPÍNDOLA COMPETICIÓN';
const DEFAULT_INICIO_TITULO = '10 AÑOS DE PASIÓN, VELOCIDAD Y GLORIA';

const leerCache = (clave) => {
  try {
    const raw = sessionStorage.getItem(clave);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) {
      sessionStorage.removeItem(clave);
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

const guardarCache = (clave, data) => {
  try {
    sessionStorage.setItem(clave, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // ignorar si sessionStorage está lleno o bloqueado
  }
};

const leerSesionGuardada = () => {
  try {
    const raw = localStorage.getItem(SESION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

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
  const [usuario, setUsuario] = useState(() => leerSesionGuardada());
  const [perfil, setPerfil] = useState(null);
  const [mostrarPerfilModal, setMostrarPerfilModal] = useState(false);
  const [mostrarAuthModal, setMostrarAuthModal] = useState(false);
  const [mostrarCambiarPasswordModal, setMostrarCambiarPasswordModal] = useState(false);
  const [pestanaActiva, setPestanaActiva] = useState('inicio');
  const [esAdmin, setEsAdmin] = useState(() => {
    const u = leerSesionGuardada();
    return Boolean(u?.isAdmin || ADMINS_EMAILS.includes((u?.email || '').toLowerCase().trim()));
  });
  const [vistaAdminActiva, setVistaAdminActiva] = useState(() => {
    const u = leerSesionGuardada();
    return Boolean(u?.isAdmin || ADMINS_EMAILS.includes((u?.email || '').toLowerCase().trim()));
  });

  const esAdminEfectivo = esAdmin && vistaAdminActiva;

  const [fondoActual, setFondoActual] = useState(0);
  const [menuPrincipalAbierto, setMenuPrincipalAbierto] = useState(false);
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);

  const [config, setConfig] = useState(() => ({
    instagram: 'https://instagram.com',
    discord: 'https://discord.gg',
    tiktok: 'https://tiktok.com',
    historia_texto: '',
    inicio_badge: DEFAULT_INICIO_BADGE,
    inicio_titulo: DEFAULT_INICIO_TITULO,
    ...(leerCache('esp_config') || {})
  }));
  const [editandoConfig, setEditandoConfig] = useState(false);

  const [eventos, setEventos] = useState([]);
  const [inscripciones, setInscripciones] = useState([]);
  const [eventoListaModal, setEventoListaModal] = useState(null);
  const [eventoHistorialModal, setEventoHistorialModal] = useState(null);
  const [campeonatosDisponibles, setCampeonatosDisponibles] = useState([]);
  const [subVistaEventos, setSubVistaEventos] = useState('activos');
  const [filtroCampeonatoEvento, setFiltroCampeonatoEvento] = useState('TODOS');

  const [calendario, setCalendario] = useState([]);
  const [fechaActualCalendario, setFechaActualCalendario] = useState(new Date(2027, 0, 1));

  const [diaSeleccionadoModal, setDiaSeleccionadoModal] = useState(null);
  const [asistentesEvento, setAsistentesEvento] = useState([]);
  const [enviandoParticipacionCalendario, setEnviandoParticipacionCalendario] = useState(false);

  const [eventoModalActivo, setEventoModalActivo] = useState(null);
  const [formInscripcion, setFormInscripcion] = useState({
    nombre_piloto: '',
    categoria_seleccionada: '',
    auto_seleccionado: '',
    pais_origen: 'ARGENTINA',
    steam_id: ''
  });
  const [enviandoInscripcion, setEnviandoInscripcion] = useState(false);

  const [nuevoEvento, setNuevoEvento] = useState({
    titulo: '',
    fecha: '',
    horario: '',
    categorias: '',
    modelos_autos: '',
    campeonato_id: '',
    numero_fecha: 1
  });
  const [nuevoCalendario, setNuevoCalendario] = useState({
    titulo: '',
    fecha: '',
    descripcion: ''
  });

  const [hallFama, setHallFama] = useState([]);
  const [nuevoPilotoFama, setNuevoPilotoFama] = useState({
    nombre: '',
    nacionalidad: 'ARGENTINA',
    campeonatos: '',
    foto: ''
  });
  const [editandoId, setEditandoId] = useState(null);

  const [miembros, setMiembros] = useState([]);

  const totalCampeonatosEquipo = hallFama.reduce((acc, piloto) => acc + (parseInt(piloto.campeonatos, 10) || 0), 0);

  useEffect(() => {
    const intervaloFondo = setInterval(() => {
      setFondoActual((prev) => (prev + 1) % fotosRally.length);
    }, 9000);
    return () => clearInterval(intervaloFondo);
  }, []);

  useEffect(() => {
    cargarConfiguracion();
    if (usuario) {
      verificarAdminYPerfil(usuario);
    }
  }, []);

  useEffect(() => {
    if (pestanaActiva === 'eventos') {
      cargarEventos();
      cargarInscripciones();
      cargarCampeonatosSelect();
    } else if (pestanaActiva === 'calendario') {
      cargarCalendario();
    } else if (pestanaActiva === 'fama') {
      cargarSalonDeLaFama();
    } else if (pestanaActiva === 'miembros') {
      cargarMiembros();
    } else if (pestanaActiva === 'historia') {
      cargarConfiguracion();
    }
  }, [pestanaActiva, esAdminEfectivo]);

  const exigirSesion = (mensaje = 'Tenés que iniciar sesión con tu cuenta de piloto para inscribirte o marcar asistencia.') => {
    if (!usuario) {
      alert(mensaje);
      setMostrarAuthModal(true);
      return false;
    }
    return true;
  };

  async function cargarConfiguracion(forzar = false) {
    if (!forzar) {
      const cached = leerCache('esp_config');
      if (cached) {
        setConfig(prev => ({ ...prev, ...cached }));
        return;
      }
    }

    const { data } = await api
      .from('configuracion_equipo')
      .eq('id', 1)
      .single()
      .select();

    if (data) {
      const nuevaConfig = {
        instagram: data.instagram || 'https://instagram.com',
        discord: data.discord || 'https://discord.gg',
        tiktok: data.tiktok || 'https://tiktok.com',
        historia_texto: data.historia_texto || '',
        inicio_badge: data.inicio_badge || DEFAULT_INICIO_BADGE,
        inicio_titulo: data.inicio_titulo || DEFAULT_INICIO_TITULO
      };
      setConfig(nuevaConfig);
      guardarCache('esp_config', nuevaConfig);
    }
  }

  async function cargarEventos() {
    const { data } = await api.from('eventos').select({
      order: 'created_at.desc',
      limit: 60
    });
    if (Array.isArray(data)) setEventos(data);
  }

  async function cargarInscripciones() {
    const { data } = await api.from('inscripciones').select({
      order: 'created_at.desc'
    });
    if (Array.isArray(data)) setInscripciones(data);
  }

  async function cargarCampeonatosSelect() {
    const { data } = await api.from('campeonatos').select({
      order: 'nombre.asc'
    });
    if (Array.isArray(data)) setCampeonatosDisponibles(data);
  }

  async function cargarCalendario() {
    const { data } = await api.from('calendario').select({
      order: 'fecha.asc'
    });
    if (Array.isArray(data)) setCalendario(data);
  }

  async function cargarSalonDeLaFama() {
    const { data, error } = await api.from('salon_fama').select({
      order: 'campeonatos.desc'
    });
    if (error) {
      console.error('Error al cargar Salón de la Fama:', error);
      setHallFama([]);
      return;
    }
    if (Array.isArray(data)) {
      const listaConPuestos = data.map((p, idx) => ({ ...p, puesto: idx + 1 }));
      setHallFama(listaConPuestos);
    }
  }

  async function cargarMiembros() {
    const { data } = await api.from('perfiles').select();
    if (Array.isArray(data)) setMiembros(data);
  }

  async function cargarAsistentesCalendario(calendarioId) {
    const { data } = await api.from('asistencias_calendario').select({
      eq_calendario_id: calendarioId
    });
    if (Array.isArray(data)) setAsistentesEvento(data);
  }

  async function verificarAdminYPerfil(user) {
    if (!user) return;
    const emailNormalizado = (user.email || '').toLowerCase().trim();
    const tienePermisoAdmin = Boolean(user.isAdmin) || ADMINS_EMAILS.includes(emailNormalizado);

    if (tienePermisoAdmin) {
      setEsAdmin(true);
      setVistaAdminActiva(true);
    } else {
      setEsAdmin(false);
      setVistaAdminActiva(false);
    }

    if (user.id) {
      const { data } = await api
        .from('perfiles')
        .eq('id', user.id)
        .single()
        .select();
      if (data) setPerfil(data);
    }
  }

  const handleSesionConfirmada = (userObj) => {
    try {
      localStorage.setItem(SESION_STORAGE_KEY, JSON.stringify(userObj));
    } catch {
      // ignorar error de storage
    }
    setUsuario(userObj);
    verificarAdminYPerfil(userObj);
  };

  const handleLogout = () => {
    if (typeof api.logout === 'function') {
      api.logout();
    }
    try {
      localStorage.removeItem(SESION_STORAGE_KEY);
    } catch {
      // ignorar error de storage
    }
    setUsuario(null);
    setPerfil(null);
    setEsAdmin(false);
    setVistaAdminActiva(false);
  };

  const handleGuardarConfig = async (e) => {
    e.preventDefault();
    const normalizarUrl = (url) => {
      const limpio = (url || '').trim();
      if (!limpio) return '';
      if (limpio.startsWith('http://') || limpio.startsWith('https://')) return limpio;
      return `https://${limpio}`;
    };

    const configLimpia = {
      instagram: normalizarUrl(config.instagram),
      discord: normalizarUrl(config.discord),
      tiktok: normalizarUrl(config.tiktok),
      historia_texto: config.historia_texto,
      inicio_badge: (config.inicio_badge || '').trim().toUpperCase() || DEFAULT_INICIO_BADGE,
      inicio_titulo: (config.inicio_titulo || '').trim().toUpperCase() || DEFAULT_INICIO_TITULO
    };

    const payload = {
      id: 1,
      ...configLimpia,
      updated_at: new Date().toISOString()
    };

    const { error } = await api.from('configuracion_equipo').insert(payload, { upsert: true });

    if (error) {
      alert('Error al guardar configuración: ' + error.message);
    } else {
      setConfig(configLimpia);
      guardarCache('esp_config', configLimpia);
      alert('¡Cambios guardados exitosamente!');
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
      campeonato_id: nuevoEvento.campeonato_id ? nuevoEvento.campeonato_id : null,
      numero_fecha: nuevoEvento.campeonato_id ? (parseInt(nuevoEvento.numero_fecha, 10) || 1) : null,
      archivado: 0
    };

    const { error } = await api.from('eventos').insert([datosInsertar]);

    if (error) {
      alert('Error al crear evento: ' + error.message);
    } else {
      setNuevoEvento({
        titulo: '',
        fecha: '',
        horario: '',
        categorias: '',
        modelos_autos: '',
        campeonato_id: '',
        numero_fecha: 1
      });
      setSubVistaEventos('activos');
      await cargarEventos();
    }
  };

  const handleToggleArchivarEvento = async (ev) => {
    if (!esAdminEfectivo) return;
    const nuevoEstado = Number(ev.archivado) === 1 ? 0 : 1;
    const { error } = await api
      .from('eventos')
      .eq('id', ev.id)
      .update({ archivado: nuevoEstado });
    if (error) {
      alert('Error al actualizar estado del evento: ' + error.message);
      return;
    }
    setEventos((prev) => prev.map((item) => (item.id === ev.id ? { ...item, archivado: nuevoEstado } : item)));
    await cargarEventos();
  };

  const handleEliminarEvento = async (id) => {
    if (!confirm('¿Seguro de eliminar este evento?')) return;
    const { error } = await api
      .from('eventos')
      .eq('id', id)
      .delete();
    if (error) {
      alert('Error al eliminar evento: ' + error.message);
      return;
    }
    setEventos((prev) => prev.filter((item) => item.id !== id));
    await cargarEventos();
  };

  const abrirModalEvento = (ev) => {
    if (!exigirSesion('Tenés que iniciar sesión con tu cuenta de piloto para inscribirte a un evento.')) {
      return;
    }
    const categoriasLista = ev.categorias ? ev.categorias.split(',').map(c => c.trim()).filter(Boolean) : [];
    const autosLista = ev.modelos_autos ? ev.modelos_autos.split(',').map(m => m.trim()).filter(Boolean) : [];
    setEventoModalActivo(ev);
    setFormInscripcion({
      nombre_piloto: perfil?.nombre_piloto || usuario?.email?.split('@')[0] || '',
      categoria_seleccionada: categoriasLista[0] || 'GENERAL',
      auto_seleccionado: autosLista[0] || 'LIBRE',
      pais_origen: perfil?.nacionalidad || 'ARGENTINA',
      steam_id: perfil?.steam_id || ''
    });
  };

  const handleEnviarInscripcion = async (e) => {
    e.preventDefault();
    if (!exigirSesion('Tenés que iniciar sesión con tu cuenta de piloto para confirmar la inscripción.')) {
      return;
    }
    if (!eventoModalActivo || !formInscripcion.nombre_piloto.trim()) return;
    setEnviandoInscripcion(true);
    const { error } = await api.from('inscripciones').insert([{
      evento_id: eventoModalActivo.id,
      nombre_piloto: formInscripcion.nombre_piloto.trim().toUpperCase(),
      categoria_seleccionada: formInscripcion.categoria_seleccionada.trim().toUpperCase(),
      auto_seleccionado: formInscripcion.auto_seleccionado.trim().toUpperCase(),
      pais_origen: formInscripcion.pais_origen.trim().toUpperCase(),
      steam_id: formInscripcion.steam_id.trim()
    }]);
    setEnviandoInscripcion(false);
    if (error) {
      alert('Error al inscribirse: ' + error.message);
    } else {
      alert('¡Inscripción confirmada con éxito! 🏁');
      setEventoModalActivo(null);
      await cargarInscripciones();
    }
  };

  const handleToggleParticipoCalendario = async () => {
    if (!exigirSesion('Tenés que iniciar sesión con tu cuenta de piloto para marcar "PARTICIPO" en el calendario.')) {
      return;
    }
    if (!diaSeleccionadoModal) return;

    const nombrePilotoActual = (
      perfil?.nombre_piloto ||
      usuario?.email?.split('@')[0] ||
      'PILOTO'
    ).trim().toUpperCase();

    const yaParticipa = asistentesEvento.find(
      (a) => String(a.piloto_nombre || '').trim().toUpperCase() === nombrePilotoActual
    );

    setEnviandoParticipacionCalendario(true);
    try {
      if (yaParticipa) {
        const { error } = await api
          .from('asistencias_calendario')
          .eq('id', yaParticipa.id)
          .delete();
        if (error) {
          alert('No se pudo quitar la participación: ' + error.message);
          return;
        }
      } else {
        const { error } = await api.from('asistencias_calendario').insert([{
          calendario_id: diaSeleccionadoModal.id,
          piloto_nombre: nombrePilotoActual,
          estado: 'participo'
        }]);
        if (error) {
          alert('No se pudo registrar la participación: ' + error.message);
          return;
        }
      }
      await cargarAsistentesCalendario(diaSeleccionadoModal.id);
    } finally {
      setEnviandoParticipacionCalendario(false);
    }
  };

  const handleCrearCalendario = async (e) => {
    e.preventDefault();
    if (!nuevoCalendario.titulo || !nuevoCalendario.fecha) return;

    const { error } = await api.from('calendario').insert([nuevoCalendario]);

    if (error) {
      alert('Error al crear fecha de calendario: ' + error.message);
    } else {
      setNuevoCalendario({ titulo: '', fecha: '', descripcion: '' });
      await cargarCalendario();
    }
  };

  const handleEliminarCalendario = async (id) => {
    if (!confirm('¿Eliminar esta fecha del calendario?')) return;
    const { error } = await api
      .from('calendario')
      .eq('id', id)
      .delete();
    if (error) {
      alert('Error al eliminar fecha del calendario: ' + error.message);
      return;
    }
    setCalendario((prev) => prev.filter((item) => item.id !== id));
    await cargarCalendario();
  };

  const handleGuardarPilotoFama = async (e) => {
    e.preventDefault();
    if (!nuevoPilotoFama.nombre.trim()) return;

    const datosPiloto = {
      nombre: nuevoPilotoFama.nombre.trim().toUpperCase(),
      nacionalidad: (nuevoPilotoFama.nacionalidad || 'ARGENTINA').trim().toUpperCase(),
      campeonatos: parseInt(nuevoPilotoFama.campeonatos, 10) || 0,
      foto: (nuevoPilotoFama.foto || '').trim() || 'https://files.catbox.moe/f3xmld.png'
    };

    const { error } = editandoId !== null
      ? await api.from('salon_fama').eq('id', editandoId).update(datosPiloto)
      : await api.from('salon_fama').insert([datosPiloto]);

    if (error) {
      alert('Error al guardar en Salón de la Fama: ' + error.message);
      return;
    }

    setEditandoId(null);
    setNuevoPilotoFama({ nombre: '', nacionalidad: 'ARGENTINA', campeonatos: '', foto: '' });
    await cargarSalonDeLaFama();
  };

  const handleEditarPilotoFama = (piloto) => {
    setEditandoId(piloto.id);
    setNuevoPilotoFama({
      nombre: piloto.nombre || '',
      nacionalidad: piloto.nacionalidad || 'ARGENTINA',
      campeonatos: piloto.campeonatos ?? '',
      foto: piloto.foto || ''
    });
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleEliminarPilotoFama = async (id) => {
    if (!confirm('¿Eliminar del Salón de la Fama?')) return;
    const { error } = await api
      .from('salon_fama')
      .eq('id', id)
      .delete();
    if (error) {
      alert('Error al eliminar del Salón de la Fama: ' + error.message);
      return;
    }
    await cargarSalonDeLaFama();
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

  const nombrePilotoActualNormalizado = (
    perfil?.nombre_piloto ||
    usuario?.email?.split('@')[0] ||
    ''
  ).trim().toUpperCase();

  const usuarioYaParticipaEnDia = Boolean(
    usuario &&
    asistentesEvento.some(
      (a) => String(a.piloto_nombre || '').trim().toUpperCase() === nombrePilotoActualNormalizado
    )
  );

  const inscriptosModalEvento = eventoListaModal
    ? inscripciones.filter((ins) => String(ins.evento_id) === String(eventoListaModal.id))
    : [];

  const eventosActivos = eventos.filter((ev) => Number(ev.archivado) !== 1);
  const eventosArchivados = eventos.filter((ev) => Number(ev.archivado) === 1);

  const eventosFiltrados = (subVistaEventos === 'activos' ? eventosActivos : eventosArchivados).filter((ev) => {
    if (filtroCampeonatoEvento === 'TODOS') return true;
    if (filtroCampeonatoEvento === 'SIN_CAMPEONATO') return !ev.campeonato_id;
    return String(ev.campeonato_id) === String(filtroCampeonatoEvento);
  });

  const obtenerNombreCampeonato = (campeonatoId) => {
    if (!campeonatoId) return null;
    const found = campeonatosDisponibles.find((c) => String(c.id) === String(campeonatoId));
    return found?.nombre || null;
  };

  const tituloInicioActual = (config.inicio_titulo || DEFAULT_INICIO_TITULO).toUpperCase();
  const tienePalabraGloria = tituloInicioActual.includes('GLORIA');
  const partesGloria = tienePalabraGloria ? tituloInicioActual.split('GLORIA') : [tituloInicioActual];

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
            <div className="max-w-xl mx-auto text-center space-y-3 py-6">
              <span className="inline-block bg-[#38bdf8]/20 text-[#38bdf8] font-wrc text-[11px] tracking-widest px-3 py-1 rounded-full border border-[#38bdf8]/40 uppercase backdrop-blur-md shadow-md">
                {config.inicio_badge || DEFAULT_INICIO_BADGE} {esAdminEfectivo && '• MODO ADMIN'}
              </span>

              <h1 className="font-wrc text-3xl md:text-5xl font-black tracking-tight text-white uppercase drop-shadow-[0_3px_15px_rgba(0,0,0,0.95)]">
                {tienePalabraGloria ? (
                  <>
                    {partesGloria[0]}
                    <span className="text-[#38bdf8] drop-shadow-[0_0_20px_rgba(56,189,248,0.55)]">GLORIA</span>
                    {partesGloria.slice(1).join('GLORIA')}
                  </>
                ) : (
                  tituloInicioActual
                )}
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
                    ✏️ EDITAR HISTORIA, REDES Y PORTADA
                  </button>
                )}
              </div>

              {!editandoConfig ? (
                <div className="text-neutral-200 text-[11px] md:text-xs leading-snug font-wrc whitespace-pre-line space-y-2.5">
                  {config.historia_texto || "HISTORIA NO DEFINIDA. PUEDES AGREGARLA DESDE EL PANEL DE ADMINISTRACIÓN."}
                </div>
              ) : (
                <form onSubmit={handleGuardarConfig} className="space-y-3">
                  <div className="space-y-2 border-b border-white/10 pb-3">
                    <p className="text-[10px] text-[#38bdf8] font-wrc">PANTALLA PRINCIPAL (INICIO):</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] text-neutral-300 mb-1">ETIQUETA SUPERIOR (BADGE)</label>
                        <input
                          type="text"
                          value={config.inicio_badge || ''}
                          onChange={(e) => setConfig({ ...config, inicio_badge: e.target.value })}
                          placeholder={DEFAULT_INICIO_BADGE}
                          className="w-full bg-neutral-950 border border-white/15 rounded-lg px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-[#38bdf8]"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-neutral-300 mb-1">TÍTULO PRINCIPAL</label>
                        <input
                          type="text"
                          value={config.inicio_titulo || ''}
                          onChange={(e) => setConfig({ ...config, inicio_titulo: e.target.value })}
                          placeholder={DEFAULT_INICIO_TITULO}
                          className="w-full bg-neutral-950 border border-white/15 rounded-lg px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-[#38bdf8]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 border-b border-white/10 pb-3">
                    <p className="text-[10px] text-[#38bdf8] font-wrc">LINKS DE REDES SOCIALES:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[9px] text-neutral-300 mb-1">INSTAGRAM</label>
                        <input
                          type="text"
                          value={config.instagram || ''}
                          onChange={(e) => setConfig({ ...config, instagram: e.target.value })}
                          placeholder="https://instagram.com/tu_cuenta"
                          className="w-full bg-neutral-950 border border-white/15 rounded-lg px-2.5 py-1.5 text-[11px] text-white lowercase outline-none focus:border-[#38bdf8]"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-neutral-300 mb-1">TIKTOK</label>
                        <input
                          type="text"
                          value={config.tiktok || ''}
                          onChange={(e) => setConfig({ ...config, tiktok: e.target.value })}
                          placeholder="https://tiktok.com/@tu_cuenta"
                          className="w-full bg-neutral-950 border border-white/15 rounded-lg px-2.5 py-1.5 text-[11px] text-white lowercase outline-none focus:border-[#38bdf8]"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-neutral-300 mb-1">DISCORD</label>
                        <input
                          type="text"
                          value={config.discord || ''}
                          onChange={(e) => setConfig({ ...config, discord: e.target.value })}
                          placeholder="https://discord.gg/tu_invitacion"
                          className="w-full bg-neutral-950 border border-white/15 rounded-lg px-2.5 py-1.5 text-[11px] text-white lowercase outline-none focus:border-[#38bdf8]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] text-[#38bdf8] font-wrc">TEXTO DE LA HISTORIA:</p>
                    <textarea
                      rows={10}
                      value={config.historia_texto}
                      onChange={(e) => setConfig({ ...config, historia_texto: e.target.value.toUpperCase() })}
                      className="w-full bg-neutral-950 border border-[#38bdf8]/50 rounded-xl p-3 text-[11px] text-white focus:border-[#38bdf8] outline-none font-wrc uppercase leading-snug"
                    />
                  </div>

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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <h2 className="font-wrc text-xl md:text-2xl text-[#38bdf8] tracking-wide">INSCRIPCIONES Y CAMPEONATOS</h2>
                <p className="text-neutral-300 text-[10px] md:text-[11px] font-wrc">FECHAS ACTIVAS PARA CORRER Y ARCHIVO ORDENADO POR EVENTO O CAMPEONATO.</p>
              </div>

              <div className="flex items-center gap-1.5 bg-neutral-900/80 p-1 rounded-xl border border-white/15">
                <button
                  type="button"
                  onClick={() => setSubVistaEventos('activos')}
                  className={`px-3 py-1.5 rounded-lg font-wrc text-[10px] tracking-wider transition cursor-pointer ${
                    subVistaEventos === 'activos'
                      ? 'bg-[#38bdf8] text-slate-950 font-black'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  EVENTOS ACTIVOS ({eventosActivos.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSubVistaEventos('historial')}
                  className={`px-3 py-1.5 rounded-lg font-wrc text-[10px] tracking-wider transition cursor-pointer ${
                    subVistaEventos === 'historial'
                      ? 'bg-[#38bdf8] text-slate-950 font-black'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  ARCHIVO / HISTORIAL ({eventosArchivados.length})
                </button>
              </div>
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
                    onChange={(e) => setNuevoEvento({ ...nuevoEvento, campeonato_id: e.target.value, numero_fecha: 1 })}
                    className="bg-neutral-950 border border-white/15 rounded-lg px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-[#38bdf8]"
                  >
                    <option value="">SIN CAMPEONATO VINCULADO</option>
                    {campeonatosDisponibles.map((camp) => (
                      <option key={camp.id} value={camp.id}>{camp.nombre}</option>
                    ))}
                  </select>

                  {nuevoEvento.campeonato_id && (
                    <input
                      type="number"
                      min="1"
                      max="30"
                      placeholder="N° FECHA (EJ: 1)"
                      value={nuevoEvento.numero_fecha}
                      onChange={(e) => setNuevoEvento({ ...nuevoEvento, numero_fecha: e.target.value })}
                      className="bg-neutral-950 border border-[#38bdf8]/40 rounded-lg px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-[#38bdf8]"
                    />
                  )}
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

            <div className="flex flex-wrap items-center justify-between gap-2 bg-neutral-900/50 border border-white/10 rounded-xl px-3.5 py-2">
              <span className="text-[10px] font-wrc text-neutral-300">
                {subVistaEventos === 'activos' ? 'FECHAS DISPONIBLES PARA INSCRIBIRSE' : 'FECHAS ARCHIVADAS PARA CONSULTAR HISTORIAL'}
              </span>
              <select
                value={filtroCampeonatoEvento}
                onChange={(e) => setFiltroCampeonatoEvento(e.target.value)}
                className="bg-neutral-950 border border-[#38bdf8]/40 text-[#38bdf8] text-[10px] font-wrc rounded-lg px-2.5 py-1 outline-none cursor-pointer"
              >
                <option value="TODOS">CAMPEONATO: TODOS</option>
                <option value="SIN_CAMPEONATO">EVENTOS SUELTOS</option>
                {campeonatosDisponibles.map((camp) => (
                  <option key={camp.id} value={camp.id}>{camp.nombre}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2.5">
              {eventosFiltrados.length === 0 ? (
                <div className="bg-neutral-900/50 border border-white/10 rounded-xl p-6 text-center text-neutral-400 font-wrc text-xs">
                  {subVistaEventos === 'activos'
                    ? 'NO HAY EVENTOS ACTIVOS EN ESTE FILTRO.'
                    : 'NO HAY EVENTOS ARCHIVADOS EN ESTE FILTRO.'}
                </div>
              ) : (
                eventosFiltrados.map((ev) => {
                  const cantidadInscriptos = inscripciones.filter(
                    (ins) => String(ins.evento_id) === String(ev.id)
                  ).length;
                  const nombreCamp = obtenerNombreCampeonato(ev.campeonato_id);
                  const estaArchivado = Number(ev.archivado) === 1;

                  return (
                    <div key={ev.id} className="bg-neutral-900/50 backdrop-blur-md border border-white/10 rounded-xl p-3.5 md:p-4 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[#38bdf8] font-wrc text-[9px] tracking-widest uppercase">{ev.fecha} • {ev.horario || 'POR CONFIRMAR'}</span>
                          {nombreCamp && (
                            <span className="text-[9px] font-wrc bg-[#38bdf8]/15 text-sky-200 border border-[#38bdf8]/35 px-2 py-0.5 rounded-full">
                              🏆 {nombreCamp}{ev.numero_fecha ? ` • FECHA ${ev.numero_fecha}` : ''}
                            </span>
                          )}
                        </div>
                        <h3 className="font-wrc text-base md:text-lg text-white leading-tight">{ev.titulo}</h3>
                        <p className="text-neutral-300 text-[10px] font-wrc uppercase">CATEGORÍAS: {ev.categorias || 'GENERAL'} | AUTOS: {ev.modelos_autos || 'LIBRE'}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                        <button
                          type="button"
                          onClick={() => setEventoHistorialModal(ev)}
                          className="bg-neutral-900/90 hover:bg-neutral-800 text-sky-200 border border-white/20 font-wrc text-[10px] px-3 py-1.5 rounded-lg transition tracking-wider cursor-pointer uppercase"
                        >
                          HISTORIAL / TIEMPOS
                        </button>
                        <button
                          type="button"
                          onClick={() => setEventoListaModal(ev)}
                          className="bg-neutral-900/90 hover:bg-neutral-800 text-[#38bdf8] border border-[#38bdf8]/40 font-wrc text-[10px] px-3 py-1.5 rounded-lg transition tracking-wider cursor-pointer uppercase"
                        >
                          LISTA DE INSCRIPTOS ({cantidadInscriptos})
                        </button>
                        {!estaArchivado && (
                          <button
                            type="button"
                            onClick={() => abrirModalEvento(ev)}
                            className="bg-[#38bdf8] hover:bg-[#7dd3fc] text-slate-950 font-wrc text-[10px] px-3 py-1.5 rounded-lg transition shadow tracking-wider cursor-pointer font-black uppercase"
                          >
                            {usuario ? 'INSCRIBIRSE' : 'INICIÁ SESIÓN PARA INSCRIBIRTE'}
                          </button>
                        )}
                        {esAdminEfectivo && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleToggleArchivarEvento(ev)}
                              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-white/15 font-wrc text-[10px] px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                            >
                              {estaArchivado ? 'RESTAURAR' : 'ARCHIVAR'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEliminarEvento(ev.id)}
                              className="bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/40 font-wrc text-[10px] px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                            >
                              ELIMINAR
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
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
                    placeholder="NOMBRE"
                    value={nuevoPilotoFama.nombre}
                    onChange={(e) => setNuevoPilotoFama({ ...nuevoPilotoFama, nombre: e.target.value.toUpperCase() })}
                    className="bg-neutral-950 border border-white/15 rounded-lg px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-[#38bdf8]"
                    required
                  />
                  <input
                    type="text"
                    placeholder="NACIONALIDAD"
                    value={nuevoPilotoFama.nacionalidad}
                    onChange={(e) => setNuevoPilotoFama({ ...nuevoPilotoFama, nacionalidad: e.target.value.toUpperCase() })}
                    className="bg-neutral-950 border border-white/15 rounded-lg px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-[#38bdf8]"
                  />
                  <input
                    type="number"
                    placeholder="TÍTULOS"
                    value={nuevoPilotoFama.campeonatos}
                    onChange={(e) => setNuevoPilotoFama({ ...nuevoPilotoFama, campeonatos: e.target.value })}
                    className="bg-neutral-950 border border-white/15 rounded-lg px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-[#38bdf8]"
                    required
                  />
                  <input
                    type="text"
                    placeholder="URL FOTO"
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
                        setNuevoPilotoFama({ nombre: '', nacionalidad: 'ARGENTINA', campeonatos: '', foto: '' });
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
                      <img src={hallFama[1].foto || 'https://files.catbox.moe/f3xmld.png'} alt={hallFama[1].nombre} className="w-full h-full object-cover" />
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="font-wrc text-base md:text-lg text-white tracking-wide leading-tight">{hallFama[1].nombre}</h3>
                      <p className="text-neutral-300 text-[10px] font-wrc uppercase">{obtenerBanderaPais(hallFama[1].nacionalidad)}</p>
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
                      <img src={hallFama[0].foto || 'https://files.catbox.moe/f3xmld.png'} alt={hallFama[0].nombre} className="w-full h-full object-cover" />
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="font-wrc text-lg md:text-xl text-[#38bdf8] tracking-wide leading-tight">{hallFama[0].nombre}</h3>
                      <p className="text-neutral-200 text-[10px] font-wrc uppercase">{obtenerBanderaPais(hallFama[0].nacionalidad)}</p>
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
                      <img src={hallFama[2].foto || 'https://files.catbox.moe/f3xmld.png'} alt={hallFama[2].nombre} className="w-full h-full object-cover" />
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="font-wrc text-base md:text-lg text-white tracking-wide leading-tight">{hallFama[2].nombre}</h3>
                      <p className="text-neutral-300 text-[10px] font-wrc uppercase">{obtenerBanderaPais(hallFama[2].nacionalidad)}</p>
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
                          <span className="text-[9px] text-neutral-400">{obtenerBanderaPais(piloto.nacionalidad)}</span>
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

      <footer className="relative z-40 w-full max-w-[1400px] mx-auto px-6 pb-4 flex items-center justify-between gap-3 mt-6 text-xs">
        <div className="hidden md:block w-24" />

        <div className="flex items-center justify-center flex-1">
          <img
            src="/sponsor.svg"
            alt="Sponsors Espíndola Competición"
            className="h-4 md:h-5 w-auto object-contain opacity-80 hover:opacity-100 transition drop-shadow-md mx-auto"
          />
        </div>

        <div className="flex items-center justify-end gap-3.5">
          {config.instagram && (
            <a
              href={config.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              title="Instagram"
              className="text-white hover:text-[#38bdf8] transition drop-shadow"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
          )}
          {config.tiktok && (
            <a
              href={config.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              title="TikTok"
              className="text-white hover:text-[#38bdf8] transition drop-shadow"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5 fill-current" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
              </svg>
            </a>
          )}
          {config.discord && (
            <a
              href={config.discord}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Discord"
              title="Discord"
              className="text-white hover:text-[#38bdf8] transition drop-shadow"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5 fill-current" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </a>
          )}
        </div>
      </footer>

      {eventoHistorialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5">
          <div className="bg-neutral-950 border border-[#38bdf8]/40 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-4 sm:p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] text-[#38bdf8] font-wrc tracking-widest">HISTORIAL DE RALLY DEL EVENTO</span>
                <h3 className="font-wrc text-xl sm:text-2xl text-white">{eventoHistorialModal.titulo}</h3>
              </div>
              <button
                type="button"
                onClick={() => setEventoHistorialModal(null)}
                className="bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-black px-3 py-1.5 rounded-xl border border-white/10 cursor-pointer"
              >
                ✕ CERRAR
              </button>
            </div>

            <ResultadosRallyServer
              esAdmin={esAdminEfectivo}
              eventoId={eventoHistorialModal.id}
              campeonatoId={eventoHistorialModal.campeonato_id}
              tituloEvento={eventoHistorialModal.titulo}
            />
          </div>
        </div>
      )}

      {eventoListaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="bg-neutral-900 border border-[#38bdf8]/40 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] text-[#38bdf8] font-bold">LISTA DE INSCRIPTOS ({inscriptosModalEvento.length})</span>
                <h3 className="font-wrc text-xl text-white">{eventoListaModal.titulo}</h3>
              </div>
              <button
                type="button"
                onClick={() => setEventoListaModal(null)}
                className="text-neutral-400 hover:text-white text-sm px-2 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {inscriptosModalEvento.length === 0 ? (
              <p className="text-xs text-neutral-400 font-wrc py-4 text-center">
                AÚN NO HAY PILOTOS INSCRIPTOS EN ESTE EVENTO.
              </p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {inscriptosModalEvento.map((ins, idx) => (
                  <div
                    key={ins.id}
                    className="bg-neutral-950 border border-white/10 rounded-xl px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[#38bdf8] font-wrc text-xs">#{idx + 1}</span>
                      <span className="font-wrc text-sm text-white">{ins.nombre_piloto}</span>
                    </div>
                    <div className="text-[10px] text-sky-300 font-mono flex flex-wrap gap-2">
                      {ins.categoria_seleccionada && <span>{ins.categoria_seleccionada}</span>}
                      {ins.auto_seleccionado && <span>• {ins.auto_seleccionado}</span>}
                      {ins.pais_origen && <span className="text-neutral-400">• {ins.pais_origen}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setEventoListaModal(null)}
                className="bg-[#38bdf8] hover:bg-[#7dd3fc] text-slate-950 font-black text-xs px-4 py-1.5 rounded-xl cursor-pointer"
              >
                CERRAR
              </button>
            </div>
          </div>
        </div>
      )}

      {eventoModalActivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="bg-neutral-900 border border-[#38bdf8]/40 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] text-[#38bdf8] font-bold">INSCRIPCIÓN A EVENTO</span>
                <h3 className="font-wrc text-xl text-white">{eventoModalActivo.titulo}</h3>
              </div>
              <button
                onClick={() => setEventoModalActivo(null)}
                className="text-neutral-400 hover:text-white text-sm px-2 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEnviarInscripcion} className="space-y-3">
              <div>
                <label className="block text-[10px] text-neutral-300 mb-1">NOMBRE DEL PILOTO</label>
                <input
                  type="text"
                  value={formInscripcion.nombre_piloto}
                  onChange={(e) => setFormInscripcion({ ...formInscripcion, nombre_piloto: e.target.value })}
                  required
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-neutral-300 mb-1">CATEGORÍA</label>
                  <input
                    type="text"
                    value={formInscripcion.categoria_seleccionada}
                    onChange={(e) => setFormInscripcion({ ...formInscripcion, categoria_seleccionada: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-neutral-300 mb-1">MODELO DE AUTO</label>
                  <input
                    type="text"
                    value={formInscripcion.auto_seleccionado}
                    onChange={(e) => setFormInscripcion({ ...formInscripcion, auto_seleccionado: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-neutral-300 mb-1">PAÍS</label>
                  <input
                    type="text"
                    value={formInscripcion.pais_origen}
                    onChange={(e) => setFormInscripcion({ ...formInscripcion, pais_origen: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-neutral-300 mb-1">STEAM ID 64</label>
                  <input
                    type="text"
                    value={formInscripcion.steam_id}
                    onChange={(e) => setFormInscripcion({ ...formInscripcion, steam_id: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-[#38bdf8]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEventoModalActivo(null)}
                  className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs px-4 py-2 rounded-xl cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  disabled={enviandoInscripcion}
                  className="bg-[#38bdf8] hover:bg-[#7dd3fc] text-slate-950 font-black text-xs px-5 py-2 rounded-xl cursor-pointer"
                >
                  {enviandoInscripcion ? 'GUARDANDO...' : 'CONFIRMAR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {diaSeleccionadoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="bg-neutral-900 border border-[#38bdf8]/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <div>
                <span className="text-[10px] text-[#38bdf8] font-mono">{diaSeleccionadoModal.fecha}</span>
                <h3 className="font-wrc text-xl text-white">{diaSeleccionadoModal.titulo}</h3>
              </div>
              <button
                onClick={() => setDiaSeleccionadoModal(null)}
                className="text-neutral-400 hover:text-white text-sm px-2 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-300">
              {diaSeleccionadoModal.descripcion || 'FECHA OFICIAL EN EL CALENDARIO DEL EQUIPO.'}
            </p>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-wrc text-[#38bdf8] tracking-wider">
                  PILOTOS QUE PARTICIPAN ({asistentesEvento.length})
                </span>
                <button
                  type="button"
                  onClick={handleToggleParticipoCalendario}
                  disabled={enviandoParticipacionCalendario}
                  className={`font-wrc text-[10px] font-black px-3 py-1 rounded-lg transition cursor-pointer ${
                    usuarioYaParticipaEnDia
                      ? 'bg-red-500/20 hover:bg-red-500/35 text-red-300 border border-red-500/40'
                      : 'bg-[#38bdf8] hover:bg-[#7dd3fc] text-slate-950'
                  }`}
                >
                  {enviandoParticipacionCalendario
                    ? 'GUARDANDO...'
                    : !usuario
                      ? 'INICIÁ SESIÓN PARA PARTICIPAR'
                      : usuarioYaParticipaEnDia
                        ? 'QUITAR PARTICIPACIÓN'
                        : 'PARTICIPO'}
                </button>
              </div>

              {asistentesEvento.length === 0 ? (
                <p className="text-[10px] text-neutral-400 font-wrc">NADIE MARCÓ PARTICIPACIÓN TODAVÍA.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pt-1">
                  {asistentesEvento.map((asistente) => (
                    <span
                      key={asistente.id}
                      className="text-[10px] font-wrc bg-neutral-950 border border-white/15 text-neutral-200 px-2.5 py-1 rounded-full"
                    >
                      🏁 {asistente.piloto_nombre}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                onClick={() => setDiaSeleccionadoModal(null)}
                className="bg-neutral-800 hover:bg-neutral-700 text-white font-black text-xs px-4 py-1.5 rounded-xl cursor-pointer"
              >
                CERRAR
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarPerfilModal && (
        <PerfilModal
          usuario={usuario}
          perfil={perfil}
          onClose={() => setMostrarPerfilModal(false)}
          onActualizado={() => verificarAdminYPerfil(usuario)}
        />
      )}

      {mostrarAuthModal && (
        <AuthModal
          onClose={() => setMostrarAuthModal(false)}
          onLoginExitoso={handleSesionConfirmada}
        />
      )}

      {mostrarCambiarPasswordModal && (
        <CambiarPasswordModal onClose={() => setMostrarCambiarPasswordModal(false)} />
      )}
    </div>
  );
}