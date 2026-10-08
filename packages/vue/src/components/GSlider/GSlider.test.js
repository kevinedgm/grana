// GSlider · design/contracts/slider.md «Verificación · bruno (vitest + jsdom)» (DECISIONS.md #445 a #457; forma B, #452)
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, provide, ref } from 'vue'
import GSlider from './GSlider.vue'
import GForm from '../GForm/GForm.vue'
import GErrorSummary from '../GErrorSummary/GErrorSummary.vue'
import { layoutKey } from '../GForm/formContext.js'
import { ATTR, modality, nav } from '../../utils/keyFocus.js'

const LABELS = { optional: '(opcional)', error: 'Error:', warning: 'Advertencia:', valid: 'Correcto:' }
const EMPTY = { empty: 'Sin elegir' }
const RANGE = { start: 'mínimo', end: 'máximo' }
const mounted = []
let warn
beforeEach(() => { warn = vi.spyOn(console, 'warn').mockImplementation(() => {}) })
afterEach(() => {
  while (mounted.length) mounted.pop().unmount()
  vi.useRealTimers()
  vi.restoreAllMocks()
  modality.keyboard = false
  nav.at = -Infinity
  document.body.innerHTML = ''
})
function mk(props = {}, opts = {}) {
  const w = mount(GSlider, { props: { label: 'Volumen', locale: 'es', labels: EMPTY, ...props }, attachTo: document.body, ...opts })
  mounted.push(w)
  return w
}
function host(template, setup = () => ({}), components = {}) {
  const w = mount(defineComponent({ components: { GSlider, GForm, GErrorSummary, ...components }, setup, template }), { attachTo: document.body })
  mounted.push(w)
  return w
}
const natives = (w) => w.findAll('input.g-slider__native')
const nat = (w, i = 0) => natives(w)[i]
const hiddens = (w) => w.findAll('input[type="hidden"]')
const models = (w) => (w.emitted('update:modelValue') || []).map((e) => e[0])
const changes = (w) => (w.emitted('change') || []).map((e) => e[0])
const settle = () => new Promise((r) => setTimeout(r, 50))
const warnings = () => warn.mock.calls.map((c) => String(c[0])).filter((t) => t.startsWith('[Grana GSlider]'))
async function key(w, k, { i = 0, repeat = false, shift = false, ctrl = false, isComposing = false, up = true } = {}) {
  const el = nat(w, i).element
  const opts = { key: k, bubbles: true, cancelable: true, repeat, shiftKey: shift, ctrlKey: ctrl, isComposing }
  const e = new KeyboardEvent('keydown', opts)
  el.dispatchEvent(e)
  if (up) el.dispatchEvent(new KeyboardEvent('keyup', { key: k, bubbles: true }))
  await nextTick()
  return e
}
// Puntero sintético (jsdom no tiene PointerEvent): pointerType, pointerId y coordenadas
function ptr(el, type, { pointerType = 'mouse', x = 0, y = 0, button = 0 } = {}) {
  const e = new MouseEvent(type, { bubbles: true, cancelable: true, button, clientX: x, clientY: y })
  Object.defineProperty(e, 'pointerType', { value: pointerType })
  Object.defineProperty(e, 'pointerId', { value: 1 })
  el.dispatchEvent(e)
  return e
}
// Área de 400px que empieza en 0 y píldoras de 40px: el centro va de 20 a 380 (360px de recorrido)
function rects({ area = 400, pill = 40 } = {}) {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
    const w = this.classList?.contains('g-slider__area') ? area : this.classList?.contains('g-slider__pill') ? pill : this.classList?.contains('g-slider__mark-label') ? 50 : 0
    return { left: 0, right: w, width: w, top: 0, bottom: 36, height: 36, x: 0, y: 0 }
  })
}
const xOf = (f, { area = 400, pill = 40 } = {}) => pill / 2 + f * (area - pill)

