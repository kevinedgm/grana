// Tipos de @grana/blocks (dueño: bruno). Gestión (dist/blocks.d.ts) sigue mínimo hasta su primer block; Marketing
// (dist/marketing.d.ts) se genera desde los meta.json de sección con scripts/marketing-types.mjs (#443, #815).
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildMarketingTypes } from './marketing-types.mjs'

const dist = resolve(dirname(fileURLToPath(import.meta.url)), '../dist')
mkdirSync(dist, { recursive: true })
writeFileSync(resolve(dist, 'blocks.d.ts'), 'export {}\n')
const marketing = buildMarketingTypes()
console.log(`tipos de marketing: ${marketing.sections.length} secciones, ${marketing.variants.length} variantes`)
