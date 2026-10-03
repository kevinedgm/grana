# Brief · GAvatar (r01)

> Brief de kiwi a partir del encargo (2026-10-03), verificado contra el repo. Reabre la reserva de #123 («un `GAvatar` primitivo es una ronda propia si más de un componente lo necesita») con el motivo que pedía: hoy hay cinco huecos que lo reciben, un avatar dibujado a mano en el playground (pie de `GSidebar`) e iniciales escritas a mano en los datos (`GTable`, tarjetas de persona).

## Qué es

Un **primitivo de identidad**: la cara de una persona o de una entidad (organización, equipo, espacio) en una caja cuadrada fija. Muestra, por orden, una **imagen**, unas **iniciales** o un **icono**, y nunca cambia de tamaño al pasar de una a otra. No es interactivo, no lleva estado de presencia y no se apila (la pila queda reservada).

## Por qué ahora (consumidores reales, medidos en el repo)

| Consumidor | Hueco hoy | Qué pone hoy la aplicación | Encaje de `GAvatar` |
| --- | --- | --- | --- |
| `GCard`, slot `lead` (`card.md` l. 277, 291; #123) | `g-card__lead`, `space × 10`, `aria-hidden`, con **marco** (borde + `neutral-soft` + `radius-md`) y `> * { 100% }` | Iconos (`building-complex`, `plus`) | `size="lg"` (= `space × 10`), decorativo. Con un círculo se ven **dos formas** (hallazgo L4) |
| `GTable`, columna compuesta (`table.md` l. 49, 139, 155) | `g-table__leading`, `space × 8`, `aria-hidden`, círculo `surface-sunken` con **texto** (`leading: 'ini'`) o slot `leading-{key}` | Iniciales escritas por la aplicación en el dato (`ini: 'AL'`) | `size="md"` (= `space × 8`), decorativo; en una columna **solo con avatar**, con `label` |
| `GSidebar`, slot `user` (`sidebar.md` l. 238) | Libre; en el riel, «solo el avatar con nombre accesible que da la aplicación» | `playground/index.html` l. 965: un círculo de 32px con «AG» **dibujado a mano** | `size="md"` dentro del `<button>` de la aplicación, decorativo (el nombre es del botón) |
| `GMenu` (slot `icon`) y `GSelect` (slot `icon`) | `g-menu__icon` `space × 4.5`; `g-select__icon` `1.25em`; ambos `aria-hidden` | `GIcon name="user"` (playground l. 366) | `size="xs"`; **el hueco manda** (hallazgo L5) |
| `GTranscript`, marca de hablante (`speech.md` §21, §23; #247, #259, #260) | `g-transcript__mark`, `space × 5`, borde de control, discontinua sin asignar, crece con «AA», `data-cat` ≤ `speakerColors` | — | **No se migra** (§0 de la declaración): es una etiqueta de posición, no una identidad |
| Playground, tarjetas de persona (l. 1928) | `GCard` horizontal | Campo `ini: 'AP'` en el dato | Igual que `GCard` |

## Lo que ya está decidido y no se reabre

| Fuente | Qué fija |
| --- | --- |
| #123 | `GCard` no depende de `GAvatar`: el avatar va por `lead`; `GAvatar` se evalúa en ronda propia |
| #104 a #106, `avatar-motion.md` | `GAvatarMotion`: ilustración animada por estados, decorativa por defecto, `label` → `role="img"`, `size` desde `space` (sm 6, md 8, lg 12, xl 24), `color` semántica. Excepción de iconos solo para ilustraciones (#105) |
| #59, `badge.md` | `GBadge` no interactiva; `shape` (`circle` `square` `diamond` `triangle`) + `label` obligatorio sin texto; anclada con slot `anchor` y `placement` lógico. **Sin avatar** («Límites») |
| #85 a #87, #197 a #203 | Iconos solo Lucide; iconos propios de un componente solo de la lista de la librería; «dato → nombre; plantilla → slot» |
| #93, #94, `tokens.md` §16.3, §17.14 | Categorías `cat-1..N` solo si el tema declara `categories: N` (por defecto 0: **no existen**); son colores de identificación, no de datos; `on-cat-k-soft` ≥ 4.5:1 sobre `cat-k-soft` por derivación |
| #247, #260, `CAT_FAMILY_READERS` | Color por posición solo cuando la aplicación declara cuántas categorías tiene (`speakerColors: n`); excepción nombrada en `levels.test.js` para leer la familia condicional sin respaldo |
| #8, #23 | `--g-radius-shape` es la forma de **acciones** (botón, chip, insignia): `md` o `pill` según el tema |
| `tokens.md` §7 | Texto ≥ 12px; contraste ≥ 4.5:1; sin literales salvo 24px y 44px |

## `GAvatarMotion` y `GAvatar`: convivir, sin absorber

| | `GAvatarMotion` | `GAvatar` |
| --- | --- | --- |
| Qué representa | Una **personalidad** (asistente, mascota) que reacciona a lo que pasa | La **identidad** de alguien o algo concreto |
| Contenido | Un dibujo propio (excepción #105), siempre el mismo | Imagen de la aplicación, iniciales o icono Lucide |
| Estado | 9 estados semánticos con coreografía | Ninguno (la presencia es `GBadge` anclada) |
| Color | Semántico (`brand` … `danger`) | Neutro o categoría del tema; **nunca** semántico |
| Tamaños | sm 6 · md 8 · lg 12 · xl 24 (legibilidad del dibujo) | xs 5 · sm 6 · md 8 · lg 10 · xl 16 (huecos de los consumidores) |
| Comparten | Decorativo por defecto y `label` → `role="img"`; nunca interactivo; lado en unidades de `space` | |

`GAvatar` **no absorbe** nada de `GAvatarMotion` (ni el dibujo, ni los estados, ni el color semántico) y `GAvatarMotion` no gana imagen ni iniciales. Un asistente con foto sería `GAvatar`; un asistente que reacciona, `GAvatarMotion`. Las escalas coinciden en `sm` y `md` y difieren en `lg`/`xl` a propósito (hallazgo L10).

## Lo que decide esta ronda (estructura)

Anatomía y raíz; fuentes y su precedencia; regla de derivación de iniciales (una o dos letras, compuestos, alfabetos sin mayúsculas, escrituras anchas, emoji, vacío); carga de la imagen sin salto; decorativo frente a con nombre; escala en `space` y su encaje en cada hueco; forma; color (neutro, categoría fija o derivada por hash estable); estado de presencia y pila (entran o se reservan); `forced-colors`, movimiento reducido y RTL.

## Lo que NO es esta ronda

- No cambia `GCard`, `GTable`, `GMenu`, `GSelect`, `GSidebar` ni `GTranscript`: los ajustes que propone son **hallazgos** para sus dueños.
- No crea `GAvatarGroup` (pila) ni un prop `status`.
- No escribe contrato, CSS ni `.vue`.
