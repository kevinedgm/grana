# Brief — campo de archivos (`GFileField`, nombre de trabajo), r01: base funcional

> kiwi, 2026-10-05. Origen: `form.md` «Fases siguientes» (Fase 5, ronda propia: `GFileField`), DECISIONS #168 y `PENDIENTES.md` §3 («sin ronda; candidato a próximo»).

## Para qué

Formularios clínicos y administrativos que piden documentos y fotos: comprobante de domicilio, INE por los dos lados, receta escaneada, fotos de una lesión, estudios en PDF, documentos de un expediente que ya tiene adjuntos. Lo usan personas en escritorio (arrastran desde el Finder o el Explorador), en móvil (cámara o galería del sistema) y con teclado y lector de pantalla (solo el diálogo del sistema).

## Qué es esta ronda

La **base funcional**: semántica, teclado y foco, envío, validación al añadir, subida, estados, anuncios, encaje en `GForm`. Deriva de HTML (`<input type="file">`, `FormData`), WCAG 2.2 y los contratos vigentes (`form.md`, `summary.md`, `api.md`, `icons.md`); **no hay preguntas de producto aquí**. La forma de esta página es la convencional **a propósito** (zona rectangular con borde discontinuo): la identidad se decide en `../r02/` (tres conceptos).

## Frontera (leída en los contratos y en el código)

| Componente | Qué hace | Por qué no cubre el caso, o qué aporta |
| --- | --- | --- |
| `<input type="file">` nativo (por `$attrs` en cualquier sitio) | Elige archivos y los envía | Cada selección **reemplaza** la anterior (no se puede añadir en dos veces), no se puede quitar uno, no valida tamaño ni número, no hay vista previa, ni estado de subida, ni arrastre con destino visible; el texto «Ningún archivo seleccionado» lo pone el navegador en su idioma |
| `GSummary` (`summary.md`) | Ficha adaptable de una entidad | **Se compone**: cada archivo es una ficha (nombre = `title`, tamaño y tipo = `facts` con `bare`, miniatura = `avatar` con `src` y `shape: 'square'`, estado = `status`). No tiene eventos ni acciones dentro: «Quitar» y «Reintentar» van al lado |
| `GProgress` (`widget.md`) | Barra con `role="progressbar"` | **Se compone** como carril de cada archivo. Falta una variante sin fila de texto visible (hallazgo L13) |
| `GBtn` + `GIcon` (lista de la librería: `x`, `refresh-cw`) | Acciones por archivo | **Se componen** |
| `GForm` + `useFormField` + `GErrorSummary` | Registro, errores, resumen, `FormData` | **Se usan**; falta que el campo pueda bloquear el envío por sí mismo con subidas pendientes o fallidas (L7) |
| `GToast`, isla de estado (`status.md`) | Avisos breves / condiciones de página | **No** para el fallo de un archivo: el error vive en su ficha, como el error de carga de `GCombobox` vive en su lista (#18 de su r01). La aplicación puede publicar en la isla una condición general («Sin conexión: 3 archivos esperan») si quiere |
| `GCombobox`, `GSelect`, `GInput` | — | Sin solape. Un campo de archivos no comparte motor con ninguno |

**Composición:** el campo **no** compone `GInput` (su caja es otra cosa: un control que abre un diálogo del sistema, no un texto). Sí sigue su anatomía de tres hijos (etiqueta · cuerpo · pie) para poder vivir en una `GFormRow` cuando la forma lo permita (r02 A).

## Entregables

- `../engine.js` (motor de la maqueta, compartido con r02: validación, cola de subida, sincronía con el `<input>`, anuncios, arrastre de página) y `../parts.js` (fila de archivo sobre `GSummary` + `GProgress` + `GBtn`).
- `field.js` (`XFileField`, con `useFormField` real), `field.css` (kit neutro), `index.html` (tres casos).
- `../verificar.mjs` (la base y los conceptos con la misma batería, tres motores).
- `declaracion.md`: decisiones numeradas, estados, comprobaciones y hallazgos L1… para lima.

## Ver

`index.html` (`?dir=rtl`). Botones «+ …» añaden archivos de prueba; también puedes elegir, arrastrar o pegar archivos reales. Verificación: `node design/lab/file-field/verificar.mjs` (`GRANA_PW_PORT=4212`; requiere `npm run build`).
