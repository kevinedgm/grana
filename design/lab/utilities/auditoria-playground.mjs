// Auditoría de coco (paso 5) de las clases utilitarias sobre el PLAYGROUND real (packages/vue/playground/index.html#sec-utilities,
// servido estáticamente con dist/ real). Mide los cuatro ejemplos de bruno (gap de la fila, margen g-mt-6, tamaño y color de
// g-text-caption g-text-muted con contraste ≥ 4,5:1 en claro y oscuro, nombre accesible de g-sr-only) y comprueba que la capa
// nueva no cambia la medida de NADA más: compara las cajas de todos los elementos del playground con dist/grana.css real y con
// el mismo dist/grana.css al que se le quita el bloque @layer grana.utilities (la diferencia es solo la capa nueva), con una
// tres pasadas del real entre sí para descontar el ruido de la página (los elementos con animación en curso no se comparan). Además mide 3 referencias contra su contrato.
// Desde la raíz (tras npm run build):  GRANA_PW_PORT=4210 node design/lab/utilities/auditoria-playground.mjs
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pw, ROOT, serve, stop, open, close, ok, note, near, report, settle, ENGINES, setEngine } from '../app-shell/auditoria-comun.mjs'

process.env.GRANA_PW_PORT ||= '4210'
const ORIGIN = await serve()
const URL0 = ORIGIN + '/packages/vue/playground/index.html'
const REAL = readFileSync(join(ROOT, 'packages/vue/dist/grana.css'), 'utf8')
// Quita el bloque @layer grana.utilities{…} (la declaración del orden de capas se queda)
const cut = (css) => {
  const k = '@layer grana.utilities{'
  const i = css.indexOf(k); if (i < 0) throw new Error('el dist no trae la capa')
  let d = 1, j = i + k.length
  while (d > 0) { const c = css[j++]; if (c === '{') d++; else if (c === '}') d-- }
  return css.slice(0, i) + css.slice(j)
}
const STRIPPED = cut(REAL)

const fresh = async (b, css, { dark = false, hash = '' } = {}) => {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
  await ctx.route(/unpkg\.com\/vue@3\/dist\/vue\.global\.js/, (r) => r.fulfill({ path: join(ROOT, 'node_modules/vue/dist/vue.global.prod.js'), contentType: 'text/javascript' }))
  if (css) await ctx.route(/dist\/grana\.css/, (r) => r.fulfill({ body: css, contentType: 'text/css' }))
  const p = await ctx.newPage()
  const errs = []
  p.on('pageerror', (e) => errs.push(String(e)))
  await p.goto(URL0 + hash, { waitUntil: 'load' })
  if (dark) await p.evaluate(() => { document.documentElement.dataset.theme = 'dark' })
  await p.evaluate(() => document.fonts.ready)
  await settle(p, 900)
  p.__ctx = ctx; p.__errs = errs
  return p
}

// Cajas de todos los elementos (ruta por posición), con los de la demo de utilidades aparte
const boxes = (p) => p.evaluate(() => {
  const out = {}
  const walk = (el, path) => {
    if (el.id === 'util-demo') return
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el)
    // Los antepasados de la demo cambian de alto por la demo misma (sus utilidades sí cambian con la capa): no se comparan
    if (!el.contains(document.getElementById('util-demo')) && el.getAnimations().length === 0) out[path] = [Math.round(r.width * 100) / 100, Math.round(r.height * 100) / 100, cs.display, cs.marginTop, cs.paddingTop, cs.fontSize, cs.gap]
    ;[...el.children].forEach((c, i) => walk(c, path + '/' + c.tagName.toLowerCase() + i))
  }
  walk(document.body, 'body')
  return out
})
const diff = (a, b) => { const d = []; for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) d.push(k); return d }

