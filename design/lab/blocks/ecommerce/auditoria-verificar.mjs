// Verificación propia de coco · auditoría (paso 5, flujo reducido #766) de @grana/blocks/ecommerce (lote 4, doce secciones,
// 36 variantes). Sobre los bloques REALES (packages/blocks/dist/ecommerce.js + packages/vue/dist) en el banco de bruno
// (packages/blocks/playground/ecommerce/*.html), con el tema por defecto y los dos del CLI (rústico y lujo,
// ../marketing/temas), claro y oscuro, en Chromium, Firefox y WebKit. Común (servidor, colores y contraste) en
// ../../hero/auditoria-comun.mjs; el modelo es ../booking/auditoria-verificar.mjs.
//   GRANA_PW_PORT=4216 node design/lab/blocks/ecommerce/auditoria-verificar.mjs [--engines=chromium] [--verbose]
//     [--solo=structure,choice,motion,generic,photo,states,shapes,focus,extras]
// Requiere `npm run build` en packages/vue y packages/blocks. Cada fallo es un hallazgo de auditoria.md (EC-…).
import { splitCase } from '../split-comun.mjs'
import { serve, stop, pw, ENGINES, ok, note, report, HELPERS, settle, args } from '../../hero/auditoria-comun.mjs'

const ORIGIN = (await serve()).replace(/\/packages\/vue\/playground\/$/, '')
const BASE = `${ORIGIN}/packages/blocks/playground/ecommerce/`
// Una variante por carga donde las tres repetirían ids, anclas o `name` (como el spec de bruno); los diálogos, abiertos
const PAGES = [
  ['product-card', 'product-card.html', ''], ['category-previews', 'category-previews.html', ''],
  ['trust', 'trust.html', ''], ['promo', 'promo.html', ''], ['product-grid', 'product-grid.html', ''],
  ['product-overview 01', 'product-overview.html', 'v=01'], ['product-overview 02', 'product-overview.html', 'v=02'], ['product-overview 03', 'product-overview.html', 'v=03'],
  ['quick-view 01', 'quick-view.html', 'v=01&abierta=01'], ['quick-view 02', 'quick-view.html', 'v=02&abierta=02'], ['quick-view 03', 'quick-view.html', 'v=03&abierta=03'],
  ['reviews', 'reviews.html', ''],
  ['cart', 'cart.html', ''], ['cart 03 abierto', 'cart.html', 'v=03&estado=abierto'],
  ['checkout 01', 'checkout.html', 'v=01'], ['checkout 02', 'checkout.html', 'v=02'], ['checkout 03', 'checkout.html', 'v=03'],
  ['order-summary', 'order-summary.html', ''], ['order-history', 'order-history.html', '']
]
const THEMES = ['defecto', 'rustico', 'lujo']
const SOLO = args.solo ? String(args.solo).split(',') : null
const run = (k) => !SOLO || SOLO.includes(k)
const q = (...xs) => xs.filter(Boolean).join('&')
const TAB = (eng) => (eng === 'webkit' ? 'Alt+Tab' : 'Tab')

