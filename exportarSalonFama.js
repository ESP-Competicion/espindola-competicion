function cargarImagen(src) {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function dibujarRectanguloRedondeado(ctx, x, y, w, h, r) {
  const radio = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radio, y);
  ctx.arcTo(x + w, y, x + w, y + h, radio);
  ctx.arcTo(x + w, y + h, x, y + h, radio);
  ctx.arcTo(x, y + h, x, y, radio);
  ctx.arcTo(x, y, x + w, y, radio);
  ctx.closePath();
}

function dibujarAvatarCircular(ctx, img, cx, cy, radio, bordeColor, inicial = 'E') {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radio, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = '#0f172a';
  ctx.fill();
  ctx.clip();

  if (img && img.width > 0 && img.height > 0) {
    const escala = Math.max((radio * 2) / img.width, (radio * 2) / img.height);
    const dw = img.width * escala;
    const dh = img.height * escala;
    ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
  } else {
    ctx.fillStyle = '#38bdf8';
    ctx.font = `900 ${Math.round(radio * 0.9)}px "Barlow Condensed", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(inicial, cx, cy + 2);
  }
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radio, 0, Math.PI * 2);
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = bordeColor;
  ctx.stroke();
  ctx.restore();
}

function dibujarFilaRanking(ctx, piloto, puestoNum, imgPiloto, x, y, w, h, compacta = false) {
  ctx.fillStyle = '#38bdf8';
  ctx.font = `900 ${compacta ? 18 : 20}px "Barlow Condensed", sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`#${puestoNum}`, x + 14, y + h / 2 + 1);

  const radioAvatar = compacta ? 13 : 15;
  dibujarAvatarCircular(
    ctx,
    imgPiloto,
    x + (compacta ? 54 : 62),
    y + h / 2,
    radioAvatar,
    'rgba(255,255,255,0.25)',
    (piloto.nombre || 'E').charAt(0).toUpperCase()
  );

  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${compacta ? 19 : 21}px "Barlow Condensed", sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const maxNombreW = w - (compacta ? 185 : 225);
  ctx.fillText(
    String(piloto.nombre || '').toUpperCase(),
    x + (compacta ? 78 : 88),
    y + h / 2 + 1,
    maxNombreW
  );

  ctx.fillStyle = '#7dd3fc';
  ctx.font = `900 ${compacta ? 17 : 19}px monospace`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${piloto.campeonatos || 0} 🏆`, x + w - 14, y + h / 2 + 1);
}

export async function descargarImagenSalonFama({
  hallFama = [],
  totalTitulos = 0,
  obtenerFoto,
  formato = '16:9' // '16:9' (1920x1080) o '9:16' (1080x1920)
}) {
  const esVertical = formato === '9:16';
  const width = esVertical ? 1080 : 1920;
  const height = esVertical ? 1920 : 1080;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Cargar fondo, logo y fotos de todos los pilotos (hasta 15 o los que haya)
  const pilotosAProcesar = hallFama.slice(0, 15);
  const [imgFondo, imgLogo, ...fotosPilotos] = await Promise.all([
    cargarImagen('/FondoTaller.png'),
    cargarImagen('/logo.svg'),
    ...pilotosAProcesar.map((p) => cargarImagen(obtenerFoto ? obtenerFoto(p) : p.foto))
  ]);

  const mapaFotos = new Map();
  pilotosAProcesar.forEach((p, i) => {
    mapaFotos.set(p.id ?? i, fotosPilotos[i]);
  });

  // 1. Fondo con cover + degradado oscuro idéntico a la web
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, width, height);

  if (imgFondo && imgFondo.width > 0) {
    const escala = Math.max(width / imgFondo.width, height / imgFondo.height);
    const dw = imgFondo.width * escala;
    const dh = imgFondo.height * escala;
    ctx.save();
    ctx.globalAlpha = 0.72;
    ctx.drawImage(imgFondo, (width - dw) / 2, (height - dh) / 2, dw, dh);
    ctx.restore();
  }

  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.74)');
  grad.addColorStop(0.45, 'rgba(0, 0, 0, 0.36)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  const padX = esVertical ? 52 : 80;
  const padY = esVertical ? 44 : 34;

  // 2. Cabecera: Logo + Badge total títulos
  if (imgLogo && imgLogo.width > 0) {
    const logoH = esVertical ? 46 : 42;
    const logoW = (imgLogo.width / imgLogo.height) * logoH;
    ctx.drawImage(imgLogo, padX, padY, logoW, logoH);
  }

  const badgeW = esVertical ? 300 : 320;
  const badgeH = esVertical ? 68 : 62;
  const badgeX = width - padX - badgeW;
  const badgeY = padY - 4;

  dibujarRectanguloRedondeado(ctx, badgeX, badgeY, badgeW, badgeH, 14);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
  ctx.stroke();

  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#9ca3af';
  ctx.font = '800 16px "Barlow Condensed", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('CAMPEONATOS EN TOTAL', badgeX + 18, badgeY + 24);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '900 28px "Barlow Condensed", sans-serif';
  ctx.fillText(`🏆 ${totalTitulos} TÍTULOS`, badgeX + 18, badgeY + 52);

  // Título principal
  const tituloY = esVertical ? padY + 102 : padY + 86;
  ctx.fillStyle = '#38bdf8';
  ctx.font = `900 ${esVertical ? 48 : 46}px "Barlow Condensed", sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('SALÓN DE LA FAMA - PODIO DE CAMPEONES', padX, tituloY);

  ctx.fillStyle = '#e5e7eb';
  ctx.font = `700 ${esVertical ? 20 : 19}px "Barlow Condensed", sans-serif`;
  ctx.fillText(
    'LOS PILOTOS CON MÁS TÍTULOS OFICIALES EN LA HISTORIA DE ESPÍNDOLA COMPETICIÓN',
    padX,
    tituloY + (esVertical ? 28 : 26)
  );

  // 3. Podio (2º izquierda, 1º centro elevado, 3º derecha)
  const podioTop = esVertical ? tituloY + 76 : tituloY + 56;
  const gapPodio = esVertical ? 18 : 26;
  const cardW = (width - padX * 2 - gapPodio * 2) / 3;
  const cardH = esVertical ? 275 : 235;

  const puestosPodio = [
    { idx: 1, puestoLabel: '🥈 2º PUESTO', pillBg: '#e5e7eb', pillTxt: '#020617', border: 'rgba(163,163,163,0.65)', offsetY: 16, destacado: false },
    { idx: 0, puestoLabel: '🥇 1º PUESTO', pillBg: '#38bdf8', pillTxt: '#020617', border: '#38bdf8', offsetY: 0, destacado: true },
    { idx: 2, puestoLabel: '🥉 3º PUESTO', pillBg: '#0369a1', pillTxt: '#ffffff', border: 'rgba(14,165,233,0.7)', offsetY: 16, destacado: false }
  ];

  puestosPodio.forEach((cfg, colIdx) => {
    const piloto = hallFama[cfg.idx];
    if (!piloto) return;

    const cxCard = padX + colIdx * (cardW + gapPodio);
    const cyCard = podioTop + cfg.offsetY;
    const hActual = cfg.destacado ? cardH + 16 : cardH;

    dibujarRectanguloRedondeado(ctx, cxCard, cyCard, cardW, hActual, 18);
    if (cfg.destacado) {
      const cardGrad = ctx.createLinearGradient(cxCard, cyCard, cxCard, cyCard + hActual);
      cardGrad.addColorStop(0, 'rgba(56, 189, 248, 0.28)');
      cardGrad.addColorStop(0.55, 'rgba(5, 5, 5, 0.86)');
      cardGrad.addColorStop(1, 'rgba(5, 5, 5, 0.92)');
      ctx.fillStyle = cardGrad;
    } else {
      ctx.fillStyle = 'rgba(5, 5, 5, 0.78)';
    }
    ctx.fill();
    ctx.lineWidth = cfg.destacado ? 3 : 2;
    ctx.strokeStyle = cfg.border;
    ctx.stroke();

    const pillW = esVertical ? 148 : 165;
    const pillH = 30;
    const pillX = cxCard + (cardW - pillW) / 2;
    const pillY = cyCard - pillH / 2;

    dibujarRectanguloRedondeado(ctx, pillX, pillY, pillW, pillH, 999);
    ctx.fillStyle = cfg.pillBg;
    ctx.fill();

    ctx.fillStyle = cfg.pillTxt;
    ctx.font = '900 16px "Barlow Condensed", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cfg.puestoLabel, pillX + pillW / 2, pillY + pillH / 2 + 1);

    const radioAvatar = cfg.destacado ? (esVertical ? 48 : 44) : (esVertical ? 42 : 38);
    const avatarY = cyCard + (esVertical ? 76 : 66);
    const imgPiloto = mapaFotos.get(piloto.id ?? cfg.idx);
    dibujarAvatarCircular(
      ctx,
      imgPiloto,
      cxCard + cardW / 2,
      avatarY,
      radioAvatar,
      cfg.border,
      (piloto.nombre || 'E').charAt(0).toUpperCase()
    );

    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = cfg.destacado ? '#38bdf8' : '#ffffff';
    ctx.font = `900 ${cfg.destacado ? (esVertical ? 28 : 29) : (esVertical ? 24 : 25)}px "Barlow Condensed", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(
      String(piloto.nombre || '').toUpperCase(),
      cxCard + cardW / 2,
      avatarY + radioAvatar + (esVertical ? 32 : 28),
      cardW - 22
    );

    ctx.fillStyle = '#d4d4d8';
    ctx.font = '800 16px "Barlow Condensed", sans-serif';
    ctx.fillText(
      String(piloto.nacionalidad || 'ARGENTINA').toUpperCase(),
      cxCard + cardW / 2,
      avatarY + radioAvatar + (esVertical ? 54 : 48),
      cardW - 22
    );

    const boxW = cardW - (esVertical ? 28 : 54);
    const boxH = 38;
    const boxX = cxCard + (cardW - boxW) / 2;
    const boxY = cyCard + hActual - boxH - 16;

    dibujarRectanguloRedondeado(ctx, boxX, boxY, boxW, boxH, 10);
    ctx.fillStyle = cfg.destacado ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.06)';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = cfg.destacado ? 'rgba(56, 189, 248, 0.55)' : 'rgba(255, 255, 255, 0.16)';
    ctx.stroke();

    ctx.fillStyle = cfg.destacado ? '#bae6fd' : '#e5e7eb';
    ctx.font = '900 18px "Barlow Condensed", sans-serif';
    ctx.fillText(
      `${cfg.destacado ? 'TÍTULOS ABSOLUTOS' : 'TÍTULOS'}: ${piloto.campeonatos || 0} 🏆`,
      cxCard + cardW / 2,
      boxY + 25
    );
  });

  // 4. Ranking completo (del #4 en adelante, hasta todos los pilotos disponibles)
  const resto = hallFama.slice(3);
  if (resto.length > 0) {
    const tablaTop = podioTop + cardH + (esVertical ? 46 : 36);
    const headerH = 38;
    const tablaAncho = width - padX * 2;

    if (esVertical) {
      // 9:16: 1 columna con todas las filas (hasta 12 filas del #4 al #15)
      const disponibleH = height - tablaTop - 58;
      const rowH = Math.max(42, Math.min(68, Math.floor(disponibleH / resto.length)));
      const tablaH = headerH + resto.length * rowH;

      dibujarRectanguloRedondeado(ctx, padX, tablaTop, tablaAncho, tablaH, 16);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.stroke();

      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#38bdf8';
      ctx.font = '900 18px "Barlow Condensed", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('RANKING COMPLETO DEL SALÓN DE LA FAMA', padX + 20, tablaTop + 25);

      ctx.fillStyle = '#9ca3af';
      ctx.font = '700 16px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${hallFama.length} PILOTOS`, width - padX - 20, tablaTop + 25);

      resto.forEach((piloto, idx) => {
        const yRow = tablaTop + headerH + idx * rowH;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padX, yRow);
        ctx.lineTo(width - padX, yRow);
        ctx.stroke();

        const imgRow = mapaFotos.get(piloto.id ?? idx + 3);
        dibujarFilaRanking(ctx, piloto, idx + 4, imgRow, padX, yRow, tablaAncho, rowH, false);
      });
    } else {
      // 16:9: 2 columnas simétricas para que entren todos los puestos (#4 en adelante) sin amontonarse
      const mitad = Math.ceil(resto.length / 2);
      const colIzq = resto.slice(0, mitad);
      const colDer = resto.slice(mitad);
      const gapCols = 24;
      const colW = (tablaAncho - gapCols) / 2;
      const disponibleH = height - tablaTop - 52;
      const rowH = Math.max(40, Math.min(58, Math.floor((disponibleH - headerH) / Math.max(mitad, 1))));
      const tablaH = headerH + mitad * rowH;

      [colIzq, colDer].forEach((listaCol, cIdx) => {
        const xCol = padX + cIdx * (colW + gapCols);

        dibujarRectanguloRedondeado(ctx, xCol, tablaTop, colW, tablaH, 16);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
        ctx.stroke();

        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#38bdf8';
        ctx.font = '900 17px "Barlow Condensed", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(
          cIdx === 0 ? 'RANKING COMPLETO • PARTE 1' : 'RANKING COMPLETO • PARTE 2',
          xCol + 16,
          tablaTop + 25
        );

        ctx.fillStyle = '#9ca3af';
        ctx.font = '700 15px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${hallFama.length} PILOTOS`, xCol + colW - 16, tablaTop + 25);

        listaCol.forEach((piloto, idx) => {
          const yRow = tablaTop + headerH + idx * rowH;
          const puestoGlobal = cIdx === 0 ? idx + 4 : mitad + idx + 4;
          const indiceOriginal = puestoGlobal - 1;

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(xCol, yRow);
          ctx.lineTo(xCol + colW, yRow);
          ctx.stroke();

          const imgRow = mapaFotos.get(piloto.id ?? indiceOriginal);
          dibujarFilaRanking(ctx, piloto, puestoGlobal, imgRow, xCol, yRow, colW, rowH, true);
        });
      });
    }
  }

  // Pie de placa
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '800 17px "Barlow Condensed", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ESPÍNDOLA COMPETICIÓN • SALÓN DE LA FAMA OFICIAL', width / 2, height - 18);

  // Descargar PNG
  const enlace = document.createElement('a');
  const sufijo = formato === '9:16' ? '9x16' : '16x9';
  enlace.download = `salon-de-la-fama-espindola-${sufijo}.png`;
  enlace.href = canvas.toDataURL('image/png');
  enlace.click();
}