<script setup>
// GTranscript · vista de revisión de un transcript (captura de voz, Fase 2; dueño: bruno)
// Contrato: design/contracts/speech.md §20 a §31 · Estructura: design/lab/speech/r02/ · Estilo: GTranscript.css (coco)
// Marcado: design/lab/speech/estilo.md «Fase 2» («Marcado que el CSS espera», 1 a 11) y estilo-banco-f2.html.
// Patrón rejilla de datos de APG (role="grid"): una fila por fragmento, UNA sola parada de tabulación (foco itinerante),
// edición en la celda (textarea nativo con la apariencia de GTextarea, #252). Modos: editable, solo selección, solo lectura
// (lista simple) y compacto (panel del anfitrión). Sin virtualizar (§26): filas con clave que solo se repintan si cambia lo
// que muestran; un solo GMenu compartido para los menús de fila (se crea al abrirse). Anuncios: los canales del anfitrión
// dentro de una sesión; sin anfitrión, UNA región propia presente y vacía desde el montaje. Ningún anuncio, evento ni aviso
// lleva texto transcrito.
import { computed, inject, nextTick, onBeforeUnmount, onMounted, provide, reactive, ref, shallowRef, toRaw, useAttrs, useId, watch } from 'vue'
import GBtn from '../GBtn/GBtn.vue'
import GCheckbox from '../GCheckbox/GCheckbox.vue'
import GMenu from '../GMenu/GMenu.vue'
import GIcon from '../GIcon/GLibIcon.js'
import { createLiveWriter } from '../../utils/liveRegion.js'
import { fieldGroupKey, formKey, layoutKey, sectionKey } from '../GForm/formContext.js'
import { INTERNAL, SPEECH_TIMING, speechKey } from '../GSpeechHost/speech.js'
import TranscriptRow from './TranscriptRow.vue'
import TranscriptSpeakers from './TranscriptSpeakers.vue'
import TranscriptInsert from './TranscriptInsert.vue'
import { TRANSCRIPT_LIMITS, formatTime, isTranscript } from './transcript.js'
import { createTargetStore } from './targets.js'
import { createLabeler, wrapParts, withSpace } from './labels.js'
import { REVIEW_DIALOG } from './review.js'

defineOptions({ name: 'GTranscript', inheritAttrs: false })

const props = defineProps({
  transcript: { type: Object, default: undefined },
  editable: { type: Boolean, default: true },
  selectable: { type: Boolean, default: true },
  selected: { type: Array, default: () => [] },
  compact: Boolean,
  copy: { type: Boolean, default: true },
  targets: { type: Array, default: undefined },
  roles: { type: Array, default: undefined },
  diarization: { type: Boolean, default: undefined },
  speakerColors: { type: Number, default: undefined, validator: (v) => Number.isInteger(v) && v >= 0 && v <= 12 },
  labelledby: { type: String, default: undefined },
  label: { type: String, default: undefined },
  headingLevel: { type: Number, default: 3, validator: (v) => [2, 3, 4, 5, 6].includes(v) },
  maxHeight: { type: String, default: undefined },
  labels: { type: Object, default: () => ({}) },
  speech: { type: Object, default: undefined }
})
const emit = defineEmits(['update:selected', 'change', 'insert', 'undo-insert', 'copy'])

// GTranscript dentro de un GForm no es un campo (§24.7): sus casillas y selectores no heredan el contexto del formulario
provide(formKey, null)
provide(layoutKey, null)
provide(sectionKey, null)
provide(fieldGroupKey, null)

const attrs = useAttrs()
const uid = useId()
const injected = inject(speechKey, null)
const inReviewDialog = inject(REVIEW_DIALOG, false)
const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'

// ---------- Gestor, transcript y avisos ----------
const manager = computed(() => toRaw(props.speech) || injected || null)
const api = computed(() => (manager.value && manager.value[INTERNAL]) || null)
const tx = computed(() => (isTranscript(props.transcript) ? props.transcript : null))
const warned = new Set()
function warn(msg) {
  if (api.value) { api.value.warn(msg); return }
  if (isDev && !warned.has(msg)) { warned.add(msg); console.warn(`[Grana Speech] ${msg}`) }
}
const L = createLabeler(() => [props.labels, api.value ? api.value.opts.labels : null], (m) => warn(m))
const t = L.t

const inSession = computed(() => Boolean(api.value && tx.value && api.value.state.transcript === tx.value))
const hostChannels = computed(() => inSession.value && Boolean(api.value.ui.hostAttached))
const conv = computed(() => Boolean(tx.value) && tx.value.mode === 'conversation')
const roles = computed(() => {
  const list = props.roles !== undefined ? props.roles : api.value ? api.value.opts.roles : []
  const out = []
  for (const r of Array.isArray(list) ? list : []) {
    if (!r || typeof r.id !== 'string') continue
    if (out.some((x) => x.id === r.id)) { warn(`roles: id repetido «${r.id}»: se ignora la repetición.`); continue }
    out.push(r)
  }
  return out
})
const speakerColors = computed(() => (props.speakerColors !== undefined ? props.speakerColors : api.value ? api.value.opts.speakerColors : 0))
const diarization = computed(() => {
  if (props.diarization !== undefined) return props.diarization
  if (inSession.value) { const caps = api.value.caps(); return !caps || caps.diarization !== false }
  return true
})
// Destinos: con la prop, solo esos (almacén propio); sin ella, los del gestor
const ownStore = createTargetStore({ warn })
watch(() => props.targets, (v) => { if (v !== undefined) ownStore.replace(v) }, { immediate: true, deep: false })
const store = computed(() => (props.targets !== undefined ? ownStore : api.value ? api.value.targets : null))

if (isDev) {
  watch(() => props.transcript, (v) => {
    if (v === undefined || v === null) warn('<GTranscript> sin transcript: la vista queda vacía.')
    else if (!isTranscript(v)) warn('<GTranscript> necesita una instancia de createTranscript() en transcript: la vista queda vacía.')
  }, { immediate: true })
  if (!props.labelledby && !props.label) warn('<GTranscript> necesita labelledby (recomendado: el título visible) o label para nombrar la rejilla.')
}

// ---------- Modo y columnas ----------
const readMode = computed(() => !props.editable && !props.selectable)
const editable = computed(() => props.editable)
const selectable = computed(() => props.selectable && !props.compact && !readMode.value)
const dataMode = computed(() => (props.editable ? 'edit' : props.selectable ? 'select' : 'read'))
// Columna de hablante: en conversación, salvo un solo participante previsto sin que el motor distinga más ni reasignaciones
const speakerCol = computed(() => {
  const x = tx.value
  if (!x || x.mode !== 'conversation') return false
  if (x.expectedSpeakers !== 1) return true
  return x.speakers.length > 1 || x.segments.some((s) => s.speaker !== null)
})
const cols = computed(() => [selectable.value && 'select', 'time', speakerCol.value && 'speaker', 'text', 'actions'].filter(Boolean))

