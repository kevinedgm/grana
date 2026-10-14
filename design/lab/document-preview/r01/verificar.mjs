// Verificación del visor de documentos (kiwi r01): base, A, B y C en Chromium, Firefox y WebKit.
// Ejecutar: node design/lab/document-preview/r01/verificar.mjs  (puerto 4219; ENGINES=chromium,firefox,webkit; VERBOSE=1)
// Requiere packages/vue/dist (npm run build). Solo lee.
import { serve, pw } from './serve.mjs'

const ENGINES = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
const V = !!process.env.VERBOSE
const R = []
const rec = (eng, part, name, ok, info = '') => { R.push({ eng, part, name, ok: !!ok, info }); if (V || !ok) console.log(`${ok ? 'ok  ' : 'FALLA'} ${eng} ${part} · ${name}${info ? ' · ' + info : ''}`) }
const { server, base } = await serve()

async function open (b, eng, q = '', opts = {}) {
  const { vw = 1280, vh = 900, ...ctx } = opts
  const context = await b.newContext({ viewport: { width: vw, height: vh }, ...ctx })
  if (eng === 'chromium') await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base.split('/design')[0] }).catch(() => {})
  const p = await context.newPage()
  const errs = []
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
  p.on('pageerror', (e) => errs.push(String(e)))
  await p.goto(base + '/index.html' + q)
  await p.waitForFunction(() => window.__ready, null, { timeout: 20000 })
  await p.evaluate(() => { window.__noPrint = true; window.__noDownloadClick = true })
  await p.waitForFunction(() => ['v-base', 'v-A', 'v-B', 'v-C'].every((k) => window.__views[k]?.v.phase === 'ready'), null, { timeout: 10000 })
  p.__errs = errs
  return p
}
const page = (p, k) => p.evaluate((k) => window.__views[k].v.page, k)
const said = (p, k) => p.evaluate((k) => window.__views[k].v.said.slice(-1)[0] || '', k)