describe('GSlider · modelo', () => {
  it('Number: cada paso emite un número (nunca una cadena); null sin elegir', async () => {
    const w = mk({ modelValue: 40 })
    await key(w, 'ArrowRight')
    expect(models(w)).toEqual([41])
    expect(typeof models(w)[0]).toBe('number')
    const e = mk({ modelValue: null })
    expect(e.classes()).toContain('is-empty')
    expect(hiddens(e)[0].element.value).toBe('')
  })

  it('undefined se lee como null sin aviso; NaN, ±Infinity o un arreglo sin range, como null con aviso', async () => {
    mk({ modelValue: undefined })
    expect(warnings().some((t) => /no es un número finito/.test(t))).toBe(false)
    const w = mk({ modelValue: NaN })
    expect(w.classes()).toContain('is-empty')
    expect(warnings().some((t) => /no es un número finito/.test(t))).toBe(true)
    const a = mk({ modelValue: [1, 2] })
    expect(a.classes()).toContain('is-empty')
  })

  it('range: cada emisión es un arreglo nuevo (nunca el de la aplicación)', async () => {
    const model = [800, 2400]
    const w = mk({ range: true, modelValue: model, max: 5000, step: 50, labels: RANGE, label: 'Precio' })
    await key(w, 'ArrowRight')
    const out = models(w)[0]
    expect(out).toEqual([850, 2400])
    expect(out).not.toBe(model)
    expect(model).toEqual([800, 2400])
  })

  it('range null: se dibuja como el recorrido entero, sin aviso ni emisión; el primer gesto emite ordenado', async () => {
    const w = mk({ range: true, modelValue: null, labels: RANGE })
    expect(natives(w).map((n) => n.element.value)).toEqual(['0', '100'])
    expect(models(w)).toEqual([])
    expect(warnings().some((t) => /range debe ser/.test(t))).toBe(false)
    await key(w, 'ArrowRight', { i: 1 })
    expect(w.emitted('update:modelValue')).toBeUndefined()
    await key(w, 'ArrowLeft', { i: 1 })
    expect(models(w)).toEqual([[0, 99]])
  })

  it('range mal formado y desordenado: se dibuja con aviso, sin emitir; el primer gesto emite ya ordenado', async () => {
    const bad = mk({ range: true, modelValue: [5], labels: RANGE })
    expect(natives(bad).map((n) => n.element.value)).toEqual(['0', '100'])
    expect(warnings().some((t) => /range debe ser/.test(t))).toBe(true)
    const w = mk({ range: true, modelValue: [2400, 800], max: 5000, step: 50, labels: RANGE })
    expect(natives(w).map((n) => n.element.value)).toEqual(['800', '2400'])
    expect(warnings().some((t) => /desordenado/.test(t))).toBe(true)
    expect(models(w)).toEqual([])
    await key(w, 'ArrowLeft')
    expect(models(w)).toEqual([[750, 2400]])
  })

  it('un cambio desde la aplicación no emite nada', async () => {
    const w = mk({ modelValue: 40 })
    await w.setProps({ modelValue: 70 })
    expect(nat(w).element.value).toBe('70')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(w.emitted('change')).toBeUndefined()
  })

  it('fuera de la rejilla se conserva y el primer paso cae en el punto siguiente (#157); fuera de límites, aviso y el extremo', async () => {
    const w = mk({ modelValue: 42, step: 5 })
    expect(hiddens(w)[0].element.value).toBe('42')
    await key(w, 'ArrowUp')
    expect(models(w)).toEqual([45])
    const o = mk({ modelValue: 150 })
    expect(warnings().some((t) => /fuera de \[0, 100\]/.test(t))).toBe(true)
    expect(o.find('.g-slider__thumb').attributes('style')).toContain('--_at: 1')
    expect(hiddens(o)[0].element.value).toBe('150')
    expect(nat(o).attributes('aria-valuetext')).toBe('150')
    await key(o, 'ArrowDown')
    expect(models(o)).toEqual([100])
  })

  it('min ≥ max: sin recorrido, ni teclado ni puntero cambian el valor', async () => {
    rects()
    const w = mk({ modelValue: 5, min: 10, max: 10 })
    expect(warnings().some((t) => /sin recorrido/.test(t))).toBe(true)
    await key(w, 'ArrowUp')
    await key(w, 'End')
    ptr(w.find('.g-slider__area').element, 'pointerdown', { x: 300 })
    ptr(w.find('.g-slider__area').element, 'pointerup', { x: 300 })
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })
})

describe('GSlider · change una vez por gesto (#448)', () => {
  it('teclas con autorrepetición: un change al keyup; sin cambio, ninguno', async () => {
    const w = mk({ modelValue: 40 })
    const el = nat(w).element
    for (let k = 0; k < 4; k++) el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true, repeat: k > 0 }))
    await nextTick()
    expect(models(w)).toEqual([41, 42, 43, 44])
    expect(changes(w)).toEqual([])
    el.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight', bubbles: true }))
    expect(changes(w)).toEqual([44])
    await key(w, 'Home')
    await key(w, 'Home')
    expect(changes(w)).toEqual([44, 0])
  })

  it('nueve pulsaciones con cambio = nueve change (secuencia de kiwi)', async () => {
    const w = mk({ modelValue: 40, step: 5 })
    for (const [k, shift] of [['ArrowRight'], ['ArrowUp'], ['ArrowLeft'], ['ArrowRight', true], ['PageUp'], ['PageDown'], ['ArrowDown'], ['Home'], ['End'], ['ArrowRight']]) await key(w, k, { shift })
    expect(models(w)).toEqual([45, 50, 45, 55, 65, 55, 50, 0, 100])
    expect(changes(w)).toHaveLength(9)
  })

  it('perder el foco con un gesto abierto emite el change', async () => {
    const w = mk({ modelValue: 40 })
    nat(w).element.focus()
    await key(w, 'ArrowUp', { up: false })
    expect(changes(w)).toEqual([])
    nat(w).element.blur()
    expect(changes(w)).toEqual([41])
  })

  it('el @change del consumidor recibe el valor y no llega al nativo; input y change del nativo no burbujean', async () => {
    const onChange = vi.fn()
    const outer = vi.fn()
    const w = host('<div @input="outer" @change="outer"><GSlider label="V" :model-value="40" locale="es" @change="onChange" /></div>', () => ({ onChange, outer }))
    const el = w.find('input.g-slider__native').element
    el.dispatchEvent(new Event('change', { bubbles: true }))
    expect(onChange).not.toHaveBeenCalled()
    el.value = '60'
    el.dispatchEvent(new Event('input', { bubbles: true }))
    expect(outer).not.toHaveBeenCalled()
    expect(onChange).toHaveBeenCalledWith(41)
  })

  it('ajuste del lector (input del nativo): UN paso en esa dirección y un change; el nativo vuelve al valor', async () => {
    const w = mk({ modelValue: 40, step: 5 })
    const el = nat(w).element
    el.value = '90'
    el.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    expect(models(w)).toEqual([45])
    expect(changes(w)).toEqual([45])
    expect(el.value).toBe('45')
    el.value = '10'
    el.dispatchEvent(new Event('input', { bubbles: true }))
    expect(models(w).at(-1)).toBe(40)
    const e = mk({ modelValue: null })
    nat(e).element.value = '73'
    nat(e).element.dispatchEvent(new Event('input', { bubbles: true }))
    expect(models(e)).toEqual([73])
  })

  it('readonly: ni el teclado ni el ajuste del lector cambian el valor', async () => {
    const w = mk({ modelValue: 40, readonly: true })
    await key(w, 'ArrowUp')
    nat(w).element.value = '60'
    nat(w).element.dispatchEvent(new Event('input', { bubbles: true }))
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(nat(w).element.value).toBe('40')
  })
})

