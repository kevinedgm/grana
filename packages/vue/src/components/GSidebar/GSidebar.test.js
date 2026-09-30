import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, h } from 'vue'
import GSidebar from './GSidebar.vue'

// jsdom no implementa <dialog> modal ni popover: se simulan con el mismo contrato (atributo open / :popover-open y evento close).
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () {
    if (!this.hasAttribute('open')) return
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
  HTMLElement.prototype.showPopover = function () { this.setAttribute('data-popover-open', '') }
  HTMLElement.prototype.hidePopover = function () { this.removeAttribute('data-popover-open') }
  const orig = HTMLElement.prototype.matches
  HTMLElement.prototype.matches = function (sel) { return sel === ':popover-open' ? this.hasAttribute('data-popover-open') : orig.call(this, sel) }
})
// jsdom no implementa la navegación de los enlaces reales: se evita después de que el componente decida
const noNav = (e) => { if (e.target.closest?.('a[href]')) e.preventDefault() }
beforeEach(() => window.addEventListener('click', noNav))
afterEach(() => { window.removeEventListener('click', noNav); vi.restoreAllMocks(); document.body.innerHTML = '' })

const LABELS = { collapse: 'Contraer la barra lateral', expand: 'Expandir la barra lateral', more: 'Más', moreActive: 'contiene la página actual', drawer: 'Navegación', close: 'Cerrar', search: 'Buscar', searchHint: '⌘K' }
const ITEMS = [
  { label: 'Principal', items: [
    { id: 'home', label: 'Inicio', href: '/', icon: 'home' },
    { id: 'inbox', label: 'Bandeja', href: '/inbox', icon: 'inbox', badge: 12, badgeLabel: '12 sin leer' },
    { id: 'msg', label: 'Mensajes', href: '/msg', icon: 'msg', dot: true, badgeLabel: 'Hay mensajes nuevos' }
  ] },
  { label: 'Espacio', items: [
    { id: 'proj', label: 'Proyectos', icon: 'folder', children: [
      { id: 'p1', label: 'Todos', href: '/p' }, { id: 'p2', label: 'Archivados', href: '/p/arch' }, { id: 'p3', label: 'Plantillas', href: '/p/t', disabled: true }
    ] },
    { id: 'team', label: 'Equipo', href: '/team', icon: 'users' },
    { id: 'bill', label: 'Facturación', icon: 'card', disabled: true }
  ] },
  { id: 'set', label: 'Ajustes', href: '/settings', icon: 'cog' }
]
const base = { items: ITEMS, label: 'Principal', labels: LABELS, modelValue: 'home' }
const mk = (props = {}, opts = {}) => mount(GSidebar, { attachTo: document.body, props: { ...base, ...props }, ...opts })
const links = (w) => w.findAll('.g-sidebar__nav .g-sidebar__link')
const byId = (w, id) => w.find(`[data-id="${id}"]`)
const key = async (el, k, extra = {}) => { await el.trigger('keydown', { key: k, ...extra }); await nextTick(); await nextTick() }
const last = (w, ev) => w.emitted(ev)?.at(-1)?.[0]

