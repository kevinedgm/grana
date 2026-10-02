// Auditoría de coco (paso 5) de los ICONOS PÚBLICOS sobre los COMPONENTES REALES (GIcon.vue + registro createIcons +
// huecos por nombre de GTabs, GMenu y GSidebar + slot lead de GFormSection), con dist/ reconstruido y Vue global, en el
// playground (#sec-icons) y en un banco montado en la misma página con los componentes reales (Grana UMD + createIcons):
// - flip-rtl con el GIcon real en LTR/RTL (local, heredado y de página), compuesto con rotate y transform de la aplicación
//   y dentro del único hueco que transforma un icono de la aplicación (toggle-icon de GSidebar en riel);
// - lead de GFormSection: primera línea del título ±1px (corto, largo de varias líneas, con insignia, con acciones, RTL),
//   tamaño = título, el hueco manda sobre una clase de la aplicación, contraste ≥ 3:1, forced-colors;
// - tamaño del icono por nombre en GTabs, GMenu y GSidebar (expandido, riel y navbar) = el del hueco, y el hueco manda
//   sobre una clase de la aplicación; fuera de un hueco, la clase de la aplicación (48px) gana;
// - árbol de accesibilidad real (decorativo fuera, label → img con nombre, botón con el nombre del control);
// - 320px sin desborde; consola limpia; temas: defecto claro/oscuro, «Tema de prueba» y los diez generados (claro/oscuro).
// Ejecutar desde la raíz con dist/ reconstruido: node design/lab/icons/auditoria-verificar.mjs
// Opcional: --engines=chromium   --origin=http://localhost:4173   --verbose (tablas)
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')

/* Servidor: el del playground (packages/vue como raíz) o uno propio con la misma raíz */
let ORIGIN = args.origin || 'http://localhost:4173'
let server
try { const r = await fetch(ORIGIN + '/playground/'); if (!r.ok) throw new Error() } catch {
  const VUE = join(ROOT, 'packages/vue')
  const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
  server = http.createServer(async (req, res) => {
    try {
      let p = normalize(join(VUE, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
      if (!p.startsWith(VUE)) throw new Error('fuera')
      if (p.endsWith('/')) p += 'index.html'
      res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(await readFile(p))
    } catch { res.writeHead(404).end() }
  })
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  ORIGIN = `http://127.0.0.1:${server.address().port}`
}
const PAGE = ORIGIN + '/playground/'

const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify']
const genCss = Object.fromEntries(await Promise.all(GEN.map(async (n) => [n, await readFile(join(ROOT, `design/lab/tema-oscuro/dark-color-presence/generated/${n}.css`), 'utf8')])))

let total = 0, failed = 0
const fails = []
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(msg) } }
const near = (a, b, t = 1) => Math.abs(a - b) <= t
const notes = []
const errors = []
const contrastRows = []

