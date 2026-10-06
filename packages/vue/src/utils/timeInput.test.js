// Motor de hora (utils/timeInput.js) · design/contracts/time-field.md «Motor», «Escritura e interpretación», «Teclado»
// (DECISIONS.md #401 a #408). Idiomas es, es-MX, en-US, fi, ko, he, ar-EG; filtro; la tabla de interpretación entera;
// ambigüedad en 12 h y 24 h; franjas; canónico; aria-valuetext; pasos con rejilla, vuelta y arcos.
import { describe, it, expect } from 'vitest'
import {
  DAY, canonical, duration, filterTyped, formatTime, fromCanonical, hasSeconds, inArc, isValidLocale, localeInfo, parseTime,
  period, stepTime, toLatin, valueText
} from './timeInput.js'

const S = (hhmm) => fromCanonical(hhmm.length === 5 || hhmm.length === 8 ? hhmm : `0${hhmm}`)
const es = localeInfo('es')
const mx = localeInfo('es-MX')
const en = localeInfo('en-US')
const fi = localeInfo('fi')
const ko = localeInfo('ko')
const he = localeInfo('he')
const ar = localeInfo('ar-EG')
const P = (raw, info = es, o) => {
  const r = parseTime(raw, info, o)
  return r.status === 'ok' ? canonical(r.value, Boolean(o?.seconds)) : r.status
}

describe('timeInput · idioma', () => {
  it('ciclo, cifras, separador y orden de la mitad del día', () => {
    expect([es.cycle, mx.cycle, en.cycle, fi.cycle, ko.cycle, he.cycle, ar.cycle]).toEqual(['h23', 'h12', 'h12', 'h23', 'h12', 'h23', 'h12'])
    expect(formatTime(S('21:30'), es)).toBe('21:30')
    expect(formatTime(S('09:07'), es)).toBe('9:07')
    expect(formatTime(S('21:30'), mx)).toMatch(/^9:30\s?p\.\s?m\.$/)
    expect(formatTime(S('21:30'), fi)).toBe('21.30')
    expect(formatTime(S('21:30'), ko)).toBe('오후 9:30')
    expect(ko.periodFirst).toBe(true)
    expect(mx.periodFirst).toBe(false)
    expect(formatTime(S('21:30'), ar)).toBe('٩:٣٠ م')
    expect(ar.digits[9]).toBe('٩')
    expect(formatTime(S('14:05:30'), es, true)).toBe('14:05:30')
  })
  it('sin marcas bidi y cualquier espacio antes del marcador', () => {
    for (const info of [ar, he, mx]) expect(/[‎‏؜]/.test(formatTime(S('21:30'), info))).toBe(false)
    expect(P('9:30 p. m.', mx)).toBe('21:30')
    expect(P('9:30 p. m.', mx)).toBe('21:30')
  })
  it('dirección del idioma', () => {
    expect([es.dir, ar.dir, he.dir, ko.dir]).toEqual(['ltr', 'rtl', 'rtl', 'ltr'])
  })
  it('marcadores del idioma', () => {
    expect(mx.amKey).toBe('am')
    expect(mx.pmKey).toBe('pm')
    expect(ko.amKey).toBe('오전')
    expect(ko.pmKey).toBe('오후')
    expect(ar.pmKey).toBe('م')
  })
  it('franjas del día en palabras (CLDR)', () => {
    expect(period(S('03:00'), es)).toBe('de la madrugada')
    expect(period(S('09:00'), es)).toBe('de la mañana')
    expect(period(S('12:00'), es)).toBe('del mediodía')
    expect(period(S('21:30'), es)).toBe('de la noche')
    expect(period(null, es)).toBe('')
  })
  it('hourCycle fuerza el ciclo; locale inválido lanza', () => {
    expect(localeInfo('es', 'h12').cycle).toBe('h12')
    expect(localeInfo('es-MX', 'h23').cycle).toBe('h23')
    expect(formatTime(S('21:30'), localeInfo('es-MX', 'h23'))).toBe('21:30')
    expect(isValidLocale('es')).toBe(true)
    expect(isValidLocale('xx-invalid-!!')).toBe(false)
  })
})

