// utils/liveRegion.js: el escritor compartido (#14) y el canal cortés de página (#533, load-region.md «Anuncios»).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { reactive } from 'vue'
import { acquirePageLive, announcePage, createLiveWriter, pageLiveNode, PAGE_LIVE_CLEAR, PAGE_LIVE_DELAY } from './liveRegion.js'
import { installTopLayer } from '../components/GSpeechHost/speechTestEnv.js'

let restore
beforeEach(() => { restore = installTopLayer(); vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers(); restore(); document.body.innerHTML = '' })

describe('createLiveWriter', () => {
  it('sin unique repite textos idénticos del mismo ciclo (como siempre); con unique, no', () => {
    const a = reactive({ polite: '', assertive: '' })
    const w = createLiveWriter(a, { delay: 50, clear: 5000 })
    w.announce('Hola', 'polite'); w.announce('Hola', 'polite')
    vi.advanceTimersByTime(50)
    expect(a.polite).toBe('Hola Hola')
    const b = reactive({ polite: '', assertive: '' })
    const u = createLiveWriter(b, { delay: 50, clear: 5000, unique: true })
    u.announce('Hola', 'polite'); u.announce('Adiós', 'polite'); u.announce('Hola', 'polite')
    vi.advanceTimersByTime(50)
    expect(b.polite).toBe('Hola Adiós')
    vi.advanceTimersByTime(5000)
    expect(b.polite).toBe('')
    w.dispose(); u.dispose()
  })
})

describe('canal de página (#533)', () => {
  it('uno por documento: lo crea el primer consumidor y lo retira el último', () => {
    expect(pageLiveNode()).toBe(null)
    const r1 = acquirePageLive()
    const r2 = acquirePageLive()
    const nodes = document.querySelectorAll('p.g-load-live')
    expect(nodes).toHaveLength(1)
    const p = nodes[0]
    expect(p.getAttribute('aria-live')).toBe('polite')
    expect(p.getAttribute('aria-atomic')).toBe('true')
    expect(p.parentElement).toBe(document.body)
    expect(p.textContent).toBe('')
    r1(); r1()
    expect(document.querySelectorAll('p.g-load-live')).toHaveLength(1)
    r2()
    expect(document.querySelector('p.g-load-live')).toBe(null)
    expect(pageLiveNode()).toBe(null)
  })

  it('fusión en el mismo ciclo, en orden de llegada, sin repetir idénticos; se vacía a los 5 s', () => {
    const release = acquirePageLive()
    const p = pageLiveNode()
    announcePage('Cargando muestras.')
    announcePage('Cargando el panel.')
    announcePage('Cargando muestras.')
    expect(p.textContent).toBe('')
    vi.advanceTimersByTime(PAGE_LIVE_DELAY)
    expect(p.textContent).toBe('Cargando muestras. Cargando el panel.')
    vi.advanceTimersByTime(PAGE_LIVE_CLEAR)
    expect(p.textContent).toBe('')
    // Un texto idéntico en otro ciclo sí se vuelve a anunciar (se vacía y se escribe)
    announcePage('Cargando muestras.')
    vi.advanceTimersByTime(PAGE_LIVE_DELAY)
    expect(p.textContent).toBe('Cargando muestras.')
    release()
  })

  it('sin consumidores no hace nada; textos vacíos se ignoran', () => {
    announcePage('Nada')
    expect(document.querySelector('p.g-load-live')).toBe(null)
    const release = acquirePageLive()
    announcePage('')
    announcePage(null)
    vi.advanceTimersByTime(100)
    expect(pageLiveNode().textContent).toBe('')
    release()
  })

  it('se traslada al <dialog> modal superior y vuelve a <body> al cerrarse', async () => {
    vi.useRealTimers()
    const release = acquirePageLive()
    const d = document.createElement('dialog')
    document.body.append(d)
    d.showModal()
    await new Promise((r) => setTimeout(r, 0))
    expect(pageLiveNode().parentElement).toBe(d)
    d.close()
    await new Promise((r) => setTimeout(r, 0))
    expect(pageLiveNode().parentElement).toBe(document.body)
    release()
  })

  it('un modal ya abierto al crearse lo aloja; si sale del documento sin cerrarse, vuelve a <body> al anunciar', async () => {
    vi.useRealTimers()
    const d = document.createElement('dialog')
    document.body.append(d)
    d.showModal()
    const release = acquirePageLive()
    expect(pageLiveNode().parentElement).toBe(d)
    d.remove()
    announcePage('Hola.')
    expect(pageLiveNode().parentElement).toBe(document.body)
    release()
  })
})
