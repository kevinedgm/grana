# VoiceOver + Safari en macOS

Prefijo de pasos: **VM**. Lee antes el [README](./README.md) (qué es «bloquea 0.1.0», cómo registrar). Tiempo estimado: **2 h 30 min** completo; **1 h 55 min** solo los `[BLOQUEA 0.1.0]`; **1 h** solo el núcleo (los marcados `núcleo`).

## Preparación (10 min)

1. macOS y Safari actuales; anota las versiones en la plantilla de resultados.
2. **Safari → Ajustes → Avanzado → «Presionar Tab para resaltar cada elemento de una página web»**: actívalo (si no, Tab se salta botones y enlaces). Opción+Tab hace lo contrario.
3. **Teclas de función:** Ajustes del Sistema → Teclado → «Usar teclas F1, F2, etc. como teclas de función estándar». Si no, usa `Fn+F8` donde el guion diga `F8`.
4. Desactiva extensiones de Safari que toquen la página.
5. Sirve el playground (README § Qué preparar) y abre `http://localhost:4173/playground/`. Modo **Claro**, Tema **Por defecto**.
6. Enciende VoiceOver: `Cmd+F5`. En la **Utilidad VoiceOver → Visuales**, activa «Mostrar panel de subtítulos» (lo que dice el lector queda escrito: copia de ahí lo que se oyó). Deja la verbosidad por defecto.
7. En esta guía, **VO = Control+Opción**.

## Chuleta de VoiceOver

| Para | Teclas |
| --- | --- |
| Leer siguiente / anterior elemento | `VO+→` / `VO+←` |
| Leer todo desde aquí | `VO+A` |
| Activar | `VO+Espacio` |
| Entrar a un grupo / salir de él | `VO+Mayús+↓` / `VO+Mayús+↑` |
| Rotor (encabezados, enlaces, controles, tablas, puntos de referencia) | `VO+U`, ←/→ para cambiar de lista, ↑/↓ para elegir, `Intro` |
| Siguiente encabezado / control de formulario / tabla / lista | `VO+Cmd+H` / `VO+Cmd+J` / `VO+Cmd+T` / `VO+Cmd+X` |
| Detener la voz | `Control` |
| Navegar con Tab | `Tab` / `Mayús+Tab` (con el ajuste de Safari del punto 2) |
| Dentro de una tabla | `VO+Mayús+↓` para entrar, luego `VO+flechas` por celda |

**Cómo leer «Debe oírse»:** VoiceOver dice nombre, rol y estado; el orden y las palabras exactas varían. Lo que se pide es que **estén todos** y que **lo que cambia se anuncie**. Entre comillas, el texto del playground (en español).

---

## Formularios

### VM-01 · GForm: enviar vacío · `#sec-form` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:**
1. Ve a «Formulario corto». Recorre los campos con `VO+Cmd+J`: Nombre, Apellido, Correo, Teléfono, Extensión, Comentarios.
2. Con `Tab` llega a «Enviar» (botón) sin escribir nada y actívalo (`VO+Espacio`).

**Debe oírse / verse:**
- En el paso 1, cada campo con su **etiqueta, rol y «obligatorio»** (Extensión y Comentarios no); la ayuda de Correo («Te enviaremos la confirmación aquí.») se oye como descripción tras una pausa.
- En el paso 2, el foco **salta al resumen de errores** y se oye una alerta con el título «Hay N problemas con el formulario» (N = campos obligatorios vacíos: Nombre, Apellido, Correo y Teléfono; confirma el número con la pantalla).
- `VO+→` por el resumen: un **enlace por pregunta**, con el mismo texto que el error en línea.
- Los mensajes en línea de cada campo **no** se anuncian solos tras el envío (solo el resumen).

**Bloquea si:** el foco no llega al resumen, o el resumen no se oye ni al llegar el foco, o los enlaces no tienen nombre, o un campo obligatorio no dice que lo es.

**Nota (no bloquea):** si el título se oye dos veces (alerta + foco), anótalo; es una duda documentada del contrato.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-02 · GForm: del resumen al campo · `#sec-form` · [BLOQUEA 0.1.0]
**Hacer:** continúa de VM-01. En el resumen, sitúate en el enlace de «Correo» y pulsa `Intro` (o `VO+Espacio`).

**Debe oírse / verse:** el foco pasa al campo Correo, con su **etiqueta a la vista** (el campo no queda tapado) y se oye su nombre, «obligatorio» y el error como descripción (VoiceOver suele decir «entrada no válida» o equivalente).

**Bloquea si:** el foco queda en el enlace o en el `body`, o el campo enfocado no dice cuál es su error.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-03 · GForm: corregir y salir del campo · `#sec-form` · [no bloquea]
**Hacer:** en Correo escribe `ana` y pulsa `Tab`; luego vuelve (`Mayús+Tab`) y escribe `@correo.mx`. Observa el resumen.

**Debe oírse / verse:** al corregir, el elemento sale del resumen **en silencio** (nada se anuncia). Con un valor aún inválido, al salir del campo el mensaje en línea se anuncia de forma **cortés** (sin interrumpir).

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-04 · GInputGroup: teléfono fusionado · `#sec-form` · [BLOQUEA 0.1.0]
**Hacer:** en «Formulario corto» llega a «Teléfono» con `VO+Cmd+J` y recorre sus dos partes (selector de país, número).

