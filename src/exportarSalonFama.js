const cargarImagen = (src) =>
  new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

const dibujarFotoCircular = (ctx, img, x, y, radio, colorBorde, grosorBorde = 4, inicial = 'E') => {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radio, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = '#111827';
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radio - grosorBorde / 2, 0, Math.PI * 2);
  ctx.clip();

  if (img) {
    const size = radio * 2;
    const scale = Math.max(size / img.width, size / img.height);
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    ctx.drawImage(img, x - drawW / 2, y - drawH / 2, drawW, drawH);
  } else {
    ctx.fillStyle = '#38bdf8';
    ctx.font = `800 ${Math.round(radio * 0.9)}px "Barlow Condensed", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(inicial, x, y + 2);
  }

  ctx.restore();

  ctx.lineWidth = grosorBorde;
  ctx.strokeStyle = colorBorde;
  ctx.beginPath();
  ctx.arc(x, y, radio, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
};

const dibujarBadgePuesto = (ctx, texto, cx, cy, bgColor, textColor, fontSize = 18) => {
  ctx.save();
  ctx.font = `800 ${fontSize}px "Barlow Condensed", sans-serif`;
  const textWidth = ctx.measureText(texto).width;
  const padX = 28;
  const pillW = textWidth + padX * 2;
  const pillH = fontSize + 16;
  const x = cx - pillW / 2;
  const y = cy - pillH / 2;
  const r = pillH / 2;

  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.roundRect(x, y, pillW, pillH, r);
  ctx.fill();

  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(texto, cx, cy + 1);
  ctx.restore();
};

const dibujarTarjetaPodio = (ctx, piloto, img, cfg) => {
  if (!piloto) return;
  const {
    x,
    y,
    w,
    h,
    badgeTexto,
    badgeBg,
    badgeTextColor,
    bordeColor,
    fondoGradiente,
    tituloColor,
    radioFoto,
    esPrimero
  } = cfg;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 24);
  ctx.fillStyle = fondoGradiente;
  ctx.fill();

  ctx.lineWidth = esPrimero ? 4 : 2.5;
  ctx.strokeStyle = bordeColor;
  ctx.stroke();

  dibujarBadgePuesto(ctx, badgeTexto, x + w / 2, y, badgeBg, badgeTextColor, esPrimero ? 20 : 17);

  const centroX = x + w / 2;
  const fotoY = y + 36 + radioFoto;
  dibujarFotoCircular(
    ctx,
    img,
    centroX,
    fotoY,
    radioFoto,
    bordeColor,
    esPrimero ? 5 : 4,
    (piloto.nombre || 'E').charAt(0).toUpperCase()
  );

  const nombreY = fotoY + radioFoto + (esPrimero ? 34 : 28);
  ctx.fillStyle = tituloColor;
  ctx.font = `900 ${esPrimero ? 38 : 31}px "Barlow Condensed", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText((piloto.nombre || '').toUpperCase(), centroX, nombreY, w - 32);

  const nacY = nombreY + (esPrimero ? 28 : 24);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = `700 ${esPrimero ? 19 : 16}px "Barlow Condensed", sans-serif`;
  ctx.fillText((piloto.nacionalidad || 'ARGENTINA').toUpperCase(), centroX, nacY, w - 32);

  const pillW = Math.min(w - 44, esPrimero ? 310 : 250);
  const pillH = esPrimero ? 46 : 40;
  const pillX = centroX - pillW / 2;
  const pillY = y + h - pillH - 22;

  ctx.fillStyle = esPrimero ? 'rgba(56, 189, 248, 0.16)' : 'rgba(255, 255, 255, 0.06)';
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, 12);
  ctx.fill();

  ctx.lineWidth = 1.5;
  ctx.strokeStyle = esPrimero ? 'rgba(56, 189, 248, 0.55)' : 'rgba(255, 255, 255, 0.18)';
  ctx.stroke();

  const etiquetaTitulos = esPrimero
    ? `TÍTULOS ABSOLUTOS: ${piloto.campeonatos} 🏆`
    : `TÍTULOS: ${piloto.campeonatos} 🏆`;

  ctx.fillStyle = esPrimero ? '#7dd3fc' : '#f1f5f9';
  ctx.font = `800 ${esPrimero ? 22 : 19}px "Barlow Condensed", sans-serif`;
  ctx.fillText(etiquetaTitulos, centroX, pillY + pillH / 2 + 1, pillW - 16);
  ctx.restore();
};

