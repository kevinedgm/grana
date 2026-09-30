import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, h } from 'vue'
import GWidgetGrid from './GWidgetGrid.vue'
import GWidget from '../GWidget/GWidget.vue'

beforeEach(() => {
  HTMLElement.prototype.showPopover = function () { this.setAttribute('data-popover-open', '') }
  HTMLElement.prototype.hidePopover = function () { this.removeAttribute('data-popover-open') }
  const orig = HTMLElement.prototype.matches
  HTMLElement.prototype.matches = function (sel) { return sel === ':popover-open' ? this.hasAttribute('data-popover-open') : orig.call(this, sel) }
})
afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = ''; delete globalThis.ResizeObserver })

const LABELS = {
  grab: 'Mover {title}. Posición {position} de {count}', grabRole: 'elemento reordenable', resize: 'Cambiar el tamaño de {title}: {columns} × {rows}',
  grabbed: '{title} recogido. Posición {position} de {count}.', moved: 'Posición {position} de {count}', dropped: '{title} soltado en la posición {position} de {count}', cancelled: 'Movimiento cancelado. {title} vuelve a la posición {position}',
  resized: '{title}: {columns} × {rows}', removed: '{title} quitado', moveBefore: 'Mover antes', moveAfter: 'Mover después', size: 'Tamaño', remove: 'Quitar', presets: { s: 'Pequeño', m: 'Mediano', l: 'Grande', wide: 'Ancho', tall: 'Alto' }, empty: 'Sin widgets'
}
const WLABELS = { actions: 'Acciones de' }
const LAYOUT = [{ id: 'a', w: 2, h: 2 }, { id: 'b', w: 1, h: 1 }, { id: 'c', w: 1, h: 1 }, { id: 'd', w: 2, h: 1 }]
const TITLES = { a: 'Ingresos', b: 'Meta', c: 'Servicios', d: 'Actividad' }
const itemSlot = ({ id }) => h(GWidget, { title: TITLES[id], labels: WLABELS })
const mk = (props = {}, opts = {}) => mount(GWidgetGrid, { attachTo: document.body, props: { modelValue: LAYOUT, label: 'Panel', labels: LABELS, editable: true, columns: 4, ...props }, slots: { item: itemSlot }, ...opts })
const lis = (w) => w.findAll('.g-widget-grid__item')
const li = (w, id) => w.find(`.g-widget-grid__item[data-id="${id}"]`)
const grabBtn = (w, id) => li(w, id).find('.g-widget-grid__grab')
const rzBtn = (w, id) => li(w, id).find('.g-widget-grid__resize')
const live = (w) => w.find('[role="status"]').text()
const last = (w, ev) => w.emitted(ev)?.at(-1)?.[0]
const settle = async () => { for (let i = 0; i < 4; i++) await nextTick() }

