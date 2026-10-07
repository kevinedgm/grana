// Verificación del prototipo de migas de pan (kiwi r01): base y conceptos A, B y C en Chromium, Firefox y WebKit.
// Ejecutar desde la raíz: node design/lab/breadcrumbs/r01/verificar.mjs
//   Solo el puerto 4215 (GRANA_PW_PORT lo cambia). ENGINES=chromium,firefox,webkit  PARTS=base,A,B,C,AB  VERBOSE=1
//   SHOTS=<carpeta> guarda capturas (no comprueba nada más).
// Requiere packages/vue/dist (npm run build) para los tokens y la fuente. Solo lee; no toca packages/.
import http from 'node:http'
import { readFile, mkdir } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))
const PORT = Number(process.env.GRANA_PW_PORT || 4215)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json', '.svg': 'image/svg+xml' }
const server = http.createServer(async (req, res) => {
  try {
    const path = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!path.startsWith(ROOT)) throw new Error('fuera')
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(path))
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${PORT}/design/lab/breadcrumbs/r01/index.html`
const pw = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url))

const ENGINES = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
const PARTS = (process.env.PARTS || 'base,A,B,C,AB').split(',')
const V = !!process.env.VERBOSE
const SHOTS = process.env.SHOTS
const R = []
const rec = (eng, part, name, ok, info = '') => { R.push({ eng, part, name, ok: !!ok }); if (V || !ok) console.log(`${ok ? 'ok  ' : 'FALLA'} ${eng} ${part} · ${name}${info !== '' ? ' · ' + info : ''}`) }

async function open(b, qs, opts = {}) {
  const { vw = 1280, vh = 900, ...ctx } = opts
  const context = await b.newContext({ viewport: { width: vw, height: vh }, ...ctx })
  const p = await context.newPage()
  const errs = []
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.text()) })
  p.on('pageerror', (e) => errs.push(String(e)))
  await p.goto(BASE + qs)
  await p.waitForFunction(() => window.__bc && window.__bc.size >= 3)
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(120)
  p.__errs = errs
  return p
}
const setW = async (p, w) => { await p.evaluate((w) => { document.getElementById('lab').style.setProperty('--w', w + 'px') }, w); await p.waitForTimeout(80) }

// Lecturas del DOM
const H = {
  stage: (p, id) => p.evaluate((id) => document.getElementById(id).dataset.stage, id),
  visible: (p, id) => p.evaluate((id) => [...document.querySelectorAll(`#${id} .bc__list:not(.bc__measure) > .bc__item`)].map((li) => li.classList.contains('is-more') ? li.querySelector('.bc__more').textContent : li.querySelector('.bc__label').textContent), id),
  overflow: (p, id) => p.evaluate((id) => {
    const nav = document.getElementById(id), n = nav.getBoundingClientRect()
    const els = [...nav.querySelectorAll('.bc__list:not(.bc__measure) > .bc__item, .bcb > *')]
    return els.some((e) => { const r = e.getBoundingClientRect(); return r.left < n.left - 1 || r.right > n.right + 1 })
  }, id),
  pageOverflow: (p) => p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1),
  rgb: () => {
    window.__rgb = (c) => { const cv = document.createElement('canvas'); cv.width = cv.height = 1; const x = cv.getContext('2d'); x.fillStyle = '#000'; x.fillStyle = c; x.fillRect(0, 0, 1, 1); const d = x.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
    window.__lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
    window.__bgOf = (el) => { for (let a = el; a; a = a.parentElement) { const c = __rgb(getComputedStyle(a).backgroundColor); if (c[3] > 0.95) return c } return [255, 255, 255, 1] }
    window.__ratio = (fg, bg) => { const a = __lum(fg), b = __lum(bg); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) }
    window.__contrast = (el, prop = 'color') => __ratio(__rgb(getComputedStyle(el)[prop]), __bgOf(el))
  }
}