async function open (b, file, qs = '', { vw = 1440, vh = 900, rm = false, fc = false, expectWarn = null } = {}) {
  const ctx = await b.newContext({ viewport: { width: vw, height: vh }, reducedMotion: rm ? 'reduce' : 'no-preference', forcedColors: fc ? 'active' : 'none' })
  const p = await ctx.newPage()
  const errs = []
  p.on('console', (m) => {
    const t = m.text()
    if (expectWarn && expectWarn.test(t)) return
    if ((m.type() === 'error' && !/favicon/.test(t)) || (m.type() === 'warning' && /\[Vue warn\]|\[Grana /.test(t))) errs.push(t.slice(0, 160))
  })
  p.on('pageerror', (e) => errs.push(String(e).slice(0, 160)))
  const url = `${BASE}${file}${qs ? '?' + qs : ''}`
  for (let i = 0; ; i++) {
    try { await p.goto(url, { waitUntil: 'domcontentloaded' }); await p.waitForSelector('html[data-ready="1"] [data-gb]', { timeout: 20000, state: 'attached' }); break } catch (e) { if (i >= 2) throw e }
  }
  await p.evaluate(() => document.fonts.ready)
  await p.evaluate(HELPERS)
  await settle(p, 250)
  p.__errs = errs
  return { p, close: () => ctx.close() }
}
const overflow = (p) => p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
const norm = (s) => s.replace(/[\s   ]+/g, ' ').trim()
const events = (p, kind) => p.evaluate((k) => window.blockEvents.filter((e) => e[0] === k), kind)

// En la página: texto, controles, márgenes del navegador, [hidden] respetado y recortes de cada bloque
const SCAN = () => {
  const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && !e.closest('[hidden], [inert], .g-sr-only, dialog:not([open]), [aria-hidden="true"]') }
  const ownText = (e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
  const sizes = {}
  for (const k of ['caption', 'body-sm', 'body', 'title-sm', 'title', 'title-lg', 'display']) {
    const d = document.createElement('div'); d.style.fontSize = `var(--g-text-${k}-size)`; document.body.append(d); sizes[k] = parseFloat(getComputedStyle(d).fontSize); d.remove()
  }
  const tokenSizes = Object.values(sizes)
  { const d = document.createElement('div'); d.style.inlineSize = 'var(--g-space-1)'; document.body.append(d); window.__space = parseFloat(getComputedStyle(d).width); d.remove() }
  return [...document.querySelectorAll('[data-gb]')].filter((x) => !x.parentElement.closest('[data-gb]')).map((blk) => {
    const text = []; const ctl = []; const margins = []
    for (const e of blk.querySelectorAll('*')) {
      if (!vis(e) || e.closest('svg, img')) continue
      const cs = getComputedStyle(e)
      const inactive = !!e.closest('[aria-disabled="true"], :disabled, .is-disabled, fieldset:disabled')
      if (ownText(e)) {
        const fs = parseFloat(cs.fontSize); const bold = Number(cs.fontWeight) >= 700
        const large = fs >= 24 || (bold && fs >= 18.66)
        // Sobre foto (GCard media background): su contraste se mide por píxeles (photo)
        const onPhoto = !!e.closest('.g-card--media-background')
        const r = onPhoto ? 99 : window.__c.text(e)
        const ownScale = !!e.closest('.g-price, .g-metric, .g-badge, .g-stepper, .g-tag, .g-pagination')
        text.push({ tag: e.tagName, t: e.textContent.trim().slice(0, 32), fs, r, need: large ? 3 : 4.5, inactive, style: cs.fontStyle, token: ownScale || tokenSizes.some((s) => Math.abs(s - fs) < 0.3) })
      }
      if (e.matches('a[href], button, input:not([type="hidden"]), select, textarea, [tabindex="0"]')) {
        const box = e.matches('input') ? (e.closest('.g-input__row, .g-input__control, .g-checkbox, .g-number-field, .g-radio-group__option, label') || (e.id && document.querySelector(`label[for="${e.id}"]`)) || e) : (e.closest('.g-card__primary, .g-card__title') && e.closest('.g-card')) || e
        let r = box.getBoundingClientRect()
        if (box === e && e.classList.contains('g-btn') && getComputedStyle(e, '::after').content !== 'none') {
          const w = Math.max(r.width, 24); const h = Math.max(r.height, 24); const cx = r.left + r.width / 2; const cy = r.top + r.height / 2
          r = { left: cx - w / 2, right: cx + w / 2, top: cy - h / 2, bottom: cy + h / 2, width: w, height: h }
        }
        ctl.push({ tag: e.tagName, t: (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 24), x: r.left + r.width / 2, y: r.top + r.height / 2, l: r.left, r: r.right, tp: r.top, b: r.bottom, w: Math.round(r.width), h: Math.round(r.height) })
      }
      if (!/(^|\s)g-/.test(String(e.className)) && !e.parentElement.classList.contains('g-adaptive-layout') && !/^(IMG|TD|TR|TH|TBODY|THEAD)$/.test(e.tagName)) {
        const m = [cs.marginTop, cs.marginRight, cs.marginBottom, cs.marginLeft].map(parseFloat)
        const rhythm = (() => {
          for (let a = e.parentElement; a && a !== blk; a = a.parentElement) {
            if (a.classList.contains('g-text')) { const k = /g-text--size-(body-sm|caption|body)/.exec(a.className); return k ? ({ body: 3, 'body-sm': 2.5, caption: 2 })[k[1]] * window.__space : null }
            if (/(^|\s)g-(?!text(\s|$|--))/.test(String(a.className)) || a.matches('.g-tooltip')) return null
          }
          return null
        })()
        const ok0 = (v) => Math.abs(v) <= 0.5
        const okRhythm = rhythm !== null && ok0(m[1]) && ok0(m[3]) && [m[0], m[2]].every((v) => ok0(v) || Math.abs(v - rhythm) <= 0.5)
        if (!okRhythm && m.some((v) => Math.abs(v) > 0.5)) margins.push(`${e.tagName.toLowerCase()} ${m.map(Math.round).join('/')}`)
      }
    }
    // [hidden] respetado (EC-C1): nada con el atributo se pinta
    const shown = [...blk.querySelectorAll('[hidden]')].filter((e) => !e.matches('dialog') && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0).map((e) => `${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]}`)
    // Títulos recortados a la vista (line-clamp de GCard, EC-B1): el texto completo no se ve
    const clipped = [...blk.querySelectorAll('.g-card [data-lines]:not([data-lines="none"])')].filter((e) => vis(e) && e.scrollHeight > e.clientHeight + 1).map((e) => e.textContent.trim().slice(0, 30))
    return { gb: blk.dataset.gb, text, ctl, margins, shown, clipped }
  })
}

async function generic (b, eng, tema, dark) {
  const mode = `${eng} · ${tema}${dark ? ' · oscuro' : ''}`
  for (const [name, file, q0] of PAGES) {
    const qs = q(q0, `tema=${tema}`, dark && 'dark=1')
    const { p, close } = await open(b, file, qs)
    const blocks = await p.evaluate(SCAN)
    const seen = new Set()
    for (const blk of blocks) {
      const id = `${mode} · ${name} · ${blk.gb}`
      const low = blk.text.filter((x) => !x.inactive && x.r < x.need)
      ok(!low.length, `${id}: contraste del texto ≥ 4,5:1 (grande 3:1)`, low.map((x) => `${x.t} ${x.r}`).join('; '))
      const act = blk.text.filter((x) => !x.inactive && x.r < 99)
      if (act.length && !seen.has(blk.gb)) note(`${id}: contraste mínimo ${Math.min(...act.map((x) => x.r))}:1`)
      seen.add(blk.gb)
      const smallT = blk.text.filter((x) => x.fs < 12)
      ok(!smallT.length, `${id}: texto ≥ 12 px`, smallT.map((x) => `${x.t} ${x.fs}`).join('; '))
      const small = (c) => c.w < 24 || c.h < 24
      const hits = (c, o) => { const dx = Math.max(o.l - c.x, 0, c.x - o.r); const dy = Math.max(o.tp - c.y, 0, c.y - o.b); return Math.hypot(dx, dy) < 12 || (small(o) && Math.hypot(c.x - o.x, c.y - o.y) < 24) }
      const tiny = blk.ctl.filter((c) => small(c) && blk.ctl.some((o) => o !== c && hits(c, o)))
      ok(!tiny.length, `${id}: controles ≥ 24 × 24 o con la separación de 2.5.8`, tiny.map((c) => `${c.tag} «${c.t}» ${c.w}×${c.h}`).join('; '))
      ok(!blk.shown.length, `${id}: lo que lleva [hidden] no se pinta (EC-C1)`, blk.shown.join(', '))
      if (!dark) {
        const off = blk.text.filter((x) => !x.token)
        ok(!off.length, `${id}: todo el texto en un tamaño de la escala del tema`, [...new Set(off.map((x) => `${x.tag.toLowerCase()} ${x.fs}px «${x.t}»`))].slice(0, 4).join('; '))
        const it = blk.text.filter((x) => x.style === 'italic')
        ok(!it.length, `${id}: sin cursiva del navegador (address, cite)`, [...new Set(it.map((x) => x.tag.toLowerCase()))].join(','))
        ok(!blk.margins.length, `${id}: sin márgenes del navegador (solo el gap de las primitivas)`, [...new Set(blk.margins)].slice(0, 5).join('; '))
      }
    }
    ok(!p.__errs.length, `${mode} · ${name}: consola limpia`, p.__errs.join(' | '))
    for (const [w, h] of [[390, 844], [320, 640]]) {
      await p.setViewportSize({ width: w, height: h }); await settle(p, 120)
      ok(!(await overflow(p)), `${mode} · ${name}: sin desplazamiento horizontal a ${w}`)
      if (w === 390 && !dark) {
        const cl = (await p.evaluate(SCAN)).flatMap((x) => x.clipped.map((t) => `${x.gb}: «${t}»`))
        ok(!cl.length, `${mode} · ${name} a 390: ningún título recortado a la vista (EC-B1)`, [...new Set(cl)].slice(0, 4).join('; '))
      }
    }
    await close()
    if (!dark) {
      const z = await open(b, file, `${qs}&zoom=2`, { vw: 320, vh: 640 })
      ok(!(await overflow(z.p)), `${mode} · ${name}: sin desplazamiento horizontal a 320 con texto al 200 %`)
      // Ninguna pieza se sale de su tarjeta (EC-C3: GBadge y nota en la tarjeta de GTable)
      const out = await z.p.evaluate(() => [...document.querySelectorAll('[data-gb] .g-card, [data-gb] .g-table__row, [data-gb] .g-surface')].flatMap((c) => { const R = c.getBoundingClientRect(); if (!R.width) return []; return [...c.querySelectorAll('.g-badge, .g-price, .g-btn, p, .g-text')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && (r.right > R.right + 1 || r.left < R.left - 1) && !e.closest('.g-card__media') }).map((e) => `${c.closest('[data-gb]').dataset.gb} ${String(e.className).split(' ')[0] || e.tagName}`) }))
      ok(!out.length, `${mode} · ${name} a 320 al 200 %: nada se sale de su tarjeta (EC-C3)`, [...new Set(out)].slice(0, 4).join('; '))
      await z.close()
    }
  }
}

// Texto sobre foto (Category previews 02, Promo 02): contraste por píxeles, el peor 2 % del fondo bajo cada texto
async function photo (b, eng, tema, dark) {
  const mode = `${eng} · ${tema}${dark ? ' · oscuro' : ''}`
  for (const [file, qs0, vw] of [['category-previews.html', 'v=02', 1440], ['category-previews.html', 'v=02', 390], ['promo.html', 'v=02', 1440], ['promo.html', 'v=02', 390]]) {
    const { p, close } = await open(b, file, q(qs0, `tema=${tema}`, dark && 'dark=1'), { vw, vh: 900 })
    const cards = await p.$$('[data-gb].g-card--media-background, [data-gb] .g-card--media-background')
    let worst = 99; const bad = []
    for (const card of cards) {
      await card.scrollIntoViewIfNeeded()
      const items = await card.evaluate((c) => [...c.querySelectorAll('*')].filter((e) => e.getBoundingClientRect().height > 0 && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && !e.closest('.g-btn:not(.g-btn--variant-link)')).map((e, i) => { e.dataset.auPh = i; const r = e.getBoundingClientRect(); const C = c.getBoundingClientRect(); return { i, t: e.textContent.trim().slice(0, 24), color: getComputedStyle(e).color, x: r.left - C.left, y: r.top - C.top, w: r.width, h: r.height } }))
      await p.addStyleTag({ content: '.g-card--media-background :not(.g-btn:not(.g-btn--variant-link), .g-btn:not(.g-btn--variant-link) *) { color: transparent !important; -webkit-text-fill-color: transparent !important; text-decoration-color: transparent !important }' })
      await settle(p, 60)
      const png = (await card.screenshot()).toString('base64')
      const cw = await card.evaluate((c) => c.getBoundingClientRect().width)
      const res = await p.evaluate(async ({ png, items, cw }) => {
        const img = new Image(); img.src = `data:image/png;base64,${png}`; await img.decode()
        const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height
        const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0)
        const scale = img.width / cw
        return items.map((it) => {
          const fg = window.__c.rgba(it.color)
          const d = cx.getImageData(Math.max(0, Math.round(it.x * scale)), Math.max(0, Math.round(it.y * scale)), Math.max(1, Math.round(it.w * scale)), Math.max(1, Math.round(it.h * scale))).data
          const rs = []
          for (let k = 0; k < d.length; k += 16) rs.push(window.__c.ratio(fg, [d[k], d[k + 1], d[k + 2], 1]))
          rs.sort((a, b2) => a - b2)
          return { t: it.t, r: rs[Math.floor(rs.length * 0.02)] || 0 }
        })
      }, { png, items, cw })
      await p.evaluate(() => { document.querySelectorAll('style').forEach((s) => { if (s.textContent.includes('-webkit-text-fill-color: transparent')) s.remove() }) })
      for (const x of res) { worst = Math.min(worst, x.r); if (x.r < 4.5) bad.push(`${x.t} ${x.r}`) }
    }
    ok(cards.length > 0 && !bad.length, `${mode} · ${file} ${qs0} a ${vw}: texto sobre foto ≥ 4,5:1 en el 98 % del fondo`, bad.slice(0, 4).join('; '))
    note(`${mode} · ${file} ${qs0} a ${vw}: texto sobre foto, peor ${worst}:1`)
    await close()
  }
}

