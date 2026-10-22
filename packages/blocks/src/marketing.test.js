// @vitest-environment node
// @grana/blocks/marketing · la entrada (dueño: bruno; _comun.md §6, §8.7, #444, #815). En Node, sin DOM: importar la
// entrada y renderizar en servidor no toca `window` ni `document`.
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createIcons } from '@grana/vue'
import * as lucide from 'lucide-static'
import * as entry from './marketing.js'

const metas = readdirSync('src/blocks').filter((d) => /^Gb[A-Z]/.test(d)).map((d) => JSON.parse(readFileSync(`src/blocks/${d}/${d}.meta.json`, 'utf8')))
const variants = metas.filter((m) => m.family === 'marketing').flatMap((m) => m.variants.map((v) => v.name))

describe('@grana/blocks/marketing', () => {
  it('exporta exactamente las variantes de los meta.json y el plugin', () => {
    expect(Object.keys(entry).sort()).toEqual([...variants, 'marketing'].sort())
  })
  it('se importa en Node sin DOM (sin efectos en el nivel superior, #444)', () => {
    expect(typeof globalThis.window).toBe('undefined')
    expect(typeof globalThis.document).toBe('undefined')
  })
  it('el plugin registra todas las variantes', () => {
    const seen = []
    entry.marketing.install({ component: (name, c) => seen.push([name, c]) })
    expect(seen.map(([n]) => n).sort()).toEqual([...variants].sort())
    for (const [n, c] of seen) expect(c).toBe(entry[n])
  })
  it('sin CSS: la entrada no importa hojas de estilo', () => {
    expect(readFileSync('src/marketing.js', 'utf8')).not.toMatch(/\.css['"]/)
  })
  it('SSR de las variantes con su banco, en Node, sin errores', async () => {
    for (const meta of metas.filter((m) => m.family === 'marketing')) {
      const dir = `src/blocks/${meta.name}`
      const bankFile = readdirSync(dir).find((f) => f.endsWith('.bank.js'))
      const bank = await import(/* @vite-ignore */ resolve(process.cwd(), dir, bankFile))
      for (const v of meta.variants) {
        const app = createSSRApp({ render: () => h(entry[v.name], bank.props, bank.slots) })
        const icons = (bank.appIcons || []).map((n) => lucide[n.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase())])
        app.use(createIcons(icons))
        const errors = []
        app.config.warnHandler = (m) => errors.push(m)
        app.config.errorHandler = (e) => errors.push(String(e))
        const html = await renderToString(app)
        expect(html, v.name).toContain(`data-gb="${v.tag.slice(3)}"`)
        expect(errors, v.name).toEqual([])
      }
    }
  })
})
