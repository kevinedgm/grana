// GTimeField · design/contracts/time-field.md «Verificación · bruno» (DECISIONS.md #400 a #414; concepto A, #407)
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, provide, ref } from 'vue'
import GTimeField from './GTimeField.vue'
import GForm from '../GForm/GForm.vue'
import GErrorSummary from '../GErrorSummary/GErrorSummary.vue'
import GInput from '../GInput/GInput.vue'
import { layoutKey } from '../GForm/formContext.js'

const LABELS = { optional: '(opcional)', error: 'Error: ', warning: 'Advertencia: ', valid: 'Correcto: ' }
const INVALID = { invalid: 'Escribe una hora, por ejemplo 9:30' }
const mounted = []
function mk(props = {}, opts = {}) {
  const w = mount(GTimeField, { props: { label: 'Hora', locale: 'es', labels: INVALID, ...props }, attachTo: document.body, ...opts })
  mounted.push(w)
  return w
}
function host(template, setup = () => ({}), components = {}) {
  const w = mount(defineComponent({ components: { GTimeField, GForm, GErrorSummary, ...components }, setup, template }), { attachTo: document.body })
  mounted.push(w)
  return w
}
afterEach(() => {
  while (mounted.length) mounted.pop().unmount()
  vi.useRealTimers()
  vi.restoreAllMocks()
  document.documentElement.removeAttribute('lang')
  document.body.innerHTML = ''
})

const field = (w) => w.find('input.g-time-field__field')
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
async function typeChars(w, text) {
  for (let i = 1; i <= text.length; i++) await typeText(w, text.slice(0, i))
}
const key = (w, k, o = {}) => field(w).trigger('keydown', { key: k, ...o })
const keyup = (w, k) => field(w).trigger('keyup', { key: k })
function pointer(el, type, o = {}) {
  const e = new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, ...o })
  el.dispatchEvent(e)
  return e
}
const msg = (w) => w.find('.g-input__message').text()
const settle = () => new Promise((r) => setTimeout(r, 50))
const halfBtn = (w, half) => w.find(`.g-time-field__half[data-half="${half}"]`)
const choiceBtns = (w) => w.findAll('.g-time-field__choice')

// ---------------------------------------------------------------------------------------------------------------
describe('GTimeField · estructura y atributos', () => {
  it('compone GInput: raíz g-input + g-time-field, celda con espejo e <input>, etiqueta con id', () => {
    const w = mk({ modelValue: '09:07', id: 't' })
    expect(root(w).classes()).toEqual(expect.arrayContaining(['g-input', 'g-time-field', 'g-input--size-md']))
    expect(root(w).classes()).not.toContain('g-time-field--h12')
    const cell = w.find('.g-input__control > .g-time-field__value')
    expect(cell.find('.g-time-field__mirror').attributes('aria-hidden')).toBe('true')
    expect(cell.find('.g-time-field__mirror').text()).toBe('9:07')
    expect(field(w).classes()).toEqual(['g-input__field', 'g-time-field__field'])
    expect(w.find('label').attributes('id')).toBe('t-label')
    expect(w.findAll('input').length).toBe(1) // sin name no hay oculto
  })

  it('type=text, role=spinbutton, dir del idioma, inputmode numeric sobrescribible; type/role/dir ganan', () => {
    const a = field(mk({ modelValue: '21:30' })).attributes()
    expect([a.type, a.role, a.dir, a.inputmode, a.autocomplete, a.spellcheck, a.autocorrect]).toEqual(['text', 'spinbutton', 'ltr', 'numeric', 'off', 'false', 'off'])
    expect(field(mk({ locale: 'ar-EG' })).attributes('dir')).toBe('rtl')
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const o = field(mk({}, { attrs: { inputmode: 'text', type: 'time', role: 'textbox', dir: 'ltr', placeholder: '9:30' } })).attributes()
    expect([o.inputmode, o.type, o.role, o.placeholder]).toEqual(['text', 'text', 'spinbutton', '9:30'])
    expect(field(mk({ locale: 'he' }, { attrs: { dir: 'ltr' } })).attributes('dir')).toBe('rtl')
  })

  it('aria-value*: minutos, valuetext con la franja, valuemin/max solo con min ≤ max; vacío sin ellos', async () => {
    const w = mk({ modelValue: '09:07', min: '08:00', max: '18:00' })
    await nextTick() // la franja, solo en el cliente (tras montar)
    let a = field(w).attributes()
    expect([a['aria-valuenow'], a['aria-valuetext'], a['aria-valuemin'], a['aria-valuemax']]).toEqual(['547', '9:07 de la mañana', '480', '1080'])
    await w.setProps({ modelValue: null })
    a = field(w).attributes()
    expect(a['aria-valuenow']).toBeUndefined()
    expect(a['aria-valuetext']).toBeUndefined()
    // arco que cruza la medianoche o un solo límite: sin valuemin/max
    for (const p of [{ min: '22:00', max: '06:00' }, { min: '08:00' }, { max: '18:00' }]) {
      const b = field(mk({ modelValue: '23:00', ...p })).attributes()
      expect(b['aria-valuemin']).toBeUndefined()
      expect(b['aria-valuemax']).toBeUndefined()
    }
    // segundos: la unidad es el segundo
    expect(field(mk({ modelValue: '14:05:30', seconds: true })).attributes('aria-valuenow')).toBe(String(14 * 3600 + 5 * 60 + 30))
    // 12 h: valuetext con dayPeriod long
    const t = mk({ modelValue: '21:30', locale: 'es-MX' })
    await nextTick()
    expect(field(t).attributes('aria-valuetext')).toBe('9:30 de la noche')
  })

  it('texto sin interpretar: sin valuenow; valuetext = lo escrito', async () => {
    const w = mk()
    await typeText(w, '99:99')
    const a = field(w).attributes()
    expect(a['aria-valuenow']).toBeUndefined()
    expect(a['aria-valuetext']).toBe('99:99')
  })

  it('aria-required sin required nativo; readonly + aria-readonly; nunca aria-expanded, aria-haspopup ni aria-controls', () => {
    const a = field(mk({ required: true, readonly: true, modelValue: '07:45' })).attributes()
    expect(a['aria-required']).toBe('true')
    expect(a.required).toBeUndefined()
    expect(a.readonly).toBeDefined()
    expect(a['aria-readonly']).toBe('true')
    for (const k of ['aria-expanded', 'aria-haspopup', 'aria-controls']) expect(a[k]).toBeUndefined()
  })

  it('oculto canónico con name (el visible sin name); vacío, disabled, presente en readonly, form copiado', async () => {
    const w = mk({ name: 'toma', modelValue: '21:30' }, { attrs: { form: 'f1' } })
    expect(field(w).attributes('name')).toBeUndefined()
    expect(hidden(w).attributes()).toMatchObject({ name: 'toma', value: '21:30', form: 'f1' })
    await w.setProps({ modelValue: null })
    expect(hidden(w).element.value).toBe('')
    await w.setProps({ disabled: true })
    expect(hidden(w).attributes('disabled')).toBeDefined()
    expect(field(w).attributes('disabled')).toBeDefined()
    expect(hidden(mk({ name: 'x', readonly: true, modelValue: '07:45' })).attributes('disabled')).toBeUndefined()
    expect(hidden(mk({ name: 's', seconds: true, modelValue: '14:05:30' })).element.value).toBe('14:05:30')
  })

  it('FormData lleva el canónico', async () => {
    const w = host('<form><GTimeField label="Hora" name="hora" locale="es-MX" :labels="labels" v-model="v" /></form>', () => ({ v: ref('21:30'), labels: INVALID }))
    await nextTick()
    expect([...new FormData(w.find('form').element).entries()]).toEqual([['hora', '21:30']])
    expect(field(w).element.value).toMatch(/^9:30\s?p\.\s?m\.$/)
  })

  it('formato por idioma y ciclo (hourCycle fuerza)', () => {
    expect(field(mk({ modelValue: '21:30', locale: 'fi' })).element.value).toBe('21.30')
    expect(field(mk({ modelValue: '21:30', locale: 'ko' })).element.value).toBe('오후 9:30')
    expect(field(mk({ modelValue: '21:30', locale: 'ar-EG' })).element.value).toBe('٩:٣٠ م')
    expect(field(mk({ modelValue: '21:30', locale: 'es', hourCycle: 'h12' })).element.value).toMatch(/^9:30\s?p\.\s?m\.$/)
    expect(field(mk({ modelValue: '21:30', locale: 'es-MX', hourCycle: 'h23' })).element.value).toBe('21:30')
    const w = mk({ modelValue: '21:30', locale: 'es-MX' })
    expect(root(w).classes()).toContain('g-time-field--h12')
  })

  it('idioma del ancestro más cercano (lang) y del documento sin locale', async () => {
    const w = host('<div lang="es-MX"><GTimeField label="Hora" :labels="labels" model-value="21:30" /></div>', () => ({ labels: INVALID }))
    await nextTick()
    expect(field(w).element.value).toMatch(/^9:30\s?p\.\s?m\.$/)
  })
})

