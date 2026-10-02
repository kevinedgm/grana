// Huecos de icono «dato → nombre; plantilla → slot» (#202) y slot lead de GFormSection (#203)
// docs/contract/icons.md v0.2 §7 (prueba 8), docs/contract/api.md «Iconos en los componentes», design/contracts/form.md §3
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { LockOpen, Pencil, House, Folder } from 'lucide-static'
import GTabs from '../GTabs/GTabs.vue'
import GMenu from '../GMenu/GMenu.vue'
import GSidebar from '../GSidebar/GSidebar.vue'
import GFormSection from '../GFormSection/GFormSection.vue'
import GIcon from './GIcon.vue'
import { createIcons } from './registry.js'

beforeEach(() => {
  HTMLElement.prototype.showPopover = function () { this.setAttribute('data-popover-open', '') }
  HTMLElement.prototype.hidePopover = function () { this.removeAttribute('data-popover-open') }
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open') }
})
afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

const silence = () => vi.spyOn(console, 'warn').mockImplementation(() => {})
const REG = createIcons([LockOpen, Pencil, House, Folder])
const PENCIL = 'M21.174 6.812'
const HOUSE = 'M15 21v-8a1 1 0 0 0-1-1h-4'
const LOCK_OPEN = 'M7 11V7a5 5 0 0 1 9.9-1'
const flush = async () => { for (let i = 0; i < 4; i++) await nextTick() }

describe('GTabs · icon por nombre', () => {
  const items = [
    { id: 'home', label: 'Inicio', icon: 'house' },
    { id: 'lock', label: 'Bloqueo', icon: 'lock-open' },
    { id: 'lib', label: 'Ayuda', icon: 'circle-help' }, // de la librería, sin registrar
    { id: 'obj', label: 'Objeto', icon: { custom: true } },
    { id: 'none', label: 'Sin icono' }
  ]
  const mk = (props = {}, slots = {}) => mount(GTabs, { attachTo: document.body, props: { items, modelValue: 'home', label: 'Secciones', id: 't', ...props }, slots, global: { plugins: [REG] } })
  const iconOf = (w, id) => w.find(`#t-tab-${id} .g-tabs__icon`)

  it('icon cadena sin slot dibuja GIcon decorativo en g-tabs__icon (registro y librería); otro valor o sin icon, nada', () => {
    const w = mk()
    for (const [id, d] of [['home', HOUSE], ['lock', LOCK_OPEN], ['lib', 'M9.09 9a3 3 0 0 1 5.83 1']]) {
      const span = iconOf(w, id)
      expect(span.attributes('aria-hidden'), id).toBe('true')
      const svg = span.find('svg.g-icon')
      expect(svg.element.parentElement, id).toBe(span.element) // GIcon hijo directo del hueco
      expect(svg.html(), id).toContain(d)
    }
    expect(iconOf(w, 'obj').exists()).toBe(false)
    expect(iconOf(w, 'none').exists()).toBe(false)
    // el nombre accesible sigue siendo la etiqueta
    expect(w.find('#t-tab-home').text()).toBe('Inicio')
    w.unmount()
  })

  it('con slot icon, manda el slot (también con icon cadena)', () => {
    const w = mk({}, { icon: ({ item }) => h('i', { class: 'mine' }, String(item.id)) })
    expect(iconOf(w, 'home').find('i.mine').exists()).toBe(true)
    expect(iconOf(w, 'home').find('svg').exists()).toBe(false)
    expect(iconOf(w, 'obj').find('i.mine').exists()).toBe(true) // dato opaco para el slot
    w.unmount()
  })

  it('labelMode="icon": un icon cadena cuenta como icono (solo icono, la etiqueta queda en el DOM)', async () => {
    const warn = silence()
    const all = items.slice(0, 3)
    const w = mount(GTabs, { attachTo: document.body, props: { items: all, modelValue: 'home', label: 'S', id: 't', labelMode: 'icon' }, global: { plugins: [REG] } })
    await flush()
    expect(w.classes()).toContain('g-tabs--icon-only')
    for (const it of all) {
      expect(w.find(`#t-tab-${it.id}`).classes(), it.id).toContain('is-icon-only')
      expect(w.find(`#t-tab-${it.id} .g-tabs__label`).text()).toBe(it.label)
    }
    expect(warn.mock.calls.filter((c) => String(c[0]).includes('labelMode'))).toHaveLength(0)
    w.unmount()
  })

  it('labelMode="icon" sin slot: la pestaña con icon no cadena conserva su etiqueta y avisa', async () => {
    const warn = silence()
    const w = mount(GTabs, { attachTo: document.body, props: { items: [items[0], items[3]], modelValue: 'home', label: 'S', id: 't', labelMode: 'icon' }, global: { plugins: [REG] } })
    await flush()
    expect(w.find('#t-tab-home').classes()).toContain('is-icon-only')
    expect(w.find('#t-tab-obj').classes()).not.toContain('is-icon-only')
    expect(warn.mock.calls.filter((c) => String(c[0]).includes('labelMode')).length).toBe(1)
    w.unmount()
  })

  it('labelMode="auto": todas con icon cadena cuentan como «todas con icono»', async () => {
    // jsdom no mide: con todas las pestañas con icono, auto no avisa de falta de icono
    const warn = silence()
    const w = mount(GTabs, { attachTo: document.body, props: { items: items.slice(0, 3), modelValue: 'home', label: 'S', id: 't', labelMode: 'auto' }, global: { plugins: [REG] } })
    await flush()
    expect(warn.mock.calls.filter((c) => String(c[0]).includes('labelMode'))).toHaveLength(0)
    w.unmount()
  })
})

