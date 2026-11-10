import React from 'react';

export default function Navbar({ 
  usuario, 
  perfil, 
  tab, 
  setTab, 
  onOpenAuth, 
  onOpenPerfil, 
  onLogout 
}) {
  return (
    <header className="relative z-10 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-md px-6 py-4 flex flex-wrap justify-between items-center gap-4">
      {/* SECCIÓN LOGO */}
      <div className="flex items-center gap-3">
        {/* Si tenés una imagen de logo en public/logo.png la podés usar acá */}
        <img 
          src="/logo.png" 
          alt="Espíndola Competición" 
          className="h-9 w-auto object-contain hidden"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center text-black font-black text-xl">
          E
        </div>
        <h1 className="text-xl font-black tracking-wider uppercase text-amber-500">
          Espíndola Competición
        </h1>
      </div>

      {/* MENÚ DE NAVEGACIÓN */}
      <nav className="flex gap-2">
        <button 
          onClick={() => setTab('tiempos')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            tab === 'tiempos' ? 'bg-amber-500 text-black' : 'hover:bg-neutral-800 text-white'
          }`}
        >
          Tiempos en Vivo
        </button>
        <button 
          onClick={() => setTab('campeonatos')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            tab === 'campeonatos' ? 'bg-amber-500 text-black' : 'hover:bg-neutral-800 text-white'
          }`}
        >
          Campeonatos
        </button>
      </nav>

      {/* ZONA DE USUARIO / PERFIL */}
      <div>
        {usuario ? (
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenPerfil}
              className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-amber-500 px-3 py-1.5 rounded-lg transition text-sm cursor-pointer"
              title="Hacé clic para editar tu perfil"
            >
              <span className="text-amber-500">🏎️</span>
              <span className="font-semibold text-white">
                {perfil?.nombre_piloto || usuario.email}
              </span>
              <span className="text-[10px] text-amber-500 uppercase bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold ml-1">
                Editar
              </span>
            </button>

            <button 
              onClick={onLogout}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs text-red-400 rounded-md border border-neutral-700 transition"
            >
              Cerrar Sesión
            </button>
          </div>
        ) : (
          <button 
            onClick={onOpenAuth}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-lg transition"
          >
            Iniciar Sesión / Registrarse
          </button>
        )}
      </div>
    </header>
  );
}
