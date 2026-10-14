// utils/landing.js: la llegada (data-g-landed, #589) y el foco de los niveles (base 2, 3, 4 y 7 de dialog.md).
import { describe, it, expect, vi, afterEach } from 'vitest'
import { LANDED, LANDED_MS, firstFocusable, focusChain, land, landingBox, resolveFrom, resolveTarget, usable } from './landing.js'

afterEach(() => { vi.useRealTimers(); document.body.innerHTML = '' })

const html = (s) => { document.body.innerHTML = s }
const animEnd = (el, name, type = 'animationend') => {
  const e = new Event(type, { bubbles: true })
  e.animationName = name
  el.dispatchEvent(e)
}

describe('land', () => {
  it('marca la caja visible (ancestro con data-g-tooltip-box) o el propio destino; acepta id o elemento', () => {
    html('<div class="g-input"><div id="box" data-g-tooltip-box><input id="i"></div></div><button id="b">x</button>')
    expect(landingBox(document.getElementById('i')).id).toBe('box')
    expect(land('i').id).toBe('box')
    expect(document.getElementById('box').hasAttribute(LANDED)).toBe(true)
    expect(land(document.getElementById('b')).id).toBe('b')
    expect(document.getElementById('b').getAttribute(LANDED)).toBe('')
    expect(land('nada')).toBeNull()
  })

  it('se quita con animationend/animationcancel de g-landed* (no con otra animación) y con el respaldo de 1000 ms', () => {
    vi.useFakeTimers()
    html('<button id="a"></button><button id="b"></button><button id="c"></button>')
    const a = land('a')
    animEnd(a, 'g-reject-shake')
    expect(a.hasAttribute(LANDED)).toBe(true)
    animEnd(a, 'g-landed-ring')
    expect(a.hasAttribute(LANDED)).toBe(false)
    const b = land('b')
    animEnd(b, 'g-landed', 'animationcancel')
    expect(b.hasAttribute(LANDED)).toBe(false)
    const c = land('c')
    vi.advanceTimersByTime(LANDED_MS - 1)
    expect(c.hasAttribute(LANDED)).toBe(true)
    vi.advanceTimersByTime(1)
    expect(c.hasAttribute(LANDED)).toBe(false)
  })

  it('otra llegada a la misma caja reinicia la marca (un cuadro sin ella) y el respaldo', () => {
    vi.useFakeTimers()
    html('<button id="a"></button>')
    const a = land('a')
    vi.advanceTimersByTime(900)
    land('a')
    expect(a.hasAttribute(LANDED)).toBe(false) // se vuelve a poner en el cuadro siguiente
    vi.advanceTimersByTime(20)
    expect(a.hasAttribute(LANDED)).toBe(true)
    vi.advanceTimersByTime(900)
    expect(a.hasAttribute(LANDED)).toBe(true)
    vi.advanceTimersByTime(100)
    expect(a.hasAttribute(LANDED)).toBe(false)
  })
})

describe('foco de los niveles', () => {
  it('usable: deshabilitado, [inert], [hidden] y tabindex negativo no cuentan', () => {
    html('<button id="a"></button><button id="b" disabled></button><div inert><button id="c"></button></div><div hidden><button id="d"></button></div><button id="e" tabindex="-1"></button>')
    expect(['a', 'b', 'c', 'd', 'e'].map((id) => usable(document.getElementById(id)))).toEqual([true, false, false, false, false])
    expect(usable(null)).toBe(false)
  })

  it('firstFocusable: [autofocus] usable gana; si no, el primer control; skip lo excluye', () => {
    html('<section id="s"><button class="g-dialog__back" id="back"></button><input id="i"><input id="a" autofocus disabled><select id="sel" autofocus></select></section>')
    const s = document.getElementById('s')
    expect(firstFocusable(s).id).toBe('sel')
    document.getElementById('sel').removeAttribute('autofocus')
    expect(firstFocusable(s).id).toBe('back')
    expect(firstFocusable(s, '.g-dialog__back').id).toBe('i')
  })

  it('focusChain: el primero usable de la cadena; si ninguno, #292 en la raíz', () => {
    html('<button id="x" disabled></button><button id="y"></button><section id="s"><input id="i"></section>')
    expect(focusChain(['nada', 'x', 'y'], document.getElementById('s')).id).toBe('y')
    expect(document.activeElement.id).toBe('y')
    expect(focusChain([null, 'x'], document.getElementById('s')).id).toBe('i')
  })

  it('resolveTarget y resolveFrom: id, elemento, desconectado; sin from, el activo fuera del nivel (nunca body)', () => {
    html('<button id="t"></button><div id="lvl"><input id="in"></div>')
    expect(resolveTarget('t').id).toBe('t')
    expect(resolveTarget(document.createElement('button'))).toBeNull()
    const t = document.getElementById('t')
    t.focus()
    expect(resolveFrom(undefined, document.getElementById('lvl'))).toBe(t)
    document.getElementById('in').focus()
    expect(resolveFrom(undefined, document.getElementById('lvl'))).toBeNull()
    document.activeElement.blur()
    expect(resolveFrom(undefined, null)).toBeNull()
    expect(resolveFrom('t', null)).toBe(t)
  })
})
