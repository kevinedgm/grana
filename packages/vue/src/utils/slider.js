// Motor del deslizador (dueño: bruno). Interno: NO se exporta desde ninguna entrada; viaja solo en `@grana/vue/slider`
// (#456). Contrato: design/contracts/slider.md «Motor»; referencia de comportamiento: design/lab/slider/r01/engine.js
// (kiwi), cuyos resultados son los casos de slider.test.js.
// Sin estado, sin DOM y sin Vue. `o` = { min, max, step, bigStep?, minGap?, marks?: [{ value, label? }], snap?, locale?,
// format?, valueText?, emptyText? } ya validado por el componente (step > 0 finito, min < max o «sin recorrido»).

/** Decimales de un número (también en notación científica: 1e-7 → 7) */
export function dec(n) {
  const s = String(n)
  if (s.includes('e-')) {
    const [m, e] = s.split('e-')
    const i = m.indexOf('.')
    return Number(e) + (i < 0 ? 0 : m.length - i - 1)
  }
  const i = s.indexOf('.')
  return i < 0 ? 0 : s.length - i - 1
}
/** Fija un número a `d` decimales sin error de coma flotante (0.1 + 0.2 → 0.3) */
export const fix = (v, d) => Number(Number(v).toFixed(Math.min(20, d)))
/** Decimales de la rejilla: los de `step` y los de `min` (la rejilla cuenta desde min) */
export const places = (o) => Math.max(dec(o.step), dec(o.min))

/** Valores permitidos cuando la rejilla son las marcas (`snap: 'marks'`), ordenados; null si no */
export function markGrid(o) {
  return o.snap === 'marks' && Array.isArray(o.marks) && o.marks.length ? o.marks.map((m) => m.value).sort((a, b) => a - b) : null
}

/** ¿Hay recorrido? (`min ≥ max` deja el control sin recorrido) */
export const hasTravel = (o) => Number.isFinite(o.min) && Number.isFinite(o.max) && o.max > o.min

/** Último punto de la rejilla ≤ max (con un max fuera de la rejilla, como el `input type=range` nativo) */
export function top(o) {
  const g = markGrid(o)
  if (g) return g[g.length - 1]
  if (!hasTravel(o)) return o.min
  return fix(o.min + Math.floor((o.max - o.min) / o.step + 1e-9) * o.step, places(o))
}
/** Primer punto de la rejilla */
export function bottom(o) {
  const g = markGrid(o)
  return g ? g[0] : o.min
}

/** Punto de la rejilla más cercano a v, dentro de [lo, hi] (límites del asa) */
export function snap(v, o, lo = bottom(o), hi = top(o)) {
  const g = markGrid(o)
  if (g) {
    const inside = g.filter((x) => x >= lo - 1e-9 && x <= hi + 1e-9)
    if (!inside.length) return Math.min(hi, Math.max(lo, v))
    return inside.reduce((b, x) => (Math.abs(x - v) < Math.abs(b - v) ? x : b), inside[0])
  }
  if (!hasTravel(o)) return o.min
  const r = fix(o.min + Math.round((v - o.min) / o.step) * o.step, places(o))
  return Math.min(hi, Math.max(lo, r))
}

/** ¿`b` es un múltiplo positivo de `step`? */
export const isMultiple = (b, step) => Number.isFinite(b) && b > 0 && Math.abs(b / step - Math.round(b / step)) < 1e-9

/** Paso grande: `bigStep` (múltiplo de step) o una décima del recorrido en pasos enteros (al menos un paso) */
export function bigStep(o) {
  if (isMultiple(o.bigStep, o.step)) return o.bigStep
  const n = Math.round((top(o) - o.min) / o.step / 10)
  return fix(o.step * Math.max(1, n), places(o))
}

/**
 * Siguiente valor en una dirección. Un valor fuera de la rejilla (puesto por la aplicación: Grana no redondea, #157)
 * cae primero en el punto siguiente de la rejilla en esa dirección. `kind`: 'step' | 'big'. Se detiene en [lo, hi].
 */
export function move(v, dir, kind, o, lo = bottom(o), hi = top(o)) {
  const g = markGrid(o)
  if (g) {
    const inside = g.filter((x) => x >= lo - 1e-9 && x <= hi + 1e-9)
    if (!inside.length) return v
    const n = kind === 'big' ? 2 : 1
    if (dir > 0) {
      const next = inside.filter((x) => x > v + 1e-9)
      return next.length ? next[Math.min(n, next.length) - 1] : inside[inside.length - 1]
    }
    const prev = inside.filter((x) => x < v - 1e-9)
    return prev.length ? prev[Math.max(0, prev.length - n)] : inside[0]
  }
  if (!hasTravel(o)) return v
  const s = kind === 'big' ? bigStep(o) : o.step
  const k = (v - o.min) / o.step
  const onGrid = Math.abs(k - Math.round(k)) < 1e-6
  const units = Math.round(s / o.step)
  let kk
  if (dir > 0) kk = (onGrid ? Math.round(k) : Math.floor(k)) + units
  else kk = (onGrid ? Math.round(k) : Math.ceil(k)) - units
  const r = fix(o.min + kk * o.step, places(o))
  return Math.min(hi, Math.max(lo, r))
}

