# Dirección creativa de kiwi en Grana

Adaptación de `kiwi-art-director` (ver `kiwi-art-director/LEEME.md`) al reparto del Fruti Squad. El origen dirige arte de **pantallas** y escribe el CSS final; en Grana kiwi diseña **componentes** de una librería tematizable y el CSS es de coco. Por eso aquí la dirección creativa sirve para una cosa: que los conceptos A/B/C de cada ronda sean **distintos de verdad y memorables**, sin romper el contrato de tokens ni la accesibilidad.

## 1. Qué se adopta, qué se traduce y qué se anula

| Del origen | En Grana | Por qué |
| --- | --- | --- |
| Dos etapas: estructura antes que estilo | **Se adopta con la forma de Grana:** la base funcional (semántica, foco, anuncios, estados) se decide primero y no la cambia ningún concepto; los conceptos A/B/C van en la misma ronda, ya con tokens reales | Regla del usuario del 2026-10-04 (CLAUDE.md «conceptos antes que caja»): juzgar identidad en gris no funcionó |
| Tres alternativas A/B/C neutras en gris | **Se anula el gris para los conceptos.** Gris solo para la base funcional | Misma regla |
| Brief con intención emocional, hechos / supuestos / incógnitas | **Se adopta** (`estructura.md`) | Da criterio a la elección del usuario y evita inventar requisitos |
| Metáfora de material con nombre poético | **Se adopta como motor de divergencia** de A/B/C (§2). No produce CSS | Fuerza a cuestionar la premisa de la forma, no a recolorear la misma caja |
| Direction card | **Se traduce** a «ficha de dirección» por concepto (§3) | coco la usa como intención; lima registra la elegida en `DECISIONS.md` |
| Test de sustitución | **Se adopta**, adaptado a componentes (§4) | Es la prueba de «Qué lo hace distinto» |
| Hipótesis de personalidad y riesgo de novedad | **Se adopta** (§4) | La innovación nunca sacrifica accesibilidad (CLAUDE.md) |
| Motion Trinity (entrada, hover, clic) | **Se traduce** a tokens de Grana (§5) | Ya existen `--g-ease-*` y `--g-duration-*` (#299 a #305) |
| Auto-auditoría de seis preguntas | **Se reemplaza** por la huella genérica de componente (§6) | Las preguntas de página (hero, cards) no aplican a un componente |
| Formato de issue: observación → consecuencia → cambio → re-verificación | **Se adopta** (`estados-y-validacion.md`) | Hace verificable cada hallazgo |
| «No declares impecable»; etiquetar lo no verificado | **Se adopta** (ya era la regla «qué NO verificaste») | |
| Fuentes prohibidas / permitidas | **Se anula.** La familia es `--g-font-ui` / `--g-font-title` (Instrument Sans por defecto) y la elige el tema | El color y la tipografía los pone cada proyecto |
| Iconos: Lucide prohibido; Phosphor, Remix, Tabler | **Se anula.** Solo Lucide (`docs/contract/icons.md`, #85 a #87) | Decisión vigente de Grana |
| Fondos near-black, sin `#FFFFFF`, paletas, gradientes | **Se anula.** Ningún color literal; solo roles del tema | Contrato de tokens; los valores por defecto son de coco |
| Spacing 8, 13, 21, 34, 55, 89 y escala 1.618 / 1.414 | **Se anula** como valores. Solo vale como argumento de proporción interna (p. ej. «el asa mide space × 6») | Las medidas salen de `--g-space-*` y de los mínimos de accesibilidad |
| `cubic-bezier` literales | **Se anula.** `--g-ease-spring`, `--g-ease-bounce`, `--g-ease-out`, `--g-ease-standard` | Contrato de tokens |
| «Toda interfaz estática está muerta» | **Se matiza:** cada estado necesita respuesta, pero el movimiento solo si comunica (estado, atención u origen). Hay componentes donde «nada se mueve» es la personalidad (isla de estado D1, huella de `GTag`) | DECISIONS #316, #460 |
| Placeholders: ni Lorem ni «John Doe» | **Se adopta**: datos del dominio del brief, con extremos (texto 3× más largo, cero, vacío, RTL) | Ya era práctica de las rondas |
| «Avatar circular con iniciales» como señal genérica | **Se anula** para `GAvatar` (ya decidido, #293 a #298) | |
| Hooks automáticos de Kiro/Claude Code | **No se instalan.** Se usa el guion manual `scripts/huella.mjs` | Un hook de proyecto afectaría a todos los roles y a archivos que no son de kiwi |

## 2. Material como motor de divergencia

Antes de dibujar A/B/C, kiwi escribe tres **metáforas de material** distintas entre sí, una por concepto (dos solo si no cabe un tercer concepto distinto de verdad; CLAUDE.md admite «dos o tres» y la declaración dice por qué). Cada una tiene:

- **Nombre** con imagen física («Tinta que se seca», «Pestaña que viaja», «Molde»).
- **Física:** cómo aparece, cómo responde al puntero y al teclado, cómo se va, qué pasa en el límite.
- **Consecuencia estructural:** qué cambia en anatomía, jerarquía o interacción por seguir esa física. Si la respuesta es «solo el color o el radio», no es un concepto: se descarta.

Ejemplos ya aprobados que siguen esta lógica: `GTooltip` A «pestaña que viaja» (la etiqueta cuelga del control y se relevan entre controles), `GTag` A «Huella» (quitar deja el contorno y nada se mueve hasta que foco y puntero salen), `GEmpty` A «Molde» (la plantilla sin tinta que recibe el contenido en su sitio). `kiwi-art-director/material-archetypes.md` es repertorio de inspiración; sus valores CSS no se usan.

Los tres conceptos deben diferir en al menos uno de estos ejes (como en el origen): **estructura, jerarquía, densidad o interacción.** Tres versiones del mismo esqueleto con distinto radio no cuentan.

## 3. Ficha de dirección (una por concepto, en `declaracion.md`)

| Campo | Contenido |
| --- | --- |
| Concepto | Nombre y física en una frase |
| Intención | Qué debe sentir el usuario, conectada con la intención emocional del brief |
| Consecuencia estructural | Qué cambia frente a la base y frente a los otros dos conceptos |
| Forma | Cómo usa roles del tema: superficie, `accent`, `{familia}-text`, radios `--g-radius-*`, densidad. Sin literales |
| Movimiento | Entrada, respuesta y confirmación con `--g-ease-*` y `--g-duration-*`; versión con movimiento reducido (patrón único, #299 punto 3) |
| Motivo distintivo | El detalle que solo este componente tendría y que sobrevive al test de sustitución |
| Riesgo de novedad | Qué pierde un usuario con prisa, con lector de pantalla o con teclado, y cómo se mitiga |
| Tokens nuevos | Si el concepto pide un token que no existe: hallazgo para lima, nunca un literal |
| Excepciones | Reglas del origen que este concepto no sigue porque Grana manda (normalmente ninguna nueva) |

En la comparativa final, la recomendación de kiwi se razona con estas fichas. Lima registra la ficha del concepto elegido en `DECISIONS.md` (decisión de personalidad, CLAUDE.md).

## 4. Pruebas de personalidad

**Test de sustitución (por concepto).** Si este concepto, cambiando el nombre del componente, sirviera igual para cualquier otro control, no tiene motivo distintivo. Pregunta concreta: *¿qué detalle de la forma o del comportamiento solo tiene sentido para esta tarea?* Si la respuesta es «ninguno», el concepto se rehace.

**Test de la librería vecina.** Abre mentalmente el mismo componente en Material, Vuetify, Radix y shadcn. Si el concepto se confunde con alguno, se rehace (es la reacción del usuario al r01 del aviso: «ya lo vi en otros frameworks»).

**Riesgo de novedad (por decisión distintiva).**

1. ¿Qué entiende, decide o descubre mejor el usuario gracias a ella?
2. ¿Qué pierde quien la ve por primera vez, con prisa o con tecnología de asistencia?
3. Si la respuesta a la primera es «nada», es decorativa: se simplifica o se quita.

Esta prueba alimenta el apartado obligatorio **«Qué lo hace distinto»**.

## 5. Movimiento con propósito

| Momento | Propósito | En Grana |
| --- | --- | --- |
| Entrada | Orientar: qué apareció, desde dónde | Origen en el disparador cuando lo hay (#299 a #305); `--g-ease-out` |
| Respuesta (hover, foco) | Anticipar: esto responde | Cambio de luz o borde, no escala; `:focus-visible` con el mismo trato más el anillo de foco |
| Confirmación (clic, envío, tope) | Confirmar o negar | `--g-ease-spring` / `--g-ease-bounce` breves; sacudida única al rechazar (#304) |

Límites de #299: nada supera 240 ms; la salida es más corta que la entrada; nada se anima al montar; `--g-ease-spring` y `--g-ease-bounce` tienen usos aprobados cerrados y **un uso nuevo es una decisión nueva** (hallazgo para lima; si es de identidad, pregunta al usuario).

Con `prefers-reduced-motion: reduce` (patrón único, #299 punto 3) se quedan color, borde y opacidad; se van desplazamientos, escalas, rebotes y sacudidas. La información que da el movimiento es siempre redundante con texto, foco, forma o marca. Nunca `transition: all`, `linear` en una interfaz ni un `scale(1.02)` de relleno.

## 6. Huella genérica de componente (sustituye a la auto-auditoría de seis preguntas)

Antes de entregar, responde por cada concepto. **Dos o más «sí» → el concepto se rehace**; cada «sí» aislado se justifica en la declaración.

1. ¿Es la forma que el componente tiene en Material, Vuetify o shadcn, solo con otros tokens?
2. ¿El único cambio frente a la base es color, radio o sombra?
3. ¿Hay un movimiento sin propósito (fade de 300 ms, `scale` al hover, `transition: all`)?
4. ¿Los datos de ejemplo son de relleno (Lorem, «Opción 1», «John Doe») o no incluyen extremos?
5. ¿Un icono es la única señal de una acción o un estado?
6. ¿El concepto no cambia nada en anatomía, jerarquía, densidad ni interacción?

La accesibilidad tiene su propia compuerta **sin umbral** (`kiwi-art-director/accessibility-gates.md` con los mínimos de Grana): un solo fallo de contraste, foco visible, área táctil, teclado, movimiento reducido o semántica bloquea la entrega.

Comprobación automática de apoyo (no sustituye la lectura):

```bash
node .agents/skills/grana-kiwi/scripts/huella.mjs design/lab/<nombre>/rNN
```