describe('GSidebar · expandida', () => {
  it('estructura: raíz con clases, <nav> con nombre y solo enlaces y botones; cabecera y pie fuera del <nav>', () => {
    const w = mk({ mode: 'expanded', search: true }, { slots: { logo: () => 'Logo', user: () => h('button', 'AG') } })
    expect(w.classes()).toEqual(expect.arrayContaining(['g-sidebar', 'g-sidebar--mode-expanded', 'g-sidebar--variant-fixed', 'g-sidebar--color-brand', 'g-sidebar--density-default']))
    const nav = w.find('nav')
    expect(nav.classes()).toContain('g-sidebar__nav')
    expect(nav.attributes('aria-label')).toBe('Principal')
    expect(nav.find('.g-sidebar__search').exists()).toBe(false)
    expect(nav.find('.g-sidebar__foot').exists()).toBe(false)
    expect(w.find('.g-sidebar__head .g-sidebar__search').exists()).toBe(true)
    expect(w.find('.g-sidebar__foot').text()).toBe('AG')
    expect(w.find('.g-sidebar__logo').text()).toBe('Logo')
  })

  it('grupos: <ul> con aria-labelledby a su título; un item sin grupo va en su propio grupo sin título', () => {
    const w = mk({ mode: 'expanded' })
    const titles = w.findAll('.g-sidebar__group-title')
    expect(titles.map((t) => t.text())).toEqual(['Principal', 'Espacio'])
    const lists = w.findAll('.g-sidebar__list')
    expect(lists).toHaveLength(3)
    expect(lists[0].attributes('aria-labelledby')).toBe(titles[0].attributes('id'))
    expect(lists[2].attributes('aria-labelledby')).toBeUndefined()
  })

  it('items: <a href> con icono, etiqueta e indicadores; el actual lleva aria-current y solo uno', () => {
    const w = mk({ mode: 'expanded' }, { slots: { icon: ({ item }) => h('i', { class: 'ico' }, item.icon) } })
    const home = byId(w, 'home')
    expect(home.element.tagName).toBe('A')
    expect(home.attributes('href')).toBe('/')
    expect(home.attributes('aria-current')).toBe('page')
    expect(home.classes()).toContain('is-active')
    expect(home.find('.g-sidebar__icon').attributes('aria-hidden')).toBe('true')
    expect(home.find('.ico').text()).toBe('home')
    expect(w.findAll('[aria-current="page"]')).toHaveLength(1)
    const inbox = byId(w, 'inbox')
    expect(inbox.find('.g-sidebar__badge').text()).toBe('12')
    expect(inbox.find('.g-sidebar__badge').attributes('aria-hidden')).toBe('true')
    expect(inbox.find('.g-sidebar__sr').text()).toBe(', 12 sin leer')
    expect(byId(w, 'msg').find('.g-sidebar__badge--dot').exists()).toBe(true)
  })

  it('un item sin href ni hijos es un <button>; el deshabilitado, <a role="link" aria-disabled> sin href', () => {
    const w = mk({ mode: 'expanded' })
    expect(byId(w, 'bill').element.tagName).toBe('A')
    expect(byId(w, 'bill').attributes('role')).toBe('link')
    expect(byId(w, 'bill').attributes('aria-disabled')).toBe('true')
    expect(byId(w, 'bill').attributes('href')).toBeUndefined()
    const b = mk({ mode: 'expanded', items: [{ id: 'act', label: 'Acción' }] })
    expect(b.find('[data-id="act"]').element.tagName).toBe('BUTTON')
  })

  it('padre: botón con aria-expanded y aria-controls; abre y cierra sus hijos en línea con is-open e inert', async () => {
    const w = mk({ mode: 'expanded', modelValue: 'home' })
    const parent = byId(w, 'proj')
    expect(parent.element.tagName).toBe('BUTTON')
    expect(parent.attributes('aria-expanded')).toBe('false')
    const sub = w.find(`#${parent.attributes('aria-controls')}`)
    expect(sub.classes()).not.toContain('is-open')
    expect(sub.element.hasAttribute('inert')).toBe(true)
    expect(sub.attributes('hidden')).toBeUndefined()
    await parent.trigger('click')
    expect(parent.attributes('aria-expanded')).toBe('true')
    expect(sub.classes()).toContain('is-open')
    expect(sub.element.hasAttribute('inert')).toBe(false)
    expect(sub.findAll('.g-sidebar__link')).toHaveLength(3)
    await parent.trigger('click')
    expect(sub.classes()).not.toContain('is-open')
    expect(sub.element.hasAttribute('inert')).toBe(true)
  })

  it('un hijo actual abre su rama y marca al padre como rama activa (sin aria-current)', () => {
    const w = mk({ mode: 'expanded', modelValue: 'p2' })
    const parent = byId(w, 'proj')
    expect(parent.attributes('aria-expanded')).toBe('true')
    expect(parent.classes()).toContain('is-branch')
    expect(parent.attributes('aria-current')).toBeUndefined()
    expect(byId(w, 'p2').attributes('aria-current')).toBe('page')
  })

  it('el DOM persiste: al abrir un submenú y al cambiar el destino no se recrean los nodos', async () => {
    const w = mk({ mode: 'expanded' })
    const root = w.element
    const link = byId(w, 'team').element
    await byId(w, 'proj').trigger('click')
    await w.setProps({ modelValue: 'team' })
    expect(w.element).toBe(root)
    expect(byId(w, 'team').element).toBe(link)
    expect(byId(w, 'team').attributes('aria-current')).toBe('page')
    expect(byId(w, 'home').attributes('aria-current')).toBeUndefined()
  })

  it('cabecera: el botón de contraer lleva aria-expanded y nombre; la búsqueda emite search', async () => {
    const w = mk({ mode: 'expanded', search: true })
    const t = w.find('.g-sidebar__toggle')
    expect(t.attributes('aria-expanded')).toBe('true')
    expect(t.attributes('aria-label')).toBe('Contraer la barra lateral')
    const s = w.find('.g-sidebar__search')
    expect(s.attributes('aria-haspopup')).toBe('dialog')
    expect(s.find('.g-sidebar__label').text()).toBe('Buscar')
    expect(s.find('.g-sidebar__hint').text()).toBe('⌘K')
    await s.trigger('click')
    expect(w.emitted('search')).toHaveLength(1)
  })

  it('el slot search sustituye al disparador (y no emite search)', () => {
    const w = mk({ mode: 'expanded' }, { slots: { search: () => h('button', { class: 'mio' }, 'B') } })
    expect(w.find('.g-sidebar__search').exists()).toBe(false)
    expect(w.find('.mio').exists()).toBe(true)
  })

  it('variante, color y densidad siguen a las props; class y style, a la raíz', () => {
    const w = mk({ mode: 'expanded', variant: 'floating', color: 'accent', density: 'compact' }, { attrs: { class: 'mi', style: 'margin: 0', 'data-x': '1' } })
    expect(w.classes()).toEqual(expect.arrayContaining(['g-sidebar--variant-floating', 'g-sidebar--color-accent', 'g-sidebar--density-compact', 'mi']))
    expect(w.attributes('data-x')).toBe('1')
    expect(w.attributes('style')).toContain('margin')
  })
})

