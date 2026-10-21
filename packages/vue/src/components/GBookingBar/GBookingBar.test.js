// GBookingBar (booking-bar.md; #736 a #742, #757, #759): frase, barra, validación, intención, ocultos, muelle.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createSSRApp, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import GBookingBar from './GBookingBar.vue'
import GForm from '../GForm/GForm.vue'
import { resetDialogStack } from '../../utils/dialogStack.js'
import { edgeReserve, setEdgeReserve, clearEdgeReserve, EDGE_ORDER } from '../../utils/edgeReserve.js'

vi.mock('../../utils/dates.js', async (orig) => ({ ...(await orig()), todayISO: () => '2026-11-02' }))

beforeEach(() => {
  HTMLElement.prototype.showPopover = function () { this.setAttribute('data-popover-open', '') }
  HTMLElement.prototype.hidePopover = function () { this.removeAttribute('data-popover-open') }
  const orig = HTMLElement.prototype.matches
  HTMLElement.prototype.matches = function (sel) { return sel === ':popover-open' ? this.hasAttribute('data-popover-open') : orig.call(this, sel) }
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () { if (!this.hasAttribute('open')) return; this.removeAttribute('open'); this.dispatchEvent(new Event('close')) }
})
afterEach(() => { vi.restoreAllMocks(); resetDialogStack(); document.body.innerHTML = '' })

const ROWS = [
  { key: 'adults', label: 'Adultos', min: 1, default: 2, unit: (n) => `${n} ${n === 1 ? 'adulto' : 'adultos'}`, decrementLabel: '−', incrementLabel: '+' },
  { key: 'children', label: 'Niños', unit: (n) => `${n} ${n === 1 ? 'niño' : 'niños'}`, decrementLabel: '−', incrementLabel: '+' },
  { key: 'rooms', label: 'Habitaciones', min: 1, max: (v) => v.adults, unit: (n) => `${n} ${n === 1 ? 'habitación' : 'habitaciones'}`, decrementLabel: '−', incrementLabel: '+' }
]
const DP = { prev: 'Mes anterior', next: 'Mes siguiente', dialog: 'Elegir fecha', close: 'Cerrar' }
const LABELS = {
  phrase: 'Llego el {from}, me quedo {nights} y somos {party}.',
  fields: { from: 'Llegada', to: 'Salida', nights: 'Noches', date: 'Día', time: 'Hora', tour: 'Recorrido', party: 'Huéspedes' },
  empty: { from: '¿qué día?', nights: '¿cuántas noches?', date: '¿qué día?', time: '¿a qué hora?', tour: '¿cuál?' },
  nights: (n) => `${n} ${n === 1 ? 'noche' : 'noches'}`, checkout: 'Salida el {date}',
  noDates: 'Sin fechas', noDate: 'Sin fecha', noTime: 'Sin hora', noTour: 'Sin recorrido', separator: ' · ',
  summaryTitle: 'Tu consulta', change: 'Cambiar', submit: 'Ver disponibilidad', pending: 'Consultando…', close: 'Cerrar', done: 'Listo',
  otherDay: 'Otro día', full: 'lleno', decrement: 'Una noche menos', increment: 'Una noche más',
  errors: { dates: 'Elige las fechas.', night: 'No quedan habitaciones la noche del {date}.', nights: 'Elige entre 2 y 7 noches.', date: 'Elige el día.', time: 'Elige la hora.', tour: 'Elige el recorrido.' },
  missing: (n, v) => `Faltan ${v.count} datos: ${v.list}`,
  datePicker: DP
}
const mk = (props = {}, opts = {}) => mount(GBookingBar, { attachTo: document.body, props: { kind: 'stay', title: 'Consulta disponibilidad', partyRows: ROWS, labels: LABELS, locale: 'es', ...props }, ...opts })
const flush = async () => { for (let i = 0; i < 5; i++) await nextTick() }
const quiet = () => vi.spyOn(console, 'warn').mockImplementation(() => {})
const submit = async (w) => { const ev = new Event('submit', { bubbles: true, cancelable: true }); w.find('form').element.dispatchEvent(ev); await flush(); return ev }
const slot = (w, s) => w.find(`.g-booking-bar__slot[id$="-slot-${s}"]`)