// ---------- Filas (fragmentos + provisional al final, con la clave de su id) ----------
const rows = computed(() => {
  const x = tx.value
  if (!x) return []
  const list = x.segments.slice()
  const p = x.partial
  if (p && !x.segment(p.id)) list.push({ id: p.id, partial: true })
  return list
})
const rowIds = computed(() => rows.value.map((r) => r.id))
const empty = computed(() => rows.value.length === 0)
const confirmedIds = computed(() => (tx.value ? tx.value.segments.filter((s) => !s.failed).map((s) => s.id) : []))
const partialTime = computed(() => {
  const segs = tx.value ? tx.value.segments : []
  return formatTime(segs.length ? segs[segs.length - 1].t1 : 0)
})

// ---------- Identificadores ----------
const rootId = computed(() => attrs.id || `g-transcript-${uid}`)
const kbdId = computed(() => `${rootId.value}-kbd`)
const menuId = computed(() => `${rootId.value}-rowmenu`)
const rootAttrs = computed(() => {
  const { id: _id, ...rest } = attrs
  return rest
})

// ---------- Etiquetas de hablante (§23.2) ----------
function speakerLabel(id) {
  if (!id) return t('unassigned')
  const x = tx.value
  const sp = x.speakers.find((s) => s.id === id)
  const letter = x.letter(id)
  const role = sp && sp.role ? roles.value.find((r) => r.id === sp.role) : null
  if (sp && sp.role && !role) warn(`el rol «${sp.role}» de un hablante no está en roles: se muestra sin rol.`)
  return role ? t('speakerRole', { role: role.label, letter }) : t('speaker', { letter })
}
// Nombre de un turno en la composición: el rol si es único entre los visibles; si no, la etiqueta completa (§21.7)
function speakerName(id) {
  const x = tx.value
  const sp = x.speakers.find((s) => s.id === id)
  const role = sp && sp.role ? roles.value.find((r) => r.id === sp.role) : null
  if (!role) return speakerLabel(id)
  const dup = x.visibleSpeakers().filter((s) => s.role === sp.role).length > 1
  return dup ? speakerLabel(id) : role.label
}
// Color por hablante solo como complemento y solo con speakerColors (§23.6): posición k ≤ speakerColors
function cat(id) {
  if (!id || !speakerColors.value) return undefined
  const k = tx.value.speakers.findIndex((s) => s.id === id) + 1
  return k > 0 && k <= speakerColors.value ? String(k) : undefined
}

// ---------- Anuncios (§22.12): uno por acción, agrupados (gana el último) ----------
const live = reactive({ polite: '', assertive: '' })
const writer = createLiveWriter(live, { delay: 50, clear: 5000 })
let sayTimer = null
function say(text) {
  if (!text) return
  clearTimeout(sayTimer)
  sayTimer = setTimeout(() => {
    sayTimer = null
    if (hostChannels.value) api.value.polite(text)
    else writer.announce(text, 'polite')
  }, SPEECH_TIMING.announceGroupMs)
}

// ---------- Estado de la vista ----------
const root = ref(null)
const scroller = ref(null)
const grid = ref(null)
const speakersRef = ref(null)
const active = reactive({ id: null, col: 'text' })
const editing = ref(null)
const editText = ref('')
const sel = shallowRef(new Set())
let anchor = null
const origOpen = shallowRef(new Set())
const changes = ref(false)
const speakersOpen = ref(false)
const newer = ref(0)
const narrow = ref(false)
const textSel = shallowRef(null)
const menu = reactive({ open: false, id: null, kind: null })
const barMenus = reactive({ copy: false, assign: false, more: false })
const ins = reactive({ src: 'all', manual: false, target: null, pos: 'end', withSpk: true, last: null })
const mac = ref(false)

const activeId = computed(() => (active.id !== null && rowIds.value.includes(active.id) ? active.id : rowIds.value[0] ?? null))
const activeCol = computed(() => (cols.value.includes(active.col) ? active.col : 'text'))
const selectionIds = () => rowIds.value.filter((id) => sel.value.has(id))

