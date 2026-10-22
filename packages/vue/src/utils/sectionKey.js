// Clave interna de anidación de GSection (no es API pública, section.md #720): lleva la profundidad, el nivel de la
// siguiente (`next`, tope 4, lo usa GSection) y el nivel propio de la sección (`level`, lo usa useSectionLevel, #817).
import { computed, getCurrentInstance, inject } from 'vue'

export const sectionKey = Symbol('GSection')

// useSectionLevel (#817, section.md «Nivel para componentes y bloques»): nivel de un encabezado puesto aquí (2 fuera de
// toda GSection; dentro, el de la sección + 1, tope 6) y secciones antepasadas. Fuera de un setup, 2 y 0 sin avisar.
export function useSectionLevel() {
  const p = getCurrentInstance() ? inject(sectionKey, null) : null
  return {
    level: computed(() => (p && p.value ? Math.min(p.value.level + 1, 6) : 2)),
    depth: computed(() => (p && p.value ? p.value.depth : 0))
  }
}
