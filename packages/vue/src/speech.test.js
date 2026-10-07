// Entrada `@grana/vue/speech` (design/contracts/speech.md §1 y §17, DECISIONS.md #238): la captura de voz sale del
// paquete principal; `app.use(speech)` provee el gestor y registra sus tres componentes; lo compartido con el principal
// se toma de `__shared` (src/shared.js) y no se duplica.
import { describe, it, expect, vi } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import { createApp, defineComponent, h } from 'vue'
import Grana, * as main from './index.js'
import * as speechEntry from './speech.js'
import { createSimulatedSpeechAdapter } from './testing.js'
import { shared } from './shared.js'
import * as edgeReserve from './utils/edgeReserve.js'
import * as topModal from './utils/topModal.js'
import * as liveRegion from './utils/liveRegion.js'
import GBtn from './components/GBtn/GBtn.vue'
import GLibIcon from './components/GIcon/GLibIcon.js'

const SPEECH_NAMES = ['createSpeech', 'useSpeech', 'speechKey', 'GSpeechHost', 'GSpeechPill', 'GSpeechTrigger', 'GTranscript', 'createTranscript', 'useSpeechTarget']
const COMPONENTS = ['GSpeechHost', 'GSpeechPill', 'GSpeechTrigger', 'GTranscript']
const SRC = resolve(process.cwd(), 'src')

