// GCombobox · design/contracts/combobox.md «Verificación · bruno» (DECISIONS.md #329 a #338)
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, reactive, ref } from 'vue'
import GCombobox from './GCombobox.vue'
import GDialog from '../GDialog/GDialog.vue'
import GForm from '../GForm/GForm.vue'
import GInputGroup from '../GInputGroup/GInputGroup.vue'

const LABELS = {
  clear: 'Limpiar', close: 'Cerrar', loading: 'Buscando…', noResults: 'Sin resultados para «{text}»', minChars: 'Escribe al menos {count} caracteres',
  results: (n) => (n === 1 ? '1 resultado' : `${n} resultados`), partial: '{count} de {total} resultados', more: 'Mostrar más ({shown} de {total})',
  retry: 'Reintentar', useCustom: 'Usar «{text}» como texto libre', custom: 'Texto libre', create: 'Agregar «{text}»…',
  preview: 'Vista previa', previewEmpty: 'Recorre la lista', surfaceTitle: 'Buscar'
}
const DX = [
  { label: 'Endocrinas', options: [
    { value: 'E10.9', code: 'E10.9', label: 'Diabetes mellitus tipo 1', description: 'Endocrinas' },
    { value: 'E11.9', code: 'E11.9', label: 'Diabetes mellitus tipo 2', description: 'Endocrinas' }
  ] },
  { label: 'Circulatorio', options: [
    { value: 'I10', code: 'I10', label: 'Hipertensión esencial', description: 'Circulatorio' },
    { value: 'I20.9', code: 'I20.9', label: 'Angina de pecho', disabled: true }
  ] },
  { value: 'R51', code: 'R51', label: 'Cefalea' }
]
const PEOPLE = [
  { value: 'p1', label: 'María García López', avatar: true, description: 'Exp. 001000 · 22 años', facts: [{ label: 'Exp.', value: '001000' }, { label: 'Edad', value: '22 años' }] },
  { value: 'p2', label: 'María García López', avatar: true, description: 'Exp. 001007 · 5 años', facts: [{ label: 'Exp.', value: '001007' }, { label: 'Edad', value: '5 años' }] },
  { value: 'p3', label: 'Mario Ruiz', description: 'Exp. 001014 · 40 años' }
]
const MANY = Array.from({ length: 120 }, (_, i) => ({ value: i, label: `Insumo ${String(i + 1).padStart(3, '0')}` }))

const mounted = []
let warn
beforeEach(() => {
  // jsdom no implementa showModal/close: se simulan con el mismo contrato (atributo open y evento close)
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () {
    if (!this.hasAttribute('open')) return
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  while (mounted.length) mounted.pop().unmount()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

const flush = async () => { await nextTick(); await nextTick(); await nextTick() }
async function mk(props = {}, opts = {}) {
  const w = mount(GCombobox, { props: { label: 'Diagnóstico', labels: LABELS, options: DX, delay: 0, ...props }, attachTo: document.body, ...opts })
  mounted.push(w)
  await flush()
  return w
}
async function host(template, setup = () => ({}), components = {}) {
  const w = mount(defineComponent({ components: { GCombobox, GDialog, GForm, GInputGroup, ...components }, setup, template }), { attachTo: document.body })
  mounted.push(w)
  await flush()
  return w
}
const field = (w) => w.find('input.g-combobox__field')
const root = (w) => w.find('.g-combobox')
const rows = (w) => w.findAll('[role="option"]')
const rowTexts = (w) => rows(w).map((r) => r.text())
const emitted = (w, name) => (w.emitted(name) || []).map((e) => e[0])
const activeEl = (w) => {
  const id = field(w).attributes('aria-activedescendant')
  return id ? document.getElementById(id) : null
}
const warnings = () => warn.mock.calls.map((c) => String(c[0])).filter((t) => t.startsWith('[Grana GCombobox]'))
async function typeText(w, text, target = field(w)) {
  const el = target.element
  el.focus()
  el.value = text
  el.setSelectionRange(text.length, text.length)
  await target.trigger('input')
  await flush()
}
async function key(w, k, init = {}, target = field(w)) {
  const ev = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init })
  target.element.dispatchEvent(ev)
  await flush()
  return ev
}
// Un movimiento real del puntero sobre una fila: el primer evento solo anota la posición; el segundo activa
const pointerOver = (el) => {
  el.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 5, clientY: 5 }))
  el.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 6, clientY: 6 }))
}
const mobile = (matches = true) => {
  const listeners = []
  const mq = { matches, addEventListener: (_, fn) => listeners.push(fn), removeEventListener: () => {} }
  vi.stubGlobal('matchMedia', () => mq)
  window.matchMedia = () => mq
  return { mq, fire(v) { mq.matches = v; listeners.forEach((fn) => fn({ matches: v })) } }
}

describe('GCombobox · modelo, envío y texto libre (#331)', () => {
  it('sin valor: campo vacío, ocultos vacíos, sin ficha', async () => {
    const w = await mk({ name: 'dx', customName: 'dx_libre', allowCustom: true })
    expect(field(w).element.value).toBe('')
    expect(w.find('input[type="hidden"][name="dx"]').element.value).toBe('')
    expect(w.find('input[type="hidden"][name="dx_libre"]').element.value).toBe('')
    expect(root(w).classes()).not.toContain('is-token')
    expect(w.find('.g-combobox__token').exists()).toBe(false)
  })

  it('opción elegida: etiqueta en el campo, ficha, oculto con String(value)', async () => {
    const w = await mk({ name: 'dx', customName: 'dx_libre', allowCustom: true, modelValue: 'I10' })
    expect(field(w).element.value).toBe('Hipertensión esencial')
    expect(root(w).classes()).toContain('is-token')
    expect(root(w).classes()).not.toContain('is-custom')
    expect(w.find('.g-combobox__token').attributes('aria-hidden')).toBe('true')
    // La ficha del valor es una GSummary inline xs (#356)
    const card = w.find('.g-combobox__token .g-summary')
    expect(card.classes()).toEqual(expect.arrayContaining(['g-summary--layout-inline', 'g-summary--size-xs']))
    expect(card.find('.g-summary__code').text()).toBe('I10')
    expect(card.find('.g-summary__title').text()).toBe('Hipertensión esencial')
    expect(card.find('.g-summary__subtitle').text()).toBe('Circulatorio')
    expect(w.find('input[name="dx"]').element.value).toBe('I10')
    expect(w.find('input[name="dx_libre"]').element.value).toBe('')
  })

  it('texto libre: is-custom, marca labels.custom, oculto de customName con el texto y el de name vacío', async () => {
    const w = await mk({ name: 'dx', customName: 'dx_libre', allowCustom: true, custom: 'Dolor raro' })
    expect(field(w).element.value).toBe('Dolor raro')
    expect(root(w).classes()).toEqual(expect.arrayContaining(['is-token', 'is-custom']))
    // Texto libre: el texto como título, labels.custom como línea secundaria y el lápiz en el hueco inicial
    const card = w.find('.g-combobox__token .g-summary--layout-inline')
    expect(card.find('.g-summary__title').text()).toBe('Dolor raro')
    expect(card.find('.g-summary__subtitle').text()).toBe('Texto libre')
    expect(card.find('.g-summary__lead svg.g-icon').exists()).toBe(true)
    expect(w.find('input[name="dx"]').element.value).toBe('')
    expect(w.find('input[name="dx_libre"]').element.value).toBe('Dolor raro')
  })

  it('orden: update:modelValue → update:custom → change { value, custom, option }; el modelo no cambia de tipo', async () => {
    const seq = []
    const w = await mk({
      allowCustom: true, custom: 'algo', options: [{ value: 7, label: 'Siete' }, { value: 8, label: 'Ocho' }],
      'onUpdate:modelValue': (v) => seq.push(['model', v]), 'onUpdate:custom': (v) => seq.push(['custom', v]), onChange: (e) => seq.push(['change', e])
    })
    await typeText(w, 'sie')
    await key(w, 'Enter')
    expect(seq).toEqual([['model', 7], ['custom', ''], ['change', { value: 7, custom: '', option: { value: 7, label: 'Siete' } }]])
    expect(typeof seq[0][1]).toBe('number')
  })

  it('confirmar un texto libre emite modelValue null y custom String; nunca un String en modelValue', async () => {
    const w = await mk({ allowCustom: true, modelValue: 'I10' })
    await typeText(w, 'I10')
    await field(w).trigger('blur')
    await flush()
    expect(emitted(w, 'update:modelValue')).toEqual([null])
    expect(emitted(w, 'update:custom')).toEqual(['I10'])
    expect(emitted(w, 'change')).toEqual([{ value: null, custom: 'I10', option: null }])
  })

  it('elegir la opción ya elegida cierra sin emitir', async () => {
    const w = await mk({ modelValue: 'I10' })
    await key(w, 'ArrowDown')
    expect(activeEl(w).textContent).toContain('Hipertensión')
    await key(w, 'Enter')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(w.emitted('change')).toBeUndefined()
    expect(field(w).attributes('aria-expanded')).toBe('false')
  })

  it('selectedOption pinta un valor que no está en options; si no coincide, se ignora y avisa', async () => {
    const w = await mk({ filter: false, options: [], modelValue: 'p9', selectedOption: { value: 'p9', label: 'Ana Ruiz', description: 'Exp. 9' } })
    expect(field(w).element.value).toBe('Ana Ruiz')
    expect(w.find('.g-combobox__token .g-summary__subtitle').text()).toBe('Exp. 9')
    const w2 = await mk({ filter: false, options: [], modelValue: 'p9', selectedOption: { value: 'otro', label: 'Otro' }, name: 'pac' })
    expect(field(w2).element.value).toBe('')
    expect(w2.find('input[name="pac"]').element.value).toBe('p9') // se envía igual
    expect(warnings().some((t) => t.includes('selectedOption.value no es modelValue'))).toBe(true)
    expect(warnings().some((t) => t.includes('no corresponde a ninguna opción conocida'))).toBe(true)
  })

  it('recuerda la opción elegida aunque deje de estar en options (búsqueda remota)', async () => {
    const w = await mk({ filter: false, options: PEOPLE, modelValue: null })
    await key(w, 'ArrowDown')
    await key(w, 'Enter')
    expect(emitted(w, 'update:modelValue')).toEqual(['p1'])
    await w.setProps({ modelValue: 'p1', options: [] })
    await flush()
    expect(field(w).element.value).toBe('María García López')
    expect(root(w).classes()).toContain('is-token')
  })

  it('modelValue y custom a la vez: gana modelValue y avisa; custom sin allowCustom se ignora y avisa', async () => {
    const w = await mk({ allowCustom: true, modelValue: 'I10', custom: 'libre', customName: 'c' })
    expect(field(w).element.value).toBe('Hipertensión esencial')
    expect(w.find('input[name="c"]').element.value).toBe('')
    expect(warnings().some((t) => t.includes('gana modelValue'))).toBe(true)
    const w2 = await mk({ custom: 'libre' })
    expect(field(w2).element.value).toBe('')
    expect(warnings().some((t) => t.includes('custom tiene valor sin allowCustom'))).toBe(true)
  })

  it('pinta las props: si la aplicación no acepta el cambio, el campo vuelve al valor de antes', async () => {
    const w = await mk({ modelValue: 'I10' })
    await typeText(w, 'cefa')
    await key(w, 'Enter')
    expect(emitted(w, 'update:modelValue')).toEqual(['R51'])
    await flush()
    expect(field(w).element.value).toBe('Hipertensión esencial') // la prop no cambió
  })
})

