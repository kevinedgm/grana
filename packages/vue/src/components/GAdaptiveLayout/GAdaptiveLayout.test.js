import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createSSRApp, defineComponent, h, inject, nextTick, onMounted, ref } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { layoutKey } from '../GForm/formContext.js'
import GAdaptiveLayout from './GAdaptiveLayout.vue'
import GInput from '../GInput/GInput.vue'
import GNumberField from '../GNumberField/GNumberField.vue'
import GForm from '../GForm/GForm.vue'
import GFormSection from '../GFormSection/GFormSection.vue'
import GFormReveal from '../GFormReveal/GFormReveal.vue'
import GFormLayout from '../GFormLayout/GFormLayout.vue'
import { allocateWidths, aggregateProfiles, normalizeProfile, placeAdaptive, planAdaptive } from './adaptivePlan.js'
import { inferredCapacity, profileFromDescriptor, readHints, effectiveHints, classify, measureProfile, createTextMeasurer } from './adaptiveProfiles.js'
import GSummary from '../GSummary/GSummary.vue'
import GAvatar from '../GAvatar/GAvatar.vue'
import GCombobox from '../GCombobox/GCombobox.vue'
import GSelect from '../GSelect/GSelect.vue'
import GTextarea from '../GTextarea/GTextarea.vue'
import GFormRow from '../GFormRow/GFormRow.vue'
import GFieldGroup from '../GFieldGroup/GFieldGroup.vue'
const p = (min, preferred = min, max = Infinity, weight = 1) => ({ min, preferred, max, weight })
const widths = [40, 80, 160, 320, 460, 1120]
describe('adaptive planner · constraints and optimal contiguous partition', () => {
  it('full reserves a row without changing bounded numeric or natural geometry', () => {
    for (const descriptor of [
      { kind: 'number', integerOnly: true, min: 0, max: 9, glyph: 8, chrome: 64, intrinsic: 103, touchMin: 44, labelMin: 65 },
      { kind: 'natural', natural: 64 },
    ]) {
      const auto = profileFromDescriptor(descriptor)
      const full = profileFromDescriptor({ ...descriptor, width: 'full' })
      expect(full).toEqual({ ...auto, full: true })
      expect(full.max).toBeGreaterThanOrEqual(full.min)
      expect(planAdaptive([auto, full, auto], 460, 16).lines).toHaveLength(3)
    }
  })
  it('shrinks by headroom and freezes bounded fields during expansion', () => {
    expect(allocateWidths([p(20, 40, 50), p(20, 80)], 90, 10)).toEqual([30, 50])
    expect(allocateWidths([p(20, 40, 50), p(20, 80)], 200, 10)).toEqual([50, 140])
    expect(allocateWidths([p(20, 40, 40), p(20, 80, 80)], 200, 10)).toEqual([40, 80])
  })
  it('uses real semantic profiles to place street then two bounded integers at460', () => {
    const street = profileFromDescriptor({ kind: 'text', glyph: 8, chrome: 26, labelMin: 40 })
    const short = profileFromDescriptor({ kind: 'number', integerOnly: true, min: 0, max: 9, glyph: 8, chrome: 26, labelMin: 65, intrinsic: 112 })
    const plan = planAdaptive([street, short, short], 460, 16)
    expect(plan.lines.map(x => [x.start, x.end])).toEqual([[0, 1], [1, 3]])
    expect(plan.lines[1].widths).toEqual([112, 112])
  })
  it('full blocks partition, zero width never produces negative widths, stack respects maxima', () => {
    const items = [p(80, 100, 120), { ...p(40), full: true }, p(80, 100, 120)]
    expect(planAdaptive(items, 1000).lines).toHaveLength(3)
    expect(planAdaptive(items, 0).lines.every(x => x.widths.every(w => w === 0))).toBe(true)
    expect(planAdaptive([p(20, 30, 40)], 300, 10, { stack: true }).lines[0].widths).toEqual([40])
  })
  it('matches exhaustive partition oracle for deterministic small fixtures', () => {
    // Independently enumerate every contiguous partition and score all valid candidates.
    function oracle(items, width, gap, start = 0) {
      if (start === items.length) return { cost: 0, rows: [] }
      let best
      for (let end = start + 1; end <= items.length; end++) {
        const row = items.slice(start, end)
        if (row.length > 1 && (row.some(x => x.full) || row.reduce((s, x) => s + x.min, 0) + gap * (row.length - 1) > width)) continue
        const allocated = allocateWidths(row, width, gap)
        const next = oracle(items, width, gap, end)
        const cost = 1 + 24 * row.reduce((s, x, i) => s + (Math.max(0, x.preferred - allocated[i]) / Math.max(x.preferred, 1e-8)) ** 2, 0) + next.cost
        const rows = [[start, end], ...next.rows]
        if (!best || cost < best.cost - 1e-8 || (Math.abs(cost - best.cost) <= 1e-8 && (rows.length < best.rows.length || (rows.length === best.rows.length && end > best.rows[0][1])))) best = { cost, rows }
      }
      return best
    }
    for (let n = 1; n <= 7; n++) for (const width of widths) {
      const items = Array.from({ length: n }, (_, i) => p(20 + (i * 19) % 70, 100 + (i * 47) % 150, i % 2 ? 300 : Infinity, 1 + i % 3))
      expect(planAdaptive(items, width, 8).lines.map(x => [x.start, x.end])).toEqual(oracle(items, width, 8).rows)
    }
  })
  it('keeps all children in order with finite geometry for1–500 elements', () => {
    for (const n of [0, 1, 10, 50, 64, 65, 200, 500]) for (const width of widths) {
      const items = Array.from({ length: n }, (_, i) => p(i % 5 ? 35 : 90, i % 5 ? 60 : 230, i % 5 ? 100 : Infinity))
      const plan = planAdaptive(items, width, 16)
      expect(plan.strategy).toBe(n > 64 ? 'linear' : 'optimal')
      const placements = placeAdaptive(plan, width, 16)
      expect(placements.map(x => x.index)).toEqual(items.map((_, i) => i))
      for (const x of placements) { expect(Number.isFinite(x.start + x.width)).toBe(true); expect(x.start).toBeGreaterThanOrEqual(0); expect(x.start + x.width).toBeLessThanOrEqual(width + 1e-6) }
    }
  })
  it('zero minima, heterogeneous maxima and500 children remain finite', () => {
    const items = Array.from({ length: 500 }, (_, i) => p(0, 0, i * 0.0001, i + 1))
    const plan = planAdaptive(items, 10000, 0)
    expect(plan.lines.flatMap(x => x.widths).every(Number.isFinite)).toBe(true)
    expect(plan.lines[0].widths.every((w, i) => w <= items[i].max + 1e-8)).toBe(true)
  })
  it('logical placement (#359): offsets from the inline start, the same in LTR and RTL; order never changes', () => {
    const plan = planAdaptive([p(30, 30, 30), p(50, 50, 50)], 200, 10)
    expect(placeAdaptive(plan, 200, 10).map(x => x.start)).toEqual([0, 40])
    expect(placeAdaptive(plan, 200, 10, 'start').map(x => x.start)).toEqual([0, 40])
    expect(placeAdaptive(plan, 200, 10, 'center').map(x => x.start)).toEqual([55, 95])
    expect(placeAdaptive(plan, 200, 10, 'end').map(x => x.start)).toEqual([110, 150])
    expect(placeAdaptive(plan, 200, 10, 'end').map(x => x.index)).toEqual([0, 1])
    expect(placeAdaptive(plan, 200, 10, 'end').some(x => 'x' in x)).toBe(false)
  })
  it('aggregates groups without assigned width feedback and normalizes invalid data', () => {
    expect(aggregateProfiles([p(20, 30, 40), p(10, 20, 30)], 8)).toEqual({ ...p(20, 30, 78, 2), full: false })
    expect(normalizeProfile({ min: -1, preferred: NaN, max: -1, weight: -1 })).toEqual({ min: 0, preferred: 0, max: 0, weight: 0, full: false })
  })
})
describe('profile semantics', () => {
  it('does not infer decimal length or selected value; explicit capacity wins', () => {
    expect(inferredCapacity({ kind: 'number', min: 0, max: 9, integerOnly: false })).toBeUndefined()
    expect(inferredCapacity({ kind: 'number', min: -99, max: 999, integerOnly: true })).toBe(3)
    expect(inferredCapacity({ kind: 'number', min: 0, max: 9, integerOnly: true, characters: 6 })).toBe(6)
    expect(inferredCapacity({ kind: 'number', min: 0, max: 1000, integerOnly: true })).toBe(5)
    expect(inferredCapacity({ kind: 'number', min: 1e30, max: 1e31, integerOnly: true })).toBeUndefined()
  })
  it('label and intrinsic minima override capacity without changing typography', () => {
    const profile = profileFromDescriptor({ kind: 'text', glyph: 8, chrome: 20, labelMin: 150, intrinsic: 180, characters: 1 })
    expect(profile.min).toBe(180); expect(profile.max).toBe(180)
    expect(profileFromDescriptor({ kind: 'text', glyph: 8, maxlength: 200 }).preferred).toBe(320)
  })
  it('reads child hints from classes and computed --g-adapt-* (#364), with one issue per cause', () => {
    const el = (className = '', style = '') => { const x = document.createElement('div'); x.className = className; x.setAttribute('style', style); document.body.append(x); return x }
    const read = x => { const r = readHints(x, getComputedStyle(x)); x.remove(); return r }
    expect(read(el('g-adapt-short', '--g-adapt-chars: 4; --g-adapt-weight: 2'))).toEqual({ hint: { width: 'short', characters: 4, weight: 2 }, issues: [] })
    expect(read(el('g-adaptive-layout g-adaptive-layout--gap-md is-ready'))).toEqual({ hint: {}, issues: [] })
    expect(read(el('', '--g-adapt-chars: 0; --g-adapt-weight: 0'))).toEqual({ hint: {}, issues: [] })
    expect(read(el('g-adapt-short g-adapt-wide'))).toEqual({ hint: {}, issues: ['contradiction'] })
    expect(read(el('g-adapt-full g-adapt-natural'))).toEqual({ hint: {}, issues: ['contradiction'] })
    expect(read(el('g-adapt-auto')).issues).toEqual(['class'])
    expect(read(el('g-adapt-tiny g-adapt-wide'))).toEqual({ hint: { width: 'wide' }, issues: ['class'] })
    expect(read(el('g-form-w-4')).issues).toEqual(['form-w'])
    expect(read(el('', '--g-adapt-chars: 4.5')).issues).toEqual(['chars'])
    expect(read(el('', '--g-adapt-chars: -3')).issues).toEqual(['chars'])
    expect(read(el('', '--g-adapt-weight: -1')).issues).toEqual(['weight'])
    expect(read(el('', '--g-adapt-weight: 0.5'))).toEqual({ hint: { weight: 0.5 }, issues: [] })
    expect(read(el('', '--g-adapt-chars: abc')).issues).toEqual(['nonnumeric'])
    // Registered <number> (browsers): an invalid inline value computes to 0; only the inline style is checked
    const registered = el('', '--g-adapt-chars: abc')
    expect(readHints(registered, { getPropertyValue: name => (name === '--g-adapt-chars' ? '0' : '') }).issues).toEqual(['nonnumeric'])
    registered.remove()
    const zero = el('', '--g-adapt-chars: 0')
    expect(readHints(zero, { getPropertyValue: () => '0' }).issues).toEqual([])
    zero.remove()
  })
  it('drops hints without effect for each kind of child; full on a block is redundant, not an error', () => {
    const all = { width: 'short', characters: 4, weight: 2 }
    expect(effectiveHints(all, 'block')).toEqual({ hint: {}, ignored: true })
    expect(effectiveHints({ width: 'full' }, 'block')).toEqual({ hint: {}, ignored: false })
    expect(effectiveHints(all, 'group')).toEqual({ hint: { weight: 2 }, ignored: true })
    expect(effectiveHints({ width: 'full', weight: 2 }, 'group')).toEqual({ hint: { width: 'full', weight: 2 }, ignored: false })
    expect(effectiveHints({ width: 'natural' }, 'field')).toEqual({ hint: {}, ignored: true })
    expect(effectiveHints({ width: 'natural' }, 'summary')).toEqual({ hint: {}, ignored: true })
    expect(effectiveHints({ width: 'natural', characters: 3, weight: 2 }, 'generic')).toEqual({ hint: { width: 'natural' }, ignored: true })
    expect(effectiveHints({ width: 'full', characters: 3 }, 'field')).toEqual({ hint: { width: 'full' }, ignored: true })
    expect(effectiveHints(all, 'field')).toEqual({ hint: all, ignored: false })
    expect(effectiveHints({ width: 'wide', characters: 6, weight: 2 }, 'summary')).toEqual({ hint: { width: 'wide', characters: 6, weight: 2 }, ignored: false })
  })
  it('classifies rows, field groups, form layouts and sections as full blocks even with one control (#361)', () => {
    const make = html => { const host = document.createElement('div'); host.innerHTML = html; return host.firstElementChild }
    expect(classify(make('<div class="g-form-row"><input></div>'))).toBe('block')
    expect(classify(make('<fieldset class="g-field-group"><input></fieldset>'))).toBe('block')
    expect(classify(make('<div class="g-form-layout"><input></div>'))).toBe('block')
    expect(classify(make('<section><input></section>'))).toBe('block')
    expect(classify(make('<label>Uno<input><input></label>'))).toBe('block')
    expect(classify(make('<label>Uno<input></label>'))).toBe('field')
    expect(classify(make('<input>'))).toBe('field')
    expect(classify(make('<span class="g-summary"><span class="g-summary__title">T</span></span>'))).toBe('summary')
    expect(classify(make('<span class="g-avatar"></span>'))).toBe('natural')
    expect(classify(make('<p>Texto</p>'))).toBe('generic')
  })
  it('GSummary profile (#363): its floor is the minimum, family wide preferred, no maximum, weight 3; hints never lower the floor', () => {
    expect(profileFromDescriptor({ kind: 'summary', floor: 150, glyph: 8 })).toEqual({ min: 150, preferred: 320, max: Infinity, weight: 3, full: false })
    expect(profileFromDescriptor({ kind: 'summary', floor: 150, glyph: 8, width: 'standard' })).toEqual({ min: 150, preferred: 192, max: Infinity, weight: 1, full: false })
    expect(profileFromDescriptor({ kind: 'summary', floor: 150, glyph: 8, width: 'short' })).toEqual({ min: 150, preferred: 150, max: 150, weight: 1, full: false })
    expect(profileFromDescriptor({ kind: 'summary', floor: 150, glyph: 8, characters: 4, weight: 2 })).toEqual({ min: 150, preferred: 150, max: 150, weight: 2, full: false })
    expect(profileFromDescriptor({ kind: 'summary', floor: 100, glyph: 8, characters: 30 })).toEqual({ min: 100, preferred: 240, max: 240, weight: 3, full: false })
    expect(profileFromDescriptor({ kind: 'summary', floor: 150, glyph: 8, width: 'full' })).toEqual({ min: 150, preferred: 320, max: Infinity, weight: 3, full: true })
  })
  it('measures the GSummary floor from its identity box, gap and the title floor of its layout', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ font: '', measureText: text => ({ width: text.length * 8 }) })
    const host = document.createElement('div'); document.body.append(host)
    host.innerHTML = '<span class="g-summary g-summary--layout-row" style="column-gap: 12px"><span class="g-summary__lead" aria-hidden="true"></span><span class="g-summary__body"><span class="g-summary__title">Expediente</span></span></span>'
    const summary = host.firstElementChild, lead = summary.firstElementChild
    vi.spyOn(lead, 'getBoundingClientRect').mockReturnValue({ width: 40, height: 40 })
    const gap = parseFloat(getComputedStyle(summary).columnGap) || 0
    const measurer = createTextMeasurer(document)
    expect(measureProfile(summary, {}, 0, measurer).min).toBe(40 + gap + 7 * 8)
    summary.className = 'g-summary g-summary--layout-inline'; measurer.clear()
    expect(measureProfile(summary, {}, 0, measurer).min).toBe(40 + gap + 4 * 8)
    lead.remove()
    expect(measureProfile(summary, { width: 'short', characters: 1 }, 0, measurer).min).toBe(4 * 8)
    host.remove()
  })
})
const wrappers = []
afterEach(() => { for (const w of wrappers.splice(0)) w.unmount(); vi.restoreAllMocks(); vi.unstubAllGlobals() })
const own = wrapper => { wrappers.push(wrapper); return wrapper }
describe('GAdaptiveLayout public behavior', () => {
  it('writes no phantom tracks for empty content and restores root aliases on fallback', async () => {
    let emit
    vi.stubGlobal('ResizeObserver', class { constructor(fn) { emit = fn } observe() {} unobserve() {} disconnect() {} })
    vi.stubGlobal('requestAnimationFrame', fn => setTimeout(fn, 0))
    const loose = ref(false)
    const App = defineComponent({ setup: () => () => h(GAdaptiveLayout, { style: '--_adaptive-rows: 19px' }, { default: () => loose.value ? 'Loose text' : [] }) })
    const wrapper = own(mount(App, { attachTo: document.body })), root = wrapper.find('.g-adaptive-layout').element
    emit([{ target: root, contentRect: { width: 460 } }]); await new Promise(resolve => setTimeout(resolve, 20))
    expect(root.style.getPropertyValue('--_adaptive-rows')).toBe('none')
    expect(root.dataset.lines).toBe('0')
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    loose.value = true; await nextTick(); await new Promise(resolve => setTimeout(resolve, 20))
    expect(root.style.getPropertyValue('--_adaptive-rows')).toBe('19px')
    expect(root.classList.contains('is-ready')).toBe(false)
    expect(root.hasAttribute('data-lines')).toBe(false)
    expect(warning).toHaveBeenCalled()
  })
  it('uses shared tracks only for direct known companions on the same planned line', async () => {
    let emit
    vi.stubGlobal('ResizeObserver', class { constructor(fn) { emit = fn } observe() {} unobserve() {} disconnect() {} })
    vi.stubGlobal('requestAnimationFrame', fn => setTimeout(fn, 0))
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ font: '', measureText: text => ({ width: text.length * 8 }) })
    vi.spyOn(Element.prototype, 'getClientRects').mockImplementation(() => [{ width: 100, height: 40 }])
    const wrapper = own(mount(GAdaptiveLayout, { attachTo: document.body, slots: { default: () => [h(GNumberField, { label: 'Cantidad de prueba', precision: 0, min: 0, max: 9 }), h(GInput, { label: 'Dato', maxlength: 1 })] } })), root = wrapper.element
    const resize = emit
    resize([{ target: root, contentRect: { width: 460 } }]); await new Promise(resolve => setTimeout(resolve, 20))
    expect(root.classList.contains('has-shared-tracks')).toBe(true)
    expect(root.style.getPropertyValue('--_adaptive-rows')).toBe('auto auto auto')
    resize([{ target: root, contentRect: { width: 1 } }]); await new Promise(resolve => setTimeout(resolve, 20))
    expect(root.classList.contains('has-shared-tracks')).toBe(false)
    expect(root.style.getPropertyValue('--_adaptive-rows')).toBe('none')
    wrapper.unmount(); wrappers.splice(wrappers.indexOf(wrapper), 1)
    expect(root.classList.contains('has-shared-tracks')).toBe(false)
  })
  it('has minimal defaults, transparent attributes and no interactive semantics', () => {
    const wrapper = own(mount(GAdaptiveLayout, { attrs: { id: 'address', dir: 'rtl', 'aria-label': 'Dirección' }, slots: { default: '<p>Contenido</p>' } }))
    expect(wrapper.classes()).toEqual(['g-adaptive-layout', 'g-adaptive-layout--horizontal-start', 'g-adaptive-layout--vertical-top', 'g-adaptive-layout--gap-md', 'g-adaptive-layout--density-default'])
    expect(wrapper.attributes('id')).toBe('address'); expect(wrapper.attributes('dir')).toBe('rtl')
    expect(wrapper.attributes('role')).toBeUndefined(); expect(wrapper.attributes('tabindex')).toBeUndefined()
  })
  it('inherits block/density and readonly/disabled context without changing form fields', () => {
    const wrapper = own(mount(GFormLayout, { props: { density: 'compact' }, slots: { default: () => h(GAdaptiveLayout, {}, { default: () => h(GInput, { label: 'Nombre' }) }) } }))
    expect(wrapper.find('.g-adaptive-layout').classes()).toContain('g-adaptive-layout--density-compact')
    expect(wrapper.find('.g-input').classes()).toContain('g-input--block')
    expect(wrapper.find('.g-input').classes()).toContain('g-input--density-compact')
  })
  it('integrates GForm readonly/disabled inheritance and native FormData inside a section', async () => {
    const readonly = ref(true), disabled = ref(false)
    const App = defineComponent({ setup: () => () => h(GForm, { readonly: readonly.value, disabled: disabled.value, density: 'comfortable' }, { default: () => h(GFormSection, { title: 'Ficha' }, { default: () => h(GFormLayout, {}, { default: () => h(GAdaptiveLayout, {}, { default: () => [h(GInput, { name: 'kept', label: 'Conservado', modelValue: 'Ana' }), h(GInput, { name: 'omitted', label: 'Deshabilitado', modelValue: 'Omitir', disabled: true }), h(GNumberField, { name: 'quantity', label: 'Cantidad', modelValue: 3, min: 0, max: 9, precision: 0 })] }) }) }) }) })
    const wrapper = own(mount(App))
    expect(wrapper.find('[name=kept]').element.readOnly).toBe(true)
    expect(wrapper.find('[name=omitted]').element.disabled).toBe(true)
    expect(wrapper.find('.g-adaptive-layout').classes()).toContain('g-adaptive-layout--density-comfortable')
    let data = new FormData(wrapper.find('form').element)
    expect(data.get('kept')).toBe('Ana'); expect(data.get('quantity')).toBe('3'); expect(data.has('omitted')).toBe(false)
    disabled.value = true; await nextTick()
    expect(wrapper.find('[name=kept]').element.disabled).toBe(true)
    data = new FormData(wrapper.find('form').element)
    expect(data.has('kept')).toBe(false); expect(data.has('quantity')).toBe(false)
  })
  it('preserves GForm error registration and reveal exclusion through the adaptive container', async () => {
    const errors = ref({ kept: 'Revisa el nombre', extra: 'Revisa referencia' }), show = ref(false)
    const App = defineComponent({ setup: () => () => h(GForm, { errors: errors.value, showErrorsOn: 'submit' }, { default: () => h(GAdaptiveLayout, {}, { default: () => [h(GInput, { name: 'kept', label: 'Nombre', modelValue: 'Ana' }), h(GFormReveal, { when: show.value }, { default: () => h(GInput, { name: 'extra', label: 'Referencia', modelValue: 'Dato' }) })] }) }) })
    const wrapper = own(mount(App))
    await wrapper.find('form').trigger('submit'); await new Promise(resolve => setTimeout(resolve, 40))
    expect(wrapper.find('[name=kept]').attributes('aria-invalid')).toBe('true')
    expect(wrapper.findComponent(GForm).emitted('invalid')).toHaveLength(1)
    expect(new FormData(wrapper.find('form').element).has('extra')).toBe(false)
    errors.value = {}; show.value = true; await nextTick()
    await wrapper.find('form').trigger('submit'); await new Promise(resolve => setTimeout(resolve, 40))
    const payload = wrapper.findComponent(GForm).emitted('submit')[0][0]
    expect(payload.data.get('kept')).toBe('Ana'); expect(payload.data.get('extra')).toBe('Dato')
    expect(payload.event.defaultPrevented).toBe(true)
  })
  it('SSR renders the same unmeasured slot nodes without browser APIs', async () => {
    const html = await renderToString(createSSRApp({ render: () => h(GAdaptiveLayout, {}, { default: () => h('input', { name: 'field' }) }) }))
    expect(html).toContain('name="field"'); expect(html).not.toContain('is-ready'); expect(html).not.toContain('data-line')
  })
  it('resize preserves focus/value/selection/node identity, and cleanup restores aliases', async () => {
    let emit
    vi.stubGlobal('ResizeObserver', class { constructor(fn) { emit = fn } observe() {} unobserve() {} disconnect() {} })
    vi.stubGlobal('requestAnimationFrame', fn => setTimeout(fn, 0))
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ font: '', measureText: text => ({ width: text.length * 8 }) })
    vi.spyOn(Element.prototype, 'getClientRects').mockImplementation(() => [{ width: 100, height: 40 }])
    const wrapper = own(mount(GAdaptiveLayout, { attachTo: document.body, attrs: { style: '--_adaptive-rows: 19px' }, slots: { default: '<label id="short" style="--_adaptive-start: 7px; --_adaptive-track: 9">Exterior<input name="outside" maxlength="1"></label><label>Calle<input name="street"></label>' } }))
    const input = wrapper.find('input').element, label = wrapper.find('label').element
    input.value = '7'; input.focus(); input.setSelectionRange(0, 1, 'backward')
    emit([{ target: wrapper.element, contentRect: { width: 460 } }]); await new Promise(resolve => setTimeout(resolve, 20))
    expect(wrapper.attributes('data-lines')).toBeDefined()
    const rootElement = wrapper.element
    expect(rootElement.style.getPropertyValue('--_adaptive-rows')).toBe('none')
    expect(rootElement.classList.contains('has-shared-tracks')).toBe(false)
    expect(label.style.getPropertyValue('--_adaptive-track')).toBe(String(4 * (Number(label.dataset.line) - 1) + 1))
    emit([{ target: wrapper.element, contentRect: { width: 320 } }]); await new Promise(resolve => setTimeout(resolve, 20))
    expect(wrapper.find('input').element).toBe(input); expect(document.activeElement).toBe(input)
    expect(input.value).toBe('7'); expect([input.selectionStart, input.selectionEnd, input.selectionDirection]).toEqual([0, 1, 'backward'])
    wrapper.unmount(); wrappers.splice(wrappers.indexOf(wrapper), 1)
    expect(rootElement.style.getPropertyValue('--_adaptive-rows')).toBe('19px')
    expect(label.style.getPropertyValue('--_adaptive-track')).toBe('9')
    expect(label.style.getPropertyValue('--_adaptive-start')).toBe('7px'); expect(label.hasAttribute('data-line')).toBe(false)
  })
  it('invalidates profiles for root and custom ancestor theme attributes without an own-write observer loop', async () => {
    const { resize } = stubEngine()
    const walker = vi.spyOn(Document.prototype, 'createTreeWalker')
    const wrapper = own(mount(GAdaptiveLayout, { attachTo: document.body, slots: { default: '<label>Nombre<input name="name"></label>' } }))
    resize(wrapper.element, 460); await settle()
    const before = walker.mock.calls.length
    expect(before).toBeGreaterThan(0)
    document.body.setAttribute('data-test-theme', 'contrast')
    await settle(30)
    expect(walker.mock.calls.length).toBeGreaterThan(before)
    const settled = walker.mock.calls.length
    await settle(40)
    expect(walker.mock.calls.length).toBe(settled)
    wrapper.element.setAttribute('data-test-theme', 'root-theme')
    await settle(30)
    expect(walker.mock.calls.length).toBeGreaterThan(settled)
    const rootSettled = walker.mock.calls.length
    await settle(30)
    expect(walker.mock.calls.length).toBe(rootSettled)
    document.body.removeAttribute('data-test-theme')
  })
  it('a burst of ancestor mutations re-measures once per frame; mutations in a foreign branch never measure', async () => {
    // Diagnóstico 2026-10-05 (form-distribution colgado): el observador de antepasados no debe convertir ráfagas del
    // tema ni el trabajo de otras secciones de la página en medidas repetidas.
    const { resize } = stubEngine()
    const walker = vi.spyOn(Document.prototype, 'createTreeWalker')
    const foreign = document.createElement('div'); document.body.append(foreign)
    const wrapper = own(mount(GAdaptiveLayout, { attachTo: document.body, slots: { default: '<label>Nombre<input name="name"></label>' } }))
    resize(wrapper.element, 460); await settle(30)
    let calls = walker.mock.calls.length
    for (let i = 0; i < 200; i++) {
      document.body.setAttribute('data-burst', String(i))
      document.documentElement.style.setProperty('--g-color-text', i % 2 ? '#111' : '#222')
    }
    await settle(30)
    expect(walker.mock.calls.length - calls).toBe(1)
    calls = walker.mock.calls.length
    await settle(40)
    expect(walker.mock.calls.length).toBe(calls)
    for (let i = 0; i < 200; i++) {
      foreign.classList.toggle('is-x'); foreign.style.setProperty('--g-space-1', `${i}px`); foreign.setAttribute('data-step', String(i))
      foreign.textContent = `paso ${i}`
    }
    await settle(30)
    expect(walker.mock.calls.length).toBe(calls)
    document.body.removeAttribute('data-burst'); document.documentElement.style.removeProperty('--g-color-text'); foreign.remove()
  })
  it('updates a direct native control profile when its external label changes', async () => {
    let emit
    vi.stubGlobal('ResizeObserver', class { constructor(fn) { emit = fn } observe() {} unobserve() {} disconnect() {} })
    vi.stubGlobal('requestAnimationFrame', fn => setTimeout(fn, 0))
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ font: '', measureText: text => ({ width: text.length * 8 }) })
    vi.spyOn(Element.prototype, 'getClientRects').mockImplementation(() => [{ width: 100, height: 40 }])
    const label = document.createElement('label'); label.htmlFor = 'outside'; label.textContent = 'One'; document.body.append(label)
    const wrapper = own(mount(GAdaptiveLayout, { attachTo: document.body, slots: { default: '<input id="outside" name="outside" maxlength="1">' } }))
    emit([{ target: wrapper.element, contentRect: { width: 460 } }]); await new Promise(resolve => setTimeout(resolve, 20))
    const before = parseFloat(wrapper.find('input').element.style.getPropertyValue('--_adaptive-width'))
    label.textContent = 'LongerLabelThanBefore'; await new Promise(resolve => setTimeout(resolve, 30))
    expect(parseFloat(wrapper.find('input').element.style.getPropertyValue('--_adaptive-width'))).toBeGreaterThan(before + 100)
    label.remove()
  })
  it('keeps published intrinsic minimum while a mounted child is hidden and revealed', async () => {
    let emit
    vi.stubGlobal('ResizeObserver', class { constructor(fn) { emit = fn } observe() {} unobserve() {} disconnect() {} })
    vi.stubGlobal('requestAnimationFrame', fn => setTimeout(fn, 0))
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ font: '', measureText: text => ({ width: text.length * 8 }) })
    vi.spyOn(Element.prototype, 'getClientRects').mockImplementation(() => [{ width: 100, height: 40 }])
    const show = ref(true)
    const Field = defineComponent({ setup() {
      const layout = inject(layoutKey), element = ref(null)
      onMounted(() => layout.setIntrinsicMin(element.value, 250))
      return () => h('label', { ref: element, hidden: !show.value }, ['Short', h('input', { name: 'short', maxlength: 1 })])
    } })
    const wrapper = own(mount(GAdaptiveLayout, { slots: { default: () => [h(Field), h('input', { name: 'other' })] } }))
    emit([{ target: wrapper.element, contentRect: { width: 460 } }]); await new Promise(resolve => setTimeout(resolve, 20))
    expect(parseFloat(wrapper.find('label').element.style.getPropertyValue('--_adaptive-width'))).toBe(250)
    show.value = false; await nextTick(); await new Promise(resolve => setTimeout(resolve, 20))
    expect(wrapper.find('label').attributes('data-line')).toBeUndefined()
    show.value = true; await nextTick(); await new Promise(resolve => setTimeout(resolve, 20))
    expect(parseFloat(wrapper.find('label').element.style.getPropertyValue('--_adaptive-width'))).toBe(250)
  })
  it('a v-if child keeps its own hint and nodes; values survive the addition', async () => {
    const { resize } = stubEngine()
    const show = ref(false)
    const App = defineComponent({ setup: () => () => h(GAdaptiveLayout, {}, { default: () => [h(GInput, { label: 'Calle', modelValue: 'Valor' }), show.value && h(GInput, { label: 'Código', class: 'g-adapt-short', style: '--g-adapt-chars: 2' }), h(GInput, { label: 'Colonia' })] }) })
    const wrapper = own(mount(App, { attachTo: document.body })); const input = wrapper.find('input').element
    resize(wrapper.find('.g-adaptive-layout').element, 1000); await settle()
    show.value = true; await nextTick(); await settle()
    expect(wrapper.find('input').element).toBe(input); expect(input.value).toBe('Valor')
    const fields = wrapper.findAll('.g-input')
    expect(fields).toHaveLength(3)
    expect(fields[1].classes()).toContain('g-adapt-short')
    expect(parseFloat(fields[1].element.style.getPropertyValue('--_adaptive-width'))).toBeLessThan(parseFloat(fields[2].element.style.getPropertyValue('--_adaptive-width')))
  })
})
const settle = (ms = 20) => new Promise(resolve => setTimeout(resolve, ms))
function stubEngine() {
  // Every observer remembers its targets: GSummary and GFormRow observe too, and only the layout's own must be fed
  const observers = []
  vi.stubGlobal('ResizeObserver', class { constructor(fn) { this.fn = fn; this.targets = new Set(); observers.push(this) } observe(el) { this.targets.add(el) } unobserve(el) { this.targets.delete(el) } disconnect() { this.targets.clear() } })
  const emit = (entries) => { for (const o of observers) { const mine = entries.filter(e => o.targets.has(e.target)); if (mine.length) o.fn(mine, o) } }
  vi.stubGlobal('requestAnimationFrame', fn => setTimeout(fn, 0))
  const measureText = vi.fn(text => ({ width: text.length * 8 }))
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ font: '', measureText })
  vi.spyOn(Element.prototype, 'getClientRects').mockImplementation(() => [{ width: 100, height: 40 }])
  return { resize: (target, width) => emit([{ target, contentRect: { width } }]), measureText }
}
const widthOf = el => parseFloat(el.style.getPropertyValue('--_adaptive-width'))
describe('GAdaptiveLayout · pistas en el hijo (#364) y API corregida (#359, #360)', () => {
  it('validators accept the logical/semantic values and reject the retired ones; there is no hints prop', () => {
    const { horizontal, gap } = GAdaptiveLayout.props
    for (const value of ['start', 'center', 'end']) expect(horizontal.validator(value)).toBe(true)
    for (const value of ['left', 'right']) expect(horizontal.validator(value)).toBe(false)
    for (const value of ['none', 'sm', 'md', 'lg']) expect(gap.validator(value)).toBe(true)
    for (const value of ['default', 'small', 'large']) expect(gap.validator(value)).toBe(false)
    expect(horizontal.default).toBe('start'); expect(gap.default).toBe('md')
    expect(GAdaptiveLayout.props.hints).toBeUndefined()
    const wrapper = own(mount(GAdaptiveLayout, { props: { horizontal: 'end', gap: 'lg' } }))
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['g-adaptive-layout--horizontal-end', 'g-adaptive-layout--gap-lg']))
  })
  it('class and style reach the root (the direct child) of GSummary, GAvatar, GCombobox, GSelect, GNumberField and GTextarea', () => {
    const style = '--g-adapt-chars: 5; --g-adapt-weight: 2'
    const cases = [
      [GSummary, { title: 'Expediente 0042', facts: [{ label: 'Edad', value: 40 }] }, 'g-summary'],
      [GAvatar, { name: 'María López' }, 'g-avatar'],
      [GCombobox, { label: 'Paciente', options: [{ value: 1, label: 'Uno' }] }, 'g-combobox'],
      [GSelect, { label: 'Municipio', options: [{ value: 1, label: 'Uno' }] }, 'g-select'],
      [GNumberField, { label: 'Cantidad', precision: 0, min: 0, max: 9 }, 'g-number-field'],
      [GTextarea, { label: 'Notas' }, 'g-textarea']
    ]
    for (const [component, props, rootClass] of cases) {
      const wrapper = own(mount(GAdaptiveLayout, { slots: { default: () => h(component, { ...props, class: 'g-adapt-wide', style }) } }))
      const child = wrapper.element.firstElementChild
      expect(child.classList.contains(rootClass), rootClass).toBe(true)
      expect(child.classList.contains('g-adapt-wide'), rootClass).toBe(true)
      expect(child.style.getPropertyValue('--g-adapt-chars'), rootClass).toBe('5')
      expect(child.style.getPropertyValue('--g-adapt-weight'), rootClass).toBe('2')
      expect(wrapper.element.querySelectorAll('.g-adapt-wide'), rootClass).toHaveLength(1)
    }
  })
  it('--g-adapt-chars beats the inferred integer range and maxlength; the label, chrome and 24px never yield', async () => {
    const { resize } = stubEngine()
    const wrapper = own(mount(GAdaptiveLayout, { attachTo: document.body, slots: { default: () => [
      h(GNumberField, { label: 'Exterior', precision: 0, min: 0, max: 9 }),
      h(GNumberField, { label: 'Interior', precision: 0, min: 0, max: 9, style: '--g-adapt-chars: 20' }),
      h(GInput, { label: 'Código', maxlength: 3, style: '--g-adapt-chars: 12' }),
      h(GInput, { label: 'Etiquetaextremadamentelarga', class: 'g-adapt-short', style: '--g-adapt-chars: 1' })
    ] } }))
    resize(wrapper.element, 2000); await settle(30)
    const [bounded, hinted, code, long] = wrapper.findAll('.g-input').map(x => widthOf(x.element))
    expect(hinted).toBeGreaterThan(bounded)
    expect(code).toBeGreaterThanOrEqual(12 * 8)
    expect(long).toBeGreaterThanOrEqual('Etiquetaextremadamentelarga'.length * 8)
    expect(Math.min(bounded, hinted, code, long)).toBeGreaterThanOrEqual(24)
  })
  it('a family class applies to GSelect, GTextarea and a native child; two families apply none', async () => {
    const { resize } = stubEngine()
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const wrapper = own(mount(GAdaptiveLayout, { attachTo: document.body, slots: { default: () => [
      h(GSelect, { label: 'Uno', options: [{ value: 1, label: 'Uno' }], class: 'g-adapt-full' }),
      h(GTextarea, { label: 'Notas', class: 'g-adapt-short' }),
      h('label', { class: 'g-adapt-short g-adapt-wide' }, ['Nativo', h('input', { name: 'n' })]),
      h('label', {}, ['Libre', h('input', { name: 'libre' })])
    ] } }))
    resize(wrapper.element, 2000); await settle(30)
    const [select, area, native, free] = [...wrapper.element.children]
    expect(select.dataset.line).toBe('1'); expect(area.dataset.line).toBe('2')
    expect(widthOf(area)).toBeLessThan(200) // short: bounded maximum, the free textarea would take the rest of the line
    expect(widthOf(native)).toBeCloseTo(widthOf(free)) // contradiction: same inferred profile as a free native field
    expect(warning.mock.calls.filter(([m]) => m.includes('Dos o más clases'))).toHaveLength(1)
  })
  it('--g-adapt-weight on a field and on a nested group root; the group ignores families and chars with a warning', async () => {
    const { resize } = stubEngine()
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const wrapper = own(mount(GAdaptiveLayout, { attachTo: document.body, slots: { default: () => [
      h(GInput, { label: 'Uno' }),
      h(GInput, { label: 'Dos', style: '--g-adapt-weight: 9' }),
      h(GAdaptiveLayout, { class: 'g-adapt-short', style: '--g-adapt-weight: 5; --g-adapt-chars: 2' }, { default: () => [h(GInput, { label: 'A' }), h(GInput, { label: 'B' })] })
    ] } }))
    const outer = wrapper.element
    resize(outer, 3000); await settle(40)
    const [one, two] = [...outer.children].map(widthOf)
    expect(two).toBeGreaterThan(one)
    expect(warning.mock.calls.filter(([m]) => m.includes('Pista sin efecto'))).toHaveLength(1)
  })
  it('a block ignores every hint but full (warning); natural on a field or GSummary is ignored (warning); each warning once', async () => {
    const { resize } = stubEngine()
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const wrapper = own(mount(GAdaptiveLayout, { attachTo: document.body, slots: { default: () => [
      h('fieldset', { class: 'g-adapt-short', style: '--g-adapt-chars: 3' }, [h('input'), h('input')]),
      h(GFormRow, { class: 'g-adapt-full' }, { default: () => h(GInput, { label: 'Solo' }) }),
      h(GInput, { label: 'Natural', class: 'g-adapt-natural' }),
      h(GSummary, { title: 'Ficha', class: 'g-adapt-natural' }),
      h(GInput, { label: 'Fila', class: 'g-form-w-4' }),
      h(GInput, { label: 'Desconocida', class: 'g-adapt-auto' }),
      h(GInput, { label: 'Decimal', style: '--g-adapt-chars: 2.5' }),
      h(GInput, { label: 'Negativo', style: '--g-adapt-weight: -2' }),
      h(GInput, { label: 'Texto', style: '--g-adapt-chars: abc' })
    ] } }))
    resize(wrapper.element, 1200); await settle(30)
    resize(wrapper.element, 900); await settle(30)
    const messages = warning.mock.calls.map(([m]) => m).filter(m => m.startsWith('[Grana GAdaptiveLayout]'))
    for (const text of ['Pista sin efecto', 'g-form-w-*', 'desconocida', 'entero positivo', 'número positivo', 'no numérico']) expect(messages.filter(m => m.includes(text)), text).toHaveLength(1)
    const [fieldset, row] = [...wrapper.element.children]
    expect(fieldset.dataset.line).not.toBe(row.dataset.line)
    for (const message of messages) expect(message).not.toMatch(/Natural|Fila|Desconocida|Decimal|Negativo|Texto/)
  })
  it('GFormRow, GFieldGroup and GFormLayout roots get their own line even with a single control', async () => {
    const { resize } = stubEngine()
    const wrapper = own(mount(GAdaptiveLayout, { attachTo: document.body, slots: { default: () => [
      h(GInput, { label: 'A', maxlength: 2 }),
      h(GFormRow, {}, { default: () => h(GInput, { label: 'B', maxlength: 2 }) }),
      h(GInput, { label: 'C', maxlength: 2 }),
      h(GFieldGroup, { label: 'Grupo' }, { default: () => h(GInput, { label: 'D', maxlength: 2 }) }),
      h(GFormLayout, {}, { default: () => h(GInput, { label: 'E', maxlength: 2 }) })
    ] } }))
    resize(wrapper.element, 2000); await settle(30)
    expect([...wrapper.element.children].map(x => x.dataset.line)).toEqual(['1', '2', '3', '4', '5'])
  })
  it('changing only one hint re-measures that child alone; is-* classes and id/name changes never alter the plan', async () => {
    const { resize } = stubEngine()
    const walker = vi.spyOn(Document.prototype, 'createTreeWalker')
    const wrapper = own(mount(GAdaptiveLayout, { attachTo: document.body, slots: { default: () => [h(GInput, { label: 'Uno', id: 'uno', name: 'uno' }), h(GInput, { label: 'Dos' }), h(GInput, { label: 'Tres' })] } }))
    const root = wrapper.element
    resize(root, 1200); await settle(30)
    const plan = () => [...root.children].map(x => `${x.dataset.line}:${widthOf(x)}`).join()
    const before = plan(), calls = walker.mock.calls.length
    const second = root.children[1]
    second.style.setProperty('--g-adapt-chars', '3'); await settle(30)
    expect(walker.mock.calls.length - calls).toBe(1)
    expect(plan()).not.toBe(before)
    const afterHint = walker.mock.calls.length, hinted = plan()
    second.classList.add('is-focused', 'is-open'); await settle(30)
    expect(walker.mock.calls.length).toBe(afterHint)
    const input = root.querySelector('#uno')
    input.setAttribute('name', 'otro'); await settle(30)
    expect(walker.mock.calls.length).toBe(afterHint)
    input.id = 'cambiado'; await settle(30)
    expect(plan()).toBe(hinted)
    second.style.removeProperty('--g-adapt-chars'); await settle(30)
    expect(plan()).toBe(before)
  })
  it('a resized ancestor (geometry or a non-theme custom property) re-plans without re-measuring; a --g-* token, an inserted <style> and refresh() re-measure', async () => {
    const { resize } = stubEngine()
    const walker = vi.spyOn(Document.prototype, 'createTreeWalker')
    const host = document.createElement('div'); document.body.append(host)
    const wrapper = own(mount(GAdaptiveLayout, { attachTo: host, slots: { default: '<label>Nombre<input name="name"></label>' } }))
    resize(wrapper.element, 460); await settle(30)
    let calls = walker.mock.calls.length
    host.style.width = '300px'; host.style.setProperty('--w', '300px'); host.style.marginInlineStart = '4px'; await settle(30)
    expect(walker.mock.calls.length).toBe(calls)
    host.style.setProperty('--g-space-1', '5px'); await settle(30)
    expect(walker.mock.calls.length).toBeGreaterThan(calls)
    calls = walker.mock.calls.length
    const sheet = document.createElement('style'); sheet.textContent = 'label { letter-spacing: 0.12em }'; document.head.append(sheet); await settle(30)
    expect(walker.mock.calls.length).toBeGreaterThan(calls)
    calls = walker.mock.calls.length
    sheet.textContent = 'label { word-spacing: 0.16em }'; await settle(30)
    expect(walker.mock.calls.length).toBeGreaterThan(calls)
    calls = walker.mock.calls.length
    wrapper.vm.refresh(); await settle(30)
    expect(walker.mock.calls.length).toBeGreaterThan(calls)
    sheet.remove(); wrapper.unmount(); wrappers.splice(wrappers.indexOf(wrapper), 1); host.remove()
  })
  it('horizontal re-plans with the cached profiles and writes --_adaptive-start, never --_adaptive-x', async () => {
    const { resize } = stubEngine()
    const walker = vi.spyOn(Document.prototype, 'createTreeWalker')
    const horizontal = ref('start')
    const App = defineComponent({ setup: () => () => h(GAdaptiveLayout, { horizontal: horizontal.value }, { default: () => [h(GNumberField, { label: 'A', precision: 0, min: 0, max: 9 }), h(GNumberField, { label: 'B', precision: 0, min: 0, max: 9 })] }) })
    const wrapper = own(mount(App, { attachTo: document.body })), root = wrapper.find('.g-adaptive-layout').element
    resize(root, 1000); await settle(30)
    const [a, b] = root.children
    const width = widthOf(a) + widthOf(b) + (parseFloat(getComputedStyle(root).columnGap) || 0)
    expect(a.style.getPropertyValue('--_adaptive-start')).toBe('0px')
    expect(a.style.getPropertyValue('--_adaptive-x')).toBe('')
    const calls = walker.mock.calls.length
    horizontal.value = 'end'; await nextTick(); await settle(30)
    expect(walker.mock.calls.length).toBe(calls)
    expect(parseFloat(a.style.getPropertyValue('--_adaptive-start'))).toBeCloseTo(1000 - width)
    horizontal.value = 'center'; await nextTick(); await settle(30)
    expect(parseFloat(a.style.getPropertyValue('--_adaptive-start'))).toBeCloseTo((1000 - width) / 2)
  })
  it('GSummary as a direct child never gets less than its floor and shares a line when it fits', async () => {
    const { resize } = stubEngine()
    const wrapper = own(mount(GAdaptiveLayout, { attachTo: document.body, slots: { default: () => [h(GSummary, { title: 'Expediente 0042', facts: [{ label: 'Edad', value: 40 }] }), h(GInput, { label: 'Teléfono', maxlength: 10 })] } }))
    const root = wrapper.element
    for (const width of [240, 360, 460, 1200]) {
      resize(root, width); await settle(30)
      const summary = root.querySelector('.g-summary')
      expect(widthOf(summary), String(width)).toBeGreaterThanOrEqual(7 * 8)
    }
    expect(root.children[0].dataset.line).toBe(root.children[1].dataset.line)
  })
})
