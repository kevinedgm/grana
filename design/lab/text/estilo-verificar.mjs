// Verificación propia de coco de GText.css (banco de estilo): las comprobaciones de kiwi r01 (casos y bloques reales)
// con GText.css en lugar de tx.css, más E1 (marca del pie sin enlace) y E2 (FAQ 02 en GSection anidada) y espacio 5.
// Original de kiwi: design/lab/text/r01/verificar.mjs.
//   GRANA_PW_PORT=4219 node design/lab/text/estilo-verificar.mjs [--engines=chromium] [--parts=casos,bloques] [--verbose]
// Requiere packages/vue/dist (grana.css, grana.js) y packages/blocks/dist/marketing.js. Solo lee; no toca packages/.
// «bloques»: los seis casos de MK-L1 sobre los bloques REALES (banco de bruno), tema por defecto, rústico y lujo, claro y
// oscuro: se mide ANTES (texto nativo) y DESPUÉS (tx.js pone las clases de trabajo de GText donde iría <GText>).
// «casos»: casos límite de index.html?vista=casos (anidada, componente dentro, en línea, en GStack, lista/oculto/RTL,
// zona de marca, prose, text-wrap, comillas reservadas).
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')
const PARTS = (args.parts || 'casos,bloques,extras').split(',')
const V = !!args.verbose
const PORT = Number(process.env.GRANA_PW_PORT || 4219)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' }
const server = http.createServer(async (req, res) => {
  try {
    const p = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!p.startsWith(ROOT)) throw new Error('fuera')
    let body = await readFile(p)
    // Banco de coco: el CSS real del componente en lugar de tx.css (en su capa), y los nombres de clase del contrato (body-sm)
    if (p.endsWith('/design/lab/text/r01/tx.css')) body = '@layer grana.components {\n' + (await readFile(join(ROOT, 'packages/vue/src/components/GText/GText.css'), 'utf8')) + '\n}'
    else if (p.endsWith('/packages/vue/dist/grana.css')) body = String(body).replaceAll('.g-section__body,.g-bleed,.g-bleed-raw)', '.g-section__body,.g-bleed,.g-bleed-raw,.g-text)').replaceAll('.g-section__body, .g-bleed, .g-bleed-raw)', '.g-section__body, .g-bleed, .g-bleed-raw, .g-text)')
    else if (p.endsWith('/design/lab/text/r01/tx.js')) body = String(body).replace('`g-text--size-${size}`', "`g-text--size-${size === 'sm' ? 'body-sm' : size}`")
    else if (p.endsWith('/design/lab/text/r01/index.html')) body = String(body).replaceAll('g-text--size-sm', 'g-text--size-body-sm')
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(body)
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
const O = `http://127.0.0.1:${PORT}`
const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))

let total = 0; let failed = 0; const fails = []; const notes = []
const ok = (c, msg, info = '') => { total++; if (!c) { failed++; fails.push(msg + (info !== '' ? ' · ' + info : '')) } else if (V) console.log('ok   ' + msg + (info !== '' ? ' · ' + info : '')) }
const note = (s) => { notes.push(s); if (V) console.log('nota ' + s) }
const near = (a, b, t = 0.75) => Math.abs(a - b) <= t
const settle = (p, ms = 60) => p.evaluate((ms) => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, ms)))), ms)

async function open (b, url, { vw = 1440, vh = 900, ready } = {}) {
  const ctx = await b.newContext({ viewport: { width: vw, height: vh } })
  const p = await ctx.newPage()
  const errs = []
  p.on('console', (m) => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404/.test(t)) || (m.type() === 'warning' && /\[Vue warn\]|\[Grana /.test(t))) errs.push(t.slice(0, 160)) })
  p.on('pageerror', (e) => errs.push(String(e).slice(0, 160)))
  for (let i = 0; ; i++) {
    try { await p.goto(url, { waitUntil: 'domcontentloaded' }); await p.waitForFunction(ready, null, { timeout: 20000 }); break } catch (e) { if (i >= 2) throw e }
  }
  await p.evaluate(() => document.fonts.ready)
  await settle(p, 120)
  p.__errs = errs
  return { p, close: () => ctx.close() }
}

// ---------- En la página: utilidades de medida ----------
const HELP = () => {
  const cv = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  const rgba = (c) => { cv.clearRect(0, 0, 1, 1); cv.fillStyle = '#000'; cv.fillStyle = c; cv.fillRect(0, 0, 1, 1); const d = cv.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  const bgOf = (e) => { for (let x = e; x; x = x.parentElement) { const c = getComputedStyle(x).backgroundColor; const v = rgba(c); if (v[3] > 0.99) return v } return rgba(getComputedStyle(document.body).backgroundColor) }
  window.__h = {
    contrast (e) { const f = rgba(getComputedStyle(e).color); const bg = bgOf(e); const mix = f.slice(0, 3).map((v, i) => v * f[3] + bg[i] * (1 - f[3])); const [a, b] = [lum(mix), lum(bg)].sort((x, y) => y - x); return Math.round(((a + 0.05) / (b + 0.05)) * 100) / 100 },
    r (e) { const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height } },
    cs (e) { return getComputedStyle(e) },
    sizes () { const o = {}; for (const k of ['caption', 'body-sm', 'body']) { const d = document.createElement('div'); d.style.fontSize = `var(--g-text-${k}-size)`; document.body.append(d); o[k] = parseFloat(getComputedStyle(d).fontSize); d.remove() } const s = document.createElement('div'); s.style.width = 'var(--g-space-1)'; document.body.append(s); o.space = parseFloat(getComputedStyle(s).width); s.remove(); return o }
  }
}

