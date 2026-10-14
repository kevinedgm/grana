// Motor puro de GCardGroup (dueño: bruno). design/contracts/card-group.md «Reglas de props», «Modelo y eventos» y
// «Teclado y foco». Vive en la entrada `@grana/vue/card-group` (#610): el paquete principal solo lleva la clave del contexto.

/** El modelo normalizado al modo: sin `multiple`, un valor o null; con `multiple`, siempre un arreglo. `bad` = tipo distinto (G7). */
export function normalizeModel(model, multiple) {
  if (multiple) return Array.isArray(model) ? { value: model, bad: false } : { value: [], bad: true }
  if (Array.isArray(model)) return { value: null, bad: true }
  return { value: model === undefined ? null : model, bad: false }
}

/** ¿Está pulsado `value` en el modelo normalizado? Igualdad estricta (`'4'` y `4` son distintos). */
export function isPressed(norm, value, multiple) {
  if (value === undefined) return false
  return multiple ? norm.includes(value) : norm === value
}

/**
 * Siguiente modelo al alternar `value`.
 * Sin `multiple`: el `value` si no estaba pulsado; null si lo estaba.
 * Con `multiple`: los valores conocidos en el ORDEN DE LAS TARJETAS (`order`, los `value` gestionados en el DOM) y, al
 * final, los desconocidos en su orden original (el grupo no borra lo que no conoce).
 */
export function toggleModel(norm, value, multiple, order) {
  if (!multiple) return norm === value ? null : value
  const known = new Set(order)
  const on = new Set(norm.filter((v) => known.has(v)))
  if (on.has(value)) on.delete(value)
  else on.add(value)
  const unknown = []
  for (const v of norm) if (!known.has(v) && !unknown.includes(v)) unknown.push(v)
  return [...order.filter((v) => on.has(v)), ...unknown]
}

/**
 * Índice destino de una tecla de la barra (APG Toolbar), o null si la tecla no es de la barra.
 * →/← con espejo en RTL; ↓/↑ lineales; Inicio/Fin a los extremos; sin vuelta.
 */
export function keyTarget(key, i, n, rtl) {
  let t
  switch (key) {
    case 'ArrowRight': t = rtl ? i - 1 : i + 1; break
    case 'ArrowLeft': t = rtl ? i + 1 : i - 1; break
    case 'ArrowDown': t = i + 1; break
    case 'ArrowUp': t = i - 1; break
    case 'Home': t = 0; break
    case 'End': t = n - 1; break
    default: return null
  }
  return Math.max(0, Math.min(n - 1, t))
}

/**
 * Desplazamiento horizontal que deja `card` entera dentro de la caja visible de `strip` (más cercano; 0 si ya cabe).
 * Por cálculo: solo se desplaza la tira, nunca la página.
 */
export function revealDelta(stripRect, clientLeft, clientWidth, cardRect) {
  const start = stripRect.left + clientLeft
  const end = start + clientWidth
  if (cardRect.left < start - 0.5) return cardRect.left - start
  if (cardRect.right > end + 0.5) {
    const d = cardRect.right - end
    // Más ancha que la tira: que se vea su comienzo
    return cardRect.left - d < start ? cardRect.left - start : d
  }
  return 0
}