describe('GCombobox · datos sin fetch (#332)', () => {
  it('antirrebote: una emisión por pausa, con el texto recortado; delay 0 lo desactiva', async () => {
    vi.useFakeTimers()
    const w = await mk({ delay: 250, filter: false, options: [] })
    await typeText(w, 'm')
    await typeText(w, 'ma')
    await typeText(w, 'mar ')
    expect(w.emitted('search')).toBeUndefined()
    vi.advanceTimersByTime(249)
    expect(w.emitted('search')).toBeUndefined()
    vi.advanceTimersByTime(1)
    expect(emitted(w, 'search')).toEqual(['mar'])
    const w2 = await mk({ delay: 0, filter: false, options: [] })
    await typeText(w2, 'm')
    await typeText(w2, 'ma')
    expect(emitted(w2, 'search')).toEqual(['m', 'ma'])
  })

  it('con filtro local también emite search al escribir (informativo) y no al abrir', async () => {
    vi.useFakeTimers()
    const w = await mk({ delay: 250 })
    await key(w, 'ArrowDown')
    expect(w.emitted('search')).toBeUndefined()
    await typeText(w, 'dia')
    expect(rows(w).length).toBe(2) // el filtrado es inmediato
    vi.advanceTimersByTime(250)
    expect(emitted(w, 'search')).toEqual(['dia'])
  })

  it('abrir emite search(\'\') sin esperar solo con filter: false', async () => {
    vi.useFakeTimers()
    const w = await mk({ delay: 250, filter: false, options: [] })
    await key(w, 'ArrowDown')
    expect(emitted(w, 'search')).toEqual([''])
  })

  it('minChars: con menos caracteres no emite ni pinta lista; muestra la pista', async () => {
    const w = await mk({ filter: false, minChars: 2, options: PEOPLE })
    await typeText(w, 'm')
    expect(w.emitted('search')).toBeUndefined()
    expect(rows(w).length).toBe(0)
    expect(w.find('.g-combobox__status--hint').text()).toBe('Escribe al menos 2 caracteres')
    expect(w.find('[role="listbox"]').attributes('hidden')).toBeDefined()
    await typeText(w, 'ma')
    expect(emitted(w, 'search')).toEqual(['ma'])
  })

  it('filtro local: todas las palabras, sin acentos ni mayúsculas, sobre label, code, description y facts', async () => {
    const w = await mk({ options: [...DX, ...PEOPLE] })
    await typeText(w, 'HIPERTENSION')
    expect(rowTexts(w)).toEqual(['I10 Hipertensión esencial; Circulatorio;'])
    await typeText(w, 'e11')
    expect(rows(w).length).toBe(1)
    await typeText(w, 'tipo diabetes 2')
    expect(rows(w).length).toBe(1)
    await typeText(w, 'endocrinas')
    expect(rows(w).length).toBe(2)
    await typeText(w, '001007')
    expect(rows(w).length).toBe(1)
    expect(rows(w)[0].text()).toContain('5 años')
  })

  it('filter función sustituye la regla (query recortado); filter false pinta lo que llega', async () => {
    const fn = vi.fn((o, q) => o.label.endsWith(q))
    const w = await mk({ filter: fn })
    await typeText(w, ' 2 ')
    expect(fn).toHaveBeenCalledWith(expect.objectContaining({ value: 'E10.9' }), '2')
    expect(rowTexts(w)).toEqual(['E11.9 Diabetes mellitus tipo 2; Endocrinas;'])
    const w2 = await mk({ filter: false })
    await typeText(w2, 'zzz')
    expect(rows(w2).length).toBe(5)
  })

  it('limit y «Mostrar más» local: tope, fila de acción y activa en la primera nueva', async () => {
    const w = await mk({ options: MANY, limit: 50 })
    await key(w, 'ArrowDown')
    expect(w.findAll('.g-combobox__option:not(.g-combobox__action)').length).toBe(50)
    const more = w.find('.g-combobox__action--more')
    expect(more.text()).toBe('Mostrar más (50 de 120)')
    expect(more.attributes('aria-selected')).toBe('false')
    expect(more.element.parentElement.getAttribute('role')).toBe('listbox')
    await key(w, 'ArrowUp') // no cicla: sigue en la primera
    expect(activeEl(w).textContent.trim()).toBe('Insumo 001;')
    await key(w, 'PageDown', {}, field(w))
    for (let i = 0; i < 5; i++) await key(w, 'PageDown')
    expect(activeEl(w).className).toContain('g-combobox__action--more')
    await key(w, 'ArrowDown') // no cicla: sigue en la última
    expect(activeEl(w).className).toContain('g-combobox__action--more')
    await key(w, 'Enter')
    expect(w.findAll('.g-combobox__option:not(.g-combobox__action)').length).toBe(100)
    expect(field(w).attributes('aria-expanded')).toBe('true')
    expect(activeEl(w).textContent.trim()).toBe('Insumo 051;')
    expect(w.emitted('more')).toBeUndefined()
  })

  it('«Mostrar más» con filter: false emite more con el texto; al llegar, la activa es la primera nueva', async () => {
    const w = await mk({ filter: false, options: PEOPLE.slice(0, 2), total: 3 })
    await typeText(w, 'mar')
    await w.setProps({ loading: true })
    await w.setProps({ loading: false })
    await flush()
    expect(w.find('.g-combobox__action--more').text()).toBe('Mostrar más (2 de 3)')
    await key(w, 'ArrowUp')
    await key(w, 'ArrowUp')
    await key(w, 'ArrowDown')
    await key(w, 'ArrowDown')
    await key(w, 'Enter')
    expect(emitted(w, 'more')).toEqual(['mar'])
    await w.setProps({ loading: true })
    await w.setProps({ loading: false, options: PEOPLE })
    await flush()
    expect(activeEl(w).textContent).toContain('Mario Ruiz')
    expect(w.find('.g-combobox__action--more').exists()).toBe(false)
  })

  it('total: aviso con filtro local y si es menor que las opciones entregadas', async () => {
    await mk({ total: 10 })
    expect(warnings().some((t) => t.includes('total solo cuenta con filter: false'))).toBe(true)
    await mk({ filter: false, total: 1 })
    expect(warnings().some((t) => t.includes('es menor que las opciones entregadas'))).toBe(true)
  })

  it('loading no vacía la lista y pone aria-busy; «Buscando…» solo sin opciones previas', async () => {
    const w = await mk({ filter: false, options: PEOPLE })
    await typeText(w, 'mar')
    await w.setProps({ loading: true })
    expect(rows(w).length).toBe(3)
    expect(w.find('[role="listbox"]').attributes('aria-busy')).toBe('true')
    expect(w.find('.g-combobox__status').exists()).toBe(false)
    await w.setProps({ options: [] })
    expect(w.find('.g-combobox__status--loading').text()).toBe('Buscando…')
    await w.setProps({ loading: false })
    await flush()
    expect(w.find('[role="listbox"]').attributes('aria-busy')).toBeUndefined()
    expect(w.find('.g-combobox__status--empty').text()).toBe('Sin resultados para «mar»')
  })

  it('loadError: en el panel, fuera del listbox, con fila «Reintentar» (sustituye a «Mostrar más»), opciones previas y sin marcar inválido', async () => {
    const w = await mk({ filter: false, options: PEOPLE.slice(0, 2), total: 9 })
    await typeText(w, 'mar')
    await w.setProps({ loadError: 'No se pudo cargar.' })
    await flush()
    const st = w.find('.g-combobox__status--error')
    expect(st.text()).toBe('No se pudo cargar.')
    expect(st.element.closest('[role="listbox"]')).toBeNull()
    expect(rows(w).length).toBe(3)
    expect(w.find('.g-combobox__action--more').exists()).toBe(false)
    expect(root(w).classes()).not.toContain('is-invalid')
    expect(field(w).attributes('aria-invalid')).toBeUndefined()
    const before = emitted(w, 'search').length
    await w.find('.g-combobox__action--retry').trigger('click')
    expect(emitted(w, 'search').slice(before)).toEqual(['mar'])
    expect(field(w).attributes('aria-expanded')).toBe('true')
  })

  it('slots empty y load-error sustituyen al texto del estado', async () => {
    const w = await mk({ filter: false, options: [] }, { slots: { empty: ({ query }) => h('b', `nada:${query}`), 'load-error': ({ message, query }) => h('i', `${message}|${query}`) } })
    await typeText(w, 'zz')
    await w.setProps({ options: [{ value: 1, label: 'x' }] })
    await w.setProps({ options: [] })
    await flush()
    expect(w.find('.g-combobox__status--empty b').text()).toBe('nada:zz')
    await w.setProps({ loadError: 'falló' })
    expect(w.find('.g-combobox__status--error i').text()).toBe('falló|zz')
    expect(w.find('.g-combobox__action--retry').exists()).toBe(true)
  })

  it('antes de escribir sin opciones ni estado no hay panel: aria-expanded sigue en false e is-empty', async () => {
    const w = await mk({ options: [] })
    await key(w, 'ArrowDown')
    expect(field(w).attributes('aria-expanded')).toBe('false')
    expect(root(w).classes()).not.toContain('is-open')
    expect(w.find('.g-combobox__popup').classes()).toContain('is-empty')
    expect(w.emitted('open')).toBeUndefined()
  })
})

describe('GCombobox · pendiente y resultados obsoletos (#332, #333)', () => {
  it('durante el antirrebote: Intro no elige la resaltada sola de la búsqueda anterior', async () => {
    vi.useFakeTimers()
    const w = await mk({ delay: 250, filter: false, options: PEOPLE })
    await typeText(w, 'mar')
    vi.advanceTimersByTime(250)
    await w.setProps({ loading: true })
    await w.setProps({ loading: false })
    await flush()
    expect(activeEl(w).textContent).toContain('María')
    await typeText(w, 'mari') // nueva búsqueda: antirrebote en curso
    expect(field(w).attributes('aria-activedescendant')).toBeUndefined()
    const ev = await key(w, 'Enter')
    expect(ev.defaultPrevented).toBe(true) // no envía el formulario
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(field(w).attributes('aria-expanded')).toBe('true')
  })

  it('entre emitir search y la respuesta de la aplicación: sigue pendiente, Intro no elige y avisa (7)', async () => {
    const w = await mk({ filter: false, options: PEOPLE })
    await typeText(w, 'mar') // delay 0: emite ya; la aplicación no responde
    expect(emitted(w, 'search')).toEqual(['mar'])
    expect(w.find('[role="listbox"]').attributes('aria-busy')).toBe('true')
    await key(w, 'Enter')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(warnings().some((t) => t.includes('la aplicación no respondió en el siguiente ciclo'))).toBe(true)
    // La aplicación responde cambiando options (sin loading): se asienta y la primera queda activa sola
    await w.setProps({ options: PEOPLE.slice() })
    await flush()
    expect(w.find('[role="listbox"]').attributes('aria-busy')).toBeUndefined()
    expect(activeEl(w).textContent).toContain('María')
    await key(w, 'Enter')
    expect(emitted(w, 'update:modelValue')).toEqual(['p1'])
  })

  it('con loading en el mismo manejador no hay aviso; mientras carga, Intro no elige la resaltada sola', async () => {
    const st = reactive({ v: null, loading: false, options: PEOPLE })
    const w = await host('<GCombobox id="c" label="P" v-model="st.v" :filter="false" :delay="0" :labels="L" :options="st.options" :loading="st.loading" @search="st.loading = true" />', () => ({ st, L: LABELS }))
    await typeText(w, 'mar')
    expect(warnings().some((t) => t.includes('no respondió'))).toBe(false)
    await key(w, 'Enter')
    expect(st.v).toBe(null)
    st.loading = false
    await flush()
    await key(w, 'Enter')
    expect(st.v).toBe('p1')
  })

  it('una opción activada por la persona (flechas, puntero) sí se elige con Intro aunque haya búsqueda pendiente', async () => {
    const w = await mk({ filter: false, options: PEOPLE })
    await typeText(w, 'mar')
    await key(w, 'ArrowDown')
    await key(w, 'ArrowDown')
    await key(w, 'Enter')
    expect(emitted(w, 'update:modelValue')).toEqual(['p2'])
    const w2 = await mk({ filter: false, options: PEOPLE })
    await typeText(w2, 'mar')
    const li = rows(w2)[2].element
    pointerOver(li)
    await flush()
    await key(w2, 'Enter')
    expect(emitted(w2, 'update:modelValue')).toEqual(['p3'])
  })

  it('la activa que puso la persona se respeta al asentarse si sigue a la vista', async () => {
    const w = await mk({ filter: false, options: PEOPLE })
    await typeText(w, 'mar')
    await key(w, 'ArrowDown')
    await key(w, 'ArrowDown')
    await w.setProps({ loading: true })
    await w.setProps({ loading: false, options: PEOPLE.slice() })
    await flush()
    expect(activeEl(w).textContent).toContain('001007')
  })
})

