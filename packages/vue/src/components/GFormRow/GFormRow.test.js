import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, nextTick, ref } from 'vue'
import { SIZES, placement, planLines, sizeOf } from './formRowPlan.js'
import GFormRow from './GFormRow.vue'
import GFormLayout from '../GFormLayout/GFormLayout.vue'
import GFieldGroup from '../GFieldGroup/GFieldGroup.vue'
import GForm from '../GForm/GForm.vue'
import GInput from '../GInput/GInput.vue'
import GTextarea from '../GTextarea/GTextarea.vue'
import GSelect from '../GSelect/GSelect.vue'
import GDatePicker from '../GDatePicker/GDatePicker.vue'
import GCheckbox from '../GCheckbox/GCheckbox.vue'

// Medidas con `space` = 4 (form.md §4, tabla de tamaños): xs 2/80, sm 3/128, md 4/160, lg 8/240
const S = 4
const item = (size, own = 0) => ({ w: SIZES[size].weight, m: Math.max(SIZES[size].min, own) * S })
const G = 16

describe('Reparto en líneas (form.md §4, normativo) · casos de mesa', () => {
  it('tamaños: pesos 2/3/4/8 y mínimos space × 20/32/40/60; clase desconocida (g-form-w-full incluida) cuenta como md', () => {
    expect(Object.fromEntries(Object.entries(SIZES).map(([k, v]) => [k, [v.weight, v.min]]))).toEqual({ xs: [2, 20], sm: [3, 32], md: [4, 40], lg: [8, 60] })
    expect(sizeOf(['g-input', 'g-form-w-lg']).size).toBe('lg')
    expect(sizeOf(['g-input']).size).toBe('md')
    expect(sizeOf(['g-form-w-full'])).toEqual({ size: 'md', unknown: ['g-form-w-full'], all: ['g-form-w-full'] })
  })

  it('menos líneas: Nombre · Apellido juntos a 343px y apilados a 328px (kiwi: 375 y 360 con 16px de relleno)', () => {
    expect(planLines([item('md'), item('md')], 343, G)).toEqual([[0, 1]])
    expect(planLines([item('md'), item('md')], 328, G)).toEqual([[0], [1]])
  })

  it('signos vitales: 1 línea a 1232, 2 a 672 (Temperatura · Presión / FC · Sat. · Peso · Estatura), 3 a 328', () => {
    const vit = [item('sm'), item('sm', 38), item('xs'), item('xs'), item('xs'), item('xs')]
    expect(planLines(vit, 1232, G)).toHaveLength(1)
    expect(planLines(vit, 912, G)).toHaveLength(1)
    expect(planLines(vit, 672, G)).toEqual([[0, 1], [2, 3, 4, 5]])
    expect(planLines(vit, 328, G)).toHaveLength(3)
  })

  it('la más holgada entre las de menos líneas: Calle sola y Ext. · Int. juntos a 328px', () => {
    expect(planLines([item('lg'), item('xs'), item('xs')], 328, G)).toEqual([[0], [1, 2]])
    expect(planLines([item('lg'), item('xs'), item('xs')], 688, G)).toEqual([[0, 1, 2]])
  })

  it('empate exacto: más hijos en las primeras líneas', () => {
    // tres md que no caben juntos y sí de dos en dos: [a,b]/[c] y [a]/[b,c] tienen la misma holgura
    expect(planLines([item('md'), item('md'), item('md')], 400, G)).toEqual([[0, 1], [2]])
  })

  it('una línea de uno siempre es admisible aunque su mínimo supere el ancho (nunca desborda)', () => {
    expect(planLines([item('lg')], 200, G)).toEqual([[0]])
    expect(planLines([item('lg'), item('lg')], 200, G)).toEqual([[0], [1]])
  })

  it('keep: una sola línea siempre (ceden los mínimos); stack: un hijo por línea; sin ancho: uno por línea', () => {
    const three = [item('lg'), item('xs'), item('xs')]
    expect(planLines(three, 200, G, { keep: true })).toEqual([[0, 1, 2]])
    expect(planLines(three, 1200, G, { stack: true })).toEqual([[0], [1], [2]])
    expect(planLines(three, 1200, G, { keep: true, stack: true })).toEqual([[0, 1, 2]])
    expect(planLines(three, 0, G)).toEqual([[0], [1], [2]])
  })

  it('--g-form-min sube el mínimo efectivo (teléfono 50 = 200px): Correo · Teléfono · Ext. se parte antes', () => {
    const plain = [item('md'), item('md'), item('xs')]
    const phone = [item('md'), item('md', 50), item('xs')]
    expect(planLines(plain, 448, G)).toHaveLength(1)
    expect(planLines(phone, 448, G)).toEqual([[0], [1, 2]])
  })

  it('más de 6 hijos: sigue repartiendo (programación dinámica a partir de 13) sin desbordar', () => {
    const many = Array.from({ length: 14 }, () => item('xs'))
    const lines = planLines(many, 700, G)
    expect(lines.flat()).toEqual(many.map((_, i) => i))
    for (const l of lines) expect(l.length * 80 + (l.length - 1) * G).toBeLessThanOrEqual(700.5)
  })

  it('colocación: columnas = bordes de todas las líneas con separaciones como pistas; última minmax(0, 1fr); filas auto ×3 + separación', () => {
    const items = [item('lg'), item('xs'), item('xs')]
    const p = placement(items, [[0], [1, 2]], 328, G)
    expect(p.lines).toBe(2)
    expect(p.columns).toBe('156px 16px minmax(0, 1fr)')
    expect(p.rows).toBe('auto auto auto var(--_form-row-line-gap) auto auto auto')
    expect(p.kids).toEqual([
      { index: 0, line: 0, column: '1 / 4', row: '1 / span 3' },
      { index: 1, line: 1, column: '1 / 2', row: '5 / span 3' },
      { index: 2, line: 1, column: '3 / 4', row: '5 / span 3' }
    ])
    // una línea que llena el ancho: cada hijo recibe su parte por peso
    const one = placement([item('md'), item('md')], [[0, 1]], 400, G)
    expect(one.columns).toBe('192px 16px minmax(0, 1fr)')
  })
})

