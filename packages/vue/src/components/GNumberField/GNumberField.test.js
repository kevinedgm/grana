// GNumberField · design/contracts/number-field.md «Verificación · bruno» (DECISIONS.md #309 a #314)
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, provide, ref } from 'vue'
import GNumberField from './GNumberField.vue'
import GForm from '../GForm/GForm.vue'
import GFormRow from '../GFormRow/GFormRow.vue'
import { layoutKey } from '../GForm/formContext.js'

const LABELS = { optional: '(opcional)', error: 'Error: ', warning: 'Advertencia: ', valid: 'Correcto: ' }
const mounted = []
function mk(props = {}, opts = {}) {
  const w = mount(GNumberField, { props: { label: 'Peso', locale: 'es', ...props }, attachTo: document.body, ...opts })
  mounted.push(w)
  return w
}
function host(template, setup = () => ({}), components = {}) {
  const w = mount(defineComponent({ components: { GNumberField, GForm, GFormRow, ...components }, setup, template }), { attachTo: document.body })
  mounted.push(w)
  return w
}
afterEach(() => {
  while (mounted.length) mounted.pop().unmount()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.documentElement.removeAttribute('lang')
})

const field = (w) => w.find('input.g-number-field__field')
const hidden = (w) => w.find('input[type="hidden"]')
const root = (w) => w.find('.g-input')
const models = (w) => (w.emitted('update:modelValue') || []).map((e) => e[0])
const changes = (w) => (w.emitted('change') || []).map((e) => e[0])
async function typeText(w, text) {
  const el = field(w).element
  el.value = text
  el.setSelectionRange(text.length, text.length)
  await field(w).trigger('input')
}
const key = (w, k, o = {}) => field(w).trigger('keydown', { key: k, ...o })
const keyup = (w, k) => field(w).trigger('keyup', { key: k })
// jsdom no tiene PointerEvent: un MouseEvent con el tipo pointer* lleva button y es cancelable
function pointer(el, type, o = {}) {
  const e = new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, ...o })
  el.dispatchEvent(e)
  return e
}
const inc = (w) => w.find('.g-number-field__step--increment')
const dec = (w) => w.find('.g-number-field__step--decrement')
const STEP = { steppers: true, decrementLabel: 'Restar', incrementLabel: 'Sumar' }

