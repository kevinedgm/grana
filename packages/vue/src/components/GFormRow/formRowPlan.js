// Reparto en líneas de GFormRow (dueño: bruno)
// Contrato: design/contracts/form.md §4 «Reparto en líneas» (normativo; DECISIONS.md #174, #175) y «Colocación».
// Funciones puras (sin DOM): las prueba GFormRow.test.js con anchos simulados. Referencia: plan() de
// design/lab/form/estilo-banco.html (port del prototipo r02 de kiwi).

/** Tamaños (#174): peso y mínimo en múltiplos de `space`. Constantes de diseño, no tokens. */
export const SIZES = Object.freeze({
  xs: Object.freeze({ weight: 2, min: 20 }),
  sm: Object.freeze({ weight: 3, min: 32 }),
  md: Object.freeze({ weight: 4, min: 40 }),
  lg: Object.freeze({ weight: 8, min: 60 })
})
export const MAX_CHILDREN = 6
const TOL = 0.5
const EPS = 1e-9
// Enumeración exhaustiva hasta este número de hijos (2ⁿ⁻¹ particiones); por encima, programación dinámica
const ENUM_LIMIT = 12

/** Lee la clase de tamaño de una lista de clases: { size, unknown: [clases g-form-w-* no reconocidas], all: [...] }. */
export function sizeOf(classList) {
  const all = [...classList].filter((c) => /^g-form-w-/.test(c))
  const known = all.filter((c) => /^g-form-w-(xs|sm|md|lg)$/.test(c))
  const unknown = all.filter((c) => !known.includes(c))
  // Una clase desconocida (incluida g-form-w-full) cuenta como md; con dos clases, gana la primera conocida
  return { size: known.length ? known[0].slice(9) : 'md', unknown, all }
}

/** Anchos de una línea: cada hijo recibe w / Σw × (A − g × (n − 1)). */
export function lineWidths(items, line, A, g) {
  const free = A - g * (line.length - 1)
  const W = line.reduce((a, i) => a + items[i].w, 0)
  return line.map((i) => (items[i].w / W) * free)
}

// Una línea es admisible si todos reciben su mínimo (tolerancia 0,5px) o si tiene un solo hijo
function admissible(items, line, A, g) {
  if (line.length === 1) return true
  return lineWidths(items, line, A, g).every((x, k) => x + TOL >= items[line[k]].m)
}
// Menor cociente ancho recibido / mínimo de una partición (criterio b)
function slackOf(items, lines, A, g) {
  let s = Infinity
  for (const line of lines) {
    const ws = lineWidths(items, line, A, g)
    ws.forEach((x, k) => { const m = items[line[k]].m; s = Math.min(s, m > 0 ? x / m : Infinity) })
  }
  return s
}
// ¿a es mejor que b? (a) menos líneas, (b) más holgada, (c) más hijos en las primeras líneas
function better(a, b) {
  if (a.lines.length !== b.lines.length) return a.lines.length < b.lines.length
  if (Math.abs(a.slack - b.slack) > EPS && !(a.slack === Infinity && b.slack === Infinity)) return a.slack > b.slack
  for (let k = 0; k < a.lines.length; k++) if (a.lines[k].length !== b.lines[k].length) return a.lines[k].length > b.lines[k].length
  return false
}

function* partitions(n) {
  for (let mask = 0; mask < 1 << (n - 1); mask++) {
    const lines = []
    let cur = [0]
    for (let i = 1; i < n; i++) {
      if (mask & (1 << (i - 1))) { lines.push(cur); cur = [i] } else cur.push(i)
    }
    lines.push(cur)
    yield lines
  }
}

// Programación dinámica sobre sufijos: para cada inicio, la mejor partición del resto (aproximación del mismo criterio)
function dynamic(items, A, g) {
  const n = items.length
  const best = new Array(n + 1)
  best[n] = { lines: [], slack: Infinity }
  for (let i = n - 1; i >= 0; i--) {
    let pick = null
    for (let j = i + 1; j <= n; j++) {
      const line = []
      for (let k = i; k < j; k++) line.push(k)
      if (!admissible(items, line, A, g)) continue
      const rest = best[j]
      const cand = { lines: [line, ...rest.lines], slack: Math.min(slackOf(items, [line], A, g), rest.slack) }
      if (!pick || better(cand, pick)) pick = cand
    }
    best[i] = pick
  }
  return best[0].lines
}

/**
 * Elige las líneas (form.md §4, «Reparto en líneas»).
 * @param {{ w: number, m: number }[]} items peso y mínimo efectivo (px) de cada hijo, en orden del DOM
 * @param {number} A ancho de contenido de la fila (px)
 * @param {number} g separación de columna resuelta (px)
 * @param {{ keep?: boolean, stack?: boolean }} [opts]
 * @returns {number[][]} índices de los hijos por línea
 */
export function planLines(items, A, g, opts = {}) {
  const n = items.length
  if (!n) return []
  if (opts.keep) return [items.map((_, i) => i)]
  if (opts.stack || !(A > 0)) return items.map((_, i) => [i])
  if (n > ENUM_LIMIT) return dynamic(items, A, g)
  let pick = null
  for (const lines of partitions(n)) {
    if (!lines.every((line) => admissible(items, line, A, g))) continue
    const cand = { lines, slack: slackOf(items, lines, A, g) }
    if (!pick || better(cand, pick)) pick = cand
  }
  return pick.lines // siempre hay una: una línea por hijo es admisible
}

const px = (v) => +v.toFixed(2)

/**
 * Colocación (form.md §4, «Colocación»): columnas = unión ordenada de los bordes de todos los hijos de todas las líneas,
 * con las separaciones como pistas propias; la última pista es minmax(0, 1fr). Filas: tres pistas por línea y una de
 * separación entre líneas.
 * @returns {{ lines: number, columns: string, rows: string, kids: { index: number, line: number, column: string, row: string }[] }}
 */
export function placement(items, lines, A, g) {
  const edges = new Set([0, px(A)])
  const spans = []
  lines.forEach((line, li) => {
    const ws = lineWidths(items, line, A, g)
    let x = 0
    line.forEach((i, k) => {
      const st = px(x)
      const en = k === line.length - 1 ? px(A) : px(x + ws[k])
      edges.add(st)
      edges.add(en)
      spans.push({ i, li, st, en })
      x += ws[k] + g
    })
  })
  const cols = [...edges].sort((a, b) => a - b)
  const tracks = cols.slice(1).map((c, k) => `${px(c - cols[k])}px`)
  tracks[tracks.length - 1] = 'minmax(0, 1fr)'
  return {
    lines: lines.length,
    columns: tracks.join(' '),
    rows: lines.map(() => 'auto auto auto').join(' var(--_form-row-line-gap) '),
    kids: spans
      .sort((a, b) => a.i - b.i)
      .map((sp) => ({ index: sp.i, line: sp.li, column: `${cols.indexOf(sp.st) + 1} / ${cols.indexOf(sp.en) + 1}`, row: `${sp.li * 4 + 1} / span 3` }))
  }
}
