// 1) Entrada: literal + modo (por ahora, 2 modos)
const A4 = window.TW?.arcilla4;
const rawLiteral = new URLSearchParams(location.search).get("t")
  || "Ella refleja al Yo en el Umbral";
const rawMode = new URLSearchParams(location.search).get("m")
  || "circa"; // "valente" | "circa"

const patched = A4 ? A4.patchUmbralInput(rawLiteral, rawMode) : { literal: rawLiteral, mode: rawMode };
const literal = patched.literal;
const mode = patched.mode;

// 2) Métricas (deterministas, rápidas)
function analyzeText(s){
  const clean = s.trim();
  const words = clean.toLowerCase().match(/\p{L}+/gu) || [];
  const len = clean.length;
  const uniq = new Set(words).size || 1;
  const uniqueRatio = uniq / Math.max(words.length, 1);

  const punct = (clean.match(/[.,;:!?¿¡—-]/g) || []).length / Math.max(len,1);
  const vowels = (clean.match(/[aeiouáéíóúü]/gi) || []).length / Math.max(len,1);

  const wl = words.map(w=>w.length);
  const mean = wl.reduce((a,b)=>a+b,0)/Math.max(wl.length,1);
  const varc = wl.reduce((a,b)=>a+(b-mean)*(b-mean),0)/Math.max(wl.length,1);
  const entropyLike = Math.min(1, Math.sqrt(varc)/10);

  return {len, wordCount:words.length, uniqueRatio, punct, vowels, entropyLike};
}

