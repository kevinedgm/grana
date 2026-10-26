// El motor de campos de Checkout (dueño: bruno; checkout.md «Anatomía», guest-form.md «Anatomía», «Validación»,
// «Consentimientos»). Es la COPIA del motor de Guest form que prevé _comun.md §32: llevado a common/ y compartido, el trozo
// común hacía pasar a GbGuestForm03 de su tope (7 328 B frente a 7 168, #887), así que Guest form conserva su motor original
// (GbGuestForm/useGuestForm.js, GuestForm.js) y este archivo, con el mismo comportamiento y los mismos avisos, lo usa solo
// Checkout. Interno del paquete: no se exporta. Sin @grana/vue/booking (Ecommerce no carga Booking, §34).
//   - `fieldOf` (G1, G2): un campo de la lista con su tipo cerrado, su id y su ayuda (`hint` + `why`).
//   - `consentOf` (G8): un consentimiento con el enlace de su política (`link`, o `#{policy}` con `linkLabel`).
//   - `toRows`: los campos con el mismo `row` comparten GFormRow.
//   - `useFieldValues` (G3): los valores que se escriben (v-model:values); un consentimiento nunca llega marcado.
//   - `useFieldErrors`: los errores como el navegador (vacío con `required` → labels.required/choose con {label}; mal
//     formado, leído del ValidityState del control → labels.invalid); los de la aplicación ganan.
//   - `fieldControl` y `consentGroup`: el control de cada tipo y el grupo de casillas (GFieldGroup › GCheckbox, nunca
//     marcadas; el enlace de la política fuera de la etiqueta).
// Avisos con la guarda de #653 en el sitio de cada texto.
import { computed, h, ref, watch } from 'vue'
import { GCheckbox, GDatePicker, GFieldGroup, GFormLayout, GInput, GSelect, GStack, GTextarea } from '@grana/vue'
import GbLink from './link.js'
import { fill } from './locale.js'
import { has } from './text.js'

/** Tipos de campo (lista cerrada, G1). */
export const FIELD_TYPES = ['text', 'email', 'tel', 'textarea', 'select', 'date']

/** Un elemento de `entries` hecho campo: `{ key, field, name, type, id, hint }`. G1 (tipo fuera de lista → text), G2. */
export function fieldOf(e, id, warn, types = FIELD_TYPES) {
  const f = e.item
  let type = f.type === undefined || f.type === null ? 'text' : f.type
  if (!types.includes(type)) {
    try { if (process.env.NODE_ENV !== 'production') warn(`G1:${f.name}`, `fields «${f.name}» con type «${f.type}» fuera de lista: se pinta como text (G1).`) } catch {}
    type = 'text'
  }
  try { if (process.env.NODE_ENV !== 'production' && (type === 'email' || type === 'tel') && !has(f.autocomplete)) warn(`G2:${f.name}`, `fields «${f.name}» (${type}) sin autocomplete: el teléfono no lo rellena solo, 1.3.5 (G2).`) } catch {}
  return { key: e.key, field: f, name: f.name, type, id, hint: [f.hint, f.why].filter(has).join(' ') || undefined }
}

/** Un consentimiento con el enlace de su política (#880): `link` tal cual; con `policy` y sin `link`, `#{policy}` (G8). */
export function consentOf(e, id, warn) {
  const c = e.item
  let link = c.link && has(c.link.label) && has(c.link.href) ? c.link : null
  if (!link && has(c.policy)) {
    if (has(c.linkLabel)) link = { label: c.linkLabel, href: `#${c.policy}` }
    else {
      try { if (process.env.NODE_ENV !== 'production') warn(`G8:${c.name}`, `consents «${c.name}» con policy y sin link ni linkLabel: no se pinta el enlace a la política (G8).`) } catch {}
    }
  }
  return { ...e, link, id }
}

/** Filas: los campos con el mismo `row` comparten GFormRow; los demás, uno por fila. */
export function toRows(fs) {
  const rows = []
  for (const f of fs) {
    const r = has(f.field.row) ? rows.find((x) => x.row === f.field.row) : null
    if (r) r.fields.push(f)
    else rows.push({ key: f.key, row: has(f.field.row) ? f.field.row : null, fields: [f] })
  }
  return rows
}

/** Los valores que se escriben (`values` → local; cada cambio emite `update:values`). G3: un consentimiento no llega marcado. */
export function useFieldValues(props, emit, consentNames, warn) {
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
  return { local, valueOf, setValue }
}

/**
 * Errores como el navegador (GForm no valida, #157). `fields` y `consents` son computed; `consentState` el ref de las
 * casillas; `L` el computed de labels; `appErrors` () => los de la aplicación (ganan). Mensajes: `messages` del campo ›
 * labels.required / invalid / choose con {label} › el del navegador (C5).
 */
