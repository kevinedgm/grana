# Brief — ficha de resumen (`GSummary`, nombre de trabajo), r01: base funcional

> kiwi, 2026-10-04. Componente nuevo. La forma se decide en `../r02/` (regla «conceptos antes que caja»); aquí va lo que no se discute.

## Origen

El usuario, probando `GCombobox` en el playground: «cuando el espacio es reducido no se adapta bien la información: aparece el avatar, el nombre, expediente, edad, última visita, médico, muy amontonado, pierde claridad… siento que se desborda». Medido en `#cb-pac` a 240px: cada opción mide 122px con cinco líneas apiladas y `__main` desborda (161 en 152px). coco hace un arreglo mínimo en `GCombobox.css`; esta ronda diseña la pieza reutilizable.

## Qué es

El **resumen de una entidad** (persona, paciente, diagnóstico, cliente, producto): identidad (avatar, icono o código) + título + línea secundaria + **datos clave con prioridad** (pares rótulo–valor) + estado + acción opcional, que **se adapta al ancho de su propio contenedor** (no al visor): decide qué se ve y qué calla, nunca desborda y nunca deja al lector sin un dato.

No es una tarjeta: no tiene superficie, ni selección, ni media. Es **contenido** que vive dentro de una opción, un campo, una celda, una tarjeta o un panel.

## Frontera (leída en los contratos vigentes)

| Pieza | Qué es hoy | Relación con la ficha |
| --- | --- | --- |
| `GCard` (`card.md`) | Contenedor: superficie (`GSurface`), regiones, `lead`, selección, media, acciones, menú, estados; se reorganiza por `data-size` | **La compone, no la absorbe.** La ficha va en el slot por defecto de una `GCard` o `GSurface`. `GCard` sigue siendo dueña de superficie, selección, enlace y acciones. Una ficha no sustituye `title`/`meta` de `GCard`: quien quiera una tarjeta de entidad usa `GCard` sin `meta` y con la ficha dentro, o solo `GSurface` + ficha |
| `GDataList` | Lista de pares clave–valor (`rows`, `swatches`), todos visibles, sin prioridad | **Intacta.** `GDataList` enseña todos los pares siempre; la ficha elige cuáles caben. El tramo «panel» de la ficha se parece a una `GDataList` corta: no la usa por dentro (necesita la misma marca en todos los tramos y contenido de frase) |
| `GMetric` | Una cifra con su tendencia | **Intacta.** Un dato de la ficha es texto corto, no una cifra protagonista |
| `GAvatar` (`avatar.md`) | Solo identidad; `xs`…`xl` = `space × 5/6/8/10/16` | **La compone.** El hueco de identidad adopta la caja del avatar (#295). Los tamaños de la ficha son los de `GAvatar` |
| `GBadge` | Estado o cuenta | **La compone** para `status` |
| Fila rica de `GSelect` / `GMenu` | Icono o avatar `xs` + etiqueta | **Intactas en v0.1.** Candidatas a adoptar la ficha `inline` en una ronda propia |
| Opción de `GCombobox` (`combobox.md` #335: `avatar`, `icon`, `code`, `description`, `facts`) | `__lead` + `__code` + `__main` (`__label`, `__facts` o `__description`) | **La absorbe** (primer consumidor). Los mismos datos, sin cambiar #335: `label` → título, `description` → línea secundaria, `facts` → datos (se añade `priority`, opcional) |
| `__token` de `GCombobox` (ficha del valor en reposo, `aria-hidden`, una línea, Δ0) | `__lead` + `__code` + `__token-label` + `__token-meta` | **La absorbe:** es la ficha en `inline` |
| Vista previa de la paleta de `GCombobox` (`__preview`, `dl`) | Hueco grande + título + `dl` de `facts` | **La absorbe:** es la ficha en bloque |
| `leading` de `GTable` | Texto corto o slot `leading-{key}` de una columna compuesta | **Intacto.** La ficha entra por `cell-{key}`; la columna compuesta sigue existiendo para título + subtítulo sin datos |
| Hablantes de `GTranscript` | Marca propia `g-transcript__mark` (#247, #259) | **Intactos** |
| Avisos de la Isla de estado (`status.md`) | Solo texto: título, descripción, enlace, acción | **Intactos** (#139: sin slots ni HTML) |

**Quién la consume.** Mínimo: opción, valor y vista previa de `GCombobox`. Candidatos, cada uno con su ronda: contenido de `GCard`, `cell-{key}` de `GTable`, items de `GMenu` y `GSelect`, slot `user` de `GSidebar`.

## Nombre

Propuesta: **`GSummary`** (`<g-summary>`). Es la palabra del usuario («Summary Card») sin «Card», porque no es una tarjeta ni debe confundirse con `GCard`. Riesgo: ya existen `GErrorSummary` y la prop `summary` de `GFormSection`. Alternativa: **`GEntity`** (sin choques; más abstracto). `GSummaryCard` se descarta: no lleva superficie y vive dentro de campos y opciones. Se pregunta en r02.

## Hallazgo que cambia el encargo

El encargo pedía reglas por *container queries* sobre el ancho. **No sirven para lo principal:** un umbral en píxeles no sabe si «María García López · Exp. 001000 · 22 años» cabe; depende del texto, del idioma y de la fuente del tema. La base usa **disposición intrínseca**: los datos van en una línea flexible que salta a una segunda línea recortada cuando no caben. Sin umbrales, sin medir para ocultar y sin `display: none`. Solo se mide (un `ResizeObserver` en la raíz, como `GCard` #130) para contar lo recortado («+N») y para elegir el tramo de `layout="auto"`.

## Ver

`index.html` (control de ancho de 160 a 720px, RTL, rejilla redimensionable). Verificación: `node design/lab/summary/r01/verificar.mjs` (`GRANA_PW_PORT=4211`; requiere `npm run build`).
