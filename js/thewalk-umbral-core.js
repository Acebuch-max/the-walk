/* js/thewalk-umbral-core.js */
(() => {
  const STORAGE_KEY = "thewalk.umbral.v1";

  // Vocabulario mínimo (solo para Circa Stellas por ahora; luego se amplía por poema)
  const LEXICON = {
    relational: new Set(["entre", "relación", "relaciones", "intervalo", "arco", "franja", "horizonte", "orientación", "orientacion"]),
    verbs: new Set(["habitar", "mirar", "medir", "caminar", "situarse", "existir", "gira"])
  };

  const clamp01 = (x) => Math.max(0, Math.min(1, x));

  function normalizeText(s) {
    return (s || "")
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quita tildes
      .replace(/[^\p{L}\p{N}\s]/gu, " ")              // quita puntuación
      .replace(/\s+/g, " ")
      .trim();
  }

  function collectPoemTextFromDOM() {
    // Partituras: <section class="ptolomeo ..."> contiene <article class="trios p0x"><p class="es">...</p></article>
    const ps = Array.from(document.querySelectorAll("section.ptolomeo p.es"));
    const text = ps.map(p => p.textContent || "").join(" ");
    return text.trim();
  }

  function computeUmbralVector(text, domHints = {}) {
    const t = normalizeText(text);
    const words = t ? t.split(" ") : [];
    const nWords = words.length || 1;

    let rel = 0;
    let vb = 0;

    for (const w of words) {
      if (LEXICON.relational.has(w)) rel++;
      if (LEXICON.verbs.has(w)) vb++;
    }

    // Densidad estructural simple (0..1)
    const relationalDensity = clamp01(rel / nWords * 6); // *6 para que “se note” en poemas cortos
    const verbDensity = clamp01(vb / nWords * 6);

    // “Respiración” (lenta) basada en contenido + estructura de la partitura
    const trios = domHints.trios ?? document.querySelectorAll("article.trios").length;
    const rests = domHints.rests ?? document.querySelectorAll(".rest").length;

    // Tensión: relación + alternancia (trios vs rests)
    const alternance = clamp01((rests / Math.max(1, trios + rests)) * 2);
    const tension = clamp01(0.65 * relationalDensity + 0.35 * alternance);

    // Umbral: cuánto “se formaliza” el texto en estructura (aquí deliberadamente sobrio)
    const threshold = clamp01(0.55 * relationalDensity + 0.25 * verbDensity + 0.20 * alternance);

    // Entropía (ruido/indeterminación) para modular topología/velo (no es “azar”, es textura)
    const entropy = clamp01(0.35 + 0.55 * (1 - relationalDensity));

    return {
      poemId: domHints.poemId || guessPoemId(),
      threshold,          // 0..1
      tension,            // 0..1
      entropy,            // 0..1
      relationalDensity,  // 0..1
      verbDensity,        // 0..1
      trios, rests,
      ts: Date.now()
    };
  }

  function guessPoemId() {
    const title = (document.querySelector("h1.title")?.textContent || document.title || "").trim();
    if (/circa\s+stellas/i.test(title)) return "CircaStellas";
    return "UnknownPoem";
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function saveState(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }

  function applyToCSS(state) {
    const root = document.documentElement;

    // Variables globales del Umbral
    root.style.setProperty("--umbral", String(state.threshold));
    root.style.setProperty("--umbral-tension", String(state.tension));
    root.style.setProperty("--umbral-entropy", String(state.entropy));
    root.style.setProperty("--umbral-rel", String(state.relationalDensity));
    root.style.setProperty("--umbral-verb", String(state.verbDensity));

    // Señal mínima visible (opcional): lectura numérica discreta (sin “chatarra UI”)
    const readout = document.querySelector("[data-umbral-readout]");
    if (readout) readout.textContent = state.threshold.toFixed(2);

    document.body?.setAttribute("data-umbral", state.threshold.toFixed(3));
    document.documentElement?.classList.add("umbral-ready");

    // Arcilla-4 / Core: vector del Umbral para pliegues deterministas
    window.dispatchEvent(new CustomEvent("tw:umbral-vector", { detail: state }));
  }

  function bootstrap() {
    // 1) Si hay poema en la página, recalcula y guarda.
    const poemText = collectPoemTextFromDOM();
    const hasPoem = poemText.length > 0;

    const previous = loadState();

    if (hasPoem) {
      const v = computeUmbralVector(poemText);
      saveState(v);
      applyToCSS(v);
      return;
    }

    // 2) Si no hay poema (Mapa, Ritmo, etc), aplica el último estado conocido.
    if (previous) {
      applyToCSS(previous);
      return;
    }

    // 3) Si no hay nada aún, estado neutro (Umbral = 0.33 por defecto)
    const neutral = {
      poemId: "Neutral",
      threshold: 0.33,
      tension: 0.33,
      entropy: 0.66,
      relationalDensity: 0.0,
      verbDensity: 0.0,
      trios: 0,
      rests: 0,
      ts: Date.now()
    };
    applyToCSS(neutral);
  }

  // Arranque
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
  } else {
    bootstrap();
  }
})();
/* =========================================================
   THE WALK — UMBRAL CORE
   Lector poético operativo
   Poema -> análisis -> estado de umbral -> variables CSS
   ========================================================= */

