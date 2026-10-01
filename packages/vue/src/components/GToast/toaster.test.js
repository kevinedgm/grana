// Gestor de avisos (createToaster) sin DOM de región: se le conecta una región falsa por el acceso interno.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createApp, defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import * as Grana from '../../index.js'
import { createToaster, useToast, toasterKey, INTERNAL, TOAST_DURATION, RESUME_MIN, parseHotkey, matchesHotkey } from './toaster.js'

const LABELS = {
  region: 'Notificaciones ({hotkey})',
  close: 'Cerrar notificación',
  types: { info: 'Información', success: 'Correcto', warning: 'Advertencia', error: 'Error', loading: 'En curso' },
  repeated: '{count} veces',
  queued: '{count} más en espera',
  actionHint: 'Pulsa {hotkey} para {action}.'
}

// Región falsa: registra anuncios y retira al instante los que salen
function fakeRegion(t) {
  const calls = { announced: [], left: [], cleared: 0 }
  const region = {
    announce: (text, politeness) => calls.announced.push([politeness, text]),
    beforeLeave: (r, reason) => calls.left.push([r.id, reason]),
    leave: (r) => t[INTERNAL].remove(r.uid),
    beforeClear: () => { calls.cleared++ }
  }
  t[INTERNAL].attach(region)
  return { region, calls }
}
const make = (opts = {}) => {
  const t = createToaster({ labels: LABELS, ...opts })
  return { t, ...fakeRegion(t) }
}
const ids = (t, state) => t.toasts.filter((x) => !state || x.state === state).map((x) => x.title)

let warn
beforeEach(() => {
  vi.useFakeTimers()
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})
const warned = (re) => warn.mock.calls.some(([m]) => re.test(m))

describe('GToast · API pública', () => {
  it('@grana/vue exporta createToaster, useToast, GToaster y toasterKey (sin instancia global)', () => {
    expect(typeof Grana.createToaster).toBe('function')
    expect(typeof Grana.useToast).toBe('function')
    expect(Grana.GToaster.name).toBe('GToaster')
    expect(typeof Grana.toasterKey).toBe('symbol')
    expect(Grana.toaster).toBeUndefined()
  })

  it('el gestor tiene la forma del contrato y es plugin de Vue (app.use lo provee)', () => {
    const t = createToaster()
    for (const m of ['show', 'info', 'success', 'warning', 'error', 'promise', 'update', 'dismiss', 'clear', 'configure', 'install']) expect(typeof t[m]).toBe('function')
    expect(Array.isArray(t.toasts)).toBe(true)
    let got
    const Comp = defineComponent({ setup() { got = useToast(); return () => h('div') } })
    const w = mount(Comp, { global: { plugins: [t] } })
    expect(got).toBe(t)
    w.unmount()
  })

  it('useToast sin gestor provisto avisa y devuelve undefined; fuera de setup, también', () => {
    let got = 'x'
    const Comp = defineComponent({ setup() { got = useToast(); return () => h('div') } })
    mount(Comp).unmount()
    expect(got).toBeUndefined()
    expect(warned(/useToast\(\) sin gestor provisto/)).toBe(true)
    expect(useToast()).toBeUndefined()
    expect(warned(/solo funciona dentro de setup/)).toBe(true)
  })

  it('provide manual con toasterKey', () => {
    const t = createToaster()
    let got
    const app = createApp({ setup() { got = useToast(); return () => null } })
    app.provide(toasterKey, t)
    app.mount(document.createElement('div'))
    expect(got).toBe(t)
    app.unmount()
  })

  it('show devuelve el id (generado toast-<n> o el propio); los atajos fijan el tipo', () => {
    const { t } = make()
    expect(t.show({ title: 'Uno' })).toBe('toast-1')
    expect(t.show({ id: 'mio', title: 'Dos' })).toBe('mio')
    t.info('I'); t.success('S'); t.warning('W'); t.error('E')
    expect(t.toasts.map((x) => x.type)).toEqual(['neutral', 'neutral', 'info', 'success', 'warning', 'error'])
  })

  it('toasts: copias congeladas con la forma del contrato, en orden de llegada', () => {
    const { t } = make()
    t.success('Guardado', { description: 'Hoy' })
    const [x] = t.toasts
    expect(Object.isFrozen(x)).toBe(true)
    expect(x).toMatchObject({ id: 'toast-1', type: 'success', title: 'Guardado', description: 'Hoy', politeness: 'polite', count: 1, state: 'visible' })
    expect(typeof x.duration).toBe('number')
    expect(typeof x.createdAt).toBe('number')
    expect(Object.isFrozen(t.toasts)).toBe(true)
  })
})

