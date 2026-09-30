// Genera los módulos de iconos desde lucide-static (ISC): docs/contract/icons.md §2.
//   src/icons/lucide.js           · solo los iconos de la librería (lista «library» de scripts/icons.json)
//   playground/lucide-icons.js    · los iconos de ejemplo que pone «la aplicación» en el playground (lista «playground»)
//   ../../design/lab/lucide-icons.js · los de la librería y los de ejemplo de los bancos y prototipos (listas «library» y «lab»), con el ayudante window.lucide(nombre, clase, rellena)
// Uso: node scripts/build-icons.mjs   (una prueba comprueba que los archivos no se desfasen)
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const pkgDir = dirname(require.resolve('lucide-static/package.json'))
const version = JSON.parse(readFileSync(resolve(pkgDir, 'package.json'), 'utf8')).version

/** Trazos de un icono de Lucide (lo que hay dentro de <svg>), en una sola línea */
export const readIcon = (name) => {
  const svg = readFileSync(resolve(pkgDir, 'icons', `${name}.svg`), 'utf8')
  const inner = svg.slice(svg.indexOf('>', svg.indexOf('<svg')) + 1, svg.lastIndexOf('</svg>'))
  return inner.replace(/\s*\n\s*/g, '').replace(/\s+\/>/g, '/>').trim()
}

const literal = (names) => names.map((n) => `  ${JSON.stringify(n)}: ${JSON.stringify(readIcon(n))}`).join(',\n')
const banner = `// GENERADO por scripts/build-icons.mjs desde lucide-static v${version} (ISC). No editar a mano.\n// Iconos de Lucide (https://lucide.dev): ver THIRD-PARTY-NOTICES.md. Una prueba comprueba que no se desfase.\n`


const VARS = String.raw`window.lucideVars = (names, filled = false) => names.forEach((n) => document.documentElement.style.setProperty((filled ? '--if-' : '--i-') + n, "url('data:image/svg+xml," + encodeURIComponent(window.lucide(n, '', filled).replace(' class="g-icon' + (filled ? ' g-icon--filled' : '') + '"', '').replace(/currentColor/g, 'black')) + "')"))`

// Módulo de los bancos: los iconos y el ayudante window.lucide(nombre, clase, rellena) que devuelve el <svg>
const labModule = (banner, names) => [
  banner.trimEnd(),
  '// Iconos de Lucide para los bancos de prueba y prototipos de design/lab.',
  'window.LUCIDE_ICONS = {',
  literal(names),
  '}',
  "// window.lucide('check', 'clase', false) → el <svg> de Lucide (decorativo, currentColor); con GIcon.css se dimensiona a 1em",
  'window.lucide = (name, cls = \'\', filled = false) =>',
  '  \'<svg class="g-icon\' + (cls ? \' \' + cls : \'\') + (filled ? \' g-icon--filled\' : \'\') + \'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="\' + (filled ? \'currentColor\' : \'none\') + \'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">\' + (window.LUCIDE_ICONS[name] || \'\') + \'</svg>\'',
  "// window.lucideVars(['check']) → define --i-check en :root (con `true` de segundo argumento, --if-<nombre> con el icono relleno): el mismo trazo de Lucide como máscara (marcas de pseudo-elementos: background: currentColor; mask: var(--i-check) center / contain no-repeat)",
  VARS,
  ''
].join('\n')

export const generate = () => {
  const lists = JSON.parse(readFileSync(resolve(here, 'icons.json'), 'utf8'))
  return {
    lib: `${banner}export const ICONS = {\n${literal(lists.library)}\n}\n`,
    playground: `${banner}// Iconos de ejemplo del playground (los que «la aplicación» pone en los slots).\nwindow.LUCIDE_ICONS = {\n${literal(lists.playground)}\n}\n`,
    lab: labModule(banner, [...new Set([...lists.library, ...lists.lab])].sort())
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = generate()
  writeFileSync(resolve(here, '../src/icons/lucide.js'), out.lib)
  writeFileSync(resolve(here, '../playground/lucide-icons.js'), out.playground)
  writeFileSync(resolve(here, '../../../design/lab/lucide-icons.js'), out.lab)
  console.log('iconos de Lucide generados (v' + version + ')')
}