// ============================================ BASE ============================================
async function partBase(b, eng) {
  const ck = (n, ok, i) => rec(eng, 'base', n, ok, i)
  const p = await open(b, '?c=base&w=1100')
  await p.evaluate(H.rgb)
  // Semántica (APG Breadcrumb)
  const sem = await p.evaluate(() => {
    const nav = document.getElementById('bc-1')
    const ol = nav.querySelector('.bc__list:not(.bc__measure)')
    const lis = [...ol.children]
    const last = lis[lis.length - 1]
    const cur = nav.querySelectorAll('[aria-current="page"]')
    const seps = [...ol.querySelectorAll('.bc__sep')]
    return {
      tag: nav.tagName, label: nav.getAttribute('aria-label'), list: ol.tagName, allLi: lis.every((x) => x.tagName === 'LI'),
      curCount: cur.length, curIsLast: last.contains(cur[0]), curTag: cur[0]?.tagName,
      sepsHidden: seps.every((s) => s.getAttribute('aria-hidden') === 'true' && s.tagName.toLowerCase() === 'svg'),
      sepsInLi: seps.every((s) => s.parentElement.tagName === 'LI'), sepCount: seps.length, liCount: lis.length,
      noGlyph: !/[\u203A\u2039\u00BB\/]/.test(ol.textContent), textNotLink: !!ol.querySelector('.bc__link[data-i="3"]') && ol.querySelector('.bc__link[data-i="3"]').tagName === 'SPAN',
      textNotFocusable: ol.querySelector('.bc__link[data-i="3"]')?.tabIndex === -1
    }
  })
  ck('nav con nombre', sem.tag === 'NAV' && sem.label === 'Ruta de navegación', JSON.stringify(sem.label))
  ck('ol de li', sem.list === 'OL' && sem.allLi)
  ck('una sola aria-current="page", en la última', sem.curCount === 1 && sem.curIsLast, sem.curTag)
  ck('separadores svg aria-hidden dentro de cada li (no son li)', sem.sepsHidden && sem.sepsInLi && sem.sepCount === sem.liCount - 1, `${sem.sepCount}/${sem.liCount}`)
  ck('sin caracteres separadores en el texto', sem.noGlyph)
  ck('nivel sin página = texto, no enlace ni parada de Tab', sem.textNotLink && sem.textNotFocusable)
  // Árbol de accesibilidad (Playwright calcula nombre y rol igual en los tres motores)
  const snap = await p.locator('#bc-1').ariaSnapshot()
  ck('árbol: navigation, list, 6 listitem, 5 enlaces', /navigation "Ruta de navegación"/.test(snap) && (snap.match(/- listitem/g) || []).length === 6 && (snap.match(/- link /g) || []).length === 5, V ? '\n' + snap : '')
  ck('nombre completo del lote en el árbol', snap.includes('Lote 2026-0412 · Hemograma completo de control trimestral'))
  // Ancho: etapas
  const at = {}
  for (const w of [1100, 720, 480, 320, 240]) {
    await setW(p, w)
    at[w] = { stage: await H.stage(p, 'bc-1'), vis: await H.visible(p, 'bc-1'), of: await H.overflow(p, 'bc-1') }
    ck(`${w}px: sin desbordar el nav`, !at[w].of, `${at[w].stage} · ${at[w].vis.join(' | ')}`)
  }
  ck('1100px: todo a la vista, sin +N', at[1100].stage === 'all' && !at[1100].vis.some((x) => x.startsWith('+')))
  ck('720px: cede en medio y conserva raíz, padre y actual', at[720].vis[0] === 'Inicio' && at[720].vis.at(-1) === 'Muestra M-0007' && at[720].vis.at(-2).startsWith('Lote') && at[720].vis.some((x) => x.startsWith('+')), at[720].vis.join(' | '))
  ck('320px: +N antes del padre y el actual', at[320].vis.some((x) => x.startsWith('+')) && at[320].vis.at(-1) === 'Muestra M-0007', at[320].vis.join(' | '))
  // +N: divulgación
  await setW(p, 480)
  const more = p.locator('#bc-1 .bc__more')
  const mInfo = await more.evaluate((b) => ({ exp: b.getAttribute('aria-expanded'), ctl: b.getAttribute('aria-controls'), name: b.getAttribute('aria-label'), text: b.textContent, tag: b.tagName, type: b.type }))
  const count = Number(mInfo.text.slice(1))
  ck('+N es un button con aria-expanded y aria-controls', mInfo.tag === 'BUTTON' && mInfo.type === 'button' && mInfo.exp === 'false' && !!mInfo.ctl)
  ck('+N: el nombre contiene el número visible (2.5.3)', mInfo.name === `${count} niveles más`, mInfo.name)
  await more.focus()
  await p.keyboard.press('Enter')
  const opened = await p.evaluate(() => { const b = document.querySelector('#bc-1 .bc__more'); const pop = document.getElementById(b.getAttribute('aria-controls')); return { exp: b.getAttribute('aria-expanded'), vis: !pop.hidden && pop.getBoundingClientRect().height > 0, tag: pop.tagName, links: [...pop.querySelectorAll('.bc__link')].map((a) => a.textContent), inLi: pop.parentElement.tagName === 'LI', active: document.activeElement === b } })
  ck('Enter abre; el foco se queda en el disparador (APG Disclosure)', opened.exp === 'true' && opened.vis && opened.active)
  ck('lo cedido es una lista anidada de enlaces en orden', opened.tag === 'OL' && opened.inLi && opened.links.length === count, opened.links.join(' | '))
  await p.keyboard.press('ArrowDown')
  ck('flecha abajo entra en la lista', await p.evaluate(() => document.activeElement.closest('.bc__pop') !== null))
  await p.keyboard.press('ArrowDown')
  await p.keyboard.press('Escape')
  ck('Esc cierra y devuelve el foco a +N', await p.evaluate(() => { const b = document.querySelector('#bc-1 .bc__more'); return b.getAttribute('aria-expanded') === 'false' && document.activeElement === b }))
  await p.keyboard.press('Enter')
  await p.keyboard.press('Tab')
  if (eng === 'webkit') rec(eng, 'base', 'Tab a enlaces: WebKit de Playwright no lleva el Tab a los enlaces (Safari sin «Tab resalta cada elemento»; no medido)', true)
  else ck('Tab desde +N abierto entra en sus enlaces (orden del DOM)', await p.evaluate(() => document.activeElement.closest('.bc__pop') !== null))
  for (let k = 0; k < count; k++) await p.keyboard.press('Tab')
  ck('salir con Tab cierra la divulgación', await p.evaluate(() => document.querySelector('#bc-1 .bc__more').getAttribute('aria-expanded') === 'false'))
  await more.click()
  await p.mouse.click(5, 5)
  ck('pulsar fuera cierra', await p.evaluate(() => document.querySelector('#bc-1 .bc__more').getAttribute('aria-expanded') === 'false'))
  // Foco conservado al cambiar de etapa
  await p.locator('#bc-1 .bc__list:not(.bc__measure) .bc__link[data-i="5"]').focus()
  await setW(p, 1100); await setW(p, 320)
  ck('el foco sobrevive al cambio de etapa', await p.evaluate(() => document.activeElement?.getAttribute('data-i') === '5'))
  // Truncado y pista visual
  await setW(p, 1100)
  const tr = await p.evaluate(() => { const l = document.querySelector('#bc-1 .bc__list:not(.bc__measure) .bc__link[data-i="4"] .bc__label'); return { cut: l.scrollWidth > l.clientWidth + 1, text: l.textContent } })
  ck('nombre largo truncado visualmente, entero en el DOM', tr.cut && tr.text.endsWith('trimestral'))
  await p.locator('#bc-1 .bc__list:not(.bc__measure) .bc__link[data-i="4"]').hover()
  await p.waitForTimeout(450)
  const tip = await p.evaluate(() => { const t = document.querySelector('#bc-1 .bc-tip'); return { shown: !t.hidden, hid: t.getAttribute('aria-hidden'), text: t.textContent, role: t.getAttribute('role') } })
  ck('pista con el nombre entero al pasar el puntero, aria-hidden y sin rol', tip.shown && tip.hid === 'true' && !tip.role && tip.text.endsWith('trimestral'))
  await p.locator('#bc-1 .bc__list:not(.bc__measure) .bc__link[data-i="2"]').hover(); await p.waitForTimeout(450)
  ck('sin pista en lo que no está truncado', await p.evaluate(() => document.querySelector('#bc-1 .bc-tip').hidden))
  // Ruta corta: el actual se acorta (no cede nada) a 320
  await setW(p, 320)
  const c2 = await p.evaluate(() => { const l = document.querySelector('#bc-2 .is-current .bc__label'); return { cut: l.scrollWidth > l.clientWidth + 1, vis: [...document.querySelectorAll('#bc-2 .bc__list:not(.bc__measure) > .bc__item')].length } })
  ck('ruta corta a 320: actual truncado, entero en el DOM', c2.cut, JSON.stringify(c2))
  ck('320: sin scroll horizontal de la página', !(await H.pageOverflow(p)))
  // navigate cancelable
  await setW(p, 1100)
  await p.locator('#bc-1 .bc__list:not(.bc__measure) .bc__link[data-i="2"]').click()
  const nav = await p.evaluate(() => ({ log: document.querySelector('#log li')?.textContent, hash: location.hash }))
  ck('navigate con el evento nativo, cancelable (sin cambiar la URL)', /navigate · Muestras/.test(nav.log || '') && nav.hash === '', nav.log)
  // Tamaños y contraste
  const sz = await p.evaluate(() => [...document.querySelectorAll('#bc-1 .bc__list:not(.bc__measure) a.bc__link')].map((a) => a.getBoundingClientRect().height))
  ck('enlaces ≥ 24px de alto (puntero fino)', sz.every((x) => x >= 24), sz.join(','))
  const con = await p.evaluate(() => ({ link: __contrast(document.querySelector('#bc-1 .bc__list:not(.bc__measure) .bc__link[data-i="2"]')), text: __contrast(document.querySelector('#bc-1 .bc__list:not(.bc__measure) .bc__link[data-i="3"]')), cur: __contrast(document.querySelector('#bc-1 [aria-current]')), sep: __contrast(document.querySelector('#bc-1 .bc__sep')) }))
  ck('contraste enlace ≥ 4.5', con.link >= 4.5, con.link.toFixed(2))
  ck('contraste nivel sin página ≥ 4.5', con.text >= 4.5, con.text.toFixed(2))
  ck('contraste actual ≥ 4.5', con.cur >= 4.5, con.cur.toFixed(2))
  rec(eng, 'base', `separador (decorativo, informativo) ${con.sep.toFixed(2)}:1`, true)
  ck('consola limpia', p.__errs.length === 0, p.__errs.join(' | '))
  await p.context().close()

  // RTL
  const r = await open(b, '?c=base&w=1100&dir=rtl')
  const rtl = await r.evaluate(() => {
    const seps = [...document.querySelectorAll('#bc-1 .bc__list:not(.bc__measure) .bc__sep')]
    const lis = [...document.querySelectorAll('#bc-1 .bc__list:not(.bc__measure) > .bc__item')]
    return { scale: getComputedStyle(seps[0]).scale, rootRight: lis[0].getBoundingClientRect().right > lis[lis.length - 1].getBoundingClientRect().right }
  })
  ck('RTL: chevron espejado (scale -1 1)', /^-1( 1)?$/.test(rtl.scale), rtl.scale)
  ck('RTL: la raíz a la derecha', rtl.rootRight)
  const he = await r.evaluate(() => getComputedStyle(document.querySelector('#bc-rtl .bc__sep')).scale)
  ck('bloque dir="rtl" dentro de una página LTR también espeja', /^-1/.test(he), he)
  for (const w of [720, 320]) { await setW(r, w); ck(`RTL ${w}px sin desbordar`, !(await H.overflow(r, 'bc-1'))) }
  await r.context().close()

  // Puntero grueso: 44px
  const t = await open(b, '?c=base&w=360', eng === 'chromium' ? { vw: 390, vh: 844, isMobile: true, hasTouch: true } : { vw: 390, vh: 844, hasTouch: true })
  const coarse = await t.evaluate(() => matchMedia('(pointer: coarse)').matches)
  if (coarse) {
    const hs = await t.evaluate(() => [...document.querySelectorAll('#bc-1 .bc__list:not(.bc__measure) > .bc__item > a.bc__link, #bc-1 .bc__more')].map((a) => [a.getBoundingClientRect().width, a.getBoundingClientRect().height]))
    ck('táctil: enlaces y +N ≥ 44 × 44px', hs.every(([ww, hh]) => hh >= 44 && ww >= 44), JSON.stringify(hs.map((x) => x.map(Math.round))))
    ck('táctil 390: sin desbordar', !(await H.overflow(t, 'bc-1')) && !(await H.pageOverflow(t)))
  } else rec(eng, 'base', 'táctil: este motor no emula pointer: coarse (no medido)', true)
  await t.context().close()
}