async function focusPass (b, eng, tema) {
  for (const [name, file, q0] of PAGES) {
    const { p, close } = await open(b, file, q(q0, `tema=${tema}`))
    let seen = 0; const bad = []
    for (let i = 0; i < 34; i++) {
      await p.keyboard.press(TAB(eng))
      const r = await p.evaluate(() => {
        const el = document.activeElement
        if (!el || el === document.body || !el.closest('[data-gb]')) return null
        const ring = (x, pe = null) => { if (!x) return false; const c = getComputedStyle(x, pe); return (c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0) || (c.boxShadow !== 'none' && !/^rgba\(0, 0, 0, 0\)/.test(c.boxShadow)) }
        const boxes = ['.g-input__control', '.g-input__row', '.g-select__control', '.g-textarea__control', '.g-number-field__control', '.g-checkbox__box', '.g-checkbox', '.g-radio-group__option', '.g-radio-group__control', '.g-tag']
        return { t: (el.textContent || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 20), ring: ring(el) || ring(el.closest('.g-card'), '::after') || boxes.some((s) => ring(el.closest(s))) || ring(el.parentElement) || ring(el.nextElementSibling) || ring(el.closest('label')) }
      })
      if (r) { seen++; if (!r.ring) bad.push(r.t) }
    }
    const n = await p.evaluate(() => document.querySelectorAll('[data-gb] a[href], [data-gb] button:not([disabled]), [data-gb] input, [data-gb] [tabindex="0"]').length)
    ok(!n || seen > 0, `${eng} · ${tema} · ${name}: el Tab entra en el bloque`)
    ok(!bad.length, `${eng} · ${tema} · ${name}: foco visible en todo lo enfocable (${seen})`, [...new Set(bad)].join('; '))
    await close()
  }
}

async function structure (b, eng) {
  const E = eng
  for (const [name, file, q0] of PAGES) {
    const { p, close } = await open(b, file, q0)
    const s = await p.evaluate(() => {
      const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter((h) => !h.closest('dialog:not([open])')).map((h) => Number(h.tagName[1]))
      const lists = [...document.querySelectorAll('[data-gb] [role="list"]')].every((l) => [...l.children].filter((c) => !c.classList.contains('g-tooltip')).every((c) => c.getAttribute('role') === 'listitem' || (c.tagName === 'LI' && /^(UL|OL)$/.test(l.tagName))))
      const uls = [...document.querySelectorAll('[data-gb] ul, [data-gb] ol')].every((l) => [...l.children].every((c) => /^(LI|TEMPLATE)$/.test(c.tagName) || c.getAttribute('role') === 'presentation'))
      const times = [...document.querySelectorAll('[data-gb] time')].map((t) => t.getAttribute('datetime') || '')
      const badTimes = times.filter((d) => !/^(\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?([+-]\d{2}:\d{2}|Z)?)?|\d{2}:\d{2})$/.test(d))
      const naked = [...document.querySelectorAll('[data-gb] dl, [data-gb] address, [data-gb] p, [data-gb] blockquote, [data-gb] figure')].filter((e) => { for (let a = e; a && !a.matches('[data-gb]'); a = a.parentElement) if (/(^|\s)g-/.test(String(a.className))) return false; return !/(^|\s)g-/.test(String(e.closest('[data-gb]').className)) }).map((e) => e.tagName.toLowerCase())
      // dl de totales y fichas: dentro de GText (#863)
      const dls = [...document.querySelectorAll('[data-gb] dl')].filter((d) => !d.closest('.g-text, .g-card__meta, .g-summary')).length
      // Pago en slot: ningún campo de tarjeta (§27 regla 6, EC6)
      const cc = document.querySelectorAll('[data-gb] input[autocomplete^="cc-"], [data-gb] input[name^="card"]').length
      return { h1: hs.filter((h) => h === 1).length, hs, lists, uls, times: times.length, badTimes, naked, dls, cc }
    })
    ok(s.h1 === 0, `${E} · ${name}: ningún h1 (§27 regla 1)`, s.h1)
    ok(s.hs.every((l, i) => !i || l <= s.hs[i - 1] + 1), `${E} · ${name}: encabezados sin saltos`, s.hs.join(','))
    ok(s.lists && s.uls, `${E} · ${name}: listas reales (role=list › listitem, ul/ol › li)`)
    ok(!s.badTimes.length, `${E} · ${name}: toda fecha en <time datetime> ISO (${s.times})`, s.badTimes.join(','))
    ok(!s.naked.length, `${E} · ${name}: ningún p/dl/address/blockquote/figure fuera de un componente que lo tipografía`, s.naked.join(','))
    ok(!s.dls, `${E} · ${name}: los dl (totales, ficha) dentro de GText`, s.dls)
    ok(!s.cc, `${E} · ${name}: ningún campo de tarjeta (cc-*, card*)`, s.cc)
    await close()
    if (/quick-view|cart 03/.test(name)) continue // el diálogo empieza su propio esquema (quick-view.md)
    const n = await open(b, file, q(q0, 'anidado=1'))
    const lv = await n.p.evaluate(() => [...document.querySelectorAll('[data-gb]')].filter((x) => !x.parentElement.closest('[data-gb]') && x.tagName !== 'DIALOG').map((x) => x.querySelector('h2,h3,h4,h5,h6')).filter(Boolean).map((h) => Number(h.tagName[1])))
    ok(lv.every((l) => l === 3), `${E} · ${name}: anidado en una GSection, el título del bloque baja a h3`, lv.join(','))
    await n.close()
  }
  // Reviews: figure › blockquote + figcaption, con lang y time; la respuesta fuera de la figure; cite solo con fuente
  {
    const { p, close } = await open(b, 'reviews.html', '')
    const r = await p.evaluate(() => [...document.querySelectorAll('[data-gb]')].map((x) => {
      const figs = [...x.querySelectorAll('figure')]
      return { gb: x.dataset.gb, n: figs.length, anat: figs.every((f) => f.querySelector(':scope > blockquote, :scope > .g-text > blockquote, blockquote') && f.querySelector('figcaption') && f.querySelector('figcaption time[datetime]')), en: !!x.querySelector('blockquote[lang="en"]'), replyOut: [...x.querySelectorAll('*')].filter((e) => /^Respuesta de/.test(e.textContent.trim()) && !e.children.length).every((e) => !e.closest('figure')), bars: [...x.querySelectorAll('[role="progressbar"]')].filter((e) => !e.closest('[aria-hidden="true"]')).length, img: x.querySelectorAll('img:not([alt=""])').length }
    }))
    for (const x of r) {
      ok(x.n > 0 && x.anat, `${E} · ${x.gb}: cada opinión es figure › blockquote + figcaption con time`)
      ok(x.en, `${E} · ${x.gb}: la opinión en inglés con lang="en" en su blockquote`)
      ok(x.replyOut, `${E} · ${x.gb}: la respuesta de la tienda fuera de la figure`)
      ok(!x.bars && !x.img, `${E} · ${x.gb}: sin progressbar ni imágenes con nombre (calificación en palabras)`, `${x.bars}/${x.img}`)
    }
    await close()
  }
  // Order summary 02: código primero, address, total como último par antes de lo incluido
  {
    const { p, close } = await open(b, 'order-summary.html', 'v=02')
    const r = await p.evaluate(() => { const x = document.querySelector('[data-gb]'); const metric = x.querySelector('.g-metric'); const first = [...x.querySelectorAll('.g-metric, ul, dl, address')][0]; const dts = [...x.querySelectorAll('dl dt')].map((d) => d.textContent.trim()); return { first: first === metric, address: !!x.querySelector('address'), dts } })
    ok(r.first, `${E} · order-summary-02: el código va primero`)
    ok(r.address, `${E} · order-summary-02: la dirección en address`)
    const ti = r.dts.indexOf('Total'); const iva = r.dts.findIndex((d) => /IVA/.test(d))
    ok(ti >= 0 && iva > ti, `${E} · order-summary-02: el total antes de lo incluido (IVA después)`, r.dts.join(' | '))
    await close()
  }
}