**Debe oírse / verse:** el conjunto se anuncia como **grupo «Teléfono»**; cada parte dice **etiqueta + parte** («Teléfono Código de país», selector; el número como campo de texto, obligatorio). Las dos partes se distinguen entre sí.

**Bloquea si:** una parte no tiene nombre o dos partes dicen exactamente lo mismo y no se saben diferenciar.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-05 · GFormReveal: campos condicionales · `#sec-form` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** ve a «Bloque condicional (GFormReveal)». En «¿Requiere factura?» elige «Sí» con las flechas; pulsa `Tab`. Escribe algo en el primer campo del bloque, vuelve a «No» y otra vez a «Sí».

**Debe oírse / verse:**
- Al elegir «Sí» **no se anuncia nada** del bloque (no hay región viva por diseño); el siguiente `Tab` entra en el **primer campo nuevo** («Tipo de persona»).
- Con «No», los campos del bloque **desaparecen** de `Tab` y de `VO+→` (no se oyen ni se enfocan).
- Al volver a «Sí», **lo escrito se conserva**.

**Bloquea si:** el bloque abierto no se alcanza con teclado o VO; el cerrado sigue leyéndose o enfocándose (se rellenarían campos que no se envían); o lo escrito se pierde al cerrar y reabrir.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-06 · GFormSection: plegable y agregable · `#sec-form` · [BLOQUEA 0.1.0]
**Hacer:** ve a «Secciones fuera de GForm». Con `VO+Cmd+H` busca «Notas de la consulta» (sección plegable). Actívalo dos veces. Después prueba el botón de la sección agregable y quita lo agregado (te pedirá confirmar).

**Debe oírse / verse:** el título es **encabezado y botón** a la vez («Notas de la consulta, botón, contraído/expandido»); al activar cambia el estado y el **foco se queda** en el botón; el resumen («2 notas · última de hoy») se oye como descripción. Al quitar una sección con datos, se oye un **diálogo de alerta** de confirmación y, al terminar, el foco **no cae en el `body`**.

**Bloquea si:** no dice contraído/expandido, o el foco se pierde al plegar/quitar.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Tabla, filtros y carga

### VM-07 · GTable: estructura · `#sec-table` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** `VO+Cmd+T` (siguiente tabla) hasta «Clientes»; `VO+Mayús+↓` para entrar y recorre con `VO+flechas`.

**Debe oírse / verse:** «tabla, Clientes» con filas y columnas; los **encabezados** (Cliente, Plan, Estado, Alta…) se anuncian al moverte entre celdas; es una **tabla de datos, no una rejilla**: `Tab` recorre solo los controles (casillas, encabezados ordenables, menús).

**Bloquea si:** no se reconoce como tabla o las celdas no dicen su encabezado.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-08 · GTable: orden · `#sec-table` · [BLOQUEA 0.1.0]
**Hacer:** `Tab` hasta el encabezado «Cliente» (botón de orden) y actívalo; otra vez (descendente).

**Debe oírse / verse:** el botón dice su estado de orden (ascendente/descendente) y se anuncia «Ordenado por Cliente, ascendente» (luego «descendente»). El **foco se queda** en el botón.

**Bloquea si:** el orden cambia sin ningún anuncio ni estado en el encabezado.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-09 · GTable: selección · `#sec-table` · [BLOQUEA 0.1.0]
**Hacer:** marca la casilla de la primera fila y la de «Seleccionar todo»; desmarca una fila.

**Debe oírse / verse:** cada casilla tiene nombre propio («Seleccionar [cliente]»); la de «todo» pasa por **marcada / mixta / sin marcar** y VoiceOver dice «mezclado» en el estado intermedio; se anuncia el recuento («N seleccionados»).

**Bloquea si:** una casilla de fila no tiene nombre o el estado mixto no se comunica.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-10 · GFilterBar: crear, editar y quitar un filtro · `#sec-table` · [BLOQUEA 0.1.0]
**Hacer:** `Tab` hasta «Agregar filtro»; elige «Plan», valor «Pro», «Aplicar». Luego recorre el chip creado, edítalo y quítalo.

**Debe oírse / verse:** la barra es un grupo con nombre («Filtros de clientes»); el editor es un diálogo no modal con nombre («Filtrar por Plan»); si aplicas sin valor, un error visible **y** anunciado («Indica un valor para aplicar el filtro.»); el chip aplicado son **dos botones** («Editar filtro: …», «Quitar filtro: …»); tras filtrar se anuncia el recuento («N resultados»).

**Bloquea si:** el editor no se anuncia ni su foco entra en él, un botón del chip no tiene nombre, o aplicar/quitar no comunica el resultado.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-11 · GTable: carga · `#sec-table` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:**
1. **Anuncio.** Pulsa el botón «Simular carga» (después, «Carga lenta (6 s)») y espera sin tocar nada.
2. **Foco** (necesita la consola de Safari: Ajustes → Avanzado → «Mostrar funcionalidades para desarrolladores», luego `Opción+Cmd+C`). Pega `setTimeout(() => document.querySelector('#tb-simulate').click(), 5000)`, `Intro`, y en esos 5 s lleva el foco a la casilla de la **3.ª fila** (un clic de JavaScript no mueve el foco). Espera. Si no puedes abrir la consola, anota «paso 2 no probado».

