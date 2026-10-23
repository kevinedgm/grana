// GbGuestForm · el motor que comparten las tres variantes (dueño: bruno; guest-form.md «Anatomía», «Pasos (02)», «Eventos»,
// avisos C1 a C7, K1 a K3, G1 a G8). Grana presenta y emite intención (form.md): GForm no valida (#157), así que el bloque
// calcula los errores como el navegador (vacío con `required` → labels.required con {label}; mal formado, leído del
// ValidityState del control al escribir y al enviar → labels.invalid) y se los da a GForm por `errors`, que decide cuándo
// enseñarlos («castigar tarde»). Al enviar con errores, `showErrors()` y ningún `submit`. Los `errors` de la aplicación
// ganan. Lo que ya dijo la consulta no se vuelve a pedir: el grupo arranca con `query.party` (§15 regla 3).
//   Consentimientos (#880): en un GFieldGroup con legend = labels.consents (G7 sin él); con `policy` y sin `link`, el
//   enlace #{policy} con `linkLabel` (G8 sin él). Sin `groups` (#881), los campos van sin GFormSection (`bare`).
//   02 · Por pasos: un grupo por paso y los consentimientos como último paso, rotulado con labels.consents (los demás
//   `hidden`, montados: sus datos van en el envío). GForm solo conoce los
//   errores de los pasos hasta el actual, así «Siguiente» revela y enfoca los del paso; sin errores, avanza y enfoca el
//   primer control del paso nuevo (por el id que el bloque da a cada campo; nunca el título, DOM interno, §1 regla 2).
import { computed, getCurrentInstance, nextTick, ref, useId, watch } from 'vue'
import { checkQuery, fill, useLocale, useQueryLine } from '../common/booking.js'
import { entries, useItems } from '../common/list.js'
import { has } from '../common/text.js'
import { MAX_FIELDS, TYPES } from './props.js'

