import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createSSRApp, h, nextTick, reactive } from 'vue'
import { renderToString } from 'vue/server-renderer'
import GBreadcrumbs from './GBreadcrumbs.vue'
import { resetEngine } from '../../utils/visualTipTestEnv.js'

// jsdom no implementa popover: se simula con un atributo (y :popover-open en matches)
beforeEach(() => {
  HTMLElement.prototype.showPopover = function () { this.setAttribute('data-popover-open', '') }
  HTMLElement.prototype.hidePopover = function () { this.removeAttribute('data-popover-open') }
  const orig = HTMLElement.prototype.matches
  vi.spyOn(HTMLElement.prototype, 'matches').mockImplementation(function (sel) { return sel === ':popover-open' ? this.hasAttribute('data-popover-open') : orig.call(this, sel) })
  resetEngine()
})
// jsdom no navega: se evita después de que el componente decida
const noNav = (e) => { if (e.target.closest?.('a[href]')) e.preventDefault() }
beforeEach(() => window.addEventListener('click', noNav))
afterEach(() => { window.removeEventListener('click', noNav); vi.restoreAllMocks(); document.body.innerHTML = '' })

const LABELS = { nav: 'Ruta de navegación', up: 'Subir a {label}', path: 'Ruta hasta {label}', children: 'Otras páginas en {label}' }
const ITEMS = () => [
  { label: 'Inicio', href: '/', icon: 'house' },
  { label: 'Laboratorio central', href: '/lab' },
  { label: 'Muestras', href: '/lab/muestras' },
  { label: '2026', children: [{ label: 'Lote 2026-0411', href: '/lab/lotes/0411' }, { label: 'Lote 2026-0412', href: '/lab/lotes/0412' }, { label: 'Sin página' }] },
  { label: 'Lote 2026-0412', href: '/lab/lotes/0412' },
  { label: 'Muestra M-0007', href: '/lab/muestras/m-0007' }
]
const wait = (ms = 40) => new Promise((r) => setTimeout(r, ms))
const settle = async () => { await nextTick(); await wait(); await nextTick() }
const mk = async (props = {}, opts = {}) => {
  const w = mount(GBreadcrumbs, { props: { items: ITEMS(), labels: LABELS, ...props }, attachTo: document.body, ...opts })
  await settle()
  return w
}
// Fuerza la etapa: la lista de medida mide `list` de ancho y cada li `li` (función de la etapa que se prueba)
function widths(list, li) {
  const orig = Element.prototype.getBoundingClientRect
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
    const r = orig.call(this)
    if (this.classList?.contains('g-breadcrumbs__measure')) return { ...r, width: list, left: 0, right: list }
    if (this.parentElement?.classList?.contains('g-breadcrumbs__measure')) { const w = typeof li === 'function' ? li(this.parentElement.dataset.stage, this) : li; return { ...r, width: w, left: 0, right: w } }
    return r
  })
}
const step = () => widths(100, 200)
const rowLinks = (w) => w.findAll('.g-breadcrumbs__list > .g-breadcrumbs__item > .g-breadcrumbs__link')
const ctrlClick = (el, init) => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init }))