describe('timeInput · canónico', () => {
  it('ida y vuelta, formatos inválidos → null', () => {
    expect(canonical(S('09:07'))).toBe('09:07')
    expect(canonical(fromCanonical('14:05:30'), true)).toBe('14:05:30')
    expect(canonical(fromCanonical('14:05:30'))).toBe('14:05')
    expect(canonical(null)).toBe('')
    for (const v of ['9:30', '24:00', '21:30:00Z', '12:60', '', null, undefined, 930, new Date()]) expect(fromCanonical(v)).toBe(null)
    expect(hasSeconds('14:05:30')).toBe(true)
    expect(hasSeconds('14:05')).toBe(false)
  })
  it('cifras del idioma a latinas', () => {
    expect(toLatin('٢١:٣٠', ar)).toBe('21:30')
  })
})

describe('timeInput · filtro', () => {
  it('letras ajenas fuera; cifras, separadores, h, marcadores y franjas dentro', () => {
    expect(filterTyped('xyz!', es)).toBe('')
    expect(filterTyped('9:30', es)).toBe('9:30')
    expect(filterTyped('9.30p', es)).toBe('9.30p')
    expect(filterTyped('9h30', es)).toBe('9h30')
    expect(filterTyped('9 noche', es)).toBe('9 noche')
    expect(filterTyped('7 de la tarde', es)).toBe('7 de la tarde')
    expect(filterTyped('mediodía', es)).toBe('mediodía')
    expect(filterTyped('9 qx', es)).toBe('9 ')
    expect(filterTyped('٩:٣٠ م', ar)).toBe('٩:٣٠ م')
    expect(filterTyped('오후 9:30', ko)).toBe('오후 9:30')
    expect(filterTyped('9‎:30', es)).toBe('9:30')
  })
})

describe('timeInput · interpretación (tabla del contrato)', () => {
  it('cifras', () => {
    expect(P('9')).toBe('09:00')
    expect(P('21')).toBe('21:00')
    expect(P('930')).toBe('09:30')
    expect(P('0930')).toBe('09:30')
    expect(P('2130')).toBe('21:30')
    expect(P('0005')).toBe('00:05')
  })
  it('segundos (5–6 cifras, tres grupos) solo con seconds', () => {
    expect(P('93015', es, { seconds: true })).toBe('09:30:15')
    expect(P('093015', es, { seconds: true })).toBe('09:30:15')
    expect(P('9:30:15', es, { seconds: true })).toBe('09:30:15')
    expect(P('93015')).toBe('invalid')
    expect(P('9:30:15')).toBe('invalid')
  })
  it('separadores y «h»', () => {
    for (const t of ['9:30', '9.30', '9,30', '9h30', '9 30']) expect(P(t)).toBe('09:30')
    expect(P('9 h')).toBe('09:00')
    expect(P('9h')).toBe('09:00')
  })
  it('marcadores latinos y del idioma, antes o después', () => {
    expect(P('9.30p', es)).toBe('21:30')
    expect(P('9 p. m.', mx)).toBe('21:00')
    expect(P('9pm', en)).toBe('21:00')
    expect(P('9am', en)).toBe('09:00')
    expect(P('오후 9:30', ko)).toBe('21:30')
    expect(P('오전 7:15', ko)).toBe('07:15')
    expect(P('٩:٣٠ م', ar)).toBe('21:30')
    expect(P('٢١٣٠', ar)).toBe('21:30')
    expect(P('9.30 ip', fi)).toBe('21:30')
    expect(P('7.45', fi)).toBe('07:45')
  })
  it('12 a. m. = medianoche; 12 p. m. = mediodía; con marcador la hora va de 1 a 12', () => {
    expect(P('12a', es)).toBe('00:00')
    expect(P('12 p. m.', mx)).toBe('12:00')
    expect(P('13p', es)).toBe('invalid')
    expect(P('0a', es)).toBe('invalid')
  })
  it('franjas del idioma (#407)', () => {
    expect(P('9 noche')).toBe('21:00')
    expect(P('7 de la tarde')).toBe('19:00')
    expect(P('7 de la noche')).toBe('19:00') // la más cercana a ≤ 2 h
    expect(P('3 madrugada')).toBe('03:00')
    expect(P('mediodía')).toBe('12:00')
    expect(P('12 de la noche')).toBe('00:00')
    expect(P('9 at night', en)).toBe('21:00')
    expect(P('noche')).toBe('invalid') // varias horas sin cifras
    expect(P('3 de la tarde')).toBe('15:00')
    expect(P('9 tarde')).toBe('21:00') // ninguna cae en la franja; 21 está a 2 h de las 19
    expect(P('3 noche')).toBe('invalid') // ninguna a ≤ 2 h
  })
  it('24 y 24:00 = medianoche', () => {
    expect(P('24')).toBe('00:00')
    expect(P('24:00')).toBe('00:00')
    expect(P('24:30')).toBe('invalid')
  })
  it('fecha y hora ISO: se toma su hora', () => {
    expect(P('2026-10-06T14:05')).toBe('14:05')
    expect(P('2026-10-06T14:05:30Z')).toBe('14:05')
    expect(P('2026-10-06 14:05:30', es, { seconds: true })).toBe('14:05:30')
  })
  it('0 y 13–23 en un idioma de 12 h: nunca ambiguas', () => {
    expect(parseTime('0', mx)).toMatchObject({ status: 'ok', value: 0, ambiguous: false })
    expect(parseTime('2130', mx)).toMatchObject({ status: 'ok', value: S('21:30'), ambiguous: false })
    expect(parseTime('13', mx)).toMatchObject({ value: S('13:00'), ambiguous: false })
  })
  it('sin interpretar', () => {
    for (const t of ['9:3', '99:99', '25', '9:', '1:2:3', 'pm', '93', '12345', '9:30 qq']) expect(['invalid', '09:00']).toContain(P(t))
    expect(P('9:3')).toBe('invalid')
    expect(P('99:99')).toBe('invalid')
    expect(P('25')).toBe('invalid')
    expect(P('93')).toBe('invalid')
    expect(P('pm')).toBe('invalid')
    expect(P('')).toBe('empty')
    expect(P('   ')).toBe('empty')
  })
})