describe('GWidgetGrid · estructura', () => {
  it('raíz, lista con nombre y celdas con span de columnas y filas, y order', () => {
    const w = mk()
    expect(w.classes()).toEqual(expect.arrayContaining(['g-widget-grid', 'g-widget-grid--density-default', 'is-editing']))
    const ul = w.find('ul.g-widget-grid__list')
    expect(ul.attributes('role')).toBe('list')
    expect(ul.attributes('aria-label')).toBe('Panel')
    expect(ul.attributes('style')).toContain('--_cols: 4')
    expect(lis(w)).toHaveLength(4)
    expect(li(w, 'a').attributes('style')).toContain('span 2')
    expect(li(w, 'a').element.style.gridRow).toBe('span 2')
    expect(lis(w).map((l) => l.element.style.order)).toEqual(['0', '1', '2', '3'])
    expect(w.find('[role="status"]').attributes('aria-live')).toBe('polite')
  })

  it('cada celda contiene el widget del slot item con su título', () => {
    const w = mk()
    expect(w.findAll('article.g-widget')).toHaveLength(4)
    expect(li(w, 'b').find('.g-widget__title').text()).toBe('Meta')
    expect(li(w, 'a').element.querySelector('.g-widget').classList.contains('is-editing')).toBe(true)
  })

  it('sin editable no hay asas ni is-editing; los widgets siguen funcionando solos', () => {
    const w = mk({ editable: false })
    expect(w.findAll('.g-widget-grid__grab')).toHaveLength(0)
    expect(w.classes()).not.toContain('is-editing')
    expect(mount(GWidget, { props: { title: 'X' } }).exists()).toBe(true)
  })

  it('las asas: nombre con posición y título, aria-roledescription, aria-pressed', async () => {
    const w = mk()
    await settle()
    const g = grabBtn(w, 'a')
    expect(g.element.tagName).toBe('BUTTON')
    expect(g.attributes('aria-label')).toBe('Mover Ingresos. Posición 1 de 4')
    expect(g.attributes('aria-roledescription')).toBe('elemento reordenable')
    expect(g.attributes('aria-pressed')).toBe('false')
    expect(rzBtn(w, 'a').attributes('aria-label')).toBe('Cambiar el tamaño de Ingresos: 2 × 2')
    expect(grabBtn(w, 'd').attributes('aria-label')).toBe('Mover Actividad. Posición 4 de 4')
  })

  it('ignora entradas inválidas y ids duplicados (avisa) y muestra el slot empty sin widgets', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mk({ modelValue: [{ id: 'a', w: 1, h: 1 }, { id: 'a', w: 2, h: 2 }, { id: 'x', w: 0, h: 1 }, null] })
    expect(lis(w)).toHaveLength(1)
    expect(warn.mock.calls.some((c) => String(c[0]).includes('mismo id'))).toBe(true)
    const e = mk({ modelValue: [] })
    expect(e.find('.g-widget-grid__empty').text()).toBe('Sin widgets')
    expect(e.find('ul').exists()).toBe(false)
  })
})

describe('GWidgetGrid · columnas por el ancho de la rejilla', () => {
  let width
  let cb
  beforeEach(() => {
    width = 1000
    globalThis.ResizeObserver = class { constructor(f) { cb = f } observe() {} disconnect() {} }
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () { return { width: this.classList?.contains('g-widget-grid') ? width : 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 } })
  })
  const auto = async () => { const w = mk({ columns: undefined }); await nextTick(); return w }
  const cols = (w) => w.find('ul').attributes('style').match(/--_cols: (\d)/)[1]

  it('4 columnas con ≥ 960, 2 con ≥ 560 y 1 por debajo; umbrales exactos', async () => {
    const w = await auto()
    expect(cols(w)).toBe('4')
    for (const [px, c] of [[959, '2'], [960, '4'], [560, '2'], [559, '1']]) { width = px; cb(); await nextTick(); expect(cols(w)).toBe(c) }
  })

  it('los spans se recortan al máximo de columnas sin cambiar el dato', async () => {
    const w = await auto()
    width = 700; cb(); await nextTick()
    expect(cols(w)).toBe('2')
    const wide = mk({ modelValue: [{ id: 'a', w: 4, h: 1 }], columns: undefined }); await nextTick()
    width = 700; cb(); await nextTick()
    expect(li(wide, 'a').attributes('style')).toContain('span 2')
    expect(wide.props('modelValue')[0].w).toBe(4)
    width = 400; cb(); await nextTick()
    expect(li(wide, 'a').attributes('style')).toContain('span 1')
  })

  it('columns fija el número; maxColumns limita lo que ocupa un widget', () => {
    expect(cols(mk({ columns: 2 }))).toBe('2')
    const w = mk({ modelValue: [{ id: 'a', w: 4, h: 1 }], maxColumns: 3 })
    expect(li(w, 'a').attributes('style')).toContain('span 3')
  })
})

