import React, { useEffect, useState } from 'react';

export default function LiveTiming() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/live');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Error cargando live timing:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000); // Actualiza cada 3 segundos
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return <div className="text-center text-white py-10">Conectando con el servidor...</div>;
  }

  // Estructura de mapeo basada en los datos reales del server
  const trackName = data?.track || data?.servername || "Circuito Activo";
  const drivers = data?.drivers || data?.cars || [];

  return (
    <div className="max-w-6xl mx-auto p-4 text-white">
      {/* Cabecera del Circuito */}
      <div className="bg-zinc-900/80 border border-amber-500/30 p-4 rounded-xl mb-6 flex justify-between items-center">
        <div>
          <span className="text-amber-400 font-bold tracking-wider text-sm">CIRCUITO EN VIVO:</span>
          <h2 className="text-xl font-extrabold uppercase">{trackName}</h2>
        </div>
        <div className="bg-emerald-500/20 border border-emerald-500 px-3 py-1 rounded-full text-emerald-400 text-xs font-bold animate-pulse">
          SERVIDOR EN VIVO ({drivers.length} PILOTOS)
        </div>
      </div>

      {/* Tabla de Pilotos */}
      <div className="overflow-x-auto bg-zinc-950/90 border border-zinc-800 rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 text-xs text-zinc-400 uppercase bg-zinc-900/50">
              <th className="p-3">#</th>
              <th className="p-3">Driver</th>
              <th className="p-3">Car</th>
              <th className="p-3">Current Lap</th>
              <th className="p-3">Best Lap</th>
              <th className="p-3">Gap</th>
              <th className="p-3">Laps</th>
            </tr>
          </thead>
          <tbody>
            {drivers.length > 0 ? (
              drivers.map((driver, index) => (
                <tr key={index} className="border-b border-zinc-900 hover:bg-zinc-900/40 text-sm">
                  <td className="p-3 font-bold text-amber-400">{driver.position || index + 1}</td>
                  <td className="p-3 font-semibold">{driver.name || driver.driverName}</td>
                  <td className="p-3 text-zinc-300">{driver.car || driver.carModel}</td>
                  <td className="p-3 font-mono">{driver.currentLap || "-"}</td>
                  <td className="p-3 font-mono text-emerald-400">{driver.bestLap || "-"}</td>
                  <td className="p-3 font-mono text-zinc-400">{driver.gap || "-"}</td>
                  <td className="p-3">{driver.laps || 0}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-8 text-zinc-500">
                  No hay pilotos en pista en este momento (o sincronizando datos...).
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