// ============================================ A ============================================
async function partA(b, eng) {
  const ck = (n, ok, i) => rec(eng, 'A', n, ok, i)
  const p = await open(b, '?c=A&w=1100')
  await p.evaluate(H.rgb)
  const chips = (id = 'bc-1') => p.evaluate((id) => [...document.querySelectorAll(`#${id} .bc__list:not(.bc__measure) > .bc__item`)].filter((x) => x.classList.contains('is-chip')).map((x) => x.dataset.i), id)
  await setW(p, 1100)
  ck('1100: sin pastillas salvo el nombre largo (tope)', (await chips()).every((i) => i === '4'), (await chips()).join(','))
  await setW(p, 560)
  const a560 = { stage: await H.stage(p, 'bc-1'), vis: await H.visible(p, 'bc-1'), chips: await chips(), of: await H.overflow(p, 'bc-1') }
  ck('560: los seis niveles siguen en la lista (nada cedido a +N)', a560.stage === 'liquid' && a560.vis.length === 6 && !a560.of, a560.vis.join(' | '))
  ck('560: los de en medio son pastillas', ['1', '2'].every((i) => a560.chips.includes(i)), a560.chips.join(','))
  const order = await p.evaluate(() => { const w = (i) => document.querySelector(`#bc-1 .bc__list:not(.bc__measure) > [data-i="${i}"] .bc__label`).getBoundingClientRect().width; return { mid: w(1), cur: w(5), parent: w(4) } })
  ck('560: el actual conserva su nombre entero mientras ceden los de en medio', !(await p.evaluate(() => { const l = document.querySelector('#bc-1 .is-current .bc__label'); return l.scrollWidth > l.clientWidth + 1 })), JSON.stringify(order))
  // Foco por teclado despliega
  // Foco por teclado (:focus-visible) sin depender de que el motor lleve el Tab a los enlaces
  await p.keyboard.press('Shift')
  await p.locator('#bc-1 .bc__list:not(.bc__measure) .bc__link[data-i="1"]').focus()
  await p.waitForTimeout(60)
  const unf = await p.evaluate(() => { const li = document.querySelector('#bc-1 .bc__list:not(.bc__measure) > [data-i="1"]'); const l = li.querySelector('.bc__label'); const t = document.querySelector('#bc-1 .bc-tip'); return { unfold: li.classList.contains('is-unfold'), cut: l.scrollWidth > l.clientWidth + 1, grew: l.getBoundingClientRect().width, tip: t.hidden ? null : t.textContent } })
  ck('Tab: la pastilla enfocada se despliega (y si aun así no cabe entera, la pista dice el nombre)', unf.unfold && (!unf.cut || unf.tip === 'Laboratorio central'), JSON.stringify(unf))
  await p.locator('#bc-1 .bc__list:not(.bc__measure) .bc__link[data-i="2"]').focus(); await setW(p, 720); await p.keyboard.press('Shift'); await p.locator('#bc-1 .bc__list:not(.bc__measure) .bc__link[data-i="1"]').focus(); await p.waitForTimeout(60)
  const unf7 = await p.evaluate(() => { const l = document.querySelector('#bc-1 .bc__list:not(.bc__measure) > [data-i="1"] .bc__label'); return l.scrollWidth > l.clientWidth + 1 })
  ck('720: la pastilla enfocada se despliega con su nombre entero', !unf7)
  await setW(p, 560)
  ck('desplegar no desborda', !(await H.overflow(p, 'bc-1')))
  await p.keyboard.press('Shift'); await p.locator('#bc-1 .bc__list:not(.bc__measure) .bc__link[data-i="5"]').focus(); await p.waitForTimeout(60)
  ck('al irse el foco se vuelve a plegar', await p.evaluate(() => !document.querySelector('#bc-1 .bc__list:not(.bc__measure) > [data-i="1"]').classList.contains('is-unfold')))
  // Todos los niveles con su nombre en el árbol aunque sean pastillas
  const snap = await p.locator('#bc-1').ariaSnapshot()
  ck('pastillas: nombres enteros en el árbol', snap.includes('link "Laboratorio central"') && snap.includes('link "Muestras"'))
  // Pista con el puntero en una pastilla
  await p.mouse.move(1, 1)
  await p.locator('#bc-1 .bc__list:not(.bc__measure) .bc__link[data-i="1"]').hover(); await p.waitForTimeout(450)
  ck('puntero sobre pastilla: pista con el nombre entero', await p.evaluate(() => { const t = document.querySelector('#bc-1 .bc-tip'); return !t.hidden && t.textContent === 'Laboratorio central' }))
  // Última etapa: +N
  await setW(p, 240)
  const a240 = { stage: await H.stage(p, 'bc-1'), vis: await H.visible(p, 'bc-1'), of: await H.overflow(p, 'bc-1') }
  ck('240: agrupa en +N y no desborda', a240.vis.some((x) => x.startsWith('+')) && !a240.of, `${a240.stage} · ${a240.vis.join(' | ')}`)
  const minW = await p.evaluate(() => Math.min(...[...document.querySelectorAll('#bc-1 .bc__list:not(.bc__measure) > .bc__item > .bc__link, #bc-1 .bc__more')].map((a) => a.getBoundingClientRect().width)))
  ck('ningún objetivo < 24px', minW >= 24, minW.toFixed(1))
  for (const w of [1100, 720, 480, 400, 320]) { await setW(p, w); ck(`${w}: sin desbordar`, !(await H.overflow(p, 'bc-1'))) }
  // Contraste de la pastilla
  await setW(p, 480)
  const cc = await p.evaluate(() => { const a = document.querySelector('#bc-1 .bc__list:not(.bc__measure) .is-chip > .bc__link'); return a ? __contrast(a) : 0 })
  ck('contraste de la pastilla ≥ 4.5', cc >= 4.5, cc.toFixed(2))
  // SPA: la ruta se extiende y se recoge
  await setW(p, 1100)
  const n0 = await p.evaluate(() => window.__bc.get('bc-spa').state.items.length)
  await p.click('#spa-in')
  const ent = await p.evaluate(() => { const li = document.querySelector('#bc-spa .bc__list:not(.bc__measure) > .bc__item:last-child'); return { cls: li.classList.contains('is-entering'), anims: li.getAnimations().length, cur: li.querySelector('[aria-current="page"]')?.textContent } })
  ck('bajar un nivel: la miga nueva entra animada y es la actual', ent.cls && ent.anims > 0 && ent.cur === '2026', JSON.stringify(ent))
  await p.waitForTimeout(700)
  await p.click('#spa-up'); await p.waitForTimeout(700)
  ck('subir un nivel: se recoge y vuelve a haber una sola actual', await p.evaluate((n0) => window.__bc.get('bc-spa').state.items.length === n0 && document.querySelectorAll('#bc-spa [aria-current="page"]').length === 1, n0))
  ck('consola limpia', p.__errs.length === 0, p.__errs.join(' | '))
  await p.context().close()
  // Movimiento reducido: nada se anima
  const m = await open(b, '?c=A&w=1100', { reducedMotion: 'reduce' })
  await m.click('#spa-in')
  ck('movimiento reducido: la miga nueva no se anima', await m.evaluate(() => { const li = document.querySelector('#bc-spa .bc__list:not(.bc__measure) > .bc__item:last-child'); return li.getAnimations().length === 0 }))
  await m.context().close()
  await coarseCheck(b, eng, 'A', ck)
  // RTL
  const r = await open(b, '?c=A&w=480&dir=rtl')
  ck('RTL 480: sin desbordar y con pastillas', !(await H.overflow(r, 'bc-1')) && (await r.evaluate(() => document.querySelectorAll('#bc-1 .is-chip').length)) > 0)
  await r.context().close()
}

