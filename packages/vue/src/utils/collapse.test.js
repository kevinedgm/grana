import { describe, it, expect, vi, afterEach } from 'vitest'
import { keepInPlace } from './collapse.js'

// Δ0 (#481) y su cancelación por un desplazamiento ajeno (#683), con geometría simulada en jsdom:
// el documento desplaza `top` y el elemento está en `layoutTop - top`.
function env() {
  const frames = []
  vi.stubGlobal('requestAnimationFrame', (f) => { frames.push(f); return frames.length })
  vi.stubGlobal('cancelAnimationFrame', () => {})
  keepInPlace(document.body, () => 0)() // detiene la de una prueba anterior (una sola a la vez) y repone su valor
  frames.length = 0
  const root = document.scrollingElement || document.documentElement
  let top = 500
  Object.defineProperty(root, 'scrollTop', { configurable: true, get: () => top, set: (v) => { top = Math.max(0, Math.min(v, 5000)) } })
  Object.defineProperty(root, 'scrollHeight', { configurable: true, value: 6000 })
  Object.defineProperty(root, 'clientHeight', { configurable: true, value: 1000 })
  root.scrollBy = ({ top: d }) => { root.scrollTop = top + d }
  const el = document.createElement('button')
  document.body.append(el)
  let layoutTop = 800
  el.getBoundingClientRect = () => ({ top: layoutTop - top })
  const tick = () => { const f = frames.shift(); f && f() }
  return { root, el, tick, shift: (d) => { layoutTop += d }, get top() { return top }, set top(v) { top = v }, frames }
}
afterEach(() => { vi.unstubAllGlobals(); document.body.innerHTML = '' })

describe('keepInPlace · Δ0 y desplazamiento ajeno (#683)', () => {
  it('compensa lo que el elemento se mueve y apaga el anclaje del navegador mientras dura', () => {
    const e = env()
    const stop = keepInPlace(e.el, () => 300)
    expect(e.root.style.overflowAnchor).toBe('none')
    e.shift(-100); e.tick()
    expect(e.el.getBoundingClientRect().top).toBe(300)
    e.shift(-50); e.tick()
    expect(e.el.getBoundingClientRect().top).toBe(300)
    stop()
    expect(e.root.style.overflowAnchor).toBe('')
  })

  it('un scrollTo de la aplicación entre cuadros cancela la compensación y no se deshace', () => {
    const e = env()
    keepInPlace(e.el, () => 300)
    e.shift(-100); e.tick() // la compensación escribe 400
    expect(e.top).toBe(400)
    e.root.scrollTop = 100 // la aplicación (o la barra arrastrada)
    e.shift(-50); e.tick()
    expect(e.top).toBe(100)
    expect(e.frames.length).toBe(0)
    expect(e.root.style.overflowAnchor).toBe('')
  })

  it('el primer cuadro compara con lo leído al empezar', () => {
    const e = env()
    keepInPlace(e.el, () => 300)
    e.root.scrollTop = 900
    e.shift(-100); e.tick()
    expect(e.top).toBe(900)
    expect(e.frames.length).toBe(0)
  })

  it('± 1px de redondeo no cancela', () => {
    const e = env()
    keepInPlace(e.el, () => 300)
    e.shift(-100); e.tick()
    e.root.scrollTop = e.top + 1
    e.shift(-20); e.tick()
    expect(e.frames.length).toBe(1)
  })
})

// #685 (1): se repone el valor EN LÍNEA previo de cada contenedor, al terminar y al cancelar; uno de hoja de estilos no se toca
describe('keepInPlace · overflow-anchor previo (#685)', () => {
  it('valor en línea propio de la aplicación: se repone al terminar', () => {
    const e = env()
    e.root.style.overflowAnchor = 'auto'
    let t = 0
    vi.stubGlobal('performance', { now: () => t })
    keepInPlace(e.el, () => 0)
    expect(e.root.style.overflowAnchor).toBe('none')
    e.tick() // primer cuadro: fija el final de la ventana (0 + 80 ms)
    expect(e.root.style.overflowAnchor).toBe('none')
    t = 10000
    e.tick() // fin de la ventana
    expect(e.frames.length).toBe(0)
    expect(e.root.style.overflowAnchor).toBe('auto')
    e.root.style.overflowAnchor = ''
  })

  it('valor en línea propio: se repone al cancelar (desplazamiento ajeno y rueda)', () => {
    const e = env()
    e.root.style.overflowAnchor = 'auto'
    keepInPlace(e.el, () => 300)
    e.root.scrollTop = 50
    e.tick()
    expect(e.root.style.overflowAnchor).toBe('auto')
    keepInPlace(e.el, () => 300)
    window.dispatchEvent(new Event('wheel'))
    expect(e.root.style.overflowAnchor).toBe('auto')
    e.root.style.overflowAnchor = ''
  })

  it('sin valor en línea (el de la hoja de estilos manda): no deja nada en línea', () => {
    const e = env()
    const stop = keepInPlace(e.el, () => 300)
    stop()
    expect(e.root.getAttribute('style') || '').not.toMatch(/overflow-anchor/)
  })
})
