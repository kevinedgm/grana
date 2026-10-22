<script setup>
// Playground de personalización: cada parámetro es una clave de grana.config.json (tokens.md §1)
// y el tema se deriva en el navegador con el mismo motor que la CLI (`buildTheme` de @grana/cli).
// La vista previa recibe el mapa completo de tokens --g-* del esquema elegido en su raíz: los
// componentes solo leen tokens, así que nada de esto toca su CSS. `density` es la prop de cada
// componente (es local por contrato, §4), no una clave del tema.
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useData } from 'vitepress'
import { buildTheme, DEFAULTS } from '@grana/cli'

const T = {
  es: {
    eyebrow: 'Herramienta',
    title: 'Playground de tema',
    lead: 'Cada control es una clave de grana.config.json. El tema se deriva aquí mismo con el motor OKLCH de @grana/cli, el mismo que usa tu proyecto, y los componentes reales cambian de forma en vivo.',
    panel: 'Parámetros del tema',
    preset: 'Punto de partida',
    custom: 'Personalizado',
    reset: 'Restablecer',
    color: 'Color',
    shape: 'Forma',
    space: 'Espacio',
    type: 'Tipografía',
    scheme: 'Esquema',
    colors: {
      brand: { label: 'Marca (brand)', unset: 'Sin valor: el de Grana.' },
      accent: { label: 'Acento (accent)', unset: 'Sin valor: se deriva de la marca.' },
      primary: { label: 'Acción principal (primary)', unset: 'Sin valor: igual que la marca. Es el relleno de GBtn color="brand".' }
    },
    pick: (name) => `Elegir ${name}`,
    clear: 'Quitar',
    clearAria: (name) => `Quitar ${name}`,
    badHex: 'Escribe un hex: #RGB o #RRGGBB.',
    neutrals: 'Neutros',
    neutralsHint: 'Teñidos con el tono de la marca o grises puros. Necesita marca.',
    tinted: 'Teñidos',
    pure: 'Puros',
    neutralsHue: 'Tono de los neutros',
    fromBrand: 'Marca',
    fromAccent: 'Acento',
    collision: 'Separar los semánticos si se parecen a la marca',
    radius: 'Radio (radius)',
    borderWidth: 'Grosor de borde (--g-border-width)',
    borderHint: 'Bordes de campos, botones con contorno, tarjetas y divisores. Va en overrides: no tiene clave propia.',
    focusWidth: 'Grosor del anillo de foco (--g-focus-width)',
    focusHint: 'El contrato pide al menos 2 px (WCAG 2.4.13).',
    focusError: 'Con 1 px el motor rechaza el tema: el foco dejaría de verse. La vista previa sigue con el último tema válido.',
    cssRejected: '/* El motor rechazó esta configuración: no se generó tokens.css. Revisa «Validación del motor». */',
    shapeLabel: 'Botones, chips e insignias',
    rounded: 'Redondeados',
    pill: 'Píldora',
    spaceLabel: 'Unidad de espacio (space)',
    density: 'Densidad de los controles',
    densities: { default: 'Normal', comfortable: 'Cómoda', compact: 'Compacta' },
    densityHint: 'Es la prop density de cada componente, no una clave del tema.',
    font: 'Fuente de la interfaz (font)',
    fontDisplay: 'Fuente de display (fontDisplay)',
    sameAsFont: 'Igual que la interfaz',
    fontSize: 'Tamaño base (fontSize)',
    typeScale: 'Escala de títulos (typeScale)',
    schemeView: 'Ver la vista previa en',
    light: 'Claro',
    dark: 'Oscuro',
    schemeHint: 'El motor deriva las dos variantes; aquí eliges cuál ver.',
    preview: 'Vista previa',
    previewNote: 'Pasa el puntero para ver el hover y usa Tab para el foco: son los componentes reales.',
    showFocus: 'Mostrar el foco',
    buttons: 'Botones',
    variants: 'Variantes y colores',
    sizes: 'Tamaños',
    states: 'Estados',
    normal: 'Normal',
    disabled: 'Deshabilitado',
    loading: 'Cargando',
    loadingText: 'Guardando',
    withIcon: 'Nuevo',
    next: 'Continuar',
    add: 'Añadir',
    colorNames: { brand: 'Marca', accent: 'Acento', neutral: 'Neutro', success: 'Éxito', warning: 'Aviso', danger: 'Peligro', info: 'Info' },
    fields: 'Campos',
    appearances: 'Apariencias',
    fieldStates: 'Estados',
    outline: 'Contorno (outline)',
    soft: 'Relleno (soft)',
    name: 'Nombre',
    namePh: 'Ana López',
    nameHint: 'Como aparece en tu identificación.',
    email: 'Correo',
    emailError: 'Falta la @ en el correo.',
    phone: 'Teléfono',
    phoneWarning: 'Parece corto: revisa la lada.',
    user: 'Usuario',
    userValid: 'Disponible.',
    readonly: 'Solo lectura',
    disabledField: 'Deshabilitado',
    loadingField: 'Comprobando',
    price: 'Precio',
    password: 'Contraseña',
    show: 'Mostrar contraseña',
    hide: 'Ocultar contraseña',
    required: 'Obligatorio',
    select: 'Selector (GSelect)',
    selectPh: 'Elige un plan',
    plans: ['Básico', 'Equipo', 'Empresa'],
    textarea: 'Notas (GTextarea)',
    notes: 'Entregar por la mañana.',
    number: 'Cantidad (GNumberField)',
    less: 'Una menos',
    more: 'Una más',
    units: 'piezas',
    context: 'En contexto',
    cardEyebrow: 'Pedido 1042',
    cardTitle: 'Datos de entrega',
    cardText: 'El texto de la página, los títulos y las superficies también leen los tokens del tema.',
    cancel: 'Cancelar',
    save: 'Guardar',
    specimen: 'Grana',
    export: 'Exportar',
    exportLead: 'Guarda la configuración y genera los tokens con la CLI, o copia directamente el CSS que el motor acaba de generar.',
    exportTabs: 'Formato de exportación',
    configTab: 'grana.config.json',
    cssTab: 'tokens.css',
    configHelp: 'Guárdala en la raíz del proyecto y ejecuta:',
    cssHelp: 'Impórtalo después de @grana/vue/style.css: va sin capa y gana siempre al tema por defecto.',
    copy: 'Copiar',
    download: 'Descargar',
    copyLink: 'Copiar enlace',
    copied: 'Copiado al portapapeles.',
    linkCopied: 'Enlace copiado al portapapeles.',
    copyFailed: 'No se pudo copiar: selecciona el texto y cópialo a mano.',
    codeLabel: (f) => `Contenido de ${f}`,
    empty: 'La configuración está vacía: es el tema por defecto de Grana.',
    checks: 'Validación del motor',
    ok: 'Sin avisos: los dos esquemas cumplen los mínimos de contraste.',
    error: 'Error',
    warning: 'Aviso',
    failed: 'El motor rechazó esta combinación; la vista previa conserva el último tema válido.'
  },
  en: {
    eyebrow: 'Tool',
    title: 'Theme playground',
    lead: 'Every control is a grana.config.json key. The theme is derived right here with the @grana/cli OKLCH engine, the same one your project uses, and real components change shape live.',
    panel: 'Theme parameters',
    preset: 'Starting point',
    custom: 'Custom',
    reset: 'Reset',
    color: 'Color',
    shape: 'Shape',
    space: 'Spacing',
    type: 'Typography',
    scheme: 'Scheme',
    colors: {
      brand: { label: 'Brand (brand)', unset: 'Unset: Grana’s own.' },
      accent: { label: 'Accent (accent)', unset: 'Unset: derived from the brand.' },
      primary: { label: 'Primary action (primary)', unset: 'Unset: same as the brand. It fills GBtn color="brand".' }
    },
    pick: (name) => `Pick ${name}`,
    clear: 'Remove',
    clearAria: (name) => `Remove ${name}`,
    badHex: 'Type a hex: #RGB or #RRGGBB.',
    neutrals: 'Neutrals',
    neutralsHint: 'Tinted with the brand hue or pure greys. Needs a brand.',
    tinted: 'Tinted',
    pure: 'Pure',
    neutralsHue: 'Neutrals hue',
    fromBrand: 'Brand',
    fromAccent: 'Accent',
    collision: 'Separate semantic colors that look like the brand',
    radius: 'Radius (radius)',
    borderWidth: 'Border width (--g-border-width)',
    borderHint: 'Field borders, outline buttons, cards and dividers. Goes in overrides: it has no key of its own.',
    focusWidth: 'Focus ring width (--g-focus-width)',
    focusHint: 'The contract asks for at least 2 px (WCAG 2.4.13).',
    focusError: 'At 1 px the engine rejects the theme: focus would stop being visible. The preview keeps the last valid theme.',
    cssRejected: '/* The engine rejected this config: no tokens.css was generated. See “Engine validation”. */',
    shapeLabel: 'Buttons, chips and badges',
    rounded: 'Rounded',
    pill: 'Pill',
    spaceLabel: 'Spacing unit (space)',
    density: 'Control density',
    densities: { default: 'Default', comfortable: 'Comfortable', compact: 'Compact' },
    densityHint: 'It is each component’s density prop, not a theme key.',
    font: 'UI font (font)',
    fontDisplay: 'Display font (fontDisplay)',
    sameAsFont: 'Same as the UI',
    fontSize: 'Base size (fontSize)',
    typeScale: 'Heading scale (typeScale)',
    schemeView: 'Show the preview in',
    light: 'Light',
    dark: 'Dark',
    schemeHint: 'The engine derives both; pick which one to look at.',
    preview: 'Preview',
    previewNote: 'Hover to see hover and press Tab for focus: these are the real components.',
    showFocus: 'Show focus',
    buttons: 'Buttons',
    variants: 'Variants and colors',
    sizes: 'Sizes',
    states: 'States',
    normal: 'Default',
    disabled: 'Disabled',
    loading: 'Loading',
    loadingText: 'Saving',
    withIcon: 'New',
    next: 'Continue',
    add: 'Add',
    colorNames: { brand: 'Brand', accent: 'Accent', neutral: 'Neutral', success: 'Success', warning: 'Warning', danger: 'Danger', info: 'Info' },
    fields: 'Fields',
    appearances: 'Appearances',
    fieldStates: 'States',
    outline: 'Outline',
    soft: 'Soft',
    name: 'Name',
    namePh: 'Ana López',
    nameHint: 'As it appears on your ID.',
    email: 'Email',
    emailError: 'The email is missing an @.',
    phone: 'Phone',
    phoneWarning: 'Looks short: check the area code.',
    user: 'Username',
    userValid: 'Available.',
    readonly: 'Read only',
    disabledField: 'Disabled',
    loadingField: 'Checking',
    price: 'Price',
    password: 'Password',
    show: 'Show password',
    hide: 'Hide password',
    required: 'Required',
    select: 'Select (GSelect)',
    selectPh: 'Choose a plan',
    plans: ['Basic', 'Team', 'Business'],
    textarea: 'Notes (GTextarea)',
    notes: 'Deliver in the morning.',
    number: 'Quantity (GNumberField)',
    less: 'One less',
    more: 'One more',
    units: 'pieces',
    context: 'In context',
    cardEyebrow: 'Order 1042',
    cardTitle: 'Delivery details',
    cardText: 'Page text, headings and surfaces read the theme tokens too.',
    cancel: 'Cancel',
    save: 'Save',
    specimen: 'Grana',
    export: 'Export',
    exportLead: 'Save the config and generate the tokens with the CLI, or copy the CSS the engine has just generated.',
    exportTabs: 'Export format',
    configTab: 'grana.config.json',
    cssTab: 'tokens.css',
    configHelp: 'Save it at the project root and run:',
    cssHelp: 'Import it after @grana/vue/style.css: it has no layer and always wins over the default theme.',
    copy: 'Copy',
    download: 'Download',
    copyLink: 'Copy link',
    copied: 'Copied to the clipboard.',
    linkCopied: 'Link copied to the clipboard.',
    copyFailed: 'Could not copy: select the text and copy it by hand.',
    codeLabel: (f) => `${f} contents`,
    empty: 'The config is empty: this is Grana’s default theme.',
    checks: 'Engine validation',
    ok: 'No warnings: both schemes meet the contrast minimums.',
    error: 'Error',
    warning: 'Warning',
    failed: 'The engine rejected this combination; the preview keeps the last valid theme.'
  }
}

