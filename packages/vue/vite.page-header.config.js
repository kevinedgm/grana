// Entrada `@grana/vue/page-header` (page-header.md «Paquete y peso», #633: el margen del principal está agotado, #550):
// GPageHeader, aparte del paquete principal. Se construye después de vite.config.js sin vaciar dist/.
//
// Vue y `@grana/vue` son externos. Toda importación relativa que sale de su carpeta (components/GPageHeader) se sustituye
// por la pieza equivalente de `__shared` del paquete principal (src/shared.js): la entrada no lleva copia del registro de
// reservas de borde (edgeReserve: uno por documento), del observador de tamaño, de formContext (spaceUnit, nextFrame) ni de
// motion (transitionMs).
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { pureComponents } from './scripts/pure-components.mjs'
import { readFileSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), 'src')
const PREFIX = '\0grana-shared:'
const toKey = (file) => relative(SRC, file).split(sep).join('/')
const isOwn = (key) => key === 'page-header.js' || /^components\/GPageHeader\//.test(key)

function sharedFromMain() {
  const declared = readFileSync(resolve(SRC, 'shared.js'), 'utf8')
  return {
    name: 'grana-shared-from-main',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!importer || importer.startsWith('\0') || !source.startsWith('.')) return null
      const key = toKey(resolve(dirname(importer.split('?')[0]), source))
      if (key.startsWith('..') || !isOwn(toKey(importer.split('?')[0])) || isOwn(key)) return null
      if (!declared.includes(`'${key}':`)) {
        this.error(`la entrada page-header importa ${key} del paquete principal y no está en src/shared.js: añádelo allí (#633).`)
      }
      return PREFIX + key
    },
    load(id) {
      if (!id.startsWith(PREFIX)) return null
      const key = id.slice(PREFIX.length)
      // syntheticNamedExports: cada importación con nombre se lee de __ns (la entrada de __shared para ese módulo)
      return {
        code: `import { __shared } from '@grana/vue'\nexport const __ns = __shared[${JSON.stringify(key)}]\nexport default __ns.default\n`,
        syntheticNamedExports: '__ns'
      }
    }
  }
}

export default defineConfig({
  plugins: [sharedFromMain(), vue(), pureComponents()],
  build: {
    emptyOutDir: false,
    lib: {
      entry: 'src/page-header.js',
      name: 'GranaPageHeader',
      formats: ['es', 'umd'],
      fileName: (format) => (format === 'es' ? 'page-header.js' : 'page-header.umd.js')
    },
    rollupOptions: {
      external: ['vue', '@grana/vue'],
      output: { exports: 'named', globals: { vue: 'Vue', '@grana/vue': 'Grana' } }
    }
  }
})