describe('GMenu · icon por nombre', () => {
  const ITEMS = [
    { id: 'edit', label: 'Editar', icon: 'pencil' },
    { id: 'unlock', label: 'Desbloquear', icon: 'lock-open' },
    { id: 'obj', label: 'Objeto', icon: { x: 1 } },
    { id: 'plain', label: 'Sin icono' },
    { type: 'checkbox', id: 'c', label: 'Casilla', checked: true, icon: 'pencil' }, // las casillas llevan su marca, no icono
    { label: 'Más', icon: 'folder', items: [{ id: 'sub', label: 'Hijo', icon: 'house' }] }
  ]
  const Host = (slots = {}) => defineComponent({
    setup() {
      const open = ref(true)
      return () => h(GMenu, { items: ITEMS, modelValue: open.value, 'onUpdate:modelValue': (v) => { open.value = v } }, { trigger: ({ attrs }) => h('button', { ...attrs, type: 'button' }, 'Acciones'), ...slots })
    }
  })
  const item = (w, label) => w.findAll('.g-menu__item').find((i) => i.find('.g-menu__label').text() === label)

  it('icon cadena sin slot dibuja GIcon decorativo en g-menu__icon; otro valor o sin icon, nada', async () => {
    const w = mount(Host(), { attachTo: document.body, global: { plugins: [REG] } })
    await flush()
    const edit = item(w, 'Editar').find('.g-menu__icon')
    expect(edit.attributes('aria-hidden')).toBe('true')
    expect(edit.find('svg.g-icon').html()).toContain(PENCIL)
    expect(item(w, 'Desbloquear').find('.g-menu__icon svg').html()).toContain(LOCK_OPEN)
    expect(item(w, 'Objeto').find('.g-menu__icon').exists()).toBe(false)
    expect(item(w, 'Sin icono').find('.g-menu__icon').exists()).toBe(false)
    expect(item(w, 'Casilla').find('.g-menu__icon').exists()).toBe(false)
    expect(item(w, 'Más').find('.g-menu__icon svg').exists()).toBe(true)
    w.unmount()
  })

  it('con slot icon, manda el slot', async () => {
    const w = mount(Host({ icon: ({ item: it }) => h('i', { class: 'mine' }, String(it.id)) }), { attachTo: document.body, global: { plugins: [REG] } })
    await flush()
    expect(item(w, 'Editar').find('.g-menu__icon i.mine').exists()).toBe(true)
    expect(item(w, 'Editar').find('.g-menu__icon svg').exists()).toBe(false)
    expect(item(w, 'Objeto').find('.g-menu__icon i.mine').exists()).toBe(true)
    w.unmount()
  })
})

