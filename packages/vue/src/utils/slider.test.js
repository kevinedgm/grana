// utils/slider.js · motor del deslizador (slider.md «Motor», #456). Los casos salen de la referencia de kiwi
// (design/lab/slider/r01/engine.js) y de lo que añade B (parseTyped, refValues, merged, windowMove).
import { describe, it, expect } from 'vitest'
import {
  ACTION_KEYS, acceptTyped, bigStep, bottom, dec, decimalSeparator, fix, format, frac, hasTravel, isValidFormat,
  isValidLocale, keyAction, latin, limits, markGrid, merged, move, normalizeMarks, parseTyped, pick, pillText, places,
  refValues, snap, top, valueText, windowMove
} from './slider.js'

const O = (x = {}) => ({ min: 0, max: 100, step: 1, ...x })

describe('decimales sin error de coma flotante', () => {
  it('dec, places y fix', () => {
    expect(dec(1)).toBe(0)
    expect(dec(0.25)).toBe(2)
    expect(dec(1e-7)).toBe(7)
    expect(dec(1.5e-7)).toBe(8)
    expect(places(O({ step: 0.1, min: 0.25 }))).toBe(2)
    expect(fix(0.1 + 0.2, 1)).toBe(0.3)
  })
})

describe('rejilla desde min', () => {
  it('top: el último punto ≤ max (un max fuera de la rejilla no se alcanza, como el nativo)', () => {
    expect(top(O())).toBe(100)
    expect(top(O({ step: 3 }))).toBe(99)
    expect(top(O({ min: 0.1, max: 1, step: 0.2 }))).toBe(0.9)
    expect(bottom(O({ min: 5 }))).toBe(5)
  })
  it('sin recorrido (min ≥ max): top = min, frac = 0, snap y move no se mueven', () => {
    const o = O({ min: 10, max: 10 })
    expect(hasTravel(o)).toBe(false)
    expect(top(o)).toBe(10)
    expect(frac(10, o)).toBe(0)
    expect(snap(50, o)).toBe(10)
    expect(move(10, 1, 'step', o)).toBe(10)
  })
  it('snap: el punto más cercano dentro de los límites del asa, sin error de coma flotante', () => {
    expect(snap(42.4, O({ step: 5 }))).toBe(40)
    expect(snap(42.6, O({ step: 5 }))).toBe(45)
    expect(snap(0.30000000000000004, O({ max: 1, step: 0.1 }))).toBe(0.3)
    expect(snap(0.7, O({ max: 1, step: 0.1 }))).toBe(0.7)
    expect(snap(99, O({ step: 5 }), 0, 60)).toBe(60)
    expect(snap(101, O({ step: 3 }))).toBe(99)
    expect(snap(7, O({ min: 1, step: 2 }))).toBe(7)
    expect(snap(8, O({ min: 1, step: 2 }))).toBe(9)
  })
})

describe('paso grande', () => {
  it('sin valor: una décima del recorrido en pasos enteros, al menos uno', () => {
    expect(bigStep(O())).toBe(10)
    expect(bigStep(O({ step: 5 }))).toBe(10)
    expect(bigStep(O({ max: 10 }))).toBe(1)
    expect(bigStep(O({ max: 5 }))).toBe(1)
    expect(bigStep(O({ max: 1, step: 0.1 }))).toBe(0.1)
    expect(bigStep(O({ max: 5000, step: 50 }))).toBe(500)
  })
  it('con valor múltiplo de step, el suyo; si no lo es, la regla sin valor', () => {
    expect(bigStep(O({ step: 5, bigStep: 25 }))).toBe(25)
    expect(bigStep(O({ step: 5, bigStep: 7 }))).toBe(10)
    expect(bigStep(O({ step: 5, bigStep: -5 }))).toBe(10)
  })
})

