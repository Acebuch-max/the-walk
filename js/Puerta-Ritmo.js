document.addEventListener("DOMContentLoaded", () => {
  const piano = document.querySelector(".piano");
  const allKeys = Array.from(document.querySelectorAll(".key"));
  const chromaKeys = allKeys.filter(k => !k.classList.contains("key--white"));
  const startBtn = document.getElementById("keyStart");
  const stopBtn  = document.getElementById("keyStop");

  // =========================
  // POPUP
  // =========================
  const popup = document.getElementById("ritmoPopup");

  const openPopup = () => {
    if (!popup) return;
    popup.hidden = false;
    document.body.classList.add("is-popup");
  };

  const closePopup = () => {
    if (!popup) return;
    popup.hidden = true;
    document.body.classList.remove("is-popup");
  };

  // =========================
  // 1) COLORES: “piano cromático” real (sin color-mix)
  // =========================
  const A = { r: 0xfd, g: 0x64, b: 0x00 }; // #fd6400
  const B = { r: 0x1f, g: 0x00, b: 0xfd }; // #1f00fd
  const lerp = (a,b,t) => Math.round(a + (b-a)*t);
  const toRGB = (c) => `rgb(${c.r} ${c.g} ${c.b})`;

  function applyMixColor(el, t){
    const c = { r: lerp(A.r,B.r,t), g: lerp(A.g,B.g,t), b: lerp(A.b,B.b,t) };
    el.style.setProperty("--mix", toRGB(c));
  }

  function shuffle(arr){
    for (let i = arr.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function randomizeColors(){
    const N = chromaKeys.length;
    const ts = Array.from({length: N}, (_,i) => (N<=1 ? 0 : i/(N-1)));
    shuffle(ts);
    chromaKeys.forEach((k, idx) => applyMixColor(k, ts[idx]));
  }

  // =========================
  // 2) GAPS ORGÁNICOS (seguro en móvil)
  // =========================
  function setOrganicGaps(){
    if (!piano) return;
    const isMobile = window.matchMedia("(max-width: 700px)").matches;
    const base = isMobile ? 7 : 10;    // px base
    const jitter = isMobile ? 1.5 : 2; // px

    const gx = Math.max(5, base + (Math.random()*2*jitter - jitter)).toFixed(2) + "px";
    const gy = Math.max(5, base + (Math.random()*2*jitter - jitter)).toFixed(2) + "px";

    piano.style.setProperty("--gap-x", gx);
    piano.style.setProperty("--gap-y", gy);
  }

  // =========================
  // 3) TEXTOS MÓVIL: letras apiladas (horizontales)
  // =========================
  const labels = document.querySelectorAll(".key--white .key__label");
  const mqMobile = window.matchMedia("(max-width: 700px)");

  function stackify(){
    const isMobile = mqMobile.matches;

    labels.forEach(el => {
      if (!el.dataset.original) el.dataset.original = el.textContent.trim();

      if (!isMobile){
        el.classList.remove("is-stacked");
        el.innerHTML = "";
        el.textContent = el.dataset.original;
        return;
      }

      const pattern = (el.dataset.stack || el.dataset.original).trim();
      el.classList.add("is-stacked");
      el.innerHTML = "";

      for (const ch of pattern){
        if (ch === "|"){
          const br = document.createElement("span");
          br.className = "stack-break";
          el.appendChild(br);
          continue;
        }
        if (ch === "-"){
          const dash = document.createElement("span");
          dash.className = "stack-dash";
          dash.textContent = "-";
          el.appendChild(dash);
          continue;
        }
        const s = document.createElement("span");
        s.className = "stack-ch";
        s.textContent = ch;
        el.appendChild(s);
      }
    });
  }

  // =========================
  // 4) AUDIO: el .mp3 gobierna el ritmo visual
  // =========================
  const AUDIO = (() => {
    const files = [
      "audio/Sesión Mi-m-Nada ahí fuera-3.mp3",
      "audio/Sesión en Fa-M_1.mp3",
      "audio/Paraíso por descubrir.mp3",
      "audio/IT.mp3",
      "audio/Ella (B).mp3"
    ];

    let index = 0;
    let ctx = null;
    let analyser = null;
    let source = null;
    let data = null;
    let running = false;

    const el = new Audio(files[index]);
    el.loop = false;
    el.preload = "auto";
    el.crossOrigin = "anonymous";

    function ensure() {
      if (ctx) return true;

      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;

      ctx = new AC();
      analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.78;
      data = new Uint8Array(analyser.frequencyBinCount);

      source = ctx.createMediaElementSource(el);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      return true;
    }

    function loadTrack(i) {
      index = i;
      el.src = files[index];
      el.load();
    }

    function getEnergy(fromBin, toBin) {
      if (!analyser || !data) return 0;
      analyser.getByteFrequencyData(data);
      let sum = 0;
      let count = 0;
      const a = Math.max(0, fromBin | 0);
      const b = Math.min(data.length - 1, toBin | 0);
      for (let i = a; i <= b; i++) {
        sum += data[i];
        count++;
      }
      return count ? sum / count : 0;
    }

    function getSnapshot() {
      return {
        low: getEnergy(1, 8),
        mid: getEnergy(9, 28),
        high: getEnergy(29, 80),
        time: el.currentTime || 0,
        duration: el.duration || 0,
        paused: el.paused
      };
    }

    el.addEventListener("ended", () => {
      index++;
      if (index < files.length) {
        loadTrack(index);
        el.play().catch(console.error);
      } else {
        running = false;
      }
    });

    async function start() {
      if (!ensure()) return false;

      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      await el.play();
      running = true;
      return true;
    }

    function stop() {
      el.pause();
      el.currentTime = 0;
      running = false;
    }

    return {

  start,
  stop,

  setVolume(v){
    if(!el) return;
    el.volume = Math.max(0, Math.min(1, v));
  }

};
  })();

  // =========================
  // 5) RITMO ENGINE (single/chord/wave/columns)
  // =========================
  const RITMO = (() => {
    const CFG = {
      includeWhiteKeys: true,

      // "single" | "chord" | "wave" | "columns"
      mode: "wave",

      // fallback sin audio / sensibilidad
      baseTempo: 220,
      tempoJitter: 40,
      tempoMin: 120,
      tempoMax: 520,
      minStepGap: 120,
      maxStepGap: 480,
      beatThreshold: 1.18,
      beatCooldownMs: 140,

      // chord
      chordMin: 2,
      chordMax: 7,

      // wave
      waveRadius: 1,
      waveCountMin: 1,
      waveCountMax: 2,

      // visual
      clearEachTick: true,
      decayMs: 260,

      avoidImmediateRepeat: true
    };

    const gridSize = 9;

    const eligible = () => {
      if (CFG.includeWhiteKeys) return allKeys;
      return allKeys.filter(k => !k.classList.contains("key--white"));
    };

    let running = false;
    let raf = 0;
    let fallbackTimer = 0;
    let lastPick = -1;
    let lastStepAt = 0;
    let lastLow = 0;
    let lastMid = 0;

    const clearBeats = () => allKeys.forEach(k => k.classList.remove("is-beat"));

    const flash = (indices) => {
      indices.forEach(i => {
        const k = allKeys[i];
        if (!k) return;
        k.classList.add("is-beat");
        if (!CFG.clearEachTick){
          setTimeout(() => k.classList.remove("is-beat"), CFG.decayMs);
        }
      });
    };

    const randInt = (a,b) => a + Math.floor(Math.random()*(b-a+1));

    function pickIndexAvoidRepeat(poolLen){
      if (poolLen <= 1) return 0;
      let idx = Math.floor(Math.random()*poolLen);
      if (CFG.avoidImmediateRepeat && idx === lastPick){
        idx = (idx + 1 + Math.floor(Math.random()*(poolLen-1))) % poolLen;
      }
      lastPick = idx;
      return idx;
    }

    function poolToGlobalIndex(pool, poolIndex){
      return allKeys.indexOf(pool[poolIndex]);
    }

    const idxToRC = (idx) => ({ r: Math.floor(idx / gridSize), c: idx % gridSize });
    const rcToIdx = (r,c) => (r*gridSize + c);

    function neighbors(idx, radius = 1){
      const { r, c } = idxToRC(idx);
      const out = [];
      for (let dr=-radius; dr<=radius; dr++){
        for (let dc=-radius; dc<=radius; dc++){
          const rr = r + dr, cc = c + dc;
          if (rr<0 || cc<0 || rr>=gridSize || cc>=gridSize) continue;
          out.push(rcToIdx(rr,cc));
        }
      }
      return out;
    }

    function tick_single(){
      const pool = eligible();
      if (!pool.length) return;
      const p = pickIndexAvoidRepeat(pool.length);
      const g = poolToGlobalIndex(pool, p);
      if (CFG.clearEachTick) clearBeats();
      flash([g]);
    }

    function tick_chord(){
      const pool = eligible();
      if (!pool.length) return;
      const n = randInt(CFG.chordMin, CFG.chordMax);
      const picks = new Set();
      while (picks.size < Math.min(n, pool.length)){
        const p = pickIndexAvoidRepeat(pool.length);
        picks.add(poolToGlobalIndex(pool, p));
      }
      if (CFG.clearEachTick) clearBeats();
      flash([...picks]);
    }

    function tick_wave(){
      const pool = eligible();
      if (!pool.length) return;
      const centersN = randInt(CFG.waveCountMin, CFG.waveCountMax);
      const picks = new Set();

      for (let i=0; i<centersN; i++){
        const p = pickIndexAvoidRepeat(pool.length);
        const center = poolToGlobalIndex(pool, p);
        neighbors(center, CFG.waveRadius).forEach(id => picks.add(id));
      }

      if (CFG.clearEachTick) clearBeats();
      flash([...picks]);
    }

    let colOrder = [];
    let colStep = 0;
    function shuffleCols(arr){
      for (let i=arr.length-1; i>0; i--){
        const j = Math.floor(Math.random()*(i+1));
        [arr[i],arr[j]]=[arr[j],arr[i]];
      }
      return arr;
    }
    function newColOrder(){
      colOrder = shuffleCols([0,1,2,3,4,5,6,7,8]);
      colStep = 0;
    }
    function tick_columns(){
      if (!colOrder.length || colStep >= colOrder.length) newColOrder();
      const col = colOrder[colStep++];

      if (CFG.clearEachTick) clearBeats();
      const indices = [];
      for (let r=0; r<gridSize; r++) indices.push(rcToIdx(r,col));
      flash(indices);
    }

    const tickMap = { single: tick_single, chord: tick_chord, wave: tick_wave, columns: tick_columns };

    function nextTempo(){
      const jitter = randInt(-CFG.tempoJitter, CFG.tempoJitter);
      const t = CFG.baseTempo + jitter;
      return Math.max(CFG.tempoMin, Math.min(CFG.tempoMax, t));
    }

    function step(){
      lastStepAt = performance.now();
      (tickMap[CFG.mode] || tick_single)();
    }

    function fallbackLoop(){
      if (!running) return;
      fallbackTimer = window.setTimeout(() => {
        step();
        fallbackLoop();
      }, nextTempo());
    }

    function audioLoop(now){
      if (!running) return;

      const snap = AUDIO.getSnapshot();
      const low = snap.low;
      const mid = snap.mid;
      const rise = low - lastLow;
      const pulse = low > Math.max(24, lastLow * CFG.beatThreshold) && rise > 3;
      const accent = mid > lastMid + 5;
      const elapsed = now - lastStepAt;
      const dynamicGap = Math.max(
        CFG.minStepGap,
        Math.min(CFG.maxStepGap, 420 - low * 1.25)
      );

      if ((pulse || (accent && elapsed > dynamicGap * 0.75)) && elapsed > CFG.beatCooldownMs) {
        step();
      } else if (elapsed > dynamicGap) {
        step();
      }

      lastLow = low;
      lastMid = mid;
      raf = requestAnimationFrame(audioLoop);
    }

    function start(){
      if (running) return;
      running = true;
      piano?.classList.add("is-playing");
      lastStepAt = performance.now();
      lastLow = 0;
      lastMid = 0;

      if (AUDIO.analyser) {
        step();
        raf = requestAnimationFrame(audioLoop);
      } else {
        fallbackLoop();
      }
    }

    function stop(){
      if (!running) return;
      running = false;
      if (raf) cancelAnimationFrame(raf);
      if (fallbackTimer) clearTimeout(fallbackTimer);
      raf = 0;
      fallbackTimer = 0;
      piano?.classList.remove("is-playing");
      clearBeats();
      colOrder = [];
      colStep = 0;
      lastPick = -1;
    }

    function setMode(mode){ CFG.mode = mode; }
    function setTempo(ms){ CFG.baseTempo = ms; }

    return { CFG, start, stop, step, setMode, setTempo };
  })();

  // =========================
  // 6) BOOT
  // =========================
  randomizeColors();
  setOrganicGaps();
  stackify();

  window.addEventListener("resize", () => {
    setOrganicGaps();
    stackify();
  });
  mqMobile.addEventListener?.("change", stackify);

  // START
  startBtn?.addEventListener("click", async (e) => {
    e.preventDefault();
    closePopup();
    await AUDIO.start();
    RITMO.start();
  });

  // STOP: para + recolorea + gaps + abre popup
  stopBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    AUDIO.stop();
    RITMO.stop();
    randomizeColors();
    setOrganicGaps();
    openPopup();
  });

  // CIERRES POPUP
  popup?.addEventListener("click", (e) => {
    if (e.target.matches("[data-popup-close]")) closePopup();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && popup && !popup.hidden) closePopup();
  });

  // =========================
  // Selector de modos desde popup
  // =========================
  document.querySelectorAll("[data-mode]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const mode = e.currentTarget.dataset.mode;

      if (mode === "audio") {
        // Mantiene el sistema original; el .mp3 ya gobierna todos los modos.
        closePopup();
        return;
      }

      RITMO.setMode(mode);
      closePopup();
    });
  });
});
/* -------------------------------------
   BIBLIOTECA SONORA
------------------------------------- */

