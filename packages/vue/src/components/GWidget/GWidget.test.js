import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, h } from 'vue'
import GWidget from './GWidget.vue'
import GMetric from '../GMetric/GMetric.vue'
import GProgress from '../GProgress/GProgress.vue'
import GDataList from '../GDataList/GDataList.vue'

beforeEach(() => {
  HTMLElement.prototype.showPopover = function () { this.setAttribute('data-popover-open', '') }
  HTMLElement.prototype.hidePopover = function () { this.removeAttribute('data-popover-open') }
  const orig = HTMLElement.prototype.matches
  HTMLElement.prototype.matches = function (sel) { return sel === ':popover-open' ? this.hasAttribute('data-popover-open') : orig.call(this, sel) }
})
afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

const LABELS = { actions: 'Acciones de', loading: 'Cargando', empty: 'Sin datos', error: 'No se pudo cargar', retry: 'Reintentar', stale: 'Desactualizado', staleText: 'Datos de hace 2 h', disabled: 'Deshabilitado' }
const base = { title: 'Ingresos', labels: LABELS }
const sizeMock = (w, hh) => vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () { return { width: this.classList?.contains('g-widget') ? w : 0, height: this.classList?.contains('g-widget') ? hh : 0, top: 0, left: 0, right: 0, bottom: 0 } })
const mk = (props = {}, opts = {}) => mount(GWidget, { attachTo: document.body, props: { ...base, ...props }, ...opts })
const slotsFor = () => ({ compact: () => h('i', { class: 'c' }, 'compacto'), default: (s) => h('i', { class: 'd' }, `medio ${s.level}`), detail: (s) => h('i', { class: 'x' }, `detalle ${s.shape}`) })

describe('GWidget · estructura', () => {
  it('<article> con nombre por su título (h3 por defecto) y clases de nivel, forma y estado', () => {
    const w = mk()
    expect(w.element.tagName).toBe('ARTICLE')
    expect(w.classes()).toEqual(expect.arrayContaining(['g-widget', 'g-widget--level-m', 'g-widget--shape-square', 'g-widget--state-populated', 'g-widget--density-default']))
    const t = w.find('h3.g-widget__title')
    expect(t.text()).toBe('Ingresos')
    expect(w.attributes('aria-labelledby')).toBe(t.attributes('id'))
  })

  it('headingLevel cambia el elemento del título', () => {
    expect(mk({ headingLevel: 2 }).find('h2.g-widget__title').exists()).toBe(true)
    expect(mk({ headingLevel: 5 }).find('h5.g-widget__title').exists()).toBe(true)
  })

  it('encabezado: icono (decorativo), categoría, subtítulo y badge con su color', () => {
    const w = mk({ eyebrow: 'Finanzas', description: 'Últimos 30 días', badge: 'Mensual', badgeColor: 'info' }, { slots: { icon: () => h('svg') } })
    expect(w.find('.g-widget__icon').attributes('aria-hidden')).toBe('true')
    expect(w.find('.g-widget__eyebrow').text()).toBe('Finanzas')
    expect(w.find('.g-widget__sub').text()).toBe('Últimos 30 días')
    expect(w.find('.g-widget__badge').text()).toBe('Mensual')
    expect(w.find('.g-widget__badge').classes()).toContain('g-widget__badge--color-info')
  })

  it('class, style y data-* van a la raíz; headless quita el encabezado', () => {
    const w = mk({ headless: true }, { attrs: { class: 'mi', 'data-x': '1' } })
    expect(w.classes()).toEqual(expect.arrayContaining(['mi', 'g-widget--headless']))
    expect(w.attributes('data-x')).toBe('1')
    expect(w.find('.g-widget__head').exists()).toBe(false)
    expect(w.attributes('aria-label')).toBe('Ingresos')
  })
})

