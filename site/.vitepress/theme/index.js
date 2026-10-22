// Tema del sitio: el de VitePress (sin su fuente) vestido con Grana.
// Orden de importación = orden de las hojas: capas → VitePress → Grana → sitio.
import './layers.css'
import DefaultTheme from 'vitepress/theme-without-fonts'
import Grana, { createIcons } from '@grana/vue'
import Combobox from '@grana/vue/combobox'
import FileField from '@grana/vue/file-field'
import TimeField from '@grana/vue/time-field'
import Slider from '@grana/vue/slider'
import Tag from '@grana/vue/tag'
import LoadRegion from '@grana/vue/load-region'
import CardGroup from '@grana/vue/card-group'
import PageHeader from '@grana/vue/page-header'
import Fab from '@grana/vue/fab'
import FormFold from '@grana/vue/form-fold'
import AppShell from '@grana/vue/app-shell'
import Hero from '@grana/vue/hero'
import Gallery from '@grana/vue/gallery'
import Booking from '@grana/vue/booking'
import Price from '@grana/vue/price'
import '@grana/vue/style.css'
import '@grana/vue/fonts.css'
import '../../src/.lucide.css'
import './grana-site.css'
import Layout from './Layout.vue'
import GranaDemo from './GranaDemo.vue'
import GranaThemePlayground from './ThemePlayground.vue'
import { siteIcons } from './icons.js'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    // El paquete principal y las entradas propias que son plugins (registran <g-*>). Una que falte aquí no
    // falla al compilar: dentro de demos/G<Nombre>.vue, <g-nombre> se resuelve con la propia demo y se llama a sí misma.
    // La voz y la isla de estado son servicios: cada ejemplo crea el suyo.
    app.use(Grana).use(createIcons(siteIcons)).use(Combobox).use(FileField).use(TimeField).use(Slider).use(Tag).use(LoadRegion)
      .use(CardGroup).use(PageHeader).use(Fab).use(FormFold).use(AppShell)
      .use(Hero).use(Gallery).use(Booking).use(Price)
    app.component('GranaDemo', GranaDemo)
    app.component('GranaThemePlayground', GranaThemePlayground)
  }
}
