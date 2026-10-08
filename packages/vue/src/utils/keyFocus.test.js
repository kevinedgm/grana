// utils/keyFocus.js: navegación por teclado compartida y data-g-key-focus (auditoría de la pista, hallazgo 1)
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { ATTR, acquire, fromKeyboard, fromNavKey, markKey, modality, nav, onKeyBlur, onKeyFocus, useKeyFocus, _track } from './keyFocus.js'

const releases = []
const take = () => { const r = acquire(); releases.push(r); return r }
const key = (k, target = document.body) => target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))
const pointer = (target = document.body) => target.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true }))
const radio = () => {
  const el = document.createElement('input')
  el.type = 'radio'
  el.addEventListener('focus', onKeyFocus)
  el.addEventListener('blur', onKeyBlur)
  document.body.append(el)
  return el
}

afterEach(() => {
  releases.splice(0).forEach((r) => r())
  document.body.innerHTML = ''
  nav.at = -Infinity
  nav.key = ''
  modality.keyboard = false
  vi.restoreAllMocks()
})

describe('escucha de documento', () => {
  it('una sola escucha con recuento; liberar dos veces no descuenta de más', () => {
    const add = vi.spyOn(document, 'addEventListener')
    const a = take()
    take()
    expect(add.mock.calls.filter(([t]) => t === 'keydown')).toHaveLength(1)
    expect(add.mock.calls.filter(([t]) => t === 'pointerdown')).toHaveLength(1)
    expect(_track.count).toBe(2)
    a()
    a()
    expect(_track.count).toBe(1)
    releases.splice(0).forEach((r) => r())
    expect(_track.count).toBe(0)
    expect(_track.ac).toBe(null)
  })

  it('tecla de navegación → activa; otra tecla o puntero la anulan; los modificadores no cuentan', () => {
    take()
    for (const k of ['Tab', 'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown']) {
      nav.at = -Infinity
      key(k)
      expect(fromNavKey(), k).toBe(true)
      expect(nav.key).toBe(k)
    }
    key('Shift')
    expect(fromNavKey()).toBe(true)
    key('Enter')
    expect(fromNavKey()).toBe(false)
    key('Tab')
    key('a')
    expect(fromNavKey()).toBe(false)
    key('Tab')
    pointer()
    expect(fromNavKey()).toBe(false)
  })

  it('sin escucha instalada no hay estado (SSR y antes de montar)', () => {
    key('Tab')
    expect(fromNavKey()).toBe(false)
  })
})

describe('data-g-key-focus', () => {
  it('Tab y flecha lo ponen en el focus; blur lo quita', () => {
    take()
    const a = radio()
    const b = radio()
    key('Tab')
    a.focus()
    expect(a.hasAttribute(ATTR)).toBe(true)
    key('ArrowDown')
    b.focus()
    expect(a.hasAttribute(ATTR)).toBe(false)
    expect(b.hasAttribute(ATTR)).toBe(true)
    b.blur()
    expect(b.hasAttribute(ATTR)).toBe(false)
  })

  it('el foco tras un pointerdown (clic) no lo pone', () => {
    take()
    const a = radio()
    key('Tab')
    pointer(a)
    a.focus()
    expect(a.hasAttribute(ATTR)).toBe(false)
  })

  it('un pointerdown en cualquier parte lo quita del radio enfocado', () => {
    take()
    const a = radio()
    key('Tab')
    a.focus()
    expect(a.hasAttribute(ATTR)).toBe(true)
    pointer(document.body)
    expect(a.hasAttribute(ATTR)).toBe(false)
    expect(document.activeElement).toBe(a)
  })

  it('foco por programa: solo si la última entrada fue de teclado (regla de modalidad, #450: también Intro)', () => {
    take()
    const a = radio()
    a.focus()
    expect(a.hasAttribute(ATTR), 'sin entrada previa no marca').toBe(false)
    a.blur()
    key('Enter')
    a.focus()
    expect(a.hasAttribute(ATTR), 'Intro en el enlace de GErrorSummary marca (#450)').toBe(true)
    a.blur()
    key('a')
    a.focus()
    expect(a.hasAttribute(ATTR), 'una letra también').toBe(true)
    a.blur()
    pointer()
    a.focus()
    expect(a.hasAttribute(ATTR), 'tras un pointerdown no').toBe(false)
    a.blur()
    key('Tab')
    a.focus()
    expect(a.hasAttribute(ATTR)).toBe(true)
  })

  it('los modificadores no cambian la modalidad (Opción+Tab de WebKit, Mayús+Tab)', () => {
    take()
    const a = radio()
    pointer()
    for (const k of ['Shift', 'Alt', 'Control', 'Meta', 'AltGraph', 'CapsLock', 'Fn']) key(k)
    expect(fromKeyboard()).toBe(false)
    a.focus()
    expect(a.hasAttribute(ATTR)).toBe(false)
    a.blur()
    key('Tab')
    key('Shift')
    expect(fromKeyboard()).toBe(true)
  })

  it('sin escucha instalada no marca; liberar la última quita la marca', () => {
    const a = radio()
    nav.at = Date.now()
    a.focus()
    expect(a.hasAttribute(ATTR)).toBe(false)
    a.blur()
    const r = take()
    key('Tab')
    a.focus()
    expect(a.hasAttribute(ATTR)).toBe(true)
    r()
    expect(a.hasAttribute(ATTR)).toBe(false)
  })
})

