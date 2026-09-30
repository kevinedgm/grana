# Declaración de cumplimiento · GStepper · r01

**Estado:** aprobada para `GStepper`. Las decisiones de estructura se derivan de estándares (WCAG 2.2 AA, semántica nativa de lista y botón, `aria-current="step"`) y del brief del usuario (variantes, modos, responsive). El usuario decidió el alcance: **el progreso continuo es un componente aparte** (opción B), por lo que esta ronda **no** lo incluye.
**Ruta:** R1 · **Fidelidad:** F2 · **Material:** kit neutral de grises.
**Siguiente dueño:** lima → `design/contracts/stepper.md`.

## Composiciones verificadas

Horizontal en línea, puntos, numerado e iconos; segmentado; estados especiales; navegable; vertical con descripción y contenido; compacto; adaptativo por ancho del contenedor; nueve pasos en 340px.

## Decisiones de estructura

| # | Decisión | Fundamento |
| --- | --- | --- |
| 1 | Contenedor `<nav aria-label>` con una lista `<ol>`; cada paso es `<li>` | WCAG 1.3.1. La lista ordenada ya anuncia «lista, 5 elementos»: el total de pasos se comunica sin ARIA adicional |
| 2 | El paso actual lleva `aria-current="step"` | WAI-ARIA 1.2; WCAG 4.1.2 |
| 3 | Cada paso lleva un **texto de estado solo para lector** («completado», «con error», «bloqueado»…) aportado por el consumidor | WCAG 1.4.1, 4.1.2. Grana no trae textos por defecto (internacional), igual que `closeLabel` en `GDialog` |
| 4 | El indicador es decorativo (`aria-hidden`); el nombre accesible sale de la etiqueta | WCAG 2.4.6. La navegación nunca depende del icono (requisito del usuario) |
| 5 | Estado = **forma + peso + texto + posición**, no tono: hecho relleno + check; actual anillo + negrita + conector a medias; error borde doble + icono + subrayado; advertencia borde discontinuo + icono; bloqueado atenuado + candado; opcional con texto | WCAG 1.4.1. Verificado en escala de grises |
| 6 | `complete`/`current`/`pending` se **derivan** del índice `current`; `error`, `warning`, `disabled`, `optional` son marcas del consumidor que se combinan con lo derivado | Separación progreso → estado → variante (requisito del usuario) |
| 7 | Conector con tres estados: hecho (sólido), hacia el actual (a medias, visible) y pendiente (tenue). Más fino y más claro que los indicadores | Brief: el conector no compite con los pasos |
| 8 | **Informativo** por defecto: ningún paso es control. **Navegable:** solo los pasos permitidos son `<button>`; el actual y los bloqueados no lo son | WCAG 4.1.2 (un control inactivo no debe parecer operable); el componente representa reglas, no las decide |
| 9 | Teclado: Tab recorre los botones, Enter y Espacio activan. **Sin flechas**: no es un `tablist` (el stepper no cambia paneles por sí mismo) | APG no define un patrón «stepper»; se usa lista + botones nativos |
| 10 | Tras activar un paso, el foco va al paso actual nuevo | WCAG 2.4.3 (el botón pulsado deja de serlo al volverse el actual; se evita perder el foco) |
| 11 | Indicador intercambiable (punto, número, icono, segmento, línea) y orientación (horizontal, vertical) **sin cambiar el DOM base** | Un solo componente con dos ejes en lugar de diez |
| 12 | Segmentado: los tramos se tocan (2px) y forman una barra; la etiqueta va debajo, el tramo no es botón aislado. Error y advertencia usan **trama** distinta | Brief: no parecer botones independientes; WCAG 1.4.1 |
| 13 | Vertical: conector a lo largo del indicador; descripción y contenido asociado bajo el paso; el contenido solo del actual por defecto | Brief: contexto adicional por paso |
| 14 | Etiqueta en una línea con elipsis; el texto completo permanece en el DOM | WCAG 1.4.4 y 1.4.10; el nombre completo lo oye el lector |
| 15 | **Adaptación por ancho del contenedor** (`@container`), no de la ventana: ≥ ~640px descripciones; ~560–640 sin descripciones; < ~560 compacto | Un stepper dentro de un diálogo o panel estrecho debe adaptarse aunque la ventana sea ancha |
| 16 | Compacto: «Paso N de M», nombre actual y barra segmentada fina (decorativa, el texto ya lo dice). Un botón con `aria-expanded` despliega la lista vertical completa | Brief (patrón móvil); WCAG 4.1.2; evita comprimir etiquetas |
| 17 | Overflow: muchos pasos → compacto; el detalle vive en la lista vertical. Sin scroll horizontal en r01 | Brief; WCAG 1.4.10 |
| 18 | Con `pointer: coarse`, pasos navegables y botón de desplegar ≥ 44px | WCAG 2.5.8 y `tokens.md` §7 (el prototipo fija 44px en el botón; los pasos los ajusta coco/lima) |

## Criterios revisados