describe('GBookingBar · estructura', () => {
  it('form role=search con nombre por el título; novalidate; ocultos siempre', () => {
    const w = mk()
    const f = w.find('form')
    expect(f.classes()).toEqual(expect.arrayContaining(['g-booking-bar', 'g-booking-bar--appearance-phrase', 'g-booking-bar--kind-stay']))
    expect(f.attributes('role')).toBe('search')
    expect(f.attributes('novalidate')).toBeDefined()
    expect(f.attributes('aria-labelledby')).toBe(w.find('h2.g-booking-bar__title').attributes('id'))
    expect(w.findAll('input[type="hidden"]').map((i) => i.attributes('name'))).toEqual(['from', 'to', 'party[adults]', 'party[children]', 'party[rooms]'])
  })

  it('names renombra los ocultos; nights con names.nights', () => {
    const w = mk({ names: { from: 'checkin', to: 'checkout', party: 'guests', nights: 'n' }, modelValue: { from: '2026-11-09', to: '2026-11-11', party: { adults: 2, children: 0, rooms: 1 } } })
    const map = Object.fromEntries(w.findAll('input[type="hidden"]').map((i) => [i.attributes('name'), i.attributes('value')]))
    expect(map).toEqual({ checkin: '2026-11-09', checkout: '2026-11-11', n: '2', 'guests[adults]': '2', 'guests[children]': '0', 'guests[rooms]': '1' })
  })

  it('el envío nativo lleva solo los ocultos (formdata filtra los controles internos)', () => {
    const w = mk({ kind: 'table', times: [{ value: '20:00' }], labels: { ...LABELS, phrase: 'Mesa para {party} el {date} a las {time}.' } })
    const fd = new FormData()
    fd.append('date', ''); fd.append('x-radio', '20:00')
    const ev = new Event('formdata'); ev.formData = fd
    w.find('form').element.dispatchEvent(ev)
    expect([...fd.keys()]).toEqual(['date'])
  })
})