describe('GToast · duración y tiempo', () => {
  it("'auto' = clamp(5000, 2000 + 60 × caracteres, 12000)", () => {
    const { t } = make()
    expect(TOAST_DURATION).toEqual({ min: 5000, base: 2000, perChar: 60, max: 12000 })
    t.show({ title: 'a' })
    t.show({ title: 'x'.repeat(50), description: 'y'.repeat(50) })
    t.show({ title: 'z'.repeat(60), description: 'w'.repeat(140) })
    expect(t.toasts.map((x) => x.duration)).toEqual([5000, 8000, 12000])
  })

  it('error, loading, con acción y autoClose:false no se cierran solos (Infinity)', () => {
    const { t } = make({ limit: 10 })
    t.error('E')
    t.show({ type: 'loading', title: 'L' })
    t.success('A', { action: { label: 'Deshacer' } })
    t.configure({ autoClose: false })
    t.info('I')
    expect(t.toasts.map((x) => x.duration)).toEqual([Infinity, Infinity, Infinity, Infinity])
    vi.advanceTimersByTime(60000)
    expect(t.toasts).toHaveLength(4)
  })

  it('duration numérica e Infinity por aviso; la del gestor como defecto', () => {
    const { t } = make({ duration: 7000, limit: 5 })
    t.show({ title: 'a' })
    t.show({ title: 'b', duration: 3000 })
    t.show({ title: 'c', duration: Infinity })
    expect(t.toasts.map((x) => x.duration)).toEqual([7000, 3000, Infinity])
    vi.advanceTimersByTime(3000)
    expect(ids(t)).toEqual(['a', 'c'])
    vi.advanceTimersByTime(4000)
    expect(ids(t)).toEqual(['c'])
  })

  it('se cierra con motivo timeout y onDismiss una vez', () => {
    const { t } = make()
    const onDismiss = vi.fn()
    t.success('Hecho', { onDismiss })
    vi.advanceTimersByTime(4999)
    expect(t.toasts).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(t.toasts).toHaveLength(0)
    expect(onDismiss).toHaveBeenCalledTimes(1)
    expect(onDismiss.mock.calls[0][0]).toBe('timeout')
    expect(onDismiss.mock.calls[0][1]).toMatchObject({ title: 'Hecho', type: 'success' })
  })

  it('sin región montada el tiempo no corre; al montarla empieza', () => {
    const t = createToaster({ labels: LABELS })
    t.success('Espera')
    vi.advanceTimersByTime(20000)
    expect(t.toasts).toHaveLength(1)
    fakeRegion(t)
    vi.advanceTimersByTime(5000)
    expect(t.toasts).toHaveLength(0)
  })

  it('en cola el tiempo no corre: al hacerse visible empieza completo', () => {
    const { t } = make({ limit: 1 })
    t.error('Bloquea')
    t.success('Espera')
    vi.advanceTimersByTime(30000)
    expect(t.toasts.map((x) => x.state)).toEqual(['visible', 'queued'])
    t.dismiss('toast-1')
    vi.advanceTimersByTime(4999)
    expect(ids(t)).toEqual(['Espera'])
    vi.advanceTimersByTime(1)
    expect(t.toasts).toHaveLength(0)
  })

  it.each(['hover', 'focus', 'hidden', 'press'])('pausa por %s: conserva el resto y al reanudar no reinicia', (key) => {
    const { t } = make()
    t.success('Pausable')
    vi.advanceTimersByTime(3000)
    t[INTERNAL].setPause(key, true)
    vi.advanceTimersByTime(60000)
    expect(t.toasts).toHaveLength(1)
    t[INTERNAL].setPause(key, false)
    vi.advanceTimersByTime(1999)
    expect(t.toasts).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(t.toasts).toHaveLength(0)
  })

  it(`al reanudar queda un mínimo de ${RESUME_MIN} ms`, () => {
    const { t } = make()
    t.success('Casi')
    vi.advanceTimersByTime(4900)
    t[INTERNAL].setPause('hover', true)
    t[INTERNAL].setPause('hover', false)
    vi.advanceTimersByTime(999)
    expect(t.toasts).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(t.toasts).toHaveLength(0)
  })

  it('dos motivos de pausa: solo reanuda cuando se quitan los dos', () => {
    const { t } = make()
    t.success('Doble')
    t[INTERNAL].setPause('hover', true)
    t[INTERNAL].setPause('focus', true)
    t[INTERNAL].setPause('hover', false)
    vi.advanceTimersByTime(60000)
    expect(t.toasts).toHaveLength(1)
  })

  it('configure({ autoClose }) en vivo: false congela; true reanuda con la duración completa', () => {
    const { t } = make()
    t.success('Vivo')
    vi.advanceTimersByTime(4000)
    t.configure({ autoClose: false })
    vi.advanceTimersByTime(60000)
    expect(t.toasts[0].duration).toBe(Infinity)
    t.configure({ autoClose: true })
    vi.advanceTimersByTime(4999)
    expect(t.toasts).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(t.toasts).toHaveLength(0)
  })
})

