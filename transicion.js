/* ============================================================
   THE WALK - transicion.js
   Página de transición genérica con vídeo dinámico
   ============================================================ */

(function() {
    'use strict';

    // --- OBTENER PARÁMETROS DE LA URL ---
    function getParam(name, fallback) {
        const params = new URLSearchParams(window.location.search);
        return params.get(name) || fallback;
    }

    // --- CONFIGURACIÓN ---
    const videoSrc = getParam('video', 'graficos/videos/transiciones/fluxus_1.mp4');
    const destination = getParam('dest', 'Mapa-TheWalk.html');
    const text = getParam('text', '— cruzando el umbral —');

    // Añade esto en init(), después de configurar el vídeo:

// --- SKIP: clic en cualquier parte (excepto botón sonido) ---
container.addEventListener('click', function(e) {
    const sonidoBtn = document.getElementById('sonido');
    if (e.target === sonidoBtn || (sonidoBtn && sonidoBtn.contains(e.target))) {
        return;
    }
    console.log('Click detectado, saltando transición');
    skipTransition();
});

// --- SKIP: teclado ---
document.addEventListener('keydown', function(e) {
    if ((e.key === 'Escape' || e.key === ' ') && !redirected) {
        e.preventDefault();
        console.log('Tecla de salto detectada');
        skipTransition();
    }
});

// --- TIMER DE SEGURIDAD (si el vídeo no carga) ---
setTimeout(function() {
    if (!redirected) {
        console.log('Temporizador de seguridad: redirigiendo');
        redirectToDestination();
    }
}, 6000); // 6 segundos de respaldo

    // --- ELEMENTOS ---
    const video = document.getElementById('transicion-video');
    const progressBar = document.getElementById('progress-bar');
    const container = document.getElementById('transicion-container');
    const skipInstruction = document.getElementById('skip-instruction');
    const transicionText = document.getElementById('transicion-text');

    // --- ESTADO ---
    let duration = 0;
    let redirected = false;
    let skipTimer = null;
    let isSoundActive = false;

    // --- INICIALIZAR ---
    function init() {
        // --- TEXTO ---
        if (transicionText) {
            transicionText.textContent = text;
        }

        // --- RESTAURAR SONIDO ---
        if (typeof SoundManager !== 'undefined') {
            SoundManager.init();
            
            if (SoundManager.isActive()) {
                SoundManager.resume();
                SoundManager.syncUI();
                isSoundActive = true;
            }
        }

        // --- CONFIGURAR VÍDEO ---
        video.src = videoSrc;
        video.load();
        
        // --- EVENTOS DEL VÍDEO ---
     
    video.addEventListener('loadedmetadata', function() {
    duration = video.duration;
    
    // Forzar reproducción
    video.play()
        .then(() => console.log('Vídeo reproducido'))
        .catch(err => console.error('Error al reproducir:', err));
});
        video.addEventListener('timeupdate', function() {
            if (duration > 0) {
                const progress = (video.currentTime / duration) * 100;
                progressBar.style.width = progress + '%';
            }
        });

        video.addEventListener('ended', function() {
            if (!redirected) {
                redirectToDestination();
            }
        });

        video.addEventListener('error', function() {
            console.warn('Error en vídeo de transición');
            startFallbackTimer();
        });

        // --- EVENTOS DE INTERACCIÓN ---
        container.addEventListener('click', function(e) {
            // Si el click fue en el botón de sonido, no saltar
            const sonidoBtn = document.getElementById('sonido');
            if (e.target === sonidoBtn || (sonidoBtn && sonidoBtn.contains(e.target))) {
                return;
            }
            if (!redirected) {
                skipTransition();
            }
        });

        document.addEventListener('keydown', function(e) {
            if ((e.key === 'Escape' || e.key === ' ') && !redirected) {
                e.preventDefault();
                skipTransition();
            }
        });

        // --- BOTÓN DE SONIDO ---
        const sonidoBtn = document.getElementById('sonido');
        if (sonidoBtn) {
            sonidoBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleSound();
            });
            updateSoundUI();
        }

        // --- OCULTAR INSTRUCCIÓN ---
        setTimeout(function() {
            if (skipInstruction) {
                skipInstruction.style.opacity = '0';
                setTimeout(function() {
                    skipInstruction.style.display = 'none';
                }, 800);
            }
        }, 3000);

        // --- FALLBACK: si el vídeo no arranca ---
        setTimeout(function() {
            if (video.paused && !video.ended && !redirected) {
                video.play().catch(function() {
                    startFallbackTimer();
                });
            }
        }, 2000);

        // --- VISIBILIDAD ---
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                video.pause();
                if (typeof SoundManager !== 'undefined') {
                    SoundManager.pause();
                }
            } else {
                if (!redirected && video.paused) {
                    video.play().catch(function() {});
                }
                if (typeof SoundManager !== 'undefined' && SoundManager.isActive()) {
                    SoundManager.resume();
                }
            }
        });

        // --- Notificar cambio de página ---
        document.dispatchEvent(new CustomEvent('twlk:page:change'));
    }

    // --- SONIDO ---
    function toggleSound() {
        if (typeof SoundManager === 'undefined') return;

        if (SoundManager.isActive()) {
            SoundManager.deactivate();
            isSoundActive = false;
        } else {
            // Buscar una imagen para ARCILLA
            const img = document.createElement('img');
            img.src = 'graficos/arcillas/semilla.png';
            SoundManager.activate(img);
            isSoundActive = true;
        }
        
        updateSoundUI();
    }

    function updateSoundUI() {
        const sonidoBtn = document.getElementById('sonido');
        if (!sonidoBtn) return;
        
        const active = (typeof SoundManager !== 'undefined') ? SoundManager.isActive() : isSoundActive;
        sonidoBtn.textContent = active ? '◉' : '◯';
        sonidoBtn.classList.toggle('active', active);
        sonidoBtn.classList.toggle('silence', !active);
    }

    // --- TRANSICIÓN ---
    function skipTransition() {
        if (redirected) return;
        redirected = true;
        
        video.pause();
        
        if (typeof SoundManager !== 'undefined') {
            SoundManager.pause();
        }
        
        container.style.transition = 'opacity 0.5s ease';
        container.style.opacity = '0';
        
        setTimeout(function() {
            window.location.href = destination;
        }, 500);
    }

    function redirectToDestination() {
        if (redirected) return;
        redirected = true;
        
        if (typeof SoundManager !== 'undefined') {
            SoundManager.pause();
        }
        
        container.style.transition = 'opacity 0.5s ease';
        container.style.opacity = '0';
        
        setTimeout(function() {
            window.location.href = destination;
        }, 500);
    }

    // --- FALLBACK ---
    function startFallbackTimer() {
        if (redirected) return;
        
        let elapsed = 0;
        const fallbackDuration = 60;
        
        progressBar.style.transition = 'width 0.1s linear';
        
        skipTimer = setInterval(function() {
            elapsed += 0.1;
            const progress = Math.min((elapsed / fallbackDuration) * 100, 100);
            progressBar.style.width = progress + '%';
            
            if (elapsed >= fallbackDuration) {
                clearInterval(skipTimer);
                if (!redirected) {
                    redirectToDestination();
                }
            }
        }, 100);
    }

    // --- INICIO ---
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();