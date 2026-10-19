// Gestor de la isla de estado (status.md «El gestor», «Modelo», «Acción y resolución en el sitio», «Lectura y relevo»,
// «Qué queda al recogerse», «Lo que no se recoge solo» e «Interrupciones»; #317 a #321 y #693 a #705).
// Sin región: estado puro. La región se simula con el acceso interno (attach + ready, y `shown`/`collapsed` donde la isla
// real los llamaría al terminar `grow` y `rise`), con reloj falso: el motor de lectura se prueba al milisegundo.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createApp, defineComponent, h } from 'vue'
import { createStatus, useStatus, statusKey, INTERNAL, STATUS_TYPES, STATUS_POSITIONS, DEADLINE_MARKS, formatRemaining, countText, readTime } from './status.js'

const LABELS = {
  region: 'Estado de la aplicación ({hotkey})', waiting: 'y {count} más en espera', listTitle: 'Pendiente ({count})', hide: 'Ocultar',
  types: { info: 'Información', success: 'Correcto', warning: 'Advertencia', error: 'Error' },
  dismiss: 'Descartar: {title}', details: 'Detalle técnico', copy: 'Copiar', copied: 'Copiado',
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
const I = (s) => s[INTERNAL]
// Región simulada: recoge los sucesos y lo que se dice; `ready` = la isla ya puede mostrar (is-ready)
function fakeRegion(status, { ready = false } = {}) {
  const log = { events: [], said: [], opened: [] }
  I(status).attach({ event: (e) => log.events.push(e), say: (t, p) => log.said.push([t, p]), opened: (...a) => log.opened.push(a) }, 'isla')
  if (ready) I(status).ready()
  return log
}
// Lo que haría la isla: el texto del titular ya se ve (fin de grow o relevo) / terminó de subir (fin de rise)
const shown = (s) => { const u = I(s).state.current; if (u) I(s).shown(u) }
const collapsed = (s) => I(s).collapsed()
const head = (s) => s.state.current
const wait = (ms) => vi.advanceTimersByTime(ms)
// Marca enlace simulada: montada = conectada y con caja
const fakeMark = (s, id, { mounted = true } = {}) => {
  const el = { isConnected: mounted, getClientRects: () => (mounted ? [1] : []) }
  const m = { el: () => el, echo: vi.fn() }
  I(s).markAdd(id, m)
  return m
}
const flushPromises = async () => { for (let i = 0; i < 4; i++) await Promise.resolve() }
const deferred = () => { let ok, no; const p = new Promise((a, b) => { ok = a; no = b }); return { p, ok, no } }

describe('createStatus · API', () => {
  it('expone los métodos del contrato y es plugin (provide con statusKey); useStatus lo inyecta', () => {
    const s = make()
    for (const k of ['set', 'info', 'success', 'warning', 'error', 'update', 'resolve', 'remove', 'clear', 'announce', 'hide', 'open', 'close', 'has', 'get', 'configure', 'install']) expect(typeof s[k], k).toBe('function')
    expect(s.conditions).toEqual([])
    expect(s.state).toEqual({ form: 'empty', peek: false, paused: false, current: null, waiting: 0, count: 0, mobile: false })
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
    expect(() => { s.hide(); s.close() }).not.toThrow()
    expect(s.get('nope')).toBeUndefined()
    expect(s.has('nope')).toBe(false)
    expect(warned(/necesita id/)).toBe(true)
    expect(warned(/necesita title/)).toBe(true)
  })

  it('retirados (#696, #697): autoOpen, acknowledge() y labels acknowledge/summary/more avisan y se ignoran; acknowledge() hace hide()', () => {
    const s = make({ autoOpen: true, labels: { ...LABELS, acknowledge: 'Entendido', summary: 'Estado: {count}', more: 'y {count} más' } })
    const o = I(s).state.opts
    expect('autoOpen' in o).toBe(false)
    expect(o.labels.acknowledge).toBeUndefined()
    expect(o.labels.summary).toBeUndefined()
    expect(o.labels.more).toBeUndefined()
    for (const re of [/autoOpen está retirada/, /labels\.acknowledge está retirada/, /labels\.summary está retirada/, /labels\.more está retirada.*waiting/]) expect(warned(re), String(re)).toBe(true)
    fakeRegion(s, { ready: true })
    s.error('e', 'Falló')
    expect(head(s)).toBe('e')
    s.acknowledge()
    expect(warned(/acknowledge\(\) está retirado/)).toBe(true)
    expect(s.get('e').seen).toBe(true)
    expect(s.state).toMatchObject({ form: 'line', current: 'e' }) // se recoge (fold → rise) con su texto
    collapsed(s)
    expect(s.state.form).toBe('empty')
    expect(s.has('e')).toBe(true) // la condición sigue en el modelo
  })
})

describe('Modelo de una condición', () => {
  it('defaults: type info, persistent según el tipo, politeness por tipo, dismissible false, seen false; copia congelada', () => {
    const s = make()
    expect(s.set('a', { title: ' Hola ' })).toBe('a')
    const c = s.get('a')
    expect(c).toMatchObject({ id: 'a', type: 'info', title: 'Hola', persistent: true, dismissible: false, politeness: 'polite', seen: false, busy: false })
    expect('acknowledged' in c).toBe(false)
    expect(Object.isFrozen(c)).toBe(true)
    expect(typeof c.since).toBe('number')
    s.error('e', 'Falló')
    expect(s.get('e')).toMatchObject({ type: 'error', politeness: 'assertive', persistent: true })
    s.success('ok', 'Hecho')
    expect(s.get('ok')).toMatchObject({ type: 'success', persistent: false })
    s.success('ok2', 'Hecho', { persistent: true })
    expect(s.get('ok2').persistent).toBe(true)
    s.update('a', { type: 'success' })
    expect(s.get('a').persistent).toBe(false)
    s.update('ok2', { type: 'info' })
    expect(s.get('ok2').persistent).toBe(true)
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
  })

  it('falta un labels la primera vez que se necesita', () => {
    const s = createStatus()
    s.set('a', { title: 'x', dismissible: true, details: 'traza', deadline: Date.now() + 1000 })
    for (const re of [/labels\.types\.info/, /labels\.dismiss/, /labels\.details/, /labels\.copy/, /labels\.remaining/]) expect(warned(re), String(re)).toBe(true)
  })

  it('set dos veces con la misma clave sustituye en el mismo registro; seen vuelve a false con un cambio de type, title o description', () => {
    const s = make()
    s.set('save', { type: 'warning', title: 'Uno', description: 'd', action: { label: 'Ir', onClick() {} }, dismissible: true })
    const uid = I(s).byId('save').uid
    s.hide()
    expect(s.get('save').seen).toBe(true)
    s.set('save', { type: 'warning', title: 'Uno', description: 'd' }) // mismo texto: sigue vista
    expect(s.get('save').seen).toBe(true)
    expect(s.get('save').action).toBeUndefined()
    s.set('save', { type: 'warning', title: 'Dos' })
    expect(s.conditions).toHaveLength(1)
    expect(I(s).byId('save').uid).toBe(uid)
    expect(s.get('save')).toMatchObject({ title: 'Dos', seen: false, dismissible: false })
    s.hide()
    s.update('save', { type: 'error' })
    expect(s.get('save').seen).toBe(false)
    s.hide()
    s.announce('save')
    expect(s.get('save').seen).toBe(false)
  })

  it('resolve limpia descripción, detalle, acción, busy y plazo (R5); con objeto, solo lo que trae; sin resultado retira', () => {
    const s = make()
    const onRemove = vi.fn()
    s.set('off', { type: 'warning', title: 'Sin conexión', description: 'Los cambios se guardarán al volver.', details: 'ERR_NETWORK', deadline: Date.now() + 9000, action: { label: 'Reintentar', onClick() {} }, onRemove })
    const uid = I(s).byId('off').uid
    expect(s.resolve('off', 'Conexión restablecida')).toBe(true)
    const c = s.get('off')
    expect(c).toMatchObject({ type: 'success', title: 'Conexión restablecida', persistent: false, busy: false })
    for (const k of ['description', 'details', 'action', 'deadline']) expect(c[k], k).toBeUndefined()
    expect(I(s).byId('off').uid).toBe(uid)
    s.set('x', { type: 'error', title: 'Falló', description: 'El servidor no respondió.', details: 'POST /api · 500' })
    s.resolve('x', { title: 'Guardada', link: { label: 'Ver', href: '#f' } })
    expect(s.get('x')).toMatchObject({ type: 'success', title: 'Guardada', link: { label: 'Ver', href: '#f' } })
    expect(s.get('x').description).toBeUndefined()
    expect(s.get('x').details).toBeUndefined()
    expect(s.resolve('off')).toBe(true)
    expect(s.has('off')).toBe(false)
    expect(onRemove).toHaveBeenCalledTimes(1)
    expect(onRemove.mock.calls[0][0]).toBe('api')
  })

  it('onRemove una vez con cada motivo: api, clear, read, dismiss, unmount, origin', () => {
    const s = make()
    fakeRegion(s, { ready: true })
    const calls = []
    const on = (tag) => (reason) => calls.push(`${tag}:${reason}`)
    s.set('a', { title: 'a', onRemove: on('a') })
    s.remove('a')
    s.remove('a')
    s.set('b', { title: 'b', onRemove: on('b') })
    s.clear()
    collapsed(s)
    s.set('c', { title: 'c', type: 'success', onRemove: on('c') })
    s.hide()
    collapsed(s) // un resultado sin enlace que ya se vio se retira al terminar de recogerse
    s.set('d', { title: 'd', dismissible: true, onRemove: on('d') })
    I(s).dismiss(I(s).byId('d').uid)
    collapsed(s)
    s.set('u', { title: 'u', onRemove: on('u') })
    I(s).removeAs('u', 'unmount')
    collapsed(s)
    s.set('o', { title: 'o', origin: { label: 'Ir', target: 'x' }, onRemove: on('o') })
    I(s).removeAs('o', 'origin')
    expect(calls).toEqual(['a:api', 'b:clear', 'c:read', 'd:dismiss', 'u:unmount', 'o:origin'])
  })

  it('orden de la lista: gravedad y, dentro, la más reciente (since) primero; un cambio de tipo reordena', () => {
    const s = make()
    s.info('i1', 'i1'); s.success('s1', 's1'); s.error('e1', 'e1'); s.warning('w1', 'w1'); s.error('e2', 'e2'); s.info('i2', 'i2')
    expect(s.conditions.map((c) => c.id)).toEqual(['e2', 'e1', 'w1', 'i2', 'i1', 's1'])
    s.update('i1', { type: 'error' })
    expect(s.conditions.map((c) => c.id)).toEqual(['i1', 'e2', 'e1', 'w1', 'i2', 's1'])
    s.update('e1', { title: 'otro' })
    expect(s.conditions.map((c) => c.id)).toEqual(['i1', 'e2', 'e1', 'w1', 'i2', 's1'])
  })
})

describe('Lectura (#696): el tiempo de GToast, empieza con el texto visible, pausas y reanudación', () => {
  it('auto = clamp(5000, 2000 + 60 × n, 12000) con n = título + descripción; readTime con número y false', () => {
    expect(readTime('auto', { title: 'x'.repeat(10) })).toBe(5000)
    expect(readTime('auto', { title: 'x'.repeat(10), description: 'y'.repeat(100) })).toBe(8600)
    expect(readTime('auto', { title: 'x'.repeat(60), description: 'y'.repeat(200) })).toBe(12000)
    expect(readTime(7000, { title: 'x' })).toBe(7000)
    expect(readTime(false, { title: 'x' })).toBe(Infinity)
  })

  it('nada se muestra sin una región lista; lo presente al estar lista entra; el tiempo empieza al verse el texto, no antes', () => {
    const s = make()
    s.info('a', 'x'.repeat(10), { description: 'y'.repeat(100) }) // 8600 ms
    expect(s.state.form).toBe('empty')
    fakeRegion(s)
    expect(s.state.form).toBe('empty')
    I(s).ready()
    expect(s.state).toMatchObject({ form: 'line', current: 'a', paused: false })
    wait(20000) // la caída y el ensanche no cuentan
    expect(head(s)).toBe('a')
    shown(s)
    expect(I(s).state.ring).toMatchObject({ left: 1, run: 8600 })
    wait(8599)
    expect(head(s)).toBe('a')
    wait(1)
    expect(I(s).state.current).toBe(0)
    expect(s.state).toMatchObject({ form: 'line', current: 'a' }) // se recoge con su texto
    expect(s.get('a').seen).toBe(true)
    collapsed(s)
    expect(s.state).toMatchObject({ form: 'empty', current: null, count: 1 })
  })

  it('pausa con puntero, foco, dedo, asomo táctil, lista, busy, pestaña oculta y marca; reanuda con lo que quedaba (≥ 1000 ms)', async () => {
    for (const cause of ['pointer', 'focus', 'touch', 'hidden', 'peek', 'mark', 'busy']) {
      const s = make()
      fakeRegion(s, { ready: true })
      const d = deferred()
      s.warning('w', 'Sin conexión', { action: { label: 'R', onClick: () => d.p } }) // 5000 ms
      const m = fakeMark(s, 'w')
      shown(s)
      wait(3000)
      const on = () => {
        if (cause === 'peek') I(s).setPeek('touch')
        else if (cause === 'mark') I(s).markHold('m1', 'w')
        else if (cause === 'busy') I(s).action(I(s).byId('w').uid)
        else I(s).hold(cause, true)
      }
      const off = async () => {
        if (cause === 'peek') I(s).setPeek('')
        else if (cause === 'mark') I(s).markHold('m1', null)
        else if (cause === 'busy') { d.no(new Error('x')); await flushPromises() }
        else I(s).hold(cause, false)
      }
      on()
      expect(s.state.paused, cause).toBe(true)
      expect(I(s).state.ring.left, cause).toBeCloseTo(0.4, 5)
      wait(60000)
      expect(head(s), cause).toBe('w')
      await off()
      expect(s.state.paused, cause).toBe(false)
      if (cause === 'busy') shown(s) // el rechazo vuelve a mostrarla (announce): su tiempo empieza otra vez
      const left = cause === 'busy' ? 5000 : 2000
      wait(left - 1)
      expect(head(s), cause).toBe('w')
      wait(1)
      expect(I(s).state.current, cause).toBe(0)
      I(s).markDel('w', m)
    }
  })

  it('al reanudar con menos de 1000 ms quedan 1000; nunca se reinicia', () => {
    const s = make()
    fakeRegion(s, { ready: true })
    s.info('a', 'Corto') // 5000
    shown(s)
    wait(4800)
    I(s).hold('pointer', true)
    wait(5000)
    I(s).hold('pointer', false)
    wait(999)
    expect(head(s)).toBe('a')
    wait(1)
    expect(I(s).state.current).toBe(0)
  })

  it('duration en ms; < 5000 avisa y usa 5000; false no se recoge por tiempo y queda en pausa; en vivo, el siguiente tramo', () => {
    const s = make({ duration: 7000 })
    fakeRegion(s, { ready: true })
    s.info('a', 'a')
    shown(s)
    wait(6999)
    expect(head(s)).toBe('a')
    s.configure({ duration: 3000 })
    expect(warned(/duration 3000 ms es menor que 5000/)).toBe(true)
    expect(I(s).state.opts.duration).toBe(5000)
    wait(1)
    collapsed(s)
    s.configure({ duration: 'nunca' })
    expect(warned(/duration «nunca» no es válida/)).toBe(true)
    s.configure({ duration: false })
    s.info('b', 'b')
    shown(s)
    expect(s.state.paused).toBe(true)
    wait(600000)
    expect(head(s)).toBe('b')
    s.hide()
    expect(I(s).state.current).toBe(0)
  })
})

describe('Relevo por gravedad (#696, #702)', () => {
  it('una cada vez: cola por gravedad y llegada; «+N» = las que esperan; el relevo no emite sucesos', () => {
    const s = make()
    const log = fakeRegion(s, { ready: true })
    s.info('i1', 'Uno')
    s.info('i2', 'Dos')
    s.success('ok', 'Hecho')
    s.info('i3', 'Tres')
    expect(head(s)).toBe('i1')
    expect(s.state.waiting).toBe(3)
    expect(log.events.map((e) => e.kind)).toEqual(['appear', 'appear', 'appear', 'appear']) // cada una al llegar
    const order = []
    for (let i = 0; i < 4; i++) { order.push(head(s)); shown(s); wait(5000) }
    expect(order).toEqual(['i1', 'i2', 'i3', 'ok'])
    expect(log.events).toHaveLength(4)
    expect(I(s).state.current).toBe(0) // se recoge tras la última
    collapsed(s)
    expect(s.has('ok')).toBe(false) // resultado leído: motivo read
  })

  it('lo más grave releva al momento y la relevada vuelve a la cabeza con lo que le quedaba (≥ 1000 ms); igual o menor espera', () => {
    const s = make()
    fakeRegion(s, { ready: true })
    s.info('i', 'Info', { description: 'y'.repeat(100) }) // 2000 + 60 × 104 = 8240 ms
    shown(s)
    wait(3000)
    s.info('j', 'Otra info')
    expect(head(s)).toBe('i')
    s.error('e', 'Falló')
    expect(head(s)).toBe('e')
    expect(s.state.waiting).toBe(2)
    expect(I(s).queue.value.map((r) => r.id)).toEqual(['i', 'j'])
    shown(s)
    wait(5000)
    expect(head(s)).toBe('i')
    shown(s)
    wait(5239) // lo que le quedaba: 8240 − 3000
    expect(head(s)).toBe('i')
    wait(1)
    expect(head(s)).toBe('j')
  })

  it('nunca bajo la mano: con puntero, foco, lista o busy, lo grave espera («+N») y releva al terminar la pausa', () => {
    const s = make()
    fakeRegion(s, { ready: true })
    s.info('i', 'Info')
    shown(s)
    I(s).hold('focus', true)
    s.error('e', 'Falló')
    expect(head(s)).toBe('i')
    expect(s.state.waiting).toBe(1)
    I(s).hold('focus', false)
    expect(head(s)).toBe('e')
  })

  it('en el sitio: un cambio de la mostrada empieza su tiempo otra vez; si se retira, entra la siguiente o se recoge con su texto', () => {
    const s = make()
    fakeRegion(s, { ready: true })
    s.warning('w', 'Sin conexión')
    shown(s)
    wait(4000)
    s.update('w', { description: 'Reintentando en 5 s' })
    wait(4000)
    expect(head(s)).toBe('w') // su tiempo empezó otra vez
    s.info('i', 'Info')
    s.remove('w')
    expect(head(s)).toBe('i')
    s.remove('i')
    expect(I(s).state.leaving).toBeGreaterThan(0)
    expect(s.state.form).toBe('line')
    collapsed(s)
    expect(s.state.form).toBe('empty')
  })
})

describe('Lo que no se recoge solo (WCAG 2.2.1) y qué queda al recogerse', () => {
  it('cuenta atrás: no se recoge por tiempo; cada umbral la vuelve a mostrar con su anuncio', () => {
    const s = make()
    const log = fakeRegion(s, { ready: true })
    const t0 = Date.now()
    s.warning('ses', 'La sesión caduca', { deadline: t0 + 10 * 60000 })
    shown(s)
    wait(30000)
    expect(head(s)).toBe('ses')
    s.hide()
    collapsed(s)
    expect(s.state.form).toBe('empty')
    I(s).tick(t0 + 5 * 60000)
    expect(log.said).toEqual([['Quedan 5:00', 'polite']])
    expect(head(s)).toBe('ses')
    expect(s.get('ses').seen).toBe(false)
  })

  it('acción sin marca enlace montada: se queda (aviso 14); con marca montada se recoge y vive en la marca', () => {
    const s = make()
    fakeRegion(s, { ready: true })
    s.error('save', 'No se pudo guardar', { action: { label: 'Reintentar', onClick() {} } })
    shown(s)
    wait(60000)
    expect(head(s)).toBe('save')
    expect(warned(/tiene acción y ninguna marca enlace montada.*GStatusMark for="save"/)).toBe(true)
    s.hide()
    collapsed(s)
    const unmounted = fakeMark(s, 'save', { mounted: false })
    s.announce('save')
    shown(s)
    wait(5000)
    expect(head(s)).toBe('save') // una marca sin caja no cuenta
    I(s).markDel('save', unmounted)
    fakeMark(s, 'save')
    s.hide(); collapsed(s)
    s.announce('save')
    shown(s)
    wait(5000)
    expect(I(s).state.current).toBe(0)
    collapsed(s)
    expect(s.get('save')).toMatchObject({ seen: true }) // condición: sigue en el modelo
  })

  it('lo que no puede recogerse deja paso a lo que espera y vuelve detrás; después se queda', () => {
    const s = make()
    fakeRegion(s, { ready: true })
    s.error('save', 'No se pudo guardar', { action: { label: 'Reintentar', onClick() {} } })
    shown(s)
    s.info('i', 'Info')
    wait(5000)
    expect(head(s)).toBe('i')
    shown(s)
    wait(5000)
    expect(head(s)).toBe('save')
    shown(s)
    wait(60000)
    expect(head(s)).toBe('save')
    s.info('j', 'Otra')
    expect(head(s)).toBe('j') // ya cumplió su tiempo: lo que aún no se leyó pasa
  })

  it('resultado con enlace: se queda mientras su marca esté montada; sin marca, se retira (read)', () => {
    const s = make()
    fakeRegion(s, { ready: true })
    const onRemove = vi.fn()
    s.success('f', 'Factura guardada', { link: { label: 'Ver factura', href: '#f' }, onRemove })
    const m = fakeMark(s, 'f')
    shown(s)
    wait(5000)
    collapsed(s)
    expect(s.has('f')).toBe(true)
    I(s).markDel('f', m)
    expect(s.has('f')).toBe(false)
    expect(onRemove.mock.calls[0][0]).toBe('read')
  })

  it('«Ocultar» (hideShown): la mostrada pasa a seen; con espera, relevo; sin espera, se recoge', () => {
    const s = make()
    fakeRegion(s, { ready: true })
    s.warning('w', 'Uno')
    s.info('i', 'Dos')
    shown(s)
    I(s).hideShown()
    expect(head(s)).toBe('i')
    expect(s.get('w').seen).toBe(true)
    I(s).hideShown()
    expect(I(s).state).toMatchObject({ current: 0, explicit: true })
  })
})

describe('Interrupciones (#702): toda transición parte del estado actual', () => {
  it('llega algo nuevo mientras se recoge: vuelve (cancela la recogida) con lo nuevo', () => {
    const s = make()
    fakeRegion(s, { ready: true })
    s.info('a', 'a')
    shown(s)
    wait(5000)
    expect(I(s).state.leaving).toBeGreaterThan(0)
    s.warning('b', 'b')
    expect(I(s).state).toMatchObject({ leaving: 0 })
    expect(head(s)).toBe('b')
  })

  it('puntero, foco o marca de lo que se recoge por tiempo: la recogida se cancela y vuelve en pausa (1000 ms al reanudar)', () => {
    const s = make()
    fakeRegion(s, { ready: true })
    s.info('a', 'a')
    shown(s)
    wait(5000)
    I(s).hold('pointer', true)
    expect(head(s)).toBe('a')
    shown(s)
    expect(s.state.paused).toBe(true)
    I(s).hold('pointer', false)
    wait(999)
    expect(head(s)).toBe('a')
    wait(1)
    expect(I(s).state.current).toBe(0)
    // Una recogida pedida por la persona no se cancela con el puntero
    s.info('b', 'b')
    shown(s)
    s.hide()
    I(s).hold('pointer', true)
    expect(I(s).state.current).toBe(0)
    expect(I(s).state.leaving).toBeGreaterThan(0)
  })

  it('«Ocultar»/hide durante la caída pasan a recogerse; el modelo vacío durante la entrada, también; la lista se abre en cualquier etapa', () => {
    const s = make()
    fakeRegion(s, { ready: true })
    s.info('a', 'a')
    s.hide()
    expect(I(s).state.leaving).toBeGreaterThan(0)
    s.info('b', 'b') // vuelve
    s.remove('b')
    expect(I(s).state.leaving).toBeGreaterThan(0)
    s.info('c', 'c')
    shown(s)
    wait(5000) // se recoge
    expect(s.open('c')).toBe(true)
    expect(s.state).toMatchObject({ form: 'list', current: 'c', paused: true })
    s.close()
    expect(s.get('c').seen).toBe(true)
    expect(s.state.form).toBe('line')
    collapsed(s)
    expect(s.state.form).toBe('empty')
    s.open() // desde vacía
    expect(s.state.form).toBe('list')
    s.close()
    expect(I(s).state.leaving).toBe(I(s).byId('c').uid)
  })

  it('la lista: todo lo abierto pasa a seen al cerrarse; vaciar el modelo con la lista abierta la cierra y se recoge', () => {
    const s = make()
    fakeRegion(s, { ready: true })
    s.info('a', 'a')
    s.warning('b', 'b')
    s.open()
    expect(s.state.form).toBe('list')
    s.clear()
    expect(s.state.form).toBe('line')
    expect(I(s).state.list).toBe(false)
  })
})

describe('Sucesos hacia la región (anuncios, #698)', () => {
  it('texto `tipo: título. descripción`, por politeness; uno por suceso; nada sin cambio de type/title/description', () => {
    const s = make()
    const log = fakeRegion(s)
    s.error('e', 'No se pudo guardar', { description: 'El servidor no respondió.' })
    s.warning('w', 'Sin conexión.')
    s.info('i', 'Modo lectura', { politeness: 'assertive' })
    expect(log.events.map((e) => [e.kind, e.text, e.politeness])).toEqual([
      ['appear', 'Error: No se pudo guardar. El servidor no respondió.', 'assertive'],
      ['appear', 'Advertencia: Sin conexión.', 'polite'],
      ['appear', 'Información: Modo lectura', 'assertive']
    ])
    log.events.length = 0
    s.update('w', { dismissible: true, details: 'x', action: { label: 'a', onClick() {} } })
    expect(log.events).toHaveLength(0)
    s.update('w', { description: 'Se reintenta sola' })
    s.update('w', { type: 'error' })
    s.set('w', { type: 'error', title: 'Sin conexión.', description: 'Se reintenta sola' })
    expect(log.events.map((e) => [e.kind, e.text])).toEqual([
      ['change', 'Advertencia: Sin conexión. Se reintenta sola'],
      ['change', 'Error: Sin conexión. Se reintenta sola']
    ])
    log.events.length = 0
    s.announce('e')
    expect(log.events.map((e) => e.kind)).toEqual(['announce'])
  })
})

describe('Acción y resolución en el sitio (#318, #697)', () => {
  it('sin promesa no hay busy; recibe la copia de la condición', () => {
    const s = make()
    const onClick = vi.fn()
    s.error('e', 'Falló', { action: { label: 'Reintentar', onClick } })
    I(s).action(I(s).byId('e').uid)
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onClick.mock.calls[0][0]).toMatchObject({ id: 'e', type: 'error' })
    expect(s.get('e').busy).toBe(false)
  })

  it('promesa → busy (otra pulsación no hace nada, busyLabel cortés); cumplida con un objeto de éxito = resolve (sin la traza, F4)', async () => {
    const s = make()
    const log = fakeRegion(s)
    const d = deferred()
    const onClick = vi.fn(() => d.p)
    s.error('save', 'No se pudo guardar', { description: 'El servidor no respondió.', details: 'POST /api/facturas · 500', action: { label: 'Reintentar', busyLabel: 'Reintentando…', onClick } })
    const uid = I(s).byId('save').uid
    log.events.length = 0
    I(s).action(uid)
    expect(s.get('save').busy).toBe(true)
    expect(log.said).toEqual([['Reintentando…', 'polite']])
    I(s).action(uid)
    expect(onClick).toHaveBeenCalledTimes(1)
    d.ok({ type: 'success', title: 'Factura guardada', link: { label: 'Ver factura', href: '#f' } })
    await flushPromises()
    const c = s.get('save')
    expect(c).toMatchObject({ type: 'success', title: 'Factura guardada', busy: false, persistent: false, link: { label: 'Ver factura', href: '#f' } })
    for (const k of ['description', 'details', 'action']) expect(c[k], k).toBeUndefined()
    expect(I(s).byId('save').uid).toBe(uid)
    expect(log.events.map((e) => [e.kind, e.text])).toEqual([['change', 'Correcto: Factura guardada']])
  })

  it('cumplida con un objeto que no es éxito: update; con otra cosa: solo termina busy', async () => {
    const s = make()
    const d = deferred()
    s.error('e', 'Falló', { description: 'd', action: { label: 'R', onClick: () => d.p } })
    I(s).action(I(s).byId('e').uid)
    d.ok({ title: 'Sigue fallando' })
    await flushPromises()
    expect(s.get('e')).toMatchObject({ type: 'error', title: 'Sigue fallando', description: 'd', busy: false })
    const d2 = deferred()
    s.update('e', { action: { label: 'R', onClick: () => d2.p } })
    I(s).action(I(s).byId('e').uid)
    d2.ok(true)
    await flushPromises()
    expect(s.get('e')).toMatchObject({ title: 'Sigue fallando', busy: false })
  })

  it('rechazada: termina busy, queda como estaba, se reanuncia y se vuelve a mostrar; el rechazo no queda sin manejar', async () => {
    const s = make()
    const log = fakeRegion(s)
    const unhandled = vi.fn()
    process.on('unhandledRejection', unhandled)
    s.error('e', 'Falló', { action: { label: 'R', onClick: () => Promise.reject(new Error('otra vez')) } })
    s.hide()
    log.events.length = 0
    I(s).action(I(s).byId('e').uid)
    await flushPromises()
    await new Promise((r) => setImmediate(r))
    process.off('unhandledRejection', unhandled)
    expect(unhandled).not.toHaveBeenCalled()
    expect(s.get('e')).toMatchObject({ type: 'error', title: 'Falló', busy: false, seen: false })
    expect(log.events.map((e) => e.kind)).toEqual(['announce'])
  })

  it('retirada (o resuelta) con la promesa pendiente: el desenlace no la vuelve a crear ni la pisa', async () => {
    const s = make()
    const d = deferred()
    s.error('e', 'Falló', { action: { label: 'R', onClick: () => d.p } })
    I(s).action(I(s).byId('e').uid)
    s.remove('e')
    d.ok({ type: 'success', title: 'Guardada' })
    await flushPromises()
    expect(s.has('e')).toBe(false)
    const d2 = deferred()
    s.error('f', 'Falló', { action: { label: 'R', onClick: () => d2.p } })
    I(s).action(I(s).byId('f').uid)
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
    expect(() => I(s).action(I(s).byId('e').uid)).not.toThrow()
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
    const tick = (ms) => I(s).tick(t0 + ms)
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
    I(s).tick(t0 + 1000)
    expect(log.said).toEqual([])
    I(s).tick(t0 + 4 * 60000 - 20000)
    expect(log.said).toEqual([['faltan 30 s', 'polite']])
    s.update('a', { deadline: t0 + 20 * 60000 })
    I(s).tick(t0 + 15 * 60000 + 1000)
    expect(log.said).toHaveLength(2)
  })
})

