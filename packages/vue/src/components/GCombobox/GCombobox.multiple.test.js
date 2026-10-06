// GCombobox · Fase 2 (`multiple`) · design/contracts/combobox.md «Fase 2 · Verificación · bruno» (DECISIONS.md #417 a
// #428). La Fase 1 sin `multiple` la vigilan GCombobox.test.js y GCombobox.ssr.test.js (sin cambios de comportamiento).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, nextTick, reactive } from 'vue'
import GCombobox from './GCombobox.vue'
import GDialog from '../GDialog/GDialog.vue'
import GForm from '../GForm/GForm.vue'

const sel = (n) => (n === 1 ? '1 seleccionada' : `${n} seleccionadas`)
const LABELS = {
  clear: 'Quitar todas', close: 'Cerrar', loading: 'Buscando…', noResults: 'Sin resultados para «{text}»', results: (n) => `${n} resultados`,
  more: 'Mostrar más ({shown} de {total})', retry: 'Reintentar', useCustom: 'Usar «{text}» como texto libre', custom: 'Texto libre', create: 'Agregar «{text}»…',
  surfaceTitle: 'Buscar', selected: sel, about: (n, list) => `${sel(n)}: ${list}`, customItem: '{text} (texto libre)',
  added: (l, n) => `Se agregó ${l}. ${sel(n)}.`, removed: 'Se quitó {label}. Quedan {count}.', restored: 'Se restauró {label}', clearedAll: 'Se quitaron {count}',
  restoredAll: (n) => `Se restauraron ${n}`, armed: 'Otra vez para quitar {label}', already: '{label} ya está elegida', max: 'Máximo {max}', ofMax: '{count} de {max}',
  chosen: 'Elegidas', rest: '{count} más', showAll: (n) => `Ver las ${n}`, showLess: 'Ver menos', done: 'Listo', remove: 'Quitar {label}', undo: 'Deshacer',
  trace: '{label} quitada', fresh: 'Nueva', basketEmpty: 'Aún no hay ninguna.'
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
const ALG = [{ value: 'pen', label: 'Penicilina' }, { value: 'lat', label: 'Látex' }, { value: 'ibu', label: 'Ibuprofeno' }, { value: 'kiwi', label: 'Kiwi' }, { value: 'nap', label: 'Naproxeno' }]
const MANY = Array.from({ length: 60 }, (_, i) => ({ value: 'b' + i, label: `Insumo ${String(i + 1).padStart(3, '0')}` }))

const mounted = []
let warn
beforeEach(() => {
  document.documentElement.lang = 'es' // Intl.ListFormat y las cifras toman el lang del ancestro más cercano
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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
/** Monta con v-model real (las props siguen a lo emitido), como lo usaría una aplicación */
async function mk(props = {}, opts = {}) {
  const w = mount(GCombobox, {
    props: {
      multiple: true, label: 'Alergias', labels: LABELS, options: ALG, delay: 0, modelValue: [],
      'onUpdate:modelValue': (v) => w.setProps({ modelValue: v }),
      'onUpdate:custom': (v) => w.setProps({ custom: v }),
      ...props
    },
    attachTo: document.body,
    ...opts
  })
  mounted.push(w)
  await flush()
  return w
}
async function host(template, setup = () => ({}), components = {}) {
  const w = mount(defineComponent({ components: { GCombobox, GDialog, GForm, ...components }, setup, template }), { attachTo: document.body })
  mounted.push(w)
  await flush()
  return w
}
const field = (w) => w.find('input.g-combobox__field')
const root = (w) => w.find('.g-combobox')
const opts = (w) => w.findAll('[role="option"]:not(.g-combobox__action)')
const emitted = (w, name) => (w.emitted(name) || []).map((e) => e[0])
const warnings = () => warn.mock.calls.map((c) => String(c[0])).filter((t) => t.startsWith('[Grana GCombobox]'))
const hidden = (w, name) => w.findAll(`input[type="hidden"][name="${name}"]`).map((h) => h.element.value)
const activeEl = (w, f = field(w)) => { const id = f.attributes('aria-activedescendant'); return id ? document.getElementById(id) : null }
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
/** Último anuncio de la región viva visible (la de la superficie si está abierta) */
async function live(w) {
  await sleep(70)
  await flush()
  const open = w.find('dialog[open]')
  return (open.exists() ? open.find('.g-combobox__live') : w.find('.g-combobox__live')).text()
}
const mobile = (matches = true) => {
  const listeners = []
  const mq = { matches, addEventListener: (_, fn) => listeners.push(fn), removeEventListener: () => {} }
  vi.stubGlobal('matchMedia', () => mq)
  window.matchMedia = () => mq
  return { mq, fire(v) { mq.matches = v; listeners.forEach((fn) => fn({ matches: v })) } }
}

describe('GCombobox multiple · modelo y orden (#420)', () => {
  it('null, undefined y \'\' cuentan como [] sin aviso; un no arreglo cuenta como [v] con aviso; un repetido se pinta y se envía una vez', async () => {
    for (const v of [null, undefined, '']) {
      const w = await mk({ modelValue: v, name: 'a' })
      expect(hidden(w, 'a')).toEqual([])
      expect(root(w).classes()).not.toContain('has-chosen')
    }
    expect(warnings()).toEqual([])
    const w = await mk({ modelValue: 'pen', name: 'a' })
    expect(hidden(w, 'a')).toEqual(['pen'])
    expect(warnings().some((t) => t.includes('son arreglos'))).toBe(true)
    const w2 = await mk({ modelValue: ['pen', 'lat', 'pen'], name: 'b' })
    expect(hidden(w2, 'b')).toEqual(['pen', 'lat'])
    expect(w2.find('.g-combobox__about').text()).toBe('2 seleccionadas: Penicilina y Látex')
    expect(warnings().some((t) => t.includes('repetido'))).toBe(true)
  })

  it('valor sin opción conocida: se pinta con String(value), se puede quitar y se envía (aviso 14); selectedOptions lo resuelve', async () => {
    const w = await mk({ modelValue: ['pen', 77], name: 'a' })
    expect(hidden(w, 'a')).toEqual(['pen', '77'])
    expect(w.find('.g-combobox__about').text()).toBe('2 seleccionadas: Penicilina y 77')
    expect(w.find('.g-combobox__sentence').text()).toBe('Penicilina y 77')
    expect(warnings().some((t) => t.includes('sin opción conocida'))).toBe(true)
    await key(w, 'Backspace')
    await key(w, 'Backspace')
    expect(emitted(w, 'update:modelValue').at(-1)).toEqual(['pen'])
    const w2 = await mk({ modelValue: ['zz'], selectedOptions: [{ value: 'zz', label: 'Zinc', code: 'Z1' }, { value: 'no', label: 'Ajena' }] })
    expect(w2.find('.g-combobox__about').text()).toBe('1 seleccionada: Z1 Zinc')
    expect(w2.find('.g-combobox__sentence').text(), 'en la frase, el código').toBe('Z1')
  })

  it('custom: textos recortados y sin duplicar (sin acentos ni mayúsculas, aviso); sin allowCustom se ignora con aviso', async () => {
    const w = await mk({ allowCustom: true, custom: [' Polen ', 'polen', 'Moho', ''], customName: 'l' })
    expect(hidden(w, 'l')).toEqual(['Polen', 'Moho'])
    expect(warnings().some((t) => t.includes('repetido'))).toBe(true)
    const w2 = await mk({ custom: ['Polen'], customName: 'l2' })
    expect(hidden(w2, 'l2')).toEqual([])
    expect(warnings().some((t) => t.includes('sin allowCustom'))).toBe(true)
  })

  it('orden: los valores en su orden y después los textos libres, en la frase, ID-about y el envío', async () => {
    const w = await mk({ modelValue: ['lat', 'pen'], allowCustom: true, custom: ['Moho'], name: 'a', customName: 'l' })
    expect(w.find('.g-combobox__sentence').text()).toBe('Látex, Penicilina y Moho')
    expect(w.find('.g-combobox__about').text()).toBe('3 seleccionadas: Látex, Penicilina y Moho (texto libre)')
    const all = w.findAll('input[type="hidden"]').map((h) => `${h.attributes('name')}=${h.element.value}`)
    expect(all).toEqual(['a=lat', 'a=pen', 'l=Moho'])
    expect(w.find('.g-combobox__sentence-item.is-custom .g-combobox__sentence-icon svg').exists(), 'texto libre: lápiz').toBe(true)
  })
})

describe('GCombobox multiple · envío y change (#421)', () => {
  it('un oculto por valor; ninguno sin elegidos; form a todos; deshabilitado no se envía; solo lectura sí', async () => {
    const w = await mk({ modelValue: ['pen', 'lat'], name: 'a', allowCustom: true, custom: ['X'], customName: 'l' }, { attrs: { form: 'f1' } })
    expect(w.findAll('input[type="hidden"]').every((h) => h.attributes('form') === 'f1')).toBe(true)
    expect(field(w).attributes('name')).toBeUndefined()
    const w2 = await mk({ modelValue: [], name: 'a' })
    expect(w2.findAll('input[type="hidden"]').length).toBe(0)
    const st = reactive({ a: ['pen', 'lat'], b: ['ibu'] })
    const h = await host('<form id="f"><GCombobox multiple label="A" name="a" v-model="st.a" :labels="L" :options="O" readonly /><GCombobox multiple label="B" name="b" v-model="st.b" :labels="L" :options="O" disabled /></form>', () => ({ st, L: LABELS, O: ALG }))
    const fd = new FormData(h.find('form').element)
    expect(fd.getAll('a')).toEqual(['pen', 'lat'])
    expect(fd.getAll('b')).toEqual([])
  })

  it('un gesto: update:* (arreglos nuevos, sin mutar la prop) y después un change con { value, custom, options, added, removed }', async () => {
    const mv = ['pen']
    const order = []
    const w = await mk({ modelValue: mv, allowCustom: true, custom: [], 'onUpdate:modelValue': (v) => { order.push('m'); w.setProps({ modelValue: v }) }, onChange: () => order.push('c') })
    await typeText(w, 'látex')
    await key(w, 'Enter')
    expect(mv).toEqual(['pen'])
    const v = emitted(w, 'update:modelValue')
    expect(v).toEqual([['pen', 'lat']])
    expect(v[0]).not.toBe(mv)
    expect(emitted(w, 'update:custom')).toEqual([])
    expect(order).toEqual(['m', 'c'])
    const ch = emitted(w, 'change')
    expect(ch.length).toBe(1)
    expect(ch[0]).toEqual({ value: ['pen', 'lat'], custom: [], options: [ALG[0], ALG[1]], added: [{ value: 'lat', custom: '', option: ALG[1] }], removed: [] })
    // Texto libre: solo update:custom
    await typeText(w, 'Moho')
    const row = w.find('.g-combobox__action--custom')
    expect(row.exists()).toBe(true)
    await key(w, 'ArrowDown')
    await key(w, 'Enter')
    expect(emitted(w, 'update:custom')).toEqual([['Moho']])
    expect(emitted(w, 'update:modelValue').length).toBe(1)
    expect(emitted(w, 'change')[1]).toMatchObject({ added: [{ value: null, custom: 'Moho', option: null }], removed: [] })
    // Un cambio desde la aplicación no emite
    await w.setProps({ modelValue: ['ibu'] })
    await flush()
    expect(emitted(w, 'change').length).toBe(2)
  })

  it('GForm: registra por name y cada gesto llama una vez a notifyChange (sube dirty)', async () => {
    const st = reactive({ v: [], dirty: false })
    const w = await host('<GForm v-model:dirty="st.dirty" :labels="FL" aria-label="F"><GCombobox multiple id="c" label="A" name="a" v-model="st.v" :labels="L" :options="O" :delay="0" /></GForm>',
      () => ({ st, L: LABELS, O: ALG, FL: { optional: '(opcional)', error: 'Error: ' } }))
    await key(w, 'ArrowDown')
    st.dirty = false
    await key(w, 'Enter')
    expect(st.v).toEqual(['pen'])
    expect(st.dirty).toBe(true)
  })
})

describe('GCombobox multiple · teclado (#418, #419)', () => {
  it('Intro alterna: la lista sigue abierta, la activa no se mueve y el texto buscado queda seleccionado; el clic alterna igual', async () => {
    const w = await mk()
    await typeText(w, 'pen')
    expect(activeEl(w).textContent).toContain('Penicilina')
    await key(w, 'Enter')
    expect(w.props('modelValue')).toEqual(['pen'])
    expect(field(w).attributes('aria-expanded')).toBe('true')
    expect(activeEl(w).textContent).toContain('Penicilina')
    expect(activeEl(w).getAttribute('aria-selected')).toBe('true')
    const el = field(w).element
    await flush()
    expect([el.selectionStart, el.selectionEnd, el.value]).toEqual([0, 3, 'pen'])
    // Activada por la persona (puntero o flechas): Intro desmarca
    await key(w, 'ArrowDown')
    await key(w, 'ArrowUp')
    await key(w, 'Enter')
    expect(w.props('modelValue')).toEqual([])
    await activeEl(w).click()
    await flush()
    expect(w.props('modelValue')).toEqual(['pen'])
  })

  it('Intro sobre una elegida que quedó activa sola no la quita: lo dice y selecciona el texto; con búsqueda pendiente no hace nada', async () => {
    const w = await mk({ modelValue: ['pen'] })
    await typeText(w, 'pen')
    await key(w, 'Enter')
    expect(w.props('modelValue')).toEqual(['pen'])
    expect(emitted(w, 'change')).toEqual([])
    expect(await live(w)).toBe('Penicilina ya está elegida')
    // Remoto con búsqueda pendiente: Intro no hace nada sobre la resaltada sola
    const w2 = await mk({ filter: false, options: ALG, delay: 0, modelValue: [] })
    await typeText(w2, 'ibu')
    await w2.setProps({ options: [ALG[2]] }) // la aplicación responde: se asienta con la primera activa sola
    await flush()
    expect(activeEl(w2)).not.toBeNull()
    await w2.setProps({ loading: true }) // y vuelve a buscar: pendiente
    await flush()
    await key(w2, 'Enter')
    expect(emitted(w2, 'update:modelValue')).toEqual([])
  })

  it('Tab nunca elige (tampoco el texto fantasma único) y salir descarta el texto a medio escribir', async () => {
    const w = await mk({ allowCustom: true })
    await typeText(w, 'kiw')
    expect(w.find('.g-combobox__ghost-rest').text()).toBe('i')
    await key(w, 'Tab')
    field(w).element.blur()
    await field(w).trigger('blur')
    await flush()
    expect(emitted(w, 'update:modelValue')).toEqual([])
    expect(emitted(w, 'update:custom')).toEqual([])
    expect(field(w).element.value).toBe('')
  })

  it('Espacio escribe (no marca); Esc con la lista cerrada vacía el texto sin propagar; IME: ninguna tecla actúa', async () => {
    const w = await mk()
    await typeText(w, 'pen')
    const ev = await key(w, ' ')
    expect(ev.defaultPrevented).toBe(false)
    expect(emitted(w, 'update:modelValue')).toEqual([])
    await key(w, 'Escape')
    expect(field(w).attributes('aria-expanded')).toBe('false')
    const outer = vi.fn()
    document.body.addEventListener('keydown', outer)
    await key(w, 'Escape')
    expect(field(w).element.value).toBe('')
    expect(outer).not.toHaveBeenCalled()
    document.body.removeEventListener('keydown', outer)
    await typeText(w, 'pen')
    await key(w, 'Enter', { isComposing: true })
    expect(emitted(w, 'update:modelValue')).toEqual([])
  })

  it('Retroceso en dos tiempos: marca y lo dice; la segunda quita; otra tecla, el puntero o un cambio del modelo desarman; sostenido no hace nada', async () => {
    const w = await mk({ modelValue: ['pen', 'lat'] })
    field(w).element.focus()
    const ev = await key(w, 'Backspace')
    expect(ev.defaultPrevented).toBe(true)
    expect(w.props('modelValue')).toEqual(['pen', 'lat'])
    expect(w.find('.g-combobox__sentence-item.is-armed').text()).toBe('Látex')
    expect(await live(w)).toBe('Otra vez para quitar Látex')
    await key(w, 'Shift')
    expect(w.find('.is-armed').exists(), 'otra tecla desarma').toBe(false)
    await key(w, 'Backspace')
    root(w).element.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await flush()
    expect(w.find('.is-armed').exists(), 'el puntero desarma').toBe(false)
    await key(w, 'Backspace')
    await w.setProps({ modelValue: ['pen', 'lat', 'ibu'] })
    await flush()
    expect(w.find('.is-armed').exists(), 'un cambio del modelo desarma').toBe(false)
    await key(w, 'Backspace', { repeat: true })
    await key(w, 'Backspace', { repeat: true })
    expect(w.find('.is-armed').exists(), 'sostenido no marca').toBe(false)
    expect(w.props('modelValue').length).toBe(3)
    await key(w, 'Backspace')
    await key(w, 'Backspace', { repeat: true })
    expect(w.props('modelValue').length, 'ni quita').toBe(3)
    await key(w, 'Backspace')
    expect(w.props('modelValue')).toEqual(['pen', 'lat'])
    expect(await live(w)).toBe('Se quitó Ibuprofeno. Quedan 2.')
    // Con texto, Retroceso edita
    await typeText(w, 'x')
    const ev2 = await key(w, 'Backspace')
    expect(ev2.defaultPrevented).toBe(false)
  })

  it('Ctrl/⌘+Z de un nivel devuelve lo quitado a su posición; caduca al escribir, con otro gesto o si la aplicación cambia el modelo', async () => {
    const w = await mk({ modelValue: ['pen', 'lat', 'ibu'] })
    await key(w, 'ArrowDown') // activa la primera de «Elegidas» (Penicilina)
    await key(w, 'Enter')
    expect(w.props('modelValue')).toEqual(['lat', 'ibu'])
    const z = await key(w, 'z', { ctrlKey: true })
    expect(z.defaultPrevented).toBe(true)
    expect(w.props('modelValue')).toEqual(['pen', 'lat', 'ibu'])
    expect(await live(w)).toBe('Se restauró Penicilina')
    expect(emitted(w, 'change').at(-1)).toMatchObject({ added: [{ value: 'pen' }], removed: [] })
    const z2 = await key(w, 'z', { metaKey: true })
    expect(z2.defaultPrevented, 'un nivel: ya no hay nada que deshacer').toBe(false)
    // Caduca al escribir
    await key(w, 'Enter')
    await typeText(w, 'k')
    expect((await key(w, 'z', { ctrlKey: true })).defaultPrevented).toBe(false)
    expect(w.props('modelValue')).toEqual(['lat', 'ibu'])
    // Caduca con otro gesto
    await typeText(w, '')
    await key(w, 'Backspace')
    await key(w, 'Backspace')
    expect(w.props('modelValue')).toEqual(['lat'])
    await typeText(w, 'nap')
    await key(w, 'Enter')
    await typeText(w, '')
    expect((await key(w, 'z', { ctrlKey: true })).defaultPrevented).toBe(false)
    // Caduca si la aplicación cambia el modelo
    await key(w, 'Backspace')
    await key(w, 'Backspace')
    await w.setProps({ modelValue: ['kiwi'] })
    await flush()
    expect((await key(w, 'z', { ctrlKey: true })).defaultPrevented).toBe(false)
    // Ctrl+Mayús+Z no se intercepta
    await key(w, 'Backspace')
    await key(w, 'Backspace')
    expect((await key(w, 'Z', { ctrlKey: true, shiftKey: true })).defaultPrevented).toBe(false)
  })

  it('«Quitar todas» (clearable): un gesto con removed entero, lo anuncia, devuelve el foco y Ctrl+Z lo devuelve todo', async () => {
    const w = await mk({ modelValue: ['pen', 'lat'], clearable: true })
    const b = w.find('.g-combobox__clear')
    expect(b.find('.g-combobox__clear-text').text()).toBe('Quitar todas')
    expect(b.attributes('aria-labelledby')).toBe(`${b.attributes('id').replace(/-clear$/, '')}-clear-text ${b.attributes('id').replace(/-clear$/, '')}-label`)
    b.element.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }))
    await flush()
    expect(w.props('modelValue')).toEqual([])
    expect(emitted(w, 'change').at(-1).removed.map((x) => x.value)).toEqual(['pen', 'lat'])
    expect(document.activeElement).toBe(field(w).element)
    expect(await live(w)).toBe('Se quitaron 2')
    await key(w, 'z', { ctrlKey: true })
    expect(w.props('modelValue')).toEqual(['pen', 'lat'])
    expect(await live(w)).toBe('Se restauraron 2')
  })
})