describe('GTimeField · modelo y eventos', () => {
  it('«930» emite 09:00, null y 09:30 (cada cambio de valor); no reformatea mientras se escribe', async () => {
    const w = mk()
    await typeChars(w, '930')
    expect(models(w)).toEqual(['09:00', null, '09:30'])
    expect(field(w).element.value).toBe('930')
    await field(w).trigger('blur')
    expect(field(w).element.value).toBe('9:30')
    expect(models(w)).toEqual(['09:00', null, '09:30']) // reformatear no emite
    expect(changes(w)).toEqual(['09:30'])
  })

  it('el modelo siempre es String o null (nunca Date ni número)', async () => {
    const w = mk()
    for (const t of ['9', '2130', '9 noche', 'xx', '', '12a', '24']) await typeText(w, t)
    expect(models(w).every((v) => v === null || (typeof v === 'string' && /^\d\d:\d\d$/.test(v)))).toBe(true)
  })

  it('formatos inválidos → null con aviso; segundos sin seconds se ignoran con aviso (sin emitir)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    for (const v of ['9:30', '24:00', '21:30:00Z']) {
      const w = mk({ modelValue: v })
      expect(field(w).element.value).toBe('')
    }
    expect(warn.mock.calls.some((c) => /\[Grana GTimeField\] modelValue/.test(c[0]))).toBe(true)
    warn.mockClear()
    const s = mk({ modelValue: '14:05:30', name: 'h' })
    expect(field(s).element.value).toBe('14:05')
    expect(hidden(s).element.value).toBe('14:05')
    expect(models(s)).toEqual([])
    expect(warn.mock.calls.some((c) => /segundos/.test(c[0]))).toBe(true)
  })

  it('undefined y "" = null sin aviso', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mk({ modelValue: undefined })
    mk({ modelValue: '' })
    expect(warn.mock.calls.filter((c) => /modelValue/.test(c[0]))).toEqual([])
  })

  it('change: salir sin cambios no emite; un cambio desde la aplicación no emite ni lo hace la salida siguiente', async () => {
    const w = mk({ modelValue: '09:00' })
    await field(w).trigger('focus')
    await field(w).trigger('blur')
    expect(changes(w)).toEqual([])
    await w.setProps({ modelValue: '10:00' })
    expect(field(w).element.value).toBe('10:00')
    await field(w).trigger('focus')
    await field(w).trigger('blur')
    expect(changes(w)).toEqual([])
    expect(models(w)).toEqual([])
  })

  it('cambio desde la aplicación que coincide con lo escrito no toca el texto', async () => {
    const w = mk()
    await field(w).trigger('focus')
    await typeText(w, '930')
    await w.setProps({ modelValue: '09:30' })
    expect(field(w).element.value).toBe('930')
  })

  it('el @change del consumidor recibe la hora y no llega al change nativo', async () => {
    const onChange = vi.fn()
    const w = mk({ onChange })
    await typeText(w, '21')
    await field(w).trigger('change')
    expect(onChange).not.toHaveBeenCalled()
    await field(w).trigger('blur')
    expect(onChange.mock.calls).toEqual([['21:00']])
  })

  it('manejadores propios primero: la escucha @input del consumidor ve el modelo ya emitido', async () => {
    const seen = []
    const w = host('<GTimeField label="Hora" locale="es" :labels="labels" v-model="v" @input="seen.push(v)" />', () => {
      const v = ref(null)
      return { v, seen, labels: INVALID }
    })
    await typeText(w, '21')
    expect(seen).toEqual(['21:00'])
  })

  it('Enter confirma (formatea, change) y deja seguir el envío', async () => {
    const w = mk()
    await typeText(w, '2130')
    const e = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    field(w).element.dispatchEvent(e)
    await nextTick()
    expect(e.defaultPrevented).toBe(false)
    expect(field(w).element.value).toBe('21:30')
    expect(changes(w)).toEqual(['21:30'])
  })
})

