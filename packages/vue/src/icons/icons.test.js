import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import GIcon from '../components/GIcon/GIcon.vue'
import { ICONS } from './lucide.js'
import { generate } from '../../scripts/build-icons.mjs'
import { scan, ROOT } from '../../scripts/check-icons.mjs'
import { parseLucide } from '../components/GIcon/registry.js'
import * as lucide from 'lucide-static'

const pkg = process.cwd() // vitest se ejecuta desde packages/vue
afterEach(() => vi.restoreAllMocks())

describe('GIcon', () => {
  it('dibuja un svg decorativo de Lucide con currentColor', () => {
    const svg = mount(GIcon, { props: { name: 'check' } }).find('svg')
    expect(svg.classes()).toContain('g-icon')
    expect(svg.attributes('viewBox')).toBe('0 0 24 24')
    expect(svg.attributes('aria-hidden')).toBe('true')
    expect(svg.attributes('focusable')).toBe('false')
    expect(svg.attributes('stroke')).toBe('currentColor')
    expect(svg.attributes('fill')).toBe('none')
    expect(svg.attributes('stroke-width')).toBe('2')
    expect(svg.html()).toContain('M20 6 9 17l-5-5')
  })

  it('filled rellena con currentColor (las figuras de estado)', () => {
    const svg = mount(GIcon, { props: { name: 'circle', filled: true } }).find('svg')
    expect(svg.attributes('fill')).toBe('currentColor')
    expect(svg.classes()).toContain('g-icon--filled')
  })

  it('un nombre desconocido avisa una vez y no dibuja nada', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(GIcon, { props: { name: 'no-existe-xyz' } })
    mount(GIcon, { props: { name: 'no-existe-xyz' } })
    expect(w.find('svg').exists()).toBe(false)
    expect(warn.mock.calls.filter((c) => String(c[0]).includes('no-existe-xyz'))).toHaveLength(1)
  })

  it('los iconos de cada lista existen en Lucide y el registro solo trae la lista de la librería', () => {
    const lists = JSON.parse(readFileSync(resolve(pkg, 'scripts/icons.json'), 'utf8'))
    expect(Object.keys(ICONS).sort()).toEqual([...lists.library].sort())
    for (const n of lists.library) expect(ICONS[n], n).toBeTruthy()
  })

  it('el módulo del playground trae las cadenas completas de lucide-static (vía pública: createIcons) con los nombres de la lista', () => {
    const lists = JSON.parse(readFileSync(resolve(pkg, 'scripts/icons.json'), 'utf8'))
    const win = {}
    new Function('window', generate().playground)(win)
    const entries = Object.entries(win.LUCIDE_STATIC)
    // cada cadena es exactamente la exportación de lucide-static con ese nombre
    for (const [key, value] of entries) expect(value, key).toBe(lucide[key])
    // y su nombre (derivado de la marca) es el de la lista: el playground usa nombres canónicos
    expect(entries.map(([, v]) => parseLucide(v).name).sort()).toEqual([...lists.playground].sort())
  })
})

describe('iconos generados', () => {
  it('src/icons/lucide.js y playground/lucide-icons.js coinciden con lucide-static (si se desfasan: npm run icons)', () => {
    const out = generate()
    expect(readFileSync(resolve(pkg, 'src/icons/lucide.js'), 'utf8')).toBe(out.lib)
    expect(readFileSync(resolve(pkg, 'playground/lucide-icons.js'), 'utf8')).toBe(out.playground)
    expect(readFileSync(resolve(ROOT, 'design/lab/lucide-icons.js'), 'utf8')).toBe(out.lab)
  })

  it('la lista de la librería es la de docs/contract/icons.md §4', () => {
    const doc = readFileSync(resolve(ROOT, 'docs/contract/icons.md'), 'utf8')
    // Solo las filas de la tabla: la «Regla» de §4 dice que un icono del paquete se añade **a esta tabla**; las notas en
    // prosa de la sección citan también iconos de la aplicación (§5: `image`, `play`, `map-pin` de los ejemplos de GCard)
    // que no entran en la lista del paquete.
    const section = doc.slice(doc.indexOf('## 4.'), doc.indexOf('## 5.')).split('\n').filter((l) => l.startsWith('|')).join('\n')
    const real = new Set(readdirSync(resolve(ROOT, 'node_modules/lucide-static/icons')).map((f) => f.replace(/\.svg$/, '')))
    const names = new Set([...section.matchAll(/`([a-z0-9-]+)`/g)].map((m) => m[1]).filter((n) => real.has(n)))
    const lists = JSON.parse(readFileSync(resolve(pkg, 'scripts/icons.json'), 'utf8'))
    expect([...names].sort()).toEqual([...lists.library].sort())
  })

  it('todo GIcon usado en los componentes está en la lista', () => {
    const lists = JSON.parse(readFileSync(resolve(pkg, 'scripts/icons.json'), 'utf8'))
    const dir = resolve(pkg, 'src/components')
    for (const c of readdirSync(dir)) {
      const f = resolve(dir, c, `${c}.vue`)
      if (!existsSync(f)) continue
      const src = readFileSync(f, 'utf8')
      for (const m of src.matchAll(/(?:<GIcon[^>]*\sname="([a-z0-9-]+)")|(?:GIcon,\s*\{[^}]*name:\s*'([a-z0-9-]+)')/g)) expect(lists.library, `${c}: ${m[1] ?? m[2]}`).toContain(m[1] ?? m[2])
    }
  })
})

// Deuda conocida de la migración a Lucide (docs/contract/icons.md): archivos que aún tienen glifos o pictogramas
// dibujados con CSS. La lista solo puede **encogerse**: un archivo nuevo con infracciones hace fallar la prueba, y
// uno corregido debe salir de la lista.
const DEUDA = []

describe('regla «Lucide es la única fuente de iconos»', () => {
  const found = scan()
  it('ningún archivo nuevo tiene glifos pictográficos, content con escapes de glifos ni clip-path: polygon', () => {
    const nuevos = Object.keys(found).filter((f) => !DEUDA.includes(f))
    expect(nuevos).toEqual([])
  })

  it('la deuda solo contiene archivos que aún incumplen (al corregir uno, quítalo de DEUDA)', () => {
    const resueltos = DEUDA.filter((f) => !found[f])
    expect(resueltos).toEqual([])
  })
})