describe('GBreadcrumbs · anatomía (APG Breadcrumb)', () => {
  it('nav con nombre, ol de li (uno por nivel), separadores svg aria-hidden dentro del li y aria-current solo en el último', async () => {
    const w = await mk()
    const nav = w.find('nav.g-breadcrumbs')
    expect(nav.attributes('aria-label')).toBe('Ruta de navegación')
    expect(nav.attributes('data-stage')).toBe('liquid')
    const lis = w.findAll('.g-breadcrumbs__list > li')
    expect(lis).toHaveLength(6)
    expect(lis.map((l) => l.classes().filter((c) => c.startsWith('is-')).join(' '))).toEqual(['is-root', 'is-mid', 'is-mid', 'is-mid', 'is-parent', 'is-current'])
    const seps = w.findAll('.g-breadcrumbs__list .g-breadcrumbs__sep')
    expect(seps).toHaveLength(4) // 5 separadores, uno es puerta
    for (const s of seps) {
      expect(s.element.tagName.toLowerCase()).toBe('svg')
      expect(s.attributes('aria-hidden')).toBe('true')
      expect(s.classes()).toContain('g-icon--flip-rtl')
      expect(s.element.parentElement.tagName).toBe('LI')
    }
    const cur = w.findAll('[aria-current="page"]')
    expect(cur).toHaveLength(1)
    expect(cur[0].element.closest('li').classList.contains('is-current')).toBe(true)
    expect(cur[0].attributes('href')).toBe('/lab/muestras/m-0007')
    // Nivel sin página: span, sin foco ni href
    const t = lis[3].find(':scope > .g-breadcrumbs__link')
    expect(t.element.tagName).toBe('SPAN')
    expect(t.classes()).toContain('g-breadcrumbs__link--text')
    expect(t.attributes('href')).toBeUndefined()
    // dir=auto en cada nombre; sin title
    for (const l of w.findAll('.g-breadcrumbs__list .g-breadcrumbs__label')) expect(l.attributes('dir')).toBe('auto')
    expect(w.find('[title]').exists()).toBe(false)
    // Icono por nombre en su hueco aria-hidden; el texto de la página no tiene glifos
    expect(lis[0].find('.g-breadcrumbs__icon').attributes('aria-hidden')).toBe('true')
    expect(w.find('.g-breadcrumbs__list').text()).not.toMatch(/[›‹»/]/)
    w.unmount()
  })

  it('lista de medida inerte, aria-hidden y sin ids; pistas al final del nav, fuera del ol', async () => {
    const w = await mk()
    const m = w.find('.g-breadcrumbs__measure')
    expect(m.attributes('aria-hidden')).toBe('true')
    expect(m.element.hasAttribute('inert')).toBe(true)
    expect(m.find('[id]').exists()).toBe(false)
    expect(m.find('[aria-controls]').exists()).toBe(false)
    const kids = [...w.element.children]
    const tips = kids.filter((k) => k.classList.contains('g-tooltip'))
    expect(tips).toHaveLength(6 + 1) // seis niveles y una puerta
    expect(kids.indexOf(tips[0])).toBeGreaterThan(kids.indexOf(m.element))
    for (const t of tips) { expect(t.getAttribute('aria-hidden')).toBe('true'); expect(t.getAttribute('role')).toBeNull(); expect(t.id).toBe('') }
    expect(w.find('ol .g-tooltip').exists()).toBe(false)
    w.unmount()
  })

  it('atributos a la raíz nav; aria-labelledby sustituye a labels.nav', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = await mk({ labels: { up: LABELS.up, path: LABELS.path, children: LABELS.children }, id: 'migas', class: 'mia', 'data-x': '1', 'aria-labelledby': 'h1' })
    const nav = w.find('nav')
    expect(nav.attributes('id')).toBe('migas')
    expect(nav.classes()).toEqual(expect.arrayContaining(['g-breadcrumbs', 'mia']))
    expect(nav.attributes('data-x')).toBe('1')
    expect(nav.attributes('aria-labelledby')).toBe('h1')
    expect(nav.attributes('aria-label')).toBeUndefined()
    expect(warn.mock.calls.flat().join(' ')).not.toMatch(/labels\.nav/)
    w.unmount()
  })

  it('un solo nivel: solo is-current, sin separador; dos niveles: la raíz es is-root e is-parent', async () => {
    const w = await mk({ items: [{ label: 'Inicio', href: '/' }] })
    expect(w.findAll('.g-breadcrumbs__list > li')).toHaveLength(1)
    expect(w.find('.g-breadcrumbs__list li').classes()).toEqual(['g-breadcrumbs__item', 'is-current'])
    expect(w.find('.g-breadcrumbs__list .g-breadcrumbs__sep').exists()).toBe(false)
    await w.setProps({ items: [{ label: 'Inicio', href: '/' }, { label: 'Lab', href: '/lab' }] })
    await settle()
    expect(w.find('.g-breadcrumbs__list li').classes()).toEqual(expect.arrayContaining(['is-root', 'is-parent']))
    w.unmount()
  })
})

