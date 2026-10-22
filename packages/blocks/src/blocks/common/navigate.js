// Guarda de `navigate` de los bloques (dueño: bruno; _comun.md §4, #505, #574): solo la activación primaria (clic con el
// botón principal sin Ctrl, ⌘, Mayús ni Alt, o Intro sobre el enlace) de un evento aún no cancelado, y nunca hacia otro
// contexto de navegación (`target` distinto de _self/_parent/_top, p. ej. el `_blank` de un enlace externo).

export const isPrimary = (event) =>
  Boolean(event) && !event.defaultPrevented && (event.button === undefined || event.button === 0) &&
  !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey

export const otherContext = (target) => Boolean(target) && !['_self', '_parent', '_top'].includes(String(target).toLowerCase())

/** C6: un `href` con esquema `javascript:` no se usa (null); el resto, tal cual. */
export const isUnsafeHref = (href) => typeof href === 'string' && /^\s*javascript:/i.test(href.replace(/[\u0000-\u001F\u007F]/g, ''))
export const safeHref = (href) => (typeof href === 'string' && href.trim() && !isUnsafeHref(href) ? href : null)

/**
 * Reemite un clic sobre un enlace del bloque como `navigate` `{ event, href, item }` si pasa la guarda. Síncrono: la
 * aplicación puede llamar a `event.preventDefault()` en su escucha y dejar la navegación a su router.
 */
export function emitNavigate(emit, event, href, item, external) {
  const target = event && event.currentTarget && event.currentTarget.getAttribute ? event.currentTarget.getAttribute('target') : null
  if (external || !isPrimary(event) || otherContext(target)) return
  emit('navigate', { event, href, item })
}