describe('GCombobox · teclado (#333)', () => {
  it('enfocar no abre; ↓ abre y activa la elegida o la primera; ↑ la última; Alt+↓ sin activa; Alt+↑ cierra', async () => {
    const w = await mk()
    field(w).element.focus()
    await flush()
    expect(field(w).attributes('aria-expanded')).toBe('false')
    await key(w, 'ArrowDown')
    expect(field(w).attributes('aria-expanded')).toBe('true')
    expect(root(w).classes()).toContain('is-open')
    expect(activeEl(w).textContent).toContain('tipo 1')
    await key(w, 'ArrowUp', { altKey: true })
    expect(field(w).attributes('aria-expanded')).toBe('false')
    await key(w, 'ArrowUp')
    expect(activeEl(w).textContent).toContain('Cefalea')
    await key(w, 'Escape')
    await key(w, 'ArrowDown', { altKey: true })
    expect(field(w).attributes('aria-expanded')).toBe('true')
    expect(field(w).attributes('aria-activedescendant')).toBeUndefined()
    expect(emitted(w, 'open').length).toBe(3)
    expect(emitted(w, 'close').length).toBe(2)
  })

  it('↓ ↑ saltan encabezados y deshabilitadas, no ciclan; las opciones no tienen tabindex', async () => {
    const w = await mk()
    await key(w, 'ArrowDown')
    const seen = []
    for (let i = 0; i < 6; i++) { seen.push(activeEl(w).id.split('-opt-')[1]); await key(w, 'ArrowDown') }
    expect(seen).toEqual(['0', '1', '2', '4', '4', '4']) // la 3 está deshabilitada
    expect(w.find('[aria-disabled="true"]').text()).toContain('Angina')
    expect(w.findAll('[role="option"][tabindex]').length).toBe(0)
    const groups = w.findAll('[role="group"]')
    expect(groups.length).toBe(2)
    expect(document.getElementById(groups[0].attributes('aria-labelledby')).textContent).toBe('Endocrinas')
    expect(groups[0].element.parentElement.getAttribute('role')).toBe('presentation')
  })

  it('Intro: elige la activa y cierra; sin activa no hace nada y no envía; cerrada es nativa', async () => {
    const w = await mk()
    const closed = await key(w, 'Enter')
    expect(closed.defaultPrevented).toBe(false)
    await key(w, 'ArrowDown', { altKey: true })
    const none = await key(w, 'Enter')
    expect(none.defaultPrevented).toBe(true)
    expect(w.emitted('update:modelValue')).toBeUndefined()
    await key(w, 'ArrowDown')
    await key(w, 'Enter')
    expect(emitted(w, 'update:modelValue')).toEqual(['E10.9'])
    expect(field(w).attributes('aria-expanded')).toBe('false')
  })

  it('Tab no elige (ni la resaltada sola ni una fila de acción): cierra y aplica «al salir»', async () => {
    const w = await mk({ creatable: true })
    await typeText(w, 'hiper x')
    await key(w, 'ArrowDown')
    expect(activeEl(w).className).toContain('g-combobox__action--create')
    await key(w, 'Tab')
    await field(w).trigger('blur')
    await flush()
    expect(w.emitted('create')).toBeUndefined()
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(field(w).element.value).toBe('')
  })

  it('texto fantasma: prefijo, primera activa, cursor al final; aria-hidden; no con búsqueda pendiente ni IME', async () => {
    const w = await mk()
    await typeText(w, 'hip')
    const g = w.find('.g-combobox__ghost')
    expect(g.attributes('aria-hidden')).toBe('true')
    expect(g.find('.g-combobox__ghost-typed').text()).toBe('hip')
    expect(g.find('.g-combobox__ghost-rest').text()).toBe('ertensión esencial')
    // No por código ni a mitad de la etiqueta
    await typeText(w, 'I10')
    expect(w.find('.g-combobox__ghost').exists()).toBe(false)
    // Cursor que no está al final
    await typeText(w, 'hip')
    field(w).element.setSelectionRange(1, 1)
    await field(w).trigger('keyup', { key: 'ArrowLeft' })
    expect(w.find('.g-combobox__ghost').exists()).toBe(false)
    // Pendiente (filter: false, sin respuesta)
    const w2 = await mk({ filter: false })
    await typeText(w2, 'hip')
    expect(w2.find('.g-combobox__ghost').exists()).toBe(false)
  })

  it('Tab elige el texto fantasma solo con etiqueta única a la vista y lista completa', async () => {
    const w = await mk()
    await typeText(w, 'hip')
    await key(w, 'Tab')
    expect(emitted(w, 'update:modelValue')).toEqual(['I10'])
    expect(emitted(w, 'change')[0].option.value).toBe('I10')
    // Homónimas: completa el nombre pero Tab no elige
    const w2 = await mk({ options: PEOPLE })
    await typeText(w2, 'mar')
    expect(w2.find('.g-combobox__ghost-rest').text()).toBe('ía García López')
    await key(w2, 'Tab')
    await field(w2).trigger('blur')
    expect(w2.emitted('update:modelValue')).toBeUndefined()
    // Con «Mostrar más» (resultados sin pintar): tampoco
    const w3 = await mk({ options: MANY, limit: 5 })
    await typeText(w3, 'insumo 001')
    expect(w3.find('.g-combobox__ghost').exists()).toBe(false) // «Insumo 001» completo: no es más larga
    await typeText(w3, 'insumo 00')
    expect(w3.find('.g-combobox__ghost-rest').text()).toBe('1')
    expect(w3.find('.g-combobox__action--more').exists()).toBe(true)
    await key(w3, 'Tab')
    expect(w3.emitted('update:modelValue')).toBeUndefined()
  })

  it('→ con fantasma y el cursor al final acepta el texto sin elegir ni buscar; la opción pasa a ser de la persona', async () => {
    vi.useFakeTimers()
    const w = await mk({ delay: 250, filter: false, options: PEOPLE.slice(2) })
    await typeText(w, 'mar')
    vi.advanceTimersByTime(250)
    await w.setProps({ loading: true })
    await w.setProps({ loading: false })
    await flush()
    expect(w.find('.g-combobox__ghost-rest').text()).toBe('io Ruiz')
    const ev = await key(w, 'ArrowRight')
    expect(ev.defaultPrevented).toBe(true)
    expect(field(w).element.value).toBe('Mario Ruiz')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    vi.advanceTimersByTime(1000)
    expect(emitted(w, 'search')).toEqual(['mar']) // sin nueva búsqueda
    expect(field(w).attributes('aria-expanded')).toBe('true')
    // Aunque ahora llegue una búsqueda pendiente, Intro la elige: la activó la persona
    await w.setProps({ loading: true })
    await key(w, 'Enter')
    expect(emitted(w, 'update:modelValue')).toEqual(['p3'])
  })

  it('→ sin fantasma es edición (no se cancela)', async () => {
    const w = await mk()
    await typeText(w, 'I10')
    const ev = await key(w, 'ArrowRight')
    expect(ev.defaultPrevented).toBe(false)
  })

  it('Esc en dos niveles: abierta cierra y conserva el texto; cerrada con texto sin confirmar restaura; ambos sin propagar', async () => {
    const outer = vi.fn()
    const w = await host('<div @keydown="outer"><GCombobox id="c" label="Dx" model-value="I10" :labels="L" :options="DX" :delay="0" /></div>', () => ({ outer, L: LABELS, DX }))
    await typeText(w, 'dia')
    const e1 = await key(w, 'Escape')
    expect(e1.defaultPrevented).toBe(true)
    expect(field(w).attributes('aria-expanded')).toBe('false')
    expect(field(w).element.value).toBe('dia')
    const e2 = await key(w, 'Escape')
    expect(e2.defaultPrevented).toBe(true)
    expect(field(w).element.value).toBe('Hipertensión esencial')
    expect(outer).not.toHaveBeenCalled()
    // Tercera: ya no hay nada que tratar; es nativa y sí propaga
    const e3 = await key(w, 'Escape')
    expect(e3.defaultPrevented).toBe(false)
    expect(outer).toHaveBeenCalledTimes(1)
  })

  it('IME: ninguna tecla de lista actúa durante la composición y no hay texto fantasma', async () => {
    const w = await mk()
    await field(w).trigger('compositionstart')
    const el = field(w).element
    el.focus()
    el.value = 'hip'
    await field(w).trigger('input')
    await flush()
    expect(field(w).attributes('aria-expanded')).toBe('false')
    expect(w.find('.g-combobox__ghost').exists()).toBe(false)
    const ev = await key(w, 'ArrowDown')
    expect(ev.defaultPrevented).toBe(false)
    await field(w).trigger('compositionend')
    await flush()
    expect(field(w).attributes('aria-expanded')).toBe('true')
    expect(w.find('.g-combobox__ghost').exists()).toBe(true)
    const composingKey = await key(w, 'Enter', { isComposing: true })
    expect(composingKey.defaultPrevented).toBe(false)
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('puntero: pasar activa, el clic elige; pointerdown sobre el panel no quita el foco (preventDefault)', async () => {
    const w = await mk()
    await key(w, 'ArrowDown')
    const li = rows(w)[2].element
    li.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 3, clientY: 9 }))
    await flush()
    expect(activeEl(w), 'el primer evento tras abrir solo anota la posición').not.toBe(li)
    li.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 3, clientY: 9 }))
    await flush()
    expect(activeEl(w), 'sin desplazamiento real no activa').not.toBe(li)
    li.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 4, clientY: 9 }))
    await flush()
    expect(activeEl(w)).toBe(li)
    const down = new MouseEvent('pointerdown', { bubbles: true, cancelable: true })
    li.dispatchEvent(down)
    expect(down.defaultPrevented).toBe(true)
    // Deshabilitada: no elige
    await rows(w)[3].trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    await rows(w)[2].trigger('click')
    expect(emitted(w, 'update:modelValue')).toEqual(['I10'])
  })

  it('la flecha abre y cierra sin elegir; el clic en el campo abre', async () => {
    const w = await mk()
    await w.find('.g-combobox__arrow').trigger('click')
    expect(field(w).attributes('aria-expanded')).toBe('true')
    expect(document.activeElement).toBe(field(w).element)
    await w.find('.g-combobox__arrow').trigger('click')
    expect(field(w).attributes('aria-expanded')).toBe('false')
    await field(w).trigger('click')
    expect(field(w).attributes('aria-expanded')).toBe('true')
  })
})

