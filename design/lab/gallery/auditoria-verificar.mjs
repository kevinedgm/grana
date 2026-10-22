// Auditoría de coco (paso 5) de GGallery y GGalleryViewer sobre el COMPONENTE REAL (dist/gallery.umd.js,
// packages/vue/playground/gallery.html; el visor es el GDialog real con fullscreen + bare). Mide en Chromium, Firefox y
// WebKit: estático (GGallery.css, enmienda bare de GDialog.css; .vue sin <style>); galería con espacios, plana y tira a
// 1280, 390, 320 y 320×256 en LTR y RTL (sin desplazamiento horizontal, índice y pies ≥ 4,5:1, borde del índice ≥ 3:1,
// portada 2 × 2 cuadrada, anillo de la diapositiva del borde sin recortar); el visor con zona y sin ella en nueve temas,
// claro y oscuro (fondo opaco; título, contador, pie, hilo e iconos ≥ 4,5:1; trazo del actual ≥ 3:1; anillo de foco ≥ 3:1
// contra el fondo del visor); geometría del visor a 1280×800, 390×844 y 320×256 en LTR y RTL (ningún control encima de la
// foto pintada, bare sin relleno); el zoom ×2 con foto vertical y apaisada (caja exacta ×2, recorrido sin franjas vacías,
// Esc escalonado); la llegada desde el lado del gesto (space × 6, espejada en RTL; reducido sin desplazamiento y fundido
// fast); puntero grueso (44 px); forced-colors (Chromium); consola limpia.
// Ejecutar desde la raíz con dist/ reconstruido:  node design/lab/gallery/auditoria-verificar.mjs   (puerto 4244)
import { pw, ENGINES, ok, note, report, serve, stop, opener, overflowX, rect, inter, settle, staticCheck } from '../hero/auditoria-comun.mjs'

await staticCheck('packages/vue/src/components/GGallery/GGallery.css', ['packages/vue/src/components/GGallery/GGallery.vue', 'packages/vue/src/components/GGallery/GGalleryViewer.vue', 'packages/vue/src/components/GDialog/GDialog.vue'])
await staticCheck('packages/vue/src/components/GDialog/GDialog.css')
const BASE = await serve()
const TEMAS = ['defecto', 'terracota', 'anil', 'palida', 'stripe', 'github', 'spotify', 'caracol-purpura', 'lustre']

const openViewer = async (p, index = 0) => {
  await p.evaluate((i) => { window.galState.index.value = i; window.galState.open.value = true }, index)
  await p.waitForSelector('.g-gallery-viewer[open] .g-gallery-viewer__img')
  await p.evaluate(() => new Promise((r) => { const i = document.querySelector('.g-gallery-viewer__img'); if (i.complete) r(); else i.onload = r }))
  await settle(p, 350)
}
// Caja pintada de la foto (object-fit: contain dentro de la caja de contenido)
const painted = (p) => p.evaluate(() => {
  const i = document.querySelector('.g-gallery-viewer__img'); const r = i.getBoundingClientRect(); const cs = getComputedStyle(i)
  const pl = parseFloat(cs.paddingLeft), pr = parseFloat(cs.paddingRight), pt = parseFloat(cs.paddingTop), pb = parseFloat(cs.paddingBottom)
  const cw = r.width - pl - pr, ch = r.height - pt - pb
  const k = Math.min(cw / i.naturalWidth, ch / i.naturalHeight); const w = i.naturalWidth * k, h = i.naturalHeight * k
  const l = r.left + pl + (cw - w) / 2, t = r.top + pt + (ch - h) / 2
  return { l, t, r: l + w, b: t + h, w, h }
})

