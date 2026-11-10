import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient'; // O tu archivo de cliente de Supabase
import Navbar from './Navbar';
import PerfilModal from './PerfilModal';

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [mostrarPerfilModal, setMostrarPerfilModal] = useState(false);

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

    // Escuchar cambios de autenticación (login/logout)
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
      .select('nombre_piloto, steam_id, nacionalidad')
      .eq('id', userId)
      .single();

    if (data) {
      setPerfil(data);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans relative overflow-x-hidden">
      {/* Barra de navegación superior con el perfil integrado */}
      <Navbar 
        usuario={usuario} 
        perfil={perfil} 
        onOpenPerfil={() => setMostrarPerfilModal(true)} 
        onLogout={handleLogout}
      />

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