describe('GCombobox · al salir del campo, texto libre y agregar', () => {
  it('texto vacío borra (null y \'\')', async () => {
    const w = await mk({ modelValue: 'I10' })
    await typeText(w, '')
    await field(w).trigger('blur')
    expect(emitted(w, 'update:modelValue')).toEqual([null])
    expect(emitted(w, 'change')).toEqual([{ value: null, custom: '', option: null }])
  })

  it('texto que no es el de la opción elegida se descarta y vuelve el de la opción', async () => {
    const w = await mk({ modelValue: 'I10' })
    await typeText(w, 'diab')
    await field(w).trigger('blur')
    await flush()
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(field(w).element.value).toBe('Hipertensión esencial')
    expect(root(w).classes()).toContain('is-token')
  })

  it('allowCustom conserva el texto en custom, aunque coincida con la etiqueta de una opción', async () => {
    const w = await mk({ allowCustom: true })
    await typeText(w, ' Cefalea ')
    await key(w, 'Escape')
    await field(w).trigger('blur')
    expect(w.emitted('update:modelValue')).toBeUndefined() // ya era null
    expect(emitted(w, 'update:custom')).toEqual(['Cefalea'])
    expect(emitted(w, 'change')).toEqual([{ value: null, custom: 'Cefalea', option: null }])
  })

  it('fila «Usar «texto»…»: visible con coincidencias, oculta con una etiqueta idéntica a la vista; elegirla confirma el texto libre', async () => {
    const w = await mk({ allowCustom: true })
    await typeText(w, 'cefa')
    expect(w.find('.g-combobox__action--custom').text()).toBe('Usar «cefa» como texto libre')
    await typeText(w, 'cefalea')
    expect(w.find('.g-combobox__action--custom').exists()).toBe(false)
    await typeText(w, 'dolor')
    expect(w.find('.g-combobox__status--empty').exists()).toBe(true) // sin resultados + filas de acción
    await w.find('.g-combobox__action--custom').trigger('click')
    expect(emitted(w, 'update:custom')).toEqual(['dolor'])
    expect(field(w).attributes('aria-expanded')).toBe('false')
  })

  it('create: cierra, el foco ya está en el campo al emitir, restaura el texto y no cambia el valor', async () => {
    let focusAtEmit = null
    const w = await mk({ creatable: true, modelValue: 'I10', onCreate: () => { focusAtEmit = document.activeElement } })
    await typeText(w, 'nuevo dx')
    const row = w.find('.g-combobox__action--create')
    expect(row.text()).toBe('Agregar «nuevo dx»…')
    expect(row.element.nextElementSibling).toBeNull() // la última
    await key(w, 'ArrowDown')
    await key(w, 'Enter')
    expect(emitted(w, 'create')).toEqual(['nuevo dx'])
    expect(focusAtEmit).toBe(field(w).element)
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(field(w).element.value).toBe('Hipertensión esencial')
    expect(field(w).attributes('aria-expanded')).toBe('false')
  })

  it('sin labels.create o labels.useCustom las filas no se pintan y avisa', async () => {
    const w = await mk({ creatable: true, allowCustom: true, labels: { close: 'Cerrar', noResults: 'x' } })
    await typeText(w, 'zz')
    expect(w.find('.g-combobox__action').exists()).toBe(false)
    expect(warnings().some((t) => t.includes('labels.create'))).toBe(true)
    expect(warnings().some((t) => t.includes('labels.useCustom'))).toBe(true)
  })

  it('clearable: botón aparte con nombre «Limpiar {etiqueta}»; borra, vacía y devuelve el foco', async () => {
    const w = await mk({ clearable: true, modelValue: 'I10' })
    const b = w.find('button.g-combobox__clear')
    const [own, label] = b.attributes('aria-labelledby').split(' ')
    expect(document.getElementById(own).textContent).toBe('Limpiar')
    expect(document.getElementById(label).textContent).toContain('Diagnóstico')
    expect(b.attributes('tabindex')).toBeUndefined()
    await b.trigger('click')
    expect(emitted(w, 'update:modelValue')).toEqual([null])
    expect(document.activeElement).toBe(field(w).element)
    await w.setProps({ modelValue: null })
    await flush()
    expect(field(w).element.value).toBe('')
    expect(w.find('button.g-combobox__clear').exists()).toBe(false)
  })

  it('nombre de «Limpiar» sin etiqueta visible: aria-labelledby o aria-label del consumidor', async () => {
    const w = await mk({ label: undefined, clearable: true, modelValue: 'I10' }, { attrs: { 'aria-labelledby': 'fuera' } })
    expect(w.find('.g-combobox__clear').attributes('aria-labelledby')).toMatch(/-clear-text fuera$/)
    const w2 = await mk({ label: undefined, clearable: true, modelValue: 'I10' }, { attrs: { 'aria-label': 'Diagnóstico' } })
    expect(w2.find('.g-combobox__clear').attributes('aria-label')).toBe('Limpiar Diagnóstico')
    const w3 = await mk({ clearable: true, modelValue: 'I10', labels: { close: 'Cerrar' } })
    expect(w3.find('.g-combobox__clear').exists()).toBe(false)
    expect(warnings().some((t) => t.includes('clearable necesita labels.clear'))).toBe(true)
  })
})

