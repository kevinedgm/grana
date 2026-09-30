// Copia a fonts/ las fuentes que definen los 11 temas del benchmark (desde node_modules, paquetes @fontsource) y escribe fonts/fonts.css.
// Las fuentes están instaladas solo en este laboratorio (devDependencies de design/lab/theme-playground); no son parte de @grana/vue.
// Uso: npm run setup   (se ejecuta solo antes de los tests)
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const out = join(root, 'fonts')
mkdirSync(out, { recursive: true })

// familia CSS → archivo (variable o estático, solo el subconjunto latino) y pesos
const FONTS = [
  { family: 'Inter', pkg: '@fontsource-variable/inter', file: 'inter-latin-wght-normal.woff2', weight: '100 900' },
  { family: 'Source Sans 3', pkg: '@fontsource-variable/source-sans-3', file: 'source-sans-3-latin-wght-normal.woff2', weight: '200 900' },
  { family: 'Source Serif 4', pkg: '@fontsource-variable/source-serif-4', file: 'source-serif-4-latin-wght-normal.woff2', weight: '200 900' },
  { family: 'DM Sans', pkg: '@fontsource-variable/dm-sans', file: 'dm-sans-latin-wght-normal.woff2', weight: '100 1000' },
  { family: 'Instrument Sans', pkg: '@fontsource-variable/instrument-sans', file: 'instrument-sans-latin-wght-normal.woff2', weight: '400 700' },
  { family: 'Instrument Serif', pkg: '@fontsource/instrument-serif', file: 'instrument-serif-latin-400-normal.woff2', weight: '400' }
]
const css = ['/* Generado por scripts/setup-fonts.mjs. No editar. */']
const report = []
for (const f of FONTS) {
  const src = join(root, 'node_modules', f.pkg, 'files', f.file)
  if (!existsSync(src)) { report.push(`FALTA ${f.family} (${f.pkg}/files/${f.file})`); continue }
  copyFileSync(src, join(out, f.file))
  css.push(`@font-face { font-family: "${f.family}"; font-style: normal; font-display: swap; font-weight: ${f.weight}; src: url("./${f.file}") format("woff2"); }`)
  report.push(`ok    ${f.family}`)
}
writeFileSync(join(out, 'fonts.css'), `${css.join('\n')}\n`)
console.log(report.join('\n'))
