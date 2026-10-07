// Motor del deslizador (kiwi, r01): referencia de COMPORTAMIENTO para una utilidad interna `utils/slider.js` (lima L2).
// Sin estado, sin DOM, sin Vue. Rejilla, pasos, límites de cada asa, teclas, formato, lectura y búsqueda por cifras.
// Global: window.SL.
;(function () {
  const dec = (n) => {
    const s = String(n)
    if (s.includes('e-')) return Number(s.split('e-')[1])
    const i = s.indexOf('.')
    return i < 0 ? 0 : s.length - i - 1
  }
  const fix = (v, d) => Number(Number(v).toFixed(d))
  const places = (o) => Math.max(dec(o.step), dec(o.min))

  /** Valores permitidos cuando la rejilla son las marcas (`snap: 'marks'`), ordenados */
  const markGrid = (o) => (o.snap === 'marks' && o.marks && o.marks.length ? o.marks.map((m) => m.value).sort((a, b) => a - b) : null)

  /** Último punto de la rejilla ≤ max (con un max fuera de la rejilla, como el `input type=range` nativo) */
  function top(o) {
    const g = markGrid(o)
    if (g) return g[g.length - 1]
    return fix(o.min + Math.floor((o.max - o.min) / o.step + 1e-9) * o.step, places(o))
  }
  function bottom(o) {
    const g = markGrid(o)
    return g ? g[0] : o.min
  }

  /** Punto de la rejilla más cercano a v, dentro de [lo, hi] (límites del asa) */
  function snap(v, o, lo = bottom(o), hi = top(o)) {
    const g = markGrid(o)
    if (g) {
      const inside = g.filter((x) => x >= lo - 1e-9 && x <= hi + 1e-9)
      return inside.reduce((b, x) => (Math.abs(x - v) < Math.abs(b - v) ? x : b), inside[0])
    }
    const r = fix(o.min + Math.round((v - o.min) / o.step) * o.step, places(o))
    return Math.min(hi, Math.max(lo, r))
  }

  /** Paso grande: `bigStep` o una décima del recorrido en pasos enteros (al menos un paso) */
  function bigStep(o) {
    if (o.bigStep) return o.bigStep
    const n = Math.round((top(o) - o.min) / o.step / 10)
    return o.step * Math.max(1, n)
  }

  /**
   * Siguiente valor en una dirección. Un valor fuera de la rejilla (puesto por la aplicación: Grana no redondea, #157)
   * cae primero en el punto siguiente de la rejilla en esa dirección. `kind`: 'step' | 'big'. Se detiene en [lo, hi].
   */
  function move(v, dir, kind, o, lo = bottom(o), hi = top(o)) {
    const g = markGrid(o)
    if (g) {
      const inside = g.filter((x) => x >= lo - 1e-9 && x <= hi + 1e-9)
      const n = kind === 'big' ? 2 : 1
      if (dir > 0) {
        const next = inside.filter((x) => x > v + 1e-9)
        return next.length ? next[Math.min(n, next.length) - 1] : inside[inside.length - 1]
      }
      const prev = inside.filter((x) => x < v - 1e-9)
      return prev.length ? prev[Math.max(0, prev.length - n)] : inside[0]
    }
    const s = kind === 'big' ? bigStep(o) : o.step
    const k = (v - o.min) / o.step
    const onGrid = Math.abs(k - Math.round(k)) < 1e-6
    const units = s / o.step
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
  function limits(values, i, o) {
    if (values.length < 2) return [bottom(o), top(o)]
    const gap = o.minGap || 0
    return i === 0 ? [bottom(o), Math.max(bottom(o), values[1] - gap)] : [Math.min(top(o), values[0] + gap), top(o)]
  }

  /**
   * Qué hace una tecla. Horizontal: ←/→ siguen la dirección VISUAL (en RTL, → baja); ↑/↓ siempre suben y bajan.
   * Mayús+flecha y Re Pág/Av Pág = paso grande. Inicio/Fin = los límites del asa.
   */
  function keyAction(e, { rtl = false } = {}) {
    const k = e.key
    if (k === 'ArrowUp' || k === 'ArrowRight' || k === 'ArrowDown' || k === 'ArrowLeft') {
      let dir = k === 'ArrowUp' || k === 'ArrowRight' ? 1 : -1
      if (rtl && (k === 'ArrowRight' || k === 'ArrowLeft')) dir = -dir
      return { kind: e.shiftKey ? 'big' : 'step', dir }
    }
    if (k === 'PageUp') return { kind: 'big', dir: 1 }
    if (k === 'PageDown') return { kind: 'big', dir: -1 }
    if (k === 'Home') return { kind: 'home' }
    if (k === 'End') return { kind: 'end' }
    return null
  }

  /** Formato del idioma (`Intl.NumberFormat` con las opciones de la aplicación tal cual: unidad, moneda…; un porcentaje
   *  es `{ style: 'unit', unit: 'percent' }`, así el modelo 40 se lee «40 %», sin dividir) */
  const fmtCache = new Map()
  function format(v, o) {
    if (v === null || v === undefined) return ''
    const key = (o.locale || '') + JSON.stringify(o.format || {})
    let f = fmtCache.get(key)
    if (!f) { f = new Intl.NumberFormat(o.locale || undefined, o.format || {}); fmtCache.set(key, f) }
    return f.format(v).replace(/[‎‏؜]/g, '')
  }

  /** Lectura para `aria-valuetext`: el formato y, si el valor cae en una marca con nombre, su nombre («7, intenso») */
  function valueText(v, o) {
    if (v === null || v === undefined) return o.emptyText || ''
    if (typeof o.valueText === 'function') return o.valueText(v)
    const t = format(v, o)
    const m = (o.marks || []).find((x) => x.label && Math.abs(x.value - v) < 1e-9)
    return m && m.label !== t ? `${t}, ${m.label}` : t
  }

  /** Fracción 0..1 de un valor en el recorrido */
  const frac = (v, o) => (top(o) === o.min ? 0 : (v - o.min) / (o.max - o.min))

  /** Asa que toma un puntero en el valor v (rango). Empate (asas juntas): null = lo decide la dirección del gesto */
  function pick(values, v) {
    if (values.length < 2) return 0
    const d0 = Math.abs(v - values[0])
    const d1 = Math.abs(v - values[1])
    if (Math.abs(d0 - d1) < 1e-9) return values[0] === values[1] ? null : v < values[0] ? 0 : 1
    return d0 < d1 ? 0 : 1
  }

  /** Cifras del idioma → latinas (búsqueda por cifras de B) */
  const DIGITS = '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹०१२३४५६७८९'
  function latin(ch) {
    if (/[0-9]/.test(ch)) return ch
    const i = DIGITS.indexOf(ch)
    return i < 0 ? null : String(i % 10)
  }

  window.SL = { dec, snap, top, bottom, bigStep, move, limits, keyAction, format, valueText, frac, pick, latin, markGrid }
})()
