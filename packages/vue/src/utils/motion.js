// Movimiento (interno; dueño: bruno). Duración total de las transiciones calculadas de un elemento, en ms:
// máximo de duración + retardo de su lista. 0 sin transiciones o sin getComputedStyle (jsdom, SSR).
export function transitionMs(el) {
  if (!el || typeof getComputedStyle !== 'function') return 0
  const cs = getComputedStyle(el)
  const list = (v) => String(v || '').split(',').map((x) => {
    const n = parseFloat(x)
    return Number.isFinite(n) ? (x.trim().endsWith('ms') ? n : n * 1000) : 0
  })
  const d = list(cs.transitionDuration)
  const dl = list(cs.transitionDelay)
  return d.reduce((m, v, i) => Math.max(m, v + (dl[i % dl.length] || 0)), 0)
}