/* ---------- Banco con los componentes reales, montado en la página del playground ---------- */
const mountBench = () => {
  const css = document.createElement('style')
  css.textContent = `
    .au-rot { rotate: 90deg; } .au-tr { transform: rotate(90deg); }
    #au { display: grid; gap: 24px; padding: 16px; background: var(--g-color-surface); color: var(--g-color-text); }
    #au .au-narrow { max-inline-size: 260px; }
    #au .au-side { display: flex; block-size: 280px; inline-size: min(100%, 560px); position: relative; }
  `
  document.head.appendChild(css)
  const host = document.createElement('div')
  host.id = 'au-host'
  document.querySelector('#sec-icons').appendChild(host)
  const labels = { collapse: 'Contraer', expand: 'Expandir', more: 'Más', moreActive: 'contiene la página actual', drawer: 'Navegación', close: 'Cerrar', search: 'Buscar' }
  const items = [{ id: 'inicio', label: 'Inicio', href: '#inicio', icon: 'house' }, { id: 'bandeja', label: 'Bandeja', href: '#bandeja', icon: 'inbox' }, { id: 'acceso', label: 'Acceso', href: '#acceso', icon: 'lock-open' }]
  const app = Vue.createApp({
    data: () => ({ labels, items, tabItems: [{ id: 'a', label: 'Perfil', icon: 'user' }, { id: 'b', label: 'Acceso', icon: 'lock-open' }], tab: 'a', side: 'inicio' }),
    template: `
    <div id="au">
      <g-form aria-label="Banco" :labels="{ sectionOptional: 'Opcional' }">
        <g-form-section id="au-short" title="Acceso"><template #lead><g-icon name="lock-open"></g-icon></template></g-form-section>
        <g-form-section id="au-none" title="Sin icono" description="El título abre la fila."></g-form-section>
        <div class="au-narrow"><g-form-section id="au-long" title="Acceso y seguridad del registro de proveedores externos y de sus delegados" description="Quién puede editar."><template #lead><g-icon name="lock-open"></g-icon></template></g-form-section></div>
        <div class="au-narrow"><g-form-section id="au-badge" optional title="Acceso y seguridad del registro de proveedores"><template #lead><g-icon name="lock-open"></g-icon></template></g-form-section></div>
        <g-form-section id="au-full" optional title="Acceso y seguridad" description="Con insignia y acciones."><template #lead><g-icon name="lock-open"></g-icon></template><template #actions><g-btn size="sm" variant="outline">Editar</g-btn></template></g-form-section>
        <g-form-section id="au-class" title="Clase de la aplicación"><template #lead><g-icon name="lock-open" class="pg-ic-48"></g-icon></template></g-form-section>
        <div dir="rtl" lang="ar"><g-form-section id="au-rtl" title="الوصول والأمان" description="من يمكنه التعديل"><template #lead><g-icon name="lock-open" flip-rtl></g-icon></template></g-form-section></div>
      </g-form>
      <div id="au-flip">
        <span dir="ltr"><g-icon id="au-f-ltr-rot" name="chevron-right" flip-rtl class="au-rot"></g-icon></span>
        <span dir="rtl"><g-icon id="au-f-rtl-rot" name="chevron-right" flip-rtl class="au-rot"></g-icon></span>
        <span dir="rtl"><g-icon id="au-f-rtl-tr" name="chevron-right" flip-rtl class="au-tr"></g-icon></span>
        <div dir="rtl"><p><span><g-icon id="au-f-inh" name="arrow-right" flip-rtl></g-icon></span></p></div>
        <div dir="rtl"><span dir="ltr"><g-icon id="au-f-local-ltr" name="arrow-right" flip-rtl></g-icon></span></div>
        <span dir="rtl"><g-icon id="au-f-check" name="check"></g-icon></span>
        <span dir="rtl"><g-btn id="au-f-btn" variant="outline">التالي<template #append><g-icon name="arrow-right" flip-rtl></g-icon></template></g-btn></span>
        <span id="au-f-48"><g-icon name="circle-check" class="pg-ic-48"></g-icon></span>
      </div>
      <div><g-tabs id="au-tabs-slot" v-model="tab" :items="tabItems" label="Banco tabs"><template #icon="{ item }"><g-icon :name="item.icon" class="pg-ic-48"></g-icon></template></g-tabs></div>
      <div class="au-side" id="au-side-exp-ltr"><g-sidebar v-model="side" :items="items" label="Exp LTR" :labels="labels" mode="expanded" contained style="flex:none"><template #toggle-icon><g-icon name="panel-left" flip-rtl></g-icon></template></g-sidebar></div>
      <div class="au-side" id="au-side-rail-ltr"><g-sidebar v-model="side" :items="items" label="Riel LTR" :labels="labels" mode="rail" contained style="flex:none"><template #toggle-icon><g-icon name="panel-left" flip-rtl></g-icon></template></g-sidebar></div>
      <div class="au-side" id="au-side-exp-rtl" dir="rtl"><g-sidebar v-model="side" :items="items" label="Exp RTL" :labels="labels" mode="expanded" contained style="flex:none"><template #toggle-icon><g-icon name="panel-left" flip-rtl></g-icon></template></g-sidebar></div>
      <div class="au-side" id="au-side-rail-rtl" dir="rtl"><g-sidebar v-model="side" :items="items" label="Riel RTL" :labels="labels" mode="rail" contained style="flex:none"><template #toggle-icon><g-icon name="panel-left" flip-rtl></g-icon></template></g-sidebar></div>
      <div class="au-side" id="au-side-navbar"><g-sidebar v-model="side" :items="items" label="Barra" :labels="labels" mode="navbar" contained style="flex:none"></g-sidebar></div>
      <div class="au-side" id="au-side-rail-slot"><g-sidebar v-model="side" :items="items" label="Riel clase" :labels="labels" mode="rail" contained style="flex:none"><template #icon="{ item }"><g-icon :name="item.icon" class="pg-ic-48"></g-icon></template></g-sidebar></div>
    </div>`
  })
  app.use(Grana).use(Grana.createIcons(Object.values(window.LUCIDE_STATIC))).mount(host)
}

