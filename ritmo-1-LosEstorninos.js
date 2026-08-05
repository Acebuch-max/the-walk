const IMAGE_SRC = "graficos/PUERTAS/LaReinaDelCielo.jpg";
const AUDIO_SRC = "audio/Sesión Mi-m-Nada ahí fuera-3.mp3";

const canvas = document.getElementById("ritmoCanvas");
const ctx = canvas.getContext("2d");

const startButton = document.getElementById("startButton");
const exitButton = document.getElementById("exitButton");
const statusBox = document.getElementById("status");

const ritmoExit = document.getElementById("ritmoExit");
const popupBackdrop = document.getElementById("popupBackdrop");
const closePopupButton = document.getElementById("closePopupButton");
let W = canvas.width = window.innerWidth;
let H = canvas.height = window.innerHeight;

let particles = [];
let imageReady = false;
let started = false;
let time = 0;
let currentImage = null;
let rebuildTimeout = null;

let audioContext = null;
let analyser = null;
let audioElement = null;
let frequencyData = null;

let tiltX = 0;
let tiltY = 0;
function openExitPopup() {
  if (ritmoExit) ritmoExit.hidden = false;
}

function closeExitPopup() {
  if (ritmoExit) ritmoExit.hidden = true;
}

if (exitButton) {
  exitButton.addEventListener("click", openExitPopup);
}

if (popupBackdrop) {
  popupBackdrop.addEventListener("click", closeExitPopup);
}

if (closePopupButton) {
  closePopupButton.addEventListener("click", closeExitPopup);
}

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && ritmoExit && !ritmoExit.hidden) {
    closeExitPopup();
  }
});
function getDeviceFlags() {
  return {
    isMobile: window.innerWidth < 680,
    isTablet: window.innerWidth < 1024
  };
}

function getConfig() {
  const { isMobile, isTablet } = getDeviceFlags();

  return {
    sampleStep: isMobile ? 7 : isTablet ? 6 : 5,
    particleSize: isMobile ? 1.8 : isTablet ? 1.6 : 1.5,
    alphaThreshold: 100,

    baseReturn: isMobile ? 0.034 : 0.18,
    friction: 0.9,

    maxOffset: isMobile ? 24 : isTablet ? 26 : 100,
    jitterBase: 0.10,

    swarmDrift: 0.22,
    swarmPull: isMobile ? 0.014 : 0.05,
    localBreath: isMobile ? 0.70 : 0.55,

    fadeAlpha: 0.16
  };
}

let CONFIG = getConfig();

const SWARM = {
  x: W * 0.5,
  y: H * 0.5,
  tx: W * 0.5,
  ty: H * 0.5
};

function resizeCanvas() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;

  CONFIG = getConfig();

  SWARM.x = W * 0.5;
  SWARM.y = H * 0.5;
  SWARM.tx = W * 0.5;
  SWARM.ty = H * 0.5;

  if (currentImage) {
    clearTimeout(rebuildTimeout);
    rebuildTimeout = setTimeout(() => {
      buildParticlesFromImage(currentImage);
    }, 120);
  }
}

window.addEventListener("resize", resizeCanvas);

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  let h;
  let s;
  const l = (max + min) / 2;

  if (max === min) {
    h = 0;
    s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  return { h, s, l };
}

