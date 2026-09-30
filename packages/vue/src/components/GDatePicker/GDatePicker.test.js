import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, h } from 'vue'
import GDatePicker from './GDatePicker.vue'

// «Hoy» fijo. No se congela Date: Vue descarta escuchas de eventos si Date.now() no avanza (comparación de marcas de tiempo).
vi.mock('../../utils/dates.js', async (orig) => ({ ...(await orig()), todayISO: () => '2026-10-15' }))

// jsdom no implementa popover: se simula (showPopover/hidePopover y :popover-open).
beforeEach(() => {
  HTMLElement.prototype.showPopover = function () { this.setAttribute('data-popover-open', '') }
  HTMLElement.prototype.hidePopover = function () { this.removeAttribute('data-popover-open') }
  const orig = HTMLElement.prototype.matches
  HTMLElement.prototype.matches = function (sel) { return sel === ':popover-open' ? this.hasAttribute('data-popover-open') : orig.call(this, sel) }
})
afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

const LABELS = {
  prev: 'Mes anterior', next: 'Mes siguiente', dialog: 'Elegir fechas', close: 'Cerrar',
  today: 'hoy', selected: 'seleccionada', rangeStart: 'inicio del rango', rangeEnd: 'fin del rango', rangeSingle: 'inicio y fin del rango', inRange: 'dentro del rango', unavailable: 'no disponible',
  clear: 'Limpiar', done: 'Listo', proximityGroup: 'Ampliar el rango',
  announceStart: 'Inicio: {date}', announceEnd: 'Rango de {start} a {end}, {days} días', announceDate: '{date} seleccionada', announceWiden: 'Ampliado: {start} a {end}', announceClear: 'Borrado'
}
const mk = (props = {}, opts = {}) => mount(GDatePicker, { attachTo: document.body, props: { locale: 'es', firstDay: 1, months: 1, labels: LABELS, ...props }, ...opts })
const inline = (props = {}, opts = {}) => mk({ inline: true, ...props }, opts)
const day = (w, iso) => w.find(`[data-date="${iso}"]`)
const cellOf = (w, iso) => day(w, iso).element.parentElement
const click = async (w, iso) => { await day(w, iso).trigger('click'); await nextTick() }
const key = async (w, iso, k, extra = {}) => { await day(w, iso).trigger('keydown', { key: k, ...extra }); await nextTick(); await nextTick() }
const last = (w, ev) => w.emitted(ev)?.at(-1)?.[0]
const RANGE = { start: '2026-10-08', end: '2026-10-13' }

describe('GDatePicker · render en línea', () => {
  it('la raíz y la superficie; 6 filas de 7 días por mes; encabezados con nombre completo oculto', () => {
    const w = inline({ modelValue: '2026-10-20' })
    expect(w.classes()).toEqual(expect.arrayContaining(['g-datepicker', 'g-datepicker--inline', 'g-datepicker--mode-single', 'g-datepicker--color-brand']))
    expect(w.find('.g-datepicker__surface').exists()).toBe(true)
    expect(w.find('.g-datepicker__pop').exists()).toBe(false)
    expect(w.findAll('tbody tr')).toHaveLength(6)
    expect(w.findAll('tbody tr')[0].findAll('td')).toHaveLength(7)
    const th = w.findAll('th[scope="col"]')
    expect(th).toHaveLength(7)
    expect(th[0].find('[aria-hidden="true"]').text()).toBe('L')
    expect(th[0].find('.g-datepicker__sr').text()).toBe('lunes')
    expect(w.find('table').attributes('role')).toBe('grid')
  })

  it('el título del mes lleva un espacio entre mes y año y liga la cuadrícula por aria-labelledby', () => {
    const w = inline({ modelValue: '2026-10-20' })
    const h3 = w.find('h3')
    expect(h3.text()).toBe('octubre 2026')
    expect(h3.attributes('aria-live')).toBe('polite')
    expect(w.find('table').attributes('aria-labelledby')).toBe(h3.attributes('id'))
    expect(w.find('section').attributes('aria-labelledby')).toBe(h3.attributes('id'))
  })

  it('firstDay cambia el orden de los encabezados', () => {
    const w = inline({ modelValue: '2026-10-20', firstDay: 0 })
    expect(w.findAll('th .g-datepicker__sr').map((x) => x.text())[0]).toBe('domingo')
  })

  it('un solo tabstop: el día con foco (el elegido) tiene tabindex 0', () => {
    const w = inline({ modelValue: '2026-10-20' })
    const zero = w.findAll('.g-datepicker__day').filter((b) => b.attributes('tabindex') === '0')
    expect(zero).toHaveLength(1)
    expect(zero[0].attributes('data-date')).toBe('2026-10-20')
  })

  it('el nombre de cada día es la fecha completa más los sufijos de labels', () => {
    const w = inline({ modelValue: '2026-10-15' })
    expect(day(w, '2026-10-15').attributes('aria-label')).toBe('jueves, 15 de octubre de 2026, hoy, seleccionada')
    expect(day(w, '2026-10-16').attributes('aria-label')).toBe('viernes, 16 de octubre de 2026')
  })

  it('sin labels los días conservan su fecha completa (degradan sin fallar)', () => {
    const w = inline({ modelValue: '2026-10-15', labels: {} })
    expect(day(w, '2026-10-15').attributes('aria-label')).toBe('jueves, 15 de octubre de 2026')
  })

  it('hoy lleva is-today; la fecha única is-selected y aria-selected en la celda', () => {
    const w = inline({ modelValue: '2026-10-20' })
    expect(day(w, '2026-10-15').classes()).toContain('is-today')
    expect(day(w, '2026-10-20').classes()).toContain('is-selected')
    expect(cellOf(w, '2026-10-20').getAttribute('aria-selected')).toBe('true')
    expect(cellOf(w, '2026-10-21').getAttribute('aria-selected')).toBe('false')
  })

  it('un mes: los días de otro mes se muestran atenuados (is-outside) y elegibles', () => {
    const w = inline({ modelValue: '2026-10-20' })
    expect(day(w, '2026-09-30').classes()).toContain('is-outside')
    expect(day(w, '2026-09-30').attributes('aria-disabled')).toBeUndefined()
    expect(w.findAll('.g-datepicker__day')).toHaveLength(42)
  })

  it('dos meses: los días de otro mes se dejan en blanco (aria-hidden) y hay dos títulos', () => {
    const w = inline({ modelValue: '2026-10-20', months: 2 })
    expect(w.findAll('section')).toHaveLength(2)
    expect(w.findAll('h3').map((x) => x.text())).toEqual(['octubre 2026', 'noviembre 2026'])
    expect(day(w, '2026-09-30').exists()).toBe(false)
    expect(w.findAll('.g-datepicker__day.is-outside')).toHaveLength(0)
    expect(w.findAll('td[aria-hidden="true"]').length).toBeGreaterThan(0)
  })

  it('dos meses: «anterior» solo en el primero y «siguiente» solo en el último (el otro, oculto y fuera del foco)', () => {
    const w = inline({ modelValue: '2026-10-20', months: 2 })
    const prev = w.findAll('.g-datepicker__nav--prev')
    const next = w.findAll('.g-datepicker__nav--next')
    expect(prev[0].attributes('hidden')).toBeUndefined()
    expect(prev[1].attributes('hidden')).toBeDefined()
    expect(prev[1].attributes('aria-hidden')).toBe('true')
    expect(prev[1].attributes('tabindex')).toBe('-1')
    expect(next[0].attributes('hidden')).toBeDefined()
    expect(next[1].attributes('hidden')).toBeUndefined()
    expect(prev[0].attributes('aria-label')).toBe('Mes anterior')
  })

  it('clase de color, densidad y tamaño siguen a las props; class y style van a la raíz', () => {
    const w = inline({ modelValue: null, color: 'accent', rounded: 'lg' }, { attrs: { class: 'mi-clase', style: 'margin: 0', 'data-x': '1' } })
    expect(w.classes()).toEqual(expect.arrayContaining(['g-datepicker--color-accent', 'g-datepicker--rounded-lg', 'mi-clase']))
    expect(w.attributes('style')).toContain('margin')
  })
})

