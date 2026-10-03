// Verificación de la ronda de personalidad r01 (kiwi). Mide cada prototipo sobre los componentes reales de dist/.
// Ejecutar: node design/lab/personalidad/r01/verificar.mjs        (Chromium; ENGINES=chromium,firefox,webkit para más)
// Usa el Playwright de design/lab/theme-playground y abre la página por file:// (no levanta servidor: no ocupa puertos).
// Requiere `npm run build` previo. VERBOSE=1 imprime cada comprobación.
const pw = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const url = new URL('./index.html', import.meta.url).href
const engines = (process.env.ENGINES || 'chromium').split(',')
const out = []

for (const engine of engines) {
  const b = await pw[engine].launch()
  let pass = 0
  const fails = [], notes = [], errs = []
  const ok = (c, m) => { if (c) pass++; else fails.push(m); if (process.env.VERBOSE) console.log(engine, c ? 'ok ' : 'NO ', m) }
  const note = (m) => notes.push(m)

  const open = async (opts = {}) => {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, ...opts })
    const p = await ctx.newPage()
    p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(`${JSON.stringify(opts)}: ${m.text()}`) })
    p.on('pageerror', (e) => errs.push(`${JSON.stringify(opts)}: ${e}`))
    await p.goto(url)
    await p.waitForFunction(() => window.__ready)
    await p.evaluate(() => {
      // Muestreo cuadro a cuadro: fn() se evalúa en cada rAF durante ms
      window.__sample = (src, ms) => new Promise((res) => {
        const fn = new Function('return (' + src + ')()')
        const xs = []; const t0 = performance.now()
        ;(function f() { xs.push({ t: performance.now() - t0, v: fn() }); if (performance.now() - t0 < ms) requestAnimationFrame(f); else res(xs) })()
      })
      window.__scaleOf = (el) => { const m = getComputedStyle(el).transform; if (!m || m === 'none') return 1; return +m.slice(m.indexOf('(') + 1).split(',')[0] }
      window.__tr = (el, pseudo) => { const t = getComputedStyle(el, pseudo).translate; if (!t || t === 'none') return [0, 0]; const [x, y = '0px'] = t.split(' '); return [parseFloat(x), parseFloat(y)] }
    })
    await p.waitForTimeout(200)
    return { p, ctx }
  }
  // Muestrea mientras se ejecuta una acción de Playwright (arranca el muestreo antes de la acción)
  const during = async (p, src, ms, action) => {
    const h = p.evaluate(([s, m]) => window.__sample(s, m), [src, ms])
    await p.waitForTimeout(16)
    await action()
    return h
  }

  for (const reduce of [false, true]) {
    const tag = reduce ? '[reduce] ' : ''
    const { p, ctx } = await open(reduce ? { reducedMotion: 'reduce' } : {})

    // ================= GBtn · B1 =================
    for (const side of ['hoy', 'p']) {
      const btn = p.locator(`#b-solid-${side}`)
      await btn.scrollIntoViewIfNeeded()
      const box = await btn.boundingBox()
      await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await p.mouse.down(); await p.waitForTimeout(260)
      const pressed = await p.evaluate((s) => __scaleOf(document.getElementById(`b-solid-${s}`)), side)
      const xs = await during(p, `() => __scaleOf(document.getElementById('b-solid-${side}'))`, 420, () => p.mouse.up())
      const vals = xs.map((x) => x.v); const max = Math.max(...vals); const last = vals.at(-1)
      const over = xs.filter((x) => x.v > 1.0005)
      if (reduce) {
        ok(pressed === 1 && max === 1, `${tag}B1 ${side}: sin escala al pulsar ni al soltar (pulsado ${pressed}, máx ${max})`)
      } else if (side === 'hoy') {
        ok(Math.abs(pressed - 0.97) < 0.002 && max <= 1.0001, `B1 hoy: pulsado 0.97 y vuelta sin rebasar (máx ${max.toFixed(4)})`)
      } else {
        ok(Math.abs(pressed - 0.97) < 0.002, `B1 p: pulsado a --g-press-scale (${pressed.toFixed(4)})`)
        ok(max > 1.002 && max <= 1.012, `B1 p: rebasa al soltar de forma sutil (máx ${max.toFixed(4)}, esperado 1.002–1.012)`)
        ok(Math.abs(last - 1) < 0.0005, `B1 p: asienta en 1 (${last.toFixed(4)})`)
        ok(over.length > 0 && over.at(-1).t < 300, `B1 p: el rebote termina antes de 300 ms (último > 1.0005 a ${over.at(-1)?.t.toFixed(0)} ms)`)
        note(`B1 escala tras soltar (cada ~16 ms): ${vals.slice(0, 18).map((v) => v.toFixed(4)).join(' ')}`)
      }
    }

    // ================= GBtn · B2 =================
    for (const side of ['hoy', 'p']) {
      const w0 = await p.evaluate((s) => document.getElementById(`b-load-${s}`).getBoundingClientRect().width, side)
      const xs = await during(p, `() => { const b = document.getElementById('b-load-${side}'); const l = b.querySelector('.g-btn__label'); const cs = getComputedStyle(l); const ld = b.querySelector('.g-btn__loader'); return { o: +cs.opacity, vis: cs.visibility, ty: __tr(l)[1], lo: ld ? +getComputedStyle(ld).opacity : null, lty: ld ? __tr(ld)[1] : null, w: b.getBoundingClientRect().width } }`, 300, () => p.click(`#b-toggle-${side}`))
      const mid = xs.filter((x) => x.v.o > 0.02 && x.v.o < 0.98)
      const w1 = xs.at(-1).v.w
      ok(Math.abs(w1 - w0) < 0.01 && xs.every((x) => Math.abs(x.v.w - w0) < 0.01), `${tag}B2 ${side}: el ancho no cambia al cargar (${w0.toFixed(2)} → ${w1.toFixed(2)})`)
      if (side === 'hoy') {
        ok(mid.length === 0 && xs.at(-1).v.vis === 'hidden', `${tag}B2 hoy: la etiqueta desaparece en un cuadro (visibility:hidden; intermedios ${mid.length})`)
      } else {
        ok(mid.length >= 2, `${tag}B2 p: la etiqueta se desvanece con valores intermedios (${mid.length} cuadros)`)
        ok(xs.at(-1).v.o === 0 && xs.at(-1).v.vis === 'visible', `${tag}B2 p: termina en opacity 0 y visible para el árbol accesible`)
        const lmid = xs.filter((x) => x.v.lo !== null && x.v.lo > 0.02 && x.v.lo < 0.98)
        ok(lmid.length >= 1, `${tag}B2 p: el indicador entra con fundido (${lmid.length} cuadros intermedios)`)
        if (reduce) ok(xs.every((x) => x.v.ty === 0 && (x.v.lty ?? 0) === 0), `${tag}B2 p: sin desplazamiento con movimiento reducido`)
        else ok(Math.min(...xs.map((x) => x.v.ty)) < -1 && xs.some((x) => (x.v.lty ?? 0) > 0.5), `B2 p: etiqueta sube (mín ${Math.min(...xs.map((x) => x.v.ty)).toFixed(2)}px) e indicador llega desde abajo`)
      }
    }
    // Nombre accesible durante la carga (árbol real del motor; solo Chromium vía CDP)
    if (engine === 'chromium' && !reduce) {
      const cdp = await ctx.newCDPSession(p)
      await cdp.send('Accessibility.enable')
      const nameOf = async (id) => {
        const { root } = await cdp.send('DOM.getDocument', { depth: -1 })
        const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '#' + id })
        const { nodes } = await cdp.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false })
        return nodes[0]?.name?.value ?? ''
      }
      const nh = await nameOf('b-load-hoy'), np = await nameOf('b-load-p')
      note(`Nombre accesible del botón EN CARGA (Chromium, árbol AX): hoy «${nh}» · propuesta «${np}»`)
      ok(np === 'Enviar informe', `B2 p: el nombre accesible sigue siendo la etiqueta en carga («${np}»)`)
    }
    for (const side of ['hoy', 'p']) await p.click(`#b-toggle-${side}`)

    // ================= GDialog · D1 =================
    for (const side of ['hoy', 'p']) {
      for (const which of ['c', 'b']) {
        const trig = p.locator(`#d-open-${which}-${side}`)
        await trig.scrollIntoViewIfNeeded()
        const tr = await trig.boundingBox()
        const vw = 1280, vh = 900
        const ex = Math.sign(tr.x + tr.width / 2 - vw / 2), ey = Math.sign(tr.y + tr.height / 2 - vh / 2)
        const xs = await during(p, `() => { const r = document.getElementById('dlg-${side}').getBoundingClientRect(); return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, o: +getComputedStyle(document.getElementById('dlg-${side}')).opacity } }`, 400, async () => { await trig.focus(); await p.keyboard.press('Enter') })
        const vis = xs.filter((x) => x.v.o > 0.01)
        const fin = xs.at(-1).v, first = vis[0]?.v
        const dx = first.cx - fin.cx, dy = first.cy - fin.cy
        if (reduce) {
          ok(Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5, `${tag}D1 ${side}/${which}: sin desplazamiento (Δ ${dx.toFixed(1)}, ${dy.toFixed(1)})`)
        } else if (side === 'hoy') {
          ok(Math.abs(dx) < 0.5, `D1 hoy/${which}: entra siempre igual, sin origen (Δx ${dx.toFixed(1)}, Δy ${dy.toFixed(1)})`)
        } else {
          // Vector esperado: un cuarto del camino al disparador, con tope de 32px; el primer cuadro visible ya avanzó algo
          const vx = Math.max(-32, Math.min(32, (tr.x + tr.width / 2 - vw / 2) * 0.25)), vy = Math.max(-32, Math.min(32, (tr.y + tr.height / 2 - vh / 2) * 0.25))
          const along = (d, v) => (Math.abs(v) < 2 ? Math.abs(d) <= 2 : Math.sign(d) === Math.sign(v) && Math.abs(d) <= Math.abs(v) + 0.5 && Math.abs(d) >= Math.abs(v) * 0.3)
          ok(along(dx, vx) && along(dy, vy), `D1 p/${which}: el primer cuadro visible está desplazado hacia el disparador (Δ ${dx.toFixed(1)}, ${dy.toFixed(1)}; vector de partida ${vx.toFixed(1)}, ${vy.toFixed(1)})`)
          ok(Math.abs(dx) <= 32.5 && Math.abs(dy) <= 32.5, `D1 p/${which}: desplazamiento con tope space × 8 (|Δ| ≤ 32px)`)
        }
        ok(Math.abs(fin.cx - vw / 2) < 1, `${tag}D1 ${side}/${which}: termina centrado (cx ${fin.cx.toFixed(1)})`)
        // Cierre: hacia el disparador
        const ys = await during(p, `() => { const d = document.getElementById('dlg-${side}'); const r = d.getBoundingClientRect(); return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, o: +getComputedStyle(d).opacity, open: d.open } }`, 300, () => p.keyboard.press('Escape'))
        const leaving = ys.filter((y) => y.v.o > 0.05 && y.v.o < 0.95)
        if (!reduce && side === 'p' && leaving.length) {
          const l = leaving.at(-1).v
          ok(Math.sign(Math.round(l.cx - fin.cx)) === ex, `D1 p/${which}: al cerrar se desplaza hacia el disparador (Δx ${(l.cx - fin.cx).toFixed(1)})`)
        } else if (!reduce && side === 'p') note(`D1 p/${which}: salida sin cuadros intermedios medibles en ${engine} (el diálogo cierra al instante donde no hay overlay/display discretos, #152)`)
        const focusBack = await p.evaluate(() => document.activeElement?.id)
        ok(focusBack === `d-open-${which}-${side}`, `${tag}D1 ${side}/${which}: el foco vuelve al disparador (${focusBack})`)
        await p.waitForTimeout(150)
      }
    }

    // ================= GDialog · D2 (#281) =================
    for (const side of ['hoy', 'p']) {
      await p.click(`#d-open-a-${side}`); await p.waitForTimeout(450)
      const before = await p.evaluate((s) => ({ d: document.getElementById(`dlg-${s}`).getBoundingClientRect().top, b: document.getElementById(`d-more-${s}`).getBoundingClientRect().top }), side)
      await p.click(`#d-more-${side}`); await p.waitForTimeout(120)
      const after = await p.evaluate((s) => { const d = document.getElementById(`dlg-${s}`).getBoundingClientRect(); return { d: d.top, bottom: d.bottom, b: document.getElementById(`d-more-${s}`).getBoundingClientRect().top } }, side)
      const db = after.b - before.b
      if (side === 'hoy') ok(db < -100, `${tag}D2 hoy: al crecer 240px el botón sube (${db.toFixed(1)}px; #281 medía 120)`)
      else {
        ok(Math.abs(db) < 0.5 && Math.abs(after.d - before.d) < 0.5, `${tag}D2 p: borde superior y botón quietos al crecer (Δ ${db.toFixed(2)}px)`)
        ok(after.bottom <= 900, `${tag}D2 p: sigue cabiendo en el visor (bottom ${after.bottom.toFixed(0)})`)
      }
      await p.keyboard.press('Escape'); await p.waitForTimeout(250)
    }

    // ================= GTabs · T1 y T2 =================
    const tabsProbe = (id) => `() => { const root = document.getElementById('${id}'); const m = root.querySelector('.g-tabs__mark'); const r = m.getBoundingClientRect(); const pn = root.querySelector('.g-tabs__panel:not([hidden])'); return { l: r.left, r: r.right, w: r.width, px: pn ? __tr(pn)[0] : null, py: pn ? __tr(pn)[1] : null, po: pn ? +getComputedStyle(pn).opacity : null, sw: document.documentElement.scrollWidth } }`
    for (const side of ['hoy', 'p']) {
      const id = `tabs-u-${side}`
      await p.locator('#' + id).scrollIntoViewIfNeeded()
      const tabBox = async (label) => p.locator(`#${id} [role="tab"]`, { hasText: label }).boundingBox()
      const a = await tabBox('Resumen'), z = await tabBox('Facturas')
      let lc0
      const cdp = engine === 'chromium' ? await ctx.newCDPSession(p) : null
      if (cdp) { await cdp.send('Performance.enable'); lc0 = (await cdp.send('Performance.getMetrics')).metrics.find((m) => m.name === 'LayoutCount').value }
      const fw = await during(p, tabsProbe(id), 380, () => p.click(`#${id} [role="tab"]:has-text("Facturas")`))
      if (cdp) { const lc1 = (await cdp.send('Performance.getMetrics')).metrics.find((m) => m.name === 'LayoutCount').value; note(`${tag}T1 ${side}: LayoutCount durante el cambio (~380 ms, ${fw.length} cuadros): ${lc1 - lc0}`) }
      const maxW = Math.max(...fw.map((x) => x.v.w)), end = fw.at(-1).v
      const stretch = maxW - Math.max(a.width, z.width)
      ok(Math.abs(end.l - z.x) < 1 && Math.abs(end.w - z.width) < 1, `${tag}T1 ${side}: la marca termina bajo «Facturas» (l ${end.l.toFixed(1)}/${z.x.toFixed(1)}, w ${end.w.toFixed(1)}/${z.width.toFixed(1)})`)
      if (reduce) ok(fw.filter((x) => x.v.l > a.x + 1 && x.v.l < z.x - 1).length === 0, `${tag}T1 ${side}: la marca salta (sin intermedios)`)
      else if (side === 'hoy') ok(stretch < 1, `T1 hoy: la marca no se estira (exceso ${stretch.toFixed(1)}px)`)
      else {
        ok(stretch > 40, `T1 p: la marca se estira en el trayecto (exceso ${stretch.toFixed(1)}px sobre el ancho mayor)`)
        const rightFirst = fw.find((x) => x.v.r > z.x + z.width - 2)?.t, leftLast = fw.find((x) => Math.abs(x.v.l - z.x) < 2)?.t
        ok(rightFirst < leftLast, `T1 p: hacia delante llega primero el borde de delante (${rightFirst?.toFixed(0)} ms) y luego el de atrás (${leftLast?.toFixed(0)} ms)`)
      }
      const fp = fw.find((x) => x.v.po !== null && x.v.po < 0.9)
      if (reduce) ok(fw.every((x) => !x.v.px && !x.v.py), `${tag}T2 ${side}: el panel no se desplaza`)
      else if (side === 'hoy') ok(fp && fp.v.px === 0 && fp.v.py > 0, `T2 hoy: el panel entra desde abajo (x ${fp?.v.px}, y ${fp?.v.py})`)
      else ok(fp && fp.v.px > 0 && fp.v.py === 0, `T2 p: hacia delante el panel llega desde el lado de inicio a fin (x ${fp?.v.px?.toFixed(1)} > 0)`)
      await p.waitForTimeout(100)
      const bw = await during(p, tabsProbe(id), 380, () => p.click(`#${id} [role="tab"]:has-text("Resumen")`))
      const bmax = Math.max(...bw.map((x) => x.v.w)) - Math.max(a.width, z.width)
      if (!reduce && side === 'p') {
        ok(bmax > 40, `T1 p: también se estira hacia atrás (exceso ${bmax.toFixed(1)}px)`)
        const bp = bw.find((x) => x.v.po !== null && x.v.po < 0.9)
        ok(bp && bp.v.px < 0, `T2 p: hacia atrás el panel llega desde el otro lado (x ${bp?.v.px?.toFixed(1)} < 0)`)
      }
      await p.waitForTimeout(100)
    }

    // ================= GCard · C1 =================
    for (const side of ['hoy', 'p']) {
      const card = p.locator(`#card-a-${side}`)
      await card.scrollIntoViewIfNeeded()
      const r0 = await card.boundingBox()
      await p.mouse.move(r0.x + 30, r0.y + 20); await p.mouse.move(r0.x + 40, r0.y + 24); await p.waitForTimeout(260)
      const st = await p.evaluate((s) => { const c = document.getElementById(`card-a-${s}`); const cs = getComputedStyle(c, '::before'); return { bg: cs.backgroundColor, img: cs.backgroundImage, glow: cs.getPropertyValue('--p-glow'), x: c.style.getPropertyValue('--p-x'), tf: getComputedStyle(c).transform } }, side)
      const r1 = await card.boundingBox()
      ok(Math.abs(r1.x - r0.x) < 0.01 && Math.abs(r1.y - r0.y) < 0.01 && Math.abs(r1.width - r0.width) < 0.01 && st.tf === 'none', `${tag}C1 ${side}: la tarjeta no se mueve en hover (#127)`)
      ok(st.bg !== 'rgba(0, 0, 0, 0)', `${tag}C1 ${side}: el velo uniforme de hover se conserva (${st.bg})`)
      if (side === 'p' && !reduce) ok(st.img.includes('radial-gradient') && st.x === '40px' && !/rgba\(0, 0, 0, 0\)|transparent/.test(st.glow.trim()) , `C1 p: halo en la posición del puntero (x ${st.x}, glow ${st.glow.trim()})`)
      else ok(st.img === 'none', `${tag}C1 ${side}: sin halo (${st.img.slice(0, 30)})`)
      await p.mouse.move(5, 5); await p.waitForTimeout(200)
    }

    // ================= GInput · I1 e I2 =================
    for (const side of ['hoy', 'p']) {
      await p.locator(`#in-send-${side}`).scrollIntoViewIfNeeded()
      const xs = await during(p, `() => { const w = document.getElementById('in-mail-w-${side}'); const m = w.querySelector('.g-input__message'); const row = w.querySelector('.g-input__row'); return { o: +getComputedStyle(m).opacity, ty: __tr(m)[1], txt: m.textContent.length, rx: __tr(row)[0] } }`, 420, () => p.click(`#in-send-${side}`))
      const shown = xs.filter((x) => x.v.txt > 0)
      const mid = shown.filter((x) => x.v.o > 0.02 && x.v.o < 0.98)
      const rx = xs.map((x) => x.v.rx), amp = Math.max(...rx.map(Math.abs))
      if (side === 'hoy') {
        ok(mid.length === 0, `${tag}I1 hoy: el mensaje aparece en un cuadro (intermedios ${mid.length})`)
        ok(amp === 0, `${tag}I2 hoy: sin vaivén`)
      } else {
        ok(mid.length >= 2, `${tag}I1 p: el mensaje entra con fundido (${mid.length} cuadros intermedios)`)
        if (reduce) {
          ok(shown.every((x) => x.v.ty === 0), `${tag}I1 p: sin desplazamiento con movimiento reducido`)
          ok(amp === 0, `${tag}I2 p: sin vaivén con movimiento reducido (el error sigue con borde, icono y texto)`)
        } else {
          ok(Math.min(...shown.map((x) => x.v.ty)) < -0.5, `I1 p: el mensaje baja desde el campo (mín ${Math.min(...shown.map((x) => x.v.ty)).toFixed(2)}px)`)
          ok(amp > 2 && amp <= 4.01, `I2 p: un vaivén con amplitud ≤ space × 1 (máx ${amp.toFixed(2)}px)`)
          ok(Math.abs(rx.at(-1)) < 0.01, `I2 p: vuelve a 0 (${rx.at(-1)})`)
          const signs = rx.filter((v) => Math.abs(v) > 0.3).map(Math.sign); let flips = 0; for (let i = 1; i < signs.length; i++) if (signs[i] !== signs[i - 1]) flips++
          ok(flips >= 2 && flips <= 4, `I2 p: decreciente, ${flips} cambios de sentido`)
          note(`I2 x de la fila (px por cuadro): ${rx.filter((v, i) => i < 18).map((v) => v.toFixed(2)).join(' ')}`)
          // Escribir y salir del campo no lo repite
          await p.fill(`#in-mail-${side}`, 'ana'); await p.locator(`#in-name-${side}`).focus(); await p.waitForTimeout(60)
          const again = await p.evaluate(() => document.querySelector('#in-mail-w-p .g-input__row').getAnimations().length)
          ok(again === 0, `I2 p: escribir y salir del campo no repite el vaivén (${again} animaciones)`)
        }
      }
      await p.click(`#in-clear-${side}`); await p.waitForTimeout(80)
    }

    // ================= GMenu · M1 y M2 =================
    for (const side of ['hoy', 'p']) {
      const trig = p.locator(`#menu-${side}-trigger`)
      await trig.scrollIntoViewIfNeeded()
      const casc = await during(p, `() => [...document.querySelectorAll('#t-menu ~ .k-pair .k-frame${side === 'p' ? '.p' : ':not(.p)'} .g-menu__list:popover-open > li')].map((li) => +getComputedStyle(li).opacity)`, 320, () => trig.click())
      const spread = casc.map((x) => (x.v.length >= 5 ? x.v[0] - x.v[4] : 0))
      const maxSpread = Math.max(...spread)
      if (side === 'p' && !reduce) {
        ok(maxSpread > 0.05, `M2 p: cascada (1.º por delante del 5.º hasta ${maxSpread.toFixed(2)} de opacidad)`)
        ok(casc.at(-1).v.every((o) => o === 1), `M2 p: todos visibles a los 320 ms`)
      } else ok(maxSpread < 0.01, `${tag}M2 ${side}: sin cascada (diferencia máx ${maxSpread.toFixed(3)})`)
      await p.waitForTimeout(150)
      const items = p.locator(`.k-frame${side === 'p' ? '.p' : ':not(.p)'} .g-menu__list:popover-open > li > .g-menu__item`)
      const b1 = await items.nth(0).boundingBox(), b4 = await items.nth(3).boundingBox()
      await p.mouse.move(b1.x + 20, b1.y + b1.height / 2); await p.waitForTimeout(220)
      const probe = `() => { const list = document.querySelector('.k-frame${side === 'p' ? '.p' : ':not(.p)'} .g-menu__list:popover-open'); const lit = [...list.querySelectorAll(':scope > li > .g-menu__item')].filter((i) => getComputedStyle(i).backgroundColor !== 'rgba(0, 0, 0, 0)').length; return { lit, hy: __tr(list, '::before')[1], ho: +getComputedStyle(list, '::before').opacity } }`
      const sweep = await during(p, probe, 220, () => p.mouse.move(b4.x + 20, b4.y + b4.height / 2, { steps: 3 }))
      const maxLit = Math.max(...sweep.map((x) => x.v.lit))
      if (side === 'hoy') {
        if (!reduce) ok(maxLit >= 2, `M1 hoy: al barrer quedan ${maxLit} elementos con fondo a la vez (estela)`)
        else note(`${tag}M1 hoy: máx ${maxLit} elementos con fondo a la vez al barrer`)
      } else {
        ok(maxLit === 0, `${tag}M1 p: ningún elemento pinta su propio fondo (máx ${maxLit})`)
        const offs = await items.evaluateAll((els) => els.map((el) => el.offsetTop))
        const off4 = offs[3]
        const inter = sweep.filter((x) => offs.every((o) => Math.abs(x.v.hy - o) > 0.5)).length
        if (reduce) ok(inter === 0, `${tag}M1 p: el resaltado salta de elemento en elemento (${inter} posiciones intermedias)`)
        else ok(inter >= 2, `M1 p: un solo resaltado recorre el camino (${inter} cuadros entre elementos)`)
        ok(Math.abs(sweep.at(-1).v.hy - off4) < 0.5 && sweep.at(-1).v.ho === 1, `${tag}M1 p: termina sobre el 4.º elemento (${sweep.at(-1).v.hy} / ${off4})`)
        await p.mouse.move(b4.x - 200, b4.y + 300); await p.waitForTimeout(60)
        await p.keyboard.press('ArrowDown'); await p.waitForTimeout(250)
        const kb = await p.evaluate(() => { const f = document.activeElement; const list = f.closest('.g-menu__list'); return { f: f.offsetTop, hy: parseFloat(getComputedStyle(list, '::before').translate.split(' ')[1] || 0) } })
        ok(Math.abs(kb.f - kb.hy) < 0.5, `${tag}M1 p: con teclado, el resaltado sigue al foco (${kb.hy} / ${kb.f})`)
      }
      await p.keyboard.press('Escape'); await p.waitForTimeout(200)
    }

    // RTL rápido de T2: el signo se espeja
    if (!reduce) {
      await p.evaluate(() => document.querySelector('#tabs-u-p').closest('.k-frame').setAttribute('dir', 'rtl'))
      await p.waitForTimeout(150)
      const rt = await during(p, tabsProbe('tabs-u-p'), 200, () => p.click('#tabs-u-p [role="tab"]:has-text("Actividad")'))
      const fp = rt.find((x) => x.v.po !== null && x.v.po < 0.9)
      ok(fp && fp.v.px < 0, `T2 p RTL: hacia delante el panel llega desde la derecha (x ${fp?.v.px?.toFixed(1)} < 0)`)
    }
    await ctx.close()
  }

  // ================= Táctil: sin halo (hover: none) =================
  if (engine === 'chromium') {
    const { p, ctx } = await open({ hasTouch: true, isMobile: true, viewport: { width: 375, height: 812 } })
    const hv = await p.evaluate(() => matchMedia('(hover: hover)').matches)
    await p.locator('#card-a-p').tap()
    const img = await p.evaluate(() => getComputedStyle(document.getElementById('card-a-p'), '::before').backgroundImage)
    ok(!hv && img === 'none', `C1 táctil: sin halo (hover:hover ${hv}, ${img})`)
    // 375px: el panel que llega de lado no crea desborde horizontal
    await p.locator('#tabs-u-p').scrollIntoViewIfNeeded()
    const sw0 = await p.evaluate(() => document.documentElement.scrollWidth)
    const xs = await during(p, `() => document.documentElement.scrollWidth`, 300, () => p.locator('#tabs-u-p [role="tab"]').nth(1).tap())
    ok(Math.max(...xs.map((x) => x.v)) <= Math.max(sw0, 375), `T2 p 375px: sin desborde horizontal durante la entrada (máx scrollWidth ${Math.max(...xs.map((x) => x.v))}, antes ${sw0})`)
    await ctx.close()
  }

  const clean = errs.filter((e) => !/development build of Vue|production build/.test(e))
  ok(clean.length === 0, `Consola limpia (${clean.length})`)
  out.push({ engine, pass, fails, notes, errs: clean })
  await b.close()
}

for (const r of out) {
  console.log(`\n== ${r.engine}: ${r.pass}/${r.pass + r.fails.length}`)
  for (const f of r.fails) console.log('  NO  ' + f)
  for (const n of r.notes) console.log('  ·   ' + n)
  for (const e of r.errs) console.log('  consola: ' + e)
}
process.exitCode = out.some((r) => r.fails.length) ? 1 : 0
