// Motor de `multiple` (multi.js): funciones puras. combobox.md «Fase 2 · Modelo» (#420) y «Clases y datos» (#429)
import { describe, it, expect, vi } from 'vitest'
import { keyOf, keyOfText, normCustom, normValues, reconcile, resolveWidth, sameList } from './multi.js'

describe('multi.js', () => {
  it('keyOf distingue 1 de \'1\'; keyOfText pliega acentos y mayúsculas', () => {
    expect(keyOf(1)).not.toBe(keyOf('1'))
    expect(keyOfText('Látex')).toBe(keyOfText('latex'))
  })
  it('normValues: null/undefined/\'\' → [] sin aviso; no arreglo → [v] con aviso; repetidos una vez con aviso', () => {
    const warn = vi.fn()
    expect(normValues(null, warn)).toEqual([])
    expect(normValues('', warn)).toEqual([])
    expect(warn).not.toHaveBeenCalled()
    expect(normValues('a', warn)).toEqual(['a'])
    expect(warn).toHaveBeenLastCalledWith('array')
    expect(normValues(['a', 1, 'a', null, '1'], warn)).toEqual(['a', 1, '1'])
    expect(warn).toHaveBeenLastCalledWith('dup')
  })
  it('normCustom: recorta, quita vacíos y repetidos sin acentos ni mayúsculas', () => {
    const warn = vi.fn()
    expect(normCustom([' Polen ', 'polen', '', 3, 'Moho'], warn)).toEqual(['Polen', 'Moho'])
    expect(warn).toHaveBeenCalledWith('dup')
  })
  it('sameList compara por posición con ===', () => {
    expect(sameList([1, 'a'], [1, 'a'])).toBe(true)
    expect(sameList([1], ['1'])).toBe(false)
    expect(sameList([1, 2], [2, 1])).toBe(false)
  })
  it('reconcile: vivos en el orden de lo elegido (reutilizando entradas) y rastros en el sitio que ocupaban', () => {
    let n = 0
    const make = (it) => ({ key: it.key, item: it, uid: ++n, trace: null })
    const a = { key: 'a' }, b = { key: 'b' }, c = { key: 'c' }
    const l1 = reconcile([], [a, b, c], make)
    expect(l1.map((e) => e.uid)).toEqual([1, 2, 3])
    l1[1].trace = { it: b, at: 1 }
    const l2 = reconcile(l1, [a, c], make)
    expect(l2.map((e) => [e.key, Boolean(e.trace)])).toEqual([['a', false], ['b', true], ['c', false]])
    const l3 = reconcile(l2, [a, b, c], make)
    expect(l3.map((e) => [e.uid, Boolean(e.trace)])).toEqual([[1, false], [2, false], [3, false]])
    const l4 = reconcile(l3, [a, b, c, { key: 'd' }], make)
    expect(l4.at(-1).uid).toBe(4)
  })
  it('resolveWidth: px, %, calc(% ± px) y lo demás, la celda entera', () => {
    expect(resolveWidth('120px', 300)).toBe(120)
    expect(resolveWidth('55%', 200)).toBe(110)
    expect(resolveWidth('calc(100% - 19.2px)', 200)).toBeCloseTo(180.8)
    expect(resolveWidth('none', 300)).toBe(300)
  })
})
