<script setup>
// Ficha interactiva de un componente (contrato de mora-docs §3, bloques 4 a 6: «el código es el control»).
// - Monta el componente REAL del paquete construido (registrado por el tema), nunca una imitación.
// - Los controles salen del meta.json: cada prop con `values` es un botón que cicla, cada Boolean una casilla.
//   La ficha de site/live/G<Nombre>.js solo dice qué textos, datos y slots necesita el ejemplo (Grana no trae
//   textos por defecto) y qué props no tiene sentido tocar aquí.
// - «Copiar» omite lo que está en su valor por defecto. Una línea viva anuncia cada cambio.
// - Cotas medidas y «Qué lee del tema»: computed style del elemento medido, emparejado con los tokens --g-* reales.
import { computed, h, nextTick, onBeforeUnmount, onMounted, reactive, ref, resolveComponent, watch } from 'vue'
import { useData } from 'vitepress'
import { GBtn } from '@grana/vue'

const props = defineProps({
  meta: { type: Object, required: true },
  spec: { type: Object, required: true }
})

const { lang, isDark } = useData()
const en = computed(() => lang.value === 'en')
const T = computed(() => (en.value ? TEXT.en : TEXT.es))
const TEXT = {
  es: {
    region: 'Prueba en vivo', stage: 'Vista previa', code: 'Código: cada valor es un control', copy: 'Copiar', copied: 'Copiado',
    reset: 'Restablecer', next: 'Cambiar a siguiente', theme: 'Tema de la vista', follow: 'Página', light: 'Claro', dark: 'Oscuro',
    width: 'Ancho', free: 'Libre', phone: 'Teléfono', reads: 'Qué lee del tema', size: 'Medidas', events: 'Eventos',
    noEvents: 'Interactúa con el componente para ver sus eventos.', bg: 'Fondo', fg: 'Texto', border: 'Borde', radius: 'Radio',
    font: 'Letra', transparent: 'transparente', none: 'sin borde', noToken: 'sin token', unset: 'sin valor', model: 'Modelo',
    cases: 'Casos de uso', open: 'Abrir en la ficha', why: 'Por qué', on: 'activado', off: 'desactivado', slot: 'slot',
    loaded: 'Caso cargado en la ficha', unavailable: 'Vista previa no disponible'
  },
  en: {
    region: 'Live playground', stage: 'Preview', code: 'Code: every value is a control', copy: 'Copy', copied: 'Copied',
    reset: 'Reset', next: 'Change to next', theme: 'Preview theme', follow: 'Page', light: 'Light', dark: 'Dark',
    width: 'Width', free: 'Free', phone: 'Phone', reads: 'What it reads from the theme', size: 'Measurements', events: 'Events',
    noEvents: 'Interact with the component to see its events.', bg: 'Background', fg: 'Text', border: 'Border', radius: 'Radius',
    font: 'Type', transparent: 'transparent', none: 'no border', noToken: 'no token', unset: 'unset', model: 'Model',
    cases: 'Use cases', open: 'Open in the playground', why: 'Why', on: 'on', off: 'off', slot: 'slot',
    loaded: 'Case loaded in the playground', unavailable: 'Preview not available'
  }
}
// Un texto en los dos idiomas es { es, en }; cualquier otro objeto (opciones, datos) pasa tal cual.
const isI18n = (v) => v && typeof v === 'object' && !Array.isArray(v) && 'es' in v && Object.keys(v).every((k) => k === 'es' || k === 'en')
const isPlain = (v) => v && typeof v === 'object' && (Array.isArray(v) || Object.getPrototypeOf(v) === Object.prototype)
// Recursivo: un texto { es, en } dentro de `labels`, opciones o filas también se traduce.
const tr = (v) => (isI18n(v) ? (en.value ? v.en ?? v.es : v.es ?? v.en)
  : Array.isArray(v) ? v.map(tr)
  : isPlain(v) ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, tr(x)])) : v)
const trAll = (o) => Object.fromEntries(Object.entries(o || {}).map(([k, v]) => [k, tr(v)]))

