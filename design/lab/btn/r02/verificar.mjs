// Verificación de la ronda r02 de GBtn (kiwi): mide la capa de propuesta de index.html sobre los tokens y el CSS reales de dist.
// Ejecutar: node design/lab/btn/r02/verificar.mjs   (ENGINES=chromium,firefox,webkit por defecto; VERBOSE=1 lista cada comprobación)
// Abre por file:// (no ocupa puertos). Requiere `npm run build` previo. Es un prototipo: prueba el comportamiento propuesto, no GBtn.
import { readFileSync, writeFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
const pw = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const base = new URL('./index.html', import.meta.url).href
const engines = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
const CONCEPTS = ['a', 'b', 'c']
const summary = {}

// Muestreo por cuadro de una función serializada
const HELPERS = `
window.__sample = (src, ms) => new Promise((res) => {
  const fn = new Function('return (' + src + ')()'); const xs = []; const t0 = performance.now();
  (function f() { xs.push({ t: performance.now() - t0, v: fn() }); if (performance.now() - t0 < ms) requestAnimationFrame(f); else res(xs) })()
});
window.__scale = (id) => new DOMMatrixReadOnly(getComputedStyle(document.getElementById(id)).transform).a;
window.__ty = (el) => { const t = getComputedStyle(el).translate; if (t === 'none') return 0; const p = t.split(' '); return parseFloat(p[1] || 0) };
window.__lum = (c) => { const m = c.match(/[\\d.]+/g).map(Number); const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]) };
window.__ratio = (a, b) => { const [x, y] = [__lum(a), __lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) };
`

for (const engine of engines) {
  const browser = await pw[engine].launch()
  let pass = 0
  const fails = [], notes = [], errs = []
  const ok = (c, m) => { if (c) pass++; else fails.push(m); if (process.env.VERBOSE) console.log(engine, c ? 'ok ' : 'NO ', m) }
  const note = (m) => notes.push(m)

  const open = async (query = '', opts = {}) => {
    const ctx = await browser.newContext({ viewport: { width: 1100, height: 1000 }, ...opts })
    const p = await ctx.newPage()
    p.on('console', (m) => { if (m.type() === 'error') errs.push(`${query}: ${m.text()}`) })
    p.on('pageerror', (e) => errs.push(`${query}: ${e}`))
    await p.goto(base + query)
    await p.waitForFunction(() => window.__ready)
    await p.evaluate(HELPERS)
    return p
  }
  const op = (p, ms, good = true) => p.evaluate(([m, g]) => { window.__op = { ms: m, ok: g } }, [ms, good])
  const away = (p) => p.mouse.move(2, 2)

  const page = await open()

  // ---------- Control: el botón de hoy parpadea con 100 ms (si esto falla, la medida no sirve) ----------
  await op(page, 100, false)
  {
    await page.waitForTimeout(400) // WebKit recién cargado no entrega los primeros cuadros
    const xs = await page.evaluate(() => { const r = __sample("() => +getComputedStyle(document.querySelector('#hoy-0 .g-btn__label')).opacity", 420); document.getElementById('hoy-0').click(); return r })
    ok(Math.min(...xs.map((x) => x.v)) < 0.5, 'control: hoy, con 100 ms la etiqueta cae por debajo de 0,5')
  }

  for (const c of CONCEPTS) {
    const id = `${c}-0`, sel = `#${id}`
    const now = c === 'b' ? `${sel} .g-btn__now` : `${sel} .g-btn__label`
    await away(page)

    // F2 · sin parpadeo: una carga de 100 ms no llega a enseñar el giro
    await op(page, 100, false)
    {
      const pending = page.evaluate(([n, l]) => __sample(`() => [+getComputedStyle(document.querySelector('${n}')).opacity, +getComputedStyle(document.querySelector('${l}')).opacity]`, 420), [now, `${sel} .g-btn__loader`])
      await page.evaluate((i) => document.getElementById(i).click(), id)
      const xs = await pending
      ok(Math.min(...xs.map((x) => x.v[0])) === 1, `${c}: 100 ms, la etiqueta no se funde`)
      ok(Math.max(...xs.map((x) => x.v[1])) === 0, `${c}: 100 ms, el giro no aparece`)
    }

    // Fallo: reposo sin marca y sin texto en la región; el mensaje es de la aplicación
    await page.waitForTimeout(100)
    ok(await page.evaluate((i) => !document.getElementById(i).matches('.is-done, .is-loading'), id), `${c}: fallo, reposo sin marca`)
    ok((await page.locator(`${sel} + .g-btn__status`).textContent()) === '', `${c}: fallo, la región queda vacía`)
    ok((await page.locator(`[data-concept="${c}"] [data-msg]`).textContent()).length > 0, `${c}: fallo, lo dice el canal de la aplicación`)

    // Δ ancho 0 entre estados, en los seis botones
    await op(page, 1600, true)
    const widths = () => page.evaluate((k) => [...document.querySelectorAll(`[data-concept="${k}"] .k-demo > .k-slot > .g-btn`)].map((b) => b.offsetWidth), c)
    const w0 = await widths()
    await page.evaluate((k) => document.querySelectorAll(`[data-concept="${k}"] .k-demo > .k-slot > .g-btn`).forEach((b) => b.click()), c)
    await page.waitForTimeout(60); const w1 = await widths()
    await page.waitForTimeout(300); const w2 = await widths()

    ok((await page.locator(`${sel} + .g-btn__status`).textContent()) === 'Guardando', `${c}: la región dice el texto de carga a la vista`)
    ok(await page.evaluate((i) => document.getElementById(i).getAttribute('aria-busy') === 'true', id), `${c}: aria-busy en carga`)

    // Hover inerte durante la carga: el puntero no cambia el fondo
    const bgShown = await page.evaluate((i) => getComputedStyle(document.getElementById(i)).backgroundColor, id)
    await page.hover(sel, { force: true }); await page.waitForTimeout(200)
    ok((await page.evaluate((i) => getComputedStyle(document.getElementById(i)).backgroundColor, id)) === bgShown, `${c}: hover en carga no cambia el fondo`)
    await away(page)

    await page.waitForFunction((i) => document.getElementById(i).classList.contains('is-done'), id)
    await page.waitForTimeout(80)
    const w3 = await widths()
    ok([w1, w2, w3].every((w) => JSON.stringify(w) === JSON.stringify(w0)), `${c}: Δ ancho 0 en reposo, pendiente, carga y acuse`)
    ok(await page.evaluate((i) => document.getElementById(i).classList.contains('is-done'), id), `${c}: acuse presente tras el éxito`)
    ok((await page.locator(`${sel} + ${c === 'c' ? '.g-tooltip + ' : ''}.g-btn__status`).textContent()) === 'Guardado', `${c}: la región anuncia doneText`)

    // Nombre accesible durante el acuse
    if (c === 'b') {
      ok(await page.locator(sel).evaluate((b) => b.querySelector('.g-btn__now').getAttribute('aria-hidden') === 'true' && !b.querySelector('.g-btn__after').hasAttribute('aria-hidden')), 'b: en el acuse el nombre pasa a la etiqueta visible (2.5.3)')
      ok((await page.getByRole('button', { name: 'Guardado', exact: true }).count()) === 1, 'b: nombre calculado «Guardado» en el acuse')
    } else {
      ok((await page.locator(`[data-concept="${c}"]`).getByRole('button', { name: 'Guardar cambios', exact: true }).count()) === 1, `${c}: el nombre no cambia en el acuse`)
    }

    // Nada supera 240 ms, con retrasos incluidos; el giro no cuenta (#299)
    const longest = await page.evaluate((k) => {
      const max = (el) => { const s = getComputedStyle(el); const d = s.transitionDuration.split(', ').map(parseFloat); const y = s.transitionDelay.split(', ').map(parseFloat); return Math.max(...d.map((v, i) => (v + (y[i % y.length] || 0)) * 1000)) }
      return Math.max(...[...document.querySelectorAll(`[data-concept="${k}"] .k-demo .g-btn, [data-concept="${k}"] .k-demo .g-btn *`)].map(max))
    }, c)
    ok(longest <= 240.5, `${c}: ninguna transición supera 240 ms (mide ${Math.round(longest)})`)

    // Sin modos: el clic durante el acuse actúa; durante la carga se ignora
    await op(page, 900, true)
    const before = await page.evaluate(() => [window.__clicks, window.__ignored || 0])
    await page.evaluate((i) => document.getElementById(i).click(), id)
    let after = await page.evaluate(() => [window.__clicks, window.__ignored || 0])
    ok(after[0] === before[0] + 1, `${c}: clic durante el acuse actúa`)
    ok(await page.evaluate((i) => { const b = document.getElementById(i); return !b.classList.contains('is-done') && b.classList.contains('is-loading') }, id), `${c}: el acuse se cierra y vuelve a cargar`)
    await page.evaluate((i) => document.getElementById(i).click(), id)
    after = await page.evaluate(() => [window.__clicks, window.__ignored || 0])
    ok(after[0] === before[0] + 1 && after[1] === before[1] + 1, `${c}: clic durante la carga ignorado`)
    await page.waitForTimeout(1100)

    // Foco y teclado: Enter acusa en menos de 100 ms y el foco no se mueve en todo el ciclo
    await page.reload(); await page.waitForFunction(() => window.__ready); await page.evaluate(HELPERS)
    await op(page, 500, true)
    await page.focus(sel)
    const bg0 = await page.evaluate((i) => getComputedStyle(document.getElementById(i)).backgroundColor, id)
    const rec = page.evaluate((i) => __sample(`() => [__scale('${i}'), getComputedStyle(document.getElementById('${i}')).backgroundColor, document.activeElement.id]`, 1000), id)
    await page.keyboard.press('Enter')
    const xs = await rec
    const first = xs.find((x) => x.v[1] !== bg0 || x.v[0] < 1)
    ok(first && first.t < 100 + xs[0].t + 40, `${c}: Enter da acuse visible en el primer cuadro útil (${first ? Math.round(first.t) : '—'} ms)`)
    ok(xs.every((x) => x.v[2] === id), `${c}: el foco no se mueve en el ciclo`)
    if (c === 'a') {
      ok(Math.abs(Math.min(...xs.map((x) => x.v[0])) - 0.97) < 0.001, 'a: con Enter se hunde a --g-press-scale')
      const peak = Math.max(...xs.map((x) => x.v[0]))
      ok(Math.abs(peak - 1.006) < 0.001, `a: al terminar sube con el rebote de B1 (pico ${peak.toFixed(4)})`)
    } else {
      ok(Math.min(...xs.map((x) => x.v[0])) === 1, `${c}: sin escala en carga`)
    }
    await page.waitForTimeout(300)
    if (c === 'a') {
      await page.waitForTimeout(1000)
      ok(await page.evaluate(() => !document.getElementById('a-0').classList.contains('is-done')), 'a: el acuse se retira solo en menos de 1,2 s')
    }
  }

  // ---------- B: los estados solo suben ----------
  {
    await op(page, 500, true)
    await page.evaluate(() => document.getElementById('b-1').click())
    await page.waitForFunction(() => document.getElementById('b-1').classList.contains('is-done'))
    await page.waitForTimeout(3700)
    const xs = await page.evaluate(() => __sample("() => { const b = document.getElementById('b-1'); return [__ty(b.querySelector('.g-btn__now')), __ty(b.querySelector('.g-btn__after')), b.classList.contains('is-done')] }", 800))
    const out = xs.filter((x) => !x.v[2])
    ok(out.length > 0 && Math.max(...out.map((x) => x.v[0])) > 0, 'b: la etiqueta vuelve desde abajo')
    ok(Math.min(...out.map((x) => x.v[1])) < 0, 'b: lo hecho sale hacia arriba')
  }

  // ---------- C: pausa, foco, Esc, Deshacer ----------
  {
    await op(page, 100, true)
    await page.evaluate(() => document.getElementById('c-1').click())
    await page.waitForFunction(() => document.querySelector('#c-1 ~ .g-tooltip:popover-open'))
    await page.waitForTimeout(300)
    await page.focus('#c-1'); await page.keyboard.press(engine === 'webkit' ? 'Alt+Tab' : 'Tab') // Safari: Tab no pasa por botones por defecto
    ok(await page.evaluate(() => document.activeElement.closest('.g-tooltip') !== null && document.activeElement.textContent === 'Deshacer'), 'c: Tab desde el botón llega a «Deshacer»')
    await page.waitForTimeout(4400)
    ok(await page.evaluate(() => !!document.querySelector('#c-1 ~ .g-tooltip:popover-open')), 'c: con el foco dentro no se retira a los 4 s')
    const u = await page.evaluate(() => { const r = document.activeElement.getBoundingClientRect(); return r.height })
    note(`c: alto visible de «Deshacer» ${u.toFixed(1)} px (la diana mide ≥ 24 por ::after)`)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(200)
    ok(await page.evaluate(() => document.activeElement.id === 'c-1' && !document.querySelector('#c-1 ~ .g-tooltip:popover-open')), 'c: Deshacer cierra y devuelve el foco al botón')

    await page.evaluate(() => document.getElementById('c-0').click())
    await page.waitForFunction(() => document.querySelector('#c-0 ~ .g-tooltip:popover-open'))
    await page.keyboard.press('Escape'); await page.waitForTimeout(200)
    ok(await page.evaluate(() => !document.querySelector('#c-0 ~ .g-tooltip:popover-open')), 'c: Esc cierra el acuse')

    await page.evaluate(() => document.getElementById('c-0').click())
    await page.waitForFunction(() => document.querySelector('#c-0 ~ .g-tooltip:popover-open'))
    await page.focus('#c-2'); await page.waitForTimeout(200)
    ok(await page.evaluate(() => !document.querySelector('#c-0 ~ .g-tooltip:popover-open')), 'c: el foco en otro control aparta el acuse (2.4.11)')

    await page.evaluate(() => document.getElementById('c-0').click())
    await page.waitForFunction(() => document.querySelector('#c-0 ~ .g-tooltip:popover-open'))
    const geo = await page.evaluate(() => { const b = document.getElementById('c-0').getBoundingClientRect(), t = document.querySelector('#c-0 ~ .g-tooltip .g-tooltip__tab').getBoundingClientRect(); return [b.left, t.left, b.width, t.width, b.bottom, t.top] })
    ok(Math.abs(geo[0] - geo[1]) < 1 && Math.abs(geo[2] - geo[3]) < 1, 'c: la pestaña mide lo que el botón y sale de su borde')
    await page.keyboard.press('Escape')
  }

  // ---------- Contraste: 7 colores × 5 variantes, en claro y oscuro ----------
  for (const theme of ['', '?theme=dark']) {
    const p = await open(theme)
    const r = await p.evaluate(() => {
      const box = document.createElement('div'); document.querySelector('[data-concept="a"]').append(box)
      const out = { same: 0, total: 0, tab: 0, check: [] }
      for (const color of ['brand', 'accent', 'neutral', 'success', 'warning', 'danger', 'info']) for (const variant of ['solid', 'soft', 'outline', 'ghost', 'link']) {
        const b = document.getElementById('a-0').cloneNode(true); b.removeAttribute('id')
        b.className = `g-btn g-btn--color-${color} g-btn--variant-${variant} g-btn--size-md is-done`
        box.append(b); out.total++
        const check = getComputedStyle(b.querySelector('.g-btn__done')).color
        if (check === getComputedStyle(b).color) out.same++
      }
      const s = getComputedStyle(document.documentElement)
      const probe = document.createElement('i'); probe.style.cssText = 'color:var(--g-color-surface);background:var(--g-color-text)'; box.append(probe)
      const q = getComputedStyle(probe); out.tab = __ratio(q.color, q.backgroundColor)
      box.remove()
      return out
    })
    ok(r.same === r.total, `contraste ${theme || 'claro'}: la marca usa el color del texto del botón en ${r.same}/${r.total} (hereda el par auditado)`)
    ok(r.tab >= 4.5, `contraste ${theme || 'claro'}: texto de la pestaña ${r.tab.toFixed(2)}:1`)
    note(`pestaña ${theme || 'claro'}: ${r.tab.toFixed(2)}:1`)
    await p.context().close()
  }

  // ---------- Movimiento reducido real (emulación del navegador) ----------
  {
    const p = await open('', { reducedMotion: 'reduce' })
    await op(p, 500, true)
    const rec = p.evaluate(() => __sample("() => [__scale('a-0'), getComputedStyle(document.querySelector('#a-0 .g-btn__done path')).strokeDashoffset, __ty(document.querySelector('#b-0 .g-btn__now')), __ty(document.querySelector('#b-0 .g-btn__after'))]", 1100))
    await p.evaluate(() => { document.getElementById('a-0').click(); document.getElementById('b-0').click(); document.getElementById('c-0').click() })
    await p.waitForTimeout(1000)
    ok(await p.evaluate(() => ['a-0', 'b-0', 'c-0'].every((i) => document.getElementById(i).classList.contains('is-done'))), 'reduce: los tres llegan al mismo estado final')
    const xs = await rec
    ok(xs.every((x) => x.v[0] === 1), 'reduce: A sin escala')
    ok(xs.every((x) => parseFloat(x.v[1]) === 0), 'reduce: el trazo aparece completo')
    ok(xs.every((x) => x.v[2] === 0 && x.v[3] === 0), 'reduce: B sin desplazamiento')
    await p.context().close()
  }

  // ---------- Colores forzados: la marca y la pestaña siguen viéndose (solo donde la emulación tiene efecto) ----------
  {
    const p = await open('', { forcedColors: 'active' })
    const active = await p.evaluate(() => matchMedia('(forced-colors: active)').matches)
    if (!active) note('forced-colors: la emulación no tiene efecto en este motor')
    else {
      await op(p, 100, true)
      await p.evaluate(() => { document.getElementById('a-0').click(); document.getElementById('c-0').click() })
      await p.waitForTimeout(350)
      const r = await p.evaluate(() => { const b = document.getElementById('a-0'), d = getComputedStyle(b.querySelector('.g-btn__done')), body = getComputedStyle(document.querySelector('#c-0 ~ .g-tooltip .g-tooltip__body')); return [d.color, getComputedStyle(b).backgroundColor, d.opacity, body.color, body.backgroundColor] })
      ok(r[0] !== r[1] && r[2] === '1', 'forced-colors: la marca de A se distingue del fondo')
      ok(r[3] !== r[4], 'forced-colors: el texto de la pestaña se distingue de su fondo')
    }
    await p.context().close()
  }

  // ---------- 320 px, RTL y parámetros ----------
  for (const [q, opts] of [['?dir=rtl', {}], ['?theme=dark&motion=reduce', {}], ['', { viewport: { width: 320, height: 700 } }]]) {
    const p = await open(q, opts)
    await op(p, 100, true)
    await p.evaluate(() => ['a-0', 'b-0', 'c-0'].forEach((i) => document.getElementById(i).click()))
    await p.waitForTimeout(350)
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `sin desborde horizontal (${q || '320 px'})`)
    if (q === '?dir=rtl') {
      const g = await p.evaluate(() => { const b = document.getElementById('c-0').getBoundingClientRect(), t = document.querySelector('#c-0 ~ .g-tooltip .g-tooltip__tab').getBoundingClientRect(); return Math.abs(b.left - t.left) })
      ok(g < 1, 'rtl: la pestaña sigue bajo su botón')
    }
    await p.context().close()
  }

  ok(errs.length === 0, `sin errores de consola (${errs.slice(0, 3).join(' | ')})`)
  summary[engine] = { pass, total: pass + fails.length, fails, notes }
  console.log(`${engine}: ${pass}/${pass + fails.length}`)
  fails.forEach((f) => console.log('  NO', f))
  await browser.close()
}

// ---------- Peso: CSS de cada bloque en gzip (estimación; el .vue no existe) ----------
const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8')
const weight = {}
for (const k of ['base', 'A', 'B', 'C']) {
  const css = html.split(`/* peso:${k} */`)[1].split(`/* fin:${k} */`)[0].replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ')
  weight[k] = gzipSync(css).length
}
summary.pesoCssGzip = weight
console.log('CSS gzip por bloque (B):', weight)
writeFileSync(new URL('./verificar-resultados.json', import.meta.url), JSON.stringify(summary, null, 1) + '\n')
