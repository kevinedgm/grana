// Gestor de la isla de estado (status.md «El gestor», «Modelo», «Acción y resolución en el sitio»; #317 a #321).
// Sin región montada: estado puro. La región se simula con el acceso interno para comprobar los sucesos que recibe.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createApp, defineComponent, h } from 'vue'
import { createStatus, useStatus, statusKey, INTERNAL, STATUS_TYPES, STATUS_POSITIONS, DEADLINE_MARKS, formatRemaining, countText } from './status.js'

const LABELS = {
  region: 'Estado de la aplicación ({hotkey})', summary: 'Estado: {count} avisos.', more: 'y {count} más',
  types: { info: 'Información', success: 'Correcto', warning: 'Advertencia', error: 'Error' },
  acknowledge: 'Entendido', dismiss: 'Descartar: {title}', details: 'Detalle técnico', copy: 'Copiar', copied: 'Copiado',
  remaining: 'Quedan {time}', sheetTitle: 'Estado de la aplicación', close: 'Cerrar'
}
let warn
beforeEach(() => {
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
  vi.setSystemTime(new Date('2026-10-04T10:00:00Z'))
})
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })
const make = (o = {}) => createStatus({ labels: LABELS, ...o })
const warned = (re) => warn.mock.calls.some((c) => re.test(String(c[0])))
// Región simulada: recoge los sucesos y lo que se dice
function fakeRegion(status) {
  const log = { events: [], said: [], opened: [] }
  status[INTERNAL].attach({ event: (e) => log.events.push(e), say: (t, p) => log.said.push([t, p]), opened: (...a) => log.opened.push(a) }, 'isla')
  return log
}
const flushPromises = async () => { for (let i = 0; i < 4; i++) await Promise.resolve() }

describe('createStatus · API', () => {
  it('expone los métodos del contrato y es plugin (provide con statusKey); useStatus lo inyecta', () => {
    const s = make()
    for (const k of ['set', 'info', 'success', 'warning', 'error', 'update', 'resolve', 'remove', 'clear', 'announce', 'acknowledge', 'open', 'close', 'has', 'get', 'configure', 'install']) expect(typeof s[k], k).toBe('function')
    expect(s.conditions).toEqual([])
    expect(s.state).toEqual({ form: 'empty', count: 0, mobile: false })
    let got
    const app = createApp(defineComponent({ setup() { got = useStatus(); return () => h('i') } }))
    app.use(s).mount(document.createElement('div'))
    expect(got).toBe(s)
    expect(app._context.provides[statusKey]).toBe(s)
    app.unmount()
    expect(STATUS_TYPES).toEqual(['info', 'success', 'warning', 'error'])
    expect(STATUS_POSITIONS).toEqual(['top-center', 'top-start', 'top-end'])
    expect([...DEADLINE_MARKS]).toEqual([300000, 60000, 30000])
  })

  it('useStatus sin gestor o fuera de setup: aviso y undefined', () => {
    expect(useStatus()).toBeUndefined()
    let got = 1
    const app = createApp(defineComponent({ setup() { got = useStatus(); return () => h('i') } }))
    app.mount(document.createElement('div'))
    expect(got).toBeUndefined()
    expect(warn.mock.calls.filter((c) => /\[Grana Status\] useStatus/.test(c[0]))).toHaveLength(2)
    app.unmount()
  })

  it('ningún método lanza con entradas inválidas: devuelven null/false y avisan', () => {
    const s = make()
    expect(s.set(undefined, { title: 'x' })).toBeNull()
    expect(s.set('a', {})).toBeNull()
    expect(s.set('a')).toBeNull()
    expect(s.set('a', { title: '  ' })).toBeNull()
    expect(s.update('nope', { title: 'x' })).toBe(false)
    expect(s.resolve('nope')).toBe(false)
    expect(s.remove('nope')).toBe(false)
    expect(s.announce('nope')).toBe(false)
    expect(s.open()).toBe(false)
    expect(s.get('nope')).toBeUndefined()
    expect(s.has('nope')).toBe(false)
    expect(warned(/necesita id/)).toBe(true)
    expect(warned(/necesita title/)).toBe(true)
  })
})

