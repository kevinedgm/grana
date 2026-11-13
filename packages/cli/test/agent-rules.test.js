// Las seis reglas para agentes viven en dos copias (el CLI no importa scripts de @grana/vue): esta prueba las mantiene
// iguales. design/contracts/catalog.md, anotación 7. Se omite con aviso si no hay monorepo (checkout aislado del CLI).
import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { AGENT_RULES } from '../src/catalog.js'

const GEN = fileURLToPath(new URL('../../vue/scripts/build-catalog.mjs', import.meta.url))
const hay = existsSync(GEN)
if (!hay) console.warn(`aviso: no existe ${GEN}; se omite la igualdad de AGENT_RULES con el generador.`)

describe('reglas para agentes', () => {
  it.skipIf(!hay)('son idénticas a las del generador del catálogo', async () => {
    const gen = await import(pathToFileURL(GEN).href)
    expect(AGENT_RULES).toHaveLength(6)
    expect(AGENT_RULES).toEqual(gen.AGENT_RULES)
  })
})
