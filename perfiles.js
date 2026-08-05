// js/perfiles.js
(() => {
  // Un perfil NO dibuja: decide pesos, límites y qué topología preferir.
  // profile = { name, pickTopology(params, metrics) -> "nombreFuncion", tune(params, metrics) -> params }

  const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));

  const Profiles = {
    circa: {
      name: "Circa Stellas",
      pickTopology(p, m){
        return "spiralSector"; // irradiación/deriva
      },
      tune(p, m){
        p.thetaSpan *= 1.08;
        p.warp = clamp(p.warp * 1.15, 0, 0.22);
        p.audio.base = clamp(p.audio.base + 18, 60, 220);
        p.audio.wobble = clamp(p.audio.wobble * 1.10, 0.1, 1.6);
        return p;
      }
    },

    valente: {
      name: "José Ángel Valente",
      pickTopology(p, m){
        return "ribbonFold"; // corte / pliegue austero
      },
      tune(p, m){
        p.thetaSpan *= 0.86;
        p.thickness *= 0.72;
        p.warp = clamp(p.warp * 0.55, 0, 0.12);
        p.cuts = 0; // no decorativo
        p.audio.base = clamp(p.audio.base - 22, 45, 180);
        p.audio.wobble = clamp(p.audio.wobble * 0.65, 0.05, 1.0);
        return p;
      }
    },

    auto: {
      name: "Auto (por literal)",
      pickTopology(p, m){
        return "topologySwitch";
      },
      tune(p){ return p; }
    }
  };

  // Selector: por query (?profile=valente) o por ?m=...
  function getProfile(){
    const q = new URLSearchParams(location.search);
    const name = (q.get("profile") || q.get("m") || "auto").toLowerCase();
    return Profiles[name] || Profiles.auto;
  }

  window.TW_PROFILES = { Profiles, getProfile };
})();