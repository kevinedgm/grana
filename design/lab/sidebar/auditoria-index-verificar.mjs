// Auditoría posterior de coco · GSidebar appearance="index" y grupos plegables (#1060 a #1065, #1069, #1071) sobre el
// componente REAL (packages/vue/dist: grana.css + grana.umd.js + sidebar-index.umd.js), con la paridad valor a valor frente
// a design/lab/sidebar/r03/paridad.json (el prototipo de kiwi). Banco: design/lab/sidebar/r03-estilo/index.html (el marco
// calcado del sitio con el GSidebar real; &ext=0 lo carga sin la extensión).
// Desde la raíz:  node design/lab/sidebar/auditoria-index-verificar.mjs
//   Puerto 4211 (GRANA_PW_PORT lo cambia). ENGINES=chromium (Firefox y WebKit si están instalados)  VERBOSE=1
//   Los 11 temas de Dark Color Presence se REGENERAN con el CLI vigente en una carpeta temporal (la carpeta generated/ del
//   repositorio puede ir por detrás del motor; GEN_DIR=<carpeta> usa una ya generada).
// Requiere packages/vue/dist construido (npm run build). Escribe auditoria-index-resultados.json junto a este archivo.
import http from 'node:http'
import { readFile, writeFile, readdir, mkdtemp, cp } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { gzipSync } from 'node:zlib'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const HERE = fileURLToPath(new URL('./', import.meta.url))
const PORT = Number(process.env.GRANA_PW_PORT || 4211)
const ENGINES = (process.env.ENGINES || 'chromium').split(',')
const V = !!process.env.VERBOSE
const R = []
const NOTAS = []
const HALLAZGOS = new Set()
const MED = {}
const rec = (eng, part, name, ok, info = '') => { R.push({ eng, part, name, ok: !!ok, info: ok ? undefined : String(info).slice(0, 400) }); if (V || !ok) console.log(`${ok ? 'ok  ' : 'FALLA'} ${eng} ${part} · ${name}${!ok && info !== '' ? ' · ' + String(info).slice(0, 400) : ''}`) }

