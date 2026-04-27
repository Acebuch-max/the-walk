/* js/tw-score-export.js
   THE WALK — contrato único Partitura -> Umbral
   Guarda contexto (poema + partitura + métricas) al cruzar cualquier puerta a Puerta-Umbral*.html
*/
(() => {
  const KEY = "TW_SCORE_STRUCTURE";

  const norm = (s) => (s || "").trim();

  const detectPart = () => {
    const bodyPart = document.body?.dataset?.twPartitura;
    if (bodyPart) return norm(bodyPart);

    const t = norm(document.title);
    // Detecta I/II/III al final o antes de punto
    const m = t.match(/\b(III|II|I)\b\s*\.?\s*$/i) || t.match(/\b(III|II|I)\b/i);
    return m ? m[1].toUpperCase() : "";
  };

  const detectPoem = () => {
    const bodyPoem = document.body?.dataset?.twPoem;
    if (bodyPoem) return norm(bodyPoem);

    const t = norm(document.title).toLowerCase();
    if (t.includes("circa stellas")) return "circa-stellas";
    if (t.includes("ella")) return "ella-b";
    return "";
  };

  const buildPayload = () => {
    const articles = Array.from(document.querySelectorAll("article.trios"));
    const payload = {
      v: 1,
      ts: Date.now(),
      poemId: detectPoem(),
      partitura: detectPart(),
      title: norm(document.title),
      trios: articles.length,
      rests: document.querySelectorAll(".rest").length,
      doors: document.querySelectorAll("a.trios.door").length,
      verses: articles.map(a => a.querySelectorAll("p").length),
      // texto mínimo (para métricas/semillas; no es para UI)
      text: articles.map(a => a.innerText.trim()).join("\n")
    };
    return payload;
  };

  const isUmbralLink = (a) => {
    const href = a.getAttribute("href") || "";
    return /Puerta-Umbral/i.test(href);
  };

  // Delegación: robusto incluso si se reordena DOM
  document.addEventListener("click", (ev) => {
    const a = ev.target?.closest?.("a");
    if (!a) return;
    if (!isUmbralLink(a)) return;

    try {
      const payload = buildPayload();
      sessionStorage.setItem(KEY, JSON.stringify(payload));
    } catch (e) {
      // silencio: el cruce no debe fallar
    }
  }, { passive: true });
})();
