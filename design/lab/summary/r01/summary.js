// Ficha de resumen (nombre de trabajo GSummary) · motor de prototipo de r01 y r02 (kiwi). No es el componente: bruno escribe el .vue.
// Un solo render para la base y los conceptos A, B y C (prop `concept`). Componentes reales de dist/: GAvatar y GBadge.
// Lo que mide JS: (1) cuántos datos quedaron recortados → «+N» y data-clipped; (2) el tramo de `layout="auto"` por el ancho propio;
// (3) `title` nativo solo en lo que quedó con elipsis. Lo demás es CSS intrínseco (sin umbrales): ver summary.css.
(function () {
  const { h, defineComponent, ref, onMounted, onBeforeUnmount, onUpdated, nextTick, watch } = Vue
  const SIZE = { inline: 'xs', row: 'md', stack: 'lg', panel: 'xl' }
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches

  // Prioridad: número menor = más importante; sin `priority`, después de los que la declaran y en el orden del arreglo.
  const sortFacts = (facts) => facts.map((f, i) => ({ ...f, _i: i }))
    .sort((a, b) => { const pa = a.priority ?? 1e6, pb = b.priority ?? 1e6; return pa - pb || a._i - b._i })

  // Tramos de layout="auto": constantes de diseño derivadas de space (como GCard, #130). C añade la píldora.
  function tierOf(w, concept, space) {
    if (concept === 'A') return 'row'
    if (concept === 'C') return w < space * 50 ? 'inline' : w < space * 80 ? 'row' : w < space * 130 ? 'stack' : 'panel'
    return w < space * 60 ? 'row' : w < space * 130 ? 'stack' : 'panel'
  }

  // Duración y curva reales del tema (los tokens llevan calc() y linear(): se leen ya resueltos de una sonda)
  let motion
  function themeMotion() {
    if (motion) return motion
    const probe = document.createElement('span')
    probe.style.cssText = 'position:absolute;transition:opacity var(--g-duration-slow) var(--g-ease-spring)'
    document.body.append(probe)
    const cs = getComputedStyle(probe)
    motion = { duration: parseFloat(cs.transitionDuration) * 1000 || 240, easing: cs.transitionTimingFunction || 'ease-out' }
    probe.remove()
    return motion
  }

  let uid = 0
  const XSummary = defineComponent({
    name: 'XSummary',
    props: {
      title: String, subtitle: String, code: String, avatar: [Boolean, Object], icon: String,
      facts: { type: Array, default: () => [] }, status: Object, size: String,
      layout: { type: String, default: 'row' },      // inline | row | stack | panel | auto
      lines: { type: Number, default: 2 },           // líneas totales en row (título + datos); 0 = sin límite
      concept: { type: String, default: 'base' },    // base | A | B | C (solo prototipo)
      diff: Object,                                  // B: { rótulo: 'same' | 'diff' } entre homónimos vecinos
      heading: Boolean,                              // B: fila de rótulos de columna (decorativa)
      expandable: Boolean,                           // C: «+N» es un botón que abre la segunda cara
      surface: Boolean,                              // C: la ficha lleva su propia superficie
      loading: Boolean, empty: String, group: Boolean, labelMore: { type: String, default: 'Ver {n} datos más de {title}' }
    },
    setup(props, { slots }) {
      const root = ref(null), tier = ref(props.layout === 'auto' ? 'row' : props.layout), more = ref(0), open = ref(false)
      const id = 'su-' + (++uid)
      let ro, lastTier = tier.value, prevClipped = new Set()

      function measure() {
        const el = root.value; if (!el || props.loading) return
        const facts = [...el.querySelectorAll(':scope > .su__body .su__fact:not(.is-anchor)')]
        const moreEl = el.querySelector(':scope > .su__body .su__more')
        const flow = el.querySelector(':scope > .su__body .su__flow'), fbox = el.querySelector(':scope > .su__body .su__facts')
        const clip = [fbox, flow].find((x) => { if (!x) return false; const cs = getComputedStyle(x); return cs.display !== 'contents' && cs.overflowY !== 'visible' })
        const pass = () => {
          if (!clip) { facts.forEach((f) => f.removeAttribute('data-clipped')); return 0 }
          const cb = clip.getBoundingClientRect(); let n = 0
          facts.forEach((f) => {
            const r = f.getBoundingClientRect()
            const out = r.top >= cb.bottom - 1 || r.bottom > cb.bottom + 1 || r.width === 0
            f.toggleAttribute('data-clipped', out); if (out) n++
          })
          return n
        }
        // A: antes de soltar un dato, los rótulos que se explican solos (plain) dejan de verse
        if (props.concept === 'A') el.removeAttribute('data-terse')
        el.removeAttribute('data-tight')
        if (moreEl) moreEl.style.display = 'none'
        let n = pass()
        if (n && props.concept === 'A') { el.setAttribute('data-terse', ''); n = pass() }
        if (moreEl) { moreEl.style.display = ''; if (n) { moreEl.hidden = false; n = pass() } }
        const anc = el.querySelector(':scope > .su__body .su__fact.is-anchor')
        const body = el.querySelector(':scope > .su__body')
        const cut = anc && (() => { const v = anc.querySelector('.su__v').getBoundingClientRect(), a = anc.getBoundingClientRect(); return anc.scrollWidth > anc.clientWidth + 1 || v.right > a.right + 0.5 || v.left < a.left - 0.5 })()
        if (cut || body.scrollWidth > body.clientWidth + 1) { el.setAttribute('data-tight', ''); n = pass() }
        if (more.value !== n) more.value = n
        // A: lo que vuelve a caber entra con movimiento (uno a uno, sin salto de layout: el sitio ya es suyo)
        const now = new Set(facts.filter((f) => f.hasAttribute('data-clipped')))
        if (props.concept === 'A' && !reduced()) facts.forEach((f) => {
          if (prevClipped.has(f) && !now.has(f)) { f.setAttribute('data-enter', ''); f.addEventListener('animationend', () => f.removeAttribute('data-enter'), { once: true }) }
        })
        prevClipped = now
        // Elipsis: `title` nativo solo donde el texto quedó cortado (ayuda de puntero; el lector ya tiene el texto completo)
        el.querySelectorAll(':scope > .su__body :is(.su__title,.su__sub,.su__fact.is-anchor,.su__v)').forEach((t) => {
          if (t.scrollWidth > t.clientWidth + 1) t.title = t.textContent.replace(/;\s*$/, '').trim(); else t.removeAttribute('title')
        })
      }

      function snapshot() {
        const el = root.value; if (!el) return null
        return ['.su__lead', '.su__title'].map((s) => el.querySelector(':scope > ' + s + ', :scope > .su__body ' + s)?.getBoundingClientRect())
      }
      // C: continuidad de forma entre tramos (FLIP de identidad y título con la curva y la duración del tema)
      function morph(before) {
        const el = root.value; if (!el || !before || reduced()) return
        const { duration, easing } = themeMotion()
        ;['.su__lead', '.su__title'].forEach((s, i) => {
          const t = el.querySelector(':scope > ' + s + ', :scope > .su__body ' + s), a = before[i]; if (!t || !a) return
          const b = t.getBoundingClientRect(); if (!b.width || !a.width) return
          const dx = a.left - b.left, dy = a.top - b.top, sc = i === 0 ? a.height / b.height : 1
          if (Math.abs(dx) + Math.abs(dy) < 1 && sc === 1) return
          const frames = [{ transform: `translate(${dx}px,${dy}px) scale(${sc})` }, { transform: 'none' }]
          t.style.transformOrigin = getComputedStyle(el).direction === 'rtl' ? '100% 0' : '0 0'
          try { t.animate(frames, { duration, easing }) } catch { t.animate(frames, { duration, easing: 'ease-out' }) }
        })
      }

      function resize() {
        const el = root.value; if (!el) return
        const w = el.getBoundingClientRect().width
        const space = parseFloat(getComputedStyle(el).getPropertyValue('--g-space-1')) || 4
        if (props.concept === 'B') el.toggleAttribute('data-narrow', w < space * 100)
        if (props.layout === 'auto') {
          const t = tierOf(w, props.concept, space)
          if (t !== tier.value) {
            const before = props.concept === 'C' ? snapshot() : null
            tier.value = t; lastTier = t
            nextTick(() => { morph(before); measure() })
            return
          }
        }
        measure()
      }

      onMounted(() => {
        // El cambio de tramo altera el alto observado: se aplaza un cuadro para no reentrar en el mismo ciclo del observador (aviso de WebKit)
        let raf = 0
        ro = new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(resize) }); ro.observe(root.value); resize()
        if (document.fonts?.ready) document.fonts.ready.then(measure)
      })
      onUpdated(measure)
      onBeforeUnmount(() => ro?.disconnect())
      watch(() => props.layout, (l) => { tier.value = l === 'auto' ? lastTier : l; nextTick(resize) })

      // C · segunda cara: la ficha siguiente (stack) en una capa anclada, sin navegar
      function toggleFace(e) {
        const pop = document.getElementById(id + '-face'); if (!pop) return
        if (pop.matches(':popover-open')) { pop.hidePopover(); return }
        const r = root.value.getBoundingClientRect()
        pop.style.setProperty('--_x', Math.max(8, Math.min(r.left, innerWidth - 328)) + 'px')
        pop.style.setProperty('--_y', (r.bottom + 4) + 'px')
        pop.showPopover()
      }

      return () => {
        const L = tier.value, size = props.size || SIZE[L]
        const all = sortFacts(props.facts), anchor = props.code ? null : all[0], rest = anchor ? all.slice(1) : all
        const fl = props.lines > 0 ? Math.max(1, props.lines - 1) : 0
        const multi = L === 'row' && (props.lines === 0 || fl > 1)
        const cls = ['su', 'su--' + L, 'su--size-' + size, props.loading && 'su--loading', props.empty && !props.title && 'su--empty', props.heading && 'su--heading', props.surface && 'su--surface']
        const attrs = { ref: root, class: cls, 'data-concept': props.concept, 'data-tier': L, style: { '--_fl': fl || 1 } }
        if (multi) attrs['data-multi'] = ''
        if (multi && props.lines === 0) attrs['data-free'] = ''
        if (props.heading) attrs['aria-hidden'] = 'true'
        if (props.group) { attrs.role = 'group'; attrs['aria-labelledby'] = id + '-t' }
        if (props.loading) {
          attrs['aria-busy'] = 'true'
          return h('span', attrs, [
            h('span', { class: 'su__lead', 'aria-hidden': 'true' }, h('span', { class: 'su__bone' })),
            h('span', { class: 'su__body', 'aria-hidden': 'true' }, [h('span', { class: 'su__bone', style: { inlineSize: '60%' } }), L !== 'inline' && h('span', { class: 'su__bone', style: { inlineSize: '85%' } })])
          ])
        }
        if (!props.title) return h('span', attrs, h('span', { class: 'su__body' }, h('span', { class: 'su__head' }, h('span', { class: 'su__title' }, props.empty || ''))))

        const sep = () => h('span', { class: 'su-sr' }, '; ')
        const fact = (f, isAnchor) => h('span', { key: f.label, class: ['su__fact', isAnchor && 'is-anchor', f.plain && 'is-plain', props.diff && props.diff[f.label] && 'is-' + props.diff[f.label]], 'data-key': f.label },
          [h('span', { class: 'su__k' }, f.short || f.label), ' ', h('span', { class: 'su__v' }, f.value), sep()])
        const lead = props.heading ? h('span', { class: 'su__lead', 'aria-hidden': 'true' }, h('span', { class: 'su__ghost' }))
          : props.avatar ? h('span', { class: 'su__lead', 'aria-hidden': 'true' }, h(Grana.GAvatar, { name: (props.avatar && props.avatar.name) || props.title, src: props.avatar && props.avatar.src, size, categories: 8 }))
          : props.icon ? h('span', { class: 'su__lead', 'aria-hidden': 'true', innerHTML: window.lucide(props.icon) }) : null
        const moreTxt = '+' + more.value
        const moreNode = props.expandable && L !== 'stack' && L !== 'panel'
          ? h('button', { type: 'button', class: 'su__more su__more--btn', hidden: more.value === 0, 'aria-controls': id + '-face', 'aria-expanded': String(open.value), onClick: toggleFace },
            [h('span', { 'aria-hidden': 'true' }, moreTxt), h('span', { class: 'su-sr' }, props.labelMore.replace('{n}', more.value).replace('{title}', props.title))])
          : h('span', { class: 'su__more', hidden: more.value === 0, 'aria-hidden': 'true' }, moreTxt)
        const face = props.expandable ? h('span', { id: id + '-face', class: 'su-face', popover: 'auto', role: 'group', 'aria-label': props.title, onToggle: (e) => { open.value = e.newState === 'open' } },
          open.value ? h(XSummary, { ...props, layout: 'stack', size: 'lg', expandable: false, surface: false, concept: 'base' }) : null) : null

        return h('span', attrs, [
          lead,
          h('span', { class: 'su__body' }, [
            h('span', { class: 'su__head' }, [
              h('span', { class: 'su__name' }, [
                props.code && h('span', { class: 'su__code' }, [props.code, h('span', { class: 'su-sr' }, ' ')]),
                h('span', { class: 'su__title', id: id + '-t' }, [props.title, sep()])
              ]),
              props.status && h('span', { class: 'su__status' }, [h(Grana.GBadge, { color: props.status.color || 'neutral', size: 'sm' }, () => props.status.label), sep()])
            ]),
            props.subtitle && h('span', { class: 'su__sub' }, [props.subtitle, sep()]),
            all.length ? h('span', { class: 'su__data' }, [
              h('span', { class: 'su__flow' }, [
                anchor && fact(anchor, true),
                rest.length ? h('span', { class: 'su__facts' }, rest.map((f) => fact(f, false))) : null
              ]),
              moreNode
            ]) : null
          ]),
          slots.action && (L === 'stack' || L === 'panel') ? h('span', { class: 'su__action' }, slots.action()) : null,
          face
        ])
      }
    }
  })

  // B · qué distingue entre homónimos: por cada grupo de fichas con el mismo título, un dato es «diff» si su valor es único en el grupo y «same» si lo comparte con otra
  function diffOf(list) {
    const by = new Map()
    list.forEach((it) => { const k = (it.title || '').toLocaleLowerCase(); (by.get(k) || by.set(k, []).get(k)).push(it) })
    return list.map((it) => {
      const twins = by.get((it.title || '').toLocaleLowerCase()); if (twins.length < 2) return null
      const out = {}
      ;(it.facts || []).forEach((f) => {
        const shared = twins.filter((t) => (t.facts || []).find((x) => x.label === f.label)?.value === f.value).length
        out[f.label] = shared > 1 ? 'same' : 'diff'
      })
      return out
    })
  }

  window.SummaryLab = { XSummary, diffOf, sortFacts, tierOf }
})()
