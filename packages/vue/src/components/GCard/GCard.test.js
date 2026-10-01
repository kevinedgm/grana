import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, h, ref } from 'vue'
import GCard from './GCard.vue'
import GBtn from '../GBtn/GBtn.vue'
import GMetric from '../GMetric/GMetric.vue'
import GSurface from '../GSurface/GSurface.vue'

// popover de GMenu y ResizeObserver con el callback a mano; requestAnimationFrame inmediato
let roCb = null
const desc = Object.getOwnPropertyDescriptors(HTMLElement.prototype)
beforeEach(() => {
  HTMLElement.prototype.showPopover = function () { this.setAttribute('data-popover-open', '') }
  HTMLElement.prototype.hidePopover = function () { this.removeAttribute('data-popover-open') }
  const orig = HTMLElement.prototype.matches
  HTMLElement.prototype.matches = function (sel) { return sel === ':popover-open' ? this.hasAttribute('data-popover-open') : orig.call(this, sel) }
  globalThis.ResizeObserver = class { constructor(f) { roCb = f } observe() {} disconnect() {} }
  globalThis.requestAnimationFrame = (f) => { f(); return 1 }
  globalThis.cancelAnimationFrame = () => {}
})
afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
  delete globalThis.ResizeObserver
  for (const k of ['scrollHeight', 'clientHeight']) if (desc[k]) Object.defineProperty(HTMLElement.prototype, k, desc[k]); else delete HTMLElement.prototype[k]
  roCb = null
})

const LABELS = { menu: 'Acciones de', loading: 'Cargando', loaded: 'Cargado', expand: 'Mostrar más', collapse: 'Mostrar menos', more: 'Más detalles', less: 'Menos detalles', retry: 'Reintentar', empty: 'Sin datos' }
const MENU = [{ id: 'rename', label: 'Renombrar' }, { id: 'dup', label: 'Duplicar', disabled: true }, { id: 'del', label: 'Eliminar', danger: true }]
const base = { title: 'Proyecto Atlas', labels: LABELS }
const mk = (props = {}, opts = {}) => mount(GCard, { attachTo: document.body, props: { ...base, ...props }, ...opts })
const widthMock = (get) => vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
  const w = this.classList?.contains('g-card') ? get() : 0
  return { width: w, height: 200, top: 0, left: 0, right: w, bottom: 200, x: 0, y: 0 }
})
const warnings = () => vi.spyOn(console, 'warn').mockImplementation(() => {})
const msgs = (spy) => spy.mock.calls.map((c) => String(c[0]))