describe('GWidget · niveles y forma por su propio tamaño', () => {
  it('nivel por el ancho propio: < 240 s, < 440 m, ≥ 440 l (con space 4)', async () => {
    let spy = sizeMock(200, 200)
    const w = mk()
    await nextTick()
    expect(w.classes()).toContain('g-widget--level-s')
    expect(w.attributes('data-level')).toBe('s')
    spy.mockRestore(); sizeMock(240, 200)
    const b = mk(); await nextTick(); expect(b.classes()).toContain('g-widget--level-m')
    vi.restoreAllMocks(); sizeMock(439, 200)
    const c = mk(); await nextTick(); expect(c.classes()).toContain('g-widget--level-m')
    vi.restoreAllMocks(); sizeMock(440, 200)
    const d = mk(); await nextTick(); expect(d.classes()).toContain('g-widget--level-l')
  })

  it('forma: wide (ancho ≥ 1.9 × alto), tall (alto ≥ 1.3 × ancho y ≥ 320), square', async () => {
    sizeMock(700, 200); const a = mk(); await nextTick(); expect(a.classes()).toContain('g-widget--shape-wide')
    vi.restoreAllMocks(); sizeMock(300, 460); const b = mk(); await nextTick(); expect(b.classes()).toContain('g-widget--shape-tall')
    vi.restoreAllMocks(); sizeMock(300, 300); const c = mk(); await nextTick(); expect(c.classes()).toContain('g-widget--shape-square')
    vi.restoreAllMocks(); sizeMock(100, 200); const d = mk(); await nextTick(); expect(d.classes()).toContain('g-widget--shape-square') // alto < 320
  })

  it('level fija el nivel sin medir', () => {
    expect(mk({ level: 'l' }).classes()).toContain('g-widget--level-l')
    expect(mk({ level: 's' }).classes()).toContain('g-widget--level-s')
  })

  it('el nivel cambia al cambiar el tamaño (observador)', async () => {
    let cb
    globalThis.ResizeObserver = class { constructor(f) { cb = f } observe() {} disconnect() {} }
    let width = 500
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () { return { width: this.classList?.contains('g-widget') ? width : 0, height: 200, top: 0, left: 0, right: 0, bottom: 0 } })
    const w = mk(); await nextTick()
    expect(w.classes()).toContain('g-widget--level-l')
    width = 150; cb(); await nextTick()
    expect(w.classes()).toContain('g-widget--level-s')
    delete globalThis.ResizeObserver
  })

  it('cadena de slots: s → compact ?? default; m → default; l → detail ?? default', () => {
    expect(mk({ level: 's' }, { slots: slotsFor() }).find('.c').exists()).toBe(true)
    expect(mk({ level: 'm' }, { slots: slotsFor() }).find('.d').text()).toBe('medio m')
    expect(mk({ level: 'l' }, { slots: slotsFor() }).find('.x').exists()).toBe(true)
    expect(mk({ level: 's' }, { slots: { default: () => h('i', { class: 'd' }, 'solo medio') } }).find('.d').exists()).toBe(true)
    expect(mk({ level: 'l' }, { slots: { default: () => h('i', { class: 'd' }, 'solo medio') } }).find('.d').exists()).toBe(true)
  })

  it('el alcance de los slots trae level, shape y state', () => {
    let seen
    mk({ level: 'l' }, { slots: { default: (s) => { seen = s; return h('i') } } })
    expect(seen).toEqual({ level: 'l', shape: 'square', state: 'populated' })
  })

  it('el nivel s NO renderiza categoría, subtítulo, badge ni pie', () => {
    const w = mk({ level: 's', eyebrow: 'Cat', description: 'Sub', badge: 'B', updatedText: 'Hace 5 min', drilldownLabel: 'Ver' }, { slots: slotsFor() })
    expect(w.find('.g-widget__eyebrow').exists()).toBe(false)
    expect(w.find('.g-widget__sub').exists()).toBe(false)
    expect(w.find('.g-widget__badge').exists()).toBe(false)
    expect(w.find('.g-widget__foot').exists()).toBe(false)
    const m = mk({ level: 'm', eyebrow: 'Cat', description: 'Sub', badge: 'B', updatedText: 'Hace 5 min' })
    expect(m.find('.g-widget__eyebrow').exists()).toBe(true)
    expect(m.find('.g-widget__foot').exists()).toBe(true)
  })
})

