// The Walk — core.js
// Núcleo del dominio (breath + bus + Arcilla-4 Engine)
// Arcilla-4: IA oculta determinista que pliega Partitura → Umbral → Disparo
// POEMA → FUNCIÓN → ESPACIO → POEMA

(() => {

  
  // --- TW namespace ---------------------------------------------------------
  const TW = (window.TW = window.TW || {});
  TW.version = TW.version || "core+arcilla4.v1";

  // Bus mínimo (no dependemos de frameworks)
  TW.emit = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));
  TW.on = (name, fn, opts) => window.addEventListener(name, fn, opts);

  // Utilidades
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const norm = (s) => (s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Hash estable (FNV-1a 32-bit)
  function hash32(str){
    let h = 2166136261 >>> 0;
    for(let i=0;i<str.length;i++){
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  // RNG determinista (Mulberry32)
  function mulberry32(seed){
    let a = seed >>> 0;
    return function(){
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // --- Walk seed: determinismo sobre el indeterminismo del Paseo ------------
  // No usamos tiempo: el “azar” real lo pone Acebuch al elegir por dónde caminar.
  const WALK_KEY = "thewalk.walkseed.v1";
  const WALK_TRACE_KEY = "thewalk.walktrace.v1";

  function loadJSON(key, fallback){
    try{
      const raw = localStorage.getItem(key);
      if(!raw) return fallback;
      return JSON.parse(raw);
    }catch(_){ return fallback; }
  }
  function saveJSON(key, value){
    try{ localStorage.setItem(key, JSON.stringify(value)); }catch(_){}
  }

  function computeWalkSeed(){
    const trace = loadJSON(WALK_TRACE_KEY, []);
    const path = location.pathname.replace(/\/+$/,"") || "/";
    const title = (document.title || "").slice(0,120);

    // si ya estamos en esta página como último paso, no duplicamos
    const last = trace[trace.length - 1];
    const step = { path, title, ts: Date.now() };
    if(!last || last.path !== step.path){
      trace.push(step);
      // mantenemos trazado corto (determinismo, pero sin peso)
      while(trace.length > 64) trace.shift();
      saveJSON(WALK_TRACE_KEY, trace);
    }

    // seed = hash encadenado de trazado (orden = acto humano)
    let seed = loadJSON(WALK_KEY, null);
    if(typeof seed !== "number") seed = hash32("thewalk:init");

    // pliegue determinista por visita (solo con path+title)
    seed = hash32(seed + "|" + path + "|" + title);
    saveJSON(WALK_KEY, seed);
    return { seed, trace };
  }

  // --- Arcilla-4 Engine -----------------------------------------------------
  class Arcilla4Engine {
    constructor(){
      const w = computeWalkSeed();
      this.walkSeed = w.seed;
      this.walkTrace = w.trace;

      this.breath = 0.12;
      this.phase = "firme";

      this.poemText = "";
      this.poemVector = null;

      this.partitura = null;      // estructura + decisiones (duraciones, shuffle)
      this.umbralVector = null;    // vector “umbral” global (desde poemas/partituras)

      // Inicialización global de Arcilla
     }

    // RNG por ámbito + estado (camino + poema)
    rng(scope){
      const poemSeed = this.poemVector?.seed ?? 0;
      const s = hash32(String(this.walkSeed) + "|" + String(poemSeed) + "|" + String(scope || "global"));
      return mulberry32(s);
    }

    // POEMA → FUNCIÓN (vector)
    computePoemVector(text){
      const t = norm(text);
      const words = t ? t.split(" ") : [];
      const n = Math.max(1, words.length);

      // métricas sobrias
      const uniq = new Set(words).size || 1;
      const uniqueRatio = uniq / n;

      // densidades (muy básicas, expandibles)
      const punctLike = (text.match(/[.,;:!?¿¡—-]/g) || []).length / Math.max(1, text.length);
      const vowelLike = (text.match(/[aeiouáéíóúü]/gi) || []).length / Math.max(1, text.length);

      // entropía “textural” (no azar): más repetición = menos entropía
      const entropy = clamp01(0.15 + (1 - uniqueRatio) * 0.65 + punctLike * 0.8);

      // tensión: densidad de signos + longitud (normalizada)
      const tension = clamp01(0.20 + punctLike * 1.6 + Math.min(1, text.length / 220) * 0.35);

      // umbral: cuánto “pide forma” el texto (un poco más alto si es muy diverso)
      const threshold = clamp01(0.25 + uniqueRatio * 0.55 + vowelLike * 0.25);

      const seed = hash32("poem|" + t);
      return { seed, threshold, tension, entropy, uniqueRatio, nWords: n };
    }

    // FUNCIÓN → ESPACIO (estado operativo)
    getSpace(){
      const pv = this.poemVector || { threshold:0.33, tension:0.33, entropy:0.66, seed:0 };
      const uv = this.umbralVector || { threshold: pv.threshold, tension: pv.tension, entropy: pv.entropy };

      // pliegue (Arcilla-4 = encuentro: humano-azar (camino) + humano-esquema (IA))
      // Aquí “azar” = trazado humano; IA = forma determinista de plegarlo.
      const walkBias = ((this.walkSeed >>> 0) / 4294967295); // 0..1 (derivado del camino)
      const threshold = clamp01(0.60*uv.threshold + 0.40*pv.threshold);
      const tension   = clamp01(0.55*uv.tension   + 0.45*pv.tension);
      const entropy   = clamp01(0.60*uv.entropy   + 0.40*pv.entropy);
      const determinism = clamp01(1 - entropy*0.85); // 0..1

      return {
        walkBias,
        threshold,
        tension,
        entropy,
        determinism,
        breath: this.breath,
        phase: this.phase,
        seed: hash32(String(this.walkSeed) + "|" + String(pv.seed) + "|" + String(uv.threshold))
      };
    }

    // ESPACIO → POEMA (transformación “sobria”)
    transformPoem(text){
      const s = this.getSpace();
      const t = norm(text);
      const words = t ? t.split(" ") : [];
      if(words.length === 0) return "";

      const R = this.rng("transformPoem");
      const keep = Math.max(5, Math.min(words.length, Math.round(words.length * (0.35 + s.determinism*0.45))));
      // selección determinista (sin “poesía automática” agresiva)
      const picked = [];
      for(let i=0;i<words.length;i++){
        // sesgo por “tensión”: si alta, preferimos palabras más cortas (corte)
        const w = words[i];
        const p = (0.45 + R()*0.55) * (1.0 - s.tension*0.35) + (w.length <= 4 ? s.tension*0.25 : 0);
        if(p > 0.55) picked.push(w);
      }
      while(picked.length < keep){
        picked.push(words[Math.floor(R()*words.length)]);
      }
      const out = picked.slice(0, keep);

      // cortes de línea: más umbral = más estructura
      const lines = [];
      const perLine = Math.max(3, Math.min(8, Math.round(6 - s.threshold*3)));
      for(let i=0;i<out.length;i+=perLine){
        lines.push(out.slice(i, i+perLine).join(" "));
      }
      return lines.join("\n");
    }

    // --- Integraciones de proceso -----------------------------------------
    // Partitura: determiniza elecciones + pliega según espacio
    partituraDurations(kind, baseArr){
      const s = this.getSpace();
      const R = this.rng("partitura:" + kind);
      const a = baseArr.slice();

      // Umbral alto → duraciones más largas (deja aparecer estructura)
      // Tensión alta → más contraste (añadimos un extremo)
      if(s.threshold > 0.62){
        for(let i=0;i<a.length;i++) a[i] = Math.min(16, Math.round(a[i] * (1.1 + s.threshold*0.35)));
      }
      if(s.tension > 0.62 && a.length){
        const max = Math.max(...a);
        const min = Math.min(...a);
        if(R() > 0.5) a.push(Math.min(16, max + 2));
        else a.push(Math.max(1, min - 1));
      }
      // Entropía alta → añadimos un valor intermedio (textura)
      if(s.entropy > 0.65 && a.length){
        const mid = Math.round((Math.min(...a) + Math.max(...a)) / 2);
        if(!a.includes(mid)) a.push(mid);
      }
      // normaliza y ordena para que pick sea estable
      return Array.from(new Set(a)).sort((x,y)=>x-y);
    }

    // Umbral: Arcilla-4 decide cómo plegar literal+modo sin traicionar al humano
    patchUmbralInput(literal, mode){
      const s = this.getSpace();
      const R = this.rng("umbral:input");

      // modo: si determinismo alto → “valente” (corte); si bajo → “circa” (arco)
      let m = mode;
      if(s.determinism > 0.62 && R() > 0.35) m = "valente";
      if(s.entropy > 0.70 && R() > 0.35) m = "circa";

      // literal: micro-pliegue (no reescritura total)
      // si tensión alta: comprimimos (quitamos repeticiones y espacios)
      const lit = String(literal || "").trim();
      if(!lit) return { literal: lit, mode: m };

      const transformed = (s.tension > 0.68)
        ? lit.replace(/\s+/g, " ").replace(/([,;:])\s+/g, "$1 ")
        : lit;

      return { literal: transformed, mode: m };
    }

    patchUmbralParams({ metrics, seed, params, mode, literal }){
      const s = this.getSpace();
      const p = { ...params };

      // Arcilla-4 pliega geometría:
      // - más umbral ⇒ más espesor + más arco (thetaSpan)
      // - más tensión ⇒ menos curvatura (corte) + origen más estable
      p.thickness = clamp01(p.thickness * (0.85 + s.threshold*0.55));
      p.thetaSpan = p.thetaSpan * (0.85 + s.threshold*0.35);
      p.curvature = p.curvature * (0.75 + (1 - s.tension)*0.55);

      // drift = respiración global: breath + entropía
      p.drift = clamp01(p.drift * (0.70 + s.breath*0.65 + s.entropy*0.25));

      // origen: determinismo alto = más centrado; entropía alta = más errante
      const R = this.rng("umbral:origin");
      const centerPull = (s.determinism - 0.5) * 0.06; // -..+
      p.ox = clamp01(p.ox + centerPull + (R()-0.5) * (0.04 + s.entropy*0.06));
      p.oy = clamp01(p.oy + centerPull + (R()-0.5) * (0.04 + s.entropy*0.06));

      // nodos: más estructura (umbral alto) ⇒ más nodos, pero si tensión alta ⇒ recorta
      const nodes = Math.max(1, Math.min(7, Math.round(p.nodes + s.threshold*2 - s.tension*1)));
      p.nodes = nodes;

      // audio: umbral alto = base más grave (ancla), entropía alta = wobble
      p.audio = {
        base: Math.max(55, Math.round(p.audio.base * (0.92 + (1 - s.threshold)*0.18))),
        wobble: clamp01(p.audio.wobble * (0.70 + s.entropy*0.55))
      };

      return p;
    }

    // Disparo: pliegue de la “cinemática” en función del espacio
    getDisparoConfig(){
      const s = this.getSpace();
      const R = this.rng("disparo");

      const holdSeconds  = Math.round(6 + s.threshold*6);          // 6..12
      const totalSeconds = Math.round(24 + s.tension*14);          // 24..38
      const speed        = 1.4 + s.tension*1.8 + (R()-0.5)*0.25;   // ~1.4..3.4
      const twist        = 0.9 + (1 - s.entropy)*1.4;              // ~0.9..2.3

      // muestreo: determinismo alto permite más detalle (sin colapsar)
      const sample = (s.determinism > 0.62) ? 360 : 300;

      return { holdSeconds, totalSeconds, speed, twist, sample };
    }

    // Entradas desde otros módulos
    setBreath({ breath, phase }){
      this.breath = clamp01(breath);
      this.phase = phase || "firme";
      TW.emit("tw:arcilla4:space", this.getSpace());
    }

    ingestPoem(text, source="dom"){
      const t = String(text || "").trim();
      if(t){
        this.poemText = t;
        this.poemVector = this.computePoemVector(t);
        TW.emit("tw:arcilla4:poem", { source, vector: this.poemVector });
        TW.emit("tw:arcilla4:space", this.getSpace());
      }
    }

    setUmbralVector(v){
      if(!v) return;
      this.umbralVector = {
        threshold: clamp01(v.threshold ?? v.umbral ?? 0.33),
        tension: clamp01(v.tension ?? 0.33),
        entropy: clamp01(v.entropy ?? 0.66),
        poemId: v.poemId || "Unknown"
      };
      TW.emit("tw:arcilla4:space", this.getSpace());
    }
  }

  // instancia global
  // API de RNG global (para scripts antiguos)
  TW.rng = TW.rng || ((scope) => TW.arcilla4.rng(scope));

  // --- Breath engine (existente) ------------------------------------------
  const KEY = "thewalk.breath";
  const KEY_AUTO = "thewalk.breath.auto";
  const KEY_DEBUG = "thewalk.debug";

  const smoothstep = (t) => t * t * (3 - 2 * t);

  const breathState = {
    breath: 0.12,
    auto: true,
    t: 0,
    debug: false,
  };

  function readStorageFloat(k, fallback){
    try{
      const v = localStorage.getItem(k);
      if(v === null) return fallback;
      const n = parseFloat(v);
      return Number.isFinite(n) ? n : fallback;
    }catch(_){ return fallback; }
  }
  function readStorageBool(k, fallback){
    try{
      const v = localStorage.getItem(k);
      if(v === null) return fallback;
      return v === "1";
    }catch(_){ return fallback; }
  }
  function writeStorage(k, v){
    try{ localStorage.setItem(k, v); }catch(_){}
  }

  function ensureBodyClass(){
    const b = document.body;
    if(!b) return;
    if(!b.classList.contains("tw")) b.classList.add("tw");
  }

  function setBreath(b){
    breathState.breath = clamp01(b);
    document.documentElement.style.setProperty("--breath", String(breathState.breath));

    const phase =
      (breathState.breath < 0.35) ? "firme" :
      (breathState.breath < 0.70) ? "blando" :
      "firme2";
    document.body?.setAttribute("data-phase", phase);

    writeStorage(KEY, String(breathState.breath));

    TW.emit("tw:breath", { breath: breathState.breath, phase });

    // Arcilla-4: pliegue inmediato de espacio
    TW.arcilla4.setBreath({ breath: breathState.breath, phase });

    const dbg = document.querySelector(".tw__debug");
    if(dbg) dbg.textContent = `breath ${breathState.breath.toFixed(3)} · ${phase}`;
  }

  function mountDebug(){
    if(!breathState.debug) return;
    document.body?.classList.add("tw-debug");
    if(!document.querySelector(".tw__debug")){
      const d = document.createElement("div");
      d.className = "tw__debug";
      d.textContent = "breath —";
      document.body.appendChild(d);
    }
  }

  function tick(){
    if(breathState.auto){
      breathState.t += 0.0032;
      const wave = (Math.sin(breathState.t) + 1) / 2;
      setBreath(smoothstep(wave));
    }
    requestAnimationFrame(tick);
  }

  function bindKeys(){
    window.addEventListener("keydown", (e) => {
      if(!e.altKey) return;

      if(e.key === "b" || e.key === "B"){
        breathState.auto = !breathState.auto;
        writeStorage(KEY_AUTO, breathState.auto ? "1" : "0");
        e.preventDefault();
        return;
      }
      if(e.key === "ArrowUp"){
        breathState.auto = false;
        writeStorage(KEY_AUTO, "0");
        setBreath(breathState.breath + 0.02);
        e.preventDefault();
        return;
      }
      if(e.key === "ArrowDown"){
        breathState.auto = false;
        writeStorage(KEY_AUTO, "0");
        setBreath(breathState.breath - 0.02);
        e.preventDefault();
        return;
      }
      if(e.key === "d" || e.key === "D"){
        breathState.debug = !breathState.debug;
        writeStorage(KEY_DEBUG, breathState.debug ? "1" : "0");
        if(breathState.debug){
          mountDebug();
          setBreath(breathState.breath);
        }else{
          document.body?.classList.remove("tw-debug");
          document.querySelector(".tw__debug")?.remove();
        }
        e.preventDefault();
      }
    });
  }

  function ingestPoemFromDOM(){
    // Partituras: p.es
    const ps = Array.from(document.querySelectorAll("section.ptolomeo p.es"));
    const t = ps.map(p => p.textContent || "").join(" ").trim();
    if(t) { TW.arcilla4.ingestPoem(t, "dom:ptolomeo"); return; }

    // Umbral: parámetro t=
    const q = new URLSearchParams(location.search);
    const lit = q.get("t");
    if(lit) { TW.arcilla4.ingestPoem(lit, "query:t"); return; }

    // fallback: título (como huella leve)
    const title = document.title || "";
    if(title) TW.arcilla4.ingestPoem(title, "title");
  }

  function init(){
    ensureBodyClass();

    breathState.breath = readStorageFloat(KEY, 0.12);
    breathState.auto = readStorageBool(KEY_AUTO, true);
    breathState.debug = readStorageBool(KEY_DEBUG, false);

    mountDebug();
    setBreath(breathState.breath);

    // Arcilla-4: ingesta inicial
    ingestPoemFromDOM();

    bindKeys();
    tick();
  }

  // Recibe vectores desde módulos (Umbral-core)
  TW.on("tw:umbral-vector", (e) => TW.arcilla4.setUmbralVector(e.detail), { passive:true });
  // Partitura (estructura del acto)
  TW.on("tw:partitura", (e) => { TW.arcilla4.partitura = e.detail || null; TW.emit("tw:arcilla4:space", TW.arcilla4.getSpace()); }, { passive:true });

  
  // Inicialización global de Arcilla (instancia única + alias)
  TW.arcilla4 = TW.arcilla4 || new Arcilla4Engine();
  TW.arcilla  = TW.arcilla  || TW.arcilla4;

if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init, { once:true });
  }else{
    init();
  }
})();