// Auditoría posterior de coco para «una sola luz» (#957 a #964) sobre los COMPONENTES REALES: dist/grana.umd.js y
// dist/grana.css (bruno 0f1fd97 sobre el CSS de coco 17608d0), montados en el playground (packages/vue/playground/index.html)
// y sobre las instancias del propio playground (#pg-ic-sidebar y la tabla de #sec-table).
// Cubre lo que el banco de estilo no abría: panel flotante del riel, drawer, riel, compact, RTL, oscuro, zona de marca,
// forced-colors (emulado), reduce, A · La puerta, B · Despliegue, carga, selección, surface/cards/navbar (nunca dos fondos),
// cabecera pegada y scroll horizontal de la tabla, medidas en la capa (#964) y GMenu sin cambio (M1: el puntero mueve el
// foco y la luz sigue al foco, una sola).
// Vue: el playground lo carga de unpkg (bloqueado aquí); se sirve el de node_modules con page.route.
// Uso (raíz del repo): python3 -m http.server 4209 -d . &   node design/lab/hover-glide/auditoria-verificar.mjs [chromium|firefox|webkit|all] [--verbose]
import { chromium, firefox, webkit } from 'playwright'
import { fileURLToPath } from 'node:url'

const ORIGIN = process.env.ORIGIN || 'http://localhost:4209'
const PAGE = ORIGIN + '/packages/vue/playground/index.html'
const VUE = fileURLToPath(new URL('../../../node_modules/vue/dist/vue.global.js', import.meta.url))
const which = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'chromium'
const verbose = process.argv.includes('--verbose')
const engines = { chromium, firefox, webkit }
const list = which === 'all' ? Object.keys(engines) : [which]

const SB_LABELS = { collapse: 'Contraer', expand: 'Expandir', more: 'Más', moreActive: 'contiene la página actual', drawer: 'Navegación', close: 'Cerrar', search: 'Buscar' }
const T_LABELS = { selectAll: 'Seleccionar todo', selectRow: 'Seleccionar {title}', rowActions: 'Acciones de {title}', actionsHeader: 'Acciones', selectedCount: '{count} seleccionados', sortBy: 'Ordenar por', ascending: 'ascendente', descending: 'descendente', sorted: 'Ordenado por {label}, {direction}', loading: 'Cargando', empty: 'Sin lotes', emptyFiltered: 'Ningún lote', clearFilters: 'Limpiar', results: '{count} lotes', detail: 'Detalle' }

// Montaje: fuera el resto del playground y, en su lugar, los componentes de la escena pedida (window.Grana del UMD)
async function mount (p, scene) {
  await p.evaluate(async ({ scene, SB_LABELS, T_LABELS }) => {
    await document.fonts.ready
    document.querySelectorAll('body > :not(script, style, link)').forEach((e) => e.remove())
    if (scene.dark) document.documentElement.setAttribute('data-theme', 'dark')
    const host = document.createElement('div')
    host.id = 'au'
    host.style.cssText = 'display:flex;flex-wrap:wrap;gap:32px;align-items:flex-start;padding:24px;background:var(--g-color-bg)'
    if (scene.dir) host.setAttribute('dir', scene.dir)
    if (scene.zone) host.setAttribute('data-g-zone', 'brand')
    document.body.prepend(host)
    const { createApp, h, reactive } = window.Vue
    const { GSidebar, GTable, GMenu, GBtn } = window.Grana
    const items = [
      { label: 'Principal', items: [
        { id: 'home', label: 'Inicio', href: '#home', icon: 'house' }, { id: 'inbox', label: 'Bandeja', href: '#inbox', icon: 'inbox' },
        { id: 'msg', label: 'Mensajes', href: '#msg', icon: 'message-circle' }, { id: 'cal', label: 'Calendario', href: '#cal', icon: 'calendar' }
      ] },
      { label: 'Espacio de trabajo', items: [
        { id: 'proj', label: 'Proyectos', icon: 'folder', children: [{ id: 'p1', label: 'Todos', href: '#p1' }, { id: 'p2', label: 'Archivados', href: '#p2' }, { id: 'p3', label: 'Plantillas', href: '#p3' }] },
        { id: 'team', label: 'Equipo', href: '#team', icon: 'users' }, { id: 'bill', label: 'Facturación', icon: 'credit-card', disabled: true },
        { id: 'rep', label: 'Reportes', href: '#rep', icon: 'chart-column' }
      ] },
      { label: 'Ajustes', items: [{ id: 'set', label: 'Ajustes', href: '#set', icon: 'settings' }] }
    ]
    const mkRows = (n) => Array.from({ length: n }, (_, i) => ({ id: 'L-' + (2041 + i), titulo: 'L-' + (2041 + i), sub: `Espadín · tina ${i + 1}`, estado: ['Fermentando', 'Reposo', 'Destilado'][i % 3], litros: String(200 + i * 37), a: 'Oaxaca', b: 'Maguey silvestre', c: '2026-10-29', d: 'Responsable de turno' }))
    const cols = [{ key: 'lote', label: 'Lote', title: 'titulo', subtitle: 'sub' }, { key: 'estado', label: 'Estado' }, { key: 'litros', label: 'Litros', align: 'end' }]
    const wide = [...cols, { key: 'a', label: 'Región' }, { key: 'b', label: 'Agave' }, { key: 'c', label: 'Fecha' }, { key: 'd', label: 'Responsable' }]
    const st = reactive({ loading: false, rows: mkRows(scene.rows || 8), selected: ['L-2043'], expanded: [], model: 'team', open: true, menu: false })
    window.__st = st
    window.__mk = mkRows
    const sb = (id, props) => h('div', { id, style: 'flex:none;block-size:900px;display:flex;position:relative' }, [h(GSidebar, {
      items, label: id, labels: SB_LABELS, contained: true, modelValue: st.model, 'onUpdate:modelValue': (v) => { st.model = v }, onNavigate: (e) => e.event?.preventDefault?.(), ...props
    })])
    const tb = (id, props, slots, w = 760) => h('div', { id, style: `inline-size:${w}px` }, [h(GTable, { columns: cols, rows: st.rows, rowKey: 'id', caption: id, labels: T_LABELS, loading: st.loading, responsive: 'table', ...props }, slots)])
    createApp({
      render: () => {
        const k = []
        const s = scene.sb || []
        if (s.includes('default')) k.push(sb('sb-default', { mode: 'expanded' }))
        if (s.includes('compact')) k.push(sb('sb-compact', { mode: 'expanded', density: 'compact' }))
        if (s.includes('rail')) k.push(sb('sb-rail', { mode: 'rail' }))
        if (s.includes('navbar')) k.push(h('div', { id: 'sb-navbar', style: 'position:relative;inline-size:420px;block-size:160px' }, [h(GSidebar, { items: items[0].items, label: 'nav', labels: SB_LABELS, mode: 'navbar', contained: true, modelValue: st.model, 'onUpdate:modelValue': (v) => { st.model = v }, onNavigate: (e) => e.event?.preventDefault?.() })]))
        if (s.includes('drawer')) k.push(h('div', { id: 'sb-drawer' }, [h(GSidebar, { items, label: 'drawer', labels: SB_LABELS, mode: 'drawer', open: st.open, 'onUpdate:open': (v) => { st.open = v }, modelValue: st.model, 'onUpdate:modelValue': (v) => { st.model = v }, onNavigate: (e) => e.event?.preventDefault?.() })]))
        const t = scene.tb || []
        if (t.includes('plain')) k.push(tb('t-plain', { selectable: true, selected: st.selected, 'onUpdate:selected': (v) => { st.selected = v } }))
        if (t.includes('door')) k.push(tb('t-door', { selectable: true, rowHref: (r) => '#' + r.id, onNavigate: (e) => e.event?.preventDefault?.() }))
        if (t.includes('detail')) k.push(tb('t-detail', { expanded: st.expanded, 'onUpdate:expanded': (v) => { st.expanded = v } }, { detail: ({ row }) => h('p', { style: 'margin:0;padding:16px' }, 'Ficha de ' + row.titulo) }))
        if (t.includes('surface')) k.push(tb('t-surface', { appearance: 'surface' }))
        if (t.includes('surface-door')) k.push(tb('t-surface-door', { appearance: 'surface', rowHref: (r) => '#' + r.id, onNavigate: (e) => e.event?.preventDefault?.() }))
        if (t.includes('cards')) k.push(tb('t-cards', { responsive: 'cards' }))
        if (t.includes('scroll')) k.push(tb('t-scroll', { columns: wide, maxHeight: '260px' }, undefined, 420))
        if (scene.menu) {
          k.push(h('div', { id: 'mn' }, [h(GMenu, { modelValue: st.menu, 'onUpdate:modelValue': (v) => { st.menu = v }, label: 'Acciones', items: [{ id: 'a', label: 'Abrir' }, { id: 'b', label: 'Duplicar' }, { id: 'c', label: 'Renombrar' }, { id: 'd', label: 'Mover' }, { id: 'e', label: 'Archivar' }] }, { trigger: ({ attrs }) => h(GBtn, { ...attrs, id: 'mn-trigger', variant: 'outline' }, () => 'Acciones') })]))
        }
        k.push(h('input', { id: 'au-field', 'aria-label': 'Campo', style: 'inline-size:160px' }))
        return k
      }
    }).mount(host)
  }, { scene, SB_LABELS, T_LABELS })
  await p.waitForTimeout(450)
}