export function useFieldErrors({ fields, consents, consentState, L, valueOf, appErrors, warn }) {
  const invalid = ref({}) // name → true si el control dijo typeMismatch/patternMismatch
  const native = ref({}) // name → validationMessage del navegador (respaldo sin labels, como #839)
  function message(f, kind) {
    const own = f.field.messages && f.field.messages[kind === 'choose' ? 'required' : kind]
    if (has(own)) return own
    const t = L.value[kind]
    if (has(t)) return fill(t, { label: f.field.label })
    try { if (process.env.NODE_ENV !== 'production') warn(`C5:${kind}`, `falta labels.${kind} («${kind === 'required' ? 'Escribe {label}' : kind === 'choose' ? 'Elige {label}' : 'Revisa {label}'}»): el mensaje sale con el texto del navegador (C5).`) } catch {}
    return native.value[f.name] || ''
  }
  const fieldErrors = computed(() => {
    const out = {}
    for (const f of fields.value) {
      const v = valueOf(f.name).trim()
      const m = f.field.required && !v ? message(f, f.type === 'choice' ? 'choose' : 'required') : v && invalid.value[f.name] ? message(f, 'invalid') : ''
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
    const app = appErrors()
    for (const [k, m] of Object.entries(app && typeof app === 'object' ? app : {})) if (has(m)) out[k] = m
    return out
  })
  function check(el) {
    if (!el || !el.name || !el.validity || el.type === 'hidden') return true
    const v = el.validity
    invalid.value = { ...invalid.value, [el.name]: Boolean(v.typeMismatch || v.patternMismatch) }
    native.value = { ...native.value, [el.name]: v.valid ? '' : el.validationMessage || '' }
    return v.valid
  }
  return { fieldErrors, check, onInput: (event) => { check(event && event.target) } }
}

/**
 * El control de un campo (o el slot `field-{name}` de escape). `custom(f, common, value, on)` pinta los tipos propios de
 * una sección (el `choice` de Checkout) o devuelve null.
 */
export function fieldControl(f, { value, set, error, slot, L, locale, custom }) {
  if (slot) return slot({ field: f.field, value, error, id: f.id })
  const common = { key: f.key, id: f.id, name: f.name, label: f.field.label, hint: f.hint, required: Boolean(f.field.required) }
  const on = (v) => set(f.name, v)
  const own = custom ? custom(f, common, value, on) : null
  if (own) return own
  if (f.type === 'textarea') return h(GTextarea, { ...common, placeholder: f.field.placeholder, autocomplete: f.field.autocomplete, modelValue: value, 'onUpdate:modelValue': on })
  if (f.type === 'select') return h(GSelect, { ...common, placeholder: f.field.placeholder, options: Array.isArray(f.field.options) ? f.field.options : [], modelValue: value || null, 'onUpdate:modelValue': on })
  if (f.type === 'date') return h(GDatePicker, { ...common, placeholder: f.field.placeholder, modelValue: value || null, labels: L.datePicker, locale, 'onUpdate:modelValue': on })
  return h(GInput, { ...common, type: f.type === 'text' ? undefined : f.type, autocomplete: f.field.autocomplete, placeholder: f.field.placeholder, modelValue: value, 'onUpdate:modelValue': on })
}

/**
 * Los consentimientos: GFormLayout › GFieldGroup (legend = `title`, obligatorio si alguna casilla lo es: así solo la
 * opcional lleva su marca) › GStack › por consentimiento GStack › GCheckbox (nunca marcado al empezar) + el enlace de su
 * política fuera de la etiqueta (un enlace dentro del label cambiaría la casilla). `slot`: el de escape `consents`.
 */
export function consentGroup({ key = 'consents', list, state, set, title, slot, external, warn, onNavigate }) {
  // Un solo hijo en la fila del grupo (la pila): cada consentimiento en su línea
  const items = () => h(GStack, { gap: 'sm' }, () => (slot ? slot() : list.map(({ item, key: k, id, link }) => h(GStack, { key: k, gap: 'sm' }, () => [
    h(GCheckbox, { id, name: item.name, label: item.label, required: Boolean(item.required), modelValue: Boolean(state[item.name]), 'onUpdate:modelValue': (v) => set(item.name, v) }),
    link ? h(GbLink, { link, external, what: 'consents.link', warn, onNavigate }) : null
  ]))))
  return h(GFormLayout, { key }, () => h(GFieldGroup, { label: title, required: list.some((c) => c.item.required) }, items))
}
