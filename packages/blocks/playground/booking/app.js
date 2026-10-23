// Banco del playground de Booking (dueño: bruno; _comun.md §20 «Playwright»). Monta las variantes REALES de
// dist/booking.js con el banco único de la sección (src/blocks/Gb<Sección>/<seccion>.bank.js), una debajo de otra, con el
// tema elegido. Lo verifica design/lab/theme-playground/tests/blocks-booking.spec.mjs (puerto propio 4214).
// Parámetros: ?tema=defecto|rustico|lujo (los temas del CLI de ../marketing/temas) · ?dark=1 · ?v=01|02|03 (una variante)
// · ?zoom=2 (texto al 200 %) · ?anidado=1 (los bloques dentro de una GSection de la aplicación) · ?estado=<clave de states>
// · ?alto=1 (una página larga con un último botón al final: el muelle de GbSearch03 y la cola de #757).
import { createApp, h, reactive } from 'vue'
import Grana, { GContainer, GSection, createIcons } from '@grana/vue'
import { booking } from '@grana/blocks/booking'
import * as Blocks from '@grana/blocks/booking'

const q = new URLSearchParams(location.search)
const tema = ['rustico', 'lujo'].includes(q.get('tema')) ? q.get('tema') : 'defecto'
if (tema !== 'defecto') document.getElementById('tema').href = `../marketing/temas/${tema}.css`
if (q.has('dark')) document.documentElement.dataset.theme = 'dark'
if (q.get('zoom') === '2') document.documentElement.style.fontSize = '200%'

/**
 * @param {string} section  'Search' | 'OfferList' | 'GuestForm' | 'Confirmation' (nombre sin Gb)
 * @param {object} bank     el módulo <seccion>.bank.js
 * @param {object} opts     { concepts: { '01': 'La frase', … }, only: ['01'] (variantes por defecto si no hay ?v) }
 */
export async function mountBank(section, bank, { concepts = {}, only } = {}) {
  const v = q.get('v')
  const nums = ['01', '02', '03'].filter((n) => (v ? n === v : !only || only.includes(n)))
  const icons = await Promise.all((bank.appIcons || []).map((n) => import(`/node_modules/lucide-static/dist/esm/icons/${n}.mjs`).then((m) => m.default)))
  const events = []
  window.blockEvents = events
  const state = (bank.states && bank.states[q.get('estado')]) || {}
  // Estado de vista de cada variante (v-model de la consulta, los valores y el paso)
  const views = Object.fromEntries(nums.map((n) => [n, reactive({})]))
  // El spec cambia el estado de una variante en vivo (p. ej. el total de Booking summary: las cifras ruedan)
  window.blockViews = views
  const variant = (n) => {
    const C = Blocks[`Gb${section}${n}`]
    const view = views[n]
    const block = h(C, {
      ...bank.props,
      ...state,
      ...view,
      id: `gb-${n}`,
      'onUpdate:query': (x) => { view.query = x; events.push(['update:query', n]) },
      'onUpdate:values': (x) => { view.values = x },
      'onUpdate:step': (x) => { view.step = x; events.push(['update:step', n, x]) },
      'onUpdate:value': (x) => { view.value = x; events.push(['update:value', n, x]) },
      onNavigate: (p) => { p.event.preventDefault(); events.push(['navigate', n, p.href]) },
      onActivate: (p) => events.push(['activate', n, p.item && p.item.id]),
      onSelect: (p) => events.push(['select', n, p.offer ? p.offer.id : p.value]),
      onPhotos: (p) => events.push(['photos', n, p.offer && p.offer.id]),
      onSubmit: (p) => { if (p.preventDefault) p.preventDefault(); events.push(['submit', n, p.values || p.kind]) }
    }, bank.slots)
    const label = h('p', { class: 'pg-label' }, `Gb${section}${n}${concepts[n] ? ` · ${concepts[n]}` : ''}`)
    return h(GContainer, { as: 'div', class: 'pg-stage' }, () => [label, q.has('anidado') ? h(GSection, { title: 'Sección de la aplicación' }, () => block) : block])
  }
  const tail = q.has('alto') ? [h('div', { class: 'pg-tall' }), h('button', { id: 'pg-last', type: 'button' }, 'Último botón de la página')] : []
  const app = createApp({ render: () => h('main', { id: 'main' }, [...nums.map(variant), ...tail]) })
  app.use(Grana).use(booking).use(createIcons(icons))
  app.config.warnHandler = (msg) => console.warn(`[Vue warn] ${msg}`)
  app.mount('#app')
  document.documentElement.dataset.ready = '1'
}
