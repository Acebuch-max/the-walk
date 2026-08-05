(function () {
    if (!document.body.classList.contains('mode-rhythm')) return;

    const container = document.querySelector('.ptolomeo--measures');
    if (!container) return;

    const pick = (arr) => arr[Math.floor(R() * arr.length)];
const TW = window.TW;
    const R = (TW && typeof TW.rng === "function") ? TW.rng("Partitura-I") : Math.random;


    // Paletas musicales (cuantizadas): evita el “Cage continuo”
    const DUR_TEXT = (TW?.arcilla4 ? TW.arcilla4.partituraDurations('text', [3,4,6]) : [3,4,6]);
    const DUR_REST = (TW?.arcilla4 ? TW.arcilla4.partituraDurations('rest', [2,3,4]) : [2,3,4]);
    const DUR_DOOR = (TW?.arcilla4 ? TW.arcilla4.partituraDurations('door', [6,8]) : [6,8]);

    // 1) Duraciones
    container.querySelectorAll('article.trios').forEach(el => {
      el.style.setProperty('--dur', pick(DUR_TEXT));
    });

    container.querySelectorAll('.rest').forEach(el => {
      el.style.setProperty('--dur', pick(DUR_REST));
    });

    container.querySelectorAll('a.trios.door').forEach(el => {
      el.style.setProperty('--dur', pick(DUR_DOOR));
    });

    // 2) Reordenación aleatoria (sin mover las puertas del final)
    const shuffle = (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(R() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    const doors = Array.from(container.querySelectorAll('a.trios.door'));
    const anchor = doors[0] || null;

    const movable = Array.from(container.querySelectorAll('article.trios, .rest'))
      .filter(el => !el.classList.contains('door'));

    movable.forEach(el => el.remove());
    shuffle(movable).forEach(el => {
      if (anchor) container.insertBefore(el, anchor);
      else container.appendChild(el);
    });
  })();
  // --- TW: Partitura -> Arcilla-4 (estructura del acto) ---
(() => {
  try {
    const detail = {
      source: "Partitura-I",
      trios: document.querySelectorAll('article.trios').length,
      rests: document.querySelectorAll('.rest').length,
      doors: document.querySelectorAll('a.trios.door').length
    };
    window.dispatchEvent(new CustomEvent("tw:partitura", { detail }));
  } catch(_) {}
})();
