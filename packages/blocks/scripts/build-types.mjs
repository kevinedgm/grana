// Tipos de @grana/blocks (dueño: bruno). Gestión (dist/blocks.d.ts) sigue mínimo hasta su primer block; cada familia
// (dist/marketing.d.ts, dist/booking.d.ts) se genera desde los meta.json de sección con scripts/section-types.mjs (#443,
// #815, #860). Marketing va primero: los tipos a mano de Booking importan los comunes de types/marketing.d.ts.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FAMILIES, buildFamilyTypes } from './section-types.mjs'

const dist = resolve(dirname(fileURLToPath(import.meta.url)), '../dist')
mkdirSync(dist, { recursive: true })
writeFileSync(resolve(dist, 'blocks.d.ts'), 'export {}\n')
for (const family of Object.keys(FAMILIES)) {
  const r = buildFamilyTypes({ outDir: dist, family })
  console.log(`tipos de ${family}: ${r.sections.length} secciones, ${r.variants.length} variantes`)
}