**Debe oírse / verse:**
- Pasados ~200 ms: «Cargando clientes…». Con «Carga lenta»: a los 5 s, «Sigue cargando clientes…» (una sola vez).
- Al terminar: «N resultados» (el recuento ya actualizado).
- Paso 2: durante la carga el foco pasa a la tabla y, al llegar los datos, vuelve **a la misma casilla de la misma fila**; nunca queda en `body`.

**Bloquea si:** la carga o su fin no se anuncian de ningún modo, o el foco se pierde en `body`.

**Nota (no bloquea):** el orden de los anuncios frente a uno de «Ordenado por…» si coinciden; si VoiceOver calla mientras la tabla está ocupada (`aria-busy`), anótalo.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-12 · GTable: fallo y reintentar · `#sec-table` · [BLOQUEA 0.1.0]
**Hacer:** pulsa «Simular fallo»; espera; localiza el aviso y pulsa «Reintentar».

**Debe oírse / verse:** al terminar se anuncia «No se pudieron actualizar los clientes. Lo que ves es lo último que llegó.»; «Reintentar» es un botón con nombre; al activarlo vuelve a anunciarse la carga y el foco **no se pierde**.

**Bloquea si:** el fallo no se anuncia, o «Reintentar» no se alcanza con teclado.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-13 · GPagination y vacío por filtros · `#sec-table` · [no bloquea]
**Hacer:** pasa de página; luego aplica un filtro que no devuelva nada (Estado «vencido» con Plan «Básico», o texto sin coincidencias en Cliente) y activa «Limpiar filtros» en el vacío.

**Debe oírse / verse:** la paginación es una navegación con nombre («Paginación de clientes») y la página actual se indica; el vacío dice «Ningún cliente cumple estos filtros.» con un botón «Limpiar filtros» que funciona con teclado y deja el foco dentro de la tabla.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Menús y diálogos

### VM-14 · GMenu en la fila de la tabla · `#sec-table` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** `Tab` hasta el botón «Acciones de [cliente]» de una fila; ábrelo con `Intro`; baja con ↓; elige «Ver»; repite y cierra con `Esc`.

**Debe oírse / verse:** el botón se llama «Acciones de [cliente]»; al abrir, el foco entra en el primer elemento y se oye «menú», «Ver, elemento de menú»; `Esc` cierra y **el foco vuelve al botón**; al elegir, la última acción se actualiza bajo la tabla.

**Bloquea si:** el menú no se anuncia como menú, los elementos no tienen nombre, o `Esc`/elegir deja el foco en `body`.

**Nota:** con el menú abierto, VoiceOver a veces pide `VO+Mayús+↓` para interactuar; si hace falta, anótalo.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-15 · GMenu: teclado completo y submenús · `#sec-menu` · [BLOQUEA 0.1.0]
**Hacer:** abre «Acciones» con `Espacio`, con ↓ y con ↑ (probar las tres). Dentro: ↑↓, `Inicio`, `Fin`, una letra (salta al primero que empieza por ella), → para un submenú, ← para salir, `Tab` (cierra). Prueba también un elemento marcable (casilla) y uno deshabilitado.

**Debe oírse / verse:** ↓ abre con el foco en el primero y ↑ en el último; los elementos con casilla dicen **marcado / sin marcar**; el deshabilitado se oye «atenuado/no disponible» y se puede enfocar con teclado; el submenú dice que **tiene un menú emergente** y su estado; `Esc` en el submenú cierra solo ese nivel.

**Bloquea si:** los elementos marcables no comunican su estado, o no se puede abrir/cerrar con teclado.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-16 · GDialog simple · `#sec-dialog` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** coloca el foco en «Con inset y pie» y ábrelo. Lee todo con `VO+A`. Recorre con `Tab`. Cierra con `Esc`. Repite con «Guardar» y con el botón de cerrar.

**Debe oírse / verse:** al abrir se oye «Guardar cambios, diálogo» y su descripción; el foco entra en el primer control del contenido (no en el botón de cierre ni en el cuerpo); `Tab` **no sale** del diálogo; el botón de cierre se llama «Cerrar»; al cerrar, **el foco vuelve al botón que lo abrió**; lo de fuera no se lee mientras está abierto.

**Bloquea si:** no se anuncia como diálogo o sin nombre; se puede salir con `Tab` o `VO+→`; o el foco no vuelve.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-17 · GDialog: confirmación (alertdialog) · `#sec-dialog` · [BLOQUEA 0.1.0]
**Hacer:** abre «Confirmación».

**Debe oírse / verse:** se anuncia «¿Eliminar el proyecto?», como **diálogo de alerta** (alertdialog), y se lee la descripción («Se borrarán sus 24 archivos. Esta acción no se puede deshacer.»); el foco queda en un control del diálogo.

