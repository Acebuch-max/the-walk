
class AudioEngine {
  constructor() {
    if (window.__AUDIO_ENGINE__) return window.__AUDIO_ENGINE__;

    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(this.ctx.destination);

    this.tracks = {};
    this.history = JSON.parse(localStorage.getItem("walk_history") || "[]");

    window.__AUDIO_ENGINE__ = this;

    this._unlock();
    this._prewarm();
  }

  _unlock() {
    const resume = () => {
      if (this.ctx.state !== "running") this.ctx.resume();
      document.dispatchEvent(new Event("audio-ready"));
    };
    ["click","mousemove","scroll","touchstart"].forEach(e=>{
      document.addEventListener(e, resume, { once: true });
    });
  }

  _prewarm() {
    const buffer = this.ctx.createBuffer(1, 1, 22050);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(this.master);
    src.start(0);
  }

  async load(name, url, loop = true) {
    if (this.tracks[name]) return;

    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    const audioBuffer = await this.ctx.decodeAudioData(buffer);

    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    const panner = this.ctx.createStereoPanner();

    filter.type = "lowpass";
    filter.frequency.value = 1200;

    source.buffer = audioBuffer;
    source.loop = loop;

    gain.gain.value = 0;

    source.connect(filter);
    filter.connect(panner);
    panner.connect(gain);
    gain.connect(this.master);

    this.tracks[name] = { source, gain, filter, panner, started: false };
  }

  play(name, volume = 1, fade = 3) {
    const t = this.tracks[name];
    if (!t) return;

    if (!t.started) {
      t.source.start(0);
      t.started = true;
    }

    t.gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + fade);
  }

  evolve() {
    Object.values(this.tracks).forEach(t=>{
      const freq = 500 + Math.random()*3000;
      const pan = (Math.random()*2)-1;

      t.filter.frequency.linearRampToValueAtTime(freq, this.ctx.currentTime + 5);
      t.panner.pan.linearRampToValueAtTime(pan, this.ctx.currentTime + 5);
    });
  }

  remember(page) {
    this.history.push(page);
    localStorage.setItem("walk_history", JSON.stringify(this.history));
  }

  getMood() {
    const len = this.history.length;
    if (len < 3) return "calm";
    if (len < 6) return "deep";
    return "intense";
  }
}

window.audioEngine = new AudioEngine();
