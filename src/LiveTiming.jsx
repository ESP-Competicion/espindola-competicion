import { useState, useEffect } from 'react';

const API_BASE = "https://br.assettohosting.com:10314/api/v1";
const TOKEN = import.meta.env.VITE_ASSETTO_API_TOKEN || "ahsm_0a5fdc7e3c9fa77fdba10849c6f9855212f3c4c4d403577";

export default function LiveTiming() {
  const [errorCritico, setErrorCritico] = useState(null);
  const [datosPrueba, setDatosPrueba] = useState("Conectando...");

  useEffect(() => {
    async function probarConexion() {
      try {
        const headers = { 
          'Authorization': `Bearer ${TOKEN}`,
          'Accept': 'application/json'
        };
        
        const res = await fetch(`${API_BASE}/server`, { headers });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setDatosPrueba(JSON.stringify(data, null, 2));
      } catch (err) {
        console.error("Error capturado:", err);
        setErrorCritico(err.message);
      }
    }
    probarConexion();
  }, []);

  if (errorCritico) {
    return (
      <div className="p-8 text-red-400 font-wrc text-xl">
        <h2>ERROR CRÍTICO DETECTADO:</h2>
        <p>{errorCritico}</p>
      </div>
    );
  }

  return (
    <div className="p-8 text-white font-wrc space-y-4">
      <h2 className="text-2xl text-amber-400">DIagnóstico de Telemetría</h2>
      <p className="text-emerald-400">Si ves esto, el componente no se cayó.</p>
      <pre className="bg-black p-4 rounded-xl text-xs text-neutral-300 overflow-auto max-h-96">
        {datosPrueba}
      </pre>
    </div>
  );
}