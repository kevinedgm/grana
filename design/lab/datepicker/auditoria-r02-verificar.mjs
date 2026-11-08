// Auditoría de coco (paso 5) de la r02 de GDatePicker sobre el componente REAL (dist/grana.umd.js, dist/booking.umd.js,
// dist/grana.css), página design/lab/datepicker/auditoria-r02.html. Mide, en Chromium, Firefox y WebKit:
//   A · anchos: un mes ≈ 7 celdas; dos meses con el ancho de antes de la r02 (#1030: 8,5 celdas por mes, 770 px por
//       defecto; compacto 7 celdas); compacto con celda de 30 px; tema de prueba (space 5, press-scale 0,95)
//   B · Δ 0 del panel, del escenario y de la cabecera al ir días → meses → años → (Esc) meses → (Esc) días, en un mes, dos
//       meses, compacto, cómodo, en línea y en GBookingBar; rejillas 3 × 4 que llenan el escenario; cabecera sin desborde
//   C · objetivos ≥ 24 px (≥ 44 px con puntero grueso), texto ≥ 12 px, contraste (texto 4,5:1; marcas, iconos, foco y
//       huecos del año 3:1) en el tema por defecto, el de prueba y temas generados, claro y oscuro
//   D · movimiento, cuadro a cuadro (rúbrica de movimiento; requisito del usuario «sutil y suave, no brusco»): zoom de
//       nivel (nombre, press + ease-out, escala entre press-scale y su inverso, monótona, opacidad monótona, salto máximo
//       por cuadro, origen en la pieza también en RTL, una sola vista por columna, panel quieto, sin barra de
//       desplazamiento), cambio de mes sin movimiento, apertura y cierre del panel, cifras del año (solo fundido) sin
//       reiniciar la vista, interrupción (dos cambios en < 160 ms), movimiento reducido (fundido fast linear sin escala)
//   E · una sola luz al barrer meses con el puntero; foco visible con teclado; RTL (flechas, cifras LTR, franja que
//       sigue); forced-colors (Chromium); puntero grueso y hoja a 320 y 375 px (Chromium y WebKit); consola limpia
// Uso (desde la raíz del repo; ROOT = árbol cuyo packages/vue/dist se audita, por defecto este):
//   GRANA_PW_PORT=4232 node design/lab/datepicker/auditoria-r02-verificar.mjs [--root=/ruta/al/worktree] [--engines=chromium]
//   [--json=archivo]
import http from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = fileURLToPath(new URL('../../../', import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ROOT = args.root ? (args.root.endsWith('/') ? args.root : args.root + '/') : REPO
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')
const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.woff2': 'font/woff2', '.json': 'application/json' }
const server = http.createServer(async (req, res) => {
  const u = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const base = u.startsWith('/design/lab/') ? REPO : ROOT
  try {
    const p = normalize(join(base, u))
    if (!p.startsWith(base)) throw new Error('fuera')
    const body = await readFile(p)
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(body)
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(Number(process.env.GRANA_PW_PORT) || 4232, '127.0.0.1', r))
const URL0 = `http://127.0.0.1:${server.address().port}/design/lab/datepicker/auditoria-r02.html`

let pass = 0; let fail = 0; const fails = []; const notes = []; const motion = []
const ok = (cond, msg) => { if (cond) pass++; else { fail++; fails.push(msg) } }
const near = (a, b, t = 0.6) => Math.abs(a - b) <= t

// ---------- Estático ----------
const css = await readFile(join(REPO, 'packages/vue/src/components/GDatePicker/GDatePicker.css'), 'utf8')
const code = css.replace(/\/\*[\s\S]*?\*\//g, '')
ok(!/var\(--[\w-]+\s*,/.test(code), 'estático: ningún var() con respaldo')
ok(!/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|oklch\(/i.test(code), 'estático: sin colores literales')
ok(!/\d+ms\b|\d+(\.\d+)?s\b/.test(code), 'estático: sin duraciones literales')
const lits = [...code.matchAll(/(?<![\w-])(\d*\.?\d+)px/g)].map((m) => m[1] + 'px')
ok(lits.every((l) => ['24px', '44px', '16px', '0px', '1px', '0.5px', '520px'].includes(l)), `estático: literales px permitidos (${[...new Set(lits)].join(' ')})`)
ok(!/ease-spring|ease-bounce/.test(code.slice(code.indexOf('g-datepicker__view[data-zoom]'))), 'estático: zoom sin muelle ni rebote')
ok(!/@layer/.test(code), 'estático: sin @layer')
ok(/months--pair > \.g-datepicker__month \{\s*inline-size: calc\(var\(--_cell\) \* var\(--_pair-cells\)\)/.test(code), 'estático: dos meses con --_pair-cells (#1030)')

const contrast = (a, b) => {
  const lum = ([r, g, bb]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bb) }
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05)
}

// ---------- Utilidades dentro de la página ----------
const HELPERS = () => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1
  const cx = cv.getContext('2d', { willReadFrequently: true })
  const rgb = (c, under = [255, 255, 255]) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = `rgb(${under})`; cx.fillRect(0, 0, 1, 1); cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); return [...cx.getImageData(0, 0, 1, 1).data].slice(0, 3) }
  const alpha = (c) => { if (!c || c === 'transparent') return 0; cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); return cx.getImageData(0, 0, 1, 1).data[3] / 255 }
  const R = (el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height } }
  const root = (k) => document.querySelector(k === 'bb' ? '.g-booking-bar' : `#c-${k} .g-datepicker`)
  const surf = (k) => { const r = root(k); return r.querySelector('.g-datepicker__pop:popover-open .g-datepicker__surface') || r.querySelector('.g-datepicker--inline .g-datepicker__surface, .g-datepicker__surface') }
  const panel = (k) => { const s = surf(k); return s.closest('.g-datepicker__pop') || s }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))
  const settle = async (k) => { await wait(30); const p = panel(k); await Promise.all(p.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {}))); await wait(20) }
  const ms = (v) => (v.trim().endsWith('ms') ? parseFloat(v) : parseFloat(v) * 1000)
  const tok = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim()
  const scaleOf = (t) => { if (!t || t === 'none') return 1; const m = t.match(/matrix\(([^)]+)\)/); if (m) return parseFloat(m[1].split(',')[0]); const m3 = t.match(/matrix3d\(([^)]+)\)/); return m3 ? parseFloat(m3[1].split(',')[0]) : 1 }
  const boxes = (k) => {
    const p = panel(k); const s = surf(k)
    const o = root(k).getBoundingClientRect(); const Rr = (el) => { const r = R(el); return { x: r.x - o.left, y: r.y - o.top, w: r.w, h: r.h } }
    return { panel: Rr(p), stages: [...s.querySelectorAll('.g-datepicker__stage')].map(Rr), heads: [...s.querySelectorAll('.g-datepicker__head')].map(Rr), months: [...s.querySelectorAll('.g-datepicker__month')].map(Rr), pair: !!s.querySelector('.g-datepicker__months--pair'), level: (s.querySelector('.g-datepicker__view')?.className.match(/view--(\w+)/) || [])[1] }
  }
  // Muestra por cuadro durante ms milisegundos tras act(): escala y opacidad de cada vista, caja del panel, vistas por columna
  const sample = (k, act, dur = 420) => new Promise((resolve) => {
    const frames = []; const t0 = performance.now(); act()
    const tick = () => {
      const s = surf(k); const p = panel(k)
      const views = [...s.querySelectorAll('.g-datepicker__view')]
      const secs = [...s.querySelectorAll('.g-datepicker__month')]
      frames.push({
        t: performance.now() - t0,
        views: views.map((v) => { const cs = getComputedStyle(v); return { lvl: (v.className.match(/view--(\w+)/) || [])[1], s: scaleOf(cs.transform), o: parseFloat(cs.opacity), anim: cs.animationName, dur: cs.animationDuration, ease: cs.animationTimingFunction, origin: cs.transformOrigin, zoom: v.dataset.zoom || '' } }),
        perSec: secs.map((m) => m.querySelectorAll('.g-datepicker__view').length),
        panel: R(p), sw: p.scrollWidth - p.clientWidth, popO: parseFloat(getComputedStyle(p).opacity), popT: getComputedStyle(p).translate
      })
      if (performance.now() - t0 < dur) requestAnimationFrame(tick); else resolve(frames)
    }
    requestAnimationFrame(tick)
  })
  window.H = { rgb, alpha, R, root, surf, panel, wait, settle, ms, tok, boxes, sample, scaleOf }
}