describe('GSidebar · icon por nombre (primer nivel)', () => {
  const LABELS = { collapse: 'Contraer', expand: 'Expandir', more: 'Más', moreActive: 'contiene la página actual', drawer: 'Navegación', close: 'Cerrar' }
  const ITEMS = [
    { id: 'home', label: 'Inicio', href: '#', icon: 'house' },
    { id: 'lock', label: 'Bloqueo', href: '#l', icon: 'lock-open' },
    { id: 'obj', label: 'Objeto', href: '#o', icon: { x: 1 } },
    { id: 'proj', label: 'Proyectos', icon: 'folder', children: [{ id: 'p1', label: 'Todos', href: '#p', icon: 'house' }] }
  ]
  const mk = (slots = {}) => mount(GSidebar, { attachTo: document.body, props: { items: ITEMS, label: 'Principal', labels: LABELS, modelValue: 'home', mode: 'expanded' }, slots, global: { plugins: [REG] } })
  const iconOf = (w, id) => w.find(`.g-sidebar__nav [data-id="${id}"] .g-sidebar__icon`)

  it('icon cadena sin slot dibuja GIcon en g-sidebar__icon (aria-hidden); otro valor, hueco vacío; los hijos no llevan icono', async () => {
    const w = mk()
    await flush()
    const home = w.find('.g-sidebar__nav .g-sidebar__link .g-sidebar__icon')
    expect(home.attributes('aria-hidden')).toBe('true')
    expect(home.find('svg.g-icon').html()).toContain(HOUSE)
    const icons = w.findAll('.g-sidebar__nav .g-sidebar__icon')
    const html = icons.map((s) => s.html()).join('')
    expect(html).toContain(LOCK_OPEN)
    // 4 items de primer nivel: tres con svg (house, lock-open, folder) y el de objeto vacío
    expect(icons.filter((s) => s.find('svg').exists())).toHaveLength(3)
    expect(icons.filter((s) => !s.find('svg').exists())).toHaveLength(1)
    // ningún hijo dibuja icono (aunque traiga icon)
    expect(w.findAll('.g-sidebar__nav .g-sidebar__icon')).toHaveLength(4)
    w.unmount()
  })

  it('con slot icon, manda el slot', async () => {
    const w = mk({ icon: ({ item }) => h('i', { class: 'mine' }, String(item.id)) })
    await flush()
    const icons = w.findAll('.g-sidebar__nav .g-sidebar__icon')
    expect(icons.every((s) => s.find('i.mine').exists())).toBe(true)
    expect(icons.some((s) => s.find('svg').exists())).toBe(false)
    w.unmount()
  })

  it('el navbar (móvil) también dibuja el icono por nombre', async () => {
    const w = mount(GSidebar, { attachTo: document.body, props: { items: ITEMS, label: 'Principal', labels: LABELS, modelValue: 'home', mode: 'navbar' }, global: { plugins: [REG] } })
    await flush()
    const tabIcons = w.findAll('.g-sidebar__tab .g-sidebar__icon')
    expect(tabIcons.length).toBeGreaterThan(0)
    expect(tabIcons[0].find('svg.g-icon').html()).toContain(HOUSE)
    w.unmount()
  })
})

describe('GFormSection · slot lead (#203)', () => {
  it('sin slot lead no hay hueco: el título abre __heading', () => {
    const w = mount(GFormSection, { props: { title: 'Datos' } })
    expect(w.find('.g-form-section__lead').exists()).toBe(false)
    expect(w.find('.g-form-section__heading').element.firstElementChild.tagName).toBe('H3')
  })

  it('con slot lead: <span class="g-form-section__lead" aria-hidden="true"> primer hijo de __heading, inmediatamente antes del hN, fuera de él', () => {
    const w = mount(GFormSection, { props: { title: 'Seguridad', optional: true }, slots: { lead: () => h(GIcon, { name: 'lock' }) }, global: { plugins: [REG] } })
    silence()
    const heading = w.find('.g-form-section__heading').element
    const lead = heading.firstElementChild
    expect(lead.className).toBe('g-form-section__lead')
    expect(lead.getAttribute('aria-hidden')).toBe('true')
    expect(lead.nextElementSibling.tagName).toBe('H3')
    expect(lead.nextElementSibling.classList.contains('g-form-section__title')).toBe(true)
    // sin nodos intermedios (ni comentarios) entre lead y título
    expect(lead.nextSibling).toBe(lead.nextElementSibling)
    expect(lead.querySelector('svg.g-icon')).not.toBeNull()
    expect(w.find('h3').text()).toBe('Seguridad')
    expect(w.find('h3').find('svg').exists()).toBe(false)
  })

  it('un GIcon con label dentro del lead avisa en desarrollo (el nombre se pierde)', async () => {
    const warn = silence()
    mount(GFormSection, { props: { title: 'Acceso' }, slots: { lead: () => h(GIcon, { name: 'lock-open', label: 'Desbloqueado' }) }, global: { plugins: [REG] }, attachTo: document.body })
    await nextTick()
    expect(warn.mock.calls.filter((c) => String(c[0]).includes('aria-hidden') && String(c[0]).includes('lock-open'))).toHaveLength(1)
  })
})
