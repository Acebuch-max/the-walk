const AUDIO_SRC = "audio/Sesión Mi-m-Nada ahí fuera-3.mp3";

let audioContext = null;
let analyser = null;
let dataArray = null;
let audio = null;

function initAudio() {
  if (audioContext) return;

  audio = new Audio(AUDIO_SRC);
  audio.loop = true;
  audio.crossOrigin = "anonymous";

  audioContext = new (window.AudioContext || window.webkitAudioContext)();

  const source = audioContext.createMediaElementSource(audio);
  analyser = audioContext.createAnalyser();

  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = 0.82;

  source.connect(analyser);
  analyser.connect(audioContext.destination);

  dataArray = new Uint8Array(analyser.frequencyBinCount);
}

async function startExperience() {
  try {
    initAudio();

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    await audio.play();
    updateStatus("Audio activo.");
  } catch (e) {
    console.error("Audio bloqueado:", e);
    updateStatus("No se pudo iniciar el audio.");
  }
}

function getAudioEnergy() {
  if (!analyser || !dataArray) return 0;

  analyser.getByteFrequencyData(dataArray);

  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    sum += dataArray[i];
  }

  return (sum / dataArray.length) / 255;
}

function getAudioBands() {
  if (!analyser || !dataArray) {
    return { bass: 0, mid: 0, high: 0, overall: 0 };
  }

  analyser.getByteFrequencyData(dataArray);

  function avg(start, end) {
    let sum = 0;
    let count = 0;

    for (let i = start; i <= end && i < dataArray.length; i++) {
      sum += dataArray[i];
      count++;
    }

    return count ? (sum / count) / 255 : 0;
  }

  const bass = avg(3, 18);
  const mid = avg(19, 70);
  const high = avg(71, 150);
  const overall = avg(0, dataArray.length - 1);

  return { bass, mid, high, overall };
}