// ---------- 0 · Estático: tokens del CSS, dist al día, compuertas y peso ----------
{
  const eng = 'estático'
  const src = await readFile(join(ROOT, 'packages/vue/src/components/GSidebar/GSidebar.css'), 'utf8')
  const dist = await readFile(join(ROOT, 'packages/vue/dist/grana.css'), 'utf8')
  const noCom = src.replace(/\/\*[\s\S]*?\*\//g, '')
  rec(eng, 'tokens', 'primera línea: las cuatro capas en orden', /^@layer grana\.defaults, grana\.components, grana\.blocks, grana\.utilities;/.test(src.trimStart()))
  const vars = [...noCom.matchAll(/var\(\s*(--[\w-]+)\s*([,)])/g)]
  const bad = vars.filter((m) => !/^--(g|_)[\w-]*$/.test(m[1]))
  rec(eng, 'tokens', 'solo var(--g-*) y var(--_*)', bad.length === 0, bad.map((m) => m[1]).join(' '))
  const fb = vars.filter((m) => m[2] === ',')
  rec(eng, 'tokens', 'sin valores de respaldo en var()', fb.length === 0, fb.map((m) => m[1]).join(' '))
  const shell = vars.filter((m) => m[1].startsWith('--g-app-shell')).map((m) => m[1])
  rec(eng, 'tokens', 'del chasis solo --g-app-shell-header (lectura permitida, #1070)', shell.every((n) => n === '--g-app-shell-header'), [...new Set(shell)].join(' '))
  const colors = noCom.match(/#[0-9a-f]{3,8}\b|\b(rgb|rgba|hsl|hsla|oklch|oklab|lab|lch)\(/gi) || []
  rec(eng, 'tokens', 'sin colores literales (solo palabras de forced-colors y transparent)', colors.length === 0, colors.join(' '))
  // Bloque de la apariencia index y del plegado: medidas literales en px solo 24, 44 y 1 (patrón de texto oculto)
  const a = noCom.indexOf('.g-sidebar__group-body:not([hidden])')
  const b = noCom.indexOf('.g-sidebar__fly')
  const block = noCom.slice(a, b > a ? b : undefined)
  const px = [...new Set(block.match(/\b\d+(\.\d+)?px\b/g) || [])]
  rec(eng, 'tokens', 'index y plegado: literales en px solo 24, 44 y 1 (texto oculto)', px.every((p) => ['24px', '44px', '1px'].includes(p)), px.join(' '))
  const dur = [...new Set(block.match(/\b\d+(\.\d+)?m?s\b/g) || [])]
  rec(eng, 'tokens', 'index y plegado: sin duraciones literales (solo 0s)', dur.every((d) => d === '0s'), dur.join(' '))
  for (const sel of ['g-sidebar--appearance-index', 'g-sidebar__mark', 'g-sidebar__group-body'])
    rec(eng, 'compuertas', `${sel} en dist/grana.css (#1065)`, dist.includes(sel))
  // El dist es el del fuente actual: cada selector propio de index y del plegado está en dist/grana.css
  const sels = [...new Set([...block.matchAll(/(^|\})\s*([^{}@]+?)\s*\{/g)].map((m) => m[2].trim()).filter((s) => /g-sidebar/.test(s) && !/^(from|to|\d)/.test(s)))]
  // El minificador quita espacios y comillas de los atributos y escribe ::before/::after con un solo «:»
  const squash = (x) => x.replace(/["']/g, '').replace(/::(before|after)/g, ':$1').replace(/\s*([>,~+()])\s*/g, '$1').replace(/\s+/g, ' ').trim()
  const D = squash(dist)
  const missing = sels.filter((s) => !D.includes(squash(s)))
  rec(eng, 'dist', `dist/grana.css lleva los ${sels.length} selectores de index y plegado del fuente (construido al día)`, missing.length === 0, missing.slice(0, 4).join(' | '))
  const gz = async (f) => gzipSync(await readFile(join(ROOT, 'packages/vue/dist', f))).length
  const si = await gz('sidebar-index.js')
  MED.peso = { 'sidebar-index.js': si }
  rec(eng, 'peso', `dist/sidebar-index.js ${si} B gzip ≤ 3 840 (#1069)`, si <= 3840, si)
}

// ---------- Servidor y temas ----------
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.json': 'application/json' }
const server = http.createServer(async (req, res) => {
  try {
    const p = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!p.startsWith(ROOT)) throw new Error('fuera')
    const body = await readFile(p)
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(body)
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${PORT}/design/lab/sidebar/r03-estilo/index.html`
const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const PAR = JSON.parse(await readFile(join(HERE, 'r03/paridad.json'), 'utf8'))
let GEN_DIR = process.env.GEN_DIR
if (!GEN_DIR) {
  const t = await mkdtemp(join(tmpdir(), 'grana-dcp-'))
  await cp(join(ROOT, 'design/lab/tema-oscuro/dark-color-presence/themes'), join(t, 'themes'), { recursive: true })
  execFileSync(process.execPath, [join(ROOT, 'packages/cli/scripts/dark-color-presence.mjs'), t], { stdio: 'ignore' })
  GEN_DIR = join(t, 'generated')
  NOTAS.push('temas de Dark Color Presence regenerados con el CLI vigente en ' + GEN_DIR)
}
const THEMES = (await readdir(GEN_DIR)).filter((f) => /^[a-z-]+\.css$/.test(f) && !f.includes('variants')).map((f) => f.replace('.css', ''))

const HELPERS = () => {
  window.__b = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x * 10) / 10, y: Math.round(r.y * 10) / 10, w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10 } }
  window.__rgb = (c) => { const x = document.createElement('canvas').getContext('2d'); x.fillStyle = '#000'; x.fillStyle = c; x.fillRect(0, 0, 1, 1); const d = x.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2]] }
  window.__over = (a, b) => { const x = document.createElement('canvas').getContext('2d'); x.fillStyle = b; x.fillRect(0, 0, 1, 1); x.fillStyle = a; x.fillRect(0, 0, 1, 1); const d = x.getImageData(0, 0, 1, 1).data; return `rgb(${d[0]}, ${d[1]}, ${d[2]})` }
  window.__ratio = (a, b) => { a = __over(a, b); const lum = (p) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(p[0]) + 0.7152 * f(p[1]) + 0.0722 * f(p[2]) }; const A = lum(__rgb(a)), B = lum(__rgb(b)); return Math.round(((Math.max(A, B) + 0.05) / (Math.min(A, B) + 0.05)) * 100) / 100 }
  window.__tok = (n) => { const d = document.createElement('span'); d.style.color = `var(${n})`; document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c }
  window.__tg = (root, label) => [...document.querySelectorAll(root + ' button.g-sidebar__group-title')].find((b) => b.firstChild && b.firstChild.textContent.trim() === label)
  window.__vis = (e) => !!e && e.getClientRects().length > 0 && !e.closest('[hidden]')
  window.__name = (e) => e ? (e.matches('button.g-sidebar__group-title') ? 'btn:' + e.firstChild.textContent.trim() : e.querySelector('.g-sidebar__label') ? 'a:' + e.querySelector('.g-sidebar__label').textContent.trim() : e.tagName + '.' + e.className) : null
}
const SIDE = '.g-sidebar--appearance-index.g-sidebar--mode-expanded:not(.g-sidebar__drawer > *)'
const DRAWER = '.g-sidebar__drawer > .g-sidebar--appearance-index'

async function open(browser, { w, theme = 'claro', q = '', reduce = false, ctxOpts = {}, css = null, site = true }) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 768 ? 740 : 800 }, reducedMotion: reduce ? 'reduce' : 'no-preference', ...ctxOpts })
  // Avisos de desarrollo (#653): sin empaquetador process no existe y el catch los absorbe; el banco lo define para oírlos
  await ctx.addInitScript(() => { window.process = { env: { NODE_ENV: 'development' } } })
  const page = await ctx.newPage()
  const errs = []
  const warns = []
  page.on('console', (m) => { const t = m.text(); if (/\[Grana/.test(t)) warns.push(t); else if ((m.type() === 'error' || m.type() === 'warning') && !/net::ERR_|fonts\.g|Failed to load resource/.test(t)) errs.push(t) })
  page.on('pageerror', (e) => errs.push('pageerror ' + e.message))
  await page.goto(`${BASE}?p=comp${theme === 'oscuro' ? '&theme=dark' : ''}${q}`, { waitUntil: 'load' })
  await page.waitForSelector('.g-sidebar', { state: 'attached' })
  if (!site) await page.evaluate(() => document.querySelector('link[href$="banco.css"]').remove())
  if (css) await page.addStyleTag({ path: css })
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(HELPERS)
  await page.waitForTimeout(350)
  return { ctx, page, errs, warns }
}
async function openDrawer(page) {
  await page.focus('.mk-local__menu')
  await page.keyboard.press('Enter')
  await page.waitForSelector('.g-sidebar__drawer[open] button.g-sidebar__group-title', { timeout: 4000 })
  await page.waitForTimeout(450)
}

for (const eng of ENGINES) {
  let browser
  try { browser = await pw[eng].launch() } catch (e) { NOTAS.push(`${eng}: no instalado (${String(e.message).split('\n')[0].slice(0, 80)}); no verificado`); continue }

  // ---------- A · Paridad con r03/paridad.json (prototipo de kiwi), valor a valor, 4 anchos × claro/oscuro ----------
  for (const theme of ['claro', 'oscuro']) {
    for (const w of [1280, 1024, 768, 375]) {
      const narrow = w < 960
      const vista = `${theme}/${w}`
      const part = 'paridad ' + vista
      const { ctx, page, errs } = await open(browser, { w, theme })
      if (narrow) {
        await openDrawer(page)
        await page.evaluate(() => { document.querySelector('.g-sidebar__drawer .g-sidebar__nav').scrollTop = 0 })
        await page.waitForTimeout(150)
      }
      const S = await page.evaluate((sel) => {
        const s = document.querySelector(sel)
        const q = (x) => s.querySelector(x)
        const cs = (e) => getComputedStyle(e)
        const host = s.closest('.g-sidebar__drawer') || s
        const cur = [...s.querySelectorAll('[aria-current="page"]')].filter((a) => a.getClientRects().length)[0]
        const mark = q('.g-sidebar__mark')
        const dlg = s.closest('.g-sidebar__drawer')
        return {
          columna: __b(host), grupo: __b(q('.g-sidebar__group')), título: __b(q('.g-sidebar__group-title')), enlace: __b(q('.g-sidebar__link')), actual: __b(cur),
          marca: mark && /is-full/.test(mark.className) ? __b(mark) : null,
          color: { titulo: cs(q('.g-sidebar__group-title')).color, enlace: cs(q('.g-sidebar__link')).color, actual: cs(cur).color, fondo: cs(s).backgroundColor, marca: mark && cs(mark).backgroundColor, velo: dlg ? getComputedStyle(dlg, '::backdrop').backgroundColor : undefined }
        }
      }, narrow ? DRAWER : SIDE)
      const P = PAR.piezas.filter((p) => p.vista === vista)
      MED[vista] = S
      for (const p of P) {
        if (p.pieza === 'color') {
          for (const k of Object.keys(p.proto)) {
            const o = S.color[k]
            if (k === 'velo') {
              // El prototipo pintó el velo por defecto de Grana en claro (0,32); el sitio lo declara al del original (#1066),
              // que es lo que pone el tema del sitio del banco: se compara con la referencia y se anota la diferencia
              rec(eng, part, `color · velo = referencia del original (${p.ref.velo})`, o === p.ref.velo, `${o} (proto ${p.proto.velo})`)
              continue
            }
            rec(eng, part, `color · ${k} = prototipo (${p.proto[k]})`, o === p.proto[k], o)
          }
          continue
        }
        const o = S[p.pieza]
        const r = p.proto
        if (!o) { rec(eng, part, `${p.pieza} medido`, false, 'sin dato'); continue }
        const d = { dx: Math.round((o.x - r.x) * 10) / 10, dy: Math.round((o.y - r.y) * 10) / 10, dw: Math.round((o.w - r.w) * 10) / 10, dh: Math.round((o.h - r.h) * 10) / 10 }
        const m = Math.max(...Object.values(d).map(Math.abs))
        p.real = o; p.d = d
        rec(eng, part, `${p.pieza} Δ ≤ 0,5 frente al prototipo ${JSON.stringify(r)}`, m <= 0.5, JSON.stringify({ real: o, ...d }))
      }
      rec(eng, part, 'consola limpia', errs.length === 0, errs.slice(0, 2).join(' | '))
      await ctx.close()
    }
  }

  // ---------- B · Contrato visual a 1280 y en el cajón (claro y oscuro) ----------
  for (const theme of ['claro', 'oscuro']) for (const w of [1280, 375]) {
    const narrow = w < 960
    const part = `contrato ${theme}/${w}`
    const { ctx, page } = await open(browser, { w, theme })
    if (narrow) await openDrawer(page)
    const S = await page.evaluate((sel) => {
      const s = document.querySelector(sel); const q = (x) => s.querySelector(x); const cs = (e) => getComputedStyle(e)
      const t0 = q('.g-sidebar__group-title'), l0 = q('.g-sidebar__link'), code = q('.g-sidebar__link:not([aria-current]) .g-sidebar__code'), chev = q('button.g-sidebar__group-title svg'), cur = q('[aria-current="page"]')
      const toggles = [...s.querySelectorAll('button.g-sidebar__group-title')]
      const nav = q('.g-sidebar__nav')
      return {
        cls: s.className, navTab: nav.getAttribute('tabindex'), borderEnd: cs(s).borderInlineEndWidth,
        icons: [...s.querySelectorAll('.g-sidebar__link .g-sidebar__icon')].filter((e) => e.getClientRects().length).length,
        t0: [cs(t0).fontSize, cs(t0).fontWeight, cs(t0).lineHeight, cs(t0).color], l0: [cs(l0).fontSize, cs(l0).fontWeight, cs(l0).lineHeight, cs(l0).color], l0h: __b(l0).h,
        cur: [cs(cur).color, cs(cur).fontWeight], curCode: cs(cur.querySelector('.g-sidebar__code')).color, curName: cur.textContent.replace(/\s+/g, ' ').trim(),
        curSr: [...cur.querySelectorAll('.g-sidebar__sr')].map((e) => e.textContent.trim()),
        code: code && [cs(code).fontSize, cs(code).fontVariantNumeric, cs(code).color, code.getAttribute('aria-hidden')],
        chev: __b(chev), chevColor: cs(chev).color, toggles: toggles.length,
        disc: toggles.every((b) => b.type === 'button' && b.getAttribute('aria-expanded') === 'true' && document.getElementById(b.getAttribute('aria-controls'))?.classList.contains('g-sidebar__group-body')),
        lists: toggles.every((b) => { const body = document.getElementById(b.getAttribute('aria-controls')); const ul = body.querySelector(':scope > .g-sidebar__list'); return ul && ul.getAttribute('aria-labelledby') === b.id && !ul.hasAttribute('hidden') }),
        sep: cs(s.querySelectorAll('.g-sidebar__group')[1]).borderTopWidth + ' ' + cs(s.querySelectorAll('.g-sidebar__group')[1]).borderTopColor,
        head: __b(q('.g-sidebar__head')), headLine: getComputedStyle(q('.g-sidebar__head'), '::after').top,
        filter: __b(q('.g-sidebar__filter-box')), count: __b(q('.g-sidebar__filter-count')), countText: q('.g-sidebar__filter-count').textContent.trim(),
        describedby: q('.g-sidebar__filter-input').getAttribute('aria-describedby'), countId: q('.g-sidebar__filter-count').id,
        markAria: q('.g-sidebar__mark') && q('.g-sidebar__mark').getAttribute('aria-hidden'), markLast: q('.g-sidebar__mark') === nav.lastElementChild,
        drawerRootCls: s.closest('.g-sidebar__drawer') ? s.className : null, toggleInCol: !!q(':scope > .g-sidebar__head .g-sidebar__toggle') && !s.closest('.g-sidebar__drawer'),
        tok: { text: __tok('--g-color-text'), muted: __tok('--g-color-text-muted'), subtle: __tok('--g-color-text-subtle'), accent: __tok('--g-color-accent-text'), border: __tok('--g-color-border'), sunken: __tok('--g-color-surface-sunken'), focus: __tok('--g-color-focus') },
        bg: cs(s).backgroundColor
      }
    }, narrow ? DRAWER : SIDE)
    rec(eng, part, 'raíz con g-sidebar--appearance-index (también la raíz interna del cajón, SB-B1)', /g-sidebar--appearance-index/.test(S.cls))
    rec(eng, part, 'g-sidebar__nav con tabindex="-1" (#570, SB-B6)', S.navTab === '-1', S.navTab)
    rec(eng, part, 'sin borde de columna y sin iconos en los enlaces (A2)', S.borderEnd === '0px' && S.icons === 0, `${S.borderEnd} ${S.icons}`)
    rec(eng, part, 'título 14/24 en text con la ranura de peso (700 en el tema del sitio)', S.t0.join('|') === `14px|700|24px|${S.tok.text}`, S.t0.join('|'))
    rec(eng, part, 'enlace 14/24/500 en text-muted, fila de 32 (44 táctil)', S.l0.join('|') === `14px|500|24px|${S.tok.muted}` && Math.abs(S.l0h - 32) < 0.6, S.l0.join('|') + ' ' + S.l0h)
    rec(eng, part, 'actual en accent-text con el mismo peso; su número en accent-text', S.cur[0] === S.tok.accent && S.cur[1] === '500' && S.curCode === S.tok.accent, JSON.stringify([S.cur, S.curCode]))
    rec(eng, part, 'número: 12 px, cifras tabulares, text-subtle, aria-hidden', S.code && S.code[0] === '12px' && /tabular-nums/.test(S.code[1]) && S.code[2] === S.tok.subtle && S.code[3] === 'true', JSON.stringify(S.code))
    const accName = await page.locator((narrow ? DRAWER : SIDE) + ' [aria-current="page"]').evaluate((a) => a.getAttribute('aria-label'))
    const snap = await page.locator((narrow ? DRAWER : SIDE) + ' [aria-current="page"]').ariaSnapshot()
    MED[`nombre ${part}`] = snap
    rec(eng, part, 'nombre accesible del actual: la etiqueta y después el número (orden de #1063)', /link "GCombobox\s?, \d+"/.test(snap) && !accName, snap)
    if (/link "GCombobox , /.test(snap)) HALLAZGOS.add('nombre accesible «GCombobox , 24» (espacio antes de la coma; el contrato dice «GCombobox, 24»)')
    rec(eng, part, '9 botones de grupo Disclosure (aria-expanded, aria-controls al cuerpo g-sidebar__group-body)', S.toggles === 9 && S.disc, S.toggles)
    rec(eng, part, 'la lista conserva aria-labelledby al botón y nunca lleva hidden (SB-B4)', S.lists)
    rec(eng, part, 'flecha 18 × 18 en text-muted', Math.abs(S.chev.w - 18) <= 0.6 && S.chevColor === S.tok.muted, JSON.stringify([S.chev, S.chevColor]))
    rec(eng, part, 'separador de 1 px en border entre grupos', S.sep === `1px ${S.tok.border}`, S.sep)
    rec(eng, part, 'fondo surface-sunken', S.bg === S.tok.sunken, S.bg)
    rec(eng, part, 'recuento oculto a la vista con el campo vacío, con texto y en aria-describedby', S.count.w <= 1 && S.countText.length > 0 && (S.describedby || '').split(' ').includes(S.countId), JSON.stringify([S.count, S.countText, S.describedby]))
    rec(eng, part, 'marca aria-hidden y última hija del <nav>', S.markAria === 'true' && S.markLast)
    if (!narrow) {
      rec(eng, part, 'banda de 64 (fórmula del chasis) con la línea a 63; sin botón de contraer (SB-B2)', Math.abs(S.head.h - 64) < 0.6 && parseFloat(S.headLine) === 63 && !S.toggleInCol, JSON.stringify([S.head, S.headLine, S.toggleInCol]))
      rec(eng, part, 'F1: el filtro 120 × 32 en la banda', Math.abs(S.filter.w - 120) <= 0.6 && Math.abs(S.filter.h - 32) <= 0.6, JSON.stringify(S.filter))
    }
    const C = await page.evaluate((t) => ({ enlace: __ratio(t.muted, t.sunken), titulo: __ratio(t.text, t.sunken), actual: __ratio(t.accent, t.sunken), numero: __ratio(t.subtle, t.sunken), marca: __ratio(t.accent, t.sunken), flecha: __ratio(t.muted, t.sunken), foco: __ratio(t.focus, t.sunken), hoverLuz: __ratio(t.text, __over(t.border, t.sunken)), actualVsVecino: __ratio(t.accent, t.muted) }), S.tok)
    MED[`contraste ${theme}/${w}`] = C
    rec(eng, part, `texto ≥ 4,5:1 (enlace ${C.enlace}, título ${C.titulo}, actual ${C.actual}, número ${C.numero}, hover sobre la luz ${C.hoverLuz})`, Math.min(C.enlace, C.titulo, C.actual, C.numero, C.hoverLuz) >= 4.5, JSON.stringify(C))
    rec(eng, part, `formas ≥ 3:1 (marca ${C.marca}, flecha ${C.flecha}, foco ${C.foco})`, Math.min(C.marca, C.flecha, C.foco) >= 3, JSON.stringify(C))
    await ctx.close()
  }

  // ---------- C · Comportamiento a 1280: plegado, interrupción, marca, teclado, filtro, foco ----------
  {
    const part = 'comportamiento/1280'
    const { ctx, page, errs, warns } = await open(browser, { w: 1280 })
    const s = SIDE
    const G = 'Acciones y navegación'
    // C1 · plegar con clic: duración y curva medidas (pieza plegado: slow + ease-out; el contenido se funde fast)
    const tr = await page.evaluate(([s, G]) => { const b = __tg(s, G); const body = document.getElementById(b.getAttribute('aria-controls')); b.click(); return new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(() => { const cs = getComputedStyle(body); res({ p: cs.transitionProperty, d: cs.transitionDuration, f: cs.transitionTimingFunction, chev: getComputedStyle(b.querySelector('svg')).transitionDuration }) }))) }, [s, G])
    rec(eng, part, 'plegar: rejilla slow (240 ms) + ease-out, contenido se funde fast (120 ms), flecha slow', /grid-template-rows/.test(tr.p) && /0\.24s/.test(tr.d) && /0\.12s/.test(tr.d) && tr.chev === '0.24s', JSON.stringify(tr))
    await page.waitForTimeout(450)
    const B1 = await page.evaluate(([s, G]) => { const b = __tg(s, G); const body = document.getElementById(b.getAttribute('aria-controls')); return { exp: b.getAttribute('aria-expanded'), hidden: body.getAttribute('hidden'), h: __b(body).h, cls: b.closest('.g-sidebar__group').className, pb: getComputedStyle(b.closest('.g-sidebar__group')).paddingBottom } }, [s, G])
    rec(eng, part, 'plegado asentado: aria-expanded=false, hidden="until-found" en el cuerpo, alto 0, relleno inferior 10, is-closed', B1.exp === 'false' && B1.hidden === 'until-found' && B1.h === 0 && B1.pb === '10px' && /is-closed/.test(B1.cls), JSON.stringify(B1))
    // C2 · Tab no entra en los enlaces del grupo plegado
    const tabSeq = await page.evaluate(async ([s, G]) => { const b = __tg(s, G); b.focus(); return null }, [s, G])
    await page.keyboard.press('Tab')
    const afterTab = await page.evaluate(() => __name(document.activeElement))
    rec(eng, part, 'Tab desde el botón plegado salta al botón del grupo siguiente (los enlaces plegados no reciben foco)', afterTab === 'btn:Campos de entrada', afterTab)
    // C3 · interrumpible: abrir y, a mitad, volver a plegar; el alto parte del actual sin saltos
    const IN = await page.evaluate(async ([s, G]) => {
      const b = __tg(s, G); const body = document.getElementById(b.getAttribute('aria-controls'))
      const hs = []; const fr = () => new Promise((r) => requestAnimationFrame(r))
      b.click(); for (let i = 0; i < 6; i++) { await fr(); hs.push(__b(body).h) }
      b.click(); for (let i = 0; i < 30; i++) { await fr(); hs.push(__b(body).h) }
      let jump = 0; for (let i = 1; i < hs.length; i++) jump = Math.max(jump, Math.abs(hs[i] - hs[i - 1]))
      return { hs: hs.map(Math.round), jump: Math.round(jump), peak: Math.round(Math.max(...hs)), end: hs[hs.length - 1], exp: b.getAttribute('aria-expanded') }
    }, [s, G])
    // Tras el segundo clic (cuadro 6) el alto baja desde donde estaba: ni salta a 0 ni al alto lleno, y no vuelve a subir
    const post = IN.hs.slice(6)
    const mono = post.every((h, i) => i === 0 || h <= post[i - 1])
    rec(eng, part, 'interrumpible: plegar a mitad de abrir parte del alto actual (sin salto a 0 ni al lleno), baja sin rebote y acaba plegado', IN.hs[6] > 0 && IN.hs[6] < IN.hs[5] && IN.hs[5] - IN.hs[6] <= IN.hs[1] + 1 && mono && IN.peak < 352 && IN.end === 0 && IN.exp === 'false', JSON.stringify(IN))
    MED.interrupcion = IN
    // C4 · Intro y Espacio; foco visible del botón
    await page.evaluate(([s, G]) => __tg(s, G).focus(), [s, G])
    await page.keyboard.press('Enter'); await page.waitForTimeout(400)
    const e1 = await page.evaluate(([s, G]) => __tg(s, G).getAttribute('aria-expanded'), [s, G])
    const ring = await page.evaluate(([s, G]) => { const b = __tg(s, G); const cs = getComputedStyle(b); return { fv: b.matches(':focus-visible'), st: cs.outlineStyle, w: cs.outlineWidth, c: cs.outlineColor, f: __tok('--g-color-focus'), off: cs.outlineOffset, ratio: __ratio(cs.outlineColor, __tok('--g-color-surface-sunken')) } }, [s, G])
    await page.keyboard.press('Space'); await page.waitForTimeout(400)
    const e2 = await page.evaluate(([s, G]) => __tg(s, G).getAttribute('aria-expanded'), [s, G])
    rec(eng, part, 'Intro despliega y Espacio pliega', e1 === 'true' && e2 === 'false', `${e1} ${e2}`)
    rec(eng, part, 'foco visible del botón: anillo ≥ 2 px en el color de foco, por fuera, ≥ 3:1', ring.fv && ring.st === 'solid' && parseFloat(ring.w) >= 2 && ring.c === ring.f && parseFloat(ring.off) >= 0 && ring.ratio >= 3, JSON.stringify(ring))
    // C5 · teclado de lista: ↓ ↑ Inicio Fin incluyen los botones visibles; ← → no hacen nada
    // «Estructura de página» (abierto) → «Acciones y navegación» (plegado) → «Campos de entrada»
    const lastGuide = await page.evaluate((s) => { const ls = [...document.querySelectorAll(s + ' .g-sidebar__group')[1].querySelectorAll('.g-sidebar__link')]; ls.at(-1).focus(); return __name(document.activeElement) }, s)
    await page.keyboard.press('ArrowDown'); const k1 = await page.evaluate(() => __name(document.activeElement))
    await page.keyboard.press('ArrowDown'); const k2 = await page.evaluate(() => __name(document.activeElement))
    await page.keyboard.press('ArrowUp'); const k3 = await page.evaluate(() => __name(document.activeElement))
    await page.keyboard.press('ArrowRight'); const k4 = await page.evaluate(() => __name(document.activeElement))
    await page.keyboard.press('Home'); const k5 = await page.evaluate(() => __name(document.activeElement))
    await page.keyboard.press('End'); const k6 = await page.evaluate(() => __name(document.activeElement))
    const lastVisible = await page.evaluate((s) => __name([...document.querySelectorAll(s + ' .g-sidebar__nav :is(a.g-sidebar__link, button.g-sidebar__group-title)')].filter((e) => __vis(e) && e.checkVisibility()).at(-1)), s)
    const firstLink = await page.evaluate((s) => __name(document.querySelector(s + ' .g-sidebar__link')), s)
    MED.teclado = { lastGuide, k1, k2, k3, k4, k5, k6, lastVisible }
    rec(eng, part, '↓ desde el último enlace de un grupo abierto va al botón plegado y ↓ salta su contenido al botón siguiente', k1 === 'btn:' + G && k2 === 'btn:Campos de entrada', JSON.stringify([lastGuide, k1, k2]))
    rec(eng, part, '↑ vuelve; → no mueve el foco (sin ← →)', k3 === 'btn:' + G && k4 === k3, JSON.stringify([k3, k4]))
    rec(eng, part, 'Inicio al primero y Fin al último visible', k5 === firstLink && k6 === lastVisible, JSON.stringify([k5, firstLink, k6, lastVisible]))
    // Foco visible del enlace (la fila a ras: el anillo por fuera no se recorta en el relleno de 32)
    await page.evaluate((s) => document.querySelector(s + ' .g-sidebar__link').focus(), s)
    await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowUp')
    const lring = await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); const nav = a.closest('.g-sidebar__nav'); const ab = a.getBoundingClientRect(), nb = nav.getBoundingClientRect(); return { fv: a.matches(':focus-visible'), st: cs.outlineStyle, w: cs.outlineWidth, c: cs.outlineColor, f: __tok('--g-color-focus'), off: parseFloat(cs.outlineOffset), inside: ab.left - parseFloat(cs.outlineWidth) - parseFloat(cs.outlineOffset) >= nb.left && ab.right + parseFloat(cs.outlineWidth) + parseFloat(cs.outlineOffset) <= nb.right } })
    rec(eng, part, 'foco visible del enlace: anillo ≥ 2 px en el color de foco y entero dentro de la región (no se recorta)', lring.fv && lring.st === 'solid' && parseFloat(lring.w) >= 2 && lring.c === lring.f && lring.inside, JSON.stringify(lring))
    // C6 · beforematch (sintético) y window.find (búsqueda real del motor) abren el grupo plegado
    const BM = await page.evaluate(([s, G]) => { const b = __tg(s, G); const body = document.getElementById(b.getAttribute('aria-controls')); body.dispatchEvent(new Event('beforematch')); return b.getAttribute('aria-expanded') }, [s, G])
    await page.waitForTimeout(450)
    rec(eng, part, 'beforematch (sintético) abre el grupo plegado', BM === 'true' || (await page.evaluate(([s, G]) => __tg(s, G).getAttribute('aria-expanded'), [s, G])) === 'true')
    await page.evaluate(([s, G]) => __tg(s, G).click(), [s, G]); await page.waitForTimeout(450)
    const WF = await page.evaluate(([s, G]) => { window.getSelection().removeAllRanges(); const found = window.find('GHelperScope'); return new Promise((r) => setTimeout(() => r({ found, exp: __tg(s, G).getAttribute('aria-expanded') }), 300)) }, [s, G])
    MED.windowFind = WF
    NOTAS.push(`${eng}: window.find('GHelperScope') sobre el grupo plegado → encontrado ${WF.found}, aria-expanded ${WF.exp} (window.find no equivale a Ctrl+F: Ctrl+F real no es automatizable)`)
    // Fragmento de texto (#:~:text=): la búsqueda del navegador que sí dispara beforematch en Chromium
    if (WF.exp !== 'true') {
      await page.goto(page.url().split('#')[0] + '#:~:text=GHelperScope')
      await page.waitForTimeout(600)
      const TF = await page.evaluate(([s, G]) => (__tg(s, G) || {}).getAttribute?.('aria-expanded'), [s, G])
      MED.fragmentoTexto = TF
      NOTAS.push(`${eng}: fragmento de texto #:~:text=GHelperScope con el grupo plegado → aria-expanded ${TF}`)
      if (TF !== 'true') { await page.evaluate(([s, G]) => __tg(s, G).click(), [s, G]); await page.waitForTimeout(450) }
    }
    // C7 · marca hueca al plegar el grupo del actual (viaja al título) y llena al desplegar
    await page.evaluate((s) => __tg(s, 'Campos de entrada').click(), s); await page.waitForTimeout(600)
    const H = await page.evaluate((s) => { const m = document.querySelector(s + ' .g-sidebar__mark'); const t = __tg(s, 'Campos de entrada'); const cs = getComputedStyle(m); return { cls: m.className, dy: Math.round((__b(m).y - (__b(t).y + 6)) * 10) / 10, x: __b(m).x, bg: cs.backgroundColor, bc: cs.borderTopColor, bw: cs.borderTopWidth, acc: __tok('--g-color-accent-text'), sr: (t.querySelector('.g-sidebar__sr') || {}).textContent, hc: t.closest('.g-sidebar__group').classList.contains('has-current'), ratio: __ratio(cs.borderTopColor, __tok('--g-color-surface-sunken')) } }, s)
    rec(eng, part, 'grupo del actual plegado: marca hueca (contorno 1 px accent-text) en la fila del botón, x = 15', /is-hollow/.test(H.cls) && Math.abs(H.dy) <= 1 && H.x === 15 && /rgba\(0, 0, 0, 0\)/.test(H.bg) && H.bc === H.acc && H.bw === '1px' && H.ratio >= 3, JSON.stringify(H))
    rec(eng, part, 'el botón lleva has-current y el texto oculto de labels.groupCurrent', H.hc && /contiene la página actual/.test(H.sr || ''), JSON.stringify([H.hc, H.sr]))
    await page.evaluate((s) => __tg(s, 'Campos de entrada').click(), s); await page.waitForTimeout(600)
    const F = await page.evaluate((s) => { const m = document.querySelector(s + ' .g-sidebar__mark'); const a = document.querySelector(s + ' [aria-current="page"]'); return { cls: m.className, dy: Math.round((__b(m).y - (__b(a).y + 6)) * 10) / 10 } }, s)
    rec(eng, part, 'al desplegar, la marca vuelve llena a la fila del actual (±1)', /is-full/.test(F.cls) && Math.abs(F.dy) <= 1, JSON.stringify(F))
    // C8 · plegar un grupo POR ENCIMA del actual: la marca se funde y se recoloca sin viajar; al asentar, en su fila
    const ABOVE = await page.evaluate(async ([s, G]) => {
      const m = document.querySelector(s + ' .g-sidebar__mark'); const a = document.querySelector(s + ' [aria-current="page"]')
      const fr = () => new Promise((r) => requestAnimationFrame(r)); const off = []
      __tg(s, G).click()
      const t0 = performance.now()
      for (let i = 0; i < 24; i++) { await fr(); off.push({ t: Math.round(performance.now() - t0), op: Math.round(+getComputedStyle(m).opacity * 100) / 100, d: Math.round(Math.abs(__b(m).y - (__b(a).y + 6))), cls: m.className.replace('g-sidebar__mark', '').trim() }) }
      await new Promise((r) => setTimeout(r, 300))
      const end = Math.abs(__b(m).y - (__b(a).y + 6))
      return { visiblesFuera: off.filter((o) => o.op > 0.5 && o.d > 2).length, frames: off.slice(0, 6), end: Math.round(end * 10) / 10, op: getComputedStyle(m).opacity }
    }, [s, G])
    MED.plegadoEncima = ABOVE
    rec(eng, part, 'plegado por encima: la marca se funde al empezar y acaba en su fila sin viajar', ABOVE.frames[1].op < 1 && ABOVE.end <= 1 && ABOVE.op === '1', JSON.stringify(ABOVE))
    if (ABOVE.visiblesFuera) HALLAZGOS.add(`plegado por encima: la marca se ve ${ABOVE.visiblesFuera} cuadro(s) con opacidad > 0,5 lejos de su fila (${JSON.stringify(ABOVE.frames[1])}): el fundido fast empieza a la vez que la rejilla, que recorre ≈ 100 px en el primer cuadro`)
    await page.evaluate(([s, G]) => __tg(s, G).click(), [s, G]); await page.waitForTimeout(500)
    // C9 · I2: viaje corto con muelle (≤ 2 px de rebase) y largo con is-far (sin rebase)
    const travel = async (id) => page.evaluate(async ([s, id]) => {
      const a = document.querySelector(s + ` [data-id="${id}"]`); const m = document.querySelector(s + ' .g-sidebar__mark')
      const y0 = __b(m).y; a.click()
      const ys = []; const t0 = performance.now()
      await new Promise((r) => requestAnimationFrame(r))
      const far = m.classList.contains('is-far'); const tf = getComputedStyle(m).transitionTimingFunction.split(',')[0]
      while (performance.now() - t0 < 500) { await new Promise((r) => requestAnimationFrame(r)); ys.push(__b(m).y) }
      const target = __b(a).y + 6; const dir = Math.sign(target - y0)
      return { dist: Math.round(Math.abs(target - y0)), far, tf: tf.slice(0, 12), mid: ys[2], end: ys.at(-1), target, over: Math.round(Math.max(0, ...ys.map((y) => (y - target) * dir)) * 10) / 10 }
    }, [s, id])
    const near = await travel('c-time-field')
    rec(eng, part, `viaje corto (${near.dist} px): con muelle (linear()), sin is-far, rebase ${near.over} ≤ 2 px y llega ±1`, !near.far && /linear\(/.test(near.tf) && near.over <= 2 && Math.abs(near.end - near.target) <= 1 && Math.abs(near.mid - near.target) > 1, JSON.stringify(near))
    const far = await travel('c-app-shell')
    rec(eng, part, `viaje largo (${far.dist} px): is-far con ease-out, rebase ${far.over} ≤ 2 px y llega ±1 (#1071)`, far.far && !/linear\(/.test(far.tf) && far.over <= 2 && Math.abs(far.end - far.target) <= 1, JSON.stringify(far))
    MED.viajes = { near, far }
    // C10 · regla 5 del filtro: con texto, el grupo plegado se pinta abierto sin animar, botón aria-disabled que no hace nada
    await page.evaluate(([s, G]) => __tg(s, G).click(), [s, G]); await page.waitForTimeout(500)
    await page.mouse.move(700, 400); await page.click('.mk-content h1'); await page.keyboard.press('/')
    await page.keyboard.type('helper'); await page.waitForTimeout(80)
    const FL = await page.evaluate(([s, G]) => { const b = __tg(s, G); const body = document.getElementById(b.getAttribute('aria-controls')); return { exp: b.getAttribute('aria-expanded'), dis: b.getAttribute('aria-disabled'), h: __b(body).h, tr: getComputedStyle(body).transitionDuration, hidden: body.hasAttribute('hidden') } }, [s, G])
    rec(eng, part, 'con consulta: el grupo plegado se pinta abierto al instante (sin transición), aria-disabled', FL.exp === 'true' && FL.dis === 'true' && FL.h > 0 && !FL.hidden && /^0s(, 0s)*$/.test(FL.tr), JSON.stringify(FL))
    await page.evaluate(([s, G]) => __tg(s, G).click(), [s, G]); await page.waitForTimeout(200)
    rec(eng, part, 'activar el botón deshabilitado no lo pliega', await page.evaluate(([s, G]) => __tg(s, G).getAttribute('aria-expanded') === 'true', [s, G]))
    const cnt = await page.evaluate((s) => { const c = document.querySelector(s + ' .g-sidebar__filter-count'); return { b: __b(c), fs: getComputedStyle(c).fontSize, ratio: __ratio(getComputedStyle(c).color, __tok('--g-color-surface-sunken')) } }, s)
    rec(eng, part, 'con texto: recuento visible, ≥ 12 px y ≥ 4,5:1', cnt.b.w > 1 && parseFloat(cnt.fs) >= 12 && cnt.ratio >= 4.5, JSON.stringify(cnt))
    await page.focus(s + ' .g-sidebar__filter-input'); await page.keyboard.press('Escape'); await page.waitForTimeout(500)
    rec(eng, part, 'Esc vacía y el grupo vuelve a su estado plegado', await page.evaluate(([s, G]) => __tg(s, G).getAttribute('aria-expanded') === 'false', [s, G]))
    rec(eng, part, 'consola limpia', errs.length === 0, errs.slice(0, 2).join(' | '))
    const sw = warns.filter((w) => /GSidebar/.test(w))
    rec(eng, part, 'sin avisos [Grana GSidebar] (A1 a A5 no aplican en el sitio)', sw.length === 0, sw.slice(0, 2).join(' | '))
    await ctx.close()
  }

  // ---------- D · Movimiento reducido ----------
  {
    const part = 'reducido/1280'
    const { ctx, page } = await open(browser, { w: 1280, reduce: true })
    const s = SIDE
    const tr = await page.evaluate((s) => getComputedStyle(document.querySelector(s + ' .g-sidebar__mark')).transitionProperty, s)
    rec(eng, part, 'la marca sin translate (solo fundido)', !/translate/.test(tr) && /opacity/.test(tr), tr)
    const R1 = await page.evaluate(async (s) => { const b = __tg(s, 'Datos'); const body = document.getElementById(b.getAttribute('aria-controls')); b.click(); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); return { h: __b(body).h, td: getComputedStyle(body).transitionDuration, chev: getComputedStyle(b.querySelector('svg')).transitionDuration, pad: getComputedStyle(b.closest('.g-sidebar__group')).transitionDuration } }, s)
    rec(eng, part, 'plegado inmediato: alto 0 en dos cuadros, sin transición en rejilla, flecha ni relleno', R1.h === 0 && /^0s(, 0s)*$/.test(R1.td) && R1.chev === '0s' && /^0s(, 0s)*$/.test(R1.pad), JSON.stringify(R1))
    const R2 = await page.evaluate(async (s) => { const m = document.querySelector(s + ' .g-sidebar__mark'); const a = document.querySelector(s + ' [data-id="c-app-shell"]'); a.click(); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); return Math.abs(__b(m).y - (__b(a).y + 6)) }, s)
    rec(eng, part, 'la marca salta a su destino (sin viaje, ±1 en dos cuadros)', R2 <= 1, R2)
    const ft = await page.evaluate((s) => getComputedStyle(document.querySelector(s + ' .g-sidebar__filter-box')).transitionProperty, s)
    rec(eng, part, 'el filtro crece sin transición', !/inline-size|width/.test(ft), ft)
    await ctx.close()
  }

  // ---------- E · Cajón táctil (pointer: coarse) y fino ----------
  {
    const part = 'cajón/375'
    const { ctx, page } = await open(browser, { w: 375, ctxOpts: { hasTouch: true, isMobile: eng !== 'firefox' } })
    const coarse = await page.evaluate(() => matchMedia('(pointer: coarse)').matches)
    await openDrawer(page)
    const T = await page.evaluate((s) => {
      const r = document.querySelector(s)
      const min = (sel) => Math.min(...[...r.querySelectorAll(sel)].filter((e) => e.getClientRects().length).map((e) => Math.min(__b(e).h, __b(e).w)))
      const a = r.querySelector('[aria-current="page"]'); const n = r.querySelector('.g-sidebar__nav'); const ar = __b(a), nr = __b(n)
      return { link: min('.g-sidebar__link'), btn: min('button.g-sidebar__group-title'), close: min('.g-sidebar__toggle'), field: __b(r.querySelector('.g-sidebar__filter-box')).h, fs: getComputedStyle(r.querySelector('.g-sidebar__filter-input')).fontSize, inView: ar.y >= nr.y && ar.y + ar.h <= nr.y + nr.h, center: Math.round(Math.abs(ar.y + ar.h / 2 - (nr.y + nr.h / 2))) }
    }, DRAWER)
    if (coarse) rec(eng, part, 'pointer: coarse: filas, botones de grupo, cerrar y campo ≥ 44; texto editable 16', T.link >= 44 && T.btn >= 44 && T.close >= 44 && T.field >= 44 && T.fs === '16px', JSON.stringify(T))
    else NOTAS.push(`${eng}: pointer: coarse no se emula`)
    rec(eng, part, 'I5: el actual a la vista y centrado al abrir (≤ media fila)', T.inView && T.center <= 22, JSON.stringify(T))
    await ctx.close()
    const f = await open(browser, { w: 375 })
    await openDrawer(f.page)
    const T2 = await f.page.evaluate((s) => { const r = document.querySelector(s); const min = (sel) => Math.min(...[...r.querySelectorAll(sel)].filter((e) => e.getClientRects().length).map((e) => Math.min(__b(e).h, __b(e).w))); return { link: min('.g-sidebar__link'), btn: min('button.g-sidebar__group-title'), close: min('.g-sidebar__toggle'), field: __b(r.querySelector('.g-sidebar__filter-box')).h } }, DRAWER)
    rec(eng, 'cajón/375 fino', 'puntero fino: todo ≥ 24 (filas 32)', Math.min(T2.link, T2.btn, T2.close, T2.field) >= 24, JSON.stringify(T2))
    await f.page.keyboard.press('Escape'); await f.page.waitForTimeout(400)
    rec(eng, 'cajón/375 fino', 'Esc cierra y devuelve el foco al disparador', await f.page.evaluate(() => !document.querySelector('.g-sidebar__drawer[open]') && document.activeElement.classList.contains('mk-local__menu')))
    await f.ctx.close()
  }

  // ---------- F · RTL ----------
  {
    const part = 'rtl/1280'
    const { ctx, page, errs } = await open(browser, { w: 1280, q: '&dir=rtl' })
    const D = await page.evaluate((s) => { const r = document.querySelector(s); const rb = __b(r); const m = r.querySelector('.g-sidebar__mark'); const a = r.querySelector('[aria-current="page"]'); const l = a.querySelector('.g-sidebar__label'), c = a.querySelector('.g-sidebar__code'); const svg = r.querySelector('button.g-sidebar__group-title svg'); return { rb, m: __b(m), l: __b(l), c: __b(c), a: __b(a), rot: getComputedStyle(svg).rotate, chev: __b(svg) } }, SIDE)
    rec(eng, part, 'marca a 15 del borde inicial (derecho)', Math.abs(D.rb.x + D.rb.w - 15 - (D.m.x + D.m.w)) <= 0.6, JSON.stringify([D.rb, D.m]))
    rec(eng, part, 'número al final (izquierda), etiqueta al inicio; flecha abierta abajo y al final', D.c.x < D.l.x && D.rot === '-90deg' && D.chev.x < D.rb.x + 60, JSON.stringify(D))
    rec(eng, part, 'consola limpia', errs.length === 0, errs.slice(0, 2).join(' | '))
    await ctx.close()
  }

  // ---------- G · forced-colors (solo Chromium lo emula) ----------
  if (eng === 'chromium') {
    const part = 'forced-colors/1280'
    const { ctx, page } = await open(browser, { w: 1280, ctxOpts: { forcedColors: 'active' } })
    const F = await page.evaluate((s) => { const m = document.querySelector(s + ' .g-sidebar__mark'); const cs = getComputedStyle(m); const hl = document.createElement('span'); hl.style.color = 'Highlight'; document.body.appendChild(hl); const H = getComputedStyle(hl).color; hl.remove(); const b = __tg(s, 'Datos'); b.focus(); return { bg: cs.backgroundColor, H, op: cs.opacity, line: getComputedStyle(document.querySelector(s + ' .g-sidebar__head'), '::after').borderBottomStyle, sep: getComputedStyle(document.querySelectorAll(s + ' .g-sidebar__group')[1]).borderTopStyle, chev: getComputedStyle(b.querySelector('svg')).stroke } }, SIDE)
    rec(eng, part, 'marca en Highlight y visible; línea de la banda y separadores sobreviven', F.bg === F.H && F.op === '1' && F.line === 'solid' && F.sep === 'solid', JSON.stringify(F))
    await page.keyboard.press('Shift'); await page.evaluate((s) => __tg(s, 'Datos').focus(), SIDE)
    const ring = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle)
    rec(eng, part, 'el anillo de foco del botón de grupo sobrevive (outline)', ring === 'solid', ring)
    await ctx.close()
  } else NOTAS.push(`${eng}: forced-colors no se emula`)

  // ---------- H · Sin la extensión (#1069): index se pinta default y collapsible es fijo y abierto; A5 una vez ----------
  {
    const part = 'sin extensión/1280'
    const { ctx, page, errs, warns } = await open(browser, { w: 1280, q: '&ext=0' })
    const X = await page.evaluate(() => { const r = document.querySelector('.g-sidebar'); return { cls: r.className, buttons: r.querySelectorAll('button.g-sidebar__group-title').length, bodies: r.querySelectorAll('.g-sidebar__group-body').length, spans: r.querySelectorAll('span.g-sidebar__group-title').length, hiddenLists: [...r.querySelectorAll('.g-sidebar__list')].filter((u) => !__vis(u)).length, mark: !!r.querySelector('.g-sidebar__mark'), links: r.querySelectorAll('.g-sidebar__link').length } })
    rec(eng, part, 'la raíz es g-sidebar--appearance-default (index se pinta default entero), sin marca', /appearance-default/.test(X.cls) && !/appearance-index/.test(X.cls) && !X.mark, X.cls)
    rec(eng, part, 'grupos collapsible fijos y abiertos: títulos span, sin botón ni cuerpo, todas las listas visibles', X.buttons === 0 && X.bodies === 0 && X.spans === 10 && X.hiddenLists === 0 && X.links === 87, JSON.stringify(X))
    const a5 = warns.filter((w) => /sidebar-index|SidebarIndex/.test(w))
    rec(eng, part, 'aviso A5 una vez y nombra app.use(SidebarIndex)', a5.length === 1 && /app\.use\(SidebarIndex\)/.test(a5[0]), JSON.stringify(warns))
    rec(eng, part, 'sin errores', errs.length === 0, errs.slice(0, 2).join(' | '))
    await ctx.close()
  }

  // ---------- I · Tema por defecto de Grana (sin el tema del sitio): ranura de peso 600 y velo por defecto ----------
  for (const theme of ['claro', 'oscuro']) {
    const part = `defecto Grana ${theme}`
    const { ctx, page } = await open(browser, { w: 375, theme, site: false })
    await openDrawer(page)
    const D = await page.evaluate((s) => { const r = document.querySelector(s); const dlg = r.closest('.g-sidebar__drawer'); return { w: getComputedStyle(r.querySelector('.g-sidebar__group-title')).fontWeight, velo: getComputedStyle(dlg, '::backdrop').backgroundColor, tok: getComputedStyle(document.documentElement).getPropertyValue('--g-surface-backdrop').trim() } }, DRAWER)
    rec(eng, part, 'título con --g-sidebar-group-title-weight por defecto = title-sm (600) (#1064)', D.w === '600', D.w)
    rec(eng, part, 'velo = --g-surface-backdrop por defecto (Grana no lo cambia, SB-L9)', D.velo === (theme === 'claro' ? 'rgba(0, 0, 0, 0.32)' : 'rgba(0, 0, 0, 0.6)'), JSON.stringify(D))
    await ctx.close()
  }

  // ---------- J · Temas distintos del por defecto: los 11 de Dark Color Presence (CLI vigente), claro y oscuro ----------
  if (eng === 'chromium') {
    for (const th of THEMES) for (const theme of ['claro', 'oscuro']) {
      const part = `tema ${th}/${theme}`
      const { ctx, page } = await open(browser, { w: 1280, theme, css: join(GEN_DIR, th + '.css') })
      await page.evaluate((s) => __tg(s, 'Campos de entrada').click(), SIDE)
      await page.waitForTimeout(500)
      const C = await page.evaluate((s) => {
        const r = document.querySelector(s); const cs = (e, p = 'color') => getComputedStyle(e)[p]; const bg = cs(r, 'backgroundColor')
        const l = r.querySelector('.g-sidebar__link:not([aria-current])'); const c = r.querySelector('.g-sidebar__link:not([aria-current]) .g-sidebar__code'); const t = r.querySelector('.g-sidebar__group-title'); const m = r.querySelector('.g-sidebar__mark'); const chev = r.querySelector('button.g-sidebar__group-title svg')
        const hollow = { cls: m.className, c: __ratio(cs(m, 'borderTopColor'), bg) }
        __tg(s, 'Campos de entrada').click()
        return { enlace: __ratio(cs(l), bg), numero: __ratio(cs(c), bg), titulo: __ratio(cs(t), bg), actual: __ratio(__tok('--g-color-accent-text'), bg), marcaHueca: hollow.c, hueca: /is-hollow/.test(hollow.cls), flecha: __ratio(cs(chev), bg), hover: __ratio(__tok('--g-color-text'), __over(__tok('--g-color-border'), bg)), foco: __ratio(__tok('--g-color-focus'), bg) }
      }, SIDE)
      MED[`tema ${th} ${theme}`] = C
      rec(eng, part, 'texto ≥ 4,5:1 (enlace, número, título, actual, hover sobre la luz)', Math.min(C.enlace, C.numero, C.titulo, C.actual, C.hover) >= 4.5, JSON.stringify(C))
      rec(eng, part, 'formas ≥ 3:1 (marca hueca, flecha, foco)', C.hueca && Math.min(C.marcaHueca, C.flecha, C.foco) >= 3, JSON.stringify(C))
      await ctx.close()
    }
  }

  // ---------- K · Grupos plegables en la apariencia de siempre (#1061 regla 9) ----------
  {
    const part = 'default/1280'
    const { ctx, page, errs } = await open(browser, { w: 1280, q: '&ap=default' })
    const s = '.g-sidebar--appearance-default.g-sidebar--mode-expanded'
    const G = await page.evaluate((s) => { const r = document.querySelector(s); const b = __tg(s, 'Datos'); const cs = getComputedStyle(b); const span = r.querySelector('span.g-sidebar__group-title'); return { fs: cs.fontSize, spanFs: getComputedStyle(span).fontSize, color: cs.color, subtle: __tok('--g-color-text-subtle'), h: __b(b).h, ratio: __ratio(cs.color, getComputedStyle(r).backgroundColor), chev: __ratio(getComputedStyle(b.querySelector('svg')).color, getComputedStyle(r).backgroundColor) } }, s)
    rec(eng, part, 'botón de grupo con el aspecto del título de siempre (caption, text-subtle ≥ 4,5:1), área ≥ 24, flecha ≥ 3:1', G.fs === G.spanFs && G.color === G.subtle && G.h >= 24 && G.ratio >= 4.5 && G.chev >= 3, JSON.stringify(G))
    await page.evaluate((s) => __tg(s, 'Datos').click(), s); await page.waitForTimeout(500)
    rec(eng, part, 'plegar en default: aria-expanded=false y cuerpo de alto 0', await page.evaluate((s) => { const b = __tg(s, 'Datos'); return b.getAttribute('aria-expanded') === 'false' && __b(document.getElementById(b.getAttribute('aria-controls'))).h === 0 }, s))
    rec(eng, part, 'consola limpia', errs.length === 0, errs.slice(0, 2).join(' | '))
    await ctx.close()
  }
  await browser.close()
}

const by = {}
for (const r of R) { by[r.eng] = by[r.eng] || [0, 0]; by[r.eng][1]++; if (r.ok) by[r.eng][0]++ }
console.log(Object.entries(by).map(([e, [a, b]]) => `${e} ${a}/${b}`).join(' · '))
const ok = R.filter((r) => r.ok).length
console.log(`TOTAL ${ok}/${R.length}`)
for (const n of NOTAS) console.log('NOTA ' + n)
for (const h of HALLAZGOS) console.log('HALLAZGO (no bloqueante) ' + h)
const cmin = (k) => Object.entries(MED).filter(([n]) => n.startsWith('tema ')).reduce((m, [n, c]) => (c[k] < m.v ? { v: c[k], d: n } : m), { v: 99, d: '' })
const mins = Object.fromEntries(['enlace', 'numero', 'titulo', 'actual', 'marcaHueca', 'flecha', 'hover', 'foco'].map((k) => [k, cmin(k)]))
console.log('MÍNIMOS EN LOS TEMAS ' + JSON.stringify(mins))
await writeFile(join(HERE, 'auditoria-index-resultados.json'), JSON.stringify({ fecha: new Date().toISOString().slice(0, 10), motores: ENGINES, por: by, total: `${ok}/${R.length}`, fallos: R.filter((r) => !r.ok), notas: NOTAS.filter((n) => !n.startsWith('temas de Dark')), hallazgos: [...HALLAZGOS], minimosTemas: mins, medidas: MED }, null, 1))
server.close()
process.exit(ok === R.length ? 0 : 1)