async function newPage (browser, engine, opts = {}, q = '') {
  const ctx = await browser.newContext({ viewport: { width: opts.w || 1280, height: opts.h || 900 }, reducedMotion: opts.reduced ? 'reduce' : 'no-preference', ...(opts.coarse ? { hasTouch: true, isMobile: engine !== 'firefox' } : {}) })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  await page.addInitScript(HELPERS)
  await page.goto(URL0 + '?' + q)
  await page.waitForFunction(() => window.auditReady && window.H)
  await page.evaluate(() => document.fonts.ready)
  return { page, ctx, errors }
}
async function openCase (page, k) {
  await page.evaluate(async (k) => {
    const r = H.root(k)
    if (k !== 'bb' && r.classList.contains('g-datepicker--inline')) return
    const f = k === 'bb' ? r.querySelector('.g-datepicker__field, .g-booking-bar__slot button, button') : r.querySelector('.g-datepicker__field')
    f.scrollIntoView({ block: 'start' }); f.click()
    for (let i = 0; i < 40 && !r.querySelector('.g-datepicker__pop:popover-open'); i++) await H.wait(25)
    await H.settle(k)
  }, k)
}
async function closeCase (page, k) {
  for (let i = 0; i < 4; i++) {
    const open = await page.evaluate((k) => !!H.root(k).querySelector('.g-datepicker__pop:popover-open'), k)
    if (!open) return
    await page.keyboard.press('Escape'); await page.waitForTimeout(60)
  }
  await page.evaluate(async () => { await H.wait(200) })
}
const clickIn = (page, k, sel) => page.evaluate(async ([k, sel]) => { H.surf(k).querySelector(sel).click(); await H.settle(k) }, [k, sel])

const normEase = (e) => String(e).replace(/\s+/g, '').replace(/(\d*\.?\d+)/g, (n) => String(parseFloat(n)))
const sameBox = (a, b) => near(a.x, b.x) && near(a.y, b.y) && near(a.w, b.w) && near(a.h, b.h)

// ---------- Recorrido de vistas: Δ 0, rejillas, cabecera ----------
async function viewsTour (page, k, tag) {
  await openCase(page, k)
  const b0 = await page.evaluate((k) => H.boxes(k), k)
  const headOk = await page.evaluate((k) => [...H.surf(k).querySelectorAll('.g-datepicker__head')].every((h) => h.scrollWidth <= h.clientWidth + 1), k)
  ok(headOk, `${tag} ${k}: la cabecera de días no desborda`)
  await clickIn(page, k, '.g-datepicker__title-part--month')
  const b1 = await page.evaluate((k) => H.boxes(k), k)
  const grid = await page.evaluate((k) => {
    const s = H.surf(k); const t = s.querySelector('.g-datepicker__grid--months'); const st = s.querySelector('.g-datepicker__stage')
    const rows = t.querySelectorAll('tr'); const tr = H.R(t); const sr = H.R(st)
    return { rows: rows.length, cols: rows[0].children.length, dw: Math.abs(tr.w - sr.w), dh: sr.h - tr.h, sections: s.querySelectorAll('.g-datepicker__month').length }
  }, k)
  ok(grid.rows === 4 && grid.cols === 3, `${tag} ${k}: rejilla de meses 3 × 4`)
  ok(grid.dw <= 1, `${tag} ${k}: la rejilla de meses llena el ancho del escenario (Δ ${grid.dw.toFixed(1)})`)
  ok(grid.dh >= -1 && grid.dh <= 1, `${tag} ${k}: la rejilla de meses llena el alto del escenario (Δ ${grid.dh.toFixed(1)})`)
  ok(grid.sections === 1, `${tag} ${k}: una sola sección en la vista de meses`)
  await clickIn(page, k, '.g-datepicker__title-part--year')
  const b2 = await page.evaluate((k) => H.boxes(k), k)
  const yHint = await page.evaluate((k) => { const s = H.surf(k); const st = H.R(s.querySelector('.g-datepicker__stage')); const v = H.R(s.querySelector('.g-datepicker__view--years')); return v.y + v.h - (st.y + st.h) }, k)
  ok(yHint <= 0.6, `${tag} ${k}: la pista del año no alarga el escenario (sobra ${yHint.toFixed(1)} px)`)
  await page.keyboard.press('Escape'); await page.evaluate((k) => H.settle(k), k)
  const b3 = await page.evaluate((k) => H.boxes(k), k)
  await page.keyboard.press('Escape'); await page.evaluate((k) => H.settle(k), k)
  const b4 = await page.evaluate((k) => H.boxes(k), k)
  ok(b1.level === 'months' && b2.level === 'years' && b3.level === 'months' && b4.level === 'days', `${tag} ${k}: niveles ${b0.level}→${b1.level}→${b2.level}→${b3.level}→${b4.level}`)
  for (const [n, b] of [['meses', b1], ['años', b2], ['meses (Esc)', b3], ['días (Esc)', b4]]) {
    ok(sameBox(b0.panel, b.panel), `${tag} ${k}: Δ 0 del panel en ${n} (${JSON.stringify(b0.panel)} → ${JSON.stringify(b.panel)})`)
    const sx = Math.min(...b0.stages.map((s) => s.x)); const sr = Math.max(...b0.stages.map((s) => s.x + s.w))
    const tx = Math.min(...b.stages.map((s) => s.x)); const tr = Math.max(...b.stages.map((s) => s.x + s.w))
    ok(near(sx, tx) && near(sr, tr) && near(b0.stages[0].y, b.stages[0].y) && near(b0.stages[0].h, b.stages[0].h), `${tag} ${k}: Δ 0 del escenario en ${n}`)
    ok(near(b0.heads[0].y, b.heads[0].y) && near(b0.heads[0].h, b.heads[0].h), `${tag} ${k}: Δ 0 de la cabecera en ${n}`)
    ok(b.pair === b0.pair, `${tag} ${k}: months--pair se conserva en ${n}`)
  }
  await closeCase(page, k)
  return b0
}

