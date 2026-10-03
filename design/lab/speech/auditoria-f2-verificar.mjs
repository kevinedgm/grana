// Auditoría de coco (paso 5) de la captura de voz F2 sobre los COMPONENTES REALES (GTranscript y los cambios de GSpeechHost
// de bruno, dist/ reconstruido; playground #sec-speech con ?speech=self y el adaptador simulado de @grana/vue/testing).
// Mide speech.md §31: contraste compuesto (texto 4.5:1; marcas, bordes, iconos y foco 3:1) de todas las piezas visibles de
// cada GTranscript (revisión en la página con provisional, panel compacto con provisional, transcript guardado, diálogo de
// respaldo y una vista de auditoría montada con el componente real que reúne corregido con cambios, hablante cambiado,
// eliminado, «Usado en», «Cambió después de insertarlo» sobre fila seleccionada, fallido, «Sin asignar», 13 hablantes y
// speakerColors), con el tema por defecto, dos generados (spotify, acento pálido; lustre) y los tres temas con categorías de
// design/lab/speech/temas-f2/, claro y oscuro; <del>/<ins> por forma; marca cat-k y data-cat; foco de celda visible y no
// tapado al desplazar; una sola parada de tabulación; flechas en RTL; edición en la celda (Intro/F2/Esc) sin pisar
// provisionales; Esc del editor y de un menú no cierran panel ni diálogo; «Más» y apilado por data-narrow bajo space × 160;
// compacto en el panel; «Revisar» con foco al título; diálogo de respaldo (g-speech-review, canales dentro, pantalla completa
// en móvil); inserción en el GForm real con deshacer y «Usado en»; transcript guardado con su región propia; anuncios sin
// texto transcrito; ninguna g-btn__status ni role=status en la rejilla (#257); 320×640 LTR/RTL sin desbordamiento; flip-rtl;
// movimiento reducido y transiciones de la rejilla (rendimiento); prefers-contrast y forced-colors (Chromium); 24/44px;
// consola limpia; .vue/.js sin <style> ni literales.
// Ejecutar desde la raíz del repo con dist/ reconstruido: node design/lab/speech/auditoria-f2-verificar.mjs
// Opcional: --engines=chromium   --origin=http://localhost:4173 (si no responde, servidor propio)   --verbose
import http from 'node:http'
import { readFile, readdir } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')

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
const VUE_GLOBAL = await readFile(join(ROOT, 'node_modules/vue/dist/vue.global.js'))
const localVue = (ctx) => ctx.route(/unpkg\.com\/vue@3/, (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: VUE_GLOBAL }))

const css = {}
for (const n of ['spotify', 'lustre']) css[n] = await readFile(join(ROOT, `design/lab/tema-oscuro/dark-color-presence/generated/${n}.css`), 'utf8')
const CATS = { 'spotify-cat6': 6, 'default-cat12': 12, 'lustre-cat8': 8 }
for (const n of Object.keys(CATS)) css[n] = await readFile(join(ROOT, `design/lab/speech/temas-f2/${n}.css`), 'utf8')

let total = 0, failed = 0
const fails = []
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(msg) } }
const mins = {}
const notes = []
const errors = []