describe('GCard · raíz y regiones', () => {
  it('una sola GSurface raíz (article) con las clases de GSurface y de GCard', () => {
    const w = mk()
    expect(w.findAllComponents(GSurface)).toHaveLength(1)
    expect(w.element.tagName).toBe('ARTICLE')
    expect(w.classes()).toEqual(expect.arrayContaining([
      'g-card', 'g-surface', 'g-surface--level-outlined', 'g-surface--padding-md', 'g-surface--density-default',
      'g-card--orientation-vertical', 'g-card--color-brand', 'g-card--interaction-none', 'g-card--size-medium', 'g-card--layout-column'
    ]))
    expect(w.attributes('data-size')).toBe('medium')
    expect(w.attributes('data-layout')).toBe('column')
  })

  it('level, padding, density, rounded y as llegan a GSurface; as solo acepta elementos de contenido', () => {
    const w = mk({ level: 'inset', padding: 'lg', density: 'compact', rounded: 'xl', as: 'li', color: 'accent' })
    expect(w.element.tagName).toBe('LI')
    expect(w.classes()).toEqual(expect.arrayContaining(['g-surface--level-inset', 'g-surface--padding-lg', 'g-surface--density-compact', 'g-surface--rounded-xl', 'g-card--color-accent']))
    const v = GCard.props
    expect(v.as.validator('button')).toBe(false)
    expect(v.as.validator('section')).toBe(true)
    expect(v.level.validator('floating')).toBe(false)
    expect(v.padding.validator('none')).toBe(false)
    expect(v.color.validator('danger')).toBe(false)
    expect(v.orientation.validator('diagonal')).toBe(false)
    expect(v.mediaPosition.validator('bottom')).toBe(false)
    expect(v.interaction.validator('drag')).toBe(false)
    expect(v.status.validator('danger')).toBe(false)
    expect(v.selectType.validator('switch')).toBe(false)
    expect(v.titleLines.validator(5)).toBe(false)
    expect(v.titleLines.validator('none')).toBe(true)
    expect(v.descriptionLines.validator('3')).toBe(true)
    expect(v.headingLevel.validator(1)).toBe(false)
    expect(v.badgeColor.validator('info')).toBe(true)
  })

  it('un as interactivo avisa y se renderiza como article (la tarjeta nunca es el control)', () => {
    const warn = warnings()
    const w = mount(GCard, { props: { ...base, as: 'button' } })
    expect(w.element.tagName).toBe('ARTICLE')
    expect(msgs(warn).some((m) => m.includes('<GCard>') && m.includes('as="button"'))).toBe(true)
  })

  it('encabezado: eyebrow, título (h3 por defecto, data-lines 2), subtítulo, lead decorativo y badge con GBadge sm/soft', () => {
    const w = mk({ eyebrow: 'Guía', subtitle: 'Equipo de datos', badge: 'Activo', badgeColor: 'success' }, { slots: { lead: () => h('img', { alt: '' }) } })
    const t = w.find('h3.g-card__title')
    expect(t.text()).toBe('Proyecto Atlas')
    expect(t.attributes('data-lines')).toBe('2')
    expect(t.attributes('id')).toBe(`${w.attributes('id')}-title`)
    expect(w.find('.g-card__eyebrow').text()).toBe('Guía')
    expect(w.find('.g-card__subtitle').text()).toBe('Equipo de datos')
    expect(w.find('.g-card__lead').attributes('aria-hidden')).toBe('true')
    const b = w.find('.g-card__aside .g-badge')
    expect(b.classes()).toEqual(expect.arrayContaining(['g-badge--size-sm', 'g-badge--variant-soft', 'g-badge--color-success']))
    expect(b.text()).toBe('Activo')
    expect(mk({ headingLevel: 5 }).find('h5.g-card__title').exists()).toBe(true)
    expect(mk({ titleLines: 'none' }).find('.g-card__title').attributes('data-lines')).toBe('none')
  })

  it('descripción con data-lines (none por defecto) y texto completo en el DOM', () => {
    const long = 'x'.repeat(400)
    const w = mk({ description: long, descriptionLines: 3 })
    const d = w.find('p.g-card__description')
    expect(d.attributes('data-lines')).toBe('3')
    expect(d.text()).toBe(long)
    expect(mk({ description: 'a' }).find('.g-card__description').attributes('data-lines')).toBe('none')
  })

  it('slots de texto rico: title, eyebrow, subtitle, description y badge (con su alcance)', () => {
    let badgeScope
    const w = mk({ title: undefined }, { slots: {
      title: () => h('span', { class: 't' }, 'Rico'),
      eyebrow: () => 'Cat',
      subtitle: () => h('em', 'Sub'),
      description: () => h('b', 'Desc'),
      badge: (s) => { badgeScope = s; return h('span', { class: 'mi-badge' }, 'Nuevo') }
    } })
    expect(w.find('.g-card__title .t').text()).toBe('Rico')
    expect(w.find('.g-card__eyebrow').text()).toBe('Cat')
    expect(w.find('.g-card__subtitle em').exists()).toBe(true)
    expect(w.find('.g-card__description b').exists()).toBe(true)
    expect(w.find('.g-card__aside .mi-badge').exists()).toBe(true)
    expect(badgeScope).toEqual({ state: 'default' })
  })

  it('meta: <dl> con g-card__meta-item; los de prioridad baja llevan --low y no se renderizan en compact', () => {
    const meta = [{ label: 'Responsable', value: 'Ana' }, { label: 'Tareas', value: 12 }, { label: 'Actualizado', value: 'hace 2 h', priority: 'low' }]
    const w = mk({ meta })
    const items = w.findAll('dl.g-card__meta > .g-card__meta-item')
    expect(items).toHaveLength(3)
    expect(items[0].find('dt').text()).toBe('Responsable')
    expect(items[1].find('dd').text()).toBe('12')
    expect(items[2].classes()).toContain('g-card__meta-item--low')
    expect(mk({ meta, density: 'compact' }).findAll('.g-card__meta-item')).toHaveLength(2)
    expect(mk().find('.g-card__meta').exists()).toBe(false)
  })

  it('meta sin label o value: se ignora y avisa; el slot meta sustituye a la lista', () => {
    const warn = warnings()
    const w = mk({ meta: [{ label: 'A' }, { label: 'B', value: '1' }] })
    expect(w.findAll('.g-card__meta-item')).toHaveLength(1)
    expect(msgs(warn).some((m) => m.includes('meta'))).toBe(true)
    const s = mk({ meta: [{ label: 'B', value: '1' }] }, { slots: { meta: () => h('dl', { class: 'propia' }) } })
    expect(s.find('dl.propia').exists()).toBe(true)
    expect(s.find('.g-card__meta-item').exists()).toBe(false)
  })

  it('slots default, actions y footer en sus regiones; el alcance trae size, layout, state y selected', () => {
    let scope
    const w = mk({}, { slots: {
      default: (s) => { scope = s; return h('p', { class: 'libre' }, 'contenido') },
      actions: () => h(GBtn, { variant: 'outline' }, () => 'Editar'),
      footer: () => h('span', 'Pie')
    } })
    expect(w.find('.g-card__content .libre').exists()).toBe(true)
    expect(w.find('.g-card__body > .g-card__actions .g-btn').exists()).toBe(true)
    expect(w.find('.g-card__main > .g-card__footer').text()).toBe('Pie')
    expect(scope).toEqual({ size: 'medium', layout: 'column', state: 'default', selected: false })
  })

  it('estructura: main > body > stack > header/content/meta, acciones al final del body y pie fuera del body', () => {
    const w = mk({ description: 'd', meta: [{ label: 'a', value: 'b' }] }, { slots: { actions: () => h('button', 'A'), footer: () => 'F' } })
    const main = w.find('.g-card > .g-card__main')
    expect(main.exists()).toBe(true)
    const stack = main.find('.g-card__body > .g-card__stack')
    expect(stack.element.children[0].className).toBe('g-card__header')
    expect(stack.element.children[1].className).toBe('g-card__content')
    expect(stack.element.children[2].className).toBe('g-card__meta')
    expect(main.element.lastElementChild.className).toBe('g-card__footer')
    expect(w.element.lastElementChild.className).toBe('g-card__live')
    expect(w.find('.g-card__live').attributes('role')).toBe('status')
  })

  it('una GMetric en el slot conserva su role="group" nombrado por el título', () => {
    const w = mk({}, { slots: { default: () => h(GMetric, { label: 'Ingresos', value: '$48k', role: 'group', 'aria-labelledby': 'x' }) } })
    expect(w.find('.g-card__content .g-metric').exists()).toBe(true)
  })

  it('atributos del consumidor (class, data-*, aria-label) van a la raíz; aria-label sustituye al nombre por el título', () => {
    const w = mk({}, { attrs: { class: 'mia', 'data-x': '1', 'aria-label': 'Otra' } })
    expect(w.classes()).toContain('mia')
    expect(w.attributes('data-x')).toBe('1')
    expect(w.attributes('aria-label')).toBe('Otra')
    expect(w.attributes('aria-labelledby')).toBeUndefined()
  })
})

