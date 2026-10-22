// Verificación de coco (encargo de las clases utilitarias, design/contracts/utilities.md «Verificación» b a d) sobre
// design/lab/utilities/estilo-banco.html con packages/vue/src/styles/utilities.css y el dist/ de Grana. Mide, en Chromium,
// Firefox y WebKit y en el tema por defecto (claro/oscuro), «Tema de prueba» (space 5), un tema del CLI (space 5, fontSize 14)
// y RTL: la escala del tema (g-p-4 = --g-space-4), ejes lógicos, orden dentro de la familia, utilidad contra componente (gana
// por capa) y contra la aplicación sin capa (pierde), display + hidden, alineación flex/rejilla (start/end/between/around/
// evenly, self-*), gap, texto (rol del tema, mínimo 12 px, color muted/subtle con el esquema y la zona de marca), truncate,
// radios, g-sr-only frente a g-hidden y la cobertura de las 229 clases de utilities.json (regla en la hoja y declaración
// idéntica a la del JSON). Con ?utilfirst=1 repite lo esencial con utilities.css cargado antes que grana.css.
// Requiere dist/ (npm run build). Desde la raíz:  GRANA_PW_PORT=4209 node design/lab/utilities/verificar.mjs
import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'
import { pw, ROOT, serve, stop, open, close, ok, note, near, report, settle, ENGINES, setEngine } from '../app-shell/auditoria-comun.mjs'

process.env.GRANA_PW_PORT ||= '4209'
const ORIGIN = await serve()
const URL0 = ORIGIN + '/design/lab/utilities/estilo-banco.html'
const READY = () => window.__ready
const JSONC = JSON.parse(readFileSync(join(ROOT, 'design/contracts/utilities.json'), 'utf8'))

// Tema del CLI con space 5 y el menor fontSize que el motor admite (14: body-sm 12,25 px)
const dir = mkdtempSync(join(tmpdir(), 'grana-util-'))
writeFileSync(join(dir, 't5.json'), JSON.stringify({ brand: '#1F4E79', accent: '#0B63CE', radius: 8, shape: 'rounded', space: 5, font: 'Instrument Sans', fontSize: 14, typeScale: 1.25 }))
execFileSync('node', [join(ROOT, 'packages/cli/bin/grana.mjs'), 'theme', join(dir, 't5.json'), '--out', join(dir, 't5.css')], { stdio: 'ignore' })
const T5 = join(dir, 't5.css')

// Lectura de la página: rectángulos, estilos computados y sondas con var(--g-*)
const R = (p, id) => p.evaluate((id) => { const r = document.getElementById(id).getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height } }, id)
const CS = (p, id, ...props) => p.evaluate(([id, props]) => { const cs = getComputedStyle(document.getElementById(id)); return Object.fromEntries(props.map((k) => [k, cs.getPropertyValue(k)])) }, [id, props])
const PX = async (p, id, prop) => parseFloat((await CS(p, id, prop))[prop])
const probe = (p, prop, value, inside) => p.evaluate(([prop, value, inside]) => { const e = document.createElement('div'); e.style.setProperty(prop, value); (inside ? document.querySelector(inside) : document.body).appendChild(e); const v = getComputedStyle(e).getPropertyValue(prop); e.remove(); return v }, [prop, value, inside])
const tok = (p, name) => p.evaluate((n) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(n)), name)
// Caja interior (dentro del borde de 1 px) de un contenedor del banco
const inner = async (p, id) => { const r = await R(p, id); return { l: r.l + 1, r: r.r - 1, t: r.t + 1, b: r.b - 1, w: r.w - 2, h: r.h - 2 } }

