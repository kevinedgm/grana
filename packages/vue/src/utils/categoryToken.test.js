import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import GAvatar from '../components/GAvatar/GAvatar.vue'
import GTag from '../components/GTag/GTag.vue'
import { resetCategoryWarnings, warnMissingCategory } from './categoryToken.js'

let spy
beforeEach(() => { resetCategoryWarnings(); spy = vi.spyOn(console, 'warn').mockImplementation(() => {}) })
afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })
// jsdom no hereda propiedades personalizadas: el token se pone en el propio elemento (un navegador real lo hereda de :root)
const tok = (...ks) => ks.map((k) => `--g-color-cat-${k}: #123456`).join(';')
const mk = (c, props, style) => mount(c, { props, attrs: style ? { style } : {}, attachTo: document.body })
const warns = (who) => spy.mock.calls.filter((c) => String(c[0]).includes(`[Grana ${who}]`) && String(c[0]).includes('--g-color-cat-'))

describe('aviso de categoría sin token', () => {
  it('GAvatar con categories y sin --g-color-cat-N avisa una sola vez por número', () => {
    mk(GAvatar, { name: 'Ana Pérez', categories: 8 })
    mk(GAvatar, { name: 'Ana Pérez', categories: 8 })
    expect(warns('GAvatar')).toHaveLength(1)
    expect(String(warns('GAvatar')[0][0])).toMatch(/categories: N/)
  })
  it('GAvatar con color fijo sin token avisa, y otro número da otro aviso', () => {
    mk(GAvatar, { name: 'A', color: 3 })
    mk(GAvatar, { name: 'B', color: 5 })
    expect(warns('GAvatar')).toHaveLength(2)
  })
  it('GAvatar no avisa si el token existe', () => {
    mk(GAvatar, { name: 'A', color: 3 }, tok(3))
    expect(warns('GAvatar')).toHaveLength(0)
  })
  it('GAvatar neutro o sin categories no avisa', () => {
    mk(GAvatar, { name: 'A' })
    mk(GAvatar, { name: 'A', color: 'neutral', categories: 8 })
    expect(warns('GAvatar')).toHaveLength(0)
  })
  it('GTag con categories sin token avisa; con token no', () => {
    mk(GTag, { label: 'Urgente', categories: 6 })
    expect(warns('GTag')).toHaveLength(1)
    resetCategoryWarnings(); spy.mockClear()
    mk(GTag, { label: 'x', color: 1 }, tok(1))
    expect(warns('GTag')).toHaveLength(0)
  })
  it('sin elemento (SSR) o en producción no hace nada', () => {
    warnMissingCategory(null, 2, 'GAvatar')
    expect(spy).not.toHaveBeenCalled()
    const prev = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    try { mk(GAvatar, { name: 'A', color: 2 }) } finally { process.env.NODE_ENV = prev }
    expect(warns('GAvatar')).toHaveLength(0)
  })
})