describe('GCombobox multiple · tope (#422)', () => {
  it('lleno: is-full, no elegidas aria-disabled pero recorribles, estado del tope, Intro y clic no cambian y lo dicen; la fila de texto libre deshabilitada', async () => {
    const w = await mk({ modelValue: ['pen', 'lat'], max: 2, allowCustom: true })
    expect(root(w).classes()).toContain('is-full')
    await key(w, 'ArrowDown')
    const s = w.find('.g-combobox__status--max')
    expect(s.text()).toBe('Máximo 2')
    expect(s.find('svg').exists()).toBe(true)
    const rows = opts(w)
    expect(rows.filter((r) => r.attributes('aria-selected') === 'false').every((r) => r.attributes('aria-disabled') === 'true')).toBe(true)
    expect(rows.filter((r) => r.attributes('aria-selected') === 'true').every((r) => r.attributes('aria-disabled') === undefined)).toBe(true)
    for (let i = 0; i < 2; i++) await key(w, 'ArrowDown')
    expect(activeEl(w).textContent).toContain('Ibuprofeno')
    expect(activeEl(w).getAttribute('aria-disabled'), 'la no elegible se recorre').toBe('true')
    await key(w, 'Enter')
    expect(emitted(w, 'update:modelValue')).toEqual([])
    expect(await live(w)).toBe('Máximo 2')
    await w.find('[aria-disabled="true"][role="option"]').trigger('click')
    expect(emitted(w, 'update:modelValue')).toEqual([])
    await typeText(w, 'Moho')
    expect(w.find('.g-combobox__action--custom').attributes('aria-disabled')).toBe('true')
    // Las elegidas siguen activas para desmarcar
    await typeText(w, '')
    await key(w, 'ArrowDown')
    await key(w, 'Enter')
    expect(w.props('modelValue')).toEqual(['lat'])
    expect(root(w).classes()).not.toContain('is-full')
  })

  it('deshacer respeta el tope; más elegidos que max se pintan y envían enteros con aviso 16; max inválido, sin límite', async () => {
    const w = await mk({ modelValue: ['pen', 'lat'], max: 2 })
    await key(w, 'Backspace')
    await key(w, 'Backspace')
    await w.setProps({ max: 1 })
    await w.setProps({ modelValue: ['ibu'] })
    expect((await key(w, 'z', { ctrlKey: true })).defaultPrevented).toBe(false) // caducó con el cambio de la aplicación
    const w2 = await mk({ modelValue: ['pen', 'lat', 'ibu'], max: 2, name: 'a' })
    expect(hidden(w2, 'a')).toEqual(['pen', 'lat', 'ibu'])
    expect(warnings().some((t) => t.includes('se pintan y se envían todos'))).toBe(true)
    expect(GCombobox.props.max.validator(0)).toBe(false)
    const w3 = await mk({ modelValue: ['pen'], max: 0 })
    expect(root(w3).classes()).not.toContain('is-full')
    expect(warnings().some((t) => t.includes('max 0'))).toBe(true)
  })

  it('el tope que la aplicación bajó: Ctrl+Z no restaura y dice el tope', async () => {
    const w = await mk({ modelValue: ['pen', 'lat'], max: 3 })
    await key(w, 'Backspace')
    await key(w, 'Backspace')
    expect(w.props('modelValue')).toEqual(['pen'])
    await w.setProps({ max: 1 })
    await flush()
    await key(w, 'z', { ctrlKey: true })
    expect(w.props('modelValue')).toEqual(['pen'])
    expect(await live(w)).toBe('Máximo 1')
  })
})