const { lang, isDark } = useData()
const L = computed(() => T[lang.value === 'en' ? 'en' : 'es'])

// Valores del tema por defecto (tokens.md §3 a §5): lo que no se aparta de ellos no va en la configuración
const BASE = { brand: '', accent: '', primary: '', neutrals: 'tinted', neutralsHue: 'brand', collision: false, radius: 6, shape: 'rounded', space: 4, font: 'default', fontDisplay: 'default', fontSize: 16, typeScale: 1.25, borderWidth: 1, focusWidth: 2 }
const FONTS = {
  default: null,
  system: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  poppins: '"Poppins", system-ui, sans-serif',
  'instrument-serif': '"Instrument Serif", Georgia, serif'
}
const PRESETS = [
  { id: 'grana', es: 'Grana (por defecto)', en: 'Grana (default)', set: {} },
  { id: 'cochinilla', es: 'Cochinilla', en: 'Cochineal', set: { brand: '#9B1B30', radius: 8, fontDisplay: 'instrument-serif' } },
  { id: 'bosque', es: 'Bosque', en: 'Forest', set: { brand: '#2F6B4F', radius: 4, font: 'serif', typeScale: 1.2 } },
  { id: 'oceano', es: 'Océano en píldora', en: 'Ocean pill', set: { brand: '#0B5CAD', radius: 10, shape: 'pill', space: 4.5 } },
  { id: 'pizarra', es: 'Pizarra compacta', en: 'Compact slate', set: { brand: '#334155', neutrals: 'pure', radius: 2, space: 3.5, fontSize: 14, font: 'system' } },
  { id: 'ambar', es: 'Ámbar con acento', en: 'Amber with accent', set: { brand: '#F5B940', accent: '#5B3FE0', primary: '#7D1230', radius: 12, collision: true } },
  // Bitácoras de laboratorio: navy #052a76 de marca, navy-mid #0a3aa0 en foco y hover, --r-md 10px, Poppins y
  // texto de 13-13,5px (aquí 14: el caption no baja de 12). Con el acento navy, «info» choca en oscuro: se separa.
  { id: 'bitacoras', es: 'Bitácoras (laboratorio)', en: 'Lab logbooks', set: { brand: '#052A76', accent: '#0A3AA0', radius: 10, fontSize: 14, font: 'poppins', collision: true } }
]
const COLOR_KEYS = ['brand', 'accent', 'primary']
const BTN_COLORS = ['brand', 'accent', 'neutral', 'success', 'warning', 'danger', 'info']
const VARIANTS = ['solid', 'soft', 'outline', 'ghost', 'link']
const SIZES = ['xs', 'sm', 'md', 'lg', 'xl']