describe('GBreadcrumbs · avisos de desarrollo', () => {
  const run = async (props) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    warn.mockClear()
    const w = await mk(props)
    const msgs = warn.mock.calls.map((c) => String(c[0])).filter((m) => m.startsWith('[Grana GBreadcrumbs]'))
    w.unmount()
    return msgs
  }
  it('1 · falta labels.nav', async () => { expect((await run({ labels: { ...LABELS, nav: undefined } })).join('\n')).toMatch(/labels\.nav/) })
  it('2 · items vacío o no arreglo: no se pinta nada', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = await mk({ items: [] })
    expect(w.find('nav').exists()).toBe(false)
    expect(warn.mock.calls.map((c) => String(c[0])).join('\n')).toMatch(/items está vacío/)
    w.unmount()
  })
  it('3 · un nivel sin label se ignora', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = await mk({ items: [{ label: 'Inicio', href: '/' }, { href: '/x' }, { label: '', href: '/y' }, { label: 'Lab', href: '/lab' }] })
    expect(w.findAll('.g-breadcrumbs__list > li')).toHaveLength(2)
    expect(warn.mock.calls.map((c) => String(c[0])).filter((m) => /sin label/.test(m))).toHaveLength(1)
    w.unmount()
  })
  it('4 · con dos o más niveles faltan up o path', async () => { expect((await run({ labels: { nav: 'N', children: LABELS.children } })).join('\n')).toMatch(/labels\.up y labels\.path/) })
  it('5 · hay puertas y falta labels.children', async () => { expect((await run({ labels: { nav: 'N', up: LABELS.up, path: LABELS.path } })).join('\n')).toMatch(/falta labels\.children/) })
  it('6 · up/path sin {label}; children sin {label} con más de una puerta', async () => {
    expect((await run({ labels: { ...LABELS, up: 'Subir' } })).join('\n')).toMatch(/deben contener \{label\}/)
    const items = ITEMS()
    items[0].children = [{ label: 'Otro', href: '/o' }]
    expect((await run({ items, labels: { ...LABELS, children: 'Hermanos' } })).join('\n')).toMatch(/todas se llamarían igual/)
    expect((await run({ labels: { ...LABELS, children: 'Hermanos' } })).join('\n')).not.toMatch(/todas se llamarían igual/)
  })
  it('7 · children en el último nivel no se pinta', async () => {
    const items = ITEMS()
    items[5].children = [{ label: 'X', href: '/x' }]
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = await mk({ items })
    expect(warn.mock.calls.map((c) => String(c[0])).join('\n')).toMatch(/último nivel/)
    expect(w.findAll('.g-breadcrumbs__list .g-breadcrumbs__door')).toHaveLength(1)
    w.unmount()
  })
  it('8 · un hijo sin label se ignora', async () => {
    const items = ITEMS()
    items[3].children.push({ href: '/sin' })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = await mk({ items })
    expect(warn.mock.calls.map((c) => String(c[0])).join('\n')).toMatch(/hijo de children sin label/)
    expect(w.findAll('.g-breadcrumbs__panel > li')).toHaveLength(3)
    w.unmount()
  })
  it('9 · el elemento del slot link no recibió attrs', async () => {
    const msgs = await run({}, {})
    expect(msgs.join('\n')).not.toMatch(/slot link/)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(GBreadcrumbs, { props: { items: ITEMS(), labels: LABELS }, slots: { link: ({ item }) => h('a', { href: item.href }, item.label) }, attachTo: document.body })
    await settle()
    expect(warn.mock.calls.map((c) => String(c[0])).join('\n')).toMatch(/slot link no recibió attrs/)
    w.unmount()
  })
  it('una vez por instancia y motivo, sin el texto de la aplicación', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = await mk({ labels: {} })
    await w.setProps({ items: ITEMS().slice(0, 3) })
    await settle()
    const msgs = warn.mock.calls.map((c) => String(c[0])).filter((m) => m.startsWith('[Grana GBreadcrumbs]'))
    expect(new Set(msgs).size).toBe(msgs.length)
    expect(msgs.join('\n')).not.toMatch(/Laboratorio|Muestra/)
    w.unmount()
  })
  it('sin avisos con un uso correcto', async () => { expect(await run({})).toEqual([]) })
})

describe('GBreadcrumbs · labels', () => {
  it('cadena con {label} y función ({ label }) => String', async () => {
    step()
    const w = await mk({ labels: { nav: () => 'Migas', up: ({ label }) => `Arriba: ${label}`, path: 'Hasta {label}', children: ({ label }) => `Hermanos de ${label}` } })
    expect(w.find('nav').attributes('aria-label')).toBe('Migas')
    expect(w.find('.g-breadcrumbs__up').attributes('aria-label')).toBe('Arriba: Lote 2026-0412')
    expect(w.find('.g-breadcrumbs__toggle').attributes('aria-label')).toBe('Hasta Muestra M-0007')
    w.unmount()
  })
})

