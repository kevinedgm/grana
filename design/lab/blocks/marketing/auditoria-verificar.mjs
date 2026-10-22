// Verificación propia de coco · auditoría (paso 5, flujo reducido #766) de @grana/blocks/marketing (Marketing P0).
// Sobre los bloques REALES (packages/blocks/dist/marketing.js + packages/vue/dist) en el banco de bruno
// (packages/blocks/playground/marketing/*.html), con el tema por defecto y los dos del CLI (rústico y lujo), claro y oscuro,
// en Chromium, Firefox y WebKit. Común (servidor, colores y contraste) en ../../hero/auditoria-comun.mjs.
//   GRANA_PW_PORT=4216 node design/lab/blocks/marketing/auditoria-verificar.mjs [--engines=chromium] [--verbose]
// Requiere `npm run build` en packages/vue y packages/blocks. Cada fallo es un hallazgo de auditoria.md (MK-A…).
import { serve, stop, pw, ENGINES, ok, note, report, HELPERS, settle } from '../../hero/auditoria-comun.mjs'

const ORIGIN = (await serve()).replace(/\/packages\/vue\/playground\/$/, '')
const BASE = `${ORIGIN}/packages/blocks/playground/marketing/`
const PAGES = [
  ['hero 01', 'hero.html', 'v=01'], ['hero 02', 'hero.html', 'v=02'], ['hero 03', 'hero.html', 'v=03'],
  ['features', 'features.html', ''], ['stats', 'stats.html', ''], ['testimonials', 'testimonials.html', ''],
  ['cta 01', 'cta.html', 'v=01'], ['cta 02', 'cta.html', 'v=02'], ['cta 03', 'cta.html', 'v=03'],
  ['faq 01', 'faq.html', 'v=01'], ['faq 02', 'faq.html', 'v=02'], ['faq 03', 'faq.html', 'v=03'],
  ['newsletter', 'newsletter.html', ''], ['blog-list', 'blog-list.html', ''], ['footer', 'footer.html', '']
]
const THEMES = ['defecto', 'rustico', 'lujo']

async function open (b, file, qs = '', { vw = 1440, vh = 900, rm = false, fc = false } = {}) {
  const ctx = await b.newContext({ viewport: { width: vw, height: vh }, reducedMotion: rm ? 'reduce' : 'no-preference', forcedColors: fc ? 'active' : 'none' })
  const p = await ctx.newPage()
  const errs = []
  p.on('console', (m) => { const t = m.text(); if ((m.type() === 'error' && !/favicon/.test(t)) || (m.type() === 'warning' && /\[Vue warn\]|\[Grana /.test(t))) errs.push(t.slice(0, 160)) })
  p.on('pageerror', (e) => errs.push(String(e).slice(0, 160)))
  const url = `${BASE}${file}${qs ? '?' + qs : ''}`
  for (let i = 0; ; i++) {
    try { await p.goto(url, { waitUntil: 'domcontentloaded' }); await p.waitForSelector('html[data-ready="1"] [data-gb]', { timeout: 20000 }); break } catch (e) { if (i >= 2) throw e }
  }
  await p.evaluate(() => document.fonts.ready)
  await p.evaluate(HELPERS)
  await settle(p, 150)
  p.__errs = errs
  return { p, close: () => ctx.close() }
}
const overflow = (p) => p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)

