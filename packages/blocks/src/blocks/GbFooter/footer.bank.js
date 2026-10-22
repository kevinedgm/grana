// Banco único de GbFooter (dueño: bruno; footer.md «Banco», _comun.md §7): el mismo juego de datos pasa igual por las tres
// variantes. Casa Alcalá: logo 160 × 48, contacto completo (WhatsApp externo, tel:, mailto:, horario), tres columnas con un
// enlace actual, legales, redes externas y la nota. El slot `subscribe` (lo usa 03) es GbNewsletter01 con su banco.
// Sin errores a propósito: con él, ninguna variante avisa.
import { h } from 'vue'
import { foto, LONG_WORD } from '../bank/fotos.js'
import GbNewsletter01 from '../GbNewsletter/GbNewsletter01.vue'
import * as newsletter from '../GbNewsletter/newsletter.bank.js'

/** Iconos que la página registra con `createIcons` (los de la suscripción del slot). */
export const appIcons = [...newsletter.appIcons]

export const props = {
  brand: { name: 'Casa Alcalá', href: '/', logo: { src: foto('terraza', 160, 48), width: 160, height: 48 } },
  contact: {
    address: ['Calle Macedonio Alcalá 407, Centro', `68000 Oaxaca de Juárez, Oax., México · ${LONG_WORD}`],
    channels: [
      { label: 'WhatsApp +52 951 555 0000', href: 'https://wa.me/529515550000', external: true },
      { label: 'Llamar a recepción', href: 'tel:+529515550000' },
      { label: 'hola@casaalcala.mx', href: 'mailto:hola@casaalcala.mx' }
    ],
    hours: 'Recepción 24 h'
  },
  groups: [
    { title: 'Hotel', links: [{ label: 'Habitaciones', href: '/habitaciones', current: true }, { label: 'Desayuno', href: '/desayuno' }, { label: 'Terraza', href: '/terraza' }] },
    { title: 'Visita', links: [{ label: 'Cómo llegar', href: '/notas/como-llegar' }, { label: 'Guías de Oaxaca', href: '/notas' }] },
    { title: 'Ayuda', links: [{ label: 'Preguntas frecuentes', href: '/ayuda' }, { label: 'English', href: '/en', lang: 'en', hreflang: 'en' }] }
  ],
  legal: [{ label: 'Privacidad', href: '/privacidad' }, { label: 'Términos', href: '/terminos' }],
  social: [
    { label: 'Instagram', href: 'https://instagram.com/casaalcala', external: true },
    { label: 'Facebook', href: 'https://facebook.com/casaalcala', external: true }
  ],
  note: '© 2026 Casa Alcalá',
  as: 'footer',
  labels: { nav: 'Mapa del sitio', legal: 'Legal', social: 'Redes', external: 'se abre en otra pestaña' }
}

export const slots = {
  subscribe: () => h(GbNewsletter01, newsletter.props)
}