const s = reactive({ ...BASE })
const density = ref('default')
const scheme = ref('light')
const presetId = ref('grana')
const hexText = reactive({ brand: '', accent: '', primary: '' })

const presetOptions = computed(() => PRESETS.map((p) => ({ value: p.id, label: p[lang.value === 'en' ? 'en' : 'es'] })))
const fontOptions = computed(() => [
  { value: 'default', label: 'Instrument Sans' },
  { value: 'system', label: lang.value === 'en' ? 'System' : 'Del sistema' },
  { value: 'serif', label: 'Georgia (serif)' },
  { value: 'mono', label: lang.value === 'en' ? 'Monospace' : 'Monoespaciada' },
  { value: 'poppins', label: 'Poppins' }
])
const displayOptions = computed(() => [
  { value: 'default', label: L.value.sameAsFont },
  { value: 'instrument-serif', label: 'Instrument Serif' },
  ...fontOptions.value.slice(1)
])
const seg = (pairs) => pairs.map(([value, label]) => ({ value, label }))

// grana.config.json: solo las claves que se apartan del tema por defecto
const config = computed(() => {
  const c = {}
  for (const k of COLOR_KEYS) if (s[k]) c[k] = s[k]
  if (s.brand && s.neutrals !== BASE.neutrals) c.neutrals = s.neutrals
  if (s.brand && s.neutrals === 'tinted' && s.neutralsHue !== BASE.neutralsHue) c.neutralsHue = s.neutralsHue
  if (s.collision) c.semanticCollision = 'adjust'
  if (s.radius !== BASE.radius) c.radius = s.radius
  if (s.shape !== BASE.shape) c.shape = s.shape
  if (s.space !== BASE.space) c.space = s.space
  if (FONTS[s.font]) c.font = FONTS[s.font]
  if (FONTS[s.fontDisplay]) c.fontDisplay = FONTS[s.fontDisplay]
  if (s.fontSize !== BASE.fontSize) c.fontSize = s.fontSize
  if (s.typeScale !== BASE.typeScale) c.typeScale = s.typeScale
  // Grosores: tokens sin clave propia en la configuración (tokens.md §6), por `overrides`
  const overrides = {}
  if (s.borderWidth !== BASE.borderWidth) overrides['--g-border-width'] = `${s.borderWidth}px`
  if (s.focusWidth !== BASE.focusWidth) overrides['--g-focus-width'] = `${s.focusWidth}px`
  if (Object.keys(overrides).length) c.overrides = overrides
  return c
})