**Bloquea si:** la descripción no se oye al abrir o el foco no entra.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-18 · GDialog: scroll, formulario y cambios sin guardar · `#sec-dialog` · [no bloquea]
**Hacer:** abre «Con scroll»: con el foco en el cuerpo, desplázalo con las flechas. Abre «Formulario» y envía vacío. Abre «Con cambios sin guardar», pulsa `Esc` con la casilla marcada.

**Debe oírse / verse:** el cuerpo desplazable solo es tabulable cuando su contenido no cabe, y se llama como el título («región»); el envío vacío anuncia el resumen igual que VM-01; con cambios sin guardar, `Esc` no cierra pero el botón «Cerrar» sí.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Búsqueda y selección

### VM-19 · GCombobox: buscar y elegir · `#sec-combobox` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** en «Paciente entre miles», enfoca el primer campo («Paciente»), escribe `mar`, espera 1 s, baja con ↓ tres veces, sube con ↑, pulsa `Intro`. Después escribe otra vez y `Esc`. Prueba «Limpiar Paciente» con `Tab`.

**Debe oírse / verse:**
- Se oye «Paciente, combobox (cuadro combinado), obligatorio…, la lista está contraída/expandida» y, al escribir, **un solo** anuncio de resultados a los ~600 ms («20 de 2 400 resultados» o similar).
- ↓/↑ anuncian **cada opción** («…, opción 3 de 20») mientras **el foco sigue en el campo**.
- `Intro` elige y cierra; `Esc` cierra y conserva el texto; **enfocar no abre** la lista.
- El botón de limpiar se llama «Limpiar Paciente».

**Bloquea si:** las opciones no se anuncian al navegar, el combobox no dice que es una lista desplegable con estado expandido, o elegir con teclado no funciona.

**Nota (no bloquea):** el eco de escritura con la primera opción activa y el «texto fantasma» (completado) pueden leerse de forma extraña; anótalo.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-20 · GCombobox: homónimas, paleta y errores · `#sec-combobox` · [no bloquea]
**Hacer:** busca `maria garcia` (4 homónimas) y elige una; después prueba la paleta con vista previa; en «Error de carga con Reintentar» pulsa «Fallar la próxima búsqueda», escribe y usa la fila «Reintentar»; en la lista de 500 usa «Mostrar más».

**Debe oírse / verse:** al elegir, la línea secundaria (expediente y edad) se oye como **descripción** del campo; las filas de acción («Reintentar», «Mostrar más») se oyen como una opción más, con su número; el fallo de carga se anuncia.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-21 · GCombobox: abierto en un GDialog · `#sec-combobox` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** «Abrir diálogo» (en esa sección), busca algo dentro, y comprueba que oyes los resultados y que `Esc` cierra primero la lista y luego el diálogo.

**Debe oírse / verse:** los anuncios de resultados **se oyen dentro del modal** (si no se oyen, la región viva quedó fuera del diálogo); el primer `Esc` cierra la lista, no el diálogo.

**Bloquea si:** dentro del diálogo no se anuncia nada al buscar.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-22 · GCombobox multiple, A «la frase» · `#sec-combobox-multiple` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** en «A · La frase: alergias», abre con ↓, marca 3 opciones con `Intro` (la lista sigue abierta), desmarca una, escribe texto libre y agrégalo, cierra con `Esc` y `Retroceso` dos veces; prueba `Cmd+Z`.

**Debe oírse / verse:** cada gesto da **un anuncio** («[elemento] agregado, N elegidas», «quitado», «restaurado»); las opciones dicen **seleccionada / no seleccionada**; la descripción del campo lista **todas** las elegidas («5 seleccionadas: Penicilina, Látex…»); la frase visual no se lee dos veces (está oculta al lector).

**Bloquea si:** marcar/desmarcar no se comunica de ninguna manera, o las elegidas no se pueden conocer.

**Nota (no bloquea):** un anuncio duplicado con `aria-selected` se documenta como posible.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-23 · GCombobox multiple, B «la receta» y C «la cesta» · `#sec-combobox-multiple` · [no bloquea]
**Hacer:** en B agrega 3 diagnósticos (el máximo) y prueba un cuarto, «Quitar» y «Deshacer»; en C abre la paleta y elige dos «Ana López Ruiz».

**Debe oírse / verse:** los renglones se leen como **lista numerada**; el tope se anuncia («máximo…»); el foco pasa a «Deshacer» tras quitar y vuelve; las homónimas se distinguen por su ficha.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-24 · GSelect · `#sec-select` · [BLOQUEA 0.1.0]
**Hacer:** abre el selector con `Espacio`, baja con ↓ y elige con `Intro`; repite con `Tab` para elegir; `Esc` cierra sin cambiar. Prueba la fila «Agregar nuevo…» si la hay.

**Debe oírse / verse:** se oye como selector/combobox con su valor, «expandido» al abrir; cada opción con su posición; el foco **no sale** del selector mientras está abierto; `Esc` no cambia el valor.

**Bloquea si:** el valor elegido no se oye al cerrar o no se puede operar con teclado.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Tooltip y ayudas