describe('timeInput · ambigüedad (#408)', () => {
  it('12 h sin pista: 12 = mediodía; 1–11 = la mañana; la otra lectura en alt', () => {
    expect(parseTime('9', mx)).toMatchObject({ value: S('09:00'), ambiguous: true, alt: S('21:00') })
    expect(parseTime('12', mx)).toMatchObject({ value: S('12:00'), ambiguous: true, alt: 0 })
  })
  it('12 h con la última hora vista: su mitad', () => {
    expect(parseTime('9', mx, { prev: S('21:00') }).value).toBe(S('21:00'))
    expect(parseTime('9:15', mx, { prev: S('08:00') }).value).toBe(S('09:15'))
  })
  it('12 h con límites: la única lectura que cae dentro', () => {
    expect(parseTime('7', mx, { min: S('12:00'), max: S('23:00') }).value).toBe(S('19:00'))
    expect(parseTime('7', mx, { min: S('06:00'), max: S('11:00') }).value).toBe(S('07:00'))
    expect(parseTime('11', mx, { min: S('22:00'), max: S('06:00') }).value).toBe(S('23:00'))
  })
  it('24 h: 1–11 sin cero delante, literal y ambigua; con cero delante, no', () => {
    expect(parseTime('9', es)).toMatchObject({ value: S('09:00'), ambiguous: true, alt: S('21:00') })
    expect(parseTime('9:30', es)).toMatchObject({ ambiguous: true, alt: S('21:30') })
    expect(parseTime('930', es)).toMatchObject({ ambiguous: true })
    expect(parseTime('09', es).ambiguous).toBe(false)
    expect(parseTime('0930', es).ambiguous).toBe(false)
    expect(parseTime('12', es).ambiguous).toBe(false)
    expect(parseTime('21', es).ambiguous).toBe(false)
    expect(parseTime('9 noche', es).ambiguous).toBe(false)
    expect(parseTime('9p', es).ambiguous).toBe(false)
    expect(parseTime('9', es, { prev: S('22:00') }).value).toBe(S('09:00')) // 24 h: literal aunque la anterior fuera de noche
  })
})

describe('timeInput · aria-valuetext', () => {
  it('12 h con dayPeriod long; 24 h con la franja unida por un espacio', () => {
    expect(valueText(S('21:30'), mx)).toBe('9:30 de la noche')
    expect(valueText(S('21:30'), es)).toBe('21:30 de la noche')
    expect(valueText(S('09:07'), es)).toBe('9:07 de la mañana')
    expect(valueText(S('21:30'), ko)).toBe('밤 9:30')
    expect(valueText(null, es)).toBe('')
    expect(valueText(S('14:05:30'), es, true)).toBe('14:05:30 de la tarde')
  })
})