describe('Opciones del gestor (configure)', () => {
  it('position, offset, duration y labels: fusiona; fuera de lista avisa y conserva', () => {
    const s = make({ position: 'top-end', offset: { top: 12 } })
    const o = I(s).state.opts
    expect(o).toMatchObject({ position: 'top-end', duration: 'auto' })
    s.configure({ position: 'bottom-center', offset: { top: {} }, limit: 3, labels: { types: { info: 'Nota' }, hide: 'Quitar' } })
    expect(o).toMatchObject({ position: 'top-end', offset: { top: 12 } })
    expect(o.labels.types).toEqual({ ...LABELS.types, info: 'Nota' })
    expect(o.labels.hide).toBe('Quitar')
    expect(o.labels.region).toBe(LABELS.region)
    for (const re of [/position «bottom-center»/, /offset debe ser/, /desconocida «limit»/]) expect(warned(re), String(re)).toBe(true)
    s.configure({ offset: { top: '3rem' }, duration: 9000 })
    expect(o).toMatchObject({ offset: { top: '3rem' }, duration: 9000 })
  })

  it('hotkey: Alt+F8 por defecto; false lo quita; F6 o ilegible se rechaza; F8 y Shift+F8 se aceptan con aviso', () => {
    const s = make()
    const st = I(s).state
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