// ---------- Contraste, objetivos y texto ----------
async function inks (page, k, tag, minTarget = 24) {
  await openCase(page, k)
  const res = await page.evaluate(async (minTarget) => {
    const k = window.__k
    const s = H.surf(k)
    const bg = H.rgb(getComputedStyle(s.closest('.g-datepicker__pop') || s).backgroundColor, H.rgb(getComputedStyle(document.body).backgroundColor))
    const surfBg = H.alpha(getComputedStyle(s).backgroundColor) > 0 ? H.rgb(getComputedStyle(s).backgroundColor, bg) : bg
    const out = { bg: surfBg, small: [], tiny: [], pairs: [] }
    const add = (name, fg, back, min) => out.pairs.push({ name, fg, back, min })
    const scan = () => {
      for (const b of s.querySelectorAll('button')) {
        const r = b.getBoundingClientRect(); if (!r.width || b.closest('[hidden]') || getComputedStyle(b).visibility === 'hidden') continue
        if (r.width < minTarget - 0.5 || r.height < minTarget - 0.5) out.small.push(`${b.className.split(' ')[0]} ${r.width.toFixed(1)}×${r.height.toFixed(1)}`)
      }
      const w = document.createTreeWalker(s, NodeFilter.SHOW_TEXT)
      for (let n; (n = w.nextNode());) { if (!n.textContent.trim()) continue; const el = n.parentElement; if (el.closest('.g-datepicker__sr, [hidden]')) continue; const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < 11.95) out.tiny.push(`${el.className} ${fs}`) }
    }
    const ringColor = (el) => { const m = getComputedStyle(el).boxShadow.match(/(rgba?\([^)]*\)|color\([^)]*\)|oklch\([^)]*\)|#[0-9a-f]+)/i); return m ? H.rgb(m[1], surfBg) : null }
    scan()
    // Días: texto, título, chevron, flechas
    const tp = s.querySelector('.g-datepicker__title-part--month')
    add('título (mes)', H.rgb(getComputedStyle(tp).color, surfBg), surfBg, 4.5)
    add('chevron del título', H.rgb(getComputedStyle(tp.querySelector('.g-icon')).color, surfBg), surfBg, 3)
    const nav = s.querySelector('.g-datepicker__nav:not([hidden])')
    add('flecha', H.rgb(getComputedStyle(nav).color, surfBg), surfBg, 3)
    const dsel = s.querySelector('.g-datepicker__day.is-selected')
    if (dsel) { const fill = H.rgb(getComputedStyle(dsel).backgroundColor, surfBg); add('día elegido (texto/relleno)', H.rgb(getComputedStyle(dsel).color, fill), fill, 4.5); add(dsel.classList.contains('is-today') ? 'día elegido y hoy (trazo/superficie)' : 'día elegido (trazo/superficie)', ringColor(dsel) || fill, surfBg, 3) }
    tp.click(); await H.settle(k); scan()
    const picks = [...s.querySelectorAll('.g-datepicker__pick')]
    const plain = picks.find((p) => !p.matches('.is-selected, .is-current, .is-disabled, .is-in-value')) || picks[0]
    add('mes (texto)', H.rgb(getComputedStyle(plain).color, surfBg), surfBg, 4.5)
    for (const p of picks) {
      const cs = getComputedStyle(p)
      if (p.classList.contains('is-selected')) {
        const fill = H.rgb(cs.backgroundColor, surfBg)
        add('mes elegido (texto/relleno)', H.rgb(cs.color, fill), fill, 4.5)
        // El primer trazo de box-shadow es el exterior: {color}-text, también con «actual» (aro on-{color} por dentro)
        const ring = ringColor(p); add(p.classList.contains('is-current') ? 'mes elegido y actual (trazo/superficie)' : 'mes elegido (trazo/superficie)', ring || fill, surfBg, 3)
      }
      if (p.classList.contains('is-current') && !p.classList.contains('is-selected')) add('mes actual (aro)', ringColor(p), surfBg, 3)
      if (p.classList.contains('is-in-value')) { const ic = p.querySelector('.g-icon'); add('punto en el valor', H.rgb(getComputedStyle(ic).color, surfBg), surfBg, 3); out.dot = !!ic }
    }
    // foco
    const f = getComputedStyle(plain); plain.focus()
    out.focusColor = H.rgb(getComputedStyle(plain).outlineColor, surfBg)
    add('anillo de foco', out.focusColor, surfBg, 3)
    s.querySelector('.g-datepicker__title-part--year').click(); await H.settle(k); scan()
    const hint = s.querySelector('.g-datepicker__years-hint > span')
    if (hint) add('pista del año', H.rgb(getComputedStyle(hint).color, surfBg), surfBg, 4.5)
    const dig = s.querySelector('.g-datepicker__typed-digit')
    if (dig) add('hueco de cifra (raya)', H.rgb(getComputedStyle(dig).borderBottomColor, surfBg), surfBg, 3)
    return out
  }, minTarget)
  for (const p of res.pairs) {
    if (!p.fg) { ok(false, `${tag} ${k}: ${p.name} sin color medible`); continue }
    const c = contrast(p.fg, p.back)
    ok(c >= p.min, `${tag} ${k}: ${p.name} ${c.toFixed(2)}:1 ≥ ${p.min}`)
    const key = `${p.name}`; const prev = MINS.get(key); if (!prev || c < prev.c) MINS.set(key, { c, where: `${tag} ${k}` })
  }
  ok(res.small.length === 0, `${tag} ${k}: objetivos ≥ ${minTarget} px (${res.small.slice(0, 4).join('; ')})`)
  ok(res.tiny.length === 0, `${tag} ${k}: texto ≥ 12 px (${res.tiny.slice(0, 4).join('; ')})`)
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape')
  await closeCase(page, k)
}
const MINS = new Map()

