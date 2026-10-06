# Declaración — `GCombobox`, r03: selección múltiple (`multiple`, Fase 2)

> kiwi, 2026-10-06. Prototipo: `index.html?c=base|A|B|C` (motor `multi.js`, kit `multi.css`) con componentes reales de `dist/` (`GInput` por sus slots internos `field` y `end`, `GSummary` + `summaryDiff`, `GAvatar`, `GForm`, `GFormLayout`, `GFormRow`, `GDialog`, `GBtn` y el `GCombobox` real de una opción) y los **tokens del tema por defecto**. Verificación: `verificar.mjs`, **1077/1077 comprobaciones** en Chromium, Firefox y WebKit (cifras en «Comprobaciones»). La Fase 1 (`combobox.md`, #329 a #338, #356, #358) **no se reabre**: aquí solo lo que cambia con varios valores.

## Los mismos casos en los cuatro

1. **Alergias**: 40 alérgenos en 4 grupos, texto libre (`allowCustom`, `customName`), «Quitar todas», 2 elegidas al cargar.
2. **Diagnósticos secundarios**: CIE-10 con código, **tope 3** (`max`), `name="dx"`.
3. **Responsables**: personas con avatar y datos, **dos «Ana López Ruiz»** (Urgencias y Pediatría).
4. **Formulario**: `GFormRow` con `GInput` «Folio», el campo múltiple «Etiquetas» y el **`GCombobox` real** «Servicio»; debajo, «Notas» (¿se mueve?); otra fila con solo lectura y deshabilitado; envío por `FormData`.
5. **Muchos**: 500 insumos con 40 elegidos.
6. **Dentro de un `GDialog`**.

Más 375 y 320px, RTL y movimiento reducido.

---

## Base funcional (común a A, B y C)

Deriva de WAI-ARIA APG (*Combobox* con *listbox popup* y *Listbox* de selección múltiple), WCAG 2.2 y los contratos vigentes; **no se pregunta al usuario**. Se pinta con la forma convencional (`?c=base`) para medir contra ella.

### Anatomía

```
raíz (la de GInput, clase g-combobox g-combobox--multiple)
├─ label · for → input
├─ caja (g-input__control)
│  ├─ prefijo decorativo (slot prepend)
│  ├─ [lo elegido, según el concepto: fichas (base) · frase (A, C) · nada (B)]                   ← aria-hidden o lista propia
│  ├─ <input type="text" role="combobox" aria-autocomplete="list" aria-haspopup="listbox" aria-expanded
│  │         aria-controls="ID-list" aria-activedescendant aria-describedby="ID-about ID-hint ID-message" aria-required>
│  │         (su valor es SIEMPRE el texto que se busca; nunca la etiqueta de un elegido)
│  ├─ texto fantasma (forma field, identidad A de la Fase 1)
│  ├─ ID-about (texto oculto): «3 seleccionadas: Penicilina, Látex y Sulfonamidas»
│  ├─ <input type="hidden" name> × uno por valor, en orden · <input type="hidden" name=customName> × uno por texto libre
│  ├─ botón «Quitar todas {etiqueta}» (clearable, con elegidos)
│  └─ flecha decorativa
├─ pie (ayuda, mensaje)                                     [B: y debajo, la receta]
├─ región viva propia
└─ forma abierta (field: popover) | superficie (palette y hoja: GDialog)
   panel
   ├─ estado (fuera del listbox): tope alcanzado · sin resultados · (los de la Fase 1)
   └─ <ul role="listbox" aria-multiselectable="true" aria-labelledby="ID-label">
      ├─ [grupo «Elegidas · 3» (A y hoja móvil): role="group"]  … «Ver las 40» (fila de acción) si pasan de 12
      ├─ grupos del catálogo: <li role="option" aria-selected="true|false" [aria-disabled]> casilla + GSummary row
      └─ filas de acción (role="option", aria-selected="false", al final): «Mostrar más» · «Usar «x» como texto libre» · (create)
   [superficie: pie con «3 seleccionadas» y «Listo»; C: la cesta al lado del panel]
```

### Decisiones

**Semántica**

1. **APG: combobox con listbox de selección múltiple.** El `listbox` lleva `aria-multiselectable="true"`; **todas** las opciones llevan `aria-selected` explícito (`true`/`false`). **No `aria-checked`**: APG admite uno u otro, nunca los dos; `aria-selected` es el de la Fase 1 y el mejor soportado junto a `aria-activedescendant`. La **casilla** visual al inicio de cada opción (forma de control, como `GCheckbox`; marca Lucide `check`) es la señal no cromática de «aquí se eligen varias» y del estado; es decorativa (`aria-hidden`).
2. **Selección y opción activa son independientes.** Mover la activa (flechas, puntero) nunca cambia la selección (APG, *multi-select listbox*: la selección no sigue al foco).
3. **Lo elegido se lee sin abrir:** `aria-describedby` del campo empieza por `ID-about` = el recuento y la lista con `Intl.ListFormat` del `lang` («3 seleccionadas: Penicilina, Látex y Sulfonamidas»; en diagnósticos, código + descripción; los libres, «Polen de olivo (Texto libre)»). Lo pintado en la caja (fichas, frase) es `aria-hidden`; la receta de B y la cesta de C son listas propias con nombre.
4. **El valor del `<input>` es siempre el texto de búsqueda.** A diferencia de la ficha de la Fase 1 (C), con `multiple` el campo no contiene la etiqueta de ningún elegido.

**Teclado**

| Tecla | Lista cerrada | Lista abierta |
| --- | --- | --- |
| Carácter | Abre y busca | Busca |
| ↓ / ↑ | Abre; la primera / la última | Siguiente / anterior fila; no cicla; salta las deshabilitadas **del catálogo**; las deshabilitadas **por el tope** sí se recorren (decisión 12) |
| Alt+↓ / Alt+↑ | Abre sin mover | Alt+↑ cierra |
| Av Pág / Re Pág | — | Diez adelante / atrás |
| → | Edición | Con texto fantasma y el cursor al final: acepta el texto **sin elegir** (Fase 1) |
| **Intro** | Nativo (envío implícito) | **Alterna** la activa (marca o desmarca); **la lista sigue abierta**; el texto queda seleccionado. Sobre una fila de acción, la ejecuta. Excepción de la decisión 6 |
| Esc | Con texto: lo vacía (sin propagar) | Cierra y conserva el texto (`stopPropagation`: no cierra un `GDialog`) |
| Tab | Sale | Cierra y sale. **Nunca elige** |
| **Retroceso** | Con texto: edita. **Vacío: en dos tiempos** (decisión 7) | Igual |
| **Ctrl/⌘+Z** | Si lo último fue quitar: lo devuelve (decisión 8). Si no, el deshacer nativo del texto | Igual |
| Espacio | Escribe un espacio (es un campo de texto: no marca) | Igual |

5. **Intro alterna y la lista se queda.** Elegir varios es una serie: «ibu» Intro, «napro» Intro, «cefa» Intro. Tras cada uno el texto queda **seleccionado** (lo siguiente lo reemplaza, regla de la Fase 1), los resultados siguen a la vista y la activa no se mueve. **Marcar o desmarcar no reordena la lista** mientras está abierta (#358, regla 4: nada se mueve bajo el puntero); el orden se rehace al abrir y al cambiar el texto.
6. **Seguridad (#333 llevado a varios):**
   - **Intro sobre una opción ya elegida que quedó activa sola** (resaltado automático al escribir) **no la quita**: lo dice («Penicilina ya está elegida») y selecciona el texto. Quien escribe el nombre de algo que ya está para «agregarlo» no lo borra. Desmarcar con Intro exige haberla activado con flechas o puntero (medido).
   - **Tab nunca elige**, sin la excepción del texto fantasma de la Fase 1 (Intro ya es la tecla de agregar y la lista sigue abierta; Tab es salir).
   - **Salir descarta el texto a medio escribir**; nunca se agrega al pasar, tampoco con `allowCustom` (el texto libre entra solo por su fila, como en la superficie de la Fase 1).
7. **Retroceso con el campo vacío, en dos tiempos.** La primera pulsación **marca** la última elegida (tachada y con fondo de selección o borde; nunca solo color) y lo anuncia («Pulsa Retroceso otra vez para quitar Látex»); la segunda la quita. Cualquier otra tecla, el puntero o salir desarman. **La repetición automática** (`event.repeat`: Retroceso sostenido para borrar el texto) **nunca quita nada** (medido). Es la diferencia entre «borré mi búsqueda» y «borré la penicilina del expediente».
8. **Deshacer de un nivel.** Ctrl/⌘+Z en el campo devuelve lo último quitado —una, o todas tras «Quitar todas»— **a su posición**, si lo último que pasó en el campo fue quitar (si después se escribió, Ctrl/⌘+Z es el deshacer nativo del texto). Respeta `max`. Anuncio «Se restauró …».

**Modelo y envío (#338)**

9. **Orden = orden de elección**: agregar pone al final de `modelValue` (o de `custom`); deshacer devuelve a su sitio. Sin duplicados (`===` en valores; textos libres sin acentos ni mayúsculas). **Se pinta primero los valores y después los textos libres**: el modelo de dos arreglos (#338) no guarda el orden entre ambos (hallazgo L29).
10. **Un `<input type="hidden">` por valor**, con el mismo `name`, en orden; **sin elegidos, ninguno** (como `<select multiple>`: `FormData` sin la clave; `getAll(name)` = `[]`). Igual con `customName`. Deshabilitado: ocultos `disabled`. Solo lectura: se envían (medido: `{"etiquetas":["t0","t1"],"ro":["t2","t4","t8"],"servicio":["urg"]}`, sin `dis`).
11. **`change` una vez por gesto**, después de los `update:*`: `{ value, custom, options, added, removed }` (`added`/`removed` como en `GFileField`, #371: dice qué cambió sin comparar arreglos).

**Tope y estados**

12. **`max`**: con el tope, las no elegidas quedan `aria-disabled="true"` **pero navegables** (se leen y se sabe por qué); el panel muestra `labels.max` fuera del `listbox` («Máximo 3 diagnósticos: quita uno para elegir otro»); Intro o clic sobre una lo anuncian; la fila de texto libre también se deshabilita; las elegidas siguen activas para desmarcar. Precedente: el tope de `GFileField` («Mesa llena»). Grana no valida (#157): es un límite del control, como `maxlength`.
13. **Estados nuevos**: con elegidos · tope alcanzado · marcada para quitar (Retroceso) · recién agregada (B) · rastro de quitada (B, C) · «Ver las N» · superficie con recuento. Los de la Fase 1 siguen (carga, sin resultados, error de carga, solo lectura, deshabilitado, error, RTL, reduced motion).
14. **Solo lectura**: no abre, sin «Quitar», sin limpiar, sin flecha; lo elegido visible y en `ID-about`; se envía. **Deshabilitado**: no se envía.
15. **«Quitar todas»** (`clearable`): botón con `aria-labelledby` = su texto + la etiqueta («Quitar todas Alergias»); quita todo, lo anuncia, devuelve el foco al campo y se deshace con Ctrl/⌘+Z.

**Anuncios** (región viva propia, educada; en la superficie, la de dentro)

16. Agregar: «Se agregó Ibuprofeno. 3 seleccionadas.» · Quitar: «Se quitó Penicilina. 2 seleccionadas.» · Restaurar · Quitar todas · Tope · Ya elegida · Marcada para quitar. Los recuentos de resultados, como en la Fase 1. **Se anuncia también al marcar dentro de la lista**: `aria-selected` cambia, pero con `aria-activedescendant` no todos los lectores lo dicen (por verificar con lector real); el recuento, además, no lo da nadie más.

**Superficie y móvil**

17. **Superficie con varios** (`palette` y hoja móvil): el `GDialog` de la Fase 1 con su campo de búsqueda; **elegir no cierra**; se añade un **pie** con el recuento y **«Listo»** (`labels.done`). Esc, el fondo, el cierre y «Listo» cierran **conservando** lo elegido: no hay borrador (el modelo cambia en cada gesto, como en `field`; el error se cubre con deshacer). La primera tecla abre y no se pierde (Fase 1).
18. **Hoja móvil (≤ 520px), la misma para A, B y C**: búsqueda, lista con **«Elegidas» arriba** (el mecanismo de A) y pie con «Listo». La receta de B y la cesta de C no caben junto a la lista a 375px; en reposo, cada concepto conserva su forma en el campo. Opciones ≥ 44px; sin desbordamiento a 375 y 320 (medido).

**Encaje**

19. **En una `GFormRow`**: tres pistas por *subgrid*, como `GInput`. A y C: la caja no cambia de alto con 2 o con 8 elegidas (Δ0, medido); B: la caja no se mueve y la receta crece en la pista del pie (lo de debajo baja, a petición de la persona); base: la caja crece (lo que se cuestiona).
20. **Grupos largos**: el grupo «Elegidas» (A, hoja) y la cesta (C) muestran **12** y una fila de acción «Ver las N» que despliega el resto; la receta de B, en reposo, **6** y «Ver los N» (`aria-expanded`). Lo nuevo y lo quitado en la pasada actual se ven siempre. Constantes de diseño (como las 10 filas de Av Pág), no tema.
21. **RTL**: propiedades lógicas; la frase y las fichas empiezan en el borde de inicio (medido); `Intl.ListFormat` sigue el `lang`, no `dir`; los textos con `dir="auto"` (los de `GSummary`).

### Qué lo hace distinto (la base)

Tres reglas de seguridad que el campo de etiquetas genérico no tiene, pensadas para quien quita por error una alergia de un expediente: **Intro no borra lo que ya está** (decisión 6), **Retroceso sostenido no se lleva lo elegido** y quitar con Retroceso pide confirmación de una tecla (7), y **todo quitar se deshace** (8). Ninguna añade pasos al camino normal (escribir, Intro, escribir, Intro).

---

## A · La frase

**Estructura.** Los elegidos viven **en la línea del campo**, escritos como una frase con `Intl.ListFormat`: «Penicilina, Látex e Ibuprofeno». No hay fichas ni ×. La frase **cede por el final** con texto, no con una insignia: «Insumo 001 · gasas, Insumo 002 · jeringas, … y 36 más» (cifra con peso de acción); si ni la primera cabe, se recorta con elipsis y «y N más» se conserva. En diagnósticos, la frase usa el **código** («E11.9, I10 y J45.9»: así los escribe un médico); los textos libres, en cursiva con `pencil`. Con el foco, la frase cede el 45 % al texto que se escribe y se apaga a `text-muted`. **La caja mide siempre lo mismo.**

**Comportamiento.** Al abrir (forma A de la Fase 1: «el campo se abre»), el primer grupo es **«Elegidas · 3»**: ahí se revisan y se desmarcan. Desmarcar deja la fila en su sitio (sin marca) hasta cerrar; al reabrir ya no está. Al escribir, las elegidas aparecen marcadas en su lugar del catálogo. Retroceso marca en la propia frase la que se va a quitar (tachada sobre fondo de selección; si estaba dentro de «y N más», la frase la saca a la vista).

**Movimiento.** La cifra de «y N más» y la de «Elegidas» **ruedan** al cambiar por un gesto (`--g-duration-slow`, `--g-ease-spring`); la marca de la casilla **salta** en la fila que se marca (`--g-ease-bounce`, escala 0,4 → 1). Nada se anima al cargar ni al abrir (#336: medido); con movimiento reducido, nada.

### Qué lo hace distinto (A)

El campo de etiquetas habitual crece por líneas y empuja el formulario con cada elección. A **no crece nunca**: lo elegido se dice como lo diría una persona («Penicilina, Látex y 3 más»), que además es lo que queda impreso o en una captura, sin × ni fichas que recortar. La cesión es **por texto legible**, no una insignia «+3» que nadie puede abrir; la lista completa está en la descripción accesible y, al abrir, en «Elegidas». Para quien llena formularios densos, la fila no salta y el ritmo del formulario se conserva.

### Gana y arriesga

- **Gana:** Δ0 absoluto (caja, fila y línea de debajo, medidos con 2 y con 8); se lee en reposo; comparte fila con cualquier campo; ningún objetivo pequeño junto a otro (no hay ×); el mismo modelo mental que la forma A de la Fase 1.
- **Arriesga:** **revisar todo exige abrir** (o un lector, que recibe la lista completa); con muchas elegidas la frase dice poco («… y 36 más»); quitar con puntero son dos gestos (abrir y desmarcar). La frase depende de que las etiquetas (o los códigos) sean cortas.

### Medidas (A)

| Medida | Resultado |
| --- | --- |
| Δ0 en la fila | Caja, etiqueta, vecinas y «Notas»: Δ 0px de 2 a 8 elegidas (tres motores) |
| Cesión | 40 elegidas: «… y 36 más»; `ID-about` con las 40 |
| «Elegidas» | Primer grupo, marcadas; desmarcar no mueve la fila; con 40, 12 y «Ver los 40» |
| Retroceso | La marcada, tachada (`line-through`) sobre `selection` |
| Contraste | Frase 17.4:1; con foco 7.46:1; marcada 15.3:1; «y N más» 17.4:1 |

**Coste:** bajo-medio. La frase es una medida por lotes (como `GSummary`: qué cabe) y `formatToParts`; el grupo «Elegidas» es una instantánea al abrir. **Riesgos:** la medida de la frase con fuentes que tardan (se rehace en `document.fonts.ready`); `forced-colors` de la marca de Retroceso (sin medir).

---

## B · La receta

**Estructura.** La caja es **solo la búsqueda** (placeholder «Agregar…», siempre vacía en reposo). Los elegidos viven **debajo**, como **renglones completos**: `GSummary` `row` con código, nombre y datos, en el orden de elección, **numerados** cuando el orden importa (diagnósticos: 1, 2, 3), cada uno con su «Quitar {nombre}». Es una lista con nombre (el de la etiqueta). En reposo, 6 renglones y «Ver los N».

**Comportamiento.** Los que se agregan en esta pasada llevan **«Nueva»** (texto, se lee) y una barra de acento al inicio. **Quitar no cierra el hueco**: el renglón se convierte en un **rastro** del mismo alto —«Diabetes mellitus tipo 2… quitado» tachado y **«Deshacer»**— y **el foco queda en «Deshacer», en el mismo sitio**. El rastro y las marcas «Nueva» duran **hasta la siguiente pasada**: se pliegan cuando la persona **vuelve a escribir en el campo** (el movimiento ocurre debajo de donde está su atención), no al salir (la línea a la que salta no se mueve bajo ella).

**Movimiento.** El renglón nuevo crece desde la línea anterior (`grid-template-rows` 0fr → 1fr, `--g-duration-slow`, `--g-ease-out`); el rastro aparece con un fundido; al plegarse, encoge igual. Movimiento reducido: todo en el acto.

### Qué lo hace distinto (B)

Para un diagnóstico o un medicamento, una ficha recortada («E11.9 Diab…») no se verifica. B pone cada elegido **entero y en su orden**, como en una receta, y convierte la lista en un **registro de la pasada**: lo que se agregó dice «Nueva», lo que se quitó deja su rastro con «Deshacer» **en el mismo sitio**, de modo que quitar por error nunca mueve nada ni pierde nada. Quien revisa antes de guardar ve exactamente qué cambió.

### Gana y arriesga

- **Gana:** la mejor revisión (todo legible, con código y datos, numerado); quitar sin errores (objetivo de 24px aislado al final del renglón, rastro en el sitio, foco que no salta); la caja de búsqueda nunca se mueve (Δ0 de caja, etiqueta y vecinas en la fila, medido); el orden es visible.
- **Arriesga:** **el formulario crece** (lo de debajo baja un renglón por elección: 196px de 2 a 8 en la fila, con tope de 6 visibles); mientras la lista está abierta, la forma abierta **tapa la receta** (lo nuevo se ve al cerrar, con «Nueva»); en una `GFormRow` la receta ocupa la columna del campo, estrecha. **Necesita un hueco nuevo en `GInput`** (hallazgo L37): la receta no puede ir en la ayuda (sería descripción del campo, con botones dentro).

### Medidas (B)

| Medida | Resultado |
| --- | --- |
| Caja | Δ0 de alto y posición; etiqueta y vecinas Δ0 |
| Lo de debajo | Baja con la receta (196px de 2 a 8 etiquetas: 6 renglones y «Ver los 8») |
| Rastro | Mismo sitio y alto que el renglón (Δ0, medido respecto a la etiqueta); foco en «Deshacer», descrito por el rastro |
| Deshacer | Devuelve a su posición y el foco a su «Quitar» |
| Pasadas | Salir no pliega nada; volver a escribir pliega rastros y quita «Nueva» |
| Muchos | 6 renglones y «Ver los 40» (`aria-expanded`) → 40 |
| Contraste | Título 17.4:1; número 7.46:1; «Nueva» 5:1; barra de nueva 5.69:1 (≥ 3:1); rastro 6.9:1; «Deshacer» 5.27:1; «Quitar» 7.46:1 |

**Coste:** medio. Una lista con estado por renglón (nuevo, rastro) y la regla de la pasada; el hueco en `GInput`. **Riesgos:** alto del formulario; la regla de la pasada en un lector real; Safari y el foco en «Deshacer».

---

## C · La cesta

**Estructura.** Elegir varios es una **sesión de trabajo**. El campo se eleva a la **paleta** (identidad B de la Fase 1, el mismo `GDialog`): búsqueda arriba, **resultados a un lado y la cesta de lo elegido al otro** —en el lugar de la vista previa—, siempre a la vista mientras se busca. La cesta es una lista con nombre «Elegidas · 3 seleccionadas», cada renglón un `GSummary` con «Quitar». Pie con el recuento y «Listo». En reposo, el campo dice lo elegido con **la frase de A**.

**Comportamiento.** Marcar en los resultados **manda el elegido a la cesta**; quitar en la cesta deja el rastro con «Deshacer» (como B) mientras la paleta está abierta; cerrarla lo pliega. Entre homónimos, `summaryDiff` marca lo que distingue **en los resultados y en la cesta** (las dos «Ana López Ruiz»: Urgencias frente a Pediatría, ext. 2104 frente a 3310). La activa, invertida (Fase 1).

**Movimiento.** **Lo marcado viaja a la cesta**: el nombre sale de su fila y aterriza en su renglón (vector `--_tx`/`--_ty`, `--g-duration-slow`, `--g-ease-spring` dentro de `@supports`; es la «ficha que llega» de la Fase 1, ahora hacia la cesta). Las cifras ruedan. Movimiento reducido: nada.

### Qué lo hace distinto (C)

En el patrón habitual, lo que ya elegiste desaparece mientras buscas lo siguiente (queda escondido en el campo, detrás del menú). C pone **las dos mitades del trabajo una al lado de la otra**: lo que hay y lo que llevas, como un carrito que se ve mientras se compra. El viaje de cada elección a la cesta hace visible la causa y el efecto, y entre homónimos la cesta compara igual que los resultados: se elige a **la** Ana López correcta y se comprueba que es ella la que quedó.

### Gana y arriesga

- **Gana:** revisar y quitar **mientras se busca**; comparación de homónimos en resultados y cesta; el campo en reposo no crece (frase de A); el modelo mental de la paleta de la Fase 1.
- **Arriesga:** es **modal** (tapa el formulario: no se puede mirar el dato de al lado); la vista previa de la activa de la Fase 1 **cede su sitio a la cesta** (en homónimos, la fila con `summaryDiff` la sustituye; hallazgo L38); el más costoso de abrir con muchos (WebKit, en el prototipo con 51 filas y 12 en la cesta: 146 a 258ms según la pasada, frente a 64 a 184ms de B); en móvil la cesta no cabe y queda la hoja común. Para tres etiquetas es desproporcionado.

### Medidas (C)

| Medida | Resultado |
| --- | --- |
| Paleta | `GDialog` modal, búsqueda con el foco, la primera tecla no se pierde, Tab no agrega |
| Cesta | Las elegidas a la vista; vacía, lo dice; recuento con su cifra |
| Viaje | `is-arriving` con vector al marcar; termina en 0 |
| Homónimos | Área y extensión `is-diff` en las dos «Ana López Ruiz» |
| Quitar en la cesta | Rastro con el foco en «Deshacer»; deshacer devuelve |
| Cerrar | Esc y «Listo» conservan y devuelven el foco al campo; sobre un `GDialog`, Esc cierra solo la paleta |
| Contraste | Cesta 17.4:1; recuento 6.9:1; activa invertida 17.4:1; pie 7.46:1 |

**Coste:** medio (reusa la paleta y los renglones de B). **Riesgos:** modal sobre modal dentro de un `GDialog`; coste de pintado en WebKit; la regla de la vista previa de #335.

---

## Comparativa

| | Base (referencia) | A · La frase | B · La receta | C · La cesta |
| --- | --- | --- | --- | --- |
| Dónde viven | Fichas en la caja | En la línea del campo | Debajo de la caja | En la paleta, al lado |
| Caja de 2 a 8 en la fila | **Crece 168px** | Δ0 | Δ0 | Δ0 |
| Lo de debajo, de 2 a 8 | Baja 168px | **Δ0** | Baja 196px (tope 6) | **Δ0** |
| Revisar lo elegido | Fichas recortadas | Abriendo («Elegidas») o con lector | **Siempre, entero y numerado** | Mientras se busca |
| Quitar con puntero | × de 24px en la caja | Abrir y desmarcar | **«Quitar» al final del renglón, con rastro** | En la cesta, con rastro |
| Quitar sin errores | Retroceso ×2, deshacer | Retroceso ×2 (marca en la frase), deshacer | **Rastro en el sitio + foco en «Deshacer»** | Rastro + deshacer |
| Muchos (40) | 40 fichas, caja enorme | «… y 36 más», 12 + «Ver los 40» | 6 + «Ver los 40» | 12 + «Ver los 40» en la cesta |
| Homónimos | No se distinguen | En la lista | En la lista y en los renglones | **En resultados y cesta** |
| Contexto del formulario | Se conserva | Se conserva | Se conserva | **Se tapa** (modal) |
| Comparte fila | Sí, pero la descuadra | **Sí** | Sí, la receta en su columna | **Sí** |
| Móvil | Hoja común | Hoja común | Hoja común | Hoja común |
| Personalidad | — | Frase que cede por texto; cifras que ruedan | Registro de la pasada: «Nueva» y rastro | Viaje a la cesta; comparar mientras eliges |
| Coste | — | Bajo-medio | Medio (+ hueco en `GInput`) | Medio |
| Se combina | — | Con C (C usa su frase en reposo) y con B (frase arriba, receta abajo: redundante) | Con A en la hoja | Con A |

## Recomendación

**A como forma por defecto de `multiple` en `appearance="field"`; B como opción para cuando cada elegido debe verse entero (diagnósticos, medicamentos, órdenes); C es lo que `appearance="palette"` hace con `multiple`.**

- **A** es la continuación natural de la identidad elegida («el campo se abre» + el valor como objeto): el campo no crece nunca, se lee en reposo y se revisa al abrir. Es lo correcto para alergias, etiquetas, servicios, responsables: valores cortos.
- **B** resuelve lo que A no puede (ver entero y en orden) a cambio de crecer, que es aceptable cuando la lista **es** el contenido del formulario (la receta, los diagnósticos). Su regla de rastro y deshacer es la mejor respuesta a «quitar sin errores» y debería aplicarse también a la cesta de C.
- **C** no necesita una prop nueva: es `palette` con `multiple`. Con homónimos y catálogos de personas es la más segura.

Si hubiera que elegir **una sola**, A: es la que no rompe nada de lo que Grana ya prometió (sin saltos, Δ0 en `GFormRow`, el valor que se lee en reposo).

## Qué lo hace distinto

Un campo de varios que **no empuja el formulario** (A), que **convierte la lista en el registro de lo que cambiaste** (B) o que **pone lo elegido al lado de lo que buscas** (C); y, en los tres, quitar **nunca es irreversible ni accidental**: Intro no borra lo que ya está, Retroceso sostenido no se lleva nada y todo se deshace. Ninguna × diminuta amontonada, ninguna insignia «+3» que no se puede abrir.

## Preguntas de producto (para el usuario)

1. **¿Dónde viven los elegidos por defecto?** A · La frase / B · La receta / C · La cesta / una mezcla. **Recomendación:** A por defecto en `field`, B como opción (nombre de prop: lo propone lima) para listas que hay que leer enteras, y C como el comportamiento de `appearance="palette"` con `multiple`.
2. **Tras elegir, ¿qué pasa con la lista y el texto?** (a) la lista sigue abierta y el texto queda seleccionado (lo siguiente lo reemplaza); (b) la lista sigue abierta y el texto se vacía; (c) la lista se cierra. **Recomendación: (a)**: se pueden marcar varias del mismo resultado («amoxi» → dos presentaciones) y escribir la siguiente sin borrar.
3. **¿Cuánta red para quitar?** (a) deshacer de un nivel en todos (Ctrl/⌘+Z) **y** rastro visible con «Deshacer» donde hay renglones (B, C); (b) solo Ctrl/⌘+Z, sin rastro; (c) sin deshacer. **Recomendación: (a)**: el rastro es lo único que un usuario de puntero o táctil puede descubrir.
4. **¿El orden de los elegidos significa algo en tu producto** (p. ej. el primer diagnóstico es el principal)? (a) no: orden de elección, sin reordenar (v1); (b) sí: B numera y se puede **reordenar** (Alt+↑/↓ y arrastre, ronda propia). **Recomendación: (a)** en v1, con el número visible en B; reordenar como reserva.

## Comprobaciones hechas

`node design/lab/combobox/r03/verificar.mjs` · 2026-10-06 · puerto 4212 · **1077 de 1077 comprobaciones pasan** (pasada final sobre los archivos entregados).

| Motor | Base | A | B | C | Δ medidos (de 2 a 8 en la fila) | Abrir «Insumos», frío / segunda vez (ms) |
| --- | --- | --- | --- | --- | --- | --- |
| Chromium | 83/83 | 89/89 | 94/94 | 93/93 | base: caja +168, «Notas» +168 · A y C: 0 · B: caja 0, «Notas» +196 | base 42/35 · A 74/59 · B 46/38 · C 74/63 |
| Firefox | 83/83 | 89/89 | 94/94 | 93/93 | igual | base 62/56 · A 161/111 · B 73/66 · C 165/94 |
| WebKit | 83/83 | 89/89 | 94/94 | 93/93 | igual | base 137/137 · A 187/133 · B 143/64 · C 186/146 |

Contraste (Chromium, tema por defecto, medido sobre el fondo real): casilla, borde 3.45:1 (control ≥ 3:1), marcada 15.25:1, marca 16.48:1; «Elegidas» 17.4:1; fichas de la base 16.1:1; y los de cada concepto en sus «Medidas».

Por concepto y motor: semántica en reposo (role, `aria-expanded`, `aria-haspopup`, ocultos en orden, visible sin `name` ni `required`, `ID-about` con la lista) · enfocar no abre · abierta (`aria-multiselectable`, `aria-selected` en todas, «Elegidas» en A) · Intro agrega, la lista sigue, texto seleccionado, anuncio, `change` · Intro sobre elegida resaltada sola no la quita · flechas + Intro desmarca sin mover la fila · Esc en dos niveles · texto fantasma y Tab que no agrega · Retroceso en dos tiempos, marca visible, `repeat` que no quita, Ctrl/⌘+Z · «Quitar todas» y deshacer · texto libre múltiple (fila, `custom`, `customName`, sin duplicar) · tope (`aria-disabled` navegable, estado, anuncio) · `FormData`, solo lectura, deshabilitado · Δ en la `GFormRow` de 2 a 8 · 500 opciones y 40 elegidas (cesión de la frase, «Ver los N») · dentro de `GDialog` · nada se anima al cargar ni al abrir (#336) · movimiento con y sin `reduce` · contraste · Retroceso saca a la vista la última aunque esté en «y N más» (A, C) · lo propio de cada concepto · 375 y 320 (hoja, «Elegidas», ≥ 44px, sin desbordamiento, «Listo») · RTL · consola limpia.

**Rendimiento (anotado, no exigido):** abrir «Insumos» (500 opciones, 40 elegidas) hasta el segundo cuadro. El prototipo compila sus plantillas en el navegador y monta un `GSummary` real por fila; en WebKit, con los tres motores en marcha, la cifra varía ±100ms entre pasadas. La compuerta «< 150 ms» es del componente real (bruno). Cifras de la última pasada en la tabla.

## No comprobado

- **Lector de pantalla real** (VoiceOver, NVDA, TalkBack): si `aria-selected` se anuncia al cambiar con `aria-activedescendant` (por eso hay anuncio propio: puede duplicarse); `ID-about` largo con 40 elegidas; la frase `aria-hidden` junto al campo; el grupo «Elegidas»; la receta y la cesta como listas con botones; el rastro con «Deshacer» descrito; los dos `combobox` de la superficie.
- `forced-colors`: casilla, marca de Retroceso (tachado + fondo), rastro y «Nueva» (reglas sin escribir).
- Táctil y móvil reales; teclado virtual sobre la hoja; IME con varios.
- Tema oscuro y un tema distinto del por defecto (contrastes medidos solo en el claro): auditoría de coco.
- Arrastre para reordenar (fuera: pregunta 4).
- Búsqueda remota (`filter: false`) con varios: el prototipo filtra en local; las reglas de pendiente de la Fase 1 no cambian, pero «Elegidas» debe pintarse con `selectedOptions` cuando las elegidas no están en `options` (sin medir).
- WebKit y Tab: Safari no lleva el foco a botones con Tab salvo ajuste del sistema («Quitar», «Deshacer», «Listo»); la batería los pulsa o enfoca directamente.

## Hallazgos para lima

(Siguen a L1–L25 de `../r01/` y `../r02/`, ya resueltos en `combobox.md`.)

| # | Tema | Propuesta |
| --- | --- | --- |
| L26 | Identidad | Registrar en `DECISIONS.md` la elección del usuario (A, B, C o mezcla) y las semillas descartadas del `brief.md` (fichas con ← →, carril con desplazamiento, «+N» como única cesión, solo recuento, borrador con «Aplicar», Tab que agrega) |
| L27 | Semántica | `listbox` con `aria-multiselectable="true"`; `aria-selected` explícito en todas las opciones (no `aria-checked`); casilla decorativa al inicio de cada opción (`g-combobox__box`, marca `check` de `GLibIcon`), forma de control como `GCheckbox` |
| L28 | Teclado | Tabla de la base: Intro **alterna** y la lista sigue abierta con el texto seleccionado; **Intro sobre elegida resaltada sola no la quita** (`labels.already`); Tab nunca elige (la excepción del fantasma no aplica con `multiple`); **Retroceso en dos tiempos** sin `repeat` (`labels.armed`); **Ctrl/⌘+Z** de un nivel si lo último fue quitar; Espacio escribe |
| L29 | Orden | Orden de elección; se pintan valores y después textos libres. El modelo de #338 (dos arreglos) **no guarda el orden mezclado**: decidir si basta (recomendado) o si hace falta otra forma (p. ej. `order`) |
| L30 | Envío | Un oculto por valor en orden; **ninguno** sin elegidos; `customName` igual; `form` copiado a todos |
| L31 | `change` | `{ value, custom, options, added, removed }` (amplía la forma de #338 con `added`/`removed`, como `GFileField` #371) |
| L32 | `max` | Prop **`max`** (entero ≥ 1): las no elegidas `aria-disabled` y navegables; `labels.max` en el panel (estado `--max`, fuera del `listbox`) y anunciado; fila de texto libre deshabilitada; deshacer respeta el tope. Aviso si `modelValue` llega con más de `max` (se pinta todo, no se recorta) |
| L33 | Textos | Además de `remove` y `selected` (#338): `added`, `removed`, `restored`, `clearedAll`, `armed`, `already`, `max`, `chosen`, `ofMax`, `more` (frase de A), `done`, `showAll`, `showLess`, `undo`, `tomb`, `fresh` (B), `basketEmpty` (C). `selected` contado con función (plural y género los pone la aplicación: «seleccionadas», «diagnósticos»); `clear` pasa a decir «Quitar todas» |
| L34 | `ID-about` | Recuento + lista con `Intl.ListFormat` del `lang` del ancestro (como las cifras de la Fase 1, sin prop `locale`); código + etiqueta; libres con `labels.custom`. Valorar un tope de longitud tras el lector real |
| L35 | Superficie | Con `multiple`: elegir no cierra; pie con recuento y «Listo» (`labels.done`); cerrar conserva (sin borrador); región viva de dentro |
| L36 | A · frase | Clase `g-combobox__sentence` (`aria-hidden`) con elementos de `formatToParts`; cede por el final con `labels.more` («{count} más») medido por lotes como `GSummary` (sin consultas de contenedor); elemento = `code` o `label`; libres en cursiva con `pencil`; con el foco, 55 % de la celda. Grupo «Elegidas» (`labels.chosen` + `ofMax`/recuento) como **instantánea al abrir**; tope **12** y fila de acción «Ver las N» |
| L37 | B · receta | Necesita un **hueco interno nuevo de `GInput`** tras el pie (como `field`/`end`, #309), dentro de la tercera pista en `GFormRow`; la receta **no** puede ir en la ayuda. Lista con nombre (la etiqueta), renglón = `GSummary row` + «Quitar {label}» (`labels.remove`); número con `numbered` (o nombre de lima); «Nueva» (`labels.fresh`) y barra de acento; **rastro** (`labels.tomb` + «Deshacer», foco en él, mismo alto) hasta la siguiente **pasada** (al volver a escribir en el campo tras salir); tope **6** en reposo con «Ver los N» (`aria-expanded`). Nombre de la opción que la activa: de lima (p. ej. `selection="list"` frente a `"inline"`) |
| L38 | C · cesta | Con `appearance="palette"` y `multiple`, la cesta ocupa el sitio de la vista previa: la vista previa de la activa **no se pinta** (el slot `preview` se ignora con aviso) y la regla de #335 se cumple por la fila con `summaryDiff`. Alternativa a decidir: vista previa compacta encima de la cesta. Renglones como B (rastro hasta cerrar); tope 12; viaje con `--_travel-x/-y` y `is-arriving` (mismo mecanismo que la ficha de la Fase 1) |
| L39 | Tokens | **Ninguno nuevo.** `--g-ease-bounce` (casilla), `--g-ease-spring` (cifras, viaje), `--g-ease-out` (renglones), `--g-color-selection` (marca de Retroceso), `accent-soft`/`on-accent-soft` («Nueva», 5:1), `warning-soft`/`warning-text` (tope, 5.01:1), `accent-text` («Deshacer», 5.27:1), `brand`/`on-brand` (casilla marcada). Coco mide en oscuro y en otro tema |
| L40 | Frontera | `combobox.md` «Cuándo usarlo»: `GCheckboxGroup` (≤ ~7 a la vista) · `GCombobox multiple` (catálogo; texto libre marcado y solo por su fila; pegar es buscar) · `GTagInput` (sin catálogo, separadores, validación por etiqueta). `GSelect` sigue sin `multiple` |
| L41 | Rendimiento | La compuerta «500 opciones < 150 ms» con `multiple` se mide **con elegidas** (40) y con el grupo «Elegidas» o la cesta: los topes 12/6 de L36–L38 existen también por esto (WebKit sin tope, 91 filas: 165 a 284ms en el prototipo) |
| L42 | `forced-colors` | Casilla (`CanvasText`, marcada `Highlight`), marca de Retroceso (tachado se conserva), rastro y «Nueva» (texto): encargo a coco con medida |
