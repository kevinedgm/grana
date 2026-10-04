# Declaración — `GCombobox`, r02: tres conceptos de forma

> kiwi, 2026-10-04. Prototipo: `index.html?c=A|B|C|AC` sobre el motor de `../r01/combo.js`, componentes reales de `dist/` y tokens del tema por defecto. Verificación: `verificar.mjs` (la batería de r01 más lo propio de cada concepto) en Chromium, Firefox y WebKit; cifras en «Comprobaciones». La base funcional (r01) es común a los tres y no se repite aquí.

## Los mismos casos en los tres

Paciente entre miles (servidor, 2 400 registros, cuatro homónimas «María García López»), diagnóstico CIE-10 (34 códigos en 10 grupos), medicamento con texto libre, cliente con «Agregar», fila de formulario de tres, solo lectura, deshabilitado, error, dentro de `GDialog`, 500 opciones, móvil 375 y 320, RTL, reduced motion.

---

## A · El campo se abre

**Estructura.** El panel no es una caja aparte a 4px del campo. Abierto, la forma es **una**: el contorno, el anillo de foco y la sombra abrazan campo y lista; entre ambos solo hay una línea fina. La lista sigue en la capa superior (no empuja la página), pero su caja empieza en el borde superior del campo y su zona alta es transparente y no captura el puntero: el campo real se ve y se usa a través de ella. Si no cabe debajo, crece hacia arriba y el contorno termina en el borde inferior del campo.

**Comportamiento.** La primera coincidencia **por prefijo** se completa en el propio campo como texto fantasma (decorativo, `aria-hidden`; el lector recibe la opción por `aria-activedescendant`). `→` con el cursor al final acepta el texto sin elegir; Intro elige; **Tab elige solo si la etiqueta completada es única** entre los resultados a la vista. Con homónimas, el campo completa el nombre pero Tab no elige.

**Movimiento.** La lista se despliega desde la línea del campo (`grid-template-rows` 0fr → 1fr, `--g-duration-slow`, `--g-ease-spring`). La opción activa lleva una barra al inicio, no un contorno: dentro de una forma única, un segundo contorno compite.

### Qué lo hace distinto (A)

El combobox genérico son dos objetos: un campo y un menú que flota. Aquí es **uno que cambia de tamaño**, así que nadie tiene que relacionar el panel con su campo en un formulario denso. Y el campo **se completa a sí mismo**: para quien captura decenas de diagnósticos al día, «diab» + Tab es una receta entera sin mirar la lista.

### Gana y arriesga

- **Gana:** continuidad espacial; velocidad de captura con etiquetas únicas (diagnóstico, medicamento, cliente, colonia); un solo anillo de foco.
- **Arriesga:** el panel **no puede ser más ancho que el campo** (dejaría de ser una forma). Medido: en una `GFormRow` de tres el campo mide 239px y el panel 239px (base y C ensanchan a 320px; B, 736px); las fichas se apilan. El texto fantasma solo aparece con coincidencia por prefijo (no al buscar por expediente o código). Convive mal con `GInputGroup` y con el slot `action` de `GInput` (cajas fusionadas): sin medir.

### Medidas (A)

| Medida | Resultado |
| --- | --- |
| Una sola forma | Δ izquierda, arriba y ancho entre caja y contorno abierto < 1px; costura campo-lista < 1.5px; también abriendo hacia arriba |
| El campo sigue usable bajo la forma | El punto central del campo devuelve el `<input>`; `pointer-events: none` en la capa |
| Texto fantasma | «ía García López» tras «mar»; `aria-hidden`; contraste 6.56:1 |
| Tab | Con cuatro homónimas no elige; con etiqueta única («diab») elige E10.9 |
| Δ0 | Campo, página y alto del documento no cambian al abrir |
| Reduced motion | Sin transición ni animación en curso |
| 320px y móvil | Hoja común (la continuidad se pierde: en móvil A es igual que los demás) |
| RTL | Contorno alineado al borde de inicio de la caja y avatar al inicio (medido); la barra de la activa se refleja por CSS (no medido) |

