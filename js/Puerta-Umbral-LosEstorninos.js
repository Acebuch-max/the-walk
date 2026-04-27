// === TW / UMBRAL — Los estorninos: Nube CMYK (VISIBLE) + Enjambres 3D errantes + Sonido ===

/* =========================================================
   ARCILLA → MODULACIÓN DEL ENJAMBRE
   apertura / dispersion / retorno
   ========================================================= */

function clamp01(x){
  return Math.max(0, Math.min(1, Number(x) || 0));
}

function getArcillaAxes(){
  const a =
    window.TW?.arcillaJSON ||
    window.TW?.arcillaData ||
    null;

  const fromJSON = {
    apertura: clamp01(a?.umbral?.apertura ?? a?.apertura ?? 0.5),
    dispersion: clamp01(a?.umbral?.dispersion ?? a?.dispersion ?? 0.5),
    retorno: clamp01(a?.umbral?.retorno ?? a?.retorno ?? 0.5)
  };

  const live = window.TW?.arcilla || window.TW?.arcilla4;
  const space = live && typeof live.getSpace === "function" ? live.getSpace() : null;

  if (!space) return fromJSON;

  return {
    apertura: clamp01(space.threshold ?? fromJSON.apertura),
    dispersion: clamp01(space.entropy ?? fromJSON.dispersion),
    retorno: clamp01(space.tension ?? fromJSON.retorno)
  };
}

const ARCILLA_STATE = {
  apertura: 0.5,
  dispersion: 0.5,
  retorno: 0.5
};

function refreshArcillaState(){
  const a = getArcillaAxes();
  ARCILLA_STATE.apertura = a.apertura;
  ARCILLA_STATE.dispersion = a.dispersion;
  ARCILLA_STATE.retorno = a.retorno;
}


