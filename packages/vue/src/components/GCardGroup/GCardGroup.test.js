import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick, ref } from 'vue'
import GCardGroup from './GCardGroup.vue'
import GCard from '../GCard/GCard.vue'
import { isPressed, keyTarget, normalizeModel, revealDelta, toggleModel } from './model.js'

// Contrato: design/contracts/card-group.md (lima, #603 a #611) y card.md «Dentro de un GCardGroup» (#605, #606).
// La geometría (puente Δ0, L7 en WebKit a 375 px, Firefox sin parada en la tira, Δ0 de las cajas, rendimiento) se mide con
// Playwright en los tres motores: design/lab/theme-playground/tests/card-group.spec.mjs.

const ITEMS = [
  { value: 'pendiente', title: 'Pendientes', n: 8 },
  { value: 'vencida', title: 'Vencidas', n: 4 },
  { value: 'pagada', title: 'Pagadas', n: 10 },
  { value: 'en disputa', title: 'En disputa', n: 2 }
]

const wrappers = []
let warn
beforeEach(() => { warn = vi.spyOn(console, 'warn').mockImplementation(() => {}) })
afterEach(() => {
  while (wrappers.length) wrappers.pop().unmount()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

// Un grupo controlado (v-model real) con las cuatro tarjetas y, opcionalmente, panel y tarjetas extra
function make({ model = null, multiple = false, panel = false, items = ITEMS, groupProps = {}, extra = null, cardProps = () => ({}) } = {}) {
  const mv = ref(model)
  const events = []
  const list = ref(items)
  const w = mount({
    setup: () => ({ mv, list }),
    render: () => h(GCardGroup, {
      modelValue: mv.value,
      'onUpdate:modelValue': (v) => { mv.value = v; events.push(['update', v]) },
      onChange: (e) => events.push(['change', e]),
      multiple,
      label: 'Filtrar facturas por estado',
      ...groupProps
    }, {
      default: () => [
        ...list.value.map((it) => h(GCard, { key: it.value, value: it.value, title: it.title, as: 'div', ...cardProps(it) }, () => h('p', { class: 'cifra' }, `Facturas ${it.n}`))),
        extra ? extra() : null
      ],
      ...(panel ? { panel: ({ filtered }) => h('div', { id: 'tabla', 'data-filtered': String(filtered) }, 'tabla') } : {})
    })
  }, { attachTo: document.body })
  wrappers.push(w)
  return { w, mv, events, list }
}
const buttons = (w) => w.findAll('.g-card__primary')
const pressed = (w) => buttons(w).map((b) => b.attributes('aria-pressed'))
const stops = (w) => buttons(w).map((b) => b.attributes('tabindex'))
const warned = (code) => warn.mock.calls.some(([m]) => String(m).startsWith('[Grana GCardGroup]') && String(m).includes(code === 'G1b' ? 'aria-label/aria-labelledby' : MSG[code]))
const MSG = { G1: 'necesita label o labelledby', G2: 'cae a "none": en la barra', G3: 'sin value cae', G4: 'value repetido', G5: 'controles secundarios', G6: 'se ignora', G7: 'modelValue', G8: 'dentro de otro GCardGroup', G9: 'no existe en el documento' }

describe('motor (model.js)', () => {
  it('normalizeModel: tipo por modo y G7', () => {
    expect(normalizeModel(null, false)).toEqual({ value: null, bad: false })
    expect(normalizeModel(undefined, false)).toEqual({ value: null, bad: false })
    expect(normalizeModel(['a'], false)).toEqual({ value: null, bad: true })
    expect(normalizeModel(['a'], true)).toEqual({ value: ['a'], bad: false })
    expect(normalizeModel(null, true)).toEqual({ value: [], bad: true })
    expect(normalizeModel('a', true)).toEqual({ value: [], bad: true })
  })
  it('isPressed: igualdad estricta', () => {
    expect(isPressed('4', 4, false)).toBe(false)
    expect(isPressed(4, 4, false)).toBe(true)
    expect(isPressed([4], 4, true)).toBe(true)
    expect(isPressed(['4'], 4, true)).toBe(false)
  })
  it('toggleModel: único (sustituye y suelta) y múltiple (orden del DOM, desconocidos al final, [] nunca null)', () => {
    expect(toggleModel(null, 'a', false, [])).toBe('a')
    expect(toggleModel('a', 'b', false, [])).toBe('b')
    expect(toggleModel('a', 'a', false, [])).toBe(null)
    const order = ['p', 'v', 'g']
    expect(toggleModel([], 'g', true, order)).toEqual(['g'])
    expect(toggleModel(['g'], 'p', true, order)).toEqual(['p', 'g'])
    expect(toggleModel(['x', 'g'], 'v', true, order)).toEqual(['v', 'g', 'x'])
    expect(toggleModel(['p'], 'p', true, order)).toEqual([])
  })
  it('keyTarget: flechas con espejo RTL, lineales, Inicio/Fin, sin vuelta; otras teclas null', () => {
    expect(keyTarget('ArrowRight', 0, 4, false)).toBe(1)
    expect(keyTarget('ArrowRight', 0, 4, true)).toBe(0)
    expect(keyTarget('ArrowLeft', 0, 4, true)).toBe(1)
    expect(keyTarget('ArrowDown', 1, 4, true)).toBe(2)
    expect(keyTarget('ArrowUp', 0, 4, false)).toBe(0)
    expect(keyTarget('ArrowRight', 3, 4, false)).toBe(3)
    expect(keyTarget('Home', 2, 4, false)).toBe(0)
    expect(keyTarget('End', 0, 4, false)).toBe(3)
    expect(keyTarget('a', 0, 4, false)).toBe(null)
    expect(keyTarget('Enter', 0, 4, false)).toBe(null)
  })
  it('revealDelta: la tarjeta entera dentro de la caja visible de la tira', () => {
    const strip = { left: 0 }
    expect(revealDelta(strip, 0, 300, { left: 10, right: 200 })).toBe(0)
    expect(revealDelta(strip, 0, 300, { left: 250, right: 450 })).toBe(150)
    expect(revealDelta(strip, 0, 300, { left: -40, right: 160 })).toBe(-40)
  })
})

describe('estructura y semántica', () => {
  it('raíz sin rol; la barra es role="toolbar" con nombre; tarjetas = <button type="button" aria-pressed>', () => {
    const { w } = make()
    const root = w.find('.g-card-group')
    expect(root.attributes('role')).toBeUndefined()
    const strip = w.find('.g-card-group__strip')
    expect(strip.attributes('role')).toBe('toolbar')
    expect(strip.attributes('aria-label')).toBe('Filtrar facturas por estado')
    expect(strip.attributes('tabindex')).toBeUndefined()
    expect(buttons(w)).toHaveLength(4)
    for (const b of buttons(w)) {
      expect(b.element.tagName).toBe('BUTTON')
      expect(b.attributes('type')).toBe('button')
      expect(b.attributes('aria-selected')).toBeUndefined()
    }
    expect(pressed(w)).toEqual(['false', 'false', 'false', 'false'])
    expect(w.find('.g-card-group__panel').exists()).toBe(false)
    expect(w.find('.g-card-group__bridge').exists()).toBe(false)
    expect(root.classes()).not.toContain('has-panel')
    expect(w.findAll('[role="radiogroup"], [role="tablist"], [role="listbox"], [aria-live]')).toHaveLength(0)
  })

  it('labelledby a la barra; aria-label/aria-labelledby en $attrs no se copian (G1b) y el resto va a la raíz', async () => {
    const { w } = make({ groupProps: { label: undefined, labelledby: 'h-estado', 'aria-label': 'X', class: 'mia', 'data-x': '1' } })
    await nextTick()
    const strip = w.find('.g-card-group__strip')
    expect(strip.attributes('aria-labelledby')).toBe('h-estado')
    expect(strip.attributes('aria-label')).toBeUndefined()
    const root = w.find('.g-card-group')
    expect(root.attributes('aria-label')).toBeUndefined()
    expect(root.classes()).toContain('mia')
    expect(root.attributes('data-x')).toBe('1')
    expect(warned('G1b')).toBe(true)
    expect(warned('G1')).toBe(false)
  })

  it('G1: sin label ni labelledby avisa', async () => {
    make({ groupProps: { label: undefined } })
    await nextTick()
    expect(warned('G1')).toBe(true)
  })

  it('aria-describedby = ID-content (con la cifra) dentro del grupo; ID-desc fuera; g-card__content siempre con id', async () => {
    const { w } = make({ cardProps: () => ({ description: 'Facturas sin pagar' }) })
    await nextTick()
    const b = buttons(w)[1]
    const card = w.findAll('.g-card')[1]
    const content = card.find('.g-card__content')
    expect(content.attributes('id')).toBe(`${card.attributes('id')}-content`)
    expect(b.attributes('aria-describedby')).toBe(content.attributes('id'))
    expect(content.text()).toContain('Facturas 4')
    expect(content.text()).toContain('Facturas sin pagar')
    // Fuera de un grupo no cambia
    const solo = mount(GCard, { props: { interaction: 'toggle', title: 'Suelta', description: 'Desc' }, slots: { default: () => 'Cifra 3' } })
    wrappers.push(solo)
    const id = solo.find('.g-card').attributes('id')
    expect(solo.find('.g-card__primary').attributes('aria-describedby')).toBe(`${id}-desc`)
    expect(solo.find('.g-card__content').attributes('id')).toBe(`${id}-content`)
    expect(solo.find('.g-card__primary').attributes('tabindex')).toBeUndefined()
  })

  it('una tarjeta gestionada sin contenido no lleva aria-describedby', async () => {
    const w = mount(GCardGroup, { props: { label: 'L' }, slots: { default: () => h(GCard, { value: 'a', title: 'A' }) } })
    wrappers.push(w)
    await nextTick()
    expect(w.find('.g-card__content').exists()).toBe(false)
    expect(w.find('.g-card__primary').attributes('aria-describedby')).toBeUndefined()
  })
})

describe('tarjetas hijas (#605)', () => {
  it('auto + value → toggle gestionado; auto sin value → none fuera de la parada', async () => {
    const { w } = make({ extra: () => h(GCard, { key: 'total', title: 'Total 24', as: 'div' }) })
    await nextTick()
    const cards = w.findAll('.g-card')
    expect(cards).toHaveLength(5)
    expect(cards[4].classes()).toContain('g-card--interaction-none')
    expect(cards[4].find('.g-card__primary').exists()).toBe(false)
    expect(cards[0].classes()).toContain('g-card--interaction-toggle')
    expect(warned('G2')).toBe(false)
  })

  it('link, button y select caen a none con G2; toggle sin value con G3; none con value sin aviso', async () => {
    const w = mount(GCardGroup, {
      props: { label: 'L' },
      slots: {
        default: () => [
          h(GCard, { value: 'a', title: 'A' }),
          h(GCard, { value: 'b', title: 'B', interaction: 'link', href: '#b' }),
          h(GCard, { value: 'c', title: 'C', interaction: 'button' }),
          h(GCard, { value: 'd', title: 'D', interaction: 'select' }),
          h(GCard, { title: 'E', interaction: 'toggle' }),
          h(GCard, { value: 'f', title: 'F', interaction: 'none' })
        ]
      },
      attachTo: document.body
    })
    wrappers.push(w)
    await nextTick(); await nextTick()
    const cards = w.findAll('.g-card')
    expect(cards.map((c) => c.classes().find((k) => k.startsWith('g-card--interaction-')))).toEqual([
      'g-card--interaction-toggle', 'g-card--interaction-none', 'g-card--interaction-none', 'g-card--interaction-none', 'g-card--interaction-none', 'g-card--interaction-none'
    ])
    expect(w.findAll('a, input').length).toBe(0)
    expect(warned('G2')).toBe(true)
    expect(warned('G3')).toBe(true)
  })

  it('value repetido: la segunda cae a none (G4)', async () => {
    const w = mount(GCardGroup, { props: { label: 'L' }, slots: { default: () => [h(GCard, { value: 'a', title: 'A' }), h(GCard, { value: 'a', title: 'A2' })] }, attachTo: document.body })
    wrappers.push(w)
    await nextTick(); await nextTick()
    expect(w.findAll('.g-card__primary')).toHaveLength(1)
    expect(warned('G4')).toBe(true)
  })

  it('el modelValue de la hija se ignora (G6) y la hija no emite update:modelValue: emite el grupo', async () => {
    const childUpdate = vi.fn()
    const groupUpdate = vi.fn()
    const w = mount(GCardGroup, {
      props: { label: 'L', modelValue: null, 'onUpdate:modelValue': groupUpdate },
      slots: { default: () => h(GCard, { value: 'a', title: 'A', modelValue: true, 'onUpdate:modelValue': childUpdate }) },
      attachTo: document.body
    })
    wrappers.push(w)
    await nextTick(); await nextTick()
    expect(w.find('.g-card__primary').attributes('aria-pressed')).toBe('false')
    await w.find('.g-card__primary').trigger('click')
    expect(childUpdate).not.toHaveBeenCalled()
    expect(groupUpdate).toHaveBeenCalledWith('a')
    expect(warned('G6')).toBe(true)
  })

  it('controles secundarios en una gestionada avisan (G5): menú, actions o enfocable en el contenido', async () => {
    const w = mount(GCardGroup, {
      props: { label: 'L' },
      slots: { default: () => h(GCard, { value: 'a', title: 'A' }, { default: () => h('a', { href: '#x' }, 'ver') }) },
      attachTo: document.body
    })
    wrappers.push(w)
    await nextTick(); await nextTick()
    expect(warned('G5')).toBe(true)
  })

  it('una tarjeta sin controles secundarios no avisa G5', async () => {
    make()
    await nextTick(); await nextTick()
    expect(warned('G5')).toBe(false)
  })

  it('G8: un grupo dentro de otro avisa; una GCard dentro del panel no se registra en el grupo', async () => {
    const w = mount(GCardGroup, {
      props: { label: 'L' },
      slots: {
        default: () => [h(GCard, { value: 'a', title: 'A' }), h(GCardGroup, { label: 'interno' })],
        panel: () => h(GCard, { value: 'p', title: 'En el panel', interaction: 'toggle' })
      },
      attachTo: document.body
    })
    wrappers.push(w)
    await nextTick()
    expect(warned('G8')).toBe(true)
    const inPanel = w.find('.g-card-group__panel .g-card__primary')
    // Fuera del grupo: tarjeta toggle de siempre (sin tabindex ni aria-controls del grupo)
    expect(inPanel.attributes('tabindex')).toBeUndefined()
    expect(inPanel.attributes('aria-controls')).toBeUndefined()
  })
})

describe('modelo y eventos', () => {
  it('sin multiple: pulsar emite value y change {value, pressed:true}; otra la sustituye; volver a pulsar emite null', async () => {
    const { w, mv, events } = make()
    await buttons(w)[1].trigger('click')
    expect(events).toEqual([['update', 'vencida'], ['change', { value: 'vencida', pressed: true }]])
    expect(mv.value).toBe('vencida')
    await nextTick()
    expect(pressed(w)).toEqual(['false', 'true', 'false', 'false'])
    expect(w.findAll('.g-card')[1].classes()).toContain('is-selected')
    await buttons(w)[2].trigger('click')
    expect(mv.value).toBe('pagada')
    expect(events.at(-1)).toEqual(['change', { value: 'pagada', pressed: true }])
    await nextTick()
    expect(pressed(w)).toEqual(['false', 'false', 'true', 'false'])
    await buttons(w)[2].trigger('click')
    expect(mv.value).toBe(null)
    expect(events.at(-1)).toEqual(['change', { value: 'pagada', pressed: false }])
  })

  it('update:modelValue va antes que change', async () => {
    const { w, events } = make()
    await buttons(w)[0].trigger('click')
    expect(events.map((e) => e[0])).toEqual(['update', 'change'])
  })

  it('con multiple: orden del DOM, desconocidos conservados al final, [] nunca null', async () => {
    const { w, mv } = make({ model: ['zzz'], multiple: true })
    await buttons(w)[2].trigger('click')
    expect(mv.value).toEqual(['pagada', 'zzz'])
    await nextTick()
    await buttons(w)[0].trigger('click')
    expect(mv.value).toEqual(['pendiente', 'pagada', 'zzz'])
    await nextTick()
    expect(pressed(w)).toEqual(['true', 'false', 'true', 'false'])
    expect(w.find('.g-card-group').classes()).toContain('is-multiple')
    await buttons(w)[0].trigger('click'); await nextTick()
    await buttons(w)[2].trigger('click'); await nextTick()
    expect(mv.value).toEqual(['zzz'])
    mv.value = []
    await nextTick()
    await buttons(w)[3].trigger('click'); await nextTick()
    await buttons(w)[3].trigger('click')
    expect(mv.value).toEqual([])
  })

  it('igualdad estricta: \'4\' no pulsa la tarjeta de 4', async () => {
    const { w } = make({ model: '4', items: [{ value: 4, title: 'Cuatro', n: 4 }] })
    await nextTick()
    expect(pressed(w)).toEqual(['false'])
  })

  it('un valor que no es de ninguna tarjeta deja todas sin pulsar, sin aviso ni reescritura', async () => {
    const { w, events } = make({ model: 'otra' })
    await nextTick()
    expect(pressed(w)).toEqual(['false', 'false', 'false', 'false'])
    expect(events).toEqual([])
    expect(warned('G7')).toBe(false)
  })

  it('G7: arreglo sin multiple se trata como null; null con multiple como []', async () => {
    const a = make({ model: ['pagada'] })
    await nextTick()
    expect(pressed(a.w)).toEqual(['false', 'false', 'false', 'false'])
    expect(warned('G7')).toBe(true)
    warn.mockClear()
    const b = make({ model: null, multiple: true })
    await buttons(b.w)[1].trigger('click')
    expect(b.mv.value).toEqual(['vencida'])
    expect(warned('G7')).toBe(true)
  })

  it('un cambio desde fuera no emite change ni mueve el foco', async () => {
    const { w, mv, events } = make()
    const out = document.createElement('button')
    document.body.appendChild(out)
    out.focus()
    mv.value = 'pagada'
    await nextTick(); await nextTick()
    expect(pressed(w)).toEqual(['false', 'false', 'true', 'false'])
    expect(events).toEqual([])
    expect(document.activeElement).toBe(out)
  })

  it('disabled y loading no emiten', async () => {
    const { w, events } = make({ cardProps: (it) => ({ disabled: it.value === 'vencida', loading: it.value === 'pagada' }) })
    await nextTick()
    const bs = buttons(w)
    expect(bs).toHaveLength(3) // con loading no hay principal
    expect(bs[1].attributes('disabled')).toBeDefined()
    await bs[1].trigger('click')
    expect(events).toEqual([])
  })

  it('una pulsada que pasa a disabled sigue aria-pressed="true"', async () => {
    const dis = ref(false)
    const { w } = make({ model: 'vencida', cardProps: (it) => ({ disabled: it.value === 'vencida' && dis.value }) })
    await nextTick()
    dis.value = true
    await nextTick()
    expect(buttons(w)[1].attributes('aria-pressed')).toBe('true')
    expect(buttons(w)[1].attributes('disabled')).toBeDefined()
  })
})

describe('aria-controls y panel', () => {
  it('controls → aria-controls en cada botón gestionado; G9 si el id no existe', async () => {
    const { w } = make({ groupProps: { controls: 'no-existe' } })
    await nextTick(); await nextTick()
    for (const b of buttons(w)) expect(b.attributes('aria-controls')).toBe('no-existe')
    expect(warned('G9')).toBe(true)
  })

  it('sin controls y con panel: aria-controls = ID-panel; sin ninguno, sin aria-controls', async () => {
    const a = make({ panel: true, groupProps: { id: 'cg' } })
    await nextTick()
    expect(a.w.find('.g-card-group__panel').attributes('id')).toBe('cg-panel')
    for (const b of buttons(a.w)) expect(b.attributes('aria-controls')).toBe('cg-panel')
    const b = make()
    await nextTick()
    for (const x of buttons(b.w)) expect(x.attributes('aria-controls')).toBeUndefined()
  })

  it('con panel: has-panel, tira con tabindex="-1" (#570), panel fuera de la barra; is-filtered en raíz y panel; slot { filtered }', async () => {
    const { w, mv } = make({ panel: true })
    await nextTick()
    const root = w.find('.g-card-group')
    const strip = w.find('.g-card-group__strip')
    const panel = w.find('.g-card-group__panel')
    expect(root.classes()).toContain('has-panel')
    expect(strip.attributes('tabindex')).toBe('-1')
    expect(strip.element.contains(panel.element)).toBe(false)
    expect(w.find('#tabla').attributes('data-filtered')).toBe('false')
    expect(root.classes()).not.toContain('is-filtered')
    mv.value = 'vencida'
    await nextTick()
    expect(root.classes()).toContain('is-filtered')
    expect(panel.classes()).toContain('is-filtered')
    expect(w.find('#tabla').attributes('data-filtered')).toBe('true')
  })
})

describe('teclado y foco itinerante', () => {
  it('una sola parada: la primera elegible sin pulsada; la pulsada si la hay', async () => {
    const { w, mv } = make()
    await nextTick()
    expect(stops(w)).toEqual(['0', '-1', '-1', '-1'])
    mv.value = 'pagada'
    await nextTick()
    expect(stops(w)).toEqual(['-1', '-1', '0', '-1'])
  })

  it('con multiple, la primera pulsada en el DOM', async () => {
    const { w } = make({ model: ['en disputa', 'vencida'], multiple: true })
    await nextTick()
    expect(stops(w)).toEqual(['-1', '0', '-1', '-1'])
  })

  it('flechas, Inicio y Fin mueven el foco sin filtrar y sin vuelta; Alt/Ctrl/⌘ no se interceptan', async () => {
    const { w, events } = make()
    await nextTick()
    const bs = buttons(w)
    bs[0].element.focus()
    await bs[0].trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(bs[1].element)
    await nextTick()
    expect(stops(w)).toEqual(['-1', '0', '-1', '-1'])
    await bs[1].trigger('keydown', { key: 'End' })
    expect(document.activeElement).toBe(bs[3].element)
    await bs[3].trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(bs[3].element)
    await bs[3].trigger('keydown', { key: 'Home' })
    expect(document.activeElement).toBe(bs[0].element)
    await bs[0].trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(bs[1].element)
    await bs[1].trigger('keydown', { key: 'ArrowUp' })
    expect(document.activeElement).toBe(bs[0].element)
    await bs[0].trigger('keydown', { key: 'ArrowRight', altKey: true })
    expect(document.activeElement).toBe(bs[0].element)
    await bs[0].trigger('keydown', { key: 'End', ctrlKey: true })
    expect(document.activeElement).toBe(bs[0].element)
    expect(events).toEqual([])
  })

  it('RTL: → retrocede y ← avanza', async () => {
    const { w } = make()
    await nextTick()
    w.find('.g-card-group__strip').element.style.direction = 'rtl'
    const bs = buttons(w)
    bs[0].element.focus()
    await bs[0].trigger('keydown', { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(bs[1].element)
    await bs[1].trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(bs[0].element)
  })

  it('disabled y loading quedan fuera de la parada y de las flechas', async () => {
    const { w } = make({ cardProps: (it) => ({ disabled: it.value === 'pendiente', loading: it.value === 'pagada' }) })
    await nextTick()
    const bs = buttons(w) // pendiente (disabled), vencida, en disputa
    expect(bs.map((b) => b.attributes('tabindex'))).toEqual(['-1', '0', '-1'])
    bs[1].element.focus()
    await bs[1].trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(bs[2].element)
    await bs[2].trigger('keydown', { key: 'Home' })
    expect(document.activeElement).toBe(bs[1].element)
  })

  it('al salir, la parada vuelve a la pulsada; sin pulsada, a la última enfocada', async () => {
    const { w, mv } = make()
    await nextTick()
    const out = document.createElement('button')
    document.body.appendChild(out)
    const bs = buttons(w)
    bs[0].element.focus()
    await bs[0].trigger('keydown', { key: 'ArrowRight' })
    await bs[1].trigger('keydown', { key: 'ArrowRight' })
    out.focus()
    await nextTick()
    expect(stops(w)).toEqual(['-1', '-1', '0', '-1'])
    mv.value = 'pendiente'
    await nextTick()
    expect(stops(w)).toEqual(['0', '-1', '-1', '-1'])
  })

  it('si la enfocada pasa a disabled, el foco va a la siguiente elegible (o a la anterior)', async () => {
    const dis = ref('')
    const { w } = make({ cardProps: (it) => ({ disabled: it.value === dis.value }) })
    await nextTick()
    const bs = buttons(w)
    bs[1].element.focus()
    bs[1].element.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    dis.value = 'vencida'
    await nextTick(); await nextTick()
    expect(document.activeElement).toBe(bs[2].element)
    bs[3].element.focus()
    bs[3].element.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    dis.value = 'en disputa'
    await nextTick(); await nextTick()
    expect(document.activeElement).toBe(bs[2].element)
  })

  it('si la enfocada se desmonta, el foco pasa a la siguiente elegible', async () => {
    const { w, list } = make()
    await nextTick()
    buttons(w)[1].element.focus()
    list.value = ITEMS.filter((it) => it.value !== 'vencida')
    await nextTick(); await nextTick()
    expect(document.activeElement?.closest('.g-card')?.querySelector('.g-card__title')?.textContent).toBe('Pagadas')
  })

  it('Espacio/Intro alternan (nativo del <button>: el clic)', async () => {
    const { w, mv } = make()
    await buttons(w)[3].trigger('click')
    expect(mv.value).toBe('en disputa')
  })
})

describe('orden del documento', () => {
  it('al reordenar (v-for con otra clave), multiple emite en el orden nuevo del DOM y la parada sigue el DOM', async () => {
    const { w, mv, list } = make({ multiple: true, model: [] })
    await nextTick()
    list.value = [...ITEMS].reverse()
    await nextTick(); await nextTick()
    await buttons(w)[0].trigger('click') // en disputa
    await nextTick()
    await buttons(w)[3].trigger('click') // pendiente
    expect(mv.value).toEqual(['en disputa', 'pendiente'])
    expect(stops(w)).toEqual(['0', '-1', '-1', '-1'])
  })
})

describe('puentes (con panel)', () => {
  // jsdom no maqueta: cada tarjeta mide 100 de ancho y está a 110 × i de la tira
  beforeEach(() => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
      if (this.classList?.contains('g-card-group__strip')) return { left: 0, right: 500, top: 0, bottom: 100, width: 500, height: 100 }
      if (this.classList?.contains('g-card')) {
        const i = [...this.parentElement.children].filter((n) => n.classList.contains('g-card')).indexOf(this)
        return { left: 110 * i, right: 110 * i + 100, top: 0, bottom: 90, width: 100, height: 90 }
      }
      return { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 }
    })
  })
  const bridges = (w) => w.findAll('.g-card-group__bridge')

  it('uno por pulsada, aria-hidden, dentro de la barra, con --_bridge-x/--_bridge-w en px; sin panel no hay', async () => {
    const { w, mv } = make({ panel: true })
    await nextTick()
    expect(bridges(w)).toHaveLength(0)
    mv.value = 'pagada'
    await nextTick(); await nextTick()
    const br = bridges(w)
    expect(br).toHaveLength(1)
    expect(br[0].attributes('aria-hidden')).toBe('true')
    expect(w.find('.g-card-group__strip').element.contains(br[0].element)).toBe(true)
    expect(br[0].element.style.getPropertyValue('--_bridge-x')).toBe('220px')
    expect(br[0].element.style.getPropertyValue('--_bridge-w')).toBe('100px')
    const plain = make({ model: 'pagada' })
    await nextTick(); await nextTick()
    expect(bridges(plain.w)).toHaveLength(0)
  })

  it('sin multiple: un solo puente que viaja (el mismo elemento); soltar lo marca is-leaving y se retira', async () => {
    const { w, mv } = make({ panel: true, model: 'vencida' })
    await nextTick(); await nextTick()
    const el = bridges(w)[0].element
    mv.value = 'en disputa'
    await nextTick(); await nextTick()
    expect(bridges(w)).toHaveLength(1)
    expect(bridges(w)[0].element).toBe(el)
    expect(el.style.getPropertyValue('--_bridge-x')).toBe('330px')
    mv.value = null
    await nextTick()
    // Sin transición (jsdom): se retira en cuanto se pinta is-leaving
    await nextTick(); await nextTick(); await nextTick()
    expect(bridges(w)).toHaveLength(0)
  })

  it('con multiple: uno por valor', async () => {
    const { w, mv } = make({ panel: true, multiple: true, model: ['pendiente', 'pagada'] })
    await nextTick(); await nextTick()
    expect(bridges(w).map((b) => b.element.style.getPropertyValue('--_bridge-x'))).toEqual(['0px', '220px'])
    mv.value = ['pagada']
    await nextTick(); await nextTick(); await nextTick(); await nextTick()
    expect(bridges(w).map((b) => b.element.style.getPropertyValue('--_bridge-x'))).toEqual(['220px'])
  })

  it('solo se reescriben si cambian: un render del padre que no cambia nada no vuelve a medir', async () => {
    const tick = ref(0)
    const mv = ref('vencida')
    const w = mount({
      render: () => h('div', { 'data-t': tick.value }, [h(GCardGroup, { modelValue: mv.value, label: 'L', style: { order: tick.value } }, {
        default: () => ITEMS.map((it) => h(GCard, { key: it.value, value: it.value, title: it.title, meta: [{ label: 'n', value: String(it.n + tick.value) }] })),
        panel: () => h('div', 'tabla')
      })])
    }, { attachTo: document.body })
    wrappers.push(w)
    await nextTick(); await nextTick()
    const spy = Element.prototype.getBoundingClientRect
    spy.mockClear()
    tick.value++
    await nextTick(); await nextTick()
    const stripCalls = spy.mock.contexts.filter((c) => c.classList?.contains('g-card-group__strip')).length
    expect(stripCalls).toBe(0)
  })
})