// ============================ A con la cara de B como última etapa (recomendación) ============================
async function partAB(b, eng) {
  const ck = (n, ok, i) => rec(eng, 'A+B', n, ok, i)
  const p = await open(b, '?c=A&final=B&w=1100')
  await setW(p, 480)
  ck('480: sigue líquida', (await H.stage(p, 'bc-1')) === 'liquid')
  await setW(p, 260)
  ck('260: pasa a la cara de B (subir + ruta), sin desbordar', (await H.stage(p, 'bc-1')) === 'escalon' && !!(await p.$('#bc-1 .bcb__up')) && !(await H.overflow(p, 'bc-1')))
  await p.locator('#bc-1 .bcb__toggle').focus()
  await setW(p, 1100)
  ck('al ensanchar vuelve a la ruta y el foco no se pierde', (await H.stage(p, 'bc-1')) === 'liquid' && (await p.evaluate(() => document.getElementById('bc-1').contains(document.activeElement))))
  ck('consola limpia', p.__errs.length === 0, p.__errs.join(' | '))
  await p.context().close()
}

// ============================================ B ============================================
async function partB(b, eng) {
  const ck = (n, ok, i) => rec(eng, 'B', n, ok, i)
  const p = await open(b, '?c=B&w=1100')
  await p.evaluate(H.rgb)
  const face = await p.evaluate(() => {
    const nav = document.getElementById('bc-1'), up = nav.querySelector('.bcb__up'), t = nav.querySelector('.bcb__toggle'), st = document.getElementById(t.getAttribute('aria-controls'))
    return { up: up.getAttribute('href'), upName: up.getAttribute('aria-label'), upText: up.textContent, tName: t.getAttribute('aria-label'), tText: t.textContent, exp: t.getAttribute('aria-expanded'), hidden: st.hidden, stTag: st.tagName }
  })
  ck('subir = enlace al padre con página', face.up === '#lote-0412')
  ck('nombre de subir contiene el texto visible (2.5.3)', face.upName.includes(face.upText) && face.upName.startsWith('Subir a'), face.upName)
  ck('el nombre de la página es un disclosure cerrado que controla un ol', face.exp === 'false' && face.hidden && face.stTag === 'OL')
  ck('nombre del disclosure contiene el texto visible', face.tName.includes(face.tText), face.tName)
  await p.locator('#bc-1 .bcb__toggle').focus()
  await p.keyboard.press('Enter')
  const st = await p.evaluate(() => {
    const steps = [...document.querySelectorAll('#bc-1 .bcb__step')]
    return { n: steps.length, cur: steps.at(-1).querySelector('[aria-current="page"]')?.textContent, x: steps.map((s) => s.querySelector('.bc__link').getBoundingClientRect().left), exp: document.querySelector('#bc-1 .bcb__toggle').getAttribute('aria-expanded'), active: document.activeElement.className }
  })
  ck('Enter abre la escalera con los seis niveles y la actual al final', st.exp === 'true' && st.n === 6 && st.cur === 'Muestra M-0007')
  ck('cada escalón más adentro (LTR)', st.x.every((v, i) => i === 0 || v > st.x[i - 1]), st.x.map(Math.round).join(','))
  await p.keyboard.press('ArrowDown')
  ck('flecha abajo entra en la escalera', await p.evaluate(() => !!document.activeElement.closest('.bcb__stairs')))
  await p.keyboard.press('Escape')
  ck('Esc cierra y devuelve el foco', await p.evaluate(() => document.activeElement.classList.contains('bcb__toggle') && document.activeElement.getAttribute('aria-expanded') === 'false'))
  for (const w of [1100, 320, 240]) { await setW(p, w); ck(`${w}: la cara no desborda`, !(await H.overflow(p, 'bc-1'))) }
  const hgt = await p.evaluate(() => document.querySelector('#bc-1 .bcb').getBoundingClientRect().height)
  ck('alto de la cara constante (una línea)', hgt <= 40, hgt)
  const con = await p.evaluate(() => ({ up: __contrast(document.querySelector('#bc-1 .bcb__up')), t: __contrast(document.querySelector('#bc-1 .bcb__toggle')) }))
  ck('contraste subir y página ≥ 4.5', con.up >= 4.5 && con.t >= 4.5, `${con.up.toFixed(2)} / ${con.t.toFixed(2)}`)
  ck('consola limpia', p.__errs.length === 0, p.__errs.join(' | '))
  await p.context().close()
  await coarseCheck(b, eng, 'B', ck)
  const r = await open(b, '?c=B&w=1100&dir=rtl')
  await r.locator('#bc-1 .bcb__toggle').click()
  const xr = await r.evaluate(() => [...document.querySelectorAll('#bc-1 .bcb__step .bc__link')].map((a) => a.getBoundingClientRect().right))
  ck('RTL: cada escalón más adentro (hacia la izquierda)', xr.every((v, i) => i === 0 || v < xr[i - 1]), xr.map(Math.round).join(','))
  await r.context().close()
}

