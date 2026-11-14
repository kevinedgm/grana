// `grana catalog` (catalog.md C4 y C5). Sin red: proyectos falsos en directorios temporales con un
// node_modules/@grana/vue mínimo (package.json con exports y catalog.json).
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { run, HELP } from '../src/cli.js'
import { parseCatalogArgs, suggest } from '../src/catalog.js'

const CATALOG = {
  schemaVersion: 1,
  package: { name: '@grana/vue', version: '1.0.0' },
  entries: [
    { path: '@grana/vue', install: 'default', components: ['GBtn', 'GDatePicker', 'GStatus'], functions: ['createIcons'], types: 'dist/grana.d.ts' },
    { path: '@grana/vue/combobox', install: 'default', components: ['GCombobox'], functions: [], types: 'dist/combobox.d.ts' }
  ],
  components: [
    {
      name: 'GBtn', tag: 'g-btn', status: 'stable', since: '1.0.0', description: 'Botón de acción; se renderiza como enlace si recibe href.', entry: '@grana/vue', registered: true,
      props: [{ name: 'variant', type: 'String', ts: "'solid' | 'soft'", values: ['solid', 'soft'], default: 'solid' }, { name: 'label', type: 'String', ts: 'string', default: null, required: true, description: 'Nombre accesible' }],
      events: [{ name: 'click', payload: 'MouseEvent', ts: 'MouseEvent', description: 'Al pulsar' }],
      slots: [{ name: 'default', description: 'Contenido' }]
    },
    {
      name: 'GCombobox', tag: 'g-combobox', status: 'candidate', since: '1.0.0', description: 'Campo de búsqueda con resultados.', entry: '@grana/vue/combobox', registered: true,
      props: [{ name: 'modelValue', type: 'String', ts: 'string | null', default: null }],
      models: [{ prop: 'modelValue', directive: 'v-model' }],
      events: [{ name: 'update:modelValue', payload: 'String', ts: 'string | null', description: 'Al elegir' }],
      slots: [],
      methods: [{ name: 'open', signature: 'open(): void' }],
      labels: ['clear', 'close']
    },
    {
      name: 'GDatePicker', tag: 'g-datepicker', aliases: ['GDatepicker'], status: 'stable', since: '1.0.0', description: 'Selector de una fecha o de un rango.', entry: '@grana/vue', registered: true,
      props: [], events: [], slots: []
    },
    {
      name: 'GStatus', tag: 'g-status', status: 'draft', since: '1.0.0', description: 'Condición de estado.', entry: '@grana/vue', registered: false,
      props: [], events: [], slots: []
    }
  ],
  tokens: ['--g-color-brand', '--g-space-1'],
  icons: { library: ['check', 'x'], aliases: { 'circle-help': 'circle-question-mark' } },
  utilities: [{ class: 'g-m-0', group: 'margen' }]
}

let root
beforeEach(() => { root = mkdtempSync(join(tmpdir(), 'grana-catalog-')) })
afterEach(() => rmSync(root, { recursive: true, force: true }))

const put = (rel, content) => {
  mkdirSync(join(root, rel, '..'), { recursive: true })
  writeFileSync(join(root, rel), typeof content === 'string' ? content : `${JSON.stringify(content, null, 2)}\n`)
}
const project = ({ catalog = CATALOG, exportsCatalog = true, version = '1.0.0', raw } = {}) => {
  put('package.json', { name: 'app', dependencies: { '@grana/vue': `^${version}` } })
  const exp = { '.': './dist/grana.js', './package.json': './package.json' }
  if (exportsCatalog) exp['./catalog.json'] = './dist/catalog.json'
  put('node_modules/@grana/vue/package.json', { name: '@grana/vue', version, type: 'module', exports: exp })
  if (exportsCatalog) put('node_modules/@grana/vue/dist/catalog.json', raw ?? catalog)
}
const cat = (args, cwd = root) => {
  let out = ''
  let err = ''
  const code = run(['catalog', ...args], { cwd, out: (s) => (out += s), err: (s) => (err += s), version: '1.0.0' })
  return { code, out, err }
}
const snapshot = (d) => readdirSync(d, { recursive: true }).sort().map((f) => [f, statSync(join(d, f)).mtimeMs])