describe('GSlider · estructura accesible', () => {
  it('valor único: <label for>, nativo range step="any" sin name ni aria-required, aria-valuetext y descripción', async () => {
    const w = mk({ modelValue: 40, id: 'vol', hint: 'Ayuda', required: true, format: { style: 'unit', unit: 'percent' } })
    const n = nat(w)
    expect(w.find('label.g-slider__label').attributes('for')).toBe('vol')
    expect(n.attributes()).toMatchObject({ id: 'vol', type: 'range', step: 'any', min: '0', max: '100' })
    expect(n.element.value).toBe('40')
    expect(n.attributes('name')).toBeUndefined()
    expect(n.attributes('aria-required')).toBeUndefined()
    expect(n.attributes('required')).toBeUndefined()
    expect(n.attributes('aria-valuetext')).toMatch(/^40\s?%$/)
    expect(n.attributes('aria-describedby')).toBe('vol-hint vol-message')
    expect(w.find('.g-slider__pill').attributes('aria-hidden')).toBe('true')
    expect(w.find('.g-slider__pill-text').attributes('dir')).toBe('auto')
    expect(w.find('.g-slider__row').attributes('role')).toBeUndefined()
    expect(w.find('.g-slider__required').text()).toBe('*')
  })

  it('rango: grupo con aria-labelledby, asas con «Precio mínimo/máximo», límites dinámicos y ids', async () => {
    const w = mk({ range: true, modelValue: [800, 2400], max: 5000, step: 50, minGap: 200, label: 'Precio', id: 'p', labels: RANGE })
    const row = w.find('.g-slider__row')
    expect(row.attributes()).toMatchObject({ role: 'group', 'aria-labelledby': 'p-label' })
    expect(w.find('.g-slider__label').element.tagName).toBe('SPAN')
    const [a, b] = natives(w)
    expect(a.attributes()).toMatchObject({ id: 'p', min: '0', max: '2200', 'aria-labelledby': 'p-label p-n0' })
    expect(b.attributes()).toMatchObject({ id: 'p-end', min: '1000', max: '5000', 'aria-labelledby': 'p-label p-n1' })
    expect(w.find('#p-n0').text()).toBe('mínimo')
    expect(w.find('#p-n0').attributes('hidden')).toBeDefined()
    expect(w.find('#p-n1').text()).toBe('máximo')
    await w.find('.g-slider__label').trigger('click')
    expect(document.activeElement).toBe(a.element)
  })

  it('sin etiqueta visible: aria-label en el grupo y «{aria-label} {nombre}» en cada asa; aria-labelledby compuesto', async () => {
    const w = mk({ range: true, label: undefined, labels: RANGE }, { attrs: { 'aria-label': 'Precio' } })
    expect(w.find('.g-slider__row').attributes('aria-label')).toBe('Precio')
    expect(natives(w).map((n) => n.attributes('aria-label'))).toEqual(['Precio mínimo', 'Precio máximo'])
    const l = mk({ range: true, label: undefined, id: 'r', labels: RANGE }, { attrs: { 'aria-labelledby': 'ext' } })
    expect(l.find('.g-slider__row').attributes('aria-labelledby')).toBe('ext')
    expect(natives(l).map((n) => n.attributes('aria-labelledby'))).toEqual(['ext r-n0', 'ext r-n1'])
    const s = mk({ label: undefined, modelValue: 3 }, { attrs: { 'aria-label': 'Volumen' } })
    expect(nat(s).attributes('aria-label')).toBe('Volumen')
    expect(s.find('.g-slider__head').element.children).toHaveLength(0)
  })

  it('aria-invalid, aria-readonly y disabled en cada nativo; aria-describedby del consumidor en medio', async () => {
    const w = mk({ range: true, modelValue: [1, 2], error: 'Mal', readonly: true, id: 'x', labels: RANGE }, { attrs: { 'aria-describedby': 'mio' } })
    for (const n of natives(w)) {
      expect(n.attributes('aria-invalid')).toBe('true')
      expect(n.attributes('aria-readonly')).toBe('true')
      expect(n.attributes('aria-describedby')).toBe('mio x-message')
    }
    expect(w.classes()).toEqual(expect.arrayContaining(['is-invalid', 'is-readonly']))
    const d = mk({ modelValue: 1, disabled: true })
    expect(nat(d).attributes('disabled')).toBeDefined()
    expect(d.classes()).toContain('is-disabled')
  })

  it('marca con nombre: «5, Moderado» en aria-valuetext; valueText sustituye píldora y lectura', async () => {
    const marks = [{ value: 0, label: 'Sin dolor' }, { value: 5, label: 'Moderado' }, { value: 10, label: 'El peor' }]
    const w = mk({ modelValue: 5, max: 10, marks })
    expect(nat(w).attributes('aria-valuetext')).toBe('5, Moderado')
    expect(w.find('.g-slider__pill-text').text()).toBe('5')
    const m = w.findAll('.g-slider__mark')
    expect(m).toHaveLength(3)
    expect(w.find('.g-slider__marks').attributes('aria-hidden')).toBe('true')
    expect(m[1].classes()).toContain('has-label')
    expect(m[1].attributes('data-value')).toBe('5')
    expect(m[1].find('.g-slider__mark-label').text()).toBe('Moderado')
    const t = mk({ modelValue: 200, max: 600, valueText: (v) => `${Math.floor(v / 60)} h ${v % 60} min` })
    expect(nat(t).attributes('aria-valuetext')).toBe('3 h 20 min')
    expect(t.find('.g-slider__pill-text').text()).toBe('3 h 20 min')
  })

  it('B1: textos de referencia apilados (primero, último, medio, marcas y el actual)', async () => {
    const w = mk({ modelValue: 37, min: -20, max: 40, step: 1 })
    const refs = w.findAll('.g-slider__pill-ref > span').map((s) => s.text())
    expect(refs).toEqual(expect.arrayContaining(['-20', '40', '10', '-40', '37']))
  })

  it('ocultos: uno por asa con el mismo name, canónico, disabled con el campo, presentes en readonly, form copiado; FormData', async () => {
    const w = host(`<form id="f"><GSlider name="volumen" label="V" :model-value="40" locale="es" />
      <GSlider range name="precio" label="P" :model-value="[800, 2400]" :max="5000" :step="50" :labels="r" locale="es" />
      <GSlider name="no" label="N" :model-value="3" disabled locale="es" />
      <GSlider name="ro" label="R" :model-value="7" readonly locale="es" />
      <GSlider name="vacio" label="E" :model-value="null" :labels="e" locale="es" /></form>
      <GSlider name="fuera" label="F" :model-value="1" locale="es" form="f" />`, () => ({ r: RANGE, e: EMPTY }))
    const fd = new FormData(w.find('form').element)
    expect([...fd.entries()]).toEqual([['volumen', '40'], ['precio', '800'], ['precio', '2400'], ['ro', '7'], ['vacio', ''], ['fuera', '1']])
    const outside = w.findAll('input[type="hidden"]').at(-1)
    expect(outside.attributes('form')).toBe('f')
    expect(w.findAll('input.g-slider__native').every((n) => n.attributes('name') === undefined)).toBe(true)
  })
})