// ------------------------------------------------------------------ modelo de la ficha
const tag = computed(() => props.spec.tag || props.meta.tag)
const metaProps = computed(() => props.meta.props || [])
const exclude = computed(() => new Set([...(props.spec.exclude || []), 'modelValue', ...(props.spec.model ? [props.spec.model.prop || 'modelValue'] : [])]))
const textProps = computed(() => props.spec.text || [])
const controls = computed(() => {
  const only = props.spec.controls
  const list = metaProps.value.filter((p) => {
    if (exclude.value.has(p.name)) return false
    if (only) return only.includes(p.name)
    if (textProps.value.includes(p.name)) return true
    return (Array.isArray(p.values) && p.values.length > 1) || p.type === 'Boolean'
  })
  const rank = (p) => (textProps.value.includes(p.name) ? 0 : p.type === 'Boolean' ? 2 : 1)
  if (only) list.sort((a, b) => only.indexOf(a.name) - only.indexOf(b.name))
  else list.sort((a, b) => rank(a) - rank(b))
  return list.map((p) => ({
    name: p.name,
    kind: textProps.value.includes(p.name) ? 'text' : p.type === 'Boolean' ? 'bool' : 'enum',
    // Una prop obligatoria sin valor por defecto no ofrece «—»: empieza en su primer valor.
    values: p.type === 'Boolean' ? [false, true] : p.default == null && !p.required && Array.isArray(p.values) ? [null, ...p.values] : p.values || [],
    def: p.default ?? (p.type === 'Boolean' ? false : p.required && Array.isArray(p.values) ? p.values[0] : null),
    required: !!p.required
  }))
})
const controlNames = computed(() => new Set(controls.value.map((c) => c.name)))
// `spec.hidden`: props que la ficha pasa al anfitrión pero que no son del componente (no salen en el código).
const hidden = computed(() => new Set(props.spec.hidden || []))
// `spec.when`: { prop: (estado) => boolean }. Un control que no aplica con los valores actuales ni se ve ni se pasa
// (p. ej. labelMode solo con appearance segmented o chip).
const applies = (c, state) => typeof props.spec.when?.[c.name] !== 'function' || !!props.spec.when[c.name](state)

// El estado guarda todas las props: las fijas de `base` (textos, datos) y los controles del meta.json.
function initial() {
  const v = { ...trAll(props.spec.base) }
  for (const c of controls.value) if (!(c.name in v)) v[c.name] = c.def
  return v
}
const values = reactive(initial())
const slotOn = reactive(Object.fromEntries((props.spec.slots || []).map((s) => [s.name, s.optional ? !!s.on : true])))
const model = ref(props.spec.model ? clone(props.spec.model.value) : undefined)
const renderKey = ref(0)

function clone(v) { return v === undefined ? v : JSON.parse(JSON.stringify(v)) }

function reset() {
  for (const k of Object.keys(values)) delete values[k]
  Object.assign(values, initial())
  for (const s of props.spec.slots || []) slotOn[s.name] = s.optional ? !!s.on : true
  if (props.spec.model) model.value = clone(props.spec.model.value)
  log.value = []
  renderKey.value++
  announce(T.value.reset)
}

// Lo fijo de un estado (textos, datos): todo lo que no es un control. Vacío = no se pasa.
const empty = (v) => v === null || v === undefined || v === ''
const fixedOf = (state) => Object.fromEntries(Object.entries(state).filter(([k, v]) => !controlNames.value.has(k) && !empty(v)))

// ------------------------------------------------------------------ eventos
const log = ref([])
const listened = computed(() => {
  if (props.spec.listen === false) return []
  const skip = new Set(props.spec.ignore || [])
  const modelEv = `update:${props.spec.model?.prop || 'modelValue'}`
  return (props.meta.events || []).map((e) => e.name).filter((n) => n !== modelEv && !skip.has(n))
})
function payloadText(args) {
  return args.map((a) => {
    if (a instanceof Event) return a.constructor.name
    if (a === undefined) return ''
    try {
      const s = JSON.stringify(a, (k, v) => (v instanceof Event ? v.constructor.name : v instanceof Node ? `<${v.nodeName.toLowerCase()}>` : v))
      return s && s.length > 80 ? s.slice(0, 77) + '…' : s
    } catch { return String(a) }
  }).filter(Boolean).join(', ')
}
const handlerName = (ev) => 'on' + ev.split(':').map((p, i) => (i === 0 ? p.charAt(0).toUpperCase() + p.slice(1) : p)).join(':').replace(/-([a-z])/g, (_, c) => c.toUpperCase())

