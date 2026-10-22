// Arnés de pruebas de los bloques de Marketing (dueño: bruno; _comun.md §8). Solo pruebas: no lo importa ningún bloque.
// Monta una variante con el banco, registra los iconos de la página (createIcons con cadenas de lucide-static) y captura
// los avisos de Vue (app.config.warnHandler) y los `[Grana …]` (console.warn), también los de lo compuesto.
import { vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createIcons } from '@grana/vue'
import * as lucide from 'lucide-static'

const pascal = (name) => name.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase())
export const iconsPlugin = (names = []) => createIcons(names.map((n) => lucide[pascal(n)]))

/** Monta `Comp` con props y slots; devuelve el wrapper y los avisos capturados. `wrap` lo mete en otro árbol (p. ej. una GSection). */
export function mountBlock(Comp, { props = {}, slots = {}, icons = [], attrs = {}, wrap, attachTo } = {}) {
  const warnings = []
  const spy = vi.spyOn(console, 'warn').mockImplementation((...a) => warnings.push(a.map(String).join(' ')))
  const render = () => h(Comp, { ...props, ...attrs }, slots)
  const w = mount({ render: wrap ? () => wrap(render) : render }, {
    attachTo,
    global: {
      plugins: [iconsPlugin(icons)],
      config: { warnHandler: (msg) => warnings.push(`[Vue warn] ${msg}`) }
    }
  })
  return { w, warnings, restore: () => spy.mockRestore() }
}

/** SSR: renderiza la variante en servidor sin errores. */
export async function ssr(Comp, { props = {}, slots = {}, icons = [] } = {}) {
  const app = createSSRApp({ render: () => h(Comp, props, slots) })
  app.use(iconsPlugin(icons))
  const warnings = []
  app.config.warnHandler = (msg) => warnings.push(msg)
  const html = await renderToString(app)
  return { html, warnings }
}

/** Expresión de utilidades de _comun.md §9 (#807), sobre clases y sobre el código de un .vue. */
export const UTILITY = /\bg-(m|p)[tbsexy]?-[0-9]|\bg-(font|gap|flex|grid|block|hidden|w-|h-|items|justify|self|grow|shrink|truncate|radius|sr-only)\b|\bg-text-[a-z]/

/** Un <a> solo lo pintan GBtn, GCard (enlace de la tarjeta) o GTag. */
export const ownAnchor = (a) => a.classList.contains('g-btn') || a.classList.contains('g-card__primary') || [...a.classList].some((c) => c.startsWith('g-tag'))

/** Eventos de clic con modificadores para la guarda de navigate. */
export const click = (init = {}) => new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init })