describe('@grana/vue/speech · entrada propia (#238)', () => {
  it('exporta el gestor, useSpeech, speechKey, los componentes y (F2) GTranscript, createTranscript y useSpeechTarget; nada interno', () => {
    for (const k of SPEECH_NAMES) expect(speechEntry[k], k).toBeTruthy()
    expect(Object.keys(speechEntry).sort()).toEqual([...SPEECH_NAMES].sort())
  })

  it('@grana/vue ya no exporta la captura ni la registra en su install', () => {
    for (const k of SPEECH_NAMES) expect(main[k], k).toBeUndefined()
    const app = createApp({ render: () => null })
    app.use(Grana)
    for (const n of COMPONENTS) expect(app.component(n), n).toBeUndefined()
    expect(app.component('GBtn')).toBe(GBtn)
    const src = readFileSync(resolve(SRC, 'index.js'), 'utf8')
    expect(src).not.toMatch(/from '\.\/components\/GSpeech|from '\.\/speech\.js'/)
  })

  it('app.use(speech) provee el gestor y registra GSpeechHost, GSpeechPill, GSpeechTrigger y GTranscript (sin pisar uno ya registrado)', () => {
    const speech = speechEntry.createSpeech({ adapter: createSimulatedSpeechAdapter(), labels: {} })
    let got
    const app = createApp(defineComponent({ setup() { got = speechEntry.useSpeech(); return () => h('p') } }))
    const own = defineComponent({ name: 'MiAnfitrion', render: () => null })
    app.component('GSpeechHost', own)
    app.use(speech)
    expect(app.component('GSpeechHost')).toBe(own)
    expect(app.component('GSpeechPill')).toBe(speechEntry.GSpeechPill)
    expect(app.component('GSpeechTrigger')).toBe(speechEntry.GSpeechTrigger)
    expect(app.component('GTranscript')).toBe(speechEntry.GTranscript)
    app.mount(document.createElement('div'))
    expect(got).toBe(speech)
    app.unmount()
    const fresh = createApp({ render: () => null }).use(speechEntry.createSpeech({ adapter: createSimulatedSpeechAdapter(), labels: {} }))
    for (const n of COMPONENTS) expect(fresh.component(n), n).toBe(speechEntry[n])
  })

  it('package.json declara ./speech y el build la construye aparte con @grana/vue y vue como externos', () => {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'))
    expect(pkg.exports['./speech']).toEqual({ types: './dist/speech.d.ts', import: './dist/speech.js', default: './dist/speech.js' })
    expect(pkg.scripts.build).toContain('vite.speech.config.js')
    const cfg = readFileSync(resolve(process.cwd(), 'vite.speech.config.js'), 'utf8')
    expect(cfg).toContain("external: ['vue', '@grana/vue']")
    expect(cfg).toContain("name: 'GranaSpeech'")
    expect(cfg).toContain("'@grana/vue': 'Grana'")
  })
})

describe('@grana/vue/speech · lo compartido llega del paquete principal (src/shared.js)', () => {
  // Importaciones de la captura (sin pruebas ni su entorno) que salen de sus carpetas: el build las redirige a __shared
  const own = (key) => key === 'speech.js' || /^components\/(GSpeech(Host|Pill|Trigger)|GTranscript)\//.test(key)
  const keyOf = (file) => relative(SRC, file).split(sep).join('/')
  const files = ['speech.js', ...['GSpeechHost', 'GSpeechPill', 'GSpeechTrigger', 'GTranscript'].flatMap((d) =>
    readdirSync(resolve(SRC, 'components', d)).filter((f) => /\.(vue|js)$/.test(f) && !/\.test\.js$|TestEnv\.js$/.test(f)).map((f) => `components/${d}/${f}`))]
  const imports = []
  for (const f of files) {
    const text = readFileSync(resolve(SRC, f), 'utf8')
    for (const [, spec, source] of text.matchAll(/^import\s+([^'"]+?)\s+from\s+'(\.[^']+)'/gm)) {
      const key = keyOf(resolve(dirname(resolve(SRC, f)), source))
      if (own(key)) continue
      const names = []
      const named = spec.match(/\{([^}]*)\}/)
      if (named) for (const n of named[1].split(',')) if (n.trim()) names.push(n.trim().split(/\s+as\s+/)[0])
      if (/^\s*[A-Za-z_$][\w$]*\s*(,|$)/.test(spec)) names.push('default')
      imports.push({ from: f, key, names })
    }
  }

  it('la captura importa del principal solo lo que src/shared.js expone, nombre por nombre', () => {
    expect(imports.length).toBeGreaterThan(0)
    for (const { from, key, names } of imports) {
      expect(shared[key], `${from} → ${key}`).toBeTruthy()
      for (const n of names) expect(shared[key][n], `${from} → ${key} · ${n}`).toBeDefined()
    }
  })

  it('@grana/vue exporta __shared con las mismas instancias (un solo registro de reservas de borde y de modal)', () => {
    expect(main.__shared).toBe(shared)
    expect(shared['utils/edgeReserve.js'].setEdgeReserve).toBe(edgeReserve.setEdgeReserve)
    expect(shared['utils/edgeReserve.js'].clearEdgeReserve).toBe(edgeReserve.clearEdgeReserve)
    expect(shared['utils/topModal.js'].createTopModal).toBe(topModal.createTopModal)
    expect(shared['utils/liveRegion.js'].createLiveWriter).toBe(liveRegion.createLiveWriter)
    expect(shared['components/GIcon/GLibIcon.js'].default).toBe(GLibIcon)
    // Una reserva escrita por un dueño (p. ej. GToaster) la ve quien lee por __shared (p. ej. la captura)
    shared['utils/edgeReserve.js'].setEdgeReserve('prueba', 'bottom', 40)
    expect(edgeReserve.edgeReserve('bottom')).toBeGreaterThanOrEqual(40)
    edgeReserve.clearEdgeReserve('prueba')
  })

  it('el build se detiene si la captura importa un módulo del principal que no está en src/shared.js', () => {
    const cfg = readFileSync(resolve(process.cwd(), 'vite.speech.config.js'), 'utf8')
    expect(cfg).toContain('this.error(')
    for (const { key } of imports) expect(readFileSync(resolve(SRC, 'shared.js'), 'utf8')).toContain(`'${key}':`)
  })
})

// Silencia avisos de desarrollo que no son objeto de estas pruebas
vi.spyOn(console, 'warn').mockImplementation(() => {})
