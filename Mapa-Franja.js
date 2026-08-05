/* js/Mapa-Franja.js — ARCILLA–3.2 (franja en Mapa) */
(() => {
  const STORAGE_KEY = "thewalk.umbral.v1";

  const svg = document.getElementById("franjaSvg");
  const fill = document.getElementById("franja-fill");
  const stroke = document.getElementById("franja-stroke");
  if (!svg || !fill || !stroke) return;

  // --- helpers
  const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));

  function polar(px,py,r,th){
    return {x:px+r*Math.cos(th), y:py+r*Math.sin(th)};
  }

  function arcFlags(t0,t1){
    const d=t1-t0;
    return {largeArc:(Math.abs(d)>Math.PI)?1:0, sweep:(d>=0)?1:0};
  }

  function bandPath(ox,oy,rIn,rOut,t0,t1){
    const a=polar(ox,oy,rOut,t0);
    const b=polar(ox,oy,rOut,t1);
    const c=polar(ox,oy,rIn,t1);
    const d=polar(ox,oy,rIn,t0);

    const fo=arcFlags(t0,t1);
    const fi=arcFlags(t1,t0);

    return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)}
            A ${rOut.toFixed(2)} ${rOut.toFixed(2)} 0 ${fo.largeArc} ${fo.sweep} ${b.x.toFixed(2)} ${b.y.toFixed(2)}
            L ${c.x.toFixed(2)} ${c.y.toFixed(2)}
            A ${rIn.toFixed(2)} ${rIn.toFixed(2)} 0 ${fi.largeArc} ${fi.sweep} ${d.x.toFixed(2)} ${d.y.toFixed(2)} Z`
      .replace(/\s+/g," ");
  }

  function loadUmbral(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    }catch{
      return null;
    }
  }

  // --- map umbral -> geometry
  function geomFromUmbral(u){
    // Defaults sobrios (si no hay umbral aún)
    const threshold = clamp(u?.threshold ?? 0.55, 0, 1);
    const tension   = clamp(u?.tension   ?? 0.45, 0, 1);
    const entropy   = clamp(u?.entropy   ?? 0.55, 0, 1);

    // apertura angular (0.85..2.05)
    const thetaSpan = 0.85 + threshold * 1.20;

    // radios (interno fijo, externo respira por tensión)
    const rIn  = 0.11;
    const rOut = clamp(0.24 + tension * 0.30, 0.22, 0.62);

    // centro (muy estable)
    const ox = 0.50;
    const oy = 0.60;

    // opacidades por umbral (más umbral = más presencia, pero contenida)
    const fillA   = clamp(0.020 + threshold * 0.030, 0.020, 0.060);
    const strokeA = clamp(0.090 + threshold * 0.190, 0.090, 0.320);

    // grosor trazo (tensión lo compacta)
    const strokeW = clamp(1.2 + tension * 1.2, 1.2, 2.6);

    // amplitud respiración (entropía le da más vibración)
    const breathAmp = clamp(0.06 + entropy * 0.12, 0.05, 0.18);

    // velocidad respiración (tensión más alta -> más lenta)
    const breathSpeed = 0.65 + (1 - tension) * 0.55;

    return { ox, oy, rIn, rOut, thetaSpan, fillA, strokeA, strokeW, breathAmp, breathSpeed };
  }

  // --- apply to CSS vars (para que el look se controle por CSS)
  function applyCSSVars(g){
    const root = document.documentElement;
    root.style.setProperty("--franja-fill-a", g.fillA.toFixed(3));
    root.style.setProperty("--franja-stroke-a", g.strokeA.toFixed(3));
    root.style.setProperty("--franja-stroke-w", g.strokeW.toFixed(2));
  }

  let lastKey = "";
  let g = geomFromUmbral(loadUmbral());
  applyCSSVars(g);

  // --- animation loop (breath)
  let t0 = performance.now();

  function tick(now){
    // refresca umbral si cambia (cada ~1s sin setInterval)
    if (((now - t0) | 0) % 1000 < 17) {
      const u = loadUmbral();
      const key = u ? `${u.poemId||""}|${u.threshold}|${u.tension}|${u.entropy}|${u.ts}` : "none";
      if (key && key !== lastKey) {
        lastKey = key;
        g = geomFromUmbral(u);
        applyCSSVars(g);
      }
    }

    const view = 1000;
    const ox = g.ox * view;
    const oy = g.oy * view;

    // respiración: span + rOut micro
    const time = now / 1000;
    const b = Math.sin(time * g.breathSpeed) * g.breathAmp;

    const span = g.thetaSpan * (1 + b * 0.35);
    const rOut = g.rOut * (1 + b * 0.12);

    const tStart = -Math.PI/2 - span*0.40;
    const tEnd   = -Math.PI/2 + span*0.60;

    const d = bandPath(ox, oy, g.rIn*view, rOut*view, tStart, tEnd);

    fill.setAttribute("d", d);
    stroke.setAttribute("d", d);

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();
// TW — Export Umbral to JSON (manual trigger)
window.TW_exportUmbral = function(filename = "thewalk_umbral.json"){
  const data = localStorage.getItem("thewalk.umbral.v1");
  if(!data){
    console.warn("[TW] No hay umbral en localStorage (thewalk.umbral.v1).");
    return false;
  }

  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(()=>URL.revokeObjectURL(url), 500);
  console.log("[TW] Umbral exportado:", filename);
  return true;
};