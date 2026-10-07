// Motor de GTooltip (utils/tooltip.js) · design/contracts/tooltip.md §«Comportamiento», §«Táctil», §«El viaje y el grupo»,
// §«Segunda etapa» (#384 a #389) y §«Caja visible» (#395). jsdom no tiene popover: showPopover/hidePopover se simulan con un atributo.
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest'
import { attach, firstElement, nameOf, resolveBox, resolveKind, resolveTarget, readTime, _state, OPEN, CLOSE, SKIP, DWELL, LONG, LINGER, READ_MAX } from './tooltip.js'
import { _track } from './keyFocus.js'

beforeAll(() => {
  HTMLElement.prototype.showPopover = function () { this.setAttribute('data-test-open', '') }
  HTMLElement.prototype.hidePopover = function () { this.removeAttribute('data-test-open') }
})
const live = []
afterEach(() => {
  while (live.length) live.pop().destroy()
  _state.lastHide = -Infinity
  _state.navAt = -Infinity
  document.body.innerHTML = ''
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const ev = (type, init = {}) => {
  const e = new MouseEvent(type, { bubbles: !/enter|leave/.test(type), cancelable: true, clientX: 0, clientY: 0, button: 0, ...init })
  Object.defineProperty(e, 'pointerType', { value: init.pointerType || 'mouse' })
  return e
}
const key = (k, target = document.activeElement || document.body) => {
  const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true })
  target.dispatchEvent(e)
  return e
}
/** Un control con su nodo hermano dentro de `parent` */
function make(parent = document.body, { label = '', opt = {}, tag = 'button' } = {}) {
  const ctrl = document.createElement(tag)
  if (label) ctrl.textContent = label
  const node = document.createElement('div')
  node.className = 'g-tooltip'
  node.setAttribute('role', 'tooltip')
  parent.append(ctrl, node)
  const inst = attach(ctrl, node, opt)
  live.push(inst)
  return { ctrl, node, inst }
}
const isOpen = (node) => node.hasAttribute('data-test-open')

describe('tiempos y lectura', () => {
  it('constantes del contrato y tiempo de lectura min(6000, max(1500, 1000 + 50 × caracteres))', () => {
    expect([OPEN, CLOSE, SKIP, DWELL, LONG, LINGER, READ_MAX]).toEqual([350, 100, 600, 700, 500, 1500, 6000])
    expect(readTime(5)).toBe(1500)
    expect(readTime(60)).toBe(4000)
    expect(readTime(500)).toBe(6000)
  })
})

describe('nombre y elemento resuelto', () => {
  it('nameOf: aria-labelledby ajeno, aria-label, labels, contenido sin aria-hidden ni el propio tooltip', () => {
    document.body.innerHTML = '<span id="l">Guardar</span><button id="a" aria-labelledby="l own"></button><button id="b" aria-label="Copiar"></button><label for="c">Correo</label><input id="c"><button id="d">Hola <svg aria-hidden="true"><text>x</text></svg><span role="tooltip">Nope</span></button><button id="e" aria-labelledby="own"></button>'
    const $ = (id) => document.getElementById(id)
    expect(nameOf($('a'), ['own']).trim()).toBe('Guardar')
    expect(nameOf($('b'))).toBe('Copiar')
    expect(nameOf($('c')).trim()).toBe('Correo')
    expect(nameOf($('d')).replace(/\s+/g, ' ').trim()).toBe('Hola')
    expect(nameOf($('e'), ['own']).trim()).toBe('')
  })
  it('resolveKind: sin nombre o mismo texto → label; otro → description', () => {
    document.body.innerHTML = '<button id="a"></button><button id="b" aria-label=" duplicar "></button><button id="c">Publicar</button>'
    expect(resolveKind(document.getElementById('a'), 'Duplicar', [])).toBe('label')
    expect(resolveKind(document.getElementById('b'), 'Duplicar', [])).toBe('label')
    expect(resolveKind(document.getElementById('c'), 'Visible para todos', [])).toBe('description')
  })
  it('resolveTarget: primer elemento de un fragmento y su primer enfocable (también tabindex="-1")', () => {
    document.body.innerHTML = '<div id="w"><span class="box"><span>×</span><input id="i"></span></div><div id="t"><span tabindex="-1" id="s">x</span></div><div id="n"><span>texto</span></div>'
    const w = document.getElementById('w')
    const anchor = document.createTextNode('')
    w.prepend(anchor)
    expect(resolveTarget(anchor, null).id).toBe('i')
    expect(resolveTarget(document.getElementById('t').firstChild, null).id).toBe('s')
    expect(resolveTarget(document.getElementById('n').firstChild, null)).toBe(null)
  })
})