function getColorGroup(r, g, b) {
  const { h, s, l } = rgbToHsl(r, g, b);

  if (l < 0.20) return 0; // oscuros
  if (l > 0.82) return 1; // claros
  if (s < 0.18) return 2; // neutros

  return 3 + Math.floor(h * 6);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function setupAudio(src) {
  audioElement = new Audio(src);
  audioElement.loop = true;
  audioElement.crossOrigin = "anonymous";

  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = 0.84;

  const source = audioContext.createMediaElementSource(audioElement);
  source.connect(analyser);
  analyser.connect(audioContext.destination);

  frequencyData = new Uint8Array(analyser.frequencyBinCount);
}

function getBandValues() {
  if (!analyser || !frequencyData) {
    return {
      bass: 2,
      mid: 0,
      high: 2,
      overall: 0
    };
  }

  analyser.getByteFrequencyData(frequencyData);

  function avg(start, end) {
    let sum = 0;
    let count = 0;

    for (let i = start; i <= end && i < frequencyData.length; i++) {
      sum += frequencyData[i];
      count++;
    }

    return count ? (sum / count) / 255 : 0;
  }

  const bass = avg(3, 18);
  const mid = avg(19, 70);
  const high = avg(71, 150);
  const overall = avg(0, frequencyData.length - 1);

  return { bass, mid, high, overall };
}

function bandForGroup(groupId) {
  const map = {
    0: "bass",
    1: "high",
    2: "mid",
    3: "bass",
    4: "mid",
    5: "mid",
    6: "high",
    7: "high",
    8: "bass"
  };

  return map[groupId] || "mid";
}

class Particle {
  constructor(x, y, color, groupId) {
    this.baseX = x;
    this.baseY = y;
    this.x = x + (Math.random() - 0.5) * 8;
    this.y = y + (Math.random() - 0.5) * 8;
    this.vx = 0;
    this.vy = 0;
    this.size = CONFIG.particleSize + Math.random() * 0.6;
    this.color = color;
    this.groupId = groupId;
    this.seed = Math.random() * 1000;
    this.phase = Math.random() * Math.PI * 2;
  }

  update(audio, t) {
    const band = bandForGroup(this.groupId);
    const amp = audio[band] || 0;
    const overall = audio.overall || 0;

    const dxBase = this.baseX - this.x;
    const dyBase = this.baseY - this.y;

    const oscX = Math.sin(t * 0.035 + this.phase) * amp * CONFIG.maxOffset;
    const oscY = Math.cos(t * 0.03 + this.phase * 1.15) * amp * CONFIG.maxOffset;

    const breathX =
      Math.sin(t * 0.016 + this.seed) * (CONFIG.localBreath + amp * 3.0);
    const breathY =
      Math.cos(t * 0.015 + this.seed * 1.23) * (CONFIG.localBreath + amp * 3.0);

    const dxSwarm = SWARM.x - this.x;
    const dySwarm = SWARM.y - this.y;

    this.vx += dxBase * CONFIG.baseReturn;
    this.vy += dyBase * CONFIG.baseReturn;

    this.vx += dxSwarm * CONFIG.swarmPull * (0.25 + overall);
    this.vy += dySwarm * CONFIG.swarmPull * (0.25 + overall);

    this.vx += oscX * 0.018 + breathX * 0.03;
    this.vy += oscY * 0.018 + breathY * 0.03;

    this.vx += (Math.random() - 0.5) * CONFIG.jitterBase * (1 + amp * 10);
    this.vy += (Math.random() - 0.5) * CONFIG.jitterBase * (1 + amp * 10);

    this.vx *= CONFIG.friction;
    this.vy *= CONFIG.friction;

    this.x += this.vx;
    this.y += this.vy;
  }

  draw(context) {
    context.beginPath();
    context.fillStyle = this.color;
    context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    context.fill();
  }
}

function buildParticlesFromImage(img) {
  particles = [];
  currentImage = img;
  CONFIG = getConfig();

  const { isMobile, isTablet } = getDeviceFlags();

  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");

  const aspect = img.width / img.height;
  let drawW = W;
  let drawH = W / aspect;

  if (isMobile) {
    drawW *= 0.9;
    drawH *= 0.9;
  } else if (isTablet) {
    drawW *= 0.95;
    drawH *= 0.95;
  }

  if (drawH > H) {
    drawH = H * (isMobile ? 0.9 : isTablet ? 0.95 : 1);
    drawW = drawH * aspect;
  }

  const offsetX = (W - drawW) * 0.5;
  const offsetY = (H - drawH) * 0.5;

  tempCanvas.width = Math.max(1, Math.floor(drawW));
  tempCanvas.height = Math.max(1, Math.floor(drawH));

  tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);

  const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
  const data = imageData.data;

  for (let y = 0; y < tempCanvas.height; y += CONFIG.sampleStep) {
    for (let x = 0; x < tempCanvas.width; x += CONFIG.sampleStep) {
      const i = (y * tempCanvas.width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a < CONFIG.alphaThreshold) continue;

      const brightness = (r + g + b) / 3;
      if (brightness < 8) continue;

      const groupId = getColorGroup(r, g, b);
      const color = `rgba(${r},${g},${b},0.92)`;

      particles.push(
        new Particle(offsetX + x, offsetY + y, color, groupId)
      );
    }
  }

  imageReady = true;
  statusBox.innerHTML =
    `Los estorninos<br>Partículas: ${particles.length}<br>Botón único para iniciar audio y campo.`;
}

function updateSwarm(audio, t) {
  const r1 = Math.sin(t * 0.004) * W * 0.12;
  const r2 = Math.cos(t * 0.0032) * H * 0.10;

  SWARM.tx =
    W * 0.5 +
    r1 +
    Math.sin(t * 0.009) * 60 * (0.5 + audio.mid) +
    tiltX * W * 0.35;

  SWARM.ty =
    H * 0.5 +
    r2 +
    Math.cos(t * 0.008) * 50 * (0.5 + audio.bass) +
    tiltY * H * 0.20;

  SWARM.x += (SWARM.tx - SWARM.x) * CONFIG.swarmDrift * 0.03;
  SWARM.y += (SWARM.ty - SWARM.y) * CONFIG.swarmDrift * 0.03;
}

function clearScene() {
  ctx.fillStyle = `rgba(0,0,0,${CONFIG.fadeAlpha})`;
  ctx.fillRect(0, 0, W, H);
}

async function initScene() {
  try {
    statusBox.innerHTML = "Cargando imagen y sonido...";
    const img = await loadImage(IMAGE_SRC);
    buildParticlesFromImage(img);
    setupAudio(AUDIO_SRC);
  } catch (err) {
    console.error(err);
    statusBox.innerHTML = "Error al cargar imagen o sonido.";
  }
}

async function startExperience() {
  if (!imageReady) {
    statusBox.innerHTML = "La imagen aún no está lista.";
    return;
  }

  if (audioContext && audioContext.state === "suspended") {
    await audioContext.resume();
  }

  try {
    await audioElement.play();
    started = true;
    statusBox.innerHTML =
      `Los estorninos<br>Activo.<br>Imagen y audio Acebuch`;
  } catch (err) {
    console.error(err);
    statusBox.innerHTML = "No se pudo iniciar el sonido.";
  }
}

startButton.addEventListener("click", startExperience);

if (window.DeviceOrientationEvent) {
  window.addEventListener("deviceorientation", (e) => {
    tiltX = ((e.gamma || 0) / 45) || 0;
    tiltY = ((e.beta || 0) / 90) || 0;
  });
}

function animate() {
  requestAnimationFrame(animate);
  time++;

  clearScene();

  const audio = getBandValues();
  updateSwarm(audio, time);

  if (!imageReady) {
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "16px Arial";
    ctx.fillText("Preparando campo...", 40, H - 40);
    return;
  }

  for (let i = 0; i < particles.length; i++) {
    particles[i].update(audio, time);
    particles[i].draw(ctx);
  }
}

initScene();
animate();
document.getElementById("ui").classList.add("hidden")