describe('Modelo de una condición', () => {
  it('defaults: type info, persistent según el tipo, politeness por tipo, dismissible false; copia congelada', () => {
    const s = make()
    expect(s.set('a', { title: ' Hola ' })).toBe('a')
    const c = s.get('a')
    expect(c).toMatchObject({ id: 'a', type: 'info', title: 'Hola', persistent: true, dismissible: false, politeness: 'polite', acknowledged: false, busy: false })
    expect(Object.isFrozen(c)).toBe(true)
    expect(typeof c.since).toBe('number')
    s.error('e', 'Falló')
    expect(s.get('e')).toMatchObject({ type: 'error', politeness: 'assertive', persistent: true })
    s.success('ok', 'Hecho')
    expect(s.get('ok')).toMatchObject({ type: 'success', persistent: false })
    s.success('ok2', 'Hecho', { persistent: true })
    expect(s.get('ok2').persistent).toBe(true)
    // persistent se recalcula con el tipo mientras la aplicación no lo fije
    s.update('a', { type: 'success' })
    expect(s.get('a').persistent).toBe(false)
    s.update('ok2', { type: 'info' })
    expect(s.get('ok2').persistent).toBe(true)
    s.warning('w', 'Ojo')
    expect(s.get('w').type).toBe('warning')
  })

  it('valida y avisa: type, politeness, action, link, origin, actions, opción desconocida, error cortés, título largo', () => {
    const s = make()
    s.set('a', { title: 'x', type: 'loading', politeness: 'rude', action: { label: 'Sin onClick' }, link: { label: 'Sin href' }, origin: { label: 'Sin target' }, actions: [], icon: 'reloj' })
    const c = s.get('a')
    expect(c.type).toBe('info')
    expect(c.action).toBeUndefined()
    expect(c.link).toBeUndefined()
    expect(c.origin).toBeUndefined()
    for (const re of [/type «loading»/, /politeness «rude»/, /action necesita label y onClick/, /link necesita label y href/, /origin necesita label y target/, /una sola action/, /desconocida «icon»/]) expect(warned(re), String(re)).toBe(true)
    s.set('e', { title: 'x'.repeat(61), type: 'error', politeness: 'polite' })
    expect(warned(/politeness «polite» no interrumpe/)).toBe(true)
    expect(warned(/más de 60 caracteres/)).toBe(true)
    expect(s.get('e').politeness).toBe('polite')
  })

  it('falta un labels la primera vez que se necesita', () => {
    const s = createStatus()
    s.set('a', { title: 'x', dismissible: true, details: 'traza', deadline: Date.now() + 1000 })
    s.set('b', { title: 'y' })
    for (const re of [/labels\.types\.info/, /labels\.dismiss/, /labels\.details/, /labels\.copy/, /labels\.remaining/, /labels\.more/]) expect(warned(re), String(re)).toBe(true)
  })

  it('set dos veces con la misma clave sustituye la declaración en el mismo registro (conserva acknowledged salvo cambio de tipo)', () => {
    const s = make()
    const run = vi.fn()
    s.set('save', { type: 'warning', title: 'Uno', description: 'd', action: { label: 'Ir', onClick: run }, dismissible: true })
    const uid = s[INTERNAL].byId('save').uid
    s.acknowledge()
    expect(s.get('save').acknowledged).toBe(true)
    s.set('save', { type: 'warning', title: 'Dos' })
    expect(s.conditions).toHaveLength(1)
    expect(s[INTERNAL].byId('save').uid).toBe(uid)
    const c = s.get('save')
    expect(c).toMatchObject({ title: 'Dos', acknowledged: true, dismissible: false })
    expect(c.description).toBeUndefined()
    expect(c.action).toBeUndefined()
    s.set('save', { type: 'error', title: 'Dos' })
    expect(s.get('save').acknowledged).toBe(false)
    expect(s[INTERNAL].byId('save').uid).toBe(uid)
  })

  it('update fusiona; resolve con texto u objeto pasa a resultado en el sitio; sin resultado retira', () => {
    const s = make()
    const onRemove = vi.fn()
    s.set('off', { type: 'warning', title: 'Sin conexión', description: 'Reintentando', deadline: Date.now() + 9000, action: { label: 'Reintentar', onClick() {} }, onRemove })
    const uid = s[INTERNAL].byId('off').uid
    expect(s.update('off', { description: 'Otra' })).toBe(true)
    expect(s.get('off')).toMatchObject({ title: 'Sin conexión', description: 'Otra', type: 'warning' })
    expect(s.resolve('off', 'Conexión restablecida')).toBe(true)
    const c = s.get('off')
    expect(c).toMatchObject({ type: 'success', title: 'Conexión restablecida', persistent: false, busy: false })
    expect(c.action).toBeUndefined()
    expect(c.deadline).toBeUndefined()
    expect(s[INTERNAL].byId('off').uid).toBe(uid)
    s.set('x', { type: 'error', title: 'Falló' })
    s.resolve('x', { title: 'Guardada', link: { label: 'Ver', href: '#f' } })
    expect(s.get('x')).toMatchObject({ type: 'success', title: 'Guardada', link: { label: 'Ver', href: '#f' } })
    expect(s.resolve('off')).toBe(true)
    expect(s.has('off')).toBe(false)
    expect(onRemove).toHaveBeenCalledTimes(1)
    expect(onRemove.mock.calls[0][0]).toBe('api')
    expect(onRemove.mock.calls[0][1]).toMatchObject({ id: 'off', type: 'success' })
  })

  it('onRemove una vez con cada motivo: api, clear, acknowledge (resultado), dismiss, unmount', () => {
    const s = make()
    const calls = []
    const on = (tag) => (reason) => calls.push(`${tag}:${reason}`)
    s.set('a', { title: 'a', onRemove: on('a') })
    s.remove('a')
    s.remove('a')
    s.set('b', { title: 'b', onRemove: on('b') })
    s.clear()
    s.set('c', { title: 'c', type: 'success', onRemove: on('c') })
    s.set('k', { title: 'k', onRemove: on('k') })
    s.acknowledge()
    expect(s.has('k')).toBe(true) // la condición se queda (punto)
    s.set('d', { title: 'd', dismissible: true, onRemove: on('d') })
    s[INTERNAL].dismiss(s[INTERNAL].byId('d').uid)
    s.set('u', { title: 'u', onRemove: on('u') })
    s[INTERNAL].removeAs('u', 'unmount')
    expect(calls).toEqual(['a:api', 'b:clear', 'c:acknowledge', 'd:dismiss', 'u:unmount'])
  })

  it('orden: gravedad error → warning → info → success y, dentro, la más reciente (since) primero; un cambio de tipo reordena', () => {
    const s = make()
    s.info('i1', 'i1'); s.success('s1', 's1'); s.error('e1', 'e1'); s.warning('w1', 'w1'); s.error('e2', 'e2'); s.info('i2', 'i2')
    expect(s.conditions.map((c) => c.id)).toEqual(['e2', 'e1', 'w1', 'i2', 'i1', 's1'])
    s.update('i1', { type: 'error' }) // since nuevo: primero de los errores
    expect(s.conditions.map((c) => c.id)).toEqual(['i1', 'e2', 'e1', 'w1', 'i2', 's1'])
    s.update('e1', { title: 'otro' }) // sin cambio de tipo no se mueve
    expect(s.conditions.map((c) => c.id)).toEqual(['i1', 'e2', 'e1', 'w1', 'i2', 's1'])
  })
})

