// «Una sola luz» (#957 a #963): montaje común de los specs personalidad-sidebar-glide, personalidad-table-glide y
// glide-perf (dueño: bruno). GSidebar y GTable REALES del UMD (window.Grana) montados en la página del playground, como
// personalidad-menu.spec.mjs; traslado de design/lab/hover-glide/r01/verificar.mjs (kiwi).
// Vue: el playground lo carga de unpkg; aquí se sirve el de node_modules (sin red y siempre la misma versión).
import { fileURLToPath } from 'node:url'

export const PAGE = '/packages/vue/playground/index.html'
const VUE = fileURLToPath(new URL('../../../../node_modules/vue/dist/vue.global.js', import.meta.url))

export async function routeVue(target) {
  await target.route(/unpkg\.com\/vue@3\/dist\/vue\.global\.js/, (r) => r.fulfill({ path: VUE, contentType: 'application/javascript' }))
}

export function watchConsole(page) {
  const errs = []
  page.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errs.push(`pageerror: ${e.message}`) })
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|unpkg|Failed to load resource/.test(m.text())) errs.push(`console: ${m.text()}`) })
  return errs
}

const SB_LABELS = { collapse: 'Contraer la barra lateral', expand: 'Expandir la barra lateral', more: 'Más', moreActive: 'contiene la página actual', drawer: 'Navegación', close: 'Cerrar', search: 'Buscar' }
const T_LABELS = {
  selectAll: 'Seleccionar todo', selectRow: 'Seleccionar {title}', rowActions: 'Acciones de {title}', actionsHeader: 'Acciones', selectedCount: '{count} seleccionados',
  sortBy: 'Ordenar por', ascending: 'ascendente', descending: 'descendente', sorted: 'Ordenado por {label}, {direction}', loading: 'Cargando', empty: 'Sin lotes', emptyFiltered: 'Ningún lote', clearFilters: 'Limpiar', results: '{count} lotes', detail: 'Detalle del lote'
}

/**
 * Monta en la página del playground un GSidebar (expandida o el modo pedido) y tres tablas: #gt-plain (llana, con
 * selección y una fila elegida), #gt-door (A · La puerta, rowHref) y #gt-detail (B, slot detail). Opciones:
 * `dir`, `sbMode`, `sbItems` (n items extra), `rows` (n filas), `only` ('sidebar' | 'tables'), `appearance` y
 * `responsive` de la tabla llana. Deja `window.__gt` con el estado reactivo (loading, rows, plainRows).
 */
