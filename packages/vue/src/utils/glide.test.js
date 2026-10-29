import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// «Una sola luz» (#957 a #963): geometría y sesión del puntero con cajas simuladas en jsdom.
let frames
const flush = (n = 3) => { for (let i = 0; i < n; i++) { const f = frames.splice(0); f.forEach((fn) => fn()) } }
const ev = (type, init = {}) => Object.assign(new Event(type, { bubbles: type !== 'pointerleave' }), { pointerType: 'mouse', clientX: 0, clientY: 0, ...init })
const rect = (el, r) => { el.getBoundingClientRect = () => ({ left: r.x, top: r.y, width: r.w, height: r.h, right: r.x + r.w, bottom: r.y + r.h, x: r.x, y: r.y }) }

let glide
let nodeAt = () => document.body
// Un pointermove o pointerdown real sale del elemento bajo el puntero (y burbujea hasta el anfitrión)
const fire = (host, type, init = {}) => (nodeAt(init.clientX ?? 0, init.clientY ?? 0) || host).dispatchEvent(ev(type, init))
beforeEach(async () => {
  frames = []
  vi.stubGlobal('requestAnimationFrame', (f) => { frames.push(f); return frames.length })
  vi.stubGlobal('cancelAnimationFrame', () => {})
  glide = await import('./glide.js')
})
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); document.body.innerHTML = '' })

// Una lista: anfitrión en (100, 50) con filas de 40px; la 3 deshabilitada; elementFromPoint por la coordenada y
function list(n = 5) {
  const host = document.createElement('ul')
  rect(host, { x: 100, y: 50, w: 200, h: n * 40 })
  const layer = document.createElement('li')
  layer.className = 'layer'
  host.append(layer)
  const rows = []
  for (let i = 0; i < n; i++) {
    const li = document.createElement('li')
    const a = document.createElement('a')
    a.className = 'row'
    if (i === 3) a.setAttribute('aria-disabled', 'true')
    const span = document.createElement('span')
    a.append(span)
    li.append(a)
    host.append(li)
    rect(a, { x: 100, y: 50 + i * 40, w: 200, h: 40 })
    rows.push(a)
  }
  document.body.append(host)
  nodeAt = (x, y) => {
    if (x < 100 || x >= 300) return host
    const i = Math.floor((y - 50) / 40)
    return rows[i] ? rows[i].firstChild : host
  }
  document.elementFromPoint = vi.fn(nodeAt)
  return { host, rows }
}
const at = (i) => ({ clientX: 150, clientY: 50 + i * 40 + 20 })
const v = (host, k) => host.style.getPropertyValue(`--_highlight-${k}`)
// La sesión escribe las medidas en la capa, el primer hijo del anfitrión
const vl = (host, k) => host.firstElementChild.style.getPropertyValue(`--_highlight-${k}`)

describe('glide · placeHighlight', () => {
  it('escribe la caja en px físicos respecto de la caja de relleno más el scroll', () => {
    const { host, rows } = list()
    Object.defineProperty(host, 'clientLeft', { value: 2 })
    Object.defineProperty(host, 'clientTop', { value: 1 })
    host.scrollTop = 0
    Object.defineProperty(host, 'scrollTop', { value: 30, configurable: true })
    glide.placeHighlight(host, rows[2])
    expect(v(host, 'x')).toBe('-2px')
    expect(v(host, 'y')).toBe(`${80 - 1 + 30}px`)
    expect(v(host, 'w')).toBe('200px')
    expect(v(host, 'h')).toBe('40px')
    expect(host.classList.contains('has-highlight')).toBe(true)
  })
  it('primera colocación instantánea durante dos cuadros; la siguiente viaja; null apaga', () => {
    const { host, rows } = list()
    glide.placeHighlight(host, rows[0])
    expect(host.classList.contains('is-highlight-instant')).toBe(true)
    flush(2)
    expect(host.classList.contains('is-highlight-instant')).toBe(false)
    glide.placeHighlight(host, rows[1])
    expect(host.classList.contains('is-highlight-instant')).toBe(false)
    glide.placeHighlight(host, rows[1], { instant: true })
    expect(host.classList.contains('is-highlight-instant')).toBe(true)
    glide.placeHighlight(host, null)
    expect(host.classList.contains('has-highlight')).toBe(false)
  })
  it('con `layer`, las medidas van en la capa y las clases en el anfitrión (sin herencia por todo el árbol, #963)', () => {
    const { host, rows } = list()
    const layer = document.createElement('li')
    host.prepend(layer)
    glide.placeHighlight(host, rows[1], { layer })
    expect(layer.style.getPropertyValue('--_highlight-y')).toBe('40px')
    expect(v(host, 'y')).toBe('')
    expect(host.classList.contains('has-highlight')).toBe(true)
    expect(layer.classList.length).toBe(0)
  })
  it('escribe cada dato solo si cambia', () => {
    const { host, rows } = list()
    glide.placeHighlight(host, rows[1])
    const spy = vi.spyOn(host.style, 'setProperty')
    glide.placeHighlight(host, rows[1])
    expect(spy).not.toHaveBeenCalled()
  })
})

