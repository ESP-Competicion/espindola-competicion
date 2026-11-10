export default function LiveTiming() {
  return (
    <div className="max-w-6xl mx-auto p-4 text-white">
      <div className="bg-zinc-900/80 border border-amber-500/30 p-4 rounded-xl mb-4 flex justify-between items-center">
        <div>
          <span className="text-amber-400 font-bold tracking-wider text-sm">SERVIDOR ESPÍNDOLA COMPETICIÓN</span>
          <h2 className="text-xl font-extrabold uppercase">Live Timing Oficial</h2>
        </div>
        <div className="bg-emerald-500/20 border border-emerald-500 px-3 py-1 rounded-full text-emerald-400 text-xs font-bold animate-pulse">
          CONECTADO EN VIVO
        </div>
      </div>

      {/* Contenedor embebido directo del live-timing oficial del servidor */}
      <div className="w-full h-[750px] rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
        <iframe 
          src="https://br.assettohosting.com:10314/live-timing" 
          title="Assetto Hosting Live Timing"
          className="w-full h-full border-0"
        />
      </div>
    </div>
  );
}
