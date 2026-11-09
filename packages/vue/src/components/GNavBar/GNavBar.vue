<script>
// GNavBar · barra superior de navegación de un sitio (dueño: bruno)
// Contrato: design/contracts/nav-bar.md (#1053, #1055, #1057, #1059) · Estructura: design/lab/navbar/r01/ (kiwi) ·
// Estilo: GNavBar.css (coco). Lista de enlaces (APG Disclosure Navigation): Tab, sin flechas ni roles de menú. La actual
// sale de `current` (nunca de `location`, SSR #1033); enlaces, «…» y pantalla están en el HTML del servidor y el CSS
// enseña lo que toca según el visor (cortes 48rem y 80rem). P1 · una sola luz (#957) con utils/glide.js por `__shared`.
// La pantalla de menú pide `cover()` al chasis (appShellKey, #1055) o, sin chasis, bloquea el desplazamiento ella misma.
// Entrada propia `@grana/vue/nav-bar` (#1059): GLibIcon, glide, link y appShell llegan de `__shared`, sin copia.
import { Comment, Fragment, Text, computed, defineComponent, h, inject, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import GIcon from '../GIcon/GLibIcon.js'
import { createPointerGlide } from '../../utils/glide.js'
import { otherContext } from '../../utils/link.js'
import { appShellKey } from '../../utils/appShell.js'

// Aplana fragmentos y descarta comentarios y textos vacíos: un separador antes de cada nodo de primer nivel (§1.8)
const flat = (list) => (list || []).flatMap((v) => (v.type === Fragment ? flat(v.children) : v.type === Comment || (v.type === Text && !String(v.children).trim()) ? [] : [v]))
const plain = (e) => !e.defaultPrevented && !e.button && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey

export default defineComponent({
  name: 'GNavBar',
  props: {
    items: { type: Array, default: () => [] },
    current: { type: String, default: null },
    label: String,
    labels: { type: Object, default: () => ({}) },
    id: String
  },
  emits: ['navigate'],
  setup(props, { emit, slots }) {
    const rid = props.id || `g-nav-bar-${useId()}`
    const shell = inject(appShellKey, null)
    const warned = new Set()
    const warn = (k, m) => { try { if (process.env.NODE_ENV !== 'production' && !warned.has(k)) { warned.add(k); console.warn(`[Grana GNavBar] ${m} (aviso ${k[0]}).`) } } catch {} }

    // ---------- Modelo: sin id, label o href se ignora (1); id repetido, gana el primero (2); activeMatch una vez (3) ----------
    const model = computed(() => {
      const out = []
      const seen = new Set()
      for (const it of props.items || []) {
        if (!it || !['id', 'label', 'href'].every((k) => String(it[k] ?? '').trim())) {
          try { if (process.env.NODE_ENV !== 'production') warn('1', 'elemento sin id, label o href: se ignora') } catch {}
          continue
        }
        if (seen.has(it.id)) {
          try { if (process.env.NODE_ENV !== 'production') warn(`2${it.id}`, `id «${it.id}» repetido: gana el primero`) } catch {}
          continue
        }
        seen.add(it.id)
        let re = null
        if (it.activeMatch) {
          try { re = new RegExp(it.activeMatch) } catch {
            try { if (process.env.NODE_ENV !== 'production') warn(`3${it.id}`, `activeMatch de «${it.id}» no compila: se usa href === current`) } catch {}
          }
        }
        out.push({ it, re })
      }
      return out
    })
    // La actual: la primera que casa; nunca un externo; sin current, ninguna
    const curId = computed(() => {
      const c = props.current
      const m = c == null ? null : model.value.find(({ it, re }) => !it.external && (re ? re.test(c) : it.href === c))
      return m ? m.it.id : null
    })
    try {
      if (process.env.NODE_ENV !== 'production') {
        if (!props.label) warn('4', 'falta label (nombre del nav)')
        if (!props.labels.more || !props.labels.menu) warn('6', 'faltan labels.more o labels.menu')
        watch(model, (m) => { if (!props.labels.newTab && m.some(({ it }) => it.external)) warn('5', 'un externo sin labels.newTab') }, { immediate: true })
      }
    } catch {}

    // ---------- Estado ----------
    const root = ref(null)
    const list = ref(null)
    const moreBtn = ref(null)
    const morePanel = ref(null)
    const toggle = ref(null)
    const screenEl = ref(null)
    const more = ref(false)
    const screen = ref(false)
    const top = ref(0)
    let lockWas = null

    const hideMore = () => { try { morePanel.value?.hidePopover() } catch {} }
    // Lo de detrás de la pantalla: con chasis, cover(); sin chasis, el documento no se desplaza
    const cover = (on) => {
      if (shell && shell.cover) return shell.cover(on)
      const s = document.documentElement.style
      if (on) { lockWas = s.overflow; s.overflow = 'hidden' } else if (lockWas !== null) { s.overflow = lockWas; lockWas = null }
    }
    const setScreen = (on) => {
      if (on === screen.value) return
      if (on) {
        const band = root.value.closest('.g-app-shell__header') || root.value
        top.value = Math.max(0, Math.round(band.getBoundingClientRect().bottom))
      }
      screen.value = on
      cover(on)
      if (on) nextTick(() => screenEl.value?.querySelector('a[href]')?.focus())
    }
    const closeAll = () => { hideMore(); setScreen(false) }
    watch(() => props.current, closeAll)

    // ---------- Enlaces y navigate (#505 con #574): un externo no lo emite; elegir cierra «…» y la pantalla ----------
    const onLink = (it, e) => {
      if (!it.external && plain(e) && !otherContext(it.target)) emit('navigate', { item: it, event: e })
      closeAll()
    }
    const link = (it, cls) => {
      const ext = it.external
      return h('a', {
        class: [cls, ext && `${cls}--external`],
        href: it.href,
        target: it.target || (ext ? '_blank' : undefined),
        rel: it.rel || (ext ? 'noreferrer' : undefined),
        lang: it.lang,
        hreflang: it.hreflang,
        'aria-current': it.id === curId.value ? 'page' : undefined,
        onClick: (e) => onLink(it, e)
      }, ext
        ? [it.label, h('span', { class: 'g-nav-bar__ext', 'aria-hidden': 'true' }, [h(GIcon, { name: 'arrow-up-right', class: 'g-icon--flip-rtl' })]), props.labels.newTab ? h('span', { class: 'g-nav-bar__sr' }, ` ${props.labels.newTab}`) : null]
        : it.label)
    }

    // ---------- Teclado: Esc cierra y devuelve el foco; la pantalla en bucle botón ↔ pantalla ----------
    const onKeydown = (e) => {
      if (e.key === 'Escape') {
        if (screen.value) {
          e.preventDefault()
          setScreen(false)
          toggle.value.focus()
        } else if (more.value) {
          hideMore()
          moreBtn.value.focus()
        }
        return
      }
      if (e.key !== 'Tab' || !screen.value) return
      const f = screenEl.value.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')
      const last = f[f.length - 1]
      const at = document.activeElement
      if (!e.shiftKey && (at === last || !f.length)) { e.preventDefault(); toggle.value.focus() }
      else if (e.shiftKey && at === toggle.value && last) { e.preventDefault(); last.focus() }
    }

    // ---------- Montaje: luz (P1), cortes del visor ----------
    let glide = null
    const mqs = []
    onMounted(() => {
      glide = createPointerGlide(list.value, { target: '.g-nav-bar__link' })
      for (const q of ['(min-width: 48rem)', '(min-width: 80rem)']) {
        const m = matchMedia(q)
        m.addEventListener('change', closeAll)
        mqs.push(m)
      }
    })
    onBeforeUnmount(() => {
      glide?.destroy()
      for (const m of mqs) m.removeEventListener('change', closeAll)
      if (screen.value) cover(false)
    })

    return () => {
      const items = model.value.map(({ it }) => it)
      const bar = flat(slots.actions?.({ place: 'bar' }))
      return h('div', { ref: root, class: ['g-nav-bar', screen.value && 'is-open'], id: rid, onKeydown }, [
        h('div', { class: 'g-nav-bar__brand' }, slots.brand?.()),
        h('div', { class: 'g-nav-bar__search' }, slots.search?.()),
        h('nav', { class: 'g-nav-bar__nav', 'aria-label': props.label }, [
          h('ul', { ref: list, class: 'g-nav-bar__list' }, [
            h('li', { class: 'g-nav-bar__highlight', 'aria-hidden': 'true', role: 'none' }),
            ...items.map((it) => h('li', { key: it.id }, [link(it, 'g-nav-bar__link')]))
          ])
        ]),
        h('div', { class: 'g-nav-bar__actions' }, bar.flatMap((v) => [h('span', { class: 'g-nav-bar__sep', 'aria-hidden': 'true' }), v])),
        h('div', { class: 'g-nav-bar__more' }, [
          h('button', { ref: moreBtn, class: 'g-nav-bar__more-btn', type: 'button', id: `${rid}-more-btn`, 'aria-expanded': String(more.value), 'aria-controls': `${rid}-more`, 'aria-label': props.labels.more, popovertarget: `${rid}-more` }, [h(GIcon, { name: 'ellipsis' })]),
          h('div', {
            ref: morePanel,
            class: 'g-nav-bar__more-panel',
            id: `${rid}-more`,
            popover: 'auto',
            // H2 (#1066): antes de abrir, para que el primer cuadro ya salga en su sitio; siempre (el CSS solo las usa sin anclaje).
            // Borde inferior del botón y distancia de su borde final al del visor, px ≥ 0 en bruto
            onBeforetoggle: (e) => {
              if (e.newState !== 'open') return
              const b = moreBtn.value.getBoundingClientRect()
              const p = morePanel.value.style
              p.setProperty('--_more-top', `${Math.max(0, Math.round(b.bottom))}px`)
              p.setProperty('--_more-end', `${Math.max(0, Math.round(getComputedStyle(root.value).direction === 'rtl' ? b.left : document.documentElement.clientWidth - b.right))}px`)
            },
            onToggle: (e) => { more.value = e.newState === 'open' },
            onClick: (e) => { if (e.target.closest('a')) hideMore() }
          }, slots.actions?.({ place: 'more' }))
        ]),
        h('button', { ref: toggle, class: 'g-nav-bar__toggle', type: 'button', id: `${rid}-toggle`, 'aria-expanded': String(screen.value), 'aria-controls': `${rid}-screen`, 'aria-label': props.labels.menu, onClick: () => setScreen(!screen.value) }, [h(GIcon, { name: screen.value ? 'x' : 'menu' })]),
        h('div', { ref: screenEl, class: 'g-nav-bar__screen', id: `${rid}-screen`, hidden: !screen.value, style: { '--_screen-top': `${top.value}px` } }, [
          h('nav', { class: 'g-nav-bar__screen-nav', 'aria-label': props.label }, [
            h('ul', { class: 'g-nav-bar__screen-list' }, items.map((it) => h('li', { key: it.id }, [link(it, 'g-nav-bar__screen-link')])))
          ]),
          h('div', { class: 'g-nav-bar__screen-actions' }, slots.actions?.({ place: 'screen' }))
        ])
      ])
    }
  }
})
</script>
