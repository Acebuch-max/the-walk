// js/analizador-fonetico.js
const ANALIZADOR = (function() {
  'use strict';

  // 1. MAPEO DE CONSONANTES A GRISES (B=1.0 blanco, Z=0.0 negro)
  const consonantes = {
    'B': 1.0, 'C': 0.9, 'D': 0.85, 'F': 0.75, 'G': 0.7, 'H': 0.65,
    'J': 0.6, 'K': 0.55, 'L': 0.5, 'M': 0.45, 'N': 0.4, 'Ñ': 0.35,
    'P': 0.3, 'Q': 0.25, 'R': 0.2, 'S': 0.15, 'T': 0.1, 'V': 0.08,
    'W': 0.05, 'X': 0.03, 'Y': 0.02, 'Z': 0.0
  };

  // 2. MAPEO DE VOCALES A COLORES (RGB)
  const vocales = {
    'a': { r: 220, g: 50, b: 50 },   // Rojo
    'e': { r: 200, g: 50, b: 200 },  // Magenta
    'i': { r: 30, g: 60, b: 200 },   // Azul ultramar
    'o': { r: 30, g: 200, b: 180 },  // Cian
    'u': { r: 50, g: 200, b: 50 }    // Verde
  };
  const colorDiptongo = { r: 220, g: 210, b: 50 }; // Amarillo

  // 3. NOTAS PENTATÓNICAS DE SOL (Hz)
  const notas = { 'a': 261.63, 'e': 293.66, 'i': 329.63, 'o': 392.00, 'u': 440.00 };

  // ================================================================
  // FUNCIONES AUXILIARES DE ANÁLISIS LINGÜÍSTICO
  // ================================================================

  // Contar sílabas de una palabra en español (regla simplificada)
  function contarSilabas(palabra) {
    const lower = palabra.toLowerCase();
    // Buscar grupos de vocales (diptongos y triptongos cuentan como 1 sílaba)
    const gruposVocales = lower.match(/[aeiouáéíóúü]+/gi);
    if (!gruposVocales) return 1; // Palabras sin vocales (ej. "psst")
    return gruposVocales.length;
  }

  // Detectar tipo de acento (aguda, llana, esdrújula)
  function detectarAcento(palabra) {
    const lower = palabra.toLowerCase();
    // Buscar la vocal tónica (marcada con tilde)
    const tildes = lower.match(/[áéíóú]/g);
    
    if (tildes && tildes.length > 0) {
      // Si tiene tilde, miramos la última sílaba tónica
      const ultimaLetra = lower.slice(-1);
      const penultimaLetra = lower.slice(-2, -1);
      
      // Si la tilde está en la última sílaba → aguda
      if (lower.match(/[áéíóú][^aeiouáéíóú]*$/)) return 'aguda';
      // Si la tilde está en la penúltima → llana
      if (lower.match(/[áéíóú][^aeiouáéíóú]*[aeiouáéíóú]?$/)) return 'llana';
      // Si no, asumimos esdrújula
      return 'esdrújula';
    }
    
    // Si no tiene tilde, regla general:
    // Si termina en vocal, n, s → llana. Si no → aguda.
    const ultima = lower.slice(-1);
    if (['a','e','i','o','u','n','s'].includes(ultima)) return 'llana';
    return 'aguda';
  }

  // Calcular factor de volumen según acento
  function factorVolumenAcento(tipoAcento) {
    switch(tipoAcento) {
      case 'aguda': return 0.5;      // Baja 1/2
      case 'llana': return 0.75;     // Baja 1/4
      case 'esdrújula': return 0.875; // Baja 1/8
      default: return 1.0;
    }
  }

  // Calcular duración en tiempos según sílabas (compás 4/4)
  function duracionTiempos(numSilabas) {
    if (numSilabas === 1) return 4;   // Redonda (4 tiempos)
    if (numSilabas === 2) return 2;   // Blanca (2 tiempos)
    if (numSilabas === 3) return 1;   // Negra (1 tiempo)
    if (numSilabas >= 4) return 0.5;  // Corchea (1/2 tiempo) -> se dividirá en 2 teselas
    return 1;
  }

  // Obtener octava según consonante guía
  function getOctavaFactor(palabra) {
    const primera = palabra.charAt(0).toUpperCase();
    const idx = Object.keys(consonantes).indexOf(primera);
    if (idx === -1) return 1.0;
    // Mapeo de 0-21 a 0.5-2.0 (grave → aguda)
    return 0.5 + (idx / 21) * 1.5;
  }

  // ================================================================
  // ANALIZADOR PRINCIPAL DE PALABRA
  // ================================================================

  function analizarPalabra(palabra, puntuacion) {
    const lower = palabra.toLowerCase();
    
    // --- Análisis fonético básico (colores y notas) ---
    const vocalesEncontradas = [];
    let esDiptongo = false;
    const diptongos = ['ai','au','ei','eu','ia','ie','io','iu','oi','ou','ua','ue','ui','uo'];

    for (let d of diptongos) { if (lower.includes(d)) { esDiptongo = true; break; } }
    for (let ch of lower.split('')) { if (ch in vocales) vocalesEncontradas.push(ch); }
    if (vocalesEncontradas.length === 0) vocalesEncontradas.push('a');

    // Colores con pesos (1, 1/2, 1/4...)
    const pesos = vocalesEncontradas.map((_, idx) => 1 / Math.pow(2, idx));
    let colorFinal;
    if (esDiptongo) {
      colorFinal = { ...colorDiptongo };
    } else {
      let r = 0, g = 0, b = 0, totalPeso = 0;
      for (let i = 0; i < vocalesEncontradas.length; i++) {
        const c = vocales[vocalesEncontradas[i]];
        const p = pesos[i];
        r += c.r * p; g += c.g * p; b += c.b * p; totalPeso += p;
      }
      if (totalPeso > 0) { r = Math.round(r/totalPeso); g = Math.round(g/totalPeso); b = Math.round(b/totalPeso); }
      colorFinal = { r, g, b };
    }

    // Nota y octava
    const vocalNota = vocalesEncontradas[0] || 'a';
    const freqBase = notas[vocalNota] || 261.63;
    const octava = getOctavaFactor(palabra);
    const frecuencia = freqBase * octava;

    // Gris
    const primeraConsonante = palabra.toUpperCase().split('').find(ch => ch in consonantes) || 'B';
    const gris = consonantes[primeraConsonante] || 1.0;

    // --- Nueva lógica rítmica y dinámica ---
    const numSilabas = contarSilabas(palabra);
    const tipoAcento = detectarAcento(palabra);
    const factorVolumen = factorVolumenAcento(tipoAcento);
    let duracion = duracionTiempos(numSilabas);

    // --- Procesar puntuación adjunta ---
    let silencioAntes = 0;
    let silencioDespues = 0;
    let duracionConSilencio = duracion;

    if (puntuacion) {
      // Coma: silencio de mitad de la duración de la palabra
      if (puntuacion === ',') {
        silencioDespues = duracion * 0.5;
        duracionConSilencio = duracion + silencioDespues;
      }
      // Punto y coma: silencio = duración + 1/2
      else if (puntuacion === ';') {
        silencioDespues = duracion * 1.5;
        duracionConSilencio = duracion + silencioDespues;
      }
      // Punto y seguido: silencio = duración
      else if (puntuacion === '.') {
        silencioDespues = duracion;
        duracionConSilencio = duracion + silencioDespues;
      }
      // Punto y aparte (salto de línea): silencio de 4 tiempos
      else if (puntuacion === '\n') {
        silencioDespues = 4;
        duracionConSilencio = duracion + silencioDespues;
      }
    }

    return {
      palabra,
      color: colorFinal,
      frecuencia,
      gris,
      // Nuevos parámetros
      numSilabas,
      tipoAcento,
      duracion,           // Duración musical pura
      factorVolumen,      // 0.5, 0.75 o 0.875
      silencioAntes,
      silencioDespues,
      duracionTotal: duracionConSilencio, // Duración + silencios
      // Para palabras de 4+ sílabas (se dividirán en 2 teselas)
      dividir: numSilabas >= 4
    };
  }

  // ================================================================
  // ANALIZADOR DE TEXTO COMPLETO (con puntuación)
  // ================================================================

  function analizarTexto(texto) {
    if (!texto || texto.trim() === '') return [];
    
    // Dividir el texto en párrafos (punto y aparte)
    const parrafos = texto.split('\n');
    let datosPalabras = [];

    for (let i = 0; i < parrafos.length; i++) {
      const parrafo = parrafos[i].trim();
      if (!parrafo) continue;

      // Tokenizar palabras y signos de puntuación
      // Regex: captura palabras (letras) y los signos , ; . de forma separada
      const tokens = parrafo.match(/\p{L}+|[.,;]/gu) || [];
      
      let palabraActual = '';
      let puntuacionActual = null;

      // Procesar tokens en orden
      for (let j = 0; j < tokens.length; j++) {
        const token = tokens[j];
        
        // Si es un signo de puntuación
        if (['.', ',', ';'].includes(token)) {
          puntuacionActual = token;
          continue;
        }

        // Si es una palabra
        if (/^\p{L}+$/u.test(token)) {
          palabraActual = token;
          // Analizar la palabra con la puntuación que la sigue (si la hay)
          const analisis = analizarPalabra(palabraActual, puntuacionActual);
          
          // Si la palabra tiene 4+ sílabas, la dividimos en dos teselas
          if (analisis.dividir) {
            // Creamos dos entradas idénticas, pero con duración a la mitad
            const mitad = { ...analisis, duracion: analisis.duracion / 2, dividir: false };
            datosPalabras.push(mitad);
            datosPalabras.push(mitad);
          } else {
            datosPalabras.push(analisis);
          }

          // Resetear puntuación (ya se ha aplicado)
          puntuacionActual = null;
        }
      }
      
      // Al final de cada párrafo, añadir un silencio de punto y aparte
      if (i < parrafos.length - 1) {
        datosPalabras.push({
          palabra: 'SILENCIO',
          color: { r: 0, g: 0, b: 0 },
          frecuencia: 0,
          gris: 0,
          numSilabas: 0,
          tipoAcento: 'none',
          duracion: 0,
          factorVolumen: 0,
          silencioAntes: 0,
          silencioDespues: 4,
          duracionTotal: 4,
          dividir: false
        });
      }
    }

    return datosPalabras;
  }

  return {
    analizarTexto,
    analizarPalabra
  };
})();