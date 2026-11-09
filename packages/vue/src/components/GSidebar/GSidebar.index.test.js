// GSidebar · apariencia `index` y grupos plegables (sidebar.md §«Apariencia `index`», §«Grupos plegables», #1060 a #1069),
// con la extensión @grana/vue/sidebar-index y sin ella (A5: default, grupos fijos y abiertos)
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createSSRApp, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import GSidebar from './GSidebar.vue'
import SidebarFilter from '../../sidebar-filter.js'
import SidebarIndex from '../../sidebar-index.js'

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () {
    if (!this.hasAttribute('open')) return
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
})
const noNav = (e) => { if (e.target.closest?.('a[href]')) e.preventDefault() }
beforeEach(() => window.addEventListener('click', noNav))
afterEach(() => { window.removeEventListener('click', noNav); vi.restoreAllMocks(); document.body.innerHTML = '' })

const LABELS = { drawer: 'Índice', close: 'Cerrar', groupCurrent: 'contiene la página actual', more: 'Más', collapse: 'Contraer', expand: 'Expandir', filter: 'Filtrar', filterCount: (s, t) => `${s} de ${t}`, filterNone: (q) => `Nada con ${q}`, filterClear: 'Vaciar' }
const ITEMS = [
  { label: 'Guía', items: [
    { id: 'intro', label: 'Introducción', href: '/intro' },
    { id: 'tema', label: 'Tema', href: '/tema' }
  ] },
  { id: 'campos', label: 'Campos de entrada', collapsible: true, items: [
    { id: 'input', label: 'GInput', href: '/input', code: '11' },
    { id: 'combo', label: 'GCombobox', href: '/combo', code: '24' }
  ] },
  { id: 'acciones', label: 'Acciones', collapsible: true, collapsed: true, items: [
    { id: 'btn', label: 'GBtn', href: '/btn', code: '01' },
    { id: 'tabs', label: 'GTabs', href: '/tabs', code: '09' }
  ] }
]
const base = { items: ITEMS, label: 'Componentes', labels: LABELS, appearance: 'index', mode: 'expanded', modelValue: 'intro' }
const mk = (props = {}, opts = {}) => mount(GSidebar, { attachTo: document.body, props: { ...base, ...props }, global: { plugins: [SidebarIndex] }, ...opts })
const bare = (props = {}, opts = {}) => mount(GSidebar, { attachTo: document.body, props: { ...base, ...props }, ...opts })
const btn = (w, label) => w.findAll('button.g-sidebar__group-title').find((b) => b.text().startsWith(label))
const group = (w, label) => btn(w, label).element.closest('.g-sidebar__group')
const body = (w, label) => group(w, label).querySelector('.g-sidebar__group-body')
const last = (w, ev) => w.emitted(ev)?.at(-1)?.[0]
const tick = async () => { await nextTick(); await nextTick() }