describe('GWidgetGrid · reordenar con el teclado', () => {
  it('Espacio recoge (aria-pressed, is-grabbed, anuncio); ← ↑ → ↓ mueven; sin recoger no hacen nada', async () => {
    const w = mk(); await settle()
    await grabBtn(w, 'a').trigger('keydown', { key: 'ArrowRight' })
    expect(lis(w).map((l) => l.element.style.order)).toEqual(['0', '1', '2', '3'])
    await grabBtn(w, 'a').trigger('keydown', { key: ' ' }); await nextTick(); await nextTick()
    expect(grabBtn(w, 'a').attributes('aria-pressed')).toBe('true')
    expect(li(w, 'a').classes()).toContain('is-grabbed')
    expect(live(w)).toBe('Ingresos recogido. Posición 1 de 4.')
    await grabBtn(w, 'a').trigger('keydown', { key: 'ArrowRight' }); await nextTick(); await nextTick()
    expect(li(w, 'a').element.style.order).toBe('1')
    expect(li(w, 'b').element.style.order).toBe('0')
    expect(live(w)).toBe('Posición 2 de 4')
    expect(w.emitted('update:modelValue')).toBeUndefined() // previsualiza, no emite
    await grabBtn(w, 'a').trigger('keydown', { key: 'ArrowLeft' }); await grabBtn(w, 'a').trigger('keydown', { key: 'ArrowUp' })
    expect(li(w, 'a').element.style.order).toBe('0')
  })

  it('soltar confirma: emite update:modelValue y change (reason move) con el layout nuevo; conserva campos extra', async () => {
    const w = mk({ modelValue: [{ id: 'a', w: 2, h: 2, extra: 1 }, { id: 'b', w: 1, h: 1 }, { id: 'c', w: 1, h: 1 }] }); await settle()
    await grabBtn(w, 'a').trigger('keydown', { key: 'Enter' })
    await grabBtn(w, 'a').trigger('keydown', { key: 'ArrowRight' }); await grabBtn(w, 'a').trigger('keydown', { key: 'ArrowRight' })
    await grabBtn(w, 'a').trigger('keydown', { key: 'Enter' }); await settle()
    expect(last(w, 'update:modelValue').map((e) => e.id)).toEqual(['b', 'c', 'a'])
    expect(last(w, 'update:modelValue')[2]).toEqual({ id: 'a', w: 2, h: 2, extra: 1 })
    expect(last(w, 'change')).toMatchObject({ reason: 'move', id: 'a' })
    expect(grabBtn(w, 'a').attributes('aria-pressed')).toBe('false')
    expect(live(w)).toContain('soltado en la posición')
  })

  it('si la aplicación no actualiza el prop, la rejilla vuelve al orden del prop', async () => {
    const w = mk(); await settle()
    await grabBtn(w, 'a').trigger('keydown', { key: ' ' })
    await grabBtn(w, 'a').trigger('keydown', { key: 'ArrowRight' })
    await grabBtn(w, 'a').trigger('keydown', { key: ' ' }); await settle()
    expect(lis(w).map((l) => l.element.style.order)).toEqual(['0', '1', '2', '3'])
  })

  it('con el prop actualizado, el DOM sigue al layout y el foco vuelve al asa', async () => {
    const w = mk(); await settle()
    await grabBtn(w, 'a').trigger('keydown', { key: ' ' })
    await grabBtn(w, 'a').trigger('keydown', { key: 'ArrowRight' })
    await grabBtn(w, 'a').trigger('keydown', { key: ' ' })
    await w.setProps({ modelValue: last(w, 'update:modelValue') }); await settle()
    expect(lis(w).map((l) => l.attributes('data-id'))).toEqual(['b', 'a', 'c', 'd'])
    expect(document.activeElement).toBe(grabBtn(w, 'a').element)
    expect(grabBtn(w, 'a').attributes('aria-label')).toBe('Mover Ingresos. Posición 2 de 4')
  })

  it('Esc cancela: vuelve al lugar, no emite y anuncia; no llega a un ancestro', async () => {
    const w = mk(); await settle()
    await grabBtn(w, 'a').trigger('keydown', { key: ' ' })
    await grabBtn(w, 'a').trigger('keydown', { key: 'ArrowRight' })
    await grabBtn(w, 'a').trigger('keydown', { key: 'Escape' }); await settle()
    expect(li(w, 'a').element.style.order).toBe('0')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(live(w)).toContain('cancelado')
    expect(grabBtn(w, 'a').attributes('aria-pressed')).toBe('false')
  })

  it('los extremos no se pasan (no se mueve más allá del primero ni del último)', async () => {
    const w = mk(); await settle()
    await grabBtn(w, 'a').trigger('keydown', { key: ' ' })
    await grabBtn(w, 'a').trigger('keydown', { key: 'ArrowLeft' })
    expect(li(w, 'a').element.style.order).toBe('0')
  })
})

