// Idioma y fechas de los bloques (dueño: bruno; _comun.md §15 regla 6, §27 regla 1). Interno del paquete: no se exporta.
// Lo comparten Booking y Ecommerce (va en el trozo compartido de las dos entradas, sin `describeQuery`: Ecommerce no carga
// @grana/vue/booking, §34). common/booking.js lo reexporta con los mismos nombres.
//   - `fill`: plantillas `{nombre}` de los textos de la aplicación.
//   - `useLocale`: `locale` de la sección › `lang` del ancestro (al montar) › `navigator.language`; en SSR sin `locale`, nada.
//   - `dateTime`: una fecha u hora para `<time datetime>` con su texto de Intl (en la zona del lugar si hay `timeZone`).
import { getCurrentInstance, onMounted, ref, watch } from 'vue'
import { has } from './text.js'

/** Sustituye {nombre} (texto de la aplicación); un marcador sin valor se deja tal cual. */
export const fill = (text, vars) => (typeof text === 'string' ? text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] === undefined || vars[k] === null ? m : String(vars[k]))) : '')

/**
 * `locale` de la sección › `lang` del ancestro › `navigator.language`, leído al montar (SSR: solo la prop). Devuelve un ref.
 */
export function useLocale(props) {
  const loc = ref(has(props.locale) ? props.locale : undefined)
  const inst = getCurrentInstance()
  onMounted(() => {
    if (has(props.locale)) return
    const el = inst && inst.proxy && inst.proxy.$el
    const node = el && el.nodeType === 1 ? el : el && el.parentElement
    const near = node && typeof node.closest === 'function' ? node.closest('[lang]') : null
    loc.value = (near && near.getAttribute('lang')) || (typeof navigator !== 'undefined' && navigator.language) || undefined
  })
  watch(() => props.locale, (v) => { if (has(v)) loc.value = v })
  return loc
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/
/**
 * Una fecha (AAAA-MM-DD) o fecha y hora ISO para `<time datetime>`: `{ datetime, text }`. La fecha sola se dice tal como la
 * escribió la aplicación (en UTC, el mismo día en cualquier zona); con hora, en la zona del lugar (`timeZone` IANA). Sin
 * idioma resuelto (SSR sin `locale`), el texto es el ISO (se reformatea al montar). Lo que no se lee: el texto tal cual.
 */
export function dateTime(iso, { locale, timeZone, weekday = true } = {}) {
  if (typeof iso !== 'string' || !iso.trim()) return null
  const s = iso.trim()
  const m = DATE_ONLY.exec(s)
  const d = m ? new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))) : new Date(Date.parse(s))
  if (Number.isNaN(d.getTime())) return { datetime: undefined, text: s }
  if (!locale) return { datetime: s, text: s }
  const o = { day: 'numeric', month: 'long', ...(weekday ? { weekday: 'long' } : {}) }
  if (m) o.timeZone = 'UTC'
  else {
    o.hour = 'numeric'
    o.minute = '2-digit'
    if (has(timeZone)) o.timeZone = timeZone
  }
  let text
  try { text = new Intl.DateTimeFormat(locale, o).format(d) } catch {
    try { delete o.timeZone; text = new Intl.DateTimeFormat(locale, m ? { ...o, timeZone: 'UTC' } : o).format(d) } catch { text = s }
  }
  return { datetime: s, text }
}
