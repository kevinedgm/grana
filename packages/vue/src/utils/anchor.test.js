import { describe, it, expect } from 'vitest'
import { placeBlock, placeSubmenu, placeAround, parsePlacement } from './anchor.js'

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