describe('resolveTarget con referencias propias (#399)', () => {
  it('el enfocable con data-g-tooltip de este tooltip gana al primer enfocable; un tooltip anidado ajeno no cuenta', () => {
    document.body.innerHTML = '<div id="w"><div class="f"><button id="rm">x</button><button id="rm2">x</button><span class="add"><input id="in" data-g-tooltip aria-describedby="a-name"></span></div></div>'
    const w = document.getElementById('w')
    const anchor = document.createTextNode('')
    w.prepend(anchor)
    expect(resolveTarget(anchor, null).id).toBe('in') // sin ids: cualquier data-g-tooltip
    expect(resolveTarget(anchor, null, ['a-name']).id).toBe('in')
    expect(resolveTarget(anchor, null, ['a', 'a-name', 'a-detail']).id).toBe('in')
    // Marca de otro tooltip (anidado): no es la de este
    expect(resolveTarget(anchor, null, ['b-name']).id).toBe('rm')
    // La marca en el propio elemento raíz del hijo y enfocable
    document.body.innerHTML = '<div id="w2"><button id="b" data-g-tooltip aria-labelledby="c-name"></button></div>'
    const a2 = document.createTextNode('')
    document.getElementById('w2').prepend(a2)
    expect(resolveTarget(a2, null, ['c-name']).id).toBe('b')
    // Una marca en un elemento no enfocable no cuenta
    document.body.innerHTML = '<div id="w3"><div class="box" data-g-tooltip aria-labelledby="d-name"><input id="i3"></div></div>'
    const a3 = document.createTextNode('')
    document.getElementById('w3').prepend(a3)
    expect(resolveTarget(a3, null, ['d-name']).id).toBe('i3')
  })
})

