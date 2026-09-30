// Regenera src/defaults.js desde el tema por defecto de @grana/vue (packages/vue/src/styles/defaults.css).
// El CLI necesita los valores por defecto (superficie, texto, bordes…) para validar contrastes sin importar el paquete de componentes.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const css = readFileSync(resolve(here, '../../vue/src/styles/defaults.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
const tokens = {}
for (const m of css.matchAll(/(--g-[a-z0-9-]+)\s*:\s*([^;]+);/g)) tokens[m[1]] = m[2].trim().replace(/\s+/g, ' ')
const body = Object.entries(tokens).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n')
writeFileSync(
  resolve(here, '../src/defaults.js'),
  `// GENERADO por scripts/sync-defaults.mjs desde packages/vue/src/styles/defaults.css. No editar a mano.\n// Una prueba comprueba que no se desfase.\nexport const DEFAULTS = {\n${body}\n}\n`
)
console.log(`defaults.js: ${Object.keys(tokens).length} tokens`)