// La elección dicha con las mismas palabras: ficha → carrito → pedido → historial
async function choice (b, eng) {
  const pairOf = async (file, qs, rx) => {
    const { p, close } = await open(b, file, qs)
    const t = await p.evaluate((src) => { const rx = new RegExp(src); return [...document.querySelectorAll('[data-gb] li, [data-gb] .g-card, [data-gb] tr')].filter((e) => rx.test(e.textContent)).map((e) => e.textContent) }, rx)
    await close(); return t.map(norm)
  }
  // Ficha (Product overview y Quick view): la opción Color con el valor Grana
  {
    const { p, close } = await open(b, 'product-overview.html', 'v=01')
    const r = await p.evaluate(() => { const fs = [...document.querySelectorAll('[data-gb] fieldset')].find((f) => /^Color/.test(f.querySelector('legend')?.textContent.trim() || '')); return fs ? [...fs.querySelectorAll('label')].map((l) => l.textContent.trim()) : [] })
    ok(r.includes('Grana'), `${eng} · product-overview: la pregunta «Color» ofrece «Grana»`, r.join(','))
    await close()
  }
  const cart = await pairOf('cart.html', 'v=01', 'Rebozo')
  ok(cart.some((t) => /Color ?·? ?Grana/.test(t)), `${eng} · cart-01: la línea del rebozo dice «Color» y «Grana»`, cart[0])
  for (const v of ['01', '02']) {
    const os = await pairOf('order-summary.html', `v=${v}`, 'Rebozo')
    ok(os.some((t) => /Color ?·? ?Grana/.test(t)), `${eng} · order-summary-${v}: el rebozo con la misma elección que el carrito (Color Grana)`, os[0])
  }
  {
    const ck = await pairOf('checkout.html', 'v=03', 'Rebozo')
    ok(ck.some((t) => /Color ?·? ?Grana/.test(t)), `${eng} · checkout-03: el pedido al lado con la misma elección`, ck[0])
  }
  // Historial 01: lo comprado en el detalle del pedido BYA-2611-09 (huipil); su color debe ser uno de la ficha (EC-B2)
  {
    const { p, close } = await open(b, 'order-history.html', 'v=01')
    await p.locator('[data-gb] tr', { hasText: 'BYA-2611-09' }).locator('button[aria-expanded]').first().click().catch(() => {})
    await settle(p, 400)
    const t = norm(await p.evaluate(() => (document.querySelector('[data-gb] .g-table__detail') || {}).textContent || ''))
    ok(/Talla ?·? ?M/.test(t), `${eng} · order-history-01: el detalle dice la elección («Talla M»)`, t.slice(0, 80))
    ok(/Natural|Grana/.test(t), `${eng} · order-history-01: el color del huipil con las palabras de la ficha (Natural/Grana), no otras (EC-B2)`, t.slice(0, 80))
    await close()
  }
}

