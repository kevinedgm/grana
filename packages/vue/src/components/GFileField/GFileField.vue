<script setup>
// GFileField · campo de archivos, concepto A «Línea de adjuntos» (dueño: bruno)
// Contrato: design/contracts/file-field.md (DECISIONS.md #366 a #379) · Estructura: design/lab/file-field/r01/ y r02/ (kiwi)
// Estilo: GFileField.css (coco; design/lab/file-field/estilo.md). Entrada propia `@grana/vue/file-field` (#367).
// El control es el <input type="file"> real (texto oculto accesible, enfocable) y lleva SIEMPRE los File de la lista. Los
// archivos son fichas (GSummary inline xs + GProgress como capa + «Reintentar»/«Quitar») dentro de una caja que mide lo que
// la de GInput. Sin red (#369): la subida es un adaptador de la aplicación (`uploader`). Con subidas pendientes o fallidas
// el campo bloquea el envío de GForm por sí mismo (error propio, #372). Al arrastrar archivos sobre la página despiertan
// todos los campos alcanzables (utils/fileDrag.js, #373). Sin textos propios: todos en `labels`.
import { computed, mergeProps, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowReactive, shallowRef, useAttrs, useId, useSlots, watch } from 'vue'
import GBtn from '../GBtn/GBtn.vue'
import GProgress from '../GProgress/GProgress.vue'
import GSummary from '../GSummary/GSummary.vue'
import GIcon from '../GIcon/GLibIcon.js'
import { messageIcon, nextFrame, useFormField } from '../GForm/formContext.js'
import { createLiveWriter } from '../../utils/liveRegion.js'
import { oneOf } from '../../utils/oneOf.js'
import { fill } from '../../utils/template.js'
import { acquireFileDrag, fileDrag, hasFiles } from '../../utils/fileDrag.js'
import { dragAccepts, formatFileSize, iconOf, isPreviewable, validate } from './engine.js'

defineOptions({ name: 'GFileField', inheritAttrs: false })

const props = defineProps({
  modelValue: { type: Array, default: undefined },
  accept: { type: String, default: undefined },
  multiple: Boolean,
  max: { type: Number, default: undefined, validator: (v) => Number.isInteger(v) && v >= 1 },
  maxSize: { type: Number, default: undefined, validator: (v) => v > 0 },
  uploader: { type: Function, default: undefined },
  concurrency: { type: Number, default: 2, validator: (v) => Number.isInteger(v) && v >= 1 },
  locale: { type: String, default: undefined },
  labels: { type: Object, default: () => ({}) },
  name: { type: String, default: undefined },
  label: { type: String, default: undefined },
  hint: { type: String, default: undefined },
  error: { type: String, default: undefined },
  warning: { type: String, default: undefined },
  valid: { type: String, default: undefined },
  required: Boolean,
  mark: { type: Boolean, default: undefined },
  // readonly, disabled, density y block sin valor por defecto: la prop explícita gana al contexto de GForm (form.md §2)
  readonly: { type: Boolean, default: undefined },
  disabled: { type: Boolean, default: undefined },
  size: { type: String, default: 'md', validator: oneOf(['xs', 'sm', 'md', 'lg', 'xl']) },
  variant: { type: String, default: 'outline', validator: oneOf(['outline', 'soft']) },
  density: { type: String, default: undefined, validator: oneOf(['default', 'comfortable', 'compact']) },
  rounded: { type: String, default: undefined, validator: oneOf(['none', 'xs', 'sm', 'md', 'lg', 'xl', 'pill']) },
  block: { type: Boolean, default: undefined },
  id: { type: String, default: undefined }
})

// Todos declarados (lección de `emits`): el @change del consumidor recibe el objeto y NO llega al <input> nativo
const emit = defineEmits(['update:modelValue', 'change', 'reject'])

const attrs = useAttrs()
const slots = useSlots()

// ---------- Avisos de desarrollo (`[Grana GFileField]`, una vez por instancia y motivo) ----------
const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
const warned = new Set()
function warn(key, msg) {
  if (!isDev || warned.has(key)) return
  warned.add(key)
  console.warn(`[Grana GFileField] ${msg}`)
}

// ---------- Ids (internos, nunca derivados de `key`, #374) ----------
const uid = useId()
const inputId = computed(() => props.id || `g-file-field-${uid}`)
const labelId = computed(() => `${inputId.value}-label`)
const alabelId = computed(() => `${inputId.value}-alabel`)
const actionId = computed(() => `${inputId.value}-action`)
const hintId = computed(() => `${inputId.value}-hint`)
const statusId = computed(() => `${inputId.value}-status`)
const keyIds = new Map() // key → n (ID-e{n})
let keyIdSeq = 0
const idx = (key) => {
  if (!keyIds.has(key)) keyIds.set(key, ++keyIdSeq)
  return keyIds.get(key)
}
const errId = (e) => `${inputId.value}-e${idx(e.key)}-error`
const retryId = (e) => `${inputId.value}-e${idx(e.key)}-retry`

const rootEl = ref(null)
const inputEl = ref(null)

// ---------- Textos (labels, sin valores por defecto; #226) ----------
const L = computed(() => props.labels || {})
function need(key, why) {
  const v = L.value[key]
  if (typeof v === 'string' && v) return v
  if (typeof v !== 'function') warn(`label-${key}`, `falta labels.${key}${why ? ` (${why})` : ''}.`)
  return ''
}
// Un texto con marcadores o, si la aplicación da una función (plurales del idioma), su resultado con `args`
function text(key, vars, args, why) {
  const v = L.value[key]
  if (typeof v === 'function') return String(v(...(args || [])) ?? '')
  return fill(need(key, why), vars || {})
}
function reasonLabel(reason) {
  const r = L.value.reasons && typeof L.value.reasons === 'object' ? L.value.reasons[reason] : undefined
  if (typeof r === 'string' && r) return r
  warn(`label-reasons-${reason}`, `falta labels.reasons.${reason} (motivo de rechazo en el aviso y en el anuncio).`)
  return ''
}

