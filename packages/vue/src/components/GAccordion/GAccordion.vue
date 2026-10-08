<script>
// GAccordion · grupo de secciones plegables de contenido (dueño: bruno)
// Contrato: design/contracts/accordion.md (#475 a #488) · Estructura: design/lab/accordion/r01/ (kiwi) · Estilo:
// GAccordion.css (coco; un solo archivo para el grupo y el elemento) y design/lab/accordion/estilo.md «Para bruno».
// APG Accordion: el grupo no tiene rol; cada GAccordionItem es hN > button. Presenta y emite intención: el modelo es el
// arreglo de los `value` abiertos en orden del documento (controlado y no controlado, como GFormSection).
// Render con función (no plantilla) para contar los GAccordionItem del slot ANTES de que se pinten: la regla de `region`
// (≤ 6 o exclusive, #477) sale igual en el servidor y en el cliente.
import { computed, defineComponent, getCurrentInstance, h, onMounted, provide, ref, shallowReactive, watch } from 'vue'
import { byDocument, isDev, nextFrame } from '../GForm/formContext.js'
import { scrollParent } from '../../utils/collapse.js'
import { accordionKey } from './accordionContext.js'

const REGION_MAX = 6 // APG: con más regiones que pueden estar abiertas a la vez, proliferan los puntos de referencia
const ITEM = 'GAccordionItem'

// GAccordionItem en los vnodes del slot (a través de fragmentos de v-for/<template> y de elementos de la aplicación; no
// entra en otros componentes: un grupo anidado cuenta los suyos)
function countItems(list) {
  let n = 0
  for (const v of list || []) {
    if (!v || typeof v !== 'object') continue
    if (v.type && typeof v.type === 'object' && v.type.name === ITEM) n++
    else if (Array.isArray(v.children)) n += countItems(v.children)
  }
  return n
}

