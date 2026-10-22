// Verificación propia de coco · auditoría (paso 5) de GText sobre el COMPONENTE REAL (GText.vue en packages/vue/dist/grana.js,
// banco design/lab/text/auditoria-banco.html con plantillas compiladas en el navegador). Casos C1 a C8 de kiwi + E1 a E4 de coco,
// tema por defecto, rústico y lujo, claro y oscuro, space 5, forced-colors (Chromium), 390 y 320 px, avisos de desarrollo.
//   GRANA_PW_PORT=4219 node design/lab/text/auditoria-verificar.mjs [--engines=chromium] [--verbose]
// Requiere `npm run build` en packages/vue. Sustituye al prototipo de kiwi (r01) que usa estilo-verificar.mjs.
import { serve, stop, pw, ENGINES, ok, note, report, HELPERS, settle } from '../hero/auditoria-comun.mjs'
import { gzipSync } from 'node:zlib'
import { readFileSync } from 'node:fs'

const ORIGIN = (await serve()).replace(/\/packages\/vue\/playground\/$/, '')
const BANCO = `${ORIGIN}/design/lab/text/auditoria-banco.html`
const near = (a, b, t = 0.75) => Math.abs(a - b) <= t

async function open (b, qs = '', { vw = 1440, vh = 900, fc = false } = {}) {
  const ctx = await b.newContext({ viewport: { width: vw, height: vh }, forcedColors: fc ? 'active' : 'none' })
  const p = await ctx.newPage()
  const errs = []; const warns = []
  p.on('console', (m) => { const t = m.text(); if (m.type() === 'error' && !/favicon/.test(t)) errs.push(t.slice(0, 200)); if (m.type() === 'warning') (/\[Grana GText/.test(t) ? warns : errs).push(t.slice(0, 200)) })
  p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)))
  for (let i = 0; ; i++) {
    try { await p.goto(`${BANCO}${qs ? '?' + qs : ''}`, { waitUntil: 'domcontentloaded' }); await p.waitForFunction(() => window.__lab && window.__lab.ready, null, { timeout: 20000 }); break } catch (e) { if (i >= 2) throw e }
  }
  await p.evaluate(() => document.fonts.ready)
  await p.evaluate(HELPERS)
  await settle(p, 150)
  p.__errs = errs; p.__warns = warns
  return { p, close: () => ctx.close() }
}