describe('GWidget · estados', () => {
  it('loading: esqueleto del nivel, aria-busy, aviso oculto y sin contenido', () => {
    const w = mk({ state: 'loading', level: 'l' }, { slots: slotsFor() })
    expect(w.attributes('aria-busy')).toBe('true')
    expect(w.find('.g-widget__sr').attributes('role')).toBe('status')
    expect(w.find('.g-widget__sr').text()).toBe('Cargando')
    expect(w.findAll('.g-widget__line').length).toBeGreaterThan(2)
    expect(w.find('.g-widget__block').exists()).toBe(true)
    expect(w.find('.x').exists()).toBe(false)
    expect(mk({ state: 'loading', level: 's' }).find('.g-widget__block').exists()).toBe(false)
  })

  it('loading: el slot loading sustituye al esqueleto', () => {
    const w = mk({ state: 'loading' }, { slots: { loading: ({ level }) => h('div', { class: 'mio' }, level) } })
    expect(w.find('.mio').text()).toBe('m')
    expect(w.find('.g-widget__skeleton').exists()).toBe(false)
  })

  it('empty: slot empty o labels.empty', () => {
    expect(mk({ state: 'empty' }).find('.g-widget__state').text()).toBe('Sin datos')
    expect(mk({ state: 'empty' }, { slots: { empty: () => h('b', 'Nada') } }).find('.g-widget__state').text()).toBe('Nada')
  })

  it('error: role=alert, mensaje y «Reintentar» que emite retry; el slot error recibe retry', async () => {
    const w = mk({ state: 'error' })
    expect(w.find('.g-widget__state').attributes('role')).toBe('alert')
    expect(w.find('.g-widget__state').text()).toContain('No se pudo cargar')
    await w.find('.g-widget__state button').trigger('click')
    expect(w.emitted('retry')).toHaveLength(1)
    let r
    mk({ state: 'error' }, { slots: { error: (s) => { r = s.retry; return h('i') } } })
    expect(typeof r).toBe('function')
  })

  it('stale: conserva los datos, badge con texto y línea de hora (desde el nivel m)', () => {
    const w = mk({ state: 'stale', level: 'l' }, { slots: slotsFor() })
    expect(w.find('.x').exists()).toBe(true)
    expect(w.find('.g-widget__badge').text()).toBe('Desactualizado')
    expect(w.find('.g-widget__badge').classes()).toContain('g-widget__badge--color-warning')
    expect(w.find('.g-widget__stale').text()).toBe('Datos de hace 2 h')
    expect(mk({ state: 'stale', level: 's' }, { slots: slotsFor() }).find('.g-widget__stale').exists()).toBe(false)
  })

  it('disabled: aria-disabled, cuerpo inert y badge con texto', () => {
    const w = mk({ state: 'disabled' }, { slots: slotsFor() })
    expect(w.attributes('aria-disabled')).toBe('true')
    expect(w.find('.g-widget__body').element.hasAttribute('inert')).toBe(true)
    expect(w.find('.g-widget__badge').text()).toBe('Deshabilitado')
    expect(mk().find('.g-widget__body').element.hasAttribute('inert')).toBe(false)
    expect(mk().attributes('aria-disabled')).toBeUndefined()
  })
})

