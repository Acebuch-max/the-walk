// =======================================================
// THE WALK — PUERTA HABITAR — MOTOR INTEGRAL
// Lectura: Partitura (structure) -> métricas -> params -> perfil -> topología -> render + audio
// =======================================================

(() => {
  // ----------------------------
  // 0) DOM REQUIRED
  // ----------------------------
  const svg = document.getElementById("geom");
  const bandFill = document.getElementById("band-fill");
  const bandStroke = document.getElementById("band-stroke");
  const originLink = document.getElementById("origin-link");
  const returnLink = document.getElementById("return-link");
  const soundBtn = document.getElementById("sound-toggle");

  if (!svg || !bandFill || !bandStroke || !originLink || !returnLink || !soundBtn) {
    console.error("[Puerta-Habitar] Faltan nodos DOM requeridos (geom/band-fill/band-stroke/origin-link/return-link/sound-toggle).");
    return;
  }

  // ----------------------------
  // 1) ENTRADA: PARTITURA -> URL -> DEFAULT
  // ----------------------------
  const Q = new URLSearchParams(location.search);
  const profileName = (Q.get("profile") || Q.get("m") || "auto").toLowerCase();

  // 1) Estructura desde Partitura
  const stored = sessionStorage.getItem("TW_SCORE_STRUCTURE");
  let structure = null;
  if (stored) {
    try { structure = JSON.parse(stored); } catch (e) { structure = null; }
    sessionStorage.removeItem("TW_SCORE_STRUCTURE");
  }

  // 2) Texto opcional por URL
  const urlText = Q.get("t");

  // 3) Texto final (si venimos de Partitura y existe structure.text, se usa como literal/semilla)
  const literal = (structure && typeof structure.text === "string" && structure.text.trim())
    ? structure.text.trim()
    : (urlText || "Ella refleja al Yo en el Umbral");

  // ----------------------------
  // 2) UTILIDADES
  // ----------------------------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function hash32(str) {
    // FNV-1a 32-bit
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function makeRng(seed0) {
    let seed = seed0 >>> 0;
    return function rand01() {
      // LCG
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967295;
    };
  }

  function polar(px, py, r, th) {
    
    // --- ARCILLA-4: pliegue determinista (IA oculta) ---
    const A4 = window.TW?.arcilla4;
    if (A4) {
      const s = A4.getSpace();
      const clamp01 = (x)=>Math.max(0, Math.min(1, x));

      thickness = clamp01(thickness * (0.85 + s.threshold*0.55));
      thetaSpan = thetaSpan * (0.85 + s.threshold*0.35);
      warp = warp * (0.75 + (1 - s.tension)*0.55);

      const centerPull = (s.determinism - 0.5) * 0.06;
      ox = clamp01(ox + centerPull);
      oy = clamp01(oy + centerPull);

      nodes = Math.max(1, Math.min(7, Math.round(nodes + s.threshold*2 - s.tension)));

      base = Math.max(55, Math.round(base * (0.92 + (1 - s.threshold)*0.18)));
      wobble = clamp01(wobble * (0.70 + s.entropy*0.55));
    }

    return { x: px + r * Math.cos(th), y: py + r * Math.sin(th) };
  }

  function arcFlags(t0, t1) {
    const d = t1 - t0;
    return { largeArc: (Math.abs(d) > Math.PI) ? 1 : 0, sweep: (d >= 0) ? 1 : 0 };
  }

  // ----------------------------
  // 3) MÉTRICAS (ESTRUCTURA)
  // ----------------------------
  function analyzeStructure(s) {
    // fallback seguro
    if (!s || !Array.isArray(s.verses)) {
      return {
        trios: 3,
        rests: 1,
        verses: [3, 3, 3],
        totalVerses: 9,
        variance: 0,
        source: ""
      };
    }

    const verses = s.verses.map(n => Number(n) || 0);
    const totalVerses = verses.reduce((a, b) => a + b, 0);

    // variación respecto a 3 (trío ideal)
    const variance = verses.reduce((a, b) => a + (b - 3) * (b - 3), 0) / Math.max(verses.length, 1);

    return {
      trios: Number(s.trios) || verses.length,
      rests: Number(s.rests) || 0,
      verses,
      totalVerses,
      variance,
      source: (typeof s.source === "string" ? s.source : "")
    };
  }

  // Métricas adicionales (texto) sólo para afinar (no manda sobre la estructura)
  function analyzeTextLite(text) {
    const clean = (text || "").trim();
    const len = clean.length || 1;
    const punct = (clean.match(/[.,;:!?¿¡—-]/g) || []).length / len;
    const vowels = (clean.match(/[aeiouáéíóúü]/gi) || []).length / len;
    return { punct, vowels };
  }

  const scoreM = analyzeStructure(structure);
  const textM = analyzeTextLite(literal);

  // ----------------------------
  // 4) PARAMS (SCORE -> GEOMETRÍA)
  // ----------------------------
  function paramsFromScore(m, tLite, seedStr) {
    const seed = hash32(seedStr);
    const r = makeRng(seed);

    // Apertura: más trios -> más span
    const thetaSpan = clamp(0.70 + m.trios * 0.10 + tLite.punct * 0.35, 0.55, 2.25);

    // Espesor: totalVerses empuja grosor
    const thickness = clamp(0.18 + (m.totalVerses / 60) * 0.55 + tLite.vowels * 0.15, 0.18, 0.75);

    // Irregularidad: variance + rests
    const warp = clamp(0.02 + (m.variance / 6) * 0.12 + m.rests * 0.02 + tLite.punct * 0.06, 0, 0.22);

    // Centro: leve deriva determinista
    const ox = 0.50 + (r() - 0.5) * 0.10;
    const oy = 0.60 + (r() - 0.5) * 0.10;

    // Nodos: derivados de trios, cap a 4
    const nodes = clamp(Math.round(1 + m.trios / 2), 1, 4);

    // Audio: trios sube base, rests sube wobble
    const base = clamp(80 + m.trios * 12 + Math.round(tLite.vowels * 80), 45, 240);
    const wobble = clamp(0.20 + m.rests * 0.12 + (m.variance / 6) * 0.25, 0.05, 1.6);

    return {
      literal,
      // shape controls
      ox, oy,
      thetaSpan,
      rInner: 0.10,
      rOuter: 0.10 + thickness,
      warp,
      nodes,

      // carry score info for topologies that want it
      trios: m.trios,
      rests: m.rests,
      verses: m.verses,
      totalVerses: m.totalVerses,
      variance: m.variance,

      audio: { base, wobble }
    };
  }

  const seedStr = [
    "TW",
    scoreM.source || "",
    JSON.stringify({ trios: scoreM.trios, rests: scoreM.rests, verses: scoreM.verses }),
    literal
  ].join("|");

  let p = paramsFromScore(scoreM, textM, seedStr);

  // ----------------------------
  // 5) PERFIL + TOPOLOGÍA (si existen), con fallback
  // ----------------------------
  const profiles = window.TW_PROFILES?.Profiles || null;
  const profile = profiles?.[profileName] || profiles?.auto || null;

  if (profile?.tune) {
    p = profile.tune(p, { score: scoreM, text: textM });
  }

  const topologies = window.TW_TOPOLOGIES || null;
  const topoName = profile?.pickTopology
    ? profile.pickTopology(p, { score: scoreM, text: textM })
    : "annularSector";

  const topoFn = topologies?.[topoName] || topologies?.annularSector || null;

  // Fallback local: annular sector básico
  function fallbackAnnularSector(params) {
    const span = clamp(params.thetaSpan, 0.55, 2.25);
    const t0 = -Math.PI / 2 - span * 0.40;
    const t1 = -Math.PI / 2 + span * 0.60;

    return {
      family: "annularSector",
      origin: { x: params.ox, y: params.oy },
      band: {
        thetaStart: t0,
        thetaEnd: t1,
        rInner: clamp(params.rInner, 0.06, 0.25),
        rOuter: clamp(params.rOuter, 0.18, 0.75),
        warp: clamp(params.warp, 0, 0.22)
      },
      nodes: [{ t: 0.50, kind: "return" }],
      extras: { lines: [], arcs: [], paths: [] },
      audio: params.audio
    };
  }

  const design = topoFn ? topoFn(p) : fallbackAnnularSector(p);

  // ----------------------------
  // 6) RENDER (franja + origen + nodo retorno) + grupo extras
  // ----------------------------
  let extrasGroup = document.getElementById("extras");
  if (!extrasGroup) {
    extrasGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    extrasGroup.setAttribute("id", "extras");
    svg.appendChild(extrasGroup);
  }

  function bandPath(ox, oy, rIn, rOut, t0, t1) {
    const a = polar(ox, oy, rOut, t0);
    const b = polar(ox, oy, rOut, t1);
    const c = polar(ox, oy, rIn, t1);
    const d = polar(ox, oy, rIn, t0);

    const fo = arcFlags(t0, t1);
    const fi = arcFlags(t1, t0);

    return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)}
            A ${rOut.toFixed(2)} ${rOut.toFixed(2)} 0 ${fo.largeArc} ${fo.sweep} ${b.x.toFixed(2)} ${b.y.toFixed(2)}
            L ${c.x.toFixed(2)} ${c.y.toFixed(2)}
            A ${rIn.toFixed(2)} ${rIn.toFixed(2)} 0 ${fi.largeArc} ${fi.sweep} ${d.x.toFixed(2)} ${d.y.toFixed(2)} Z`
      .replace(/\s+/g, " ");
  }

  function render(d) {
    const view = 1000;

    const ox = d.origin.x * view;
    const oy = d.origin.y * view;

    const rIn = d.band.rInner * view;
    const rOut = d.band.rOuter * view;

    const t0 = d.band.thetaStart;
    const t1 = d.band.thetaEnd;

    // franja
    const path = bandPath(ox, oy, rIn, rOut, t0, t1);
    bandFill.setAttribute("d", path);
    bandStroke.setAttribute("d", path);

    // origen (centro de campo)
    originLink.style.left = (d.origin.x * 100) + "%";
    originLink.style.top = (d.origin.y * 100) + "%";

    // nodo retorno (primer nodo o 0.5)
    const n = (d.nodes && d.nodes.length) ? d.nodes[0] : { t: 0.5 };
    const theta = t0 + n.t * (t1 - t0);
    const rMid = ((d.band.rInner + d.band.rOuter) / 2) * view;
    const pos = polar(ox, oy, rMid, theta);

    returnLink.style.left = (pos.x / view * 100) + "%";
    returnLink.style.top = (pos.y / view * 100) + "%";

    const bar = returnLink.querySelector(".return-node");
    if (bar) bar.style.transform = `rotate(${theta}rad)`;

    // extras (por ahora sólo limpiamos; las topologías pueden empezar a poblarlo)
    extrasGroup.innerHTML = "";
  }

  render(design);

  // ----------------------------
  // 7) AUDIO (autostart + unlock + STOP/SONIDO)
  // ----------------------------
  let ctx = null, osc = null, gain = null, audioStarted = false;

  async function startAudio() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      osc = ctx.createOscillator();
      gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.value = design.audio?.base ?? 110;
      gain.gain.value = 0.00001;

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
    }

    if (ctx.state === "suspended") {
      try { await ctx.resume(); } catch (e) {}
    }

    if (ctx.state === "running") {
      const t = ctx.currentTime;
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(0.00001, t);
      gain.gain.exponentialRampToValueAtTime(0.02, t + 0.6);

      audioStarted = false;
      soundBtn.textContent = "STOP";
      return true;
    }

    soundBtn.textContent = "STOP";
    return false;
  }

  function stopAudio() {
    if (!ctx) return;

    const t = ctx.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.exponentialRampToValueAtTime(0.00001, t + 0.3);

    setTimeout(() => {
      try { osc.stop(); } catch (e) {}
      try { ctx.close(); } catch (e) {}
      ctx = null; osc = null; gain = null;
      audioStarted = false;
      soundBtn.textContent = "SONIDO";
    }, 360);
  }

  soundBtn.addEventListener("click", async () => {
    if (audioStarted) stopAudio();
    else await startAudio(); // click desbloquea siempre si el navegador bloquea autoplay
  });

  // intento al cargar (Firefox suele permitir)
  window.addEventListener("DOMContentLoaded", () => { startAudio().catch(() => {}); });

  // unlock universal al primer gesto
  ["pointerdown", "keydown", "touchstart", "click"].forEach(evt => {
    window.addEventListener(evt, () => { if (!audioStarted) startAudio(); }, { once: true, capture: true });
  });

  // impulso al tocar el origen (si ya hay audio)
  originLink.addEventListener("pointerdown", () => {
    if (!ctx || !gain) return;
    const t = ctx.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.012), t);
    gain.gain.exponentialRampToValueAtTime(0.02, t + 0.05);
  });

})();
function exportUmbral(){
  const data = localStorage.getItem("thewalk.umbral.v1");
  if(!data) return;

  const blob = new Blob([data], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "thewalk_umbral.json";
  a.click();
}