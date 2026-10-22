// Banco de estilo de GResourceList (coco). Ver la cabecera de estilo-banco.html. Estado público en window.__rl (lo lee
// estilo-verificar.mjs). XResourceList NO es el block: solo pinta el marcado de contrato con los componentes reales.
;(() => {
  const { createApp, ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } = Vue
  const Q = new URLSearchParams(location.search)
  const VIEW = Q.get('view') || 'block'
  const STATE = Q.get('state') || 'rest'
  if (Q.get('dark') === '1') document.documentElement.dataset.theme = 'dark'
  if (Q.get('rtl') === '1') document.documentElement.dir = 'rtl'
  if (Q.get('theme')) document.getElementById('gen').href = `../tema-oscuro/dark-color-presence/generated/${Q.get('theme')}.css`
  const svg = (n) => `<svg class="g-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${window.LUCIDE_ICONS[n]}</svg>`
  const fill = (t, o = {}) => (typeof t === 'function' ? t(o) : String(t ?? '').replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? '')))
  const W = window.__rl = reactive({ ready: false, narrow: false, view: VIEW, state: STATE })

  // ---- Datos de la aplicación (tinas de un palenque; deterministas) ----
  const ESTADOS = [
    { value: 'fermentando', label: 'Fermentando', phrase: 'fermentando' },
    { value: 'lista', label: 'Lista para destilar', phrase: 'listas para destilar' },
    { value: 'destilando', label: 'Destilando', phrase: 'destilando' },
    { value: 'limpieza', label: 'En limpieza', phrase: 'en limpieza' },
    { value: 'vacia', label: 'Vacía', phrase: 'vacías' }
  ]
  const ESTADO = Object.fromEntries(ESTADOS.map((e) => [e.value, e.label]))
  const AGAVES = ['Espadín', 'Tobalá', 'Tepeztate', 'Cuishe', 'Madrecuishe', 'Arroqueño']
  const MAESTROS = ['Aurelio Cruz', 'Rosa Martínez', 'Fidel Hernández', 'Lucía Santiago', 'Tomás Pérez']
  const ROWS = [
    ['T-07', 'fermentando', 'Tobalá', 11, 'Rosa Martínez'], ['T-12', 'fermentando', 'Espadín', 10, 'Aurelio Cruz'],
    ['T-03', 'lista', 'Tepeztate', 8, 'Fidel Hernández'], ['T-21', 'fermentando', 'Cuishe', 6, 'Lucía Santiago'],
    ['T-15', 'destilando', 'Espadín', null, 'Tomás Pérez'], ['T-02', 'fermentando', 'Madrecuishe', 4, 'Rosa Martínez'],
    ['T-30', 'limpieza', '—', null, 'Aurelio Cruz'], ['T-18', 'fermentando', 'Arroqueño', 3, 'Fidel Hernández'],
    ['T-09', 'vacia', '—', null, 'Lucía Santiago'], ['T-26', 'lista', 'Espadín', 9, 'Tomás Pérez']
  ].map(([id, estado, agave, dias, maestro]) => ({ id, codigo: id, estado, agave, dias, maestro }))
  const status = (r) => (r.estado === 'fermentando' && r.dias > 9 ? { status: 'error', text: 'Pasa de 9 días', key: 'dias' } : null)
  const COLUMNS = [
    { key: 'tina', label: 'Tina', title: 'codigo', subtitle: 'agave', primary: true, min: 36 },
    { key: 'estado', label: 'Estado', format: (v) => ESTADO[v] },
    { key: 'dias', label: 'Días', align: 'end', min: 16, format: (v) => (v == null ? '—' : v + ' d') },
    { key: 'maestro', label: 'Maestro mezcalero', min: 32 }
  ]
  const FACETS = [
    { id: 'atencion', label: 'Requieren atención', filter: { key: 'atencion', op: 'is', value: true }, count: 8, pinned: true, icon: 'triangle-alert' },
    { id: 'fermentando', label: 'Fermentando', filter: { key: 'estado', op: 'in', value: ['fermentando'] }, count: 21 },
    { id: 'lista', label: 'Listas', filter: { key: 'estado', op: 'in', value: ['lista'] }, count: 10 },
    { id: 'destilando', label: 'Destilando', filter: { key: 'estado', op: 'in', value: ['destilando'] }, count: 3 },
    { id: 'limpieza', label: 'En limpieza', filter: { key: 'estado', op: 'in', value: ['limpieza'] }, count: 4 },
    { id: 'vacia', label: 'Vacías', filter: { key: 'estado', op: 'in', value: ['vacia'] }, count: 8 }
  ]
  const BLANKS = [
    { id: 'estado', key: 'estado', label: 'Estado', any: { label: 'Cualquier estado', phrase: 'en cualquier estado' }, options: ESTADOS },
    { id: 'agave', key: 'agave', label: 'Agave', any: { label: 'Cualquier agave', phrase: 'cualquier agave' }, options: AGAVES.map((a) => ({ value: a, label: a })) },
    { id: 'maestro', key: 'maestro', label: 'Maestro mezcalero', any: { label: 'Cualquiera', phrase: 'cualquier maestro' }, options: MAESTROS.map((a) => ({ value: a, label: a })) },
    { id: 'orden', type: 'sort', label: 'Orden', options: [
      { value: 'atencion', label: 'Lo que pide atención primero', phrase: 'lo que pide atención primero' },
      { value: 'dias', label: 'Las de más días primero', phrase: 'las de más días primero' }
    ] }
  ]
  const TPL = 'Tinas {estado} de {agave} a cargo de {maestro}, {orden}.'
  const TABLE_LABELS = {
    selectAll: 'Seleccionar las tinas de esta página', selectRow: 'Seleccionar {title}', rowActions: 'Acciones de {title}', actionsHeader: 'Acciones',
    selectedCount: '{count} seleccionadas',
    sortBy: 'Ordenar por', ascending: 'ascendente', descending: 'descendente', sorted: 'Ordenado por {label}, {direction}',
    loading: 'Cargando tinas…', slow: 'Sigue cargando las tinas…', results: (o) => (o.count === 1 ? '1 tina' : o.count + ' tinas'), range: 'Tinas {from} a {to} de {total}',
    failed: 'No se pudieron cargar las tinas.', retry: 'Reintentar', empty: 'Aún no hay tinas', emptyFiltered: 'Ninguna tina cumple esta consulta', clearFilters: 'Quitar todos',
    pagination: { nav: 'Páginas de tinas', previous: 'Página anterior', next: 'Página siguiente', page: 'Página {page}', range: '{from}–{to} de {total}', compact: 'Página {page} de {pages}', pageSize: 'Tinas por página' }
  }
  const MENU_LABELS = {}

  // =====================================================================================================
  // XResourceList: el marcado del contrato
  // =====================================================================================================
  const XResourceList = {
    props: { tabs: Boolean },
    setup (props) {
      const root = ref(null)
      const space = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-space-1')) || 4
      // Estimación antes del primer pintado (contrato «Responsive»): el ancho del visor; luego el ResizeObserver de la raíz
      const narrow = ref(window.innerWidth < space() * 150)
      let ro
      onMounted(() => {
        ro = new ResizeObserver(([e]) => { narrow.value = e.contentRect.width < space() * 150; W.narrow = narrow.value })
        ro.observe(root.value)
        W.narrow = narrow.value
      })
      onBeforeUnmount(() => ro && ro.disconnect())

      const values = reactive({ estado: STATE === 'filtered' ? 'destilando' : null, agave: STATE === 'filtered' ? 'Tobalá' : null, maestro: null, orden: 'atencion' })
      const menus = reactive({})
      const pressed = (f) => (f.filter.key === 'estado' ? values.estado === f.filter.value[0] : (f.filter.key === 'atencion' ? !!values.atencion : false))
      const toggleFacet = (f) => {
        if (f.filter.key === 'estado') values.estado = pressed(f) ? null : f.filter.value[0]
        else values.atencion = !values.atencion
      }
      // En estrecho: a la vista las fijadas y las que no tienen hueco de su clave; las demás se pliegan en su hueco
      const visibleFacets = computed(() => (narrow.value ? FACETS.filter((f) => f.pinned || !BLANKS.some((b) => b.key === f.filter.key)) : FACETS))
      const folded = (b) => narrow.value && FACETS.some((f) => !f.pinned && f.filter.key === b.key)
      const optLabel = (b, o) => {
        const f = folded(b) && FACETS.find((x) => x.filter.key === b.key && x.filter.value[0] === o.value)
        return f ? `${o.label} · ${f.count}` : o.label
      }
      const blankText = (b) => {
        const v = values[b.id]
        if (v == null) return b.any.phrase
        const o = b.options.find((x) => x.value === v)
        return o.phrase || o.label
      }
      const items = (b) => [{ type: 'group', label: b.label, items: [
        ...(b.any ? [{ id: '__any', type: 'radio', label: b.any.label, checked: values[b.id] == null }] : []),
        ...b.options.map((o) => ({ id: String(o.value), type: 'radio', label: optLabel(b, o), checked: values[b.id] === o.value }))
      ] }]
      // Lo que hará el .vue: la palabra que nace del gesto en el hueco lleva is-entering mientras siga siendo esa palabra
      // ({ id, texto }); quitar la clase antes cortaría la animación. Si otra vía cambia la palabra, el texto ya no casa
      const entering = ref(null)
      const pick = (b, e) => { values[b.id] = e.id === '__any' ? null : (b.options.find((o) => String(o.value) === e.id)?.value ?? null); entering.value = { id: b.id, text: blankText(b) } }
      // Plantilla → trozos (texto fijo y huecos), sin coser fragmentos
      const parts = computed(() => TPL.split(/(\{\w+\})/).filter(Boolean).map((t) => { const m = t.match(/^\{(\w+)\}$/); return m ? { blank: BLANKS.find((b) => b.id === m[1]) } : { text: t } }))

      const selected = ref(STATE === 'selected' || STATE === 'armed' ? ['T-07', 'T-12'] : [])
      const armed = ref(STATE === 'armed')
      // Salida del contrato («Selección», estrecho): si la barra cambiara de líneas, masivas de solo icono. ?bulkicons=0 la quita
      const iconBulk = computed(() => narrow.value && Q.get('bulkicons') !== '0')
      const rows = computed(() => (STATE === 'empty' || STATE === 'filtered' ? [] : ROWS))
      const total = computed(() => (STATE === 'empty' || STATE === 'filtered' ? 0 : 46))
      const hasQueryRegion = computed(() => STATE !== 'empty' && STATE !== 'forbidden')
      const rowItems = () => [
        { id: 'edit', label: 'Editar', icon: 'pencil' }, { id: 'duplicate', label: 'Duplicar', icon: 'copy' },
        { type: 'separator' }, { id: 'remove', label: 'Dar de baja', icon: 'trash', danger: true }
      ]
      return { entering, iconBulk, root, narrow, values, menus, pressed, toggleFacet, visibleFacets, items, pick, blankText, parts, selected, armed, rows, total, hasQueryRegion, rowItems, fill, COLUMNS, TABLE_LABELS, MENU_LABELS, status, STATE, props }
    },
    template: /* html */ `
<div ref="root" class="g-resource-list" :class="{ 'is-narrow': narrow }">
  <g-page-header id="rl" title="Tinas de fermentación" description="Palenque Santa Catarina Minas · 46 tinas de madera de sabino." :labels="{ actions: 'Acciones de la página' }">
    <template v-if="props.tabs" #tabs><g-tabs :items="[{ id: 'a', label: 'Activas' }, { id: 'b', label: 'Archivadas' }]" model-value="a" detached :label="'Vistas de tinas'"></g-tabs></template>
    <template #actions="{ narrow: hn, docked }">
      <g-btn id="rl-create" :icon="hn && !docked" :aria-label="hn && !docked ? 'Registrar tina' : undefined" :tooltip="hn && !docked ? 'Registrar tina' : undefined">
        <g-icon v-if="hn && !docked" name="plus"></g-icon><template v-else>Registrar tina</template>
      </g-btn>
    </template>
  </g-page-header>

  <div class="g-resource-list__body">
    <g-empty v-if="STATE === 'forbidden'" cause="forbidden" title="No tienes acceso a las tinas de este palenque" description="Pídelo a la persona que administra el palenque." :heading-level="2"></g-empty>
    <template v-else>
      <div v-if="hasQueryRegion" class="g-resource-list__query" role="search" aria-label="Consulta de tinas">
        <div class="g-resource-list__facets" role="group" aria-label="Tinas por estado">
          <g-tag v-for="f in visibleFacets" :key="f.id" :data-facet="f.id" :pressed="pressed(f)" @update:pressed="toggleFacet(f)" :label="f.count + ' · ' + f.label">
            <template v-if="f.icon" #lead><g-icon :name="f.icon"></g-icon></template>
          </g-tag>
        </div>
        <p class="g-resource-list__phrase" id="rl-phrase"><template v-for="(pt, i) in parts" :key="i"><template v-if="pt.text">{{ pt.text }}</template><g-menu v-else :id="'rl-b-' + pt.blank.id" v-model="menus[pt.blank.id]" :items="items(pt.blank)" :label="pt.blank.label" close-on-select="always" @select="(e) => pick(pt.blank, e)"><template #trigger="{ attrs }"><button v-bind="attrs" type="button" class="g-resource-list__blank" :class="{ 'is-set': pt.blank.type === 'sort' || values[pt.blank.id] != null }" :data-blank="pt.blank.id"><span class="g-resource-list__blank-field">{{ pt.blank.label }}: </span><span class="g-resource-list__blank-text" :class="{ 'is-entering': entering && entering.id === pt.blank.id && entering.text === blankText(pt.blank) }" :key="blankText(pt.blank)">{{ blankText(pt.blank) }}</span><span class="g-resource-list__blank-chev" aria-hidden="true"><g-icon name="chevron-down"></g-icon></span></button></template></g-menu></template></p>
        <g-input class="g-resource-list__search" type="search" aria-label="Buscar tinas" placeholder="Buscar tina, agave o lote">
          <template #prepend><g-icon name="search"></g-icon></template>
        </g-input>
      </div>

      <g-table id="rl-table" aria-labelledby="rl-title" :columns="COLUMNS" :rows="rows" row-key="id" sort-mode="external" filter-mode="external"
        :total="total" :page="1" :page-size="10" :row-status="status" :labels="TABLE_LABELS" selectable v-model:selected="selected">
        <template #toolbar>
          <span v-if="!selected.length" class="g-resource-list__total">{{ total }} tinas</span>
          <div v-else class="g-resource-list__bulk" role="group" :aria-label="selected.length + ' seleccionadas'">
            <div v-if="armed" class="g-resource-list__bulk-confirm is-armed" role="group" :aria-label="'¿Dar de baja ' + selected.length + ' tinas?'">
              <g-btn id="rl-bulk-cancel" size="sm" variant="outline" color="neutral" @click="armed = false">Cancelar</g-btn>
              <g-btn id="rl-bulk-ok" size="sm" variant="solid" color="danger">Dar de baja {{ selected.length }}</g-btn>
            </div>
            <g-btn v-else id="rl-bulk-remove" size="sm" variant="outline" color="danger" :icon="iconBulk" :aria-label="iconBulk ? 'Dar de baja ' + selected.length : undefined" :tooltip="iconBulk ? 'Dar de baja ' + selected.length : undefined" @click="armed = true"><g-icon v-if="iconBulk" name="trash"></g-icon><template v-else>Dar de baja {{ selected.length }}</template></g-btn>
            <g-btn id="rl-bulk-clear" size="sm" variant="ghost" color="neutral" :icon="iconBulk" :aria-label="iconBulk ? 'Quitar selección' : undefined" :tooltip="iconBulk ? 'Quitar selección' : undefined" @click="selected = []; armed = false"><g-icon v-if="iconBulk" name="x"></g-icon><template v-else>Quitar selección</template></g-btn>
          </div>
        </template>
        <template #row-actions="{ row }">
          <g-menu :id="'rl-m-' + row.id" v-model="menus['m' + row.id]" :items="rowItems(row)" :label="'Acciones de ' + row.codigo" align="end">
            <template #trigger="{ attrs }"><g-btn v-bind="attrs" variant="ghost" color="neutral" size="sm" icon :aria-label="'Acciones de ' + row.codigo"><g-icon name="ellipsis-vertical"></g-icon></g-btn></template>
          </g-menu>
        </template>
        <template #empty>
          <g-empty v-if="STATE === 'filtered'" cause="filtered" title="Ninguna tina cumple esta consulta" :heading-level="2" :filters="[{ key: 'estado', label: 'Estado: destilando', count: 3 }]" :total="46"
            :labels="{ relax: 'Quitar «{label}»', returns: (o) => (o.count === 1 ? 'vuelve 1' : 'vuelven ' + o.count), clear: 'Quitar todos', before: 'Sin filtros hay {total} tinas.' }"></g-empty>
          <g-empty v-else cause="none" title="Aún no hay tinas registradas" description="Registra la primera para empezar a llevar sus fermentaciones." :heading-level="2">
            <template #actions><g-btn variant="outline" color="brand">Registrar la primera tina</g-btn></template>
          </g-empty>
        </template>
      </g-table>
    </template>
  </div>
</div>`
  }

  // La base: GPageHeader solo, con los mismos props (para comparar la distancia descripción → acción, #714)
  const XBase = {
    props: { tabs: Boolean },
    template: /* html */ `
<div class="x-base">
  <g-page-header id="rl" title="Tinas de fermentación" description="Palenque Santa Catarina Minas · 46 tinas de madera de sabino." :labels="{ actions: 'Acciones de la página' }">
    <template v-if="tabs" #tabs><g-tabs :items="[{ id: 'a', label: 'Activas' }, { id: 'b', label: 'Archivadas' }]" model-value="a" detached :label="'Vistas de tinas'"></g-tabs></template>
    <template #actions="{ narrow: hn, docked }">
      <g-btn id="rl-create" :icon="hn && !docked" :aria-label="hn && !docked ? 'Registrar tina' : undefined" :tooltip="hn && !docked ? 'Registrar tina' : undefined">
        <g-icon v-if="hn && !docked" name="plus"></g-icon><template v-else>Registrar tina</template>
      </g-btn>
    </template>
  </g-page-header>
</div>`
  }

  // Marcado ESTÁTICO de las enmiendas de GMenu (#718 motivo y par; #725 fila de búsqueda): las clases del contrato, con el
  // CSS real de dist/grana.css. La lista se abre como popover manual en su sitio (left/top fijos)
  const MENU_HTML = (id, x, body) => `<ul id="${id}" class="g-menu__list g-menu__list--density-default" role="menu" popover="manual" style="--_x:${x}px;--_y:96px" aria-label="Acciones de T-07">${body}</ul>`
  const item = (o) => `<li role="none"><button type="button" role="menuitem" class="g-menu__item${o.danger ? ' g-menu__item--danger' : ''}" ${o.disabled ? 'aria-disabled="true"' : ''} ${o.reason ? `aria-describedby="${o.id}-r"` : ''} id="${o.id}">${o.icon ? `<span class="g-menu__icon" aria-hidden="true">${svg(o.icon)}</span>` : ''}<span class="g-menu__label">${o.danger ? svg('triangle-alert').replace('class="g-icon"', 'class="g-icon g-menu__danger-icon"') : ''}${o.label}</span>${o.reason ? `<span class="g-menu__reason" id="${o.id}-r">${o.reason}</span>` : ''}</button></li>`
  const MenuStatic = {
    setup () {
      onMounted(() => {
        const host = document.getElementById('menus')
        host.innerHTML =
          MENU_HTML('m-reason', 24, `<li class="g-menu__highlight" role="none" aria-hidden="true"></li>` +
            item({ id: 'mr-edit', label: 'Editar', icon: 'pencil', disabled: true, reason: 'Tiene una lectura sin cerrar' }) +
            item({ id: 'mr-dup', label: 'Duplicar', icon: 'copy' }) +
            item({ id: 'mr-plain', label: 'Mover a otro palenque', disabled: true, reason: 'Solo quien administra puede moverla' }) +
            `<li role="separator" class="g-menu__separator"></li>` +
            item({ id: 'mr-rem', label: 'Dar de baja', icon: 'trash', danger: true, disabled: true, reason: 'Tiene mosto' })) +
          MENU_HTML('m-armed', 384, `<li class="g-menu__highlight" role="none" aria-hidden="true"></li>` +
            item({ id: 'ma-edit', label: 'Editar', icon: 'pencil' }) + item({ id: 'ma-dup', label: 'Duplicar', icon: 'copy' }) +
            `<li role="separator" class="g-menu__separator"></li>` +
            `<li role="none" class="is-armed" id="ma-li" style="--_armed-w:0px"><div class="g-menu__confirm" role="group" aria-label="¿Dar de baja la tina T-07?"><button type="button" role="menuitem" class="g-menu__confirm-cancel" id="ma-cancel">Cancelar</button><button type="button" role="menuitem" class="g-menu__confirm-ok" id="ma-ok">Dar de baja</button></div></li>`) +
          MENU_HTML('m-find', 744, `<li class="g-menu__highlight" role="none" aria-hidden="true"></li>` +
            `<li class="g-menu__find" role="none" aria-hidden="true" id="mf-find"><span class="g-menu__find-query">tob</span><span class="g-menu__find-count">1 agave</span></li>` +
            `<li role="none"><ul role="group" aria-label="Agave"><li role="none" class="g-menu__group-title" aria-hidden="true">Agave</li>` +
            AGAVES.map((a, i) => `<li role="none" ${a.toLowerCase().includes('tob') ? '' : 'hidden'}><button type="button" role="menuitemradio" aria-checked="${i === 1}" class="g-menu__item" id="mf-${i}"><span class="g-menu__mark" aria-hidden="true">${svg('circle')}</span><span class="g-menu__label">${a}</span></button></li>`).join('') +
            `</ul></li>`) +
          MENU_HTML('m-hint', 1104 - 360, '')
        document.getElementById('m-hint').remove()
        // Los armados: --_armed-w = ancho de la fila al armar (lo que hará el .vue); se mide la fila sin armar primero
        for (const id of ['m-reason', 'm-armed', 'm-find']) document.getElementById(id).showPopover()
        const li = document.getElementById('ma-li')
        const w = document.querySelector('#ma-edit').closest('li').getBoundingClientRect().width
        li.style.setProperty('--_armed-w', w + 'px')
        W.ready = true
      })
      return {}
    },
    template: `<div class="lab-static"><p class="lab-note">Enmiendas de GMenu (#718, #725) con marcado estático de sus clases: motivo de no disponible · par de confirmación armado · fila de búsqueda con filtro.</p><div id="menus"></div></div>`
  }

  // Pila de GFab que filtra (#725): marcado estático de la pila abierta (bottom-end), con la pista en la fila más alejada
  const FabStatic = {
    setup () {
      onMounted(() => {
        const host = document.getElementById('fab')
        const pill = (id, label, icon, hidden) => `<li role="none" ${hidden ? 'hidden' : ''}><button type="button" role="menuitem" class="g-fab__item" id="${id}"><span class="g-fab__icon" aria-hidden="true">${svg(icon)}</span><span class="g-fab__label">${label}</span></button></li>`
        host.innerHTML = `<div class="g-fab" data-position="bottom-end" data-anchor="viewport" data-state="open" data-appearance="stack">
          <ul class="g-fab__list g-fab__list--stack" role="menu" popover="manual" data-state="open" id="fab-list" aria-label="Acciones">
            <li class="g-fab__find" role="none" aria-hidden="true" id="fab-find"><span class="g-fab__find-query">re</span><span class="g-fab__find-count">2 acciones</span></li>
            ${pill('f1', 'Exportar', 'download', true)}${pill('f2', 'Registrar lectura', 'activity', false)}${pill('f3', 'Duplicar', 'copy', true)}${pill('f4', 'Registrar tina', 'plus', false)}
          </ul></div>`
        const list = document.getElementById('fab-list')
        list.showPopover()
        const r = list.getBoundingClientRect()
        list.style.setProperty('--_x', (innerWidth - r.width - 24) + 'px')
        list.style.setProperty('--_y', (innerHeight - r.height - 96) + 'px')
        W.ready = true
      })
      return {}
    },
    template: `<div class="lab-static"><p class="lab-note">Pila de GFab al filtrar (#725), marcado estático: pista en la píldora más alejada del FAB; las que no coinciden, hidden.</p><div id="fab"></div></div>`
  }

  const App = {
    components: { XResourceList, XBase, MenuStatic, FabStatic },
    setup () {
      onMounted(async () => {
        if (VIEW === 'block' || VIEW === 'base') {
          await nextTick()
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
          // #717 SIMULADO: GTable de dist/ aún pinta «0 seleccionadas» sin is-empty; el banco solo alterna la clase con 0 (el
          // .vue de bruno dejará además el texto vacío; con la clase, el texto ya no ocupa sitio ni se ve)
          const sim = () => document.querySelectorAll('.g-table__count').forEach((c) => c.classList.toggle('is-empty', /^0\b/.test(c.textContent.trim())))
          sim()
          new MutationObserver(sim).observe(document.body, { subtree: true, childList: true, characterData: true })
          W.ready = true
        }
      })
      return { VIEW, tabs: Q.get('tabs') === '1' }
    },
    template: `<main id="main" tabindex="-1">
      <x-resource-list v-if="VIEW === 'block'" :tabs="tabs"></x-resource-list>
      <x-base v-else-if="VIEW === 'base'" :tabs="tabs"></x-base>
      <menu-static v-else-if="VIEW === 'menu'"></menu-static>
      <fab-static v-else-if="VIEW === 'fab'"></fab-static>
    </main>`
  }
  const app = createApp(App)
  app.use(Grana).use(GranaPageHeader).use(GranaTag)
  window.__vm = app.mount('#app')
})()
