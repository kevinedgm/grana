// Medida de GSummary (interno; dueño: bruno). Contrato: design/contracts/summary.md «Mecanismo de adaptación» (#352).
// La cesión es CSS; esto SOLO cuenta: qué datos quedaron fuera (data-clipped y «+N»), si hay que callar los rótulos
// evidentes (data-terse), si el identificador ya no cabe (data-tight), qué partes llevan elipsis (title nativo) y qué
// datos vuelven a caber por un cambio de tamaño (data-enter).
// POR LOTES: todas las fichas que piden medida en el mismo turno se miden juntas, por fases (se lee todo, se escribe
// después), así el coste en maquetados forzados no crece con el número de fichas: como máximo tres pasadas
// (data-terse → «+N» → data-tight). Sin estado reactivo: todo se escribe en el DOM fuera del render de Vue.
import { observeSize } from '../../utils/sizeObserver.js'

const live = new Set()   // fichas que se miden
const queue = new Set()  // las que esperan medida en este turno
let scheduled = false
let fontsHooked = false

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
const attr = (el, name, on) => { if (el.hasAttribute(name) !== on) el.toggleAttribute(name, on) }

/** Piezas de la ficha (se vuelven a buscar solo tras un render) */
function collect(r) {
  const el = r.el
  for (const t of r.tips) t.removeAttribute('title') // las partes pueden haber cambiado: se vuelve a decidir
  r.facts = [...el.querySelectorAll('.g-summary__fact:not(.is-anchor)')]
  r.anchor = el.querySelector('.g-summary__fact.is-anchor')
  r.value = r.anchor && r.anchor.querySelector('.g-summary__fact-value')
  r.more = el.querySelector('.g-summary__more')
  r.body = el.querySelector('.g-summary__body')
  // Quién recorta: en `row` de una línea y en `inline`, la caja de los datos; con varias líneas, la corriente entera
  r.clip = r.facts.length ? el.querySelector(r.multi ? '.g-summary__flow' : '.g-summary__facts') : null
  r.bare = r.facts.some((f) => f.classList.contains('is-bare'))
  // Partes que pueden llevar elipsis (la línea secundaria, solo si se ve: con datos y una línea es texto oculto)
  r.tips = [el.querySelector('.g-summary__title'), r.anchor, ...(r.multi ? r.facts : [])]
  if (r.multi || !(r.facts.length || r.anchor)) r.tips.push(el.querySelector('.g-summary__subtitle'))
  r.tips = r.tips.filter(Boolean)
}

/** Lectura: qué datos quedan fuera de la caja visible */
function count(r) {
  if (!r.clip) { r.out = []; return (r.n = 0) }
  const cb = r.clip.getBoundingClientRect()
  let n = 0
  r.out = r.facts.map((f) => {
    const b = f.getBoundingClientRect()
    const out = b.top >= cb.bottom - 1 || b.bottom > cb.bottom + 1 || b.width === 0 || cb.width < 2
    if (out) n++
    return out
  })
  return (r.n = n)
}

/** Lectura: ¿el identificador ya no cabe entero? (elipsis propia, o el cuerpo desborda: en `inline` no encoge) */
function cramped(r) {
  if (r.body && r.body.scrollWidth > r.body.clientWidth + 1) return true
  if (!r.anchor || !r.value) return false
  if (r.anchor.scrollWidth > r.anchor.clientWidth + 1) return true
  const v = r.value.getBoundingClientRect()
  const a = r.anchor.getBoundingClientRect()
  return v.right > a.right + 0.01 || v.left < a.left - 0.01
}

// Fichas fuera de la vista (más de un visor de distancia): su medida se aplaza hasta que se acercan («+N» es decorativo
// y llegar tarde no cambia lo que se lee); así el coste no crece con las fichas de una lista larga
let io = null
function nearViewport(b) {
  if (typeof innerHeight !== 'number') return true
  return b.bottom >= -innerHeight && b.top <= innerHeight * 2 && b.right >= -innerWidth && b.left <= innerWidth * 2
}
function defer(r) {
  if (r.deferred) return
  if (typeof IntersectionObserver === 'undefined') return
  if (!io) {
    io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        const x = e.target.__gsu
        io.unobserve(e.target)
        if (x && x.deferred) { x.deferred = false; request(x) }
      }
    }, { rootMargin: '100%' })
  }
  r.deferred = true
  r.el.__gsu = r
  io.observe(r.el)
}
function undefer(r) {
  if (!r.deferred) return
  r.deferred = false
  if (io) io.unobserve(r.el)
}

