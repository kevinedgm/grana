# Auditoría de coco · GTextarea (paso 5)

**Componente:** `packages/vue/src/components/GTextarea/` (el real, `.vue` + `.css`, con `dist/` reconstruido).
**Método:** Chromium, playground (`localhost:4173`). Se montaron 32 instancias reales: vacío con placeholder, con texto, con ayuda, requerido, deshabilitado, solo lectura, inválido (`outline` y `soft`), cargando, `soft`, `autosize` con y sin `maxRows`, contador, 4 colores de foco, 5 tamaños × 2 densidades con `rows` 1, 4 formas y una etiqueta, ayuda, error y valor de 90 caracteres sin espacios. Se compararon los estilos computados bajo el tema por defecto y bajo un tema distinto (marca vino, acento verde azulado, superficies ámbar, texto marrón, radios 0 y 14, borde 2px, foco 3px, espacio base 5, Georgia). Tab y escritura reales. Los bloques `pointer: coarse` y `prefers-reduced-motion` se aplicaron sin condición; `forced-colors` se verificó en el banco de estilo.

## Resultado: aprobado, con 1 corrección

| Prueba | Resultado |
| --- | --- |
| Sensibilidad al tema | Las 201 propiedades medidas (color, fondo, borde, radio, fuente, contorno, sombra) cambian; ninguna conserva el valor por defecto |
| Contraste (tema por defecto) | Borde 3.45:1 · línea inferior de `soft` 3.45 · borde inválido 5.49 · placeholder 5.10 · todo texto ≥ 4.5:1 |
| Contraste (tema de prueba) | Borde 4.86 · `soft` 4.86 · inválido 9.46 · placeholder 5.93 · todo texto ≥ 4.5:1 |
| `rows` 1 con el tema (`space` 5) | 30, 35, 45, 55 y 65px: la misma altura que `GInput` de cada tamaño |
| `autosize` con el tema | Con `maxRows` 4 y 6 líneas: 101px = 4 × interlineado + relleno; `is-capped`, `overflow-y: auto`, sin tirador |
| `autosize` ante un cambio de interlineado del tema | 94px → 144px sin tocar el ancho (ver hallazgo 1) |
| Foco con teclado (real) | Anillo de 3px pegado al borde (`outline-offset` −2px) en el color del tema; el `<textarea>` no lleva contorno |
| Escritura real | 8 líneas en un campo con `maxRows` 6 → 134px, scroll interno, el campo conserva el foco; vaciar el texto lo devuelve a 54px |
| Contador y aviso hablado (`maxlength` 80) | Sin aviso hasta 71; "Cerca del límite" una sola vez al 72 (90% redondeado hacia arriba); "Límite alcanzado" al 80; sin repetición en 75 y 79; vacío al bajar a 30. El contador visual es `aria-hidden` |
| Error de validación | `aria-invalid`, `aria-describedby` y mensaje al escribir "corto"; desaparecen al escribir un motivo largo |
| Formas | `none` y `sm` a 0px, `lg` a 14px, `pill` limitado a 14px (`--g-radius-lg`) |
| Táctil (`pointer: coarse`) | Cajas de 1 fila ≥ 44px |
| Movimiento reducido | Transición a `0s`; el anillo de carga gira 2,5 veces más despacio |
| Colores forzados | Borde `ButtonText`, deshabilitado `GrayText`, foco `Highlight`, inválido con borde doble (verificado en el banco de estilo) |
| Carga (LTR y RTL) | El anillo queda dentro de la caja, alineado con la primera línea, y el texto reserva su sitio (`padding-inline-end`) también en RTL |
| RTL | El contador pasa a la izquierda de la ayuda; el anillo de carga, a la izquierda de la caja |
| Etiqueta, ayuda, error y valor de 90 caracteres sin espacios | Sin desborde horizontal en ningún elemento |
| Consola | Sin errores |

## Hallazgos y correcciones

1. **`autosize` solo se recalculaba al cambiar el ancho.** El observador de tamaño filtraba por ancho, así que un cambio de tema que altera solo el interlineado, el relleno vertical o el tamaño de fuente (sin tocar el ancho) dejaba la altura fija en el valor viejo (`--_autoh`). Es un defecto de `GTextarea.vue` (dueño: bruno), devuelto y corregido: el observador recalcula ante **cualquier** cambio de tamaño (medir de nuevo da la misma altura, así que el ciclo termina solo, con una guarda de reentrada). Prueba nueva con `ResizeObserver` simulado; verificado en el navegador con un tema que solo cambia `--g-text-body-sm-line` (94px → 144px).

## Sin verificar (no bloquea `candidate`)

Lector de pantalla real (etiqueta, ayuda, error y aviso del contador), preferencias reales del sistema (solo se aplicaron los bloques sin condición), Firefox y Safari (tirador y `:has()`), un dispositivo táctil real, el rendimiento de `autosize` con miles de líneas, el tema oscuro (no existe) y el tirador nativo sobre esquinas muy redondeadas con temas extremos.