function vnodeProps(state = values, slots = slotOn, mdl = model, record = true) {
  const p = fixedOf(state)
  // Un control en su valor por defecto no se pasa: el componente aplica el suyo (y no avisa de combinaciones que no pidió).
  for (const c of controls.value) if (applies(c, state) && !empty(state[c.name]) && (state[c.name] !== c.def || c.required)) p[c.name] = state[c.name]
  if (props.spec.model) {
    const mp = props.spec.model.prop || 'modelValue'
    p[mp] = mdl.value
    p[`onUpdate:${mp}`] = (v) => { mdl.value = v; if (record) push(`update:${mp}`, [v]) }
  }
  if (record) for (const ev of listened.value) p[handlerName(ev)] = (...args) => push(ev, args)
  return p
}
function push(name, args) {
  log.value = [{ id: Math.random(), name, payload: payloadText(args) }, ...log.value].slice(0, 6)
}
function vnodeSlots(slots = slotOn) {
  const out = {}
  for (const s of props.spec.slots || []) {
    if (!slots[s.name]) continue
    const fn = typeof s.render === 'function' ? s.render : () => tr(s.text ?? s.code)
    // Normalizado como un slot compilado: siempre un arreglo, y sin el aviso de Vue cuando un componente
    // lo llama fuera de su render (diálogos de GWidgetConfig y GWidgetGallery).
    const slot = (...a) => { const r = fn(...a); return Array.isArray(r) ? r : r == null ? [] : [r] }
    slot._n = true
    out[s.name] = slot
  }
  return out
}

// El componente real, como función de render (también para los casos).
// `spec.host`: un componente propio que recibe las mismas props (servicios, composiciones).
// `spec.trigger`: un botón antes del componente que pone el modelo en `trigger.value` (diálogos, hojas, menús).
function Real(state, slots, mdl, record) {
  return () => {
    const comp = h(props.spec.host || resolveComponent(tag.value), vnodeProps(state, slots, mdl, record), vnodeSlots(slots))
    if (!props.spec.trigger) return comp
    const t = props.spec.trigger
    return h('div', { class: 'grana-live__with-trigger' }, [
      h(GBtn, { variant: t.variant || 'outline', color: t.color || 'neutral', onClick: () => { mdl.value = clone(t.value ?? true) } }, () => tr(t.label)),
      comp
    ])
  }
}
const Live = { name: 'GranaLiveReal', setup: () => Real(values, slotOn, model, true) }

// ------------------------------------------------------------------ código
const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
const isPrim = (v) => v === null || ['string', 'number', 'boolean'].includes(typeof v)
// Literal de JavaScript legible: cada elemento en una línea si cabe.
function jsLiteral(v, ind = '') {
  if (v === null || typeof v !== 'object') return typeof v === 'string' ? `'${v.replace(/'/g, "\\'")}'` : String(v)
  const inner = ind + '  '
  const arr = Array.isArray(v)
  const items = arr ? v.map((x) => jsLiteral(x, inner)) : Object.entries(v).map(([k, x]) => `${/^[A-Za-z_$][\w$]*$/.test(k) ? k : `'${k}'`}: ${jsLiteral(x, inner)}`)
  if (!items.length) return arr ? '[]' : '{}'
  const one = arr ? `[${items.join(', ')}]` : `{ ${items.join(', ')} }`
  if (one.length + ind.length <= 78 && !one.includes('\n')) return one
  return arr ? `[\n${items.map((i) => inner + i).join(',\n')}\n${ind}]` : `{\n${items.map((i) => inner + i).join(',\n')}\n${ind}}`
}
const modelVar = computed(() => props.spec.model?.var || 'valor')