describe('GToast · anuncio', () => {
  it('texto compuesto por tipo: prefijo, punto, descripción, «N veces» y pista de acción', () => {
    const { t, calls } = make({ limit: 10 })
    t.success('Cambios guardados')
    t.show({ title: 'Borrador guardado' })
    t.info('¿Recargar?', { description: 'Hay una versión nueva.' })
    t.warning('Sin conexión')
    t.success('Proyecto archivado', { action: { label: 'Deshacer' } })
    expect(calls.announced).toEqual([
      ['polite', 'Correcto: Cambios guardados.'],
      ['polite', 'Borrador guardado.'],
      ['polite', 'Información: ¿Recargar? Hay una versión nueva.'],
      ['polite', 'Advertencia: Sin conexión.'],
      ['polite', 'Correcto: Proyecto archivado. Pulsa F8 para Deshacer.']
    ])
  })

  it('error al canal enérgico; politeness sube un warning; con hotkey:false no hay pista', () => {
    const { t, calls } = make({ hotkey: false, limit: 10 })
    t.error('No se pudo subir', { description: 'Supera el tamaño.' })
    t.warning('Atención', { politeness: 'assertive' })
    t.success('Con acción', { action: { label: 'Ver' } })
    expect(calls.announced).toEqual([
      ['assertive', 'Error: No se pudo subir. Supera el tamaño.'],
      ['assertive', 'Advertencia: Atención.'],
      ['polite', 'Correcto: Con acción.']
    ])
  })

  it('repetido: se vuelve a anunciar con «N veces»', () => {
    const { t, calls } = make()
    t.success('Enlace copiado')
    t.success('Enlace copiado')
    t.success('Enlace copiado')
    expect(calls.announced.map((c) => c[1])).toEqual(['Correcto: Enlace copiado.', 'Correcto: Enlace copiado. 2 veces', 'Correcto: Enlace copiado. 3 veces'])
  })

  it('un aviso en cola no se anuncia hasta hacerse visible', () => {
    const { t, calls } = make({ limit: 1 })
    t.info('Primero')
    t.info('Segundo')
    expect(calls.announced.map((c) => c[1])).toEqual(['Información: Primero.'])
    t.dismiss('toast-1')
    expect(calls.announced.map((c) => c[1])).toEqual(['Información: Primero.', 'Información: Segundo.'])
  })

  it('antes de montar la región no se anuncia; al montarla se anuncian los visibles en orden', () => {
    const t = createToaster({ labels: LABELS })
    t.info('A')
    t.info('B')
    const { calls } = fakeRegion(t)
    expect(calls.announced.map((c) => c[1])).toEqual(['Información: A.', 'Información: B.'])
  })

  it('update: se reanuncia si cambian type, title o description; no si cambia solo duration o action', () => {
    const { t, calls } = make()
    const id = t.info('Subiendo')
    t.update(id, { duration: 9000 })
    t.update(id, { action: { label: 'Ver' } })
    expect(calls.announced).toHaveLength(1)
    t.update(id, { title: 'Subido' })
    t.update(id, { type: 'error' })
    expect(calls.announced.slice(1)).toEqual([['polite', 'Información: Subido. Pulsa F8 para Ver.'], ['assertive', 'Error: Subido. Pulsa F8 para Ver.']])
  })
})

