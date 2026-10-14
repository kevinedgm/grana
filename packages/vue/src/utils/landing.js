// La llegada y el foco de los niveles que devuelven un valor (interno; dueño: bruno). NO es API pública.
// Contrato: design/contracts/dialog.md §«Niveles anidados» (base 2, 3, 4 y 7) y «La llegada»; docs/contract/api.md «Niveles
// que devuelven un valor» (DECISIONS.md #581, #583, #589). Lo usan los pasos de GDialog y GFormFold.
//
//   land(target)                 // marca la caja visible del destino con data-g-landed (decorativa)
//   resolveTarget(idOrEl)        // `id` o elemento → elemento conectado, o null
//   usable(el)                   // ¿se le puede dar el foco ahora?
//   focusFirstIn(root, skip)     // orden de #292 dentro de un nivel: [autofocus] usable › primer control
//   focusChain([a, b, …], root)  // el primero usable de la lista; si ninguno, #292 en `root`
//
// Solo en el cliente: importar el módulo no toca document.

/** Atributo de la llegada (interno, no es API): atributo y no clase, porque el dueño de la caja repinta su `class`. */
export const LANDED = 'data-g-landed'
/** Respaldo: si el tema no anima la llegada, se quita a los 1000 ms (constante, #589). */
export const LANDED_MS = 1000
/** Solo el fin de una animación con este prefijo retira la marca. */
export const LANDED_PREFIX = 'g-landed'

const landings = new WeakMap() // caja → función que la retira

/** La caja visible del destino: el destino o su ancestro más cercano con data-g-tooltip-box (#395); si no, el destino. */
export function landingBox(target) {
  if (!target || typeof target.closest !== 'function') return null
  return target.closest('[data-g-tooltip-box]') || target
}

/**
 * Marca la caja visible de `target` (`id` o elemento) con data-g-landed. Una llegada nueva a la misma caja reinicia la
 * anterior (se quita y se vuelve a poner en el cuadro siguiente, para que la animación arranque otra vez). Se retira con
 * `animationend`/`animationcancel` de una animación `g-landed*` o a los LANDED_MS. Devuelve la caja marcada (o null).
 */
export function land(target) {
  const box = landingBox(resolveTarget(target))
  if (!box) return null
  const prev = landings.get(box)
  if (prev) prev()
  let timer = null
  let frame = 0
  const onEnd = (event) => {
    if (event.target !== box) return
    if (typeof event.animationName === 'string' && event.animationName.startsWith(LANDED_PREFIX)) done()
  }
  function done() {
    clearTimeout(timer)
    if (frame && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frame)
    box.removeEventListener('animationend', onEnd)
    box.removeEventListener('animationcancel', onEnd)
    box.removeAttribute(LANDED)
    if (landings.get(box) === done) landings.delete(box)
  }
  const mark = () => {
    frame = 0
    box.setAttribute(LANDED, '')
  }
  landings.set(box, done)
  box.addEventListener('animationend', onEnd)
  box.addEventListener('animationcancel', onEnd)
  // Reinicio: sin la marca un cuadro, la animación vuelve a empezar al ponerla
  if (prev && typeof requestAnimationFrame === 'function') frame = requestAnimationFrame(mark)
  else mark()
  timer = setTimeout(done, LANDED_MS)
  return box
}

/** `id` (String) o elemento → elemento conectado al documento, o null. */
export function resolveTarget(target) {
  if (!target) return null
  if (typeof target === 'string') return typeof document === 'undefined' ? null : document.getElementById(target)
  const el = target && target.$el ? target.$el : target
  return el && el.nodeType === 1 && el.isConnected ? el : null
}

/** ¿Se le puede dar el foco? Conectado, sin deshabilitar, fuera de [inert]/[hidden], sin tabindex negativo, visible. */
export function usable(el) {
  if (!el || el.nodeType !== 1 || !el.isConnected) return false
  try { if (el.matches(':disabled')) return false } catch { if (el.disabled) return false }
  if (el.closest('[inert], [hidden]')) return false
  const tab = el.getAttribute('tabindex')
  if (tab !== null && Number(tab) < 0) return false
  return typeof el.checkVisibility === 'function' ? el.checkVisibility() : true
}

const FOCUSABLE = 'a[href], area[href], button, input:not([type="hidden"]), select, textarea, summary, iframe, audio[controls], video[controls], [contenteditable]:not([contenteditable="false"]), [tabindex]'

/** Orden de #292 dentro de `root`: el primer [autofocus] usable; si no, el primer control usable (salvo `skip`). */
export function firstFocusable(root, skip) {
  if (!root || typeof root.querySelectorAll !== 'function') return null
  const ok = (n) => usable(n) && !(skip && n.matches(skip))
  return [...root.querySelectorAll('[autofocus]')].find(ok) || [...root.querySelectorAll(FOCUSABLE)].find(ok) || null
}

/** Enfoca el primer usable de #292 en `root`. true si movió el foco. */
export function focusFirstIn(root, skip) {
  const el = firstFocusable(root, skip)
  if (!el) return false
  el.focus({ preventScroll: true })
  return true
}

/**
 * Lleva el foco al primero usable de `chain` (`id` o elemento, en orden); si ninguno, al orden de #292 en `root` (sin
 * `skip`). Devuelve el elemento que lo recibió, o null.
 */
export function focusChain(chain, root, skip) {
  for (const t of chain) {
    const el = resolveTarget(t)
    if (usable(el)) {
      el.focus({ preventScroll: true })
      return el
    }
  }
  const el = firstFocusable(root, skip)
  if (el) el.focus({ preventScroll: true })
  return el
}

/** Disparador de un nivel (base 2): `from` resuelto o, sin él, el elemento activo fuera de `inside` si no es body. */
export function resolveFrom(from, inside) {
  const el = resolveTarget(from)
  if (el) return el
  if (typeof document === 'undefined') return null
  const a = document.activeElement
  if (!a || a === document.body || a === document.documentElement) return null
  if (inside && typeof inside.contains === 'function' && inside.contains(a)) return null
  return a
}