// ============================================ C ============================================
async function partC(b, eng) {
  const ck = (n, ok, i) => rec(eng, 'C', n, ok, i)
  const p = await open(b, '?c=C&w=1100')
  await p.evaluate(H.rgb)
  const doors = await p.evaluate(() => [...document.querySelectorAll('#bc-1 .bc__list:not(.bc__measure) .bc__door')].map((d) => ({ name: d.getAttribute('aria-label'), exp: d.getAttribute('aria-expanded'), ctl: d.getAttribute('aria-controls'), i: d.closest('.bc__item').dataset.i })))
  ck('puertas solo donde hay hermanos (4 de 5 separadores)', doors.length === 4 && !doors.some((d) => d.i === '3'), doors.map((d) => d.i).join(','))
  ck('nombre de la puerta = «Otras páginas en {padre}»', doors.find((d) => d.i === '4')?.name === 'Otras páginas en 2026', doors.map((d) => d.name).join(' | '))
  const door = p.locator('#bc-1 .bc__list:not(.bc__measure) > [data-i="4"] .bc__door')
  await door.focus()
  await p.keyboard.press('ArrowDown')
  const o = await p.evaluate(() => { const a = document.activeElement; return { here: a.getAttribute('aria-current'), text: a.textContent, inPop: !!a.closest('.bc__pop'), n: a.closest('.bc__pop')?.querySelectorAll('a').length } })
  ck('flecha abajo abre y pone el foco en el de la ruta (aria-current="true")', o.inPop && o.here === 'true' && o.text.startsWith('Lote 2026-0412'), JSON.stringify(o))
  await p.waitForTimeout(400)
  const rot = await door.evaluate((d) => getComputedStyle(d.querySelector('.g-icon')).rotate)
  ck('la puerta abierta gira el chevron', rot === '90deg', rot)
  await p.keyboard.press('ArrowDown')
  ck('flecha abajo recorre los hermanos', await p.evaluate(() => document.activeElement.textContent === 'Lote 2026-0413'))
  await p.keyboard.press('Escape')
  ck('Esc cierra y vuelve a la puerta', await p.evaluate(() => document.activeElement.classList.contains('bc__door') && document.activeElement.getAttribute('aria-expanded') === 'false'))
  await door.click()
  ck('clic abre sin mover el foco al panel', await p.evaluate(() => document.querySelector('#bc-1 .bc__list:not(.bc__measure) > [data-i="4"] .bc__door').getAttribute('aria-expanded') === 'true' && !document.activeElement.closest('.bc__pop')))
  await p.locator('#bc-1 a[href="#lote-0413"]').click()
  ck('elegir un hermano emite navigate con ese destino', await p.evaluate(() => /Lote 2026-0413/.test(document.querySelector('#log li')?.textContent || '')))
  const dsz = await door.evaluate((d) => [d.getBoundingClientRect().width, d.getBoundingClientRect().height])
  ck('puerta ≥ 24 × 24', dsz[0] >= 24 && dsz[1] >= 24, dsz.join('×'))
  const dc = await door.evaluate((d) => __contrast(d))
  ck('contraste del chevron de la puerta ≥ 3 (control)', dc >= 3, dc.toFixed(2))
  for (const w of [720, 480, 320]) { await setW(p, w); ck(`${w}: sin desbordar`, !(await H.overflow(p, 'bc-1'))) }
  ck('consola limpia', p.__errs.length === 0, p.__errs.join(' | '))
  await p.context().close()
  await coarseCheck(b, eng, 'C', ck)
  const r = await open(b, '?c=C&w=1100&dir=rtl')
  const d = r.locator('#bc-1 .bc__list:not(.bc__measure) > [data-i="4"] .bc__door')
  await d.click()
  await r.waitForTimeout(400)
  const rr = await d.evaluate((x) => getComputedStyle(x.querySelector('.g-icon')).rotate)
  ck('RTL: la puerta abierta apunta abajo (rotate -90deg sobre el espejo)', rr === '-90deg', rr)
  await r.context().close()
}

