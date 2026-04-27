(() => {
  const Q = new URLSearchParams(location.search);
  const imgSrc = Q.get("img") || "graficos/PUERTAS/Sun.jpg";
  const nextHref = Q.get("next") || "Puerta-Umbral-CircaStellas.html";

  // Arcilla-4 (core): pliegue determinista del Disparo
  const A4 = window.TW?.arcilla4;
  const A4CFG = A4 ? A4.getDisparoConfig({ imgSrc, nextHref }) : null;

  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d", { alpha: false });
  const nextLink = document.getElementById("next-link");
  nextLink.href = nextHref;

  // --- TIMELINE (ajustable) ---
  const HOLD_SECONDS = (A4CFG?.holdSeconds ?? 2);      // imagen íntegra
  const TOTAL_SECONDS = (A4CFG?.totalSeconds ?? 32);    // al final ya es oscuridad + link
  const WARP_START = HOLD_SECONDS;
  const WARP_END = TOTAL_SECONDS;

  // --- DENSIDAD DE PÍXELES (performance) ---
  // cuanto menor, más “grano” y más rápido
  const SAMPLE_W = (A4CFG?.sample ?? 320); // muestreo (Arcilla-4 puede ajustar)
  const SAMPLE_H = (A4CFG?.sample ?? 320);

  // --- “túnel” ---
  const Z_NEAR = 0.2;
  const Z_FAR = 6.0;
  const SPEED = (A4CFG?.speed ?? 2.0);     // velocidad z
  const TWIST = (A4CFG?.twist ?? 1.6);     // rotación ligera del túnel

  let W=0, H=0, DPR=1;

  function resize(){
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = Math.floor(window.innerWidth * DPR);
    H = Math.floor(window.innerHeight * DPR);
    canvas.width = W;
    canvas.height = H;
  }
  window.addEventListener("resize", resize, { passive:true });
  resize();

  // --------- CARGA IMAGEN ----------
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = imgSrc;

  // Partículas: x,y,z,color
  let pts = [];
  let startT = 0;
  let ready = false;

  function makeParticlesFromImage(){
    // renderizamos la imagen en un canvas pequeño para leer píxeles
    const oc = document.createElement("canvas");
    oc.width = SAMPLE_W;
    oc.height = SAMPLE_H;
    const octx = oc.getContext("2d");

    // encajar imagen “cover” en el canvas de muestreo
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const s = Math.max(SAMPLE_W/iw, SAMPLE_H/ih);
    const dw = iw*s, dh = ih*s;
    const dx = (SAMPLE_W - dw)/2;
    const dy = (SAMPLE_H - dh)/2;

    octx.fillStyle = "#000";
    octx.fillRect(0,0,SAMPLE_W,SAMPLE_H);
    octx.drawImage(img, dx, dy, dw, dh);

    const data = octx.getImageData(0,0,SAMPLE_W,SAMPLE_H).data;

    // generamos puntos a partir de píxeles (saltamos algunos para rendimiento)
    pts = [];
    const step = 2; // 1 = máximo detalle, 2 o 3 = más rápido
    for(let y=0; y<SAMPLE_H; y+=step){
      for(let x=0; x<SAMPLE_W; x+=step){
        const i = (y*SAMPLE_W + x) * 4;
        const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
        if(a < 10) continue;

        // coordenadas normalizadas -1..1
        const nx = (x / (SAMPLE_W-1)) * 2 - 1;
        const ny = (y / (SAMPLE_H-1)) * 2 - 1;

        // z inicial aleatoria entre cerca/lejos (túnel)
        const z = Z_NEAR + Math.random()*(Z_FAR - Z_NEAR);

        pts.push({
          x: nx,
          y: ny,
          z,
          r, g, b,
          // “masa” para estrellas/estelas
          w: 0.7 + Math.random()*1.3
        });
      }
    }

    ready = true;
    startT = performance.now();
    requestAnimationFrame(frame);
  }

  img.onload = makeParticlesFromImage;
  img.onerror = () => {
    // fallback: si no carga imagen, generamos ruido
    pts = Array.from({length: 18000}, () => ({
      x: (Math.random()*2-1),
      y: (Math.random()*2-1),
      z: Z_NEAR + Math.random()*(Z_FAR-Z_NEAR),
      r: 200 + Math.random()*55,
      g: 200 + Math.random()*55,
      b: 200 + Math.random()*55,
      w: 0.7 + Math.random()*1.3
    }));
    ready = true;
    startT = performance.now();
    requestAnimationFrame(frame);
  };

  // --------- DIBUJO ----------
  function clear(){
    ctx.fillStyle = "#070909";
    ctx.fillRect(0,0,W,H);
  }

  function drawHoldImage(alpha=1){
    // dibujamos imagen “cover” en el canvas grande durante la fase HOLD
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const s = Math.max(W/iw, H/ih);
    const dw = iw*s, dh = ih*s;
    const dx = (W - dw)/2;
    const dy = (H - dh)/2;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
  }

  function frame(now){
    if(!ready) return;

    const t = (now - startT) / 1000; // seconds
    clear();

    // fase 1: imagen íntegra
    if(t < HOLD_SECONDS){
      drawHoldImage(1);
      requestAnimationFrame(frame);
      return;
    }

    // fase 2: transición a túnel
    const u = Math.min(1, (t - WARP_START) / Math.max(0.001, (WARP_END - WARP_START))); // 0..1

    // al principio aún “asoma” imagen
    const imageGhost = Math.max(0, 0.35 - u*0.35);
    if(imageGhost > 0){
      drawHoldImage(imageGhost);
    }

    // perspectiva y centro
    const cx = W * 0.5;
    const cy = H * 0.5;

    // cantidad de “velocidad luz” (estelas) crece con u
    const streak = 0.2 + u*1.2;

    // dibujamos partículas
    for(let i=0;i<pts.length;i++){
      const p = pts[i];

      // movimiento hacia el observador: z disminuye
      p.z -= (SPEED * (0.55 + u*2.2)) * 0.016; // aproximación frame ~60fps
      if(p.z < Z_NEAR){
        p.z = Z_FAR;
      }

      // leve torsión para sensación de túnel orgánico
      const ang = TWIST * u * (1.0 - p.z/Z_FAR);
      const rx = p.x*Math.cos(ang) - p.y*Math.sin(ang);
      const ry = p.x*Math.sin(ang) + p.y*Math.cos(ang);

      // proyección
      const k = 1 / Math.max(0.001, p.z);
      const x = cx + rx * k * (W * 0.42);
      const y = cy + ry * k * (H * 0.42);

      // tamaño: crece cuando se acerca
      const size = (0.6 + u*1.3) * p.w * k * 2.2 * DPR;

      // estela hacia atrás (de “warp”)
      const dx = (x - cx) * streak * 0.06;
      const dy = (y - cy) * streak * 0.06;

      ctx.fillStyle = `rgb(${p.r|0},${p.g|0},${p.b|0})`;
      ctx.globalAlpha = Math.min(1, 0.10 + u*0.75) * (0.65 + (1 - p.z/Z_FAR)*0.35);

      // “star pixel”
      ctx.fillRect(x, y, size, size);

      // estela (línea)
      if(u > 0.05){
        ctx.globalAlpha *= 0.55;
        ctx.fillRect(x - dx, y - dy, Math.max(1, size*0.6), Math.max(1, size*0.6));
      }
    }

    // fade a oscuridad al final
    if(u > 0.85){
      const f = (u - 0.85) / 0.15;
      ctx.globalAlpha = f;
      ctx.fillStyle = "#070909";
      ctx.fillRect(0,0,W,H);
    }

    ctx.globalAlpha = 1;

    // mostrar link final al terminar
   if(t >= TOTAL_SECONDS){
  ctx.fillStyle = "#070909";
  ctx.globalAlpha = 1;
  ctx.fillRect(0,0,W,H);   // limpia completamente el canvas
  nextLink.classList.add("is-visible");
  return;
}

    requestAnimationFrame(frame);
  }
})();