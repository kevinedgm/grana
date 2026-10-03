# Declaración de cumplimiento · GFormReveal · r01

**Estado:** en revisión. **Fuente de verdad:** `brief.md` de esta ronda y lo ya decidido en `design/lab/form/r01/` (§1 pieza 6, §4, §11).
**Ruta:** R1 (componente nuevo dentro de un sistema existente) · **Fidelidad:** F2 · **Material:** componentes reales de `packages/vue/dist/` + `XFormReveal` de prototipo con valores de wireframe (gris, 3px, 16px, 240ms: **no** son propuesta de estilo).
**Siguiente dueño:** lima → contrato (sección nueva de `design/contracts/form.md`) y cambios en `GForm`/`useFormField` (§8).
**Prototipo:** `index.html`. **Verificación:** `node design/lab/form-reveal/r01/verificar.mjs` → **121/121** (Chromium 41, Firefox 40, WebKit 40), consola limpia.
**Convención:** «propuesta kiwi» = recomendación derivada de un estándar o de una decisión vigente; se cita el criterio.

## 1. Qué es y qué no

1. **Bloque de campos que existe solo si una respuesta lo pide.** La respuesta decide (no un botón): mientras no aplica, sus campos **no forman parte del formulario** (ni `FormData`, ni Tab, ni validación nativa, ni errores, ni resumen) pero **conservan lo escrito** (WCAG 3.3.7).
2. **Frontera** (sin duplicar, `brief.md` «Componentes que se solapan»): `GFormSection collapsible` = lo abre el usuario y sus datos siguen contando; `addable` = el usuario decide incluir; `disabled` = el dato existe pero no se puede tocar ahora (alternativa «mostrar todo y deshabilitar», **rechazada**); `GFieldGroup` = una pregunta compuesta.

## 2. Anatomía

```html
<!-- inmediatamente después de la pregunta, hermano suyo en la misma pila -->
<div class="g-form-reveal is-open is-ready" id="…" style="--_reveal-gap: 20px">         <!-- cerrado: inert, sin is-open -->
  <fieldset class="g-form-reveal__body" role="none">                                    <!-- cerrado: disabled -->
    <!-- slot por defecto: campos, GFormRow, GFieldGroup, GInputGroup, casillas, GFormReveal anidados -->
  </fieldset>
</div>
```