describe('GTimeField · escritura', () => {
  it('filtro: lo que no entra se quita conservando el cursor', async () => {
    const w = mk()
    const el = field(w).element
    el.value = '9x30'
    el.setSelectionRange(2, 2)
    await field(w).trigger('input')
    expect(el.value).toBe('930')
    expect(el.selectionStart).toBe(1)
  })

  it('palabras, marcadores, ISO, 24, sin interpretar (se conserva al salir)', async () => {
    const w = mk()
    const cases = [['9 noche', '21:00', '21:00'], ['7 de la tarde', '19:00', '19:00'], ['mediodía', '12:00', '12:00'], ['9.30p', '21:30', '21:30'], ['24', '00:00', '0:00'], ['9h30', '09:30', '9:30']]
    for (const [t, m, shown] of cases) {
      await field(w).trigger('focus')
      await typeText(w, t)
      await field(w).trigger('blur')
      expect([models(w).at(-1), field(w).element.value]).toEqual([m, shown])
    }
    await field(w).trigger('focus')
    await typeText(w, '99:99')
    await field(w).trigger('blur')
    expect(field(w).element.value).toBe('99:99')
    expect(models(w).at(-1)).toBe(null)
    await typeText(w, '9:3')
    expect(models(w).at(-1)).toBe(null)
  })

  it('pegar una hora (ISO) sustituye y formatea; un pegado que no es hora sigue su curso', async () => {
    const w = mk()
    const paste = (txt) => {
      const e = new Event('paste', { bubbles: true, cancelable: true })
      e.clipboardData = { getData: () => txt }
      field(w).element.dispatchEvent(e)
      return e
    }
    await field(w).trigger('focus')
    const e = paste('2026-10-06T14:05')
    await nextTick()
    expect(e.defaultPrevented).toBe(true)
    expect(field(w).element.value).toBe('14:05')
    expect(models(w).at(-1)).toBe('14:05')
    expect(paste('hola').defaultPrevented).toBe(false)
  })

  it('composición (IME): no se filtra durante isComposing; se aplica en compositionend', async () => {
    const w = mk()
    const el = field(w).element
    await field(w).trigger('compositionstart')
    el.value = '오후 9'
    await field(w).trigger('input')
    expect(models(w)).toEqual([])
    await field(w).trigger('compositionend')
    expect(models(w).at(-1)).toBe('09:00')
  })

  it('12 h: 1–12 sin marcador sigue la última hora vista; sin pista, la mañana (12 = mediodía)', async () => {
    const w = mk({ locale: 'es-MX', modelValue: '21:00' })
    await field(w).trigger('focus')
    await typeText(w, '9')
    expect(models(w)).toEqual([]) // «9» con la última hora de la noche = 21:00, la que ya había
    expect(field(w).element.value).toBe('9')
    expect(w.vm.$el.querySelector('.g-time-field__half.is-on').dataset.half).toBe('pm')
    const v = mk({ locale: 'es-MX' })
    await typeText(v, '9')
    expect(models(v).at(-1)).toBe('09:00')
    await typeText(v, '12')
    expect(models(v).at(-1)).toBe('12:00')
    await typeText(v, '2130')
    expect(models(v).at(-1)).toBe('21:30')
  })
})