async function suite (p, E, { rtl, dark, theme, quick }) {
  const s1 = await tok(p, '--g-space-1'), s3 = await tok(p, '--g-space-3'), s4 = await tok(p, '--g-space-4'), s5 = await tok(p, '--g-space-5'), s6 = await tok(p, '--g-space-6'), s2 = await tok(p, '--g-space-2')
  const space = { 1: s1, 2: s2, 3: s3, 4: s4, 5: s5, 6: s6 }
  const expect4 = theme === 'prueba' || theme === 't5' ? 20 : 16
  ok(near(s4, expect4, 0.01), E(`--g-space-4 del tema = ${expect4}`), `${s4}`)
  const lead = rtl ? 'r' : 'l' // lado del inicio de línea
  const pad = (k) => k // alias

  // Relleno: g-p-4 = --g-space-4 (16 con el tema por defecto, 20 con space 5); orden: g-p-4 g-pt-0 deja 0 arriba
  const p4 = await CS(p, 'p4', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left')
  ok(Object.values(p4).every((v) => near(parseFloat(v), s4, 0.01)), E(`g-p-4 = ${s4} px por los cuatro lados`), JSON.stringify(p4))
  const p4t = await CS(p, 'p4t0', 'padding-top', 'padding-bottom', 'padding-left')
  ok(parseFloat(p4t['padding-top']) === 0 && near(parseFloat(p4t['padding-bottom']), s4, 0.01) && near(parseFloat(p4t['padding-left']), s4, 0.01), E('g-p-4 g-pt-0: 0 arriba, el resto de g-p-4'), JSON.stringify(p4t))
  const pxy = await CS(p, 'pxy', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right')
  const [psSide, peSide] = rtl ? ['padding-right', 'padding-left'] : ['padding-left', 'padding-right']
  ok(near(parseFloat(pxy[psSide]), s6, 0.01) && near(parseFloat(pxy[peSide]), s3, 0.01) && near(parseFloat(pxy['padding-top']), s1, 0.01), E('g-px-3 g-py-1 g-ps-6: inicio 6, final 3, bloque 1 (el lado gana al eje por el orden de la hoja)'), JSON.stringify(pxy))

  // Márgenes lógicos: g-ms-4 cae a la izquierda en LTR y a la derecha en RTL
  const ms = await CS(p, 'ms4', 'margin-left', 'margin-right')
  ok(near(parseFloat(ms[rtl ? 'margin-right' : 'margin-left']), s4, 0.01), E(`g-ms-4 → margin-${rtl ? 'right' : 'left'} ${s4} (WebKit devuelve el valor usado del lado opuesto en una caja de ancho fijo: no se compara)`), JSON.stringify(ms))
  const hostMs = await inner(p, 'ms-host'), bMs = await R(p, 'ms4')
  ok(rtl ? near(hostMs.r - bMs.r, s4, 0.6) : near(bMs.l - hostMs.l, s4, 0.6), E('g-ms-4: la caja empieza a s4 del borde de inicio'), `${rtl ? hostMs.r - bMs.r : bMs.l - hostMs.l}`)
  const hostMe = await inner(p, 'me-host'), bMe = await R(p, 'me4')
  ok(rtl ? near(bMe.l - hostMe.l, s4, 0.6) : near(hostMe.r - bMe.r, s4, 0.6), E('g-me-4 g-ms-auto: la caja va al final y deja s4 del borde de fin'), `${rtl ? bMe.l - hostMe.l : hostMe.r - bMe.r}`)
  const mx = await R(p, 'mxauto'), hostMx = (await R(p, 'mxauto')) && await p.evaluate(() => { const r = document.getElementById('mxauto').parentElement.getBoundingClientRect(); return { l: r.left + 1, r: r.right - 1 } })
  ok(rtl ? near(hostMx.r - mx.r, 0, 0.6) : near(mx.l - hostMx.l, 0, 0.6), E('g-mx-auto g-ms-0: el inicio vuelve a 0 y el auto queda solo al final (orden de la hoja)'), `${mx.l - hostMx.l}`)
  const my = await p.evaluate(() => { const h = document.getElementById('myauto').parentElement.getBoundingClientRect(), b = document.getElementById('myauto').getBoundingClientRect(); return (b.top - h.top - 1) - (h.bottom - 1 - b.bottom) })
  ok(near(my, 0, 0.6), E('g-my-auto en flex centra en el bloque'), `${my}`)
  const mix = await CS(p, 'mix', 'margin-bottom', 'margin-top')
  const mixR = await R(p, 'mix'), mixH = await p.evaluate(() => { const r = document.getElementById('mix').parentElement.getBoundingClientRect(); return { l: r.left + 1, r: r.right - 1 } })
  ok(near(parseFloat(mix['margin-bottom']), s5, 0.01) && parseFloat(mix['margin-top']) === 0 && near(rtl ? mixH.r - mixR.r : mixR.l - mixH.l, 0, 0.6), E('g-m-0 g-mb-3 g-mb-5: decide el orden de la hoja (g-mb-5 al final), no el de las clases'), JSON.stringify(mix))

  // Contra componente y contra la aplicación
  const a = await R(p, 'st-a'), b = await R(p, 'st-b'), c = await R(p, 'st-c')
  const gap = 6 * s1
  const mtB = await PX(p, 'st-b', 'margin-top'), mtC = await PX(p, 'st-c', 'margin-top'), mtA = await PX(p, 'st-a', 'margin-top')
  ok(mtA === 0 && near(mtB, s4, 0.01), E(`GStack: el hijo sin clase sigue en 0 y g-mt-4 mide ${s4} (la utilidad gana a .g-stack > *)`), `${mtA} / ${mtB}`)
  ok(near(b.t - a.b, gap + s4, 0.6), E(`GStack: g-mt-4 se SUMA al gap (${gap} + ${s4})`), `${b.t - a.b}`)
  ok(mtC === 3 && near(c.t - b.b, gap + 3, 0.6), E('una regla de la aplicación SIN capa (3 px) gana a g-mt-4 y la pila sigue sumando su gap'), `${mtC}`)
  const cmp = await CS(p, 'cmp-k', 'margin-top', 'padding-left', 'padding-right')
  ok(near(parseFloat(cmp['margin-top']), s4, 0.01) && near(parseFloat(cmp['padding-left']), s5, 0.01) && near(parseFloat(cmp['padding-right']), s5, 0.01), E('la utilidad gana a una regla de grana.components de especificidad 1,3,0 (por capa, sin !important)'), JSON.stringify(cmp))

  // display y hidden
  const D = async (id) => (await CS(p, id, 'display')).display
  const disp = { 'd-flex-h': 'none', 'd-flex': 'flex', 'd-grid': 'grid', 'd-iflex': 'inline-flex', 'd-block': 'block', 'd-inline': 'inline', 'd-iblock': 'inline-block', 'd-hid': 'none', 'd-hid2': 'none', 'd-iblock-h': 'none' }
  for (const [id, v] of Object.entries(disp)) ok(await D(id) === v, E(`#${id}: display ${v}`), await D(id))
  const until = await D('d-until')
  ok(until !== 'grid' && until !== 'flex', E('g-grid g-block con hidden="until-found": la guarda no los muestra como grid/flex'), until)

  // Alineación y reparto: flex
  const rel = async (id, cid) => { const f = await inner(p, cid || id); return f }
  const kids = (id) => p.evaluate((id) => [...document.getElementById(id).children].map((e) => { const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height } }), id)
  const g6 = await kids('fx-g')
  ok(g6.slice(1).every((k, i) => near(rtl ? g6[i].l - k.r : k.l - g6[i].r, 6 * s1, 0.6)), E(`g-gap-6 = ${6 * s1} px entre hijos`), g6.slice(1).map((k, i) => (rtl ? g6[i].l - k.r : k.l - g6[i].r).toFixed(1)).join(','))
  const fx = await kids('fx'), fxf = await inner(p, 'fx')
  const first = rtl ? fxf.r - fx[0].r : fx[0].l - fxf.l, last = rtl ? fx[2].l - fxf.l : fxf.r - fx[2].r
  ok(near(first, 0, 0.6) && near(last, 0, 0.6), E('g-justify-between: primero y último a los bordes'), `${first}/${last}`)
  ok(near(fx[0].t - fxf.t, (fxf.h - fx[0].h) / 2, 0.6) && near(fx[1].t - fxf.t, (fxf.h - fx[1].h) / 2, 0.6), E('g-items-center: centrados en el eje transversal'), `${fx[0].t - fxf.t}`)
  const ss = (await kids('fx-ss'))[0], ssf = await inner(p, 'fx-ss')
  ok(near(ss.t, ssf.t, 0.6) && near(rtl ? ssf.r - ss.r : ss.l - ssf.l, 0, 0.6), E('flex g-items-start g-justify-start: arriba y al inicio de línea (WebKit incluido)'), `${ss.t - ssf.t}/${rtl ? ssf.r - ss.r : ss.l - ssf.l}`)
  const ee = (await kids('fx-ee'))[0], eef = await inner(p, 'fx-ee')
  ok(near(ee.b, eef.b, 0.6) && near(rtl ? ee.l - eef.l : eef.r - ee.r, 0, 0.6), E('flex g-items-end g-justify-end: abajo y al final de línea (WebKit incluido)'), `${eef.b - ee.b}/${rtl ? ee.l - eef.l : eef.r - ee.r}`)
  const cc = (await kids('fx-cc'))[0], ccf = await inner(p, 'fx-cc')
  ok(near(cc.t - ccf.t, (ccf.h - cc.h) / 2, 0.6) && near(cc.l - ccf.l, (ccf.w - cc.w) / 2, 0.6), E('flex g-items-center g-justify-center: centrada'))
  const bl = await kids('fx-bl')
  ok(near(bl[0].b, bl[1].b, 0.6), E('g-items-baseline: alinea las líneas base (cajas vacías: sus bordes inferiores)'), `${bl[0].b} / ${bl[1].b}`)
  const st = (await kids('fx-st'))[0], stf = await inner(p, 'fx-st')
  ok(near(st.h, stf.h, 0.6), E('g-items-stretch: la caja con block-size auto llena el eje transversal'), `${st.h} / ${stf.h}`)
  const ar = await kids('fx-ar'), arf = await inner(p, 'fx-ar'), free = arf.w - 100
  ok(near(rtl ? arf.r - ar[0].r : ar[0].l - arf.l, free / 4, 0.6) && near(rtl ? ar[0].l - ar[1].r : ar[1].l - ar[0].r, free / 2, 0.6), E('g-justify-around: media separación en los extremos, entera entre cajas'), `${(rtl ? arf.r - ar[0].r : ar[0].l - arf.l).toFixed(1)}`)
  const ev = await kids('fx-ev'), evf = await inner(p, 'fx-ev')
  ok(near(rtl ? evf.r - ev[0].r : ev[0].l - evf.l, (evf.w - 100) / 3, 0.6), E('g-justify-evenly: tres huecos iguales'), `${(rtl ? evf.r - ev[0].r : ev[0].l - evf.l).toFixed(1)}`)
  const sf = await Promise.all(['sf-s', 'sf-c', 'sf-e', 'sf-t'].map((id) => R(p, id))), sff = await inner(p, 'fx-self')
  ok(near(sf[0].t, sff.t, 0.6) && near(sf[1].t - sff.t, (sff.h - sf[1].h) / 2, 0.6) && near(sf[2].b, sff.b, 0.6) && near(sf[3].h, sff.h, 0.6), E('g-self-start / center / end / stretch'), sf.map((x) => `${x.t - sff.t}`).join(','))
  const col = await kids('fx-col'), row = await kids('fx-row')
  ok(near(col[1].t - col[0].b, s2, 0.6) && near(col[0].l, col[1].l, 0.6), E('g-flex-col con g-gap-2: apila con 8 px'), `${col[1].t - col[0].b}`)
  ok(near(row[0].t, row[1].t, 0.6) && (rtl ? row[1].r <= row[0].l + 0.6 : row[1].l >= row[0].r - 0.6), E('g-flex-row: en línea (en RTL de derecha a izquierda)'))
  const wr = await kids('fx-wrap')
  ok(near(rtl ? wr[0].l - wr[1].r : wr[1].l - wr[0].r, s2, 0.6) && near(wr[2].t - wr[0].b, s4, 0.6) && near(wr[2].l, wr[0].l, 0.6), E('g-flex-wrap con g-gap-x-2 y g-gap-y-4: 8 entre columnas, 16 entre filas, la tercera baja al inicio'), `${wr[2].t - wr[0].b}`)
  const gw = await CS(p, 'fx-wrap', 'column-gap', 'row-gap')
  ok(near(parseFloat(gw['column-gap']), s2, 0.01) && near(parseFloat(gw['row-gap']), s4, 0.01), E('column-gap y row-gap de g-gap-x-2 / g-gap-y-4'), JSON.stringify(gw))
  const gr = (await R(p, 'gr')).w, fxg = await inner(p, 'fx-grow')
  ok(near(gr, fxg.w - 60, 0.6), E('g-grow: ocupa el resto de la fila'), `${gr} / ${fxg.w - 60}`)
  const shw = (await R(p, 'sh')).w, sh2 = (await R(p, 'sh2')).w
  ok(near(shw, 200, 0.6) && sh2 < 200, E('g-shrink-0: no se encoge (200 px) y su vecina sí'), `${shw} / ${sh2}`)
  const mw = (await R(p, 'mw')).w, mw2 = (await R(p, 'mw2')).w
  ok(near(mw, 100, 0.6) && mw2 > 100, E('g-min-w-0: el hijo con texto sin partir se encoge a su fila (100 px); sin ella desborda'), `${mw} / ${mw2}`)

  // Rejilla
  const gg = await kids('gr-gap')
  ok(near(rtl ? gg[0].l - gg[1].r : gg[1].l - gg[0].r, s2, 0.6) && near(gg[2].t - gg[0].b, s4, 0.6), E('rejilla: g-gap-x-2 = 8 entre columnas y g-gap-y-4 = 16 entre filas'), `${gg[2].t - gg[0].b}`)
  const g3 = await CS(p, 'gr-gap3', 'column-gap', 'row-gap')
  ok(near(parseFloat(g3['column-gap']), s3, 0.01) && near(parseFloat(g3['row-gap']), s3, 0.01), E('g-gap-3 en rejilla: ambos 12'), JSON.stringify(g3))
  const gse = (await kids('gr-se'))[0], gsef = await inner(p, 'gr-se')
  ok(near(gse.t, gsef.t, 0.6) && near(rtl ? gse.l - gsef.l : gsef.r - gse.r, 0, 0.6), E('rejilla g-items-start g-justify-end: arriba y a fin de línea (WebKit incluido)'), `${gse.t - gsef.t}/${rtl ? gse.l - gsef.l : gsef.r - gse.r}`)
  const ges = (await kids('gr-es'))[0], gesf = await inner(p, 'gr-es')
  ok(near(ges.b, gesf.b, 0.6) && near(rtl ? gesf.r - ges.r : ges.l - gesf.l, 0, 0.6), E('rejilla g-items-end g-justify-start: abajo y al inicio de línea (WebKit incluido)'), `${gesf.b - ges.b}`)
  const gbt = await kids('gr-bt'), gbtf = await inner(p, 'gr-bt')
  ok(near(rtl ? gbtf.r - gbt[0].r : gbt[0].l - gbtf.l, 0, 0.6) && near(rtl ? gbt[1].l - gbtf.l : gbtf.r - gbt[1].r, 0, 0.6), E('rejilla g-justify-between: una pista en cada borde'))
  const wf = await R(p, 'wfull'), wff = await inner(p, 'wfull-host')
  ok(near(wf.w, wff.w, 0.6) && near(wf.h, wff.h, 0.6), E('g-w-full g-h-full: llena el ancho y el alto de su caja'), `${wf.w}×${wf.h} / ${wff.w}×${wff.h}`)

  // Texto
  const roles = ['caption', 'body-sm', 'body', 'title-sm', 'title', 'title-lg']
  for (const r of roles) {
    const el = await CS(p, 't-' + r, 'font-size', 'line-height', 'letter-spacing', 'font-weight', 'font-family')
    const pr = await p.evaluate((r) => { const e = document.createElement('p'); e.style.fontSize = `var(--g-text-${r}-size)`; e.style.lineHeight = `var(--g-text-${r}-line)`; e.style.letterSpacing = `var(--g-text-${r}-tracking)`; e.style.fontWeight = `var(--g-text-${r}-weight)`; document.getElementById('texts').appendChild(e); const cs = getComputedStyle(e); const o = { 'font-size': cs.fontSize, 'line-height': cs.lineHeight, 'letter-spacing': cs.letterSpacing, 'font-weight': cs.fontWeight }; e.remove(); return o }, r)
    ok(['font-size', 'line-height', 'letter-spacing', 'font-weight'].every((k) => el[k] === pr[k]), E(`g-text-${r}: tamaño, línea, tracking y peso del rol (${pr['font-size']} / ${pr['line-height']} / ${pr['letter-spacing']} / ${pr['font-weight']})`), JSON.stringify(el))
    ok(parseFloat(el['font-size']) >= 12, E(`g-text-${r} ≥ 12 px (mínimo de texto)`), el['font-size'])
  }
  const fam = await CS(p, 'f-ui', 'font-family'), fam2 = await CS(p, 't-title', 'font-family'), body = await p.evaluate(() => getComputedStyle(document.body).fontFamily)
  ok(fam2['font-family'] === body, E('g-text-title NO fija la familia (#753): hereda la del cuerpo'), fam2['font-family'])
  const fu = await probe(p, 'font-family', 'var(--g-font-ui)'), ft = await probe(p, 'font-family', 'var(--g-font-title)')
  ok(fam['font-family'] === fu, E('g-font-ui = --g-font-ui'), fam['font-family'])
  ok((await CS(p, 'f-title', 'font-family'))['font-family'] === ft, E('g-font-title = --g-font-title'), ft)
  if (theme === 'prueba') ok(ft !== fu && /Georgia/.test(ft), E('con el tema de prueba, g-font-title sigue la familia de títulos (Georgia) y g-font-ui no'), ft)
  for (const k of ['muted', 'subtle']) {
    const col = (await CS(p, 'c-' + k, 'color')).color
    const pc = await probe(p, 'color', `var(--g-color-text-${k})`)
    ok(col === pc, E(`g-text-${k} = --g-color-text-${k} (${dark ? 'oscuro' : 'claro'})`), `${col} / ${pc}`)
    const ratio = await p.evaluate((id) => window.__textRatio(document.getElementById(id)), 'c-' + k)
    ok(ratio >= 4.5, E(`g-text-${k} ≥ 4.5:1 sobre la página (${dark ? 'oscuro' : 'claro'})`), ratio.toFixed(2))
    note(`${E('')}${theme || 'defecto'} ${dark ? 'oscuro' : 'claro'}: g-text-${k} ${ratio.toFixed(2)}:1`)
  }
  const zm = (await CS(p, 'z-muted', 'color')).color, zp = await probe(p, 'color', 'var(--g-color-text-muted)', '#zone'), pm = (await CS(p, 'c-muted', 'color')).color
  ok(zm === zp && zm !== pm, E('g-text-muted dentro de zone="brand" lee el de la zona, no el de la página'), `${zm} / ${pm}`)
  const zr = await p.evaluate(() => window.__textRatio(document.getElementById('z-muted')))
  ok(zr >= 4.5, E('g-text-muted sobre la zona de marca ≥ 4.5:1'), zr.toFixed(2))
  // text-align lógico
  for (const [id, v] of [['al-s', 'start'], ['al-c', 'center'], ['al-e', 'end']]) {
    const ta = (await CS(p, id, 'text-align'))['text-align']
    ok(ta === v, E(`g-text-${v}: text-align ${v}`), ta)
  }
  const xs = await p.evaluate(() => ['al-s', 'al-e'].map((id) => { const e = document.getElementById(id), rg = document.createRange(); rg.selectNodeContents(e); const t = rg.getBoundingClientRect(), b = e.getBoundingClientRect(); return { l: t.left - b.left, r: b.right - t.right } }))
  ok(rtl ? xs[0].r < 2 && xs[1].l < 2 : xs[0].l < 2 && xs[1].r < 2, E('g-text-start / g-text-end siguen la dirección (RTL se invierte)'), JSON.stringify(xs))
  const tr = await CS(p, 'trunc', 'overflow-x', 'text-overflow', 'white-space', 'height', 'line-height')
  const tov = await p.evaluate(() => { const e = document.getElementById('trunc'); return e.scrollWidth > e.clientWidth })
  ok(tr['overflow-x'] === 'hidden' && tr['text-overflow'] === 'ellipsis' && tr['white-space'] === 'nowrap' && tov && near(parseFloat(tr.height), parseFloat(tr['line-height']), 1), E('g-truncate: una sola línea, recortada con elipsis'), JSON.stringify(tr))
  for (const r of ['none', 'xs', 'sm', 'md', 'lg', 'xl', 'pill']) {
    const v = (await CS(p, 'r-' + r, 'border-top-left-radius'))['border-top-left-radius']
    const pv = await probe(p, 'border-top-left-radius', `var(--g-radius-${r})`)
    ok(v === pv, E(`g-radius-${r} = --g-radius-${r} (${pv})`), v)
  }

  // g-sr-only frente a g-hidden
  const nSr = await p.getByRole('button', { name: 'Guardar cambios' }).count()
  const nHid = await p.getByRole('button', { name: 'Borrar' }).count()
  ok(nSr === 1, E('g-sr-only: el botón conserva su nombre accesible «Guardar cambios» (el texto sigue en el árbol)'), `${nSr}`)
  ok(nHid === 0, E('g-hidden: el texto sale del árbol de accesibilidad (el botón se queda sin el nombre «Borrar»)'), `${nHid}`)
  const sr = await R(p, 'sr-span'), srcs = await CS(p, 'sr-span', 'position', 'clip-path', 'white-space', 'overflow-x')
  ok(near(sr.w, 1, 0.01) && near(sr.h, 1, 0.01) && srcs.position === 'absolute', E('g-sr-only: caja de 1×1 y posición absoluta'), `${sr.w}×${sr.h}`)
  const bs = await R(p, 'srbtn'), bt = await R(p, 'twinbtn')
  ok(near(bs.w, bt.w, 0.6) && near(bs.h, bt.h, 0.6), E('g-sr-only no ocupa sitio: el botón mide lo mismo que su gemelo sin texto'), `${bs.w}×${bs.h} / ${bt.w}×${bt.h}`)
  const rowA = await kids('sr-row'), rowB = await kids('sr-twin')
  ok(near(rowA[1].l - rowA[0].l, rowB[1].l - rowB[0].l, 0.6), E('g-sr-only: la caja vecina de la fila no se mueve'), `${rowA[1].l - rowA[0].l} / ${rowB[1].l - rowB[0].l}`)

  // GStack divided con g-hidden y g-sr-only (cambio de GStack.css)
  const bt0 = (id) => PX(p, id, 'border-top-width')
  ok(await bt0('dv-a') === 0 && near(await bt0('dv-c'), await tok(p, '--g-border-width'), 0.01), E('GStack divided: un hijo con g-hidden en medio no cuenta (el visible que sigue lleva la línea)'))
  ok(await bt0('df-a') === 0 && await bt0('df-b') > 0, E('GStack divided: con g-hidden primero, el primer visible no lleva línea y el segundo sí'), `${await bt0('df-a')}/${await bt0('df-b')}`)
  ok(await bt0('ds-a') === 0 && await bt0('ds-b') > 0, E('GStack divided: con g-sr-only primero, el primer visible no lleva línea y el segundo sí'), `${await bt0('ds-a')}/${await bt0('ds-b')}`)
}

// Cobertura: las 229 clases de utilities.json, regla en la hoja y declaración idéntica a la del JSON
async function coverage (p, E) {
  const res = await p.evaluate((classes) => {
    const sel = new Set()
    const walk = (rules) => { for (const r of rules) { if (r.selectorText) for (const m of r.selectorText.matchAll(/\.(g-[\w-]+)/g)) sel.add(m[1]); if (r.styleSheet) { try { walk(r.styleSheet.cssRules) } catch {} } if (r.cssRules) walk(r.cssRules) } }
    for (const sh of document.styleSheets) { try { walk(sh.cssRules) } catch {} }
    const out = { missing: [], diff: [], same: [], noImportant: true }
    const mk = () => { const w = document.createElement('div'); w.style.cssText = 'position:absolute;inset-inline-start:0;inline-size:300px;block-size:60px;display:block'; document.body.appendChild(w); return w }
    const wA = mk(), wB = mk(), wC = mk()
    for (const c of classes) {
      if (!sel.has(c.class)) out.missing.push(c.class)
      const A = document.createElement('div'), B = document.createElement('div'), C = document.createElement('div')
      A.className = c.class; for (const [k, v] of Object.entries(c.decl)) B.style.setProperty(k, v)
      for (const e of [A, B, C]) e.textContent = 'x'
      wA.appendChild(A); wB.appendChild(B); wC.appendChild(C)
      const a = getComputedStyle(A), b = getComputedStyle(B), cc = getComputedStyle(C)
      let d = [], dist = false
      for (let i = 0; i < a.length; i++) { const k = a[i]; if (a.getPropertyValue(k) !== b.getPropertyValue(k)) d.push(k); if (a.getPropertyValue(k) !== cc.getPropertyValue(k)) dist = true }
      if (d.length) out.diff.push(c.class + ': ' + d.slice(0, 3).join(','))
      if (!dist) out.same.push(c.class)
      A.remove(); B.remove(); C.remove()
    }
    for (const w of [wA, wB, wC]) w.remove()
    return out
  }, JSONC.classes)
  ok(JSONC.classes.length === JSONC.count, E(`utilities.json trae ${JSONC.count} clases`), `${JSONC.classes.length}`)
  ok(res.missing.length === 0, E(`las ${JSONC.classes.length} clases tienen regla en la hoja cargada`), res.missing.slice(0, 8).join(' '))
  ok(res.diff.length === 0, E(`las ${JSONC.classes.length} clases dan, aplicadas, los mismos estilos computados que su declaración del JSON en línea`), res.diff.slice(0, 5).join(' | '))
  note(`${E('')}${JSONC.classes.length - res.same.length} de ${JSONC.classes.length} clases se distinguen de un nodo sin clase por estilo computado; el resto coincide con el valor inicial del div (${res.same.join(' ')}) y se cubre por la regla en la hoja`)
}

for (const eng of ENGINES) {
  setEngine(eng)
  const b = await pw[eng].launch()
  const E = (m) => `${eng} ${m}`
  const configs = [
    ['defecto claro', URL0, {}, { rtl: false, dark: false, theme: '' }],
    ['defecto oscuro', URL0, { dark: true }, { rtl: false, dark: true, theme: '' }],
    ['tema de prueba (space 5)', URL0, { theme: 'prueba' }, { rtl: false, dark: false, theme: 'prueba' }],
    ['tema del CLI (space 5, fontSize 14)', URL0, { css: T5 }, { rtl: false, dark: false, theme: 't5' }],
    ['RTL', URL0 + '?dir=rtl', {}, { rtl: true, dark: false, theme: '' }],
    ['utilities.css antes que grana.css', URL0 + '?utilfirst=1', {}, { rtl: false, dark: false, theme: '' }]
  ]
  for (const [lab, url, o, flags] of configs) {
    const p = await open(b, url, { ready: READY, dark: o.dark, theme: o.theme === 'prueba' ? 'prueba' : '' }); p.__eng = eng
    if (o.css) { await p.addStyleTag({ path: o.css }); await settle(p, 150); await p.evaluate(() => window.__ratio || 0) }
    await suite(p, (m) => E(`${lab}: ${m}`), flags)
    if (lab === 'defecto claro') await coverage(p, (m) => E(m ? `${m}` : ''))
    await close(p, lab)
  }
  // El esquema cambia el color: g-text-muted claro ≠ oscuro
  const pl = await open(b, URL0, { ready: READY }); const pd = await open(b, URL0, { ready: READY, dark: true })
  const cl = (await CS(pl, 'c-muted', 'color')).color, cd = (await CS(pd, 'c-muted', 'color')).color
  ok(cl !== cd, E('g-text-muted cambia con data-theme="dark"'), `${cl} → ${cd}`)
  await close(pl, 'claro'); await close(pd, 'oscuro')
  await b.close()
}
await stop()
const failed = report('utilidades')
process.exit(failed ? 1 : 0)
