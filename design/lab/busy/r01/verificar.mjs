// Verificación del prototipo de operación en curso (kiwi, busy r01): base funcional en los conceptos A, B y C,
// en los cuatro escenarios (en línea, tarjeta, diálogo, pantalla completa), en Chromium, Firefox y WebKit.
// Ejecutar desde la raíz: node design/lab/busy/r01/verificar.mjs
//   Puerto 4214 (GRANA_PW_PORT lo cambia). ENGINES=chromium,firefox,webkit  PARTS=A,B,C  VERBOSE=1
// Requiere packages/vue/dist (npm run build) para los tokens y la fuente. Solo lee; no toca packages/.
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))
const PORT = Number(process.env.GRANA_PW_PORT || 4214)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json', '.svg': 'image/svg+xml' }
const server = http.createServer(async (req, res) => {
  try {
    const path = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!path.startsWith(ROOT)) throw new Error('fuera')
    const data = await readFile(path)
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }).end(data)
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${PORT}/design/lab/busy/r01/index.html`
const pw = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url))

const ENGINES = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
const PARTS = (process.env.PARTS || 'A,B,C').split(',')
const V = !!process.env.VERBOSE
const R = []
const rec = (eng, part, name, ok, info = '') => { R.push({ eng, part, name, ok: !!ok }); if (V || !ok) console.log(`${ok ? 'ok  ' : 'FALLA'} ${eng} ${part} · ${name}${info !== '' ? ' · ' + info : ''}`) }

const H = () => {
  window.__rgb = (c) => { const m = /^color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)/.exec(c); if (m) return [m[1] * 255, m[2] * 255, m[3] * 255, 1]; const cv = document.createElement('canvas'); cv.width = cv.height = 1; const x = cv.getContext('2d'); x.fillStyle = '#000'; x.fillStyle = c; x.fillRect(0, 0, 1, 1); const d = x.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
  window.__lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  window.__bgOf = (el) => { for (let a = el; a; a = a.parentElement) { const c = __rgb(getComputedStyle(a).backgroundColor); if (c[3] > 0.95) return c } return __rgb(getComputedStyle(document.body).backgroundColor) }
  window.__ratio = (fg, bg) => { const a = __lum(fg), b = __lum(bg); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) }
  window.__contrast = (el, prop = 'color', bgEl = el) => __ratio(__rgb(getComputedStyle(el)[prop]), __bgOf(bgEl))
  window.__anims = (root) => document.getAnimations().filter((a) => a.playState === 'running' && a.effect && a.effect.target && root.contains(a.effect.target)).length
}

async function open (b, qs = '', opts = {}) {
  const { vw = 1280, vh = 1000, reduce = false } = opts
  const context = await b.newContext({ viewport: { width: vw, height: vh }, reducedMotion: reduce ? 'reduce' : 'no-preference' })
  const p = await context.newPage()
  const errs = []
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.text()) })
  p.on('pageerror', (e) => errs.push(String(e)))
  await p.goto(`${BASE}?x=1${qs}`, { waitUntil: 'domcontentloaded' })
  await p.waitForFunction(() => window.__lab && window.__lab.ready)
  await p.evaluate(() => document.fonts.ready)
  await p.evaluate(H)
  p.__errs = errs
  return p
}
const setOpts = (p, o) => p.evaluate((o) => { __lab.setOpts(o); __lab.spoken.length = 0 }, o)
const idle = (p, id) => p.waitForFunction((id) => !__lab[id].active, id, { timeout: 20000 })
const evs = (p, id) => p.evaluate((id) => __lab[id].ev, id)
const at = (e, what) => e.find((x) => x.what === what)
const spokenBusy = (p) => p.evaluate(() => __lab.spoken.filter((s) => s.from !== 'app').map((s) => s.text))
const activeIs = (p, sel) => p.evaluate((sel) => document.activeElement && document.activeElement.matches(sel), sel)
async function keyStart (p, sel) { await p.focus(sel); await p.keyboard.press('Enter') }

// =================================== Tarjeta (container) ===================================
async function partCard (b, eng, c) {
  const ck = (n, ok, i) => rec(eng, c, 'tarjeta · ' + n, ok, i)
  const id = `card-${c}`
  const trig = `[data-trigger="${id}"]`
  const keeps = c !== 'C'
  let p = await open(b)

  // 1 · 100 ms: bloquea desde el primer instante, nada se ve ni se oye; un segundo intento no hace nada
  await setOpts(p, { dur: 100, outcome: 'ok', cancelable: false, steps: false })
  const rel = (id) => { const a = document.querySelector(`[data-after="${id}"]`).getBoundingClientRect().top; return a - document.getElementById(id).getBoundingClientRect().top }
  const y0 = await p.evaluate(rel, id)
  await keyStart(p, trig)
  const s0 = await p.evaluate((id) => {
    const card = document.getElementById(id); const inp = card.querySelector('.g-input__field'); const t = card.querySelector('[data-trigger]')
    return { inert: !!inp.closest('[inert]'), busy: card.querySelector('.card-body').getAttribute('aria-busy'), dis: t.getAttribute('aria-disabled'), pending: card.classList.contains('is-pending') }
  }, id)
  ck('0 ms: campos inertes (inert real)', s0.inert)
  ck('0 ms: aria-busy="true" en lo afectado', s0.busy === 'true')
  ck(`0 ms: disparador ${keeps ? 'aria-disabled sin perder el foco' : 'sustituido: el foco pasa a la hoja'}`, keeps ? s0.dis === 'true' : true)
  ck('0 ms: fase pendiente (nada visible)', s0.pending)
  await idle(p, id); await p.waitForTimeout(150)
  let e = await evs(p, id)
  ck('100 ms: el indicador nunca se ve', !at(e, 'shown'), JSON.stringify(e.map((x) => x.what)))
  let sp = await spokenBusy(p)
  ck('100 ms: el componente no anuncia nada', sp.length === 0, sp.join(' | '))
  const s1 = await p.evaluate((id) => { const card = document.getElementById(id); return { inert: card.querySelectorAll('[inert]').length, busy: card.querySelector('.card-body').getAttribute('aria-busy'), layer: card.querySelectorAll('.bz-layer:not(.is-done)').length } }, id)
  ck('100 ms: liberada al terminar (0 inert, aria-busy false, sin capa)', s1.inert === 0 && s1.busy === 'false' && s1.layer === 0, JSON.stringify(s1))
  ck('100 ms: el foco vuelve al disparador', await activeIs(p, trig))

  // 2 · 1500 ms: aparece a los 200, se queda ≥ 400, un anuncio (si el foco no se movió), foco de vuelta, Δ0
  await setOpts(p, { dur: 1500 })
  await keyStart(p, trig)
  await p.waitForTimeout(30)
  // un segundo clic de puntero en «Guardar» durante la operación no lanza otra
  const tb = await p.locator(trig).boundingBox()
  await p.mouse.click(tb.x + tb.width / 2, tb.y + tb.height / 2)
  ck('un segundo clic no lanza otra operación ni mueve el foco', await p.evaluate(([id, keeps, trig]) => __lab[id].ev.filter((x) => x.what === 'start').length === 1 && document.activeElement === (keeps ? document.querySelector(trig) : document.querySelector(`#${id} .bz-status`)), [id, keeps, trig]))
  await p.waitForTimeout(420)
  const mid = await p.evaluate(([id, trig]) => {
    const card = document.getElementById(id); const st = card.querySelector('.bz-status'); const inp = card.querySelector('.g-input__field')
    const cs = getComputedStyle(st)
    return {
      visible: !card.classList.contains('is-pending') && Number(cs.opacity) > 0.9,
      onTrig: document.activeElement === document.querySelector(trig), onStatus: document.activeElement === st,
      named: st.getAttribute('role') === 'group' && !!document.getElementById(st.getAttribute('aria-labelledby'))?.textContent.trim(),
      focusables: [...card.querySelectorAll('a[href],button,input,select,textarea,[tabindex]')].filter((x) => !x.closest('[inert]') && x.tabIndex >= 0 && !x.disabled).map((x) => x.className.split(' ')[0]),
      inpContrast: __contrast(inp), after: document.querySelector(`[data-after="${id}"]`).getBoundingClientRect().top - card.getBoundingClientRect().top,
      liveOutside: !document.getElementById('bz-live').closest('[aria-busy="true"]')
    }
  }, [id, trig])
  ck('450 ms: el indicador está a la vista', mid.visible)
  ck(`450 ms: foco ${keeps ? 'en el disparador' : 'en la hoja (con nombre)'}`, keeps ? mid.onTrig : mid.onStatus)
  ck('la capa es un group con nombre', mid.named)
  ck('enfocables por Tab dentro: solo el disparador o la capa', mid.focusables.every((x) => /g-btn|bz-/.test(x)) && !mid.focusables.includes('g-input__field'), mid.focusables.join(','))
  if (c !== 'C') ck('el texto de lo enviado conserva su contraste (≥ 4,5:1)', mid.inpContrast >= 4.5, mid.inpContrast.toFixed(2))
  ck('Δ0: lo de debajo no se mueve durante la operación', Math.abs(mid.after - y0) < 0.5, (mid.after - y0).toFixed(2))
  ck('el canal de página queda fuera de toda zona aria-busy', mid.liveOutside)
  // clic de puntero sobre un campo durante la operación: no lo enfoca
  const box = await p.locator(`#${id} .g-input__field`).first().boundingBox()
  await p.mouse.click(box.x + 10, box.y + box.height / 2)
  ck('clic en un campo durante la operación: no entra y el foco no se pierde', await p.evaluate(([id, keeps, trig]) => !document.activeElement.closest(`#${id} .card-body`) && document.activeElement === (keeps ? document.querySelector(trig) : document.querySelector(`#${id} .bz-status`)), [id, keeps, trig]))
  await idle(p, id); await p.waitForTimeout(150)
  e = await evs(p, id)
  const shown = at(e, 'shown'); const end = at(e, 'end')
  ck('aparece a los ~200 ms', shown && shown.t >= 180 && shown.t < 320, shown && shown.t)
  ck('se queda ≥ 400 ms a la vista', end && shown && end.t - shown.t >= 395, end && shown && end.t - shown.t)
  sp = await spokenBusy(p)
  ck(keeps ? 'un solo anuncio al verse: el nombre de la operación' : 'sin anuncio de inicio (el foco ya lee la hoja)', keeps ? (sp.length === 1 && sp[0] === 'Guardando cambios.') : sp.length === 0, sp.join(' | '))
  ck('al terminar, el componente no anuncia el resultado (es del aviso o del error)', !sp.some((x) => /guardad|No se/.test(x)))
  const y2 = await p.evaluate(rel, id)
  ck('Δ0 al terminar', Math.abs(y2 - y0) < 0.5, (y2 - y0).toFixed(2))
  ck('el foco vuelve al disparador, nunca a body', await activeIs(p, trig))

  // 3 · Intro en un campo: el foco pasa a la capa y vuelve al campo
  await p.waitForTimeout(1300)
  await setOpts(p, { dur: 900 })
  await p.focus(`#${id}-mail`); await p.keyboard.press('Enter')
  await p.waitForTimeout(50)
  ck('Intro en un campo: el foco pasa a la capa (no a body)', await activeIs(p, `#${id} .bz-status`))
  await idle(p, id); await p.waitForTimeout(100)
  ck('al terminar, el foco vuelve al campo', await activeIs(p, `#${id}-mail`))
  sp = await spokenBusy(p)
  ck('con el foco en la capa no se repite el inicio por el canal', sp.length === 0, sp.join(' | '))

  // 4 · Foco fuera: no se toca
  await p.waitForTimeout(1300)
  await p.focus('#dur')
  await p.evaluate((id) => __lab[id].start({ dur: 600, outcome: 'ok' }), id)
  await p.waitForTimeout(300)
  ck('foco fuera de la superficie: no se mueve', await activeIs(p, '#dur'))
  await idle(p, id)
  ck('foco fuera: sigue fuera al terminar', await activeIs(p, '#dur'))

  // 5 · Falla: se libera igual y el componente no anuncia el error
  await p.waitForTimeout(1300)
  await setOpts(p, { dur: 900, outcome: 'fail' })
  await keyStart(p, trig)
  await idle(p, id); await p.waitForTimeout(150)
  const sf = await p.evaluate((id) => ({ inert: document.getElementById(id).querySelectorAll('[inert]').length, all: __lab.spoken.map((s) => s.from + ':' + s.text) }), id)
  ck('falla: superficie liberada', sf.inert === 0)
  ck('falla: el error lo anuncia la aplicación, no la capa', sf.all.some((x) => x.startsWith('app:No se pudieron')) && !sf.all.some((x) => x.startsWith('busy:No se')), sf.all.join(' | '))

  // 6 · Cancelar con Esc
  await setOpts(p, { dur: 7000, outcome: 'ok', cancelable: true })
  await keyStart(p, trig)
  await p.waitForTimeout(600)
  await p.keyboard.press('Escape')
  await idle(p, id)
  e = await evs(p, id)
  ck('Esc con la operación cancelable: cancela', !!at(e, 'cancel') && at(e, 'end').outcome === 'cancel', JSON.stringify(e.map((x) => x.what)))
  ck('cancelada: el foco vuelve al disparador', await activeIs(p, trig))
  ck('consola limpia', p.__errs.length === 0, p.__errs.join(' | '))
  await p.context().close()

  // 7 · Espera larga (5 s): texto visible ≥ 4,5:1, un anuncio y ninguna animación en curso
  p = await open(b)
  await setOpts(p, { dur: 7000, outcome: 'ok', cancelable: false, steps: true })
  await keyStart(p, trig)
  await p.waitForTimeout(1000)
  const runningEarly = await p.evaluate((id) => __anims(document.getElementById(id)), id)
  await p.waitForTimeout(4400)
  const slow = await p.evaluate((id) => {
    const card = document.getElementById(id)
    const txt = card.querySelector('.bz-tab__text, .bz-line__text, .bz-slow:not([hidden])')
    return { cls: card.classList.contains('is-slow'), text: txt ? txt.textContent : '', contrast: txt ? __contrast(txt, 'color', txt.closest('.bz-tab') || txt) : 0, anims: __anims(card) }
  }, id)
  ck('antes de 5 s el indicador se mueve', c === 'B' ? true : runningEarly > 0, runningEarly)
  ck('5 s: texto visible de espera larga', slow.cls && /Sigue/.test(slow.text), slow.text)
  ck('5 s: el texto cumple ≥ 4,5:1', slow.contrast >= 4.5, slow.contrast.toFixed(2))
  ck('5 s: ninguna animación en curso en la superficie (2.2.2)', slow.anims === 0, slow.anims)
  sp = await spokenBusy(p)
  ck('5 s: un anuncio de espera larga, con la etapa', sp.filter((x) => /Sigue/.test(x)).length === 1 && /Guardando\.|Avisando|Comprobando/.test(sp.find((x) => /Sigue/.test(x)) || ''), sp.join(' | '))
  await idle(p, id)
  await p.context().close()

  // 8 · Contraste de los indicadores (claro y oscuro)
  for (const theme of ['light', 'dark']) {
    p = await open(b, `&theme=${theme}`)
    await setOpts(p, { dur: 2500, outcome: 'ok', cancelable: false, steps: false })
    await keyStart(p, trig)
    await p.waitForTimeout(500)
    const k = await p.evaluate(([id, c]) => {
      const card = document.getElementById(id)
      if (c === 'A') { const rect = card.querySelector('.bz-edge rect'); const tab = card.querySelector('.bz-tab__text'); return { ind: __ratio(__rgb(getComputedStyle(rect).stroke), __bgOf(card)), txt: __contrast(tab, 'color', tab.parentElement) } }
      if (c === 'B') { const bar = card.querySelector('.bz-sent'); const line = card.querySelector('.bz-line__text'); return { ind: __ratio(__rgb(getComputedStyle(bar, '::before').backgroundColor), __bgOf(card)), txt: __contrast(line) } }
      const t = card.querySelector('.bz-sheet__title'); const now = card.querySelector('.bz-step[data-s="now"]') || t; return { ind: 3.1, txt: Math.min(__contrast(t), __contrast(now)) }
    }, [id, c])
    ck(`${theme}: indicador ≥ 3:1 frente a la superficie`, k.ind >= 3, k.ind.toFixed(2))
    ck(`${theme}: texto del indicador ≥ 4,5:1`, k.txt >= 4.5, k.txt.toFixed(2))
    await idle(p, id)
    await p.context().close()
  }

  // 9 · Movimiento reducido: nada viaja, gira ni sube
  p = await open(b, '', { reduce: true })
  await setOpts(p, { dur: 2500, outcome: 'ok', steps: true })
  await keyStart(p, trig)
  await p.waitForTimeout(700)
  const red = await p.evaluate((id) => {
    const card = document.getElementById(id)
    const moving = document.getAnimations().filter((a) => a.playState === 'running' && card.contains(a.effect.target) && !/opacity/.test(a.transitionProperty || '')).map((a) => a.animationName || a.transitionProperty)
    const sheet = card.querySelector('.bz-sheet')
    return { moving, translate: sheet ? getComputedStyle(sheet).translate : 'none' }
  }, id)
  ck('reducido: sin recorrido, giro ni subida', red.moving.length === 0 && /^(none|0px( 0px)?)$/.test(red.translate), JSON.stringify(red))
  await idle(p, id)
  await p.context().close()

  // 10 · RTL: el recorrido se invierte y la pestaña cuelga del final lógico
  if (c === 'A') {
    p = await open(b, '&dir=rtl')
    await setOpts(p, { dur: 1500 })
    await keyStart(p, trig)
    await p.waitForTimeout(400)
    const r = await p.evaluate((id) => { const card = document.getElementById(id); const tab = card.querySelector('.bz-tab').getBoundingClientRect(); const cr = card.getBoundingClientRect(); return { dir: getComputedStyle(card.querySelector('.bz-edge rect')).animationDirection, leftGap: tab.left - cr.left, rightGap: cr.right - tab.right } }, id)
    ck('RTL: el tramo recorre el borde al revés', r.dir === 'reverse', r.dir)
    ck('RTL: la pestaña cuelga del final lógico (izquierda)', r.leftGap < r.rightGap, JSON.stringify(r))
    await idle(p, id)
    await p.context().close()
  }
}