// En la página: texto, controles y márgenes del navegador de cada bloque
const SCAN = () => {
  const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && !e.closest('[hidden], [inert], .g-sr-only') }
  const ownText = (e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
  const sizes = {}
  for (const k of ['caption', 'body-sm', 'body', 'title-sm', 'title', 'title-lg', 'display']) {
    const d = document.createElement('div'); d.style.fontSize = `var(--g-text-${k}-size)`; document.body.append(d); sizes[k] = parseFloat(getComputedStyle(d).fontSize); d.remove()
  }
  const tokenSizes = Object.values(sizes)
  { const d = document.createElement('div'); d.style.inlineSize = 'var(--g-space-1)'; document.body.append(d); window.__space = parseFloat(getComputedStyle(d).width); d.remove() }
  return [...document.querySelectorAll('[data-gb]')].map((blk) => {
    const text = []; const ctl = []; const margins = []
    for (const e of blk.querySelectorAll('*')) {
      if (!vis(e) || e.closest('svg, .g-hero__media, .g-hero__photo, img')) continue
      const cs = getComputedStyle(e)
      if (ownText(e)) {
        const fs = parseFloat(cs.fontSize); const bold = Number(cs.fontWeight) >= 700
        const large = fs >= 24 || (bold && fs >= 18.66)
        const r = window.__c.text(e)
        // ¿Lo tipografía un componente? (alguna clase g-* propia o de un antepasado dentro del bloque con font-size propio)
        text.push({ tag: e.tagName, cls: String(e.className).slice(0, 40), t: e.textContent.trim().slice(0, 32), fs, r, need: large ? 3 : 4.5, style: cs.fontStyle, token: tokenSizes.some((s) => Math.abs(s - fs) < 0.3) })
      }
      if (e.matches('a[href], button, input, select, textarea, [tabindex="0"]')) {
        // El área es la del control o la de su caja: GInput, la fila; GCard enlace (el título estira su ::after), la tarjeta;
        // una radio visualmente oculta (vistas de GHero), su etiqueta
        const box = e.matches('input') ? (e.closest('.g-input__row, .g-input__control') || e.closest('label') || (e.id && document.querySelector(`label[for="${e.id}"]`)) || e) : (e.closest('.g-card__primary, .g-card__title') && e.closest('.g-card--interaction-link, .g-card--interaction-button, .g-card')) || e
        const r = box.getBoundingClientRect()
        ctl.push({ tag: e.tagName, t: (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 24), x: r.left + r.width / 2, y: r.top + r.height / 2, l: r.left, r: r.right, tp: r.top, b: r.bottom, w: Math.round(r.width), h: Math.round(r.height) })
      }
      if (!/(^|\s)g-/.test(String(e.className)) && !e.closest('.g-hero') && !e.parentElement.classList.contains('g-adaptive-layout')) {
        const m = [cs.marginTop, cs.marginRight, cs.marginBottom, cs.marginLeft].map(parseFloat)
        // El ritmo de GText (#851, #856) es margen propio del bloque, no del navegador: un elemento dentro del ámbito de una GText
        // (sin un componente g-* de por medio salvo otra GText) puede llevar space × 3 / 2,5 / 2 arriba y abajo según el tamaño de la
        // GText más cercana, y 0 en línea. Cualquier otro margen sigue siendo del navegador.
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
    return { gb: blk.dataset.gb, text, ctl, margins, sizes }
  })
}

async function generic (b, eng, tema, dark) {
  const mode = `${eng} · ${tema}${dark ? ' · oscuro' : ''}`
  for (const [name, file, q] of PAGES) {
    const qs = [q, `tema=${tema}`, dark ? 'dark=1' : ''].filter(Boolean).join('&')
    const { p, close } = await open(b, file, qs)
    const blocks = await p.evaluate(SCAN)
    for (const blk of blocks) {
      const id = `${mode} · ${blk.gb}`
      const low = blk.text.filter((x) => x.r < x.need)
      ok(!low.length, `${id}: contraste del texto ≥ 4,5:1 (grande 3:1)`, low.map((x) => `${x.t} ${x.r}`).join('; '))
      if (!dark) note(`${id}: contraste mínimo ${Math.min(...blk.text.map((x) => x.r))}:1`)
      const smallT = blk.text.filter((x) => x.fs < 12)
      ok(!smallT.length, `${id}: texto ≥ 12 px`, smallT.map((x) => `${x.t} ${x.fs}`).join('; '))
      // WCAG 2.5.8: ≥ 24 × 24 o, si es menor, un círculo de 24 px centrado en él no toca otro control ni el círculo de otro menor
      const small = (c) => c.w < 24 || c.h < 24
      const hits = (c, o) => { const dx = Math.max(o.l - c.x, 0, c.x - o.r); const dy = Math.max(o.tp - c.y, 0, c.y - o.b); return Math.hypot(dx, dy) < 12 || (small(o) && Math.hypot(c.x - o.x, c.y - o.y) < 24) }
      const tiny = blk.ctl.filter((c) => small(c) && blk.ctl.some((o) => o !== c && hits(c, o)))
      ok(!tiny.length, `${id}: controles ≥ 24 × 24 o con la separación de 2.5.8`, tiny.map((c) => `${c.tag} «${c.t}» ${c.w}×${c.h}`).join('; '))
      const under = blk.ctl.filter(small)
      if (under.length && !dark) note(`${id}: ${under.length} enlace(s) de texto por debajo de 24 px de alto con la separación de 2.5.8 (${[...new Set(under.map((c) => c.h))].join('/')} px)`)
      if (!dark) {
        // MK: texto sin estilo — tamaño fuera de la escala del tema o cursiva del navegador (regla 7 de _comun.md)
        if (!/^hero/.test(blk.gb)) {
          const off = blk.text.filter((x) => !x.token)
          ok(!off.length, `${id}: todo el texto en un tamaño de la escala del tema (regla 7)`, [...new Set(off.map((x) => `${x.tag.toLowerCase()} ${x.fs}px «${x.t}»`))].slice(0, 4).join('; '))
          const it = blk.text.filter((x) => x.style === 'italic')
          ok(!it.length, `${id}: sin cursiva del navegador (address, cite)`, [...new Set(it.map((x) => x.tag.toLowerCase()))].join(','))
        }
        ok(!blk.margins.length, `${id}: sin márgenes del navegador (solo el gap de las primitivas)`, [...new Set(blk.margins)].slice(0, 5).join('; '))
      }
    }
    ok(!p.__errs.length, `${mode} · ${name}: consola limpia`, p.__errs.join(' | '))
    // Reflujo
    for (const [w, h] of [[390, 844], [320, 640]]) {
      await p.setViewportSize({ width: w, height: h }); await settle(p)
      ok(!(await overflow(p)), `${mode} · ${name}: sin desplazamiento horizontal a ${w}`)
    }
    await close()
    if (!dark) {
      const z = await open(b, file, `${qs}&zoom=2`, { vw: 320, vh: 640 })
      ok(!(await overflow(z.p)), `${mode} · ${name}: sin desplazamiento horizontal a 320 con texto al 200 %`)
      await z.close()
    }
  }
}

async function focusPass (b, eng, tema) {
  for (const [name, file, q] of PAGES) {
    const { p, close } = await open(b, file, [q, `tema=${tema}`].filter(Boolean).join('&'))
    let seen = 0; const bad = []
    for (let i = 0; i < 40; i++) {
      await p.keyboard.press('Tab')
      const r = await p.evaluate(() => {
        const el = document.activeElement
        if (!el || el === document.body || !el.closest('[data-gb]')) return null
        const ring = (x, pe = null) => { if (!x) return false; const c = getComputedStyle(x, pe); return (c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0) || c.boxShadow !== 'none' }
        return { t: (el.textContent || el.tagName).trim().slice(0, 20), ring: ring(el) || ring(el.closest('.g-card'), '::after') || ring(el.closest('.g-input__control')) || ring(el.closest('.g-input__row')) }
      })
      if (r) { seen++; if (!r.ring) bad.push(r.t) }
    }
    const n = await p.evaluate(() => document.querySelectorAll('[data-gb] a[href], [data-gb] button:not([disabled]), [data-gb] input').length)
    if (n && !seen && eng === 'webkit') note(`${eng} · ${tema} · ${name}: WebKit no lleva el Tab a los enlaces (preferencia del motor); foco medido en Chromium y Firefox`)
    else ok(!n || seen > 0, `${eng} · ${tema} · ${name}: el Tab entra en el bloque`)
    ok(!bad.length, `${eng} · ${tema} · ${name}: foco visible en todo lo enfocable (${seen})`, bad.join('; '))
    await close()
  }
}

async function structure (b, eng) {
  const E = eng
  for (const [name, file, q] of PAGES) {
    const { p, close } = await open(b, file, q)
    const s = await p.evaluate(() => {
      const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => Number(h.tagName[1]))
      const lists = [...document.querySelectorAll('[data-gb] [role="list"]')].every((l) => [...l.children].filter((c) => !c.classList.contains('g-tooltip')).every((c) => c.getAttribute('role') === 'listitem' || (c.tagName === 'LI' && /^(UL|OL)$/.test(l.tagName))))
      const uls = [...document.querySelectorAll('[data-gb] ul, [data-gb] ol')].every((l) => [...l.children].every((c) => c.tagName === 'LI'))
      return { h1: hs.filter((h) => h === 1).length, hs, lists, uls }
    })
    ok(s.h1 === (/^hero/.test(name) ? 1 : 0), `${E} · ${name}: ${/^hero/.test(name) ? 'un h1' : 'ningún h1'}`, s.h1)
    ok(s.hs.every((l, i) => !i || l <= s.hs[i - 1] + 1), `${E} · ${name}: encabezados sin saltos`, s.hs.join(','))
    ok(s.lists && s.uls, `${E} · ${name}: listas reales (role=list › listitem, ul/ol › li)`)
    await close()
    if (!/^hero/.test(name)) {
      const n = await open(b, file, [q, 'anidado=1'].filter(Boolean).join('&'))
      const lv = await n.p.evaluate(() => [...document.querySelectorAll('[data-gb]')].map((x) => x.querySelector('h2,h3,h4,h5,h6')).filter(Boolean).map((h) => Number(h.tagName[1])))
      ok(lv.every((l) => l === 3), `${E} · ${name}: anidado en una GSection, el título del bloque baja a h3`, lv.join(','))
      await n.close()
    }
  }
  // Semántica de cada sección
  let o = await open(b, 'testimonials.html')
  const t = await o.p.evaluate(() => [...document.querySelectorAll('[data-gb] figure')].map((f) => !!f.querySelector(':scope > blockquote') && !!f.querySelector(':scope > figcaption cite')))
  ok(t.length >= 12 && t.every(Boolean), `${E} · testimonials: figure › blockquote + figcaption › cite en las tres`, t.length)
  await o.close()
  o = await open(b, 'footer.html')
  const f = await o.p.evaluate(() => [...document.querySelectorAll('[data-gb^="footer"]')].map((r) => !!r.querySelector('address')))
  ok(f.every(Boolean), `${E} · footer: address en cada variante`)
  await o.close()
  o = await open(b, 'blog-list.html')
  const tm = await o.p.evaluate(() => [...document.querySelectorAll('[data-gb] time')].every((x) => /^\d{4}-\d{2}-\d{2}/.test(x.getAttribute('datetime'))))
  ok(tm, `${E} · blog-list: fechas en <time datetime> ISO`)
  await o.close()
  // Jerarquía de acciones por posición (_comun.md §3, hero.md, cta.md)
  for (const [file, q, gb, want] of [['hero.html', 'v=01', 'hero-01', 'solid,link'], ['hero.html', 'v=02', 'hero-02', 'solid,link'], ['hero.html', 'v=03', 'hero-03', 'outline,outline'], ['cta.html', 'v=01', 'cta-01', 'solid,outline'], ['cta.html', 'v=02', 'cta-02', 'solid,outline'], ['cta.html', 'v=03', 'cta-03', 'solid,link']]) {
    o = await open(b, file, q)
    const got = await o.p.evaluate((gb) => [...document.querySelectorAll(`[data-gb="${gb}"] .g-btn`)].filter((x) => !x.closest('.g-booking-bar, [class*="g-booking"]')).map((x) => (x.className.match(/g-btn--variant-(\w+)/) || [])[1]).join(','), gb)
    ok(got.startsWith(want), `${E} · ${gb}: acciones por posición ${want}`, got)
    await o.close()
  }
}

// Medidas de forma y ritmo que la auditoría pide expresamente
async function shapes (b, eng, tema) {
  const E = `${eng} · ${tema}`
  // Bandas a sangre: sin radio ni borde lateral en el borde de la caja
  for (const [file, q, gb] of [['stats.html', '', 'stats-02'], ['cta.html', 'v=01', 'cta-01'], ['newsletter.html', '', 'newsletter-03']]) {
    const { p, close } = await open(b, file, [q, `tema=${tema}`].filter(Boolean).join('&'))
    const s = await p.evaluate((gb) => { const e = document.querySelector(`[data-gb="${gb}"]`); const cs = getComputedStyle(e); return { w: e.getBoundingClientRect().width, vw: document.documentElement.clientWidth, rad: cs.borderTopLeftRadius, bl: cs.borderLeftStyle === 'none' ? 0 : parseFloat(cs.borderLeftWidth), br: cs.borderRightStyle === 'none' ? 0 : parseFloat(cs.borderRightWidth), zone: e.dataset.gZone } }, gb)
    ok(Math.abs(s.w - s.vw) <= 1 && s.zone === 'brand', `${E} · ${gb}: banda de marca de borde a borde`)
    ok(parseFloat(s.rad) === 0 && !s.bl && !s.br, `${E} · ${gb}: banda a sangre sin radio ni borde lateral en el borde de la caja`, `radio ${s.rad}, borde ${s.bl}/${s.br}`)
    await close()
  }
  // Stats: la unidad cabe en su columna (390 y 320) y, si baja de línea, empieza a ras de la cifra
  for (const [w, h] of [[1440, 900], [390, 844], [320, 640]]) {
    const { p, close } = await open(b, 'stats.html', `tema=${tema}`, { vw: w, vh: h })
    const u = await p.evaluate(() => [...document.querySelectorAll('[data-gb] .g-metric__unit')].map((x) => { const li = x.closest('[role="listitem"]').getBoundingClientRect(); const ur = x.getBoundingClientRect(); const val = x.closest('.g-metric__value'); const v = val.getBoundingClientRect(); const rg = document.createRange(); rg.selectNodeContents(val.firstChild); const num = rg.getBoundingClientRect(); const wrapped = ur.top >= num.bottom - 2; return { t: x.textContent, fits: ur.right <= li.right + 0.5 && ur.left >= li.left - 0.5, wrapped, flush: !wrapped || Math.abs(ur.left - v.left) <= 0.5 } }))
    ok(u.every((x) => x.fits), `${E} · stats a ${w}: la unidad cabe en su columna`, u.filter((x) => !x.fits).map((x) => x.t).join(','))
    ok(u.every((x) => x.flush), `${E} · stats a ${w}: la unidad que baja de línea empieza a ras de la cifra`, u.filter((x) => !x.flush).map((x) => x.t).join(','))
    await close()
  }
  // CTA: assurance no más grande que la descripción; Newsletter: legal igual y sin hueco doble tras la ayuda
  for (const v of ['01', '03']) {
    const { p, close } = await open(b, 'cta.html', `v=${v}&tema=${tema}`)
    const s = await p.evaluate(() => { const d = document.querySelector('[data-gb] .g-section__desc'); const a = document.querySelector('[data-gb] .g-text[id]'); return [parseFloat(getComputedStyle(d).fontSize), parseFloat(getComputedStyle(a).fontSize)] })
    ok(s[1] <= s[0] + 0.3, `${E} · cta-${v}: assurance no más grande que la descripción`, `${s[1]} > ${s[0]}`)
    await close()
  }
  {
    const { p, close } = await open(b, 'newsletter.html', `tema=${tema}`)
    const s = await p.evaluate(() => [...document.querySelectorAll('[data-gb^="newsletter"]')].map((r) => {
      const hint = r.querySelector('.g-input__hint, [id$="-hint"], .g-input__message, .g-input__help') || r.querySelector('.g-input [id]')
      const legal = [...r.querySelectorAll('p')].find((x) => /baja/.test(x.textContent))
      const gap = parseFloat(getComputedStyle(r.querySelector('.g-section__body, .g-card__content, .g-card__stack') || r).rowGap) || 24
      return { gb: r.dataset.gb, gapPx: legal.getBoundingClientRect().top - hint.getBoundingClientRect().bottom, fs: parseFloat(getComputedStyle(legal).fontSize), hint: parseFloat(getComputedStyle(hint).fontSize), gap }
    }))
    for (const x of s) {
      ok(x.fs <= x.hint + 2.5, `${E} · ${x.gb}: el texto legal en el tamaño secundario`, `${x.fs} px frente a la ayuda ${x.hint} px`)
      ok(x.gapPx <= 41, `${E} · ${x.gb}: sin hueco doble entre la ayuda y el texto legal (≤ gap de GForm 40 px, B-L5 regla 2)`, `${Math.round(x.gapPx)} px`)
    }
    await close()
  }
  // Columna de lectura alineada con el título de la sección (Features 03, FAQ 02)
  for (const [file, q, gb] of [['features.html', '', 'features-03'], ['faq.html', 'v=02', 'faq-02']]) {
    const { p, close } = await open(b, file, [q, `tema=${tema}`].filter(Boolean).join('&'))
    const d = await p.evaluate((gb) => { const r = document.querySelector(`[data-gb="${gb}"]`); return Math.round(r.querySelector('.g-container ul, .g-container__body > *').getBoundingClientRect().left - r.querySelector('.g-section__title').getBoundingClientRect().left) }, gb)
    ok(Math.abs(d) <= 1, `${E} · ${gb}: la columna de lectura empieza a ras del título de la sección`, `${d} px`)
    await close()
  }
  // Blog list 02/03: línea entre notas
  {
    const { p, close } = await open(b, 'blog-list.html', `tema=${tema}`)
    const d = await p.evaluate(() => ['blog-list-02', 'blog-list-03'].map((gb) => { const items = [...document.querySelector(`[data-gb="${gb}"] ul.g-stack`).children].slice(1); return [gb, items.filter((li) => { const cs = getComputedStyle(li); const prev = getComputedStyle(li.previousElementSibling); return (cs.borderTopStyle !== 'none' && parseFloat(cs.borderTopWidth) > 0) || (prev.borderBottomStyle !== 'none' && parseFloat(prev.borderBottomWidth) > 0) || /level-(outlined|raised)/.test(li.className) }).length, items.length] }))
    // #843: 02 y 03 sin línea (B-L6 reservado); las notas las separa el gap de la pila más el relleno de cada tarjeta
    for (const [gb, n, t] of d) note(`${E} · ${gb}: ${n} de ${t} notas con línea o superficie (#843)`)
    const gaps = await p.evaluate(() => ['blog-list-02', 'blog-list-03'].map((gb) => { const ul = document.querySelector(`[data-gb="${gb}"] ul.g-stack`); return [gb, parseFloat(getComputedStyle(ul).rowGap)] }))
    for (const [gb, g] of gaps) ok(g > 0, `${E} · ${gb}: las notas separadas por el gap de la pila (#843)`, `${g} px`)
    // Rejilla 01: filas sin huecos (las tarjetas de una fila, de igual alto)
    const rows = await p.evaluate(() => { const by = {}; for (const li of document.querySelectorAll('[data-gb="blog-list-01"] [role="listitem"]')) { const r = li.firstElementChild.getBoundingClientRect(); (by[Math.round(r.top)] ||= []).push(Math.round(r.height)) } return Object.values(by) })
    ok(rows.every((r) => new Set(r).size === 1), `${E} · blog-list-01: tarjetas de una misma fila con el mismo alto`, JSON.stringify(rows))
    await close()
  }
  // Testimonials: 01 tarjetas de una fila del mismo alto; 02 el avatar en el hueco media sin caja de tono
  {
    const { p, close } = await open(b, 'testimonials.html', `tema=${tema}`)
    const rows = await p.evaluate(() => { const by = {}; for (const li of document.querySelectorAll('[data-gb="testimonials-01"] [role="listitem"]')) { const r = li.firstElementChild.getBoundingClientRect(); (by[Math.round(r.top)] ||= []).push(Math.round(r.height)) } return Object.values(by) })
    ok(rows.every((r) => new Set(r).size === 1), `${E} · testimonials-01: tarjetas de una misma fila con el mismo alto`, JSON.stringify(rows))
    const m = await p.evaluate(() => { const a = document.querySelector('[data-gb="testimonials-02"] .g-avatar'); let e = a.parentElement; while (e && getComputedStyle(e).backgroundColor === 'rgba(0, 0, 0, 0)' && !e.classList.contains('g-card')) e = e.parentElement; const box = e.getBoundingClientRect(); const ar = a.getBoundingClientRect(); return { boxed: !e.classList.contains('g-card'), fill: Math.round(ar.width / box.width * 100) } })
    ok(!m.boxed, `${E} · testimonials-02: el avatar no queda en una caja de tono del hueco media`, `ocupa ${m.fill} % del ancho de la caja`)
    await close()
  }
  // Footer 01: columnas de enlaces lado a lado a 1440
  {
    const { p, close } = await open(b, 'footer.html', `v=01&tema=${tema}`)
    const xs = await p.evaluate(() => [...new Set([...document.querySelectorAll('[data-gb="footer-01"] nav .g-section')].map((s) => Math.round(s.getBoundingClientRect().left)))].length)
    ok(xs > 1, `${E} · footer-01: los grupos de enlaces en columnas a 1440`, `${xs} columna(s)`)
    const logo = await p.evaluate(() => { const i = document.querySelector('[data-gb="footer-01"] img').getBoundingClientRect(); return i.width })
    note(`${E} · footer-01: logo ${Math.round(logo)} px de ancho (B-L3)`)
    await close()
  }
  // Jerarquía: el título de un elemento (h3) por debajo del de su sección (h2)
  for (const [file, q, gb] of [['faq.html', 'v=01', 'faq-01'], ['faq.html', 'v=03', 'faq-03'], ['testimonials.html', 'v=03', 'testimonials-03']]) {
    const { p, close } = await open(b, file, [q, `tema=${tema}`].filter(Boolean).join('&'))
    const s = await p.evaluate((gb) => { const r = document.querySelector(`[data-gb="${gb}"]`); return [parseFloat(getComputedStyle(r.querySelector('.g-section__title')).fontSize), parseFloat(getComputedStyle(r.querySelector('.g-accordion-item__title')).fontSize)] }, gb)
    ok(s[1] < s[0], `${E} · ${gb}: el título de cada elemento (h3) por debajo del de la sección (h2)`, `${s[1]} px frente a ${s[0]} px`)
    await close()
  }
}

async function motion (b, eng) {
  for (const [file, q, gb] of [['faq.html', 'v=01', 'faq-01'], ['testimonials.html', 'v=03', 'testimonials-03']]) {
    for (const rm of [false, true]) {
      const { p, close } = await open(b, file, q, { rm })
      const tag = `${eng} · ${gb}${rm ? ' · reducido' : ''}`
      const s = await p.evaluate(async (gb) => {
        const root = document.querySelector(`[data-gb="${gb}"]`)
        const items = root.querySelectorAll('.g-accordion-item')
        const btn = items[1].querySelector('[aria-expanded]')
        const head = items[1].getBoundingClientRect().top
        const loadAnims = document.getAnimations().filter((a) => a.playState === 'running' && a.effect?.target?.closest?.('[data-gb]')).length
        btn.click()
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
        const all = document.getAnimations().filter((a) => a.playState === 'running' && a.effect?.target?.closest?.('[data-gb]'))
        // Con movimiento reducido solo quedan fundidos y color (patrón único, #299 (3)); lo demás es movimiento
        const anims = all.filter((a) => !/^(opacity|visibility|color)$/.test(a.transitionProperty || ''))
        const dur = Math.max(0, ...anims.map((a) => Number(a.effect.getComputedTiming().duration) || 0))
        const fades = Math.max(0, ...all.map((a) => Number(a.effect.getComputedTiming().duration) || 0))
        const mid = items[1].getBoundingClientRect().top
        await new Promise((r) => setTimeout(r, 700))
        const open1 = btn.getAttribute('aria-expanded')
        // Interrumpir: abrir otra y cerrarla en el acto
        const b2 = items[2].querySelector('[aria-expanded]')
        b2.click(); await new Promise((r) => requestAnimationFrame(r)); b2.click()
        await new Promise((r) => setTimeout(r, 700))
        const panel2 = items[2].querySelector('[role="region"], .g-accordion-item__panel')
        return { loadAnims, n: anims.length, dur, fades, moved: Math.abs(mid - head), open1, closed2: b2.getAttribute('aria-expanded'), hidden2: panel2 ? (panel2.hidden || panel2.getAttribute('hidden') !== null || panel2.getBoundingClientRect().height < 1) : true, after: Math.abs(items[1].getBoundingClientRect().top - head) }
      }, gb)
      ok(s.loadAnims === 0, `${tag}: nada se mueve solo al cargar`, s.loadAnims)
      ok(s.open1 === 'true', `${tag}: abre`)
      ok(s.moved < 0.5 && s.after < 0.5, `${tag}: el encabezado no se mueve al abrir`, `${s.moved}/${s.after}`)
      if (rm) { ok(s.n === 0, `${tag}: con movimiento reducido, sin movimiento (solo fundidos)`, `${s.n} · ${s.dur} ms`); note(`${tag}: fundido de ${s.fades} ms`) }
      else { ok(s.dur > 0 && s.dur <= 500, `${tag}: el plegado anima dentro de la duración del tema`, `${s.n} · ${s.dur} ms`); note(`${tag}: plegado de ${s.dur} ms`) }
      ok(s.closed2 === 'false' && s.hidden2, `${tag}: interrumpible (abrir y cerrar en el acto termina cerrado)`)
      await close()
    }
  }
  // Ningún bloque que no sea el héroe anima al cargar (nada se mueve solo, 2.2.2)
  for (const [name, file, q] of PAGES.filter(([n]) => !/^hero/.test(n))) {
    const { p, close } = await open(b, file, q)
    await p.waitForTimeout(300)
    const n = await p.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' && a.effect?.target?.closest?.('[data-gb]')).length)
    ok(n === 0, `${eng} · ${name}: nada se mueve solo`, n)
    await close()
  }
}

async function states (b, eng, tema, dark) {
  const E = `${eng} · ${tema}${dark ? ' · oscuro' : ''}`
  const base = [`tema=${tema}`, dark ? 'dark=1' : ''].filter(Boolean)
  for (const st of ['busy', 'error', 'done']) {
    const { p, close } = await open(b, 'newsletter.html', [...base, `estado=${st}`].join('&'))
    const r = await p.evaluate((st) => [...document.querySelectorAll('[data-gb^="newsletter"]')].map((root) => {
      const btn = root.querySelector('button[type="submit"]'); const input = root.querySelector('input')
      const msg = [...root.querySelectorAll('.g-input *')].find((e) => [...e.childNodes].some((n) => n.nodeType === 3 && /(pudimos|Listo)/.test(n.textContent)))
      return { gb: root.dataset.gb, busy: btn.getAttribute('aria-busy') === 'true' || btn.getAttribute('aria-disabled') === 'true' || btn.disabled, btnText: btn.textContent.trim(), btnR: window.__c.text([...btn.querySelectorAll('*')].find((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) || btn), invalid: input.getAttribute('aria-invalid'), msgR: msg ? window.__c.text(msg) : 0, msgT: msg ? msg.textContent.trim().slice(0, 30) : '' }
    }), st)
    for (const x of r) {
      if (st === 'busy') { ok(x.busy, `${E} · ${x.gb} · busy: el botón en carga`, x.btnText); ok(x.btnR >= 4.5, `${E} · ${x.gb} · busy: texto del botón ≥ 4,5:1`, x.btnR) }
      if (st === 'error') { ok(x.invalid === 'true', `${E} · ${x.gb} · error: aria-invalid en el campo`); ok(x.msgR >= 4.5, `${E} · ${x.gb} · error: mensaje en el campo ≥ 4,5:1`, `${x.msgT} ${x.msgR}`) }
      if (st === 'done') ok(x.msgR >= 4.5, `${E} · ${x.gb} · done: confirmación en el campo ≥ 4,5:1`, `${x.msgT} ${x.msgR}`)
    }
    ok(!p.__errs.length, `${E} · newsletter ${st}: consola limpia`, p.__errs.join(' | '))
    await close()
  }
  // FAQ 03: búsqueda sin resultados → GEmpty legible, botón ≥ 24, foco al campo
  const { p, close } = await open(b, 'faq.html', ['v=03', ...base].join('&'))
  await p.locator('[data-gb="faq-03"] input').fill('xyz'); await settle(p, 400)
  const e = await p.evaluate(() => { const em = document.querySelector('[data-gb="faq-03"] .g-empty'); if (!em) return null; const t = [...em.querySelectorAll('*')].filter((x) => [...x.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())); const bt = em.querySelector('button').getBoundingClientRect(); return { min: Math.min(...t.map((x) => window.__c.text(x))), bw: bt.width, bh: bt.height } })
  ok(!!e && e.min >= 4.5, `${E} · faq-03 sin coincidencias: vacío legible ≥ 4,5:1`, e && e.min)
  ok(!!e && e.bw >= 24 && e.bh >= 24, `${E} · faq-03 sin coincidencias: «Borrar búsqueda» ≥ 24 px`)
  await close()
}

async function extras (b) {
  // forced-colors (Chromium emulado): foco y bordes de acciones visibles en las bandas
  for (const [file, q, gb] of [['cta.html', 'v=01', 'cta-01'], ['newsletter.html', '', 'newsletter-03'], ['stats.html', '', 'stats-02']]) {
    const { p, close } = await open(b, file, q, { fc: true })
    const s = await p.evaluate((gb) => { const r = document.querySelector(`[data-gb="${gb}"]`); return [...r.querySelectorAll('.g-btn--variant-solid, .g-btn--variant-outline')].map((x) => getComputedStyle(x).borderTopStyle) }, gb)
    ok(s.every((x) => x !== 'none'), `chromium · forced-colors · ${gb}: las acciones con borde del sistema`, s.join(','))
    await p.keyboard.press('Tab'); await p.keyboard.press('Tab')
    const f = await p.evaluate(() => { const el = document.activeElement; if (!el.closest('[data-gb]')) return null; const c = getComputedStyle(el); const box = el.closest('.g-input__row, .g-input__control'); const cb = box && getComputedStyle(box); return (c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0) || (cb && cb.outlineStyle !== 'none') })
    if (f !== null) ok(f, `chromium · forced-colors · ${gb}: anillo de foco con contorno del sistema`)
    await close()
  }
  // B-L5 (#856): los seis bloques usan GText REAL (MK-L1 en 0 vale solo si la clase está puesta); ni un p desnudo con margen del navegador
  for (const [file, q, nombre, min] of [['testimonials.html', '', 'testimonials', 3], ['cta.html', 'v=01', 'cta-01', 1], ['cta.html', 'v=02', 'cta-02', 0], ['newsletter.html', '', 'newsletter', 1], ['footer.html', '', 'footer', 2], ['stats.html', 'v=03', 'stats-03', 1], ['faq.html', 'v=02', 'faq-02', 1]]) {
    const { p, close } = await open(b, file, q)
    const n = await p.evaluate(() => { const raw = [...document.querySelectorAll('[data-gb] p')].filter((e) => !/\bg-/.test(e.className) && !e.closest('[class*="g-"]:not(.g-text):not([data-gb]):not(.g-section__body)')).length; return { gt: document.querySelectorAll('[data-gb] .g-text').length, raw } })
    ok(n.gt >= min, `chromium · ${nombre}: usa GText real`, `${n.gt} GText`)
    note(`${nombre}: ${n.gt} GText; p desnudos fuera de componentes ${n.raw}`)
    await close()
  }
  // RTL (Chromium): toda la página en rtl a 390 sin desplazamiento horizontal
  for (const [name, file, q] of PAGES) {
    const { p, close } = await open(b, file, q, { vw: 390, vh: 844 })
    await p.evaluate(() => { document.documentElement.dir = 'rtl' }); await settle(p, 120)
    ok(!(await overflow(p)), `chromium · rtl · ${name}: sin desplazamiento horizontal a 390`)
    const al = await p.evaluate(() => [...document.querySelectorAll('[data-gb] .g-section__title')].every((t) => { const s = t.getBoundingClientRect(); const c = t.closest('.g-section').getBoundingClientRect(); return Math.abs(s.right - c.right) < 1.5 }))
    ok(al, `chromium · rtl · ${name}: los títulos de sección arrancan del borde derecho`)
    await close()
  }
}

for (const eng of ENGINES) {
  const b = await pw[eng].launch()
  try {
    await structure(b, eng)
    await motion(b, eng)
    for (const tema of THEMES) {
      for (const dark of [false, true]) {
        await generic(b, eng, tema, dark)
        await states(b, eng, tema, dark)
      }
      await shapes(b, eng, tema)
      if (eng !== 'webkit' || tema === 'defecto') await focusPass(b, eng, tema)
    }
    if (eng === 'chromium') await extras(b)
  } finally { await b.close() }
}
stop()
report('Auditoría de @grana/blocks/marketing')
