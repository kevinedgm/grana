// Bruno · planificador puro, sin DOM, tema ni valores de controles.
export const EXACT_LIMIT = 64
const EPS = 1e-8
const sum = (xs) => xs.reduce((a, b) => a + b, 0)
export function normalizeProfile(source = {}) {
  const min = Number.isFinite(source.min) ? Math.max(0, source.min) : 0
  const preferred = Number.isFinite(source.preferred) ? Math.max(min, source.preferred) : min
  const max = Number.isFinite(source.max) ? Math.max(preferred, source.max) : Infinity
  const weight = Number.isFinite(source.weight) ? Math.max(0, source.weight) : 1
  return { min, preferred, max, weight, full: Boolean(source.full) }
}
/** Preferred → shrink headroom → weighted expansion with freezing at maxima. */
export function allocateWidths(items, width, gap = 0) {
  const available = Math.max(0, width - gap * Math.max(0, items.length - 1))
  const minimum = sum(items.map(x => x.min))
  if (minimum > available) return items.map(x => minimum ? available * x.min / minimum : 0)
  const result = items.map(x => x.preferred)
  const total = sum(result)
  if (total > available) {
    const headroom = total - minimum
    return result.map((x, i) => x - (total - available) * (x - items[i].min) / headroom)
  }
  let remaining = available - total
  let active = items.map((_, i) => i).filter(i => items[i].weight > 0 && result[i] < items[i].max)
  while (remaining > EPS && active.length) {
    const weight = sum(active.map(i => items[i].weight))
    let consumed = 0
    for (const i of active) {
      const amount = Math.min(remaining * items[i].weight / weight, items[i].max - result[i])
      result[i] += amount
      consumed += amount
    }
    if (consumed <= EPS) break
    remaining -= consumed
    active = active.filter(i => result[i] + EPS < items[i].max)
  }
  return result
}
function line(items, start, end, width, gap) {
  const segment = items.slice(start, end)
  const widths = allocateWidths(segment, width, gap)
  const compression = sum(segment.map((x, i) => (Math.max(0, x.preferred - widths[i]) / Math.max(x.preferred, EPS)) ** 2))
  return { start, end, widths, cost: 1 + 24 * compression }
}
export function planAdaptive(source, width, gap = 0, { stack = false } = {}) {
  const items = source.map(normalizeProfile)
  width = Number.isFinite(width) ? Math.max(0, width) : 0
  gap = Number.isFinite(gap) ? Math.max(0, gap) : 0
  const n = items.length
  const strategy = n > EXACT_LIMIT ? 'linear' : 'optimal'
  if (stack) return { strategy, lines: items.map((_, i) => line(items, i, i + 1, width, gap)) }
  if (strategy === 'linear') {
    const lines = []
    let start = 0, min = 0
    for (let i = 0; i < n; i++) {
      if (i > start && (items[i].full || items[start].full || min + gap + items[i].min > width)) {
        lines.push(line(items, start, i, width, gap)); start = i; min = 0
      }
      min += (i > start ? gap : 0) + items[i].min
    }
    if (start < n) lines.push(line(items, start, n, width, gap))
    return { strategy, lines }
  }
  const best = Array(n + 1)
  best[n] = { cost: 0, count: 0, next: n }
  for (let start = n - 1; start >= 0; start--) {
    let minimum = 0
    for (let end = start + 1; end <= n; end++) {
      minimum += items[end - 1].min + (end > start + 1 ? gap : 0)
      if (end > start + 1 && (minimum > width + EPS || items[start].full || items[end - 1].full)) break
      const candidate = line(items, start, end, width, gap)
      const cost = candidate.cost + best[end].cost, count = 1 + best[end].count
      const previous = best[start]
      if (!previous || cost < previous.cost - EPS || (Math.abs(cost - previous.cost) <= EPS && (count < previous.count || (count === previous.count && end > previous.next)))) {
        best[start] = { cost, count, next: end, line: candidate }
      }
    }
  }
  const lines = []
  for (let start = 0; start < n; start = best[start].next) lines.push(best[start].line)
  return { strategy, lines }
}
/** Logical placement (#359): `start` is the offset from the inline start of the content box. CSS applies it with
 * `margin-inline-start`, so RTL needs no mirrored arithmetic and the DOM/reading order never changes. */
export function placeAdaptive(plan, width, gap, horizontal = 'start') {
  return plan.lines.flatMap((line, row) => {
    const occupied = sum(line.widths) + gap * Math.max(0, line.widths.length - 1)
    const free = Math.max(0, width - occupied)
    let cursor = horizontal === 'center' ? free / 2 : horizontal === 'end' ? free : 0
    return line.widths.map((w, j) => {
      const start = cursor
      cursor += w + gap
      return { index: line.start + j, line: row + 1, width: w, start }
    })
  })
}
export function aggregateProfiles(profiles, gap = 0) {
  if (!profiles.length) return normalizeProfile({ min: 0, preferred: 0, max: 0, weight: 0 })
  return normalizeProfile({ min: Math.max(...profiles.map(x => x.min)), preferred: Math.max(...profiles.map(x => x.preferred)), max: sum(profiles.map(x => x.max)) + gap * (profiles.length - 1), weight: sum(profiles.map(x => x.weight)) })
}
