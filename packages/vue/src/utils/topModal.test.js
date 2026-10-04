// utils/topModal.js: seguimiento del <dialog> modal superior compartido por GToaster y GSpeechHost (#141, #213), con el
// predicado que ignora los <dialog> propios (la hoja móvil de GSpeechHost). Las pruebas de traslado de GToaster
// (GToaster.test.js) siguen pasando sin cambios sobre el útil extraído.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { createTopModal, isModal } from './topModal.js'
import { installTopLayer } from '../components/GSpeechHost/speechTestEnv.js'
import { EDGE_ORDER, clearEdgeReserve, edgeReserve, setEdgeReserve } from './edgeReserve.js'
import { createLiveWriter } from './liveRegion.js'
import { vi } from 'vitest'

let restore
beforeEach(() => { restore = installTopLayer() })
afterEach(() => { restore(); document.body.innerHTML = '' })
const mutations = () => new Promise((r) => setTimeout(r, 0))

describe('topModal', () => {
  it('pila de modales abiertos (el superior gana), ignora los propios y avisa de cada cambio', async () => {
    const seen = []
    const own = document.createElement('dialog')
    own.className = 'mine'
    const a = document.createElement('dialog')
    const b = document.createElement('dialog')
    document.body.append(own, a, b)
    a.showModal()
    const tm = createTopModal({ ignore: (d) => d.classList.contains('mine'), onChange: (top) => seen.push(top) })
    tm.scan()
    tm.sync()
    expect(tm.top()).toBe(a)
    tm.observe()
    b.showModal()
    await mutations()
    expect(tm.top()).toBe(b)
    own.showModal()
    await mutations()
    expect(tm.top()).toBe(b) // la hoja propia no cuenta
    b.close()
    await mutations()
    expect(tm.top()).toBe(a)
    a.close()
    await mutations()
    expect(tm.top()).toBeNull()
    expect(seen.at(-1)).toBeNull()
    // un <dialog> no modal (show) no cuenta
    a.setAttribute('open', '')
    await mutations()
    expect(isModal(a)).toBe(false)
    expect(tm.top()).toBeNull()
    tm.disconnect()
  })
})

describe('edgeReserve', () => {
  it('reservas por dueño y borde, reactivas; except deja fuera la propia', async () => {
    const x = Symbol('x')
    const y = Symbol('y')
    expect(edgeReserve('bottom')).toBe(0)
    setEdgeReserve(x, 'bottom', 50)
    setEdgeReserve(y, 'bottom', 10)
    setEdgeReserve(Symbol('z'), 'left', 10) // borde no válido: no cuenta
    expect(edgeReserve('bottom')).toBe(60)
    expect(edgeReserve('bottom', { except: y })).toBe(50)
    expect(edgeReserve('top')).toBe(0)
    setEdgeReserve(x, 'top', 50)
    expect(edgeReserve('top')).toBe(50)
    setEdgeReserve(x, 'top', 0)
    expect(edgeReserve('top')).toBe(0)
    clearEdgeReserve(y)
    expect(edgeReserve('bottom')).toBe(0)
    await nextTick()
  })

  it('order y before (#322): voz → isla → avisos por prioridad, no por montaje', () => {
    const speech = Symbol('speech')
    const island = Symbol('island')
    expect(EDGE_ORDER).toEqual({ speech: 10, status: 20 })
    // La isla publica ANTES que la voz (orden de montaje inverso): el resultado no cambia
    setEdgeReserve(island, 'top', 56, { order: EDGE_ORDER.status })
    setEdgeReserve(speech, 'top', 60, { order: EDGE_ORDER.speech })
    expect(edgeReserve('top', { before: EDGE_ORDER.status })).toBe(60) // la isla lee solo a la voz
    expect(edgeReserve('top', { before: EDGE_ORDER.speech })).toBe(0) // la voz no tiene a nadie delante
    expect(edgeReserve('top')).toBe(116) // GToaster (sin before) suma todo
    expect(edgeReserve('top', { except: island })).toBe(60)
    expect(edgeReserve('top', { except: speech, before: EDGE_ORDER.status })).toBe(0)
    // Sin order (llamada antigua): 0, queda delante de todos
    const old = Symbol('old')
    setEdgeReserve(old, 'top', 5)
    expect(edgeReserve('top', { before: EDGE_ORDER.speech })).toBe(5)
    // Cambiar solo el order actualiza la reserva
    setEdgeReserve(old, 'top', 5, { order: 30 })
    expect(edgeReserve('top', { before: EDGE_ORDER.status })).toBe(60)
    for (const o of [speech, island, old]) clearEdgeReserve(o)
    expect(edgeReserve('top')).toBe(0)
  })

  it('doc es el quinto parámetro: un documento propio lleva su registro aparte', () => {
    const other = document.implementation.createHTMLDocument('otro')
    const o = Symbol('o')
    setEdgeReserve(o, 'top', 30, { order: 10 }, other)
    expect(edgeReserve('top')).toBe(0)
    expect(edgeReserve('top', { doc: other })).toBe(30)
    clearEdgeReserve(o, other)
    expect(edgeReserve('top', { doc: other })).toBe(0)
  })
})

describe('liveRegion', () => {
  it('vacía, escribe en el siguiente ciclo (juntos los del mismo ciclo) y vacía pasado clear', () => {
    vi.useFakeTimers()
    const live = { polite: 'antes', assertive: '' }
    const w = createLiveWriter(live, { delay: 50, clear: 5000 })
    w.announce('Uno.', 'polite')
    w.announce('Dos.', 'polite')
    expect(live.polite).toBe('')
    vi.advanceTimersByTime(50)
    expect(live.polite).toBe('Uno. Dos.')
    w.announce('Alerta.', 'assertive')
    vi.advanceTimersByTime(50)
    expect(live.assertive).toBe('Alerta.')
    vi.advanceTimersByTime(5000)
    expect(live.polite).toBe('')
    expect(live.assertive).toBe('')
    w.dispose()
    vi.useRealTimers()
  })
})
