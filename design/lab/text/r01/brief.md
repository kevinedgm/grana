# Brief · texto suelto (`GText`, nombre de trabajo), r01 · ronda corta

> kiwi, 2026-10-22. Origen: F-L1 de coco y MK-L1 de la auditoría de `@grana/blocks/marketing` (`design/lab/blocks/marketing/auditoria.md`, 77 fallos en la última pasada); dirección (a) de **#841**, confirmada por el usuario el 2026-10-22; propuesta mínima de lima en `design/contracts/blocks/_comun.md` §11 B-L5. Prototipo: `index.html` (`?vista=casos` y `?vista=bloques&b=…`), regla propuesta en `tx.css`, «después» sobre los bloques reales con `tx.js`, verificación `verificar.mjs` (puerto 4218).

## Para qué

Dar tipografía de Grana al **texto que no va en una prop de componente**: la cita y su pie de una opinión, la garantía bajo una llamada a la acción, el texto legal de un boletín, la dirección y el horario de un pie, los párrafos de una respuesta o de una descripción larga. Lo usan, en primer lugar, los bloques de `@grana/blocks` (que no llevan CSS, #763, ni utilidades, #807); después, cualquier aplicación que quiera escribir ese texto sin hoja propia.

## El problema medido (MK-L1, bloques reales, tema por defecto, rústico y lujo)

| Bloque | Antes (texto nativo) |
| --- | --- |
| Testimonials 01–03 | `figure` y `blockquote` con 14–16 / **40** px de margen (la cita entra 80 px); `p` de la cita con 14–16 px; `cite` en cursiva; en 02 la lista a 16 px (en rústico, fuera de la escala de 17) |
| CTA 01–03 | `assurance` a 16 px frente a la descripción de 14 (en rústico, fuera de escala); en 02, 12 px de margen en el pie de la tarjeta |
| Newsletter 01–03 | `legal` a 16 px frente a la ayuda de 12; **54–56 px** entre la ayuda y el legal (dos márgenes de `p` sumados al `gap`) |
| Footer 01–03 | `address` y sus líneas en cursiva; líneas y horario con 16 px de margen; nota a 16 px (fuera de la escala de rústico) |
| Stats 03 | párrafos con 16 px de margen (el primero se separa del título 16 px más que en 01), a 16 px en rústico |
| FAQ 01/03 | respuestas separadas por el margen del `p` (16) y no por un ritmo; a 16 px en rústico |

## Solapes revisados antes de proponer

| Pieza | Qué comparte | Decisión |
| --- | --- | --- |
| #196 (sin primitivas `Text`/`Heading`) | «Primitiva de texto» | #841 la reabre **solo para el texto corrido**, con motivo nuevo (bloques sin CSS). `GHeading` sigue descartada: el título lo decide el contenedor. Hallazgo X-L1 para que lima enmiende #196 y `tokens.md` §23.4 |
| `GContainer prose` (#721, #751) | Prosa | `prose` **solo mide** la línea (66ch) y es de página; no quita márgenes ni cursivas ni pone rol. Conviven: `GText` dentro de `prose` debería medirse (hoy no: X-L2) |
| `GStack` (#719, #827) | Aire entre piezas | La pila sigue siendo la **única** fuente de aire entre piezas de la página; `GText` no tiene margen propio y solo pone ritmo **dentro** de su flujo. Mismo vocabulario: el ritmo de `body` es el `sm` de la pila («va con lo anterior») |
| Utilidades `g-text-*`, `g-m-*` (#804 a #811) | Rol y margen de un elemento | Son ajuste puntual de la aplicación, opcionales y **prohibidas en los bloques** (#807). No normalizan el flujo de dentro (cursivas, `small`, márgenes de `blockquote`). Frontera para `utilities.md` (X-L8) |
| `GSection` `description`, `GCard` `description`/cuerpo, `GAccordionItem`, `GInput` `hint` | Texto de componente | Siguen siendo **la** vía cuando el texto es de un hueco con nombre. `GText` va en los slots libres (cuerpo de tarjeta, panel del acordeón, `GSection` sin prop) y fuera de superficies; nunca dentro de la anatomía de un componente |
| `GSurface`/`GCard`/`GSection` con reglas de prosa (b de #841) | Normalizar lo nativo | Reservado por #841; nada en esta ronda |
| Tokens (`tokens.md` §5, §23) | Roles `body`, `body-sm`, `caption` | Se usan tal cual; **ningún token nuevo**. El ritmo sale de `--g-space-1` (#717) |

## Qué es esta ronda

Una **ronda corta**: primitiva sin forma visible propia (no aplica «conceptos antes que caja», #362), con «Qué lo hace distinto». Anatomía, reglas de ritmo, roles, tono, herencia, convivencia, qué no hace, accesibilidad, casos límite y peso; el «después» de los seis casos de MK-L1 medido sobre los bloques reales en los tres temas y los tres motores. La decisión de producto ya está tomada (#841): no hay pregunta de elección.