describe('GCombobox multiple · «Elegidas» (#425) y semántica (#418)', () => {
  it('al abrir con el texto vacío: primer grupo con nombre y recuento; ids propios; no se repiten en el catálogo; instantánea', async () => {
    const w = await mk({ modelValue: ['lat', 'pen'] })
    await key(w, 'ArrowDown')
    const list = w.find('[role="listbox"]')
    expect(list.attributes('aria-multiselectable')).toBe('true')
    const g = w.find('.g-combobox__group.is-chosen')
    const gid = g.attributes('aria-labelledby')
    expect(document.getElementById(gid).textContent).toBe('Elegidas 2')
    expect(g.find('.g-combobox__group-tally .g-combobox__num').text()).toBe('2')
    expect(g.findAll('[role="option"]').map((o) => o.attributes('id'))).toEqual([`${field(w).attributes('id')}-opt-c0`, `${field(w).attributes('id')}-opt-c1`])
    expect(opts(w).map((o) => o.find('.g-summary__title').text())).toEqual(['Látex', 'Penicilina', 'Ibuprofeno', 'Kiwi', 'Naproxeno'])
    expect(opts(w).every((o) => ['true', 'false'].includes(o.attributes('aria-selected')))).toBe(true)
    expect(opts(w).every((o) => o.element.firstElementChild.matches('.g-combobox__box[aria-hidden="true"]') && o.find('.g-combobox__box svg').exists())).toBe(true)
    expect(w.find('.g-combobox__check').exists()).toBe(false)
    // Desmarcar deja la fila en su sitio; marcar otra la marca donde está
    await key(w, 'Enter') // la activa es Látex (↓ desde cerrada: la primera)
    expect(opts(w).map((o) => o.attributes('aria-selected'))).toEqual(['false', 'true', 'false', 'false', 'false'])
    expect(document.getElementById(gid).textContent).toBe('Elegidas 1')
    // Al reabrir, la instantánea es nueva
    await key(w, 'Escape')
    await key(w, 'ArrowDown')
    expect(w.findAll('.g-combobox__group.is-chosen [role="option"]').length).toBe(1)
    // Con texto no hay «Elegidas»; al volver a vaciar, otra vez
    await typeText(w, 'a')
    expect(w.find('.g-combobox__group.is-chosen').exists()).toBe(false)
    expect(opts(w).find((o) => o.find('.g-summary__title').text() === 'Penicilina').attributes('aria-selected')).toBe('true')
    await typeText(w, '')
    expect(w.find('.g-combobox__group.is-chosen').exists()).toBe(true)
  })

  it('tope de 12 con «Ver las N» al final del grupo; ejecutarla pinta el resto y deja activa la fila 13', async () => {
    const w = await mk({ options: MANY, modelValue: MANY.slice(0, 20).map((o) => o.value) })
    await key(w, 'ArrowDown')
    const g = w.find('.g-combobox__group.is-chosen')
    expect(g.findAll('[role="option"]:not(.g-combobox__action)').length).toBe(12)
    const all = g.find('.g-combobox__action--all')
    expect(all.text()).toBe('Ver las 20')
    expect(all.attributes('aria-selected')).toBe('false')
    expect(all.element.parentElement).toBe(g.element)
    for (let i = 0; i < 12; i++) await key(w, 'ArrowDown')
    expect(activeEl(w)).toBe(all.element)
    await key(w, 'Enter')
    await flush()
    expect(w.findAll('.g-combobox__group.is-chosen [role="option"]').length).toBe(20)
    expect(field(w).attributes('aria-activedescendant')).toBe(`${field(w).attributes('id')}-opt-c12`)
  })

  it('sin «Elegidas» con selection="list" en field; en la hoja móvil, «Elegidas» en los tres', async () => {
    const w = await mk({ modelValue: ['pen'], selection: 'list' })
    await key(w, 'ArrowDown')
    expect(w.find('.g-combobox__group.is-chosen').exists()).toBe(false)
    expect(opts(w).find((o) => o.find('.g-summary__title').text() === 'Penicilina').attributes('aria-selected')).toBe('true')
    mobile(true)
    for (const p of [{ selection: 'list' }, { appearance: 'palette' }, {}]) {
      const m = await mk({ modelValue: ['pen'], ...p })
      await field(m).trigger('click')
      await flush()
      expect(m.find('dialog[open] .g-combobox__group.is-chosen').exists(), JSON.stringify(p)).toBe(true)
      expect(m.find('dialog .g-combobox__basket').exists()).toBe(false)
      expect(m.find('dialog .g-combobox__foot').exists()).toBe(true)
    }
  })

  it('ID-about: primero en aria-describedby; Intl.ListFormat del lang del ancestro; nombre = code + label; textos libres con customItem', async () => {
    const st = reactive({ v: ['E11.9', 'I10'], c: ['Gota'] })
    const w = await host('<div lang="en"><GCombobox multiple id="d" label="Dx" hint="Ayuda" v-model="st.v" v-model:custom="st.c" allow-custom :labels="L" :options="O" /></div>', () => ({ st, L: { ...LABELS, about: '{count}: {list}' }, O: DX }))
    await flush()
    expect(w.find('#d-about').text()).toBe('3: E11.9 Diabetes mellitus tipo 2, I10 Hipertensión esencial, and Gota (texto libre)')
    expect(w.find('#d').attributes('aria-describedby')).toBe('d-about d-hint')
    expect(w.find('.g-combobox__sentence').text(), 'la frase en el lang del ancestro, con los códigos').toBe('E11.9, I10, and Gota')
    // Sin labels.about: solo la lista, con aviso
    const w2 = await mk({ modelValue: ['pen'], labels: { ...LABELS, about: undefined } })
    expect(w2.find('.g-combobox__about').text()).toBe('Penicilina')
    expect(warnings().some((t) => t.includes('labels.about'))).toBe(true)
  })

  it('el <input> contiene siempre el texto de búsqueda: sin ficha ni is-token; placeholder fuera con la frase y dentro con la receta', async () => {
    const w = await mk({ modelValue: ['pen'] }, { attrs: { placeholder: 'Buscar' } })
    expect(root(w).classes()).not.toContain('is-token')
    expect(w.find('.g-combobox__token').exists()).toBe(false)
    expect(field(w).element.value).toBe('')
    expect(field(w).attributes('placeholder')).toBeUndefined()
    const w2 = await mk({ modelValue: ['pen'], selection: 'list' }, { attrs: { placeholder: 'Agregar…' } })
    expect(field(w2).attributes('placeholder')).toBe('Agregar…')
    const w3 = await mk({ modelValue: [] }, { attrs: { placeholder: 'Buscar' } })
    expect(field(w3).attributes('placeholder')).toBe('Buscar')
  })
})

