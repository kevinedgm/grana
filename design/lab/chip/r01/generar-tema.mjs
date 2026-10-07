// Tema de prueba de la ronda r01 de la etiqueta (kiwi): el tema por defecto + 8 categorías (tokens.md §16.3),
// para que los conceptos usen los colores de categoría reales que el motor produce. No toca el tema por defecto.
// Ejecutar: node design/lab/chip/r01/generar-tema.mjs
import { writeFileSync } from 'node:fs'
import { generateTheme, toCss } from '../../../../packages/cli/src/index.js'

const config = { categories: 8 }
const r = generateTheme(config)
writeFileSync(new URL('./tema-cat8.css', import.meta.url), toCss(r.generated, { source: JSON.stringify(config), dark: r.dark }) + '\n')
console.log('tema-cat8.css', Object.keys(r.generated).filter((k) => k.includes('cat-')).length, 'tokens de categoría')
