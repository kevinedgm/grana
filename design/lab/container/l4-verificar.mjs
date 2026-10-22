// Addendum L4 (coco, #751): GPageHeader de primer hijo de GContainer (hijo directo de .g-container__body), componentes
// REALES de dist/ en design/lab/container/auditoria-banco.html, con chasis (GAppShell + GSidebar) y sin chasis (as="main").
// Mide, en el inicio y el final LÓGICOS (vale en RTL):
//   h1      inicio del h1 contra el inicio del texto de la página (#p1)          → 0 px
//   acc     final de las acciones contra el final de la columna                   → 0 px
//   tab     inicio del texto de la primera pestaña contra el inicio de la columna  → 0 px (con ?tabs=1)
//   pegado  el zócalo pegado (fondo, línea y sombra) llega a los dos bordes de la CAJA del contenedor, el título compacto
//           (--_p = 1) arranca en la columna y las acciones siguen terminando en ella
//   muelle  en estrecho y pegado, el muelle va de borde a borde de la caja y su título arranca en la columna
//   y además: sin desplazamiento horizontal, consola limpia.
// Requiere dist/ (npm run build). Desde la raíz:  GRANA_PW_PORT=4211 node design/lab/container/l4-verificar.mjs
//   --engines=chromium  --verbose
import { pw, serve, stop, open, close, ok, note, near, report, settle, rect, toY, overflowX, ENGINES, setEngine } from '../app-shell/auditoria-comun.mjs'

const ORIGIN = await serve()
const BANCO = ORIGIN + '/design/lab/container/auditoria-banco.html'
const READY = () => window.__ready && document.querySelector('#ct > .g-container__body') && document.querySelector('#ph h1')

// [ancho, alto, chasis, dir, horizontal, pestañas]
const CASES = []
for (const shell of [1, 0]) {
  for (const dir of ['ltr', 'rtl']) {
    CASES.push([1440, 900, shell, dir, 'center', 0], [1440, 900, shell, dir, 'center', 1], [390, 800, shell, dir, 'center', 1])
  }
  CASES.push([1440, 900, shell, 'ltr', 'start', 1], [1024, 768, shell, 'ltr', 'center', 1])
}

// Geometría lógica: s = inicio, e = final (en RTL, el inicio es la derecha)
const measure = (p) => p.evaluate(() => {
  const rtl = getComputedStyle(document.getElementById('ct')).direction === 'rtl'
  const R = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { s: rtl ? -r.right : r.left, e: rtl ? -r.left : r.right, l: r.left, r: r.right, w: r.width } }
  const q = (s) => document.querySelector(s)
  const ph = q('#ph')
  return {
    rtl,
    box: R(q('#ct')), col: R(q('#ct > .g-container__body')), p1: R(q('#p1')),
    h1: R(q('#ph h1')), act: R(q('#ph .g-page-header__actions')), root: R(ph), base: R(q('#ph .g-page-header__base')),
    tab: R(q('#ph .g-tabs__label')), bt: R(q('#ph .g-page-header__base-title')),
    dock: R(q('#ph .g-page-header__dock')), dockT: R(q('#ph .g-page-header__dock-title')),
    dockOpen: !!q('#ph .g-page-header__dock.is-open'),
    cls: ph.className, p: getComputedStyle(ph).getPropertyValue('--_p').trim(),
    shadow: getComputedStyle(ph).boxShadow, line: getComputedStyle(q('#ph .g-page-header__base')).boxShadow
  }
})

const r1 = (n) => Math.round(n * 10) / 10

