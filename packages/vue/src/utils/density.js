// Densidad por región: lectura en JS (interno, no se exporta; dueño: bruno). density.md §7, DECISIONS #980.
// La densidad viaja por CSS (--g-density, que reasigna data-g-density en cualquier elemento): el JS solo la lee donde hay
// lógica que mide. Sin efectos al importar (#444): el único MutationObserver del documento lo crea el primer suscriptor
// en onMounted y lo desconecta el último al desmontar. Límite: ve el atributo, no un cambio del token a mano (§2).
import { onBeforeUnmount, onMounted, shallowRef } from 'vue'

/**
 * Paso de densidad que rige en `el`, desde su --g-density calculado (ve región, <html>, CLI y P2).
 * ≤ 0.8125 → 'compact'; ≤ 0.9375 → 'comfortable'; si no, vacío, no numérico, sin `el` o en el servidor → 'default'.
 */
export function readDensity(el) {
  try {
    const v = parseFloat(getComputedStyle(el).getPropertyValue('--g-density'))
    return v <= 0.8125 ? 'compact' : v <= 0.9375 ? 'comfortable' : 'default'
  } catch {
    return 'default'
  }
}

/**
 * Sube cuando cambia cualquier data-g-density del documento: en la microtarea del cambio y, si llegan más cambios antes
 * del cuadro siguiente, una vez más en él (como mucho dos por cuadro). Fuente separada de un `watch`.
 */
export const densityEpoch = shallowRef(0)

let observer = null
let users = 0
let frame = 0
let pending = false

/**
 * Suscribe el componente a densityEpoch mientras está montado y devuelve un getter de la época, para usarlo como fuente
 * de un `watch`. Getter y no el shallowRef: en un `watch` de varias fuentes, un shallowRef fuerza el disparo cada vez que
 * otra fuente se reevalúa (isShallow en doWatch de Vue), es decir, en cada render del padre (lección de bd888df).
 */
export function useDensityEpoch() {
  onMounted(() => {
    if (users++ || typeof MutationObserver === 'undefined') return
    // Agrupado por cuadro con flanco inicial: sube ya, en la microtarea del cambio (antes de que el navegador calcule el
    // estilo nuevo: GTabs quita is-ready a tiempo y la marca no se anima), y como mucho una vez más en el cuadro siguiente
    // si llegaron más cambios mientras tanto. Medido: con solo el rAF, Chromium calculaba el estilo antes (density.spec.mjs)
    observer = new MutationObserver(() => {
      if (frame) { pending = true; return }
      densityEpoch.value++
      frame = requestAnimationFrame(() => {
        frame = 0
        if (pending) { pending = false; densityEpoch.value++ }
      })
    })
    observer.observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['data-g-density'] })
  })
  onBeforeUnmount(() => {
    if (--users) return
    observer?.disconnect()
    observer = null
    if (frame) cancelAnimationFrame(frame)
    frame = 0
    pending = false
  })
  return () => densityEpoch.value
}
