// Prototipo de kiwi (r01) del chasis de aplicación, la pila y la sección. NO es el .vue de bruno: es un banco para decidir
// estructura. Usa los componentes REALES de dist/ (GSidebar, GPageHeader, GBtn, GIcon) con Vue global; el chasis (LabAppShell),
// la pila (LabStack) y la sección (LabSection) son del prototipo y su CSS está en shell.css (solo tokens).
// ?c=base|A|B|C  &mode=auto|expanded|rail|navbar|drawer  &mobile=navbar|drawer  &overlay=1  &variant=floating
// &dir=rtl  &zone=header|side  &ph=0 (sin GPageHeader)  &theme=dark
;(function () {
  const { createApp, h, ref, computed, onMounted, onBeforeUnmount, provide, inject, defineComponent, nextTick } = Vue
  const Q = new URLSearchParams(location.search)
  const C = ['base', 'A', 'B', 'C'].includes(Q.get('c')) ? Q.get('c') : 'base'
  if (Q.get('dir') === 'rtl') document.documentElement.dir = 'rtl'
  if (Q.get('theme') === 'dark') document.documentElement.dataset.theme = 'dark'

  // Iconos: solo Lucide (design/lab/lucide-icons.js), en el formato de lucide-static que acepta createIcons
  const NAMES = ['house', 'inbox', 'table', 'users', 'settings', 'calendar', 'folder', 'chart-column', 'search', 'bell', 'panel-left', 'menu', 'plus', 'download']
  const icons = Grana.createIcons(NAMES.map((n) => `<svg class="lucide lucide-${n}" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${window.LUCIDE_ICONS[n]}</svg>`))

  // ---------------- Chasis (prototipo de GAppShell) ----------------
  const LabAppShell = defineComponent({
    name: 'LabAppShell',
    props: { concept: String, labels: Object, headerZone: String },
    setup (props, { slots }) {
      const root = ref(null)
      const yielded = ref(false)
      const pub = { top: 0, bottom: 0, publishes: 0 }
      // Registro de bordes (edgeReserve, interno de bruno): aquí solo se calcula lo que el chasis publicaría
      const publish = () => {
        const el = root.value
        if (!el) return
        const cs = getComputedStyle(el)
        const top = parseFloat(cs.getPropertyValue('--g-app-shell-top')) || 0
        const bottom = el.querySelector(':scope > .g-sidebar--mode-navbar') ? parseFloat(cs.getPropertyValue('--_as-bar')) || 0 : 0
        if (top !== pub.top || bottom !== pub.bottom) { pub.top = top; pub.bottom = bottom; pub.publishes++ }
      }
      let last = 0
      let acc = 0
      let t = 0
      const remeasure = () => { clearTimeout(t); t = setTimeout(() => { window.dispatchEvent(new Event('resize')); publish() }, 160) }
      const setYield = (v) => { if (yielded.value !== v) { yielded.value = v; remeasure() } }
      const onScroll = () => {
        publish()
        if (props.concept !== 'B') return
        const y = window.scrollY
        const dy = y - last
        last = y
        acc = Math.sign(dy) === Math.sign(acc) ? acc + dy : dy
        const unit = parseFloat(getComputedStyle(root.value).getPropertyValue('--g-space-1')) * 16 || 16
        const head = root.value.querySelector('.as__header')
        const stuck = root.value.querySelector('.g-page-header.is-stuck')
        if (y <= (head ? head.offsetHeight : 0)) return setYield(false)
        if (head && head.contains(document.activeElement)) return setYield(false)
        if (acc >= unit * 4 / 4 && stuck) setYield(true)
        else if (acc <= -unit) setYield(false)
      }
      const onFocusIn = (e) => { if (e.target.closest && e.target.closest('.as__header')) setYield(false) }
      const onResize = () => publish()
      onMounted(() => {
        last = window.scrollY
        window.addEventListener('scroll', onScroll, { passive: true })
        window.addEventListener('resize', onResize)
        document.addEventListener('focusin', onFocusIn)
        const ro = new ResizeObserver(publish)
        ro.observe(root.value)
        nextTick(publish)
        window.__as = { pub, get yielded () { return yielded.value }, ready: true }
      })
      onBeforeUnmount(() => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onResize); document.removeEventListener('focusin', onFocusIn) })
      return () => h('div', { ref: root, class: 'as', 'data-c': props.concept, 'data-yield': yielded.value ? '' : undefined }, [
        h('a', { class: 'as__skip', href: '#as-main', onClick: (e) => { e.preventDefault(); const m = document.getElementById('as-main'); m.focus({ preventScroll: true }); m.scrollIntoView({ block: 'start' }) } }, props.labels.skip),
        slots.header ? h('header', { class: 'as__header', 'data-g-zone': props.headerZone === 'brand' ? 'brand' : undefined }, slots.header()) : null,
        slots.nav ? slots.nav() : null,
        h('div', { class: 'as__frame', tabindex: props.concept === 'C' ? '-1' : undefined }, [ // C: desplazador con hijos enfocables (#570)
          h('main', { id: 'as-main', class: 'as__main', tabindex: '-1' }, slots.default ? slots.default() : null),
          slots.footer ? h('footer', { class: 'as__footer' }, slots.footer()) : null
        ])
      ])
    }
  })

  // ---------------- Pila (prototipo de GStack) ----------------
  const LabStack = defineComponent({
    name: 'LabStack',
    props: { as: { type: String, default: 'div' }, gap: { type: String, default: 'md' }, orientation: { type: String, default: 'vertical' }, horizontal: String, density: { type: String, default: 'default' }, divided: Boolean },
    setup (props, { slots, attrs }) {
      return () => h(props.as, { class: ['st', `st--gap-${props.gap}`, props.orientation === 'horizontal' && 'st--horizontal', props.horizontal && `st--h-${props.horizontal}`, props.density !== 'default' && `st--density-${props.density}`, props.divided && 'st--divided'] }, slots.default ? slots.default() : null)
    }
  })

  // ---------------- Sección (prototipo de GSection) ----------------
  const sectionKey = Symbol('section-depth')
  let uid = 0
  const LabSection = defineComponent({
    name: 'LabSection',
    props: { title: String, description: String, level: Number, landmark: Boolean, labels: Object },
    setup (props, { slots }) {
      // Nivel: el documento lo decide (h1 = encabezado de página → la primera sección es h2), anidado +1, tope h4.
      const parent = inject(sectionKey, 1)
      const level = computed(() => Math.min(4, Math.max(2, props.level || parent + 1)))
      provide(sectionKey, level.value)
      const id = `sec-${++uid}`
      return () => h('section', { class: 'sec', 'aria-labelledby': props.landmark ? `${id}-t` : undefined, 'data-level': level.value }, [
        h('div', { class: 'sec__head' }, [
          h('div', { class: 'sec__titles' }, [
            h(`h${level.value}`, { id: `${id}-t`, class: 'sec__title', dir: 'auto' }, props.title),
            props.description ? h('p', { class: 'sec__desc' }, props.description) : null
          ]),
          slots.actions ? h('div', { class: 'sec__actions', role: 'group', 'aria-label': props.labels && props.labels.actions }, slots.actions()) : null
        ]),
        h('div', { class: 'sec__body' }, slots.default ? slots.default() : null)
      ])
    }
  })

  const ITEMS = [
    { label: 'Principal', items: [{ id: 'home', label: 'Inicio', href: '#', icon: 'house' }, { id: 'inbox', label: 'Bandeja', href: '#', icon: 'inbox', badge: 12, badgeLabel: '12 sin leer' }] },
    { label: 'Laboratorio', items: [{ id: 'res', label: 'Resultados', href: '#', icon: 'table' }, { id: 'pol', label: 'Políticas', href: '#', icon: 'settings' }, { id: 'staff', label: 'Personal', href: '#', icon: 'users' }, { id: 'cal', label: 'Agenda', href: '#', icon: 'calendar' }] },
    { label: 'Informes', items: [{ id: 'rep', label: 'Reportes', icon: 'chart-column', children: [{ id: 'r1', label: 'Mensual', href: '#' }, { id: 'r2', label: 'Trimestral', href: '#' }] }, { id: 'arch', label: 'Archivo', href: '#', icon: 'folder' }] }
  ]
  const SB_LABELS = { collapse: 'Contraer la barra lateral', expand: 'Expandir la barra lateral', more: 'Más', moreActive: 'contiene la página actual', drawer: 'Navegación', close: 'Cerrar', search: 'Buscar', searchHint: '⌘K' }
  const LOREM = [
    'Un resultado sale sin revisión cuando todos sus analitos están dentro del intervalo de referencia, el control de calidad del lote pasó en las últimas ocho horas y no hay una nota clínica que pida revisión.',
    'Los valores críticos nunca salen solos: se llama al médico solicitante y la llamada queda registrada con hora, persona y medio. La política se revisa cada trimestre.',
    'Si cualquiera de las tres condiciones falla, el resultado espera a un firmante con permiso sobre el área. La espera se ve en la bandeja de cada firmante y en el tablero del área.'
  ]

  const app = createApp({
    setup () {
      const mode = ref(Q.get('mode') || 'auto')
      const active = ref('pol')
      const open = ref(false)
      const modeLog = ref('')
      const ph = Q.get('ph') !== '0'
      return { C, mode, active, open, modeLog, ph, ITEMS, SB_LABELS, LOREM, Q }
    },
    template: `
<lab-app-shell :concept="C" :labels="{ skip: 'Saltar al contenido' }" :header-zone="Q.get('zone') === 'header' ? 'brand' : 'none'">
  <template #header>
    <g-btn v-if="mode === 'drawer' || (modeLog === 'drawer')" id="menu-btn" variant="ghost" color="neutral" aria-label="Abrir la navegación" @click="open = true"><g-icon name="menu"></g-icon></g-btn>
    <p class="lab-brand"><span class="lab-mark" aria-hidden="true"></span><span>Laboratorio central</span></p>
    <div class="lab-tools">
      <g-btn id="hdr-search" variant="ghost" color="neutral" aria-label="Buscar"><g-icon name="search"></g-icon></g-btn>
      <g-btn id="hdr-bell" variant="ghost" color="neutral" aria-label="Avisos"><g-icon name="bell"></g-icon></g-btn>
    </div>
  </template>
  <template #nav>
    <g-sidebar id="sb" v-model="active" v-model:open="open" :items="ITEMS" label="Principal" :labels="SB_LABELS" :mode="mode" :mobile="Q.get('mobile') || 'navbar'"
      :overlay="Q.get('overlay') === '1'" :variant="Q.get('variant') === 'floating' ? 'floating' : 'fixed'" :data-g-zone="Q.get('zone') === 'side' ? 'brand' : undefined"
      @mode-change="modeLog = $event.mode" @navigate="$event.event.preventDefault(); active = $event.item.id">
      <template #logo="{ collapsed }"><span class="lab-mark" aria-hidden="true"></span><span v-if="!collapsed">Grana</span></template>
      <template #toggle-icon><g-icon name="panel-left"></g-icon></template>
      <template #more-icon><g-icon name="menu"></g-icon></template>
    </g-sidebar>
  </template>

  <div class="lab-col lab-page" id="col">
    <g-page-header v-if="ph" id="ph" title="Políticas de validación" eyebrow="Configuración" description="Reglas que deciden cuándo un resultado sale sin revisión manual y quién firma cuando no." :labels="{ actions: 'Acciones de la página' }">
      <template #actions="{ narrow }">
        <g-btn id="ph-pub" color="brand">Publicar cambios</g-btn>
        <g-btn v-if="!narrow" variant="outline" color="neutral">Ver historial</g-btn>
      </template>
    </g-page-header>
    <p v-else class="lab-p" style="padding-block:24px"><b>Sin encabezado de página</b></p>

    <lab-stack id="page-stack" gap="lg" style="padding-block-start: 24px">
      <lab-section id="s1" title="Liberación automática" description="Qué condiciones dejan salir un resultado sin firma." :labels="{ actions: 'Acciones de la sección' }">
        <template #actions><g-btn id="s1-act" size="sm" variant="outline" color="neutral"><g-icon name="plus"></g-icon> Añadir regla</g-btn></template>
        <lab-stack id="st-md">
          <p class="lab-p" id="anchor">{{ LOREM[0] }}</p>
          <p class="lab-p" id="p2">{{ LOREM[1] }}</p>
          <p class="lab-p">{{ LOREM[2] }}</p>
        </lab-stack>
        <lab-section id="s1a" title="Condiciones por área" description="Anidada: el nivel sube solo (h3) y el título baja un rol.">
          <lab-stack id="st-sm" gap="sm">
            <div class="lab-card" id="c1">Hematología: intervalo por edad y sexo.</div>
            <div class="lab-card" id="c2">Química: control de calidad del lote vigente.</div>
            <div class="lab-card" id="c3">Microbiología: siempre con firma.</div>
          </lab-stack>
          <lab-section id="s1b" title="Excepciones" description="Segundo nivel anidado (h4).">
            <p class="lab-p">Las excepciones se firman una a una.</p>
          </lab-section>
        </lab-section>
      </lab-section>

      <lab-section id="s2" title="Firmantes" landmark description="Con landmark: región con nombre (opt-in).">
        <lab-stack id="st-h" orientation="horizontal" gap="sm">
          <span class="lab-chip">Dra. Rebeca Solís Montaño</span><span class="lab-chip">Dr. Hugo Mora</span><span class="lab-chip">Q. F. B. Paula Ríos Hernández</span><span class="lab-chip">Dra. Elena Vidal</span><span class="lab-chip">Dr. Iván Soto Cruz</span>
        </lab-stack>
        <lab-stack id="st-div" divided gap="md" density="compact">
          <div id="d1">Turno matutino · 07:00 a 15:00</div>
          <div id="d2">Turno vespertino · 15:00 a 23:00</div>
          <div id="d3">Turno nocturno · 23:00 a 07:00</div>
        </lab-stack>
      </lab-section>

      <lab-section id="s3" title="Historial" description="Contenido largo para desplazar.">
        <lab-stack gap="sm">
          <div v-for="n in 40" :key="n" class="lab-row" :id="'row-' + n" :style="{ inlineSize: (100 - (n % 7) * 8) + '%' }"></div>
          <g-btn id="far-btn" variant="outline" color="neutral">Botón lejano</g-btn>
          <div v-for="n in 10" :key="'b' + n" class="lab-row" :style="{ inlineSize: (100 - (n % 5) * 10) + '%' }"></div>
        </lab-stack>
      </lab-section>
    </lab-stack>
  </div>

  <template #footer>Laboratorio central · política vigente 2026-10</template>
</lab-app-shell>
<div class="lab-readout" aria-hidden="true">{{ C }} · {{ modeLog }}</div>`
  })
  app.component('LabAppShell', LabAppShell)
  app.component('LabStack', LabStack)
  app.component('LabSection', LabSection)
  app.use(Grana.default || Grana)
  app.use(icons)
  if (window.GranaPageHeader) app.use(GranaPageHeader.default || GranaPageHeader)
  app.mount('#app')
})()
