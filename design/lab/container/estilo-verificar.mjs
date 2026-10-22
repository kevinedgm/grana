// Verificación de coco sobre el banco de GContainer (design/lab/container/estilo-banco.html), con el CSS real de
// GContainer.css (y GStack.css, GSection.css, GPageHeader.css de src/) en la capa grana.components y GSurface real de dist/.
// Mide: análisis estático (literales, respaldos, @property, sin pintura); los siete anchos en seis visores (LTR y RTL) contra
// la fórmula del contrato; margen continuo (sin escalones) y los cuatro gutter; anidado y anfitrionas sin acumular;
// horizontal start; B · sangrado (banda al borde con el contenido en la columna, profunda, zona de marca, desplazable alineado
// en reposo y al final, g-bleed-raw, receta del relleno propio, publicado en un descendiente profundo); A · prose y reading
// (medida en ch de la fuente, exclusiones, primitivas transparentes, texto al 200 %); --g-container-max (gana a width, no
// hereda); ancho intrínseco en padres que se ajustan (#562); lo fijo y lo pegado dentro (#724); reflujo a 320×256; otro
// space; los once temas generados (claro y oscuro); consola limpia.
// Ejecutar desde la raíz del repo (requiere dist/):  GRANA_PW_PORT=4212 node design/lab/container/estilo-verificar.mjs
// Opcional: --engines=chromium,firefox,webkit  --themes=all|base  --verbose
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')
const V = !!args.verbose
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const server = http.createServer(async (req, res) => {
  try {
    const p = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!p.startsWith(ROOT)) throw new Error('fuera')
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(await readFile(p))
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(Number(process.env.GRANA_PW_PORT) || 4212, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/container/estilo-banco.html`
const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify', 'stripe']
const THEMES = args.themes === 'base' ? [] : GEN

let total = 0, failed = 0
const fails = [], notes = []
const ok = (cond, msg, info = '') => { total++; if (!cond) { failed++; fails.push(msg + (info !== '' ? ' · ' + info : '')) } else if (V) console.log('ok   ' + msg + (info !== '' ? ' · ' + info : '')) }
const note = (s) => { notes.push(s); if (V) console.log('nota ' + s) }
const near = (a, b, t = 1) => Math.abs(a - b) <= t
const clamp = (lo, v, hi) => Math.min(hi, Math.max(lo, v))

/* ---------- 0 · Análisis estático ---------- */
{
  const raw = await readFile(join(ROOT, 'packages/vue/src/components/GContainer/GContainer.css'), 'utf8')
  const css = raw.replace(/\/\*[\s\S]*?\*\//g, '')
  ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb|color|color-mix)\(/.test(css), 'estático: sin color literal')
  ok(!/(?:^|[;{\s])(?:color|background(?:-color)?|border(?:-[\w-]+)?|outline(?:-[\w-]+)?|box-shadow|border-radius)\s*:/.test(css), 'estático: sin pintura (fondo, borde, radio, sombra, color)')
  ok(!/var\(\s*--[\w-]+\s*,/.test(css), 'estático: var() sin respaldo')
  ok(!/@layer/.test(css) && !/!important/.test(css), 'estático: sin @layer ni !important')
  const vars = [...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])
  ok(vars.every((v) => v.startsWith('--g-') || v.startsWith('--_')), 'estático: solo --g-* y --_*')
  const pub = ['--g-container-max', '--g-container-inset-start', '--g-container-inset-end']
  const extra = [...new Set(vars.filter((v) => v.startsWith('--g-') && !pub.includes(v) && !['--g-space-1', '--g-space-3', '--g-space-4', '--g-space-6', '--g-space-12', '--g-space-16'].includes(v)))]
  ok(!extra.length, 'estático: solo los tokens de §50 (--g-space-1, -3, -4, -6, -12, -16)', extra.join(','))
  const defaults = await readFile(join(ROOT, 'packages/vue/src/styles/defaults.css'), 'utf8')
  ok(pub.every((v) => !new RegExp(v + '\\s*:').test(defaults)), 'estático: las propiedades públicas no son del tema (no en defaults.css)')
  const props = [...css.matchAll(/@property\s+(--[\w-]+)\s*\{([^}]*)\}/g)].map((m) => [m[1], m[2].replace(/\s+/g, ' ').trim()])
  const want = { '--g-container-max': 'syntax: "<length>"; inherits: false; initial-value: 0px;', '--g-container-inset-start': 'syntax: "<length>"; inherits: true; initial-value: 0px;', '--g-container-inset-end': 'syntax: "<length>"; inherits: true; initial-value: 0px;', '--_container-gutter': 'syntax: "<length>"; inherits: false; initial-value: 0px;', '--_container-measure': 'syntax: "<length>"; inherits: true; initial-value: 0px;' }
  ok(props.length === 5 && props.every(([n, b]) => want[n] === b), 'estático: las cinco @property del contrato con su sintaxis', props.map((p) => p[0]).join(','))
  const noProps = css.replace(/@property[^}]*\}/g, '')
  const lens = [...noProps.matchAll(/(?<![\w-])(\d*\.?\d+)(px|rem|em|vh|vw|svh|dvh|ms|s|ch|cqi|%)(?![\w-])/g)].map((m) => m[1] + m[2])
  ok(lens.every((l) => ['66ch', '100cqi', '2cqi', '4cqi', '6cqi'].includes(l)), 'estático: literales de unidad solo cqi y 66ch (#717)', [...new Set(lens)].join(','))
  ok(/container-type: inline-size/.test(css) && /contain-intrinsic-inline-size/.test(css) && !/contain:/.test(css), 'estático: container-type inline-size con su intrínseco, sin contain de layout/paint (#562, #724)')
  ok(/\.g-container__body :where\(\.g-bleed, \.g-bleed-raw\)/.test(css) && /\.g-container__body :where\(\.g-bleed\)/.test(css), 'estático: g-bleed y g-bleed-raw con especificidad baja')
  ok(/:where\(\.g-container__body, \.g-surface, \.g-dialog__body\)/.test(css), 'estático: mapa de anfitrionas de contrato (L5)')
  ok(!/transition|animation/.test(css), 'estático: sin movimiento')
}

async function open (b, qs = '', opts = {}) {
  const { vw = 1440, vh = 900, ...ctx } = opts
  const context = await b.newContext({ viewport: { width: vw, height: vh }, ...ctx })
  const p = await context.newPage()
  const errs = []
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !/fonts\.css|404/.test(m.text())) errs.push(m.text()) })
  p.on('pageerror', (e) => errs.push(String(e)))
  await p.goto(BASE + qs)
  await p.waitForFunction(() => window.__ct && window.__ct.ready)
  await p.evaluate(() => document.fonts.ready)
  await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 120)))))
  p.__errs = errs
  p.__ctx = context
  return p
}
const close = async (p, label) => { ok(p.__errs.length === 0, `${p.__eng} consola limpia (${label})`, p.__errs.slice(0, 2).join(' | ')); await p.__ctx.close() }
const R = (p, sel) => p.evaluate((sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, w: r.width, t: r.top, b: r.bottom } }, sel)
const overflowX = (p) => p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
// 66ch de la fuente de una columna (sonda dentro de la columna)
const ch66 = (p, sel) => p.evaluate((sel) => { const d = document.createElement('div'); d.style.inlineSize = '66ch'; document.querySelector(sel).appendChild(d); const w = d.getBoundingClientRect().width; d.remove(); return w }, sel)

const WIDTHS = { sm: 160, md: 192, lg: 256, xl: 320, '2xl': 384 }
for (const eng of ENGINES) {
  const b = await pw[eng].launch()
  const O = async (qs, opts) => { const p = await open(b, qs, opts); p.__eng = eng; return p }
  const E = (m) => `${eng} ${m}`

  /* ---------- 1 · Anchos × visores, LTR y RTL ---------- */
  for (const dir of ['ltr', 'rtl']) {
    for (const vw of [320, 390, 768, 1024, 1440, 1920]) {
      const p = await O(`?s=widths${dir === 'rtl' ? '&dir=rtl' : ''}`, { vw })
      const box = (await R(p, '#w-lg')).w
      const g = clamp(16, 0.04 * box, 48)
      let bad = []
      for (const w of ['sm', 'md', 'lg', 'xl', '2xl', 'full', 'reading']) {
        const root = await R(p, `#w-${w}`), body = await R(p, `#w-${w} > .g-container__body`)
        const max = w === 'full' ? Infinity : w === 'reading' ? await ch66(p, `#w-${w} > .g-container__body`) : WIDTHS[w] * 4
        const col = Math.min(box - 2 * g, max)
        const lead = dir === 'rtl' ? root.r - body.r : body.l - root.l
        const ins = await p.evaluate((s) => { const cs = getComputedStyle(document.querySelector(s)); return [parseFloat(cs.getPropertyValue('--g-container-inset-start')), parseFloat(cs.getPropertyValue('--g-container-inset-end'))] }, `#w-${w} .probe`)
        if (!near(body.w, col) || !near(lead, (box - col) / 2) || !near(ins[0], lead) || !near(ins[1], (box - col) / 2)) bad.push(`${w}: ${body.w.toFixed(1)}/${col.toFixed(1)} lead ${lead.toFixed(1)} ins ${ins.map((v) => v.toFixed(1))}`)
      }
      ok(!bad.length, E(`${dir} ${vw}: los siete anchos = min(caja − 2 × margen, máximo), centrados, publicados = reales`), bad.join(' | '))
      for (const [gname, lo, k, hi] of [['none', 0, 0, 0], ['sm', 12, 0.02, 24], ['md', 16, 0.04, 48], ['lg', 24, 0.06, 64]]) {
        const body = await R(p, `#g-${gname} > .g-container__body`)
        const want = gname === 'none' ? 0 : clamp(lo, k * box, hi)
        ok(near(dir === 'rtl' ? box - body.r : body.l, want), E(`${dir} ${vw}: gutter ${gname} = ${want.toFixed(1)}`), `${body.l.toFixed(1)}`)
      }
      ok(!(await overflowX(p)), E(`${dir} ${vw}: sin desplazamiento horizontal`))
      await close(p, `anchos ${dir} ${vw}`)
    }
  }
  // Margen continuo: sin escalones entre 500 y 1100
  {
    const p = await O('?s=widths', { vw: 500 })
    const steps = []
    for (const w of [500, 600, 700, 800, 900, 1000, 1100]) {
      await p.setViewportSize({ width: w, height: 800 }); await p.waitForTimeout(40)
      steps.push(+((await R(p, '#g-md > .g-container__body')).l).toFixed(2))
    }
    const d = steps.slice(1).map((v, i) => +(v - steps[i]).toFixed(2))
    ok(d.every((x) => near(x, 4, 0.05)), E('margen md continuo: +4 px por cada 100 px de caja (4cqi), sin escalones'), steps.join(','))
    await close(p, 'continuo')
  }

  /* ---------- 2 · Anidado y anfitrionas ---------- */
  {
    const p = await O('?s=nested')
    const ob = await R(p, '#outer > .g-container__body'), ib = await R(p, '#inner > .g-container__body'), ir = await R(p, '#inner')
    ok(near(ir.l, ob.l) && near(ir.w, ob.w) && near(ib.w, 640) && near(ib.l, ob.l + (ob.w - 640) / 2), E('anidado: la caja interior es la columna y auto no añade margen'), `${ib.l}/${ib.w}`)
    const sm = await R(p, '#inner-sm > .g-container__body')
    ok(near(sm.l - ob.l, clamp(12, 0.02 * ob.w, 24)), E('anidado con gutter sm explícito: gana'), `${sm.l - ob.l}`)
    const surfPad = await p.evaluate(() => parseFloat(getComputedStyle(document.getElementById('surf')).paddingLeft) + parseFloat(getComputedStyle(document.getElementById('surf')).borderLeftWidth))
    const sr = await R(p, '#surf'), sb = await R(p, '#in-surf > .g-container__body')
    ok(near(sb.l, sr.l + surfPad) && near(sb.r, sr.r - surfPad), E('dentro de GSurface: el contenedor empieza en el relleno de la superficie (Δ0)'), `${sb.l}/${sr.l + surfPad}`)
    await close(p, 'anidado')
  }

  /* ---------- 3 · horizontal start ---------- */
  for (const dir of ['ltr', 'rtl']) {
    const p = await O(`?s=start${dir === 'rtl' ? '&dir=rtl' : ''}`)
    const r = await R(p, '#st'), b2 = await R(p, '#st > .g-container__body')
    const lead = dir === 'rtl' ? r.r - b2.r : b2.l - r.l
    ok(near(lead, 48) && near(b2.w, 640), E(`${dir}: start pone el margen al inicio lógico y el sobrante al final`), `${lead}`)
    const ins = await p.evaluate(() => { const cs = getComputedStyle(document.getElementById('st-probe')); return [parseFloat(cs.getPropertyValue('--g-container-inset-start')), parseFloat(cs.getPropertyValue('--g-container-inset-end'))] })
    ok(near(ins[0], 48) && near(ins[1], 1440 - 48 - 640), E(`${dir}: start publica sus márgenes`), ins.join(','))
    const f = await R(p, '#st-full > .g-container__body')
    ok(near(f.w, 1344), E(`${dir}: start con full no tiene efecto`))
    await close(p, `start ${dir}`)
  }

  /* ---------- 4 · B · Sangrado ---------- */
  for (const dir of ['ltr', 'rtl']) {
    for (const vw of [390, 1440]) {
      const p = await O(`?s=bleed${dir === 'rtl' ? '&dir=rtl' : ''}`, { vw })
      const root = await R(p, '#bl'), body = await R(p, '#bl > .g-container__body')
      for (const id of ['band', 'deep-band', 'zone-band', 'scroller', 'raw', 'own-pad']) {
        const e = await R(p, '#' + id)
        ok(near(e.l, root.l) && near(e.r, root.r), E(`${dir} ${vw}: ${id} llega a los bordes de la caja`), `${e.l}/${e.r}`)
      }
      for (const id of ['band-h', 'deep-h', 'zone-h']) {
        const e = await R(p, '#' + id)
        ok(near(e.l, body.l) && near(e.r, body.r), E(`${dir} ${vw}: el contenido de ${id.replace('-h', '')} sigue en la columna`), `${e.l}/${body.l}`)
      }
      const own = await R(p, '#own-h')
      ok(near(own.l, body.l + 16) && near(own.r, body.r - 16), E(`${dir} ${vw}: receta del relleno propio (publicado + el suyo)`), `${own.l}`)
      const deepIns = await p.evaluate(() => parseFloat(getComputedStyle(document.getElementById('deep-h')).getPropertyValue('--g-container-inset-start')))
      ok(near(deepIns, dir === 'rtl' ? root.r - body.r : body.l - root.l), E(`${dir} ${vw}: margen publicado en un descendiente profundo = real`), `${deepIns}`)
      const zb = await p.evaluate(() => [getComputedStyle(document.getElementById('zone-band')).backgroundColor, getComputedStyle(document.body).backgroundColor])
      ok(zb[0] !== zb[1], E(`${dir} ${vw}: zona de marca de borde a borde en la banda`), zb.join(' / '))
      // Desplazable: alineado en reposo y al final
      const cells = await p.evaluate(() => { const s = document.getElementById('scroller'); const td = s.querySelectorAll('td'); s.scrollLeft = 0; const a = td[0].getBoundingClientRect(); const rtl = getComputedStyle(s).direction === 'rtl'; s.scrollLeft = rtl ? -s.scrollWidth : s.scrollWidth; const z = td[td.length - 1].getBoundingClientRect(); return { a0l: a.left, a0r: a.right, zl: z.left, zr: z.right } })
      // Al final, ±2 px: WebKit desplaza a píxel entero y el ancho de las celdas es fraccionario (límite del motor, no del CSS)
      if (dir === 'ltr') ok(near(cells.a0l, body.l) && near(cells.zr, body.r, 2), E(`${vw}: desplazable alineado con el texto en reposo y con el final de la columna al final`), JSON.stringify(cells))
      else ok(near(cells.a0r, body.r) && near(cells.zl, body.l, 2), E(`rtl ${vw}: desplazable alineado en reposo y al final`), JSON.stringify(cells))
      ok(!(await overflowX(p)), E(`${dir} ${vw}: el sangrado no crea desplazamiento horizontal`))
      await close(p, `bleed ${dir} ${vw}`)
    }
  }

  /* ---------- 5 · A · prose y reading ---------- */
  {
    const p = await O('?s=prose')
    const m = await ch66(p, '#pr > .g-container__body')
    const body = await R(p, '#pr > .g-container__body')
    for (const id of ['pr-h2', 'pr-p', 'pr-ul', 'pr-sp', 'pr-secp', 'pr-bandp', 'pr-big']) {
      const e = await R(p, '#' + id)
      ok(near(e.w, m) && near(e.l, body.l), E(`prose: #${id} en la medida (${m.toFixed(0)} = 66ch), alineado al inicio`), `${e.w}`)
    }
    for (const id of ['pr-tp', 'pr-wide', 'pr-wide-self', 'pr-surfp', 'pr-probe']) {
      const e = await R(p, '#' + id)
      ok(e.w > m + 50, E(`prose: #${id} fuera de la medida (tabla, g-wide, componente, lo no prosa)`), `${e.w}`)
    }
    const spec = await p.evaluate(() => { const e = document.getElementById('pr-p'); e.style.cssText = ''; const s = document.createElement('style'); s.textContent = '#pr p.lab-wide-test { max-inline-size: none }'; document.head.appendChild(s); e.classList.add('lab-wide-test'); const w = e.getBoundingClientRect().width; e.classList.remove('lab-wide-test'); s.remove(); return w })
    ok(spec > m + 50, E('prose: cualquier regla de la aplicación gana (especificidad 0)'), `${spec}`)
    const rd = await R(p, '#rd > .g-container__body'), rm = await ch66(p, '#rd > .g-container__body')
    ok(near(rd.w, rm), E('reading: la columna = 66ch de su fuente'), `${rd.w}/${rm}`)
    await close(p, 'prose')
    // Texto al 200 %: sigue en caracteres y nunca pasa la columna
    const q = await O('?s=prose')
    await q.addStyleTag({ content: ':root { font-size: 200% } body { font-size: var(--g-text-body-size) }' })
    await q.waitForTimeout(100)
    const rd2 = await R(q, '#rd > .g-container__body'), rm2 = await ch66(q, '#rd > .g-container__body'), root2 = await R(q, '#rd')
    const g2 = clamp(16, 0.04 * root2.w, 48)
    ok(near(rd2.w, Math.min(rm2, root2.w - 2 * g2)) && rm2 > rm * 1.8, E('texto al 200 %: la medida crece con el texto y se queda en la columna'), `${rd2.w}/${rm2}`)
    ok(!(await overflowX(q)), E('texto al 200 %: sin desbordar'))
    await close(q, 'prose 200')
  }

  /* ---------- 6 · --g-container-max ---------- */
  {
    const p = await O('?s=max')
    const b1 = await R(p, '#mx > .g-container__body'), b2 = await R(p, '#mx-full > .g-container__body')
    ok(near(b1.w, 600) && near(b1.l, (1440 - 600) / 2) && near(b2.w, 600), E('--g-container-max gana a width (también a full)'), `${b1.w}/${b2.w}`)
    const inh = await p.evaluate(() => getComputedStyle(document.getElementById('mx-in')).getPropertyValue('--g-container-max').trim())
    ok(inh === '0px', E('--g-container-max no pasa al contenedor anidado'), inh)
    await close(p, 'max')
  }

  /* ---------- 7 · Ancho intrínseco (#562) ---------- */
  {
    const p = await O('?s=intrinsic')
    const m = await p.evaluate(() => { const d = document.createElement('div'); d.style.inlineSize = '66ch'; document.getElementById('in-rd').appendChild(d); const w = d.getBoundingClientRect().width; d.remove(); return w })
    const want = { 'in-lg': 1024, 'in-sm': 640, 'in-rd': m, 'in-full': 1024, 'in-mx': 600, 'in-cell': 640, 'in-flex': 768 }
    for (const [id, w] of Object.entries(want)) {
      const r = await R(p, '#' + id)
      ok(near(r.w, w), E(`intrínseco: #${id} en un padre que se ajusta mide ${w.toFixed(0)}, no 0`), `${r.w}`)
    }
    await close(p, 'intrinsic')
  }

  /* ---------- 8 · Lo fijo y lo pegado dentro (#724) ---------- */
  {
    const p = await O('?s=sticky', { vh: 600 })
    await p.evaluate(() => { const e = document.getElementById('sk'); window.scrollTo(0, e.getBoundingClientRect().top + scrollY + 400) })
    await p.waitForTimeout(120)
    const f = await R(p, '#sk-fixed'), s = await R(p, '#sk-sticky')
    ok(near(f.b, 600) && near(f.r, 1440), E('un fijo dentro sigue pegado al visor'), `${f.b}/${f.r}`)
    ok(near(s.t, 0), E('un pegado dentro se pega'), `${s.t}`)
    await close(p, 'sticky')
  }

  /* ---------- 9 · Reflujo a 320 × 256 y otro space ---------- */
  {
    const p = await O('?s=reflow', { vw: 320, vh: 256 })
    ok(!(await overflowX(p)), E('320×256: sin desplazamiento horizontal'))
    const u = await R(p, '#rf-url'), ub = await R(p, '#rf > .g-container__body')
    ok(u.r <= ub.r + 0.5, E('320×256: una URL larga se parte dentro de la columna'), `${u.r}/${ub.r}`)
    await close(p, 'reflow')
    const pb = await O('?s=bleed', { vw: 320, vh: 256 })
    ok(!(await overflowX(pb)), E('320×256: bandas y desplazable sin desplazamiento horizontal de página'))
    await close(pb, 'reflow bleed')
    const q = await O('?s=widths&space=5', { vw: 1920 })
    const lg = await R(q, '#w-lg > .g-container__body'), sm = await R(q, '#w-sm > .g-container__body'), gm = await R(q, '#g-md > .g-container__body')
    ok(near(lg.w, 1280) && near(sm.w, 800) && near(gm.l, 60), E('space 5: anchos y márgenes siguen a space (lg 1280, sm 800, margen md 60)'), `${lg.w}/${sm.w}/${gm.l}`)
    await close(q, 'space5')
  }

  /* ---------- 10 · Temas: la medida sigue a la fuente; nada pintado ---------- */
  for (const t of THEMES) {
    for (const dark of [false, true]) {
      const p = await O(`?theme=${t}${dark ? '&dark=1' : ''}`)
      const rd = await R(p, '#rd > .g-container__body'), m = await ch66(p, '#rd > .g-container__body')
      const lg = await R(p, '#w-lg > .g-container__body')
      const band = await R(p, '#band'), root = await R(p, '#bl'), h = await R(p, '#band-h'), body = await R(p, '#bl > .g-container__body')
      const paint = await p.evaluate(() => { const e = document.querySelector('#w-lg'); const b = e.firstElementChild; return [getComputedStyle(e).backgroundColor, getComputedStyle(b).backgroundColor, getComputedStyle(e).borderTopWidth] })
      ok(near(rd.w, m) && near(lg.w, 1024) && near(band.l, root.l) && near(h.l, body.l) && paint[0] === 'rgba(0, 0, 0, 0)' && paint[1] === 'rgba(0, 0, 0, 0)' && paint[2] === '0px', E(`tema ${t}${dark ? ' oscuro' : ''}: medida = 66ch de su fuente, lg 1024, sangrado alineado, sin pintura`), `${rd.w}/${m}`)
      await close(p, `tema ${t}${dark ? ' oscuro' : ''}`)
    }
  }
  await b.close()
}

server.close()
for (const n of notes) console.log('· ' + n)
for (const f of fails) console.log('FALLA ' + f)
console.log(`\nGContainer · estilo: ${total - failed}/${total} (${ENGINES.join(', ')}; temas: defecto + ${THEMES.length} × claro/oscuro)`)
process.exit(failed ? 1 : 0)
