// Ayuda de pruebas de hidratación (solo la importan los *.hydration.test.js; no entra en ninguna entrada del paquete).
// Pinta en el servidor con renderToString, monta con createSSRApp().mount sobre ese HTML y devuelve los avisos de
// hidratación de Vue. `clientLocale(loc)` simula un navegador con otro idioma por defecto (WebKit toma el del sistema):
// navigator.language, <html lang> y todo Intl (y Number#toLocaleString) sin locale resuelven a `loc`.
import { vi } from 'vitest'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'

const CTORS = ['NumberFormat', 'ListFormat', 'DateTimeFormat', 'PluralRules', 'RelativeTimeFormat', 'DisplayNames', 'Collator']

export function clientLocale(loc) {
  const saved = {}
  for (const k of CTORS) {
    const C = Intl[k]
    if (!C) continue
    saved[k] = C
    const W = class extends C { constructor(l, o) { super(l === undefined ? loc : l, o) } }
    W.supportedLocalesOf = C.supportedLocalesOf.bind(C)
    Intl[k] = W
  }
  const toLS = Number.prototype.toLocaleString
  Number.prototype.toLocaleString = function (l, o) { return toLS.call(this, l === undefined ? loc : l, o) }
  const nav = Object.getOwnPropertyDescriptor(window.navigator, 'language')
  Object.defineProperty(window.navigator, 'language', { configurable: true, get: () => loc })
  const prevLang = document.documentElement.getAttribute('lang')
  document.documentElement.setAttribute('lang', loc)
  return () => {
    Object.assign(Intl, saved)
    Number.prototype.toLocaleString = toLS
    if (nav) Object.defineProperty(window.navigator, 'language', nav)
    else delete window.navigator.language
    if (prevLang === null) document.documentElement.removeAttribute('lang')
    else document.documentElement.setAttribute('lang', prevLang)
  }
}

/** SSR → hidratación con el cliente preparado por `client()` (devuelve su deshacer). */
export async function hydrate(App, client) {
  const html = await renderToString(createSSRApp(App))
  const el = document.createElement('div')
  el.innerHTML = html
  document.body.append(el)
  const undo = client ? client() : null
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  createSSRApp(App).mount(el)
  const mismatch = [...warn.mock.calls, ...error.mock.calls].map((c) => String(c[0])).filter((t) => /hydration/i.test(t))
  return { el, html, mismatch, undo }
}
