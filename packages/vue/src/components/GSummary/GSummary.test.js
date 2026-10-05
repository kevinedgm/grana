// GSummary · design/contracts/summary.md «Verificación · bruno (vitest + jsdom)» · DECISIONS.md #349 a #357.
// La medida se prueba con cajas simuladas: getBoundingClientRect, scrollWidth y clientWidth se sustituyen por un modelo
// de la cesión del CSS (una línea de datos que salta; rótulos bare callados con data-terse; «+N» que ocupa sitio; en
// data-tight la caja de datos pasa a texto oculto), lo bastante fiel para comprobar las pasadas y su convergencia.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import GSummary from './GSummary.vue'
import { summaryDiff } from './diff.js'
import { shared } from '../../shared.js'
import * as main from '../../index.js'

const tick = () => new Promise((r) => setTimeout(r, 0))
const frames = () => new Promise((r) => setTimeout(r, 60))

const FACTS = [
  { label: 'Expediente', short: 'Exp.', value: '001000', priority: 1 },
  { label: 'Edad', value: '22 años', bare: true, priority: 2 },
  { label: 'Última visita', value: '03/02/2026', priority: 3 },
  { label: 'Médico', value: 'Dra. Ruiz', bare: true, priority: 4 }
]
const make = (props = {}, opts = {}) => mount(GSummary, { props: { title: 'María García López', facts: FACTS, ...props }, ...opts })
const labels = (w) => w.findAll('.g-summary__fact-label').map((x) => x.text())
const clippedOf = (w) => w.findAll('.g-summary__fact').filter((f) => f.attributes('data-clipped') !== undefined).map((f) => f.find('.g-summary__fact-label').text())

let warn
beforeEach(() => { warn = vi.spyOn(console, 'warn').mockImplementation(() => {}) })
afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

// ---------- Modelo de cajas (medida) ----------
// Un «escenario» por raíz: ancho de la ficha, ancho que necesita cada dato (valor y rótulo), el identificador y «+N».
const scenes = new WeakMap()
const LH = 20
function model(el) {
  const root = el.closest ? el.closest('.g-summary') : null
  const sc = root && scenes.get(root)
  if (!sc) return null
  const facts = [...root.querySelectorAll('.g-summary__fact:not(.is-anchor)')]
  const terse = root.hasAttribute('data-terse')
  const tight = root.hasAttribute('data-tight')
  const multi = root.classList.contains('g-summary--multi')
  const more = root.querySelector('.g-summary__more')
  const moreW = more && !more.hidden ? sc.moreW ?? 30 : 0
  const anchorNeed = sc.anchorNeed ?? 60
  const anchorW = root.querySelector('.g-summary__fact.is-anchor') ? Math.min(anchorNeed, sc.width) : 0
  const boxW = tight && !multi ? 1 : Math.max(0, sc.width - anchorW - moreW)
  const widthOf = (f) => {
    const label = f.querySelector('.g-summary__fact-label').textContent
    const hideLabel = terse && f.classList.contains('is-bare')
    return (sc.widths[label] ?? 50) + (hideLabel ? 0 : sc.labelW ?? 20)
  }
  // Corriente: los datos se colocan en línea y saltan cuando no caben
  const pos = new Map()
  let x = multi ? anchorW : 0, line = 0
  const lineW = multi ? Math.max(0, sc.width - moreW) : boxW
  for (const f of facts) {
    const w = widthOf(f)
    // Sin multi hay un centinela de una línea: el primer dato salta si no cabe. En multi, un dato solo lleva elipsis
    if (multi ? x > 0 && x + w > lineW : x + w > lineW) { line++; x = 0 }
    pos.set(f, { left: x, width: w, top: line * LH, bottom: line * LH + LH })
    x += w
  }
  return { sc, root, facts, pos, boxW, anchorW, anchorNeed, multi, tight, linesVisible: multi ? Number(root.style.getPropertyValue('--_lines')) || 1 : 1 }
}
const rectOf = (el) => {
  const m = model(el)
  if (!m) return { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0 }
  const R = (left, top, width, height) => ({ left, right: left + width, top, bottom: top + height, width, height, x: left, y: top })
  if (el === m.root) return R(0, 0, m.sc.width, 44)
  if (el.classList.contains('g-summary__facts') || el.classList.contains('g-summary__flow')) return R(0, 0, m.multi ? m.sc.width : m.boxW, LH * m.linesVisible)
  if (el.classList.contains('g-summary__fact') && !el.classList.contains('is-anchor')) { const p = m.pos.get(el); return R(p.left, p.top, p.width, LH) }
  if (el.classList.contains('g-summary__fact') && el.classList.contains('is-anchor')) return R(0, 0, m.anchorW, LH)
  if (el.classList.contains('g-summary__fact-value') && el.parentElement.classList.contains('is-anchor')) return R(0, 0, m.anchorNeed - (m.tight ? 0 : 0), LH)
  return R(0, 0, 10, LH)
}
let boxes = false
function simulate() {
  if (boxes) return
  boxes = true
  Element.prototype.getBoundingClientRect = function () { return rectOf(this) }
  Element.prototype.getClientRects = function () { return model(this) ? [rectOf(this)] : [] }
  const need = (el) => { const m = model(el); if (!m) return 0; if (el.classList.contains('g-summary__title')) return m.sc.titleNeed ?? 0; return 0 }
  Object.defineProperty(Element.prototype, 'scrollWidth', { configurable: true, get() { return need(this) } })
  Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get() { const m = model(this); return m ? Math.min(need(this), m.sc.width) : 0 } })
}
const scene = (w, sc) => { simulate(); scenes.set(w.element, { widths: {}, ...sc }) }