describe('GSidebar · navegar', () => {
  it('elegir un enlace emite navigate con el evento nativo y luego update:modelValue', async () => {
    const w = mk({ mode: 'expanded' })
    await byId(w, 'team').trigger('click')
    const nav = last(w, 'navigate')
    expect(nav.item.id).toBe('team')
    expect(nav.event.type).toBe('click')
    expect(last(w, 'update:modelValue')).toBe('team')
  })

  it('preventDefault en navigate cancela update:modelValue (para un router)', async () => {
    const w = mk({ mode: 'expanded', 'onNavigate': (e) => e.event.preventDefault() })
    await byId(w, 'team').trigger('click')
    expect(w.emitted('navigate')).toHaveLength(1)
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('un item deshabilitado no navega ni emite', async () => {
    const w = mk({ mode: 'expanded', items: [{ id: 'x', label: 'X', href: '/x', disabled: true }] })
    await w.find('[data-id="x"]').trigger('click')
    expect(w.emitted('navigate')).toBeUndefined()
  })

  it('el valor es el prop: si el consumidor no lo actualiza, el actual no cambia', async () => {
    const w = mk({ mode: 'expanded' })
    await byId(w, 'team').trigger('click')
    expect(byId(w, 'home').attributes('aria-current')).toBe('page')
  })

  it('un hijo de un submenú también navega', async () => {
    const w = mk({ mode: 'expanded', modelValue: 'p2' })
    await byId(w, 'p1').trigger('click')
    expect(last(w, 'update:modelValue')).toBe('p1')
  })
})

describe('GSidebar · teclado en la región de navegación', () => {
  it('↓ ↑ Inicio Fin mueven entre los items visibles y habilitados (saltan deshabilitados y submenús cerrados)', async () => {
    const w = mk({ mode: 'expanded' })
    const first = byId(w, 'home')
    first.element.focus()
    await key(first, 'ArrowDown')
    expect(document.activeElement.dataset.id).toBe('inbox')
    await key(w.find('[data-id="inbox"]'), 'ArrowDown'); await key(w.find('[data-id="msg"]'), 'ArrowDown')
    expect(document.activeElement.dataset.id).toBe('proj')
    await key(w.find('[data-id="proj"]'), 'ArrowDown')
    expect(document.activeElement.dataset.id).toBe('team')
    await key(w.find('[data-id="team"]'), 'ArrowDown')
    expect(document.activeElement.dataset.id).toBe('set')
    await key(w.find('[data-id="set"]'), 'Home')
    expect(document.activeElement.dataset.id).toBe('home')
    await key(w.find('[data-id="home"]'), 'End')
    expect(document.activeElement.dataset.id).toBe('set')
  })

  it('con un submenú abierto, ↓ entra en sus hijos habilitados', async () => {
    const w = mk({ mode: 'expanded', modelValue: 'p1' })
    byId(w, 'proj').element.focus()
    await key(byId(w, 'proj'), 'ArrowDown')
    expect(document.activeElement.dataset.id).toBe('p1')
  })
})

describe('GSidebar · riel', () => {
  const rail = (props = {}, opts = {}) => mk({ mode: 'rail', ...props }, opts)

  it('mismo DOM y misma raíz: las etiquetas y los títulos siguen en el DOM; el padre lleva aria-haspopup', () => {
    const w = rail()
    expect(w.classes()).toContain('g-sidebar--mode-rail')
    expect(w.findAll('.g-sidebar__link .g-sidebar__label').length).toBeGreaterThan(5)
    expect(w.findAll('.g-sidebar__group-title')).toHaveLength(2)
    const p = byId(w, 'proj')
    expect(p.attributes('aria-haspopup')).toBe('true')
    expect(p.attributes('aria-controls')).toBeUndefined()
    expect(w.find('.g-sidebar__sub').element.hasAttribute('inert')).toBe(true)
    expect(w.find('.g-sidebar__toggle').attributes('aria-expanded')).toBe('false')
    expect(w.find('.g-sidebar__toggle').attributes('aria-label')).toBe('Expandir la barra lateral')
  })

  it('el nombre accesible del riel incluye el texto real y el texto del indicador', () => {
    const w = rail()
    expect(byId(w, 'inbox').text().replace(/\s+/g, ' ')).toContain('Bandeja')
    expect(byId(w, 'inbox').find('.g-sidebar__sr').text()).toContain('12 sin leer')
  })

  it('clic en un padre abre el panel (nombre del padre, hijos) y aria-expanded; Esc lo cierra y devuelve el foco', async () => {
    const w = rail()
    const p = byId(w, 'proj')
    await p.trigger('click'); await nextTick(); await nextTick()
    const fly = w.find('.g-sidebar__fly')
    expect(fly.element.hasAttribute('data-popover-open')).toBe(true)
    expect(fly.attributes('role')).toBe('group')
    expect(fly.attributes('aria-label')).toBe('Proyectos')
    expect(fly.find('.g-sidebar__fly-title').text()).toBe('Proyectos')
    expect(fly.findAll('.g-sidebar__link')).toHaveLength(3)
    expect(p.attributes('aria-expanded')).toBe('true')
    expect(fly.find('[aria-disabled="true"]').exists()).toBe(true)
    await fly.trigger('keydown', { key: 'Escape' }); await nextTick()
    expect(fly.element.hasAttribute('data-popover-open')).toBe(false)
    expect(p.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(p.element)
  })

  it('→ en un padre abre el panel con el foco en el primer hijo; ← lo cierra; ↓ ↑ Fin se mueven', async () => {
    const w = rail()
    const p = byId(w, 'proj')
    p.element.focus()
    await key(p, 'ArrowRight'); await nextTick()
    expect(w.find('.g-sidebar__fly').element.hasAttribute('data-popover-open')).toBe(true)
    expect(document.activeElement.dataset.id).toBe('p1')
    await key(w.find('.g-sidebar__fly [data-id="p1"]'), 'ArrowDown')
    expect(document.activeElement.dataset.id).toBe('p2')
    await w.find('.g-sidebar__fly').trigger('keydown', { key: 'ArrowLeft' }); await nextTick()
    expect(w.find('.g-sidebar__fly').element.hasAttribute('data-popover-open')).toBe(false)
    expect(document.activeElement).toBe(p.element)
  })

  it('el foco solo NO abre el panel', async () => {
    const w = rail()
    byId(w, 'proj').element.focus()
    await byId(w, 'proj').trigger('focus')
    await new Promise((r) => setTimeout(r, 250))
    expect(w.find('.g-sidebar__fly').element.hasAttribute('data-popover-open')).toBe(false)
  })

  it('el puntero encima abre el panel tras un retardo; salir sin volver lo cierra', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const w = rail()
    const p = byId(w, 'proj')
    await p.trigger('pointerenter')
    vi.advanceTimersByTime(120)
    expect(w.find('.g-sidebar__fly').element.hasAttribute('data-popover-open')).toBe(false)
    vi.advanceTimersByTime(60); await nextTick(); await nextTick()
    expect(w.find('.g-sidebar__fly').element.hasAttribute('data-popover-open')).toBe(true)
    await p.trigger('pointerleave')
    vi.advanceTimersByTime(300); await nextTick()
    expect(w.find('.g-sidebar__fly').element.hasAttribute('data-popover-open')).toBe(false)
    vi.useRealTimers()
  })

  it('elegir un hijo del panel navega, cierra el panel y emite update:modelValue', async () => {
    const w = rail()
    await byId(w, 'proj').trigger('click'); await nextTick(); await nextTick()
    await w.find('.g-sidebar__fly [data-id="p2"]').trigger('click'); await nextTick()
    expect(last(w, 'update:modelValue')).toBe('p2')
    expect(w.find('.g-sidebar__fly').element.hasAttribute('data-popover-open')).toBe(false)
  })

  it('la pista es un solo elemento aria-hidden con el nombre del item', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const w = rail()
    await byId(w, 'team').trigger('pointerenter')
    vi.advanceTimersByTime(400); await nextTick()
    const tip = w.find('.g-sidebar__tip')
    expect(tip.attributes('aria-hidden')).toBe('true')
    expect(tip.text()).toBe('Equipo')
    expect(tip.element.hasAttribute('data-popover-open')).toBe(true)
    await byId(w, 'team').trigger('pointerleave')
    expect(tip.element.hasAttribute('data-popover-open')).toBe(false)
    // otra pista poco después: instantánea
    await byId(w, 'set').trigger('pointerenter')
    vi.advanceTimersByTime(1); await nextTick()
    expect(tip.classes()).toContain('is-instant')
    vi.useRealTimers()
  })

  it('un padre en el riel no muestra pista (su panel ya lleva el nombre)', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const w = rail()
    await byId(w, 'proj').trigger('pointerenter')
    vi.advanceTimersByTime(100)
    expect(w.find('.g-sidebar__tip').element.hasAttribute('data-popover-open')).toBe(false)
    vi.useRealTimers()
  })
})