3. **Raíz `<div>` sin rol.** Lleva `id`, `class` y los atributos del consumidor (`inheritAttrs` normal). Es una **rejilla de una pista** (`grid-template-rows: 0fr → 1fr`): es quien anima y quien recibe `inert`.
4. **Cuerpo `<fieldset role="none">`, `disabled` mientras está cerrado.** Es el único mecanismo **nativo** que saca de `FormData` y de la validación de restricciones a **todos** los controles descendientes, también los del consumidor y los `<input hidden>` de `GSelect`, sin tocar cada campo; se hereda solo en anidados (HTML, «fieldset disabled»). Verificado: cerrado, `FormData` sin `persona`, `curp`, `rfc`, `razon`, `cp`, `correo` y **0** controles `:invalid` dentro; abierto, vuelven. `inert` solo no basta: un control `inert` **sí** entra en `FormData`. `role="none"`: un `fieldset` sin nombre se expone como grupo vacío; verificado que el árbol (instantánea de Playwright) no añade ningún `group`. No es «mostrar y deshabilitar»: el `disabled` vive en un bloque que además es `inert`, invisible y sin altura.
5. **Sin nombre propio (sin `label`).** Los campos se nombran solos y el bloque viene justo después de la pregunta en el orden de lectura (patrón GOV.UK *conditional reveal*). Si las partes forman **una pregunta** con título, eso es un `GFieldGroup` dentro del bloque; si el bloque merece título de sección, la sección es la que contiene la pregunta (punto 10).
6. **Contenido apilado como `GFormLayout`:** el cuerpo separa sus hijos con `--g-form-gap` × densidad (las filas del bloque se ven como las del resto del formulario). Los campos dentro siguen recibiendo el contexto de `GForm` y de su `GFormLayout` ancestro (densidad, `block`, `readonly`, `disabled`, marcas).
7. **Señal de pertenencia: barra al inicio + sangría** (propuesta kiwi, ya anunciada en r01 §4; GOV.UK). Dice «esto depende de la respuesta de arriba» sin texto; ayuda sobre todo a quien no lee el orden con facilidad (WCAG 1.3.1 como refuerzo visual de una relación que ya da el orden, 1.3.2). Reglas: la barra se alinea con el **borde de inicio de la pregunta** (no con el centro del primer radio: `inline` y `segmented` no tienen una columna de círculos); **solo cambia el borde de inicio**, el de fin sigue siendo el de todas las filas (#171); cada nivel anidado añade su barra; es un **borde** (no sombra ni fondo) para que sobreviva a `forced-colors` (verificado con emulación en Chromium); propiedades lógicas (RTL: barra a la derecha, verificado). Grosor, color y sangría son de coco. **Una sola convención:** sin prop `indent`.

## 3. Colocación

8. **Inmediatamente después de la pregunta que lo condiciona**, como hermano en la misma pila (`GFormLayout`, cuerpo de otro `GFormReveal`, cuerpo de `GFormSection`). Varios bloques excluyentes de la misma pregunta van seguidos (Física → CURP; Moral → razón social y representante): el cerrado no ocupa nada (punto 25).
9. **Nunca dentro de una `GFormRow`** (propuesta kiwi, medida): la fila reparte ancho a cada hijo, así que un bloque **cerrado** ya reserva una columna vacía (447 de 910px junto a un segmentado de 447px: un hueco, contra #171) y al abrir cambia el reparto de la línea del disparador. Un bloque **ocupa su propia fila y contiene filas**. El caso «Otro → Especifique» va debajo, no al lado. Aviso de desarrollo.
10. **«Sí → sección de datos fiscales»:** la sección contiene la pregunta al principio y el bloque después («Facturación» › «¿Requiere factura?» › bloque). **No** se admite `GFormSection` dentro de un bloque (aviso): un `hN` del mismo nivel que la sección de la pregunta, metido en un bloque sangrado, contradice la jerarquía visual (1.3.1).
11. **Avisos de desarrollo** (propuesta para lima): (a) dentro de una `GFormRow`; (b) sin hermano anterior (no puede ir justo después de su pregunta); (c) `GFormSection` dentro de un bloque. Ninguno cambia el comportamiento.

## 4. Relación con el disparador, anuncio y foco

12. **Sin vínculo ARIA con el disparador.** `aria-expanded` no está admitido en `role="radio"` (ARIA 1.2) y los radios nativos de `GRadioGroup` no lo llevan; en una casilla está admitido pero hace que suene como un botón de divulgación («contraído»), que no es lo que es. `aria-controls` tiene poco soporte y exigiría que el bloque conozca a su disparador. El bloque **no sabe quién lo dispara** (no hay prop `for`): la aplicación calcula `when` (L1).
13. **Sin región viva.** Con radios, las flechas **eligen al moverse**: Física ↔ Moral abriría y cerraría bloques en cada pulsación; una región viva anunciaría cada cambio (N pulsaciones = N anuncios frente a 0). El contenido nuevo es **lo siguiente** en el orden de lectura y de Tab (verificado: Tab desde la pregunta entra en el bloque abierto y salta el cerrado, en los tres motores). Guía de contenido (para mora-docs): si conviene adelantarlo, la descripción de la opción lo dice («Te pediremos tus datos fiscales»).
14. **El foco no se mueve al abrir** y no hay prop para moverlo: cambiar el foco al elegir es un cambio de contexto (WCAG 3.2.2) y con radios rompería la navegación con flechas. **Al cerrar con el foco dentro** (solo pasa por programa: la pregunta va antes del bloque), el foco va al **control anterior** en orden del documento —la pregunta, y en un grupo de radios la opción elegida— y nunca queda en `<body>` (2.4.3). Verificado en los tres motores.
15. **Sin desplazamiento automático.** Si el bloque se abre por debajo del pliegue, el usuario llega con Tab o con la rueda (el navegador desplaza al enfocar). Verificado: Δscroll 0 al abrir y cerrar con la pregunta en el centro de la vista.

## 5. Datos, errores y envío (con `GForm`)

16. **Activo = `when` y todos sus bloques ancestros activos.** Un anidado conserva su propio estado visual dentro de un padre cerrado, pero está inactivo (verificado: Moral «abierto» e inactivo con «No»).
17. **Los campos de un bloque inactivo siguen registrados, marcados «inactivos»** (cambio en `GForm`, §8): no bloquean el envío, no van en `invalid`, no aparecen en el resumen, `submit` y `showErrors()` no los revelan, y **sus claves de `errors` no se tratan como errores generales**. Esto último es crítico: si el bloque los desregistrara, `GForm` (hoy) listaría `errors.curp` como error general sin enlace y **bloquearía** el envío. Así la aplicación puede calcular `errors` **sin condiciones** (verificado: el prototipo pone CURP, RFC y razón social siempre en sus reglas y el bloque cerrado hace que no cuenten).
18. **Cerrar con errores visibles:** salen **en silencio** del resumen (como al corregirse, #162) y, si no queda ninguno, el resumen se oculta (verificado). Los mensajes en línea se van con el bloque.
19. **Al cerrar, sus campos vuelven a «sin editar, sin revelar»** (el valor se conserva). Al reabrir, un error reaparece por las reglas de siempre (salir habiendo escrito, cambio en un control de elección, envío). Motivo: «castigar tarde» (#157); con flechas un bloque se abre y cierra de paso y no debe volver «en rojo» sin que el usuario haga nada; coincide con «al quitar se limpian sus errores» de `addable` (form r01 §4). Verificado: reabrir no muestra el error de la CURP; el siguiente envío sí.
20. **Enviar con el bloque cerrado:** `submit` sin sus campos (verificado `FormData`). **`required`** dentro de un bloque cerrado: el campo conserva `required` y su marca, pero el `fieldset` deshabilitado lo saca de la validación nativa y `inert` + `visibility: hidden` lo sacan del árbol; `GForm` no lo cuenta (punto 17).
21. **Conserva lo escrito:** el bloque **nunca desmonta** su contenido (ni `v-if` ni montaje diferido): los valores del modelo no se tocan (son de la aplicación) y los de controles no controlados siguen en el DOM; también el estado de los anidados (verificado: RFC, razón social, CURP y la opción «Moral» intactos tras «No» → «Sí»). Montado también significa que `GFormRow` y el segmentado de `GRadioGroup` siguen midiendo su ancho mientras está cerrado (punto 24).
22. **La aplicación que envía su modelo** (y no `FormData`) recibe también los valores conservados de bloques cerrados. Es su modelo; Grana no lo limpia. Para ayudarla sin duplicar `when`, ver hallazgo L6.
23. **`readonly` / `disabled` de `GForm`:** pasan por el bloque a sus campos como siempre; el bloque no tiene esos estados (sigue a `when`; con `readonly` la pregunta no cambia, así que el bloque tampoco). **Fuera de `GForm`:** funciona igual (inert, fieldset, transición); solo falta la parte del registro.

## 6. Transición (sin saltos)

24. **Altura con `grid-template-rows: 0fr → 1fr` en la raíz**, sin medir alturas en JS; el cuerpo lleva `min-block-size: 0` y `overflow: hidden` mientras anima. Funciona en los tres motores; `interpolate-size`/`calc-size()` solo existen en Chromium (medido: Firefox y WebKit `false`), así que no sirven de base (en `GSidebar` el submenú simplemente no anima fuera de Chromium). **Cerrado en reposo = `visibility: hidden`, no `display: none`:** el bloque sigue en el layout con altura 0, así los anidados (`GFormRow`, segmentado) **siguen midiendo** y al abrir no se reparten de nuevo a mitad de la animación; tampoco hace falta `display … allow-discrete` ni `@starting-style` (el patrón de `GDialog` resuelve otro problema: entrar y salir de la capa superior).
25. **Compensación de la separación del contenedor:** cerrado, la raíz lleva `margin-block-start` = −separación de su contenedor, y anima a 0 con la altura. Un bloque cerrado no deja hueco (verificado: pregunta → siguiente campo = una separación, 20px, con el bloque en medio) y al abrir el contenido de abajo baja de forma continua `p × (altura + separación)`. La separación se **lee del padre** (`row-gap` calculado) y se escribe como variable dinámica en línea `--_reveal-gap` (precedente: `GFormRow` escribe `--_form-row-*`, #173): al montar, en cada cambio de `when` y cuando el padre cambia de tamaño. No mide alturas. Alternativa para lima/coco: que `GFormLayout`, `GForm` y `GFormSection` publiquen su separación; se descarta como base porque un contenedor del consumidor no la publicaría.
26. **Opacidad:** al abrir, fundido que termina con la altura (empieza con retraso); al cerrar, fundido corto desde el principio. `visibility` pasa a `hidden` solo al final.
27. **Fases y clases:** `is-open` cambia **en el momento** de `when` (cerrado → abriendo → abierto → cerrando → cerrado); `inert` y `disabled` se **quitan al empezar a abrir** (Tab llega ya, verificado a la mitad sin `inert`) y se **ponen al empezar a cerrar**; `is-animating` mientras dura (cuerpo recortado) y, al asentarse, `overflow: visible` para no recortar anillos de foco ni sombras (verificado). Asentado = `transitionend` de `grid-template-rows` en la raíz, con temporizador de respaldo (una transición de 0s no emite el evento: caso de movimiento reducido).
28. **Interrupción:** cambiar `when` a mitad de camino revierte desde la altura actual (verificado: congelado al 10 % del cierre, 228.7px → la nueva transición parte de 228.7px). **Sin animar al montar** (`is-ready` tras el primer pintado, plan 012; verificado 0 transiciones al cargar) ni al reabrir un padre cuyo anidado ya estaba abierto (verificado 0).
29. **Movimiento reducido** (plan 007: menos y más suave, no cero): altura y margen cambian **en un cuadro**, el **fundido se conserva** al abrir y al cerrar, y al cerrar el bloque sigue visible hasta que acaba el fundido (el defecto que tuvo el submenú de `GSidebar`). Verificado: sin transición de altura ni margen, con opacidad; altura final en el mismo cuadro; a mitad del cierre visible, opacidad 0.5 e `inert`.

**Medido en los tres motores:** disparador Δ 0px (arriba e inicio) en cada cuadro durante abrir y cerrar (40 a 44 cuadros), en LTR y RTL; Δscroll 0; a la mitad, altura y opacidad intermedias.

## 7. Estados

| Estado | Raíz | Cuerpo | Campos | Árbol / Tab / `FormData` |
| --- | --- | --- | --- | --- |
| Cerrado | sin `is-open`, `inert`, `visibility: hidden`, altura 0, margen −separación | `disabled`, recortado | inactivos en `GForm` | fuera / fuera / fuera |
| Abriendo | `is-open is-animating`, sin `inert` | habilitado, recortado | activos | dentro / dentro / dentro |
| Abierto | `is-open`, `overflow` visible | habilitado | activos | dentro |
| Cerrando | sin `is-open`, `is-animating`, `inert` | `disabled`, recortado | inactivos, estado revelado limpio | fuera (se ve fundirse) |
| Anidado con padre cerrado | conserva su estado visual | — | inactivos | fuera (por el padre) |
| Con error visible dentro | igual | — | al cerrar, sale del resumen en silencio; al reabrir, sin revelar | — |
| `GForm readonly` / `disabled` | igual | — | heredan del contexto | `disabled`: fuera de `FormData` como siempre |
| Movimiento reducido | altura y margen en un cuadro, fundido | — | — | — |
| RTL | barra y sangría al otro lado (lógicas) | — | — | — |
| `forced-colors` | barra = borde, visible | — | — | — |
| Estrecho (320) | sin desborde con dos niveles abiertos (verificado) | — | — | — |

## 8. Hallazgos para lima

| # | Hallazgo | Propuesta |
| --- | --- | --- |
| L1 | **API mínima: solo `when`** (Boolean, `false`) | La aplicación ya tiene el modelo de la pregunta: `:when="factura === 'si'"`, `:when="persona === 'moral'"`. `v-model` + `is`/`equals` duplicaría la comparación y pediría pronto `in`, negación y combinaciones (lógica de la aplicación, AGENTS.md). Slot por defecto. **Sin eventos:** la aplicación ya sabe cuándo cambia `when`; quien necesite el final de la animación tiene `transitionend` nativo. |
| L2 | **Reserva de `form.md` («Fases siguientes», fila 3): `exclude`, `keepValues`, `indent` no entran** | `exclude` siempre (un campo oculto que se envía es un error); `keepValues` siempre (el bloque no toca valores, 3.3.7; limpiar es de la aplicación); `indent` una sola convención (punto 7). Tampoco `label` (punto 5) ni `focus` (punto 14). |
| L3 | **Registro «inactivo» en `GForm`** (contexto + `useFormField`) | `GFormReveal` provee una clave propia (p. ej. `revealKey`) con `active`; `useFormField` añade al registro `inactive()`. `GForm`: (a) `blocking()`, `focusFirstError()`, `revealAll()` y el resumen saltan los inactivos; (b) sus nombres **siguen cubiertos** (no son errores generales); (c) al pasar a inactivo, borra sus nombres de `edited`, `shownErr`, `shownWarn` (punto 19); (d) `visible()`/`isShown()` devuelven vacío para un inactivo. El prototipo lo hace con un contexto intermedio (`index.html`, `XFormReveal`): sirve de referencia para bruno, no de implementación (no intercepta `showErrors()`). |
| L4 | **Estructura y clases** | `g-form-reveal` (raíz `div`), `g-form-reveal__body` (`fieldset role="none"`), `is-open`, `is-animating`, `is-ready`; variable dinámica en línea `--_reveal-gap`. Atributos del consumidor a la raíz. |
| L5 | **Avisos de desarrollo** (`[Grana GFormReveal]`) | Punto 11 (a) a (c). |
| L6 | **Nombres inactivos para quien envía su modelo** (opcional, no bloquea) | Añadir al payload de `submit` de `GForm` la lista `inactive` (nombres de campos registrados e inactivos) o un método `isActive(name)`, para filtrar el modelo sin repetir las condiciones de `when`. |
| L7 | **Tokens** | La barra y la sangría pueden salir de tokens existentes (`--g-border-width`, un color de borde, `--g-space-*`); duraciones y curvas de `--g-duration-*`/`--g-ease-*` (240ms = derivación `--_t-slow` de `GSidebar`; ver la propuesta de `--g-duration-slow` en `plans/README.md`). Lo decide coco con lima; kiwi no ve necesidad de un token nuevo. |
| L8 | **`GDialog` mueve el disparador cuando su contenido crece** (fuera de este componente; medido) | Centrado: el disparador sube **120px** al abrir un bloque de 240px (crece hacia los dos lados); como hoja inferior en 375px sube **240px**; anclado arriba (CSS de la página): **0px**. Afecta igual a errores que aparecen o a un `GTextarea autosize`. Propuesta para una ronda de `GDialog`: que un diálogo abierto crezca solo hacia abajo (fijar su borde superior al abrir) y la hoja conserve su borde superior mientras quepa. |
| L9 | **Menor, para el dueño de `GRadioGroup`** | En un contenedor `dir="rtl"` la etiqueta del grupo con texto en español sale «?Requiere factura¿»: las etiquetas de opción llevan `dir="auto"` (#269) y la del grupo no. Con texto realmente RTL no se nota; anotar si conviene `dir="auto"` también en `g-radio-group__label`. |

## 9. Preguntas de producto abiertas

**Ninguna para `GFormReveal`.** Todo deriva de lo ya decidido en form r01 (bloque tras la pregunta, `inert` y fuera del envío, conservar, sin saltos, barra con sangría) o de estándares (WCAG 3.2.2, 3.3.7, 2.4.3, 1.3.1/1.3.2; ARIA 1.2; HTML `fieldset disabled`). L8 (`GDialog`) cambia el comportamiento de otro componente y pide su propia ronda; si lima no puede derivarlo del principio «sin saltos», entonces sí sería pregunta al usuario.

## 10. Comprobaciones

**Hechas** (`verificar.mjs`, Playwright 1.63, Chromium, Firefox y WebKit, 121/121): sin transición al cargar; cerrado `inert` + `fieldset disabled` + invisible + altura 0; sin hueco (una separación); 0 `:invalid` dentro cerrado y > 0 abierto; `FormData` según la respuesta (cerrado, Física, Moral, «No» con anidados); Tab salta el bloque cerrado y entra en el abierto (WebKit entre campos de texto); árbol accesible (instantánea de Playwright) sin el bloque cerrado y sin grupo vacío; Δ 0 del disparador y Δscroll 0 al abrir y cerrar (LTR y RTL); altura y opacidad intermedias a la mitad, recortado y ya sin `inert`; asentado con `overflow` visible; conserva valores y opción elegida, también en anidados, sin animar el anidado; foco al control anterior al cerrar por programa; resumen con enlace a la CURP → «No» lo vacía y oculta → `submit` sin los campos → reabrir sin errores visibles → nuevo envío los revela; interrupción sin salto; 320 sin desborde con dos niveles; barra y sangría a la derecha en RTL; movimiento reducido (sin altura ni margen, fundido al abrir y al cerrar, Δ 0); `forced-colors` emulado (solo Chromium): barra visible; contraejemplo de `GFormRow` y medidas de `GDialog` (notas).

**No hechas:** lector de pantalla real (VoiceOver, NVDA): qué se oye al elegir «Sí» y al tabular al bloque, y que `fieldset role="none"` no se anuncie como grupo (solo la instantánea de Playwright, que no es el árbol del navegador); Safari, iOS y táctil reales; `forced-colors` real y en Firefox/WebKit; `showErrors()` con bloques cerrados (el prototipo no puede interceptarlo); `GSelect`, `GDatePicker` y `GCheckboxGroup` dentro de un bloque (la exclusión de su `<input hidden>` es la nativa del `fieldset`, no se probó con ellos); cerrar un bloque grande con la página desplazada hasta el final (el navegador recorta el desplazamiento y lo de arriba baja; no medido); rendimiento con muchos bloques; el componente real (esto es un prototipo).