describe('GSlider · teclado (#449)', () => {
  it('RTL: ← sube y → baja; ↑/↓ igual', async () => {
    const w = host('<div dir="rtl" style="direction: rtl"><GSlider label="V" :model-value="40" locale="ar-EG" @update:model-value="out.push($event)" /></div>', () => ({ out: [] }))
    // jsdom no calcula direction desde dir: se fuerza el estilo calculado
    const real = window.getComputedStyle
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el, p) => (el.classList?.contains('g-slider') ? { direction: 'rtl', getPropertyValue: () => '' } : real(el, p)))
    const el = w.find('input.g-slider__native').element
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }))
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }))
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }))
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }))
    expect(w.vm.out).toEqual([41, 42, 41, 42])
  })

  it('rango: el inicio se detiene en el fin − minGap (no se cruzan)', async () => {
    const w = mk({ range: true, modelValue: [40, 50], step: 10, minGap: 10, labels: RANGE })
    await key(w, 'ArrowRight')
    await key(w, 'End')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('snap="marks": flechas de marca en marca y paso grande de dos marcas', async () => {
    const marks = [10, 25, 50, 100]
    const w = mk({ modelValue: 10, min: 10, max: 100, marks, snap: 'marks' })
    await key(w, 'ArrowUp')
    await key(w, 'PageUp')
    expect(models(w)).toEqual([25, 100])
  })

  it('desde «sin elegir»: una tecla que sube da el primer punto; una que baja, el último; Inicio y Fin, los extremos', async () => {
    const up = mk({ modelValue: null, min: 0, max: 10 })
    await key(up, 'ArrowUp')
    expect(models(up)).toEqual([0])
    const down = mk({ modelValue: null, min: 0, max: 10 })
    await key(down, 'PageDown')
    expect(models(down)).toEqual([10])
    const end = mk({ modelValue: null, min: 0, max: 10 })
    await key(end, 'End')
    expect(models(end)).toEqual([10])
  })

  it('Alt/Ctrl/Meta, composición y otras teclas no se interceptan', async () => {
    const w = mk({ modelValue: 40 })
    const e1 = await key(w, 'ArrowUp', { ctrl: true })
    const e2 = await key(w, 'ArrowUp', { isComposing: true })
    const e3 = await key(w, 'Tab')
    expect([e1, e2, e3].map((e) => e.defaultPrevented)).toEqual([false, false, false])
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })
})