describe('GSidebar · contraer y expandir', () => {
  it('el botón alterna riel/expandida sobre la misma raíz y emite update:collapsed', async () => {
    const w = mk({ mode: 'expanded' })
    const root = w.element
    await w.find('.g-sidebar__toggle').trigger('click')
    expect(w.element).toBe(root)
    expect(w.classes()).toContain('g-sidebar--mode-rail')
    expect(last(w, 'update:collapsed')).toBe(true)
    expect(w.find('.g-sidebar__toggle').attributes('aria-label')).toBe('Expandir la barra lateral')
    await w.find('.g-sidebar__toggle').trigger('click')
    expect(w.classes()).toContain('g-sidebar--mode-expanded')
    expect(last(w, 'update:collapsed')).toBe(false)
  })

  it('collapsed en true arranca en riel; cambiarlo desde fuera alterna', async () => {
    const w = mk({ mode: 'expanded', collapsed: true })
    expect(w.classes()).toContain('g-sidebar--mode-rail')
    await w.setProps({ collapsed: false })
    expect(w.classes()).toContain('g-sidebar--mode-expanded')
  })

  it('mode-change: se emite al montar y cuando cambia el formato', async () => {
    const w = mk({ mode: 'expanded' })
    await nextTick()
    expect(w.emitted('mode-change')[0][0]).toEqual({ mode: 'expanded', overlay: false })
    await w.find('.g-sidebar__toggle').trigger('click')
    expect(last(w, 'mode-change')).toEqual({ mode: 'rail', overlay: false })
  })
})