describe('GTimeField · teclado y pasos (#405)', () => {
  it('↑/↓ encajan en la rejilla desde min; Mayús/Re Pág = 1 hora; el cursor al final; notifyInput (dirty sin revelar)', async () => {
    const w = mk({ modelValue: '09:07', step: 15, min: '08:00', max: '18:00' })
    await field(w).trigger('focus')
    await key(w, 'ArrowUp')
    expect(models(w).at(-1)).toBe('09:15')
    await key(w, 'ArrowDown')
    expect(models(w).at(-1)).toBe('09:00')
    await key(w, 'ArrowUp', { shiftKey: true })
    expect(models(w).at(-1)).toBe('10:00')
    await key(w, 'PageDown')
    expect(models(w).at(-1)).toBe('09:00')
    expect(field(w).element.selectionStart).toBe(field(w).element.value.length)
  })

  it('en el máximo no cambia; sin límites da la vuelta; arco 22:00–06:00', async () => {
    const a = mk({ modelValue: '18:00', step: 15, min: '08:00', max: '18:00' })
    await key(a, 'ArrowUp')
    expect(models(a)).toEqual([])
    const b = mk({ modelValue: '23:45', step: 15 })
    await key(b, 'ArrowUp')
    expect(models(b).at(-1)).toBe('00:00')
    const c = mk({ modelValue: '23:30', step: 30, min: '22:00', max: '06:00' })
    await key(c, 'ArrowUp')
    expect(models(c).at(-1)).toBe('00:00')
    await c.setProps({ modelValue: '05:30' })
    await key(c, 'ArrowUp')
    await key(c, 'ArrowUp')
    expect(models(c).at(-1)).toBe('06:00')
    await c.setProps({ modelValue: '12:00' })
    await key(c, 'ArrowUp')
    expect(models(c).at(-1)).toBe('22:00')
  })

  it('vacío + ↑: min; sin min, la hora del dispositivo redondeada hacia arriba', async () => {
    const a = mk({ min: '08:00', step: 15 })
    await key(a, 'ArrowUp')
    expect(models(a)).toEqual(['08:00'])
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 6, 10, 32, 10))
    const b = mk({ step: 15 })
    await key(b, 'ArrowDown')
    expect(models(b)).toEqual(['10:45'])
  })

  it('change una vez por gesto (autorrepetición → uno al keyup); Alt/Ctrl/Meta y la rueda no hacen nada', async () => {
    const w = mk({ modelValue: '09:00' })
    await field(w).trigger('focus')
    await key(w, 'ArrowUp')
    await key(w, 'ArrowUp', { repeat: true })
    await key(w, 'ArrowUp', { repeat: true })
    expect(changes(w)).toEqual([])
    await keyup(w, 'ArrowUp')
    expect(changes(w)).toEqual(['09:03'])
    await field(w).trigger('blur')
    expect(changes(w)).toEqual(['09:03'])
    for (const m of ['altKey', 'ctrlKey', 'metaKey']) await key(w, 'ArrowUp', { [m]: true })
    await field(w).trigger('wheel', { deltaY: -100 })
    expect(models(w).at(-1)).toBe('09:03')
  })

  it('solo lectura: sin pasos', async () => {
    const w = mk({ modelValue: '07:45', readonly: true })
    await key(w, 'ArrowUp')
    expect(models(w)).toEqual([])
  })

  it('12 h: «a»/«p» con la hora escrita entera cambian la mitad en vez de insertarse', async () => {
    const w = mk({ locale: 'es-MX', modelValue: '21:30' })
    await field(w).trigger('focus')
    const e = new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true })
    field(w).element.dispatchEvent(e)
    await nextTick()
    expect(e.defaultPrevented).toBe(true)
    expect(models(w).at(-1)).toBe('09:30')
    // escribiendo («930»): «a» se inserta
    await typeText(w, '930')
    const f = new KeyboardEvent('keydown', { key: 'p', bubbles: true, cancelable: true })
    field(w).element.dispatchEvent(f)
    expect(f.defaultPrevented).toBe(false)
  })
})

describe('GTimeField · 12 h: a. m./p. m. (#406)', () => {
  it('solo en 12 h; ausentes en solo lectura; fuera del Tab, aria-pressed, aria-controls, nombre texto + etiqueta', () => {
    expect(mk({ modelValue: '21:30' }).find('.g-time-field__halves').exists()).toBe(false)
    expect(mk({ locale: 'es-MX', readonly: true, modelValue: '21:30' }).find('.g-time-field__halves').exists()).toBe(false)
    const w = mk({ locale: 'es-MX', modelValue: '21:30', id: 't' })
    const pm = halfBtn(w, 'pm')
    expect(pm.attributes()).toMatchObject({ type: 'button', tabindex: '-1', 'aria-pressed': 'true', 'aria-controls': 't', 'aria-labelledby': 't-pm t-label' })
    expect(pm.classes()).toContain('is-on')
    expect(halfBtn(w, 'am').attributes('aria-pressed')).toBe('false')
    expect(w.find('#t-pm').text()).toMatch(/^p\.\s?m\.$/)
    expect(w.find('#t-am').classes()).toContain('g-time-field__half-text')
  })

  it('nombre sin etiqueta visible: aria-labelledby o aria-label del consumidor', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const a = mk({ label: undefined, locale: 'es-MX', id: 't' }, { attrs: { 'aria-labelledby': 'ext' } })
    expect(halfBtn(a, 'am').attributes('aria-labelledby')).toBe('t-am ext')
    const b = mk({ label: undefined, locale: 'es-MX', id: 'u' }, { attrs: { 'aria-label': 'Hora de la toma' } })
    expect(halfBtn(b, 'pm').attributes('aria-label')).toMatch(/^p\.\s?m\. Hora de la toma$/)
  })

  it('pointerdown (botón 0) cambia la mitad con preventDefault y sin foco; su click no repite; un change por activación', async () => {
    const w = mk({ locale: 'es-MX', modelValue: '09:30' })
    const r = pointer(halfBtn(w, 'pm').element, 'pointerdown', { button: 2 }) // otro botón: nada
    await nextTick()
    expect(r.defaultPrevented).toBe(false)
    expect(models(w)).toEqual([])
    // Hallazgo 4 (WebKit táctil): con preventDefault en pointerdown no llega click; la acción va al bajar
    const e = pointer(halfBtn(w, 'pm').element, 'pointerdown')
    await nextTick()
    expect(e.defaultPrevented).toBe(true)
    expect(document.activeElement).not.toBe(field(w).element)
    expect(models(w)).toEqual(['21:30'])
    expect(changes(w)).toEqual(['21:30'])
    pointer(halfBtn(w, 'am').element, 'click', { detail: 1 }) // el click del mismo gesto de puntero no actúa
    await nextTick()
    expect(models(w)).toEqual(['21:30'])
    await halfBtn(w, 'pm').trigger('click')
    expect(changes(w)).toEqual(['21:30'])
    halfBtn(w, 'am').element.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 })) // sin puntero: misma acción
    await nextTick()
    expect(changes(w)).toEqual(['21:30', '09:30'])
  })

  it('sin valor: el pulsado fija la mitad de la próxima hora y se ve pulsado hasta escribir o vaciar', async () => {
    const w = mk({ locale: 'es-MX' })
    expect(w.findAll('.g-time-field__half.is-on').length).toBe(0)
    await halfBtn(w, 'pm').trigger('click')
    expect(halfBtn(w, 'pm').attributes('aria-pressed')).toBe('true')
    expect(models(w)).toEqual([])
    await typeText(w, '9')
    expect(models(w)).toEqual(['21:00'])
    await typeText(w, '')
    expect(halfBtn(w, 'pm').attributes('aria-pressed')).toBe('false')
  })

  it('deshabilitado: botones disabled', () => {
    const w = mk({ locale: 'es-MX', disabled: true, modelValue: '09:00' })
    expect(halfBtn(w, 'am').attributes('disabled')).toBeDefined()
  })
})

