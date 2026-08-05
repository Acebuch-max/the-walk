(() => {
  const Q = new URLSearchParams(location.search);
  const imgSrc = Q.get("img") || "graficos/arcillas/arcilla_revelada.png";
  const nextHref = Q.get("next") || "Galeria_Virtual/B.html";

  // Arcilla-4 (core): pliegue determinista del Disparo
  const A4 = window.TW?.arcilla4;
  const A4CFG = A4 ? A4.getDisparoConfig({ imgSrc, nextHref }) : null;

  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d", { alpha: false });

  // --- TIMELINE (ajustable) ---
  const HOLD_SECONDS = (A4CFG?.holdSeconds ?? 10);
  const TOTAL_SECONDS = (A4CFG?.totalSeconds ?? 32);
  const WARP_START = HOLD_SECONDS;
  const WARP_END = TOTAL_SECONDS;

  // --- DENSIDAD DE PÍXELES (performance) ---
  const SAMPLE_W = (A4CFG?.sample ?? 320);
  const SAMPLE_H = (A4CFG?.sample ?? 320);

  // --- “túnel” ---
  const Z_NEAR = 0.2;
  const Z_FAR = 6.0;
  const SPEED = (A4CFG?.speed ?? 2.0);
  const TWIST = (A4CFG?.twist ?? 1.6);

  let W=0, H=0, DPR=1;
  let transitionStarted = false;

  function resize(){
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = Math.floor(window.innerWidth * DPR);
    H = Math.floor(window.innerHeight * DPR);
    canvas.width = W;
    canvas.height = H;
  }
  window.addEventListener("resize", resize, { passive:true });
  resize();

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = imgSrc;

  let pts = [];
  let startT = 0;
  let ready = false;

  function makeParticlesFromImage(){
    const oc = document.createElement("canvas");
    oc.width = SAMPLE_W;
    oc.height = SAMPLE_H;
    const octx = oc.getContext("2d");

    const iw = img.naturalWidth, ih = img.naturalHeight;
    const s = Math.max(SAMPLE_W/iw, SAMPLE_H/ih);
    const dw = iw*s, dh = ih*s;
    const dx = (SAMPLE_W - dw)/2;
    const dy = (SAMPLE_H - dh)/2;

    octx.fillStyle = "#000";
    octx.fillRect(0,0,SAMPLE_W,SAMPLE_H);
    octx.drawImage(img, dx, dy, dw, dh);

    const data = octx.getImageData(0,0,SAMPLE_W,SAMPLE_H).data;

    pts = [];
    const step = 2;
    for(let y=0; y<SAMPLE_H; y+=step){
      for(let x=0; x<SAMPLE_W; x+=step){
        const i = (y*SAMPLE_W + x) * 4;
        const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
        if(a < 10) continue;

        const nx = (x / (SAMPLE_W-1)) * 2 - 1;
        const ny = (y / (SAMPLE_H-1)) * 2 - 1;
        const z = Z_NEAR + Math.random()*(Z_FAR - Z_NEAR);

        pts.push({
          x: nx,
          y: ny,
          z,
          r, g, b,
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

  function clear(){
    ctx.fillStyle = "#070909";
    ctx.fillRect(0,0,W,H);
  }

  function drawHoldImage(alpha=1){
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

  // Función para hacer la transición suave a la siguiente URL
  function transitionToNext() {
    if (transitionStarted) return;
    transitionStarted = true;

    // Crear un overlay de fade-out
    let fadeProgress = 0;
    const fadeDuration = 800; // ms
    const fadeStart = performance.now();

    function fadeOut(now) {
      const elapsed = now - fadeStart;
      fadeProgress = Math.min(1, elapsed / fadeDuration);

      // Dibujar el frame actual con overlay oscuro progresivo
      ctx.fillStyle = "#070909";
      ctx.globalAlpha = fadeProgress;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;

      if (fadeProgress < 1) {
        requestAnimationFrame(fadeOut);
      } else {
        // Redirigir cuando el fade esté completo
        window.location.href = nextHref;
      }
    }

    // Detener el loop de animación principal y comenzar el fade
    // (seguimos dibujando, pero el fade se superpone)
    // La función frame seguirá ejecutándose, pero ahora el fade se dibuja encima
    // Para evitar conflictos, modificamos frame para que detecte transitionStarted
    // y no haga nada mientras se está haciendo la transición.
    // Pero como estamos en el mismo contexto, podemos simplemente comenzar el fade
    // y permitir que el último frame dibujado sea el que se desvanece.
    // Para asegurarnos, cancelamos el requestAnimationFrame actual y comenzamos el fade.
    // Pero no tenemos el ID del frame actual... lo manejamos con una bandera.
    
    // Reiniciamos el loop con el fade
    // Cancelamos el frame actual (si existe) y comenzamos el fade.
    // Como no tenemos el ID, usamos un enfoque más simple:
    // Sobrescribimos la función frame para que solo dibuje el fade.
    // Pero eso es complicado. Mejor: simplemente comenzamos el fade y
    // la próxima vez que frame se ejecute, detectará transitionStarted y
    // no hará nada.
    // También podemos forzar una redraw con el fade.
    
    // Forzamos un frame de fade inmediato
    requestAnimationFrame(fadeOut);
  }

  function frame(now){
    if(!ready) return;
    
    // Si ya comenzó la transición, no hacemos nada (el fade se encarga)
    if (transitionStarted) return;

    const t = (now - startT) / 1000;
    clear();

    if(t < HOLD_SECONDS){
      drawHoldImage(1);
      requestAnimationFrame(frame);
      return;
    }

    const u = Math.min(1, (t - WARP_START) / Math.max(0.001, (WARP_END - WARP_START)));
    const imageGhost = Math.max(0, 0.35 - u*0.35);
    if(imageGhost > 0){
      drawHoldImage(imageGhost);
    }

    const cx = W * 0.5;
    const cy = H * 0.5;
    const streak = 0.2 + u*1.2;

    for(let i=0;i<pts.length;i++){
      const p = pts[i];
      p.z -= (SPEED * (0.55 + u*2.2)) * 0.016;
      if(p.z < Z_NEAR){
        p.z = Z_FAR;
      }

      const ang = TWIST * u * (1.0 - p.z/Z_FAR);
      const rx = p.x*Math.cos(ang) - p.y*Math.sin(ang);
      const ry = p.x*Math.sin(ang) + p.y*Math.cos(ang);

      const k = 1 / Math.max(0.001, p.z);
      const x = cx + rx * k * (W * 0.42);
      const y = cy + ry * k * (H * 0.42);

      const size = (0.6 + u*1.3) * p.w * k * 2.2 * DPR;
      const dx = (x - cx) * streak * 0.06;
      const dy = (y - cy) * streak * 0.06;

      ctx.fillStyle = `rgb(${p.r|0},${p.g|0},${p.b|0})`;
      ctx.globalAlpha = Math.min(1, 0.10 + u*0.75) * (0.65 + (1 - p.z/Z_FAR)*0.35);

      ctx.fillRect(x, y, size, size);

      if(u > 0.05){
        ctx.globalAlpha *= 0.55;
        ctx.fillRect(x - dx, y - dy, Math.max(1, size*0.6), Math.max(1, size*0.6));
      }
    }

    if(u > 0.85){
      const f = (u - 0.85) / 0.15;
      ctx.globalAlpha = f;
      ctx.fillStyle = "#070909";
      ctx.fillRect(0,0,W,H);
    }

    ctx.globalAlpha = 1;

    // Cuando alcanza el tiempo total, comenzar la transición suave
    if(t >= TOTAL_SECONDS){
      transitionToNext();
      return;
    }

    requestAnimationFrame(frame);
  }
})();