describe('GSlider · teclear la cifra (B4)', () => {
  it('«3 5» e Intro → 35, un change; la píldora se vuelve campo y aria-valuetext no cambia hasta confirmar', async () => {
    const w = mk({ modelValue: 40 })
    await key(w, '3')
    await key(w, '5')
    expect(w.find('.g-slider__thumb').classes()).toContain('is-typing')
    expect(w.find('.g-slider__pill-text').text()).toBe('35')
    expect(nat(w).attributes('aria-valuetext')).toBe('40')
    expect(models(w)).toEqual([])
    await key(w, 'Enter')
    expect(models(w)).toEqual([35])
    expect(changes(w)).toEqual([35])
    expect(w.find('.g-slider__thumb').classes()).not.toContain('is-typing')
  })

  it('pausa de 900 ms confirma; Esc anula; Retroceso borra el último', async () => {
    vi.useFakeTimers()
    const w = mk({ modelValue: 40 })
    await key(w, '7')
    vi.advanceTimersByTime(899)
    expect(models(w)).toEqual([])
    vi.advanceTimersByTime(1)
    expect(models(w)).toEqual([7])
    await key(w, '9')
    await key(w, 'Escape')
    vi.advanceTimersByTime(2000)
    expect(models(w)).toEqual([7])
    await key(w, '1')
    await key(w, '2')
    await key(w, 'Backspace')
    expect(w.find('.g-slider__pill-text').text()).toBe('1')
    await key(w, 'Enter')
    expect(models(w)).toEqual([7, 1])
  })

  it('otra tecla confirma y luego actúa (una flecha confirma y da su paso)', async () => {
    const w = mk({ modelValue: 40 })
    await key(w, '2')
    await key(w, '0')
    await key(w, 'ArrowUp')
    expect(models(w)).toEqual([20, 21])
  })

  it('fuera de los límites: va al límite con el tope; al rejilla más cercana dentro', async () => {
    const w = mk({ modelValue: 40, max: 50, step: 5 })
    await key(w, '4')
    await key(w, '3')
    await key(w, 'Enter')
    expect(models(w)).toEqual([45])
    await key(w, '9')
    await key(w, '9')
    await key(w, 'Enter')
    expect(models(w)).toEqual([45, 50])
  })

  it('cifras del idioma, separador solo con decimales, «-» solo primero y con min < 0', async () => {
    const ar = mk({ modelValue: 0, locale: 'ar-EG' })
    await key(ar, '٣')
    await key(ar, '٥')
    await key(ar, 'Enter')
    expect(models(ar)).toEqual([35])
    const dec = mk({ modelValue: 0, max: 10, step: 0.5 })
    await key(dec, '2')
    await key(dec, ',')
    await key(dec, '5')
    await key(dec, 'Enter')
    expect(models(dec)).toEqual([2.5])
    const intg = mk({ modelValue: 0, max: 10 })
    await key(intg, '2')
    const sep = await key(intg, '.')
    expect(sep.defaultPrevented).toBe(true)
    expect(intg.find('.g-slider__pill-text').text()).toBe('2')
    const neg = mk({ modelValue: 0, min: -20, max: 20 })
    await key(neg, '-')
    await key(neg, '5')
    await key(neg, 'Enter')
    expect(models(neg)).toEqual([-5])
    const pos = mk({ modelValue: 3 })
    const minus = await key(pos, '-')
    expect(minus.defaultPrevented).toBe(false)
  })

  it('con modificadores, en composición o en readonly no se teclea', async () => {
    const w = mk({ modelValue: 40, readonly: true })
    await key(w, '5')
    expect(w.find('.g-slider__thumb').classes()).not.toContain('is-typing')
    const c = mk({ modelValue: 40 })
    await key(c, '5', { ctrl: true })
    await key(c, '5', { isComposing: true })
    expect(c.find('.g-slider__thumb').classes()).not.toContain('is-typing')
  })

  it('salir confirma', async () => {
    const w = mk({ modelValue: 40 })
    nat(w).element.focus()
    await key(w, '6')
    nat(w).element.blur()
    expect(models(w)).toEqual([6])
    expect(changes(w)).toEqual([6])
  })
})

