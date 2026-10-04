// Verificación de GNotice r02 (kiwi): los tres conceptos (A, B, C) en Chromium, Firefox y WebKit.
// Ejecutar: node design/lab/alert/r02/verificar.mjs   (Playwright de design/lab/theme-playground; GRANA_PW_PORT, por defecto 4209)
// Requiere `npm run build`. ENGINES=chromium CONCEPTS=A,B VERBOSE=1 para filtrar o ver todo.
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))
const PORT = Number(process.env.GRANA_PW_PORT || 4209)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json' }
const server = http.createServer(async (req, res) => {
  try {
    const path = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!path.startsWith(ROOT)) throw new Error('fuera')
    const body = await readFile(path)
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }).end(body)
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
const url = `http://127.0.0.1:${PORT}/design/lab/alert/r02/index.html`
const report = []
const FF = 'Firefox avisa de que desactiva su anclaje nativo por ajustes menores de 1px (la compensación propia sigue; solo en A)'
const ERR = 'Error: No se pudo guardar la factura. El servidor no respondió; tus datos siguen en el formulario.'

for (const engine of (process.env.ENGINES || 'chromium,firefox,webkit').split(',')) {
  const b = await pw[engine].launch()
  for (const C of (process.env.CONCEPTS || 'A,B,C').split(',')) {
    let pass = 0; const fails = []; const notes = []; const errs = []
    const ok = (c, m) => { if (c) pass++; else fails.push(m); if (process.env.VERBOSE) console.log(engine, C, c ? 'ok ' : 'NO ', m) }
    const TOL = engine === 'webkit' ? 1.5 : 1
    const open = async (opts = {}) => {
      const { vw = 1000, vh = 700, q = '', ...ctx } = opts
      const context = await b.newContext({ viewport: { width: vw, height: vh }, ...ctx })
      const p = await context.newPage()
      p.on('console', (m) => { if (!['error', 'warning'].includes(m.type())) return; if (/Scroll anchoring was disabled/.test(m.text())) { if (!notes.includes(FF)) notes.push(FF) } else errs.push(m.text()) })
      p.on('pageerror', (e) => errs.push(String(e)))
      await p.goto(`${url}?c=${C}${q}`)
      await p.waitForFunction(() => window.__S && document.querySelector('#save'))
      await p.evaluate(() => { window.__fast = true })
      await p.waitForTimeout(200)
      return p
    }
    const act = (p) => p.evaluate(() => document.activeElement?.id || document.activeElement?.tagName)
    const live = (p) => p.evaluate(() => window.__live.map((x) => ({ ...x })))
    const press = async (p, sel) => { await p.focus(sel); await p.keyboard.press('Enter') }
    const startSample = (p, sel, ms) => p.evaluate(([s, t]) => {
      window.__sample = new Promise((res) => {
        const out = []; const el = document.querySelector(s); const t0 = performance.now()
        const f = () => setTimeout(() => { out.push(el.getBoundingClientRect().top); if (performance.now() - t0 < t) requestAnimationFrame(f); else res(out) }, 0)
        requestAnimationFrame(f)
      })
    }, [sel, ms])
    const endSample = async (p) => { const a = await p.evaluate(() => window.__sample); return Math.max(...a) - Math.min(...a) }
    const tops = (p) => p.evaluate(() => ['#f-nombre', '#save', '#tb', '#card', '#d-open'].map((s) => Math.round(document.querySelector(s).getBoundingClientRect().top + scrollY)))
    const center = (p, sel) => p.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'center' }), sel)

    // ============ 1. Carga ============
    let p = await open()
    ok((await live(p)).length === 0, 'Al cargar no se anuncia nada (lo que ya estaba es contenido estático)')
    ok(await p.evaluate(() => !document.querySelector(':is(.xa-act,.xa-edge,.xa-cause,.xb-island,.xc-note):is([role=alert],[role=status],[aria-live])')), 'Ningún aviso es región viva: el anuncio va por el canal compartido de r01')
    const t0 = await tops(p)

    // ============ 2. Error de servidor al guardar ============
    await center(p, '#save'); await p.waitForTimeout(80)
    await p.focus('#save'); await p.evaluate(() => { window.__btn = document.getElementById('save') })
    await startSample(p, '#save', 900)
    await p.keyboard.press('Enter')
    let d = await endSample(p)
    let lv = await live(p)
    ok(lv.length === 1 && lv[0].ch === 'assertive' && lv[0].text === ERR, `Guardar falla: 1 anuncio enérgico (${JSON.stringify(lv)})`)
    ok((await act(p)) === 'save', `Guardar falla: el foco sigue en el botón que se pulsó (${await act(p)})`)
    ok(d <= TOL, `Guardar falla: el botón con foco no se mueve en ningún cuadro (Δ ${d.toFixed(2)}px)`)
    if (C === 'A') {
      ok(await p.evaluate(() => window.__btn === document.getElementById('save') && /Reintentar/.test(window.__btn.textContent)), 'A: el MISMO botón pasa de «Guardar» a «Reintentar»')
      ok(/group "Error: No se pudo guardar\./.test(await p.locator('#form').ariaSnapshot()), 'A: botón + mensaje forman un grupo con nombre «Error: No se pudo guardar…»')
      const t1 = await tops(p)
      ok(t1.every((v, i) => Math.abs(v - t0[i]) <= 1), `A: en ancho normal el mensaje cabe en la fila del botón: nada de la página cambia de sitio (${t1.map((v, i) => v - t0[i])})`)
    }
    if (C === 'B') {
      ok(await p.evaluate(() => document.getElementById('island').getAttribute('aria-expanded') === 'true'), 'B: lo grave abre la isla sola, sin tomar el foco')
      const t1 = await tops(p)
      ok(t1.every((v, i) => v === t0[i]), 'B: nada de la página cambia de sitio (la isla no ocupa flujo)')
      ok(/region "Estado de la aplicación"/.test(await p.locator('body').ariaSnapshot()), 'B: la isla es una región con nombre')
      ok(await p.evaluate(() => { const m = document.getElementById('save-mark'); const s = document.getElementById('save'); return m && m.tagName === 'BUTTON' && Math.abs(m.getBoundingClientRect().top + m.getBoundingClientRect().height / 2 - s.getBoundingClientRect().top - s.getBoundingClientRect().height / 2) < 2 }), 'B: junto a «Guardar» aparece la marca «No se guardó», en su misma fila (sin empujar nada)')
      ok(await p.evaluate(() => { const i = document.querySelector('.xb-island').getBoundingClientRect(); const s = document.getElementById('save').getBoundingClientRect(); return !(s.right > i.left && s.left < i.right && s.top < i.bottom && s.bottom > i.top) }), 'B: la isla abierta no tapa el control con foco (WCAG 2.4.11)')
      await p.evaluate(() => { window.__item = document.getElementById('island-save') })
    }
    if (C === 'C') {
      ok(await p.evaluate(() => [...document.querySelectorAll('#save-note .xc-step')].map((s) => s.dataset.state).join() === 'done,failed'), 'C: la nota cuenta la secuencia: enviada, falló')
      const sn = await p.locator('#form').ariaSnapshot()
      ok(/group "Error ?: No se pudo guardar la factura"/i.test(sn) && await p.evaluate(() => { const k = document.querySelector('#save-note .xc-note__kind'); return k.getClientRects().length > 0 && k.textContent.startsWith('Error') }), `C: la nota es un grupo con nombre; el tipo es una palabra visible (${(sn.match(/group "[^"]*"/) || [])[0]})`)
      ok(await p.evaluate(() => { const c = getComputedStyle(document.querySelector('#form-card .xc-region'), '::before'); return c.borderInlineStartStyle === 'solid' && parseFloat(c.borderInlineStartWidth) >= 3 }), 'C: regla sólida en el margen de la región (error)')
    }
    // ============ 3. Reintentar → éxito que se queda ============
    await p.evaluate(() => { __S.saveFails = false })
    if (C === 'A') await press(p, '#save'); else if (C === 'B') await press(p, '#island-save-action'); else await press(p, '#retry')
    await p.waitForFunction(() => __S.save === 'success'); await p.waitForTimeout(250)
    lv = await live(p)
    ok(lv.length === 2 && lv[1].ch === 'polite' && lv[1].text === 'Correcto: Factura guardada con el folio F-0042.', `Éxito: 1 anuncio cortés (${JSON.stringify(lv[1])})`)
    let a = await act(p)
    ok(a === (C === 'A' ? 'save' : C === 'B' ? 'island' : 'save-note'), `Éxito: el foco no cae al body (${a})`)
    ok(await p.evaluate(() => !!document.querySelector('a[href="#f-0042"]')), 'Éxito: el enlace a lo creado queda a la vista')
    if (C === 'A') ok(await p.evaluate(() => window.__btn === document.getElementById('save') && /Guardar/.test(window.__btn.textContent) && document.querySelector('.xa-act').dataset.type === 'success'), 'A: el botón vuelve a ser «Guardar» y la franja pasa a éxito en el sitio')
    if (C === 'B') ok(await p.evaluate(() => window.__item === document.getElementById('island-save') && window.__item.dataset.type === 'success' && document.getElementById('save-mark').dataset.type === 'success'), 'B: error → reintentando → éxito en el MISMO elemento de la isla; la marca del origen cambia con él')
    if (C === 'C') ok(await p.evaluate(() => [...document.querySelectorAll('#save-note .xc-step')].map((s) => s.dataset.state).join() === 'done,failed,ok'), 'C: la secuencia avanza en el sitio hasta «Guardada»')
    await p.waitForTimeout(900)
    ok(await p.evaluate(() => __S.save === 'success'), 'Éxito: no se cierra solo')
    // Reconocer / cerrar
    if (C === 'B') { await press(p, '#island-ack'); await p.waitForTimeout(150) } else { await press(p, '#save-close'); await p.waitForTimeout(150) }
    a = await act(p)
    ok(a === (C === 'B' ? 'island' : 'save') && await p.evaluate(() => __S.save === 'idle'), `Cerrar el resultado: foco a un control cercano, no al body (${a})`)
    if (C === 'B') ok(await p.evaluate(() => { const i = document.querySelector('.xb-island'); return !i.hidden && i.classList.contains('is-dot') && /No se pudieron cargar/.test(document.getElementById('island').textContent) }), 'B: reconocida, la isla se repliega a un punto pero NO desaparece mientras duren las condiciones; conserva su nombre accesible')
    await p.waitForTimeout(500)

    // ============ 4. Error al cargar la tabla ============
    if (C === 'B') { await press(p, '#island'); await p.waitForTimeout(100); await press(p, '#island-table-action') } else await press(p, '#tb-retry')
    await p.waitForFunction(() => __S.table === 'ok'); await p.waitForTimeout(250)
    a = await act(p)
    ok(a !== 'BODY' && await p.evaluate(() => document.querySelectorAll('#tb tbody tr').length >= 2), `Tabla: al resolverse llegan las filas y el foco de «Reintentar» no cae al body (${a})`)
    lv = await live(p)
    ok(lv.length === 3 && lv[2].ch === 'polite', 'Tabla: la resolución se anuncia una vez (cortés)')
    await press(p, '#sim-break'); await p.waitForTimeout(250)
    lv = await live(p)
    ok(lv.length === 4 && lv[3].ch === 'assertive' && (await act(p)) === 'sim-break', 'Tabla: un fallo posterior se anuncia (enérgico) y no mueve el foco')
    if (C === 'A') ok(await p.evaluate(() => !!document.querySelector('#tb .xa-cause[role=group]') && getComputedStyle(document.getElementById('tb-region')).outlineStyle === 'solid'), 'A: el fallo vive dentro de la tabla (en el hueco de las filas) y marca su contorno')
    if (C === 'B') {
      ok(await p.evaluate(() => !!document.querySelector('#tb button#tb-mark.xb-mark--link')), 'B: en el origen (el hueco de las filas) queda una marca de una línea')
      await press(p, '#tb-mark'); await p.waitForTimeout(150)
      ok((await act(p)) === 'island-table-action' && await p.evaluate(() => document.getElementById('island').getAttribute('aria-expanded') === 'true'), `B: pulsar la marca abre la isla en ese aviso y lleva el foco a su acción (${await act(p)})`)
      await press(p, '#island-table-origin'); await p.waitForTimeout(150)
      ok((await act(p)) === 'tb-region' && await p.evaluate(() => document.getElementById('island').getAttribute('aria-expanded') === 'false'), `B: «Ir a Facturas» repliega la isla y enfoca el origen (${await act(p)})`)
      ok((await live(p)).length === 4, 'B: abrir, replegar e ir al origen no anuncian nada')
    }

    // ============ 5. Condición de página ============
    await center(p, '#sim-offline'); await p.waitForTimeout(80)
    await p.focus('#sim-offline')
    await startSample(p, '#sim-offline', 900)
    await p.keyboard.press('Enter')
    d = await endSample(p)
    lv = await live(p)
    ok(lv.length === 5 && lv[4].ch === 'polite' && /^Advertencia: Sin conexión\./.test(lv[4].text), 'Página: la condición que aparece se anuncia una vez (cortés)')
    ok((await act(p)) === 'sim-offline' && d <= TOL, `Página: ni el foco ni lo que se ve se mueven (Δ ${d.toFixed(2)}px)`)
    await press(p, '#sim-online'); await p.waitForTimeout(300)
    ok((await live(p)).length === 6 && await p.evaluate(() => !!document.querySelector('[data-type=success]')), 'Página: al resolverse cambia a éxito y se anuncia una vez')
    ok(await p.evaluate(() => { const t = [...document.querySelectorAll('[aria-live]:not([aria-live=off]),[role=alert],[role=status]')].map((x) => x.textContent.trim()).filter(Boolean); return new Set(t).size === t.length }), 'Ningún texto repetido entre las regiones vivas del documento')
    await press(p, '#sim-session'); await p.waitForTimeout(300)
    ok(await p.evaluate(() => { const t = document.querySelector('[role=timer]'); return C0(t) ; function C0(t) { return t ? t.getAttribute('aria-live') === 'off' : true } }) && /5 min|6 min|5:0/.test(await p.evaluate(() => document.body.innerText)), 'Página: la cuenta atrás es visible y no es una región viva')

    // ============ 6. Diálogo ============
    const n6 = (await live(p)).length
    await press(p, '#d-open'); await p.waitForSelector('#dialog[open] #d-warn'); await p.waitForTimeout(450)
    ok((await live(p)).length === n6 && (await act(p)) === 'd-nombre', `Diálogo: la advertencia que viene con la vista no se anuncia y el foco sigue la regla de GDialog (${await act(p)})`)
    if (C === 'B') ok(await p.evaluate(() => !!document.querySelector('#dialog .xb-island') && document.querySelector('.xb-island').getBoundingClientRect().width > 0), 'B: la isla se traslada dentro del diálogo modal (fuera sería inerte)')
    await p.keyboard.press('Escape'); await p.waitForTimeout(450)
    if (C === 'B') ok(await p.evaluate(() => !!document.querySelector('.xb-home > .xb-island')), 'B: al cerrar el diálogo la isla vuelve al shell')
    ok(await p.evaluate(() => [...document.querySelectorAll('.xb-island__summary,.xb-ghost,.g-btn')].filter((x) => x.getClientRects().length).every((x) => { const r = x.getBoundingClientRect(); return r.width >= 24 && r.height >= 24 })), 'Controles ≥ 24×24')
    // B: teclado de la isla
    if (C === 'B') {
      await press(p, '#island'); await p.waitForTimeout(80)
      const open1 = await p.evaluate(() => document.getElementById('island').getAttribute('aria-expanded'))
      await p.keyboard.press('Escape'); await p.waitForTimeout(80)
      ok(open1 !== await p.evaluate(() => document.getElementById('island').getAttribute('aria-expanded')) || open1 === 'false', 'B: Enter abre o cierra la isla (aria-expanded)')
      await p.evaluate(() => { document.getElementById('island').getAttribute('aria-expanded') === 'true' || document.getElementById('island').click() }); await p.focus('#island'); await p.keyboard.press('Escape'); await p.waitForTimeout(80)
      ok(await p.evaluate(() => document.getElementById('island').getAttribute('aria-expanded') === 'false') && (await act(p)) === 'island', 'B: Esc repliega la isla y deja el foco en ella')
      // Atajo
      await p.focus('#f-rfc'); await p.keyboard.press('Alt+F8'); await p.waitForTimeout(80)
      const there = await act(p)
      await p.keyboard.press('Alt+F8'); await p.waitForTimeout(80)
      ok(there === 'island' && (await act(p)) === 'f-rfc' && await p.evaluate(() => document.getElementById('island').getAttribute('aria-keyshortcuts') === 'Alt+F8'), `B: Alt+F8 lleva a la isla (abierta) y de vuelta al campo (${there} → ${await act(p)})`)
      // Descartar una condición informativa
      await p.keyboard.press('Alt+F8'); await p.waitForTimeout(80)
      const n0 = await p.evaluate(() => document.querySelectorAll('.xb-item').length)
      await press(p, '#island-maint-dismiss'); await p.waitForTimeout(150)
      ok((await p.evaluate(() => document.querySelectorAll('.xb-item').length)) === n0 - 1 && (await act(p)) !== 'BODY', `B: descartar un aviso informativo lo quita y el foco no cae al body (${await act(p)})`)
      await p.keyboard.press('Escape')
      // Con GToaster arriba: el aviso flotante queda por debajo de la isla
      await p.evaluate(() => document.getElementById('sim-toast').click()); await p.waitForSelector('.g-toast'); await p.waitForTimeout(500)
      const g = await p.evaluate(() => [document.getElementById('island').getBoundingClientRect().bottom, document.querySelector('.g-toast').getBoundingClientRect().top])
      ok(g[1] >= g[0], `B: un aviso flotante de GToaster (top-center) queda por debajo de la isla, que no se mueve (${Math.round(g[1])} ≥ ${Math.round(g[0])})`)
      // Lo grave no abre la isla si taparía lo que se está usando
      await p.evaluate(() => { __S.save = 'idle'; __S.saveFails = true; window.scrollTo(0, 0) }); await p.waitForTimeout(300)
      await p.evaluate(() => window.scrollTo(0, document.getElementById('f-nombre').getBoundingClientRect().top + scrollY - 90)); await p.waitForTimeout(80)
      await p.focus('#f-nombre'); await p.keyboard.press('Enter'); await p.waitForFunction(() => __S.save === 'error'); await p.waitForTimeout(200)
      ok(await p.evaluate(() => document.getElementById('island').getAttribute('aria-expanded') === 'false' && /No se pudo guardar/.test(document.getElementById('island').textContent)) && (await act(p)) === 'f-nombre', 'B: si abrirse taparía el campo con foco, la isla no se abre sola: muestra el error en una línea y avisa con un toque')
    }

    // ============ 7. Contraste (tokens reales del tema por defecto) ============
    await p.evaluate(() => { __S.saveFails = true }); await press(p, '#save'); await p.waitForTimeout(500)
    const contrast = await p.evaluate((C) => {
      const cv = document.createElement('canvas'); cv.width = cv.height = 1; const cx = cv.getContext('2d', { willReadFrequently: true })
      const rgb = (c) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#fff'; cx.fillRect(0, 0, 1, 1); cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); return [...cx.getImageData(0, 0, 1, 1).data].slice(0, 3) }
      const lum = (c) => { const [r, g, b] = rgb(c).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
      const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
      const cs = (s, pseudo) => { const e = document.querySelector(s); return e ? getComputedStyle(e, pseudo) : null }
      const surface = getComputedStyle(document.querySelector('.card')).backgroundColor
      const out = {}
      const add = (k, fg, bg, min) => { if (fg && bg) out[k] = [Math.round(ratio(fg, bg) * 100) / 100, min] }
      if (C === 'A') {
        add('franja de error: texto', cs('.xa-act__in p')?.color, cs('.xa-act', '::before')?.backgroundColor, 4.5)
        add('franja de error: icono', cs('.xa-act__in .g-icon')?.color, cs('.xa-act', '::before')?.backgroundColor, 3)
        add('franja de página: texto', cs('.xa-edge p')?.color, cs('.xa-edge')?.backgroundColor, 4.5)
        add('contorno de la región', cs('#tb-region')?.outlineColor, surface, 3)
      }
      if (C === 'B') {
        const bg = cs('.xb-island').backgroundColor
        add('isla: texto', cs('.xb-island__text').color, bg, 4.5)
        add('isla: icono sobre su insignia', cs('.xb-badge').color, cs('.xb-badge').backgroundColor, 3)
        add('isla: insignia sobre la isla (borde claro)', cs('.xb-badge').borderInlineStartColor, bg, 3)
        add('marca de origen: texto', cs('.xb-mark--link').color, cs('.xb-mark--link').backgroundColor, 4.5)
        add('marca de sección: texto', cs('#card-mark').color, surface, 4.5)
        add('marca de sección: insignia', cs('#card-mark .xb-badge').backgroundColor, surface, 3)
      }
      if (C === 'C') {
        add('nota: palabra de tipo', cs('#save-note .xc-note__kind').color, surface, 4.5)
        add('nota: cuerpo', cs('#save-note .xc-note__body').color, surface, 4.5)
        add('nota: paso fallido', cs('#save-note .xc-step[data-state=failed]').color, surface, 4.5)
        add('regla del margen', cs('#form-card .xc-region', '::before').borderInlineStartColor, surface, 3)
      }
      return out
    }, C)
    for (const [k, [r, min]] of Object.entries(contrast)) ok(r >= min, `Contraste · ${k}: ${r}:1 (mínimo ${min}:1)`)
    await p.close()

    // ============ 8. 320px ============
    p = await open({ vw: 320, vh: 700 })
    await center(p, '#save'); await p.focus('#save')
    await startSample(p, '#save', 900)
    await p.keyboard.press('Enter')
    d = await endSample(p)
    await p.evaluate(() => document.getElementById('sim-session').click()); await p.waitForTimeout(500)
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= 320), `320px: sin desplazamiento horizontal con error y condición de página a la vez (${await p.evaluate(() => document.documentElement.scrollWidth)})`)
    ok(d <= TOL, `320px: el botón con foco tampoco se mueve (Δ ${d.toFixed(2)}px)`)
    if (C === 'B') {
      const r = await p.evaluate(() => { const i = document.querySelector('.xb-island').getBoundingClientRect(); return [i.left, i.right] })
      ok(r[0] >= 0 && r[1] <= 320, `B 320px: la isla cabe en el visor (${r.map(Math.round)})`)
      ok(await p.evaluate(() => document.getElementById('island').getAttribute('aria-expanded') === 'false' && !document.querySelector('dialog[open]')) && (await act(p)) === 'save', 'B móvil: lo grave NO abre nada solo (una hoja modal tomaría el foco)')
      await p.evaluate(() => window.scrollTo(0, 0)); await press(p, '#island'); await p.waitForSelector('#island-sheet[open] .xb-item'); await p.waitForTimeout(500)
      ok(await p.evaluate(() => { const d = document.getElementById('island-sheet'); return d.matches(':modal') && d.contains(document.activeElement) && d.querySelectorAll('.xb-item').length >= 3 && d.getBoundingClientRect().bottom >= innerHeight - 1 }), 'B móvil: al pulsarla, la isla se abre como hoja inferior modal (GDialog real) con los mismos avisos y el foco dentro')
      ok(await p.evaluate(() => document.documentElement.scrollWidth <= 320 && document.getElementById('island-sheet').scrollWidth <= 320), 'B móvil: la hoja cabe en 320px')
      await p.keyboard.press('Escape'); await p.waitForTimeout(500)
      ok((await act(p)) === 'island' && await p.evaluate(() => !document.querySelector('dialog[open]')), `B móvil: Esc cierra la hoja y el foco vuelve a la isla (${await act(p)})`)
    }
    await p.close()

    // ============ 9. RTL ============
    p = await open({ q: '&dir=rtl' })
    await press(p, '#save'); await p.waitForTimeout(600)
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'RTL: sin desbordes')
    if (C === 'A') ok(await p.evaluate(() => document.getElementById('save').getBoundingClientRect().right <= document.querySelector('.xa-act__in p').getBoundingClientRect().left + 1), 'A RTL: el botón queda al final (izquierda) y el mensaje sale hacia la derecha')
    if (C === 'B') ok(await p.evaluate(() => { const r = document.querySelector('.xb-island').getBoundingClientRect(); return Math.abs((r.left + r.right) / 2 - innerWidth / 2) <= 8 }), 'B RTL: la isla sigue centrada')
    if (C === 'C') ok(await p.evaluate(() => { const reg = document.querySelector('#form-card .xc-region'); const c = getComputedStyle(reg, '::before'); return parseFloat(c.borderRightWidth) >= 3 && parseFloat(c.left) > reg.getBoundingClientRect().width / 2 }), 'C RTL: la regla pasa al margen derecho')
    await p.close()

    // ============ 10. Movimiento reducido ============
    p = await open({ reducedMotion: 'reduce' })
    await center(p, '#save'); await p.focus('#save')
    await startSample(p, '#save', 500)
    await p.keyboard.press('Enter')
    d = await endSample(p)
    ok(d <= TOL && await p.evaluate(() => document.getAnimations().filter((x) => x.playState === 'running').length === 0), `Movimiento reducido: sin animaciones en curso y sin saltos (Δ ${d.toFixed(2)}px)`)
    ok((await live(p)).length === 1, 'Movimiento reducido: los anuncios no cambian')
    await p.close()

    report.push({ engine, C, pass, fails, notes, errs })
  }
  await b.close()
}
server.close()
let bad = 0
for (const r of report) {
  console.log(`\n${r.engine} · ${r.C}: ${r.pass} ok, ${r.fails.length} fallos`)
  for (const f of r.fails) { bad++; console.log('  NO  ' + f) }
  for (const n of r.notes) console.log('  nota: ' + n)
  for (const e of [...new Set(r.errs)]) { bad++; console.log('  consola: ' + e.slice(0, 300)) }
}
process.exit(bad ? 1 : 0)