describe('GWidgetGrid · redimensionar', () => {
  it('flechas: → ← columnas, ↓ ↑ filas; cada pulsación emite (reason resize) y anuncia', async () => {
    const w = mk(); await settle()
    await rzBtn(w, 'b').trigger('keydown', { key: 'ArrowRight' }); await settle()
    expect(last(w, 'update:modelValue').find((e) => e.id === 'b')).toEqual({ id: 'b', w: 2, h: 1 })
    expect(last(w, 'change')).toMatchObject({ reason: 'resize', id: 'b' })
    expect(live(w)).toBe('Meta: 2 × 1')
    await rzBtn(w, 'b').trigger('keydown', { key: 'ArrowDown' }); await settle()
    expect(last(w, 'update:modelValue').find((e) => e.id === 'b').h).toBe(2)
  })

  it('respeta los límites: mínimo 1, máximo de columnas y de filas', async () => {
    const w = mk({ maxRows: 2 }); await settle()
    await rzBtn(w, 'b').trigger('keydown', { key: 'ArrowLeft' })
    expect(w.emitted('update:modelValue')).toBeUndefined()
    await rzBtn(w, 'a').trigger('keydown', { key: 'ArrowDown' })
    expect(w.emitted('update:modelValue')).toBeUndefined()
    await rzBtn(w, 'a').trigger('keydown', { key: 'ArrowRight' }); await settle()
    expect(last(w, 'update:modelValue').find((e) => e.id === 'a').w).toBe(3)
  })

  it('con 2 columnas el máximo es 2 aunque el dato pida más', async () => {
    const w = mk({ columns: 2, modelValue: [{ id: 'a', w: 4, h: 1 }] }); await settle()
    await rzBtn(w, 'a').trigger('keydown', { key: 'ArrowRight' }); await settle()
    expect(last(w, 'update:modelValue')[0].w).toBeLessThanOrEqual(2)
    await rzBtn(w, 'a').trigger('keydown', { key: 'ArrowLeft' }); await settle()
    expect(last(w, 'update:modelValue')[0].w).toBe(1)
  })
})

describe('GWidgetGrid · menú del widget (sin arrastrar)', () => {
  const openMenu = async (w, id) => { await li(w, id).find('.g-widget__menu').trigger('click'); await settle() }
  const item = (w, id, text) => li(w, id).findAll('[role="menuitem"]').find((x) => x.text().startsWith(text))

  it('el widget de una celda añade las acciones de la rejilla tras un separador, con tamaños y «Quitar»', async () => {
    const w = mk(); await settle()
    await openMenu(w, 'b')
    const menu = li(w, 'b').find('[role="menu"]')
    expect(menu.findAll('[role="menuitem"]').map((x) => x.text())).toEqual(['Mover antes', 'Mover después', 'Pequeño (1 × 1)', 'Mediano (2 × 1)', 'Grande (2 × 2)', 'Ancho (4 × 1)', 'Alto (1 × 2)', 'Quitar'])
    expect(menu.find('[role="separator"]').exists()).toBe(true)
    expect(menu.find('[role="presentation"]').text()).toBe('Tamaño')
  })

  it('«Mover antes» está deshabilitado en el primero y «Mover después» en el último', async () => {
    const w = mk(); await settle()
    await openMenu(w, 'a')
    expect(item(w, 'a', 'Mover antes').attributes('aria-disabled')).toBe('true')
    expect(item(w, 'a', 'Mover después').attributes('aria-disabled')).toBeUndefined()
    await li(w, 'a').find('[role="menu"]').trigger('keydown', { key: 'Escape' })
    await openMenu(w, 'd')
    expect(item(w, 'd', 'Mover después').attributes('aria-disabled')).toBe('true')
  })

  it('«Mover después» confirma el movimiento, lo anuncia y devuelve el foco al menú del widget', async () => {
    const w = mk(); await settle()
    await openMenu(w, 'b')
    await item(w, 'b', 'Mover después').trigger('click'); await settle()
    expect(last(w, 'update:modelValue').map((e) => e.id)).toEqual(['a', 'c', 'b', 'd'])
    expect(last(w, 'change')).toMatchObject({ reason: 'move', id: 'b' })
    expect(live(w)).toBe('Posición 3 de 4')
  })

  it('un tamaño predefinido emite el tamaño y lo anuncia', async () => {
    const w = mk(); await settle()
    await openMenu(w, 'b')
    await item(w, 'b', 'Ancho').trigger('click'); await settle()
    expect(last(w, 'update:modelValue').find((e) => e.id === 'b')).toEqual({ id: 'b', w: 4, h: 1 })
    expect(last(w, 'change').reason).toBe('resize')
    expect(live(w)).toBe('Meta: 4 × 1')
  })

  it('«Quitar» emite remove-request; al quitarla la aplicación, se anuncia y el foco pasa al menú del siguiente', async () => {
    const w = mk(); await settle()
    await openMenu(w, 'b')
    await item(w, 'b', 'Quitar').trigger('click'); await settle()
    expect(last(w, 'remove-request')).toEqual({ id: 'b' })
    expect(w.emitted('update:modelValue')).toBeUndefined() // quitar lo decide la aplicación
    await w.setProps({ modelValue: LAYOUT.filter((e) => e.id !== 'b') }); await settle()
    expect(live(w)).toBe('Meta quitado')
    expect(document.activeElement).toBe(li(w, 'c').find('.g-widget__menu').element)
  })

  it('sin editable el widget no añade acciones de la rejilla', async () => {
    const w = mk({ editable: false }); await settle()
    expect(li(w, 'a').find('.g-widget__menu').exists()).toBe(false)
  })
})