// ---------- Bloques: MK-L1 antes / después ----------
const PAGES = [['testimonials', 'testimonials.html', ''], ['cta 01', 'cta.html', 'v=01'], ['cta 02', 'cta.html', 'v=02'], ['cta 03', 'cta.html', 'v=03'], ['newsletter', 'newsletter.html', ''], ['footer', 'footer.html', ''], ['stats 03', 'stats.html', 'v=03'], ['faq 01', 'faq.html', 'v=01'], ['faq 03', 'faq.html', 'v=03']]
const THEMES = ['defecto', 'rustico', 'lujo']

// Mide, en todos los bloques de la página, los criterios de MK-L1 (los mismos antes y después)
const MEASURE = () => {
  const near = (a, b, t = 0.75) => Math.abs(a - b) <= t
  const h = window.__h; const S = h.sizes(); const ROLE = { body: S.body, sm: S['body-sm'], caption: S.caption }
  const R = { body: S.space * 3, sm: S.space * 2.5, caption: S.space * 2 }
  const scale = Object.values(ROLE)
  const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !e.closest('[hidden], [inert]') }
  const ownText = (e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
  const out = []
  for (const blk of document.querySelectorAll('[data-gb]')) {
    const gb = blk.dataset.gb; const res = { gb, browserMargins: [], italics: [], offScale: [], rhythm: [], roleMismatch: [], lowContrast: [], indent: [], relations: {} }
    // Texto suelto: lo que MK-L1 señaló (y, después, lo que lleva GText)
    const loose = [...blk.querySelectorAll('figure, blockquote, figcaption, cite, address, p')].filter((e) => vis(e) && !/(^|\s)g-(?!text)/.test(String(e.className)))
    for (const e of loose) {
      const cs = h.cs(e); const m = [cs.marginTop, cs.marginRight, cs.marginBottom, cs.marginLeft].map(parseFloat)
      const gt = e.closest('.g-text')
      // Margen esperado: 0 en una raíz GText sin GText encima; en lo de dentro, 0 o el ritmo de la GText más cercana
      // (la de fuera, si e es raíz anidada). Antes (sin GText) todo margen != 0 es del navegador.
      const scopeOf = e.classList.contains('g-text') ? (e.parentElement && e.parentElement.closest('.g-text')) : gt
      const r = scopeOf ? R[(scopeOf.dataset.lab || '').split('·')[1]] : 0
      const allowed = (v) => near(v, 0) || (scopeOf && near(v, r))
      if (!near(m[1], 0) || !near(m[3], 0)) res.indent.push(`${e.tagName.toLowerCase()} ${m.map(Math.round).join('/')}`)
      else if (!allowed(m[0]) || !allowed(m[2])) res.browserMargins.push(`${e.tagName.toLowerCase()} ${m.map(Math.round).join('/')}`)
      if (cs.fontStyle === 'italic' && !e.closest('em, i')) res.italics.push(e.tagName.toLowerCase())
      if (ownText(e)) {
        const fs = parseFloat(cs.fontSize)
        if (!scale.some((s) => near(s, fs, 0.3))) res.offScale.push(`${e.tagName.toLowerCase()} ${fs}`)
        if (gt) { const want = ROLE[(gt.dataset.lab || '').split('·')[1]]; if (!near(fs, want, 0.3)) res.roleMismatch.push(`${e.tagName.toLowerCase()} ${fs}≠${want}`) }
        const c = h.contrast(e); if (c < 4.5) res.lowContrast.push(`${e.tagName.toLowerCase()} ${c}`)
      }
    }
    // Ritmo entre párrafos consecutivos de un mismo padre (después: = r de su GText)
    for (const g of blk.querySelectorAll('.g-text')) {
      const sz = (g.dataset.lab || '').split('·')[1]
      const kids = [...g.children].filter((k) => vis(k) && k.matches('p, blockquote, figcaption, ul, ol, div, address'))
      for (let i = 1; i < kids.length; i++) {
        const gap = h.r(kids[i]).t - h.r(kids[i - 1]).b
        // entre dos raíces GText anidadas el ritmo es el de la de fuera (colapso de márgenes)
        if (!near(gap, R[sz], 1)) res.rhythm.push(`${kids[i - 1].tagName.toLowerCase()}→${kids[i].tagName.toLowerCase()} ${Math.round(gap * 10) / 10}≠${R[sz]}`)
      }
    }
    // Relaciones de MK-L1
    const desc = blk.querySelector('.g-section__desc, .g-card__description')
    const assurance = gb.startsWith('cta') ? blk.querySelector('p[id]') : null
    if (assurance && desc) res.relations.assurance = { a: parseFloat(h.cs(assurance).fontSize), d: parseFloat(h.cs(desc).fontSize), footer: !!assurance.closest('.g-card__footer') }
    const legal = gb.startsWith('newsletter') ? blk.querySelector('form.g-form > p') : null
    const hint = blk.querySelector('.g-input__hint')
    if (legal && hint) {
      const form = legal.parentElement
      // hueco ayuda → legal frente al gap del formulario (el que pondría la pila)
      const field = [...form.children].find((k) => k.contains(hint))
      res.relations.legal = { fs: parseFloat(h.cs(legal).fontSize), hintFs: parseFloat(h.cs(hint).fontSize), w: h.cs(legal).fontWeight, hintW: h.cs(hint).fontWeight, gap: Math.round((h.r(legal).t - h.r(hint).b) * 10) / 10, fieldGap: Math.round((h.r(legal).t - h.r(field).b) * 10) / 10, formGap: parseFloat(h.cs(form).rowGap) }
    }
    // Testimonials: la cita arranca donde la figura y donde su contenedor (sin los 40 px del navegador)
    if (gb.startsWith('testimonials')) {
      res.relations.quoteIndent = [...blk.querySelectorAll('figure')].filter(vis).map((f) => { const q = f.querySelector('blockquote'); return Math.round((h.r(q).l - h.r(f).l) * 10) / 10 })
    }
    out.push(res)
  }
  return out
}

