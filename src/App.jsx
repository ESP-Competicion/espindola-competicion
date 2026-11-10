{/* 1. LIVETIMING (Conectado al Live Timing real de tu AssettoHosting) */}
          {pestanaActiva === 'livetiming' && (
            <div className="space-y-6">
              <div className="bg-neutral-900/60 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
                
                {/* Cabecera */}
                <div className="flex flex-wrap justify-between items-center mb-6 border-b border-neutral-800 pb-4 gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-amber-400 uppercase tracking-wide">Live Timing & Telemetría - Espíndola Competición</h2>
                    <p className="text-neutral-400 text-sm">Servidor Activo: <span className="text-sky-400 font-mono">Pigüé, Argentina - VW Saveiro G4 / WRC</span></p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3.5 py-1.5 rounded-full text-xs font-bold border border-emerald-500/30">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span> Servidor Online
                    </span>
                    <a 
                      href="https://br.assettohosting.com:10314/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-neutral-800 hover:bg-neutral-700 text-amber-400 text-xs font-bold px-3.5 py-2 rounded-xl border border-neutral-700 transition flex items-center gap-1.5"
                    >
                      <span>↗</span> Abrir en Pantalla Completa
                    </a>
                  </div>
                </div>

                {/* Contenedor Iframe con tu Live Timing Real */}
                <div className="w-full h-[650px] bg-neutral-950 rounded-2xl border border-neutral-800 relative overflow-hidden shadow-inner">
                  <iframe 
                    src="https://br.assettohosting.com:10314/" 
                    title="Espíndola Competición Live Timing"
                    className="w-full h-full border-0 rounded-2xl"
                  />
                </div>
              </div>
            </div>
          )}