// ---------------------------------------------------------------------------------------------------------------
describe('GNumberField · estructura y atributos', () => {
  it('compone GInput: raíz g-input + g-number-field, celda, espejo y el <input> dentro de la caja', () => {
    const w = mk({ modelValue: 72.5, suffix: 'kg', id: 'p' })
    expect(root(w).classes()).toEqual(expect.arrayContaining(['g-input', 'g-number-field', 'g-input--size-md']))
    expect(root(w).classes()).not.toContain('g-number-field--has-steppers')
    const cell = w.find('.g-input__control > .g-number-field__value')
    expect(cell.exists()).toBe(true)
    expect(cell.find('.g-number-field__mirror').attributes('aria-hidden')).toBe('true')
    expect(cell.find('.g-number-field__mirror').text()).toBe('72,5')
    expect(field(w).classes()).toEqual(['g-input__field', 'g-number-field__field'])
    expect(w.find('label').attributes('id')).toBe('p-label')
    expect(w.findAll('input').length).toBe(1) // sin name no hay oculto
  })

  it('type=text, role=spinbutton, dir=ltr, inputmode derivado (decimal / numeric con precision 0) y sobrescribible', () => {
    const a = field(mk({ modelValue: 1 })).attributes()
    expect([a.type, a.role, a.dir, a.inputmode, a.autocomplete, a.spellcheck, a.autocorrect]).toEqual(['text', 'spinbutton', 'ltr', 'decimal', 'off', 'false', 'off'])
    expect(field(mk({ precision: 0 })).attributes('inputmode')).toBe('numeric')
    expect(field(mk({ precision: 1 })).attributes('inputmode')).toBe('decimal')
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const o = field(mk({}, { attrs: { inputmode: 'text', autocomplete: 'on', type: 'number', role: 'textbox', dir: 'rtl', placeholder: '0' } })).attributes()
    expect([o.inputmode, o.autocomplete, o.type, o.role, o.dir, o.placeholder]).toEqual(['text', 'on', 'text', 'spinbutton', 'ltr', '0'])
  })

  it('aria-valuenow/valuetext con valor (formato del idioma, sin unidad), valuemin/max solo con límites; vacío sin ellos', async () => {
    const w = mk({ modelValue: 1234.5, suffix: 'kg', min: 0, max: 5000, precision: 1 })
    let a = field(w).attributes()
    expect([a['aria-valuenow'], a['aria-valuetext'], a['aria-valuemin'], a['aria-valuemax']]).toEqual(['1234.5', '1234,5', '0', '5000'])
    await w.setProps({ modelValue: 12345 })
    expect(field(w).attributes('aria-valuetext')).toBe('12.345,0')
    await w.setProps({ modelValue: null })
    a = field(w).attributes()
    expect(a['aria-valuenow']).toBeUndefined()
    expect(a['aria-valuetext']).toBeUndefined()
    const b = field(mk({ modelValue: 3 })).attributes()
    expect(b['aria-valuemin']).toBeUndefined()
    expect(b['aria-valuemax']).toBeUndefined()
  })

  it('required: aria-required y la marca de GInput, nunca required nativo; readonly: nativo y aria-readonly', () => {
    const w = mk({ required: true, readonly: true })
    expect(field(w).attributes('aria-required')).toBe('true')
    expect(field(w).attributes('required')).toBeUndefined()
    expect(w.find('.g-input__required').exists()).toBe(true)
    expect(field(w).attributes('readonly')).toBeDefined()
    expect(field(w).attributes('aria-readonly')).toBe('true')
    expect(field(mk()).attributes('aria-readonly')).toBeUndefined()
  })

  it('oculto con el canónico y el name; el visible sin name; disabled con el campo; presente en readonly; form copiado', async () => {
    const w = mk({ name: 'peso', modelValue: 72.5 }, { attrs: { form: 'f1' } })
    expect(field(w).attributes('name')).toBeUndefined()
    expect(field(w).element.value).toBe('72,5')
    expect(hidden(w).attributes()).toMatchObject({ name: 'peso', value: '72.5', form: 'f1' })
    expect(hidden(w).element.value).toBe('72.5')
    await w.setProps({ modelValue: 12345 })
    expect(field(w).element.value).toBe('12.345')
    expect(hidden(w).element.value).toBe('12345')
    await w.setProps({ modelValue: null })
    expect(hidden(w).element.value).toBe('')
    await w.setProps({ disabled: true })
    expect(hidden(w).attributes('disabled')).toBeDefined()
    expect(field(w).attributes('disabled')).toBeDefined()
    await w.setProps({ disabled: false, readonly: true })
    expect(hidden(w).exists()).toBe(true)
    expect(hidden(w).attributes('disabled')).toBeUndefined()
  })

  it('FormData de un <form> lleva el canónico, no el texto del idioma', async () => {
    const w = host('<form><GNumberField label="Peso" name="peso" locale="es" v-model="v" /><GNumberField label="Pob" name="pob" locale="es" v-model="p" /></form>', () => ({ v: ref(72.5), p: ref(12345) }))
    const fd = new FormData(w.find('form').element)
    expect(fd.get('peso')).toBe('72.5')
    expect(fd.get('pob')).toBe('12345')
  })

  it('class y style a la raíz; los demás atributos al <input> visible', () => {
    const w = mk({}, { attrs: { class: 'mio', style: 'margin: 0', 'data-x': '1', 'aria-describedby': 'ext' } })
    expect(root(w).classes()).toContain('mio')
    expect(root(w).attributes('style')).toContain('margin')
    expect(field(w).attributes('data-x')).toBe('1')
    expect(field(w).attributes('aria-describedby').split(' ')[0]).toBe('ext')
    expect(field(w).classes()).not.toContain('mio')
  })

  it('prefijo y sufijo en aria-describedby antes de ayuda y mensaje (#166); pulsar el sufijo enfoca el campo', async () => {
    const w = mk({ id: 'p', suffix: 'kg', suffixLabel: 'kilogramos', hint: 'Sin zapatos', error: 'Mal' })
    expect(field(w).attributes('aria-describedby')).toBe('p-suffix p-hint p-message')
    await w.find('.g-input__suffix').trigger('click')
    expect(document.activeElement).toBe(field(w).element)
  })

  it('slots label, hint, error y prepend pasan a GInput; append y action no se pintan', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mk({ label: undefined, error: 'x' }, {
      slots: { label: '<b>Peso</b>', hint: '<i>ayuda</i>', error: '<u>mal</u>', prepend: '<svg />', append: '<em>a</em>', action: '<button>b</button>' }
    })
    expect(w.find('label b').exists()).toBe(true)
    expect(w.find('.g-input__hint i').exists()).toBe(true)
    expect(w.find('.g-input__message u').exists()).toBe(true)
    expect(w.find('.g-input__prepend').attributes('aria-hidden')).toBe('true')
    expect(w.find('.g-input__append').exists()).toBe(false)
    expect(w.find('.g-input__action').exists()).toBe(false)
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GNumberField · modelo y escritura', () => {
  it('el modelo es Number o null, nunca una cadena', async () => {
    const w = mk()
    await typeText(w, '36')
    await typeText(w, '36,5')
    await typeText(w, '')
    expect(models(w)).toEqual([36, 36.5, null])
    expect(models(w).every((v) => v === null || typeof v === 'number')).toBe(true)
  })

  it('«1» → «1,» no emite (sigue 1) y el texto parcial se respeta aunque la aplicación devuelva el modelo', async () => {
    const w = mk()
    await typeText(w, '1')
    await w.setProps({ modelValue: 1 })
    await typeText(w, '1,')
    expect(models(w)).toEqual([1])
    await w.setProps({ modelValue: 1 })
    expect(field(w).element.value).toBe('1,')
  })

  it('un cambio desde la aplicación que no coincide reescribe el texto, sin emitir', async () => {
    const w = mk({ modelValue: 1 })
    await w.setProps({ modelValue: 2.5 })
    expect(field(w).element.value).toBe('2,5')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(w.emitted('change')).toBeUndefined()
  })

  it('lo escrito fuera de rango NO se recorta (#157)', async () => {
    const w = mk({ min: 0, max: 120 })
    await typeText(w, '150')
    await field(w).trigger('blur')
    expect(models(w)).toEqual([150])
    expect(field(w).element.value).toBe('150')
  })

  it('el separador tecleado se convierte al del idioma en el acto; «.» en es es decimal', async () => {
    const w = mk()
    await typeText(w, '36.5')
    expect(field(w).element.value).toBe('36,5')
    expect(models(w)).toEqual([36.5])
  })

  it('filtro: letras, «e», segundo separador y «-» sin negativos no entran; el texto anterior se conserva', async () => {
    const w = mk({ min: 0 })
    await typeText(w, '36')
    for (const t of ['36a', '36e', '3,6,', '-36']) {
      await typeText(w, t)
      expect(field(w).element.value).toBe('36')
    }
    expect(models(w)).toEqual([36])
    const neg = mk()
    await typeText(neg, '-')
    expect(neg.emitted('update:modelValue')).toBeUndefined() // «-» solo: sigue null
    expect(field(neg).element.value).toBe('-')
    await typeText(neg, '-4,5')
    expect(models(neg)).toEqual([-4.5])
  })

  it('precision: el modelo se redondea en el acto y el texto al salir (37 → «37,0»); precision 0 no admite separador', async () => {
    const w = mk({ precision: 1 })
    await typeText(w, '36,55')
    expect(models(w)).toEqual([36.6])
    expect(field(w).element.value).toBe('36,55')
    await field(w).trigger('blur')
    expect(field(w).element.value).toBe('36,6')
    await typeText(w, '37')
    await field(w).trigger('blur')
    expect(field(w).element.value).toBe('37,0')
    const e = mk({ precision: 0 })
    await typeText(e, '3,')
    expect(field(e).element.value).toBe('')
  })

  it('«-», «,» o «-,» solos se vacían al salir (null)', async () => {
    const w = mk()
    for (const t of ['-', ',', '-,']) {
      await typeText(w, t)
      await field(w).trigger('blur')
      expect(field(w).element.value).toBe('')
    }
    expect(models(w).every((v) => v === null)).toBe(true)
  })

  it('al entrar, texto crudo (sin miles); al salir, el formato del idioma con miles', async () => {
    const w = mk({ modelValue: 1234567 })
    expect(field(w).element.value).toBe('1.234.567')
    await field(w).trigger('focus')
    expect(field(w).element.value).toBe('1234567')
    await field(w).trigger('blur')
    expect(field(w).element.value).toBe('1.234.567')
    expect(field(mk({ modelValue: 2026, locale: 'en-US', grouping: false })).element.value).toBe('2026')
  })

  it('IME: no filtra durante la composición y aplica en compositionend', async () => {
    const w = mk()
    await field(w).trigger('compositionstart')
    field(w).element.value = '3a'
    await field(w).trigger('input')
    expect(field(w).element.value).toBe('3a')
    field(w).element.value = '3'
    await field(w).trigger('compositionend')
    expect(models(w)).toEqual([3])
  })

  it('pegar: regla del idioma; lo que no es número no entra; se inserta el crudo ya redondeado', async () => {
    const w = mk({ precision: 1 })
    const paste = async (t) => {
      const el = field(w).element
      el.select()
      const e = new Event('paste', { bubbles: true, cancelable: true })
      e.clipboardData = { getData: () => t }
      el.dispatchEvent(e)
      await nextTick()
      return e
    }
    expect((await paste('12.345')).defaultPrevented).toBe(true)
    expect(models(w).at(-1)).toBe(12345)
    await paste('1,234.56')
    expect(models(w).at(-1)).toBe(1234.6)
    expect(field(w).element.value).toBe('1234,6')
    const n = models(w).length
    await paste('setenta')
    expect(models(w).length).toBe(n)
    expect(field(w).element.value).toBe('1234,6')
  })

  it('NaN/±Infinity se leen como null con aviso; undefined como null sin aviso; una cadena canónica se muestra', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(field(mk({ modelValue: undefined })).element.value).toBe('')
    expect(warn).not.toHaveBeenCalled()
    expect(field(mk({ modelValue: NaN })).element.value).toBe('')
    expect(warn.mock.calls.some((c) => /\[Grana GNumberField\].*NaN/.test(c[0]))).toBe(true)
    expect(field(mk({ modelValue: Infinity })).element.value).toBe('')
    const vueWarn = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(field(mk({ modelValue: '72.5' })).element.value).toBe('72,5')
    expect(field(mk({ modelValue: 'abc' })).element.value).toBe('')
    vueWarn.mockRestore()
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GNumberField · teclado', () => {
  it('↑/↓ ± step, Shift ×10, Re Pág/Av Pág ×10; Inicio/Fin no cambian el valor; Alt/Ctrl/Meta no se interceptan', async () => {
    const w = mk({ modelValue: 36 })
    await field(w).trigger('focus')
    await key(w, 'ArrowUp'); expect(models(w).at(-1)).toBe(37)
    await key(w, 'ArrowUp', { shiftKey: true }); expect(models(w).at(-1)).toBe(47)
    await key(w, 'PageDown'); expect(models(w).at(-1)).toBe(37)
    await key(w, 'PageUp'); expect(models(w).at(-1)).toBe(47)
    await key(w, 'ArrowDown'); expect(models(w).at(-1)).toBe(46)
    const n = models(w).length
    await key(w, 'Home'); await key(w, 'End'); await key(w, 'ArrowUp', { altKey: true }); await key(w, 'ArrowUp', { ctrlKey: true }); await key(w, 'ArrowUp', { metaKey: true })
    expect(models(w).length).toBe(n)
  })

  it('el paso deja el cursor al final con el foco en el campo', async () => {
    const w = mk({ modelValue: 9 })
    field(w).element.focus()
    await key(w, 'ArrowUp')
    const el = field(w).element
    expect(el.value).toBe('10')
    expect([el.selectionStart, el.selectionEnd]).toEqual([2, 2])
  })

  it('pasos exactos y en la rejilla desde min: 72,5 + 3 × 0,1 = 72,8; 72,53 → 72,6', async () => {
    const w = mk({ modelValue: 72.5, step: 0.1, min: 0, max: 400 })
    for (let i = 0; i < 3; i++) await key(w, 'ArrowUp')
    expect(models(w).at(-1)).toBe(72.8)
    await w.setProps({ modelValue: 72.53 })
    await key(w, 'ArrowUp')
    expect(models(w).at(-1)).toBe(72.6)
  })

  it('límites: no rebasa; desde fuera de rango entra al límite; vacío pone el punto de partida', async () => {
    const w = mk({ modelValue: 150, max: 120 })
    await key(w, 'ArrowUp')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    await key(w, 'ArrowDown')
    expect(models(w)).toEqual([120])
    const e = mk({ min: 30, max: 45 })
    await key(e, 'ArrowUp')
    expect(models(e)).toEqual([30])
  })

  it('readonly y disabled: las flechas no cambian el valor', async () => {
    const r = mk({ modelValue: 5, readonly: true })
    await key(r, 'ArrowUp')
    expect(r.emitted('update:modelValue')).toBeUndefined()
    const d = mk({ modelValue: 5, disabled: true })
    await key(d, 'ArrowUp')
    expect(d.emitted('update:modelValue')).toBeUndefined()
  })

  it('Enter confirma: redondea, formatea y emite change si cambió; no cancela el envío implícito', async () => {
    const w = mk({ precision: 1, modelValue: 1 })
    field(w).element.focus()
    await typeText(w, '36,55')
    const e = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    field(w).element.dispatchEvent(e)
    await nextTick()
    expect(e.defaultPrevented).toBe(false)
    expect(field(w).element.value).toBe('36,6')
    expect(changes(w)).toEqual([36.6])
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GNumberField · change (una vez por gesto)', () => {
  it('flechas con autorrepetición → un change al keyup', async () => {
    const w = mk({ modelValue: 1 })
    await key(w, 'ArrowUp')
    await key(w, 'ArrowUp', { repeat: true })
    await key(w, 'ArrowUp', { repeat: true })
    expect(w.emitted('change')).toBeUndefined()
    await keyup(w, 'ArrowUp')
    expect(changes(w)).toEqual([4])
    await field(w).trigger('blur')
    expect(changes(w)).toEqual([4]) // salir sin otro cambio: ninguno
  })

  it('salir sin cambio no emite; un cambio desde la aplicación no emite y pasa a ser el confirmado', async () => {
    const w = mk({ modelValue: 5 })
    await field(w).trigger('focus')
    await field(w).trigger('blur')
    await w.setProps({ modelValue: 7 })
    await field(w).trigger('focus')
    await field(w).trigger('blur')
    expect(w.emitted('change')).toBeUndefined()
    await typeText(w, '8')
    await field(w).trigger('blur')
    expect(changes(w)).toEqual([8])
  })

  it('mantener + 1 s → muchos pasos y UN change al soltar; repetición 400/60 ms', async () => {
    vi.useFakeTimers()
    const w = mk({ modelValue: 1, ...STEP })
    pointer(inc(w).element, 'pointerdown')
    expect(models(w)).toEqual([2])
    vi.advanceTimersByTime(399)
    expect(models(w)).toEqual([2])
    vi.advanceTimersByTime(1) // 400: empieza la repetición
    vi.advanceTimersByTime(60)
    expect(models(w)).toEqual([2, 3])
    vi.advanceTimersByTime(540) // 1 s en total
    expect(models(w).at(-1)).toBe(12)
    expect(w.emitted('change')).toBeUndefined()
    window.dispatchEvent(new Event('pointerup'))
    expect(changes(w)).toEqual([12])
    vi.advanceTimersByTime(500)
    expect(models(w).at(-1)).toBe(12) // se detuvo
  })

  it('la repetición se detiene con pointercancel, con la pérdida de foco de la ventana y en el límite', async () => {
    vi.useFakeTimers()
    for (const stop of ['pointercancel', 'blur']) {
      const w = mk({ modelValue: 1, ...STEP })
      pointer(inc(w).element, 'pointerdown')
      vi.advanceTimersByTime(520)
      window.dispatchEvent(new Event(stop))
      const n = models(w).length
      vi.advanceTimersByTime(500)
      expect(models(w).length).toBe(n)
      expect(changes(w).length).toBe(1)
    }
    const l = mk({ modelValue: 1, max: 4, ...STEP })
    pointer(inc(l).element, 'pointerdown')
    vi.advanceTimersByTime(2000)
    expect(models(l)).toEqual([2, 3, 4])
    expect(changes(l)).toEqual([4]) // el límite termina el gesto
  })

  it('el @change del consumidor recibe el Number confirmado y NO llega al change nativo', async () => {
    const onChange = vi.fn()
    const w = mk({ modelValue: 1, onChange })
    await field(w).trigger('change')
    expect(onChange).not.toHaveBeenCalled()
    await typeText(w, '2')
    await field(w).trigger('blur')
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(2)
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GNumberField · −/+', () => {
  it('sin los dos textos no se pintan y se avisa; con ellos, dentro de la caja al final, tabindex=-1 y nombre compuesto', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const none = mk({ steppers: true, decrementLabel: 'Restar' })
    expect(none.find('.g-number-field__steppers').exists()).toBe(false)
    expect(warn.mock.calls.some((c) => /decrementLabel e incrementLabel/.test(c[0]))).toBe(true)
    const w = mk({ id: 'q', ...STEP })
    expect(root(w).classes()).toContain('g-number-field--has-steppers')
    const ctl = w.find('.g-input__control').element
    expect(ctl.lastElementChild.classList.contains('g-number-field__steppers')).toBe(true)
    expect(ctl.lastElementChild.closest('[aria-hidden]')).toBe(null)
    const d = dec(w).attributes()
    expect([d.type, d.tabindex, d['aria-controls'], d['aria-labelledby']]).toEqual(['button', '-1', 'q', 'q-decrement q-label'])
    expect(w.find('#q-decrement').text()).toBe('Restar')
    expect(w.find('#q-decrement').classes()).toContain('g-number-field__step-label')
    expect(inc(w).attributes('aria-labelledby')).toBe('q-increment q-label')
    expect(dec(w).find('svg').attributes('aria-hidden')).toBe('true')
  })

  it('sin etiqueta visible: aria-labelledby del consumidor o aria-label compuesto', () => {
    const a = mk({ id: 'q', label: undefined, ...STEP }, { attrs: { 'aria-labelledby': 'ext' } })
    expect(dec(a).attributes('aria-labelledby')).toBe('q-decrement ext')
    const b = mk({ id: 'r', label: undefined, ...STEP }, { attrs: { 'aria-label': 'Cantidad' } })
    expect(inc(b).attributes('aria-label')).toBe('Sumar Cantidad')
    expect(inc(b).attributes('aria-labelledby')).toBeUndefined()
  })

  it('deshabilitados en los límites (fuera de rango: + sí, − no), con disabled; habilitados sin valor; ausentes en readonly', async () => {
    const w = mk({ modelValue: 1, min: 1, max: 120, ...STEP })
    expect(dec(w).attributes('disabled')).toBeDefined()
    expect(inc(w).attributes('disabled')).toBeUndefined()
    await w.setProps({ modelValue: 150 })
    expect(inc(w).attributes('disabled')).toBeDefined()
    expect(dec(w).attributes('disabled')).toBeUndefined()
    await w.setProps({ modelValue: null })
    expect(inc(w).attributes('disabled')).toBeUndefined()
    expect(dec(w).attributes('disabled')).toBeUndefined()
    await w.setProps({ disabled: true })
    expect(inc(w).attributes('disabled')).toBeDefined()
    expect(dec(w).attributes('disabled')).toBeDefined()
    await w.setProps({ disabled: false, readonly: true })
    expect(w.find('.g-number-field__steppers').exists()).toBe(false)
    expect(root(w).classes()).not.toContain('g-number-field--has-steppers')
  })

  it('pointerdown: paso, preventDefault, el foco no se mueve y sin foco previo el campo no se enfoca', async () => {
    const w = mk({ modelValue: 1, ...STEP })
    document.activeElement?.blur()
    const e = pointer(inc(w).element, 'pointerdown')
    window.dispatchEvent(new Event('pointerup'))
    expect(e.defaultPrevented).toBe(true)
    expect(models(w)).toEqual([2])
    expect(document.activeElement).toBe(document.body)
    expect(changes(w)).toEqual([2])
    // botón secundario: nada
    pointer(inc(w).element, 'pointerdown', { button: 2 })
    expect(models(w)).toEqual([2])
  })

  it('click con detail 0 (sin puntero) da un paso y su change; un click con detail 1 no suma otra vez', async () => {
    const w = mk({ modelValue: 1, ...STEP })
    inc(w).element.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }))
    expect(models(w)).toEqual([2])
    expect(changes(w)).toEqual([2])
    inc(w).element.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))
    expect(models(w)).toEqual([2])
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GNumberField · GForm', () => {
  const ERR = { peso: 'Escribe el peso.' }
  it('se registra por name: errors[name] pinta el mensaje tras salir, con aria-invalid', async () => {
    const w = host('<GForm :errors="errors" :labels="labels"><GNumberField label="Peso" name="peso" locale="es" v-model="v" /></GForm>', () => ({ errors: ERR, labels: LABELS, v: ref(null) }))
    await typeText(w, '7')
    await field(w).trigger('focusout')
    await nextTick()
    expect(w.find('.g-input__message').text()).toContain('Escribe el peso.')
    expect(field(w).attributes('aria-invalid')).toBe('true')
  })

  it('flechas = escritura: el error se revela al salir; −/+ = cambio: sube dirty y no revela', async () => {
    const dirty = ref(false)
    const a = host('<GForm :errors="errors" :labels="labels" v-model:dirty="dirty"><GNumberField label="Peso" name="peso" locale="es" v-model="v" /></GForm>', () => ({ errors: ERR, labels: LABELS, v: ref(1), dirty }))
    await key(a, 'ArrowUp')
    await keyup(a, 'ArrowUp')
    expect(dirty.value).toBe(true)
    expect(a.find('.g-input__message').text()).toBe('')
    await field(a).trigger('focusout')
    await nextTick()
    expect(a.find('.g-input__message').text()).toContain('Escribe el peso.')

    const dirty2 = ref(false)
    const b = host('<GForm :errors="errors" :labels="labels" v-model:dirty="dirty"><GNumberField label="Peso" name="peso" locale="es" v-model="v" steppers decrement-label="Restar" increment-label="Sumar" /></GForm>', () => ({ errors: ERR, labels: LABELS, v: ref(1), dirty: dirty2 }))
    pointer(inc(b).element, 'pointerdown')
    window.dispatchEvent(new Event('pointerup'))
    await nextTick()
    expect(dirty2.value).toBe(true)
    expect(b.find('.g-input__message').text()).toBe('')
  })

  it('is-rejected (I2) llega con un envío con errores y lo retira un paso', async () => {
    const w = host('<GForm :errors="errors" :labels="labels"><GNumberField label="Peso" name="peso" locale="es" v-model="v" steppers decrement-label="Restar" increment-label="Sumar" /></GForm>', () => ({ errors: ERR, labels: LABELS, v: ref(1) }))
    await w.find('form').trigger('submit')
    await new Promise((r) => setTimeout(r, 40))
    expect(root(w).classes()).toContain('is-rejected')
    pointer(inc(w).element, 'pointerdown')
    window.dispatchEvent(new Event('pointerup'))
    await nextTick()
    expect(root(w).classes()).not.toContain('is-rejected')
  })

  it('el envío de GForm lleva el canónico en FormData', async () => {
    const onSubmit = vi.fn()
    const w = host('<GForm @submit="onSubmit" :labels="labels"><GNumberField label="Peso" name="peso" locale="es" v-model="v" /></GForm>', () => ({ onSubmit, labels: LABELS, v: ref(72.5) }))
    w.find('form').element.requestSubmit()
    await new Promise((r) => setTimeout(r, 40))
    expect(onSubmit.mock.calls[0][0].data.get('peso')).toBe('72.5')
  })

  it('manejadores primero: una escucha @input del consumidor ya ve el v-model actualizado', async () => {
    const seen = []
    const v = ref(null)
    const w = host('<GNumberField label="Peso" locale="es" v-model="v" @input="onInput" />', () => ({ v, onInput: () => seen.push(v.value) }))
    await typeText(w, '42')
    expect(seen).toEqual([42])
  })

  it('readonly y disabled del contexto (GForm) se heredan: −/+ ausentes en readonly', () => {
    const w = host('<GForm readonly><GNumberField label="Peso" name="peso" locale="es" :model-value="1" steppers decrement-label="Restar" increment-label="Sumar" /></GForm>')
    expect(w.find('.g-number-field__steppers').exists()).toBe(false)
    expect(field(w).attributes('readonly')).toBeDefined()
    expect(hidden(w).attributes('disabled')).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GNumberField · personalidad', () => {
  // getComputedStyle simulado: las capas y celdas con animación de coco
  function fakeAnimations(map) {
    const real = window.getComputedStyle
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
      const cs = real(el)
      for (const [sel, name] of Object.entries(map)) {
        if (el.matches?.(sel)) return { ...cs, getPropertyValue: (p) => cs.getPropertyValue(p), animationName: name, animationDuration: '0.16s' }
      }
      return cs
    })
  }
  const animEnd = (el, name) => {
    const e = new Event('animationend', { bubbles: true })
    Object.defineProperty(e, 'animationName', { value: name })
    el.dispatchEvent(e)
  }

  it('P2: un paso deliberado crea la capa con solo las cifras que cambian y la dirección; se retira con animationend', async () => {
    fakeAnimations({ '.g-number-field__roll-new': 'g-number-roll-up-new', '.g-number-field__roll-old': 'g-number-roll-up-old' })
    const w = mk({ modelValue: 19, ...STEP })
    pointer(inc(w).element, 'pointerdown')
    window.dispatchEvent(new Event('pointerup'))
    await nextTick()
    await nextTick()
    const layer = w.find('.g-number-field__roll')
    expect(layer.exists()).toBe(true)
    expect(layer.attributes()).toMatchObject({ 'aria-hidden': 'true', dir: 'ltr', 'data-direction': 'up' })
    expect(w.find('.g-number-field__value').classes()).toContain('is-rolling')
    const slots = w.findAll('.g-number-field__roll-slot')
    expect(slots.map((s) => [s.find('.g-number-field__roll-new').text(), s.find('.g-number-field__roll-old').text()])).toEqual([['2', '1'], ['0', '9']])
    expect(field(w).element.value).toBe('20') // el <input> ya tiene el valor nuevo
    const olds = w.findAll('.g-number-field__roll-new, .g-number-field__roll-old')
    olds.forEach((o, i) => { if (i < olds.length - 1) animEnd(o.element, 'g-number-roll-up-new') })
    await nextTick()
    expect(w.find('.g-number-field__roll').exists()).toBe(true)
    animEnd(olds.at(-1).element, 'g-number-roll-up-old')
    await nextTick()
    expect(w.find('.g-number-field__roll').exists()).toBe(false)
    expect(w.find('.g-number-field__value').classes()).not.toContain('is-rolling')
  })

  it('P2: 20 → 21 una cifra; restar = data-direction down; 99 → 100 entra la posición nueva sin cifra vieja', async () => {
    fakeAnimations({ '.g-number-field__roll-new': 'g-number-roll-x' })
    const w = mk({ modelValue: 20 })
    await key(w, 'ArrowUp')
    await nextTick()
    expect(w.findAll('.g-number-field__roll-slot').length).toBe(1)
    await field(w).trigger('blur') // salir retira la capa
    await key(w, 'ArrowDown')
    await nextTick()
    expect(w.find('.g-number-field__roll').attributes('data-direction')).toBe('down')
    const n = mk({ modelValue: 99 })
    await key(n, 'ArrowUp')
    await nextTick()
    const s = n.findAll('.g-number-field__roll-slot')
    expect(s.length).toBe(3)
    expect(s[0].find('.g-number-field__roll-old').exists()).toBe(false)
  })

  it('P2: sin animación calculada (movimiento reducido o sin CSS) la capa se retira en el acto', async () => {
    const w = mk({ modelValue: 19 })
    await key(w, 'ArrowUp')
    await nextTick()
    await nextTick()
    expect(w.find('.g-number-field__roll').exists()).toBe(false)
    expect(w.find('.g-number-field__value').classes()).not.toContain('is-rolling')
  })

  it('P2: no rueda al repetir, al escribir, con una capa previa ni con el texto desbordado', async () => {
    fakeAnimations({ '.g-number-field__roll-new': 'g-number-roll-x' })
    const w = mk({ modelValue: 1 })
    await key(w, 'ArrowUp', { repeat: true })
    await nextTick()
    expect(w.find('.g-number-field__roll').exists()).toBe(false)
    await typeText(w, '5')
    expect(w.find('.g-number-field__roll').exists()).toBe(false)
    await key(w, 'ArrowUp')
    await nextTick()
    expect(w.find('.g-number-field__roll').exists()).toBe(true)
    await key(w, 'ArrowUp') // paso rápido: la anterior se retira y este no rueda
    await nextTick()
    expect(w.find('.g-number-field__roll').exists()).toBe(false)
    const o = mk({ modelValue: 1 })
    Object.defineProperty(field(o).element, 'scrollWidth', { value: 200, configurable: true })
    Object.defineProperty(field(o).element, 'clientWidth', { value: 100, configurable: true })
    await key(o, 'ArrowUp')
    await nextTick()
    expect(o.find('.g-number-field__roll').exists()).toBe(false)
  })

  it('P3: tecla no repetida en el límite → is-bumping + data-bump; se retira con animationend g-number-bump…', async () => {
    fakeAnimations({ '.g-number-field__value.is-bumping': 'g-number-bump-up' })
    const w = mk({ modelValue: 9, max: 9 })
    await key(w, 'ArrowUp')
    await new Promise((r) => setTimeout(r, 40))
    await nextTick()
    const cell = w.find('.g-number-field__value')
    expect(cell.classes()).toContain('is-bumping')
    expect(cell.attributes('data-bump')).toBe('up')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    animEnd(cell.element, 'g-number-bump-up')
    await nextTick()
    expect(cell.classes()).not.toContain('is-bumping')
    expect(cell.attributes('data-bump')).toBeUndefined()
  })

  it('P3: nada al repetir, fuera del límite ni sin animación calculada', async () => {
    const w = mk({ modelValue: 9, max: 9 })
    await key(w, 'ArrowUp')
    await new Promise((r) => setTimeout(r, 40))
    await nextTick()
    expect(w.find('.g-number-field__value').classes()).not.toContain('is-bumping')
    fakeAnimations({ '.g-number-field__value.is-bumping': 'g-number-bump-up' })
    await key(w, 'ArrowUp', { repeat: true })
    await new Promise((r) => setTimeout(r, 40))
    expect(w.find('.g-number-field__value').classes()).not.toContain('is-bumping')
    const f = mk({ modelValue: 5, max: 9 })
    await key(f, 'ArrowUp')
    await new Promise((r) => setTimeout(r, 40))
    expect(f.find('.g-number-field__value').classes()).not.toContain('is-bumping')
  })

  it('P1: pulsar el área vacía de la caja enfoca el campo con el cursor al final; −/+ y el propio campo, no', async () => {
    const w = mk({ modelValue: 72.5, suffix: 'kg', ...STEP })
    document.activeElement?.blur()
    const e = pointer(w.find('.g-input__control').element, 'pointerdown')
    expect(e.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(field(w).element)
    const el = field(w).element
    expect([el.selectionStart, el.selectionEnd]).toEqual([el.value.length, el.value.length])
    el.blur()
    pointer(w.find('.g-input__suffix').element, 'pointerdown')
    expect(document.activeElement).toBe(el)
    el.blur()
    const f = pointer(el, 'pointerdown')
    expect(f.defaultPrevented).toBe(false)
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GNumberField · idioma', () => {
  it('prop › lang del ancestro más cercano › navigator.language', async () => {
    const w = host('<div lang="ar-EG"><GNumberField label="A" :model-value="-4.5" :precision="1" /></div><div lang="de"><GNumberField label="B" :model-value="1.5" locale="es" /></div>')
    await nextTick()
    const [a, b] = w.findAll('input.g-number-field__field')
    expect(a.element.value).toBe('-٤٫٥')
    expect(b.element.value).toBe('1,5')
    vi.stubGlobal('navigator', { language: 'en-US' })
    const c = host('<GNumberField label="C" :model-value="1234.5" />')
    await nextTick()
    expect(field(c).element.value).toBe('1,234.5')
  })

  it('el lang de <html> cuenta como ancestro', async () => {
    document.documentElement.setAttribute('lang', 'es')
    const w = host('<GNumberField label="C" :model-value="12345" />')
    await nextTick()
    expect(field(w).element.value).toBe('12.345')
  })

  it('un locale que Intl rechaza avisa y sigue la cadena; un cambio de la prop reformatea', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    document.documentElement.setAttribute('lang', 'es')
    const w = host('<GNumberField label="C" :locale="loc" :model-value="1.5" />', () => ({ loc: ref('es_MX') }))
    await nextTick()
    expect(warn.mock.calls.some((c) => /locale «es_MX»/.test(c[0]))).toBe(true)
    expect(field(w).element.value).toBe('1,5')
    w.vm.loc = 'en-US'
    await nextTick()
    expect(field(w).element.value).toBe('1.5')
  })

  it('ar-EG: escribir cifras arábigo-índicas o latinas; al salir, las del idioma', async () => {
    const w = mk({ locale: 'ar-EG', precision: 1 })
    await typeText(w, '٣٫٥')
    expect(models(w)).toEqual([3.5])
    await typeText(w, '-7')
    await field(w).trigger('blur')
    expect(models(w).at(-1)).toBe(-7)
    expect(field(w).element.value).toBe('-٧٫٠')
  })

  it('he: sin marca bidi en el campo ni en aria-valuetext', () => {
    const w = mk({ locale: 'he', modelValue: -72.5 })
    expect(field(w).element.value).toBe('-72.5')
    expect(field(w).attributes('aria-valuetext')).toBe('-72.5')
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GNumberField · mínimo publicado en una GFormRow (#312)', () => {
  function rowHost(props, layoutExtra = {}) {
    const calls = []
    const Row = defineComponent({
      setup(_, { slots }) {
        provide(layoutKey, { block: true, setIntrinsicMin: (el, px) => calls.push([el, px]), ...layoutExtra })
        return () => slots.default()
      }
    })
    const w = mount(defineComponent({ components: { Row, GNumberField }, setup: () => ({ props }), template: '<Row><GNumberField v-bind="props" /></Row>' }), { attachTo: document.body })
    mounted.push(w)
    return { w, calls }
  }
  // Rectángulos simulados por selector: [left, right] o una función del elemento
  function fakeRects(map) {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
      for (const [sel, v] of Object.entries(map)) {
        if (!this.matches(sel)) continue
        const [left, right] = typeof v === 'function' ? v(this) : v
        return { left, right, width: right - left, height: 36, top: 0, bottom: 36, x: left, y: 0 }
      }
      return { left: 0, right: 0, width: 0, height: 0, top: 0, bottom: 0, x: 0, y: 0 }
    })
  }
  const settle = () => new Promise((r) => setTimeout(r, 60))

  it('con −/+ publica (antes de la celda) + texto de referencia (el más ancho entre min, max y placeholder) + sufijo + −/+, sin el hueco libre de P1', async () => {
    // caja 0–300; prefijo hasta 40; celda 40–60 (mide «1»); sufijo 68–90; hueco libre; −/+ 228–300
    fakeRects({ '.g-input__control': [0, 300], '.g-number-field__value': [40, 60], '.g-input__suffix': [68, 90], '.g-number-field__steppers': [228, 300], '.g-number-field__measure': (el) => [0, el.textContent.length * 8.25] })
    const { w, calls } = rowHost({ label: 'Cantidad', locale: 'es', min: 1, max: 99, suffix: 'u', ...STEP })
    await settle()
    const [el, px] = calls.at(-1)
    expect(el).toBe(w.find('.g-input').element)
    expect(px).toBe(Math.ceil(40 + 2 * 8.25 + 30 + 72))
    expect(w.find('.g-number-field__measure').attributes('aria-hidden')).toBe('true')
    w.unmount()
    mounted.pop()
    expect(calls.at(-1)[1]).toBe(0) // al desmontar se retira
  })

  it('sin min ni max: cuatro cifras del idioma; sin −/+ no mide ni publica', async () => {
    fakeRects({ '.g-input__control': [0, 300], '.g-number-field__value': [12, 30], '.g-number-field__steppers': [228, 300], '.g-number-field__measure': (el) => [0, el.textContent === '8888' ? 40 : 0] })
    const { calls } = rowHost({ label: 'Cantidad', locale: 'es', ...STEP })
    await settle()
    expect(calls.at(-1)[1]).toBe(12 + 40 + 72)
    const plain = rowHost({ label: 'Cantidad', locale: 'es' })
    await settle()
    expect(plain.calls.length).toBe(0)
    expect(plain.w.find('.g-number-field__measure').exists()).toBe(false)
  })

  it('en readonly −/+ no se pintan pero cuentan (el medidor sigue): lo último medido o dos cuadrados del alto de la caja', async () => {
    fakeRects({ '.g-input__control': [0, 300], '.g-number-field__value': [12, 30], '.g-number-field__steppers': [228, 300], '.g-number-field__measure': [0, 30] })
    const { w, calls } = rowHost({ label: 'Cantidad', locale: 'es', readonly: true, min: 1, max: 99, ...STEP })
    await settle()
    expect(w.find('.g-number-field__steppers').exists()).toBe(false)
    expect(w.find('.g-number-field__measure').exists()).toBe(true)
    expect(calls.at(-1)[1]).toBe(12 + 30 + 2 * 36) // nunca se pintaron: 2 × max(alto 36, 24)
    const unlocked = rowHost({ label: 'Cantidad', locale: 'es', min: 1, max: 99, ...STEP })
    await settle()
    const before = unlocked.calls.at(-1)[1]
    expect(before).toBe(12 + 30 + 72)
  })

  it('dentro de una GFormRow real se registra con setIntrinsicMin sin errores', async () => {
    const w = host('<GFormRow><GNumberField label="Cantidad" locale="es" steppers decrement-label="Restar" increment-label="Sumar" :min="1" :max="99" /><GNumberField label="Peso" locale="es" /></GFormRow>')
    await settle()
    expect(w.findAll('.g-number-field__measure').length).toBe(1)
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GNumberField · avisos de desarrollo', () => {
  const warnings = () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    return () => warn.mock.calls.map((c) => c[0]).filter((t) => t.startsWith('[Grana GNumberField]'))
  }
  it('1 sin nombre accesible (GInput no avisa por su cuenta); con aria-label no', () => {
    const get = warnings()
    mk({ label: undefined })
    expect(get().filter((t) => /nombre accesible/.test(t)).length).toBe(1)
    mk({ label: undefined }, { attrs: { 'aria-label': 'Peso' } })
    expect(get().filter((t) => /nombre accesible/.test(t)).length).toBe(1)
    expect(console.warn.mock.calls.some((c) => /\[Grana\] <GInput>/.test(c[0]))).toBe(false)
  })
  it('2 a 5 y 8: steppers sin textos, min > max, step inválido, precision corta, type y slots', () => {
    const get = warnings()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mk({ steppers: true })
    mk({ min: 10, max: 1 })
    mk({ step: 0 })
    mk({ step: 0.25, precision: 1 })
    mk({ min: 0.05, precision: 1 })
    mk({}, { attrs: { type: 'number' } })
    mk({}, { slots: { append: '<i />' } })
    const all = get().join('\n')
    expect(all).toMatch(/decrementLabel e incrementLabel/)
    expect(all).toMatch(/min \(10\) es mayor que max \(1\)/)
    expect(all).toMatch(/step 0 no es un número mayor que 0/)
    expect(get().filter((t) => /precision 1 es menor/.test(t)).length).toBe(2)
    expect(all).toMatch(/type no aplica/)
    expect(all).toMatch(/append y action no aplican/)
  })
  it('min > max: se ignoran los dos (sin límites en pasos ni en el árbol); step inválido usa 1', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const w = mk({ modelValue: 5, min: 10, max: 1 })
    expect(field(w).attributes('aria-valuemin')).toBeUndefined()
    await key(w, 'ArrowUp')
    expect(models(w)).toEqual([6])
    const s = mk({ modelValue: 5, step: -2 })
    await key(s, 'ArrowUp')
    expect(models(s)).toEqual([6])
  })
  it('una vez por instancia', async () => {
    const get = warnings()
    const w = mk({ modelValue: NaN })
    await w.setProps({ modelValue: Infinity })
    await w.setProps({ modelValue: NaN })
    expect(get().filter((t) => /no es un número finito/.test(t)).length).toBe(1)
  })
})