for (const eng of ENGINES) {
  setEngine(eng)
  const b = await pw[eng].launch()
  for (const [vw, vh, shell, dir, h, tabs] of CASES) {
    const qs = new URLSearchParams()
    if (!shell) qs.set('shell', '0')
    if (dir === 'rtl') qs.set('dir', 'rtl')
    if (h !== 'center') qs.set('h', h)
    if (tabs) qs.set('tabs', '1')
    const lab = `${eng} ${vw} ${shell ? 'chasis' : 'sin chasis'} ${dir}${h !== 'center' ? ' start' : ''}${tabs ? ' pestañas' : ''}`
    const p = await open(b, BANCO + '?' + qs, { vw, vh, ready: READY, wait: 500 })
    const narrow = vw < 600

    // ---- En reposo ----
    const m = await measure(p)
    const dh1 = m.h1.s - m.p1.s, dact = m.col.e - m.act.e
    note(`${lab} · reposo: h1 Δ ${r1(dh1)} px · acciones Δ ${r1(dact)} px${m.tab ? ` · pestaña Δ ${r1(m.tab.s - m.col.s)} px` : ''} · raíz ${r1(m.root.s - m.box.s)}…${r1(m.box.e - m.root.e)} de la caja`)
    ok(near(dh1, 0, 0.6), `${lab}: el h1 arranca a ras del texto de la página`, `Δ ${r1(dh1)}`)
    ok(near(dact, 0, 0.6), `${lab}: las acciones terminan a ras del final de la columna`, `Δ ${r1(dact)}`)
    if (m.tab) ok(near(m.tab.s - m.col.s, 0, 0.6), `${lab}: la primera pestaña arranca a ras de la columna`, `Δ ${r1(m.tab.s - m.col.s)}`)
    ok(near(m.root.s, m.box.s, 0.6) && near(m.root.e, m.box.e, 0.6), `${lab}: la raíz del encabezado llega a los dos bordes de la caja`, `${r1(m.root.s - m.box.s)} / ${r1(m.box.e - m.root.e)}`)
    ok(!(await overflowX(p)), `${lab}: sin desplazamiento horizontal`)

    // ---- Pegado ----
    await toY(p, 1400)
    await settle(p, 400)
    const s = await measure(p)
    const stuck = /\bis-stuck\b/.test(s.cls)
    ok(stuck, `${lab}: pegado (is-stuck) tras desplazar`, s.cls)
    ok(near(s.base.s, s.box.s, 0.6) && near(s.base.e, s.box.e, 0.6), `${lab}: el zócalo pegado (fondo y línea) llega a los dos bordes de la caja`, `${r1(s.base.s - s.box.s)} / ${r1(s.box.e - s.base.e)}`)
    ok(/rgb/.test(s.line) && s.shadow !== 'none', `${lab}: pegado con su línea de suelo y su sombra`, `${s.line} | ${s.shadow}`)
    if (!narrow) {
      ok(near(s.col.e - s.act.e, 0, 0.6), `${lab}: pegado, las acciones siguen a ras del final de la columna`, `Δ ${r1(s.col.e - s.act.e)}`)
      if (s.bt && s.p === '1') {
        ok(near(s.bt.s - s.col.s, 0, 0.6), `${lab}: el título compacto (--_p = 1) arranca a ras de la columna`, `Δ ${r1(s.bt.s - s.col.s)}`)
        note(`${lab} · pegado: título compacto Δ ${r1(s.bt.s - s.col.s)} px · zócalo ${r1(s.base.s - s.box.s)}…${r1(s.box.e - s.base.e)} de la caja`)
      } else ok(false, `${lab}: título compacto medible con --_p = 1`, `p=${s.p}`)
    } else {
      ok(s.dockOpen, `${lab}: estrecho y pegado, el muelle está abierto`)
      if (s.dockOpen) {
        ok(near(s.dock.l, s.box.l, 0.6) && near(s.dock.r, s.box.r, 0.6), `${lab}: el muelle va de borde a borde de la caja`, `${r1(s.dock.l)}/${r1(s.box.l)} ${r1(s.dock.r)}/${r1(s.box.r)}`)
        ok(near(s.dockT.s - s.col.s, 0, 0.6), `${lab}: el título del muelle arranca a ras de la columna`, `Δ ${r1(s.dockT.s - s.col.s)}`)
        note(`${lab} · muelle: título Δ ${r1(s.dockT.s - s.col.s)} px`)
      }
    }
    ok(!(await overflowX(p)), `${lab}: pegado, sin desplazamiento horizontal`)
    await close(p, lab)
  }
  await b.close()
}
await stop()
process.exit(report('GContainer · L4') ? 1 : 0)
