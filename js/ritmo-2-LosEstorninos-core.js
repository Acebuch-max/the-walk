const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function setCanvasSize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

setCanvasSize();

let particles = [];
let mode = "organic";

const STATE = {
  time: 0,
  audioEnergy: 0,
  audioBands: { bass: 0, mid: 0, high: 0, overall: 0 }
};

function resizeCanvas() {
  setCanvasSize();

  if (currentImage) {
    buildParticlesFromImage(currentImage);
  }
}

window.addEventListener("resize", resizeCanvas);

function animate() {
  requestAnimationFrame(animate);

  STATE.time += 2;
  STATE.audioEnergy = getAudioEnergy();
  STATE.audioBands = getAudioBands();

  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  updateParticles();
  drawParticles();
}

function updateParticles() {
  for (const p of particles) {
    if (mode === "organic") {
      organicBehaviour(p);
    } else {
      fluidBehaviour(p);
    }

    p.integrate();
  }
}

function drawParticles() {
  for (const p of particles) {
    p.draw(ctx);
  }
}

function initRitmo() {
  loadImageField();
}

initRitmo();
animate();