const dibujarColumnaRanking = (ctx, listaPilotos, fotosMap, { x, y, w, h, titulo, totalLabel }) => {
  if (!listaPilotos.length) return;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 22);
  ctx.fillStyle = 'rgba(8, 12, 20, 0.80)';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.stroke();

  const headerH = 48;
  ctx.beginPath();
  ctx.roundRect(x, y, w, headerH, [22, 22, 0, 0]);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.fill();

  ctx.fillStyle = '#38bdf8';
  ctx.font = '800 20px "Barlow Condensed", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(titulo, x + 22, y + headerH / 2 + 1);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 16px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(totalLabel, x + w - 22, y + headerH / 2 + 1);

  const cuerpoY = y + headerH;
  const cuerpoH = Math.max(40, h - headerH);
  const rowH = cuerpoH / listaPilotos.length;

  listaPilotos.forEach((piloto, idx) => {
    const rowTop = cuerpoY + idx * rowH;
    const midY = rowTop + rowH / 2;

    if (idx > 0) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 16, rowTop);
      ctx.lineTo(x + w - 16, rowTop);
      ctx.stroke();
    }

    ctx.fillStyle = '#38bdf8';
    ctx.font = '800 22px "Barlow Condensed", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`#${piloto.puesto}`, x + 20, midY + 1);

    const avatarRadio = Math.min(20, Math.max(15, rowH * 0.28));
    dibujarFotoCircular(
      ctx,
      fotosMap[piloto.id],
      x + 68 + avatarRadio,
      midY,
      avatarRadio,
      'rgba(255, 255, 255, 0.35)',
      2,
      (piloto.nombre || 'E').charAt(0).toUpperCase()
    );

    const textoX = x + 68 + avatarRadio * 2 + 14;
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 24px "Barlow Condensed", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText((piloto.nombre || '').toUpperCase(), textoX, midY - (rowH >= 64 ? 8 : 0), w - 210);

    if (rowH >= 64) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 14px "Barlow Condensed", sans-serif';
      ctx.fillText((piloto.nacionalidad || 'ARGENTINA').toUpperCase(), textoX, midY + 13, w - 210);
    }

    ctx.fillStyle = '#7dd3fc';
    ctx.font = '800 21px "Barlow Condensed", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${piloto.campeonatos} TÍTULOS 🏆`, x + w - 22, midY + 1);
  });

  ctx.restore();
};

