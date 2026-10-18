// Aviso de desarrollo: categoría pedida sin su token en el tema (dueño: bruno). INTERNA, sin efectos en el nivel superior (#444).
// El CLI emite 0 categorías si el tema no declara `categories: N`: un GAvatar o un GTag con categories/color k se quedaría
// neutro sin explicación. Se avisa UNA vez por número de categoría y por carga del módulo, solo en desarrollo, solo en
// el navegador (onMounted/onUpdated, nunca en SSR) y leyendo el estilo calculado del propio elemento (alcanza lo que hereda).
const seen = new Set()

/**
 * @param {Element|null} el  raíz del componente ya montada
 * @param {number|null} k    categoría 1..12 pintada (null: neutro, nada que comprobar)
 * @param {string} who       'GAvatar' | 'GTag'
 */
export function warnMissingCategory(el, k, who) {
  try {
    if (process.env.NODE_ENV !== 'production' && !(k === null || k === undefined || seen.has(k))) {
      if (!el || typeof getComputedStyle !== 'function') return
      const token = `--g-color-cat-${k}`
      if (getComputedStyle(el).getPropertyValue(token).trim() !== '') return
      seen.add(k)
      console.warn(`[Grana ${who}] pide la categoría ${k} pero el tema no define ${token}: se queda neutro. Añade \`categories: N\` (N ≥ ${k}) a grana.config.json y vuelve a ejecutar «grana theme».`)
    }
  } catch {}
}

/** Solo para pruebas: olvida los avisos ya dados */
export const resetCategoryWarnings = () => seen.clear()