describe('GSidebar · adaptación automática por el ancho del contenedor', () => {
  let width
  let observers
  beforeEach(() => {
    width = 1000
    observers = []
    globalThis.ResizeObserver = class { constructor(cb) { this.cb = cb; observers.push(this) } observe() {} disconnect() {} }
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () { return { width: this.closest?.('[data-host]') ? width : 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 } })
  })
  afterEach(() => { delete globalThis.ResizeObserver })
  const auto = async (props = {}) => {
    const host = document.createElement('div')
    host.dataset.host = '1'
    document.body.append(host)
    const w = mount(GSidebar, { attachTo: host, props: { ...base, ...props } })
    await nextTick()
    return w
  }
  const resize = async (w) => { observers.forEach((o) => o.cb()); await nextTick(); await nextTick() }

  it('≥ space×240 expandida, ≥ space×150 riel, menos: navbar (por defecto)', async () => {
    const w = await auto()
    expect(w.find('.g-sidebar').classes()).toContain('g-sidebar--mode-expanded')
    width = 800; await resize(w)
    expect(w.find('.g-sidebar').classes()).toContain('g-sidebar--mode-rail')
    width = 500; await resize(w)
    expect(w.find('nav.g-sidebar--mode-navbar').exists()).toBe(true)
    expect(last(w, 'mode-change').mode).toBe('navbar')
  })

  it('los umbrales son exactos: 960 expandida, 959 riel, 600 riel, 599 navbar', async () => {
    const w = await auto()
    width = 959; await resize(w); expect(w.find('.g-sidebar').classes()).toContain('g-sidebar--mode-rail')
    width = 960; await resize(w); expect(w.find('.g-sidebar').classes()).toContain('g-sidebar--mode-expanded')
    width = 600; await resize(w); expect(w.find('.g-sidebar').classes()).toContain('g-sidebar--mode-rail')
    width = 599; await resize(w); expect(w.find('nav.g-sidebar--mode-navbar').exists()).toBe(true)
  })

  it('mobile="drawer": por debajo del riel no hay barra, solo el drawer', async () => {
    const w = await auto({ mobile: 'drawer' })
    width = 400; await resize(w)
    expect(w.find('nav.g-sidebar--mode-navbar').exists()).toBe(false)
    expect(w.find('dialog.g-sidebar__drawer').exists()).toBe(true)
    expect(last(w, 'mode-change').mode).toBe('drawer')
  })

  it('la elección manual se conserva mientras la clase de ancho no cambie y se descarta al cambiarla', async () => {
    const w = await auto()
    await w.find('.g-sidebar__toggle').trigger('click')
    expect(w.find('.g-sidebar').classes()).toContain('g-sidebar--mode-rail')
    width = 1100; await resize(w)
    expect(w.find('.g-sidebar').classes()).toContain('g-sidebar--mode-rail')
    width = 800; await resize(w)
    expect(w.find('.g-sidebar').classes()).toContain('g-sidebar--mode-rail')
    width = 1100; await resize(w)
    expect(w.find('.g-sidebar').classes()).toContain('g-sidebar--mode-expanded')
  })

  it('con overlay, expandir un riel automático da overlay en el evento y la clase g-sidebar--overlay', async () => {
    const w = await auto({ overlay: true })
    width = 800; await resize(w)
    await w.find('.g-sidebar__toggle').trigger('click')
    expect(w.find('.g-sidebar').classes()).toEqual(expect.arrayContaining(['g-sidebar--mode-expanded', 'g-sidebar--overlay']))
    expect(last(w, 'mode-change')).toEqual({ mode: 'expanded', overlay: true })
  })

  it('container acepta un selector y un elemento', async () => {
    const box = document.createElement('div'); box.id = 'caja'; box.dataset.host = '1'; document.body.append(box)
    width = 700
    const w = mount(GSidebar, { attachTo: document.body, props: { ...base, container: '#caja' } })
    await nextTick()
    expect(w.find('.g-sidebar').classes()).toContain('g-sidebar--mode-rail')
    const w2 = mount(GSidebar, { attachTo: document.body, props: { ...base, container: box } })
    await nextTick()
    expect(w2.find('.g-sidebar').classes()).toContain('g-sidebar--mode-rail')
  })
})