describe('abrir y cerrar con el puntero', () => {
  it('nada a los 200 ms, abierto a los 350; cierra a los 100 ms de salir', () => {
    vi.useFakeTimers()
    const { ctrl, node } = make()
    ctrl.dispatchEvent(ev('pointerenter'))
    vi.advanceTimersByTime(200)
    expect(isOpen(node)).toBe(false)
    vi.advanceTimersByTime(150)
    expect(isOpen(node)).toBe(true)
    expect(node.getAttribute('data-side')).toBe('bottom')
    expect(node.hasAttribute('data-instant')).toBe(false)
    ctrl.dispatchEvent(ev('pointerleave'))
    vi.advanceTimersByTime(99)
    expect(isOpen(node)).toBe(true)
    vi.advanceTimersByTime(1)
    expect(isOpen(node)).toBe(false)
  })
  it('el puntero que cruza a la etiqueta la mantiene (1.4.13); al salir de ella cierra a los 100 ms', () => {
    vi.useFakeTimers()
    const { ctrl, node } = make()
    ctrl.dispatchEvent(ev('pointerenter'))
    vi.advanceTimersByTime(OPEN)
    ctrl.dispatchEvent(ev('pointerleave', { relatedTarget: node }))
    node.dispatchEvent(ev('pointerenter'))
    vi.advanceTimersByTime(1000)
    expect(isOpen(node)).toBe(true)
    node.dispatchEvent(ev('pointerleave', { relatedTarget: document.body }))
    vi.advanceTimersByTime(CLOSE)
    expect(isOpen(node)).toBe(false)
  })
  it('sin cierre por tiempo mientras dura el puntero', () => {
    vi.useFakeTimers()
    const { ctrl, node } = make()
    ctrl.dispatchEvent(ev('pointerenter'))
    vi.advanceTimersByTime(60_000)
    expect(isOpen(node)).toBe(true)
  })
  it('SKIP: cerrado hace menos de 600 ms, el siguiente abre al instante y sin entrada (data-instant)', () => {
    vi.useFakeTimers()
    const a = make(document.body.appendChild(document.createElement('div')))
    const b = make(document.body.appendChild(document.createElement('div')))
    a.ctrl.dispatchEvent(ev('pointerenter'))
    vi.advanceTimersByTime(OPEN)
    a.ctrl.dispatchEvent(ev('pointerleave'))
    vi.advanceTimersByTime(CLOSE + 100)
    expect(isOpen(a.node)).toBe(false)
    b.ctrl.dispatchEvent(ev('pointerenter'))
    expect(isOpen(b.node)).toBe(true)
    expect(b.node.hasAttribute('data-instant')).toBe(true)
    b.ctrl.dispatchEvent(ev('pointerleave'))
    vi.advanceTimersByTime(CLOSE + SKIP + 10)
    a.ctrl.dispatchEvent(ev('pointerenter'))
    expect(isOpen(a.node)).toBe(false)
  })
  it('uno solo abierto: el relevo cierra al anterior sin salida', () => {
    vi.useFakeTimers()
    const a = make(document.body.appendChild(document.createElement('div')))
    const b = make(document.body.appendChild(document.createElement('div')))
    a.ctrl.dispatchEvent(ev('pointerenter'))
    vi.advanceTimersByTime(OPEN)
    a.ctrl.dispatchEvent(ev('pointerleave'))
    b.ctrl.dispatchEvent(ev('pointerenter'))
    expect(isOpen(b.node)).toBe(true)
    expect(isOpen(a.node)).toBe(false)
    expect(a.node.hasAttribute('data-instant')).toBe(true)
    expect(_state.current.node).toBe(b.node)
  })
  it('pulsar cierra y suprime hasta salir y volver; tocar fuera cierra', () => {
    vi.useFakeTimers()
    const { ctrl, node } = make()
    ctrl.dispatchEvent(ev('pointerenter'))
    vi.advanceTimersByTime(OPEN)
    ctrl.dispatchEvent(ev('pointerdown'))
    expect(isOpen(node)).toBe(false)
    ctrl.dispatchEvent(ev('pointermove'))
    vi.advanceTimersByTime(2000)
    expect(isOpen(node)).toBe(false)
    ctrl.dispatchEvent(ev('pointerleave'))
    vi.advanceTimersByTime(SKIP + 10)
    ctrl.dispatchEvent(ev('pointerenter'))
    vi.advanceTimersByTime(OPEN)
    expect(isOpen(node)).toBe(true)
    document.body.dispatchEvent(ev('pointerdown'))
    expect(isOpen(node)).toBe(false)
  })
  it('aria-expanded="true" no abre y cierra con check(); disabled nativo no abre; aria-disabled sí', () => {
    vi.useFakeTimers()
    const a = make()
    a.ctrl.setAttribute('aria-expanded', 'true')
    a.ctrl.dispatchEvent(ev('pointerenter'))
    vi.advanceTimersByTime(OPEN)
    expect(isOpen(a.node)).toBe(false)
    a.ctrl.setAttribute('aria-expanded', 'false')
    a.ctrl.dispatchEvent(ev('pointerleave'))
    a.ctrl.dispatchEvent(ev('pointerenter'))
    vi.advanceTimersByTime(OPEN)
    expect(isOpen(a.node)).toBe(true)
    a.ctrl.setAttribute('aria-expanded', 'true')
    a.inst.check()
    expect(isOpen(a.node)).toBe(false)

    const b = make()
    b.ctrl.disabled = true
    b.ctrl.dispatchEvent(ev('pointerenter'))
    vi.advanceTimersByTime(OPEN + SKIP)
    expect(isOpen(b.node)).toBe(false)

    const c = make()
    c.ctrl.setAttribute('aria-disabled', 'true')
    c.ctrl.dispatchEvent(ev('pointerenter'))
    vi.advanceTimersByTime(OPEN)
    expect(isOpen(c.node)).toBe(true)
  })
  it('opción disabled(): no abre', () => {
    vi.useFakeTimers()
    const { ctrl, node } = make(document.body, { opt: { disabled: () => true } })
    ctrl.dispatchEvent(ev('pointerenter'))
    vi.advanceTimersByTime(OPEN)
    expect(isOpen(node)).toBe(false)
  })
})