describe('GToast · cola, límite y deduplicación', () => {
  it('6 avisos con limit 3: 3 visibles y 3 en cola; cerrar promueve el primero (FIFO)', () => {
    const { t } = make()
    ;['1', '2', '3', '4', '5', '6'].forEach((n) => t.info(n))
    expect(ids(t, 'visible')).toEqual(['1', '2', '3'])
    expect(ids(t, 'queued')).toEqual(['4', '5', '6'])
    t.dismiss('toast-2')
    expect(ids(t, 'visible')).toEqual(['1', '3', '4'])
    expect(t[INTERNAL].state.queue).toHaveLength(2)
  })

  it('un error se adelanta al primer puesto de la cola (sin expulsar visibles); entre errores, por llegada', () => {
    const { t } = make({ limit: 1 })
    t.info('v')
    t.info('q1')
    t.info('q2')
    t.error('e1')
    t.error('e2')
    expect(ids(t, 'visible')).toEqual(['v'])
    const order = t[INTERNAL].state.queue.map((u) => t[INTERNAL].state.items.find((r) => r.uid === u).title)
    expect(order).toEqual(['e1', 'e2', 'q1', 'q2'])
  })

  it('mobileLimit en móvil; al volver a escritorio se promueven', () => {
    const { t } = make()
    t.info('a'); t.info('b'); t.info('c')
    t[INTERNAL].setMobile(true)
    expect(ids(t, 'visible')).toEqual(['a'])
    expect(ids(t, 'queued')).toEqual(['b', 'c'])
    t[INTERNAL].setMobile(false)
    expect(ids(t, 'visible')).toEqual(['a', 'b', 'c'])
  })

  it('mismo contenido: count + 1, mismo id, reinicia el tiempo; action y onDismiss nuevos sustituyen', () => {
    const { t } = make()
    const first = vi.fn()
    const second = vi.fn()
    const a = t.success('Copiado', { onDismiss: first })
    vi.advanceTimersByTime(4000)
    const b = t.success('Copiado', { onDismiss: second })
    expect(b).toBe(a)
    expect(t.toasts).toHaveLength(1)
    expect(t.toasts[0].count).toBe(2)
    vi.advanceTimersByTime(4999)
    expect(t.toasts).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledWith('timeout', expect.objectContaining({ count: 2 }))
  })

  it('distinto tipo o descripción no deduplica; uno que sale tampoco cuenta', () => {
    const { t, region } = make({ limit: 10 })
    t.success('X')
    t.info('X')
    t.success('X', { description: 'd' })
    expect(t.toasts).toHaveLength(3)
    // Un aviso en salida no cuenta: región que no retira al instante
    region.leave = () => {}
    t.dismiss('toast-1')
    expect(t.toasts[0].state).toBe('leaving')
    t.success('X')
    expect(t.toasts.filter((x) => x.title === 'X' && x.type === 'success' && !x.description)).toHaveLength(2)
  })

  it('mismo id: actualiza en su sitio sin reiniciar el contador; el tiempo se recalcula completo', () => {
    const { t } = make()
    t.success('Copiado')
    t.success('Copiado')
    t.show({ id: 'up', title: 'Subiendo', type: 'loading' })
    expect(t.show({ id: 'toast-1', title: 'Copiado otra vez', type: 'info' })).toBe('toast-1')
    expect(t.toasts[0]).toMatchObject({ id: 'toast-1', title: 'Copiado otra vez', type: 'info', count: 2 })
    expect(t.toasts.map((x) => x.id)).toEqual(['toast-1', 'up'])
    expect(t.update('nadie', { title: 'x' })).toBe(false)
    expect(t.update('up', { type: 'success', title: 'Subido' })).toBe(true)
    expect(t.toasts[1].duration).toBe(5000)
  })
})