// ---------- Selección (v-model:selected; la selección es de la vista) ----------
const isSelectable = (id) => { const s = tx.value && tx.value.segment(id); return Boolean(s) && !s.failed }
watch(() => props.selected, (v) => {
  const list = Array.isArray(v) ? v.map(String) : []
  const ok = list.filter((id) => isSelectable(id))
  if (ok.length !== list.length) warn('selected trae ids que no son fragmentos confirmados (provisional, fallidos o inexistentes): se descartan.')
  const same = ok.length === sel.value.size && ok.every((id) => sel.value.has(id))
  if (!same) sel.value = new Set(ok)
}, { immediate: true })
// Selección pintada: la verdad es `sel` (contador, «Seleccionar todo», inserción, eventos); las filas leen `shown`. Un cambio
// de más de TRANSCRIPT_LIMITS.selectionBatch (§26.6, #263) filas (Ctrl+A, «Seleccionar todo», un rango largo) se pinta por tramos: primero las filas a la vista y la
// enfocada, después el resto, selectionBatch filas por fotograma. Así la tecla responde en el primer pintado (§26, compuerta < 100 ms:
// restilar cientos de casillas y filas de una vez cuesta más que eso) y nada fuera de la vista queda sin pintar más de unos
// fotogramas. Un cambio nuevo cancela los tramos pendientes del anterior.
const shown = shallowRef(new Set())
let paintJob = 0
function visibleIds() {
  const out = new Set()
  if (activeId.value !== null) out.add(activeId.value)
  const body = grid.value && grid.value.querySelector('.g-transcript__body')
  if (!body || typeof window === 'undefined') return out
  const sc = scroller.value ? scroller.value.getBoundingClientRect() : { top: 0, bottom: window.innerHeight }
  const top = Math.max(0, sc.top)
  const bottom = Math.min(window.innerHeight, sc.bottom)
  const list = body.children
  // Búsqueda binaria de la primera fila cuyo borde inferior pasa del borde superior visible
  let lo = 0
  let hi = list.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (list[mid].getBoundingClientRect().bottom < top) lo = mid + 1
    else hi = mid
  }
  for (let i = lo; i < list.length; i++) {
    const r = list[i].getBoundingClientRect()
    if (r.top > bottom) break
    out.add(list[i].dataset.id)
  }
  return out
}
function paintSelection(next) {
  const prev = shown.value
  const changed = rowIds.value.filter((id) => prev.has(id) !== next.has(id))
  const job = ++paintJob
  if (changed.length <= TRANSCRIPT_LIMITS.selectionBatch || typeof requestAnimationFrame !== 'function') { shown.value = next; return }
  const near = visibleIds()
  const first = changed.filter((id) => near.has(id))
  const rest = changed.filter((id) => !near.has(id))
  const apply = (ids) => {
    const s = new Set(shown.value)
    for (const id of ids) { if (next.has(id)) s.add(id); else s.delete(id) }
    shown.value = s
  }
  apply(first)
  const step = () => {
    if (job !== paintJob) return
    apply(rest.splice(0, TRANSCRIPT_LIMITS.selectionBatch))
    if (rest.length) requestAnimationFrame(step)
  }
  if (rest.length) requestAnimationFrame(step)
}
watch(sel, (next) => paintSelection(next), { immediate: true })
function setSelection(next, { announce = false } = {}) {
  sel.value = next
  emit('update:selected', rowIds.value.filter((id) => next.has(id)))
  if (announce) say(next.size ? t('transcript.announce.selected', { count: next.size }) : t('transcript.announce.selectedNone'))
}
function toggleSel(id) {
  if (!selectable.value || !isSelectable(id)) return
  const next = new Set(sel.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  anchor = id
  setSelection(next)
}
function rangeSel(a, b, on) {
  const i = rowIds.value.indexOf(a)
  const j = rowIds.value.indexOf(b)
  if (i < 0 || j < 0) return
  const next = new Set(sel.value)
  for (const id of rowIds.value.slice(Math.min(i, j), Math.max(i, j) + 1)) if (isSelectable(id)) { if (on) next.add(id); else next.delete(id) }
  setSelection(next, { announce: true })
}
function selectAll() {
  const all = confirmedIds.value
  const n = all.filter((id) => sel.value.has(id)).length
  setSelection(n < all.length ? new Set(all) : new Set(), { announce: true })
}
const selCount = computed(() => confirmedIds.value.filter((id) => sel.value.has(id)).length)
// Sobre la fila o sobre la selección: si la fila está seleccionada y hay más de una, sobre toda la selección (§22.8)
const targetsFor = (id) => (sel.value.has(id) && sel.value.size > 1 ? selectionIds() : [id])
let shiftClick = false
function checkClick(id, event) { shiftClick = Boolean(event && event.shiftKey) }
function check(id, value) {
  // Mayús+clic: el rango desde la última marcada (o, si la selección llegó por la prop, desde la última seleccionada)
  const from = anchor || selectionIds().filter((x) => x !== id).pop() || null
  if (shiftClick && from && from !== id) { shiftClick = false; rangeSel(from, id, value); anchor = id; return }
  shiftClick = false
  const next = new Set(sel.value)
  if (value) next.add(id)
  else next.delete(id)
  anchor = id
  setSelection(next)
}

// ---------- Foco itinerante ----------
const rowEl = (id) => (grid.value ? [...grid.value.querySelectorAll('.g-transcript__row')].find((r) => r.dataset.id === id) || null : null)
function activeEl() {
  const row = rowEl(activeId.value)
  return row ? row.querySelector(`[data-focus="${activeCol.value}"]`) : null
}
async function focusActive({ scroll = true } = {}) {
  await nextTick()
  const el = activeEl()
  if (!el) return
  el.focus({ preventScroll: true })
  if (scroll && typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'nearest' })
}
function focusCell(id, col, opts) {
  if (id === null || id === undefined) return
  active.id = id
  active.col = cols.value.includes(col) ? col : 'text'
  return focusActive(opts)
}
function onFocusin(event) {
  const target = event.target
  const row = target.closest && target.closest('.g-transcript__row')
  if (!row || !grid.value || !grid.value.contains(row)) return
  const f = target.closest('[data-focus]') || (target.closest('.g-transcript__editor') ? { dataset: { focus: 'text' } } : null)
  const cell = target.closest('.g-transcript__cell')
  const col = f ? f.dataset.focus : cell ? (cell.className.match(/--(select|time|speaker|text|actions)\b/) || [])[1] : null
  if (col && (active.id !== row.dataset.id || active.col !== col)) { active.id = row.dataset.id; active.col = col }
}
function moveRow(d) {
  const ids = rowIds.value
  const i = ids.indexOf(activeId.value)
  const j = Math.max(0, Math.min(ids.length - 1, i + d))
  focusCell(ids[j], activeCol.value)
  return ids[j]
}
function moveCol(d) {
  const c = cols.value
  const i = c.indexOf(activeCol.value)
  focusCell(activeId.value, c[Math.max(0, Math.min(c.length - 1, i + d))])
}

// ---------- Edición en la celda (§22.6) ----------
const fieldEl = () => (editing.value !== null ? document.getElementById(`${rootId.value}-ed-${editing.value}`) : null)
async function startEdit(id) {
  const s = tx.value && tx.value.segment(id)
  if (!editable.value || !s || s.failed || s.removed) return
  if (editing.value !== null && editing.value !== id) commitEdit(false)
  editText.value = tx.value.textOf(s)
  editing.value = id
  active.id = id
  active.col = 'text'
  await nextTick()
  const ta = fieldEl()
  if (ta) {
    ta.focus({ preventScroll: true })
    ta.setSelectionRange(ta.value.length, ta.value.length)
    if (typeof ta.scrollIntoView === 'function') ta.scrollIntoView({ block: 'nearest' })
  }
}
function commitEdit(returnFocus) {
  const id = editing.value
  if (id === null) return
  const ta = fieldEl()
  const value = ta ? ta.value : null
  editing.value = null
  const r = value === null ? false : tx.value.edit(id, value)
  const s = tx.value.segment(id)
  if (r) emit('change', { kind: 'edit', ids: [id] })
  if (r === 'edited') say(t('transcript.announce.edited', { time: formatTime(s.t0) }))
  else if (r === 'emptied') say(t('transcript.announce.emptied', { time: formatTime(s.t0) }))
  if (returnFocus) focusCell(id, 'text')
}
function cancelEdit() {
  const id = editing.value
  if (id === null) return
  editing.value = null
  focusCell(id, 'text')
}
// Salir del editor guarda (el foco va a otro elemento de la página); cambiar de ventana no (§22.6, 3)
let editorPointer = false
function onPointerdown(event) {
  editorPointer = Boolean(event.target.closest && event.target.closest('.g-transcript__editor'))
  if (editorPointer) setTimeout(() => { editorPointer = false }, 0)
}
function onFocusout(event) {
  if (editing.value === null) return
  const ed = event.target.closest && event.target.closest('.g-transcript__editor')
  if (!ed) return
  const to = event.relatedTarget
  if (to && ed.contains(to)) return
  if (!to && (editorPointer || (typeof document.hasFocus === 'function' && !document.hasFocus()))) return
  const id = editing.value
  queueMicrotask(() => { if (editing.value === id && !ed.contains(document.activeElement)) commitEdit(false) })
}

