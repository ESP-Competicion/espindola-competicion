import { useState } from 'react';
import { supabase } from './supabaseClient';

export default function SubirImagen({ onUpload, currentUrl }) {
  const [subiendo, setSubiendo] = useState(false);

  const handleFileChange = async (e) => {
    try {
      setSubiendo(true);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Subir archivo al bucket 'imagenes' de Supabase
      const { error: uploadError } = await supabase.storage
        .from('imagenes')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Obtener la URL pública de la imagen
      const { data } = supabase.storage
        .from('imagenes')
        .getPublicUrl(filePath);

      onUpload(data.publicUrl);
    } catch (error) {
      alert('Error al subir la imagen: ' + error.message);
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {currentUrl && (
          <img src={currentUrl} alt="Vista previa" className="w-12 h-12 rounded-full object-cover border border-amber-500/50" />
        )}
        <label className="flex-1 cursor-pointer bg-neutral-950 border border-neutral-700 hover:border-amber-500 text-neutral-300 hover:text-white px-4 py-2.5 rounded-xl text-sm font-sans flex items-center justify-center gap-2 transition">
          <span>{subiendo ? 'Subiendo a la nube...' : '📁 Seleccionar archivo de la PC'}</span>
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
