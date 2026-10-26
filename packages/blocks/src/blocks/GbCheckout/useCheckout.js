// GbCheckout · el motor que comparten las tres variantes (dueño: bruno; checkout.md «Anatomía», avisos C5, C7, EC1, EC5,
// EC6, G1 a G8 del motor de Guest form salvo G5, CK1 a CK4). Un solo GForm para todos los pasos; los campos con el motor de Guest
// form (common/fields.js, §32) más el tipo `choice`. GForm no valida (#157): el bloque calcula los errores como el
// navegador y GForm los revela («castigar tarde»); solo conoce los de los pasos hasta el actual, más los de la aplicación.
//   - Enviar un paso (Intro o su botón, type="submit") comprueba SOLO sus campos; con errores, los revela y enfoca el
//     primero y no emite. Sin errores emite `submit` { event, step, data, values, consents, final, preventDefault(),
//     defaultPrevented }, síncrono: sin preventDefault() avanza al paso siguiente y enfoca su primer control (por el id que
//     el bloque da a cada campo; nunca el título de GFormSection, DOM interno); con él, espera a que la aplicación cambie
//     `step` y entonces enfoca igual.
//   - Volver («Atrás», «Cambiar», el GStepper hacia atrás) no valida ni borra: `values` se conserva (§27 regla 3).
//   - El paso de la aplicación (sin `fields`) es el slot `step-{id}`: el bloque no lee ni valida lo que hay dentro (EC6:
//     un campo de tarjeta en `fields` no se pinta). Un error de la aplicación lleva a su paso y a su campo.
import { computed, getCurrentInstance, nextTick, ref, useId, watch } from 'vue'
import { useLocale } from '../common/locale.js'
import { isCardField, shopRegion } from '../common/ecommerce.js'
import { consentOf, fieldOf, toRows, useFieldErrors, useFieldValues } from '../common/fields.js'
import { entries } from '../common/list.js'
import { labelOf, listText } from '../common/order.js'
import { has } from '../common/text.js'
import { STEPS_RANGE, TYPES } from './props.js'

