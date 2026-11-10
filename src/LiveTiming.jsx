import { useState, useEffect } from 'react';

export default function LiveTiming() {
  const [datosLive, setDatosLive] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const URL_LIVE = 'http://br.assettohosting.com:10314/api/v1/live';

  const obtenerDatos = async () => {
    try {
      const res = await fetch(URL_LIVE);
      if (!res.ok) throw new Error('Error al conectar con la API');
      const data = await res.json();
      setDatosLive(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('No se pudo obtener el estado en vivo del servidor.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    obtenerDatos();
    // Actualiza los datos en tiempo real cada 5 segundos
    const intervalo = setInterval(obtenerDatos, 5000);
    return () => clearInterval(intervalo);
  }, []);

  if (cargando) {
    return (
      <div className="flex items-center justify-center p-12 text-amber-400 font-wrc text-xl animate-pulse">
        Cargando telemetría en vivo...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-950/40 border border-red-500/40 p-6 rounded-2xl text-center text-red-300 font-sans">
        {error}
      </div>
    );
  }

  // Extraer pilotos de la respuesta (ajustar la propiedad según la estructura de la API si varía)
  const pilotos = datosLive?.session?.drivers || datosLive?.drivers || datosLive?.cars || [];
  const nombrePista = datosLive?.track || datosLive?.server_info?.track || 'Desconocida';
  const nombreSesion = datosLive?.session_type || datosLive?.session?.type || 'Sesión en curso';

  return (
    <div className="space-y-6">
      {/* Encabezado del Servidor */}
      <div className="bg-neutral-900/60 backdrop-blur-md border border-amber-500/30 p-6 rounded-3xl flex flex-wrap items-center justify-between gap-4 shadow-2xl">
        <div>
          <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-3 py-1 rounded-full font-wrc">
            ● SERVIDOR EN VIVO
          </span>
          <h2 className="font-wrc text-3xl text-white mt-2">Circuito: <span className="text-amber-400">{nombrePista}</span></h2>
          <p className="text-xs text-neutral-400 font-sans">Sesión: {nombreSesion}</p>
        </div>
        <div className="text-right">
          <span className="font-wrc text-4xl text-amber-400 font-black">{pilotos.length}</span>
          <p className="text-xs text-neutral-400 uppercase font-wrc">Pilotos en pista</p>
        </div>
      </div>

      {/* Tabla Custom de Live Timing */}
      <div className="bg-neutral-900/40 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-950/80 border-b border-white/10 font-wrc text-amber-400 text-sm tracking-wider uppercase">
                <th className="py-4 px-6">Pos</th>
                <th className="py-4 px-6">Piloto</th>
                <th className="py-4 px-6">Auto</th>
                <th className="py-4 px-6 text-right">Mejor Vuelta</th>
                <th className="py-4 px-6 text-right">Última Vuelta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans text-sm">
              {pilotos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-neutral-400 font-wrc">
                    No hay pilotos en el servidor en este momento.
                  </td>
                </tr>
              ) : (
                pilotos.map((p, idx) => (
                  <tr key={idx} className="hover:bg-amber-500/10 transition duration-200">
                    <td className="py-4 px-6 font-wrc font-bold text-amber-400">#{idx + 1}</td>
                    <td className="py-4 px-6 font-bold text-white">{p.name || p.driver_name || 'Piloto'}</td>
                    <td className="py-4 px-6 text-neutral-300">{p.car || p.model || 'N/A'}</td>
                    <td className="py-4 px-6 text-right font-mono text-amber-300 font-bold">
                      {p.best_lap || p.bestLap || '--:--.---'}
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-neutral-300">
                      {p.last_lap || p.lastLap || '--:--.---'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
