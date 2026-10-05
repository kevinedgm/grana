import { describe, it, expect, vi } from 'vitest'
import { placeBlock, placeSubmenu, placeAround, parsePlacement, stickySide, setVar, followFrame, px, anchorGone } from './anchor.js'

const rect = (left, top, w = 32, h = 32) => ({ left, top, right: left + w, bottom: top + h, width: w, height: h })
const V = { vw: 1000, vh: 800 }

describe('anchor · placeBlock (lista de GMenu)', () => {
  it('debajo y al inicio por defecto', () => {
    expect(placeBlock(rect(100, 100), { width: 200, naturalHeight: 100, ...V })).toEqual({ x: 100, y: 136, room: 800 - 132 - 8 - 4 })
  })
  it('al final: alinea el borde final', () => {
    expect(placeBlock(rect(300, 100), { width: 200, naturalHeight: 100, align: 'end', ...V }).x).toBe(132)
  })
  it('auto: encima si no cabe debajo y hay más espacio arriba', () => {
    const r = placeBlock(rect(100, 700), { width: 200, naturalHeight: 300, ...V })
    expect(r.y).toBe(700 - 4 - 300)
  })
  it('se ajusta al visor en horizontal', () => {
    expect(placeBlock(rect(950, 100), { width: 200, naturalHeight: 50, ...V }).x).toBe(1000 - 8 - 200)
  })
  it('RTL invierte la alineación', () => {
    expect(placeBlock(rect(300, 100), { width: 200, naturalHeight: 50, rtl: true, ...V }).x).toBe(132)
  })
})

describe('anchor · placeSubmenu (submenú de GMenu)', () => {
  it('al final de línea con solape', () => {
    expect(placeSubmenu(rect(100, 100, 200, 32), { width: 150, naturalHeight: 100, ...V })).toMatchObject({ x: 296, y: 94 })
  })
  it('al inicio si no cabe al final', () => {
    expect(placeSubmenu(rect(800, 100, 180, 32), { width: 150, naturalHeight: 100, ...V }).x).toBe(800 - 150 + 4)
  })
  it('sube si se sale por abajo', () => {
    expect(placeSubmenu(rect(100, 760, 200, 32), { width: 150, naturalHeight: 100, ...V }).y).toBe(800 - 8 - 100)
  })
})

describe('anchor · placeAround (contenido de GHelper)', () => {
  it('parsePlacement', () => {
    expect(parsePlacement('top-end')).toEqual({ side: 'top', align: 'end' })
    expect(parsePlacement('left')).toEqual({ side: 'left', align: 'center' })
  })
  it('usa el lado pedido si cabe', () => {
    const r = placeAround(rect(500, 300), { width: 200, height: 100, placement: 'bottom-end', ...V })
    expect(r).toMatchObject({ side: 'bottom', fits: true, x: 532 - 200, y: 340 })
  })
  it('voltea al opuesto si no cabe', () => {
    const r = placeAround(rect(500, 740), { width: 200, height: 100, placement: 'bottom-end', ...V })
    expect(r.side).toBe('top')
    expect(r.y).toBe(740 - 8 - 100)
  })
  it('prueba los perpendiculares si tampoco cabe el opuesto', () => {
    const r = placeAround(rect(100, 350, 32, 100), { width: 200, height: 400, placement: 'bottom', vw: 1000, vh: 800 })
    expect(r.side).toBe('right')
    expect(r.fits).toBe(true)
  })
  it('desplaza sobre el eje secundario hasta quedar dentro', () => {
    const r = placeAround(rect(980, 300, 16, 16), { width: 200, height: 100, placement: 'bottom-start', ...V })
    expect(r.x).toBe(1000 - 8 - 200)
  })
  it('centro', () => {
    expect(placeAround(rect(484, 300), { width: 200, height: 100, placement: 'top', ...V }).x).toBe(400)
  })
  it('RTL: left/right lógicos y alineación invertida', () => {
    const r = placeAround(rect(500, 300), { width: 200, height: 100, placement: 'right-start', rtl: true, ...V })
    expect(r.x).toBe(500 - 8 - 200) // «right» = fin de línea = izquierda física en RTL
    const b = placeAround(rect(500, 300), { width: 200, height: 100, placement: 'bottom-start', rtl: true, ...V })
    expect(b.x).toBe(532 - 200) // «start» = borde derecho en RTL
  })
  it('más grande que el visor: fits false', () => {
    expect(placeAround(rect(10, 10), { width: 1200, height: 100, placement: 'bottom', ...V }).fits).toBe(false)
  })
  it('room: alto disponible en el lado elegido', () => {
    expect(placeAround(rect(500, 300), { width: 200, height: 100, placement: 'bottom', ...V }).room).toBe(800 - 332 - 8 - 8)
  })
})