// Puntero grueso en los conceptos: objetivos ≥ 44 × 44 y sin desbordar a 390px
async function coarseCheck(b, eng, c, ck) {
  const t = await open(b, `?c=${c}&w=358`, eng === 'chromium' ? { vw: 390, vh: 844, isMobile: true, hasTouch: true } : { vw: 390, vh: 844, hasTouch: true })
  if (!(await t.evaluate(() => matchMedia('(pointer: coarse)').matches))) { ck('táctil: este motor no emula pointer: coarse (no medido)', true); await t.context().close(); return }
  const hs = await t.evaluate(() => [...document.querySelectorAll('#bc-1 .bc__list:not(.bc__measure) > .bc__item > a.bc__link, #bc-1 .bc__more, #bc-1 .bc__list:not(.bc__measure) .bc__door, #bc-1 .bcb__up, #bc-1 .bcb__toggle')].map((a) => [a.getBoundingClientRect().width, a.getBoundingClientRect().height]))
  ck('táctil 390: objetivos ≥ 44 × 44', hs.length > 0 && hs.every(([w, h]) => w >= 44 && h >= 44), JSON.stringify(hs.map((x) => x.map(Math.round))))
  ck('táctil 390: sin desbordar', !(await H.overflow(t, 'bc-1')) && !(await H.pageOverflow(t)))
  await t.context().close()
}