describe('GCombobox · semántica y composición de GInput (#330, #334)', () => {
  it('compone GInput: raíz, tres hijos en flujo y lo demás fuera de flujo como hijo de la raíz', async () => {
    const w = await mk({ hint: 'Código o descripción' })
    const r = root(w)
    expect(r.classes()).toEqual(expect.arrayContaining(['g-input', 'g-combobox', 'g-combobox--appearance-field']))
    const kids = [...r.element.children].map((c) => c.className.split(' ')[0])
    expect(kids).toEqual(['g-input__label', 'g-input__row', 'g-input__support', 'g-combobox__live', 'g-combobox__popup'])
    const cell = w.find('.g-input__control > .g-combobox__value')
    expect(cell.exists()).toBe(true)
    expect(cell.element.firstElementChild).toBe(field(w).element)
    const live = w.find('.g-combobox__live')
    expect(live.attributes()).toMatchObject({ role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' })
    expect(w.find('.g-combobox__popup').attributes('popover')).toBe('manual')
    expect(w.find('.g-combobox__popup > .g-combobox__popup-body > .g-combobox__panel').exists()).toBe(true)
  })

  it('atributos del patrón en reposo y abierto; aria-controls y aria-activedescendant apuntan a elementos que existen', async () => {
    const w = await mk()
    const f = field(w)
    expect(f.attributes()).toMatchObject({ type: 'text', role: 'combobox', 'aria-autocomplete': 'list', 'aria-haspopup': 'listbox', 'aria-expanded': 'false', autocomplete: 'off', autocapitalize: 'none', spellcheck: 'false' })
    expect(f.attributes('aria-activedescendant')).toBeUndefined()
    const list = document.getElementById(f.attributes('aria-controls'))
    expect(list.getAttribute('role')).toBe('listbox')
    expect(document.getElementById(list.getAttribute('aria-labelledby')).textContent).toContain('Diagnóstico')
    expect(document.querySelector(`label[for="${f.attributes('id')}"]`)).not.toBeNull()
    await typeText(w, 'dia')
    expect(f.attributes('aria-expanded')).toBe('true')
    expect(activeEl(w).getAttribute('role')).toBe('option')
    expect(activeEl(w).classList.contains('is-active')).toBe(true)
    expect(w.findAll('.is-active').length).toBe(1)
    expect(document.activeElement).toBe(f.element) // el foco real nunca sale del campo
  })

  it('aria-selected="true" solo en la elegida, con check; coincidencia con <mark>', async () => {
    const w = await mk({ modelValue: 'E11.9' })
    await key(w, 'ArrowDown')
    const sel = w.findAll('[aria-selected="true"]')
    expect(sel.length).toBe(1)
    expect(sel[0].text()).toContain('tipo 2')
    expect(sel[0].find('.g-combobox__check').attributes('aria-hidden')).toBe('true')
    await typeText(w, 'tipo e11')
    const marks = w.findAll('mark.g-summary__mark').map((m) => m.text())
    expect(marks).toEqual(['E11', 'tipo'])
    expect(w.find('mark.g-combobox__mark').exists()).toBe(false)
  })

  it('required: aria-required y marca, nunca required nativo; el visible no lleva name', async () => {
    const w = await mk({ required: true, name: 'dx' })
    expect(field(w).attributes('aria-required')).toBe('true')
    expect(field(w).attributes('required')).toBeUndefined()
    expect(field(w).attributes('name')).toBeUndefined()
    expect(w.find('.g-input__required').exists()).toBe(true)
  })

  it('readonly: nativo + aria-readonly, enfocable, no abre, sin limpiar ni flecha, se envía y no emite', async () => {
    const w = await mk({ readonly: true, clearable: true, modelValue: 'I10', name: 'dx' })
    const f = field(w)
    expect(f.attributes('readonly')).toBeDefined()
    expect(f.attributes('aria-readonly')).toBe('true')
    expect(w.find('.g-combobox__clear').exists()).toBe(false)
    expect(w.find('.g-combobox__arrow').exists()).toBe(false)
    await key(w, 'ArrowDown')
    await f.trigger('click')
    expect(f.attributes('aria-expanded')).toBe('false')
    expect(w.find('input[name="dx"]').attributes('disabled')).toBeUndefined()
    expect(w.find('input[name="dx"]').element.value).toBe('I10')
    expect(Object.keys(w.emitted()).filter((k) => ['update:modelValue', 'update:custom', 'change', 'search', 'open'].includes(k))).toEqual([])
  })

  it('disabled: nativo en el visible y en los ocultos (no se envía)', async () => {
    const w = await mk({ disabled: true, modelValue: 'I10', name: 'dx', customName: 'dxl', allowCustom: true })
    expect(field(w).attributes('disabled')).toBeDefined()
    expect(w.find('input[name="dx"]').attributes('disabled')).toBeDefined()
    expect(w.find('input[name="dxl"]').attributes('disabled')).toBeDefined()
    expect(w.find('.g-combobox__arrow').exists()).toBe(false)
    expect(root(w).classes()).toContain('is-disabled')
  })

  it('FormData: value de la opción y, con customName, el texto libre en su clave; form se copia a los ocultos', async () => {
    const st = reactive({ a: 'I10', b: null, c: 'Otro medicamento' })
    const w = await host(`<form id="f"><GCombobox label="Dx" name="dx" v-model="st.a" :labels="L" :options="DX" /><GCombobox label="Med" name="med" custom-name="med_libre" allow-custom v-model="st.b" v-model:custom="st.c" :labels="L" :options="DX" /><input name="x" value="1"></form>
      <GCombobox label="Fuera" name="fuera" form="f" model-value="R51" :labels="L" :options="DX" />`, () => ({ st, L: LABELS, DX }))
    const fd = Object.fromEntries(new FormData(w.find('form').element))
    expect(fd).toMatchObject({ dx: 'I10', med: '', med_libre: 'Otro medicamento', x: '1' })
    expect(w.find('input[name="fuera"]').attributes('form')).toBe('f')
  })

  it('atributos al <input> visible; class y style a la raíz; type se ignora y avisa; los del patrón ganan', async () => {
    const w = await mk({}, { attrs: { placeholder: 'Buscar', 'data-x': '1', class: 'mia', style: 'max-width: 10em', type: 'search', role: 'textbox', autocomplete: 'on', 'aria-describedby': 'fuera' } })
    const f = field(w)
    expect(f.attributes()).toMatchObject({ placeholder: 'Buscar', 'data-x': '1', type: 'text', role: 'combobox', autocomplete: 'on' })
    expect(root(w).classes()).toContain('mia')
    expect(root(w).attributes('style')).toContain('max-width')
    expect(f.attributes('aria-describedby')).toContain('fuera')
    expect(warnings().some((t) => t.includes('type no aplica'))).toBe(true)
  })

  it('ID-about: la línea secundaria de la opción (description o facts) o labels.custom; va primero en aria-describedby', async () => {
    const w = await mk({ modelValue: 'I10', hint: 'Ayuda' })
    const ids = field(w).attributes('aria-describedby').split(' ')
    expect(ids[0]).toMatch(/-about$/)
    expect(document.getElementById(ids[0]).textContent).toBe('Circulatorio')
    expect(document.getElementById(ids[1]).textContent).toBe('Ayuda')
    const w2 = await mk({ options: [{ value: 1, label: 'Ana', facts: [{ label: 'Exp.', value: '7' }, { label: 'Edad', value: '3 años' }] }], modelValue: 1 })
    expect(w2.find('.g-combobox__about').text()).toBe('Exp. 7 · Edad 3 años')
    const w3 = await mk({ allowCustom: true, custom: 'libre' })
    expect(w3.find('.g-combobox__about').text()).toBe('Texto libre')
    // Con texto a medio escribir no hay descripción del valor
    await typeText(w, 'dia')
    expect(w.find('.g-combobox__about').exists()).toBe(false)
    expect(field(w).attributes('aria-describedby')).not.toMatch(/-about/)
    // Sin secundaria: nada
    const w4 = await mk({ modelValue: 'R51' })
    expect(w4.find('.g-combobox__about').exists()).toBe(false)
  })

  it('manejadores propios primero: la escucha @input del consumidor ya ve la búsqueda emitida (mergeProps, C8)', async () => {
    const seq = []
    const w = await mk({ filter: false, onSearch: () => seq.push('search') }, { attrs: { onInput: () => seq.push('input'), onKeydown: () => seq.push('keydown'), onBlur: () => seq.push('blur') } })
    await typeText(w, 'ma')
    expect(seq).toEqual(['search', 'input'])
    seq.length = 0
    const w2 = await mk({ 'onUpdate:modelValue': () => seq.push('model') }, { attrs: { onKeydown: () => seq.push('keydown') } })
    await key(w2, 'ArrowDown')
    await key(w2, 'Enter')
    expect(seq).toEqual(['keydown', 'model', 'keydown'])
  })

  it('@change del consumidor recibe el objeto y no el evento nativo; focus y blur llegan nativos', async () => {
    const onChange = vi.fn()
    const onFocus = vi.fn()
    const w = await mk({ onChange }, { attrs: { onFocus } })
    field(w).element.focus()
    expect(onFocus).toHaveBeenCalledTimes(1)
    await field(w).trigger('change')
    expect(onChange).not.toHaveBeenCalled()
    await key(w, 'ArrowDown')
    await key(w, 'Enter')
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: 'E10.9', custom: '' }))
  })

  it('GForm: registra por name, pinta errors[name], y elegir llama a notifyChange (sube dirty)', async () => {
    const st = reactive({ v: null, dirty: false, errors: { dx: 'Elige un diagnóstico' } })
    const w = await host('<GForm v-model:dirty="st.dirty" :errors="st.errors" :labels="FL" aria-label="F"><GCombobox id="c" label="Dx" name="dx" v-model="st.v" :labels="L" :options="DX" :delay="0" /></GForm>',
      () => ({ st, L: LABELS, DX, FL: { optional: '(opcional)', error: 'Error: ' } }))
    expect(root(w).classes()).not.toContain('is-invalid') // el error se revela al salir
    await typeText(w, 'cefa')
    expect(st.dirty).toBe(true)
    await key(w, 'Enter')
    expect(st.v).toBe('R51')
    expect(field(w).element.value).toBe('Cefalea')
    await field(w).trigger('focusout')
    await flush()
    expect(root(w).classes()).toContain('is-invalid')
    expect(w.find('.g-input__message').text()).toContain('Elige un diagnóstico')
    expect(field(w).attributes('aria-invalid')).toBe('true')
  })

  it('error, warning y valid son los de GInput; loadError no es error', async () => {
    const w = await mk({ error: 'Falta' })
    expect(root(w).classes()).toContain('is-invalid')
    expect(field(w).attributes('aria-invalid')).toBe('true')
    expect(w.find('.g-input__message').text()).toContain('Falta')
    const w2 = await mk({ loading: true })
    expect(root(w2).classes()).toContain('is-loading')
    expect(w2.find('.g-input__loader').exists()).toBe(true)
  })

  it('las props de GInput pasan tal cual: size, variant, density, color, rounded, block', async () => {
    const w = await mk({ size: 'lg', variant: 'soft', density: 'compact', color: 'accent', rounded: 'pill', block: true })
    expect(root(w).classes()).toEqual(expect.arrayContaining(['g-input--size-lg', 'g-input--variant-soft', 'g-input--density-compact', 'g-input--color-accent', 'g-input--rounded-pill', 'g-input--block']))
  })

  it('validadores: appearance, size y los numéricos rechazan valores fuera de su lista', () => {
    const p = GCombobox.props
    expect(p.appearance.validator('surface')).toBe(false)
    expect(p.appearance.validator('palette')).toBe(true)
    expect(p.size.validator('xxl')).toBe(false)
    expect(p.variant.validator('ghost')).toBe(false)
    expect(p.limit.validator(0)).toBe(false)
    expect(p.delay.validator(-1)).toBe(false)
    expect(p.minChars.validator(-2)).toBe(false)
    expect(p.minChars.validator(0)).toBe(true)
  })

  it('emits declarados: los ocho eventos', () => {
    expect([...GCombobox.emits].sort()).toEqual(['change', 'close', 'create', 'more', 'open', 'search', 'update:custom', 'update:modelValue'])
  })
})

