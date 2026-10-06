// Motor de hora (interno; dueño: bruno). Contrato: design/contracts/time-field.md «Motor» (L2), DECISIONS.md #401 a #408.
// Sin estado ni DOM, en SEGUNDOS desde las 00:00 (0 … 86399): idioma (ciclo, cifras, marcadores a. m./p. m., franjas del día
// en palabras, dirección; caché por idioma y ciclo), cifras a latinas, filtro de lo tecleado, interpretación de la escritura
// libre (con ambigüedad y la regla de #408), canónico ↔ segundos, formato y aria-valuetext, pasos con arcos que cruzan la
// medianoche (#405) y duración entre dos horas (la usará C, #413). «Ahora» se le pasa como argumento (el reloj lo lee el
// componente, en el cliente). Referencia de comportamiento: design/lab/time-field/engine.js (kiwi). No se exporta desde
// src/index.js.

export const DAY = 86400
const HALF = 43200
const pad = (n) => String(n).padStart(2, '0')
// Marcas de dirección que Intl antepone (U+200E, U+200F, U+061C) y las de incrustación/aislamiento
const BIDI = /[‎‏؜‪-‮⁦-⁩]/g
// Un instante ficticio EN UTC solo para que Intl escriba una hora de pared (nunca la zona del dispositivo)
const utc = (sec) => new Date(Date.UTC(2026, 0, 1, Math.floor(sec / 3600), Math.floor((sec % 3600) / 60), sec % 60))
const clean = (s) => String(s ?? '').replace(BIDI, '')
/** Minúsculas sin diacríticos (Hangul y árabe se recomponen con NFC). */
const strip = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC').toLowerCase()
const lettersOnly = (s) => strip(s).replace(/[^\p{L}]/gu, '')
// Idiomas que se escriben de derecha a izquierda (respaldo sin Intl.Locale#getTextInfo / textInfo)
const RTL = new Set(['ar', 'he', 'iw', 'fa', 'ur', 'ps', 'sd', 'ug', 'yi', 'dv', 'ckb'])

const cache = new Map()

/**
 * Datos del idioma y ciclo. `cycle`: 'h12' | 'h23' | undefined (el del idioma). Lanza RangeError si Intl rechaza la
 * etiqueta (quien llama decide el respaldo).
 */
export function localeInfo(locale, cycle) {
  const key = `${locale || ''}|${cycle || ''}`
  if (cache.has(key)) return cache.get(key)
  const ro = new Intl.DateTimeFormat(locale || undefined, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).resolvedOptions()
  const loc = ro.locale
  const hc = cycle === 'h12' || cycle === 'h23' ? cycle : ro.hourCycle === 'h11' || ro.hourCycle === 'h12' ? 'h12' : 'h23'
  const base = { hour: 'numeric', minute: '2-digit', hourCycle: hc, timeZone: 'UTC' }
  const fmt = new Intl.DateTimeFormat(loc, base)
  const fmtS = new Intl.DateTimeFormat(loc, { ...base, second: '2-digit' })
  const f12 = new Intl.DateTimeFormat(loc, { ...base, hourCycle: 'h12' })
  const pmParts = f12.formatToParts(utc(13 * 3600 + 5 * 60))
  const am = clean(f12.formatToParts(utc(3600)).find((p) => p.type === 'dayPeriod')?.value || 'AM').trim()
  const pm = clean(pmParts.find((p) => p.type === 'dayPeriod')?.value || 'PM').trim()
  const periodFirst = pmParts.findIndex((p) => p.type === 'dayPeriod') < pmParts.findIndex((p) => p.type === 'hour')
  // Cifras del idioma (las de su sistema de numeración: ٠١٢… en ar-EG)
  const nf = new Intl.NumberFormat(loc, { useGrouping: false, numberingSystem: ro.numberingSystem })
  const digits = Array.from({ length: 10 }, (_, i) => clean(nf.format(i)))
  const dmap = new Map(digits.map((d, i) => [d, String(i)]))
  let dir
  try {
    const L = new Intl.Locale(loc)
    dir = (typeof L.getTextInfo === 'function' ? L.getTextInfo() : L.textInfo)?.direction
  } catch { /* sin Intl.Locale */ }
  if (dir !== 'rtl' && dir !== 'ltr') dir = RTL.has(String(loc).split('-')[0].toLowerCase()) ? 'rtl' : 'ltr'
  // Franjas del día en palabras (CLDR: «de la madrugada», «de la mañana», «del mediodía»…), una por hora
  let words = Array.from({ length: 24 }, () => '')
  try {
    const fdp = new Intl.DateTimeFormat(loc, { dayPeriod: 'long', timeZone: 'UTC' })
    words = words.map((_, h) => clean(fdp.format(utc(h * 3600))).trim())
    // Un motor sin dayPeriod escribe una hora o una fecha: no son palabras
    if (words.some((w) => /\d/.test(w) || /[0-9٠-٩]/.test(w))) words = words.map(() => '')
  } catch { /* sin dayPeriod */ }
  let vt12 = null
  let vt12s = null
  try {
    vt12 = new Intl.DateTimeFormat(loc, { ...base, hourCycle: 'h12', dayPeriod: 'long' })
    vt12s = new Intl.DateTimeFormat(loc, { ...base, hourCycle: 'h12', dayPeriod: 'long', second: '2-digit' })
  } catch { /* sin dayPeriod */ }
  const amKey = lettersOnly(am)
  const pmKey = lettersOnly(pm)
  const info = {
    locale: loc,
    cycle: hc,
    am,
    pm,
    amKey,
    pmKey,
    periodFirst,
    digits,
    dmap,
    dir,
    words,
    fmt,
    fmtS,
    vt12,
    vt12s,
    // Letras que entran al teclear: las de los marcadores del idioma, las latinas a/p/m y las de las franjas del día (#407)
    letters: new Set([...amKey, ...pmKey, 'a', 'p', 'm', ...[...words.join('')].filter((c) => /\p{L}/u.test(c)).map((c) => strip(c))])
  }
  cache.set(key, info)
  return info
}