describe('GDatePicker · valor', () => {
  it('un valor inválido se trata como vacío y avisa una sola vez', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = inline({ modelValue: '2026-02-30' })
    expect(w.findAll('.g-datepicker__day.is-selected')).toHaveLength(0)
    await w.setProps({ modelValue: 'mañana' })
    expect(warn.mock.calls.filter((c) => String(c[0]).includes('modelValue inválido'))).toHaveLength(1)
  })

  it('en range, un objeto con start > end o un string se trata como vacío', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(inline({ mode: 'range', modelValue: { start: '2026-10-13', end: '2026-10-08' } }).findAll('.is-selected')).toHaveLength(0)
    expect(inline({ mode: 'range', modelValue: '2026-10-13' }).findAll('.is-selected')).toHaveLength(0)
  })

  it('el año bisiesto es válido (2028-02-29) y el 2027-02-29 no', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(inline({ modelValue: '2028-02-29' }).find('[data-date="2028-02-29"]').classes()).toContain('is-selected')
    expect(inline({ modelValue: '2027-02-29' }).findAll('.is-selected')).toHaveLength(0)
  })
})

describe('GDatePicker · selección de una fecha', () => {
  it('elegir un día emite update:modelValue y change con la cadena ISO', async () => {
    const w = inline({ modelValue: null })
    await click(w, '2026-10-20')
    expect(last(w, 'update:modelValue')).toBe('2026-10-20')
    expect(last(w, 'change')).toBe('2026-10-20')
  })

  it('un día no disponible no se elige', async () => {
    const w = inline({ min: '2026-10-10', max: '2026-10-25', disabledDates: (iso) => iso === '2026-10-20' })
    await click(w, '2026-10-05')
    await click(w, '2026-10-20')
    await click(w, '2026-10-30')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    await click(w, '2026-10-21')
    expect(last(w, 'update:modelValue')).toBe('2026-10-21')
  })

  it('los no disponibles llevan is-disabled y aria-disabled, siguen enfocables y el nombre lo dice', () => {
    const w = inline({ min: '2026-10-10', disabledDates: (iso) => iso === '2026-10-20' })
    for (const iso of ['2026-10-05', '2026-10-20']) {
      const b = day(w, iso)
      expect(b.classes()).toContain('is-disabled')
      expect(b.attributes('aria-disabled')).toBe('true')
      expect(b.attributes('disabled')).toBeUndefined()
      expect(b.attributes('aria-label')).toContain('no disponible')
    }
  })

  it('con un mes, elegir un día de otro mes lo elige y muestra ese mes (navigate)', async () => {
    const w = inline({ modelValue: '2026-10-20' })
    await click(w, '2026-11-02')
    expect(last(w, 'update:modelValue')).toBe('2026-11-02')
    expect(w.find('h3').text()).toBe('noviembre 2026')
    expect(last(w, 'navigate')).toEqual({ month: '2026-11' })
  })

  it('el valor es el prop: si el consumidor no lo actualiza, no cambia lo mostrado', async () => {
    const w = inline({ modelValue: '2026-10-20' })
    await click(w, '2026-10-22')
    expect(day(w, '2026-10-20').classes()).toContain('is-selected')
    expect(day(w, '2026-10-22').classes()).not.toContain('is-selected')
  })

  it('readonly y disabled no eligen', async () => {
    const a = inline({ readonly: true })
    await click(a, '2026-10-20')
    expect(a.emitted('update:modelValue')).toBeUndefined()
    const b = inline({ disabled: true })
    expect(b.find('[data-date="2026-10-20"]').attributes('disabled')).toBeDefined()
  })
})

