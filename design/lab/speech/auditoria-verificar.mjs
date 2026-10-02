// Auditoría de coco (paso 5) de la captura de voz F1 sobre los COMPONENTES REALES (GSpeechHost, GSpeechPill,
// GSpeechTrigger de bruno + dist/, playground #sec-speech con el adaptador simulado de @grana/vue/testing y ?speech=self).
// Mide (speech.md §17): contraste compuesto de textos (provisional incluido) ≥ 4.5:1 e iconos, bordes de estado, medidor y
// onda ≥ 3:1 en pill colocada (cabecera) y flotante, panel, disparadores y nota, en 9 estados de sesión, con el tema por
// defecto y temas generados (acento pálido: spotify, amazon), claro y oscuro; `active` solo como relleno (#228); foco
// distinto del énfasis vivo; exactamente una pill visible y operable (cabecera, flotante, GDialog modal, móvil); hoja móvil
// bajo space × 130 (320×640); Esc del panel no cierra el GDialog; aviso de GToaster encima de la pill en móvil; regiones
// g-btn__status vacías toda la sesión (#227); RTL; forced-colors y prefers-contrast (Chromium); movimiento reducido y
// «Ocultar actividad»; zoom 200 % (640×450); objetivos 24/44px; consola limpia; .vue/.js sin <style> ni literales.
// Además, la barra del ítem activo de GSidebar con acento pálido (#228: trazo ≥ 3:1 sobre la superficie).
// Ejecutar desde la raíz del repo con dist/ reconstruido: node design/lab/speech/auditoria-verificar.mjs
// Opcional: --engines=chromium   --origin=http://localhost:4173 (si no responde, servidor propio)   --verbose
import http from 'node:http'
import { readFile, readdir } from 'node:fs/promises'
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
// El playground carga Vue de unpkg: se sirve la copia local (node_modules/vue) para no depender de la red
const VUE_GLOBAL = await readFile(join(ROOT, 'node_modules/vue/dist/vue.global.js'))
const localVue = (ctx) => ctx.route(/unpkg\.com\/vue@3/, (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: VUE_GLOBAL }))

const GEN = ['spotify', 'amazon', 'lustre', 'github']
const genCss = Object.fromEntries(await Promise.all(['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify'].map(async (n) => [n, await readFile(join(ROOT, `design/lab/tema-oscuro/dark-color-presence/generated/${n}.css`), 'utf8')])))

let total = 0, failed = 0
const fails = []
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(msg) } }
const agg = {} // mínimo por medida y tema
const errors = []
const provSeen = new Set() // el provisional se midió (panel y nota) en cada tema

