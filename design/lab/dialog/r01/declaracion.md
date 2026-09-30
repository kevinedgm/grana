# Declaración de cumplimiento · GDialog · r01

**Estado:** aprobada. Las decisiones de estructura y accesibilidad se derivan de estándares (WCAG 2.2 AA, patrón de diálogo modal de WAI-ARIA APG, semántica nativa de `<dialog>`). El usuario decidió el alcance: **todas las composiciones por props y slots de un solo componente**; la superficie inset **no** es un componente aparte en v0.1 (queda como tokens y clases listos para reutilizar); en móvil, **hoja inferior por defecto** con `mobile` para cambiarla.
**Ruta:** R1 · **Fidelidad:** F2 · **Material:** kit neutral de grises.
**Siguiente dueño:** lima → `design/contracts/dialog.md`.

## Composiciones verificadas

Simple, con inset, con pie, con secciones, con scroll, confirmación (`alertdialog`), formulario, pantalla completa, móvil en hoja / ancho completo / pantalla completa.

## Decisiones de estructura

| # | Decisión | Fundamento |
| --- | --- | --- |
| 1 | La carcasa es un `<dialog>` nativo abierto con `showModal()` | Capa superior, resto de la página inerte, foco atrapado y Esc los resuelve el navegador; WAI-ARIA APG (diálogo modal) |
| 2 | Nombre con `aria-labelledby` (el título) y descripción con `aria-describedby` (si hay) | WCAG 4.1.2, 1.3.1 |
| 3 | Al abrir, el foco va al primer control (el cierre); en confirmación, a la acción segura (Cancelar). Al cerrar, vuelve al disparador (verificado: el foco volvió a "2 · Con inset") | WCAG 2.4.3; APG |
| 4 | Confirmación = `role="alertdialog"`; el fondo **no** cierra (verificado: sigue abierto tras un clic en el fondo); Esc sí (cancelar) | APG `alertdialog`; una acción crítica no se descarta por accidente |
| 5 | El fondo (backdrop) cierra los demás diálogos con un clic; es opcional (`closeOnBackdrop`, lo decide lima) | Convención; no es el único modo de cerrar (WCAG 2.1.1) |
| 6 | Acción de cierre visible con nombre (`aria-label`) en el encabezado, salvo en confirmación, donde el cierre son sus dos botones | WCAG 4.1.2, 2.4.3 |
| 7 | **Superficie inset:** hija directa de la carcasa, a **6px** de su borde, con **radio concéntrico** (radio exterior − separación = 20 − 6 = 14; verificado: 20px y 14px). Aloja cuerpo y pie | Regla de radios anidados: las curvas comparten centro y la inset se lee como parte de la carcasa, no como tarjeta encima |
| 8 | Sin inset, el contenido vive en la carcasa (diálogo simple) | Un mensaje corto no necesita segunda superficie |
| 9 | Las secciones se separan con **línea fina** dentro de la inset, no con cajas. La superficie secundaria (hundida) es opcional y solo para agrupar | Evita "cajas dentro de cajas" |
| 10 | Encabezado y pie fijos; solo el cuerpo se desplaza. El cuerpo desplazable es enfocable (`tabindex="0"`, `role="region"`, con nombre) | WCAG 2.1.1 (un cuerpo con scroll sin foco no se alcanza con teclado); 2.4.7 |
| 11 | El pie muestra su separación con una línea superior y cambia de fondo mientras queda contenido por desplazar (verificado: `is-scrolled` activo al abrir y apagado al final) | Indicar que hay más contenido sin depender del color |
| 12 | La página no se desplaza con un diálogo abierto (`overflow: hidden` en `html`; verificado) | Evita perder el contexto (WCAG 1.3.4 no aplica; usabilidad) |
| 13 | Formulario: el botón de envío del pie se asocia con `form="id"`; si no valida, el diálogo **no se cierra** y el foco va al primer campo inválido (verificado) | WCAG 3.3.1; el pie está fuera del `<form>` |
| 14 | Escritorio: centrado, ancho controlado (`sm` 400, base 560, `lg` 760, siempre menor que el visor menos 32px) | WCAG 1.4.10 |
| 15 | Tableta (≤ ~900px): relleno menor y `lg` más estrecho, mismas dos superficies | Requisito del usuario |
| 16 | Móvil (≤ ~520px): hoja inferior (esquinas superiores redondeadas, pegada abajo, con `safe-area-inset-bottom`), ancho completo (centrado con 8px por lado) o pantalla completa; **siempre carcasa + inset** | Requisito del usuario; verificado a 375px: hoja de 375×~210 pegada abajo; pantalla completa exacta (812px); sin desborde horizontal |
| 17 | Con `pointer: coarse`, cierre y botones ≥ 44px | WCAG 2.5.8 y `tokens.md` §7 |
| 18 | La entrada es breve (`opacity` + desplazamiento de 8px) y solo con `prefers-reduced-motion: no-preference` | WCAG 2.3.3 |