describe('GCombobox multiple · B · la receta (#426) en el slot interno below de GInput (N5)', () => {
  it('al final de g-input__support, después del mensaje, sin aria-hidden ni aria-describedby; lista con nombre; renglones numerados', async () => {
    const w = await mk({ modelValue: ['E11.9', 'I10'], options: DX, selection: 'list', numbered: true, label: 'Dx', hint: 'Ayuda', error: 'Falta' })
    const sup = w.find('.g-input__support')
    const chosen = sup.element.lastElementChild
    expect(chosen.className).toBe('g-combobox__chosen')
    expect(chosen.previousElementSibling.classList.contains('g-input__message')).toBe(true)
    expect(chosen.closest('[aria-hidden]')).toBeNull()
    expect(field(w).attributes('aria-describedby')).not.toContain('rows')
    const ul = w.find('.g-combobox__rows')
    expect(ul.attributes('aria-labelledby')).toBe(`${field(w).attributes('id')}-label`)
    const rows = w.findAll('.g-combobox__row')
    expect(rows.map((r) => r.find('.g-combobox__row-number').text())).toEqual(['1', '2'])
    expect(rows[0].find('.g-summary__code').text()).toBe('E11.9')
    expect(rows[0].find('.g-combobox__remove').attributes('aria-label')).toBe('Quitar E11.9 Diabetes mellitus tipo 2')
    expect(w.find('.g-combobox__sentence').exists()).toBe(false)
  })

  it('quitar deja un rastro en el mismo sitio con el foco en «Deshacer»; «Deshacer» lo devuelve a su posición y el foco a su «Quitar»', async () => {
    const w = await mk({ modelValue: ['E11.9', 'I10', 'R51'], options: DX, selection: 'list', numbered: true })
    const uid = w.findAll('.g-combobox__row')[1].attributes('data-uid')
    await w.findAll('.g-combobox__remove')[1].trigger('click')
    await flush()
    expect(w.props('modelValue')).toEqual(['E11.9', 'R51'])
    const rows = w.findAll('.g-combobox__row')
    expect(rows.length).toBe(3)
    expect(rows[1].classes()).toContain('is-trace')
    expect(rows[1].attributes('data-uid')).toBe(uid)
    expect(rows[1].find('.g-combobox__trace').text()).toBe('I10 Hipertensión esencial quitada')
    expect(rows.filter((r) => !r.classes('is-trace')).map((r) => r.find('.g-combobox__row-number').text()), 'el número cuenta solo los vivos').toEqual(['1', '2'])
    const undo = rows[1].find('.g-combobox__undo')
    expect(document.activeElement).toBe(undo.element)
    expect(document.getElementById(undo.attributes('aria-describedby')).textContent).toBe('I10 Hipertensión esencial quitada')
    expect(undo.text()).toBe('Deshacer')
    expect(undo.find('svg').exists()).toBe(true)
    expect(await live(w)).toBe('Se quitó I10 Hipertensión esencial. Quedan 2.')
    await undo.trigger('click')
    await flush()
    expect(w.props('modelValue')).toEqual(['E11.9', 'I10', 'R51'])
    const back = w.findAll('.g-combobox__row')[1]
    expect(back.classes()).not.toContain('is-trace')
    expect(document.activeElement).toBe(back.find('.g-combobox__remove').element)
    expect(emitted(w, 'change').at(-1)).toMatchObject({ added: [{ value: 'I10' }], removed: [] })
  })

  it('pasada: lo agregado dice «Nueva»; salir no pliega; al volver a escribir tras salir, los rastros se retiran y «Nueva» también', async () => {
    const outside = document.createElement('button')
    document.body.append(outside)
    const w = await mk({ modelValue: ['E11.9'], options: DX, selection: 'list' })
    await typeText(w, 'I10')
    await key(w, 'Enter')
    const rows = () => w.findAll('.g-combobox__row')
    expect(rows()[1].classes()).toContain('is-fresh')
    expect(rows()[1].find('.g-combobox__row-fresh').text()).toBe('Nueva')
    await rows()[0].find('.g-combobox__remove').trigger('click')
    await flush()
    // Salir del componente
    const undo = rows()[0].find('.g-combobox__undo').element
    undo.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: outside }))
    outside.focus()
    await flush()
    expect(rows().length).toBe(2)
    expect(rows()[0].classes()).toContain('is-trace')
    // Enfocar no pliega; escribir sí
    field(w).element.focus()
    await flush()
    expect(rows().length).toBe(2)
    await typeText(w, 'c')
    expect(rows().length).toBe(1)
    expect(rows()[0].classes()).not.toContain('is-fresh')
  })

  it('tope de 6 en reposo más lo nuevo y lo marcado; «Ver los N» con aria-expanded y aria-controls; «Ver menos»', async () => {
    const w = await mk({ options: MANY, modelValue: MANY.slice(0, 9).map((o) => o.value), selection: 'list', labels: { ...LABELS, showAll: 'Ver los {count}' } })
    expect(w.findAll('.g-combobox__row').length).toBe(6)
    const b = w.find('.g-combobox__rows-all')
    expect(b.text()).toBe('Ver los 9')
    expect(b.attributes('aria-expanded')).toBe('false')
    expect(b.attributes('aria-controls')).toBe(w.find('.g-combobox__rows').attributes('id'))
    // El marcado por Retroceso (el último) se ve aunque esté pasado el tope
    field(w).element.focus()
    await key(w, 'Backspace')
    expect(w.findAll('.g-combobox__row').length).toBe(7)
    expect(w.findAll('.g-combobox__row').at(-1).classes()).toContain('is-armed')
    await key(w, 'Escape')
    await b.trigger('click')
    await flush()
    expect(w.findAll('.g-combobox__row').length).toBe(9)
    expect(w.find('.g-combobox__rows-all').text()).toBe('Ver menos')
    expect(w.find('.g-combobox__rows-all').attributes('aria-expanded')).toBe('true')
    // Lo nuevo de la pasada se ve siempre
    await w.find('.g-combobox__rows-all').trigger('click')
    await typeText(w, 'Insumo 050')
    await key(w, 'Enter')
    expect(w.findAll('.g-combobox__row').length).toBe(7)
    expect(w.findAll('.g-combobox__row').at(-1).classes()).toContain('is-fresh')
  })

  it('la aplicación cambia el modelo: rastros y «Nueva» se retiran sin animación; sin labels.undo/trace, quitar no deja rastro', async () => {
    const w = await mk({ modelValue: ['E11.9', 'I10'], options: DX, selection: 'list' })
    await w.findAll('.g-combobox__remove')[0].trigger('click')
    await flush()
    expect(w.find('.is-trace').exists()).toBe(true)
    await w.setProps({ modelValue: ['R51'] })
    await flush()
    expect(w.findAll('.g-combobox__row').length).toBe(1)
    expect(w.find('.is-trace').exists()).toBe(false)
    const w2 = await mk({ modelValue: ['E11.9', 'I10'], options: DX, selection: 'list', labels: { ...LABELS, undo: undefined } })
    expect(warnings().some((t) => t.includes('labels.undo y labels.trace'))).toBe(true)
    await w2.findAll('.g-combobox__remove')[0].trigger('click')
    await flush()
    expect(w2.findAll('.g-combobox__row').length).toBe(1)
    expect(document.activeElement).toBe(field(w2).element)
  })

  it('slot chosen ({ option, custom }) sustituye a la ficha; solo lectura y deshabilitado sin «Quitar» ni rastros', async () => {
    const w = await mk({ modelValue: ['I10'], options: DX, selection: 'list', allowCustom: true, custom: ['Gota'] }, {
      slots: { chosen: ({ option, custom }) => `«${option ? option.code : custom}»` }
    })
    expect(w.findAll('.g-combobox__row').map((r) => r.text())).toEqual(['«I10»', '«Gota»'])
    expect(w.findAll('.g-combobox__row')[1].classes()).toContain('is-custom')
    const w2 = await mk({ modelValue: ['I10'], options: DX, selection: 'list', readonly: true, clearable: true })
    expect(w2.find('.g-combobox__remove').exists()).toBe(false)
    expect(w2.find('.g-combobox__clear').exists()).toBe(false)
    expect(w2.find('.g-combobox__arrow').exists()).toBe(false)
    expect(w2.find('.g-combobox__about').text()).toBe('1 seleccionada: I10 Hipertensión esencial')
    await key(w2, 'ArrowDown')
    expect(field(w2).attributes('aria-expanded')).toBe('false')
  })
})

