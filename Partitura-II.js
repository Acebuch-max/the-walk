(function () {
  if (!document.body.classList.contains('mode-rhythm')) return;

  const container = document.querySelector('.ptolomeo--measures');
  if (!container) return;

  const pick = (arr) => arr[Math.floor(R() * arr.length)];
const TW = window.TW;
    const R = (TW && typeof TW.rng === "function") ? TW.rng("Partitura-II") : Math.random;


  // Paletas musicales (cuantizadas)
  const DUR_TEXT = (TW?.arcilla4 ? TW.arcilla4.partituraDurations('text', [3,4,6]) : [3,4,6]);
  const DUR_REST = (TW?.arcilla4 ? TW.arcilla4.partituraDurations('rest', [2,3,4]) : [2,3,4]);
  const DUR_DOOR = (TW?.arcilla4 ? TW.arcilla4.partituraDurations('door', [6,8]) : [6,8]);

  // Helpers
  const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(R() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // 0) Captura elementos
  const triads = Array.from(container.querySelectorAll('article.trios'));     // q01..q07
  const rests  = Array.from(container.querySelectorAll('.rest'));            // r11..r14 (y r13 con texto)
  const doors  = Array.from(container.querySelectorAll('a.trios.door'));     // puertas

  if (!triads.length) return;

  // 1) Duraciones (solo para los elementos que usaremos)
  triads.forEach(el => el.style.setProperty('--dur', pick(DUR_TEXT)));
  rests.forEach(el => el.style.setProperty('--dur', pick(DUR_REST)));
  doors.forEach(el => el.style.setProperty('--dur', pick(DUR_DOOR)));

  // 2) Elegir UNA tríada (la “voz”)
  const chosen = pick(triads);

  // 3) Limpiar: fuera todas las tríadas salvo la elegida
  triads.forEach(el => {
    if (el !== chosen) el.remove();
  });

  // 4) Reordenar solo los rests + insertar la tríada elegida en medio
  //    (quedará “rodeada” por silencios)
  rests.forEach(el => el.remove());
  chosen.remove();

  shuffle(rests);

  // Punto de inserción: mitad de los rests (si hay pocos, sigue funcionando)
  const mid = Math.floor(rests.length / 2);

  // Reinsertar: rests (0..mid-1) + tríada + rests (mid..)
  const beforeDoorsAnchor = doors[0] || null;

  const insert = (node) => {
    if (beforeDoorsAnchor) container.insertBefore(node, beforeDoorsAnchor);
    else container.appendChild(node);
  };

  rests.slice(0, mid).forEach(insert);
  insert(chosen);
  rests.slice(mid).forEach(insert);

  // 5) Puertas: para cumplir “solo rests alrededor” tienes dos opciones:
  //    A) Mantener puertas (siguen al final, no rodean la tríada)
  //    B) Ocultarlas en modo-rhythm (más puro)
  //
  // Elige UNA:
  const HIDE_DOORS_IN_RHYTHM = false; // <-- pon true si quieres ocultarlas

  if (HIDE_DOORS_IN_RHYTHM) {
    doors.forEach(d => d.style.display = 'none');
  } else {
    // si por el shuffle previo alguna puerta se movió, las fijamos al final:
    doors.forEach(d => { d.remove(); container.appendChild(d); });
  }
})();
// --- TW: Partitura -> Arcilla-4 (estructura del acto) ---
(() => {
  try {
    const detail = {
      source: "Partitura-II",
      trios: document.querySelectorAll('article.trios').length,
      rests: document.querySelectorAll('.rest').length,
      doors: document.querySelectorAll('a.trios.door').length
    };
    window.dispatchEvent(new CustomEvent("tw:partitura", { detail }));
  } catch(_) {}
})();
