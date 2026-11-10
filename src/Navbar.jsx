import { useState } from 'react';

export default function Navbar({ session, onOpenPerfil, onCerrarSesion }) {
  return (
    <header className="bg-neutral-900 border-b border-neutral-800 px-6 py-3 flex items-center justify-between">
      {/* SECCIÓN LOGO */}
      <div className="flex items-center gap-3">
        {/* Reemplazá 'logo.png' por la ruta de tu logo en /public o tu URL de imagen */}
        <img 
          src="/logo.png" 
          alt="Espíndola Competición" 
          className="h-10 w-auto object-contain"
          onError={(e) => {
            // Si la imagen falla o no existe todavía, muestra el badge con la E como fallback
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        <div className="hidden bg-amber-500 text-black font-black text-xl w-9 h-9 items-center justify-center rounded">
          E
        </div>
        <span className="text-white font-bold text-lg tracking-wide hidden sm:inline">
          ESPÍNDOLA COMPETICIÓN
        </span>
      </div>

      {/* NAVEGACIÓN */}
      <nav className="flex items-center gap-4">
        <button className="bg-amber-500 text-black font-bold px-3 py-1.5 rounded-lg text-sm uppercase">
          Tiempos en Vivo
        </button>
        <button className="text-gray-300 hover:text-white font-semibold px-3 py-1.5 text-sm uppercase transition">
          Campeonatos
        </button>
      </nav>

      {/* PERFIL / USUARIO */}
      <div className="flex items-center gap-4">
        {session ? (
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenPerfil}
              className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white px-3 py-1.5 rounded-lg transition text-sm cursor-pointer"
              title="Hacé clic para editar tu perfil"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-medium text-gray-200">
                {session.user.email}
              </span>
              <span className="text-xs text-amber-500 font-semibold uppercase bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 ml-1">
                Perfil
              </span>
            </button>

            <button
              onClick={onCerrarSesion}
              className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/60 px-2.5 py-1.5 rounded-lg transition"
            >
              Cerrar Sesión
            </button>
          </div>
        ) : (
          <button className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-4 py-1.5 rounded-lg text-sm uppercase transition">
            Iniciar Sesión
          </button>
        )}
      </div>
    </header>
  );
}
