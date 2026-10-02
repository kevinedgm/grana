// Entrada de pruebas `@grana/vue/testing` (speech.md §1, #216): el adaptador simulado de la captura de voz, aparte del
// paquete principal. Se construye después de vite.config.js sin vaciar dist/.
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: 'src/testing.js',
      name: 'GranaTesting',
      formats: ['es', 'umd'],
      fileName: (format) => (format === 'es' ? 'testing.js' : 'testing.umd.js')
    },
    rollupOptions: {
      external: ['vue'],
      output: { exports: 'named', globals: { vue: 'Vue' } }
    }
  }
})