// ---------------------------------------------------------------------------------------------------------------
class FakeRO {
  static all = []
  constructor(cb) { this.cb = cb; this.els = []; FakeRO.all.push(this) }
  observe(el) { this.els.push(el) }
  unobserve(el) { this.els = this.els.filter((e) => e !== el) }
  disconnect() { this.els = [] }
  fire(el, width) { this.cb([{ target: el, contentBoxSize: [{ inlineSize: width, blockSize: 40 }], contentRect: { width, height: 40 } }]) }
}
const roOf = (el) => FakeRO.all.find((o) => o.els.includes(el))
const frame = () => new Promise((r) => setTimeout(r, 40))
const components = { GFormRow, GFormLayout, GFieldGroup, GForm, GInput, GTextarea, GSelect, GDatePicker, GCheckbox }
const mounted = []
function make(template, setup = () => ({})) {
  const w = mount(defineComponent({ components, setup, template }), { attachTo: document.body })
  mounted.push(w)
  return w
}
afterEach(() => {
  while (mounted.length) mounted.pop().unmount()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('GFormRow · componente', () => {
  beforeEach(() => { FakeRO.all = []; vi.stubGlobal('ResizeObserver', FakeRO) })

  it('antes de medir no escribe nada (uno por línea por CSS); tras medir, en el cuadro siguiente, variables y data-*', async () => {
    const w = make('<GFormRow id="r"><GInput class="g-form-w-lg" label="Calle" /><GInput class="g-form-w-xs" label="Ext." /><GInput class="g-form-w-xs" label="Int." /></GFormRow>')
    const row = w.find('#r')
    expect(row.classes()).toEqual(['g-form-row', 'g-form-row--density-default'])
    expect(row.attributes('data-lines')).toBeUndefined()
    expect(row.attributes('style')).toBeUndefined()
    const kids = row.element.children
    expect(kids[0].hasAttribute('data-line')).toBe(false)
    roOf(row.element).fire(row.element, 328)
    // fuera de la devolución: aún no
    expect(row.attributes('data-lines')).toBeUndefined()
    await frame()
    expect(row.attributes('data-lines')).toBe('2')
    // jsdom no carga GFormRow.css: --_form-row-gap no se resuelve y vale 0
    expect(row.element.style.getPropertyValue('--_form-row-columns')).toBe('164px minmax(0, 1fr)')
    expect(row.element.style.getPropertyValue('--_form-row-rows')).toBe('auto auto auto var(--_form-row-line-gap) auto auto auto')
    expect([...kids].map((k) => k.dataset.line)).toEqual(['0', '1', '1'])
    expect(kids[1].style.getPropertyValue('--_form-row-line')).toBe('5 / span 3')
    expect([...kids].map((k) => k.style.getPropertyValue('--_form-row-column'))).toEqual(['1 / 3', '1 / 2', '2 / 3'])
  })

  it('escribe solo si cambia: un segundo cálculo con el mismo ancho no toca el DOM', async () => {
    const w = make('<GFormRow id="r"><GInput label="A" /><GInput label="B" /></GFormRow>')
    const row = w.find('#r').element
    roOf(row).fire(row, 600)
    await frame()
    const kid = row.children[0]
    const spy = vi.spyOn(kid.style, 'setProperty')
    const setAttr = vi.spyOn(kid, 'setAttribute')
    roOf(row).fire(row, 600)
    await frame()
    expect(spy).not.toHaveBeenCalled()
    expect(setAttr).not.toHaveBeenCalled()
    expect(row.dataset.lines).toBe('1')
  })

  it('un solo ResizeObserver para todas las filas; al desmontar deja de observar', async () => {
    const w = make('<div><GFormRow id="a"><GInput label="A" /></GFormRow><GFormRow id="b"><GInput label="B" /></GFormRow></div>')
    expect(FakeRO.all).toHaveLength(1)
    expect(FakeRO.all[0].els).toHaveLength(2)
    w.unmount()
    mounted.pop()
    expect(FakeRO.all[0].els).toHaveLength(0)
  })

  it('recalcula al cambiar los hijos (v-if) con el último ancho medido', async () => {
    const show = ref(false)
    const w = make('<GFormRow id="r"><GInput label="A" /><GInput v-if="show" label="B" /></GFormRow>', () => ({ show }))
    const row = w.find('#r').element
    roOf(row).fire(row, 600)
    await frame()
    expect(row.dataset.lines).toBe('1')
    expect(row.children).toHaveLength(1)
    show.value = true
    await nextTick()
    await frame()
    expect(row.children[1].dataset.line).toBe('0')
    expect(row.children[1].style.getPropertyValue('--_form-row-column')).toBe('2 / 3')
  })

  it('keep: g-form-row--keep y una sola línea aunque no quepan los mínimos; stack del layout: uno por línea salvo keep', async () => {
    const w = make('<GFormLayout stack><GFormRow id="s"><GInput label="A" /><GInput label="B" /></GFormRow><GFormRow id="k" keep><GInput label="C" /><GInput label="D" /></GFormRow></GFormLayout>')
    const s = w.find('#s').element
    const k = w.find('#k').element
    expect(w.find('.g-form-layout').classes()).toContain('g-form-layout--stack')
    expect(k.classList.contains('g-form-row--keep')).toBe(true)
    FakeRO.all[0].fire(s, 1200)
    FakeRO.all[0].fire(k, 100)
    await frame()
    expect(s.dataset.lines).toBe('2')
    expect(k.dataset.lines).toBe('1')
  })

  it('--g-form-min del hijo cuenta (leído del estilo calculado en cada cálculo)', async () => {
    const w = make('<GFormRow id="r"><GInput label="Correo" /><GInput label="Teléfono" style="--g-form-min: 50" /><GInput class="g-form-w-xs" label="Ext." /></GFormRow>')
    const row = w.find('#r').element
    const cs = getComputedStyle(row.children[1]).getPropertyValue('--g-form-min')
    roOf(row).fire(row, 448)
    await frame()
    // jsdom no siempre resuelve propiedades personalizadas: si las resuelve, el teléfono parte la fila
    expect(row.dataset.lines).toBe(cs.trim() === '50' ? '2' : '1')
  })

  it('densidad: la propia, la del layout o la de GForm; los campos de la fila llenan su sitio (block)', () => {
    const w = make('<GForm density="compact"><GFormLayout><GFormRow id="a"><GInput label="A" /></GFormRow></GFormLayout><GFormLayout density="comfortable"><GFormRow id="b"><GInput label="B" /></GFormRow><GFormRow id="c" density="default"><GInput label="C" :block="false" /></GFormRow></GFormLayout></GForm>')
    expect(w.find('#a').classes()).toContain('g-form-row--density-compact')
    expect(w.find('#b').classes()).toContain('g-form-row--density-comfortable')
    expect(w.find('#c').classes()).toContain('g-form-row--density-default')
    const ins = w.findAll('.g-input')
    expect(ins[0].classes()).toEqual(expect.arrayContaining(['g-input--block', 'g-input--density-compact']))
    expect(ins[2].classes()).not.toContain('g-input--block')
    expect(w.findAll('.g-form-layout')[1].classes()).toContain('g-form-layout--density-comfortable')
  })

  it('sin ResizeObserver: uno por línea, sin data-lines ni errores', async () => {
    vi.stubGlobal('ResizeObserver', undefined)
    const w = make('<GFormRow id="r"><GInput label="A" /><GInput label="B" /></GFormRow>')
    await frame()
    expect(w.find('#r').attributes('data-lines')).toBeUndefined()
  })

  it('avisos: más de 6 hijos, order, dos tamaños, tamaño desconocido, hijo no admitido, compacto solo, --g-form-min inválido', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    make(`<div>
      <GFormRow><i /><i /><i /><i /><i /><i /><i /></GFormRow>
      <GFormRow><GInput label="A" style="order: 2" /><GInput class="g-form-w-md g-form-w-lg" label="B" /><GInput class="g-form-w-full" label="C" /></GFormRow>
      <GFormRow><GInput label="A" /><GCheckbox label="B" /></GFormRow>
      <GFormRow><GInput class="g-form-w-sm" label="Solo" /></GFormRow>
      <GFormRow><GInput label="A" style="--g-form-min: abc" /><GInput label="B" /></GFormRow>
    </div>`)
    const msgs = warn.mock.calls.map((c) => c[0]).filter((m) => m.startsWith('[Grana GFormRow]')).join('\n')
    expect(msgs).toMatch(/7 hijos/)
    expect(msgs).toMatch(/order/)
    expect(msgs).toMatch(/dos clases de tamaño/)
    expect(msgs).toMatch(/g-form-w-full se retiró/)
    expect(msgs).toMatch(/g-checkbox.*propia fila/)
    expect(msgs).toMatch(/compacto solo/)
    expect(msgs).toMatch(/--g-form-min debe ser un número positivo/)
  })
})

describe('GFormLayout', () => {
  it('pila de filas: g-form-layout y densidad; no mide (sin ResizeObserver propio)', () => {
    FakeRO.all = []
    vi.stubGlobal('ResizeObserver', FakeRO)
    const w = make('<GFormLayout><GInput label="A" /><GTextarea label="B" /></GFormLayout>')
    expect(w.find('.g-form-layout').classes()).toEqual(['g-form-layout', 'g-form-layout--density-default'])
    expect(FakeRO.all.some((o) => o.els.includes(w.find('.g-form-layout').element))).toBe(false)
  })

  it('avisos: compacto suelto, g-form-w-* fuera de fila, order y restos de la Fase 1', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    make(`<GFormLayout>
      <GInput class="g-form-w-xs" label="Temp" />
      <GInput class="g-form-w-lg" label="Calle" />
      <GInput label="X" style="order: 1" />
      <GInput class="g-form-break" label="Y" />
      <GInput class="g-form-w-full" label="Z" />
      <div class="g-form-row"><GInput class="g-form-part-sm" label="W" /></div>
      <GFormRow><GInput label="ok" /><GInput label="ok2" /></GFormRow>
    </GFormLayout>`)
    const msgs = warn.mock.calls.map((c) => c[0]).filter((m) => m.startsWith('[Grana GFormLayout]'))
    const all = msgs.join('\n')
    expect(all).toMatch(/compacto .* agrúpalo/)
    expect(all).toMatch(/solo tiene efecto dentro de una GFormRow/)
    expect(all).toMatch(/order/)
    expect(all).toMatch(/g-form-break se retiró/)
    expect(all).toMatch(/g-form-w-full se retiró/)
    expect(all).toMatch(/g-form-part-\* se retiró/)
    expect(msgs.filter((m) => /no es un GFormRow/.test(m))).toHaveLength(1)
  })

  it('sin restos ni compactos sueltos no avisa', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    make('<GFormLayout><GFormRow><GInput label="a" /><GInput class="g-form-w-xs" label="b" /></GFormRow><GTextarea label="c" /></GFormLayout>')
    expect(warn.mock.calls.filter((c) => /GFormLayout|GFormRow/.test(c[0]))).toHaveLength(0)
  })
})

