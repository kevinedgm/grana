// Separación del contenedor de GFormReveal (dueño: bruno)
// Contrato: design/contracts/form.md §14 «Transición» (#278): --_reveal-gap = row-gap calculado del elemento padre (0 si
// no es un número). UN ResizeObserver compartido por todos los bloques (y las secciones), observando a cada padre; las lecturas van fuera
// de su devolución (en requestAnimationFrame) y quien escribe solo lo hace si cambia (lección de #169 / #173).
import { observeSize } from '../../utils/sizeObserver.js'

/** row-gap calculado de un elemento en px; 0 si no es un número (`normal`, sin estilo, SSR). */
export function rowGapOf(el) {
  if (!el || typeof getComputedStyle !== 'function') return 0
  const raw = getComputedStyle(el).rowGap
  if (!raw || !/^-?[\d.]+(e-?\d+)?px$/i.test(String(raw).trim())) return 0
  const n = parseFloat(raw)
  return Number.isFinite(n) ? n : 0
}

/**
 * Llama a `fn` (en el cuadro siguiente) cada vez que `parent` cambia de tamaño. Devuelve la función que deja de observar.
 * Es el observador compartido de utils/sizeObserver.js (el mismo que usan las secciones de GFormSection).
 */
export const observeParent = observeSize