describe('GBookingBar · A · La frase', () => {
  it('la plantilla se pinta como texto con un hueco por marcador, en un div (nunca un <p>)', () => {
    const w = mk()
    const p = w.find('div.g-booking-bar__phrase')
    expect(p.exists()).toBe(true)
    expect(p.attributes('dir')).toBe('auto')
    const own = [...p.element.childNodes].filter((n) => n.nodeType === 3 && n.textContent).map((n) => n.textContent).join('|')
    expect(own).toBe('Llego el |, me quedo | y somos |.')
    expect(w.findAll('.g-booking-bar__slot')).toHaveLength(3)
    expect(w.find('.g-datepicker').classes()).toContain('g-datepicker--trigger')
    expect(w.find('.g-party-field').classes()).toContain('g-party-field--trigger')
  })

  it('el orden lo da el idioma: otra plantilla, otro orden de huecos', () => {
    const w = mk({ labels: { ...LABELS, phrase: 'Somos {party}, llegamos el {from} por {nights}.' } })
    expect(w.findAll('.g-booking-bar__slot').map((s) => s.attributes('id').split('-slot-')[1])).toEqual(['party', 'from', 'nights'])
  })

  it('hueco: nombre = rótulo oculto + valor visible; vacío is-empty con su texto, lleno is-filled', () => {
    const w = mk()
    const s = slot(w, 'from')
    expect(s.attributes()).toMatchObject({ type: 'button', 'aria-haspopup': 'dialog', 'aria-expanded': 'false' })
    const [l, v] = s.attributes('aria-labelledby').split(' ')
    expect(w.find(`#${l}`).classes()).toContain('g-booking-bar__slot-label')
    expect(w.find(`#${l}`).text()).toBe('Llegada')
    expect(w.find(`#${v}`).text()).toBe('¿qué día?')
    expect(s.classes()).toContain('is-empty')
    expect(slot(w, 'party').classes()).toContain('is-filled')
    expect(slot(w, 'party').find('.g-booking-bar__slot-value').text()).toBe('2 adultos · 1 habitación')
  })

  it('marcador que falta: se pinta como bar y avisa (aviso 6); marcador desconocido, literal y aviso', () => {
    const spy = quiet()
    const a = mk({ labels: { ...LABELS, phrase: 'Llego el {from} y somos {party}.' } })
    expect(a.find('form').classes()).toContain('g-booking-bar--appearance-bar')
    const b = mk({ labels: { ...LABELS, phrase: 'Llego el {from}, {nights}, {party} {precio}.' } })
    expect(b.find('.g-booking-bar__phrase').text()).toContain('{precio}')
    expect(spy.mock.calls.filter((c) => String(c[0]).includes('aviso 6')).length).toBeGreaterThanOrEqual(2)
  })

  it('noches: el hueco abre su panel con el contador y la salida en palabras; cambiar noches escribe to', async () => {
    const w = mk({ modelValue: { from: '2026-11-09', to: '2026-11-11', party: { adults: 2, children: 0, rooms: 1 } } })
    expect(slot(w, 'nights').find('.g-booking-bar__slot-value').text()).toBe('2 noches')
    slot(w, 'nights').element.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))
    await flush()
    const panel = w.find('[id$="-panel-nights"]')
    expect(panel.attributes('role')).toBe('dialog')
    expect(panel.attributes('aria-label')).toBe('Noches')
    expect(panel.attributes('data-popover-open')).toBeDefined()
    expect(panel.find('.g-booking-bar__checkout').text()).toMatch(/^Salida el miércoles, 11 de noviembre$/)
    const inc = panel.find('.g-number-field__step--increment')
    await inc.trigger('pointerdown', { button: 0 }); await inc.trigger('pointerup', { button: 0 }); await flush()
    expect(w.emitted('update:modelValue').at(-1)[0]).toMatchObject({ from: '2026-11-09', to: '2026-11-12' })
  })

  it('las noches elegidas antes que la llegada se aplican al elegirla', async () => {
    const w = mk()
    slot(w, 'nights').element.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 })); await flush()
    const inc = w.find('[id$="-panel-nights"] .g-number-field__step--increment')
    await inc.trigger('pointerdown', { button: 0 }); await inc.trigger('pointerup', { button: 0 }); await flush()
    expect(slot(w, 'nights').find('.g-booking-bar__slot-value').text()).toMatch(/noche/)
    w.findComponent({ name: 'GDatePicker' }).vm.$emit('update:modelValue', '2026-11-09')
    await flush()
    const last = w.emitted('update:modelValue').at(-1)[0]
    expect(last.from).toBe('2026-11-09')
    expect(last.to).not.toBeNull()
  })

  it('table: los turnos llenos se deshabilitan con el sufijo de texto', async () => {
    const w = mk({ kind: 'table', times: [{ value: '14:00', disabled: true }, { value: '20:00' }, { value: '21:00', disabled: 'reservado' }], labels: { ...LABELS, phrase: 'Mesa para {party} el {date} a las {time}.' } })
    const panel = w.find('[id$="-panel-time"]')
    const labels = panel.findAll('.g-radio-group__label, label').map((l) => l.text())
    expect(labels.join('|')).toContain('14:00 · lleno')
    expect(labels.join('|')).toContain('21:00 · reservado')
    expect(panel.findAll('input[type="radio"]:disabled')).toHaveLength(2)
  })

  it('quickDays: el hueco de fecha ofrece hoy, mañana… y «Otro día»', async () => {
    const w = mk({ kind: 'table', times: [{ value: '20:00' }], quickDays: 3, labels: { ...LABELS, phrase: 'Mesa para {party} el {date} a las {time}.' } })
    slot(w, 'date').element.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 })); await flush()
    const panel = w.find('[id$="-panel-quick"]')
    expect(panel.attributes('data-popover-open')).toBeDefined()
    const texts = panel.findAll('label').map((l) => l.text())
    expect(texts[0]).toBe('hoy')
    expect(texts[1]).toBe('mañana')
    expect(panel.find('.g-booking-bar__other').text()).toBe('Otro día')
  })
})