describe('foco y Esc', () => {
  it('foco por navegación (tecla + :focus-visible) abre al instante; foco por programa no', () => {
    const a = make()
    const b = make()
    a.ctrl.focus()
    expect(isOpen(a.node)).toBe(false)
    a.ctrl.blur()
    key('Tab', document.body)
    b.ctrl.focus()
    expect(isOpen(b.node)).toBe(true)
  })
  it('radio al que llevan las flechas sin :focus-visible (WebKit, #435): abre; con Tab sin :focus-visible, no', () => {
    const { ctrl, node } = make(document.body, { tag: 'input' })
    ctrl.type = 'radio'
    const orig = HTMLElement.prototype.matches
    vi.spyOn(HTMLElement.prototype, 'matches').mockImplementation(function (sel) { return sel === ':focus-visible' ? false : orig.call(this, sel) })
    key('Tab', document.body)
    ctrl.focus()
    expect(isOpen(node)).toBe(false)
    ctrl.blur()
    key('ArrowRight', document.body)
    ctrl.focus()
    expect(isOpen(node)).toBe(true)
    const b = make()
    ctrl.blur()
    key('ArrowDown', document.body)
    b.ctrl.focus()
    expect(isOpen(b.node)).toBe(false)
  })
  it('Intro tras Tab (un diálogo que se abre y enfoca su primer control) no cuenta como navegación; Mayús+Tab sí', () => {
    const a = make()
    const b = make()
    key('Tab', document.body)
    key('Enter', document.body)
    a.ctrl.focus()
    expect(isOpen(a.node)).toBe(false)
    a.ctrl.blur()
    key('Shift', document.body)
    key('Tab', document.body)
    b.ctrl.focus()
    expect(isOpen(b.node)).toBe(true)
  })
  it('un puntero después de la tecla anula la navegación', () => {
    const a = make()
    key('Tab', document.body)
    document.body.dispatchEvent(ev('pointerdown'))
    a.ctrl.focus()
    expect(isOpen(a.node)).toBe(false)
  })
  it('perder el foco cierra (en el ciclo siguiente, para el relevo)', async () => {
    vi.useFakeTimers()
    const a = make()
    key('Tab', document.body)
    a.ctrl.focus()
    expect(isOpen(a.node)).toBe(true)
    a.ctrl.blur()
    vi.advanceTimersByTime(1)
    expect(isOpen(a.node)).toBe(false)
  })
  it('Tab al siguiente: el relevo llega antes del cierre del saliente (uno solo abierto)', () => {
    const g = document.body.appendChild(document.createElement('div'))
    g.setAttribute('role', 'toolbar')
    const a = make(g)
    const b = make(g)
    key('Tab', document.body)
    a.ctrl.focus()
    key('ArrowRight', a.ctrl)
    b.ctrl.focus()
    expect(isOpen(b.node)).toBe(true)
    expect(isOpen(a.node)).toBe(false)
  })
  it('Esc: cierra sin mover el foco, preventDefault sin detener la propagación; no vuelve hasta perder el foco', () => {
    const { ctrl, node } = make()
    key('Tab', document.body)
    ctrl.focus()
    const seen = vi.fn()
    document.body.addEventListener('keydown', seen)
    const e = key('Escape', ctrl)
    expect(e.defaultPrevented).toBe(true)
    expect(seen).toHaveBeenCalledTimes(1)
    expect(isOpen(node)).toBe(false)
    expect(document.activeElement).toBe(ctrl)
    ctrl.dispatchEvent(ev('pointerenter'))
    expect(isOpen(node)).toBe(false)
    // Sin tooltip abierto, Esc no se toca
    const e2 = key('Escape', ctrl)
    expect(e2.defaultPrevented).toBe(false)
    document.body.removeEventListener('keydown', seen)
  })
})