describe('GCombobox · opciones y slots (#335)', () => {
  it('fila por defecto: una GSummary row lines 2 (md) con label → title, code, avatar o icon, y facts con rótulo (description solo sin facts)', async () => {
    const w = await mk({ options: [...PEOPLE, { value: 'c', label: 'Clínica', icon: 'user' }] })
    await key(w, 'ArrowDown')
    const first = rows(w)[0]
    const card = first.find('.g-summary')
    expect(card.classes()).toEqual(expect.arrayContaining(['g-summary--layout-row', 'g-summary--size-md']))
    expect(card.classes()).not.toContain('g-summary--multi')
    expect(card.find('.g-summary__lead').attributes('aria-hidden')).toBe('true')
    expect(card.find('.g-summary__lead .g-avatar').exists()).toBe(true)
    expect(card.find('.g-summary__title').text()).toBe('María García López')
    expect(card.findAll('.g-summary__fact').map((f) => `${f.find('.g-summary__fact-label').text()} ${f.find('.g-summary__fact-value').text()}`)).toEqual(['Exp. 001000', 'Edad 22 años'])
    expect(card.find('.g-summary__fact.is-anchor .g-summary__fact-value').text()).toBe('001000')
    // Con facts, description no se pinta (ni se lee dos veces): sigue alimentando ID-about
    expect(card.find('.g-summary__subtitle').exists()).toBe(false)
    expect(rows(w)[2].find('.g-summary__subtitle').text()).toBe('Exp. 001014 · 40 años')
    expect(rows(w)[3].find('.g-summary__lead svg.g-icon').exists()).toBe(true)
    // Nada de las clases de ficha antiguas (combobox.md «Clases que dejan de pintarse»)
    for (const c of ['__description', '__facts', '__fact', '__fact-label', '__token-label', '__token-meta', '__preview-head', '__preview-title', '__preview-facts']) expect(w.find(`.g-combobox${c}`).exists(), c).toBe(false)
    for (const c of ['__lead', '__code', '__main', '__label', '__mark']) expect(first.find(`.g-combobox${c}`).exists(), c).toBe(false)
    // El código va en la ficha
    const w2 = await mk({ modelValue: null })
    await key(w2, 'ArrowDown')
    expect(rows(w2)[0].find('.g-summary__code').text()).toBe('E10.9')
    expect(rows(w2)[0].find('.g-summary__subtitle').text()).toBe('Endocrinas')
  })

  it('traducción: value, disabled y campos de más no llegan a la ficha; priority, short y bare pasan; un dato sin label lo omite la ficha y avisa', async () => {
    const w = await mk({ options: [{ value: 'x', label: 'Ana', extra: 1, disabled: false, facts: [{ label: 'Edad', value: '3', priority: 2 }, { label: 'Expediente', short: 'Exp.', value: '7', priority: 1, bare: true }, { value: 'sin rótulo' }] }] })
    await key(w, 'ArrowDown')
    const facts = rows(w)[0].findAll('.g-summary__fact')
    expect(facts.map((f) => f.find('.g-summary__fact-label').text())).toEqual(['Exp.', 'Edad'])
    expect(facts[0].classes()).toEqual(expect.arrayContaining(['is-anchor', 'is-bare']))
    expect(rows(w)[0].text()).not.toContain('sin rótulo')
    expect(warn.mock.calls.some((c) => String(c[0]).includes('[Grana GSummary]') && String(c[0]).includes('no tiene label'))).toBe(true)
    expect(warnings()).toEqual([])
  })

  it('ID-about y el nombre de la opción no cambian con la ficha: secondary(option) sigue alimentando la descripción accesible', async () => {
    const w = await mk({ options: PEOPLE, modelValue: 'p1' })
    expect(w.find('.g-combobox__about').text()).toBe('Exp. 001000 · 22 años')
    expect(field(w).attributes('aria-describedby').split(' ')[0]).toBe(w.find('.g-combobox__about').attributes('id'))
    // La ficha del valor no se lee (aria-hidden) y no repite la descripción
    expect(w.find('.g-combobox__token').attributes('aria-hidden')).toBe('true')
    expect(w.find('.g-combobox__token .g-summary__title').text()).toBe('María García López')
    expect(w.find('.g-combobox__token .g-summary__subtitle').exists()).toBe(false)
    expect(w.find('.g-combobox__token .g-summary__fact.is-anchor .g-summary__fact-value').text()).toBe('001000')
  })

  it('highlight: la coincidencia se marca en la ficha (title, code, subtitle y valores; no en los rótulos); solo en la opción, no en la ficha del valor ni en la vista previa', async () => {
    const w = await mk({ options: PEOPLE })
    await typeText(w, 'mar 0010')
    const first = rows(w)[0]
    expect(first.find('.g-summary').attributes('class')).toContain('g-summary')
    expect(first.findAll('mark.g-summary__mark').map((m) => m.text())).toEqual(['Mar', '0010'])
    expect(first.find('.g-summary__fact-label mark').exists()).toBe(false)
    await key(w, 'Enter')
    expect(w.find('.g-combobox__token mark').exists()).toBe(false)
  })

  it('diff: summaryDiff sobre las opciones pintadas; las homónimas marcan is-diff / is-same y la vecina sin homónimos no lleva marcas; la vista previa recibe el mismo diff', async () => {
    const w = await mk({ options: PEOPLE })
    await key(w, 'ArrowDown')
    const [r1, r2, r3] = rows(w)
    expect(r1.find('.g-summary__fact.is-anchor').classes()).toContain('is-diff')
    expect(r2.find('.g-summary__fact.is-anchor').classes()).toContain('is-diff')
    expect(r1.findAll('.g-summary__fact').map((f) => f.classes().filter((c) => c.startsWith('is-')).join(' '))).toEqual(['is-anchor is-diff', 'is-diff'])
    expect(r3.find('.is-diff, .is-same').exists()).toBe(false)
    // Con un dato compartido entre homónimas, is-same
    const w2 = await mk({ options: [{ value: 'a', label: 'Ana', facts: [{ label: 'Exp.', value: '1' }, { label: 'Sala', value: 'B' }] }, { value: 'b', label: 'ANA ', facts: [{ label: 'Exp.', value: '2' }, { label: 'Sala', value: 'B' }] }] })
    await key(w2, 'ArrowDown')
    expect(rows(w2)[0].findAll('.g-summary__fact').map((f) => f.classes().filter((c) => c.startsWith('is-')).join(' '))).toEqual(['is-anchor is-diff', 'is-same'])
    // Sobre las PINTADAS: al filtrar hasta dejar una sola «Ana», no hay homónimas a la vista
    await typeText(w2, 'ana 1')
    expect(rows(w2).length).toBe(1)
    expect(rows(w2)[0].find('.is-diff, .is-same').exists()).toBe(false)
    // Vista previa (paleta) con el diff de la opción activa
    const w3 = await mk({ appearance: 'palette', options: PEOPLE })
    await key(w3, 'ArrowDown')
    await key(w3, 'ArrowDown', {}, w3.find('.g-combobox__search-field'))
    expect(w3.find('.g-combobox__preview .g-summary__fact.is-anchor').classes()).toContain('is-diff')
  })

  it('tamaño de la ficha de opción: md; con el campo en xs o sm, sm', async () => {
    const w = await mk({ size: 'sm' })
    await key(w, 'ArrowDown')
    expect(rows(w)[0].find('.g-summary').classes()).toContain('g-summary--size-sm')
    const w2 = await mk({ size: 'xl' })
    await key(w2, 'ArrowDown')
    expect(rows(w2)[0].find('.g-summary').classes()).toContain('g-summary--size-md')
    expect(w2.find('.g-combobox__token .g-summary').exists()).toBe(false)
    const w3 = await mk({ size: 'xl', modelValue: 'I10' })
    expect(w3.find('.g-combobox__token .g-summary').classes()).toContain('g-summary--size-xs')
  })

  it('las filas de acción no cambian: conservan __lead, __main y __label, sin ficha', async () => {
    const w = await mk({ allowCustom: true, creatable: true })
    await typeText(w, 'zzz')
    const acts = w.findAll('.g-combobox__action')
    expect(acts.length).toBe(2)
    for (const a of acts) {
      expect(a.find('.g-combobox__lead').exists()).toBe(true)
      expect(a.find('.g-combobox__main .g-combobox__label').exists()).toBe(true)
      expect(a.find('.g-summary').exists()).toBe(false)
    }
  })

  it('opción sin value o sin label se ignora y avisa; value repetido avisa', async () => {
    const w = await mk({ options: [{ label: 'sin value' }, { value: 1 }, { value: 2, label: 'Dos' }, { value: 2, label: 'Dos bis' }] })
    await key(w, 'ArrowDown')
    expect(rows(w).length).toBe(2)
    expect(warnings().some((t) => t.includes('se ignora'))).toBe(true)
    expect(warnings().some((t) => t.includes('mismo value'))).toBe(true)
  })

  it('slots option ({ option, active, selected, query }), lead y value ({ option, custom })', async () => {
    const w = await mk({ modelValue: 'I10' }, {
      slots: {
        option: ({ option, active, selected, query }) => h('span', { class: 'mio' }, `${option.label}|${active}|${selected}|${query}`),
        value: ({ option, custom }) => h('em', `${option ? option.code : 'libre'}:${custom}`)
      }
    })
    expect(w.find('.g-combobox__token em').text()).toBe('I10:')
    await typeText(w, 'hiper')
    expect(w.find('.mio').text()).toBe('Hipertensión esencial|true|true|hiper')
    expect(rows(w)[0].find('.g-combobox__check').exists()).toBe(true)
    expect(rows(w)[0].find('.g-summary').exists(), 'con el slot option no hay ficha').toBe(false)
    expect(w.find('.g-combobox__token .g-summary').exists(), 'con el slot value no hay ficha').toBe(false)
    // El slot lead ({ option }) pasa al slot lead de la ficha y manda sobre avatar e icon
    const w2 = await mk({ options: PEOPLE, modelValue: 'p1' }, { slots: { lead: ({ option }) => h('i', { class: 'l' }, option.value) } })
    expect(w2.find('.g-combobox__token .g-summary__lead .l').text()).toBe('p1')
    expect(w2.find('.g-combobox__token .g-avatar').exists()).toBe(false)
    await key(w2, 'ArrowDown')
    expect(rows(w2)[0].find('.g-summary__lead .l').text()).toBe('p1')
    expect(rows(w2)[0].find('.g-avatar').exists()).toBe(false)
    // Un slot lead vacío deja decidir a la ficha (avatar)
    const w3 = await mk({ options: PEOPLE }, { slots: { lead: () => null } })
    await key(w3, 'ArrowDown')
    expect(rows(w3)[0].find('.g-summary__lead .g-avatar').exists()).toBe(true)
  })

  it('slots label, hint, error y prepend son los de GInput; append y action no se pintan y avisan', async () => {
    const w = await mk({ label: undefined, error: 'x' }, { slots: { label: () => 'Mi etiqueta', hint: () => 'Mi ayuda', error: () => h('b', 'Mi error'), prepend: () => h('i', { class: 'pre' }), append: () => h('i', { class: 'app' }), action: () => h('button', 'A') } })
    expect(w.find('.g-input__label').text()).toContain('Mi etiqueta')
    expect(w.find('.g-input__hint').text()).toBe('Mi ayuda')
    expect(w.find('.g-input__message b').text()).toBe('Mi error')
    expect(w.find('.g-input__prepend .pre').exists()).toBe(true)
    expect(w.find('.app').exists()).toBe(false)
    expect(w.find('.g-input__action').exists()).toBe(false)
    expect(warnings().some((t) => t.includes('append y action no aplican'))).toBe(true)
    expect(warnings().some((t) => t.includes('nombre accesible'))).toBe(false)
  })
})