describe('GBookingBar · validación e intención', () => {
  it('enviar incompleto: sin submit, aria-invalid y mensaje en el hueco, foco al primero, anuncio por el canal de página', async () => {
    const w = mk()
    const ev = await submit(w)
    expect(ev.defaultPrevented).toBe(true)
    expect(w.emitted('submit')).toBeUndefined()
    const s = slot(w, 'from')
    expect(s.attributes('aria-invalid')).toBe('true')
    expect(s.classes()).toContain('is-invalid')
    const msg = w.find(`#${s.attributes('aria-describedby')}`)
    expect(msg.text()).toBe('Elige las fechas.')
    expect(document.activeElement).toBe(s.element)
    await new Promise((r) => setTimeout(r, 80))
    expect(document.querySelector('.g-load-live').textContent).toBe('Faltan 1 datos: Llegada')
  })

  it('noche agotada dentro de la estancia: error con la fecha en palabras; salir un día agotado es válido', async () => {
    const off = (iso) => iso === '2026-11-06'
    const a = mk({ disabledNights: off, modelValue: { from: '2026-11-05', to: '2026-11-08', party: { adults: 2, children: 0, rooms: 1 } } })
    await submit(a)
    expect(a.emitted('submit')).toBeUndefined()
    expect(a.find('.g-booking-bar__messages').text()).toBe('No quedan habitaciones la noche del viernes, 6 de noviembre.')
    expect(slot(a, 'nights').attributes('aria-invalid')).toBe('true')
    const b = mk({ disabledNights: off, modelValue: { from: '2026-11-04', to: '2026-11-06', party: { adults: 2, children: 0, rooms: 1 } } })
    await submit(b)
    expect(b.emitted('submit')).toHaveLength(1)
  })

  it('minNights / maxNights: fuera de rango, errors.nights', async () => {
    const w = mk({ minNights: 2, maxNights: 7, modelValue: { from: '2026-11-04', to: '2026-11-05', party: { adults: 2, children: 0, rooms: 1 } } })
    await submit(w)
    expect(w.find('.g-booking-bar__messages').text()).toBe('Elige entre 2 y 7 noches.')
  })

  it('intención exacta en los tres kind; sin action se cancela el envío nativo', async () => {
    const party = { adults: 2, children: 1, rooms: 1 }
    const s = mk({ modelValue: { from: '2026-11-09', to: '2026-11-11', party } })
    const e1 = await submit(s)
    const p1 = s.emitted('submit')[0][0]
    expect({ kind: p1.kind, from: p1.from, to: p1.to, nights: p1.nights, party: p1.party }).toEqual({ kind: 'stay', from: '2026-11-09', to: '2026-11-11', nights: 2, party })
    expect(p1.event).toBe(e1)
    expect(e1.defaultPrevented).toBe(true)
    const t = mk({ kind: 'table', times: [{ value: '20:30' }], labels: { ...LABELS, phrase: 'Mesa para {party} el {date} a las {time}.' }, modelValue: { date: '2026-11-02', time: '20:30', party } })
    await submit(t)
    const p2 = t.emitted('submit')[0][0]
    expect({ kind: p2.kind, date: p2.date, time: p2.time }).toEqual({ kind: 'table', date: '2026-11-02', time: '20:30' })
    expect('nights' in p2).toBe(false)
    const r = mk({ kind: 'tour', tours: [{ value: 'ma', label: 'Monte Albán' }], labels: { ...LABELS, phrase: 'Quiero {tour} el {date} para {party}.' }, modelValue: { tour: 'ma', date: '2026-11-07', party } })
    await submit(r)
    expect(r.emitted('submit')[0][0]).toMatchObject({ kind: 'tour', tour: 'ma', date: '2026-11-07' })
  })

  it('con action: envío nativo salvo que la aplicación llame a preventDefault()', async () => {
    const q = { from: '2026-11-09', to: '2026-11-11', party: { adults: 2, children: 0, rooms: 1 } }
    const a = mk({ modelValue: q }, { attrs: { action: '/motor', method: 'get' } })
    expect((await submit(a)).defaultPrevented).toBe(false)
    const b = mk({ modelValue: q, onSubmit: (p) => p.preventDefault() }, { attrs: { action: '/motor' } })
    const ev = await submit(b)
    expect(ev.defaultPrevented).toBe(true)
    expect(b.emitted('submit')[0][0].defaultPrevented).toBe(true)
  })

  it('pending: la acción pasa a GBtn loading con labels.pending', () => {
    const w = mk({ pending: true })
    const b = w.find('.g-booking-bar__submit')
    expect(b.classes()).toContain('is-loading')
    expect(w.find('.g-btn__status').exists()).toBe(true)
  })

  it('resumen: nombra lo que falta y es la descripción de la acción', () => {
    const w = mk()
    const d = w.find('.g-booking-bar__digest')
    expect(d.text()).toBe('Sin fechas · 2 adultos · 1 habitación')
    expect(w.find('.g-booking-bar__submit').attributes('aria-describedby')).toBe(d.attributes('id'))
    const f = mk({ modelValue: { from: '2026-11-13', to: '2026-11-15', party: { adults: 2, children: 0, rooms: 1 } } })
    expect(f.find('.g-booking-bar__digest').text()).toMatch(/13.*15.*nov.* · 2 noches · 2 adultos · 1 habitación$/)
  })

  it('aislada de un GForm exterior; dentro de otro <form> avisa (aviso 5)', async () => {
    const spy = quiet()
    mount({ render: () => h(GForm, { errors: { from: 'x' } }, () => h(GBookingBar, { title: 'C', partyRows: ROWS, labels: LABELS })) }, { attachTo: document.body })
    await flush()
    expect(spy.mock.calls.some((c) => String(c[0]).includes('aviso 5'))).toBe(true)
  })

  it('disabled: todo deshabilitado', () => {
    const w = mk({ disabled: true })
    expect(w.find('form').classes()).toContain('is-disabled')
    for (const s of w.findAll('.g-booking-bar__slot')) expect(s.attributes('disabled')).toBeDefined()
    expect(w.find('.g-booking-bar__submit').attributes('disabled')).toBeDefined()
  })
})