describe('move', () => {
  it('secuencia de kiwi: → ↑ ← Mayús+→ Re Pág Av Pág ↓ Inicio Fin → desde 40 (step 5) = 45 50 45 55 65 55 50 0 100 100', () => {
    const o = O({ step: 5 })
    const keys = [['ArrowRight'], ['ArrowUp'], ['ArrowLeft'], ['ArrowRight', true], ['PageUp'], ['PageDown'], ['ArrowDown'], ['Home'], ['End'], ['ArrowRight']]
    let v = 40
    const out = []
    for (const [key, shiftKey] of keys) {
      const a = keyAction({ key, shiftKey })
      const [lo, hi] = limits([v], 0, o)
      v = a.kind === 'home' ? lo : a.kind === 'end' ? hi : move(v, a.dir, a.kind, o, lo, hi)
      out.push(v)
    }
    expect(out).toEqual([45, 50, 45, 55, 65, 55, 50, 0, 100, 100])
  })
  it('desde fuera de la rejilla: el primer paso cae en el punto siguiente en esa dirección (#157)', () => {
    const o = O({ step: 5 })
    expect(move(42, 1, 'step', o)).toBe(45)
    expect(move(42, -1, 'step', o)).toBe(40)
    expect(move(42, 1, 'big', o)).toBe(50)
  })
  it('desde fuera de los límites: el primer paso hacia dentro entra al límite', () => {
    const o = O({ step: 5 })
    expect(move(150, -1, 'step', o)).toBe(100)
    expect(move(-20, 1, 'step', o)).toBe(0)
  })
  it('sin error de coma flotante con decimales', () => {
    const o = O({ min: 0, max: 1, step: 0.1 })
    expect(move(0.2, 1, 'step', o)).toBe(0.3)
    expect(move(0.7, -1, 'step', o)).toBe(0.6)
  })
})

describe('snap="marks"', () => {
  const marks = [{ value: 10 }, { value: 25 }, { value: 50 }, { value: 100 }]
  const o = O({ min: 10, max: 100, marks, snap: 'marks' })
  it('las marcas son la rejilla: flechas de marca en marca, paso grande = dos marcas, puntero a la más cercana', () => {
    expect(markGrid(o)).toEqual([10, 25, 50, 100])
    expect(move(25, 1, 'step', o)).toBe(50)
    expect(move(25, -1, 'step', o)).toBe(10)
    expect(move(10, 1, 'big', o)).toBe(50)
    expect(move(100, 1, 'step', o)).toBe(100)
    expect(snap(70, o)).toBe(50)
    expect(snap(80, o)).toBe(100)
    expect(top(o)).toBe(100)
    expect(bottom(o)).toBe(10)
    expect(markGrid(O({ marks }))).toBe(null)
  })
})

describe('limits (rango)', () => {
  it('el inicio llega hasta fin − minGap y el fin baja hasta inicio + minGap', () => {
    const o = O({ max: 5000, step: 50, minGap: 200 })
    expect(limits([800, 2400], 0, o)).toEqual([0, 2200])
    expect(limits([800, 2400], 1, o)).toEqual([1000, 5000])
    expect(limits([800, 2400], 0, O({ max: 5000, step: 50 }))).toEqual([0, 2400])
    expect(limits([50], 0, o)).toEqual([0, 5000])
  })
  it('el rango se detiene: el inicio no pasa al fin', () => {
    const o = O({ step: 10 })
    const [lo, hi] = limits([40, 50], 0, o)
    expect(move(50, 1, 'step', o, lo, hi)).toBe(50)
  })
})

