// Verificación del prototipo del héroe (kiwi r01): base y conceptos A, B y C en Chromium, Firefox y WebKit.
// Ejecutar desde la raíz: node design/lab/hero/r01/verificar.mjs
//   Puerto 4231 (GRANA_PW_PORT lo cambia). ENGINES=chromium,firefox,webkit  PARTS=base,A,B,C,widths  VERBOSE=1  SHOTS=1 (capturas en ./capturas)
// Requiere packages/vue/dist/grana.css (npm run build). Solo lee; no toca packages/.
import http from 'node:http'
import { readFile, mkdir } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))
const HERE = fileURLToPath(new URL('./', import.meta.url))
const PORT = Number(process.env.GRANA_PW_PORT || 4231)
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
const BASE = `http://127.0.0.1:${PORT}/design/lab/hero/r01/index.html`
const pw = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url))

const ENGINES = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
const PARTS = (process.env.PARTS || 'base,A,B,C,widths').split(',')
const V = !!process.env.VERBOSE
const SHOTS = !!process.env.SHOTS
if (SHOTS) await mkdir(join(HERE, 'capturas'), { recursive: true })
const R = []
const rec = (eng, part, name, ok, info = '') => { R.push({ eng, part, name, ok: !!ok }); if (V || !ok) console.log(`${ok ? 'ok  ' : 'FALLA'} ${eng} ${part} · ${name}${info !== '' ? ' · ' + info : ''}`) }

async function open (b, qs, opts = {}) {
  const { vw = 1440, vh = 900, ...ctx } = opts
  const context = await b.newContext({ viewport: { width: vw, height: vh }, ...ctx })
  const p = await context.newPage()
  const errs = []
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !/fonts\.css|Failed to load resource/.test(m.text()) /* el 404 real lo registra el manejador de respuestas, con su URL */) errs.push(m.text()) })
  p.on('pageerror', (e) => errs.push(String(e)))
  p.on('response', (r) => { if (r.status() >= 400 && !r.url().endsWith('/fonts.css')) errs.push(r.status() + ' ' + r.url()) })
  await p.goto(BASE + qs)
  await p.waitForFunction(() => window.__hero && window.__hero.ready)
  await p.evaluate(() => document.fonts.ready)
  await settle(p)
  p.__errs = errs; p.__ctx = context
  return p
}
const settle = (p) => p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 40)))))
const rect = (p, sel) => p.evaluate((sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return { top: r.top + scrollY, bottom: r.bottom + scrollY, left: r.left, right: r.right, width: r.width, height: r.height } }, sel)
const overflow = (p) => p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
const close = async (p, eng, part, label) => { rec(eng, part, `consola limpia (${label})`, p.__errs.length === 0, p.__errs.slice(0, 2).join(' | ')); await p.__ctx.close() }
const shot = async (p, name) => { if (SHOTS) await p.screenshot({ path: join(HERE, 'capturas', name + '.png'), fullPage: false }) }
// Contraste WCAG entre el color de texto de `sel` y el fondo opaco efectivo más cercano (sube por los ancestros).
const contrast = (p, sel) => p.evaluate((sel) => {
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: v[0], g: v[1], b: v[2], a: v[3] === undefined ? 1 : v[3] } }
  const lum = ({ r, g, b }) => { const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  const el = document.querySelector(sel); const fg = parse(getComputedStyle(el).color)
  let n = el, bg = null
  while (n && n.nodeType === 1) { const c = parse(getComputedStyle(n).backgroundColor); if (c && c.a >= 0.999) { bg = c; break } n = n.parentElement }
  if (!bg) bg = parse(getComputedStyle(document.documentElement).backgroundColor) || { r: 255, g: 255, b: 255 }
  const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x)
  return Math.round(((a + 0.05) / (b + 0.05)) * 100) / 100
}, sel)
const inside = (a, b, t = 0.5) => a.left >= b.left - t && a.right <= b.right + t && a.top >= b.top - t && a.bottom <= b.bottom + t
const overlaps = (a, b) => !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom)