describe('GToast · promesa', () => {
  it('devuelve la misma promesa; loading → success en su sitio y anunciado', async () => {
    const { t, calls } = make()
    let resolve
    const p = new Promise((r) => { resolve = r })
    expect(t.promise(p, { loading: 'Subiendo informe…', success: (v) => ({ title: 'Informe subido', description: v }), error: 'No se pudo' })).toBe(p)
    expect(t.toasts[0]).toMatchObject({ type: 'loading', title: 'Subiendo informe…', duration: Infinity, politeness: 'polite' })
    resolve('informe.pdf')
    await p
    await Promise.resolve()
    expect(t.toasts[0]).toMatchObject({ id: 'toast-1', type: 'success', title: 'Informe subido', description: 'informe.pdf', duration: 5000 })
    expect(calls.announced.map((c) => c[1])).toEqual(['En curso: Subiendo informe….', 'Correcto: Informe subido. informe.pdf'])
  })

  it('rechazo → error enérgico sin autocierre; el rechazo sigue siendo del llamador', async () => {
    const { t, calls } = make()
    const p = Promise.reject(new Error('413'))
    const back = t.promise(p, { loading: 'Subiendo', success: 'Bien', error: (e) => ({ title: 'No se pudo subir', description: e.message }) })
    await expect(back).rejects.toThrow('413')
    await Promise.resolve()
    expect(t.toasts[0]).toMatchObject({ type: 'error', title: 'No se pudo subir', description: '413', duration: Infinity, politeness: 'assertive' })
    expect(calls.announced.at(-1)).toEqual(['assertive', 'Error: No se pudo subir. 413'])
  })

  it('cerrar en loading no cancela la promesa y el desenlace no reaparece', async () => {
    const { t } = make()
    let resolve
    const p = new Promise((r) => { resolve = r })
    const then = vi.fn()
    t.promise(p, { loading: 'Cargando', success: 'Listo' }).then(then)
    t.dismiss('toast-1')
    resolve(1)
    await p
    await Promise.resolve()
    expect(then).toHaveBeenCalledWith(1)
    expect(t.toasts).toHaveLength(0)
  })

  it('sin mensaje de success, el desenlace cierra el aviso (api); options.id fija el id', async () => {
    const { t } = make()
    const onDismiss = vi.fn()
    const p = Promise.resolve(1)
    t.promise(p, { loading: 'Cargando' }, { id: 'carga', onDismiss })
    expect(t.toasts[0].id).toBe('carga')
    await p
    await Promise.resolve()
    expect(t.toasts).toHaveLength(0)
    expect(onDismiss).toHaveBeenCalledWith('api', expect.objectContaining({ id: 'carga' }))
  })
})