// ---------- Operaciones con anuncio y evento `change` ----------
const timeOf = (id) => { const s = tx.value.segment(id); return formatTime(s ? s.t0 : 0) }
function removeOrRestore(ids) {
  const segs = ids.map((i) => tx.value.segment(i)).filter((s) => s && !s.failed)
  if (!segs.length || !editable.value) return
  const restore = segs.every((s) => s.removed)
  const list = restore ? segs.map((s) => s.id) : segs.filter((s) => !s.removed).map((s) => s.id)
  const ok = restore ? tx.value.restore(list) : tx.value.remove(list)
  if (!ok) return
  emit('change', { kind: restore ? 'restore' : 'remove', ids: list })
  say(t(restore ? 'transcript.announce.restored' : 'transcript.announce.removed', { count: list.length, time: formatTime(segs[0].t0) }))
}
function revert(id) {
  if (!tx.value.revert(id)) return
  emit('change', { kind: 'revert', ids: [id] })
  say(t('transcript.announce.reverted', { time: timeOf(id) }))
}
function assign(ids, speakerId) {
  let to = speakerId
  if (speakerId === '__new') {
    to = tx.value.assignNewSpeaker(ids)
    if (!to) return
    emit('change', { kind: 'assignNewSpeaker', ids })
  } else {
    if (!tx.value.assignSpeaker(ids, speakerId)) return
    to = speakerId === null ? tx.value.speakerOf(ids[0]) : tx.value.resolve(speakerId)
    emit('change', { kind: 'assignSpeaker', ids })
  }
  say(t('transcript.announce.speaker', { count: ids.length, time: timeOf(ids[0]), speaker: speakerLabel(to) }))
}
const historyLabel = (e) => (e ? t(`transcript.history.${e.kind}`, { time: e.t0 !== null && e.t0 !== undefined ? formatTime(e.t0) : '' }) : '')
function doUndo(redo, fromGrid) {
  if (!editable.value || !tx.value) return
  const e = redo ? tx.value.redo() : tx.value.undo()
  if (!e) { say(t(redo ? 'transcript.announce.nothingRedo' : 'transcript.announce.nothingUndo')); return }
  emit('change', { kind: redo ? 'redo' : 'undo', ids: e.ids })
  say(t(redo ? 'transcript.announce.redone' : 'transcript.announce.undone', { what: historyLabel(e) }))
  const first = e.ids.find((i) => rowIds.value.includes(i))
  if (!first) return
  if (fromGrid) focusCell(first, activeCol.value)
  else nextTick(() => { const r = rowEl(first); if (r && typeof r.scrollIntoView === 'function') r.scrollIntoView({ block: 'nearest' }) })
}
function setRole(speakerId, value) {
  const role = value === '' || value === null || value === undefined ? null : String(value)
  if (role !== null && !roles.value.some((r) => r.id === role)) warn(`setRole: el rol «${role}» no está en roles.`)
  if (!tx.value.setRole(speakerId, role)) return
  emit('change', { kind: 'setRole', ids: [] })
  const r = roles.value.find((x) => x.id === role)
  say(t('transcript.announce.role', { speaker: t('speaker', { letter: tx.value.letter(speakerId) }), role: r ? r.label : t('transcript.speakers.noRole') }))
}
function merge(from, into) {
  if (!into || !tx.value.mergeSpeakers(from, into)) return
  emit('change', { kind: 'mergeSpeakers', ids: [] })
  say(t('transcript.announce.merged', { from: t('speaker', { letter: tx.value.letter(from) }), into: speakerLabel(tx.value.resolve(into)) }))
}
function unmerge(id) {
  if (!tx.value.unmerge(id)) return
  emit('change', { kind: 'unmerge', ids: [] })
  say(t('transcript.announce.unmerged', { from: speakerLabel(id) }))
}
function addSpeaker() {
  const id = tx.value.addSpeaker()
  if (!id) return
  emit('change', { kind: 'addSpeaker', ids: [] })
  say(t('transcript.announce.added', { speaker: speakerLabel(id) }))
}
function toggleChanges() {
  changes.value = !changes.value
  origOpen.value = new Set()
  say(t(changes.value ? 'transcript.announce.changesShown' : 'transcript.announce.changesHidden'))
}
function toggleOrig(id) {
  const next = new Set(origOpen.value)
  if (changes.value) { changes.value = false; next.clear() }
  if (next.has(id)) next.delete(id)
  else next.add(id)
  origOpen.value = next
}
async function openSpeakers(focusTitle) {
  speakersOpen.value = !speakersOpen.value || Boolean(focusTitle)
  if (focusTitle) { await nextTick(); if (speakersRef.value) speakersRef.value.focusTitle() }
}