describe('segunda etapa (detail)', () => {
  it('crece tras 700 ms quieto; cualquier movimiento reinicia la cuenta; sin detail no crece', () => {
    vi.useFakeTimers()
    const d = make(document.body, { opt: { detail: () => true } })
    d.ctrl.dispatchEvent(ev('pointerenter'))
    vi.advanceTimersByTime(OPEN + 600)
    d.ctrl.dispatchEvent(ev('pointermove'))
    vi.advanceTimersByTime(600)
    expect(d.node.hasAttribute('data-dwell')).toBe(false)
    vi.advanceTimersByTime(100)
    expect(d.node.hasAttribute('data-dwell')).toBe(true)

    const n = make()
    n.ctrl.dispatchEvent(ev('pointerenter'))
    vi.advanceTimersByTime(OPEN + DWELL * 2)
    expect(n.node.hasAttribute('data-dwell')).toBe(false)
  })
  it('foco mantenido también abre la segunda etapa', () => {
    vi.useFakeTimers()
    const d = make(document.body, { opt: { detail: () => true } })
    key('Tab', document.body)
    d.ctrl.focus()
    vi.advanceTimersByTime(DWELL)
    expect(d.node.hasAttribute('data-dwell')).toBe(true)
  })
})

describe('viaje (#388)', () => {
  const box = (w) => ({ x: 0, y: 0, left: 0, top: 0, right: w, bottom: 20, width: w, height: 20 })
  it('mismo grupo y mismo lado: data-travel con la geometría final; luego se retira con inline-size', () => {
    vi.useFakeTimers()
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () { return box(this.classList.contains('g-tooltip') ? 80 : 28) })
    const g = document.body.appendChild(document.createElement('div'))
    g.setAttribute('role', 'toolbar')
    const a = make(g)
    const b = make(g)
    a.ctrl.dispatchEvent(ev('pointerenter'))
    vi.advanceTimersByTime(OPEN)
    a.ctrl.dispatchEvent(ev('pointerleave'))
    b.ctrl.dispatchEvent(ev('pointerenter'))
    expect(b.node.hasAttribute('data-travel')).toBe(true)
    expect(b.node.hasAttribute('data-instant')).toBe(false)
    expect(b.node.style.inlineSize).toBe('80px')
    expect(isOpen(a.node)).toBe(false)
    vi.advanceTimersByTime(200)
    expect(b.node.hasAttribute('data-travel')).toBe(false)
    expect(b.node.style.inlineSize).toBe('')
  })
  it('grupos distintos: sin viaje, aparece al instante', () => {
    vi.useFakeTimers()
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () { return box(this.classList.contains('g-tooltip') ? 80 : 28) })
    const a = make(document.body.appendChild(document.createElement('div')))
    const b = make(document.body.appendChild(document.createElement('div')))
    a.ctrl.dispatchEvent(ev('pointerenter'))
    vi.advanceTimersByTime(OPEN)
    b.ctrl.dispatchEvent(ev('pointerenter'))
    expect(b.node.hasAttribute('data-travel')).toBe(false)
    expect(b.node.hasAttribute('data-instant')).toBe(true)
  })
  it('mismo grupo pero el entrante voltea de lado: no viaja (aparece en su sitio)', () => {
    vi.useFakeTimers()
    const g = document.body.appendChild(document.createElement('div'))
    g.setAttribute('role', 'toolbar')
    const a = make(g)
    const b = make(g)
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
      if (this.classList.contains('g-tooltip')) return box(80)
      const top = this === b.ctrl ? window.innerHeight - 30 : 100
      return { x: 0, y: top, left: 0, top, right: 28, bottom: top + 20, width: 28, height: 20 }
    })
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function () { return this.classList.contains('g-tooltip') ? 30 : 0 })
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function () { return this.classList.contains('g-tooltip') ? 80 : 0 })
    a.ctrl.dispatchEvent(ev('pointerenter'))
    vi.advanceTimersByTime(OPEN)
    expect(a.node.getAttribute('data-side')).toBe('bottom')
    b.ctrl.dispatchEvent(ev('pointerenter'))
    expect(b.node.getAttribute('data-side')).toBe('top')
    expect(b.node.hasAttribute('data-travel')).toBe(false)
    expect(b.node.hasAttribute('data-instant')).toBe(true)
  })
  it('regla 1 estricta: al desplazar se conserva el lado aunque ya no quepa', async () => {
    vi.useFakeTimers()
    let top = 100
    const a = make()
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
      if (this.classList.contains('g-tooltip')) return box(80)
      return { x: 0, y: top, left: 0, top, right: 28, bottom: top + 20, width: 28, height: 20 }
    })
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function () { return this.classList.contains('g-tooltip') ? 30 : 0 })
    a.ctrl.dispatchEvent(ev('pointerenter'))
    vi.advanceTimersByTime(OPEN)
    expect(a.node.getAttribute('data-side')).toBe('bottom')
    top = window.innerHeight - 40
    window.dispatchEvent(new Event('scroll'))
    vi.advanceTimersByTime(20)
    expect(a.node.getAttribute('data-side')).toBe('bottom')
    expect(isOpen(a.node)).toBe(true)
    top = window.innerHeight + 50
    window.dispatchEvent(new Event('scroll'))
    vi.advanceTimersByTime(20)
    expect(isOpen(a.node)).toBe(false)
  })
  it('grupo vertical: el lado por defecto es «right»', () => {
    vi.useFakeTimers()
    const g = document.body.appendChild(document.createElement('nav'))
    g.setAttribute('aria-orientation', 'vertical')
    const a = make(g)
    a.ctrl.dispatchEvent(ev('pointerenter'))
    vi.advanceTimersByTime(OPEN)
    expect(a.node.getAttribute('data-side')).toBe('right')
  })
})