describe('GWidget · pie y drill-down', () => {
  it('updatedText y un enlace de detalle; con href es <a>, sin href es un botón que emite drilldown', async () => {
    const a = mk({ updatedText: 'Hace 5 min', drilldownLabel: 'Ver detalle', href: '/ingresos' })
    expect(a.find('.g-widget__foot').text()).toContain('Hace 5 min')
    expect(a.find('a.g-widget__link').attributes('href')).toBe('/ingresos')
    const b = mk({ updatedText: 'Hace 5 min', drilldownLabel: 'Ver detalle' })
    const btn = b.find('button.g-widget__link')
    await btn.trigger('click')
    expect(b.emitted('drilldown')).toHaveLength(1)
    expect(b.emitted('drilldown')[0][0].event.type).toBe('click')
  })

  it('el slot footer sustituye al pie; sin pie no se renderiza', () => {
    expect(mk({}, { slots: { footer: () => h('i', { class: 'f' }, 'mi pie') } }).find('.f').text()).toBe('mi pie')
    expect(mk().find('.g-widget__foot').exists()).toBe(false)
  })
})

describe('GWidget · menú de acciones (GMenu)', () => {
  const ACTIONS = [{ id: 'refresh', label: 'Actualizar' }, { id: 'config', label: 'Configurar', disabled: true }, { id: 'export', label: 'Exportar' }]
  const withMenu = (props = {}) => mk({ actions: ACTIONS, ...props })
  const menu = (w) => w.find('ul.g-menu__list[role="menu"]')
  const its = (w) => w.findAll('.g-menu__item')
  const open = async (w) => { await w.find('.g-widget__menu').trigger('click'); await nextTick(); await nextTick() }

  it('sin acciones no hay botón de menú', () => {
    expect(mk().find('.g-widget__menu').exists()).toBe(false)
  })

  it('el botón lleva aria-haspopup, aria-expanded, aria-controls, su nombre y el ellipsis-vertical de Lucide', () => {
    const w = withMenu()
    const b = w.find('.g-widget__menu')
    expect(b.attributes('aria-haspopup')).toBe('menu')
    expect(b.attributes('aria-expanded')).toBe('false')
    expect(b.attributes('aria-label')).toBe('Acciones de Ingresos')
    expect(b.attributes('aria-controls')).toBeTruthy()
    expect(b.find('svg.g-icon').attributes('aria-hidden')).toBe('true')
    expect(b.find('svg').html()).toContain('cx="12" cy="5"')
    expect(menu(w).exists()).toBe(false)
  })

  it('al abrir, la lista de GMenu se nombra por el botón y el foco va al primero; los deshabilitados son aria-disabled', async () => {
    const w = withMenu()
    await open(w)
    expect(menu(w).attributes('popover')).toBe('manual')
    expect(menu(w).attributes('aria-labelledby')).toBe(w.find('.g-widget__menu').attributes('id'))
    expect(w.find('.g-widget__menu').attributes('aria-expanded')).toBe('true')
    expect(document.activeElement.textContent.trim()).toBe('Actualizar')
    expect(its(w)).toHaveLength(3)
    expect(its(w)[1].attributes('aria-disabled')).toBe('true')
  })

  it('↑ abre con el foco en el último', async () => {
    const w = withMenu()
    await w.find('.g-widget__menu').trigger('keydown', { key: 'ArrowUp' }); await nextTick(); await nextTick()
    expect(document.activeElement.textContent.trim()).toBe('Exportar')
  })

  it('elegir una acción emite action { id }, cierra y devuelve el foco al botón; una deshabilitada no', async () => {
    const w = withMenu()
    await open(w)
    await its(w)[0].trigger('click'); await nextTick(); await nextTick()
    expect(w.emitted('action')[0][0]).toEqual({ id: 'refresh' })
    expect(menu(w).exists()).toBe(false)
    expect(document.activeElement).toBe(w.find('.g-widget__menu').element)
    await open(w)
    await its(w)[1].trigger('click'); await nextTick()
    expect(w.emitted('action')).toHaveLength(1)
  })

  it('Esc cierra y devuelve el foco, y no llega a un ancestro', async () => {
    const parent = vi.fn()
    const w = mount({ render: () => h('div', { onKeydown: parent }, [h(GWidget, { ...base, actions: ACTIONS })]) }, { attachTo: document.body })
    await w.find('.g-widget__menu').trigger('click'); await nextTick(); await nextTick()
    await w.find('.g-menu__item').trigger('keydown', { key: 'Escape' }); await nextTick(); await nextTick()
    expect(w.find('ul.g-menu__list').exists()).toBe(false)
    expect(document.activeElement).toBe(w.find('.g-widget__menu').element)
    expect(parent).not.toHaveBeenCalled()
  })

  it('actions admite los items de GMenu: separador, grupo, casilla, opción y peligroso; action trae checked', async () => {
    const w = mk({ actions: [
      { id: 'a', label: 'Actualizar' }, { type: 'separator' },
      { type: 'group', label: 'Ver', items: [{ type: 'checkbox', id: 'leg', label: 'Leyenda', checked: false }, { type: 'radio', id: 'bar', label: 'Barras', checked: true }] },
      { id: 'del', label: 'Quitar', danger: true }
    ] })
    await open(w)
    expect(w.find('[role="separator"]').exists()).toBe(true)
    expect(w.find('.g-menu__group-title').text()).toBe('Ver')
    expect(its(w).find((i) => i.text().includes('Quitar')).classes()).toContain('g-menu__item--danger')
    await its(w).find((i) => i.text().includes('Leyenda')).trigger('click'); await nextTick(); await nextTick()
    expect(w.emitted('action')[0][0]).toEqual({ id: 'leg', checked: true })
  })

  it('el slot actions sustituye al botón y a la lista', () => {
    const s = mk({ actions: ACTIONS }, { slots: { actions: () => h('button', { class: 'mio' }, '…') } })
    expect(s.find('.g-widget__menu').exists()).toBe(false)
    expect(s.find('.mio').exists()).toBe(true)
  })

  it('expone focusMenu: enfoca el botón del menú', async () => {
    const w = withMenu()
    w.vm.focusMenu()
    expect(document.activeElement).toBe(w.find('.g-widget__menu').element)
  })
})