// ---------- Copia (§22.8) ----------
async function copyRows(ids, full) {
  if (!props.copy || !tx.value) return
  const source = ids ? { kind: 'segments', ids } : { kind: 'all' }
  const withSpeakers = full && conv.value
  const res = tx.value.compose(source, { withSpeakers, withTimes: full, speakerName })
  try {
    if (typeof navigator === 'undefined' || !navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') throw new Error('sin portapapeles')
    await navigator.clipboard.writeText(res.text)
    say(t('transcript.announce.copied', { what: t('transcript.what.segments', { count: res.ids.length }) }))
    emit('copy', { count: res.ids.length, withSpeakers, withTimes: full })
  } catch {
    say(t('transcript.announce.copyFailed'))
  }
}
// Selección de texto dentro de la vista → partes { id, start, end, text } sobre el texto corregido (§22.8, 3)
function mapSelection() {
  if (typeof getSelection !== 'function' || !grid.value || !tx.value) return null
  const s = getSelection()
  if (!s || s.isCollapsed || !s.rangeCount) return null
  const range = s.getRangeAt(0)
  if (!grid.value.contains(range.commonAncestorContainer)) return null
  const rowOf = (n) => { const el = n && (n.nodeType === 1 ? n : n.parentElement); return el && el.closest('.g-transcript__row') }
  const ids = rowIds.value
  let a = ids.indexOf(rowOf(range.startContainer)?.dataset.id)
  let b = ids.indexOf(rowOf(range.endContainer)?.dataset.id)
  if (a < 0) a = 0
  if (b < 0) b = ids.length - 1
  const parts = []
  for (const id of ids.slice(Math.min(a, b), Math.max(a, b) + 1)) {
    const seg = tx.value.segment(id)
    if (!seg || seg.failed) continue
    const p = rowEl(id)?.querySelector('.g-transcript__text')
    if (!p || !range.intersectsNode(p)) continue
    const off = (node, o) => { const r = document.createRange(); r.selectNodeContents(p); r.setEnd(node, o); return r.toString().length }
    const len = p.textContent.length
    const start = p.contains(range.startContainer) ? off(range.startContainer, range.startOffset) : 0
    const end = p.contains(range.endContainer) ? off(range.endContainer, range.endOffset) : len
    if (end > start) parts.push({ id, start, end, text: p.textContent.slice(start, end) })
  }
  return parts.length ? parts : null
}
function onCopy(event) {
  if (!props.copy || !event.clipboardData) return
  const parts = mapSelection()
  if (!parts) return
  event.preventDefault()
  event.clipboardData.setData('text/plain', tx.value.compose({ kind: 'text', parts }).text)
}
let selTimer = null
function onSelectionChange() {
  clearTimeout(selTimer)
  selTimer = setTimeout(() => {
    const parts = mapSelection()
    if (parts) textSel.value = parts
    else if (textSel.value && grid.value && grid.value.contains(document.activeElement)) textSel.value = null
  }, TRANSCRIPT_LIMITS.selectionDebounce)
}

// ---------- Inserción (§24) ----------
function insert(targetId, source, { position = 'end', withSpeakers, what } = {}) {
  const st = store.value
  const target = st && st.get(targetId)
  if (!target || !tx.value) return null
  const wsp = withSpeakers !== undefined ? withSpeakers : conv.value && ins.withSpk
  const res = tx.value.compose(source, { withSpeakers: wsp, multiline: target.multiline !== false, speakerName })
  if (!res.text) { say(t('transcript.insert.nothing')); return null }
  const sources = Object.fromEntries(res.ids.map((i) => [i, tx.value.textOf(i)]))
  const use = st.insert(tx.value, targetId, res.text, { position, sourceIds: res.ids, sources })
  if (!use) return null
  const w = what || (source.kind === 'text' ? t('transcript.what.text') : t('transcript.what.segments', { count: res.ids.length }))
  ins.last = { useId: use.id, label: target.label, what: w }
  say(t('transcript.announce.inserted', { target: target.label, what: w }))
  emit('insert', JSON.parse(JSON.stringify(use)))
  return use
}
function undoInsert(useId) {
  const st = store.value
  if (!st || !tx.value) return false
  const use = tx.value.derived.find((d) => d.id === useId)
  const copy = use ? JSON.parse(JSON.stringify(use)) : null
  const r = st.undo(tx.value, useId)
  if (!r.ok) { say(t('transcript.announce.insertUndoFailed', { target: r.label })); return false }
  say(t('transcript.announce.insertUndone', { target: r.label }))
  if (copy) emit('undo-insert', copy)
  return true
}
const hasTargets = computed(() => Boolean(store.value) && store.value.list.length > 0)

// ---------- Menús ----------
const menuItems = computed(() => {
  if (!menu.open || !tx.value || menu.id === null) return []
  const x = tx.value
  if (menu.kind === 'speaker' || menu.kind === 'assign') {
    const ids = menu.kind === 'assign' ? selectionIds() : targetsFor(menu.id)
    const one = ids.length === 1 ? x.segment(ids[0]) : null
    const eff = one ? x.speakerOf(one) : null
    const items = x.visibleSpeakers().map((sp) => ({ type: 'radio', id: `spk:${sp.id}`, label: speakerLabel(sp.id), checked: Boolean(one) && eff === sp.id }))
    items.push({ type: 'separator' }, { id: 'new', label: t('transcript.menu.newSpeaker'), icon: 'user-plus' })
    const eng = one ? x.resolve(one.engineSpeaker) : null
    if (one && one.speaker !== null && eng && eff !== eng) items.push({ id: 'engine', label: t('transcript.menu.engineSpeaker', { speaker: speakerLabel(eng) }), icon: 'rotate-ccw' })
    return items
  }
  const s = x.segment(menu.id)
  if (!s) return []
  const changed = s.corrected !== null || (s.speaker !== null && s.engineSpeaker !== null && x.speakerOf(s) !== x.resolve(s.engineSpeaker))
  const items = []
  if (editable.value && !s.removed) items.push({ id: 'edit', label: t('transcript.menu.edit'), icon: 'pencil' })
  if (changed) items.push({ id: 'orig', label: t(changes.value || origOpen.value.has(s.id) ? 'transcript.menu.hideOriginal' : 'transcript.menu.showOriginal'), icon: 'git-compare' })
  if (editable.value && changed) items.push({ id: 'revert', label: t('transcript.menu.revert'), icon: 'rotate-ccw' })
  if (editable.value) items.push(s.removed ? { id: 'restore', label: t('transcript.menu.restore'), icon: 'rotate-ccw' } : { id: 'remove', label: t('transcript.menu.remove'), icon: 'trash' })
  if (props.copy) items.push({ type: 'separator' }, { id: 'copy', label: t('transcript.menu.copy'), icon: 'copy' })
  if (hasTargets.value && !props.compact && !s.removed) for (const target of store.value.list) items.push({ id: `ins:${target.id}`, label: t('transcript.menu.insert', { target: target.label }), icon: 'text-cursor-input' })
  return items
})
const menuLabel = computed(() => {
  if (menu.kind === 'actions' && menu.id !== null && tx.value && tx.value.segment(menu.id)) return t('transcript.row.actions', { time: timeOf(menu.id) })
  if (menu.kind === 'assign') return t('transcript.bar.assign')
  return t('transcript.cols.speaker')
})
async function openMenu(id, kind) {
  if (menu.open && menu.id === id && menu.kind === kind) { menu.open = false; return }
  // Otro menú abierto (o recién cerrado por el clic fuera): se cierra del todo antes de abrir este, para que GMenu lo
  // coloque junto a su botón y emita `closed` del anterior
  if (menu.open || menu.id !== null) { menu.open = false; await nextTick() }
  menu.id = id
  menu.kind = kind
  menu.open = true
}
function onMenuClosed() {
  menu.id = null
  menu.kind = null
}
async function onMenuSelect(payload) {
  if (payload.event && typeof payload.event.preventDefault === 'function') payload.event.preventDefault()
  const { id, kind } = menu
  menu.open = false
  const pick = String(payload.id)
  let keepFocus = true
  if (kind === 'speaker' || kind === 'assign') {
    const ids = kind === 'assign' ? selectionIds() : targetsFor(id)
    if (!ids.length) return
    if (pick === 'new') assign(ids, '__new')
    else if (pick === 'engine') assign(ids, null)
    else if (pick.startsWith('spk:')) assign(ids, pick.slice(4))
  } else if (pick === 'edit') { keepFocus = false; startEdit(id) } else if (pick === 'orig') toggleOrig(id)
  else if (pick === 'revert') revert(id)
  else if (pick === 'remove' || pick === 'restore') removeOrRestore([id])
  else if (pick === 'copy') copyRows([id], false)
  else if (pick.startsWith('ins:')) insert(pick.slice(4), { kind: 'segments', ids: [id] }, { position: 'end' })
  if (keepFocus && kind !== 'assign') focusCell(id, kind === 'speaker' ? 'speaker' : 'actions', { scroll: false })
  else if (keepFocus) nextTick(() => { const b = root.value && root.value.querySelector('.g-transcript__bar [data-bar="assign"]'); if (b) b.focus() })
}
// Menús de la barra (Copiar, Asignar, «Más»)
const copyItems = computed(() => [{ id: 'text', label: t('transcript.bar.copyText'), icon: 'copy' }, { id: 'full', label: t('transcript.bar.copyFull'), icon: 'copy' }])
const speakersAvailable = computed(() => editable.value && !props.compact && conv.value)
const moreItems = computed(() => {
  const items = []
  if (props.copy) items.push({ id: 'text', label: t('transcript.bar.copyText'), icon: 'copy' }, { id: 'full', label: t('transcript.bar.copyFull'), icon: 'copy' }, { type: 'separator' })
  items.push({ type: 'checkbox', id: 'changes', label: t('transcript.bar.changes'), checked: changes.value })
  if (speakersAvailable.value) items.push({ id: 'speakers', label: t('transcript.bar.speakers'), icon: 'users' })
  return items
})
function onCopySelect(p) { copyRows(sel.value.size ? selectionIds() : null, p.id === 'full') }
function onMoreSelect(p) {
  if (p.id === 'text' || p.id === 'full') copyRows(sel.value.size ? selectionIds() : null, p.id === 'full')
  else if (p.id === 'changes') toggleChanges()
  else if (p.id === 'speakers') { if (p.event) p.event.preventDefault(); barMenus.more = false; openSpeakers(true) }
}
function openAssign() {
  if (!selCount.value) return
  openMenu('__bar', 'assign')
}

// ---------- Barra: estado ----------
const allState = computed(() => ({ checked: selCount.value > 0 && selCount.value === confirmedIds.value.length, mixed: selCount.value > 0 && selCount.value < confirmedIds.value.length }))
const allRemoved = computed(() => selCount.value > 0 && selectionIds().every((id) => { const s = tx.value.segment(id); return !s || s.removed }))
const undoDesc = computed(() => (tx.value && tx.value.canUndo ? t('transcript.bar.undoWhat', { what: historyLabel(tx.value.nextUndo) }) : t('transcript.bar.nothingUndo')))
const redoDesc = computed(() => (tx.value && tx.value.canRedo ? t('transcript.bar.redoWhat', { what: historyLabel(tx.value.nextRedo) }) : t('transcript.bar.nothingRedo')))
const keys = computed(() => (mac.value ? { undo: 'Meta+Z', redo: 'Meta+Shift+Z' } : { undo: 'Control+Z', redo: 'Control+Shift+Z' }))
const triggerAttrs = (a, enabled = true) => ({ ...a, onClick: (e) => { if (enabled) a.onClick(e) }, onKeydown: (e) => { if (enabled) a.onKeydown(e) } })

// ---------- Teclado de la rejilla (§22.11) ----------
function onGridKeydown(event) {
  if (event.isComposing) return
  const target = event.target
  if (target.closest && target.closest('.g-transcript__editor')) {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); cancelEdit() } else if (event.key === 'Enter' && target.localName === 'textarea' && !event.shiftKey) { event.preventDefault(); commitEdit(true) }
    return
  }
  if (activeId.value === null) return
  const id = activeId.value
  const col = activeCol.value
  const mod = event.ctrlKey || event.metaKey
  const rtl = root.value && getComputedStyle(root.value).direction === 'rtl'
  let handled = true
  switch (event.key) {
    case 'ArrowDown':
    case 'ArrowUp': {
      const d = event.key === 'ArrowDown' ? 1 : -1
      if (event.shiftKey && selectable.value) {
        const next = new Set(sel.value)
        if (isSelectable(id)) next.add(id)
        const to = rowIds.value[Math.max(0, Math.min(rowIds.value.length - 1, rowIds.value.indexOf(id) + d))]
        if (isSelectable(to)) next.add(to)
        if (!anchor) anchor = id
        setSelection(next)
        focusCell(to, col)
      } else moveRow(d)
      break
    }
    case 'ArrowRight': moveCol(rtl ? -1 : 1); break
    case 'ArrowLeft': moveCol(rtl ? 1 : -1); break
    case 'Home': if (mod) focusCell(rowIds.value[0], col); else focusCell(id, cols.value[0]); break
    case 'End': if (mod) focusCell(rowIds.value[rowIds.value.length - 1], col); else focusCell(id, cols.value[cols.value.length - 1]); break
    case 'PageDown': moveRow(TRANSCRIPT_LIMITS.pageRows); break
    case 'PageUp': moveRow(-TRANSCRIPT_LIMITS.pageRows); break
    case 'F2':
    case 'Enter':
      if (col === 'text' || col === 'time') startEdit(id)
      else if (event.key === 'F2' && (col === 'speaker' || col === 'actions') && target.localName === 'button') target.click()
      else handled = false
      break
    case ' ':
      if (col === 'select' && !event.shiftKey && target.localName === 'input') handled = false
      else if (selectable.value) toggleSel(id)
      break
    case 'Delete':
    case 'Backspace':
      if (editable.value) removeOrRestore(targetsFor(id))
      else handled = false
      break
    default:
      if (mod && (event.key === 'z' || event.key === 'Z') && editable.value) doUndo(event.shiftKey, true)
      else if (mod && (event.key === 'y' || event.key === 'Y') && editable.value) doUndo(true, true)
      else if (mod && (event.key === 'a' || event.key === 'A') && selectable.value) selectAll()
      else if (mod && (event.key === 'c' || event.key === 'C') && props.copy && !String(typeof getSelection === 'function' ? getSelection() : '').trim()) copyRows(sel.value.size ? selectionIds() : [id], false)
      else handled = false
  }
  if (handled) event.preventDefault()
}
function onDblclick(event) {
  const row = event.target.closest && event.target.closest('.g-transcript__row')
  if (row && event.target.closest('.g-transcript__cell--text') && !event.target.closest('.g-transcript__editor')) startEdit(row.dataset.id)
}