describe('GCombobox multiple · C · la cesta y la superficie (#424)', () => {
  it('paleta: elegir no cierra; cesta en el sitio de la vista previa; pie con recuento y «Listo» (GBtn del size); cerrar conserva', async () => {
    const w = await mk({ modelValue: ['pen'], appearance: 'palette', size: 'sm' }, { slots: { preview: () => 'x' } })
    expect(warnings().some((t) => t.includes('el slot preview no se pinta'))).toBe(true)
    await key(w, 'Enter')
    const d = w.find('dialog[open]')
    expect(d.exists()).toBe(true)
    const body = d.find('.g-combobox__surface-body')
    expect(body.classes()).toContain('has-basket')
    expect(body.classes()).not.toContain('has-preview')
    expect(d.find('.g-combobox__preview').exists()).toBe(false)
    const basket = d.find('section.g-combobox__basket')
    expect(document.getElementById(basket.attributes('aria-labelledby')).textContent).toBe('Elegidas 1 seleccionada')
    expect(basket.findAll('.g-combobox__row').length).toBe(1)
    const search = d.find('#' + field(w).attributes('id') + '-search')
    await typeText(w, 'lat', search)
    await key(w, 'Enter', {}, search)
    expect(w.props('modelValue')).toEqual(['pen', 'lat'])
    expect(w.find('dialog[open]').exists(), 'elegir no cierra').toBe(true)
    expect(await live(w)).toBe('Se agregó Látex. 2 seleccionadas.')
    expect(basket.findAll('.g-combobox__row').length).toBe(2)
    const foot = d.find('.g-combobox__foot')
    expect(foot.find('.g-combobox__foot-tally').text()).toBe('2 seleccionadas')
    const done = d.find('.g-combobox__done')
    expect(done.classes()).toEqual(expect.arrayContaining(['g-btn', 'g-btn--size-sm']))
    expect(d.find('.g-dialog__body').element.lastElementChild, 'el pie es el último hijo del cuerpo').toBe(foot.element)
    expect(done.text()).toBe('Listo')
    // Quitar en la cesta: rastro con el foco en «Deshacer»; Ctrl+Z en el campo de búsqueda
    await basket.findAll('.g-combobox__remove')[0].trigger('click')
    await flush()
    expect(basket.find('.is-trace').exists()).toBe(true)
    expect(document.activeElement.classList.contains('g-combobox__undo')).toBe(true)
    await key(w, 'z', { ctrlKey: true }, search)
    expect(w.props('modelValue')).toEqual(['pen', 'lat'])
    await key(w, 'Backspace', {}, search)
    await typeText(w, '', search)
    await key(w, 'Backspace', {}, search)
    expect(basket.find('.g-combobox__row.is-armed').exists(), 'Retroceso también en el campo de búsqueda').toBe(true)
    await done.trigger('click')
    await flush()
    expect(w.find('dialog[open]').exists()).toBe(false)
    expect(w.props('modelValue')).toEqual(['pen', 'lat'])
    expect(w.find('.g-combobox__sentence').text(), 'en reposo, la frase').toBe('Penicilina y Látex')
    // Reabrir: los rastros duraron hasta cerrar
    await key(w, 'Enter')
    expect(w.find('dialog[open] .is-trace').exists()).toBe(false)
  })

  it('la cesta vacía lo dice; homónimos: summaryDiff en los renglones de la cesta', async () => {
    const P = [{ value: 'u1', label: 'Ana López', facts: [{ label: 'Área', value: 'Urgencias' }] }, { value: 'u2', label: 'Ana López', facts: [{ label: 'Área', value: 'Pediatría' }] }]
    const w = await mk({ options: P, appearance: 'palette' })
    await key(w, 'Enter')
    expect(w.find('.g-combobox__basket-empty').text()).toBe('Aún no hay ninguna.')
    await w.setProps({ modelValue: ['u1', 'u2'] })
    await flush()
    expect(w.findAll('.g-combobox__basket .g-summary__fact.is-diff').length).toBe(2)
  })

  it('el anuncio va a la región de dentro de la superficie; un gesto sustituye al recuento de resultados pendiente', async () => {
    const w = await mk({ appearance: 'palette' })
    await key(w, 'p')
    const search = w.find('dialog[open] .g-combobox__search-field')
    await typeText(w, 'pen', search)
    await key(w, 'Enter', {}, search)
    await sleep(700)
    await flush()
    const lives = w.findAll('.g-combobox__live')
    expect(lives[1].element.closest('dialog')).not.toBeNull()
    expect(lives[1].text()).toBe('Se agregó Penicilina. 1 seleccionada.')
    expect(lives[0].text()).toBe('')
  })
})

