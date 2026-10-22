// Banco del playground de Marketing (dueño: bruno; _comun.md §8 «Playwright»). Monta las variantes REALES de
// dist/marketing.js con el banco único de la sección (src/blocks/Gb<Sección>/<seccion>.bank.js), una debajo de otra, con
// el tema elegido. Lo verifica design/lab/theme-playground/tests/blocks-marketing.spec.mjs (puerto propio 4213).
// Parámetros: ?tema=defecto|rustico|lujo · ?dark=1 · ?v=01|02|03 (solo una variante; el héroe la exige: un h1 por página)
// · ?zoom=2 (texto al 200 %) · ?anidado=1 (los bloques dentro de una GSection de la aplicación).
import { createApp, h } from 'vue'
import Grana, { GContainer, GSection, createIcons } from '@grana/vue'
import { marketing } from '@grana/blocks/marketing'
import * as Blocks from '@grana/blocks/marketing'

const q = new URLSearchParams(location.search)
const tema = ['rustico', 'lujo'].includes(q.get('tema')) ? q.get('tema') : 'defecto'
if (tema !== 'defecto') document.getElementById('tema').href = `./temas/${tema}.css`
if (q.has('dark')) document.documentElement.dataset.theme = 'dark'
if (q.get('zoom') === '2') document.documentElement.style.fontSize = '200%'

const pascal = (n) => n.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase())

/**
 * @param {string} section  'Hero' | 'Features' | 'Stats' (nombre sin Gb)
 * @param {object} bank     el módulo <seccion>.bank.js
 * @param {object} opts     { full: true } si la variante va a sangre (sin GContainer); { concepts: { '01': 'La ventana', … } };
 *                          { bleed: ['02'] } variantes que la aplicación pone a sangre dentro del GContainer (class="g-bleed")
 */
export async function mountBank(section, bank, { full = false, concepts = {}, bleed = [] } = {}) {
  const only = q.get('v')
  const nums = ['01', '02', '03'].filter((n) => !only || n === only)
  const icons = await Promise.all((bank.appIcons || []).map((n) => import(`/node_modules/lucide-static/dist/esm/icons/${n}.mjs`).then((m) => m.default)))
  const events = []
  window.blockEvents = events
  const variant = (n) => {
    const C = Blocks[`Gb${section}${n}`]
    const block = h(C, {
      ...bank.props,
      id: `gb-${n}`,
      class: bleed.includes(n) ? 'g-bleed' : undefined,
      onNavigate: (p) => { p.event.preventDefault(); events.push(['navigate', n, p.href]) },
      onActivate: () => events.push(['activate', n]),
      onSubmit: (p) => events.push(['submit', n, p.email])
    }, bank.slots)
    // Rótulo del banco (no es un encabezado: no cuenta en el esquema de la página)
    const label = h('p', { class: 'pg-label' }, `Gb${section}${n}${concepts[n] ? ` · ${concepts[n]}` : ''}`)
    if (full) return [label, block]
    return h(GContainer, { as: 'div', class: 'pg-stage' }, () => [label, q.has('anidado') ? h(GSection, { title: 'Sección de la aplicación' }, () => block) : block])
  }
  const app = createApp({ render: () => h('main', { id: 'main' }, nums.map(variant)) })
  app.use(Grana).use(marketing).use(createIcons(icons))
  app.config.warnHandler = (msg) => console.warn(`[Vue warn] ${msg}`)
  app.mount('#app')
  document.documentElement.dataset.ready = '1'
}