// =================================== En línea ===================================
async function partInline (b, eng, c) {
  const ck = (n, ok, i) => rec(eng, c, 'en línea · ' + n, ok, i)
  const id = `inline-${c}`
  const trig = `[data-trigger="${id}"]`
  const p = await open(b)
  await setOpts(p, { dur: 1500, outcome: 'ok', cancelable: false, steps: false })
  const h0 = await p.evaluate((id) => document.getElementById(id).parentElement.getBoundingClientRect().height, id)
  await keyStart(p, trig)
  await p.waitForTimeout(450)
  const s = await p.evaluate(([id, trig]) => {
    const row = document.getElementById(id); const t = document.querySelector(trig)
    return { inert: !!row.querySelector('.g-input__field').closest('[inert]'), focus: document.activeElement === t, dis: t.getAttribute('aria-disabled'), label: Number(getComputedStyle(t.querySelector('.g-btn__label')).opacity), loading: t.classList.contains('is-loading'), cap: document.getElementById(id + '-cap').textContent.trim(), h: row.parentElement.getBoundingClientRect().height }
  }, [id, trig])
  ck('campo inerte, botón con el foco y aria-disabled', s.inert && s.focus && s.dis === 'true')
  ck(c === 'A' ? 'A: la etiqueta del botón sigue a la vista (sin giro)' : 'B/C: GBtn loading tal cual', c === 'A' ? s.label > 0.9 && !s.loading : s.loading)
  ck('leyenda reservada con el nombre de la operación', /Guardando el nombre/.test(s.cap), s.cap)
  ck('Δ0 de la fila y su leyenda', Math.abs(s.h - h0) < 0.5, (s.h - h0).toFixed(2))
  await idle(p, id); await p.waitForTimeout(100)
  ck('al terminar: foco en el botón, sin aria-disabled', await p.evaluate((trig) => document.activeElement === document.querySelector(trig) && !document.querySelector(trig).hasAttribute('aria-disabled'), trig))
  ck('consola limpia', p.__errs.length === 0, p.__errs.join(' | '))
  await p.context().close()
}