describe('anchor · panel estable al desplazar (stickySide, setVar, followFrame)', () => {
  const U = 4 // space: umbrales 160 (× 40) y 48 (× 12)
  it('conserva el lado mientras siga siendo útil (≥ space × 40), aunque el otro ofrezca más', () => {
    expect(stickySide('bottom', { below: 160, above: 600, unit: U })).toBe('bottom')
    expect(stickySide('top', { below: 600, above: 200, unit: U })).toBe('top')
  })
  it('cambia solo si el actual baja de space × 40 Y el otro ofrece al menos space × 12 más', () => {
    expect(stickySide('bottom', { below: 150, above: 197, unit: U })).toBe('bottom')
    expect(stickySide('bottom', { below: 150, above: 198, unit: U })).toBe('top')
    expect(stickySide('top', { below: 300, above: 100, unit: U })).toBe('bottom')
  })
  it('vaivén de 4px alrededor del cruce: como mucho un cambio', () => {
    let side = 'bottom'
    let flips = 0
    // El ancla se mueve en el visor de 800px; alto del ancla 36 y margen 8
    for (const top of [400, 404, 408, 412, 408, 404, 400, 396, 392, 396, 400, 404, 408, 412, 416, 420, 416, 412]) {
      const next = stickySide(side, { below: 800 - (top + 36) - 8, above: top - 8, unit: U })
      if (next !== side) flips++
      side = next
    }
    expect(flips).toBe(0)
  })
  it('setVar escribe solo si cambia', () => {
    const el = document.createElement('div')
    const spy = vi.spyOn(el.style, 'setProperty')
    expect(setVar(el, '--_x', px(10.004))).toBe(true)
    expect(setVar(el, '--_x', px(10.001))).toBe(false)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(el.style.getPropertyValue('--_x')).toBe('10px')
  })
  it('followFrame agrupa los eventos de un cuadro y cancel() anula el pendiente', async () => {
    const fn = vi.fn()
    const f = followFrame(fn)
    f.schedule('a'); f.schedule('b'); f.schedule('c')
    await new Promise((r) => setTimeout(r, 40))
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('a')
    f.schedule('d'); f.cancel()
    await new Promise((r) => setTimeout(r, 40))
    expect(fn).toHaveBeenCalledTimes(1)
  })
  it('anchorGone: fuera del visor (estricto: en el borde aún no), o fuera del contenedor que lo contiene y se desplaza', () => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 })
    const box = document.createElement('div')
    const el = document.createElement('span')
    box.appendChild(el)
    document.body.appendChild(box)
    const at = { r: rect(100, 100, 80, 32) }
    el.getBoundingClientRect = () => at.r
    box.getBoundingClientRect = () => rect(0, 200, 600, 300)
    expect(anchorGone(el)).toBe(false)
    expect(anchorGone(null)).toBe(false)
    at.r = rect(100, -32, 80, 32) // borde inferior en 0
    expect(anchorGone(el)).toBe(false)
    at.r = rect(100, -33, 80, 32)
    expect(anchorGone(el)).toBe(true)
    at.r = rect(100, 801, 80, 32)
    expect(anchorGone(el)).toBe(true)
    at.r = rect(0, 0, 0, 0) // sin caja: no cuenta como fuera
    expect(anchorGone(el)).toBe(false)
    // Dentro del visor pero por encima del contenedor que se desplaza y la contiene
    at.r = rect(100, 100, 80, 32)
    expect(anchorGone(el, box)).toBe(true)
    expect(anchorGone(el, document.createElement('div'))).toBe(false) // un contenedor que no la contiene no cuenta
    expect(anchorGone(el, document)).toBe(false)
    at.r = rect(100, 300, 80, 32)
    expect(anchorGone(el, box)).toBe(false)
    box.remove()
  })
})