/** ¿Acepta Intl esta etiqueta? (sin lanzar) */
export function isValidLocale(locale) {
  try {
    localeInfo(locale)
    return true
  } catch {
    return false
  }
}

/** Cifras del idioma → latinas, sin marcas bidi. */
export function toLatin(text, info) {
  let out = ''
  for (const ch of clean(text)) out += info?.dmap.get(ch) ?? ch
  return out
}

/**
 * Filtro de lo tecleado (#404): cifras (del idioma y latinas), «:» «.» «,», cualquier espacio, «h»/«H», las letras de los
 * marcadores (del idioma y a/p/m), las de las franjas del día y «'»/«’». Lo demás no entra.
 */
export function filterTyped(text, info) {
  let out = ''
  for (const ch of clean(text)) {
    if (/[0-9]/.test(ch) || info.dmap.has(ch) || /[:.,'’\s]/u.test(ch) || ch === 'h' || ch === 'H') out += ch
    else if (/\p{L}/u.test(ch) && info.letters.has(strip(ch))) out += ch
  }
  return out
}

// ---------- Modelo ----------

/** Segundos → «HH:mm» (o «HH:mm:ss»); null → ''. */
export function canonical(sec, seconds = false) {
  if (sec == null) return ''
  return `${pad(Math.floor(sec / 3600))}:${pad(Math.floor((sec % 3600) / 60))}${seconds ? `:${pad(sec % 60)}` : ''}`
}
/** «HH:mm» o «HH:mm:ss» (24 h, cero delante, cifras latinas) → segundos; cualquier otra cosa → null. */
export function fromCanonical(v) {
  if (typeof v !== 'string') return null
  const m = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(v)
  if (!m) return null
  const h = +m[1]
  const mi = +m[2]
  const s = +(m[3] || 0)
  if (h > 23 || mi > 59 || s > 59) return null
  return h * 3600 + mi * 60 + s
}
/** ¿Lleva segundos el canónico? */
export const hasSeconds = (v) => typeof v === 'string' && v.length === 8

/** La hora en el formato del idioma y ciclo («9:07», «9:30 p.m.», «٩:٣٠ م», «21.30», «오후 9:30»). */
export function formatTime(sec, info, seconds = false) {
  if (sec == null) return ''
  return clean((seconds ? info.fmtS : info.fmt).format(utc(sec))).trim()
}
/** La franja del día en palabras de la hora («de la noche»); '' si el idioma no la tiene. */
export function period(sec, info) {
  return sec == null ? '' : info.words[Math.floor(sec / 3600) % 24] || ''
}
/**
 * aria-valuetext (#403): en 12 h, el formato de Intl con dayPeriod 'long' («9:30 de la noche», «밤 9:30»); en 24 h, el
 * formato del idioma, un espacio y la franja («21:30 de la noche»). Sin franja, solo la hora.
 */
export function valueText(sec, info, seconds = false) {
  if (sec == null) return ''
  const t = formatTime(sec, info, seconds)
  const w = period(sec, info)
  if (!w) return t
  if (info.cycle === 'h12') {
    const f = seconds ? info.vt12s : info.vt12
    if (f) return clean(f.format(utc(sec))).trim()
  }
  return t.includes(w) ? t : `${t} ${w}`
}

// ---------- Interpretación (#404, #407, #408) ----------

/** ¿Cae `v` dentro de los límites? (`min > max` = arco que cruza la medianoche) */
export function inArc(v, min, max) {
  if (v == null || (min == null && max == null)) return true
  if (min != null && max != null) return min <= max ? v >= min && v <= max : v >= min || v <= max
  return min != null ? v >= min : v <= max
}

// Una franja del idioma a partir de una palabra escrita (≥ 3 letras, prefijo de una palabra de una sola franja)
function matchWord(tok, info) {
  if (tok.length < 3) return null
  const found = new Map()
  info.words.forEach((w, h) => {
    if (!w) return
    const toks = strip(w).split(/[^\p{L}]+/u).filter((x) => x.length >= 3)
    if (toks.some((x) => x.startsWith(tok))) {
      if (!found.has(w)) found.set(w, [])
      found.get(w).push(h)
    }
  })
  if (found.size !== 1) return null
  const [phrase, hours] = [...found.entries()][0]
  return { phrase, hours }
}

const INVALID = Object.freeze({ status: 'invalid', value: null, ambiguous: false, alt: null })
const EMPTY = Object.freeze({ status: 'empty', value: null, ambiguous: false, alt: null })
const ok = (v) => ({ status: 'ok', value: ((v % DAY) + DAY) % DAY, ambiguous: false, alt: null })

/**
 * Interpreta lo escrito. Devuelve `{ status: 'empty' | 'ok' | 'invalid', value, ambiguous, alt }`.
 * - `prev`: segundos de la última hora vista entera (o la mitad pendiente de a. m./p. m.); decide la mitad de una hora de
 *   1 a 12 sin marcador en 12 h (#408).
 * - `min`, `max`: en 12 h, si solo una de las dos lecturas cae dentro, gana esa.
 * - En 24 h una hora a secas de 1 a 11 sin cero delante se toma literal y es `ambiguous` con `alt` = la otra mitad (#407).
 */
export function parseTime(raw, info, { seconds = false, prev = null, min = null, max = null } = {}) {
  let t = toLatin(String(raw ?? ''), info).trim()
  if (!t) return EMPTY
  // Una fecha y hora ISO («2026-10-06T14:05»): se toma su hora (los segundos solo con `seconds`)
  const iso = /\d{4}-\d{2}-\d{2}[T ](\d{2}):(\d{2})(?::(\d{2}))?/.exec(t)
  if (iso) t = `${iso[1]}:${iso[2]}${iso[3] && seconds ? `:${iso[3]}` : ''}`
  // «h» pegada a cifras es un separador («9h30», «9 h»: francés); las demás letras son marcador o franja
  const core = t.replace(/(\d)\s*h\s*(?=\d|$)/gi, '$1:')
  const toks = strip(core).split(/[^\p{L}]+/u).filter(Boolean)
  let half = null
  let phrase = null
  if (toks.length) {
    const L = toks.join('')
    if ((info.amKey && info.amKey.startsWith(L)) || 'am'.startsWith(L)) half = 'am'
    else if ((info.pmKey && info.pmKey.startsWith(L)) || 'pm'.startsWith(L)) half = 'pm'
    else {
      const hits = new Map()
      for (const x of toks) {
        const w = matchWord(x, info)
        if (w) hits.set(w.phrase, w)
      }
      if (hits.size === 1) phrase = [...hits.values()][0]
    }
    if (!half && !phrase) return INVALID
  }
  const groups = core.match(/[0-9]+/g) || []
  if (!groups.length) {
    // Solo una franja que cubre una sola hora («mediodía» → 12:00)
    return phrase && phrase.hours.length === 1 ? ok(phrase.hours[0] * 3600) : INVALID
  }
  let h
  let m = 0
  let s = 0
  let lead = false // la hora se escribió con cero delante («09», «0930»)
  if (groups.length === 1) {
    const d = groups[0]
    if (d.length <= 2) h = +d
    else if (d.length === 3) [h, m] = [+d[0], +d.slice(1)]
    else if (d.length === 4) [h, m] = [+d.slice(0, 2), +d.slice(2)]
    else if (seconds && d.length === 5) [h, m, s] = [+d[0], +d.slice(1, 3), +d.slice(3)]
    else if (seconds && d.length === 6) [h, m, s] = [+d.slice(0, 2), +d.slice(2, 4), +d.slice(4)]
    else return INVALID
    lead = d.length % 2 === 0 && d.length > 1 && d[0] === '0'
  } else if (groups.length <= 3) {
    if (groups[0].length > 2 || groups[1].length !== 2 || (groups[2] && groups[2].length !== 2)) return INVALID
    h = +groups[0]
    m = +groups[1]
    s = groups[2] ? +groups[2] : 0
    if (groups[2] && !seconds) return INVALID
    lead = groups[0].length === 2 && groups[0][0] === '0'
  } else return INVALID
  if (m > 59 || s > 59) return INVALID
  const rest = m * 60 + s
  // 24 y 24:00 = medianoche (sin marcador ni franja)
  if (h === 24 && rest === 0 && !half && !phrase) h = 0
  if (half) {
    if (h < 1 || h > 12) return INVALID
    return ok(((h % 12) + (half === 'pm' ? 12 : 0)) * 3600 + rest)
  }
  if (h > 23) return INVALID
  if (phrase) {
    // De las dos lecturas (h y h+12) gana la que cae en la franja o, si ninguna, la más cercana a ≤ 2 h: CLDR pone las
    // 19:00 «de la tarde» en `es`, pero «7 de la noche» se dice (y se entiende) como 19:00
    const dist = (x) => Math.min(...phrase.hours.map((y) => Math.min(Math.abs(x - y), 24 - Math.abs(x - y))))
    const cands = [...new Set([h % 12, (h % 12) + 12])].map((x) => ({ x, d: dist(x) })).sort((a, b) => a.d - b.d)
    if (cands[0].d > 2 || (cands[1] && cands[1].d === cands[0].d)) return INVALID
    return ok(cands[0].x * 3600 + rest)
  }
  if (info.cycle !== 'h12') {
    // 24 h: literal; una hora a secas de 1 a 11 sin cero delante también puede ser de la noche (#407, #408)
    const r = ok(h * 3600 + rest)
    if (h >= 1 && h <= 11 && !lead) return { ...r, ambiguous: true, alt: r.value + HALF }
    return r
  }
  // 12 h: 0 y 13–23 nunca son ambiguas (escribir en 24 h vale en cualquier idioma)
  if (h === 0 || h > 12) return ok(h * 3600 + rest)
  const amV = (h % 12) * 3600 + rest
  const pmV = amV + HALF
  let pick
  if (prev != null) pick = prev >= HALF ? pmV : amV
  else {
    const inA = inArc(amV, min, max)
    const inP = inArc(pmV, min, max)
    if (inA !== inP) pick = inA ? amV : pmV
    else pick = h === 12 ? pmV : amV // sin pista: 12 = mediodía; 1–11 = la mañana (#408)
  }
  return { status: 'ok', value: pick, ambiguous: true, alt: pick === amV ? pmV : amV }
}

// ---------- Pasos (#405) ----------

/** Final del día en la unidad del campo: 23:59 (o 23:59:59 con segundos). */
const dayEnd = (seconds) => (seconds ? DAY - 1 : DAY - 60)

/**
 * Un paso desde `v` (segundos o null) en la dirección `dir` (1 | -1).
 * - `big`: ± 1 hora sin encajar; si no, ± `step` minutos encajando en la rejilla contada desde `min` (o desde 00:00).
 * - Sin límites, da la vuelta a medianoche. Con límites se detiene en sus extremos; con `min > max` recorre el arco por
 *   00:00; fuera del arco, ↑ entra por `min` y ↓ por `max`.
 * - Vacío: `min`; sin él, `now` (segundos) redondeado hacia arriba a la rejilla (al minuto con `big`), acotado por un `max`
 *   sin `min`.
 */
export function stepTime(v, dir, { big = false, step = 1, min = null, max = null, now = 0, seconds = false } = {}) {
  const u = big ? 3600 : Math.max(1, Math.floor(step) || 1) * 60
  const A = min ?? 0
  const bounded = min != null || max != null
  if (v == null) {
    if (min != null) return min
    const n = ((now % DAY) + DAY) % DAY
    let g = big ? Math.ceil(n / 60) * 60 : Math.ceil(n / u) * u
    g %= DAY
    if (max != null && g > max) g = max
    return g
  }
  const Lmax = min != null && max != null ? (max - min + DAY) % DAY : min != null ? dayEnd(seconds) - min : max
  const o = (((v - A) % DAY) + DAY) % DAY
  if (bounded && o > Lmax) return dir > 0 ? A : (A + Lmax) % DAY
  let n
  if (big) n = o + dir * u
  else n = dir > 0 ? Math.floor(o / u) * u + u : Math.ceil(o / u) * u - u
  if (!bounded) return ((n % DAY) + DAY) % DAY
  n = Math.min(Math.max(n, 0), Lmax)
  return (A + n) % DAY
}

// ---------- Duración (la usará C, #413) ----------

/** Segundos de `a` a `b` (si `b` es anterior, al día siguiente). */
export const duration = (a, b) => (a == null || b == null ? null : (((b - a) % DAY) + DAY) % DAY)
