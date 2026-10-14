// Contexto interno entre GTable y su GPagination (dueño: bruno). Sin API pública (table.md «La fila ancla», #594).
// La tabla da: anchor() → { index } | null (índice desde 0 sobre toda la colección; GPagination lo pide UNA vez al elegir
// un tamaño), dock (acoplar el pie, #595), stuck (acoplado ahora, medido por la tabla) y announcesRange (la tabla anuncia el
// rango: el rango del pie va sin role="status", #596). Sustituye a la inyección suelta g-table-announces-results solo para
// la paginación (la de GFilterBar no cambia).
export const pagerKey = Symbol('g-table-pager')

/** Lista de tamaños depurada: enteros ≥ 1, sin repetidos, de menor a mayor; con `current` añadido si no estaba */
export function pageSizeList(list, current) {
  if (!Array.isArray(list)) return { sizes: [], dropped: false, added: false }
  const ok = list.filter((n) => Number.isInteger(n) && n >= 1)
  const set = [...new Set(ok)]
  const dropped = set.length !== list.length
  if (!set.length) return { sizes: [], dropped, added: false }
  const added = Number.isInteger(current) && current >= 1 && !set.includes(current)
  if (added) set.push(current)
  return { sizes: set.sort((a, b) => a - b), dropped, added }
}
