// Compuerta de la tabla única de movimiento: cada regla de `gate` falla ante una violación inventada (DECISIONS #1009).
import { describe, it, expect, afterAll } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { check, ROOT } from '../scripts/check-motion.mjs'

const motion = JSON.parse(readFileSync(resolve(ROOT, 'design/contracts/motion.json'), 'utf8'))
const dirs = []
const clone = () => structuredClone(motion)
// Un árbol mínimo: una hoja por archivo, con los componentes de `decl`
function tree(css, m) {
  const root = mkdtempSync(join(tmpdir(), 'grana-motion-'))
  dirs.push(root)
  for (const [file, text] of Object.entries(css)) {
    const dir = join(root, 'packages/vue/src/components', file.replace(/\.css$/, ''))
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, file), text)
  }
  m.components = Object.fromEntries(Object.keys(css).map((f) => [f.replace(/\.css$/, ''), { pieces: [] }]))
  m.easeUses = { spring: {}, bounce: {} }
  return root
}
const run = (css, edit = () => {}) => {
  const m = clone()
  const root = tree(css, m)
  edit(m)
  return check(m, root).fails.map((f) => f.rule)
}
afterAll(() => dirs.forEach((d) => rmSync(d, { recursive: true, force: true })))

describe('check-motion', () => {
  it('el árbol real pasa', () => {
    expect(check(motion).fails).toEqual([])
  })
  it('una hoja limpia pasa, y los comentarios no cuentan', () => {
    expect(run({ 'GX.css': '/* 300ms ease-in */ .a { transition: opacity var(--g-duration-fast) var(--g-ease-out); }' })).toEqual([])
  })
  it('literal-time: un tiempo a mano; 0s sí, 1ms solo en su archivo', () => {
    expect(run({ 'GX.css': '.a { transition: opacity 200ms; }' })).toEqual(['literal-time'])
    expect(run({ 'GX.css': '.a { transition-delay: 0s; }' })).toEqual([])
    expect(run({ 'GX.css': '.a { --x: calc(var(--n) * 1ms); }' })).toEqual(['literal-time'])
    expect(run({ 'GStatusIsland.css': '.a { --x: calc(var(--n) * 1ms); }' })).toEqual([])
  })
  it('literal-curve: una curva a mano; ni los tokens ni linear fallan', () => {
    expect(run({ 'GX.css': '.a { transition-timing-function: cubic-bezier(0.2, 0, 0, 1); }' })).toEqual(['literal-curve'])
    expect(run({ 'GX.css': '.a { animation-timing-function: ease-in-out; }' })).toEqual(['literal-curve'])
    expect(run({ 'GX.css': '.a { transition: opacity var(--g-duration-fast) var(--g-ease-out); animation-timing-function: linear; }' })).toEqual([])
  })
  it('ease-use: muelle fuera de la lista o con otra cuenta; y uso listado que no aparece', () => {
    const css = { 'GX.css': '.a { transition: translate var(--g-duration-slow) var(--g-ease-spring); }' }
    expect(run(css)).toEqual(['ease-use'])
    expect(run(css, (m) => { m.easeUses.spring['GX.css'] = { count: 1 } })).toEqual([])
    expect(run(css, (m) => { m.easeUses.spring['GX.css'] = { count: 2 } })).toEqual(['ease-use'])
    expect(run({ 'GX.css': '' }, (m) => { m.easeUses.bounce['GX.css'] = { count: 1 } })).toEqual(['ease-use'])
  })
  it('multiplier: sin registrar, en otro archivo, y los alias cuentan solo en su archivo', () => {
    expect(run({ 'GX.css': '.a { transition-duration: calc(var(--g-duration-slow) * 5); }' })).toEqual(['multiplier'])
    expect(run({ 'GX.css': '.a { animation-duration: calc(var(--g-duration-slow) * 4); }' })).toEqual(['multiplier'])
    expect(run({ 'GTable.css': '.a { animation-duration: calc(var(--g-duration-slow)   *   4); }' })).toEqual([])
    expect(run({ 'GSidebar.css': '.a { transition-delay: calc(var(--_stagger) * 9); }' })).toEqual(['multiplier'])
    expect(run({ 'GX.css': '.a { transition-delay: calc(var(--_stagger) * 9); }' })).toEqual([])
    expect(run({ 'GX.css': '.a { inline-size: calc(var(--g-space-1) * 5); }' })).toEqual([])
  })
  it('focus-ring: un retardo, otra duración o una transición de ancho fallan', () => {
    expect(run({ 'GX.css': '.a { transition: outline-color var(--g-duration-fast) var(--g-ease-standard); }' })).toEqual([])
    expect(run({ 'GX.css': '.a { transition: outline-color var(--g-duration-fast) var(--g-ease-standard) var(--g-duration-fast); }' })).toEqual(['focus-ring'])
    expect(run({ 'GX.css': '.a { transition: outline-color var(--g-duration-slow) var(--g-ease-out); }' })).toEqual(['focus-ring'])
    expect(run({ 'GX.css': '.a { transition: outline-width var(--g-duration-fast) var(--g-ease-standard); }' })).toEqual(['focus-ring'])
    expect(run({ 'GX.css': '.a { transition: outline-offset var(--g-duration-press) var(--g-ease-out); }' })).toEqual(['focus-ring'])
    expect(run({ 'GCheckbox.css': '.a { transition: outline-offset var(--g-duration-press) var(--g-ease-out); }' })).toEqual([])
  })
  it('component-declared: directorio sin clave y clave sin directorio', () => {
    expect(run({ 'GX.css': '' }, (m) => { delete m.components.GX })).toEqual(['component-declared'])
    expect(run({ 'GX.css': '' }, (m) => { m.components.GFantasma = { pieces: [] } })).toEqual(['component-declared'])
  })
  it('pieces-known: pieza y excepción desconocidas', () => {
    expect(run({ 'GX.css': '' }, (m) => { m.components.GX.pieces = ['cajon'] })).toEqual(['pieces-known'])
    expect(run({ 'GX.css': '' }, (m) => { m.components.GX.exceptions = ['inventada'] })).toEqual(['pieces-known'])
  })
  it('excludedFiles salta tiempos, curvas y multiplicadores, no el muelle', () => {
    expect(run({ 'GAvatarMotion.css': '.a { transition: opacity 3s ease-in; animation-delay: calc(var(--g-duration-fast) * 7); }' })).toEqual([])
    expect(run({ 'GAvatarMotion.css': '.a { transition-timing-function: var(--g-ease-spring); }' })).toEqual(['ease-use'])
  })
})