// 3) Hash/seed simple (para coherencia)
function hash32(str){
  let h=2166136261>>>0;
  for(let i=0;i<str.length;i++){
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h>>>0;
}
function rand01(seed){
  // xorshift32
  let x = seed>>>0;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  return ((x>>>0) / 4294967295);
}

// 4) Métricas -> parámetros geométricos (tu “mínimo parametrizable”)
function paramsFromMetrics(m, seed){
  const r = ()=>rand01(seed = (seed*1664525 + 1013904223)>>>0);

  const thetaSpan = (0.55 + m.uniqueRatio*0.9 + m.punct*0.6); // rad aprox (0.55..~1.8)
  const thickness = 0.18 + m.vowels*0.35 + m.entropyLike*0.25; // (0.18..0.78)
  const curvature = 0.02 + m.punct*0.12 + r()*0.06;           // (0.02..0.20)
  const drift = 0.03 + m.entropyLike*0.12;                    // para “respirar”
  const ox = 0.50 + (r()-0.5)*0.12;
  const oy = 0.60 + (r()-0.5)*0.12;

  const nodes = Math.max(1, Math.min(5, Math.round(1 + m.wordCount/8 + r()*2)));

  // audio
  const base = 80 + Math.round((m.vowels*140) + r()*40);
  const wobble = 0.2 + m.entropyLike*0.8;

  return {thetaSpan, thickness, curvature, drift, ox, oy, nodes, audio:{base, wobble}};
}

// 5) Topologías (por ahora: 2 presets distintos, misma familia)
function designCirca(p){
  // sector abierto, anillo + nodos radiales
  return {
    family:"annularSector",
    origin:{x:p.ox,y:p.oy},
    thetaStart: -Math.PI/2 - p.thetaSpan*0.35,
    thetaEnd:   -Math.PI/2 + p.thetaSpan*0.65,
    rInner: 0.10,
    rOuter: 0.10 + p.thickness,
    curvature: p.curvature,
    nodes: p.nodes,
    audio: p.audio
  };
}
function designValente(p){
  // más “corte”: más estrecho, más seco, desplazado
  return {
    family:"annularSector",
    origin:{x:p.ox+0.03,y:p.oy-0.02},
    thetaStart: -Math.PI/2 - p.thetaSpan*0.55,
    thetaEnd:   -Math.PI/2 + p.thetaSpan*0.45,
    rInner: 0.14,
    rOuter: 0.14 + p.thickness*0.72,
    curvature: p.curvature*0.55,
    nodes: Math.max(1, Math.round(p.nodes*0.7)),
    audio: { base: Math.max(60, p.audio.base-20), wobble: p.audio.wobble*0.6 }
  };
}

// 6) Render: convierte “diseño” a SVG (viewBox 1000)
function polar(px,py,r,th){ return {x:px+r*Math.cos(th), y:py+r*Math.sin(th)}; }
function arcFlags(t0,t1){ const d=t1-t0; return {largeArc:(Math.abs(d)>Math.PI)?1:0, sweep:(d>=0)?1:0}; }

function bandPath({ox,oy,rIn,rOut,t0,t1,warp}){
  // warp = pequeña deformación radial para “vibración” (no figurativa)
  const w = (th)=> 1 + Math.sin(th*3.0)*warp;

  const a=polar(ox,oy,rOut*w(t0),t0), b=polar(ox,oy,rOut*w(t1),t1);
  const c=polar(ox,oy,rIn*w(t1),t1),  d=polar(ox,oy,rIn*w(t0),t0);
  const fo=arcFlags(t0,t1), fi=arcFlags(t1,t0);

  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)}
          A ${rOut} ${rOut} 0 ${fo.largeArc} ${fo.sweep} ${b.x.toFixed(2)} ${b.y.toFixed(2)}
          L ${c.x.toFixed(2)} ${c.y.toFixed(2)}
          A ${rIn} ${rIn} 0 ${fi.largeArc} ${fi.sweep} ${d.x.toFixed(2)} ${d.y.toFixed(2)} Z`.replace(/\s+/g,' ');
}

function nodePlacements(des, view=1000){
  const ox = des.origin.x*view, oy = des.origin.y*view;
  const rMid = ((des.rInner+des.rOuter)/2)*view;
  const nodes=[];
  for(let i=0;i<des.nodes;i++){
    const t = des.nodes===1 ? 0.5 : (i/(des.nodes-1));
    const th = des.thetaStart + t*(des.thetaEnd-des.thetaStart);
    const p = polar(ox,oy,rMid,th);
    nodes.push({x:p.x/view, y:p.y/view, theta:th});
  }
  return nodes;
}

function render(des){
  const view=1000;
  const ox=des.origin.x*view, oy=des.origin.y*view;
  const rIn=des.rInner*view, rOut=des.rOuter*view;
  const t0=des.thetaStart, t1=des.thetaEnd;

  document.querySelector("#band-fill").setAttribute("d", bandPath({ox,oy,rIn,rOut,t0,t1,warp:des.curvature}));
  document.querySelector("#band-stroke").setAttribute("d", bandPath({ox,oy,rIn,rOut,t0,t1,warp:des.curvature}).replace(/Z$/,''));

  // origen clicable (si quieres atarlo exacto al origen del diseño)
  const origin = document.querySelector("#origin-link");
  origin.style.left = (des.origin.x*100)+"%";
  origin.style.top  = (des.origin.y*100)+"%";

  // nodo “vuelta” = el primero por defecto (o el central si prefieres)
  const nodes = nodePlacements(des, view);
  const idx = Math.floor(nodes.length/2);
  const n = nodes[idx];
  const ret = document.querySelector("#return-link");
  ret.style.left = (n.x*100)+"%";
  ret.style.top  = (n.y*100)+"%";
  ret.querySelector(".return-node").style.transform = `rotate(${n.theta}rad)`;

  return des;
}

// 7) Audio: autostart con unlock por gesto (como ya hicimos)
let ctx=null,osc=null,gain=null;
const btn = document.getElementById("sound-toggle");

async function startAudio(baseHz, wobble){
  if(!ctx){
    ctx=new (window.AudioContext||window.webkitAudioContext)();
    osc=ctx.createOscillator();
    gain=ctx.createGain();
    osc.type="sine";
    osc.frequency.value=baseHz;
    gain.gain.value=0.00001;
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start();

    // wobble suave
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type="sine";
    lfo.frequency.value = 0.06 + wobble*0.18;
    lfoGain.gain.value = 2.0 + wobble*7.0;
    lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
    lfo.start();
  }
  try{ await ctx.resume(); }catch(e){}
  if(ctx.state==="running"){
    const t=ctx.currentTime;
    gain.gain.exponentialRampToValueAtTime(0.02, t+0.6);
    btn.textContent="STOP";
    return true;
  }
  btn.textContent="STOP";
  return false;
}

function stopAudio(){
  if(!ctx) return;
  const t=ctx.currentTime;
  gain.gain.exponentialRampToValueAtTime(0.00001, t+0.3);
  setTimeout(()=>{ try{osc.stop();}catch(e){} try{ctx.close();}catch(e){} ctx=null; osc=null; gain=null; btn.textContent="SONIDO"; }, 360);
}

btn.addEventListener("click", async ()=>{ if(ctx) stopAudio(); });

// 8) Orquestación
const m = analyzeText(literal);
const seed = hash32(literal + "|" + mode);
const p0 = paramsFromMetrics(m, seed);
const p = A4 ? A4.patchUmbralParams({ metrics: m, seed, params: p0, mode, literal }) : p0;
const des = (mode==="valente" ? designValente(p) : designCirca(p));
render(des);

// autostart (si bloquea, se desbloquea al primer gesto)
window.addEventListener("load", async ()=>{
  const ok = await startAudio(des.audio.base, des.audio.wobble);
  if(!ok){
    const unlock = async ()=>{
      const ok2 = await startAudio(des.audio.base, des.audio.wobble);
      if(ok2){
        window.removeEventListener("pointerdown", unlock, true);
        window.removeEventListener("keydown", unlock, true);
        window.removeEventListener("touchstart", unlock, true);
      }
    };
    window.addEventListener("pointerdown", unlock, true);
    window.addEventListener("keydown", unlock, true);
    window.addEventListener("touchstart", unlock, true);
  }
});
function exportUmbral(){
  const data = localStorage.getItem("thewalk.umbral.v1");
  if(!data) return;

  const blob = new Blob([data], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "thewalk_umbral.json";
  a.click();
}