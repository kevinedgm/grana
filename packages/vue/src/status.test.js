// Entrada `@grana/vue/status` (status.md, DECISIONS.md #328): la isla de estado va aparte del paquete principal y toma lo
// compartido de `__shared` (src/shared.js), como la captura de voz (#238).
import { describe, it, expect, vi } from 'vitest'
import { createApp, h } from 'vue'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import * as main from './index.js'
import * as statusEntry from './status.js'
import { shared } from './shared.js'
import * as edgeReserve from './utils/edgeReserve.js'

const NAMES = ['createStatus', 'useStatus', 'statusKey', 'GStatusIsland', 'GStatusMark', 'GStatus']
const COMPONENTS = ['GStatusIsland', 'GStatusMark', 'GStatus']
const SRC = resolve(process.cwd(), 'src')
vi.spyOn(console, 'warn').mockImplementation(() => {})

describe('@grana/vue/status · entrada propia (#328)', () => {
  it('exporta el gestor, useStatus, statusKey y los tres componentes; nada interno', () => {
    for (const k of NAMES) expect(statusEntry[k], k).toBeTruthy()
    expect(Object.keys(statusEntry).sort()).toEqual([...NAMES].sort())
  })

  it('@grana/vue no exporta la isla ni registra sus componentes', () => {
    for (const k of NAMES) expect(main[k], k).toBeUndefined()
    const app = createApp({ render: () => h('i') })
    app.use(main.default)
    for (const c of COMPONENTS) expect(app.component(c), c).toBeUndefined()
  })

  it('app.use(status) provee el gestor y registra los tres componentes (sin pisar uno ya registrado)', () => {
    const status = statusEntry.createStatus()
    const app = createApp({ render: () => h('i') })
    const Mine = { render: () => null }
    app.component('GStatusMark', Mine)
    app.use(status)
    expect(app._context.provides[statusEntry.statusKey]).toBe(status)
    expect(app.component('GStatusIsland')).toBe(statusEntry.GStatusIsland)
    expect(app.component('GStatus')).toBe(statusEntry.GStatus)
    expect(app.component('GStatusMark')).toBe(Mine)
  })

  it('package.json, build y configuración: exports ./status, global GranaStatus, Vue y @grana/vue externos', () => {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'))
    expect(pkg.exports['./status']).toEqual({ import: './dist/status.js' })
    expect(pkg.scripts.build).toContain('vite build -c vite.status.config.js')
    const cfg = readFileSync(resolve(process.cwd(), 'vite.status.config.js'), 'utf8')
    expect(cfg).toContain("external: ['vue', '@grana/vue']")
    expect(cfg).toContain("name: 'GranaStatus'")
    expect(cfg).toContain("'@grana/vue': 'Grana'")
    expect(cfg).toContain('this.error(')
  })
})

describe('@grana/vue/status · lo compartido llega del paquete principal (src/shared.js)', () => {
  const own = (key) => key === 'status.js' || /^components\/(GStatusIsland|GStatusMark|GStatus)\//.test(key)
  const keyOf = (file) => relative(SRC, file).split(sep).join('/')
  const files = ['status.js', ...COMPONENTS.flatMap((d) =>
    readdirSync(resolve(SRC, 'components', d)).filter((f) => /\.(vue|js)$/.test(f) && !/\.test\.js$/.test(f)).map((f) => `components/${d}/${f}`))]
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

  it('la isla importa del principal solo lo que src/shared.js expone, nombre por nombre', () => {
    expect(imports.length).toBeGreaterThan(0)
    for (const { from, key, names } of imports) {
      expect(shared[key], `${from} → ${key}`).toBeTruthy()
      for (const n of names) expect(shared[key][n], `${from} → ${key} · ${n}`).toBeDefined()
      expect(readFileSync(resolve(SRC, 'shared.js'), 'utf8')).toContain(`'${key}':`)
    }
  })

  it('un solo registro de reservas de borde: la isla lee y escribe el mismo que GToaster y la voz', () => {
    expect(shared['utils/edgeReserve.js'].edgeReserve).toBe(edgeReserve.edgeReserve)
    expect(shared['utils/edgeReserve.js'].EDGE_ORDER).toBe(edgeReserve.EDGE_ORDER)
  })
})