describe('GSidebar · navbar', () => {
  const bar = (props = {}, opts = {}) => mk({ mode: 'navbar', ...props }, opts)
  const tabs = (w) => w.findAll('.g-sidebar__tab')

  it('raíz <nav> con nombre, lista, barCount items y «Más»; el actual con is-current, icono y etiqueta visible', () => {
    const w = bar()
    const nav = w.find('nav.g-sidebar--mode-navbar')
    expect(nav.exists()).toBe(true)
    expect(nav.attributes('aria-label')).toBe('Principal')
    expect(tabs(w)).toHaveLength(5)
    const lis = w.findAll('.g-sidebar__bar > li')
    expect(lis[0].classes()).toContain('is-current')
    expect(lis[0].find('.g-sidebar__label').classes()).not.toContain('g-sidebar__label--hidden')
    expect(lis[1].find('.g-sidebar__label').classes()).toContain('g-sidebar__label--hidden')
    expect(lis[1].find('.g-sidebar__label').text()).toBe('Bandeja')
    expect(tabs(w)[0].attributes('aria-current')).toBe('page')
    expect(w.find('.g-sidebar__more').text()).toContain('Más')
  })

  it('barCount y primary deciden qué va en la barra (los deshabilitados no entran por defecto)', () => {
    expect(tabs(bar({ barCount: 3 }))).toHaveLength(4)
    const w = bar({ items: [{ id: 'a', label: 'A', href: '/a' }, { id: 'b', label: 'B', href: '/b', primary: true }, { id: 'c', label: 'C', href: '/c', primary: true }, { id: 'd', label: 'D', href: '/d', disabled: true }, { id: 'e', label: 'E', href: '/e' }], modelValue: 'b' })
    expect(tabs(w).map((t) => t.attributes('data-id') ?? 'more')).toEqual(['b', 'c', 'more'])
    const w2 = bar({ items: [{ id: 'a', label: 'A', href: '/a', disabled: true }, { id: 'b', label: 'B', href: '/b' }] })
    expect(tabs(w2).map((t) => t.attributes('data-id') ?? 'more')).toEqual(['b', 'more'])
  })

  it('los contadores de la barra llevan texto para lectores; un padre en la barra es un botón aria-haspopup="dialog"', () => {
    const w = bar()
    expect(w.find('[data-id="inbox"] .g-sidebar__sr').text()).toContain('12 sin leer')
    const parent = w.find('[data-id="proj"]')
    expect(parent.element.tagName).toBe('BUTTON')
    expect(parent.attributes('aria-haspopup')).toBe('dialog')
  })

  it('«Más» abre el drawer modal con toda la navegación y el foco vuelve al botón al cerrar', async () => {
    const w = bar({ search: true }, { slots: { user: () => h('button', { class: 'u' }, 'AG') } })
    const more = w.find('.g-sidebar__more')
    more.element.focus()
    await more.trigger('click'); await nextTick(); await nextTick()
    const dlg = w.find('dialog.g-sidebar__drawer')
    expect(dlg.element.hasAttribute('open')).toBe(true)
    expect(dlg.attributes('aria-label')).toBe('Navegación')
    expect(last(w, 'update:open')).toBe(true)
    expect(dlg.find('.g-sidebar--mode-expanded').exists()).toBe(true)
    expect(dlg.findAll('.g-sidebar__group').length).toBe(3)
    expect(dlg.find('.g-sidebar__search').exists()).toBe(true)
    expect(dlg.find('.u').exists()).toBe(true)
    dlg.element.close(); await nextTick()
    expect(last(w, 'update:open')).toBe(false)
    expect(document.activeElement).toBe(more.element)
  })

  it('elegir un destino en el drawer cierra (closeOnNavigate) y emite navigate; con closeOnNavigate=false, no cierra', async () => {
    const w = bar()
    await w.find('.g-sidebar__more').trigger('click'); await nextTick(); await nextTick()
    await w.find('dialog [data-id="team"]').trigger('click'); await nextTick(); await nextTick()
    expect(last(w, 'update:modelValue')).toBe('team')
    expect(w.find('dialog').element.hasAttribute('open')).toBe(false)
    const b = bar({ closeOnNavigate: false })
    await b.find('.g-sidebar__more').trigger('click'); await nextTick(); await nextTick()
    await b.find('dialog [data-id="team"]').trigger('click'); await nextTick()
    expect(b.find('dialog').element.hasAttribute('open')).toBe(true)
  })

  it('preventDefault en navigate no cierra el drawer ni emite update:modelValue', async () => {
    const w = bar({ onNavigate: (e) => e.event.preventDefault() })
    await w.find('.g-sidebar__more').trigger('click'); await nextTick(); await nextTick()
    await w.find('dialog [data-id="team"]').trigger('click'); await nextTick()
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(w.find('dialog').element.hasAttribute('open')).toBe(true)
  })

  it('un padre de la barra abre el drawer con su rama abierta', async () => {
    const w = bar()
    await w.find('.g-sidebar__bar [data-id="proj"]').trigger('click'); await nextTick(); await nextTick()
    const dlg = w.find('dialog')
    expect(dlg.element.hasAttribute('open')).toBe(true)
    expect(dlg.find('.g-sidebar__parent[data-id="proj"]').attributes('aria-expanded')).toBe('true')
  })

  it('si el destino actual no está en la barra, «Más» queda como rama activa con texto oculto y sin aria-current', () => {
    const w = bar({ modelValue: 'team' })
    const more = w.find('.g-sidebar__more')
    expect(more.classes()).toContain('is-branch')
    expect(more.find('.g-sidebar__sr').text()).toContain('contiene la página actual')
    expect(more.attributes('aria-current')).toBeUndefined()
    expect(w.findAll('.g-sidebar__bar > li.is-current')).toHaveLength(1)
    expect(w.find('.g-sidebar__bar > li.is-current .g-sidebar__more').exists()).toBe(true)
    expect(w.findAll('.g-sidebar__bar [aria-current]')).toHaveLength(0)
  })

  it('un hijo actual marca al padre de la barra como rama activa', () => {
    const w = bar({ modelValue: 'p2' })
    const p = w.find('.g-sidebar__bar [data-id="proj"]')
    expect(p.classes()).toContain('is-branch')
    expect(p.find('.g-sidebar__sr').text()).toContain('contiene la página actual')
    expect(p.element.closest('li').classList.contains('is-current')).toBe(true)
  })

  it('el destino cambia sobre el mismo DOM: is-current pasa al nuevo <li> sin recrear la barra', async () => {
    const w = bar()
    const ul = w.find('.g-sidebar__bar').element
    const li = w.findAll('.g-sidebar__bar > li')[1].element
    await w.setProps({ modelValue: 'inbox' })
    expect(w.find('.g-sidebar__bar').element).toBe(ul)
    expect(w.findAll('.g-sidebar__bar > li')[1].element).toBe(li)
    expect(li.classList.contains('is-current')).toBe(true)
    expect(w.findAll('.g-sidebar__bar > li')[0].classes()).not.toContain('is-current')
  })

  it('teclado en la barra: → ← Inicio Fin mueven entre los items', async () => {
    const w = bar()
    const first = tabs(w)[0]
    first.element.focus()
    await key(w.find('.g-sidebar__bar'), 'ArrowRight')
    expect(document.activeElement).toBe(tabs(w)[1].element)
    await key(w.find('.g-sidebar__bar'), 'End')
    expect(document.activeElement).toBe(w.find('.g-sidebar__more').element)
    await key(w.find('.g-sidebar__bar'), 'Home')
    expect(document.activeElement).toBe(tabs(w)[0].element)
  })

  it('is-entering se pone al pasar al formato navbar y se quita', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const w = mk({ mode: 'expanded' })
    await w.setProps({ mode: 'navbar' })
    expect(w.find('nav.g-sidebar--mode-navbar').classes()).toContain('is-entering')
    vi.advanceTimersByTime(700); await nextTick()
    expect(w.find('nav.g-sidebar--mode-navbar').classes()).not.toContain('is-entering')
    vi.useRealTimers()
  })

  it('contained añade g-sidebar--contained a la raíz', () => {
    expect(bar({ contained: true }).find('nav').classes()).toContain('g-sidebar--contained')
  })
})