describe('GWidgetGrid · puntero', () => {
  it('arrastrar el asa sobre otro widget previsualiza en vivo y al soltar emite y anuncia', async () => {
    const w = mk(); await settle()
    const target = li(w, 'c').element
    document.elementFromPoint = vi.fn(() => target)
    await grabBtn(w, 'a').trigger('pointerdown', { pointerId: 1, pointerType: 'mouse', button: 0, clientX: 10, clientY: 10 })
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 200, clientY: 10 }))
    await nextTick()
    expect(li(w, 'a').classes()).toContain('is-dragging')
    expect(li(w, 'a').element.style.order).toBe('2')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    window.dispatchEvent(new MouseEvent('pointerup', { clientX: 200, clientY: 10 })); await settle()
    expect(last(w, 'update:modelValue').map((e) => e.id)).toEqual(['b', 'c', 'a', 'd'])
    expect(live(w)).toContain('soltado en la posición 3')
  })

  it('arrastrar la esquina cambia columnas y filas de celda en celda y emite al soltar', async () => {
    const w = mk({ modelValue: [{ id: 'b', w: 1, h: 1 }] }); await settle()
    const ul = w.find('ul').element
    vi.spyOn(window, 'getComputedStyle').mockImplementation(() => ({ columnGap: '16px', rowGap: '16px', gridAutoRows: '112px', direction: 'ltr', getPropertyValue: () => '' }))
    Object.defineProperty(ul, 'clientWidth', { value: 1000, configurable: true })
    await rzBtn(w, 'b').trigger('pointerdown', { pointerId: 1, pointerType: 'mouse', button: 0, clientX: 0, clientY: 0 })
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 250 + 16, clientY: 128 }))
    await nextTick()
    expect(w.emitted('update:modelValue')).toBeUndefined()
    window.dispatchEvent(new MouseEvent('pointerup', { clientX: 250, clientY: 128 })); await settle()
    expect(last(w, 'update:modelValue')[0]).toEqual({ id: 'b', w: 2, h: 2 })
    expect(last(w, 'change').reason).toBe('resize')
  })
})

describe('GWidgetGrid · avisos y validadores', () => {
  it('avisa sin label, sin slot item o con editable sin labels.grab/resize', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(GWidgetGrid, { props: { modelValue: [], editable: true } })
    const msgs = warn.mock.calls.map((c) => String(c[0]))
    expect(msgs.some((m) => m.includes('necesita label'))).toBe(true)
    expect(msgs.some((m) => m.includes('slot item'))).toBe(true)
    expect(msgs.some((m) => m.includes('labels.grab'))).toBe(true)
  })

  it('validadores de columns, maxColumns, maxRows y density', () => {
    const p = GWidgetGrid.props
    expect(p.columns.validator(4)).toBe(true)
    expect(p.columns.validator(5)).toBe(false)
    expect(p.maxColumns.validator(0)).toBe(false)
    expect(p.maxRows.validator(6)).toBe(true)
    expect(p.maxRows.validator(7)).toBe(false)
    expect(p.density.validator('dense')).toBe(false)
  })
})
