// Entrada `@grana/vue/speech` (speech.md §1, #238): la captura de voz, aparte del paquete principal. Se construye después
// de vite.config.js sin vaciar dist/.
//
// Vue y `@grana/vue` son externos. Toda importación relativa de la captura que sale de sus carpetas (GSpeechHost,
// GSpeechPill, GSpeechTrigger) se sustituye por la pieza equivalente de `__shared` del paquete principal (src/shared.js):
// la entrada no lleva copia de GBtn, GIcon ni de los útiles con estado (topModal, reservas de borde), así que una página
// con GToaster y la captura comparte un solo registro.
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { readFileSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), 'src')
const PREFIX = '\0grana-shared:'
const toKey = (file) => relative(SRC, file).split(sep).join('/')
const isOwn = (key) => key === 'speech.js' || /^components\/GSpeech(Host|Pill|Trigger)\//.test(key)

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
        this.error(`la captura importa ${key} del paquete principal y no está en src/shared.js: añádelo allí (#238).`)
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
  plugins: [sharedFromMain(), vue()],
  build: {
    emptyOutDir: false,
    lib: {
      entry: 'src/speech.js',
      name: 'GranaSpeech',
      formats: ['es', 'umd'],
      fileName: (format) => (format === 'es' ? 'speech.js' : 'speech.umd.js')
    },
    rollupOptions: {
      external: ['vue', '@grana/vue'],
      output: { exports: 'named', globals: { vue: 'Vue', '@grana/vue': 'Grana' } }
    }
  }
})