describe('GSidebar · appearance="index"', () => {
  it('clase de apariencia en la raíz; default por omisión', () => {
    expect(mk().classes()).toContain('g-sidebar--appearance-index')
    expect(mk({ appearance: undefined }).classes()).toContain('g-sidebar--appearance-default')
  })

  it('A4: appearance fuera de lista se pinta default y avisa', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mk({ appearance: 'libro' })
    expect(w.classes()).toContain('g-sidebar--appearance-default')
    expect(warn.mock.calls.some(([m]) => m.includes('(A4)'))).toBe(true)
  })

  it('A1: mode="rail" se pinta expandida y mode="navbar" drawer, con aviso', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(mk({ mode: 'rail' }).classes()).toContain('g-sidebar--mode-expanded')
    expect(warn.mock.calls.some(([m]) => m.includes('(A1)'))).toBe(true)
    const w = mk({ mode: 'navbar' })
    expect(document.querySelector('.g-sidebar--mode-navbar')).toBeNull()
    expect(w.emitted('mode-change')[0][0].mode).toBe('drawer')
  })

  it('A2: icon y slot icon se ignoran con aviso; sin asiento', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mk({ items: [{ label: 'G', items: [{ id: 'a', label: 'A', href: '/a', icon: 'home' }] }], modelValue: 'a' }, { slots: { icon: () => h('i', { class: 'ico' }) } })
    expect(w.find('.g-sidebar__icon').exists()).toBe(false)
    expect(w.find('.ico').exists()).toBe(false)
    expect(warn.mock.calls.filter(([m]) => m.includes('(A2)')).length).toBeGreaterThanOrEqual(1)
  })

  it('sin botón de contraer (SB-B2) ni collapsed; <nav> con tabindex="-1" (#570)', () => {
    const w = mk({ collapsed: true })
    expect(w.find('.g-sidebar__toggle').exists()).toBe(false)
    expect(w.classes()).toContain('g-sidebar--mode-expanded')
    expect(w.find('nav').attributes('tabindex')).toBe('-1')
  })

  it('número al final: g-sidebar__code aria-hidden y nombre «GCombobox, 24»', () => {
    const w = mk({ modelValue: 'combo' })
    const a = w.find('[data-id="combo"]')
    const kids = [...a.element.children].map((n) => n.className)
    expect(kids[0]).toBe('g-sidebar__label')
    expect(a.find('.g-sidebar__code').attributes('aria-hidden')).toBe('true')
    expect(a.find('.g-sidebar__code').text()).toBe('24')
    expect(a.find('.g-sidebar__sr').text()).toBe(', 24')
    expect(a.text().replace(/\s+/g, ' ')).toBe('GCombobox24, 24')
  })

  it('la marca: una por <nav>, última hija, aria-hidden; solo en index', () => {
    const w = mk()
    const nav = w.find('nav').element
    expect(nav.lastElementChild.className).toBe('g-sidebar__mark')
    expect(nav.lastElementChild.getAttribute('aria-hidden')).toBe('true')
    expect(w.findAll('.g-sidebar__mark')).toHaveLength(1)
    expect(mk({ appearance: 'default' }).find('.g-sidebar__mark').exists()).toBe(false)
  })

  it('la marca: salto corto sin is-far, salto largo (> 1,5 filas) con is-far (#1071)', async () => {
    const tops = { intro: 0, tema: 40, input: 200 }
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
      const id = this.getAttribute?.('data-id')
      const top = id in tops ? tops[id] : 0
      return { top, bottom: top + 40, left: 0, right: 100, width: 100, height: this.matches?.('.g-sidebar__nav, nav') ? 600 : 40, x: 0, y: top }
    })
    const w = mk({ modelValue: 'intro' })
    await tick()
    const m = w.find('.g-sidebar__mark').element
    expect(m.classList.contains('is-far')).toBe(false)
    await w.setProps({ modelValue: 'tema' })
    await tick()
    expect(m.style.getPropertyValue('--_mark-y')).toBe('40px')
    expect(m.classList.contains('is-far')).toBe(false)
    await w.setProps({ modelValue: 'input' })
    await tick()
    expect(m.style.getPropertyValue('--_mark-y')).toBe('200px')
    expect(m.classList.contains('is-far')).toBe(true)
    await w.setProps({ modelValue: 'tema' })
    await tick()
    expect(m.classList.contains('is-far')).toBe(true)
    await w.setProps({ modelValue: 'intro' })
    await tick()
    expect(m.classList.contains('is-far')).toBe(false)
  })

  it('drawer: la raíz interna lleva la clase de apariencia (SB-B1); sin logo; con cerrar', async () => {
    mk({ mode: 'drawer', open: true }, { slots: { logo: () => 'Logo' } })
    await tick()
    const inner = document.querySelector('.g-sidebar__drawer > .g-sidebar')
    expect(inner.classList.contains('g-sidebar--appearance-index')).toBe(true)
    expect(inner.querySelector('.g-sidebar__logo')).toBeNull()
    expect(inner.querySelector('.g-sidebar__toggle').getAttribute('aria-label')).toBe('Cerrar')
    expect(inner.querySelector('.g-sidebar__nav').getAttribute('tabindex')).toBe('-1')
  })
})

