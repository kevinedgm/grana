// Entrada `@grana/vue/booking` (booking-bar.md «Peso y paquete», DECISIONS.md #742): GBookingBar y GPartyField, aparte del paquete principal (el margen está agotado,
// #506, #550). Se construye después de vite.config.js sin vaciar dist/. Vue y `@grana/vue` son externos; toda importación
// relativa que sale de su carpeta se sustituye por la pieza equivalente de `__shared` del principal (src/shared.js): sin
// copias (un solo registro de bordes, un solo modal superior, la misma lista de iconos). Si falta la clave, el build se detiene.
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { pureComponents } from './scripts/pure-components.mjs'
import { readFileSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), 'src')
const PREFIX = '\0grana-shared:'
const toKey = (file) => relative(SRC, file).split(sep).join('/')
// utils/bookingQuery.js (describeQuery, #862) es de esta entrada: no entra en el principal ni en __shared
const isOwn = (key) => key === 'booking.js' || key === 'utils/bookingQuery.js' || /^components\/(GBookingBar|GPartyField)\//.test(key)

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
        this.error(`la entrada booking importa ${key} del paquete principal y no está en src/shared.js: añádelo allí (#742).`)
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
      entry: 'src/booking.js',
      name: 'GranaBooking',
      formats: ['es', 'umd'],
      fileName: (format) => (format === 'es' ? 'booking.js' : 'booking.umd.js')
    },
    rollupOptions: {
      external: ['vue', '@grana/vue'],
      output: { exports: 'named', globals: { vue: 'Vue', '@grana/vue': 'Grana' } }
    }
  }
})