describe('GWidget · avisos de desarrollo', () => {
  it('avisa si falta el título, labels.actions con acciones, labels.loading o labels.retry', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(GWidget, { props: { actions: [{ id: 'a', label: 'A' }], state: 'loading' } })
    mount(GWidget, { props: { title: 'X', state: 'error' } })
    mount(GWidget, { props: { title: 'X', state: 'stale' } })
    const msgs = warn.mock.calls.map((c) => String(c[0]))
    expect(msgs.some((m) => m.includes('necesita title'))).toBe(true)
    expect(msgs.some((m) => m.includes('labels.actions'))).toBe(true)
    expect(msgs.some((m) => m.includes('labels.loading'))).toBe(true)
    expect(msgs.some((m) => m.includes('labels.retry'))).toBe(true)
    expect(msgs.some((m) => m.includes('labels.stale'))).toBe(true)
  })

  it('validadores de state, level, headingLevel, badgeColor y density', () => {
    const p = GWidget.props
    expect(p.state.validator('empty')).toBe(true)
    expect(p.state.validator('busy')).toBe(false)
    expect(p.level.validator('auto')).toBe(true)
    expect(p.level.validator('xl')).toBe(false)
    expect(p.headingLevel.validator(1)).toBe(false)
    expect(p.headingLevel.validator(6)).toBe(true)
    expect(p.badgeColor.validator('danger')).toBe(true)
    expect(p.density.validator('dense')).toBe(false)
  })
})

describe('GMetric', () => {
  it('etiqueta, valor con unidad, tendencia con dirección y color, y contexto', () => {
    const w = mount(GMetric, { props: { label: 'Ingresos', value: '$48.2k', unit: 'USD', trend: '+12%', direction: 'up', trendColor: 'success', context: 'vs. mes anterior', size: 'lg' } })
    expect(w.classes()).toEqual(expect.arrayContaining(['g-metric', 'g-metric--size-lg', 'g-metric--trend-success']))
    expect(w.find('.g-metric__label').text()).toBe('Ingresos')
    expect(w.find('.g-metric__value').text()).toBe('$48.2kUSD')
    expect(w.find('.g-metric__unit').text()).toBe('USD')
    const t = w.find('.g-metric__trend')
    expect(t.attributes('data-direction')).toBe('up')
    expect(t.text()).toContain('+12%')
    expect(t.text()).toContain('vs. mes anterior')
  })

  it('sin tendencia no hay clase de color; dirección por defecto flat; avisa sin label', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(GMetric, { props: { value: 5 } })
    expect(w.classes().some((c) => c.startsWith('g-metric--trend-'))).toBe(false)
    expect(warn.mock.calls.some((c) => String(c[0]).includes('label'))).toBe(true)
    expect(mount(GMetric, { props: { label: 'A', value: 1, trend: '0%' } }).find('.g-metric__trend').attributes('data-direction')).toBe('flat')
  })
})

