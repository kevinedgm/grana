// Contexto de GPriceScope y piezas comunes de GPrice y GPriceScope (dueño: bruno). price.md «GPriceScope» (#772) e «Idioma»
// (#775): la región declara su moneda, su idioma y sus textos con provide/inject (SSR-seguro: no cuenta ni recorre sus
// precios). Interno de @grana/vue/price.
import { computed, onMounted, ref } from 'vue'
import { nf } from '../../utils/currency.js'

export const priceScopeKey = Symbol('GPriceScope')

/** ¿Acepta Intl el idioma? */
export const okLocale = (l) => Boolean(l && nf(l, {}))

/**
 * Idioma resuelto: el primer candidato fijo que Intl acepta (`fixed()`: la prop, la región) › el lang del ancestro más
 * cercano de `el` (leído al montar) › navigator.language. null antes de montar sin candidato fijo: SSR e hidratación con la
 * forma canónica (#775). Un cambio del lang del ancestro después de montar no se observa.
 */
export function useLocale(fixed, el) {
  const lang = ref(null)
  const mounted = ref(false)
  onMounted(() => {
    lang.value = el.value?.closest?.('[lang]')?.getAttribute('lang') || null
    mounted.value = true
  })
  const locale = computed(() => {
    for (const c of fixed()) if (okLocale(c)) return c
    if (!mounted.value) return null
    for (const c of [lang.value, typeof navigator !== 'undefined' && navigator.language]) if (okLocale(c)) return c
  })
  return { locale, mounted }
}

/** Avisos de desarrollo de una instancia: una vez por motivo, con el prefijo del componente. */
export function onceWarner(tag) {
  const seen = new Set()
  return (key, text) => {
    try {
      if (process.env.NODE_ENV !== 'production' && !seen.has(key)) {
        seen.add(key)
        console.warn(`[Grana ${tag}] ${text}`)
      }
    } catch {}
  }
}