// Atributos en el orden de la ficha. `parts` para la vista editable; `clean` para copiar.
function attrList(state, slots, { clean }) {
  const out = []
  if (props.spec.model) {
    const mp = props.spec.model.prop || 'modelValue'
    out.push({ kind: 'fixed', text: mp === 'modelValue' ? `v-model="${modelVar.value}"` : `v-model:${kebab(mp)}="${modelVar.value}"` })
  }
  for (const [k, v] of Object.entries(fixedOf(state))) {
    if (hidden.value.has(k)) continue
    const code = props.spec.code?.[k]
    if (code) out.push({ kind: 'fixed', text: code })
    else if (typeof v === 'string') out.push({ kind: 'fixed', text: `${kebab(k)}="${tr(v)}"` })
    else if (v === true) out.push({ kind: 'fixed', text: kebab(k) })
    else if (isPrim(v)) out.push({ kind: 'fixed', text: `:${kebab(k)}="${v}"` })
    else out.push({ kind: 'fixed', text: `:${kebab(k)}="${k}"` })
  }
  for (const c of controls.value) {
    if (!applies(c, state)) continue
    const v = state[c.name]
    const isDef = v === c.def || (v == null && c.def == null) || (c.kind === 'text' && !v)
    if (clean && isDef && !c.required) continue
    if (c.kind === 'bool') out.push({ kind: 'bool', c, on: !!v, text: kebab(c.name), isDef })
    else if (c.kind === 'text') out.push({ kind: 'text', c, text: `${kebab(c.name)}="${v ?? ''}"`, isDef })
    else {
      const numeric = typeof v === 'number'
      out.push({ kind: 'enum', c, value: v, isDef, text: v == null ? '' : numeric ? `:${kebab(c.name)}="${v}"` : `${kebab(c.name)}="${v}"` })
    }
  }
  if (props.spec.listen !== false && props.spec.handlers) for (const [ev, fn] of Object.entries(props.spec.handlers)) out.push({ kind: 'fixed', text: `@${ev}="${fn}"` })
  return out
}
function slotLines(slots, clean) {
  const lines = []
  for (const s of props.spec.slots || []) {
    const on = slots[s.name]
    if (clean && !on) continue
    const body = tr(s.code ?? s.text)
    lines.push({ s, on, text: s.name === 'default' && !s.scope ? body : `<template #${s.name}${s.scope ? `="${s.scope}"` : ''}>${body}</template>` })
  }
  return lines
}

function cleanCode(state = values, slots = slotOn, kase = null) {
  const attrs = attrList(state, slots, { clean: true }).map((a) => a.text)
  const sl = slotLines(slots, true).map((l) => l.text)
  const open = `<${tag.value}`
  const oneLine = `${open}${attrs.length ? ' ' + attrs.join(' ') : ''}`
  const multi = oneLine.length > 72 || attrs.length > 4
  const head = multi ? `${open}\n${attrs.map((a) => '  ' + a).join('\n')}\n` : oneLine
  let tpl
  if (!sl.length) tpl = `${head}${multi ? '/>' : ' />'}`
  else if (sl.length === 1 && !sl[0].includes('\n') && !multi && (oneLine.length + sl[0].length) < 80 && !sl[0].startsWith('<template')) tpl = `${head}>${sl[0]}</${tag.value}>`
  else tpl = `${head}>\n${sl.map((l) => '  ' + l.replace(/\n/g, '\n  ')).join('\n')}\n</${tag.value}>`
  if (props.spec.wrap) tpl = props.spec.wrap.replace('$', tpl.replace(/\n/g, '\n  '))
  if (props.spec.trigger) tpl = `<g-btn variant="${props.spec.trigger.variant || 'outline'}" color="${props.spec.trigger.color || 'neutral'}" @click="${modelVar.value} = ${jsLiteral(props.spec.trigger.value ?? true)}">${tr(props.spec.trigger.label)}</g-btn>\n${tpl}`
  if (props.spec.codeFor) return props.spec.codeFor(state, slots, tpl)
  const script = scriptCode(state, kase)
  if (!script) return tpl
  return `<script setup>\n${script}\n</` + `script>\n\n<template>\n  ${tpl.replace(/\n/g, '\n  ')}\n</template>`
}
function scriptCode(state, kase) {
  const lines = []
  const imports = [...(props.spec.imports || [])]
  const needRef = !!props.spec.model
  if (needRef) imports.unshift("import { ref } from 'vue'")
  lines.push(...imports)
  if (imports.length) lines.push('')
  if (props.spec.model) lines.push(`const ${modelVar.value} = ref(${jsLiteral(kase && 'model' in kase ? kase.model : props.spec.model.value)})`)
  for (const [k, v] of Object.entries(fixedOf(state))) {
    if (isPrim(v) || props.spec.code?.[k] || hidden.value.has(k)) continue
    lines.push(`const ${k} = ${jsLiteral(v)}`)
  }
  if (props.spec.script) lines.push(tr(props.spec.script))
  const out = lines.join('\n').trim()
  return out || null
}

