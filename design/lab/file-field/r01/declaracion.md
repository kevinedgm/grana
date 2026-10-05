# Declaración — campo de archivos (`GFileField`, nombre de trabajo), r01: base funcional

> kiwi, 2026-10-05. Prototipo: `index.html` (motor `../engine.js`, fila `../parts.js`, campo `field.js` con `useFormField` real, kit `field.css`). Verificación: `../verificar.mjs` (cifras en «Comprobaciones»). La forma (identidad) se decide en `../r02/`; aquí todo deriva de HTML, WCAG 2.2 y los contratos vigentes, y **no hay preguntas de producto**.

## Anatomía

```
raíz (g-file-field) — tres hijos, como un campo: etiqueta · cuerpo · pie
├─ <label for="ID">Etiqueta</label> (+ marca de GForm)
├─ cuerpo
│  ├─ cara (no enfocable, sin rol; el clic llama a input.click())
│  │  ├─ <input type="file" id="ID" name accept multiple
│  │  │        aria-describedby="ID-hint ID-status [ID-message]" aria-required [aria-disabled]>
│  │  │        ← EL control: oculto a la vista (patrón de texto oculto accesible) y enfocable; su foco se pinta en la cara
│  │  ├─ icono decorativo
│  │  ├─ texto de acción: «Elegir archivos o arrastrar aquí» · «Suelta para añadir 2 archivos» · «Aquí no se admite»
│  │  │                   · «Límite alcanzado: quita uno para añadir otro» · «Solo lectura»
│  │  └─ pista (ID-hint): «Imagen · hasta 8 MB cada uno · máximo 5»
│  ├─ estado (ID-status): «2 de 5 · 1 subiendo · 1 con error»   (descripción del control, no región viva)
│  ├─ aviso de no añadidos (role="group", aria-label) · lista de nombre + motivo · «Descartar aviso»
│  └─ <ul aria-label="Archivos de {etiqueta}">
│     └─ <li data-state> GSummary (row, lines 2) · [Reintentar {nombre}] · [Quitar {nombre} | Cancelar subida de {nombre}]
│                        · carril GProgress (absoluto sobre el borde inferior: no ocupa alto)
└─ pie: mensaje (ID-message, de GForm) · <input type="hidden" name value> por archivo subido · región viva propia
```

## Decisiones

**Semántica y control**