// ResizeObserver simulado: dispara a mano
const observers = []
class RO { constructor(cb) { this.cb = cb; this.els = new Set(); observers.push(this) } observe(el) { this.els.add(el) } unobserve(el) { this.els.delete(el) } disconnect() { this.els.clear() } }
const resize = (el) => { for (const o of observers) if (o.els.has(el)) o.cb([{ target: el }]) }

describe('GSummary · datos', () => {
  it('ordena por priority (los que la declaran antes; empates por el arreglo) sin mutar la prop', () => {
    const facts = [{ label: 'C', value: '3' }, { label: 'B', value: '2', priority: 2 }, { label: 'D', value: '4' }, { label: 'A', value: '1', priority: 1 }, { label: 'B2', value: '22', priority: 2 }]
    const copy = JSON.stringify(facts)
    const w = make({ facts, code: 'X' })
    expect(labels(w)).toEqual(['A', 'B', 'B2', 'C', 'D'])
    expect(JSON.stringify(facts)).toBe(copy)
  })
  it('identificador: code si lo hay; si no, el dato de mayor prioridad (is-anchor); el DOM sigue la prioridad', () => {
    const w = make()
    const anchor = w.find('.g-summary__flow > .g-summary__fact.is-anchor')
    expect(anchor.exists()).toBe(true)
    expect(anchor.find('.g-summary__fact-label').text()).toBe('Exp.')
    expect(w.findAll('.g-summary__facts > .g-summary__fact').map((f) => f.find('.g-summary__fact-label').text())).toEqual(['Edad', 'Última visita', 'Médico'])
    const c = make({ code: 'E11.9' })
    expect(c.find('.is-anchor').exists()).toBe(false)
    expect(c.find('.g-summary__code').text()).toBe('E11.9')
    expect(c.findAll('.g-summary__facts > .g-summary__fact').length).toBe(4)
  })
  it('short se ve en lugar de label (y es lo que recibe el lector); valores vacíos, null y undefined se omiten; bare → is-bare', () => {
    const w = make({ facts: [...FACTS, { label: 'Vacío', value: '' }, { label: 'Nulo', value: null }, { label: 'Sin', value: undefined }, { label: 'Cero', value: 0 }] })
    expect(labels(w)).toEqual(['Exp.', 'Edad', 'Última visita', 'Médico', 'Cero'])
    expect(w.find('.is-anchor').text()).toBe('Exp. 001000;')
    expect(w.findAll('.g-summary__fact.is-bare').map((f) => f.find('.g-summary__fact-label').text())).toEqual(['Edad', 'Médico'])
  })
})

