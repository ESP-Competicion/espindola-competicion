import { useState } from 'react';

function comprimirImagen(file, maxAncho = 500, calidad = 0.75) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Seleccioná una imagen válida (JPG, PNG, WEBP).'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Error al leer la imagen.'));

    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('No se pudo cargar la imagen.'));

      img.onload = () => {
        let ancho = img.width;
        let alto = img.height;

        if (ancho > maxAncho) {
          alto = Math.round((alto * maxAncho) / ancho);
          ancho = maxAncho;
        }

        const canvas = document.createElement('canvas');
        canvas.width = ancho;
        canvas.height = alto;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, ancho, alto);

        resolve(canvas.toDataURL('image/jpeg', calidad));
      };

      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
  });
}

export default function SubirImagen({ onUpload, currentUrl, inicial = 'E' }) {
  const [subiendo, setSubiendo] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubiendo(true);
    try {
      const imagenComprimida = await comprimirImagen(file, 500, 0.75);
      if (onUpload) {
        onUpload(imagenComprimida);
      }
    } catch (err) {
      alert(err.message || 'Error al procesar la imagen.');
    } finally {
      setSubiendo(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-neutral-950 border border-[#38bdf8]/50 flex items-center justify-center overflow-hidden font-wrc text-[#38bdf8] text-base flex-shrink-0">
          {currentUrl ? (
            <img
              src={currentUrl}
              alt="Vista previa"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextSibling) {
                  e.currentTarget.nextSibling.style.display = 'flex';
                }
              }}
              className="w-full h-full object-cover"
            />
          ) : null}
          <span
            style={{ display: currentUrl ? 'none' : 'flex' }}
            className="w-full h-full items-center justify-center"
          >
            {inicial}
          </span>
        </div>

        <label className="flex-1 cursor-pointer bg-neutral-950 border border-neutral-700 hover:border-[#38bdf8] text-neutral-300 hover:text-white px-4 py-2.5 rounded-xl text-xs font-sans flex items-center justify-center gap-2 transition">
          <span>{subiendo ? 'Comprimiendo imagen...' : '📁 Subir foto desde tu dispositivo'}</span>
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