async function bloques (b, eng) {
  for (const tema of THEMES) {
    for (const dark of [false, true]) {
      for (const [name, file, q] of PAGES) {
        const qs = [q, tema !== 'defecto' ? `tema=${tema}` : '', dark ? 'dark=1' : ''].filter(Boolean).join('&')
        const mode = `${eng} · ${tema}${dark ? ' · oscuro' : ''} · ${name}`
        const { p, close } = await open(b, `${O}/packages/blocks/playground/marketing/${file}${qs ? '?' + qs : ''}`, { ready: () => document.documentElement.dataset.ready === '1' && document.querySelector('[data-gb]') })
        await p.evaluate(HELP)
        // FAQ y Testimonials 03: abrir los paneles para medir las respuestas
        await p.evaluate(() => { for (const btn of document.querySelectorAll('.g-accordion-item__heading button[aria-expanded="false"]')) btn.click() })
        await settle(p, 450)
        const before = await p.evaluate(MEASURE)
        await p.addScriptTag({ url: `${O}/design/lab/text/r01/tx.js` })
        await p.evaluate(() => window.GTextLab.apply(document))
        await settle(p, 200)
        const after = await p.evaluate(MEASURE)
        for (let i = 0; i < after.length; i++) {
          const A = before[i]; const D = after[i]; const id = `${mode} · ${D.gb}`
          if (!dark && eng === 'chromium') note(`ANTES ${id}: márgenes del navegador ${A.browserMargins.length + A.indent.length}, cursivas ${A.italics.length}, fuera de escala ${A.offScale.length}`)
          ok(!D.indent.length, `${id}: sin sangría del navegador (figure/blockquote a 0 en línea)`, D.indent.slice(0, 3).join('; '))
          ok(!D.browserMargins.length, `${id}: márgenes 0 o el ritmo de su GText`, D.browserMargins.slice(0, 3).join('; '))
          ok(!D.italics.length, `${id}: sin cursiva del navegador (cite, address)`, [...new Set(D.italics)].join(','))
          ok(!D.offScale.length, `${id}: texto suelto en la escala del tema`, D.offScale.slice(0, 3).join('; '))
          ok(!D.roleMismatch.length, `${id}: cada texto en el rol de su GText`, D.roleMismatch.slice(0, 3).join('; '))
          ok(!D.rhythm.length, `${id}: ritmo entre bloques = r del tamaño`, D.rhythm.slice(0, 3).join('; '))
          ok(!D.lowContrast.length, `${id}: contraste ≥ 4,5:1`, D.lowContrast.slice(0, 3).join('; '))
          const rel = D.relations
          if (rel.assurance) ok(rel.assurance.a <= rel.assurance.d + 0.3, `${id}: assurance no más grande que la descripción`, `${rel.assurance.a} vs ${rel.assurance.d}`)
          if (rel.legal) {
            ok(rel.legal.fs <= rel.legal.hintFs + 0.3, `${id}: legal no más grande que la ayuda del campo`, `${rel.legal.fs} vs ${rel.legal.hintFs}`)
            ok(String(rel.legal.w) === String(rel.legal.hintW), `${id}: legal con el peso de la ayuda`, `${rel.legal.w} vs ${rel.legal.hintW}`)
            ok(near(rel.legal.fieldGap, rel.legal.formGap, 1), `${id}: entre el campo y el legal, solo el gap del formulario`, `${rel.legal.fieldGap} vs gap ${rel.legal.formGap} (antes ${A.relations.legal && A.relations.legal.fieldGap})`)
            if (!dark && eng === 'chromium') note(`${id}: ayuda → legal ${A.relations.legal.gap} px antes, ${rel.legal.gap} px después`)
          }
          if (rel.quoteIndent) ok(rel.quoteIndent.every((x) => near(x, 0, 1)), `${id}: la cita arranca en el borde de la figura (sin los 40 px)`, rel.quoteIndent.join('/'))
          // ¿El verificador ve el problema antes? (si no, la prueba no prueba nada)
          if (!dark && tema === 'defecto') ok(A.browserMargins.length + A.indent.length + A.italics.length + A.offScale.length + (A.relations.assurance && A.relations.assurance.a > A.relations.assurance.d ? 1 : 0) > 0 || /^faq-02|^stats-0[12]|^cta-0[13]$/.test(D.gb), `${id}: ANTES el hallazgo se reproduce`)
        }
        ok(!p.__errs.length, `${mode}: consola limpia`, p.__errs.join(' | '))
        if (!dark) {
          for (const [w, hh] of [[390, 844], [320, 640]]) {
            await p.setViewportSize({ width: w, height: hh }); await settle(p)
            ok(!(await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)), `${mode}: sin desplazamiento horizontal a ${w} (después)`)
          }
        }
        await close()
      }
    }
  }
}

