# Declaración — `GCombobox`, r01: base funcional

> kiwi, 2026-10-04. Prototipo: `index.html` (motor `combo.js`, kit `combo.css`). Verificación: `verificar.mjs`, **315/315** en Chromium, Firefox y WebKit (105 por motor). La forma (identidad) se decide en `../r02/`; aquí todo deriva de APG, WCAG 2.2 y los contratos vigentes, y **no hay preguntas de producto**.

## Anatomía

```
raíz (la de GInput, clase g-combobox)                     ← compone GInput como GNumberField (#309)
├─ label · for → input
├─ caja (g-input__control)
│  ├─ prefijo decorativo (slot prepend: lupa, o icono del dominio)
│  ├─ <input type="text" role="combobox" aria-autocomplete="list" aria-haspopup="listbox"
│  │         aria-expanded aria-controls="ID-list" aria-activedescendant autocomplete="off">
│  ├─ indicador de carga (el de GInput)
│  ├─ botón «Limpiar {etiqueta}» (clearable, con valor)
│  ├─ flecha decorativa (aria-hidden; con puntero abre y cierra)
│  └─ <input type="hidden" name> con el value de la opción (solo con name)
├─ pie (ayuda, mensaje) de GInput
└─ panel en la capa superior (popover="manual")
   ├─ estado: pista de mínimo · «Buscando…» · «Sin resultados para «x»» · error de carga   (fuera del listbox)
   └─ <ul role="listbox" aria-labelledby="ID-label" aria-busy>
      ├─ <li role="presentation"><ul role="group" aria-labelledby> … opciones … </ul></li>
      ├─ <li role="option" aria-selected> avatar o código · etiqueta con <mark> · descripción · check </li>
      └─ filas de acción (role="option", aria-selected="false", siempre al final, #57):
         «Reintentar» | «Mostrar más (20 de 1 240)» · «Usar «texto» como texto libre» · «Agregar «texto»…»
```

En visor ≤ 520px el panel es una **hoja modal anclada arriba** con su propio campo de búsqueda (punto 21).

## Decisiones

**Semántica y foco**