describe('GBookingBar · la barra', () => {
  it('stay: rango partido con block y GPartyField block en div.__field; la acción del mismo tamaño', () => {
    const w = mk({ appearance: 'bar' })
    const row = w.find('.g-booking-bar__row')
    expect(row.findAll('.g-booking-bar__field')).toHaveLength(2)
    expect(row.find('.g-datepicker').classes()).toEqual(expect.arrayContaining(['g-datepicker--split', 'g-datepicker--block', 'g-datepicker--mode-range']))
    expect(row.find('.g-party-field').classes()).toContain('g-party-field--block')
    expect(row.find('.g-booking-bar__submit').classes()).toContain('g-btn--size-md')
  })

  it('compacto: si la fila desborda pasa a resumen + acción (con histéresis) y el resumen abre la hoja con los campos en línea', async () => {
    const cbs = []
    globalThis.ResizeObserver = class { constructor(fn) { cbs.push(fn) } observe() {} unobserve() {} disconnect() {} }
    let formW = 300
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function () { return this.classList?.contains('g-booking-bar__row') ? 700 : 0 })
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function () { return this.classList?.contains('g-booking-bar__row') ? formW : this.tagName === 'FORM' ? formW : 0 })
    const w = mk({ appearance: 'bar' })
    await flush(); await new Promise((r) => setTimeout(r, 30)); await flush()
    expect(w.find('form').classes()).toContain('is-compact')
    const sum = w.find('button.g-booking-bar__summary')
    expect(sum.findAll('span').map((s) => s.classes()[0])).toEqual(['g-booking-bar__summary-title', 'g-booking-bar__summary-text', 'g-booking-bar__summary-change'])
    expect(sum.attributes('aria-haspopup')).toBe('dialog')
    sum.element.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 })); await flush()
    const sheet = document.querySelector('dialog.g-booking-bar__sheet')
    expect(sheet.hasAttribute('open')).toBe(true)
    expect(sheet.querySelector('.g-datepicker--inline')).not.toBeNull()
    expect(sheet.querySelector('.g-party-field--mode-inline')).not.toBeNull()
    // Histéresis: a 650 todavía compacto; a 700, vuelve a la fila
    formW = 650; cbs.forEach((fn) => fn([{ target: w.find('form').element }])); await new Promise((r) => setTimeout(r, 30)); await flush()
    expect(w.find('form').classes()).toContain('is-compact')
    formW = 720; cbs.forEach((fn) => fn([{ target: w.find('form').element }])); await new Promise((r) => setTimeout(r, 30)); await flush()
    expect(w.find('form').classes()).not.toContain('is-compact')
  })
})