describe('GTimeField · A «La hora dicha» (#407)', () => {
  it('lectura en palabras con valor (aria-hidden), sin ella vacío; no se pinta si la franja ya está en el texto', async () => {
    const w = mk({ modelValue: '21:30' })
    await nextTick()
    const r = w.find('.g-time-field__reading')
    expect(r.attributes('aria-hidden')).toBe('true')
    expect(r.find('.g-time-field__reading-word').text()).toBe('de la noche')
    expect(r.find('.g-time-field__reading-time').exists()).toBe(false)
    await w.setProps({ modelValue: null })
    expect(w.find('.g-time-field__reading').exists()).toBe(false)
    // también en solo lectura y deshabilitado
    const ro = mk({ modelValue: '09:00', readonly: true })
    const di = mk({ modelValue: '09:00', disabled: true })
    await nextTick()
    expect(ro.find('.g-time-field__reading').exists()).toBe(true)
    expect(di.find('.g-time-field__reading').exists()).toBe(true)
    // zh-CN 12 h ya escribe la mitad del día con su palabra («下午» / «晚上»): sin lectura si coincide
    const z = mk({ modelValue: '21:30', locale: 'zh-CN', hourCycle: 'h12' })
    const word = z.find('.g-time-field__reading-word')
    if (word.exists()) expect(field(z).element.value.includes(word.text())).toBe(false)
  })

  it('reading-time solo mientras lo escrito no es la forma final', async () => {
    const w = mk()
    await field(w).trigger('focus')
    await typeText(w, '2130')
    expect(w.find('.g-time-field__reading-time').text()).toBe('21:30')
    await typeText(w, '21:30')
    expect(w.find('.g-time-field__reading-time').exists()).toBe(false)
  })

  it('24 h: «9» con foco ofrece las dos lecturas (la tomada pulsada); un toque fija la otra, formatea y las quita', async () => {
    const w = mk({ id: 't' })
    await field(w).trigger('focus')
    await typeText(w, '9')
    expect(root(w).classes()).toContain('has-choices')
    expect(w.find('.g-time-field__reading').exists()).toBe(false)
    const bs = choiceBtns(w)
    expect(bs.map((b) => [b.attributes('aria-pressed'), b.attributes('tabindex'), b.attributes('aria-controls')])).toEqual([['true', '-1', 't'], ['false', '-1', 't']])
    expect(bs[1].attributes('aria-labelledby')).toBe('t-choice-1 t-label')
    expect(w.find('#t-choice-1').text().replace(/\s+/g, ' ')).toBe('21:00 de la noche')
    expect(bs[0].classes()).toContain('is-on')
    const e = pointer(bs[1].element, 'pointerdown') // actúa al bajar (WebKit táctil no entrega el click)
    expect(e.defaultPrevented).toBe(true)
    pointer(bs[1].element, 'click', { detail: 1 }) // su click no repite
    await nextTick()
    expect(models(w).at(-1)).toBe('21:00')
    expect(changes(w)).toEqual(['21:00'])
    expect(field(w).element.value).toBe('21:00')
    expect(choiceBtns(w).length).toBe(0)
    expect(root(w).classes()).not.toContain('has-choices')
  })

  it('las lecturas sin puntero: click con detail 0 fija la lectura; un pointerdown de otro botón no', async () => {
    const w = mk({ id: 't' })
    await field(w).trigger('focus')
    await typeText(w, '9')
    pointer(choiceBtns(w)[1].element, 'pointerdown', { button: 1 })
    await nextTick()
    expect(choiceBtns(w).length).toBe(2)
    choiceBtns(w)[1].element.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }))
    await nextTick()
    expect(models(w).at(-1)).toBe('21:00')
    expect(changes(w)).toEqual(['21:00'])
  })

  it('las lecturas: nunca en 12 h, no con cero delante, se van al salir; no aparecen al entrar en un «9:00» ya formateado', async () => {
    const a = mk({ locale: 'es-MX' })
    await field(a).trigger('focus')
    await typeText(a, '9')
    expect(choiceBtns(a).length).toBe(0)
    const b = mk()
    await field(b).trigger('focus')
    await typeText(b, '09')
    expect(choiceBtns(b).length).toBe(0)
    await typeText(b, '9:30')
    expect(choiceBtns(b).length).toBe(2)
    await field(b).trigger('blur')
    expect(choiceBtns(b).length).toBe(0)
    await field(b).trigger('focus')
    expect(choiceBtns(b).length).toBe(0)
  })

  it('data-compact cuando el par no cabe en la caja', async () => {
    const w = mk()
    const ctl = w.find('.g-input__control').element
    Object.defineProperty(ctl, 'scrollWidth', { configurable: true, get: () => 300 })
    Object.defineProperty(ctl, 'clientWidth', { configurable: true, get: () => 200 })
    await field(w).trigger('focus')
    await typeText(w, '9')
    await nextTick()
    await nextTick()
    expect(w.find('.g-time-field__choices').attributes('data-compact')).toBe('')
    const v = mk()
    await field(v).trigger('focus')
    await typeText(v, '9')
    await nextTick()
    expect(v.find('.g-time-field__choices').attributes('data-compact')).toBeUndefined()
  })

  it('is-entering solo al cambiar la franja con foco (nunca al montar ni desde la aplicación sin foco)', async () => {
    const w = mk({ modelValue: '11:30' })
    await nextTick()
    expect(w.find('.g-time-field__reading-word').classes()).not.toContain('is-entering')
    await w.setProps({ modelValue: '21:00' })
    expect(w.find('.g-time-field__reading-word').classes()).not.toContain('is-entering')
    await field(w).trigger('focus')
    await w.setProps({ modelValue: '11:30' })
    await key(w, 'ArrowUp', { shiftKey: true }) // 12:30 «del mediodía»? 12:30 es «de la tarde» en es
    const word = w.find('.g-time-field__reading-word')
    expect(word.classes()).toContain('is-entering')
    const node = word.element
    await key(w, 'ArrowUp') // 12:31, misma franja: mismo nodo, sin alternar la clase
    expect(w.find('.g-time-field__reading-word').element).toBe(node)
    expect(w.find('.g-time-field__reading-word').classes()).toContain('is-entering')
  })

  it('pulsar el área vacía o la lectura enfoca con el cursor al final; a. m./p. m. y las lecturas quedan fuera', async () => {
    const w = mk({ modelValue: '21:30' })
    await nextTick()
    const e = pointer(w.find('.g-time-field__reading').element, 'pointerdown')
    expect(e.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(field(w).element)
    expect(field(w).element.selectionStart).toBe(field(w).element.value.length)
  })
})