(() => {
  'use strict';

  const STORAGE_KEY = 'TW_SCORE_STRUCTURE';
  const ANALYSIS_KEY = 'TW_UMBRAL_ANALYSIS';

  /* ---------------------------
     Utilidades
  --------------------------- */

  const clamp = (n, min = 0, max = 1) => Math.max(min, Math.min(max, n));

  function stripAccents(str = '') {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function normalizeText(str = '') {
    return stripAccents(String(str).toLowerCase())
      .replace(/[“”"';:,.!?¡¿()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function countWholeWord(text, word) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`\\b${escaped}\\b`, 'g');
    return (text.match(re) || []).length;
  }

  function sumCounts(text, words) {
    return words.reduce((acc, word) => acc + countWholeWord(text, word), 0);
  }

  function getQuestionCount(rawText = '') {
    const open = (rawText.match(/¿/g) || []).length;
    const close = (rawText.match(/\?/g) || []).length;
    return Math.max(open, close);
  }

  function getLinesFromStructure(structure) {
    if (!structure) return [];
    if (Array.isArray(structure.lines) && structure.lines.length) return structure.lines;
    if (typeof structure.text === 'string' && structure.text.trim()) {
      return structure.text
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);
    }
    return [];
  }

  function buildStructureFromDOM() {
    const articles = Array.from(document.querySelectorAll('article.trios'));
    const rests = Array.from(document.querySelectorAll('.rest'));
    const lines = articles.flatMap(article =>
      Array.from(article.querySelectorAll('p.es'))
        .map(p => p.textContent.trim())
        .filter(Boolean)
    );

    return {
      poemId: document.querySelector('main.score')?.getAttribute('aria-label') || document.title || 'TheWalk',
      partitura: document.querySelector('.title')?.textContent?.trim() || '',
      source: document.title || '',
      trios: articles.length,
      rests: rests.length,
      verses: articles.map(a => a.querySelectorAll('p.es').length),
      lines,
      text: lines.join('\n')
    };
  }

  function readStructure() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const lines = getLinesFromStructure(parsed);
        return {
          ...parsed,
          lines,
          text: lines.join('\n')
        };
      }
    } catch (err) {
      console.warn('[The Walk] No se pudo leer TW_SCORE_STRUCTURE:', err);
    }
    return buildStructureFromDOM();
  }

  /* ---------------------------
     Léxico operativo
  --------------------------- */

 const LEXICON = {

  /* frontera / paso */

  threshold: [
    'umbral','salir','entrar','puerta','borde','frontera',
    'paso','cruce','transito','transitar','limite','llegar'
  ],

  /* vacío existencial */

  negation: [
    'nada','vacio','nadie','nunca','jamas','ningun','ninguna',
    'no','fuera','ausencia'
  ],

  /* clima frío */

  cold: [
    'invierno','frio','hielo','nieve','oscuro','sombra','gris'
  ],

  /* afecto */

  affection: [
    'amor','ternura','aman','veneran','amar','amado',
    'cuidado','calor','abrazo'
  ],

  /* invocación colectiva */

  invocation: [
    'todos','su','ella','llaman','buscando','sufriendo','rezar'
  ],

  /* movimiento / viaje */

  motion: [
    'andar','andan','seguir','transitar','mover','moverse',
    'caminar','llegar','salir','entrar','girar','volver'
  ],

  /* utopía / paraíso */

  utopia: [
    'paraiso','cielo','cielos','miel','oro','azules',
    'cristalinas','volar','ascender','conquistar','feliz'
  ],

  /* violencia / fanatismo */

  violence: [
    'muerte','sangre','exterminio','odio','fanatico',
    'crueldad','maldad','insulto','desprecio'
  ],

  /* manipulación moral */

  corruption: [
    'hipocrita','perfidia','mezquindad','burla','farsante'
  ]
};

  /* ---------------------------
     Análisis del poema
  --------------------------- */

  function analyzePoem(structure) {
    const rawText = structure?.text || '';
    const clean = normalizeText(rawText);
    const lines = getLinesFromStructure(structure);
    const words = clean ? clean.split(' ') : [];
    const totalWords = words.length || 1;
    const lineCount = lines.length || 1;

    const questions = getQuestionCount(rawText);

    const repeatedWords = WATCH_WORDS.reduce((acc, word) => {
      acc[word] = countWholeWord(clean, word);
      return acc;
    }, {});

    const lexical = {
      threshold: sumCounts(clean, LEXICON.threshold),
      negation: sumCounts(clean, LEXICON.negation),
      cold: sumCounts(clean, LEXICON.cold),
      affection: sumCounts(clean, LEXICON.affection),
      invocation: sumCounts(clean, LEXICON.invocation),
      motion: sumCounts(clean, LEXICON.motion)
    };

    const repetitions = Object.values(repeatedWords).reduce((a, b) => a + b, 0);

    const metrics = {
      questionRate: questions / lineCount,
      repetitionRate: repetitions / totalWords,
      thresholdRate: lexical.threshold / totalWords,
      negationRate: lexical.negation / totalWords,
      coldRate: lexical.cold / totalWords,
      affectionRate: lexical.affection / totalWords,
      invocationRate: lexical.invocation / totalWords,
      motionRate: lexical.motion / totalWords
    };

    return {
      structure: {
        poemId: structure.poemId || '',
        partitura: structure.partitura || '',
        trios: structure.trios || 0,
        rests: structure.rests || 0,
        lineCount,
        totalWords
      },
      raw: {
        questions,
        repeatedWords,
        lexical
      },
      metrics
    };
  }

  /* ---------------------------
     Traducción a estado umbral
  --------------------------- */

  function deriveUmbralState(analysis) {
    const m = analysis.metrics;
    const rw = analysis.raw.repeatedWords;
    const s = analysis.structure;

    const instability =
      clamp(
        (m.questionRate * 1.8) +
        (m.negationRate * 1.6) +
        (m.thresholdRate * 1.2)
      );

    const pulse =
      clamp(
        (m.repetitionRate * 6.0) +
        ((rw.nada || 0) * 0.05) +
        ((rw.todos || 0) * 0.04) +
        ((rw.amor || 0) * 0.05)
      );

    const density =
      clamp(
        (m.thresholdRate * 2.0) +
        (m.invocationRate * 1.1) +
        ((s.rests || 0) / Math.max(1, s.trios + s.rests)) * 0.8
      );

    const contraction =
      clamp(
        (m.coldRate * 2.0) +
        (m.negationRate * 1.3)
      );

    const openness =
      clamp(
        (m.motionRate * 1.5) +
        (m.affectionRate * 1.2) -
        (m.negationRate * 0.6)
      );

    const warmth =
      clamp(
        (m.affectionRate * 2.2) +
        (m.invocationRate * 0.5) -
        (m.coldRate * 0.8)
      );

    const coldness =
      clamp(
        (m.coldRate * 2.2) +
        (m.negationRate * 0.9) -
        (m.affectionRate * 0.5)
      );

    const thresholdTension =
      clamp(
        (m.thresholdRate * 2.4) +
        (m.questionRate * 0.8) +
        (m.motionRate * 0.5)
      );

    const echo =
      clamp(
        (m.repetitionRate * 7.0) +
        ((rw.nada || 0) * 0.06)
      );

    const drift =
      clamp(
        (m.motionRate * 1.6) +
        (m.questionRate * 0.5)
      );

    return {
      instability,
      pulse,
      density,
      contraction,
      openness,
      warmth,
      coldness,
      thresholdTension,
      echo,
      drift
    };
  }

  /* ---------------------------
     Aplicación al DOM / CSS
  --------------------------- */

  function applyUmbralState(state, analysis) {
    const root = document.documentElement;
    const body = document.body;

    root.dataset.twPoem = analysis.structure.poemId || '';
    root.dataset.twPartitura = analysis.structure.partitura || '';
    root.dataset.twInstability = state.instability.toFixed(3);
    root.dataset.twThreshold = state.thresholdTension.toFixed(3);

    const cssVars = {
      '--tw-umbral-instability': state.instability.toFixed(4),
      '--tw-umbral-pulse': state.pulse.toFixed(4),
      '--tw-umbral-density': state.density.toFixed(4),
      '--tw-umbral-contraction': state.contraction.toFixed(4),
      '--tw-umbral-openness': state.openness.toFixed(4),
      '--tw-umbral-warmth': state.warmth.toFixed(4),
      '--tw-umbral-coldness': state.coldness.toFixed(4),
      '--tw-umbral-threshold': state.thresholdTension.toFixed(4),
      '--tw-umbral-echo': state.echo.toFixed(4),
      '--tw-umbral-drift': state.drift.toFixed(4)
    };

    Object.entries(cssVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    body.classList.toggle('tw-has-questions', analysis.raw.questions > 0);
    body.classList.toggle('tw-has-negation', analysis.raw.lexical.negation > 0);
    body.classList.toggle('tw-has-threshold', analysis.raw.lexical.threshold > 0);
    body.classList.toggle('tw-has-cold', analysis.raw.lexical.cold > 0);
    body.classList.toggle('tw-has-affection', analysis.raw.lexical.affection > 0);

    try {
      sessionStorage.setItem(
        ANALYSIS_KEY,
        JSON.stringify({
          analysis,
          state
        })
      );
    } catch (err) {
      console.warn('[The Walk] No se pudo guardar TW_UMBRAL_ANALYSIS:', err);
    }

    window.dispatchEvent(
      new CustomEvent('tw:umbral-analysis', {
        detail: { analysis, state }
      })
    );
  }

  /* ---------------------------
     Readout opcional
  --------------------------- */

  function updateReadout(state) {
    const node = document.querySelector('[data-umbral-readout]');
    if (!node) return;

    const level =
      state.thresholdTension > 0.66 ? 'ALTO'
      : state.thresholdTension > 0.33 ? 'MEDIO'
      : 'BAJO';

    node.textContent = level;
  }

  /* ---------------------------
     API pública
  --------------------------- */

  function runUmbralPoeticAnalysis() {
    const structure = readStructure();
    const analysis = analyzePoem(structure);
    const state = deriveUmbralState(analysis);

    applyUmbralState(state, analysis);
    updateReadout(state);

    return { structure, analysis, state };
  }

  window.TheWalkUmbral = {
    run: runUmbralPoeticAnalysis,
    readStructure,
    analyzePoem,
    deriveUmbralState
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runUmbralPoeticAnalysis, { once: true });
  } else {
    runUmbralPoeticAnalysis();
  }
})();
window.addEventListener('tw:umbral-analysis', (ev) => {
  const { state, analysis } = ev.detail;
  // mapear pulse, instability, coldness, warmth a audio
});