/**
 * Límites del asa i. Valor único: [bottom, top]. Rango: el inicio llega hasta el fin − minGap y el fin baja hasta el
 * inicio + minGap (APG «Multi-Thumb Slider»: las asas no se cruzan; se detienen).
 */
export function limits(values, i, o) {
  const b = bottom(o)
  const t = top(o)
  if (!values || values.length < 2) return [b, t]
  const gap = o.minGap || 0
  const p = places(o)
  if (i === 0) return [b, Math.min(t, Math.max(b, fix(values[1] - gap, p)))]
  return [Math.max(b, Math.min(t, fix(values[0] + gap, p))), t]
}

/**
 * Qué hace una tecla. Horizontal: ←/→ siguen la dirección VISUAL (en RTL, → baja); ↑/↓ siempre suben y bajan.
 * Mayús+flecha y Re Pág/Av Pág = paso grande. Inicio/Fin = los límites del asa. Con Alt, Ctrl o Meta: nada (null).
 */
export function keyAction(e, { rtl = false } = {}) {
  if (!e || e.altKey || e.ctrlKey || e.metaKey) return null
  const k = e.key
  if (k === 'ArrowUp' || k === 'ArrowRight' || k === 'ArrowDown' || k === 'ArrowLeft') {
    let dir = k === 'ArrowUp' || k === 'ArrowRight' ? 1 : -1
    if (rtl && (k === 'ArrowRight' || k === 'ArrowLeft')) dir = -dir
    return { kind: e.shiftKey ? 'big' : 'step', dir }
  }
  if (k === 'PageUp') return { kind: 'big', dir: 1 }
  if (k === 'PageDown') return { kind: 'big', dir: -1 }
  if (k === 'Home') return { kind: 'home', dir: -1 }
  if (k === 'End') return { kind: 'end', dir: 1 }
  return null
}
/** Teclas que abren y cierran un gesto de teclado (su keyup emite `change`) */
export const ACTION_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End'])

const BIDI = /[‎‏؜]/g
const fmtCache = new Map()
/** Formateador de `Intl.NumberFormat` en caché; lanza si `Intl` rechaza el idioma o las opciones */
export function formatter(locale, format) {
  const key = `${locale || ''}|${JSON.stringify(format || {})}`
  let f = fmtCache.get(key)
  if (!f) {
    f = new Intl.NumberFormat(locale || undefined, format || {})
    fmtCache.set(key, f)
  }
  return f
}
/** ¿`Intl` acepta el idioma? */
export function isValidLocale(locale) {
  try {
    new Intl.NumberFormat(locale)
    return true
  } catch {
    return false
  }
}
/** ¿`Intl` acepta las opciones con ese idioma? */
export function isValidFormat(locale, format) {
  try {
    formatter(locale, format).format(1)
    return true
  } catch {
    return false
  }
}

/**
 * Formato del idioma (`Intl.NumberFormat` con las opciones de la aplicación tal cual: unidad, moneda…; un porcentaje es
 * `{ style: 'unit', unit: 'percent' }`, así el modelo 40 se lee «40 %»). Sin las marcas bidi de Intl. `o.locale === null`
 * (SSR y primer render sin `locale`): el canónico, String(v).
 */
export function format(v, o) {
  if (v === null || v === undefined) return ''
  if (o.locale === null) return String(v)
  return formatter(o.locale, o.format).format(v).replace(BIDI, '')
}

/** Texto de la píldora: `valueText(v)` de la aplicación o el formato (sin el nombre de la marca) */
export function pillText(v, o) {
  if (v === null || v === undefined) return ''
  if (typeof o.valueText === 'function') return o.valueText(v)
  return format(v, o)
}

/** Lectura para `aria-valuetext`: `valueText(v)` o el formato y, si el valor cae en una marca con nombre, su nombre */
export function valueText(v, o) {
  if (v === null || v === undefined) return o.emptyText || ''
  if (typeof o.valueText === 'function') return o.valueText(v)
  const t = format(v, o)
  const m = (o.marks || []).find((x) => x.label && Math.abs(x.value - v) < 1e-9)
  return m && m.label !== t ? `${t}, ${m.label}` : t
}

/** Fracción 0..1 de un valor en el recorrido (fuera de [min, max], el extremo; sin recorrido, 0) */
export function frac(v, o) {
  if (v === null || v === undefined || !hasTravel(o)) return 0
  return Math.min(1, Math.max(0, (v - o.min) / (o.max - o.min)))
}

/**
 * Asa que toma un puntero en el valor v (rango). Asas juntas pulsadas en su valor: null (lo decide la dirección del
 * gesto); juntas y pulsadas a un lado: la de ese lado; con distancias iguales y valores distintos, la del lado pulsado.
 */