describe('timeInput · pasos (#405)', () => {
  const st = (v, dir, o) => canonical(stepTime(v == null ? null : S(v), dir, o), Boolean(o?.seconds))
  it('rejilla desde min: 9:07 ↑ → 9:15, ↓ → 9:00 (paso 15)', () => {
    expect(st('09:07', 1, { step: 15, min: S('08:00'), max: S('18:00') })).toBe('09:15')
    expect(st('09:07', -1, { step: 15, min: S('08:00'), max: S('18:00') })).toBe('09:00')
    expect(st('09:07', 1, { step: 20, min: S('08:10') })).toBe('09:10')
  })
  it('paso grande = 1 hora sin encajar', () => {
    expect(st('09:07', 1, { big: true, step: 15 })).toBe('10:07')
    expect(st('09:07', -1, { big: true, step: 15 })).toBe('08:07')
  })
  it('sin límites da la vuelta a medianoche', () => {
    expect(st('23:45', 1, { step: 15 })).toBe('00:00')
    expect(st('00:00', -1, { step: 15 })).toBe('23:45')
    expect(st('23:30', 1, { big: true })).toBe('00:30')
  })
  it('con límites se detiene en los extremos', () => {
    expect(st('17:50', 1, { step: 15, min: S('08:00'), max: S('18:00') })).toBe('18:00')
    expect(st('18:00', 1, { step: 15, min: S('08:00'), max: S('18:00') })).toBe('18:00')
    expect(st('08:00', -1, { step: 15, min: S('08:00'), max: S('18:00') })).toBe('08:00')
    expect(st('23:50', 1, { step: 15, min: S('22:00') })).toBe('23:59')
  })
  it('arco 22:00–06:00: pasa por 0:00 y se detiene en 6:00 y 22:00; fuera, entra por min/max', () => {
    const o = { step: 30, min: S('22:00'), max: S('06:00') }
    expect(st('23:30', 1, o)).toBe('00:00')
    expect(st('00:00', -1, o)).toBe('23:30')
    expect(st('05:30', 1, o)).toBe('06:00')
    expect(st('06:00', 1, o)).toBe('06:00')
    expect(st('22:00', -1, o)).toBe('22:00')
    expect(st('12:00', 1, o)).toBe('22:00')
    expect(st('12:00', -1, o)).toBe('06:00')
  })
  it('vacío: min; sin él, ahora redondeado hacia arriba a la rejilla; acotado por un max sin min', () => {
    expect(st(null, 1, { step: 15, min: S('08:00') })).toBe('08:00')
    expect(st(null, 1, { step: 15, now: S('10:32') })).toBe('10:45')
    expect(st(null, -1, { step: 1, now: S('10:40') })).toBe('10:40')
    expect(st(null, 1, { step: 15, now: S('23:50') })).toBe('00:00')
    expect(st(null, 1, { big: true, now: S('10:32') + 20 })).toBe('10:33')
    expect(st(null, 1, { step: 15, now: S('20:10'), max: S('18:00') })).toBe('18:00')
  })
  it('con segundos los pasos encajados vuelven a :00', () => {
    expect(st('09:07:30', 1, { step: 1, seconds: true })).toBe('09:08:00')
  })
})

describe('timeInput · arcos y duración', () => {
  it('inArc con y sin cruce', () => {
    expect(inArc(S('23:00'), S('22:00'), S('06:00'))).toBe(true)
    expect(inArc(S('12:00'), S('22:00'), S('06:00'))).toBe(false)
    expect(inArc(S('12:00'), S('08:00'), S('18:00'))).toBe(true)
    expect(inArc(S('07:00'), S('08:00'), null)).toBe(false)
    expect(inArc(null, 0, 1)).toBe(true)
  })
  it('duración (fin anterior = día siguiente)', () => {
    expect(duration(S('22:00'), S('06:00'))).toBe(8 * 3600)
    expect(duration(S('08:00'), S('17:30'))).toBe(9.5 * 3600)
    expect(duration(null, 1)).toBe(null)
    expect(DAY).toBe(86400)
  })
})
