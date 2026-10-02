// @vitest-environment node
// GIcon y createIcons en el servidor · docs/contract/icons.md v0.2 §5.6 y §7 (prueba 7)
// Entorno node: sin window ni document. Si importar el paquete o crear un registro los tocara, esto fallaría.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { createSSRApp, defineComponent } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { LockOpen, MapPin } from 'lucide-static'

afterEach(() => vi.restoreAllMocks())

describe('SSR · GIcon y createIcons', () => {
  it('importar el paquete y llamar a createIcons no toca document ni window', async () => {
    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')
    const touched = []
    const trap = (name) => new Proxy({}, { get(_, k) { touched.push(`${name}.${String(k)}`); return undefined } })
    globalThis.window = trap('window')
    globalThis.document = trap('document')
    try {
      const api = await import('../../index.js')
      api.createIcons([LockOpen, MapPin])
      api.createIcons('no es un arreglo')
    } finally {
      delete globalThis.window
      delete globalThis.document
    }
    expect(touched).toEqual([])
  })

  it('dos aplicaciones renderizadas a la vez con registros distintos no se mezclan', async () => {
    const { default: Grana, createIcons } = await import('../../index.js')
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    // <GIcon> resuelto por el registro de componentes de install
    const Tpl = defineComponent({ template: '<div><GIcon class="a" name="lock-open" /><GIcon class="b" name="map-pin" /><GIcon class="c" name="lock" label="Bloqueado" /></div>' })
    const make = (icons) => createSSRApp(Tpl).use(Grana).use(createIcons(icons))
    const [one, two] = await Promise.all([renderToString(make([LockOpen])), renderToString(make([MapPin]))])
    // app 1: lock-open sí, map-pin no; app 2: al revés. Las dos tienen la librería (lock).
    expect(one).toContain('class="g-icon a"')
    expect(one).not.toContain('class="g-icon b"')
    expect(two).not.toContain('class="g-icon a"')
    expect(two).toContain('class="g-icon b"')
    for (const html of [one, two]) {
      expect(html).toContain('role="img" aria-label="Bloqueado"')
      expect(html).toContain('aria-hidden="true"')
      expect(html).toContain('focusable="false"')
      expect(html).not.toContain('tabindex')
    }
    // una tercera app sin registro no hereda nada de las anteriores
    const three = await renderToString(createSSRApp(Tpl).use(Grana))
    expect(three).not.toContain('class="g-icon a"')
    expect(three).not.toContain('class="g-icon b"')
    expect(three).toContain('class="g-icon c"')
  })
})