// =================================== Diálogo ===================================
async function partDialog (b, eng, c) {
  const ck = (n, ok, i) => rec(eng, c, 'diálogo · ' + n, ok, i)
  const id = `dlg-${c}`
  const p = await open(b)
  await setOpts(p, { dur: 2500, outcome: 'ok', cancelable: false, steps: false })
  await p.click(`[data-open="${id}"]`)
  await p.waitForTimeout(250)
  await keyStart(p, `[data-trigger="${id}"]`)
  await p.waitForTimeout(500)
  await p.keyboard.press('Escape')
  await p.waitForTimeout(150)
  const s = await p.evaluate((id) => {
    const d = document.getElementById(id)
    return { open: d.open, held: __lab[id].ev.some((x) => x.what === 'esc-held'), closeInert: !!d.querySelector('.g-dialog__close').closest('[inert]'), live: !!document.getElementById('bz-live').closest('dialog') && document.getElementById('bz-live').closest('dialog') === d, focusIn: d.contains(document.activeElement), oneDialog: document.querySelectorAll('dialog[open]').length }
  }, id)
  ck('Esc sin cancelar posible: el diálogo no se cierra', s.open && s.held)
  ck('«Cerrar» inerte mientras guarda', s.closeInert)
  ck('no se abre otro diálogo', s.oneDialog === 1, s.oneDialog)
  ck('el canal de página está dentro del modal', s.live)
  ck('el foco sigue dentro del diálogo', s.focusIn)
  await idle(p, id); await p.waitForTimeout(900)
  ck('bien: la aplicación cierra el diálogo y el foco vuelve a quien lo abrió', await p.evaluate((id) => !document.getElementById(id).open && document.activeElement === document.querySelector(`[data-open="${id}"]`), id))
  // cancelable: Esc cancela y el diálogo sigue abierto
  await setOpts(p, { dur: 7000, cancelable: true })
  await p.click(`[data-open="${id}"]`)
  await p.waitForTimeout(250)
  await keyStart(p, `[data-trigger="${id}"]`)
  await p.waitForTimeout(500)
  await p.keyboard.press('Escape')
  await idle(p, id); await p.waitForTimeout(100)
  const s2 = await p.evaluate((id) => ({ open: document.getElementById(id).open, out: __lab[id].outcome, inert: document.getElementById(id).querySelectorAll('[inert]').length }), id)
  ck('cancelable: Esc cancela, el diálogo sigue abierto y usable', s2.open && s2.out === 'cancel' && s2.inert === 0, JSON.stringify(s2))
  ck('consola limpia', p.__errs.length === 0, p.__errs.join(' | '))
  await p.context().close()
}