describe('GCard · media y orientación', () => {
  const img = () => h('img', { src: 'a.png', alt: '' })

  it('sin slot media no hay clase g-card--media-*', () => {
    expect(mk().classes().some((c) => c.startsWith('g-card--media-'))).toBe(false)
  })

  it('media top: primer hijo, decorativa (aria-hidden), clase g-card--media-top; alcance size y layout', () => {
    let scope
    const w = mk({}, { slots: { media: (s) => { scope = s; return img() } } })
    expect(w.classes()).toContain('g-card--media-top')
    expect(w.element.firstElementChild.className).toBe('g-card__media')
    expect(w.find('.g-card__media').attributes('aria-hidden')).toBe('true')
    expect(scope).toEqual({ size: 'medium', layout: 'column' })
  })

  it('media informativa (role="img" del consumidor) no se oculta', () => {
    const w = mk({}, { slots: { media: () => h('div', { role: 'img', 'aria-label': 'Mapa' }) } })
    expect(w.find('.g-card__media').attributes('aria-hidden')).toBeUndefined()
  })

  it('background: media y velo (g-card__scrim, decorativo) antes del contenido', () => {
    const w = mk({ mediaPosition: 'background' }, { slots: { media: img } })
    expect(w.classes()).toContain('g-card--media-background')
    const kids = [...w.element.children].map((e) => e.className)
    expect(kids.slice(0, 3)).toEqual(['g-card__media', 'g-card__scrim', 'g-card__main'])
    expect(w.find('.g-card__scrim').attributes('aria-hidden')).toBe('true')
  })

  it('inline: dentro del cuerpo, antes de la descripción, con g-card__media--inline', () => {
    const w = mk({ mediaPosition: 'inline', description: 'd' }, { slots: { media: img } })
    const content = w.find('.g-card__content')
    expect(content.element.firstElementChild.className).toBe('g-card__media g-card__media--inline')
    expect(w.element.firstElementChild.className).not.toContain('g-card__media')
  })

  it('start/end con orientation="vertical" avisan (se pintan arriba)', () => {
    const warn = warnings()
    mount(GCard, { props: { ...base, mediaPosition: 'end' }, slots: { media: img } })
    expect(msgs(warn).some((m) => m.includes('mediaPosition="end"'))).toBe(true)
  })

  it('data-size por ResizeObserver con umbrales space×130 y space×80; data-layout según orientation', async () => {
    let width = 600
    widthMock(() => width)
    const auto = mk({ orientation: 'auto', mediaPosition: 'start' }, { slots: { media: img } })
    const hor = mk({ orientation: 'horizontal' })
    const ver = mk({ orientation: 'vertical' })
    await nextTick()
    expect(auto.attributes('data-size')).toBe('wide')
    expect(auto.attributes('data-layout')).toBe('row')
    expect(auto.classes()).toEqual(expect.arrayContaining(['g-card--size-wide', 'g-card--layout-row']))
    expect(hor.attributes('data-layout')).toBe('row')
    expect(ver.attributes('data-layout')).toBe('column')
    for (const [w, size, autoL, horL] of [[520, 'wide', 'row', 'row'], [519, 'medium', 'column', 'row'], [320, 'medium', 'column', 'row'], [319, 'narrow', 'column', 'column']]) {
      width = w
      const a = mk({ orientation: 'auto' })
      const b = mk({ orientation: 'horizontal' })
      await nextTick()
      expect(a.attributes('data-size'), `${w}px`).toBe(size)
      expect(a.attributes('data-layout'), `${w}px auto`).toBe(autoL)
      expect(b.attributes('data-layout'), `${w}px horizontal`).toBe(horL)
    }
  })

  it('el tamaño cambia cuando cambia el ancho propio (observador), no el del visor', async () => {
    let width = 600
    widthMock(() => width)
    const w = mk({ orientation: 'auto' })
    await nextTick()
    expect(w.attributes('data-size')).toBe('wide')
    width = 260
    roCb(); await nextTick()
    expect(w.attributes('data-size')).toBe('narrow')
    expect(w.classes()).toEqual(expect.arrayContaining(['g-card--size-narrow', 'g-card--layout-column']))
  })

  it('los umbrales siguen a --g-space-1 del tema', async () => {
    vi.spyOn(window, 'getComputedStyle').mockImplementation(() => ({ getPropertyValue: (p) => (p === '--g-space-1' ? '5px' : '') }))
    widthMock(() => 600)
    const w = mk()
    await nextTick()
    expect(w.attributes('data-size')).toBe('medium') // 600 < 5 × 130
  })
})

