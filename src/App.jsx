{/* 7. SALÓN DE LA FAMA - PODIO ESCALONADO */}
        {pestanaActiva === 'fama' && (
          <div className="space-y-12 max-w-6xl mx-auto">
            
            {/* Encabezado y Contador Total */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h2 className="font-wrc text-4xl md:text-5xl text-amber-400 tracking-wide drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                  SALÓN DE LA FAMA - PODIO DE CAMPEONES
                </h2>
                <p className="text-neutral-200 text-sm md:text-base font-sans mt-1 drop-shadow">
                  Los pilotos con más títulos oficiales en la historia de Espíndola Competición.
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

            {/* Formulario Admin */}
            {esAdmin && (
              <div className="bg-neutral-900/75 backdrop-blur-md border border-amber-500/50 rounded-2xl p-6 shadow-2xl space-y-4">
                <h3 className="font-wrc text-xl text-amber-400">
                  {editandoId !== null ? '✏️ Editar Piloto del Podio' : '🏆 Agregar Piloto al Salón de la Fama'}
                </h3>
                <form onSubmit={handleGuardarPilotoFama} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-xs text-neutral-300 uppercase mb-1 font-bold">Nombre Piloto</label>
                    <input
                      type="text"
                      value={nuevoPilotoFama.nombre}
                      onChange={(e) => setNuevoPilotoFama({ ...nuevoPilotoFama, nombre: e.target.value })}
                      placeholder="Ej: Joaco Castaño"
                      required
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2 text-sm text-white focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-300 uppercase mb-1 font-bold">Ciudad / Categoría</label>
                    <input
                      type="text"
                      value={nuevoPilotoFama.categoria}
                      onChange={(e) => setNuevoPilotoFama({ ...nuevoPilotoFama, categoria: e.target.value })}
                      placeholder="Ej: Posadas - Misiones"
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2 text-sm text-white focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-300 uppercase mb-1 font-bold">Campeonatos</label>
                    <input
                      type="number"
                      value={nuevoPilotoFama.campeonatos}
                      onChange={(e) => setNuevoPilotoFama({ ...nuevoPilotoFama, campeonatos: e.target.value })}
                      placeholder="Ej: 17"
                      required
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2 text-sm text-white focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-300 uppercase mb-1 font-bold">Foto Piloto</label>
                    <SubirImagen currentUrl={nuevoPilotoFama.foto} onUpload={(url) => setNuevoPilotoFama({ ...nuevoPilotoFama, foto: url })} />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-3 pt-2">
                    {editandoId !== null && (
                      <button
                        type="button"
                        onClick={() => { setEditandoId(null); setNuevoPilotoFama({ nombre: '', categoria: '', campeonatos: '', foto: '' }); }}
                        className="bg-neutral-800 text-neutral-300 font-wrc text-xs px-5 py-2.5 rounded-xl cursor-pointer"
                      >
                        Cancelar
                      </button>
                    )}
                    <button
                      type="submit"
                      className="bg-amber-500 hover:bg-amber-400 text-black font-wrc text-sm font-black uppercase px-6 py-2.5 rounded-xl transition shadow-lg cursor-pointer"
                    >
                      {editandoId !== null ? 'Actualizar Piloto' : 'Guardar en el Salón'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* PODIO ESCALONADO (2º IZQUIERDA - 1º CENTRO ARRIBA - 3º DERECHA) */}
            {top3.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-8 pb-4">
                
                {/* 2º PUESTO (Izquierda) */}
                {top3[1] && (
                  <div className="order-2 md:order-1 relative bg-black/70 backdrop-blur-md border border-neutral-400/50 rounded-3xl p-7 text-center shadow-2xl flex flex-col items-center justify-between md:min-h-[340px]">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-neutral-200 text-black font-wrc text-xs px-4 py-1 rounded-full shadow-lg tracking-wider flex items-center gap-1.5 whitespace-nowrap">
                      <span>🥈</span> 2º PUESTO
                    </div>

                    {esAdmin && (
                      <div className="absolute top-3 right-4 flex gap-2">
                        <button onClick={() => handleEditarPilotoFama(top3[1])} className="text-xs text-amber-400 hover:scale-110 transition cursor-pointer">✏️</button>
                        <button onClick={() => handleEliminarPilotoFama(top3[1].id)} className="text-xs text-red-400 hover:scale-110 transition cursor-pointer">🗑️</button>
                      </div>
                    )}

                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-neutral-300 mt-4 mb-3 shadow-lg bg-neutral-900">
                      <img src={top3[1].foto} alt={top3[1].nombre} className="w-full h-full object-cover" />
                    </div>

                    <div className="space-y-1 my-2">
                      <h3 className="font-wrc text-2xl md:text-3xl text-white tracking-wide">{top3[1].nombre}</h3>
                      <p className="text-neutral-300 text-xs font-sans">{top3[1].categoria}</p>
                    </div>

                    <div className="mt-4 bg-white/5 border border-white/15 rounded-xl px-5 py-2 font-wrc text-sm tracking-wider text-neutral-200">
                      TÍTULOS: <span className="text-white text-base ml-1">{top3[1].campeonatos}</span> 🏆
                    </div>
                  </div>
                )}

                {/* 1º PUESTO (Centro y Más Alto) */}
                {top3[0] && (
                  <div className="order-1 md:order-2 relative bg-gradient-to-b from-amber-500/20 via-black/80 to-black/85 backdrop-blur-md border-2 border-amber-400 rounded-3xl p-8 text-center shadow-[0_0_40px_rgba(251,191,36,0.25)] flex flex-col items-center justify-between md:min-h-[400px] md:-translate-y-4">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-black font-wrc text-sm px-5 py-1 rounded-full shadow-lg tracking-wider flex items-center gap-1.5 whitespace-nowrap">
                      <span>🥇</span> 1º PUESTO
                    </div>

                    {esAdmin && (
                      <div className="absolute top-3 right-4 flex gap-2">
                        <button onClick={() => handleEditarPilotoFama(top3[0])} className="text-xs text-amber-400 hover:scale-110 transition cursor-pointer">✏️</button>
                        <button onClick={() => handleEliminarPilotoFama(top3[0].id)} className="text-xs text-red-400 hover:scale-110 transition cursor-pointer">🗑️</button>
                      </div>
                    )}

                    <div className="w-28 h-28 rounded-full overflow-hidden border-[3px] border-amber-400 mt-4 mb-3 shadow-[0_0_20px_rgba(251,191,36,0.4)] bg-neutral-900">
                      <img src={top3[0].foto} alt={top3[0].nombre} className="w-full h-full object-cover" />
                    </div>

                    <div className="space-y-1 my-2">
                      <h3 className="font-wrc text-3xl md:text-4xl text-amber-400 tracking-wide drop-shadow">{top3[0].nombre}</h3>
                      <p className="text-neutral-200 text-xs md:text-sm font-sans">{top3[0].categoria}</p>
                    </div>

                    <div className="mt-4 bg-amber-500/15 border border-amber-400/50 rounded-xl px-6 py-2.5 font-wrc text-base tracking-wider text-amber-300">
                      TÍTULOS ABSOLUTOS: <span className="text-amber-400 text-xl ml-1">{top3[0].campeonatos}</span> 🏆
                    </div>
                  </div>
                )}

                {/* 3º PUESTO (Derecha) */}
                {top3[2] && (
                  <div className="order-3 relative bg-black/70 backdrop-blur-md border border-amber-700/60 rounded-3xl p-7 text-center shadow-2xl flex flex-col items-center justify-between md:min-h-[310px]">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-700 text-white font-wrc text-xs px-4 py-1 rounded-full shadow-lg tracking-wider flex items-center gap-1.5 whitespace-nowrap">
                      <span>🥉</span> 3º PUESTO
                    </div>

                    {esAdmin && (
                      <div className="absolute top-3 right-4 flex gap-2">
                        <button onClick={() => handleEditarPilotoFama(top3[2])} className="text-xs text-amber-400 hover:scale-110 transition cursor-pointer">✏️</button>
                        <button onClick={() => handleEliminarPilotoFama(top3[2].id)} className="text-xs text-red-400 hover:scale-110 transition cursor-pointer">🗑️</button>
                      </div>
                    )}

                    <div className="w-22 h-22 rounded-full overflow-hidden border-2 border-amber-600 mt-4 mb-3 shadow-lg bg-neutral-900">
                      <img src={top3[2].foto} alt={top3[2].nombre} className="w-full h-full object-cover" />
                    </div>

                    <div className="space-y-1 my-2">
                      <h3 className="font-wrc text-2xl text-white tracking-wide">{top3[2].nombre}</h3>
                      <p className="text-neutral-300 text-xs font-sans">{top3[2].categoria}</p>
                    </div>

                    <div className="mt-4 bg-white/5 border border-amber-700/40 rounded-xl px-5 py-2 font-wrc text-sm tracking-wider text-neutral-200">
                      TÍTULOS: <span className="text-amber-500 text-base ml-1">{top3[2].campeonatos}</span> 🏆
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* RESTO DE LA LISTA (4º PUESTO EN ADELANTE) */}
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
                        <p className="text-xs text-neutral-400 font-sans">{piloto.categoria}</p>
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