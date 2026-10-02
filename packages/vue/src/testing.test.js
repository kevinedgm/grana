// Entrada de pruebas `@grana/vue/testing` (speech.md §1 y §4.7, #216): el adaptador simulado no viaja en el paquete
// principal; la entrada existe en package.json y en el build.
import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import * as main from './index.js'
import * as testing from './testing.js'
import * as speech from './speech.js'

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
    expect(pkg.exports['./testing']).toEqual({ import: './dist/testing.js' })
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
