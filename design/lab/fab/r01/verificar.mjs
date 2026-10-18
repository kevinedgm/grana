// Verificación del botón flotante con acciones (kiwi r01): base y conceptos A, B y C, estados, borde compartido,
// modal, táctil, 320px, RTL, oscuro y movimiento reducido, y la frontera con GBtn/GMenu/GDialog reales.
// Ejecutar: node design/lab/fab/r01/verificar.mjs (puerto 4213; GRANA_PW_PORT lo cambia; ENGINES=chromium,firefox,webkit;
// VERBOSE=1). Requiere packages/vue/dist (npm run build). Solo lee.
import { serve, pw } from './serve.mjs'

const ENGINES = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
const V = !!process.env.VERBOSE
const R = []
const rec = (eng, part, name, ok, info = '') => { R.push({ eng, part, name, ok: !!ok, info }); if (V || !ok) console.log(`${ok ? 'ok  ' : 'FALLA'} ${eng} ${part} · ${name}${info !== '' ? ' · ' + info : ''}`) }
const { server, base } = await serve()

const H = () => {
  window.__rgb = (c) => { const cv = document.createElement('canvas'); cv.width = cv.height = 1; const x = cv.getContext('2d'); x.fillStyle = '#000'; x.fillStyle = c; x.fillRect(0, 0, 1, 1); const d = x.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
  window.__lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  window.__ratio = (a, b) => { const L1 = __lum(a), L2 = __lum(b); return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05) }
  window.__bg = (el) => { for (let a = el; a; a = a.parentElement) { const c = __rgb(getComputedStyle(a).backgroundColor); if (c[3] > 0.95) return c } return __rgb(getComputedStyle(document.body).backgroundColor) }
  window.__contrast = (el) => __ratio(__rgb(getComputedStyle(el).color), __bg(el))
  window.__item = (id, label) => [...document.querySelectorAll('#' + id + ' .lab-fab__item')].find((b) => b.querySelector('.lab-fab__label')?.textContent === label)
  window.__hit = (a, b) => a.left < b.right - 0.5 && a.right > b.left + 0.5 && a.top < b.bottom - 0.5 && a.bottom > b.top + 0.5
}
async function open(b, q = '', opts = {}) {
  const { vw = 1400, vh = 1000, page = 'index.html', ...ctx } = opts
  const context = await b.newContext({ viewport: { width: vw, height: vh }, ...ctx })
  const p = await context.newPage()
  const errs = []
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.text()) })
  p.on('pageerror', (e) => errs.push(String(e)))
  await p.goto(`${base}/${page}${q}`)
  await p.waitForFunction(() => window.__ready)
  await p.evaluate(H)
  await p.evaluate(() => document.fonts.ready)
  p.__errs = errs
  return p
}
const setN = async (p, c, n) => { await p.click(`section[data-gallery="${c}"] .counts button[data-n="${n}"]`); await p.waitForTimeout(60) }
const T = (f) => `#${f}-fab-trigger`
async function openFab(p, f, how = 'click') {
  await p.locator(`#${f}`).scrollIntoViewIfNeeded()
  if (how === 'click') await p.click(T(f)); else { await p.focus(T(f)); await p.keyboard.press(how) }
  await p.waitForTimeout(380)
}
const info = (p, f) => p.evaluate((f) => {
  const el = document.getElementById(f + '-fab'), m = document.getElementById(f + '-fab-menu'), s = document.getElementById(f + '-fab-more'), t = document.getElementById(f + '-fab-trigger')
  const a = document.activeElement
  return { ap: el.dataset.appearance, fb: el.dataset.fallback || '', exp: t && t.getAttribute('aria-expanded'), menuOpen: m.matches(':popover-open'), subOpen: s.matches(':popover-open'),
    active: (a && a.querySelector && a.querySelector('.lab-fab__label') ? a.querySelector('.lab-fab__label').textContent : (a && a.textContent || '').trim()),
    where: !a || a === document.body ? 'body' : m.contains(a) ? 'menu' : s.contains(a) ? 'sub' : el.contains(a) ? 'fab' : 'out', items: m.querySelectorAll('[role="menuitem"]').length, ack: el.dataset.ack || '' }
}, f)
// Geometría de lo abierto: dentro del marco (margen ≥ 8px), sin solapes entre acciones, etiquetas y el FAB
const geom = (p, f) => p.evaluate((f) => {
  const fr = document.getElementById(f).getBoundingClientRect()
  const m = document.getElementById(f + '-fab-menu'), s = document.getElementById(f + '-fab-more')
  const fab = document.getElementById(f + '-fab').getBoundingClientRect()
  const boxes = []
  if (m.classList.contains('lab-fab__menu--panel')) boxes.push({ r: m.getBoundingClientRect(), k: 'panel' })
  else for (const b of m.querySelectorAll('.lab-fab__item')) { boxes.push({ r: b.getBoundingClientRect(), k: 'item' }); if (m.classList.contains('lab-fab__menu--arc')) boxes.push({ r: b.querySelector('.lab-fab__label').getBoundingClientRect(), k: 'label' }) }
  if (s.matches(':popover-open')) boxes.push({ r: s.getBoundingClientRect(), k: 'sub' })
  const inside = boxes.every(({ r }) => r.left >= fr.left + 7.5 && r.right <= fr.right - 7.5 && r.top >= fr.top + 7.5 && r.bottom <= fr.bottom - 7.5)
  let overlaps = 0
  const own = boxes.filter((x) => x.k !== 'sub')
  for (let i = 0; i < own.length; i++) { if (__hit(own[i].r, fab)) overlaps++; for (let j = i + 1; j < own.length; j++) if (__hit(own[i].r, own[j].r)) overlaps++ }
  const minH = Math.min(...[...m.querySelectorAll('.lab-fab__item')].map((b) => b.getBoundingClientRect().height))
  const minW = Math.min(...[...m.querySelectorAll('.lab-fab__item')].map((b) => b.getBoundingClientRect().width))
  return { inside, overlaps, n: boxes.length, minH, minW }
}, f)
// Sitio de cada acción por su borde del lado del FAB (derecho en LTR) y su alto: la etiqueta puede cambiar de ancho
const itemRects = (p, f, labels) => p.evaluate(([f, labels]) => labels.map((l) => { const b = __item(f + '-fab-menu', l); if (!b) return null; const r = b.getBoundingClientRect(); return [r.right, r.top, r.height] }), [f, labels])
const same = (a, b, tol = 0.5) => a && b && a.length === b.length && a.every((x, i) => x && b[i] && x.every((v, k) => Math.abs(v - b[i][k]) <= tol))
const itemCenter = async (p, sel) => { const r = await p.locator(sel).first().boundingBox(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, l: r.x, t: r.y, w: r.width, h: r.height } }
const byLabel = (f, l, where = 'menu') => `#${f}-fab-${where} .lab-fab__item:has(.lab-fab__label:text-is("${l}"))` // selector de Playwright (no de querySelector)
const sel = (p) => p.evaluate(() => window.__selects.slice())

