// js/Puerta-Umbral.js
(function() {
  'use strict';

  const CONFIG = {
    I: { padding: 20, colorFondo: '#0a0a0a', tempo: 500, duracion: 0.4, volumen: 0.08 },
    II: { padding: 40, colorFondo: '#0a0a1a', tempo: 350, duracion: 0.3, volumen: 0.06 },
    III: { padding: 60, colorFondo: '#1a0a0a', tempo: 600, duracion: 0.5, volumen: 0.10 }
  };

  let estado = { partitura: null, datos: [], config: null, reproduciendo: false, indiceActual: 0, intervalo: null, audioCtx: null, osciladores: [] };

  // === CORRECCIÓN: LECTURA DE DATOS ===
  function leerDatos() {
    try {
      // 1. Intentar leer la estructura guardada por la partitura
      const rawStructure = sessionStorage.getItem('TW_SCORE_STRUCTURE');
      if (rawStructure) {
        const parsed = JSON.parse(rawStructure);
        if (parsed.text && parsed.text.trim() !== '') {
          return {
            texto: parsed.text,
            partitura: parsed.partitura || 'I' // Si no guardó partitura, usamos I por defecto
          };
        }
      }

      // 2. Si falla, intentar leer el análisis generado por el core
      const rawAnalysis = sessionStorage.getItem('TW_UMBRAL_ANALYSIS');
      if (rawAnalysis) {
        const parsed = JSON.parse(rawAnalysis);
        if (parsed.analysis && parsed.analysis.structure) {
           // Intentar reconstruir el texto desde el análisis
           const lines = parsed.analysis.structure.lines || [];
           return {
             texto: lines.join('\n'),
             partitura: parsed.analysis.structure.partitura || 'I'
           };
        }
      }
    } catch (e) {
      console.warn('Error leyendo sessionStorage:', e);
    }
    return null;
  }

  // === RESTO DE FUNCIONES (sin cambios mayores) ===
  function crearBadge(partitura) {
    const badge = document.createElement('div');
    badge.className = 'umbral-badge';
    badge.style.cssText = `
      position: fixed; bottom: 24px; left: 24px;
      background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
      padding: 8px 16px; border-radius: 20px;
      color: rgba(255,255,255,0.6); font-family: 'Inter', sans-serif;
      font-size: 0.75rem; letter-spacing: 0.05em;
      border: 1px solid rgba(255,255,255,0.05); pointer-events: none; z-index: 1000;
    `;
    badge.textContent = `Umbral · Partitura ${partitura}`;
    document.body.appendChild(badge);
  }

  function actualizarBreath(progreso) {
    document.dispatchEvent(new CustomEvent('breath:actualizado', { detail: { progreso } }));
  }

  function tocarNota(frecuencia, duracion, volumen, tiempoInicio) {
    if (!estado.audioCtx) {
      try { estado.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } 
      catch(e) { console.warn('AudioContext no disponible'); return; }
    }
    const ctx = estado.audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = frecuencia;
    gain.gain.setValueAtTime(volumen, ctx.currentTime + tiempoInicio);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + tiempoInicio + duracion);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + tiempoInicio);
    osc.stop(ctx.currentTime + tiempoInicio + duracion);
    estado.osciladores.push(osc);
  }

  function reproducirSecuencia() {
    if (estado.reproduciendo || estado.datos.length === 0) return;
    estado.reproduciendo = true;
    estado.indiceActual = 0;
    const btn = document.getElementById('sound-toggle');
    if (btn) btn.classList.add('playing');

    const { tempo, duracion, volumen } = estado.config;
    const total = estado.datos.length;

    function tocarSiguiente() {
      if (estado.indiceActual >= total) { detenerReproduccion(); return; }
      const dato = estado.datos[estado.indiceActual];
      const progreso = (estado.indiceActual / total) * 100;
      actualizarBreath(progreso);
      tocarNota(dato.frecuencia, duracion, volumen, 0);
      estado.indiceActual++;
      estado.intervalo = setTimeout(tocarSiguiente, tempo);
    }
    tocarSiguiente();
  }

  function detenerReproduccion() {
    estado.reproduciendo = false;
    if (estado.intervalo) { clearTimeout(estado.intervalo); estado.intervalo = null; }
    estado.osciladores.forEach(osc => { try { osc.stop(); } catch (e) {} });
    estado.osciladores = [];
    const btn = document.getElementById('sound-toggle');
    if (btn) btn.classList.remove('playing');
    actualizarBreath(100);
  }

  // === INICIALIZACIÓN ===
  function init() {
    const datos = leerDatos();
    if (!datos || !datos.texto) {
      document.body.innerHTML = '<div style="padding:40px;color:#fff;text-align:center;">No hay datos disponibles. Vuelve a la partitura.</div>';
      return;
    }

    estado.partitura = datos.partitura || 'I';
    estado.config = CONFIG[estado.partitura] || CONFIG.I;

    // Análisis fonético
    if (typeof ANALIZADOR === 'undefined') {
      document.body.innerHTML = '<div style="padding:40px;color:#fff;text-align:center;">Error: No se cargó el analizador fonético.</div>';
      return;
    }
    estado.datos = ANALIZADOR.analizarTexto(datos.texto);

    crearBadge(estado.partitura);

    // Generar mosaico
    const configMosaico = { padding: estado.config.padding, colorFondo: estado.config.colorFondo };
    if (typeof MOSAICO !== 'undefined') {
      MOSAICO.generar(estado.datos, 'mosaico', configMosaico);
    }

    // Configurar botón de sonido
    const btn = document.getElementById('sound-toggle');
    if (btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        if (estado.reproduciendo) { detenerReproduccion(); } 
        else {
          if (estado.audioCtx && estado.audioCtx.state === 'suspended') estado.audioCtx.resume();
          reproducirSecuencia();
        }
      });
    }

    window.addEventListener('resize', function() {
      if (typeof MOSAICO !== 'undefined') {
        MOSAICO.generar(estado.datos, 'mosaico', { padding: estado.config.padding, colorFondo: estado.config.colorFondo });
      }
    });

    actualizarBreath(0);
    console.log(`Puerta-Umbral iniciada · Partitura ${estado.partitura} · ${estado.datos.length} palabras`);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();