describe('GFieldGroup en r02 (#179)', () => {
  beforeEach(() => { FakeRO.all = []; vi.stubGlobal('ResizeObserver', FakeRO) })

  it('las partes son una GFormRow compuesta (keep pasa a esa fila); ayuda y mensaje en __support', async () => {
    const w = make('<GFieldGroup id="f" label="Fecha" keep hint="Por ejemplo, 27 3 2026"><GInput class="g-form-w-xs" label="Día" /><GInput class="g-form-w-xs" label="Mes" /><GInput class="g-form-w-sm" label="Año" /></GFieldGroup>')
    const parts = w.find('.g-field-group__parts')
    expect(parts.classes()).toEqual(expect.arrayContaining(['g-form-row', 'g-form-row--keep', 'g-field-group__parts']))
    expect(parts.findAll('.g-input')).toHaveLength(3)
    const support = w.find('fieldset > .g-field-group__support')
    expect(support.find('.g-field-group__hint').text()).toBe('Por ejemplo, 27 3 2026')
    expect(support.find('.g-field-group__message').exists()).toBe(true)
    expect([...w.find('fieldset').element.children].map((c) => c.className.split(' ').find((x) => x.startsWith('g-field-group__')))).toEqual(['g-field-group__label', 'g-field-group__parts', 'g-field-group__support'])
    roOf(parts.element).fire(parts.element, 100)
    await frame()
    expect(parts.attributes('data-lines')).toBe('1')
  })

  it('avisa si comparte una GFormRow con otros campos', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    make('<GFormRow><GInput label="a" /><GFieldGroup label="g"><GInput label="b" /></GFieldGroup></GFormRow>')
    await frame()
    const msgs = warn.mock.calls.map((c) => c[0]).join('\n')
    expect(msgs).toMatch(/\[Grana GFieldGroup\] va en su propia fila/)
    expect(msgs).toMatch(/\[Grana GFormRow\].*g-field-group.*propia fila/)
  })
})

