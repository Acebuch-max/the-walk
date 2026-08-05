// js/topologias.js
(() => {
  const TAU = Math.PI * 2;

  // helpers
  const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
  const lerp  = (a,b,t)=>a+(b-a)*t;
  const pick  = (arr, t)=>arr[Math.floor(clamp(t,0,0.9999)*arr.length)];
  const polar = (ox,oy,r,th)=>({x:ox+r*Math.cos(th), y:oy+r*Math.sin(th)});

  // Todas devuelven un "design" normalizado para el renderer:
  // {
  //   family, origin{x,y}, band:{thetaStart,thetaEnd,rInner,rOuter,warp},
  //   nodes:[{t, kind:"return"|"aux"}], extras:{lines:[], arcs:[], paths:[]},
  //   audio:{base,wobble}
  // }

  function annularSector(p){
    const span = clamp(p.thetaSpan, 0.55, 2.2);
    const t0 = -Math.PI/2 - span*0.40;
    const t1 = -Math.PI/2 + span*0.60;

    return {
      family:"annularSector",
      origin:{x:p.ox,y:p.oy},
      band:{
        thetaStart:t0, thetaEnd:t1,
        rInner: clamp(p.rInner, 0.06, 0.25),
        rOuter: clamp(p.rOuter, 0.18, 0.75),
        warp: clamp(p.warp, 0.0, 0.22)
      },
      nodes:[
        {t:0.50, kind:"return"},
        ...(p.nodes>1 ? Array.from({length:p.nodes-1},(_,i)=>({t:(i)/(p.nodes-2||1), kind:"aux"})) : [])
      ],
      extras:{lines:[], arcs:[], paths:[]},
      audio:p.audio
    };
  }

  function spiralSector(p){
    const base = annularSector(p);
    // Idea: el borde exterior "crece" ligeramente con theta (espiral suave)
    // El renderer lo aproximará añadiendo una deformación angular.
    base.family = "spiralSector";
    base.band.spiral = clamp(p.spiral || (0.02 + p.entropy*0.10), 0.0, 0.18);
    return base;
  }

  function concentricDrift(p){
    // Varios arcos concéntricos “cortados”
    const base = annularSector(p);
    base.family = "concentricDrift";
    const rings = clamp(p.rings || (2 + Math.round(p.uniqueRatio*4)), 2, 7);

    base.extras.arcs = Array.from({length:rings},(_,i)=>{
      const t = i/(rings-1);
      const r = lerp(base.band.rInner, base.band.rOuter, t);
      const cut = 0.08 + (p.punct||0)*0.25; // corte angular
      return { r, thetaStart: base.band.thetaStart + cut, thetaEnd: base.band.thetaEnd - cut, alpha: 0.08 + 0.12*t };
    });

    return base;
  }

  function lemniscateGate(p){
    // Umbral doble (∞) abstracto, sin figuración: dos lóbulos como “puerta”
    const base = annularSector(p);
    base.family = "lemniscateGate";

    // Extras: path tipo lemniscata en coords normalizadas, luego el renderer escala al viewBox
    const k = clamp(0.26 + p.vowels*0.18, 0.22, 0.42);
    base.extras.paths.push({
      kind:"lemniscate",
      k,
      alpha: 0.12
    });

    // Nodo return al centro geométrico del “cruce”
    base.nodes = [{t:0.50, kind:"return"}];
    return base;
  }

  function cutLinesField(p){
    // Campo de cortes tangenciales dentro del sector
    const base = annularSector(p);
    base.family = "cutLinesField";
    const n = clamp(p.cuts || (6 + Math.round(p.wordCount*0.5)), 6, 24);

    base.extras.lines = Array.from({length:n},(_,i)=>{
      const t = i/(n-1);
      const th = lerp(base.band.thetaStart, base.band.thetaEnd, t);
      const r = lerp(base.band.rInner, base.band.rOuter, (i%2?0.35:0.65));
      return { th, r, len: 0.08 + (p.entropy*0.12), alpha: 0.06 + 0.10*(1-t) };
    });

    return base;
  }

  function ribbonFold(p){
    // “Cinta plegada”: misma franja pero con ondulación interna + un pliegue (línea)
    const base = annularSector(p);
    base.family = "ribbonFold";
    base.band.fold = clamp(0.04 + p.entropy*0.18, 0.03, 0.28);

    base.extras.lines.push({
      kind:"fold",
      t: 0.52,
      alpha: 0.18
    });

    return base;
  }

  function topologySwitch(p){
    // Cambia familia por palabras-clave (Umbral, Estrella, Silencio…)
    const s = (p.literal||"").toLowerCase();
    const score = (w)=>s.includes(w);

    if (score("umbral") || score("puerta")) return lemniscateGate(p);
    if (score("estrella") || score("stellas")) return spiralSector(p);
    if (score("silencio") || score("vacío") || score("vacio")) return cutLinesField(p);
    if (score("corte") || score("fractura") || score("taj")) return ribbonFold(p);

    // default: tu franja
    return annularSector(p);
  }

  window.TW_TOPOLOGIES = {
    annularSector,
    spiralSector,
    concentricDrift,
    lemniscateGate,
    cutLinesField,
    ribbonFold,
    topologySwitch
  };
})();