// ---------- Movimiento ----------
function analyseZoom (frames, dir, press, tag, k, reduced = false) {
  const vf = frames.filter((f) => f.views.length)
  const anim = vf.find((f) => f.views[0].anim !== 'none')?.views[0]
  const name = dir === 'out' ? 'g-datepicker-zoom-out' : 'g-datepicker-zoom-in'
  ok(anim && anim.anim === name, `${tag} ${k}: zoom ${dir} con ${name} (${anim && anim.anim})`)
  const scales = vf.map((f) => f.views[0].s); const ops = vf.map((f) => f.views[0].o)
  const lo = reduced ? 1 : (dir === 'out' ? 1 : press); const hi = reduced ? 1 : (dir === 'out' ? 2 - press : 1)
  ok(scales.every((s) => s >= lo - 0.002 && s <= hi + 0.002), `${tag} ${k}: escala del zoom ${dir} dentro de [${lo.toFixed(3)}, ${hi.toFixed(3)}] (mín ${Math.min(...scales).toFixed(4)}, máx ${Math.max(...scales).toFixed(4)})`)
  let mono = true; let maxDs = 0; let maxDo = 0
  for (let i = 1; i < scales.length; i++) {
    const ds = scales[i] - scales[i - 1]; maxDs = Math.max(maxDs, Math.abs(ds))
    if (dir === 'out' ? ds > 0.0005 : ds < -0.0005) mono = false
    const dO = ops[i] - ops[i - 1]; maxDo = Math.max(maxDo, dO); if (dO < -0.002) mono = false
  }
  ok(mono, `${tag} ${k}: zoom ${dir} monótono (escala hacia 1, opacidad sube), sin rebote`)
  ok(ops[ops.length - 1] > 0.999 && Math.abs(scales[scales.length - 1] - 1) < 0.0005, `${tag} ${k}: zoom ${dir} termina en reposo (opacidad 1, escala 1)`)
  ok(vf.every((f) => f.perSec.every((n) => n <= 1)), `${tag} ${k}: nunca dos vistas a la vez en una columna`)
  const p0 = vf[0].panel; ok(vf.every((f) => sameBox(f.panel, p0)), `${tag} ${k}: panel quieto durante el zoom ${dir}`)
  ok(vf.every((f) => f.sw <= 0), `${tag} ${k}: sin desplazamiento lateral durante el zoom ${dir}`)
  const moving = vf.filter((f) => f.views[0].o < 0.999)
  const last = moving.length ? moving[moving.length - 1].t : 0
  const fd = vf.length > 1 ? (vf[vf.length - 1].t - vf[0].t) / (vf.length - 1) : 16.7
  return { dir, frames: moving.length, ms: Math.round(last), maxDscale: +maxDs.toFixed(4), maxDopacity: +maxDo.toFixed(3), frameMs: +fd.toFixed(1), dur: anim && anim.dur, ease: anim && anim.ease }
}

