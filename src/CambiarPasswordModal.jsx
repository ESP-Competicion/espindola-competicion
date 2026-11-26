import { useState } from 'react';

export default function CambiarPasswordModal({ onClose }) {
  const [estado, setEstado] = useState('');

  const handleConfirmar = (e) => {
    e.preventDefault();
    setEstado('El acceso por correo ya está activo sin contraseña. Podés cerrar esta ventana.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="bg-neutral-900 border border-[#38bdf8]/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 font-sans text-white">
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <h2 className="font-wrc text-xl text-[#38bdf8] uppercase tracking-wide">
            Seguridad de Cuenta
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white text-sm px-2 py-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-neutral-300 leading-relaxed">
          Ya no se utiliza contraseña de Supabase en el portal; tu sesión se gestiona con tu correo de piloto registrado.
        </p>

        {estado && (
          <div className="bg-[#38bdf8]/15 border border-[#38bdf8]/40 text-sky-200 text-xs p-3 rounded-xl">
            {estado}
          </div>
        )}

        <form onSubmit={handleConfirmar} className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs px-4 py-2 rounded-xl cursor-pointer"
          >
            Cerrar
          </button>
          <button
            type="submit"
            className="bg-[#38bdf8] hover:bg-[#7dd3fc] text-slate-950 font-black text-xs px-4 py-2 rounded-xl cursor-pointer"
          >
            Entendido
          </button>
        </form>
      </div>
    </div>
  );
}