async function run (eng) {
  const b = await pw[eng].launch()
  const ck = (part) => (n, ok, i) => rec(eng, part, n, ok, i)
  const p = await open(b, eng)
  const env = await p.evaluate(() => window.__env)
  console.log(`· ${eng} entorno: ${JSON.stringify(env)}`)

  // ---------- Base ----------
  {
    const c = ck('base')
    const sem = await p.evaluate(() => {
      const root = document.getElementById('v-base'); const bar = root.querySelector('.lab-bar')
      const tools = [...bar.querySelectorAll('[data-tool]')]
      const st = root.querySelector('.lab-stage')
      return { role: bar.getAttribute('role'), name: bar.getAttribute('aria-label'), zero: tools.filter((t) => t.tabIndex === 0).length, n: tools.length,
        stRole: st.getAttribute('role'), stTab: st.tabIndex, stName: st.getAttribute('aria-label'), desc: document.getElementById(st.getAttribute('aria-describedby'))?.textContent,
        spin: bar.querySelector('[role="spinbutton"]')?.getAttribute('aria-valuetext'), pages: root.querySelectorAll('.lab-page[role="img"]').length }
    })
    c('barra role="toolbar" con nombre', sem.role === 'toolbar' && sem.name === 'Herramientas del documento')
    c('una sola parada de Tab en la barra', sem.zero === 1, `${sem.zero} de ${sem.n}`)
    c('escenario enfocable role="document" con nombre', sem.stRole === 'document' && sem.stTab === 0 && /Contrato/.test(sem.stName))
    c('escenario descrito por la línea de estado', /Página 1 de 12/.test(sem.desc || ''), sem.desc)
    c('campo de página spinbutton con valuetext', sem.spin === 'Página 1 de 12')
    c('12 páginas como role="img" con nombre', sem.pages === 12)
    const drawn = await p.evaluate(() => [...document.querySelectorAll('#v-base .lab-page canvas')].map((c, i) => c.dataset.drawn ? i + 1 : 0).filter(Boolean))
    c('al cargar solo se pintan las páginas cercanas (perezoso)', drawn.length > 0 && drawn.length < 12, drawn.join(','))
    // Flechas en la barra
    const first = p.locator('#v-base .lab-bar [data-tool]').first()
    await first.focus(); await p.keyboard.press('ArrowRight')
    const idx = await p.evaluate(() => [...document.querySelectorAll('#v-base .lab-bar [data-tool]')].indexOf(document.activeElement))
    c('→ mueve el foco a la herramienta siguiente', idx === 1, String(idx))
    // Campo de página
    const field = p.locator('#v-base .lab-pagefield')
    await field.focus(); await p.keyboard.press('ArrowDown')
    c('↓ en el campo → página 2 y anuncio', (await page(p, 'v-base')) === 2 && (await said(p, 'v-base')) === 'Página 2 de 12')
    await field.fill('7'); await p.keyboard.press('Enter')
    await p.waitForTimeout(100)
    c('escribir 7 + Intro → página 7', (await page(p, 'v-base')) === 7)
    const vis = await p.evaluate(() => { const st = document.querySelector('#v-base .lab-stage'); const pg = st.querySelectorAll('.lab-page')[6]; return Math.abs(pg.getBoundingClientRect().top - st.getBoundingClientRect().top) })
    c('la página 7 queda arriba del escenario', vis < 40, `${vis.toFixed(1)}px`)
    // Zoom con ancla
    await p.evaluate(() => window.__views['v-base'].zoomStep(1)); await p.waitForTimeout(250)
    c('acercar conserva la página (ancla)', (await page(p, 'v-base')) === 7)
    c('acercar se anuncia', /^Zoom \d/.test(await said(p, 'v-base')), await said(p, 'v-base'))
    await p.evaluate(() => window.__views['v-base'].setZoom({ mode: 'fit-width', scale: 1 })); await p.waitForTimeout(250)
    c('ajustar al ancho conserva la página', (await page(p, 'v-base')) === 7)
    // Lienzo perezoso
    // Teclas del escenario
    await p.locator('#v-base .lab-stage').focus(); await p.keyboard.press('+'); await p.waitForTimeout(200)
    c('«+» con el foco en el escenario acerca', (await p.evaluate(() => window.__views['v-base'].v.zoom.mode)) === 'custom')
    await p.keyboard.press('0'); await p.waitForTimeout(200)
    c('«0» vuelve al ajuste', (await p.evaluate(() => window.__views['v-base'].v.zoom.mode)) === 'fit-width')
    // Miniaturas
    await p.evaluate(() => { window.__views['v-base'].v.thumbs = true }); await p.waitForTimeout(200)
    const cur = await p.evaluate(() => [...document.querySelectorAll('#v-base .lab-thumbs button')].findIndex((b) => b.getAttribute('aria-current') === 'page'))
    c('miniatura actual con aria-current="page"', cur === 6, String(cur))
    const thumbStop = await p.evaluate(() => { const ol = document.querySelector('#v-base .lab-thumbs ol'); return ol.tabIndex === -1 && [...ol.querySelectorAll('button')].filter((b) => b.tabIndex === 0).length === 1 })
    c('miniaturas: contenedor tabindex=-1 y una parada (#570)', thumbStop)
    await p.evaluate(() => { window.__views['v-base'].v.thumbs = false })
  }

  // ---------- Carga: molde a los 200 ms, aria-busy ----------
  {
    const c = ck('carga')
    await p.evaluate(() => { const vw = window.__views['v-base']; vw.setSource({ ...vw.v.source, fail: 'hang' }) })
    await p.waitForTimeout(80)
    const early = await p.evaluate(() => { const st = document.querySelector('#v-base .lab-stage'); return { busy: st.getAttribute('aria-busy'), vis: getComputedStyle(st.querySelector('.lab-molds')).visibility } })
    await p.waitForTimeout(300)
    const late = await p.evaluate(() => getComputedStyle(document.querySelector('#v-base .lab-molds')).visibility)
    c('aria-busy="true" desde el inicio', early.busy === 'true')
    c('molde invisible antes de 200 ms', early.vis === 'hidden')
    c('molde visible después de 200 ms', late === 'visible')
    c('anuncio de carga al verse el molde', /^Cargando/.test(await said(p, 'v-base')))
    await p.evaluate(() => { const vw = window.__views['v-base']; vw.setSource({ ...vw.v.source, fail: undefined }) })
    await p.waitForFunction(() => window.__views['v-base'].v.phase === 'ready')
  }

  // ---------- Acciones: acuse solo con confirmación ----------
  {
    const c = ck('acciones')
    await p.evaluate(() => { window.__LAB = null })
    await p.evaluate(() => window.__views['v-base'].run('email'))
    const busy = await p.evaluate(() => window.__views['v-base'].v.acts.email?.state)
    c('enviar: «busy» mientras la aplicación responde', busy === 'busy')
    await p.waitForTimeout(1500)
    c('enviar: «done» solo tras resolver, con el destinatario', /Enviado a ana/.test(await p.evaluate(() => window.__views['v-base'].v.acts.email?.msg || '')))
    await p.locator('.lab-controls input').first().check()
    await p.evaluate(() => window.__views['v-base'].run('email')); await p.waitForTimeout(1500)
    const f = await p.evaluate(() => window.__views['v-base'].v.acts.email)
    c('enviar con fallo: «failed» y nunca «Enviado»', f.state === 'failed' && !/Enviado/.test(f.msg))
    const native = await p.evaluate(async () => { const vw = window.__views['v-panel']; await vw.run('download'); return vw.v.acts.download })
    c('descargar (Blob, mismo origen): «Descargando», no «Descargado»', native.state === 'started' && /^Descargando/.test(native.msg))
    if (env.clipboard) {
      await p.evaluate(() => window.__views['v-base'].run('copyLink')); await p.waitForTimeout(300)
      const cl = await p.evaluate(() => window.__views['v-base'].v.acts.copyLink)
      c('copiar enlace: «Enlace copiado» solo si la promesa resuelve', (cl.state === 'done' && cl.msg === 'Enlace copiado') || cl.state === 'failed', cl.state)
    } else c('copiar enlace oculto sin portapapeles', !(await p.evaluate(() => window.__views['v-base'].availability('copyLink').show)))
    c('compartir: oculto si el navegador no puede', (await p.evaluate(() => window.__views['v-base'].availability('share').show)) === (env.share === 'function'))
    await p.locator('.lab-controls input').nth(1).check()
    const off = await p.evaluate(() => window.__views['v-base'].availability('download'))
    c('sin conexión: descargar deshabilitado con motivo', off.disabled && off.reason === 'Sin conexión')
    await p.locator('.lab-controls input').nth(1).uncheck()
  }

  // ---------- A · Lomo ----------
  {
    const c = ck('A')
    const rail = p.locator('#v-A .lab-spine__rail')
    await rail.focus(); await p.keyboard.press('ArrowDown')
    c('lomo role="slider" vertical: ↓ → página 2', (await page(p, 'v-A')) === 2 && (await rail.getAttribute('aria-valuetext')) === 'Página 2 de 12')
    await p.keyboard.press('End')
    c('Fin → última página', (await page(p, 'v-A')) === 12)
    const peek = await p.evaluate(() => { const e = document.querySelector('#v-A .lab-spine__peek'); return e.classList.contains('is-shown') && e.getAttribute('aria-hidden') === 'true' })
    c('la página asoma al enfocar (visual, aria-hidden)', peek)
    const seal = await p.evaluate(() => { const s = document.querySelector('#v-A .lab-seal'); return { role: s.getAttribute('role'), zero: [...s.querySelectorAll('[data-tool]')].filter((t) => t.tabIndex === 0).length } })
    c('sello role="toolbar" con una parada', seal.role === 'toolbar' && seal.zero === 1)
    const cover = await p.evaluate(() => { const st = document.querySelector('#v-A .lab-stage'); const s = document.querySelector('#v-A .lab-seal'); st.scrollTop = st.scrollHeight; const last = st.querySelectorAll('.lab-page')[11].getBoundingClientRect(); return s.getBoundingClientRect().top - last.bottom })
    c('el sello no tapa el pie de la última página', cover >= 0, `${cover.toFixed(1)}px`)
  }

  // ---------- B · Ficha ----------
  {
    const c = ck('B')
    await p.locator('#v-B .lab-ficha__cover').click()
    await p.waitForFunction(() => document.querySelector('dialog[open]'), null, { timeout: 3000 }).catch(() => {})
    const dlg = await p.evaluate(() => { const d = document.querySelector('dialog[open]'); return { open: !!d, inside: !!d && d.contains(document.activeElement), stage: !!d?.querySelector('.lab-stage.is-ready') } })
    c('abrir la portada abre un GDialog con el lector', dlg.open && dlg.stage)
    c('el foco entra en el diálogo', dlg.inside)
    await p.evaluate(() => window.__views['v-B'].goTo(7)); await p.waitForTimeout(100)
    await p.keyboard.press('Escape'); await p.waitForTimeout(500)
    const after = await p.evaluate(() => ({ open: !!document.querySelector('dialog[open]'), resume: document.querySelector('#v-B .lab-ficha__resume')?.textContent || '' }))
    c('Esc cierra', !after.open)
    c('la ficha recuerda «Ibas en la página 7»', /Ibas en la página 7/.test(after.resume), after.resume)
    c('sin recargar: el documento sigue listo', (await p.evaluate(() => window.__views['v-B'].v.phase)) === 'ready')
  }

  // ---------- C · Frase ----------
  {
    const c = ck('C')
    const ph = await p.evaluate(() => { const b = document.querySelector('#v-C .lab-phrase'); return { role: b.getAttribute('role'), zero: [...b.querySelectorAll('[data-tool]')].filter((t) => t.tabIndex === 0).length, txt: b.textContent.replace(/\s+/g, ' ') } })
    c('frase role="toolbar" con una parada', ph.role === 'toolbar' && ph.zero === 1)
    c('la frase se lee de corrido', /Página .*de 12.*vista .*al ancho.*Contrato de arrendamiento\.pdf/.test(ph.txt), ph.txt.slice(0, 120))
  }

  // ---------- Mínimos ----------
  {
    const c = ck('mínimos')
    const small = await p.evaluate(() => [...document.querySelectorAll('.lab-viewer [data-tool], .lab-word, .lab-thumbs button, .lab-ficha__cover')].filter((e) => e.offsetParent).map((e) => { const r = e.getBoundingClientRect(); return [e.className.toString().slice(0, 30), r.width, r.height] }).filter(([, w, h]) => w < 23.5 || h < 23.5))
    c('toda diana ≥ 24 × 24', small.length === 0, JSON.stringify(small.slice(0, 4)))
    c('sin errores de consola', p.__errs.length === 0, p.__errs.slice(0, 2).join(' | '))
  }

  // ---------- Móvil ----------
  {
    const c = ck('móvil 375')
    const m = await open(b, eng, '', { vw: 375, vh: 800 })
    const over = await m.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    c('sin desplazamiento horizontal de página', over <= 0, `${over}px`)
    await m.context().close()
  }

  // ---------- Límite de plataforma: mover un iframe lo recarga ----------
  {
    const c = ck('plataforma')
    const r = await p.evaluate(async () => {
      const a = document.createElement('div'); const bb = document.createElement('div'); document.body.append(a, bb)
      const f = document.createElement('iframe'); f.srcdoc = '<p>x</p>'; let loads = 0; f.onload = () => loads++; a.append(f)
      await new Promise((r) => setTimeout(r, 400)); const before = loads
      bb.append(f); await new Promise((r) => setTimeout(r, 400)); const moved = loads
      let mb = null
      if (typeof bb.moveBefore === 'function') { a.moveBefore(f, null); await new Promise((r) => setTimeout(r, 400)); mb = loads - moved }
      a.remove(); bb.remove(); return { before, moved, mb }
    })
    c('mover un iframe con append lo recarga (medido)', r.moved > r.before, JSON.stringify(r))
    console.log(`· ${eng} moveBefore conserva el iframe: ${r.mb === null ? 'no existe' : r.mb === 0 ? 'sí' : 'no'}`)
  }
  await b.close()
}

for (const e of ENGINES) await run(e)
server.close()
const bad = R.filter((r) => !r.ok)
for (const e of ENGINES) { const rs = R.filter((r) => r.eng === e); console.log(`${e}: ${rs.filter((r) => r.ok).length}/${rs.length}`) }
console.log(bad.length ? `FALLAN ${bad.length}` : `TODO OK ${R.length}/${R.length}`)
process.exit(bad.length ? 1 : 0)