async function motionSuite (page, k, tag, { reduced = false, rtl = false } = {}) {
  await openCase(page, k)
  const T = await page.evaluate(() => ({ press: parseFloat(H.tok('--g-press-scale')), dPress: H.ms(H.tok('--g-duration-press')), dFast: H.ms(H.tok('--g-duration-fast')), easeOut: H.tok('--g-ease-out') }))
  T.easeOut = normEase(T.easeOut)
  // Subir: días → meses (origen en el mes mostrado de la rejilla nueva)
  const fOut = await page.evaluate((k) => H.sample(k, () => H.surf(k).querySelector('.g-datepicker__title-part--month').click()), k)
  const zOut = analyseZoom(fOut, 'out', T.press, tag, k, reduced)
  const vOut = fOut.find((f) => f.views[0]?.anim !== 'none')?.views[0]
  const expD = reduced ? T.dFast : T.dPress
  ok(vOut && near(H_ms(vOut.dur), expD, 1), `${tag} ${k}: duración del zoom ${vOut && vOut.dur} = ${expD} ms`)
  ok(vOut && (reduced ? vOut.ease === 'linear' : normEase(vOut.ease) === T.easeOut), `${tag} ${k}: curva del zoom ${vOut && vOut.ease} (${reduced ? 'linear' : '--g-ease-out'})`)
  const org = await page.evaluate((k) => {
    const s = H.surf(k); const v = s.querySelector('.g-datepicker__view'); const p = s.querySelector('.g-datepicker__pick[tabindex="0"]').parentElement
    const vr = H.R(v); const pr = H.R(p); const [ox, oy] = getComputedStyle(v).transformOrigin.split(' ').map(parseFloat)
    return { dx: vr.x + ox - (pr.x + pr.w / 2), dy: vr.y + oy - (pr.y + pr.h / 2) }
  }, k)
  if (!reduced) ok(Math.abs(org.dx) <= 2 && Math.abs(org.dy) <= 2, `${tag} ${k}: origen del zoom out en el mes mostrado${rtl ? ' (RTL)' : ''} (Δ ${org.dx.toFixed(1)}, ${org.dy.toFixed(1)})`)
  // Bajar: elegir un mes → días (origen en la celda elegida, en coordenadas de página)
  const target = await page.evaluate((k) => { const p = [...H.surf(k).querySelectorAll('.g-datepicker__pick')].find((b) => b.dataset.value === '2' && b.getAttribute('aria-disabled') !== 'true') || H.surf(k).querySelector('.g-datepicker__pick:not([aria-disabled])'); const r = H.R(p.parentElement); window.__pc = { x: r.x + r.w / 2, y: r.y + r.h / 2, v: p.dataset.value }; return window.__pc }, k)
  const fIn = await page.evaluate((k) => H.sample(k, () => [...H.surf(k).querySelectorAll('.g-datepicker__pick')].find((b) => b.dataset.value === window.__pc.v).click()), k)
  const zIn = analyseZoom(fIn, 'in', T.press, tag, k, reduced)
  const orgIn = await page.evaluate(() => [...H.surf(window.__k).querySelectorAll('.g-datepicker__view')].map((v) => { const r = H.R(v); const [ox, oy] = getComputedStyle(v).transformOrigin.split(' ').map(parseFloat); return { dx: r.x + ox - window.__pc.x, dy: r.y + oy - window.__pc.y } }))
  if (!reduced) {
    const raw = `${orgIn.map((o) => `${o.dx.toFixed(1)},${o.dy.toFixed(1)}`).join(' / ')}`
    if (orgIn.length === 1) ok(Math.abs(orgIn[0].dx) <= 2 && Math.abs(orgIn[0].dy) <= 2, `${tag} ${k}: origen del zoom in en la celda elegida${rtl ? ' (RTL)' : ''} (${raw})`)
    else {
      // Dos meses: el origen por índice de bruno no cuenta la separación entre meses (hallazgo B1). Se exige que el
      // desplazamiento VISIBLE que causa (Δ origen × (1 − escala inicial)) no pase de 1,5 px y se anota el Δ bruto
      const vis = Math.max(...orgIn.map((o) => Math.hypot(o.dx, o.dy))) * (1 - T.press)
      ok(orgIn.every((o) => Math.abs(o.dy) <= 2) && vis <= 1.5, `${tag} ${k}: origen del zoom in con dos meses, error visible ${vis.toFixed(2)} px ≤ 1,5 (${raw})`)
      if (orgIn.some((o) => Math.abs(o.dx) > 2)) notes.push(`B1 ${tag} ${k}: origen del zoom in con dos meses desviado ${raw} px (visible ${vis.toFixed(2)} px)`)
    }
  }
  // Cambiar de mes: sin movimiento
  const fNav = await page.evaluate((k) => H.sample(k, () => H.surf(k).querySelector('.g-datepicker__nav--next:not([hidden])').click(), 260), k)
  ok(fNav.every((f) => f.views.every((v) => v.anim === 'none' || v.zoom === '') && f.views.every((v) => v.s === 1 && v.o === 1)), `${tag} ${k}: cambiar de mes no anima`)
  ok(fNav.every((f) => sameBox(f.panel, fNav[0].panel)), `${tag} ${k}: cambiar de mes no mueve el panel`)
  // Interrupción: dos cambios de nivel en < 160 ms
  const intr = await page.evaluate(async (k) => {
    const s = H.surf(k); s.querySelector('.g-datepicker__title-part--month').click()
    await H.wait(40); const t = s.querySelector('.g-datepicker__title-part--year'); t.click()
    await H.wait(40)
    const views = s.querySelectorAll('.g-datepicker__view'); const lvl = views[0].className.match(/view--(\w+)/)[1]
    await H.settle(k)
    const cs = getComputedStyle(s.querySelector('.g-datepicker__view'))
    return { lvl, n: views.length, focus: !!document.activeElement.closest('.g-datepicker__grid--years'), s: H.scaleOf(cs.transform), o: parseFloat(cs.opacity) }
  }, k)
  ok(intr.lvl === 'years' && intr.n === 1 && intr.focus, `${tag} ${k}: interrupción termina en años con el foco en su rejilla (${JSON.stringify(intr)})`)
  ok(intr.s === 1 && intr.o === 1, `${tag} ${k}: tras la interrupción la vista queda en reposo`)
  // Cifras del año: solo fundido; la vista no se reinicia al recolocar la página
  const before = await page.evaluate((k) => { const v = H.surf(k).querySelector('.g-datepicker__view'); window.__v = v; return true }, k)
  ok(before, 'ref')
  const digit = await page.evaluate(async (k) => {
    const s = H.surf(k); const ev = (key) => document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
    ev('1'); await H.wait(16)
    const d = s.querySelector('.g-datepicker__typed-digit'); const c0 = d ? getComputedStyle(d) : null
    const cs = c0 && { animationName: c0.animationName, animationDuration: c0.animationDuration, animationTimingFunction: c0.animationTimingFunction }
    const frames = []
    if (d) { const t0 = performance.now(); while (performance.now() - t0 < 160) { const c = getComputedStyle(d); frames.push({ s: H.scaleOf(c.transform), o: parseFloat(c.opacity) }); await new Promise((r) => requestAnimationFrame(r)) } }
    ev('9'); ev('8'); ev('5'); await H.wait(30)
    const v = s.querySelector('.g-datepicker__view')
    const running = v.getAnimations().filter((a) => a.playState === 'running').length
    const st = H.R(s.querySelector('.g-datepicker__stage'))
    const vr = H.R(v)
    const focused = document.activeElement.closest('.g-datepicker__pick')?.dataset.value
    await H.wait(1600)
    return { has: !!d, anim: cs && cs.animationName, dur: cs && cs.animationDuration, ease: cs && cs.animationTimingFunction, frames, same: v === window.__v, running, focused, over: vr.y + vr.h - (st.y + st.h) }
  }, k)
  ok(digit.has, `${tag} ${k}: la cifra escrita aparece en su hueco`)
  if (digit.has) {
    ok(digit.anim === 'g-datepicker-zoom-in' && near(H_ms(digit.dur), T.dFast, 1) && digit.ease === 'linear', `${tag} ${k}: la cifra entra con fundido fast linear (${digit.anim} ${digit.dur} ${digit.ease})`)
    ok(digit.frames.every((f) => f.s === 1), `${tag} ${k}: la cifra no escala (solo fundido)`)
  }
  ok(digit.same && digit.running === 0, `${tag} ${k}: escribir el año no reinicia ni anima la vista`)
  ok(digit.focused === '1985', `${tag} ${k}: cuatro cifras llevan el foco a 1985 (${digit.focused})`)
  ok(digit.over <= 0.6, `${tag} ${k}: con cifras, la vista no sale del escenario`)
  // Esc sube: zoom in (anotación 14.1)
  const fEsc = await page.evaluate((k) => H.sample(k, () => document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))), k)
  const zEsc = analyseZoom(fEsc, 'in', T.press, tag + ' Esc', k, reduced)
  await page.keyboard.press('Escape'); await page.evaluate((k) => H.settle(k), k)
  await closeCase(page, k)
  return { zOut, zIn, zEsc }
}
const H_ms = (v) => (String(v).trim().endsWith('ms') ? parseFloat(v) : parseFloat(v) * 1000)