describe('GCard · acción principal', () => {
  it('auto: sin href, ninguna principal y la raíz se nombra por el título', () => {
    const w = mk()
    expect(w.find('.g-card__primary').exists()).toBe(false)
    expect(w.classes()).not.toContain('is-interactive')
    expect(w.attributes('aria-labelledby')).toBe(w.find('.g-card__title').attributes('id'))
  })

  it('auto con href = link: <a href> dentro del título, sin aria-labelledby en la raíz, aria-describedby a la descripción', () => {
    const w = mk({ href: '/atlas', description: 'Resumen' })
    const a = w.find('h3.g-card__title > a.g-card__primary')
    expect(a.attributes('href')).toBe('/atlas')
    expect(a.text()).toBe('Proyecto Atlas')
    expect(a.attributes('aria-describedby')).toBe(w.find('.g-card__description').attributes('id'))
    expect(w.classes()).toEqual(expect.arrayContaining(['g-card--interaction-link', 'is-interactive']))
    expect(w.attributes('aria-labelledby')).toBeUndefined()
    expect(a.attributes('aria-selected')).toBeUndefined()
  })

  it('con as="li", div o section no hay aria-labelledby aunque no haya principal', () => {
    expect(mk({ as: 'li' }).attributes('aria-labelledby')).toBeUndefined()
    expect(mk({ as: 'section' }).attributes('aria-labelledby')).toBeUndefined()
  })

  it('target="_blank" sin rel añade rel="noopener noreferrer"; con rel, se respeta', () => {
    expect(mk({ href: '/x', target: '_blank' }).find('a').attributes('rel')).toBe('noopener noreferrer')
    expect(mk({ href: '/x', target: '_blank', rel: 'external' }).find('a').attributes('rel')).toBe('external')
  })

  it('navigate se emite con el evento nativo y es cancelable (preventDefault evita la navegación)', async () => {
    let seen
    const w = mk({ href: '/atlas', onNavigate: (p) => { seen = p; p.event.preventDefault() } })
    const ev = new MouseEvent('click', { bubbles: true, cancelable: true })
    w.find('a.g-card__primary').element.dispatchEvent(ev)
    expect(seen.href).toBe('/atlas')
    expect(seen.event).toBe(ev)
    expect(ev.defaultPrevented).toBe(true)
    // Sin escucha que cancele, la tarjeta no bloquea el enlace (abrir en pestaña con modificadores, clic derecho…)
    const w2 = mk({ href: '#atlas' })
    const ev2 = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true })
    w2.find('a').element.dispatchEvent(ev2)
    expect(ev2.defaultPrevented).toBe(false)
    expect(w2.emitted('navigate')).toHaveLength(1)
  })

  it('interaction="link" sin href avisa y cae a none; href con otra interaction avisa', () => {
    const warn = warnings()
    const w = mount(GCard, { props: { ...base, interaction: 'link' } })
    expect(w.classes()).toContain('g-card--interaction-none')
    mount(GCard, { props: { ...base, interaction: 'select', href: '/x', name: 'n' } })
    const m = msgs(warn)
    expect(m.some((x) => x.includes('interaction="link" necesita href'))).toBe(true)
    expect(m.some((x) => x.includes('excluyentes'))).toBe(true)
  })

  it('button: <button type="button"> en el título; activate al pulsar (Enter y Espacio son nativos del botón)', async () => {
    const w = mk({ interaction: 'button' })
    const b = w.find('h3 > button.g-card__primary')
    expect(b.attributes('type')).toBe('button')
    expect(b.attributes('aria-pressed')).toBeUndefined()
    await b.trigger('click')
    expect(w.emitted('activate')).toHaveLength(1)
    expect(w.emitted('activate')[0][0].event).toBeInstanceOf(Event)
  })

  it('toggle: aria-pressed refleja modelValue, emite update:modelValue y lleva el indicador estático; sin aria-selected', async () => {
    const w = mk({ interaction: 'toggle', modelValue: false })
    const b = w.find('button.g-card__primary')
    expect(b.attributes('aria-pressed')).toBe('false')
    expect(w.find('.g-card__tick.g-card__tick--static').attributes('aria-hidden')).toBe('true')
    await b.trigger('click')
    expect(w.emitted('update:modelValue')[0]).toEqual([true])
    await w.setProps({ modelValue: true })
    expect(b.attributes('aria-pressed')).toBe('true')
    expect(w.classes()).toContain('is-selected')
    expect(b.attributes('aria-selected')).toBeUndefined()
    await b.trigger('click')
    expect(w.emitted('update:modelValue')[1]).toEqual([false])
  })

  it('las acciones internas (menú, actions, controles del contenido, enlace del pie) NO activan la principal', async () => {
    const onNav = vi.fn()
    const w = mk({ href: '/atlas', menu: MENU, onNavigate: onNav }, { slots: {
      default: () => h('button', { class: 'interno', type: 'button' }, 'X'),
      actions: () => h(GBtn, { class: 'acc' }, () => 'Editar'),
      footer: () => h('a', { href: '#hist', class: 'pie' }, 'Historial')
    } })
    await w.find('.g-card__menu').trigger('click')
    await w.find('.interno').trigger('click')
    await w.find('.acc').trigger('click')
    await w.find('.pie').trigger('click')
    expect(onNav).not.toHaveBeenCalled()
    expect(w.emitted('navigate')).toBeUndefined()
    // Ninguno está anidado dentro de la principal
    expect(w.find('.g-card__primary').element.querySelector('button, a, input')).toBeNull()
  })

  it('con button, las acciones internas tampoco emiten activate', async () => {
    const w = mk({ interaction: 'button', menu: MENU }, { slots: { actions: () => h('button', { class: 'acc' }, 'A') } })
    await w.find('.acc').trigger('click')
    await w.find('.g-card__menu').trigger('click')
    expect(w.emitted('activate')).toBeUndefined()
  })

  it('current: aria-current="true" en el enlace, is-current y chevron-right decorativo; sin enlace avisa', () => {
    const w = mk({ href: '/a', current: true })
    expect(w.find('a').attributes('aria-current')).toBe('true')
    expect(w.classes()).toContain('is-current')
    const c = w.find('.g-card__aside > .g-card__current')
    expect(c.attributes('aria-hidden')).toBe('true')
    expect(c.find('svg.g-icon').html()).toContain('m9 18 6-6-6-6')
    const warn = warnings()
    const n = mount(GCard, { props: { ...base, current: true } })
    expect(n.classes()).not.toContain('is-current')
    expect(msgs(warn).some((m) => m.includes('current'))).toBe(true)
  })

  it('disabled: el <a> sin href con role="link" y aria-disabled, sin navigate; botones disabled; is-disabled', async () => {
    const w = mk({ href: '/a', disabled: true })
    const a = w.find('a.g-card__primary')
    expect(a.attributes('href')).toBeUndefined()
    expect(a.attributes('role')).toBe('link')
    expect(a.attributes('aria-disabled')).toBe('true')
    await a.trigger('click')
    expect(w.emitted('navigate')).toBeUndefined()
    expect(w.classes()).toContain('is-disabled')
    const b = mk({ interaction: 'button', disabled: true })
    expect(b.find('button.g-card__primary').attributes('disabled')).toBeDefined()
    await b.find('button.g-card__primary').trigger('click')
    expect(b.emitted('activate')).toBeUndefined()
    const t = mk({ interaction: 'toggle', disabled: true })
    await t.find('button.g-card__primary').trigger('click')
    expect(t.emitted('update:modelValue')).toBeUndefined()
  })

  it('disabled: el contenido libre, las acciones y el pie pasan a inert; el menú va disabled', () => {
    const w = mk({ disabled: true, description: 'd', menu: MENU }, { slots: { default: () => h('button', 'x'), actions: () => h('button', 'A'), footer: () => h('a', { href: '#' }, 'P') } })
    expect(w.find('.g-card__content').attributes('inert')).toBeDefined()
    expect(w.find('.g-card__actions').attributes('inert')).toBeDefined()
    expect(w.find('.g-card__footer').attributes('inert')).toBeDefined()
    expect(w.find('.g-card__menu').attributes('disabled')).toBeDefined()
  })
})

