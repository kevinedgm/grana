// Motor de teclado y puntero de los menús (interno; dueño: bruno). NO se exporta desde src/index.js ni es API (sin promesa
// de estabilidad). Contrato: design/contracts/fab.md «Frontera con GMenu y el motor compartido» (#657); sacado de GMenu sin
// cambiar su comportamiento, como utils/collapse.js salió de GFormSection. Lo usan GMenu (principal) y GFab (entrada
// @grana/vue/fab, por __shared: src/shared.js).
//
// Contenido: el foco itinerante de un nivel; ↑ ↓ cíclicas, Inicio y Fin; la letra con su búfer de 500 ms sobre la etiqueta
// (en un menú la letra SALTA, api.md «Letras en listas de comandos», #658; filtrar es un modo propio de quien lo anuncia);
// M1 (el puntero mueve el foco y el puntero quieto no hace nada, #305 y #358 regla 4) con los datos del resaltado que viaja
// (--_active-y/h, has-highlight, is-highlight-instant), y la guarda de una activación por gesto (#661).
import { setVar } from './anchor.js'
import { flashInstant } from './glide.js'

/** Búfer de la letra (constante neutra, #187) */
export const TYPE_MS = 500

/**
 * Una activación por gesto (#661, api.md): el segundo clic de una ráfaga (`click` con `detail > 1`) e Intro o Espacio
 * mantenidos (`repeat`) no cambian el estado. Quien lo usa ignora el gesto (y, en un teclado, cancela su acción nativa).
 */
export const repeatGesture = (e) => Boolean(e && ((e.type === 'click' && e.detail > 1) || (e.repeat && (e.key === 'Enter' || e.key === ' '))))

/**
 * Foco itinerante: `el` pasa a ser la parada de su nivel (`level`, los elementos del nivel). Con el puntero (M1), sin
 * desplazar la lista y sin pedir el anillo de :focus-visible. Con `scroll(el)`, el foco no desplaza nada y quien llama
 * acerca el elemento dentro de su lista (GFab: sus listas son fijas y no deben mover un contenedor de la página).
 */
export function focusItem(el, level, byPointer, scroll) {
  if (!el) return
  for (const x of level) x.tabIndex = -1
  el.tabIndex = 0
  if (byPointer) { el.focus({ preventScroll: true, focusVisible: false }); return }
  if (scroll) { el.focus({ preventScroll: true }); scroll(el); return }
  el.focus()
  el.scrollIntoView?.({ block: 'nearest' })
}

/** ↑ ↓ (cíclicas), Inicio y Fin: el destino en `list` desde el índice `i`, o undefined si la tecla no recorre */
export function stepTo(key, list, i) {
  const n = list.length
  if (key === 'ArrowDown') return list[(i + 1) % n]
  if (key === 'ArrowUp') return list[(i - 1 + n) % n]
  if (key === 'Home') return list[0]
  if (key === 'End') return list[n - 1]
}

/**
 * La letra (APG, como GMenu): salta al siguiente elemento cuya etiqueta (`label(el)`) empieza por lo escrito; búfer de
 * TYPE_MS. `key(e, list, i)` devuelve false si la tecla no es un carácter imprimible (sin Ctrl, ⌘ ni Alt; Espacio no
 * cuenta), y si lo es, el elemento encontrado o null.
 */
export function createTypeahead(label) {
  let typed = ''
  let timer = null
  return {
    key(e, list, i) {
      const k = e.key
      if (k.length !== 1 || e.ctrlKey || e.metaKey || e.altKey || k === ' ') return false
      typed += k.toLowerCase()
      clearTimeout(timer)
      timer = setTimeout(() => { typed = '' }, TYPE_MS)
      const from = typed.length > 1 ? i : i + 1
      return [...list.slice(from), ...list.slice(0, from)].find((x) => String(label(x) || '').trim().toLowerCase().startsWith(typed)) || null
    },
    stop() { clearTimeout(timer); typed = '' }
  }
}

/**
 * M1 · el puntero mueve el foco: `moved(e)` devuelve false si el puntero es táctil o no se movió (un elemento que pasa bajo
 * el puntero quieto, al abrir o al desplazar la lista, no le quita el foco al teclado); si se movió, el punto anterior (o
 * null). `at` es el último punto (quien abre con un clic lo fija ahí; null lo olvida).
 */
export function createPointer() {
  return {
    at: null,
    moved(e) {
      if (e.pointerType === 'touch') return false
      const pt = { x: e.clientX, y: e.clientY }
      const prev = this.at
      this.at = pt
      if (prev && prev.x === pt.x && prev.y === pt.y) return false
      return prev
    }
  }
}

/**
 * M1 · una sola luz que viaja: datos para el CSS en cada lista, --_active-y y --_active-h (px, respecto de la lista: el
 * resaltado se desplaza con el contenido) y has-highlight mientras haya activo; is-highlight-instant en la primera
 * colocación (tras abrir o tras no tener activo), retirada a los dos cuadros. Se escribe solo lo que cambia.
 * `highlight(menu, el)`; con `el` nulo, sin activo.
 */
export function createHighlight() {
  const offsetIn = (el, menu) => {
    let y = 0
    for (let n = el; n && n !== menu; n = n.offsetParent) {
      // La lista no es el contenedor de posición de sus elementos: por geometría
      if (!n.offsetParent || !menu.contains(n.offsetParent)) {
        return el.getBoundingClientRect().top - menu.getBoundingClientRect().top - menu.clientTop + menu.scrollTop
      }
      y += n.offsetTop
    }
    return y
  }
  return (menu, el) => {
    const cl = menu.classList
    if (!el) { if (cl.contains('has-highlight')) cl.remove('has-highlight'); return }
    const first = !cl.contains('has-highlight')
    // Primera colocación sin viaje durante dos cuadros: el mismo ayudante que la luz de GSidebar y GTable (utils/glide.js)
    if (first) flashInstant(menu)
    setVar(menu, '--_active-y', `${Math.round(offsetIn(el, menu))}px`)
    setVar(menu, '--_active-h', `${el.offsetHeight}px`)
    if (first) cl.add('has-highlight')
  }
}
