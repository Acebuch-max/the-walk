(function () {
  if (!document.body.classList.contains('mode-rhythm')) return;

  const container = document.querySelector('.ptolomeo--measures');
  if (!container) return;

  const pick = (arr) => arr[Math.floor(R() * arr.length)];
const TW = window.TW;
    const R = (TW && typeof TW.rng === "function") ? TW.rng("Partitura-III") : Math.random;


  const DUR_TEXT = (TW?.arcilla4 ? TW.arcilla4.partituraDurations('text', [3,4,6]) : [3,4,6]);
  const DUR_REST = (TW?.arcilla4 ? TW.arcilla4.partituraDurations('rest', [2,3,4]) : [2,3,4]);
  const DUR_DOOR = (TW?.arcilla4 ? TW.arcilla4.partituraDurations('door', [6,8]) : [6,8]);

  const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(R() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // 0) Captura real según tu HTML
  const triads = Array.from(container.querySelectorAll('article.trios'));
  const rests  = Array.from(container.querySelectorAll('.rest'));
  const doors  = Array.from(container.querySelectorAll('a.trios.door'));

  if (triads.length < 2) return;

  // 1) Asignar duraciones
  triads.forEach(el => el.style.setProperty('--dur', pick(DUR_TEXT)));
  rests.forEach(el  => el.style.setProperty('--dur', pick(DUR_REST)));
  doors.forEach(el  => el.style.setProperty('--dur', pick(DUR_DOOR)));

  // 2) Elegir DOS tríadas distintas
  const pool = [...triads];
  const chosen1 = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
  const chosen2 = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];

  // 3) Eliminar todas las demás tríadas
  triads.forEach(el => {
    if (el !== chosen1 && el !== chosen2) el.remove();
  });

  // 4) Reorganizar: rests + tríada + rests + tríada + rests
  rests.forEach(el => el.remove());
  chosen1.remove();
  chosen2.remove();

  shuffle(rests);

  const anchor = doors[0] || null;

  const insert = (node) => {
    if (anchor) container.insertBefore(node, anchor);
    else container.appendChild(node);
  };

  const third = Math.floor(rests.length / 3);

  // rests iniciales
  rests.slice(0, third).forEach(insert);

  // primera tríada
  insert(chosen1);

  // rests intermedios
  rests.slice(third, third * 2).forEach(insert);

  // segunda tríada
  insert(chosen2);

  // rests finales
  rests.slice(third * 2).forEach(insert);

  // 5) Puertas: las dejamos al final como están
  doors.forEach(d => {
    d.remove();
    container.appendChild(d);
  });

})();
// --- TW: Partitura -> Arcilla-4 (estructura del acto) ---
(() => {
  try {
    const detail = {
      source: "Partitura-III",
      trios: document.querySelectorAll('article.trios').length,
      rests: document.querySelectorAll('.rest').length,
      doors: document.querySelectorAll('a.trios.door').length
    };
    window.dispatchEvent(new CustomEvent("tw:partitura", { detail }));
  } catch(_) {}
})();