async function run(eng) {
  const b = await pw[eng].launch()
  const ck = (part) => (n, ok, i = '') => rec(eng, part, n, ok, i)

  // ================= Semántica, foco, teclado y geometría (base, A, B, C) en escritorio =================
  {
    const p = await open(b)
    for (const [c, n, first, ap] of [['base', 3, 'Nueva muestra', 'stack'], ['base', 6, 'Nueva muestra', 'panel'], ['A', 6, 'Nueva muestra', 'stack'], ['A', 15, 'Nueva muestra', 'stack'], ['B', 3, 'Nueva muestra', 'arc'], ['B', 6, 'Nueva muestra', 'arc'], ['C', 6, 'Nuevo paciente', 'panel'], ['C', 15, 'Nuevo paciente', 'panel']]) {
      const c2 = ck(`${c}·${n} escritorio`)
      const f = `f-${c}-d`
      await setN(p, c, n)
      const t0 = await p.evaluate((s) => { const t = document.querySelector(s); return { pop: t.getAttribute('aria-haspopup'), ctl: t.getAttribute('aria-controls'), exp: t.getAttribute('aria-expanded'), tag: t.tagName, type: t.type } }, T(f))
      c2('disparador: button type=button con aria-haspopup=menu, aria-controls y aria-expanded=false', t0.tag === 'BUTTON' && t0.type === 'button' && t0.pop === 'menu' && t0.ctl === `${f}-fab-menu` && t0.exp === 'false', JSON.stringify(t0))
      const nm = c === 'C' ? await p.locator(`#${f}`).getByRole('button', { name: 'Más acciones', exact: true }).count() : await p.locator(`#${f}`).getByRole('button', { name: 'Crear y capturar', exact: true }).count()
      c2('nombre accesible del disparador (sin depender del icono)', nm === 1)
      await openFab(p, f)
      const i1 = await info(p, f)
      c2(`abre: aria-expanded=true y lista role=menu visible (${ap})`, i1.exp === 'true' && i1.menuOpen && i1.ap === ap, JSON.stringify({ exp: i1.exp, ap: i1.ap }))
      c2(`foco al abrir en la primera por frecuencia («${first}»)`, i1.where === 'menu' && i1.active === first, i1.active)
      const roles = await p.evaluate((f) => { const m = document.getElementById(f + '-fab-menu'); const items = [...m.querySelectorAll('.lab-fab__item')]; return { menuitem: items.every((x) => x.getAttribute('role') === 'menuitem'), tab0: items.filter((x) => x.tabIndex === 0).length, li: [...m.querySelectorAll('li')].every((l) => l.getAttribute('role') === 'none'), groups: [...m.querySelectorAll('[role="group"]')].every((g) => { const id = g.getAttribute('aria-labelledby'); return !id || (document.getElementById(id) && document.getElementById(id).textContent.trim()) }) } }, f)
      c2('menuitem en cada acción, li role=none, grupos con nombre, una sola con tabindex=0', roles.menuitem && roles.li && roles.groups && roles.tab0 === 1, JSON.stringify(roles))
      const g = await geom(p, f)
      c2('todo dentro del marco con margen y sin solapes (acciones, etiquetas, FAB)', g.inside && g.overlaps === 0, JSON.stringify(g))
      c2('área de cada acción ≥ 24px (puntero fino: ≥ 40px de alto)', g.minH >= 39.5 && g.minW >= 24, `${g.minH.toFixed(1)} × ${g.minW.toFixed(1)}`)
      const con = await p.evaluate((f) => { const m = document.getElementById(f + '-fab-menu'); return Math.min(...[...m.querySelectorAll('.lab-fab__item:not([aria-disabled="true"]) .lab-fab__label')].map(__contrast)) }, f)
      c2('contraste de las etiquetas ≥ 4.5:1', con >= 4.5, con.toFixed(2))
      // Teclado: flechas, Inicio/Fin, letra
      const order = await p.evaluate((f) => [...document.querySelectorAll(`#${f}-fab-menu .lab-fab__item`)].filter((b) => !b.closest('[hidden]')).map((b) => b.querySelector('.lab-fab__label').textContent), f)
      await p.keyboard.press('Home')
      const home = (await info(p, f)).active
      await p.keyboard.press('End')
      const end = (await info(p, f)).active
      c2('Inicio y Fin: primera y última del DOM', home === order[0] && end === order[order.length - 1], `${home} · ${end}`)
      await p.keyboard.press('ArrowDown')
      const wrap = (await info(p, f)).active
      c2('↓ en la última vuelve a la primera (cíclico, como GMenu)', wrap === order[0], wrap)
      if (c !== 'C') {
        const target = order.find((l) => l !== wrap && /^[A-Za-zÁÉÍÓÚáéíóú]/.test(l))
        await p.keyboard.press(target[0].toLowerCase())
        const tl = (await info(p, f)).active
        c2(`letra «${target[0].toLowerCase()}» salta a la siguiente que empieza por ella`, tl[0].toLowerCase() === target[0].toLowerCase(), tl)
      }
      await p.keyboard.press('Escape')
      await p.waitForTimeout(260)
      const i2 = await info(p, f)
      c2('Esc cierra, aria-expanded=false y el foco vuelve al disparador', i2.exp === 'false' && !i2.menuOpen && i2.where === 'fab', JSON.stringify({ exp: i2.exp, open: i2.menuOpen, where: i2.where }))
      await openFab(p, f, outKey(f))
      await p.keyboard.press('Tab')
      await p.waitForTimeout(260)
      const i3 = await info(p, f)
      c2('Tab cierra y el foco sigue su curso (fuera del FAB y de la lista)', !i3.menuOpen && i3.exp === 'false' && i3.where === 'out', JSON.stringify({ open: i3.menuOpen, where: i3.where, a: i3.active }))
      await openFab(p, f)
      const fr = await itemCenter(p, `#${f}`)
      await p.mouse.click(fr.l + 40, fr.t + 40)
      await p.waitForTimeout(260)
      const i4 = await info(p, f)
      c2('clic fuera cierra sin devolver el foco al FAB', !i4.menuOpen && !['fab', 'menu', 'sub'].includes(i4.where), i4.where)
    }
    // ---- A: las frecuentes no se mueven (6 → 10 → 15) frente a la base (3 → 6) ----
    {
      const c2 = ck('A · frecuentes quietas')
      const L4 = ['Nueva muestra', 'Nuevo paciente', 'Tomar foto', 'Agendar cita']
      const at = {}
      for (const n of [6, 10, 15]) { await setN(p, 'A', n); await openFab(p, 'f-A-d'); at[n] = await itemRects(p, 'f-A-d', L4); await p.keyboard.press('Escape'); await p.waitForTimeout(250) }
      c2('las cuatro primeras, mismo sitio con 6, 10 y 15 acciones (Δ 0px)', same(at[6], at[10]) && same(at[10], at[15]), JSON.stringify([at[6][0], at[15][0]]))
      await setN(p, 'A', 3); await openFab(p, 'f-A-d'); const a3 = await itemRects(p, 'f-A-d', L4.slice(0, 3)); await p.keyboard.press('Escape'); await p.waitForTimeout(250)
      c2('y con 3 (sin cola), las tres primeras en el mismo sitio que con 15', same(a3, at[15].slice(0, 3)), JSON.stringify(a3[0]))
      await setN(p, 'base', 3); await openFab(p, 'f-base-d'); const b3 = await itemRects(p, 'f-base-d', ['Nueva muestra']); await p.keyboard.press('Escape'); await p.waitForTimeout(250)
      await setN(p, 'base', 6); await openFab(p, 'f-base-d'); const b6 = await itemRects(p, 'f-base-d', ['Nueva muestra']); await p.keyboard.press('Escape'); await p.waitForTimeout(250)
      const d = b3[0] && b6[0] ? Math.hypot(b6[0][0] - b3[0][0], b6[0][1] - b3[0][1]) : -1
      c2('contraste: en la base, «Nueva muestra» salta al pasar de 3 a 6 (cambia de forma)', d > 50, `${d.toFixed(0)}px`)
      // La pila sube y la primera es la más cercana al FAB (la última del DOM); ↑ se aleja
      await setN(p, 'A', 6); await openFab(p, 'f-A-d')
      const near = await p.evaluate(() => { const m = document.getElementById('f-A-d-fab-menu'); const it = [...m.querySelectorAll('.lab-fab__item')]; const f = document.getElementById('f-A-d-fab-trigger').getBoundingClientRect(); const last = it[it.length - 1].getBoundingClientRect(); return { lastLabel: it[it.length - 1].querySelector('.lab-fab__label').textContent, gap: f.top - last.bottom, tail: it[0].dataset.k } })
      c2('el orden nace del FAB: la primera es la más cercana (última del DOM) y la cola, la más lejana', near.lastLabel === 'Nueva muestra' && near.tail === 'more' && near.gap > 0 && near.gap < 16, JSON.stringify(near))
      await p.keyboard.press('ArrowUp')
      c2('↑ se aleja del FAB (siguiente por frecuencia)', (await info(p, 'f-A-d')).active === 'Nuevo paciente')
      // Cola «Más acciones (2)» → panel encima de la pila, sin moverla
      const before = await itemRects(p, 'f-A-d', L4)
      await p.keyboard.press('End'); await p.keyboard.press('Home')
      const tail = await p.evaluate(() => { const t = document.querySelector('#f-A-d-fab-menu [data-k="more"] .lab-fab__item'); return { pop: t.getAttribute('aria-haspopup'), ctl: t.getAttribute('aria-controls'), name: t.textContent.trim(), act: document.activeElement === t } })
      c2('cola: menuitem con aria-haspopup=menu, aria-controls y la cuenta en el nombre', tail.pop === 'menu' && tail.ctl === 'f-A-d-fab-more' && /Más acciones \(2\)/.test(tail.name) && tail.act, JSON.stringify(tail))
      await p.keyboard.press('ArrowRight')
      await p.waitForTimeout(200)
      const s1 = await info(p, 'f-A-d')
      c2('→ abre el panel de la cola con el foco en su primera acción', s1.subOpen && s1.where === 'sub' && s1.active === 'Exportar CSV', JSON.stringify({ sub: s1.subOpen, a: s1.active }))
      const after = await itemRects(p, 'f-A-d', L4)
      const gs = await geom(p, 'f-A-d')
      c2('el panel no mueve la pila (Δ 0px) y queda dentro del marco', same(before, after) && gs.inside, JSON.stringify(gs))
      const subRel = await p.evaluate(() => { const s = document.getElementById('f-A-d-fab-more').getBoundingClientRect(); const m = document.getElementById('f-A-d-fab-menu').getBoundingClientRect(); const f = document.getElementById('f-A-d-fab').getBoundingClientRect(); const fr = document.getElementById('f-A-d').getBoundingClientRect(); return { room: m.top - fr.top - 16, above: s.bottom <= m.top + 0.5, covers: s.bottom <= f.top + 0.5 && s.bottom > m.top, lab: document.getElementById('f-A-d-fab-more').getAttribute('aria-labelledby') } })
      c2('el panel va encima de la pila si sobran ≥ 160px; si no, la cubre sin tapar el FAB (cascada); lo nombra la cola', (subRel.room >= 160 ? subRel.above : subRel.covers) && subRel.lab === 'f-A-d-fab-tail', JSON.stringify(subRel))
      await p.keyboard.press('ArrowLeft')
      const s2 = await info(p, 'f-A-d')
      c2('← cierra el panel y vuelve a la cola', !s2.subOpen && s2.where === 'menu' && /Más acciones/.test(s2.active), s2.active)
      await p.keyboard.press('Escape'); await p.waitForTimeout(250)
    }
    // ---- Peligrosa: confirmación en el sitio; doble clic nunca ejecuta ----
    {
      const c2 = ck('peligrosa')
      await setN(p, 'A', 6); await openFab(p, 'f-A-d')
      await p.click('#f-A-d-fab-menu [data-k="more"] .lab-fab__item'); await p.waitForTimeout(200)
      const del = await itemCenter(p, byLabel('f-A-d', 'Eliminar borrador', 'more'))
      const mark = await p.evaluate(() => !!__item('f-A-d-fab-more', 'Eliminar borrador').querySelector('.lab-fab__mark'))
      c2('se distingue por forma (icono triangle-alert), no solo por color', mark)
      const n0 = (await sel(p)).length
      await p.mouse.dblclick(del.l + 30, del.y)
      await p.waitForTimeout(150)
      const cf = await p.evaluate(([x, y]) => { const g = document.querySelector('#f-A-d-fab-more .lab-fab__confirm'); if (!g) return null; const c = g.querySelector('[data-role="cancel"]').getBoundingClientRect(), o = g.querySelector('[data-role="confirm"]').getBoundingClientRect(); const inR = (r) => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; return { role: g.getAttribute('role'), name: g.getAttribute('aria-label'), focus: document.activeElement && document.activeElement.dataset.role, cancelUnder: inR(c), confirmUnder: inR(o) } }, [del.l + 30, del.y])
      c2('doble clic: no ejecuta; abre la confirmación', (await sel(p)).length === n0 && cf, JSON.stringify(cf))
      c2('par con role=group y la pregunta como nombre; foco en «Cancelar»', cf && cf.role === 'group' && /¿Eliminar el borrador\?/.test(cf.name) && cf.focus === 'cancel')
      c2('«Cancelar» nace bajo el puntero; la confirmación no', cf && cf.cancelUnder && !cf.confirmUnder)
      await p.keyboard.press('Escape')
      const d1 = await p.evaluate(() => ({ g: !!document.querySelector('#f-A-d-fab-more .lab-fab__confirm'), a: document.activeElement.querySelector('.lab-fab__label')?.textContent, sub: document.getElementById('f-A-d-fab-more').matches(':popover-open') }))
      c2('Esc deshace la confirmación (la lista sigue abierta y el foco en la acción)', !d1.g && d1.a === 'Eliminar borrador' && d1.sub, JSON.stringify(d1))
      await p.keyboard.press('Enter'); await p.waitForTimeout(80)
      await p.keyboard.press('ArrowDown'); await p.waitForTimeout(80)
      const k1 = await p.evaluate(() => document.activeElement.dataset.role)
      await p.keyboard.press('Enter'); await p.waitForTimeout(300)
      const after = await sel(p)
      c2('con teclado: Intro → «Cancelar», ↓ → confirmar, Intro ejecuta una vez y cierra', k1 === 'confirm' && after.length === n0 + 1 && after[after.length - 1] === 'eliminar' && !(await info(p, 'f-A-d')).menuOpen, JSON.stringify({ k1, last: after[after.length - 1] }))
    }
    // ---- Acción en curso y fallida (acuse en el FAB, #643) ----
    {
      const c2 = ck('en curso')
      await openFab(p, 'f-A-d')
      await p.click('#f-A-d-fab-menu [data-k="more"] .lab-fab__item'); await p.waitForTimeout(150)
      await p.click(byLabel('f-A-d', 'Exportar CSV', 'more')); await p.waitForTimeout(120)
      const a1 = await p.evaluate(() => ({ ack: document.getElementById('f-A-d-fab').dataset.ack, st: document.getElementById('f-A-d-fab-status').textContent, by: document.getElementById('f-A-d-fab-trigger').getAttribute('aria-describedby'), live: document.getElementById('lab-live').textContent }))
      c2('al elegir: insignia «en curso» en el FAB y su descripción', a1.ack === 'busy' && a1.st === 'Exportando CSV…' && a1.by === 'f-A-d-fab-status', JSON.stringify(a1))
      c2('anuncio cortés «Exportando CSV…»', /Exportando CSV/.test(a1.live), a1.live)
      await openFab(p, 'f-A-d')
      await p.click('#f-A-d-fab-menu [data-k="more"] .lab-fab__item'); await p.waitForTimeout(150)
      const busyItem = await p.evaluate(() => { const b = __item('f-A-d-fab-more', 'Exportar CSV'); return { dis: b.getAttribute('aria-disabled'), desc: (b.getAttribute('aria-describedby') || '').split(' ').map((i) => document.getElementById(i)?.textContent).join(' ') } })
      c2('mientras dura, la acción está aria-disabled con el motivo (no se lanza dos veces)', busyItem.dis === 'true' && /Exportando/.test(busyItem.desc), JSON.stringify(busyItem))
      const n0 = (await sel(p)).length
      await p.click(byLabel('f-A-d', 'Exportar CSV', 'more'), { force: true }); await p.waitForTimeout(80)
      c2('pulsarla en curso no hace nada', (await sel(p)).length === n0)
      await p.keyboard.press('Escape'); await p.keyboard.press('Escape'); await p.waitForTimeout(1300)
      const a2 = await p.evaluate(() => ({ ack: document.getElementById('f-A-d-fab').dataset.ack, ann: window.__announced.slice(-1)[0] }))
      c2('al terminar: insignia «hecho» y anuncio «CSV exportado»', a2.ack === 'done' && a2.ann === 'CSV exportado', JSON.stringify(a2))
      await setN(p, 'C', 15); await openFab(p, 'f-C-d')
      await p.click(byLabel('f-C-d', 'Compartir')); await p.waitForTimeout(800)
      await openFab(p, 'f-C-d')
      const fl = await p.evaluate(() => { const b = __item('f-C-d-fab-menu', 'Compartir'); return { ack: document.getElementById('f-C-d-fab').dataset.ack, dis: b.getAttribute('aria-disabled'), why: b.querySelector('.lab-fab__why')?.textContent } })
      c2('fallida: insignia de alerta y el motivo en la acción, que se puede reintentar', fl.ack === 'failed' && fl.dis === null && /sin conexión/.test(fl.why || ''), JSON.stringify(fl))
      await p.keyboard.press('Escape'); await p.waitForTimeout(250)
    }
    // ---- Doble activación: doble clic y Intro mantenido ----
    {
      const c2 = ck('una activación por gesto')
      await setN(p, 'A', 6)
      await p.locator('#f-A-d').scrollIntoViewIfNeeded()
      await p.dblclick(T('f-A-d')); await p.waitForTimeout(350)
      c2('doble clic en el FAB: queda abierto (el segundo clic no lo cierra)', (await info(p, 'f-A-d')).menuOpen)
      await p.keyboard.press('Escape'); await p.waitForTimeout(250)
      const n0 = (await sel(p)).length
      await p.focus(T('f-A-d'))
      await p.keyboard.down('Enter'); await p.waitForTimeout(300)
      await p.keyboard.down('Enter'); await p.keyboard.down('Enter'); await p.keyboard.up('Enter'); await p.waitForTimeout(300)
      const h1 = await info(p, 'f-A-d')
      c2('Intro mantenido en el FAB: abre una vez y no ejecuta la acción enfocada', h1.menuOpen && (await sel(p)).length === n0, JSON.stringify({ open: h1.menuOpen, sel: (await sel(p)).length - n0 }))
      await p.keyboard.down('Enter'); await p.waitForTimeout(300)
      await p.keyboard.down('Enter'); await p.keyboard.down('Enter'); await p.keyboard.up('Enter'); await p.waitForTimeout(300)
      const h2 = await info(p, 'f-A-d')
      const s = await sel(p)
      c2('Intro mantenido en una acción: una sola ejecución y el FAB no se reabre', s.length === n0 + 1 && !h2.menuOpen && h2.exp === 'false', JSON.stringify({ sel: s.slice(n0), open: h2.menuOpen }))
    }
    // ---- B: gesto de marca, cancelar en el centro, arco ≤ alcance del pulgar ----
    {
      const c2 = ck('B · gesto')
      await setN(p, 'B', 3)
      await p.locator('#f-B-d').scrollIntoViewIfNeeded()
      const fc = await itemCenter(p, T('f-B-d'))
      await p.click(T('f-B-d')); await p.waitForTimeout(350)
      const target = await itemCenter(p, byLabel('f-B-d', 'Tomar foto'))
      await p.keyboard.press('Escape'); await p.waitForTimeout(300)
      const n0 = (await sel(p)).length
      await p.mouse.move(fc.x, fc.y); await p.mouse.down()
      for (let k = 1; k <= 8; k++) await p.mouse.move(fc.x + ((target.x - fc.x) * k) / 8, fc.y + ((target.y - fc.y) * k) / 8)
      await p.waitForTimeout(60)
      const aimed = await p.evaluate(() => document.querySelector('#f-B-d-fab-menu .is-aimed .lab-fab__label')?.textContent)
      await p.mouse.up(); await p.waitForTimeout(320)
      const s = await sel(p)
      c2('pulsar, deslizar hacia «Tomar foto» y soltar: la ejecuta y cierra', aimed === 'Tomar foto' && s.length === n0 + 1 && s[s.length - 1] === 'foto' && !(await info(p, 'f-B-d')).menuOpen, JSON.stringify({ aimed, last: s[s.length - 1] }))
      c2('…sin abrir con el clic que sigue al gesto (una activación por gesto)', !(await info(p, 'f-B-d')).menuOpen)
      await p.mouse.move(fc.x, fc.y); await p.mouse.down()
      await p.mouse.move(fc.x - 40, fc.y - 40, { steps: 4 }); await p.mouse.move(fc.x, fc.y, { steps: 4 })
      await p.mouse.up(); await p.waitForTimeout(320)
      c2('volver al centro y soltar cancela (2.5.2): nada se ejecuta y el arco se cierra', (await sel(p)).length === n0 + 1 && !(await info(p, 'f-B-d')).menuOpen)
      await setN(p, 'B', 6); await openFab(p, 'f-B-d')
      const arc = await p.evaluate(() => { const e = document.getElementById('f-B-d-fab'); return { r: Number(e.dataset.arcRadius), n: Number(e.dataset.arcCount), more: !!document.querySelector('#f-B-d-fab-menu [data-k="more"]'), danger: !!document.querySelector('#f-B-d-fab-menu .lab-fab__item--danger') } })
      c2('con 6: el arco se queda en el alcance del pulgar (radio ≤ 200px) y el resto va a «Más»', arc.r <= 200 && arc.more && arc.n >= 2, JSON.stringify(arc))
      c2('lo destructivo nunca queda a un gesto (va en «Más»)', !arc.danger)
      await p.keyboard.press('ArrowRight')
      c2('en el arco, → (y ↓) avanzan por el arco', (await info(p, 'f-B-d')).active === 'Nuevo paciente')
      await p.keyboard.press('Escape'); await p.waitForTimeout(250)
      await setN(p, 'B', 6); await openFab(p, 'f-B-m')
      const ph = await info(p, 'f-B-m')
      c2('móvil (360px): lista antes que radial, el arco se resuelve a la pila (data-fallback=arc)', ph.ap === 'stack' && ph.fb === 'arc', JSON.stringify(ph))
      await p.keyboard.press('Escape'); await p.waitForTimeout(250)
    }
    // ---- C: la principal a un toque; búsqueda sin campo; transformación desde la cola ----
    {
      const c2 = ck('C · acción con cola')
      await setN(p, 'C', 15)
      await p.locator('#f-C-d').scrollIntoViewIfNeeded()
      const grp = await p.evaluate(() => { const g = document.querySelector('#f-C-d-fab .lab-fab__split'); return { role: g.getAttribute('role'), name: g.getAttribute('aria-label'), btns: g.querySelectorAll('button').length } })
      c2('principal y cola: role=group con nombre y dos botones', grp.role === 'group' && grp.name === 'Crear y capturar' && grp.btns === 2, JSON.stringify(grp))
      const n0 = (await sel(p)).length
      await p.click('#f-C-d-fab-main'); await p.waitForTimeout(150)
      const s = await sel(p)
      c2('la principal se ejecuta con un toque, sin abrir nada', s.length === n0 + 1 && s[s.length - 1] === 'muestra' && !(await info(p, 'f-C-d')).menuOpen)
      await p.click(T('f-C-d')); await p.waitForTimeout(40)
      const clip = await p.evaluate(() => { const m = document.getElementById('f-C-d-fab-menu'); return { st: m.dataset.state, clip: getComputedStyle(m).clipPath } })
      await p.waitForTimeout(400)
      c2('el panel nace del tamaño de la cola (clip-path de partida ≠ caja completa)', /inset/.test(clip.clip) && !/inset\(0px/.test(clip.clip), JSON.stringify(clip))
      await p.keyboard.type('exp'); await p.waitForTimeout(120)
      const f1 = await p.evaluate(() => { const m = document.getElementById('f-C-d-fab-menu'); const vis = [...m.querySelectorAll('.lab-fab__item')].filter((b) => !b.closest('[hidden]')).map((b) => b.querySelector('.lab-fab__label').textContent); return { vis, head: m.querySelector('.lab-fab__find').textContent, hidden: m.querySelector('.lab-fab__find').getAttribute('aria-hidden'), act: document.activeElement.querySelector('.lab-fab__label')?.textContent } })
      c2('escribir «exp» filtra por nombre y descripción, y se ve en la cabecera', f1.vis.length === 1 && f1.vis[0] === 'Exportar CSV' && /«exp»/.test(f1.head) && f1.act === 'Exportar CSV', JSON.stringify(f1))
      c2('la cabecera es aria-hidden; el recuento se anuncia por el canal cortés', f1.hidden === 'true' && (await p.evaluate(() => window.__announced.slice(-1)[0])) === '1 acción')
      await p.keyboard.press('Backspace'); await p.keyboard.press('Backspace'); await p.waitForTimeout(80)
      const f2 = await p.evaluate(() => [...document.querySelectorAll('#f-C-d-fab-menu .lab-fab__item')].filter((b) => !b.closest('[hidden]')).length)
      c2('Retroceso corrige («e» encuentra más)', f2 > 1, f2)
      await p.keyboard.type('qqq'); await p.waitForTimeout(80)
      const f3 = await p.evaluate(() => ({ n: [...document.querySelectorAll('#f-C-d-fab-menu .lab-fab__item')].filter((b) => !b.closest('[hidden]')).length, head: document.querySelector('#f-C-d-fab-menu .lab-fab__find').textContent, a: document.activeElement.getAttribute('role') }))
      c2('sin coincidencias: lo dice y no vacía la lista ni pierde el foco', f3.n === f2 && /Sin coincidencias/.test(f3.head) && f3.a === 'menuitem', JSON.stringify(f3))
      await p.keyboard.press('Escape'); await p.waitForTimeout(80)
      const f4 = await info(p, 'f-C-d')
      const f4n = await p.evaluate(() => [...document.querySelectorAll('#f-C-d-fab-menu .lab-fab__item')].filter((b) => !b.closest('[hidden]')).length)
      c2('Esc limpia la búsqueda sin cerrar', f4.menuOpen && f4n === 14, f4n)
      await p.keyboard.press('Escape'); await p.waitForTimeout(260)
      const f5 = await info(p, 'f-C-d')
      c2('otra Esc cierra y el foco vuelve a la cola', !f5.menuOpen && f5.where === 'fab' && f5.active === 'Más acciones', f5.active)
      await setN(p, 'C', 15); await openFab(p, 'f-C-m')
      const pw2 = await p.evaluate(() => { const m = document.getElementById('f-C-m-fab-menu').getBoundingClientRect(), f = document.getElementById('f-C-m').getBoundingClientRect(); return { w: m.width, fw: f.width } })
      c2('móvil: el panel ocupa el ancho del marco menos los márgenes', Math.abs(pw2.w - (pw2.fw - 32)) < 2, JSON.stringify(pw2))
      await p.keyboard.press('Escape'); await p.waitForTimeout(250)
    }
    // ---- Se aparta: nunca tapa lo que tiene el foco (2.4.11) ----
    {
      const c2 = ck('se aparta')
      await setN(p, 'A', 6)
      await p.locator('#f-A-d').scrollIntoViewIfNeeded()
      const r = await p.evaluate(() => {
        const sc = document.querySelector('#f-A-d .frame__scroll'); sc.scrollTop = sc.scrollHeight
        const f = document.getElementById('f-A-d-fab-trigger').getBoundingClientRect()
        const cands = [...sc.querySelectorAll('a, input')].filter((x) => { const r = x.getBoundingClientRect(); return __hit(r, f) })
        if (!cands.length) return null
        cands[cands.length - 1].focus()
        return cands[cands.length - 1].tagName
      })
      await p.waitForTimeout(400)
      const t1 = await p.evaluate(() => { const fab = document.getElementById('f-A-d-fab'); const a = document.activeElement.getBoundingClientRect(); const f = fab.getBoundingClientRect(); const ix = Math.max(0, Math.min(a.right, f.right) - Math.max(a.left, f.left)) * Math.max(0, Math.min(a.bottom, f.bottom) - Math.max(a.top, f.top)); const cx = a.left + a.width / 2, cy = a.top + a.height / 2; return { tucked: fab.classList.contains('is-tucked'), covered: Math.round((ix / (a.width * a.height)) * 1000) / 10, center: cx >= f.left && cx <= f.right && cy >= f.top && cy <= f.bottom, visible: Math.min(f.right, document.getElementById('f-A-d').getBoundingClientRect().right) - f.left } })
      c2('con el foco en un elemento bajo el FAB, el FAB se aparta: cubre ≤ 5 % del elemento y nunca su centro (2.4.11)', r && t1.tucked && t1.covered <= 5 && !t1.center, JSON.stringify({ r, ...t1 }))
      c2('…y sigue visible y operable (≥ 24px a la vista)', t1.visible >= 23.5, t1.visible.toFixed(1))
      await p.focus(T('f-A-d')); await p.waitForTimeout(350)
      c2('al llegar el foco al FAB, vuelve a su sitio', !(await p.evaluate(() => document.getElementById('f-A-d-fab').classList.contains('is-tucked'))))
    }
    // ---- Estados: error de configuración, sin acciones, una sola (y deshabilitada) ----
    {
      const c2 = ck('estados')
      const w = await p.evaluate(() => window.__fabWarnings.filter((x) => x.owner === 'f-bad-fab').map((x) => x.msg))
      c2('error de configuración: avisa del id duplicado, del elemento sin label y de > 15', w.some((m) => /duplicado «foto»/.test(m)) && w.some((m) => /sin `label`/.test(m)) && w.some((m) => /17 acciones/.test(m)), w.length)
      await openFab(p, 'f-bad')
      await p.click('#f-bad-fab-menu [data-k="more"] .lab-fab__item'); await p.waitForTimeout(150)
      const cnt = await p.evaluate(() => document.querySelectorAll('#f-bad-fab-menu .lab-fab__item:not([data-k="more"])').length + document.querySelectorAll('#f-bad-fab-more .lab-fab__item').length)
      c2('…y pinta las 17 con nombre (nada se descarta en silencio; el panel desplaza)', cnt === 17, cnt)
      const scroll = await p.evaluate(() => { const s = document.getElementById('f-bad-fab-more'); return s.scrollHeight > s.clientHeight + 1 && getComputedStyle(s).overflowY === 'auto' })
      c2('contenido que excede la altura: el panel desplaza dentro de los márgenes y el FAB (cierre) sigue visible', scroll && (await geom(p, 'f-bad')).inside)
      await p.keyboard.press('Escape'); await p.keyboard.press('Escape'); await p.waitForTimeout(250)
      const e = await p.evaluate(() => { const el = document.getElementById('f-empty-fab'); return { empty: el.hasAttribute('data-empty'), shown: getComputedStyle(el).display, btn: !!el.querySelector('button'), pop: !!document.getElementById('f-empty-fab-menu') } })
      c2('sin acciones: ni botón ni panel vacío', e.empty && e.shown === 'none' && !e.btn && !e.pop, JSON.stringify(e))
      const o = await p.evaluate(() => { const t = document.getElementById('f-off-fab-trigger'); return { pop: t.getAttribute('aria-haspopup'), dis: t.getAttribute('aria-disabled'), desc: document.getElementById(t.getAttribute('aria-describedby')).textContent } })
      const n0 = (await sel(p)).length
      await p.locator('#f-off').scrollIntoViewIfNeeded(); await p.click('#f-off-fab-trigger', { force: true })
      c2('una sola acción deshabilitada: el FAB es esa acción (sin menú), aria-disabled con su motivo y no ejecuta', o.pop === null && o.dis === 'true' && o.desc === 'Sin impresora conectada' && (await sel(p)).length === n0, JSON.stringify(o))
      await setN(p, 'A', 1)
      await p.locator('#f-A-d').scrollIntoViewIfNeeded()
      const one = await p.locator('#f-A-d').getByRole('button', { name: 'Nueva muestra', exact: true }).count()
      const t1 = await p.evaluate(() => document.getElementById('f-A-d-fab-trigger').getAttribute('aria-haspopup'))
      await p.click(T('f-A-d')); await p.waitForTimeout(100)
      const s = await sel(p)
      c2('una acción: no hay menú; el FAB se llama como la acción y la ejecuta', one === 1 && t1 === null && s[s.length - 1] === 'muestra' && !(await p.evaluate(() => document.getElementById('f-A-d-fab-menu').matches(':popover-open'))))
    }
    // ---- Contraste del FAB ----
    {
      const c2 = ck('contraste claro')
      const fc = await p.evaluate(() => { const t = document.getElementById('f-A-m-fab-trigger'); const bg = __rgb(getComputedStyle(t).backgroundColor); return { icon: __contrast(t), edge: __ratio(bg, __bg(document.getElementById('f-A-m'))) } })
      c2('icono del FAB ≥ 3:1 sobre el FAB y FAB ≥ 3:1 sobre la página (1.4.11)', fc.icon >= 3 && fc.edge >= 3, `${fc.icon.toFixed(2)} · ${fc.edge.toFixed(2)}`)
    }
    c2b(eng, p)
    await p.context().close()
  }

  // ================= Fijo al visor: bordes compartidos, modal, 320px =================
  {
    const p = await open(b, '?solo=A&n=10&dock=1&speech=1&toast=1', { vw: 1200, vh: 800 })
    const c2 = ck('visor · bordes')
    await p.waitForTimeout(300)
    const r = await p.evaluate(() => { const g = (id) => document.getElementById(id).getBoundingClientRect(); const f = g('solo-fab'), d = g('lab-dock'), s = g('lab-speech'), t = g('lab-toast'); return { fabAboveDock: f.bottom <= d.top + 0.5, dockAboveSpeech: d.bottom <= s.top + 0.5, toastAboveFab: t.bottom <= f.top + 0.5, hits: [__hit(f, d), __hit(f, s), __hit(t, f), __hit(t, d)].filter(Boolean).length } })
    c2('voz → muelle de GPageHeader → FAB → avisos: cada uno encima del anterior, sin solapes (EDGE_ORDER fab 25)', r.fabAboveDock && r.dockAboveSpeech && r.toastAboveFab && r.hits === 0, JSON.stringify(r))
    await p.click('#solo-fab-trigger'); await p.waitForTimeout(350)
    const g = await p.evaluate(() => { const m = document.getElementById('solo-fab-menu').getBoundingClientRect(); return m.top >= 16 && m.bottom <= innerHeight && m.left >= 0 && m.right <= innerWidth })
    c2('abierto, dentro del visor con margen', g)
    await p.evaluate(() => document.getElementById('modal').showModal()); await p.waitForTimeout(350)
    const m = await p.evaluate(() => { const t = document.getElementById('solo-fab-trigger'); t.focus(); return { closed: !document.getElementById('solo-fab-menu').matches(':popover-open'), focusable: document.activeElement === t, exp: t.getAttribute('aria-expanded') } })
    c2('un modal abierto cierra la lista y deja el FAB inerte (no se traslada al modal)', m.closed && !m.focusable && m.exp === 'false', JSON.stringify(m))
    await p.evaluate(() => document.getElementById('modal').close())
    c2('sin errores en consola', p.__errs.length === 0, p.__errs.slice(0, 3).join(' | '))
    await p.context().close()
    const q = await open(b, '?solo=A&n=15', { vw: 320, vh: 640 })
    const c3 = ck('visor · 320px')
    await q.click('#solo-fab-trigger'); await q.waitForTimeout(350)
    await q.click('#solo-fab-menu [data-k="more"] .lab-fab__item'); await q.waitForTimeout(250)
    const rf = await q.evaluate(() => { const ok = (r) => r.left >= 0 && r.right <= innerWidth + 0.5 && r.top >= 0 && r.bottom <= innerHeight + 0.5; return { hs: document.documentElement.scrollWidth <= innerWidth, menu: ok(document.getElementById('solo-fab-menu').getBoundingClientRect()), sub: ok(document.getElementById('solo-fab-more').getBoundingClientRect()), subW: document.getElementById('solo-fab-more').getBoundingClientRect().width } })
    c3('320px: sin desplazamiento horizontal; pila y panel dentro del visor (reflujo 1.4.10)', rf.hs && rf.menu && rf.sub, JSON.stringify(rf))
    await q.context().close()
  }

  // ================= Táctil (Chromium y WebKit) =================
  if (eng !== 'firefox') {
    const p = await open(b, '?solo=A&n=10', { vw: 375, vh: 812, hasTouch: true, isMobile: true })
    const c2 = ck('táctil')
    await p.tap('#solo-fab-trigger'); await p.waitForTimeout(350)
    const t = await p.evaluate(() => ({ coarse: matchMedia('(pointer: coarse)').matches, minH: Math.min(...[...document.querySelectorAll('#solo-fab-menu .lab-fab__item')].map((b) => b.getBoundingClientRect().height)), scrim: [...document.querySelectorAll('.lab-fab__scrim')].some((x) => x.matches(':popover-open')) }))
    c2('puntero grueso: acciones ≥ 44px de alto y velo bajo la lista', t.coarse && t.minH >= 43.5 && t.scrim, JSON.stringify(t))
    const h0 = await p.evaluate(() => location.hash)
    const row = await p.evaluate(() => { const r = [...document.querySelectorAll('.lab-row')].find((x) => { const b = x.getBoundingClientRect(); return b.top > 120 && b.bottom < innerHeight / 2 }).getBoundingClientRect(); return { x: r.left + 40, y: r.top + r.height / 2 } })
    await p.touchscreen.tap(row.x, row.y); await p.waitForTimeout(300)
    const t2 = await p.evaluate(() => ({ hash: location.hash, open: document.getElementById('solo-fab-menu').matches(':popover-open') }))
    c2('tocar fuera cierra sin activar lo de debajo (el enlace no se sigue)', t2.hash === h0 && !t2.open, JSON.stringify(t2))
    await p.tap('#solo-fab-trigger'); await p.waitForTimeout(350)
    await p.tap('#solo-fab-menu .lab-fab__item >> nth=-1'); await p.waitForTimeout(200)
    const s = await sel(p)
    c2('tocar una acción la ejecuta (sin hover)', s[s.length - 1] === 'muestra', s[s.length - 1])
    await p.tap('input[name="obs"]'); await p.waitForTimeout(400)
    c2('al escribir en un campo (teclado en pantalla), el FAB se aparta', await p.evaluate(() => document.getElementById('solo-fab').classList.contains('is-tucked')))
    await p.context().close()
    const q = await open(b, '?solo=B&n=6', { vw: 375, vh: 812, hasTouch: true, isMobile: true })
    await q.tap('#solo-fab-trigger'); await q.waitForTimeout(350)
    const bi = await info(q, 'solo')
    ck('táctil')('B en móvil táctil: pila, no arco (lista antes que radial)', bi.ap === 'stack' && bi.fb === 'arc', JSON.stringify(bi))
    await q.context().close()
  }

  // ================= RTL =================
  {
    const p = await open(b, '?dir=rtl')
    const c2 = ck('RTL')
    await setN(p, 'A', 6); await openFab(p, 'f-A-d')
    const a = await p.evaluate(() => { const fr = document.getElementById('f-A-d').getBoundingClientRect(), f = document.getElementById('f-A-d-fab-trigger').getBoundingClientRect(), m = document.getElementById('f-A-d-fab-menu').getBoundingClientRect(); return { left: f.left - fr.left < fr.width / 2, align: Math.abs(m.left - f.left) < 1 } })
    c2('bottom-end en RTL: el FAB a la izquierda y la pila alineada a su borde', a.left && a.align, JSON.stringify(a))
    await p.keyboard.press('Escape'); await p.waitForTimeout(250)
    await setN(p, 'B', 3); await openFab(p, 'f-B-d')
    const bb = await p.evaluate(() => { const f = document.getElementById('f-B-d-fab-trigger').getBoundingClientRect(); return [...document.querySelectorAll('#f-B-d-fab-menu .lab-fab__item')].every((x) => x.getBoundingClientRect().left >= f.left - 1) })
    const g = await geom(p, 'f-B-d')
    c2('arco espejado (hacia el interior, a la derecha) y sin solapes', bb && g.inside && g.overlaps === 0, JSON.stringify(g))
    await p.keyboard.press('ArrowLeft')
    c2('en RTL, ← avanza por el arco', (await info(p, 'f-B-d')).active === 'Nuevo paciente')
    await p.context().close()
  }

  // ================= Oscuro + movimiento reducido =================
  {
    const p = await open(b, '?theme=dark', { reducedMotion: 'reduce' })
    const c2 = ck('oscuro + reduce')
    await setN(p, 'A', 6); await openFab(p, 'f-A-d')
    const d = await p.evaluate(() => { const t = document.getElementById('f-A-d-fab-trigger'); const items = [...document.querySelectorAll('#f-A-d-fab-menu .lab-fab__item:not([aria-disabled="true"]) .lab-fab__label')]; return { lab: Math.min(...items.map(__contrast)), icon: __contrast(t), edge: __ratio(__rgb(getComputedStyle(t).backgroundColor), __bg(document.getElementById('f-A-d'))), tr: getComputedStyle(document.querySelector('#f-A-d-fab-menu > li')).transitionProperty } })
    c2('contraste en oscuro: etiquetas ≥ 4.5:1, icono y FAB ≥ 3:1', d.lab >= 4.5 && d.icon >= 3 && d.edge >= 3, `${d.lab.toFixed(2)} · ${d.icon.toFixed(2)} · ${d.edge.toFixed(2)}`)
    c2('reducido: las píldoras solo se funden (sin translate)', !/translate|transform/.test(d.tr), d.tr)
    await p.keyboard.press('Escape'); await p.waitForTimeout(250)
    await setN(p, 'B', 3); await openFab(p, 'f-B-d')
    const lb = await p.evaluate(() => Math.min(...[...document.querySelectorAll('#f-B-d-fab-menu .lab-fab__label')].map(__contrast)))
    c2('etiquetas del arco (superficie inversa) ≥ 4.5:1 en oscuro', lb >= 4.5, lb.toFixed(2))
    await p.keyboard.press('Escape'); await p.waitForTimeout(250)
    await setN(p, 'C', 15); await p.locator('#f-C-d').scrollIntoViewIfNeeded(); await p.click(T('f-C-d')); await p.waitForTimeout(30)
    const cc = await p.evaluate(() => getComputedStyle(document.getElementById('f-C-d-fab-menu')).clipPath)
    c2('reducido: el panel de C no se recorta desde la cola (solo fundido)', cc === 'none', cc)
    c2('sin errores en consola', p.__errs.length === 0, p.__errs.slice(0, 3).join(' | '))
    await p.context().close()
  }

  // ================= Frontera: GBtn, GMenu y GDialog reales =================
  {
    const p = await open(b, '', { vw: 1200, vh: 900, page: 'frontera.html' })
    const c2 = ck('frontera')
    const sz = await p.evaluate(() => { const r = document.getElementById('real-fab').getBoundingClientRect(); return [r.width, r.height] })
    c2('GBtn icon rounded=pill size=xl mide 52 × 52 (space × 13): el FAB no necesita tamaño nuevo', Math.abs(sz[0] - 52) < 0.5 && Math.abs(sz[1] - 52) < 0.5, sz.join(' × '))
    for (const m of ['m-now', 'm-fab']) {
      await p.focus(`#${m}-trigger`); await p.keyboard.press('Enter'); await p.waitForTimeout(250)
      await p.keyboard.press('Enter'); await p.waitForTimeout(450)
      const inDlg = await p.evaluate(() => !!document.activeElement.closest('dialog[open]'))
      await p.keyboard.press('Escape'); await p.waitForTimeout(450)
      const back = await p.evaluate(() => document.activeElement.id)
      c2(`${m === 'm-now' ? 'orden de hoy de GMenu (#573)' : 'foco al disparador antes de emitir'}: elegir abre el diálogo con el foco dentro y al cerrar vuelve al disparador`, inDlg && back === `${m}-trigger`, back)
    }
    await p.locator('#m-now-trigger').dblclick(); await p.waitForTimeout(400)
    const dbl = await p.evaluate(() => document.getElementById('m-now-trigger').getAttribute('aria-expanded'))
    c2('GMenu hoy: un doble clic en el disparador abre y vuelve a cerrar (hallazgo para lima; el FAB lo evita)', dbl === 'false', dbl)
    c2('sin errores en consola', p.__errs.length === 0, p.__errs.slice(0, 3).join(' | '))
    await p.context().close()
  }
  await b.close()
}
// La tecla que abre por el lado de la lista (la pila sube: ↑)
function outKey() { return 'ArrowUp' }
function c2b(eng, p) { rec(eng, 'galería', 'sin errores en consola', p.__errs.length === 0, p.__errs.slice(0, 3).join(' | ')) }

for (const e of ENGINES) await run(e)
server.close()
const by = {}
for (const r of R) { by[r.eng] ??= [0, 0]; by[r.eng][r.ok ? 0 : 1]++ }
const ok = R.filter((r) => r.ok).length
console.log(`\n${ok}/${R.length} ` + Object.entries(by).map(([e, [a, f]]) => `${e} ${a}/${a + f}`).join(' · '))
process.exit(ok === R.length ? 0 : 1)