const result = computed(() => buildTheme(config.value, { source: 'grana.config.json' }))
// Si el motor rechaza la combinación (error de contraste), la vista previa conserva el último tema válido
const lastOk = ref(buildTheme({}, { source: 'grana.config.json' }))
watch(result, (r) => { if (r.ok) lastOk.value = r }, { immediate: true })

const tokenStyle = computed(() => {
  const r = lastOk.value
  return scheme.value === 'dark' && r.dark?.enabled ? r.dark.tokens : r.tokens
})
const configText = computed(() => JSON.stringify(config.value, null, 2) + '\n')
// Rechazado: no se exporta el CSS del último tema válido como si fuera el de esta configuración
const cssText = computed(() => (result.value.ok ? result.value.css : L.value.cssRejected))
const issues = computed(() => result.value.issues.filter((i) => i.severity === 'error' || i.severity === 'warning'))

/* ---------- color */

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i
const normalize = (v) => {
  const m = String(v).trim().match(HEX)
  if (!m) return null
  const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1]
  return '#' + h.toUpperCase()
}
// Valor efectivo de un color (claro) para la muestra nativa, que solo admite #rrggbb
const swatch = (k) => {
  const t = lastOk.value.tokens
  let v = t[`--g-color-${k}`]
  const ref = /^var\(--g-color-([a-z]+)\)$/.exec(v ?? '')
  if (ref) v = t[`--g-color-${ref[1]}`]
  return (normalize(v) ?? '#000000').toLowerCase()
}
const hexError = (k) => (hexText[k].trim() && !normalize(hexText[k]) ? L.value.badHex : undefined)
const onHex = (k, v) => {
  if (!String(v).trim()) { setColor(k, ''); return }
  const n = normalize(v)
  if (n) setColor(k, n)
}
const setColor = (k, v) => { s[k] = v; presetId.value = null }
watch(() => COLOR_KEYS.map((k) => s[k]).join(), () => {
  for (const k of COLOR_KEYS) if (normalize(hexText[k]) !== (s[k] || null)) hexText[k] = s[k]
}, { immediate: true })

/* ---------- puntos de partida */

let applying = false
const applyPreset = (id) => {
  const p = PRESETS.find((x) => x.id === id)
  if (!p) return
  applying = true
  Object.assign(s, BASE, p.set)
  presetId.value = id
  applying = false
}
watch(presetId, (id) => { if (id) applyPreset(id) })
// Cualquier cambio a mano deja el punto de partida en «Personalizado»
watch(() => ({ ...s }), () => {
  if (applying || !presetId.value) return
  const p = PRESETS.find((x) => x.id === presetId.value)
  if (p && Object.keys(BASE).some((k) => s[k] !== ({ ...BASE, ...p.set })[k])) presetId.value = null
})
const reset = () => { applyPreset('grana'); density.value = 'default' }

/* ---------- foco de muestra */

const stage = ref(null)
// focusVisible: el anillo de foco de teclado también al llegar con un clic
const showFocus = () => stage.value?.querySelector('[data-tp-focus]')?.focus({ focusVisible: true })

/* ---------- exportar */

const tab = ref('config')
const exportItems = computed(() => [
  { id: 'config', label: L.value.configTab },
  { id: 'css', label: L.value.cssTab }
])
const tabLabels = computed(() => (lang.value === 'en'
  ? { more: 'More tabs', menu: 'All tabs', loading: '{label}: loading', loaded: '{label}: ready' }
  : { more: 'Más pestañas', menu: 'Todas las pestañas', loading: '{label}: cargando', loaded: '{label}: listo' }))
