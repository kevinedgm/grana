// Regenera src/defaults.js desde el tema por defecto de @grana/vue (packages/vue/src/styles/defaults.css).
// El CLI necesita los valores por defecto (superficie, texto, bordes…) para validar contrastes sin importar el paquete de componentes.
// Exporta DEFAULTS (tema claro: todo lo anterior a la marca «=== OSCURO») y DARK (el grupo de color del bloque [data-theme="dark"]).
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const raw = readFileSync(resolve(here, '../../vue/src/styles/defaults.css'), 'utf8')
const parse = (text) => {
  const tokens = {}
  for (const m of text.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(--g-[a-z0-9-]+)\s*:\s*([^;]+);/g)) tokens[m[1]] = m[2].trim().replace(/\s+/g, ' ')
  return tokens
}
const [light, darkPart] = raw.split('/* === OSCURO')
const darkBlock = darkPart.split('[data-theme="dark"] {')[1].split('}')[0]
const defaults = parse(light)
const dark = parse(darkBlock)
const body = (o) => Object.entries(o).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n')
writeFileSync(
  resolve(here, '../src/defaults.js'),
  `// GENERADO por scripts/sync-defaults.mjs desde packages/vue/src/styles/defaults.css. No editar a mano.\n// Una prueba comprueba que no se desfase.\nexport const DEFAULTS = {\n${body(defaults)}\n}\n\n// Grupo de color del tema oscuro (bloque [data-theme="dark"], tokens.md §15)\nexport const DARK = {\n${body(dark)}\n}\n`
)
console.log(`defaults.js: ${Object.keys(defaults).length} tokens claros, ${Object.keys(dark).length} oscuros`)
