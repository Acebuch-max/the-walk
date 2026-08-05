(() => {
  // ==========================
  // CONFIG PARTITURAS (tu tabla)
  // ==========================
  const PARTITURAS = {
    "estorninos": [
      { label: "Partitura I",   href: "Partitura-I-CircaStellas.html"   },
      { label: "Partitura II",  href: "Partitura-II-CircaStellas.html"  },
      { label: "Partitura III", href: "Partitura-III-CircaStellas.html" }
    ],
    "Oraculo": [{ label: "I Ching", href: "IChing.html" }]
,   "EllaB": [ 
     { label: "EllaB", href: "Partitura-I-LosEstorninos.html" },
     { label: "EllaB", href: "Partitura-II-LosEstorninos.html" },
     { label: "EllaB", href: "Partitura-III-LosEstorninos.html" },
    
    
    ],

    "poema-3": [],
    "poema-5": [],
    "poema-6": []
  };

  const NS = "http://www.w3.org/2000/svg";

  const poemas = Array.from(document.querySelectorAll(".poema[data-poem]"));
  const row = document.getElementById("partiturasRow");
  const hint = document.getElementById("partiturasHint");
  const frame = document.querySelector(".mapa__frame");
  const partiturasAnchor = document.getElementById("partituras");

  if (!frame || !row || !hint) return;

  // ==========================
  // SVG Topología (persistente) con dos capas:
  // - ghostGroup: estela temporal
  // - mainGroup : topología viva
  // ==========================
  let svg = document.getElementById("topologySvg");
  if (!svg) {
    svg = document.createElementNS(NS, "svg");
    svg.id = "topologySvg";
    svg.classList.add("mapa__topology");
    svg.setAttribute("aria-hidden", "true");
    frame.prepend(svg);
  }

  // Limpiar solo si existía de pruebas anteriores (evita “suciedad” acumulada)
  svg.innerHTML = "";

  const ghostGroup = document.createElementNS(NS, "g");
  ghostGroup.setAttribute("id", "topoGhost");
  ghostGroup.setAttribute("opacity", "0");
  svg.appendChild(ghostGroup);

  const mainGroup = document.createElementNS(NS, "g");
  mainGroup.setAttribute("id", "topoMain");
  svg.appendChild(mainGroup);

  // ==========================
  // Helpers
  // ==========================
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp  = (a, b, t) => a + (b - a) * t;

  function makeLine(parent, alpha = 0.05) {
    const l = document.createElementNS(NS, "line");
    l.setAttribute("stroke-width", "1");
    l.dataset.baseAlpha = String(alpha);
    // FORZAMOS COLOR (evita negro)
    l.setAttribute("stroke", `rgba(248,10,15,${alpha})`);
    parent.appendChild(l);
    return l;
  }

  function makeDot(parent, r = 2, alpha = 0.25) {
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("r", String(r));
    c.dataset.baseAlpha = String(alpha);
    // FORZAMOS COLOR (evita negro)
    c.setAttribute("fill", `rgba(248,10,15,${alpha})`);
    parent.appendChild(c);
    return c;
  }

  function setLine(l, a, b) {
    l.setAttribute("x1", a.x); l.setAttribute("y1", a.y);
    l.setAttribute("x2", b.x); l.setAttribute("y2", b.y);
  }

  function setDot(c, p) {
    c.setAttribute("cx", p.x);
    c.setAttribute("cy", p.y);
  }

  // ==========================
  // Estado topológico con memoria + orgánico
  // ==========================
  const LIMIT_N = 16;
  const LUNGS_MAX = 3;

  const TOPO = {
    w: 0, h: 0, cx: 0, cy: 0,
    phase: 0,
    morph: 0.085,
    jitterPx: 2.2,
    base: { x: 0, y: 0, tx: 0, ty: 0, seed: Math.random() * 1000 },
    limit: Array.from({ length: LIMIT_N }, () => ({
      x: 0, y: 0, tx: 0, ty: 0, seed: Math.random() * 1000
    })),
    lungs: Array.from({ length: LUNGS_MAX }, () => ({
      x: 0, y: 0, tx: 0, ty: 0, active: false, seed: Math.random() * 1000
    })),
    memoryByPoem: new Map()
  };

  // ==========================
  // Elementos SVG persistentes (en mainGroup)
  // ==========================
  const dotBase  = makeDot(mainGroup, 2.4, 0.34);
  const dotLimit = TOPO.limit.map(() => makeDot(mainGroup, 1.8, 0.14));
  const dotLung  = TOPO.lungs.map(() => makeDot(mainGroup, 2.2, 0.28));

  const lineBaseLimit = TOPO.limit.map(() => makeLine(mainGroup, 0.03));
  const lineBaseLung  = TOPO.lungs.map(() => makeLine(mainGroup, 0.10));

  const lineLimitLung = [];
  for (let i = 0; i < LIMIT_N * LUNGS_MAX; i++) lineLimitLung.push(makeLine(mainGroup, 0.02));

  // ==========================
  // Métricas frame
  // ==========================
  function updateFrameMetrics() {
    const r = frame.getBoundingClientRect();
    TOPO.w = r.width;
    TOPO.h = r.height;
    TOPO.cx = r.width / 2;
    TOPO.cy = r.height / 2;
    svg.setAttribute("width", TOPO.w);
    svg.setAttribute("height", TOPO.h);
    svg.setAttribute("viewBox", `0 0 ${TOPO.w} ${TOPO.h}`);
    return r;
  }

  function poemSignature(poemKey) {
    let h = 2166136261;
    for (let i = 0; i < poemKey.length; i++) {
      h ^= poemKey.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0) / 4294967295;
  }

  function setTargetsForPoem(poemKey) {
    const sig = poemSignature(poemKey);

    // Base “narrativa”: un leve desplazamiento por poema
    const bx = TOPO.cx + (sig - 0.5) * TOPO.w * 0.06;
    const by = TOPO.cy + (0.5 - sig) * TOPO.h * 0.05;
    TOPO.base.tx = bx;
    TOPO.base.ty = by;

    // Frontera variable por poema
    const rx = TOPO.w * lerp(0.36, 0.46, sig);
    const ry = TOPO.h * lerp(0.30, 0.42, 1 - sig);
    const twist = lerp(-0.35, 0.35, sig);

    for (let i = 0; i < LIMIT_N; i++) {
      const t = (i / LIMIT_N) * Math.PI * 2 + twist;
      TOPO.limit[i].tx = TOPO.cx + Math.cos(t) * rx;
      TOPO.limit[i].ty = TOPO.cy + Math.sin(t) * ry;
    }
  }

  function setLungTargetsFromDOM(frameRect) {
    const nodes = Array.from(document.querySelectorAll(".partitura"));

    // reset (IMPORTANTE: evita “fantasmas” cuando un poema no tiene partituras)
    for (let i = 0; i < LUNGS_MAX; i++) TOPO.lungs[i].active = false;

    for (let i = 0; i < LUNGS_MAX; i++) {
      if (!nodes[i]) continue;
      const r = nodes[i].getBoundingClientRect();
      TOPO.lungs[i].tx = r.left - frameRect.left + r.width / 2;
      TOPO.lungs[i].ty = r.top  - frameRect.top  + r.height / 2;
      TOPO.lungs[i].active = true;
    }
  }

  // ==========================
  // Memoria por poema (estructura)
  // ==========================
  function storeMemory(poemKey) {
    TOPO.memoryByPoem.set(poemKey, {
      base: { x: TOPO.base.x, y: TOPO.base.y },
      limit: TOPO.limit.map(p => ({ x: p.x, y: p.y })),
      lungs: TOPO.lungs.map(p => ({ x: p.x, y: p.y, active: p.active }))
    });
  }

  function restoreMemoryIfAny(poemKey) {
    const m = TOPO.memoryByPoem.get(poemKey);
    if (!m) return false;

    TOPO.base.x = m.base.x; TOPO.base.y = m.base.y;
    for (let i = 0; i < LIMIT_N; i++) {
      TOPO.limit[i].x = m.limit[i].x;
      TOPO.limit[i].y = m.limit[i].y;
    }
    for (let i = 0; i < LUNGS_MAX; i++) {
      TOPO.lungs[i].x = m.lungs[i].x;
      TOPO.lungs[i].y = m.lungs[i].y;
      TOPO.lungs[i].active = m.lungs[i].active;
    }
    return true;
  }

  // ==========================
  // ESTELA temporal (fantasma)
  // ==========================
  let ghostOpacity = 0;
  const GHOST_START = 0.28;
  const GHOST_FADE = 0.012;

  function captureGhost() {
    // Clonamos solo la capa MAIN, no todo el SVG (evita duplicados / suciedad)
    ghostGroup.innerHTML = "";
    const clone = mainGroup.cloneNode(true);
    // clone es <g id="topoMain">... lo metemos dentro del ghost
    ghostGroup.appendChild(clone);
    ghostOpacity = GHOST_START;
    ghostGroup.setAttribute("opacity", String(ghostOpacity));
  }

  // ==========================
  // Render partituras (tu UI)
  // ==========================
  let activePoemKey = null;

  function renderPartituras(poemKey, poemTitle) {
    const items = PARTITURAS[poemKey] || [];
    row.innerHTML = "";

    if (!items.length) {
      hint.textContent = `No hay partituras configuradas para: ${poemTitle}`;
    } else {
      hint.textContent = `Partituras de: ${poemTitle}`;
      items.forEach((it, idx) => {
        const a = document.createElement("a");
        a.className = "partitura";
        a.href = it.href;
        a.title = it.label;
        a.setAttribute("aria-label", it.label);
        a.textContent = String(idx + 1);
        row.appendChild(a);
      });
    }

    // Targets de pulmones tras layout
    requestAnimationFrame(() => {
      const fr = updateFrameMetrics();
      setTargetsForPoem(poemKey);
      setLungTargetsFromDOM(fr);
    });
  }

  function setActive(poemEl) {
    const nextKey = poemEl.dataset.poem;
    const title = poemEl.textContent.trim().replace(/\s+/g, " ");

    // estela + memoria del anterior
    if (activePoemKey) {
      captureGhost();
      storeMemory(activePoemKey);
    }

    poemas.forEach(p => p.classList.remove("is-active"));
    poemEl.classList.add("is-active");
    activePoemKey = nextKey;

    // si ya visitado, arrancar desde su memoria
    restoreMemoryIfAny(activePoemKey);

    renderPartituras(activePoemKey, title);

    partiturasAnchor?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  poemas.forEach(poemEl => {
    poemEl.addEventListener("click", (e) => {
      e.preventDefault();
      setActive(poemEl);
    });
  });

  // ==========================
  // Animación orgánica + respiración + morph
  // ==========================
  function updateDynamics() {
    TOPO.phase += 0.0022;
    const t = TOPO.morph;

    TOPO.base.x = lerp(TOPO.base.x, TOPO.base.tx, t);
    TOPO.base.y = lerp(TOPO.base.y, TOPO.base.ty, t);

    for (let i = 0; i < LIMIT_N; i++) {
      const p = TOPO.limit[i];
      p.x = lerp(p.x, p.tx, t);
      p.y = lerp(p.y, p.ty, t);

      const j = TOPO.jitterPx * 0.55;
      p.ox = Math.sin(TOPO.phase * 1.6 + p.seed) * j;
      p.oy = Math.cos(TOPO.phase * 1.4 + p.seed) * j;
    }

    for (let i = 0; i < LUNGS_MAX; i++) {
      const p = TOPO.lungs[i];
      if (!p.active) continue;

      p.x = lerp(p.x, p.tx, t);
      p.y = lerp(p.y, p.ty, t);

      const j = TOPO.jitterPx * 0.35;
      p.ox = Math.sin(TOPO.phase * 1.2 + p.seed) * j;
      p.oy = Math.cos(TOPO.phase * 1.0 + p.seed) * j;
    }
  }

  function renderSVG() {
    const breath = (Math.sin(TOPO.phase) + 1) * 0.5; // 0..1
    const pulseA = lerp(0.86, 1.18, breath);

    const base = { x: TOPO.base.x, y: TOPO.base.y };
    setDot(dotBase, base);

    // limit
    for (let i = 0; i < LIMIT_N; i++) {
      const p = TOPO.limit[i];
      const lim = { x: p.x + (p.ox || 0), y: p.y + (p.oy || 0) };
      setDot(dotLimit[i], lim);
      setLine(lineBaseLimit[i], base, lim);
    }

    // lungs
    for (let i = 0; i < LUNGS_MAX; i++) {
      const p = TOPO.lungs[i];

      if (!p.active) {
        dotLung[i].style.display = "none";
        lineBaseLung[i].style.display = "none";
        continue;
      }

      dotLung[i].style.display = "";
      lineBaseLung[i].style.display = "";

      const lung = { x: p.x + (p.ox || 0), y: p.y + (p.oy || 0) };
      setDot(dotLung[i], lung);
      setLine(lineBaseLung[i], base, lung);
    }

    // mesh limit->lungs
    let k = 0;
    for (let i = 0; i < LIMIT_N; i++) {
      const p = TOPO.limit[i];
      const lim = { x: p.x + (p.ox || 0), y: p.y + (p.oy || 0) };

      for (let j = 0; j < LUNGS_MAX; j++) {
        const lp = TOPO.lungs[j];
        const L = lineLimitLung[k++];

        if (!lp.active) {
          L.style.display = "none";
          continue;
        }

        L.style.display = "";
        const lung = { x: lp.x + (lp.ox || 0), y: lp.y + (lp.oy || 0) };
        setLine(L, lim, lung);
      }
    }

    // respiración: alpha (FORZANDO rojo, sin negro)
    mainGroup.querySelectorAll("line").forEach((l, i) => {
      const baseA = parseFloat(l.dataset.baseAlpha || "0.03");
      const wave = Math.sin(TOPO.phase + i * 0.02) * 0.010;
      const a = clamp(baseA * pulseA + wave, 0.005, 0.22);
      l.setAttribute("stroke", `rgba(248,10,15,${a})`);
    });

    // estela: fade out
    if (ghostOpacity > 0) {
      ghostOpacity = Math.max(0, ghostOpacity - GHOST_FADE);
      ghostGroup.setAttribute("opacity", String(ghostOpacity));
    }
  }

  function tick() {
    updateDynamics();
    renderSVG();
    requestAnimationFrame(tick);
  }

  // ==========================
  // Resize
  // ==========================
  let resizeTimer = null;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const fr = updateFrameMetrics();
      if (activePoemKey) setTargetsForPoem(activePoemKey);
      setLungTargetsFromDOM(fr);
    }, 90);
  }
  window.addEventListener("resize", onResize);

  const ro = new ResizeObserver(onResize);
  ro.observe(frame);

  // ==========================
  // INIT
  // ==========================
  const initial = document.querySelector(".poema.is-active") || poemas[0];
  if (initial) {
    activePoemKey = initial.dataset.poem;

    updateFrameMetrics();
    setTargetsForPoem(activePoemKey);

    // arranque sin salto
    TOPO.base.x = TOPO.base.tx; TOPO.base.y = TOPO.base.ty;
    for (let i = 0; i < LIMIT_N; i++) {
      TOPO.limit[i].x = TOPO.limit[i].tx;
      TOPO.limit[i].y = TOPO.limit[i].ty;
    }

    setActive(initial);
  }

  tick();
})();
class TopologicalField {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.nodes = [];
    this.limitPoints = [];
    this.edges = [];