describe('GSidebar · grupos plegables', () => {
  it('APG Disclosure: botón con aria-expanded/aria-controls; la lista sigue con aria-labelledby; el no plegable es span', () => {
    const w = mk()
    expect(w.findAll('button.g-sidebar__group-title')).toHaveLength(2)
    expect(w.find('span.g-sidebar__group-title').text()).toBe('Guía')
    const b = btn(w, 'Campos')
    const bd = body(w, 'Campos')
    expect(b.attributes('aria-expanded')).toBe('true')
    expect(b.attributes('aria-controls')).toBe(bd.id)
    expect(bd.querySelector('.g-sidebar__list').getAttribute('aria-labelledby')).toBe(b.attributes('id'))
    expect(group(w, 'Campos').classList.contains('is-collapsible')).toBe(true)
  })

  it('collapsed inicial: plegado y asentado con hidden="until-found" en el envoltorio, nunca en la lista (SB-B4)', () => {
    const w = mk()
    const bd = body(w, 'Acciones')
    expect(btn(w, 'Acciones').attributes('aria-expanded')).toBe('false')
    expect(bd.getAttribute('hidden')).toBe('until-found')
    expect(bd.querySelector('.g-sidebar__list').hasAttribute('hidden')).toBe(false)
    expect(group(w, 'Acciones').classList.contains('is-closed')).toBe(true)
  })

  it('clic pliega y despliega; estado interno; emite update:closedGroups', async () => {
    const w = mk()
    await btn(w, 'Campos').trigger('click')
    await tick()
    expect(btn(w, 'Campos').attributes('aria-expanded')).toBe('false')
    expect(last(w, 'update:closedGroups')).toEqual(expect.arrayContaining(['acciones', 'campos']))
    await btn(w, 'Acciones').trigger('click')
    await tick()
    expect(btn(w, 'Acciones').attributes('aria-expanded')).toBe('true')
    expect(body(w, 'Acciones').hasAttribute('hidden')).toBe(false)
    expect(last(w, 'update:closedGroups')).toEqual(['campos'])
  })

  it('controlado: manda closedGroups (collapsed se ignora)', async () => {
    const w = mk({ closedGroups: ['campos'] })
    expect(btn(w, 'Campos').attributes('aria-expanded')).toBe('false')
    expect(btn(w, 'Acciones').attributes('aria-expanded')).toBe('true')
    await btn(w, 'Acciones').trigger('click')
    expect(last(w, 'update:closedGroups')).toEqual(['campos', 'acciones'])
    // Sin que la aplicación acepte, nada cambia
    await tick()
    expect(btn(w, 'Acciones').attributes('aria-expanded')).toBe('true')
    await w.setProps({ closedGroups: ['campos', 'acciones'] })
    await tick()
    expect(btn(w, 'Acciones').attributes('aria-expanded')).toBe('false')
  })

  it('A3: collapsible sin id no se pliega (span) y avisa', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mk({ items: [{ label: 'Sin id', collapsible: true, items: [{ id: 'x', label: 'X', href: '/x' }] }], modelValue: 'x' })
    expect(w.find('button.g-sidebar__group-title').exists()).toBe(false)
    expect(warn.mock.calls.some(([m]) => m.includes('(A3)'))).toBe(true)
  })

  it('la ruta abre el grupo del actual al montar (sin salto) y al cambiar modelValue', async () => {
    const w = mk({ modelValue: 'tabs' })
    expect(btn(w, 'Acciones').attributes('aria-expanded')).toBe('true')
    expect(body(w, 'Acciones').hasAttribute('hidden')).toBe(false)
    expect(group(w, 'Acciones').classList.contains('has-current')).toBe(true)
    await btn(w, 'Campos').trigger('click')
    await tick()
    expect(btn(w, 'Campos').attributes('aria-expanded')).toBe('false')
    await w.setProps({ modelValue: 'input' })
    await tick()
    expect(btn(w, 'Campos').attributes('aria-expanded')).toBe('true')
    expect(last(w, 'update:closedGroups')).not.toContain('campos')
  })

  it('controlado: la ruta abre en el primer render y emite tras montar', async () => {
    const w = mk({ closedGroups: ['acciones'], modelValue: 'btn' })
    expect(btn(w, 'Acciones').attributes('aria-expanded')).toBe('true')
    await tick()
    expect(w.emitted('update:closedGroups')[0][0]).toEqual([])
  })

  it('plegado con el actual dentro: groupCurrent en el botón y has-current en el li', async () => {
    const w = mk({ modelValue: 'combo' })
    expect(btn(w, 'Campos').find('.g-sidebar__sr').exists()).toBe(false)
    await btn(w, 'Campos').trigger('click')
    await tick()
    expect(btn(w, 'Campos').find('.g-sidebar__sr').text()).toBe(', contiene la página actual')
    expect(btn(w, 'Campos').text()).toContain('Campos de entrada')
  })

  it('beforematch abre el grupo y emite', async () => {
    const w = mk()
    body(w, 'Acciones').dispatchEvent(new Event('beforematch'))
    await tick()
    expect(btn(w, 'Acciones').attributes('aria-expanded')).toBe('true')
    expect(last(w, 'update:closedGroups')).toEqual([])
  })

  it('teclado: ↓ ↑ Inicio Fin recorren enlaces y botones de grupo visibles; los de un grupo plegado no', async () => {
    const w = mk()
    const intro = w.find('[data-id="intro"]')
    intro.element.focus()
    const seq = []
    for (let i = 0; i < 5; i++) {
      await document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
      seq.push(document.activeElement.textContent.trim())
    }
    expect(seq).toEqual(['Tema', 'Campos de entrada', 'GInput11, 11', 'GCombobox24, 24', 'Acciones'])
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
    expect(document.activeElement.textContent).toBe('Introducción')
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))
    expect(document.activeElement.textContent).toBe('Acciones')
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    expect(document.activeElement.textContent).toContain('GCombobox')
  })

  it('en default también; en el riel el título es span y todo abierto, con el estado conservado', async () => {
    const w = mk({ appearance: 'default', mode: 'expanded', labels: { ...LABELS } })
    expect(btn(w, 'Acciones').attributes('aria-expanded')).toBe('false')
    await w.setProps({ mode: 'rail' })
    await tick()
    expect(w.findAll('button.g-sidebar__group-title')).toHaveLength(0)
    expect(w.find('.g-sidebar__group-body[hidden]').exists()).toBe(false)
    await w.setProps({ mode: 'expanded' })
    await tick()
    expect(btn(w, 'Acciones').attributes('aria-expanded')).toBe('false')
  })
})

