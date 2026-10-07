import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { pureComponents } from './scripts/pure-components.mjs'

export default defineConfig({
  plugins: [vue(), pureComponents()],
  build: {
    lib: {
      entry: 'src/index.js',
      name: 'Grana',
      formats: ['es', 'umd'],
      fileName: (format) => (format === 'es' ? 'grana.js' : 'grana.umd.js'),
      cssFileName: 'grana'
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        exports: 'named',
        globals: { vue: 'Vue' }
      }
    }
  },
  test: {
    environment: 'jsdom'
  }
})
