import React, { useEffect, useState } from 'react';

export default function LiveTiming() {
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLiveTiming = async () => {
      try {
        const res = await fetch('/api/live');
        if (!res.ok) throw new Error(`Error en la API interna: ${res.status}`);
        
        const json = await res.json();
        setLiveData(json.data || json);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('No se pudo conectar con el servidor de Assetto.');
      } finally {
        setLoading(false);
      }
    };

    fetchLiveTiming();
    const interval = setInterval(fetchLiveTiming, 3000);
    return () => clearInterval(interval);
  }, []);

  const trackName = liveData?.track || liveData?.track_name || "Circuito Activo";
  const drivers = liveData?.drivers || liveData?.cars || liveData?.clients || [];

  return (
    <div className="max-w-6xl mx-auto p-4 text-white">
      <div className="bg-zinc-900/90 border border-amber-500/40 p-5 rounded-xl mb-6 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <span className="text-amber-400 font-bold tracking-widest text-xs uppercase">ESPÍNDOLA COMPETICIÓN</span>
          <h2 className="text-2xl font-black uppercase italic tracking-wide">CIRCUITO: {trackName}</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-zinc-950 border border-zinc-800 px-4 py-2 rounded-lg text-sm font-mono text-amber-300">
            Sesión en curso
          </div>
          <div className="bg-emerald-500/20 border border-emerald-500/60 px-4 py-2 rounded-full text-emerald-400 text-xs font-bold uppercase tracking-wider animate-pulse">
            {drivers.length} Pilotos en pista
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-800/60 text-red-300 p-4 rounded-xl text-center mb-6">
          {error}
        </div>
      )}

      <div className="overflow-x-auto bg-zinc-950/95 border border-zinc-800/80 rounded-xl shadow-2xl backdrop-blur-md">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 text-xs text-zinc-400 uppercase bg-zinc-900/80 font-semibold tracking-wider">
              <th className="p-4">Pos</th>
              <th className="p-4">Piloto</th>
              <th className="p-4">Auto</th>
              <th className="p-4">Vuelta Actual</th>
              <th className="p-4">Mejor Vuelta</th>
              <th className="p-4">Gap</th>
              <th className="p-4">Vueltas</th>
            </tr>
          </thead>
          <tbody>
            {drivers.length > 0 ? (
              drivers.map((driver, index) => (
                <tr key={index} className="border-b border-zinc-900/60 hover:bg-zinc-900/40 transition-colors text-sm">
                  <td className="p-4 font-black text-amber-400">{driver.pos || driver.position || index + 1}</td>
                  <td className="p-4 font-bold text-zinc-100">{driver.driver || driver.name || "Piloto"}</td>
                  <td className="p-4 text-zinc-300">{driver.car_name || driver.car || "-"}</td>
                  <td className="p-4 font-mono text-zinc-300">{driver.current_lap || "-"}</td>
                  <td className="p-4 font-mono text-emerald-400 font-semibold">{driver.lap_time || driver.bestLap || "-"}</td>
                  <td className="p-4 font-mono text-zinc-400">{driver.gap || "-"}</td>
                  <td className="p-4 font-mono text-zinc-300">{driver.laps_count || driver.laps || 0}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-12 text-zinc-500 italic">
                  {loading ? "Sincronizando datos con el servidor..." : "No hay pilotos en el servidor en este momento."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
