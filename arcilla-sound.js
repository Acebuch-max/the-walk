/* ============================================================
   THE WALK - arcilla-sound.js (Algoritmo ARCILLA)
   Con control de volumen dinámico
   ============================================================ */

(function() {
    'use strict';

    // --- CONFIGURACIÓN ---
    const CONFIG = {
        baseFrequency: 110,
        octaveRange: 3,
        duration: 0.3,
        envelope: {
            attack: 0.01,
            decay: 0.05,
            sustain: 0.3,
            release: 0.05
        },
        sampleSize: 64,
        interval: 30,
        defaultVolume: 0.7
    };

    // --- ESTADO ---
    let audioContext = null;
    let isRunning = false;
    let intervalId = null;
    let currentImage = null;
    let isPaused = false;
    let currentVolume = CONFIG.defaultVolume;
    let currentBrightness = null;
    let index = 0;
    let speed = 1;

    // --- CLASE ---
    class ArcillaSound {
        constructor(ctx) {
            this.ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(currentVolume, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);
            this.isPlaying = false;
            this.intervalId = null;
            this.currentBrightness = null;
            this.index = 0;
            this.speed = 1;
        }

        // --- ANALIZAR IMAGEN ---
        analyzeImage(imageElement) {
            return new Promise((resolve, reject) => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    const sampleSize = CONFIG.sampleSize;
                    canvas.width = sampleSize;
                    canvas.height = sampleSize;
                    
                    ctx.drawImage(imageElement, 0, 0, sampleSize, sampleSize);
                    const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
                    const data = imageData.data;
                    
                    const brightness = [];
                    for (let i = 0; i < data.length; i += 4) {
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];
                        const br = 0.299 * r + 0.587 * g + 0.114 * b;
                        brightness.push(br);
                    }
                    
                    resolve(brightness);
                } catch (e) {
                    reject(e);
                }
            });
        }

        // --- GENERAR NOTA ---
        generateNoteFromBrightness(brightness, idx, total) {
            const normalized = brightness / 255;
            
            const minFreq = CONFIG.baseFrequency;
            const maxFreq = CONFIG.baseFrequency * Math.pow(2, CONFIG.octaveRange);
            const freq = minFreq * Math.pow(maxFreq / minFreq, normalized);
            
            const duration = CONFIG.duration * (0.3 + normalized * 0.7);
            const amplitude = 0.05 + normalized * 0.25;
            
            const waveforms = ['sine', 'triangle', 'sawtooth', 'square'];
            const waveIndex = Math.floor(normalized * (waveforms.length - 1));
            
            return {
                frequency: freq,
                duration: duration,
                amplitude: amplitude,
                waveform: waveforms[waveIndex] || 'sine'
            };
        }

        // --- REPRODUCIR NOTA ---
        playNote(params, time) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = params.waveform;
            osc.frequency.setValueAtTime(params.frequency, time);
            
            const attack = CONFIG.envelope.attack;
            const decay = CONFIG.envelope.decay;
            const sustain = CONFIG.envelope.sustain;
            const release = CONFIG.envelope.release;
            
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(params.amplitude, time + attack);
            gain.gain.linearRampToValueAtTime(params.amplitude * 0.6, time + attack + decay);
            gain.gain.setValueAtTime(params.amplitude * 0.6, time + attack + decay + sustain);
            gain.gain.linearRampToValueAtTime(0, time + attack + decay + sustain + release);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start(time);
            osc.stop(time + attack + decay + sustain + release + 0.01);
            
            return { oscillator: osc, gain: gain };
        }

        // --- REPRODUCIR ---
        async play(imageElement, spd = 1) {
            try {
                this.stop();
                
                const brightness = await this.analyzeImage(imageElement);
                this.currentBrightness = brightness;
                this.isPlaying = true;
                this.isPaused = false;
                this.speed = spd || 1;
                this.index = 0;
                currentImage = imageElement;
                
                const total = brightness.length;
                const interval = CONFIG.interval * this.speed;
                
                this.intervalId = setInterval(() => {
                    if (!this.isPlaying || this.isPaused) return;
                    
                    const bri = brightness[this.index % total];
                    const params = this.generateNoteFromBrightness(bri, this.index, total);
                    const time = this.ctx.currentTime;
                    this.playNote(params, time);
                    
                    this.index++;
                }, interval);
                
                return true;
            } catch (e) {
                console.error('Error al reproducir:', e);
                return false;
            }
        }

        // --- DETENER ---
        stop() {
            this.isPlaying = false;
            this.isPaused = false;
            
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
            
            this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
            setTimeout(() => {
                this.masterGain.gain.setValueAtTime(currentVolume, this.ctx.currentTime);
            }, 50);
            
            currentImage = null;
            this.currentBrightness = null;
            this.index = 0;
        }

        // --- PAUSA ---
        pause() {
            if (this.isPlaying && !this.isPaused) {
                this.isPaused = true;
                if (this.intervalId) {
                    clearInterval(this.intervalId);
                    this.intervalId = null;
                }
                this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
            }
        }

        // --- REANUDAR ---
        resume() {
            if (this.isPlaying && this.isPaused && currentImage) {
                this.isPaused = false;
                this.masterGain.gain.setValueAtTime(currentVolume, this.ctx.currentTime);
                this.play(currentImage, this.speed);
            }
        }

        // --- VOLUMEN ---
        setVolume(value) {
            currentVolume = Math.max(0, Math.min(1, value));
            this.masterGain.gain.setValueAtTime(currentVolume, this.ctx.currentTime);
        }

        getVolume() {
            return currentVolume;
        }
    }

    // --- INSTANCIA ---
    let instance = null;

    // --- API ---
    const ArcillaSoundAPI = {
        start: function(ctx) {
            if (!instance) {
                instance = new ArcillaSound(ctx);
            }
            if (instance.ctx.state === 'suspended') {
                instance.ctx.resume();
            }
            return instance;
        },

        play: function(imageElement, speed) {
            if (!instance) {
                instance = new ArcillaSound();
            }
            return instance.play(imageElement, speed || 1);
        },

        stop: function() {
            if (instance) {
                instance.stop();
            }
        },

        pause: function() {
            if (instance) {
                instance.pause();
            }
        },

        resume: function() {
            if (instance) {
                instance.resume();
            }
        },

        isPlaying: function() {
            return instance ? instance.isPlaying && !instance.isPaused : false;
        },

        isPaused: function() {
            return instance ? instance.isPaused : false;
        },

        setVolume: function(value) {
            if (instance) {
                instance.setVolume(value);
            }
        },

        getVolume: function() {
            return instance ? instance.getVolume() : currentVolume;
        },

        analyze: function(imageElement) {
            if (!instance) {
                instance = new ArcillaSound();
            }
            return instance.analyzeImage(imageElement);
        },

        getInstance: function() {
            return instance;
        }
    };

    window.ArcillaSound = ArcillaSoundAPI;

})();