describe('GBreadcrumbs · navigate (#494, #505)', () => {
  it('clic primario en la fila: { item, index, event, from: "path" } cancelable', async () => {
    const w = await mk()
    const link = rowLinks(w)[2]
    const ev = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })
    link.element.dispatchEvent(ev)
    const p = w.emitted('navigate')[0][0]
    expect(p.item).toBe(w.props('items')[2])
    expect(p.index).toBe(2)
    expect(p.from).toBe('path')
    expect(p.event).toBe(ev)
    expect(p.event.cancelable).toBe(true)
    w.unmount()
  })
  it('index es la posición en items aunque se ignore un nivel', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = await mk({ items: [{ label: 'Inicio', href: '/' }, { href: '/x' }, { label: 'Lab', href: '/lab' }] })
    rowLinks(w)[1].element.click()
    expect(w.emitted('navigate')[0][0].index).toBe(2)
    w.unmount()
  })
  it('no emite con Ctrl, ⌘, Mayús, Alt ni botón central; un nivel sin href no emite', async () => {
    const w = await mk()
    const a = rowLinks(w)[1].element
    for (const init of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) ctrlClick(a, init)
    rowLinks(w)[3].element.click()
    expect(w.emitted('navigate')).toBeUndefined()
    w.unmount()
  })
  it('un clic ya cancelado por otro no emite (sin slot)', async () => {
    const w = await mk()
    const a = rowLinks(w)[1].element
    a.addEventListener('click', (e) => e.preventDefault(), { capture: true })
    a.click()
    expect(w.emitted('navigate')).toBeUndefined()
    w.unmount()
  })
  it('desde una puerta: from "door", el hijo como item, index del nivel delante del cual está; cierra y devuelve el foco antes de emitir', async () => {
    const w = await mk()
    const door = w.find('.g-breadcrumbs__door')
    await door.trigger('click')
    expect(door.attributes('aria-expanded')).toBe('true')
    const panel = w.find('.g-breadcrumbs__panel')
    expect(panel.element.hasAttribute('data-popover-open')).toBe(true)
    let focusAtEmit = null
    const a = panel.findAll('a.g-breadcrumbs__link')[0]
    const spy = vi.fn(() => { focusAtEmit = document.activeElement })
    await w.setProps({ onNavigate: spy })
    a.element.click()
    expect(spy).toHaveBeenCalledTimes(1)
    const p = spy.mock.calls[0][0]
    expect(p.from).toBe('door')
    expect(p.item).toBe(w.props('items')[3].children[0])
    expect(p.index).toBe(4)
    expect(focusAtEmit).toBe(door.element)
    expect(panel.element.hasAttribute('data-popover-open')).toBe(false)
    w.unmount()
  })
  it('en la última etapa: «Subir» emite from "up" y la escalera from "stairs"', async () => {
    step()
    const w = await mk()
    expect(w.find('nav').attributes('data-stage')).toBe('step')
    w.find('.g-breadcrumbs__up').element.click()
    expect(w.emitted('navigate')[0][0]).toMatchObject({ from: 'up', index: 4 })
    await w.find('.g-breadcrumbs__toggle').trigger('click')
    w.findAll('.g-breadcrumbs__stairs a.g-breadcrumbs__link')[1].element.click()
    expect(w.emitted('navigate')[1][0]).toMatchObject({ from: 'stairs', index: 1 })
    expect(document.activeElement).toBe(w.find('.g-breadcrumbs__toggle').element)
    expect(w.find('.g-breadcrumbs__toggle').attributes('aria-expanded')).toBe('false')
    w.unmount()
  })
})

describe('GBreadcrumbs · slots', () => {
  // RouterLink simulado: navega en su propio onClick (cancela el nativo) y aplica attrs por herencia
  const RouterLink = { props: ['to'], setup(p, { slots }) { return () => h('a', { href: p.to, onClick: (e) => { e.preventDefault(); RouterLink.pushed.push(p.to) } }, slots.default && slots.default()) } }
  beforeEach(() => { RouterLink.pushed = [] })
  it('link: attrs y content; RouterLink navega y navigate llega con defaultPrevented verdadero', async () => {
    const scopes = []
    const w = mount(GBreadcrumbs, {
      props: { items: ITEMS(), labels: LABELS },
      slots: { link: (s) => { scopes.push(s); return h(RouterLink, { to: s.item.href, ...s.attrs }, () => h(s.content)) } },
      attachTo: document.body
    })
    await settle()
    const s = scopes.find((x) => x.index === 5)
    expect(s.from).toBe('path')
    expect(s.current).toBe(true)
    expect(s.attrs).toMatchObject({ href: '/lab/muestras/m-0007', class: 'g-breadcrumbs__link', 'aria-current': 'page' })
    expect(typeof s.attrs.onClick).toBe('function')
    const a = w.findAll('.g-breadcrumbs__list > li')[1].find(':scope > a.g-breadcrumbs__link')
    expect(a.find('.g-breadcrumbs__label').text()).toBe('Laboratorio central')
    expect(a.find('.g-breadcrumbs__label').attributes('dir')).toBe('auto')
    a.element.click()
    expect(RouterLink.pushed).toEqual(['/lab'])
    const p = w.emitted('navigate')[0][0]
    expect(p.event.defaultPrevented).toBe(true)
    expect(p.from).toBe('path')
    // El contenido se actualiza con el modelo
    const items = ITEMS()
    items[1] = { ...items[1], label: 'Laboratorio norte' }
    await w.setProps({ items })
    await settle()
    expect(w.findAll('.g-breadcrumbs__list > li')[1].find('.g-breadcrumbs__label').text()).toBe('Laboratorio norte')
    // La lista de medida no ve el slot: pinta el <a> por defecto
    expect(w.find('.g-breadcrumbs__measure a.g-breadcrumbs__link').exists()).toBe(true)
    w.unmount()
  })
  it('link en «Subir» (con aria-label) y en una puerta (con aria-current="true" y check)', async () => {
    step()
    const scopes = []
    const w = mount(GBreadcrumbs, { props: { items: ITEMS(), labels: LABELS }, slots: { link: (s) => { scopes.push(s); return h('a', s.attrs, [h(s.content)]) } }, attachTo: document.body })
    await settle()
    const up = scopes.filter((x) => x.from === 'up').pop()
    expect(up.attrs).toMatchObject({ class: 'g-breadcrumbs__up', 'aria-label': 'Subir a Lote 2026-0412', href: '/lab/lotes/0412' })
    expect(w.find('.g-breadcrumbs__up svg.g-icon').exists()).toBe(true)
    w.unmount()
    vi.restoreAllMocks()
    HTMLElement.prototype.showPopover = function () { this.setAttribute('data-popover-open', '') }
    const s2 = []
    const w2 = mount(GBreadcrumbs, { props: { items: ITEMS(), labels: LABELS }, slots: { link: (s) => { s2.push(s); return h('a', s.attrs, [h(s.content)]) } }, attachTo: document.body })
    await settle()
    const d = s2.filter((x) => x.from === 'door' && x.attrs['aria-current'] === 'true').pop()
    expect(d.item.label).toBe('Lote 2026-0412')
    expect(w2.find('.g-breadcrumbs__panel [aria-current="true"] .g-breadcrumbs__here').exists()).toBe(true)
    w2.unmount()
  })
  it('icon: el slot sustituye al GIcon por nombre (#202); sin icon no hay hueco', async () => {
    const w = await mk()
    expect(w.findAll('.g-breadcrumbs__list .g-breadcrumbs__icon')).toHaveLength(1)
    w.unmount()
    const w2 = mount(GBreadcrumbs, { props: { items: ITEMS(), labels: LABELS }, slots: { icon: ({ item, index }) => h('i', { class: 'mio', 'data-i': index }, item.label) }, attachTo: document.body })
    await settle()
    const holes = w2.findAll('.g-breadcrumbs__list .g-breadcrumbs__icon')
    expect(holes).toHaveLength(1)
    expect(holes[0].find('i.mio').attributes('data-i')).toBe('0')
    expect(holes[0].find('svg').exists()).toBe(false)
    expect(holes[0].attributes('aria-hidden')).toBe('true')
    // La lista de medida no pinta el slot (solo el hueco)
    expect(w2.find('.g-breadcrumbs__measure i.mio').exists()).toBe(false)
    expect(w2.find('.g-breadcrumbs__measure .g-breadcrumbs__icon').exists()).toBe(true)
    w2.unmount()
  })
})

