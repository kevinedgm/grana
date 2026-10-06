// Motor de hora del prototipo de GTimeField (kiwi, ronda r01 y r02). Sin estado ni DOM: idioma, interpretación de lo
// escrito, formato, pasos con límites que cruzan medianoche y duración. Lo usan la base (r01) y los conceptos (r02).
// Es la PROPUESTA de la utilidad interna `utils/timeInput.js` (hallazgo L2), no su código: bruno la reescribe con pruebas.
// Unidad interna: SEGUNDOS desde las 00:00 (0 … 86399). El modelo público es una cadena «HH:mm» o «HH:mm:ss».
(function () {
  const DAY = 86400
  const pad = (n) => String(n).padStart(2, '0')
  // Siempre en UTC: un instante ficticio solo para que Intl escriba una hora de pared (sin zona, sin horario de verano)
  const utc = (sec) => new Date(Date.UTC(2026, 0, 1, Math.floor(sec / 3600), Math.floor((sec % 3600) / 60), sec % 60))
  const strip = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC').toLowerCase()
  const BIDI = /[\u200e\u200f\u061c]/g

  // ---------- Idioma ----------
  const cache = new Map()
  function localeInfo(locale, cycle) {
    const key = `${locale}|${cycle || ''}`
    if (cache.has(key)) return cache.get(key)
    const ro = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).resolvedOptions()
    const loc = ro.locale
    const hc = cycle || (ro.hourCycle === 'h11' || ro.hourCycle === 'h12' ? 'h12' : 'h23')
    const opt = { hour: 'numeric', minute: '2-digit', hourCycle: hc, timeZone: 'UTC' }
    const fmt = new Intl.DateTimeFormat(loc, opt)
    const fmtS = new Intl.DateTimeFormat(loc, { ...opt, second: '2-digit' })
    const f12 = new Intl.DateTimeFormat(loc, { ...opt, hourCycle: 'h12' })
    const parts = f12.formatToParts(utc(13 * 3600 + 5 * 60))
    const sep = (fmt.formatToParts(utc(13 * 3600 + 5 * 60)).find((p, i, a) => p.type === 'literal' && a[i - 1]?.type === 'hour') || { value: ':' }).value
    const am = f12.formatToParts(utc(3600)).find((p) => p.type === 'dayPeriod')?.value.replace(BIDI, '') || 'AM'
    const pm = parts.find((p) => p.type === 'dayPeriod')?.value.replace(BIDI, '') || 'PM'
    const periodFirst = parts.findIndex((p) => p.type === 'dayPeriod') < parts.findIndex((p) => p.type === 'hour')
    const nf = new Intl.NumberFormat(loc, { useGrouping: false, numberingSystem: ro.numberingSystem })
    const digits = Array.from({ length: 10 }, (_, i) => nf.format(i))
    let dir = 'ltr'
    try { const L = new Intl.Locale(loc); dir = (L.getTextInfo ? L.getTextInfo() : L.textInfo)?.direction || 'ltr' } catch { /* sin Intl.Locale */ }
    // Franjas del día en palabras (CLDR, «de la noche»): una por hora. Sirven para la lectura (A) y para escribir «9 noche»
    const fdp = new Intl.DateTimeFormat(loc, { dayPeriod: 'long', timeZone: 'UTC' })
    const words = Array.from({ length: 24 }, (_, h) => fdp.format(utc(h * 3600)).replace(BIDI, ''))
    const markerNorm = (s) => strip(s).replace(/[^\p{L}]/gu, '')
    const info = {
      locale: loc, cycle: hc, sep, am, pm, periodFirst, digits, dir, words, fmt, fmtS,
      amKey: markerNorm(am), pmKey: markerNorm(pm),
      // Letras admitidas al escribir (base): las de los marcadores del idioma y las latinas a/p/m
      markerLetters: new Set([...markerNorm(am), ...markerNorm(pm), 'a', 'p', 'm']),
      wordLetters: new Set([...words.join('')].filter((c) => /\p{L}/u.test(c)).map((c) => strip(c)))
    }
    cache.set(key, info)
    return info
  }
  function resolveLocale(el, prop) {
    if (prop) return prop
    const near = el?.closest?.('[lang]')?.getAttribute('lang')
    return near || navigator.language || 'es'
  }

  // ---------- Modelo ----------
  const canonical = (sec, seconds) => (sec == null ? '' : `${pad(Math.floor(sec / 3600))}:${pad(Math.floor((sec % 3600) / 60))}${seconds ? ':' + pad(sec % 60) : ''}`)
  function fromCanonical(v) {
    if (v == null || v === '') return null
    const m = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(String(v))
    if (!m) return null
    const h = +m[1], mi = +m[2], s = +(m[3] || 0)
    if (h > 23 || mi > 59 || s > 59) return null
    return h * 3600 + mi * 60 + s
  }
  const format = (sec, info, seconds) => (sec == null ? '' : (seconds ? info.fmtS : info.fmt).format(utc(sec)).replace(BIDI, ''))
  const period = (sec, info) => (sec == null ? '' : info.words[Math.floor(sec / 3600)])
  // «9:30 de la noche» (12 h, con la franja en palabras) o «21:30, de la noche» (24 h)
  function reading(sec, info, seconds) {
    if (sec == null) return ''
    const t = format(sec, info, seconds)
    if (info.cycle !== 'h12') return `${t}, ${period(sec, info)}`
    const f = new Intl.DateTimeFormat(info.locale, { hour: 'numeric', minute: '2-digit', ...(seconds ? { second: '2-digit' } : {}), hourCycle: 'h12', dayPeriod: 'long', timeZone: 'UTC' })
    return f.format(utc(sec)).replace(BIDI, '')
  }

  // ---------- Escritura ----------
  function toLatin(text, info) {
    let out = ''
    for (const ch of text) { const i = info.digits.indexOf(ch); out += i >= 0 ? String(i) : ch }
    return out.replace(BIDI, '')
  }
  // Filtro de lo tecleado: cifras (del idioma y latinas), separadores, letras de los marcadores (o de las franjas, con
  // `words`), «+» solo si se admite una duración (fin de un tramo). Lo demás no entra.
  function filterTyped(text, info, { words = false, duration = false } = {}) {
    let out = ''
    for (const ch of text) {
      if (/[0-9]/.test(ch) || info.digits.includes(ch) || /[:.,\s]/.test(ch)) out += ch
      else if (ch === 'h' || ch === 'H') out += ch
      else if (duration && (ch === '+' || ch === 'm')) out += ch
      else if (/\p{L}/u.test(ch) && (info.markerLetters.has(strip(ch)) || (words && info.wordLetters.has(strip(ch))))) out += ch
      else if (ch === '’' || ch === "'") { if (words) out += ch }
    }
    return out
  }

  const inArc = (v, min, max) => {
    if (v == null) return true
    if (min == null && max == null) return true
    if (min != null && max != null) return min <= max ? v >= min && v <= max : v >= min || v <= max
    return min != null ? v >= min : v <= max
  }

  // Interpretación (regla de kiwi, declaración r01 §4). Devuelve { status: 'empty'|'ok'|'invalid', value, ambiguous, alt }
  //   prev: valor confirmado antes de editar (decide la mitad del día de una hora 1–12 sin marcador en 12 h)
  function parse(raw, info, { seconds = false, prev = null, min = null, max = null, words = false } = {}) {
    let t = toLatin(String(raw || ''), info).trim()
    if (!t) return { status: 'empty', value: null }
    // Una fecha y hora ISO pegada («2026-10-06T14:05»): se toma la hora
    const iso = /\d{4}-\d{2}-\d{2}[T ](\d{2}):(\d{2})(?::(\d{2}))?/.exec(t)
    if (iso) t = `${iso[1]}:${iso[2]}${iso[3] ? ':' + iso[3] : ''}`
    // «h» pegada a las cifras es un separador («9h30», «9 h», francés); el resto de letras son marcador o franja
    const core = t.replace(/(\d)\s*h\s*(?=\d|$)/gi, '$1:')
    // Letras: marcador a. m./p. m. (latino o del idioma) o, con `words`, una franja («noche», «madrugada»)
    const toks = strip(core).split(/[^\p{L}]+/u).filter(Boolean)
    let half = null, phrase = null
    if (toks.length) {
      const L = toks.join('')
      if ((info.amKey && info.amKey.startsWith(L)) || 'am'.startsWith(L)) half = 'am'
      else if ((info.pmKey && info.pmKey.startsWith(L)) || 'pm'.startsWith(L)) half = 'pm'
      else if (words) {
        const hits = new Map()
        toks.forEach((x) => { const w = matchWord(x, info); if (w) hits.set(w.phrase, w) })
        if (hits.size === 1) phrase = [...hits.values()][0]
      }
      if (!half && phrase == null) return { status: 'invalid', value: null }
    }
    const groups = core.match(/[0-9]+/g) || []
    let h, m = 0, s = 0
    if (!groups.length) {
      // Solo una franja que cubre una sola hora («mediodía» → 12:00)
      if (phrase != null) { const hs = phrase.hours; return hs.length === 1 ? ok(hs[0] * 3600) : { status: 'invalid', value: null } }
      return { status: 'invalid', value: null }
    }
    if (groups.length === 1) {
      const d = groups[0]
      if (d.length <= 2) h = +d
      else if (d.length === 3) { h = +d[0]; m = +d.slice(1) }
      else if (d.length === 4) { h = +d.slice(0, 2); m = +d.slice(2) }
      else if (seconds && d.length === 5) { h = +d[0]; m = +d.slice(1, 3); s = +d.slice(3) }
      else if (seconds && d.length === 6) { h = +d.slice(0, 2); m = +d.slice(2, 4); s = +d.slice(4) }
      else return { status: 'invalid', value: null }
    } else if (groups.length === 2 || groups.length === 3) {
      if (groups[0].length > 2 || groups[1].length !== 2 || (groups[2] && groups[2].length !== 2)) return { status: 'invalid', value: null }
      h = +groups[0]; m = +groups[1]; s = groups[2] ? +groups[2] : 0
      if (!seconds && s !== 0) return { status: 'invalid', value: null }
    } else return { status: 'invalid', value: null }
    if (m > 59 || s > 59) return { status: 'invalid', value: null }
    if (h === 24 && m === 0 && s === 0 && !half && phrase == null) h = 0
    if (half) {
      if (h < 1 || h > 12) return { status: 'invalid', value: null }
      return ok(((h % 12) + (half === 'pm' ? 12 : 0)) * 3600 + m * 60 + s)
    }
    if (h > 23) return { status: 'invalid', value: null }
    const rest = m * 60 + s
    if (phrase != null) {
      // De las dos lecturas (h y h+12) gana la que cae en la franja o, si ninguna cae, la más cercana a ella a ≤ 2 h:
      // CLDR pone las 19:00 «de la tarde» en `es`, pero «7 de la noche» se dice (y se entiende) como 19:00
      const dist = (x) => Math.min(...phrase.hours.map((y) => Math.min(Math.abs(x - y), 24 - Math.abs(x - y))))
      const cands = [...new Set([h % 12, (h % 12) + 12])].map((x) => ({ x, d: dist(x) })).sort((a, b) => a.d - b.d)
      if (cands[0].d > 2 || (cands[1] && cands[1].d === cands[0].d)) return { status: 'invalid', value: null }
      return ok(cands[0].x * 3600 + rest)
    }
    // Sin marcador: 0 y 13–23 no son ambiguas (24 h escrita en un idioma de 12 h también vale)
    if (info.cycle !== 'h12' || h === 0 || h > 12) return ok(h * 3600 + rest)
    const amV = (h % 12) * 3600 + rest, pmV = ((h % 12) + 12) * 3600 + rest
    let pick
    if (prev != null) pick = prev >= 12 * 3600 ? pmV : amV
    else {
      const inA = inArc(amV, min, max), inP = inArc(pmV, min, max)
      if (inA !== inP) pick = inA ? amV : pmV
      else pick = h === 12 ? pmV : amV // 12 a secas = mediodía; 1–11 a secas = la mañana
    }
    return { status: 'ok', value: pick, ambiguous: true, alt: pick === amV ? pmV : amV }
    function ok(v) { return { status: 'ok', value: v % DAY, ambiguous: false } }
  }
  function matchWord(L, info) {
    if (L.length < 3) return null
    const found = new Map()
    info.words.forEach((w, h) => {
      const toks = strip(w).split(/[^\p{L}]+/u).filter((x) => x.length >= 3)
      if (toks.some((x) => x.startsWith(L))) { if (!found.has(w)) found.set(w, []); found.get(w).push(h) }
    })
    if (found.size !== 1) return null
    const [phrase, hours] = [...found.entries()][0]
    return { phrase, hours }
  }

  // Duración escrita en el fin de un tramo: «+8», «+8:30», «+90m», «+1h30» (siempre con «+»: «8h» es una hora en francés)
  function parseDuration(raw, info) {
    const t = toLatin(String(raw || ''), info).trim().replace(/\s+/g, '')
    if (!t.startsWith('+')) return null
    let m
    if ((m = /^\+(\d{1,2})(?:[:.h](\d{2}))?h?$/i.exec(t))) return (+m[1]) * 3600 + (+(m[2] || 0)) * 60
    if ((m = /^\+(\d{1,4})m(?:in)?$/i.exec(t))) return (+m[1]) * 60
    return null
  }

  // ---------- Pasos ----------
  // Rejilla de `step` (minutos) contada desde `min` (o desde las 00:00). Sin límites, da la vuelta a medianoche; con
  // límites que cruzan medianoche (22:00–06:00) recorre el arco y se detiene en sus extremos; fuera del arco, ↑ entra por
  // `min` y ↓ por `max`. Vacío: ↑/↓ ponen `min` o, sin él, la hora actual redondeada hacia arriba a la rejilla.
  function stepValue(v, dir, { big = false, step = 1, min = null, max = null, now = null, seconds = false } = {}) {
    const u = big ? 3600 : Math.max(1, step) * 60
    const A = min ?? 0
    if (v == null) {
      if (min != null) return min
      const n = now ?? nowSec()
      const g = Math.ceil(n / u) * u
      return (big ? Math.ceil(n / 60) * 60 : g) % DAY
    }
    const bounded = min != null || max != null
    const Lmax = min != null && max != null ? (max - min + DAY) % DAY : (min != null ? DAY - 1 - min : max)
    let o = (v - A + DAY) % DAY
    if (bounded && o > Lmax) return dir > 0 ? A : (A + Lmax) % DAY
    let n
    if (big) n = o + dir * u
    else n = dir > 0 ? Math.floor(o / u) * u + u : Math.ceil(o / u) * u - u
    if (!bounded) return ((n % DAY) + DAY) % DAY
    n = Math.min(Math.max(n, 0), Lmax)
    return (A + n) % DAY
  }
  const atLimit = (v, dir, opts) => v != null && stepValue(v, dir, opts) === v
  let nowOverride = null
  const nowSec = () => { if (nowOverride != null) return nowOverride; const d = new Date(); return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds() }

  // ---------- Duración ----------
  const duration = (a, b) => (a == null || b == null ? null : (b - a + DAY) % DAY)
  function formatDuration(sec, locale) {
    if (sec == null) return ''
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60)
    try { if (Intl.DurationFormat) return new Intl.DurationFormat(locale, { style: 'short' }).format({ hours: h, minutes: m }) } catch { /* sigue */ }
    const u = (v, unit) => new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay: 'short' }).format(v)
    const parts = []; if (h || !m) parts.push(u(h, 'hour')); if (m) parts.push(u(m, 'minute'))
    return new Intl.ListFormat(locale, { type: 'unit', style: 'narrow' }).format(parts)
  }
  // Hora suelta de la regla del día («6», «12 p. m.»)
  const hourLabel = (h, info) => new Intl.DateTimeFormat(info.locale, { hour: 'numeric', hourCycle: info.cycle, timeZone: 'UTC' }).format(utc(h * 3600)).replace(BIDI, '')

  window.TF = {
    DAY, pad, utc, localeInfo, resolveLocale, canonical, fromCanonical, format, reading, period, toLatin, filterTyped, parse,
    parseDuration, stepValue, atLimit, inArc, duration, formatDuration, hourLabel,
    setNow: (sec) => { nowOverride = sec }, nowSec
  }
})()
