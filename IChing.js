/* =========================================================
   THE WALK — I CHING (JS)  — LIMPIO
   Ritual: 6 tiradas, 3 monedas (cara=3, cruz=2)
   Salidas: primario + resultante + líneas móviles + trigramas
   + Identificación: nº y nombre (Rey Wen / Wilhelm)
   + Comentario The Walk (estructural / poético, modulado por --breath)
   Ética: no sustituye al libro; no reproduce traducciones propietarias.
   ========================================================= */

(() => {
  // ----------------------------
  // DOM
  // ----------------------------
  const btnTirar = document.getElementById("btnTirar");
  const btnDeshacer = document.getElementById("btnDeshacer");
  const btnReiniciar = document.getElementById("btnReiniciar");

  const listaTiradas = document.getElementById("listaTiradas");

  const hexPrimario = document.getElementById("hexPrimario");
  const hexResultante = document.getElementById("hexResultante");

  const numPrimario = document.getElementById("numPrimario");
  const nomPrimario = document.getElementById("nomPrimario");
  const numResultante = document.getElementById("numResultante");
  const nomResultante = document.getElementById("nomResultante");

  const sentPrimario = document.getElementById("sentPrimario");     // opcional
  const sentResultante = document.getElementById("sentResultante"); // opcional

  const lineasMoviles = document.getElementById("lineasMoviles");

  const triInf = document.getElementById("triInf");
  const triSup = document.getElementById("triSup");
  const tipoCambio = document.getElementById("tipoCambio");

  const twComment = document.getElementById("twComment");

  if (!btnTirar || !listaTiradas || !hexPrimario || !hexResultante) {
    console.warn("[IChing] Faltan elementos en el DOM. Revisa IDs del HTML.");
    return;
  }

  // ----------------------------
  // Config
  // ----------------------------
  const COIN_HEADS = 3; // cara
  const COIN_TAILS = 2; // cruz

  /** @type {{coins:number[], sum:number}[]} */
  let throws = [];

  // ----------------------------
  // Trigramas (bits abajo->arriba)
  // yang = 1, yin = 0
  // ----------------------------
  const TRIGRAMS = [
    { bits: 0b111, key: "Cielo",    glyph: "☰" },
    { bits: 0b011, key: "Lago",     glyph: "☱" },
    { bits: 0b101, key: "Fuego",    glyph: "☲" },
    { bits: 0b001, key: "Trueno",   glyph: "☳" },
    { bits: 0b110, key: "Viento",   glyph: "☴" },
    { bits: 0b010, key: "Agua",     glyph: "☵" },
    { bits: 0b100, key: "Montaña",  glyph: "☶" },
    { bits: 0b000, key: "Tierra",   glyph: "☷" },
  ];

  function trigramFromBits(bits) {
    const t = TRIGRAMS.find(x => x.bits === bits);
    return t || { bits, key: "—", glyph: "—" };
  }

  // ----------------------------
  // Tabla 64 (Rey Wen) — binario abajo->arriba (0 yin, 1 yang)
  // ----------------------------
  const BIN_BY_NUM = [
    null,
    "111111","000000","010001","100010","010111","111010","000010","010000",
    "110111","111011","000111","111000","111101","101111","000100","001000",
    "011001","100110","000011","110000","101001","100101","100000","000001",
    "111001","100111","100001","011110","010010","101101","011100","001110",
    "111100","001111","101000","000101","110101","101011","010100","001010",
    "100011","110001","011111","111110","011000","000110","011010","010110",
    "011101","101110","001001","100100","110100","001011","001101","101100",
    "110110","011011","110010","010011","110011","001100","010101","101010"
  ];

  const NOMBRE_BY_NUM = [
    null,
    "Lo Creativo","Lo Receptivo","La Dificultad Inicial","La Necedad Juvenil","La Espera","El Pleito",
    "El Ejército","La Solidaridad","La Fuerza de lo Pequeño","El Porte","La Paz","El Estancamiento",
    "Comunidad con los Hombres","La Posesión de lo Grande","La Modestia","El Entusiasmo","El Seguimiento",
    "La Obra en lo Echado a Perder","La Aproximación","La Contemplación","Morder y Aprehender","La Gracia",
    "La Desintegración","El Retorno","La Inocencia","La Fuerza de lo Grande","Las Comisuras de la Boca",
    "La Preponderancia de lo Grande","Lo Abismal","Lo Adherente","La Influencia","La Duración","La Retirada",
    "El Poder de lo Grande","El Progreso","El Oscurecimiento de la Luz","La Familia","La Oposición","El Obstáculo",
    "La Liberación","La Merma","El Aumento","La Resolución","El Encuentro","La Reunión","El Ascenso","La Opresión",
    "El Pozo","La Revolución","El Caldero","La Conmoción","La Quietud","El Desarrollo","La Muchacha que se Casa",
    "La Abundancia","El Viajero","Lo Suave","Lo Jubiloso","La Disolución","La Limitación","La Verdad Interior",
    "La Preponderancia de lo Pequeño","Después de la Consumación","Antes de la Consumación"
  ];

  // Sentencias propias opcionales (si quieres)
  const SENTENCIA_BY_NUM = {
    // 44: "…",
  };

  const HEXAGRAMS = (() => {
    const map = {};
    for (let n = 1; n <= 64; n++) {
      const bin = BIN_BY_NUM[n];
      map[bin] = {
        num: n,
        nombre: NOMBRE_BY_NUM[n] || `Hexagrama ${n}`,
        sentencia: SENTENCIA_BY_NUM[n] || ""
      };
    }
    return map;
  })();

  // ----------------------------
  // Utilidades
  // ----------------------------
  const randBool = () => Math.random() < 0.5;

  function rollOneThrow() {
    const coins = [0, 0, 0].map(() => (randBool() ? COIN_HEADS : COIN_TAILS));
    const sum = coins[0] + coins[1] + coins[2];
    return { coins, sum };
  }

  function lineInfoFromSum(sum) {
    if (sum === 6) return { yinYang: "yin",  moving: true  };
    if (sum === 7) return { yinYang: "yang", moving: false };
    if (sum === 8) return { yinYang: "yin",  moving: false };
    if (sum === 9) return { yinYang: "yang", moving: true  };
    return { yinYang: "—", moving: false };
  }

  function prettyCoins(coins) {
    return coins.map(n => String(n)).join(" ");
  }

  function binArrayToKey(bin6) {
    // bin6 abajo->arriba
    return bin6.join("");
  }

  function lookupHex(bin6) {
    const key = binArrayToKey(bin6);
    return HEXAGRAMS[key] || { num: "—", nombre: "—", sentencia: "" };
  }

  function computeLinesFromThrows() {
    return throws.map(t => {
      const info = lineInfoFromSum(t.sum);
      return { ...info, sum: t.sum };
    });
  }

  function computePrimaryBinary(lines) {
    return lines.map(L => (L.yinYang === "yang" ? 1 : 0));
  }

  function computeResultBinary(lines) {
    return lines.map(L => {
      const bit = (L.yinYang === "yang" ? 1 : 0);
      return L.moving ? (bit ^ 1) : bit;
    });
  }

  function getMovingLineNumbers(lines) {
    const res = [];
    for (let i = 0; i < lines.length; i++) if (lines[i].moving) res.push(i + 1);
    return res;
  }

  function trigramBitsFromBinary3(bin3) {
    return (bin3[0] << 0) | (bin3[1] << 1) | (bin3[2] << 2);
  }

  function getBreath() {
    const v = getComputedStyle(document.documentElement).getPropertyValue("--breath").trim();
    const n = Number(v);
    return Number.isFinite(n) ? n : 0.5;
  }

  // ----------------------------
  // Render
  // ----------------------------
  function renderThrows() {
    const items = Array.from(listaTiradas.querySelectorAll(".throw"));
function binArrayToKey(bin6) {
  return bin6.join("");
}function binArrayToKey(bin6) {
  // Convertimos de abajo→arriba a arriba→abajo
  return bin6.slice().reverse().join("");
}

    for (let i = 0; i < 6; i++) {
      const li = items[i];
      if (!li) continue;

      const n = li.querySelector(".throw__n");
      const coinsEl = li.querySelector(".throw__coins");
      const sumEl = li.querySelector(".throw__sum");
      const lineEl = li.querySelector(".throw__line");

      if (n) n.textContent = String(i + 1);

      if (throws[i]) {
        li.classList.remove("throw--empty");
        const t = throws[i];
        const info = lineInfoFromSum(t.sum);

        if (coinsEl) coinsEl.textContent = prettyCoins(t.coins);
        if (sumEl) sumEl.textContent = String(t.sum);

        let txt = "—";
        if (t.sum === 6) txt = "yin móvil (6)";
        if (t.sum === 7) txt = "yang fijo (7)";
        if (t.sum === 8) txt = "yin fijo (8)";
        if (t.sum === 9) txt = "yang móvil (9)";
        if (lineEl) lineEl.textContent = txt;

        li.style.borderLeft = info.moving ? "2px solid rgba(253,100,0,.55)" : "2px solid transparent";
        li.style.paddingLeft = info.moving ? "16px" : "";
      } else {
        li.classList.add("throw--empty");
        if (coinsEl) coinsEl.textContent = "— — —";
        if (sumEl) sumEl.textContent = "—";
        if (lineEl) lineEl.textContent = "—";
        li.style.borderLeft = "";
        li.style.paddingLeft = "";
      }
    }

    if (btnDeshacer) btnDeshacer.disabled = throws.length === 0;
    if (btnTirar) btnTirar.disabled = throws.length >= 6;
  }

  function renderHexGlyph(container, bin6, movingLinesSet = null) {
    container.innerHTML = "";
    // Visual: de arriba a abajo; bin6 viene abajo->arriba
    for (let i = 5; i >= 0; i--) {
      const bit = bin6[i];
      const div = document.createElement("div");
      div.className = "line " + (bit === 1 ? "line--yang" : "line--yin");

      const lineNumber = i + 1; // 1 abajo, 6 arriba
      if (movingLinesSet && movingLinesSet.has(lineNumber)) div.classList.add("line--moving");

      container.appendChild(div);
    }
  }

  function renderMovingLines(movingNums) {
    if (!lineasMoviles) return;
    lineasMoviles.innerHTML = "";

    if (!movingNums.length) {
      const li = document.createElement("li");
      li.className = "moving__empty";
      li.textContent = "—";
      lineasMoviles.appendChild(li);
      return;
    }
    for (const n of movingNums) {
      const li = document.createElement("li");
      li.textContent = `Línea ${n}`;
      lineasMoviles.appendChild(li);
    }
  }

  function renderStructure(primaryBin) {
    if (!triInf || !triSup || primaryBin.length < 6) {
      if (triInf) triInf.textContent = "—";
      if (triSup) triSup.textContent = "—";
      return;
    }

    const lower3 = primaryBin.slice(0, 3);
    const upper3 = primaryBin.slice(3, 6);

    const tInf = trigramFromBits(trigramBitsFromBinary3(lower3));
    const tSup = trigramFromBits(trigramBitsFromBinary3(upper3));

    triInf.textContent = `${tInf.glyph} ${tInf.key}`;
    triSup.textContent = `${tSup.glyph} ${tSup.key}`;
  }

  function renderHexMeta(primaryBin, resultBin) {
    if (!numPrimario || !nomPrimario || !numResultante || !nomResultante) return;

    if (primaryBin.length < 6 || resultBin.length < 6) {
      numPrimario.textContent = "—";
      nomPrimario.textContent = "—";
      numResultante.textContent = "—";
      nomResultante.textContent = "—";
      if (sentPrimario) sentPrimario.textContent = "—";
      if (sentResultante) sentResultante.textContent = "—";
      return;
    }

    const p = lookupHex(primaryBin);
    const r = lookupHex(resultBin);

    numPrimario.textContent = String(p.num);
    nomPrimario.textContent = p.nombre;

    numResultante.textContent = String(r.num);
    nomResultante.textContent = r.nombre;

    if (sentPrimario) sentPrimario.textContent = p.sentencia ? p.sentencia : "—";
    if (sentResultante) sentResultante.textContent = r.sentencia ? r.sentencia : "—";
  }

  function renderTWComment(primaryBin, movingNums) {
    if (!twComment) return;

    if (!primaryBin || primaryBin.length < 6) {
      twComment.innerHTML = `<p class="muted">Aparecerá cuando completes las 6 líneas.</p>`;
      return;
    }

    const breath = getBreath();
    const phase =
      breath < 0.35 ? "contracción" :
      breath < 0.70 ? "fluidez" :
      "expansión";

    const firmCount = primaryBin.reduce((a,b)=>a+b,0);
    const blandCount = 6 - firmCount;

    const lower3 = primaryBin.slice(0, 3);
    const upper3 = primaryBin.slice(3, 6);
    const tInf = trigramFromBits(trigramBitsFromBinary3(lower3));
    const tSup = trigramFromBits(trigramBitsFromBinary3(upper3));

    const movingCount = movingNums.length;
function makePoeticDictamen({
  firmCount, movingNums, tInfKey, tSupKey, breath, primaryCode, resultCode
}) {
  const movingCount = movingNums.length;

  // semilla determinista suave
  const seed =
    (parseInt(String(primaryCode || "").replace(/\D/g, "") || "0", 10) || 0)
    + firmCount * 17
    + movingCount * 31
    + Math.floor(breath * 100);

  const phase =
    breath < 0.35 ? 0 : breath < 0.70 ? 1 : 2; // 0 contrae, 1 fluye, 2 expande

  const pick = (arr, s) => arr[Math.abs(s) % arr.length];

  // --- Bancos de voz (más aforísticos) ---
  const open = [
    "Antes de la respuesta: aire.",
    "El mundo no contesta: inclina.",
    "Algo en ti ya se movía.",
    "Silencio. Luego forma.",
    "No mires el signo: mira el pulso."
  ];

  const firmHeavy = [
    "La estructura aprieta. No la conviertas en sentencia.",
    "Sostén el borde, sin endurecerlo.",
    "Si insistes, se rompe. Si cedes, se pierde."
  ];

  const softHeavy = [
    "Lo blando abre paso. No lo empujes: acompáñalo.",
    "Deja que el vacío trabaje por ti.",
    "La forma llega cuando no la persigues."
  ];

  const mid = [
    "Equilibrio: gesto mínimo, efecto grande.",
    "No hay victoria: hay ajuste.",
    "El centro pide precisión, no fuerza."
  ];

  const noMutation = [
    "Nada cambia por fuera. La mutación es interna.",
    "La quietud también decide.",
    "No fuerces: deja que madure."
  ];

  const localMutation = [
    "Un punto gira. No lo confundas con todo.",
    "Una bisagra basta.",
    "Toca lo justo y retira la mano."
  ];

  const strongMutation = [
    "El cambio ya está ocurriendo: no lo detengas.",
    "Demasiada fijación aquí sería violencia.",
    "Respira: el mapa migra solo."
  ];

  // Breath, sin nombrar breath: lo insinuamos
  const breathWhisper = [
    "Hoy el aire contrae.",
    "Hoy el aire fluye.",
    "Hoy el aire expande."
  ];

  const closers = [
    "Luego, abre el libro.",
    "Vuelve a la pregunta y cámbiala una palabra.",
    "Camina una decisión pequeña."
  ];

  // --- Construcción: 5–7 líneas, sin exceso ---
  const out = [];

  out.push(pick(open, seed));

  if (firmCount >= 4) out.push(pick(firmHeavy, seed + 1));
  else if (firmCount <= 2) out.push(pick(softHeavy, seed + 2));
  else out.push(pick(mid, seed + 3));

  if (movingCount === 0) out.push(pick(noMutation, seed + 4));
  else if (movingCount <= 2) out.push(pick(localMutation, seed + 5));
  else out.push(pick(strongMutation, seed + 6));

  // Topología implícita: “dos corrientes” pero sin tecnicismo
  out.push(`Abajo ${tInfKey}. Arriba ${tSupKey}. Dos aguas rozándose.`);

  // recursividad moriniana insinuada: “hoy el aire…”
  out.push(breathWhisper[phase]);

  // cierre
  out.push(pick(closers, seed + 7));

  // transformación, solo si existe
  if (resultCode && primaryCode && resultCode !== primaryCode) {
    out.push(`Cambio de forma: ${primaryCode} → ${resultCode}.`);
  }

  return out;
}

    // Poema breve, The Walk, pero siempre coherente con el estado real
    const out = [];
    out.push(`<span style="color:#f80a0f">Estructura:</span> ${firmCount} Firme / ${blandCount} Blando.`);
    out.push(`<span style="color:#f80a0f">Tramas:</span> abajo ${tInf.key} · arriba ${tSup.key}.`);
    out.push(
      `<span style="color:#f80a0f">Mutación:</span> ${
        movingCount ? `líneas móviles (${movingNums.join(", ")})` : "sin líneas móviles"
      }.`
    );
    out.push(`<span style="color:#f80a0f">Respiración:</span> ${phase}.`);

    if (movingCount === 0) out.push("No empujes. El sentido ya está en el borde.");
    else if (movingCount === 1) out.push("Una sola fibra cambia: toca ahí, y el resto seguirá.");
    else if (movingCount === 2) out.push("Dos cambios: escucha el ritmo entre ambos.");
    else out.push("Mucho movimiento: no persigas forma; acompasa la deriva.");

    out.push("Nada aquí está aislado: el estado global inclina la lectura.");

    twComment.innerHTML = out.map(t => `<p>${t}</p>`).join("");
  }

  function renderAll() {
    renderThrows();

    if (throws.length < 6) {
      renderHexGlyph(hexPrimario, [0,0,0,0,0,0]);
      renderHexGlyph(hexResultante, [0,0,0,0,0,0]);
      renderMovingLines([]);
      renderStructure([]);
      renderHexMeta([], []);
      if (tipoCambio) tipoCambio.textContent = "—";
      renderTWComment(null, []);
      return;
    }

    const lines = computeLinesFromThrows();
    const primaryBin = computePrimaryBinary(lines);
    const resultBin = computeResultBinary(lines);
    const movingNums = getMovingLineNumbers(lines);

    const movingSet = new Set(movingNums);

    renderHexGlyph(hexPrimario, primaryBin, movingSet);
    renderHexGlyph(hexResultante, resultBin, null);

    renderMovingLines(movingNums);
    renderStructure(primaryBin);

    if (tipoCambio) {
      if (!movingNums.length) tipoCambio.textContent = "Sin líneas móviles";
      else if (movingNums.length === 1) tipoCambio.textContent = "1 línea móvil";
      else tipoCambio.textContent = `${movingNums.length} líneas móviles`;
    }

    renderHexMeta(primaryBin, resultBin);
    renderTWComment(primaryBin, movingNums);
  }

  // ----------------------------
  // Eventos
  // ----------------------------
  btnTirar?.addEventListener("click", () => {
    if (throws.length >= 6) return;
    throws.push(rollOneThrow());
    renderAll();
  });

  btnDeshacer?.addEventListener("click", () => {
    if (!throws.length) return;
    throws.pop();
    renderAll();
  });

  btnReiniciar?.addEventListener("click", () => {
    throws = [];
    renderAll();
  });

  // Init
  renderAll();
})();
