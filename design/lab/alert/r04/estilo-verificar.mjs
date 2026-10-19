// coco · auditoría posterior de las variantes visuales de la cápsula D1 (isla de estado r04): V1 Tinta, V2 Cristal,
// V2C Cristal corregida, V3 Obsidiana y, en la ronda 2 (solo el claro, con el oscuro de V2C), L1 Grafito, L2 Obsidiana neutra, L3 Porcelana. Chromium, Firefox y WebKit. Sobre estilo-banco.html (la lógica D1 de kiwi copiada sin cambios + el CSS de coco).
//   1. Comportamiento y movimiento sin cambios (lo esencial de r04/verificar.mjs para D1)
//   2. Contraste en la galería: texto ≥ 4,5; glifo, anillo, chevrón, contorno de la acción y foco ≥ 3; delimitación ≥ 3
//      frente a la página, la superficie (tabla/formulario) y la zona de marca. Tema por defecto claro y oscuro en los tres
//      motores; en Chromium además los once temas de dark-color-presence, regenerados con el CLI actual (traen la zona)
//   3. forced-colors (Chromium) · 4. 320 px · 5. texto al 200 % · 6. movimiento reducido · 7. alineación y espaciado en LTR
//      y RTL · 8. dianas ≥ 24 (y ≥ 44 con pointer: coarse, Chromium)
// Ejecutar: node design/lab/alert/r04/estilo-verificar.mjs [--capturas]   (GRANA_PW_PORT, por defecto 4214)
//   ENGINES=chromium VARIANTS=V1 THEMES=0 VERBOSE=1 para filtrar o ver todo. Requiere `npm run build`.
import http from 'node:http'
import { readFile, mkdtemp, readdir } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))
const HERE = fileURLToPath(new URL('./', import.meta.url))
const PORT = Number(process.env.GRANA_PW_PORT || 4214)
const CAPS = process.argv.includes('--capturas')
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json' }
const server = http.createServer(async (req, res) => {
  try {
    const path = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!path.startsWith(ROOT)) throw new Error('fuera')
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(path))
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${PORT}/design/lab/alert/r04/estilo-banco.html`
const RT = 2600
const ERR = 'Error: No se pudo guardar la factura. El servidor no respondió; tus datos siguen en el formulario.'

// Temas: los once de dark-color-presence, regenerados con el CLI actual (los .css de generated/ son anteriores a la zona)
const THEMES = []
if (process.env.THEMES !== '0') {
  const dir = join(ROOT, 'design/lab/tema-oscuro/dark-color-presence/themes')
  const out = await mkdtemp(join(tmpdir(), 'grana-isla-'))
  for (const f of (await readdir(dir)).filter((x) => x.endsWith('.json')).sort()) {
    const css = join(out, f.replace('.json', '.css'))
    execFileSync(process.execPath, [join(ROOT, 'packages/cli/bin/grana.mjs'), 'theme', join(dir, f), '--out', css], { stdio: 'ignore' })
    THEMES.push({ name: f.replace('.json', ''), css: await readFile(css, 'utf8') })
  }
}

// Utilidades de color en la página: parser de rgb/color(srgb)/oklab/oklch/hex, composición y contraste WCAG
const UTIL = () => {
  const lin2s = (v) => { v = Math.max(0, Math.min(1, v)); return 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055) }
  const oklab = (L, a, b) => {
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3
    return [lin2s(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s), lin2s(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s), lin2s(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s)]
  }
  const num = (t, scale = 1) => t.endsWith('%') ? parseFloat(t) / 100 * scale : parseFloat(t)
  function parse (str) {
    str = String(str).trim()
    if (!str || str === 'transparent' || str === 'none') return [0, 0, 0, 0]
    let m
    if ((m = str.match(/^#([0-9a-f]{3,8})$/i))) { let h = m[1]; if (h.length <= 4) h = [...h].map((c) => c + c).join(''); const n = (i) => parseInt(h.slice(i, i + 2), 16); return [n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1] }
    if ((m = str.match(/^(rgba?|color|oklab|oklch)\((.*)\)$/i))) {
      const fn = m[1].toLowerCase(); let body = m[2].replace(/,/g, ' ').trim()
      let alpha = 1
      if (body.includes('/')) { const [a, b] = body.split('/'); body = a.trim(); alpha = num(b.trim()) }
      let p = body.split(/\s+/)
      if (fn === 'rgb' || fn === 'rgba') { if (p.length === 4) { alpha = num(p[3]); p = p.slice(0, 3) } return [...p.map((x) => num(x, 255)), alpha] }
      if (fn === 'color') { const sp = p.shift(); if (sp !== 'srgb') throw new Error('espacio ' + sp); return [...p.map((x) => num(x) * 255), alpha] }
      if (fn === 'oklab') return [...oklab(num(p[0]), num(p[1], 0.4), num(p[2], 0.4)), alpha]
      if (fn === 'oklch') { const L = num(p[0]), C = num(p[1], 0.4), H = parseFloat(p[2]) * Math.PI / 180; return [...oklab(L, C * Math.cos(H), C * Math.sin(H)), alpha] }
    }
    throw new Error('color sin leer: ' + str)
  }
  const over = (top, bot) => [...top.slice(0, 3).map((v, i) => v * top[3] + bot[i] * (1 - top[3])), 1]
  const L = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
  const cr = (a, b) => { const x = L(a), y = L(b); return Math.round((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) * 100) / 100 }
  // resuelve una expresión de color en el contexto de un elemento (variables, zona)
  function resolve (el, expr) { const s = document.createElement('span'); s.style.backgroundColor = expr; el.append(s); const v = getComputedStyle(s).backgroundColor; s.remove(); return parse(v) }
  function shadows (cs) {
    const raw = cs.boxShadow; if (!raw || raw === 'none') return []
    const parts = []; let depth = 0, cur = ''
    for (const ch of raw) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ',' && !depth) { parts.push(cur.trim()); cur = '' } else cur += ch }
    parts.push(cur.trim())
    return parts.map((p) => {
      const cm = p.match(/(rgba?\([^)]*\)|color\([^)]*\)|oklab\([^)]*\)|oklch\([^)]*\)|#[0-9a-f]+|transparent)/i)
      const rest = cm ? p.replace(cm[0], '') : p
      const n = (rest.match(/-?[\d.]+px/g) || []).map(parseFloat)
      return { color: cm ? parse(cm[0]) : [0, 0, 0, 0], x: n[0] || 0, y: n[1] || 0, blur: n[2] || 0, spread: n[3] || 0, inset: /inset/.test(p) }
    })
  }
  window.__C = { parse, over, cr, resolve, shadows }
}

const total = { pass: 0, fail: 0 }
const tally = {}
for (const engine of (process.env.ENGINES || 'chromium,firefox,webkit').split(',')) {
  const browser = await pw[engine].launch()
  for (const V of (process.env.VARIANTS || 'V1,V2,V2C,V3,L1,L2,L3').split(',')) {
    let pass = 0; const fails = []; const errs = []; const data = []
    const ok = (c, m) => { if (c) pass++; else fails.push(m); if (process.env.VERBOSE) console.log(engine, V, c ? 'ok ' : 'NO ', m) }
    const open = async ({ vw = 1100, vh = 760, q = '', live = true, css = '', ...ctx } = {}) => {
      const context = await browser.newContext({ viewport: { width: vw, height: vh }, ...ctx })
      await context.addInitScript(UTIL)
      const p = await context.newPage()
      p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.text()) })
      p.on('pageerror', (e) => errs.push(String(e)))
      await p.goto(`${BASE}?v=${V}&t=${RT}${q}`)
      if (css) await p.addStyleTag({ content: css })
      if (live) await p.waitForFunction(() => window.__S && document.querySelector('.isle.is-ready'))
      else { await p.waitForFunction(() => window.__G && window.__G.ready); await p.evaluate(() => document.fonts.ready); await p.evaluate(() => window.__G.size()) }
      await p.waitForTimeout(60)
      return { p, context }
    }
    const st = (p) => p.evaluate(() => {
      const el = document.querySelector('#region .d1')
      const r = el && !el.hidden ? el.getBoundingClientRect() : null
      const a = document.activeElement
      return { form: document.querySelector('#isle').dataset.form, rect: r && { x: r.x, y: r.y, w: r.width, h: r.height, right: r.right }, visible: !!r, focus: a && (a.id || a.dataset.do || a.className || a.tagName), live: window.__live.length, list: window.__S.list }
    })
    const film = async (p, ms) => p.evaluate((ms) => new Promise((done) => {
      const out = []; const t0 = performance.now()
      const tick = () => {
        const el = document.querySelector('#region .d1')
        if (el && !el.hidden) { const r = el.getBoundingClientRect(); out.push({ t: performance.now() - t0, w: r.width, y: r.top, op: +getComputedStyle(el).opacity, io: +getComputedStyle(el.firstElementChild).opacity }) } else out.push({ hidden: true })
        if (performance.now() - t0 < ms) requestAnimationFrame(tick); else done(out)
      }
      requestAnimationFrame(tick)
    }), ms)

    // ---------- 1. Comportamiento y movimiento: los de D1, sin cambios ----------
    {
      const { p, context } = await open()
      const s0 = await st(p)
      ok(!s0.visible && s0.live === 0, `carga: nada a la vista y 0 anuncios (${s0.form}, ${s0.live})`)
      await p.locator('#save').focus()
      const filmP = film(p, 900)
      await p.keyboard.press('Enter')
      const fr = (await filmP).filter((f) => !f.hidden)
      const s1 = await st(p)
      const live = await p.evaluate(() => window.__live)
      ok(live.length === 1 && live[0].text === ERR && live[0].ch === 'assertive' && s1.focus === 'save', `error: un anuncio enérgico exacto y el foco sigue en «Guardar» (${live.length}, ${s1.focus})`)
      const vis = fr.filter((f) => f.op > 0.05); const fin = vis[vis.length - 1]; const f0 = vis[0]
      ok(vis.length && Math.max(...vis.map((f) => f.w)) <= fin.w * 1.06 + 2, `nacer: ningún cuadro más ancho que la isla (máx ${Math.round(Math.max(...vis.map((f) => f.w)))}px, final ${fin && Math.round(fin.w)}px)`)
      ok(f0 && (f0.op < 0.9 || f0.y < fin.y - 1) && f0.io < 0.1 && f0.w <= 100, `nacer: cápsula sin texto que entra desde el borde (op ${f0 && f0.op.toFixed(2)}, ${f0 && Math.round(f0.w)}px, contenido ${f0 && f0.io})`)
      await p.locator('#region .d1').hover(); await p.waitForTimeout(RT + 300)
      ok((await st(p)).visible && await p.locator('#region .d1 [data-do=act]').isVisible(), 'pausa con el puntero y la acción asoma')
      ok(await p.evaluate(() => document.getElementById('isle').dataset.paused === 'true'), 'pausa: data-paused="true" (la pista del anillo se completa)')
      const echo = p.evaluate(() => new Promise((r) => { const m = document.getElementById('mark-save'); const mo = new MutationObserver(() => { if (m.classList.contains('is-echo')) { mo.disconnect(); r(true) } }); mo.observe(m, { attributes: true }); setTimeout(() => r(false), 6000) }))
      const lvP = film(p, RT + 1200)
      await p.mouse.move(5, 740)
      const lv = await lvP
      const shownF = lv.filter((f) => !f.hidden); const y0 = shownF.length ? shownF[0].y : 0
      ok(shownF.some((f) => f.y < y0 - 2 && f.op < 1) && lv[lv.length - 1].hidden, `se recoge subiendo y fundiéndose (${shownF.filter((f) => f.y < y0 - 2).length} cuadros)`)
      ok(await echo, 'al recogerse, la marca recibe el eco')
      await p.locator('#mark-save').click(); await p.waitForTimeout(450)
      const s3 = await st(p)
      ok(s3.list && s3.focus === 'act', `la marca trae lo pendiente con el foco en «Reintentar» (${s3.focus})`)
      await p.keyboard.press('Escape'); await p.waitForTimeout(800)
      const s4 = await st(p)
      ok(!s4.visible && s4.focus === 'mark-save', `Esc la recoge y el foco vuelve a la marca (${s4.focus})`)
      await context.close()
    }
    {
      const { p, context } = await open()
      await p.locator('#s-three').click(); await p.mouse.move(5, 740); await p.waitForTimeout(700)
      const txt = await p.locator('#region .d1__text').innerText()
      ok(/No se pudo guardar/.test(txt) && (await p.evaluate(() => window.__S.queue.length)) === 2 && /\+2/.test(await p.locator('#region .d1__count').innerText()), `relevo: lo más grave delante y «+2» (${txt})`)
      const fr = film(p, RT + 600); await p.waitForTimeout(RT + 700); const f = await fr
      ok(f.every((x) => !x.hidden) && (await p.evaluate(() => window.__S.queue.length)) === 1, 'relevo: pasa a la siguiente sin desaparecer')
      await p.evaluate(() => window.__S.B.remove('maint')); await p.evaluate(() => window.__S.B.remove('offline')); await p.evaluate(() => window.__S.B.remove('save')); await p.waitForTimeout(700)
      await p.locator('#s-session').click(); await p.mouse.move(5, 740); await p.locator('#cliente').focus(); await p.waitForTimeout(RT + 900)
      ok((await st(p)).visible && /^\d+:\d\d$/.test((await p.locator('#region [role=timer]').innerText()).trim()), 'cuenta atrás que se queda, m:ss en role=timer')
      await p.locator('#cliente').focus(); await p.keyboard.press('Alt+F8'); await p.waitForTimeout(400)
      ok((await st(p)).list, 'Alt+F8 abre la lista')
      await p.keyboard.press('Alt+F8'); await p.waitForTimeout(700)
      ok((await st(p)).focus === 'cliente', 'Alt+F8 dentro vuelve al campo')
      const a11y = await p.evaluate(() => ({ lives: document.querySelectorAll('[aria-live]:not([aria-live=off]),[role=status],[role=alert]').length, regionLive: document.getElementById('region').hasAttribute('aria-live') }))
      ok(a11y.lives === 2 && !a11y.regionLive, `un solo par de canales; la isla no es región viva (${a11y.lives})`)
      ok(errs.length === 0, `sin errores de consola (${errs.slice(0, 3).join(' | ')})`)
      await context.close()
    }

    // ---------- 1b. Rúbrica B y D (lo visual): cambios de brillo al nacer y al recogerse sin destellos, claro y oscuro ----------
    const flashes = {}
    for (const dark of [false, true]) {
      const { p, context } = await open({ q: dark ? '&theme=dark' : '' })
      const fP = film(p, 900); await p.locator('#save').click(); const born = (await fP).filter((f) => !f.hidden)
      await p.mouse.move(5, 740)
      const lP = film(p, RT + 1400); const gone = await lP
      const eff = (f) => f.hidden ? 0 : f.op
      let up = 0, down = 0
      for (let i = 1; i < born.length; i++) up = Math.max(up, born[i].op - born[i - 1].op)
      for (let i = 1; i < gone.length; i++) down = Math.max(down, eff(gone[i - 1]) - eff(gone[i]))
      const lum = await p.evaluate(() => { const { parse, over, cr } = window.__C; const d = document.querySelector('#region .d1'); d.hidden = false; const pg = parse(getComputedStyle(document.body).backgroundColor); const f = over(parse(getComputedStyle(d).backgroundColor), pg); d.hidden = true; return cr(f, pg) })
      flashes[dark ? 'oscuro' : 'claro'] = { subida: +up.toFixed(2), bajada: +down.toFixed(2), saltoDeBrillo: lum }
      ok(up <= 0.5 && down <= 0.5, `${dark ? 'oscuro' : 'claro'}: nacer y recogerse sin destello (opacidad por cuadro +${up.toFixed(2)} / −${down.toFixed(2)}; salto de brillo cápsula/página ${lum}:1)`)
      await context.close()
    }
    data.flashes = flashes

    // ---------- 2. Contraste y delimitación (galería, nodos quietos) ----------
    const measure = (p) => p.evaluate((V) => {
      const { parse, over, cr, resolve, shadows } = window.__C
      const cs = (el) => getComputedStyle(el)
      const page = parse(cs(document.body).backgroundColor)
      const surface = over(parse(cs(document.querySelector('.gal__bg--table')).backgroundColor), page)
      const zone = over(parse(cs(document.querySelector('.gal__bg--zone')).backgroundColor), page)
      const BG = { pagina: page, superficie: surface, zona: zone }
      const pagePanel = document.querySelector('.gal__panel--page')
      const caps = [...document.querySelectorAll('.gal__panel--page .isle--static .d1')]
      const fillRaw = parse(cs(caps[0]).backgroundColor)
      // el cristal es translúcido: la tinta se mide contra el peor fondo (negro o blanco) y los tres fondos
      const backs = fillRaw[3] < 1 ? [[0, 0, 0, 1], [255, 255, 255, 1], page, surface, zone] : [page]
      const fills = backs.map((b) => over(fillRaw, b))
      const minOn = (fg, layer) => Math.min(...fills.map((f) => { const base = layer ? over(layer, f) : f; return cr(over(fg, base), base) }))
      const out = { text: {}, graphic: {}, edge: {} }
      const T = (k, v) => { out.text[k] = Math.min(out.text[k] ?? 99, v) }
      const G = (k, v) => { out.graphic[k] = Math.min(out.graphic[k] ?? 99, v) }
      for (const d1 of caps) {
        d1.querySelectorAll('.d1__text').forEach((e) => T('título', minOn(parse(cs(e).color))))
        d1.querySelectorAll('.d1__desc, .item__desc').forEach((e) => T('descripción', minOn(parse(cs(e).color))))
        d1.querySelectorAll('.item__title').forEach((e) => T('título de la lista', minOn(parse(cs(e).color))))
        d1.querySelectorAll('.timer').forEach((e) => T('cuenta atrás', minOn(parse(cs(e).color))))
        d1.querySelectorAll('.d1__count').forEach((e) => T('«+N»', minOn(parse(cs(e).color), parse(cs(e).backgroundColor))))
        d1.querySelectorAll('.ibtn:not([data-do=act])').forEach((e) => T('botones de texto', minOn(parse(cs(e).color))))
        d1.querySelectorAll('.ibtn[data-do=act]').forEach((e) => {
          const bg = parse(cs(e).backgroundColor)
          T('acción (texto)', Math.min(...fills.map((f) => { const b = over(bg, f); return cr(over(parse(cs(e).color), b), b) })))
          G('acción (contorno de la cápsula rellena)', Math.min(...fills.map((f) => cr(over(bg, f), f))))
        })
        d1.querySelectorAll('.d1__chev').forEach((e) => G('chevrón', minOn(parse(cs(e).color))))
        d1.querySelectorAll('.badge').forEach((b) => {
          const disc = parse(cs(b).backgroundColor); const glyph = parse(cs(b).color)
          const k = 'glifo del tipo · ' + b.dataset.type
          G(k, Math.min(...fills.map((f) => { const base = over(disc, f); return cr(over(glyph, base), base) })))
          if (disc[3] > 0) out.disco = Math.min(out.disco ?? 99, ...fills.map((f) => cr(over(disc, f), f)))
          if (b.querySelector('.ring')) G('anillo de tiempo · ' + b.dataset.type, minOn(resolve(b, 'var(--_ring)')))
        })
        if (d1.classList.contains('is-focus-demo')) { const s = d1.querySelector('.d1__summary'); G('foco', minOn(parse(cs(s).outlineColor))) }
      }
      // delimitación: relleno (compuesto sobre cada fondo), anillos exteriores (sobre el fondo) e interiores (sobre el relleno)
      const sh = shadows(cs(caps[0])).filter((s) => !s.blur && !s.x && !s.y && s.spread > 0)
      for (const [k, bg] of Object.entries(BG)) {
        const f = over(fillRaw, bg)
        const cands = [cr(f, bg), ...sh.map((s) => cr(over(s.color, s.inset ? f : bg), bg))]
        out.edge[k] = Math.max(...cands)
        out.edgeFill = Object.assign(out.edgeFill || {}, { [k]: cands[0] })
      }
      // la marca junto al origen
      const mk = document.querySelector('.gal__panel--page .mark')
      if (mk) {
        const mf = over(parse(cs(mk).backgroundColor), page)
        T('marca (texto)', cr(over(parse(cs(mk).color), mf), mf))
        const msh = shadows(cs(mk)).filter((s) => !s.blur && !s.x && !s.y && s.spread > 0)
        out.edge['marca · página'] = Math.max(cr(mf, page), ...msh.map((s) => cr(over(s.color, s.inset ? mf : page), page)))
        const mb = mk.querySelector('.badge'); const mbase = over(parse(cs(mb).backgroundColor), mf)
        G('marca (glifo)', cr(over(parse(cs(mb).color), mbase), mbase))
      }
      out.fill = fillRaw
      return out
    }, V)
    const judge = (tag, m) => {
      const lowT = Object.entries(m.text).filter(([, v]) => v < 4.5)
      const lowG = Object.entries(m.graphic).filter(([, v]) => v < 3)
      const lowE = Object.entries(m.edge).filter(([, v]) => v < 3)
      const minT = Math.min(...Object.values(m.text)), minG = Math.min(...Object.values(m.graphic)), minE = Math.min(...Object.values(m.edge))
      data.push({ tag, minT, minG, minE, disco: m.disco, relleno: m.edgeFill })
      ok(!lowT.length, `${tag}: texto ≥ 4,5 (mín ${minT}${lowT.length ? '; bajos ' + JSON.stringify(lowT) : ''})`)
      ok(!lowG.length, `${tag}: glifo, anillo, chevrón, acción y foco ≥ 3 (mín ${minG}${lowG.length ? '; bajos ' + JSON.stringify(lowG) : ''})`)
      ok(!lowE.length, `${tag}: delimitación ≥ 3 frente a página, superficie y zona (${JSON.stringify(m.edge)})`)
      return m
    }
    for (const dark of [false, true]) {
      const { p, context } = await open({ live: false, q: `&vista=galeria${dark ? '&theme=dark' : ''}`, vw: 1280, vh: 1400 })
      const m = judge(`por defecto ${dark ? 'oscuro' : 'claro'}`, await measure(p))
      console.log(`   ${engine} ${V} ${dark ? 'oscuro' : 'claro'} · dato: relleno frente al fondo ${JSON.stringify(m.edgeFill)}, disco de la insignia frente a la cápsula ${m.disco ?? '—'}, delimitación ${JSON.stringify(m.edge)}`)
      if (process.env.VERBOSE) console.log(JSON.stringify(m))
      if (CAPS && engine === 'chromium') await p.screenshot({ path: join(HERE, `estilo-${V}-${dark ? 'oscuro' : 'claro'}.png`), fullPage: true })
      await context.close()
    }
    if (engine === 'chromium') {
      for (const th of THEMES) for (const dark of [false, true]) {
        const { p, context } = await open({ live: false, q: `&vista=galeria${dark ? '&theme=dark' : ''}`, vw: 1280, vh: 1400, css: th.css })
        await p.evaluate(() => window.__G.size())
        judge(`${th.name} ${dark ? 'oscuro' : 'claro'}`, await measure(p))
        if (CAPS && V === 'V3' && !dark && ['caracol-purpura', 'spotify', 'stripe'].includes(th.name)) await p.locator('.gal__grid > div').first().screenshot({ path: join(HERE, `estilo-V3-tema-${th.name}.png`) })
        await context.close()
      }
    }

    // ---------- 3. forced-colors (Chromium) ----------
    if (engine === 'chromium') {
      const { p, context } = await open({ live: false, q: '&vista=galeria', vw: 1280, vh: 1400, forcedColors: 'active' })
      const fc = await p.evaluate(() => {
        const { parse } = window.__C; const cs = (e) => getComputedStyle(e)
        const d1 = document.querySelector('.gal__panel--page .d1'); const b = d1.querySelector('.badge'); const ring = d1.querySelector('.ring')
        const act = document.querySelector('.gal__panel--page .ibtn[data-do=act]'); const foc = document.querySelector('.is-focus-demo .d1__summary'); const mk = document.querySelector('.gal__panel--page .mark')
        return { border: parseFloat(cs(d1).borderTopWidth) >= 1 && parse(cs(d1).borderTopColor)[3] > 0, badge: cs(b).outlineStyle === 'solid', ring: /canvastext|rgb\((0, 0, 0|255, 255, 255)\)/i.test(cs(ring).backgroundImage), act: parse(cs(act).borderTopColor)[3] > 0, focus: cs(foc).outlineStyle !== 'none', mark: parse(cs(mk).borderTopColor)[3] > 0 }
      })
      ok(Object.values(fc).every(Boolean), `forced-colors: cápsula, insignia, anillo, acción, foco y marca con color del sistema (${JSON.stringify(fc)})`)
      await context.close()
    }

    // ---------- 4. 320 px y 5. texto al 200 % ----------
    const fits = (p, vw) => p.evaluate((vw) => {
      const el = document.querySelector('#region .d1'); const r = el.getBoundingClientRect(); const inner = el.firstElementChild.getBoundingClientRect()
      const t = el.querySelector('.d1__text')
      return { l: Math.round(r.left), r: Math.round(r.right), sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, clip: Math.round(inner.bottom - r.bottom), textClip: el.matches('.is-peek,.is-list') && t ? t.scrollWidth - t.clientWidth : 0, ok: r.left >= 0 && r.right <= vw && document.documentElement.scrollWidth <= document.documentElement.clientWidth && inner.bottom <= r.bottom + 1 }
    }, vw)
    for (const [vw, zoom] of [[320, ''], [1100, '200%'], [640, '200%']]) {
      const { p, context } = await open({ vw, vh: 760 })
      if (zoom) await p.evaluate((z) => { document.documentElement.style.fontSize = z }, zoom)
      await p.locator('#save').click(); await p.mouse.move(2, 750); await p.waitForTimeout(800)
      const a = await fits(p, vw)
      await p.locator('#region .d1').hover(); await p.waitForTimeout(700)
      const b = await fits(p, vw)
      await p.evaluate(() => window.__S.openList()); await p.waitForTimeout(700)
      const c = await fits(p, vw)
      const tag = zoom ? `texto al 200 % a ${vw}px` : `${vw}px`
      ok(a.ok && b.ok && c.ok && b.textClip <= 1, `${tag}: línea, asomo y lista dentro del visor, sin desplazamiento horizontal ni recorte (${JSON.stringify({ a, b, c })})`)
      const small = await p.evaluate(() => [...document.querySelectorAll('#region button, #region a, #mark-save')].filter((b) => b.getClientRects().length).map((b) => b.getBoundingClientRect()).filter((r) => r.width < 24 || r.height < 24).length)
      ok(small === 0, `${tag}: dianas ≥ 24×24 (${small} pequeñas)`)
      await context.close()
    }

    // ---------- 6. Movimiento reducido ----------
    {
      const { p, context } = await open({ reducedMotion: 'reduce' })
      await p.evaluate((RT) => {
        window.__moving = []; const t0 = performance.now()
        const mo = () => {
          for (const a of document.getAnimations()) {
            const k = a.effect && a.effect.getKeyframes ? a.effect.getKeyframes() : []
            const props = new Set(k.flatMap((f) => Object.keys(f)).filter((x) => !['offset', 'easing', 'composite', 'computedOffset'].includes(x)))
            if (a.transitionProperty) props.add(a.transitionProperty)
            if ([...props].some((x) => /transform|translate|scale|rotate|clip|inline-size|block-size|width|height/i.test(x))) window.__moving.push(a.animationName || a.transitionProperty)
          }
          if (performance.now() - t0 < RT + 1500) requestAnimationFrame(mo)
        }
        requestAnimationFrame(mo)
      }, RT)
      await p.locator('#s-three').click(); await p.locator('#region .d1').hover().catch(() => {}); await p.waitForTimeout(400); await p.mouse.move(5, 740); await p.locator('#cliente').focus()
      await p.waitForTimeout(RT + 1600)
      const mv = await p.evaluate(() => [...new Set(window.__moving)])
      ok(mv.length === 0, `reducido: nada se mueve, gira ni cambia de tamaño animado (${mv.join(', ')})`)
      // el anillo se lee sin movimiento: su arco se acorta por estilo (no por animación) también con reduce
      await p.evaluate(() => { const B = window.__S.B; [...B.conds.keys()].forEach((id) => B.remove(id)) }); await p.waitForTimeout(300)
      await p.evaluate(() => window.__S.B.set('x', { type: 'info', title: 'Prueba del anillo' })); await p.waitForTimeout(300); await p.mouse.move(5, 740); await p.locator('#cliente').focus()
      const a1 = await p.evaluate(() => { const a = document.querySelector('#region .ring'); return a ? parseFloat((getComputedStyle(a).backgroundImage.match(/([\d.]+)(deg|turn)/) || [0, NaN])[1]) : null })
      await p.waitForTimeout(800)
      const a2 = await p.evaluate(() => { const a = document.querySelector('#region .ring'); return a ? parseFloat((getComputedStyle(a).backgroundImage.match(/([\d.]+)(deg|turn)/) || [0, NaN])[1]) : null })
      ok(a1 !== null && a2 < a1, `reducido: el anillo sigue diciendo el tiempo que queda sin animarse (arco ${a1} → ${a2})`)
      await context.close()
    }

    // ---------- 7. Alineación y espaciado (galería, LTR y RTL) ----------
    for (const dir of ['ltr', 'rtl']) {
      const { p, context } = await open({ live: false, q: `&vista=galeria${dir === 'rtl' ? '&dir=rtl' : ''}`, vw: 1280, vh: 1400 })
      const al = await p.evaluate((rtl) => {
        const R = (e) => e.getBoundingClientRect()
        const s = (r) => rtl ? -r.right : r.left
        const res = { concentric: 0, centred: 0, tail: 0, column: 0, endPad: true, list: 0 }
        for (const d1 of document.querySelectorAll('.gal__panel--page .d1')) {
          const o = R(d1); const b = R(d1.querySelector('.d1__row .badge')); const row = R(d1.querySelector('.d1__row'))
          const startGap = rtl ? o.right - b.right : b.left - o.left
          const topGap = b.top - o.top
          res.concentric = Math.max(res.concentric, Math.abs(startGap - topGap))
          const tx = d1.querySelector('.d1__text'); const t = R(tx)
          res.centred = Math.max(res.centred, Math.abs((t.top + t.bottom) / 2 - (b.top + b.bottom) / 2))
          const tail = d1.querySelector('.d1__tail'); if (tail) { const tr = R(tail); res.tail = Math.max(res.tail, Math.abs((tr.top + tr.bottom) / 2 - (row.top + row.bottom) / 2)); const endGap = rtl ? tr.left - o.left : o.right - tr.right; if (endGap + 0.5 < startGap) res.endPad = false }
          const textStart = s(t)
          d1.querySelectorAll('.d1__desc, .d1__acts > .ibtn[data-do=act]').forEach((e) => { if (!e.getClientRects().length) return; res.column = Math.max(res.column, Math.abs(s(R(e)) - textStart)) })
          if (d1.matches('.is-list')) d1.querySelectorAll('.item__title').forEach((e) => { res.list = Math.max(res.list, Math.abs(s(R(e)) - textStart)) })
        }
        return res
      }, dir === 'rtl')
      ok(al.concentric <= 1, `${dir}: insignia concéntrica con el extremo de la cápsula (Δ ${al.concentric.toFixed(2)}px)`)
      ok(al.centred <= 1 && al.tail <= 1, `${dir}: título y «+N»/chevrón centrados con la insignia y la fila (Δ ${al.centred.toFixed(2)} / ${al.tail.toFixed(2)}px)`)
      ok(al.column <= 1 && al.list <= 1, `${dir}: descripción, acción y títulos de la lista arrancan donde el título (Δ ${al.column.toFixed(2)} / ${al.list.toFixed(2)}px)`)
      ok(al.endPad, `${dir}: el aire del final no es menor que el del inicio`)
      await context.close()
    }

    // ---------- 8. Táctil: dianas ≥ 44 (Chromium emula pointer: coarse) ----------
    if (engine === 'chromium') {
      const { p, context } = await open({ vw: 390, vh: 800, hasTouch: true, isMobile: true })
      await p.locator('#save').click(); await p.waitForTimeout(700)
      await p.evaluate(() => window.__S.openList()); await p.waitForTimeout(700)
      const small = await p.evaluate(() => [...document.querySelectorAll('#region button, #region a, #mark-save')].filter((b) => b.getClientRects().length).map((b) => [b.dataset.do || b.className, Math.round(b.getBoundingClientRect().width), Math.round(b.getBoundingClientRect().height)]).filter(([, w, h]) => w < 44 || h < 44))
      ok(small.length === 0, `pointer: coarse: dianas ≥ 44×44 (${JSON.stringify(small)})`)
      await context.close()
    }

    total.pass += pass; total.fail += fails.length
    tally[`${engine} ${V}`] = `${pass}/${pass + fails.length}`
    const mins = data.reduce((a, d) => ({ t: Math.min(a.t, d.minT), g: Math.min(a.g, d.minG), e: Math.min(a.e, d.minE) }), { t: 99, g: 99, e: 99 })
    console.log(`${engine} ${V}: ${pass}/${pass + fails.length} · mínimos texto ${mins.t}, gráficos ${mins.g}, delimitación ${mins.e} (${data.length} temas×esquemas) · brillo ${JSON.stringify(data.flashes)}${fails.length ? '\n   - ' + fails.join('\n   - ') : ''}`)
  }
  await browser.close()
}

// Capturas de la comparativa (Chromium)
if (CAPS) {
  const browser = await pw.chromium.launch()
  const vistas = (process.env.CAPS_VISTAS || 'comparativa,cristal,propuestas,par:L1,par:L2,par:L3').split(',')
  const shots = vistas.flatMap((x) => x === 'comparativa' || x === 'cristal' ? [[x, false], [x, true]] : [[x, false]])
  for (const [vista0, dark] of shots) {
    const [vista, pv] = vista0.split(':')
    const p = await browser.newPage({ viewport: { width: vista === 'cristal' || vista === 'par' ? 1000 : 1900, height: 900 } })
    await p.goto(`${BASE}?vista=${vista}${pv ? '&v=' + pv : ''}${dark ? '&theme=dark' : ''}`)
    await p.waitForFunction(() => window.__G && window.__G.ready); await p.evaluate(() => document.fonts.ready); await p.evaluate(() => window.__G.size()); await p.waitForTimeout(100)
    await p.screenshot({ path: join(HERE, vista === 'par' ? `estilo-${pv}-claro-y-oscuro.png` : vista === 'propuestas' ? 'estilo-propuestas-claro.png' : `estilo-${vista}-${dark ? 'oscuro' : 'claro'}.png`), fullPage: true })
    await p.close()
  }
  await browser.close()
}
server.close()
console.log(`\n${Object.entries(tally).map(([k, v]) => `${k} ${v}`).join(' · ')}\nTotal: ${total.pass}/${total.pass + total.fail}`)
process.exitCode = total.fail ? 1 : 0