describe('táctil (#385)', () => {
  it('pulsación larga muestra entero (data-touch, data-dwell con detail), soltar no activa, se lee y se va', () => {
    vi.useFakeTimers()
    const click = vi.fn()
    const { ctrl, node } = make(document.body, { opt: { detail: () => true, chars: () => 60 } })
    ctrl.addEventListener('click', click)
    ctrl.dispatchEvent(ev('pointerdown', { pointerType: 'touch' }))
    vi.advanceTimersByTime(LONG - 1)
    expect(isOpen(node)).toBe(false)
    vi.advanceTimersByTime(1)
    expect(isOpen(node)).toBe(true)
    expect(node.hasAttribute('data-touch')).toBe(true)
    expect(node.hasAttribute('data-dwell')).toBe(true)
    ctrl.dispatchEvent(ev('pointerup', { pointerType: 'touch' }))
    ctrl.dispatchEvent(ev('click'))
    expect(click).not.toHaveBeenCalled()
    vi.advanceTimersByTime(readTime(60) - 1)
    expect(isOpen(node)).toBe(true)
    vi.advanceTimersByTime(1)
    expect(isOpen(node)).toBe(false)
  })
  it('un toque normal activa y no muestra; mover más de 10 px cancela', () => {
    vi.useFakeTimers()
    const click = vi.fn()
    const { ctrl, node } = make()
    ctrl.addEventListener('click', click)
    ctrl.dispatchEvent(ev('pointerdown', { pointerType: 'touch' }))
    vi.advanceTimersByTime(100)
    ctrl.dispatchEvent(ev('pointerup', { pointerType: 'touch' }))
    ctrl.dispatchEvent(ev('click'))
    expect(click).toHaveBeenCalledTimes(1)
    expect(isOpen(node)).toBe(false)
    ctrl.dispatchEvent(ev('pointerdown', { pointerType: 'touch' }))
    ctrl.dispatchEvent(ev('pointermove', { pointerType: 'touch', clientX: 11 }))
    vi.advanceTimersByTime(LONG * 2)
    expect(isOpen(node)).toBe(false)
  })
  it('el puntero táctil no abre por hover', () => {
    vi.useFakeTimers()
    const { ctrl, node } = make()
    ctrl.dispatchEvent(ev('pointerenter', { pointerType: 'touch' }))
    vi.advanceTimersByTime(OPEN * 2)
    expect(isOpen(node)).toBe(false)
  })
})