describe('keyAction', () => {
  it('LTR, RTL (← sube), Mayús, Re Pág/Av Pág, Inicio/Fin; Alt/Ctrl/Meta no se interceptan', () => {
    expect(keyAction({ key: 'ArrowRight' })).toEqual({ kind: 'step', dir: 1 })
    expect(keyAction({ key: 'ArrowLeft' }, { rtl: true })).toEqual({ kind: 'step', dir: 1 })
    expect(keyAction({ key: 'ArrowRight' }, { rtl: true })).toEqual({ kind: 'step', dir: -1 })
    expect(keyAction({ key: 'ArrowUp' }, { rtl: true })).toEqual({ kind: 'step', dir: 1 })
    expect(keyAction({ key: 'ArrowDown', shiftKey: true })).toEqual({ kind: 'big', dir: -1 })
    expect(keyAction({ key: 'PageUp' })).toEqual({ kind: 'big', dir: 1 })
    expect(keyAction({ key: 'PageDown' })).toEqual({ kind: 'big', dir: -1 })
    expect(keyAction({ key: 'Home' }).kind).toBe('home')
    expect(keyAction({ key: 'End' }).kind).toBe('end')
    expect(keyAction({ key: 'ArrowUp', ctrlKey: true })).toBe(null)
    expect(keyAction({ key: 'ArrowUp', altKey: true })).toBe(null)
    expect(keyAction({ key: 'ArrowUp', metaKey: true })).toBe(null)
    expect(keyAction({ key: 'a' })).toBe(null)
    expect(ACTION_KEYS.has('Home')).toBe(true)
    expect(ACTION_KEYS.has('Tab')).toBe(false)
  })
})

describe('formato y lectura', () => {
  it('es-MX con moneda y porcentaje como unidad; ar-EG con sus cifras y sin marcas bidi', () => {
    expect(format(2400, { locale: 'es-MX', format: { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 } })).toBe('$2,400')
    expect(format(40, { locale: 'es-MX', format: { style: 'unit', unit: 'percent' } })).toMatch(/^40\s?%$/)
    const ar = format(-40, { locale: 'ar-EG' })
    expect(ar).not.toMatch(/[‎‏؜]/)
    expect(ar).toContain('٤٠')
    expect(format(null, {})).toBe('')
  })
  it('locale null (SSR sin locale): el canónico', () => {
    expect(format(1234.5, { locale: null })).toBe('1234.5')
    expect(valueText(5, { locale: null, marks: [{ value: 5, label: 'Moderado' }] })).toBe('5, Moderado')
  })
  it('valueText: con marca con nombre «5, Moderado»; con valueText de la aplicación, lo suyo; sin elegir, emptyText', () => {
    const o = { locale: 'es', marks: [{ value: 0, label: 'Sin dolor' }, { value: 5, label: 'Moderado' }] }
    expect(valueText(5, o)).toBe('5, Moderado')
    expect(valueText(4, o)).toBe('4')
    expect(valueText(5, { ...o, valueText: (v) => `${v} de 10` })).toBe('5 de 10')
    expect(valueText(null, { ...o, emptyText: 'Sin elegir' })).toBe('Sin elegir')
    expect(pillText(5, o)).toBe('5')
    expect(pillText(200, { locale: 'es', valueText: (m) => `${Math.floor(m / 60)} h ${m % 60} min` })).toBe('3 h 20 min')
  })
  it('isValidLocale e isValidFormat', () => {
    expect(isValidLocale('es-MX')).toBe(true)
    expect(isValidLocale('no_es_un_idioma!!')).toBe(false)
    expect(isValidFormat('es', { style: 'currency' })).toBe(false)
    expect(isValidFormat('es', { style: 'currency', currency: 'MXN' })).toBe(true)
  })
  it('separador decimal del idioma', () => {
    expect(decimalSeparator('es')).toBe(',')
    expect(decimalSeparator('en')).toBe('.')
  })
})

describe('frac y pick', () => {
  it('frac acota al recorrido', () => {
    expect(frac(40, O())).toBe(0.4)
    expect(frac(150, O())).toBe(1)
    expect(frac(-5, O())).toBe(0)
    expect(frac(null, O())).toBe(0)
  })
  it('pick: la más cercana; empate exacto con asas juntas → null; juntas y a un lado → ese lado', () => {
    expect(pick([800, 2400], 1000)).toBe(0)
    expect(pick([800, 2400], 2000)).toBe(1)
    expect(pick([50, 50], 50)).toBe(null)
    expect(pick([50, 50], 30)).toBe(0)
    expect(pick([50, 50], 70)).toBe(1)
    expect(pick([40, 60], 50)).toBe(1)
    expect(pick([40], 10)).toBe(0)
  })
})

