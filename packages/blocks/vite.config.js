import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// @grana/blocks: solo ESM. `vue` y `@grana/vue` (y sus subrutas: /hero y /tag en Marketing; /booking, /gallery, /price,
// /hero y /tag en Booking) son externos: el paquete no lleva copia de ninguno.
// No hay fuentes ni recursos en el CSS (Vite los incrustaría en base64).
const external = (id) => id === 'vue' || id === '@grana/vue' || id.startsWith('@grana/vue/')

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      // Una entrada por familia (#815, #860): Gestión en blocks.js, Marketing en marketing.js y Booking en booking.js (sin CSS).
      // Lo de common/ que usan dos familias va en un trozo compartido interno (no se exporta; la medida lo incluye, §19)
      entry: { blocks: 'src/index.js', marketing: 'src/marketing.js', booking: 'src/booking.js' },
      formats: ['es'],
      fileName: (_format, name) => `${name}.js`,
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
