(function () {
    const img = document.getElementById("habitarImg");
    const frame = document.getElementById("frame");
    const loupe = document.getElementById("loupe");
    const toggle = document.getElementById("toggleLoupe");
    const goGallery = document.getElementById("goGallery");

    // === CONFIG RÁPIDA ===
    const ZOOM = 2.6;           // 2.0–4.0 suele ir bien
    const LOUPE_SIZE = 220;     // px (diámetro)
    const SHOW_GALLERY_LINK = false; // pon true cuando tengas URL
    const GALLERY_URL = "https://TU-URL-DE-GALERIA.example"; // <- cambia esto

    // Ajustes iniciales
    loupe.style.setProperty("--size", LOUPE_SIZE + "px");
    loupe.style.setProperty("--zoom", ZOOM);
    goGallery.style.display = SHOW_GALLERY_LINK ? "inline-flex" : "none";
    if (SHOW_GALLERY_LINK) goGallery.href = GALLERY_URL;

    let enabled = true;
    let pointerDown = false;

    // Cuando la imagen carga, usamos su src como background de la lupa
    function syncLoupeImage() {
      loupe.style.backgroundImage = `url("${img.currentSrc || img.src}")`;
      loupe.style.backgroundRepeat = "no-repeat";
    }
    if (img.complete) syncLoupeImage();
    img.addEventListener("load", syncLoupeImage);

    function setLoupeVisibility(on) {
      enabled = on;
      toggle.setAttribute("aria-pressed", String(on));
      loupe.classList.toggle("loupe--off", !on);
      if (!on) loupe.style.opacity = "0";
    }

    toggle.addEventListener("click", () => setLoupeVisibility(!enabled));

    function getPointer(e) {
      const frameRect = frame.getBoundingClientRect();
      const imgRect = img.getBoundingClientRect();

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      // Posición dentro del frame (para mover la lupa en pantalla)
      const xF = clientX - frameRect.left;
      const yF = clientY - frameRect.top;

      // Posición dentro de la imagen real renderizada (para el zoom SIN deformar)
      const xI = clientX - imgRect.left;
      const yI = clientY - imgRect.top;

      return { frameRect, imgRect, xF, yF, xI, yI, clientX, clientY };
    }

    function clamp(v, min, max) {
      return Math.max(min, Math.min(max, v));
    }

    function moveLoupe(e) {
      if (!enabled) return;

      // En touch: solo mover mientras hay dedo apoyado
      if (e.touches && !pointerDown) return;

      const { frameRect, imgRect, xF, yF, xI, yI } = getPointer(e);

      // Clamp de la lupa dentro del frame (para que no se salga)
      const clampedXF = clamp(xF, 0, frameRect.width);
      const clampedYF = clamp(yF, 0, frameRect.height);

      // Clamp del muestreo dentro de la imagen (clave para evitar deformación en móvil)
      const clampedXI = clamp(xI, 0, imgRect.width);
      const clampedYI = clamp(yI, 0, imgRect.height);

      loupe.style.opacity = "1";
      loupe.style.transform =
        `translate(${clampedXF}px, ${clampedYF}px) translate(-50%, -50%)`;

      // Background size = imagen renderizada * zoom (no el frame)
      const bgW = imgRect.width * ZOOM;
      const bgH = imgRect.height * ZOOM;
      loupe.style.backgroundSize = `${bgW}px ${bgH}px`;

      // Background position: centrar el punto ampliado dentro de la lupa
      const bgX = -(clampedXI * ZOOM) + (LOUPE_SIZE / 2);
      const bgY = -(clampedYI * ZOOM) + (LOUPE_SIZE / 2);
      loupe.style.backgroundPosition = `${bgX}px ${bgY}px`;
    }

    function hideLoupe() {
      if (pointerDown) return;
      loupe.style.opacity = "0";
    }

    // Desktop
    frame.addEventListener("mousemove", moveLoupe);
    frame.addEventListener("mouseenter", () => { if (enabled) loupe.style.opacity = "1"; });
    frame.addEventListener("mouseleave", hideLoupe);

    // Touch
    frame.addEventListener("touchstart", (e) => { pointerDown = true; moveLoupe(e); }, { passive: true });
    frame.addEventListener("touchmove", (e) => moveLoupe(e), { passive: true });
    frame.addEventListener("touchend", () => { pointerDown = false; hideLoupe(); });

    // Accesibilidad: teclado (mostrar en centro)
    frame.addEventListener("focus", () => {
      if (!enabled) return;
      const rect = img.getBoundingClientRect();
      const fake = { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 };
      moveLoupe(fake);
    });

    // Evitar drag fantasma en la imagen
    img.addEventListener("dragstart", (e) => e.preventDefault());
  })();