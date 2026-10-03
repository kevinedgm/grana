// Verificación de GAvatar r01 (kiwi): Chromium, Firefox y WebKit.
// Ejecutar: node design/lab/avatar/r01/verificar.mjs   (usa el Playwright de design/lab/theme-playground)
// Antes, si cambian las reglas de categorías: node design/lab/avatar/r01/generar-temas.mjs
const pw = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const base = new URL('./index.html', import.meta.url).href
const UNITS = { xs: 5, sm: 6, md: 8, lg: 10, xl: 16 }
const SIZES = Object.keys(UNITS)
const report = []
const hashes = {}

// Imagen de prueba para la ruta lenta (SVG válido en los tres motores); la respuesta se retiene hasta soltarla
const SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#777"/></svg>'

for (const engine of ['chromium', 'firefox', 'webkit']) {
  const b = await pw[engine].launch()
  let pass = 0; const fails = []; const notes = []; const errs = []
  const ok = (c, m) => { if (c) pass++; else fails.push(m) }
  const open = async (opts = {}, query = '') => {
    const ctx = await b.newContext({ viewport: { width: opts.width ?? 1280, height: 900 }, reducedMotion: opts.reducedMotion ?? 'no-preference' })
    const p = await ctx.newPage()
    p.on('console', (m) => {
      const t = m.text()
      if (m.type() === 'error' && /Failed to load resource|ERR_NAME_NOT_RESOLVED|404|status of 404/.test(t)) return  // URL rotas a propósito
      if (['error', 'warning'].includes(m.type())) errs.push(`${m.type()}: ${t.slice(0, 200)}`)
    })
    p.on('pageerror', (e) => errs.push(`pageerror: ${e}`))
    let release; const held = new Promise((res) => { release = res })
    p.releaseSlow = () => release()
    await p.route('**/avatar.invalid/lento.png', async (r) => { await held; await r.fulfill({ status: 200, contentType: 'image/svg+xml', body: SVG }) })
    await p.route('**/avatar.invalid/roto*.png', (r) => r.fulfill({ status: 404, contentType: 'text/plain', body: 'no' }))
    await p.goto(base + query, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(600)
    return p
  }
  const rect = (p, sel) => p.evaluate((s) => { const r = document.querySelector(s)?.getBoundingClientRect(); return r && { x: r.x, y: r.y, w: r.width, h: r.height } }, sel)
  const near = (a, b2, t = 0.51) => Math.abs(a - b2) <= t

  // ---------- 1. Tamaños exactos por space (4 y 5) ----------
  let p = await open()
  for (const src of ['img', 'ini', 'icon']) for (const s of SIZES) {
    const r = await rect(p, `[data-test="size-${src}-${s}"]`)
    ok(near(r.w, 4 * UNITS[s]) && near(r.h, 4 * UNITS[s]), `${src} ${s}: ${r.w}×${r.h} ≠ ${4 * UNITS[s]}`)
  }
  for (const s of SIZES) {
    const r = await rect(p, `[data-test="size5-${s}"]`)
    ok(near(r.w, 5 * UNITS[s]) && near(r.h, 5 * UNITS[s]), `space 5, ${s}: ${r.w}×${r.h} ≠ ${5 * UNITS[s]}`)
  }
  // Cuadrado: misma caja
  await p.selectOption('#c-shape', 'square'); await p.waitForTimeout(50)
  for (const s of SIZES) { const r = await rect(p, `[data-test="size-ini-${s}"]`); ok(near(r.w, 4 * UNITS[s]) && near(r.h, 4 * UNITS[s]), `square ${s}: ${r.w}×${r.h}`) }
  await p.selectOption('#c-shape', 'circle'); await p.waitForTimeout(50)

  // ---------- 2. Iniciales derivadas ----------
  const cases = await p.evaluate(() => [...document.querySelectorAll('#t-initials tbody tr')].map((tr) => {
    const get = (r) => { const a = tr.querySelector(`[data-role=${r}]`); return { text: a.querySelector('.x-avatar__initials')?.textContent ?? null, icon: !!a.querySelector('.x-avatar__icon svg') } }
    return { id: tr.dataset.case, exp: tr.dataset.expected, expXs: tr.dataset.expectedXs, md: get('md'), xs: get('xs') }
  }))
  for (const c of cases) {
    if (c.exp === undefined) { notes.push(`${c.id}: md «${c.md.text}», xs «${c.xs.text}» (sin esperado: grafema que da Intl.Segmenter)`); continue }
    if (c.exp === '') { ok(c.md.text === null && c.md.icon && c.xs.text === null && c.xs.icon, `${c.id}: esperaba icono, md «${c.md.text}» xs «${c.xs.text}»`); continue }
    ok(c.md.text === c.exp, `${c.id} md: «${c.md.text}» ≠ «${c.exp}»`)
    ok(c.xs.text === c.expXs, `${c.id} xs: «${c.xs.text}» ≠ «${c.expXs}»`)
  }
  ok(await p.evaluate(() => [...document.querySelectorAll('.x-avatar__initials')].every((s) => s.getAttribute('dir') === 'auto')), 'iniciales con dir="auto"')
  // Ajuste: dos letras anchas caben en sm..xl (círculo); en xs no caben (justifica una letra)
  const fit = await p.evaluate((sizes) => sizes.map((s) => {
    const out = []
    for (const t of ['WM', 'ЖШ']) {
      const av = document.querySelector(`[data-test="fit${t === 'WM' ? '' : 'c'}-${s}"]`)
      const cs = getComputedStyle(av); const fs = parseFloat(cs.fontSize); const d = av.getBoundingClientRect().width
      const probe = document.createElement('span'); probe.textContent = t
      probe.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font:${cs.fontWeight} ${cs.fontSize}/1 ${cs.fontFamily}`
      document.body.append(probe); const w = probe.getBoundingClientRect().width; probe.remove()
      const r = d / 2, cap = 0.72 * fs, chord = 2 * Math.sqrt(r * r - (cap / 2) ** 2) - 2 * 1   // 1px de aire por lado, a la altura de las mayúsculas
      out.push({ s, t, w: +w.toFixed(1), chord: +chord.toFixed(1), fs })
    }
    return out
  }), SIZES)
  for (const f of fit.flat()) {
    if (f.s === 'xs' || f.s === 'sm') { notes.push(`${f.s} «${f.t}»: ${f.w}px en una cuerda de ${f.chord}px (fuente ${f.fs}px) → ${f.w > f.chord ? 'no cabe: una letra' : 'cabría'}`); continue }
    ok(f.w <= f.chord, `${f.s} «${f.t}» no cabe: ${f.w}px > ${f.chord}px`)
    ok(f.fs >= 12, `${f.s}: texto ${f.fs}px < 12px`)
  }
  for (const s of ['xs', 'sm']) ok(fit.flat().filter((f) => f.s === s).some((f) => f.w > f.chord), `${s}: dos letras anchas no caben (si cupieran, la regla de una letra sobraría)`)

  // ---------- 3. Contraste de iniciales e icono (tema por defecto + 12 categorías, y marca roja + 8) ----------
  const contrast = async (pg, label) => {
    const rows = await pg.evaluate(() => [...document.querySelectorAll('#col-light .x-avatar, #col-dark .x-avatar')].map((a) => {
      const cs = getComputedStyle(a); const ink = a.querySelector('svg') ? getComputedStyle(a.querySelector('svg')).stroke : cs.color
      return { scheme: a.closest('[data-theme]').dataset.theme, test: a.dataset.test, cat: a.dataset.cat ?? null, ink, bg: cs.backgroundColor, cr: window.__contrast(ink, cs.backgroundColor) }
    }))
    let min = 99, minAt = ''
    for (const r of rows) {
      if (r.bg === 'rgba(0, 0, 0, 0)' || r.bg === 'transparent') { notes.push(`${label} ${r.scheme} ${r.test}: sin relleno (categoría que el tema no declara)`); continue }
      ok(r.cr >= 4.5, `${label} ${r.scheme} ${r.test}: ${r.cr.toFixed(2)} < 4.5 (${r.ink} / ${r.bg})`)
      if (r.cr < min) { min = r.cr; minAt = `${r.scheme} ${r.test}` }
    }
    notes.push(`${label}: contraste mínimo ${min.toFixed(2)}:1 (${minAt}), ${rows.length} muestras`)
  }
  await contrast(p, 'tema cat12')
  const pm = await open({}, '?tema=marca'); await contrast(pm, 'marca+cat8'); await pm.context().close()

  // Hash: mismo nombre → misma categoría en la tarjeta y en la tabla; valores para comparar entre motores
  hashes[engine] = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll('#hash .x-avatar')].map((a) => [a.dataset.name, a.dataset.cat])))
  const same = await p.evaluate(() => { const k = (n) => window.__avatarRules.colorIndex(n, 12); return k('Ana María López') === k('  ana   maría LÓPEZ ') && k('Ana María López') === k('Ana María López') })
  ok(same, 'hash: mayúsculas, espacios y NFD dan la misma categoría')
  const dist = await p.evaluate(() => { const c = Array(8).fill(0); for (let i = 0; i < 2000; i++) c[window.__avatarRules.colorIndex('persona ' + i, 8) - 1]++; return c })
  notes.push(`hash, 2000 claves en 8 categorías: ${dist.join(' ')}`)
  ok(Math.min(...dist) > 2000 / 8 * 0.8 && Math.max(...dist) < 2000 / 8 * 1.2, `hash desigual: ${dist.join(' ')}`)

  // ---------- 4. Semántica ----------
  const sem = await p.evaluate(() => {
    const g = (t) => document.querySelector(`[data-test="${t}"]`)
    return {
      dec: [g('sem-dec').getAttribute('aria-hidden'), g('sem-dec').getAttribute('role')],
      named: [g('sem-named').getAttribute('role'), g('sem-named').getAttribute('aria-label'), g('sem-named').hasAttribute('aria-hidden')],
      imgsAlt: [...document.querySelectorAll('.x-avatar__img')].every((i) => i.getAttribute('alt') === ''),
      tabbable: [...document.querySelectorAll('.x-avatar')].some((a) => a.tabIndex >= 0 || a.querySelector('[tabindex]')),
      cardLead: document.querySelector('[data-test=card-ini]').closest('.g-card__lead')?.getAttribute('aria-hidden'),
      tblLead: document.querySelector('[data-test=tbl-lead-1]').closest('.g-table__leading')?.getAttribute('aria-hidden')
    }
  })
  ok(sem.dec[0] === 'true' && sem.dec[1] === null, 'decorativo: aria-hidden="true" sin rol')
  ok(sem.named[0] === 'img' && sem.named[1] === 'Ana María López' && !sem.named[2], 'con label: role="img" + aria-label, sin aria-hidden')
  ok(sem.imgsAlt, 'toda <img> con alt=""')
  ok(!sem.tabbable, 'ningún avatar es enfocable')
  ok(sem.cardLead === 'true' && sem.tblLead === 'true', 'en lead de GCard y leading de GTable el hueco ya es aria-hidden')
  const snap = await p.locator('#sem').ariaSnapshot()
  ok(/img "Ana María López"/.test(snap) && /img "Luis Torres"/.test(snap), `árbol: imágenes con nombre (${snap.replace(/\n/g, ' ¶ ')})`)
  ok((snap.match(/- img/g) || []).length === 2, `árbol: solo dos imágenes (decorativos fuera): ${(snap.match(/- img/g) || []).length}`)
  ok(/button "Cuenta de Ana María López"/.test(snap), 'botón del consumidor con su nombre; el avatar dentro no añade nada')
  const tblSnap = await p.locator('#tbl').ariaSnapshot()
  ok(/img "Luis Torres"/.test(tblSnap), 'celda densa: el avatar con label se lee como imagen con nombre')

  // ---------- 5. Imagen: cargando, cargada, fallida, sin salto ----------
  await p.locator('#img-states').scrollIntoViewIfNeeded(); await p.waitForTimeout(200)
  const st = (t) => p.evaluate((x) => { const a = document.querySelector(`[data-test="${x}"]`); const n = document.querySelector(`[data-next="${x}"]`); const r = a.getBoundingClientRect(); return { cls: a.className, w: r.width, h: r.height, nx: n?.getBoundingClientRect().x, img: !!a.querySelector('img'), ini: a.querySelector('.x-avatar__initials')?.textContent ?? null, iniVis: a.querySelector('.x-avatar__initials') ? getComputedStyle(a.querySelector('.x-avatar__initials')).visibility : null, icon: !!a.querySelector('.x-avatar__icon svg') } }, t)
  const slow0 = await st('img-slow')
  ok(/is-loading/.test(slow0.cls) && slow0.ini === 'LT' && slow0.iniVis === 'visible', `cargando: iniciales visibles (${slow0.cls}, ${slow0.ini})`)
  p.releaseSlow(); await p.waitForTimeout(600)
  const slow1 = await st('img-slow')
  ok(/is-loaded/.test(slow1.cls) && slow1.iniVis === 'hidden', `cargada tras la espera: ${slow1.cls}`)
  ok(slow0.w === slow1.w && slow0.h === slow1.h && near(slow0.nx, slow1.nx, 0.01), `sin salto al cargar: ${slow0.w}×${slow0.h} → ${slow1.w}×${slow1.h}; texto ${slow0.nx} → ${slow1.nx}`)
  const ok1 = await st('img-ok'); ok(/is-loaded/.test(ok1.cls), `imagen local cargada (${ok1.cls})`)
  const br = await st('img-broken')
  ok(/is-failed/.test(br.cls) && !br.img && br.ini === 'MG' && br.iniVis === 'visible', `fallida: sin <img>, iniciales (${br.cls})`)
  ok(br.w === 40 && br.h === 40 && near(br.nx, ok1.nx, 0.01), `fallida sin salto: ${br.w}×${br.h}, texto ${br.nx} vs ${ok1.nx}`)
  const brn = await st('img-broken-noname'); ok(/is-failed/.test(brn.cls) && brn.icon, 'fallida sin nombre: icono')
  const wide = await st('img-wide'); ok(wide.w === 40 && wide.h === 40 && /is-loaded/.test(wide.cls), `3:1: caja ${wide.w}×${wide.h}`)
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('[data-test=img-wide] img')).objectFit === 'cover'), 'object-fit: cover')
  const sw0 = await st('img-swap'); await p.click('#btn-swap'); const swMid = await st('img-swap'); await p.waitForTimeout(300); const sw1 = await st('img-swap')
  notes.push(`cambio de src: ${sw0.cls.match(/is-\w+/)} → ${swMid.cls.match(/is-\w+/)} → ${sw1.cls.match(/is-\w+/)}`)
  ok(/is-loaded/.test(sw1.cls) && sw0.w === sw1.w, 'cambio de src: vuelve a cargar sin salto')

  // ---------- 6. Movimiento reducido ----------
  const dur = await p.evaluate(() => getComputedStyle(document.querySelector('[data-test=img-ok] img')).transitionDuration)
  ok(dur !== '0s', `sin preferencia: fundido (${dur})`)
  const pr = await open({ reducedMotion: 'reduce' })
  const dur2 = await pr.evaluate(() => getComputedStyle(document.querySelector('[data-test=img-ok] img')).transitionDuration)
  ok(dur2 === '0s', `movimiento reducido: sin fundido (${dur2})`)
  await pr.context().close()

  // ---------- 7. Colores forzados (solo Chromium lo emula) ----------
  if (engine === 'chromium') {
    await p.emulateMedia({ forcedColors: 'active' }); await p.waitForTimeout(100)
    const fc = await p.evaluate(() => [...document.querySelectorAll('[data-test^="c-"], [data-test^="size-"]')].map((a) => { const cs = getComputedStyle(a); return { s: cs.borderTopStyle, w: parseFloat(cs.borderTopWidth), c: cs.borderTopColor } }))
    ok(fc.every((x) => x.s === 'solid' && x.w >= 1 && x.c !== 'rgba(0, 0, 0, 0)'), `colores forzados: borde visible en todos (${JSON.stringify(fc[0])})`)
    const fcBox = await rect(p, '[data-test="size-ini-md"]'); ok(fcBox.w === 32, `colores forzados: el borde no cambia el tamaño (${fcBox.w})`)
    await p.emulateMedia({ forcedColors: 'none' })
  } else notes.push('colores forzados: no emulable en este motor')

  // ---------- 8. Encaje en componentes reales ----------
  const cardAv = await rect(p, '[data-test=card-ini]'); const cardLead = await rect(p, '#card-ini .g-card__lead')
  ok(near(cardAv.w, 40) && near(cardLead.w, 40), `GCard lead: avatar ${cardAv.w}, caja ${cardLead.w} (space × 10)`)
  const frame = await p.evaluate(() => { const l = getComputedStyle(document.querySelector('#card-ini .g-card__lead')); return { bw: l.borderTopWidth, bg: l.backgroundColor } })
  notes.push(`GCard lead hoy: borde ${frame.bw} y relleno ${frame.bg} alrededor del avatar (doble forma con circle)`)
  await p.check('#c-proposal'); await p.waitForTimeout(50)
  const frame2 = await p.evaluate(() => { const l = getComputedStyle(document.querySelector('#card-ini .g-card__lead')); return { bc: l.borderTopColor, bg: l.backgroundColor } })
  ok(frame2.bg === 'rgba(0, 0, 0, 0)', 'propuesta: lead sin relleno cuando lleva avatar')
  ok(near((await rect(p, '#card-ini .g-card__lead')).w, 40), 'propuesta: la caja sigue midiendo space × 10')
  await p.uncheck('#c-proposal')
  const tl = await rect(p, '[data-test=tbl-lead-1]'); const tlb = await rect(p, '#tbl .g-table__leading')
  ok(near(tl.w, 32) && near(tlb.w, 32), `GTable leading: avatar ${tl.w}, hueco ${tlb.w} (space × 8)`)
  const rowsH = await p.evaluate(() => ['#tbl', '#tbl-text'].map((s) => [...document.querySelectorAll(`${s} tbody tr`)].map((r) => r.getBoundingClientRect().height)))
  ok(rowsH[0].every((hh, i) => near(hh, rowsH[1][i], 1)), `GTable: misma altura de fila con avatar y con leading de texto (${rowsH[0]} vs ${rowsH[1]})`)
  // GSelect: misma altura del botón; alineación del avatar con el texto
  const sel = await p.evaluate(() => {
    const btn = (id) => document.querySelector(`#${id}`)?.closest('.g-select')?.querySelector('.g-select__button') ?? document.querySelector(`#${id} .g-select__button`) ?? document.querySelector(`.g-select:has(#${id}) .g-select__button`)
    const a = document.querySelector('.g-select__value .x-avatar')
    const wrap = a?.closest('.g-select__icon'); const val = a?.closest('.g-select__value')
    const txt = val ? [...val.childNodes].filter((n) => n.nodeType === 3 || (n.nodeType === 1 && !n.classList.contains('g-select__icon'))) : []
    let tr = null
    if (txt.length) { const rg = document.createRange(); rg.setStartBefore(txt[0]); rg.setEndAfter(txt[txt.length - 1]); tr = rg.getBoundingClientRect() }
    const ar = a?.getBoundingClientRect(), wr = wrap?.getBoundingClientRect()
    const btns = [...document.querySelectorAll('#pickers .g-select__button, #pickers button[aria-haspopup="listbox"], #pickers [role="combobox"]')].map((x) => x.getBoundingClientRect().height)
    return { btns, avatar: ar && { w: ar.width, cy: ar.y + ar.height / 2 }, hueco: wr && { w: wr.width, h: wr.height }, textCy: tr && tr.y + tr.height / 2 }
  })
  notes.push(`GSelect: alturas de los controles ${sel.btns.map((x) => x.toFixed(1)).join(' / ')}; avatar ${sel.avatar?.w}px en hueco ${sel.hueco?.w?.toFixed(1)}×${sel.hueco?.h?.toFixed(1)}; centro avatar − centro texto = ${(sel.avatar?.cy - sel.textCy).toFixed(1)}px`)
  ok(sel.btns.length >= 2 && near(sel.btns[0], sel.btns[1], 0.5), `GSelect: el avatar no cambia la altura del control (${sel.btns})`)
  // GMenu: abrir y medir
  if (await p.getAttribute('[data-test=mn-trigger]', 'aria-expanded') !== 'true') await p.click('[data-test=mn-trigger]')
  await p.waitForSelector('[role=menuitem] .x-avatar', { timeout: 3000 }).catch(() => {})
  await p.waitForTimeout(500)   // fin de la entrada animada del menú (escala) antes de medir
  const mn = await p.evaluate(() => [...document.querySelectorAll('[role=menuitem]')].filter((i) => i.querySelector('.x-avatar')).map((i) => { const a = i.querySelector('.x-avatar').getBoundingClientRect(); const hu = i.querySelector('.g-menu__icon').getBoundingClientRect(); return { item: i.getBoundingClientRect().height, a: a.width, hueco: hu.width, ah: i.querySelector('.x-avatar').getAttribute('aria-hidden'), huecoHidden: i.querySelector('.g-menu__icon').getAttribute('aria-hidden') } }))
  ok(mn.length === 3, `GMenu: tres elementos con avatar (${mn.length})`)
  if (mn.length) notes.push(`GMenu: elemento ${mn[0].item.toFixed(1)}px, hueco __icon ${mn[0].hueco.toFixed(1)}px, avatar xs ${mn[0].a.toFixed(1)}px → ${mn[0].a > mn[0].hueco + 0.5 ? 'DESBORDA el hueco' : 'cabe'}`)
  ok(mn.every((m) => m.huecoHidden === 'true'), 'GMenu: el hueco __icon es aria-hidden')
  const mnSnap = await p.locator('[role=menu]').first().ariaSnapshot()
  ok(/menuitem "Ana María López"/.test(mnSnap), `GMenu: el nombre del elemento es solo la etiqueta (${mnSnap.split('\n')[1]})`)
  await p.keyboard.press('Escape')
  // GSidebar
  const sb = await p.evaluate(() => {
    const rail = document.querySelector('[data-test=sb-rail-av]'); const railRoot = document.querySelector('#sb-rail-wrap .g-sidebar')
    const ar = rail.getBoundingClientRect(), rr = railRoot.getBoundingClientRect()
    return { inside: ar.left >= rr.left && ar.right <= rr.right, btnName: document.querySelector('#sb-rail-btn')?.getAttribute('aria-label'), avHidden: rail.getAttribute('aria-hidden'), railW: rr.width, av: ar.width }
  })
  ok(sb.inside, `GSidebar riel: el avatar cabe en el riel (${sb.av}px en ${sb.railW}px)`)
  ok(sb.avHidden === 'true' && !!sb.btnName, `GSidebar riel: nombre en el botón («${sb.btnName}»), avatar decorativo`)
  // GTranscript real montado
  ok(await p.evaluate(() => document.querySelectorAll('#tx-real .g-transcript__mark').length >= 2), 'GTranscript real: marcas de hablante presentes')
  const mk = await p.evaluate(() => { const m = document.querySelector('#tx-real .g-transcript__mark'); const cs = getComputedStyle(m); return { w: m.getBoundingClientRect().width, bs: cs.borderTopStyle, bw: cs.borderTopWidth, cat: m.dataset.cat } })
  notes.push(`GTranscript marca: ${mk.w}px, borde ${mk.bs} ${mk.bw}, data-cat ${mk.cat}`)

  // ---------- 9. Estado con GBadge anclada, LTR y RTL ----------
  const badgePos = () => p.evaluate(() => [...document.querySelectorAll('#status .g-badge-anchor')].map((an) => { const a = an.querySelector('.x-avatar').getBoundingClientRect(); const bd = an.querySelector('.g-badge').getBoundingClientRect(); return { dx: (bd.x + bd.width / 2) - (a.x + a.width / 2), dy: (bd.y + bd.height / 2) - (a.y + a.height / 2), r: a.width / 2, bw: bd.width } }))
  const ltr = await badgePos()
  ok(ltr.length === 3 && ltr.every((x) => x.dx > 0 && x.dy > 0), `GBadge bottom-end en LTR: abajo a la derecha (${JSON.stringify(ltr.map((x) => [x.dx.toFixed(1), x.dy.toFixed(1)]))})`)
  const dist0 = ltr[0] && Math.hypot(ltr[0].dx, ltr[0].dy) - ltr[0].r
  notes.push(`GBadge sobre círculo lg: el centro de la insignia queda a ${dist0?.toFixed(1)}px FUERA del borde del círculo (en un cuadrado, en la esquina)`)
  const stSnap = await p.locator('#status').ariaSnapshot()
  ok(/En línea/.test(stSnap) && /Ausente/.test(stSnap) && /Ocupado/.test(stSnap), `estado con texto accesible (${stSnap.replace(/\n/g, ' ¶ ')})`)
  await p.selectOption('#c-dir', 'rtl'); await p.waitForTimeout(100)
  const rtl = await badgePos()
  ok(rtl.every((x) => x.dx < 0 && x.dy > 0), `GBadge bottom-end en RTL: se espeja (${JSON.stringify(rtl.map((x) => x.dx.toFixed(1)))})`)
  const sizesRtl = await rect(p, '[data-test="size-ini-md"]'); ok(sizesRtl.w === 32, 'RTL: sin efecto en el avatar')
  ok(await p.evaluate(() => document.querySelector('[data-case=compuesto] [data-role=md] .x-avatar__initials').textContent === 'AL'), 'RTL: «AL» no se invierte (dir="auto")')
  await p.selectOption('#c-dir', 'ltr')

  // ---------- 10. Oscuro con el control (tema real) ----------
  await p.selectOption('#c-scheme', 'dark'); await p.waitForTimeout(100)
  const dk = await p.evaluate(() => { const a = document.querySelector('[data-test=sem-dec]'); const cs = getComputedStyle(a); return window.__contrast(cs.color, cs.backgroundColor) })
  ok(dk >= 4.5, `neutro en oscuro (control de página): ${dk.toFixed(2)}`)
  await p.context().close()

  // ---------- 11. 320px: sin desplazamiento horizontal de página ----------
  const p3 = await open({ width: 320 })
  const ov = await p3.evaluate(() => document.scrollingElement.scrollWidth)
  ok(ov <= 321, `320px: ancho de página ${ov}`)
  await p3.context().close()

  ok(errs.length === 0, `consola: ${errs.join(' | ')}`)
  report.push({ engine, pass, fails, notes })
  await b.close()
}

// Hash idéntico entre motores
const [c, f, w] = ['chromium', 'firefox', 'webkit'].map((e) => JSON.stringify(hashes[e]))
const hashSame = c === f && f === w
console.log(`hash entre motores: ${hashSame ? 'idéntico' : 'DISTINTO'} ${c}`)
let total = 0, failed = 0
for (const r of report) {
  total += r.pass + r.fails.length; failed += r.fails.length
  console.log(`\n== ${r.engine}: ${r.pass}/${r.pass + r.fails.length}`)
  for (const m of r.fails) console.log('  FALLA', m)
  for (const n of r.notes) console.log('  nota ', n)
}
total += 1; if (!hashSame) failed++
console.log(`\nTOTAL ${total - failed}/${total}`)
process.exit(failed ? 1 : 0)