describe('GCombobox multiple · movimiento (#427): clases solo tras un gesto', () => {
  it('sin animación calculada (jsdom, movimiento reducido) is-ticking, is-rolling e is-entering se retiran en el acto; nada al montar', async () => {
    const w = await mk({ modelValue: ['E11.9'], options: DX, selection: 'list' })
    expect(w.find('.is-ticking, .is-rolling, .is-entering').exists()).toBe(false)
    await typeText(w, 'I10')
    await key(w, 'Enter')
    await flush()
    expect(w.find('.is-ticking').exists()).toBe(false)
    expect(w.find('.is-rolling').exists()).toBe(false)
    expect(w.find('.is-entering').exists()).toBe(false)
  })

  it('con animación calculada, la clase se queda hasta su animationend (prefijo g-combobox-tick / -roll / -row)', async () => {
    const real = window.getComputedStyle
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el, p) => {
      const cs = real(el, p)
      const name = el.matches?.('.g-combobox__box.is-ticking') ? 'g-combobox-tick' : el.matches?.('.g-combobox__num.is-rolling') ? 'g-combobox-roll' : el.matches?.('.g-combobox__row.is-entering') ? 'g-combobox-row-in' : ''
      return name ? new Proxy(cs, { get: (t, k) => (k === 'animationName' ? name : k === 'animationDuration' ? '0.2s' : typeof t[k] === 'function' ? t[k].bind(t) : t[k]) }) : cs
    })
    const w = await mk({ modelValue: ['E11.9'], options: DX, selection: 'list' })
    await key(w, 'ArrowDown') // abre y activa la primera (E10.9, sin marcar)
    await key(w, 'Enter')
    await flush()
    const box = w.find('.g-combobox__box.is-ticking')
    expect(box.exists()).toBe(true)
    const row = w.find('.g-combobox__row.is-entering')
    expect(row.exists()).toBe(true)
    const ev = (name) => Object.assign(new Event('animationend', { bubbles: true }), { animationName: name })
    box.element.dispatchEvent(ev('g-combobox-tick'))
    row.element.dispatchEvent(ev('g-combobox-row-in'))
    await flush()
    expect(w.find('.is-ticking').exists()).toBe(false)
    expect(w.find('.is-entering').exists()).toBe(false)
  })
})