describe('Formas y reconocimiento (state.form)', () => {
  it('empty → compact → open → compact → dot → compact (nueva, cambio de tipo, announce) → empty', () => {
    const s = make()
    expect(s.state.form).toBe('empty')
    s.warning('a', 'a')
    expect(s.state).toEqual({ form: 'compact', count: 1, mobile: false })
    expect(s.open()).toBe(true)
    expect(s.state.form).toBe('open')
    s.close()
    expect(s.state.form).toBe('compact')
    s.acknowledge()
    expect(s.state.form).toBe('dot')
    s.info('b', 'b')
    expect(s.state.form).toBe('compact')
    s.acknowledge()
    expect(s.state.form).toBe('dot')
    s.update('a', { type: 'error' })
    expect(s.state.form).toBe('compact')
    s.acknowledge()
    s.update('a', { title: 'otro título' }) // sin cambio de tipo: sigue reconocida
    expect(s.state.form).toBe('dot')
    expect(s.announce('a')).toBe(true)
    expect(s.state.form).toBe('compact')
    s.clear()
    expect(s.state.form).toBe('empty')
  })

  it('reconocer retira los resultados y deja las condiciones; al vaciarse, la isla abierta se cierra', () => {
    const s = make()
    s.success('ok', 'Hecho')
    s.open()
    s.acknowledge()
    expect(s.state).toMatchObject({ form: 'empty', count: 0 })
    s.error('e', 'e')
    s.open()
    s.remove('e')
    expect(s[INTERNAL].state.open).toBe(false)
  })
})