| Criterio | Resultado | Cómo |
| --- | --- | --- |
| WCAG 1.3.1 Información y relaciones | Cumple | `nav` + `ol` + `li` |
| WCAG 1.4.1 Uso del color | Cumple en el prototipo | Cada estado se distingue en grises por forma, trama o texto |
| WCAG 1.4.10 Reajuste | Cumple | 375px: `scrollWidth` = 375; 340px: sin desborde |
| WCAG 2.1.1 Teclado | Cumple | Los pasos navegables son `<button>` nativos |
| WCAG 2.4.3 Orden del foco | Cumple | El foco queda en el paso actual tras navegar (verificado) |
| WCAG 2.4.7 Foco visible | Cumple en el prototipo | Contorno de 3px; el estilo final es de coco |
| WCAG 2.5.8 Tamaño del objetivo | Pendiente de estilo | El botón de desplegar mide 44px; el resto lo fija coco |
| WCAG 4.1.2 Nombre, función, valor | Cumple por diseño | `aria-current`, `aria-expanded`, texto de estado |
| Heurística: visibilidad del estado | Cumple | Dónde estoy / qué hice / qué falta, visibles en las tres variantes |
| Heurística: control y libertad | Cumple | Volver a pasos hechos si el consumidor lo permite |

## Comprobaciones ejecutadas

- Chromium, `localhost`, sin errores propios en consola.
- Clic real sobre un paso hecho: el actual cambia, `aria-current` queda en uno solo por stepper y el foco pasa a él.
- Adaptación por contenedor medida con `getComputedStyle` a 720 / 600 / 340px: descripciones → sin descripciones → compacto.
- Nueve pasos en 340px: compacto, y el despliegue genera la lista vertical con 9 pasos.
- Móvil 375×812: sin desborde horizontal.
- Corregido en la ronda: un paso con error posterior a uno completado heredaba el relleno sólido y ocultaba el icono; ahora error y advertencia van sobre fondo claro.

## Comprobaciones NO ejecutadas

- **Lector de pantalla real** (VoiceOver, NVDA): anuncio de «lista, N elementos», `aria-current` y el texto de estado.
- Teclado completo (Tab/Shift+Tab/Enter/Espacio) más allá de un clic real; dispositivo táctil y zoom al 200%.
- **Escritura en derecha a izquierda (RTL)**: el prototipo usa propiedades lógicas, sin verificar.
- Contraste, `forced-colors`, `prefers-reduced-motion`: el estilo final es de coco.
- El despliegue compacto conserva los botones de navegación de la lista vertical (no se probó que, al navegar desde ahí, el compacto se actualice y cierre).
- Scroll horizontal controlado y «condensar pasos completados»: quedan fuera de r01.

## Hallazgos para lima

| # | Hallazgo | Severidad | Propuesta de la ronda |
| --- | --- | --- | --- |
| 1 | ¿Cómo se entregan los pasos? | Alta | Prop `steps` (arreglo `{ id, label, description?, icon?, status?, optional? }`) **y** slot por paso para contenido; `current` como índice o `id` con `v-model` (`modelValue`) |
| 2 | Eje visual | Alta | Dos props: `orientation` (`horizontal` \| `vertical`) e `indicator` (`number` \| `dot` \| `icon` \| `segment` \| `line`). No usar `variant` de botón |
| 3 | Modo de interacción | Alta | Prop `navigation`: `none` (por defecto), `back`, `free`; más `disabled` por paso. La regla «solo avanzar en secuencia» la impone el consumidor con `current`; el componente solo representa |
| 4 | Evento de navegación | Alta | `update:modelValue` y `select` con `{ index, id }`, **cancelable** |
| 5 | Textos accesibles (estado, nombre del `nav`, «Paso N de M», «Ver todos los pasos», «opcional») | Alta | Sin valores por defecto; vienen por prop (`labels`) o slot. Sin ellos, aviso en desarrollo. Decisión de producto: confirmar |
| 6 | Adaptación | Media | Prop `responsive`: `auto` (por ancho del contenedor, por defecto) \| `never` \| `compact`. Umbrales (~560 y ~640px) como consultas de contenedor literales: ampliar la excepción de DECISIONS #34 y #39 |
| 7 | Tokens | Media | Indicador, línea, espacio entre pasos y color por estado (`complete`, `current`, `error`, `warning`); reutilizar tokens semánticos ya existentes; proponer solo los que falten |
| 8 | Iconos por paso | Media | Nombre de Lucide vía `GIcon`; estado `complete`, `error`, `warning`, `disabled` usan iconos internos fijos (`check`, `circle-alert`, `triangle-alert`, `lock`) |
| 9 | Progreso continuo | Media | Fuera de este contrato: componente aparte (decisión B). Su nombre **no puede ser `GProgress`** (ya existe como primitiva de widget). Lima debe decidir nombre y si el compacto reutiliza la barra |
| 10 | Contenido de paso en vertical | Baja | Slot con nombre por `id`; visible solo en el actual salvo `expandAll` |
