// Vue en local para todas las pruebas de navegador (dueño: bruno; PENDIENTES.md §6, auditoría de salida a la 1.0).
// Las páginas del playground y de los bancos cargan Vue de unpkg.com/vue@3 sin versión fija: cada prueba dependía de la
// red (la pasada completa no terminaba en la integración continua) y de la versión que unpkg sirviera ese día. Aquí
// toda petición a ese archivo se responde con node_modules/vue/dist/vue.global.js: sin red y siempre la misma versión.
// Las specs importan `test` y `expect` de este módulo en lugar de '@playwright/test'. Cubre el contexto de cada prueba
// y los que la prueba cree con browser.newContext(); un navegador lanzado a mano (chromium.launch) queda fuera.
import { test as base, expect } from '@playwright/test'
import { fileURLToPath } from 'node:url'

export * from '@playwright/test'

const VUE = fileURLToPath(new URL('../../../../node_modules/vue/dist/vue.global.js', import.meta.url))
// La de producción, para las compuertas de rendimiento que la piden (la de desarrollo es mucho más lenta en cada render)
export const VUE_PROD = fileURLToPath(new URL('../../../../node_modules/vue/dist/vue.global.prod.js', import.meta.url))
const VUE_URL = /^https:\/\/unpkg\.com\/vue@3[^/]*\/dist\/vue\.global\.js/
const PATCHED = Symbol('vue-local')

export const routeVueLocal = (target) => target.route(VUE_URL, (r) => r.fulfill({ path: VUE, contentType: 'application/javascript; charset=utf-8' }))

export const test = base.extend({
  browser: async ({ browser }, use) => {
    if (!browser[PATCHED]) {
      const newContext = browser.newContext.bind(browser)
      browser.newContext = async (...args) => { const ctx = await newContext(...args); await routeVueLocal(ctx); return ctx }
      browser[PATCHED] = true
    }
    await use(browser)
  }
})

export { expect }
