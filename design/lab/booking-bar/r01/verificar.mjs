// Verificación del prototipo de la consulta de reserva (kiwi r01): base y conceptos A, B y C en Chromium, Firefox y WebKit.
// Ejecutar desde la raíz: node design/lab/booking-bar/r01/verificar.mjs
//   Puerto 4233 (GRANA_PW_PORT lo cambia). ENGINES=chromium,firefox,webkit  PARTS=base,party,compact,rtl,A,B,C,state  VERBOSE=1
// Requiere packages/vue/dist/ (npm run build). Solo lee; no toca packages/.
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))
const PORT = Number(process.env.GRANA_PW_PORT || 4233)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' }
const server = http.createServer(async (req, res) => {
  try {
    const path = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!path.startsWith(ROOT)) throw new Error('fuera')
    const data = await readFile(path)
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }).end(data)
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${PORT}/design/lab/booking-bar/r01/index.html`
const pw = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url))

const ENGINES = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
const PARTS = (process.env.PARTS || 'base,party,compact,rtl,A,B,C,state').split(',')
const V = !!process.env.VERBOSE
const R = []
const rec = (eng, part, name, ok, info = '') => { R.push({ eng, part, name, ok: !!ok }); if (V || !ok) console.log(`${ok ? 'ok  ' : 'FALLA'} ${eng} ${part} · ${name}${info !== '' ? ' · ' + info : ''}`) }

async function open (b, qs, opts = {}) {
  const { vw = 1440, vh = 900, ...ctx } = opts
  const context = await b.newContext({ viewport: { width: vw, height: vh }, ...ctx })
  const p = await context.newPage()
  const errs = []
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.text()) })
  p.on('requestfailed', (r) => errs.push('fallo ' + r.url()))
  p.on('response', (r) => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()) })
  p.on('pageerror', (e) => errs.push(String(e)))
  await p.goto(BASE + qs)
  try { await p.waitForFunction(() => window.__bk && window.__bk.ready, null, { timeout: 15000 }) } catch (e) { throw new Error(`no arranca ${qs}: ${errs.join(' | ')}`) }
  await settle(p)
  p.__errs = errs
  p.__ctx = context
  return p
}
const settle = (p, ms = 40) => p.evaluate((ms) => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, ms)))), ms)
const overflow = (p) => p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
const active = (p) => p.evaluate(() => { const a = document.activeElement; return { tag: a.tagName, cls: a.className || '', inv: a.getAttribute('aria-invalid'), id: a.id, text: (a.textContent || '').trim().slice(0, 60), dataInv: a.hasAttribute('data-invalid') || !!a.closest('[aria-invalid="true"]') } })
const liveText = (p) => p.evaluate(() => document.querySelector('[data-live]').textContent)
const lastIntent = (p) => p.evaluate(() => window.__bk.intents[window.__bk.intents.length - 1] || null)
const setState = (p, t, patch) => p.evaluate(([t, patch]) => Object.assign(window.__bk.S[t], patch), [t, patch])
const addD = (iso, n) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
const TODAY = '2026-11-02'
const close = async (p, eng, part, label) => { rec(eng, part, `consola limpia (${label})`, p.__errs.length === 0, p.__errs.slice(0, 2).join(' | ')); await p.__ctx.close() }
const submit = async (p) => { await p.locator('form[role=search] button[type=submit]:visible').first().click(); await settle(p, 60) }
const waitSent = (p) => p.waitForFunction(() => window.__bk.status.value === 'sent', null, { timeout: 3000 }).then(() => true, () => false)

for (const eng of ENGINES) {
  const b = await pw[eng].launch()

  // ---------------- Base: la barra funcional en las tres plantillas ----------------
  if (PARTS.includes('base')) {
    for (const t of ['hotel', 'restaurante', 'tour']) {
      const p = await open(b, `?c=base&t=${t}`)
      const name = await p.evaluate(() => { const f = document.querySelector('form[role=search]'); return f && document.getElementById(f.getAttribute('aria-labelledby')).textContent })
      rec(eng, 'base', `${t}: un formulario role=search con nombre`, (await p.locator('form[role=search]').count()) === 1 && !!name, name)
      rec(eng, 'base', `${t}: en una fila a 1440 (sin resumen)`, (await p.locator('.bk-row').count()) === 1 && (await p.locator('.bk-compact').count()) === 0)
      // envío vacío: errores, foco en el primer inválido, anuncio
      if (t !== 'hotel') await setState(p, t, {})
      await submit(p)
      const errs = await p.evaluate(() => ({ ...window.__bk.errors }))
      const a = await active(p)
      const expected = { hotel: ['dates'], restaurante: ['date', 'time'], tour: ['tour', 'date'] }[t]
      rec(eng, 'base', `${t}: envío vacío marca ${expected.join(', ')}`, expected.every((k) => errs[k]) && Object.keys(errs).length === expected.length, JSON.stringify(errs))
      rec(eng, 'base', `${t}: el foco va al primer campo inválido`, a.inv === 'true', JSON.stringify(a))
      await settle(p, 80)
      rec(eng, 'base', `${t}: anuncio cortés de lo que falta`, /Falta/.test(await liveText(p)), await liveText(p))
      rec(eng, 'base', `${t}: no envía con errores`, (await lastIntent(p)) === null)
      // lleno: objeto de intención
      if (t === 'hotel') await setState(p, t, { start: addD(TODAY, 7), nights: 2 })
      if (t === 'restaurante') await setState(p, t, { date: TODAY, time: '20:00' })
      if (t === 'tour') await setState(p, t, { tour: 'monte-alban', date: addD(TODAY, 3) })
      await settle(p)
      await submit(p)
      const sent = await waitSent(p)
      const it = await lastIntent(p)
      const want = {
        hotel: { template: 'hotel', from: addD(TODAY, 7), to: addD(TODAY, 9), nights: 2, guests: { adults: 2, children: 0 }, rooms: 1 },
        restaurante: { template: 'restaurante', date: TODAY, time: '20:00', guests: { adults: 2, children: 0 } },
        tour: { template: 'tour', tour: 'monte-alban', date: addD(TODAY, 3), guests: { adults: 2, children: 0 } },
      }[t]
      rec(eng, 'base', `${t}: emite el objeto de intención`, sent && JSON.stringify(it) === JSON.stringify(want), JSON.stringify(it))
      await settle(p, 80)
      rec(eng, 'base', `${t}: anuncia la consulta lista`, /Consulta lista/.test(await liveText(p)), await liveText(p))
      const hidden = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll('form[role=search] input[type=hidden][name]')].map((i) => [i.name, i.value])))
      rec(eng, 'base', `${t}: el estado viaja en ocultos con nombre (envío nativo)`, Object.keys(hidden).length >= 3 && Object.values(hidden).every((v) => v !== ''), JSON.stringify(hidden))
      for (const [vw, vh] of [[1440, 900], [390, 844], [320, 640]]) {
        await p.setViewportSize({ width: vw, height: vh }); await settle(p, 80)
        rec(eng, 'base', `${t}: sin desplazamiento horizontal a ${vw}`, !(await overflow(p)))
      }
      await close(p, eng, 'base', t)
    }
    // Noches agotadas: dentro de la estancia es error; la salida en un día agotado es válida
    const p = await open(b, '?c=base&t=hotel')
    await setState(p, 'hotel', { start: addD(TODAY, 3), nights: 3 })
    await submit(p)
    rec(eng, 'base', 'hotel: una noche agotada dentro de la estancia es error con la fecha', /noche del/.test(await p.evaluate(() => window.__bk.errors.dates || '')))
    await setState(p, 'hotel', { start: addD(TODAY, 2), nights: 2 })
    await submit(p)
    rec(eng, 'base', 'hotel: salir en un día agotado es válido', await waitSent(p))
    await close(p, eng, 'base', 'agotadas')
  }

  // ---------------- Campo de grupo: popover no modal con − n + ----------------
  if (PARTS.includes('party')) {
    const p = await open(b, '?c=base&t=hotel')
    const trg = p.locator('.bk-f--party .bk-trigger')
    const nm = await trg.evaluate((el) => el.getAttribute('aria-labelledby').split(' ').map((id) => document.getElementById(id).textContent.trim()).join(' '))
    rec(eng, 'party', 'nombre = etiqueta visible + valor (2.5.3)', /^Huéspedes 2 adultos/.test(nm), nm)
    rec(eng, 'party', 'disparador con aria-haspopup=dialog y aria-expanded=false', (await trg.getAttribute('aria-haspopup')) === 'dialog' && (await trg.getAttribute('aria-expanded')) === 'false')
    await trg.focus(); await p.keyboard.press('Enter'); await settle(p, 80)
    let a = await active(p)
    rec(eng, 'party', 'Enter abre y lleva el foco al primer contador', a.tag === 'INPUT' && (await trg.getAttribute('aria-expanded')) === 'true', JSON.stringify(a))
    const panelOk = await p.evaluate(() => { const el = document.querySelector('.bk-f--party .bk-panel'); const r = el.getBoundingClientRect(); return el.matches(':popover-open') && r.left >= 0 && r.right <= document.documentElement.clientWidth && el.getAttribute('role') === 'dialog' })
    rec(eng, 'party', 'panel en la capa superior, dentro del visor, role=dialog', panelOk)
    await p.keyboard.press('ArrowUp'); await settle(p, 60)
    rec(eng, 'party', 'flecha arriba suma un adulto y el resumen lo dice', (await p.evaluate(() => window.__bk.S.hotel.adults)) === 3 && /3 adultos/.test(await trg.textContent()))
    await p.keyboard.press('Escape'); await settle(p, 60)
    a = await active(p)
    rec(eng, 'party', 'Esc cierra y devuelve el foco al disparador', /bk-trigger/.test(a.cls) && (await trg.getAttribute('aria-expanded')) === 'false')
    await p.keyboard.press('Enter'); await settle(p, 60)
    for (let i = 0; i < 12; i++) { await p.keyboard.press('Tab'); if (!(await p.evaluate(() => !!document.activeElement.closest('.bk-panel')))) break }
    await settle(p, 60)
    rec(eng, 'party', 'salir con Tab cierra sin robar el foco', (await trg.getAttribute('aria-expanded')) === 'false' && !(await p.evaluate(() => !!document.activeElement.closest('.bk-panel'))))
    await setState(p, 'hotel', { adults: 3, rooms: 3 }); await settle(p)
    await setState(p, 'hotel', { adults: 1 }); await settle(p)
    rec(eng, 'party', 'nunca más habitaciones que adultos', (await p.evaluate(() => window.__bk.S.hotel.rooms)) === 1)
    await trg.click(); await settle(p, 60)
    const pb = await p.evaluate(() => { const r = document.querySelector('.bk-f--party .bk-panel').getBoundingClientRect(); return { x: r.left + 6, y: r.top + 6 } })
    await p.mouse.click(pb.x, pb.y); await settle(p, 120)
    rec(eng, 'party', 'tocar el fondo del panel no lo cierra', (await trg.getAttribute('aria-expanded')) === 'true')
    await p.mouse.click(5, 300); await settle(p, 60)
    rec(eng, 'party', 'tocar fuera cierra', (await trg.getAttribute('aria-expanded')) === 'false')
    await close(p, eng, 'party', 'hotel')
  }

  // ---------------- Estrecho: resumen + hoja ----------------
  if (PARTS.includes('compact')) {
    for (const [qs, vw] of [['?c=base&t=hotel', 390], ['?c=base&t=restaurante', 320], ['?c=base&t=tour&w=560', 1440]]) {
      const p = await open(b, qs, { vw, vh: 800 })
      rec(eng, 'compact', `${qs} @${vw}: la barra no se parte, se vuelve resumen`, (await p.locator('.bk-compact').count()) === 1 && (await p.locator('.bk-row').count()) === 0)
      const sum = p.locator('.bk-compact__sum')
      rec(eng, 'compact', `${qs}: el resumen nombra lo que falta`, /Sin fecha/.test(await sum.textContent()), await sum.textContent())
      await sum.click(); await settle(p, 120)
      const dlg = await p.evaluate(() => { const d = document.querySelector('.bk-sheet'); return { open: d.open, modal: d.matches(':modal'), focusIn: d.contains(document.activeElement), name: document.getElementById(d.getAttribute('aria-labelledby'))?.textContent } })
      rec(eng, 'compact', `${qs}: la hoja abre modal, con nombre y el foco dentro`, dlg.open && dlg.modal && dlg.focusIn && !!dlg.name, JSON.stringify(dlg))
      await p.keyboard.press('Escape'); await settle(p, 120)
      rec(eng, 'compact', `${qs}: Esc cierra y el foco vuelve al resumen`, (await active(p)).cls.includes('bk-compact__sum'))
      // envío vacío desde el resumen: abre la hoja con los errores y el foco en el primero
      await p.locator('.bk-compact button[type=submit]').click(); await settle(p, 160)
      const st = await p.evaluate(() => ({ open: document.querySelector('.bk-sheet').open, msgs: document.querySelectorAll('.bk-sheet .bk-msg, .bk-sheet .g-input__message:not(:empty), .bk-sheet [class*="__message"]:not(:empty)').length }))
      const a = await active(p)
      rec(eng, 'compact', `${qs}: enviar incompleto abre la hoja con los errores y enfoca el primero`, st.open && st.msgs > 0 && (a.inv === 'true' || a.dataInv), JSON.stringify({ st, a }))
      rec(eng, 'compact', `${qs}: sin desplazamiento horizontal`, !(await overflow(p)))
      await close(p, eng, 'compact', qs)
    }
    // Histéresis: a 1440 en fila; estrechar → resumen; ensanchar → fila otra vez
    const p = await open(b, '?c=base&t=hotel')
    await p.setViewportSize({ width: 600, height: 800 }); await settle(p, 120)
    const c1 = await p.locator('.bk-compact').count()
    await p.setViewportSize({ width: 1440, height: 800 }); await settle(p, 160)
    rec(eng, 'compact', 'estrechar → resumen; ensanchar → fila', c1 === 1 && (await p.locator('.bk-row').count()) === 1)
    await close(p, eng, 'compact', 'histéresis')
  }

  // ---------------- RTL ----------------
  if (PARTS.includes('rtl')) {
    for (const c of ['base', 'A']) {
      const p = await open(b, `?c=${c}&t=hotel&dir=rtl`)
      rec(eng, 'rtl', `${c}: sin desplazamiento horizontal`, !(await overflow(p)))
      const trg = p.locator(c === 'base' ? '.bk-f--party .bk-trigger' : '.bk-f--party .bk-trigger')
      await trg.click(); await settle(p, 80)
      const g = await p.evaluate(() => { const t = document.querySelector('.bk-f--party .bk-trigger').getBoundingClientRect(); const r = document.querySelector('.bk-f--party .bk-panel').getBoundingClientRect(); return { tr: t.right, pr: r.right, pl: r.left, vw: document.documentElement.clientWidth } })
      rec(eng, 'rtl', `${c}: el panel se alinea al borde inicial (derecho) del disparador o se recoloca dentro del visor`, (Math.abs(g.tr - g.pr) < 2 || g.pl >= 7) && g.pr <= g.vw, JSON.stringify(g))
      await close(p, eng, 'rtl', c)
    }
  }

  // ---------------- A · La frase ----------------
  if (PARTS.includes('A')) {
    const p = await open(b, '?c=A&t=hotel')
    const names = await p.$$eval('.bk-sentence .bk-trigger', (bs) => bs.map((el) => el.getAttribute('aria-labelledby').split(' ').map((id) => document.getElementById(id).textContent.trim()).join(' ')))
    rec(eng, 'A', 'tres huecos con nombre = rótulo oculto + texto visible', names.length === 3 && /^Llegada ¿qué día\?/.test(names[0]) && /^Noches/.test(names[1]) && /^Huéspedes 2 adultos/.test(names[2]), names.join(' | '))
    const sentence = await p.evaluate(() => document.querySelector('.bk-sentence').innerText.replace(/\s+/g, ' ').trim())
    rec(eng, 'A', 'la frase se lee entera en orden', /^Llego el .* me quedo .* y somos .*\.$/.test(sentence), sentence)
    await submit(p)
    const a = await active(p)
    rec(eng, 'A', 'envío vacío: foco en el primer hueco inválido y mensaje visible', a.inv === 'true' && (await p.locator('.bk-errors .bk-msg').count()) >= 1, JSON.stringify(a))
    // noches: popover con contador, la ayuda dice la salida
    await setState(p, 'hotel', { start: addD(TODAY, 7) }); await settle(p)
    await p.locator('.bk-sentence .bk-trigger').nth(1).click(); await settle(p, 80)
    await p.keyboard.press('ArrowUp'); await p.keyboard.press('ArrowUp'); await settle(p, 60)
    const hint = await p.evaluate(() => document.querySelector('.bk-panel:popover-open')?.innerText || '')
    rec(eng, 'A', 'el contador de noches dice la salida en palabras', (await p.evaluate(() => window.__bk.S.hotel.nights)) >= 1 && /Salida/.test(hint), hint.replace(/\s+/g, ' '))
    await p.keyboard.press('Escape'); await settle(p, 60)
    await setState(p, 'hotel', { nights: 2 }); await settle(p)
    await submit(p)
    rec(eng, 'A', 'lleno: el mismo objeto de intención que la base', (await waitSent(p)) && (await lastIntent(p)).to === addD(TODAY, 9))
    for (const vw of [390, 320]) { await p.setViewportSize({ width: vw, height: 800 }); await settle(p, 80); rec(eng, 'A', `la frase refluye sin resumen ni hoja a ${vw}`, !(await overflow(p)) && (await p.locator('.bk-sheet').count()) === 0) }
    await close(p, eng, 'A', 'hotel')
    const r = await open(b, '?c=A&t=restaurante', { vw: 390, vh: 844 })
    await r.locator('.bk-sentence .bk-trigger').nth(2).click(); await settle(r, 80)
    const slots = await r.evaluate(() => [...document.querySelectorAll('.bk-panel:popover-open input[type=radio]')].map((i) => i.disabled))
    rec(eng, 'A', 'restaurante: la hora son opciones; las llenas, deshabilitadas', slots.length === 10 && slots.filter(Boolean).length === 2)
    const inView = await r.evaluate(() => { const el = document.querySelector('.bk-panel:popover-open').getBoundingClientRect(); return el.left >= 0 && el.right <= document.documentElement.clientWidth })
    rec(eng, 'A', 'restaurante 390: el panel cabe en el visor', inView)
    await close(r, eng, 'A', 'restaurante')
    const t = await open(b, '?c=A&t=tour', { vw: 320, vh: 700 })
    rec(eng, 'A', 'tour 320: sin desplazamiento horizontal', !(await overflow(t)))
    await close(t, eng, 'A', 'tour')
  }

  // ---------------- B · El muelle ----------------
  if (PARTS.includes('B')) {
    for (const rm of ['no-preference', 'reduce']) {
      const p = await open(b, '?c=B&t=hotel', { vw: 390, vh: 800, reducedMotion: rm })
      const dock = p.locator('[data-dock]')
      rec(eng, 'B', `${rm}: oculto e inerte con la barra a la vista`, !(await dock.evaluate((el) => el.classList.contains('is-shown'))) && (await dock.evaluate((el) => el.inert)))
      await setState(p, 'hotel', { start: addD(TODAY, 7), nights: 2 })
      await p.evaluate(() => window.scrollTo(0, 1600)); await settle(p, 400)
      const st = await dock.evaluate((el) => ({ shown: el.classList.contains('is-shown'), inert: el.inert, tr: getComputedStyle(el).transitionProperty, txt: el.innerText }))
      rec(eng, 'B', `${rm}: aparece al dejar atrás la barra, con el resumen`, st.shown && !st.inert && /noches/.test(st.txt), JSON.stringify(st))
      if (rm === 'reduce') rec(eng, 'B', 'reduce: sin desplazamiento, solo fundido', !/translate/.test(st.tr), st.tr)
      // 2.4.11: lo enfocado no queda bajo el muelle
      const btns = p.locator('.bk-offer .g-btn')
      await btns.last().focus(); await settle(p, 120)
      const g = await p.evaluate(() => ({ b: document.activeElement.getBoundingClientRect().bottom, d: document.querySelector('[data-dock]').getBoundingClientRect().top }))
      rec(eng, 'B', `${rm}: el foco nunca queda tapado por el muelle (2.4.11)`, g.b <= g.d + 1, JSON.stringify(g))
      rec(eng, 'B', `${rm}: las ofertas llevan las fechas elegidas`, /13–15 nov|9–11 nov|nov/.test(await btns.first().textContent()), await btns.first().textContent())
      // Cambiar → hoja; Esc → foco vuelve al muelle
      await p.locator('.bk-dock__sum').click(); await settle(p, 120)
      rec(eng, 'B', `${rm}: «Cambiar» abre la hoja de la misma consulta`, await p.evaluate(() => document.querySelector('.bk-sheet').open))
      await p.keyboard.press('Escape'); await settle(p, 120)
      rec(eng, 'B', `${rm}: al cerrar, el foco vuelve al muelle`, (await active(p)).cls.includes('bk-dock__sum'))
      await p.locator('.bk-dock__cta').click()
      rec(eng, 'B', `${rm}: el botón del muelle envía la misma intención`, (await waitSent(p)) && (await lastIntent(p)).nights === 2)
      rec(eng, 'B', `${rm}: sin desplazamiento horizontal`, !(await overflow(p)))
      await p.evaluate(() => window.scrollTo(0, 0)); await settle(p, 300)
      rec(eng, 'B', `${rm}: al volver arriba se va y queda inerte`, !(await dock.evaluate((el) => el.classList.contains('is-shown'))) && (await dock.evaluate((el) => el.inert)))
      await close(p, eng, 'B', rm)
    }
  }

  // ---------------- C · El conserje ----------------
  if (PARTS.includes('C')) {
    const p = await open(b, '?c=C&t=restaurante', { vw: 390, vh: 844 })
    rec(eng, 'C', 'una pregunta a la vez', (await p.locator('.bk-q').count()) === 1)
    await p.locator('.bk-chip', { hasText: /^2$/ }).click(); await settle(p, 120)
    let a = await active(p)
    rec(eng, 'C', 'responder deja el renglón y lleva el foco a la siguiente pregunta', a.text === '¿Qué día?' && (await p.locator('.bk-answer').count()) === 1, JSON.stringify(a))
    await settle(p, 80)
    rec(eng, 'C', 'anuncia la respuesta y la siguiente pregunta', /2 personas\. Siguiente: ¿Qué día\?/.test(await liveText(p)), await liveText(p))
    await p.locator('.bk-chip', { hasText: /^hoy$/ }).click(); await settle(p, 120)
    rec(eng, 'C', 'las horas llenas no se pueden elegir', (await p.locator('.bk-chip:disabled').count()) === 2)
    await p.locator('.bk-chip', { hasText: /^19:30$/ }).click(); await settle(p, 120)
    a = await active(p)
    rec(eng, 'C', 'al terminar, el foco va al resumen final', /bk-final__title/.test(a.cls), JSON.stringify(a))
    await p.locator('.bk-answer').first().getByRole('button', { name: 'Cambiar personas' }).click(); await settle(p, 120)
    rec(eng, 'C', '«Cambiar» reabre esa pregunta y enfoca su título', (await active(p)).text === '¿Para cuántas personas?')
    await p.locator('.bk-chip', { hasText: /^4$/ }).click(); await settle(p, 120)
    rec(eng, 'C', 'cambiar una respuesta vuelve al final sin repetir lo demás', /bk-final__title/.test((await active(p)).cls) && (await p.locator('.bk-answer').count()) === 3)
    await submit(p)
    rec(eng, 'C', 'el mismo objeto de intención', (await waitSent(p)) && JSON.stringify(await lastIntent(p)) === JSON.stringify({ template: 'restaurante', date: TODAY, time: '19:30', guests: { adults: 4, children: 0 } }))
    rec(eng, 'C', 'sin desplazamiento horizontal a 390', !(await overflow(p)))
    await close(p, eng, 'C', 'restaurante')
    const h = await open(b, '?c=C&t=hotel', { vw: 320, vh: 700 })
    await setState(h, 'hotel', { start: addD(TODAY, 7), nights: 2 }); await settle(h, 80)
    rec(eng, 'C', 'hotel: las fechas quedan como renglón y sigue «¿Quiénes vienen?»', (await h.locator('.bk-answer').count()) === 1 && /Quiénes/.test(await h.locator('.bk-q__title').textContent()))
    rec(eng, 'C', 'hotel 320: sin desplazamiento horizontal', !(await overflow(h)))
    await close(h, eng, 'C', 'hotel')
  }

  // ---------------- Deshabilitado y tema oscuro ----------------
  if (PARTS.includes('state')) {
    for (const c of ['base', 'A', 'C']) {
      const p = await open(b, `?c=${c}&t=hotel&state=disabled`)
      const n = await p.evaluate(() => [...document.querySelectorAll('form[role=search] button:not([type=hidden])')].filter((x) => !x.disabled && !x.closest('[popover]') && !x.closest('dialog') && !x.matches('.g-datepicker__nav')).length)
      rec(eng, 'state', `${c}: deshabilitado, ningún botón activo (salvo la navegación de mes del calendario en línea: hallazgo para bruno)`, n === 0, String(n))
      await close(p, eng, 'state', c + ' disabled')
    }
    const d = await open(b, '?c=A&t=tour&theme=dark')
    rec(eng, 'state', 'tema oscuro: la superficie de la frase cambia', await d.evaluate(() => getComputedStyle(document.querySelector('.bk-sentence-form')).backgroundColor !== 'rgb(255, 255, 255)'))
    await close(d, eng, 'state', 'oscuro')
    if (eng === 'chromium') {
      const f = await open(b, '?c=base&t=hotel', { forcedColors: 'active' })
      rec(eng, 'state', 'forced-colors: la barra conserva su borde', await f.evaluate(() => getComputedStyle(document.querySelector('.bk-bar')).borderTopStyle === 'solid'))
      await close(f, eng, 'state', 'forced-colors')
    }
  }
  await b.close()
}
server.close()
const by = {}
for (const r of R) { const k = r.eng; by[k] = by[k] || { ok: 0, n: 0 }; by[k].n++; if (r.ok) by[k].ok++ }
console.log(Object.entries(by).map(([k, v]) => `${k}: ${v.ok}/${v.n}`).join(' · '))
const ok = R.filter((r) => r.ok).length
console.log(`${ok} de ${R.length} pasan`)
process.exit(ok === R.length ? 0 : 1)