## Criterios revisados

| Criterio | Resultado | Cómo |
| --- | --- | --- |
| WCAG 1.4.10 Reajuste | Cumple | 375px: `scrollWidth` = 375 en todas las composiciones |
| WCAG 2.1.1 Teclado | Cumple | Esc cierra (verificado con Escape real); Tab queda dentro (nativo); el cuerpo desplazable es enfocable |
| WCAG 2.4.3 Orden del foco | Cumple | Foco inicial y retorno al disparador verificados |
| WCAG 2.4.7 / 2.4.11 Foco visible | Cumple en el prototipo | Contorno de 3px; el estilo final es de coco |
| WCAG 2.5.8 Tamaño del objetivo | Cumple | 43px con la emulación táctil (44px reales con el ajuste `pointer: coarse` del CSS; el cierre medía 43 por el borde de 1px del emulador, se fija `min-*: 44px`) |
| WCAG 4.1.2 Nombre, función, valor | Cumple | `aria-labelledby`, `aria-describedby`, `alertdialog` |
| Heurística: control y libertad | Cumple | Esc y cierre siempre; la confirmación protege la acción crítica |
| Heurística: consistencia | Cumple | `size`, `density` de la API compartida; sin `variant` de botón: la estructura se elige con props propias (hallazgo 1) |

## Comprobaciones ejecutadas

- Chromium, `localhost:4174`. Sin errores en consola.
- Clics y teclado reales: abrir, Esc, retorno del foco, confirmación con clic en el fondo, formulario inválido, desplazamiento con pie fijo y `is-scrolled`.
- Geometría: separación 6px (+1px de borde), radios 20/14.
- Emulación móvil 375×812: hoja pegada abajo, ancho completo, pantalla completa, sin desborde horizontal.

## Comprobaciones NO ejecutadas

- **Lector de pantalla real** (VoiceOver, NVDA): anuncio del nombre, la descripción, el `alertdialog` y el cuerpo desplazable.
- **Teclado virtual en móvil** (el visor se reduce; formularios largos), **zoom al 200%** y dispositivo táctil real.
- **Contenido con diálogos apilados** (v0.1 no los admite) y `<dialog>` en navegadores sin `showModal()` (todos los actuales lo admiten).
- `forced-colors`, `prefers-reduced-motion` real: el estilo final es de coco.
- Contraste: no aplica a un wireframe; lo audita coco con el tema real.

## Hallazgos para lima

| # | Hallazgo | Severidad | Propuesta de la ronda |
| --- | --- | --- | --- |
| 1 | `variant` (`solid soft outline ghost link`) no describe un diálogo | Alta | No hay `variant`. La estructura se elige con `inset` (booleano, por defecto `true`), `size` y `mobile`; la pantalla completa con `fullscreen` |
| 2 | ¿Se abre con `v-model` o con métodos? | Alta | `v-model` (`modelValue`) sobre `open`; el componente llama a `showModal()`/`close()` |
| 3 | `alertdialog` | Alta | Prop `role`: `dialog` (por defecto) o `alertdialog`; con `alertdialog`, el fondo no cierra y el foco inicial va a `[autofocus]` o a la acción segura |
| 4 | Cierre y cancelación | Media | Evento `dismiss` con `{ reason: 'escape' \| 'backdrop' \| 'close' }`, **cancelable** (el consumidor puede impedirlo, p. ej. formulario con cambios); prop `closeOnBackdrop` (por defecto `true`, ignorada en `alertdialog`) |
| 5 | Textos de la acción de cierre | Media | `closeLabel` sin valor por defecto (Grana es internacional); sin él, el botón no se renderiza y se advierte en desarrollo |
| 6 | Slots | Media | `header` (sustituye título y descripción), `default` (cuerpo), `footer`, y `title`/`description` como props o slots. Sección y superficie secundaria: clases utilitarias `g-dialog__section` y `g-dialog__well` |
| 7 | Foco al abrir | Media | Primer elemento enfocable; `[autofocus]` gana; con `alertdialog`, la acción segura |
| 8 | Superficie inset como sistema | Media | Tokens de superficie reutilizables (`--g-surface-*`) definidos por lima; `GDialog` no los reserva para sí |
| 9 | Umbrales de ancho (~900px tableta, ~520px móvil) | Baja | Son consultas de medios literales (la ventana, no un contenedor); ampliar la excepción de DECISIONS #34 y #39 |
| 10 | Pie pegajoso | Baja | Siempre fijo: el cuerpo es lo que se desplaza |
| 11 | Estado `busy` | Baja | Prop `busy`: `aria-busy` en la carcasa; las acciones las controla el consumidor |