### VM-25 · GTooltip: pestaña que viaja · `#sec-tooltip` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** en «Barra de herramientas y riel», `Tab` por los botones de iconos y `→`/`←` entre ellos; `Esc`. Prueba también «Publicar», «Archivar» y «Borrar» (el último es de nativo deshabilitado).

**Debe oírse / verse:** al llegar a cada botón, VoiceOver dice **su nombre** (el de la etiqueta) y, si hay, su **descripción y atajo**; el tooltip **no recibe foco** ni añade paradas de `Tab`; `Esc` lo cierra sin mover el foco; una pista solo visible no pierde el nombre del control.

**Bloquea si:** un botón de solo icono se oye sin nombre, o el tooltip roba el foco.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-26 · GTooltip: sobre campos y en un diálogo · `#sec-tooltip` · [no bloquea]
**Hacer:** en «Dentro de un diálogo y sobre campos», abre el diálogo y recorre la barra; prueba «Calcular» y «Expediente».

**Debe oírse / verse:** dentro del diálogo, las etiquetas se oyen igual (viven dentro del modal); el atajo se oye como «atajo de teclado».

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-27 · GHelper · `#sec-helper` · [BLOQUEA 0.1.0]
**Hacer:** `Tab` al disparador «Abrir ayuda»; ábrelo con `Intro`; `Tab` al contenido; `Esc`.

**Debe oírse / verse:** botón «Abrir ayuda» con estado expandido/contraído; el contenido es un **diálogo no modal** llamado «Ayuda»; `Esc` cierra y el foco vuelve al disparador; solo hay un helper abierto a la vez.

**Bloquea si:** no dice el estado o `Esc` no devuelve el foco.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Captura de voz y transcripción

> Para estos pasos abre `http://localhost:4173/playground/?speech=self#sec-speech` (el adaptador simula el micrófono; no se pide permiso). Las teclas `F8` pueden requerir `Fn`.

### VM-28 · Voz: dictado a un campo · `#sec-speech` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** en «Dictado a un campo», `Tab` al botón que sigue a «Observaciones» («Dictar en Observaciones») y actívalo. Espera ~10 s. Luego busca el botón «Finalizar» de la pill (arriba de la página) con `Mayús+F8`, actívalo.

**Debe oírse / verse:**
- Al activar: «Grabando. Dictado en Observaciones.» (anuncio cortés).
- El texto dictado va entrando en el campo; **el lector no lee el texto transcrito** (por diseño, solo el ciclo de vida) y el foco no se mueve.
- Al finalizar: «Dictado terminado. Texto añadido a Observaciones.».

**Bloquea si:** no se anuncia que la grabación empezó/terminó, o el foco se mueve solo.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-29 · Voz: pill, pausa y atajo `Mayús+F8` · `#sec-speech` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** inicia otro dictado. Pulsa `Mayús+F8`: el foco va a la pill. Pausa (botón «Pausar»), observa el nombre del botón y el foco; «Reanudar»; `Mayús+F8` otra vez.

**Debe oírse / verse:** la pill se identifica («Grabación de voz», estado «Grabando») con la **duración** como temporizador (`timer`, sin leerse cada segundo); al pausar se oye «En pausa…»; el botón pasa de «Pausar» a «Reanudar» y **el foco no se pierde** (va al botón nuevo o al título del panel); `Mayús+F8` vuelve a donde estabas.

**Bloquea si:** el estado de la grabación no es perceptible con el lector, o el foco cae en `body`.

**Nota (no bloquea):** cómo se lee el temporizador y si «Reanudar» se oye con el foco encima.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-30 · Voz: dentro de un diálogo modal · `#sec-speech` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** «Abrir un diálogo modal», dicta en «Nota de derivación» y observa los anuncios; cierra el diálogo con la grabación en marcha.

**Debe oírse / verse:** los anuncios **se siguen oyendo dentro del modal** (los canales se trasladan); la pill aparece dentro del diálogo; al cerrar, la sesión continúa y los anuncios vuelven a la página.

**Bloquea si:** dentro del modal no se oye ningún anuncio.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-31 · Voz: conversación, panel y errores · `#sec-speech` · [no bloquea]
**Hacer:** en «Conversación que continúa al cambiar de pestaña», «Grabar conversación» (marca la casilla «He avisado a los participantes de que se graba»), cambia de pestaña, abre el panel, usa «Perder el servicio» y «Restablecer», «Fallar el siguiente fragmento».

**Debe oírse / verse:** al abrir el panel el foco va a su título; los avisos «Se perdió el servicio de transcripción. Reconectando. La grabación continúa.» y «Servicio de transcripción restablecido.» se oyen; un fragmento fallido se anuncia («No se pudo transcribir un fragmento. La grabación continúa.») y no detiene la captura.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-32 · GTranscript: rejilla de datos · `#sec-speech` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** baja a «Transcripción guardada, sin sesión» (modo editable). Entra en la rejilla con `Tab` (una sola parada). Con las flechas ↑↓←→ recorre celdas; `Inicio`/`Fin`, `RePág`. Prueba con VoiceOver en modo **interacción** (`VO+Mayús+↓` sobre la tabla) y fuera.

