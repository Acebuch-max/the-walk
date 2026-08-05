// js/mosaico-teselado.js
const MOSAICO = (function() {
  function detectarRatio() {
    const ancho = window.innerWidth;
    const alto = window.innerHeight;
    return ancho >= alto ? '16:9' : '9:16';
  }

  function generar(datosPalabras, contenedorId, config) {
    const contenedor = document.getElementById(contenedorId);
    if (!contenedor) return;

    contenedor.innerHTML = '';

    const canvas = document.createElement('canvas');
    contenedor.appendChild(canvas);

    const ratio = detectarRatio();
    const esEscritorio = ratio === '16:9';
    const ancho = esEscritorio ? 1280 : 720;
    const alto = esEscritorio ? 720 : 1280;

    canvas.width = ancho;
    canvas.height = alto;
    const ctx = canvas.getContext('2d');

    const padding = config.padding || 20;
    const colorFondo = config.colorFondo || '#0a0a0a';

    const total = datosPalabras.length;
    if (total === 0) {
      ctx.fillStyle = colorFondo;
      ctx.fillRect(0, 0, ancho, alto);
      return;
    }

    const columnas = Math.ceil(Math.sqrt(total));
    const filas = Math.ceil(total / columnas);

    const areaX = ancho - 2 * padding;
    const areaY = alto - 2 * padding;
    const celdaAncho = areaX / columnas;
    const celdaAlto = areaY / filas;

    ctx.fillStyle = colorFondo;
    ctx.fillRect(0, 0, ancho, alto);

    datosPalabras.forEach((dato, idx) => {
      const fila = Math.floor(idx / columnas);
      const columna = idx % columnas;

      const x = padding + columna * celdaAncho;
      const y = padding + fila * celdaAlto;
      const w = celdaAncho;
      const h = celdaAlto;

      // ==============================================================
      // CORRECCIÓN: FORZAR BLANCO SI EL GRIS ES 1.0 (REST)
      // ==============================================================
      let r, g, b;
      const { color, gris } = dato;

      // Si es un silencio (gris === 1.0) o viene marcado como REST, pintamos de blanco puro
      if (gris === 1.0 || dato.palabra === 'REST') {
        r = 255;
        g = 255;
        b = 255;
      } else {
        // Lógica normal de mezcla para el resto de palabras
        const factorGris = gris || 0.5;
        r = Math.round(color.r * factorGris + (1 - factorGris) * 50);
        g = Math.round(color.g * factorGris + (1 - factorGris) * 50);
        b = Math.round(color.b * factorGris + (1 - factorGris) * 50);
      }

      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, y, w, h);

      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);
    });

    canvas.style.width = '100%';
    canvas.style.height = 'auto';
  }

  return {
    generar,
    detectarRatio
  };
})();