// ---------- Idioma: prop › lang del ancestro más cercano › navigator.language (al montar; #370, number-field.md) ----------
const mounted = ref(false)
const domLang = ref(null)
const validLocale = (l) => {
  if (!l) return false
  try {
    return Intl.NumberFormat.supportedLocalesOf([l]).length > 0
  } catch {
    return false
  }
}
const locale = computed(() => {
  if (props.locale && validLocale(props.locale)) return props.locale
  // Servidor e hidratación sin `locale`: un formato fijo (el del primer render del cliente); al montar, el del documento
  if (!mounted.value) return 'en-US'
  const nav = typeof navigator !== 'undefined' ? navigator.language : undefined
  for (const c of [domLang.value, nav]) if (validLocale(c)) return c
  return undefined
})
watch(() => props.locale, (l) => {
  if (l && !validLocale(l)) warn('locale', `locale «${l}» no lo acepta Intl: se usa el idioma del documento.`)
}, { immediate: true })
function nf(n) {
  try {
    return new Intl.NumberFormat(locale.value).format(n)
  } catch {
    return String(n)
  }
}
const sizeText = (b) => formatFileSize(b, locale.value)

// ---------- Límites ----------
const maxN = computed(() => {
  if (!props.multiple) return 1
  return Number.isInteger(props.max) && props.max >= 1 ? props.max : null
})
const maxSize = computed(() => (typeof props.maxSize === 'number' && props.maxSize > 0 ? props.maxSize : undefined))
const concurrency = computed(() => (Number.isInteger(props.concurrency) && props.concurrency >= 1 ? props.concurrency : 2))

// ---------- Modelo (#368): lista de entradas planas { key, name, size, type, state, value, url, error, file } ----------
const copy = (e) => ({ key: e.key, name: e.name, size: e.size, type: e.type, state: e.state, value: e.value, url: e.url, error: e.error, file: e.file })
const present = (k) => k !== undefined && k !== null && k !== ''
let keySeq = 0
function newKey(taken) {
  let k
  do k = `f${++keySeq}`
  while (taken.has(k))
  return k
}

// Normaliza la lista de la aplicación (aviso 4). Devuelve pares { entry, raw }
function fromModel(list) {
  const out = []
  const seen = new Set()
  for (const raw of Array.isArray(list) ? list : []) {
    if (!raw || typeof raw !== 'object') continue
    if (!present(raw.key) || !present(raw.name)) {
      warn('entry-key', 'una entrada del modelo no tiene key o name: se ignora.')
      continue
    }
    if (seen.has(raw.key)) {
      warn(`entry-dup-${raw.key}`, `la key «${raw.key}» está repetida en el modelo: se ignora la segunda.`)
      continue
    }
    seen.add(raw.key)
    const file = raw.file || null
    let state = raw.state
    if (!file) {
      // Guardado: ya está en el servidor
      if (state !== undefined && state !== 'done') warn(`entry-stored-${raw.key}`, `la entrada guardada «${raw.name}» (sin file) tiene state «${state}»: se toma «done».`)
      state = 'done'
      if (raw.value === undefined || raw.value === null) warn(`entry-value-${raw.key}`, `la entrada guardada «${raw.name}» no tiene value: no se enviará.`)
    } else if (props.uploader) {
      if (state !== 'done' && state !== 'error') state = 'queued' // queued, uploading, ready o sin state: a la cola desde cero
    } else state = 'ready'
    const entry = {
      key: raw.key,
      name: String(raw.name),
      size: Number(raw.size ?? file?.size ?? 0) || 0,
      type: String(raw.type ?? file?.type ?? ''),
      state,
      value: raw.value ?? null,
      url: raw.url ?? null,
      error: raw.error ?? null,
      file
    }
    out.push({ entry, raw })
  }
  return out
}

const entries = shallowRef(fromModel(props.modelValue).map((p) => p.entry))
const ctrls = new Map() // key → AbortController de la subida en curso
const progress = shallowReactive(new Map()) // key → { loaded, total } (fuera del modelo, r01, 14)
const ownUrls = shallowReactive(new Map()) // key → URL de objeto propia (miniatura)
const landing = reactive(new Set()) // keys con is-landing (solo al añadir por un gesto)
const batch = new Set() // keys del tramo de subida en curso (anuncio de cierre de lote)
const notice = shallowRef(null) // aviso de no añadidos del último gesto
const chipEls = new Map() // key → <li>
let alive = false

function commit(next) {
  entries.value = next
  const out = next.map(copy)
  emit('update:modelValue', out)
  return out
}
function update(key, patch) {
  return commit(entries.value.map((e) => (e.key === key ? { ...e, ...patch } : e)))
}
// Quita en silencio lo que el componente guarda por `key`: aborta la subida, revoca la URL de objeto
function dispose(key) {
  const ac = ctrls.get(key)
  if (ac) {
    ctrls.delete(key)
    ac.abort()
  }
  const u = ownUrls.get(key)
  if (u) {
    ownUrls.delete(key)
    try { URL.revokeObjectURL(u) } catch { /* sin URL */ }
  }
  progress.delete(key)
  pendingProgress.delete(key)
  landing.delete(key)
  batch.delete(key)
}