describe('GSidebar · drawer (mode="drawer")', () => {
  it('sin barra ni sidebar en línea; open lo abre y update:open acompaña al cierre (Esc/fondo)', async () => {
    const w = mk({ mode: 'drawer' })
    expect(w.find('nav.g-sidebar--mode-navbar').exists()).toBe(false)
    expect(w.find('dialog.g-sidebar__drawer').exists()).toBe(true)
    await w.setProps({ open: true }); await nextTick(); await nextTick()
    expect(w.find('dialog').element.hasAttribute('open')).toBe(true)
    await w.find('dialog').trigger('click')
    await nextTick()
    expect(w.find('dialog').element.hasAttribute('open')).toBe(false)
    expect(last(w, 'update:open')).toBe(false)
  })

  it('el botón de cierre del drawer existe con labels.close y cierra', async () => {
    const w = mk({ mode: 'drawer', open: true }); await nextTick(); await nextTick()
    const close = w.find('dialog .g-sidebar__toggle')
    expect(close.attributes('aria-label')).toBe('Cerrar')
    await close.trigger('click'); await nextTick()
    expect(w.find('dialog').element.hasAttribute('open')).toBe(false)
  })

  it('métodos expuestos: open, close y toggle', async () => {
    const w = mk({ mode: 'expanded' })
    w.vm.toggle(); await nextTick()
    expect(w.classes()).toContain('g-sidebar--mode-rail')
    const d = mk({ mode: 'drawer' })
    d.vm.open(); await nextTick(); await nextTick()
    expect(d.find('dialog').element.hasAttribute('open')).toBe(true)
    d.vm.close(); await nextTick(); await nextTick()
    expect(d.find('dialog').element.hasAttribute('open')).toBe(false)
  })
})