(() => {

  /* =========================================================
   ARCILLA → LOS ESTORNINOS
   apertura / dispersion / retorno
   ========================================================= */
  // Reutiliza clamp01() y getArcillaAxes() definidos fuera del IIFE.
  // --- Perfil (perfiles.js) ---
  // Usa ?profile=valente (o ?m=valente) para activar el perfil "José Ángel Valente".
  // Mantiene el mismo mecanismo que Circa Stellas.
  const __TW_Q__ = new URLSearchParams(location.search);
  const __TW_PROFILE_NAME__ = (__TW_Q__.get("profile") || __TW_Q__.get("m") || "auto").toLowerCase();
  // (opcional) expone para depurar
  window.__TW_PROFILE__ = __TW_PROFILE_NAME__;

  // --- Contexto desde Partitura (TW_SCORE_STRUCTURE) ---
  // Permite que el Umbral cambie según I / II / III de forma determinista.
  const __TW_SCORE_RAW__ = sessionStorage.getItem("TW_SCORE_STRUCTURE");
  let __TW_SCORE__ = null;
  if(__TW_SCORE_RAW__){
    try{ __TW_SCORE__ = JSON.parse(__TW_SCORE_RAW__); }catch(e){}
  }
  const __TW_PART__ = String(__TW_SCORE__?.partitura || "").toUpperCase();
  const __TW_VARIANT__ = (__TW_PART__ === "II") ? 2 : (__TW_PART__ === "III" ? 3 : 1);
  window.__TW_VARIANT__ = __TW_VARIANT__;

  function getVariantField(variant){
    if(variant === 2){
      return { cohesion: 0.48, dispersion: 0.88, retorno: 0.32 };
    }
    if(variant === 3){
      return { cohesion: 0.62, dispersion: 0.58, retorno: 0.84 };
    }
    return { cohesion: 0.86, dispersion: 0.36, retorno: 0.58 };
  }

  const VARIANT_FIELD = getVariantField(__TW_VARIANT__);

  const poemId = "LosEstorninos";
  const poemText = 
  
  `Todos la andan buscando
Todos la andan sufriendo.
Aunque su dureza
Aunque su crueldad
Aunque su amor
Aunque su dolor
Su ternura,
No tiene límites
Todos la aman
Todos la veneran
Amor es seguirte
Amor es darte todo lo que se puede poseer.

Pues no habrá opción cuando llegue el frío invierno.

¿Nada ahí fuera?
Nada de momento

Tan solo tal vez enfocar
Poner el ojo a descubrir
Cuál de los relatos se ajustan
Al reto más justo.

Nada, nada que sea
Vivir por nada, para nada.

Cierto es que toda certeza
Es un buen relato 
Que contiene y reza 
Bajo su propio retrato.

La sosprecha es lo que sientes
a veces eso por descubrir
Tan solo tal vez sea una corriente
extraña de blanca frente.

¿Nada ahí fuera?
Nada de momento

Parecer útil es lo que importa
Útil para esta vida corta
Si al final lo cierto es mirar
Lo transitado que es el umbral
Salir o bien entrar.

¿Nada hay ahí fuera?
Nada, nada de momento.

Y me hablaron de un paraíso
poblado de árboles frutales
De ríos de miel y licor.

De cielos azules
De lugares soleados.

De cimas desde las que 
se podía volar.

Sobrevolar
Ascender
Conquistar

De un lago de aguas cristalinas
de frías aguas y de cumbres nevadas.

De un camino que descendía
Hasta un valle poblado
de una humanidad siempre feliz.

Feliz de recoger el fruto de la Tierra
De amar y ser amado
Rezar ante el verdadero Umbral

De no temer a la muerte
Soñar con la vida más plena.

Y me hablaron de un paraíso
que algún día existirá.

Poblado
De miel
De azules y de oro.

Un nuevo reino de los cielos
Reacción nueva dentro de la rueda
Sagaz estratega del latrocinio y la guerra.

Amante del caos, propia gloria
Y muerte a los pobres de la Tierra
Monstruo a todas horas.    

Fanático al fín y al cabo
En la edad del espíritu   
que anunciaba la grandeza del nuevo mundo.
  
Las castas palabras violadas 
Salvador y mesías de su propia mezquindad
Ultrajador de toda inclinación, al bien anónimo.
         
O bien vas vestido de humildad
Yo sabría descubrir cuál es tu naturaleza
Cómo representas tu burla

Este dolor de todo lo diverso,
Arde ver cómo viajas en la sangre
Exquisito uso de retorcidas palabras.
  
Sois los adoradores de los fantasmas
Del insulto y el desprecio
Ostentadores de la ostentación.

Daño colateral
Doscientas niñas muertas
Venía anunciándose en la pantalla del televisor.

Adorador de un Dios ciego, sordo y mudo.

`;


  // ---------------- Utils (determinismo suave) ----------------
  function hash32(str){
    let h = 2166136261 >>> 0;
    for(let i=0;i<str.length;i++){
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function makeRng(seed){
    let s = seed >>> 0;
    return function(){
      s ^= s << 13; s >>>= 0;
      s ^= s >> 17; s >>>= 0;
      s ^= s << 5;  s >>>= 0;
      return (s >>> 0) / 4294967296;
    };
  }
  function randn(rng){
    // Box–Muller
    let u=0,v=0;
    while(u===0) u=rng();
    while(v===0) v=rng();
    return Math.sqrt(-2.0*Math.log(u))*Math.cos(2*Math.PI*v);
  }
  function analyze(text){
    const words = text.toLowerCase().match(/[a-záéíóúüñ]+/gi) || [];
    const total = words.length || 1;
    const aunque = words.filter(w=>w==="aunque").length;
    const repet = aunque / total;
    const ends = /invierno/i.test(text) ? 1 : 0;
    const lines = text.split(/\n+/).map(s=>s.trim()).filter(Boolean).length;
    return { total, aunque, repet, ends, lines };
  }

  const A4 = window.TW?.arcilla4;
  if(A4) A4.ingestPoem(poemText, "js:LosEstorninos");
  const __space = A4 ? A4.getSpace() : null;
  const seed = hash32(poemId + "::" + poemText + "::" + String(__space?.seed ?? 0));
  const rng = makeRng(seed);
  const m = analyze(poemText);

  // ---------------- Config ----------------
  const CFG = {
    pointsBase: 18000,
    clusters: Math.max(10, Math.min(28, Math.round(12 + m.repet*120))),
    breath: 0.14 + m.repet*0.24,
    drift: 0.20 + m.repet*0.35,
    cut: m.ends ? 0.65 : 0.0,

    // Enjambres (centros) errantes (XY)
    swarmSpeed: 0.18 + m.repet*0.20,   // velocidad base
    swarmWander: 0.08 + m.repet*0.10,  // “aceleración” errante
    swarmDamp: 0.99,                  // amortiguación (inercia)
    swarmHome: 0.0018,                  // tirón al hogar
    swarmMargin: 80,                   // contención (px)

    // Profundidad (Z)
    fov: 900,           // “lente”: grande = menos perspectiva
    zMin: -500,         // cerca (negativo = hacia cámara)
    zMax: 500,         // lejos
    swarmWanderZ: 0.06,
    swarmHomeZ: 0.0025
  };

  // --- Aplicación de perfil (austeridad / pliegue) ---
  // No cambia el motor: solo modula parámetros visibles.
  if(__TW_PROFILE_NAME__ === "acebuch"){
    // Menos densidad, menos deriva, más silencio.
    CFG.pointsBase = Math.round(CFG.pointsBase * 0.78);
    CFG.clusters   = Math.max(6, Math.round(CFG.clusters * 0.70));
    CFG.breath     = Math.max(0.04, CFG.breath * 0.82);
    CFG.drift      = Math.max(0.06, CFG.drift * 0.72);

    // Enjambres más contenidos
    CFG.swarmSpeed  *= 0.82;
    CFG.swarmWander *= 0.78;
    CFG.swarmMargin  = Math.max(40, Math.round(CFG.swarmMargin * 0.85));

    // “invierno” más seco (si existe)
    CFG.cut = Math.min(0.75, CFG.cut * 0.92);
  }

  // --- Variante por Partitura (I / II / III) ---
  // I: calma / baja densidad
  // II: tensión / deriva
  // III: expansión / apertura
  if(window.__TW_VARIANT__ === 1){
    CFG.pointsBase = Math.round(CFG.pointsBase * 0.92);
    CFG.clusters   = Math.max(6, Math.round(CFG.clusters * 0.92));
    CFG.drift      = Math.max(0.06, CFG.drift * 0.88);
    CFG.swarmSpeed *= 0.92;
  }else if(window.__TW_VARIANT__ === 2){
    CFG.pointsBase = Math.round(CFG.pointsBase * 1.03);
    CFG.clusters   = Math.max(6, Math.round(CFG.clusters * 1.10));
    CFG.drift      = Math.min(0.65, CFG.drift * 1.18);
    CFG.swarmSpeed *= 1.08;
  }else if(window.__TW_VARIANT__ === 3){
    CFG.pointsBase = Math.round(CFG.pointsBase * 1.10);
    CFG.clusters   = Math.max(6, Math.round(CFG.clusters * 1.02));
    CFG.drift      = Math.min(0.65, CFG.drift * 1.05);
    CFG.swarmSpeed *= 1.18;
    CFG.swarmMargin = Math.round(CFG.swarmMargin * 1.08);
  }


  // --- ARCILLA-4: pliegue del acto (capa lógica sobre LosEstorninos) ---
  if(__space){
    const densMul  = 0.85 + __space.threshold*0.55;     // 0.85..1.40
    const driftMul = 0.80 + __space.entropy*0.60;       // 0.80..1.40
    const calmMul  = 0.75 + __space.determinism*0.55;   // 0.75..1.30

    CFG.pointsBase = Math.round(CFG.pointsBase * densMul);
    CFG.clusters   = Math.max(6, Math.round(CFG.clusters * (0.90 + __space.tension*0.35)));

    // breath/drift del propio poema se pliegan con el espacio global
    CFG.breath = Math.max(0.04, Math.min(0.42, CFG.breath * calmMul));
    CFG.drift  = Math.max(0.06, Math.min(0.65, CFG.drift  * driftMul));

    // enjambre: tensión acelera; determinismo amortigua
    CFG.swarmSpeed = CFG.swarmSpeed * (0.85 + __space.tension*0.55);
    CFG.swarmDamp  = Math.min(0.995, Math.max(0.970, CFG.swarmDamp + (__space.determinism-0.5)*0.01));
  }


  // ---------------- Canvas ----------------
  const canvas = document.createElement("canvas");
  canvas.id = "tw-cloud";
  const ctx = canvas.getContext("2d", { alpha:true });
  document.body.appendChild(canvas);

  function resize(){
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.floor(innerWidth * dpr);
    canvas.height = Math.floor(innerHeight * dpr);
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  window.addEventListener("resize", resize, { passive:true });
  resize();

  // ---------------- Centros (enjambres) ----------------
  function makeCenters(k){
    const centers = [];
    for(let i=0;i<k;i++){
      const x0 = rng()*innerWidth;
      const y0 = rng()*innerHeight;
      const zInit = CFG.zMin + rng()*(CFG.zMax - CFG.zMin);

      centers.push({
        x: x0, y: y0, z: zInit,
        x0, y0, z0: (CFG.zMin + CFG.zMax) * 0.5, // hogar Z (común)
        vx: (rng()-0.5) * CFG.swarmSpeed * 2,
        vy: (rng()-0.5) * CFG.swarmSpeed * 2,
        vz: (rng()-0.5) * CFG.swarmSpeed * 1.2,

        s: 18 + rng()*160,  // “radio” base del cluster
        w: 0.7 + rng()*2.2, // peso para selección

        // fases deterministas para pseudo-ruido
        ax: 0.6 + rng()*2.4,
        ay: 0.6 + rng()*2.4,
        phx: rng()*Math.PI*2,
        phy: rng()*Math.PI*2
      });
    }
    return centers;
  }

  const centersC = makeCenters(CFG.clusters);
  const centersM = makeCenters(Math.round(CFG.clusters*0.92));
  const centersY = makeCenters(Math.round(CFG.clusters*0.82));
  const centersK = makeCenters(Math.round(CFG.clusters*0.62));
  const centersR = makeCenters(Math.round(CFG.clusters*0.78));
  const centersG = makeCenters(Math.round(CFG.clusters*0.74));
  const centersV = makeCenters(Math.round(CFG.clusters*0.70));

  const LAYER_WEIGHTS = {
    c: 0.16,
    m: 0.16,
    y: 0.16,
    r: 0.12,
    g: 0.12,
    v: 0.12,
    k: 0.16
  };

  function updateCenters(centers, now){
    refreshArcillaState();

    const arcApertura   = ARCILLA_STATE.apertura;
    const arcDispersion = ARCILLA_STATE.dispersion;
    const arcRetorno    = ARCILLA_STATE.retorno;

    const w = innerWidth, h = innerHeight;
    const mg = CFG.swarmMargin;

    const homePull = CFG.swarmHome * (0.9 + VARIANT_FIELD.retorno * 0.55) * (0.80 + arcRetorno * 0.95);
    const wanderXY = CFG.swarmWander * (0.72 + VARIANT_FIELD.dispersion * 0.60) * (0.82 + arcDispersion * 0.90);
    const wanderZ  = CFG.swarmWanderZ * (0.76 + VARIANT_FIELD.dispersion * 0.45) * (0.84 + arcDispersion * 0.75);
    const dampXY   = Math.min(0.992, Math.max(0.972,
      CFG.swarmDamp
      - arcDispersion * 0.010
      + arcRetorno * 0.006
      + VARIANT_FIELD.cohesion * 0.004
    ));
    const dampZ = Math.min(0.993, Math.max(0.975, dampXY + 0.003));
    const opennessX = (arcApertura - 0.5) * w * 0.06;
    const opennessY = (arcApertura - 0.5) * h * 0.05;
    const radiusTarget = (18 + Math.abs(opennessX) * 0.10) * (0.92 + arcApertura * 0.16);

    for(const c of centers){
      const nx = Math.sin(now*c.ax + c.phx) + 0.5*Math.sin(now*(c.ax*0.37) + c.phx*1.7);
      const ny = Math.cos(now*c.ay + c.phy) + 0.5*Math.cos(now*(c.ay*0.41) + c.phy*1.4);
      const nz = Math.sin(now*(c.ax*0.83) + c.phx*0.9) + 0.5*Math.cos(now*(c.ay*0.51) + c.phy*1.1);

      const homeX = c.x0 + opennessX * Math.sin(c.phx);
      const homeY = c.y0 + opennessY * Math.cos(c.phy);
      const homeZ = c.z0 + (arcApertura - 0.5) * 140 * Math.sin(c.phx * 0.7);

      c.s = Math.max(12, Math.min(260, c.s * 0.995 + radiusTarget * 0.005));

      c.vx += nx * wanderXY;
      c.vy += ny * wanderXY;
      c.vz += nz * wanderZ;

      c.vx += (homeX - c.x) * homePull;
      c.vy += (homeY - c.y) * homePull;
      c.vz += (homeZ - c.z) * (CFG.swarmHomeZ * (0.78 + arcRetorno * 0.80));

      c.vx *= dampXY;
      c.vy *= dampXY;
      c.vz *= dampZ;

      c.x += c.vx;
      c.y += c.vy;
      c.z += c.vz;

      if(c.x < mg){
        c.x = mg;
        c.vx = Math.abs(c.vx) * (0.42 + arcRetorno * 0.18);
      }else if(c.x > w - mg){
        c.x = w - mg;
        c.vx = -Math.abs(c.vx) * (0.42 + arcRetorno * 0.18);
      }

      if(c.y < mg){
        c.y = mg;
        c.vy = Math.abs(c.vy) * (0.42 + arcRetorno * 0.18);
      }else if(c.y > h - mg){
        c.y = h - mg;
        c.vy = -Math.abs(c.vy) * (0.42 + arcRetorno * 0.18);
      }

      if(c.z < CFG.zMin){
        c.z = CFG.zMin;
        c.vz = Math.abs(c.vz) * 0.60;
      }else if(c.z > CFG.zMax){
        c.z = CFG.zMax;
        c.vz = -Math.abs(c.vz) * 0.60;
      }

      c.w = Math.max(0.35, Math.min(4.4, c.w * 0.995 + (0.7 + VARIANT_FIELD.cohesion * 1.6 + arcRetorno * 0.9) * 0.005));
    }
  }

  function pickCenter(centers){
    let sum = 0;
    for(const c of centers) sum += c.w;
    let t = rng()*sum;
    let cPick = centers[0];
    for(const c of centers){
      t -= c.w;
      if(t<=0){ cPick = c; break; }
    }
    return cPick;
  }

  function project(x, y, z){
    const cx = innerWidth * 0.5;
    const cy = innerHeight * 0.5;
    const scale = CFG.fov / (CFG.fov + z);
    return {
      x: cx + (x - cx) * scale,
      y: cy + (y - cy) * scale,
      s: scale
    };
  }

  function samplePoint(centers){
    const cPick = pickCenter(centers);

    // Punto alrededor del centro (en “espacio” del enjambre)
    const r0 = cPick.s;
    const px = cPick.x + randn(rng)*r0;
    const py = cPick.y + randn(rng)*r0;

    // Proyección perspectiva (Z del centro)
    let p = project(px, py, cPick.z);

    // “invierno”: hueco central (repulsión) — aplicado en 2D
    if(CFG.cut>0){
      const cx = innerWidth*0.5, cy = innerHeight*0.46;
      const dx = p.x - cx, dy = p.y - cy;
      const d = Math.hypot(dx,dy) + 1e-6;
      const repel = CFG.cut * 160 * Math.exp(-(d/220));
      p.x += (dx/d)*repel;
      p.y += (dy/d)*repel;
    }

    return p;
  }

  function drawLayer(centers, rgba, composite, alpha, n){
    ctx.save();
    ctx.globalCompositeOperation = composite;
    ctx.fillStyle = rgba;
    ctx.globalAlpha = alpha;

    const now = performance.now()*0.001;

    for(let i=0;i<n;i++){
      const p = samplePoint(centers);

      // Campo de deriva 2D (sobre la proyección)
      const nx = Math.sin((p.y*0.006) + now*CFG.drift) * 10;
      const ny = Math.cos((p.x*0.006) - now*CFG.drift) * 10;

      // Tamaño con perspectiva (p.s)
      const rr = (0.7 + rng()*2.1) * (0.85 + 0.7*p.s);

      ctx.beginPath();
      ctx.arc(p.x + nx, p.y + ny, rr, 0, Math.PI*2);
      ctx.fill();
    }

    ctx.restore();
  }

  // ---------------- SONIDO (WebAudio) ----------------
  // Por restricciones del navegador: sólo se inicia tras gesto (click/toque/tecla).
  // Tecla "M": mute/unmute.
  let audio = {
    ctx: null,
    master: null,
    filter: null,
    osc: [],
    noise: null,
    enabled: false
  };

  function makeNoiseBuffer(ac, seconds=2){
    const sr = ac.sampleRate;
    const len = Math.floor(sr * seconds);
    const buf = ac.createBuffer(1, len, sr);
    const ch = buf.getChannelData(0);
    let last = 0;
    for(let i=0;i<len;i++){
      const w = (Math.random()*2 - 1);
      last = (last*0.98 + w*0.02); // filtrado simple -> más suave
      ch[i] = last;
    }
    return buf;
  }

  function startAudio(){
    if(audio.enabled) return;

    const AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return;

    const ac = new AC();
    const master = ac.createGain();
    master.gain.value = 0.0001;

    const filter = ac.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 600;
    filter.Q.value = 0.7;

    filter.connect(master);
    master.connect(ac.destination);

    // Acorde “móvil” (CMYK): repetición -> más tensión
    const base = 55 + (m.repet*80);
    const freqs = [ base*2, base*3, base*4, base*1 ];

    const oscs = [];
    for(let i=0;i<4;i++){
      const o = ac.createOscillator();
      o.type = "sine";
      o.frequency.value = freqs[i];

      const g = ac.createGain();
      g.gain.value = 0.0;

      o.connect(g);
      g.connect(filter);
      o.start();

      oscs.push({ o, g, f: freqs[i] });
    }

    // Ruido ambiental bajísimo
    const noiseSrc = ac.createBufferSource();
    noiseSrc.buffer = makeNoiseBuffer(ac, 2.0);
    noiseSrc.loop = true;

    const ng = ac.createGain();
    ng.gain.value = 0.0;

    noiseSrc.connect(ng);
    ng.connect(filter);
    noiseSrc.start();

    audio = { ctx: ac, master, filter, osc: oscs, noise: ng, enabled: true };

    // fade-in
    master.gain.setValueAtTime(0.0001, ac.currentTime);
    master.gain.linearRampToValueAtTime(0.10, ac.currentTime + 1.2);
  }

  function stopAudio(){
    if(!audio.enabled) return;
    const ac = audio.ctx;
    try{
      audio.master.gain.cancelScheduledValues(ac.currentTime);
      audio.master.gain.setValueAtTime(audio.master.gain.value, ac.currentTime);
      audio.master.gain.linearRampToValueAtTime(0.00001, ac.currentTime + 0.6);
      setTimeout(() => {
        try{ audio.ctx.close(); }catch(e){}
        audio.enabled = false;
      }, 700);
    }catch(e){
      try{ audio.ctx.close(); }catch(_){}
      audio.enabled = false;
    }
  }

  function toggleAudio(){
    if(audio.enabled) stopAudio();
    else startAudio();
  }

  // Activa audio por primera interacción
  const kickAudioOnce = () => {
    startAudio();
    window.removeEventListener("pointerdown", kickAudioOnce);
    window.removeEventListener("keydown", kickAudioOnce);
    window.removeEventListener("touchstart", kickAudioOnce);
  };
  window.addEventListener("pointerdown", kickAudioOnce, { passive:true });
  window.addEventListener("touchstart", kickAudioOnce, { passive:true });
  window.addEventListener("keydown", kickAudioOnce);

  // Toggle con "M"
  window.addEventListener("keydown", (e) => {
    if((e.key || "").toLowerCase() === "m") toggleAudio();
  });

  // ---------------- Loop ----------------
  const t0 = performance.now();
  function frame(){
    ctx.clearRect(0,0,innerWidth,innerHeight);

    const now = performance.now()*0.001;

    // mover enjambres (3D)
    updateCenters(centersC, now);
    updateCenters(centersM, now*0.97);
    updateCenters(centersY, now*1.03);
    updateCenters(centersK, now*0.92);
    updateCenters(centersR, now*1.01);
    updateCenters(centersG, now*0.95);
    updateCenters(centersV, now*1.07);

    const breathe = 0.5 + 0.5*Math.sin((performance.now()-t0)*0.00049*(1+CFG.breath));
    const N = Math.round(CFG.pointsBase * (0.80 + 0.75*breathe));

    // CMY + RGBV equilibrados
    drawLayer(centersC, "rgba(0,255,255,1)", "lighter", 0.30, Math.round(N * LAYER_WEIGHTS.c));
    drawLayer(centersM, "rgba(255,0,255,1)", "lighter", 0.30, Math.round(N * LAYER_WEIGHTS.m));
    drawLayer(centersY, "rgba(255,255,0,1)", "lighter", 0.30, Math.round(N * LAYER_WEIGHTS.y));

    drawLayer(centersR, "rgba(255,0,0,1)", "lighter", 0.28, Math.round(N * LAYER_WEIGHTS.r));
    drawLayer(centersG, "rgba(0,255,0,1)", "lighter", 0.28, Math.round(N * LAYER_WEIGHTS.g));
    drawLayer(centersV, "rgba(148,0,211,1)", "lighter", 0.28, Math.round(N * LAYER_WEIGHTS.v));

    // K: peso (sombras)
    drawLayer(centersK, "rgba(0,0,0,1)", "multiply", 0.14, Math.round(N * LAYER_WEIGHTS.k));

    // Modulación sonora
    if(audio.enabled && audio.ctx){
      const ac = audio.ctx;
      const t = ac.currentTime;

      // volumen general: respira con breathe
      const targetGain = 0.03 + 0.06*breathe;
      audio.master.gain.setTargetAtTime(targetGain, t, 0.08);

      // filtro: abre/cierra con breath y drift
      const targetCut = 300 + 1400*(0.35 + 0.65*breathe) * (0.75 + CFG.drift);
      audio.filter.frequency.setTargetAtTime(targetCut, t, 0.09);

      // parciales: micro-derivas
      for(let i=0;i<audio.osc.length;i++){
        const o = audio.osc[i];
        const wob = 1 + 0.006*Math.sin(now*(0.6+i*0.17) + i);
        o.o.frequency.setTargetAtTime(o.f*wob, t, 0.06);

        const layer = (i===0?0.34:i===1?0.28:i===2?0.22:0.20);
        const gTarget = 0.020 + layer*(0.030 + 0.040*breathe);
        o.g.gain.setTargetAtTime(gTarget, t, 0.08);
      }

      // ruido: atmósfera mínima
      audio.noise.gain.setTargetAtTime(0.8 + 1.0*(1-breathe), t, 0.12);
    }
// ---- SISTEMA SONORO ----
const SOUND = (() => {

  let ctx = null;
  let master = null;
  let drone = null;
  let droneGain = null;
  let droneFilter = null;
  let grainGain = null;
  let started = false;
  let lastGrain = 0;

  function ensure(){
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;

    ctx = new AC();

    master = ctx.createGain();
    master.gain.value = 0.08;
    master.connect(ctx.destination);

    drone = ctx.createOscillator();
    drone.type = "triangle";

    droneFilter = ctx.createBiquadFilter();
    droneFilter.type = "lowpass";

    droneGain = ctx.createGain();
    droneGain.gain.value = 0;

    drone.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(master);

    grainGain = ctx.createGain();
    grainGain.gain.value = 0;
    grainGain.connect(master);

    drone.start();

    return true;
  }

  function start(){
    if (!ensure()) return;
    if (started) return;
    started = true;
    if (ctx.state === "suspended") ctx.resume();
  }

  function update({breathe, dispersion, retorno, arcDispersion, arcRetorno}){

    if (!started || !ctx) return;

    const now = ctx.currentTime;

    const baseFreq = 40 + (1-retorno)*28;
    drone.frequency.linearRampToValueAtTime(baseFreq, now+0.1);

    const open = 200 + breathe*450 + arcDispersion*200;
    droneFilter.frequency.linearRampToValueAtTime(open, now+0.1);

    const vol = 0.03 + breathe*0.05;
    droneGain.gain.linearRampToValueAtTime(vol, now+0.1);

  }

  return {start,update};

})();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ---------------- Umbral mínimo (para export / Mapa) ----------------
  const umbral = {
    poemId,
    family: "cloud-cmyk-visible-3d",
    threshold: Math.min(0.95, 0.28 + m.repet*0.95),
    tension:   Math.min(0.95, 0.35 + m.repet*0.90),
    entropy:   Math.min(0.95, 0.58 + (1-m.repet)*0.30),
    relationalDensity: Math.min(1, CFG.clusters/28),
    verbDensity: 0.12,
    trios: 0,
    rests: 0,
    ts: Date.now()
  };
  localStorage.setItem("thewalk.umbral.v1", JSON.stringify(umbral));
})();

window.addEventListener("tw:arcilla:loaded", () => {
  refreshArcillaState();
}, { passive: true });

window.addEventListener("tw:arcilla4:space", () => {
  refreshArcillaState();
}, { passive: true });