**Debe oírse / verse:** se oye una tabla/rejilla con columnas (Selección, Hora, Hablante, Texto, Acciones); cada celda dice su columna; hay **una sola parada de `Tab`** (no una por celda); la ayuda de teclado («Teclado: flechas para moverte · Intro o F2 edita…») está disponible.

**Bloquea si:** la rejilla no se puede recorrer con teclado, o el lector no dice dónde estás (fila y columna).

**Nota:** anota cuándo VoiceOver intercepta las flechas (modo exploración) y cuándo las deja pasar a la rejilla.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-33 · GTranscript: editar, seleccionar y deshacer · `#sec-speech` · [BLOQUEA 0.1.0]
**Hacer:** sobre una celda de Texto pulsa `Intro` (editar), cambia una palabra, `Intro` para guardar; vuelve a editar y `Esc`. Selecciona una fila con `Espacio`, amplía con `Mayús+↓`, `Supr`, `Cmd/Ctrl+Z`.

**Debe oírse / verse:** el editor es un **grupo con nombre** («Editar fragmento de las 09:00»), con su campo y botones Guardar/Cancelar; se anuncia «Fragmento de las … corregido. El original se conserva.»; la selección se anuncia («N fragmentos seleccionados»); eliminar y deshacer se anuncian («… eliminado. Puedes restaurarlo.», «Deshecho: …»).

**Bloquea si:** editar no es posible con teclado, o la corrección/eliminación no se comunica y se pierde texto sin aviso.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Controles de valor

### VM-34 · GSlider: valor único · `#sec-slider` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** en «Valor único, marcas con nombre y “sin elegir”», `Tab` al control de volumen. Cambia con → ← ↑ ↓, `Mayús+→`, `RePág`, `Inicio`, `Fin`. Prueba también `VO+Mayús+↓` y las flechas arriba/abajo (VoiceOver trata el control como **ajustable**).

**Debe oírse / verse:** «Volumen de los avisos, ajustable, 40 %» (nombre + rol + valor); cada paso anuncia el valor nuevo con su `valuetext` (p. ej. «45 %»); una marca con nombre dice «5, Moderado»; en el límite no cambia nada.

**Bloquea si:** el control no se anuncia como ajustable, no se oye el valor, o no se puede cambiar con teclado.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-35 · GSlider: rango, «sin elegir» y teclear la cifra · `#sec-slider` · [BLOQUEA 0.1.0]
**Hacer:** en «Rango de precio (es-MX)»: recorre las dos asas con `Tab`; mueve cada una; intenta cruzar una por la otra. En «sin elegir»: ↑ y ↓. En la píldora enfocada, teclea una cifra y `Intro`.

**Debe oírse / verse:** el rango es un **grupo con nombre** y cada asa dice «inicio» / «fin»; no pueden cruzarse (el inicio se detiene antes del fin); «sin elegir» se oye con su texto; al teclear una cifra, el valor anunciado no cambia hasta confirmar.

**Bloquea si:** las dos asas no se distinguen o el valor no se oye.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-36 · GNumberField · `#sec-number` · [BLOQUEA 0.1.0]
**Hacer:** en «Casos», `Tab` a un campo numérico. ↑ ↓, `RePág`, escribe un valor con decimales y sal con `Tab`; pulsa − / + con el ratón (no están en `Tab`).

**Debe oírse / verse:** «control de número / spinbutton», con valor en el formato del idioma (con separador de miles si lo lleva); cada ↑/↓ anuncia el valor nuevo; al sobrepasar el límite no cambia.

**Bloquea si:** el valor no se oye o no se puede ajustar con teclado.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-37 · GTimeField · `#sec-time` · [no bloquea]
**Hacer:** en «Casos (24 h, es)», escribe `930`, `9:30 pm`, `nueve y media` si lo admite; ↑↓; en «12 h» prueba los botones a. m. / p. m. y las teclas `a` / `p`.

**Debe oírse / verse:** se oye la hora; **límite documentado:** en Chromium la franja en palabras («de la noche») no llega al lector; comprueba si en Safari/VoiceOver sí llega y anótalo. Los botones a. m. / p. m. tienen nombre.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-38 · GCheckbox, GRadioGroup y GSwitch · `#sec-checkbox`, `#sec-radio`, `#sec-switch` · [BLOQUEA 0.1.0]
**Hacer:** recorre una casilla, una casilla «mixta» (grupo con casilla maestra), un grupo de radios (flechas) y un interruptor (`Espacio`; `Intro` no alterna). En radios, prueba las apariencias `inline`, `card` y la de solo icono.

**Debe oírse / verse:** casilla: nombre y «marcada/sin marcar/mixta»; grupo de radios: «grupo de radio, [etiqueta]», cada opción con su posición («1 de 3»), **las flechas mueven y eligen**; la ayuda y el error como descripción; interruptor: «interruptor, activado/desactivado»; `readonly` se oye como solo lectura.

**Bloquea si:** un estado (marcada/mixta/activado) no se comunica, o un grupo de radios no tiene nombre.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Etiquetas, acordeón, migas, carga