async function popMotion (page, k, tag, reduced) {
  await page.evaluate((k) => { window.__k = k; H.root(k).querySelector('.g-datepicker__field').scrollIntoView({ block: 'start' }) }, k)
  const open = await page.evaluate(async (k) => {
    const r = H.root(k); const p = r.querySelector('.g-datepicker__pop'); const f = r.querySelector('.g-datepicker__field')
    const frames = []; const t0 = performance.now(); f.click()
    while (performance.now() - t0 < 300) { const cs = getComputedStyle(p); const tr = cs.translate === 'none' ? 0 : parseFloat(cs.translate.split(' ')[1] || cs.translate); frames.push({ t: performance.now() - t0, o: parseFloat(cs.opacity), ty: tr }); await new Promise((res) => requestAnimationFrame(res)) }
    const a = p.getAnimations()
    await H.settle(k)
    const t1 = performance.now(); const closing = []
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    while (performance.now() - t1 < 260) { const cs = getComputedStyle(p); closing.push({ t: performance.now() - t1, o: parseFloat(cs.opacity), ty: cs.translate, vis: p.getBoundingClientRect().width > 0 && cs.display !== 'none' }); await new Promise((res) => requestAnimationFrame(res)) }
    return { frames, closing, space1: parseFloat(H.tok('--g-space-1')) }
  }, k)
  const maxT = Math.max(...open.frames.map((f) => Math.abs(f.ty || 0)))
  const ops = open.frames.map((f) => f.o)
  let mono = true; let maxDo = 0
  for (let i = 1; i < ops.length; i++) { if (ops[i] < ops[i - 1] - 0.002) mono = false; maxDo = Math.max(maxDo, ops[i] - ops[i - 1]) }
  ok(maxT <= open.space1 + 0.1, `${tag} ${k}: la apertura se desplaza como mucho space-1 (${maxT.toFixed(2)} px)`)
  ok(mono, `${tag} ${k}: la apertura funde sin retroceso`)
  const cl = open.closing.map((f) => f.o)
  let monoC = true; for (let i = 1; i < cl.length; i++) if (cl[i] > cl[i - 1] + 0.002) monoC = false
  ok(monoC && cl[cl.length - 1] < 0.01, `${tag} ${k}: el cierre funde hasta 0 sin rebote`)
  ok(open.closing.every((f) => f.ty === 'none' || /^0px( 0px)?$/.test(f.ty)), `${tag} ${k}: el cierre no se desplaza`)
  const moving = open.frames.filter((f) => f.o < 0.999)
  return { open: { frames: moving.length, ms: Math.round(moving.length ? moving[moving.length - 1].t : 0), maxTranslate: +maxT.toFixed(2), maxDopacity: +maxDo.toFixed(3) }, close: { ms: Math.round((open.closing.find((f) => f.o < 0.01) || {}).t || 0) } }
}

// ---------- Una sola luz ----------
async function oneLight (page, k, tag) {
  await openCase(page, k)
  await clickIn(page, k, '.g-datepicker__title-part--month')
  const pts = await page.evaluate((k) => [...H.surf(k).querySelectorAll('.g-datepicker__pick')].map((p) => { const r = H.R(p); return [r.x + r.w / 2, r.y + r.h / 2] }), k)
  await page.evaluate((k) => {
    window.__light = 0; window.__run = true
    const loop = () => { const n = [...H.surf(k).querySelectorAll('.g-datepicker__pick:not(.is-selected)')].filter((p) => H.alpha(getComputedStyle(p).backgroundColor) > 0.01).length; window.__light = Math.max(window.__light, n); if (window.__run) requestAnimationFrame(loop) }
    requestAnimationFrame(loop)
  }, k)
  for (const [x, y] of pts) { await page.mouse.move(x, y, { steps: 3 }); await page.waitForTimeout(20) }
  const max = await page.evaluate(async () => { await H.wait(200); window.__run = false; return window.__light })
  ok(max <= 1, `${tag} ${k}: barrer meses con el puntero enciende como mucho una celda por cuadro (${max})`)
  await page.mouse.move(1, 1)
  await page.keyboard.press('Escape'); await closeCase(page, k)
}

// ---------- Foco visible con teclado ----------
async function focusRing (page, k, tag) {
  await openCase(page, k)
  await page.evaluate((k) => H.surf(k).querySelector('.g-datepicker__title-part--month').focus(), k)
  await page.keyboard.press('Enter'); await page.evaluate((k) => H.settle(k), k)
  const f = await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return { pick: a.classList.contains('g-datepicker__pick'), fv: a.matches(':focus-visible'), w: parseFloat(cs.outlineWidth), st: cs.outlineStyle } })
  ok(f.pick && f.fv && f.w >= 2 && f.st !== 'none', `${tag} ${k}: foco visible en la celda de mes tras Intro (${JSON.stringify(f)})`)
  await page.keyboard.press('ArrowRight')
  const g = await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return { fv: a.matches(':focus-visible'), w: parseFloat(cs.outlineWidth) } })
  ok(g.fv && g.w >= 2, `${tag} ${k}: foco visible al moverse con flechas`)
  await page.keyboard.press('Escape'); await page.evaluate((k) => H.settle(k), k)
  const t = await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return { part: a.classList.contains('g-datepicker__title-part'), w: parseFloat(cs.outlineWidth), st: cs.outlineStyle } })
  ok(t.part && t.w >= 2 && t.st !== 'none', `${tag} ${k}: Esc devuelve el foco visible al botón del título`)
  await closeCase(page, k)
}