describe('GCombobox multiple · frase (#425): cede por el final y por texto, medida por lotes', () => {
  it('con un ancho medido, cede con labels.rest («y N más», la cifra en __num); el marcado por Retroceso sale a la vista', async () => {
    const ctx = { font: '', measureText: (t) => ({ width: t.length * 8 }) }
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => ctx)
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function () { return this.classList.contains('g-combobox__value') ? 300 : 0 })
    const w = await mk({ options: MANY, modelValue: MANY.slice(0, 10).map((o) => o.value) })
    await sleep(40)
    await flush()
    const s = w.find('.g-combobox__sentence')
    // «Insumo 001, Insumo 002 y 8 más» = 32 caracteres × 8 = 256 ≤ 299; con tres ya no cabe
    expect(s.text()).toBe('Insumo 001, Insumo 002 y 8 más')
    expect(s.find('.g-combobox__sentence-rest .g-combobox__num').text()).toBe('8')
    expect(s.findAll('.g-combobox__sentence-item').length).toBe(2)
    field(w).element.focus()
    await key(w, 'Backspace')
    await sleep(40)
    await flush()
    expect(w.find('.g-combobox__sentence-item.is-armed').text()).toBe('Insumo 010')
    expect(w.find('.g-combobox__about').text()).toContain('Insumo 010')
  })

  it('sin labels.rest no cede (elipsis de coco) y avisa', async () => {
    const w = await mk({ modelValue: ['pen', 'lat', 'ibu'], labels: { ...LABELS, rest: undefined } })
    expect(w.find('.g-combobox__sentence').text()).toBe('Penicilina, Látex e Ibuprofeno') // Intl.ListFormat es: «e» ante «I»
    expect(warnings().some((t) => t.includes('labels.rest'))).toBe(true)
  })
})