async function states (b, eng, tema, dark) {
  const E = `${eng} · ${tema}${dark ? ' · oscuro' : ''}`
  const base = [`tema=${tema}`, dark && 'dark=1']
  const minText = (p, sel) => p.evaluate((sel) => { const t = [...document.querySelectorAll(sel)].filter((x) => x.getBoundingClientRect().height > 0 && !x.closest('[aria-hidden="true"]') && [...x.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())); return t.length ? Math.min(...t.map((x) => window.__c.text(x))) : 0 }, sel)
  // Product grid: carga con molde, error con reintento, vacío y vacío por filtros (con su salida)
  for (const st of ['carga', 'error', 'vacio', 'filtrado']) {
    const { p, close } = await open(b, 'product-grid.html', q(...base, `estado=${st}`))
    const r = await p.evaluate(() => [...document.querySelectorAll('[data-gb]')].map((x) => ({ gb: x.dataset.gb, busy: !!x.querySelector('[aria-busy="true"]'), retry: [...x.querySelectorAll('button')].filter((bt) => /Reintentar/.test(bt.textContent)).length, empty: !!x.querySelector('.g-empty'), relax: [...x.querySelectorAll('button')].filter((bt) => /^Quitar «/.test(bt.textContent.trim())).length })))
    for (const x of r) {
      if (st === 'carga') ok(x.busy, `${E} · ${x.gb} carga: la región en aria-busy con su molde`)
      if (st === 'error') ok(x.retry === 1, `${E} · ${x.gb} error: «Reintentar» a la vista`, x.retry)
      if (st === 'vacio') ok(x.empty, `${E} · ${x.gb} vacío: GEmpty`)
      if (st === 'filtrado') ok(x.empty && x.relax >= 1, `${E} · ${x.gb} vacío por filtros: la salida dice qué quitar`, `${x.relax}`)
    }
    if (st === 'error') { await p.locator('[data-gb="product-grid-01"]').getByRole('button', { name: /Reintentar/ }).click(); ok((await events(p, 'retry')).length === 1, `${E} · product-grid-01 error: «Reintentar» emite retry`) }
    const c = await minText(p, '[data-gb] .g-empty *, [data-gb] .g-load-region *')
    ok(!c || c >= 4.5, `${E} · product-grid ${st}: textos del estado ≥ 4,5:1`, c)
    ok(!p.__errs.length, `${E} · product-grid ${st}: consola limpia`, p.__errs.join(' | '))
    await close()
  }
  // Cart vacío: GEmpty con «Seguir comprando», sin «Pagar»
  {
    const { p, close } = await open(b, 'cart.html', q('v=02', ...base, 'estado=vacio'))
    const r = await p.evaluate(() => { const x = document.querySelector('[data-gb]'); return { empty: !!x.querySelector('.g-empty'), seguir: [...x.querySelectorAll('a,button')].some((e) => /Seguir comprando/.test(e.textContent)), pagar: [...x.querySelectorAll('a,button')].some((e) => /^Pagar/.test(e.textContent.trim())) } })
    ok(r.empty && r.seguir && !r.pagar, `${E} · cart-02 vacío: GEmpty con «Seguir comprando» y sin «Pagar»`, JSON.stringify(r))
    await close()
  }
  // Cart: la huella (foco en «Deshacer», contraste) y busy
  for (const v of ['01', '02']) {
    const { p, close } = await open(b, 'cart.html', q(`v=${v}`, ...base))
    const blk = p.locator(`[data-gb="cart-${v}"]`)
    await blk.getByRole('button', { name: /^Quitar Rebozo/ }).click(); await settle(p, 200)
    const r = await p.evaluate(() => { const f = document.activeElement; const li = f && f.closest('li'); const t = li && [...li.querySelectorAll('*')].find((e) => [...e.childNodes].some((n) => n.nodeType === 3 && /Quitaste/.test(n.textContent))); return { focus: f ? f.textContent.trim() : '', idx: li ? [...li.parentElement.children].indexOf(li) : -1, c: t ? window.__c.text(t) : 0, cu: f ? window.__c.text(f) : 0 } })
    ok(r.focus === 'Deshacer' && r.idx === 1, `${E} · cart-${v}: quitar deja la huella en su sitio con el foco en «Deshacer»`, JSON.stringify(r))
    ok(r.c >= 4.5 && r.cu >= 4.5, `${E} · cart-${v}: la huella ≥ 4,5:1`, `${r.c} / ${r.cu}`)
    await p.keyboard.press('Enter'); await settle(p, 200)
    const back = await p.evaluate(() => [...document.querySelectorAll('[data-gb] ul.g-stack > li')][1]?.textContent || '')
    ok(/Rebozo/.test(back) && !/Quitaste/.test(back), `${E} · cart-${v}: «Deshacer» devuelve la línea a su sitio`)
    await close()
  }
  {
    const { p, close } = await open(b, 'cart.html', q('v=01', ...base, 'estado=ocupado'))
    const d = await p.evaluate(() => { const li = [...document.querySelectorAll('[data-gb] ul.g-stack > li')][0]; return { input: li.querySelector('input').disabled || li.querySelector('input').readOnly || li.querySelector('input').getAttribute('aria-disabled') === 'true', quitar: [...li.querySelectorAll('button')].filter((x) => /Quitar/.test(x.textContent)).every((x) => x.disabled || x.getAttribute('aria-disabled') === 'true') } })
    ok(d.input && d.quitar, `${E} · cart-01 ocupado: la cantidad y «Quitar» de la línea en curso, inactivos`, JSON.stringify(d))
    await close()
  }
  // Checkout: enviar vacío revela y enfoca, ningún submit; error del servidor ligado al campo; error general; busy; volver no borra
  for (const v of ['01', '02', '03']) {
    const { p, close } = await open(b, 'checkout.html', q(`v=${v}`, ...base))
    await p.locator('[data-gb] button[type="submit"]').first().click(); await settle(p, 300)
    const r = await p.evaluate(() => ({ inv: document.querySelectorAll('[data-gb] [aria-invalid="true"]').length, focus: document.activeElement?.getAttribute('aria-invalid') === 'true' || !!document.activeElement?.closest('.g-error-summary'), submits: window.blockEvents.filter((e) => e[0] === 'submit').length }))
    ok(r.inv >= 1 && r.focus && !r.submits, `${E} · checkout-${v} vacío: error revelado, foco en él y ningún submit`, JSON.stringify(r))
    const c = await minText(p, '[data-gb] .g-error-summary *, [data-gb] [id$="-error"], [data-gb] [class*="__error"], [data-gb] [class*="__message"]')
    ok(c >= 4.5, `${E} · checkout-${v} vacío: mensajes de error ≥ 4,5:1`, c)
    await p.locator('[data-gb] input[type="email"]').fill('ana@example.com')
    await p.locator('[data-gb] button[type="submit"]').first().click(); await settle(p, 400)
    const st = await p.evaluate(() => window.blockEvents.filter((e) => e[0] === 'submit').length)
    ok(st === 1, `${E} · checkout-${v}: el paso válido emite submit y avanza`, st)
    // Volver (Atrás en 01/03; «Cambiar» en 02)
    const backBtn = v === '02' ? p.locator('[data-gb]').getByRole('button', { name: /Cambiar/ }).first() : p.locator('[data-gb]').getByRole('button', { name: 'Atrás' })
    await backBtn.click(); await settle(p, 400)
    ok(await p.locator('[data-gb] input[type="email"]').inputValue() === 'ana@example.com', `${E} · checkout-${v}: volver no borra lo escrito`)
    ok(!p.__errs.length, `${E} · checkout-${v}: consola limpia`, p.__errs.join(' | '))
    await close()
  }
  {
    const { p, close } = await open(b, 'checkout.html', q('v=01', ...base, 'estado=servidor'))
    const r = await p.evaluate(() => { const i = document.querySelector('[data-gb] input[name="cp"]'); if (!i) return null; const d = (i.getAttribute('aria-describedby') || '').split(' ').map((x) => document.getElementById(x)).filter(Boolean).map((x) => x.textContent).join(' '); return { inv: i.getAttribute('aria-invalid'), d, vis: i.getBoundingClientRect().height > 0 } })
    if (r && r.inv !== 'true') { await p.locator('[data-gb] button[type="submit"]').first().click(); await settle(p, 300) }
    const r2 = await p.evaluate(() => { const i = document.querySelector('[data-gb] input[name="cp"]'); const d = (i.getAttribute('aria-describedby') || '').split(' ').map((x) => document.getElementById(x)).filter(Boolean).map((x) => x.textContent).join(' '); return { inv: i.getAttribute('aria-invalid'), d, vis: i.getBoundingClientRect().height > 0 } })
    ok(r2.vis && r2.inv === 'true' && /no existe/.test(r2.d), `${E} · checkout-01 servidor: el error de la aplicación en el código postal, ligado y a la vista`, JSON.stringify(r2))
    await close()
  }
  {
    const { p, close } = await open(b, 'checkout.html', q('v=01', ...base, 'estado=ocupado'))
    const r = await p.evaluate(() => { const bt = document.querySelector('[data-gb] button[type="submit"]'); const lab = [...bt.querySelectorAll('*')].find((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) || bt; return { busy: bt.getAttribute('aria-busy') === 'true' || bt.getAttribute('aria-disabled') === 'true' || bt.disabled, r: window.__c.text(lab) } })
    ok(r.busy && r.r >= 4.5, `${E} · checkout-01 ocupado: el envío en carga con texto ≥ 4,5:1`, JSON.stringify(r))
    await close()
  }
  // Nunca a ciegas: «Añadir» sin talla no emite y lleva a la talla (Product overview 01, Quick view 01 y 03)
  for (const [file, qs, gb] of [['product-overview.html', 'v=01', 'product-overview-01'], ['quick-view.html', 'v=01&abierta=01', 'quick-view-01'], ['quick-view.html', 'v=03&abierta=03', 'quick-view-03']]) {
    const { p, close } = await open(b, file, q(qs, ...base))
    await p.locator(`[data-gb="${gb}"]`).getByRole('button', { name: 'Añadir al carrito' }).click(); await settle(p, 300)
    const r = await p.evaluate(() => ({ adds: window.blockEvents.filter((e) => e[0] === 'add').length, radio: document.activeElement?.type === 'radio', name: document.activeElement?.name }))
    ok(!r.adds && r.radio, `${E} · ${gb}: «Añadir» sin talla no añade y lleva a la pregunta`, JSON.stringify(r))
    const c = await minText(p, `[data-gb="${gb}"] [class*="__error"], [data-gb="${gb}"] [id$="-error"], [data-gb="${gb}"] [class*="__message"]`)
    ok(c >= 4.5, `${E} · ${gb}: el error de la opción ≥ 4,5:1`, c)
    await close()
  }
  // Product card 03 y grid 02: la acción rápida con opciones dice «Elegir opciones» y abre (no add)
  {
    const { p, close } = await open(b, 'product-card.html', q('v=03', ...base))
    await p.locator('[data-gb="product-card-03"]', { hasText: 'Huipil' }).getByRole('button', { name: 'Elegir opciones' }).click()
    ok((await events(p, 'add')).length === 0 && (await events(p, 'open')).length === 1, `${E} · product-card-03: «Elegir opciones» abre y no añade`)
    await close()
  }
  // Order history: cargando, error con reintento y vacío
  for (const st of ['cargando', 'error', 'vacio']) {
    const { p, close } = await open(b, 'order-history.html', q(...base, `estado=${st}`))
    const r = await p.evaluate(() => [...document.querySelectorAll('[data-gb]')].map((x) => ({ gb: x.dataset.gb, busy: !!x.querySelector('[aria-busy="true"]'), retry: [...x.querySelectorAll('button')].some((bt) => /Reintentar/.test(bt.textContent)), empty: !!x.querySelector('.g-empty') || /Todavía no|Aún no|sin pedidos/i.test(x.textContent) })))
    for (const x of r) {
      if (st === 'cargando') ok(x.busy, `${E} · ${x.gb} cargando: aria-busy`)
      if (st === 'error') ok(x.retry, `${E} · ${x.gb} error: «Reintentar» a la vista`)
      if (st === 'vacio') ok(x.empty, `${E} · ${x.gb} vacío: lo dice`)
    }
    const c = await minText(p, '[data-gb] .g-empty *, [data-gb] .g-load-region *, [data-gb] .g-table__state *, [data-gb] [class*="g-table__empty"] *')
    ok(!c || c >= 4.5, `${E} · order-history ${st}: textos del estado ≥ 4,5:1`, c)
    ok(!p.__errs.length, `${E} · order-history ${st}: consola limpia`, p.__errs.join(' | '))
    await close()
  }
  // Reviews vacío
  {
    const { p, close } = await open(b, 'reviews.html', q(...base, 'estado=vacio'))
    const r = await p.evaluate(() => [...document.querySelectorAll('[data-gb]')].map((x) => !!x.querySelector('.g-empty') && /Todavía sin opiniones/.test(x.textContent) && !/0 de 5/.test(x.textContent)))
    ok(r.every(Boolean), `${E} · reviews vacío: «Todavía sin opiniones» y nunca «0 de 5»`, r.join(','))
    await close()
  }
}

// Medidas de forma (los «Chromium:» de cada contrato y los hallazgos)
async function shapes (b, eng, tema) {
  const E = `${eng} · ${tema}`
  const t = `tema=${tema}`
  const sideBySide = async (file, qs, gb, aSel, bSel, label, id) => {
    const { p, close } = await open(b, file, q(qs, t))
    const r = await p.evaluate(([gb, a, b2]) => { const x = document.querySelector(`[data-gb="${gb}"]`); const A = x.querySelector(a)?.getBoundingClientRect(); const B = x.querySelector(b2)?.getBoundingClientRect(); return A && B ? { side: A.right <= B.left + 1 || B.right <= A.left + 1, a: Math.round(A.width), b: Math.round(B.width) } : null }, [gb, aSel, bSel])
    ok(r && r.side, `${E} · ${gb} a 1440: ${label} (${id})`, JSON.stringify(r))
    await close()
  }
  // PO-L1, CR-L1 y CK-L1 cerrados con GSplit (#950, bruno 8710e80): las dos columnas a 1440, la regla de la caja y el apilado limpio
  const sOpen = (file, qs, o) => open(b, file, qs, o)
  const SPLITS = [
    { file: 'product-overview.html', qs: 'v=01', gb: 'product-overview-01', ratio: [1, 1], side1440: 488, id: 'PO-L1', tabs: 80 },
    { file: 'cart.html', qs: 'v=01', gb: 'cart-01', ratio: [3, 2], side1440: 390, id: 'CR-L1', tabs: 80 },
    { file: 'checkout.html', qs: 'v=03', gb: 'checkout-03', ratio: [3, 2], side1440: 390, id: 'CK-L1', tabs: 100 }
  ]
  for (const c of SPLITS) await splitCase(sOpen, ok, note, eng, E, t, c)
  await sideBySide('reviews.html', 'v=02', 'reviews-02', '[role="list"][aria-label]', 'figure', 'resumen y distribución al lado de las opiniones', 'reviews.md')
  await sideBySide('product-grid.html', 'v=02', 'product-grid-02', '[role="group"]', '[role="list"]', 'las facetas al lado de la rejilla', 'product-grid.md')
  // Trust 01: una fila que llena el ancho a 1440 (pista g-adapt-short, EC-B3)
  {
    const { p, close } = await open(b, 'trust.html', q('v=01', t))
    const r = await p.evaluate(() => { const l = document.querySelector('[data-gb] [role="list"]'); const L = l.getBoundingClientRect(); const it = [...l.children].map((c) => c.getBoundingClientRect()); return { rows: new Set(it.map((x) => Math.round(x.top))).size, used: Math.round((Math.max(...it.map((x) => x.right)) - L.left) / L.width * 100) } })
    ok(r.rows === 1 && r.used >= 90, `${E} · trust-01 a 1440: una fila que llena el ancho (EC-B3)`, `${r.rows} fila(s), ${r.used} % del ancho`)
    await close()
  }
  // Los enlaces de la prueba (GBtn link) que se parten: alineados al inicio (EC-C2)
  {
    const { p, close } = await open(b, 'trust.html', t)
    const r = await p.evaluate(() => [...document.querySelectorAll('[data-gb] .g-btn--variant-link')].map((x) => getComputedStyle(x).textAlign))
    ok(r.length && r.every((a) => a === 'start' || a === 'left'), `${E} · trust: los enlaces de la prueba alineados al inicio (EC-C2)`, [...new Set(r)].join(','))
    await close()
  }
  // Promo 03 a 1440: una línea (las piezas comparten franja); a 320 sin desbordar
  {
    const { p, close } = await open(b, 'promo.html', q('v=03', t))
    const r = await p.evaluate(() => { const kids = [...document.querySelector('[data-gb] .g-adaptive-layout').children].map((x) => x.getBoundingClientRect()); return Math.max(...kids.map((x) => x.top)) < Math.min(...kids.map((x) => x.bottom)) })
    ok(r, `${E} · promo-03 a 1440: una línea`)
    await close()
  }
  // Order history 01 a 390: tarjetas de GTable; 02 seguimiento dentro de la tarjeta a 320
  {
    const { p, close } = await open(b, 'order-history.html', q('v=02', t), { vw: 320, vh: 640 })
    const r = await p.evaluate(() => [...document.querySelectorAll('[data-gb] .g-stepper')].every((s) => s.getBoundingClientRect().right <= s.closest('li').getBoundingClientRect().right + 1))
    ok(r, `${E} · order-history-02 a 320: el seguimiento dentro de su tarjeta`)
    await close()
  }
  // Quick view 01 hoja inferior y 02 a pantalla completa a 390; cart 03 a pantalla completa a 390
  for (const [file, qs, gb, kind] of [['quick-view.html', 'v=01&abierta=01', 'quick-view-01', 'sheet'], ['quick-view.html', 'v=02&abierta=02', 'quick-view-02', 'full'], ['cart.html', 'v=03&estado=abierto', 'cart-03', 'full']]) {
    const { p, close } = await open(b, file, q(qs, t), { vw: 390, vh: 844 })
    await p.waitForTimeout(450)
    const r = await p.evaluate((gb) => { const d = document.querySelector(`dialog[data-gb="${gb}"]`).getBoundingClientRect(); return { l: Math.round(d.left), r: Math.round(d.right), b: Math.round(d.bottom), t: Math.round(d.top) } }, gb)
    ok(r.l <= 1 && r.r >= 389 && r.b >= 843 && (kind === 'sheet' ? r.t > 0 : r.t <= 1), `${E} · ${gb} a 390: ${kind === 'sheet' ? 'hoja inferior' : 'pantalla completa'}`, JSON.stringify(r))
    await close()
  }
  // Checkout 03 a 390 × 844: ningún control enfocado bajo el pie pegado (2.4.11)
  {
    const { p, close } = await open(b, 'checkout.html', q('v=03', t), { vw: 390, vh: 844 })
    const bad = []
    for (let i = 0; i < 16; i++) {
      await p.keyboard.press(TAB(eng)); await settle(p, 60)
      const r = await p.evaluate(() => { const el = document.activeElement; const f = document.querySelector('[data-gb] .g-form-actions'); if (!el || !el.closest('[data-gb]') || f.contains(el)) return null; const B = (el.closest('.g-input__row, .g-input__control, .g-select__control, .g-radio-group__option, .g-checkbox') || el).getBoundingClientRect(); const F = f.getBoundingClientRect(); return { t: el.name || el.textContent.trim().slice(0, 16), under: B.bottom > F.top + 1 && B.top < F.bottom } })
      if (r && r.under) bad.push(r.t)
    }
    ok(!bad.length, `${E} · checkout-03 a 390 × 844: ningún control enfocado bajo el pie pegado`, bad.join('; '))
    await close()
  }
  // Category previews: la vacía sin enlace y con su texto; la cuenta en el nombre del enlace
  {
    const { p, close } = await open(b, 'category-previews.html', t)
    const r = await p.evaluate(() => [...document.querySelectorAll('[data-gb]')].map((x) => ({ gb: x.dataset.gb, emptyLink: [...x.querySelectorAll('a')].some((a) => /Barro verde/.test(a.textContent)), count: [...x.querySelectorAll('a')].some((a) => /Mezcal · 18 piezas/.test(a.textContent.replace(/\s+/g, ' '))) })))
    for (const x of r) ok(!x.emptyLink && x.count, `${E} · ${x.gb}: la cuenta en el enlace y la vacía sin enlace`, JSON.stringify(x))
    await close()
  }
}

// Rúbrica de movimiento sobre lo compuesto
async function motion (b, eng) {
  const running = (p) => p.evaluate(() => {
    const all = document.getAnimations().filter((a) => a.playState === 'running' && a.effect?.target?.closest?.('[data-gb], dialog'))
    // Movimiento = cambio de lugar, tamaño o giro; los colores, la opacidad y las propiedades propias de tinte no lo son
    const moves = all.filter((a) => a.transitionProperty ? /^(translate|scale|rotate|transform|inset.*|top|left|right|bottom|width|height|inline-size|block-size|max-.*|min-.*|grid-template-.*|margin.*|padding.*)$/.test(a.transitionProperty) : !/fade/i.test(a.animationName || ''))
    return { n: all.length, moves: moves.length, dur: Math.max(0, ...moves.map((a) => Number(a.effect.getComputedTiming().duration) || 0)), props: [...new Set(moves.map((a) => a.transitionProperty || a.animationName))].join(',') }
  })
  const frame = (p) => p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
  // Diálogos: Quick view 01 (centro/hoja), 02 (hoja lateral), 03; Cart 03 (cajón). Abrir, durar, Esc, foco de vuelta
  for (const [file, qs, gb, trig, vw] of [['quick-view.html', 'v=01', 'quick-view-01', '#disparador-01 .g-card__primary', 1440], ['quick-view.html', 'v=01', 'quick-view-01', '#disparador-01 .g-card__primary', 390], ['quick-view.html', 'v=02', 'quick-view-02', '#disparador-02 .g-card__primary', 1440], ['quick-view.html', 'v=03', 'quick-view-03', '#disparador-03 .g-card__primary', 1440], ['cart.html', 'v=03', 'cart-03', '#abrir-carrito', 1440]]) {
    for (const rm of [false, true]) {
      const { p, close } = await open(b, file, qs, { rm, vw, vh: vw > 500 ? 900 : 844 })
      const tag = `${eng} · ${gb} a ${vw}${rm ? ' · reducido' : ''}`
      const t0 = p.locator(trig).first()
      await t0.click(); await frame(p)
      const r = await running(p)
      await p.waitForTimeout(600)
      ok(await p.locator(`dialog[data-gb="${gb}"][open]`).count() === 1, `${tag}: abre`)
      if (rm) ok(r.moves === 0, `${tag}: con movimiento reducido, sin desplazamiento ni escala`, `${r.moves} (${r.props})`)
      else { ok(r.dur <= 500, `${tag}: la apertura dentro de la duración del tema`, `${r.dur} ms (${r.props})`); note(`${tag}: ${r.moves} animaciones de movimiento, ${r.dur} ms (${r.props})`) }
      // Esc: el campo de cantidad enfocado se lo queda (number-field.md); se cierra desde el cuerpo del diálogo
      await p.evaluate((gb) => { const d = document.querySelector(`dialog[data-gb="${gb}"]`); if (document.activeElement?.matches('input')) document.activeElement.blur(); d.focus?.() }, gb)
      await p.keyboard.press('Escape'); await p.waitForTimeout(600)
      ok(await p.locator(`dialog[data-gb="${gb}"][open]`).count() === 0, `${tag}: Esc cierra`)
      ok(await t0.evaluate((x) => x === document.activeElement || x.contains(document.activeElement)), `${tag}: el foco vuelve a su disparador`)
      await close()
    }
  }
  // Product overview 01 (acordeón) y Checkout 02 (pliegue de lo hecho): el encabezado no se mueve; reducido sin movimiento
  for (const rm of [false, true]) {
    const { p, close } = await open(b, 'product-overview.html', 'v=01', { rm })
    const tag = `${eng} · product-overview-01 acordeón${rm ? ' · reducido' : ''}`
    const s = await p.evaluate(async () => {
      const it = document.querySelector('[data-gb] .g-accordion-item'); const btn = it.querySelector('[aria-expanded]'); btn.scrollIntoView({ block: 'center' }); await new Promise((r) => setTimeout(r, 50))
      const head = it.getBoundingClientRect().top; btn.click(); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      const moves = document.getAnimations().filter((a) => a.playState === 'running' && a.effect?.target?.closest?.('[data-gb]') && !/^(opacity|visibility|color)$/.test(a.transitionProperty || ''))
      const dur = Math.max(0, ...moves.map((a) => Number(a.effect.getComputedTiming().duration) || 0)); const mid = it.getBoundingClientRect().top
      await new Promise((r) => setTimeout(r, 700))
      return { n: moves.length, dur, moved: Math.abs(mid - head), open: btn.getAttribute('aria-expanded') }
    })
    ok(s.open === 'true' && s.moved < 0.5, `${tag}: abre y el encabezado no se mueve`, JSON.stringify(s))
    if (rm) ok(s.n === 0, `${tag}: sin movimiento`, `${s.n}`)
    else { ok(s.dur > 0 && s.dur <= 500, `${tag}: el plegado dentro de la duración del tema`, `${s.dur} ms`); note(`${tag}: ${s.dur} ms`) }
    await close()
  }
  for (const rm of [false, true]) {
    const { p, close } = await open(b, 'checkout.html', 'v=02', { rm })
    const tag = `${eng} · checkout-02 pliegue${rm ? ' · reducido' : ''}`
    await p.locator('[data-gb] input[type="email"]').fill('ana@example.com')
    const head0 = await p.evaluate(() => document.querySelector('[data-gb] .g-form-section').getBoundingClientRect().top)
    await p.locator('[data-gb] button[type="submit"]').first().click(); await frame(p)
    const r = await running(p)
    await p.waitForTimeout(700)
    const s = await p.evaluate(() => { const secs = [...document.querySelectorAll('[data-gb] .g-form-section')]; return { head: secs[0].getBoundingClientRect().top, firstOpen: secs[0].classList.contains('is-open'), secondOpen: secs[1].classList.contains('is-open'), focus: secs[1].contains(document.activeElement) && document.activeElement.matches('input, select, textarea') } })
    ok(!s.firstOpen && s.secondOpen, `${tag}: lo hecho se pliega y el siguiente se abre`, JSON.stringify(s))
    ok(Math.abs(s.head - head0) < 0.5, `${tag}: el encabezado del paso hecho no se mueve`, `${head0}→${s.head}`)
    ok(s.focus, `${tag}: el foco va al primer control del paso nuevo`)
    if (rm) ok(r.moves === 0, `${tag}: sin movimiento`, `${r.moves} (${r.props})`)
    else { ok(r.dur <= 500, `${tag}: dentro de la duración del tema`, `${r.dur} ms (${r.props})`); note(`${tag}: ${r.moves} animaciones, ${r.dur} ms (${r.props})`) }
    await close()
  }
  // Cifras del total que ruedan (Cart 01) sin mover el precio; reducido no rueda
  for (const rm of [false, true]) {
    const { p, close } = await open(b, 'cart.html', 'v=01', { rm })
    const tag = `${eng} · cart-01 total de la línea${rm ? ' · reducido' : ''}`
    const line = p.locator('[data-gb="cart-01"] ul.g-stack > li').first()
    const y0 = await line.evaluate((el) => el.querySelector('.g-price').getBoundingClientRect().top)
    await line.getByRole('button', { name: 'Añadir una' }).click(); await frame(p)
    const r = await line.evaluate((el) => { const a = el.getAnimations({ subtree: true }).filter((x) => x.playState === 'running' && x.effect?.target?.closest?.('.g-price')); return { n: a.length, dur: Math.max(0, ...a.map((x) => Number(x.effect.getComputedTiming().duration) || 0)) } })
    await p.waitForTimeout(800)
    const y1 = await line.evaluate((el) => el.querySelector('.g-price').getBoundingClientRect().top)
    ok(rm ? r.n === 0 : r.n > 0 && r.dur <= 600, `${tag}: ${rm ? 'no rueda' : 'las cifras ruedan dentro de la duración del tema'}`, JSON.stringify(r))
    ok(Math.abs(y1 - y0) < 0.5, `${tag}: el precio no cambia de sitio`, `${y0}→${y1}`)
    await close()
  }
  // La huella: quitar no anima el resto de la lista hacia arriba (la huella ocupa el sitio); reducido igual
  for (const rm of [false, true]) {
    const { p, close } = await open(b, 'cart.html', 'v=02', { rm })
    const tag = `${eng} · cart-02 huella${rm ? ' · reducido' : ''}`
    const nextTop = () => p.evaluate(() => [...document.querySelectorAll('[data-gb] ul.g-stack > li')][2].getBoundingClientRect().top)
    const a = await nextTop()
    await p.locator('[data-gb]').getByRole('button', { name: /^Quitar Rebozo/ }).click(); await frame(p)
    const r = await running(p)
    await p.waitForTimeout(500)
    const c = await nextTop()
    note(`${tag}: la línea siguiente se mueve ${Math.round(a - c)} px (la huella es más baja que la línea), ${r.moves} animaciones (${r.props})`)
    if (rm) ok(r.moves === 0, `${tag}: sin movimiento`, `${r.moves} (${r.props})`)
    else ok(r.dur <= 500, `${tag}: dentro de la duración del tema`, `${r.dur} ms`)
    await close()
  }
  // Galería: el visor de Product overview 02 (cuadrícula) abre corto; reducido sin desplazamiento; Esc y foco de vuelta
  for (const rm of [false, true]) {
    const { p, close } = await open(b, 'product-overview.html', 'v=02', { rm })
    const tag = `${eng} · product-overview-02 visor${rm ? ' · reducido' : ''}`
    const btn = p.locator('[data-gb] .g-gallery__thumb').first()
    await btn.click(); await frame(p)
    const r = await running(p)
    await p.waitForTimeout(600)
    ok(await p.locator('dialog[open]').count() === 1, `${tag}: abre`)
    if (rm) ok(r.moves === 0, `${tag}: sin desplazamiento ni escala`, `${r.moves} (${r.props})`)
    else { ok(r.dur <= 500, `${tag}: dentro de la duración del tema`, `${r.dur} ms`); note(`${tag}: ${r.moves} animaciones, ${r.dur} ms (${r.props})`) }
    await p.keyboard.press('Escape'); await p.waitForTimeout(600)
    ok(await p.locator('dialog[open]').count() === 0 && await btn.evaluate((x) => x === document.activeElement), `${tag}: Esc cierra y el foco vuelve`)
    await close()
  }
  // La foto sigue a la elección (03 tira): elegir «Grana» cambia la foto sin mover el foco ni la página
  {
    const { p, close } = await open(b, 'product-overview.html', 'v=03')
    const radio = p.locator('[data-gb]').getByRole('radio', { name: 'Grana' })
    await radio.scrollIntoViewIfNeeded()
    // La foto a la vista: la diapositiva de la tira cuyo inicio está en el inicio de la tira
    const shown = () => p.evaluate(() => { const st = document.querySelector('[data-gb] .g-gallery__strip'); const S = st.getBoundingClientRect(); const sl = [...st.querySelectorAll('.g-gallery__slide')]; return { y: scrollY, i: sl.map((x) => Math.abs(x.getBoundingClientRect().left - S.left)).reduce((m, d, k, a) => (d < a[m] ? k : m), 0), current: sl.findIndex((x) => x.querySelector('.is-current')), focus: document.activeElement?.value, inGallery: !!document.activeElement?.closest('.g-gallery') } })
    const before = await shown()
    await radio.check(); await settle(p, 700)
    const after = await shown()
    // WebKit no enfoca un radio al pulsarlo (comportamiento de la plataforma): basta con que el foco no salte a la galería
    ok((after.focus === 'grana' || eng === 'webkit') && !after.inGallery && Math.abs(after.y - before.y) < 1, `${eng} · product-overview-03: elegir no mueve el foco ni la página`, `${JSON.stringify(before)} → ${JSON.stringify(after)}`)
    ok(after.i === after.current && after.i !== before.i, `${eng} · product-overview-03: la tira enseña la foto de lo elegido (EC-V1, GGallery con index externo)`, `a la vista ${before.i} → ${after.i}, actual ${after.current}`)
    await close()
  }
  // Nada se mueve solo al cargar (2.2.2)
  for (const [name, file, q0] of PAGES) {
    const { p, close } = await open(b, file, q0)
    await p.waitForTimeout(400)
    const n = await p.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' && a.effect?.target?.closest?.('[data-gb]')).length)
    ok(n === 0, `${eng} · ${name}: nada se mueve solo`, n)
    await close()
  }
}

async function extras (b) {
  // forced-colors (Chromium emulado): acciones con borde del sistema, tarjetas delimitadas, foco con contorno
  for (const [file, qs] of [['cart.html', 'v=01'], ['checkout.html', 'v=01'], ['product-card.html', 'v=03'], ['order-history.html', 'v=01'], ['promo.html', ''], ['product-grid.html', 'v=01'], ['quick-view.html', 'v=01&abierta=01']]) {
    const { p, close } = await open(b, file, qs, { fc: true })
    const s = await p.evaluate(() => [...document.querySelectorAll('[data-gb] .g-btn--variant-solid, [data-gb] .g-btn--variant-outline')].filter((x) => x.getBoundingClientRect().height).map((x) => getComputedStyle(x).borderTopStyle))
    ok(s.every((x) => x !== 'none'), `chromium · forced-colors · ${file} ${qs}: las acciones con borde del sistema`, s.join(','))
    const cards = await p.evaluate(() => [...document.querySelectorAll('[data-gb] .g-card--level-outlined, [data-gb] .g-card--level-raised')].map((x) => getComputedStyle(x).borderTopStyle))
    ok(cards.every((x) => x !== 'none'), `chromium · forced-colors · ${file} ${qs}: tarjetas delimitadas`, cards.join(','))
    const bad = []; let fine = 0
    for (let i = 0; i < 8; i++) {
      await p.keyboard.press('Tab')
      const f = await p.evaluate(() => { const el = document.activeElement; if (!el || !el.closest('[data-gb]')) return null; const ring = (x, pe) => { if (!x) return false; const c = getComputedStyle(x, pe); return c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0 }; return ring(el) || ring(el.closest('.g-card'), '::after') || ['.g-input__row', '.g-input__control', '.g-number-field__control', '.g-checkbox__box', '.g-radio-group__option', '.g-select__control'].some((s) => ring(el.closest(s))) || ring(el.parentElement) || ring(el.closest('label')) })
      if (f === true) fine++; else if (f === false) bad.push(i)
    }
    ok(!bad.length, `chromium · forced-colors · ${file} ${qs}: foco con contorno del sistema (${fine})`, bad.join(','))
    await close()
  }
  // RTL a 390: sin desbordar; los títulos de sección arrancan del borde derecho
  for (const [name, file, q0] of PAGES) {
    const { p, close } = await open(b, file, q0, { vw: 390, vh: 844 })
    await p.evaluate(() => { document.documentElement.dir = 'rtl' }); await settle(p, 150)
    ok(!(await overflow(p)), `chromium · rtl · ${name}: sin desplazamiento horizontal a 390`)
    const al = await p.evaluate(() => [...document.querySelectorAll('[data-gb] .g-section__title')].filter((t) => t.getBoundingClientRect().width).every((t) => { const s = t.getBoundingClientRect(); const c = t.closest('.g-section').getBoundingClientRect(); return Math.abs(s.right - c.right) < 1.5 }))
    ok(al, `chromium · rtl · ${name}: los títulos de sección arrancan del borde derecho`)
    await close()
  }
}

for (const eng of ENGINES) {
  const b = await pw[eng].launch()
  try {
    if (run('structure')) await structure(b, eng)
    if (run('choice')) await choice(b, eng)
    if (run('motion')) await motion(b, eng)
    for (const tema of THEMES) {
      for (const dark of [false, true]) {
        if (run('generic')) await generic(b, eng, tema, dark)
        if (run('photo')) await photo(b, eng, tema, dark)
        if (run('states')) await states(b, eng, tema, dark)
      }
      if (run('shapes')) await shapes(b, eng, tema)
      if (run('focus')) await focusPass(b, eng, tema)
    }
    if (eng === 'chromium' && run('extras')) await extras(b)
  } finally { await b.close() }
}
stop()
report('Auditoría de @grana/blocks/ecommerce')
