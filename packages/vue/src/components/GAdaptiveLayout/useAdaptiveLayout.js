import { onBeforeUnmount, onMounted, unref, watch } from 'vue'
import { isDev } from '../GForm/formContext.js'
import { observeRow, scheduleRow } from '../GFormRow/rowEngine.js'
import { aggregateProfiles, placeAdaptive, planAdaptive } from './adaptivePlan.js'
import { adaptiveGroups, classify, createTextMeasurer, effectiveHints, hintKey, measureProfile, readHints, visibleChild } from './adaptiveProfiles.js'
const LABEL = 'label,.g-select__label,.g-textarea__label,.g-input__prefix,.g-input__suffix,option'
const NOISE = '.g-tooltip,.g-number-field__mirror,.g-number-field__roll,.g-number-field__measure,.g-input__counter,.g-select__value'
// Mutation verdicts: ignore · the hints of one direct child changed (re-plan, re-measure only that child) · invalidate.
const IGNORE = 0, HINT = 1, INVALIDATE = 2
// Ancestor declarations that only size or move boxes: the ResizeObserver already reports their effect on the width
// (hallazgo 5 de coco: a host resized through its style attribute re-measured every profile on every step).
const GEOMETRY = /^(?:(?:min-|max-)?(?:width|height|inline-size|block-size)|margin(?:-[a-z-]+)?|inset(?:-[a-z-]+)?|top|right|bottom|left|transform|translate|scale|rotate|flex(?:-basis|-grow|-shrink)?|grid-(?:area|row|column)(?:-start|-end)?|order|position|z-index)$/
const WARNINGS = {
  class: 'Clase g-adapt-* desconocida (no existe g-adapt-auto: sin clase la familia se infiere); usa short, standard, wide, full o natural.',
  contradiction: 'Dos o más clases de familia g-adapt-* en el mismo hijo: no se aplica ninguna.',
  chars: '--g-adapt-chars debe ser un entero positivo (0 = sin pista): se ignora.',
  weight: '--g-adapt-weight debe ser un número positivo (0 = sin pista): se ignora.',
  nonnumeric: 'Valor no numérico en --g-adapt-chars o --g-adapt-weight: queda sin pista.',
  ignored: 'Pista sin efecto en ese hijo (bloque completo, grupo, campo o GSummary con g-adapt-natural, o combinación redundante): se ignora.',
  'form-w': 'Clase g-form-w-* en un hijo de GAdaptiveLayout: es de GFormRow; usa g-adapt-*.'
}
/** `name: value` declarations of a style attribute, without a CSS parser (parentheses and quotes respected). */
function declarations(text) {
  const map = new Map()
  if (!text) return map
  let depth = 0, quote = '', start = 0
  const push = (part) => {
    const colon = part.indexOf(':')
    if (colon <= 0) return
    const raw = part.slice(0, colon).trim()
    map.set(raw.startsWith('--') ? raw : raw.toLowerCase(), part.slice(colon + 1).trim())
  }
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quote) { if (c === quote && text[i - 1] !== '\\') quote = ''; continue }
    if (c === '"' || c === "'") quote = c
    else if (c === '(') depth++
    else if (c === ')') depth = Math.max(0, depth - 1)
    else if (c === ';' && !depth) { push(text.slice(start, i)); start = i + 1 }
  }
  push(text.slice(start))
  return map
}
function changedProperties(before, after) {
  const a = declarations(before), b = declarations(after), changed = []
  for (const [name, value] of a) if (b.get(name) !== value) changed.push(name)
  for (const name of b.keys()) if (!a.has(name)) changed.push(name)
  return changed
}
const ownAlias = name => name.startsWith('--_adaptive-')
const hintProperty = name => name.startsWith('--g-adapt-')
const ROOT_OWN = /^(?:is-ready|has-shared-tracks|g-adaptive-layout--(?:horizontal|vertical)-.+|g-adapt-.+)$/
const SHARED_OWN = /^(?:is-ready|has-shared-tracks|is-(?:focused|rolling|bumping|active))$/
const classDiff = (before, after, ignore) => {
  const list = text => new Set((text || '').split(/\s+/).filter(x => x && !ignore.test(x)))
  const a = list(before), b = list(after)
  return a.size !== b.size || [...a].some(x => !b.has(x))
}
/** Verdict for one mutation record, relative to this layout's root. */
function verdict(record, root) {
  const target = record.target.nodeType === 1 ? record.target : record.target.parentElement
  if (!target) return IGNORE
  const inside = target !== root && root.contains(target), direct = target.parentElement === root
  if (record.type === 'characterData') return inside && target.closest(LABEL) ? INVALIDATE : IGNORE
  if (record.type === 'childList') {
    if (target === root || (inside && target.closest(LABEL))) return INVALIDATE
    return direct && target.matches('.g-summary') ? INVALIDATE : IGNORE // GSummary: identity box or layout changed
  }
  const name = record.attributeName
  if (name === 'data-line' || name === 'data-lines' || name === 'data-strategy') return IGNORE
  const now = target.getAttribute(name)
  if (!inside) {
    // The root itself and its ancestors (theme): geometry, private aliases, non-theme custom properties and the
    // non-inherited hints never change a profile; `--g-*` tokens, typography and every other declaration do.
    if (name === 'style') return changedProperties(record.oldValue, now).some(p => !GEOMETRY.test(p) && !p.startsWith('--_') && !hintProperty(p) && (!p.startsWith('--') || p.startsWith('--g-'))) ? INVALIDATE : IGNORE
    if (name === 'class') return classDiff(record.oldValue, now, target === root ? ROOT_OWN : SHARED_OWN) ? INVALIDATE : IGNORE
    return INVALIDATE
  }
  if (target.closest(NOISE)) return IGNORE
  if (name === 'style') {
    const changed = changedProperties(record.oldValue, now).filter(p => !ownAlias(p))
    if (!changed.length) return IGNORE
    if (changed.every(hintProperty)) return direct ? HINT : IGNORE
    return INVALIDATE
  }
  if (name === 'class') {
    // State classes (is-*) of a field never require a new measurement (#364); hint classes only re-read that child.
    if (classDiff(record.oldValue, now, /^(?:is-.+|has-shared-tracks|g-adapt-.+)$/)) return INVALIDATE
    if (!direct) return IGNORE
    return classDiff(record.oldValue, now, /^(?!g-adapt-)/) ? HINT : IGNORE
  }
  return INVALIDATE
}
// One head observer per document for every mounted layout (hallazgo 6 de coco): an inserted, removed, edited or
// enabled/disabled stylesheet may change fonts, tokens or chrome. adoptedStyleSheets and CSSOM edits: refresh().
const SHEET = 'style,link[rel~=stylesheet]'
const sheetWatchers = new Map()
function touchesSheets(record) {
  if (record.type === 'childList') {
    if (record.target.nodeType === 1 && record.target.matches('style')) return true
    return [...record.addedNodes, ...record.removedNodes].some(n => n.nodeType === 1 && (n.matches(SHEET) || n.querySelector?.(SHEET)))
  }
  const target = record.target.nodeType === 1 ? record.target : record.target.parentElement
  return Boolean(target?.matches(SHEET))
}
function watchSheets(doc, callback) {
  if (typeof MutationObserver === 'undefined' || !doc?.head) return () => {}
  let entry = sheetWatchers.get(doc)
  if (!entry) {
    const callbacks = new Set()
    const observer = new MutationObserver(records => { if (records.some(touchesSheets)) for (const fn of [...callbacks]) fn() })
    observer.observe(doc.head, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['disabled', 'media', 'href', 'rel'] })
    entry = { observer, callbacks }
    sheetWatchers.set(doc, entry)
  }
  entry.callbacks.add(callback)
  return () => {
    entry.callbacks.delete(callback)
    if (!entry.callbacks.size) { entry.observer.disconnect(); sheetWatchers.delete(doc) }
  }
}
const fontOf = s => `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}|${s.letterSpacing}|${s.wordSpacing}`
/** DOM reads/profiles are separate from the pure solver and placement writes. */
export function useAdaptiveLayout(root, props, context) {
  const intrinsic = new Map(), profileCache = new WeakMap(), written = new Map(), warned = new Set()
  let version = 0, stop = null, mutation = null, ancestorMutation = null, externalLabels = null, measurer = null, mounted = false
  let groupProfile = aggregateProfiles([])
  let lastGap = 0, pointerQuery = null, unwatchSheets = null, labelsVersion = -1, labelsChildren = []
  function warn(key, text) {
    if (!isDev || warned.has(key)) return
    warned.add(key); console.warn(`[Grana GAdaptiveLayout] ${text}`)
  }
  const schedule = () => { if (mounted && root.value) scheduleRow(root.value) }
  /** Internal invalidation: every cached profile is stale (text measurements keyed by font stay valid). */
  function invalidate() { version++; schedule() }
  /** Public: also forgets measured glyphs (late fonts, CSSOM edits the browser does not notify). */
  function refresh() { measurer?.clear(); invalidate() }
  function setIntrinsicMin(el, px) {
    if (!el) return
    const value = Number.isFinite(px) && px > 0 ? px : 0
    const old = intrinsic.get(el) || 0
    if (value) intrinsic.set(el, value); else intrinsic.delete(el)
    if (Math.abs(value - old) >= 0.5) { profileCache.delete(el); if (root.value) scheduleRow(root.value) }
  }
  function restore(el) {
    const snapshot = written.get(el)
    if (!snapshot) return
    for (const [name, entry] of snapshot) {
      const current = name === 'data-line' ? el.getAttribute(name) : el.style.getPropertyValue(name)
      if (current !== entry.last) continue
      if (name === 'data-line') { if (entry.before === null) el.removeAttribute(name); else el.setAttribute(name, entry.before) }
      else if (entry.before) el.style.setProperty(name, entry.before, entry.priority); else el.style.removeProperty(name)
    }
    written.delete(el)
  }
  function write(el, name, value) {
    let snapshot = written.get(el)
    if (!snapshot) { snapshot = new Map(); written.set(el, snapshot) }
    const current = name === 'data-line' ? el.getAttribute(name) : el.style.getPropertyValue(name)
    if (!snapshot.has(name)) snapshot.set(name, { before: current, priority: name === 'data-line' ? '' : el.style.getPropertyPriority(name), last: value })
    else snapshot.get(name).last = value
    if (current === value) return
    if (name === 'data-line') el.setAttribute(name, value); else el.style.setProperty(name, value)
  }
  const publish = (profile) => {
    const old = groupProfile
    groupProfile = profile
    if (['min', 'preferred', 'max', 'weight'].some(key => old[key] !== profile[key])) context.parentSchedule?.()
  }
  function fallback() {
    for (const el of written.keys()) restore(el)
    if (root.value) { root.value.classList.remove('is-ready', 'has-shared-tracks'); root.value.removeAttribute('data-lines'); root.value.removeAttribute('data-strategy') }
  }
  function observeExternalLabels(el, children) {
    // Only when the children or the profiles changed: re-querying every control on each resize step costs per frame.
    if (labelsVersion === version && labelsChildren.length === children.length && labelsChildren.every((c, i) => c === children[i])) return
    labelsVersion = version; labelsChildren = children
    externalLabels?.disconnect()
    for (const child of children) {
      const selector = '[aria-labelledby],input,textarea,select'
      const controls = [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]
      for (const control of controls) {
        const labels = [...(control.labels || []), ...(control.getAttribute('aria-labelledby')?.split(/\s+/) || []).map(id => el.ownerDocument.getElementById(id)).filter(Boolean)]
        for (const label of labels) if (!el.contains(label)) externalLabels?.observe(label, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'lang', 'dir'] })
      }
    }
  }
  function run(width) {
    const el = root.value
    if (!mounted || !el || !(width > 0)) return
    if ([...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) { warn('text', 'Texto suelto: envuélvelo en un elemento; se conserva la pila.'); fallback(); return }
    const children = [], styles = []
    for (const child of el.children) {
      const childStyle = getComputedStyle(child)
      if (visibleChild(child, childStyle)) { children.push(child); styles.push(childStyle) }
    }
    const style = getComputedStyle(el), gap = Math.max(0, parseFloat(style.columnGap) || 0)
    if (gap !== lastGap) { version++; lastGap = gap }
    const dense = style.gridAutoFlow.includes('dense')
    const profiles = children.map((child, i) => {
      const childStyle = styles[i]
      if (childStyle.order !== '0' || dense) warn('order', 'order/dense puede romper el orden lógico; conserva el orden DOM.')
      const cached = profileCache.get(child)
      const current = cached?.version === version
      const kind = current ? cached.kind : classify(child)
      // Hints live in the child (#364): its classes and its computed --g-adapt-* (same style query as `order`).
      const read = readHints(child, childStyle)
      for (const issue of read.issues) warn(`hint-${issue}`, WARNINGS[issue])
      const { hint, ignored } = effectiveHints(read.hint, kind)
      if (ignored) warn('hint-ignored', WARNINGS.ignored)
      const key = hintKey(hint), font = fontOf(childStyle)
      if (current && cached.key === key && cached.font === font && kind !== 'group') return cached.profile
      const profile = measureProfile(child, hint, intrinsic.get(child) || 0, measurer, kind)
      if (profile) profileCache.set(child, { version, kind, key, font, profile })
      return profile
    })
    if (profiles.some(x => !x)) { fallback(); return }
    observeExternalLabels(el, children)
    publish(aggregateProfiles(profiles, gap))
    const plan = planAdaptive(profiles, width, gap, { stack: Boolean(unref(context.stack)) })
    const placements = placeAdaptive(plan, width, gap, props.horizontal)
    if (plan.strategy === 'linear') warn('large', 'Más de 64 hijos: se usa partición contigua voraz de coste acotado.')
    const peers = new Map()
    for (const item of placements) if (children[item.index].matches('.g-input,.g-select,.g-textarea')) peers.set(item.line, (peers.get(item.line) || 0) + 1)
    const sharedTracks = [...peers.values()].some(count => count >= 2)
    // All measurement above precedes writes. Never move/clone/recreate a slot node.
    for (const child of written.keys()) if (child !== el && !children.includes(child)) { restore(child); if (child.parentElement !== el) intrinsic.delete(child) }
    for (const item of placements) {
      const child = children[item.index]
      write(child, '--_adaptive-line', String(item.line))
      write(child, '--_adaptive-track', String(4 * (item.line - 1) + 1))
      write(child, '--_adaptive-width', `${item.width}px`)
      write(child, '--_adaptive-start', `${item.start}px`)
      write(child, 'data-line', String(item.line))
    }
    write(el, '--_adaptive-rows', sharedTracks && plan.lines.length ? Array(plan.lines.length).fill('auto auto auto').join(' var(--_adaptive-row-gap) ') : 'none')
    const lines = String(plan.lines.length)
    if (el.getAttribute('data-lines') !== lines) el.setAttribute('data-lines', lines)
    if (el.getAttribute('data-strategy') !== plan.strategy) el.setAttribute('data-strategy', plan.strategy)
    if (el.classList.contains('has-shared-tracks') !== sharedTracks) el.classList.toggle('has-shared-tracks', sharedTracks)
    if (!el.classList.contains('is-ready')) el.classList.add('is-ready')
  }
  const react = records => {
    const el = root.value
    if (!el) return
    let result = IGNORE
    for (const record of records) { result = Math.max(result, verdict(record, el)); if (result === INVALIDATE) break }
    if (result === INVALIDATE) invalidate(); else if (result === HINT) schedule()
  }
  const resource = event => { if (event.target?.matches?.('img,link[rel=stylesheet]')) refresh() }
  const fonts = () => refresh()
  onMounted(() => {
    const el = root.value
    if (!el) return
    mounted = true
    if (el.parentElement?.closest('.g-form-row')) warn('row', 'No anides GAdaptiveLayout dentro de GFormRow; usa GFormLayout.')
    measurer = createTextMeasurer(el.ownerDocument)
    adaptiveGroups.set(el, { profile: () => groupProfile })
    stop = observeRow(el, run)
    if (typeof MutationObserver !== 'undefined') {
      // `name` no longer matters (#364: hints live in the child); `id` stays for label association (for, aria-labelledby).
      mutation = new MutationObserver(react)
      mutation.observe(el, { childList: true, characterData: true, subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ['class', 'style', 'lang', 'dir', 'hidden', 'inert', 'id', 'min', 'max', 'step', 'inputmode', 'maxlength', 'aria-valuemin', 'aria-valuemax', 'aria-label', 'aria-labelledby', 'label'] })
      externalLabels = new MutationObserver(invalidate)
      // Root and ancestors up to html: theme classes, attributes and token declarations (geometry filtered in verdict)
      ancestorMutation = new MutationObserver(react)
      for (let node = el; node; node = node.parentElement) ancestorMutation.observe(node, { attributes: true, attributeOldValue: true })
    }
    unwatchSheets = watchSheets(el.ownerDocument, invalidate)
    el.ownerDocument.addEventListener('load', resource, true)
    pointerQuery = el.ownerDocument.defaultView?.matchMedia?.('(pointer: coarse)')
    pointerQuery?.addEventListener?.('change', fonts)
    const fontSet = el.ownerDocument.fonts
    fontSet?.addEventListener?.('loadingdone', fonts)
    fontSet?.ready?.then(() => { if (mounted) refresh() })
  })
  // horizontal and vertical only move lines (placement and CSS): re-plan with the cached profiles
  watch([() => props.horizontal, () => props.vertical], schedule)
  watch([() => props.gap, () => unref(context.density), () => unref(context.stack)], invalidate)
  onBeforeUnmount(() => {
    mounted = false; stop?.(); mutation?.disconnect(); ancestorMutation?.disconnect(); externalLabels?.disconnect(); unwatchSheets?.()
    const el = root.value
    el?.ownerDocument.removeEventListener('load', resource, true)
    el?.ownerDocument.fonts?.removeEventListener?.('loadingdone', fonts)
    pointerQuery?.removeEventListener?.('change', fonts)
    if (el) adaptiveGroups.delete(el)
    fallback(); intrinsic.clear(); measurer?.clear(); labelsChildren = []; context.parentSchedule?.()
  })
  return { refresh, schedule, setIntrinsicMin }
}
