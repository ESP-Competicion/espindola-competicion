import React from 'react';

export default function LiveTiming() {
  return (
    <div className="max-w-6xl mx-auto p-4 text-white">
      {/* Cabecera personalizada de Espíndola Competición */}
      <div className="bg-zinc-900/90 border border-amber-500/40 p-5 rounded-xl mb-6 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <span className="text-amber-400 font-bold tracking-widest text-xs uppercase">ESPÍNDOLA COMPETICIÓN</span>
          <h2 className="text-2xl font-black uppercase italic tracking-wide">LIVE TIMING OFICIAL</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/25 border border-emerald-500/60 px-4 py-2 rounded-full text-emerald-400 text-xs font-bold uppercase tracking-wider animate-pulse">
            ● Servidor en Línea
          </div>
        </div>
      </div>

      {/* Contenedor embebido con el diseño oficial adaptado */}
      <div className="w-full h-[750px] bg-zinc-950/95 border border-zinc-800/80 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md">
        <iframe 
          src="https://br.assettohosting.com:10314/live-timing" 
          title="Espíndola Competición Live Timing"
          className="w-full h-full border-0"
        />
      </div>
    </div>
  );
}