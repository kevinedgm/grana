// Temas de prueba de la ronda r01 de GAvatar (kiwi): categorías del tema para medir el contraste de las iniciales.
// Ejecutar: node design/lab/avatar/r01/generar-temas.mjs   (usa @grana/cli del repositorio; no toca el tema por defecto)
import { writeFileSync } from 'node:fs'
import { generateTheme, toCss } from '../../../../packages/cli/src/index.js'

const temas = {
  // Tema por defecto + 12 categorías (el máximo aceptado, tokens.md §16.3)
  'tema-cat12.css': { categories: 12 },
  // Marca saturada (roja) + 8 categorías: las categorías parten medio paso después del tono de la marca
  'tema-marca-cat8.css': { brand: '#C8102E', categories: 8 }
}
for (const [file, config] of Object.entries(temas)) {
  const r = generateTheme(config)
  writeFileSync(new URL(`./${file}`, import.meta.url), toCss(r.generated, { source: JSON.stringify(config), dark: r.dark }) + '\n')
  console.log(file, Object.keys(r.generated).filter((k) => k.includes('cat-')).length, 'tokens de categoría')
}