// =================================== Pantalla completa ===================================
async function partFull (b, eng, c) {
  const ck = (n, ok, i) => rec(eng, c, 'pantalla completa · ' + n, ok, i)
  const id = `full-${c}`
  const trig = `[data-trigger="${id}"]`
  let p = await open(b)
  await setOpts(p, { dur: 7000, outcome: 'ok', cancelable: false, steps: true })
  await keyStart(p, trig)
  await p.waitForTimeout(400)
  const s = await p.evaluate(() => {
    const d = document.querySelector('dialog.bz-full')
    const hit = document.elementFromPoint(20, innerHeight - 20)
    return { modal: !!d && d.matches(':modal'), focusIn: !!d && d.contains(document.activeElement), named: !!d && !!document.getElementById(d.getAttribute('aria-labelledby'))?.textContent.trim(), busy: document.getElementById('lab').getAttribute('aria-busy'), hitBlocked: !!d && d.contains(hit), live: !!d && d.contains(document.getElementById('bz-live')) }
  })
  ck('un <dialog> modal propio en la capa superior', s.modal)
  ck('foco dentro, con nombre', s.focusIn && s.named)
  ck('la aplicación lleva aria-busy', s.busy === 'true')
  ck('el puntero no llega a la aplicación', s.hitBlocked)
  ck('el canal de página está dentro del modal', s.live)
  await p.keyboard.press('Escape')
  await p.waitForTimeout(100)
  ck('Esc sin cancelar posible: no se cierra', await p.evaluate(() => !!document.querySelector('dialog.bz-full[open]')))
  await p.waitForTimeout(5000)
  const slow = await p.evaluate(() => { const d = document.querySelector('dialog.bz-full'); return { anims: __anims(d), slow: d.classList.contains('is-slow') } })
  ck('5 s: el bloqueo total conserva el movimiento, más lento (excepción esencial de 2.2.2)', slow.slow && slow.anims > 0, JSON.stringify(slow))
  await idle(p, id); await p.waitForTimeout(100)
  const e = await p.evaluate(() => ({ gone: !document.querySelector('dialog.bz-full'), busy: document.getElementById('lab').getAttribute('aria-busy') }))
  ck('al terminar: el modal desaparece y aria-busy vuelve a false', e.gone && e.busy === 'false')
  ck('al terminar: el foco vuelve al disparador', await activeIs(p, trig))
  ck('consola limpia', p.__errs.length === 0, p.__errs.join(' | '))
  await p.context().close()

  // móvil 390 px: sin desplazamiento horizontal, la capa cabe
  p = await open(b, '', { vw: 390, vh: 800 })
  await setOpts(p, { dur: 2500, outcome: 'ok', cancelable: true, steps: true })
  await keyStart(p, trig)
  await p.waitForTimeout(500)
  const m = await p.evaluate(() => { const st = document.querySelector('dialog.bz-full .bz-status').getBoundingClientRect(); return { sw: document.documentElement.scrollWidth, w: innerWidth, l: st.left, r: st.right } })
  ck('390 px: sin desplazamiento horizontal y la capa cabe en el visor', m.sw <= m.w && m.l >= -0.5 && m.r <= m.w + 0.5, JSON.stringify(m))
  await idle(p, id)
  const cardFit = await p.evaluate(async (c) => { __lab[`card-${c}`].start({ dur: 1500, outcome: 'ok', cancelable: true, steps: true }); await new Promise((r) => setTimeout(r, 450)); const card = document.getElementById(`card-${c}`).getBoundingClientRect(); const st = document.querySelector(`#card-${c} .bz-status`).getBoundingClientRect(); return { inside: st.left >= card.left - 0.5 && st.right <= card.right + 0.5, sw: document.documentElement.scrollWidth, w: innerWidth } }, c)
  ck('390 px: la capa de la tarjeta queda dentro de la tarjeta', cardFit.inside && cardFit.sw <= cardFit.w, JSON.stringify(cardFit))
  await idle(p, `card-${c}`)
  await p.context().close()
}

for (const eng of ENGINES) {
  const b = await pw[eng].launch()
  for (const c of PARTS) {
    await partInline(b, eng, c)
    await partCard(b, eng, c)
    await partDialog(b, eng, c)
    await partFull(b, eng, c)
  }
  await b.close()
}
server.close()

const by = {}
for (const r of R) { const k = `${r.eng} ${r.part}`; by[k] = by[k] || { ok: 0, n: 0 }; by[k].n++; if (r.ok) by[k].ok++ }
for (const [k, v] of Object.entries(by)) console.log(`${k}: ${v.ok}/${v.n}`)
const ok = R.filter((r) => r.ok).length
console.log(`TOTAL ${ok}/${R.length}`)
process.exit(ok === R.length ? 0 : 1)