const notice = ref('')
let noticeTimer
const say = (text) => {
  notice.value = ''
  clearTimeout(noticeTimer)
  // vaciar y volver a escribir: el mismo texto dos veces seguidas también se anuncia
  requestAnimationFrame(() => { notice.value = text; noticeTimer = setTimeout(() => (notice.value = ''), 4000) })
}
const copy = async (text, done) => {
  try { await navigator.clipboard.writeText(text); say(done) } catch { say(L.value.copyFailed) }
}
const download = (name, text, type) => {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
const shareUrl = () => {
  const u = new URL(location.href)
  u.hash = Object.keys(config.value).length ? 'tema=' + encodeURIComponent(JSON.stringify(config.value)) : ''
  return u.toString()
}

/* ---------- estado en la URL (enlace para compartir) */

const fromConfig = (c) => {
  const next = { ...BASE }
  for (const k of COLOR_KEYS) if (typeof c[k] === 'string' && normalize(c[k])) next[k] = normalize(c[k])
  if (c.neutrals === 'pure') next.neutrals = 'pure'
  if (c.neutralsHue === 'accent') next.neutralsHue = 'accent'
  if (c.semanticCollision === 'adjust') next.collision = true
  if (c.shape === 'pill') next.shape = 'pill'
  for (const k of ['radius', 'space', 'fontSize', 'typeScale']) if (typeof c[k] === 'number') next[k] = c[k]
  const px = (v) => (typeof v === 'string' && /^\d+(\.\d+)?px$/.test(v) ? parseFloat(v) : null)
  next.borderWidth = px(c.overrides?.['--g-border-width']) ?? BASE.borderWidth
  next.focusWidth = px(c.overrides?.['--g-focus-width']) ?? BASE.focusWidth
  for (const k of ['font', 'fontDisplay']) {
    const id = Object.keys(FONTS).find((f) => FONTS[f] === c[k])
    if (id) next[k] = id
  }
  return next
}
const fromHash = () => {
  const m = /^#tema=(.+)$/.exec(location.hash)
  if (!m) return
  try {
    const c = JSON.parse(decodeURIComponent(m[1]))
    if (c && typeof c === 'object') { Object.assign(s, fromConfig(c)); presetId.value = null }
  } catch { /* enlace dañado: se queda el tema que hay */ }
}
onMounted(() => {
  scheme.value = isDark.value ? 'dark' : 'light'
  fromHash()
  // otro enlace #tema= en la misma página no vuelve a montar el componente
  window.addEventListener('hashchange', fromHash)
  let t
  watch(config, () => {
    clearTimeout(t)
    t = setTimeout(() => history.replaceState(history.state, '', shareUrl()), 300)
  })
})
onBeforeUnmount(() => window.removeEventListener('hashchange', fromHash))

const fmt = (n, d = 0) => new Intl.NumberFormat(lang.value === 'en' ? 'en' : 'es-MX', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n)
const plans = computed(() => L.value.plans.map((label, i) => ({ value: String(i + 1), label })))
const plan = ref('2')
const qty = ref(3)
const notes = ref('')
watch(L, (l) => { notes.value = l.notes }, { immediate: true })
</script>

<template>
  <!-- grana-live: fuera de la regla de foco del sitio (grana-site.css); el foco es el de cada componente -->
  <div class="tp grana-live vp-raw">
    <header class="tp-head">
      <p class="tp-eyebrow">{{ L.eyebrow }}</p>
      <h1 class="tp-title">{{ L.title }}</h1>
      <p class="tp-lead">{{ L.lead }}</p>
    </header>

    <div class="tp-layout">
      <section class="tp-panel" aria-labelledby="tp-panel-title">
        <div class="tp-panel__head">
          <h2 id="tp-panel-title" class="tp-h2">{{ L.panel }}</h2>
          <g-btn variant="ghost" color="neutral" size="sm" @click="reset">{{ L.reset }}</g-btn>
        </div>
        <g-select v-model="presetId" :options="presetOptions" :label="L.preset" :placeholder="L.custom" block />

        <section class="tp-group" aria-labelledby="tp-g-color">
          <h3 id="tp-g-color" class="tp-h3">{{ L.color }}</h3>
          <div v-for="k in COLOR_KEYS" :key="k" class="tp-color">
            <input type="color" class="tp-color__swatch" :value="swatch(k)" :aria-label="L.pick(L.colors[k].label)"
                   @input="setColor(k, normalize($event.target.value))" />
            <g-input v-model="hexText[k]" :label="L.colors[k].label" block
                     :placeholder="swatch(k).toUpperCase()" :hint="s[k] ? undefined : L.colors[k].unset" :error="hexError(k)"
                     spellcheck="false" autocomplete="off" @update:model-value="onHex(k, $event)">
              <!-- siempre presente: GInput decide si hay acción una sola vez (un slot condicional no aparece después) -->
              <template #action="{ size, density: d, disabled }">
                <g-btn :size="size" :density="d" :disabled="disabled || !s[k]" variant="outline" color="neutral" icon
                       :aria-label="L.clearAria(L.colors[k].label)" @click="setColor(k, '')"><g-icon name="x" /></g-btn>
              </template>
            </g-input>
          </div>
          <g-radio-group v-model="s.neutrals" appearance="segmented" :label="L.neutrals" :hint="L.neutralsHint"
                         :disabled="!s.brand" :options="seg([['tinted', L.tinted], ['pure', L.pure]])" />
          <g-radio-group v-model="s.neutralsHue" appearance="segmented" :label="L.neutralsHue"
                         :disabled="!s.brand || s.neutrals !== 'tinted'" :options="seg([['brand', L.fromBrand], ['accent', L.fromAccent]])" />
          <g-switch v-model="s.collision" :label="L.collision" />
        </section>

        <section class="tp-group" aria-labelledby="tp-g-shape">
          <h3 id="tp-g-shape" class="tp-h3">{{ L.shape }}</h3>
          <g-slider v-model="s.radius" :label="L.radius" :min="0" :max="24" :value-text="(v) => `${fmt(v)} px`" />
          <g-slider v-model="s.borderWidth" :label="L.borderWidth" :hint="L.borderHint" :min="1" :max="3" :step="0.5" :value-text="(v) => `${fmt(v, 1)} px`" />
          <g-slider v-model="s.focusWidth" :label="L.focusWidth" :hint="L.focusHint" :min="1" :max="4"
                    :error="s.focusWidth < 2 ? L.focusError : undefined" :value-text="(v) => `${fmt(v)} px`" />
          <g-radio-group v-model="s.shape" appearance="segmented" :label="L.shapeLabel"
                         :options="seg([['rounded', L.rounded], ['pill', L.pill]])" />
        </section>

        <section class="tp-group" aria-labelledby="tp-g-space">
          <h3 id="tp-g-space" class="tp-h3">{{ L.space }}</h3>
          <g-slider v-model="s.space" :label="L.spaceLabel" :min="3" :max="6" :step="0.5" :value-text="(v) => `${fmt(v, 1)} px`" />
          <g-radio-group v-model="density" appearance="segmented" :label="L.density" :hint="L.densityHint"
                         :options="seg(Object.entries(L.densities))" />
        </section>

        <section class="tp-group" aria-labelledby="tp-g-type">
          <h3 id="tp-g-type" class="tp-h3">{{ L.type }}</h3>
          <g-select v-model="s.font" :options="fontOptions" :label="L.font" block />
          <g-select v-model="s.fontDisplay" :options="displayOptions" :label="L.fontDisplay" block />
          <g-slider v-model="s.fontSize" :label="L.fontSize" :min="12" :max="20" :value-text="(v) => `${fmt(v)} px`" />
          <g-slider v-model="s.typeScale" :label="L.typeScale" :min="1.1" :max="1.5" :step="0.05" :value-text="(v) => fmt(v, 2)" />
        </section>

        <section class="tp-group" aria-labelledby="tp-g-scheme">
          <h3 id="tp-g-scheme" class="tp-h3">{{ L.scheme }}</h3>
          <g-radio-group v-model="scheme" appearance="segmented" :label="L.schemeView" :hint="L.schemeHint"
                         :options="seg([['light', L.light], ['dark', L.dark]])" />
        </section>
      </section>

      <div class="tp-main">
        <section ref="stage" class="tp-stage" :data-theme="scheme" :style="tokenStyle" aria-labelledby="tp-preview-title">
          <div class="tp-stage__head">
            <div>
              <h2 id="tp-preview-title" class="tp-stage__title">{{ L.preview }}</h2>
              <p class="tp-stage__note">{{ L.previewNote }}</p>
            </div>
            <g-btn variant="outline" color="neutral" size="sm" :density="density" @click="showFocus">{{ L.showFocus }}</g-btn>
          </div>

          <section class="tp-block" aria-labelledby="tp-b-btn">
            <h3 id="tp-b-btn" class="tp-block__title">{{ L.buttons }} <code>GBtn</code></h3>

            <h4 class="tp-block__sub">{{ L.variants }}</h4>
            <div v-for="v in VARIANTS" :key="v" class="tp-row">
              <span class="tp-row__label"><code>{{ v }}</code></span>
              <div class="tp-row__items">
                <g-btn v-for="c in BTN_COLORS" :key="c" :data-tp-focus="v === 'solid' && c === 'brand' ? '' : undefined"
                       :variant="v" :color="c" :density="density">{{ L.colorNames[c] }}</g-btn>
              </div>
            </div>

            <h4 class="tp-block__sub">{{ L.sizes }}</h4>
            <div class="tp-row__items tp-row__items--end">
              <g-btn v-for="z in SIZES" :key="z" :size="z" :density="density">{{ z }}</g-btn>
              <g-btn v-for="z in SIZES" :key="'i' + z" :size="z" :density="density" variant="soft" icon :aria-label="`${L.add} (${z})`"><g-icon name="plus" /></g-btn>
            </div>

            <h4 class="tp-block__sub">{{ L.states }}</h4>
            <div class="tp-row__items">
              <g-btn :density="density">{{ L.normal }}</g-btn>
              <g-btn :density="density" disabled>{{ L.disabled }}</g-btn>
              <g-btn :density="density" variant="outline" disabled>{{ L.disabled }}</g-btn>
              <g-btn :density="density" loading :loading-text="L.loadingText">{{ L.loading }}</g-btn>
              <g-btn :density="density" variant="soft" color="accent"><template #prepend><g-icon name="plus" /></template>{{ L.withIcon }}</g-btn>
              <g-btn :density="density" variant="outline">{{ L.next }}<template #append><g-icon name="arrow-right" flip-rtl /></template></g-btn>
            </div>
          </section>

          <section class="tp-block" aria-labelledby="tp-b-field">
            <h3 id="tp-b-field" class="tp-block__title">{{ L.fields }} <code>GInput</code> <code>GSelect</code> <code>GTextarea</code> <code>GNumberField</code></h3>

            <h4 class="tp-block__sub">{{ L.appearances }}</h4>
            <div class="tp-grid">
              <g-input :label="`${L.name} · ${L.outline}`" :placeholder="L.namePh" :hint="L.nameHint" :density="density" block />
              <g-input :label="`${L.name} · ${L.soft}`" variant="soft" :placeholder="L.namePh" :hint="L.nameHint" :density="density" block />
              <g-select v-model="plan" :options="plans" :label="L.select" :placeholder="L.selectPh" :density="density" block />
              <g-number-field v-model="qty" :label="L.number" :min="0" :max="99" steppers :decrement-label="L.less" :increment-label="L.more"
                              :suffix="L.units" :suffix-label="L.units" :locale="lang === 'en' ? 'en' : 'es-MX'" :density="density" block />
              <g-textarea v-model="notes" class="tp-grid__wide" :label="L.textarea" :rows="2" :density="density" block />
            </div>

            <h4 class="tp-block__sub">{{ L.fieldStates }}</h4>
            <div class="tp-grid">
              <g-input :label="L.email" model-value="ana.lopez.mx" :error="L.emailError" :density="density" block />
              <g-input :label="L.phone" model-value="55 1234" :warning="L.phoneWarning" :density="density" block />
              <g-input :label="L.user" model-value="ana_lopez" :valid="L.userValid" :density="density" block />
              <g-input :label="L.required" required mark :density="density" block />
              <g-input :label="L.readonly" model-value="MX-1042" readonly :density="density" block />
              <g-input :label="L.disabledField" model-value="—" disabled :density="density" block />
              <g-input :label="L.loadingField" model-value="ana_lopez" loading :density="density" block />
              <g-input :label="L.price" model-value="1,250.00" prefix="$" suffix="MXN" prefix-label="pesos" suffix-label="MXN" :density="density" block />
              <g-input :label="L.password" type="password" model-value="cochinilla" :show-password-label="L.show" :hide-password-label="L.hide" :density="density" block />
            </div>

            <h4 class="tp-block__sub">{{ L.sizes }}</h4>
            <div class="tp-sizes">
              <g-input v-for="z in SIZES" :key="z" :size="z" :label="`${L.name} · ${z}`" :placeholder="L.namePh" :density="density" block />
            </div>
          </section>

          <section class="tp-block" aria-labelledby="tp-b-context">
            <h3 id="tp-b-context" class="tp-block__title">{{ L.context }}</h3>
            <div class="tp-context">
              <div class="tp-specimen" aria-hidden="true">
                <p class="tp-specimen__display">{{ L.specimen }}</p>
                <p class="tp-specimen__title">{{ L.cardTitle }}</p>
                <p class="tp-specimen__body">{{ L.cardText }}</p>
              </div>
              <g-card level="outlined" :eyebrow="L.cardEyebrow" :title="L.cardTitle" :heading-level="4" :density="density">
                <div class="tp-card-body">
                  <g-input :label="L.name" :placeholder="L.namePh" :density="density" block />
                  <g-select v-model="plan" :options="plans" :label="L.select" :density="density" block />
                </div>
                <template #actions>
                  <g-btn variant="ghost" color="neutral" :density="density">{{ L.cancel }}</g-btn>
                  <g-btn :density="density">{{ L.save }}</g-btn>
                </template>
              </g-card>
            </div>
          </section>
        </section>

        <section class="tp-export" aria-labelledby="tp-export-title">
          <div class="tp-export__head">
            <div>
              <h2 id="tp-export-title" class="tp-h2">{{ L.export }}</h2>
              <p class="tp-muted">{{ L.exportLead }}</p>
            </div>
            <g-btn variant="outline" color="neutral" size="sm" @click="copy(shareUrl(), L.linkCopied)">{{ L.copyLink }}</g-btn>
          </div>
          <g-tabs v-model="tab" :items="exportItems" :labels="tabLabels" :label="L.exportTabs">
            <template #panel="{ item }">
              <div class="tp-code">
                <p v-if="item.id === 'config'" class="tp-muted">{{ L.configHelp }} <code>npx grana theme grana.config.json</code></p>
                <p v-else class="tp-muted">{{ L.cssHelp }}</p>
                <p v-if="item.id === 'config' && configText === '{}\n'" class="tp-muted">{{ L.empty }}</p>
                <pre class="tp-code__pre" tabindex="0" :aria-label="L.codeLabel(item.label)"><code>{{ item.id === 'config' ? configText : cssText }}</code></pre>
                <div class="tp-code__actions">
                  <g-btn size="sm" :disabled="item.id === 'css' && !result.ok" @click="copy(item.id === 'config' ? configText : cssText, L.copied)"><template #prepend><g-icon name="copy" /></template>{{ L.copy }}</g-btn>
                  <g-btn size="sm" variant="outline" color="neutral" :disabled="item.id === 'css' && !result.ok"
                         @click="item.id === 'config' ? download('grana.config.json', configText, 'application/json') : download('tokens.css', cssText, 'text/css')">
                    <template #prepend><g-icon name="download" /></template>{{ L.download }}
                  </g-btn>
                </div>
              </div>
            </template>
          </g-tabs>
          <p class="tp-notice" role="status">{{ notice }}</p>

          <h3 class="tp-h3">{{ L.checks }}</h3>
          <p v-if="!result.ok" class="tp-muted">{{ L.failed }}</p>
          <ul v-if="issues.length" class="tp-issues">
            <li v-for="(i, n) in issues" :key="n" :class="`tp-issues__item tp-issues__item--${i.severity}`">
              <g-badge :color="i.severity === 'error' ? 'danger' : 'warning'">{{ i.severity === 'error' ? L.error : L.warning }}</g-badge>
              <span>{{ i.message }}</span>
            </li>
          </ul>
          <p v-else class="tp-muted">{{ L.ok }}</p>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Página de herramienta del sitio (sin capa, como una aplicación): solo maqueta y tokens de Grana. */
.tp {
  box-sizing: border-box;
  max-inline-size: 1440px;
  margin-inline: auto;
  padding: var(--g-space-8) var(--g-space-6) var(--g-space-16);
  color: var(--g-color-text);
  font-family: var(--g-font-ui);
}
.tp *, .tp *::before, .tp *::after { box-sizing: border-box; }
.tp :where(h1, h2, h3, h4, p, ul, pre) { margin: 0; }

.tp-head { display: grid; gap: var(--g-space-2); max-inline-size: 72ch; margin-block-end: var(--g-space-8); }
.tp-eyebrow { font-size: var(--g-text-caption-size); line-height: var(--g-text-caption-line); font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--g-color-text-muted); }
/* Titular con Instrument Serif, como los de la documentación (grana-site.css) */
.tp-title { font-family: 'Instrument Serif', ui-serif, Georgia, serif; font-size: var(--g-text-display-size); line-height: var(--g-text-display-line); font-weight: 400; letter-spacing: -0.01em; }
.tp-lead { font-size: var(--g-text-body-size); line-height: var(--g-text-body-line); color: var(--g-color-text-muted); }

