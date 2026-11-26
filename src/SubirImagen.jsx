import { useState } from 'react';

export default function SubirImagen({ onUpload, currentUrl }) {
  const [subiendo, setSubiendo] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubiendo(true);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string' && onUpload) {
        onUpload(reader.result);
      }
      setSubiendo(false);
    };
    reader.onerror = () => {
      alert('Error al leer la imagen.');
      setSubiendo(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {currentUrl && (
          <img
            src={currentUrl}
            alt="Vista previa"
            className="w-12 h-12 rounded-full object-cover border border-amber-500/50"
          />
        )}
        <label className="flex-1 cursor-pointer bg-neutral-950 border border-neutral-700 hover:border-amber-500 text-neutral-300 hover:text-white px-4 py-2.5 rounded-xl text-sm font-sans flex items-center justify-center gap-2 transition">
          <span>{subiendo ? 'Cargando imagen...' : '📁 Seleccionar archivo de la PC'}</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={subiendo}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}