describe('GBreadcrumbs · puertas (C)', () => {
  it('solo con children (delante del nivel siguiente), aria-expanded/aria-controls, nombre con {label}', async () => {
    const w = await mk()
    const doors = w.findAll('.g-breadcrumbs__list .g-breadcrumbs__door')
    expect(doors).toHaveLength(1)
    const d = doors[0]
    expect(d.element.closest('li')).toBe(w.findAll('.g-breadcrumbs__list > li')[4].element)
    expect(d.attributes('type')).toBe('button')
    expect(d.attributes('aria-expanded')).toBe('false')
    expect(d.attributes('aria-label')).toBe('Otras páginas en 2026')
    const panel = w.find(`#${d.attributes('aria-controls')}`)
    expect(panel.classes()).toContain('g-breadcrumbs__panel')
    expect(panel.attributes('popover')).toBe('manual')
    expect(panel.element.previousElementSibling).toBe(d.element)
    expect(d.find('svg').classes()).toContain('g-icon--flip-rtl')
    w.unmount()
  })
  it('el hijo de la ruta lleva aria-current="true" y check: por href y, sin href, por label; nunca page', async () => {
    const w = await mk()
    const links = w.findAll('.g-breadcrumbs__panel > li > .g-breadcrumbs__link')
    expect(links.map((l) => l.attributes('aria-current') || '')).toEqual(['', 'true', ''])
    expect(links[1].find('.g-breadcrumbs__here').exists()).toBe(true)
    expect(links[2].element.tagName).toBe('SPAN')
    expect(w.find('.g-breadcrumbs__panel [aria-current="page"]').exists()).toBe(false)
    w.unmount()
    const items = [{ label: 'A', href: '/a', children: [{ label: 'B' }, { label: 'C', href: '/c' }] }, { label: 'B' }]
    const w2 = await mk({ items })
    expect(w2.findAll('.g-breadcrumbs__panel > li > .g-breadcrumbs__link').map((l) => l.attributes('aria-current') || '')).toEqual(['true', ''])
    w2.unmount()
  })
  it('teclado: ↓ abre y enfoca el de la ruta; ↓/↑ circulares, Inicio/Fin; Esc cierra y devuelve el foco', async () => {
    const w = await mk()
    const d = w.find('.g-breadcrumbs__door')
    d.element.focus()
    await d.trigger('keydown', { key: 'ArrowDown' })
    expect(d.attributes('aria-expanded')).toBe('true')
    const links = w.findAll('.g-breadcrumbs__panel a.g-breadcrumbs__link').map((x) => x.element)
    expect(document.activeElement).toBe(links[1])
    const panel = w.find('.g-breadcrumbs__panel')
    await panel.trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(links[0])
    await panel.trigger('keydown', { key: 'ArrowUp' })
    expect(document.activeElement).toBe(links[1])
    await panel.trigger('keydown', { key: 'Home' })
    expect(document.activeElement).toBe(links[0])
    await panel.trigger('keydown', { key: 'End' })
    expect(document.activeElement).toBe(links[1])
    const esc = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    document.activeElement.dispatchEvent(esc)
    await nextTick()
    expect(esc.defaultPrevented).toBe(true)
    expect(d.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(d.element)
    w.unmount()
  })
  it('clic abre sin mover el foco; otro clic cierra; pulsar fuera cierra; uno abierto a la vez', async () => {
    const items = ITEMS()
    items[0].children = [{ label: 'Otro', href: '/o' }]
    const w = await mk({ items })
    const [d1, d2] = w.findAll('.g-breadcrumbs__list .g-breadcrumbs__door')
    document.body.focus()
    await d1.trigger('click')
    expect(d1.attributes('aria-expanded')).toBe('true')
    expect(w.find('.g-breadcrumbs__panel a').element).not.toBe(document.activeElement)
    await d2.trigger('click')
    expect(d1.attributes('aria-expanded')).toBe('false')
    expect(d2.attributes('aria-expanded')).toBe('true')
    await d2.trigger('click')
    expect(d2.attributes('aria-expanded')).toBe('false')
    await d1.trigger('click')
    document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    await nextTick()
    expect(d1.attributes('aria-expanded')).toBe('false')
    w.unmount()
  })
  it('el foco que sale del disparador y del panel cierra', async () => {
    const w = await mk()
    const d = w.find('.g-breadcrumbs__door')
    await d.trigger('click')
    const out = rowLinks(w)[0].element
    d.element.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: out }))
    await nextTick()
    expect(d.attributes('aria-expanded')).toBe('false')
    w.unmount()
  })
  it('el panel recibe --_x, --_y, --_max en px y data-side', async () => {
    const w = await mk()
    await w.find('.g-breadcrumbs__door').trigger('click')
    const p = w.find('.g-breadcrumbs__panel').element
    for (const v of ['--_x', '--_y', '--_max']) expect(p.style.getPropertyValue(v)).toMatch(/^-?\d+(\.\d+)?px$/)
    expect(['top', 'bottom']).toContain(p.getAttribute('data-side'))
    w.unmount()
  })
})

