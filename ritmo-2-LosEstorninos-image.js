const IMAGE_SRC = "graficos/PUERTAS/LaReinaDelCielo.jpg";

let currentImage = null;

function loadImageField() {
  const img = new Image();

  img.onload = () => {
    currentImage = img;
    buildParticlesFromImage(img);
    updateStatus("Imagen cargada. Pulsa Reproducir.");
  };

  img.onerror = () => {
    console.error("No se pudo cargar la imagen:", IMAGE_SRC);
    updateStatus("Error al cargar la imagen.");
  };

  img.src = IMAGE_SRC;
}

function buildParticlesFromImage(img) {
  if (!canvas) return;

  particles = [];

  const temp = document.createElement("canvas");
  const tctx = temp.getContext("2d");

  const aspect = img.width / img.height;

  let drawW = canvas.width;
  let drawH = canvas.width / aspect;

  if (drawH > canvas.height) {
    drawH = canvas.height;
    drawW = canvas.height * aspect;
  }

  const offsetX = (canvas.width - drawW) * 0.5;
  const offsetY = (canvas.height - drawH) * 0.5;

  temp.width = Math.floor(drawW);
  temp.height = Math.floor(drawH);

  tctx.drawImage(img, 0, 0, temp.width, temp.height);

  const data = tctx.getImageData(0, 0, temp.width, temp.height).data;

  const step =
    window.innerWidth < 680 ? 7 :
    window.innerWidth < 1024 ? 6 : 5;

  for (let y = 0; y < temp.height; y += step) {
  const rowOffset = ((y / step) % 2) * (step * 0.5);

  for (let x = 0; x < temp.width; x += step) {
    const sampleX = Math.floor(x + rowOffset);
    if (sampleX >= temp.width) continue;

    const i = (y * temp.width + sampleX) * 4;

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a < 20) continue;

    const brightness = (r + g + b) / 3;
    if (brightness < 20) continue;

    const jitter = step * 0.38;

    const px = offsetX + sampleX + (Math.random() - 0.5) * jitter;
    const py = offsetY + y + (Math.random() - 0.5) * jitter;

    particles.push(
      new Particle(px, py, `rgb(${r},${g},${b})`)
    );
  }
}
}