for (const eng of ENGINES) {
  setEngine(eng)
  const br = await pw[eng].launch()
  const E = (m) => `${eng} ${m}`

  // 1) Los cuatro ejemplos de bruno, claro y oscuro
  for (const dark of [false, true]) {
    const lab = dark ? 'oscuro' : 'claro'
    const p = await fresh(br, null, { dark, hash: '#sec-utilities' })
    const tok = (n) => p.evaluate((n) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(n)), n)
    const s3 = await tok('--g-space-3'), s6 = await tok('--g-space-6')
    // fila
    const row = await p.evaluate(() => { const r = document.getElementById('util-row'), k = [...r.children].map((e) => e.getBoundingClientRect()); const cs = getComputedStyle(r); return { display: cs.display, items: cs.alignItems, gap: cs.columnGap, g: k[1].left - k[0].right, c0: k[0].top + k[0].height / 2, c1: k[1].top + k[1].height / 2 } })
    ok(row.display === 'flex' && row.items === 'center' && near(parseFloat(row.gap), s3, 0.01), E(`${lab}: fila g-flex g-items-center g-gap-3 = flex, centrado, gap ${s3} (--g-space-3)`), JSON.stringify(row))
    ok(near(row.g, s3, 1), E(`${lab}: el hueco real entre el botón y el texto mide ${s3} px`), `${row.g.toFixed(2)}`)
    ok(near(row.c0, row.c1, 1), E(`${lab}: botón y texto centrados en el eje transversal`), `${row.c0.toFixed(1)} / ${row.c1.toFixed(1)}`)
    // margen
    const mt = await p.evaluate(() => { const e = document.getElementById('util-mt'); const cs = getComputedStyle(e); const prev = e.previousElementSibling.getBoundingClientRect(); return { mt: cs.marginTop, d: e.getBoundingClientRect().top - prev.bottom } })
    ok(near(parseFloat(mt.mt), s6, 0.01), E(`${lab}: g-mt-6 = ${s6} px (--g-space-6)`), mt.mt)
    ok(near(mt.d, s6, 1.5), E(`${lab}: la distancia real al bloque anterior es ${s6} px`), `${mt.d.toFixed(2)}`)
    // texto
    const cap = await p.evaluate(() => { const e = document.getElementById('util-caption'), cs = getComputedStyle(e); const pr = document.createElement('p'); pr.style.fontSize = 'var(--g-text-caption-size)'; pr.style.lineHeight = 'var(--g-text-caption-line)'; pr.style.color = 'var(--g-color-text-muted)'; e.parentElement.appendChild(pr); const q = getComputedStyle(pr); const o = { fs: cs.fontSize, lh: cs.lineHeight, color: cs.color, pfs: q.fontSize, plh: q.lineHeight, pcolor: q.color, ratio: window.__textRatio ? 0 : 0 }; pr.remove(); return o })
    ok(cap.fs === cap.pfs && cap.lh === cap.plh && cap.color === cap.pcolor, E(`${lab}: g-text-caption g-text-muted = rol caption (${cap.pfs} / ${cap.plh}) y --g-color-text-muted`), JSON.stringify(cap))
    ok(parseFloat(cap.fs) >= 12, E(`${lab}: el texto de apoyo mide ≥ 12 px`), cap.fs)
    const ratio = await p.evaluate((dark) => {
      const e = document.getElementById('util-caption')
      const cv = document.createElement('canvas'); cv.width = cv.height = 1; const x = cv.getContext('2d', { willReadFrequently: true })
      const rgb = (c, under) => { x.clearRect(0, 0, 1, 1); if (under) { x.fillStyle = `rgb(${under.join(',')})`; x.fillRect(0, 0, 1, 1) } x.fillStyle = '#000'; x.fillStyle = c; x.fillRect(0, 0, 1, 1); return [...x.getImageData(0, 0, 1, 1).data].slice(0, 3) }
      let bg = [255, 255, 255], found = false
      for (let n = e; n && !found; n = n.parentElement) { const c = getComputedStyle(n).backgroundColor; if (c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') { bg = rgb(c); found = true } }
      const L = (c) => { const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
      const fg = rgb(getComputedStyle(e).color, bg), a = L(fg), b = L(bg)
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
    }, dark)
    ok(ratio >= 4.5, E(`${lab}: contraste del texto de apoyo ≥ 4,5:1`), ratio.toFixed(2))
    note(`${E('')}playground ${lab}: g-text-caption g-text-muted ${ratio.toFixed(2)}:1`)
    // sr-only
    const nm = await p.getByRole('button', { name: 'Eliminar el expediente 4821' }).count()
    const sr = await p.evaluate(() => { const b = document.getElementById('util-sr'); const s = b.querySelector('.g-sr-only').getBoundingClientRect(); const v = b.querySelector('[aria-hidden]').getBoundingClientRect(); return { sw: s.width, sh: s.height, bw: b.getBoundingClientRect().width, vw: v.width } })
    ok(nm === 1, E(`${lab}: el botón con g-sr-only tiene el nombre accesible «Eliminar el expediente 4821»`), `${nm}`)
    ok(near(sr.sw, 1, 0.01) && near(sr.sh, 1, 0.01), E(`${lab}: el span g-sr-only mide 1×1`), `${sr.sw}×${sr.sh}`)
    ok(sr.bw - sr.vw < 80 && sr.bw > sr.vw, E(`${lab}: el botón se ve con el ancho de «Eliminar» más su relleno (no ocupa el sitio del texto oculto)`), `${sr.bw.toFixed(1)} / ${sr.vw.toFixed(1)}`)
    // Exterior sí / interior no (contrato «Sobre la raíz de un componente»): sobre el GBtn real de la demo
    const ext = await p.evaluate(() => {
      const row = document.getElementById('util-row'), btn = row.querySelector('.g-btn'), txt = row.querySelector('span')
      const m = (el) => { const r = el.getBoundingClientRect(), h = row.getBoundingClientRect(); return { l: r.left - h.left, r: h.right - r.right, w: r.width, h: r.height, d: getComputedStyle(el).display } }
      const base = m(btn), out = { base }
      btn.classList.add('g-ms-auto'); out.msAuto = m(btn); btn.classList.remove('g-ms-auto')
      btn.classList.add('g-w-full'); out.wFull = m(btn); btn.classList.remove('g-w-full')
      btn.classList.add('g-hidden'); out.hidden = m(btn); btn.classList.remove('g-hidden')
      btn.classList.add('g-p-8'); out.p8 = m(btn); btn.classList.remove('g-p-8')
      row.dir = 'rtl'; btn.classList.add('g-ms-auto'); out.rtl = m(btn); btn.classList.remove('g-ms-auto'); row.removeAttribute('dir')
      return out
    })
    ok(near(ext.base.l, 0, 1) && ext.msAuto.l > 200, E(`${lab}: GBtn real con g-ms-auto se aparta del inicio de la fila y deja el resto al final (exterior, API estable)`), `${ext.base.l.toFixed(1)} → ${ext.msAuto.l.toFixed(1)} (fin ${ext.msAuto.r.toFixed(1)})`)
    ok(near(ext.rtl.r, ext.msAuto.l, 1) && ext.rtl.l < ext.msAuto.l + 1, E(`${lab}: GBtn con g-ms-auto en dir="rtl" se aparta del inicio (la derecha) con la misma distancia que en LTR`), `${ext.rtl.r.toFixed(1)} / ${ext.msAuto.l.toFixed(1)}`)
    ok(ext.wFull.w >= ext.base.w * 2, E(`${lab}: GBtn con g-w-full se ensancha (el block de la prop sigue siendo la vía preferida)`), `${ext.base.w.toFixed(1)} → ${ext.wFull.w.toFixed(1)}`)
    ok(ext.hidden.d === 'none', E(`${lab}: GBtn con g-hidden queda en display none`), ext.hidden.d)
    note(`${E('')}${lab} interior (fuera de contrato): g-p-8 sobre la raíz de GBtn cambia su caja ${ext.base.w.toFixed(1)}×${ext.base.h.toFixed(1)} → ${ext.p8.w.toFixed(1)}×${ext.p8.h.toFixed(1)} (gana por capa, como dice el contrato; no es un defecto)`)
    ok(p.__errs.length === 0, E(`${lab}: sin errores de página`), p.__errs.slice(0, 2).join(' | '))
    await p.__ctx.close()
  }

  // 2) Nada más cambió de medida por la capa nueva (todo el playground, claro y oscuro)
  for (const dark of [false, true]) {
    const lab = dark ? 'oscuro' : 'claro'
    const a1 = await fresh(br, null, { dark }), a2 = await fresh(br, null, { dark }), a3 = await fresh(br, null, { dark }), bS = await fresh(br, STRIPPED, { dark })
    const A1 = await boxes(a1), A2 = await boxes(a2), A3 = await boxes(a3), B = await boxes(bS)
    const noise = new Set([...diff(A1, A2), ...diff(A1, A3), ...diff(A2, A3)])
    const real = diff(A1, B).filter((k) => !noise.has(k))
    ok(Object.keys(A1).length > 500, E(`${lab}: se compararon ${Object.keys(A1).length} elementos`), `${Object.keys(A1).length}`)
    ok(real.length === 0, E(`${lab}: con y sin la capa grana.utilities, ninguno de los ${Object.keys(A1).length} elementos del playground (salvo la demo de utilidades y sus antepasados) cambia de caja, display, margen, relleno, tamaño de letra ni gap (${noise.size} descartados por ruido de la propia página)`), real.slice(0, 6).join(' | '))
    // Tres referencias contra el contrato de cada componente
    const refs = await a1.evaluate(() => {
      const num = (v) => parseFloat(v)
      const root = getComputedStyle(document.documentElement)
      const s = (n) => num(root.getPropertyValue(n))
      const btn = document.querySelector('#sec-btn .g-btn'), card = document.querySelector('.g-card'), st = document.querySelector('.g-stack--divided')
      const o = { s3: s('--g-space-3'), s4: s('--g-space-4'), s6: s('--g-space-6') }
      if (btn) { const r = btn.getBoundingClientRect(); o.btn = [Math.round(r.height * 100) / 100, getComputedStyle(btn).minBlockSize] }
      if (card) { const cs = getComputedStyle(card); o.card = [cs.paddingTop, cs.paddingLeft, cs.borderTopLeftRadius] }
      if (st) { const cs = getComputedStyle(st); const k = [...st.children].filter((e) => getComputedStyle(e).display !== 'none'); o.stack = [cs.rowGap, k[1] && getComputedStyle(k[1]).paddingTop, k[1] && getComputedStyle(k[1]).borderTopWidth] }
      return o
    })
    const refsB = await bS.evaluate(() => { const btn = document.querySelector('#sec-btn .g-btn'), card = document.querySelector('.g-card'), st = document.querySelector('.g-stack--divided'); return { btn: btn && Math.round(btn.getBoundingClientRect().height * 100) / 100, card: card && getComputedStyle(card).paddingTop, stack: st && getComputedStyle(st).rowGap } })
    note(`${E('')}${lab} referencias (con capa): GBtn alto ${refs.btn && refs.btn[0]} px (sin capa ${refsB.btn}); GCard relleno ${refs.card && refs.card[0]} (sin capa ${refsB.card}); GStack divided gap ${refs.stack && refs.stack[0]} (sin capa ${refsB.stack}); espacio 3/4/6 = ${refs.s3}/${refs.s4}/${refs.s6}`)
    ok(refs.btn && refsB.btn === refs.btn[0], E(`${lab}: alto de un GBtn igual con y sin la capa (${refs.btn && refs.btn[0]} px)`), JSON.stringify([refs.btn, refsB.btn]))
    ok(refs.card && refsB.card === refs.card[0], E(`${lab}: relleno de una GCard igual con y sin la capa (${refs.card && refs.card[0]})`), JSON.stringify([refs.card, refsB.card]))
    ok(refs.stack && refsB.stack === refs.stack[0], E(`${lab}: gap de un GStack divided igual con y sin la capa (${refs.stack && refs.stack[0]})`), JSON.stringify([refs.stack, refsB.stack]))
    for (const x of [a1, a2, a3, bS]) await x.__ctx.close()
  }
  await br.close()
}
await stop()
const failed = report('utilidades-playground')
process.exit(failed ? 1 : 0)
