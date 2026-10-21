# Declaración — `GResourceList` (Grana Blocks), r01: base funcional y conceptos A, B y C

> kiwi, 2026-10-20. Prototipo: `index.html?c=base|A|B|C` (`&data=ok|empty|fail|slow|forbidden`, `&dir=rtl`, `&dark=1`). El block es un componente de laboratorio (`rl.js`, `RlResourceList`) que ensambla los **componentes reales** de `packages/vue/dist` (`GPageHeader`, `GTable` con su `GFilterBar` y su `GPagination`, `GEmpty`, `GMenu`, `GDialog`, `GForm` y campos, `GToast`, `GBtn`, `GBadge`, `GDataList`) con el tema por defecto; la aplicación (`tinas.js`) consulta un servidor simulado y pone el formulario. `rl.css` solo lleva lo que el block añade, con `var(--g-*)`. Iconos: los de la librería por nombre en `GIcon`, y `design/lab/lucide-icons.js` para lo del laboratorio. Verificación: `node design/lab/resource-list/r01/verificar.mjs` (puerto 4211), resultados en §14.

## 1. Auditoría previa (`docs/documentacion/auditoria-visual.md` §1 y §3 «Antes de implementar»)

### 1.1 Pasos del proceso previo

1. **Inspección de lo reutilizable.** Hecha antes de proponer (tabla del `brief.md`): cabecera = `GPageHeader`; consulta = `GInput search` + `GFilterBar` de `GTable`; datos = `GTable` (tabla y tarjetas en el mismo DOM); estados = `GTable` (#540) + `GEmpty`; paginación = `GPagination` dentro de `GTable`; acciones por registro = `GMenu`; editor = `GDialog` / `GForm`; confirmación = `GDialog alertdialog`; resultado = `GToast`. **No se crean** `GEmptyState`, `GLoadingState` ni `GErrorState` (Notion): ya existen como `GEmpty` y el motor de carga.
2. **Comparación con el brief de la regla** (estructura cabecera → barra → datos → pie; jerarquía; delimitación; espaciado; controles; tablas; formularios; estados; consistencia): tabla 1.2, columna «Hoy (base)».
3. **Incumplimientos y estados faltantes**: columna «Incumplimiento o faltante» de 1.2. Los que no son del block van como hallazgos para lima (§13).
4. **Riesgos sobre el comportamiento existente**: el block **no cambia** ningún componente; cuando un concepto necesita algo que no existe, el prototipo lo hace por el DOM **marcado como hueco** (§13) y no se da por resuelto. Riesgos: (a) `GPageHeader` exige ser hijo directo del contenedor largo y prohíbe `transform`/`contain`/`container-type` en sus ancestros (contrato, «Pegado» reglas 6 y 7): la raíz del block **es** ese contenedor y **no puede ser un contenedor de consultas**; mide con `ResizeObserver`, como `GTable`. (b) `GTable` pinta lo que llega al acabar su fase (200 ms + 400 ms, #540) sin avisar: el foco tras guardar debe esperar a esa fase (L4). (c) El foco que `GMenu` devuelve a su disparador al cerrar compite con el block si el block retira ese disparador (huella de A, confirmación en el sitio): el block espera al cierre del menú.

### 1.2 Los nueve aspectos

| Aspecto | Lo cubre hoy | Incumplimiento o faltante detectado | A · En su sitio | B · Lente | C · La frase |
| --- | --- | --- | --- | --- | --- |
| **Estructura** (cabecera / herramientas / datos / pie) | `GPageHeader` · región `search` · `GTable` · pie acoplado de `GPagination` | Las piezas existen sueltas; nadie fija su orden ni su relación: el block la fija (cabecera → consulta → datos → pie, sin huecos entre ellas que no sean `space`) | Igual; el editor y la baja viven **dentro** de los datos (sin capa) | Datos + **lente** como segunda columna de la página; el pie sigue a la lista | La consulta pasa a ser **frase**; las facetas son contenido de la cabecera |
| **Jerarquía visual** | `h1` de `GPageHeader`; una principal sólida (`tokens.md` §2, aviso 7 de `GPageHeader`) | En una lista **sin pestañas**, el zócalo deja la acción principal sola al final de una fila vacía, 50 px por debajo de la descripción (medido): **flota** (L9) | Igual | `h2` de la lente subordinado al `h1` | Las facetas (cifra `title`) compiten con el `h1`; en el teléfono empujan la acción 288 px (medido): **riesgo** |
| **Contraste y delimitación** | Tokens del tema; `GTable lines` | `--g-color-border` mide ≈ 1,17:1 sobre la página (por alfa 8 %): sirve de separador, **no** delimita una superficie | Huella con contorno discontinuo `border-control` (3,45:1) | Lente con `border-strong` (≈ 1,45:1) + `shadow-1`: **parcial** (decide coco) | Facetas con `border-control` (3,45:1); pulsada con `primary-text` (16,5:1) |
| **Espaciado** | `space` del tema; `--_pad` de `GPageHeader` (space × 6; × 4 estrecho) | El inset de la cabecera es **privado**: sin él, el `h1` (x = 40) y la tabla (x = 16) no alinean (medido antes de corregir) (L9) | Inset común | Inset común; separación lista–lente `space × 6` | Inset común |
| **Controles** (buscador, filtros, selectores, acciones por registro, masivas) | `GInput search`, `GFilterBar`, `GMenu`, selección de `GTable` | (a) `GMenu` no explica por qué una acción no está disponible (solo `disabled` Boolean) (L5). (b) `GMenu` no confirma en el sitio una peligrosa (sí `GFab`, #662) (L5). (c) `GTable` pinta «0 seleccionadas» siempre (L7). (d) Masivas: `toolbar` vive en la barra de tarjetas, no hay barra de selección | Sin masivas en r01 | Acciones de la fila apuntada en la lente | Frase de menús de radios; barra de selección con confirmación en el sitio |
| **Tablas y listas** | `GTable` (encabezados, separadores, hover de la puerta, tarjetas, `rowStatus`) | Sin «fila apuntada» (`aria-current`, reservado #601) (L6); sin marca pública de «nueva / recién editada» (L2); sin fila retirada (L1); sin forma de enfocar una fila por clave (L3) | Huella (L1) y fila borrador | Fila apuntada (L6) | Orden por atención |
| **Formularios** | `GForm`, `GFormRow`, `GSelect`, `GNumberField`, `GInput`, `GFormActions` | Ninguno en los campos; el block solo da el sitio. **El foco al primer campo** lo pone `GDialog` (#292) pero no un formulario en la página: lo pone el block | Formulario en la ficha de la fila (`detail`) | Formulario en la lente | Formulario en hoja lateral (`GDialog placement="end"`) |
| **Estados** (carga, vacío, error, deshabilitado, hover, foco) | `GTable` (#540), `GEmpty` (`none`/`filtered`/`forbidden`/`error`) | `GEmpty filtered` **solo ofrece «Quitar «…»» con la cuenta de lo que vuelve** (`count > 0`): la API del block debe traer esas cuentas del servidor (`returns`), o solo queda «Quitar todos». Deshabilitado **con motivo** falta en `GMenu` (L5) | + estado «dada de baja» | + estado de la lente (lectura / edición / borrador) | + faceta pulsada |
| **Consistencia** | Componentes y tokens existentes | El block necesita el canal cortés de página (`announcePage`, #533), hoy **interno** (`__shared`), y `@grana/blocks` es otro paquete (L8) | Solo tokens y componentes existentes | Ídem | Ídem |

## 2. Anatomía (base)

```
main#main                                            ← de la aplicación
└─ div.rl  (raíz del block = el contenedor largo de GPageHeader; sin container-type ni transform)
   ├─ header.g-page-header  (GPageHeader)            ← h1 #rl-ph-title; slot actions: «Registrar tina» (+ las de la aplicación)
   │  └─ [default] (C) div.rl-facets role=group      ← facetas con aria-pressed
   ├─ div.rl-body  (inset = el de la cabecera)
   │  ├─ div.rl-list
   │  │  ├─ div.rl-query role=search aria-label      ← GInput type=search (+ en C: p.rl-phrase con 4 GMenu de radios)
   │  │  ├─ (C) div.rl-bulk role=group               ← lo seleccionado
   │  │  └─ GTable aria-labelledby=#rl-ph-title      ← GFilterBar · tabla/tarjetas · GEmpty · GPagination acoplada · región viva propia
   │  │       ├─ row-actions: GMenu | confirmación en el sitio | «Deshacer» (A)
   │  │       └─ (A) detail: el formulario de la fila
   │  └─ (B) section.rl-lens aria-labelledby=h2      ← la lente, pegada bajo el zócalo; NO modal
   ├─ GDialog#rl-editor   (base: centrado · C: placement="end")
   ├─ GDialog#rl-lens-layer (B en el teléfono: mobile="fullscreen")
   └─ GDialog#rl-confirm role=alertdialog (base)
GToaster                                              ← de la aplicación
```

## 3. Decisiones de la base (y comunes a A, B y C)

1. **El block compone; no repinta.** Toda la pantalla son componentes existentes; lo propio del block es el **orden**, el **sitio del editor**, la **confirmación**, el **foco de ida y vuelta** y los **anuncios de lo que el block hace**. Nada que `GTable` o `GPageHeader` ya hagan se duplica (recuento, carga, error, vacío, rango, tarjetas).
2. **Un `h1`, y la tabla se nombra con él** (`aria-labelledby` → `#rl-ph-title`; `GTable` lo pasa al `<table>`): sin `caption` repetido.
3. **Consulta en una región `search`** con nombre, antes de los datos (orden de lectura = visual).
4. **La consulta es un objeto** `{ search, filters, sort, page, pageSize }` y el block **solo emite intención** (`update:query` con `reason`). Toda consulta nueva vuelve a la página 1, salvo la paginación. La búsqueda espera 300 ms.
5. **Modo servidor siempre** (`sortMode`/`filterMode` `external`, `total`): el block no ordena ni filtra; quien tiene los datos los consulta.
6. **Estados por los componentes**: carga, refresco, lento, error con filas (barra) y sin filas (`GEmpty error`) con `retry` son de `GTable`; vacío inicial `GEmpty none`, de consulta `GEmpty filtered` con la salida, sin acceso `GEmpty forbidden` **en lugar** de la tabla. Causas distintas, textos distintos (Notion).
7. **El vacío inicial lleva la acción de crear como `outline`**: la principal sólida sigue siendo la de la cabecera (una sola a la vista; medido en §8).
8. **Permisos como datos** (regla 1 de «Acciones con acuse», #643): `actions.{create,edit,duplicate,remove}` = ausente/`true` (disponible), `false` (oculta), **String** (visible, `aria-disabled`, con el motivo legible), o una función por fila que devuelve lo mismo. Nunca `disabled` nativo: la acción se puede encontrar y su motivo se puede leer.
9. **Confirmación explícita** en la base: `GDialog role="alertdialog"` con la pregunta como título, la consecuencia como descripción, **foco en «Cancelar»** (`autofocus`) y la acción en `danger`. Copia configurable por `labels` (`confirmOne`, `confirmMany`, `confirmText`, `confirmRemove`).
10. **Editor**: `GDialog` con `from` = el disparador; el foco va al primer campo (#292) y vuelve al disparador al cerrar (#583). Notion pide «al cerrar, vuelta al disparador»: se cumple al guardar y al cancelar.
11. **Slot `form` con `{ mode, item, close, cancel, where }`**: la aplicación valida y guarda; luego llama a `close({ saved, announce })`. El block no ve el modelo.
12. **Resultado**: la aplicación decide el aviso (`GToast`, con «Deshacer» si puede restaurar). El block solo anuncia **lo que hace él** (huella, fila nueva arriba, lente) por el canal cortés de página.
13. **Teléfono**: `GTable` pasa a tarjetas por su propia medida; `GPageHeader` pasa la principal a solo icono con nombre y `tooltip`; los diálogos son hoja (`mobile="sheet"`). Sin desplazamiento horizontal (medido).
14. **Inset común**: el cuerpo del block usa el mismo relleno en línea que la cabecera (space × 6; × 4 en estrecho), para que `h1`, consulta y tabla empiecen en el mismo borde (medido en §8). Hoy se copia el valor privado de `GPageHeader` (L9).

## 4. A · En su sitio

**Premisa que rompe:** «editar y confirmar son capas». En A no hay ni un diálogo.

- **Crear:** aparece una **fila borrador** arriba de la lista («Tina nueva · Se numera al guardar») ya desplegada con el formulario (slot `detail` de `GTable`, #599). Foco al primer campo. Al guardar, la fila borrador **se convierte en la fila real en el mismo sitio** y **se queda arriba** con «Nueva» en el texto hasta que cambia la consulta; el foco va a su puerta y se anuncia «Tina T-47 registrada».
- **Editar:** la puerta de la fila es un botón de divulgación; la fila **se abre en su formulario** debajo de ella. Cancelar pliega y el foco vuelve a la puerta.
- **Dar de baja = huella** (el lenguaje de `GTag` A «Huella», #472): la fila **se queda en su sitio**, sin tinta, con contorno discontinuo y «Dada de baja» en el texto; en la celda de acciones, **«Deshacer»** (con el foco). **Nada se envía** mientras el foco o el puntero sigan en la fila: el evento `remove` sale cuando los dos se van (o al cambiar la consulta). Es la confirmación por **reversibilidad** (WCAG 3.3.4, «reversible»), no por pregunta.
- **Teléfono:** igual, en tarjetas.

### Qué lo hace distinto (A)

La persona nunca deja la lista: lo que crea aparece donde lo creó y lo que quita deja su forma hasta que se va. Ni capas, ni «¿seguro?», ni buscar la fila al volver.

### Gana y arriesga

- **Gana:** cero capas; contexto intacto; la baja más rápida y la más segura (no se envía nada hasta salir); ideal para registros cortos y correcciones rápidas.
- **Arriesga:** formularios largos dentro de una fila (estrecha la lectura y alarga la tabla); la ficha es «una fila más» para el lector (límite conocido de #599); **todo** abre en edición (no hay «ver»); la huella depende de que la aplicación **pueda** no enviar hasta luego (si la baja tiene efectos inmediatos, no vale); la fila borrador no existe en `GTable` (el prototipo la inyecta en `rows`).

### Medidas (A)

Δ de la fila siguiente al marcar la huella: **0 px** (Chromium, Firefox, WebKit; antes de corregir, 12 px: el «Deshacer» con texto partía la línea → ahora es de solo icono con nombre y `tooltip`). Contorno 3,45:1; «Dada de baja» 7,46:1.

## 5. B · Lente

**Premisa que rompe:** «la lista es la pantalla y el detalle va encima». En B la lista es el **navegador** y la ficha vive **al lado, en la página**.

- **Abrir:** la puerta de la fila (`activatable`) abre la **lente** a la derecha (en RTL, a la izquierda): `section` con `h2` = el código, foco al `h2`. La lista **sigue operable** (no es modal, ni `inert`). La fila apuntada lleva **`aria-current="true"`** en su puerta, fondo `neutral-soft` y lomo `primary-text` (forma + color).
- **Recorrer:** «Anterior / Siguiente» con «2 de 46»; en la última fila de la página, **Siguiente cruza a la página siguiente** y abre su primera fila (es la «C · Lente» que `table.md` dejó reservada, #601). Se anuncia «Mostrando T-04».
- **Esc en la lente:** el foco vuelve a la puerta de su fila y la lente se queda (ir y venir entre lista y ficha sin perder ninguna).
- **Editar:** la misma lente pasa a formulario (foco al primer campo); Cancelar vuelve a «Editar». **Crear:** la lente se vuelve «Tina nueva».
- **Dar de baja:** en la lente, **confirmación en el sitio** (el botón se parte en «Cancelar | Dar de baja», grupo con la pregunta como nombre, foco en «Cancelar»); al confirmar, la lente **pasa a la siguiente**: la revisión sigue.
- **Teléfono:** la lente es una **capa a pantalla completa** (`GDialog mobile="fullscreen"`) con «Volver a la lista», que devuelve el foco a la puerta de la tarjeta.

### Qué lo hace distinto (B)

Revisar es la tarea más frecuente de una pantalla de gestión (validar muestras, recorrer tinas) y ningún framework la trata como tal: abren un modal por registro. La lente deja **la lista y el registro a la vista a la vez**, recorre registros **sin volver a la lista** y cruza páginas; leer va antes que editar, y editar no cambia de sitio.

### Gana y arriesga

- **Gana:** revisión en serie; formularios de cualquier largo; el editor tiene **un** sitio en escritorio (responde a la pregunta de Notion); materializa una reserva ya nombrada (`v-model:current`, #601).
- **Arriesga:** necesita ancho (≥ 960 px de block para lente al lado; por debajo, capa); dos zonas con desplazamiento; la lista se estrecha y `GTable` puede pasar a tarjetas por su propia medida (no ocurrió a 1280 px); `aria-current` en la puerta no existe hoy en `GTable` (el prototipo lo pone por el DOM, L6); en el teléfono se parece a un modal (pero lleva «Volver a la lista» y vuelve a la tarjeta).

### Medidas (B)

Lente alineada con el inicio de la lista: **Δ 0 px**. Título 17,4:1, posición 6,9:1. Borde de la lente 1,45:1 + `shadow-1` (parcial, ver §8).

## 6. C · La frase

**Premisa que rompe:** «la consulta es una barra de controles y la pantalla empieza por todo». En C la consulta **se lee** y la pantalla empieza por **lo que pide atención**.

- **Facetas** en el contenido de la cabecera: «8 Requieren atención · 21 Fermentando · 10 Listas · 3 Destilando · 4 En limpieza · 8 Vacías». Son botones con `aria-pressed`; **cada cuenta se calcula sin su propio filtro** (receta del `summary`, #601): al pulsar «Fermentando», «Listas» sigue diciendo 10.
- **La frase**: «Tinas **en cualquier estado** de **cualquier agave** a cargo de **cualquier maestro**, **lo que pide atención primero**.» Cada hueco es un `GMenu` de radios (grupo con nombre) y su botón dice el valor actual; el nombre accesible lleva el campo delante («Estado: en cualquier estado»). Sustituye a la barra de filtros (las columnas no declaran `filter`); el orden por defecto es **por atención** (`rowStatus` primero).
- **Selección y masivas**: con algo seleccionado aparece la barra «2 seleccionadas · Dar de baja · Quitar selección», con **confirmación en el sitio**.
- **Baja de una fila**: confirmación en el sitio en la celda de acciones (foco en «Cancelar»; cancelar vuelve al botón de acciones). Aviso con «Deshacer» (aplicación).
- **Editor**: hoja lateral (`GDialog placement="end"`), foco al primer campo, vuelta al disparador.

### Qué lo hace distinto (C)

La persona no tiene que traducir chips a una pregunta: la pantalla **dice en una frase qué está viendo** y cada palabra se cambia donde está. Y no empieza por 46 filas iguales: empieza por las 8 que piden atención.

### Gana y arriesga

- **Gana:** comprensión de la consulta; triaje; facetas honestas (cuentan sin su filtro).
- **Arriesga:** la frase solo expresa filtros de lista (`enum`); rangos y fechas siguen necesitando `GFilterBar`; la frase depende del idioma (orden de palabras, género, plural: cada aplicación escribe la suya); las facetas compiten con el `h1` y, en el teléfono, ocupan tres filas y empujan la acción principal **288 px** por debajo de la descripción (medido): **incumple «jerarquía» en el teléfono** tal como está; el editor vuelve a ser una capa (hoja lateral).

## 7. Qué lo hace distinto (resumen de la recomendación)

**La lista no se abandona nunca.** Con la recomendación (§11): revisar es recorrer en una lente al lado, editar ocurre donde se estaba leyendo, crear ocupa el mismo sitio, y quitar lo reversible deja **huella con «Deshacer»** en vez de un «¿seguro?». Todo con los componentes que ya existen; lo nuevo es **dónde vive cada cosa** y **a dónde vuelve el foco**.

## 8. Auditoría posterior del prototipo (§3 «Después de implementar»)

Medido con `verificar.mjs` parte `auditoria` (Chromium, 1280 × 860 y 390 × 844 con puntero grueso) y revisado sobre las capturas (`SHOTS=1`, `capturas/`). Contraste calculado componiendo el alfa sobre el fondo real.

| Criterio | Escritorio | Teléfono | Estado |
| --- | --- | --- | --- |
| Jerarquía: un `h1`, **una** principal sólida a la vista | 1 en base, A, B, C | 1 en los cuatro | Cumple |
| Alineación: `h1`, consulta y tabla al mismo borde | x = 40 / 40 / 40 | x = 32 / 32 / 32 | Cumple (corregido: antes 40 / 16 / 16) |
| Acción principal respecto de su sección | 50 px bajo la descripción, sola al final del zócalo (C: 124 px) | 50 px (C: **288 px**) | **Parcial**: flota (L9; C en el teléfono, No cumple) |
| Contraste de texto añadido por el block | descripción 7,46; frase 17,4 / 16,48 / 7,46; facetas 7,46 y cifra de atención 5,73; motivo de no disponible 7,46; lente 17,4 y 6,9; huella 7,46 | iguales | Cumple (≥ 4,5:1) |
| Delimitación | facetas 3,45:1 (`border-control`); faceta pulsada 16,48:1; huella 3,45:1; lente 1,45:1 + `shadow-1`; fila apuntada fondo 1,14:1 + lomo | facetas 3,45:1 | Facetas y huella Cumple; **lente Parcial** (decide coco) |
| Estados de interacción | foco visible en huecos de la frase (contorno ≥ 2 px); `aria-pressed`; `aria-current`; `aria-disabled` con motivo | ídem | Cumple |
| Carga, vacío, error | `GTable` y `GEmpty` reales en las tres causas + sin acceso (§14) | ídem | Cumple (son los componentes) |
| Objetivos de pulsación | ≥ 24 px (huecos de la frase 40, facetas 44, botones 28) | ≥ 44 px (GBtn por su `::after`; huecos y facetas 44) | Cumple |
| Desplazamiento horizontal | ninguno | ninguno, también con el formulario de A abierto | Cumple |
| Espaciado | `space` del tema; separación lista–lente `space × 6` | — | Cumple |
| Consistencia | solo componentes y tokens existentes; **excepto** lo marcado como hueco (L1–L8) | — | Parcial (por los huecos) |
| Pie acoplado en el teléfono | — | dos filas (selector de tamaño y páginas) ≈ 100 px fijas abajo | Parcial (límite conocido #595) |
| Lector de pantalla real (VoiceOver, NVDA) | — | — | **No verificable** aquí |
| Tema oscuro y `forced-colors` | — | — | **No verificable** en esta ronda (el prototipo admite `?dark=1`, sin medir) |
| RTL | — | — | **No verificable** (admite `?dir=rtl`; lente y lomo con propiedades lógicas, sin medir) |
| Táctil real (dedo, teclado en pantalla con el formulario de A) | — | — | **No verificable** |

### Rúbrica de movimiento (lo que toca a esta ronda)

Los conceptos casi no añaden movimiento propio: el despliegue de A es el de `GTable` (`utils/collapse.js`, ya auditado), la entrada de diálogos es la de `GDialog`. Lo nuevo:

| Dimensión | Estado | Evidencia | Riesgo | Recomendación |
| --- | --- | --- | --- | --- |
| A. Propósito | Cumple | «Fila nueva» (fundido `accent-soft` en `slow × 4`) dice dónde quedó lo guardado; la huella **no** se mueve | Bajo | Mantener; sin más movimiento |
| C. Estabilidad | Cumple | Huella Δ 0 px; lente sin empujar la lista (columna fija); facetas sin cambio de tamaño al pulsar | Bajo | — |
| D. Transiciones | No verificable | La lente aparece sin transición en el prototipo; su entrada (si la hay) es de coco | Medio | Si se anima, interrumpible y sin mover la lista |
| E. Control | Cumple | Toda baja es cancelable (Cancelar / Deshacer); Esc baja un nivel (lente → puerta; ficha → puerta) | Bajo | — |
| F. Accesibilidad | Cumple | Con movimiento reducido el fundido queda quieto (`accent-soft` fijo) | Bajo | — |
| B, G, H | N/A | Sin profundidad propia, sin animación continua, sin inmersión | — | — |

**Resumen:** el movimiento es mínimo y funcional; lo pendiente es la entrada de la lente (coco). **Limitaciones:** no se midieron cuadros ni se probó con movimiento reducido en vivo.

## 9. Lo que exigirá la auditoría posterior del componente real (coco)

Repetir §8 sobre el block construido, más: tema oscuro y los 11 temas del banco; `forced-colors`; RTL; zoom 200–400 % (la lente pegada ≤ ¼ del alto, como el zócalo); la lente con formularios largos; teclado completo en Firefox y WebKit; la fila apuntada frente a la seleccionada y al rastro (`lastOpened`) a la vez; y la rúbrica de movimiento completa si coco anima la lente.

## 10. Comparativa

| | Base | A · En su sitio | B · Lente | C · La frase |
| --- | --- | --- | --- | --- |
| Capas para editar | Diálogo | **Ninguna** | Ninguna en escritorio; capa en el teléfono | Hoja lateral |
| Confirmar una baja | `alertdialog` | **Huella + Deshacer** (no envía hasta salir) | En el sitio, y sigue a la siguiente | En el sitio |
| Revisar en serie | Abrir y cerrar | Abrir y cerrar filas | **Anterior / Siguiente, cruza páginas** | Abrir y cerrar |
| Formularios largos | Bien | **Mal** | Bien | Bien |
| Entender la consulta | Chips | Chips | Chips | **Frase + facetas** |
| Teléfono | Tarjetas + hoja | Tarjetas que se abren | Capa a pantalla completa | Facetas pesadas (**jerarquía: no cumple**) |
| Aspectos de la auditoría que rompe | Acción que flota (L9) | Formularios dentro de una fila (legibilidad con muchos campos) | Delimitación de la lente parcial | Jerarquía en el teléfono; delimitación de la frase solo por subrayado |
| Huecos que necesita | L5, L7, L8 | **L1, L2, L3, L4**, fila borrador | **L6**, L3, L4 | L5 (confirmación), L7 |
| Riesgo de construcción | Bajo | Medio | Medio | Medio-alto (idioma) |

## 11. Recomendación

**B · Lente por defecto, con la huella de A para lo que se puede deshacer** (`removal: 'undo'` por acción) y la **confirmación en el sitio** para lo que no. Las **facetas** de C quedan como receta (slot `summary` en el contenido de la cabecera), sin la frase; **la frase se reserva** (necesita una ronda propia por idioma).

Por qué: (1) responde la pregunta de Notion sobre el editor con **un** sitio que no tapa la lista y sirve a formularios de cualquier largo; (2) la revisión en serie es la tarea más repetida de una pantalla de gestión; (3) materializa una reserva ya nombrada en `GTable` (#601) en lugar de inventar API; (4) la huella hace la baja más segura que un «¿seguro?» sin capa nueva; (5) es la que menos rompe la auditoría (solo la delimitación de la lente, que es de coco).

## 12. API propuesta (para lima; punto de partida: Notion, corregida por lo que existe)

**Props:** `title`, `description` (a `GPageHeader`); `columns` (la forma de `GTable`), `rows`, `rowKey`, `total`, `rowStatus` (pasan a `GTable`); **`query`** (`v-model:query`: `{ search, filters, sort, page, pageSize }`), `pageSizes`; `loading`, `error` (Boolean | String), `forbidden` (Boolean); **`actions`** (disponibilidad por #643: `true`/`false`/String/función por fila; claves `create`, `edit`, `duplicate`, `remove`); **`editor`** (`lens` | `dialog`, y `row` si se adopta A); **`removal`** (`confirm` | `undo`, por defecto `confirm`); `selectable` + `v-model:selected`; **`returns`** (cuentas de la salida del vacío; sin ellas `GEmpty` solo ofrece «Quitar todos»); `labels` (sin valores por defecto).

**Eventos (intención; nunca mutación interna):** `update:query` (`{ …query }`, `{ reason }`), `create` (`{ from, preventDefault }`: la aplicación puede ir a una ruta en vez de abrir el editor), `edit` (`{ row, from, preventDefault }`), `open` (`{ row }`, B; sustituye a `row-click` de Notion), `remove` (`{ rows, keys }` + ticket de #643 para el acuse), `duplicate`, `retry`, `update:selected` (sustituye a `selection-change`).

**Slots:** `form` (`{ mode, item, close(options), cancel, where }`), `cell-{key}` y `leading-{key}` (pasan a `GTable`), `actions` (`{ narrow, docked }`, secundarias de la página), `meta`, `summary` (contenido de la cabecera: facetas o métricas), `lens` (lectura de la lente; por defecto `GDataList` desde `columns`), `empty` y `error` (para sustituir los de `GTable`).

**Las tres preguntas abiertas de Notion (propuesta, no cierre):**

1. **Columnas:** **objetos para la estructura, slots para la celda** — exactamente lo de `GTable` (`columns` + `cell-{key}`). No hay formato nuevo que aprender, y la barra de filtros sale de las mismas columnas.
2. **Editor:** el sitio lo decide la forma elegida (B: la lente; capa a pantalla completa en el teléfono), con **una** salida explícita `editor="dialog"` para formularios que deban aislarse. Nunca las tres a la vez sin motivo.
3. **Permisos:** **datos, no slots ni adaptador**: el mapa `actions` con la regla 1 de #643 (oculta, disponible o con motivo, por fila). Un adaptador externo es innecesario: la aplicación ya calcula la función.

## 13. Hallazgos para lima (huecos en componentes existentes; enmiendas, no cosas a rehacer en el block)

- **L1 · `GTable`: fila retirada (huella).** No hay estado de fila «dada de baja» con «Deshacer» en su sitio; el prototipo la pinta por el DOM y sustituye texto en `rows`. Propuesta: `v-model:removed` (claves) con la huella de `GTag` (#472) y el evento al salir.
- **L2 · `GTable`: marca pública de «nueva / recién editada».** `is-new` / `is-here` existen pero solo los usa el cambio de tamaño (#594). Propuesta: método `reveal(key)` (o prop `highlight`) que reutilice «aquí estabas».
- **L3 · `GTable`: enfocar una fila por clave.** El block necesita poner el foco en la puerta o en las acciones de una fila tras guardar, deshacer o volver de la lente; sin `rowAttrs` (reservado, #601) el prototipo marca cada `<tr>` por el DOM. Propuesta: `focusRow(key, { target: 'door' | 'actions' })`.
- **L4 · `GTable`: aviso de «lo que llegó ya está pintado».** Las fases de #540 retrasan las filas nuevas hasta 600 ms; sin evento, el block sondea. Propuesta: `focusRow` que espere a la fase, o evento `settled`.
- **L5 · `GMenu`: motivo de no disponible y confirmación en el sitio.** `disabled` es solo Boolean (en `GFab` admite String con motivo, #663) y no hay confirmación en el sitio para `danger` (sí en `GFab`, #662; en `GMenu` está reservada como M3). El prototipo escribe el motivo con el slot `item`.
- **L6 · `GTable` C · Lente (#601): adoptarla.** `v-model:current`, `aria-current="true"` en la puerta, `is-current`, `labels.current`. B la necesita tal como está nombrada.
- **L7 · `GTable`: «0 seleccionadas» siempre visible** con `selectable` y `labels.selectedCount`. Propuesta: no pintar con 0 (o pintar solo en la región viva).
- **L8 · Anuncios desde `@grana/blocks`.** `announcePage` (#533) es interno (`__shared`) y `@grana/blocks` es otro paquete (#708): necesita una vía **pública** (p. ej. `announce` en `@grana/vue`) o el block crearía otra región viva (dos canales corteses en la página).
- **L9 · `GPageHeader` en una pantalla de lista.** (a) El inset (`--_pad`) es privado y el block debe alinear su cuerpo con él (prototipo: copia el valor; el umbral de estrecho del encabezado y el del block pueden no coincidir). (b) Sin pestañas, el zócalo deja la acción principal sola al final de una fila vacía (50 px bajo la descripción): la auditoría la ve **flotar**. Valorar que, sin `tabs`, las acciones suban a la fila del título.
- **L10 · `GEmpty` en el block.** No es un hueco de `GEmpty`: su salida exige `count > 0` por filtro; la API del block debe llevar `returns` desde el servidor (§12).
- **L11 · Fila borrador para crear en su sitio (solo si se adopta A).** `GTable` no la tiene; el prototipo la inyecta en `rows` con una clave reservada.

## 14. Comprobaciones

`node design/lab/resource-list/r01/verificar.mjs` (puerto 4211): partes `base`, `A`, `B`, `C`, `estados`, `movil` y `auditoria`. Pasada final sobre el estado entregado: **432/432** (Chromium 144/144, Firefox 144/144, WebKit 144/144), sin errores ni avisos de consola. Correcciones hechas durante la verificación: el `h1` y la tabla no alineaban (inset de la cabecera, §3 punto 14); la huella movía la fila siguiente 12 px («Deshacer» de solo icono); el borde de facetas y huella medía 1,17:1 y 1,45:1 (pasan a `border-control`, 3,45:1); en WebKit el cambio tardío de relleno del block provocaba un aviso de bucle de `ResizeObserver` (el block estima «estrecho» antes del primer pintado: **nota para bruno**, el block debe conocer su inset antes de que sus hijos midan). Cubre: nombre de la tabla por el `h1`; una región `search`; crear/editar con foco al primer campo y vuelta al disparador en los cuatro; errores de la aplicación revelados por `GForm`; disponibilidad con motivo; `alertdialog` con foco en «Cancelar»; aviso con «Deshacer»; vacío de búsqueda con su salida y vuelta; error con filas y sin filas con reintento; vacío inicial; sin acceso; A completo (borrador, fila nueva arriba con foco en su puerta, huella sin envío, Δ 0, deshacer, envío al salir); B completo (lente no modal, `aria-current`, Esc, siguiente y cruce de página, edición, baja en el sitio que sigue a la siguiente, crear); C completo (facetas honestas, frase de radios, baja en el sitio, masivas, hoja lateral); teléfono (tarjetas, sin desplazamiento horizontal, principal de solo icono, capa de B con vuelta a la tarjeta, borrador de A, dianas de C ≥ 44 px); y la auditoría de §8.

**No verificado:** lector de pantalla real, táctil real, tema oscuro, `forced-colors`, RTL, zoom 200–400 %, rendimiento con miles de filas (el block no pagina en cliente).

## 15. Pregunta de producto (una)

**¿Qué forma adopta `GResourceList` por defecto?**
- **B · Lente** (recomendada), con la huella de A para lo reversible y las facetas de C como receta.
- **A · En su sitio** (sin capas; formularios cortos).
- **C · La frase** (la consulta como frase; necesita resolver la jerarquía en el teléfono).
