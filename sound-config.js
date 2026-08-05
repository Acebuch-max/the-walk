/* ============================================================
   THE WALK - sound-config.js
   Configuración de sonidos por página (cada página = su .mp3)
   ============================================================ */

const SOUND_CONFIG = {
    // ==========================================
    // PÁGINAS PRINCIPALES
    // ==========================================
    'index.html': {
        file: 'audio/index_ambiente.mp3',
        volume: 0.6,
        loop: true
    },
    'B.html': {
        file: 'audio/B_ambiente.mp3',
        volume: 0.5,
        loop: true
    },
    
    // ==========================================
    // ZONAS C (5 zonas)
    // ==========================================
    'C1.html': {
        file: 'audio/C1_ambiente.mp3',
        volume: 0.4,
        loop: true
    },
    'C2.html': {
        file: 'audio/C2_ambiente.mp3',
        volume: 0.4,
        loop: true
    },
    'C3.html': {
        file: 'audio/C3_ambiente.mp3',
        volume: 0.4,
        loop: true
    },
    'C4.html': {
        file: 'audio/C4_ambiente.mp3',
        volume: 0.4,
        loop: true
    },
    'C5.html': {
        file: 'audio/C5_ambiente.mp3',
        volume: 0.4,
        loop: true
    },

    // ==========================================
    // OBRAS D (25 obras)
    // ==========================================
    'D1-1.html': { file: 'audio/D1-1_ambiente.mp3', volume: 0.3, loop: true },
    'D1-2.html': { file: 'audio/D1-2_ambiente.mp3', volume: 0.3, loop: true },
    'D1-3.html': { file: 'audio/D1-3_ambiente.mp3', volume: 0.3, loop: true },
    'D1-4.html': { file: 'audio/D1-4_ambiente.mp3', volume: 0.3, loop: true },
    'D1-5.html': { file: 'audio/D1-5_ambiente.mp3', volume: 0.3, loop: true },
    'D2-1.html': { file: 'audio/D2-1_ambiente.mp3', volume: 0.3, loop: true },
    'D2-2.html': { file: 'audio/D2-2_ambiente.mp3', volume: 0.3, loop: true },
    'D2-3.html': { file: 'audio/D2-3_ambiente.mp3', volume: 0.3, loop: true },
    'D2-4.html': { file: 'audio/D2-4_ambiente.mp3', volume: 0.3, loop: true },
    'D2-5.html': { file: 'audio/D2-5_ambiente.mp3', volume: 0.3, loop: true },
    'D3-1.html': { file: 'audio/D3-1_ambiente.mp3', volume: 0.3, loop: true },
    'D3-2.html': { file: 'audio/D3-2_ambiente.mp3', volume: 0.3, loop: true },
    'D3-3.html': { file: 'audio/D3-3_ambiente.mp3', volume: 0.3, loop: true },
    'D3-4.html': { file: 'audio/D3-4_ambiente.mp3', volume: 0.3, loop: true },
    'D3-5.html': { file: 'audio/D3-5_ambiente.mp3', volume: 0.3, loop: true },
    'D4-1.html': { file: 'audio/D4-1_ambiente.mp3', volume: 0.3, loop: true },
    'D4-2.html': { file: 'audio/D4-2_ambiente.mp3', volume: 0.3, loop: true },
    'D4-3.html': { file: 'audio/D4-3_ambiente.mp3', volume: 0.3, loop: true },
    'D4-4.html': { file: 'audio/D4-4_ambiente.mp3', volume: 0.3, loop: true },
    'D4-5.html': { file: 'audio/D4-5_ambiente.mp3', volume: 0.3, loop: true },
    'D5-1.html': { file: 'audio/D5-1_ambiente.mp3', volume: 0.3, loop: true },
    'D5-2.html': { file: 'audio/D5-2_ambiente.mp3', volume: 0.3, loop: true },
    'D5-3.html': { file: 'audio/D5-3_ambiente.mp3', volume: 0.3, loop: true },
    'D5-4.html': { file: 'audio/D5-4_ambiente.mp3', volume: 0.3, loop: true },
    'D5-5.html': { file: 'audio/D5-5_ambiente.mp3', volume: 0.3, loop: true },

    // ==========================================
    // SALIDAS E (25 salidas)
    // ==========================================
    'E1-1.html': { file: 'audio/E1-1_ambiente.mp3', volume: 0.3, loop: true },
    'E1-2.html': { file: 'audio/E1-2_ambiente.mp3', volume: 0.3, loop: true },
    'E1-3.html': { file: 'audio/E1-3_ambiente.mp3', volume: 0.3, loop: true },
    'E1-4.html': { file: 'audio/E1-4_ambiente.mp3', volume: 0.3, loop: true },
    'E1-5.html': { file: 'audio/E1-5_ambiente.mp3', volume: 0.3, loop: true },
    'E2-1.html': { file: 'audio/E2-1_ambiente.mp3', volume: 0.3, loop: true },
    'E2-2.html': { file: 'audio/E2-2_ambiente.mp3', volume: 0.3, loop: true },
    'E2-3.html': { file: 'audio/E2-3_ambiente.mp3', volume: 0.3, loop: true },
    'E2-4.html': { file: 'audio/E2-4_ambiente.mp3', volume: 0.3, loop: true },
    'E2-5.html': { file: 'audio/E2-5_ambiente.mp3', volume: 0.3, loop: true },
    'E3-1.html': { file: 'audio/E3-1_ambiente.mp3', volume: 0.3, loop: true },
    'E3-2.html': { file: 'audio/E3-2_ambiente.mp3', volume: 0.3, loop: true },
    'E3-3.html': { file: 'audio/E3-3_ambiente.mp3', volume: 0.3, loop: true },
    'E3-4.html': { file: 'audio/E3-4_ambiente.mp3', volume: 0.3, loop: true },
    'E3-5.html': { file: 'audio/E3-5_ambiente.mp3', volume: 0.3, loop: true },
    'E4-1.html': { file: 'audio/E4-1_ambiente.mp3', volume: 0.3, loop: true },
    'E4-2.html': { file: 'audio/E4-2_ambiente.mp3', volume: 0.3, loop: true },
    'E4-3.html': { file: 'audio/E4-3_ambiente.mp3', volume: 0.3, loop: true },
    'E4-4.html': { file: 'audio/E4-4_ambiente.mp3', volume: 0.3, loop: true },
    'E4-5.html': { file: 'audio/E4-5_ambiente.mp3', volume: 0.3, loop: true },
    'E5-1.html': { file: 'audio/E5-1_ambiente.mp3', volume: 0.3, loop: true },
    'E5-2.html': { file: 'audio/E5-2_ambiente.mp3', volume: 0.3, loop: true },
    'E5-3.html': { file: 'audio/E5-3_ambiente.mp3', volume: 0.3, loop: true },
    'E5-4.html': { file: 'audio/E5-4_ambiente.mp3', volume: 0.3, loop: true },
    'E5-5.html': { file: 'audio/E5-5_ambiente.mp3', volume: 0.3, loop: true },

    // ==========================================
    // TRANSICIÓN (sin sonido)
    // ==========================================
    'transicion.html': { file: null },

    // ==========================================
    // PARTITURAS (ArcillaSound, sin .mp3)
    // ==========================================
    'Partitura-I-CircaStellas.html': { file: null },
    'Partitura-I-LosEstorninos.html': { file: null },
    'Partitura-II-CircaStellas.html': { file: null },
    'Partitura-II-LosEstorninos.html': { file: null },
    'Partitura-III-CircaStellas.html': { file: null },
    'Partitura-III-LosEstorninos.html': { file: null },
    'Puerta-Umbral-CircaStellas.html': { file: null },
    'Puerta-Umbral-CircaStellas-II.html': { file: null },
    'Puerta-Umbral-CircaStellas-III.html': { file: null },
    'Puerta-Umbral-LosEstorninos.html': { file: null },
    'Puerta-Umbral.html': { file: null }
};

// --- Obtener configuración de la página actual ---
function getSoundConfig() {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    return SOUND_CONFIG[page] || { file: null };
}