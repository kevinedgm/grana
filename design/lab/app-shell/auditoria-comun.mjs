// Utilidades compartidas de la auditoría de coco (paso 5) de GAppShell, GContainer, GStack y GSection.
// Las importan design/lab/{app-shell,container,stack,section}/auditoria-verificar.mjs. Sirve la raíz del repo en el puerto
// GRANA_PW_PORT (4215 por defecto), desvía unpkg.com/vue a node_modules (sin red ni versiones que cambien), inyecta un tema
// generado sin capa después de grana.css (gana, como el tema de una aplicación) y mide contraste en la página.
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'

export const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
export const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
export const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
export const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')
const V = !!args.verbose
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png' }

let server
export async function serve () {
  server = http.createServer(async (req, res) => {
    try {
      const p = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
      if (!p.startsWith(ROOT)) throw new Error('fuera')
      res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' }).end(await readFile(p))
    } catch { if (!res.headersSent) res.writeHead(404).end() }
  })
  await new Promise((r) => server.listen(Number(process.env.GRANA_PW_PORT) || 4215, '127.0.0.1', r))
  return `http://127.0.0.1:${server.address().port}`
}
export const stop = () => new Promise((r) => server.close(r))

// Temas: '' = por defecto; los generados de Dark Color Presence; «prueba» = space 5, títulos serif, borde 2 px (tema de
// la aplicación sin capa: cambia el ritmo, la tipografía de los títulos y el grosor de las líneas).
export const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify', 'stripe']
export const PRUEBA = ':root{--g-space-1:5px;--g-space-2:10px;--g-space-3:15px;--g-space-4:20px;--g-space-5:25px;--g-space-6:30px;--g-space-8:40px;--g-space-12:60px;--g-space-16:80px;--g-font-title:Georgia,"Times New Roman",serif;--g-border-width:2px}'
export const SERIF = ':root{--g-font-title:Georgia,"Times New Roman",serif}'

let total = 0, failed = 0, cur = '—'
const fails = [], notes = [], per = {}
// Motor en curso (para el recuento por motor del informe)
export const setEngine = (e) => { cur = e }
export const ok = (cond, msg, info = '') => { total++; per[cur] ||= [0, 0]; per[cur][0]++; if (!cond) per[cur][1]++; if (!cond) { failed++; fails.push(msg + (info !== '' ? ' · ' + info : '')) } else if (V) console.log('ok   ' + msg + (info !== '' ? ' · ' + info : '')) }
export const note = (s) => { notes.push(s); if (V) console.log('nota ' + s) }
export const near = (a, b, t = 1.5) => Math.abs(a - b) <= t
export const counts = () => ({ total, failed })
export function report (label) {
  for (const n of notes) console.log('nota ' + n)
  for (const f of fails) console.log('FALLA ' + f)
  for (const [e, [t, f]] of Object.entries(per)) console.log(`${label} · ${e}: ${t - f}/${t}`)
  console.log(`${label}: ${total - failed}/${total}`)
  return failed
}

// Tema derivado AHORA por @grana/cli desde design/lab/tema-oscuro/dark-color-presence/themes/<nombre>.json ('cli:<nombre>'):
// los CSS de generated/ son anteriores a la zona de marca (#620 a #625) y no traen --g-color-brand-zone; el CLI actual sí.
let cliDir
const cliCache = new Map()
export function cliTheme (name) {
  if (cliCache.has(name)) return cliCache.get(name)
  cliDir ||= mkdtempSync(join(tmpdir(), 'grana-audit-'))
  const out = join(cliDir, `${name}.css`)
  execFileSync('node', [join(ROOT, 'packages/cli/bin/grana.mjs'), 'theme', join(ROOT, `design/lab/tema-oscuro/dark-color-presence/themes/${name}.json`), '--out', out], { stdio: 'ignore' })
  cliCache.set(name, out)
  return out
}

