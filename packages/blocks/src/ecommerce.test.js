// @vitest-environment node
// @grana/blocks/ecommerce · la entrada (dueño: bruno; _comun.md §32, §33 punto 9, #444, #909). En Node, sin DOM: importar la
// entrada y renderizar en servidor no toca `window` ni `document`.
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createIcons } from '@grana/vue'
import * as lucide from 'lucide-static'
import * as entry from './ecommerce.js'

const metas = readdirSync('src/blocks').filter((d) => /^Gb[A-Z]/.test(d)).map((d) => JSON.parse(readFileSync(`src/blocks/${d}/${d}.meta.json`, 'utf8')))
const variants = metas.filter((m) => m.family === 'ecommerce').flatMap((m) => m.variants.map((v) => v.name))

describe('@grana/blocks/ecommerce', () => {
  it('exporta exactamente las variantes de los meta.json, cartTotals y el plugin', () => {
    expect(Object.keys(entry).sort()).toEqual([...variants, 'cartTotals', 'ecommerce'].sort())
    expect(typeof entry.cartTotals).toBe('function')
  })
  it('se importa en Node sin DOM (sin efectos en el nivel superior, #444)', () => {
    expect(typeof globalThis.window).toBe('undefined')
    expect(typeof globalThis.document).toBe('undefined')
  })
  it('el plugin registra todas las variantes (y no cartTotals)', () => {
    const seen = []
    entry.ecommerce.install({ component: (name, c) => seen.push([name, c]) })
    expect(seen.map(([n]) => n).sort()).toEqual([...variants].sort())
    for (const [n, c] of seen) expect(c).toBe(entry[n])
  })
  it('sin CSS y sin Booking: la entrada no importa hojas de estilo ni @grana/vue/booking (§34)', () => {
    const code = readFileSync('src/ecommerce.js', 'utf8')
    expect(code).not.toMatch(/\.css['"]/)
    // Ningún módulo de Ecommerce importa common/booking.js (arrastraría describeQuery)
    for (const m of metas.filter((x) => x.family === 'ecommerce')) {
      for (const f of readdirSync(`src/blocks/${m.name}`).filter((x) => /\.(vue|js)$/.test(x) && !x.endsWith('.test.js') && !x.endsWith('.bank.js'))) {
        expect(readFileSync(`src/blocks/${m.name}/${f}`, 'utf8'), `${m.name}/${f}`).not.toMatch(/from\s+['"](\.\.\/common\/booking\.js|@grana\/vue\/booking)['"]/)
      }
    }
    for (const f of ['ecommerce.js', 'ProductCard.js', 'locale.js', 'price.js', 'priceRegion.js']) expect(readFileSync(`src/blocks/common/${f}`, 'utf8')).not.toMatch(/from\s+['"](\.\/booking\.js|@grana\/vue\/booking)['"]/)
  })
  it('SSR de las variantes con su banco, en Node, sin errores', async () => {
    for (const meta of metas.filter((m) => m.family === 'ecommerce')) {
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
        expect(typeof globalThis.window).toBe('undefined')
        expect(html, v.name).toContain(`data-gb="${v.tag.slice(3)}"`)
        expect(errors, v.name).toEqual([])
      }
    }
  })
})

describe('@grana/blocks/ecommerce · paquete', () => {
  it('exports, typesVersions y la entrada de Vite', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
    expect(pkg.exports['./ecommerce']).toEqual({ types: './dist/ecommerce.d.ts', import: './dist/ecommerce.js', default: './dist/ecommerce.js' })
    expect(pkg.typesVersions['*'].ecommerce).toEqual(['./dist/ecommerce.d.ts'])
    expect(readFileSync('vite.config.js', 'utf8')).toContain("ecommerce: 'src/ecommerce.js'")
  })
  it('no reexporta GbPolicies (las políticas de la tienda se importan de booking, §35)', () => {
    expect(Object.keys(entry).some((k) => k.startsWith('GbPolicies'))).toBe(false)
  })
  it('meta.json de la familia: draft, bundle.entry y sin cap hasta que lima fije los topes (#909)', () => {
    for (const m of metas.filter((x) => x.family === 'ecommerce')) {
      expect(m.status, m.name).toBe('draft')
      expect(m.bundle.entry).toBe('@grana/blocks/ecommerce')
      expect(m.bundle.cap, m.name).toBeUndefined()
    }
  })
})