// ---------- Ejecución ----------
const report = { engines: {} }
for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  const E = report.engines[engine] = { sizes: {}, motion: {}, pop: {} }
  const allErrors = []
  const themes = [['por defecto claro', ''], ['por defecto oscuro', 'dark=1'], ['prueba claro', 'tema=prueba'], ['prueba oscuro', 'tema=prueba&dark=1']]
  for (const [tname, q] of themes) {
    const { page, ctx, errors } = await newPage(browser, engine, {}, q)
    const tag = `[${engine} · ${tname}]`
    // A · anchos
    const sz = {}
    for (const k of ['one', 'two', 'auto', 'compact', 'compact2', 'comfortable', 'inline1', 'inline2']) {
      await openCase(page, k)
      sz[k] = await page.evaluate((k) => { const b = H.boxes(k); const c = H.surf(k).querySelector('.g-datepicker__day').getBoundingClientRect().width; return { panel: +b.panel.w.toFixed(1), months: b.months.map((m) => +m.w.toFixed(1)), cell: +c.toFixed(1), pair: b.pair } }, k)
      await closeCase(page, k)
    }
    E.sizes[tname] = sz
    const sp = await page.evaluate(() => parseFloat(H.tok('--g-space-1')))
    const cell = sp * 10
    ok(near(sz.one.cell, cell, 0.6) && sz.one.months.length === 1 && near(sz.one.months[0], cell * 7, 1), `${tag} un mes: 1 × 7 celdas (${JSON.stringify(sz.one)})`)
    for (const k of ['two', 'auto', 'inline2']) ok(sz[k].pair && sz[k].months.length === 2 && sz[k].months.every((m) => near(m, cell * 8.5, 1)), `${tag} ${k}: dos meses de 8,5 celdas, ancho de antes (${JSON.stringify(sz[k])})`)
    if (!q.includes('prueba')) ok(near(sz.two.panel, 770, 1), `${tag} dos meses: panel 770 px como antes de la r02 (${sz.two.panel})`)
    ok(near(sz.compact.cell, Math.max(24, cell * 0.75), 0.6), `${tag} compacto: celda ${sz.compact.cell} = space × 10 × 0,75`)
    ok(sz.compact2.pair && sz.compact2.months.every((m) => near(m, sz.compact.cell * 7, 1)), `${tag} compacto dos meses: 7 celdas por mes (${JSON.stringify(sz.compact2.months)})`)
    ok(near(sz.comfortable.cell, cell * 0.875, 0.6), `${tag} cómodo: celda ${sz.comfortable.cell}`)
    // B · Δ 0
    for (const k of ['one', 'two', 'compact', 'compact2', 'comfortable', 'rangeOne', 'minmax', 'inline1', 'inline2']) await viewsTour(page, k, tag)
    // C · contraste, objetivos y texto
    for (const k of ['one', 'today', 'rangeOne', 'compact', 'two']) { await page.evaluate((k) => { window.__k = k }, k); await inks(page, k, tag) }
    // D · movimiento (solo en el claro por defecto y en el de prueba: la escala depende de --g-press-scale)
    if (!q.includes('dark')) {
      for (const k of ['one', 'two', 'compact']) {
        await page.evaluate((k) => { window.__k = k }, k)
        E.motion[`${tname} ${k}`] = await motionSuite(page, k, tag)
      }
      E.pop[tname] = await popMotion(page, 'one', tag)
      await oneLight(page, 'one', tag)
      await focusRing(page, 'one', tag)
    }
    allErrors.push(...errors)
    await ctx.close()
  }
  // Movimiento reducido
  {
    const { page, ctx, errors } = await newPage(browser, engine, { reduced: true }, '')
    const tag = `[${engine} · reducido]`
    await page.evaluate(() => { window.__k = 'one' })
    E.motion.reducido = await motionSuite(page, 'one', tag, { reduced: true })
    allErrors.push(...errors); await ctx.close()
  }
  // RTL
  {
    const { page, ctx, errors } = await newPage(browser, engine, {}, 'dir=rtl')
    const tag = `[${engine} · RTL]`
    await page.evaluate(() => { window.__k = 'two' })
    E.motion.rtl = await motionSuite(page, 'two', tag, { rtl: true })
    await viewsTour(page, 'one', tag)
    await openCase(page, 'rangeOne')
    const r = await page.evaluate(() => {
      const s = H.surf('rangeOne'); const td = s.querySelector('td.is-open-end'); const cs = td && getComputedStyle(td, '::before')
      const nav = getComputedStyle(s.querySelector('.g-datepicker__nav:not([hidden]) > .g-icon')).scale
      return { open: !!td, mask: cs && (cs.maskImage || cs.webkitMaskImage), nav }
    })
    ok(r.open && /to left|270deg/.test(r.mask), `${tag} rangeOne: la franja que sigue se desvanece hacia la izquierda en RTL (${r.mask})`)
    ok(r.nav === '-1 1', `${tag}: flechas espejadas (${r.nav})`)
    await page.evaluate(async () => { const s = H.surf('rangeOne'); s.querySelector('.g-datepicker__title-part--year').click(); await H.settle('rangeOne') })
    const t = await page.evaluate(() => { const e = H.surf('rangeOne').querySelector('.g-datepicker__typed'); return e ? getComputedStyle(e).direction : null })
    ok(t === 'ltr', `${tag}: las cifras del año se escriben de izquierda a derecha (${t})`)
    await page.keyboard.press('Escape'); await closeCase(page, 'rangeOne')
    allErrors.push(...errors); await ctx.close()
  }
  // LTR: franja que sigue
  {
    const { page, ctx, errors } = await newPage(browser, engine, {}, 'case=rangeOne,two')
    await openCase(page, 'rangeOne')
    const r = await page.evaluate(() => { const td = H.surf('rangeOne').querySelector('td.is-open-end'); const cs = td && getComputedStyle(td, '::before'); return { open: !!td, mask: cs && (cs.maskImage || cs.webkitMaskImage), cap: !!H.surf('rangeOne').querySelector('td.is-open-end.is-cap-end') } })
    ok(r.open && /to right|90deg/.test(r.mask) && !r.cap, `[${engine}] rangeOne: la franja que sigue se abre a la derecha, sin extremo redondo (${r.mask})`)
    await closeCase(page, 'rangeOne')
    allErrors.push(...errors); await ctx.close()
  }
  // GBookingBar con dos meses
  {
    const { page, ctx, errors } = await newPage(browser, engine, {}, 'booking=1')
    const tag = `[${engine} · GBookingBar]`
    const opened = await page.evaluate(async () => {
      const bb = document.querySelector('.g-booking-bar'); const btn = [...bb.querySelectorAll('button')].find((b) => /qué día|Llegada/i.test(b.textContent) || b.classList.contains('g-datepicker__field'))
      btn.click(); for (let i = 0; i < 40 && !bb.querySelector('.g-datepicker__pop:popover-open'); i++) await H.wait(25)
      const pop = bb.querySelector('.g-datepicker__pop:popover-open'); if (!pop) return null
      await H.settle('bb')
      return { pair: !!pop.querySelector('.g-datepicker__months--pair'), months: [...pop.querySelectorAll('.g-datepicker__month')].map((m) => +m.getBoundingClientRect().width.toFixed(1)), panel: +pop.getBoundingClientRect().width.toFixed(1) }
    })
    E.sizes.booking = opened
    ok(opened && opened.pair && opened.months.length === 2 && opened.months.every((m) => near(m, 340, 1)), `${tag}: dos meses de 340 px como antes (${JSON.stringify(opened)})`)
    if (opened) {
      await page.evaluate(() => { const p = document.querySelector('.g-booking-bar .g-datepicker__pop:popover-open'); p.querySelector('.g-datepicker__surface').id = 'bbs'; p.closest('.g-datepicker').id = 'bbdp' })
      const r0 = await page.evaluate(() => H.R(document.querySelector('#bbdp .g-datepicker__pop')))
      await page.evaluate(async () => { document.querySelector('#bbs .g-datepicker__title-part--month').click(); await H.wait(300) })
      const r1 = await page.evaluate(() => ({ p: H.R(document.querySelector('#bbdp .g-datepicker__pop')), lvl: !!document.querySelector('#bbs .g-datepicker__grid--months') }))
      await page.evaluate(async () => { document.querySelector('#bbs .g-datepicker__title-part--year').click(); await H.wait(300) })
      const r2 = await page.evaluate(() => H.R(document.querySelector('#bbdp .g-datepicker__pop')))
      ok(r1.lvl && sameBox(r0, r1.p) && sameBox(r0, r2), `${tag}: Δ 0 del panel de dos meses en meses y años (${r0.w} → ${r1.p.w} → ${r2.w})`)
    }
    allErrors.push(...errors); await ctx.close()
  }
  // Puntero grueso: escritorio y hoja a 320 y 375 (Chromium y WebKit; Firefox no emula pointer: coarse)
  if (engine !== 'firefox') {
    for (const [w, h] of [[1280, 900], [375, 740], [320, 640]]) {
      const { page, ctx, errors } = await newPage(browser, engine, { coarse: true, w, h }, w < 1280 ? 'case=one,compact,rangeOne' : 'case=one,compact,two')
      const tag = `[${engine} · grueso ${w}]`
      const coarse = await page.evaluate(() => matchMedia('(pointer: coarse)').matches)
      ok(coarse, `${tag}: pointer: coarse emulado`)
      for (const k of ['one', 'compact']) {
        await page.evaluate((k) => { window.__k = k }, k)
        await openCase(page, k)
        const m = await page.evaluate((k) => {
          const s = H.surf(k); const p = H.panel(k)
          const cell = s.querySelector('.g-datepicker__day').getBoundingClientRect().width
          const tp = s.querySelector('.g-datepicker__title-part').getBoundingClientRect().height
          return { cell, tp, over: p.scrollWidth - p.clientWidth, monthR: Math.max(...[...s.querySelectorAll('.g-datepicker__month')].map((x) => x.getBoundingClientRect().right)), panelR: p.getBoundingClientRect().right, vw: document.documentElement.clientWidth }
        }, k)
        ok(m.cell >= 43.9 && m.tp >= 43.9, `${tag} ${k}: celda ${m.cell.toFixed(1)} y título ${m.tp.toFixed(1)} ≥ 44 px`)
        ok(m.over <= 0 && m.monthR <= m.panelR + 0.5 && m.panelR <= m.vw + 0.5, `${tag} ${k}: sin desborde lateral (sobra ${m.over}, mes ${m.monthR.toFixed(1)} / panel ${m.panelR.toFixed(1)} / visor ${m.vw})`)
        await closeCase(page, k)
        await inks(page, k, tag, 44)
      }
      if (w < 1280) await viewsTour(page, 'one', tag)
      else await viewsTour(page, 'two', tag)
      allErrors.push(...errors); await ctx.close()
    }
  } else notes.push('Firefox no emula pointer: coarse ni la hoja táctil: puntero grueso verificado en Chromium y WebKit')
  // forced-colors (solo Chromium emula)
  if (engine === 'chromium') {
    const { page, ctx, errors } = await newPage(browser, engine, {}, '')
    await page.emulateMedia({ forcedColors: 'active' })
    const tag = '[chromium · forced-colors]'
    await openCase(page, 'one'); await clickIn(page, 'one', '.g-datepicker__title-part--month')
    const fc = await page.evaluate(() => { const s = H.surf('one'); const sel = s.querySelector('.g-datepicker__pick.is-selected'); const cur = s.querySelector('.g-datepicker__pick.is-current'); const cs = getComputedStyle(sel); return { selB: parseFloat(cs.borderTopWidth), selS: cs.borderTopStyle, cur: cur ? parseFloat(getComputedStyle(cur).borderTopWidth) : null } })
    ok(fc.selB >= 2 && fc.selS === 'solid', `${tag}: mes elegido con borde (${JSON.stringify(fc)})`)
    ok(fc.cur === null || fc.cur >= 2, `${tag}: mes actual con borde`)
    await page.keyboard.press('ArrowRight')
    const fo = await page.evaluate(() => { const cs = getComputedStyle(document.activeElement); return { w: parseFloat(cs.outlineWidth), st: cs.outlineStyle } })
    ok(fo.w >= 2 && fo.st !== 'none', `${tag}: foco visible en meses`)
    await page.keyboard.press('Escape'); await closeCase(page, 'one')
    await openCase(page, 'rangeOne')
    const fm = await page.evaluate(() => { const td = H.surf('rangeOne').querySelector('td.is-open-end'); return td ? getComputedStyle(td, '::before').maskImage : 'sin celda' })
    ok(fm === 'none', `${tag}: la franja que sigue sin desvanecido (${fm})`)
    await closeCase(page, 'rangeOne')
    allErrors.push(...errors); await ctx.close()
  } else notes.push(`${engine}: forced-colors no se emula; verificado en Chromium`)
  // Temas generados (contraste en claro y oscuro)
  for (const th of ['notion', 'spotify', 'caracol-purpura']) {
    for (const dark of [false, true]) {
      const { page, ctx, errors } = await newPage(browser, engine, {}, `case=one,today,rangeOne&theme=${th}${dark ? '&dark=1' : ''}`)
      for (const k of ['one', 'today', 'rangeOne']) { await page.evaluate((k) => { window.__k = k }, k); await inks(page, k, `[${engine} · ${th}${dark ? ' oscuro' : ''}]`) }
      allErrors.push(...errors); await ctx.close()
    }
  }
  ok(allErrors.length === 0, `[${engine}] consola limpia (${allErrors.slice(0, 3).join(' | ')})`)
  await browser.close()
  console.log(`${engine}: ${pass} ok, ${fail} fallos hasta aquí`)
}
server.close()
report.mins = Object.fromEntries([...MINS].map(([k, v]) => [k, { c: +v.c.toFixed(2), where: v.where }]))
report.pass = pass; report.fail = fail; report.fails = fails; report.notes = notes
if (args.json) await writeFile(args.json, JSON.stringify(report, null, 2))
console.log(JSON.stringify({ mins: report.mins, motion: Object.fromEntries(Object.entries(report.engines).map(([e, v]) => [e, { motion: v.motion, pop: v.pop }])) }, null, 1))
for (const f of fails) console.log('FALLO', f)
for (const n of notes) console.log('NOTA', n)
console.log(`\n${pass}/${pass + fail} comprobaciones`)
process.exit(fail ? 1 : 0)
