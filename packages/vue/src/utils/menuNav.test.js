// Motor de menú compartido (utils/menuNav.js, #657): lo que GMenu y GFab toman de él.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TYPE_MS, createHighlight, createPointer, createTypeahead, focusItem, repeatGesture, stepTo } from './menuNav.js'

afterEach(() => { vi.useRealTimers(); document.body.innerHTML = '' })

const list = (labels) => {
  const ul = document.createElement('ul')
  ul.innerHTML = labels.map((l) => `<li><button type="button" tabindex="-1"><span class="l">${l}</span></button></li>`).join('')
  document.body.append(ul)
  return [...ul.querySelectorAll('button')]
}

describe('menuNav · una activación por gesto (#661)', () => {
  it('segundo clic de una ráfaga e Intro/Espacio mantenidos', () => {
    expect(repeatGesture(new MouseEvent('click', { detail: 2 }))).toBe(true)
    expect(repeatGesture(new MouseEvent('click', { detail: 1 }))).toBe(false)
    expect(repeatGesture(new MouseEvent('click', { detail: 0 }))).toBe(false)
    expect(repeatGesture(new KeyboardEvent('keydown', { key: 'Enter', repeat: true }))).toBe(true)
    expect(repeatGesture(new KeyboardEvent('keydown', { key: ' ', repeat: true }))).toBe(true)
    expect(repeatGesture(new KeyboardEvent('keydown', { key: 'Enter' }))).toBe(false)
    expect(repeatGesture(new KeyboardEvent('keydown', { key: 'ArrowDown', repeat: true }))).toBe(false)
    expect(repeatGesture(null)).toBe(false)
  })
})

describe('menuNav · foco itinerante y recorrido', () => {
  it('focusItem deja una sola parada y, con el puntero, no desplaza ni pide el anillo', () => {
    const b = list(['Uno', 'Dos', 'Tres'])
    focusItem(b[1], b)
    expect(document.activeElement).toBe(b[1])
    expect(b.map((x) => x.tabIndex)).toEqual([-1, 0, -1])
    const spy = vi.spyOn(b[2], 'focus')
    focusItem(b[2], b, true)
    expect(spy).toHaveBeenCalledWith({ preventScroll: true, focusVisible: false })
    focusItem(null, b)
    expect(b[2].tabIndex).toBe(0)
  })

  it('↑ ↓ cíclicas, Inicio y Fin; otra tecla no recorre', () => {
    const b = list(['a', 'b', 'c'])
    expect(stepTo('ArrowDown', b, 2)).toBe(b[0])
    expect(stepTo('ArrowUp', b, 0)).toBe(b[2])
    expect(stepTo('Home', b, 1)).toBe(b[0])
    expect(stepTo('End', b, 1)).toBe(b[2])
    expect(stepTo('Enter', b, 1)).toBeUndefined()
  })
})

describe('menuNav · la letra salta (#658)', () => {
  it('siguiente que empieza por lo escrito, búfer de 500 ms, sin mayúsculas; Espacio y modificadores no cuentan', () => {
    vi.useFakeTimers()
    const b = list(['Renombrar', 'Duplicar', 'Reglas', 'Exportar'])
    const t = createTypeahead((x) => x.querySelector('.l').textContent)
    const k = (key, extra = {}) => new KeyboardEvent('keydown', { key, ...extra })
    expect(t.key(k('r'), b, 0)).toBe(b[2])
    vi.advanceTimersByTime(TYPE_MS + 1)
    expect(t.key(k('R'), b, 2)).toBe(b[0])
    vi.advanceTimersByTime(TYPE_MS + 1)
    // Dos letras afinan desde el actual
    expect(t.key(k('r'), b, 3)).toBe(b[0])
    expect(t.key(k('e'), b, 0)).toBe(b[0])
    expect(t.key(k('g'), b, 0)).toBe(b[2])
    vi.advanceTimersByTime(TYPE_MS + 1)
    expect(t.key(k('z'), b, 0)).toBeNull()
    expect(t.key(k(' '), b, 0)).toBe(false)
    expect(t.key(k('d', { ctrlKey: true }), b, 0)).toBe(false)
    expect(t.key(k('ArrowDown'), b, 0)).toBe(false)
    t.stop()
  })
})

describe('menuNav · M1 (puntero)', () => {
  it('moved: táctil y puntero quieto no cuentan; devuelve el punto anterior', () => {
    const p = createPointer()
    const ev = (x, y, pointerType = 'mouse') => ({ clientX: x, clientY: y, pointerType })
    expect(p.moved(ev(1, 1, 'touch'))).toBe(false)
    expect(p.moved(ev(1, 1))).toBeNull()
    expect(p.moved(ev(1, 1))).toBe(false)
    expect(p.moved(ev(2, 1))).toEqual({ x: 1, y: 1 })
    p.at = null
    expect(p.moved(ev(2, 1))).toBeNull()
  })

  it('highlight: datos del resaltado, instantáneo la primera vez, sin activo quita has-highlight', () => {
    const b = list(['a', 'b'])
    const ul = b[0].closest('ul')
    const hl = createHighlight()
    hl(ul, b[1])
    expect(ul.classList.contains('has-highlight')).toBe(true)
    expect(ul.classList.contains('is-highlight-instant')).toBe(true)
    expect(ul.style.getPropertyValue('--_active-y')).toMatch(/px$/)
    expect(ul.style.getPropertyValue('--_active-h')).toMatch(/px$/)
    hl(ul, null)
    expect(ul.classList.contains('has-highlight')).toBe(false)
  })
})