// Abre una página con tema opcional (nombre generado, 'prueba' o CSS en línea) y oscuro opcional
export async function open (browser, url, { vw = 1440, vh = 900, theme = '', dark = false, ready, wait = 350, ...ctx } = {}) {
  const context = await browser.newContext({ viewport: { width: vw, height: vh }, ...ctx })
  await context.route(/unpkg\.com\/vue@3\/dist\/vue\.global\.js/, (r) => r.fulfill({ path: join(ROOT, 'node_modules/vue/dist/vue.global.prod.js'), contentType: 'text/javascript' }))
  const p = await context.newPage()
  const errs = []
  p.on('console', (m) => { const t = m.text(); if (m.type() === 'error' && !/favicon|fonts\.css|404/.test(t)) errs.push(t); else if (m.type() === 'warning' && /\[Vue warn\]|\[Grana /.test(t)) errs.push(t) })
  p.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(String(e))) errs.push(String(e)) })
  await p.goto(url)
  if (dark) await p.evaluate(() => { document.documentElement.dataset.theme = 'dark' })
  if (theme) {
    if (theme === 'prueba') await p.addStyleTag({ content: PRUEBA })
    else if (theme === 'serif') await p.addStyleTag({ content: SERIF })
    else if (theme.startsWith(':root')) await p.addStyleTag({ content: theme })
    else if (theme.startsWith('cli:')) await p.addStyleTag({ path: cliTheme(theme.slice(4)) })
    else await p.addStyleTag({ path: join(ROOT, `design/lab/tema-oscuro/dark-color-presence/generated/${theme}.css`) })
  }
  if (ready) await p.waitForFunction(ready)
  await p.evaluate(() => document.fonts.ready)
  await settle(p, wait)
  await p.evaluate(CONTRAST)
  p.__errs = errs
  p.__ctx = context
  return p
}
export const close = async (p, label) => { ok(p.__errs.length === 0, `consola limpia (${label})`, p.__errs.slice(0, 2).join(' | ')); await p.__ctx.close() }
export const settle = (p, ms = 60) => p.evaluate((ms) => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, ms)))), ms)
export const rect = (p, sel) => p.evaluate((sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height } }, sel)
export const cssv = (p, sel, name) => p.evaluate(([sel, name]) => { const e = document.querySelector(sel); return e ? getComputedStyle(e).getPropertyValue(name).trim() : null }, [sel, name])
export const px = async (p, sel, name) => parseFloat(await cssv(p, sel, name))
export const sp = (p) => p.evaluate(() => parseFloat(getComputedStyle(document.documentElement).scrollPaddingBlockStart) || 0)
export const toY = (p, y) => p.evaluate((y) => new Promise((r) => { window.scrollTo(0, y); requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 200))) }), y)
export const sy = (p) => p.evaluate(() => Math.round(window.scrollY))
export const overflowX = (p) => p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)

// Contraste en la página: compone colores con alfa sobre su fondo opaco (canvas = sRGB del navegador)
export const CONTRAST = () => {
  if (window.__ratio) return
  window.__rgb = (c, under) => {
    const cv = (window.__cv ||= document.createElement('canvas')); cv.width = cv.height = 1
    const x = cv.getContext('2d', { willReadFrequently: true })
    x.clearRect(0, 0, 1, 1); if (under) { x.fillStyle = `rgb(${under.join(',')})`; x.fillRect(0, 0, 1, 1) }
    x.fillStyle = '#000'; x.fillStyle = c; x.fillRect(0, 0, 1, 1)
    return [...x.getImageData(0, 0, 1, 1).data].slice(0, 3)
  }
  const clear = (c) => { if (/^transparent$|rgba?\(0, 0, 0, 0\)/.test(c)) return true; const a = c.match(/[\d.]+(?=\)$)/); return (c.includes('/') || c.startsWith('rgba')) && a && parseFloat(a[0]) === 0 }
  window.__bgOf = (el) => { const stack = []; for (let e = el; e; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor; if (clear(c)) continue; stack.push(c); const a = c.match(/[\d.]+(?=\)$)/); if (!((c.includes('/') || c.startsWith('rgba')) && a && parseFloat(a[0]) < 1)) break } let rgb = [255, 255, 255]; for (const c of stack.reverse()) rgb = window.__rgb(c, rgb); return rgb }
  window.__ratio = (a, b) => { const L = (c) => { const [r, g, bl] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }); return 0.2126 * r + 0.7152 * g + 0.0722 * bl }; const [x, y] = [L(a), L(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05) }
  window.__textRatio = (sel, prop = 'color') => { const e = typeof sel === 'string' ? document.querySelector(sel) : sel; const bg = window.__bgOf(e); return window.__ratio(window.__rgb(getComputedStyle(e)[prop], bg), bg) }
  window.__pair = (fg, bgEl) => { const bg = window.__bgOf(bgEl); return window.__ratio(window.__rgb(fg, bg), bg) }
}
export const ratio = (p, sel, prop = 'color') => p.evaluate(([s, pr]) => window.__textRatio(s, pr), [sel, prop])

// Capturas lado a lado: dos PNG en una página y una sola captura (izquierda prototipo, derecha componente real)
export async function sideBySide (browser, base, left, right, out, labels = ['Prototipo (kiwi)', 'Componente real']) {
  const ctx = await browser.newContext({ viewport: { width: 1640, height: 600 }, deviceScaleFactor: 1 })
  const p = await ctx.newPage()
  const b64 = async (f) => (await readFile(f)).toString('base64')
  await p.setContent(`<!doctype html><body style="margin:0;font:13px system-ui;background:#888"><div style="display:flex;gap:8px;padding:8px;align-items:flex-start">${[left, right].map((f, i) => `<figure style="margin:0;flex:1"><figcaption style="color:#fff;padding:4px 0">${labels[i]}</figcaption><img style="max-width:100%;display:block" src="data:image/png;base64,${''}__${i}__"></figure>`).join('')}</div></body>`.replace('__0__', await b64(left)).replace('__1__', await b64(right)))
  await p.evaluate(() => Promise.all([...document.images].map((i) => i.decode())))
  await p.screenshot({ path: out, fullPage: true })
  await ctx.close()
}