/* ---------- En la página: medidas ---------- */
const probe = () => {
  const px = parseFloat
  const R = (el) => el.getBoundingClientRect()
  const $ = (s, r = document) => r.querySelector(s)
  const cv = document.createElement('canvas'); cv.width = cv.height = 1
  const ctx = cv.getContext('2d', { willReadFrequently: true })
  const rgba = (s) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = s; ctx.fillRect(0, 0, 1, 1); const d = ctx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
  const over = (t, b) => { const a = t[3]; return [t[0] * a + b[0] * (1 - a), t[1] * a + b[1] * (1 - a), t[2] * a + b[2] * (1 - a), 1] }
  const bgOf = (el) => {
    const layers = []
    for (let n = el; n; n = n.parentElement) { const k = rgba(getComputedStyle(n).backgroundColor); if (k[3] > 0) { layers.push(k); if (k[3] >= 1) break } }
    let base = rgba(getComputedStyle(document.documentElement).backgroundColor); if (base[3] < 1) base = [255, 255, 255, 1]
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base)
    return base
  }
  const lum = (k) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(k[0]) + 0.7152 * f(k[1]) + 0.0722 * f(k[2]) }
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2) }
  const contrast = (el) => { const bg = bgOf(el); return ratio(over(rgba(getComputedStyle(el).color), bg), bg) }
  // Signo horizontal neto del dibujo: scale (individual) × transform (matriz) × rotate (solo se mide su presencia)
  const xsign = (el) => {
    const cs = getComputedStyle(el)
    const s = cs.scale === 'none' ? 1 : Math.sign(px(cs.scale.split(' ')[0]))
    let t = 1
    if (cs.transform !== 'none') { const m = cs.transform.match(/matrix\(([^)]+)\)/); if (m) { const [a, b, c, d] = m[1].split(',').map(Number); t = Math.sign(a * d - b * c) } }
    return s * t
  }
  const icon = (el) => el && { w: +R(el).width.toFixed(2), h: +R(el).height.toFixed(2), scale: getComputedStyle(el).scale, rotate: getComputedStyle(el).rotate, transform: getComputedStyle(el).transform, sign: xsign(el), hidden: el.getAttribute('aria-hidden'), role: el.getAttribute('role'), label: el.getAttribute('aria-label'), tabindex: el.getAttribute('tabindex'), focusable: el.getAttribute('focusable'), fs: px(getComputedStyle(el).fontSize), stroke: getComputedStyle(el).stroke, color: getComputedStyle(el).color }
  const section = (s) => {
    if (!s) return null
    const lead = $('.g-form-section__lead', s), title = $('.g-form-section__title', s), heading = $('.g-form-section__heading', s)
    const tcs = getComputedStyle(title); const lh = px(tcs.lineHeight)
    const o = { titleTop: R(title).top, titleLeft: R(title).left, titleRight: R(title).right, lh, tfs: px(tcs.fontSize), lines: Math.round(R(title).height / lh), tag: title.tagName, hasLead: !!lead, headingH: R(heading).height, first: heading.firstElementChild.className, name: title.textContent.trim() }
    const badge = $('.g-badge', heading); if (badge) o.badgeTop = R(badge).top, o.badgeBottom = R(badge).bottom
    if (lead) {
      const ic = $('.g-icon', lead); const dir = getComputedStyle(heading).direction
      o.lead = { aria: lead.getAttribute('aria-hidden'), w: R(lead).width, h: R(lead).height, top: R(lead).top, left: R(lead).left, right: R(lead).right, iw: R(ic).width, ih: R(ic).height, icy: R(ic).top + R(ic).height / 2, dir, contrast: contrast(lead), next: lead.nextElementSibling.className, stroke: getComputedStyle(ic).stroke, color: getComputedStyle(lead).color, gap: dir === 'rtl' ? +(R(lead).left - R(title).right).toFixed(2) : +(R(title).left - R(lead).right).toFixed(2), gapWanted: px(getComputedStyle(heading).columnGap) }
    }
    return o
  }
  const hueco = (box) => box && { w: +R(box).width.toFixed(2), h: +R(box).height.toFixed(2), svg: icon($('svg', box)), contrast: $('svg', box) ? contrast($('svg', box)) : null, cls: box.className }
  const out = {}
  out.sections = Object.fromEntries(['pg-ic-section', 'au-short', 'au-none', 'au-long', 'au-badge', 'au-full', 'au-class', 'au-rtl'].map((id) => [id, section(document.getElementById(id))]))
  out.icons = {
    deco: icon($('#pg-ic-deco .g-icon')), label: icon($('#pg-ic-label .g-icon')), size48: icon($('#pg-ic-size .g-icon')), btn: icon($('#pg-ic-btn .g-icon')), open: icon($('#pg-ic-open .g-icon')),
    ltr: icon($('#pg-ic-ltr .g-icon')), rtl: icon($('#pg-ic-rtl .g-icon')), rtlNo: icon($('#pg-ic-rtl-noflip .g-icon')),
    ltrRot: icon($('#au-f-ltr-rot')), rtlRot: icon($('#au-f-rtl-rot')), rtlTr: icon($('#au-f-rtl-tr')), inh: icon($('#au-f-inh')), localLtr: icon($('#au-f-local-ltr')), check: icon($('#au-f-check')), btnAppend: icon($('#au-f-btn .g-icon')), app48: icon($('#au-f-48 .g-icon')),
  }
  out.decoParentFs = px(getComputedStyle($('#pg-ic-deco')).fontSize)
  out.decoParentColor = getComputedStyle($('#pg-ic-deco')).color
  // Huecos por nombre
  out.tabs = [...document.querySelectorAll('#pg-ic-tabs .g-tabs__icon')].map(hueco)
  out.tabFs = px(getComputedStyle($('#pg-ic-tabs .g-tabs__tab')).fontSize)
  out.tabsSlot48 = [...document.querySelectorAll('#au-tabs-slot .g-tabs__icon')].map(hueco)
  out.menu = [...document.querySelectorAll('.g-menu__icon')].filter((b) => b.closest('[id]') && b.offsetParent !== null).map(hueco)
  out.side = {}
  for (const id of ['pg-ic-sidebar', 'au-side-exp-ltr', 'au-side-rail-ltr', 'au-side-exp-rtl', 'au-side-rail-rtl', 'au-side-navbar', 'au-side-rail-slot']) {
    const root = document.getElementById(id)
    const sb = root.classList.contains('g-sidebar') ? root : $('.g-sidebar', root)
    const ico = px(getComputedStyle(document.documentElement).getPropertyValue('--g-space-1')) * 5 // --_ico de GSidebar
    const tg = $('.g-sidebar__toggle > svg', root)
    out.side[id] = { cls: sb.className, ico, icons: [...root.querySelectorAll('.g-sidebar__icon')].filter((b) => b.querySelector('svg') && b.offsetParent !== null).map(hueco), toggle: tg ? { ...icon(tg), dir: getComputedStyle(tg).direction } : null }
  }
  // GBtn, GInput, GBadge: icono frente al texto (informativo para lima)
  const b = $('#sec-icons .g-btn .g-btn__prepend'); const bl = b && b.closest('.g-btn')
  out.btnPrepend = b && { icon: icon($('svg', b)), fs: px(getComputedStyle(bl).fontSize) }
  const inp = $('#sec-input .g-input__prepend'); out.inputPrepend = inp && { icon: icon($('svg', inp)), fs: px(getComputedStyle(inp.closest('.g-input__control') || inp.parentElement).fontSize), box: hueco(inp) }
  const bi = $('.g-badge__icon'); out.badgeIcon = bi && { box: hueco(bi), fs: px(getComputedStyle(bi).fontSize) }
  // Desborde
  const sec = document.getElementById('sec-icons'); const S = R(sec)
  out.overflow = { doc: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth, out: [...sec.querySelectorAll('.g-icon, .g-form-section, .g-tabs, .g-btn')].filter((e) => {
    const r = R(e); if (!(r.width > 0 && (r.left < S.left - 1 || r.right > S.right + 1))) return false
    // Dentro de un contenedor con desplazamiento propio (pestañas con overflow) o recortado: no desborda la página
    for (let n = e.parentElement; n && n !== sec; n = n.parentElement) { const o = getComputedStyle(n); if (/(auto|scroll|hidden|clip)/.test(o.overflowX)) return false }
    return true
  }).map((e) => (e.closest('[id]') || {}).id + ' ' + (e.className.baseVal ?? e.className)).slice(0, 5) }
  return out
}

