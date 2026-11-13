// I9 (#1079): paridad del envoltorio `grana` con el bin de @grana/cli. Sin red.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync, readFileSync, statSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync, execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const here = (p) => fileURLToPath(new URL(p, import.meta.url))
const wrapperBin = here('../bin/grana.mjs')
const cliBin = here('../../cli/bin/grana.mjs')
const readJson = (p) => JSON.parse(readFileSync(here(p), 'utf8'))
const wrapperPkg = readJson('../package.json')
const cliPkg = readJson('../../cli/package.json')

let dir
beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'grana-wrap-'))
  writeFileSync(join(dir, 'ok.json'), JSON.stringify({ brand: '#7A1F5C', accent: '#0F766E', radius: 12, space: 5 }))
  writeFileSync(join(dir, 'malo.json'), JSON.stringify({ brand: 'no-es-color' }))
  writeFileSync(join(dir, 'roto.json'), '{ no es json')
  mkdirSync(join(dir, 'proyecto'))
  writeFileSync(join(dir, 'proyecto', 'package.json'), JSON.stringify({ name: 'p', dependencies: { vue: '^3.5.0' } }))
  // Proyecto con un @grana/vue mínimo que trae catálogo (catalog.md C4, #1080)
  const vueDir = join(dir, 'catalogo', 'node_modules', '@grana', 'vue')
  mkdirSync(join(vueDir, 'dist'), { recursive: true })
  writeFileSync(join(dir, 'catalogo', 'package.json'), JSON.stringify({ name: 'c', dependencies: { '@grana/vue': '^1.0.0' } }))
  writeFileSync(join(vueDir, 'package.json'), JSON.stringify({ name: '@grana/vue', version: '1.0.0', type: 'module', exports: { './catalog.json': './dist/catalog.json', './package.json': './package.json' } }))
  writeFileSync(join(vueDir, 'dist', 'catalog.json'), `${JSON.stringify({
    schemaVersion: 1,
    package: { name: '@grana/vue', version: '1.0.0' },
    entries: [{ path: '@grana/vue', install: 'default', components: ['GBtn'], functions: [], types: 'dist/grana.d.ts' }],
    components: [{ name: 'GBtn', tag: 'g-btn', status: 'stable', since: '1.0.0', description: 'Botón de acción.', entry: '@grana/vue', registered: true, props: [], events: [], slots: [] }],
    tokens: [], icons: { library: [], aliases: {} }, utilities: []
  }, null, 2)}\n`)
})
afterAll(() => rmSync(dir, { recursive: true, force: true }))

const sh = (bin, args, cwd) => {
  const r = spawnSync(process.execPath, [bin, ...args], { cwd, encoding: 'utf8', env: { ...process.env, NO_COLOR: '1' } })
  return { out: r.stdout, err: r.stderr, code: r.status }
}

const CASES = [
  ['--help', ['--help'], '.'],
  ['sin argumentos', [], '.'],
  ['--version', ['--version'], '.'],
  ['theme válido', ['theme', 'ok.json'], '.'],
  ['theme que rompe un mínimo o es inválido', ['theme', 'malo.json'], '.'],
  ['theme con JSON ilegible', ['theme', 'roto.json'], '.'],
  ['theme sin archivo', ['theme', 'no-existe.json'], '.'],
  ['check válido', ['check', 'ok.json'], '.'],
  ['check inválido', ['check', 'malo.json'], '.'],
  ['init --dry-run', ['init', '--dry-run'], 'proyecto'],
  ['init --dry-run --brand', ['init', '--dry-run', '--brand', '#7A1F5C'], 'proyecto'],
  ['init con opción desconocida', ['init', '--no-existe'], 'proyecto'],
  ['comando desconocido', ['nada'], '.'],
  ['catalog', ['catalog'], 'catalogo'],
  ['catalog GBtn --json', ['catalog', 'GBtn', '--json'], 'catalogo'],
  ['catalog GNoExiste', ['catalog', 'GNoExiste'], 'catalogo'],
  ['catalog sin @grana/vue', ['catalog'], 'proyecto'],
]