/* ---------- 0. Estático: .vue sin <style>; .vue/.js nuevos sin literales de tema ---------- */
{
  const files = []
  for (const d of ['GSpeechHost', 'GSpeechPill', 'GSpeechTrigger']) for (const f of await readdir(join(ROOT, 'packages/vue/src/components', d))) if (/\.(vue|js)$/.test(f) && !/\.test\.js$|TestEnv/.test(f)) files.push(`packages/vue/src/components/${d}/${f}`)
  files.push('packages/vue/src/utils/topModal.js', 'packages/vue/src/utils/liveRegion.js', 'packages/vue/src/utils/edgeReserve.js', 'packages/vue/src/speech.js', 'packages/vue/src/shared.js')
  for (const f of files) {
    const src = (await readFile(join(ROOT, f), 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/([^:])\/\/.*$/gm, '$1')
    ok(!/<style[\s>]/.test(src), `${f}: lleva <style>`)
    const lit = src.match(/['"`][^'"`\n]*?(#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|\boklch\(|(?<![$\w{])\d+(\.\d+)?(px|rem|em|vh|vw|dvh)\b)[^'"`\n]*['"`]/g)
    ok(!lit, `${f}: literales de tema ${JSON.stringify(lit)}`)
  }
}

/* ---------- En la página: contraste compuesto de todas las piezas visibles ---------- */
const measure = () => {
  const parse = (s) => {
    let m = String(s).match(/rgba?\(([^)]+)\)/)
    if (m) { const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1] }
    m = String(s).match(/color\(srgb ([^)]+)\)/)
    if (m) { const p = m[1].split(/[\s/]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p[3] ?? 1] }
    return [0, 0, 0, 0]
  }
  const over = (t, b) => { const a = t[3]; return [t[0] * a + b[0] * (1 - a), t[1] * a + b[1] * (1 - a), t[2] * a + b[2] * (1 - a), 1] }
  const bgOf = (el) => {
    const layers = []
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c[3] > 0) { layers.push(c); if (c[3] >= 1) break } }
    let base = parse(getComputedStyle(document.body).backgroundColor)
    if (base[3] < 1) base = parse(getComputedStyle(document.documentElement).backgroundColor)
    if (base[3] < 1) base = matchMedia('(prefers-color-scheme: dark)').matches ? [0, 0, 0, 1] : [255, 255, 255, 1]
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base)
    return base
  }
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2) }
  const vis = (el) => el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden' && !el.closest('[hidden]')
  const out = []
  const add = (id, what, r, min) => out.push({ id, what, r, min })
  const text = (id, what, el, min = 4.5) => { if (!vis(el)) return; const bg = bgOf(el); add(id, what, ratio(over(parse(getComputedStyle(el).color), bg), bg), min) }
  const paint = (id, what, el, prop, against, min = 3) => { if (!vis(el)) return; const bg = against || bgOf(el); add(id, what, ratio(over(parse(getComputedStyle(el)[prop]), bg), bg), min) }
  for (const p of document.querySelectorAll('.g-speech-pill')) {
    if (!vis(p)) continue
    const id = p.dataset.placement + ':' + p.dataset.status
    const fill = bgOf(p)
    const outside = p.dataset.placement === 'floating' ? bgOf(p.parentElement.parentElement) : bgOf(p.parentElement)
    text(id, 'pill · texto', p.querySelector('.g-speech-pill__text'))
    text(id, 'pill · duración', p.querySelector('.g-speech-pill__time'))
    const ic = p.querySelector('.g-speech-pill__icon'); paint(id, 'pill · icono de estado', ic, 'color', bgOf(ic))
    paint(id, 'pill · chevron', p.querySelector('.g-speech-pill__chevron'), 'color')
    for (const b of p.querySelectorAll('.g-speech-pill__toggle, .g-speech-pill__finish')) paint(id, 'pill · iconos alternar/finalizar', b, 'color')
    for (const bar of p.querySelectorAll('.g-speech-meter__bar')) paint(id, 'pill · medidor', bar, 'backgroundColor', bgOf(bar.parentElement))
    if (p.classList.contains('is-live') || p.classList.contains('is-problem')) {
      const rim = parse(getComputedStyle(p).borderTopColor)
      add(id, 'pill · borde de estado / fuera', ratio(over(rim, outside), outside), 3)
      add(id, 'pill · borde de estado / relleno', ratio(over(rim, fill), fill), 3)
    }
  }
  for (const pn of document.querySelectorAll('.g-speech-panel')) {
    if (!vis(pn)) continue
    const id = 'panel:' + pn.dataset.status
    for (const [sel, what, min] of [['.g-speech-panel__title', 'panel · título', 4.5], ['.g-speech-panel__mode', 'panel · modo', 4.5], ['.g-speech-panel__status-text', 'panel · estado', 4.5], ['.g-speech-panel__time', 'panel · duración', 4.5],
      ['.g-speech-panel__sub > p:not(.is-warning)', 'panel · secundario', 4.5], ['.g-speech-panel__sub .is-warning', 'panel · señal plana', 4.5], ['.g-speech-panel__privacy p', 'panel · privacidad', 4.5], ['.g-speech-panel__privacy .g-icon', 'panel · icono de privacidad', 3],
      ['.g-speech-panel__transcript > h3', 'panel · título del transcript', 4.5], ['.g-speech-panel__transcript > p', 'panel · transcript vacío', 4.5], ['.g-speech-segment:not(.is-partial) .g-speech-segment__text', 'transcript · confirmado', 4.5], ['.g-speech-segment.is-partial .g-speech-segment__text', 'transcript · PROVISIONAL', 4.5],
      ['.g-speech-segment__time', 'transcript · hora', 4.5], ['.g-speech-segment__speaker', 'transcript · hablante', 4.5], ['.g-speech-segment__flag', 'transcript · ficha provisional', 4.5], ['.g-speech-segment.is-failed > :not(.g-btn):not(.g-btn__status)', 'transcript · fragmento fallido', 4.5],
      ['.g-speech-panel__error > :not(.g-speech-panel__issue)', 'panel · error', 4.5], ['.g-speech-panel__issue', 'panel · fallo no fatal', 4.5], ['.g-speech-panel__issue .g-icon', 'panel · icono de fallo', 3], ['.g-speech-segment.is-failed .g-icon', 'transcript · icono de fragmento fallido', 3], ['.g-speech-panel__error .g-icon', 'panel · icono de error', 3],
      ['.g-speech-panel__confirm > p', 'panel · confirmación', 4.5], ['.g-speech-panel__setup p', 'panel · preparación', 4.5]]) for (const el of pn.querySelectorAll(sel)) text(id, what, el, min)
    const si = pn.querySelector('.g-speech-panel__status-icon'); paint(id, 'panel · icono de estado', si, 'color', bgOf(si))
    if (pn.classList.contains('is-live')) for (const wb of pn.querySelectorAll('.g-speech-wave__bar')) { const cs = getComputedStyle(wb); paint(id, 'panel · onda', wb, parse(cs.backgroundColor)[3] === 0 ? 'borderTopColor' : 'backgroundColor', bgOf(wb.parentElement)) }
    for (const el of pn.querySelectorAll('.g-speech-panel__error > :not(.g-speech-panel__issue)')) paint(id, 'panel · marca de error', el, 'borderInlineStartColor', bgOf(pn))
    for (const el of pn.querySelectorAll('.g-speech-panel__issue, .g-speech-segment.is-failed')) paint(id, 'panel · marca de fallo', el, 'borderInlineStartColor', bgOf(pn))
    for (const el of pn.querySelectorAll('.g-speech-segment__flag')) paint(id, 'transcript · borde de la ficha', el, 'borderTopColor')
    for (const b of pn.querySelectorAll('.g-btn')) {
      if (!vis(b)) continue
      const lab = b.querySelector('.g-btn__label'); if (lab && lab.textContent.trim()) text(id, 'panel · texto de botón', b)
      else paint(id, 'panel · icono de botón', b, 'color')
      if (b.matches('.g-btn--variant-outline')) paint(id, 'panel · borde de botón outline', b, 'borderTopColor', bgOf(b.parentElement))
    }
  }
  for (const t of document.querySelectorAll('.g-speech-trigger')) {
    if (!vis(t)) continue
    const b = t.querySelector('.g-speech-trigger__btn'), id = 'disparador:' + (t.classList.contains('g-speech-trigger--mode-conversation') ? 'conv:' : 'dict:') + t.dataset.status + (t.classList.contains('is-busy') ? ':busy' : '')
    if (!t.classList.contains('is-busy')) paint(id, 'disparador · icono', b.querySelector('.g-icon'), 'color', bgOf(b))
    if (t.matches('.g-speech-trigger--mode-conversation') && !t.classList.contains('is-busy')) text(id, 'disparador · texto', b.querySelector('.g-btn__label'))
    const sh = getComputedStyle(b).boxShadow
    if (sh && sh !== 'none' && t.dataset.status !== 'idle') { const c = parse(sh); const outside = bgOf(t.parentElement); add(id, 'disparador · contorno vivo / fuera', ratio(over(c, outside), outside), 3); add(id, 'disparador · contorno vivo / tinte', ratio(over(c, bgOf(b)), bgOf(b)), 3) }
    if (['denied', 'unavailable', 'error'].includes(t.dataset.status) && !t.classList.contains('is-busy')) paint(id, 'disparador · borde de problema', b, 'borderTopColor', bgOf(t.parentElement))
    text(id, 'nota · PROVISIONAL', t.querySelector('.g-speech-trigger__note.is-partial .g-speech-trigger__note-text'))
    text(id, 'nota · texto', t.querySelector('.g-speech-trigger__note:not(.is-partial) .g-speech-trigger__note-text'))
    const a = t.querySelector('.g-speech-trigger__note-action'); if (vis(a)) { text(id, 'nota · acción', a); paint(id, 'nota · borde de acción', a, 'borderTopColor', bgOf(t)) }
  }
  return out
}

/* Tokens resueltos: para comprobar dónde va `active` (#228) */
const roles = () => {
  const probe = document.createElement('i'); document.body.append(probe)
  const tok = (t) => { probe.style.color = `var(--g-color-${t})`; return getComputedStyle(probe).color }
  const r = { active: tok('active'), onAccent: tok('on-accent'), onAccentSoft: tok('on-accent-soft'), accentText: tok('accent-text'), accentSoft: tok('accent-soft') }
  probe.remove(); return r
}

