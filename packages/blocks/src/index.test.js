import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = dirname(fileURLToPath(import.meta.url))

describe('@grana/blocks · entrada', () => {
  it('se importa sin efectos y sin exportar nada todavía', async () => {
    const mod = await import('./index.js')
    expect(Object.keys(mod)).toEqual([])
  })

  it('el código fuente no copia @grana/vue ni vue (solo los importa)', () => {
    const files = readdirSync(SRC, { recursive: true }).filter((f) => /\.(js|vue)$/.test(f) && !/\.test\.js$/.test(f))
    for (const f of files) {
      const code = readFileSync(resolve(SRC, f), 'utf8')
      expect(code).not.toMatch(/from\s+['"][^'"]*packages\/vue/)
      expect(code).not.toMatch(/from\s+['"]\.\.?\/[^'"]*grana\.js['"]/)
    }
  })
})
