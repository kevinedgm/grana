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
    // Avisos por stderr (density.md §16.5, H1, #992); por stdout solo el resumen ✔
    expect(r.err).toContain('space-small')
    expect(r.out).not.toContain('space-small')
    expect(r.out).toContain('cumple los mínimos')
  })
})

describe('H1 · avisos y notas por stderr (density.md §16.5, #992)', () => {
  // Una configuración con avisos (space-small) y notas (neutros teñidos, categorías, text-density)
  const noisy = { brand: '#7A1F5C', categories: 3, space: 3, fontSize: 15, overrides: { '--g-text-display-size': 'clamp(2rem, 5vw, 3rem)' } }

  it('theme --stdout: por stdout solo el CSS; avisos y notas en stderr; código 0 como antes', () => {
    cfg(noisy)
    const r = exec(['theme', 'grana.config.json', '--stdout'])
    expect(r.code).toBe(0)
    expect(r.out.startsWith('/* Generado por @grana/cli')).toBe(true)
    expect(r.out).not.toMatch(/[ℹ⚠✖✔]/)
    expect(r.err).toContain('⚠ aviso [space-small]')
    expect(r.err).toContain('ℹ ')
    expect(r.err).toContain('`--g-text-display-size` no es una longitud en rem o px: se queda igual en los tres pasos de densidad.')
  })

  it('theme sin --stdout: avisos y notas en stderr, el resumen ✔ en stdout', () => {
    cfg(noisy)
    const r = exec(['theme', 'grana.config.json'])
    expect(r.code).toBe(0)
    expect(r.out).toMatch(/^✔ tokens\.css: /)
    expect(r.out).not.toMatch(/[ℹ⚠]/)
    expect(r.err).toContain('space-small')
  })

  it('check --json no cambia: el informe entero por stdout', () => {
    cfg(noisy)
    const r = exec(['check', 'grana.config.json', '--json'])
    expect(r.code).toBe(0)
    expect(JSON.parse(r.out).warnings).toBeGreaterThan(0)
    expect(r.err).toBe('')
  })

  it('binario real: --stdout redirigido a un archivo da CSS válido con avisos presentes', () => {
    cfg(noisy)
    const bin = fileURLToPath(new URL('../bin/grana.mjs', import.meta.url))
    const p = spawnSync('node', [bin, 'theme', 'grana.config.json', '--stdout'], { cwd: dir, encoding: 'utf8' })
    expect(p.status).toBe(0)
    writeFileSync(join(dir, 't.css'), p.stdout)
    const css = readFileSync(join(dir, 't.css'), 'utf8')
    expect(css.startsWith('/* Generado por @grana/cli')).toBe(true)
    // La primera regla es `:root {` (tras los dos comentarios del CLI), sin ℹ ni ⚠ en el archivo
    expect(css.replace(/\/\*[\s\S]*?\*\//g, '').trimStart().startsWith(':root {')).toBe(true)
    expect(css).not.toMatch(/[ℹ⚠✖✔]/)
    // Llaves equilibradas: el archivo es CSS válido de principio a fin
    expect((css.match(/\{/g) ?? []).length).toBe((css.match(/\}/g) ?? []).length)
    expect(p.stderr).toContain('space-small')
    expect(p.stderr).toContain('ℹ ')
    // El código de salida de un tema inválido no cambia
    cfg({ overrides: { '--g-focus-width': '1px' } }, 'malo.json')
    expect(spawnSync('node', [bin, 'theme', 'malo.json', '--stdout'], { cwd: dir, encoding: 'utf8' }).status).toBe(1)
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