/* Regiones vivas fuera de los dos canales (#227): un observador anota cualquier texto en ellas durante toda la sesión */
const watchLive = () => {
  window.__noise = []
  const scan = () => {
    for (const el of document.querySelectorAll('[role="status"], [role="alert"], [aria-live]:not([aria-live="off"])')) {
      if (el.classList.contains('g-speech-host__live') || el.closest('.g-toaster')) continue
      if (!el.closest('.g-speech-host, .g-speech-pill, .g-speech-trigger')) continue
      if (el.textContent.trim()) window.__noise.push(el.className + ': ' + el.textContent.trim().slice(0, 40))
    }
  }
  new MutationObserver(scan).observe(document.body, { subtree: true, childList: true, characterData: true })
}
const visiblePills = () => [...document.querySelectorAll('.g-speech-pill')].filter((p) => {
  if (p.closest('[hidden]') || p.hidden) return false
  const r = p.getBoundingClientRect()
  if (!r.width || !r.height || r.bottom <= 0 || r.top >= innerHeight) return false
  if (p.closest('[inert]')) return false
  const modal = document.querySelector('dialog:modal:not(.g-speech-sheet)')
  if (modal && !modal.contains(p)) return false
  const m = p.querySelector('.g-speech-pill__main').getBoundingClientRect()
  const hit = document.elementFromPoint(m.left + m.width / 2, m.top + m.height / 2)
  return !!hit && p.contains(hit)
}).map((p) => p.dataset.placement)

const LIVE = /listening|speech|transcribing/
const until = (page, fn, arg, timeout = 15000) => page.waitForFunction(fn, arg, { timeout, polling: 50 })

