import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import GFormActions from './GFormActions.vue'
import GBtn from '../GBtn/GBtn.vue'

afterEach(() => vi.restoreAllMocks())

describe('GFormActions · slots de función de render', () => {
  it('no invoca el slot fuera del render y sigue avisando de dos primarias', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(GFormActions, { slots: { default: () => [h(GBtn, null, () => 'a'), h(GBtn, null, () => 'b')] } })
    expect(w.findAll('button.g-btn')).toHaveLength(2)
    const msgs = warn.mock.calls.map((c) => String(c[0]))
    expect(msgs.some((m) => m.includes('Slot invoked outside render'))).toBe(false)
    expect(msgs.some((m) => m.includes('más de una acción primaria'))).toBe(true)
  })
})