describe('Estructura C12: tres hijos en flujo (etiqueta, caja, __support) con __message dentro del pie', () => {
  const CASES = [
    ['GInput', '<GInput label="L" hint="H" />', 'g-input', ['g-input__label', 'g-input__row', 'g-input__support']],
    ['GTextarea', '<GTextarea label="L" hint="H" />', 'g-textarea', ['g-textarea__label', 'g-textarea__control', 'g-textarea__support']],
    ['GSelect', '<GSelect label="L" hint="H" name="s" :options="[{ value: 1, label: \'a\' }]" />', 'g-select', ['g-select__label', 'g-select__control', 'g-select__support']],
    ['GDatePicker', '<GDatePicker label="L" hint="H" name="d" />', 'g-datepicker', ['g-datepicker__label', 'g-datepicker__field', 'g-datepicker__support']]
  ]
  // fuera de flujo: <input type="hidden">, la lista (popover) de GSelect y el panel (popover) de GDatePicker
  const inFlow = (el) => !(el.localName === 'input' && el.type === 'hidden') && !el.hasAttribute('popover')
  for (const [name, tpl, cls, expected] of CASES) {
    it(name, () => {
      const w = make(tpl)
      const root = w.find(`.${cls}`).element
      const kids = [...root.children].filter(inFlow).map((k) => k.classList[0])
      expect(kids).toEqual(expected)
      const support = root.querySelector(`.${cls}__support`)
      expect(support.querySelector(`.${cls}__message`)).not.toBeNull()
      expect(support.querySelector(`.${cls}__message`).childNodes.length === 0 || [...support.querySelector(`.${cls}__message`).childNodes].every((n) => n.nodeType === 8)).toBe(true)
    })
  }
  it('GTextarea: __count-live dentro del pie', () => {
    const w = make('<GTextarea label="L" />')
    expect(w.find('.g-textarea__support .g-textarea__count-live').exists()).toBe(true)
  })
})