describe('GSidebar · grupos plegables con el filtro (#1035)', () => {
  const mkf = (props = {}) => mount(GSidebar, { attachTo: document.body, props: { ...base, filter: true, ...props }, global: { plugins: [SidebarFilter, SidebarIndex] } })
  it('con consulta: abierto sin animar, sin emitir y con aria-disabled; al vaciar vuelve a su estado', async () => {
    const w = mkf()
    await w.setProps({ query: 'tabs' })
    await tick()
    const b = btn(w, 'Acciones')
    expect(b.attributes('aria-expanded')).toBe('true')
    expect(b.attributes('aria-disabled')).toBe('true')
    expect(body(w, 'Acciones').hasAttribute('hidden')).toBe(false)
    expect(w.emitted('update:closedGroups')).toBeUndefined()
    await b.trigger('click')
    await tick()
    expect(w.emitted('update:closedGroups')).toBeUndefined()
    // El grupo sin coincidencias se oculta entero
    expect(group(w, 'Campos').hidden).toBe(true)
    await w.setProps({ query: '' })
    await tick()
    expect(btn(w, 'Acciones').attributes('aria-expanded')).toBe('false')
    expect(btn(w, 'Acciones').attributes('aria-disabled')).toBeUndefined()
    expect(body(w, 'Acciones').getAttribute('hidden')).toBe('until-found')
  })
})

describe('GSidebar · SSR e hidratación', () => {
  it('el servidor pinta los plegados con hidden="until-found" y la ruta abre el del actual; hidrata sin avisos', async () => {
    const props = { ...base, closedGroups: ['campos', 'acciones'], modelValue: 'combo' }
    const html = await renderToString(createSSRApp({ render: () => h(GSidebar, props) }).use(SidebarIndex))
    expect(html).toContain('hidden="until-found"')
    expect(html).toMatch(/aria-expanded="true" aria-controls="[^"]+-body"/)
    const el = document.createElement('div')
    el.innerHTML = html
    document.body.appendChild(el)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    createSSRApp({ render: () => h(GSidebar, props) }).use(SidebarIndex).mount(el)
    await tick()
    const mism = [...warn.mock.calls, ...error.mock.calls].filter(([m]) => /hydrat|mismatch/i.test(String(m)))
    expect(mism).toEqual([])
  })
})