export function pick(values, v) {
  if (!values || values.length < 2) return 0
  const d0 = Math.abs(v - values[0])
  const d1 = Math.abs(v - values[1])
  if (Math.abs(d0 - d1) < 1e-9) {
    if (values[0] === values[1]) return Math.abs(v - values[0]) < 1e-9 ? null : v < values[0] ? 0 : 1
    return v < values[0] ? 0 : 1
  }
  return d0 < d1 ? 0 : 1
}

/** Cifras del idioma → latinas (teclear la cifra, B4): arábigo-índicas, persas y devanagari */
const DIGITS = '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹०१२३४५६७८९'
export function latin(ch) {
  if (typeof ch !== 'string' || ch.length !== 1) return null
  if (ch >= '0' && ch <= '9') return ch
  const i = DIGITS.indexOf(ch)
  return i < 0 ? null : String(i % 10)
}

/** Separador decimal del idioma (`.` sin idioma) */
export function decimalSeparator(locale) {
  try {
    const p = formatter(locale, {}).formatToParts(1.5).find((x) => x.type === 'decimal')
    return p ? p.value : '.'
  } catch {
    return '.'
  }
}

/**
 * Texto tecleado (latino: cifras, un «.» y un «-» inicial) → número, o null si aún no lo es («», «-», «.»)
 */
export function parseTyped(text) {
  if (typeof text !== 'string' || !/^-?\d*\.?\d*$/.test(text) || !/\d/.test(text)) return null
  const n = Number(text.endsWith('.') ? text.slice(0, -1) : text)
  return Number.isFinite(n) ? n : null
}

/**
 * ¿Cabe una tecla más en lo tecleado? `text` latino; `key` ya traducido ('0'–'9', '.', '-'). Reglas de B4: el separador
 * una vez y solo con decimales en step o min; «-» solo primero y solo con min < 0; no más cifras que el límite más largo.
 */
export function acceptTyped(text, key, o) {
  const p = places(o)
  if (key === '-') return text === '' && o.min < 0
  if (key === '.') return p > 0 && !text.includes('.')
  if (!/^\d$/.test(key)) return false
  const [int, frc] = (text.replace('-', '') + key).split('.')
  if (frc !== undefined) return frc.length <= p
  const longest = Math.max(String(Math.trunc(Math.abs(bottom(o)))).length, String(Math.trunc(Math.abs(top(o)))).length)
  return int.length <= longest
}

/**
 * Valores de referencia del ancho de la píldora (B1): el primer punto, el último, el punto medio de la rejilla,
 * −|último| si min < 0 y cada marca. El componente les añade el texto actual.
 */
export function refValues(o) {
  const vs = [bottom(o), top(o)]
  if (hasTravel(o)) vs.push(snap((o.min + o.max) / 2, o))
  if (o.min < 0) vs.push(-Math.abs(top(o)))
  for (const m of o.marks || []) vs.push(m.value)
  return [...new Set(vs)]
}

/** ¿Se funden las dos píldoras? Los centros a menos de un ancho de píldora: (f1 − f0) · (ancho − pillW) < pillW */
export function merged(f0, f1, width, pillW) {
  if (!(width > 0) || !(pillW > 0)) return false
  return (f1 - f0) * Math.max(0, width - pillW) < pillW
}

/**
 * El tramo se arrastra entero (B3): desde [a0, b0] desplazado `delta` (en unidades del modelo), en la rejilla, acotado
 * al recorrido y conservando la anchura.
 */
export function windowMove(a0, b0, delta, o) {
  const width = fix(b0 - a0, places(o))
  const lo = bottom(o)
  const hi = top(o)
  let a = snap(a0 + delta, o, lo, hi)
  a = Math.min(fix(hi - width, places(o)), Math.max(lo, a))
  return [a, fix(a + width, places(o))]
}

/**
 * Marcas normalizadas: `true` = una raya por punto de la rejilla si son ≤ 25, si no una por paso grande; un arreglo de
 * números o { value, label? }. Devuelve { list, outside, duplicates } (los dos últimos para los avisos).
 */
export function normalizeMarks(marks, o) {
  const out = { list: [], outside: [], duplicates: [] }
  if (!marks) return out
  if (marks === true) {
    if (!hasTravel(o)) return out
    const t = top({ ...o, snap: 'step' })
    const n = Math.round((t - o.min) / o.step)
    const every = n <= 25 ? o.step : bigStep({ ...o, snap: 'step' })
    const p = places(o)
    for (let k = 0; ; k++) {
      const v = fix(o.min + k * every, p)
      if (v > t + 1e-9) break
      out.list.push({ value: v })
    }
    return out
  }
  if (!Array.isArray(marks)) return out
  const seen = new Set()
  for (const m of marks) {
    const item = typeof m === 'number' ? { value: m } : m && typeof m === 'object' && typeof m.value === 'number' ? { value: m.value, label: m.label || undefined } : null
    if (!item || !Number.isFinite(item.value)) continue
    if (item.value < o.min - 1e-9 || item.value > o.max + 1e-9) {
      out.outside.push(item.value)
      continue
    }
    if (seen.has(item.value)) {
      out.duplicates.push(item.value)
      continue
    }
    seen.add(item.value)
    out.list.push(item)
  }
  return out
}