.tp-layout { display: grid; gap: var(--g-space-6); grid-template-columns: minmax(0, 1fr); align-items: start; }
@media (min-width: 1024px) {
  .tp-layout { grid-template-columns: minmax(19rem, 22rem) minmax(0, 1fr); }
  .tp-panel {
    position: sticky;
    inset-block-start: calc(var(--vp-nav-height, 64px) + var(--g-space-4));
    max-block-size: calc(100dvh - var(--vp-nav-height, 64px) - var(--g-space-8));
    overflow-y: auto;
    overscroll-behavior: contain;
  }
}

.tp-h2 { font-size: var(--g-text-title-sm-size); line-height: var(--g-text-title-sm-line); font-weight: var(--g-text-title-sm-weight); }
.tp-h3 { font-size: var(--g-text-body-size); line-height: var(--g-text-body-line); font-weight: 600; }
.tp-muted { font-size: var(--g-text-body-sm-size); line-height: var(--g-text-body-sm-line); color: var(--g-color-text-muted); }

/* Panel de parámetros: la superficie del sitio, delimitada por borde */
.tp-panel {
  display: grid;
  gap: var(--g-space-5);
  padding: var(--g-space-5);
  border: var(--g-border-width) solid var(--g-color-border);
  border-radius: var(--g-radius-lg);
  background: var(--g-color-surface);
}
.tp-panel__head { display: flex; align-items: center; justify-content: space-between; gap: var(--g-space-3); }
.tp-group { display: grid; gap: var(--g-space-4); padding-block-start: var(--g-space-5); border-block-start: var(--g-border-width) solid var(--g-color-border); }
.tp-color { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: var(--g-space-2); align-items: start; }
/* La muestra nativa mide como el campo md (9 unidades de space, tokens.md §4); 44px con puntero grueso */
.tp-color__swatch {
  inline-size: calc(var(--g-space-1) * 9);
  block-size: calc(var(--g-space-1) * 9);
  margin-block-start: calc(var(--g-text-body-sm-line) + var(--g-space-1));
  padding: var(--g-space-1);
  border: var(--g-border-width) solid var(--g-color-border-control);
  border-radius: var(--g-radius-sm);
  background: var(--g-color-surface);
  cursor: pointer;
}
.tp-color__swatch:focus-visible { outline: var(--g-focus-width) solid var(--g-color-focus); outline-offset: var(--g-focus-offset); }
@media (pointer: coarse) { .tp-color__swatch { inline-size: 44px; block-size: 44px; } }