describe('Sucesos hacia la región (anuncios)', () => {
  it('texto `tipo: título. descripción`, canal por tipo y politeness; uno por suceso; nada sin cambio de type/title/description', () => {
    const s = make()
    const log = fakeRegion(s)
    s.error('e', 'No se pudo guardar', { description: 'El servidor no respondió.' })
    s.warning('w', 'Sin conexión.')
    s.info('i', 'Modo lectura', { politeness: 'assertive' })
    expect(log.events.map((e) => [e.kind, e.text, e.politeness, e.toError])).toEqual([
      ['appear', 'Error: No se pudo guardar. El servidor no respondió.', 'assertive', true],
      ['appear', 'Advertencia: Sin conexión.', 'polite', false],
      ['appear', 'Información: Modo lectura', 'assertive', false]
    ])
    expect(log.events.map((e) => e.countBefore)).toEqual([0, 1, 2])
    log.events.length = 0
    s.update('w', { dismissible: true, details: 'x', action: { label: 'a', onClick() {} } })
    expect(log.events).toHaveLength(0)
    s.update('w', { description: 'Se reintenta sola' })
    s.update('w', { type: 'error' })
    s.set('w', { type: 'error', title: 'Sin conexión.', description: 'Se reintenta sola' }) // idéntica: nada
    expect(log.events.map((e) => [e.kind, e.text, Boolean(e.typeChanged), Boolean(e.toError)])).toEqual([
      ['change', 'Advertencia: Sin conexión. Se reintenta sola', false, false],
      ['change', 'Error: Sin conexión. Se reintenta sola', true, true]
    ])
    log.events.length = 0
    s.announce('e') // segundo fallo idéntico
    expect(log.events.map((e) => [e.kind, e.toError])).toEqual([['announce', true]])
  })
})