describe('GBreadcrumbs · cara de B (última etapa)', () => {
  it('«Subir» al antepasado más cercano con página; divulgación con la página; escalera con --_depth', async () => {
    step()
    const w = await mk()
    expect(w.find('.g-breadcrumbs__list').exists()).toBe(false)
    const up = w.find('.g-breadcrumbs__face > a.g-breadcrumbs__up')
    expect(up.attributes('href')).toBe('/lab/lotes/0412')
    expect(up.find('.g-breadcrumbs__label').text()).toBe('Lote 2026-0412')
    const t = w.find('.g-breadcrumbs__face > button.g-breadcrumbs__toggle')
    expect(t.attributes('aria-label')).toBe('Ruta hasta Muestra M-0007')
    expect(t.find('.g-breadcrumbs__label').text()).toBe('Muestra M-0007')
    expect(t.find('svg.g-breadcrumbs__chevron').exists()).toBe(true)
    const stairs = w.find(`#${t.attributes('aria-controls')}`)
    expect(stairs.classes()).toContain('g-breadcrumbs__stairs')
    expect(stairs.element.previousElementSibling).toBe(w.find('.g-breadcrumbs__face').element)
    const lis = stairs.findAll('li.g-breadcrumbs__stair')
    expect(lis.map((l) => l.element.style.getPropertyValue('--_depth'))).toEqual(['0', '1', '2', '3', '4', '5'])
    expect(lis[5].classes()).toContain('is-current')
    expect(lis[5].find('[aria-current="page"]').exists()).toBe(true)
    expect(stairs.findAll('[aria-current="page"]')).toHaveLength(1)
    expect(stairs.find('.g-breadcrumbs__door').exists()).toBe(false)
    expect(lis[3].find('.g-breadcrumbs__link--text').exists()).toBe(true)
    // Pistas: «Subir» y la divulgación
    expect(w.findAll('nav > .g-tooltip').map((n) => n.text())).toEqual(['Lote 2026-0412', 'Muestra M-0007'])
    w.unmount()
  })
  it('salta al antepasado con página; sin ninguno no hay «Subir»', async () => {
    step()
    const w = await mk({ items: [{ label: 'Inicio', href: '/' }, { label: 'Sin página' }, { label: 'Aquí', href: '/x' }] })
    expect(w.find('.g-breadcrumbs__up').attributes('href')).toBe('/')
    await w.setProps({ items: [{ label: 'A' }, { label: 'B' }, { label: 'C', href: '/c' }] })
    await settle()
    expect(w.find('.g-breadcrumbs__up').exists()).toBe(false)
    expect(w.find('.g-breadcrumbs__toggle').exists()).toBe(true)
    w.unmount()
  })
  it('↓ en la divulgación abre y enfoca el primer escalón con enlace; Esc vuelve', async () => {
    step()
    const w = await mk({ items: [{ label: 'Sin página' }, { label: 'Lab', href: '/lab' }, { label: 'Aquí', href: '/x' }] })
    const t = w.find('.g-breadcrumbs__toggle')
    t.element.focus()
    await t.trigger('keydown', { key: 'ArrowDown' })
    expect(t.attributes('aria-expanded')).toBe('true')
    expect(document.activeElement.getAttribute('href')).toBe('/lab')
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    await nextTick()
    expect(document.activeElement).toBe(t.element)
    w.unmount()
  })
  it('un solo nivel nunca pasa a step', async () => {
    step()
    const w = await mk({ items: [{ label: 'Inicio', href: '/', icon: 'house' }] })
    expect(w.find('nav').attributes('data-stage')).toBe('shrink')
    w.unmount()
  })
})

