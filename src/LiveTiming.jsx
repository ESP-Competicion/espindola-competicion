import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Error en LiveTiming:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-950/80 border-2 border-red-500 text-white p-8 rounded-3xl max-w-4xl mx-auto my-10 font-wrc">
          <h2 className="text-3xl text-red-400 font-black mb-2">⚠️ ERROR EN EL COMPONENTE</h2>
          <pre className="text-xs text-red-300 overflow-auto">{this.state.error?.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function ContenidoLiveTiming() {
  // Reemplazá este enlace por el link público exacto que te da AssettoHosting en el botón "Public page" o "sTracker"
  const urlServerLive = "https://br.assettohosting.com:10314/"; 

  return (
    <div className="w-full px-4 md:px-8 py-4 font-wrc text-white uppercase space-y-6">
      
      {/* CABECERA */}
      <div className="bg-neutral-900/90 backdrop-blur-md border border-amber-500/40 rounded-3xl p-6 shadow-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 w-full">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs text-emerald-400 tracking-widest font-bold">LIVE TIMING OFICIAL • ESPÍNDOLA COMPETICIÓN</span>
          </div>
          <h2 className="text-2xl md:text-3xl text-white font-black tracking-wide">
            SERVIDOR OFICIAL • MONOMARCA SAVEIRO
          </h2>
        </div>
        <div className="bg-neutral-950/90 px-5 py-3 rounded-2xl border border-white/10 text-xs text-amber-400 font-bold">
          ESTADO: CONECTADO EN VIVO
        </div>
      </div>

      {/* CONTENEDOR INTEGRADO DE STRACKER / ASSETTOHOSTING */}
      <div className="bg-neutral-950/85 backdrop-blur-md border border-white/15 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)] p-2 md:p-4">
        <div className="w-full h-[750px] rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800">
          <iframe 
            src={urlServerLive} 
            title="Live Timing AssettoHosting"
            className="w-full h-full border-0 filter invert-[0.9] hue-rotate-[180deg] contrast-[1.2]"
            style={{ colorScheme: 'dark' }}
          />
        </div>
      </div>

    </div>
  );
}

export default function LiveTiming() {
  return (
    <ErrorBoundary>
      <ContenidoLiveTiming />
    </ErrorBoundary>
  );
}