// Ficha interactiva de GAppShell. Controles desde GAppShell.meta.json.
import { h } from 'vue'
import { GAppShell } from '@grana/vue/app-shell'

export default {
  // Un solo chasis por documento (aviso): no cabe una ficha con casos; la página conserva su ejemplo vivo.
  unavailable: { es: 'el chasis ocupa toda la ventana y solo puede haber uno por documento; el ejemplo vivo de abajo es el real', en: 'the shell takes the whole window and only one is allowed per document; the live example below is the real one' },
  exclude: ['id'],
  block: true,
  host: GAppShell,
  imports: ["import { GAppShell } from '@grana/vue/app-shell'"],
  base: { labels: { es: { skip: 'Saltar al contenido' }, en: { skip: 'Skip to content' } } },
  slots: [
    { name: 'header', code: '<strong>Mi aplicación</strong>', render: () => h('strong', null, 'Mi aplicación') },
    { name: 'default', code: '<p>La página va aquí.</p>', render: () => h('p', { style: 'margin:0;padding:var(--g-space-4)' }, 'La página va aquí.') },
    { name: 'footer', optional: true, on: false, code: '<small>© 2026</small>', render: () => h('small', null, '© 2026') }
  ],
  cases: [
    {
      title: { es: 'Aplicación con cabecera y pie', en: 'App with header and footer' },
      why: { es: 'El chasis reparte el visor y da el enlace de salto y los puntos de referencia; una sola vez por aplicación.', en: 'The shell splits the viewport and gives the skip link and landmarks; once per application.' },
      props: {}, slots: { footer: true }
    },
    {
      title: { es: 'Cabecera de marca', en: 'Brand header' },
      why: { es: 'headerZone brand tiñe solo la banda de cabecera, nunca la raíz.', en: 'headerZone brand tints only the header band, never the root.' },
      props: { headerZone: 'brand' }
    }
  ]
}