for (const eng of ENGINES) {
  const b = await pw[eng].launch()

  // ---------------- Comunes a los cuatro: semántica, LCP, contraste, teclado ----------------
  for (const c of ['base', 'A', 'B', 'C']) {
    if (!PARTS.includes(c)) continue
    for (const tpl of ['hotel', 'restaurante', 'tour']) {
      const p = await open(b, `?c=${c}&tpl=${tpl}`)
      const sem = await p.evaluate(() => {
        const h = document.getElementById('hero'), t = document.getElementById('title')
        const img = document.getElementById('img')
        return {
          h1: document.querySelectorAll('h1').length, labelled: h.getAttribute('aria-labelledby') === t.id && t.tagName === 'H1',
          eager: img.loading === 'eager' && img.getAttribute('fetchpriority') === 'high' && !!img.getAttribute('width') && !!img.getAttribute('height'),
          alt: img.alt.length > 0,
          order: !!(t.compareDocumentPosition(document.getElementById('cta')) & Node.DOCUMENT_POSITION_FOLLOWING),
          oneHigh: document.querySelectorAll('[fetchpriority="high"]').length === 1,
        }
      })
      rec(eng, c, `${tpl}: un solo h1 y la sección se nombra por él`, sem.h1 === 1 && sem.labelled)
      rec(eng, c, `${tpl}: la foto principal no se difiere (eager, fetchpriority=high, width/height) y es la única prioritaria`, sem.eager && sem.oneHigh)
      rec(eng, c, `${tpl}: la foto informativa lleva alt`, sem.alt)
      rec(eng, c, `${tpl}: h1 antes de la acción en el DOM`, sem.order)
      // contraste del texto contra su fondo real (nunca la foto)
      for (const s of ['#title', '#lead', '#eyebrow', '#aside']) {
        const k = await contrast(p, s)
        rec(eng, c, `${tpl}: contraste ${s} ≥ 4.5`, k >= 4.5, k)
      }
      // el texto no se pinta sobre la foto (base y A: sin solape; B y C: dentro de una placa opaca)
      const tr = await rect(p, '#content'), mr = await rect(p, c === 'B' ? '#media' : '#media img#img')
      if (c === 'base' || c === 'A') rec(eng, c, `${tpl}: el texto no toca la foto`, !overlaps(tr, mr))
      else {
        const pl = await rect(p, '#plate')
        const opaque = await p.evaluate(() => { const m = getComputedStyle(document.getElementById('plate')).backgroundColor.match(/[\d.]+/g).map(Number); return m.length < 4 || m[3] >= 0.999 })
        rec(eng, c, `${tpl}: el texto va dentro de una placa opaca`, inside(tr, pl) && opaque)
        rec(eng, c, `${tpl}: la placa cruza el borde de la foto (pegada, no flota)`, pl.top < mr.bottom && pl.bottom > mr.bottom, `${Math.round(pl.top)} < ${Math.round(mr.bottom)}`)
      }
      // teclado: Tab llega a la acción principal y luego a la secundaria, en orden
      if (tpl === 'hotel') {
        const order = await p.evaluate(() => [...document.querySelectorAll('#hero a, #hero button, #hero input')].filter((e) => e.tabIndex >= 0).map((e) => e.id || e.className))
        rec(eng, c, 'orden de foco dentro del héroe: cta, secundaria, después lo demás', order.indexOf('cta') < order.indexOf('sec') && order.indexOf('cta') >= 0, order.join(','))
        const h = await p.evaluate(() => getComputedStyle(document.getElementById('cta')).blockSize)
        rec(eng, c, 'acción principal ≥ 44px de alto', parseFloat(h) >= 44, h)
        await shot(p, `${eng}-${c}-1440`)
        await p.focus('#cta'); await p.keyboard.press('Shift') // WebKit no lleva el Tab a los enlaces por defecto (ajuste del sistema): se enfoca y se pulsa una tecla
        const ring = await p.evaluate(() => { const s = getComputedStyle(document.activeElement); return document.activeElement.id === 'cta' && (s.outlineStyle !== 'none' || s.boxShadow !== 'none') })
        rec(eng, c, 'foco visible en la acción principal', ring)
      }
      rec(eng, c, `${tpl}: sin desplazamiento horizontal a 1440`, !(await overflow(p)))
      await close(p, eng, c, `${tpl} 1440`)
    }
  }

  // ---------------- A · La ventana ----------------
  if (PARTS.includes('A')) {
    let p = await open(b, '?c=A')
    const arch = await p.evaluate(() => getComputedStyle(document.getElementById('frame')).borderTopLeftRadius)
    rec(eng, 'A', 'el vano tiene arco (radio superior en %)', /%/.test(arch) || parseFloat(arch) > 50, arch)
    const tr = await rect(p, '#content'), fr = await rect(p, '#frame')
    rec(eng, 'A', 'LTR: la ventana va al final (derecha)', fr.left > tr.left)
    const det = await p.evaluate(() => { const d = document.getElementById('detail'); return d.getAttribute('aria-hidden') === 'true' && d.querySelector('img').alt === '' })
    rec(eng, 'A', 'la segunda ventana es decorativa (aria-hidden, alt vacío)', det)
    const look = await p.evaluate(() => ({ an: getComputedStyle(document.querySelector('#frame .hero__img')).animationName, sup: CSS.supports('animation-timeline: view()') }))
    console.log(`info ${eng} A · la mirada (línea de tiempo de vista): soporte ${look.sup}, animación «${look.an}»`)
    rec(eng, 'A', 'la mirada solo existe donde hay línea de tiempo de vista (mejora progresiva)', look.sup ? look.an === 'hero-look' : look.an === 'none', JSON.stringify(look))
    await close(p, eng, 'A', '1440')
    p = await open(b, '?c=A&dir=rtl')
    const tr2 = await rect(p, '#content'), fr2 = await rect(p, '#frame')
    rec(eng, 'A', 'RTL: la ventana se espeja (izquierda)', fr2.right < tr2.right && fr2.left < tr2.left)
    rec(eng, 'A', 'RTL sin desplazamiento horizontal', !(await overflow(p)))
    await close(p, eng, 'A', 'rtl')
    p = await open(b, '?c=A', { reducedMotion: 'reduce' })
    const an = await p.evaluate(() => getComputedStyle(document.querySelector('#frame .hero__img')).animationName)
    rec(eng, 'A', 'movimiento reducido: la mirada no se anima', an === 'none', an)
    await close(p, eng, 'A', 'reducido')
  }

  // ---------------- B · Vistas a elegir ----------------
  if (PARTS.includes('B')) {
    let p = await open(b, '?c=B')
    const info = await p.evaluate(() => ({ radios: document.querySelectorAll('#views input[type=radio]').length, legend: document.querySelector('#views legend').textContent.trim(), zone: document.getElementById('plate').dataset.gZone }))
    rec(eng, 'B', 'las vistas son un grupo de radio con leyenda (elegir una)', info.radios === 3 && info.legend === 'Vistas')
    const src0 = await p.evaluate(() => document.getElementById('img').dataset.key)
    await p.waitForTimeout(3000)
    rec(eng, 'B', 'la foto no cambia sola (3 s sin tocar)', (await p.evaluate(() => document.getElementById('img').dataset.key)) === src0)
    await p.focus('#views input:checked')
    await p.keyboard.press('ArrowRight'); await settle(p)
    const after = await p.evaluate(() => { const i = document.getElementById('img'); return { key: i.dataset.key, alt: i.alt, hidden: [...document.querySelectorAll('.hero__layer:not(.is-current)')].every((e) => e.getAttribute('aria-hidden') === 'true' && e.alt === ''), checked: document.querySelector('#views input:checked').value, focus: document.activeElement.value } })
    rec(eng, 'B', 'flecha → elige la vista siguiente, la foto y su alt cambian', after.key !== src0 && after.checked === after.key && after.alt.length > 0 && after.focus === after.key, JSON.stringify(after))
    rec(eng, 'B', 'las capas que no se ven quedan fuera del árbol (aria-hidden, alt vacío)', after.hidden)
    const k = await contrast(p, '.hero__view:has(input:checked) .hero__view-name')
    rec(eng, 'B', 'contraste del nombre de la vista ≥ 4.5 en la placa', k >= 4.5, k)
    const vh = await p.evaluate(() => Math.min(...[...document.querySelectorAll('.hero__view')].map((e) => e.getBoundingClientRect().height)))
    rec(eng, 'B', 'cada vista ≥ 44px de alto', vh >= 44, vh)
    const ring = await p.evaluate(() => { const l = document.activeElement.closest('label'); return getComputedStyle(l).outlineStyle !== 'none' })
    rec(eng, 'B', 'foco visible en la vista (anillo en la etiqueta)', ring)
    await close(p, eng, 'B', '1440')
    // movimiento: pausa visible, y con movimiento reducido arranca en pausa
    p = await open(b, '?c=B&motion=1')
    const m1 = await p.evaluate(() => ({ name: document.getElementById('motion').textContent.trim(), pressed: document.getElementById('motion').getAttribute('aria-pressed'), play: getComputedStyle(document.getElementById('img')).animationPlayState }))
    rec(eng, 'B', 'foto en movimiento: botón «Pausar movimiento» visible y corriendo', m1.name === 'Pausar movimiento' && m1.pressed === 'false' && m1.play === 'running', JSON.stringify(m1))
    await p.click('#motion')
    const m2 = await p.evaluate(() => ({ name: document.getElementById('motion').textContent.trim(), play: getComputedStyle(document.getElementById('img')).animationPlayState }))
    rec(eng, 'B', 'al pulsar se detiene y el botón dice «Reanudar movimiento»', m2.name === 'Reanudar movimiento' && m2.play === 'paused', JSON.stringify(m2))
    const mb = await p.evaluate(() => document.getElementById('motion').getBoundingClientRect().height)
    rec(eng, 'B', 'botón de pausa ≥ 44px', mb >= 44, mb)
    await close(p, eng, 'B', 'motion')
    p = await open(b, '?c=B&motion=1', { reducedMotion: 'reduce' })
    const m3 = await p.evaluate(() => ({ name: document.getElementById('motion').textContent.trim(), an: getComputedStyle(document.getElementById('img')).animationName }))
    rec(eng, 'B', 'movimiento reducido: la foto queda quieta y el botón ofrece reanudar', m3.an === 'none' && m3.name === 'Reanudar movimiento', JSON.stringify(m3))
    await close(p, eng, 'B', 'reducido')
    if (eng === 'chromium') {
      p = await open(b, '?c=B', { forcedColors: 'active' })
      const fc = await p.evaluate(() => { const s = getComputedStyle(document.getElementById('plate')); return parseFloat(s.borderTopWidth) > 0 && s.borderTopStyle !== 'none' && !/rgba\(0, 0, 0, 0\)/.test(s.borderTopColor) })
      rec(eng, 'B', 'forced-colors: la placa conserva un borde visible', fc)
      await close(p, eng, 'B', 'forced')
    }
  }

  // ---------------- C · El umbral ----------------
  if (PARTS.includes('C')) {
    const p = await open(b, '?c=C')
    const slot = await p.evaluate(() => { const s = document.getElementById('slot'); return { role: s.getAttribute('role'), name: s.getAttribute('aria-label'), n: s.querySelectorAll('button').length } })
    rec(eng, 'C', 'el hueco de la consulta es un grupo con nombre y tres preguntas', slot.role === 'group' && !!slot.name && slot.n === 3)
    const order = await p.evaluate(() => { const t = document.getElementById('title'), s = document.getElementById('slot'), a = document.getElementById('cta'); return !!(t.compareDocumentPosition(s) & 4) && !!(s.compareDocumentPosition(a) & 4) })
    rec(eng, 'C', 'orden: título → consulta → acción (la acción envía lo consultado)', order)
    const ah = await p.evaluate(() => Math.min(...[...document.querySelectorAll('.hero__ask')].map((e) => e.getBoundingClientRect().height)))
    rec(eng, 'C', 'cada pregunta ≥ 44px', ah >= 44, ah)
    for (const s of ['.hero__ask-label', '.hero__ask-value']) { const k = await contrast(p, s); rec(eng, 'C', `contraste ${s} ≥ 4.5`, k >= 4.5, k) }
    await close(p, eng, 'C', '1440')
  }

  // ---------------- Fotos extremas: el contraste del texto no depende de la foto ----------------
  if (PARTS.includes('B') || PARTS.includes('C')) {
    for (const c of ['B', 'C']) {
      if (!PARTS.includes(c)) continue
      for (const ph of ['cielo', 'noche', 'papel-picado']) {
        const p = await open(b, `?c=${c}&photo=${ph}`)
        const ks = []
        for (const s of ['#title', '#lead', '#eyebrow']) ks.push(await contrast(p, s))
        rec(eng, c, `foto «${ph}»: título, bajada y eyebrow ≥ 4.5 (la placa no depende de la foto)`, Math.min(...ks) >= 4.5, ks.join(' / '))
        await close(p, eng, c, ph)
      }
    }
  }

  // ---------------- Anchos: 390, 320 y 320×256 (≈ 400 %) ----------------
  if (PARTS.includes('widths')) {
    for (const c of ['base', 'A', 'B', 'C']) {
      for (const [vw, vh] of [[390, 844], [320, 640], [320, 256]]) {
        const p = await open(b, `?c=${c}`, { vw, vh })
        rec(eng, 'widths', `${c} ${vw}×${vh}: sin desplazamiento horizontal`, !(await overflow(p)))
        const clip = await p.evaluate(() => { const h = document.getElementById('hero'); const t = document.getElementById('title').getBoundingClientRect(), a = document.getElementById('cta').getBoundingClientRect(), hr = h.getBoundingClientRect(); return { inHero: t.top >= hr.top - 1 && a.bottom <= hr.bottom + 1, cut: h.scrollHeight > h.clientHeight + 1 && getComputedStyle(h).overflowY !== 'visible' } })
        rec(eng, 'widths', `${c} ${vw}×${vh}: título y acción dentro del héroe, nada recortado (1.4.10)`, clip.inHero && !clip.cut, JSON.stringify(clip))
        const ts = await p.evaluate(() => parseFloat(getComputedStyle(document.getElementById('title')).fontSize))
        rec(eng, 'widths', `${c} ${vw}×${vh}: el título no baja de title-lg (≈ 31px)`, ts >= 31, ts)
        if (vw === 390) {
          const order = await p.evaluate(() => { const t = document.getElementById('cta').getBoundingClientRect(); return t.bottom <= innerHeight + 1 })
          rec(eng, 'widths', `${c} 390×844: la acción principal se ve sin desplazar`, order || c === 'B', c === 'B' ? 'B: la foto va primero (informativo)' : '')
          if (eng === 'chromium') await shot(p, `${eng}-${c}-390`)
        }
        if (c === 'B' || c === 'C') {
          const pl = await rect(p, '#plate'), md = await rect(p, '#media')
          rec(eng, 'widths', `${c} ${vw}: la placa no tapa más de la mitad de la foto`, (md.bottom - pl.top) <= md.height / 2 + 1, `${Math.round(md.bottom - pl.top)} / ${Math.round(md.height)}`)
        }
        await close(p, eng, 'widths', `${c} ${vw}`)
      }
    }
    // Temas de muestra: el título toma la familia display del tema (lujo) y nada desborda
    const p = await open(b, '?c=B&theme=lujo')
    const ff = await p.evaluate(() => getComputedStyle(document.getElementById('title')).fontFamily)
    rec(eng, 'widths', 'tema «lujo»: el título usa --g-font-display del tema', /Georgia|Palatino|Iowan/.test(ff), ff)
    const k = await contrast(p, '#title')
    rec(eng, 'widths', 'tema «lujo»: contraste del título en la placa ≥ 4.5', k >= 4.5, k)
    await shot(p, `${eng}-B-lujo`)
    await close(p, eng, 'widths', 'lujo')
    const p2 = await open(b, '?c=A&theme=rustico&tpl=restaurante')
    const k2 = await contrast(p2, '#title')
    rec(eng, 'widths', 'tema «rústico»: contraste del título ≥ 4.5', k2 >= 4.5, k2)
    await shot(p2, `${eng}-A-rustico`)
    await close(p2, eng, 'widths', 'rústico')
  }
  await b.close()
}
server.close()

const by = {}
for (const r of R) { const k = `${r.eng}|${r.part}`; by[k] = by[k] || { ok: 0, n: 0 }; by[k].n++; if (r.ok) by[k].ok++ }
console.log('\nResumen:')
for (const [k, v] of Object.entries(by)) console.log(`  ${k.replace('|', ' · ')}: ${v.ok}/${v.n}`)
const ok = R.filter((r) => r.ok).length
console.log(`\n${ok} de ${R.length} pasan`)
process.exit(ok === R.length ? 0 : 1)
