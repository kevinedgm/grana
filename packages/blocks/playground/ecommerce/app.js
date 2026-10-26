// Banco del playground de Ecommerce (dueño: bruno; _comun.md §33 «Playwright»). Monta las variantes REALES de
// dist/ecommerce.js con el banco único de la sección (src/blocks/Gb<Sección>/<seccion>.bank.js), una debajo de otra, con el
// tema elegido. Lo verifica design/lab/theme-playground/tests/blocks-ecommerce.spec.mjs (puertos propios 4217 A, 4218 B y
// 4219 C). Parámetros: ?tema=defecto|rustico|lujo (los temas del CLI de ../marketing/temas) · ?dark=1 · ?v=01|02|03 (una
// variante) · ?zoom=2 (texto al 200 %) · ?anidado=1 (los bloques dentro de una GSection de la aplicación) · ?estado=<clave
// de states>. Un banco con `each` ({ prop, items: [{ value, only? }] }) monta la variante una vez por elemento (Product
// card: una tarjeta por producto); `only` limita un elemento a unas variantes y `hints` ({ '02': 'g-adapt-full' }) da la
// pista de la rejilla de la aplicación por variante.
import { createApp, h, reactive } from 'vue'
import Grana, { GAdaptiveLayout, GContainer, GSection, createIcons } from '@grana/vue'
import { ecommerce } from '@grana/blocks/ecommerce'
import * as Blocks from '@grana/blocks/ecommerce'

const q = new URLSearchParams(location.search)
const tema = ['rustico', 'lujo'].includes(q.get('tema')) ? q.get('tema') : 'defecto'
if (tema !== 'defecto') document.getElementById('tema').href = `../marketing/temas/${tema}.css`
if (q.has('dark')) document.documentElement.dataset.theme = 'dark'
if (q.get('zoom') === '2') document.documentElement.style.fontSize = '200%'

/**
 * @param {string} section  'ProductCard' | 'CategoryPreviews' | 'Trust' | 'Promo' … (nombre sin Gb)
 * @param {object} bank     el módulo <seccion>.bank.js
 * @param {object} opts     { concepts: { '01': 'Foto arriba', … }, only: ['01'] (variantes por defecto si no hay ?v) }
 */
export async function mountBank(section, bank, { concepts = {}, only } = {}) {
  const v = q.get('v')
  const nums = ['01', '02', '03'].filter((n) => (v ? n === v : !only || only.includes(n)))
  const icons = await Promise.all((bank.appIcons || []).map((n) => import(`/node_modules/lucide-static/dist/esm/icons/${n}.mjs`).then((m) => m.default)))
  const events = []
  window.blockEvents = events
  const state = (bank.states && bank.states[q.get('estado')]) || {}
  const views = Object.fromEntries(nums.map((n) => [n, reactive({})]))
  window.blockViews = views
  const id = (x) => (x && typeof x === 'object' ? x.id ?? x.value ?? null : x)
  const one = (n, extra = {}, key) => {
    const C = Blocks[`Gb${section}${n}`]
    const view = views[n]
    return h(C, {
      ...bank.props,
      ...state,
      ...view,
      ...extra,
      key,
      id: key ? `gb-${n}-${key}` : `gb-${n}`,
      'onUpdate:selection': (x) => { view.selection = x; events.push(['update:selection', n, x]) },
      'onUpdate:quantity': (x) => { view.quantity = x; events.push(['update:quantity', n, x]) },
      'onUpdate:open': (x) => { view.open = x; events.push(['update:open', n, x]) },
      'onUpdate:step': (x) => { view.step = x; events.push(['update:step', n, x]) },
      'onUpdate:values': (x) => { view.values = x },
      'onUpdate:filters': (x) => { view.filters = x; events.push(['update:filters', n, x]) },
      'onUpdate:sort': (x) => { view.sort = x; events.push(['update:sort', n, x]) },
      'onUpdate:page': (x) => { view.page = x; events.push(['update:page', n, x]) },
      onRetry: () => events.push(['retry', n]),
      onNavigate: (p) => { p.event.preventDefault(); events.push(['navigate', n, p.href]) },
      onActivate: (p) => events.push(['activate', n, id(p.item)]),
      onOpen: (p) => events.push(['open', n, id(p.product || p.order)]),
      onAdd: (p) => events.push(['add', n, id(p.product), p.quantity]),
      onSelect: (p) => events.push(['select', n, p.key, p.value]),
      onChange: (p) => events.push(['change', n, id(p.line), p.quantity]),
      onRemove: (p) => events.push(['remove', n, id(p.line)]),
      onRestore: (p) => events.push(['restore', n, id(p.line)]),
      onSubmit: (p) => { if (p.preventDefault) p.preventDefault(); events.push(['submit', n, p.step]) }
    }, bank.slots)
  }
  const variant = (n) => {
    const block = bank.each
      ? h(GAdaptiveLayout, { role: 'list' }, () => bank.each.items.filter((it) => !it.only || it.only.includes(n)).map((it, i) => h('div', { role: 'listitem', class: (bank.each.hints && bank.each.hints[n]) || 'g-adapt-standard', key: i }, [one(n, { [bank.each.prop]: it.value }, String(i))])))
      : one(n)
    const label = h('p', { class: 'pg-label' }, `Gb${section}${n}${concepts[n] ? ` · ${concepts[n]}` : ''}`)
    return h(GContainer, { as: 'div', class: 'pg-stage' }, () => [label, q.has('anidado') ? h(GSection, { title: 'Sección de la aplicación' }, () => block) : block])
  }
  const app = createApp({ render: () => h('main', { id: 'main' }, nums.map(variant)) })
  app.use(Grana).use(ecommerce).use(createIcons(icons))
  app.config.warnHandler = (msg) => console.warn(`[Vue warn] ${msg}`)
  app.mount('#app')
  document.documentElement.dataset.ready = '1'
}
