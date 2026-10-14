// Genera temas.js con el CSS real que emite @grana/cli para los temas de la ronda.
// Uso: node design/lab/surface/r02/generar-temas.mjs
import { buildTheme } from '../../../../packages/cli/src/index.js'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const TEMAS = {
  // Proyecto de la integración real (página «Hallazgos de integración real», NisaNabani)
  nisa: { brand: '#24366B', accent: '#C1D324' },
  // Caso del hallazgo 15: el acento teal sobre una marca marino
  teal: { brand: '#0B1F4D', accent: '#0F766E' }
}
const out = {}
for (const [k, cfg] of Object.entries(TEMAS)) {
  const r = buildTheme(cfg)
  if (!r.ok) throw new Error(`${k}: ${JSON.stringify(r.issues)}`)
  out[k] = { config: cfg, css: r.css }
}
const file = fileURLToPath(new URL('./temas.js', import.meta.url))
writeFileSync(file, `// Generado por generar-temas.mjs con @grana/cli. No editar a mano.\nwindow.R02_TEMAS = ${JSON.stringify(out, null, 2)}\n`)
console.log('temas.js:', Object.keys(out).join(', '))