1. **El control es el `<input type="file">` real**, oculto a la vista con el patrón de texto oculto accesible y **enfocable**; su nombre es la `<label for>` del campo; su foco se pinta en la cara (`:has(:focus-visible)`). No se usa un `<button>` que llame a un input escondido: el foco al primer inválido de `GForm`, el desplazamiento a la vista y el envío necesitan que el control enfocable **sea el que se envía**, y el diálogo del sistema (en móvil, la hoja con cámara, fotos y archivos) se abre igual. Rol medido en el árbol: «button» con el nombre de la etiqueta en los tres motores (ver «Comprobaciones»).
2. **La cara no es un segundo control**: sin rol ni `tabindex`; un clic en cualquier punto llama a `input.click()`. Con teclado, Espacio sobre el control abre el diálogo nativo (medido con el evento `filechooser` en los tres motores). Un solo punto de Tab para añadir.
3. **El `<input>` lleva siempre los archivos que están en la lista** (se reescribe `input.files` con un `DataTransfer` tras cada cambio). El envío nativo y `new FormData(form)` funcionan sin código de la aplicación; quitar un archivo lo saca del envío; lo rechazado nunca entra. Medido: `FormData` del caso 1 lleva `comprobante = File «dos.pdf»`.
4. **Una selección vacía no borra** (cancelar el diálogo: algunos navegadores disparan `change` con cero archivos). Medido.
5. **Descripción, no `aria-invalid`.** `aria-describedby` = pista + estado + mensaje (con su prefijo oculto «Error:»). `aria-invalid` no está admitido en el rol `button` que exponen los navegadores para `input[type=file]` (ARIA 1.2 lo retiró como global); el error llega por la descripción. Hallazgo L10.
6. **`aria-required`, nunca `required` nativo** (#270, #334): `GForm` usa `novalidate` y el campo no valida la obligatoriedad (la decide la aplicación con `errors`, como en `GSelect`).

**Añadir: tres vías, ninguna exclusiva** (WCAG 2.5.7)

7. **Elegir** (diálogo del sistema), **arrastrar y soltar** sobre la cara, y **pegar** (Ctrl/⌘+V con el foco en el control: una captura de pantalla, un archivo copiado en el Finder). Arrastrar nunca es la única vía.
8. **`multiple` añade, uno solo reemplaza.** Con `multiple`, cada gesto **suma** a la lista (el nativo reemplazaría la selección anterior); sin `multiple`, el archivo nuevo sustituye al anterior (si estaba subiendo, se cancela) y se anuncia «uno.pdf reemplazado por dos.pdf».
9. **Validación al añadir, en este orden:** tipo (`accept`, misma sintaxis que el atributo nativo, comprobada por extensión y por MIME: el diálogo filtra pero arrastrar y pegar no), archivo vacío, tamaño (`maxSize`, bytes), duplicado (mismo nombre, tamaño y fecha) y número (`max`: entran los primeros que caben). Lo rechazado **no entra** en el modelo ni en el envío.
10. **Aviso de no añadidos, uno por gesto:** cada nombre con su motivo en texto («enorme.png: pesa 9 MB, el máximo es 8 MB»), en un grupo con nombre; no desaparece solo (2.2.1); «Descartar aviso» lo quita y devuelve el foco al control; el siguiente gesto lo sustituye.
11. **Lleno** (`max` alcanzado): el control **sigue enfocable y en el envío**, lleva `aria-disabled="true"`, no abre el diálogo y la cara dice «Límite alcanzado: quita uno para añadir otro». No se usa `disabled` (sacaría los archivos del Tab y del envío). Medido.
12. **Arrastrar encima es solo pintura** (borde, fondo, texto en la misma línea): Δ0 de la cara y de lo que la sigue (medido). Durante el arrastre el navegador solo da el MIME (Safari a veces ni eso, nunca el nombre): si `accept` lleva extensiones, se da por bueno y la decisión final es al soltar; si no casa, `dropEffect = 'none'` y «Aquí no se admite este archivo».
13. **Soltar fuera de un campo no abre el archivo.** Mientras haya un campo de archivos montado, una escucha en `document` cancela el `drop` de archivos que nadie atendió: el navegador navegaría al archivo y la página perdería lo escrito. La quita el último campo al desmontarse. Hallazgo L11.

**Modelo y envío**

14. **`v-model` = arreglo de entradas** `{ key, name, size, type, state, value, error, file }`. `state`: `ready` (sin adaptador), `queued`, `uploading`, `done`, `error`. Los archivos **ya guardados** (edición) llegan con `value` (y `url` para la miniatura) y sin `file`. El **progreso no está en el modelo**: se emite al cambiar la lista o un estado, no en cada tic (el componente lo lleva por dentro y lo pinta).
15. **Envío sin adaptador:** el binario viaja con el formulario (`name` en el `<input type="file">`). **Con adaptador:** el `<input type="file">` va **sin `name`** y el envío lleva un `<input type="hidden" name>` por archivo **subido** con el `value` que devolvió la aplicación (los guardados incluidos). Medido: cinco fotos subidas = cinco ocultos `fotos`, ningún binario.
16. **Adaptador de la aplicación, Grana sin red:** `upload(file, { signal, progress(loaded, total) }) → Promise<{ value }>`; rechaza con `{ message }` (texto de la aplicación) o con `AbortError`. Cola con concurrencia fija (2 en el prototipo). Es el patrón de la captura de voz (`speech.md` §4) y del servidor simulado de `GCombobox`.
17. **Con adaptador, la subida empieza al añadir.** «Subir al enviar» es pregunta de producto (r02).

**Cada archivo**

18. **Fila = `GSummary` `row` `lines: 2`:** nombre como `title`, tamaño y tipo como `facts` con `bare` (cifras y extensiones se explican solas), miniatura como `avatar` `{ src, shape: 'square' }` (decorativa), estado como `status`: «En cola», «45 %», «Subido», «Error»; los ya guardados, sin estado. En error, los datos **ceden su línea** al mensaje (`subtitle`), así la fila no crece.
19. **Δ0 por archivo:** misma altura en cola, subiendo, subido y error; el carril de progreso (`GProgress` real, `role="progressbar"` con `aria-valuenow` y `aria-valuetext` «45 %, 2,3 MB de 5,1 MB») es absoluto sobre el borde inferior. Medido.
20. **Acciones al lado de la ficha** (la ficha no lleva interactivos): «Reintentar {nombre}» solo en error (su `aria-describedby` es el mensaje del error) y **un mismo botón** «Quitar {nombre}» / «Cancelar subida de {nombre}» en el mismo sitio. Iconos `refresh-cw` y `x` (lista de la librería), con nombre en el botón.
21. **Foco:** quitar → al «Quitar» del siguiente, si no del anterior, si no al control de elegir; reintentar → al botón de la misma ficha (que pasa a «Cancelar subida»). Nunca al `body`. Medido.
22. **Cancelar es quitar:** aborta la subida (`AbortSignal`) y saca el archivo.
23. **Vista previa** solo de imágenes que el navegador pinta (PNG, JPG, GIF, WebP, AVIF, BMP, SVG) con una URL de objeto propia que se **revoca** al quitar y al desmontar; para los guardados, la `url` de la aplicación; HEIC, PDF y demás, con icono (`image`, `file-text`). Ampliar una imagen queda reservado.

**Anuncios**

24. **Región viva educada propia**, vacía desde el montaje (en el modal superior si lo hay, como `liveRegion.js`). Un anuncio **por gesto** (añadidos y rechazados juntos: «Añadido foto-receta.png. No se añadieron 2 archivos: Receta médica.pdf, no es imagen; notas.txt, no es imagen. Subiendo.»), **por fallo** («No se pudo subir radiografia-falla.png: Se interrumpió la conexión.»), **por cierre de lote** («3 archivos subidos.»: no uno por archivo), al **quitar** («Quitado foto-2.png. Quedan 4 archivos.»), al **cancelar** y al **reintentar**. Nunca cada tic de progreso. Los textos son de la aplicación (`labels`, #226).
25. **El estado está en la descripción del control** («2 de 5 · 1 subiendo · 1 con error»): quien vuelve al campo lo oye sin que nada se haya anunciado.

**Formulario**

26. **`useFormField`** con `name`, `trigger: 'change'`, `control` = el `<input>`, `root`; marca, `readonly` y `disabled` heredados de `GForm` con la precedencia de siempre. `notifyChange()` al cambiar la lista.
27. **El envío no sale con archivos a medio subir ni fallidos.** Se bloquea como un error del campo («Espera a que terminen de subir las fotos», «Una foto no se pudo subir: reinténtala o quítala»), el resumen enlaza al campo y el foco va allí; **nunca se envía solo** al terminar (3.2.2). El prototipo lo emula con `errors` de la aplicación (por eso el mensaje aparece ya al añadir): en el componente debe salir **solo al enviar** (hallazgo L7).
28. **Solo lectura:** lista visible y sin acciones; el control **sigue enfocable y en el envío**, con `aria-disabled="true"`; no abre el diálogo, no admite soltar ni pegar; la cara dice «Solo lectura» (C7, #165, #266). **Deshabilitado:** `disabled` en el `<input type="file">` y en los ocultos (fuera del Tab y del envío), lista atenuada, sin acciones.
29. **En `GFormRow`:** la zona de r01 es alta y va en su propia fila (como `GCheckboxGroup`). Que comparta fila depende de la forma (r02 A lo hace).

## Estados medidos

Vacío · foco · arrastrando encima (admite / no admite / lleno) · con archivos · aviso de no añadidos · subiendo con progreso · en cola · subido · error por archivo con reintento · cancelado · lleno · uno solo reemplazado · guardados (edición) con miniatura de la aplicación · solo lectura · deshabilitado · error del campo y resumen · envío nativo · 320px · RTL.

## Qué lo hace distinto

La forma se decide en r02. De comportamiento, la base ya se aparta del campo de archivos genérico en cinco reglas pensadas para quien llena un expediente:

- **Añadir en varias veces sin romper el formulario.** Los frameworks que permiten añadir por tandas suelen abandonar el `<input>` y obligan a enviar por JS; aquí el `<input>` real lleva siempre la lista, así que el envío nativo y `FormData` siguen funcionando.
- **El envío no sale con fotos a medio subir o fallidas** (punto 27): nadie guarda un expediente creyendo que lleva la radiografía que no subió.
- **Soltar mal no destruye la página** (punto 13): un archivo que cae fuera del destino no se abre encima del formulario.
- **Pegar** (punto 7): la captura que acabas de hacer entra con ⌘V, sin guardarla en el escritorio para buscarla después.
- **Nada salta** mientras arrastras, subes o fallas (puntos 12 y 19): solo crece la lista cuando tú añades.

## Comprobaciones

`node design/lab/file-field/verificar.mjs` (`CONCEPTS=base`) · 2026-10-05 · Chromium, Firefox, WebKit. Cifras por motor en `../r02/declaracion.md`, «Comprobaciones» (la misma batería corre sobre la base y sobre A, B y C).

Por motor (base): input real con nombre = etiqueta; descripción que apunta a elementos que existen; Tab llega al control; foco visible en la cara (≥ 2px); Espacio y clic abren el diálogo (`filechooser`); elegir tres; `input.files` sincronizado; anuncio por gesto; tipo, tamaño y número rechazados con motivo y sin entrar; arrastrar encima con Δ0; soltar; lleno con `aria-disabled` que no abre; barra de progreso con valor; Δ0 de la fila entre subiendo y subido; ocultos con el `value` del servidor y el `<input>` sin `name`; anuncio de cierre de lote; foco tras quitar (siguiente y, al vaciar, el control); error, anuncio, «Reintentar» descrito por el error y foco tras reintentar; cancelar; envío bloqueado con subidas en curso y resumen; pegar; solo lectura (sin acciones, enfocable, en el envío, no abre, no admite soltar); deshabilitado (fuera del envío); uno solo que reemplaza; selección vacía que no borra; `FormData` nativo con el `File`; 320px LTR y RTL y 1024px RTL sin desbordamiento y con objetivos ≥ 24px; contraste de pista, estado y acción (Chromium); consola limpia.

**No comprobado:** lector de pantalla real (VoiceOver, NVDA, TalkBack): cómo se lee el `<input type="file">` oculto con su descripción y el recuento nativo («2 archivos»), el aviso de no añadidos y los anuncios por lote; diálogo del sistema real (el `filechooser` de Playwright prueba que se abre, no lo que se ve) y la hoja móvil de iOS y Android (cámara); **arrastre real** desde el escritorio (se probó con eventos construidos con `DataTransfer`, que es lo que el navegador entrega, pero no el gesto del sistema); **pegar real** (evento construido; en Firefox el evento construido no lleva archivos, ver r02); `forced-colors`; zoom de texto al 200 %; archivos de varios GB; HEIC; la escucha de `document` con varios campos montados y desmontados en una SPA.

## Hallazgos para lima

| # | Tema | Propuesta |
| --- | --- | --- |
| L1 | Nombre y contrato | `GFileField`, contrato propio `design/contracts/file-field.md`; en `form.md` Fase 5 pasa a «contratado». Prefijo de clases `g-file-field` |
| L2 | Props | `accept` (String, sintaxis nativa), `maxSize` (Number, bytes), `max` (Number), `multiple` (Boolean), `uploader` (Function, el adaptador), `concurrency` (Number, 2), `locale` (String, para `Intl`), `label`, `hint`, `name`, `required`, `readonly`, `disabled`, `error` (los de `useFormField`), `labels` |
| L3 | Modelo | Entrada `{ key, name, size, type, state, value, error, file, url? }`; `key` estable que pone el componente (o la aplicación en los guardados); `state` de la lista del punto 14; los guardados con `value` y sin `file`. El progreso **fuera** del modelo. Decidir si se expone por slot (`{ entry, progress }`) |
| L4 | Eventos | `update:modelValue` y **`reject`** (`[{ name, reason, file }]`, `reason` ∈ `type`, `size`, `empty`, `duplicate`, `count`) para que la aplicación registre o explique más. Sin `upload`/`uploaded`: el modelo ya cambia de estado |
| L5 | Adaptador | `uploader(file, { signal, progress })` → `Promise<{ value }>`; rechazo `{ message }` (el texto lo pone la aplicación; sin él, `labels.uploadFailed`); `AbortError` = cancelado. Documentar que la aplicación respeta `signal` |
| L6 | Envío | Sin `uploader`: `name` en el `<input type="file">` (multipart). Con `uploader`: sin `name` en el `<input>` y un oculto por archivo `done` con su `value`. Los `ready`/`queued`/`error` no se envían |
| L7 | Bloqueo del envío | El campo bloquea el envío de `GForm` con subidas `queued`/`uploading` o con `error`, **sin que la aplicación lo ponga en `errors`** y **solo al enviar** (no al añadir). Propuesta: el registro de `useFormField` gana un `blocking()` propio del campo (ya existe `explicitError`; hace falta una vía interna para un error del componente) y textos `labels.pending` / `labels.failed` con `{count}`. No se envía solo al terminar |
| L8 | Textos | `labels` sin valores por defecto (#226): `choose`, `chooseMany`, `drop`, `dropMany` (`{count}`), `dropInvalid`, `full`, `readonly`, `status` (función), `added`, `addedMany`, `replaced`, `rejected`, `rejectedMany`, `reasons.{type,size,empty,duplicate,count}` (`{limit}`), `uploadFailed`, `uploaded`, `uploadedMany`, `removed`, `canceled`, `retrying`, `remove` (`{name}`), `cancel` (`{name}`), `retry` (`{name}`), `dismiss`, `queued`, `listLabel` (`{label}`), `progress` (`{name}`) |
| L9 | Tamaños | `Intl.NumberFormat` con `style: 'unit'` y unidades **decimales** (kB, MB: Finder, iOS, Android); el límite del aviso y el de la pista con la misma función. `locale` prop o el de la aplicación |
| L10 | ARIA | Sin `aria-invalid` en el `<input type="file">` (rol `button`); el error por `aria-describedby`. `aria-disabled="true"` para lleno y solo lectura. **Medir con lector real** antes de cerrar |
| L11 | Soltar fuera | Escucha en `document` mientras haya un campo montado (punto 13). Decidir si es siempre (recomendado) o una opción |
| L12 | Entrada | Cola, adaptador, arrastre de página y vista previa: estimación 7 a 10 KB gzip. Criterio de #238/#337: **entrada propia `@grana/vue/file-field`** (global UMD `GranaFileField`) con `GSummary`, `GProgress`, `GBtn` y `GIcon` por `__shared`. Decidir antes de construir (lección de #317 → #328) |
| L13 | `GProgress` | Falta una variante **sin fila de texto visible** (el nombre queda en `aria-label`): hoy, con `label`, la fila se pinta siempre. El prototipo la oculta con CSS propio. Propuesta: `hideLabel` o `bare` (afecta a `widget.md`) |
| L14 | Iconos | Usados: `x`, `refresh-cw`, `plus`, `circle-alert`, `triangle-alert`, `lock`, `check`, `loader-circle` (ya en la lista) y **`file-text`, `image`, `inbox`** (no están: entran en la lista de la librería, `icons.md` §4). Para r02 y siguientes rondas faltan en la lista de laboratorio `upload`, `paperclip`, `file`, `camera`, `clipboard-paste` (bruno, `scripts/icons.json`, lista `lab`) |
| L15 | Tokens | Ninguno nuevo en la base |
| L16 | Reservas | `capture` (cámara directa en móvil), `validate(file)` (validación propia de la aplicación, síncrona o con promesa: dimensiones de imagen, páginas de PDF), reordenar, ampliar la imagen, carpetas (`webkitdirectory`), subida por trozos y reanudable (es del adaptador) |
