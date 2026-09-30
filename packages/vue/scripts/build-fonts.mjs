// Copia la fuente por defecto (Instrument Sans, OFL) a dist/fonts/ y genera dist/fonts.css.
// Vive fuera del pipeline de Vite a propósito: en modo librería, Vite incrusta en base64
// cualquier archivo que el CSS referencie, y eso metía la fuente dentro de grana.css.
// Dueño: bruno (mecanismo del tema).
import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs'
import { dirname, join, basename, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(here, '..')
const dist = join(pkgRoot, 'dist')
const fontsOut = join(dist, 'fonts')
const pkgName = '@fontsource-variable/instrument-sans'

// npm workspaces instala las dependencias en la raíz del repo; se busca en ambos lugares.
const candidates = [
  join(pkgRoot, 'node_modules', pkgName),
  join(pkgRoot, '..', '..', 'node_modules', pkgName)
]
const source = candidates.find((dir) => existsSync(join(dir, 'index.css')))
if (!source) {
  console.error(`No se encontró ${pkgName}. Ejecuta: npm install -D ${pkgName} -w @grana/vue`)
  process.exit(1)
}

mkdirSync(fontsOut, { recursive: true })

const css = readFileSync(join(source, 'index.css'), 'utf8')
const copied = new Set()
const rewritten = css.replace(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g, (match, ref) => {
  const file = join(source, ref)
  if (!existsSync(file)) {
    console.error(`Falta el archivo referenciado: ${ref}`)
    process.exit(1)
  }
  const name = basename(file)
  if (!copied.has(name)) {
    copyFileSync(file, join(fontsOut, name))
    copied.add(name)
  }
  return `url(./fonts/${name})`
})

const header = '/* Grana · fuente por defecto: Instrument Sans (SIL Open Font License). Opcional. */\n'
writeFileSync(join(dist, 'fonts.css'), header + rewritten)
console.log(`fonts.css generado; ${copied.size} archivos en dist/fonts/`)