describe('glide · createPointerGlide (sesión del puntero, #958)', () => {
  const mk = (opts = {}) => {
    const l = list()
    const g = glide.createPointerGlide(l.host, { target: '.row', accept: (el) => el.getAttribute('aria-disabled') !== 'true', ...opts })
    return { ...l, g }
  }
  it('sin efectos al importar: ninguna escucha de documento ni de ventana', async () => {
    vi.resetModules()
    const d = vi.spyOn(document, 'addEventListener')
    const w = vi.spyOn(window, 'addEventListener')
    await import('./glide.js')
    expect(d).not.toHaveBeenCalled()
    expect(w).not.toHaveBeenCalled()
  })
  it('el ratón enciende la luz en el destino bajo el puntero, en el cuadro siguiente', () => {
    const { host, g } = mk()
    fire(host, 'pointermove', at(2))
    expect(host.classList.contains('has-highlight')).toBe(false)
    flush(1)
    expect(host.classList.contains('has-highlight')).toBe(true)
    expect(vl(host, 'y')).toBe('80px')
    g.destroy()
  })
  it('el lápiz también; el toque no hace nada', () => {
    const { host, g } = mk()
    host.dispatchEvent(ev('pointermove', { ...at(1), pointerType: 'touch' }))
    host.dispatchEvent(ev('pointerdown', { ...at(1), pointerType: 'touch' }))
    flush()
    expect(host.classList.contains('has-highlight')).toBe(false)
    fire(host, 'pointermove', { ...at(1), pointerType: 'pen' })
    flush(1)
    expect(host.classList.contains('has-highlight')).toBe(true)
    g.destroy()
  })
  it('un movimiento por cuadro: como mucho un elementFromPoint y dos lecturas de caja', () => {
    const { host, rows, g } = mk()
    const hostBox = vi.spyOn(host, 'getBoundingClientRect')
    for (let i = 0; i < 10; i++) fire(host, 'pointermove', { clientX: 150, clientY: 60 + i })
    flush(1)
    // En movimiento el destino lo da el evento: ninguna prueba de impacto
    expect(document.elementFromPoint).toHaveBeenCalledTimes(0)
    expect(hostBox).toHaveBeenCalledTimes(1)
    // Mismo destino en el cuadro siguiente: no se vuelve a leer ninguna caja
    fire(host, 'pointermove', { clientX: 160, clientY: 70 })
    flush(1)
    expect(hostBox).toHaveBeenCalledTimes(1)
    expect(rows.length).toBe(5)
    g.destroy()
  })
  it('un deshabilitado o un hueco apagan (nunca «el más cercano»); salir apaga', () => {
    const { host, g } = mk()
    fire(host, 'pointermove', at(2)); flush(1)
    fire(host, 'pointermove', at(3)); flush(1)
    expect(host.classList.contains('has-highlight')).toBe(false)
    fire(host, 'pointermove', at(4)); flush(1)
    expect(host.classList.contains('has-highlight')).toBe(true)
    expect(host.classList.contains('is-highlight-instant')).toBe(true) // entrar desde un hueco: primera colocación
    fire(host, 'pointermove', { clientX: 50, clientY: 70 }); flush(1)
    expect(host.classList.contains('has-highlight')).toBe(false)
    fire(host, 'pointermove', at(0)); flush(1)
    host.dispatchEvent(ev('pointerleave'))
    expect(host.classList.contains('has-highlight')).toBe(false)
    g.destroy()
  })
  it('las escuchas de documento existen solo con el puntero dentro', () => {
    const { host, g } = mk()
    const add = vi.spyOn(document, 'addEventListener')
    const rem = vi.spyOn(document, 'removeEventListener')
    fire(host, 'pointermove', at(0))
    expect(add.mock.calls.map((c) => c[0]).sort()).toEqual(['pointercancel', 'pointerup', 'scroll'])
    host.dispatchEvent(ev('pointerleave'))
    expect(rem.mock.calls.map((c) => c[0]).sort()).toEqual(['pointercancel', 'pointerup', 'scroll'])
    g.destroy()
  })
  it('pulsado se queda en lo pulsado; al soltar va a lo que hay bajo el puntero', () => {
    const { host, g } = mk()
    fire(host, 'pointermove', at(1)); flush(1)
    fire(host, 'pointerdown', at(1))
    fire(host, 'pointermove', at(4)); flush(1)
    expect(vl(host, 'y')).toBe('40px')
    document.dispatchEvent(ev('pointerup', at(4))); flush(1)
    expect(vl(host, 'y')).toBe('160px')
    g.destroy()
  })
  it('pulsado y fuera: sigue hasta soltar y entonces apaga', () => {
    const { host, g } = mk()
    fire(host, 'pointermove', at(1)); flush(1)
    fire(host, 'pointerdown', at(1))
    host.dispatchEvent(ev('pointerleave'))
    expect(host.classList.contains('has-highlight')).toBe(true)
    document.dispatchEvent(ev('pointerup'))
    expect(host.classList.contains('has-highlight')).toBe(false)
    g.destroy()
  })
  it('scroll con el puntero quieto: pasa al instante a lo que queda debajo', () => {
    const { host, rows, g } = mk()
    fire(host, 'pointermove', at(1)); flush(3)
    rows.forEach((a, i) => rect(a, { x: 100, y: 50 + i * 40 - 40, w: 200, h: 40 }))
    document.elementFromPoint = vi.fn(() => rows[2].firstChild)
    document.dispatchEvent(new Event('scroll'))
    document.dispatchEvent(new Event('scroll'))
    flush(1)
    expect(document.elementFromPoint).toHaveBeenCalledTimes(1) // puntero quieto: una sola prueba de impacto por cuadro
    expect(vl(host, 'y')).toBe('40px')
    expect(host.classList.contains('is-highlight-instant')).toBe(true)
    g.destroy()
  })
  it('clear() apaga y no vuelve sola: solo con el siguiente movimiento', () => {
    const { host, g } = mk()
    fire(host, 'pointermove', at(1)); flush(1)
    g.clear()
    expect(host.classList.contains('has-highlight')).toBe(false)
    document.dispatchEvent(new Event('scroll')); flush()
    expect(host.classList.contains('has-highlight')).toBe(false)
    fire(host, 'pointermove', at(2)); flush(1)
    expect(host.classList.contains('has-highlight')).toBe(true)
    g.destroy()
  })
  it('off(): nada se registra', () => {
    let off = true
    const { host, g } = mk({ off: () => off })
    fire(host, 'pointermove', at(1)); flush(1)
    expect(host.classList.contains('has-highlight')).toBe(false)
    off = false
    fire(host, 'pointermove', at(1)); flush(1)
    expect(host.classList.contains('has-highlight')).toBe(true)
    g.destroy()
  })
  it('el mismo número de escuchas con 10 y con 500 filas; destroy() las quita', () => {
    const count = (n) => {
      document.body.innerHTML = ''
      const host = document.createElement('div')
      for (let i = 0; i < n; i++) host.append(document.createElement('div'))
      const add = vi.spyOn(host, 'addEventListener')
      const rem = vi.spyOn(host, 'removeEventListener')
      const g = glide.createPointerGlide(host, { target: 'div' })
      const c = add.mock.calls.length
      g.destroy()
      expect(rem.mock.calls.length).toBe(c)
      return c
    }
    expect(count(10)).toBe(count(500))
  })
  it('las medidas van en la capa (primer hijo) y las clases en el anfitrión', () => {
    const { host, g } = mk()
    fire(host, 'pointermove', at(2)); flush(1)
    expect(vl(host, 'y')).toBe('80px')
    expect(v(host, 'y')).toBe('')
    expect(host.classList.contains('has-highlight')).toBe(true)
    g.destroy()
  })
  it('box(el) decide la caja medida', () => {
    const { host, rows, g } = mk({ box: () => rows[0] })
    fire(host, 'pointermove', at(2)); flush(1)
    expect(vl(host, 'y')).toBe('0px')
    g.destroy()
  })
})
