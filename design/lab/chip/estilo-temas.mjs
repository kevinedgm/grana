// Temas del banco de estilo de la etiqueta (coco): cuatro bases × 8 y 12 categorías, claro y oscuro, generados con
// @grana/cli (buildTheme: lee, genera y valida). No tocan el tema por defecto ni los de dark-color-presence.
//   default  · el tema por defecto + categorías (como tema-cat8.css de kiwi)
//   lustre   · design/lab/tema-oscuro/dark-color-presence/themes/lustre.json (brand ámbar claro, shape pill)
//   spotify  · ídem spotify.json (brand verde claro, accent menta)
//   propio   · primary propia (#107, tokens.md §17.4): brand azul marino, accent terracota, primary ciruela, neutros
//              teñidos, radio 10, space 5 y borde de 2px (la geometría cambia: nada puede quedar fijo)
// Ejecutar desde la raíz:  node design/lab/chip/estilo-temas.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { buildTheme } from '../../../packages/cli/src/index.js'

const read = (n) => JSON.parse(readFileSync(new URL(`../tema-oscuro/dark-color-presence/themes/${n}.json`, import.meta.url), 'utf8'))
const BASES = {
  default: {},
  lustre: read('lustre'),
  spotify: read('spotify'),
  propio: { brand: '#1F3A5F', accent: '#B4532A', primary: '#7B2D6B', neutrals: 'tinted', semanticCollision: 'adjust', radius: 10, space: 5, fontSize: 16, overrides: { '--g-border-width': '2px' } }
}
for (const [name, base] of Object.entries(BASES)) {
  for (const categories of [8, 12]) {
    const raw = { ...base, categories, dark: true }
    const r = buildTheme(raw, { source: `design/lab/chip/estilo-temas.mjs (${name}, ${categories})` })
    const errors = r.issues.filter((i) => i.severity === 'error')
    if (!r.ok) throw new Error(`${name}-cat${categories}: ${errors.map((e) => e.message).join(' | ')}`)
    writeFileSync(new URL(`./estilo-temas/${name}-cat${categories}.css`, import.meta.url), r.css + '\n')
    console.log(`${name}-cat${categories}.css`, Object.keys(r.generated).length, 'tokens;', r.issues.length, 'avisos')
  }
}