describe('GSummary · disposición', () => {
  it('clases por layout y size, con el size por defecto de cada layout', () => {
    expect(make().classes()).toEqual(expect.arrayContaining(['g-summary', 'g-summary--layout-row', 'g-summary--size-md']))
    expect(make({ layout: 'inline' }).classes()).toContain('g-summary--size-xs')
    expect(make({ layout: 'stack' }).classes()).toContain('g-summary--size-lg')
    expect(make({ layout: 'inline', size: 'xl' }).classes()).toContain('g-summary--size-xl')
    expect(GSummary.props.layout.validator('panel')).toBe(false)
    expect(GSummary.props.layout.validator('auto')).toBe(false)
    expect(GSummary.props.size.validator('xxl')).toBe(false)
  })
  it('lines → --_lines, --multi y --free; con subtitle y lines 3 queda una línea de datos y sigue siendo multi', () => {
    const two = make()
    expect(two.element.style.getPropertyValue('--_lines')).toBe('1')
    expect(two.classes()).not.toContain('g-summary--multi')
    const four = make({ lines: 4 })
    expect(four.element.style.getPropertyValue('--_lines')).toBe('3')
    expect(four.classes()).toContain('g-summary--multi')
    expect(four.classes()).not.toContain('g-summary--free')
    const three = make({ lines: 3, subtitle: 'Consultorio 4' })
    expect(three.element.style.getPropertyValue('--_lines')).toBe('1')
    expect(three.classes()).toContain('g-summary--multi')
    const free = make({ lines: 0 })
    expect(free.classes()).toEqual(expect.arrayContaining(['g-summary--multi', 'g-summary--free']))
    expect(free.element.style.getPropertyValue('--_lines')).toBe('1')
    expect(make({ layout: 'inline' }).element.style.getPropertyValue('--_lines')).toBe('')
  })
  it('lines 1, negativo o no entero → 2 con aviso; lines fuera de row se ignora con aviso', () => {
    const one = make({ lines: 1 })
    expect(one.element.style.getPropertyValue('--_lines')).toBe('1')
    expect(one.classes()).not.toContain('g-summary--multi')
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/\[Grana GSummary\] lines debe ser 0/))
    warn.mockClear()
    make({ lines: 2.5 })
    expect(warn).toHaveBeenCalledTimes(1)
    warn.mockClear()
    const s = make({ layout: 'stack', lines: 4 })
    expect(s.classes()).not.toContain('g-summary--multi')
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/lines solo actúa con layout="row"/))
  })
  it('subtitle: siempre en el DOM (con separador), lo vea o no el lector por CSS; sin datos ocupa su línea', () => {
    const w = make({ subtitle: 'Consultorio 4' })
    const sub = w.find('.g-summary__body > .g-summary__subtitle')
    expect(sub.text()).toBe('Consultorio 4')
    expect(sub.attributes('dir')).toBe('auto')
    expect(sub.element.nextElementSibling.className).toBe('g-summary__sep')
    expect(make({ facts: [], subtitle: 'Sola' }).find('.g-summary__data').exists()).toBe(false)
  })
  it('action solo en stack (fuera, no se pinta y avisa)', () => {
    const slots = { action: () => h('button', 'Abrir') }
    const s = make({ layout: 'stack' }, { slots })
    expect(s.find('.g-summary > .g-summary__action button').text()).toBe('Abrir')
    expect(s.find('.g-summary__more').exists()).toBe(false)
    const r = make({}, { slots })
    expect(r.find('.g-summary__action').exists()).toBe(false)
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/slot action solo se pinta con layout="stack"/))
    const empty = make({ layout: 'stack' }, { slots: { action: () => [] } })
    expect(empty.find('.g-summary__action').exists()).toBe(false)
  })
})