// Conciliación por `key` al cambiar modelValue (#368)
function reconcile(list) {
  const cur = new Map(entries.value.map((e) => [e.key, e]))
  const next = fromModel(list).map(({ entry, raw }) => {
    const c = cur.get(entry.key)
    if (!c) return entry // nueva: dato de la aplicación (sin validar contra accept, maxSize ni max)
    if (c.state === 'queued' || c.state === 'uploading') {
      // El estado de subida de una entrada que el componente gestiona es del componente (aviso 5)
      const differs = (raw.state !== undefined && raw.state !== c.state) || (raw.value ?? null) !== c.value || (raw.error ?? null) !== c.error
      if (differs) warn(`managed-${entry.key}`, `la aplicación cambió state, value o error de «${entry.name}» mientras se sube: gana el del componente.`)
      return { ...entry, state: c.state, value: c.value, error: c.error, file: c.file || entry.file }
    }
    return entry
  })
  const keep = new Set(next.map((e) => e.key))
  for (const k of cur.keys()) if (!keep.has(k)) dispose(k) // quitada por la aplicación: se cancela en silencio
  entries.value = next
  settle()
  pump()
}
watch(() => props.modelValue, (mv) => { if (mv !== undefined) reconcile(mv) }, { deep: true })

// ---------- Estado derivado ----------
const ff = useFormField({
  id: inputId,
  name: () => props.name,
  error: () => props.error,
  warning: () => props.warning,
  valid: () => props.valid,
  required: () => props.required,
  readonly: () => props.readonly,
  disabled: () => props.disabled,
  density: () => props.density,
  block: () => props.block,
  mark: () => props.mark,
  trigger: 'change',
  control: inputEl,
  root: rootEl,
  // Error propio (#372): solo lo revela GForm (envío o showErrors()); el resumen enlaza a su destino
  ownError: () => ownError.value,
  ownTarget: () => ownTarget()
})
const isReadonly = ff.readonly
const isDisabled = ff.disabled
const editable = computed(() => !isReadonly.value && !isDisabled.value)
const count = computed(() => entries.value.length)
const isActive = (e) => e.state === 'queued' || e.state === 'uploading'
const activeCount = computed(() => entries.value.filter(isActive).length)
const failedList = computed(() => entries.value.filter((e) => e.state === 'error'))
const full = computed(() => props.multiple && maxN.value !== null && count.value >= maxN.value)
const hasLabel = computed(() => Boolean(props.label || slots.label))
const hasHint = computed(() => Boolean(props.hint || slots.hint))
const ariaLabelText = computed(() => (!hasLabel.value && !attrs['aria-labelledby'] && attrs['aria-label'] ? String(attrs['aria-label']) : ''))

// Error propio (#372): con `uploader`, fallidas › pendientes; sin él, nunca. Sin el texto, bloquea igual (un espacio)
const ownError = computed(() => {
  if (!props.uploader) return ''
  const failed = failedList.value
  if (failed.length) return text('failed', { count: nf(failed.length), name: failed[0].name }, [failed.length, failed[0].name], 'error propio con subidas fallidas') || ' '
  const act = entries.value.filter(isActive)
  if (act.length) return text('pending', { count: nf(act.length), name: act[0].name }, [act.length, act[0].name], 'error propio con subidas pendientes') || ' '
  return ''
})
// Destino del enlace y del foco: «Reintentar» de la primera fallida (orden de la lista = orden del DOM) o el control
function ownTarget() {
  const r = rootEl.value
  return (r && r.querySelector('.g-file-field__retry')) || inputEl.value
}

const message = ff.message
const statusText = computed(() => {
  const v = L.value.status
  const args = { count: count.value, max: maxN.value, active: activeCount.value, failed: failedList.value.length }
  if (typeof v === 'function') return String(v(args) ?? '')
  if (typeof v === 'string') return fill(v, { count: nf(args.count), max: args.max === null ? undefined : nf(args.max), active: nf(args.active), failed: nf(args.failed) })
  return ''
})

// Cara de «Adjuntar» (#370 «Disposición»)
const faceText = computed(() => {
  const has = count.value > 0
  if (isReadonly.value) return has ? need('readonly', 'cara en solo lectura') : need('none', 'cara en solo lectura sin archivos')
  if (full.value) return text('full', { count: nf(count.value), max: nf(maxN.value) }, [count.value, maxN.value], 'cara llena')
  if (has) return props.multiple ? need('addMore', 'cara con archivos') : need('change', 'cara con un archivo')
  return props.multiple ? need('addMany', 'cara vacía') : need('add', 'cara vacía')
})
const addIcon = computed(() => (isReadonly.value ? 'lock' : full.value ? 'check' : 'plus'))
const showAddHint = computed(() => count.value === 0 && editable.value && hasHint.value)
const listLabel = computed(() => fill(need('list', 'nombre de la lista'), { label: props.label || '' }))