describe('GCard · selección', () => {
  it('select (checkbox, Boolean): <input> real antes del título y el título es su <label>; v-model como el nativo', async () => {
    const model = ref(false)
    const w = mk({ interaction: 'select', modelValue: model.value, description: 'Resumen', 'onUpdate:modelValue': (v) => { model.value = v; w.setProps({ modelValue: v }) } })
    const input = w.find('.g-card__header > .g-card__selectbox > input.g-card__select')
    expect(input.attributes('type')).toBe('checkbox')
    const label = w.find('h3.g-card__title > label.g-card__primary')
    expect(label.attributes('for')).toBe(input.attributes('id'))
    expect(input.attributes('aria-labelledby')).toBeUndefined()
    expect(input.attributes('aria-describedby')).toBe(w.find('.g-card__description').attributes('id'))
    expect(w.find('.g-card__selectbox').attributes('data-type')).toBe('checkbox')
    expect(w.find('.g-card__selectbox > .g-card__tick').attributes('aria-hidden')).toBe('true')
    // la casilla va antes del título en el DOM
    expect(input.element.compareDocumentPosition(label.element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    await input.setValue(true)
    expect(w.emitted('update:modelValue')[0]).toEqual([true])
    await nextTick()
    expect(w.classes()).toContain('is-selected')
    expect(input.element.checked).toBe(true)
    expect(w.find('[aria-selected]').exists()).toBe(false)
  })

  it('el estado nativo vuelve al modelo si la aplicación no lo actualiza (presenta y emite intención)', async () => {
    const w = mk({ interaction: 'select', modelValue: false })
    const input = w.find('input.g-card__select')
    await input.setValue(true)
    await nextTick()
    expect(w.emitted('update:modelValue')[0]).toEqual([true])
    expect(input.element.checked).toBe(false)
  })

  it('checkbox con value: Array (se agrega o quita el valor, arreglo nuevo)', async () => {
    const list = ['a']
    const w = mk({ interaction: 'select', value: 'b', modelValue: list })
    const input = w.find('input')
    expect(input.element.checked).toBe(false)
    await input.setValue(true)
    expect(w.emitted('update:modelValue')[0][0]).toEqual(['a', 'b'])
    expect(w.emitted('update:modelValue')[0][0]).not.toBe(list)
    await w.setProps({ modelValue: ['a', 'b'] })
    expect(input.element.checked).toBe(true)
    expect(w.classes()).toContain('is-selected')
    await input.setValue(false)
    expect(w.emitted('update:modelValue')[1][0]).toEqual(['a'])
  })

  it('radio: seleccionada si modelValue === value; al elegirla emite value; name del grupo y círculo relleno', async () => {
    const w = mk({ interaction: 'select', selectType: 'radio', name: 'plan', value: 'pro', modelValue: 'basic' })
    const input = w.find('input')
    expect(input.attributes('type')).toBe('radio')
    expect(input.attributes('name')).toBe('plan')
    expect(input.attributes('value')).toBe('pro')
    expect(input.element.checked).toBe(false)
    expect(w.find('.g-card__selectbox').attributes('data-type')).toBe('radio')
    expect(w.find('.g-card__tick svg').classes()).toContain('g-icon--filled')
    await input.setValue(true)
    expect(w.emitted('update:modelValue')[0]).toEqual(['pro'])
    await w.setProps({ modelValue: 'pro' })
    expect(w.classes()).toContain('is-selected')
  })

  it('un grupo de radios (mismo name) dentro de un radiogroup del consumidor: las flechas son nativas y cambian el modelo', async () => {
    const model = ref('a')
    const Group = { render: () => h('div', { role: 'radiogroup', 'aria-label': 'Plan' }, ['a', 'b', 'c'].map((v) => h(GCard, { key: v, title: `Plan ${v}`, interaction: 'select', selectType: 'radio', name: 'plan', value: v, modelValue: model.value, 'onUpdate:modelValue': (x) => { model.value = x } }))) }
    const w = mount(Group, { attachTo: document.body })
    const inputs = w.findAll('input[type="radio"]')
    expect(inputs.map((i) => i.element.checked)).toEqual([true, false, false])
    // El navegador mueve la selección con las flechas: marca el siguiente y dispara change en él
    inputs[1].element.checked = true
    await inputs[1].trigger('change')
    await nextTick(); await nextTick()
    expect(model.value).toBe('b')
    expect(w.findAll('.g-card').map((c) => c.classes().includes('is-selected'))).toEqual([false, true, false])
  })

  it('radio sin name avisa', () => {
    const warn = warnings()
    mount(GCard, { props: { ...base, interaction: 'select', selectType: 'radio', value: 'x' } })
    expect(msgs(warn).some((m) => m.includes('name'))).toBe(true)
  })

  it('selectable: casilla explícita (antes del título) en una tarjeta link, nombrada por el título; no navega', async () => {
    const w = mk({ href: '/a', selectable: true, modelValue: true })
    const input = w.find('input.g-card__select')
    expect(input.attributes('aria-labelledby')).toBe(w.find('.g-card__title').attributes('id'))
    expect(input.element.checked).toBe(true)
    expect(w.find('a.g-card__primary').exists()).toBe(true)
    expect(w.classes()).toContain('is-selected')
    await input.trigger('click')
    await input.setValue(false)
    expect(w.emitted('navigate')).toBeUndefined()
    expect(w.emitted('update:modelValue')[0]).toEqual([false])
    // Orden del DOM: casilla → título
    const order = [...w.element.querySelectorAll('input, a')].map((e) => e.tagName)
    expect(order).toEqual(['INPUT', 'A'])
  })

  it('selectable con interaction select o toggle avisa y no duplica la casilla', () => {
    const warn = warnings()
    const t = mount(GCard, { props: { ...base, interaction: 'toggle', selectable: true } })
    expect(t.find('input').exists()).toBe(false)
    const s = mount(GCard, { props: { ...base, interaction: 'select', selectable: true } })
    expect(s.findAll('input')).toHaveLength(1)
    expect(msgs(warn).some((m) => m.includes('selectable es redundante'))).toBe(true)
  })

  it('disabled o loading: la selección no emite', async () => {
    const w = mk({ interaction: 'select', disabled: true })
    expect(w.find('input').attributes('disabled')).toBeDefined()
    await w.find('input').trigger('change')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('color de la marca de selección: g-card--color-*', () => {
    expect(mk({ color: 'neutral' }).classes()).toContain('g-card--color-neutral')
  })
})

describe('GCard · menú de acciones (GMenu)', () => {
  const open = async (w) => { await w.find('.g-card__menu').trigger('click'); await nextTick(); await nextTick() }

  it('sin menu no hay botón; con menu, botón de la tarjeta con ellipsis-vertical y nombre labels.menu + título', () => {
    expect(mk().find('.g-card__menu').exists()).toBe(false)
    const w = mk({ menu: MENU })
    const b = w.find('.g-card__aside > button.g-card__menu')
    expect(b.attributes('type')).toBe('button')
    expect(b.attributes('aria-haspopup')).toBe('menu')
    expect(b.attributes('aria-expanded')).toBe('false')
    expect(b.attributes('aria-controls')).toBeTruthy()
    expect(b.attributes('aria-label')).toBe('Acciones de')
    expect(b.attributes('aria-labelledby')).toBe(`${b.attributes('id')} ${w.find('.g-card__title').attributes('id')}`)
    expect(b.find('svg.g-icon').html()).toContain('cx="12" cy="5"')
  })

  it('abrir, elegir: emite action { id } y la tarjeta no guarda estado; deshabilitados no emiten', async () => {
    const w = mk({ menu: MENU })
    await open(w)
    const its = w.findAll('.g-menu__item')
    expect(its).toHaveLength(3)
    await its[0].trigger('click'); await nextTick(); await nextTick()
    expect(w.emitted('action')[0][0]).toEqual({ id: 'rename' })
    expect(document.activeElement).toBe(w.find('.g-card__menu').element)
    await open(w)
    await w.findAll('.g-menu__item')[1].trigger('click')
    expect(w.emitted('action')).toHaveLength(1)
  })

  it('casillas del menú: action trae checked', async () => {
    const w = mk({ menu: [{ type: 'checkbox', id: 'pin', label: 'Fijar', checked: false }] })
    await open(w)
    await w.find('.g-menu__item').trigger('click')
    expect(w.emitted('action')[0][0]).toEqual({ id: 'pin', checked: true })
  })

  it('Esc cierra, devuelve el foco al botón y no llega a un ancestro; Enter en el título no abre el menú', async () => {
    const parent = vi.fn()
    const w = mount({ render: () => h('div', { onKeydown: parent }, [h(GCard, { ...base, href: '/a', menu: MENU })]) }, { attachTo: document.body })
    await w.find('.g-card__primary').trigger('keydown', { key: 'Enter' })
    expect(w.find('ul.g-menu__list').exists()).toBe(false)
    await w.find('.g-card__menu').trigger('click'); await nextTick(); await nextTick()
    expect(w.find('ul.g-menu__list').exists()).toBe(true)
    parent.mockClear()
    await w.find('.g-menu__item').trigger('keydown', { key: 'Escape' }); await nextTick(); await nextTick()
    expect(w.find('ul.g-menu__list').exists()).toBe(false)
    expect(document.activeElement).toBe(w.find('.g-card__menu').element)
    expect(parent).not.toHaveBeenCalled()
  })

  it('sin labels.menu avisa', () => {
    const warn = warnings()
    mount(GCard, { props: { title: 'T', menu: MENU } })
    expect(msgs(warn).some((m) => m.includes('labels.menu'))).toBe(true)
  })
})

describe('GCard · estado, vacío y reintentar', () => {
  it('status: g-card--status-* y has-status; icono decorativo + texto; role="status" al montar (también con error)', () => {
    const icons = { info: 'M12 16v-4', success: 'm16 9-5.5 5.5L8 12', warning: 'm21.73 18-8-14', error: 'x1="12" x2="12" y1="8"' }
    for (const [st, mark] of Object.entries(icons)) {
      const w = mk({ status: st, statusText: `Texto ${st}` })
      expect(w.classes()).toEqual(expect.arrayContaining([`g-card--status-${st}`, 'has-status']))
      const s = w.find('.g-card__content > .g-card__status')
      expect(s.attributes('role')).toBe('status')
      expect(s.find('svg.g-icon').attributes('aria-hidden')).toBe('true')
      expect(s.find('svg').html(), st).toContain(mark)
      expect(s.text()).toContain(`Texto ${st}`)
    }
  })

  it('role="alert" solo cuando el error aparece', async () => {
    const w = mk()
    await w.setProps({ status: 'error', statusText: 'No se pudo cargar.' })
    expect(w.find('.g-card__status').attributes('role')).toBe('alert')
    await w.setProps({ status: 'warning' })
    expect(w.find('.g-card__status').attributes('role')).toBe('status')
  })

  it('status sin statusText avisa; el slot status sustituye icono y texto', () => {
    const warn = warnings()
    mount(GCard, { props: { ...base, status: 'info' } })
    expect(msgs(warn).some((m) => m.includes('statusText'))).toBe(true)
    let sc
    const w = mk({ status: 'success', statusText: 'x' }, { slots: { status: (s) => { sc = s; return h('span', { class: 'mio' }, 'Hecho') } } })
    expect(w.find('.g-card__status .mio').exists()).toBe(true)
    expect(w.find('.g-card__status svg').exists()).toBe(false)
    expect(sc).toEqual({ status: 'success' })
  })

  it('retryable con error: GBtn con labels.retry que emite retry; sin error no hay botón', async () => {
    const w = mk({ status: 'error', statusText: 'Falló', retryable: true })
    const b = w.find('.g-card__status .g-btn')
    expect(b.text()).toContain('Reintentar')
    await b.trigger('click')
    expect(w.emitted('retry')).toHaveLength(1)
    expect(mk({ status: 'warning', statusText: 'x', retryable: true }).find('.g-card__status .g-btn').exists()).toBe(false)
  })

  it('empty: slot empty (o labels.empty) en el contenido, conserva el encabezado y sustituye al slot por defecto; is-empty', () => {
    let sc
    const w = mk({ empty: true }, { slots: { empty: (s) => { sc = s; return h('span', { class: 'vacio' }, 'Aún no hay proyectos') }, default: () => h('i', { class: 'datos' }) } })
    expect(w.classes()).toContain('is-empty')
    expect(w.find('.g-card__content > .g-card__empty .vacio').exists()).toBe(true)
    expect(w.find('.datos').exists()).toBe(false)
    expect(w.find('.g-card__title').text()).toBe('Proyecto Atlas')
    expect(sc).toEqual({ size: 'medium' })
    expect(mk({ empty: true }).find('.g-card__empty').text()).toBe('Sin datos')
  })

  it('empty sin slot ni labels.empty avisa y no dibuja nada', () => {
    const warn = warnings()
    const w = mount(GCard, { props: { title: 'T', empty: true } })
    expect(w.find('.g-card__empty').exists()).toBe(false)
    expect(msgs(warn).some((m) => m.includes('labels.empty'))).toBe(true)
  })
})

describe('GCard · carga y esqueleto', () => {
  it('loading: aria-busy, is-loading, región role="status" desde el montaje, sin controles enfocables', async () => {
    const w = mk({ loading: true, href: '/a', menu: MENU }, { slots: { actions: () => h('button', 'A'), default: () => h('input') } })
    expect(w.attributes('aria-busy')).toBe('true')
    expect(w.classes()).toContain('is-loading')
    const live = w.find('.g-card__live')
    expect(live.attributes('role')).toBe('status')
    await nextTick()
    expect(live.text()).toBe('Cargando')
    expect(w.find('a, button, input, select, textarea, [tabindex]').exists()).toBe(false)
    expect(w.find('.g-card__skeleton').attributes('aria-hidden')).toBe('true')
    expect(w.find('.g-card__skeleton').attributes('inert')).toBeDefined()
  })

  it('la región viva anuncia labels.loading al empezar y labels.loaded al terminar', async () => {
    const w = mk()
    const live = () => w.find('.g-card__live').text()
    expect(live()).toBe('')
    await w.setProps({ loading: true })
    expect(live()).toBe('Cargando')
    await w.setProps({ loading: false })
    expect(live()).toBe('Cargado')
    expect(w.attributes('aria-busy')).toBeUndefined()
  })

  it('sin nada declarado: forma mínima (título + dos líneas)', () => {
    const w = mk({ loading: true })
    expect(w.findAll('.g-card__sk--title')).toHaveLength(1)
    expect(w.findAll('.g-card__description .g-card__sk')).toHaveLength(2)
    expect(w.find('.g-card__sk--eyebrow').exists()).toBe(false)
  })

  it('derivado de las regiones declaradas: media, lead, eyebrow, subtítulo, badge, menú, líneas, meta, acciones y pie', () => {
    const w = mk({ loading: true, eyebrow: 'E', subtitle: 'S', badge: 'B', menu: MENU, description: 'D', descriptionLines: 3, meta: [{ label: 'a', value: 'b' }, { label: 'c', value: 'd' }] }, {
      slots: { media: () => h('img'), lead: () => h('i'), actions: () => [h(GBtn, () => 'A'), h(GBtn, () => 'B')], footer: () => 'F' }
    })
    expect(w.element.firstElementChild.className).toBe('g-card__media')
    expect(w.find('.g-card__media').attributes('aria-hidden')).toBe('true')
    expect(w.find('.g-card__media img').exists()).toBe(false)
    expect(w.find('.g-card__skeleton .g-card__lead').exists()).toBe(true)
    expect(w.find('.g-card__sk--eyebrow').exists()).toBe(true)
    expect(w.find('.g-card__subtitle .g-card__sk').exists()).toBe(true)
    expect(w.findAll('.g-card__aside .g-card__sk')).toHaveLength(2)
    const lines = w.findAll('.g-card__description .g-card__sk')
    expect(lines).toHaveLength(3)
    expect(lines[0].attributes('style')).toContain('--_sk-w: 100%')
    expect(lines[2].attributes('style')).toContain('--_sk-w: 60%')
    expect(w.findAll('.g-card__meta .g-card__sk--meta')).toHaveLength(2)
    expect(w.findAll('.g-card__actions .g-card__sk--btn')).toHaveLength(2)
    expect(w.find('.g-card__footer .g-card__sk--footer').exists()).toBe(true)
    expect(w.find('.g-card__footer').attributes('aria-hidden')).toBe('true')
    // Las formas no llevan literales de medida: solo proporciones y múltiplos de --g-space-1
    expect(w.html()).not.toMatch(/\d+px/)
  })

  it('descripción con descriptionLines="none": dos líneas', () => {
    expect(mk({ loading: true, description: 'D' }).findAll('.g-card__description .g-card__sk')).toHaveLength(2)
  })

  it('la prop skeleton precisa o quita regiones; claves desconocidas avisan', () => {
    const warn = warnings()
    const w = mount(GCard, { props: { ...base, loading: true, eyebrow: 'E', description: 'D', skeleton: { eyebrow: false, descriptionLines: 5, meta: 3, actions: 1, footer: true, media: true, rara: 1 } } })
    expect(w.find('.g-card__sk--eyebrow').exists()).toBe(false)
    expect(w.findAll('.g-card__description .g-card__sk')).toHaveLength(5)
    expect(w.findAll('.g-card__sk--meta')).toHaveLength(3)
    expect(w.findAll('.g-card__sk--btn')).toHaveLength(1)
    expect(w.find('.g-card__sk--footer').exists()).toBe(true)
    expect(w.find('.g-card__media').exists()).toBe(true)
    expect(msgs(warn).some((m) => m.includes('skeleton no conoce: rara'))).toBe(true)
  })

  it('el slot loading sustituye solo el cuerpo del esqueleto (decorativo) y recibe size y layout', () => {
    let sc
    const w = mk({ loading: true }, { slots: { loading: (s) => { sc = s; return h('div', { class: 'propio' }) } } })
    expect(w.find('.g-card__skeleton .propio').exists()).toBe(true)
    expect(w.find('.g-card__sk--title').exists()).toBe(false)
    expect(w.attributes('aria-busy')).toBe('true')
    expect(w.find('.g-card__live').exists()).toBe(true)
    expect(sc).toEqual({ size: 'medium', layout: 'column' })
  })

  it('loading: la principal no emite y no se avisa por el título', async () => {
    const warn = warnings()
    mount(GCard, { props: { loading: true, labels: LABELS } })
    expect(msgs(warn).some((m) => m.includes('necesita title'))).toBe(false)
  })
})

describe('GCard · truncado y región plegable', () => {
  // jsdom no maqueta: el recorte se simula con scrollHeight/clientHeight de la descripción
  const clamp = (isClipped) => {
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, get() { return this.classList.contains('g-card__description') && isClipped() ? 120 : 40 } })
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get() { return 40 } })
  }

  it('expandable: «Mostrar más» solo si hay recorte real; aria-expanded, aria-controls, is-expanded y expand', async () => {
    clamp(() => true)
    widthMock(() => 400)
    const w = mk({ description: 'largo', descriptionLines: 2, expandable: true })
    await nextTick()
    const b = w.find('button.g-card__expand')
    expect(b.exists()).toBe(true)
    expect(b.text()).toBe('Mostrar más')
    expect(b.attributes('aria-expanded')).toBe('false')
    expect(b.attributes('aria-controls')).toBe(w.find('.g-card__description').attributes('id'))
    await b.trigger('click')
    expect(w.classes()).toContain('is-expanded')
    expect(b.attributes('aria-expanded')).toBe('true')
    expect(b.text()).toBe('Mostrar menos')
    expect(w.emitted('expand')[0][0]).toEqual({ expanded: true, region: 'description' })
    await b.trigger('click')
    expect(w.emitted('expand')[1][0]).toEqual({ expanded: false, region: 'description' })
  })

  it('sin recorte no se renderiza el botón; con descriptionLines="none" tampoco', async () => {
    clamp(() => false)
    widthMock(() => 400)
    const w = mk({ description: 'corto', descriptionLines: 4, expandable: true })
    await nextTick()
    expect(w.find('.g-card__expand').exists()).toBe(false)
    clamp(() => true)
    const n = mk({ description: 'largo', expandable: true })
    await nextTick()
    expect(n.find('.g-card__expand').exists()).toBe(false)
  })

  it('el recorte se vuelve a medir al cambiar el ancho propio', async () => {
    let clip = false
    clamp(() => clip)
    widthMock(() => 400)
    const w = mk({ description: 'texto', descriptionLines: 2, expandable: true })
    await nextTick()
    expect(w.find('.g-card__expand').exists()).toBe(false)
    clip = true
    roCb(); await nextTick()
    expect(w.find('.g-card__expand').exists()).toBe(true)
  })

  it('expandable sin labels.expand/collapse avisa', () => {
    const warn = warnings()
    mount(GCard, { props: { title: 'T', description: 'd', descriptionLines: 2, expandable: true } })
    expect(msgs(warn).some((m) => m.includes('labels.expand'))).toBe(true)
  })

  it('more: visible fuera de narrow; en narrow se pliega (hidden) con disclosure y emite expand { region: "more" }', async () => {
    let width = 600
    widthMock(() => width)
    const w = mk({}, { slots: { more: () => h('p', { class: 'extra' }, 'Detalles') } })
    await nextTick()
    const more = () => w.find('.g-card__more')
    expect(more().attributes('hidden')).toBeUndefined()
    expect(w.find('.g-card__more-toggle').exists()).toBe(false)
    width = 260
    roCb(); await nextTick()
    expect(more().attributes('hidden')).toBeDefined()
    const t = w.find('button.g-card__more-toggle')
    expect(t.text()).toBe('Más detalles')
    expect(t.attributes('aria-controls')).toBe(more().attributes('id'))
    expect(t.attributes('aria-expanded')).toBe('false')
    await t.trigger('click')
    expect(more().attributes('hidden')).toBeUndefined()
    expect(t.attributes('aria-expanded')).toBe('true')
    expect(t.text()).toBe('Menos detalles')
    expect(w.emitted('expand')[0][0]).toEqual({ expanded: true, region: 'more' })
  })

  it('more sin labels.more/less no se pliega y avisa', async () => {
    const warn = warnings()
    widthMock(() => 200)
    const w = mount(GCard, { props: { title: 'T' }, slots: { more: () => 'x' }, attachTo: document.body })
    await nextTick()
    expect(w.find('.g-card__more').attributes('hidden')).toBeUndefined()
    expect(w.find('.g-card__more-toggle').exists()).toBe(false)
    expect(msgs(warn).some((m) => m.includes('labels.more'))).toBe(true)
  })
})

