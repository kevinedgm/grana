// GPageIndex · forma `list` y su plegada `fold` (interno; dueño: bruno). NO es API pública: la pinta GPageIndex cuando la
// extensión `@grana/vue/page-index-list` está instalada (page-index.md «Forma `list`», DECISIONS.md #1054). El motor
// (lectura, elegida sostenida, `navigate`, foco al destino) se queda en GPageIndex y llega por `ctl`; aquí van la lista,
// el marcador, la plegada, PI-P1 (la columna se sigue sola) y PI-L5 (la instancia sin cajas no lee ni emite).
// Estilo: GPageIndex.css (coco). Geometría del marcador en la capa que la pinta (--_marker-y/-h en __marker, #964).
import { defineComponent, h, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import GIcon from '../GIcon/GLibIcon.js'

const mod = (e) => e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey

export default defineComponent({
  props: { p: Object, cur: String, all: Array, rid: String, attrs: Object, ctl: Object },
  setup(props) {
    const root = ref()
    const scroll = ref()
    const marker = ref()
    const btn = ref()
    const open = ref(false)
    const lit = ref(false) // has-current: hay actual a la vista y ya se leyó una vez
    const instant = ref(0) // is-instant mientras no es 0 (dos cuadros)
    const P = props.p
    const ctl = props.ctl
    // PI-L5: sin cajas (la maqueta enseña la otra instancia), el motor no lee ni emite
    ctl.gate = () => !root.value?.getClientRects().length

    // Marcador y PI-P1. Todas las cajas se leen antes de escribir (#964)
    const place = (now, inner) => {
      const a = !P.fold && root.value?.querySelector('[aria-current]')
      if (!a || ctl.gate()) return (lit.value = false)
      const sc = scroll.value
      const m = marker.value
      const ab = a.getBoundingClientRect()
      const bb = m.parentNode.getBoundingClientRect()
      const sb = sc.getBoundingClientRect()
      if (now) {
        const t = (instant.value = now + instant.value)
        requestAnimationFrame(() => requestAnimationFrame(() => { if (t === instant.value) instant.value = 0 }))
      }
      // La fila actual respecto del borde de relleno de __body; el CSS dibuja el marcador centrado en ella (coco)
      m.style.cssText = `--_marker-y:${Math.round(ab.top - bb.top - m.parentNode.clientTop)}px;--_marker-h:${Math.round(ab.height)}px`
      lit.value = ab.bottom > sb.top + 1 && ab.top < sb.bottom - 1
      // PI-P1: trae la actual a la vista DENTRO de la columna, nunca la página; quien mira la lista manda (#358 regla 4)
      if (inner || sc.matches(':hover') || sc.contains(document.activeElement)) return
      const g = ab.height * 2
      const d = ab.top < sb.top + g ? ab.top - sb.top - g : ab.bottom > sb.bottom - g ? ab.bottom - sb.bottom + g : 0
      if (d) sc.scrollBy({ top: d, behavior: now || matchMedia('(prefers-reduced-motion: reduce)').matches || Math.abs(d) > sb.height ? 'instant' : 'smooth' })
    }
    let raf = 0
    const later = (now, inner) => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => place(now, inner)) }
    watch(() => props.cur, () => nextTick(later))
    // por las id (`all` es un arreglo nuevo en cada pintado del padre)
    watch(() => props.all.map((i) => i.id).join(), () => { open.value = false; nextTick(() => later(1)) })

    // «Volver arriba»: documento (o scroller) a 0, cierra y el foco al h1 de main (o main, o el botón)
    const toTop = (e) => {
      if (mod(e)) return
      e.preventDefault()
      open.value = false
      const s = P.scroller
      ;((typeof s === 'string' ? document.querySelector(s) : s) || window).scrollTo({ top: 0 })
      const t = document.querySelector('main h1') || document.querySelector('main') || btn.value
      if (t.tabIndex < 0 && !t.hasAttribute('tabindex')) t.setAttribute('tabindex', -1)
      t.focus({ preventScroll: true })
    }
    // Plegada: disclosure; Esc devuelve el foco al botón, pulsar fuera cierra
    const onDoc = (e) => { if (!root.value.contains(e.target)) open.value = false }
    const onKey = (e) => {
      if (e.key === 'Escape' && open.value) {
        e.preventDefault()
        open.value = false
        btn.value.focus()
      }
    }
    const resize = () => later(1)
    onMounted(() => {
      try {
        if (process.env.NODE_ENV !== 'production') {
          if (P.fold && !P.labels.top) console.warn('[Grana GPageIndex] fold sin labels.top (aviso 10).')
          if (P.items.some((it) => it && it.level != null && it.level !== 2 && it.level !== 3)) console.warn('[Grana GPageIndex] level fuera de 2 o 3: cuenta como 2 (aviso 9).')
        }
      } catch {}
      document.addEventListener('pointerdown', onDoc, true)
      addEventListener('resize', resize)
      later(1)
    })
    onBeforeUnmount(() => {
      cancelAnimationFrame(raf)
      document.removeEventListener('pointerdown', onDoc, true)
      removeEventListener('resize', resize)
      ctl.gate = null
    })

    // ---------- Pintado ----------
    // Elegir: guarda de #505 (clic primario sin modificadores); el motor emite navigate y lleva el foco al destino
    const link = (it) => h('a', {
      class: 'g-page-index__link',
      href: it.href || `#${it.id}`,
      dir: 'auto',
      title: it.label,
      'aria-current': it.id === props.cur ? 'location' : undefined,
      onClick: (e) => { if (!e.defaultPrevented && !mod(e)) { open.value = false; ctl.go(it.id, e) } }
    }, it.label)
    const li = (it, k) => h('li', { key: it.id }, [link(it), k?.length ? h('ul', { class: 'g-page-index__sub' }, k.map((c) => li(c))) : null])

    return () => {
      const { rid, attrs } = props
      const fold = P.fold
      // Árbol de dos niveles: un 3 cuelga del 2 anterior; un 3 sin 2 previo va a la raíz
      const top = []
      for (const it of props.all) {
        if (it.level === 3 && top.length) top[top.length - 1].k.push(it)
        else top.push({ it, k: [] })
      }
      const list = h('div', { ref: scroll, class: 'g-page-index__scroll', tabindex: -1, onScroll: () => later(1, 1) }, [
        h('ul', { class: 'g-page-index__list' }, top.map(({ it, k }) => li(it, k)))
      ])
      return h('nav', {
        ...attrs,
        ref: root,
        id: rid,
        class: ['g-page-index g-page-index--appearance-list', fold ? ['g-page-index--fold', `g-page-index--align-${P.align === 'start' ? 'start' : 'end'}`, open.value && 'is-open'] : [lit.value && 'has-current', instant.value && 'is-instant'], attrs.class],
        'aria-labelledby': `${rid}-${fold ? 'fold' : 'title'}`,
        onKeydown: onKey
      }, fold
        ? [
            h('button', { ref: btn, class: 'g-page-index__fold', id: `${rid}-fold`, type: 'button', 'aria-expanded': `${open.value}`, 'aria-controls': `${rid}-drop`, onClick: () => { open.value = !open.value } }, [
              h('span', { dir: 'auto' }, P.label),
              h('span', { class: 'g-page-index__chev', 'aria-hidden': 'true' }, [h(GIcon, { name: 'chevron-right', class: 'g-icon--flip-rtl' })])
            ]),
            h('div', { class: 'g-page-index__drop', id: `${rid}-drop`, hidden: !open.value }, [h('a', { class: 'g-page-index__top', href: '#', onClick: toTop }, P.labels.top), list])
          ]
        : [h('div', { class: 'g-page-index__body' }, [h('span', { ref: marker, class: 'g-page-index__marker', 'aria-hidden': 'true' }), h('p', { class: 'g-page-index__title', id: `${rid}-title`, dir: 'auto' }, P.label), list])])
    }
  }
})
