import { aggregateProfiles, normalizeProfile } from './adaptivePlan.js'
// Registered groups expose a profile independent of their assigned outer width.
export const adaptiveGroups = new WeakMap()
const CONTROL = 'input:not([type=hidden]),textarea,select,[role=combobox]'
const NATURAL = '.g-avatar,img,svg'
// Full-line blocks (#361): a row, a field group or a form layout is a block even with a single control.
const FULL_BLOCK = 'table,.g-table,.g-form-reveal,fieldset,section,.g-form-section,.g-form-row,.g-field-group,.g-form-layout'
/** Child hints (#364): the five family classes; `g-adapt-auto` does not exist (absence already says it). */
export const HINT_FAMILIES = ['short', 'standard', 'wide', 'full', 'natural']
export function controlOf(root) {
  if (root.matches(CONTROL)) return root
  return [...root.querySelectorAll(CONTROL)].find(x => getComputedStyle(x).display !== 'none' && !x.hidden) || null
}
/** What the parent sees in a direct child: group · summary · natural · block · field · generic. Never a value. */
export function classify(root) {
  if (adaptiveGroups.has(root)) return 'group'
  if (root.matches('.g-summary')) return 'summary'
  if (root.matches(NATURAL)) return 'natural'
  if (root.matches(FULL_BLOCK) || root.querySelector('table')) return 'block'
  const controls = root.matches(CONTROL) ? 1 : root.querySelectorAll(CONTROL).length
  return controls > 1 ? 'block' : controls === 1 ? 'field' : 'generic'
}
function readNumber(root, style, name, issues, integer) {
  const computed = String(style?.getPropertyValue?.(name) ?? '').trim()
  if (!computed) return undefined
  const value = Number(computed)
  if (!Number.isFinite(value)) { issues.push('nonnumeric'); return undefined } // unregistered environment (jsdom)
  if (value === 0) {
    // Registered <number>: an invalid inline value computes to the initial 0. Only the inline style is checked.
    const inline = String(root.style?.getPropertyValue?.(name) ?? '').trim()
    if (inline && Number(inline) !== 0) issues.push('nonnumeric')
    return undefined
  }
  if (!(value > 0) || (integer && !Number.isInteger(value))) { issues.push(integer ? 'chars' : 'weight'); return undefined }
  return value
}
/**
 * Hints of a direct child (#364), pure: family from `classList` (exactly `g-adapt-<family>`), `chars` and `weight`
 * from the computed style the engine already reads for `order`. Same shape the profile policy used before
 * (`width`, `characters`, `weight`), so the policy itself does not change. `issues` are warning causes.
 */