### VM-39 · GTag y GTagGroup: huella y deshacer · `#sec-tag` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** en «Flow con huella (A)»: recorre la lista con `Tab`; en una etiqueta quitable activa «Quitar [etiqueta]»; observa el foco; activa «Deshacer: quitar [etiqueta]»; quita dos seguidas rápido. Prueba «Quitar todas» y «Agregar alergia».

**Debe oírse / verse:** la lista dice «lista, N elementos»; el botón de quitar se llama «Quitar Látex»; al quitar, se anuncia («Látex quitada») y **el foco queda en «Deshacer: quitar Látex»** en el mismo sitio; con dos gestos seguidos, se anuncia **el último** (comportamiento aceptado).

**Bloquea si:** quitar no se comunica ni deja forma de deshacerlo con teclado, o el foco cae en `body`.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-40 · GTag: racimo, alternar y grupo vacío · `#sec-tag` · [no bloquea]
**Hacer:** en «Racimos (B)», recorre un racimo; en «Alternar» activa etiquetas con `Espacio`; quita todas las etiquetas de un grupo y observa dónde queda el foco.

**Debe oírse / verse:** las etiquetas de alternar dicen **pulsado/no pulsado** (no cambia su nombre); el racimo anidado se entiende; con el grupo vacío, el foco queda en el sitio configurado (`emptyFocus`) y no en `body`.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-41 · GAccordion · `#sec-accordion` · [BLOQUEA 0.1.0]
**Hacer:** en «Preguntas frecuentes»: `VO+Cmd+H` (encabezados), `Tab` entre botones, ↓/↑ entre encabezados, `Inicio`/`Fin`, `Intro` para abrir; prueba uno deshabilitado.

**Debe oírse / verse:** cada título es **encabezado + botón** con «contraído/expandido»; cerrado, el **avance** (primera línea) se oye como descripción; el contenido abierto se identifica (con 6 o menos elementos o `exclusive`: como **región** con el nombre del título; con 7 o más, sin región); abrir **no mueve el foco**; el deshabilitado dice «no disponible» pero se alcanza.

**Bloquea si:** no dice contraído/expandido, o los encabezados no aparecen en el rotor.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-42 · GBreadcrumbs · `#sec-breadcrumbs` · [BLOQUEA 0.1.0]
**Hacer:** `VO+Cmd+L` / `Tab` por la ruta; observa el nivel actual; abre una «puerta» (nivel con hermanos) con `Intro` o ↓; recorre su panel; `Esc`.

**Debe oírse / verse:** «navegación, Ruta de navegación», «lista, N elementos» (**si VoiceOver no dice «lista»**, anótalo: es una duda documentada, sin bloquear por sí sola); el último nivel se oye como **«página actual»**; la puerta dice su estado expandido/contraído; el hijo de la ruta se marca (`aria-current`); `Esc` devuelve el foco al disparador.

**Bloquea si:** no se identifica la página actual, o la puerta no se opera con teclado.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-43 · GLoadRegion: primera carga · `#sec-load-region` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** pulsa «Cargar todo (primera carga)» y espera. Recorre la región con `VO+→` mientras carga.

**Debe oírse / verse:** al verse la carga (~200 ms) se anuncia la frase de espera de las regiones (frases fusionadas en **una** si hay varias); durante la espera el **molde** (forma sin texto) **no se lee** como datos reales; al terminar se anuncia «lo que se ve»: el recuento o el título del vacío; nunca más de tres anuncios por carga.

**Bloquea si:** el fin de la carga no se anuncia, o el molde se lee como si fueran datos.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-44 · GLoadRegion: refrescar, fallo y foco · `#sec-load-region` · [BLOQUEA 0.1.0]
**Hacer:** abre la consola (como en VM-11) y pega `setTimeout(() => document.querySelector('#lr-go-refresh').click(), 5000)`; en esos 5 s lleva el foco a un enlace de «Muestras» y espera. Si no puedes abrir la consola, pulsa «Refrescar la lista» y anota «foco no probado». Si el banco ofrece un fallo, activa «Reintentar».

**Debe oírse / verse:** lo de antes sigue a la vista y legible mientras refresca; el foco, si estaba en lo que se refresca, pasa a la raíz de la región y **vuelve al mismo enlace** (misma clave) al llegar; nunca a `body`; «Reintentar» se activa con teclado.

**Bloquea si:** el foco cae en `body` o se pierde.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-45 · GEmpty · `#sec-load-region` · [no bloquea]
**Hacer:** en «Vacíos con causa», recorre cada vacío (sin resultados, filtrado, error, etc.).

**Debe oírse / verse:** el título y la causa se leen como contenido, sin anuncios propios; los botones («Limpiar filtros», «Reintentar») tienen nombre; la traza del filtro se lee con su texto aislado (`<bdi>`).

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Avisos, estado y navegación

### VM-46 · GToaster · `#sec-toaster` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** pulsa «Éxito», «Error con acción», «Ráfaga de 6» y «Promesa que falla». Con un aviso visible pulsa `F8` (lleva el foco a su acción), `Tab` por los avisos, `Esc`.