for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  const open = async ({ width = 1280, height = 900, dark = false, theme = '', rtl = false, forced, contrast, touch = false, reduced = true, qs = '?speech=self', denied = false } = {}) => {
    const ctx = await browser.newContext({ viewport: { width, height }, colorScheme: dark ? 'dark' : 'light', reducedMotion: reduced ? 'reduce' : 'no-preference', hasTouch: touch, isMobile: touch && engine === 'chromium' })
    await localVue(ctx)
    const page = await ctx.newPage()
    page.on('console', (m) => { const t = m.text(); if ((m.type() === 'error' && !/favicon/.test(t)) || (m.type() === 'warning' && /\[Vue warn\]|\[Grana/.test(t))) errors.push(`${engine}: ${m.type()} ${t.slice(0, 200)}`) })
    page.on('pageerror', (e) => errors.push(`${engine}: pageerror ${e.message}`))
    if (denied) await page.addInitScript(() => { Object.defineProperty(Permissions.prototype, 'query', { configurable: true, writable: true, value: (d) => (d && d.name === 'microphone' ? Promise.resolve({ state: 'denied', onchange: null, addEventListener() {}, removeEventListener() {} }) : Promise.resolve({ state: 'prompt' })) }) })
    if (forced || contrast) await page.emulateMedia({ ...(forced ? { forcedColors: forced } : {}), ...(contrast ? { contrast } : {}) })
    await page.goto(PAGE + qs + '#sec-speech')
    await page.waitForFunction(() => window.speech && document.querySelector('.g-speech-host') && document.querySelector('#sec-speech .g-speech-trigger'))
    if (theme) await page.addStyleTag({ content: theme })
    if (rtl) await page.evaluate(() => { document.documentElement.dir = 'rtl' })
    await page.evaluate(() => document.fonts.ready)
    await page.evaluate(watchLive)
    page.ctx = ctx
    return page
  }
  const record = (tag, rows) => {
    for (const r of rows) {
      ok(r.r >= r.min, `${engine} ${tag} ${r.id} ${r.what}: ${r.r} < ${r.min}`)
      const k = r.what; agg[k] ??= {}; const t = tag.replace(/ \[.*\]$/, '')
      if (/PROVISIONAL/.test(k)) provSeen.add(`${engine} ${t} ${k}`)
      if (!agg[k][t] || r.r < agg[k][t].r) agg[k][t] = { r: r.r, at: `${engine} ${r.id}` }
    }
    return rows.length
  }
  const noise = async (page, tag) => { const n = await page.evaluate(() => window.__noise); ok(n.length === 0, `${engine} ${tag}: regiones g-btn__status con texto (#227): ${JSON.stringify(n.slice(0, 3))}`) }
  const startConv = async (page) => {
    await page.evaluate(() => window.speech.start({ mode: 'conversation' }))
    await until(page, (re) => new RegExp(re).test(window.speech.state.status), LIVE.source)
  }
  const floatingMode = async (page, on) => page.evaluate((v) => { document.querySelector('.pg-bar').style.position = v ? 'static' : ''; window.scrollTo(0, v ? document.body.scrollHeight : document.getElementById('sec-speech').offsetTop - 80) }, on)

  /* ---------- 1. Contraste por tema y estado ---------- */
  const themes = [['defecto', ''], ...(engine === 'chromium' ? GEN : ['spotify']).map((t) => [t, genCss[t]])]
  for (const [name, css] of themes) {
    for (const dark of [false, true]) {
      const tag = `${name} ${dark ? 'oscuro' : 'claro'}`
      const page = await open({ dark, theme: css })
      let n = 0
      // Dictado: disparador vivo y nota con provisional
      await page.locator('#speech-demo .g-speech-trigger__btn').first().click()
      await until(page, () => document.querySelector('#speech-demo .g-speech-trigger__note.is-partial:not([hidden])'))
      await page.waitForTimeout(300)
      n += record(tag + ' [dictado]', await page.evaluate(measure))
      await page.evaluate(() => window.speech.discard())
      await until(page, () => window.speech.state.status === 'idle')
      // Conversación: ready (panel con preparación)
      await page.evaluate(() => window.speech.prepare())
      await until(page, () => window.speech.state.status === 'ready')
      await page.evaluate(() => window.speech.openPanel()); await page.waitForTimeout(150)
      await page.waitForTimeout(300)
      n += record(tag + ' [ready]', await page.evaluate(measure))
      await page.evaluate(() => window.speech.begin())
      await until(page, (re) => new RegExp(re).test(window.speech.state.status), LIVE.source)
      // listening con provisional en el panel; pill colocada (cabecera) y luego flotante
      await page.evaluate(() => window.spAdapter.failNextSegment())
      await until(page, () => window.speech.state.issues.length > 0 && document.querySelector('.g-speech-segment.is-failed'), null, 20000)
      await until(page, () => document.querySelector('.g-speech-segment.is-partial'), null, 20000)
      await page.waitForTimeout(300)
      n += record(tag + ' [captura · cabecera]', await page.evaluate(measure))
      if (name === 'defecto' || name === 'spotify' || name === 'amazon') {
        // `active` solo como relleno (#228): la lámpara en active con on-accent; borde y medidor en on-accent-soft; onda en accent-text
        const a = await page.evaluate(() => {
          const probe = document.createElement('i'); document.body.append(probe)
          const tok = (t) => { probe.style.color = `var(--g-color-${t})`; return getComputedStyle(probe).color }
          const p = document.querySelector('.pg-bar .g-speech-pill'), lamp = p.querySelector('.g-speech-pill__icon'), bar = p.querySelector('.g-speech-meter__bar')
          const wave = document.querySelector('.g-speech-panel .g-speech-wave__bar[data-on]') || document.querySelector('.g-speech-panel .g-speech-wave__bar')
          const r = { active: tok('active'), onAccent: tok('on-accent'), onAccentSoft: tok('on-accent-soft'), accentText: tok('accent-text'), lampBg: getComputedStyle(lamp).backgroundColor, lampFg: getComputedStyle(lamp).color, rim: getComputedStyle(p).borderTopColor, bar: bar && getComputedStyle(bar).backgroundColor, wave: wave && (wave.hasAttribute('data-on') || !document.querySelector('.g-speech-host[data-reduced-motion]') ? getComputedStyle(wave).backgroundColor : getComputedStyle(wave).borderTopColor) }
          probe.remove(); return r
        })
        ok(a.lampBg === a.active && a.lampFg === a.onAccent && a.rim === a.onAccentSoft && a.bar === a.onAccentSoft && a.wave === a.accentText, `${engine} ${tag}: active solo en la lámpara; trazos en on-accent-soft / accent-text: ${JSON.stringify(a)}`)
      }
      await floatingMode(page, true); await page.waitForTimeout(300)
      ok(JSON.stringify(await page.evaluate(visiblePills)) === '["floating"]', `${engine} ${tag}: con la cabecera fuera, la flotante es la única pill visible`)
      await page.waitForTimeout(300)
      n += record(tag + ' [captura · flotante]', await page.evaluate(measure))
      await floatingMode(page, false); await page.waitForTimeout(200)
      // reconnecting con captura viva
      await page.evaluate(() => window.spAdapter.goOffline())
      await until(page, () => window.speech.state.status === 'reconnecting')
      await page.waitForTimeout(300)
      n += record(tag + ' [reconnecting]', await page.evaluate(measure))
      await page.evaluate(() => window.spAdapter.goOnline())
      await until(page, (re) => new RegExp(re).test(window.speech.state.status), LIVE.source)
      // paused
      await page.evaluate(() => window.speech.pause())
      await until(page, () => window.speech.state.status === 'paused')
      await page.waitForTimeout(300)
      n += record(tag + ' [paused]', await page.evaluate(measure))
      // error (captura interrumpida, con algo capturado)
      await page.evaluate(() => window.speech.resume())
      await until(page, (re) => new RegExp(re).test(window.speech.state.status), LIVE.source)
      await page.waitForTimeout(300)
      await page.evaluate(() => window.spAdapter.muteCapture())
      await until(page, () => window.speech.state.status === 'error')
      await page.waitForTimeout(300)
      n += record(tag + ' [error]', await page.evaluate(measure))
      // processing y completed (con confirmación de descarte)
      await page.evaluate(() => { window.speech.finish() })
      await until(page, () => ['processing', 'completed'].includes(window.speech.state.status))
      await page.waitForTimeout(200)
      if (await page.evaluate(() => window.speech.state.status === 'processing')) n += record(tag + ' [processing]', await page.evaluate(measure))
      await until(page, () => window.speech.state.status === 'completed', null, 20000)
      await page.waitForTimeout(150)
      const disc = page.locator('.g-speech-panel__controls .g-btn', { hasText: 'Descartar' })
      if (await disc.count()) { await disc.click(); await page.waitForTimeout(100) }
      await page.waitForTimeout(300)
      n += record(tag + ' [completed]', await page.evaluate(measure))
      await noise(page, tag)
      await page.evaluate(() => window.speech.discard())
      await page.ctx.close()
      // denied (permiso denegado sin abrir nada) en disparador y pill
      const pd = await open({ dark, theme: css, qs: '', denied: true })
      await pd.locator('#speech-demo .g-speech-trigger__btn').first().click()
      await until(pd, () => window.speech.state.status === 'denied')
      await pd.evaluate(() => window.speech.openPanel()); await pd.waitForTimeout(150)
      await pd.waitForTimeout(300)
      n += record(tag + ' [denied]', await pd.evaluate(measure))
      await pd.ctx.close()
      ok(n > 80, `${engine} ${tag}: medidas suficientes (${n})`)
      ok(provSeen.has(`${engine} ${tag} transcript · PROVISIONAL`) && provSeen.has(`${engine} ${tag} nota · PROVISIONAL`), `${engine} ${tag}: provisional medido en el panel y en la nota`)
    }
  }

  /* ---------- 2. Foco frente a énfasis vivo (pill de la cabecera) ---------- */
  {
    const page = await open({ theme: genCss.spotify })
    await startConv(page)
    await page.locator('#sp-obs').focus()
    await page.keyboard.press('Shift+F8')
    const f = await page.evaluate(() => {
      const b = document.activeElement, pill = b.closest('.g-speech-pill'), cs = getComputedStyle(b), ps = getComputedStyle(pill)
      const pr = pill.getBoundingClientRect(), br = b.getBoundingClientRect(), off = parseFloat(cs.outlineOffset), ow = parseFloat(cs.outlineWidth)
      return { main: b.classList.contains('g-speech-pill__main'), fv: b.matches(':focus-visible'), style: cs.outlineStyle, off, ow, gap: +((br.top - off - ow) - (pr.top + parseFloat(ps.borderTopWidth))).toFixed(2), rimW: parseFloat(ps.borderTopWidth), rimStyle: ps.borderTopStyle, ring: cs.outlineColor, rim: ps.borderTopColor, ringOnlyBtn: br.width < pr.width - 20 }
    })
    ok(f.main && f.fv && f.style === 'solid' && f.ow >= 2, `${engine} foco visible en la pill tras Mayús+F8: ${JSON.stringify(f)}`)
    ok(f.off < 0 && f.gap >= 1.5 && f.rimW === 2 && f.rimStyle === 'solid' && f.ringOnlyBtn, `${engine} anillo interior al botón, a ≥ 2px del borde vivo de 2px que rodea la pill: ${JSON.stringify(f)}`)
    await page.keyboard.press('Shift+F8')
    ok(await page.evaluate(() => document.activeElement.id === 'sp-obs'), `${engine} Mayús+F8 devuelve el foco al campo`)
    await page.evaluate(() => window.speech.discard()); await page.ctx.close()
  }

  /* ---------- 3. Una pill: cabecera, flotante, GDialog modal (Esc no lo cierra) ---------- */
  {
    const page = await open()
    ok(JSON.stringify(await page.evaluate(visiblePills)) === '[]', `${engine} sin sesión no hay pill visible`)
    await startConv(page)
    await page.waitForTimeout(200)
    ok(JSON.stringify(await page.evaluate(visiblePills)) === '["placed"]', `${engine} cabecera visible: solo la colocada`)
    await page.locator('#sp-dialog').click()
    await until(page, () => document.querySelector('dialog.g-dialog[open] .g-speech-host'))
    await page.waitForTimeout(250)
    ok(JSON.stringify(await page.evaluate(visiblePills)) === '["floating"]', `${engine} GDialog modal: la flotante, dentro del modal y pulsable, es la única`)
    await page.locator('dialog.g-dialog[open] .g-speech-host__float .g-speech-pill__main').click()
    await page.waitForTimeout(250)
    const dp = await page.evaluate(() => { const pn = document.querySelector('.g-speech-panel'); const r = pn.getBoundingClientRect(); const hit = document.elementFromPoint(r.left + 40, r.top + 20); return { inDialog: !!pn.closest('dialog.g-dialog[open]'), hit: !!hit && pn.contains(hit), focus: document.activeElement.className, inView: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight } })
    ok(dp.inDialog && dp.hit && /panel__title/.test(dp.focus) && dp.inView, `${engine} modal: panel dentro y por encima, foco al título: ${JSON.stringify(dp)}`)
    await page.keyboard.press('Escape'); await page.waitForTimeout(200)
    const de = await page.evaluate(() => ({ panel: !document.querySelector('.g-speech-panel').hidden, dlg: !!document.querySelector('dialog.g-dialog[open]'), live: /listening|speech|transcribing/.test(window.speech.state.status) }))
    ok(!de.panel && de.dlg && de.live, `${engine} Esc cierra el panel; el GDialog sigue abierto y la sesión sigue: ${JSON.stringify(de)}`)
    // foco visible en la flotante dentro del modal: desde un campo del diálogo (como un usuario de teclado)
    await page.locator('#sp-nota').focus()
    await page.keyboard.press('Shift+F8')
    const fv = await page.evaluate(() => { const a = document.activeElement, cs = getComputedStyle(a); return { inFloat: !!a.closest('.g-speech-host__float'), fv: a.matches(':focus-visible'), w: cs.outlineWidth, s: cs.outlineStyle } })
    ok(fv.inFloat && fv.fv && fv.s === 'solid' && parseFloat(fv.w) >= 2, `${engine} Mayús+F8 en el modal: foco visible en la flotante: ${JSON.stringify(fv)}`)
    await page.keyboard.press('Shift+F8')
    await page.locator('dialog.g-dialog[open] .g-dialog__footer .g-btn', { hasText: 'Cerrar' }).click()
    await until(page, () => document.querySelector('.g-speech-host').parentElement === document.body)
    await page.waitForTimeout(250)
    ok(JSON.stringify(await page.evaluate(visiblePills)) === '["placed"]', `${engine} al cerrar el modal vuelve la colocada como única pill`)
    await noise(page, 'modal')
    await page.evaluate(() => window.speech.discard()); await page.ctx.close()
  }

  /* ---------- 4. Objetivos: 24px (puntero fino) y 44px sin pisarse (pointer: coarse) ---------- */
  const targets = () => {
    const area = (b) => { const r = b.getBoundingClientRect(), a = getComputedStyle(b, '::after'), w = Math.max(r.width, parseFloat(a.width) || 0), h = Math.max(r.height, parseFloat(a.height) || 0); return { l: r.left + r.width / 2 - w / 2, r: r.left + r.width / 2 + w / 2, t: r.top + r.height / 2 - h / 2, b: r.top + r.height / 2 + h / 2, w, h, n: b.className.match(/g-speech-[a-z-]+__[a-z-]+/)?.[0] || b.textContent.trim().slice(0, 14) } }
    const bs = [...document.querySelectorAll('.g-speech-pill .g-btn, .g-speech-panel .g-btn, .g-speech-trigger .g-btn')].filter((b) => b.getClientRects().length && !b.closest('[hidden]'))
    const as = bs.map(area)
    let overlap = 0
    for (const pill of document.querySelectorAll('.g-speech-pill')) {
      const ps = [...pill.querySelectorAll('.g-btn')].filter((b) => b.getClientRects().length).map(area)
      for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) { const a = ps[i], b = ps[j]; if (a.l < b.r - 0.5 && b.l < a.r - 0.5 && a.t < b.b - 0.5 && b.t < a.b - 0.5) overlap++ }
    }
    return { coarse: matchMedia('(pointer: coarse)').matches, n: as.length, min: Math.min(...as.map((a) => Math.min(a.w, a.h))), small: as.filter((a) => a.w < 24 || a.h < 24).map((a) => a.n), small44: as.filter((a) => a.w < 44 || a.h < 44).map((a) => a.n), overlap, pillH: document.querySelector('.pg-bar .g-speech-pill').getBoundingClientRect().height }
  }
  {
    const page = await open()
    await page.locator('#speech-demo .g-speech-trigger__btn').first().click()
    await until(page, (re) => new RegExp(re).test(window.speech.state.status), LIVE.source)
    await page.evaluate(() => window.speech.openPanel()); await page.waitForTimeout(200)
    const t = await page.evaluate(targets)
    ok(t.n >= 8 && t.small.length === 0, `${engine} objetivos ≥ 24px: ${JSON.stringify(t)}`)
    ok(Math.abs(t.pillH - 34) < 0.6, `${engine} pill de 34px: ${t.pillH}`)
    await page.evaluate(() => window.speech.discard()); await page.ctx.close()
    if (engine !== 'firefox') {
      const pt = await open({ touch: true, width: 900 })
      await pt.locator('#speech-demo .g-speech-trigger__btn').first().click()
      await until(pt, (re) => new RegExp(re).test(window.speech.state.status), LIVE.source)
      await pt.evaluate(() => window.speech.openPanel()); await pt.waitForTimeout(200)
      const c = await pt.evaluate(targets)
      ok(c.coarse && c.small44.length === 0 && c.overlap === 0, `${engine} táctil: áreas ≥ 44px sin pisarse en la pill: ${JSON.stringify(c)}`)
      await pt.evaluate(() => window.speech.discard()); await pt.ctx.close()
    }
  }

  /* ---------- 5. Movimiento: reducido (sin giro, discreto) y «Ocultar actividad»; sin preferencia (giro, 32 barras) ---------- */
  for (const reduced of [true, false]) {
    const page = await open({ reduced })
    await startConv(page)
    await page.evaluate(() => window.speech.openPanel()); await page.waitForTimeout(400)
    const m = await page.evaluate(() => {
      const bars = [...document.querySelectorAll('.pg-bar .g-speech-pill .g-speech-meter__bar')]
      const wave = [...document.querySelectorAll('.g-speech-panel .g-speech-wave__bar')]
      return { rm: document.querySelector('.g-speech-host').hasAttribute('data-reduced-motion'), wave: wave.length, waveOn: wave.filter((w) => w.hasAttribute('data-on')).length, barsData: bars.map((b) => b.hasAttribute('data-on')), barScale: bars.map((b) => getComputedStyle(b).scale), panelTr: getComputedStyle(document.querySelector('.g-speech-panel')).transitionProperty }
    })
    if (reduced) {
      ok(m.rm && m.wave === 5 && m.barScale.every((s, i) => (m.barsData[i] ? s === 'none' : s !== 'none')) && !/translate/.test(m.panelTr), `${engine} movimiento reducido: onda de 5 segmentos, medidor discreto, panel solo con fundido: ${JSON.stringify(m)}`)
    } else {
      ok(!m.rm && m.wave === 32, `${engine} sin preferencia: onda de 32 barras: ${JSON.stringify(m)}`)
    }
    // «Ocultar actividad»
    const hide = page.locator('.g-speech-panel__activity .g-btn')
    await hide.click(); await page.waitForTimeout(150)
    const h = await page.evaluate(() => ({ pressed: document.querySelector('.g-speech-panel__activity .g-btn').getAttribute('aria-pressed'), wave: [...document.querySelectorAll('.g-speech-panel .g-speech-wave')].some((w) => w.getClientRects().length), meter: [...document.querySelectorAll('.g-speech-meter')].some((w) => w.getClientRects().length && !w.closest('[hidden]')), time: document.querySelector('.pg-bar .g-speech-pill__time').getClientRects().length > 0, ptime: document.querySelector('.g-speech-panel__time').getClientRects().length > 0, text: document.querySelector('.pg-bar .g-speech-pill__text').textContent }))
    ok(h.pressed === 'true' && !h.wave && !h.meter && h.time && h.ptime && /Grabando|Voz|Transcribiendo/.test(h.text), `${engine} «Ocultar actividad» (${reduced ? 'reducido' : 'normal'}): sin onda ni medidor; estado y duración siguen: ${JSON.stringify(h)}`)
    await hide.click()
    await page.evaluate(() => { window.speech.finish() })
    await until(page, () => window.speech.state.status === 'processing' || window.speech.state.status === 'completed')
    const spin = await page.evaluate(() => { const i = document.querySelector('.g-speech-pill__icon > .g-icon'), s = document.querySelector('.g-speech-panel__status-icon > .g-icon'); return { st: window.speech.state.status, pill: i && getComputedStyle(i).animationName, panel: s && getComputedStyle(s).animationName } })
    if (spin.st === 'processing') ok(reduced ? spin.pill === 'none' && spin.panel === 'none' : spin.pill !== 'none' && spin.panel !== 'none', `${engine} loader-circle ${reduced ? 'quieto' : 'gira'} (${reduced ? 'reducido' : 'normal'}): ${JSON.stringify(spin)}`)
    await until(page, () => window.speech.state.status === 'completed', null, 20000)
    await page.evaluate(() => window.speech.discard()); await page.ctx.close()
  }

  /* ---------- 6. Móvil 320×640: una pill, hoja bajo space × 130, aviso de GToaster encima de la pill ---------- */
  {
    const page = await open({ width: 320, height: 640 })
    const sw0 = await page.evaluate(() => document.querySelector('.g-speech-host').getBoundingClientRect().width)
    await startConv(page)
    await page.waitForTimeout(250)
    const one = await page.evaluate(visiblePills)
    ok(one.length === 1, `${engine} 320: exactamente una pill visible y operable: ${JSON.stringify(one)}`)
    await floatingMode(page, true); await page.waitForTimeout(400)
    const fl = await page.evaluate(() => { const h = document.querySelector('.g-speech-host'), f = h.querySelector('.g-speech-host__float').getBoundingClientRect(); return { mobile: h.hasAttribute('data-mobile'), edge: h.dataset.edge, align: h.dataset.align, l: f.left, r: f.right, b: f.bottom, top: f.top, center: (f.left + f.right) / 2 } })
    ok(fl.mobile && fl.edge === 'bottom' && fl.l >= 0 && fl.r <= 320 && fl.b <= 640 && Math.abs(fl.center - 160) < 1.5, `${engine} 320: flotante abajo al centro, dentro del visor: ${JSON.stringify(fl)}`)
    ok(JSON.stringify(await page.evaluate(visiblePills)) === '["floating"]', `${engine} 320: con la cabecera fuera, solo la flotante`)
    await page.evaluate(() => window.toaster.show({ type: 'success', title: 'Borrador guardado', description: 'Los cambios están en este dispositivo.' }))
    await page.waitForSelector('.g-toast[data-state="visible"]'); await page.waitForTimeout(500)
    const e = await page.evaluate(() => { const f = document.querySelector('.g-speech-host__float').getBoundingClientRect(), t = document.querySelector('.g-toast').getBoundingClientRect(); return { pTop: f.top, tBottom: t.bottom, tTop: t.top, tl: t.left, tr: t.right, gap: f.top - t.bottom } })
    ok(e.tBottom <= e.pTop && e.tTop >= 0 && e.tl >= 0 && e.tr <= 320 && Math.abs(e.pTop - fl.top) < 0.5, `${engine} 320: el aviso queda encima de la pill, dentro del visor; la pill no se mueve: ${JSON.stringify(e)}`)
    ok(JSON.stringify(await page.evaluate(visiblePills)) === '["floating"]', `${engine} 320: con el aviso, la pill sigue siendo visible y pulsable`)
    await page.locator('.g-speech-host__float .g-speech-pill__main').click(); await page.waitForTimeout(400)
    const sh = await page.evaluate(() => { const d = document.querySelector('.g-speech-sheet'), pn = d.querySelector('.g-speech-panel'), r = d.getBoundingClientRect(); return { open: d.open, modal: d.matches(':modal'), inSheet: !!pn, top: r.top, bottom: r.bottom, l: r.left, w: r.width, h: r.height, maxH: innerHeight * 0.88, ov: pn ? pn.scrollWidth - pn.clientWidth : -1, sw: document.documentElement.scrollWidth, focus: document.activeElement.className } })
    ok(sh.open && sh.modal && sh.inSheet && sh.bottom <= 640.5 && sh.h <= sh.maxH + 1 && sh.l >= 0 && sh.w <= 320 && sh.ov <= 0 && sh.sw <= 320, `${engine} 320: hoja modal inferior ≤ 88 % sin desbordamiento: ${JSON.stringify(sh)}`)
    ok(/panel__title/.test(sh.focus), `${engine} 320: foco al título de la hoja: ${sh.focus}`)
    const cs = await page.evaluate(() => { const ft = document.activeElement, cs = getComputedStyle(ft); return { fv: ft.matches(':focus-visible') || cs.outlineStyle !== 'none' } })
    await page.keyboard.press('Tab')
    const tf = await page.evaluate(() => { const a = document.activeElement, cs = getComputedStyle(a); return { inSheet: !!a.closest('.g-speech-sheet'), fv: a.matches(':focus-visible'), s: cs.outlineStyle, w: cs.outlineWidth } })
    ok(tf.inSheet && tf.fv && tf.s === 'solid' && parseFloat(tf.w) >= 2, `${engine} 320: foco visible dentro de la hoja: ${JSON.stringify(tf)}`)
    void cs
    await page.keyboard.press('Escape'); await page.waitForTimeout(250)
    const af = await page.evaluate(() => ({ sheet: document.querySelector('.g-speech-sheet').open, live: /listening|speech|transcribing/.test(window.speech.state.status) }))
    ok(!af.sheet && af.live, `${engine} 320: Esc cierra la hoja y la sesión sigue: ${JSON.stringify(af)}`)
    await noise(page, 'móvil')
    await page.evaluate(() => window.speech.discard()); await page.ctx.close()
    void sw0
  }

  /* ---------- 7. RTL ---------- */
  {
    const page = await open({ rtl: true })
    await startConv(page)
    await page.evaluate(() => window.speech.openPanel()); await page.waitForTimeout(250)
    const r = await page.evaluate(() => {
      const p = document.querySelector('.pg-bar .g-speech-pill'), ic = p.querySelector('.g-speech-pill__icon').getBoundingClientRect(), tx = p.querySelector('.g-speech-pill__text').getBoundingClientRect(), fin = p.querySelector('.g-speech-pill__finish').getBoundingClientRect()
      const pn = document.querySelector('.g-speech-panel').getBoundingClientRect(), time = document.querySelector('.g-speech-panel__time').getBoundingClientRect(), st = document.querySelector('.g-speech-panel__status-text').getBoundingClientRect()
      return { iconRight: ic.left > tx.left, finishLeft: fin.right < tx.left, timeLeft: time.right <= st.left + 1, panelIn: pn.left >= 0 && pn.right <= innerWidth, sw: document.documentElement.scrollWidth <= innerWidth }
    })
    ok(Object.values(r).every(Boolean), `${engine} RTL: icono a la derecha, controles a la izquierda, duración al final, panel dentro: ${JSON.stringify(r)}`)
    await page.evaluate(() => window.speech.closePanel())
    await floatingMode(page, true); await page.waitForTimeout(300)
    const c = await page.evaluate(() => { const r = document.querySelector('.g-speech-host__float').getBoundingClientRect(); return { c: (r.left + r.right) / 2, top: r.top } })
    ok(Math.abs(c.c - 640) < 2 && Math.abs(c.top - 16) < 1, `${engine} RTL: flotante arriba al centro a 16px: ${JSON.stringify(c)}`)
    await page.evaluate(() => window.speech.discard()); await page.ctx.close()
  }

  /* ---------- 8. Zoom 200 % (visor CSS de 640×450) ---------- */
  {
    const page = await open({ width: 640, height: 450 })
    await startConv(page)
    await page.waitForTimeout(2500)
    await page.evaluate(() => window.speech.openPanel()); await page.waitForTimeout(300)
    const z = await page.evaluate(() => { const pn = document.querySelector('.g-speech-panel'), r = pn.getBoundingClientRect(), pill = visiblePill(); return { mobile: document.querySelector('.g-speech-host').hasAttribute('data-mobile'), l: r.left, r: r.right, t: r.top, b: r.bottom, h: innerHeight, ov: pn.scrollWidth - pn.clientWidth, pillIn: pill.left >= 0 && pill.right <= innerWidth, sw: document.documentElement.scrollWidth }; function visiblePill() { return [...document.querySelectorAll('.g-speech-pill')].find((p) => p.getClientRects().length && !p.closest('[hidden]')).getBoundingClientRect() } })
    ok(z.l >= 0 && z.r <= 640 && z.t >= 0 && z.b <= z.h + 0.5 && z.ov <= 0 && z.pillIn, `${engine} zoom 200 %: panel y pill dentro del visor, sin desbordamiento: ${JSON.stringify(z)}`)
    await page.evaluate(() => window.speech.discard()); await page.ctx.close()
  }

  /* ---------- 9. forced-colors y prefers-contrast (solo Chromium emula ambos) ---------- */
  if (engine === 'chromium') {
    const page = await open({ forced: 'active' })
    await startConv(page)
    await page.evaluate(() => window.speech.openPanel()); await page.waitForTimeout(250)
    const fc = await page.evaluate(() => {
      const p = document.querySelector('.pg-bar .g-speech-pill'), lamp = p.querySelector('.g-speech-pill__icon'), bar = p.querySelector('.g-speech-meter__bar'), wave = document.querySelector('.g-speech-panel .g-speech-wave__bar[data-on]') || document.querySelector('.g-speech-panel .g-speech-wave__bar')
      const b = document.querySelector('.pg-bar .g-speech-pill__main'); b.focus()
      return { rim: getComputedStyle(p).borderTopWidth + ' ' + getComputedStyle(p).borderTopStyle, rimColor: getComputedStyle(p).borderTopColor, lampBg: getComputedStyle(lamp).backgroundColor, lampFg: getComputedStyle(lamp).color, bar: getComputedStyle(bar).backgroundColor, wave: wave.hasAttribute('data-on') ? getComputedStyle(wave).backgroundColor : getComputedStyle(wave).borderTopColor, panel: getComputedStyle(document.querySelector('.g-speech-panel')).borderTopStyle }
    })
    ok(fc.rim === '2px solid' && !/rgba\(0, 0, 0, 0\)/.test(fc.rimColor) && fc.lampBg !== fc.lampFg && !/rgba\(0, 0, 0, 0\)/.test(fc.lampBg) && !/rgba\(0, 0, 0, 0\)/.test(fc.bar) && !/rgba\(0, 0, 0, 0\)/.test(fc.wave) && fc.panel === 'solid', `chromium forced-colors (viva): borde 2px sólido, lámpara invertida, barras y onda visibles: ${JSON.stringify(fc)}`)
    await page.evaluate(() => window.spAdapter.muteCapture())
    await until(page, () => window.speech.state.status === 'error')
    const fe = await page.evaluate(() => { const p = document.querySelector('.pg-bar .g-speech-pill'); const e = document.querySelector('.g-speech-panel__error > :not(.g-speech-panel__issue)'); return { rim: getComputedStyle(p).borderTopStyle, w: getComputedStyle(p).borderTopWidth, mark: e && getComputedStyle(e).borderInlineStartWidth } })
    ok(fe.rim === 'dashed' && fe.w === '2px' && parseFloat(fe.mark) >= 4, `chromium forced-colors (problema): borde discontinuo 2px y marca de error: ${JSON.stringify(fe)}`)
    await page.evaluate(() => window.speech.discard()); await page.ctx.close()
    const pc = await open({ contrast: 'more' })
    await startConv(pc)
    await pc.evaluate(() => window.speech.pause())
    await until(pc, () => window.speech.state.status === 'paused')
    await pc.evaluate(() => window.speech.openPanel()); await pc.waitForTimeout(200)
    const m = await pc.evaluate(() => {
      const probe = document.createElement('i'); document.body.append(probe)
      const tok = (t) => { probe.style.color = `var(--g-color-${t})`; return getComputedStyle(probe).color }
      const r = { pill: getComputedStyle(document.querySelector('.pg-bar .g-speech-pill')).borderTopColor, control: tok('border-control'), mode: getComputedStyle(document.querySelector('.g-speech-panel__mode')).color, time: getComputedStyle(document.querySelector('.pg-bar .g-speech-pill__time')).color, text: tok('text'), panel: getComputedStyle(document.querySelector('.g-speech-panel')).borderTopColor }
      probe.remove(); return r
    })
    ok(m.pill === m.control && m.mode === m.text && m.time === m.text && m.panel === m.control, `chromium prefers-contrast: more: bordes de control y texto pleno: ${JSON.stringify(m)}`)
    await pc.evaluate(() => window.speech.discard()); await pc.ctx.close()
  }

  /* ---------- 10. GSidebar: barra del ítem activo con acento pálido (#228) ---------- */
  {
    const sbThemes = engine === 'chromium' ? Object.keys(genCss) : ['spotify', 'amazon']
    for (const [name, css] of [['defecto', ''], ...sbThemes.map((t) => [t, genCss[t]])]) {
      for (const dark of [false, true]) {
        const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: dark ? 'dark' : 'light', reducedMotion: 'reduce' })
        await localVue(ctx)
        const page = await ctx.newPage()
        await page.goto(PAGE + '#sec-sidebar')
        await page.waitForSelector('#sec-sidebar .g-sidebar__link.is-active, #sec-sidebar .g-sidebar__link[aria-current="page"]')
        if (css) await page.addStyleTag({ content: css })
        const s = await page.evaluate(() => {
          const parse = (s) => { const m = String(s).match(/rgba?\(([^)]+)\)/); if (m) { const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1] } const n = String(s).match(/color\(srgb ([^)]+)\)/); if (n) { const p = n[1].split(/[\s/]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p[3] ?? 1] } return [0, 0, 0, 0] }
          const over = (t, b) => { const a = t[3]; return [t[0] * a + b[0] * (1 - a), t[1] * a + b[1] * (1 - a), t[2] * a + b[2] * (1 - a), 1] }
          const bgOf = (el) => { const L = []; for (let n = el; n && n.nodeType === 1; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c[3] > 0) { L.push(c); if (c[3] >= 1) break } } let b = parse(getComputedStyle(document.body).backgroundColor); if (b[3] < 1) b = matchMedia('(prefers-color-scheme: dark)').matches ? [0, 0, 0, 1] : [255, 255, 255, 1]; for (let i = L.length - 1; i >= 0; i--) b = over(L[i], b); return b }
          const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
          const ratio = (a, b) => { const x = lum(a), y = lum(b); return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2) }
          return [...document.querySelectorAll('#sec-sidebar .g-sidebar__link.is-active, #sec-sidebar .g-sidebar__link[aria-current="page"]')].filter((l) => l.getClientRects().length).map((l) => { const bg = bgOf(l); return ratio(over(parse(getComputedStyle(l, '::before').backgroundColor), bg), bg) })
        })
        const tag = `${name} ${dark ? 'oscuro' : 'claro'}`
        ok(s.length > 0 && s.every((r) => r >= 3), `${engine} GSidebar ${tag}: barra del ítem activo ≥ 3:1 sobre el ítem: ${JSON.stringify(s)}`)
        agg['GSidebar · barra activa'] ??= {}
        const t = agg['GSidebar · barra activa'][tag]; const mn = Math.min(...s)
        if (!t || mn < t.r) agg['GSidebar · barra activa'][tag] = { r: mn, at: engine }
        await ctx.close()
      }
    }
  }
  await browser.close()
}

ok(errors.length === 0, `consola: ${errors.slice(0, 8).join(' | ')}`)

console.log('Mínimos por medida (tema → mínimo):')
for (const [k, v] of Object.entries(agg).sort()) {
  const lo = Object.entries(v).sort((a, b) => a[1].r - b[1].r)
  console.log(`  ${k}: ${lo[0][1].r} (${lo[0][0]}, ${lo[0][1].at})` + (args.verbose ? '  · ' + lo.map(([t, x]) => `${t} ${x.r}`).join(' · ') : ''))
}
console.log(`\n${total - failed}/${total} comprobaciones correctas` + (failed ? `\nFALLOS:\n- ${fails.join('\n- ')}` : ''))
if (server) server.close()
process.exit(failed ? 1 : 0)