describe('useKeyFocus', () => {
  it('instala al montar, libera al desmontar; con active() solo mientras sea verdadero', async () => {
    const on = ref(false)
    const A = defineComponent({ setup() { useKeyFocus(); return () => h('i') } })
    const B = defineComponent({ setup() { useKeyFocus(() => on.value); return () => h('i') } })
    const a = mount(A)
    expect(_track.count).toBe(1)
    const b = mount(B)
    expect(_track.count).toBe(1)
    on.value = true
    await nextTick()
    expect(_track.count).toBe(2)
    on.value = false
    await nextTick()
    expect(_track.count).toBe(1)
    on.value = true
    await nextTick()
    b.unmount()
    expect(_track.count).toBe(1)
    a.unmount()
    expect(_track.count).toBe(0)
  })
})

describe('dos señales (#450): la modalidad del anillo y la navegación del tooltip', () => {
  it('Intro, Espacio o una letra: modalidad de teclado SIN navegación (#396 sigue protegiendo Tab + Intro)', () => {
    take()
    key('Tab')
    expect(fromNavKey()).toBe(true)
    expect(fromKeyboard()).toBe(true)
    key('Enter')
    expect(fromNavKey(), 'la señal del tooltip se anula con Intro').toBe(false)
    expect(fromKeyboard(), 'la modalidad sigue en teclado').toBe(true)
    key(' ')
    expect(fromNavKey()).toBe(false)
    expect(fromKeyboard()).toBe(true)
    pointer()
    expect(fromNavKey()).toBe(false)
    expect(fromKeyboard()).toBe(false)
  })

  it('liberar la última escucha vuelve a «puntero»', () => {
    const r = take()
    key('a')
    expect(fromKeyboard()).toBe(true)
    r()
    expect(fromKeyboard()).toBe(false)
  })
})

describe('markKey (GSlider, #450)', () => {
  const slider = () => {
    const el = document.createElement('input')
    el.type = 'range'
    el.addEventListener('focus', onKeyFocus)
    el.addEventListener('blur', onKeyBlur)
    el.addEventListener('keydown', markKey)
    document.body.append(el)
    return el
  }
  it('tras un clic (sin marca), la primera tecla que no es modificador marca; los modificadores no', () => {
    take()
    const a = slider()
    pointer(a)
    a.focus()
    expect(a.hasAttribute(ATTR)).toBe(false)
    key('Shift', a)
    expect(a.hasAttribute(ATTR)).toBe(false)
    key('ArrowRight', a)
    expect(a.hasAttribute(ATTR)).toBe(true)
    pointer(document.body)
    expect(a.hasAttribute(ATTR), 'un pointerdown la quita').toBe(false)
    key('5', a)
    expect(a.hasAttribute(ATTR), 'una cifra (teclear la cifra) también marca').toBe(true)
    a.blur()
    expect(a.hasAttribute(ATTR)).toBe(false)
  })

  it('marca uno solo: marcar otro control quita la marca del anterior', () => {
    take()
    const a = slider()
    const b = slider()
    a.focus()
    key('ArrowUp', a)
    expect(a.hasAttribute(ATTR)).toBe(true)
    key('ArrowUp', b)
    expect(a.hasAttribute(ATTR)).toBe(false)
    expect(b.hasAttribute(ATTR)).toBe(true)
  })

  it('sin escucha instalada no marca', () => {
    const a = slider()
    key('ArrowUp', a)
    expect(a.hasAttribute(ATTR)).toBe(false)
  })
})