1. **Patrón APG *Combobox with list autocomplete*.** `<input type="text" role="combobox">` con `aria-autocomplete="list"`, `aria-haspopup="listbox"`, `aria-expanded`, `aria-controls` y `aria-activedescendant`. El foco real **nunca** sale del campo mientras la lista está abierta; las opciones no llevan manejadores de teclado ni `tabindex`. Medido: `aria-controls` y `aria-activedescendant` apuntan siempre a elementos que existen.
2. **Compone `GInput`** (como `GNumberField`, #309): etiqueta, caja, pie, mensajes, marcas, `useFormField`, `is-rejected`/`is-ready`, tres pistas de `GFormRow` y solo lectura se heredan. El prototipo usa el `GInput` real de `dist/` pasando los atributos ARIA por `$attrs` y los controles por el slot interno `end`.
3. **Enfocar no abre.** Con el teclado, entrar al campo no despliega nada (recorrer un formulario con Tab no dispara paneles ni búsquedas). Abren: escribir, ↓, ↑, Alt+↓ y el clic en la caja.
4. **Al entrar con valor, el texto queda seleccionado**: lo siguiente que se teclea lo reemplaza. Igual tras elegir.

**Teclado**

| Tecla | Lista cerrada | Lista abierta |
| --- | --- | --- |
| Carácter | Abre y busca | Busca |
| ↓ / ↑ | Abre; activa la elegida, o la primera / la última | Siguiente / anterior habilitada; **no cicla**; salta encabezados y deshabilitadas; las filas de acción cuentan |
| Alt+↓ / Alt+↑ | Abre sin mover | Alt+↑ cierra |
| Av Pág / Re Pág | — | Diez adelante / atrás |
| Inicio / Fin / ← / → | Mueven el cursor del texto | Mueven el cursor del texto (son de edición, no de lista) |
| Intro | Nativo (envío implícito del formulario, como `GInput`) | Elige la activa y cierra; sin activa, nada (no envía). Sobre fila de acción, la ejecuta |
| Esc | Con texto sin confirmar: restaura el de la opción elegida. Si no, nativo | Cierra y conserva el texto; **no** cierra un `GDialog` |
| Tab | Sale; aplica el punto 9 | Cierra y sale; **no elige** (punto 6) |

5. **La primera opción queda activa sola al asentarse la búsqueda** (`autoHighlight`): escribir e Intro basta. Se activa **una vez por búsqueda asentada**, no por tecla, para no interrumpir el eco de escritura del lector. Por verificar con lector real (límite).
6. **Tab no elige.** Difiere de `GSelect` a propósito: allí la activa la puso la persona con flechas; aquí la puso el componente. En un formulario clínico, elegir un paciente por pasar de largo es un error grave (WCAG 3.2.2, sin cambios de contexto inesperados).
7. **Intro nunca elige un resultado obsoleto.** Mientras hay una búsqueda pendiente (antirrebote o `loading`) y la activa es la resaltada sola, Intro espera. Medido con tiempos reales: «mar» → «mari» + Intro inmediato no elige.

**Valor y texto**

8. **El modelo es el `value` de la opción**; el texto del campo es su `label`. El campo oculto con `name` envía el `value`. Elegir la ya elegida cierra sin emitir.
9. **Al salir del campo** (blur o Tab): texto vacío → borra el valor (`null`); texto que no corresponde a una opción elegida → **se descarta** y vuelve el de la opción; con `allowCustom` → el texto **es** el valor.
10. **Texto libre (`allowCustom`)**: además de quedarse al salir, la lista ofrece la fila «Usar «texto» como texto libre» al final (visible aunque haya coincidencias; se oculta si el texto es idéntico a una opción). El modelo pasa a ser el String tecleado.
11. **Agregar al catálogo (`createLabel` con `{text}`)**: fila «Agregar «texto»…», la última, `role="option"` con `aria-selected="false"`; Intro o clic cierran, dejan el foco en el campo y emiten `create` con el texto; **no** cambian el valor (la aplicación agrega y selecciona). Tab y Esc no crean. Es #57 con el texto tecleado.
12. **Opción elegida que no está en `options`** (búsqueda remota, valor inicial): el componente recuerda toda opción que haya visto y elegido; para el valor inicial, la aplicación pasa `selectedOption`. Medido: campo con valor inicial y `options` vacía pinta su etiqueta.
13. **`clearable`**: botón aparte en el orden de Tab, nombre «Limpiar {etiqueta}», ≥ 24px (44 táctil); borra, vacía y devuelve el foco al campo.

**Datos: sin `fetch`**

14. **El componente emite `search` con el texto** y la aplicación entrega `options`, `loading`, `total` y `loadError`. **Antirrebote propio** (`delay`, 250 ms; 0 lo desactiva): es comportamiento de escritura, no de datos, y evita que cada aplicación lo reimplemente mal. `minChars` (0 por defecto) retiene la emisión y muestra la pista «Escribe al menos N caracteres».
15. **Filtro local por defecto.** Sin `remote`, el componente filtra `options` (todas las palabras, sin acentos ni mayúsculas, sobre etiqueta, código y descripción). Con `remote`, no filtra: pinta lo que llega. `search` se emite en ambos.
16. **Antes de escribir** la lista muestra lo que la aplicación entregue (p. ej. un grupo «Recientes»); con `remote`, abrir emite `search('')`. Sin nada que mostrar, no hay panel.
17. **Cargando no vacía la lista**: los resultados anteriores siguen visibles y navegables, la lista lleva `aria-busy="true"` y el campo su indicador. Solo sin resultados previos se ve «Buscando…».
18. **Error de carga: en la lista, no en la isla ni en el `error` del campo.** Mensaje en el panel, anuncio educado y fila de acción «Reintentar» (re-emite `search`). No marca el campo como inválido: no es un error del valor. La isla (#327) es para condiciones de página o sistema; la aplicación puede publicarlo allí además si quiere.
19. **Más resultados: fila «Mostrar más (20 de 1 240)»**, no desplazamiento infinito: es predecible con teclado y lector. Intro la ejecuta, la lista sigue abierta y la activa pasa a la primera opción nueva. Remoto emite `more`; local amplía el tope.
20. **Rendimiento: tope de pintado, sin virtualizar.** Se pintan `limit` opciones (50) y la fila «Mostrar más»; el filtro local recorre todas. `aria-activedescendant` sobre una lista virtualizada es frágil (la opción activa puede no existir). Medido: abrir con 500 opciones tarda < 150 ms en los tres motores.

**Capa, colocación y móvil**

21. **Panel en la capa superior** (`popover="manual"`, colocado con `anchor.js`): debajo de la caja; encima si debajo quedan menos de 240px y hay más sitio arriba; ancho de la caja con mínimo de 320px, sin salir del visor; en RTL alineado al borde de inicio. Dentro de un `GDialog` funciona porque el panel es descendiente del diálogo. **Abrir no mueve nada** (Δ0 del campo, de la página y del alto del documento).
22. **Móvil (≤ 520px): hoja modal anclada arriba**, de ancho completo, con su propio `<input role="combobox">` arriba y la lista debajo (arriba para que el teclado virtual no la tape). El campo de la página queda como disparador (`aria-haspopup="dialog"`, `inputmode="none"`). Elegir o Esc cierran y devuelven el foco al campo. Opciones ≥ 44px. Misma estructura que usará el concepto B en escritorio.
23. **Anuncios** (`liveRegion.js`, educado, en la región del `<dialog>` modal abierto si lo hay): recuento al asentarse («20 de 1 240 resultados», «2 resultados», «1 resultado»), «Sin resultados para «x»» y el error de carga. Con retardo (600 ms) y un solo anuncio por búsqueda. No se anuncia «Buscando…» ni la elección (el valor del campo ya cambia).

**Opciones**

24. **Forma de `options`: la de `GSelect`** más campos opcionales `description`, `code` y lo que use el slot. Grupos `{ label, options }`, sin anidar, como `role="group"` con nombre. `disabled` por opción.
25. **Coincidencia marcada con `<mark>`**: peso y subrayado, no color (WCAG 1.4.1). Se marca también en el código y la descripción.
26. **Opción elegida**: `aria-selected="true"` solo en ella, más peso y check. **Opción activa**: fondo y contorno (como `GSelect`).
27. **Estados del campo**: `readonly` (#266) enfocable, legible, no abre, sin limpiar ni flecha, se envía; `disabled`; `error` de validación como `GInput`; `required` expuesto (pendiente: `aria-required` en vez de `required` nativo, #270, hallazgo L10).

## Estados medidos

Reposo vacío · reposo con valor · foco · pista de mínimo · cargando sin resultados · cargando con resultados anteriores · resultados con «Mostrar más» · sin resultados · error de carga con reintento · texto libre · fila de agregar · solo lectura · deshabilitado · error de validación · dentro de `GDialog` · hoja móvil (375 y 320) · RTL · reduced motion.

## Qué lo hace distinto

La forma se decide en r02. De comportamiento, la base ya se aparta del combobox genérico en tres reglas de seguridad pensadas para el caso clínico:

- **Tab no elige y Intro no elige resultados obsoletos** (puntos 6 y 7): nadie queda asignado al paciente equivocado por velocidad de tecleo o latencia.
- **La lista nunca parpadea a vacío** mientras busca (punto 17): quien teclea rápido no pierde de vista lo que ya tenía.
- **Texto libre y opción de catálogo son valores distintos y se nota** (puntos 10 y 11; r02 C lo hace visible en el campo).

## Comprobaciones hechas (Playwright, tres motores)

Semántica en reposo y abierta; foco por Tab sin abrir; antirrebote (a lo sumo una búsqueda por pausa); `minChars`; primera activa; `<mark>`; un solo anuncio de recuento; Δ0 (campo, página, alto del documento); capa superior y puntero; ↓ ↑ Av Pág sin ciclar; activa siempre a la vista sin desplazar la página; «Mostrar más»; Intro, Esc (dos niveles), Tab, vaciar y salir; limpiar; sin resultados; error y reintento; resultados anteriores durante la carga con `aria-busy`; Intro durante la carga; grupos; búsqueda por código y sin acentos; `aria-selected` único; texto libre; fila de agregar; `GFormRow` de tres en línea y sin huecos; `selectedOption`; solo lectura; deshabilitado; error; envío del `value`; dentro de `GDialog` (puntero, anuncio en el diálogo, Esc no lo cierra); 500 opciones (< 150 ms); hoja a 375 y 320 sin desbordamiento, opciones ≥ 44px, foco de vuelta; RTL; reduced motion; contraste ≥ 4.5 de opción activa, encabezado de grupo y código; consola limpia.

## No comprobado

- **Lector de pantalla real** (VoiceOver, NVDA, TalkBack): eco de escritura con la primera opción activa, lectura de las filas de acción como «opción N de N», `aria-activedescendant` en la hoja móvil, anuncio del recuento.
- **Teclado virtual real** sobre la hoja; IME y composición (`isComposing` se respeta, sin medir).
- `forced-colors`; zoom de texto al 200 %; pegado de texto largo.
- Cancelación de respuestas fuera de orden: es de la aplicación (el prototipo descarta por número de secuencia); el contrato debe decirlo.

## Hallazgos para lima

| # | Hallazgo | Recomendación |
| --- | --- | --- |
| L1 | Composición | `GCombobox` compone `GInput` (slots internos `field` y `end`, #309). Contrato propio `design/contracts/combobox.md`; entra en `form.md` como Fase 5 cerrada |
| L2 | Props de datos | `options` (forma de `GSelect` + `description`, `code`), `remote` (Boolean) o `filter` (`true` / `false` / función): elegir uno; `loading`, `total`, `loadError` (String), `selectedOption`, `minChars` (0), `delay` (250), `limit` (50) |
| L3 | Eventos | `update:modelValue`, `search` (String), `more`, `create` (String), `open`, `close`. «Reintentar» re-emite `search`; no hace falta `retry` |
| L4 | Texto libre | `allowCustom`: el modelo puede ser un String que no está en `options`. Decidir si se distingue en el envío (p. ej. evento `update:modelValue` con segundo argumento `{ custom: true }`) |
| L5 | Textos | Sin valores por defecto (#226): `labels` con `clear` (`{label}`), `loading`, `results` (`{count}`), `one`, `partial` (`{count}`, `{total}`), `empty` (`{text}`), `minChars` (`{n}`), `more`, `retry`, `custom` (`{text}`), `close`; `createLabel` con `{text}` |
| L6 | Tab no elige | Diferencia deliberada con `GSelect` (punto 6): registrar en `DECISIONS.md` |
| L7 | Intro con búsqueda pendiente | Punto 7: el componente necesita saber si los resultados corresponden al texto actual; con `remote` lo deduce de `loading` y de su antirrebote. Documentar que la aplicación debe poner `loading` en cuanto recibe `search` |
| L8 | Error de carga | En la lista (punto 18); `loadError` no es `error`. La isla queda a criterio de la aplicación |
| L9 | Slots | `option` (`{ option, active, selected, query }`), `lead` (avatar o icono de la opción), `prepend`; el contenido de `option` debe conservar el texto que distingue |
| L10 | `required` | `GInput` pone `required` nativo; con el valor en un campo oculto conviene `aria-required` (#270 quedó sin extender a `GInput`): medir y decidir |
| L11 | Hoja móvil | Umbral 520px como `GSelect` (#56). El disparador cambia a `aria-haspopup="dialog"`; son dos `combobox` (página y hoja): confirmar con lector real |
| L12 | `GInputGroup` | Un `GCombobox` como parte de un grupo (CP + colonia): no medido; reservar |
| L13 | `GFilterBar` | Puede usar `GCombobox` como editor de valor: fuera de esta ronda |
| L14 | Selección múltiple | Fuera; recomendada como `multiple` en Fase 2 con ronda propia (brief). `GTagInput` reservado para etiquetas sin catálogo |
| L15 | Tokens | Ninguno nuevo en la base: los de `GSelect` (lista, opción) y `GInput` |

## Preguntas de producto

Ninguna en r01. Las de identidad y alcance están en `../r02/declaracion.md`.