describe('GCombobox · la superficie: appearance="palette" y móvil (#330)', () => {
  it('es un GDialog real con sus props; el campo es el disparador', async () => {
    const w = await mk({ appearance: 'palette', options: PEOPLE, modelValue: 'p3' })
    const d = w.findComponent(GDialog)
    expect(d.exists()).toBe(true)
    expect(d.props()).toMatchObject({ title: 'Diagnóstico', closeLabel: 'Cerrar', size: 'lg', mobile: 'sheet', modelValue: false })
    expect(d.classes()).toEqual(expect.arrayContaining(['g-dialog', 'g-combobox-surface', 'g-combobox-surface--palette']))
    expect(d.element.parentElement).toBe(root(w).element)
    expect(w.find('.g-combobox__popup').exists()).toBe(false)
    const f = field(w)
    expect(root(w).classes()).toEqual(expect.arrayContaining(['is-surface', 'g-combobox--appearance-palette', 'is-token']))
    expect(f.attributes()).toMatchObject({ role: 'combobox', 'aria-haspopup': 'dialog', 'aria-expanded': 'false', inputmode: 'none' })
    expect(f.attributes('aria-autocomplete')).toBeUndefined()
    expect(document.getElementById(f.attributes('aria-controls'))).toBe(d.element)
    expect(w.find('.g-combobox__arrow svg').html()).toContain('m7 15 5 5 5-5') // chevrons-up-down
  })

  it('abre con Intro, Espacio, ↓, ↑ o un carácter (la primera tecla es el texto inicial); enfocar no abre', async () => {
    for (const k of ['Enter', ' ', 'ArrowDown', 'ArrowUp']) {
      const w = await mk({ appearance: 'palette', options: PEOPLE })
      field(w).element.focus()
      await flush()
      expect(w.find('dialog').attributes('open')).toBeUndefined()
      const ev = await key(w, k)
      expect(ev.defaultPrevented, k).toBe(true)
      expect(w.find('dialog').attributes('open'), k).toBeDefined()
      expect(w.find('.g-combobox__search-field').element.value).toBe('')
    }
    const w = await mk({ appearance: 'palette', options: PEOPLE })
    await key(w, 'm')
    const s = w.find('.g-combobox__search-field')
    expect(s.element.value).toBe('m')
    expect(field(w).attributes('aria-expanded')).toBe('true')
    expect(emitted(w, 'open').length).toBe(1)
    expect(rows(w).length).toBe(3)
  })

  it('lo pegado o tecleado sobre el disparador no se pierde: es el texto inicial y el campo conserva el suyo', async () => {
    const w = await mk({ appearance: 'palette', options: PEOPLE, modelValue: 'p3' })
    const el = field(w).element
    el.focus()
    el.value = 'maría garcía'
    await field(w).trigger('input')
    await flush()
    expect(el.value).toBe('Mario Ruiz')
    expect(w.find('.g-combobox__search-field').element.value).toBe('maría garcía')
    expect(rows(w).length).toBe(2)
  })

  it('campo de búsqueda: el combobox de APG completo, nombrado por el título; teclas de lista; Tab no elige', async () => {
    const w = await mk({ appearance: 'palette', options: PEOPLE })
    await key(w, 'm')
    const s = w.find('.g-combobox__search-field')
    expect(s.attributes()).toMatchObject({ role: 'combobox', 'aria-autocomplete': 'list', 'aria-expanded': 'true', enterkeyhint: 'search', autocomplete: 'off' })
    expect(document.getElementById(s.attributes('aria-labelledby')).textContent).toBe('Diagnóstico')
    expect(document.getElementById(s.attributes('aria-controls')).getAttribute('role')).toBe('listbox')
    expect(document.getElementById(s.attributes('aria-activedescendant')).textContent).toContain('001000')
    expect(s.attributes('name')).toBeUndefined()
    await key(w, 'ArrowDown', {}, s)
    expect(document.getElementById(s.attributes('aria-activedescendant')).textContent).toContain('001007')
    const tab = await key(w, 'Tab', {}, s)
    expect(tab.defaultPrevented).toBe(false)
    expect(w.emitted('update:modelValue')).toBeUndefined()
    await key(w, 'Enter', {}, s)
    expect(emitted(w, 'update:modelValue')).toEqual(['p2'])
    expect(w.find('dialog').attributes('open')).toBeUndefined()
    expect(emitted(w, 'close').length).toBe(1)
  })

  it('vista previa: región con nombre, pinta la opción activa por defecto (GSummary stack lg con los datos de la fila, sin highlight) o por el slot', async () => {
    const w = await mk({ appearance: 'palette', options: PEOPLE })
    await key(w, 'ArrowDown')
    const p = w.find('aside.g-combobox__preview')
    expect(p.attributes('aria-label')).toBe('Vista previa')
    expect(p.attributes('aria-live')).toBeUndefined()
    expect(w.find('.g-combobox__surface-body').classes()).toContain('has-preview')
    expect(p.find('.g-combobox__preview-empty').text()).toBe('Recorre la lista')
    const s = w.find('.g-combobox__search-field')
    await typeText(w, 'mar', s)
    const card = () => w.find('.g-combobox__preview .g-summary')
    expect(card().classes()).toEqual(expect.arrayContaining(['g-summary--layout-stack', 'g-summary--size-lg']))
    expect(card().find('.g-summary__title').text()).toBe('María García López')
    expect(card().find('.g-summary__lead .g-avatar').exists()).toBe(true)
    expect(card().findAll('.g-summary__fact-label').map((x) => x.text())).toEqual(['Exp.', 'Edad'])
    expect(card().findAll('.g-summary__fact-value').map((x) => x.text())).toEqual(['001000', '22 años'])
    expect(card().find('mark').exists(), 'sin highlight en la vista previa').toBe(false)
    expect(p.find('.g-combobox__preview-head, .g-combobox__preview-facts, dl').exists()).toBe(false)
    const el1 = card().element
    await key(w, 'ArrowDown', {}, s)
    expect(card().findAll('.g-summary__fact-value')[0].text()).toBe('001007')
    expect(card().element, 'con key por opción: el contenido se vuelve a crear').not.toBe(el1)
    const w2 = await mk({ appearance: 'palette', options: PEOPLE }, { slots: { preview: ({ option }) => h('p', { class: 'ficha' }, option.description) } })
    await key(w2, 'm')
    expect(w2.find('.g-combobox__preview .ficha').text()).toBe('Exp. 001000 · 22 años')
    expect(w2.find('.g-combobox__preview .g-summary').exists()).toBe(false)
  })

  it('dismiss de GDialog (Esc, fondo, cierre) cierra sin elegir; no hay confirmación de texto', async () => {
    const w = await mk({ appearance: 'palette', options: PEOPLE, allowCustom: true })
    await key(w, 'm')
    await w.find('.g-dialog__close').trigger('click')
    await flush()
    expect(w.find('dialog').attributes('open')).toBeUndefined()
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(w.emitted('update:custom')).toBeUndefined()
    expect(field(w).attributes('aria-expanded')).toBe('false')
    // Esc sobre el campo de búsqueda: lo trata GDialog (un nivel) y queda cancelado para un anfitrión
    await key(w, 'm')
    const esc = await key(w, 'Escape', {}, w.find('.g-combobox__search-field'))
    expect(esc.defaultPrevented).toBe(true)
    expect(w.find('dialog').attributes('open')).toBeUndefined()
    expect(emitted(w, 'close').length).toBe(2)
  })

  it('g-dialog__body sin tabindex; región viva dentro de la superficie; anuncio allí y no en la de la página', async () => {
    vi.useFakeTimers()
    const w = await mk({ appearance: 'palette', options: PEOPLE })
    await key(w, 'm')
    expect(w.find('.g-dialog__body').attributes('tabindex')).toBeUndefined()
    const lives = w.findAll('.g-combobox__live')
    expect(lives.length).toBe(2)
    expect(lives[1].element.closest('dialog')).not.toBeNull()
    vi.advanceTimersByTime(600)
    await flush()
    expect(lives[1].text()).toBe('3 resultados')
    expect(lives[0].text()).toBe('')
  })

  it('título: label › aria-label del consumidor › labels.surfaceTitle; sin ninguno, aviso', async () => {
    const w = await mk({ appearance: 'palette', label: undefined }, { attrs: { 'aria-label': 'Paciente' } })
    expect(w.findComponent(GDialog).props('title')).toBe('Paciente')
    const w2 = await mk({ appearance: 'palette', label: undefined }, { attrs: { 'aria-labelledby': 'x' } })
    expect(w2.findComponent(GDialog).props('title')).toBe('Buscar')
    await mk({ appearance: 'palette', label: undefined, labels: { close: 'Cerrar', preview: 'V' } }, { attrs: { 'aria-labelledby': 'x' } })
    expect(warnings().some((t) => t.includes('labels.surfaceTitle'))).toBe(true)
  })

  it('create desde la superficie: cierra, devuelve el foco al campo y después emite', async () => {
    let focusAtEmit = null
    const w = await mk({ appearance: 'palette', options: PEOPLE, creatable: true, onCreate: () => { focusAtEmit = document.activeElement } })
    await key(w, 'z')
    await w.find('.g-combobox__action--create').trigger('click')
    await flush()
    expect(emitted(w, 'create')).toEqual(['z'])
    expect(focusAtEmit).toBe(field(w).element)
    expect(w.find('dialog').attributes('open')).toBeUndefined()
  })

  it('móvil (≤ 520): siempre la superficie como hoja, sin vista previa; cruzar el umbral con la lista abierta la cierra', async () => {
    const m = mobile(true)
    const w = await mk({ options: PEOPLE })
    expect(root(w).classes()).toEqual(expect.arrayContaining(['is-surface', 'g-combobox--appearance-field']))
    const d = w.findComponent(GDialog)
    expect(d.classes()).toContain('g-combobox-surface--sheet')
    expect(field(w).attributes('aria-haspopup')).toBe('dialog')
    await field(w).trigger('click')
    await flush()
    expect(w.find('dialog').attributes('open')).toBeDefined()
    expect(w.find('.g-combobox__preview').exists()).toBe(false)
    expect(w.find('.g-combobox__surface-body').classes()).not.toContain('has-preview')
    m.fire(false)
    await flush()
    expect(emitted(w, 'close').length).toBe(1)
    expect(root(w).classes()).not.toContain('is-surface')
    expect(w.find('.g-combobox__popup').exists()).toBe(true)
    expect(field(w).attributes('aria-expanded')).toBe('false')
  })

  it('cambiar appearance con la lista abierta la cierra', async () => {
    const w = await mk()
    await key(w, 'ArrowDown')
    expect(field(w).attributes('aria-expanded')).toBe('true')
    await w.setProps({ appearance: 'palette' })
    await flush()
    expect(field(w).attributes('aria-expanded')).toBe('false')
    expect(emitted(w, 'close').length).toBe(1)
  })
})

describe('GCombobox · anuncios (región viva educada)', () => {
  const liveText = (w) => w.find('.g-combobox__live').text()

  it('uno por búsqueda asentada, a los 600 ms: results (función) y partial', async () => {
    vi.useFakeTimers()
    const w = await mk({ options: MANY, limit: 50 })
    await typeText(w, 'insumo')
    await typeText(w, 'insumo 0')
    vi.advanceTimersByTime(599)
    await flush()
    expect(liveText(w)).toBe('')
    vi.advanceTimersByTime(1)
    await flush()
    expect(liveText(w)).toBe('50 de 111 resultados')
    await typeText(w, 'insumo 001')
    vi.advanceTimersByTime(600)
    await flush()
    expect(liveText(w)).toBe('1 resultado')
  })

  it('noResults con el texto; nada si la lista se cerró antes', async () => {
    vi.useFakeTimers()
    const w = await mk()
    await typeText(w, 'zzz')
    vi.advanceTimersByTime(600)
    await flush()
    expect(liveText(w)).toBe('Sin resultados para «zzz»')
    const w2 = await mk()
    await typeText(w2, 'dia')
    await key(w2, 'Escape')
    vi.advanceTimersByTime(2000)
    await flush()
    expect(liveText(w2)).toBe('')
  })

  it('loadError se anuncia cuando llega; «Buscando…» y la pista de mínimo no', async () => {
    vi.useFakeTimers()
    const w = await mk({ filter: false, options: [], minChars: 2 })
    await typeText(w, 'm')
    vi.advanceTimersByTime(700)
    await flush()
    expect(liveText(w)).toBe('')
    await typeText(w, 'ma')
    await w.setProps({ loading: true })
    vi.advanceTimersByTime(700)
    await flush()
    expect(liveText(w)).toBe('')
    await w.setProps({ loading: false, loadError: 'No se pudo cargar.' })
    vi.advanceTimersByTime(600)
    await flush()
    expect(liveText(w)).toBe('No se pudo cargar.')
  })

  it('cifras con el Intl.NumberFormat del lang del ancestro más cercano', async () => {
    vi.useFakeTimers()
    const many = Array.from({ length: 1500 }, (_, i) => ({ value: i, label: `Fila ${i}` }))
    const w = await host('<div lang="de"><GCombobox id="c" label="X" :labels="L" :options="many" :limit="1200" :delay="0" /></div>', () => ({ L: { ...LABELS, results: '{count} Ergebnisse' }, many }))
    await typeText(w, 'fila')
    vi.advanceTimersByTime(600)
    await flush()
    expect(w.find('.g-combobox__live').text()).toBe('1.200 de 1.500 resultados')
  })

  it('sin labels.partial usa results y avisa', async () => {
    vi.useFakeTimers()
    const w = await mk({ options: MANY, limit: 10, labels: { ...LABELS, partial: undefined } })
    await typeText(w, 'insumo')
    vi.advanceTimersByTime(600)
    await flush()
    expect(liveText(w)).toBe('10 resultados')
    expect(warnings().some((t) => t.includes('labels.partial'))).toBe(true)
  })
})

describe('GCombobox · movimiento: la ficha llega (#336)', () => {
  function fakeAnimation() {
    const real = window.getComputedStyle
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el, ...rest) => {
      const cs = real.call(window, el, ...rest)
      if (el.classList && el.classList.contains('is-arriving')) {
        return new Proxy(cs, { get: (t, k) => (k === 'animationName' ? 'g-combobox-arrive' : k === 'animationDuration' ? '0.3s' : t[k]) })
      }
      return cs
    })
  }
  const pickFirst = async (st, w) => {
    await typeText(w, 'cefa')
    await key(w, 'Enter')
    await flush()
    await flush()
  }

  it('sin animación calculada (jsdom, reduced motion): la clase se retira en el acto', async () => {
    const st = reactive({ v: null })
    const w = await host('<GCombobox id="c" label="Dx" v-model="st.v" :labels="L" :options="DX" :delay="0" />', () => ({ st, L: LABELS, DX }))
    await pickFirst(st, w)
    expect(st.v).toBe('R51')
    expect(w.find('.g-combobox__token').exists()).toBe(true)
    expect(w.find('.g-combobox__token').classes()).not.toContain('is-arriving')
    expect(w.find('.g-combobox__token').attributes('style') || '').not.toContain('--_travel')
  })

  it('con animación: is-arriving y el vector --_travel-x/y; se retira en animationend de g-combobox-arrive…', async () => {
    fakeAnimation()
    const st = reactive({ v: null })
    const w = await host('<GCombobox id="c" label="Dx" v-model="st.v" :labels="L" :options="DX" :delay="0" />', () => ({ st, L: LABELS, DX }))
    await pickFirst(st, w)
    const t = w.find('.g-combobox__token')
    expect(t.classes()).toContain('is-arriving')
    expect(t.attributes('style')).toMatch(/--_travel-x: -?[\d.]+px; --_travel-y: -?[\d.]+px/)
    const other = new Event('animationend', { bubbles: true })
    other.animationName = 'otra'
    t.element.dispatchEvent(other)
    await flush()
    expect(t.classes()).toContain('is-arriving')
    const end = new Event('animationend', { bubbles: true })
    end.animationName = 'g-combobox-arrive-spring'
    t.element.dispatchEvent(end)
    await flush()
    expect(w.find('.g-combobox__token').classes()).not.toContain('is-arriving')
    expect(w.find('.g-combobox__token').attributes('style') || '').not.toContain('--_travel')
  })

  it('no viaja al cargar con valor, al cambiar modelValue desde la aplicación ni al elegir desde la superficie', async () => {
    fakeAnimation()
    const st = reactive({ v: 'I10', ap: 'field' })
    const w = await host('<GCombobox id="c" label="Dx" v-model="st.v" :appearance="st.ap" :labels="L" :options="DX" :delay="0" />', () => ({ st, L: LABELS, DX }))
    expect(w.find('.g-combobox__token').classes()).not.toContain('is-arriving')
    st.v = 'R51'
    await flush()
    expect(w.find('.g-combobox__token').classes()).not.toContain('is-arriving')
    st.ap = 'palette'
    await flush()
    await key(w, 'd')
    await key(w, 'Enter', {}, w.find('.g-combobox__search-field'))
    await flush()
    expect(st.v).toBe('E10.9')
    expect(w.find('.g-combobox__token').classes()).not.toContain('is-arriving')
  })
})