for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  const open = async ({ width = 1280, height = 900, dark = false, theme = '', test = false, forced, rtl = false, reduced = false } = {}) => {
    const ctx = await browser.newContext({ viewport: { width, height }, colorScheme: dark ? 'dark' : 'light', reducedMotion: reduced ? 'reduce' : 'no-preference' })
    const page = await ctx.newPage()
    page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errors.push(`${engine}: ${m.text()}`) })
    page.on('pageerror', (e) => errors.push(`${engine}: ${e}`))
    page.on('requestfailed', (r) => errors.push(`${engine} red: ${r.url()}`))
    if (forced) await page.emulateMedia({ forcedColors: forced })
    await page.goto(PAGE + '#sec-icons')
    await page.waitForFunction(() => document.querySelector('#pg-ic-section .g-form-section__lead .g-icon'))
    await page.evaluate(mountBench)
    await page.waitForFunction(() => document.querySelector('#au-side-navbar .g-sidebar') && document.querySelector('#au-rtl .g-icon'))
    if (test) { await page.click('#pg-theme-test'); await page.waitForTimeout(50) }
    if (theme) await page.addStyleTag({ content: theme })
    if (rtl) await page.evaluate(() => { document.documentElement.dir = 'rtl' })
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(400) // transiciones del sidebar (riel) y adaptación
    return page
  }
  const E = engine + ' · '

  /* 1 · Temas: lead (alineación, tamaño, contraste) y tamaño de los iconos por nombre */
  const configs = [['defecto', '', false], ['prueba', '', true], ...GEN.map((n) => [n, genCss[n], false])]
  let base
  for (const [name, theme, test] of configs) {
    for (const dark of [false, true]) {
      const page = await open({ dark, theme, test })
      const m = await page.evaluate(probe)
      if (name === 'defecto' && !dark) base = m
      const tag = `${E}${name} ${dark ? 'oscuro' : 'claro'}`
      const row = { tema: `${name} ${dark ? 'oscuro' : 'claro'}`, engine }
      for (const [id, s] of Object.entries(m.sections)) {
        if (!s || !s.hasLead || id === 'au-class') continue
        const cy = s.titleTop + s.lh / 2
        ok(near(s.lead.icy, cy, 1), `${tag}: ${id} icono centrado en la primera línea del título (${s.lead.icy.toFixed(2)} vs ${cy.toFixed(2)})`)
        ok(near(s.lead.top, s.titleTop, 1), `${tag}: ${id} el hueco arranca donde el título (${s.lead.top.toFixed(2)} vs ${s.titleTop.toFixed(2)})`)
        ok(near(s.lead.iw, s.tfs, 0.5) && near(s.lead.ih, s.tfs, 0.5), `${tag}: ${id} icono = tamaño del título (${s.lead.iw}×${s.lead.ih} vs ${s.tfs})`)
        ok(s.lead.contrast >= 3, `${tag}: ${id} contraste del lead ${s.lead.contrast} ≥ 3`)
        row.lead = Math.min(row.lead ?? 99, s.lead.contrast)
      }
      for (const t of m.tabs) ok(near(t.svg.w, t.w, 0.1) && near(t.w, m.tabFs * 1.15, 0.2), `${tag}: GTabs icono por nombre = hueco 1.15em (${t.svg.w} / ${t.w} / ${m.tabFs})`)
      for (const [id, sd] of Object.entries(m.side)) if (id !== 'au-side-rail-slot') for (const t of sd.icons) ok(near(t.svg.w, sd.ico, 0.1) && near(t.svg.h, sd.ico, 0.1), `${tag}: ${id} icono = --_ico (${t.svg.w}×${t.svg.h} vs ${sd.ico})`)
      row.tabs = Math.min(...m.tabs.map((t) => t.contrast))
      row.side = Math.min(...m.side['pg-ic-sidebar'].icons.map((t) => t.contrast))
      contrastRows.push(row)
      await page.context().close()
    }
  }

  /* 2 · Tema por defecto claro: detalle */
  const m = base
  const I = m.icons, S = m.sections
  // GIcon suelto: tamaño, color, árbol
  ok(near(I.deco.w, m.decoParentFs, 0.1) && near(I.deco.h, m.decoParentFs, 0.1), `${E}decorativo = 1em del texto (${I.deco.w} vs ${m.decoParentFs})`)
  ok(I.deco.stroke === m.decoParentColor || I.deco.color === m.decoParentColor, `${E}currentColor = color del texto`)
  ok(I.size48.w === 48 && I.size48.h === 48 && I.app48.w === 48, `${E}clase de la aplicación fuera de un hueco: 48px (${I.size48.w}, ${I.app48.w})`)
  ok(I.deco.hidden === 'true' && !I.deco.role && !I.deco.label && I.deco.focusable === 'false' && I.deco.tabindex === null, `${E}decorativo: aria-hidden, sin role/label, focusable=false, sin tabindex`)
  ok(I.label.role === 'img' && I.label.label === 'Bloqueado' && I.label.hidden === null && I.label.tabindex === null, `${E}con label: role=img + aria-label, sin aria-hidden ni tabindex`)
  ok(I.btn.hidden === 'true', `${E}icono del botón solo icono: decorativo (el nombre va en el control)`)
  ok(I.open && I.open.w > 0, `${E}lock-open (registro de la aplicación) se dibuja`)
  // flip-rtl
  ok(I.ltr.sign === 1 && I.ltr.scale === 'none', `${E}flip-rtl en LTR: sin espejo (${I.ltr.scale})`)
  ok(I.rtl.sign === -1, `${E}flip-rtl en RTL local: espejado (${I.rtl.scale})`)
  ok(I.rtlNo.sign === 1, `${E}check sin flip-rtl en RTL: no se espeja`)
  ok(I.inh.sign === -1, `${E}flip-rtl heredado de un antecesor RTL: espejado`)
  ok(I.localLtr.sign === 1, `${E}flip-rtl con dir=ltr local dentro de RTL: sin espejo`)
  ok(I.check.sign === 1, `${E}check en RTL: sin espejo`)
  ok(I.ltrRot.rotate === '90deg' && I.ltrRot.sign === 1, `${E}rotate de la aplicación en LTR: intacto, sin espejo (${I.ltrRot.rotate} / ${I.ltrRot.scale})`)
  ok(I.rtlRot.rotate === '90deg' && I.rtlRot.sign === -1, `${E}rotate de la aplicación en RTL: intacto y espejado (${I.rtlRot.rotate} / ${I.rtlRot.scale})`)
  ok(I.rtlTr.transform !== 'none' && I.rtlTr.sign === -1 && I.rtlTr.scale !== 'none', `${E}transform de la aplicación en RTL: intacto y espejado (${I.rtlTr.transform} / ${I.rtlTr.scale})`)
  ok(I.btnAppend.sign === -1 && near(I.btnAppend.w, I.btnAppend.fs, 0.1), `${E}GBtn append flip-rtl en RTL: espejado y 1em (${I.btnAppend.w} / ${I.btnAppend.fs})`)
  // Hueco que transforma un icono de la aplicación: toggle-icon de GSidebar (el espejo del riel no debe pisar flip-rtl)
  const sgn = (id) => m.side[id].toggle.sign
  ok(sgn('au-side-exp-ltr') === 1, `${E}GSidebar toggle-icon flip-rtl, expandido LTR: sin espejo (${sgn('au-side-exp-ltr')})`)
  ok(sgn('au-side-rail-ltr') === -1, `${E}GSidebar toggle-icon flip-rtl, riel LTR: espejado (estado del riel) (${sgn('au-side-rail-ltr')})`)
  ok(sgn('au-side-exp-rtl') === -1, `${E}GSidebar toggle-icon flip-rtl, expandido RTL: espejado (flip-rtl) (${sgn('au-side-exp-rtl')})`)
  ok(sgn('au-side-rail-rtl') === 1, `${E}GSidebar toggle-icon flip-rtl, riel RTL: los dos espejos se componen (identidad) (${sgn('au-side-rail-rtl')}: scale ${m.side['au-side-rail-rtl'].toggle.scale}, transform ${m.side['au-side-rail-rtl'].toggle.transform})`)
  for (const id of ['au-side-exp-ltr', 'au-side-rail-ltr']) ok(near(m.side[id].toggle.w, m.side[id].ico, 0.1), `${E}${id}: toggle-icon = --_ico`)
  // El hueco manda sobre una clase de la aplicación
  // Dentro de un hueco, una clase de tamaño de la aplicación TAMBIÉN gana: el CSS de los componentes vive en la capa
  // grana.components y el de la aplicación va sin capa (DECISIONS #4), así que la especificidad del hueco no cuenta.
  // Se comprueba el comportamiento real (hallazgo 1 de auditoria.md; contrato para lima)
  for (const t of m.tabsSlot48) ok(t.svg.w === 48, `${E}GTabs (slot) con clase 48px: gana la clase de la aplicación (capa) (${t.svg.w})`)
  for (const t of m.side['au-side-rail-slot'].icons) ok(t.svg.w === 48, `${E}GSidebar riel (slot) con clase 48px: gana la clase de la aplicación (capa) (${t.svg.w})`)
  ok(S['au-class'].lead.iw === 48, `${E}lead con clase 48px: gana la clase de la aplicación (capa) (${S['au-class'].lead.iw})`)
  // GSidebar: riel y navbar con nombres
  ok(m.side['au-side-rail-ltr'].icons.length === 3 && m.side['au-side-navbar'].icons.length >= 3, `${E}GSidebar riel y navbar dibujan los 3 iconos por nombre (${m.side['au-side-rail-ltr'].icons.length}, ${m.side['au-side-navbar'].icons.length})`)
  ok(/mode-navbar/.test(m.side['au-side-navbar'].cls) && /mode-rail/.test(m.side['au-side-rail-ltr'].cls), `${E}GSidebar en navbar y riel de verdad (${m.side['au-side-navbar'].cls})`)
  ok(m.side['pg-ic-sidebar'].icons.every((t) => t.svg.hidden === 'true'), `${E}GSidebar: iconos por nombre decorativos`)
  ok(m.tabs.length === 4 && m.tabs.every((t) => t.svg.hidden === 'true'), `${E}GTabs: 4 iconos por nombre, decorativos (lock-open del registro incluido)`)
  // Lead: detalle
  ok(!S['au-none'].hasLead && /title/.test(S['au-none'].first), `${E}sin lead: no hay elemento y el título abre la fila`)
  ok(S['pg-ic-section'].lead.aria === 'true' && S['pg-ic-section'].tag === 'H3' && /title/.test(S['pg-ic-section'].lead.next), `${E}lead aria-hidden, inmediatamente antes del hN`)
  ok(near(S['pg-ic-section'].lead.gap, S['pg-ic-section'].lead.gapWanted, 0.5), `${E}separación lead → título = gap (${S['pg-ic-section'].lead.gap})`)
  ok(near(S['pg-ic-section'].lead.h, S['pg-ic-section'].lh, 0.5), `${E}hueco = interlineado del título`)
  ok(near(S['au-short'].headingH, S['au-none'].headingH, 0.5), `${E}con lead el encabezado no crece (${S['au-short'].headingH} vs ${S['au-none'].headingH})`)
  ok(S['au-long'].lines >= 3 && S['au-long'].lead.left < S['au-long'].titleLeft, `${E}título largo (${S['au-long'].lines} líneas): lead en la primera y en la misma fila`)
  ok(S['au-badge'].lines >= 2 && S['au-badge'].badgeTop >= S['au-badge'].titleTop, `${E}título largo con insignia (${S['au-badge'].lines} líneas): lead en la primera línea, la insignia no lo desplaza`)
  ok(S['au-full'].badgeTop !== undefined, `${E}lead + insignia + acciones: presente`)
  ok(S['au-rtl'].lead.dir === 'rtl' && S['au-rtl'].lead.right > S['au-rtl'].titleRight && near(S['au-rtl'].lead.gap, S['au-rtl'].lead.gapWanted, 0.5), `${E}RTL: lead al inicio (derecha), gap ${S['au-rtl'].lead.gap}`)
  notes.push(`${engine}: lead ${S['pg-ic-section'].lead.w}×${S['pg-ic-section'].lead.h}, icono ${S['pg-ic-section'].lead.iw}px, Δcentro ${(S['pg-ic-section'].lead.icy - (S['pg-ic-section'].titleTop + S['pg-ic-section'].lh / 2)).toFixed(2)}px; GTabs ${m.tabs[0].svg.w}px (tab ${m.tabFs}px); GSidebar ${m.side['pg-ic-sidebar'].icons[0].svg.w}px; GBtn prepend ${m.btnPrepend?.icon.w}px (texto ${m.btnPrepend?.fs}px); GInput prepend ${m.inputPrepend?.icon.w}px; GBadge icono ${m.badgeIcon?.box.svg?.w}px en caja ${m.badgeIcon?.box.w}px (texto ${m.badgeIcon?.fs}px)`)

  /* 3 · GMenu abierto: tamaño del icono por nombre = hueco (--_mark), decorativo */
  {
    const page = await open()
    await page.locator('#sec-icons .g-btn', { hasText: 'Acciones' }).click()
    await page.waitForSelector('.g-menu__icon svg', { state: 'visible' })
    const mm = await page.evaluate(probe)
    ok(mm.menu.length === 4, `${E}GMenu: 4 iconos por nombre (${mm.menu.length})`)
    for (const t of mm.menu) ok(near(t.svg.w, t.w, 0.1) && near(t.svg.h, t.h, 0.1) && t.svg.hidden === 'true', `${E}GMenu icono = hueco (${t.svg.w} / ${t.w}) y decorativo`)
    const tree = await page.locator('[role="menu"]').first().ariaSnapshot()
    ok(/menuitem "Desbloquear"/.test(tree) && !/img/.test(tree), `${E}GMenu árbol: «Desbloquear» por su texto, sin img (${tree.split('\n').slice(0, 3).join(' / ')})`)
    notes.push(`${engine}: GMenu icono ${mm.menu[0]?.svg.w}px`)
    await page.context().close()
  }

  /* 4 · Árbol de accesibilidad real */
  {
    const page = await open()
    const sec = page.locator('#sec-icons')
    ok(await sec.getByRole('img', { name: 'Bloqueado', exact: true }).count() === 1, `${E}árbol: un img «Bloqueado»`)
    ok(await sec.getByRole('img').count() === 1, `${E}árbol: ningún otro icono es img (decorativos fuera) (${await sec.getByRole('img').count()})`)
    ok(await sec.getByRole('button', { name: 'Desbloquear', exact: true }).count() === 1, `${E}árbol: el botón se llama por su aria-label`)
    const snap = await page.locator('#pg-ic-deco').ariaSnapshot()
    ok(/Formulario bloqueado/.test(snap) && !/img/.test(snap), `${E}árbol: decorativo fuera, solo el texto (${snap.trim()})`)
    const h = await page.locator('#pg-ic-section').getByRole('heading').first()
    ok((await h.textContent()).trim() === 'Acceso y seguridad' && await page.locator('#pg-ic-section').getByRole('heading', { name: 'Acceso y seguridad', exact: true }).count() === 1, `${E}árbol: el encabezado con lead se llama solo por su título`)
    ok(await page.locator('#pg-ic-tabs').getByRole('tab', { name: 'Acceso', exact: true }).count() === 1, `${E}árbol: la pestaña con icono se llama por su texto`)
    ok(await page.locator('#pg-ic-sidebar').getByRole('link', { name: 'Acceso', exact: true }).count() === 1, `${E}árbol: el enlace del sidebar se llama por su texto`)
    const focusables = await page.evaluate(() => [...document.querySelectorAll('#sec-icons svg')].filter((s) => s.getAttribute('tabindex') !== null || s.getAttribute('focusable') !== 'false').length)
    ok(focusables === 0, `${E}ningún svg enfocable en la sección (${focusables})`)
    await page.context().close()
  }

  /* 5 · RTL de página y movimiento reducido */
  {
    const page = await open({ rtl: true })
    const mr = await page.evaluate(probe)
    ok(mr.icons.ltr.sign === 1 && mr.icons.rtl.sign === -1, `${E}RTL de página: el host dir=ltr local no espeja; el RTL sí`)
    const s = mr.sections['pg-ic-section']
    ok(s.lead.dir === 'rtl' && near(s.lead.icy, s.titleTop + s.lh / 2, 1) && s.lead.right > s.titleRight, `${E}RTL de página: lead al inicio y alineado`)
    await page.context().close()
    const pr = await open({ reduced: true })
    const mrd = await pr.evaluate(probe)
    ok(mrd.side['au-side-rail-ltr'].toggle.sign === -1 && mrd.side['au-side-rail-rtl'].toggle.sign === 1, `${E}movimiento reducido: el riel conserva el estado del toggle (LTR ${mrd.side['au-side-rail-ltr'].toggle.sign}, RTL ${mrd.side['au-side-rail-rtl'].toggle.sign})`)
    await pr.context().close()
  }

  /* 6 · 320px */
  for (const [label, o] of [['ltr', {}], ['rtl', { rtl: true }], ['spotify oscuro', { theme: genCss.spotify, dark: true }]]) {
    const page = await open({ width: 320, height: 800, ...o })
    const mw = await page.evaluate(probe)
    ok(mw.overflow.doc <= mw.overflow.vw, `${E}320px ${label}: sin desplazamiento horizontal (${mw.overflow.doc} > ${mw.overflow.vw})`)
    ok(mw.overflow.out.length === 0, `${E}320px ${label}: nada fuera de la sección (${mw.overflow.out.join(', ')})`)
    for (const id of ['pg-ic-section', 'au-long', 'au-badge', 'au-full']) { const s = mw.sections[id]; ok(near(s.lead.icy, s.titleTop + s.lh / 2, 1), `${E}320px ${label}: ${id} lead alineado`) }
    await page.context().close()
  }

  /* 7 · forced-colors (solo Chromium emula) */
  if (engine === 'chromium') {
    for (const dark of [false, true]) {
      const page = await open({ forced: 'active', dark })
      const mf = await page.evaluate(probe)
      const s = mf.sections['pg-ic-section']
      ok(s.lead.stroke === s.lead.color, `${E}forced-colors ${dark ? 'oscuro' : 'claro'}: trazo del lead = currentColor (${s.lead.stroke} / ${s.lead.color})`)
      ok(s.lead.contrast >= 3, `${E}forced-colors ${dark ? 'oscuro' : 'claro'}: lead ${s.lead.contrast} ≥ 3`)
      ok(mf.icons.label.stroke === mf.icons.label.color && mf.tabs.every((t) => t.svg.stroke === t.svg.color), `${E}forced-colors: GIcon y GTabs siguen a currentColor`)
      notes.push(`${engine} forced-colors ${dark ? 'oscuro' : 'claro'}: lead ${s.lead.contrast}:1`)
      await page.context().close()
    }
  }
  await browser.close()
}
server?.close()

