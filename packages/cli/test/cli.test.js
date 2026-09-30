import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { run } from '../src/cli.js'

let dir
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'grana-cli-')) })
afterEach(() => rmSync(dir, { recursive: true, force: true }))

const cfg = (obj, name = 'grana.config.json') => { writeFileSync(join(dir, name), JSON.stringify(obj)); return name }
const exec = (argv) => {
  let out = '', err = ''
  const code = run(argv, { cwd: dir, out: (s) => (out += s), err: (s) => (err += s) })
  return { code, out, err }
}

describe('grana theme', () => {
  it('escribe tokens.css y sale con 0', () => {
    cfg({ brand: '#7A1F5C', accent: '#0F766E', radius: 12, space: 5 })
    const r = exec(['theme', 'grana.config.json'])
    expect(r.code).toBe(0)
    expect(r.out).toContain('tokens.css')
    const css = readFileSync(join(dir, 'tokens.css'), 'utf8')
    expect(css).toContain(':root {')
    expect(css).toContain('--g-color-brand: #7A1F5C;')
    expect(css).toContain('--g-space-1: 5px;')
  })

  it('--out cambia el destino y --stdout no escribe archivos', () => {
    cfg({ space: 5 })
    expect(exec(['theme', 'grana.config.json', '--out', 'salida.css']).code).toBe(0)
    expect(existsSync(join(dir, 'salida.css'))).toBe(true)
    const r = exec(['theme', 'grana.config.json', '--stdout'])
    expect(r.out).toContain('--g-space-1: 5px;')
    expect(existsSync(join(dir, 'tokens.css'))).toBe(false)
  })

  it('un tema que rompe un mínimo sale con 1, explica y NO escribe nada', () => {
    cfg({ overrides: { '--g-focus-width': '1px' } })
    const r = exec(['theme', 'grana.config.json'])
    expect(r.code).toBe(1)
    expect(r.err).toContain('focus-width')
    expect(r.err).toContain('Por qué')
    expect(r.err).toContain('No se escribió nada')
    expect(existsSync(join(dir, 'tokens.css'))).toBe(false)
  })

  it('una configuración inválida sale con 2', () => {
    cfg({ colour: 'red' })
    const r = exec(['theme', 'grana.config.json'])
    expect(r.code).toBe(2)
    expect(r.err).toContain('colour')
    expect(existsSync(join(dir, 'tokens.css'))).toBe(false)
  })

  it('un archivo inexistente o con JSON roto sale con 2', () => {
    expect(exec(['theme', 'nada.json']).code).toBe(2)
    writeFileSync(join(dir, 'roto.json'), '{ no es json')
    expect(exec(['theme', 'roto.json']).code).toBe(2)
  })
})

describe('grana check', () => {
  it('correcto: sale con 0 y no escribe', () => {
    cfg({ brand: '#7A1F5C' })
    const r = exec(['check', 'grana.config.json'])
    expect(r.code).toBe(0)
    expect(r.out).toContain('cumple los mínimos')
    expect(existsSync(join(dir, 'tokens.css'))).toBe(false)
  })

  it('--json imprime el informe con errores y avisos', () => {
    cfg({ space: 3, overrides: { '--g-color-text-muted': '#BBBBBB' } })
    const r = exec(['check', 'grana.config.json', '--json'])
    expect(r.code).toBe(1)
    const rep = JSON.parse(r.out)
    expect(rep.ok).toBe(false)
    expect(rep.errors).toBeGreaterThan(0)
    expect(rep.warnings).toBeGreaterThan(0)
    expect(rep.issues[0]).toHaveProperty('why')
  })

  it('los avisos no cambian el código de salida', () => {
    cfg({ space: 3 })
    const r = exec(['check', 'grana.config.json'])
    expect(r.code).toBe(0)
    expect(r.out).toContain('space-small')
  })
})

describe('uso', () => {
  it('sin argumentos, ayuda y 2; --help, 0; --version imprime la versión', () => {
    expect(exec([]).code).toBe(2)
    expect(exec(['--help']).out).toContain('grana theme')
    expect(exec(['--help']).code).toBe(0)
    expect(exec(['--version']).out).toBe('0.0.0\n')
  })

  it('comando u opción desconocidos, o argumentos de más, salen con 2', () => {
    expect(exec(['build', 'x.json']).code).toBe(2)
    expect(exec(['theme']).code).toBe(2)
    expect(exec(['theme', 'a.json', 'b.json']).code).toBe(2)
    expect(exec(['theme', 'a.json', '--nope']).code).toBe(2)
  })
})

describe('binario', () => {
  it('el ejecutable real escribe tokens.css y devuelve el código de salida', () => {
    cfg({ brand: '#7A1F5C' })
    const bin = fileURLToPath(new URL('../bin/grana.mjs', import.meta.url))
    const ok = spawnSync('node', [bin, 'theme', 'grana.config.json'], { cwd: dir, encoding: 'utf8' })
    expect(ok.status).toBe(0)
    expect(existsSync(join(dir, 'tokens.css'))).toBe(true)
    cfg({ overrides: { '--g-focus-width': '1px' } }, 'malo.json')
    const bad = spawnSync('node', [bin, 'check', 'malo.json'], { cwd: dir, encoding: 'utf8' })
    expect(bad.status).toBe(1)
    expect(bad.stderr).toContain('focus-width')
  })
})