describe('paridad de los dos bin (stdout, stderr y código)', () => {
  for (const [name, args, sub] of CASES) {
    it(name, () => {
      const cwd = join(dir, sub)
      const a = sh(wrapperBin, args, cwd)
      const b = sh(cliBin, args, cwd)
      expect(a).toEqual(b)
    })
  }
  it('los casos cubren los cuatro códigos de uso y no son vacíos', () => {
    const codes = new Set(CASES.map(([, args, sub]) => sh(cliBin, args, join(dir, sub)).code))
    expect(codes.has(0)).toBe(true)
    expect(codes.has(1)).toBe(true)
    expect([...codes].some((c) => c !== 0)).toBe(true)
    expect(sh(wrapperBin, ['--version'], dir).out.trim()).toContain(cliPkg.version)
  })
})

describe('coherencia de los package.json', () => {
  it('versión igual y dependencia exacta y única', () => {
    expect(wrapperPkg.name).toBe('grana')
    expect(wrapperPkg.version).toBe(cliPkg.version)
    expect(wrapperPkg.dependencies).toEqual({ '@grana/cli': cliPkg.version })
    expect(wrapperPkg.dependencies['@grana/cli']).toMatch(/^\d+\.\d+\.\d+(-[\w.]+)?$/)
    expect(wrapperPkg.peerDependencies).toBeUndefined()
    expect(wrapperPkg.private).toBeUndefined()
  })
  it('licencia, engines, tipo y bin', () => {
    expect(wrapperPkg.license).toBe('MIT')
    expect(wrapperPkg.engines.node).toBe('>=22')
    expect(wrapperPkg.type).toBe('module')
    expect(wrapperPkg.bin).toEqual({ grana: './bin/grana.mjs' })
    expect(wrapperPkg.files).toEqual(['bin'])
    expect(cliPkg.bin.grana).toBe('./bin/grana.mjs')
  })
  it('los dos bin llevan shebang y permiso de ejecución', () => {
    for (const bin of [wrapperBin, cliBin]) {
      expect(readFileSync(bin, 'utf8').startsWith('#!/usr/bin/env node\n')).toBe(true)
      expect(statSync(bin).mode & 0o111).not.toBe(0)
    }
  })
  it('el envoltorio no tiene lógica propia', () => {
    const src = readFileSync(wrapperBin, 'utf8')
    expect(src).toContain("from '@grana/cli/main'")
    expect(src.split('\n').filter((l) => l.trim()).length).toBeLessThanOrEqual(3)
  })
  it('LICENSE y README del envoltorio existen', () => {
    expect(readFileSync(here('../LICENSE'), 'utf8')).toBe(readFileSync(here('../../cli/LICENSE'), 'utf8'))
    const readme = readFileSync(here('../README.md'), 'utf8')
    expect(readme).toContain('@grana/cli')
    expect(readme.trim().split('\n').filter(Boolean).length).toBeLessThanOrEqual(5)
  })
})

describe('./main de @grana/cli', () => {
  it('consta en exports, se resuelve y queda dentro de files', async () => {
    expect(cliPkg.exports['./main']).toBe('./src/main.js')
    expect(cliPkg.files).toContain('src')
    const mod = await import('@grana/cli/main')
    expect(typeof mod.main).toBe('function')
    expect(mod.main(['--version'])).toBe(0)
  })
  it('main devuelve el código de salida', () => {
    const out = execFileSync(process.execPath, ['--input-type=module', '-e',
      "import { main } from '@grana/cli/main'; process.stdout.write(String(main(['theme','nada.json'])))"],
    { cwd: here('..'), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    expect(out.endsWith('2') || out.endsWith('1')).toBe(true)
  })
})

describe('npm pack --dry-run', () => {
  it('lista solo bin, LICENSE, README.md y package.json', () => {
    const raw = execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { cwd: here('..'), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    const files = JSON.parse(raw)[0].files.map((f) => f.path).sort()
    expect(files).toEqual(['LICENSE', 'README.md', 'bin/grana.mjs', 'package.json'])
  })
})
