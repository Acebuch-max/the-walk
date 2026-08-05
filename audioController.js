
const AUDIO_MAP = {
  "calm": [{ name:"pad", file:"Galeria_Virtual/assets/audio/ElDestinoDelHeroe_2.mp3", vol:0.4 }],
  "deep": [{ name:"texture", file:"audio/ritmo.mp3", vol:0.6 }],
  "intense": [{ name:"pulse", file:"audio/Ella (B).mp3", vol:0.0 }]
};

function page() {
  return document.body.dataset.page || "unknown";
}

document.addEventListener("audio-ready", async () => {
  const p = page();
  audioEngine.remember(p);

  const mood = audioEngine.getMood();
  const tracks = AUDIO_MAP[mood];

  for (let t of tracks) {
    await audioEngine.load(t.name, t.file);
    audioEngine.play(t.name, t.vol, 4);
  }

  setInterval(()=>{
    audioEngine.evolve();
  }, 5000);
});
