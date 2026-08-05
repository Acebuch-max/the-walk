// ============================================================
// TWLK BREATH - Configuración principal
// Ubicación: js/twlk-breath.js
// ============================================================

(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        if (!window.TWLK) {
            console.warn('⚠️ TWLK core no disponible');
            return;
        }

        // ============================================================
        // CONFIGURACIÓN
        // ============================================================
        
        // Cambiar según necesidad:
        const CONFIG = {
            usarVideo: true,        // true = vídeo, false = imagen
            duracion: 10,           // 10, 15 o 30 segundos
            audioActivado: false,   // true para activar audio
            intervalo: 3000         // ms entre actualizaciones
        };

        // ============================================================
        // INICIALIZAR COMPONENTE
        // ============================================================
        
        let instancia;
        
        if (CONFIG.usarVideo) {
            instancia = window.TWLKVideo.init('#portada-breath', {
                reposo: 'reposo',
                equilibrio: 'equilibrio',
                plenitud: 'plenitud',
                duracion: CONFIG.duracion,
                audio: CONFIG.audioActivado,
                intervalo: CONFIG.intervalo
            });
        } else {
            instancia = window.TWLKImagen.init('#portada-breath', {
                reposo: 'reposo',
                equilibrio: 'equilibrio',
                plenitud: 'plenitud',
                respirar: true,
                amplitude: 0.04
            });
        }

        // ============================================================
        // EVENTOS
        // ============================================================
        
        TWLK.on('breath:actualizado', function(estado) {
            const mapeo = TWLK.mapearBreath(estado.valor);
            document.body.className = `breath-state-${mapeo.estado}`;
            
            const indicator = document.querySelector('.breath-indicator .breath-value');
            if (indicator) indicator.textContent = `${estado.pct}%`;
            
            const icon = document.querySelector('.breath-indicator .breath-icon');
            if (icon) icon.textContent = estado.icono;
        });

        TWLK.on('portada:video-cambiado', function(data) {
            console.log(`🎬 Vídeo: ${data.estado} (${Math.round(data.breath * 100)}%)`);
        });

        TWLK.on('portada:imagen-cambiada', function(data) {
            console.log(`🖼️ Imagen: ${data.estado}`);
        });

        // ============================================================
        // INDICADOR VISUAL
        // ============================================================
        
        const container = document.querySelector('.franja-2');
        if (container && !container.querySelector('.breath-indicator')) {
            const indicator = document.createElement('div');
            indicator.className = 'breath-indicator';
            indicator.innerHTML = `
                <span class="breath-icon">🌿</span>
                <span class="breath-value">50%</span>
                <span class="breath-dot"></span>
            `;
            container.appendChild(indicator);
        }

        // ============================================================
        // CONTROLES DE DURACIÓN (solo vídeo)
        // ============================================================
        
        if (CONFIG.usarVideo && instancia && instancia.length > 0) {
            const videoInstance = instancia[0];
            const container = document.querySelector('.franja-2');
            
            if (container) {
                const controls = document.createElement('div');
                controls.className = 'duracion-controls';
                Object.assign(controls.style, {
                    position: 'absolute',
                    bottom: '20px',
                    right: '80px',
                    display: 'flex',
                    gap: '8px',
                    zIndex: '10',
                    opacity: '0.4',
                    transition: 'opacity 0.3s ease'
                });
                
                [10, 15, 30].forEach(duracion => {
                    const btn = document.createElement('button');
                    btn.textContent = `${duracion}s`;
                    btn.style.cssText = `
                        background: ${duracion === CONFIG.duracion ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'};
                        color: white;
                        border: 1px solid rgba(255,255,255,0.2);
                        border-radius: 4px;
                        padding: 2px 8px;
                        font-size: 10px;
                        cursor: pointer;
                        font-family: 'Ubuntu', sans-serif;
                        transition: all 0.3s ease;
                    `;
                    btn.addEventListener('click', () => {
                        document.querySelectorAll('.duracion-btn').forEach(b => 
                            b.style.background = 'rgba(0,0,0,0.3)'
                        );
                        btn.style.background = 'rgba(255,255,255,0.3)';
                        videoInstance.setDuracion(duracion);
                    });
                    btn.className = 'duracion-btn';
                    controls.appendChild(btn);
                });
                
                container.style.position = 'relative';
                container.appendChild(controls);
            }
        }

        // ============================================================
        // AUDIO
        // ============================================================
        
        if (CONFIG.audioActivado) {
            document.addEventListener('click', () => {
                TWLK.initAudio();
                TWLK.resumeAudio();
            }, { once: true });
        }

        console.log('🌿 TWLK Breath configurado');
        console.log(`   📹 ${CONFIG.usarVideo ? 'Vídeo' : 'Imagen'}`);
        console.log(`   ⏱️ ${CONFIG.duracion}s`);
    });

})();