describe('GCombobox multiple · avisos 13 a 17', () => {
  it('13 · multiple cambiado después de montar no tiene efecto', async () => {
    const w = await mk({ modelValue: ['pen'] })
    await w.setProps({ multiple: false })
    expect(warnings().some((t) => t.includes('se lee al montar'))).toBe(true)
    expect(root(w).classes()).toContain('g-combobox--multiple')
  })
  it('15 · props y slots que no aplican', async () => {
    await mk({ modelValue: ['pen'], selectedOption: ALG[0], numbered: true }, { slots: { value: () => 'x' } })
    expect(warnings().filter((t) => /selectedOption no aplica|numbered numera|slot value no aplica/.test(t)).length).toBe(3)
    warn.mockClear()
    const w = mount(GCombobox, { props: { label: 'X', labels: LABELS, options: ALG, selectedOptions: [ALG[0]], selection: 'list', max: 2 }, slots: { chosen: () => 'x' }, attachTo: document.body })
    mounted.push(w)
    await flush()
    expect(warnings().filter((t) => /selectedOptions solo aplica|solo aplican con multiple|slot chosen solo aplica/.test(t)).length).toBe(3)
  })
  it('17 · selected, chosen y done al montar; los demás al necesitarse', async () => {
    await mk({ labels: { close: 'Cerrar' } })
    for (const k of ['selected', 'chosen', 'done', 'rest']) expect(warnings().some((t) => t.includes(`labels.${k}`)), k).toBe(true)
    expect(warnings().some((t) => t.includes('labels.added'))).toBe(false)
  })
  it('sin avisos con una configuración completa', async () => {
    const w = await mk({ modelValue: ['pen'], clearable: true, allowCustom: true, name: 'a', customName: 'l' })
    await typeText(w, 'lat')
    await key(w, 'Enter')
    await key(w, 'Escape')
    expect(warnings()).toEqual([])
  })
})