for (const eng of ENGINES) {
  const b = await pw[eng].launch()
  const open = await opener(b, BASE, eng)
  const E = (m) => `${eng} ${m}`
  const TAB = eng === 'webkit' ? 'Alt+Tab' : 'Tab'
  const close = async (p, label) => { ok(p.__errs.length === 0, E(`consola limpia (${label})`), p.__errs.slice(0, 2).join(' | ')); await p.__ctx.close() }

  /* 1 · Galería: geometría y contraste (espacios, plana, tira) */
  for (const c of ['grid', 'grid&flat=1', 'strip']) for (const dir of ['', 'dir=rtl']) for (const [vw, vh] of [[1280, 900], [390, 844], [320, 640], [320, 256]]) {
    const p = await open(`gallery.html?c=${c}`, { vw, vh, qs: dir })
    const L = `${c} ${dir || 'ltr'} ${vw}×${vh}`
    ok(!(await overflowX(p)), E(`${L}: sin desplazamiento horizontal`))
    const m = await p.evaluate(() => {
      const all = (s, f) => [...document.querySelectorAll(s)].map(f)
      return {
        idx: all('.g-gallery__index-link', (e) => window.__c.text(e)),
        cnt: all('.g-gallery__index-link > [aria-hidden="true"]', (e) => window.__c.text(e)),
        bor: all('.g-gallery__index-link', (e) => window.__c.line(e, 'borderTopColor')),
        hIdx: all('.g-gallery__index-link', (e) => e.getBoundingClientRect().height),
        cap: all('.g-gallery__caption', (e) => window.__c.text(e)),
        total: all('.g-gallery__total, .g-gallery__strip-count', (e) => window.__c.text(e)),
        cover: (() => { const f = document.querySelector('.g-gallery__group .g-gallery__item:first-child .g-gallery__img'); if (!f) return null; const r = f.getBoundingClientRect(); const n = document.querySelectorAll('.g-gallery__group:first-of-type .g-gallery__item').length; return { w: r.width, h: r.height, n } })()
      }
    })
    const min = (a) => (a.length ? Math.min(...a) : 99)
    ok(min(m.idx) >= 4.5 && min(m.cnt) >= 4.5 && min(m.cap) >= 4.5 && min(m.total) >= 4.5, E(`${L}: índice, cifra, pies y recuento ≥ 4,5:1`), [min(m.idx), min(m.cnt), min(m.cap), min(m.total)].join(' '))
    ok(min(m.bor) >= 3, E(`${L}: borde del índice ≥ 3:1`), min(m.bor))
    ok(min(m.hIdx) >= 24, E(`${L}: índice ≥ 24 px`), min(m.hIdx))
    if (m.cover && m.cover.n >= 4) ok(Math.abs(m.cover.w - m.cover.h) < 1, E(`${L}: portada de 4+ fotos cuadrada`), `${m.cover.w.toFixed(1)}×${m.cover.h.toFixed(1)}`)
    if (c === 'strip') {
      // La diapositiva del borde, enfocada: su anillo cabe en el desplazable (relleno del anillo)
      await p.locator('.g-gallery__strip .g-gallery__thumb').first().focus()
      await p.keyboard.press(`Shift+${TAB}`); await p.keyboard.press(TAB)
      const f = await p.evaluate(() => {
        const a = document.activeElement; const s = document.querySelector('.g-gallery__strip'); if (!a || !s.contains(a)) return { none: true }
        const cs = getComputedStyle(a); const r = a.getBoundingClientRect(); const sr = s.getBoundingClientRect()
        const ring = parseFloat(cs.outlineOffset) + parseFloat(cs.outlineWidth)
        return { fv: a.matches(':focus-visible'), w: parseFloat(cs.outlineWidth), inside: r.left - ring >= sr.left - 0.5 && r.right + ring <= sr.right + 0.5 || r.right + ring > sr.right, top: r.top - ring >= sr.top - 0.5 }
      })
      ok(!f.none && f.fv && f.w >= 2 && f.top, E(`${L}: foco de la diapositiva visible y sin recortar arriba`), JSON.stringify(f))
    }
    await close(p, L)
  }

  /* 2 · Visor: contraste en nueve temas, claro y oscuro, con zona y sin ella */
  let minV = Infinity
  for (const theme of TEMAS) for (const dark of [false, true]) for (const zone of ['brand', 'none']) {
    if (eng !== 'chromium' && !['defecto', 'anil', 'spotify'].includes(theme)) continue
    const p = await open(`gallery.html${zone === 'none' ? '?zone=none' : ''}`, { theme, dark })
    await openViewer(p, 1)
    const m = await p.evaluate(() => {
      const v = document.querySelector('.g-gallery-viewer'); const bg = window.__c.rgba(getComputedStyle(v).backgroundColor)
      const T = (s) => { const e = v.querySelector(s); return e ? window.__c.ratio(window.__c.over(window.__c.rgba(getComputedStyle(e).color), bg), bg) : 99 }
      const items = [...v.querySelectorAll('.g-gallery-viewer__thread-item')]
      const cur = v.querySelector('.g-gallery-viewer__thread-item[aria-current="true"]')
      const icons = [...v.querySelectorAll('.g-gallery-viewer__bar .g-btn, .g-gallery-viewer__nav .g-btn:not([aria-disabled="true"])')].map((x) => window.__c.ratio(window.__c.over(window.__c.rgba(getComputedStyle(x).color), bg), bg))
      const navBorder = [...v.querySelectorAll('.g-gallery-viewer__nav .g-btn:not([aria-disabled="true"])')].map((x) => window.__c.ratio(window.__c.over(window.__c.rgba(getComputedStyle(x).borderTopColor), bg), bg))
      const fd = document.createElement('i'); fd.style.color = 'var(--g-color-focus)'; v.querySelector('.g-dialog__body').append(fd); const focus = window.__c.ratio(window.__c.rgba(getComputedStyle(fd).color), bg); fd.remove()
      return { alpha: bg[3], title: T('.g-gallery-viewer__title'), count: T('.g-gallery-viewer__count'), caption: T('.g-gallery-viewer__caption'), thread: Math.min(...items.map((e) => window.__c.ratio(window.__c.over(window.__c.rgba(getComputedStyle(e).color), bg), bg))), curBorder: cur ? window.__c.ratio(window.__c.over(window.__c.rgba(getComputedStyle(cur).borderTopColor), bg), bg) : 99, icons: Math.min(...icons), navBorder: Math.min(...navBorder), focus, zone: v.getAttribute('data-g-zone') }
    })
    const L = `visor ${theme} ${dark ? 'oscuro' : 'claro'} zona ${zone}`
    ok(m.alpha === 1, E(`${L}: fondo opaco`))
    ok(zone === 'none' ? m.zone === null : m.zone === 'brand', E(`${L}: data-g-zone`))
    for (const k of ['title', 'count', 'caption', 'thread', 'icons']) { ok(m[k] >= 4.5, E(`${L}: ${k} ≥ 4,5:1`), m[k]); minV = Math.min(minV, m[k]) }
    ok(m.curBorder >= 3 && m.navBorder >= 3, E(`${L}: trazo del espacio actual y borde de la navegación ≥ 3:1`), `${m.curBorder} ${m.navBorder}`)
    ok(m.focus >= 3, E(`${L}: anillo de foco ≥ 3:1 contra el fondo del visor`), m.focus)
    await close(p, L)
  }
  note(`${eng}: visor, texto e iconos mínimo ${minV}:1`)

  /* 3 · Visor: geometría (ningún control encima de la foto pintada; bare sin relleno), LTR y RTL */
  for (const dir of ['', 'dir=rtl']) for (const [vw, vh] of [[1280, 800], [390, 844], [320, 256]]) for (const idx of [0, 4]) {
    const p = await open('gallery.html', { vw, vh, qs: dir })
    await openViewer(p, idx)
    const ph = await painted(p)
    const g = await p.evaluate(() => {
      const v = document.querySelector('.g-gallery-viewer'); const R = (e) => { const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom } }
      const ctl = [...v.querySelectorAll('button, .g-gallery-viewer__caption, .g-gallery-viewer__title, .g-gallery-viewer__count')].filter((e) => e.getClientRects().length).map(R)
      const vr = v.getBoundingClientRect()
      return { ctl, pad: getComputedStyle(v).padding, body: getComputedStyle(v.querySelector('.g-dialog__body')).padding, full: Math.abs(vr.width - innerWidth) < 1 && Math.abs(vr.height - innerHeight) < 1, scrollLock: document.documentElement.scrollHeight }
    })
    const L = `visor ${dir || 'ltr'} ${vw}×${vh} foto ${idx}`
    ok(g.ctl.every((c) => !inter(c, ph)), E(`${L}: ningún control encima de la foto`), JSON.stringify(ph))
    ok(g.pad === '0px' && g.body === '0px' && g.full, E(`${L}: bare sin relleno y a pantalla completa`), `${g.pad} ${g.body} ${g.full}`)
    ok(ph.w > 0 && ph.h > 0, E(`${L}: la foto se ve`), `${ph.w.toFixed(0)}×${ph.h.toFixed(0)}`)
    if (vw === 320 && vh === 256) note(`${eng} ${L}: foto pintada ${ph.w.toFixed(0)}×${ph.h.toFixed(0)}`)
    await close(p, L)
  }

  /* 4 · Zoom ×2: caja exacta, recorrido sin franjas vacías, Esc escalonado (vertical y apaisada, ancho y estrecho) */
  for (const [vw, vh] of [[1280, 800], [390, 844]]) for (const idx of [0, 4]) for (const dir of ['', 'dir=rtl']) {
    const p = await open('gallery.html', { vw, vh, qs: dir })
    await openViewer(p, idx)
    const before = await painted(p)
    await p.locator('.g-gallery-viewer__zoom').click()
    await settle(p, 200)
    const z = await p.evaluate(() => {
      const s = document.querySelector('.g-gallery-viewer__stage'); const i = s.querySelector('img'); const r = i.getBoundingClientRect()
      return { w: r.width, h: r.height, sw: s.scrollWidth, sh: s.scrollHeight, cw: s.clientWidth, ch: s.clientHeight, sl: s.scrollLeft, st: s.scrollTop, zoomed: s.classList.contains('is-zoomed') }
    })
    const L = `zoom ${vw}×${vh} foto ${idx} ${dir || 'ltr'}`
    // ×2 exacto de lo que se veía (G-A1 y G-A3 cerrados: el relleno de reposo de la img se lee una vez y se conserva)
    const k = z.w / before.w
    ok(z.zoomed && Math.abs(k - 2) <= 0.005 && Math.abs(z.w / z.h - before.w / before.h) < 0.01, E(`${L}: la foto ampliada es ×2,000 exacto y conserva la proporción`), `${before.w.toFixed(0)}×${before.h.toFixed(0)} → ${z.w.toFixed(0)}×${z.h.toFixed(0)}`)
    if (dir === '') note(`${eng} ${L}: ampliación real ×${k.toFixed(3)} de la foto pintada (G-A1)`)
    ok(Math.abs(z.sw - Math.max(z.w, z.cw)) <= 2 && Math.abs(z.sh - Math.max(z.h, z.ch)) <= 2, E(`${L}: recorrido = foto (sin franjas vacías recorribles)`), JSON.stringify(z))
    // Punto del zoom centrado (fx = fy = 0,5 con el botón)
    if (z.sh > z.ch + 2) {
      ok(Math.abs(z.st - (z.sh - z.ch) / 2) <= 1, E(`${L}: ampliada desde el centro (vertical): scrollTop = (scrollHeight − clientHeight)/2`), `${z.st}/${z.sh - z.ch}`)
      if (dir === '') note(`${eng} ${L}: scrollTop ${z.st} · (scrollHeight − clientHeight)/2 = ${(z.sh - z.ch) / 2}`)
    }
    await p.keyboard.press('Escape'); await settle(p, 100)
    const s1 = await p.evaluate(() => ({ open: document.querySelector('.g-gallery-viewer').open, zoomed: document.querySelector('.g-gallery-viewer__stage').classList.contains('is-zoomed') }))
    ok(s1.open && !s1.zoomed, E(`${L}: la primera Esc solo reduce`), JSON.stringify(s1))
    await p.keyboard.press('Escape'); await settle(p, 500)
    ok(!(await p.evaluate(() => document.querySelector('.g-gallery-viewer').open)), E(`${L}: la segunda Esc cierra`))
    await close(p, L)
  }

  /* 5 · Llegada: space × 6 desde el lado del gesto (espejada en RTL); reducido sin desplazamiento y fundido fast */
  for (const dir of ['', 'dir=rtl']) for (const rm of [false, true]) {
    const p = await open('gallery.html', { qs: dir, rm })
    await openViewer(p, 1)
    const r = await p.evaluate(async (rtl) => {
      const st = document.querySelector('.g-gallery-viewer__stage')
      const samples = []
      const mo = new MutationObserver(() => { const i = st.querySelector('img'); if (i.classList.contains('is-arriving')) samples.push({ tr: getComputedStyle(i).translate, op: getComputedStyle(i).opacity, dir: i.dataset.direction }) })
      mo.observe(st, { subtree: true, attributes: true, attributeFilter: ['class'] })
      st.closest('dialog').dispatchEvent(new KeyboardEvent('keydown', { key: rtl ? 'ArrowLeft' : 'ArrowRight', bubbles: true }))
      await new Promise((r) => setTimeout(r, 400)); mo.disconnect()
      const i = st.querySelector('img'); const cs = getComputedStyle(i)
      const d = document.createElement('div'); d.style.inlineSize = 'calc(var(--g-space-1) * 6)'; document.body.append(d); const six = d.getBoundingClientRect().width; d.remove()
      return { first: samples[0], end: { tr: cs.translate, op: cs.opacity, td: cs.transitionDuration, tp: cs.transitionProperty }, six, idx: window.galState.index.value }
    }, Boolean(dir))
    const L = `llegada ${dir || 'ltr'} ${rm ? 'reducido' : ''}`
    ok(r.idx === 2 && r.first && r.first.op === '0' && r.first.dir === 'next', E(`${L}: parte transparente con data-direction=next`), JSON.stringify(r.first))
    const x = r.first ? parseFloat(r.first.tr) || 0 : NaN
    if (!rm) ok(Math.abs(x - (dir ? -r.six : r.six)) < 0.5, E(`${L}: parte desde space × 6 del lado del gesto (espejado en RTL)`), `${x} vs ${dir ? -r.six : r.six}`)
    else ok(x === 0 || r.first.tr === 'none', E(`${L}: reducido sin desplazamiento`), r.first && r.first.tr)
    ok((r.end.tr === 'none' || parseFloat(r.end.tr) === 0) && r.end.op === '1', E(`${L}: llega a su sitio y opaca`), JSON.stringify(r.end))
    if (rm) ok(r.end.tp === 'opacity', E(`${L}: reducido solo funde`), r.end.tp)
    await close(p, L)
  }

  /* 6 · Puntero grueso: controles del visor e hilo ≥ 44 px; fino ≥ 24 px */
  for (const coarse of [false, true]) {
    const p = await open('gallery.html', { coarse, vw: 390, vh: 844 })
    await openViewer(p, 0)
    const s = await p.evaluate(() => Math.min(...[...document.querySelectorAll('.g-gallery-viewer button')].map((e) => Math.min(e.getBoundingClientRect().height, e.getBoundingClientRect().width))))
    ok(s >= (coarse ? 44 : 24), E(`${coarse ? 'grueso' : 'fino'}: controles del visor ≥ ${coarse ? 44 : 24} px`), s)
    await close(p, `puntero ${coarse}`)
  }

  /* 7 · forced-colors (Chromium): miniatura con borde real, visor con contorno, espacio actual en Highlight */
  if (eng === 'chromium') {
    const p = await open('gallery.html', { fc: true })
    const g = await p.evaluate(() => { const cs = getComputedStyle(document.querySelector('.g-gallery__thumb'), '::after'); return [parseFloat(cs.borderTopWidth), cs.borderTopStyle] })
    ok(g[0] >= 1 && g[1] === 'solid', E('forced-colors: borde real de la miniatura'), g.join(' '))
    await openViewer(p, 0)
    const v = await p.evaluate(() => {
      const d = document.querySelector('.g-gallery-viewer'); const sys = (n) => { const i = document.createElement('i'); i.style.color = n; d.querySelector('.g-dialog__body').append(i); const c = getComputedStyle(i).color; i.remove(); return c }
      const cur = d.querySelector('[aria-current="true"]')
      return { outline: parseFloat(getComputedStyle(d).outlineWidth), cur: getComputedStyle(cur).borderTopColor === sys('Highlight') }
    })
    ok(v.outline >= 1 && v.cur, E('forced-colors: visor con contorno y espacio actual en Highlight'), JSON.stringify(v))
    await close(p, 'forced')
  }
  await b.close()
}
stop()
report('GGallery')