.tp-main { display: grid; gap: var(--g-space-6); min-inline-size: 0; }

/* Vista previa: recibe el tema derivado en su raíz (style) y su esquema (data-theme) */
.tp-stage {
  display: grid;
  gap: var(--g-space-8);
  padding: var(--g-space-6);
  border: var(--g-border-width) solid var(--g-color-border);
  border-radius: var(--g-radius-xl);
  background: var(--g-color-bg);
  color: var(--g-color-text);
  font-family: var(--g-font-ui);
  font-size: var(--g-text-body-size);
  line-height: var(--g-text-body-line);
}
.tp-stage__head { display: flex; flex-wrap: wrap; align-items: start; justify-content: space-between; gap: var(--g-space-3); }
.tp-stage__title { font-family: var(--g-font-title); font-size: var(--g-text-title-size); line-height: var(--g-text-title-line); font-weight: var(--g-text-title-weight); letter-spacing: var(--g-text-title-tracking); }
.tp-stage__note { font-size: var(--g-text-body-sm-size); line-height: var(--g-text-body-sm-line); color: var(--g-color-text-muted); }
.tp-stage code, .tp-export code {
  font-family: var(--vp-font-family-mono);
  font-size: 0.85em;
  padding: 0.1em 0.35em;
  border-radius: var(--g-radius-xs);
  background: var(--g-color-surface-sunken);
  color: var(--g-color-text);
}

