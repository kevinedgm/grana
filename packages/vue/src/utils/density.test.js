import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { defineComponent, h, nextTick, watch } from 'vue'
import { mount } from '@vue/test-utils'

// utils/density.js (density.md §7, #980): lectura del paso desde --g-density y época de densidad con un único
// MutationObserver perezoso por documento.
let frames
const flush = () => { const f = frames.splice(0); f.forEach((fn) => fn()) }
let mod
let created
beforeEach(async () => {
  frames = []
  vi.stubGlobal('requestAnimationFrame', (f) => { frames.push(f); return frames.length })
  vi.stubGlobal('cancelAnimationFrame', () => {})
  created = []
  const Real = globalThis.MutationObserver
  vi.stubGlobal('MutationObserver', class extends Real {
    constructor (cb) { super(cb); this.connected = false; created.push(this) }
    observe (...a) { this.connected = true; this.opts = a[1]; return super.observe(...a) }
    disconnect () { this.connected = false; return super.disconnect() }
  })
  vi.resetModules()
  mod = await import('./density.js')
})
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); document.body.innerHTML = ''; document.documentElement.removeAttribute('data-g-density') })

const withDensity = (v) => {
  const el = document.createElement('div')
  el.style.setProperty('--g-density', v)
  document.body.append(el)
  return el
}

describe('readDensity', () => {
  it('devuelve el paso más cercano al --g-density calculado', () => {
    expect(mod.readDensity(withDensity('1'))).toBe('default')
    expect(mod.readDensity(withDensity('0.875'))).toBe('comfortable')
    expect(mod.readDensity(withDensity('0.75'))).toBe('compact')
    // Fronteras: ≤ 0.8125 compact, ≤ 0.9375 comfortable
    expect(mod.readDensity(withDensity('0.8125'))).toBe('compact')
    expect(mod.readDensity(withDensity('0.82'))).toBe('comfortable')
    expect(mod.readDensity(withDensity('0.9375'))).toBe('comfortable')
    expect(mod.readDensity(withDensity('0.94'))).toBe('default')
  })

  it("vacío, no numérico, sin elemento o sin getComputedStyle (servidor): 'default'", () => {
    expect(mod.readDensity(withDensity(''))).toBe('default')
    expect(mod.readDensity(withDensity('compact'))).toBe('default')
    expect(mod.readDensity(undefined)).toBe('default')
    expect(mod.readDensity(null)).toBe('default')
    vi.stubGlobal('getComputedStyle', undefined)
    expect(mod.readDensity(document.body)).toBe('default')
  })
})

describe('useDensityEpoch', () => {
  const Probe = defineComponent({
    props: { onEpoch: Function },
    setup (props) {
      const epoch = mod.useDensityEpoch()
      watch(epoch, (v) => props.onEpoch?.(v))
      return () => h('i')
    }
  })

  it('sin efectos al importar: ningún observador antes del primer montaje (#444)', () => {
    expect(created).toHaveLength(0)
    expect(mod.densityEpoch.value).toBe(0)
  })

  it('un único observador del documento con 1 o con 200 componentes; se desconecta con el último', async () => {
    const one = mount(Probe, { attachTo: document.body })
    expect(created).toHaveLength(1)
    const mo = created[0]
    expect(mo.connected).toBe(true)
    expect(mo.opts).toEqual({ subtree: true, attributes: true, attributeFilter: ['data-g-density'] })
    const many = Array.from({ length: 199 }, () => mount(Probe, { attachTo: document.body }))
    expect(created).toHaveLength(1)
    many.forEach((w) => w.unmount())
    expect(mo.connected).toBe(true)
    one.unmount()
    expect(mo.connected).toBe(false)
    // Un montaje nuevo crea otro (perezoso de nuevo)
    const again = mount(Probe, { attachTo: document.body })
    expect(created).toHaveLength(2)
    again.unmount()
  })

  it('varios cambios de data-g-density en la misma tarea suben una vez, también en <html>; otros atributos no cuentan', async () => {
    const seen = vi.fn()
    const w = mount(Probe, { props: { onEpoch: seen }, attachTo: document.body })
    const region = document.createElement('section')
    document.body.append(region)
    await Promise.resolve()
    region.setAttribute('data-g-density', 'compact')
    document.documentElement.setAttribute('data-g-density', 'comfortable')
    region.setAttribute('data-x', '1')
    await Promise.resolve()
    expect(frames).toHaveLength(1)
    flush()
    await nextTick()
    expect(seen).toHaveBeenCalledTimes(1)
    region.setAttribute('data-x', '2')
    await Promise.resolve()
    expect(frames).toHaveLength(0)
    region.removeAttribute('data-g-density')
    await Promise.resolve()
    flush()
    await nextTick()
    expect(seen).toHaveBeenCalledTimes(2)
    w.unmount()
  })

  it('flanco inicial en la microtarea del cambio y uno final en el cuadro si llegaron más cambios mientras tanto', async () => {
    const seen = vi.fn()
    const w = mount(Probe, { props: { onEpoch: seen }, attachTo: document.body })
    const a = document.createElement('section')
    document.body.append(a)
    await Promise.resolve()
    a.setAttribute('data-g-density', 'compact')
    await Promise.resolve()
    expect(mod.densityEpoch.value, 'sube antes del cuadro (antes de calcular el estilo)').toBe(1)
    a.setAttribute('data-g-density', 'comfortable')
    await Promise.resolve()
    a.setAttribute('data-g-density', 'default')
    await Promise.resolve()
    expect(mod.densityEpoch.value, 'los cambios siguientes del mismo cuadro esperan al cuadro').toBe(1)
    flush()
    expect(mod.densityEpoch.value, 'uno final por todos ellos').toBe(2)
    flush()
    expect(mod.densityEpoch.value).toBe(2)
    w.unmount()
  })

  it('devuelve un getter: como fuente de un watch de varias, no dispara cuando otra fuente se reevalúa sin cambiar', async () => {
    const { ref } = await import('vue')
    const other = ref({ a: 1 })
    const cb = vi.fn()
    const Comp = defineComponent({
      setup () {
        watch([() => other.value.a, mod.useDensityEpoch()], cb)
        return () => h('i')
      }
    })
    const w = mount(Comp, { attachTo: document.body })
    other.value = { a: 1 }
    await nextTick()
    expect(cb).not.toHaveBeenCalled()
    w.unmount()
  })

  it('sin MutationObserver (entorno sin DOM): no falla y no observa', () => {
    vi.stubGlobal('MutationObserver', undefined)
    const w = mount(Probe)
    expect(created).toHaveLength(0)
    w.unmount()
  })
})