export async function mountGlide(page, opts = {}) {
  await routeVue(page)
  // Las tres tablas una debajo de otra: un visor alto para que el puntero llegue a todas (como verificar.mjs de kiwi)
  await page.setViewportSize(opts.viewport || (opts.only === 'tables' ? { width: 1280, height: 2400 } : { width: 1280, height: 900 }))
  await page.goto(PAGE)
  await page.waitForSelector('.g-btn', { timeout: 60_000 })
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })
  await page.evaluate(async ({ opts, SB_LABELS, T_LABELS }) => {
    await document.fonts.ready
    if (opts.dir) document.documentElement.setAttribute('dir', opts.dir)
    if (opts.instrument) {
      // Contadores (glide-perf): escuchas de puntero registradas, elementFromPoint y lecturas de caja
      const c = window.__count = { listen: {}, efp: 0, gbcr: 0 }
      const add = EventTarget.prototype.addEventListener
      c.hosts = 0
      EventTarget.prototype.addEventListener = function (type, ...rest) {
        if (/^pointer/.test(type)) c.listen[type] = (c.listen[type] || 0) + 1
        if (type === 'pointermove' && this.matches?.('.g-sidebar__list, .g-sidebar__fly-list, .g-table__scroll')) c.hosts++
        return add.call(this, type, ...rest)
      }
      const efp = Document.prototype.elementFromPoint
      Document.prototype.elementFromPoint = function (...a) { c.efp++; return efp.apply(this, a) }
      const gb = Element.prototype.getBoundingClientRect
      Element.prototype.getBoundingClientRect = function () { c.gbcr++; return gb.call(this) }
    }
    const host = document.createElement('div')
    host.id = 'gl-host'
    host.style.cssText = 'display:flex;gap:24px;align-items:flex-start;padding:24px;background:var(--g-color-bg)'
    document.body.prepend(host)
    const { createApp, h, reactive } = window.Vue
    const { GSidebar, GTable } = window.Grana
    const extra = Array.from({ length: opts.sbItems || 0 }, (_, i) => ({ id: 'x' + i, label: `Elemento ${i + 1}`, href: `#x${i}`, icon: 'file' }))
    const sbItems = [
      { label: 'Principal', items: [
        { id: 'home', label: 'Inicio', href: '#home', icon: 'house' },
        { id: 'inbox', label: 'Bandeja', href: '#inbox', icon: 'inbox' },
        { id: 'msg', label: 'Mensajes', href: '#msg', icon: 'message-circle' },
        { id: 'cal', label: 'Calendario', href: '#cal', icon: 'calendar' }
      ] },
      { label: 'Espacio de trabajo', items: [
        { id: 'proj', label: 'Proyectos', icon: 'folder', children: [
          { id: 'p1', label: 'Todos', href: '#p1' }, { id: 'p2', label: 'Archivados', href: '#p2' }, { id: 'p3', label: 'Plantillas', href: '#p3' }
        ] },
        { id: 'team', label: 'Equipo', href: '#team', icon: 'users' },
        { id: 'bill', label: 'Facturación', icon: 'credit-card', disabled: true },
        { id: 'rep', label: 'Reportes', href: '#rep', icon: 'chart-column' }
      ] },
      ...(extra.length ? [{ label: 'Más', items: extra }] : []),
      { label: 'Ajustes', items: [{ id: 'set', label: 'Ajustes', href: '#set', icon: 'settings' }] }
    ]
    const n = opts.rows || 8
    const mkRows = (n) => Array.from({ length: n }, (_, i) => ({ id: 'L-' + (2041 + i), titulo: 'L-' + (2041 + i), sub: `Espadín · tina ${i + 1}`, estado: ['Fermentando', 'Reposo', 'Destilado'][i % 3], litros: String(200 + i * 37) }))
    const columns = [
      { key: 'lote', label: 'Lote', title: 'titulo', subtitle: 'sub' },
      { key: 'estado', label: 'Estado' },
      { key: 'litros', label: 'Litros', align: 'end' }
    ]
    const st = reactive({ loading: false, rows: mkRows(n), selected: ['L-2043'], expanded: [], model: 'team', tick: 0 })
    window.__gt = st
    window.__mkRows = mkRows
    const table = (id, extraProps, slots) => (opts.tables && !opts.tables.includes(id)) ? null : h('div', { id, style: 'inline-size:820px' }, [h(GTable, {
      columns: opts.inline ? columns.map((c) => ({ ...c })) : columns, rows: st.rows, rowKey: 'id', caption: id, labels: T_LABELS, loading: st.loading, ...extraProps
    }, slots)])
    createApp({
      render: () => {
        void st.tick
        const kids = []
        if (opts.only !== 'tables') {
          kids.push(h('div', { id: 'gl-sb', style: `flex:none;block-size:${opts.sbHeight || 860}px;display:flex` }, [h(GSidebar, {
            items: sbItems, label: 'Secciones', labels: SB_LABELS, mode: opts.sbMode || 'expanded', contained: true,
            modelValue: st.model, 'onUpdate:modelValue': (v) => { st.model = v }, onNavigate: (e) => e.event?.preventDefault?.()
          })]))
        }
        if (opts.only !== 'sidebar') {
          kids.push(h('div', { style: 'display:flex;flex-direction:column;gap:32px' }, [
            table('gt-plain', { selectable: true, selected: st.selected, 'onUpdate:selected': (v) => { st.selected = v }, appearance: opts.appearance || 'lines', responsive: opts.responsive || 'auto' }),
            table('gt-door', { rowHref: (r) => `#lote-${r.id}`, onNavigate: (e) => e.event?.preventDefault?.() }),
            table('gt-detail', { expanded: st.expanded, 'onUpdate:expanded': (v) => { st.expanded = v } }, { detail: ({ row }) => h('p', { style: 'margin:0;padding:16px' }, `Ficha de ${row.titulo}`) })
          ]))
        }
        return kids
      }
    }).mount(host)
    // Página aislada (glide-perf): fuera el resto del playground (≈ 17 000 nodos), cuyo estilo pendiente cobraría
    // cualquier elementFromPoint de la página y no es trabajo de la luz
    if (opts.isolate) document.querySelectorAll('body > :not(#gl-host, script, style, link)').forEach((e) => e.remove())
  }, { opts, SB_LABELS, T_LABELS })
  await page.waitForTimeout(400)
}

