import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import grana from '@grana/cli/vite'

export default defineConfig({
  plugins: [
    vue(),
    grana({ config: 'grana.config.json' })
  ]
})