// ---------- La ficha (#375) ----------
const removeLabel = (e) => fill(isActive(e) ? need('cancel', 'nombre de «Cancelar subida»') : need('remove', 'nombre de «Quitar»'), { name: e.name })
const retryLabel = (e) => fill(need('retry', 'nombre de «Reintentar»'), { name: e.name })
const errorDesc = (e) => [need('error', 'rótulo del fallo'), e.error || ''].filter(Boolean).join(' ')
function thumbOf(e) {
  const own = ownUrls.get(e.key)
  if (own) return own
  if (e.url && (isPreviewable(e.type) || (!e.file && /^image\//i.test(e.type)))) return e.url
  return null
}
function summaryOf(e) {
  const src = thumbOf(e)
  const s = { layout: 'inline', size: 'xs', title: e.name, subtitle: sizeText(e.size) }
  if (src) s.avatar = { src, shape: 'square', icon: 'image' }
  else s.icon = iconOf(e.type)
  if (e.state === 'queued') {
    const l = need('queued', 'estado «en cola»')
    if (l) s.status = { label: l }
  } else if (e.state === 'done' && e.file) {
    const l = need('done', 'estado «subido»')
    if (l) s.status = { label: l }
  } else if (e.state === 'error') {
    const l = need('error', 'rótulo del fallo')
    if (l && e.error) s.facts = [{ label: l, value: e.error, bare: true }]
  }
  return s
}
function progressOf(e) {
  const p = progress.get(e.key)
  const total = Math.max(1, p && p.total > 0 ? p.total : e.size || 1)
  const loaded = e.state === 'uploading' && p ? Math.min(Math.max(p.loaded, 0), total) : 0
  let valueText
  if (e.state === 'queued') valueText = need('queued', 'estado «en cola»') || undefined
  else if (L.value.progressText) {
    valueText = fill(L.value.progressText, { percent: nf(Math.round((loaded / total) * 100)), loaded: sizeText(loaded), total: sizeText(total) })
  }
  return { value: loaded, max: total, valueText, label: fill(need('progress', 'nombre de la barra de subida'), { name: e.name }) }
}

// ---------- Anuncios (región viva cortés propia; traslado al modal superior, #374) ----------
const live = reactive({ polite: '', assertive: '' })
const writer = createLiveWriter(live, { delay: 50, clear: 7000 })
function say(t) {
  if (t && t.trim()) writer.announce(t.trim(), 'polite')
}
// Un <dialog> modal que tapa el campo: la región se monta dentro de él mientras exista
const modalHost = computed(() => {
  const m = fileDrag.modal
  const r = rootEl.value
  return m && r && !m.contains(r) ? m : null
})

function reasonText(item) {
  return fill(reasonLabel(item.reason), {
    size: sizeText(item.file.size),
    limit: item.reason === 'size' ? sizeText(maxSize.value) : item.reason === 'count' ? nf(maxN.value ?? 1) : undefined
  })
}
function announceGesture(fresh, removed, items) {
  const parts = []
  if (removed.length && fresh.length) parts.push(fill(need('replaced', 'anuncio de reemplazo'), { old: removed[0].name, name: fresh[0].name }))
  else if (fresh.length === 1) parts.push(fill(need('added', 'anuncio al añadir'), { name: fresh[0].name }))
  else if (fresh.length > 1) parts.push(text('addedMany', { count: nf(fresh.length) }, [fresh.length], 'anuncio al añadir varios'))
  if (items.length === 1) parts.push(fill(need('rejected', 'anuncio de un rechazo'), { name: items[0].name, reason: items[0].text }))
  else if (items.length > 1) {
    const v = L.value.rejectedMany
    parts.push(typeof v === 'function'
      ? String(v(items.map((i) => ({ file: i.file, name: i.name, reason: i.reason, text: i.text }))) ?? '')
      : fill(need('rejectedMany', 'anuncio de varios rechazos'), { count: nf(items.length), list: items.map((i) => `${i.name}, ${i.text}`).join('; ') }))
  }
  if (fresh.length && props.uploader) parts.push(text('uploading', { count: nf(fresh.length) }, [fresh.length], 'anuncio «subiendo»'))
  say(parts.filter(Boolean).join(' '))
}

// ---------- Añadir (#370): elegir, soltar, pegar y add() ----------
const isFileLike = (f) => Boolean(f) && typeof f === 'object' && typeof f.name === 'string' && typeof f.size === 'number'
function add(list, via) {
  const none = { added: [], rejected: [] }
  if (!editable.value) return none
  const files = Array.from(list || []).filter(isFileLike)
  if (!files.length) {
    syncInput() // una selección vacía (cancelar el diálogo) no borra
    return none
  }
  const cur = entries.value
  const single = !props.multiple
  const room = single ? 1 : maxN.value === null ? Infinity : maxN.value - cur.length
  const { accepted, rejected } = validate(files, { accept: props.accept, maxSize: maxSize.value, room, single, existing: cur.filter((e) => e.file).map((e) => e.file) })
  const items = rejected.map((r) => ({ ...r, text: reasonText(r) }))
  let removed = []
  let base = cur
  if (single && accepted.length && cur.length) {
    // Sin multiple: el nuevo reemplaza al que había (si subía, se cancela; si era un guardado, sale de la lista)
    removed = cur
    for (const e of cur) dispose(e.key)
    base = []
  }
  const taken = new Set(cur.map((e) => e.key))
  const fresh = accepted.map((file) => ({ key: newKey(taken), name: file.name, size: file.size, type: file.type || '', state: props.uploader ? 'queued' : 'ready', value: null, url: null, error: null, file }))
  for (const e of fresh) {
    landing.add(e.key)
    if (props.uploader) batch.add(e.key)
  }
  // El siguiente gesto sustituye el aviso (también uno sin rechazos, que lo retira)
  notice.value = items.length ? { items } : null
  let addedOut = []
  const removedOut = removed.map(copy)
  if (fresh.length || removed.length) {
    const out = commit([...base, ...fresh])
    addedOut = out.slice(out.length - fresh.length)
    emit('change', { added: addedOut, removed: removedOut, via })
    ff.notifyChange()
  }
  const rejectedOut = items.map(({ file, name, reason }) => ({ file, name, reason }))
  if (rejectedOut.length) emit('reject', { items: rejectedOut, via })
  announceGesture(fresh, removed, items)
  syncInput()
  checkLanding()
  pump()
  return { added: addedOut, rejected: rejectedOut }
}

// Quitar / Cancelar subida: el foco va al «Quitar» de la siguiente; si no hay, de la anterior; si no, al control
function remove(key) {
  if (!editable.value) return
  const cur = entries.value
  const i = cur.findIndex((e) => e.key === key)
  if (i < 0) return
  const e = cur[i]
  const wasActive = isActive(e)
  dispose(key)
  const next = cur.filter((_, j) => j !== i)
  commit(next)
  emit('change', { added: [], removed: [copy(e)], via: wasActive ? 'cancel' : 'remove' })
  ff.notifyChange()
  const left = next.length
  say(text(wasActive ? 'canceled' : 'removed', { name: e.name, count: nf(left) }, [left, e.name], wasActive ? 'anuncio al cancelar' : 'anuncio al quitar'))
  const at = left ? Math.min(i, left - 1) : -1
  nextTick(() => {
    const chips = rootEl.value ? rootEl.value.querySelectorAll('.g-file-field__chip') : []
    const btn = at >= 0 && chips[at] ? chips[at].querySelector('.g-file-field__remove') : null
    ;(btn || inputEl.value)?.focus()
  })
  settle()
  pump()
}
// Reintentar: vuelve a la cola; el foco se queda en la misma ficha («Cancelar subida de …»)
function retry(key) {
  if (!editable.value || !props.uploader) return
  const e = entries.value.find((x) => x.key === key)
  if (!e || e.state !== 'error') return
  progress.delete(key)
  batch.add(key)
  update(key, { state: 'queued', error: null })
  say(fill(need('retrying', 'anuncio al reintentar'), { name: e.name }))
  nextTick(() => chipEls.get(key)?.querySelector('.g-file-field__remove')?.focus())
  pump()
}
function dismiss() {
  notice.value = null
  inputEl.value?.focus()
}

// ---------- Cola de subida (#369): concurrency, en el orden de la lista ----------
function pump() {
  if (!props.uploader || !alive) return
  const starting = new Map()
  let running = ctrls.size
  for (const e of entries.value) {
    if (running >= concurrency.value) break
    if (e.state === 'queued' && e.file && !ctrls.has(e.key)) {
      starting.set(e.key, new AbortController())
      running++
    }
  }
  if (!starting.size) return
  for (const [k, ac] of starting) {
    ctrls.set(k, ac)
    pendingProgress.delete(k)
    progress.set(k, { loaded: 0, total: 0 })
  }
  commit(entries.value.map((e) => (starting.has(e.key) ? { ...e, state: 'uploading', error: null } : e)))
  for (const [k, ac] of starting) run(k, ac)
}

// Progreso: como mucho una pintura por cuadro (coalescido), nunca en el modelo
const pendingProgress = new Map()
let progressFrame = false
function report(key, ac, loaded, total) {
  if (ctrls.get(key) !== ac) return
  const e = entries.value.find((x) => x.key === key)
  const t = Number(total) > 0 ? Number(total) : (e && e.file ? e.file.size : 0) || 0
  const l = Math.min(Math.max(Number(loaded) || 0, 0), t || 0)
  pendingProgress.set(key, { loaded: l, total: t })
  if (progressFrame) return
  progressFrame = true
  nextFrame(() => {
    progressFrame = false
    if (!alive) return
    for (const [k, v] of pendingProgress) if (ctrls.has(k)) progress.set(k, v)
    pendingProgress.clear()
  })
}

async function run(key, ac) {
  const e = entries.value.find((x) => x.key === key)
  if (!e || !e.file) return
  let res
  let err
  let failed = false
  try {
    res = await props.uploader(e.file, { signal: ac.signal, progress: (l, t) => report(key, ac, l, t) })
  } catch (x) {
    failed = true
    err = x
  }
  // Quitada, reemplazada, cancelada o desmontado: lo abortó el componente, en silencio
  if (ctrls.get(key) !== ac) return
  ctrls.delete(key)
  pendingProgress.delete(key)
  progress.delete(key)
  const cur = entries.value.find((x) => x.key === key)
  if (!cur) return
  let patch
  if (failed) {
    // { message } de la aplicación; sin él, o un AbortError que el componente no pidió: labels.uploadFailed
    const own = err && err.name !== 'AbortError' && typeof err.message === 'string' ? err.message.trim() : ''
    patch = { state: 'error', error: own || need('uploadFailed', 'mensaje de fallo de subida') || null }
  } else if (!res || res.value === undefined || res.value === null) {
    warn('no-value', `el adaptador resolvió «${cur.name}» sin value: la entrada pasa a error (no se podría enviar).`)
    patch = { state: 'error', error: need('uploadFailed', 'mensaje de fallo de subida') || null }
  } else {
    patch = { state: 'done', value: res.value, url: res.url ?? cur.url ?? null, error: null }
  }
  update(key, patch)
  if (patch.state === 'error') say(fill(need('uploadError', 'anuncio de un fallo'), { name: cur.name, message: patch.error || '' }))
  settle()
  pump()
}
// Cierre de lote: un anuncio cuando todo lo añadido en un tramo terminó
function settle() {
  if (!batch.size) return
  const list = entries.value.filter((e) => batch.has(e.key))
  if (list.some(isActive)) return
  const ok = list.filter((e) => e.state === 'done')
  batch.clear()
  if (ok.length === 1) say(fill(need('uploaded', 'anuncio de subida terminada'), { name: ok[0].name }))
  else if (ok.length > 1) say(text('uploadedMany', { count: nf(ok.length) }, [ok.length], 'anuncio de lote subido'))
}
watch(() => props.uploader, () => pump())

// ---------- El <input type="file"> lleva siempre los File de la lista (r01, 3) ----------
function syncInput() {
  const el = inputEl.value
  if (!el || typeof DataTransfer === 'undefined') return
  try {
    const dt = new DataTransfer()
    for (const e of entries.value) if (e.file) dt.items.add(e.file)
    el.files = dt.files
  } catch { /* sin DataTransfer construible: queda la última selección */ }
}
watch(entries, () => { if (alive) syncInput() }, { flush: 'post' })

// Miniaturas: URL de objeto propia para las imágenes que el navegador pinta; se revoca al quitar y al desmontar
function makeUrls() {
  if (!alive || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') return
  for (const e of entries.value) {
    if (!e.file || !isPreviewable(e.type) || ownUrls.has(e.key)) continue
    try { ownUrls.set(e.key, URL.createObjectURL(e.file)) } catch { /* sin vista previa */ }
  }
}
watch(entries, makeUrls)

// Fuera de GForm (un <form> nativo): el control lleva el error propio como validez (#371)
function applyValidity() {
  const el = inputEl.value
  if (!el || typeof el.setCustomValidity !== 'function') return
  el.setCustomValidity(ff.inForm ? '' : ownError.value)
}
watch(ownError, applyValidity, { flush: 'post' })

// ---------- Aterrizaje (#376): is-landing al añadir por un gesto; se retira al terminar g-file-field-land… ----------
function setChip(key, el) {
  if (el) chipEls.set(key, el)
  else chipEls.delete(key)
}
function checkLanding() {
  nextTick(() => {
    for (const key of [...landing]) {
      const el = chipEls.get(key)
      const name = el && typeof getComputedStyle === 'function' ? String(getComputedStyle(el).animationName || 'none') : 'none'
      if (!el || !name.split(',').some((n) => n.trim().startsWith('g-file-field-land'))) landing.delete(key)
    }
  })
}
function onAnimation(event) {
  ff.onRejectEnd(event)
  const n = String(event.animationName || '')
  if (!n.startsWith('g-file-field-land')) return
  for (const [key, el] of chipEls) if (el === event.target) landing.delete(key)
}

// ---------- Gestos del control ----------
function onPick(event) {
  const el = event.target
  const picked = el && el.files ? Array.from(el.files) : []
  add(picked, 'picker')
}
// Lleno o solo lectura: el control sigue enfocable y en el envío, pero no abre el diálogo (aria-disabled)
function onInputClick(event) {
  if (!editable.value || full.value) event.preventDefault()
}
function onPaste(event) {
  if (!editable.value) return
  const files = event.clipboardData && event.clipboardData.files ? Array.from(event.clipboardData.files) : []
  if (!files.length) return
  event.preventDefault()
  add(files, 'paste')
}
// Un clic en la caja fuera de fichas y botones abre el diálogo (la caja entera es el objetivo del control)
function onBoxClick(event) {
  const t = event.target
  if (t && typeof t.closest === 'function' && t.closest('.g-file-field__chip, button, input, a, label')) return
  open()
}
function open() {
  if (!editable.value || full.value) return
  inputEl.value?.click()
}
function focus() {
  inputEl.value?.focus()
}
function onFocusout(event) {
  const r = rootEl.value
  if (r && event.relatedTarget && r.contains(event.relatedTarget)) return
  ff.handlers.onFocusout()
}

// ---------- Arrastre de página y destino (#373) ----------
const over = ref(false)
let overDepth = 0
const reach = ref(false)
function reachable() {
  const r = rootEl.value
  const i = inputEl.value
  if (!r || !i) return false
  if (typeof r.closest === 'function' && r.closest('[inert]')) return false
  if (i.disabled || (typeof i.matches === 'function' && i.matches(':disabled'))) return false
  const m = fileDrag.modal
  if (m && !m.contains(r)) return false
  return typeof r.getClientRects === 'function' ? r.getClientRects().length > 0 : true
}
watch(() => fileDrag.dragging, (d) => {
  reach.value = d ? reachable() : false
  if (!d) {
    over.value = false
    overDepth = 0
  } else if (editable.value && reach.value) {
    // Textos del destino que hacen falta (aviso 2, al primer arrastre)
    need('drop', 'destino que admite')
    need('dropRejected', 'destino que no admite')
    if (!L.value.dropInto) warn('label-dropInto', 'falta labels.dropInto (destino con el puntero encima): se usa labels.drop.')
    if (full.value && !L.value.dropFull) warn('label-dropFull', 'falta labels.dropFull (destino de un campo lleno): se usa labels.dropRejected.')
  }
})
const awake = computed(() => fileDrag.dragging && editable.value && reach.value)
const awakeOk = computed(() => awake.value && !full.value && dragAccepts(fileDrag.types, props.accept))
const typesOf = (e) => (e.dataTransfer && e.dataTransfer.items ? Array.from(e.dataTransfer.items).filter((i) => i.kind === 'file').map((i) => i.type || '') : fileDrag.types)
const canTake = (e) => editable.value && !full.value && dragAccepts(typesOf(e), props.accept)
function onDragenter(event) {
  if (!hasFiles(event)) return
  overDepth++
  over.value = true
  if (editable.value && reachable() && canTake(event)) event.preventDefault()
}
function onDragleave(event) {
  if (!hasFiles(event)) return
  overDepth = Math.max(0, overDepth - 1)
  if (!overDepth) over.value = false
}
function onDragover(event) {
  if (!hasFiles(event) || !editable.value || !(reach.value || reachable())) return
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = canTake(event) ? 'copy' : 'none'
}
function onDrop(event) {
  if (!hasFiles(event)) return
  overDepth = 0
  over.value = false
  // Lleno, solo lectura o deshabilitado: no se admite (la protección de la página evita que el navegador abra el archivo)
  if (!editable.value || full.value || !reachable()) return
  event.preventDefault()
  add(event.dataTransfer ? event.dataTransfer.files : [], 'drop')
}
const targetText = computed(() => {
  if (!awake.value) return ''
  const label = props.label || ''
  const rejectedText = () => fill(L.value.dropRejected || '', { label })
  if (over.value) return awakeOk.value ? fill(L.value.dropInto || L.value.drop || '', { label, hint: props.hint || '' }) : rejectedText()
  if (awakeOk.value) return fill(L.value.drop || '', { hint: props.hint || '' })
  if (full.value) return L.value.dropFull ? fill(L.value.dropFull, { label }) : rejectedText()
  return rejectedText()
})

// ---------- Atributos: class y style a la raíz; el resto al <input type="file"> ----------
const IGNORED = ['type', 'webkitdirectory', 'directory', 'aria-invalid', 'appearance', 'expected']
const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }))
const labelledBy = computed(() => {
  let first = null
  if (hasLabel.value) first = labelId.value
  else if (attrs['aria-labelledby']) first = String(attrs['aria-labelledby'])
  else if (ariaLabelText.value) first = alabelId.value
  return [first, actionId.value].filter(Boolean).join(' ')
})
const describedBy = computed(() => {
  const ids = [hasHint.value && hintId.value, statusText.value && statusId.value, message.value && ff.messageId.value, attrs['aria-describedby']].filter(Boolean)
  return ids.length ? ids.join(' ') : undefined
})
const inputBindings = computed(() => {
  const { class: _c, style: _s, 'aria-label': _al, 'aria-labelledby': _alb, 'aria-describedby': _adb, ...rest } = attrs
  for (const k of IGNORED) delete rest[k]
  const controlled = {
    id: inputId.value,
    type: 'file',
    name: !props.uploader && props.name ? props.name : undefined,
    accept: props.accept || undefined,
    multiple: props.multiple || undefined,
    disabled: isDisabled.value || undefined,
    'aria-labelledby': labelledBy.value,
    'aria-describedby': describedBy.value,
    'aria-required': props.required ? 'true' : undefined,
    'aria-disabled': isReadonly.value || full.value ? 'true' : undefined
  }
  // Los manejadores propios van PRIMERO: una escucha del consumidor ya ve la lista actualizada
  return mergeProps({ onChange: onPick, onClick: onInputClick, onPaste }, rest, controlled)
})

// Lo que se envía (#371): con uploader, cada entrada done con value; sin él, los guardados (los binarios van en el <input>)
const sent = computed(() => {
  if (!props.name) return []
  return entries.value.filter((e) => e.state === 'done' && e.value !== null && e.value !== undefined && (props.uploader ? true : !e.file))
})

// ---------- Clases (contrato bruno ↔ coco) ----------
const ready = ref(false)
const classes = computed(() => [
  'g-file-field',
  `g-file-field--size-${props.size}`,
  `g-file-field--variant-${props.variant}`,
  `g-file-field--density-${ff.density.value}`,
  props.rounded && `g-file-field--rounded-${props.rounded}`,
  {
    'g-file-field--block': ff.block.value,
    'is-ready': ready.value,
    'has-files': count.value > 0,
    'is-multiple': props.multiple,
    'is-full': full.value,
    'is-readonly': isReadonly.value,
    'is-disabled': isDisabled.value,
    'is-invalid': ff.invalid.value,
    'is-warning': ff.ownMessage.value?.type === 'warning',
    'is-valid': ff.ownMessage.value?.type === 'valid',
    'is-rejected': ff.rejected.value,
    'is-awake': awake.value,
    'is-awake-ok': awakeOk.value,
    'is-awake-no': awake.value && !awakeOk.value,
    'is-over': awake.value && over.value
  }
])

// ---------- Montaje ----------
let release = null
onMounted(() => {
  alive = true
  mounted.value = true
  domLang.value = rootEl.value?.parentElement?.closest('[lang]')?.getAttribute('lang') || null
  release = acquireFileDrag()
  nextFrame(() => nextFrame(() => { if (alive) ready.value = true }))
  syncInput()
  makeUrls()
  applyValidity()
  pump() // al montar (también tras un desmontaje), lo que estaba en cola o subiendo vuelve a la cola desde cero

  if (!isDev) return
  // Avisos de montaje (1 a 3, 7 y 8)
  if (!hasLabel.value && !attrs['aria-label'] && !attrs['aria-labelledby']) warn('name', 'necesita label, slot label, aria-label o aria-labelledby para tener un nombre accesible.')
  need(props.multiple ? 'addMany' : 'add', 'cara vacía')
  if (typeof L.value.status !== 'function' && typeof L.value.status !== 'string') warn('label-status', 'falta labels.status (estado del pie y de la descripción).')
  for (const k of ['remove', 'cancel']) need(k, 'nombre de los botones de la ficha')
  if (props.uploader) {
    need('retry', 'nombre de «Reintentar»')
    for (const k of ['pending', 'failed']) if (typeof L.value[k] !== 'function') need(k, 'error propio al enviar: sin él, el bloqueo no tiene mensaje')
  }
  if (isReadonly.value) { need('readonly', 'cara en solo lectura'); need('none', 'cara en solo lectura sin archivos') }
  if (props.max !== undefined && !props.multiple) warn('max', 'max solo actúa con multiple: sin él, el máximo es 1 y se ignora.')
  if (props.max !== undefined && !(Number.isInteger(props.max) && props.max >= 1)) warn('max-value', `max debe ser un entero ≥ 1 (recibió ${props.max}): se ignora.`)
  if (props.maxSize !== undefined && !(props.maxSize > 0)) warn('maxSize', `maxSize debe ser > 0 (recibió ${props.maxSize}): se ignora.`)
  if (!(Number.isInteger(props.concurrency) && props.concurrency >= 1)) warn('concurrency', `concurrency debe ser un entero ≥ 1 (recibió ${props.concurrency}): se usa 2.`)
  if (props.multiple && maxN.value !== null && typeof L.value.full !== 'function') need('full', 'cara llena')
  for (const k of IGNORED) {
    if (attrs[k] === undefined) continue
    if (k === 'appearance' || k === 'expected') warn(`attr-${k}`, `${k} está reservado para una entrega siguiente (#378): se ignora.`)
    else warn(`attr-${k}`, `se ignora el atributo ${k}: lo controla el componente (aria-invalid no está admitido en el rol del control).`)
  }
  if (ff.group) warn('group', 'dentro de un GInputGroup o un GFieldGroup no está admitido en v0.1: el error propio no llegaría al envío.')
})

onBeforeUnmount(() => {
  alive = false
  // Cancela las subidas en curso y revoca las URL de objeto; no se emite nada
  const acs = [...ctrls.values()]
  ctrls.clear()
  for (const ac of acs) ac.abort()
  for (const u of ownUrls.values()) {
    try { URL.revokeObjectURL(u) } catch { /* sin URL */ }
  }
  ownUrls.clear()
  writer.dispose()
  if (release) release()
  release = null
})

defineExpose({
  /** Añade un FileList o un arreglo de File con la validación, el aviso, los anuncios y los eventos de siempre (via 'api'). */
  add: (files) => add(files, 'api'),
  open,
  focus
})
</script>

<template>
  <div
    ref="rootEl"
    v-bind="rootAttrs"
    :class="classes"
    @animationend="onAnimation"
    @animationcancel="onAnimation"
    @focusout="onFocusout"
    @dragenter="onDragenter"
    @dragover="onDragover"
    @dragleave="onDragleave"
    @drop="onDrop"
  >
    <label v-if="hasLabel" :id="labelId" class="g-file-field__label" :for="inputId"><slot name="label">{{ label }}</slot><template v-if="ff.mark.value === 'optional' && ff.markText.value">{{ ' ' }}<span class="g-file-field__optional">{{ ff.markText.value }}</span></template><span v-if="ff.mark.value === 'required'" class="g-file-field__required" aria-hidden="true">*</span></label>
    <span v-else-if="ariaLabelText" :id="alabelId" hidden>{{ ariaLabelText }}</span>
    <div class="g-file-field__box" @click="onBoxClick">
      <ul v-if="entries.length" class="g-file-field__list" role="list" :aria-label="listLabel || undefined">
        <li
          v-for="e in entries"
          :key="idx(e.key)"
          :ref="(el) => setChip(e.key, el)"
          :class="['g-file-field__chip', { 'is-landing': landing.has(e.key) }]"
          :data-state="e.state"
          :data-stored="e.file ? undefined : ''"
        >
          <GSummary v-bind="summaryOf(e)" />
          <GProgress v-if="isActive(e)" class="g-file-field__progress" size="sm" color="accent" :show-label="false" :show-value="false" v-bind="progressOf(e)" />
          <span v-if="e.state === 'error'" :id="errId(e)" class="g-file-field__error" hidden>{{ errorDesc(e) }}</span>
          <GBtn v-if="e.state === 'error' && editable && uploader" :id="retryId(e)" class="g-file-field__retry" variant="ghost" color="neutral" size="xs" icon :aria-label="retryLabel(e)" :aria-describedby="errId(e)" @click="retry(e.key)"><GIcon name="rotate-ccw" /></GBtn>
          <GBtn v-if="editable" class="g-file-field__remove" variant="ghost" color="neutral" size="xs" icon :aria-label="removeLabel(e)" @click="remove(e.key)"><GIcon name="x" /></GBtn>
        </li>
      </ul>
      <span class="g-file-field__add" data-g-tooltip-box>
        <input ref="inputEl" class="g-file-field__input" v-bind="inputBindings">
        <span class="g-file-field__add-icon" aria-hidden="true"><GIcon :name="addIcon" /></span>
        <span :id="actionId" class="g-file-field__action">{{ faceText }}</span>
        <span v-if="showAddHint" class="g-file-field__add-hint" aria-hidden="true"><slot name="hint">{{ hint }}</slot></span>
      </span>
      <div class="g-file-field__target" aria-hidden="true"><span class="g-file-field__target-text">{{ targetText }}</span></div>
    </div>
    <div class="g-file-field__foot">
      <p class="g-file-field__meta"><span :id="hintId" class="g-file-field__hint"><slot v-if="hasHint" name="hint">{{ hint }}</slot></span>{{ ' ' }}<span :id="statusId" class="g-file-field__status"><template v-if="statusText">{{ statusText }}</template></span></p>
      <div v-if="notice" class="g-file-field__notice" role="group" :aria-label="need('notAdded', 'nombre del aviso de no añadidos') || undefined">
        <GIcon name="triangle-alert" />
        <ul class="g-file-field__notice-list">
          <li v-for="(n, i) in notice.items" :key="i"><strong dir="auto">{{ n.name }}</strong>{{ n.text ? `: ${n.text}` : '' }}</li>
        </ul>
        <GBtn variant="ghost" color="neutral" size="sm" icon :aria-label="need('dismiss', 'botón «Descartar» del aviso') || undefined" @click="dismiss"><GIcon name="x" /></GBtn>
      </div>
      <div :id="ff.messageId.value" class="g-file-field__message" :aria-live="ff.live.value"><template v-if="message"><GIcon class="g-file-field__message-icon" :name="messageIcon(message.type)" /><span v-if="message.prefix" class="g-file-field__message-type">{{ message.prefix }}</span><slot v-if="message.type === 'error'" name="error">{{ message.text }}</slot><template v-else>{{ message.text }}</template></template></div>
      <input v-for="e in sent" :key="idx(e.key)" type="hidden" :name="name" :value="String(e.value)" :disabled="isDisabled || undefined" :form="attrs.form">
    </div>
    <div class="g-file-field__live" role="status" aria-live="polite" aria-atomic="true">{{ modalHost ? '' : live.polite }}</div>
    <Teleport v-if="modalHost" :to="modalHost"><div class="g-file-field__live" role="status" aria-live="polite" aria-atomic="true">{{ live.polite }}</div></Teleport>
  </div>
</template>