// Cajas de los elementos que casan con `sel`
export const boxes = (page, sel) => page.$$eval(sel, (els) => els.map((e) => { const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height } }))

// Luces encendidas (anfitriones con has-highlight y capa opaca) dentro de `scope`: su caja visible
export const lights = (page, scope = 'body') => page.evaluate((scope) => [...document.querySelectorAll(`${scope} .has-highlight`)]
  .filter((h) => h.matches('.g-sidebar__list, .g-sidebar__fly-list, .g-table__scroll'))
  .map((h) => {
    const l = h.querySelector(':scope > .g-sidebar__highlight, :scope > .g-table__highlight')
    const b = l.getBoundingClientRect()
    return { x: b.x, y: b.y, w: b.width, h: b.height, o: +getComputedStyle(l).opacity, host: h.className }
  }), scope)

// Filas o enlaces con fondo propio (la estela que se corrige): filas de tabla no seleccionadas y enlaces del sidebar
export const ownBg = (page) => page.evaluate(() => {
  const bg = (e) => { const c = getComputedStyle(e).backgroundColor; return c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent' }
  const rows = new Set([...document.querySelectorAll('#gl-host .g-table__row:not(.is-selected) > td')].filter(bg).map((td) => td.parentElement)).size
  const links = [...document.querySelectorAll('#gl-host .g-sidebar__link')].filter(bg).length
  return rows + links
})

// Barrido vertical a 1px por las filas `rowsSel` en la x que da `xOf`; muestrea cada 3px
export async function sweep(page, rowsSel, scope, xOf) {
  const bx = await boxes(page, rowsSel)
  const x = xOf(bx[0])
  const y0 = bx[0].y + 2
  const y1 = bx[bx.length - 1].y + bx[bx.length - 1].h - 2
  let maxOwn = 0, maxLights = 0, dark = 0, samples = 0
  for (let y = y0; y <= y1; y += 1) {
    await page.mouse.move(x, y)
    if (Math.round(y - y0) % 3 !== 0) continue
    await page.waitForTimeout(16)
    samples++
    maxOwn = Math.max(maxOwn, await ownBg(page))
    const ls = await lights(page, scope)
    maxLights = Math.max(maxLights, ls.length)
    if (bx.some((b) => y >= b.y && y < b.y + b.h) && ls.length === 0) dark++
  }
  return { rows: bx.length, samples, maxOwn, maxLights, dark }
}

// Viaje de la fila i a la j: cuadros intermedios distintos y caja final
export async function travel(page, rowsSel, scope, i, j, xOf) {
  const bx = await boxes(page, rowsSel)
  const a = bx[i], b = bx[j]
  await page.mouse.move(xOf(a), a.y + a.h / 2); await page.waitForTimeout(350)
  await page.mouse.move(xOf(b), b.y + b.h / 2)
  const ys = new Set()
  for (let k = 0; k < 14; k++) { const l = (await lights(page, scope))[0]; if (l) ys.add(Math.round(l.y)); await page.waitForTimeout(16) }
  await page.waitForTimeout(300)
  return { frames: ys.size, l: (await lights(page, scope))[0], b }
}

// Margen de la junta del sidebar (#958): la luz se recorta por dentro medio hueco por lado
export const seam = (page) => page.evaluate(() => {
  const l = document.querySelector('.g-sidebar__list')
  return l ? parseFloat(getComputedStyle(l).getPropertyValue('--g-space-1')) * 0.5 : 0
})