const TRACKS = [

{
title:"Nada ahí fuera",
file:"audio/Sesión Mi-m-Nada ahí fuera-3.mp3"
},

{
title:"Ella (B) ",
file:"audio/Ella (B).mp3"
},

{
title:"Paraíso por descubrir",
file:"audio/Paraíso por descubrir.mp3"
},
{
title:"IT",
file:"audio/IT.mp3"
}
];


const modal = document.getElementById("tw-audio-modal");
const abrir = document.getElementById("abrir-audio");
const cerrar = document.getElementById("cerrar-audio");

const lista = document.getElementById("tw-audio-list");
const player = document.getElementById("tw-audio-player");


function construirLista(){

lista.innerHTML="";

TRACKS.forEach(track=>{

const li=document.createElement("li");

const titulo=document.createElement("span");
titulo.textContent=track.title;

const boton=document.createElement("button");
boton.textContent="escuchar";

boton.onclick=()=>{

player.src=track.file;

player.play().catch(()=>{});

};

li.appendChild(titulo);
li.appendChild(boton);

lista.appendChild(li);

});

}

abrir.onclick=()=>{

modal.hidden=false;

/* bajar volumen del sistema */

if(window.AUDIO && AUDIO.setVolume){
AUDIO.setVolume(0.15);
}

};


cerrar.onclick=()=>{

modal.hidden=true;

if(window.AUDIO && AUDIO.setVolume){
AUDIO.setVolume(1);
}

};


modal.onclick=(e)=>{

if(e.target===modal){

modal.hidden=true;

}

};


construirLista();