describe('Acción y resolución en el sitio (#318)', () => {
  const deferred = () => { let ok, no; const p = new Promise((a, b) => { ok = a; no = b }); return { p, ok, no } }

  it('sin promesa no hay busy; recibe la copia de la condición', () => {
    const s = make()
    const onClick = vi.fn()
    s.error('e', 'Falló', { action: { label: 'Reintentar', onClick } })
    s[INTERNAL].action(s[INTERNAL].byId('e').uid)
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onClick.mock.calls[0][0]).toMatchObject({ id: 'e', type: 'error' })
    expect(s.get('e').busy).toBe(false)
  })

  it('promesa → busy (otra pulsación no hace nada, busyLabel cortés); cumplida con objeto = update en el mismo registro', async () => {
    const s = make()
    const log = fakeRegion(s)
    const d = deferred()
    const onClick = vi.fn(() => d.p)
    s.error('save', 'No se pudo guardar', { action: { label: 'Reintentar', busyLabel: 'Reintentando…', onClick } })
    const uid = s[INTERNAL].byId('save').uid
    log.events.length = 0
    s[INTERNAL].action(uid)
    expect(s.get('save').busy).toBe(true)
    expect(log.said).toEqual([['Reintentando…', 'polite']])
    s[INTERNAL].action(uid)
    expect(onClick).toHaveBeenCalledTimes(1)
    d.ok({ type: 'success', title: 'Factura guardada', description: '', action: undefined, persistent: false, link: { label: 'Ver factura', href: '#f' } })
    await flushPromises()
    const c = s.get('save')
    expect(c).toMatchObject({ type: 'success', title: 'Factura guardada', busy: false, persistent: false, link: { label: 'Ver factura', href: '#f' } })
    expect(c.action).toBeUndefined()
    expect(s[INTERNAL].byId('save').uid).toBe(uid)
    expect(log.events.map((e) => [e.kind, e.text, e.politeness])).toEqual([['change', 'Correcto: Factura guardada', 'polite']])
  })

  it('cumplida con otra cosa: solo termina busy', async () => {
    const s = make()
    const d = deferred()
    s.error('e', 'Falló', { action: { label: 'R', onClick: () => d.p } })
    s[INTERNAL].action(s[INTERNAL].byId('e').uid)
    d.ok(true)
    await flushPromises()
    expect(s.get('e')).toMatchObject({ type: 'error', busy: false })
  })

  it('rechazada: termina busy, queda como estaba, se reanuncia y el rechazo no queda sin manejar', async () => {
    const s = make()
    const log = fakeRegion(s)
    const unhandled = vi.fn()
    process.on('unhandledRejection', unhandled)
    s.error('e', 'Falló', { action: { label: 'R', onClick: () => Promise.reject(new Error('otra vez')) } })
    s.acknowledge()
    log.events.length = 0
    s[INTERNAL].action(s[INTERNAL].byId('e').uid)
    await flushPromises()
    await new Promise((r) => setImmediate(r))
    process.off('unhandledRejection', unhandled)
    expect(unhandled).not.toHaveBeenCalled()
    expect(s.get('e')).toMatchObject({ type: 'error', title: 'Falló', busy: false, acknowledged: false })
    expect(log.events.map((e) => [e.kind, e.toError])).toEqual([['announce', true]])
  })

  it('retirada (o resuelta) con la promesa pendiente: el desenlace no la vuelve a crear ni la pisa', async () => {
    const s = make()
    const d = deferred()
    s.error('e', 'Falló', { action: { label: 'R', onClick: () => d.p } })
    s[INTERNAL].action(s[INTERNAL].byId('e').uid)
    s.remove('e')
    d.ok({ type: 'success', title: 'Guardada' })
    await flushPromises()
    expect(s.has('e')).toBe(false)
    const d2 = deferred()
    s.error('f', 'Falló', { action: { label: 'R', onClick: () => d2.p } })
    s[INTERNAL].action(s[INTERNAL].byId('f').uid)
    s.resolve('f', 'Resuelta por otra vía')
    expect(s.get('f').busy).toBe(false)
    d2.ok({ type: 'error', title: 'Desenlace tardío' })
    await flushPromises()
    expect(s.get('f')).toMatchObject({ type: 'success', title: 'Resuelta por otra vía' })
  })

  it('una acción que lanza no rompe el gestor', () => {
    const s = make()
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    s.error('e', 'Falló', { action: { label: 'R', onClick: () => { throw new Error('x') } } })
    expect(() => s[INTERNAL].action(s[INTERNAL].byId('e').uid)).not.toThrow()
    expect(err).toHaveBeenCalled()
    expect(s.get('e').busy).toBe(false)
  })
})

describe('Cuenta atrás (deadline)', () => {
  it('formatRemaining: m:ss y h:mm:ss; nunca negativo', () => {
    expect(formatRemaining(299001)).toBe('5:00')
    expect(formatRemaining(59000)).toBe('0:59')
    expect(formatRemaining(3600000)).toBe('1:00:00')
    expect(formatRemaining(3725000)).toBe('1:02:05')
    expect(formatRemaining(-5)).toBe('0:00')
  })

  it('anuncia solo en los umbrales (5 min, 1 min, 30 s), una vez cada uno; onExpire una vez y la condición no se quita', () => {
    const s = make()
    const log = fakeRegion(s)
    const onExpire = vi.fn()
    const t0 = Date.now()
    s.warning('ses', 'La sesión caduca pronto', { deadline: t0 + 6 * 60000, onExpire })
    const tick = (ms) => s[INTERNAL].tick(t0 + ms)
    tick(30000)
    expect(log.said).toEqual([])
    tick(60000); tick(61000); tick(120000)
    expect(log.said).toEqual([['Quedan 5:00', 'polite']])
    tick(5 * 60000)
    expect(log.said[1]).toEqual(['Quedan 1:00', 'polite'])
    tick(5 * 60000 + 30000); tick(5 * 60000 + 45000)
    expect(log.said).toHaveLength(3)
    expect(log.said[2]).toEqual(['Quedan 0:30', 'polite'])
    expect(onExpire).not.toHaveBeenCalled()
    tick(6 * 60000); tick(6 * 60000 + 5000)
    expect(onExpire).toHaveBeenCalledTimes(1)
    expect(onExpire.mock.calls[0][0]).toMatchObject({ id: 'ses' })
    expect(s.has('ses')).toBe(true)
    expect(log.said).toHaveLength(3)
  })

  it('un plazo que nace por debajo de un umbral no lo anuncia; varios umbrales de golpe anuncian solo el menor; Date y Function', () => {
    const s = make({ labels: { ...LABELS, remaining: (ms) => `faltan ${Math.round(ms / 1000)} s` } })
    const log = fakeRegion(s)
    const t0 = Date.now()
    s.warning('a', 'a', { deadline: new Date(t0 + 4 * 60000) })
    expect(s.get('a').deadline).toBe(t0 + 4 * 60000)
    s[INTERNAL].tick(t0 + 1000)
    expect(log.said).toEqual([])
    s[INTERNAL].tick(t0 + 4 * 60000 - 20000) // cruza 1 min y 30 s a la vez
    expect(log.said).toEqual([['faltan 30 s', 'polite']])
    // Un plazo nuevo reinicia los umbrales
    s.update('a', { deadline: t0 + 20 * 60000 })
    s[INTERNAL].tick(t0 + 15 * 60000 + 1000)
    expect(log.said).toHaveLength(2)
  })
})

