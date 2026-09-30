// Investigación «Dark Color Presence» (design/lab/tema-oscuro/investigacion-dark-color-presence.md): SOLO PRUEBA VISUAL.
// Genera, para tres temas (carmesí, Lustre, marino), el CSS actual y tres variantes con un piso de L en la base oscura de
// brand, accent y los semánticos (0.66, 0.70, 0.74). No cambia la derivación del CLI: añade las variantes al final del CSS.
// Uso: node scripts/dark-presence-variants.mjs <carpeta>   y abrir dark-presence-compare.html?t=crimson desde esa carpeta
//      (la página carga ../index.html del playground: pon la carpeta en packages/vue/playground/_dpres/ y bórrala después).
import { writeFileSync } from 'node:fs'
import { mkdirSync } from 'node:fs'
import { buildTheme, deriveDarkColor, toOklch, parseHex } from '../src/index.js'
import { fromOklch, toHex } from '../src/color.js'
import { DEFAULTS } from '../src/defaults.js'

// Solo sube si la base OSCURA derivada queda por debajo del piso (no baja lo que la reflexión ya subió)
const raise = (hex, floor) => { if (toOklch(parseHex(deriveDarkColor(hex).base)).l >= floor) return hex; const k = toOklch(parseHex(hex)); return toHex(fromOklch({ l: floor, c: k.c, h: k.h }).map(Math.round)) }
const tokensOf = (name, light, surface) => { const d = deriveDarkColor(light, { surface }); return { [`--g-color-${name}`]: d.base, [`--g-color-${name}-strong`]: d.strong, [`--g-color-${name}-soft`]: d.soft, [`--g-color-${name}-text`]: d.text, [`--g-color-on-${name}`]: d.on, [`--g-color-on-${name}-soft`]: d.onSoft } }
const out = process.argv[2]
if (!out) { console.error('Uso: node scripts/dark-presence-variants.mjs <carpeta>'); process.exit(2) }
mkdirSync(out, { recursive: true })
const themes = {
  crimson: { brand: '#9D1635', accent: '#D85A70', semanticCollision: 'adjust' },
  lustre: { brand: '#F5B940', accent: '#5B3FE0', radius: 20, shape: 'pill', semanticCollision: 'adjust' },
  navy: { brand: '#0B1F4D', accent: '#6D28D9', radius: 12, semanticCollision: 'adjust' }
}
for (const [tn, cfg] of Object.entries(themes)) {
  const r = buildTheme(cfg)
  const surface = r.dark.tokens['--g-color-surface']
  for (const floor of [0, 0.66, 0.7, 0.74]) {
    let css = r.css
    if (floor) {
      const extra = {}
      const bases = { brand: cfg.brand, accent: cfg.accent }
      for (const s of ['success', 'warning', 'danger', 'info']) bases[s] = r.generated[`--g-color-${s}`] ?? DEFAULTS[`--g-color-${s}`]
      for (const [n, hex] of Object.entries(bases)) Object.assign(extra, tokensOf(n, raise(hex, floor), surface))
      const decl = Object.entries(extra).map(([k, v]) => `${k}: ${v};`).join(' ')
      css += `\n@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ${decl} } }\n[data-theme="dark"] { ${decl} }\n`
    }
    writeFileSync(`${out}/${tn}-${floor || 'base'}.css`, css)
  }
}
console.log(`variantes en ${out}`)
