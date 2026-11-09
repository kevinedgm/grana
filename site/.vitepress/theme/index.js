// Tema del sitio: el marco es Grana (Layout.vue: GAppShell, GNavBar, GSidebar appearance="index" con filtro, GPageIndex
// list, GCombobox command; design/contracts/sitio-marco.md, calco del sitio anterior #1052) y de VitePress solo quedan sus
// estilos de documento (.vp-doc: Markdown, tablas,
// bloques de código con Shiki y su botón de copiar, custom-block). Sin `extends: DefaultTheme`: así no viajan
// VPNav, VPSidebar, VPDocAside, VPLocalNav ni la búsqueda en ventana, que el marco ya no pinta.
// Orden de importación = orden de las hojas: capas → VitePress → Grana → sitio.
import './layers.css'
import 'vitepress/dist/client/theme-default/styles/vars.css'
import 'vitepress/dist/client/theme-default/styles/base.css'
import 'vitepress/dist/client/theme-default/styles/utils.css'
import 'vitepress/dist/client/theme-default/styles/components/custom-block.css'
import 'vitepress/dist/client/theme-default/styles/components/vp-code.css'
import 'vitepress/dist/client/theme-default/styles/components/vp-code-group.css'
import 'vitepress/dist/client/theme-default/styles/components/vp-doc.css'
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
import PageIndex from '@grana/vue/page-index'
import PageIndexList from '@grana/vue/page-index-list'
import NavBar from '@grana/vue/nav-bar'
import SidebarIndex from '@grana/vue/sidebar-index'
// Filtro del índice de GSidebar, en su extensión (#1050, sitio-marco.md §3): sin ella, `filter` se pinta sin filtro (F5).
import SidebarFilter from '@grana/vue/sidebar-filter'
import Hero from '@grana/vue/hero'
import Gallery from '@grana/vue/gallery'
import Booking from '@grana/vue/booking'
import Price from '@grana/vue/price'
import { marketing } from '@grana/blocks/marketing'
import { booking } from '@grana/blocks/booking'
import { ecommerce } from '@grana/blocks/ecommerce'
import '@grana/vue/style.css'
import '@grana/vue/fonts.css'
import '../../src/.lucide.css'
import './grana-site.css'
// Categorías del tema (cat-1…8), como las pondría una aplicación con `categories: 8` en @grana/cli: GTag, GAvatar.
import '../../../packages/vue/playground/tag-categories.css'
import './grana-live.css'
import Layout from './Layout.vue'
import GranaDemo from './GranaDemo.vue'
import GranaLive from './GranaLive.vue'
import GranaThemePlayground from './ThemePlayground.vue'
import GranaBlockBank from './BlockBank.vue'
import { siteIcons } from './icons.js'

export default {
  Layout,
  enhanceApp({ app }) {
    // El paquete principal y las entradas propias que son plugins (registran <g-*>). Una que falte aquí no
    // falla al compilar: dentro de demos/G<Nombre>.vue, <g-nombre> se resuelve con la propia demo y se llama a sí misma.
    // La voz y la isla de estado son servicios: cada ejemplo crea el suyo.
    app.use(Grana).use(createIcons(siteIcons)).use(Combobox).use(FileField).use(TimeField).use(Slider).use(Tag).use(LoadRegion)
      .use(CardGroup).use(PageHeader).use(Fab).use(FormFold).use(AppShell).use(PageIndex).use(PageIndexList).use(NavBar)
      .use(SidebarFilter).use(SidebarIndex)
      .use(Hero).use(Gallery).use(Booking).use(Price)
    // @grana/blocks: sus secciones (<gb-*>) y, como una aplicación, las entradas de @grana/vue que componen (arriba).
    app.use(marketing).use(booking).use(ecommerce)
    app.component('GranaDemo', GranaDemo)
    app.component('GranaLive', GranaLive)
    app.component('GranaThemePlayground', GranaThemePlayground)
    app.component('GranaBlockBank', GranaBlockBank)
  }
}
