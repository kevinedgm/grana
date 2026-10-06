# Brief — `GCombobox`, r03: selección múltiple (`multiple`, Fase 2)

> kiwi, 2026-10-06. Continúa `../r01/` (base funcional de una opción) y `../r02/` (forma: A «el campo se abre», B paleta con vista previa, C el valor es un objeto), ya contratadas en `design/contracts/combobox.md` (#329 a #338, #356, #358). Nada de eso se reabre. Regla «conceptos antes que caja» (CLAUDE.md, «Personalidad e innovación»).

## Para qué

Elegir **varios** valores de un catálogo grande escribiendo: alergias, diagnósticos secundarios, responsables de una tarea, etiquetas de una nota, insumos de un carro. Decisión del usuario (#338): **es un modo del mismo componente**, no otro; la forma reservada es `modelValue` Array de `value` (`[]`, nunca `null`), `custom` Array de Strings, `selectedOptions`, un oculto por valor con el mismo `name`, `change` con arreglos, `labels.remove` y `labels.selected`.

## La premisa que se cuestiona

Todos los frameworks dibujan lo mismo: **fichas con una × amontonadas dentro del campo**, que hacen crecer la caja por líneas. Tiene tres problemas que la persona sí nota:

1. **El formulario salta.** Cada elección puede añadir una línea a la caja y empujar todo lo de debajo (medido en la referencia `?c=base`: 2 → 8 etiquetas en una columna de un tercio, la caja crece 168px y la línea siguiente baja 168px). Grana tiene el principio «sin saltos» (form r01 §11).
2. **Revisar es leer fichas recortadas.** «E11.9 Diab…» no se verifica; en clínica, lo que se eligió hay que poder leerlo entero.
3. **Quitar es fácil de hacer por error.** Una × de 24px junto a otra, y Retroceso sostenido para borrar el texto que se lleva también las fichas.

## Qué hay en esta ronda

| | Qué | Dónde viven los elegidos |
| --- | --- | --- |
| **Base** | Semántica, teclado, modelo, envío, tope, anuncios, deshacer, superficie y hoja (comunes). Se pinta con la forma convencional a propósito: es la **referencia** con la que se mide | Fichas con × dentro de la caja, que crece |
| **A · La frase** | Una línea, siempre | **En la línea del campo**, escritos como frase («Penicilina, Látex y 3 más»); al abrir, arriba de la lista en «Elegidas» |
| **B · La receta** | La caja es solo la búsqueda | **Debajo de la caja**, como renglones completos en orden, con rastro y «Deshacer» al quitar |
| **C · La cesta** | Elegir varios es una sesión | **En la paleta**, al lado de los resultados, siempre a la vista mientras se busca |

Los tres usan los componentes reales de `dist/` (`GInput` por sus slots internos `field` y `end`, `GSummary` en opciones, renglones y cesta con `summaryDiff`, `GAvatar`, `GForm`, `GFormLayout`, `GFormRow`, `GDialog`, `GBtn` y el **`GCombobox` real** de una opción en la fila del formulario) y los **tokens del tema por defecto**.

## Frontera (leída en los contratos)

| Necesidad | Usar | Por qué no el otro |
| --- | --- | --- |
| Varias de hasta ~7 opciones a la vista | `GCheckboxGroup` | No hay nada que buscar: verlas todas es mejor que escribir |
| Una opción de una lista conocida y corta | `GSelect` | Sin `multiple` (`select.md`); no se le añade |
| **Varias de un catálogo grande o del servidor; cada una es un `value` con su etiqueta; texto libre opcional y marcado** | **`GCombobox multiple`** (esta ronda) | — |
| **Etiquetas de texto sin catálogo** (correos, palabras clave, folios): lo escrito **es** el valor; separadores (coma, Intro, pegar varios) que parten el texto; validación por etiqueta (patrón); sugerencias opcionales | **`GTagInput`** (reservado, #338) | En `GCombobox multiple` pegar «penicilina, látex» es **un texto de búsqueda**, no dos valores; el texto libre es la excepción marcada (`custom`), no la regla, y entra solo por su fila |
| Filtrar una colección | `GFilterBar` | Su editor podrá componer `GCombobox` (reservado #338) |
| Archivos | `GFileField` | Su concepto A (fichas dentro de la caja que crece) es el precedente aprobado para **archivos**; aquí se cuestiona para **valores de catálogo**, que se eligen por decenas y se revisan por su texto |

## Semillas descartadas

- **Fichas navegables con ← → dentro de la caja.** Choca con la regla de la Fase 1 (← → son de edición del texto) y con la semilla descartada de r02 (navegación 2D). Las fichas de la referencia se alcanzan con Tab, como las de `GFileField`.
- **Carril de fichas con desplazamiento horizontal.** Esconde lo elegido detrás de un desplazamiento que el teclado y el lector no ven.
- **«+N» como única cesión** (patrón habitual de «límite de etiquetas»). Lo que queda detrás de «+N» no se alcanza ni se lee. A cede igual, pero **por texto** («y 3 más», legible e impreso) y con la lista completa en la descripción accesible y en «Elegidas».
- **Solo el recuento en el campo** («3 seleccionadas»). Rompe la identidad C de la Fase 1: el formulario en reposo debe decir **qué**, verificable en una captura o impreso.
- **Borrador con «Aplicar» en la superficie.** Duplicaría el modelo y el `change`; en la lista de `field` no hay borrador. El error se cubre con deshacer.
- **Tab que agrega.** En `multiple` Intro es la tecla de agregar y la lista sigue abierta; Tab sale. Sin la excepción del texto fantasma de la Fase 1.

## Ver

Con el servidor de la raíz en el puerto 4174: `http://localhost:4174/design/lab/combobox/r03/index.html?c=A` · `?c=B` · `?c=C` · `?c=base` (añadir `&dir=rtl`). Los seis casos (alergias, diagnósticos con tope 3, responsables homónimos, fila de formulario con el `GCombobox` real, 500 insumos con 40 elegidos, dentro de un `GDialog`) son los mismos en los cuatro.

Verificación: `node design/lab/combobox/r03/verificar.mjs` (`GRANA_PW_PORT=4212` por defecto; `CONCEPTS=A,B` y `ENGINES=chromium` para acotar; requiere `npm run build`).