export default defineComponent({
  name: 'GAccordion',
  props: {
    modelValue: { type: Array, default: undefined },
    exclusive: Boolean,
    headingLevel: { type: Number, default: 3, validator: (v) => Number.isInteger(v) && v >= 2 && v <= 6 },
    arrows: { type: Boolean, default: true },
    sticky: Boolean
  },
  emits: ['update:modelValue'],
  setup(props, { emit, slots }) {
    // ---------- Avisos de desarrollo ([Grana GAccordion], una vez por instancia) ----------
    const warned = new Set()
    const warn = (key, msg) => {
      if (!isDev || warned.has(key)) return
      warned.add(key)
      console.warn(`[Grana GAccordion] ${msg}`)
    }
    const vnodeProps = getCurrentInstance()?.vnode.props || {}
    const passed = (k) => Object.prototype.hasOwnProperty.call(vnodeProps, k)
    const hasModel = passed('modelValue') || passed('model-value') || passed('onUpdate:modelValue')

    // ---------- Modelo (controlado y no controlado: parte de la prop y la sigue) ----------
    // Lo que llega de la prop: null/undefined = [] sin aviso; otro valor que no es arreglo = [v] con aviso 1
    function normalize(v) {
      if (v === null || v === undefined) return []
      if (!Array.isArray(v)) {
        warn('not-array', `modelValue debe ser un arreglo de value; se trata ${JSON.stringify(v)} como [${JSON.stringify(v)}].`)
        return [v]
      }
      return [...v]
    }
    const local = ref(normalize(props.modelValue))
    watch(() => props.modelValue, (v) => { local.value = normalize(v) })

    // ---------- Registro de elementos (los de este grupo; cada elemento vuelve a proveer null) ----------
    const root = ref(null)
    const entries = shallowReactive([])
    const order = ref(0) // se incrementa al montar: el orden del documento ya se puede leer del DOM
    let slotCount = 0 // GAccordionItem del slot en el último render (antes de que los elementos se pinten)
    function register(entry) {
      entries.push(entry)
      return () => {
        const i = entries.indexOf(entry)
        if (i >= 0) entries.splice(i, 1)
      }
    }
    // Elementos en orden del documento (sin DOM, en el servidor o antes de montar: orden de registro = orden del slot)
    function ordered() {
      void order.value
      const list = [...entries]
      if (list.every((e) => e.el())) list.sort((a, b) => byDocument(a.el(), b.el()))
      return list
    }
    // Ordena valores en orden del documento; los que no tiene ningún elemento montado se conservan al final, en su orden
    function sortDoc(values) {
      const known = ordered().map((e) => e.value())
      const rank = (v) => {
        const i = known.indexOf(v)
        return i < 0 ? Infinity : i
      }
      return values.map((v, i) => ({ v, i, r: rank(v) })).sort((a, b) => a.r - b.r || a.i - b.i).map((x) => x.v)
    }
    // Lo abierto de verdad: en exclusive con más de un valor, solo el primero en orden del documento (aviso 2, sin emitir)
    const openValues = computed(() => {
      const l = local.value
      if (!props.exclusive || l.length <= 1) return l
      return [sortDoc(l)[0]]
    })
    watch(() => props.exclusive && local.value.length > 1, (many) => {
      if (many) warn('exclusive-many', 'exclusive con más de un valor abierto: solo se abre el primero en orden del documento (no se emite; corrige el modelo de la aplicación).')
    }, { immediate: true })
    // Aviso 3: dos elementos del grupo con el mismo value
    watch(() => {
      const seen = new Set()
      for (const e of entries) {
        const v = e.value()
        if (seen.has(v)) return v
        seen.add(v)
      }
      return undefined
    }, (dup) => {
      if (dup !== undefined) warn('dup-value', `dos elementos tienen el mismo value (${JSON.stringify(dup)}): se abrirán y cerrarán juntos.`)
    }, { immediate: true })

    /** Cambio de lo abierto por el usuario, la búsqueda de la página, un #id o OPEN_REQUEST: emite siempre. */
    function set(v, open, { instant = false } = {}) {
      const cur = openValues.value
      let next
      if (open) next = props.exclusive ? [v] : cur.includes(v) ? [...cur] : [...cur, v]
      else next = cur.filter((x) => x !== v)
      // En exclusive, abrir sin animar cierra los otros sin animar también (la coincidencia no se mueve bajo el resaltado)
      if (open && instant && props.exclusive) {
        for (const e of entries) if (e.value() !== v && cur.includes(e.value())) e.setInstant()
      }
      next = sortDoc(next)
      local.value = next
      emit('update:modelValue', [...next])
    }

    // OPEN_REQUEST en exclusive: dentro del mismo tick solo se atiende la primera petición que llega al grupo
    let taken = false
    function takeRequest() {
      if (!props.exclusive) return true
      if (taken) return false
      taken = true
      Promise.resolve().then(() => { taken = false })
      return true
    }

    // ---------- Flechas (APG, opcional; #481): ↓/↑ sin vuelta, Inicio/Fin, solo en los encabezados de ESTE grupo ----------
    function onKeydown(e) {
      if (!props.arrows || e.altKey || e.ctrlKey || e.metaKey || e.defaultPrevented) return
      const list = ordered().map((x) => x.toggle()).filter(Boolean)
      const i = list.indexOf(e.target)
      if (i < 0) return
      let j
      if (e.key === 'ArrowDown') j = Math.min(i + 1, list.length - 1)
      else if (e.key === 'ArrowUp') j = Math.max(i - 1, 0)
      else if (e.key === 'Home') j = 0
      else if (e.key === 'End') j = list.length - 1
      else return
      e.preventDefault()
      if (j !== i) list[j].focus()
    }

    // ---------- sticky (#484) ----------
    // --_scroll-pad: relleno de inicio del contenedor de desplazamiento (position: sticky se pega al borde del relleno);
    // 0 con el documento. Escritura en un cuadro y solo si cambia (#173)
    const scrollPad = ref(0)
    let padQueued = false
    function measurePad() {
      if (!props.sticky || padQueued) return
      padQueued = true
      nextFrame(() => {
        padQueued = false
        const el = root.value
        if (!el || !props.sticky) return
        const sc = scrollParent(el, { overflowing: false })
        const top = document.scrollingElement || document.documentElement
        const v = !sc || sc === top ? 0 : parseFloat(getComputedStyle(sc).paddingBlockStart) || 0
        if (v !== scrollPad.value) scrollPad.value = v
      })
    }
    watch(() => props.sticky, measurePad)
    // 2.4.11 en WebKit: el foco por teclado no desplaza un control que ya asoma bajo el encabezado pegado (Chromium y
    // Firefox sí, con el scroll-margin del CSS). Si queda tapado, scrollIntoView({ block: 'nearest' }) lo trae respetando
    // ese scroll-margin (estilo.md «Para bruno», 2)
    function onFocusin(e) {
      if (!props.sticky) return
      const t = e.target
      if (!t || typeof t.getBoundingClientRect !== 'function') return
      for (const entry of entries) {
        const el = entry.el()
        const panel = entry.panel()
        if (!el || !panel || !el.classList.contains('is-open') || !panel.contains(t)) continue
        const head = entry.heading()
        if (head && t.getBoundingClientRect().top < head.getBoundingClientRect().bottom - 0.5 && typeof t.scrollIntoView === 'function') {
          t.scrollIntoView({ block: 'nearest' })
        }
        return
      }
    }

    onMounted(() => {
      order.value++
      measurePad()
    })

    provide(accordionKey, {
      isOpen: (v) => openValues.value.includes(v),
      set,
      register,
      takeRequest,
      measurePad,
      regionOK: () => props.exclusive || Math.max(slotCount, entries.length) <= REGION_MAX,
      headingLevel: () => props.headingLevel,
      sticky: () => props.sticky,
      hasModel: () => hasModel,
      panels: () => entries.map((e) => e.panel()).filter(Boolean),
      root: () => root.value
    })

    return () => {
      const children = slots.default ? slots.default() : []
      slotCount = countItems(children)
      return h('div', {
        ref: root,
        class: ['g-accordion', { 'g-accordion--exclusive': props.exclusive, 'g-accordion--sticky': props.sticky }],
        style: props.sticky && scrollPad.value ? { '--_scroll-pad': `${scrollPad.value}px` } : undefined,
        onKeydown,
        onFocusin
      }, children)
    }
  }
})
</script>
