// Banco único de GbTrust (dueño: bruno; trust.md «Banco», _comun.md §7 y §33). Barro y Agave: cuatro promesas, tres con su
// política (el ancla de GbPolicies, #880) y una con su prueba propia (los talleres). `truck` y `hand` no son de la lista de
// la librería: la aplicación los registra con createIcons (`appIcons`). Sin errores a propósito: con él, ninguna variante
// avisa (§7: el nombre largo sin espacios va en una descripción; enlace externo, en la de los talleres).
import { LONG_WORD } from '../bank/fotos.js'

export const appIcons = ['truck', 'hand']

export const props = {
  title: 'Lo que te prometemos',
  description: 'Y dónde está escrito.',
  items: [
    { id: 'envios', icon: 'truck', title: 'Envío a todo México', description: 'Sale del taller en dos días hábiles.', policy: 'envios' },
    { id: 'devoluciones', icon: 'rotate-ccw', title: 'Devoluciones en 30 días', description: `Sin preguntas, con la pieza sin usar; ${LONG_WORD}.`, policy: 'devoluciones' },
    { id: 'hecho-a-mano', icon: 'hand', title: 'Hecho a mano en Oaxaca', description: 'Cada pieza lleva el nombre de quien la hizo.', action: { label: 'Nuestros talleres', href: '/talleres' } },
    { id: 'pago', icon: 'lock', title: 'Pago seguro', description: 'Tus datos de pago no pasan por la tienda.', policy: 'pagos' }
  ],
  labels: { policy: (title) => `Ver la política: ${title}`, external: 'se abre en otra pestaña' }
}