// ------------------------------------------------------------------ interacción
const status = ref('')
function announce(text) { status.value = ''; requestAnimationFrame(() => { status.value = text }) }
function cycle(c, dir = 1) {
  const i = c.values.findIndex((x) => x === values[c.name])
  const n = c.values.length
  values[c.name] = c.values[((i < 0 ? 0 : i) + dir + n) % n]
  announce(`${c.name}: ${values[c.name] ?? T.value.unset}`)
}
function onEnumKey(e, c) {
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); cycle(c, 1) }
  else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); cycle(c, -1) }
}
function toggle(c) {
  values[c.name] = !values[c.name]
  announce(`${c.name}: ${values[c.name] ? T.value.on : T.value.off}`)
}
function toggleSlot(s) {
  slotOn[s.name] = !slotOn[s.name]
  announce(`${T.value.slot} ${s.name}: ${slotOn[s.name] ? T.value.on : T.value.off}`)
}
const copied = ref(false)
async function copy(text = cleanCode()) {
  try { await navigator.clipboard.writeText(text); copied.value = true; setTimeout(() => (copied.value = false), 1400); announce(T.value.copied) } catch {}
}

// Tema y ancho locales de la vista previa (data-theme anidado: los tokens se recalculan en la ficha).
const themeMode = ref('page')
const stageTheme = computed(() => (themeMode.value === 'page' ? (isDark.value ? 'dark' : 'light') : themeMode.value))
const widthMode = ref('free')

// ------------------------------------------------------------------ medidas y tokens
const stage = ref(null)
const reads = ref([])
const dims = ref('')
let tokenMap = null
let tokenTheme = null
let raf = 0