describe('GBookingBar · B · El muelle', () => {
  let ios = []
  beforeEach(() => {
    ios = []
    globalThis.IntersectionObserver = class { constructor(fn) { this.fn = fn; ios.push(this) } observe() {} disconnect() {} }
  })
  const leave = async () => { ios[0].fn([{ isIntersecting: false, boundingClientRect: { bottom: -10 } }]); await flush() }

  it('oculto: hidden + inert sin is-shown; al salir la consulta por arriba: is-shown, sin hidden ni inert, y publica su alto con bookingDock', async () => {
    Object.defineProperty(window, 'innerHeight', { value: 900, configurable: true })
    const w = mk({ dock: true })
    await flush()
    const d = () => w.find('.g-booking-bar__dock')
    expect(d().attributes('hidden')).toBeDefined()
    expect(d().attributes('inert')).toBeDefined()
    expect(d().classes()).not.toContain('is-shown')
    await leave()
    expect(d().classes()).toContain('is-shown')
    expect(d().attributes('hidden')).toBeUndefined()
    expect(d().attributes('inert')).toBeUndefined()
    expect(edgeReserve('bottom')).toBe(64)
    expect(edgeReserve('bottom', { before: EDGE_ORDER.fab })).toBe(64)
    expect(d().find('.g-booking-bar__dock-summary').text()).toBe('Sin fechas · 2 adultos · 1 habitación')
    ios[0].fn([{ isIntersecting: true, boundingClientRect: { bottom: 100 } }]); await flush()
    expect(d().attributes('hidden')).toBeDefined()
    expect(edgeReserve('bottom')).toBe(0)
  })

  it('--_reserve: lo que hay debajo (navbar del chasis) en px', async () => {
    Object.defineProperty(window, 'innerHeight', { value: 900, configurable: true })
    const owner = {}
    setEdgeReserve(owner, 'bottom', 56, { order: EDGE_ORDER.appShell })
    const w = mk({ dock: true })
    await flush(); await leave()
    expect(w.find('.g-booking-bar__dock').attributes('style')).toContain('--_reserve: 56px')
    clearEdgeReserve(owner)
  })

  it('presupuesto del cuarto: si con lo de abajo pasa del 25 % del visor, no aparece', async () => {
    Object.defineProperty(window, 'innerHeight', { value: 300, configurable: true })
    const owner = {}
    setEdgeReserve(owner, 'bottom', 40, { order: EDGE_ORDER.appShell })
    const w = mk({ dock: true })
    await flush(); await leave()
    expect(w.find('.g-booking-bar__dock').classes()).not.toContain('is-shown')
    clearEdgeReserve(owner)
  })

  it('«Cambiar» abre la hoja de la misma consulta (también con la frase)', async () => {
    Object.defineProperty(window, 'innerHeight', { value: 900, configurable: true })
    const w = mk({ dock: true })
    await flush(); await leave()
    w.find('.g-booking-bar__dock-change').element.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 })); await flush()
    expect(document.querySelector('dialog.g-booking-bar__sheet').hasAttribute('open')).toBe(true)
  })
})

describe('GBookingBar · avisos y SSR', () => {
  it('avisos 1, 2, 3, 8 y 9', () => {
    const spy = quiet()
    mk({ title: undefined, partyRows: undefined })
    mk({ kind: 'table' })
    mk({ kind: 'tour', disabledNights: () => false, appearance: 'guided' })
    const m = spy.mock.calls.map((c) => String(c[0]))
    for (const n of [1, 2, 3, 8, 9]) expect(m.some((x) => x.includes(`aviso ${n})`)), `aviso ${n}`).toBe(true)
  })

  it.each(['phrase', 'bar'])('%s en el servidor', async (appearance) => {
    const html = await renderToString(createSSRApp({ render: () => h(GBookingBar, { title: 'C', partyRows: ROWS, labels: LABELS, appearance, dock: true }) }))
    expect(html).toContain('role="search"')
    expect(html).toContain(`g-booking-bar--appearance-${appearance}`)
    expect(html).not.toContain('is-compact')
  })
})