// Caja visible (#395): el ancla es la caja marcada con data-g-tooltip-box; foco y ARIA siguen en el elemento resuelto
/** Una caja `[data-g-tooltip-box]` con prefijo, el campo (ctrl), un botón propio y, si se pide, un control ajeno con su
 * propio tooltip; el nodo del campo va detrás de la raíz */
function makeBox({ foreignCtl = false } = {}) {
  document.body.insertAdjacentHTML('beforeend', `<div class="root"><div class="box" data-g-tooltip-box><span class="pre" aria-hidden="true">$</span><input class="ctrl"><button type="button" class="own">Mostrar</button>${foreignCtl ? '<button type="button" class="inner" data-g-tooltip></button><div class="g-tooltip inner-node"><span class="in">x</span></div>' : ''}</div></div>`)
  const root = document.body.lastElementChild
  const node = document.createElement('div')
  node.className = 'g-tooltip'
  root.after(node)
  const box = root.querySelector('.box')
  const ctrl = root.querySelector('.ctrl')
  const inst = attach(ctrl, node, { box })
  live.push(inst)
  return { root, box, ctrl, node, inst, $: (s) => root.querySelector(s) }
}
const rect = (map) => vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
  const r = map(this) || { left: 0, top: 0, width: 0, height: 0 }
  return { ...r, x: r.left, y: r.top, right: r.left + r.width, bottom: r.top + r.height, toJSON() {} }
})
/** pointerover en el elemento (con burbuja) y, si entra en la caja desde fuera, pointerenter en la caja */
const over = (el, box, fromOutside = false) => {
  el.dispatchEvent(ev('pointerover', { bubbles: true }))
  if (fromOutside) box.dispatchEvent(ev('pointerenter'))
}