const MEASURE = () => {
  const $ = (id) => document.getElementById(id); const R = (id) => $(id).getBoundingClientRect(); const cs = (id) => getComputedStyle($(id))
  const gap = (a, c) => Math.round((R(c).top - R(a).bottom) * 10) / 10
  const px = (n) => { const d = document.createElement('div'); d.style.fontSize = `var(--g-text-${n}-size)`; document.body.append(d); const v = parseFloat(getComputedStyle(d).fontSize); d.remove(); return v }
  const space = (() => { const d = document.createElement('div'); d.style.inlineSize = 'var(--g-space-1)'; document.body.append(d); const v = d.getBoundingClientRect().width; d.remove(); return v })()
  const weightTok = (n) => { const d = document.createElement('div'); d.style.fontWeight = `var(${n})`; document.body.append(d); const v = getComputedStyle(d).fontWeight; d.remove(); return v }
  const contrast = (id) => window.__c.text($(id))
  const lines = (el) => { const rg = document.createRange(); const ws = []; const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n; while ((n = tw.nextNode())) { const re = /\S+/g; let m; while ((m = re.exec(n.textContent))) { rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length); ws.push(Math.round(rg.getBoundingClientRect().top)) } } const t = [...new Set(ws)]; return { lines: t.length, last: ws.filter((x) => x === t[t.length - 1]).length } }
  const ch66 = (() => { const s = document.createElement('span'); s.style.cssText = 'position:absolute;visibility:hidden;inline-size:66ch'; $('c7plain').append(s); const w = s.getBoundingClientRect().width; s.remove(); return w })()
  const box8 = $('c8').parentElement
  let hit = null; for (let w = 200; w <= 420 && !hit; w += 2) { box8.style.inlineSize = w + 'px'; const ref = lines($('c8ref')); if (ref.last === 1 && ref.lines > 1) hit = { w, ref, pretty: lines($('c8')) } } box8.style.inlineSize = '300px'
  const kids = (id) => [...$(id).children]
  const e1n = $('e1brand')
  return {
    S: { body: px('body'), sm: px('body-sm'), cap: px('caption'), space }, wBody: weightTok('--g-text-body-weight'), wTitle: weightTok('--g-text-title-sm-weight'),
    tags: { c1: $('c1').tagName, c1q: $('c1q').tagName, c1c: $('c1c').tagName, c2: $('c2').tagName, c4a: $('c4a').tagName },
    cls: { c1q: $('c1q').className, c1c: $('c1c').className },
    attrs: { lang: $('c1q').lang, rtl: $('c5r').dir, ariaFig: $('c1').getAttribute('class') },
    c1: { root: cs('c1').margin, p: gap('c1p1', 'c1p2'), qc: gap('c1q', 'c1c'), qLeft: R('c1q').left - R('c1').left, qMargin: cs('c1q').marginLeft + ' ' + cs('c1q').marginRight + ' ' + cs('c1q').marginTop, cite: cs('c1cite').fontStyle, capFs: parseFloat(cs('c1c').fontSize), qFs: parseFloat(cs('c1p1').fontSize), top: R('c1q').top - R('c1').top, bottom: R('c1').bottom - R('c1c').bottom, qColor: cs('c1q').color, capColor: cs('c1c').color, textColor: getComputedStyle(document.documentElement).getPropertyValue('--g-color-text'), capW: cs('c1c').fontWeight },
    c2: { a: gap('c2a', 'c2s'), b: gap('c2s', 'c2b'), style: cs('c2').fontStyle, pStyle: cs('c2a').fontStyle, fs: parseFloat(cs('c2a').fontSize), aTop: R('c2a').top - R('c2').top, bBottom: R('c2').bottom - R('c2b').bottom },
    c3: { small: parseFloat(cs('c3s').fontSize), em: cs('c3e').fontStyle, cite: cs('c3c').fontStyle, aDeco: cs('c3a').textDecorationLine, aColor: cs('c3a').color, text: cs('c3').color, weight: cs('c3').fontWeight, strong: cs('c3st').fontWeight, b: cs('c3b').fontWeight, code: cs('c3code').fontFamily, own: cs('c3').fontFamily },
    c4: { ab: gap('c4a', 'c4b'), bc: gap('c4b', 'c4c'), empty: [!!$('c4empty'), !!$('c4empty2')], rowGap: parseFloat(cs('c4').rowGap), kids: kids('c4').length, m: cs('c4a').margin },
    c5: { top: R('c5p').top - R('c5').top, pu: gap('c5p', 'c5u'), uz: gap('c5u', 'c5z'), pad: parseFloat(cs('c5u').paddingInlineStart), uLeft: R('c5u').left - R('c5').left, rtlR: parseFloat(cs('c5ru').paddingRight), rtlL: parseFloat(cs('c5ru').paddingLeft), bottom: R('c5').bottom - R('c5z').bottom },
    c6: { muted: contrast('c6'), def: contrast('c6d'), mutedS: contrast('c6sm'), defS: contrast('c6sd'), zone: $('c6z').dataset.gZone, tone: cs('c6').color },
    c7: { col: R('c7').width, plain: R('c7plain').width, gt: R('c7gt').width, div: R('c7dp').width, util: R('c7util').width, utilMb: parseFloat(cs('c7util').marginBottom), ch66 },
    c8: hit || { w: null },
    e1: { m: ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'].map((k) => parseFloat(getComputedStyle(e1n)[k])), style: getComputedStyle(e1n).fontStyle, fs: parseFloat(getComputedStyle(e1n).fontSize), w: getComputedStyle(e1n).fontWeight, gap: gap('e1brand', 'e1next'), rowGap: parseFloat(cs('e1').rowGap), contrast: contrast('e1brand') },
    e2: { t: R('e2t').top - $('e2in').querySelector('.g-section__title').getBoundingClientRect().bottom, m: cs('e2t').margin, p: gap('e2p1', 'e2p2'), first: cs('e2p1').marginTop, last: cs('e2p2').marginBottom },
    e4: { a: gap('e4a', 'e4b'), b: gap('e4b', 'e4c') },
    scrollW: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
  }
}

