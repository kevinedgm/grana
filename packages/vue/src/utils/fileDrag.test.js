// utils/fileDrag.js (file-field.md «Arrastre de página y destino», #373): un juego de escuchas por página con cuenta de
// referencias, estado de solo lectura y protección contra soltar fuera solo para lo que nadie atendió.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { acquireFileDrag, fileDrag, fileDragRefs, hasFiles } from './fileDrag.js'
import { installTopLayer } from '../components/GSpeechHost/speechTestEnv.js'

/** Evento de arrastre con un dataTransfer de archivos (jsdom no construye DataTransfer) */
export function dragEvent(type, { files = true, types = ['image/png'], target = document.body } = {}) {
  const ev = new Event(type, { bubbles: true, cancelable: true })
  const dt = {
    types: files ? ['Files'] : ['text/plain'],
    items: files ? types.map((t) => ({ kind: 'file', type: t })) : [{ kind: 'string', type: 'text/plain' }],
    files: [],
    dropEffect: 'none'
  }
  Object.defineProperty(ev, 'dataTransfer', { value: dt })
  target.dispatchEvent(ev)
  return ev
}

const releases = []
afterEach(() => {
  while (releases.length) releases.pop()()
  vi.restoreAllMocks()
})

describe('fileDrag · cuenta de referencias', () => {
  it('el primer campo instala UN juego de escuchas en document; el último las retira', () => {
    const add = vi.spyOn(document, 'addEventListener')
    const rem = vi.spyOn(document, 'removeEventListener')
    const a = acquireFileDrag()
    const b = acquireFileDrag()
    expect(fileDragRefs()).toBe(2)
    const kinds = add.mock.calls.map((c) => c[0])
    for (const k of ['dragenter', 'dragleave', 'dragover', 'drop', 'dragend']) expect(kinds.filter((x) => x === k)).toHaveLength(1)
    a()
    a() // soltar dos veces no descuenta dos
    expect(fileDragRefs()).toBe(1)
    expect(rem.mock.calls.filter((c) => c[0] === 'dragenter')).toHaveLength(0)
    b()
    expect(fileDragRefs()).toBe(0)
    expect(rem.mock.calls.filter((c) => c[0] === 'dragenter')).toHaveLength(1)
  })
})

describe('fileDrag · estado', () => {
  it('solo arrastres con Files: dragging, types y count; salir de la ventana, soltar o dragend lo apagan', () => {
    releases.push(acquireFileDrag())
    dragEvent('dragenter', { files: false })
    expect(fileDrag.dragging).toBe(false)
    dragEvent('dragenter', { types: ['image/png', 'application/pdf'] })
    expect(fileDrag.dragging).toBe(true)
    expect(fileDrag.types).toEqual(['image/png', 'application/pdf'])
    expect(fileDrag.count).toBe(2)
    // De un elemento a otro: entra en el nuevo antes de salir del anterior
    const inner = document.createElement('div')
    document.body.appendChild(inner)
    dragEvent('dragenter', { target: inner })
    dragEvent('dragleave')
    expect(fileDrag.dragging).toBe(true)
    dragEvent('dragleave', { target: inner })
    expect(fileDrag.dragging).toBe(false)
    dragEvent('dragenter')
    dragEvent('drop')
    expect(fileDrag.dragging).toBe(false)
    dragEvent('dragenter')
    document.dispatchEvent(new Event('dragend'))
    expect(fileDrag.dragging).toBe(false)
    inner.remove()
  })

  it('es de solo lectura', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    fileDrag.dragging = true
    expect(fileDrag.dragging).toBe(false)
    warn.mockRestore()
  })

  it('hasFiles', () => {
    expect(hasFiles({ dataTransfer: { types: ['Files'] } })).toBe(true)
    expect(hasFiles({ dataTransfer: { types: ['text/plain'] } })).toBe(false)
    expect(hasFiles({})).toBe(false)
  })
})

describe('fileDrag · protección contra soltar fuera (siempre activa con un campo montado)', () => {
  it('sin campos montados no toca nada', () => {
    const ev = dragEvent('dragover')
    expect(ev.defaultPrevented).toBe(false)
  })
  it('dragover y drop con archivos que nadie atendió: preventDefault y dropEffect none', () => {
    releases.push(acquireFileDrag())
    dragEvent('dragenter')
    const over = dragEvent('dragover')
    expect(over.defaultPrevented).toBe(true)
    expect(over.dataTransfer.dropEffect).toBe('none')
    const drop = dragEvent('drop')
    expect(drop.defaultPrevented).toBe(true)
  })
  it('un destino de la aplicación que ya llamó a preventDefault() sigue funcionando (su dropEffect se respeta)', () => {
    releases.push(acquireFileDrag())
    const zone = document.createElement('div')
    document.body.appendChild(zone)
    zone.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' })
    const over = dragEvent('dragover', { target: zone })
    expect(over.dataTransfer.dropEffect).toBe('copy')
    zone.remove()
  })
  it('lo que no son archivos no se toca', () => {
    releases.push(acquireFileDrag())
    expect(dragEvent('dragover', { files: false }).defaultPrevented).toBe(false)
    expect(dragEvent('drop', { files: false }).defaultPrevented).toBe(false)
  })
})

describe('fileDrag · modal superior', () => {
  it('sigue al <dialog> modal abierto (topModal compartido) y vuelve a null', async () => {
    const restore = installTopLayer()
    releases.push(acquireFileDrag())
    const d = document.createElement('dialog')
    document.body.appendChild(d)
    d.showModal()
    await nextTick()
    await new Promise((r) => setTimeout(r, 0))
    expect(fileDrag.modal).toBe(d)
    d.close()
    await new Promise((r) => setTimeout(r, 0))
    expect(fileDrag.modal).toBe(null)
    d.remove()
    restore()
  })
})