describe('GBreadcrumbs · etapas', () => {
  it('root-icon solo si la raíz tiene icono: is-icon en la raíz (y en shrink); el foco se conserva por nivel al pasar a step y volver', async () => {
    let list = 100
    const orig = Element.prototype.getBoundingClientRect
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
      const r = orig.call(this)
      if (this.classList?.contains('g-breadcrumbs__measure')) return { ...r, width: list }
      if (this.parentElement?.classList?.contains('g-breadcrumbs__measure')) {
        const st = this.parentElement.dataset.stage
        return { ...r, width: st === 'liquid' ? 30 : st === 'root-icon' ? 15 : 10 }
      }
      return r
    })
    list = 100 // 6 × 30 = 180 > 100; 6 × 15 = 90 ≤ 100 → root-icon
    const w = await mk()
    expect(w.find('nav').attributes('data-stage')).toBe('root-icon')
    expect(w.find('.g-breadcrumbs__list > li').classes()).toContain('is-icon')
    // El foco en «Lote» (nivel 4) pasa a «Subir» en step y vuelve al nivel 4 en la fila
    rowLinks(w)[4].element.focus()
    list = 30
    w.vm.$forceUpdate()
    await w.setProps({ items: ITEMS().map((x) => ({ ...x })) })
    await settle()
    expect(w.find('nav').attributes('data-stage')).toBe('step')
    expect(document.activeElement).toBe(w.find('.g-breadcrumbs__up').element)
    list = 1000
    await w.setProps({ items: ITEMS().map((x) => ({ ...x })) })
    await settle()
    expect(w.find('nav').attributes('data-stage')).toBe('liquid')
    expect(document.activeElement).toBe(rowLinks(w)[4].element)
    // Desde la divulgación vuelve al actual
    list = 30
    await w.setProps({ items: ITEMS().map((x) => ({ ...x })) })
    await settle()
    w.find('.g-breadcrumbs__toggle').element.focus()
    list = 1000
    await w.setProps({ items: ITEMS().map((x) => ({ ...x })) })
    await settle()
    expect(document.activeElement).toBe(rowLinks(w)[5].element)
    w.unmount()
  })
  it('is-ready un cuadro después de la primera etapa', async () => {
    const w = mount(GBreadcrumbs, { props: { items: ITEMS(), labels: LABELS }, attachTo: document.body })
    expect(w.find('nav').classes()).not.toContain('is-ready')
    await settle()
    expect(w.find('nav').classes()).toContain('is-ready')
    w.unmount()
  })
  it('data-clipped en el li cuyo nombre está recortado', async () => {
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function () { return this.textContent === 'Laboratorio central' ? 120 : 10 })
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function () { return 10 })
    const w = await mk()
    const lis = w.findAll('.g-breadcrumbs__list > li')
    expect(lis.map((l) => l.attributes('data-clipped') !== undefined)).toEqual([false, true, false, false, false, false])
    w.unmount()
  })
})