describe('GTimeField · error propio (#409)', () => {
  const formHost = (showErrorsOn = 'blur', extra = '') => {
    const invalids = []
    const submits = []
    const w = host(
      `<GForm :show-errors-on="soe" :labels="labels" :errors="errors" @invalid="invalids.push($event)" @submit="submits.push($event)">${extra}<GTimeField id="t" label="Hora" name="hora" locale="es" :labels="inv" v-model="v" :error="err" /><button id="go" type="submit">Enviar</button></GForm>`,
      () => ({ soe: showErrorsOn, labels: LABELS, errors: ref({}), inv: INVALID, v: ref(null), err: ref(undefined), invalids, submits })
    )
    const submit = async () => {
      w.find('form').element.dispatchEvent(new Event('submit', { cancelable: true }))
      await settle()
    }
    return { w, invalids, submits, submit }
  }

  it('dentro de GForm con blur: visible al salir habiendo editado, aria-invalid, texto conservado', async () => {
    const { w } = formHost()
    await field(w).trigger('focus')
    await typeText(w, '99:99')
    expect(msg(w)).toBe('')
    await field(w).trigger('blur')
    await field(w).trigger('focusout')
    await nextTick()
    expect(msg(w)).toContain('Escribe una hora')
    expect(field(w).attributes('aria-invalid')).toBe('true')
    expect(field(w).element.value).toBe('99:99')
  })

  it('corregir no parpadea: sale al entender y el siguiente espera a otra salida', async () => {
    const { w } = formHost()
    await typeText(w, '99:99')
    await field(w).trigger('focusout')
    await nextTick()
    expect(msg(w)).toContain('Escribe una hora')
    await typeText(w, '9')
    await nextTick()
    await nextTick()
    expect(msg(w)).toBe('')
    await typeText(w, '9:3')
    await nextTick()
    expect(msg(w)).toBe('')
    await typeText(w, '9:30')
    await nextTick()
    expect(msg(w)).toBe('')
    await typeText(w, '')
    await nextTick()
    expect(msg(w)).toBe('')
  })

  it('con showErrorsOn="submit": solo al enviar; bloquea con el foco en el campo; formnovalidate no bloquea', async () => {
    const { w, invalids, submits, submit } = formHost('submit')
    await typeText(w, '99:99')
    await field(w).trigger('focusout')
    await nextTick()
    expect(msg(w)).toBe('')
    await submit()
    expect(invalids[0].errors).toEqual([{ name: 'hora', message: INVALID.invalid, id: 't' }])
    expect(submits).toEqual([])
    expect(msg(w)).toContain('Escribe una hora')
    expect(document.activeElement).toBe(field(w).element)
    await new Promise((r) => setTimeout(r, 40))
    expect(root(w).classes()).toContain('is-rejected')
  })

  it('Enter + envío sin salir del campo: bloquea (el modelo es null, nunca otra hora)', async () => {
    const { w, invalids, submit } = formHost()
    await field(w).trigger('focus')
    await typeText(w, '25')
    await key(w, 'Enter')
    await submit()
    expect(invalids.length).toBe(1)
    expect(msg(w)).toContain('Escribe una hora')
  })

  it('precedencia: prop error › error propio › errors[name]', async () => {
    const { w, submit } = formHost('submit')
    w.vm.$.setupState.errors.hora = 'Fuera del horario'
    await typeText(w, '99:99')
    await submit()
    expect(msg(w)).toContain('Escribe una hora')
    w.vm.$.setupState.err = 'Explícito'
    await nextTick()
    expect(msg(w)).toContain('Explícito')
  })

  it('GErrorSummary enlaza al campo', async () => {
    const { w, submit } = formHost('submit', '<GErrorSummary title="Revisa" />')
    await typeText(w, '99:99')
    await submit()
    expect(w.find('.g-error-summary a').attributes('href')).toBe('#t')
  })

  it('fuera de GForm: visible al salir (o con Enter), setCustomValidity; sale al vaciar', async () => {
    const w = mk({ id: 't' })
    await field(w).trigger('focus')
    await typeText(w, '99:99')
    await nextTick()
    expect(field(w).element.validationMessage).toBe(INVALID.invalid)
    expect(msg(w)).toBe('')
    await field(w).trigger('blur')
    await field(w).trigger('focusout')
    await nextTick()
    expect(msg(w)).toContain('Escribe una hora')
    await typeText(w, '')
    await nextTick()
    await nextTick()
    expect(msg(w)).toBe('')
    expect(field(w).element.validationMessage).toBe('')
    await typeText(w, 'zz9:3')
    await key(w, 'Enter')
    await nextTick()
    expect(msg(w)).toContain('Escribe una hora')
  })

  it('sin labels.invalid: bloquea con un espacio y avisa al montar', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const invalids = []
    const w = host('<GForm show-errors-on="submit" @invalid="invalids.push($event)"><GTimeField label="Hora" name="hora" locale="es" /></GForm>', () => ({ invalids }))
    expect(warn.mock.calls.some((c) => /labels\.invalid/.test(c[0]))).toBe(true)
    await typeText(w, '99:99')
    w.find('form').element.dispatchEvent(new Event('submit', { cancelable: true }))
    await settle()
    expect(invalids[0].errors[0].message).toBe(' ')
  })

  it('sin name: no bloquea el envío de GForm, pero se ve al salir', async () => {
    const submits = []
    const w = host('<GForm @submit="submits.push($event)"><GTimeField label="Hora" locale="es" :labels="inv" /></GForm>', () => ({ submits, inv: INVALID }))
    await typeText(w, '99:99')
    await field(w).trigger('focusout')
    await nextTick()
    expect(msg(w)).toContain('Escribe una hora')
    w.find('form').element.dispatchEvent(new Event('submit', { cancelable: true }))
    await settle()
    expect(submits.length).toBe(1)
  })

  it('cuenta para GForm: escribir y flechas = escritura; a. m./p. m. y lecturas = cambio (dirty, sin revelar)', async () => {
    const dirty = ref(false)
    const w = host('<GForm v-model:dirty="dirty"><GTimeField label="Hora" name="hora" locale="es-MX" :labels="inv" model-value="09:00" /></GForm>', () => ({ dirty, inv: INVALID }))
    await halfBtn(w, 'pm').trigger('click')
    expect(dirty.value).toBe(true)
  })
})

