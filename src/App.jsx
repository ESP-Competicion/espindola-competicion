{/* 1. LIVETIMING (Interfaz Propia conectada a API de AssettoHosting) */}
          {pestanaActiva === 'livetiming' && (
            <div className="space-y-6">
              <div className="bg-neutral-900/60 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
                
                {/* Cabecera del Live Timing */}
                <div className="flex flex-wrap justify-between items-center mb-6 border-b border-neutral-800 pb-4 gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-amber-400 uppercase tracking-wide">Live Timing & Telemetría - Espíndola Competición</h2>
                    <p className="text-neutral-400 text-sm">Servidor Activo: <span className="text-sky-400 font-mono">AssettoHosting - Servidor Oficial WRC</span></p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3.5 py-1.5 rounded-full text-xs font-bold border border-emerald-500/30">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span> Conectado a API
                    </span>
                    <button 
                      onClick={() => alert('Actualizando datos de telemetría...')} 
                      className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-neutral-700 transition"
                    >
                      🔄 Actualizar
                    </button>
                  </div>
                </div>

                {/* Tabla de Tiempos y Posiciones en Vivo (Estilo Profesional) */}
                <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-950/70 shadow-inner">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-800 text-xs font-bold text-neutral-400 uppercase bg-neutral-900/50">
                        <th className="py-3 px-4">Pos</th>
                        <th className="py-3 px-4">Piloto</th>
                        <th className="py-3 px-4">Vehículo</th>
                        <th className="py-3 px-4">Mejor Vuelta</th>
                        <th className="py-3 px-4">Gap</th>
                        <th className="py-3 px-4 text-center">Vueltas</th>
                        <th className="py-3 px-4 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900 text-sm font-medium">
                      {/* Fila de ejemplo 1 (Acá podés mapear los datos que vengan de tu API de AssettoHosting) */}
                      <tr className="hover:bg-neutral-900/40 transition">
                        <td className="py-3 px-4 font-black text-amber-400">1</td>
                        <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                          <span className="text-xs">🇦🇷</span> Lucas Negri
                        </td>
                        <td className="py-3 px-4 text-neutral-300">Renault Clio Rally5</td>
                        <td className="py-3 px-4 font-mono text-sky-400">03:42.125</td>
                        <td className="py-3 px-4 font-mono text-neutral-400">Líder</td>
                        <td className="py-3 px-4 text-center font-mono">4/5</td>
                        <td className="py-3 px-4 text-center">
                          <span className="bg-sky-500/10 text-sky-400 border border-sky-500/30 text-xs px-2.5 py-1 rounded-lg">En Pista</span>
                        </td>
                      </tr>

                      {/* Fila de ejemplo 2 */}
                      <tr className="hover:bg-neutral-900/40 transition">
                        <td className="py-3 px-4 font-black text-neutral-300">2</td>
                        <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                          <span className="text-xs">🇧🇷</span> Pedro Laninha
                        </td>
                        <td className="py-3 px-4 text-neutral-300">Peugeot 208 Rally4</td>
                        <td className="py-3 px-4 font-mono text-sky-400">03:43.890</td>
                        <td className="py-3 px-4 font-mono text-amber-500">+1.765</td>
                        <td className="py-3 px-4 text-center font-mono">4/5</td>
                        <td className="py-3 px-4 text-center">
                          <span className="bg-sky-500/10 text-sky-400 border border-sky-500/30 text-xs px-2.5 py-1 rounded-lg">En Pista</span>
                        </td>
                      </tr>

                      {/* Fila de ejemplo 3 */}
                      <tr className="hover:bg-neutral-900/40 transition">
                        <td className="py-3 px-4 font-black text-neutral-300">3</td>
                        <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                          <span className="text-xs">🇦🇷</span> Piloto Invitado
                        </td>
                        <td className="py-3 px-4 text-neutral-300">Ford Fiesta Rally3</td>
                        <td className="py-3 px-4 font-mono text-sky-400">03:46.410</td>
                        <td className="py-3 px-4 font-mono text-amber-500">+4.285</td>
                        <td className="py-3 px-4 text-center font-mono">3/5</td>
                        <td className="py-3 px-4 text-center">
                          <span className="bg-neutral-800 text-neutral-400 border border-neutral-700 text-xs px-2.5 py-1 rounded-lg">En Boxes</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