describe('GToast · cierre', () => {
  it('onDismiss una vez con cada motivo (close, escape, swipe, api)', () => {
    const { t } = make({ limit: 10 })
    const seen = []
    for (const reason of ['close', 'escape', 'swipe']) {
      const id = t.info(reason, { onDismiss: (r) => seen.push(r) })
      const uid = t[INTERNAL].state.items.find((x) => x.id === id).uid
      t[INTERNAL].close(uid, reason)
      t[INTERNAL].close(uid, reason)
    }
    t.info('api', { onDismiss: (r) => seen.push(r) })
    t.dismiss('toast-4')
    t.dismiss('toast-4')
    expect(seen).toEqual(['close', 'escape', 'swipe', 'api'])
  })

  it('action.onClick recibe la copia y el aviso se cierra con motivo action', () => {
    const { t } = make()
    const onClick = vi.fn()
    const onDismiss = vi.fn()
    t.success('Archivado', { action: { label: 'Deshacer', onClick }, onDismiss })
    t[INTERNAL].action(t[INTERNAL].state.items[0].uid)
    expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ title: 'Archivado', action: expect.objectContaining({ label: 'Deshacer' }) }))
    expect(Object.isFrozen(onClick.mock.calls[0][0])).toBe(true)
    expect(onDismiss).toHaveBeenCalledWith('action', expect.any(Object))
    expect(t.toasts).toHaveLength(0)
  })

  it('dismiss() cierra visibles y en cola (api) sin promover a los que también se cierran', () => {
    const { t, calls } = make({ limit: 1 })
    const seen = []
    t.info('a', { onDismiss: (r) => seen.push('a:' + r) })
    t.info('b', { onDismiss: (r) => seen.push('b:' + r) })
    t.dismiss()
    expect(t.toasts).toHaveLength(0)
    expect(seen.sort()).toEqual(['a:api', 'b:api'])
    expect(calls.announced).toHaveLength(1)
  })

  it('clear() vacía todo sin animación y cada aviso recibe clear', () => {
    const { t, calls, region } = make({ limit: 1 })
    region.leave = () => {}
    const seen = []
    t.info('a', { onDismiss: (r) => seen.push(r) })
    t.info('b', { onDismiss: (r) => seen.push(r) })
    t.clear()
    expect(t.toasts).toHaveLength(0)
    expect(seen).toEqual(['clear', 'clear'])
    expect(calls.cleared).toBe(1)
  })
})

