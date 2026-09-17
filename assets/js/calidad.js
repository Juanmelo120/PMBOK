/* ═══════════════════════════════════════════════════════════
   calidad.js — Motor de verificación de calidad
   ───────────────────────────────────────────────────────────
   Evalúa lo que el usuario escribe en cada campo contra las
   reglas declaradas en secciones-proyecto.js, y comprueba la
   coherencia entre secciones. Todo es determinista y local:
   no hay generación de texto, solo comprobaciones explicables.
   ═══════════════════════════════════════════════════════════ */

window.Calidad = (function () {
  'use strict';

  /* ══════════════ Utilidades de texto ══════════════ */

  var RE_DIACRITICOS = new RegExp('[\\u0300-\\u036f]', 'g');

  function normalizar(s) {
    var t = String(s == null ? '' : s).toLowerCase();
    if (t.normalize) { t = t.normalize('NFD').replace(RE_DIACRITICOS, ''); }
    return t.replace(/\s+/g, ' ').trim();
  }

  function soloLetras(s) {
    return normalizar(s).replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function vacio(texto) {
    return !texto || !String(texto).trim();
  }

  /* Líneas útiles: sin viñetas, sin líneas en blanco */
  function lineas(texto) {
    return String(texto || '')
      .split(/\r?\n/)
      .map(function (l) { return l.replace(/^\s*(?:[-•*–—]|\d+[.)])\s*/, '').trim(); })
      .filter(function (l) { return l.length > 0; });
  }

  function palabras(texto) {
    var t = soloLetras(texto);
    return t ? t.split(' ').length : 0;
  }

  /* Columnas de una línea tabular: | ; o tabulador */
  function columnas(linea) {
    return String(linea).split(/\s*(?:\||;|\t)\s*/).filter(function (c) { return c.trim().length > 0; });
  }

  /* Concordancia: plural(2, 'riesgo', 'riesgos') → «2 riesgos» */
  function plural(n, singular, varios) {
    return n + ' ' + (n === 1 ? singular : (varios || singular + 's'));
  }

  /* ══════════════ Patrones de contenido ══════════════ */

  var MESES = 'enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre';

  var RE = {
    cifra:      /\b\d+(?:[.,]\d+)*\b/g,
    porcentaje: /\d+(?:[.,]\d+)?\s*%|\bpor ciento\b/gi,
    dinero: new RegExp(
      '(?:[$€£₡]|s\\/\\.?|bs\\.?|rd\\$|us\\$)\\s?\\d[\\d.,]*' +
      '|\\d[\\d.,]*\\s?(?:usd|eur|cop|mxn|ars|clp|pen|bob|gtq|dolares|dólares|euros|pesos|soles|quetzales|millones|mill\\.|mil\\b)',
      'gi'),
    fecha: new RegExp(
      '\\b\\d{1,2}[\\/\\-.]\\d{1,2}[\\/\\-.]\\d{2,4}\\b' +
      '|\\b\\d{4}-\\d{2}-\\d{2}\\b' +
      '|\\b\\d{1,2}\\s+de\\s+(?:' + MESES + ')(?:\\s+de\\s+\\d{4})?\\b' +
      '|\\b(?:' + MESES + ')\\s+(?:de\\s+)?\\d{4}\\b' +
      '|\\b(?:semana|mes|trimestre|sprint|iteracion|iteración|ciclo)\\s+\\d{1,2}\\b' +
      '|\\b[QT][1-4]\\s*\\d{4}\\b' +
      '|\\b20\\d{2}\\b',
      'gi'),
    numeracion: /^\s*\d+(?:\.\d+)*\s+\S/,
    duracion:   /\b\d+(?:[.,]\d+)?\s*(?:d|h|día|dias|días|hora|horas|semana|semanas|mes|meses|jornada|jornadas|sem)\b/i,
    // Plazo relativo: «en 6 meses», «3 semanas después». Cuenta como
    // compromiso temporal para los objetivos, pero no como fecha de hito.
    plazo:      /\b\d+\s*(?:día|días|dias|semana|semanas|mes|meses|año|años|anio|anios|trimestre|trimestres)\b/i,
    verboInf:   /^(?:[a-záéíóúñ]+(?:ar|er|ir))\b/i
  };

  function cuenta(texto, patron) {
    var m = String(texto || '').match(patron);
    return m ? m.length : 0;
  }

  function tiene(texto, patron) {
    return cuenta(texto, patron) > 0;
  }

  /* Convierte «45.000», «1,5», «12 000» a número */
  function aNumero(s) {
    var t = String(s || '').replace(/\s/g, '');
    // Separador de miles: punto o coma seguidos de exactamente 3 dígitos
    t = t.replace(/(\d)[.,](\d{3})(?!\d)/g, '$1$2');
    t = t.replace(/(\d)[.,](\d{3})(?!\d)/g, '$1$2');
    t = t.replace(',', '.');
    var n = parseFloat(t);
    return isNaN(n) ? null : n;
  }

  /* Importes de un texto, con multiplicador para «millones» y «mil» */
  function importes(texto) {
    var salida = [];
    var re = new RegExp(
      '(?:[$€£₡]|us\\$|rd\\$)?\\s?(\\d[\\d.,]*)\\s?(millones|millon|millón|mil\\b|k\\b)?\\s?' +
      '(?:usd|eur|cop|mxn|ars|clp|pen|bob|gtq|dolares|dólares|euros|pesos|soles|quetzales)?',
      'gi');
    var m;
    while ((m = re.exec(texto)) !== null) {
      if (!m[1]) continue;
      var contexto = texto.slice(Math.max(0, m.index - 2), m.index + m[0].length + 6);
      var esDinero = /[$€£₡]|us\$|rd\$|usd|eur|cop|mxn|ars|clp|pen|bob|gtq|dolares|dólares|euros|pesos|soles|quetzales|millones|millón|millon|mil\b/i.test(contexto);
      if (!esDinero) continue;
      var v = aNumero(m[1]);
      if (v === null) continue;
      if (m[2]) {
        var mult = /mill/i.test(m[2]) ? 1e6 : 1e3;
        v = v * mult;
      }
      salida.push(v);
      if (re.lastIndex === m.index) re.lastIndex++;
    }
    return salida;
  }

  /* Fechas reconocibles convertidas a Date (las que se pueden situar) */
  var NOMBRE_MES = {
    enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5, julio: 6,
    agosto: 7, septiembre: 8, setiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
  };

  function fechas(texto) {
    var t = String(texto || '');
    var salida = [];
    var m, re;

    re = /\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/g;
    while ((m = re.exec(t)) !== null) {
      var anio = m[3].length === 2 ? 2000 + parseInt(m[3], 10) : parseInt(m[3], 10);
      salida.push(new Date(anio, parseInt(m[2], 10) - 1, parseInt(m[1], 10)));
    }

    re = /\b(\d{4})-(\d{2})-(\d{2})\b/g;
    while ((m = re.exec(t)) !== null) {
      salida.push(new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10)));
    }

    re = new RegExp('\\b(\\d{1,2})\\s+de\\s+(' + MESES + ')(?:\\s+de\\s+(\\d{4}))?\\b', 'gi');
    while ((m = re.exec(t)) !== null) {
      var mes = NOMBRE_MES[normalizar(m[2])];
      var a = m[3] ? parseInt(m[3], 10) : new Date().getFullYear();
      if (mes !== undefined) salida.push(new Date(a, mes, parseInt(m[1], 10)));
    }

    re = new RegExp('\\b(' + MESES + ')\\s+(?:de\\s+)?(\\d{4})\\b', 'gi');
    while ((m = re.exec(t)) !== null) {
      var mes2 = NOMBRE_MES[normalizar(m[1])];
      if (mes2 !== undefined) salida.push(new Date(parseInt(m[2], 10), mes2, 15));
    }

    return salida.filter(function (d) { return d instanceof Date && !isNaN(d.getTime()); });
  }

  /* ══════════════ Catálogo de reglas ══════════════ */
  /* Cada evaluador recibe (texto, regla, contexto) y devuelve
     { puntos: 0..1, detalle: 'texto explicativo' }               */

  var EVALUADORES = {

    minPalabras: function (texto, regla) {
      var p = palabras(texto);
      return {
        puntos: Math.min(1, p / regla.n),
        detalle: plural(p, 'palabra', 'palabras') + ' de las ' + regla.n + ' esperadas',
        corto: p < regla.n
      };
    },

    minLineas: function (texto, regla) {
      var l = lineas(texto).length;
      return {
        puntos: Math.min(1, l / regla.n),
        detalle: plural(l, 'elemento', 'elementos') + ' de los ' + regla.n + ' esperados'
      };
    },

    cifras: function (texto, regla) {
      var c = cuenta(texto, RE.cifra);
      return { puntos: Math.min(1, c / regla.n), detalle: plural(c, 'dato numérico', 'datos numéricos') + ' de ' + regla.n + ' esperados' };
    },

    fechas: function (texto, regla) {
      var c = cuenta(texto, RE.fecha);
      return { puntos: Math.min(1, c / regla.n), detalle: plural(c, 'referencia temporal', 'referencias temporales') + ' de ' + regla.n + ' esperadas' };
    },

    dinero: function (texto, regla) {
      var c = cuenta(texto, RE.dinero);
      return { puntos: Math.min(1, c / regla.n), detalle: plural(c, 'importe', 'importes') + ' con moneda de ' + regla.n + ' esperados' };
    },

    porcentajes: function (texto, regla) {
      var c = cuenta(texto, RE.porcentaje);
      return { puntos: Math.min(1, c / regla.n), detalle: plural(c, 'porcentaje', 'porcentajes') + ' de ' + regla.n + ' esperados' };
    },

    incluye: function (texto, regla) {
      var t = normalizar(texto);
      var encontradas = (regla.claves || []).filter(function (k) { return t.indexOf(normalizar(k)) !== -1; });
      var min = regla.todas ? (regla.claves || []).length : (regla.min || 1);
      var faltan = (regla.claves || []).filter(function (k) { return t.indexOf(normalizar(k)) === -1; });
      return {
        puntos: Math.min(1, encontradas.length / min),
        detalle: encontradas.length
          ? 'Menciona: ' + encontradas.slice(0, 4).join(', ')
          : 'No aparece ninguno de estos términos: ' + (regla.claves || []).slice(0, 6).join(', '),
        faltan: regla.todas ? faltan : []
      };
    },

    evita: function (texto, regla) {
      var t = normalizar(texto);
      var hallados = (regla.claves || []).filter(function (k) { return t.indexOf(normalizar(k)) !== -1; });
      return {
        puntos: hallados.length ? 0 : 1,
        detalle: hallados.length ? 'Contiene: ' + hallados.join(', ') : 'Sin expresiones desaconsejadas'
      };
    },

    sinVaguedad: function (texto) {
      var t = ' ' + soloLetras(texto) + ' ';
      var hallados = [];
      (PMBOK.terminosVagos || []).forEach(function (v) {
        if (t.indexOf(' ' + soloLetras(v) + ' ') !== -1 || t.indexOf(' ' + soloLetras(v) + ',') !== -1) {
          hallados.push(v);
        }
      });
      hallados = hallados.filter(function (v, i) { return hallados.indexOf(v) === i; });
      return {
        puntos: Math.max(0, 1 - hallados.length * 0.34),
        detalle: hallados.length
          ? 'Expresiones imprecisas: ' + hallados.slice(0, 5).map(function (h) { return '«' + h + '»'; }).join(', ')
          : 'Redacción precisa',
        vagos: hallados
      };
    },

    lineasCon: function (texto, regla) {
      var ls = lineas(texto);
      if (!ls.length) return { puntos: 0, detalle: 'Sin contenido' };
      var prueba = {
        cifra: function (l) { return tiene(l, RE.cifra); },
        fecha: function (l) { return tiene(l, RE.fecha); },
        dinero: function (l) { return tiene(l, RE.dinero); },
        porcentaje: function (l) { return tiene(l, RE.porcentaje); },
        duracion: function (l) { return RE.duracion.test(l); },
        numeracion: function (l) { return RE.numeracion.test(l); }
      }[regla.patron] || function () { return false; };

      var ok = ls.filter(prueba);
      var frac = ok.length / ls.length;
      var min = regla.min || 0.7;
      var faltan = ls.filter(function (l) { return !prueba(l); });
      return {
        puntos: Math.min(1, frac / min),
        detalle: ok.length + ' de ' + ls.length + ' líneas cumplen (' + Math.round(frac * 100) + ' %, se esperaba ' + Math.round(min * 100) + ' %)',
        evidencia: faltan.slice(0, 3)
      };
    },

    columnas: function (texto, regla) {
      var ls = lineas(texto);
      if (!ls.length) return { puntos: 0, detalle: 'Sin contenido' };
      var ok = ls.filter(function (l) { return columnas(l).length >= regla.n; });
      var incompletas = ls.filter(function (l) { return columnas(l).length < regla.n; });
      return {
        puntos: ok.length / ls.length,
        detalle: ok.length + ' de ' + ls.length + ' líneas tienen los ' + regla.n + ' campos separados por «|»',
        evidencia: incompletas.slice(0, 3)
      };
    },

    smart: function (texto) {
      var ls = lineas(texto);
      if (!ls.length) return { puntos: 0, detalle: 'Sin objetivos' };
      var flojas = [];
      var suma = 0;
      ls.forEach(function (l) {
        var verbo = RE.verboInf.test(l.trim()) ? 1 : 0;
        var cifra = tiene(l, RE.cifra) ? 1 : 0;
        var fecha = (tiene(l, RE.fecha) || RE.plazo.test(l)) ? 1 : 0;
        var s = verbo * 0.25 + cifra * 0.4 + fecha * 0.35;
        suma += s;
        if (s < 0.7) {
          var falta = [];
          if (!verbo) falta.push('verbo en infinitivo');
          if (!cifra) falta.push('magnitud medible');
          if (!fecha) falta.push('fecha o plazo límite');
          flojas.push(l.slice(0, 70) + (l.length > 70 ? '…' : '') + '  → falta ' + falta.join(' y '));
        }
      });
      return {
        puntos: suma / ls.length,
        detalle: (ls.length - flojas.length) + ' de ' + ls.length + ' objetivos son verificables',
        evidencia: flojas.slice(0, 3)
      };
    }
  };

  /* Nombre por defecto de cada criterio cuando el dato no lo trae */
  var ETIQUETA_POR_DEFECTO = {
    minPalabras: 'Desarrollo suficiente',
    minLineas: 'Número de elementos',
    cifras: 'Datos cuantificados',
    fechas: 'Referencias temporales',
    dinero: 'Importes con moneda',
    porcentajes: 'Porcentajes',
    incluye: 'Contenido esperado',
    evita: 'Sin expresiones desaconsejadas',
    sinVaguedad: 'Precisión del lenguaje',
    lineasCon: 'Consistencia de las líneas',
    columnas: 'Estructura de la tabla',
    smart: 'Objetivos SMART'
  };

  /* Cómo corregir, por tipo de regla */
  function comoCorregir(regla, campo, res) {
    if (regla.ayuda) return regla.ayuda;
    switch (regla.r) {
      case 'minPalabras':
        return 'Desarrolla la respuesta hasta unas ' + regla.n + ' palabras: añade el dato, el responsable y el momento.';
      case 'minLineas':
        return 'Añade elementos hasta llegar a ' + regla.n + ', uno por línea.';
      case 'cifras':
        return 'Incorpora al menos ' + regla.n + ' magnitudes medidas: cantidades, plazos, tasas o importes.';
      case 'fechas':
        return 'Añade fechas concretas (por ejemplo 15/05/2026) o referencias temporales verificables.';
      case 'dinero':
        return 'Escribe los importes con su moneda, por ejemplo 12.000 USD.';
      case 'porcentajes':
        return 'Expresa la proporción en porcentaje.';
      case 'incluye':
        return 'Debe aparecer explícitamente alguno de estos elementos: ' + (regla.claves || []).slice(0, 6).join(', ') + '.';
      case 'evita':
        return 'Sustituye las expresiones señaladas por formulaciones concretas.';
      case 'sinVaguedad':
        return 'Cambia cada expresión imprecisa por un dato: en lugar de «mejorar», di cuánto y respecto de qué.';
      case 'lineasCon':
        return 'Revisa las líneas señaladas: cada una necesita ' +
          ({ cifra: 'un dato numérico', fecha: 'una fecha', dinero: 'un importe con moneda',
             porcentaje: 'un porcentaje', duracion: 'una duración', numeracion: 'numeración jerárquica (1, 1.1)' }[regla.patron] || 'el elemento indicado') + '.';
      case 'columnas':
        return 'Separa los campos con el carácter «|»' + (campo && campo.formato ? ' siguiendo el formato: ' + campo.formato : '') + '.';
      case 'smart':
        return 'Reescribe los objetivos señalados con verbo en infinitivo, magnitud medible y fecha límite.';
      default:
        return res && res.detalle ? res.detalle : '';
    }
  }

  function estadoDe(puntos) {
    if (puntos >= 0.95) return 'ok';
    if (puntos >= 0.5) return 'parcial';
    return 'falta';
  }

  /* ══════════════ Evaluación de un campo ══════════════ */

  function evaluarCampo(campo, texto) {
    var peso = campo.peso || 1;
    var base = {
      id: campo.id, etiqueta: campo.etiqueta, peso: peso,
      tipo: campo.tipo, vacio: vacio(texto),
      palabras: palabras(texto), lineas: lineas(texto).length
    };

    if (base.vacio) {
      base.puntaje = 0;
      base.criterios = (campo.reglas || []).map(function (regla) {
        return {
          etiqueta: regla.etiqueta || ETIQUETA_POR_DEFECTO[regla.r] || regla.r,
          estado: 'falta', puntos: 0, peso: regla.peso || 1,
          detalle: 'Campo sin redactar',
          como: comoCorregir(regla, campo, null)
        };
      });
      return base;
    }

    var sumaPesos = 0, sumaPuntos = 0;
    base.criterios = (campo.reglas || []).map(function (regla) {
      var ev = EVALUADORES[regla.r];
      var res = ev ? ev(texto, regla, campo) : { puntos: 1, detalle: '' };
      var p = Math.max(0, Math.min(1, res.puntos));
      var pesoR = regla.peso || 1;
      sumaPesos += pesoR;
      sumaPuntos += p * pesoR;
      return {
        etiqueta: regla.etiqueta || ETIQUETA_POR_DEFECTO[regla.r] || regla.r,
        estado: estadoDe(p), puntos: p, peso: pesoR,
        detalle: res.detalle || '',
        evidencia: res.evidencia || [],
        como: p >= 0.95 ? '' : comoCorregir(regla, campo, res)
      };
    });

    base.puntaje = sumaPesos ? Math.round((sumaPuntos / sumaPesos) * 100) : 100;
    return base;
  }

  /* ══════════════ Evaluación de una sección ══════════════ */

  function evaluarSeccion(seccion, valores, procesosMarcados) {
    valores = valores || {};
    var campos = seccion.campos.map(function (c) {
      return evaluarCampo(c, valores[c.id]);
    });

    var pesoTotal = 0, puntosTotal = 0, pesoLleno = 0;
    campos.forEach(function (c) {
      pesoTotal += c.peso;
      puntosTotal += c.puntaje * c.peso;
      if (!c.vacio) pesoLleno += c.peso;
    });

    var procesos = seccion.procesos || [];
    var marcados = procesos.filter(function (p) {
      return procesosMarcados && procesosMarcados[p];
    }).length;

    return {
      id: seccion.id,
      n: seccion.n,
      nombre: seccion.nombre,
      dominio: seccion.dominio,
      campos: campos,
      puntaje: pesoTotal ? Math.round(puntosTotal / pesoTotal) : 0,
      completitud: pesoTotal ? Math.round((pesoLleno / pesoTotal) * 100) : 0,
      camposLlenos: campos.filter(function (c) { return !c.vacio; }).length,
      camposTotal: campos.length,
      procesosMarcados: marcados,
      procesosTotal: procesos.length,
      nivel: nivelDe(pesoTotal ? Math.round(puntosTotal / pesoTotal) : 0)
    };
  }

  /* ══════════════ Verificaciones cruzadas ══════════════ */

  function valorDe(proyecto, ruta) {
    var p = String(ruta).split('.');
    var sec = (proyecto.campos || {})[p[0]] || {};
    return sec[p[1]] || '';
  }

  /* Clave textual de una línea: su primera columna, o las
     primeras palabras si no está tabulada */
  function claveDeLinea(linea) {
    var cols = columnas(linea);
    var base = cols.length > 1 ? cols[0] : linea;
    return soloLetras(base).split(' ').filter(function (w) { return w.length >= 5; });
  }

  /* Se considera cubierta si una parte razonable de sus palabras
     significativas aparece en el destino. Se compara por raíz de cinco
     letras para que «migrado» reconozca «migración» y «capacitación»
     reconozca «capacitar». */
  function cubierta(tokens, textoObjetivo) {
    if (!tokens.length) return false;
    var t = soloLetras(textoObjetivo);
    var hits = tokens.filter(function (w) {
      return t.indexOf(w) !== -1 || (w.length > 5 && t.indexOf(w.slice(0, 5)) !== -1);
    });
    return hits.length >= Math.max(1, Math.ceil(tokens.length * 0.34));
  }

  var VERIFICADORES = {

    noVacio: function (v, proyecto) {
      var t = valorDe(proyecto, v.a);
      if (vacio(t)) return { estado: 'falla', detalle: 'El campo está sin redactar.' };
      return { estado: 'ok', detalle: plural(lineas(t).length, 'elemento declarado', 'elementos declarados') + '.' };
    },

    ambosNoVacios: function (v, proyecto) {
      var a = valorDe(proyecto, v.a), b = valorDe(proyecto, v.b);
      if (vacio(a) && vacio(b)) return { estado: 'pendiente', detalle: 'Faltan ambos campos por completar.' };
      if (vacio(a) || vacio(b)) return { estado: 'falla', detalle: 'Solo uno de los dos campos está completo.' };
      return { estado: 'ok', detalle: 'Ambos campos están redactados.' };
    },

    contiene: function (v, proyecto) {
      var t = normalizar(valorDe(proyecto, v.a));
      if (!t) return { estado: 'pendiente', detalle: 'El campo de origen está vacío.' };
      var faltan = (v.claves || []).filter(function (k) { return t.indexOf(normalizar(k)) === -1; });
      var hay = (v.claves || []).length - faltan.length;
      if (v.todas ? faltan.length === 0 : hay > 0) {
        return { estado: 'ok', detalle: 'Aparece lo esperado.' };
      }
      return { estado: 'falla', detalle: 'No aparece: ' + faltan.join(', ') + '.' };
    },

    conteoMinimo: function (v, proyecto) {
      var a = lineas(valorDe(proyecto, v.a)).length;
      var b = lineas(valorDe(proyecto, v.b)).length;
      if (!b) return { estado: 'pendiente', detalle: 'Falta completar el campo de referencia.' };
      if (!a) return { estado: 'falla', detalle: 'Hay ' + plural(b, 'elemento', 'elementos') + ' de referencia y ninguno que le corresponda.' };
      if (a >= b) return { estado: 'ok', detalle: a + ' frente a ' + b + ': cobertura completa.' };
      return { estado: 'aviso', detalle: 'Hay ' + b + ' frente a solo ' + a + ': faltan ' + (b - a) + '.' };
    },

    solapeTexto: function (v, proyecto) {
      var origen = lineas(valorDe(proyecto, v.a));
      var destinos = (Array.isArray(v.b) ? v.b : [v.b]).map(function (r) { return valorDe(proyecto, r); }).join('\n');
      if (!origen.length) return { estado: 'pendiente', detalle: 'El campo de origen está vacío.' };
      if (!destinos.trim()) return { estado: 'pendiente', detalle: 'El campo de destino está vacío.' };

      var sinCubrir = origen.filter(function (l) { return !cubierta(claveDeLinea(l), destinos); });
      var frac = (origen.length - sinCubrir.length) / origen.length;
      var min = v.minSolape || 0.34;
      if (frac >= min) {
        return { estado: 'ok', detalle: Math.round(frac * 100) + ' % de los elementos se reconocen en el destino.' };
      }
      return {
        estado: frac > 0 ? 'aviso' : 'falla',
        detalle: 'Solo el ' + Math.round(frac * 100) + ' % se reconoce en el destino.',
        evidencia: sinCubrir.slice(0, 4).map(function (l) { return l.slice(0, 80); })
      };
    },

    sumaPartidas: function (v, proyecto) {
      var ls = lineas(valorDe(proyecto, v.a));
      var totalTexto = valorDe(proyecto, v.b);
      if (!ls.length || vacio(totalTexto)) return { estado: 'pendiente', detalle: 'Faltan las partidas o el total.' };

      var suma = 0, conImporte = 0;
      ls.forEach(function (l) {
        var vals = importes(l);
        if (vals.length) { suma += Math.max.apply(null, vals); conImporte++; }
      });
      var totales = importes(totalTexto);
      if (!totales.length || !conImporte) return { estado: 'pendiente', detalle: 'No se reconocen importes con moneda.' };
      var total = Math.max.apply(null, totales);

      // Las partidas cubren el costo base; el total suele incluir además
      // las reservas, así que se suman cuando el campo está declarado.
      var reservas = 0;
      if (v.c) {
        importes(valorDe(proyecto, v.c)).forEach(function (x) { reservas += x; });
      }

      var estimado = suma + reservas;
      var desvio = Math.abs(total - estimado) / (total || 1);
      var fmt = function (n) { return Math.round(n).toLocaleString('es-CO'); };
      var desglose = fmt(suma) + (reservas ? ' + ' + fmt(reservas) + ' de reservas' : '');

      if (desvio <= (v.tolerancia || 0.15)) {
        return { estado: 'ok', detalle: 'Partidas ' + desglose + ' frente a total ' + fmt(total) + ': diferencia del ' + Math.round(desvio * 100) + ' %.' };
      }
      return {
        estado: desvio <= 0.35 ? 'aviso' : 'falla',
        detalle: 'Las partidas suman ' + desglose + ' y el total declarado es ' + fmt(total) + ': diferencia del ' + Math.round(desvio * 100) + ' %.'
      };
    },

    riesgosAltos: function (v, proyecto) {
      var ls = lineas(valorDe(proyecto, v.a));
      if (!ls.length) return { estado: 'pendiente', detalle: 'El registro de riesgos está vacío.' };
      var estrategias = ['mitigar', 'evitar', 'transferir', 'aceptar', 'escalar', 'explotar', 'compartir', 'mejorar'];
      var malos = [];
      var altos = 0;

      ls.forEach(function (l) {
        var cols = columnas(l);
        var escalas = [];
        cols.forEach(function (c) {
          var n = parseInt(c.trim(), 10);
          if (!isNaN(n) && n >= 1 && n <= 5 && c.trim().length <= 2) escalas.push(n);
        });
        var producto = escalas.length >= 2 ? escalas[0] * escalas[1] : null;
        if (producto === null || producto < (v.umbral || 12)) return;
        altos++;
        var t = normalizar(l);
        var tieneEstrategia = estrategias.some(function (e) { return t.indexOf(e) !== -1; });
        var tieneDueno = cols.length >= 5 && cols[cols.length - 1].trim().length > 2;
        if (!tieneEstrategia || !tieneDueno) {
          malos.push(l.slice(0, 80) + '  → falta ' + (!tieneEstrategia ? 'estrategia de respuesta' : '') +
            (!tieneEstrategia && !tieneDueno ? ' y ' : '') + (!tieneDueno ? 'responsable' : ''));
        }
      });

      if (!altos) return { estado: 'ok', detalle: 'No hay riesgos por encima del umbral ' + (v.umbral || 12) + ', o no están valorados con escala 1-5.' };
      if (!malos.length) return { estado: 'ok', detalle: plural(altos, 'riesgo alto', 'riesgos altos') + ', con respuesta y responsable.' };
      return { estado: 'falla', detalle: malos.length + ' de ' + altos + ' riesgos altos ' + (malos.length === 1 ? 'está incompleto' : 'están incompletos') + '.', evidencia: malos.slice(0, 4) };
    },

    fechasEnRango: function (v, proyecto) {
      var rango = fechas(valorDe(proyecto, v.b));
      var ls = lineas(valorDe(proyecto, v.a));
      if (rango.length < 2 || !ls.length) return { estado: 'pendiente', detalle: 'Falta el calendario general o los hitos.' };
      var min = new Date(Math.min.apply(null, rango.map(function (d) { return d.getTime(); })));
      var max = new Date(Math.max.apply(null, rango.map(function (d) { return d.getTime(); })));
      var holgura = 15 * 24 * 3600 * 1000;
      var fuera = [];
      ls.forEach(function (l) {
        fechas(l).forEach(function (d) {
          if (d.getTime() < min.getTime() - holgura || d.getTime() > max.getTime() + holgura) {
            fuera.push(l.slice(0, 80));
          }
        });
      });
      if (!fuera.length) return { estado: 'ok', detalle: 'Todos los hitos caen dentro del calendario declarado.' };
      return {
        estado: 'aviso',
        detalle: plural(fuera.length, 'hito', 'hitos') + ' con fecha fuera del periodo ' +
          min.toLocaleDateString('es') + ' – ' + max.toLocaleDateString('es') + '.',
        evidencia: fuera.slice(0, 3)
      };
    },

    principiosCompletos: function (v, proyecto) {
      var sec = (PMBOK.seccionesProyecto || []).filter(function (s) { return s.esPrincipios; })[0];
      if (!sec) return { estado: 'pendiente', detalle: '' };
      var vals = (proyecto.campos || {})[sec.id] || {};
      var faltan = sec.campos.filter(function (c) { return palabras(vals[c.id]) < 15; });
      if (!faltan.length) return { estado: 'ok', detalle: 'Los seis principios tienen evidencia redactada.' };
      return {
        estado: faltan.length >= 4 ? 'falla' : 'aviso',
        detalle: faltan.length + ' de los 6 principios sin evidencia suficiente.',
        evidencia: faltan.map(function (c) { return c.etiqueta; })
      };
    }
  };

  var PESO_SEVERIDAD = { alta: 3, media: 2, baja: 1 };

  function verificarCruzadas(proyecto) {
    return (PMBOK.verificacionesProyecto || []).map(function (v) {
      var fn = VERIFICADORES[v.tipo];
      var res = fn ? fn(v, proyecto) : { estado: 'pendiente', detalle: '' };
      return {
        id: v.id, titulo: v.titulo, severidad: v.severidad || 'media',
        estado: res.estado,
        detalle: res.detalle || '',
        evidencia: res.evidencia || [],
        explicacion: v.explicacion,
        comoCorregir: v.comoCorregir,
        campos: [v.a].concat(Array.isArray(v.b) ? v.b : (v.b ? [v.b] : [])).filter(Boolean)
      };
    });
  }

  /* ══════════════ Nivel y veredicto ══════════════ */

  function nivelDe(p) {
    if (p >= 90) return { clave: 'solido', etiqueta: 'Sólido', color: 'ok' };
    if (p >= 75) return { clave: 'aceptable', etiqueta: 'Aceptable con ajustes', color: 'ok' };
    if (p >= 60) return { clave: 'mejorable', etiqueta: 'Mejorable', color: 'aviso' };
    if (p >= 35) return { clave: 'incompleto', etiqueta: 'Incompleto', color: 'aviso' };
    if (p > 0) return { clave: 'insuficiente', etiqueta: 'Insuficiente', color: 'falla' };
    return { clave: 'vacio', etiqueta: 'Sin desarrollar', color: 'falla' };
  }

  function veredicto(g) {
    if (g.puntaje >= 90) {
      return 'El plan está completo y es verificable. Las decisiones se apoyan en datos y las secciones no se contradicen entre sí.';
    }
    if (g.puntaje >= 75) {
      return 'El plan es sólido en lo esencial. Quedan ajustes concretos —sobre todo de precisión y de coherencia entre secciones— antes de darlo por aprobado.';
    }
    if (g.puntaje >= 60) {
      return 'La estructura está, pero le falta rigor: hay campos redactados sin datos medibles o sin responsable. Revisa primero los hallazgos de severidad alta.';
    }
    if (g.puntaje >= 35) {
      return 'El plan está a medio construir. Completa las secciones vacías antes de pulir las que ya tienen contenido: los huecos pesan más que los matices.';
    }
    if (g.puntaje > 0) {
      return 'Apenas hay contenido evaluable. Empieza por el Encuadre: sin problema cuantificado ni objetivos medibles, el resto no tiene contra qué contrastarse.';
    }
    return 'Todavía no hay nada que evaluar. Sube el documento del proyecto o empieza a redactar la primera sección.';
  }

  /* ══════════════ Evaluación completa ══════════════ */

  function evaluarProyecto(proyecto) {
    proyecto = proyecto || {};
    var valores = proyecto.campos || {};
    var marcados = proyecto.procesos || {};

    var secciones = (PMBOK.seccionesProyecto || []).map(function (s) {
      return evaluarSeccion(s, valores[s.id], marcados);
    });

    var pesoTotal = 0, puntosTotal = 0, pesoLleno = 0;
    secciones.forEach(function (s, i) {
      var peso = (PMBOK.seccionesProyecto[i].campos || []).reduce(function (a, c) { return a + (c.peso || 1); }, 0);
      s.peso = peso;
      pesoTotal += peso;
      puntosTotal += s.puntaje * peso;
      pesoLleno += (s.completitud / 100) * peso;
    });

    var contenido = pesoTotal ? Math.round(puntosTotal / pesoTotal) : 0;
    var completitud = pesoTotal ? Math.round((pesoLleno / pesoTotal) * 100) : 0;

    var cruzadas = verificarCruzadas(proyecto);
    var pesoCruz = 0, puntosCruz = 0;
    cruzadas.forEach(function (c) {
      var w = PESO_SEVERIDAD[c.severidad] || 2;
      pesoCruz += w;
      puntosCruz += w * (c.estado === 'ok' ? 1 : c.estado === 'aviso' ? 0.5 : c.estado === 'pendiente' ? 0.15 : 0);
    });
    var coherencia = pesoCruz ? Math.round((puntosCruz / pesoCruz) * 100) : 0;

    var totalProcesos = (PMBOK.procesos || []).length;
    var procesosMarcados = Object.keys(marcados).filter(function (k) { return marcados[k]; }).length;

    // Sin contenido no hay nada que puntuar: las verificaciones cruzadas
    // en estado «pendiente» no deben producir un puntaje de partida.
    var puntaje = contenido === 0 ? 0 : Math.round(contenido * 0.78 + coherencia * 0.22);

    var global = {
      puntaje: puntaje,
      contenido: contenido,
      coherencia: coherencia,
      completitud: completitud,
      nivel: nivelDe(puntaje),
      procesosMarcados: procesosMarcados,
      procesosTotal: totalProcesos,
      cobertura: totalProcesos ? Math.round((procesosMarcados / totalProcesos) * 100) : 0
    };
    global.veredicto = veredicto(global);

    return {
      global: global,
      secciones: secciones,
      cruzadas: cruzadas,
      hallazgos: hallazgos(secciones, cruzadas),
      fecha: Date.now()
    };
  }

  /* ══════════════ Hallazgos ordenados por prioridad ══════════════ */

  function hallazgos(secciones, cruzadas) {
    var lista = [];

    cruzadas.forEach(function (c) {
      if (c.estado === 'ok') return;
      lista.push({
        tipo: 'coherencia',
        severidad: c.estado === 'falla' ? c.severidad : (c.severidad === 'alta' ? 'media' : 'baja'),
        titulo: c.titulo,
        detalle: c.detalle + (c.explicacion ? ' ' + c.explicacion : ''),
        como: c.comoCorregir,
        evidencia: c.evidencia,
        ruta: null
      });
    });

    secciones.forEach(function (s) {
      s.campos.forEach(function (c) {
        if (c.vacio) {
          lista.push({
            tipo: 'vacio',
            severidad: c.peso >= 4 ? 'alta' : c.peso >= 2 ? 'media' : 'baja',
            titulo: s.nombre + ' · ' + c.etiqueta,
            detalle: 'Campo sin redactar.',
            como: 'Completa este campo: es de peso ' + c.peso + ' sobre el puntaje de la sección.',
            ruta: s.id
          });
          return;
        }
        c.criterios.forEach(function (cr) {
          if (cr.estado === 'ok') return;
          lista.push({
            tipo: 'calidad',
            severidad: cr.estado === 'falta' ? (c.peso >= 3 ? 'alta' : 'media') : 'baja',
            titulo: s.nombre + ' · ' + c.etiqueta + ' — ' + cr.etiqueta,
            detalle: cr.detalle,
            como: cr.como,
            evidencia: cr.evidencia,
            ruta: s.id
          });
        });
      });
    });

    var orden = { alta: 0, media: 1, baja: 2 };
    return lista.sort(function (a, b) { return orden[a.severidad] - orden[b.severidad]; });
  }

  /* ══════════════ Retroalimentación redactada por sección ══════════════ */

  function retroalimentacion(seccionEval) {
    var fortalezas = [], correcciones = [], sugerencias = [];

    seccionEval.campos.forEach(function (c) {
      if (c.vacio) {
        correcciones.push('<b>' + c.etiqueta + '</b> está sin redactar y pesa ' + c.peso + ' en la sección.');
        return;
      }
      var fallos = c.criterios.filter(function (cr) { return cr.estado === 'falta'; });
      var parciales = c.criterios.filter(function (cr) { return cr.estado === 'parcial'; });
      if (!fallos.length && !parciales.length) {
        fortalezas.push('<b>' + c.etiqueta + '</b> cumple los ' + c.criterios.length + ' criterios de calidad.');
      }
      fallos.forEach(function (cr) {
        correcciones.push('<b>' + c.etiqueta + '</b>: ' + cr.etiqueta.toLowerCase() + '. ' + cr.como);
      });
      parciales.forEach(function (cr) {
        sugerencias.push('<b>' + c.etiqueta + '</b>: ' + cr.detalle + '. ' + cr.como);
      });
    });

    var resumen;
    var p = seccionEval.puntaje;
    if (seccionEval.camposLlenos === 0) {
      resumen = 'Sección sin empezar. Cada campo trae su guía y un ejemplo desarrollado que puedes usar como modelo.';
    } else if (p >= 90) {
      resumen = 'Sección sólida: está completa, es medible y no deja decisiones sin dueño.';
    } else if (p >= 75) {
      resumen = 'Buena base. Lo que queda son precisiones, no reescrituras.';
    } else if (p >= 60) {
      resumen = 'El contenido está, pero le falta concreción: la mayoría de las observaciones se resuelven añadiendo cifras, fechas o responsables.';
    } else if (p >= 35) {
      resumen = 'Sección a medio hacer. Completa primero los campos de mayor peso: mueven más el puntaje y sostienen a las demás secciones.';
    } else {
      resumen = 'Apenas hay contenido evaluable en esta sección.';
    }

    return {
      resumen: resumen,
      fortalezas: fortalezas,
      correcciones: correcciones,
      sugerencias: sugerencias
    };
  }

  return {
    evaluarCampo: evaluarCampo,
    evaluarSeccion: evaluarSeccion,
    evaluarProyecto: evaluarProyecto,
    retroalimentacion: retroalimentacion,
    nivelDe: nivelDe,
    lineas: lineas,
    palabras: palabras,
    columnas: columnas,
    importes: importes,
    fechas: fechas,
    normalizar: normalizar
  };
})();
