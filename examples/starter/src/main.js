import { createApp } from 'vue'
import App from './App.vue'
import Grana from '@grana/vue'

import '@grana/vue/style.css'
import '@grana/vue/fonts.css'
import 'virtual:grana/tokens.css'
import './styles.css'

createApp(App).use(Grana).mount('#app')
