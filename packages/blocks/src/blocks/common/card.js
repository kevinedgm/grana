// Una `Action` hecha tarjeta entera (dueño: bruno; _comun.md §3 y §4, features.md «action»): con `href`, la tarjeta es el
// enlace (`GCard interaction="link"`, que ya trae la guarda de `navigate`, #505, y no emite con `target` de otro contexto,
// #574); sin `href`, `interaction="button"` y `activate`. Avisos C5 (externa sin labels.external) y C6 (javascript:).
import { has } from './text.js'
import { isUnsafeHref, safeHref } from './navigate.js'

/** Props de `GCard` para la acción de un elemento (vacío si no tiene) y el nombre de la marca externa (o undefined). */
export function cardAction(action, labels, what, warn) {
  if (!action || typeof action !== 'object') return { card: {} }
  if (action.href !== undefined && action.href !== null && action.href !== '') {
    const href = safeHref(action.href)
    if (!href) {
      try { if (process.env.NODE_ENV !== 'production' && isUnsafeHref(action.href)) warn(`C6:${what}`, `${what}.action tiene un href javascript:; se ignora el enlace (C6).`) } catch {}
      return { card: {} }
    }
    if (action.external) {
      const label = labels && has(labels.external) ? labels.external : undefined
      try { if (process.env.NODE_ENV !== 'production' && !label) warn('C5:external', 'hay una acción externa y falta labels.external («se abre en otra pestaña»): la marca queda decorativa (C5).') } catch {}
      return { card: { interaction: 'link', href, target: '_blank', rel: 'noopener' }, external: true, externalLabel: label }
    }
    return { card: { interaction: 'link', href } }
  }
  return { card: { interaction: 'button' } }
}
