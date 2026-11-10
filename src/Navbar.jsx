export default function Navbar({ usuario, perfil, onOpenPerfil, onLogout }) {
  return (
    <header className="relative z-10 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-md px-6 py-4 flex flex-wrap justify-between items-center gap-4">
      {/* Logo / Título del equipo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center text-black font-black text-xl">
          E
        </div>
        <h1 className="text-xl font-black tracking-wider uppercase text-amber-500">
          Espíndola Competición
        </h1>
      </div>

      {/* Acciones de Usuario / Perfil */}
      <div className="flex items-center gap-3">
        {usuario ? (
          <div className="flex items-center gap-2">
            {/* Botón que abre el modal con el nombre del piloto o fallback al email */}
            <button
              onClick={onOpenPerfil}
              className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition border border-neutral-700 flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {perfil?.nombre_piloto || usuario.email}
            </button>
            
            <button
              onClick={onLogout}
              className="text-neutral-400 hover:text-red-400 text-sm px-3 py-2 transition"
              title="Cerrar sesión"
            >
              Salir
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenPerfil} // O tu función para abrir el modal de Auth
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2 rounded-lg text-sm transition"
          >
            Iniciar Sesión
          </button>
        )}
      </div>
    </header>
  );
}