describe('GSidebar · avisos de desarrollo y validadores', () => {
  it('avisa (una vez) si faltan label, labels requeridos o si un item es inválido', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(GSidebar, { props: { items: [{ id: 'a' }, { id: 'b', label: 'B', badge: 3 }], mode: 'expanded' } })
    const msgs = warn.mock.calls.map((c) => String(c[0]))
    expect(msgs.some((m) => m.includes('necesita label'))).toBe(true)
    expect(msgs.some((m) => m.includes('labels.collapse'))).toBe(true)
    expect(msgs.some((m) => m.includes('labels.drawer'))).toBe(true)
    expect(msgs.some((m) => m.includes('labels.more'))).toBe(true)
    expect(msgs.some((m) => m.includes('sin id o sin label'))).toBe(true)
    expect(msgs.some((m) => m.includes('badgeLabel'))).toBe(true)
  })

  it('avisa de ids duplicados y de nietos', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mk({ items: [{ id: 'a', label: 'A', href: '/a' }, { id: 'a', label: 'A2', href: '/a2' }, { id: 'p', label: 'P', children: [{ id: 'c', label: 'C', children: [{ id: 'n', label: 'N' }] }] }], mode: 'expanded' })
    const msgs = warn.mock.calls.map((c) => String(c[0]))
    expect(msgs.some((m) => m.includes('mismo id'))).toBe(true)
    expect(msgs.some((m) => m.includes('nietos'))).toBe(true)
  })

  it('validadores de mode, mobile, variant, barCount, color y density', () => {
    const p = GSidebar.props
    expect(p.mode.validator('rail')).toBe(true)
    expect(p.mode.validator('bar')).toBe(false)
    expect(p.mobile.validator('drawer')).toBe(true)
    expect(p.variant.validator('glass')).toBe(false)
    expect(p.barCount.validator(4)).toBe(true)
    expect(p.barCount.validator(6)).toBe(false)
    expect(p.color.validator('accent')).toBe(true)
    expect(p.density.validator('dense')).toBe(false)
  })
})