    this.k = options.k || 3;
    this.baseDensity = options.baseDensity || 22;

    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.generateBase();
    this.generateLimits();
  }

  resize() {
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
  }

  generateBase() {
    const count = this.baseDensity;
    this.nodes = [];

    for (let i = 0; i < count; i++) {
      this.nodes.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height
      });
    }
  }

  generateLimits() {
    const count = 5;
    this.limitPoints = [];

    for (let i = 0; i < count; i++) {
      this.limitPoints.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height
      });
    }
  }

  computeEdges(breath) {
    this.edges = [];

    const effectiveK = Math.floor(2 + breath * 4);

    for (let a of this.nodes) {
      const sorted = [...this.nodes]
        .filter(b => b !== a)
        .map(b => ({
          b,
          d: (a.x - b.x)**2 + (a.y - b.y)**2
        }))
        .sort((p,q)=>p.d-q.d)
        .slice(0, effectiveK);

      sorted.forEach(({b}) => {
        this.edges.push({a,b});
      });
    }
  }

  draw(breath) {
    const ctx = this.ctx;
    ctx.clearRect(0,0,this.canvas.width,this.canvas.height);

    this.computeEdges(breath);

    ctx.globalAlpha = 0.2 + breath * 0.6;

    for (let e of this.edges) {
      ctx.beginPath();
      ctx.moveTo(e.a.x, e.a.y);
      ctx.lineTo(e.b.x, e.b.y);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;

    // nodos base
    for (let n of this.nodes) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, 3, 0, Math.PI*2);
      ctx.fill();
    }

    // puntos límite (mutación)
    for (let l of this.limitPoints) {
      ctx.beginPath();
      ctx.arc(l.x, l.y, 6 + breath*4, 0, Math.PI*2);
      ctx.stroke();
    }
  }
}