describe('GSummary · semántica', () => {
  it('todo es span o mark (contenido de frase); identidad aria-hidden; «+N» aria-hidden y hidden sin recorte', () => {
    const w = make({ avatar: true, status: { label: 'Activa', color: 'success' }, subtitle: 'C4', highlight: 'mar' })
    for (const el of w.element.querySelectorAll('*')) expect(['SPAN', 'MARK', 'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'IMG']).toContain(el.tagName)
    expect(w.element.tagName).toBe('SPAN')
    expect(w.find('.g-summary__lead').attributes('aria-hidden')).toBe('true')
    expect(w.find('.g-summary__lead > .g-avatar').exists()).toBe(true)
    const more = w.find('.g-summary__more')
    expect(more.attributes('aria-hidden')).toBe('true')
    expect(more.element.hidden).toBe(true)
  })
  it('separadores ocultos: tras el código un espacio; tras título, estado, secundaria y cada dato «; » dentro de su parte', () => {
    const w = make({ code: 'E11.9', status: { label: 'Alta' }, subtitle: 'C4' })
    const name = w.find('.g-summary__name')
    expect(name.element.children[0].className).toBe('g-summary__code')
    expect(name.element.children[1].className).toBe('g-summary__sep')
    expect(name.element.children[1].textContent).toBe(' ')
    expect(name.element.children[2].className).toBe('g-summary__title')
    expect(name.element.children[3].textContent).toBe('; ')
    expect(w.find('.g-summary__status').element.lastElementChild.className).toBe('g-summary__sep')
    expect(w.find('.g-summary__fact').element.lastElementChild.className).toBe('g-summary__sep')
    expect(w.text().replace(/\s+/g, ' ')).toBe('E11.9 María García López; Alta; C4; Exp. 001000; Edad 22 años; Última visita 03/02/2026; Médico Dra. Ruiz;')
  })
  it('group → role="group" y aria-labelledby a un id que existe (el del título); sin group, sin rol', () => {
    const w = make({ group: true })
    expect(w.attributes('role')).toBe('group')
    const id = w.attributes('aria-labelledby')
    expect(id).toBeTruthy()
    expect(w.element.querySelector(`[id="${id}"]`).className).toBe('g-summary__title')
    expect(w.find('.g-summary__title').text()).toBe('María García López')
    const plain = make()
    expect(plain.attributes('role')).toBeUndefined()
    expect(plain.attributes('aria-labelledby')).toBeUndefined()
  })
  it('dir="auto" en título, código, secundaria, rótulos y valores; tabular por CSS (sin estilo en línea)', () => {
    const w = make({ code: 'E11.9', subtitle: 'C4' })
    for (const s of ['.g-summary__title', '.g-summary__code', '.g-summary__subtitle', '.g-summary__fact-label', '.g-summary__fact-value']) expect(w.find(s).attributes('dir')).toBe('auto')
    expect(w.attributes('style')).toBe('--_lines: 1;')
  })
  it('loading: aria-busy, formas decorativas, sin contenido ni medida; --_lines con el máximo; sin __data en inline', async () => {
    const w = make({ loading: true, avatar: true, lines: 4 })
    expect(w.attributes('aria-busy')).toBe('true')
    expect(w.classes()).toContain('is-loading')
    expect(w.element.style.getPropertyValue('--_lines')).toBe('3')
    expect(w.find('.g-summary__lead[aria-hidden="true"] > .g-summary__bone').exists()).toBe(true)
    expect(w.find('.g-summary__body[aria-hidden="true"] > .g-summary__head > .g-summary__bone').exists()).toBe(true)
    expect(w.find('.g-summary__body > .g-summary__data > .g-summary__bone').exists()).toBe(true)
    expect(w.text()).toBe('')
    expect(w.find('.g-summary__title').exists()).toBe(false)
    const noLead = make({ loading: true })
    expect(noLead.find('.g-summary__lead').exists()).toBe(false)
    const inline = make({ loading: true, layout: 'inline' })
    expect(inline.find('.g-summary__data').exists()).toBe(false)
    expect(inline.attributes('style')).toBeUndefined()
    await tick()
    expect(w.attributes('data-terse')).toBeUndefined()
  })
  it('vacío: placeholder en el sitio del título (is-empty), con la identidad; sin placeholder, nada y aviso', () => {
    const w = make({ title: undefined, placeholder: 'Sin paciente', avatar: true, facts: [] })
    expect(w.classes()).toContain('is-empty')
    expect(w.find('.g-summary__body > .g-summary__head > .g-summary__name > .g-summary__title').text()).toBe('Sin paciente')
    expect(w.find('.g-summary__lead > .g-avatar').exists()).toBe(true)
    expect(w.find('.g-summary__data').exists()).toBe(false)
    expect(w.attributes('aria-busy')).toBeUndefined()
    const none = make({ title: '  ' })
    expect(none.element.children.length).toBe(0)
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/no tiene title, placeholder ni loading/))
  })
  it('atributos (class, data-*, aria-*, lang) van a la raíz', () => {
    const w = make({}, { attrs: { class: 'mía', 'data-x': '1', lang: 'es', 'aria-describedby': 'd' } })
    expect(w.classes()).toContain('mía')
    expect(w.attributes('data-x')).toBe('1')
    expect(w.attributes('lang')).toBe('es')
    expect(w.attributes('aria-describedby')).toBe('d')
  })
  it('sin eventos propios (no hay emits)', () => {
    expect(GSummary.emits).toBeUndefined()
  })
})

