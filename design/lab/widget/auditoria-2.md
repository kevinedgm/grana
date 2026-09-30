# Auditoría de coco · galería y configuración de widgets (paso 5)

**Componentes:** `GWidgetGallery`, `GWidgetConfig` y la colocación `placement="end"` de `GDialog` (los reales, `.vue` + `.css`, con `dist/` reconstruido).
**Método:** Chromium, playground (`localhost:4173`), con el tema por defecto y con un tema propio agresivo (ámbar, texto marrón, `space` 5, borde de 2px, Georgia, foco verde azulado de 3px, radios de 2px). Teclado real (Tab, Enter, Esc) para el foco, el envío implícito y el descarte; eventos sintéticos donde se indica. Los bloques `pointer: coarse`, `forced-colors` y `prefers-reduced-motion` se comprobaron por presencia en la hoja, **no** aplicados sin condición. Se probó a escritorio (688px de visor), en un móvil emulado de 375px, en RTL y con un texto largo.

## Resultado: aprobado, con 1 corrección

| Prueba | Resultado |
| --- | --- |
| Sensibilidad al tema | Con el tema propio cambian la hoja (400 → 500px con `space` 5), los controles (36 → 45px), la tipografía, los colores y los radios; las unidades salen de `space` |
| Contraste de texto (tema por defecto) | Categoría activa 16.48:1 · inactiva 17.4 · contador 7.46 · categoría del widget **4.72** · marca de añadido 16.1 · descripción 6.9 · etiqueta del campo 17.4 · botón principal 16.48 · botón `aria-disabled` 6.9 · pestaña activa 17.4 · inactiva 7.46 · marca de errores 5.49 · resumen de errores **4.8** · confirmación de descarte 17.4 |
| Contraste de texto (tema propio) | Categoría activa 5.02 · inactiva 13.3 · contador 8.91 · categoría 5.93 · marca 10.84 · botón principal 5.02 · pestaña activa 13.94 · inactiva 8.91 · marca de errores 5.27 · resumen 4.8 |
| Contraste de controles (3:1) | Borde de la búsqueda, del selector, de las píldoras y de Restablecer **3.45:1** · marca de añadido 3.19 · borde del resumen 5.49 (tema propio: 6.05, 4.93 y 5.27) |
| Áreas de acción | Búsqueda, píldoras, selector, Añadir, cerrar, pestañas y Aplicar de **36px** (45 con `space` 5); todos ≥ 24px; el bloque `pointer: coarse` los lleva a 44px |
| Foco (teclado real) | Tab sobre el radio de la categoría: contorno 2px sólido en el color de foco, en la píldora (no en el radio invisible); sobre el selector, contorno 2px; con el tema, 3px en verde azulado. Con la búsqueda enfocada al abrir |
| Hoja lateral | 400px de ancho y alto completo pegada a la derecha; en RTL, a la izquierda; en móvil (375px), hoja inferior, sin desborde horizontal |
| Texto largo | Un nombre de widget de 80 caracteres se ajusta: ni la tarjeta ni el cuerpo desbordan en horizontal |
| Flujo de teclado y anuncios | Enter en un campo aplica (envío implícito del formulario con el botón del pie asociado); con errores el resumen recibe el foco; Esc con cambios pide confirmación con el foco en «Seguir editando»; añadir anuncia dentro de la hoja |
| Consola | Sin errores |

## Hallazgos y correcciones

1. **La categoría y la marca de añadido salían pegadas** («Finanzas» y «Ya añadido» sin separación): Vue elimina el espacio en blanco entre los dos `<span>`, y el banco de coco lo tenía escrito a mano. Corregido en `GWidgetGallery.css`: `margin-inline-start: var(--g-space-2)` entre la categoría y la marca (8px con `space` 4), sin depender del espacio en blanco del marcado. Verificado en el componente real.

## Observaciones (no bloquean)

- **Texto del resumen de errores a 4.8:1** con los tokens por defecto (`on-danger-soft` sobre `danger-soft`): cumple 4.5 con poco margen; un tema con un `danger-soft` más intenso podría bajarlo. No es del componente.
- **La marca de añadido (3.19:1 de borde)** no es información que dependa del color: el texto lo dice.
- **Foco al cerrar la hoja:** el navegador devuelve el foco al elemento que tenía el foco al abrir. Safari no enfoca los botones al hacer clic, así que allí el foco puede no volver al botón «Añadir widget». Es una limitación conocida del navegador; conviene probarlo.
- **El foco vuelve al menú del widget** al cerrar la configuración (verificado), siempre que la aplicación conserve ese elemento en el DOM (lo dice el contrato).

## Sin verificar (no bloquea `candidate`)

Lector de pantalla real (pestañas, resumen de errores, anuncios de la galería); `forced-colors`, `pointer: coarse` y `prefers-reduced-motion` reales; Firefox y Safari (`<dialog>`, `inert`, `:dir()`); el movimiento de entrada de la hoja en un dispositivo real; teclado virtual en móvil; catálogos de cientos de widgets; tema oscuro (no existe).
