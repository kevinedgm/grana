# Contrato · GAdaptiveLayout

**Dueño:** lima. **Estado:** revisado por lima el 2026-10-05 al traer el componente al flujo del Fruti Squad (lo inició otra herramienta fuera del flujo). **`candidate` desde el 2026-10-05:** los encargos de esta revisión están hechos (bruno, coco) y la auditoría de coco sobre la versión corregida pasó en los tres motores (`design/lab/adaptive-layout/auditoria-coco.md`, ronda 2); README reescrito por mora-docs. **Ronda:** `design/lab/adaptive-layout/r01/` (brief, declaración, motor). **Origen:** encargo del usuario del 2026-10-04 (construir de forma autónoma todas las fases: funcionalidad, pruebas, rendimiento y auditoría); la API concreta es una decisión tomada dentro de ese mandato, no derivada de un estándar (#339). **Decisiones:** #339 a #348 y #359 a #365 (#364, decisión del usuario del 2026-10-05: las pistas por hijo van **en el propio hijo** y sustituyen a `hints` y a la resolución de claves de #347).

**Tag:** `g-adaptive-layout`. **Categoría:** distribución. **Complejo:** sí (motor de planificación y composición con otros componentes). Se exporta desde `@grana/vue` y lo registra el plugin principal. **Opt-in:** no cambia `GFormLayout`, `GFormRow`, sus clases ni #171 a #175.

## Promesa

Un contenedor sin superficie reparte a sus hijos directos, en su orden, según lo que cada uno necesita y el ancho disponible. No pide columnas, mínimos en píxeles ni breakpoints de dispositivo. Los límites ganan a los pesos: un campo corto no se estira solo para llenar la línea. La longitud estimada de un campo es una pista, nunca una observación del uso real. No es masonry ni ordena por relevancia, y no promete proporciones exactas cuando chocan con la legibilidad.

## Qué lo hace distinto (#362)

Lo distinto no es un movimiento (no hay ninguno: #344) sino **cómo reparte**:

1. **Sin filas ni columnas que declarar.** El ancho de cada hijo sale de lo que ya dice su contenido: la palabra más larga de la etiqueta, el dominio de un número, `maxlength`, las opciones de una lista y el «chrome» del control (relleno, bordes, prefijo, sufijo, botones).
2. **Un campo corto parece corto aunque esté solo.** Un número de 0 a 9 no se estira a 720px; el aire sobrante queda al final de la línea (o donde diga `horizontal`). Su forma anuncia qué cabe en él.
3. **La composición sigue al texto real**, no a un umbral: otro idioma, otra fuente u otro tema producen otra partición válida, sin breakpoints.
4. **Los nodos nunca se mueven.** Cambiar el ancho recoloca por CSS; el foco, la selección y lo escrito siguen en el mismo elemento.
5. **Los campos de una misma línea se alinean solos** (etiqueta, caja y pie en pistas compartidas, #348), sin que el consumidor declare nada.

Sin forma visible propia, la regla de kiwi «conceptos antes que caja» no aplica: no hay caja que cuestionar.

## Frontera (#361)

| Necesidad | Usar | No usar |
| --- | --- | --- |
| Formulario cuyos grupos conoce el consumidor (Nombre · Apellido; Calle · Ext. · Int.; signos vitales) | **`GFormLayout` + `GFormRow`** (`form.md` §4): filas explícitas, cada línea llena el ancho (#171, decisión del usuario) | `GAdaptiveLayout` por costumbre: deja aire al final de la línea, que es lo que #171 y #172 evitan en un formulario |
| Contenido **mixto** (avatar, ficha, datos, campos, tabla) en una sola composición | **`GAdaptiveLayout`** | Anidar `GFormRow` con clases `g-form-w-*` adivinadas para piezas que no son campos |
| Campos que el consumidor **no conoce de antemano** (formulario generado desde un esquema, filtros configurables) | **`GAdaptiveLayout`**, con una pista en el hijo (`g-adapt-*`, `--g-adapt-chars`) solo en las excepciones, derivada del esquema | Calcular filas en la aplicación |
| Un campo corto que debe **conservar su ancho** aunque quede solo en su línea | **`GAdaptiveLayout`** | Un campo `xs` suelto en `GFormLayout` (se estira, #172) |
| Una pregunta compuesta con etiqueta por parte | `GFieldGroup` (`form.md` §5), como bloque | Un `GAdaptiveLayout` anidado como sustituto de `fieldset`/`legend` |

**Reglas de convivencia:**

- **No va dentro de una `GFormRow`** (aviso de desarrollo). Una `GFormRow`, un `GFieldGroup` o cualquier hijo con varios controles **dentro** de un `GAdaptiveLayout` es un bloque de línea completa.
- **Dentro de una `GFormSection`**, va en el `GFormLayout` del cuerpo (#283), como cualquier distribución.
- **Mezclar las dos políticas en un formulario es válido por bloques:** un `GFormLayout` puede tener filas `GFormRow` y, como otro hijo, un `GAdaptiveLayout`.
- **No comparte el motor de decisión con `GFormRow`.** Comparte el observador (`rowEngine`) y el canal de mínimos intrínsecos (`setIntrinsicMin`); la política de `GFormRow` no cambia.

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `horizontal` | String | `start` `center` `end` | `start` | propia; valores lógicos (#359) |
| `vertical` | String | `top` `center` `bottom` | `top` | propia; eje de bloque (como `position` de los avisos, #145) |
| `gap` | String | `none` `sm` `md` `lg` | `md` | propia; factor 0 · 0,5 · 1 · 2 (#360) |
| `density` | String | `default` `comfortable` `compact` | `undefined`: la del sub‑contexto de distribución › `GForm` › `default` | compartida (`api.md`) |

**No hay prop `hints`** (retirada por #364): las pistas de un hijo van en el hijo («Pistas por hijo»).

- **`horizontal`** coloca la línea cuando sus hijos no la llenan (todos saturan en su máximo). Es **lógico**: en RTL, `start` es la derecha. Nunca cambia el orden del DOM ni de lectura (#359).
- **`vertical`** alinea las raíces genéricas dentro de su línea y, si el contenedor tiene alto sobrante, coloca el conjunto de líneas arriba, al centro o abajo. Sin alto sobrante no inventa alto. En los campos C12 con pistas compartidas manda la alineación de cajas (#348), no el centrado de cada raíz.
- **`gap`** multiplica las dos separaciones de formulario (en línea y entre líneas) después de la densidad: `none` = 0, `sm` = la mitad (la proximidad de `GFieldGroup`, #169), `md` = la base, `lg` = el doble.
- **`density`** aplica 1 · 0,875 · 0,75 a las separaciones y se **re‑provee** a los campos de dentro (como `GFormLayout`).

### Pistas por hijo (#364; sustituye a `hints` y a #347)

**Solo las excepciones necesitan una pista**, y la pista va **en el propio hijo directo**, como el tamaño de un hijo de `GFormRow` (`form.md` §4, #174: «clases donde solo hay un dato de colocación»): una **clase de familia** y dos **propiedades públicas de entrada**. No hay prop en el contenedor, ni clave que resolver, ni alias.

| Pista | Dónde | Valores | Sin ella | Qué hace |
| --- | --- | --- | --- | --- |
| `g-adapt-short` · `g-adapt-standard` · `g-adapt-wide` | `class` del hijo | una de las tres | familia inferida (`auto`) | Preferencia de familia (§ Perfil, punto 9). Gana a la familia inferida |
| `g-adapt-full` | `class` del hijo | — | — | Línea propia. El hijo conserva su perfil (mínimos) dentro de esa línea |
| `g-adapt-natural` | `class` del hijo | — | — | `min = preferred = max` = su tamaño intrínseco, peso 0 (como un avatar) |
| `--g-adapt-chars` | `style` del hijo o una regla del consumidor que lo seleccione | entero positivo (glifos de referencia de la fuente del hijo) | `0` (valor inicial) = inferido | Longitud **esperada**, no validación ni `maxlength`. Gana a la capacidad inferida (rango numérico, opciones, `maxlength`); preferido y máximo = esa capacidad + chrome |
| `--g-adapt-weight` | ídem | número positivo | `0` (valor inicial) = inferido | Reparto del sobrante; nunca supera el máximo |

**Reglas:**

- **Reconocimiento.** Son pistas las clases que empiezan exactamente por `g-adapt-` (con guion); `g-adaptive-layout` y sus modificadores no lo son. Sin clase de familia = `auto`; **no existe `g-adapt-auto`** (avisa como desconocida: la ausencia ya lo dice).
- **Registro y lectura.** coco registra las dos propiedades con `@property` (`syntax: '<number>'`, `inherits: false`, `initial-value: 0`) en `GAdaptiveLayout.css`, como `--g-form-min` en `GFormRow.css`. **Sin herencia**: la pista de un grupo no baja a sus hijos ni la de un campo a sus partes. El motor las lee del **estilo calculado** del hijo, en la fase de lecturas (la misma consulta que ya comprueba `order`), así que valen igual desde `style` en línea, desde una clase del consumidor o desde una hoja de estilos. Por el registro, un valor no numérico queda en el inicial (`0`, sin pista); en desarrollo, si el `style` en línea del hijo declara la propiedad y el valor calculado es `0`, se avisa. Navegador o entorno sin `@property` (jsdom): la propiedad se heredaría; es un límite documentado, no se repara en el motor.
- **No son del tema.** No van en `defaults.css` ni se emiten en `tokens.json` (`tokens.md` §33), igual que `--g-form-min`.
- **Precedencia** (de más fuerte a más débil):
  1. **Mínimos duros, que ninguna pista baja:** palabra más larga de la etiqueta, chrome, área táctil (24px; 44px con `pointer: coarse`), `setIntrinsicMin` (`GNumberField` con −/+, segmentado) y el suelo de `GSummary` (#363).
  2. **`g-adapt-full`** (línea propia) y **`g-adapt-natural`** (perfil fijo al intrínseco).
  3. **Pistas del hijo:** `--g-adapt-chars` gana a la capacidad inferida; la clase de familia gana a la familia inferida; `--g-adapt-weight` gana al peso inferido. Clase y propiedades son **ortogonales** y se combinan (`g-adapt-short` + `--g-adapt-chars: 4` = familia corta con capacidad 4).
  4. **Perfil propio:** `GSummary` (#363) y grupo anidado (#345).
  5. **Perfil inferido del DOM** (§ Perfil).
- **Contradicción:** dos o más clases de familia (`short` `standard` `wide` `full` `natural`) en el mismo hijo → aviso y **no se aplica ninguna**: el orden de las clases no tiene significado y el resultado no puede depender de él.
- **Pista sin efecto** (se ignora con aviso; la combinación no rompe nada pero delata un error del consumidor):
  - en un **bloque completo** (tabla, `GFormReveal` abierto, `fieldset`, `section` —cuenta siempre como bloque completo, tenga o no controles, #365—, `GFormRow`, `GFieldGroup`, `GFormLayout`, hijo con varios controles): todo salvo `g-adapt-full`, que es redundante y no avisa;
  - en un **grupo anidado**: familias, `natural` y `--g-adapt-chars` (su perfil es agregado; «Grupos anidados»);
  - **`g-adapt-natural` en un campo reconocido o en `GSummary`:** un campo no tiene ancho intrínseco estable (medir su texto metería etiqueta, pie y error en el ancho, contra «un pie aumenta el alto, no el ancho»), y `GSummary` lleva `contain: inline-size`. Para un campo compacto: `g-adapt-short` y `--g-adapt-chars`;
  - **Hijo natural inferido** (avatar, imagen y semejantes sin control; perfil fijo al intrínseco y de peso 0): una **familia** distinta de `g-adapt-natural` y `g-adapt-full` (`short`, `standard`, `wide`), `--g-adapt-chars` o `--g-adapt-weight` también avisan como «pista sin efecto» (#365); `g-adapt-full` y `g-adapt-natural` sí se aplican;
  - **`--g-adapt-chars` o `--g-adapt-weight` con `g-adapt-natural`** (el perfil ya es fijo y de peso 0) y `--g-adapt-chars` con `g-adapt-full`.
- **`id` y `name` ya no importan al layout.** `GNumberField`, `GSelect` y `GCombobox` llevan `class` y `style` a su **raíz** (`rootAttrs`, `form.md` principios), que es el hijo directo; ahí se lee la pista y en ningún otro sitio. Su `name` canónico oculto y el `id` del control visible siguen siendo del formulario y de la etiqueta. El motor **no recorre la anatomía** del hijo buscando pistas; si un componente de Grana no llevara `class` o `style` a su raíz, es un defecto de ese componente, no algo que el layout compense.
- **Nativos:** la pista va en el hijo directo (el `<label>` que envuelve, o el `<input>` si él es el hijo).
- **`v-if` y `GFormReveal`:** la pista viaja con el hijo; no hay pistas «inactivas» esperando a que aparezca una clave. Los hijos de un `GFormReveal` no son hijos directos del layout: sus clases no tienen efecto (el bloque abierto es completo).
- **`g-form-w-*` y `--g-form-min` son de `GFormRow`:** el layout no los lee. Una clase `g-form-w-*` en un hijo directo avisa («usa `g-adapt-*`»); `--g-form-min` no avisa (`GCombobox` lo declara en su propio CSS).
- **No hay API pública** de mínimos o máximos en px, del coeficiente ni del límite de optimización. No se añaden props de ancho a los campos ni se reutiliza su `size` (que es altura, `api.md`).

**Ejemplos:**

```vue
<!-- Caso común: sin pistas. Calle larga; Exterior e Interior compactos por su rango entero -->
<GAdaptiveLayout>
  <GInput label="Calle" name="calle" />
  <GNumberField label="Exterior" name="ext" :precision="0" :min="0" :max="99999" />
  <GNumberField label="Interior" name="int" :precision="0" :min="0" :max="9999" />
</GAdaptiveLayout>

<!-- Excepciones: el DOM no dice cuánto mide un código postal ni que las referencias van solas -->
<GAdaptiveLayout>
  <GInput class="g-adapt-short" style="--g-adapt-chars: 5" label="Código postal" name="cp" inputmode="numeric" />
  <GInput label="Colonia" name="colonia" style="--g-adapt-weight: 2" />
  <GSelect class="g-adapt-wide" label="Municipio" name="municipio" :options="municipios" />
  <GTextarea class="g-adapt-full" label="Referencias" name="referencias" />
</GAdaptiveLayout>

<!-- Formulario generado: la pista sale del esquema, campo a campo -->
<GAdaptiveLayout>
  <component v-for="campo in esquema" :key="campo.name" :is="campo.componente" v-bind="campo.props"
    :class="campo.ancho && `g-adapt-${campo.ancho}`"
    :style="campo.chars && { '--g-adapt-chars': campo.chars }" />
</GAdaptiveLayout>

<!-- Grupo con peso propio en el padre; la ficha en su propia línea -->
<GAdaptiveLayout>
  <GAvatar name="María López" size="xl" />
  <GAdaptiveLayout style="--g-adapt-weight: 2">
    <GInput label="Nombre" name="nombre" />
    <GInput label="Apellido" name="apellido" />
  </GAdaptiveLayout>
  <GSummary class="g-adapt-full" title="Expediente 0042" :facts="datos" />
</GAdaptiveLayout>
```

```css
/* Desde la hoja de estilos de la aplicación: vale igual que el style en línea */
.campo-cp { --g-adapt-chars: 5; }
```

**Equivalencias con la API retirada** (no hay alias de compatibilidad: el paquete no ha publicado ninguna versión, #360): `width: 'short' | 'standard' | 'wide' | 'full' | 'natural'` → clase `g-adapt-<familia>`; `width: 'auto'` → sin clase; `characters: n` → `--g-adapt-chars: n`; `weight: n` → `--g-adapt-weight: n`.

## Eventos, slots y método expuesto

**Eventos:** ninguno. Un cambio de distribución no es una intención del usuario; no hay evento por cambio de tamaño.

| Slot | Propósito | Anatomía |
| --- | --- | --- |
| `default` | Contenido que se reparte | Raíces estables en orden del DOM; los comentarios no cuentan |

**Expuesto:** `refresh(): void`. Programa una actualización en el siguiente cuadro (no mide de forma síncrona). Sirve para cambios que el navegador no notifica, como una edición de CSSOM sin evento. Mismo patrón que los métodos expuestos de `GForm`.

### Raíz

- `<div class="g-adaptive-layout">`, sin rol ni `tabindex`. Sin prop `tag` en esta fase.
- `$attrs` van a la raíz: conserva `id`, `class`, `style`, `lang`, `dir` y el nombre accesible que aporte el consumidor.
- El slot admite campos, contenido genérico, tablas y otro `GAdaptiveLayout`.
- **Texto suelto** como hijo directo: no se inventa un envoltorio; se avisa y se queda en la pila de respaldo hasta que el consumidor lo envuelva.
- Un fragmento de Vue con varias raíces elemento cuenta como varios hijos. No se transforman VNodes ni se pasan atributos a los hijos.

## Perfil interno y detección (#340)

**Perfil:** `{ min, preferred, max, weight, full }`, longitudes físicas medidas en px, con `0 ≤ min ≤ preferred ≤ max` (`max` puede ser infinito). Es geometría, no tema. Los datos no finitos o negativos se normalizan a valores seguros con aviso de desarrollo. **Nunca** se lee el valor actual para decidir un perfil, ni se escuchan `input`, `change` o teclas para recomponer.

1. **Hijos que cuentan:** los **elementos hijos directos** visibles. Se excluyen `hidden`, `display: none`, la raíz de un `GFormReveal` cerrado y el contenido sin caja. **Nunca** se excluye por `aria-hidden` (un avatar decorativo cuenta), `disabled` ni `readonly` visibles. Un `GFormReveal` abierto, una `section`, un `fieldset` o un hijo con varios controles desconocidos es un **bloque completo**, salvo que sea un grupo de este mismo componente. Nunca se atraviesa un layout anidado como si sus campos fueran hijos del padre.
2. **Campo reconocido** (`GInput`, `GNumberField`, `GTextarea`, `GSelect`, `GCombobox` y sus equivalentes nativos): se mide el texto de la etiqueta con su fuente real (`label for`, `aria-labelledby` o la región de etiqueta del campo). **Mínimo de etiqueta = la palabra más larga**, no la etiqueta completa; un texto sin espacios se mide entero. Ni `innerHTML` ni el nombre del control como conjetura semántica. Un pie o un error aumentan el alto, no el ancho mínimo.
3. **«Chrome» del control:** relleno, bordes, prefijo, sufijo, botones, iconos y separaciones. La raíz nunca declara como mínimo el ancho que tiene asignado (provocaría realimentación). En `GNumberField` se combina el `setIntrinsicMin` que ya publica con la medida de la caja; no se ignoran los botones −/+ ni la unidad. Familia y tamaño de letra salen del estilo calculado; los glifos se miden con canvas o con un espejo fuera de flujo no interactivo, sin clonar controles con `id` o foco. Caché por texto + fuente + perfil, nunca por valores escritos.
4. **Texto libre:** mínimo de edición 8 glifos de referencia, preferido 40, máximo sin límite. `maxlength > 0` es **capacidad**, no uso típico: baja el preferido a `min(maxlength, 40)` y permite un máximo finito basado en la capacidad, pero nunca baja el mínimo de etiqueta o chrome. Sin `maxlength` (o ilimitado), el respaldo. `GTextarea` es texto amplio con preferido 40, no un elemento natural; `rows` no es ancho.
5. **Número:** solo un rango finito **y** una precisión conocida permiten una capacidad compacta. En nativo, `min`/`max` y un `step` finito positivo describen una estimación de formato; no prueban que no se admitan decimales. En `GNumberField`, `inputmode="numeric"` permite inferir precisión cero; `inputmode="decimal"` sin precisión publicada no permite inferir el máximo por los extremos. Con precisión desconocida, el perfil estándar conservador. Con precisión conocida, se cuenta la peor longitud de los extremos formateados (signo, separadores y decimales) más unidad y chrome. `step = 1` no elimina decimales; no se usa `aria-valuenow`. Un `--g-adapt-chars` en el hijo resuelve el dominio que el DOM no describe. Extremos muy grandes, notación exponencial o rango incompleto: respaldo, sin compacidad falsa.
6. **Lista de opciones:** se miden las etiquetas visibles de las opciones conocidas; capacidad = la más larga más chrome. No se recorre una lista global externa ni se abre el menú. Con `<option>` nativas se infiere; un `GSelect` sin texto suficiente en el DOM usa el estándar, **nunca** solo la opción elegida (cambiar de opción no debe mover las líneas). Sin globals de la aplicación ni internos privados de Vue.
7. **Avatar, imagen o icono** con tamaño intrínseco estable: `min = preferred = max` = su caja natural y peso interno 0. Para `GAvatar`, el lado que deriva del tema, no el ancho actual de la pista. Una imagen invalida al cargar. **Tabla directa** y bloques con varios controles: `full`; la tabla conserva su propio desplazamiento para el contenido bidimensional. **Genérico:** perfil estándar; no se promete entender un `div` arbitrario ni se toma el `scrollWidth` de una tabla como mínimo.
8. **`GSummary`** (#363): lleva `contain: inline-size` y no aporta ancho intrínseco, así que **tiene perfil propio** (no el genérico, cuyo mínimo de 8 glifos puede quedar por debajo del suelo de la ficha): **mínimo** = su suelo (caja de identidad medida, si la hay, + separación calculada de su raíz + suelo del título: `7ch` en `row` y `stack`, `4ch` en `inline`, medidos con la fuente del título); **preferido** = familia `wide` (40 glifos de su fuente); **máximo** infinito; **peso** 3 (el de texto libre). Nunca el ancho actual ni `scrollWidth`. Una pista en la ficha (familia, `--g-adapt-chars`, `--g-adapt-weight`, `g-adapt-full`; #364) gana sobre preferido, máximo y peso, nunca sobre el suelo; `g-adapt-natural` no tiene efecto. No se pide pista al consumidor.
9. **Familias** (constantes de política relativa, no píxeles de tema): `short` capacidad de referencia 8 y máximo 16 glifos; `standard` mínimo 8 y preferido 24, máximo libre; `wide` mínimo 12 y preferido 40, máximo libre. Se eligen con la clase `g-adapt-*` del hijo o se infieren (#364). `--g-adapt-chars` ajusta preferido y capacidad; los mínimos de etiqueta, chrome y área táctil siguen ganando. Campo acotado inferido o con `--g-adapt-chars` explícito: máximo = preferido; `short` sin capacidad explícita: máximo 16 glifos. El número de glifos nunca reduce tipografía ni controles.

**Mínimo efectivo** = el mayor entre edición + chrome, etiqueta y mínimo intrínseco. **Preferido** = el mayor entre el mínimo y la longitud preferida medida + chrome. **Máximo** nunca menor que el preferido. Con un ancho por debajo del mínimo **solo cede la restricción horizontal**: la raíz cabe, la etiqueta puede partir palabras (`overflow-wrap: break-word`, no `anywhere`: `anywhere` reduce el mínimo intrínseco y partía palabras dentro de las celdas de una `GTable` hija, hallazgo 1 de `design/lab/adaptive-layout/auditoria-coco.md`), el control admite su edición y desplazamiento nativos; ni el área táctil ni el tamaño de texto se reducen. El README documenta el límite: el layout no repara un CSS fijo arbitrario del consumidor.

### Contexto de formulario

- Provee `layoutKey` con `block: true`, la `density` resuelta, `readonly`, `disabled` y `stack` heredados y `setIntrinsicMin(raíz, px)` compatible con `GNumberField` (`0` lo retira; también al desmontar).
- No cambia el registro de `GForm`, la validación, el envío ni `GFormReveal`.
- `stack` heredado: un hijo por línea, **conservando los máximos** (no convierte un campo corto en uno de ancho completo).
- No modifica las reglas ni los avisos de `GFormRow`, y `GFormSection` no cambia para silenciar avisos.

### Grupos anidados (#341, #345)

**El grupo opcional es otro `GAdaptiveLayout` como hijo directo.** Su raíz es una unidad contigua y estable para el padre; su motor interior recibe el ancho asignado y puede partir sus propios hijos sin deshacer el grupo en el padre.

**Perfil exterior del grupo:** mínimo = el mayor mínimo de sus hijos; **preferido = el mayor preferido de sus hijos** (#345); máximo = suma de máximos + separaciones si todos son finitos, infinito si alguno es flexible; peso = suma de pesos. Un grupo vacío publica cero.

- El preferido representa un estado interior **apilado** válido: sumar preferidos supondría una sola línea interior y penalizaría compartir sitio con un elemento natural (hallazgo del banco real: el avatar quedaba solo con un hueco).
- El cálculo es lineal en el número de perfiles, no evalúa un plan recursivo por cada candidato del padre y no depende del ancho asignado anterior. El padre nunca usa el ancho pintado del grupo como perfil.
- **Pistas y grupos (#364).** Las pistas de la **raíz del grupo** (hijo directo del padre) las lee el **padre**: `g-adapt-full` le da línea propia y `--g-adapt-weight` sustituye a la suma de pesos; familias, `g-adapt-natural` y `--g-adapt-chars` no tienen efecto en un perfil agregado (aviso). Las pistas de los **hijos del grupo** las lee solo el motor del grupo; el padre nunca las ve (no atraviesa el grupo) y, por `inherits: false`, el peso o los glifos de la raíz del grupo no llegan a sus hijos.
- Un grupo sin nombre es un `div` decorativo. Si la pregunta necesita `fieldset`/`legend`, lo aporta el consumidor como bloque semántico; no hay `role="group"` automático.
- No se promete alinear pistas entre líneas distintas ni la altura óptima global de un árbol de grupos. Los campos de **una misma línea** sí comparten pistas (#348); cada grupo alinea sus propios compañeros.

## Planificador (normativo, #342)

**Partición contigua**, sin `dense`, `order` ni cambios de orden visual.

1. Para una línea de `k` hijos, ancho de contenido `A = max(0, W − (k − 1) × gap)`.
2. **Línea admisible** si la suma de mínimos ≤ `A`, o si tiene un único hijo (que cede su mínimo), o si es un único bloque `full`.
3. **Reparto desde los preferidos:** si suman más que `A`, se reduce cada uno en proporción a su margen `preferred − min`; si sobra, se reparte por pesos positivos con tope en los máximos (*water filling*). Si todos saturan, el espacio libre se conserva y `horizontal` coloca la línea (`start`, `center`, `end`, lógicos). Peso cero interno solo en elementos naturales (inferidos o con `g-adapt-natural`); un `--g-adapt-weight` válido es siempre positivo.
4. **Coste de línea:** `1 + 24 × Σ ((preferred − asignado) / max(preferred, ε))²` sobre las pérdidas positivas; crecer no penaliza. La programación dinámica minimiza la suma; desempate determinista: menos líneas y, después, más hijos en las primeras líneas.
5. **El 24 es un parámetro experimental** aprobado dentro del mandato, no una ley de diseño. Bruno puede optimizar la implementación sin cambiar el resultado. Para el caso «Calle y dos números» se exige un banco con campos reales y una aserción de partición, nunca nombres programados. Normalizar y acotar el ε aritmético no introduce una medida estética.

**Límite explícito:** optimización exacta hasta **64 hijos visibles** por contenedor. Con más, partición contigua voraz por mínimos y el mismo reparto, en tiempo acotado; no se descarta ni se esconde ningún hijo. `data-strategy="optimal" | "linear"` y aviso único del respaldo. El 64 es un límite de trabajo del motor, no una promesa de rapidez universal: bruno mide 10, 50, 200 y 500 hijos y documenta aparte el coste del DOM. Si la DP calcula el reparto de cada tramo, la cota es O(n³) limitada a 64; se admiten caché y agregados, sin dependencias de la aplicación. Cada grupo anidado tiene su propio límite; el registro interno prohíbe ciclos.

## DOM, CSS y estados observables (#343)

- **Sin envoltorios de línea** al cambiar de ancho, sin `appendChild`, sin mover, reordenar, desmontar ni remontar nodos. CSS Grid (o Flexbox) con la colocación calculada de las raíces existentes.
- **Alias locales `--_adaptive-*`** para plantilla, pista, línea, ancho y desplazamiento; nunca se sobrescriben propiedades públicas ni estilos de la aplicación. El motor guarda los valores previos de los alias y atributos que escribe y limpia los suyos al cambiar los hijos y al desmontar.
- **Desplazamiento lógico** (#359): `--_adaptive-start` (px) = distancia desde el **inicio en línea** del contenido del contenedor; el CSS lo aplica con propiedades lógicas (`margin-inline-start`, `justify-self: start`). Sustituye a `--_adaptive-x`, que era físico desde la izquierda.

| Alias | Dónde | Valor | Neutro en CSS (antes de medir) |
| --- | --- | --- | --- |
| `--_adaptive-line` | hijo | línea lógica, desde 1 | `auto` |
| `--_adaptive-track` | hijo | primera pista de su línea con pistas compartidas: `4 × (línea − 1) + 1` | `auto` |
| `--_adaptive-width` | hijo | ancho asignado en px | `100%` |
| `--_adaptive-start` | hijo | desplazamiento desde el inicio en línea en px | `0` |
| `--_adaptive-rows` | raíz | plantilla de filas con pistas compartidas | `none` |

**Clases y atributos** (contrato bruno ↔ coco): `g-adaptive-layout`, `g-adaptive-layout--horizontal-{start|center|end}`, `--vertical-{top|center|bottom}`, `--gap-{none|sm|md|lg}`, `--density-{default|comfortable|compact}`; **`is-ready`** solo tras una medida útil; **`has-shared-tracks`** (interna, #348); `data-lines` y `data-strategy` en la raíz y `data-line` en cada hijo planificado. Un hijo oculto no recibe línea ficticia. Las clases **`g-adapt-*`** y las propiedades **`--g-adapt-chars`**/**`--g-adapt-weight`** son **entrada del consumidor** en los hijos (#364): las lee el motor; el CSS solo registra las propiedades y no las usa para pintar.

### Pistas compartidas entre compañeros (#348)

Tras medir (`is-ready`), la raíz recibe **`has-shared-tracks` solo si alguna línea del plan tiene al menos dos raíces C12 directas reconocidas** (`.g-input`, incluidos `GNumberField` y `GCombobox`, que lo componen; `.g-select`; `.g-textarea`). Se detecta en el recorrido lineal de la partición ya disponible: sin medir alturas ni recorrer los campos de los grupos para activar al padre.

- Con la clase, cada línea lógica tiene **tres pistas `auto`: etiqueta · caja · pie**, y entre líneas una pista de separación (`--_adaptive-row-gap`); ni un hueco extra entre etiqueta, caja y pie (sus márgenes ya derivan de los tokens del campo). Cero hijos no crea pistas fantasma. Cada hijo visible ocupa las tres pistas de su línea; `data-line` sigue siendo la línea lógica.
- **Solo con `.is-ready.has-shared-tracks` y soporte de `subgrid`**, las raíces C12 toman `grid-template-rows: subgrid` **en el CSS propio de `GAdaptiveLayout`**: raíz estirada, etiqueta en la pista 1 apoyada abajo, caja en la 2, pie en la 3. Sin etiqueta visible, la pista 1 queda vacía; no se fabrica etiqueta ni nombre accesible. La contención de layout de la raíz de `GInput` se desactiva solo en este ámbito (patrón de `GFormRow`). Cada campo conserva su alto, sus botones y su unidad; compartir alto no estira el número, ni reduce el texto, ni cambia la etiqueta. Las líneas distintas son independientes. Una raíz genérica, un avatar, un grupo o un `GFormReveal` abierto ocupan las tres pistas como un bloque.
- **Aportación intrínseca al subgrid:** en ese mismo ámbito, etiqueta y pie limitan `max-inline-size` al ancho asignado (`--_adaptive-width`) y conservan `min-inline-size: 0` y el partido de palabras. Sin el límite, Firefox 155 calculaba el alto de una etiqueta pintada a 60px como si midiera 460px y la dejaba 32px por encima de su campo. El límite corrige la aportación sin leer alturas, sin cambiar el planificador y sin columnas nuevas; no se aplica a paneles ni popovers, no recorta y no usa `overflow: hidden`.
- **Sin compañeros C12 en ninguna línea:** una pista por línea lógica, separación normal y los alias de colocación originales; `--_adaptive-rows` vuelve a `none` y `--_adaptive-track` queda inactivo (nada de `span 3`, `subgrid` ni pistas ×4). Poner o quitar la clase es una mutación propia filtrada (no vuelve a medir). Al cambiar ancho, hijos o visibilidad se reevalúa la condición y se limpian los alias del modo anterior (también al desmontar y en el respaldo). El CSS lo condiciona a `.is-ready.has-shared-tracks` dentro del `@supports` correspondiente.

### Respaldo, dirección y orden

- **Antes de medir, en SSR o sin `ResizeObserver`:** una raíz por línea, sin `subgrid` ni plantilla calculada (no hay compañeros que alinear). Navegador sin `subgrid`: la distribución y las etiquetas se conservan íntegras; la alineación C12 es un límite documentado, no se repara con DOM ni JS.
- **RTL:** `horizontal` es lógico (#359); la línea se lee de derecha a izquierda y el orden del DOM no cambia.
- Foco, Tab y lectura nativos, sin `tabindex` ni `role="grid"`. **Sin región viva ni animación de recolocación:** una transición de anchos o posiciones mientras se escribe queda fuera de esta fase (#344).

### `GFormReveal` cerrado y `hidden` (#346)

Excluirlo del plan no basta si sigue participando en la rejilla automática. La raíz del layout es el bloque contenedor (`position: relative`) y **solo** su hijo directo `.g-form-reveal:not(.is-open)[inert]` sale de flujo: `position: absolute` en el origen lógico (`inset-inline: 0`, `inset-block-start: 0`), 100% del ancho del contenido.

- Ni `display: none`, ni desmontar, ni mover el DOM: los descendientes se siguen midiendo y conservan sus datos; `inert`, `disabled` y el foco siguen siendo de `GFormReveal`. Sin `data-line` ni alias de colocación para el cerrado, y sin una `grid-row: 1` invisible (en el respaldo crearía una fila implícita antes del primer visible).
- Dentro de ese selector, **`transition: none`, `opacity: 0` y `visibility: hidden`** son obligatorios: el cierre no deja un fundido temporal en el origen absoluto encima del contenido visible. La apertura conserva las transiciones de `GFormReveal` y vuelve a la rejilla como bloque completo, ya planificado. No se garantiza una animación de compresión al cerrar en este layout.
- Fuera de `GAdaptiveLayout`, `GFormReveal` no cambia. La posición absoluta es exclusiva del contenido cerrado e inactivo; todos los hijos visibles siguen en flujo con su alto.
- **`hidden`:** un hijo directo con el atributo `hidden` queda `display: none` en el CSS propio del layout aunque el CSS del campo declare `display: flex` o `grid`. Es otra condición semántica, no el mecanismo del bloque cerrado. `readonly` y `disabled` visibles no se ocultan.

## Tokens consumidos (#344, #360, #364; `tokens.md` §33)

| Token | Uso |
| --- | --- |
| `--g-form-column-gap` | Separación en línea entre hijos de una línea, × densidad × factor de `gap` |
| `--g-form-gap` | Separación entre líneas, × densidad × factor de `gap` |

**Propiedades públicas de entrada** (no son tokens ni del tema, #364): `--g-adapt-chars` y `--g-adapt-weight`, registradas por coco con `@property` (`<number>`, sin herencia, inicial `0`).

**Ningún token nuevo**, ni colores, superficie, sombra, radio, fuente o duración propios. Las fuentes que se miden son las **reales** de cada elemento (estilo calculado), no un token. Factores de densidad 1 · 0,875 · 0,75 y de `gap` 0 · 0,5 · 1 · 2: multiplicadores geométricos, no tema. CSS sin `var()` con respaldo ni medidas de tema literales. Los alias en línea medidos están permitidos por `tokens.md` §33 (excepción de §29.5). Los valores por defecto siguen en la capa `grana.defaults`.

## Ciclo de medición e invalidación (#343)

- **SSR, hidratación y sin `ResizeObserver`:** pila legible sin colocación calculada, con los mismos nodos y el mismo marcado que el primer render de cliente; no se toca el DOM antes de montar. Sin una medida fiable no se marca listo.
- Se reutiliza `observeRow`/`scheduleRow` de `rowEngine` (o un servicio equivalente de bruno con observador compartido), sin cambiar la política de `GFormRow`. Invalidaciones agrupadas en un cuadro; todas las lecturas antes de las escrituras; solo se escriben diferencias; se ignoran las mutaciones de los alias y `data-*` propios (sin bucles).
- **Invalidan:** el ancho de contenido; los hijos y su visibilidad; etiqueta, `lang` y `dir`; los atributos semánticos (`min`, `max`, `step`, `inputmode`, `maxlength`, opciones); las **pistas de un hijo directo** (sus clases `g-adapt-*` y el `style` en línea con `--g-adapt-chars` o `--g-adapt-weight`; #364); la carga de una imagen; `document.fonts` (`ready`, `loadingdone`); el tema (clase o estilo de los antepasados, incluido `html`); la carga de una hoja de estilos; `pointer: coarse`. **En los antepasados no invalidan** la geometría (ancho, alto, posición, márgenes, `display`…), los alias `--_*`, las propiedades `--g-adapt-*` ni las propiedades propias que no empiezan por `--g-` (por ejemplo `--app-x`); sí invalidan los tokens `--g-*`, la tipografía, las clases y los atributos. **Hojas de estilo:** hay un solo observador del `<head>` por documento, compartido por todas las instancias, que reacciona a la inserción o retirada de `<style>` y `<link rel=stylesheet>`, al texto de un `<style>` y a `disabled`, `media`, `href` y `rel`. El perfil en caché se invalida aunque el ancho no cambie si cambian fuente, `space` o densidad. Lo que el navegador no notifica queda para `refresh()`: `adoptedStyleSheets`, las ediciones del CSSOM (`insertRule`, `deleteRule`, p. ej. una regla del consumidor que cambia `--g-adapt-chars` sin tocar el hijo) y las hojas ubicadas en el `<body>`.
- **Caché y filtro de mutaciones con pistas (#364):** la clave del perfil en caché de cada hijo incluye las pistas leídas (familia, `chars`, `weight`); cambiar solo una pista recalcula ese perfil aunque la versión no cambie. El filtro de `style` propio sigue ignorando `--_adaptive-*` y **no** ignora `--g-adapt-*`. `id` y `name` dejan de invalidar por sí mismos (ya no son claves); `id` solo sigue observándose si hace falta para la asociación de etiquetas (`for`, `aria-labelledby`). Las clases de estado de un campo (`is-*`) no deben provocar una medida nueva: el perfil en caché con las mismas pistas se reutiliza.
- **No** se observa `characterData` del valor de un campo ni de un `contenteditable` (sí el texto de las etiquetas). Las mutaciones internas de valor (espejos de `GNumberField`, `aria-valuenow`, contador) no provocan una nueva medida si el perfil no cambia.
- **Al desmontar** se limpian observadores, escuchas de fuentes, imágenes y tema, y los mínimos y alias escritos en los hijos. Foco y selección se preservan por identidad de nodo, no con un blur/focus de reparación.

## Teclado y avisos

| Tecla | Acción |
| --- | --- |
| Tab / Mayús+Tab | Nativo, en orden del DOM |
| Cualquier otra | Es del componente hijo; el layout no intercepta nada |

**Avisos de desarrollo** (`[Grana GAdaptiveLayout]`, una vez por causa e instancia; el patrón `typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'`): **pistas (#364)**: clase `g-adapt-*` desconocida (incluida `g-adapt-auto`); dos o más clases de familia en un hijo (no se aplica ninguna); `--g-adapt-chars` que no es un entero positivo o `--g-adapt-weight` que no es positivo (negativos, decimales en `chars`; `0` es «sin pista» y no avisa); valor no numérico en el `style` en línea que el registro deja en `0`; pista sin efecto en ese tipo de hijo («Pistas por hijo»); clase `g-form-w-*` en un hijo directo («usa `g-adapt-*`»). Además: texto suelto; respaldo lineal con más de 64 hijos; dentro de una `GFormRow`; hijo con `order` distinto de 0 o rejilla con `dense`. No hay aviso de «perfil interno inválido normalizado» (#365): `normalizeProfile` sanea sin aviso porque el perfil es interno y el consumidor no puede actuar sobre él. Nunca por cada cambio de tamaño ni por datos opcionales desconocidos. Sin datos escritos por el usuario en los mensajes. En producción no hay consola.

## Límites conocidos (#365)

- **Calle + Exterior (0–99999) + Interior (0–9999), sin −/+, a 460px:** el plan óptimo del coste 24 es `[Calle, Exterior][Interior]`, no «Calle sola y dos compactos debajo» como esperaba el brief de kiwi. Es **aceptable**: respeta los mínimos duros, no rompe «nunca tres cortos a ancho completo» y no es un defecto del motor, sino el resultado del coste experimental. Quien quiera Calle sola pone `g-adapt-full` en Calle. No se ajusta el 24 ni se añaden nombres programados para este caso; si la auditoría o el uso real lo contradicen, se reabre el coeficiente (#342).

## Resolución de hallazgos de kiwi r01

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| L1 | Políticas anteriores (#171 a #175) | Componente opt-in con planificación propia; `rowEngine` compartido sin tocar la política de `GFormRow`; frontera escrita | #339, #361 |
| L2 | Perfiles e invalidación | Detección conservadora del DOM, `setIntrinsicMin` compatible, precisión desconocida → respaldo, medición sin valores | #340; WCAG 1.4.10 |
| L3 | Desconocidos y pistas | Pistas opcionales en el propio hijo (clase `g-adapt-*`, `--g-adapt-chars`, `--g-adapt-weight`; sustituyen a `hints` y a sus claves), familias relativas, capacidades como pistas, fuentes reales de las etiquetas; `GSummary` con perfil propio | #340, #363, #364 (sustituye a #347) |
| L4 | Grupo, semántica y pistas | El mismo componente anidado; `fieldset` es de la pregunta; tres pistas compartidas entre compañeros de una línea, no entre líneas; el bloque abierto ocupa la línea | #341, #348; WCAG 1.3.1 |
| L5 | API, coeficiente y límites | Props de la tabla, valores lógicos, coste 24 experimental, 64 exactos y respaldo lineal observable | #342, #359, #360 |
| L6 | DOM y observación | Colocación por alias CSS sin mover nodos, un cuadro por lote, mutaciones propias filtradas, limpieza y SSR | #343; WCAG 2.4.3 |

## Compuertas verificables

### bruno

- **Pruebas puras:** perfiles de texto, decimal de precisión desconocida, capacidad, etiquetas, grupo y tabla; restricciones con 1 a 500 hijos; óptimo contra un oráculo en casos pequeños; el respaldo conserva orden, límites y todos los hijos.
- **Vue / jsdom:** defaults, pistas por hijo (#364; las propiedades se ponen en el hijo, porque jsdom no aplica `@property`), atributos, contexto, avisos, `GFormReveal`, SSR sin globals, desmontaje, `refresh()`, sin recolocación de nodos; valores nuevos de `horizontal` y `gap` (#359, #360) y el validador que rechaza `left`, `right`, `default`, `small` y `large`.
- **Navegadores (Chromium, Firefox, WebKit):** anchos 240 · 320 · 360 · 460 · 720 · 1120px, zoom 200 % y 400 %, LTR y RTL (con `horizontal` `start` y `end`: en RTL, `end` queda a la izquierda), fuente tardía y tema cambiado al mismo ancho, altas y bajas, `GFormReveal`, avatar con campos, tabla directa, números con −/+ y unidad, lista con opción larga, genérico y grupo.
- **Banco compuesto de regresión (#345):** avatar natural de 64px + grupo de dos `GInput` + tabla directa, contenedor de 460px y la separación real del tema: el avatar comparte la línea exterior con el grupo, el grupo puede tener dos líneas interiores y la tabla conserva la suya; sin pistas, sin nombres programados y sin CSS especial para el avatar. Repetir con otra pieza natural para comprobar que la política es genérica.
- **`GSummary` como hijo directo (#363):** a 240, 360 y 460px junto a un campo, la ficha nunca recibe menos que su suelo (sin desborde del título por debajo de `7ch`/`4ch`), comparte línea cuando cabe y no dispara su aviso 8 (ancho 0).
- Foco, `selectionStart`/`selectionEnd`/`selectionDirection` y valor se conservan al redimensionar; escribir no dispara el plan.
- **Calle + Exterior/Interior** con rango explícitamente entero: a 460px, nunca tres controles cortos de ancho completo. Con Exterior 0–99999 e Interior 0–9999 sin −/+ el plan aceptado a 460px es [Calle, Exterior][Interior] (compromiso del coste 24, #365; ver «Límites conocidos»); «Calle sola y dos compactos debajo» se obtiene con `g-adapt-full` en Calle o con rangos más cortos. Un número con `inputmode="decimal"` **no** debe pasar esta compuerta con una precisión inventada.

### coco

- Tema contrastante (otro `space`, radio y fuente), separación por `density` y `gap`, colocación con `horizontal` lógico en LTR y RTL; los controles nunca se encogen por debajo de los mínimos de accesibilidad por culpa del motor; estados vacío, antes de medir, ancho por debajo del mínimo, `forced-colors` y movimiento reducido. Etiquetas sin elipsis ni recorte y sin desborde del layout; las tablas conservan su propio desplazamiento. No se afirma una prueba de lector de pantalla o de móvil físico que no se haya hecho.
- **Análisis estático del CSS:** sin propiedades físicas (`margin-left`, `justify-self: left`, `left`/`right`) en la colocación (#359).

### Regresiones de `GFormReveal` cerrado y `hidden` (#346)

- Con cero, uno y varios hermanos visibles: mismo alto efectivo, número de líneas y separación que si el bloque cerrado no existiera. Repetir antes de `is-ready` y sin `ResizeObserver`, con `vertical` `top`, `center` y `bottom` con alto libre, en LTR y RTL. Cero visibles = cero líneas ocupadas por el cerrado y sin desborde.
- Abrir y cerrar conserva nodos, valores y medidas de los descendientes; sin `data-line` en el cerrado; el foco al cerrar sigue el contrato de `GFormReveal`. Ninguna excepción para controles visibles ni eventos o API nuevos.
- **Durante el cierre** (`is-animating`, antes de que acabe la transición original): ningún bloque superpuesto a los hermanos o al foco; la raíz con `opacity: 0` y `visibility: hidden`.
- `hidden` en un hijo directo (incluido un `GInput` con `display: flex`): sin caja ni línea; quitarlo vuelve a planificar.
- **Pistas por hijo (#364; sustituye a la batería de claves de `hints` de #347):** cada familia por clase en `GInput`, `GNumberField`, `GSelect`, `GCombobox`, `GTextarea`, `GSummary`, un nativo y un genérico (la clase y el `style` llegan a la raíz, que es el hijo directo); `--g-adapt-chars` desde `style` en línea **y** desde una regla del consumidor; `--g-adapt-weight` en un campo y en la raíz de un grupo; precedencia (los mínimos duros nunca ceden; `--g-adapt-chars` gana al rango entero y a `maxlength`); dos clases de familia = ninguna; cada aviso de «Teclado y avisos» una vez; `id`/`name` cambiados o duplicados no alteran el plan; un `v-if` y un `GFormReveal` que se abre conservan la pista del hijo; cambiar solo una pista recalcula ese perfil sin volver a medir los demás; una clase `is-*` del campo no provoca medida nueva.
- **Sin herencia (navegadores):** `--g-adapt-weight: 5` en la raíz de un grupo deja el valor calculado de sus hijos en `0`, y el plan interior del grupo es el mismo que sin la pista.

### Regresión de alineación C12 (#348)

Banco real: `GInput` deshabilitado con etiqueta «Dato deshabilitado» junto a un `GNumberField` entero de 0 a 9 con etiqueta «Cantidad de prueba», sin pistas, a 460px: la etiqueta numérica en varias líneas e íntegra, y las dos cajas con el mismo borde superior; el ancho compacto conserva su límite inferido. Repetir a 320, 460 y 720px; `readonly` y `disabled`; etiqueta ausente y etiqueta larga por slot; −/+ y unidad; mensaje de error; `GSelect` y `GTextarea`; RTL; ajustes de texto de WCAG 1.4.12. Se admiten diferencias de alto de control por `size`, nunca diferencias de borde superior por la etiqueta. El respaldo sin `is-ready` conserva lectura y etiquetas sin pistas ni separaciones extra; genérico, avatar, grupo y bloque abierto conservan su geometría según su contrato. Banco de coco en los tres motores y limpieza de alias, tokens y SSR de bruno antes de la compuerta final.

### Regresión de coste de pistas (#348)

Banco de 500 hijos genéricos o nativos sin raíces C12: una pista por línea y sin `has-shared-tracks`. Comparar con el mismo banco antes y después (frío y redimensionado, p50 y p95, más un control del DOM), sin aceptar el coste de tres pistas por línea sin beneficio. Banco preliminar del orquestador: en frío 119,6 ms y al redimensionar p50 134,3 ms y p95 250,5 ms, frente a 58,7 ms antes del `subgrid` (cifras con contexto, no un presupuesto universal). Probar también: añadir y quitar una segunda raíz C12 en la misma línea; un redimensionado que las separa y las junta; `readonly`, `disabled` y `GFormReveal`; un grupo con una pareja interior que no activa al padre con una sola raíz de grupo. El modo compartido conserva la regresión de alineación y el mismo orden y geometría; el modo simple conserva `vertical` y `gap` y no deja alias antiguos ni bucles de `MutationObserver`.

### Rendimiento

Planificador puro, lecturas del DOM y escrituras por separado; varias muestras (mediana, p95, máximo) con 10, 50, 200 y 500 hijos; navegador y CPU documentados; redimensionado sostenido; fuentes y mutaciones; sin fugas tras montar y desmontar repetidamente. El presupuesto es una comparación y una evidencia, no una promesa portátil en milisegundos. Se documenta que un cambio estructural legítimo puede mover visualmente los campos sin romper el foco. mora-docs documenta solo lo medido y los límites pendientes; un contrato aprobado no declara `stable`.

## Referencias primarias y alcance de la validación

- [CSS Flexbox §9.7](https://www.w3.org/TR/css-flexbox-1/#resolve-flexible-lengths): reparto con límites mínimo y máximo y congelación; es la referencia de la saturación, no obliga a usar Flexbox.
- [CSS Grid §4](https://www.w3.org/TR/css-grid-1/#order-accessibility): el orden visual no sustituye al orden lógico ni al de Tab. El DOM estable y las particiones contiguas verifican esa frontera.
- [CSS Sizing 3](https://www.w3.org/TR/css-sizing-3/): tamaño intrínseco frente a extrínseco; el ancho asignado a un hijo no es su mínimo intrínseco.
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/): 1.4.10 (reflujo a 320 CSS px; una tabla bidimensional puede conservar su desplazamiento mientras el entorno refluye), 1.4.4 (texto al 200 %), 1.4.12 (interlineado 1,5, espaciado de letras 0,12em, de palabras 0,16em y de párrafos 2em sin pérdida; los ajustes van en el banco), 2.4.3 (orden lógico) y 2.4.11 (foco no tapado del todo), medidos además de conservar el nodo.
- [ResizeObserver](https://www.w3.org/TR/resize-observer/): entrega y errores de bucle; `requestAnimationFrame`, lecturas antes de escrituras, cero ciclos propios en el banco.
- [APG Grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/): es un patrón interactivo distinto de la colocación visual; el layout no asigna `role="grid"`.

EN 301 549 y la Sección 508 son referencias técnicas con sus propias versiones de WCAG; esta batería no acredita conformidad legal completa ni una validación humana con lector de pantalla.

## Encargos de esta revisión (2026-10-05)

**bruno** (`GAdaptiveLayout.vue`, `useAdaptiveLayout.js`, `adaptivePlan.js`, `adaptiveProfiles.js`, pruebas, `meta.json`, playground):

1. `horizontal`: validador `start` `center` `end`, default `start`; `placeAdaptive` calcula el desplazamiento desde el inicio en línea (en RTL el inicio es el borde derecho) y escribe `--_adaptive-start` en lugar de `--_adaptive-x`; actualizar el filtro de estilos propios. Clases `--horizontal-{start|center|end}` (#359).
2. `gap`: validador `none` `sm` `md` `lg`, default `md`; clases `--gap-{none|sm|md|lg}` (#360).
3. Perfil propio de `.g-summary` en `adaptiveProfiles.js` (§ Perfil, punto 8; #363) y su prueba de navegador. En el mismo archivo, las raíces de `GFormRow`, `GFieldGroup` y `GFormLayout` son **bloque completo** aunque tengan un solo control (hoy solo lo son con más de uno; frontera, #361).
4. `GAdaptiveLayout.meta.json`: `since: "0.1.0"`, **`status: "draft"`** hasta la auditoría de coco de la versión corregida, valores nuevos de `horizontal` y `gap`, `tokens` solo `--g-form-column-gap` y `--g-form-gap`, `states` redactados con espacios («óptimo hasta 64», «voraz con más de 64»; hoy hay palabras pegadas) (#360).
5. Banco `packages/vue/playground/adaptive-layout.html` y pruebas: valores nuevos; caso RTL con `start`/`end`; caso `GSummary`.

**coco** (`GAdaptiveLayout.css`, `design/lab/adaptive-layout/estilo.md`, auditoría):

1. Colocación lógica: `justify-self: start` y `margin-inline-start: var(--_adaptive-start)` en lugar de `justify-self: left` y `margin-left: var(--_adaptive-x)`; neutro `--_adaptive-start: 0`. Clases `--horizontal-*` y `--gap-{none|sm|md|lg}` (factores 0 · 0,5 · 1 · 2). Comentario de cabecera sin «left/center/right son físicos».
2. Repetir la auditoría sobre la versión corregida (con las compuertas de este contrato, incluidas RTL con `start`/`end` y `GSummary`) y, si pasa, devolver a bruno el paso a `candidate`.

**mora-docs** (`README.md`): reescribir tras la auditoría; quitar «Versión objetivo 1.0.0» y el estado `candidate`, usar los valores nuevos, la frontera con `GFormLayout`/`GFormRow` y el caso `GSummary`.

### Pistas en el hijo (#364, decisión del usuario del 2026-10-05)

Se suma a los encargos de arriba; la auditoría de coco y el paso a `candidate` cubren las dos cosas juntas.

**bruno** (`GAdaptiveLayout.vue`, `adaptiveProfiles.js`, `useAdaptiveLayout.js`, `GAdaptiveLayout.test.js`, `GAdaptiveLayout.meta.json`, `packages/vue/playground/adaptive-layout.html`; las pruebas de navegador viven en `design/lab/theme-playground/tests/adaptive-layout.spec.mjs`):

1. **Quitar `hints`:** la prop de `GAdaptiveLayout.vue` y su entrada en el `watch` de `useAdaptiveLayout.js`. Sin alias de compatibilidad ni aviso de prop antigua (el paquete no ha publicado versión).
2. **Quitar la resolución por claves (#347):** `keysOf`, el conteo de alias, el aviso `duplicate` y `validHint` en su forma de objeto. Ningún código del layout lee `id`, `name` ni el `name` canónico oculto para decidir un perfil.
3. **Leer las pistas del hijo** en la fase de lecturas (una función pura de bruno, p. ej. `readHints(child, computedStyle)`): familia desde `classList` (`/^g-adapt-/`, exactamente las cinco de «Pistas por hijo»), `chars` y `weight` desde el estilo calculado (`getPropertyValue('--g-adapt-chars')`, vacío o `0` = sin pista). El objeto resultante entra a `measureProfile` con la misma forma que hoy usa la política (`width`, `characters`, `weight`), así que **la política de perfiles no cambia**. Reutilizar la consulta de estilo calculado que ya comprueba `order`.
4. **Pistas sin efecto:** `g-adapt-natural` en un campo reconocido o en `GSummary` se ignora (hoy mediría `textContent`, que incluye etiqueta, pie y error); en un grupo, solo `g-adapt-full` y `--g-adapt-weight`; en un bloque completo, solo `g-adapt-full`. Cada caso con su aviso.
5. **Caché y mutaciones:** clave del perfil = versión + pistas leídas; quitar `name` del `attributeFilter` (y `id` si no se usa para asociar etiquetas); el filtro de `style` propio no descarta cambios de `--g-adapt-*`; una clase `is-*` del campo reutiliza el perfil en caché.
6. **Avisos** de «Teclado y avisos» (pistas), una vez por causa e instancia, con el patrón de `process.env.NODE_ENV`, sin datos del usuario en el mensaje. El de valor no numérico solo mira el `style` en línea del hijo (`el.style.getPropertyValue`), sin recorrer hojas de estilo.
7. **Pruebas:** sustituir «applies hints by public number id/name…» y «retains controls and values across conditional additions and hint changes» por las compuertas de «Pistas por hijo» (§ Compuertas, regresiones) en jsdom y navegador; incluir la de herencia (`inherits: false`) en navegador. Si `levels.test.js` necesita reconocer `--g-adapt-chars`/`--g-adapt-weight` como propiedades de entrada declaradas por el componente, excepción nombrada como la de `--g-form-min`.
8. **`GAdaptiveLayout.meta.json`:** quitar la prop `hints`; añadir las cinco clases `g-adapt-*` a `classes`, las dos propiedades a `inputs` (`type: "<number>"`, nota «entrada pública, @property sin herencia») y a `reads`, y los avisos nuevos a `warnings` (formato de `GFormRow.meta.json`).
9. **Banco** `adaptive-layout.html`: los `:hints` de los ejemplos 01 a 04 pasan a clases y propiedades en los hijos (`code` → `style="--g-adapt-chars: 2"`, `note` → `class="g-adapt-wide"`, etc.); un ejemplo con `--g-adapt-chars` desde una regla CSS de la página y uno con `--g-adapt-weight` en un grupo.

**coco** (`GAdaptiveLayout.css`, `design/lab/adaptive-layout/`):

1. **Registrar** al principio de `GAdaptiveLayout.css`, como `--g-form-min` en `GFormRow.css` (#174), y con un comentario que cite #364:
   `@property --g-adapt-chars { syntax: "<number>"; inherits: false; initial-value: 0; }` y lo mismo para `--g-adapt-weight`. Viven en `GAdaptiveLayout.css` porque las lee el motor de este componente y su CSS siempre viaja en `grana.css`; **no** en `defaults.css` (no son del tema) ni en el CSS de cada campo.
2. **Ninguna regla de estilo** lee `var(--g-adapt-*)` ni selecciona `.g-adapt-*`: son datos para el JS (comportamiento), no aspecto. Antes de medir, la pila de respaldo ignora las pistas.
3. Actualizar `auditoria-verificar.mjs` y la auditoría (hoy usan `hints`) y, en la repetición sobre la versión corregida, comprobar en los tres motores la no herencia de las dos propiedades y que una pista nunca baja un control por debajo de los mínimos de accesibilidad.

**mora-docs** (`README.md`): la sección «Excepciones mediante hints» pasa a «Pistas en el hijo», con los ejemplos de «Pistas por hijo»; quitar de la tabla de props la fila `hints` y la explicación de claves `id`/`name`.

**kiwi:** nada. `design/lab/adaptive-layout/r01/declaracion.md` menciona `hints` como historia de la ronda; no se reescribe.

## Preguntas para el usuario

1. ~~**Forma de las pistas por hijo.**~~ **Resuelta el 2026-10-05 (#364):** el usuario aprobó la recomendación de lima: clases `g-adapt-{short|standard|wide|full|natural}` en el hijo y propiedades de entrada registradas sin herencia `--g-adapt-chars` y `--g-adapt-weight`; se retiran `hints` y la resolución por `id`/`name` de #347.