describe('GSidebar · sin la extensión @grana/vue/sidebar-index (#1069)', () => {
  const LAB = { ...LABELS, collapse: 'Contraer', expand: 'Expandir' }
  it('index se pinta default entero: clase, botón de contraer, sin marca ni número al final; A5 una vez', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = bare({ modelValue: 'combo', closedGroups: ['campos'], labels: LAB })
    expect(w.classes()).toContain('g-sidebar--appearance-default')
    expect(w.find('.g-sidebar__toggle').exists()).toBe(true)
    expect(w.find('.g-sidebar__mark').exists()).toBe(false)
    expect(w.find('.g-sidebar__code').exists()).toBe(false)
    expect(w.find('[data-id="combo"] .g-sidebar__icon').attributes('data-code')).toBe('24')
    await w.setProps({ mode: 'rail' })
    expect(w.classes()).toContain('g-sidebar--mode-rail')
    expect(warn.mock.calls.filter(([m]) => m.includes('(A5)'))).toHaveLength(1)
    expect(warn.mock.calls.filter(([m]) => /\(A[123]\)/.test(m))).toHaveLength(0)
  })
  it('collapsible queda fijo y abierto (collapsed ignorado): título span, sin envoltorio ni hidden; closedGroups ignorado sin emitir', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = bare({ appearance: 'default', closedGroups: ['campos'], modelValue: 'intro', labels: LAB })
    expect(w.find('button.g-sidebar__group-title').exists()).toBe(false)
    expect(w.findAll('span.g-sidebar__group-title').map((t) => t.text())).toEqual(['Guía', 'Campos de entrada', 'Acciones'])
    expect(w.find('.g-sidebar__group-body').exists()).toBe(false)
    expect(w.find('[hidden]').exists()).toBe(false)
    expect(w.find('[data-id="btn"]').isVisible()).toBe(true)
    await w.setProps({ modelValue: 'tabs' })
    expect(w.emitted('update:closedGroups')).toBeUndefined()
    expect(w.find('.is-collapsible').exists()).toBe(false)
  })
  it('sin index, ni collapsible ni closedGroups: no avisa A5', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    bare({ appearance: 'default', items: [{ label: 'G', items: [{ id: 'a', label: 'A', href: '/a' }] }], modelValue: 'a', labels: LAB })
    expect(warn.mock.calls.some(([m]) => m.includes('(A5)'))).toBe(false)
  })
  it('drawer sin centrar el actual: el desplazamiento de la región no cambia al abrir', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = bare({ mode: 'drawer', modelValue: 'tabs', labels: LAB })
    await w.setProps({ open: true })
    await tick()
    expect(document.querySelector('.g-sidebar__drawer .g-sidebar__nav').scrollTop).toBe(0)
  })
})

describe('GSidebar · items sueltos con la extensión (grupo sin raw)', () => {
  const LOOSE = [{ id: 'a', label: 'Alfa', href: '/a' }, { id: 'b', label: 'Beta', href: '/b' }]
  it('cliente: monta con items sueltos y la extensión', () => {
    const w = mk({ items: LOOSE, modelValue: 'a', appearance: undefined })
    expect(w.findAll('a').length).toBeGreaterThanOrEqual(2)
  })
  it('cliente: appearance="index" con items sueltos', () => {
    const w = mk({ items: LOOSE, modelValue: 'a' })
    expect(w.text()).toContain('Beta')
  })
  it('SSR: renderiza items sueltos con la extensión', async () => {
    const app = createSSRApp({ render: () => h(GSidebar, { ...base, items: LOOSE, modelValue: 'a' }) })
    app.use(SidebarIndex)
    expect(await renderToString(app)).toContain('Beta')
  })
})