.tp-block {
  display: grid;
  gap: var(--g-space-4);
  padding: var(--g-space-5);
  border: var(--g-border-width) solid var(--g-color-border);
  border-radius: var(--g-radius-lg);
  background: var(--g-color-surface);
  min-inline-size: 0;
}
.tp-block__title { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--g-space-2); font-family: var(--g-font-title); font-size: var(--g-text-title-sm-size); line-height: var(--g-text-title-sm-line); font-weight: var(--g-text-title-sm-weight); }
.tp-block__title code { font-size: var(--g-text-caption-size); font-weight: 400; }
.tp-block__sub { font-size: var(--g-text-caption-size); line-height: var(--g-text-caption-line); font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--g-color-text-muted); padding-block-start: var(--g-space-2); }

.tp-row { display: grid; gap: var(--g-space-2); }
@media (min-width: 640px) { .tp-row { grid-template-columns: 6rem minmax(0, 1fr); align-items: center; } }
.tp-row__label { font-size: var(--g-text-body-sm-size); color: var(--g-color-text-muted); }
.tp-row__items { display: flex; flex-wrap: wrap; gap: var(--g-space-2); align-items: center; }
.tp-row__items--end { align-items: end; }

.tp-grid { display: grid; gap: var(--g-space-4); grid-template-columns: repeat(auto-fill, minmax(min(100%, 15rem), 1fr)); align-items: start; }
.tp-grid__wide { grid-column: 1 / -1; }
.tp-sizes { display: grid; gap: var(--g-space-4); max-inline-size: 28rem; }

.tp-context { display: grid; gap: var(--g-space-5); grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr)); align-items: start; }
.tp-specimen { display: grid; gap: var(--g-space-2); }
.tp-specimen__display { font-family: var(--g-font-display); font-size: var(--g-text-display-size); line-height: var(--g-text-display-line); font-weight: var(--g-text-display-weight); letter-spacing: var(--g-text-display-tracking); }
.tp-specimen__title { font-family: var(--g-font-title); font-size: var(--g-text-title-sm-size); line-height: var(--g-text-title-sm-line); font-weight: var(--g-text-title-sm-weight); }
.tp-specimen__body { color: var(--g-color-text-muted); }
.tp-card-body { display: grid; gap: var(--g-space-4); }

/* Exportar */
.tp-export {
  display: grid;
  gap: var(--g-space-4);
  padding: var(--g-space-5);
  border: var(--g-border-width) solid var(--g-color-border);
  border-radius: var(--g-radius-lg);
  background: var(--g-color-surface);
  min-inline-size: 0;
}
.tp-export__head { display: flex; flex-wrap: wrap; align-items: start; justify-content: space-between; gap: var(--g-space-3); }
.tp-code { display: grid; gap: var(--g-space-3); padding-block-start: var(--g-space-4); min-inline-size: 0; }
.tp-code__pre {
  max-block-size: 24rem;
  overflow: auto;
  padding: var(--g-space-4);
  border: var(--g-border-width) solid var(--g-color-border);
  border-radius: var(--g-radius-md);
  background: var(--g-color-surface-sunken);
  font-family: var(--vp-font-family-mono);
  font-size: var(--g-text-body-sm-size);
  line-height: var(--g-text-body-sm-line);
}
.tp-code__pre:focus-visible { outline: var(--g-focus-width) solid var(--g-color-focus); outline-offset: var(--g-focus-offset); }
.tp-code__pre code { padding: 0; background: none; font-size: inherit; }
.tp-code__actions { display: flex; flex-wrap: wrap; gap: var(--g-space-2); }
.tp-notice { min-block-size: var(--g-text-body-sm-line); font-size: var(--g-text-body-sm-size); color: var(--g-color-success-text); }
.tp-issues { display: grid; gap: var(--g-space-2); padding: 0; list-style: none; }
.tp-issues__item { display: flex; gap: var(--g-space-2); align-items: baseline; font-size: var(--g-text-body-sm-size); line-height: var(--g-text-body-sm-line); }

@media (max-width: 639px) {
  .tp { padding-inline: var(--g-space-4); }
  .tp-stage, .tp-panel { padding: var(--g-space-4); }
  .tp-block, .tp-export { padding: var(--g-space-4); }
}
</style>