describe('GBreadcrumbs · subir y bajar (L13)', () => {
  const base = () => [{ label: 'Inicio', href: '/' }, { label: 'Lab', href: '/lab' }, { label: 'Muestras', href: '/m' }]
  it('nada al montar; bajar un nivel: is-entering en el nuevo último, que ya es la página actual', async () => {
    const w = await mk({ items: base() })
    expect(w.find('.is-entering').exists()).toBe(false)
    await w.setProps({ items: [...base(), { label: '2026', href: '/2026' }] })
    await nextTick()
    const last = w.findAll('.g-breadcrumbs__list > li').pop()
    expect(last.classes()).toContain('is-entering')
    expect(last.find('[aria-current="page"]').exists()).toBe(true)
    expect(w.findAll('[aria-current="page"]')).toHaveLength(1)
    w.unmount()
  })
  it('subir un nivel: copia saliente al final, inerte, aria-hidden, sin ids, sin aria-current; se retira al acabar', async () => {
    const items = base()
    items[1].children = [{ label: 'Otra', href: '/otra' }]
    const w = await mk({ items: [...items, { label: '2026', href: '/2026' }] })
    await w.setProps({ items: items.map((x) => ({ ...x })) })
    await nextTick()
    const copy = w.find('.g-breadcrumbs__list > li.is-leaving')
    expect(copy.exists()).toBe(true)
    expect(copy.element).toBe(w.find('.g-breadcrumbs__list').element.lastElementChild)
    expect(copy.attributes('aria-hidden')).toBe('true')
    expect(copy.element.hasAttribute('inert')).toBe(true)
    expect(copy.classes()).toContain('is-current')
    expect(copy.find('[id]').exists()).toBe(false)
    expect(copy.find('[aria-controls]').exists()).toBe(false)
    expect(copy.find('[aria-current]').exists()).toBe(false)
    expect(w.findAll('[aria-current="page"]')).toHaveLength(1)
    expect(w.find('.g-breadcrumbs__measure').findAll('li')).toHaveLength(3)
    const ev = new Event('animationend', { bubbles: true })
    ev.animationName = 'g-breadcrumbs-leave'
    copy.element.dispatchEvent(ev)
    await nextTick()
    expect(w.find('.is-leaving').exists()).toBe(false)
    w.unmount()
  })
  it('cualquier otro cambio, sin clase; con movimiento reducido no hay copia saliente', async () => {
    const w = await mk({ items: base() })
    await w.setProps({ items: [{ label: 'Inicio', href: '/' }, { label: 'Otra', href: '/o' }, { label: 'X', href: '/x' }, { label: 'Y', href: '/y' }] })
    await nextTick()
    expect(w.find('.is-entering, .is-leaving').exists()).toBe(false)
    const mm = window.matchMedia
    window.matchMedia = (q) => ({ matches: /reduce/.test(q), media: q, addEventListener() {}, removeEventListener() {} })
    await w.setProps({ items: base() })
    await settle()
    await w.setProps({ items: base().slice(0, 2) })
    await nextTick()
    expect(w.find('.is-leaving').exists()).toBe(false)
    window.matchMedia = mm
    w.unmount()
  })
  it('en step no anima', async () => {
    step()
    const w = await mk({ items: base() })
    await w.setProps({ items: [...base(), { label: 'Z', href: '/z' }] })
    await settle()
    expect(w.find('.is-entering').exists()).toBe(false)
    w.unmount()
  })
})

describe('GBreadcrumbs · pistas (modo visual)', () => {
  it('un nodo por nivel y por puerta con el nombre; disabled mientras el nombre cabe', async () => {
    const w = await mk()
    const texts = w.findAll('nav > .g-tooltip .g-tooltip__text').map((n) => n.text())
    expect(texts).toEqual(['Inicio', 'Laboratorio central', 'Muestras', '2026', 'Otras páginas en 2026', 'Lote 2026-0412', 'Muestra M-0007'])
    for (const n of w.findAll('nav > .g-tooltip .g-tooltip__text')) expect(n.attributes('dir')).toBe('auto')
    w.unmount()
  })
})

describe('GBreadcrumbs · SSR y desmontaje', () => {
  it('renderToString sin globals: etapa liquid, sin lista de medida, paneles cerrados', async () => {
    const app = createSSRApp({ render: () => h(GBreadcrumbs, { items: ITEMS(), labels: LABELS }) })
    const html = await renderToString(app)
    expect(html).toContain('data-stage="liquid"')
    expect(html).toContain('g-breadcrumbs__list')
    expect(html).not.toContain('g-breadcrumbs__measure')
    expect(html).not.toContain('is-ready')
    expect(html).toContain('aria-expanded="false"')
  })
  it('al desmontar no quedan escuchas ni observadores', async () => {
    const obs = []
    const RO = globalThis.ResizeObserver
    globalThis.ResizeObserver = class { constructor() { this.els = new Set(); obs.push(this) } observe(el) { this.els.add(el) } unobserve(el) { this.els.delete(el) } disconnect() { this.els.clear() } }
    const add = vi.spyOn(document, 'addEventListener')
    const rem = vi.spyOn(document, 'removeEventListener')
    const w = await mk()
    await w.find('.g-breadcrumbs__door').trigger('click')
    expect(obs.some((o) => o.els.size)).toBe(true)
    w.unmount()
    expect(obs.every((o) => o.els.size === 0)).toBe(true)
    const mine = (calls) => calls.filter(([t, fn]) => (t === 'pointerdown' || t === 'keydown') && fn.name.startsWith('onDoc')).map(([t, fn]) => `${t}:${fn.name}`)
    expect(mine(rem.mock.calls).sort()).toEqual(mine(add.mock.calls).sort())
    globalThis.ResizeObserver = RO
  })
})

describe('GBreadcrumbs · reactividad', () => {
  it('cambiar items reactivos actualiza la fila', async () => {
    const st = reactive({ items: ITEMS() })
    const w = mount({ render: () => h(GBreadcrumbs, { items: st.items, labels: LABELS }) }, { attachTo: document.body })
    await settle()
    st.items = st.items.slice(0, 2)
    await settle()
    expect(w.findAll('.g-breadcrumbs__list > li:not(.is-leaving)')).toHaveLength(2)
    w.unmount()
  })
})