export function useCheckout(props, emit, warn, variant, slots) {
  const uid = useId()
  const locale = useLocale(props)
  const L = computed(() => props.labels || {})

  // ---------- Pasos ----------
  const steps = computed(() => {
    const list = Array.isArray(props.steps) ? props.steps : []
    try { if (process.env.NODE_ENV !== 'production' && (list.length < STEPS_RANGE[0] || list.length > STEPS_RANGE[1])) warn('C7', `steps con ${list.length} pasos; se recomiendan de ${STEPS_RANGE[0]} a ${STEPS_RANGE[1]}: se pintan todos (C7).`) } catch {}
    const out = []
    const ids = new Set()
    list.forEach((s, si) => {
      if (!s || typeof s !== 'object' || !has(s.id) || ids.has(s.id)) {
        try { if (process.env.NODE_ENV !== 'production') warn(`EC5:steps:${si}`, `steps[${si}] sin id (o repetido): el paso se omite (EC5).`) } catch {}
        return
      }
      if (!has(s.title) || !has(s.action)) {
        try { if (process.env.NODE_ENV !== 'production') warn(`C2:steps:${si}`, `steps[${si}] sin title o sin action: el paso se omite (C2).`) } catch {}
        return
      }
      ids.add(s.id)
      const app = !Array.isArray(s.fields) && !Array.isArray(s.consents)
      const fields = app ? [] : entries(s.fields, ['name', 'label'], `steps[${si}].fields`, warn).filter((e) => !isCardField(e.item, warn)).map((e) => fieldOf(e, `${uid}-s${si}f${e.index}`, warn, TYPES))
      const grouped = new Set()
      const groups = entries(s.groups, ['id', 'title'], `steps[${si}].groups`, warn).map((g) => {
        const names = Array.isArray(g.item.fields) ? g.item.fields : []
        try {
          if (process.env.NODE_ENV !== 'production') {
            const known = new Set((Array.isArray(s.fields) ? s.fields : []).map((f) => f && f.name))
            for (const n of names) if (!known.has(n)) warn(`CK4:${s.id}:${String(n)}`, `steps «${s.id}»: el grupo «${String(g.item.id)}» cita «${String(n)}», que no está en sus fields: se ignora (CK4).`)
          }
        } catch {}
        const fs = fields.filter((f) => names.includes(f.name))
        for (const f of fs) grouped.add(f.name)
        return { key: g.key, title: g.item.title, rows: toRows(fs) }
      }).filter((g) => g.rows.length)
      const rest = toRows(fields.filter((f) => !grouped.has(f.name)))
      const consents = entries(s.consents, ['name', 'label'], `steps[${si}].consents`, warn).map((e) => consentOf(e, `${uid}-s${si}c${e.index}`, warn))
      if (app) {
        try { if (process.env.NODE_ENV !== 'production' && !(slots && slots[`step-${s.id}`])) warn(`CK1:${s.id}`, `el paso «${s.id}» no tiene fields ni slot step-${s.id}: se pinta su título y su botón, sin contenido (CK1).`) } catch {}
      }
      out.push({ id: s.id, step: s, index: out.length, app, fields, groups, rest, consents, groupId: `${uid}-s${si}` })
    })
    return out
  })
  const fields = computed(() => steps.value.flatMap((s) => s.fields))
  const consents = computed(() => steps.value.flatMap((s) => s.consents))
  const consentNames = computed(() => new Set(consents.value.map((c) => c.item.name)))
  const consentsTitle = computed(() => {
    const t = L.value.consents
    try { if (process.env.NODE_ENV !== 'production' && consents.value.length && !has(t)) warn('G7', 'hay consentimientos y falta labels.consents: el grupo va sin legend (G7).') } catch {}
    return has(t) ? t : undefined
  })

  // ---------- Valores y errores (el motor de Guest form) ----------
  const { valueOf, setValue } = useFieldValues(props, emit, consentNames, warn)
  const consentState = ref({})
  const setConsent = (name, v) => { consentState.value = { ...consentState.value, [name]: Boolean(v) } }
  const { fieldErrors, check, onInput } = useFieldErrors({ fields, consents, consentState, L, valueOf, appErrors: () => props.errors, warn })

  // ---------- El paso actual ----------
  const localStep = ref(null)
  const current = computed(() => {
    const ids = steps.value.map((s) => s.id)
    const s = props.step !== undefined ? props.step : localStep.value
    if (s !== null && s !== undefined && !ids.includes(s)) {
      try { if (process.env.NODE_ENV !== 'production' && props.step !== undefined) warn('CK3', `step «${s}» no está en steps: se usa el primero (CK3).`) } catch {}
      return ids[0]
    }
    return s === null || s === undefined ? ids[0] : s
  })
  const index = computed(() => Math.max(steps.value.findIndex((s) => s.id === current.value), 0))
  const final = computed(() => index.value === steps.value.length - 1)
  const stepOf = (name) => {
    const i = steps.value.findIndex((s) => s.fields.some((f) => f.name === name) || s.consents.some((c) => c.item.name === name))
    return i < 0 ? index.value : i
  }
  const appErrors = () => Object.entries(props.errors && typeof props.errors === 'object' ? props.errors : {}).filter(([, m]) => has(m))
  /** Lo que conoce GForm: los errores de los pasos hasta el actual y todos los de la aplicación. */
  const formErrors = computed(() => {
    const out = {}
    for (const [k, m] of Object.entries(fieldErrors.value)) if (stepOf(k) <= index.value) out[k] = m
    for (const [k, m] of appErrors()) out[k] = m
    return out
  })

  // ---------- Foco y navegación ----------
  const form = ref(null)
  function focusFirst(i) {
    const s = steps.value[i]
    if (!s || typeof document === 'undefined') return
    const id = s.fields[0] ? s.fields[0].id : s.consents[0] ? s.consents[0].id : s.groupId
    const el = document.getElementById(id)
    if (el && typeof el.focus === 'function') el.focus()
  }
  let waiting = false
  async function goTo(i, focus = true) {
    const s = steps.value[i]
    if (!s) return
    localStep.value = s.id
    emit('update:step', s.id)
    if (!focus) return
    await nextTick()
    focusFirst(i)
  }
  // Con preventDefault(), el bloque espera a que la aplicación cambie `step` y entonces enfoca el primer control
  watch(() => props.step, async (v, old) => {
    if (!waiting || v === old) return
    waiting = false
    await nextTick()
    focusFirst(index.value)
  })
  const back = () => goTo(index.value - 1)
  /** El GStepper hacia atrás o «Cambiar»: vuelve sin validar ni borrar. */
  const change = (i) => { if (i < index.value) goTo(i) }

  // ---------- Envío por paso ----------
  try {
    if (process.env.NODE_ENV !== 'production') {
      const inst = getCurrentInstance()
      const vp = (inst && inst.vnode.props) || {}
      if (!vp.onSubmit && !vp.onSubmitOnce) warn('CK2', 'nadie escucha `submit`: nada puede pedir el pedido (CK2).')
    }
  } catch {}
  async function reveal() {
    await nextTick()
    if (!form.value) return
    await form.value.showErrors()
    await nextTick()
    await form.value.focusFirstError()
  }
  function onSubmit({ event, data }) {
    const s = steps.value[index.value]
    if (!s) return
    // Solo los controles del paso: el formato que el navegador no acepta (ValidityState) se revela y no se envía
    const f = event && event.target
    const names = new Set([...s.fields.map((x) => x.name), ...s.consents.map((c) => c.item.name)])
    if (f && f.elements) for (const el of f.elements) if (names.has(el.name)) check(el)
    if ([...names].some((n) => fieldErrors.value[n])) { reveal(); return }
    const values = {}
    for (const x of fields.value) values[x.name] = valueOf(x.name).trim()
    const consentsOut = {}
    for (const c of consents.value) consentsOut[c.item.name] = Boolean(consentState.value[c.item.name])
    const payload = {
      event, step: s.id, data, values, consents: consentsOut, final: final.value, defaultPrevented: false,
      preventDefault() { payload.defaultPrevented = true }
    }
    emit('submit', payload)
    if (payload.defaultPrevented) { waiting = true; return }
    if (!final.value) goTo(index.value + 1)
  }
  // Un error (de la aplicación) en otro paso: lleva a ese paso y a su primer campo con error
  async function onInvalid({ errors }) {
    if (!errors || !errors.length) return
    // GForm lleva el foco al resumen de errores; el envío de un paso lo lleva al primer campo con error (como «Siguiente»
    // de Guest form 02), en su paso si el error es de otro (de la aplicación)
    const i = stepOf(errors[0].name)
    if (i !== index.value) await goTo(i, false)
    await nextTick()
    await nextTick()
    if (form.value) form.value.focusFirstError()
  }
  watch(() => [props.errors, props.error], async () => {
    const list = appErrors()
    if (!list.length && !has(props.error)) return
    if (list.length) {
      const i = stepOf(list[0][0])
      if (i !== index.value) await goTo(i, false)
    }
    await reveal()
  }, { immediate: false, deep: true })

  // ---------- Resúmenes ----------
  const optionLabel = (f, v) => {
    const o = (Array.isArray(f.field.options) ? f.field.options : []).find((x) => x && String(x.value) === v)
    return o ? o.label : v
  }
  /** Lo hecho en un paso: `{ title, subtitle, facts, text }` (step.summary de la aplicación gana y va sin facts). */
  const summaryOf = (i) => {
    const s = steps.value[i]
    if (!s) return null
    if (has(s.step.summary)) return { title: s.step.title, subtitle: s.step.summary, facts: [], text: s.step.summary }
    const facts = s.fields.map((f) => ({ f, v: valueOf(f.name).trim() })).filter((x) => x.v).map(({ f, v }) => ({ label: f.field.label, value: f.type === 'select' || f.type === 'choice' ? optionLabel(f, v) : v }))
    return { title: s.step.title, subtitle: undefined, facts, text: listText(facts.map((x) => x.value), locale.value) }
  }
  const editName = (title) => labelOf(L.value.edit, 'step', title)

  // ---------- Resumen de errores, ocupado, textos ----------
  const summaryErrors = computed(() => {
    if (!has(props.error)) return undefined
    const idOf = (name) => {
      const f = fields.value.find((x) => x.name === name)
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
  try {
    if (process.env.NODE_ENV !== 'production') {
      const l = props.labels || {}
      for (const k of ['back', 'edit', 'order', 'total']) if (l[k] === undefined || l[k] === '') warn(`C5:${k}`, `falta labels.${k}: se pinta sin ese texto (C5).`)
      if ((props.steps || []).some((s) => s && Array.isArray(s.fields) && s.fields.some((f) => f && f.type === 'choice' && f.required)) && !has(l.choose)) warn('C5:choose', 'hay un choice obligatorio y falta labels.choose («Elige {label}»): el mensaje sale con el texto del navegador (C5).')
    }
  } catch {}

  // ---------- La región de precios (obligatoria, EC1) ----------
  const region = computed(() => shopRegion(props.prices, true, warn))

  return {
    uid, locale, L, steps, fields, consents, consentsTitle, valueOf, setValue, consentState, setConsent, fieldErrors, formErrors,
    onInput, onSubmit, onInvalid, form, current, index, final, goTo, back, change, summaryOf, editName, summaryErrors, busyText, region
  }
}