describe('GSlider · tope (B5)', () => {
  it('data-bump solo sin autorrepetición; en jsdom (sin animación calculada) se quita en el acto', async () => {
    const w = mk({ modelValue: 100 })
    const seen = []
    const obs = new MutationObserver(() => seen.push(w.element.getAttribute('data-bump')))
    obs.observe(w.element, { attributes: true, attributeFilter: ['data-bump'] })
    await key(w, 'ArrowUp', { repeat: true })
    await settle()
    expect(seen).toEqual([])
    await key(w, 'ArrowUp')
    await settle()
    obs.disconnect()
    expect(seen).toContain('up')
    expect(w.element.hasAttribute('data-bump')).toBe(false)
  })

  it('se retira con animationend g-slider-bump… (otra animación no) y no hay tope en readonly', async () => {
    const real = window.getComputedStyle
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el, p) => (el.classList?.contains('g-slider__thumb') ? { animationName: 'g-slider-bump-down', animationDuration: '120ms', direction: 'ltr', getPropertyValue: () => '' } : real(el, p)))
    const w = mk({ modelValue: 0 })
    await key(w, 'ArrowDown')
    await settle()
    expect(w.attributes('data-bump')).toBe('down')
    w.element.dispatchEvent(Object.assign(new Event('animationend', { bubbles: true }), { animationName: 'g-reject-shake-slider' }))
    await nextTick()
    expect(w.attributes('data-bump')).toBe('down')
    w.element.dispatchEvent(Object.assign(new Event('animationend', { bubbles: true }), { animationName: 'g-slider-bump-down' }))
    await nextTick()
    expect(w.attributes('data-bump')).toBeUndefined()
    const ro = mk({ modelValue: 0, readonly: true })
    await key(ro, 'ArrowDown')
    await settle()
    expect(ro.attributes('data-bump')).toBeUndefined()
  })
})

describe('GSlider · puntero (#449)', () => {
  it('ratón en el riel: el asa va al punto (is-jumping solo si hay transición; en jsdom se quita) y un change al soltar', async () => {
    rects()
    const w = mk({ modelValue: 40 })
    await settle()
    const area = w.find('.g-slider__area').element
    ptr(area, 'pointerdown', { x: xOf(0.8) })
    await nextTick()
    expect(models(w)).toEqual([80])
    expect(document.activeElement).toBe(nat(w).element)
    await settle()
    expect(w.classes()).not.toContain('is-jumping')
    ptr(area, 'pointermove', { x: xOf(0.9) })
    expect(models(w)).toEqual([80, 90])
    await nextTick()
    expect(w.classes()).toContain('is-dragging')
    ptr(area, 'pointerup', { x: xOf(0.9) })
    await nextTick()
    expect(changes(w)).toEqual([90])
    expect(w.classes()).not.toContain('is-dragging')
  })

  it('táctil en el riel: solo el toque salta; el gesto vertical no cambia nada', async () => {
    rects()
    const w = mk({ modelValue: 40 })
    await settle()
    const area = w.find('.g-slider__area').element
    ptr(area, 'pointerdown', { pointerType: 'touch', x: xOf(0.2), y: 10 })
    ptr(area, 'pointermove', { pointerType: 'touch', x: xOf(0.2) + 2, y: 40 })
    ptr(area, 'pointercancel', { pointerType: 'touch' })
    expect(w.emitted('update:modelValue')).toBeUndefined()
    ptr(area, 'pointerdown', { pointerType: 'touch', x: xOf(0.2), y: 10 })
    ptr(area, 'pointerup', { pointerType: 'touch', x: xOf(0.2), y: 12 })
    expect(models(w)).toEqual([20])
    expect(changes(w)).toEqual([20])
  })

  it('sobre la píldora: el arrastre empieza en el acto (sin salto)', async () => {
    rects()
    const w = mk({ modelValue: 40 })
    await settle()
    const pill = w.find('.g-slider__pill').element
    ptr(pill, 'pointerdown', { pointerType: 'touch', x: xOf(0.4) })
    expect(models(w)).toEqual([])
    await nextTick()
    expect(w.classes()).toContain('is-dragging')
    ptr(w.find('.g-slider__area').element, 'pointermove', { pointerType: 'touch', x: xOf(0.5) })
    expect(models(w)).toEqual([50])
  })

  it('el nombre de una marca da su valor exacto (aunque no esté en la rejilla)', async () => {
    rects()
    const w = mk({ modelValue: 0, max: 10, step: 2, marks: [{ value: 5, label: 'Moderado' }] })
    await settle()
    ptr(w.find('.g-slider__mark-label').element, 'pointerdown', { x: 3 })
    expect(models(w)).toEqual([5])
  })

  it('asas juntas: la dirección del primer movimiento decide (→ el fin, ← el inicio)', async () => {
    rects()
    const w = mk({ range: true, modelValue: [50, 50], labels: RANGE })
    await settle()
    const area = w.find('.g-slider__area').element
    const thumb = w.findAll('.g-slider__pill')[1].element
    ptr(thumb, 'pointerdown', { x: xOf(0.5) })
    ptr(area, 'pointermove', { x: xOf(0.5) + 1 })
    expect(models(w)).toEqual([])
    ptr(area, 'pointermove', { x: xOf(0.6) })
    expect(models(w)).toEqual([[50, 60]])
    expect(document.activeElement).toBe(nat(w, 1).element)
    ptr(area, 'pointerup', { x: xOf(0.6) })
    const v = mk({ range: true, modelValue: [50, 50], labels: RANGE })
    await settle()
    ptr(v.findAll('.g-slider__pill')[0].element, 'pointerdown', { x: xOf(0.5) })
    ptr(v.find('.g-slider__area').element, 'pointermove', { x: xOf(0.3) })
    expect(models(v)).toEqual([[30, 50]])
    expect(document.activeElement).toBe(nat(v, 0).element)
  })

  it('el tramo: en suspenso hasta 10px; un toque lleva el asa más cercana; el arrastre mueve las dos conservando la anchura', async () => {
    rects()
    const w = mk({ range: true, modelValue: [20, 60], labels: RANGE })
    await settle()
    const fill = w.find('.g-slider__fill').element
    const area = w.find('.g-slider__area').element
    ptr(fill, 'pointerdown', { x: xOf(0.3) })
    ptr(area, 'pointermove', { x: xOf(0.3) + 5 })
    expect(models(w)).toEqual([])
    ptr(area, 'pointerup', { x: xOf(0.3) + 5 })
    expect(models(w)).toEqual([[30, 60]])
    ptr(fill, 'pointerdown', { x: xOf(0.4) })
    ptr(area, 'pointermove', { x: xOf(0.4) + 36 })
    expect(models(w).at(-1)).toEqual([40, 70])
    ptr(area, 'pointermove', { x: 1000 })
    expect(models(w).at(-1)).toEqual([70, 100])
    ptr(area, 'pointerup', { x: 1000 })
    expect(changes(w)).toEqual([[30, 60], [70, 100]])
  })

  it('readonly: pulsar enfoca el asa y no cambia nada; deshabilitado: nada', async () => {
    rects()
    const r = mk({ modelValue: 40, readonly: true })
    await settle()
    ptr(r.find('.g-slider__area').element, 'pointerdown', { x: xOf(0.9) })
    expect(document.activeElement).toBe(nat(r).element)
    expect(r.emitted('update:modelValue')).toBeUndefined()
    const d = mk({ modelValue: 40, disabled: true })
    ptr(d.find('.g-slider__area').element, 'pointerdown', { x: xOf(0.9) })
    expect(d.emitted('update:modelValue')).toBeUndefined()
  })

  it('«sin elegir»: el primer clic pone el valor en ese punto, sin deslizarse', async () => {
    rects()
    const w = mk({ modelValue: null, max: 10 })
    await settle()
    ptr(w.find('.g-slider__thumb').element, 'pointerdown', { x: 200 })
    expect(models(w)).toEqual([5])
    expect(w.classes()).not.toContain('is-jumping')
  })
})