for (const name of list) {
  const r = { pass: 0, fail: 0, fails: [], info: [] }
  const ok = (cond, label, data) => { if (cond) r.pass++; else { r.fail++; r.fails.push(label + (data !== undefined ? ' ' + JSON.stringify(data) : '')) }; if (verbose) console.log((cond ? '  ok ' : '  NO ') + label) }
  const info = (s) => { r.info.push(s); if (verbose) console.log('  · ' + s) }
  const browser = await engines[name].launch()

  async function open (scene, ctxOpts = {}) {
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 1400 }, ...ctxOpts })
    const p = await ctx.newPage()
    await p.route(/unpkg\.com\/vue@3\/dist\/vue\.global\.js/, (rt) => rt.fulfill({ path: VUE, contentType: 'application/javascript' }))
    const errs = []
    p.on('pageerror', (e) => errs.push(String(e)))
    p.on('console', (m) => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errs.push(m.text()) })
    await p.goto(PAGE)
    await p.waitForSelector('.g-btn', { timeout: 60_000 })
    await p.addStyleTag({ content: 'html{scroll-behavior:auto!important}*{caret-color:transparent}' })
    if (scene) await mount(p, scene)
    return { p, ctx, errs }
  }
  const rect = (p, sel) => p.evaluate((s) => [...document.querySelectorAll(s)].map((e) => { const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height } }), sel)
  // Luces encendidas dentro de `scope`: anfitrión con has-highlight y capa opaca y visible
  const lights = (p, scope) => p.evaluate((scope) => [...document.querySelectorAll(scope + ' .has-highlight')]
    .filter((h) => h.matches('.g-sidebar__list, .g-sidebar__fly-list, .g-table__scroll'))
    .map((h) => { const l = h.firstElementChild; const cs = getComputedStyle(l); const b = l.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height, o: +cs.opacity, d: cs.display, bg: cs.backgroundColor, host: h.className } })
    .filter((l) => l.d !== 'none' && l.w > 0), scope)
  // Fondos propios en el alcance: enlaces del sidebar, pestañas del navbar, celdas de filas no seleccionadas, filas (cards)
  const ownBg = (p, scope) => p.evaluate((scope) => {
    const bg = (e) => { const c = getComputedStyle(e).backgroundColor; return c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent' }
    const rows = new Set([...document.querySelectorAll(scope + ' .g-table__row:not(.is-selected) > td')].filter(bg).map((td) => td.parentElement))
    document.querySelectorAll(scope + ' .g-table--mode-cards .g-table__row:not(.is-selected)').forEach((tr) => { if (bg(tr)) rows.add(tr) })
    return rows.size + [...document.querySelectorAll(scope + ' .g-sidebar__link, ' + scope + ' .g-sidebar__tab')].filter(bg).length
  }, scope)
  const seamOf = (p) => p.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-space-1')) * 0.5)
  const near = (a, b, t = 1.01) => Math.abs(a - b) <= t
  const settle = (p, ms = 320) => p.waitForTimeout(ms)
  const same = (l, b, seam = 0) => l && near(l.x, b.x) && near(l.w, b.w) && near(l.y, b.y + seam / 2) && near(l.h, b.h - seam)

  // Recorre cada destino: luz única sobre su caja (con la junta en el sidebar)
  async function eachTarget (p, scope, sel, seam, label, skip = () => false) {
    const bx = await rect(p, sel)
    let good = 0, n = 0
    const bad = []
    for (let i = 0; i < bx.length; i++) {
      if (await skip(i)) continue
      const b = bx[i]
      await p.mouse.move(b.x + Math.min(24, b.w / 2), b.y + b.h / 2)
      await settle(p)
      const ls = await lights(p, scope)
      n++
      if (ls.length === 1 && same(ls[0], b, seam)) good++; else bad.push({ i, b, ls })
    }
    ok(n > 0 && good === n, `${label}: luz única = caja del destino en ${good}/${n}`, bad.slice(0, 2))
    return bx
  }
  // Barrido a 1 px: ≤ 1 luz, 0 fondos propios, sin apagón dentro de destinos encendibles
  async function sweep (p, scope, sel, xOf, label, { maxOwn = 0, darkOk = () => false } = {}) {
    const bx = await rect(p, sel)
    const x = xOf(bx[0])
    const y0 = bx[0].y + 2, y1 = bx.at(-1).y + bx.at(-1).h - 2
    let mOwn = 0, mL = 0, dark = 0, s = 0
    for (let y = y0; y <= y1; y++) {
      await p.mouse.move(x, y)
      if (Math.round(y - y0) % 3) continue
      await p.waitForTimeout(16)
      s++
      mOwn = Math.max(mOwn, await ownBg(p, scope))
      const ls = await lights(p, scope)
      mL = Math.max(mL, ls.length)
      const i = bx.findIndex((b) => y >= b.y && y < b.y + b.h)
      if (i >= 0 && !(await darkOk(i)) && ls.length === 0) dark++
    }
    ok(mL <= 1 && mOwn <= maxOwn && dark === 0, `${label}: barrido ${s} muestras · máx. luces ${mL} · máx. fondos propios ${mOwn} · apagones ${dark}`)
  }
  const focusField = (p) => p.evaluate(() => { document.getElementById('au-field').focus(); return document.activeElement.id })
  const activeId = (p) => p.evaluate(() => document.activeElement?.id || document.activeElement?.className || null)
  const lum = (c) => { const m = c.match(/[\d.]+/g).map(Number); const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]) }
  // Color de la luz compuesto sobre el fondo real que tiene debajo (primer ancestro con fondo opaco)
  // Normaliza con un lienzo (color(srgb …), oklab(…), rgba): pinta el fondo opaco real y la luz encima y lee el píxel
  const composite = (p, layerSel) => p.evaluate((sel) => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 1
    const cx = cv.getContext('2d', { willReadFrequently: true })
    const px = (c) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); return cx.getImageData(0, 0, 1, 1).data }
    const l = document.querySelector(sel)
    let n = l.parentElement, under = null
    while (n) { const c = getComputedStyle(n).backgroundColor; if (px(c)[3] === 255) { under = c; break } n = n.parentElement }
    cx.clearRect(0, 0, 1, 1); cx.fillStyle = under; cx.fillRect(0, 0, 1, 1); cx.fillStyle = getComputedStyle(l).backgroundColor; cx.fillRect(0, 0, 1, 1)
    const d = cx.getImageData(0, 0, 1, 1).data
    return `rgb(${d[0]}, ${d[1]}, ${d[2]})`
  }, layerSel)
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05) }
  const colorOf = (p, sel) => p.evaluate((s) => {
    const e = document.querySelector(s); if (!e) return null
    const cv = document.createElement('canvas'); cv.width = cv.height = 1
    const cx = cv.getContext('2d', { willReadFrequently: true }); cx.fillStyle = getComputedStyle(e).color; cx.fillRect(0, 0, 1, 1)
    const d = cx.getImageData(0, 0, 1, 1).data; return `rgb(${d[0]}, ${d[1]}, ${d[2]})`
  }, sel)

  // ======================= 1. Sidebar: expandida, compact, riel; medidas en la capa; foco y teclado =======================
  {
    const { p, ctx, errs } = await open({ sb: ['default', 'compact', 'rail'] })
    const seam = await seamOf(p)
    // abrir el submenú de Proyectos en la expandida y en compact (clic en la rama: abre sin navegar)
    for (const id of ['#sb-default', '#sb-compact']) await p.click(`${id} .g-sidebar__link[aria-expanded]`)
    await p.mouse.move(1500, 1300); await settle(p, 400)
    for (const id of ['#sb-default', '#sb-compact']) {
      const open = await p.$$eval(`${id} .g-sidebar__sub.is-open`, (e) => e.length)
      ok(open === 1, `${id}: submenú abierto para la prueba`, open)
    }
    await focusField(p)
    for (const [id, label] of [['#sb-default', 'expandida'], ['#sb-compact', 'compact'], ['#sb-rail', 'riel']]) {
      const sel = `${id} .g-sidebar__nav .g-sidebar__link:not([aria-disabled="true"])`
      const bx = await eachTarget(p, id, `${id} .g-sidebar__nav .g-sidebar__sub:not([inert]) .g-sidebar__link, ${id} .g-sidebar__nav .g-sidebar__item > .g-sidebar__link:not([aria-disabled="true"])`, seam, `sidebar ${label}`)
      const heights = bx.map((b) => b.h)
      ok(Math.min(...heights) - seam >= 24, `sidebar ${label}: luz ≥ 24 px de alto (mín. ${Math.min(...heights) - seam})`)
      for (let g = 0; g < 3; g++) {
        const listSel = `${id} .g-sidebar__group:nth-of-type(${g + 1}) .g-sidebar__link:not([inert] .g-sidebar__link)`
        await sweep(p, id, listSel, (b) => b.x + b.w * 0.6, `sidebar ${label} grupo ${g + 1}`, {
          darkOk: async (i) => p.evaluate(([s, i]) => document.querySelectorAll(s)[i]?.getAttribute('aria-disabled') === 'true', [listSel, i])
        })
      }
      ok((await activeId(p)) === 'au-field', `sidebar ${label}: el puntero no movió el foco (sigue en el campo)`)
      void sel
    }
    // deshabilitado y título de grupo apagan
    const dis = (await rect(p, '#sb-default .g-sidebar__link[aria-disabled="true"]'))[0]
    await p.mouse.move(dis.x + 20, dis.y + dis.h / 2); await settle(p)
    ok((await lights(p, '#sb-default')).length === 0, 'sidebar: el deshabilitado apaga la luz')
    const tt = (await rect(p, '#sb-default .g-sidebar__group-title'))[0]
    await p.mouse.move(tt.x + 10, tt.y + tt.h / 2); await settle(p)
    ok((await lights(p, '#sb-default')).length === 0, 'sidebar: el título de grupo apaga la luz')
    // sangría de los hijos: la franja a la izquierda del enlace hijo no es destino (caja del enlace, #959) y apaga
    const kid = (await rect(p, '#sb-default .g-sidebar__sub.is-open .g-sidebar__link'))[1]
    const par = (await rect(p, '#sb-default .g-sidebar__link[aria-expanded]'))[0]
    await p.mouse.move(par.x + 6, kid.y + kid.h / 2); await settle(p)
    const strip = (await lights(p, '#sb-default')).length
    info(`sangría de los hijos: ${Math.round(kid.x - par.x)} px a la izquierda del enlace hijo; puntero ahí → ${strip} luces (hueco del contrato)`)
    ok(strip === 0, 'sidebar: la sangría a la izquierda de un hijo no ilumina nada (nunca «la más cercana»)')
    // actual: la luz lo cubre y su asiento no cambia
    const cur = '#sb-default .g-sidebar__link[aria-current="page"]'
    const seat = () => p.evaluate((s) => { const e = document.querySelector(s + ' .g-sidebar__icon'); const cs = getComputedStyle(e, '::before'); return cs.backgroundColor + '|' + cs.opacity + '|' + cs.scale }, cur)
    const seat0 = await seat()
    const cb = (await rect(p, cur))[0]
    await p.mouse.move(cb.x + 30, cb.y + cb.h / 2); await settle(p)
    const lc = (await lights(p, '#sb-default'))[0]
    ok(same(lc, cb, seam), 'sidebar: el actual se ilumina (sin apagón)', lc)
    ok((await seat()) === seat0, 'sidebar: el asiento del actual no cambia bajo la luz', [seat0, await seat()])
    // medidas en la CAPA (#964): la capa las lleva en línea y el anfitrión no
    const where = await p.evaluate(() => { const l = document.querySelector('#sb-default .has-highlight'); return { host: l.style.getPropertyValue('--_highlight-y'), layer: l.firstElementChild.style.getPropertyValue('--_highlight-y'), cls: l.firstElementChild.className, role: l.firstElementChild.getAttribute('role'), hidden: l.firstElementChild.getAttribute('aria-hidden') } })
    ok(where.host === '' && /px$/.test(where.layer), 'sidebar: --_highlight-* en la capa y no en el anfitrión (#964)', where)
    ok(where.cls === 'g-sidebar__highlight' && where.role === 'none' && where.hidden === 'true', 'sidebar: capa li[role=none][aria-hidden]', where)
    // token y radio
    const tok = await p.evaluate(() => { const t = document.createElement('i'); t.style.background = 'var(--g-color-border)'; document.getElementById('sb-default').appendChild(t); const c = getComputedStyle(t).backgroundColor; t.remove(); return c })
    ok(lc.bg === tok, 'sidebar: luz con --g-color-border', [lc.bg, tok])
    // teclado: Tab hasta un enlace no enciende la luz (puntero fuera)
    await p.mouse.move(1590, 1390); await settle(p)
    await p.focus('#sb-default .g-sidebar__item > .g-sidebar__link[href="#inbox"]')
    await p.keyboard.press('ArrowDown').catch(() => {})
    await settle(p)
    ok((await lights(p, 'body')).length === 0, 'sidebar: el teclado no enciende la luz')
    // dos canales: anillo en una fila y luz en otra
    const ib = (await rect(p, '#sb-default .g-sidebar__item > .g-sidebar__link[href="#home"]'))[0]
    await p.focus('#sb-default .g-sidebar__item > .g-sidebar__link[href="#cal"]')
    await p.mouse.move(ib.x + 30, ib.y + ib.h / 2); await settle(p)
    const ring = await p.evaluate(() => { const a = document.activeElement; return { href: a.getAttribute('href'), outline: getComputedStyle(a).outlineStyle } })
    const lh = (await lights(p, '#sb-default'))[0]
    ok(ring.href === '#cal' && same(lh, ib, seam), 'sidebar: anillo (teclado) y luz (puntero) en filas distintas a la vez', { ring, lh })
    // movimiento: transición de M1 sin muelle
    const tr = await p.evaluate(() => { const cs = getComputedStyle(document.querySelector('#sb-default .g-sidebar__highlight')); return { tp: cs.transitionProperty, tf: cs.transitionTimingFunction, td: cs.transitionDuration } })
    ok(/translate/.test(tr.tp) && !/linear\(/.test(tr.tf), 'sidebar: viaje por translate con ease-out, sin muelle', tr)
    // viaje con cuadros intermedios de la fila 0 a la 3
    const all = await rect(p, '#sb-default .g-sidebar__group:first-of-type .g-sidebar__link')
    await p.mouse.move(1590, 1390); await settle(p)
    await p.mouse.move(all[0].x + 30, all[0].y + all[0].h / 2); await settle(p)
    await p.mouse.move(all[3].x + 30, all[3].y + all[3].h / 2)
    const ys = new Set()
    for (let k = 0; k < 14; k++) { const l = (await lights(p, '#sb-default'))[0]; if (l) ys.add(Math.round(l.y)); await p.waitForTimeout(12) }
    ok(ys.size >= 3, `sidebar: viaja con cuadros intermedios (${ys.size} posiciones)`)
    ok(errs.length === 0, 'sidebar: consola limpia', errs)
    await ctx.close()
  }

  // ======================= 2. Riel con panel flotante =======================
  {
    const { p, ctx, errs } = await open({ sb: ['rail'] })
    const seam = await seamOf(p)
    const br = (await rect(p, '#sb-rail .g-sidebar__item:has(> .g-sidebar__link[aria-expanded]) > .g-sidebar__link'))[0]
    ok(!!br, 'riel: rama con hijos')
    await p.mouse.move(br.x + br.w / 2, br.y + br.h / 2)
    await p.waitForTimeout(600)
    const flyVisible = await p.evaluate(() => { const f = document.querySelector('#sb-rail .g-sidebar__fly'); return !!f && getComputedStyle(f).visibility !== 'hidden' && f.getBoundingClientRect().width > 0 })
    ok(flyVisible, 'riel: el panel flotante se abre con el puntero')
    const lr = (await lights(p, '#sb-rail'))
    ok(lr.length === 1 && same(lr[0], br, seam), 'riel: la rama se ilumina con el panel abierto', lr)
    // ir al panel: muestreo de cuadros en el cruce, nunca dos luces
    const fl = await rect(p, '#sb-rail .g-sidebar__fly-list .g-sidebar__link')
    ok(fl.length === 3, 'panel flotante: tres enlaces en g-sidebar__fly-list', fl.length)
    let maxL = 0
    const steps = 20
    for (let k = 1; k <= steps; k++) {
      const x = br.x + br.w / 2 + (fl[0].x + 20 - br.x - br.w / 2) * k / steps
      const y = br.y + br.h / 2 + (fl[0].y + fl[0].h / 2 - br.y - br.h / 2) * k / steps
      await p.mouse.move(x, y); await p.waitForTimeout(16)
      maxL = Math.max(maxL, (await lights(p, '#sb-rail')).length)
    }
    await settle(p)
    ok(maxL <= 1, `riel → panel: como mucho una luz en el cruce (máx. ${maxL})`)
    const fls = await lights(p, '#sb-rail')
    ok(fls.length === 1 && /fly-list/.test(fls[0].host) && same(fls[0], fl[0], seam), 'panel flotante: luz propia sobre su enlace; la del riel apagada', fls)
    const fb = await eachTarget(p, '#sb-rail .g-sidebar__fly', '#sb-rail .g-sidebar__fly-list .g-sidebar__link', seam, 'panel flotante')
    await sweep(p, '#sb-rail', '#sb-rail .g-sidebar__fly-list .g-sidebar__link', (b) => b.x + 30, 'panel flotante')
    // token en el panel: border sobre surface (como el hover de antes) y contraste del texto
    const fc = await composite(p, '#sb-rail .g-sidebar__fly-list > .g-sidebar__highlight')
    const ftxt = await p.evaluate(() => getComputedStyle(document.querySelector('#sb-rail .g-sidebar__fly-list .g-sidebar__link:hover') || document.querySelector('#sb-rail .g-sidebar__fly-list .g-sidebar__link')).color)
    const fr = ratio(ftxt, fc)
    ok(fr >= 4.5, `panel flotante: texto sobre la luz ${fr.toFixed(2)}:1`)
    info(`panel flotante, claro: texto sobre luz ${fr.toFixed(2)}:1`)
    void fb
    ok(errs.length === 0, 'riel: consola limpia', errs)
    await ctx.close()
  }

  // ======================= 3. Drawer (móvil) =======================
  {
    const { p, ctx, errs } = await open({ sb: ['drawer'] }, { viewport: { width: 390, height: 844 } })
    await p.waitForTimeout(400)
    const isOpen = await p.evaluate(() => document.querySelector('.g-sidebar__drawer')?.open)
    ok(isOpen === true, 'drawer: abierto (<dialog> modal)')
    const seam = await seamOf(p)
    await eachTarget(p, '.g-sidebar__drawer', '.g-sidebar__drawer .g-sidebar__item > .g-sidebar__link:not([aria-disabled="true"])', seam, 'drawer')
    await sweep(p, '.g-sidebar__drawer', '.g-sidebar__drawer .g-sidebar__group:first-of-type .g-sidebar__link', (b) => b.x + 30, 'drawer grupo 1')
    const hosts = await p.$$eval('.g-sidebar__drawer .g-sidebar__list > .g-sidebar__highlight', (e) => e.length)
    ok(hosts === 3, 'drawer: una capa por lista', hosts)
    // el toque no hace nada (contexto táctil aparte)
    const t = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: name !== 'firefox' })
    const tp = await t.newPage()
    await tp.route(/unpkg\.com\/vue@3\/dist\/vue\.global\.js/, (rt) => rt.fulfill({ path: VUE, contentType: 'application/javascript' }))
    await tp.goto(PAGE); await tp.waitForSelector('.g-btn', { timeout: 60_000 })
    await mount(tp, { sb: ['drawer'] })
    const lb = (await rect(tp, '.g-sidebar__drawer .g-sidebar__item > .g-sidebar__link[href="#msg"]'))[0]
    await tp.touchscreen.tap(lb.x + 30, lb.y + lb.h / 2).catch(() => {})
    await tp.waitForTimeout(300)
    ok((await lights(tp, 'body')).length === 0, 'drawer: el toque no enciende la luz')
    await t.close()
    ok(errs.length === 0, 'drawer: consola limpia', errs)
    await ctx.close()
  }

  // ======================= 4. Navbar: sin capa, nunca dos fondos =======================
  {
    const { p, ctx, errs } = await open({ sb: ['navbar'] })
    // (el <dialog> del drawer de «Más» sí lleva sus capas: es la lista vertical, no la barra)
    ok((await p.$$eval('#sb-navbar .g-sidebar__bar .g-sidebar__highlight', (e) => e.length)) === 0, 'navbar: la barra sin capa (#961)')
    const tabs = await rect(p, '#sb-navbar .g-sidebar__tab')
    let maxOwn = 0
    const y = tabs[0].y + tabs[0].h / 2
    for (let x = tabs[0].x + 2; x < tabs.at(-1).x + tabs.at(-1).w - 2; x += 2) {
      await p.mouse.move(x, y)
      // sin esperar (cuadro siguiente) y tras 40 ms: la salida instantánea debe quitar el fondo anterior ya
      maxOwn = Math.max(maxOwn, await p.evaluate(() => [...document.querySelectorAll('#sb-navbar .g-sidebar__bar > li:not(.is-current) > .g-sidebar__tab')].filter((e) => { const c = getComputedStyle(e).backgroundColor; return c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent' }).length))
    }
    ok(maxOwn <= 1, `navbar: como mucho una pestaña con fondo de hover en cada muestra (máx. ${maxOwn})`)
    ok(errs.length === 0, 'navbar: consola limpia', errs)
    await ctx.close()
  }

  // ======================= 5. Tabla: llana, A, B, selección, carga, foco =======================
  {
    const { p, ctx, errs } = await open({ tb: ['plain', 'door', 'detail'] }, { viewport: { width: 1600, height: 2000 } })
    await focusField(p)
    await eachTarget(p, '#t-plain', '#t-plain .g-table__row', 0, 'tabla llana (fila)')
    await eachTarget(p, '#t-door', '#t-door td.g-table__cell--primary', 0, 'A · La puerta (celda principal)')
    await eachTarget(p, '#t-detail', '#t-detail .g-table__row', 0, 'B · Despliegue (fila)')
    await sweep(p, '#t-plain', '#t-plain .g-table__row', (b) => b.x + b.w * 0.6, 'tabla llana')
    await sweep(p, '#t-door', '#t-door td.g-table__cell--primary', (b) => b.x + b.w / 2, 'A · columna principal')
    await sweep(p, '#t-detail', '#t-detail .g-table__row', (b) => b.x + b.w / 2, 'B')
    ok((await activeId(p)) === 'au-field', 'tabla: el puntero no movió el foco')
    // A: otra celda, la casilla sin fondo, cabecera apagan
    const est = (await rect(p, '#t-door .g-table__row:nth-child(2) > td:nth-last-child(2)'))[0]
    await p.mouse.move(est.x + 10, est.y + est.h / 2); await settle(p)
    ok((await lights(p, '#t-door')).length === 0, 'A: otra celda de la fila sin luz')
    const chk = (await rect(p, '#t-door .g-table__row:nth-child(2) > td.g-table__select'))[0]
    await p.mouse.move(chk.x + chk.w / 2, chk.y + 4); await settle(p)
    const chkBg = await p.evaluate(() => getComputedStyle(document.querySelector('#t-door .g-table__row:nth-child(2) > td.g-table__select')).backgroundColor)
    ok((await lights(p, '#t-door')).length === 0 && chkBg === 'rgba(0, 0, 0, 0)', 'A: la casilla sin luz ni fondo de hover', chkBg)
    const th = (await rect(p, '#t-plain thead th'))[1]
    await p.mouse.move(th.x + 10, th.y + th.h / 2); await settle(p)
    ok((await lights(p, '#t-plain')).length === 0, 'tabla: la cabecera apaga la luz')
    // A: subrayado/flecha siguen con :hover de la fila (sin cambio)
    // selección: primary-soft encima de la luz
    const sel = (await rect(p, '#t-plain .g-table__row.is-selected'))[0]
    await p.mouse.move(sel.x + sel.w * 0.6, sel.y + sel.h / 2); await settle(p)
    const sv = await p.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); const td = e.closest('td'); const t = document.createElement('i'); t.style.background = 'var(--g-color-primary-soft)'; document.body.appendChild(t); const ps = getComputedStyle(t).backgroundColor; t.remove(); return { hitLayer: !!e.closest('.g-table__highlight'), bg: getComputedStyle(td).backgroundColor, ps } }, [sel.x + sel.w * 0.6, sel.y + sel.h / 2])
    ok(!sv.hitLayer && sv.bg === sv.ps, 'selección: primary-soft del td pintado encima de la luz', sv)
    // B: desplegar recoloca sin viajar; la ficha apaga
    const r2 = (await rect(p, '#t-detail .g-table__row'))[1]
    await p.mouse.move(r2.x + r2.w / 2, r2.y + r2.h / 2); await settle(p)
    await p.mouse.down(); await p.mouse.up(); await p.waitForTimeout(450)
    const exp = await p.evaluate(() => document.querySelectorAll('#t-detail .g-table__row.is-expanded').length)
    ok(exp === 1, 'B: fila desplegada con clic')
    const r2b = (await rect(p, '#t-detail .g-table__row'))[1]
    const l2 = (await lights(p, '#t-detail'))[0]
    ok(same(l2, r2b), 'B: tras desplegar la luz sigue en la fila', { l2, r2b })
    const det = (await rect(p, '#t-detail .g-table__detail'))[0]
    await p.mouse.move(det.x + det.w / 2, det.y + det.h / 2); await settle(p)
    ok((await lights(p, '#t-detail')).length === 0, 'B: la ficha desplegada apaga la luz')
    // carga: apagada; al volver los datos no se enciende sola
    const r3 = (await rect(p, '#t-plain .g-table__row'))[3]
    await p.mouse.move(r3.x + r3.w / 2, r3.y + r3.h / 2); await settle(p)
    ok((await lights(p, '#t-plain')).length === 1, 'carga: encendida antes')
    await p.evaluate(() => { window.__st.loading = true }); await p.waitForTimeout(60)
    await p.mouse.move(r3.x + r3.w / 2 + 3, r3.y + r3.h / 2); await settle(p)
    ok((await lights(p, '#t-plain')).length === 0, 'carga: apagada y sin registrar con loading')
    await p.evaluate(() => { window.__st.loading = false }); await settle(p, 500)
    ok((await lights(p, '#t-plain')).length === 0, 'carga: al llegar los datos no se enciende con el puntero quieto')
    await p.mouse.move(r3.x + r3.w / 2 + 6, r3.y + r3.h / 2); await settle(p)
    ok((await lights(p, '#t-plain')).length === 1, 'carga: vuelve con el siguiente movimiento')
    // cambio de filas sin gesto apaga
    await p.evaluate(() => { window.__st.rows = window.__mk(6).reverse() }); await settle(p)
    ok((await lights(p, '#t-plain')).length === 0, 'cambio de filas sin gesto: apagada')
    // medidas en la capa
    await p.mouse.move(r3.x + r3.w / 2 + 9, r3.y + r3.h / 2); await settle(p)
    const where = await p.evaluate(() => { const s = document.querySelector('#t-plain .g-table__scroll'); return { host: s.style.getPropertyValue('--_highlight-y'), layer: s.firstElementChild.style.getPropertyValue('--_highlight-y'), cls: s.firstElementChild.className, hidden: s.firstElementChild.getAttribute('aria-hidden') } })
    ok(where.host === '' && /px$/.test(where.layer) && where.cls === 'g-table__highlight' && where.hidden === 'true', 'tabla: --_highlight-* en la capa div[aria-hidden] (#964)', where)
    const tok = await p.evaluate(() => { const t = document.createElement('i'); t.style.background = 'var(--g-color-surface-sunken)'; document.body.appendChild(t); const c = getComputedStyle(t).backgroundColor; t.remove(); return c })
    const lt = (await lights(p, '#t-plain'))[0]
    ok(lt && lt.bg === tok, 'tabla: luz con --g-color-surface-sunken', [lt?.bg, tok])
    // pulsado se queda; scroll de página con el puntero quieto pasa al instante a la fila de debajo
    ok(errs.length === 0, 'tabla: consola limpia', errs)
    await ctx.close()
  }

  // ======================= 6. Tabla: surface, A en surface y cards — nunca dos fondos =======================
  {
    const { p, ctx, errs } = await open({ tb: ['surface', 'surface-door', 'cards'] }, { viewport: { width: 1600, height: 2600 } })
    for (const [id, rowSel] of [['#t-surface', '.g-table__row'], ['#t-surface-door', 'td.g-table__cell--primary'], ['#t-cards', '.g-table__row']]) {
      ok((await p.$$eval(`${id} .g-table__highlight`, (e) => e.length)) === 0, `${id}: sin capa (#961)`)
      const bx = await rect(p, `${id} ${rowSel}`)
      let maxOwn = 0, lit = 0
      const x = bx[0].x + Math.min(40, bx[0].w / 2)
      for (let y = bx[0].y + 2; y < bx.at(-1).y + bx.at(-1).h - 2; y += 2) {
        await p.mouse.move(x, y)
        // fondo de hover = surface-sunken (en surface y cards la fila ya tiene su superficie en reposo)
        const n = await p.evaluate((id) => {
          const t = document.createElement('i'); t.style.background = 'var(--g-color-surface-sunken)'; document.querySelector(id).appendChild(t); const tok = getComputedStyle(t).backgroundColor; t.remove()
          const rows = new Set()
          document.querySelectorAll(id + ' .g-table__row').forEach((tr) => { if (getComputedStyle(tr).backgroundColor === tok || [...tr.children].some((td) => getComputedStyle(td).backgroundColor === tok)) rows.add(tr) })
          return rows.size
        }, id)
        maxOwn = Math.max(maxOwn, n)
        if (n) lit++
      }
      ok(maxOwn <= 1 && lit > 0, `${id}: hover por fila con como mucho un fondo a la vez (máx. ${maxOwn}, ${lit} muestras con fondo)`)
    }
    ok(errs.length === 0, 'surface/cards: consola limpia', errs)
    await ctx.close()
  }

  // ======================= 7. Tabla: cabecera pegada y scroll horizontal =======================
  {
    const { p, ctx, errs } = await open({ tb: ['scroll'], rows: 20 })
    const sc = '#t-scroll .g-table__scroll'
    const dims = await p.evaluate((s) => { const e = document.querySelector(s); return { sw: e.scrollWidth, cw: e.clientWidth, sh: e.scrollHeight, ch: e.clientHeight } }, sc)
    ok(dims.sw > dims.cw && dims.sh > dims.ch, 'scroll: la tabla desborda en los dos ejes', dims)
    const rows = await rect(p, '#t-scroll .g-table__row')
    const r = rows[2]
    await p.mouse.move(r.x + 60, r.y + r.h / 2); await settle(p)
    ok(same((await lights(p, '#t-scroll'))[0], r), 'scroll: luz = fila antes de desplazar')
    // scroll horizontal con el puntero quieto: la luz se queda con su fila (en el contenido desplazable)
    await p.evaluate((s) => { document.querySelector(s).scrollLeft = 120 }, sc); await settle(p)
    const rh = (await rect(p, '#t-scroll .g-table__row'))[2]
    const lh = (await lights(p, '#t-scroll'))[0]
    ok(same(lh, rh), 'scroll horizontal: la luz sigue a la fila (mismo x y ancho)', { lh, rh })
    // scroll vertical con el puntero quieto: pasa al instante a la fila de debajo
    const before = await p.evaluate((s) => document.querySelector(s).firstElementChild.style.getPropertyValue('--_highlight-y'), sc)
    await p.evaluate((s) => { const e = document.querySelector(s); window.__inst = false; window.__mo = new MutationObserver(() => { if (e.classList.contains('is-highlight-instant')) window.__inst = true }); window.__mo.observe(e, { attributes: true, attributeFilter: ['class'] }) }, sc)
    await p.evaluate(([s, t]) => { document.querySelector(s).scrollTop = t }, [sc, rows[1].h * 3])
    await p.waitForTimeout(120)
    const inst = await p.evaluate(() => { window.__mo.disconnect(); return window.__inst })
    await settle(p)
    const under = await p.evaluate(([x, y]) => { const tr = document.elementFromPoint(x, y)?.closest('tr'); const b = tr.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height } }, [r.x + 60, r.y + r.h / 2])
    const lv = (await lights(p, '#t-scroll'))[0]
    const after = await p.evaluate((s) => document.querySelector(s).firstElementChild.style.getPropertyValue('--_highlight-y'), sc)
    ok(before !== after && same(lv, under), 'scroll vertical con el puntero quieto: luz en la fila de debajo', { lv, under })
    ok(inst, 'scroll vertical: recolocación sin viaje (is-highlight-instant)')
    // cabecera pegada tapa la luz: llevar la luz a una fila parcialmente bajo el th
    const thb = (await rect(p, '#t-scroll thead th'))[0]
    const rr = await rect(p, '#t-scroll .g-table__row')
    const partial = rr.find((b) => b.y < thb.y + thb.h && b.y + b.h > thb.y + thb.h + 4)
    const cx = (await rect(p, sc))[0].x + 60
    if (partial) {
      await p.mouse.move(cx, thb.y + thb.h + 2); await settle(p)
      const hit = await p.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return { th: !!e.closest('th'), layer: !!e.closest('.g-table__highlight'), thBg: getComputedStyle(e.closest('th') || e).backgroundColor } }, [cx, thb.y + thb.h / 2])
      const lp = (await lights(p, '#t-scroll'))[0]
      ok(lp && lp.y < thb.y + thb.h && hit.th && !hit.layer && !/, 0\)$/.test(hit.thBg), 'cabecera pegada: tapa la luz de la fila que pasa por debajo (th opaco encima)', { hit, lp, thb })
    } else ok(false, 'cabecera pegada: no se encontró una fila bajo el th')
    await p.mouse.move(cx, thb.y + thb.h / 2); await settle(p)
    ok((await lights(p, '#t-scroll')).length === 0, 'cabecera pegada: el puntero sobre el th apaga')
    ok(errs.length === 0, 'scroll: consola limpia', errs)
    await ctx.close()
  }

  // ======================= 8. RTL =======================
  {
    const { p, ctx, errs } = await open({ sb: ['default', 'rail'], tb: ['door', 'plain'], dir: 'rtl' }, { viewport: { width: 1800, height: 1800 } })
    const seam = await seamOf(p)
    await eachTarget(p, '#sb-default', '#sb-default .g-sidebar__item > .g-sidebar__link:not([aria-disabled="true"])', seam, 'RTL sidebar')
    await eachTarget(p, '#t-door', '#t-door td.g-table__cell--primary', 0, 'RTL A · La puerta')
    await eachTarget(p, '#t-plain', '#t-plain .g-table__row', 0, 'RTL tabla llana')
    const br = (await rect(p, '#sb-rail .g-sidebar__item:has(> .g-sidebar__link[aria-expanded]) > .g-sidebar__link'))[0]
    await p.mouse.move(br.x + br.w / 2, br.y + br.h / 2); await p.waitForTimeout(600)
    const fl = await rect(p, '#sb-rail .g-sidebar__fly-list .g-sidebar__link')
    if (fl.length) {
      // cruzar al panel por un camino que no salga del riel ni del panel antes de tiempo
      for (let k = 1; k <= 12; k++) await p.mouse.move(br.x + br.w / 2 + (fl[1].x + fl[1].w - 20 - br.x - br.w / 2) * k / 12, br.y + br.h / 2 + (fl[1].y + fl[1].h / 2 - br.y - br.h / 2) * k / 12)
      await settle(p)
      const l = (await lights(p, '#sb-rail')).filter((x) => /fly/.test(x.host))[0]
      ok(same(l, fl[1], seam), 'RTL panel flotante: luz sobre su enlace', { l, b: fl[1] })
    } else ok(false, 'RTL: panel flotante no abierto')
    ok(errs.length === 0, 'RTL: consola limpia', errs)
    await ctx.close()
  }

  // ======================= 9. Oscuro y zona de marca: contraste del texto sobre la luz =======================
  for (const [label, scene] of [['claro', {}], ['oscuro', { dark: true }], ['zona de marca', { zone: true }], ['zona de marca oscura', { zone: true, dark: true }]]) {
    const { p, ctx, errs } = await open({ sb: ['default'], tb: ['plain'], ...scene })
    const lk = (await rect(p, '#sb-default .g-sidebar__item > .g-sidebar__link[href="#msg"]'))[0]
    await p.mouse.move(lk.x + 30, lk.y + lk.h / 2); await settle(p)
    const bgS = await composite(p, '#sb-default .has-highlight > .g-sidebar__highlight')
    const lab = ratio(await colorOf(p, '#sb-default .g-sidebar__link[href="#msg"] .g-sidebar__label'), bgS)
    const ico = ratio(await colorOf(p, '#sb-default .g-sidebar__link[href="#msg"] .g-sidebar__icon'), bgS)
    const rw = (await rect(p, '#t-plain .g-table__row'))[4]
    await p.mouse.move(rw.x + rw.w * 0.6, rw.y + rw.h / 2); await settle(p)
    const bgT = await composite(p, '#t-plain .has-highlight > .g-table__highlight')
    const tt = ratio(await colorOf(p, '#t-plain .g-table__row:nth-child(5) .g-table__title'), bgT)
    const tsr = ratio(await colorOf(p, '#t-plain .g-table__row:nth-child(5) .g-table__subtitle'), bgT)
    ok(lab >= 4.5 && ico >= 3 && tt >= 4.5 && tsr >= 4.5, `${label}: texto sobre la luz · sidebar etiqueta ${lab.toFixed(2)}, icono ${ico.toFixed(2)} · tabla título ${tt.toFixed(2)}, subtítulo ${tsr.toFixed(2)}`)
    info(`${label}: sidebar etiqueta ${lab.toFixed(2)}:1, icono ${ico.toFixed(2)}:1; tabla título ${tt.toFixed(2)}:1, subtítulo ${tsr.toFixed(2)}:1`)
    ok(errs.length === 0, `${label}: consola limpia`, errs)
    await ctx.close()
  }

  // ======================= 10. reduce y forced-colors (emulados) =======================
  {
    const { p, ctx } = await open({ sb: ['default'], tb: ['plain'] }, { reducedMotion: 'reduce' })
    const lk = (await rect(p, '#sb-default .g-sidebar__item > .g-sidebar__link'))
    await p.mouse.move(lk[0].x + 30, lk[0].y + lk[0].h / 2); await settle(p)
    await p.mouse.move(lk[3].x + 30, lk[3].y + lk[3].h / 2)
    const ys = new Set()
    for (let k = 0; k < 10; k++) { const l = (await lights(p, '#sb-default'))[0]; if (l) ys.add(Math.round(l.y)); await p.waitForTimeout(12) }
    const tp = await p.evaluate(() => [...document.querySelectorAll('.g-sidebar__highlight, .g-table__highlight')].map((e) => getComputedStyle(e).transitionProperty))
    ok(tp.every((t) => t === 'opacity') && ys.size <= 1, 'reduce: solo fundido, sin viaje (una sola posición)', { tp, ys: [...ys] })
    await ctx.close()
  }
  {
    const { p, ctx } = await open({ sb: ['default'], tb: ['plain', 'door'] }, { forcedColors: 'active' })
    await p.mouse.move(1590, 1390); await settle(p)
    const rest = await ownBg(p, '#au') // en colores forzados el sistema pinta Canvas en todo: se compara con el reposo
    const lk = (await rect(p, '#sb-default .g-sidebar__item > .g-sidebar__link'))[1]
    await p.mouse.move(lk.x + 30, lk.y + lk.h / 2); await settle(p)
    const onLink = await ownBg(p, '#au')
    const rw = (await rect(p, '#t-plain .g-table__row'))[1]
    const d = await p.evaluate(() => [...document.querySelectorAll('.g-sidebar__highlight, .g-table__highlight')].map((e) => getComputedStyle(e).display))
    ok(d.length > 0 && d.every((x) => x === 'none'), 'forced-colors: capas ocultas', d)
    await p.mouse.move(rw.x + rw.w / 2, rw.y + rw.h / 2); await settle(p)
    const onRow = await ownBg(p, '#au')
    ok(onLink === rest && onRow === rest, 'forced-colors: el puntero no añade fondos propios (igual que en reposo)', { rest, onLink, onRow })
    await p.focus('#sb-default .g-sidebar__item > .g-sidebar__link[href="#inbox"]')
    const fo = await p.evaluate(() => getComputedStyle(document.activeElement).outlineStyle)
    ok(fo !== 'none', 'forced-colors: el anillo de foco sigue visible', fo)
    await ctx.close()
  }

  // ======================= 11. GMenu sin cambio (M1: el puntero mueve el foco; una luz que sigue al foco) =======================
  {
    const { p, ctx, errs } = await open({ menu: true })
    await p.click('#mn-trigger'); await p.waitForTimeout(350)
    const its = await rect(p, '.g-menu__item')
    ok(its.length === 5, 'GMenu: cinco items', its.length)
    let maxBg = 0, follow = 0, total = 0, maxL = 0
    for (let y = its[0].y + 2; y < its.at(-1).y + its.at(-1).h - 2; y++) {
      await p.mouse.move(its[0].x + 30, y)
      if (Math.round(y) % 3) continue
      await p.waitForTimeout(220) // pausa del puntero (HOVER_MS 180)
      const s = await p.evaluate(([x, y]) => {
        const under = document.elementFromPoint(x, y)?.closest('.g-menu__item')
        const menu = document.querySelector('.has-highlight')
        const own = [...document.querySelectorAll('.g-menu__item')].filter((e) => { const c = getComputedStyle(e).backgroundColor; return c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent' }).length
        return { follow: !under || document.activeElement === under, own, lights: document.querySelectorAll('.g-menu .has-highlight, .g-menu.has-highlight, .has-highlight.g-menu__list, [class*="g-menu"].has-highlight').length, y: menu?.style.getPropertyValue('--_active-y'), gy: menu?.style.getPropertyValue('--_highlight-y') }
      }, [its[0].x + 30, y])
      total++
      if (s.follow) follow++
      maxBg = Math.max(maxBg, s.own)
      maxL = Math.max(maxL, s.lights)
      if (s.gy) ok(false, 'GMenu: no usa --_highlight-*', s)
    }
    ok(follow === total, `GMenu: el puntero mueve el foco (${follow}/${total})`)
    ok(maxL <= 1 && maxBg <= 1, `GMenu: una luz (máx. ${maxL}) y como mucho un fondo propio (máx. ${maxBg})`)
    const data = await p.evaluate(() => { const m = document.querySelector('.has-highlight'); return { y: m?.style.getPropertyValue('--_active-y'), h: m?.style.getPropertyValue('--_active-h') } })
    ok(/px$/.test(data.y) && /px$/.test(data.h), 'GMenu: sigue con --_active-y/-h (datos sin cambio)', data)
    ok(errs.length === 0, 'GMenu: consola limpia', errs)
    await ctx.close()
  }

  // ======================= 12. Instancias del propio playground (sin montar nada) =======================
  {
    const { p, ctx, errs } = await open(null, { viewport: { width: 1400, height: 1000 } })
    const seam = await seamOf(p)
    await p.locator('#pg-ic-sidebar').scrollIntoViewIfNeeded()
    await p.waitForTimeout(200)
    await eachTarget(p, '#pg-ic-sidebar', '#pg-ic-sidebar .g-sidebar__nav .g-sidebar__link:not([aria-disabled="true"])', seam, 'playground #pg-ic-sidebar')
    await p.locator('#sec-table .g-table').first().scrollIntoViewIfNeeded()
    await p.waitForTimeout(300)
    const tid = await p.evaluate(() => { const t = document.querySelector('#sec-table .g-table'); t.id ||= 'pg-sec-table'; return t.id })
    await p.evaluate((id) => document.getElementById(id).scrollIntoView({ block: 'start' }), tid)
    await p.waitForTimeout(300)
    await eachTarget(p, '#' + tid, `#${tid} .g-table__row`, 0, 'playground #sec-table (llana con selección y avatares)')
    await sweep(p, '#' + tid, `#${tid} .g-table__row`, (b) => b.x + b.w * 0.5, 'playground #sec-table', { maxOwn: 0 })
    ok(errs.length === 0, 'playground: consola limpia', errs)
    await ctx.close()
  }

  await browser.close()
  console.log(`${name}: ${r.pass}/${r.pass + r.fail}`)
  for (const s of r.info) console.log('  · ' + s)
  for (const f of r.fails) console.log('  FALLA ' + f)
  if (r.fail) process.exitCode = 1
}