// ---------- Fragmentos nuevos: seguir el final solo si ya se estaba al final (§22.7) ----------
const atBottom = () => { const el = scroller.value; return !el || el.scrollHeight - el.scrollTop - el.clientHeight < TRANSCRIPT_LIMITS.followMargin }
function onScroll() { if (newer.value && atBottom()) newer.value = 0 }
watch(() => (tx.value ? [tx.value.segments.length, tx.value.partial ? tx.value.partial.id : null] : null), (now, before) => {
  if (!now || !before || readMode.value) return
  const added = Math.max(0, now[0] - before[0])
  const was = atBottom()
  const lastBefore = rowIds.value[rowIds.value.length - 1]
  nextTick(() => {
    const el = scroller.value
    if (!el) return
    const focusOther = grid.value && grid.value.contains(document.activeElement) && active.id !== null && active.id !== lastBefore && active.id !== rowIds.value[rowIds.value.length - 1]
    if (was && editing.value === null && !menu.open && !focusOther) el.scrollTop = el.scrollHeight
    else if (added) newer.value += added
  })
}, { flush: 'pre' })
function goToEnd() {
  newer.value = 0
  if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight
  focusCell(rowIds.value[rowIds.value.length - 1], 'text')
}

// ---------- Cambio de transcript: la vista se vacía (§22.1) ----------
watch(tx, (next, prev) => {
  if (next === prev) return
  const had = grid.value && grid.value.contains(document.activeElement)
  editing.value = null
  origOpen.value = new Set()
  textSel.value = null
  newer.value = 0
  ins.last = null
  menu.open = false
  if (sel.value.size) setSelection(new Set())
  active.id = null
  if (had) {
    if (rowIds.value.length) focusCell(rowIds.value[0], 'text')
    else nextTick(() => focusFallback())
  }
})
function focusFallback() {
  const el = props.labelledby ? document.getElementById(props.labelledby) : null
  if (el && el.tabIndex >= -1 && (el.hasAttribute('tabindex') || /^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName))) el.focus()
  else if (root.value) root.value.focus()
}

// ---------- Ancho estrecho: data-narrow bajo space × 160, medido fuera del callback del ResizeObserver (#258) ----------
const NARROW_SPACES = 160
function spaceUnit(el) {
  let cs = getComputedStyle(el)
  let raw = cs.getPropertyValue('--g-space-1').trim()
  if (!raw) { cs = getComputedStyle(document.documentElement); raw = cs.getPropertyValue('--g-space-1').trim() }
  let v = parseFloat(raw)
  if (raw.endsWith('rem')) v *= parseFloat(getComputedStyle(document.documentElement).fontSize)
  else if (raw.endsWith('em')) v *= parseFloat(cs.fontSize)
  return Number.isFinite(v) && v > 0 ? v : 0
}
function measure() {
  if (!root.value) return
  const s = spaceUnit(root.value)
  narrow.value = s > 0 && root.value.getBoundingClientRect().width < s * NARROW_SPACES
}
let ro = null
let raf = 0

