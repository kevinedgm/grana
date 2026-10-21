// Verificación de coco sobre el banco de GSection (design/lab/section/estilo-banco.html), con el CSS real en las capas del registro y GBtn real.
// Niveles h2 › h3 › h4 y tamaños por profundidad (20/28 › 16/24 › 14/20, 600; headingLevel fijado no cambia el tamaño), descripción,
// separaciones (título → descripción, cabecera → cuerpo, cuerpo = pila md, margen de hijos 0), acciones que bajan a 320 sin desbordar,
// contraste del título y la descripción ≥ 4.5:1 sobre página, superficie y superficie hundida (claro y oscuro), árbol de landmarks,
// RTL, forced-colors, scroll-margin y consola limpia. Temas: defecto, «Tema de prueba» (space 5, escala propia) y tres generados.
// Desde la raíz: node design/lab/section/estilo-verificar.mjs [--engines=chromium,firefox,webkit]   (Playwright de theme-playground)
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2' }
const server = http.createServer(async (req, res) => {
  try {
    const p = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!p.startsWith(ROOT)) throw new Error('fuera')
    const body = await readFile(p)
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(body)
  } catch { res.writeHead(404).end() }
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/section/estilo-banco.html`

let total = 0, failed = 0
const fails = []
const ok = (c, m) => { total++; if (!c) { failed++; fails.push(m) } }
const near = (a, b, t = 0.6) => Math.abs(a - b) <= t


const measure = () => {
  const q = (c) => document.querySelector(`[data-case="${c}"]`)
  const R = (e) => e.getBoundingClientRect()
  const px = parseFloat
  const parse = (s) => {
    let m = s.match(/rgba?\(([^)]+)\)/)
    if (m) { const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1] }
    m = s.match(/color\(srgb ([^)]+)\)/)
    if (m) { const p = m[1].split(/[\s/]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p[3] ?? 1] }
    return [0, 0, 0, 0]
  }
  const over = (t, b) => { const a = t[3]; return [t[0] * a + b[0] * (1 - a), t[1] * a + b[1] * (1 - a), t[2] * a + b[2] * (1 - a), 1] }
  const bgOf = (el) => {
    const layers = []
    for (let n = el; n; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c[3] > 0) { layers.push(c); if (c[3] >= 1) break } }
    let base = parse(getComputedStyle(document.documentElement).backgroundColor); if (base[3] < 1) base = [255, 255, 255, 1]
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base)
    return base
  }
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2) }
  const probe = (css) => { const e = document.createElement('div'); e.style.cssText = css; document.body.append(e); const cs = getComputedStyle(e); const r = { fs: px(cs.fontSize), lh: px(cs.lineHeight), fw: cs.fontWeight, ff: cs.fontFamily }; e.remove(); return r }
  const exp = {
    t1: probe('font:var(--g-text-title-sm-weight) var(--g-text-title-sm-size)/var(--g-text-title-sm-line) var(--g-font-title)'),
    t2: probe('font:var(--g-text-title-sm-weight) var(--g-text-body-size)/var(--g-text-body-line) var(--g-font-ui)'),
    t3: probe('font:var(--g-text-title-sm-weight) var(--g-text-body-sm-size)/var(--g-text-body-sm-line) var(--g-font-ui)'),
    d: probe('font:var(--g-text-body-sm-weight) var(--g-text-body-sm-size)/var(--g-text-body-sm-line) var(--g-font-ui)'),
  }
  const s1 = px(getComputedStyle(document.documentElement).getPropertyValue('--g-space-1'))
  const title = (c) => q(c).querySelector(':scope > .g-section__head .g-section__title')
  const info = (c) => { const t = title(c); const cs = getComputedStyle(t); return { tag: t.tagName, fs: px(cs.fontSize), lh: px(cs.lineHeight), fw: cs.fontWeight, ff: cs.fontFamily, m: cs.margin, cls: q(c).className } }
  const g = { s1, exp, rtl: document.documentElement.dir === 'rtl' }
  for (const c of ['n1', 'n2', 'n3', 'n4', 's1', 's2', 's3', 's4', 'fixed', 'one', 'long', 'bare', 'lm-yes', 'lm-no']) g['i-' + c] = info(c)
  // Separaciones de la sección de una sola
  const one = q('one'); const head = one.querySelector(':scope > .g-section__head'); const body = one.querySelector(':scope > .g-section__body')
  const t = title('one'); const d = one.querySelector('.g-section__desc')
  g.sep = { titleDesc: +(R(d).top - R(t).bottom).toFixed(2), headBody: +(R(body).top - R(head).bottom).toFixed(2), descMax: R(d).width, descMaxExp: px(getComputedStyle(d).maxWidth) }
  const kids = [...body.children]; g.body = kids.slice(1).map((e, i) => +(R(e).top - R(kids[i]).bottom).toFixed(2)); g.bodyM = kids.map((e) => getComputedStyle(e).marginBlockStart + '/' + getComputedStyle(e).marginBlockEnd)
  g.scrollMargin = getComputedStyle(one).scrollMarginBlockStart; g.space4 = getComputedStyle(document.documentElement).getPropertyValue('--g-space-4').trim()
  g.bg = getComputedStyle(one).backgroundColor; g.border = getComputedStyle(one).borderTopWidth
  // Contraste
  for (const c of ['one', 'n1', 's1', 'n3', 's3', 'long']) {
    const tt = title(c); const dd = q(c).querySelector('.g-section__desc'); const bg = bgOf(tt)
    g['k-' + c] = { title: ratio(over(parse(getComputedStyle(tt).color), bg), bg), desc: dd ? ratio(over(parse(getComputedStyle(dd).color), bg), bg) : null }
  }
  // Acciones
  const ln = q('long'); const lt = ln.querySelector('.g-section__titles'); const la = ln.querySelector('.g-section__actions')
  g.act = { below: R(la).top >= R(lt).bottom - 0.5, sameRow: Math.abs(R(la).top - R(lt).top) < 2, overflow: ln.scrollWidth > ln.clientWidth + 1, aw: R(la).width, lw: R(lt).width, ar: R(la).right, lr: R(ln).right, al: R(la).left, ll: R(ln).left, gap: R(la).top - R(lt).bottom }
  const o = q('one'); const ot = o.querySelector(':scope > .g-section__head .g-section__titles'); const oa = o.querySelector(':scope > .g-section__head .g-section__actions')
  g.actOne = { sameRow: Math.abs(R(oa).top - R(ot).top) < 2, end: g.rtl ? R(oa).left - R(o).left : R(o).right - R(oa).right }
  g.hasDescBare = !!q('bare').querySelector('.g-section__desc'); g.hasActBare = !!q('bare').querySelector('.g-section__actions')
  // Landmarks
  g.lm = { yes: q('lm-yes').getAttribute('aria-labelledby') === q('lm-yes').querySelector('.g-section__title').id, no: !q('lm-no').hasAttribute('aria-labelledby') }
  // dir=auto
  const ad = q('auto-dir').querySelector('.g-section__title'); g.autoDir = { dir: ad.getAttribute('dir'), ta: getComputedStyle(ad).textAlign, dirCs: getComputedStyle(ad).direction, unicode: getComputedStyle(ad).unicodeBidi }
  g.overflow = { doc: document.documentElement.scrollWidth, vw: innerWidth }
  g.heads = [...document.querySelectorAll('.g-section__title')].filter((e) => e.closest('[data-case]').dataset.case.match(/^n\d$/)).map((e) => e.tagName)
  g.longClipped = title('long').scrollWidth > title('long').clientWidth + 1
  return g
}

const minT = { title: 99, desc: 99, tt: '', dt: '' }
const check = (g, tag, narrow) => {
  const s = g.s1
  const sz = (i, e) => { ok(near(i.fs, e.fs, 0.05) && near(i.lh, e.lh, 0.05) && i.fw === e.fw && i.ff === e.ff, `${tag}: título ${JSON.stringify(i)} ≠ ${JSON.stringify(e)}`); ok(i.m.split(' ').every((v) => v === '0px'), `${tag}: margen del título ${i.m}`) }
  for (const p of ['n', 's']) {
    sz(g[`i-${p}1`], g.exp.t1); sz(g[`i-${p}2`], g.exp.t2); sz(g[`i-${p}3`], g.exp.t3); sz(g[`i-${p}4`], g.exp.t3)
    ok(g[`i-${p}4`].cls.includes('depth-3') && g[`i-${p}3`].cls.includes('depth-3'), `${tag}: tope de profundidad`)
  }
  ok(g[`i-n1`].tag === 'H2' && g['i-n2'].tag === 'H3' && g['i-n3'].tag === 'H4' && g['i-n4'].tag === 'H4', `${tag}: niveles ${JSON.stringify(g.heads)}`)
  ok(g['i-fixed'].tag === 'H3', `${tag}: headingLevel fijado ${g['i-fixed'].tag}`)
  sz(g['i-fixed'], g.exp.t1)
  ok(g.exp.t1.fs >= g.exp.t2.fs && g.exp.t2.fs >= g.exp.t3.fs && g.exp.t3.fs >= 14, `${tag}: jerarquía de tamaños ${g.exp.t1.fs}/${g.exp.t2.fs}/${g.exp.t3.fs}`)
  ok(g.exp.t3.fs >= 14, `${tag}: suelo de 14px`)
  ok(near(g.sep.titleDesc, s, 0.3), `${tag}: título → descripción ${g.sep.titleDesc} ≠ ${s}`)
  ok(near(g.sep.headBody, 4 * s, 0.3), `${tag}: cabecera → cuerpo ${g.sep.headBody} ≠ ${4 * s}`)
  g.body.forEach((d) => ok(near(d, 6 * s, 0.3), `${tag}: cuerpo = pila md ${d} ≠ ${6 * s}`))
  g.bodyM.forEach((m) => ok(m === '0px/0px', `${tag}: margen de hijo del cuerpo ${m}`))
  ok(g.sep.descMax <= g.sep.descMaxExp + 0.5 && g.sep.descMaxExp > 0, `${tag}: medida de la descripción ${g.sep.descMax} / ${g.sep.descMaxExp}`)
  ok(g.scrollMargin === g.space4, `${tag}: scroll-margin ${g.scrollMargin}`)
  ok(g.bg === 'rgba(0, 0, 0, 0)' && g.border === '0px', `${tag}: la sección tiene superficie (${g.bg}, ${g.border})`)
  for (const c of ['one', 'n1', 's1', 'n3', 's3', 'long']) { if (g['k-' + c].title < minT.title) { minT.title = g['k-' + c].title; minT.tt = tag + ' ' + c } if (g['k-' + c].desc !== null && g['k-' + c].desc < minT.desc) { minT.desc = g['k-' + c].desc; minT.dt = tag + ' ' + c }; ok(g['k-' + c].title >= 4.5, `${tag}: contraste del título ${c} ${g['k-' + c].title}`); if (g['k-' + c].desc !== null) ok(g['k-' + c].desc >= 4.5, `${tag}: contraste de la descripción ${c} ${g['k-' + c].desc}`) }
  ok(!g.act.overflow, `${tag}: acciones desbordan la sección`)
  ok(g.act.al >= g.act.ll - 0.5 && g.act.ar <= g.act.lr + 0.5, `${tag}: acciones fuera de la sección`)
  if (narrow) ok(g.act.below && g.act.gap >= 0, `${tag}: las acciones no bajan a ${narrow}px`)
  if (!narrow) ok(g.actOne.sameRow, `${tag}: acciones no van en la fila del título`)
  ok(!g.hasDescBare && !g.hasActBare, `${tag}: p o grupo vacíos`)
  ok(g.lm.yes && g.lm.no, `${tag}: landmark ${JSON.stringify(g.lm)}`)
  ok(g.autoDir.dir === 'auto', `${tag}: dir auto`)
  ok(g.overflow.doc <= g.overflow.vw, `${tag}: desborde ${JSON.stringify(g.overflow)}`)
  ok(!g.longClipped, `${tag}: título largo recortado`)
}

for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const errors = []
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('requestfailed', (r) => errors.push('red: ' + r.url()))
  const go = async (qs) => { await page.goto(BASE + qs); await page.evaluate(() => document.fonts.ready) }
  const configs = [['defecto', ''], ['defecto-oscuro', '?dark=1'], ['prueba', '?test=1'], ['defecto-rtl', '?rtl=1'], ...['notion', 'caracol-purpura', 'spotify'].flatMap((t) => [[t, `?theme=${t}`], [t + '-oscuro', `?theme=${t}&dark=1`]])]
  for (const [name, qs] of configs) { await go(qs); check(await page.evaluate(measure), `${engine} ${name}`) }
  // Poco ancho: las acciones bajan; 320 CSS px (WCAG 1.4.10)
  for (const [name, qs] of [['320', ''], ['320-rtl', '?rtl=1'], ['320-prueba-oscuro', '?test=1&dark=1']]) {
    await page.setViewportSize({ width: 320, height: 800 }); await go(qs)
    check(await page.evaluate(measure), `${engine} ${name}`, 320)
  }
  await page.setViewportSize({ width: 1280, height: 900 })
  // Contenedor estrecho de 260px a ancho de página normal: las acciones bajan sin punto de corte de pantalla
  await go(''); await page.evaluate(() => document.querySelector('#narrow').style.setProperty('--w', '260px'))
  const nr = await page.evaluate(() => { const l = document.querySelector('[data-case="long"]'); const t = l.querySelector('.g-section__titles').getBoundingClientRect(); const a = l.querySelector('.g-section__actions').getBoundingClientRect(); return { below: a.top >= t.bottom - 0.5, ov: l.scrollWidth > l.clientWidth + 1 } })
  ok(nr.below && !nr.ov, `${engine} contenedor de 260px: ${JSON.stringify(nr)}`)
  // Árbol de accesibilidad: region con nombre solo con landmark
  const tree = await page.evaluate(() => [...document.querySelectorAll('section')].map((e) => ({ c: e.dataset.case, labelled: e.hasAttribute('aria-labelledby') })))
  ok(tree.filter((t) => t.labelled).map((t) => t.c).join() === 'lm-yes', `${engine} landmarks por aria-labelledby: ${tree.filter((t) => t.labelled).map((t) => t.c)}`)
  if (engine === 'chromium') {
    const snap = await page.accessibility?.snapshot?.({ interestingOnly: false }).catch(() => null)
    if (snap) { const regions = []; const walk = (n) => { if (n.role === 'region') regions.push(n.name); (n.children || []).forEach(walk) }; walk(snap); ok(regions.length === 1 && regions[0] === 'Con landmark', `chromium árbol: regiones ${JSON.stringify(regions)}`) }
    // forced-colors: el texto sigue legible (colores del sistema) y no hay superficie que desaparezca
    await page.emulateMedia({ forcedColors: 'active' }); await go('')
    const fc = await page.evaluate(() => { const t = document.querySelector('[data-case="one"] .g-section__title'); const d = document.querySelector('[data-case="one"] .g-section__desc'); return { t: getComputedStyle(t).color, d: getComputedStyle(d).color, bg: getComputedStyle(document.body).backgroundColor } })
    ok(fc.t !== fc.bg && fc.d !== fc.bg, `chromium forced-colors: ${JSON.stringify(fc)}`)
    await page.emulateMedia({ forcedColors: 'none' })
  }
  // El ritmo lo mueve space; el tamaño del título lo mueve la escala del tema
  await go('')
  const sp = await page.evaluate(() => { document.documentElement.style.setProperty('--g-space-1', '5px'); document.documentElement.style.setProperty('--g-text-title-sm-size', '1.75rem'); document.documentElement.style.setProperty('--g-text-title-sm-line', '2.25rem'); const o = document.querySelector('[data-case="one"]'); const h = o.querySelector(':scope > .g-section__head').getBoundingClientRect(); const b = o.querySelector(':scope > .g-section__body').getBoundingClientRect(); return { gap: b.top - h.bottom, fs: parseFloat(getComputedStyle(o.querySelector('.g-section__title')).fontSize) } })
  ok(near(sp.gap, 20, 0.3) && near(sp.fs, 28, 0.05), `${engine} escala/space del tema: ${JSON.stringify(sp)}`)
  ok(!errors.length, `${engine} consola: ${errors.join(' | ')}`)
  await browser.close()
}
server.close()
console.log(`contraste mínimo: título ${minT.title}:1 (${minT.tt}) · descripción ${minT.desc}:1 (${minT.dt})`)
console.log(`${total - failed}/${total} correctas`)
if (failed) { console.log(fails.slice(0, 60).map((f) => '  x ' + f).join('\n')); process.exitCode = 1 }