async function shots(b, eng) {
  await mkdir(SHOTS, { recursive: true })
  for (const c of ['base', 'A', 'B', 'C']) {
    for (const w of [1100, 560, 320]) {
      const p = await open(b, `?c=${c}&w=${w}`, { vw: 1280, vh: 1300 })
      if (c === 'B') await p.click('#bc-1 .bcb__toggle')
      if (c === 'C' && w === 1100) await p.click('#bc-1 .bc__list:not(.bc__measure) > [data-i="4"] .bc__door')
      if (c === 'base' && w === 560) await p.click('#bc-1 .bc__more')
      await p.waitForTimeout(600); await p.screenshot({ path: `${SHOTS}/${eng}-${c}-${w}.png`, clip: { x: 0, y: 0, width: 1280, height: 760 } })
      await p.context().close()
    }
  }
}

const PART = { base: partBase, A: partA, AB: partAB, B: partB, C: partC }
try {
  for (const eng of ENGINES) {
    const b = await pw[eng].launch()
    try {
      if (SHOTS) await shots(b, eng)
      else for (const part of PARTS) await PART[part](b, eng).catch((e) => rec(eng, part, 'excepción', false, e.message.split('\n')[0]))
    } finally { await b.close() }
  }
} finally { server.close() }
if (!SHOTS) {
  const by = {}
  for (const r of R) { const k = `${r.eng} ${r.part}`; by[k] = by[k] || [0, 0]; by[k][1]++; if (r.ok) by[k][0]++ }
  for (const [k, [ok, n]] of Object.entries(by)) console.log(`${k}: ${ok}/${n}`)
  const fail = R.filter((r) => !r.ok).length
  console.log(fail ? `${fail} FALLAS` : `TODO BIEN: ${R.length}/${R.length}`)
  process.exitCode = fail ? 1 : 0
}