describe('catalog · lista y detalle', () => {
  beforeEach(() => project())

  it('lista → 0, agrupada por entrada, con versión y ruta, estados marcados', () => {
    const r = cat([])
    expect(r.code).toBe(0)
    expect(r.err).toBe('')
    expect(r.out.split('\n')[0]).toMatch(/^@grana\/vue 1\.0\.0 · .*node_modules\/@grana\/vue\/dist\/catalog\.json$/)
    expect(r.out).toContain('@grana/vue/combobox')
    expect(r.out).toMatch(/GCombobox {2}<g-combobox> {2}\[candidate\]/)
    expect(r.out).toMatch(/GStatus .*\[draft\]/)
    expect(r.out).toMatch(/GStatus .*\[importar\]/)
    expect(r.out).not.toMatch(/GBtn .*\[stable\]/)
  })

  it('detalle por nombre, alias y etiqueta, sin distinguir mayúsculas → 0', () => {
    for (const q of ['GBtn', 'gbtn', 'g-btn', 'G-BTN']) {
      const r = cat([q])
      expect(r.code, q).toBe(0)
      expect(r.out).toContain("variant: 'solid' | 'soft'  (por defecto solid)")
      expect(r.out).toContain('label: string  (obligatoria)')
      expect(r.out).toContain("import { GBtn } from '@grana/vue'")
      expect(r.out).toContain("app.use(Grana)")
    }
    expect(cat(['GDatepicker']).out).toContain('GDatePicker  <g-datepicker>')
    expect(cat(['g-datepicker']).code).toBe(0)
    const cb = cat(['GCombobox'])
    expect(cb.out).toContain('v-model  (prop modelValue)')
    expect(cb.out).toContain('open(): void')
    expect(cb.out).toContain('Claves de labels: clear, close')
  })

  it('pieza inexistente → 1 con sugerencias por la salida de error', () => {
    const r = cat(['GBton'])
    expect(r.code).toBe(1)
    expect(r.out).toBe('')
    expect(r.err).toContain('No existe «GBton»')
    expect(r.err).toContain('GBtn')
    expect(suggest(CATALOG, 'GDatepickr')).toContain('GDatePicker')
    expect(suggest(CATALOG, 'GNoExiste').length).toBeLessThanOrEqual(5)
  })

  it('--find con y sin resultados → 0 / 1, sin distinguir acentos', () => {
    const r = cat(['--find', 'boton'])
    expect(r.code).toBe(0)
    expect(r.out).toContain('GBtn')
    expect(r.out).not.toContain('GCombobox')
    expect(cat(['--find', 'BÚSQUEDA']).out).toContain('GCombobox')
    expect(cat(['--find=fecha']).out).toContain('GDatePicker')
    const none = cat(['--find', 'zzz'])
    expect(none.code).toBe(1)
    expect(none.err).toContain('Ninguna pieza coincide')
  })

  it('--entry y --status filtran; una lista filtrada vacía es 0', () => {
    expect(cat(['--entry', '@grana/vue/combobox']).out).not.toContain('GBtn')
    expect(cat(['--entry', 'combobox']).out).toContain('GCombobox')
    const d = cat(['--status', 'draft'])
    expect(d.out).toContain('GStatus')
    expect(d.out).not.toContain('GBtn')
    const empty = cat(['--entry', 'combobox', '--status', 'draft'])
    expect(empty.code).toBe(0)
    expect(empty.out).toContain('0 piezas')
  })

  it('secciones', () => {
    expect(cat(['--tokens']).out).toContain('  --g-color-brand')
    expect(cat(['--icons']).out).toContain('circle-help → circle-question-mark')
    expect(cat(['--utilities']).out).toContain('g-m-0  (margen)')
  })
})

