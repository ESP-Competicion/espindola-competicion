import { useState, useEffect } from 'react';
import { api } from './api';

export default function PerfilPiloto({ userId }) {
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarPerfil() {
      if (!userId) {
        setCargando(false);
        return;
      }

      setCargando(true);
      try {
        const { data } = await api
          .from('perfiles')
          .eq('id', userId)
          .single()
          .select();
        setPerfil(data || null);
      } finally {
        setCargando(false);
      }
    }

    cargarPerfil();
  }, [userId]);

  if (cargando) {
    return (
      <div className="bg-neutral-900/60 border border-white/10 rounded-xl p-4 text-xs font-wrc text-neutral-300">
        CARGANDO PERFIL...
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="bg-neutral-900/60 border border-white/10 rounded-xl p-4 text-xs font-wrc text-neutral-400">
        PERFIL NO ENCONTRADO.
      </div>
    );
  }

  const inicial = (perfil.nombre_piloto || 'E').charAt(0).toUpperCase();

  return (
    <div className="bg-neutral-900/65 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl flex items-center gap-3">
      <div className="w-12 h-12 rounded-full bg-neutral-800 border border-[#38bdf8]/50 flex items-center justify-center overflow-hidden font-wrc text-[#38bdf8] text-base flex-shrink-0">
        {perfil.avatar_url ? (
          <img
            src={perfil.avatar_url}
            alt={perfil.nombre_piloto || 'Piloto'}
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
          style={{ display: perfil.avatar_url ? 'none' : 'flex' }}
          className="w-full h-full items-center justify-center"
        >
          {inicial}
        </span>
      </div>

      <div className="space-y-0.5 overflow-hidden">
        <h3 className="font-wrc text-base text-white truncate">
          {(perfil.nombre_piloto || 'PILOTO').toUpperCase()}
        </h3>
        {perfil.nacionalidad && (
          <p className="text-[11px] font-wrc text-neutral-300 truncate">
            PAÍS: <span className="text-white">{perfil.nacionalidad}</span>
          </p>
        )}
        {perfil.provincia && (
          <p className="text-[11px] font-wrc text-neutral-300 truncate">
            PROVINCIA: <span className="text-white">{perfil.provincia}</span>
          </p>
        )}
        {perfil.steam_id && (
          <p className="text-[10px] font-mono text-sky-300 truncate">
            STEAM ID: {perfil.steam_id}
          </p>
        )}
      </div>
    </div>
  );
}