// ---------- Superficie de revisión (§25.2) ----------
let offSurface = null
function reveal() {
  const el = props.labelledby ? document.getElementById(props.labelledby) : null
  if (el) {
    if (!el.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) el.setAttribute('tabindex', '-1')
    el.focus({ preventScroll: true })
    if (typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'start' })
  } else focus()
}
const wantsSurface = computed(() => inSession.value && !props.compact && !inReviewDialog)
function syncSurface() {
  if (offSurface) { offSurface(); offSurface = null }
  if (mounted && wantsSurface.value) offSurface = api.value.registerSurface({ reveal })
}
watch(wantsSurface, syncSurface)

// ---------- Montaje ----------
let mounted = false
let offSelection = null
watch([hasTargets, readMode], () => syncSelectionListener())
function syncSelectionListener() {
  const want = mounted && hasTargets.value && !readMode.value
  if (want && !offSelection) {
    document.addEventListener('selectionchange', onSelectionChange)
    offSelection = () => document.removeEventListener('selectionchange', onSelectionChange)
  } else if (!want && offSelection) { offSelection(); offSelection = null }
}
onMounted(() => {
  mounted = true
  mac.value = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '')
  measure()
  if (typeof ResizeObserver !== 'undefined' && root.value) {
    ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(measure)
    })
    ro.observe(root.value)
  }
  syncSurface()
  syncSelectionListener()
})
onBeforeUnmount(() => {
  mounted = false
  if (ro) ro.disconnect()
  if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf)
  if (offSurface) offSurface()
  if (offSelection) offSelection()
  clearTimeout(sayTimer)
  clearTimeout(selTimer)
  writer.dispose()
})

// ---------- Contexto compartido con las filas, el gestor de hablantes y la inserción (estable) ----------
const wrapCache = computed(() => ({ del: wrapParts(L.raw('transcript.diff.deleted') || ''), ins: wrapParts(L.raw('transcript.diff.inserted') || '') }))
const ctx = {
  t,
  get uid() { return rootId.value },
  get triggerId() { return `${menuId.value}-trigger` },
  get listId() { return `${menuId.value}-list` },
  tx: () => tx.value,
  editable: () => editable.value,
  selectable: () => selectable.value,
  conv: () => conv.value,
  roles: () => roles.value,
  store: () => store.value,
  selectionIds,
  textSel: () => textSel.value,
  ins,
  speakerLabel,
  speakerName,
  cat,
  wraps: () => wrapCache.value,
  check,
  checkClick,
  openMenu,
  save: () => commitEdit(true),
  cancel: () => cancelEdit(),
  setRole,
  merge,
  unmerge,
  addSpeaker,
  insert,
  undoInsert,
  say
}

// ---------- Métodos públicos (§22.2) ----------
function focus() {
  if (readMode.value) { const l = root.value && root.value.querySelector('.g-transcript__list'); if (l) l.focus(); return }
  if (rowIds.value.length) focusActive()
  else focusFallback()
}
defineExpose({ focus, undo: () => doUndo(false, false), redo: () => doUndo(true, false) })

// Lista de solo lectura: datos por fragmento
const itemFlags = (s) => {
  const x = tx.value
  const out = []
  if (s.corrected !== null) out.push(['corrected', 'pencil', t('transcript.flags.corrected')])
  const eng = x.resolve(s.engineSpeaker)
  if (s.speaker !== null && s.engineSpeaker !== null && x.speakerOf(s) !== eng) out.push(['speaker', 'users', t('transcript.flags.speaker', { speaker: speakerLabel(eng) })])
  if (s.removed) out.push(['removed', 'trash', t('transcript.flags.removed')])
  const uses = x.usesOf(s.id)
  if (uses.length) {
    out.push(['used', 'text-cursor-input', t('transcript.flags.used', { targets: [...new Set(uses.map((u) => (u.target && u.target.label) || ''))].filter(Boolean).join(', ') })])
    if (uses.some((u) => u.sources && Object.prototype.hasOwnProperty.call(u.sources, s.id) && (s.removed || u.sources[s.id] !== x.textOf(s)))) out.push(['stale', 'triangle-alert', t('transcript.flags.stale')])
  }
  return out
}
const itemClass = (s) => ['g-transcript__item', { 'is-failed': s.failed, 'is-corrected': s.corrected !== null, 'is-removed': s.removed }]
</script>