export function useGuestForm(props, emit, warn, variant, slots) {
  const uid = useId()
  const locale = useLocale(props)
  const L = computed(() => props.labels || {})
  // 03 dice lo pedido arriba (K2 si faltan partyRows o labels.query); 01 y 02 solo toman de la consulta el grupo (K1)
  const queryLine = variant === '03' ? useQueryLine(props, warn, { locale }) : computed(() => null)
  const query = computed(() => checkQuery(props.query, warn))

  // ---------- Campos y grupos ----------
  const list = useItems(() => props.fields, { required: ['name', 'label'], what: 'fields', range: [1, MAX_FIELDS], warn })
  const fields = computed(() => list.value.map((e) => {
    const f = e.item
    let type = f.type === undefined || f.type === null ? 'text' : f.type
    if (!TYPES.includes(type)) {
      try { if (process.env.NODE_ENV !== 'production') warn(`G1:${f.name}`, `fields «${f.name}» con type «${f.type}» fuera de lista: se pinta como text (G1).`) } catch {}
      type = 'text'
    }
    try { if (process.env.NODE_ENV !== 'production' && (type === 'email' || type === 'tel') && !has(f.autocomplete)) warn(`G2:${f.name}`, `fields «${f.name}» (${type}) sin autocomplete: el teléfono no lo rellena solo, 1.3.5 (G2).`) } catch {}
    return { key: e.key, field: f, name: f.name, type, id: `${uid}-f${e.index}`, hint: [f.hint, f.why].filter(has).join(' ') || undefined }
  }))
  const byName = computed(() => new Map(fields.value.map((f) => [f.name, f])))
  const consents = computed(() => entries(props.consents, ['name', 'label'], 'consents', warn).map((e) => {
    const c = e.item
    // El enlace de la política (#880): `link` tal cual; con `policy` y sin `link`, el ancla de GbPolicies con `linkLabel`
    let link = c.link && has(c.link.label) && has(c.link.href) ? c.link : null
    if (!link && has(c.policy)) {
      if (has(c.linkLabel)) link = { label: c.linkLabel, href: `#${c.policy}` }
      else {
        try { if (process.env.NODE_ENV !== 'production') warn(`G8:${c.name}`, `consents «${c.name}» con policy y sin link ni linkLabel: no se pinta el enlace a la política (G8).`) } catch {}
      }
    }
    return { ...e, link, id: `${uid}-c${e.index}` }
  }))
  const consentsOn = computed(() => Boolean(consents.value.length || (slots && slots.consents)))
  const consentsTitle = computed(() => {
    const t = L.value.consents
    try { if (process.env.NODE_ENV !== 'production' && consentsOn.value && !has(t)) warn('G7', 'hay consentimientos y falta labels.consents (título del grupo y, en 02, del último paso): el grupo va sin legend (G7).') } catch {}
    return has(t) ? t : undefined
  })
  const consentNames = computed(() => new Set(consents.value.map((c) => c.item.name)))

  /** Filas: los campos con el mismo `row` comparten GFormRow; los demás, uno por fila. */
  const toRows = (fs) => {
    const rows = []
    for (const f of fs) {
      const r = has(f.field.row) ? rows.find((x) => x.row === f.field.row) : null
      if (r) r.fields.push(f)
      else rows.push({ key: f.key, row: has(f.field.row) ? f.field.row : null, fields: [f] })
    }
    return rows
  }
  /** Grupos con sus filas. Sin `groups`, uno sin GFormSection (`bare`, #881: el título es el de la sección y no se repite;
   *  en 02, el rótulo del paso); los campos sin grupo conocido van al final (G5). */
  const groups = computed(() => {
    const defined = entries(props.groups, ['id', 'title'], 'groups', warn)
    if (!defined.length) return { list: [{ id: '', title: props.title, description: undefined, bare: true, fields: fields.value, rows: toRows(fields.value) }], rest: [] }
    const out = defined.map((g) => ({ id: String(g.item.id), title: g.item.title, description: has(g.item.description) ? g.item.description : undefined, fields: [] }))
    const rest = []
    for (const f of fields.value) {
      const g = out.find((x) => has(f.field.group) && x.id === String(f.field.group))
      if (g) g.fields.push(f)
      else {
        try { if (process.env.NODE_ENV !== 'production' && has(f.field.group)) warn(`G5:${f.name}`, `fields «${f.name}» con group «${f.field.group}» que no está en groups: va a un grupo final sin título propio (G5).`) } catch {}
        rest.push(f)
      }
    }
    const kept = out.filter((g) => g.fields.length).map((g) => ({ ...g, rows: toRows(g.fields) }))
    if (!kept.length) return { list: [{ id: '', title: props.title, description: undefined, bare: true, fields: rest, rows: toRows(rest) }], rest: [] }
    return { list: kept, rest: toRows(rest) }
  })

  // ---------- Valores ----------
  const local = ref({})
  let first = true
  watch(() => props.values, (v) => {
    const src = v && typeof v === 'object' ? v : {}
    const out = {}
    for (const [k, x] of Object.entries(src)) {
      if (consentNames.value.has(k)) {
        try { if (process.env.NODE_ENV !== 'production' && first && (x === true || x === 'true' || x === 'on')) warn(`G3:${k}`, `values marca el consentimiento «${k}» al empezar: se ignora, el consentimiento no se da por adelantado (G3).`) } catch {}
        continue
      }
      if (x !== undefined && x !== null) out[k] = String(x)
    }
    local.value = out
    first = false
  }, { immediate: true })
  const valueOf = (name) => (local.value[name] === undefined ? '' : local.value[name])
  function setValue(name, v) {
    local.value = { ...local.value, [name]: v === undefined || v === null ? '' : String(v) }
    emit('update:values', { ...local.value })
  }
  const consentState = ref({})
  const setConsent = (name, v) => { consentState.value = { ...consentState.value, [name]: Boolean(v) } }

  // ---------- El grupo (lo ya dicho por la consulta) ----------
  const partyOn = computed(() => {
    const p = props.party
    if (!p || typeof p !== 'object' || !has(p.label)) return false
    if (!Array.isArray(props.partyRows) || !props.partyRows.length) {
      try { if (process.env.NODE_ENV !== 'production') warn('G4', 'party sin partyRows: el campo del grupo no se pinta (G4).') } catch {}
      return false
    }
    return true
  })
  const partyId = `${uid}-party`
  const partyLocal = ref(null)
  watch(query, (q) => { partyLocal.value = q && q.party ? { ...q.party } : null }, { immediate: true })
  const partyValue = computed(() => partyLocal.value || {})
  const setParty = (v) => { partyLocal.value = v && typeof v === 'object' ? { ...v } : null }

  // ---------- Errores ----------
  const invalid = ref({}) // name → true si el control dijo typeMismatch/patternMismatch
  const native = ref({}) // name → validationMessage del navegador (respaldo sin labels, como #839)
  function message(f, kind) {
    const own = f.field.messages && f.field.messages[kind]
    if (has(own)) return own
    const t = L.value[kind]
    if (has(t)) return fill(t, { label: f.field.label })
    try { if (process.env.NODE_ENV !== 'production') warn(`C5:${kind}`, `falta labels.${kind} («${kind === 'required' ? 'Escribe {label}' : 'Revisa {label}'}»): el mensaje sale con el texto del navegador (C5).`) } catch {}
    return native.value[f.name] || ''
  }
  const fieldErrors = computed(() => {
    const out = {}
    for (const f of fields.value) {
      const v = valueOf(f.name).trim()
      const m = f.field.required && !v ? message(f, 'required') : v && invalid.value[f.name] ? message(f, 'invalid') : ''
      if (m) out[f.name] = m
    }
    for (const c of consents.value) {
      if (!c.item.required || consentState.value[c.item.name]) continue
      const t = L.value.consent
      if (has(t)) out[c.item.name] = t
      else {
        try { if (process.env.NODE_ENV !== 'production') warn('C5:consent', 'hay un consentimiento required y falta labels.consent («Marca esta casilla para continuar»): sin mensaje (C5).') } catch {}
        if (native.value[c.item.name]) out[c.item.name] = native.value[c.item.name]
      }
    }
    // Los de la aplicación (servidor) ganan
    const app = props.errors && typeof props.errors === 'object' ? props.errors : {}
    for (const [k, m] of Object.entries(app)) if (has(m)) out[k] = m
    return out
  })
  function check(el) {
    if (!el || !el.name || !el.validity || el.type === 'hidden') return true
    const v = el.validity
    invalid.value = { ...invalid.value, [el.name]: Boolean(v.typeMismatch || v.patternMismatch) }
    native.value = { ...native.value, [el.name]: v.valid ? '' : el.validationMessage || '' }
    return v.valid
  }
  const onInput = (event) => { check(event && event.target) }

  // ---------- Pasos (02) ----------
  const stepGroups = computed(() => groups.value.list)
  // Los consentimientos son el último paso (#880), con su id propio
  const consentStep = computed(() => (consentsOn.value ? stepGroups.value.length : -1))
  const stepIds = computed(() => {
    const ids = stepGroups.value.map((g, i) => g.id || `paso-${i + 1}`)
    if (consentsOn.value) ids.push(ids.includes('consents') ? `consents-${uid}` : 'consents')
    return ids
  })
  const localStep = ref(null)
  const current = computed(() => {
    const s = props.step !== undefined ? props.step : localStep.value
    return stepIds.value.includes(s) ? s : stepIds.value[0]
  })
  const index = computed(() => Math.max(stepIds.value.indexOf(current.value), 0))
  const last = computed(() => index.value === stepIds.value.length - 1)
  const steps = computed(() => {
    const out = stepGroups.value.map((g, i) => ({ id: stepIds.value[i], label: g.title, description: g.description }))
    if (consentsOn.value) out.push({ id: stepIds.value[consentStep.value], label: consentsTitle.value || '' })
    return out
  })
  const groupOf = (name) => {
    const i = stepGroups.value.findIndex((g) => g.fields.some((f) => f.name === name))
    if (i >= 0) return i
    if (consentsOn.value && consents.value.some((c) => c.item.name === name)) return consentStep.value
    // El grupo final (G5) va con el último grupo y el grupo de personas con el primer paso
    if (name === (props.party && props.party.name)) return 0
    return stepGroups.value.length - 1
  }
  /** Los errores que conoce GForm: en 02, solo los de los pasos hasta el actual. */
  const formErrors = computed(() => {
    if (variant !== '02') return fieldErrors.value
    const out = {}
    for (const [k, m] of Object.entries(fieldErrors.value)) if (groupOf(k) <= index.value) out[k] = m
    return out
  })
  const form = ref(null)
  function focusFirst(i) {
    const g = stepGroups.value[i]
    const id = i === consentStep.value ? (consents.value[0] ? consents.value[0].id : null) : i === 0 && partyOn.value ? partyId : g && g.fields[0] ? g.fields[0].id : null
    const el = id && typeof document !== 'undefined' ? document.getElementById(id) : null
    if (el && typeof el.focus === 'function') el.focus()
  }
  async function goTo(i, focus = true) {
    const id = stepIds.value[i]
    if (id === undefined) return
    localStep.value = id
    emit('update:step', id)
    if (!focus) return
    await nextTick()
    focusFirst(i)
  }
  /** «Siguiente»: comprueba solo el paso (los controles del grupo en el DOM y sus errores); con errores, los revela y enfoca. */
  async function next(event) {
    const g = stepGroups.value[index.value]
    if (!g) return
    const f = event && event.currentTarget && event.currentTarget.form
    if (f && f.elements) for (const el of f.elements) if (g.fields.some((x) => x.name === el.name)) check(el)
    const bad = g.fields.some((x) => fieldErrors.value[x.name])
    if (bad) {
      await nextTick()
      if (!form.value) return
      // showErrors lleva el foco al resumen (form.md); «Siguiente» lo lleva al primer campo con error del paso
      await form.value.showErrors()
      await nextTick()
      await form.value.focusFirstError()
      return
    }
    goTo(index.value + 1)
  }
  const back = () => goTo(index.value - 1)
  // Un error (de la aplicación) en otro paso: al enviar, lleva a ese paso y a su primer campo con error
  async function onInvalid({ errors }) {
    if (variant !== '02' || !errors || !errors.length) return
    const i = groupOf(errors[0].name)
    if (i === index.value) return
    await goTo(i, false)
    await nextTick()
    if (form.value) form.value.focusFirstError()
  }

  // ---------- Envío ----------
  try {
    if (process.env.NODE_ENV !== 'production') {
      const inst = getCurrentInstance()
      const vp = (inst && inst.vnode.props) || {}
      if (!vp.onSubmit && !vp.onSubmitOnce) warn('G6', 'nadie escucha `submit`: los datos no irán a ninguna parte (G6).')
    }
  } catch {}
  async function onSubmit({ event, data }) {
    // Respaldo del navegador: lo que GForm no sabía (sin labels, o un formato que no se escribió) se revela y no se envía
    const f = event && event.target
    let ok = true
    if (f && f.elements) for (const el of f.elements) if (!check(el)) ok = false
    if (!ok || Object.keys(fieldErrors.value).length) {
      await nextTick()
      if (form.value) form.value.showErrors()
      return
    }
    const values = {}
    for (const x of fields.value) values[x.name] = valueOf(x.name).trim()
    const consentsOut = {}
    for (const c of consents.value) consentsOut[c.item.name] = Boolean(consentState.value[c.item.name])
    const party = partyOn.value && partyLocal.value ? { ...partyLocal.value } : null
    const q = query.value ? { ...query.value, party: party || query.value.party } : null
    emit('submit', { event, data, values, party, consents: consentsOut, query: q })
  }
  // Error de la aplicación (servidor): se revela en el acto (form.md «Envío» paso 6)
  watch(() => [props.errors, props.error], async () => {
    const any = (props.errors && Object.values(props.errors).some(has)) || has(props.error)
    if (!any) return
    await nextTick()
    if (form.value) form.value.showErrors()
  }, { immediate: true, deep: true })

  // ---------- Resumen de errores: con `error` general, la lista propia (los del formulario y el general al final) ----------
  const summaryErrors = computed(() => {
    if (!has(props.error)) return undefined
    const idOf = (name) => {
      const f = byName.value.get(name)
      if (f) return f.id
      const c = consents.value.find((x) => x.item.name === name)
      return c ? c.id : undefined
    }
    return [...Object.entries(formErrors.value).map(([name, m]) => ({ name, id: idOf(name), message: m })), { message: props.error }]
  })
  const busyText = computed(() => {
    const t = L.value.busy
    try { if (process.env.NODE_ENV !== 'production' && props.busy && !has(t)) warn('C5:busy', 'busy sin labels.busy: el botón carga sin anunciarlo (C5).') } catch {}
    return has(t) ? t : undefined
  })
  const stepLabels = computed(() => {
    try { if (process.env.NODE_ENV !== 'production' && variant === '02' && stepIds.value.length > 1 && (!has(L.value.next) || !has(L.value.back))) warn('C5:steps', 'por pasos y faltan labels.next o labels.back: los botones van sin texto (C5).') } catch {}
    return { next: L.value.next || '', back: L.value.back || '' }
  })

  return {
    uid, locale, L, queryLine, query, fields, groups, consents, consentsOn, consentsTitle, consentStep, valueOf, setValue, consentState, setConsent,
    partyOn, partyId, partyValue, setParty, formErrors, onInput, onSubmit, onInvalid, form,
    steps, stepIds, current, index, last, next, back, goTo, summaryErrors, busyText, stepLabels
  }
}