describe('GSlider · medida y fusión (B1, B2)', () => {
  it('--_pill-w medido con 0px puesto; is-merged y --_mid cuando los centros quedan a menos de una píldora', async () => {
    rects()
    const w = mk({ range: true, modelValue: [40, 45], labels: RANGE })
    await settle()
    expect(w.attributes('style')).toContain('--_pill-w: 40px')
    expect(w.classes()).toContain('is-merged')
    expect(w.attributes('style')).toContain('--_mid: 0.425')
    await w.setProps({ modelValue: [20, 60] })
    expect(w.classes()).not.toContain('is-merged')
    expect(w.attributes('style')).not.toContain('--_mid')
  })

  it('is-ready después de medir (dos cuadros), nunca antes', async () => {
    const w = mk({ modelValue: 4 })
    expect(w.classes()).not.toContain('is-ready')
    await settle()
    expect(w.classes()).toContain('is-ready')
  })

  it('publica el mínimo en una GFormRow: space × 40, 3 × píldora (4× rango) y marcas; retira con 0 al desmontar', async () => {
    rects({ pill: 60 })
    const calls = []
    const Row = defineComponent({ setup(_, { slots }) { provide(layoutKey, { block: true, setIntrinsicMin: (el, px) => calls.push([el, px]) }); return () => slots.default() } })
    const w = mount(defineComponent({ components: { Row, GSlider }, setup: () => ({ r: RANGE }), template: '<Row><GSlider label="P" range :labels="r" locale="es" /></Row>' }), { attachTo: document.body })
    await settle()
    expect(calls.at(-1)[1]).toBe(240)
    expect(calls.at(-1)[0]).toBe(w.find('.g-slider').element)
    w.unmount()
    expect(calls.at(-1)[1]).toBe(0)
    calls.length = 0
    rects({ pill: 20 })
    const m = mount(defineComponent({ components: { Row, GSlider }, template: `<Row><GSlider label="D" :model-value="5" :max="10" locale="es" :marks="[{ value: 0, label: 'a' }, { value: 5, label: 'b' }, { value: 10, label: 'c' }]" /></Row>` }), { attachTo: document.body })
    mounted.push(m)
    await settle()
    expect(calls.at(-1)[1]).toBe(Math.max(160, 3 * 50 + 2 * 8))
  })
})