function collectTokenNames() {
  const names = new Set()
  const walk = (rules) => {
    for (const r of rules) {
      if (r.style) for (let i = 0; i < r.style.length; i++) {
        const n = r.style[i]
        if (/^--g-(color|radius|font)-|^--g-text-[a-z-]+-size$/.test(n)) names.add(n)
      }
      if (r.cssRules) walk(r.cssRules)
    }
  }
  for (const sh of document.styleSheets) { try { walk(sh.cssRules) } catch {} }
  return [...names]
}
function buildTokenMap() {
  const host = stage.value
  if (!host) return null
  const names = collectTokenNames()
  const box = document.createElement('div')
  box.setAttribute('aria-hidden', 'true')
  box.style.cssText = 'position:absolute;inline-size:0;block-size:0;overflow:hidden;visibility:hidden'
  const probes = names.map((n) => {
    const d = document.createElement('div')
    if (n.startsWith('--g-color-')) d.style.backgroundColor = `var(${n})`
    else if (n.startsWith('--g-radius-')) d.style.borderTopLeftRadius = `var(${n})`
    else if (n.startsWith('--g-font-')) d.style.fontFamily = `var(${n})`
    else d.style.fontSize = `var(${n})`
    box.appendChild(d)
    return [n, d]
  })
  host.appendChild(box)
  const map = { color: new Map(), radius: new Map(), font: new Map(), size: new Map() }
  for (const [n, d] of probes) {
    const cs = getComputedStyle(d)
    const [kind, val] = n.startsWith('--g-color-') ? ['color', cs.backgroundColor] : n.startsWith('--g-radius-') ? ['radius', cs.borderTopLeftRadius]
      : n.startsWith('--g-font-') ? ['font', cs.fontFamily] : ['size', cs.fontSize]
    if (!map[kind].has(val)) map[kind].set(val, [])
    map[kind].get(val).push(n)
  }
  box.remove()
  return map
}
const tokenPatterns = computed(() => (props.meta.tokens || []).map((t) => {
  const re = t.replace(/\{[^}]+\}/g, '[a-z-]+').replace(/\.\.\d+/g, '').replace(/\*/g, '.*').replace(/\|/g, '|')
  try { return new RegExp('^' + re.replace(/\(([^)]*)\)/g, '($1)') + '$') } catch { return null }
}).filter(Boolean))
function pick(names) {
  if (!names?.length) return null
  const cur = Object.values(values).filter((v) => typeof v === 'string')
  const score = (n) => (tokenPatterns.value.some((re) => re.test(n)) ? 0 : 10) + (cur.some((v) => n.includes(`-${v}`)) ? 0 : 3) + n.length / 100
  return [...names].sort((a, b) => score(a) - score(b))[0]
}
function measure() {
  cancelAnimationFrame(raf)
  raf = requestAnimationFrame(() => {
    const host = stage.value
    if (!host) return
    if (!tokenMap || tokenTheme !== stageTheme.value) { tokenMap = buildTokenMap(); tokenTheme = stageTheme.value }
    const root = host.querySelector('.grana-live__mount')
    // Se mide la caja visible: la que marca el componente con data-g-tooltip-box (campos) o su raíz.
    // Con disparador, lo que se mide es el componente (el último hijo del envoltorio), no el botón.
    const top = props.spec.trigger ? root?.firstElementChild?.lastElementChild : root?.firstElementChild
    const el = (props.spec.measure && root?.querySelector(props.spec.measure)) || root?.querySelector('[data-g-tooltip-box]') || top
    const visible = el && el.getBoundingClientRect().width > 0
    if (!visible || !tokenMap) { reads.value = []; dims.value = ''; return }
    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    const px = (v) => Math.round(parseFloat(v) * 10) / 10
    dims.value = `${px(r.width)} × ${px(r.height)} px · padding ${px(cs.paddingBlockStart)} / ${px(cs.paddingInlineStart)} px`
    const rows = []
    const color = (label, v) => {
      if (!v || v === 'rgba(0, 0, 0, 0)' || v === 'transparent') rows.push({ label, token: T.value.transparent, swatch: null, faint: true })
      else rows.push({ label, token: pick(tokenMap.color.get(v)) || T.value.noToken, swatch: v, faint: !tokenMap.color.get(v) })
    }
    color(T.value.bg, cs.backgroundColor)
    color(T.value.fg, cs.color)
    if (parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none') color(T.value.border, cs.borderTopColor)
    else rows.push({ label: T.value.border, token: T.value.none, swatch: null, faint: true })
    const rad = cs.borderTopLeftRadius
    rows.push({ label: T.value.radius, token: pick(tokenMap.radius.get(rad)) || (rad === '0px' ? '0' : T.value.noToken), detail: rad, faint: !tokenMap.radius.get(rad) })
    const fs = cs.fontSize
    const fam = pick(tokenMap.font.get(cs.fontFamily))
    rows.push({ label: T.value.font, token: [pick(tokenMap.size.get(fs)), fam].filter(Boolean).join(' · ') || T.value.noToken, detail: fs })
    reads.value = rows
  })
}
let ro = null
let mo = null
onMounted(() => {
  measure()
  const mount = stage.value?.querySelector('.grana-live__mount')
  if (mount && typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(measure); ro.observe(mount) }
  if (mount && typeof MutationObserver !== 'undefined') { mo = new MutationObserver(measure); mo.observe(mount, { attributes: true, subtree: true, childList: true }) }
  // Los colores se leen cuando la transición del componente termina, no a mitad.
  mount?.addEventListener('transitionend', measure)
})
onBeforeUnmount(() => { ro?.disconnect(); mo?.disconnect(); cancelAnimationFrame(raf); clearTimeout(late) })
let late = 0
watch([values, slotOn, stageTheme, widthMode], () => {
  nextTick(measure)
  // Respaldo: una transición interrumpida no siempre emite transitionend.
  clearTimeout(late)
  late = setTimeout(measure, 320)
}, { deep: true })

// ------------------------------------------------------------------ casos de uso (ejemplos copiables)
const cases = computed(() => (props.spec.cases || []).map((c, i) => {
  const st = { ...initial(), ...trAll(c.props) }
  const sl = { ...Object.fromEntries((props.spec.slots || []).map((s) => [s.name, s.optional ? !!s.on : true])), ...(c.slots || {}) }
  return { id: c.id || `e${i + 1}`, title: c.title, why: c.why, state: st, slots: sl, model: 'model' in c ? c.model : props.spec.model?.value, code: cleanCode(st, sl, c) }
}))
const caseModels = {}
function CaseReal(c) {
  if (!caseModels[c.id]) caseModels[c.id] = ref(props.spec.model ? clone(c.model) : undefined)
  return { name: 'GranaLiveCase', setup: () => Real(reactive(c.state), reactive(c.slots), caseModels[c.id], false) }
}
const caseComponents = computed(() => Object.fromEntries(cases.value.map((c) => [c.id, CaseReal(c)])))
const region = ref(null)
function openCase(c) {
  for (const k of Object.keys(values)) delete values[k]
  Object.assign(values, c.state)
  Object.assign(slotOn, c.slots)
  if (props.spec.model) model.value = clone(c.model)
  renderKey.value++
  announce(`${T.value.loaded}: ${tr(c.title)}`)
  region.value?.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  nextTick(() => region.value?.querySelector('.grana-live__code button, .grana-live__code input')?.focus({ preventScroll: true }))
}

const codeParts = computed(() => attrList(values, slotOn, { clean: false }))
const codeSlots = computed(() => slotLines(slotOn, false))
const modelText = computed(() => (props.spec.model ? JSON.stringify(model.value) : ''))
const uid = 'gl-' + Math.random().toString(36).slice(2, 8)
</script>

<template>
  <p v-if="spec.unavailable" class="grana-live-unavailable">{{ T.unavailable }}: {{ tr(spec.unavailable) }}</p>
  <section v-else ref="region" class="grana-live" :aria-label="T.region">
    <div class="grana-live__bar">
      <div class="grana-live__seg" role="group" :aria-label="T.theme">
        <span class="grana-live__seg-label" aria-hidden="true">{{ T.theme }}</span>
        <button v-for="m in ['page', 'light', 'dark']" :key="m" type="button" :aria-pressed="themeMode === m" @click="themeMode = m">
          {{ m === 'page' ? T.follow : m === 'light' ? T.light : T.dark }}
        </button>
      </div>
      <div class="grana-live__seg" role="group" :aria-label="T.width">
        <span class="grana-live__seg-label" aria-hidden="true">{{ T.width }}</span>
        <button v-for="m in ['free', 'phone']" :key="m" type="button" :aria-pressed="widthMode === m" @click="widthMode = m">
          {{ m === 'free' ? T.free : T.phone }}
        </button>
      </div>
    </div>

    <div ref="stage" class="grana-live__stage vp-raw" :data-theme="stageTheme" :data-width="widthMode" :aria-label="T.stage" role="group">
      <div class="grana-live__mount" :class="{ 'is-block': spec.block }">
        <component :is="Live" :key="renderKey" />
      </div>
    </div>

    <div class="grana-live__side">
      <div v-if="dims" class="grana-live__dims"><strong>{{ T.size }}</strong> <span>{{ dims }}</span></div>
      <dl v-if="reads.length" class="grana-live__reads" :aria-label="T.reads">
        <div v-for="r in reads" :key="r.label" :class="{ 'is-faint': r.faint }">
          <dt>{{ r.label }}</dt>
          <dd>
            <span v-if="r.swatch" class="grana-live__swatch" :style="{ background: r.swatch }" aria-hidden="true" />
            <code>{{ r.token }}</code><span v-if="r.detail" class="grana-live__detail">{{ r.detail }}</span>
          </dd>
        </div>
      </dl>
      <div v-if="spec.model || listened.length" class="grana-live__events">
        <p v-if="spec.model" class="grana-live__model"><strong>{{ T.model }}</strong> <code>{{ modelVar }} = {{ modelText }}</code></p>
        <template v-if="listened.length">
          <p class="grana-live__events-title"><strong>{{ T.events }}</strong></p>
          <ol v-if="log.length" class="grana-live__log">
            <li v-for="e in log" :key="e.id"><code>@{{ e.name }}</code> <span>{{ e.payload }}</span></li>
          </ol>
          <p v-else class="grana-live__hint">{{ T.noEvents }}</p>
        </template>
      </div>
    </div>

    <div class="grana-live__codebox">
      <div class="grana-live__codehead">
        <span>{{ T.code }}</span>
        <span class="grana-live__actions">
          <GBtn size="sm" variant="ghost" color="neutral" @click="reset">{{ T.reset }}</GBtn>
          <GBtn size="sm" variant="soft" color="neutral" @click="copy()">{{ copied ? T.copied : T.copy }}</GBtn>
        </span>
      </div>
      <pre class="grana-live__code"><code><span class="t-tag">&lt;{{ tag }}</span><template v-for="(a, i) in codeParts" :key="i">
  <span v-if="a.kind === 'fixed'" class="t-attr">{{ a.text }}</span><button
    v-else-if="a.kind === 'bool'" type="button" class="t-bool" :class="{ 'is-def': !a.on }" :aria-pressed="a.on"
    :aria-label="`${a.c.name}: ${a.on ? T.on : T.off}`" @click="toggle(a.c)"><span aria-hidden="true">[{{ a.on ? 'x' : ' ' }}]</span> {{ a.text }}</button><label
    v-else-if="a.kind === 'text'" class="t-attr t-text" :class="{ 'is-def': a.isDef }"><span>{{ kebab(a.c.name) }}="</span><input
    v-model="values[a.c.name]" :aria-label="a.c.name" :size="Math.max(4, String(values[a.c.name] ?? '').length + 1)" spellcheck="false"
    @change="announce(`${a.c.name}: ${values[a.c.name]}`)" /><span>"</span></label><span v-else class="t-attr" :class="{ 'is-def': a.isDef }"><span>{{ kebab(a.c.name) }}=</span><button
    type="button" class="t-val" :aria-label="`${a.c.name}: ${a.value ?? T.unset}. ${T.next}`" @click="cycle(a.c, $event.shiftKey ? -1 : 1)"
    @keydown="onEnumKey($event, a.c)">{{ a.value == null ? '—' : `"${a.value}"` }}</button></span></template>
<span class="t-tag">{{ codeSlots.length ? '>' : '/>' }}</span><template v-for="l in codeSlots" :key="l.s.name">
  <button v-if="l.s.optional" type="button" class="t-bool" :class="{ 'is-def': !l.on }" :aria-pressed="l.on"
    :aria-label="`${T.slot} ${l.s.name}: ${l.on ? T.on : T.off}`" @click="toggleSlot(l.s)"><span aria-hidden="true">[{{ l.on ? 'x' : ' ' }}]</span> {{ l.text }}</button><span v-else class="t-slot">{{ l.text }}</span></template><template v-if="codeSlots.length">
<span class="t-tag">&lt;/{{ tag }}&gt;</span></template></code></pre>
      <p class="grana-live__status" aria-live="polite">{{ status }}</p>
    </div>

    <div v-if="cases.length" class="grana-live__cases">
      <h3 class="grana-live__cases-title">{{ T.cases }}</h3>
      <article v-for="c in cases" :id="`${uid}-${c.id}`" :key="c.id" class="grana-live__case">
        <header>
          <span class="grana-live__case-id">{{ c.id }}</span>
          <h4>{{ tr(c.title) }}</h4>
        </header>
        <p v-if="c.why" class="grana-live__why">{{ tr(c.why) }}</p>
        <div class="grana-live__case-stage vp-raw" :class="{ 'is-block': spec.block }"><component :is="caseComponents[c.id]" /></div>
        <pre class="grana-live__case-code"><code>{{ c.code }}</code></pre>
        <div class="grana-live__case-actions">
          <GBtn size="sm" variant="ghost" color="neutral" @click="copy(c.code)">{{ T.copy }}</GBtn>
          <GBtn size="sm" variant="outline" color="neutral" @click="openCase(c)">{{ T.open }}</GBtn>
        </div>
      </article>
    </div>
  </section>
</template>
