import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// @grana/blocks: solo ESM. `vue` y `@grana/vue` (y sus subrutas) son externos: el paquete no lleva copia de ninguno.
// No hay fuentes ni recursos en el CSS (Vite los incrustaría en base64).
const external = (id) => id === 'vue' || id === '@grana/vue' || id.startsWith('@grana/vue/')

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: 'src/index.js',
      formats: ['es'],
      fileName: () => 'blocks.js',
      cssFileName: 'blocks'
    },
    rollupOptions: {
      external,
      output: { exports: 'named' }
    }
  },
  test: {
    environment: 'jsdom'
  }
})