describe('GToast · avisos de desarrollo', () => {
  it('sin título no se muestra (show devuelve null)', () => {
    const { t } = make()
    expect(t.show({})).toBeNull()
    expect(t.show({ title: '  ' })).toBeNull()
    expect(t.toasts).toHaveLength(0)
    expect(warned(/necesita title/)).toBe(true)
  })

  it('action sin label o actions en plural: se ignora la acción', () => {
    const { t } = make({ limit: 10 })
    t.show({ title: 'a', action: { onClick() {} } })
    t.show({ title: 'b', actions: [{ label: 'x' }] })
    t.show({ title: 'c', action: [{ label: 'x' }] })
    expect(t.toasts.every((x) => !x.action)).toBe(true)
    expect(warned(/action necesita label/)).toBe(true)
    expect(warned(/una sola action/)).toBe(true)
  })

  it('valores fuera de lista y opciones desconocidas', () => {
    const t = createToaster({ position: 'middle', limit: 0, duration: -1, hotkey: 'F6', foo: 1 })
    expect(warned(/position «middle»/)).toBe(true)
    expect(warned(/limit debe ser/)).toBe(true)
    expect(warned(/duration «-1»/)).toBe(true)
    expect(warned(/F6/)).toBe(true)
    expect(warned(/opción desconocida «foo»/)).toBe(true)
    expect(t[INTERNAL].state.opts).toMatchObject({ position: 'bottom-end', limit: 3, duration: 'auto', hotkey: 'F8' })
    t.configure({ hotkey: 'Ctrl+' })
    expect(warned(/no se puede interpretar/)).toBe(true)
    t.show({ title: 'x', type: 'raro', politeness: 'alto', icon: 'x' })
    expect(warned(/type «raro»/)).toBe(true)
    expect(warned(/politeness «alto»/)).toBe(true)
    expect(warned(/desconocida «icon»/)).toBe(true)
    expect(t.toasts[0].type).toBe('neutral')
  })

  it('duration en un aviso sin autocierre forzado, error cortés y textos largos', () => {
    const { t } = make({ limit: 10 })
    t.error('e', { duration: 3000 })
    t.error('f', { politeness: 'polite' })
    t.info('t'.repeat(61), { description: 'd'.repeat(141) })
    expect(warned(/duration en un aviso que no se cierra solo/)).toBe(true)
    expect(warned(/error con politeness «polite»/)).toBe(true)
    expect(warned(/title de más de 60/)).toBe(true)
    expect(warned(/description de más de 140/)).toBe(true)
    expect(t.toasts[0].duration).toBe(Infinity)
  })

  it('textos que faltan: types.<tipo>, repeated, queued y actionHint al necesitarse', () => {
    const t = createToaster({ limit: 1 })
    fakeRegion(t)
    t.info('a')
    expect(warned(/labels\.types\.info/)).toBe(true)
    t.info('a')
    expect(warned(/labels\.repeated/)).toBe(true)
    t.show({ title: 'b', action: { label: 'x' } })
    expect(warned(/labels\.actionHint/)).toBe(true)
    expect(warned(/labels\.queued/)).toBe(true)
  })

  it('show sin ninguna región montada avisa tras el siguiente ciclo', () => {
    const t = createToaster({ labels: LABELS })
    t.info('a')
    expect(warned(/sin ninguna <GToaster>/)).toBe(false)
    vi.advanceTimersByTime(1)
    expect(warned(/sin ninguna <GToaster>/)).toBe(true)
  })

  it('regiones de varios gestores montadas a la vez', () => {
    const a = make()
    const b = make()
    expect(warned(/varios gestores/)).toBe(true)
    a.t[INTERNAL].detach(a.region)
    b.t[INTERNAL].detach(b.region)
  })
})

describe('GToast · atajo', () => {
  it('parseHotkey: F8, combinaciones, false y sintaxis ilegible', () => {
    expect(parseHotkey('F8').keys).toEqual({ key: 'F8', mods: { Alt: false, Control: false, Shift: false, Meta: false } })
    expect(parseHotkey('Alt+Shift+N').keys.mods).toMatchObject({ Alt: true, Shift: true })
    expect(parseHotkey(false)).toEqual({ ok: true, value: false, keys: null })
    for (const bad of ['', 'Alt+', 'Hyper+K', 'Alt+Alt+K', 'Shift', 3]) expect(parseHotkey(bad).ok).toBe(false)
  })

  it('matchesHotkey: tecla sin distinguir mayúsculas en letras y modificadores exactos', () => {
    const k = parseHotkey('Alt+Shift+N').keys
    const ev = (o) => ({ key: 'n', altKey: false, ctrlKey: false, shiftKey: false, metaKey: false, ...o })
    expect(matchesHotkey(ev({ key: 'N', altKey: true, shiftKey: true }), k)).toBe(true)
    expect(matchesHotkey(ev({ key: 'N', altKey: true }), k)).toBe(false)
    expect(matchesHotkey(ev({ key: 'F8' }), parseHotkey('F8').keys)).toBe(true)
    expect(matchesHotkey(ev({ key: 'F8', ctrlKey: true }), parseHotkey('F8').keys)).toBe(false)
  })
})
