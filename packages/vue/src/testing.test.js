// Entrada de pruebas `@grana/vue/testing` (speech.md §1 y §4.7, #216): el adaptador simulado no viaja en el paquete
// principal; la entrada existe en package.json y en el build.
import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import * as main from './index.js'
import * as testing from './testing.js'
import * as speech from './speech.js'
import * as fileField from './file-field.js'

describe('@grana/vue/testing', () => {
  it('exporta createSimulatedSpeechAdapter; ni el paquete principal ni @grana/vue/speech exportan el simulado', () => {
    expect(typeof testing.createSimulatedSpeechAdapter).toBe('function')
    expect(main.createSimulatedSpeechAdapter).toBeUndefined()
    expect(speech.createSimulatedSpeechAdapter).toBeUndefined()
  })

  it('el simulado sirve al gestor de @grana/vue/speech (sin avisos de adaptador)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const s = speech.createSpeech({ adapter: testing.createSimulatedSpeechAdapter(), labels: {} })
    expect(s.state.status).toBe('idle')
    expect(s.capabilities).toMatchObject({ location: 'local' })
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('package.json declara la entrada y el build la construye aparte', () => {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'))
    expect(pkg.exports['./testing']).toEqual({ types: './dist/testing.d.ts', import: './dist/testing.js', default: './dist/testing.js' })
    expect(pkg.scripts.build).toContain('vite.testing.config.js')
    const src = readFileSync(resolve(process.cwd(), 'src/index.js'), 'utf8')
    expect(src).not.toContain('simulatedAdapter')
  })

  it('el simulado cumple la forma del adaptador (§4.1) con capacidades configurables', () => {
    const a = testing.createSimulatedSpeechAdapter({ location: 'device', diarization: false, storesAudio: 'none', partials: false })
    expect(a.id).toBe('simulated')
    expect(typeof a.open).toBe('function')
    expect(typeof a.check).toBe('function')
    expect(a.capabilities).toMatchObject({ location: 'device', diarization: false, storesAudio: 'none', partials: false, input: { format: 'pcm', sampleRate: 16000, channels: 1 } })
    a.setCapabilities({ offlineBuffer: false })
    expect(a.capabilities.offlineBuffer).toBe(false)
  })
})

describe('@grana/vue/testing · createSimulatedUploader (file-field.md, #367)', () => {
  const file = (name, size = 1000) => new File([new Uint8Array(size)], name, { type: 'image/png' })
  it('solo en la entrada de pruebas; no importa nada del paquete', () => {
    expect(typeof testing.createSimulatedUploader).toBe('function')
    expect(main.createSimulatedUploader).toBeUndefined()
    expect(fileField.createSimulatedUploader).toBeUndefined()
    const src = readFileSync(resolve(process.cwd(), 'src/components/GFileField/simulatedUploader.js'), 'utf8')
    expect(src).not.toMatch(/^import /m)
  })
  it('progreso por pasos y resuelve { value }; cuenta llamadas', async () => {
    const up = testing.createSimulatedUploader({ interval: 1, steps: 3 })
    const seen = []
    const r = await up(file('a.png'), { signal: new AbortController().signal, progress: (l, t) => seen.push([l, t]) })
    expect(seen).toEqual([[333, 1000], [667, 1000], [1000, 1000]])
    expect(r.value).toBe('srv-1')
    expect(up.stats()).toMatchObject({ calls: 1, done: 1, active: 0 })
  })
  it('falla al primer intento («falla») con { message } y sube al reintentar; «servidor» falla siempre', async () => {
    const up = testing.createSimulatedUploader({ interval: 1, steps: 4, failMessage: 'Cortado', serverMessage: 'No admitido' })
    const sig = () => new AbortController().signal
    await expect(up(file('radiografia-falla.png'), { signal: sig() })).rejects.toEqual({ message: 'Cortado' })
    await expect(up(file('radiografia-falla.png'), { signal: sig() })).resolves.toMatchObject({ value: expect.any(String) })
    await expect(up(file('receta-servidor.pdf'), { signal: sig() })).rejects.toEqual({ message: 'No admitido' })
    expect(up.attempts('radiografia-falla.png')).toBe(2)
  })
  it('AbortError al cancelar (signal); sin conexión rechaza lo que está en curso; noValue resuelve sin value', async () => {
    const up = testing.createSimulatedUploader({ interval: 5, steps: 50, noValue: /sin-valor/ })
    const ac = new AbortController()
    const p = up(file('a.png'), { signal: ac.signal })
    ac.abort()
    await expect(p).rejects.toMatchObject({ name: 'AbortError' })
    const q = up(file('b.png'), { signal: new AbortController().signal })
    up.setOffline(true)
    await expect(q).rejects.toEqual({ message: 'Simulated: offline' })
    up.setOffline(false)
    const fast = testing.createSimulatedUploader({ interval: 1, steps: 1, noValue: /sin-valor/ })
    await expect(fast(file('sin-valor.png'), { signal: new AbortController().signal })).resolves.toEqual({ value: null })
  })
})
