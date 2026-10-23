// @vitest-environment node
// describeQuery en Node, sin DOM (#862): pura y SSR.
import { describe, it, expect } from 'vitest'
import { describeQuery } from './bookingQuery.js'

describe('describeQuery · SSR', () => {
  it('sin window ni document', () => {
    expect(typeof globalThis.window).toBe('undefined')
    const rows = [{ key: 'adults', label: 'Adultos', default: 2, unit: '{count} adultos', decrementLabel: '−', incrementLabel: '+' }]
    const d = describeQuery({ kind: 'stay', from: '2026-11-13', to: '2026-11-15', party: {} }, { partyRows: rows, locale: 'es', labels: { nights: '{count} noches', separator: ' · ', checkout: 'Salida el {date}' } })
    expect(d.text).toMatch(/ · 2 noches · 2 adultos$/)
    expect(d.checkout).toContain('15')
  })
})
