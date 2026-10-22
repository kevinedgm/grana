// Genera dist/utilities.css: las clases utilitarias de Grana sueltas (@grana/vue/utilities.css, #810).
// Contenido: la declaración de orden de capas completa (#806) + las reglas de src/styles/utilities.css dentro de
// @layer grana.utilities { … }. Vive fuera del pipeline de Vite (como build-fonts.mjs): el archivo fuente no declara
// su capa y Vite no debe reescribirlo. La minificación es mínima y segura: quita comentarios y espacios sobrantes sin
// tocar selectores, propiedades ni valores. Dueño: bruno (empaquetado); el CSS es de coco.
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(here, '..')
const source = join(pkgRoot, 'src', 'styles', 'utilities.css')
const dist = join(pkgRoot, 'dist')
const ORDER = '@layer grana.defaults,grana.components,grana.blocks,grana.utilities;'

if (!existsSync(source)) {
  console.error(`No se encontró ${source}`)
  process.exit(1)
}

const raw = readFileSync(source, 'utf8')
if (/@layer|!important|@import/.test(raw.replace(/\/\*[\s\S]*?\*\//g, ''))) {
  console.error('utilities.css no debe declarar @layer, @import ni !important (#806, #808).')
  process.exit(1)
}

const rules = raw
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*\{\s*/g, '{')
  .replace(/\s*;\s*/g, ';')
  .replace(/;?\s*\}\s*/g, '}')
  .replace(/:\s+/g, ':')
  .trim()

if (!rules || (rules.match(/\{/g) || []).length !== (rules.match(/\}/g) || []).length) {
  console.error('utilities.css quedó vacío o con llaves descompensadas tras minificar.')
  process.exit(1)
}

const header = '/* Grana · clases utilitarias sueltas (necesitan los tokens: style.css o un tema del CLI). */\n'
mkdirSync(dist, { recursive: true })
writeFileSync(join(dist, 'utilities.css'), `${header}${ORDER}\n@layer grana.utilities{${rules}}\n`)
console.log(`utilities.css generado (${(rules.match(/\{/g) || []).length} reglas)`)