**Coste:** medio. Forma y despliegue son CSS; la capa transparente y el texto fantasma piden medir la posición del `<input>` dentro de la caja. **Riesgos:** ancho en campos estrechos; `forced-colors` sin medir; el texto fantasma con IME sin medir.

---

## B · Paleta con vista previa

**Estructura.** Al activarlo (clic, Intro, ↓, o simplemente escribir con el foco en el campo: la primera tecla no se pierde), el campo se eleva a una **superficie modal** con su propio campo grande, los resultados a un lado y, al otro, la **ficha de la opción activa**: expediente, edad, sexo, última visita, médico tratante. En móvil es la hoja de r01 sin ficha: **la misma estructura en escritorio y en móvil**.

**Comportamiento.** El campo de la página queda como disparador (`aria-haspopup="dialog"`). Dentro, el `combobox` de APG completo. La ficha cambia con ↑ ↓. La opción activa se pinta invertida (texto sobre fondo de texto). Esc y el fondo cierran sin elegir y devuelven el foco al campo.

**Movimiento.** La superficie nace del rectángulo del campo y crece hasta su sitio (`--g-duration-slow`, `--g-ease-out`), como `GDialog` desde su disparador (#301).

### Qué lo hace distinto (B)

Entre cuatro «María García López», una lista no basta: hay que **ver a la persona antes de elegirla**. La ficha convierte la elección en una comprobación. Y al ser la misma superficie en móvil y escritorio, quien aprende una sabe usar la otra.

### Gana y arriesga

- **Gana:** elección segura entre homónimos; sitio para resultados ricos; un solo modelo mental en todos los tamaños; el panel no depende del ancho del campo.
- **Arriesga:** es **modal**: tapa el formulario mientras se busca (no se puede mirar el dato de al lado), y para un código postal o un medicamento es desproporcionado. Dentro de un `GDialog` es modal sobre modal. La ficha exige que la aplicación entregue más datos por opción. Son dos `combobox` (disparador y superficie): por verificar con lector real.
- **Regla que deja fijada:** la ficha **nunca es la única fuente** del dato que distingue; ese dato va también en la opción (medido).

### Medidas (B)

| Medida | Resultado |
| --- | --- |
| Primera tecla | Escribir «maría garcía lópez» sobre el campo abre la paleta con el texto completo |
| Ficha | Cuatro homónimas: ↓ cambia el expediente de la ficha; región con nombre «Vista previa» |
| Modal | `:modal`, dentro del visor, foco en su campo; Tab no llega a la página; Esc y el fondo cierran y devuelven el foco |
| Sobre `GDialog` | Elige, vuelve al campo y el diálogo sigue abierto |
| Contraste | Opción activa invertida 17.4:1 |
| Δ0 | Trivial: nada se mueve en la página |
| Reduced motion | Sin animación de entrada |
| 320px | Hoja de ancho completo, opciones ≥ 44px, sin desbordamiento |

**Coste:** el menor de los tres **sobre la base**: la superficie modal es la hoja móvil que hay que construir de todos modos; añade la disposición de paleta y un slot `preview`. **Riesgos:** pérdida de contexto; lectores con dos `combobox`.

---

## C · El valor es un objeto

**Estructura.** El campo en reposo con valor no enseña una cadena: enseña una **ficha** dentro de la caja, a la altura de siempre (Δ0): avatar (`GAvatar`), nombre y, apagado, lo que identifica («Exp. 001000 · 22 años»); para un diagnóstico, el código en su caja y la descripción; para un texto libre, un lápiz, cursiva y «Texto libre». Debajo sigue estando el `<input role="combobox">` con su valor (el nombre), y el dato secundario va en `aria-describedby`. La ficha es visual (`aria-hidden`) y no captura el puntero.

**Comportamiento.** Con el foco, la ficha se ve **seleccionada entera**: escribir la reemplaza, Retroceso la vacía, clic o ↓ abren la lista y devuelven el texto editable. Esc dos veces la recupera. Los resultados son **fichas** (una columna): nombre con la coincidencia marcada y los datos que distinguen con su rótulo (Exp., Edad, Última visita).

**Movimiento.** Al elegir, la ficha **viaja** de su fila en la lista a su sitio en el campo (`--g-duration-slow`, `--g-ease-spring`): lo que se eligió es lo que quedó.

### Qué lo hace distinto (C)

Un combobox pasa el 99 % de su vida cerrado, y ahí todos los frameworks enseñan lo mismo: un texto. En un expediente, «María García López» no identifica a nadie. **El formulario en reposo dice a quién y qué**, y se puede comprobar de un vistazo, en una captura o impreso, sin abrir nada. Y distingue lo que viene del catálogo de lo que alguien tecleó: una receta con «Texto libre» se ve distinta de una con medicamento del cuadro básico.

### Gana y arriesga

- **Gana:** identidad verificable en reposo; diferencia visible entre catálogo y texto libre; coherente con `GAvatar` y con las píldoras de Grana; no cambia nada de la apertura (se suma a A, a B o a la base).
- **Arriesga:** en campos estrechos el dato secundario se recorta primero (medido a 320px: el nombre conserva sitio). El texto real del `<input>` se vuelve transparente bajo la ficha: en `forced-colors` hay que retirar la ficha y dejar el texto (sin medir). La aplicación debe entregar el dato secundario por opción.

### Medidas (C)

| Medida | Resultado |
| --- | --- |
| Ficha | Avatar + nombre + «Exp. N · N años»; diagnóstico con código; texto libre con marca |
| Para el lector | Valor del campo = nombre; expediente/edad, código o «Texto libre» en `aria-describedby`; ficha `aria-hidden` |
| Δ0 | El alto del campo con ficha es el mismo que vacío |
| Edición | Escribir sobre la ficha la reemplaza y busca; Esc ×2 la recupera; clic abre |
| Fichas en la lista | Datos con rótulo (Exp., Edad, Última visita) en cada opción |
| Contraste | Dato secundario 7.46:1 |
| Reduced motion | Elegir no anima |
| 320px | La ficha cabe en la caja; sin desbordamiento |

**Coste:** medio. Un slot `value` (o campos `token`/`code`/`avatar` en la opción) y una capa sobre el `<input>`; el viaje es opcional. **Riesgos:** `forced-colors`; selección parcial del texto no visible mientras está la ficha (al abrir, vuelve el texto).

---

## Comparativa

| | A · El campo se abre | B · Paleta con vista previa | C · El valor es un objeto |
| --- | --- | --- | --- |
| Momento | Al escribir | Al escribir | En reposo y al elegir |
| Paciente entre miles | Rápido; homónimos se distinguen por la descripción de la fila | **El mejor**: ficha antes de elegir | Fichas con datos; **el campo conserva el expediente** |
| Diagnóstico con código | **El mejor**: «diab» + Tab | Correcto, desproporcionado | Código visible en reposo |
| Medicamento con texto libre | Rápido | Correcto | **Único** que marca el texto libre |
| Campo estrecho (239px) | Panel de 239px: apretado | Indiferente (736px) | Panel de 320px |
| Contexto del formulario | Se conserva | **Se tapa** (modal) | Se conserva |
| Dentro de `GDialog` | Bien | Modal sobre modal | Bien |
| Móvil | Hoja común | **Misma estructura** | Hoja común + ficha en reposo |
| Teclado APG, Δ0, RTL, 320, reduced motion, contraste | Cumple (medido) | Cumple (medido) | Cumple (medido) |
| Coste sobre la base | Medio | Bajo (reusa la hoja) | Medio |
| Se combina | Con C | Con C | Con A o B |
| Extensión a múltiple (Fase 2) | Etiquetas dentro de la forma abierta; la caja crece | Lista de elegidos en la superficie: natural | **Natural**: cada valor ya es un objeto |

## Recomendación

**A + C** (`index.html?c=AC`, verificada con la batería completa): A decide cómo se abre y C cómo queda. No compiten, y juntas cubren los dos momentos del campo con algo que no se ve en otros frameworks. **B no como forma por defecto**, pero su estructura ya existe (es la hoja móvil): se puede ofrecer más adelante como opción para búsquedas de identidad donde la ficha previa importe más que el contexto.

Si hubiera que elegir **una sola**, C: es la que cambia lo que el usuario ve casi todo el tiempo y la que aporta seguridad clínica en reposo.

## Preguntas de producto (para el usuario)

1. **¿Cómo se abre?** A · el campo se abre y se completa (recomendado) / B · paleta con vista previa / la forma convencional de r01.
2. **¿El valor elegido es un objeto (C)?** Sí, sumado a la respuesta anterior (recomendado) / No, texto plano.
3. **Selección múltiple:** ¿un modo `multiple` del mismo `GCombobox` en una Fase 2 con ronda propia (recomendado), o un componente aparte (`GTagInput`)?

## Comprobaciones hechas

`node design/lab/combobox/r02/verificar.mjs`, tres motores, por concepto: toda la batería de r01 (semántica, teclado, antirrebote, estados, Δ0, texto libre, agregar, formulario, diálogo, 500 opciones, móvil 375/320, RTL, reduced motion, contraste, consola) más lo propio: A 114, B 112, C 117, A+C 126 comprobaciones por motor. **Total 1407/1407** (y r01, 315/315).

## No comprobado

- Lector de pantalla real en los tres conceptos: texto fantasma junto a `aria-activedescendant` (A), dos `combobox` y la región de vista previa (B), `aria-describedby` con el dato secundario (C).
- `forced-colors` (A: contorno único; C: ficha sobre texto transparente).
- Teclado virtual real; IME con el texto fantasma.
- En WebKit, que Tab llegue al botón de cerrar de la superficie (B y hoja): Safari no enfoca botones con Tab salvo ajuste del sistema; la comprobación se exime en ese motor.
- A dentro de `GInputGroup` y con el slot `action` de `GInput`.
- El viaje de la ficha (C) y el nacimiento de la paleta (B) se comprobaron por ausencia en reduced motion, no por su trayectoria.
- Tema oscuro y un tema distinto del por defecto: es la auditoría de coco.

## Hallazgos para lima (según lo que elija el usuario)

| # | Hallazgo | Recomendación |
| --- | --- | --- |
| L16 | A · ancho | El panel de A es el del campo, sin mínimo. Decidir si por debajo de un ancho (p. ej. `space × 80`) el componente vuelve al panel separado de r01 |
| L17 | A · Tab | «Tab acepta solo con etiqueta única a la vista» es regla del contrato, no de estilo. `→` al final acepta el texto sin elegir |
| L18 | A · texto fantasma | Solo por prefijo, sin búsqueda pendiente, con el cursor al final; `aria-hidden`; color con contraste ≥ 4.5 |
| L19 | B · superficie | Si se ofrece, prop de modo (`surface: 'inline' \| 'palette'`) y slot `preview` (`{ option }`); la hoja móvil es esa misma superficie sin ficha |
| L20 | B · regla | La vista previa no puede ser la única fuente del dato que distingue: documentar |
| L21 | C · datos | Campos opcionales de la opción (`avatar`, `code`, y un texto secundario) o slot `value` (`{ option, custom }`); el secundario va además en `aria-describedby` |
| L22 | C · texto libre | Marca visible y accesible (`labels.free`); clase de estado `is-custom` |
| L23 | C · `forced-colors` | Retirar la ficha y mostrar el texto del `<input>`: encargo a coco con medida |
| L24 | Personalidad | Registrar en `DECISIONS.md` la elección y que A, B o C no elegidos quedan reservados en `PENDIENTES.md` §3 |
| L25 | Tokens | Ninguno nuevo en ningún concepto: `--g-duration-slow`, `--g-ease-spring`, `--g-ease-out`, `--g-color-selection`, superficie inversa texto/superficie (#325) para la activa de B |
