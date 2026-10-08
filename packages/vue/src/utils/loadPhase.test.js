// utils/loadPhase.js: fases y tiempos (#532) y foco (#534). load-region.md «Motor compartido».
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DELAY, MINIMUM, SLOW, createLoadPhase, focusables, loadRegionKey, rememberFocus, restoreFocus } from './loadPhase.js'

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers(); document.body.innerHTML = '' })

const snap = (p) => ({ ...p.state })

describe('loadPhase · constantes y clave', () => {
  it('200 / 400 / 5000 ms; la clave de la región es un Symbol', () => {
    expect([DELAY, MINIMUM, SLOW]).toEqual([200, 400, 5000])
    expect(typeof loadRegionKey).toBe('symbol')
  })
})

describe('loadPhase · fases', () => {
  it('a 100 ms pendiente; a 250 a la vista (onShow una vez); a 5000 espera larga (onSlow una vez)', () => {
    const onShow = vi.fn()
    const onSlow = vi.fn()
    const p = createLoadPhase({ onShow, onSlow })
    expect(p.start()).toBe('new')
    expect(snap(p)).toEqual({ busy: true, pending: true, shown: false, slow: false })
    vi.advanceTimersByTime(100)
    expect(snap(p)).toEqual({ busy: true, pending: true, shown: false, slow: false })
    vi.advanceTimersByTime(150)
    expect(snap(p)).toEqual({ busy: true, pending: false, shown: true, slow: false })
    expect(onShow).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(SLOW - 250)
    expect(p.state.slow).toBe(true)
    expect(onSlow).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(10000)
    expect(onShow).toHaveBeenCalledTimes(1)
    expect(onSlow).toHaveBeenCalledTimes(1)
    p.dispose()
  })

  it('una carga que acaba antes de 200 ms no se ve: llegada en el acto con seen=false', () => {
    const onShow = vi.fn()
    const onArrive = vi.fn()
    const p = createLoadPhase({ onShow, onArrive })
    p.start()
    vi.advanceTimersByTime(150)
    p.stop()
    expect(onArrive).toHaveBeenCalledWith({ seen: false })
    expect(snap(p)).toEqual({ busy: false, pending: false, shown: false, slow: false })
    vi.advanceTimersByTime(1000)
    expect(onShow).not.toHaveBeenCalled()
  })

  it('si se vio, se queda al menos 400 ms a la vista (a 250 aparece a 200 y llega a ≥ 600)', () => {
    const onArrive = vi.fn()
    const p = createLoadPhase({ onArrive })
    p.start()
    vi.advanceTimersByTime(250)
    p.stop()
    expect(p.waiting).toBe(true)
    expect(p.state.busy).toBe(true)
    vi.advanceTimersByTime(349)
    expect(onArrive).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(onArrive).toHaveBeenCalledWith({ seen: true })
    expect(p.state.busy).toBe(false)
  })

  it('a 900 ms la llegada es inmediata (el mínimo ya se cumplió)', () => {
    const onArrive = vi.fn()
    const p = createLoadPhase({ onArrive })
    p.start()
    vi.advanceTimersByTime(900)
    p.stop()
    expect(onArrive).toHaveBeenCalledWith({ seen: true })
  })

  it('una carga que empieza mientras otra espera su mínimo hereda la fase visible (sin retraso ni nuevo onShow)', () => {
    const onShow = vi.fn()
    const onArrive = vi.fn()
    const p = createLoadPhase({ onShow, onArrive })
    p.start()
    vi.advanceTimersByTime(250)
    p.stop()
    vi.advanceTimersByTime(100)
    expect(p.start()).toBe('continue')
    expect(snap(p)).toEqual({ busy: true, pending: false, shown: true, slow: false })
    vi.advanceTimersByTime(1000)
    expect(onArrive).not.toHaveBeenCalled()
    p.stop()
    expect(onArrive).toHaveBeenCalledTimes(1) // el mínimo cuenta desde que se vio: ya se cumplió
    expect(onShow).toHaveBeenCalledTimes(1)
  })

  it('start({ arm: false }) da el estado sin temporizadores (servidor); arm() los programa', () => {
    const onShow = vi.fn()
    const p = createLoadPhase({ onShow })
    p.start({ arm: false })
    expect(p.state.busy).toBe(true)
    vi.advanceTimersByTime(1000)
    expect(onShow).not.toHaveBeenCalled()
    p.arm()
    vi.advanceTimersByTime(200)
    expect(onShow).toHaveBeenCalledTimes(1)
    p.dispose()
  })

  it('stop sin carga y dispose limpian sin efectos', () => {
    const onArrive = vi.fn()
    const p = createLoadPhase({ onArrive })
    p.stop()
    expect(onArrive).not.toHaveBeenCalled()
    p.start()
    p.dispose()
    vi.advanceTimersByTime(10000)
    expect(p.state.shown).toBe(false)
    expect(p.state.slow).toBe(false)
  })

  it('la espera larga no llega después de terminar', () => {
    const onSlow = vi.fn()
    const p = createLoadPhase({ onSlow })
    p.start()
    vi.advanceTimersByTime(4900)
    p.stop()
    vi.advanceTimersByTime(1000)
    expect(onSlow).not.toHaveBeenCalled()
  })
})

describe('loadPhase · foco (#534)', () => {
  const setup = () => {
    document.body.innerHTML = `<div id="root" tabindex="-1"><ul>
      <li data-k="a"><a href="#a">A</a><button>Ver</button><button disabled>No</button><button>Editar</button></li>
      <li data-k="b"><a href="#b">B</a><button>Ver</button></li></ul></div><button id="out">Fuera</button>`
    const root = document.getElementById('root')
    const find = (k) => root.querySelector(`[data-k="${k}"]`)
    return { root, find }
  }
  it('focusables: él incluido, en orden, sin deshabilitados', () => {
    const { find } = setup()
    expect(focusables(find('a')).map((n) => n.textContent)).toEqual(['A', 'Ver', 'Editar'])
  })
  it('recuerda clave e índice y vuelve al mismo enfocable', () => {
    const { root, find } = setup()
    const edit = find('a').querySelectorAll('button')[2]
    const mem = rememberFocus(find('a'), 'a', edit)
    expect(mem).toEqual({ key: 'a', index: 2 })
    root.focus()
    expect(restoreFocus(root, mem, find)).toBe(true)
    expect(document.activeElement).toBe(edit)
  })
  it('si la clave ya no existe, se queda en la raíz; desde body, a la raíz; nunca body', () => {
    const { root, find } = setup()
    document.activeElement.blur()
    expect(document.activeElement).toBe(document.body)
    restoreFocus(root, { key: 'zz', index: 0 }, find)
    expect(document.activeElement).toBe(root)
  })
  it('el índice que ya no existe va al primero del elemento', () => {
    const { root, find } = setup()
    root.focus()
    restoreFocus(root, { key: 'b', index: 5 }, find)
    expect(document.activeElement.textContent).toBe('B')
  })
  it('si la persona movió el foco fuera, no se toca', () => {
    const { root, find } = setup()
    const out = document.getElementById('out')
    out.focus()
    expect(restoreFocus(root, { key: 'a', index: 0 }, find)).toBe(false)
    expect(document.activeElement).toBe(out)
  })
})
