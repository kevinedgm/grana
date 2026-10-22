// Listas de los bloques (dueño: bruno; _comun.md §2 «Identidad de los elementos», avisos C1 a C3).
import { computed } from 'vue'
import { has } from './text.js'

/**
 * Elementos pintables de una lista con su clave: se omiten los que no tienen un campo obligatorio (C2) y un `id`
 * repetido usa el índice (C3). `required` es la lista de campos; `what` nombra la lista en el aviso.
 */
export function entries(list, required, what, warn) {
  const out = []
  const ids = new Set()
  const arr = Array.isArray(list) ? list : []
  arr.forEach((item, index) => {
    const missing = !item || typeof item !== 'object' ? required[0] : required.find((k) => !has(item[k]))
    if (missing) {
      try { if (process.env.NODE_ENV !== 'production') warn(`C2:${what}:${index}`, `${what}[${index}] sin ${missing}: se omite (C2).`) } catch {}
      return
    }
    let key = index
    if (item.id !== undefined && item.id !== null) {
      if (ids.has(item.id)) {
        try { if (process.env.NODE_ENV !== 'production') warn(`C3:${what}:${String(item.id)}`, `${what}: id «${String(item.id)}» repetido; se usa el índice (C3).`) } catch {}
      } else {
        ids.add(item.id)
        key = `id:${String(item.id)}`
      }
    }
    out.push({ item, key, index })
  })
  return out
}

/**
 * La lista principal de una sección como `computed`, con los avisos C1 (vacía: el bloque no pinta nada) y C7 (fuera del
 * rango recomendado: se pinta todo). `range` = [mínimo, máximo] recomendados.
 */
export function useItems(source, { required, what = 'items', range = [1, Infinity], warn }) {
  return computed(() => {
    const raw = source()
    const n = Array.isArray(raw) ? raw.length : 0
    try {
      if (process.env.NODE_ENV !== 'production') {
        if (!n) warn('C1', `${what} está vacía: el bloque no pinta nada (C1).`)
        else if (n < range[0] || n > range[1]) warn('C7', `${what} con ${n} elementos; se recomiendan ${range[1] === Infinity ? `al menos ${range[0]}` : `de ${range[0]} a ${range[1]}`}: se pintan todos (C7).`)
      }
    } catch {}
    return entries(raw, required, what, warn)
  })
}