describe('GDatePicker · selección de un rango', () => {
  it('el primer toque solo emite start (no update:modelValue); el segundo emite el rango completo', async () => {
    const w = inline({ mode: 'range' })
    await click(w, '2026-10-20')
    expect(last(w, 'start')).toEqual({ date: '2026-10-20' })
    expect(w.emitted('update:modelValue')).toBeUndefined()
    await click(w, '2026-10-24')
    expect(last(w, 'update:modelValue')).toEqual({ start: '2026-10-20', end: '2026-10-24' })
    expect(last(w, 'change')).toEqual({ start: '2026-10-20', end: '2026-10-24' })
  })

  it('un día anterior al inicio pendiente cambia el inicio (no invierte)', async () => {
    const w = inline({ mode: 'range' })
    await click(w, '2026-10-20')
    await click(w, '2026-10-18')
    expect(w.emitted('start')).toHaveLength(2)
    expect(last(w, 'start')).toEqual({ date: '2026-10-18' })
    expect(w.emitted('update:modelValue')).toBeUndefined()
    await click(w, '2026-10-19')
    expect(last(w, 'update:modelValue')).toEqual({ start: '2026-10-18', end: '2026-10-19' })
  })

  it('un rango de un día: inicio = fin', async () => {
    const w = inline({ mode: 'range' })
    await click(w, '2026-10-20')
    await click(w, '2026-10-20')
    expect(last(w, 'update:modelValue')).toEqual({ start: '2026-10-20', end: '2026-10-20' })
  })

  it('con un rango ya elegido, un toque abre uno nuevo', async () => {
    const w = inline({ mode: 'range', modelValue: RANGE })
    await click(w, '2026-10-20')
    expect(last(w, 'start')).toEqual({ date: '2026-10-20' })
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('la franja: inicio, dentro y fin en las celdas; círculos en inicio y fin', () => {
    const w = inline({ mode: 'range', modelValue: RANGE })
    expect(cellOf(w, '2026-10-08').classList.contains('is-range-start')).toBe(true)
    expect(cellOf(w, '2026-10-13').classList.contains('is-range-end')).toBe(true)
    for (const d of ['09', '10', '11', '12']) expect(cellOf(w, `2026-10-${d}`).classList.contains('is-in-range')).toBe(true)
    expect(day(w, '2026-10-08').classes()).toContain('is-selected')
    expect(day(w, '2026-10-13').classes()).toContain('is-selected')
    expect(day(w, '2026-10-10').classes()).not.toContain('is-selected')
    expect(cellOf(w, '2026-10-14').classList.contains('is-in-range')).toBe(false)
  })

  it('la franja tiene extremos redondeados al saltar de fila (lunes y domingo)', () => {
    const w = inline({ mode: 'range', modelValue: { start: '2026-10-07', end: '2026-10-14' } })
    // 11 es domingo (fin de fila) y 12 es lunes (inicio de fila)
    expect(cellOf(w, '2026-10-11').classList.contains('is-cap-end')).toBe(true)
    expect(cellOf(w, '2026-10-12').classList.contains('is-cap-start')).toBe(true)
    expect(cellOf(w, '2026-10-09').classList.contains('is-cap-start')).toBe(false)
  })

  it('en dos meses la franja se redondea en el último día del primer mes y el primero del segundo', () => {
    const w = inline({ mode: 'range', months: 2, modelValue: { start: '2026-10-28', end: '2026-11-03' } })
    expect(cellOf(w, '2026-10-31').classList.contains('is-cap-end')).toBe(true)
    expect(cellOf(w, '2026-11-01').classList.contains('is-cap-start')).toBe(true)
  })

  it('los nombres dicen inicio, dentro y fin; un rango de un día, inicio y fin', () => {
    const w = inline({ mode: 'range', modelValue: RANGE })
    expect(day(w, '2026-10-08').attributes('aria-label')).toContain('inicio del rango')
    expect(day(w, '2026-10-10').attributes('aria-label')).toContain('dentro del rango')
    expect(day(w, '2026-10-13').attributes('aria-label')).toContain('fin del rango')
    const one = inline({ mode: 'range', modelValue: { start: '2026-10-08', end: '2026-10-08' } })
    expect(day(one, '2026-10-08').attributes('aria-label')).toContain('inicio y fin del rango')
    expect(cellOf(one, '2026-10-08').classList.contains('is-range-start')).toBe(true)
    expect(cellOf(one, '2026-10-08').classList.contains('is-range-end')).toBe(true)
  })

  it('aria-selected en las celdas del rango completo', () => {
    const w = inline({ mode: 'range', modelValue: RANGE })
    for (const d of ['08', '10', '13']) expect(cellOf(w, `2026-10-${d}`).getAttribute('aria-selected')).toBe('true')
    expect(cellOf(w, '2026-10-14').getAttribute('aria-selected')).toBe('false')
  })

  it('mientras se elige el final: vista previa al pasar el puntero y días anteriores «inactivos»', async () => {
    const w = inline({ mode: 'range' })
    await click(w, '2026-10-20')
    expect(day(w, '2026-10-18').classes()).toContain('is-inactive')
    expect(day(w, '2026-10-22').classes()).not.toContain('is-inactive')
    await day(w, '2026-10-23').trigger('pointerover')
    expect(cellOf(w, '2026-10-22').classList.contains('is-preview')).toBe(true)
    expect(cellOf(w, '2026-10-23').classList.contains('is-range-end')).toBe(true)
    expect(day(w, '2026-10-23').classes()).not.toContain('is-selected')
    expect(day(w, '2026-10-20').classes()).toContain('is-selected')
  })

  it('el resumen dice el inicio pendiente y luego el rango formateado', async () => {
    const w = inline({ mode: 'range' })
    await click(w, '2026-10-20')
    expect(w.find('.g-datepicker__summary').text()).toContain('20')
    await w.setProps({ modelValue: { start: '2026-10-28', end: '2026-11-03' } })
    await w.find('.g-datepicker__foot').exists()
    expect(w.find('.g-datepicker__summary').text()).toMatch(/28.*nov.*2026/)
  })
})

describe('GDatePicker · anuncios', () => {
  it('la región status dice cada paso con los textos de labels', async () => {
    const w = inline({ mode: 'range' })
    await click(w, '2026-10-20')
    await nextTick()
    expect(w.find('[role="status"]').text()).toBe('Inicio: martes, 20 de octubre de 2026'.replace('martes', 'martes'))
    await click(w, '2026-10-24')
    await nextTick()
    expect(w.find('[role="status"]').text()).toContain('5 días')
  })

  it('sin announce* no se anuncia nada', async () => {
    const w = inline({ mode: 'range', labels: { prev: 'a', next: 'b' } })
    await click(w, '2026-10-20')
    await nextTick()
    expect(w.find('[role="status"]').text()).toBe('')
  })
})

describe('GDatePicker · teclado', () => {
  it('flechas mueven ±1 y ±7 días; el foco sigue al día', async () => {
    const w = inline({ modelValue: '2026-10-15' })
    await key(w, '2026-10-15', 'ArrowRight')
    expect(day(w, '2026-10-16').attributes('tabindex')).toBe('0')
    await key(w, '2026-10-16', 'ArrowDown')
    expect(day(w, '2026-10-23').attributes('tabindex')).toBe('0')
    await key(w, '2026-10-23', 'ArrowLeft')
    await key(w, '2026-10-22', 'ArrowUp')
    expect(day(w, '2026-10-15').attributes('tabindex')).toBe('0')
    expect(document.activeElement.dataset.date).toBe('2026-10-15')
  })

  it('Inicio y Fin van al primero y último día de la semana (según firstDay)', async () => {
    const w = inline({ modelValue: '2026-10-15' })
    await key(w, '2026-10-15', 'Home')
    expect(document.activeElement.dataset.date).toBe('2026-10-12')
    await key(w, '2026-10-12', 'End')
    expect(document.activeElement.dataset.date).toBe('2026-10-18')
  })

  it('RePág y AvPág cambian de mes y muestran ese mes; con Mayús, de año; emiten navigate', async () => {
    const w = inline({ modelValue: '2026-10-15' })
    await key(w, '2026-10-15', 'PageDown')
    expect(w.find('h3').text()).toBe('noviembre 2026')
    expect(document.activeElement.dataset.date).toBe('2026-11-15')
    expect(last(w, 'navigate')).toEqual({ month: '2026-11' })
    await key(w, '2026-11-15', 'PageUp', { shiftKey: true })
    expect(w.find('h3').text()).toBe('noviembre 2025')
    expect(document.activeElement.dataset.date).toBe('2025-11-15')
  })

  it('AvPág desde el 31 cae en el último día del mes que no lo tiene', async () => {
    const w = inline({ modelValue: '2026-01-31' })
    await key(w, '2026-01-31', 'PageDown')
    expect(document.activeElement.dataset.date).toBe('2026-02-28')
  })

  it('las flechas cruzan de mes y desplazan los meses visibles', async () => {
    const w = inline({ modelValue: '2026-10-31' })
    await key(w, '2026-10-31', 'ArrowRight')
    expect(w.find('h3').text()).toBe('noviembre 2026')
    expect(document.activeElement.dataset.date).toBe('2026-11-01')
  })

  it('los días no disponibles reciben foco pero no se eligen', async () => {
    const w = inline({ min: '2026-10-16', modelValue: null, focusDate: undefined })
    await key(w, '2026-10-15', 'ArrowLeft')
    expect(document.activeElement.dataset.date).toBe('2026-10-14')
  })

  it('el foco en un día con inicio pendiente pinta la vista previa', async () => {
    const w = inline({ mode: 'range' })
    await click(w, '2026-10-20')
    await key(w, '2026-10-20', 'ArrowRight')
    await key(w, '2026-10-21', 'ArrowRight')
    await day(w, '2026-10-22').trigger('focus')
    expect(cellOf(w, '2026-10-22').classList.contains('is-range-end')).toBe(true)
  })

  it('«anterior» y «siguiente» cambian el mes y emiten navigate', async () => {
    const w = inline({ modelValue: '2026-10-15' })
    await w.find('.g-datepicker__nav--next').trigger('click')
    expect(w.find('h3').text()).toBe('noviembre 2026')
    await w.find('.g-datepicker__nav--prev').trigger('click')
    await w.find('.g-datepicker__nav--prev').trigger('click')
    expect(w.find('h3').text()).toBe('septiembre 2026')
    expect(w.emitted('navigate').map((e) => e[0].month)).toEqual(['2026-11', '2026-10', '2026-09'])
  })

  it('deslizar horizontalmente con el dedo cambia de mes; vertical no', async () => {
    const w = inline({ modelValue: '2026-10-15' })
    const m = w.find('.g-datepicker__months')
    await m.trigger('pointerdown', { pointerType: 'touch', clientX: 300, clientY: 100 })
    await m.trigger('pointerup', { pointerType: 'touch', clientX: 120, clientY: 110 })
    expect(w.find('h3').text()).toBe('noviembre 2026')
    await m.trigger('pointerdown', { pointerType: 'touch', clientX: 200, clientY: 100 })
    await m.trigger('pointerup', { pointerType: 'touch', clientX: 200, clientY: 300 })
    expect(w.find('h3').text()).toBe('noviembre 2026')
    await m.trigger('pointerdown', { pointerType: 'touch', clientX: 100, clientY: 100 })
    await m.trigger('pointerup', { pointerType: 'touch', clientX: 260, clientY: 100 })
    expect(w.find('h3').text()).toBe('octubre 2026')
  })
})

describe('GDatePicker · proximidad, resumen y acciones', () => {
  const PROX = [{ days: 1, label: '± 1 día', ariaLabel: 'Ampliar el rango 1 día por cada lado' }, { days: 3, label: '± 3 días' }]

  it('los chips salen del prop proximity; sin ariaLabel el nombre es su texto; sin proximity no hay chips', () => {
    const w = inline({ mode: 'range', modelValue: RANGE, proximity: PROX })
    const chips = w.findAll('.g-datepicker__chip')
    expect(chips.map((c) => c.text())).toEqual(['± 1 día', '± 3 días'])
    expect(chips[0].attributes('aria-label')).toBe('Ampliar el rango 1 día por cada lado')
    expect(chips[1].attributes('aria-label')).toBeUndefined()
    expect(w.find('.g-datepicker__chips').attributes('aria-label')).toBe('Ampliar el rango')
    expect(inline({ mode: 'range', modelValue: RANGE }).find('.g-datepicker__chip').exists()).toBe(false)
  })

  it('los chips están deshabilitados sin rango completo y con un inicio pendiente', async () => {
    const w = inline({ mode: 'range', proximity: PROX })
    expect(w.find('.g-datepicker__chip').attributes('disabled')).toBeDefined()
    const rng = inline({ mode: 'range', proximity: PROX, modelValue: RANGE })
    expect(rng.find('.g-datepicker__chip').attributes('disabled')).toBeUndefined()
    await click(rng, '2026-10-20')
    expect(rng.find('.g-datepicker__chip').attributes('disabled')).toBeDefined()
  })

  it('ampliar suma los días a cada lado y emite el rango nuevo', async () => {
    const w = inline({ mode: 'range', modelValue: RANGE, proximity: PROX })
    await w.findAll('.g-datepicker__chip')[1].trigger('click')
    expect(last(w, 'update:modelValue')).toEqual({ start: '2026-10-05', end: '2026-10-16' })
    expect(last(w, 'change')).toEqual({ start: '2026-10-05', end: '2026-10-16' })
  })

  it('ampliar respeta min y max', async () => {
    const w = inline({ mode: 'range', modelValue: RANGE, proximity: PROX, min: '2026-10-07', max: '2026-10-14' })
    await w.findAll('.g-datepicker__chip')[1].trigger('click')
    expect(last(w, 'update:modelValue')).toEqual({ start: '2026-10-07', end: '2026-10-14' })
  })

  it('proximity se ignora en single; entradas inválidas se descartan', () => {
    expect(inline({ mode: 'single', proximity: PROX }).find('.g-datepicker__chip').exists()).toBe(false)
    const w = inline({ mode: 'range', proximity: [{ days: 0, label: 'x' }, { days: 2 }, null, { days: 2, label: 'dos' }] })
    expect(w.findAll('.g-datepicker__chip').map((c) => c.text())).toEqual(['dos'])
  })

  it('«Limpiar» solo existe con labels.clear y valor; emite null', async () => {
    const w = inline({ mode: 'range', modelValue: RANGE })
    await w.find('.g-datepicker__action').trigger('click')
    expect(last(w, 'update:modelValue')).toBeNull()
    expect(inline({ mode: 'range', modelValue: RANGE, labels: { prev: 'a', next: 'b' } }).find('.g-datepicker__action').exists()).toBe(false)
    expect(inline({ mode: 'range' }).find('.g-datepicker__action').exists()).toBe(false)
  })

  it('«Listo» no existe en línea', () => {
    expect(inline({ mode: 'range', modelValue: RANGE }).find('.g-datepicker__action--primary').exists()).toBe(false)
  })

  it('summary=false oculta el resumen; el slot summary lo sustituye con { start, end, pending, days }', () => {
    expect(inline({ mode: 'range', modelValue: RANGE, summary: false }).find('.g-datepicker__summary').exists()).toBe(false)
    const w = inline({ mode: 'range', modelValue: RANGE }, { slots: { summary: (p) => h('b', `${p.days} días`) } })
    expect(w.find('.g-datepicker__summary').text()).toBe('6 días')
  })

  it('el slot day va dentro del botón, después del número', () => {
    const w = inline({ modelValue: '2026-10-20' }, { slots: { day: (p) => h('i', { class: 'x' }, p.date === '2026-10-20' ? '$' : '') } })
    expect(day(w, '2026-10-20').text()).toBe('20$')
    expect(day(w, '2026-10-20').find('.x').exists()).toBe(true)
    expect(day(w, '2026-10-20').attributes('aria-label')).not.toContain('$')
  })
})

describe('GDatePicker · campo y popover', () => {
  const field = (props = {}, opts = {}) => mk({ label: 'Fechas', placeholder: 'Elige fechas', mode: 'range', ...props }, opts)
  const btn = (w) => w.find('button.g-datepicker__field')
  const pop = (w) => w.find('.g-datepicker__pop')
  const isOpen = (w) => pop(w).element.hasAttribute('data-popover-open')

  it('el campo es un botón con aria-haspopup="dialog" y aria-controls al popover; el popover es un dialog no modal', () => {
    const w = field()
    expect(btn(w).attributes('aria-haspopup')).toBe('dialog')
    expect(btn(w).attributes('aria-expanded')).toBe('false')
    expect(btn(w).attributes('aria-controls')).toBe(pop(w).attributes('id'))
    expect(pop(w).attributes('role')).toBe('dialog')
    expect(pop(w).attributes('popover')).toBe('manual')
    expect(pop(w).attributes('aria-label')).toBe('Elegir fechas')
    expect(pop(w).attributes('aria-modal')).toBeUndefined()
  })

  it('su nombre accesible es la etiqueta más el valor mostrado; con placeholder cuando no hay valor', () => {
    const w = field()
    expect(btn(w).attributes('aria-labelledby')).toBe(`${w.find('.g-datepicker__label').attributes('id')} ${w.find('.g-datepicker__value').attributes('id')}`)
    expect(w.find('.g-datepicker__value').text()).toBe('Elige fechas')
    expect(w.find('.g-datepicker__value').classes()).toContain('g-datepicker__value--placeholder')
  })

  it('el valor se muestra formateado (rango con formatRange, fecha única corta)', () => {
    expect(field({ modelValue: { start: '2026-10-28', end: '2026-11-03' } }).find('.g-datepicker__value').text()).toMatch(/28.*oct.*3.*nov.*2026/)
    expect(field({ mode: 'single', modelValue: '2026-10-28' }).find('.g-datepicker__value').text()).toMatch(/28.*oct.*2026/)
  })

  it('abrir: showPopover, aria-expanded, foco al día elegido, eventos update:open y open', async () => {
    const w = field({ modelValue: RANGE })
    await btn(w).trigger('click')
    await nextTick(); await nextTick(); await nextTick(); await nextTick()
    expect(isOpen(w)).toBe(true)
    expect(btn(w).attributes('aria-expanded')).toBe('true')
    expect(w.classes()).toContain('is-open')
    expect(document.activeElement.dataset.date).toBe('2026-10-08')
    expect(last(w, 'update:open')).toBe(true)
    expect(w.emitted('open')).toHaveLength(1)
  })

  it('sin valor, el foco va a hoy', async () => {
    const w = field()
    await btn(w).trigger('click')
    await nextTick(); await nextTick(); await nextTick(); await nextTick()
    expect(document.activeElement.dataset.date).toBe('2026-10-15')
  })

  it('Esc cierra, devuelve el foco al campo y no llega a un ancestro', async () => {
    const parent = vi.fn()
    const w = mount({ render: () => h('div', { onKeydown: parent }, [h(GDatePicker, { label: 'F', labels: LABELS, locale: 'es', months: 1 })]) }, { attachTo: document.body })
    await w.find('button.g-datepicker__field').trigger('click')
    for (let i = 0; i < 8; i++) await nextTick()
    expect(document.activeElement.classList.contains('g-datepicker__day')).toBe(true)
    await document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()
    expect(w.find('.g-datepicker__pop').element.hasAttribute('data-popover-open')).toBe(false)
    expect(document.activeElement).toBe(w.find('button.g-datepicker__field').element)
    expect(parent).not.toHaveBeenCalled()
  })

  it('clic fuera cierra sin devolver el foco; clic en el campo alterna', async () => {
    const w = field()
    await btn(w).trigger('click')
    await nextTick(); await nextTick()
    expect(isOpen(w)).toBe(true)
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await nextTick()
    expect(isOpen(w)).toBe(false)
    await btn(w).trigger('click'); await nextTick(); await nextTick()
    await btn(w).trigger('click'); await nextTick()
    expect(isOpen(w)).toBe(false)
    expect(last(w, 'update:open')).toBe(false)
    expect(w.emitted('close').length).toBeGreaterThan(0)
  })

  it('cuando el foco sale del popover, cierra (sin devolver el foco)', async () => {
    const other = document.createElement('button'); document.body.append(other)
    const w = field({ modelValue: RANGE })
    await btn(w).trigger('click')
    await nextTick(); await nextTick(); await nextTick(); await nextTick()
    await w.find('.g-datepicker__day').trigger('focusout', { relatedTarget: other })
    await nextTick()
    expect(isOpen(w)).toBe(false)
  })

  it('fecha única: elegir cierra y devuelve el foco al campo', async () => {
    const w = field({ mode: 'single' })
    await btn(w).trigger('click')
    await nextTick(); await nextTick(); await nextTick()
    await click(w, '2026-10-20')
    await nextTick(); await nextTick()
    expect(last(w, 'update:modelValue')).toBe('2026-10-20')
    expect(isOpen(w)).toBe(false)
    expect(document.activeElement).toBe(btn(w).element)
  })

  it('rango sin proximidad: completar cierra; con proximidad: sigue abierto hasta «Listo»', async () => {
    const a = field()
    await btn(a).trigger('click'); await nextTick(); await nextTick()
    await click(a, '2026-10-20'); await click(a, '2026-10-22'); await nextTick(); await nextTick()
    expect(isOpen(a)).toBe(false)
    const b = field({ proximity: [{ days: 1, label: '± 1' }] })
    await btn(b).trigger('click'); await nextTick(); await nextTick()
    await click(b, '2026-10-20'); await click(b, '2026-10-22'); await nextTick(); await nextTick()
    expect(isOpen(b)).toBe(true)
    await b.find('.g-datepicker__action--primary').trigger('click')
    expect(isOpen(b)).toBe(false)
    expect(document.activeElement).toBe(btn(b).element)
  })

  it('closeOnSelect fuerza el cierre o lo impide', async () => {
    const a = field({ closeOnSelect: false })
    await btn(a).trigger('click'); await nextTick(); await nextTick()
    await click(a, '2026-10-20'); await click(a, '2026-10-22'); await nextTick(); await nextTick()
    expect(isOpen(a)).toBe(true)
    const b = field({ mode: 'single', closeOnSelect: false })
    await btn(b).trigger('click'); await nextTick(); await nextTick()
    await click(b, '2026-10-20'); await nextTick()
    expect(isOpen(b)).toBe(true)
  })

  it('cerrar con un inicio pendiente lo descarta: el valor no cambia y al reabrir no hay inicio pendiente', async () => {
    const w = field({ modelValue: RANGE, closeOnSelect: false })
    await btn(w).trigger('click'); await nextTick(); await nextTick()
    await click(w, '2026-10-20')
    expect(w.find('.g-datepicker__summary').text()).toContain('20')
    pop(w).element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()
    expect(w.emitted('update:modelValue')).toBeUndefined()
    await btn(w).trigger('click'); await nextTick(); await nextTick()
    expect(day(w, '2026-10-20').classes()).not.toContain('is-selected')
    expect(day(w, '2026-10-08').classes()).toContain('is-selected')
  })

  it('open controla el popover (update:open)', async () => {
    const w = field()
    await w.setProps({ open: true })
    await nextTick(); await nextTick()
    expect(isOpen(w)).toBe(true)
    await w.setProps({ open: false })
    expect(isOpen(w)).toBe(false)
  })

  it('disabled y readonly no abren; readonly conserva aria-readonly y sigue enfocable', async () => {
    const d = field({ disabled: true })
    expect(btn(d).attributes('disabled')).toBeDefined()
    const r = field({ readonly: true })
    expect(btn(r).attributes('disabled')).toBeUndefined()
    expect(btn(r).attributes('aria-readonly')).toBe('true')
    await btn(r).trigger('click')
    await nextTick()
    expect(isOpen(r)).toBe(false)
  })

  it('error: aria-invalid, is-invalid y mensaje con región viva siempre presente; hint enlazado; required', () => {
    const a = field({ error: 'Mal', hint: 'Ayuda', required: true })
    expect(btn(a).attributes('aria-invalid')).toBe('true')
    expect(a.classes()).toContain('is-invalid')
    expect(btn(a).attributes('aria-required')).toBe('true')
    expect(a.find('.g-datepicker__error').text()).toBe('Mal')
    expect(a.find('.g-datepicker__error').attributes('aria-live')).toBe('polite')
    expect(btn(a).attributes('aria-describedby')).toContain(a.find('.g-datepicker__hint').attributes('id'))
    expect(btn(a).attributes('aria-describedby')).toContain(a.find('.g-datepicker__error').attributes('id'))
    const b = field()
    expect(b.find('.g-datepicker__error').exists()).toBe(true)
    expect(b.find('.g-datepicker__error').text()).toBe('')
    expect(btn(b).attributes('aria-describedby')).toBeUndefined()
  })

  it('aria-*, data-* y escuchas van al botón del campo; class y style a la raíz', async () => {
    const onFocus = vi.fn()
    const w = field({}, { attrs: { 'aria-label': 'X', 'data-t': '1', class: 'k', onFocus } })
    expect(btn(w).attributes('data-t')).toBe('1')
    expect(w.classes()).toContain('k')
    await btn(w).trigger('focus')
    expect(onFocus).toHaveBeenCalled()
  })

  it('name: single = un campo oculto; range = name-start y name-end; disabled los desactiva', () => {
    const a = field({ mode: 'single', name: 'f', modelValue: '2026-10-20' })
    expect(a.find('input[type="hidden"][name="f"]').element.value).toBe('2026-10-20')
    const b = field({ name: 'r', modelValue: RANGE })
    expect(b.find('input[name="r-start"]').element.value).toBe('2026-10-08')
    expect(b.find('input[name="r-end"]').element.value).toBe('2026-10-13')
    expect(field({ name: 'r' }).find('input[name="r-start"]').element.value).toBe('')
  })

  it('el ancho de la hoja móvil trae cabecera con cierre que cierra', async () => {
    const w = field()
    await btn(w).trigger('click'); await nextTick(); await nextTick()
    const close = w.find('.g-datepicker__sheet-close')
    expect(close.attributes('aria-label')).toBe('Cerrar')
    await close.trigger('click')
    expect(isOpen(w)).toBe(false)
  })

  it('métodos expuestos: open y close', async () => {
    const w = field()
    w.vm.open(); await nextTick(); await nextTick()
    expect(isOpen(w)).toBe(true)
    w.vm.close(); await nextTick()
    expect(isOpen(w)).toBe(false)
  })
})

describe('GDatePicker · split (Desde / Hasta)', () => {
  const split = (props = {}) => mk({ mode: 'range', split: true, label: 'Estancia', labelStart: 'Desde', labelEnd: 'Hasta', placeholderStart: 'Inicio', placeholderEnd: 'Fin', ...props })

  it('dos botones en un grupo con etiquetas propias; comparten UNA superficie', () => {
    const w = split({ modelValue: RANGE })
    const btns = w.findAll('button.g-datepicker__field')
    expect(btns).toHaveLength(2)
    expect(w.find('[role="group"]').exists()).toBe(true)
    expect(w.classes()).toContain('g-datepicker--split')
    expect(w.findAll('.g-datepicker__pop')).toHaveLength(1)
    expect(btns[0].text()).toMatch(/8.*oct.*2026/)
    expect(btns[1].text()).toMatch(/13.*oct.*2026/)
    expect(w.findAll('.g-datepicker__label').map((l) => l.text())).toEqual(['Estancia', 'Desde', 'Hasta'])
  })

  it('sin valor muestran su placeholder; solo el botón que abrió lleva aria-expanded', async () => {
    const w = split()
    const btns = w.findAll('button.g-datepicker__field')
    expect(btns[0].text()).toBe('Inicio')
    expect(btns[1].text()).toBe('Fin')
    await btns[1].trigger('click'); await nextTick(); await nextTick()
    expect(btns[0].attributes('aria-expanded')).toBe('false')
    expect(btns[1].attributes('aria-expanded')).toBe('true')
  })

  it('el foco vuelve al botón que abrió', async () => {
    const w = split({ modelValue: RANGE })
    const btns = w.findAll('button.g-datepicker__field')
    await btns[1].trigger('click'); await nextTick(); await nextTick(); await nextTick()
    w.find('.g-datepicker__pop').element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()
    expect(document.activeElement).toBe(btns[1].element)
  })

  it('avisa si faltan labelStart o labelEnd', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    split({ labelStart: undefined })
    expect(warn.mock.calls.some((c) => String(c[0]).includes('labelStart'))).toBe(true)
  })
})

describe('GDatePicker · slot trigger', () => {
  it('sustituye al campo: no hay label, botón ni mensajes; entrega el alcance', async () => {
    let scope
    const w = mk({ mode: 'range', label: 'X', modelValue: RANGE }, { slots: { trigger: (s) => { scope = s; return h('button', { class: 'mio', 'aria-haspopup': 'dialog', 'aria-expanded': String(s.expanded), 'aria-controls': s.controls, onClick: s.toggle }, s.text) } } })
    expect(w.find('.g-datepicker__field').exists()).toBe(false)
    expect(w.find('.g-datepicker__label').exists()).toBe(false)
    expect(w.find('.mio').text()).toMatch(/8.*oct/)
    expect(scope.controls).toBe(w.find('.g-datepicker__pop').attributes('id'))
    expect(scope.value).toEqual(RANGE)
    await w.find('.mio').trigger('click'); await nextTick(); await nextTick(); await nextTick()
    expect(w.find('.g-datepicker__pop').element.hasAttribute('data-popover-open')).toBe(true)
    expect(w.find('.mio').attributes('aria-expanded')).toBe('true')
    w.find('.g-datepicker__pop').element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()
    expect(document.activeElement).toBe(w.find('.mio').element)
  })
})

describe('GDatePicker · avisos de desarrollo', () => {
  it('avisa una sola vez si faltan labels.prev/next, labels.dialog o labels.close', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mk({ label: 'F', labels: {} })
    const msgs = warn.mock.calls.map((c) => String(c[0]))
    expect(msgs.filter((m) => m.includes('labels.prev')).length).toBeLessThanOrEqual(1)
    expect(msgs.some((m) => m.includes('labels.prev'))).toBe(true)
    expect(msgs.some((m) => m.includes('labels.dialog'))).toBe(true)
    expect(msgs.some((m) => m.includes('labels.close'))).toBe(true)
  })

  it('en línea no exige dialog ni close', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    inline({ labels: { prev: 'a', next: 'b' } })
    expect(warn).not.toHaveBeenCalled()
  })

  it('el campo sin nombre accesible avisa; con aria-label no', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mk({})
    expect(warn.mock.calls.some((c) => String(c[0]).includes('nombre accesible'))).toBe(true)
    warn.mockClear()
    mk({}, { attrs: { 'aria-label': 'Fecha' } })
    expect(warn.mock.calls.some((c) => String(c[0]).includes('nombre accesible'))).toBe(false)
  })

  it('con inline se ignoran las props de campo y avisa', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    inline({ label: 'x' })
    expect(warn.mock.calls.some((c) => String(c[0]).includes('inline'))).toBe(true)
  })
})

describe('GDatePicker · validadores', () => {
  it('mode, variant, size, color, months y firstDay validan', () => {
    const p = GDatePicker.props
    expect(p.mode.validator('range')).toBe(true)
    expect(p.mode.validator('multi')).toBe(false)
    expect(p.variant.validator('ghost')).toBe(false)
    expect(p.color.validator('accent')).toBe(true)
    expect(p.size.validator('xl')).toBe(true)
    expect(p.months.validator('auto')).toBe(true)
    expect(p.months.validator(3)).toBe(false)
    expect(p.firstDay.validator(7)).toBe(false)
    expect(p.firstDay.validator(0)).toBe(true)
  })
})