describe('GSummary · identidad y estado', () => {
  it('precedencia del hueco: slot lead › avatar › icon; el slot recibe { size }', () => {
    const w = make({ avatar: true, icon: 'user' }, { slots: { lead: ({ size }) => h('i', { class: 'mío', 'data-size': size }) } })
    expect(w.find('.g-summary__lead > i.mío').attributes('data-size')).toBe('md')
    expect(w.find('.g-avatar').exists()).toBe(false)
    const a = make({ avatar: true, icon: 'user' })
    expect(a.find('.g-summary__lead > .g-avatar').exists()).toBe(true)
    expect(a.find('.g-summary__lead > .g-icon').exists()).toBe(false)
    const i = make({ icon: 'user' })
    expect(i.find('.g-summary__lead > svg.g-icon').exists()).toBe(true)
    expect(make().find('.g-summary__lead').exists()).toBe(false)
    expect(make({}, { slots: { lead: () => [] } }).find('.g-summary__lead').exists()).toBe(false)
  })
  it('avatar: true usa name = title; objeto = props de GAvatar con el lado de la ficha; size y label del objeto se ignoran', () => {
    const t = make({ avatar: true, size: 'lg' })
    const av = t.find('.g-avatar')
    expect(av.classes()).toContain('g-avatar--size-lg')
    expect(av.find('.g-avatar__initials').text()).toBe('ML')
    expect(av.attributes('aria-hidden')).toBe('true')
    const o = make({ avatar: { initials: 'MG', shape: 'square', size: 'xl', label: 'Nombre' } })
    const av2 = o.find('.g-avatar')
    expect(av2.classes()).toEqual(expect.arrayContaining(['g-avatar--size-md', 'g-avatar--shape-square']))
    expect(make({ avatar: { initials: 'MG' }, layout: 'inline' }).find('.g-avatar').classes()).toContain('g-avatar--size-xs')
    expect(av2.find('.g-avatar__initials').text()).toBe('MG')
    expect(av2.attributes('role')).toBeUndefined()
    expect(av2.attributes('aria-hidden')).toBe('true')
  })
  it('status → GBadge sm con color (neutral por defecto) y el texto; slot status gana; sin label y sin slot, nada y aviso', () => {
    const w = make({ status: { label: 'Activa', color: 'success' } })
    const b = w.find('.g-summary__head > .g-summary__status > .g-badge')
    expect(b.classes()).toEqual(expect.arrayContaining(['g-badge--size-sm', 'g-badge--color-success']))
    expect(b.text()).toBe('Activa')
    expect(make({ status: { label: 'Alta' } }).find('.g-badge').classes()).toContain('g-badge--color-neutral')
    const s = make({ status: { label: 'Activa' } }, { slots: { status: () => h('b', 'Propio') } })
    expect(s.find('.g-summary__status > b').text()).toBe('Propio')
    expect(s.find('.g-badge').exists()).toBe(false)
    const none = make({ status: { color: 'danger' } })
    expect(none.find('.g-summary__status').exists()).toBe(false)
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/status necesita label/))
  })
})

describe('GSummary · diff y summaryDiff', () => {
  const P = (title, exp, edad, medico) => ({ title, facts: [{ label: 'Expediente', value: exp, priority: 1 }, { label: 'Edad', value: edad }, { label: 'Médico', value: medico }] })
  it('summaryDiff: homónimos por título plegado; único = diff, compartido = same; dato ausente en la vecina = diff; sin homónimos → null', () => {
    const list = [P('María García López', '001000', '22 años', 'Dra. Ruiz'), P('maria  garcia lopez ', '004417', '47 años', 'Dra. Ruiz'), P('Mario Garza', '000317', '35 años', 'Dr. Peña'),
      { title: 'MARÍA GARCÍA LÓPEZ', facts: [{ label: 'Edad', value: ' 22 años ' }, { label: 'Sala', value: '4B' }, { label: 'Vacío', value: '' }] }]
    expect(summaryDiff(list)).toEqual([
      { Expediente: 'diff', Edad: 'same', Médico: 'same' },
      { Expediente: 'diff', Edad: 'diff', Médico: 'same' },
      null,
      { Edad: 'same', Sala: 'diff' }
    ])
  })
  it('summaryDiff: pura y tolerante (no muta; entradas raras; homónimas sin datos → {})', () => {
    const list = [{ title: 'A' }, { title: 'a', facts: null }, { facts: [] }, null]
    const copy = JSON.stringify(list)
    expect(summaryDiff(list)).toEqual([{}, {}, null, null])
    expect(JSON.stringify(list)).toBe(copy)
    expect(summaryDiff()).toEqual([])
    expect(summaryDiff([P('X', '1', '2', '3'), P('X', '1', '2', '3')])).toEqual([{ Expediente: 'same', Edad: 'same', Médico: 'same' }, { Expediente: 'same', Edad: 'same', Médico: 'same' }])
  })
  it('diff pinta is-diff / is-same por label (el identificador también recibe la clase); claves raras se ignoran con aviso; sin diff, sin marcas', () => {
    const w = make({ diff: { Expediente: 'diff', Edad: 'same', 'Última visita': 'raro', Médico: 'diff' } })
    const cls = (label) => w.findAll('.g-summary__fact').find((f) => f.find('.g-summary__fact-label').text() === label).classes()
    expect(cls('Exp.')).toEqual(expect.arrayContaining(['is-anchor', 'is-diff']))
    expect(cls('Edad')).toContain('is-same')
    expect(cls('Última visita')).not.toContain('is-same')
    expect(cls('Última visita')).not.toContain('is-diff')
    expect(cls('Médico')).toContain('is-diff')
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/diff\['Última visita'\] vale «raro»/))
    expect(make().find('.is-diff, .is-same').exists()).toBe(false)
  })
})