async function casos (b, eng) {
  for (const tema of ['defecto', 'rustico', 'lujo']) {
    for (const dark of [false, true]) {
      for (const sp5 of (tema === 'defecto' && !dark ? [false, true] : [false])) {
        const id = `${eng} · ${tema}${dark ? ' · oscuro' : ''}${sp5 ? ' · space 5' : ''}`
        const { p, close } = await open(b, [tema !== 'defecto' ? `tema=${tema}` : '', dark ? 'dark=1' : '', sp5 ? 'space5=1' : ''].filter(Boolean).join('&'))
        const m = await p.evaluate(MEASURE)
        const r = m.S.space
        ok(m.tags.c1 === 'FIGURE' && m.tags.c1q === 'BLOCKQUOTE' && m.tags.c1c === 'FIGCAPTION' && m.tags.c2 === 'ADDRESS' && m.tags.c4a === 'P', `${id}: etiqueta por as`, JSON.stringify(m.tags))
        ok(m.cls.c1q === 'g-text g-text--size-body g-text--tone-default' && m.cls.c1c === 'g-text g-text--size-caption g-text--tone-muted', `${id}: clases por prop`, `${m.cls.c1q} | ${m.cls.c1c}`)
        ok(m.attrs.lang === 'es' && m.attrs.rtl === 'rtl', `${id}: lang y dir por $attrs`)
        // C1
        ok(m.c1.root === '0px', `${id}: C1 la raíz sin margen`, m.c1.root)
        ok(near(m.c1.p, r * 3), `${id}: C1 párrafos de la cita a space × 3`, m.c1.p)
        ok(near(m.c1.qc, r * 2.5), `${id}: C1 cita → pie con el ritmo de la figura (space × 2,5)`, m.c1.qc)
        ok(near(m.c1.qLeft, 0) && m.c1.qMargin === '0px 0px 0px', `${id}: C1 la cita sin sangría ni margen`, `${m.c1.qLeft} ${m.c1.qMargin}`)
        ok(near(m.c1.top, 0) && near(m.c1.bottom, 0), `${id}: C1 nada antes del primero ni tras el último`, `${m.c1.top}/${m.c1.bottom}`)
        ok(m.c1.cite === 'normal', `${id}: C1 cite sin cursiva`)
        ok(near(m.c1.capFs, m.S.cap, 0.3) && near(m.c1.qFs, m.S.body, 0.3), `${id}: C1 cada GText con su rol`, `${m.c1.capFs}/${m.c1.qFs}`)
        ok(m.c1.capW === m.wBody, `${id}: C1 el pie caption con el peso de texto del tema (no el de rótulo)`, `${m.c1.capW} vs ${m.wBody}`)
        // C2
        ok(near(m.c2.a, r * 2.5) && near(m.c2.b, r * 2.5), `${id}: C2 componente dentro: 10 y 10`, `${m.c2.a}/${m.c2.b}`)
        ok(m.c2.style === 'normal' && m.c2.pStyle === 'normal', `${id}: C2 address sin cursiva`)
        ok(near(m.c2.fs, m.S.sm, 0.3), `${id}: C2 líneas en body-sm`)
        ok(near(m.c2.aTop, 0) && near(m.c2.bBottom, 0), `${id}: C2 nada antes ni tras`)
        // C3
        ok(near(m.c3.small, m.S.cap, 0.3) && m.c3.small >= 12, `${id}: C3 small no baja de 12 px`, m.c3.small)
        ok(m.c3.em === 'italic' && m.c3.cite === 'normal', `${id}: C3 em cursiva, cite normal`)
        ok(/underline/.test(m.c3.aDeco) && m.c3.aColor !== m.c3.text, `${id}: C3 el enlace subrayado y con su color (1.4.1)`)
        ok(m.c3.weight === m.wBody, `${id}: C3 caption con peso de texto`, m.c3.weight)
        ok(m.c3.strong === m.wTitle && m.c3.b === m.wTitle && m.wTitle !== m.wBody, `${id}: E3 strong y b con --g-text-title-sm-weight`, `${m.c3.strong}/${m.c3.b} vs ${m.wTitle} (texto ${m.wBody})`)
        ok(m.c3.code !== m.c3.own, `${id}: E3 code conserva su familia (no se toca)`)
        // C4
        ok(near(m.c4.ab, m.c4.rowGap) && near(m.c4.bc, m.c4.rowGap), `${id}: C4 solo el gap de la pila, vacías sin nodo`, `${m.c4.ab}/${m.c4.bc} vs ${m.c4.rowGap}`)
        ok(m.c4.empty.every((x) => !x) && m.c4.kids === 3, `${id}: C4 la GText vacía (sin slot y con comentario y blancos) no deja elemento`, `${m.c4.kids} hijos`)
        ok(m.c4.m === '0px', `${id}: C4 raíz suelta en pila a 0`)
        // C5
        ok(near(m.c5.top, 0), `${id}: C5 un primer hijo oculto no cuenta`, m.c5.top)
        ok(near(m.c5.pu, r * 3) && near(m.c5.uz, r * 3), `${id}: C5 lista con el ritmo de los párrafos`, `${m.c5.pu}/${m.c5.uz}`)
        ok(near(m.c5.uLeft, 0) && near(m.c5.pad, r * 6), `${id}: C5 sangría space × 6 dentro de la caja`, `${m.c5.uLeft}/${m.c5.pad}`)
        ok(near(m.c5.rtlR, r * 6) && near(m.c5.rtlL, 0), `${id}: C5 RTL: sangría a la derecha`, `${m.c5.rtlR}/${m.c5.rtlL}`)
        ok(near(m.c5.bottom, 0), `${id}: C5 nada tras el último`, m.c5.bottom)
        // C6 contraste
        ok(m.c6.zone === 'brand', `${id}: C6 la zona de marca montada`)
        for (const k of ['muted', 'def', 'mutedS', 'defS']) ok(m.c6[k] >= 4.5, `${id}: C6 contraste ${k} ≥ 4,5:1`, m.c6[k])
        // C7
        ok(near(m.c7.gt, m.c7.plain, 2) && near(m.c7.div, m.c7.plain, 2) && near(m.c7.plain, m.c7.ch66, 2) && m.c7.plain < m.c7.col - 20, `${id}: C7 GText (raíz y as=div) dentro de prose mide 66ch como la prosa`, `gt ${Math.round(m.c7.gt)} div ${Math.round(m.c7.div)} plain ${Math.round(m.c7.plain)} 66ch ${Math.round(m.c7.ch66)} col ${Math.round(m.c7.col)}`)
        ok(m.c7.util > m.c7.plain + 20 && m.c7.utilMb > 10, `${id}: C7 límite aceptado: utilidad en un p interno sale de prose (X-L3)`, `${Math.round(m.c7.util)}/${m.c7.utilMb}`)
        // C8
        if (!sp5 && !dark && tema === 'defecto') {
          if (m.c8.w) note(`${id}: C8 text-wrap a ${m.c8.w} px · sin GText ${m.c8.ref.lines} líneas/${m.c8.ref.last} palabra(s) en la última; con GText ${m.c8.pretty.lines}/${m.c8.pretty.last}`)
          else note(`${id}: C8 ningún ancho de 200 a 420 deja una viuda con el ajuste normal`)
          if (m.c8.w && eng !== 'firefox') ok(m.c8.pretty.last >= 2, `${id}: C8 pretty evita la palabra sola en la última línea`, m.c8.pretty.last)
        }
        // E1, E2, E4
        ok(m.e1.m.every((x) => near(x, 0)) && m.e1.style === 'normal' && near(m.e1.fs, m.S.body, 0.3) && m.e1.w === m.wBody, `${id}: E1 marca del pie sin enlace: margen 0, sin cursiva, body, peso de texto`, JSON.stringify(m.e1))
        ok(near(m.e1.gap, m.e1.rowGap) && m.e1.contrast >= 4.5, `${id}: E1 solo el gap de la pila y ≥ 4,5:1`, `${m.e1.gap} vs ${m.e1.rowGap}, ${m.e1.contrast}`)
        ok(m.e2.m === '0px' && near(m.e2.p, r * 3) && m.e2.first === '0px' && m.e2.last === '0px', `${id}: E2 FAQ 02 anidada: GText sin margen, respuestas a space × 3`, JSON.stringify(m.e2))
        ok(near(m.e4.a, r * 3) && near(m.e4.b, r * 3), `${id}: E4 un botón dentro: ritmo a los dos lados lo da el p, el componente no se toca`, `${m.e4.a}/${m.e4.b}`)
        ok(!m.scrollW, `${id}: sin desplazamiento horizontal a 1440`)
        ok(!p.__errs.length && !p.__warns.length, `${id}: consola limpia (sin avisos con props válidas)`, p.__errs.concat(p.__warns).join(' | '))
        await close()
      }
    }
  }
  // 390 y 320
  for (const [w, h] of [[390, 844], [320, 640]]) {
    const { p, close } = await open(b, '', { vw: w, vh: h })
    const m = await p.evaluate(MEASURE)
    ok(!m.scrollW, `${eng} · reflujo a ${w}: sin desplazamiento horizontal`)
    await close()
  }
  // Avisos de desarrollo: props inválidas -> un aviso por prop y valor, una vez; se pinta con los defaults
  {
    const { p, close } = await open(b, 'invalid=1')
    const cls = await p.evaluate(() => { const e = document.getElementById('e3'); return [e.tagName, e.className] })
    ok(cls[0] === 'P' && cls[1].includes('g-text--size-body ') && cls[1].includes('g-text--tone-default'), `${eng} · avisos: as/size/tone fuera de lista caen a p, body, default`, cls.join(' '))
    ok(p.__warns.length === 3 && new Set(p.__warns).size === 3, `${eng} · avisos: uno por prop inválida, sin repetirse`, `${p.__warns.length}`)
    await close()
  }
  // forced-colors (solo donde el motor lo emula)
  if (eng === 'chromium') {
    const { p, close } = await open(b, '', { fc: true })
    const m = await p.evaluate(() => { const g = (id) => getComputedStyle(document.getElementById(id)); return { fc: matchMedia('(forced-colors: active)').matches, def: g('c1p1').color, muted: g('c1c').color, bg: g('c1').backgroundColor, bd: g('c1q').borderTopWidth, ol: g('c1q').outlineStyle, c: window.__c.text(document.getElementById('c1c')), c2: window.__c.text(document.getElementById('c1p1')) } })
    ok(m.fc, 'chromium · forced-colors emulado')
    ok(m.def === m.muted, 'chromium · forced-colors: default y muted toman el mismo color del sistema', `${m.def} vs ${m.muted}`)
    ok(m.bd === '0px' && m.ol === 'none', 'chromium · forced-colors: no pinta borde ni contorno propio')
    ok(m.c >= 4.5 && m.c2 >= 4.5, 'chromium · forced-colors: texto legible (≥ 4,5:1)', `${m.c}/${m.c2}`)
    await close()
  }
}

// Peso del CSS: GText.css + su parte en prose, gzip -9
const css = readFileSync(new URL('../../../packages/vue/src/components/GText/GText.css', import.meta.url), 'utf8')
const bare = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ')
note(`peso de GText.css: ${css.length} B en bruto, ${bare.length} B minificado a mano, ${gzipSync(bare, { level: 9 }).length} B gzip -9 (ámbitos y selectores incluidos)`)

for (const eng of ENGINES) {
  const b = await pw[eng].launch()
  try { await casos(b, eng) } finally { await b.close() }
}
stop()
report('Auditoría de GText (componente real)')
