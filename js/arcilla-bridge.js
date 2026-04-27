(() => {
  const TW = (window.TW = window.TW || {});
  const Q = new URLSearchParams(location.search);

  // Para prueba inmediata:
  // ?arcilla=data/ella-b.umbral.json
  // Más adelante cambiaremos el fallback a los-estorninos.umbral.json
  const DEFAULT_URL = Q.get("arcilla") || "data/ella-b.umbral.json";

  async function loadArcillaJSON(url = DEFAULT_URL) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      TW.arcillaJSON = data;

      if (TW.arcilla4 && typeof TW.arcilla4.setUmbralVector === "function") {
        TW.arcilla4.setUmbralVector({
          threshold: data?.umbral?.apertura ?? data?.threshold ?? 0.33,
          tension: data?.umbral?.atraccion_central ?? data?.tension ?? 0.33,
          entropy: data?.umbral?.inestabilidad ?? data?.entropy ?? 0.66,
          poemId: data?.id || "arcilla-json"
        });
      }

      const badge = document.querySelector("[data-umbral-readout]");
      if (badge) {
        const a = data?.umbral?.apertura;
        const d = data?.umbral?.dispersion;
        const r = data?.umbral?.retorno;
        badge.textContent = `arcilla · a:${fmt(a)} d:${fmt(d)} r:${fmt(r)}`;
      }

      window.dispatchEvent(new CustomEvent("tw:arcilla:loaded", { detail: data }));
      return data;
    } catch (err) {
      console.warn("[Arcilla Bridge] No se pudo cargar el JSON:", err);
      TW.arcillaJSON = null;
      return null;
    }
  }

  function fmt(v) {
    return Number.isFinite(v) ? v.toFixed(2) : "…";
  }

  TW.loadArcillaJSON = loadArcillaJSON;

  document.addEventListener("DOMContentLoaded", () => {
    loadArcillaJSON();
  }, { once: true });
})();