describe('teclear la cifra (B4)', () => {
  it('latin: cifras latinas, arábigo-índicas, persas y devanagari', () => {
    expect(latin('7')).toBe('7')
    expect(latin('٧')).toBe('7')
    expect(latin('۷')).toBe('7')
    expect(latin('७')).toBe('7')
    expect(latin('a')).toBe(null)
    expect(latin('12')).toBe(null)
  })
  it('parseTyped', () => {
    expect(parseTyped('35')).toBe(35)
    expect(parseTyped('-5')).toBe(-5)
    expect(parseTyped('2.')).toBe(2)
    expect(parseTyped('.5')).toBe(0.5)
    expect(parseTyped('')).toBe(null)
    expect(parseTyped('-')).toBe(null)
    expect(parseTyped('.')).toBe(null)
    expect(parseTyped('1.2.3')).toBe(null)
  })
  it('acceptTyped: separador solo con decimales; «-» solo primero y con min < 0; no más cifras que el límite', () => {
    expect(acceptTyped('', '.', O())).toBe(false)
    expect(acceptTyped('1', '.', O({ step: 0.5 }))).toBe(true)
    expect(acceptTyped('1.', '.', O({ step: 0.5 }))).toBe(false)
    expect(acceptTyped('1.5', '5', O({ step: 0.5 }))).toBe(false)
    expect(acceptTyped('', '-', O())).toBe(false)
    expect(acceptTyped('', '-', O({ min: -20 }))).toBe(true)
    expect(acceptTyped('1', '-', O({ min: -20 }))).toBe(false)
    expect(acceptTyped('10', '0', O())).toBe(true)
    expect(acceptTyped('100', '0', O())).toBe(false)
    expect(acceptTyped('-2', '0', O({ min: -20, max: 5 }))).toBe(true)
    expect(acceptTyped('', 'x', O())).toBe(false)
  })
})

describe('B: referencias, fusión y tramo', () => {
  it('refValues: primero, último, medio de la rejilla, −|último| con min < 0 y cada marca', () => {
    expect(refValues(O())).toEqual([0, 100, 50])
    expect(refValues(O({ min: -20, max: 40, step: 5 }))).toEqual([-20, 40, 10, -40])
    expect(refValues(O({ max: 10, marks: [{ value: 0, label: 'a' }, { value: 5 }] }))).toEqual([0, 10, 5])
  })
  it('merged: los centros a menos de un ancho de píldora', () => {
    expect(merged(0.4, 0.45, 400, 60)).toBe(true)
    expect(merged(0.2, 0.6, 400, 60)).toBe(false)
    expect(merged(0.4, 0.45, 0, 60)).toBe(false)
    expect(merged(0.4, 0.45, 400, 0)).toBe(false)
  })
  it('windowMove: conserva la anchura (1600 antes y después), en la rejilla y acotado al recorrido', () => {
    const o = O({ max: 5000, step: 50 })
    expect(windowMove(800, 2400, 333, o)).toEqual([1150, 2750])
    expect(windowMove(800, 2400, 9999, o)).toEqual([3400, 5000])
    expect(windowMove(800, 2400, -9999, o)).toEqual([0, 1600])
    const [a, b] = windowMove(800, 2400, 1234, o)
    expect(b - a).toBe(1600)
  })
})

describe('normalizeMarks', () => {
  it('true: una raya por punto si son ≤ 25; si no, una por paso grande', () => {
    expect(normalizeMarks(true, O({ max: 10 })).list.map((m) => m.value)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(normalizeMarks(true, O()).list.map((m) => m.value)).toEqual([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100])
    expect(normalizeMarks(true, O({ max: 1, step: 0.1 })).list).toHaveLength(11)
  })
  it('arreglo: números o { value, label }; fuera de [min, max] y repetidos aparte', () => {
    const r = normalizeMarks([0, { value: 5, label: 'Moderado' }, 5, 20, { value: 10, label: 'El peor' }], O({ max: 10 }))
    expect(r.list).toEqual([{ value: 0 }, { value: 5, label: 'Moderado' }, { value: 10, label: 'El peor' }])
    expect(r.outside).toEqual([20])
    expect(r.duplicates).toEqual([5])
    expect(normalizeMarks(false, O()).list).toEqual([])
  })
})