describe('GSummary · highlight', () => {
  it('marca la primera aparición de cada palabra (sin acentos ni mayúsculas) en título, código, secundaria y valores; no en rótulos', () => {
    const w = make({ code: 'MAR-1', subtitle: 'Marítimo', highlight: 'mar ruiz', facts: [{ label: 'Mar', value: 'Dra. Ruiz' }, { label: 'Dos', value: 'mar y mar' }] })
    const marks = w.findAll('mark.g-summary__mark').map((m) => [m.text(), m.element.parentElement.className])
    expect(marks).toEqual([['MAR', 'g-summary__code'], ['Mar', 'g-summary__title'], ['Mar', 'g-summary__subtitle'], ['Ruiz', 'g-summary__fact-value'], ['mar', 'g-summary__fact-value']])
    expect(w.find('.g-summary__fact-label mark').exists()).toBe(false)
    expect(w.find('.g-summary__title').text()).toBe('María García López')
    expect(make({ highlight: '' }).find('mark').exists()).toBe(false)
  })
})

describe('GSummary · medida (cajas simuladas)', () => {
  const W = { Edad: 40, 'Última visita': 70, Médico: 60 }
  beforeEach(() => { vi.stubGlobal('ResizeObserver', RO); vi.stubGlobal('matchMedia', () => ({ matches: false })) })
  afterEach(() => { vi.unstubAllGlobals() })

  it('ancho de sobra: nada recortado, sin marcas, «+N» oculta', async () => {
    const w = make({}, { attachTo: document.body })
    scene(w, { width: 400, widths: W })
    await tick()
    expect(clippedOf(w)).toEqual([])
    expect(w.attributes('data-terse')).toBeUndefined()
    expect(w.attributes('data-tight')).toBeUndefined()
    expect(w.find('.g-summary__more').element.hidden).toBe(true)
  })
  it('pasada 1: antes de soltar un dato se callan los rótulos bare (data-terse) y con eso cabe todo', async () => {
    // 60 (id) + Edad 60 + visita 90 + médico 80 = 290 > 280; sin rótulos bare: 60 + 40 + 90 + 60 = 250
    const w = make({}, { attachTo: document.body })
    scene(w, { width: 280, widths: W })
    await tick()
    expect(w.attributes('data-terse')).toBe('')
    expect(clippedOf(w)).toEqual([])
    expect(w.find('.g-summary__more').element.hidden).toBe(true)
  })
  it('pasada 2: «+N» = número de datos recortados (por el final de la prioridad), contada con «+N» ya a la vista', async () => {
    // caja 200 − 60 = 140 → sin rótulos bare: Edad 40 + visita 90 = 130 cabe, médico 60 salta; con «+N» (30): 110 → visita también salta
    const w = make({}, { attachTo: document.body })
    scene(w, { width: 200, widths: W })
    await tick()
    expect(w.attributes('data-terse')).toBe('')
    expect(clippedOf(w)).toEqual(['Última visita', 'Médico'])
    const more = w.find('.g-summary__more')
    expect(more.element.hidden).toBe(false)
    expect(more.text()).toBe('+2')
    expect(more.attributes('aria-hidden')).toBe('true')
    // Lo recortado sigue en el árbol: ni display:none ni aria-hidden
    for (const f of w.findAll('[data-clipped]')) expect(f.element.closest('[aria-hidden="true"]')).toBeNull()
  })
  it('pasada 3: el identificador no cabe entero → data-tight: sin «+N», todos los demás datos fuera', async () => {
    const w = make({}, { attachTo: document.body })
    scene(w, { width: 50, widths: W, anchorNeed: 60 })
    await tick()
    expect(w.attributes('data-tight')).toBe('')
    expect(w.find('.g-summary__more').element.hidden).toBe(true)
    expect(clippedOf(w)).toEqual(['Edad', 'Última visita', 'Médico'])
    // Convergencia: una segunda medida sin cambios no toca nada (atributos idénticos)
    const html = w.html()
    resize(w.element)
    await frames()
    expect(w.html()).toBe(html)
  })
  it('title nativo solo en la parte con elipsis, y se retira cuando vuelve a caber', async () => {
    const w = make({}, { attachTo: document.body })
    scene(w, { width: 400, widths: W, titleNeed: 500 })
    await tick()
    expect(w.find('.g-summary__title').attributes('title')).toBe('María García López')
    expect(w.find('.is-anchor').attributes('title')).toBeUndefined()
    scenes.get(w.element).titleNeed = 100
    scenes.get(w.element).width = 401
    resize(w.element)
    await frames()
    expect(w.find('.g-summary__title').attributes('title')).toBeUndefined()
  })
  it('data-enter solo en los datos que pasan de recortados a visibles por un cambio de tamaño; nunca al montar ni al cambiar los datos', async () => {
    const w = make({}, { attachTo: document.body })
    scene(w, { width: 200, widths: W })
    vi.stubGlobal('getComputedStyle', (el) => ({ animationName: el.classList && el.classList.contains('g-summary__fact') ? 'g-summary-enter' : 'none', getPropertyValue: () => '' }))
    await tick()
    expect(w.findAll('[data-enter]').length).toBe(0)
    expect(clippedOf(w)).toEqual(['Última visita', 'Médico'])
    scenes.get(w.element).width = 400
    resize(w.element)
    await frames()
    expect(clippedOf(w)).toEqual([])
    expect(w.findAll('[data-enter]').map((f) => f.find('.g-summary__fact-label').text())).toEqual(['Última visita', 'Médico'])
    // Se retira en animationend / animationcancel de g-summary-enter… (y no con otra animación)
    const f = w.find('[data-enter]').element
    f.dispatchEvent(new Event('animationend', { bubbles: true }))
    expect(f.hasAttribute('data-enter')).toBe(true)
    const ev = new Event('animationend', { bubbles: true }); ev.animationName = 'g-summary-enter-rtl'
    f.dispatchEvent(ev)
    expect(f.hasAttribute('data-enter')).toBe(false)
    const ev2 = new Event('animationcancel', { bubbles: true }); ev2.animationName = 'g-summary-enter'
    w.find('[data-enter]').element.dispatchEvent(ev2)
    expect(w.findAll('[data-enter]').length).toBe(0)
    // Cambio de datos: se vuelve a medir sin que nada «entre»
    scenes.get(w.element).width = 200
    resize(w.element)
    await frames()
    expect(clippedOf(w)).toEqual(['Última visita', 'Médico'])
    await w.setProps({ facts: FACTS.slice(0, 2) })
    await tick()
    expect(w.findAll('[data-enter]').length).toBe(0)
    expect(clippedOf(w)).toEqual([])
  })
  it('con prefers-reduced-motion: reduce no se pone data-enter; sin animación calculada se retira en el acto', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    const w = make({}, { attachTo: document.body })
    scene(w, { width: 200, widths: W })
    await tick()
    scenes.get(w.element).width = 400
    resize(w.element)
    await frames()
    expect(clippedOf(w)).toEqual([])
    expect(w.findAll('[data-enter]').length).toBe(0)
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    const v = make({}, { attachTo: document.body })
    scene(v, { width: 200, widths: W })
    await tick()
    scenes.get(v.element).width = 400
    resize(v.element)
    await frames()
    expect(v.findAll('[data-enter]').length).toBe(0) // jsdom: animationName vacío = sin animación → retirada inmediata
  })
  it('multi (lines 4): se recorta por líneas, el identificador fluye con los datos y data-tight no retira los datos', async () => {
    const w = make({ lines: 3 }, { attachTo: document.body })
    scene(w, { width: 100, widths: { Edad: 30, 'Última visita': 30, Médico: 90 }, moreW: 0 })
    await tick()
    // Dos líneas de datos (lines 3 − cabecera): identificador y Edad en la 1.ª, visita en la 2.ª, médico en la 3.ª (fuera)
    expect(w.attributes('data-terse')).toBe('')
    expect(clippedOf(w)).toEqual(['Médico'])
    expect(w.find('.g-summary__more').text()).toBe('+1')
    expect(w.attributes('data-tight')).toBeUndefined()
  })
  it('no mide en stack ni con loading; al pasar a stack retira lo medido; sin ResizeObserver no falla', async () => {
    const w = make({}, { attachTo: document.body })
    scene(w, { width: 200, widths: W })
    await tick()
    expect(w.findAll('[data-clipped]').length).toBe(2)
    await w.setProps({ layout: 'stack' })
    await tick()
    expect(w.findAll('[data-clipped]').length).toBe(0)
    expect(w.attributes('data-terse')).toBeUndefined()
    await w.setProps({ layout: 'row' })
    await tick()
    expect(w.findAll('[data-clipped]').length).toBe(2)
    await w.setProps({ loading: true })
    await tick()
    expect(w.attributes('data-terse')).toBeUndefined()
    vi.stubGlobal('ResizeObserver', undefined)
    const v = make({}, { attachTo: document.body })
    scene(v, { width: 200, widths: W })
    await tick()
    expect(clippedOf(v)).toEqual(['Última visita', 'Médico'])
    v.unmount()
  })
  it('aviso 8: tras montar mide 0 de ancho (el anfitrión no le da sitio); una ficha sin caja (display: none) no avisa', async () => {
    const w = make({}, { attachTo: document.body })
    scene(w, { width: 0, widths: W })
    await tick()
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/mide 0 de ancho/))
    warn.mockClear()
    const v = make({}, { attachTo: document.body }) // sin escenario: getClientRects vacío = sin caja
    await tick()
    expect(warn).not.toHaveBeenCalled()
  })
})

