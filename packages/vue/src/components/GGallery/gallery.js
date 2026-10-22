// Motor común de GGallery y GGalleryViewer (dueño: bruno). Interno de la entrada @grana/vue/gallery (gallery.md, #731).
// Sin efectos al importar (#444).

/** Una foto válida: objeto con src. */
export const isPhoto = (p) => Boolean(p && typeof p === 'object' && typeof p.src === 'string' && p.src)

/**
 * Espacios (A, gallery.md «Reglas de props»): con `groups`, su orden y etiqueta; sin ella, los de `photo.group` en el orden
 * de su primera aparición (etiqueta = el valor). Una foto con un `group` fuera de `groups` va a un espacio al final con su
 * valor como etiqueta. Sin `group` en ninguna foto: null (base). Devuelve { list: [{ value, label, id, items }], of: [gi] }.
 * `issues` recibe los avisos (4): { unknown, duplicate }.
 */
export function buildGroups(photos, groups, base, issues = {}) {
  if (!photos.some((p) => p.group !== undefined && p.group !== null && p.group !== '')) return null
  const list = []
  const byValue = new Map()
  const add = (value, label, id) => {
    const g = { value, label: label === undefined || label === null || label === '' ? String(value) : String(label), id: id || `${base}-g-${list.length + 1}`, items: [] }
    list.push(g)
    byValue.set(value, g)
    return g
  }
  if (Array.isArray(groups)) {
    for (const g of groups) {
      if (!g || typeof g !== 'object') continue
      if (byValue.has(g.value)) { issues.duplicate = g.value; continue }
      add(g.value, g.label, g.id)
    }
  }
  const declared = list.length > 0
  const of = []
  photos.forEach((p, i) => {
    const v = p.group === undefined || p.group === null || p.group === '' ? null : p.group
    let g = byValue.get(v)
    if (!g) {
      if (declared && v !== null) issues.unknown = v
      g = add(v === null ? '' : v, v === null ? '' : v)
    }
    g.items.push(i)
    of[i] = list.indexOf(g)
  })
  // Los espacios fijados sin fotos no se pintan (ni en el índice ni en el hilo)
  const used = list.filter((g) => g.items.length)
  const remap = list.map((g) => used.indexOf(g))
  return { list: used, of: of.map((gi) => remap[gi]) }
}

/** Texto contado: String con marcadores o Function (plural del idioma) llamada con (count, vars). */
export function counted(tpl, count, vars, fill) {
  if (typeof tpl === 'function') return String(tpl(count, vars))
  return typeof tpl === 'string' ? fill(tpl, vars) : ''
}

/** Idioma: el de la prop o el `lang` del ancestro más cercano (como GNumberField); sin ninguno, el del documento. */
export function langOf(el, own) {
  if (own) return own
  const near = el && el.closest ? el.closest('[lang]') : null
  const v = near && near.getAttribute('lang')
  if (v) return v
  return (typeof document !== 'undefined' && document.documentElement.lang) || undefined
}

/** Intl.NumberFormat que nunca lanza (un locale inválido cae al del entorno). */
export function numberFormat(locale) {
  try { return new Intl.NumberFormat(locale) } catch { return new Intl.NumberFormat() }
}
