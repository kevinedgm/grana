import { describe, it, expect, vi, afterEach } from 'vitest'
import { holdNoAnchor, keepInPlace } from './collapse.js'

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

// #1079: registro compartido del overflow-anchor: none en línea, con recuento por contenedor
describe('holdNoAnchor · recuento por contenedor (#1079)', () => {
  const box = () => document.body.appendChild(document.createElement('div'))

  it('escribe none y restaura el valor en línea previo; sin previo, el style queda sin la propiedad', () => {
    const a = box()
    a.style.overflowAnchor = 'auto'
    const r = holdNoAnchor(a)
    expect(a.style.overflowAnchor).toBe('none')
    r()
    expect(a.style.overflowAnchor).toBe('auto')
    const b = box()
    const r2 = holdNoAnchor(b)
    expect(b.style.overflowAnchor).toBe('none')
    r2()
    expect(b.getAttribute('style') || '').not.toMatch(/overflow-anchor/)
  })

  it('dos asas: soltar la primera no restaura, la segunda sí; soltar la misma dos veces no resta dos', () => {
    const a = box()
    const r1 = holdNoAnchor(a)
    const r2 = holdNoAnchor(a)
    r1()
    r1()
    expect(a.style.overflowAnchor).toBe('none')
    r2()
    expect(a.style.overflowAnchor).toBe('')
  })

  it('si la aplicación cambió el valor en línea durante la retención, no se pisa al soltar', () => {
    const a = box()
    const r = holdNoAnchor(a)
    a.style.overflowAnchor = 'auto'
    r()
    expect(a.style.overflowAnchor).toBe('auto')
  })

  it('con respect: un valor en línea de la aplicación (auto o none) no se toca ni cuenta', () => {
    for (const v of ['auto', 'none']) {
      const a = box()
      a.style.overflowAnchor = v
      const r = holdNoAnchor(a, true)
      expect(a.style.overflowAnchor).toBe(v)
      r()
      expect(a.style.overflowAnchor).toBe(v)
    }
  })

  it('keepInPlace con una retención de sticky abierta y soltada a media ventana termina con el valor original', () => {
    const e = env()
    e.root.style.overflowAnchor = 'auto'
    const sticky = holdNoAnchor(e.root)
    let t = 0
    vi.stubGlobal('performance', { now: () => t })
    keepInPlace(e.el, () => 300)
    e.tick()
    sticky()
    expect(e.root.style.overflowAnchor).toBe('none')
    t = 10000
    e.tick()
    expect(e.frames.length).toBe(0)
    expect(e.root.style.overflowAnchor).toBe('auto')
    e.root.style.overflowAnchor = ''
  })

  it('sin document devuelve el asa vacía sin lanzar', () => {
    const a = box()
    vi.stubGlobal('document', undefined)
    const r = holdNoAnchor(a)
    expect(() => r()).not.toThrow()
    vi.unstubAllGlobals()
    expect(a.getAttribute('style')).toBeNull()
  })
})