export async function descargarImagenSalonFama({
  hallFama = [],
  totalTitulos = 0,
  obtenerFoto,
  formato = '16:9'
}) {
  if (!Array.isArray(hallFama) || hallFama.length === 0) return;

  const esVertical = formato === '9:16';
  const width = esVertical ? 1080 : 1920;
  const height = esVertical ? 1920 : 1080;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const pilotosConPuesto = hallFama.slice(0, 15).map((p, i) => ({
    ...p,
    puesto: i + 1
  }));

  const [fondoImg, logoImg] = await Promise.all([
    cargarImagen('/FondoTaller.png'),
    cargarImagen('/logo.svg')
  ]);

  const fotosEntries = await Promise.all(
    pilotosConPuesto.map(async (p) => {
      const url = typeof obtenerFoto === 'function' ? obtenerFoto(p) : p.foto;
      const img = await cargarImagen(url);
      return [p.id, img];
    })
  );
  const fotosMap = Object.fromEntries(fotosEntries);

  // Fondo con escalado cover
  if (fondoImg) {
    const scale = Math.max(width / fondoImg.width, height / fondoImg.height);
    const drawW = fondoImg.width * scale;
    const drawH = fondoImg.height * scale;
    ctx.drawImage(fondoImg, (width - drawW) / 2, (height - drawH) / 2, drawW, drawH);
  } else {
    ctx.fillStyle = '#050811';
    ctx.fillRect(0, 0, width, height);
  }

  // Oscurecido suave para legibilidad
  const overlay = ctx.createLinearGradient(0, 0, 0, height);
  overlay.addColorStop(0, 'rgba(5, 8, 16, 0.72)');
  overlay.addColorStop(0.5, 'rgba(5, 8, 16, 0.56)');
  overlay.addColorStop(1, 'rgba(5, 8, 16, 0.84)');
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, width, height);

  const padX = esVertical ? 54 : 84;
  const contentW = width - padX * 2;
  let cursorY = esVertical ? 64 : 52;

  // 1) Cabecera superior: Logo + Badge total de títulos
  if (logoImg) {
    const logoMaxH = esVertical ? 58 : 64;
    const ratio = logoImg.width / logoImg.height;
    const logoW = logoMaxH * ratio;
    ctx.drawImage(logoImg, padX, cursorY, logoW, logoMaxH);
  }

  const badgeW = esVertical ? 270 : 300;
  const badgeH = esVertical ? 72 : 78;
  const badgeX = width - padX - badgeW;
  const badgeY = cursorY - 2;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 16);
  ctx.fillStyle = 'rgba(8, 12, 20, 0.84)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
  ctx.stroke();

  ctx.fillStyle = '#94a3b8';
  ctx.font = '800 14px "Barlow Condensed", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CAMPEONATOS EN TOTAL', badgeX + badgeW / 2, badgeY + 24);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '900 30px "Barlow Condensed", sans-serif';
  ctx.fillText(`${totalTitulos} TÍTULOS 🏆`, badgeX + badgeW / 2, badgeY + 53);
  ctx.restore();

  // Más aire entre cabecera y título principal
  cursorY += esVertical ? 116 : 114;

  // 2) Título y subtítulo
  ctx.fillStyle = '#38bdf8';
  ctx.font = `900 ${esVertical ? 48 : 54}px "Barlow Condensed", sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('SALÓN DE LA FAMA - PODIO DE CAMPEONES', padX, cursorY, contentW);

  cursorY += esVertical ? 36 : 40;
  ctx.fillStyle = '#e2e8f0';
  ctx.font = `700 ${esVertical ? 20 : 22}px "Barlow Condensed", sans-serif`;
  ctx.fillText(
    'LOS PILOTOS CON MÁS TÍTULOS OFICIALES EN LA HISTORIA DE ESPÍNDOLA COMPETICIÓN',
    padX,
    cursorY,
    contentW
  );

  // Más espacio antes del podio
  cursorY += esVertical ? 54 : 52;

  // 3) Podio (Top 3)
  const primero = pilotosConPuesto[0];
  const segundo = pilotosConPuesto[1];
  const tercero = pilotosConPuesto[2];

  if (esVertical) {
    const gap = 18;
    const cardW = (contentW - gap * 2) / 3;
    const baseH = 278;
    const primeroH = 304;
    const primeroY = cursorY;
    const lateralesY = cursorY + (primeroH - baseH) / 2;

    if (segundo) {
      dibujarTarjetaPodio(ctx, segundo, fotosMap[segundo.id], {
        x: padX,
        y: lateralesY,
        w: cardW,
        h: baseH,
        badgeTexto: '🥈 2º PUESTO',
        badgeBg: '#e2e8f0',
        badgeTextColor: '#0f172a',
        bordeColor: 'rgba(203, 213, 225, 0.7)',
        fondoGradiente: 'rgba(10, 15, 25, 0.84)',
        tituloColor: '#ffffff',
        radioFoto: 40,
        esPrimero: false
      });
    }

    if (primero) {
      const grad1 = ctx.createLinearGradient(0, primeroY, 0, primeroY + primeroH);
      grad1.addColorStop(0, 'rgba(56, 189, 248, 0.24)');
      grad1.addColorStop(1, 'rgba(8, 12, 20, 0.90)');

      dibujarTarjetaPodio(ctx, primero, fotosMap[primero.id], {
        x: padX + cardW + gap,
        y: primeroY,
        w: cardW,
        h: primeroH,
        badgeTexto: '🥇 1º PUESTO',
        badgeBg: '#38bdf8',
        badgeTextColor: '#082f49',
        bordeColor: '#38bdf8',
        fondoGradiente: grad1,
        tituloColor: '#38bdf8',
        radioFoto: 46,
        esPrimero: true
      });
    }

    if (tercero) {
      dibujarTarjetaPodio(ctx, tercero, fotosMap[tercero.id], {
        x: padX + (cardW + gap) * 2,
        y: lateralesY,
        w: cardW,
        h: baseH,
        badgeTexto: '🥉 3º PUESTO',
        badgeBg: '#0369a1',
        badgeTextColor: '#ffffff',
        bordeColor: 'rgba(14, 165, 233, 0.7)',
        fondoGradiente: 'rgba(10, 15, 25, 0.84)',
        tituloColor: '#ffffff',
        radioFoto: 40,
        esPrimero: false
      });
    }

    cursorY += primeroH + 46;
  } else {
    const gap = 28;
    const cardW = (contentW - gap * 2) / 3;
    const baseH = 262;
    const primeroH = 286;
    const primeroY = cursorY;
    const lateralesY = cursorY + (primeroH - baseH) / 2;

    if (segundo) {
      dibujarTarjetaPodio(ctx, segundo, fotosMap[segundo.id], {
        x: padX,
        y: lateralesY,
        w: cardW,
        h: baseH,
        badgeTexto: '🥈 2º PUESTO',
        badgeBg: '#e2e8f0',
        badgeTextColor: '#0f172a',
        bordeColor: 'rgba(203, 213, 225, 0.7)',
        fondoGradiente: 'rgba(10, 15, 25, 0.84)',
        tituloColor: '#ffffff',
        radioFoto: 42,
        esPrimero: false
      });
    }

    if (primero) {
      const grad1 = ctx.createLinearGradient(0, primeroY, 0, primeroY + primeroH);
      grad1.addColorStop(0, 'rgba(56, 189, 248, 0.24)');
      grad1.addColorStop(1, 'rgba(8, 12, 20, 0.90)');

      dibujarTarjetaPodio(ctx, primero, fotosMap[primero.id], {
        x: padX + cardW + gap,
        y: primeroY,
        w: cardW,
        h: primeroH,
        badgeTexto: '🥇 1º PUESTO',
        badgeBg: '#38bdf8',
        badgeTextColor: '#082f49',
        bordeColor: '#38bdf8',
        fondoGradiente: grad1,
        tituloColor: '#38bdf8',
        radioFoto: 48,
        esPrimero: true
      });
    }

    if (tercero) {
      dibujarTarjetaPodio(ctx, tercero, fotosMap[tercero.id], {
        x: padX + (cardW + gap) * 2,
        y: lateralesY,
        w: cardW,
        h: baseH,
        badgeTexto: '🥉 3º PUESTO',
        badgeBg: '#0369a1',
        badgeTextColor: '#ffffff',
        bordeColor: 'rgba(14, 165, 233, 0.7)',
        fondoGradiente: 'rgba(10, 15, 25, 0.84)',
        tituloColor: '#ffffff',
        radioFoto: 42,
        esPrimero: false
      });
    }

    cursorY += primeroH + 40;
  }

  // 4) Ranking restante aprovechando el alto hasta el pie de página
  const resto = pilotosConPuesto.slice(3);
  const footerReserve = esVertical ? 76 : 64;
  const tablaH = Math.max(180, height - cursorY - footerReserve);

  if (resto.length > 0) {
    if (esVertical) {
      dibujarColumnaRanking(ctx, resto, fotosMap, {
        x: padX,
        y: cursorY,
        w: contentW,
        h: tablaH,
        titulo: 'RANKING COMPLETO DEL SALÓN DE LA FAMA',
        totalLabel: `${pilotosConPuesto.length} PILOTOS`
      });
    } else {
      const mitad = Math.ceil(resto.length / 2);
      const parte1 = resto.slice(0, mitad);
      const parte2 = resto.slice(mitad);
      const colGap = 28;
      const colW = (contentW - colGap) / 2;

      dibujarColumnaRanking(ctx, parte1, fotosMap, {
        x: padX,
        y: cursorY,
        w: colW,
        h: tablaH,
        titulo: 'RANKING COMPLETO • PARTE 1',
        totalLabel: `${pilotosConPuesto.length} PILOTOS`
      });

      if (parte2.length > 0) {
        dibujarColumnaRanking(ctx, parte2, fotosMap, {
          x: padX + colW + colGap,
          y: cursorY,
          w: colW,
          h: tablaH,
          titulo: 'RANKING COMPLETO • PARTE 2',
          totalLabel: `${pilotosConPuesto.length} PILOTOS`
        });
      }
    }
  }

  // Pie de página centrado abajo
  ctx.fillStyle = 'rgba(226, 232, 240, 0.82)';
  ctx.font = '700 18px "Barlow Condensed", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ESPÍNDOLA COMPETICIÓN • SALÓN DE LA FAMA OFICIAL', width / 2, height - 28);

  const link = document.createElement('a');
  link.download = esVertical
    ? 'salon-de-la-fama-espindola-9x16.png'
    : 'salon-de-la-fama-espindola-16x9.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}