describe('GSummary · avisos y empaquetado', () => {
  it('avisos 2 y 7: dato sin label (se omite) y labels repetidos; group sin title', () => {
    const w = make({ facts: [{ value: 'x' }, { label: 'A', value: '1' }, { label: 'A', value: '2' }] })
    expect(labels(w)).toEqual(['A', 'A'])
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/un dato de facts no tiene label/))
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/comparten el label «A»/))
    warn.mockClear()
    make({ title: undefined, placeholder: 'Sin paciente', group: true })
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/group necesita title/))
  })
  it('se exporta desde @grana/vue (GSummary, summaryDiff) y por __shared sin copia; el código no conoce a su anfitrión', () => {
    expect(main.GSummary).toBe(GSummary)
    expect(main.summaryDiff).toBe(summaryDiff)
    expect(shared['components/GSummary/GSummary.vue'].default).toBe(GSummary)
    expect(shared['components/GSummary/diff.js'].summaryDiff).toBe(summaryDiff)
    expect(Object.keys(shared['utils/match.js']).sort()).toEqual(['fold', 'parts', 'tokens'])
    const dir = resolve(process.cwd(), 'src')
    for (const f of ['components/GSummary/GSummary.vue', 'components/GSummary/measure.js', 'components/GSummary/diff.js', 'utils/match.js', 'shared.js']) {
      expect(readFileSync(resolve(dir, f), 'utf8'), f).not.toContain('GCombobox')
    }
    const css = readFileSync(resolve(dir, 'styles/components.css'), 'utf8')
    expect(css).toContain('components/GSummary/GSummary.css')
    expect(css.indexOf('GSummary/GSummary.css')).toBeLessThan(css.indexOf('GCombobox/GCombobox.css'))
    for (const dep of ['GAvatar', 'GBadge', 'GIcon']) expect(css.indexOf('GSummary/GSummary.css'), dep).toBeGreaterThan(css.indexOf(`${dep}/${dep}.css`))
    const vue = readFileSync(resolve(dir, 'components/GSummary/GSummary.vue'), 'utf8')
    expect(vue).not.toMatch(/<style/)
    // Sin literales de tema (colores, px, respaldos); los «#NNN» de los comentarios son decisiones, no colores
    expect(vue.replace(/\/\/.*$/gm, '')).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\d+px|var\(--[a-z-]+,/)
  })
  it('app.use(Grana) registra <g-summary>', () => {
    const w = mount({ template: '<g-summary title="Ana" />' }, { global: { plugins: [main.default] } })
    expect(w.find('.g-summary__title').text()).toBe('Ana')
  })
})