<template>
  <div
    ref="root"
    v-bind="rootAttrs"
    :id="rootId"
    class="g-transcript"
    :data-mode="dataMode"
    :data-compact="compact ? '' : undefined"
    :data-narrow="narrow ? '' : undefined"
    :tabindex="empty ? -1 : undefined"
  >
    <p v-if="tx && conv && !readMode && !diarization" class="g-transcript__note">{{ t('transcript.noDiarization') }}</p>
    <p v-if="empty" class="g-transcript__empty">{{ t('transcript.empty') }}</p>

    <!-- Solo lectura: lista simple desplazable (§22.3) -->
    <div v-else-if="readMode" class="g-transcript__scroll" :style="maxHeight ? { '--_max-height': maxHeight } : undefined">
      <ol class="g-transcript__list" tabindex="0" :aria-labelledby="labelledby" :aria-label="labelledby ? undefined : label">
        <template v-for="r in rows" :key="r.id">
          <li v-if="r.partial" class="g-transcript__item is-partial">
            <time class="g-transcript__time">{{ partialTime }}</time>
            <span v-if="speakerCol" class="g-transcript__speaker"><span :class="['g-transcript__mark', { 'is-unassigned': !tx.resolve(tx.partial.speaker) }]" :data-cat="cat(tx.resolve(tx.partial.speaker))" aria-hidden="true">{{ tx.resolve(tx.partial.speaker) ? tx.letter(tx.resolve(tx.partial.speaker)) : '' }}</span>{{ speakerLabel(tx.resolve(tx.partial.speaker)) }}</span>
            <span class="g-transcript__text"><span class="g-transcript__sr">{{ withSpace(t('transcript.partialPrefix')) }}</span>{{ tx.partial.text }}</span>
            <span class="g-transcript__flags"><span class="g-transcript__flag g-transcript__flag--partial">{{ t('transcript.partialFlag') }}</span></span>
          </li>
          <li v-else :class="itemClass(r)">
            <time class="g-transcript__time" :datetime="`PT${Math.floor(r.t0 / 1000)}S`">{{ r.failed ? `${formatTime(r.t0)}–${formatTime(r.t1)}` : formatTime(r.t0) }}</time>
            <span v-if="speakerCol && !r.failed" class="g-transcript__speaker"><span :class="['g-transcript__mark', { 'is-unassigned': !tx.speakerOf(r) }]" :data-cat="cat(tx.speakerOf(r))" aria-hidden="true">{{ tx.speakerOf(r) ? tx.letter(tx.speakerOf(r)) : '' }}</span>{{ speakerLabel(tx.speakerOf(r)) }}</span>
            <span v-if="!r.failed" class="g-transcript__text">{{ tx.textOf(r) }}</span>
            <span class="g-transcript__flags"><span v-if="r.failed" class="g-transcript__flag g-transcript__flag--failed"><GIcon name="triangle-alert" />{{ t('transcript.failed', { range: `${formatTime(r.t0)}–${formatTime(r.t1)}` }) }}</span><span v-for="f in (r.failed ? [] : itemFlags(r))" :key="f[0]" :class="['g-transcript__flag', `g-transcript__flag--${f[0]}`]"><GIcon :name="f[1]" />{{ f[2] }}</span></span>
          </li>
        </template>
      </ol>
    </div>

    <!-- Editable y solo selección: rejilla (APG data grid) -->
    <template v-else>
      <div class="g-transcript__bar" role="group" :aria-label="t('transcript.bar.label')">
        <template v-if="selectable">
          <GCheckbox class="g-transcript__all" :field="false" :id="`${rootId}-all`" :model-value="allState.checked" :indeterminate="allState.mixed" :label="t('transcript.bar.selectAll')" @update:model-value="selectAll" />
          <span class="g-transcript__count">{{ selCount ? t('transcript.bar.count', { count: selCount }) : t('transcript.bar.countNone') }}</span>
        </template>
        <template v-if="selectable && editable">
          <GBtn
            v-if="conv"
            size="sm"
            variant="ghost"
            color="neutral"
            data-bar="assign"
            aria-haspopup="menu"
            :aria-expanded="menu.open && menu.kind === 'assign' ? 'true' : 'false'"
            :aria-controls="menu.open && menu.kind === 'assign' ? `${menuId}-list` : undefined"
            :id="menu.kind === 'assign' ? `${menuId}-trigger` : undefined"
            :aria-disabled="selCount ? undefined : 'true'"
            @click="openAssign"
          ><template #prepend><GIcon name="users" /></template>{{ t('transcript.bar.assign') }}</GBtn>
          <GBtn size="sm" variant="ghost" color="neutral" :aria-disabled="selCount ? undefined : 'true'" @click="selCount && removeOrRestore(selectionIds())"><template #prepend><GIcon :name="allRemoved ? 'rotate-ccw' : 'trash'" /></template>{{ allRemoved ? t('transcript.bar.restore') : t('transcript.bar.remove') }}</GBtn>
        </template>
        <template v-if="editable">
          <GBtn size="sm" variant="ghost" color="neutral" :aria-keyshortcuts="keys.undo" :aria-describedby="`${rootId}-undo-d`" :aria-disabled="tx && tx.canUndo ? undefined : 'true'" @click="doUndo(false, false)"><template #prepend><GIcon name="undo-2" class="g-icon--flip-rtl" /></template>{{ t('transcript.bar.undo') }}</GBtn>
          <span :id="`${rootId}-undo-d`" class="g-transcript__sr">{{ undoDesc }}</span>
          <GBtn size="sm" variant="ghost" color="neutral" :aria-keyshortcuts="keys.redo" :aria-describedby="`${rootId}-redo-d`" :aria-disabled="tx && tx.canRedo ? undefined : 'true'" @click="doUndo(true, false)"><template #prepend><GIcon name="redo-2" class="g-icon--flip-rtl" /></template>{{ t('transcript.bar.redo') }}</GBtn>
          <span :id="`${rootId}-redo-d`" class="g-transcript__sr">{{ redoDesc }}</span>
        </template>
        <template v-if="!narrow">
          <GMenu v-if="copy" v-model="barMenus.copy" :items="copyItems" :label="t('transcript.bar.copy')" :id="`${rootId}-copy`" @select="onCopySelect">
            <template #trigger="{ attrs: a }"><GBtn v-bind="triggerAttrs(a)" size="sm" variant="ghost" color="neutral"><template #prepend><GIcon name="copy" /></template>{{ t('transcript.bar.copy') }}</GBtn></template>
          </GMenu>
          <GBtn size="sm" variant="ghost" color="neutral" :aria-pressed="String(changes)" @click="toggleChanges"><template #prepend><GIcon name="git-compare" /></template>{{ t('transcript.bar.changes') }}</GBtn>
          <GBtn v-if="speakersAvailable" size="sm" variant="ghost" color="neutral" :aria-expanded="String(speakersOpen)" :aria-controls="`${rootId}-speakers`" @click="openSpeakers(false)"><template #prepend><GIcon name="users" /></template>{{ t('transcript.bar.speakers') }}</GBtn>
        </template>
        <GMenu v-else v-model="barMenus.more" :items="moreItems" :label="t('transcript.bar.more')" align="end" :id="`${rootId}-more`" @select="onMoreSelect">
          <template #trigger="{ attrs: a }"><GBtn v-bind="triggerAttrs(a)" class="g-transcript__more" size="sm" variant="ghost" color="neutral">{{ t('transcript.bar.more') }}<template #append><GIcon name="chevron-down" /></template></GBtn></template>
        </GMenu>
      </div>

      <div ref="scroller" class="g-transcript__scroll" :style="maxHeight ? { '--_max-height': maxHeight } : undefined" @scroll.passive="onScroll">
        <div
          ref="grid"
          class="g-transcript__grid"
          role="grid"
          :aria-labelledby="labelledby"
          :aria-label="labelledby ? undefined : label"
          :aria-describedby="kbdId"
          :aria-multiselectable="selectable ? 'true' : undefined"
          @keydown="onGridKeydown"
          @focusin="onFocusin"
          @focusout="onFocusout"
          @pointerdown="onPointerdown"
          @dblclick="onDblclick"
          @copy="onCopy"
        >
          <div class="g-transcript__head" role="rowgroup">
            <div role="row"><span v-for="c in cols" :key="c" role="columnheader">{{ t(`transcript.cols.${c}`) }}</span></div>
          </div>
          <div class="g-transcript__body" role="rowgroup">
            <TranscriptRow
              v-for="r in rows"
              :key="r.id"
              :seg="r.partial ? null : r"
              :part="r.partial ? tx.partial : null"
              :time="r.partial ? partialTime : formatTime(r.t0)"
              :ctx="ctx"
              :select="selectable"
              :speaker-col="speakerCol"
              :active="r.id === activeId ? activeCol : null"
              :selected="shown.has(r.id)"
              :editing="editing === r.id"
              :edit-text="editing === r.id ? editText : ''"
              :orig="changes || origOpen.has(r.id)"
              :menu="menu.id === r.id ? menu.kind : null"
            />
          </div>
        </div>
      </div>
      <GBtn v-if="newer" class="g-transcript__newer" size="sm" variant="outline" color="neutral" @click="goToEnd"><template #prepend><GIcon name="arrow-down" /></template>{{ t('transcript.newer', { count: newer }) }}</GBtn>
      <p :id="kbdId" class="g-transcript__kbd" :hidden="compact ? true : undefined">{{ t('transcript.keyboard') }}</p>
      <TranscriptSpeakers v-if="speakersAvailable" ref="speakersRef" :ctx="ctx" :open="speakersOpen" :level="headingLevel" />
      <TranscriptInsert v-if="hasTargets && !compact" :ctx="ctx" :level="headingLevel" />
      <GMenu v-model="menu.open" :id="menuId" :items="menuItems" :label="menuLabel" align="end" close-on-select="always" @select="onMenuSelect" @closed="onMenuClosed">
        <template #trigger />
      </GMenu>
    </template>
    <div v-if="!hostChannels" class="g-transcript__live" role="status" aria-live="polite" aria-atomic="true">{{ live.polite }}</div>
  </div>
</template>
