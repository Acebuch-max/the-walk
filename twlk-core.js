// ============================================================
// TWLK CORE - Utilidades base para todo el proyecto
// Ubicación: js/twlk-core.js
// ============================================================

const TWLK = (function() {
    'use strict';

    // ============================================================
    // CONFIGURACIÓN GLOBAL
    // ============================================================
    
    const CONFIG = {
        paths: {
            data: 'data/',
            graficos: 'graficos/',
            portadas: 'graficos/portadas/',
            videos: 'graficos/videos/',
            audio: 'audio/'
        },
        intervals: {
            breath: 3000,
            heartbeat: 5000
        },
        breath: {
            reposo: { min: 0.00, max: 0.25, label: 'Reposo', icon: '🌙' },
            despertar: { min: 0.25, max: 0.45, label: 'Despertar', icon: '🌅' },
            equilibrio: { min: 0.45, max: 0.65, label: 'Equilibrio', icon: '🌿' },
            intensidad: { min: 0.65, max: 0.85, label: 'Intensidad', icon: '🔥' },
            plenitud: { min: 0.85, max: 1.00, label: 'Plenitud', icon: '⭐' }
        }
    };

    // ============================================================
    // FETCH CON CACHE
    // ============================================================
    
    let cache = {};

    async function fetchJSON(url, forceRefresh = false) {
        const key = url;
        if (!forceRefresh && cache[key]) {
            return cache[key];
        }
        
        try {
            const response = await fetch(url + '?t=' + Date.now());
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            cache[key] = data;
            return data;
        } catch (error) {
            console.warn(`⚠️ No se pudo cargar: ${url}`, error);
            return null;
        }
    }

    // ============================================================
    // SISTEMA DE EVENTOS
    // ============================================================
    
    const events = {};

    function on(event, callback) {
        if (!events[event]) events[event] = [];
        events[event].push(callback);
        return () => off(event, callback);
    }

    function emit(event, data) {
        if (!events[event]) return;
        events[event].forEach(callback => {
            try { callback(data); } catch (e) { console.error(e); }
        });
    }

    function off(event, callback) {
        if (!events[event]) return;
        events[event] = events[event].filter(cb => cb !== callback);
    }

    // ============================================================
    // GESTIÓN DEL BREATH
    // ============================================================
    
    let breathState = {
        valor: 0.5,
        pct: 50,
        nombre: 'equilibrio',
        estado: 'equilibrio',
        icono: '🌿',
        timestamp: null
    };

    async function actualizarBreath() {
        const data = await fetchJSON(CONFIG.paths.data + 'breath_estado.json');
        if (data && data.breath !== undefined) {
            const valor = Math.max(0, Math.min(1, data.breath));
            const mapeo = mapearBreath(valor);
            
            breathState = {
                valor: valor,
                pct: Math.round(valor * 100),
                nombre: data.nombre || mapeo.label,
                estado: mapeo.estado,
                icono: mapeo.icon,
                timestamp: data.timestamp || new Date().toISOString()
            };
            
            emit('breath:actualizado', breathState);
        }
        return breathState;
    }

    function obtenerBreath() {
        return breathState;
    }

    // ============================================================
    // MAPEO DE BREATH
    // ============================================================
    
    function mapearBreath(valor) {
        const config = CONFIG.breath;
        if (valor < config.reposo.max) {
            return { estado: 'reposo', label: config.reposo.label, icon: config.reposo.icon };
        } else if (valor < config.despertar.max) {
            return { estado: 'despertar', label: config.despertar.label, icon: config.despertar.icon };
        } else if (valor < config.equilibrio.max) {
            return { estado: 'equilibrio', label: config.equilibrio.label, icon: config.equilibrio.icon };
        } else if (valor < config.intensidad.max) {
            return { estado: 'intensidad', label: config.intensidad.label, icon: config.intensidad.icon };
        } else {
            return { estado: 'plenitud', label: config.plenitud.label, icon: config.plenitud.icon };
        }
    }

    // ============================================================
    // AUDIO
    // ============================================================
    
    let audioContext = null;
    let isAudioInitialized = false;

    function initAudio() {
        if (isAudioInitialized) return audioContext;
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            isAudioInitialized = true;
            emit('audio:inicializado', { context: audioContext });
            return audioContext;
        } catch (e) {
            console.warn('⚠️ Web Audio no soportado:', e);
            return null;
        }
    }

    function resumeAudio() {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }

    // ============================================================
    // API PÚBLICA
    // ============================================================
    
    return {
        config: CONFIG,
        fetchJSON,
        on,
        off,
        emit,
        actualizarBreath,
        obtenerBreath,
        mapearBreath,
        initAudio,
        resumeAudio
    };

})();

window.TWLK = TWLK;
console.log('🌿 TWLK Core cargado');