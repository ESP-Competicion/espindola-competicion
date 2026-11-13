import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import PerfilModal from './PerfilModal';
import AuthModal from './AuthModal';
import CambiarPasswordModal from './CambiarPasswordModal';
import SubirImagen from './SubirImagen';

const fotosRally = [
  '/fondo.jpg' // Cambialo por el nombre exacto de tu imagen en public
];

// FUNCIÓN AUXILIAR PARA OBTENER EL CÓDIGO ISO DEL PAÍS Y RENDERIZAR SUA BANDERA
const obtenerBanderaPais = (pais) => {
  if (!pais) return <span className="inline-flex items-center gap-1.5">ARGENTINA <img src="https://flagcdn.com/w20/ar.png" alt="AR" className="w-5 h-3.5 object-cover rounded-[2px] shadow-sm inline-block align-middle" /></span>;
  
  const p = pais.toUpperCase().trim();
  let codigoIso = 'ar'; // Por defecto Argentina

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
  else if (p.includes('ESTADOS UNIDOS') || p.includes('USA') || p.includes('EEUU') || p === 'US') codigoIso = 'us';
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
        className="w-5 h-3.5 object-cover rounded-[2px] shadow-sm inline-block align-middle border border-white/20" 
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

  const [fondoActual, setFondoActual] = useState(0);

  // ESTADOS DE MENÚS DESPLEGABLES (HUD)
  const [menuPrincipalAbierto, setMenuPrincipalAbierto] = useState(false);
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);

  // CONFIGURACIÓN SOCIAL E HISTORIA COMPLETA
  const [config, setConfig] = useState({
    instagram: 'https://instagram.com',
    discord: 'https://discord.gg',
    tiktok: 'https://tiktok.com',
    historia_texto: `HISTORIA DE ESPINDOLA COMPETICIÓN

UNA HISTORIA DE PASIÓN, EVOLUCIÓN Y COMPETITIVIDAD

Una historia familiar que comenzó en los caminos del rally Misionero y terminó convirtiéndose en un proyecto internacional de automovilismo virtual.

ANTES DEL SIMRACING
Los orígenes de una pasión

La historia de Espindola Competición comenzó mucho antes de llegar al automovilismo virtual.

En los caminos del rally argentino, José “Polaco” Espindola construyó una identidad deportiva basada en la pasión por los motores, la competencia y los desafíos de cada carrera.

Años más tarde, ese legado familiar sería el punto de partida de un nuevo proyecto, trasladando los mismos valores al mundo del simracing.

2017
El nacimiento de Espindola Competición Virtual

Leonardo Espindola decidió continuar el legado familiar fundando Espindola Competición Virtual.

Todo comenzó en rFactor, como un grupo de amigos que se reunían por diversión para compartir carreras y disfrutar del automovilismo.

Con el tiempo, aquella iniciativa comenzó a crecer. Las ganas de competir, mejorar y conseguir nuevos objetivos transformaron ese grupo en un equipo con identidad propia y aspiraciones profesionales.

EVOLUCIÓN
De rFactor a los grandes simuladores

El crecimiento del equipo estuvo acompañado por la evolución del simracing.

Desde sus primeros pasos en rFactor, Espindola Competición fue expandiéndose hacia diferentes plataformas como Automobilista, Richard Burns Rally (RBR) y Assetto Corsa.

En cada simulador encontró nuevos desafíos y oportunidades, consiguiendo victorias y campeonatos en todos ellos.

Lo que comenzó como un proyecto entre amigos terminó convirtiéndose en una estructura competitiva, reconocida por su trayectoria y sus resultados.

EXPANSIÓN INTERNACIONAL
Un equipo sin fronteras

El crecimiento deportivo también permitió expandir las fronteras del equipo.

Con el paso de los años se incorporaron pilotos de diferentes nacionalidades, llevando los colores de Espindola Competición a campeonatos de Argentina y Europa.

Hoy contamos con representantes en distintas disciplinas y categorías, formando una estructura internacional donde el talento, el compromiso y la competitividad son parte de nuestra identidad.

2023
Dos disciplinas, una misma identidad

En 2023, el crecimiento del proyecto dio lugar a una nueva organización deportiva: Espindola Competición se dividió en dos estructuras especializadas, Rally y Pista.

Esta decisión permitió desarrollar ambas disciplinas de manera independiente, con pilotos, objetivos y preparaciones específicas para cada categoría.

También marcó el comienzo de una etapa muy importante: la incorporación de pilotos con experiencia en el automovilismo profesional.

ESPINDOLA COMPETICIÓN PISTA
El equipo comenzó a reunir pilotos provenientes del automovilismo real, fortaleciendo el vínculo entre las competencias virtuales y las pistas.

Entre ellos se destacan:
- Luciano “Chule” Martínez, Campeón del Turismo Pista Clase 1.
- Alejandro Felice, Actual piloto del Turismo Pista.

La presencia de pilotos profesionales dentro de nuestra estructura representa un orgullo y demuestra el crecimiento que alcanzó el proyecto.

ESPINDOLA COMPETICIÓN RALLY
En la disciplina de rally también logramos incorporar pilotos de gran trayectoria internacional.

Uno de los nombres más destacados es el del peruano José Abelardo “Abito” Caparó, piloto que llegó a competir en el Campeonato Mundial de Rally (WRC), dentro de la categoría Junior WRC.

Su incorporación representa un paso muy importante para el equipo y refuerza nuestra presencia internacional en el mundo del rally.

2025
Un año histórico: campeones argentinos

El 2025 quedó marcado como uno de los años más importantes en la historia de Espindola Competición.

Logramos consagrarnos campeones argentinos del Campeonato Argentino Virtual en tres categorías diferentes:
- RC5 — Leo Espindola
- RC3 — Lucas Hutter
- COPA YARIS — Lázaro Campos

Tres títulos nacionales que reflejan el trabajo, la dedicación y el nivel competitivo de nuestros pilotos.

Un logro colectivo que reafirmó nuestro protagonismo dentro del automovilismo virtual argentino.

ACTUALIDAD
60 campeonatos y una historia que continúa

Desde nuestros comienzos hasta la actualidad, Espindola Competición ha conseguido alcanzar un total de 60 campeonatos, conquistados en competencias de Argentina y Europa.

Una trayectoria construida a través de diferentes simuladores, disciplinas y categorías, con pilotos que han representado nuestros colores dentro y fuera del país.

Hoy seguimos creciendo como una estructura internacional, con presencia en Rally y Pista, nuevos talentos y grandes objetivos por delante.

Aquello que comenzó como un grupo de amigos en rFactor se convirtió en un equipo con identidad, historia y reconocimiento deportivo.

60 CAMPEONATOS. MÚLTIPLES DISCIPLINAS. UNA MISMA PASIÓN.

La historia continúa y todavía quedan muchos kilómetros por recorrer.

“No importa cuántos kilómetros tenga el tramo; lo importante es dejar una huella en cada uno de ellos.”`
  });
  const [editandoConfig, setEditandoConfig] = useState(false);

  // ESTADOS DE GALERÍA Y ÁLBUMES
  const [albumes, setAlbumes] = useState([]);
  const [albumSeleccionado, setAlbumSeleccionado] = useState(null);
  const [fotosAlbumActual, setFotosAlbumActual] = useState([]);
  const [fotoAmpliada, setFotoAmpliada] = useState(null);

  // FORMULARIOS ADMIN GALERIA
  const [nuevoAlbumNombre, setNuevoAlbumNombre] = useState('');
  const [portadaAlbumUrl, setPortadaAlbumUrl] = useState('');
  const [subiendoFotosMasivo, setSubiendoFotosMasivo] = useState(false);

  // EVENTOS Y CALENDARIO VISUAL
  const [eventos, setEventos] = useState([]);
  const [calendario, setCalendario] = useState([]);
  const [fechaActualCalendario, setFechaActualCalendario] = useState(new Date(2027, 0, 1));
  
  // MODALES INTERACTIVOS (CALENDARIO Y EVENTOS)
  const [diaSeleccionadoModal, setDiaSeleccionadoModal] = useState(null);
  const [modoModalCalendario, setModoModalCalendario] = useState('detalle'); 
  const [asistentesEvento, setAsistentesEvento] = useState([]);
  const [formAsistencia, setFormAsistencia] = useState({ categoria: '', modelo_auto: '' });

  // MODAL INSCRIPCIÓN EVENTOS DEL EQUIPO
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
    pais_origen: 'ARGENTINA'
  });
  const [nuevoCalendario, setNuevoCalendario] = useState({
    titulo: '',
    fecha: '',
    descripcion: ''
  });

  // SALÓN DE LA FAMA
  const [hallFama, setHallFama] = useState([]);
  const [nuevoPilotoFama, setNuevoPilotoFama] = useState({ nombre: '', categoria: '', campeonatos: '', foto: '' });
  const [editandoId, setEditandoId] = useState(null);

  // MIEMBROS REGISTRADOS
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
    if (data && data.historia_texto && data.historia_texto.length > 50) {
      setConfig(prev => ({ ...prev, ...data }));
    }
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
    } else {
      setEsAdmin(false);
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
        pais_origen: 'ARGENTINA'
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

  const handleInscribirseCalendario = async (e, calId) => {
    e.preventDefault();
    if (!usuario) {
      alert('Debes iniciar sesión para confirmar tu participación.');
      setMostrarAuthModal(true);
      return;
    }

    const { error } = await supabase.from('asistencias_calendario').insert([{
      calendario_id: calId,
      user_id: usuario.id,
      categoria: formAsistencia.categoria.toUpperCase(),
      modelo_auto: formAsistencia.modelo_auto.toUpperCase(),
      nombre_piloto: (perfil?.nombre_piloto || usuario.email.split('@')[0]).toUpperCase(),
      nacionalidad: perfil?.nacionalidad || 'ARGENTINA'
    }]);

    if (error) {
      alert('Error al registrar participación (quizás ya estás anotado): ' + error.message);
    } else {
      alert('¡Te has anotado exitosamente a la competencia!');
      setFormAsistencia({ categoria: '', modelo_auto: '' });
      setModoModalCalendario('lista');
      cargarAsistentesCalendario(calId);
    }
  };

  const handleInscribirseEventoEquipo = async (e, eventoId) => {
    e.preventDefault();
    if (!usuario) {
      alert('Debes iniciar sesión para inscribirte.');
      setMostrarAuthModal(true);
      return;
    }

    const { error } = await supabase.from('asistencias_eventos').insert([{
      evento_id: eventoId,
      user_id: usuario.id,
      categoria: formAsistenciaEvento.categoria.toUpperCase(),
      modelo_auto: formAsistenciaEvento.modelo_auto.toUpperCase(),
      nombre_piloto: (perfil?.nombre_piloto || usuario.email.split('@')[0]).toUpperCase(),
      nacionalidad: perfil?.nacionalidad || 'ARGENTINA'
    }]);

    if (error) {
      alert('Error al inscribirte (quizás ya estás anotado): ' + error.message);
    } else {
      alert('¡Inscripción realizada con éxito!');
      setFormAsistenciaEvento({ categoria: '', modelo_auto: '' });
      setModoModalEvento('lista');
      cargarAsistentesEventoEquipo(eventoId);
    }
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

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans relative overflow-x-hidden selection:bg-amber-500 selection:text-black flex flex-col justify-between uppercase">
      
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
                  {(perfil?.nombre_piloto || usuario.email.split('@')[0]).toUpperCase()}
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
              ACCEDER
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
                TEMPORADA OFICIAL 2027 • ESPÍNDOLA COMPETICIÓN {esAdmin && '• MODO ADMIN'}
              </span>

              <h1 className="font-wrc text-6xl md:text-8xl font-black tracking-tight text-white uppercase drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)]">
                PRECISIÓN, VELOCIDAD Y <span className="text-amber-400 drop-shadow-[0_0_25px_rgba(251,191,36,0.7)]">GLORIA</span>
              </h1>
            </div>
          </div>
        )}

        {/* 2. NUESTRA HISTORIA */}
        {pestanaActiva === 'historia' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div className="bg-neutral-900/60 backdrop-blur-md border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl space-y-8">
              
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h2 className="font-wrc text-3xl md:text-4xl text-amber-400 tracking-wide">HISTORIA DEL EQUIPO</h2>
                {esAdmin && !editandoConfig && (
                  <button
                    onClick={() => setEditandoConfig(true)}
                    className="bg-amber-500 hover:bg-amber-400 text-black font-wrc text-xs px-5 py-2.5 rounded-xl transition shadow cursor-pointer font-black"
                  >
                    ✏️ EDITAR HISTORIA
                  </button>
                )}
              </div>

              {!editandoConfig ? (
                <div className="text-neutral-200 text-sm md:text-base leading-relaxed font-wrc whitespace-pre-line space-y-6">
                  {config.historia_texto}
                </div>
              ) : (
                <form onSubmit={handleGuardarConfig} className="space-y-4">
                  <p className="text-xs text-amber-400 font-wrc">MODIFICA EL TEXTO COMPLETO DE LA HISTORIA A TU GUSTO:</p>
                  <textarea
                    rows={22}
                    value={config.historia_texto}
                    onChange={(e) => setConfig({ ...config, historia_texto: e.target.value.toUpperCase() })}
                    className="w-full bg-neutral-950 border border-amber-500/50 rounded-2xl p-5 text-sm text-white focus:border-amber-500 outline-none font-wrc uppercase leading-relaxed"
                  />
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditandoConfig(false)}
                      className="bg-neutral-800 text-neutral-300 font-wrc text-xs px-6 py-3 rounded-xl cursor-pointer"
                    >
                      CANCELAR
                    </button>
                    <button
                      type="submit"
                      className="bg-amber-500 hover:bg-amber-400 text-black font-wrc text-xs font-black px-6 py-3 rounded-xl transition shadow cursor-pointer"
                    >
                      💾 GUARDAR CAMBIOS
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>
        )}

        {/* 3. CALENDARIO VISUAL 2027+ */}
        {pestanaActiva === 'calendario' && (
          <div className="space-y-8 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="font-wrc text-4xl text-amber-400 tracking-wide">CALENDARIO DE CARRERAS</h2>
                <p className="text-neutral-300 text-sm font-wrc">NAVEGA POR LOS MESES DEL 2027 EN ADELANTE, CONFIRMA TU PARTICIPACIÓN Y VE LOS INSCRIPTOS.</p>
              </div>

              <div className="flex items-center gap-3 bg-neutral-900/80 border border-amber-500/40 px-4 py-2 rounded-2xl shadow-xl">
                <button
                  onClick={() => cambiarMes(-1)}
                  className="text-amber-400 hover:text-white font-wrc text-sm px-3 py-1 bg-neutral-950 rounded-xl border border-neutral-800 transition cursor-pointer"
                >
                  ◀ MES ANTERIOR
                </button>
                <span className="font-wrc text-lg text-white tracking-wider px-2 min-w-[140px] text-center">
                  {nombresMeses[fechaActualCalendario.getMonth()]} {fechaActualCalendario.getFullYear()}
                </span>
                <button
                  onClick={() => cambiarMes(1)}
                  className="text-amber-400 hover:text-white font-wrc text-sm px-3 py-1 bg-neutral-950 rounded-xl border border-neutral-800 transition cursor-pointer"
                >
                  MES SIGUIENTE ▶
                </button>
              </div>
            </div>

            <div className="bg-neutral-900/60 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl space-y-4">
              <div className="grid grid-cols-7 gap-2 text-center font-wrc text-amber-400 text-xs md:text-sm border-b border-white/10 pb-3">
                <span>LUN</span><span>MAR</span><span>MIÉ</span><span>JUE</span><span>VIE</span><span>SÁB</span><span>DOM</span>
              </div>

              <div className="grid grid-cols-7 gap-2 md:gap-3">
                {obtenerDiasDelMes().map((item, idx) => {
                  if (!item) {
                    return <div key={`empty-${idx}`} className="h-20 md:h-28 rounded-2xl bg-black/20 border border-transparent"></div>;
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
                      className={`h-20 md:h-28 rounded-2xl p-2.5 flex flex-col justify-between transition border relative overflow-hidden ${
                        tieneCarrera 
                          ? 'bg-amber-500/15 border-amber-500/60 shadow-[0_0_15px_rgba(251,191,36,0.3)] cursor-pointer hover:bg-amber-500/25' 
                          : 'bg-neutral-950/40 border-white/5 hover:border-white/20'
                      }`}
                    >
                      <span className={`font-wrc text-sm md:text-base ${tieneCarrera ? 'text-amber-400 font-black' : 'text-neutral-400'}`}>
                        {item.dia}
                      </span>

                      {tieneCarrera && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-[10px] md:text-xs font-wrc text-amber-300 uppercase bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30 truncate">
                            <span>🏁</span>
                            <span className="truncate">{item.eventos[0].titulo}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {esAdmin && (
              <div className="bg-neutral-900/70 backdrop-blur-md border border-amber-500/50 rounded-2xl p-6 shadow-2xl space-y-4">
                <h3 className="font-wrc text-xl text-amber-400">➕ AGREGAR FECHA DE CARRERA AL CALENDARIO</h3>
                <form onSubmit={handleCrearCalendario} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-xs text-neutral-300 uppercase mb-1 font-bold">TÍTULO DE LA CARRERA</label>
                    <input
                      type="text"
                      value={nuevoCalendario.titulo}
                      onChange={(e) => setNuevoCalendario({ ...nuevoCalendario, titulo: e.target.value.toUpperCase() })}
                      placeholder="EJ: GRAN PREMIO MISIONES 2027"
                      required
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-500 outline-none uppercase font-wrc"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-300 uppercase mb-1 font-bold">FECHA</label>
                    <input
                      type="date"
                      value={nuevoCalendario.fecha}
                      onChange={(e) => setNuevoCalendario({ ...nuevoCalendario, fecha: e.target.value })}
                      required
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-500 outline-none font-wrc"
                    />
                  </div>
                  <div>
                    <button
                      type="submit"
                      className="w-full bg-amber-500 hover:bg-amber-400 text-black font-wrc text-sm uppercase py-2.5 rounded-xl transition shadow-lg cursor-pointer font-black"
                    >
                      GUARDAR FECHA
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-3 pt-4">
              <h3 className="font-wrc text-xl text-white tracking-wide">LISTADO DE FECHAS REGISTRADAS</h3>
              {calendario.length === 0 ? (
                <p className="text-neutral-400 text-sm font-wrc">NO HAY FECHAS CARGADAS EN EL CALENDARIO TODAVÍA.</p>
              ) : (
                calendario.map((cal) => (
                  <div key={cal.id} className="bg-neutral-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex justify-between items-center shadow-lg">
                    <div>
                      <span className="text-amber-400 font-wrc text-xs tracking-widest uppercase">{cal.fecha}</span>
                      <h4 className="font-wrc text-xl text-white mt-0.5">{cal.titulo}</h4>
                    </div>
                    {esAdmin && (
                      <button
                        onClick={() => handleEliminarCalendario(cal.id)}
                        className="bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-1.5 rounded-xl text-xs border border-red-500/30 cursor-pointer font-wrc"
                      >
                        🗑️ ELIMINAR
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

          </div>
        )}

        {/* 4. GALERÍA */}
        {pestanaActiva === 'galeria' && (
          <div className="space-y-8 max-w-6xl mx-auto">
            {!albumSeleccionado ? (
              <div className="space-y-8">
                <div>
                  <h2 className="font-wrc text-4xl text-amber-400 tracking-wide">ÁLBUMES DE EVENTOS</h2>
                  <p className="text-neutral-300 text-sm font-wrc">SELECCIONA UNA CARPETA PARA VER LAS FOTOGRAFÍAS OFICIALES DE CADA COMPETENCIA.</p>
                </div>

                {esAdmin && (
                  <div className="bg-neutral-900/60 backdrop-blur-md border border-amber-500/50 rounded-2xl p-6 shadow-2xl space-y-4">
                    <h3 className="font-wrc text-xl text-amber-400">📁 CREAR NUEVA CARPETA DE EVENTO</h3>
                    <form onSubmit={handleCrearAlbum} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div>
                        <label className="block text-xs text-neutral-300 uppercase mb-1 font-bold">NOMBRE DEL ÁLBUM / EVENTO</label>
                        <input
                          type="text"
                          value={nuevoAlbumNombre}
                          onChange={(e) => setNuevoAlbumNombre(e.target.value.toUpperCase())}
                          placeholder="EJ: RALLY DE CÓRDOBA 2027"
                          className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-500 outline-none uppercase font-wrc"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-300 uppercase mb-1 font-bold">FOTO DE PORTADA</label>
                        <SubirImagen currentUrl={portadaAlbumUrl} onUpload={(url) => setPortadaAlbumUrl(url)} />
                      </div>
                      <div>
                        <button
                          type="submit"
                          className="w-full bg-amber-500 hover:bg-amber-400 text-black font-wrc font-black text-sm uppercase px-6 py-2.5 rounded-xl transition shadow-lg cursor-pointer"
                        >
                          CREAR ÁLBUM
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
                            className="text-red-400 hover:text-red-300 text-xs px-3 py-1 bg-red-500/10 rounded-lg border border-red-500/30 cursor-pointer font-wrc"
                          >
                            ELIMINAR
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
                      ← VOLVER A ÁLBUMES
                    </button>
                    <h2 className="font-wrc text-4xl text-white">{albumSeleccionado.nombre}</h2>
                  </div>

                  {esAdmin && (
                    <div className="flex items-center gap-3">
                      <label className={`bg-amber-500 hover:bg-amber-400 text-black font-wrc text-sm px-5 py-2.5 rounded-xl transition shadow-lg cursor-pointer ${subiendoFotosMasivo ? 'opacity-50 pointer-events-none' : ''}`}>
                        {subiendoFotosMasivo ? 'SUBIENDO FOTOS...' : '📷 SUBIR FOTOS AL ÁLBUM'}
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
              <h2 className="font-wrc text-4xl text-amber-400 tracking-wide">LIVE TIMING OFICIAL</h2>
              <p className="text-neutral-300 text-sm font-wrc">SIGUE EN TIEMPO REAL LAS CLASIFICACIONES Y TIEMPOS DE NUESTRAS COMPETENCIAS.</p>
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

        {/* 6. EVENTOS (INSCRIPCIÓN Y LISTA) */}
        {pestanaActiva === 'eventos' && (
          <div className="space-y-8 max-w-5xl mx-auto">
            <div>
              <h2 className="font-wrc text-4xl text-amber-400 tracking-wide">INSCRIPCIONES Y CAMPEONATOS</h2>
              <p className="text-neutral-300 text-sm font-wrc">FECHAS ACTIVAS PARA ANOTARTE A COMPETIR.</p>
            </div>

            {esAdmin && (
              <div className="bg-neutral-900/60 backdrop-blur-md border border-amber-500/50 rounded-2xl p-6 shadow-2xl space-y-4">
                <h3 className="font-wrc text-xl text-amber-400">➕ CREAR NUEVO EVENTO / INSCRIPCIÓN</h3>
                <form onSubmit={handleCrearEvento} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-neutral-300 uppercase mb-1 font-bold">TÍTULO DEL EVENTO</label>
                    <input
                      type="text"
                      value={nuevoEvento.titulo}
                      onChange={(e) => setNuevoEvento({ ...nuevoEvento, titulo: e.target.value.toUpperCase() })}
                      placeholder="EJ: FECHA 1 - RALLY MIT CUP"
                      required
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2 text-sm text-white focus:border-amber-500 outline-none uppercase font-wrc"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-300 uppercase mb-1 font-bold">FECHA</label>
                    <input
                      type="date"
                      value={nuevoEvento.fecha}
                      onChange={(e) => setNuevoEvento({ ...nuevoEvento, fecha: e.target.value })}
                      required
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2 text-sm text-white focus:border-amber-500 outline-none font-wrc"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-300 uppercase mb-1 font-bold">HORARIO</label>
                    <input
                      type="text"
                      value={nuevoEvento.horario}
                      onChange={(e) => setNuevoEvento({ ...nuevoEvento, horario: e.target.value.toUpperCase() })}
                      placeholder="EJ: 21:00 HS (ARG)"
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2 text-sm text-white focus:border-amber-500 outline-none font-wrc"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-300 uppercase mb-1 font-bold">CATEGORÍAS</label>
                    <input
                      type="text"
                      value={nuevoEvento.categorias}
                      onChange={(e) => setNuevoEvento({ ...nuevoEvento, categorias: e.target.value.toUpperCase() })}
                      placeholder="EJ: RALLY2 / RALLY4"
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2 text-sm text-white focus:border-amber-500 outline-none font-wrc"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-300 uppercase mb-1 font-bold">MODELOS DE AUTOS</label>
                    <input
                      type="text"
                      value={nuevoEvento.modelos_autos}
                      onChange={(e) => setNuevoEvento({ ...nuevoEvento, modelos_autos: e.target.value.toUpperCase() })}
                      placeholder="EJ: SKODA FABIA / PEUGEOT 208"
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2 text-sm text-white focus:border-amber-500 outline-none font-wrc"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full bg-amber-500 hover:bg-amber-400 text-black font-wrc text-sm uppercase py-2.5 rounded-xl transition shadow-lg cursor-pointer font-black"
                    >
                      PUBLICAR EVENTO
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-4">
              {eventos.map((ev) => (
                <div key={ev.id} className="bg-neutral-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-1">
                    <span className="text-amber-400 font-wrc text-xs tracking-widest uppercase">{ev.fecha} • {ev.horario || 'POR CONFIRMAR'}</span>
                    <h3 className="font-wrc text-2xl text-white">{ev.titulo}</h3>
                    <p className="text-neutral-300 text-xs font-wrc uppercase">CATEGORÍAS: {ev.categorias || 'GENERAL'} | AUTOS: {ev.modelos_autos || 'LIBRE'}</p>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <button
                      onClick={() => {
                        setEventoModalActivo(ev);
                        setModoModalEvento('formulario');
                        cargarAsistentesEventoEquipo(ev.id);
                      }}
                      className="bg-amber-500 hover:bg-amber-400 text-black font-wrc text-xs px-6 py-2.5 rounded-xl transition shadow tracking-wider cursor-pointer font-black uppercase"
                    >
                      INSCRIBIRSE
                    </button>

                    <button
                      onClick={() => {
                        setEventoModalActivo(ev);
                        setModoModalEvento('lista');
                        cargarAsistentesEventoEquipo(ev.id);
                      }}
                      className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-wrc text-xs px-5 py-2.5 rounded-xl transition cursor-pointer uppercase"
                    >
                      VER INSCRIPTOS
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

        {/* 7. SALÓN DE LA FAMA */}
        {pestanaActiva === 'fama' && (
          <div className="space-y-12 max-w-6xl mx-auto">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h2 className="font-wrc text-4xl md:text-5xl text-amber-400 tracking-wide drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                  SALÓN DE LA FAMA - PODIO DE CAMPEONES
                </h2>
                <p className="text-neutral-200 text-sm md:text-base font-wrc mt-1 drop-shadow uppercase">
                  LOS PILOTOS CON MÁS TÍTULOS OFICIALES EN LA HISTORIA DE ESPÍNDOLA COMPETICIÓN.
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

            {esAdmin && (
              <div className="bg-neutral-900/75 backdrop-blur-md border border-amber-500/50 rounded-2xl p-6 shadow-2xl space-y-4">
                <h3 className="font-wrc text-xl text-amber-400">
                  {editandoId !== null ? '✏️ EDITAR PILOTO DEL PODIO' : '🏆 AGREGAR PILOTO AL SALÓN DE LA FAMA'}
                </h3>
                <form onSubmit={handleGuardarPilotoFama} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-xs text-neutral-300 uppercase mb-1 font-bold">NOMBRE PILOTO</label>
                    <input
                      type="text"
                      value={nuevoPilotoFama.nombre}
                      onChange={(e) => setNuevoPilotoFama({ ...nuevoPilotoFama, nombre: e.target.value.toUpperCase() })}
                      placeholder="EJ: JOACO CASTAÑO"
                      required
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2 text-sm text-white focus:border-amber-500 outline-none uppercase font-wrc"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-300 uppercase mb-1 font-bold">CIUDAD / CATEGORÍA</label>
                    <input
                      type="text"
                      value={nuevoPilotoFama.categoria}
                      onChange={(e) => setNuevoPilotoFama({ ...nuevoPilotoFama, categoria: e.target.value.toUpperCase() })}
                      placeholder="EJ: POSADAS - MISIONES"
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2 text-sm text-white focus:border-amber-500 outline-none uppercase font-wrc"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-300 uppercase mb-1 font-bold">CAMPEONATOS</label>
                    <input
                      type="number"
                      value={nuevoPilotoFama.campeonatos}
                      onChange={(e) => setNuevoPilotoFama({ ...nuevoPilotoFama, campeonatos: e.target.value })}
                      placeholder="EJ: 17"
                      required
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2 text-sm text-white focus:border-amber-500 outline-none font-wrc"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-300 uppercase mb-1 font-bold">FOTO PILOTO</label>
                    <SubirImagen currentUrl={nuevoPilotoFama.foto} onUpload={(url) => setNuevoPilotoFama({ ...nuevoPilotoFama, foto: url })} />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-3 pt-2">
                    {editandoId !== null && (
                      <button
                        type="button"
                        onClick={() => { setEditandoId(null); setNuevoPilotoFama({ nombre: '', categoria: '', campeonatos: '', foto: '' }); }}
                        className="bg-neutral-800 text-neutral-300 font-wrc text-xs px-5 py-2.5 rounded-xl cursor-pointer"
                      >
                        CANCELAR
                      </button>
                    )}
                    <button
                      type="submit"
                      className="bg-amber-500 hover:bg-amber-400 text-black font-wrc text-sm font-black uppercase px-6 py-2.5 rounded-xl transition shadow-lg cursor-pointer"
                    >
                      {editandoId !== null ? 'ACTUALIZAR PILOTO' : 'GUARDAR EN EL SALÓN'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {hallFama.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center pt-8 pb-4">
                
                {hallFama[1] && (
                  <div className="order-2 md:order-1 relative bg-black/70 backdrop-blur-md border border-neutral-400/50 rounded-3xl p-7 text-center shadow-2xl flex flex-col items-center justify-between">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-neutral-200 text-black font-wrc text-xs px-4 py-1 rounded-full shadow-lg tracking-wider flex items-center gap-1.5 whitespace-nowrap">
                      <span>🥈</span> 2º PUESTO
                    </div>

                    {esAdmin && (
                      <div className="absolute top-3 right-4 flex gap-2">
                        <button onClick={() => handleEditarPilotoFama(hallFama[1])} className="text-xs text-amber-400 hover:scale-110 transition cursor-pointer">✏️</button>
                        <button onClick={() => handleEliminarPilotoFama(hallFama[1].id)} className="text-xs text-red-400 hover:scale-110 transition cursor-pointer">🗑️</button>
                      </div>
                    )}

                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-neutral-300 mt-4 mb-3 shadow-lg bg-neutral-900">
                      <img src={hallFama[1].foto} alt={hallFama[1].nombre} className="w-full h-full object-cover" />
                    </div>

                    <div className="space-y-1 my-2">
                      <h3 className="font-wrc text-2xl md:text-3xl text-white tracking-wide">{hallFama[1].nombre}</h3>
                      <p className="text-neutral-300 text-xs font-wrc uppercase">{hallFama[1].categoria}</p>
                    </div>

                    <div className="mt-4 bg-white/5 border border-white/15 rounded-xl px-5 py-2 font-wrc text-sm tracking-wider text-neutral-200">
                      TÍTULOS: <span className="text-white text-base ml-1">{hallFama[1].campeonatos}</span> 🏆
                    </div>
                  </div>
                )}

                {hallFama[0] && (
                  <div className="order-1 md:order-2 relative bg-gradient-to-b from-amber-500/20 via-black/80 to-black/85 backdrop-blur-md border-2 border-amber-400 rounded-3xl p-8 text-center shadow-[0_0_40px_rgba(251,191,36,0.25)] flex flex-col items-center justify-between md:-translate-y-4">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-black font-wrc text-sm px-5 py-1 rounded-full shadow-lg tracking-wider flex items-center gap-1.5 whitespace-nowrap">
                      <span>🥇</span> 1º PUESTO
                    </div>

                    {esAdmin && (
                      <div className="absolute top-3 right-4 flex gap-2">
                        <button onClick={() => handleEditarPilotoFama(hallFama[0])} className="text-xs text-amber-400 hover:scale-110 transition cursor-pointer">✏️</button>
                        <button onClick={() => handleEliminarPilotoFama(hallFama[0].id)} className="text-xs text-red-400 hover:scale-110 transition cursor-pointer">🗑️</button>
                      </div>
                    )}

                    <div className="w-28 h-28 rounded-full overflow-hidden border-[3px] border-amber-400 mt-4 mb-3 shadow-[0_0_20px_rgba(251,191,36,0.4)] bg-neutral-900">
                      <img src={hallFama[0].foto} alt={hallFama[0].nombre} className="w-full h-full object-cover" />
                    </div>

                    <div className="space-y-1 my-2">
                      <h3 className="font-wrc text-3xl md:text-4xl text-amber-400 tracking-wide drop-shadow">{hallFama[0].nombre}</h3>
                      <p className="text-neutral-200 text-xs md:text-sm font-wrc uppercase">{hallFama[0].categoria}</p>
                    </div>

                    <div className="mt-4 bg-amber-500/15 border border-amber-400/50 rounded-xl px-6 py-2.5 font-wrc text-base tracking-wider text-amber-300">
                      TÍTULOS ABSOLUTOS: <span className="text-amber-400 text-xl ml-1">{hallFama[0].campeonatos}</span> 🏆
                    </div>
                  </div>
                )}

                {hallFama[2] && (
                  <div className="order-3 relative bg-black/70 backdrop-blur-md border border-amber-700/60 rounded-3xl p-7 text-center shadow-2xl flex flex-col items-center justify-between">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-700 text-white font-wrc text-xs px-4 py-1 rounded-full shadow-lg tracking-wider flex items-center gap-1.5 whitespace-nowrap">
                      <span>🥉</span> 3º PUESTO
                    </div>

                    {esAdmin && (
                      <div className="absolute top-3 right-4 flex gap-2">
                        <button onClick={() => handleEditarPilotoFama(hallFama[2])} className="text-xs text-amber-400 hover:scale-110 transition cursor-pointer">✏️</button>
                        <button onClick={() => handleEliminarPilotoFama(hallFama[2].id)} className="text-xs text-red-400 hover:scale-110 transition cursor-pointer">🗑️</button>
                      </div>
                    )}

                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-amber-600 mt-4 mb-3 shadow-lg bg-neutral-900">
                      <img src={hallFama[2].foto} alt={hallFama[2].nombre} className="w-full h-full object-cover" />
                    </div>

                    <div className="space-y-1 my-2">
                      <h3 className="font-wrc text-2xl md:text-3xl text-white tracking-wide">{hallFama[2].nombre}</h3>
                      <p className="text-neutral-300 text-xs font-wrc uppercase">{hallFama[2].categoria}</p>
                    </div>

                    <div className="mt-4 bg-white/5 border border-amber-700/40 rounded-xl px-5 py-2 font-wrc text-sm tracking-wider text-neutral-200">
                      TÍTULOS: <span className="text-amber-500 text-base ml-1">{hallFama[2].campeonatos}</span> 🏆
                    </div>
                  </div>
                )}

              </div>
            )}

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
                        <p className="text-xs text-neutral-400 font-wrc uppercase">{piloto.categoria}</p>
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
              <h2 className="font-wrc text-4xl text-amber-400 tracking-wide">PILOTOS REGISTRADOS</h2>
              <p className="text-neutral-300 text-sm font-wrc">COMUNIDAD DE PILOTOS Y MIEMBROS DE ESPÍNDOLA COMPETICIÓN.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {miembros.length === 0 ? (
                <p className="text-neutral-400 col-span-full text-center py-8 font-wrc">NO HAY MIEMBROS REGISTRADOS TODAVÍA.</p>
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
                      <h3 className="font-wrc text-xl text-white truncate">{(m.nombre_piloto || 'PILOTO SIN NOMBRE').toUpperCase()}</h3>
                      <p className="text-xs font-wrc uppercase">
                        <span className="text-amber-400">PAÍS:</span> <span className="text-white">{obtenerBanderaPais(m.nacionalidad)}</span>
                      </p>
                      {m.provincia && (
                        <p className="text-xs font-wrc uppercase">
                          <span className="text-amber-400">PROVINCIA:</span> <span className="text-white">{m.provincia.toUpperCase()}</span>
                        </p>
                      )}
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
            <h2 className="font-wrc text-3xl text-amber-400">MI PERFIL DE PILOTO</h2>
            
            <div className="flex items-center gap-4 border-b border-white/10 pb-6">
              <div className="w-20 h-20 rounded-full bg-neutral-800 border-2 border-amber-500 overflow-hidden flex items-center justify-center font-wrc text-amber-400 text-2xl flex-shrink-0">
                {perfil?.avatar_url ? (
                  <img src={perfil.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  perfil?.nombre_piloto ? perfil.nombre_piloto.charAt(0).toUpperCase() : 'E'
                )}
              </div>
              <div className="overflow-hidden">
                <h3 className="font-wrc text-2xl text-white truncate">{(perfil?.nombre_piloto || usuario.email.split('@')[0]).toUpperCase()}</h3>
                <p className="text-neutral-400 text-xs font-wrc uppercase truncate">{usuario.email}</p>
              </div>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-3 font-wrc text-sm">
              <div className="flex justify-between border-b border-white/10 pb-2.5">
                <span className="text-amber-400">NOMBRE DE PILOTO:</span>
                <span className="text-white">{(perfil?.nombre_piloto || 'NO CONFIGURADO').toUpperCase()}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2.5">
                <span className="text-amber-400">PAÍS:</span>
                <span className="text-white">{obtenerBanderaPais(perfil?.nacionalidad)}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2.5">
                <span className="text-amber-400">PROVINCIA:</span>
                <span className="text-white">{(perfil?.provincia || 'NO CONFIGURADA').toUpperCase()}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2.5">
                <span className="text-amber-400">STEAM ID:</span>
                <span className="text-white">{(perfil?.steam_id || 'NO CONFIGURADO').toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-400">TELÉFONO:</span>
                <span className="text-white">{(perfil?.telefono || 'NO CONFIGURADO').toUpperCase()}</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => setMostrarPerfilModal(true)}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-wrc text-sm font-black uppercase py-3 rounded-xl transition shadow-lg cursor-pointer"
              >
                EDITAR DATOS PERSONALES
              </button>

              <button
                onClick={() => setMostrarCambiarPasswordModal(true)}
                className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-wrc text-sm uppercase py-3 rounded-xl transition cursor-pointer"
              >
                CAMBIAR CONTRASEÑA
              </button>
            </div>
          </div>
        )}

      </main>

      {/* MODAL INTERACTIVO DE CALENDARIO */}
      {diaSeleccionadoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDiaSeleccionadoModal(null)}>
          <div className="bg-neutral-900 border border-amber-500/50 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-6 uppercase" onClick={(e) => e.stopPropagation()}>
            
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div>
                <span className="text-amber-400 font-wrc text-xs tracking-widest uppercase">{diaSeleccionadoModal.fecha}</span>
                <h3 className="font-wrc text-3xl text-white">{diaSeleccionadoModal.titulo}</h3>
              </div>
              <button onClick={() => setDiaSeleccionadoModal(null)} className="text-neutral-400 hover:text-white text-xl">✕</button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setModoModalCalendario('detalle')}
                className={`flex-1 font-wrc text-xs py-2 rounded-xl transition cursor-pointer uppercase ${modoModalCalendario === 'detalle' ? 'bg-amber-500 text-black font-black' : 'bg-neutral-800 text-neutral-300'}`}
              >
                INFORMACIÓN
              </button>
              <button
                onClick={() => setModoModalCalendario('formulario')}
                className={`flex-1 font-wrc text-xs py-2 rounded-xl transition cursor-pointer uppercase ${modoModalCalendario === 'formulario' ? 'bg-amber-500 text-black font-black' : 'bg-neutral-800 text-neutral-300'}`}
              >
                PARTICIPAR 🏁
              </button>
              <button
                onClick={() => setModoModalCalendario('lista')}
                className={`flex-1 font-wrc text-xs py-2 rounded-xl transition cursor-pointer uppercase ${modoModalCalendario === 'lista' ? 'bg-amber-500 text-black font-black' : 'bg-neutral-800 text-neutral-300'}`}
              >
                INSCRIPTOS ({asistentesEvento.length})
              </button>
            </div>

            {modoModalCalendario === 'detalle' && (
              <div className="space-y-4 py-2">
                <p className="text-neutral-300 text-sm font-wrc uppercase">{diaSeleccionadoModal.descripcion || 'COMPETENCIA OFICIAL PROGRAMADA EN EL CALENDARIO.'}</p>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setModoModalCalendario('formulario')}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-wrc text-sm font-black uppercase py-3 rounded-xl transition shadow cursor-pointer"
                  >
                    QUIERO PARTICIPAR
                  </button>
                </div>
              </div>
            )}

            {modoModalCalendario === 'formulario' && (
              <form onSubmit={(e) => handleInscribirseCalendario(e, diaSeleccionadoModal.id)} className="space-y-4">
                <div>
                  <label className="block text-xs text-neutral-300 uppercase mb-1 font-bold">CATEGORÍA A CORRER</label>
                  <input
                    type="text"
                    value={formAsistencia.categoria}
                    onChange={(e) => setFormAsistencia({ ...formAsistencia, categoria: e.target.value.toUpperCase() })}
                    placeholder="EJ: RALLY2 / WRC / TC"
                    required
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-500 outline-none uppercase font-wrc"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-300 uppercase mb-1 font-bold">MODELO DE AUTO</label>
                  <input
                    type="text"
                    value={formAsistencia.modelo_auto}
                    onChange={(e) => setFormAsistencia({ ...formAsistencia, modelo_auto: e.target.value.toUpperCase() })}
                    placeholder="EJ: SKODA FABIA RS"
                    required
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-500 outline-none uppercase font-wrc"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black font-wrc text-sm font-black uppercase py-3 rounded-xl transition shadow cursor-pointer"
                >
                  CONFIRMAR ASISTENCIA
                </button>
              </form>
            )}

            {modoModalCalendario === 'lista' && (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {asistentesEvento.length === 0 ? (
                  <p className="text-neutral-400 text-center py-6 text-sm font-wrc">TODAVÍA NO HAY PILOTOS CONFIRMADOS PARA ESTA FECHA.</p>
                ) : (
                  asistentesEvento.map((asistente) => (
                    <div key={asistente.id} className="bg-neutral-950 border border-white/10 rounded-2xl p-3 flex justify-between items-center">
                      <div>
                        <h4 className="font-wrc text-white text-base">{asistente.nombre_piloto || 'PILOTO ESPÍNDOLA'}</h4>
                        <p className="text-xs text-neutral-400 font-wrc">CAT: {asistente.categoria} | AUTO: {asistente.modelo_auto}</p>
                        <p className="text-xs text-amber-400 font-wrc mt-0.5 flex items-center gap-1.5">
                          <span>PAÍS:</span> {obtenerBanderaPais(asistente.nacionalidad)}
                        </p>
                      </div>
                      <span className="text-amber-400 text-xs font-wrc bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
                        CONFIRMADO ✅
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* MODAL INTERACTIVO DE EVENTOS DEL EQUIPO */}
      {eventoModalActivo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEventoModalActivo(null)}>
          <div className="bg-neutral-900 border border-amber-500/50 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-6 uppercase" onClick={(e) => e.stopPropagation()}>
            
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div>
                <span className="text-amber-400 font-wrc text-xs tracking-widest uppercase">{eventoModalActivo.fecha} • {eventoModalActivo.horario || 'POR CONFIRMAR'}</span>
                <h3 className="font-wrc text-3xl text-white">{eventoModalActivo.titulo}</h3>
              </div>
              <button onClick={() => setEventoModalActivo(null)} className="text-neutral-400 hover:text-white text-xl">✕</button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setModoModalEvento('formulario')}
                className={`flex-1 font-wrc text-xs py-2 rounded-xl transition cursor-pointer uppercase ${modoModalEvento === 'formulario' ? 'bg-amber-500 text-black font-black' : 'bg-neutral-800 text-neutral-300'}`}
              >
                INSCRIBIRME 🏁
              </button>
              <button
                onClick={() => setModoModalEvento('lista')}
                className={`flex-1 font-wrc text-xs py-2 rounded-xl transition cursor-pointer uppercase ${modoModalEvento === 'lista' ? 'bg-amber-500 text-black font-black' : 'bg-neutral-800 text-neutral-300'}`}
              >
                INSCRIPTOS ({asistentesEventoEquipo.length})
              </button>
            </div>

            {modoModalEvento === 'formulario' && (
              <form onSubmit={(e) => handleInscribirseEventoEquipo(e, eventoModalActivo.id)} className="space-y-4">
                <div>
                  <label className="block text-xs text-neutral-300 uppercase mb-1 font-bold">CATEGORÍA</label>
                  <input
                    type="text"
                    value={formAsistenciaEvento.categoria}
                    onChange={(e) => setFormAsistenciaEvento({ ...formAsistenciaEvento, categoria: e.target.value.toUpperCase() })}
                    placeholder="EJ: RALLY2 / RALLY4"
                    required
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-500 outline-none uppercase font-wrc"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-300 uppercase mb-1 font-bold">MODELO DE AUTO</label>
                  <input
                    type="text"
                    value={formAsistenciaEvento.modelo_auto}
                    onChange={(e) => setFormAsistenciaEvento({ ...formAsistenciaEvento, modelo_auto: e.target.value.toUpperCase() })}
                    placeholder="EJ: PEUGEOT 208 RALLY4"
                    required
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-500 outline-none uppercase font-wrc"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black font-wrc text-sm font-black uppercase py-3 rounded-xl transition shadow cursor-pointer"
                >
                  CONFIRMAR INSCRIPCIÓN
                </button>
              </form>
            )}

            {modoModalEvento === 'lista' && (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {asistentesEventoEquipo.length === 0 ? (
                  <p className="text-neutral-400 text-center py-6 text-sm font-wrc">TODAVÍA NO HAY PILOTOS INSCRIPTOS EN ESTE EVENTO.</p>
                ) : (
                  asistentesEventoEquipo.map((asistente) => (
                    <div key={asistente.id} className="bg-neutral-950 border border-white/10 rounded-2xl p-3 flex justify-between items-center">
                      <div>
                        <h4 className="font-wrc text-white text-base">{asistente.nombre_piloto || 'PILOTO ESPÍNDOLA'}</h4>
                        <p className="text-xs text-neutral-400 font-wrc">CAT: {asistente.categoria} | AUTO: {asistente.modelo_auto}</p>
                        <p className="text-xs text-amber-400 font-wrc mt-0.5 flex items-center gap-1.5">
                          <span>PAÍS:</span> {obtenerBanderaPais(asistente.nacionalidad)}
                        </p>
                      </div>
                      <span className="text-amber-400 text-xs font-wrc bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
                        INSCRIPTO ✅
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

          </div>
        </div>
      )}

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