describe('catalog · --json', () => {
  beforeEach(() => project({ raw: `${JSON.stringify(CATALOG, null, 2)}\n` }))

  it('sin argumentos es byte a byte el archivo', () => {
    const raw = `${JSON.stringify(CATALOG, null, 2)}\n`
    expect(cat(['--json']).out).toBe(raw)
  })
  it('pieza, búsqueda, filtros y secciones con el esquema de C1', () => {
    expect(JSON.parse(cat(['GBtn', '--json']).out)).toEqual(CATALOG.components[0])
    expect(JSON.parse(cat(['--find', 'fecha', '--json']).out)).toEqual({ components: [CATALOG.components[2]] })
    expect(JSON.parse(cat(['--status', 'candidate', '--json']).out).components.map((c) => c.name)).toEqual(['GCombobox'])
    expect(JSON.parse(cat(['--tokens', '--json']).out)).toEqual(CATALOG.tokens)
    expect(JSON.parse(cat(['--icons', '--json']).out)).toEqual(CATALOG.icons)
    expect(JSON.parse(cat(['--utilities', '--json']).out)).toEqual(CATALOG.utilities)
    const none = cat(['--find', 'zzz', '--json'])
    expect(none.code).toBe(1)
    expect(JSON.parse(none.out)).toEqual({ components: [] })
    const missing = cat(['GNada', '--json'])
    expect(missing.code).toBe(1)
    expect(missing.out).toBe('')
  })
})

describe('catalog · --agents', () => {
  it('imprime el bloque con versión, reglas y órdenes, y no escribe nada', () => {
    project()
    const before = snapshot(root)
    const r = cat(['--agents'])
    expect(r.code).toBe(0)
    expect(r.out).toContain('@grana/vue 1.0.0')
    expect(r.out).toContain('npx grana catalog --find')
    expect(r.out).toMatch(/\n1\. Usa solo piezas/)
    expect(r.out).toMatch(/\n6\. Respeta las props obligatorias/)
    expect(snapshot(root)).toEqual(before)
  })
})

describe('catalog · código 2', () => {
  it('sin @grana/vue', () => {
    put('package.json', { name: 'app' })
    const r = cat([])
    expect(r.code).toBe(2)
    expect(r.err).toContain('no está instalado')
    expect(r.err).toContain('npx grana init')
  })
  it('@grana/vue sin ./catalog.json en exports → 2 con la versión', () => {
    project({ exportsCatalog: false, version: '0.9.0' })
    const r = cat(['GBtn'])
    expect(r.code).toBe(2)
    expect(r.err).toContain('@grana/vue 0.9.0 no trae catálogo')
    expect(r.err).toContain('1.0.0')
  })
  it('JSON roto → 2', () => {
    project({ raw: '{ roto' })
    expect(cat([]).code).toBe(2)
  })
  it('schemaVersion 2 → 2, pide actualizar @grana/cli', () => {
    project({ catalog: { ...CATALOG, schemaVersion: 2 } })
    const r = cat([])
    expect(r.code).toBe(2)
    expect(r.err).toContain('@grana/cli')
  })
  it('opciones inválidas y combinaciones prohibidas', () => {
    project()
    const bad = [
      ['--nope'], ['GBtn', 'GInput'], ['GBtn', '--find', 'x'], ['--find'], ['--status', 'beta'], ['--entry', 'no-existe'],
      ['--tokens', '--icons'], ['GBtn', '--tokens'], ['--tokens', '--find', 'x'], ['--agents', 'GBtn'], ['--agents', '--json'],
      ['--agents', '--tokens'], ['--agents', '--find', 'x'], ['GBtn', '--status', 'stable']
    ]
    for (const args of bad) expect(cat(args).code, args.join(' ')).toBe(2)
    expect(() => parseCatalogArgs(['--find', '--json'])).toThrow()
  })
  it('la resolución sube por las carpetas del proyecto', () => {
    project()
    mkdirSync(join(root, 'src', 'deep'), { recursive: true })
    expect(cat(['GBtn'], join(root, 'src', 'deep')).code).toBe(0)
  })
})

describe('catalog · ayuda y binario', () => {
  it('--help imprime la ayuda con catalog', () => {
    const r = cat(['--help'])
    expect(r.code).toBe(0)
    expect(r.out).toBe(HELP)
    expect(HELP).toContain('grana catalog [<pieza>]')
  })
  it('el ejecutable real devuelve 0 / 1 / 2', () => {
    project()
    const bin = fileURLToPath(new URL('../bin/grana.mjs', import.meta.url))
    const sh = (args) => spawnSync(process.execPath, [bin, 'catalog', ...args], { cwd: root, encoding: 'utf8' }).status
    expect(sh(['GBtn'])).toBe(0)
    expect(sh(['GNoExiste'])).toBe(1)
    expect(sh(['--nope'])).toBe(2)
  })
})