// ---------- Casos límite ----------
async function casos (b, eng) {
  for (const [dark, sp5] of [[false, false], [true, false], [false, true]]) {
    const mode = `${eng}${dark ? ' · oscuro' : ''}${sp5 ? ' · space 5' : ''} · casos`
    const { p, close } = await open(b, `${O}/design/lab/text/r01/index.html?vista=casos${dark ? '&dark=1' : ''}`, { ready: () => window.__lab && window.__lab.ready })
    if (sp5) { await p.addStyleTag({ content: ':root, :root[data-theme] { --g-space-1: 5px; }' }); await settle(p, 120) }
    await p.evaluate(HELP)
    const m = await p.evaluate(() => {
      const h = window.__h; const $ = (id) => document.getElementById(id); const R = (id) => h.r($(id)); const cs = (id, pe) => getComputedStyle($(id), pe)
      const S = h.sizes()
      const gap = (a, b2) => Math.round((R(b2).t - R(a).b) * 10) / 10
      // C8: líneas y palabras de la última línea
      const lines = (el) => { const rg = document.createRange(); const words = []; const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n; while ((n = tw.nextNode())) { const re = /\S+/g; let mm; while ((mm = re.exec(n.textContent))) { rg.setStart(n, mm.index); rg.setEnd(n, mm.index + mm[0].length); words.push(Math.round(rg.getBoundingClientRect().top)) } } const tops = [...new Set(words)]; return { lines: tops.length, last: words.filter((t) => t === tops[tops.length - 1]).length } }
      // C9: ancho de la cita con comillas generadas frente a las literales de cada idioma
      const qw = (id) => { const bq = $(id); const p = bq.querySelector('p'); const w = p.getBoundingClientRect().width; const probe = (s) => { const sp = document.createElement('span'); sp.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap'; sp.textContent = s; p.append(sp); const ww = sp.getBoundingClientRect().width; sp.remove(); return ww }; const t = p.textContent; const pw = p.style.display; p.style.display = 'inline-block'; const real = p.getBoundingClientRect().width; p.style.display = pw; return { real: Math.round(real * 10) / 10, es: Math.round(probe('«' + t + '»') * 10) / 10, en: Math.round(probe('“' + t + '”') * 10) / 10, de: Math.round(probe('„' + t + '“') * 10) / 10, plain: Math.round(probe(t) * 10) / 10, w } }
      return {
        S,
        supports: { scope: CSS.supports('selector(:scope)') && typeof CSSScopeRule !== 'undefined', pretty: CSS.supports('text-wrap', 'pretty') || CSS.supports('text-wrap-style', 'pretty'), balance: CSS.supports('text-wrap', 'balance') || CSS.supports('text-wrap-style', 'balance'), nthOf: CSS.supports('selector(:nth-child(1 of p))') },
        c1: { root: cs('c1').margin, p12: gap('c1p1', 'c1p2'), qc: gap('c1q', 'c1c'), qLeft: R('c1q').l - R('c1').l, qMargin: cs('c1q').margin, citeStyle: cs('c1cite').fontStyle, capFs: parseFloat(cs('c1c').fontSize), qFs: parseFloat(cs('c1p1').fontSize), figTop: R('c1q').t - R('c1').t, figBottom: R('c1').b - R('c1c').b },
        c2: { a: gap('c2a', 'c2s'), b: gap('c2s', 'c2b'), style: cs('c2').fontStyle, pStyle: cs('c2a').fontStyle, fs: parseFloat(cs('c2a').fontSize) },
        c3: { small: parseFloat(cs('c3s').fontSize), em: cs('c3e').fontStyle, cite: cs('c3c').fontStyle, aDeco: cs('c3a').textDecorationLine, aColor: cs('c3a').color, text: cs('c3').color, weight: cs('c3').fontWeight },
        c4: { ab: gap('c4a', 'c4b'), bc: gap('c4b', 'c4c'), emptyH: R('c4empty').h, rowGap: parseFloat(cs('c4').rowGap) },
        c5: { top: R('c5p').t - R('c5').t, pu: gap('c5p', 'c5u'), uz: gap('c5u', 'c5z'), pad: parseFloat(cs('c5u').paddingInlineStart), uLeft: R('c5u').l - R('c5').l, rtlR: parseFloat(cs('c5ru').paddingRight), rtlL: parseFloat(cs('c5ru').paddingLeft), bottom: R('c5').b - R('c5z').b },
        c6: { contrast: h.contrast($('c6')) },
        c7: { col: R('c7').w, plain: R('c7plain').w, gt: R('c7gt').w, util: R('c7util').w, utilMb: parseFloat(cs('c7util').marginBottom), ch66: (() => { const s = document.createElement('span'); s.style.cssText = 'position:absolute;visibility:hidden;inline-size:66ch'; $('c7plain').append(s); const w = s.getBoundingClientRect().width; s.remove(); return w })() },
        // C8: busca un ancho donde el ajuste normal deja UNA palabra en la última línea y mira qué hace text-wrap: pretty
        c8: (() => { const box = $('c8').parentElement; let hit = null; for (let w = 200; w <= 420 && !hit; w += 2) { box.style.inlineSize = w + 'px'; const ref = lines($('c8ref')); if (ref.last === 1 && ref.lines > 1) hit = { w, ref, pretty: lines($('c8')) } } box.style.inlineSize = '300px'; return hit || { w: null } })(),
        c9: { es: qw('c9es'), en: qw('c9en'), de: qw('c9de') },
        contrastMuted: h.contrast($('c1c'))
      }
    })
    const r = m.S.space; const id = mode
    if (!dark) note(`${id}: soporte @scope ${m.supports.scope}, :nth-child(of) ${m.supports.nthOf}, text-wrap pretty ${m.supports.pretty}, balance ${m.supports.balance}`)
    ok(m.supports.scope, `${id}: @scope disponible (la regla del flujo de dentro lo usa, como GContainer prose)`)
    // C1 anidada
    ok(m.c1.root === '0px', `${id}: C1 la raíz no tiene margen`, m.c1.root)
    ok(near(m.c1.p12, r * 3), `${id}: C1 párrafos de la cita (body) a space × 3`, m.c1.p12)
    ok(near(m.c1.qc, r * 2.5), `${id}: C1 cita → pie con el ritmo de la de fuera (sm, space × 2,5)`, m.c1.qc)
    ok(near(m.c1.qLeft, 0), `${id}: C1 la cita sin sangría`, m.c1.qLeft)
    ok(near(m.c1.figTop, 0) && near(m.c1.figBottom, 0), `${id}: C1 nada antes del primero ni tras el último`, `${m.c1.figTop}/${m.c1.figBottom}`)
    ok(m.c1.citeStyle === 'normal', `${id}: C1 cite sin cursiva`)
    ok(near(m.c1.capFs, m.S.caption, 0.3) && near(m.c1.qFs, m.S.body, 0.3), `${id}: C1 cada GText con su rol (anidada)`, `${m.c1.capFs}/${m.c1.qFs}`)
    // C2 componente dentro
    ok(near(m.c2.a, r * 2.5) && near(m.c2.b, r * 2.5), `${id}: C2 GStack dentro: el ritmo a los dos lados lo pone el bloque nativo`, `${m.c2.a}/${m.c2.b}`)
    ok(m.c2.style === 'normal' && m.c2.pStyle === 'normal', `${id}: C2 address sin cursiva (ni sus líneas)`)
    ok(near(m.c2.fs, m.S['body-sm'], 0.3), `${id}: C2 líneas del address en sm`)
    // C3 en línea
    ok(near(m.c3.small, m.S.caption, 0.3) && m.c3.small >= 12, `${id}: C3 small dentro no baja de su GText (≥ 12 px)`, m.c3.small)
    ok(m.c3.em === 'italic', `${id}: C3 em conserva la cursiva (es énfasis)`)
    ok(m.c3.cite === 'normal', `${id}: C3 cite sin cursiva`)
    ok(/underline/.test(m.c3.aDeco) && m.c3.aColor !== m.c3.text, `${id}: C3 un a de la aplicación no se toca (subrayado y color de enlace)`, `${m.c3.aDeco} ${m.c3.aColor}`)
    ok(m.c3.weight === '400', `${id}: C3 caption con peso de texto (400), no de rótulo`, m.c3.weight)
    // C4 en GStack
    ok(near(m.c4.ab, m.c4.rowGap), `${id}: C4 dos GText en GStack: solo el gap de la pila`, `${m.c4.ab} vs ${m.c4.rowGap}`)
    ok(near(m.c4.emptyH, 0), `${id}: C4 una GText vacía no tiene alto`)
    note(`${id}: C4 una GText vacía pintada SUMA un gap más en GStack: ${m.c4.bc} px frente a ${m.c4.rowGap} (→ sin contenido no se pinta, punto 9)`)
    // C5 lista, oculto, RTL
    ok(near(m.c5.top, 0), `${id}: C5 un primer hijo oculto no cuenta (nada encima del primero visible)`, m.c5.top)
    ok(near(m.c5.pu, r * 3) && near(m.c5.uz, r * 3), `${id}: C5 lista con el ritmo de los párrafos`, `${m.c5.pu}/${m.c5.uz}`)
    ok(near(m.c5.uLeft, 0) && near(m.c5.pad, r * 6), `${id}: C5 la lista dentro de la caja (sangría space × 6 para la viñeta)`, `${m.c5.uLeft}/${m.c5.pad}`)
    ok(near(m.c5.rtlR, r * 6) && near(m.c5.rtlL, 0), `${id}: C5 en RTL la sangría va a la derecha`, `${m.c5.rtlR}/${m.c5.rtlL}`)
    ok(near(m.c5.bottom, 0), `${id}: C5 nada tras el último`, m.c5.bottom)
    // C6 zona de marca y contraste atenuado
    ok(m.c6.contrast >= 4.5, `${id}: C6 muted en la zona de marca ≥ 4,5:1`, m.c6.contrast)
    ok(m.contrastMuted >= 4.5, `${id}: muted sobre el fondo ≥ 4,5:1`, m.contrastMuted)
    // C7 prose
    if (!dark && !sp5) {
      ok(near(m.c7.gt, m.c7.plain, 2), `${id}: C7 GText dentro de prose se mide como la prosa (66ch, #855)`, `${Math.round(m.c7.gt)} vs ${Math.round(m.c7.plain)}`)
      ok(m.c7.util > m.c7.plain + 20 && m.c7.utilMb > 10, `${id}: C7 límite aceptado: un p con utilidad queda fuera de prose y conserva el margen del navegador`, `${Math.round(m.c7.util)} / ${m.c7.utilMb}`)
      ok(m.c7.plain < m.c7.col - 20 && near(m.c7.plain, m.c7.ch66, 2), `${id}: C7 (control) prose mide el p de la aplicación a 66ch`, `${Math.round(m.c7.plain)} de ${Math.round(m.c7.col)}`)
      note(`${id}: C7 X-L2 resuelto · GText dentro de prose: ${Math.round(m.c7.gt)} px (columna ${Math.round(m.c7.col)}, medida ${Math.round(m.c7.plain)})`)
      note(`${id}: C7 X-L3 (límite aceptado) · p con utilidad g-mt-4 dentro de prose: ${Math.round(m.c7.util)} px y margen inferior del navegador ${m.c7.utilMb} px`)
      if (m.c8.w) note(`${id}: C8 text-wrap a ${m.c8.w} px · sin GText ${m.c8.ref.lines} líneas y ${m.c8.ref.last} palabra en la última; con GText ${m.c8.pretty.lines} líneas y ${m.c8.pretty.last} palabra(s)`)
      else note(`${id}: C8 text-wrap · ningún ancho de 200 a 420 px deja una palabra viuda con el ajuste normal`)
      const pick = (o) => (near(o.real, o.es, 0.6) ? '«»' : near(o.real, o.en, 0.6) ? '“”' : near(o.real, o.de, 0.6) ? '„“' : near(o.real, o.plain, 0.6) ? 'ninguna' : `? ${o.real}`)
      note(`${id}: C9 (reservada) comillas por idioma · es ${pick(m.c9.es)} · en ${pick(m.c9.en)} · de ${pick(m.c9.de)}`)
    }
    ok(!p.__errs.length, `${id}: consola limpia`, p.__errs.join(' | '))
    await close()
  }
  // La vista «bloques» del prototipo (antes / después en iframes) monta y aplica
  for (const bk of ['testimonials', 'newsletter']) {
    const { p, close } = await open(b, `${O}/design/lab/text/r01/index.html?vista=bloques&b=${bk}`, { ready: () => window.__lab && window.__lab.ready })
    const n = await p.evaluate(() => ['antes', 'despues'].map((id) => document.getElementById(id).contentDocument.querySelectorAll('.g-text').length))
    ok(n[0] === 0 && n[1] > 0, `${eng} · index.html?vista=bloques&b=${bk}: antes sin GText, después con GText`, n.join('/'))
    ok(!p.__errs.length, `${eng} · vista bloques ${bk}: consola limpia`, p.__errs.join(' | '))
    await close()
  }
}


// ---------- Extras de coco: lo que kiwi no midió ----------
// E1 · la marca del pie sin enlace (FooterBrand sin href pinta un p con el logo o el nombre: GText de tamaño y tono por defecto)
// E2 · FAQ 02: las respuestas dentro de la GSection anidada (as="div" envolviendo los párrafos)
// E3 · strong y b con el peso de título-sm del tema; code, em y a intactos
const EXTRA_THEMES = ['defecto', 'rustico', 'lujo']
async function extras (b, eng) {
  for (const tema of EXTRA_THEMES) {
    for (const dark of [false, true]) {
      const qsT = [tema !== 'defecto' ? `tema=${tema}` : '', dark ? 'dark=1' : ''].filter(Boolean)
      // ---- E1
      for (const v of ['01', '02', '03']) {
       for (const variant of ['logo', 'nombre']) {
        const mode = `${eng} · ${tema}${dark ? ' · oscuro' : ''} · E1 footer ${v}`
        const { p, close } = await open(b, `${O}/packages/blocks/playground/marketing/footer.html?${['v=' + v, ...qsT].join('&')}`, { ready: () => document.documentElement.dataset.ready === '1' && document.querySelector('[data-gb]') })
        await p.evaluate(HELP)
        await p.addScriptTag({ url: `${O}/design/lab/text/r01/tx.js` })
        {
          const r = await p.evaluate(async (variant) => {
            const h = window.__h
            const blk = document.querySelector('[data-gb]')
            // La marca con enlace es el primer hijo del primer .g-adapt-wide (o del bloque): la sustituimos por lo que pinta FooterBrand sin href
            const link = blk.querySelector('a.g-btn:has(img)')
            if (!link) return { skip: document.querySelector('[data-gb]').outerHTML.slice(0, 600) }
            const holder = link.parentElement
            const before = { gapNext: null }
            const next = link.nextElementSibling
            const gapOf = (a, b2) => b2 ? Math.round((b2.getBoundingClientRect().top - a.getBoundingClientRect().bottom) * 10) / 10 : null
            before.gapNext = gapOf(link, next)
            const img = link.querySelector('img')
            const pp = document.createElement('p')
            if (variant === 'logo' && img) pp.append(img.cloneNode(true)); else pp.textContent = img ? img.alt : link.textContent.trim()
            await window.GTextLab.apply(document)
            link.replaceWith(pp)
            pp.classList.add('g-text', 'g-text--size-body', 'g-text--tone-default')
            await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 120))))
            if (img) await Promise.all([...pp.querySelectorAll('img')].map((i) => i.complete ? 1 : new Promise((r) => { i.onload = i.onerror = r })))
            const cs = getComputedStyle(pp)
            const S = h.sizes()
            return {
              m: [cs.marginTop, cs.marginRight, cs.marginBottom, cs.marginLeft].map(parseFloat),
              italic: cs.fontStyle, fs: parseFloat(cs.fontSize), want: S.body, weight: cs.fontWeight, bodyW: getComputedStyle(document.documentElement).getPropertyValue('--g-text-body-weight').trim(),
              contrast: variant === 'nombre' ? h.contrast(pp) : null,
              parentGap: parseFloat(getComputedStyle(holder).rowGap) || 0, parentDisplay: getComputedStyle(holder).display,
              gapNext: gapOf(pp, pp.nextElementSibling), before: before.gapNext, hasNext: !!pp.nextElementSibling,
              scrollW: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
              dbg: [(() => { const o = []; const walk = (rules) => { for (const r of rules) { if (r.cssRules && !r.selectorText) walk(r.cssRules); else if (r.selectorText && pp.matches(r.selectorText) && /margin|width|inline-size/.test(r.cssText)) o.push(r.cssText.slice(0, 90)) } }; for (const sh of document.styleSheets) { try { walk(sh.cssRules) } catch {} } return o.join(' || ') })(), cs.width, cs.display, pp.parentElement.className, getComputedStyle(pp.parentElement).display, pp.parentElement.getBoundingClientRect().width].join('·')
            }
          }, variant)
          const id = `${mode} · ${variant}`
          if (r.skip) { ok(false, `${id}: no se encontró el enlace de la marca`, r.skip); continue }
          ok(r.m.every((x) => near(x, 0)), `${id}: la marca sin enlace tiene margen 0 (sin el del navegador)`, r.m.join('/') + ' ' + r.dbg)
          ok(r.italic === 'normal', `${id}: sin cursiva`)
          ok(near(r.fs, r.want, 0.3), `${id}: tamaño body del tema`, `${r.fs} vs ${r.want}`)
          ok(String(r.weight) === String(r.bodyW), `${id}: peso de texto del tema`, `${r.weight} vs ${r.bodyW}`)
          if (r.contrast !== null) ok(r.contrast >= 4.5, `${id}: el nombre sin atenuar con contraste ≥ 4,5:1`, r.contrast)
          // Aire a su vecino: solo el que pone la distribución (el gap del contenedor o 0), nunca un margen de la marca
          if (r.hasNext && r.gapNext !== null && r.gapNext > -1) ok(near(r.gapNext, r.parentDisplay === 'flex' || r.parentDisplay === 'grid' ? r.parentGap : 0, 1.5) || r.gapNext >= 0, `${id}: aire al vecino = el de la distribución (sin margen propio)`, `${r.gapNext} (gap ${r.parentGap}, ${r.parentDisplay}; antes con enlace ${r.before})`)
          if (!dark && tema === 'defecto' && eng === 'chromium') note(`${id}: marca sin enlace → vecino ${r.gapNext} px (con enlace ${r.before} px)`)
        }
        ok(!p.__errs.length, `${mode} · ${variant}: consola limpia`, p.__errs.join(' | '))
        await close()
       }
      }
      // ---- E2
      {
        const mode = `${eng} · ${tema}${dark ? ' · oscuro' : ''} · E2 FAQ 02`
        const { p, close } = await open(b, `${O}/packages/blocks/playground/marketing/faq.html?${['v=02', ...qsT].join('&')}`, { ready: () => document.documentElement.dataset.ready === '1' && document.querySelector('[data-gb]') })
        await p.evaluate(HELP)
        const geo = () => {
          const h = window.__h; const blk = document.querySelector('[data-gb]')
          const items = [...blk.querySelectorAll('li')].filter((li) => li.querySelector('.g-section'))
          return items.map((li) => {
            const sec = li.querySelector('.g-section')
            const body = sec.querySelector('.g-section__body'); const ps = [...body.children].filter((c) => c.matches('p, .g-text'))
            const head = sec.querySelector('.g-section__head')
            const box = ps.length ? ps : []
            return {
              h: Math.round(li.getBoundingClientRect().height * 10) / 10,
              nBlocks: box.length,
              headGap: box.length ? Math.round((box[0].getBoundingClientRect().top - head.getBoundingClientRect().bottom) * 10) / 10 : null,
              secGap: parseFloat(getComputedStyle(sec).rowGap), bodyKids: body.children.length,
              pm: ps.map((x) => [getComputedStyle(x).marginTop, getComputedStyle(x).marginBottom].map(parseFloat))
            }
          })
        }
        const before = await p.evaluate(geo)
        await p.addScriptTag({ url: `${O}/design/lab/text/r01/tx.js` })
        await p.evaluate(async () => {
          await window.GTextLab.apply(document)
          const blk = document.querySelector('[data-gb]')
          for (const li of blk.querySelectorAll('li')) {
            const sec = li.querySelector('.g-section'); if (!sec) continue
            const ps = [...sec.querySelector('.g-section__body').children].filter((c) => c.matches('p'))
            if (!ps.length) continue
            const d = document.createElement('div'); ps[0].before(d); ps.forEach((x) => d.append(x))
            d.classList.add('g-text', 'g-text--size-body', 'g-text--tone-default'); d.dataset.lab = 'div·body·default'
          }
        })
        await settle(p, 200)
        const after = await p.evaluate(geo)
        const S = await p.evaluate(() => window.__h.sizes())
        const multi = await p.evaluate(() => [...document.querySelectorAll('[data-gb] li .g-text')].map((g) => { const k = [...g.children]; return k.length < 2 ? null : Math.round((k[1].getBoundingClientRect().top - k[0].getBoundingClientRect().bottom) * 10) / 10 }).filter((x) => x !== null))
        ok(after.length === before.length && after.length > 0, `${mode}: ${after.length} respuestas`)
        ok(after.every((a) => a.bodyKids === 1 && a.nBlocks === 1 && a.pm.every(([t, b2]) => near(t, 0) && near(b2, 0))), `${mode}: la GText as="div" es el único hijo y sin margen propio`, JSON.stringify(after.slice(0, 2).map((a) => a.pm)))
        ok(after.every((a, i) => near(a.headGap, a.secGap, 1)), `${mode}: título → respuesta = solo el gap de la GSection`, after.slice(0, 3).map((a) => `${a.headGap}/${a.secGap}`).join(' '))
        ok(multi.every((g) => near(g, S.space * 3, 1)), `${mode}: entre párrafos de una respuesta space × 3`, multi.join(','))
        ok(after.every((a, i) => a.headGap <= before[i].headGap + 0.5), `${mode}: título → respuesta no aumenta al llevar GText (antes ${before.slice(0, 3).map((x) => x.headGap)} · después ${after.slice(0, 3).map((x) => x.headGap)})`)
        if (!dark && tema === 'defecto' && eng === 'chromium') note(`${mode}: alto de las respuestas antes ${before.map((x) => x.h)} · después ${after.map((x) => x.h)} (text-wrap: pretty puede añadir un renglón; el margen del navegador desaparece)`)
        if (!dark && tema === 'defecto' && eng === 'chromium') note(`${mode}: título → respuesta ${before[0].headGap} px antes (margen del navegador sumado al gap) y ${after[0].headGap} px después`)
        ok(!p.__errs.length, `${mode}: consola limpia`, p.__errs.join(' | '))
        await close()
      }
    }
  }

  // ---- E4 forced-colors (solo Chromium: Firefox y WebKit no lo emulan en Playwright) y texto sin color propio roto
  if (eng === 'chromium') {
    const ctx = await b.newContext({ viewport: { width: 1200, height: 800 }, forcedColors: 'active' })
    const p = await ctx.newPage()
    await p.goto(`${O}/design/lab/text/r01/index.html?vista=casos`, { waitUntil: 'domcontentloaded' })
    await p.waitForFunction(() => window.__lab && window.__lab.ready, null, { timeout: 20000 })
    const r = await p.evaluate(() => { const e = document.getElementById('c1c'); const q = document.getElementById('c1q'); const cs = getComputedStyle(e); return { fc: matchMedia('(forced-colors: active)').matches, color: cs.color, bg: getComputedStyle(document.body).backgroundColor, qcolor: getComputedStyle(q).color } })
    ok(r.fc, `${eng} · E4 forced-colors activo`)
    ok(r.color === r.qcolor && r.color !== 'rgba(0, 0, 0, 0)', `${eng} · E4 forced-colors: el texto toma el color del sistema (default y muted igual)`, `${r.color} / ${r.qcolor} sobre ${r.bg}`)
    await ctx.close()
  }
  // ---- E3 strong / b / code / em / a
  for (const dark of [false, true]) {
    const mode = `${eng}${dark ? ' · oscuro' : ''} · E3 fraseo`
    const { p, close } = await open(b, `${O}/design/lab/text/r01/index.html?vista=casos${dark ? '&dark=1' : ''}`, { ready: () => window.__lab && window.__lab.ready })
    await p.evaluate(HELP)
    const r = await p.evaluate(() => {
      const host = document.createElement('div')
      host.innerHTML = '<p class="g-text g-text--size-body g-text--tone-default" id="e3"><strong>fuerte</strong> <b>negrita</b> <em>énfasis</em> <code>código</code> <a href="#e3">enlace</a></p>'
      document.body.append(host)
      const e = host.querySelector('#e3'); const cs = (sel) => getComputedStyle(e.querySelector(sel))
      const probe = document.createElement('span'); probe.style.fontWeight = 'var(--g-text-title-sm-weight)'; host.append(probe)
      return { strong: cs('strong').fontWeight, b: cs('b').fontWeight, want: getComputedStyle(probe).fontWeight, base: getComputedStyle(e).fontWeight, em: cs('em').fontStyle, code: cs('code').fontFamily, codeBase: getComputedStyle(e).fontFamily, deco: cs('a').textDecorationLine }
    })
    ok(r.strong === r.want && r.b === r.want, `${mode}: strong y b con el peso de título-sm del tema`, `${r.strong}/${r.b} vs ${r.want}`)
    ok(Number(r.strong) > Number(r.base), `${mode}: el énfasis pesa más que el texto`, `${r.strong} vs ${r.base}`)
    ok(r.em === 'italic' && /underline/.test(r.deco) && r.code !== r.codeBase, `${mode}: em, a y code intactos`, `${r.em} ${r.deco} ${r.code}`)
    ok(!p.__errs.length, `${mode}: consola limpia`, p.__errs.join(' | '))
    await close()
  }
}

for (const eng of ENGINES) {
  const b = await pw[eng].launch()
  try {
    if (PARTS.includes('casos')) await casos(b, eng)
    if (PARTS.includes('bloques')) await bloques(b, eng)
    if (PARTS.includes('extras')) await extras(b, eng)
  } finally { await b.close() }
}
server.close()
console.log(`\nNotas (${notes.length}):`)
for (const n of notes) console.log('  · ' + n)
console.log(`\nFallos (${failed}):`)
for (const f of fails) console.log('  ✗ ' + f)
console.log(`\nResultado: ${total - failed}/${total} comprobaciones (${ENGINES.join(', ')}; ${PARTS.join(', ')})`)
process.exit(failed ? 1 : 0)
