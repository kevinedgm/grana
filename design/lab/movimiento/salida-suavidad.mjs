// «El cierre se ve muy brusco» (usuario): cuánto dura de verdad la salida de GSelect y GCombobox en Chromium, cuadro a cuadro,
// con la curva de la tabla (fast + ease-out) y con otras curvas inyectadas solo aquí, para comparar. No aprueba ni suspende.
// Ejecutar: node design/lab/movimiento/salida-suavidad.mjs   (solo Chromium: en Firefox y WebKit la salida es instantánea, D2 · A)
import { writeFileSync } from 'node:fs'
const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const url = new URL('./r01/banco.html', import.meta.url).href
const REPS = 7
const CURVES = { 'fast + ease-out (tabla)': null, 'fast + standard': ['var(--g-duration-fast)', 'var(--g-ease-standard)'], 'fast + linear': ['var(--g-duration-fast)', 'linear'], 'press + linear': ['var(--g-duration-press)', 'linear'] }
const PANELS = { GSelect: { sel: '.g-select__list', open: '.g-select__button' }, GCombobox: { sel: '.g-combobox__popup', open: '.g-combobox input' } }
const med = (xs) => xs.slice().sort((a, b) => a - b)[Math.floor(xs.length / 2)]
const b = await pw.chromium.launch()
const out = {}
for (const [name, c] of Object.entries(PANELS)) {
  for (const [label, cv] of Object.entries(CURVES)) {
    const runs = []
    for (let i = 0; i < REPS; i++) {
      const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } })
      const p = await ctx.newPage()
      await p.goto(url)
      await p.waitForFunction(() => window.__ready)
      if (cv) await p.addStyleTag({ content: `${c.sel}, ${c.sel}:not(:popover-open) { transition: opacity ${cv[0]} ${cv[1]}, overlay ${cv[0]} allow-discrete, display ${cv[0]} allow-discrete !important; }` })
      await p.click(c.open)
      await p.waitForTimeout(420)
      const xs = await p.evaluate(async (s) => {
        const el = document.querySelector(s)
        const fieldRow = document.querySelector('.g-combobox .g-input__row')
        const rows = []
        const t0 = performance.now()
        document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
        for (;;) {
          await new Promise(requestAnimationFrame)
          const k = getComputedStyle(el)
          const t = Math.round(performance.now() - t0)
          rows.push({ t, o: +(+k.opacity).toFixed(3), d: k.display, ring: k.outlineStyle, n: el.querySelectorAll('[role=option]').length, field: s.includes('combobox') ? getComputedStyle(fieldRow).outlineStyle : null })
          if (t > 260) break
        }
        return rows
      }, c.sel)
      runs.push(xs)
      await ctx.close()
    }
    const at = (x, f) => { const r = x.find((y) => y.d === 'none' || y.o <= f); return r ? r.t : null }
    const r0 = runs[0]
    out[`${name} · ${label}`] = {
      t50: med(runs.map((x) => at(x, 0.5))), t10: med(runs.map((x) => at(x, 0.1))), fin: med(runs.map((x) => at(x, 0))),
      cuadrosVisibles: med(runs.map((x) => x.filter((y) => y.d !== 'none' && y.o > 0.02 && y.o < 1).length)),
      secuencia: r0.filter((y) => y.d !== 'none').slice(0, 11).map((y) => y.o),
      anilloForma: r0.slice(0, 4).map((y) => y.ring), anilloCampo: r0.slice(0, 4).map((y) => y.field), filas: r0.filter((y) => y.d !== 'none' && y.o > 0.02).map((y) => y.n).slice(0, 6)
    }
    console.log(`${name} · ${label}`, JSON.stringify(out[`${name} · ${label}`]))
  }
}
await b.close()
writeFileSync(new URL('./salida-suavidad.json', import.meta.url), JSON.stringify(out, null, 1) + '\n')