/* 8 · Ningún .vue/.js nuevo con literales ni <style> */
{
  const files = ['GIcon/GIcon.vue', 'GIcon/GLibIcon.js', 'GIcon/registry.js', 'GIcon/render.js', 'GTabs/GTabs.vue', 'GMenu/GMenu.vue', 'GSidebar/GSidebar.vue', 'GFormSection/GFormSection.vue']
  for (const f of files) {
    const whole = f.startsWith('GIcon/')
    const src = (await readFile(join(ROOT, 'packages/vue/src/components', f), 'utf8')).split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).filter((l) => whole || /GAppIcon|isIconName|g-form-section__lead|slots\.lead/.test(l)).join('\n').replace(/\/\/.*$/gm, '')
    const bad = src.match(/<style|#[0-9a-fA-F]{3,8}\b(?!\d)|rgba?\(|hsla?\(|oklch\(|\b\d+(\.\d+)?(px|rem)\b|style:\s*\{/g) || []
    ok(bad.length === 0, `${f}: sin <style> ni literales de tema (${bad.join(', ')})`)
  }
}

ok(errors.length === 0, `consola limpia (${[...new Set(errors)].slice(0, 6).join(' | ')})`)
if (args.verbose) {
  console.table(contrastRows)
  console.log(notes.join('\n'))
}
console.log(`${total - failed}/${total}`)
if (failed) { console.log(fails.map((f) => ' · ' + f).join('\n')); process.exit(1) }
