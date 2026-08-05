/* ============================================================
   THE WALK - sound-manager.js
   Gestión de sonido: Ambiente pregrabado (.mp3) + ARCILLA (Partituras)
   ============================================================ */

(function() {
    'use strict';

    // --- CONSTANTES ---
    const STORAGE_KEY = 'twlk_sound_active';
    const VOLUME_KEY = 'twlk_sound_volume';

    // --- ESTADO ---
    let state = {
        active: false,
        audioContext: null,
        isArcillaPlaying: false,
        volume: 0.7
    };

    // --- REFERENCIA AL SONIDO AMBIENTE ---
    let ambientSource = null;
    let ambientGain = null;
    let ambientBuffer = null;
    let isAmbientLoaded = false;
    let currentConfig = null;

    // --- FUNCIONES PRIVADAS ---

    function loadState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            state.active = saved === 'true';
            
            const vol = localStorage.getItem(VOLUME_KEY);
            if (vol !== null) {
                state.volume = parseFloat(vol) || 0.7;
            }
        } catch (e) {
            state.active = false;
            state.volume = 0.7;
        }
    }

    function saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, String(state.active));
            localStorage.setItem(VOLUME_KEY, String(state.volume));
        } catch (e) { /* ignorar */ }
    }

    function getAudioContext() {
        if (!state.audioContext) {
            try {
                state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.warn('Web Audio API no soportada');
                return null;
            }
        }
        return state.audioContext;
    }

    function resumeContext() {
        const ctx = getAudioContext();
        if (ctx && ctx.state === 'suspended') {
            ctx.resume().catch(function(e) {});
        }
        return ctx;
    }

    // === FUNCIONES PARA SONIDO AMBIENTE ===

    function loadAmbientSound(config) {
        stopAmbientSound();
        
        if (!config || !config.file) {
            isAmbientLoaded = false;
            currentConfig = null;
            return;
        }

        currentConfig = config;
        
        const ctx = getAudioContext();
        if (!ctx) return;
        
        // Crear gain node
        ambientGain = ctx.createGain();
        ambientGain.gain.value = 0;
        ambientGain.connect(ctx.destination);
        
        // Cargar archivo
        fetch(config.file)
            .then(res => {
                if (!res.ok) throw new Error('Archivo no encontrado: ' + config.file);
                return res.arrayBuffer();
            })
            .then(buffer => ctx.decodeAudioData(buffer))
            .then(audioBuffer => {
                ambientBuffer = audioBuffer;
                ambientSource = ctx.createBufferSource();
                ambientSource.buffer = audioBuffer;
                ambientSource.loop = config.loop !== undefined ? config.loop : true;
                ambientSource.connect(ambientGain);
                ambientSource.start(0);
                isAmbientLoaded = true;
                
                // Si el sonido está activo, hacer fade in
                if (state.active) {
                    const vol = config.volume || 0.5;
                    ambientGain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 2);
                }
            })
            .catch(err => {
                console.warn('Error cargando sonido ambiente:', err);
                isAmbientLoaded = false;
            });
    }

    function stopAmbientSound() {
        if (ambientSource) {
            try {
                ambientSource.stop();
            } catch(e) {}
            ambientSource = null;
        }
        if (ambientGain) {
            try {
                ambientGain.disconnect();
            } catch(e) {}
            ambientGain = null;
        }
        ambientBuffer = null;
        isAmbientLoaded = false;
        currentConfig = null;
    }

    function fadeAmbient(target, duration) {
        if (!ambientGain) return;
        const now = ambientGain.context.currentTime;
        ambientGain.gain.linearRampToValueAtTime(target, now + (duration || 2));
    }

    // --- ARCILLA ---
    function startArcilla() {
        const ctx = resumeContext();
        if (!ctx) return false;

        if (typeof ArcillaSound === 'undefined') {
            console.warn('ArcillaSound no disponible');
            return false;
        }

        // Buscar imagen para ArcillaSound
        const img = findImageForArcilla();
        if (!img) {
            console.warn('No se encontró imagen para ArcillaSound');
            return false;
        }

        ArcillaSound.start(ctx);
        ArcillaSound.setVolume(state.volume * 0.7);
        
        if (img.complete) {
            ArcillaSound.play(img);
            state.isArcillaPlaying = true;
        } else {
            img.addEventListener('load', function() {
                if (state.active && typeof ArcillaSound !== 'undefined') {
                    ArcillaSound.play(img);
                    state.isArcillaPlaying = true;
                }
            }, { once: true });
            // Fallback
            setTimeout(function() {
                if (state.active && typeof ArcillaSound !== 'undefined' && !state.isArcillaPlaying) {
                    ArcillaSound.play(img);
                    state.isArcillaPlaying = true;
                }
            }, 1000);
        }

        return true;
    }

    function stopArcilla() {
        state.isArcillaPlaying = false;
        if (typeof ArcillaSound !== 'undefined') {
            ArcillaSound.stop();
        }
    }

    function findImageForArcilla() {
        const selectors = [
            '#bg-image',
            '#zona-image-content',
            '#content-image',
            '#B-background img',
            '#C-background img',
            '#D-semilla img',
            '#E-background img',
            '.umbral-img',
            'img'
        ];

        for (const selector of selectors) {
            const img = document.querySelector(selector);
            if (img && img.complete && img.naturalWidth > 50) {
                return img;
            }
        }

        // Fallback: imagen por defecto
        const fallback = document.createElement('img');
        fallback.src = 'data:image/svg+xml,' + encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">' +
            '<rect width="200" height="200" fill="#333"/>' +
            '<circle cx="100" cy="100" r="60" fill="#555"/>' +
            '</svg>'
        );
        return fallback;
    }

    // --- API PÚBLICA ---

    const SoundManager = {

        // --- INICIALIZAR ---
        init: function() {
            loadState();
            
            if (state.active) {
                setTimeout(function() {
                    SoundManager.activate();
                }, 100);
            }
            
            this.setupEvents();
            this.syncUI();
            
            // Cargar configuración de sonido al iniciar
            const config = getSoundConfig();
            if (config && config.file && state.active) {
                setTimeout(function() {
                    loadAmbientSound(config);
                }, 200);
            }
            
            return this;
        },

        // --- ACTIVAR ---
        activate: function() {
            try {
                const ctx = resumeContext();
                if (!ctx) return false;

                state.active = true;
                saveState();

                // --- SONIDO AMBIENTE (si está configurado) ---
                const config = getSoundConfig();
                if (config && config.file) {
                    if (isAmbientLoaded && ambientGain) {
                        fadeAmbient(config.volume || 0.5, 2);
                    } else {
                        loadAmbientSound(config);
                    }
                }

                // --- ARCILLA: solo en Partituras ---
                const page = window.location.pathname.split('/').pop() || 'index.html';
                if (page.match(/^Partitura-/) || page.match(/^Puerta-Umbral/)) {
                    startArcilla();
                }

                this.syncUI();
                
                document.dispatchEvent(new CustomEvent('twlk:sound:change', {
                    detail: { active: true }
                }));

                return true;

            } catch (e) {
                console.warn('Error al activar sonido:', e);
                return false;
            }
        },

        // --- DESACTIVAR ---
        deactivate: function() {
            state.active = false;
            saveState();

            // Detener sonido ambiente (fade out)
            fadeAmbient(0, 1);
            setTimeout(function() {
                stopAmbientSound();
            }, 1200);

            // Detener ARCILLA
            stopArcilla();

            if (state.audioContext && state.audioContext.state === 'running') {
                state.audioContext.suspend().catch(function(e) {});
            }

            this.syncUI();
            
            document.dispatchEvent(new CustomEvent('twlk:sound:change', {
                detail: { active: false }
            }));

            return true;
        },

        // --- TOGGLE ---
        toggle: function() {
            if (state.active) {
                return this.deactivate();
            } else {
                return this.activate();
            }
        },

        // --- ACTUALIZAR ARCILLA (cuando cambia la página) ---
        refreshArcilla: function() {
            const page = window.location.pathname.split('/').pop() || 'index.html';
            if (state.active && (page.match(/^Partitura-/) || page.match(/^Puerta-Umbral/))) {
                stopArcilla();
                setTimeout(function() {
                    startArcilla();
                }, 200);
            }
        },

        // --- VOLUMEN ---
        setVolume: function(value) {
            state.volume = Math.max(0, Math.min(1, value));
            saveState();
            
            if (ambientGain && state.active) {
                const config = currentConfig || getSoundConfig();
                const vol = (config && config.volume) ? config.volume : 0.5;
                ambientGain.gain.setValueAtTime(vol, state.audioContext.currentTime);
            }
            
            if (typeof ArcillaSound !== 'undefined') {
                ArcillaSound.setVolume(state.volume * 0.7);
            }
        },

        getVolume: function() {
            return state.volume;
        },

        // --- ESTADO ---
        isActive: function() {
            return state.active;
        },

        // --- UI ---
        syncUI: function() {
            const buttons = document.querySelectorAll('#sonido, .sonido-btn');
            buttons.forEach(function(btn) {
                if (state.active) {
                    btn.textContent = '◉';
                    btn.classList.add('active');
                    btn.classList.remove('silence');
                } else {
                    btn.textContent = '◯';
                    btn.classList.remove('active');
                    btn.classList.add('silence');
                }
            });
        },

        // --- EVENTOS ---
        setupEvents: function() {
            // Click en botones de sonido
            document.addEventListener('click', function(e) {
                const btn = e.target.closest('#sonido, .sonido-btn');
                if (btn) {
                    e.preventDefault();
                    e.stopPropagation();
                    SoundManager.toggle();
                }
            });

            // Evento para cuando cambia la página (navegación SPA)
            document.addEventListener('twlk:page:change', function() {
                setTimeout(function() {
                    SoundManager.syncUI();
                    
                    // Recargar sonido ambiente para la nueva página
                    if (state.active) {
                        const config = getSoundConfig();
                        if (config && config.file) {
                            loadAmbientSound(config);
                        } else {
                            stopAmbientSound();
                        }
                        // Recargar Arcilla si es Partitura
                        SoundManager.refreshArcilla();
                    }
                }, 100);
            });

            // Gestión de visibilidad
            document.addEventListener('visibilitychange', function() {
                if (document.hidden) {
                    if (state.active && typeof ArcillaSound !== 'undefined') {
                        ArcillaSound.pause();
                    }
                } else {
                    if (state.active) {
                        resumeContext();
                        if (typeof ArcillaSound !== 'undefined') {
                            ArcillaSound.resume();
                        }
                    }
                }
            });
        },

        // --- LIMPIEZA ---
        destroy: function() {
            this.deactivate();
            stopAmbientSound();
        }
    };

    // --- EXPOSICIÓN ---
    window.SoundManager = SoundManager;

    // --- INICIO AUTOMÁTICO ---
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            SoundManager.init();
        });
    } else {
        SoundManager.init();
    }

})();