/* ---------- 0. Estático: .vue sin <style>; .vue/.js de la F2 sin literales de tema ---------- */
const TX_DIR = 'packages/vue/src/components/GTranscript'
let fieldFalse = false
{
  const files = []
  for (const f of await readdir(join(ROOT, TX_DIR))) if (/\.(vue|js)$/.test(f) && !/\.test\.js$|TestEnv/.test(f)) files.push(`${TX_DIR}/${f}`)
  for (const f of await readdir(join(ROOT, 'packages/vue/src/components/GSpeechHost'))) if (/\.(vue|js)$/.test(f) && !/\.test\.js$|TestEnv/.test(f)) files.push(`packages/vue/src/components/GSpeechHost/${f}`)
  files.push('packages/vue/src/speech.js')
  for (const f of files) {
    const raw = await readFile(join(ROOT, f), 'utf8')
    if (/GTranscript|TranscriptRow|TranscriptInsert/.test(f) && /:field="false"/.test(raw)) fieldFalse = true
    const src = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/([^:])\/\/.*$/gm, '$1')
    ok(!/<style[\s>]/.test(src), `${f}: lleva <style>`)
    const lit = src.match(/['"`][^'"`\n]*?(#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|\boklch\(|(?<![$\w{])\d+(\.\d+)?(px|rem|em|vh|vw|dvh)\b)[^'"`\n]*['"`]/g)
    ok(!lit, `${f}: literales de tema ${JSON.stringify(lit)}`)
  }
  // GTranscript.css: solo var(--g-*) y alias; las únicas medidas literales permitidas
  // (sin el patrón de texto oculto accesible, la única excepción permitida con 1px)
  const c = (await readFile(join(ROOT, `${TX_DIR}/GTranscript.css`), 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '').replace(/[^{}]*\{[^}]*clip-path: inset\(50%\)[^}]*\}/g, '')
  const bad = c.match(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\boklch\(|var\(--[\w-]+\s*,|(?<![\w-])(?!24px|44px)\d+(\.\d+)?(px|rem|em)\b/g)
  ok(!bad, `GTranscript.css: literales o respaldos ${JSON.stringify(bad)}`)
}

/* ---------- Vista de auditoría: el GTranscript real con todos los estados de fila y 13 hablantes ---------- */
const AU = {
  id: 'auditoria', mode: 'conversation', expectedSpeakers: 'many', createdAt: '2026-10-02T10:00:00.000Z',
  speakers: Array.from({ length: 13 }, (_, i) => ({ id: 'spk_' + i, role: i === 0 ? 'pro' : i === 1 ? 'pac' : null, mergedInto: null, origin: 'engine' })),
  segments: [
    { id: 'a0', t0: 0, t1: 2000, literal: 'Buenos días, cuénteme qué le pasa.', engineSpeaker: 'spk_0' },
    { id: 'a1', t0: 2100, t1: 4000, literal: 'Me duele la cabesa desde el lunes por la mañana.', corrected: 'Me duele la cabeza desde el lunes.', engineSpeaker: 'spk_1' },
    { id: 'a2', t0: 4100, t1: 5000, literal: 'Eh, bueno, pues.', removed: true, engineSpeaker: 'spk_2' },
    { id: 'a3', t0: 5100, t1: 7000, literal: '¿Ha tomado algo para el dolor?', speaker: 'spk_0', engineSpeaker: 'spk_3' },
    { id: 'a4', t0: 7100, t1: 9000, literal: 'Un paracetamol cada ocho horas.', engineSpeaker: 'spk_4' },
    { id: 'a5', t0: 9100, t1: 11000, literal: 'Mantenemos el tratamiento dos semanas.', corrected: 'Mantenemos el tratamiento tres semanas.', engineSpeaker: 'spk_5' },
    ...Array.from({ length: 7 }, (_, i) => ({ id: 'a' + (6 + i), t0: 11100 + i * 2000, t1: 12900 + i * 2000, literal: 'Intervención número ' + (6 + i) + ' de la consulta.', engineSpeaker: 'spk_' + (6 + i) })),
    { id: 'a13', t0: 26000, t1: 28000, literal: 'Fragmento sin hablante del motor.', engineSpeaker: null },
    { id: 'a14', t0: 28100, t1: 30000, literal: '', failed: true, engineSpeaker: null }
  ],
  derived: [{ id: 'd1', kind: 'insert', createdBy: 'user', at: '2026-10-02T10:10:00.000Z', target: { id: 'plan', label: 'Plan' }, position: 'end', sourceSegmentIds: ['a4', 'a5'], text: 'Un paracetamol cada ocho horas. Mantenemos el tratamiento dos semanas.', sources: { a4: 'Un paracetamol cada ocho horas.', a5: 'Mantenemos el tratamiento dos semanas.' } }]
}
const mountAudit = (cfg) => {
  const sec = document.createElement('section')
  sec.id = 'au-host'
  sec.innerHTML = '<h3 id="au-title">Vista de auditoría</h3><div id="au-mount"></div>'
  document.querySelector('#sec-speech').append(sec)
  window.__auTx = GranaSpeech.createTranscript(cfg.data)
  const { createApp, h } = Vue
  window.__auApp = createApp({ render: () => h(GranaSpeech.GTranscript, { id: 'au-tx', transcript: window.__auTx, speech: window.speech, labelledby: 'au-title', speakerColors: cfg.colors, maxHeight: '640px' }) })
  window.__auApp.mount('#au-mount')
}

/* ---------- Contraste compuesto de todas las piezas visibles de cada GTranscript ---------- */
const contrast = () => {
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
  const text = (id, what, el, min = 4.5) => { if (!vis(el) || !el.textContent.trim()) return; const bg = bgOf(el); add(id, what, ratio(over(parse(getComputedStyle(el).color), bg), bg), min) }
  const paint = (id, what, el, prop, against, min = 3) => { if (!vis(el)) return; const bg = against || bgOf(el); add(id, what, ratio(over(parse(getComputedStyle(el)[prop]), bg), bg), min) }
  for (const root of document.querySelectorAll('.g-transcript')) {
    if (!vis(root)) continue
    const id = root.closest('.g-speech-review') ? 'diálogo' : root.closest('.g-speech-panel') ? 'panel' : root.id || 'transcript'
    for (const [sel, what] of [['.g-transcript__row:not(.is-partial):not(.is-removed) .g-transcript__text', 'texto'], ['.is-partial .g-transcript__text', 'PROVISIONAL'], ['.is-removed .g-transcript__text', 'eliminado (tachado)'],
      ['.g-transcript__cell--time', 'hora'], ['.g-transcript__time', 'hora (lista)'], ['.g-transcript__flag', 'marca'], ['.g-transcript__count', 'contador'], ['.g-transcript__kbd', 'ayuda de teclado'],
      ['.g-transcript__note', 'aviso sin diarización'], ['.g-transcript__empty', 'vacío'], ['.g-transcript__orig > p', 'original'], ['.g-transcript__diff', 'cambios'], ['.g-transcript__diff del', '<del>'], ['.g-transcript__diff ins', '<ins>'],
      ['.g-transcript__editor-orig', 'original del editor'], ['.g-transcript__editor-hint', 'ayuda del editor'], ['.g-transcript__field', 'editor (texto)'], ['.g-transcript__speaker', 'hablante'],
      ['.g-transcript__mark:not([data-cat])', 'letra de la marca'], ['.g-transcript__mark[data-cat]', 'letra de la marca cat-k'],
      ['.g-transcript__speakers > p', 'ayuda del gestor'], ['.g-transcript__speakers > :is(h2,h3,h4,h5,h6)', 'título del gestor'], ['.g-transcript__insert > :is(h2,h3,h4,h5,h6)', 'título de la inserción'], ['.g-transcript__speaker-row > span:not([class])', 'secundario del gestor'],
      ['.g-transcript__insert > p:not([class])', 'rótulo de la vista previa'], ['.g-transcript__preview', 'vista previa'], ['.g-transcript__result > span', 'resultado'], ['.g-transcript__uses li > span', 'uso'], ['.g-transcript__uses summary', 'usos'],
      ['.g-transcript__item:not(.is-partial) .g-transcript__text', 'texto (lista)'], ['.g-transcript__list .g-transcript__speaker', 'hablante (lista)']]) {
      for (const el of root.querySelectorAll(sel)) text(id, what, el)
    }
    for (const b of root.querySelectorAll('.g-btn')) {
      if (!vis(b) || b.getAttribute('aria-disabled') === 'true' || b.disabled) continue
      const lab = b.querySelector('.g-btn__label')
      if (lab && lab.textContent.trim()) text(id, 'texto de botón', b)
      const svg = b.querySelector('svg'); if (svg) paint(id, 'icono de botón', svg, 'color', bgOf(b))
      if (b.matches('.g-btn--variant-outline')) paint(id, 'borde de botón outline', b, 'borderTopColor', bgOf(b.parentElement))
    }
    for (const b of root.querySelectorAll('.g-btn[aria-disabled="true"]')) text(id, 'botón aria-disabled (informativo)', b, 0)
    for (const el of root.querySelectorAll('.g-transcript__flag > svg')) paint(id, 'icono de marca', el, 'color')
    for (const el of root.querySelectorAll('.g-transcript__result > svg')) paint(id, 'icono del resultado', el, 'color')
    for (const el of root.querySelectorAll('.g-transcript__flag--partial')) paint(id, 'borde «Provisional»', el, 'borderTopColor')
    for (const el of root.querySelectorAll('.g-transcript__field')) paint(id, 'borde del editor', el, 'borderTopColor', bgOf(el.parentElement))
    // Casilla sin marcar: su borde (3:1). Marcada o mixta: la marca sobre el relleno (3:1, como la auditoría de GCheckbox); el
    // relleno frente a la página depende de `primary` del tema y se anota aparte (informativo, no es de la F2)
    for (const el of root.querySelectorAll('.g-checkbox__input')) {
      if (!el.checked && !el.indeterminate) { paint(id, 'borde de casilla', el, 'borderTopColor', bgOf(el.closest('.g-checkbox').parentElement)); continue }
      const fill = over(parse(getComputedStyle(el).backgroundColor), bgOf(el.closest('.g-checkbox').parentElement))
      const mk = el.parentElement.querySelector(el.checked ? '.g-checkbox__check' : '.g-checkbox__dash')
      if (mk) add(id, 'marca sobre el relleno de la casilla', ratio(over(parse(getComputedStyle(mk).color), fill), fill), 3)
      add(id, 'relleno de casilla marcada / fuera (informativo)', ratio(fill, bgOf(el.closest('.g-checkbox').parentElement)), 0)
    }
    for (const el of root.querySelectorAll('.g-transcript__mark')) {
      const outside = bgOf(el.parentElement), sel = el.closest('.is-selected') ? ' (fila seleccionada)' : ''
      paint(id, (el.dataset.cat ? 'borde de marca cat-k' : el.classList.contains('is-unassigned') ? 'borde «Sin asignar»' : 'borde de marca') + sel, el, 'borderTopColor', outside)
    }
    for (const r of root.querySelectorAll('.g-transcript__row.is-selected')) {
      const c = parse(getComputedStyle(r).borderInlineStartColor)
      add(id, 'borde de la fila seleccionada / fila', ratio(over(c, bgOf(r)), bgOf(r)), 3)
      add(id, 'borde de la fila seleccionada / fuera', ratio(over(c, bgOf(r.parentElement)), bgOf(r.parentElement)), 3)
      const st = r.querySelector('.g-transcript__flag--stale')
      if (st) { text(id, '«Cambió después» sobre fila seleccionada', st); paint(id, 'icono «Cambió después» sobre fila seleccionada', st.querySelector('svg'), 'color') }
    }
    for (const r of root.querySelectorAll('.g-transcript__row.is-failed, .g-transcript__item.is-failed')) paint(id, 'marca de fallido', r, 'borderInlineStartColor', bgOf(r))
    for (const r of [root.querySelector('.g-transcript__row:not(.is-selected)'), root.querySelector('.g-transcript__row.is-selected')]) {
      if (!r || !vis(r)) continue
      const cell = r.querySelector('.g-transcript__cell--text'), probe = document.createElement('span'); probe.style.color = 'var(--g-color-focus)'; cell.append(probe)
      add(id, r.classList.contains('is-selected') ? 'foco / fila seleccionada' : 'foco / fila', ratio(over(parse(getComputedStyle(probe).color), bgOf(r)), bgOf(r)), 3); probe.remove()
    }
  }
  for (const b of document.querySelectorAll('.g-speech-panel__controls .g-btn')) { if (vis(b) && /Revisar/.test(b.textContent)) { text('panel', '«Revisar»', b); paint('panel', 'icono «Revisar»', b.querySelector('svg'), 'color', bgOf(b)) } }
  return out
}

const until = (page, fn, arg, timeout = 20000) => page.waitForFunction(fn, arg, { timeout, polling: 50 })
const LIVE = /listening|speech|transcribing/
const settle = (page, ms = 150) => page.evaluate((t) => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, t)))), ms)
const noOverflow = () => {
  const de = document.scrollingElement, bad = []
  if (de.scrollWidth > innerWidth + 1) bad.push('página ' + de.scrollWidth)
  for (const el of document.querySelectorAll('.g-transcript, .g-transcript__bar, .g-transcript__scroll, .g-transcript__row, .g-transcript__insert, .g-transcript__speakers, .g-speech-panel, dialog[open], .g-menu__list')) {
    if (!el.getClientRects().length || el.closest('[hidden]')) continue
    if (el.scrollWidth > el.clientWidth + 1) bad.push((el.id || el.className.split(' ')[0]) + ' ' + el.scrollWidth + '>' + el.clientWidth)
    const r = el.getBoundingClientRect(); if (r.right > innerWidth + 1 || r.left < -1) bad.push('fuera del visor ' + (el.id || el.className.split(' ')[0]) + ' ' + Math.round(r.left) + '…' + Math.round(r.right))
  }
  return bad
}
// Anuncios: se anotan todos los textos de los canales (anfitrión y región propia) y cualquier texto en otra región viva
const watchLive = () => {
  window.__ann = []; window.__noise = []
  const scan = () => {
    for (const el of document.querySelectorAll('.g-speech-host__live, .g-transcript__live')) { const t = el.textContent.trim(); if (t && window.__ann[window.__ann.length - 1] !== t) window.__ann.push(t) }
    for (const el of document.querySelectorAll('.g-transcript [role="status"], .g-transcript [role="alert"], .g-transcript [aria-live]:not([aria-live="off"])')) {
      if (el.classList.contains('g-transcript__live')) continue
      if (el.textContent.trim()) window.__noise.push(el.className + ': ' + el.textContent.trim().slice(0, 30))
    }
  }
  new MutationObserver(scan).observe(document.body, { subtree: true, childList: true, characterData: true })
}