**Debe oírse / verse:** cada aviso se **anuncia al aparecer** («Error: Falló. Pulsa F8 para Reintentar.»); el error usa el canal enérgico; **el foco no se mueve** por sí solo; `F8` lleva a la acción del aviso más reciente y `F8` otra vez devuelve el foco; `Esc` cierra el aviso con el foco dentro.

**Bloquea si:** un aviso no se anuncia, o un aviso roba el foco.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-47 · Isla de estado · `#sec-status` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** recarga con `?status=seed#sec-status` (hay un aviso al cargar: **no debe anunciarse**). Pulsa «Sin conexión» y «Mantenimiento (descartable)»; `Alt+F8` (con `Fn` si hace falta); `Intro` en el resumen; `Esc`; `Alt+F8` otra vez. Prueba «Sesión por caducar (0:33)».

**Debe oírse / verse:** al cargar con aviso, **0 anuncios**; una condición nueva se anuncia una vez («Error: …» por el canal enérgico, el resto cortés); el resumen es un **botón** con el estado («Estado: 3 avisos. Error: título, y 2 más», contraído/expandido); `Alt+F8` abre y lleva el foco al resumen, y otra vez devuelve el foco a donde estabas; `Esc` repliega; el temporizador de sesión anuncia por umbrales (5 min, 1 min, 30 s), no cada segundo.

**Bloquea si:** una condición grave no se anuncia, o abrir/cerrar deja el foco perdido.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-48 · GTabs · `#sec-tabs` · [BLOQUEA 0.1.0]
**Hacer:** `Tab` a la lista de pestañas; ← → (y `Inicio`/`Fin`) entre ellas; `Intro` en modo manual; `Tab` al panel; prueba «Más pestañas» si aparece.

**Debe oírse / verse:** «lista de pestañas, Pestaña 1 de N, seleccionada»; solo la pestaña activa está en `Tab` (las demás con flechas); el panel se relaciona con su pestaña y se anuncia su nombre; el estado de carga se anuncia («[pestaña]: cargando / listo»).

**Bloquea si:** la pestaña activa no dice que está seleccionada, o no se llega al panel con teclado.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Resto de campos y superficies

### VM-49 · GFileField · `#sec-file-field` · [BLOQUEA 0.1.0]
**Hacer:** en «Fotos de la lesión»: `Tab` al control; `Espacio` abre el diálogo del sistema (elige un archivo); «Añadir tres fotos de prueba», «Añadir una que falla»; recorre las fichas y sus botones; envía con un archivo pendiente o fallido.

**Debe oírse / verse:** el control tiene nombre compuesto («Fotos de la lesión» + estado); la lista de archivos es una **lista con nombre**; cada ficha tiene botones con nombre (Quitar, Reintentar, Cancelar subida); los avisos de subida («Subiendo 3.», «[nombre] subido.») se anuncian por lote; un fallo se oye con su motivo; enviar con pendientes o fallidos se bloquea con un mensaje.

**Bloquea si:** una ficha no se puede quitar/reintentar con teclado o el fallo no se comunica.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-50 · GDatePicker · `#sec-datepicker` · [BLOQUEA 0.1.0]
**Hacer:** abre el selector con `Intro`; flechas, `RePág`/`AvPág` (mes), `Mayús+RePág` (año), `Inicio`/`Fin`, `Intro` para elegir, `Esc`. Prueba un rango si lo ofrece.

**Debe oírse / verse:** el campo dice su valor y que abre una cuadrícula; cada día se oye con **fecha completa y estado** (seleccionado, hoy, deshabilitado); al cambiar de mes el título se anuncia; `Esc` devuelve el foco al campo.

**Bloquea si:** no se oye qué día está enfocado, o no se puede elegir con teclado.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-51 · GSidebar · `#sec-sidebar` · [no bloquea]
**Hacer:** recorre la barra lateral con `Tab`, ↑↓, `Inicio`/`Fin`; abre un padre con `Intro`, `→`/`←`, `Esc` en el panel del riel; prueba el navbar.

**Debe oírse / verse:** navegación con nombre; el item del destino real se oye como «página actual»; los padres dicen expandido/contraído; los contadores se leen con su item.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-52 · GAvatar y GBadge · `#sec-gavatar`, `#sec-badge` · [no bloquea]
**Hacer:** recorre avatares decorativos, con nombre y dentro de un botón; insignias con y sin texto.

**Debe oírse / verse:** un avatar decorativo **no se lee**; con nombre se oye «imagen, [nombre]» (sin duplicar el texto de al lado); una insignia sin texto, anclada a un avatar, no debe ser la única fuente de un estado importante (anota si el estado de presencia se pierde para el lector).

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VM-53 · GStepper y GProgress · `#sec-stepper`, `#sec-widget` · [no bloquea]
**Hacer:** recorre el stepper y las barras de progreso.

**Debe oírse / verse:** el stepper es una lista que dice el total de pasos; el paso actual se indica («paso actual») y cada paso dice su estado (completado, pendiente…); el progreso dice «barra de progreso» y su valor («45 %»).

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

Al terminar: apaga VoiceOver (`Cmd+F5`) y registra el resultado en la plantilla.