describe('GTimeField · mínimo publicado en una GFormRow (#410)', () => {
  function rowHost(props) {
    const calls = []
    const Row = defineComponent({
      setup(_, { slots }) {
        provide(layoutKey, { block: true, setIntrinsicMin: (el, px) => calls.push([el, px]) })
        return () => slots.default()
      }
    })
    const w = mount(defineComponent({ components: { Row, GTimeField }, setup: () => ({ props }), template: '<Row><GTimeField v-bind="props" /></Row>' }), { attachTo: document.body })
    mounted.push(w)
    return { w, calls }
  }
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

  it('12 h: antes de la celda + texto de referencia + sufijo + a. m./p. m. (copia inerte), también en solo lectura', async () => {
    fakeRects({
      '.g-input__control': [0, 300],
      '.g-time-field__value': [40, 80],
      '.g-input__suffix': [88, 120],
      '.g-time-field__measure > span:first-child': [0, 90],
      '.g-time-field__measure .g-time-field__half': [0, 40]
    })
    const { w, calls } = rowHost({ label: 'Hora', locale: 'es-MX', suffix: 'CDMX', labels: INVALID })
    await settle()
    const meas = w.find('.g-time-field__measure')
    expect(meas.attributes('aria-hidden')).toBe('true')
    expect(meas.findAll('.g-time-field__half').length).toBe(2)
    expect(meas.find('span').text().split('\n').length).toBe(24)
    const [el, px] = calls.at(-1)
    expect(el).toBe(w.find('.g-input').element)
    expect(px).toBe(Math.ceil(40 + 91 + 32 + 80))
    w.unmount()
    mounted.pop()
    expect(calls.at(-1)[1]).toBe(0)
    // en solo lectura (sin botones) el mínimo es el mismo (#266)
    const ro = rowHost({ label: 'Hora', locale: 'es-MX', suffix: 'CDMX', labels: INVALID, readonly: true })
    await settle()
    expect(ro.w.find('.g-time-field__halves').exists()).toBe(false)
    expect(ro.calls.at(-1)[1]).toBe(px)
  })

  it('is-entering: pasar por un texto sin hora y volver a la misma franja no la hace entrar de nuevo', async () => {
    const w = mk({ modelValue: '12:30' })
    await nextTick()
    await field(w).trigger('focus')
    await typeText(w, '12:3')
    await typeText(w, '12:35')
    expect(w.find('.g-time-field__reading-word').classes()).not.toContain('is-entering')
    await typeText(w, '21:35')
    expect(w.find('.g-time-field__reading-word').classes()).toContain('is-entering')
  })

  it('24 h: sin a. m./p. m. (el final de la caja) y sin la lectura en palabras', async () => {
    fakeRects({ '.g-input__control': [0, 300], '.g-time-field__value': [10, 50], '.g-time-field__reading': [50, 150], '.g-time-field__measure > span:first-child': [0, 40] })
    const { w, calls } = rowHost({ label: 'Hora', locale: 'es', modelValue: '21:30', labels: INVALID })
    await settle()
    expect(w.find('.g-time-field__measure .g-time-field__half').exists()).toBe(false)
    expect(calls.at(-1)[1]).toBe(Math.ceil(10 + 41))
  })

  // Fuera de una fila y sin block (#416): el mismo mínimo como suelo de la raíz, --_min-inline + data-fit
  const fitOf = (w) => {
    const r = w.find('.g-input').element
    return { fit: r.hasAttribute('data-fit'), v: r.style.getPropertyValue('--_min-inline') }
  }
  const RECTS12 = {
    '.g-input__control': [0, 300],
    '.g-time-field__value': [40, 80],
    '.g-input__suffix': [88, 120],
    '.g-time-field__measure > span:first-child': [0, 90],
    '.g-time-field__measure .g-time-field__half': [0, 40]
  }

  it('fuera de una fila, sin block: la raíz lleva --_min-inline con el mínimo medido y data-fit; antes de medir, nada', async () => {
    fakeRects(RECTS12)
    const w = mk({ locale: 'es-MX', suffix: 'CDMX' })
    expect(fitOf(w)).toEqual({ fit: false, v: '' }) // primer render: sin medir
    await settle()
    expect(w.find('.g-time-field__measure').exists()).toBe(true)
    expect(fitOf(w)).toEqual({ fit: true, v: `${Math.ceil(40 + 91 + 32 + 80)}px` })
    expect(w.find('input.g-time-field__field').attributes('data-fit')).toBeUndefined() // en la raíz, no en el <input>
  })

  it('con block, con block heredado de un contenedor y dentro de una GFormRow: ni variable ni data-fit', async () => {
    fakeRects(RECTS12)
    const b = mk({ locale: 'es-MX', block: true })
    await settle()
    expect(fitOf(b)).toEqual({ fit: false, v: '' })
    expect(b.find('.g-time-field__measure').exists()).toBe(false)
    const Lay = defineComponent({ setup(_, { slots }) { provide(layoutKey, { block: true }); return () => slots.default() } })
    const l = mount(defineComponent({ components: { Lay, GTimeField }, template: '<Lay><GTimeField label="Hora" locale="es-MX" /></Lay>' }), { attachTo: document.body })
    mounted.push(l)
    await settle()
    expect(fitOf(l)).toEqual({ fit: false, v: '' })
    const { w, calls } = rowHost({ label: 'Hora', locale: 'es-MX', labels: INVALID })
    await settle()
    expect(calls.at(-1)[1]).toBeGreaterThan(0)
    expect(fitOf(w)).toEqual({ fit: false, v: '' })
  })

  it('pasar a block quita las dos; volver las repone', async () => {
    fakeRects(RECTS12)
    const w = mk({ locale: 'es-MX' })
    await settle()
    expect(fitOf(w).fit).toBe(true)
    await w.setProps({ block: true })
    await settle()
    expect(fitOf(w)).toEqual({ fit: false, v: '' })
    await w.setProps({ block: false })
    await settle()
    expect(fitOf(w)).toEqual({ fit: true, v: `${Math.ceil(40 + 91 + 80)}px` })
  })

  it('el style del consumidor se conserva; si define --_min-inline, gana el suyo', async () => {
    fakeRects(RECTS12)
    const a = mk({ locale: 'es-MX' }, { attrs: { style: 'color: red; inline-size: 200px' } })
    await settle()
    const ra = a.find('.g-input').element
    expect([ra.style.color, ra.style.inlineSize, ra.style.getPropertyValue('--_min-inline')]).toEqual(['red', '200px', `${Math.ceil(40 + 91 + 80)}px`])
    const b = mk({ locale: 'es-MX' }, { attrs: { style: { '--_min-inline': '300px', color: 'blue' } } })
    await settle()
    expect(fitOf(b)).toEqual({ fit: true, v: '300px' })
    expect(b.find('.g-input').element.style.color).toBe('blue')
  })

  it('la variable se actualiza con locale, hourCycle y seconds (solo si cambia ≥ 0,5px)', async () => {
    fakeRects({ ...RECTS12, '.g-time-field__measure > span:first-child': (el) => [0, el.textContent.length / 4] })
    const w = mk({ locale: 'es' })
    await settle()
    const px = () => parseFloat(fitOf(w).v)
    const v24 = px()
    expect(v24).toBeGreaterThan(0)
    await w.setProps({ locale: 'es-MX' })
    await settle()
    const v12 = px()
    expect(v12).toBeGreaterThan(v24 + 40) // a. m./p. m. y el texto de 12 h
    await w.setProps({ hourCycle: 'h23' })
    await settle()
    expect(px()).toBeLessThan(v12)
    const h23 = px()
    await w.setProps({ seconds: true })
    await settle()
    expect(px()).toBeGreaterThan(h23)
  })
})

