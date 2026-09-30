# Auditoría de coco · GDialog (paso 5)

**Componente:** `packages/vue/src/components/GDialog/` (el real, `.vue` + `.css`, con `dist/` reconstruido).
**Método:** Chromium, playground (`localhost:4173`). Se montaron 10 instancias reales abiertas a la vez: con inset, simple (sin inset), confirmación (`alertdialog` con icono), cargando, pantalla completa, `lg` compacto, cómodo, con secciones y superficie secundaria, con scroll y con un título larguísimo sin espacios. Se compararon los estilos computados bajo el tema por defecto y bajo un tema distinto (marca vino, acento verde azulado, superficies ámbar, texto marrón, `radius-xl` 28, radios de campo 0, borde 2px, foco 3px, espacio base 5, Georgia, fondo propio). Esc y Tab reales. Los bloques `pointer: coarse`, `prefers-reduced-motion` y `forced-colors` se aplicaron sin condición.

## Resultado: aprobado, con 2 correcciones

| Prueba | Resultado |
| --- | --- |
| Sensibilidad al tema | Las 123 propiedades medidas (color, fondo, borde, radio, fuente, contorno, sombra) cambian; ninguna conserva el valor por defecto |
| Contraste de texto (10 instancias, por defecto y con el tema) | Todo ≥ 4,5:1 y ≥ 12px |
| Radio concéntrico (tema, 3 densidades) | Exacto: `radio − separación`: 18,5 (por defecto), 19,44 (cómodo) y 20,38px (compacto), con la separación de cada densidad (ver hallazgo 1) |
| Ancho y visor | `md` 648px y `lg` 648px con el visor de 688px (se limita al visor menos 8 unidades); `sm` 500px |
| Título larguísimo sin espacios | Sin desborde horizontal: el título parte la palabra |
| Foco con teclado (real) | Anillo de `--g-focus-width` en el cierre; el cuerpo desplazable lo lleva hacia dentro |
| Esc real | Cierra, emite `dismiss`, y el foco vuelve al botón que abrió el diálogo. Con `preventDefault`, dos Esc seguidos no lo cierran |
| Alineación del cierre y del icono con la primera línea del título | Centros iguales con espacio 4 y con espacio 5 (ver hallazgo 2) |
| Visor bajo (640×360) | La carcasa ocupa 16 a 344px de 360; cabecera y pie visibles; solo el cuerpo se desplaza; sin desborde horizontal |
| Táctil (`coarse`, bloque aplicado sin condición) | Cierre de 44×44px |
| Movimiento reducido (bloque aplicado sin condición) | Transición del cierre a `0s` |
| Colores forzados (bloque aplicado sin condición) | Carcasa, inset y cierre en `CanvasText`/`ButtonText`; la cruz (borde de 2px → 4px con el tema) se mantiene |
| RTL (`dir="rtl"`) | El cierre pasa a la izquierda y el título se alinea al inicio (propiedades lógicas) |
| Consola | Sin errores |

## Hallazgos y correcciones

1. **El radio de la inset no seguía a la densidad.** `--g-surface-radius-inset` se resuelve en `:root` con la separación sin escalar, así que con `comfortable` o `compact` la inset dejaba de ser concéntrica (18,5 en lugar de 19,44 y 20,38px). Corregido en `GDialog.css`: `--_inset-radius` suma la diferencia entre la separación del token y la de la densidad (sigue siendo sobrescribible por `--g-surface-radius-inset`).
2. **La cruz de cierre y el icono no se alineaban con la primera línea del título.** Ambos miden `space × 9` y el título 28px de interlineado, y con `align-items: flex-start` la cruz quedaba más arriba. Corregido: margen superior de `(interlineado − tamaño) / 2` y tamaño único `--_ctl` (44px en táctil).

## Observación (no es defecto del componente)

Una regla global **sin capa** de la aplicación sobre `h2` o `p` (por ejemplo `h2 { margin-top: 2rem }`) gana a `GDialog.css`, que va en la capa `grana.components`. Le pasó al playground: su `h2` desplazaba el título 32px. Se acotó el `h2` del playground (`h2:not(.g-dialog__title)`). Es el comportamiento buscado del sistema de capas (el CSS del usuario gana) y queda anotado para el README.

## Sin verificar (no bloquea `candidate`)

Lector de pantalla real, teclado virtual en móvil, preferencias reales del sistema (solo se aplicaron los bloques sin condición), Firefox y Safari (`::backdrop` con variables y `:has()`), `dvh` en Safari móvil, tema oscuro (no existe) y diálogos apilados.
