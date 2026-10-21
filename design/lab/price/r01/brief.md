# Brief: moneda y precio (propuestas `GPrice`, `formatPrice` y `GNumberField currency`), r01

> kiwi, 2026-10-21. Encargo: ronda de moneda (#154), adelantada por el usuario el 2026-10-21 (#745, punto 1; hallazgo M-L1 de `design/lab/marketing/r01/`). Es el **lote 1** del plan de bloques (`design/lab/blocks/plan.md` §5). Desbloquea Pricing, Product card, Cart, Checkout, Order summary, Offer list, Menu/carta y Availability.

## Problema

Las plantillas de Oaxaca (hotel, restaurante, tour) y las de comercio muestran precios en casi todas las secciones. Hoy cada pantalla los escribe a mano con `Intl.NumberFormat` (o con una cadena), y eso trae los mismos errores:

- **El «$» es ambiguo.** En una página `es-MX`, «$1,850» es un precio en pesos, pero un turista de EE. UU. lo lee como dólares. El símbolo «$» lo usan 30 monedas (lo medimos con los datos de `Intl`). Si la página mezcla MXN y USD, el símbolo solo no basta.
- **El lector de pantalla dice otra cosa.** «$1,850 MXN / noche» se lee como «dólar mil ochocientos cincuenta, eme equis ene, barra, noche». La persona que no ve la pantalla no sabe la moneda ni la unidad.
- **El tachado no se oye.** `<s>$2,300</s>` no lo anuncia ningún lector común, y además suele pintarse con poco contraste. Tampoco dice qué es esa referencia: puede ser un precio de temporada alta o un ancla inventada.
- **Los decimales no son siempre dos.** JPY y CLP no tienen decimales; KWD tiene tres. Escribir «.00» a mano falla con esas monedas.
- **El campo de precio** de un formulario de gestión (NisaNabani) hoy es `GNumberField prefix="$"`. Su contrato (#310, `number-field.md` «Cuándo usarlo») lo prohíbe expresamente como sustituto de una moneda.

## Quién lo usa

- **El viajero en el teléfono** compara hoteles, restaurantes y tours en Oaxaca. Lee en español o en inglés y ve precios en MXN y en USD. Necesita saber la moneda, la unidad («por noche», «por persona») y, si ya eligió fechas, cuánto le va a costar en total.
- **El comprador en el carrito** quiere líneas, descuentos y un total que cuadren, con las cifras alineadas.
- **La persona de administración** (NisaNabani) captura precios en un formulario: los escribe, los pega desde una hoja de cálculo y a veces elige la moneda.
- **Lector de pantalla, zoom 200–400 %, movimiento reducido, RTL** (`ar-EG`), `forced-colors`.

## Alcance

1. **Precio de lectura.** Incluye «desde», unidad, referencia (`compareAt`), rango, «Gratis», «a consultar», aproximado, negativo (descuento), monedas con 0 y 3 decimales, otro idioma y RTL. Tamaños para la tarjeta, la carta, el pie del carrito y el día del calendario. **Sin conversión:** la aplicación da `{ amount, currency }` (ISO 4217) y el idioma sale del `lang` del ancestro, como en `GNumberField`.
2. **Campo de moneda.** Hay que decidir si es un componente nuevo o una extensión de `GNumberField` (#310 dejó la moneda para esta ronda).
3. **Base funcional y conceptos A/B/C** para la forma y el comportamiento del precio de lectura, con los tokens reales del tema por defecto y los componentes reales de `dist/` (`GCard`, `GDatePicker`, `GNumberField`, `GSelect`, `GRadioGroup`, `GFormLayout`, `GFormRow`).

**Fuera de alcance:** conversión de divisas, tipos de cambio, impuestos calculados, pago y motor de carrito. Una utilidad `cartTotals` sin estado queda para el lote de Ecommerce.

## Solapes revisados (para no duplicar)

| Existente | Qué aporta | Qué le falta para el precio |
| --- | --- | --- |
| `GNumberField` (#309 a #314) | Motor numérico `utils/numberInput.js`, idioma por `lang` del ancestro, `precision`, `grouping`, canónico oculto, `prefix`/`suffix` con `*Label`, P1 «unidad pegada», P2 «cifras que ruedan» | Solo le faltan los decimales de la moneda, el símbolo en su lado según el idioma, el nombre de la moneda para la lectura y el pegado con símbolo. **Cabe como extensión**, y el prototipo lo demuestra con el componente real |
| `GSlider` `format` | Pasa un objeto a `Intl.NumberFormat`: ya admite `style: 'currency'` en la píldora | Nada nuevo. Debería usar la misma regla de lectura (nombre de la moneda) que `formatPrice` (P-L8) |
| `GMetric` | Cifra destacada con `value` en `String` | No da formato. Un KPI de ingresos puede llevar `formatPrice(...).text` en `value` (receta) |
| `GSummary` | Ficha de datos con prioridad | No es una oferta; un dato de precio va con `formatPrice` en su texto |
| `GDatePicker` slot `day` | Contenido bajo el número del día | **El precio no llega al nombre accesible del día** (medido: P-L6), y el círculo del día no tiene sitio para una segunda línea |
| `GBadge` | Distintivo | El ahorro de C es texto en línea, no un distintivo anclado |
| `GCard` | Tarjeta de oferta (receta R4) | No necesita nada: el precio va en el slot por defecto |

## Auditoría previa (`docs/documentacion/auditoria-visual.md` §1 y §3), contra el patrón habitual de precios

| Aspecto | Patrón habitual (tiendas, reservas, frameworks) | Incumplimiento o riesgo | Qué se hace en la ronda |
| --- | --- | --- | --- |
| Estructura | Precio suelto al pie de la tarjeta; el tachado al lado, a veces delante | El orden visual no coincide con el de lectura; el tachado delante se lee primero | El precio actual se lee primero y la referencia después, con su nombre. En C la referencia va encima, pero el orden del DOM sigue al visual |
| Jerarquía | Cifra grande, símbolo y céntimos en superíndice | El superíndice baja el tamaño por debajo de 12 px en las tarjetas pequeñas | Una sola escala por tamaño: cifra con peso de título; «desde», unidad y código un escalón abajo, nunca por debajo de `caption` (12 px medidos) |
| Contraste | Tachado en gris claro | Suele quedar por debajo de 4.5:1 | Todas las partes del precio en `text` o `text-muted` (medido ≥ 4.5:1 en claro y oscuro) |
| Espaciado | Valores sueltos entre cifra y unidad | — | `space × 2` entre partes; sin literales |
| Controles | Selector de moneda en la cabecera que recarga la página | Cambia la página sin aviso | B: el selector es de la región (`GRadioGroup segmented`) y cambia todos sus precios a la vez, sin recargar |
| Tablas y listas | Precios a la derecha con cifras proporcionales | Las cifras no se alinean | Cifras tabulares (`tabular-nums lining-nums`), alineadas al final de la fila |
| Formularios | `input type=number` con «$» pintado | Rueda del ratón, formato incoherente, «$» fijo para cualquier moneda | `GNumberField` real con props derivadas de la moneda |
| Estados | «$0.00» en vez de «Gratis»; vacío sin texto | Lectura confusa | «Gratis», «Precio a consultar» y «aprox.» como textos de la aplicación (#226) |
| Consistencia | Cada sección formatea a su manera | — | Una utilidad (`formatPrice`) para todos: `GPrice`, el slot `day`, `GSlider` y la aplicación |

Con movimiento: A reutiliza P2 de `GNumberField` («cifras que ruedan»). La rúbrica de movimiento está en `declaracion.md`.