describe('caja visible (#395)', () => {
  it('resolveBox: la caja marcada más cercana dentro del hijo; la marca fuera del hijo se ignora; sin marca, el propio', () => {
    document.body.innerHTML = '<div data-g-tooltip-box id="out"><div id="first"><div data-g-tooltip-box id="box"><input id="i"></div></div></div><button id="b" data-g-tooltip-box></button><div data-g-tooltip-box id="o2"><button id="c"></button></div>'
    const $ = (id) => document.getElementById(id)
    expect(resolveBox($('i'), $('first')).id).toBe('box')
    // La caja es el primer elemento del hijo
    expect(resolveBox($('i'), $('box')).id).toBe('box')
    // El propio elemento resuelto marcado
    expect(resolveBox($('b'), $('b')).id).toBe('b')
    // Marca en un ancestro fuera del hijo: el elemento resuelto
    expect(resolveBox($('c'), $('c')).id).toBe('c')
    expect(resolveBox(null, null)).toBe(null)
    const w = $('first')
    const t = document.createTextNode('')
    w.prepend(t)
    expect(firstElement(t, null).id).toBe('box')
  })
  it('posición, pestaña y puntero en la caja; ARIA y foco en el elemento resuelto', () => {
    vi.useFakeTimers()
    rect((el) => (el.matches('.box') ? { left: 100, top: 50, width: 240, height: 40 } : el.matches('.ctrl') ? { left: 113, top: 55, width: 180, height: 30 } : null))
    const { box, ctrl, node, $ } = makeBox()
    // Puntero sobre el prefijo (fuera del <input>): abre el del campo
    over($('.pre'), box, true)
    vi.advanceTimersByTime(OPEN)
    expect(isOpen(node)).toBe(true)
    expect(node.style.getPropertyValue('--_tooltip-aw')).toBe('240px')
    expect(node.style.getPropertyValue('--_tooltip-ah')).toBe('40px')
    // Pasar del prefijo al botón propio de la caja sigue siendo la caja: no cierra
    over($('.own'), box)
    vi.advanceTimersByTime(CLOSE * 2)
    expect(isOpen(node)).toBe(true)
    // Pulsar en la caja (fuera del <input>) es usar: cierra; pulsar fuera de la caja también cuenta como fuera
    $('.pre').dispatchEvent(ev('pointerdown'))
    expect(isOpen(node)).toBe(false)
    box.dispatchEvent(ev('pointerleave'))
    // El foco del botón propio no abre (el foco escucha en el elemento resuelto); el del campo sí
    key('Tab', document.body)
    $('.own').focus()
    expect(isOpen(node)).toBe(false)
    key('Tab', document.body)
    ctrl.focus()
    expect(isOpen(node)).toBe(true)
  })
  it('pulsar fuera: dentro de la caja no es fuera (lo trata la caja); fuera de ella cierra', () => {
    vi.useFakeTimers()
    const { box, ctrl, node, $ } = makeBox()
    key('Tab', document.body)
    ctrl.focus()
    expect(isOpen(node)).toBe(true)
    document.body.dispatchEvent(ev('pointerdown'))
    expect(isOpen(node)).toBe(false)
  })
  it('el más interno gana el puntero: un control ajeno con su tooltip dentro de la caja no abre ni mantiene el exterior', () => {
    vi.useFakeTimers()
    const { box, node, $ } = makeBox({ foreignCtl: true })
    // Entra directamente sobre el ajeno: no abre
    over($('.inner'), box, true)
    vi.advanceTimersByTime(OPEN * 2)
    expect(isOpen(node)).toBe(false)
    // Del ajeno al prefijo: ahora sí (la caja)
    over($('.pre'), box)
    vi.advanceTimersByTime(OPEN)
    expect(isOpen(node)).toBe(true)
    // Al ajeno (o a su nodo): no lo mantiene
    over($('.in'), box)
    vi.advanceTimersByTime(CLOSE)
    expect(isOpen(node)).toBe(false)
    // Movimiento y pulsación sobre el ajeno no cuentan
    $('.inner').dispatchEvent(ev('pointerdown'))
    expect(_state.blockClick).toBe(null)
  })
  it('táctil: la pulsación larga en la caja muestra el del campo y bloquea el clic en la caja', () => {
    vi.useFakeTimers()
    const { box, node, $ } = makeBox()
    $('.pre').dispatchEvent(ev('pointerdown', { pointerType: 'touch', bubbles: true }))
    vi.advanceTimersByTime(LONG)
    expect(isOpen(node)).toBe(true)
    expect(_state.blockClick).toBe(box)
    const click = new MouseEvent('click', { bubbles: true, cancelable: true })
    $('.own').dispatchEvent(click)
    expect(click.defaultPrevented).toBe(true)
  })
  it('opt.box que no contiene al elemento resuelto: se ignora (ancla = elemento)', () => {
    vi.useFakeTimers()
    document.body.innerHTML = '<div class="other" data-g-tooltip-box></div><button class="c"></button><div class="g-tooltip"></div>'
    const ctrl = document.querySelector('.c')
    const node = document.querySelector('.g-tooltip')
    const inst = attach(ctrl, node, { box: document.querySelector('.other') })
    live.push(inst)
    expect(inst.box).toBe(ctrl)
  })
})

describe('escuchas', () => {
  it('una sola escucha de documento, retirada con el último; destroy quita las del control', () => {
    const add = vi.spyOn(document, 'addEventListener')
    const a = make()
    const b = make()
    // Dos keydown en total, no dos por instancia: la navegación (compartida, utils/keyFocus.js) y Esc del motor
    expect(add.mock.calls.filter(([t]) => t === 'keydown')).toHaveLength(2)
    expect(_state.count).toBe(2)
    expect(_track.count).toBe(1)
    live.splice(0).forEach((i) => i.destroy())
    expect(_state.count).toBe(0)
    expect(_state.ac).toBe(null)
    expect(_track.count).toBe(0)
    expect(_track.ac).toBe(null)
    // Tras destroy, el control ya no reacciona
    vi.useFakeTimers()
    a.ctrl.dispatchEvent(ev('pointerenter'))
    vi.advanceTimersByTime(OPEN)
    expect(isOpen(a.node)).toBe(false)
    expect(isOpen(b.node)).toBe(false)
  })
})