describe('GTimeField · avisos', () => {
  it('1 sin nombre accesible, 5 min/max inválidos, 6 step, 7 locale, 8 type/append/action', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mk({ label: undefined })
    mk({ min: '8:00', max: 'x' })
    mk({ step: 0 })
    mk({ locale: 'xx-!!' })
    mk({}, { attrs: { type: 'time' }, slots: { append: '<b>a</b>' } })
    const text = warn.mock.calls.map((c) => c[0]).join('\n')
    for (const re of [/nombre accesible/, /min «8:00»/, /max «x»/, /step 0/, /locale «xx-!!»/, /type no aplica/, /append y action/]) expect(text).toMatch(re)
    expect(text).not.toMatch(/\[Grana\] <GInput>/)
  })

  it('min > max no avisa (arco)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mk({ min: '22:00', max: '06:00' })
    expect(warn.mock.calls.filter((c) => /min|max/.test(c[0]))).toEqual([])
  })
})

describe('GInput · N4 (error propio del componente que compone)', () => {
  it('sin consumidor: GInput sin cambios (sin error propio)', () => {
    const w = mount(GInput, { props: { label: 'Nombre', modelValue: 'x' } })
    mounted.push(w)
    expect(w.find('.g-input__message').text()).toBe('')
    expect(w.find('input').attributes('aria-invalid')).toBeUndefined()
  })

  it('el error propio no llega a un GInput anidado más abajo (solo el hijo directo lo consume)', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mk({ id: 't' }, { slots: { prepend: () => h(GInput, { label: 'Interno', id: 'inner' }) } })
    await typeText(w, '99:99')
    await field(w).trigger('focusout')
    await nextTick()
    expect(w.find('#t-message').text()).toContain('Escribe una hora')
    expect(w.find('#inner').attributes('aria-invalid')).toBeUndefined()
  })
})
