// Mínimo hasta el primer block: el contrato de tipos por meta.json (#443) se añadirá con él.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = resolve(dirname(fileURLToPath(import.meta.url)), '../dist')
mkdirSync(dist, { recursive: true })
writeFileSync(resolve(dist, 'blocks.d.ts'), 'export {}\n')