describe('Opciones del gestor (configure)', () => {
  it('position, autoOpen, offset y labels: fusiona; fuera de lista avisa y conserva', () => {
    const s = make({ position: 'top-end', offset: { top: 12 } })
    const o = s[INTERNAL].state.opts
    expect(o.position).toBe('top-end')
    s.configure({ position: 'bottom-center', autoOpen: 'sí', offset: { top: {} }, limit: 3, labels: { types: { info: 'Nota' }, acknowledge: 'Vale' } })
    expect(o).toMatchObject({ position: 'top-end', autoOpen: true, offset: { top: 12 } })
    expect(o.labels.types).toEqual({ ...LABELS.types, info: 'Nota' })
    expect(o.labels.acknowledge).toBe('Vale')
    expect(o.labels.region).toBe(LABELS.region)
    for (const re of [/position «bottom-center»/, /autoOpen debe ser Boolean/, /offset debe ser/, /desconocida «limit»/]) expect(warned(re), String(re)).toBe(true)
    s.configure({ autoOpen: false, offset: { top: '3rem' } })
    expect(o).toMatchObject({ autoOpen: false, offset: { top: '3rem' } })
  })

  it('hotkey: Alt+F8 por defecto; false lo quita; F6 o ilegible se rechaza; F8 y Shift+F8 se aceptan con aviso', () => {
    const s = make()
    const st = s[INTERNAL].state
    expect(st.opts.hotkey).toBe('Alt+F8')
    expect(st.hotkeyKeys).toEqual({ key: 'F8', mods: { Alt: true, Control: false, Shift: false, Meta: false } })
    s.configure({ hotkey: 'F6' })
    s.configure({ hotkey: 'Alt+' })
    expect(st.opts.hotkey).toBe('Alt+F8')
    expect(warned(/«F6»/)).toBe(true)
    expect(warned(/no se puede interpretar/)).toBe(true)
    s.configure({ hotkey: 'F8' })
    expect(st.opts.hotkey).toBe('F8')
    expect(warned(/los avisos \(GToaster\)/)).toBe(true)
    s.configure({ hotkey: 'Shift+F8' })
    expect(warned(/la captura de voz/)).toBe(true)
    s.configure({ hotkey: 'Alt+Shift+F8' })
    expect(st.opts.hotkey).toBe('Alt+Shift+F8')
    s.configure({ hotkey: false })
    expect(st.opts.hotkey).toBe(false)
    expect(st.hotkeyKeys).toBeNull()
  })

  it('countText: String con {count} o Function (#51)', () => {
    expect(countText('y {count} más', 2)).toBe('y 2 más')
    expect(countText((n) => (n === 1 ? '1 aviso' : `${n} avisos`), 1)).toBe('1 aviso')
  })

  it('set en el cliente sin isla montada: aviso tras el siguiente ciclo; con isla, no', () => {
    const s = make()
    s.info('a', 'a')
    vi.advanceTimersByTime(1)
    expect(warned(/sin ninguna <GStatusIsland> montada/)).toBe(true)
    warn.mockClear()
    const s2 = make()
    fakeRegion(s2)
    s2.info('a', 'a')
    vi.advanceTimersByTime(1)
    expect(warned(/sin ninguna <GStatusIsland>/)).toBe(false)
  })
})