describe('GProgress', () => {
  it('progressbar con valores, nombre y texto; el relleno usa --_value', () => {
    const w = mount(GProgress, { props: { value: 72, label: 'Avance', valueText: '72 %', color: 'success' } })
    const bar = w.find('[role="progressbar"]')
    expect(bar.attributes('aria-valuenow')).toBe('72')
    expect(bar.attributes('aria-valuemin')).toBe('0')
    expect(bar.attributes('aria-valuemax')).toBe('100')
    expect(bar.attributes('aria-valuetext')).toBe('72 %')
    expect(bar.attributes('aria-label')).toBe('Avance')
    expect(w.find('.g-progress__fill').attributes('style')).toContain('72%')
    expect(w.classes()).toContain('g-progress--color-success')
    expect(w.find('.g-progress__row').text()).toContain('72 %')
  })

  it('recorta el valor a [0, max], usa max y un texto por defecto; showValue=false lo oculta', () => {
    const a = mount(GProgress, { props: { value: 150, label: 'A' } })
    expect(a.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('100')
    const b = mount(GProgress, { props: { value: -5, label: 'A' } })
    expect(b.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('0')
    const c = mount(GProgress, { props: { value: 3, max: 4, label: 'A' } })
    expect(c.find('.g-progress__fill').attributes('style')).toContain('75%')
    expect(c.find('.g-progress__row').text()).toContain('75%')
    const d = mount(GProgress, { props: { value: 3, label: 'A', showValue: false } })
    expect(d.find('.g-progress__row').text()).toBe('A')
  })

  it('avisa sin label', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(GProgress, { props: { value: 1 } })
    expect(warn.mock.calls.some((c) => String(c[0]).includes('label'))).toBe(true)
  })
})

describe('GDataList', () => {
  const rows = [{ label: 'API', value: 'Operativo' }, { label: 'Pagos', value: 'Degradado', swatch: 2 }, { label: 'Correo', value: 'Operativo' }, { label: 'Archivos', value: 'Incidente' }, { label: 'Otro', value: '1' }]
  it('lista con nombre y filas etiqueta–valor', () => {
    const w = mount(GDataList, { props: { rows, label: 'Servicios' } })
    expect(w.element.tagName).toBe('UL')
    expect(w.attributes('aria-label')).toBe('Servicios')
    expect(w.findAll('li')).toHaveLength(5)
    expect(w.find('.g-data-list__label').text()).toBe('API')
    expect(w.find('.g-data-list__value').text()).toBe('Operativo')
    expect(w.find('.g-data-list__swatch').exists()).toBe(false)
  })

  it('con swatches: muestras aria-hidden con data-swatch cíclico (0 a 3) o fijado por la fila', () => {
    const w = mount(GDataList, { props: { rows, swatches: true } })
    const sw = w.findAll('.g-data-list__swatch')
    expect(sw.map((s) => s.attributes('data-swatch'))).toEqual(['0', '2', '2', '3', '0'])
    expect(sw[0].attributes('aria-hidden')).toBe('true')
  })

  it('ignora filas sin label y avisa', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(GDataList, { props: { rows: [{ value: 1 }, { label: 'A', value: 2 }] } })
    expect(w.findAll('li')).toHaveLength(1)
    expect(warn).toHaveBeenCalled()
  })
})