export function readHints(root, style) {
  const issues = [], families = [], hint = {}
  for (const name of root.classList) {
    if (name.startsWith('g-form-w-')) issues.push('form-w')
    if (!name.startsWith('g-adapt-')) continue
    const family = name.slice(8)
    if (HINT_FAMILIES.includes(family)) families.push(family); else issues.push('class')
  }
  if (families.length > 1) issues.push('contradiction') // class order has no meaning: apply none
  else if (families.length === 1) hint.width = families[0]
  const characters = readNumber(root, style, '--g-adapt-chars', issues, true)
  const weight = readNumber(root, style, '--g-adapt-weight', issues, false)
  if (characters !== undefined) hint.characters = characters
  if (weight !== undefined) hint.weight = weight
  return { hint, issues }
}
/** Drops hints that have no effect on that kind of child (contract «Pistas por hijo»). `ignored` → one warning. */
export function effectiveHints(hint, kind) {
  const out = { ...hint }
  let ignored = false
  const drop = (key, quiet = false) => { if (out[key] !== undefined) { delete out[key]; if (!quiet) ignored = true } }
  if (kind === 'block') {
    drop('width', out.width === 'full') // full is redundant on a block, not an error
    drop('characters'); drop('weight')
    return { hint: out, ignored }
  }
  if (kind === 'group' && out.width !== 'full') drop('width')
  if (kind === 'group') drop('characters')
  if (out.width === 'natural' && (kind === 'field' || kind === 'summary')) drop('width')
  if (kind === 'natural' && out.width !== undefined && out.width !== 'full' && out.width !== 'natural') drop('width')
  if (out.width === 'natural' || kind === 'natural') { drop('characters'); drop('weight') }
  if (out.width === 'full') drop('characters')
  return { hint: out, ignored }
}
/** Cache key part: the hints actually applied. */
export const hintKey = hint => `${hint.width || ''}|${hint.characters ?? ''}|${hint.weight ?? ''}`
export function visibleChild(root, style = getComputedStyle(root)) {
  if (root.hidden || style.display === 'none' || !root.getClientRects().length) return false
  if (root.matches('.g-form-reveal') && root.hasAttribute('inert')) return false
  return true
}
const number = value => Number.isFinite(Number(value)) && value !== null && value !== '' ? Number(value) : undefined
/** Only explicit integer certainty permits inference; step=1 does not imply it. */
export function inferredCapacity(descriptor) {
  if (descriptor.characters !== undefined) return descriptor.characters
  if (descriptor.kind === 'number' && descriptor.integerOnly && Number.isSafeInteger(descriptor.min) && Number.isSafeInteger(descriptor.max) && descriptor.min <= descriptor.max) {
    // Reserve possible grouping separators as part of capacity, independent of current value.
    const length = value => { const digits = String(Math.abs(value)).length; return digits + Math.floor((digits - 1) / 3) + (value < 0 ? 1 : 0) }
    return Math.max(length(descriptor.min), length(descriptor.max))
  }
  if (descriptor.kind === 'select' && descriptor.optionCharacters) return descriptor.optionCharacters
  if (Number.isInteger(descriptor.maxlength) && descriptor.maxlength > 0) return descriptor.maxlength
  return undefined
}
/** Semantic policy independent of DOM measurement; lengths are measured glyph units. */
export function profileFromDescriptor(d) {
  const width = d.width || 'auto'
  if (d.kind === 'full') return normalizeProfile({ min: d.labelMin || 0, preferred: d.labelMin || 0, full: true })
  if (width === 'full') return { ...profileFromDescriptor({ ...d, width: 'auto' }), full: true }
  if (d.kind === 'summary') {
    // GSummary (#363): minimum = its own floor, never lowered by a hint; preferred = family `wide` unless hinted.
    const family = width === 'auto' ? 'wide' : width
    const glyph = d.glyph, min = d.floor || 0
    const preferredCharacters = d.characters ?? (family === 'short' ? 8 : family === 'standard' ? 24 : 40)
    const preferred = Math.max(min, preferredCharacters * glyph)
    const max = d.characters !== undefined ? preferred : family === 'short' ? Math.max(preferred, 16 * glyph) : Infinity
    return normalizeProfile({ min, preferred, max, weight: d.weight || (family === 'wide' ? 3 : 1) })
  }
  if (width === 'natural' || d.kind === 'natural') return normalizeProfile({ min: d.natural, preferred: d.natural, max: d.natural, weight: 0 })
  const capacity = inferredCapacity(d)
  const glyph = d.glyph, chrome = d.chrome || 0
  const minimumCharacters = width === 'wide' ? 12 : capacity !== undefined && width === 'auto' ? Math.min(capacity, 8) : 8
  const preferredCharacters = capacity !== undefined ? Math.min(capacity, width === 'short' ? 16 : 40) : width === 'short' ? 8 : width === 'standard' || (width === 'auto' && d.kind !== 'text') ? 24 : 40
  const min = Math.max(d.labelMin || 0, d.intrinsic || 0, d.touchMin || 0, minimumCharacters * glyph + chrome)
  const preferred = Math.max(min, preferredCharacters * glyph + chrome, d.optionWidth || 0)
  const max = capacity !== undefined ? Math.max(preferred, capacity * glyph + chrome) : width === 'short' ? Math.max(preferred, 16 * glyph + chrome) : Infinity
  return normalizeProfile({ min, preferred, max, weight: d.weight || (width === 'wide' || (width === 'auto' && d.kind === 'text') ? 3 : 1) })
}
export function createTextMeasurer(document) {
  let context = null
  const cache = new Map()
  function measure(text, element) {
    const style = getComputedStyle(element)
    const font = style.font || `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
    const signature = `${font}|${style.letterSpacing}|${style.wordSpacing}|${text}`
    if (cache.has(signature)) return cache.get(signature)
    if (!context) context = document.createElement('canvas').getContext('2d')
    if (!context) return NaN
    context.font = font
    const letter = parseFloat(style.letterSpacing) || 0, word = parseFloat(style.wordSpacing) || 0
    const result = context.measureText(text).width + Math.max(0, [...text].length - 1) * letter + (text.match(/\s/g)?.length || 0) * word
    if (cache.size > 2048) cache.clear()
    cache.set(signature, result)
    return result
  }
  return { measure, clear: () => cache.clear() }
}
function labelElements(root, control) {
  const local = [...root.querySelectorAll('label, .g-select__label, .g-textarea__label')]
  if (root.matches('label')) local.unshift(root)
  if (local.length) return local
  const ids = control?.getAttribute('aria-labelledby')?.split(/\s+/) || []
  if (ids.length) return ids.map(id => root.ownerDocument.getElementById(id)).filter(Boolean)
  if (control?.labels?.length) return [...control.labels]
  return []
}
const horizontalBox = el => {
  const s = getComputedStyle(el)
  return ['paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth'].reduce((total, key) => total + (parseFloat(s[key]) || 0), 0)
}
function chromeOf(root, control) {
  const box = root.querySelector('.g-input__control, .g-select__control, .g-select__trigger, .g-textarea__control')
  if (!box || !box.contains(control)) return control ? horizontalBox(control) : horizontalBox(root)
  let chrome = horizontalBox(box) + horizontalBox(control)
  const contents = [...box.children].filter(x => {
    const style = getComputedStyle(x)
    return style.display !== 'none' && style.position !== 'absolute' && style.position !== 'fixed'
  })
  for (const child of contents) {
    if (child === control || child.contains(control) || child.matches('.g-number-field__value, .g-select__value')) continue
    chrome += child.getBoundingClientRect().width
  }
  if (control.matches('[role=combobox]')) {
    const nested = [...control.children].filter(x => getComputedStyle(x).display !== 'none')
    for (const child of nested) if (!child.matches('.g-select__value')) chrome += child.getBoundingClientRect().width
    chrome += Math.max(0, nested.length - 1) * (parseFloat(getComputedStyle(control).columnGap) || 0)
  }
  chrome += Math.max(0, contents.length - 1) * (parseFloat(getComputedStyle(box).columnGap) || 0)
  return chrome
}
function summaryProfile(root, hint, measurer) {
  const title = root.querySelector('.g-summary__title') || root
  const lead = root.querySelector(':scope > .g-summary__lead')
  const identity = lead ? lead.getBoundingClientRect().width + (parseFloat(getComputedStyle(root).columnGap) || 0) : 0
  const zero = measurer.measure('0', title), glyph = measurer.measure('88888888', title) / 8
  if (!Number.isFinite(zero) || !Number.isFinite(glyph) || glyph <= 0) return null
  // Title floor from GSummary.css: 7ch in row and stack, 4ch in inline (1ch = advance of «0» in the title font).
  const floor = identity + (root.matches('.g-summary--layout-inline') ? 4 : 7) * zero
  return profileFromDescriptor({ ...hint, kind: 'summary', floor, glyph })
}
export function measureProfile(root, hint = {}, intrinsic = 0, measurer, kind = classify(root)) {
  if (kind === 'group') return normalizeProfile({ ...adaptiveGroups.get(root).profile(), ...(hint.weight ? { weight: hint.weight } : {}), ...(hint.width === 'full' ? { full: true } : {}) })
  if (kind === 'summary') return summaryProfile(root, hint, measurer)
  if (kind === 'natural' || hint.width === 'natural') {
    const height = root.getBoundingClientRect().height
    let width
    if (root.matches('.g-avatar')) width = height
    else if (root.matches('img')) {
      const explicitHeight = root.hasAttribute('height') || Boolean(root.style.height || root.style.blockSize)
      width = explicitHeight && root.naturalHeight ? height * root.naturalWidth / root.naturalHeight : root.naturalWidth
    } else if (root.matches('svg') && root.viewBox?.baseVal.width) {
      const view = root.viewBox.baseVal
      const explicitHeight = root.hasAttribute('height') || Boolean(root.style.height || root.style.blockSize)
      width = explicitHeight && view.height ? height * view.width / view.height : view.width
    } else width = measurer.measure(root.textContent.trim(), root) + horizontalBox(root)
    return profileFromDescriptor({ kind: 'natural', natural: Math.max(0, width || height), width: hint.width })
  }
  if (kind === 'block') return profileFromDescriptor({ kind: 'full' })
  const control = controlOf(root)
  const labelWidths = labelElements(root, control).flatMap(el => {
    const widths = [], walker = el.ownerDocument.createTreeWalker(el, 4)
    for (let text = walker.nextNode(); text; text = walker.nextNode()) {
      for (const word of text.textContent.trim().split(/\s+/).filter(Boolean)) widths.push(measurer.measure(word, text.parentElement || el))
    }
    return widths
  })
  const labelMin = Math.max(0, ...labelWidths)
  const aria = !labelMin ? control?.getAttribute('aria-label') : ''
  const labelWidth = aria ? Math.max(...aria.split(/\s+/).map(x => measurer.measure(x, control))) : labelMin
  const reference = control || root
  const glyph = measurer.measure('88888888', reference) / 8
  if (!Number.isFinite(glyph) || glyph <= 0) return null
  const role = !control ? 'generic' : control.matches('select,[role=combobox]') ? 'select' : control.matches('[role=spinbutton],input[type=number]') ? 'number' : 'text'
  const integerOnly = root.matches('.g-number-field') && control?.getAttribute('inputmode') === 'numeric'
  const min = number(control?.getAttribute('aria-valuemin') ?? control?.getAttribute('min'))
  const max = number(control?.getAttribute('aria-valuemax') ?? control?.getAttribute('max'))
  let optionWidth = 0, optionCharacters
  if (control?.matches('select')) {
    const options = [...control.options].map(x => x.label || x.textContent)
    optionWidth = Math.max(0, ...options.map(x => measurer.measure(x, control))) + chromeOf(root, control)
    optionCharacters = Math.max(0, ...options.map(x => [...x].length)) || undefined
  }
  return profileFromDescriptor({ kind: role, ...hint, glyph, touchMin: control ? (root.ownerDocument.defaultView?.matchMedia?.('(pointer: coarse)').matches ? 44 : 24) : 0, chrome: chromeOf(root, control), labelMin: labelWidth, intrinsic, min, max, integerOnly, maxlength: number(control?.getAttribute('maxlength')), optionWidth, optionCharacters })
}
export { aggregateProfiles }