function flush() {
  scheduled = false
  const asked = [...queue]
  queue.clear()
  // 0 · Lectura: ancho y posición de cada ficha. Sin cambio de ancho ni de contenido no hay nada que medir
  const work = []
  for (const r of asked) {
    if (!live.has(r) || !r.el.isConnected) continue
    const b = r.el.getBoundingClientRect()
    const w = b.width
    if (!r.dirty && w === r.w) continue
    const first = r.w < 0
    if (w === 0) {
      if (first && r.onZero && r.el.getClientRects().length) r.onZero()
      r.w = w
      continue // sin caja (oculta): se medirá al mostrarse; `dirty` se conserva
    }
    if (!nearViewport(b) && typeof IntersectionObserver !== 'undefined') { defer(r); continue } // lejos: cuando se acerque
    undefer(r)
    // Entrada: solo por un cambio de tamaño entre dos anchos reales (no al montar, ni al mostrarse, ni por los datos)
    r.resize = !r.dirty && r.w > 0
    // Al ensanchar (o al cambiar el contenido) se parte de cero. Al estrechar, lo que ya cedía sigue cediendo: las
    // marcas solo se añaden, y se ahorran maquetados
    r.reset = r.dirty || first || w > r.w
    r.w = w
    if (r.dirty) { collect(r); r.prev = null; r.dirty = false }
    work.push(r)
  }
  if (!work.length) return
  // 1 · Escritura: estado sin marcas (solo al partir de cero)
  for (const r of work) {
    if (!r.reset) continue
    attr(r.el, 'data-terse', false)
    attr(r.el, 'data-tight', false)
    if (r.more && !r.more.hidden) r.more.hidden = true
  }
  // 2 · Lectura · Pasada 1 (escritura): se callan los rótulos evidentes antes de soltar un dato
  for (const r of work) count(r)
  const terse = work.filter((r) => r.n && r.bare && !r.el.hasAttribute('data-terse'))
  for (const r of terse) r.el.setAttribute('data-terse', '')
  for (const r of terse) count(r)
  // Pasada 2: «+N» ocupa sitio; se vuelve a contar con ella a la vista. En el mismo maquetado se lee si el
  // identificador cabe y qué partes llevan elipsis (definitivo para las fichas que no pasan a apretadas)
  const more = work.filter((r) => r.n && r.more)
  for (const r of more) { r.more.textContent = '+' + r.n; r.more.hidden = false }
  for (const r of work) {
    count(r)
    r.tight = r.el.hasAttribute('data-tight') || cramped(r)
    r.cut = r.tips.map((t) => t.scrollWidth > t.clientWidth + 1)
  }
  for (const r of work) {
    if (!r.more) continue
    if (r.n && !r.tight) { r.more.textContent = '+' + r.n; r.more.hidden = false }
    else if (!r.more.hidden) r.more.hidden = true
  }
  // Pasada 3: apretado (sin «+N», sin rótulo del identificador y, en una línea, sin los demás datos)
  const tight = work.filter((r) => r.tight && !r.el.hasAttribute('data-tight'))
  for (const r of tight) r.el.setAttribute('data-tight', '')
  for (const r of tight) {
    count(r)
    r.cut = r.tips.map((t) => t.scrollWidth > t.clientWidth + 1)
  }
  // Escritura final: data-clipped, title nativo solo en lo cortado y los datos que vuelven a caber
  const still = !reduced()
  const entered = []
  for (const r of work) {
    const now = new Set()
    r.facts.forEach((f, i) => {
      attr(f, 'data-clipped', r.out[i])
      if (r.out[i]) now.add(f)
      else if (r.resize && still && r.prev && r.prev.has(f)) { f.setAttribute('data-enter', ''); entered.push(f) }
    })
    r.prev = now
    r.tips.forEach((t, i) => {
      if (!r.cut[i]) { if (t.hasAttribute('title')) t.removeAttribute('title'); return }
      const text = t.textContent.replace(/;\s*$/, '').trim()
      if (t.getAttribute('title') !== text) t.setAttribute('title', text)
    })
  }
  // Sin animación calculada (otro CSS, tema sin movimiento), la marca se retira en el acto (patrón de #313)
  if (entered.length && typeof getComputedStyle === 'function') {
    const none = entered.filter((f) => !String(getComputedStyle(f).animationName || 'none').startsWith('g-summary-enter'))
    for (const f of none) f.removeAttribute('data-enter')
  }
}

/** Pide la medida de una ficha; todas las pedidas en el mismo turno se miden juntas, antes del siguiente pintado */
export function request(r) {
  queue.add(r)
  if (scheduled) return
  scheduled = true
  Promise.resolve().then(flush)
}

/** El contenido cambió (render): se vuelven a buscar las piezas y nada «entra» */
export function touch(r) {
  r.dirty = true
  request(r)
}

/**
 * Empieza a medir la ficha `el`. `opts.multi`: `row` con varias líneas de datos; `opts.onZero`: aviso si mide 0 de ancho.
 * Devuelve el registro (para `touch` y `detach`).
 */
export function attach(el, opts) {
  const r = { el, multi: !!opts.multi, onZero: opts.onZero, w: -1, dirty: true, deferred: false, prev: null, facts: [], tips: [], out: [], n: 0 }
  live.add(r)
  r.stop = observeSize(el, () => request(r))
  request(r)
  // Al llegar la fuente cambia el ancho del texto sin que cambie el de la ficha
  if (!fontsHooked && typeof document !== 'undefined' && document.fonts && document.fonts.status !== 'loaded' && document.fonts.ready) {
    fontsHooked = true
    document.fonts.ready.then(() => {
      fontsHooked = false
      for (const x of live) touch(x)
    })
  }
  return r
}

/** Deja de medir y retira lo que la medida escribió (la ficha pasa a `stack`, a carga, o se desmonta) */
export function detach(r, clean) {
  live.delete(r)
  queue.delete(r)
  undefer(r)
  if (r.stop) r.stop()
  if (!clean || !r.el) return
  r.el.removeAttribute('data-terse')
  r.el.removeAttribute('data-tight')
  for (const f of r.el.querySelectorAll('[data-clipped], [data-enter]')) { f.removeAttribute('data-clipped'); f.removeAttribute('data-enter') }
  for (const t of r.tips) t.removeAttribute('title')
}
