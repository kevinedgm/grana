# Declaración de cumplimiento · Sistema de formularios · r01

**Estado:** en revisión. **Fuente de verdad:** `brief.md` de esta ronda (brief del usuario).
**Ruta:** R2 (sistema de composición, no un componente suelto) · **Fidelidad:** F2 · **Material:** kit gris neutro, iconos solo Lucide (`design/lab/lucide-icons.js`).
**Siguiente dueño:** lima → contratos por **fases** (§13), empezando por la Fase 1.
**Prototipo:** `index.html` (8 secciones funcionales: anchos, corto, mediano, 3 anchos, largo administrativo, solo lectura, guardado automático, dialog/drawer).
**Convención:** «propuesta kiwi pendiente de visto bueno» = recomendación que se asume si el usuario no responde; las que derivan de un estándar se marcan con su criterio. Grises, grosores, radios y duraciones del prototipo son de wireframe, **no** propuestas de estilo.

## 0. Inventario previo (qué existe y qué se compone)

El sistema **no duplica** campos: compone lo que hay y añade solo la capa de composición.

| Existe | API real relevante (meta/contrato) | Papel en el sistema |
| --- | --- | --- |
| `GInput` | `label` `hint` `error` `required` `readonly` `disabled` `loading` `density` `size` `block` `counter`; tipos `text email password search tel url` (**sin `number`**, #27); slots `prepend`/`append` **decorativos** (`aria-hidden`), `action` (GBtn acoplado, #33); `inheritAttrs:false` → `name`, `autocomplete`, `inputmode` van al `<input>`; ancho propio `min(100%, space×60)` | Campo de texto, correo, teléfono (parte), RFC, CURP… |
| `GTextarea` | igual lenguaje + `rows` `autosize` `maxRows` `resize` (#50) | Observaciones, notas |
| `GSelect` | `options` (+grupos), `placeholder` `clearable` `createLabel`, `name` → `<input hidden>`, `readonly` = `aria-readonly` (#54, #57) | Listas largas o medias (estado, régimen) |
| `GCheckbox` / `GCheckboxGroup` | `layout` `default card chip`; grupo = `fieldset/legend`, modelo arreglo, `provide/inject` (#37) | Multiselección, confirmaciones, chips múltiples |
| `GSwitch` | `role="switch"`, sin `required` (#47), `loading` no bloquea | Preferencias que se aplican al instante |
| `GDatePicker` | `label hint error required readonly name`, `single/range`, `split` | Fechas |
| `GDialog` | `inset` (por defecto), `placement="end"` (drawer, #77), slot `footer`, slot `tabs`, `g-dialog__section`, `dismiss` **cancelable**, contenido **se desmonta al cerrar** (#152), envío con `form="…"` | Formularios en dialog y drawer |
| `GSurface` | `level="inset"` un paso de tono relativo (#99) | Agrupar sin cajas dentro de cajas |
| `GStepper` | `steps` con `status` `error/warning`, `optional`; `select` cancelable (#97) | Formularios de varios pasos |
| `GTabs` | paneles montados (#78), `status: attention` por pestaña, densidad compartida (#114) | Secciones independientes |
| `GSidebar` | navegación **entre destinos** (`aria-current="page"`, modos, navbar, drawer) | **No** es navegación de secciones (ver §1.8) |
| `GHelper`/`GHelperScope` | ayuda contextual (botón propio + popover/hoja) | Ayuda de sección o de campo |
| `GBadge`, `GToast`, `GCard`, `GBtn` | — | Insignia «Opcional», avisos tras guardar, tarjetas de opción, acciones |
| Precedente `GWidgetConfig` | resumen de errores `role="alert"` + `tabindex=-1` + foco por cada `apply`; `errors` `{ field, message }` de la aplicación (#76, #78) | Se **generaliza** como `GErrorSummary` |

Reglas heredadas que el sistema respeta: los campos **no validan** (el consumidor decide el error, `input.md`); `density` compartida `default/comfortable/compact` con `spacious` = `default` (#114, #135); la región de error de cada campo es `aria-live="polite"` y se renderiza siempre; lección de `mergeProps` (manejador propio primero) — ver hallazgo 4.

## 1. Arquitectura y componentes

Capa de **composición** sobre los campos. Se comunica por **un contexto inyectado** (`provide/inject`) que los campos leen **solo si existe**: fuera de `GForm` cada campo funciona igual que hoy. Las props explícitas del campo siempre ganan al contexto.

| # | Pieza | Tipo | Elemento | Responsabilidad |
| --- | --- | --- | --- | --- |
| 1 | `GForm` | componente | `<form novalidate>` | Contexto (densidad, convención de marcas, `readonly`/`disabled` globales, registro de campos), **cuándo** se muestran los errores (§5), envío, resumen, estado sucio, aviso al abandonar. **No** valida reglas ni guarda: emite intención |
| 2 | `GFormSection` | componente | `<section>` + `<hN>` | Título, descripción, acciones secundarias, ayuda (`GHelper`), marca «Opcional»; modos `static` · `collapsible` · `addable` (§3, §4) |
| 3 | Rejilla de formulario | componente **ligero** `GFormGrid` + **clases** de ancho | `<div>` | 12/6/1 columnas por **ancho propio**; los hijos llevan `g-form-w-{xs\|sm\|md\|lg\|full}` y `g-form-break` (§2) |
| 4 | `GFormRow` | **clase** `g-form-row` (o componente trivial) | `<div>` | «Fila unida»: campos **independientes** y relacionados que comparten fila también en una columna (Núm. ext. \| Núm. int.); alinea las cajas con *subgrid* |
| 5 | `GFieldGroup` | componente | `<fieldset>` + `<legend>` | **Campo compuesto** con una sola pregunta y varias partes (Teléfono: país \| número \| ext.; Temperatura: valor \| unidad); un solo mensaje; partes unidas o separadas |
| 6 | `GFormReveal` | componente | `<div>` | Aparición condicional sin saltos (§4); cerrado = `inert` + controles fuera del envío |
| 7 | `GErrorSummary` | componente | `<div tabindex=-1>` › `role="alert"` | Lista de enlaces a los campos con error; recibe el foco al enviar (§5) |
| 8 | `GFormActions` | componente | `<div>` | Acciones con jerarquía, estado (`role="status"`) y `sticky` (§6) |
| 9 | `GFormNav` | componente | `<nav>` con nombre | Navegación **de secciones** de la misma página con *scroll-spy* y estado por sección (§1.8) |
| 10 | `GFormStatus` | componente pequeño (o parte de `GFormActions`) | `role="status"` | Guardando / Guardado / Error al guardar (autosave) |
| 11 | `useFormField()` | composable | — | Lo que usan los campos (propios y del consumidor): id, `aria-describedby`, error visible, marca, registro, *touched* |

**1.1 Por qué `GForm` no valida.** Grana presenta y emite intención (AGENTS.md). Las reglas son de la aplicación (cualquier librería o funciones). `GForm` recibe `errors` (objeto `name → mensaje`, calculado por la app) y decide **cuándo** se muestran, construye el resumen y mueve el foco. Así un error del servidor tras enviar entra por la misma vía.

**1.2 Contexto que provee `GForm`.** `density`, `marks` (`required`/`optional`), `readonly`, `disabled`, `validateOn`, `showError(name)`, `register/unregister(name, { el, section, required, filled })`, `touched(name)`. Los campos con `name` dentro de `GForm` toman de ahí su `error` visible (si no traen `error` propio), su densidad (si no traen `density`), la marca de su etiqueta y su modo `block` dentro de la rejilla.

**1.3 Componentes vs. clases.** Componentes donde hay **semántica o comportamiento** (form, section, fieldset, reveal, summary, nav, actions). Clases donde solo hay **colocación** (anchos, salto de fila, fila unida): no añaden DOM a los campos y sirven para campos del consumidor.

**1.4 Sin acoplamiento.** Ningún campo importa `GForm`; solo lee una `InjectionKey` opcional. `GFormNav` y `GErrorSummary` reciben el formulario por `for`/prop o por contexto; fuera de `GForm` reciben `items`/`errors` explícitos (precedente: `GWidgetConfig` pinta el resumen sin conocer los campos).

**1.8 `GFormNav` y no `GSidebar`.** `GSidebar` es navegación **entre destinos** (`aria-current="page"`, riel, navbar inferior, drawer, `navigate` para router). Una navegación de secciones necesita otra semántica: enlaces `#id` dentro de la página, `aria-current="location"`, **estado por sección** (completa, incompleta, con N errores) en texto, *scroll-spy* y foco al título al elegir. Reutilizar `GSidebar` mezclaría ambos modelos; `GFormNav` comparte vocabulario visual (activa neutra, píldora) sin el resto.

## 2. Rejilla y anchos semánticos

| Ancho | Contenido típico (brief) | 12 col (ancho) | 6 col (medio) | 1 col (estrecho) |
| --- | --- | --- | --- | --- |
| `xs` | temperatura, edad, %, cantidad, núm. interior, unidad | 2 | 2 | máx. `space × 30` |
| `sm` | código postal, fecha, prefijo, RFC, moneda | 3 | 2 | máx. `space × 48` |
| `md` | nombre, apellido, correo, ciudad, teléfono suelto, identificadores | 4 | 3 | 100% |
| `lg` | calle, razón social, campo compuesto de teléfono | 8 | 6 | 100% |
| `full` (por defecto) | observaciones, descripción, opciones en tarjetas | 12 | 6 | 100% |

1. **Tramos por el ancho propio** de la rejilla (`ResizeObserver`), nunca el visor (#69, #73, #130): ancho ≥ `space × 176`, medio ≥ `space × 104`, estrecho por debajo (propuestas; constantes de diseño derivadas de `space`, sin token ni excepción nueva). Cada rejilla anidada (condicional, sección con encabezado al lado, inset del dialog) **se mide sola**: verificado que la del dialog mediano cae en 6 columnas y la del encabezado al lado se re-mide.
2. **Filas que no se llenan.** El ancho expresa contenido, no simetría: una fila puede quedar con huecos (brief: «no todos al mismo ancho para hacerlos ordenados»). `g-form-break` fuerza nueva fila cuando el siguiente campo empieza otra idea (Fecha de nacimiento tras los apellidos; Estado tras Ciudad).
3. **Estrecho = una columna**, pero lo compacto **conserva su máximo** (36.5 no se estira a 320px; el objetivo táctil crece en altura por `pointer: coarse`, no en ancho).
4. **Compartir fila en móvil solo con relación explícita** (brief: «campos relacionados muy pequeños»): `GFieldGroup` (una pregunta con partes: País \| Número) o `g-form-row` (preguntas distintas pero ligadas: Núm. ext. \| Núm. int.). Nunca por empaquetado automático de campos pequeños vecinos.
5. **Composiciones del brief** (verificadas en 12/6/1): Nombre \| Primer apellido \| Segundo apellido (`md` ×3) · Teléfono `lg` = País `sm` \| Número (crece) \| Ext. `sm`, que pasa debajo si no cabe · Temperatura `sm` = [valor \| unidad] unidos \| Peso `xs` [kg] \| Estatura `xs` [cm] \| Fecha `sm` · Calle `lg` \| [Núm. ext. \| Núm. int.] `md` / Colonia `md` \| CP `sm` \| Ciudad `md` / Estado `md` \| País `md`.
6. **Dentro de la rejilla el campo es `block`**: `GInput` tiene ancho propio `min(100%, space×60)`; en una celda debe llenarla. Lo resuelve el contexto (no CSS cruzado): hallazgo 3.
7. **Alineación de cajas en una fila.** Con etiquetas de distinta altura (una se parte en dos líneas) las cajas se desalinean si los campos se alinean por arriba. En `g-form-row` se resuelve con **subgrid** (etiqueta · caja · ayuda · mensaje como filas compartidas; verificado: cajas alineadas con «Número interior (opcional)» en dos líneas). En la rejilla general no se puede con `fieldset` (el `<legend>` no participa en la rejilla): se mantiene alineación superior y la regla de contenido «etiquetas cortas en filas compartidas». Hallazgo 12.

## 3. Secciones

1. **Sin tarjetas.** Jerarquía por espacio (separación entre secciones ≈ 2× la de campos) y tipografía (título `h3` en página, `h2`→`h3` dentro de dialog); divisores solo si ayudan (dialog: `g-dialog__section`). Brief: «no encerrar cada sección en otra Card».
2. **Elemento:** `<section>` + encabezado `hN` (nivel por prop `headingLevel`, por defecto el siguiente al del formulario). **Sin** `aria-labelledby` en la sección: con nombre se convertiría en *landmark* `region` y un formulario largo tendría diez puntos de referencia (ruido). Los encabezados ya dan la navegación (WCAG 1.3.1, 2.4.6, 2.4.10). `fieldset/legend` se reserva para **preguntas** agrupadas (radio, compuestos), como recomienda W3C WAI «Grouping Controls».
3. **Partes:** título · insignia «Opcional» (texto, no color) · descripción · acciones secundarias al final del encabezado (Quitar, Copiar de…) · ayuda contextual (`GHelper`; en el prototipo, un botón de divulgación) · campos.
4. **Encabezado al lado** (`headerPlacement="auto"`): con el formulario ≥ `space × 200` (ancho **propio**), título y descripción a la izquierda y campos a la derecha (brief: «secciones lado a lado» en desktop). La rejilla de campos se re-mide (pasa de 12 a 6 columnas). Por debajo, arriba. `top` fija arriba.
5. **Modos:** `static` (por defecto: las secciones necesarias **siempre visibles**, brief), `collapsible` (secundaria/avanzada/ya completa), `addable` (opcional que no ocupa espacio). No usar acordeón para lo esencial.

## 4. Disclosure, secciones opcionales y condicionales

| Patrón | Cuándo | Semántica | Datos | Foco |
| --- | --- | --- | --- | --- |
| **Agregar** (`addable`) — «＋ Agregar datos fiscales · Solo si el paciente pide factura» | Bloque opcional que el usuario **decide incluir** | Botón normal (no `aria-expanded`): **inserta** la sección; la sección trae «Quitar …» | Sin agregar: sus campos **no se envían ni validan**; al quitar se limpian sus errores | Al agregar → al **título** de la sección (`tabindex=-1`, contexto antes que campo); al quitar → vuelve a «Agregar» |
| **Colapsable** (`collapsible`) — «Configuración avanzada» | Secundaria o poco frecuente; los datos **siguen siendo parte** del formulario (valores por defecto) | Botón dentro del encabezado con `aria-expanded`/`aria-controls` (APG Disclosure); el nombre no cambia | Cerrada: `inert` pero **se envía y se valida**; un enlace del resumen a un campo dentro **la abre** | Se queda en el botón |
| **Condicional** (`GFormReveal when`) — «¿Requiere factura? Sí → datos fiscales»; «Física → CURP / Moral → Razón social y representante» | Campos que solo aplican según una respuesta | Bloque **inmediatamente después** de la pregunta que lo controla, sangrado con barra (GOV.UK *conditional reveal*); sin anuncio automático: el usuario llega por orden de lectura | Oculto: `inert` + controles **deshabilitados** → fuera del envío y de la validación; los valores **se conservan** en memoria si vuelve a «Sí» (verificado) | Se queda en el control |

**Sin saltos (verificado):** el control que dispara no se mueve (Δ 0px); el bloque crece de 0 a su altura con opacidad (`grid-template-rows: 0fr → 1fr`, sin medir alturas en JS) y anula la separación de la rejilla mientras está cerrado (margen negativo igual al hueco, para que no aparezca un hueco fantasma). Al terminar, `overflow` pasa a visible para no recortar el anillo de foco. Con `prefers-reduced-motion` aparece de golpe (duración 0s). Anidados: un padre cerrado deja dentro todo deshabilitado; al reabrirlo, los hijos se reevalúan.

## 5. Validación y resumen de errores

1. **Momento** («castigar tarde, premiar pronto», propuesta derivada de Baymard/GOV.UK): al **salir** de un campo, solo si escribió algo (un vacío no se marca al pasar); al **enviar**, todo; un campo ya marcado se **revalida al escribir** y el error desaparece en cuanto se corrige; radio/casilla/selector al cambiar. `validateOn`: `blur` (por defecto) o `submit`. Validación en tiempo real solo si informa algo útil (contador, CP encontrado).
2. **Estados del brief:** default, focus, **valid** (mensaje útil, no un check gratuito: «Código postal de Oaxaca de Juárez»), **warning** (no bloquea el envío: «Temperatura alta: confirma la lectura»), **error** (bloquea), disabled, readonly. Señal no cromática: grosor/estilo de borde + icono + prefijo oculto «Error:»/«Advertencia:» (WCAG 1.4.1, 3.3.1).
3. **Mensajes** que dicen qué pasó y cómo corregir (3.3.3): «Escribe el correo con el formato nombre@dominio.com», «Escribe una temperatura entre 30 y 45 °C», «El RFC de persona física tiene 13 caracteres (p. ej. GODE561231GR8)». Nada de «Campo inválido». El vacío obligatorio: «Escribe el nombre del paciente» / «Elige el sexo».
4. **Dependencias:** cambiar la unidad (°C→°F) revalida el valor del mismo grupo (verificado).
5. **Al enviar con errores:** con `GErrorSummary` colocado → aparece arriba con «Hay N problemas con el formulario», un enlace por **pregunta** (los compuestos enlazan a su primera parte inválida), mismo texto que el error en línea, y **recibe el foco** (patrón GOV.UK, precedente #78 con `role="alert"` + `tabindex=-1`). Sin resumen colocado (formularios cortos, dialogs) → foco al **primer campo inválido**. Recomendación: resumen en formularios con secciones; foco directo en los de pocos campos.
6. **Anuncios sin ruido:** los errores en línea que aparecen **por el envío** se escriben con su región viva en `off` un instante (verificado: `off` → `polite`), porque el resumen ya los anuncia; los que aparecen al salir del campo sí se anuncian (el foco ya está en el siguiente campo y `aria-describedby` no se volvería a leer). Hallazgo 6 (afecta a `GInput` y compañía).
7. **Enlace del resumen:** abre la sección colapsable que lo contiene (y en `GTabs`/`GStepper`, cambia de pestaña/paso: lo hace la app con el evento), enfoca el control y desplaza para que **se vea la etiqueta** (GOV.UK), respetando el pie fijo.
8. **Al corregir**, el enlace sale del resumen en silencio; si no queda ninguno, el resumen se oculta. Errores del servidor: la app los pasa en `errors` tras el `submit` y se muestran igual.
9. **Borrador** no valida (verificado): guardar a medias es justo lo que el borrador permite.
10. **Título de página** con prefijo «Error:» tras un envío fallido (GOV.UK): responsabilidad de la app; se documenta.

## 6. Acciones y pie

1. **Jerarquía:** una primaria (Guardar, Registrar, Crear), secundaria con borde (Guardar borrador), terciaria como enlace (Cancelar). Más de una primaria → aviso en desarrollo.
2. **Orden:** alineadas al final; **orden del DOM = orden visual** (Cancelar · Guardar borrador · Primaria). En estrecho se apilan en ese mismo orden (la primaria queda abajo, junto al pulgar) sin `column-reverse` (WCAG 1.3.2, 2.4.3). Propuesta kiwi pendiente de visto bueno (ver pregunta 3).
3. **Estado** a la izquierda del pie en `role="status"`: «Cambios sin guardar» (una vez), «Guardado a las 10:42», «Borrador guardado (sin validar)».
4. **`sticky`** (formularios largos, administrativos): pegado al borde inferior del contenedor que se desplaza, fondo propio y línea superior. **Nunca tapa el campo enfocado** (WCAG 2.2 **2.4.11** *Focus Not Obscured*): `GForm` publica la altura medida del pie y los controles llevan `scroll-margin-block-end` igual a ella + margen; respaldo JS que corrige si el navegador no lo respeta. Verificado: Tab por los 29 controles del formulario largo, ninguno tapado, y también **solo con CSS** (sin el respaldo).
5. **Cambios sin guardar:** `GForm` marca sucio por eventos `input`/`change` nativos que burbujean y expone `v-model:dirty`; con `dirty`, `beforeunload` avisa al cerrar la pestaña (opción `guard`); para rutas internas la app usa `dirty` en su guardia de router; en dialog, la app cancela `dismiss` (ver §7).
6. **Guardado automático** (`GFormStatus`): solo donde cada cambio se aplica por sí mismo (preferencias con interruptores); estados Guardando… (con icono que gira, quieto con movimiento reducido) / Guardado / «No se pudo guardar "X". Revisa tu conexión» + Reintentar; el control **vuelve** a su valor si falla (como dice `api.md` para `loading`). **No** en formularios que esperan confirmación explícita. `GForm` no guarda: la app hace la petición y pasa el estado.

## 7. Contextos: dialog y drawer

1. **Dialog** (`GDialog` con `inset`, `size="md"`): encabezado separado (título + descripción), el formulario vive en la **superficie inset** (no inputs pegados a la carcasa), cuerpo desplazable (región enfocable solo si desborda, #46), pie con acciones; el envío del pie usa `form="id"` (el pie está fuera del `<form>`, `dialog.md`). La rejilla mide la inset: 6 columnas en `md`. Sin resumen: foco al primer inválido (verificado).
2. **Cambios sin guardar en dialog:** Esc, Cerrar y Cancelar con `dirty` → la app impide `dismiss` y muestra una confirmación en el pie («Tienes cambios sin guardar» · Seguir editando · Descartar cambios) con el foco en la acción segura. Importante porque `GDialog` **desmonta** el contenido al cerrar (#152): un cierre accidental perdería todo. Guardar válido cierra y devuelve el foco al disparador (verificado).
3. **Drawer** (`GDialog placement="end"`): rejilla en `stack` (una columna fija aunque el drawer sea ancho; brief), jerarquía vertical, acciones fijas en el pie (el cuerpo es lo único que se desplaza), sin campos comprimidos.
4. **Dialog en móvil:** hoja inferior a ancho completo sin desborde (verificado a 320px); la rejilla pasa sola a una columna.
5. **Formularios con pestañas en dialog:** slot `tabs` de `GDialog` (#119) + paneles montados (#78); el resumen marca cada pestaña con su cantidad de errores (`status: attention`), como `GWidgetConfig`.

## 8. Responsive y orden

1. **Una sola estructura**; todo depende del ancho propio (rejilla, encabezado de sección, navegación lateral), no del visor (salvo `GDialog`, que ya tiene su excepción #42).
2. **Orden de lectura = DOM = Tab = visual** en los tres tramos: la rejilla coloca por orden **sin** `order`, `grid-auto-flow: dense` ni posiciones explícitas que reordenen. Verificado en 960/600/360 (orden visual 0…7 igual al DOM y Tab igual al DOM). Uso de `order`/`dense` en hijos → aviso en desarrollo (propuesta).
3. **Navegación lateral** solo con el contenedor ≥ `space × 190`; debajo se oculta y los encabezados son la navegación (verificado a 640px).
4. **320px:** sin desborde de página ni de ninguna caja; País \| Número del teléfono comparten fila; Ext. pasa debajo (verificado).

## 9. Densidad

`density` compartida en `GForm` (`default` = *spacious* del brief, `comfortable`, `compact`; #114) que **heredan** los campos sin densidad propia. Multiplica altura de control (36→27px en `compact`, verificado), separación de la rejilla y entre secciones; **no** cambia tipografía ni mínimos: con `pointer: coarse` la caja mide ≥ 44px aunque sea `compact` (verificado con la simulación táctil). Piso de 24px fuera de táctil.

## 10. Accesibilidad (criterios)

| Criterio | Cómo se cumple | Verificado |
| --- | --- | --- |
| 1.3.1 Info y relaciones | `label for`; `fieldset/legend` en radio y compuestos; secciones con encabezado; ayuda y mensajes por `aria-describedby`; unidad («kg») como texto oculto en la descripción | Sí (atributos) |
| 1.3.2 Secuencia significativa | DOM = visual en 12/6/1; acciones sin reordenar | Sí |
| 1.3.5 Propósito de entrada | `autocomplete` en nombre (`given-name`, `family-name`), `email`, `tel-country-code`/`tel-national`/`tel-extension`, `address-line1/2`, `address-level1/2/3`, `postal-code`, `country-name`, `organization`, `bday` | Sí (marcado) |
| 1.4.1 Uso del color | Error/advertencia/válido con icono, texto y borde distinto; estado de sección con icono + texto | Sí (wireframe sin color) |
| 2.1.1 Teclado | Todo nativo; segmentado y chips son radios reales | Sí |
| 2.4.3 Orden del foco | Tab sigue la lectura; foco a resumen, a título de sección agregada, de vuelta a «Agregar», al disparador del dialog | Sí |
| 2.4.6 Encabezados y etiquetas | Etiqueta visible siempre; placeholder solo ejemplo («951 123 4567»), nunca sustituto | Sí |
| 2.4.11 Foco no oculto (2.2) | `scroll-margin` = altura del pie fijo + respaldo | Sí (29 focos) |
| 2.5.8 Tamaño del objetivo (2.2) | ≥ 24px; ≥ 44px táctil sin importar densidad | Sí (altura) |
| 3.3.1 Identificación de errores | Texto + `aria-invalid` + prefijo «Error:» | Sí |
| 3.3.2 Etiquetas o instrucciones | Convención única de marcas; con asterisco, frase que lo explica; formatos en ayuda | Sí |
| 3.3.3 Sugerencia de error | Mensajes con la corrección | Sí |
| 3.3.4 Prevención de errores | Revisión antes de enviar en formularios con consecuencias: resumen + confirmación al descartar; paso «Confirmación» en stepper | Parcial (descartar sí; confirmación legal/financiera es de la app) |
| 3.3.7 Entrada redundante (2.2) | Condicionales conservan lo escrito; «Copiar dirección de…» como acción de sección; autocomplete | Parcial (copiar no prototipado) |
| 4.1.2 Nombre, función, valor | `aria-expanded` en colapsables, `aria-current="location"` en la navegación, `role="switch"`, `aria-readonly` en select/casilla/radiogroup de solo lectura | Sí |
| 4.1.3 Mensajes de estado | Errores al salir (`polite`), resumen (`alert` + foco), estado de guardado (`status`) | Sí (atributos) |

## 11. Guía de decisión

**Estructura del formulario**

| Situación | Usa | No uses |
| --- | --- | --- |
| ≤ ~6 campos, una idea | Una página, una rejilla, sin secciones ni resumen | Secciones de un campo |
| Varias ideas, cabe en una página | Secciones estáticas | Stepper «para que se vea moderno» |
| Muy largo, administrativo, se edita a menudo en desorden | Secciones + `GFormNav` + pie fijo + resumen | Acordeones para lo obligatorio |
| Proceso secuencial; respuestas que cambian lo que sigue; cada grupo es sustancial | `GStepper` (un `GForm` por paso o uno con secciones por paso; validar al «Continuar»; paso final de confirmación) | Stepper si cabe cómodamente en una página |
| Grupos independientes entre los que se salta libremente (General, Facturación, Permisos) | `GTabs` con paneles montados y marcas de error por pestaña | Tabs con dependencia secuencial |
| Opcional que el usuario decide incluir | Sección `addable` («Agregar …») | Sección siempre abierta con todo opcional |
| Avanzado/poco frecuente, con valores por defecto | Sección `collapsible` | Ocultar lo necesario para terminar |
| Depende de una respuesta | `GFormReveal` justo tras la pregunta | Mostrar todo y deshabilitar |

**Control para elegir**

| Situación | Control |
| --- | --- |
| Una opción entre 2–5 visibles, etiquetas cortas | `GRadioGroup` `segmented` (Femenino \| Masculino \| Otro; Bienes \| Servicios \| Ambos) o `inline` (Sí \| No) |
| Una opción entre pocas con descripción | `GRadioGroup` `cards` (Rol) |
| Una opción, 5–7, sin descripción | `GRadioGroup` `list` o `chips` |
| Una opción entre muchas (> 7) o lista conocida | `GSelect` |
| Una opción entre cientos / búsqueda | Combobox (fase propia) |
| Varias opciones | `GCheckboxGroup` (`default`/`chip`/`card`) |
| Confirmación independiente («Acepto…», «Notificar») o binario que se aplica **al guardar** | `GCheckbox` («Bloquear pedidos nuevos — se aplica al guardar») |
| Binario que se aplica **al instante** | `GSwitch` (nunca como sustituto de casilla en un formulario con Guardar) |
| Texto largo o variable | `GTextarea` con `autosize` y `maxRows` (crece hasta un límite, luego desplaza) |
| Dato que se muestra y se envía pero no se edita (folio, edad calculada) | `readonly`: contraste completo, enfocable, seleccionable, se envía |
| Dato que no aplica ahora | `disabled` (atenuado, fuera de Tab, **no se envía**) — o mejor, ocultarlo con `GFormReveal` |

**Marcas:** una sola convención por formulario. Si casi todo es obligatorio, marcar opcionales con «(opcional)» en la etiqueta; si casi todo es opcional, marcar obligatorios con asterisco y explicarlo arriba. Nunca ambas.

## 12. Mapa de campos

| Tipo del brief | Hoy | Con qué | Falta / plan |
| --- | --- | --- | --- |
| text | Sí | `GInput` | — |
| email | Sí | `GInput type="email"` + `autocomplete` | — |
| textarea | Sí | `GTextarea autosize maxRows` | — |
| select | Sí | `GSelect` | — |
| checkbox | Sí | `GCheckbox`/`GCheckboxGroup` | — |
| switch | Sí | `GSwitch` | — |
| date picker | Sí | `GDatePicker` | — |
| custom fields | Parcial | slots + `useFormField()` | `useFormField` (Fase 1) |
| **radio** | **No** | — | **`GRadioGroup`/`GRadio`** con `appearance` `list` `inline` `segmented` `chips` `cards`, `fieldset/legend`, flechas nativas — **Fase 2, imprescindible** (Sí/No, persona física/moral, sexo) |
| segmented | No (`GTabs segmented` es navegación, no valor) | — | Como `appearance="segmented"` de `GRadioGroup` (no componente aparte) — Fase 2 |
| chips selectables | Múltiple sí (`GCheckboxGroup layout="chip"`) | — | Única: `GRadioGroup appearance="chips"` — Fase 2 |
| **number / quantity** | **No** (#27 excluye `number`) | — | **`GNumberField`**: `<input type="text" inputmode="decimal\|numeric">` (no `type=number`, como recomienda GOV.UK: rueda, flechas y validación nativa confusas), `min` `max` `step` `precision`, formato con `Intl` al salir, prefijo/sufijo **de texto accesible** (`kg`, `%`, `días`, `$`) en la descripción, botones −/+ opcionales (patrón *spinbutton* de APG) — **Fase 2, imprescindible** |
| temperature | No | — | `GNumberField` + `GFieldGroup joined` con `GSelect` de unidad (o sufijo fijo `°C`) — Fase 2 (receta) |
| percentage | No | — | `GNumberField` con sufijo `%` — Fase 2 |
| currency | No | — | `GNumberField` con `Intl.NumberFormat` `style: currency` + moneda de la app — Fase 4 (formato de entrada y separadores por idioma merecen ronda propia) |
| phone | Parcial | `GFieldGroup` (`GSelect` país + `GInput type="tel"` + ext.) | Receta en Fase 1; `GPhoneField` con formato por país, opcional — Fase 4 |
| address | Parcial | Sección + rejilla + `autocomplete` | **Receta/patrón**, no componente: las partes dependen del país (colonia, CP) — documentar en Fase 1; búsqueda de dirección = combobox (Fase 4) |
| time picker | No | — | `GTimeField` (segmentos hh:mm, 12/24 h, `Intl`) — ronda propia, Fase 4 |
| autocomplete / combobox | No (`GSelect` filtra por tecleo pero no admite texto libre ni búsqueda remota) | — | `GCombobox` (APG *combobox* con lista), sin `fetch`: emite `search` — ronda propia, Fase 4, prioridad alta |
| file input | No | — | `GFileField` (botón + zona de arrastre opcional, lista de archivos con quitar, errores por archivo, progreso por evento) — ronda propia, Fase 4 |

**Entran en esta ronda (estructura definida aquí, contrato en Fase 2):** `GRadioGroup` y `GNumberField` (con unidad), porque sin ellos el sistema no resuelve Sí/No, condicionales ni los campos compactos del brief. El resto, rondas propias por prioridad: combobox → archivo → hora → moneda/teléfono dedicado.

## 13. Fases (entregables para lima → coco → bruno)

| Fase | Contenido | Toca componentes existentes |
| --- | --- | --- |
| **1 · Núcleo de composición** | `GForm` (contexto, `errors` + `validateOn`, envío, `dirty`, `readonly`/`disabled` globales, marcas), `GFormSection` `static`, rejilla `GFormGrid` + clases `g-form-w-*` / `g-form-break` / `g-form-row`, `GFieldGroup`, `GFormActions` (con `sticky` y 2.4.11), `GErrorSummary`, `useFormField`; recetas teléfono y dirección | Sí: `GInput`, `GTextarea`, `GSelect`, `GCheckbox(Group)`, `GSwitch`, `GDatePicker` leen el contexto (error visible, densidad, marca «opcional», `block` en rejilla, registro, silencio al enviar) |
| **2 · Campos imprescindibles** | `GRadioGroup`/`GRadio` (5 apariencias), `GNumberField` (prefijo/sufijo, unidad, −/+) | Quizá `GInput`: slots `prefix`/`suffix` **de texto** (hoy solo iconos decorativos) — ver hallazgo 9 |
| **3 · Divulgación y navegación** | `GFormSection` `collapsible`/`addable`, `GFormReveal`, `GFormNav` (scroll-spy, estados), encabezado de sección al lado | No |
| **4 · Estado y guardado** | `GFormStatus` (autosave), guardia `beforeunload`, integración documentada con `GDialog`/`GStepper`/`GTabs` (marcas de error por paso/pestaña) | `GStepper`/`GTabs` ya tienen `status` |
| **5+ · Campos nuevos (rondas kiwi propias)** | `GCombobox`, `GFileField`, `GTimeField`, moneda/teléfono dedicados | — |

Cada fase es entregable sola: la Fase 1 ya permite formularios cortos, medianos y en dialog/drawer; la 3 añade los largos.

## 14. Comprobaciones ejecutadas

Playwright (Chromium) sobre `index.html`, **77/77**, consola limpia a 1280 y 320px:

- Rejilla: 12/6/1 por contenedor (960/600/360) en la demo de tres anchos y en el mediano con sus botones; orden visual = DOM y Tab = DOM en 960 y 360; en una columna, fila unida Núm. ext. \| int. comparte fila con **cajas alineadas** (subgrid) y CP (`sm`) no ocupa todo el ancho.
- Validación: vacío al salir no marca; correo mal escrito al salir → error útil, `aria-invalid`, región `polite` en `aria-describedby`; se limpia al escribir; advertencia no bloqueante (38.6 °C); cambiar a °F revalida; estado válido (CP 68000); Edad de solo lectura derivada.
- Envío: resumen visible con foco, dentro de `role="alert"`; regiones en línea `off` y luego `polite`; un enlace por pregunta con el texto en línea (sin «inválido»); el enlace enfoca el campo y deja su etiqueta visible; compuesto enlaza a la parte inválida; al corregir el enlace sale; radio requerido con `aria-invalid` y `describedby` en el `fieldset`; «Cambios sin guardar» en `role="status"`; borrador sin validar.
- Opcional «Agregar»: sin agregar no se envía; foco al título; campos activos; «Quitar» devuelve el foco.
- Densidad 36→27px; táctil ≥ 44px en `compact`; marcas «obligatorios» (asterisco + frase, sin «opcional»); encabezado al lado con la rejilla re-medida.
- Condicionales: control quieto (Δ 0px), altura y opacidad intermedias a mitad de la transición, `overflow` visible al terminar; anidadas (persona activa, CURP/razón fuera); Moral/Física; «No» saca los datos fiscales del envío y del foco; volver a «Sí» conserva lo elegido.
- Pie fijo: 29 focos por Tab sin ninguno tapado; también sin el respaldo JS.
- Largo: resumen con foco (17 errores), estado por sección en texto, enlace a campo en sección colapsada la abre; *scroll-spy* (sección visible y última al final); clic en la navegación desplaza, marca y enfoca; `<nav>` con nombre; a 640px la navegación se oculta.
- Solo lectura vs deshabilitado: enfocable vs saltado; `FormData` con `folio, alta, estado, activo, tipo-ro, obs` y sin los deshabilitados; opacidad 1 vs atenuado; casilla de solo lectura no cambia; texto seleccionable.
- Autosave: Guardando…/Guardado en `status`; error revierte y ofrece Reintentar.
- Dialog: rejilla de 6 columnas en la inset; `form=` en el envío; Esc con cambios → confirmación con foco en «Seguir editando»; sin resumen → foco al primer inválido; guardar cierra y devuelve el foco. Drawer: una columna y pie visible; Esc sin cambios cierra.
- 320px: sin desborde de página ni de cajas; País \| Número en una fila; dialog como hoja inferior. Movimiento reducido: aparición con duración 0s.

## 15. Hallazgos para lima

Los valores son de coco; aquí solo necesidades.

| # | Hallazgo | Sev. | Propuesta |
| --- | --- | --- | --- |
| 1 | **API `GForm`** | Alta | Props: `errors` (Object `name → string`), `validateOn` (`blur` \| `submit`), `marks` (`required` \| `optional`), `density` (compartida), `readonly`, `disabled`, `guard` (Boolean, `beforeunload` con `dirty`), `dirty` (`v-model:dirty`), `labels` (sin valores por defecto: `optional`, `required`, `requiredHint`, `summaryTitle` con `{count}`, `unsaved`, `saved`…). Eventos (en `emits`): `submit` (`{ event, data: FormData }`, solo si no hay `errors` visibles), `invalid` (`{ errors }`), `update:dirty`. Métodos expuestos: `showErrors()`, `reset()`, `focusFirstError()`. Slot por defecto. Sin `action`/`fetch` |
| 2 | **Contexto y `useFormField(name)`** | Alta | `InjectionKey` exportada. Devuelve `{ id, describedBy, error, showError, mark, density, block, onBlur, register }`. Regla: la prop explícita gana; sin `GForm`, valores neutros. Lima define qué props de cada campo cambian de default dentro de `GForm` (`block` → `true`) |
| 3 | **`block` en la rejilla** | Alta | Dentro de `GFormGrid` los campos llenan su celda vía contexto (no con CSS de la rejilla sobre `.g-input`, que rompería «cada componente estiliza lo suyo»). Afecta a `GInput`, `GTextarea`, `GSelect`, `GDatePicker` |
| 4 | **Orden de manejadores** (lección de CLAUDE.md) | Alta | Si el contexto añade `onBlur`/`onInput` a campos con `inheritAttrs:false`, va **primero** con `mergeProps({ onX }, attrs)`; prueba de orden como en `GInput`/`GCheckbox` |
| 5 | **Rejilla** | Alta | `GFormGrid` (`stack` Boolean; tramo expuesto como `data-tier` y clase `g-form-grid--{wide\|medium\|narrow}`); clases públicas `g-form-w-{xs\|sm\|md\|lg\|full}`, `g-form-break`, `g-form-row`. Umbrales `space × 176` / `× 104`, máximos estrechos `× 30` / `× 48`, encabezado al lado `× 200`, navegación `× 190`: **constantes de diseño** derivadas de `space` (como #130), sin token. Aviso en desarrollo si un hijo usa `order` o la rejilla `dense` |
| 6 | **Anuncios al enviar** | Alta | Los campos deben poder **silenciar** su región de error cuando el error aparece por un envío (el resumen lo anuncia). Mecanismo propuesto: el contexto expone `submitting` y el campo pone `aria-live="off"` en esa actualización. Toca `GInput`, `GTextarea`, `GSelect`, `GCheckbox(Group)`, `GSwitch`, `GDatePicker` |
| 7 | **Estados `warning` y `valid`** | Media | Los campos solo tienen `error`. Proponer `warning` y `valid` (texto) con el mismo hueco de mensaje y sin `aria-invalid`; o un `message` con `{ type, text }`. Lima decide nombre; precedente `GStepper` `status: warning` |
| 8 | **Marca «opcional»** | Media | Hoy solo existe la marca `*` (`aria-hidden`) con `required`. Añadir la marca de opcional **visible y en el nombre accesible** («Segundo apellido (opcional)»), texto de `labels.optional`, decidida por `marks` del contexto (o prop `optional` del campo) |
| 9 | **Prefijo/sufijo de texto** | Media | `prepend`/`append` de `GInput` son iconos decorativos `aria-hidden`; una unidad (`kg`, `%`, `$`) es **información**: necesita texto visible + texto accesible enlazado por `aria-describedby`. Para `GNumberField` (Fase 2) y quizá `GInput` |
| 10 | **`GErrorSummary`** | Alta | Props `errors` (`[{ field, message }]` o desde el contexto), `headingLevel`, `labels.title` con `{count}`. Estructura del precedente #78 (`tabindex=-1` + `role="alert"` interior + foco al aparecer). Evento `navigate` (`{ field, preventDefault }`) para que la app cambie de pestaña/paso antes del foco; por defecto abre colapsables, enfoca y desplaza a la etiqueta. Candidato a que `GWidgetConfig` lo componga más adelante |
| 11 | **`GFormSection`** | Alta | `title`, `description`, `headingLevel`, `optional` (insignia `GBadge` con texto), `mode` (`static` \| `collapsible` \| `addable`), `open`/`v-model:open`, `added`/`v-model:added`, `headerPlacement` (`top` \| `auto`), `labels` (`add`, `remove`, `optional`); slots `actions`, `help`, `default`. Sin `aria-labelledby` en `<section>` (§3.2) |
| 12 | **Alineación de cajas** | Media (coco) | `g-form-row` con *subgrid* (verificado en Chromium). Para la rejilla general, coco decide si vale la pena subgrid para campos `div` sabiendo que los `fieldset` no pueden participar; si no, regla de contenido |
| 13 | **`GFormReveal`** | Alta | `when` (Boolean), `exclude` (Boolean, por defecto `true`: fuera del envío/validación al ocultarse), `keepValues` (por defecto `true`), `indent` (barra de condicional). Transición con tokens de duración/curva existentes y `prefers-reduced-motion` |
| 14 | **`GFormActions`** | Media | `sticky`, `align` (`end` por defecto), slot `status` y prop `status`; publica la altura como propiedad pública de solo lectura (`--g-form-footer-size`, como `--g-surface-padding` #131) para el `scroll-margin` de los campos; aviso con más de una primaria |
| 15 | **`GFormNav`** | Media | `for` (formulario) o `items` (`{ id, label, status?, errorCount? }`), `label` obligatorio (nombre del `<nav>`), `labels` (`complete`, `incomplete`, `errors` con `{count}`), `offset` del *scroll-spy*; `aria-current="location"`; foco al título. **No** reutiliza `GSidebar` (§1.8) |
| 16 | **`GRadioGroup`** | Alta (Fase 2) | `modelValue`, `options` o hijos `GRadio`, `appearance` (`list` `inline` `segmented` `chips` `cards`), `label`/`legend`, `hint`, `error`, `required`, `readonly` (`role="radiogroup"` + `aria-readonly`), `disabled`, `density`, `size`, `name`. Radios nativos (flechas y formulario del navegador). Segmentado degrada a ancho completo en estrecho; > 6 opciones en segmentado → aviso. Relación con `GCard selectType="radio"` (#124) a documentar |
| 17 | **`GNumberField`** | Alta (Fase 2) | `modelValue` Number \| null, `min` `max` `step` `precision`, `locale`, `prefix`/`suffix` + textos accesibles, `stepper` (botones −/+, `labels.increment`/`decrement`), resto como `GInput`. Ver §12 |
| 18 | **Tokens** | Media | Reutilizar `space`, `density`, `--g-color-border-control`, `danger-text`, `warning-text`, `text-muted`, `surface-sunken` (solo lectura), duraciones/curvas, radios. **Posibles nuevos (sin valores):** separación entre campos de la rejilla (fila/columna), separación entre secciones, ancho de la navegación de secciones, color/grosor de la barra de condicional, fondo y borde del **solo lectura** distinto del deshabilitado (hoy `GSwitch` usa `surface-sunken`; unificar en todos los campos), estilo de borde de advertencia. Lima decide si son tokens o constantes derivadas de `space` |
| 19 | **Iconos** | Baja | Existentes: `circle-alert`, `triangle-alert`, `circle-check`, `circle`, `chevron-right`/`down`, `plus`, `pencil`, `loader-circle`, `circle-help`, `x`, `check`. Para Fase 2: `minus`/`plus` del *stepper* numérico (ya en la lista) |
| 20 | **Solo lectura homogéneo** | Media | Hoy cada campo lo resuelve distinto (`readonly` nativo, `aria-readonly`); visualmente debe ser **uno**: contraste completo, sin atenuación, distinguible de deshabilitado sin color (fondo + borde discontinuo en el prototipo). `GForm readonly` como «modo vista» del formulario entero |

## 16. Qué NO verifiqué

- **Lector de pantalla real** (VoiceOver, NVDA, TalkBack): resumen con `alert` + foco (¿doble lectura?), silencio de regiones al enviar, descripción de unidades, `aria-current="location"`, condicionales sin anuncio, confirmación de descartar en el pie del dialog.
- **Firefox y WebKit** (subgrid, `inert`, `grid-template-rows` animado, `scroll-margin` al enfocar, `cancel` de `<dialog>` repetido).
- **Componentes reales**: el prototipo imita `GInput`/`GSelect`/`GDatePicker`/`GDialog`/`GHelper` (el selector es nativo; la fecha es texto). La integración por contexto (hallazgos 2–4, 6) está sin construir.
- **Táctil real**, teclado virtual tapando campos en móvil, zoom 200%/400% (reflow 1.4.10), `forced-colors`, `prefers-contrast`.
- **`beforeunload`** (implementado, no ejecutado en la prueba) y guardias de router.
- `GStepper`/`GTabs` con errores por paso/pestaña (descrito, no prototipado aquí; precedente `GWidgetConfig`).
- RTL; autocompletado del navegador sobre los compuestos (país + número).
- Rendimiento con decenas de secciones y cientos de campos (registro y *scroll-spy*).
- «Copiar dirección de…» (3.3.7) y paso de confirmación (3.3.4): solo descritos.

## 17. Preguntas de producto realmente abiertas

1. **Convención de marcas por defecto** de `GForm` cuando el consumidor no la indica: ¿«marcar opcionales» (GOV.UK, recomendada: la mayoría de formularios administrativos son casi todo obligatorio) o «asterisco en obligatorios» (lo que hoy dibuja `GInput` con `required`)? Es identidad del sistema; ambas se soportan, nunca mezcladas.
2. **Alcance de la Fase 2**: ¿`GNumberField` incluye moneda desde el inicio (formato con `Intl` mientras se escribe) o la moneda va a su propia ronda como propone §12? Recomendación: diferir moneda.
3. **Orden de las acciones**: ¿primaria al final a la derecha (macOS/Material, propuesta) o primaria primero a la izquierda (GOV.UK, Windows)? Afecta a todos los pies (dialog incluido); la regla de DOM = visual se mantiene en cualquier caso.

Sin pregunta (derivan de un estándar o de un contrato vigente): `GForm` no valida reglas; validación al salir/«premiar pronto»; resumen con foco y `alert` (#78, GOV.UK); secciones sin *landmark*; condicionales fuera del envío; pie fijo con 2.4.11; `GFormNav` separado de `GSidebar`; densidad compartida (#114); orden DOM = visual; `type="text"` + `inputmode` para números.
