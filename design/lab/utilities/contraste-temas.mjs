// g-text-muted y g-text-subtle sobre bg, surface y surface-sunken (regla 7 del contrato, tokens.md §15), con los 11 temas de
// Dark Color Presence derivados AHORA por @grana/cli, en claro y oscuro, además del tema por defecto. Solo aritmética de color
// sobre los tokens del tema (no depende del motor): Chromium. Desde la raíz:  GRANA_PW_PORT=4211 node design/lab/utilities/contraste-temas.mjs
import { pw, serve, stop, open, close, ok, note, report, setEngine, GEN, cliTheme } from '../app-shell/auditoria-comun.mjs'
process.env.GRANA_PW_PORT ||= '4211'
const ORIGIN = await serve()
setEngine('chromium')
const b = await pw.chromium.launch()
const themes = ['', ...GEN.map((n) => 'cli:' + n)]
let min = { r: 99, w: '' }
for (const th of themes) for (const dark of [false, true]) {
  const p = await open(b, ORIGIN + '/design/lab/utilities/estilo-banco.html', { ready: () => window.__ready, theme: th, dark })
  for (const bg of ['bg', 'surface', 'surface-sunken']) for (const k of ['muted', 'subtle']) {
    const r = await p.evaluate(([bg, k]) => {
      const e = document.createElement('p'); e.className = 'g-text-' + k; e.textContent = 'x'
      const w = document.createElement('div'); w.style.background = `var(--g-color-${bg})`; w.appendChild(e); document.body.appendChild(w)
      const v = window.__textRatio(e); w.remove(); return v
    }, [bg, k])
    const lab = `${th || 'defecto'} ${dark ? 'oscuro' : 'claro'}: g-text-${k} sobre ${bg}`
    ok(r >= 4.5, lab + ' ≥ 4.5:1', r.toFixed(2))
    if (r < min.r) min = { r, w: lab }
  }
  await close(p, `${th || 'defecto'} ${dark ? 'oscuro' : 'claro'}`)
}
note(`mínimo medido: ${min.r.toFixed(2)}:1 · ${min.w}`)
await b.close(); await stop()
process.exit(report('contraste-temas') ? 1 : 0)