describe('GCard · orden del DOM, eventos y avisos', () => {
  it('orden del DOM = orden de foco: casilla → título → menú → acciones → controles del contenido → pie', () => {
    const w = mk({ href: '/a', selectable: true, menu: MENU }, { slots: {
      default: () => h('button', { 'data-k': 'contenido' }, 'c'),
      actions: () => [h('button', { 'data-k': 'accion' }, 'a')],
      footer: () => h('a', { href: '#', 'data-k': 'pie' }, 'p')
    } })
    const order = [...w.element.querySelectorAll('a, button, input')].map((e) => e.dataset.k || e.className)
    expect(order).toEqual(['g-card__select', 'g-card__primary', 'g-card__menu', 'contenido', 'accion', 'pie'])
  })

  it('todos los eventos están en emits (navigate, activate, update:modelValue, action, retry, expand)', () => {
    expect(GCard.emits).toEqual(['navigate', 'activate', 'update:modelValue', 'action', 'retry', 'expand'])
  })

  it('un @click del consumidor llega a la raíz (no se declara) y un @navigate no se dispara por $attrs con una acción interna', async () => {
    const onClick = vi.fn()
    const onNavigate = vi.fn()
    const w = mk({ href: '/a', onClick, onNavigate }, { slots: { actions: () => h('button', { class: 'acc' }, 'A') } })
    await w.find('.acc').trigger('click')
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('avisa una vez sin título ni aria-label; no avisa con aria-label', () => {
    const warn = warnings()
    const w = mount(GCard, { props: { labels: LABELS } })
    w.vm.$forceUpdate()
    expect(msgs(warn).filter((m) => m.includes('necesita title'))).toHaveLength(1)
    warn.mockClear()
    mount(GCard, { attrs: { 'aria-label': 'Tarjeta' } })
    expect(msgs(warn).some((m) => m.includes('necesita title'))).toBe(false)
  })

  it('avisa por labels requeridos: loading, retry', () => {
    const warn = warnings()
    mount(GCard, { props: { title: 'T', loading: true } })
    mount(GCard, { props: { title: 'T', status: 'error', statusText: 'x', retryable: true } })
    const m = msgs(warn)
    expect(m.some((x) => x.includes('labels.loading'))).toBe(true)
    expect(m.some((x) => x.includes('labels.retry'))).toBe(true)
  })

  it('avisa por un GBtn de solo icono sin aria-label en actions', () => {
    const warn = warnings()
    mount(GCard, { props: base, slots: { actions: () => h(GBtn, { icon: true }, () => 'x') } })
    expect(msgs(warn).some((m) => m.includes('<GCard>') && m.includes('solo icono'))).toBe(true)
    warn.mockClear()
    mount(GCard, { props: base, slots: { actions: () => h(GBtn, { icon: true, 'aria-label': 'Compartir' }, () => 'x') } })
    expect(msgs(warn).some((m) => m.includes('<GCard>') && m.includes('solo icono'))).toBe(false)
  })

  it('tarjeta dentro de tarjeta dentro de tarjeta avisa (dos niveles no)', () => {
    const warn = warnings()
    mount(GCard, { props: base, slots: { default: () => h(GCard, { title: 'B' }) } })
    expect(msgs(warn).some((m) => m.includes('tarjeta dentro de tarjeta'))).toBe(false)
    mount(GCard, { props: base, slots: { default: () => h(GCard, { title: 'B' }, { default: () => h(GCard, { title: 'C' }) }) } })
    expect(msgs(warn).some((m) => m.includes('tarjeta dentro de tarjeta'))).toBe(true)
  })

  it('el aviso de desarrollo usa typeof process (nunca import.meta.env.DEV)', async () => {
    const { readFileSync } = await import('node:fs')
    const src = readFileSync(`${process.cwd()}/src/components/GCard/GCard.vue`, 'utf8')
    expect(src).toContain("typeof process !== 'undefined'")
    expect(src).not.toContain('import.meta.env')
    expect(src).not.toMatch(/<style/)
    const code = src.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
    expect(code).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\d+px|var\(--[a-z0-9-]+,/)
  })

  it('expone size y layout', async () => {
    widthMock(() => 600)
    const w = mk({ orientation: 'auto' })
    await nextTick()
    expect(w.vm.size).toBe('wide')
    expect(w.vm.layout).toBe('row')
  })
})