describe('GSlider · GForm', () => {
  it('registro por name, trigger change: el error se revela al cambiar; notifyChange al acabar el gesto', async () => {
    const errors = ref({ dolor: 'Elige un valor' })
    const w = host('<GForm :errors="errors" :labels="labels"><GSlider id="d" name="dolor" label="Dolor" v-model="v" :max="10" :labels="e" locale="es" /></GForm>', () => ({ errors, labels: LABELS, v: ref(null), e: EMPTY }))
    expect(w.find('.g-slider__message').text()).toBe('')
    await key(w.findComponent(GSlider), 'ArrowUp')
    await nextTick()
    expect(w.find('.g-slider__message').text()).toContain('Elige un valor')
    expect(w.find('.g-slider__message .g-slider__sr').text()).toBe('Error:')
    expect(w.find('.g-slider__message-icon').exists()).toBe(true)
    expect(w.find('.g-slider').classes()).toContain('is-invalid')
    errors.value = {}
    await nextTick()
    expect(w.find('.g-slider__message').text()).toBe('')
  })

  it('enviar sin elegir con errors[name]: bloquea, el resumen enlaza al primer nativo y lo enfoca; is-rejected lo retira un gesto', async () => {
    const onInvalid = vi.fn()
    const v = ref(null)
    const errors = ref({ dolor: 'Elige la intensidad' })
    const w = host('<GForm :errors="errors" :labels="labels" @invalid="onInvalid"><GErrorSummary :labels="{ title: \'x\' }" /><GSlider id="d" name="dolor" label="Dolor" v-model="v" :max="10" :labels="e" locale="es" /></GForm>', () => ({ errors, labels: LABELS, v, e: EMPTY, onInvalid }))
    await w.find('form').trigger('submit')
    await settle()
    expect(onInvalid.mock.calls[0][0].errors).toEqual([{ name: 'dolor', message: 'Elige la intensidad', id: 'd' }])
    const link = w.find('.g-error-summary__link')
    expect(link.attributes('href')).toBe('#d')
    w.find('.g-slider').element.scrollIntoView = vi.fn()
    await link.trigger('click')
    await nextTick()
    expect(document.activeElement.id).toBe('d')
    expect(w.find('.g-slider').classes()).toContain('is-rejected')
    await key(w.findComponent(GSlider), 'ArrowUp')
    expect(v.value).toBe(0)
    expect(w.find('.g-slider').classes()).not.toContain('is-rejected')
  })

  it('hereda densidad, readonly y disabled del contexto; la prop gana', async () => {
    const w = host('<GForm density="compact" readonly><GSlider id="a" name="a" label="A" :model-value="1" locale="es" /><GSlider id="b" name="b" label="B" :model-value="1" density="default" :readonly="false" locale="es" /></GForm>')
    const [a, b] = w.findAll('.g-slider')
    expect(a.classes()).toEqual(expect.arrayContaining(['g-slider--density-compact', 'is-readonly']))
    expect(b.classes()).toContain('g-slider--density-default')
    expect(b.classes()).not.toContain('is-readonly')
  })
})

describe('GSlider · data-g-key-focus (#450)', () => {
  it('Tab e Intro marcan en el focus; pointerdown desmarca; una tecla con el foco dentro marca', async () => {
    rects()
    const w = mk({ modelValue: 40 })
    await settle()
    const el = nat(w).element
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    el.focus()
    expect(el.hasAttribute(ATTR)).toBe(true)
    ptr(w.find('.g-slider__area').element, 'pointerdown', { x: xOf(0.4) })
    expect(el.hasAttribute(ATTR)).toBe(false)
    ptr(w.find('.g-slider__area').element, 'pointerup', { x: xOf(0.4) })
    await key(w, 'ArrowRight')
    expect(el.hasAttribute(ATTR)).toBe(true)
    el.blur()
    expect(el.hasAttribute(ATTR)).toBe(false)
  })
})

describe('GSlider · avisos de desarrollo (1 a 14)', () => {
  it('un uso correcto no avisa (ni Grana ni Vue)', async () => {
    rects()
    const w = mk({ modelValue: 4, max: 10, marks: [{ value: 0, label: 'a' }, 10], hint: 'h', name: 'n' })
    mk({ range: true, modelValue: [1, 9], label: 'R', labels: RANGE, minGap: 1, bigStep: 2 })
    await settle()
    await key(w, 'ArrowUp')
    expect(warn.mock.calls.map((c) => String(c[0]))).toEqual([])
  })

  it('cada aviso una vez con [Grana GSlider]', async () => {
    mk({ label: undefined, modelValue: 1 })
    mk({ range: true, labels: {} })
    mk({ modelValue: null, labels: {} })
    mk({ modelValue: Infinity })
    mk({ modelValue: 500 })
    mk({ min: 5, max: 5 })
    mk({ step: -1 })
    mk({ bigStep: 7, step: 5 })
    mk({ range: true, minGap: -3, labels: RANGE })
    mk({ marks: [200, 5, 5] })
    mk({ snap: 'marks', marks: true })
    mk({ locale: 'no_es_un_idioma!!' })
    mk({ format: { style: 'currency' } })
    mk({ format: { style: 'percent' } })
    mk({ modelValue: 3, valueText: () => '' })
    mk({ modelValue: 3 }, { attrs: { appearance: 'steps', orientation: 'vertical' } })
    const t = warnings().join('\n')
    for (const re of [/sin nombre accesible/, /labels\.start o labels\.end/, /sin labels\.empty/, /no es un número finito/, /fuera de \[0, 100\]/, /sin recorrido/, /step -1/, /bigStep 7/, /minGap -3/, /fuera de \[min, max\]/, /repetidos/, /snap="marks" sin/, /locale «no_es/, /format lo rechaza/, /percent/, /valueText no devolvió/, /appearance, orientation: nombres reservados/]) {
      expect(t, String(re)).toMatch(re)
    }
    const w = mk({ modelValue: 3 }, { attrs: { appearance: 'steps', 'data-x': '1' } })
    expect(w.attributes('appearance')).toBeUndefined()
    expect(w.attributes('data-x')).toBe('1')
  })
})