for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  const open = async ({ width = 1280, height = 900, dark = false, theme = '', rtl = false, forced, contrast: pc, touch = false, reduced = true, audit = null } = {}) => {
    const ctx = await browser.newContext({ viewport: { width, height }, colorScheme: dark ? 'dark' : 'light', reducedMotion: reduced ? 'reduce' : 'no-preference', hasTouch: touch, isMobile: touch && engine === 'chromium' })
    await localVue(ctx)
    const page = await ctx.newPage()
    page.on('console', (m) => { const t = m.text(); if ((m.type() === 'error' && !/favicon/.test(t)) || (m.type() === 'warning' && /\[Vue warn\]|\[Grana/.test(t))) errors.push(`${engine}: ${m.type()} ${t.slice(0, 200)}`) })
    page.on('pageerror', (e) => errors.push(`${engine}: pageerror ${e.message}`))
    if (forced || pc) await page.emulateMedia({ ...(forced ? { forcedColors: forced } : {}), ...(pc ? { contrast: pc } : {}) })
    await page.goto(PAGE + '?speech=self#sec-speech')
    await page.waitForFunction(() => window.speech && document.querySelector('.g-speech-host') && document.querySelector('#sp-saved .g-transcript__row'))
    if (theme) await page.addStyleTag({ content: theme })
    if (rtl) await page.evaluate(() => { document.documentElement.dir = 'rtl' })
    if (audit) { await page.evaluate(mountAudit, audit); await page.waitForSelector('#au-tx .g-transcript__row') }
    await page.evaluate(() => document.fonts.ready)
    await page.evaluate(watchLive)
    page.ctx = ctx
    return page
  }
  const sec = async (fn) => { try { await fn() } catch (e) { ok(false, `${engine} sección interrumpida: ${String(e.message).split('\n')[0]} ${String(e.stack).split('\n').find((x) => x.includes('auditoria-f2')) || ''}`) } }
  const record = (tag, rows) => {
    for (const r of rows) {
      ok(r.r >= r.min, `${engine} ${tag} ${r.id} ${r.what}: ${r.r} < ${r.min}`)
      const k = `${r.what} (${r.min})`
      if (!mins[k] || r.r < mins[k].r) mins[k] = { r: r.r, where: `${engine} ${tag} ${r.id}` }
    }
    return rows
  }
  const startConv = async (page, n = 2) => {
    await page.evaluate(() => window.speech.start({ mode: 'conversation' }))
    await until(page, (re) => new RegExp(re).test(window.speech.state.status), LIVE.source)
    await until(page, (k) => window.speech.state.transcript && window.speech.state.transcript.segments.length >= k, n, 40000)
  }
  // Prepara la vista de auditoría: dos filas seleccionadas (una con «Cambió después»), cambios visibles, gestor abierto, editor abierto
  const dressAudit = async (page) => {
    await page.locator('#au-tx .g-transcript__row[data-id="a0"] .g-checkbox__input').check()
    await page.locator('#au-tx .g-transcript__row[data-id="a5"] .g-checkbox__input').check()
    await page.locator('#au-tx .g-transcript__bar .g-btn', { hasText: 'Mostrar cambios' }).click()
    await page.locator('#au-tx .g-transcript__bar .g-btn', { hasText: 'Hablantes' }).click()
    await page.locator('#au-tx .g-transcript__row[data-id="a6"] .g-transcript__cell--text').dblclick()
    await page.waitForSelector('#au-tx textarea.g-transcript__field')
    await settle(page, 200)
  }

  /* ---------- 1. Contraste por tema ---------- */
  const themes = engine === 'chromium' ? ['defecto', 'spotify', 'lustre', ...Object.keys(CATS)] : ['defecto', 'spotify', 'spotify-cat6']
  for (const name of themes) {
    for (const dark of [false, true]) {
      const tag = `${name} ${dark ? 'oscuro' : 'claro'}`
      const colors = CATS[name] || 0
      const page = await open({ dark, theme: css[name] || '', audit: { data: AU, colors } })
      ok(await page.evaluate((d) => { const c = getComputedStyle(document.body).backgroundColor.match(/[\d.]+/g).map(Number); const l = (c[0] + c[1] + c[2]) / 3; return d ? l < 80 : l > 180 }, dark), `${engine} ${tag}: el esquema ${dark ? 'oscuro' : 'claro'} se aplica`)
      // data-cat solo con k ≤ speakerColors; «Sin asignar» sin letra
      const cats = await page.evaluate(() => [...document.querySelectorAll('#au-tx .g-transcript__row .g-transcript__mark')].map((m) => ({ id: m.closest('.g-transcript__row').dataset.id, cat: m.dataset.cat || null, letter: m.textContent.trim(), un: m.classList.contains('is-unassigned') })))
      const want = (row) => { const k = Number(row.id.slice(1)); if (row.id === 'a13') return null; if (row.id === 'a3') return colors >= 1 ? '1' : null; return k + 1 <= colors ? String(k + 1) : null }
      ok(cats.length >= 14 && cats.every((c) => c.cat === want(c)), `${engine} ${tag}: data-cat solo con k ≤ speakerColors (${colors}): ${JSON.stringify(cats.filter((c) => c.cat !== want(c)))}`)
      const un = cats.find((c) => c.id === 'a13')
      ok(un && un.un && un.letter === '', `${engine} ${tag}: «Sin asignar» con is-unassigned y sin letra: ${JSON.stringify(un)}`)
      await dressAudit(page)
      let rows = record(tag + ' [auditoría]', await page.evaluate(contrast))
      ok(rows.some((r) => r.what === '«Cambió después» sobre fila seleccionada') && rows.some((r) => r.what === 'borde «Sin asignar»') && rows.some((r) => r.what === '<del>') && rows.some((r) => r.what === 'eliminado (tachado)'), `${engine} ${tag}: piezas clave medidas en la vista de auditoría`)
      if (colors) ok(rows.filter((r) => r.what.startsWith('borde de marca cat-k')).length >= colors, `${engine} ${tag}: marcas cat-k medidas`)
      // Sesión: provisional en la revisión de la página y en el panel compacto
      await page.evaluate(() => { const t = document.querySelector('#au-tx textarea'); t && t.blur() })
      await startConv(page, 2)
      await page.evaluate(() => window.speech.openPanel())
      let prov = { page: false, panel: false }
      for (let i = 0; i < 40 && !(prov.page && prov.panel); i++) {
        await until(page, () => document.querySelector('#sp-review .g-transcript__row.is-partial') || document.querySelector('.g-speech-panel .g-transcript__row.is-partial'), null, 20000)
        rows = record(tag + ' [sesión]', await page.evaluate(contrast))
        prov.page ||= rows.some((r) => r.id === 'sp-review' && r.what === 'PROVISIONAL')
        prov.panel ||= rows.some((r) => r.id === 'panel' && r.what === 'PROVISIONAL')
        if (!(prov.page && prov.panel)) await page.waitForTimeout(150)
      }
      ok(prov.page && prov.panel, `${engine} ${tag}: provisional medido en la página y en el panel: ${JSON.stringify(prov)}`)
      ok(rows.some((r) => r.what === '«Revisar»'), `${engine} ${tag}: «Revisar» medido en el panel`)
      // Diálogo de respaldo
      await page.evaluate(() => window.speech.pause())
      await page.locator('#sp-page-review').uncheck()
      await page.evaluate(() => window.speech.openPanel())
      await page.locator('.g-speech-panel__controls .g-btn', { hasText: 'Revisar' }).click()
      await page.waitForSelector('dialog.g-speech-review[open] .g-transcript__row')
      await settle(page, 200)
      rows = record(tag + ' [diálogo]', await page.evaluate(contrast))
      ok(rows.filter((r) => r.id === 'diálogo').length > 20, `${engine} ${tag}: diálogo de respaldo medido`)
      await page.evaluate(() => window.speech.discard())
      await page.ctx.close()
    }
  }

  /* ---------- 2. <del>/<ins> por forma, envoltura oculta, eliminado tachado ---------- */
  await sec(async () => {
    const page = await open({ audit: { data: AU, colors: 0 } })
    await page.locator('#au-tx .g-transcript__bar .g-btn', { hasText: 'Mostrar cambios' }).click()
    const di = await page.evaluate(() => {
      const d = document.querySelector('#au-tx .g-transcript__diff del'), i = document.querySelector('#au-tx .g-transcript__diff ins')
      const cd = getComputedStyle(d), ci = getComputedStyle(i)
      return { del: cd.textDecorationLine, ins: ci.textDecorationLine, dt: parseFloat(cd.textDecorationThickness), it: parseFloat(ci.textDecorationThickness), dsr: d.querySelector('.g-transcript__sr')?.textContent, isr: i.querySelector('.g-transcript__sr')?.textContent, rm: getComputedStyle(document.querySelector('#au-tx .is-removed .g-transcript__text')).textDecorationLine, pressed: document.querySelector('#au-tx .g-transcript__bar .g-btn[aria-pressed="true"]') !== null }
    })
    ok(di.del.includes('line-through') && !di.del.includes('underline') && di.ins.includes('underline') && !di.ins.includes('line-through') && di.dt >= 2 && di.it >= 2 && di.dsr && di.isr && di.rm.includes('line-through') && di.pressed, `${engine} del/ins por forma (tachado / subrayado ≥ 2px), envoltura oculta, eliminado tachado, «Mostrar cambios» pulsado: ${JSON.stringify(di)}`)

    /* ---------- 3. «Más» y apilado por data-narrow bajo space × 160 ---------- */
    const th = await page.evaluate(async () => {
      const probe = document.createElement('div'); probe.style.inlineSize = 'calc(var(--g-space-1) * 160)'; document.body.append(probe); const at = probe.getBoundingClientRect().width; probe.remove()
      const mount = document.getElementById('au-mount'), root = document.getElementById('au-tx')
      const wait = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 50))))
      const res = { at }
      for (const [k, w] of [['below', at - 2], ['above', at + 2]]) {
        mount.style.inlineSize = w + 'px'; await wait()
        const row = root.querySelector('.g-transcript__row[data-id="a0"]'), text = row.querySelector('.g-transcript__cell--text').getBoundingClientRect(), time = row.querySelector('.g-transcript__cell--time').getBoundingClientRect()
        res[k] = { w: Math.round(root.getBoundingClientRect().width), narrow: root.hasAttribute('data-narrow'), more: !!root.querySelector('.g-transcript__more'), copyInBar: [...root.querySelectorAll('.g-transcript__bar > .g-btn, .g-transcript__bar .g-btn')].some((b) => /Copiar/.test(b.textContent)), stacked: text.top >= time.bottom - 1 }
      }
      mount.style.inlineSize = ''
      return res
    })
    ok(th.below.narrow && th.below.more && th.below.stacked && !th.below.copyInBar && !th.above.narrow && !th.above.more && !th.above.stacked && th.above.copyInBar, `${engine} «Más» y apilado justo bajo space × 160 (${th.at}px) y no por encima: ${JSON.stringify(th)}`)
    // «Más» abierto: cuatro elementos (Copiar ×2, Mostrar cambios como menuitemcheckbox, Hablantes)
    await page.evaluate((w) => { document.getElementById('au-mount').style.inlineSize = w + 'px' }, th.at - 40)
    await settle(page)
    await page.locator('#au-tx .g-transcript__more').click()
    const mm = await page.evaluate(() => { const m = [...document.querySelectorAll('[role="menu"]')].find((x) => x.getClientRects().length); return m && [...m.querySelectorAll('[role^="menuitem"]')].map((i) => i.getAttribute('role')) })
    ok(mm && mm.length === 4 && mm.includes('menuitemcheckbox'), `${engine} «Más»: Copiar ×2, Mostrar cambios (menuitemcheckbox) y Hablantes: ${JSON.stringify(mm)}`)
    await page.keyboard.press('Escape')
    ok(await page.evaluate(() => document.activeElement.classList.contains('g-transcript__more')), `${engine} Esc en «Más» devuelve el foco a su botón`)
    await page.evaluate(() => { document.getElementById('au-mount').style.inlineSize = '' })

    /* ---------- 4. Objetivos 24px (puntero fino) y transiciones de la rejilla ---------- */
    const tg = await page.evaluate(() => {
      let small = [], n = 0
      for (const b of document.querySelectorAll('.g-transcript .g-btn')) { if (!b.getClientRects().length || b.closest('[hidden]')) continue; n++; const a = getComputedStyle(b, '::after'), r = b.getBoundingClientRect(); const w = Math.max(r.width, parseFloat(a.width) || 0), h = Math.max(r.height, parseFloat(a.height) || 0); if (Math.min(w, h) < 24) small.push(b.textContent.trim().slice(0, 20) + ' ' + w + '×' + h) }
      for (const c of document.querySelectorAll('.g-transcript .g-checkbox')) { if (!c.getClientRects().length) continue; n++; const r = (c.querySelector('.g-checkbox__row') || c).getBoundingClientRect(); if (Math.min(r.width, r.height) < 24) small.push('casilla ' + r.width + '×' + r.height) }
      const row = document.querySelector('#au-tx .g-transcript__row'), inp = row.querySelector('.g-checkbox__input'), cs = getComputedStyle(inp)
      const tr = { row: getComputedStyle(row).transitionDuration, box: getComputedStyle(row.querySelector('.g-checkbox__box')).transitionDuration, mark: getComputedStyle(row.querySelector('.g-checkbox__mark')).transitionDuration, input: cs.transitionProperty, all: getComputedStyle(document.querySelector('#au-tx .g-transcript__bar .g-checkbox__input')).transitionProperty }
      return { n, small, tr }
    })
    ok(tg.n > 40 && tg.small.length === 0, `${engine} objetivos ≥ 24px: ${JSON.stringify({ n: tg.n, small: tg.small.slice(0, 5) })}`)
    ok(/^0s(, 0s)*$/.test(tg.tr.row) && /^0s(, 0s)*$/.test(tg.tr.box) && /^0s(, 0s)*$/.test(tg.tr.mark) && !/background|border-color|scale/.test(tg.tr.input) && /background/.test(tg.tr.all), `${engine} rejilla sin fundidos de fila ni de casilla (solo el anillo), «Seleccionar todo» de la barra sin cambio: ${JSON.stringify(tg.tr)}`)

    /* ---------- 5. Una parada; foco visible y no tapado al desplazar; flechas ---------- */
    await page.locator('#sp-long-320').click()
    await until(page, () => document.querySelectorAll('#sp-saved .g-transcript__row').length === 320)
    await page.locator('#sp-saved').scrollIntoViewIfNeeded()
    const nw = await page.evaluate(() => document.querySelector('#sp-saved .g-transcript__newer')?.textContent.trim() || null)
    ok(nw === null, `${engine} cambiar de transcript no pinta «N fragmentos nuevos» (§22.1, §22.7): ${nw}`)
    await page.locator('#sp-saved .g-transcript__bar .g-btn').last().focus()
    await page.keyboard.press('Tab')
    const tab1 = await page.evaluate(() => { const a = document.activeElement; return a.closest('#sp-saved [role="grid"]') ? 'rejilla' : a.tagName + '.' + String(a.className).split(' ')[0] })
    ok(tab1 === 'rejilla', `${engine} un Tab desde la barra entra en la rejilla (el área desplazable no es una parada): ${tab1}`)
    // Para seguir con el resto de comprobaciones aunque haya una parada de más, se entra con la parada de la rejilla
    await page.locator('#sp-saved [role="grid"] [tabindex="0"]').focus()
    await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowUp')
    const steps = ['ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowLeft', 'ArrowLeft', 'ArrowRight', 'End', 'Home', 'PageDown', 'PageDown', 'PageDown', 'ControlOrMeta+End', 'ArrowUp', 'ArrowRight', 'ArrowRight', 'PageUp', 'ControlOrMeta+Home', 'ArrowRight', 'ArrowRight']
    const bad = []
    for (const k of steps) {
      await page.keyboard.press(k)
      await settle(page, 30)
      const f = await page.evaluate(() => {
        const el = document.activeElement, grid = el.closest('[role="grid"]'), sc = el.closest('.g-transcript__scroll')
        if (!grid || !sc) return { lost: el.tagName + '.' + el.className }
        const ring = el.matches('.g-checkbox__input') ? el : el
        const cs = getComputedStyle(ring), r = el.getBoundingClientRect(), sr = sc.getBoundingClientRect()
        const reach = Math.max(0, (parseFloat(cs.outlineOffset) || 0) + (parseFloat(cs.outlineWidth) || 0))
        const hit = document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2)
        return { col: el.dataset.focus, stops: grid.querySelectorAll('[tabindex="0"]').length, fv: el.matches(':focus-visible'), style: cs.outlineStyle, w: parseFloat(cs.outlineWidth), inside: r.top - reach >= sr.top - 0.5 && r.bottom + reach <= sr.bottom + 0.5 && r.left - reach >= sr.left - 0.5 && r.right + reach <= sr.right + 0.5, visible: !!hit && (el === hit || el.contains(hit) || (el.labels && [...el.labels].some((l) => l.contains(hit))) || hit.closest('.g-checkbox') === el.closest('.g-checkbox')), inView: r.top >= 0 && r.bottom <= innerHeight }
      })
      if (f.lost || f.stops !== 1 || !f.fv || f.style === 'none' || f.w < 2 || !f.inside || !f.visible) bad.push(k + ' ' + JSON.stringify(f))
    }
    ok(bad.length === 0, `${engine} 320 filas: una parada, foco visible (sólido ≥ 2px, :focus-visible), dentro del área desplazable y sin tapar tras cada tecla: ${bad.slice(0, 4).join(' | ')}`)
    // Abrir y cerrar el menú de acciones no rompe la parada única
    await page.keyboard.press('End')
    await page.keyboard.press('Enter')
    await until(page, () => [...document.querySelectorAll('[role="menu"]')].some((m) => m.getClientRects().length))
    await page.keyboard.press('Escape')
    await settle(page)
    const mf = await page.evaluate(() => ({ back: document.activeElement.dataset.focus, stops: document.querySelectorAll('#sp-saved [role="grid"] [tabindex="0"]').length }))
    ok(mf.back === 'actions' && mf.stops === 1, `${engine} menú de fila: Esc vuelve al botón y sigue una sola parada: ${JSON.stringify(mf)}`)
    // Regiones: ninguna g-btn__status ni role=status en la rejilla; región propia única (sin sesión)
    const rg = await page.evaluate(() => ({ btn: document.querySelectorAll('.g-transcript .g-btn__status').length, status: document.querySelectorAll('.g-transcript [role="grid"] [role="status"], .g-transcript [role="grid"] [role="alert"]').length, live: document.querySelectorAll('.g-transcript [role="grid"] [aria-live]').length, own: document.querySelectorAll('#sp-saved .g-transcript__live[role="status"]').length }))
    ok(rg.btn === 0 && rg.status === 0 && rg.own === 1, `${engine} sin g-btn__status ni role=status en la rejilla; una región propia en el transcript guardado: ${JSON.stringify(rg)}`)
    if (fieldFalse) ok(rg.live === 0, `${engine} sin aria-live en la rejilla (GCheckbox field=false, #262): ${rg.live}`)
    else notes.push(`${engine}: ${rg.live} regiones aria-live de GCheckbox (g-checkbox__message) en la rejilla con 320 filas: resuelto por #262 (field: false), pendiente de bruno`)
    await page.ctx.close()
  })

  /* ---------- 6. RTL: flechas invertidas, flip-rtl, marcas al inicio ---------- */
  await sec(async () => {
    const page = await open({ rtl: true, audit: { data: AU, colors: 0 } })
    await page.locator('#au-tx .g-transcript__row[data-id="a0"] .g-checkbox__input').check()
    await page.locator('#au-tx .g-transcript__row[data-id="a0"] .g-transcript__cell--text').focus()
    await page.keyboard.press('ArrowRight')
    const col = await page.evaluate(() => document.activeElement.dataset.focus)
    // Una inserción para que aparezca «Deshacer inserción»
    await page.locator('#au-tx .g-transcript__insert .g-btn', { hasText: /Insertar en/ }).click()
    await page.waitForSelector('#au-tx .g-transcript__result')
    const rt = await page.evaluate(() => {
      const flip = (b) => { const s = b && b.querySelector('svg'); return s ? { cls: s.classList.contains('g-icon--flip-rtl'), scale: getComputedStyle(s).scale } : null }
      const btn = (re, root) => [...root.querySelectorAll('.g-btn')].find((b) => re.test(b.textContent))
      const bar = document.querySelector('#au-tx .g-transcript__bar'), sel = getComputedStyle(document.querySelector('#au-tx .g-transcript__row.is-selected'))
      const row = document.querySelector('#au-tx .g-transcript__row'), act = row.querySelector('.g-transcript__cell--actions').getBoundingClientRect(), text = row.querySelector('.g-transcript__cell--text').getBoundingClientRect()
      const others = ['Ir al final', 'Unir', 'Separar'].map((t) => btn(new RegExp(t), document.querySelector('#au-tx'))).filter(Boolean).map(flip)
      return { undo: flip(btn(/^Deshacer$/, bar)), redo: flip(btn(/^Rehacer$/, bar)), undoInsert: flip(btn(/Deshacer inserción/, document.querySelector('#au-tx .g-transcript__result'))), selRight: parseFloat(sel.borderRightWidth) >= 2 && parseFloat(sel.borderLeftWidth) === 0, actLeft: act.right <= text.left + 1, others }
    })
    const mirrored = (f) => f && f.cls && /^-1/.test(f.scale)
    ok(col === 'speaker', `${engine} RTL: → va a la columna anterior (hablante): ${col}`)
    ok(mirrored(rt.undo) && mirrored(rt.redo) && mirrored(rt.undoInsert), `${engine} RTL: flip-rtl en Deshacer, Rehacer y «Deshacer inserción» (#261, #263): ${JSON.stringify(rt)}`)
    ok(rt.selRight && rt.actLeft, `${engine} RTL: marca de selección a la derecha, acciones a la izquierda: ${JSON.stringify(rt)}`)
    await page.locator('#au-tx .g-transcript__result .g-btn', { hasText: 'Deshacer inserción' }).click()
    await page.ctx.close()
  })

  /* ---------- 7. Sesión: edición en la celda sin pisar provisionales; Esc; compacto en el panel; «Revisar» ---------- */
  await sec(async () => {
    const page = await open()
    await page.locator('#sec-speech').scrollIntoViewIfNeeded()
    await startConv(page, 2)
    await page.locator('#sp-review [role="grid"] [tabindex="0"]').focus()
    await page.keyboard.press('ControlOrMeta+Home')
    for (const k of ['ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowRight', 'Home']) await page.keyboard.press(k)
    // A la celda de texto (columnas: casilla, hora, hablante, texto)
    for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight')
    const c0 = await page.evaluate(() => document.activeElement.dataset.focus)
    await page.keyboard.press('F2')
    await page.waitForSelector('#sp-review textarea.g-transcript__field')
    await page.keyboard.press('End')
    await page.keyboard.type(' (borrador)')
    const before = await page.evaluate(() => { const t = document.activeElement; return { tag: t.tagName, v: t.value, s: t.selectionStart, n: window.speech.state.transcript.segments.length } })
    // Llegan ≥ 2 confirmados y varios provisionales con el editor abierto
    let partials = 0
    await page.evaluate(() => { window.__parts = 0; const tx = window.speech.state.transcript; let last = ''; window.__pi = setInterval(() => { const p = tx.partial && tx.partial.text; if (p && p !== last) { last = p; window.__parts++ } }, 20) })
    await until(page, (n) => window.speech.state.transcript.segments.length >= n + 2 && window.__parts >= 3, before.n, 40000)
    partials = await page.evaluate(() => { clearInterval(window.__pi); return window.__parts })
    const after = await page.evaluate(() => { const t = document.activeElement; return { tag: t.tagName, v: t.value, s: t.selectionStart, stops: document.querySelectorAll('#sp-review [role="grid"] [tabindex="0"]').length } })
    ok(c0 === 'text' && before.tag === 'TEXTAREA' && after.tag === 'TEXTAREA' && after.v === before.v && after.s === before.s && after.stops === 1, `${engine} editor abierto mientras llegan 2 confirmados y ${partials} provisionales: foco, borrador y cursor intactos: ${JSON.stringify({ c0, before, after })}`)
    // Esc cancela sin guardar y vuelve a la celda; Intro reabre; Intro guarda
    await page.keyboard.press('Escape')
    const esc = await page.evaluate(() => ({ focus: document.activeElement.dataset.focus, editor: !!document.querySelector('#sp-review textarea'), changed: window.speech.state.transcript.segments.some((s) => s.corrected && s.corrected.includes('(borrador)')) }))
    ok(esc.focus === 'text' && !esc.editor && !esc.changed, `${engine} Esc en el editor cancela y vuelve a la celda: ${JSON.stringify(esc)}`)
    await page.keyboard.press('Enter')
    await page.waitForSelector('#sp-review textarea.g-transcript__field')
    await page.keyboard.press('End'); await page.keyboard.type(' revisado')
    await page.keyboard.press('Enter')
    const saved = await page.evaluate(() => ({ focus: document.activeElement.dataset.focus, fv: document.activeElement.matches(':focus-visible'), ok: window.speech.state.transcript.segments.some((s) => s.corrected && s.corrected.endsWith(' revisado')) }))
    ok(saved.focus === 'text' && saved.ok && saved.fv, `${engine} Intro guarda y el foco vuelve a la celda, visible: ${JSON.stringify(saved)}`)
    // Panel compacto: estructura; Esc en su editor y en un menú no cierran el panel
    await page.evaluate(() => window.speech.openPanel())
    await page.waitForSelector('.g-speech-panel .g-transcript[data-compact] .g-transcript__row')
    const cp = await page.evaluate(() => {
      const t = document.querySelector('.g-speech-panel .g-transcript'), sc = t.querySelector('.g-transcript__scroll')
      return { compact: t.hasAttribute('data-compact'), sel: t.querySelectorAll('.g-transcript__cell--select').length, kbd: !t.querySelector('.g-transcript__kbd').getClientRects().length, minH: parseFloat(getComputedStyle(sc).minBlockSize), h: sc.clientHeight, ov: t.scrollWidth > t.clientWidth + 1, insert: !!t.querySelector('.g-transcript__insert'), review: [...document.querySelectorAll('.g-speech-panel__controls .g-btn')].some((b) => /Revisar/.test(b.textContent) && b.querySelector('svg')) }
    })
    ok(cp.compact && cp.sel === 0 && cp.kbd && cp.h >= cp.minH && cp.minH > 0 && !cp.ov && cp.review, `${engine} panel: GTranscript compacto (sin casillas, ayuda oculta, área desplazable sin desbordamiento) y «Revisar» con icono: ${JSON.stringify(cp)}`)
    await page.locator('.g-speech-panel [role="grid"] [tabindex="0"]').focus()
    await page.keyboard.press('ControlOrMeta+Home')
    let guard = 0
    while (guard++ < 6 && (await page.evaluate(() => document.activeElement.dataset.focus)) !== 'text') await page.keyboard.press('ArrowRight')
    await page.keyboard.press('Enter')
    await page.waitForSelector('.g-speech-panel textarea.g-transcript__field')
    await page.keyboard.press('Escape')
    ok(await page.evaluate(() => window.speech.state.panelOpen && !document.querySelector('.g-speech-panel textarea')), `${engine} Esc en el editor del panel no cierra el panel`)
    while (guard++ < 12 && (await page.evaluate(() => document.activeElement.dataset.focus)) !== 'actions') await page.keyboard.press('ArrowRight')
    await page.keyboard.press('Enter')
    await until(page, () => [...document.querySelectorAll('[role="menu"]')].some((m) => m.getClientRects().length))
    await page.keyboard.press('Escape')
    ok(await page.evaluate(() => window.speech.state.panelOpen && document.activeElement.dataset.focus === 'actions'), `${engine} Esc en un menú del panel cierra el menú y no el panel`)
    // «Revisar» con superficie: foco al título, panel cerrado, título a la vista
    await page.locator('.g-speech-panel__controls .g-btn', { hasText: 'Revisar' }).click()
    await settle(page, 300)
    const rv = await page.evaluate(() => { const t = document.getElementById('sp-rv-title'), r = t.getBoundingClientRect(); return { focus: document.activeElement === t, open: window.speech.state.panelOpen, inView: r.top >= 0 && r.bottom <= innerHeight } })
    ok(rv.focus && !rv.open && rv.inView, `${engine} «Revisar» lleva el foco al título de la revisión (a la vista) y cierra el panel: ${JSON.stringify(rv)}`)
    // Inserción en el GForm real: Plan desmontado, foco en «Insertar», «Usado en», deshacer
    await page.evaluate(() => window.speech.pause())
    const ins = page.locator('#sp-review .g-transcript__insert')
    const pv = await ins.locator('.g-transcript__preview').evaluate((p) => ({ tab: p.getAttribute('tabindex'), role: p.getAttribute('role'), label: document.getElementById(p.getAttribute('aria-labelledby'))?.textContent, live: p.getAttribute('aria-live') }))
    ok(pv.tab === '0' && pv.role === 'region' && pv.label && !pv.live, `${engine} vista previa: tabindex 0, role region con rótulo, no viva: ${JSON.stringify(pv)}`)
    await ins.locator('.g-select').nth(1).locator('button').first().click()
    await page.locator('#sp-review-target-opt-1').click()
    const go = ins.locator('.g-btn', { hasText: 'Insertar en Plan' })
    await go.focus()
    // Con teclado (Firefox no pinta :focus-visible en un foco por script tras usar el ratón, hallazgo 2 de la F1)
    if (engine === 'firefox') { await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab') } // WebKit no tabula a botones (ajuste de macOS)
    await page.keyboard.press('Enter')
    await settle(page)
    const ir = await page.evaluate(() => ({ focus: document.activeElement.textContent.includes('Insertar en Plan'), fv: document.activeElement.matches(':focus-visible'), plan: window.spForm.plan.length > 0, used: [...document.querySelectorAll('#sp-review .g-transcript__flag--used')].map((f) => f.textContent.trim()), result: document.querySelector('#sp-review .g-transcript__result')?.textContent.trim() }))
    ok(ir.focus && ir.fv && ir.plan && ir.used.length > 0 && ir.used.every((u) => u === 'Usado en Plan') && /Insertado en Plan/.test(ir.result), `${engine} inserción en Plan (desmontado): foco visible en «Insertar», «Usado en Plan», resultado: ${JSON.stringify(ir)}`)
    await ins.locator('.g-transcript__result .g-btn', { hasText: 'Deshacer inserción' }).click()
    await settle(page)
    const ud = await page.evaluate(() => ({ plan: window.spForm.plan, used: document.querySelectorAll('#sp-review .g-transcript__flag--used').length }))
    ok(ud.plan === '' && ud.used === 0, `${engine} deshacer inserción: Plan vacío y sin «Usado en»: ${JSON.stringify(ud)}`)
    // Anuncios: ninguno con texto transcrito; ninguna otra región con texto
    const an = await page.evaluate(() => {
      const tx = window.speech.state.transcript, texts = []
      for (const s of tx.segments) for (const t of [s.literal, s.corrected]) if (t) for (const w of t.split(/(?<=[.,;?!])\s+/)) if (w.length >= 12) texts.push(w)
      return { ann: window.__ann, leak: window.__ann.filter((a) => texts.some((t) => a.includes(t))), noise: window.__noise }
    })
    ok(an.ann.length > 0 && an.leak.length === 0 && an.noise.length === 0, `${engine} anuncios sin texto transcrito y sin otras regiones vivas: ${JSON.stringify(an)}`)
    const sess = await page.evaluate(() => ({ own: document.querySelectorAll('#sp-review .g-transcript__live, .g-speech-panel .g-transcript__live').length, btn: document.querySelectorAll('.g-transcript .g-btn__status').length }))
    ok(sess.own === 0 && sess.btn === 0, `${engine} dentro de la sesión: sin región propia en las vistas (canales del anfitrión) y sin g-btn__status: ${JSON.stringify(sess)}`)
    await page.evaluate(() => window.speech.discard())
    await page.ctx.close()
  })

  /* ---------- 8. Diálogo de respaldo: clase, tamaño, canales, foco, Esc en editor y menú ---------- */
  await sec(async () => {
    const page = await open()
    await page.locator('#sp-page-review').uncheck()
    await startConv(page, 2)
    await page.evaluate(() => window.speech.openPanel())
    await page.locator('.g-speech-panel__controls .g-btn', { hasText: 'Revisar' }).click()
    const dlg = page.locator('dialog.g-speech-review[open]')
    await dlg.waitFor()
    await settle(page, 200)
    const d0 = await page.evaluate(() => { const d = document.querySelector('dialog.g-speech-review'); return { modal: d.matches(':modal'), lg: d.classList.contains('g-dialog--size-lg'), mfs: d.classList.contains('g-dialog--mobile-fullscreen'), live: !!d.querySelector('.g-speech-host__live'), title: document.activeElement.classList.contains('g-dialog__title'), editable: d.querySelector('.g-transcript')?.dataset.mode, targets: !!d.querySelector('.g-transcript__insert') } })
    ok(d0.modal && d0.lg && d0.mfs && d0.live && d0.title && d0.editable === 'edit' && d0.targets, `${engine} diálogo de respaldo: modal, g-speech-review lg + pantalla completa en móvil, canales dentro, foco al título, editable con destinos: ${JSON.stringify(d0)}`)
    await dlg.locator('[role="grid"] [tabindex="0"]').focus()
    let guard = 0
    while (guard++ < 6 && (await page.evaluate(() => document.activeElement.dataset.focus)) !== 'text') await page.keyboard.press('ArrowRight')
    await page.keyboard.press('Enter')
    await dlg.locator('textarea.g-transcript__field').waitFor()
    await page.keyboard.press('Escape')
    ok(await dlg.isVisible() && await page.evaluate(() => document.activeElement.dataset.focus === 'text'), `${engine} Esc en el editor no cierra el diálogo`)
    while (guard++ < 12 && (await page.evaluate(() => document.activeElement.dataset.focus)) !== 'actions') await page.keyboard.press('ArrowRight')
    await page.keyboard.press('Enter')
    await until(page, () => [...document.querySelectorAll('[role="menu"]')].some((m) => m.getClientRects().length))
    await page.keyboard.press('Escape')
    ok(await dlg.isVisible() && await page.evaluate(() => document.activeElement.dataset.focus === 'actions'), `${engine} Esc en un menú de fila no cierra el diálogo y vuelve al botón`)
    await page.keyboard.press('Escape')
    await until(page, () => !document.querySelector('dialog.g-speech-review[open]'))
    await settle(page, 200)
    const back = await page.evaluate(() => { const a = document.activeElement; return { live: document.querySelector('.g-speech-host').parentElement === document.body, focus: a.textContent.trim().slice(0, 30), target: /Revisar/.test(a.textContent) ? 'revisar' : a.closest('.g-speech-pill') ? 'pill' : a.tagName, status: window.speech.state.status } })
    ok(back.live && back.status !== 'idle' && ['revisar', 'pill'].includes(back.target), `${engine} Esc en la rejilla cierra el diálogo: canales de vuelta, sesión viva, foco a «Revisar» o a la pill: ${JSON.stringify(back)}`)
    await page.evaluate(() => window.speech.discard())
    await page.ctx.close()
  })

  /* ---------- 9. 320×640 (táctil salvo Firefox), LTR y RTL: sin desbordamiento; «Más»; hoja; diálogo a pantalla completa ---------- */
  for (const rtl of [false, true]) {
    const touch = engine !== 'firefox'
    const page = await open({ width: 320, height: 640, touch, rtl, audit: { data: AU, colors: 0 } })
    let bad = await page.evaluate(noOverflow)
    ok(bad.length === 0, `${engine} 320×640${rtl ? ' RTL' : ''}: sin desbordamiento (vistas, filas, inserción): ${bad.join('; ')}`)
    const st = await page.evaluate(() => [...document.querySelectorAll('#sp-saved, #au-tx')].map((r) => { const row = r.querySelector('.g-transcript__row'), text = row.querySelector('.g-transcript__cell--text').getBoundingClientRect(), time = row.querySelector('.g-transcript__cell--time').getBoundingClientRect(); return { id: r.id, narrow: r.hasAttribute('data-narrow'), stacked: text.top >= time.bottom - 1, wide: text.width >= row.clientWidth - 48, more: !!r.querySelector('.g-transcript__more') } }))
    ok(st.every((s) => s.narrow && s.stacked && s.wide && s.more), `${engine} 320×640${rtl ? ' RTL' : ''}: filas apiladas, texto a todo el ancho y «Más»: ${JSON.stringify(st)}`)
    if (touch) {
      const co = await page.evaluate(() => {
        const coarse = matchMedia('(pointer: coarse)').matches; let small = [], overlap = 0
        const area = (b) => { const r = b.getBoundingClientRect(), a = getComputedStyle(b, '::after'), w = Math.max(r.width, parseFloat(a.width) || 0), h = Math.max(r.height, parseFloat(a.height) || 0); return { l: (r.left + r.right) / 2 - w / 2, r: (r.left + r.right) / 2 + w / 2, t: (r.top + r.bottom) / 2 - h / 2, b: (r.top + r.bottom) / 2 + h / 2, w, h } }
        for (const b of document.querySelectorAll('.g-transcript .g-btn')) { if (!b.getClientRects().length || b.closest('[hidden]')) continue; const a = area(b); if (Math.min(a.w, a.h) < 44) small.push(b.textContent.trim().slice(0, 16) + ' ' + a.w + '×' + a.h) }
        for (const c of document.querySelectorAll('.g-transcript .g-checkbox__row')) { if (!c.getClientRects().length) continue; const r = c.getBoundingClientRect(); if (Math.min(r.width, r.height) < 44) small.push('casilla ' + r.width + '×' + r.height) }
        for (const row of document.querySelectorAll('#au-tx .g-transcript__row')) { const bs = [...row.querySelectorAll('.g-transcript__speaker.g-btn, .g-transcript__actions')].map(area); for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) { const a = bs[i], b = bs[j]; if (a.l < b.r - 0.5 && b.l < a.r - 0.5 && a.t < b.b - 0.5 && b.t < a.b - 0.5) overlap++ } }
        return { coarse, small, overlap }
      })
      ok(co.coarse && co.small.length === 0 && co.overlap === 0, `${engine} 320×640${rtl ? ' RTL' : ''} táctil: objetivos ≥ 44px sin pisarse: ${JSON.stringify({ ...co, small: co.small.slice(0, 6) })}`)
    }
    await page.locator('#au-tx').scrollIntoViewIfNeeded()
    await page.locator('#au-tx .g-transcript__more').click()
    await settle(page, 200)
    const mn = await page.evaluate(() => { const m = [...document.querySelectorAll('[role="menu"]')].find((x) => x.getClientRects().length); if (!m) return null; const r = m.getBoundingClientRect(); return { l: r.left, r: r.right, b: r.bottom, items: m.querySelectorAll('[role^="menuitem"]').length } })
    ok(mn && mn.l >= 0 && mn.r <= 320 && mn.b <= 640 && mn.items === 4, `${engine} 320×640${rtl ? ' RTL' : ''}: menú «Más» dentro del visor: ${JSON.stringify(mn)}`)
    await page.keyboard.press('Escape')
    // Sesión: hoja con el compacto y diálogo de respaldo a pantalla completa
    await page.locator('#sp-page-review').uncheck()
    await startConv(page, 2)
    await page.evaluate(() => window.speech.openPanel())
    await page.waitForSelector('.g-speech-panel .g-transcript[data-compact] .g-transcript__row')
    await settle(page, 300)
    bad = await page.evaluate(noOverflow)
    ok(bad.length === 0, `${engine} 320×640${rtl ? ' RTL' : ''}: hoja con el compacto sin desbordamiento: ${bad.join('; ')}`)
    await page.locator('.g-speech-panel__controls .g-btn', { hasText: 'Revisar' }).click()
    await page.waitForSelector('dialog.g-speech-review[open] .g-transcript__row')
    await settle(page, 300)
    const dl = await page.evaluate(() => { const d = document.querySelector('dialog.g-speech-review[open]'), r = d.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), narrow: d.querySelector('.g-transcript').hasAttribute('data-narrow') } })
    bad = await page.evaluate(noOverflow)
    ok(dl.w >= 319 && dl.h >= 639 && dl.narrow && bad.length === 0, `${engine} 320×640${rtl ? ' RTL' : ''}: diálogo de respaldo a pantalla completa, apilado y sin desbordamiento: ${JSON.stringify(dl)} ${bad.join('; ')}`)
    await page.evaluate(() => window.speech.discard())
    await page.ctx.close()
  }

  /* ---------- 10. Movimiento: con y sin preferencia ---------- */
  for (const reduced of [true, false]) {
    const page = await open({ reduced, width: 600, audit: { data: AU, colors: 0 } })
    const mv = await page.evaluate(() => {
      const more = document.querySelector('#au-tx .g-transcript__more .g-btn__append > svg')
      const row = document.querySelector('#au-tx .g-transcript__row'), inp = row.querySelector('.g-checkbox__input')
      return { chevron: more ? getComputedStyle(more).transitionDuration : null, row: getComputedStyle(row).transitionDuration, input: getComputedStyle(inp).transitionProperty, mark: getComputedStyle(row.querySelector('.g-checkbox__mark')).transitionDuration }
    })
    const zero = (d) => /^0s(, 0s)*$/.test(d)
    ok(mv.chevron !== null && (reduced ? zero(mv.chevron) : !zero(mv.chevron)) && zero(mv.row) && zero(mv.mark) && /outline/.test(mv.input) && !/background|scale/.test(mv.input), `${engine} ${reduced ? 'movimiento reducido' : 'sin preferencia'}: chevron ${reduced ? 'quieto' : 'animado'}; rejilla sin fundidos (anillo de foco sí): ${JSON.stringify(mv)}`)
    await page.ctx.close()
  }

  /* ---------- 11. forced-colors y prefers-contrast (Chromium los emula) ---------- */
  if (engine === 'chromium') {
    const page = await open({ forced: 'active', audit: { data: AU, colors: 6 }, theme: css['spotify-cat6'] })
    await page.locator('#au-tx .g-transcript__row[data-id="a0"] .g-checkbox__input').check()
    await page.locator('#au-tx .g-transcript__bar .g-btn', { hasText: 'Mostrar cambios' }).click()
    await page.locator('#au-tx .g-transcript__row[data-id="a0"] .g-transcript__cell--text').focus()
    await page.keyboard.press('ArrowUp'); await page.keyboard.press('ArrowDown')
    const fc = await page.evaluate(() => {
      const probe = document.createElement('i'); probe.style.color = 'Highlight'; document.body.append(probe); const hl = getComputedStyle(probe).color; probe.remove()
      const sel = getComputedStyle(document.querySelector('#au-tx .g-transcript__row.is-selected')), cell = getComputedStyle(document.activeElement)
      const mk = getComputedStyle(document.querySelector('#au-tx .g-transcript__mark[data-cat]')), un = getComputedStyle(document.querySelector('#au-tx .g-transcript__mark.is-unassigned'))
      return { hl, sel: sel.borderInlineStartColor, selW: sel.borderInlineStartWidth, focus: cell.outlineColor, fw: cell.outlineWidth, fs: cell.outlineStyle, mark: mk.borderTopStyle + ' ' + mk.borderTopWidth, un: un.borderTopStyle, del: getComputedStyle(document.querySelector('#au-tx .g-transcript__diff del')).textDecorationLine, ins: getComputedStyle(document.querySelector('#au-tx .g-transcript__diff ins')).textDecorationLine, failed: getComputedStyle(document.querySelector('#au-tx .g-transcript__row.is-failed')).borderInlineStartStyle, removed: getComputedStyle(document.querySelector('#au-tx .is-removed .g-transcript__text')).textDecorationLine }
    })
    ok(fc.sel === fc.hl && parseFloat(fc.selW) >= 2 && fc.focus === fc.hl && parseFloat(fc.fw) >= 2 && fc.fs === 'solid' && /solid/.test(fc.mark) && fc.un === 'dashed' && fc.del.includes('line-through') && fc.ins.includes('underline') && fc.failed === 'dashed' && fc.removed.includes('line-through'), `chromium forced-colors: borde de selección y foco en Highlight; marcas, «Sin asignar», del/ins, fallido y eliminado por forma: ${JSON.stringify(fc)}`)
    await page.ctx.close()
    const p2 = await open({ contrast: 'more', audit: { data: AU, colors: 0 } })
    const pc = await p2.evaluate(() => { const g = (s) => getComputedStyle(document.querySelector(s)).color; const p = document.createElement('i'); p.style.color = 'var(--g-color-border-control)'; document.body.append(p); const ctl = getComputedStyle(p).color; p.remove(); return { t: g('#au-tx .g-transcript__text'), time: g('#au-tx .g-transcript__cell--time'), removed: g('#au-tx .is-removed .g-transcript__text'), kbd: g('#au-tx .g-transcript__kbd'), sc: getComputedStyle(document.querySelector('#au-tx .g-transcript__scroll')).borderTopColor, ctl } })
    ok(pc.time === pc.t && pc.removed === pc.t && pc.kbd === pc.t && pc.sc === pc.ctl, `chromium prefers-contrast: more: secundarios a text y borde a border-control: ${JSON.stringify(pc)}`)
    await p2.ctx.close()

    /* ---------- 12. Rendimiento: Ctrl+A con 320 filas (estilo y Event Timing), informativo ---------- */
    const p3 = await open({ reduced: false })
    await p3.locator('#sp-long-320').click()
    await until(p3, () => document.querySelectorAll('#sp-saved .g-transcript__row').length === 320)
    await p3.locator('#sp-saved').scrollIntoViewIfNeeded()
    const cdp = await p3.ctx.newCDPSession(p3)
    await cdp.send('Performance.enable')
    const style = async () => (await cdp.send('Performance.getMetrics')).metrics.find((x) => x.name === 'RecalcStyleDuration').value * 1000
    await p3.evaluate(() => { window.__evt = []; new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__evt.push({ d: e.duration, t: e.startTime }) }).observe({ type: 'event', durationThreshold: 16 }) })
    await p3.locator('#sp-saved [role="grid"] [tabindex="0"]').focus()
    const st = [], ev = []
    for (let i = 0; i < 8; i++) {
      const p0 = await p3.evaluate(() => performance.now()), s0 = await style()
      await p3.keyboard.press('ControlOrMeta+a')
      await settle(p3, 250)
      st.push(Math.round((await style()) - s0)); ev.push(await p3.evaluate((p) => Math.max(0, ...window.__evt.filter((e) => e.t >= p).map((e) => Math.round(e.d))), p0))
    }
    const med = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1]
    notes.push(`chromium Ctrl+A con 320 filas (sin preferencia de movimiento): estilo mediana ${med(st)} ms (máx ${Math.max(...st)}), Event Timing mediana ${med(ev)} ms (máx ${Math.max(...ev)})`)
    ok(med(st) < 80, `chromium Ctrl+A con 320 filas: estilo ${med(st)} ms (antes, con fundidos, ~150 ms)`)
    await p3.ctx.close()
  }
  await browser.close()
}
if (server) server.close()

ok(errors.length === 0, `consola: ${errors.slice(0, 8).join(' | ')}`)
if (args.verbose) for (const [k, v] of Object.entries(mins).sort()) console.log(`  ${k}: ${v.r} (${v.where})`)
for (const n of notes) console.log('· ' + n)
console.log(`\n${total - failed} / ${total} comprobaciones correctas`)
if (failed) {
  const groups = new Map()
  for (const f of fails) { const k = f.replace(/\d+(\.\d+)?/g, '#').replace(/\{.*$/, '').slice(0, 140); const g = groups.get(k) || { n: 0, first: f }; g.n++; groups.set(k, g) }
  for (const g of groups.values()) console.log(`[${g.n}×] ${g.first.slice(0, 400)}`)
  process.exitCode = 1
}