describe('GCombobox · la lista no salta ni cambia de lado (reporte del usuario)', () => {
  // Rectángulos simulados: las filas miden 100 de alto y el panel enseña 300
  function fakeList(w) {
    const panel = w.find('.g-combobox__panel').element
    let top = 0
    Object.defineProperty(panel, 'scrollTop', { configurable: true, get: () => top, set: (v) => { top = v } })
    panel.getBoundingClientRect = () => ({ top: 0, bottom: 300, left: 0, right: 200, width: 200, height: 300 })
    rows(w).forEach((r, i) => { r.element.getBoundingClientRect = () => ({ top: i * 100 - top, bottom: i * 100 + 100 - top, left: 0, right: 200, width: 200, height: 100 }) })
    return panel
  }

  it('la activación por puntero no desplaza la lista; la del teclado sí la lleva a la vista', async () => {
    const w = await mk({ options: MANY, limit: 10 })
    await key(w, 'ArrowDown', { altKey: true })
    const panel = fakeList(w)
    const partly = rows(w)[3].element // asoma por el borde inferior (300 a 400)
    pointerOver(partly)
    await flush()
    expect(activeEl(w)).toBe(partly)
    expect(panel.scrollTop, 'el puntero no desplaza').toBe(0)
    await key(w, 'ArrowDown')
    expect(activeEl(w)).toBe(rows(w)[4].element)
    expect(panel.scrollTop, 'el teclado sí').toBe(200)
    // Un cambio de resultados también lleva la activa a la vista
    await key(w, 'PageDown')
    expect(panel.scrollTop).toBeGreaterThan(200)
  })

  it('un resultado que aparece bajo el puntero quieto no roba la activa al teclado', async () => {
    const w = await mk({ options: PEOPLE })
    await typeText(w, 'mar')
    expect(activeEl(w).textContent).toContain('001000')
    const other = rows(w)[2].element
    other.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 50, clientY: 250 })) // sintético, sin movimiento
    other.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 50, clientY: 250 }))
    await flush()
    expect(activeEl(w).textContent).toContain('001000')
    await key(w, 'Enter')
    expect(emitted(w, 'update:modelValue')).toEqual(['p1'])
  })

  // Visor de 329 de alto; la caja mide 40 y su borde superior está en `top.v`
  async function placed(start) {
    vi.useFakeTimers()
    vi.stubGlobal('innerHeight', 329)
    window.innerHeight = 329
    const top = { v: start }
    const w = await mk({ options: MANY, limit: 10 })
    const box = w.find('.g-input__control').element
    box.getBoundingClientRect = () => ({ top: top.v, bottom: top.v + 40, left: 20, right: 260, width: 240, height: 40 })
    const pop = w.find('.g-combobox__popup').element
    Object.defineProperty(pop.querySelector('.g-combobox__panel'), 'scrollHeight', { configurable: true, value: 1000 })
    const v = (n) => pop.style.getPropertyValue(n)
    const scrollTo = async (y, target = document) => {
      top.v = y
      target.dispatchEvent(new Event('scroll', { bubbles: target !== document }))
      vi.advanceTimersByTime(20)
      await flush()
    }
    await key(w, 'ArrowDown')
    return { w, pop, v, scrollTo, top }
  }

  it('el lado se decide al abrir y se conserva: en la franja del cruce no alterna (histéresis)', async () => {
    const { w, v, scrollTo } = await placed(150) // arriba 142, abajo 131: abre hacia arriba
    expect(root(w).classes()).toContain('is-up')
    expect(v('--_top')).toBe('auto')
    expect(v('--_bottom')).toBe('139px')
    let flips = 0
    let was = true
    for (const y of [148, 146, 145, 144, 142, 140, 142, 145, 148, 150, 152, 150, 145]) {
      await scrollTo(y)
      const now = root(w).classes().includes('is-up')
      if (now !== was) flips++
      was = now
    }
    expect(flips, 'ningún cambio de lado en el vaivén alrededor del cruce').toBe(0)
    // Solo cambia cuando el otro lado ofrece claramente más (space × 12 = 48) y el actual ya no es útil (< space × 40)
    await scrollTo(110) // arriba 102, abajo 171: 171 ≥ 102 + 48
    expect(root(w).classes()).not.toContain('is-up')
    expect(v('--_top')).toBe('110px')
    expect(v('--_bottom')).toBe('auto')
    await scrollTo(130) // de vuelta: arriba 122, abajo 151; no vuelve a cambiar
    expect(root(w).classes()).not.toContain('is-up')
  })

  it('--_max se fija al abrir: durante el desplazamiento solo cambia la posición, una vez por cuadro', async () => {
    const { w, pop, v, scrollTo, top } = await placed(20) // abajo 261
    expect(root(w).classes()).not.toContain('is-up')
    expect(v('--_max')).toBe('261px')
    expect([v('--_x'), v('--_w'), v('--_field-h'), v('--_top')]).toEqual(['20px', '240px', '40px', '20px'])
    const set = vi.spyOn(pop.style, 'setProperty')
    for (const y of [24, 28, 32, 36, 40]) {
      await scrollTo(y)
      expect(v('--_max'), `--_max a ${y}`).toBe('261px')
      expect(v('--_top')).toBe(`${y}px`)
    }
    expect(set.mock.calls.every((c) => c[0] === '--_top'), 'solo se escribe lo que cambia').toBe(true)
    expect(set.mock.calls.length).toBe(5)
    // Varios eventos en el mismo cuadro: una sola escritura
    set.mockClear()
    top.v = 44
    document.dispatchEvent(new Event('scroll'))
    top.v = 48
    document.dispatchEvent(new Event('scroll'))
    vi.advanceTimersByTime(20)
    expect(set.mock.calls).toEqual([['--_top', '48px']])
    // El render no borra las variables (no hay atributo style gestionado por Vue)
    await typeText(w, 'insumo 00')
    expect(v('--_x')).toBe('20px')
    // Cambiar los resultados y resize sí vuelven a medir el alto
    expect(v('--_max')).toBe('233px')
    top.v = 60
    window.dispatchEvent(new Event('resize'))
    expect(v('--_max')).toBe('221px')
  })

  it('si la caja sale del visor o de su contenedor con desplazamiento, la lista se cierra; el panel propio no cuenta', async () => {
    const { w, scrollTo, pop } = await placed(20)
    await scrollTo(22, pop.querySelector('.g-combobox__panel')) // el propio panel se desplaza: nada
    expect(field(w).attributes('aria-expanded')).toBe('true')
    await scrollTo(-41)
    expect(field(w).attributes('aria-expanded')).toBe('false')
    expect(emitted(w, 'close').length).toBe(1)
    const wrap = document.createElement('div')
    const { w: w2, scrollTo: scroll2 } = await placed(20)
    w2.element.parentElement.insertBefore(wrap, w2.element)
    wrap.appendChild(w2.element)
    wrap.getBoundingClientRect = () => ({ top: 100, bottom: 300, left: 0, right: 400, width: 400, height: 200 })
    await scroll2(120, wrap)
    expect(field(w2).attributes('aria-expanded')).toBe('true')
    await scroll2(50, wrap) // la caja (50 a 90) queda por encima del contenedor (desde 100)
    expect(field(w2).attributes('aria-expanded')).toBe('false')
  })
})

describe('GCombobox · avisos de desarrollo (1 a 11)', () => {
  it('1 · sin nombre accesible', async () => {
    await mk({ label: undefined })
    expect(warnings().some((t) => t.includes('nombre accesible'))).toBe(true)
  })
  it('2 · labels.close al montar; los demás, la primera vez que se necesitan', async () => {
    const w = await mk({ labels: {} })
    expect(warnings().some((t) => t.includes('labels.close'))).toBe(true)
    expect(warnings().some((t) => t.includes('labels.noResults'))).toBe(false)
    await typeText(w, 'zzz')
    expect(warnings().some((t) => t.includes('labels.noResults'))).toBe(true)
  })
  it('una vez por instancia y motivo', async () => {
    const w = await mk({ labels: {} })
    await typeText(w, 'zzz')
    await typeText(w, 'zzzz')
    expect(warnings().filter((t) => t.includes('labels.noResults')).length).toBe(1)
  })
  it('6 · allowCustom con name y sin customName', async () => {
    await mk({ allowCustom: true, name: 'x' })
    expect(warnings().some((t) => t.includes('no viaja en FormData'))).toBe(true)
  })
  it('9 · multiple se ignora con aviso; slot preview con appearance="field"', async () => {
    const w = await mk({}, { attrs: { multiple: true }, slots: { preview: () => 'x' } })
    expect(warnings().some((t) => t.includes('multiple está reservado'))).toBe(true)
    expect(warnings().some((t) => t.includes('el slot preview solo se pinta'))).toBe(true)
    expect(field(w).attributes('multiple')).toBeUndefined()
  })
  it('10 · dentro de un GInputGroup', async () => {
    await host('<GInputGroup label="CP"><GCombobox label="Colonia" :labels="L" :options="[]" /></GInputGroup>', () => ({ L: LABELS }))
    expect(warnings().some((t) => t.includes('GInputGroup'))).toBe(true)
  })
  it('11 · limit, delay o minChars fuera de rango: aviso y valor por defecto', async () => {
    const w = await mk({ options: MANY, limit: 0, delay: -5, minChars: -1 })
    expect(warnings().filter((t) => /limit|delay|minChars/.test(t)).length).toBe(3)
    await key(w, 'ArrowDown')
    expect(w.findAll('.g-combobox__option:not(.g-combobox__action)').length).toBe(50)
  })
  it('sin avisos con una configuración completa', async () => {
    const w = await mk({ name: 'dx', clearable: true, modelValue: 'I10' })
    await typeText(w, 'zzz')
    expect(warnings()).toEqual([])
  })
})
