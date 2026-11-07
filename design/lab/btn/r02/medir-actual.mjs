// Ronda r02 · medida del GBtn REAL (dist) antes de proponer nada: qué retroalimentación da hoy cada estado.
// Ejecutar: node design/lab/btn/r02/medir-actual.mjs   (ENGINES=chromium,firefox,webkit por defecto)
// Abre por file:// (no ocupa puertos). Requiere `npm run build` previo. Solo mide: no aprueba ni suspende nada.
import { writeFileSync } from 'node:fs'
const pw = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const url = new URL('./banco-real.html', import.meta.url).href
const engines = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
const result = {}

// Muestreo por cuadro. `scale` lee la matriz calculada; `lab`, la opacidad de la etiqueta; `ld`, la del indicador
const SAMPLER = `window.__rec = () => { const b = document.querySelector('#b'), l = b.querySelector('.g-btn__label'), d = b.querySelector('.g-btn__loader'); const xs = []; let on = true;
  const t0 = performance.now();
  (function f() { const m = new DOMMatrixReadOnly(getComputedStyle(b).transform); xs.push({ t: Math.round(performance.now() - t0), s: m.a, lab: +getComputedStyle(l).opacity, ld: +getComputedStyle(d).opacity }); if (on) requestAnimationFrame(f) })();
  return () => { on = false; return xs } }`

for (const engine of engines) {
  const b = await pw[engine].launch()
  const ctx = await b.newContext({ viewport: { width: 900, height: 400 } })
  const p = await ctx.newPage()
  await p.goto(url)
  await p.waitForFunction(() => window.__ready)
  await p.evaluate(SAMPLER)
  const r = {}
  const box = await p.locator('#b').boundingBox()
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2
  const minScale = async (act, ms = 420) => {
    await p.evaluate(() => { window.__stop = window.__rec() })
    await act()
    await p.waitForTimeout(ms)
    const xs = await p.evaluate(() => window.__stop())
    return { min: +Math.min(...xs.map((x) => x.s)).toFixed(4), max: +Math.max(...xs.map((x) => x.s)).toFixed(4) }
  }
  await p.mouse.move(cx, cy); await p.waitForTimeout(200)

  // 1. Pulsación: mantenida, rápida y por teclado
  // Un clic de calentamiento: el primer clic de la página no se mide (Chromium tarda en entregar el primer :active al muestreo)
  await p.mouse.down(); await p.waitForTimeout(150); await p.mouse.up(); await p.waitForTimeout(350)
  for (const hold of [0, 60, 100, 150]) {
    r[`raton${hold}ms`] = await minScale(async () => { await p.mouse.down(); if (hold) await p.waitForTimeout(hold); await p.mouse.up() })
  }
  await p.mouse.move(5, 5); await p.focus('#b')
  r.enter = await minScale(() => p.keyboard.press('Enter'))
  r.espacio = await minScale(() => p.keyboard.press('Space'))
  r.espacio120 = await minScale(async () => { await p.keyboard.down('Space'); await p.waitForTimeout(120); await p.keyboard.up('Space') })

  // 2. Hover y activo durante la carga: ¿sigue respondiendo a un botón que no actúa?
  const bg = () => p.evaluate(() => getComputedStyle(document.querySelector('#b')).backgroundColor)
  await p.mouse.move(5, 5); await p.waitForTimeout(220)
  r.fondoReposo = await bg()
  await p.mouse.move(cx, cy); await p.waitForTimeout(220)
  r.fondoHover = await bg()
  await p.mouse.move(5, 5); await p.evaluate(() => { s.loading = true }); await p.waitForTimeout(320)
  r.fondoCarga = await bg()
  await p.mouse.move(cx, cy); await p.waitForTimeout(220)
  r.fondoCargaHover = await bg()
  r.cursorCarga = await p.evaluate(() => getComputedStyle(document.querySelector('#b')).cursor)
  await p.mouse.move(5, 5)

  // 3. Foco al entrar en carga: botón y enlace
  await p.evaluate(() => { s.loading = false }); await p.waitForTimeout(320)
  await p.focus('#b'); await p.evaluate(() => { s.loading = true }); await p.waitForTimeout(100)
  r.focoBotonEnCarga = await p.evaluate(() => document.activeElement?.id || document.activeElement?.tagName)
  await p.evaluate(() => { s.loading = false }); await p.waitForTimeout(320)
  await p.focus('#a'); await p.evaluate(() => { s.loading = true }); await p.waitForTimeout(100)
  r.focoEnlaceEnCarga = await p.evaluate(() => document.activeElement?.id || document.activeElement?.tagName)
  r.anilloEnlaceEnCarga = await p.evaluate(() => { const e = document.querySelector('#a'); return { foco: e.matches(':focus-visible'), outline: getComputedStyle(e).outlineStyle } })
  await p.evaluate(() => { s.loading = false }); await p.waitForTimeout(320)
  await p.evaluate(() => document.activeElement.blur())

  // 4. Carga corta (100 ms) y carga con final: parpadeo y qué queda al terminar
  await p.evaluate(() => { window.__stop = window.__rec(); s.loading = true })
  await p.waitForTimeout(100)
  await p.evaluate(() => { s.loading = false })
  await p.waitForTimeout(320)
  const xs = await p.evaluate(() => window.__stop())
  r.cargaCorta100 = { etiquetaMinima: +Math.min(...xs.map((x) => x.lab)).toFixed(3), indicadorMaximo: +Math.max(...xs.map((x) => x.ld)).toFixed(3), cuadrosConEtiquetaBajo50: xs.filter((x) => x.lab < 0.5).length }
  await p.evaluate(() => { s.loading = true }); await p.waitForTimeout(150)
  r.regionDuranteCarga = await p.locator('.g-btn__status').first().textContent()
  await p.evaluate(() => { s.loading = false }); await p.waitForTimeout(150)
  r.regionAlTerminar = await p.locator('.g-btn__status').first().textContent()

  result[engine] = r
  await b.close()
}
console.log(JSON.stringify(result, null, 1))
writeFileSync(new URL('./medir-actual.json', import.meta.url), JSON.stringify(result, null, 1) + '\n')
