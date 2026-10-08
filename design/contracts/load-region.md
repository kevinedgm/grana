# Contrato · GLoadRegion (región que carga) y motor de carga

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #529 a #543, 2026-10-08; cambios en archivos compartidos aplicados en `api.md`, `tokens.md` §42, `icons.md` v0.9, `PENDIENTES.md` y en los contratos de los anfitriones: `table.md`, `card.md`, `widget.md`, `calendar.md`, `dialog.md`) · **Basado en:** `design/lab/empty-skeleton/r01/` (kiwi, commit bdcbe69: `declaracion.md` con hallazgos L1 a L14, `load.js`, `load.css`, `verificar.mjs` 577/577 en Chromium, Firefox y WebKit, puerto 4212)
**Tag:** `g-load-region` · **Categoría:** contenido (estado) · **Paquete:** entrada propia **`@grana/vue/load-region`** (global UMD `GranaLoadRegion`; #530). El motor (`utils/loadPhase.js`) y el canal de página son internos y viven en el principal.

Una **región cuyo contenido llega tarde**: envuelve la plantilla de la aplicación (lista, rejilla de teselas, ficha) y se ocupa de **cuándo** se ve la espera, **cuánto** se queda, **qué** se anuncia, **qué pasa con el foco** y de que **la página no se mueva**. No pide datos (sin `fetch`): la aplicación le dice si carga (`loading`), qué hay (`items`) y si falló (`error`).

**Forma (decisión del usuario del 2026-10-08, #529):** **A + B.**
- **A · Molde** en la primera carga: la región pinta **la plantilla real de la aplicación sin tinta** (cada línea, una barra de su largo real; las cajas, en contorno); al llegar, **la tinta aparece en su sitio** (Δ0, también en texto libre).
- **B · Lo último conocido** al refrescar: lo de antes **sigue a la vista**, inerte, con un filo de acento y «Actualizando»; lo nuevo llega marcado; si el refresco falla, **lo conocido se queda**.
- **C · La frase** queda reservada como forma compacta (`appearance="phrase"`, #543).

**Nombre (#529):** `GLoadRegion`, no `GSkeleton`. Con A + B no hay esqueleto que dibujar (A pinta la plantilla real; B no pinta nada nuevo): un nombre que promete rectángulos grises llevaría a usarlo como tal. «Región» en sentido llano: **no es un punto de referencia `region`** de ARIA (su rol es `group`, #533).

---

## Principios

- **El marcador no es contenido:** el molde es decorativo (`aria-hidden`, `inert`), nunca enfocable, nunca `progressbar`. Se anuncia la región, no sus piezas.
- **Sin parpadeo:** 200 ms de retraso antes de enseñar nada y, si se vio, 400 ms mínimos a la vista. Una carga que no se ve no se oye.
- **Quietud:** ningún pulso ni barrido; a los 5 s, texto visible y ninguna animación en curso (WCAG 2.2.2).
- **Δ0:** el molde ocupa lo que ocupará el contenido; la llegada no mueve lo que hay debajo.
- **Nada se borra** si ya se vio algo: refrescar no es vaciar; fallar no es borrar.
- **El foco nunca cae en `body`** y la carga nunca lo roba.
- **Un canal cortés por página**, compartido, con fusión: diez regiones que cargan a la vez dicen una frase.

## Cuándo usarlo (fronteras, #541)

| Caso | Pieza |
| --- | --- |
| Plantilla de la aplicación que espera datos (lista, teselas, ficha, `GDataList`, `GMetric`) | **`GLoadRegion`** alrededor |
| `GTable`, `GCard`, `GWidget`, `GCalendar` con `loading` | **No se envuelven:** ya cargan; adoptan **el motor** por dentro (#540) |
| Una tarea con avance medible (subir, importar, 3 de 24) | **`GProgress`** (`progressbar` con valor). El marcador dice **qué forma** tendrá algo de avance desconocido; nunca lleva `role="progressbar"` |
| Fallo que afecta a la página y dura (sin conexión, servidor caído) | **Isla de estado** (`status.md`). La región no repite el anuncio (`announceError: false`) y puede llevar una `GStatusMark` en el slot `failed` (#327, #541) |
| Resultado de una acción | `GToast` |
| Un control que espera (`GBtn`, `GInput`, `GSelect`, `GSwitch` con `loading`) | El giro del control; no es una región |
| Líneas «Cargando» / «Sin resultados» del panel de `GCombobox` y `GSelect` | Se quedan (panel con teclado propio) |
| `GSummary` («carga Δ0», #352) | Sus huesos se quedan (es una ficha dentro de un anfitrión que anuncia); solo cambian de tono (#538) |
| El vacío dentro de la región | **`GEmpty`** (`empty.md`); la región **no decide** el vacío: lo pinta la aplicación en su plantilla |

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `loading` | Boolean | | `false` | compartida (`api.md`) |
| `items` | Array \| Object \| null | los datos que pinta la plantilla | `null` | propia |
| `sample` | Array \| Object \| null | datos de muestra para el molde de la primera carga | `null` | propia |
| `keyBy` | String \| Function | nombre de campo, o `(item) => clave` | `'id'` | propia (como `rowKey` de `GTable`) |
| `refresh` | String | `keep` `replace` | `keep` | propia |
| `error` | Boolean \| String | `true` o el texto del fallo | `false` | propia (nombre reservado por #327) |
| `announceError` | Boolean | | `true` | propia |
| `label` | String | texto | sin valor | propia (nombre del `group`, como `GTranscript`) |
| `labelledby` | String | id | sin valor | propia |
| `labels` | Object | ver «Textos» | `{}` (función) | propia |

### Reglas de props

- **`items`: `null` = aún no se sabe; `[]` = respondió vacío.** La aplicación pasa `null` hasta la primera respuesta. Es la diferencia entre la primera carga (molde) y un vacío conocido que se refresca. Una primera carga con `[]` avisa en desarrollo (aviso 6). Un `Object` (una ficha) vale igual que un arreglo de uno; las cuentas (`{count}`) solo existen con un arreglo.
- **Lo que se pinta cambia solo al terminar.** La región pinta **su copia**: el valor de `items` que tenía al empezar la carga, hasta que la carga termina (retraso y mínimo incluidos). Si la aplicación sustituye `items` antes de poner `loading` a `false`, el cambio espera al final de la fase. **La aplicación sustituye el arreglo, no lo muta en el sitio** (como `v-model:items` de `GTagGroup`, #463): una mutación en el sitio la vería Vue en la copia y rompería la fase.
- **`sample`** es la muestra del molde: los **mismos campos** que un elemento real, con textos de largo típico y sin datos de personas reales («Tipo · Nombre Apellido», «Lote 0000-0000»). Debe tener **tantos elementos como una respuesta típica a la vista** (la de una página): de eso depende el Δ0 del total (ver «Δ0»). Sin `sample`, la primera carga no tiene forma (aviso 5).
- **`keyBy`** da la clave de cada elemento: la usan las marcas de lo nuevo (`fresh`), la vuelta del foco y la medida del primer hueco. La aplicación la escribe en el elemento de cada uno con `itemAttrs(item)` (slot). Claves repetidas o `undefined` avisan (aviso 8).
- **`refresh`**: `keep` (**B**, por defecto) = al refrescar, lo de antes sigue a la vista, inerte, y a los 200 ms lleva filo y píldora; `replace` = al refrescar, **el molde de lo último conocido** (A sobre lo de antes; mismo alto exacto). `replace` es para dominios donde un dato viejo a la vista confunde (clínico, financiero); la decisión es de la aplicación.
- **`error`**: el resultado de la última carga fue un fallo. Se aplica **al terminar** la carga (como `items`); fuera de una carga, al cambiar. Con contenido conocido a la vista: **lo conocido se queda**, vuelve a ser usable y lleva encima la **barra de fallo** (`labels.failed`, o el texto de `error` si es String, y «Reintentar»). Sin contenido conocido: no hay barra; la aplicación pinta su `GEmpty cause="error"` en la plantilla (la región lo anuncia por su título). La aplicación lo pone en `false` al reintentar.
- **`announceError: false`**: el fallo lo anuncia otro (la isla de estado): la región pinta la barra o el vacío de error pero **no lo anuncia**.
- **`label` / `labelledby`**: nombre del `role="group"` (normalmente `labelledby` con el id del encabezado de la sección). Sin ninguno, la raíz no lleva `role` (un `group` sin nombre no aporta) y avisa (aviso 7): el foco puede llegar a ella y no tendría nombre.

## Slots

| Slot | Alcance | Propósito |
| --- | --- | --- |
| por defecto | `{ items, mold, fresh, itemAttrs }` | **La plantilla de la aplicación.** `items`: lo que hay que pintar (la muestra durante el molde de la primera carga, lo último conocido durante el molde de `replace`, los datos el resto del tiempo; `null` si no hay nada); `mold`: `true` mientras se pinta como molde; `fresh(item)`: `true` si el elemento llegó en esta carga y no estaba en la anterior; `itemAttrs(item)`: atributos para el elemento de cada uno (`data-g-key` y, si es nuevo, `data-g-fresh`), con `v-bind`. El vacío (`GEmpty`) va aquí, con el `v-if` de la aplicación |
| `failed` | `{ retry, text }` | Sustituye el **interior** de la barra de fallo (la barra conserva su caja y su sitio). Para poner una `GStatusMark` de la isla o un texto propio. `retry()` emite `retry` |

**Atributos que la aplicación pone en su plantilla** (no son props; se documentan en el README):

| Atributo | Dónde | Para qué |
| --- | --- | --- |
| `data-g-key` | Elemento de cada dato (con `itemAttrs`) | Vuelta del foco por clave (#534), medida del primer hueco (#535) |
| `data-g-fresh` | Lo pone `itemAttrs` en lo nuevo | Marca de acento al inicio (B, #536) |
| `data-g-known` | Un elemento cuyo texto ya se sabe (el rótulo de una tesela: «Muestras hoy») | **Conserva su tinta** en el molde: el molde solo cubre lo que falta (#535) |

**«Nueva» con texto:** la marca de acento no basta (WCAG 1.4.1). La aplicación pinta el texto de lo nuevo en su plantilla con `fresh(item)` (recomendado: `GBadge` con la palabra, junto al título). La región no inyecta texto en la plantilla de la aplicación. El anuncio de fin lo cuenta (`{fresh}`).

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `retry` | — | Pulsa «Reintentar» en la barra de fallo (o `retry()` del slot `failed`) |

Declarado en `emits`. No hay eventos de fase: la aplicación ya sabe cuándo carga; la fase es presentación.

## Textos (`labels`, sin valores por defecto)

| Clave | Marcadores | Uso | Necesaria |
| --- | --- | --- | --- |
| `loading` | | Anuncio al **verse** la carga (≥ 200 ms). Sin ella, la región carga en silencio (regiones secundarias) | Recomendada |
| `slow` | | Texto **visible** y anuncio, una vez, a los 5 s | Sí, con `loading` |
| `loaded` | `{count}`, `{fresh}` | Anuncio al terminar con datos («4 muestras, 1 nueva»); Function recibe `{ count, fresh }` | Sí, con `loading` |
| `refreshing` | | Texto visible de la píldora de B («Actualizando»; `aria-hidden`: lo anunciado es `loading`) | Sí, con `refresh="keep"` |
| `failed` | | Texto visible y anuncio del fallo con contenido conocido («No se pudo actualizar. Lo que ves es lo último que llegó.»); `error` String lo sustituye | Sí, con `error` y contenido conocido |
| `retry` | | Botón de la barra de fallo | Ídem |

## Fases y tiempos (#532)

**Constantes de diseño** del motor (`utils/loadPhase.js`), **no tokens** (no son tema ni movimiento; como `HOVER_MS` de `GMenu`, #308, y #187): **`DELAY` = 200 ms**, **`MINIMUM` = 400 ms**, **`SLOW` = 5000 ms**. Sin props `delay`/`minimum` en v1 (reservadas, #543). Los anfitriones las heredan del motor.

| Fase | Cuándo | Primera carga (nada conocido) | Refresco `keep` | Refresco `replace` | `aria-busy` | Clases en la raíz |
| --- | --- | --- | --- | --- | --- | --- |
| reposo | sin carga | — | contenido (o vacío) | ídem | `false` | — |
| pendiente | de `loading: true` a 200 ms | molde **invisible** (`visibility: hidden`): reserva el sitio | lo de antes a la vista, **inerte** desde el primer instante | ídem | `true` | `is-busy` `is-pending` (+ `is-mold` en la primera) |
| a la vista | desde 200 ms | molde visible | lo de antes, inerte, sin saturación, **filo** y **píldora** | molde de lo último conocido | `true` | `is-busy` + `is-mold` o `is-stale` |
| espera larga | desde 5000 ms (desde el inicio) | + texto `labels.slow` | ídem | ídem | `true` | + `is-slow` |
| llegada | `loading: false` y, si se vio, ≥ 400 ms a la vista | datos (con revelado), vacío o error | datos nuevos (lo nuevo marcado) o barra de fallo | datos (con revelado) | `false` | `is-revealing` mientras dura el revelado; `is-failed` con la barra |

- **Si termina antes de 200 ms**, no se enseña nada ni se anuncia el inicio: se pasa a la llegada (sin revelado: el molde no llegó a verse).
- **Si se vio**, el estado visible se queda **al menos 400 ms** (medido por kiwi: a 250 ms aparece a los ~200 y el contenido llega a los ≥ 600). Coste máximo: 400 ms sobre una respuesta de 201 ms.
- **Una carga que empieza mientras otra se ve** hereda la fase visible (sin volver a esconder ni a esperar el retraso; el mínimo cuenta desde que se vio); el anuncio de inicio no se repite.
- **A los 5 s**: texto visible (`g-load-region__slow`, al pie de la región, superpuesto, sin mover nada; ≥ 4,5:1) y **ninguna animación en curso** en la región (2.2.2). Es también quien dice «cargando» con contraste a quien no distingue el molde (§42).
- `aria-busy="true"` en la **raíz de la región** (el elemento cuyo contenido se sustituye) desde el inicio de la carga, aunque aún no se vea nada; `false` en la llegada.

## A · Molde (#535)

**El molde es la plantilla.** Durante el molde, la región pinta el slot con `mold: true` y lo envuelve en su cuerpo (`g-load-region__body`) con **`aria-hidden="true"` e `inert`**, y la clase `is-mold` en la raíz. El CSS de coco **quita la tinta**:

- toda tinta transparente (`color`), fondos fuera, sombras fuera, bordes en el tono del molde (`--g-color-mold`);
- **barra solo en las hojas** (elementos sin hijos, `:not(:has(*))`): `text-decoration-line: line-through` en el tono del molde con grosor **`0.72em`** y `text-decoration-skip-ink: none` (en un contenedor la decoración se propagaría a todo su texto y ningún descendiente podría quitarla);
- `img`, `svg`, `video`, `canvas`: `visibility: hidden` (conservan su caja);
- **`[data-g-known]` conserva su tinta** (en `--g-color-text-muted`), sin barra;
- **Excepción a la regla de capas: el molde usa `!important`** (y solo él). La aplicación va sin capa y gana siempre (#4): sin `!important`, el `color` de su plantilla pintaría el texto de la muestra **como si fuera un dato**. Las declaraciones importantes en capa ganan a las importantes sin capa, así que el molde gana sin depender del orden (#535). La aplicación no tiene que tocar nada.

**Δ0 por construcción:** es el mismo elemento con la misma fuente, así que un párrafo se parte en las mismas líneas (medido por kiwi: la ficha, Δ 0 donde la forma convencional movía 48 px). **Δ0 del total:** el alto de una lista depende de cuántos elementos lleguen; con `sample` del tamaño de una respuesta típica, lo de debajo no se mueve; con más o menos elementos, cambia **por elementos enteros**, nunca por un salto dentro de un elemento (límite honesto, README).

**La tinta llega a su sitio (revelado):** si el molde estaba a la vista al llegar datos, el contenido real se pinta **un cuadro en molde** y pasa a tinta por **transición** de `color`, `text-decoration-color`, `background-color` y `border-color`, con `--g-duration-slow` + `--g-ease-out` (con movimiento reducido, `--g-duration-fast`): las barras se convierten en el texto **sin desplazarse ni escalar**. Ningún keyframe, ninguna curva nueva (#539). La clase `is-revealing` dura lo que la transición y se quita después.

**Primer hueco:** la región mide el alto del primer `[data-g-key]` de su molde (o de lo último conocido) y lo escribe en línea como `--_load-slot` en su raíz (variable dinámica justificada, como `--_sk-w` de `GCard`); `GEmpty` lo lee como alto mínimo (`empty.md`).

**Límites (L8):** el texto directo de un elemento que también tiene hijos no recibe barra; los controles de formulario dentro del molde quedan como cajas vacías; el coste es el de pintar la plantilla real (recomendado: `sample` no mayor que lo que cabe a la vista).

## B · Lo último conocido (#536)

- **Refresco `keep`:** lo de antes sigue a la vista e **inerte** desde el inicio (nadie actúa sobre datos que se van; `inert` lo saca también del árbol de accesibilidad). A los 200 ms: `is-stale`, **filo de acento** en el borde superior de la región, **píldora** con `refresh-cw` y `labels.refreshing` sobre ese filo (sin tapar contenido, `aria-hidden`) y lo viejo **sin saturación** (el texto conserva su contraste).
- **Llegada con datos:** lo nuevo (clave que no estaba en la carga anterior) lleva `data-g-fresh` por `itemAttrs` (marca de acento al inicio lógico, **sin cambiar su caja**) y `fresh(item)` para que la aplicación pinte «Nueva» con texto; la marca se queda **hasta la siguiente carga**. El anuncio lo cuenta (`{fresh}`). Lo nuevo se calcula en cualquier carga con contenido conocido antes (también con `replace`); nunca en la primera.
- **Llegada con fallo (`error`) y contenido conocido:** lo conocido **se queda**, vuelve a ser usable (sin `inert`) y lleva la **barra de fallo** (`g-load-region__failed`, `is-failed`) **en flujo, antes del cuerpo**, con `circle-alert` decorativo, el texto y «Reintentar» (`GBtn`, `labels.retry`). La barra empuja el contenido una vez (límite aceptado: un fallo es información nueva que no debe tapar datos). Se anuncia el texto del fallo (salvo `announceError: false`). Mientras corre la siguiente carga, la barra no se pinta.
- **Vacío por filtro:** la salida con cuentas es de `GEmpty` (`empty.md`), dentro de la plantilla.

## Anuncios (#533)

**Canal cortés de página** (interno, en el principal, `utils/liveRegion.js`): **un** `<p class="g-load-live" aria-live="polite" aria-atomic="true">` por documento, texto oculto accesible, creado por el **primer** consumidor al montarse (nunca en el servidor), fuera de toda zona `aria-busy`, retirado cuando se desmonta el último. **Con un `<dialog>` modal abierto se traslada dentro de él** (`utils/topModal.js`, como los canales de `GToaster`, #143), porque lo que queda fuera del modal superior es inerte y no se anuncia.

- Escritura como `createLiveWriter` (#14): se vacía y se escribe en el ciclo siguiente (50 ms), se vacía otra vez a los 5000 ms.
- **Fusión:** lo escrito por varias regiones en el mismo ciclo sale en **una** escritura, en orden de llegada, unido con un espacio (medido por kiwi: tres «cargando» simultáneos → una frase). Un texto **idéntico** a otro pendiente **no se repite**. Recomendación del README: terminar los `labels` con punto.
- Nunca `assertive`: lo que deba interrumpir es de la isla.

**Frecuencia: como mucho tres anuncios por carga y región:**

| Momento | Texto | Nota |
| --- | --- | --- |
| Al **verse** la carga (200 ms) | `labels.loading` | Una carga que no se ve no se oye (medido: a 100 ms no se anuncia) |
| A los 5 s | `labels.slow` | Una vez |
| Al terminar, **siempre** | en este orden: fallo con contenido conocido → `error` (String) o `labels.failed`; un `GEmpty` registrado en la plantilla → **su `title`**; si no, `labels.loaded` con `{count}` y `{fresh}` | Lo que se ve al final es lo que se oye. Con `announceError: false`, el fallo (barra o `GEmpty cause="error"`) no se anuncia |

**Anidación y grupos (solo habla la más externa):**

- Una región dentro de otra que tenga `labels.loading` **no anuncia** (hace todo lo demás: fases, molde, foco).
- **Grupo:** una región **sin carga propia** (`loading: false`) que contiene regiones que cargan habla por ellas: `labels.loading` cuando la **primera** se ve, `labels.loaded` (sin `{count}`) cuando termina la **última** (medido por kiwi: tres teselas → «Cargando el panel» al ver la primera, «Panel actualizado» al terminar la última; ninguna tesela habla). No lleva `aria-busy` por las suyas (lo llevan ellas).
- Un anfitrión con región propia (`GTable`) dentro de una `GLoadRegion` habla por la suya (límite: no se coordinan; README).

## Foco (#534)

1. **El molde nunca toma el foco** (`inert`, 0 enfocables) **y la carga nunca lo roba:** con el foco fuera de la región, nada cambia (medido: «Refrescar» conserva el foco).
2. **Al empezar**, si el foco está **dentro** de lo que queda inerte o desaparece (el cuerpo, la barra de fallo), la región recuerda **dónde** (la clave del `[data-g-key]` más cercano y el **índice** del enfocado entre los enfocables de ese elemento) y **enfoca su raíz** (`tabindex="-1"`, con su nombre; `preventScroll`). **Nunca `body`.**
3. **Al llegar**, si el foco sigue en la raíz (o en `body`), vuelve al **mismo elemento por clave**: el enfocable de ese índice en el elemento con la misma clave, o su primer enfocable; si la clave ya no existe, se queda en la raíz. Medido por kiwi: foco en la fila M-0008 → refresco → raíz → llega → fila M-0008; «Reintentar» por teclado → desaparece → raíz, y allí sigue.
4. **Fuera de una carga** (la plantilla cambia sin `loading`: un filtro local, un `GEmpty` que se desmonta al quitar un filtro), la misma regla: si tras el cambio el foco quedó en `body` habiendo estado dentro, va al mismo elemento por clave o a la raíz. `GEmpty` avisa a la región al desmontarse con el foco dentro.
5. Si la persona movió el foco a otro sitio durante la carga, la región no lo toca.

## Estructura accesible

```
p.g-load-live  aria-live="polite" aria-atomic="true"               ← canal de página (uno por documento; en el modal superior si lo hay)
…
div.g-load-region  [role="group" aria-labelledby|aria-label]  tabindex="-1"  aria-busy="true|false"
     class: is-busy is-pending is-mold is-stale is-slow is-revealing is-failed   style: --_load-slot
├─ div.g-load-region__failed                         ← barra de fallo (B; solo con contenido conocido y error)
│  ├─ span aria-hidden > icono circle-alert
│  ├─ p.g-load-region__failed-text                   ← o el slot failed
│  └─ GBtn «Reintentar»
├─ div.g-load-region__body  [aria-hidden="true"] [inert]   ← la plantilla (molde: aria-hidden + inert; refresco keep: inert)
├─ p.g-load-region__slow                             ← labels.slow, visible desde 5 s (en el árbol)
└─ span.g-load-region__pill aria-hidden="true"       ← icono refresh-cw + labels.refreshing (solo is-stale)
```

- **`role="group"`** con nombre, no `region`: no es un punto de referencia (habría uno por lista) y el `group` con nombre da a la raíz un nombre cuando recibe el foco.
- `tabindex="-1"` siempre (fuera del orden de Tab); foco visible con el anillo de siempre cuando llega por programa tras teclado.
- El texto de la espera larga y la barra de fallo están en el árbol (son texto real); la píldora no (dice lo mismo que el anuncio).

## Personalidad (#542; decisión del usuario del 2026-10-08)

- **A «El molde es la plantilla»:** no hay segundo dibujo de la pantalla que mantener; la espera **es** la pantalla sin tinta.
- **A «La tinta llega a su sitio»:** al llegar los datos no hay sustitución: la misma forma recibe su tinta, por fundido de color, sin moverse un píxel.
- **B «Nada se borra»:** al refrescar, lo que se miraba sigue, quieto y marcado; lo nuevo llega señalado con texto; si falla, lo conocido se queda.

## Qué lo hace distinto

Los esqueletos de los frameworks son un segundo dibujo de cada pantalla, mantenido a mano, que nunca coincide, que parpadea con respuestas rápidas, que late sin fin y que borra lo que la persona miraba en cada refresco. En Grana la carga **es la propia pantalla sin tinta**, que la recibe en su sitio sin moverse; al refrescar **nada se borra**; si falla, lo conocido se queda; todo con un anuncio por momento, el foco que nunca cae en `body` y **ninguna animación pasados 5 s**.

## Movimiento, contraste, colores forzados, RTL (#538, #539)

- **Sin keyframes ni pulsos.** El molde es quieto. Movimiento: solo el **revelado** de A (transición de color, `--g-duration-slow` + `--g-ease-out`; reducido: `--g-duration-fast`). B y la barra de fallo: ninguno. **Regla general para toda Grana: ninguna animación de carga pasa de 5 s** (WCAG 2.2.2), lo que retira los pulsos infinitos de los anfitriones (#539, #540).
- **Tono del molde: `--g-color-mold`** (token nuevo, `tokens.md` §42): un solo tono **opaco** derivado del tema, ≥ 1,3:1 frente a `surface` en claro y oscuro (criterio de Grana: que se perciba la forma; WCAG no fija mínimo para un relleno decorativo con redundancia: `aria-busy` + anuncio + texto visible a los 5 s). Medido por kiwi con el valor propuesto: 1,46:1 claro, 1,71:1 oscuro.
- Lo que sí es texto o forma informativa cumple lo suyo: **filo de B y marca de lo nuevo en `--g-color-accent-text`** (forma de familia sin par, `tokens.md` §7.1; ≥ 3:1 garantizado por el motor), píldora `--g-color-accent-soft` / `--g-color-on-accent-soft` (≥ 4,5:1), texto de la espera larga `--g-color-text-muted` sobre `--g-color-surface` (≥ 4,5:1), barra de fallo `--g-color-danger-soft` / `--g-color-on-danger-soft` con el texto en `--g-color-text`.
- **Colores forzados:** el molde con `forced-color-adjust: none` y `GrayText` en barras y bordes (sin esto el sistema anula los fondos y el molde desaparece, o fuerza `color` y la muestra **se lee como dato real**: la tinta de la muestra sigue transparente); `[data-g-known]` en `CanvasText`; filo y marca de lo nuevo en `Highlight`.
- **RTL:** propiedades lógicas; el molde hereda la dirección de cada línea (también la de `dir="auto"`); la píldora al final lógico; la marca de lo nuevo al inicio lógico.

## Tokens consumidos (§42)

`--g-color-mold` (**nuevo**), `--g-color-accent-text`, `--g-color-accent-soft`, `--g-color-on-accent-soft`, `--g-color-danger-soft`, `--g-color-on-danger-soft`, `--g-color-text`, `--g-color-text-muted`, `--g-color-surface`, `--g-color-border`, `--g-color-focus`, `--g-focus-width`, `--g-focus-offset`, `--g-border-width`, `--g-radius-md`, `--g-radius-pill`, `--g-space-*`, `--g-text-body-sm-*`, `--g-text-caption-*`, `--g-text-action-weight`, `--g-duration-slow`, `--g-duration-fast`, `--g-ease-out`; los de `GBtn` y `GIcon` por composición. **No son tokens:** `0.72em` (grosor de la barra, constante de la técnica, #187), `DELAY`/`MINIMUM`/`SLOW`, `--_load-slot` (dato del `.vue` al CSS, §29.5).

## Clases y datos (contrato bruno ↔ coco)

| Clase o atributo | Dónde | Cuándo |
| --- | --- | --- |
| `g-load-region` | Raíz | Siempre |
| `is-busy` | Raíz | Desde que empieza una carga hasta la llegada (= `aria-busy="true"`) |
| `is-pending` | Raíz | Dentro del retraso |
| `is-mold` | Raíz | Se pinta el molde (primera carga o `replace`), también invisible dentro del retraso |
| `is-stale` | Raíz | Refresco `keep` a la vista |
| `is-slow` | Raíz | Desde 5 s hasta la llegada |
| `is-revealing` | Raíz | Durante el revelado |
| `is-failed` | Raíz | Barra de fallo a la vista |
| `g-load-region__body`, `__failed`, `__failed-text`, `__slow`, `__pill` | Partes | Según la fase |
| `g-load-live` | Canal de página | Siempre que haya un consumidor montado |
| `data-g-key`, `data-g-fresh`, `data-g-known` | Elementos de la aplicación | Ver «Slots» |

Las clases `is-*` son **estado reactivo del render** (#352: lo que el render escribe es clase; nada se escribe fuera del render).

## Iconos (solo Lucide; `icons.md` v0.9)

Propios, de la lista de la librería, con `GLibIcon`, decorativos: **`refresh-cw`** (píldora de B) y **`circle-alert`** (barra de fallo). **Ninguno nuevo.** «Reintentar» es un `GBtn` de texto.

## Avisos de desarrollo

`typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'`, una vez cada uno, prefijo `[Grana] <GLoadRegion>`, sin datos de la aplicación:

1. Una carga sin `labels.loading`, **solo** si ninguna región que la contiene habla.
2. `labels.loading` sin `labels.loaded` o sin `labels.slow`, o al revés.
3. Refresco `keep` a la vista sin `labels.refreshing`.
4. Barra de fallo sin `labels.failed` (y sin `error` String) o sin `labels.retry`.
5. Primera carga sin `sample`: no hay forma que pintar.
6. Primera carga con `items` = `[]` (debería ser `null` hasta la primera respuesta).
7. Sin `label` ni `labelledby`.
8. `keyBy` que devuelve `undefined` o claves repetidas.

## Motor compartido (`utils/loadPhase.js`, interno; #531, #532)

Lo usan `GLoadRegion` y los anfitriones que ya cargan (#540). Interno: no es API pública; la firma la decide bruno. Debe ofrecer:

- **Entrada:** inicio y fin de una carga (desde un `watch` de `loading`), con `DELAY`, `MINIMUM` y `SLOW` fijos.
- **Salida reactiva:** `busy` (de inicio a llegada), `pending` (dentro del retraso), `shown` (visible), `slow` (desde 5 s) y el momento de la **llegada** (cuando `loading` es `false` y se cumplió el mínimo, si se vio).
- **Retenciones:** mientras no llega, el anfitrión sigue pintando su copia (la regla «lo que se pinta cambia solo al terminar»).
- **Foco:** utilidades para recordar `{ clave, índice }` dentro de un elemento y restaurarlo con la regla de #534 (el anfitrión dice qué atributo es su clave: `data-g-key` en la región, `rowKey` en `GTable`).
- **Sin efectos al importar** (#444) y sin tocar `document`/`window` en el servidor; limpia sus temporizadores al desmontar.

El **canal de página** (§«Anuncios») es otra pieza interna (`utils/liveRegion.js`), compartida por `__shared` con la entrada; hoy la usan `GLoadRegion` y, en la segunda entrega, `GWidget` (#540).

## Paquete y peso (#530)

- **Entrada propia `@grana/vue/load-region`** (global UMD `GranaLoadRegion`): exporta `GLoadRegion` y un plugin que lo registra. Llegan por `__shared` (#240, sin copias): `GEmpty`, `GBtn`, `GLibIcon`, el motor `loadPhase`, el canal de página y la clave `loadRegionKey` (una copia propia crearía otro `Symbol` y el `GEmpty` del principal no vería su región). El CSS sigue en `grana.css`.
- **Por qué no el principal:** criterio de peso de siempre (#238, #328, #337, #415, #510) con la cuenta conjunta de #506: el principal ya creció ≈ 12 KB gzip en la Fase C (tope de revisión: +15 KB); `GEmpty`, el motor y la adopción de `GTable` tienen que ir en el principal (los anfitriones los usan), y la región completa (molde, revelado, lo nuevo, foco por clave, grupos, barra de fallo) no cabe además en el margen.
- Se declara en `exports` (`./load-region`), `typesVersions`, `ENTRIES` de `scripts/build-types.mjs` y `src/types.test.js` (#442, #443).
- **Compuertas de `dist`:** `! grep -q "GLoadRegion" packages/vue/dist/grana.js`, `test -f packages/vue/dist/load-region.js`, `grep -q "g-load-region__pill" packages/vue/dist/grana.css`, `! grep -q "g-empty__" packages/vue/dist/load-region.js` (`GEmpty` por `__shared`, sin copia).
- bruno mide y registra (en el `meta.json`, `CHANGELOG.md` y `CLAUDE.md`) el peso gzip de la entrada y el crecimiento del principal; si el principal pasa de **+15 KB** sobre `0.1.0-beta.0`, vuelve a lima (#506).

## `meta.json` y tipos (#443)

`GLoadRegion.meta.json`: las diez props con tipo, valores y default; `retry`; los dos slots con su alcance. En `packages/vue/types/overrides.mjs`: `GLoadRegion.items` y `GLoadRegion.sample` como `unknown[] | Record<string, unknown> | null`; `GLoadRegion.keyBy` como `string | ((item: any) => string | number)`; el alcance del slot por defecto `{ items: any; mold: boolean; fresh: (item: any) => boolean; itemAttrs: (item: any) => Record<string, string | undefined> }`; `labels` con `loaded: Label<{ count: number; fresh: number }>`.

## Adopción en los anfitriones (#540)

**Qué cambia en cada uno.** El dibujo propio de cada anfitrión (sus barras, sus regiones) **se queda**; adoptan el **motor**, el **tono**, la **quietud** y el **vacío con causa**. API nueva solo donde se indica.

| Anfitrión | Entrega | Cambia |
| --- | --- | --- |
| **`GTable`** | **esta** | Motor dentro de `loading` (retraso con filas visibles e inertes o esqueleto invisible, mínimo, 5 s con `labels.slow`); esqueleto con tantas filas como había a la vista; barras en la caja de línea; **sin pulso**; tono `--g-color-mold`; `GrayText` en forzados; **`error`** + `announceError` + slot `error` + `retry` + `labels.failed`/`retry` (enmienda de #327); vacío y error por defecto con **`GEmpty`**; foco por `rowKey`; el anuncio de inicio al verse (enmienda de #265). Detalle en `table.md` «Carga, vacío y error con el motor común» |
| `GCard` | segunda | Motor dentro de `loading`; **sin pulso** (`g-card-pulse`); tono `--g-color-mold` (enmienda de #136); `GrayText` en forzados; `labels.slow` opcional; slot `empty` con `GEmpty` (receta) |
| `GWidget` | segunda | Motor dentro de `state="loading"`; **anuncios por el canal de página desde el montaje** (corrige que hoy crea su `role="status"` con el esqueleto: puede no anunciarse, #14); el error **deja de ser `role="alert"`** y se anuncia cortés (#533); vacío y error por defecto con `GEmpty` (`labels.empty`, `labels.error` + `labels.retry`); **sin pulso** (`g-widget-pulse`; cierra el desajuste de `widget.md` con `GWidget.css` en sus tokens); tono; forzados. `stale` se queda (es B en pequeño) |
| `GWidgetGrid`, `GWidgetGallery` | segunda | Slots `empty` con `GEmpty` (receta; sin API) |
| `GCalendar` | segunda | Motor dentro de `loading`; el esqueleto pasa a `aria-hidden` y **pierde el `aria-label` en un `div` genérico** (nombre prohibido en `generic`); `labels.loading` se escribe en una región cortés presente desde el montaje, fuera del `aria-busy` (patrón de #265); el error deja de ser `role="alert"`; **sin pulso**; tono; forzados; slot `empty` con `GEmpty` |
| `GDialog` | segunda (solo coco) | El pulso de `is-loading` (`g-dialog-pulse`, infinito) pasa a **finito, que acaba antes de 5 s**, o a quieto (#539) |
| `GSummary` | segunda (solo coco) | Huesos en `--g-color-mold` en lugar de `--g-color-border-strong` (#538) |
| `GDataList`, `GMetric` | — | Sin cambios: se envuelven en `GLoadRegion` (receta del README) |
| `GTabs`, `GSelect`, `GTagGroup`, `GTranscript` | — | Sus slots o textos de vacío no cambian; `GEmpty` es una opción en los slots que lo admitan |

**Reservado para una ronda de anfitriones (#543):** B completo en los anfitriones (`GTable` con `refresh` `keep`/`replace`, filas que siguen a la vista al refrescar y marcas de lo nuevo), molde de `GTable` desde una muestra de filas, y la salida con cuentas por filtro calculada por `GTable` en `filterMode: 'local'`.

## Resolución de hallazgos de kiwi (L1 a L14)

| # | Hallazgo | Resolución |
| --- | --- | --- |
| L1 | Nombres y entrega | `GEmpty` y **`GLoadRegion`** (no `GSkeleton`: con A + B no hay esqueleto; no `GLoading`, que encaja con C); motor `utils/loadPhase.js`; `GEmpty` y motor en el **principal**, `GLoadRegion` en **entrada propia** (cambio sobre la propuesta por el peso conjunto de #506). Componente complejo: coco y bruno en Opus (#529, #530) |
| L2 | API de `GEmpty` | `empty.md` (#537) |
| L3 | API de la región | Props, slot `{ items, mold, fresh, itemAttrs }`, `refresh` `keep` por defecto, `error`, `announceError` (#531); `items: null` = no se sabe |
| L4 | Tiempos | Constantes de diseño 200/400/5000 ms; sin props en v1 (#532) |
| L5 | Anuncios | Canal de página con fusión y sin repetir, traslado al modal, regla de frecuencia, anidación y grupo, título del `GEmpty` por registro (#533) |
| L6 | Foco | Clave + índice, raíz con nombre, nunca `body`, también fuera de una carga (#534) |
| L7 | Tono | **Token nuevo `--g-color-mold`** (no `placeholder`, que choca con `::placeholder` de los campos) (#538) |
| L8 | Técnica del molde | `data-g-known`, `0.72em`, hojas, medios ocultos, `!important` como excepción (#535) |
| L9 | Movimiento | Revelado por transición de color; sin keyframes; ninguna animación de carga pasa de 5 s (#539) |
| L10 | Adopción | Tabla «Adopción en los anfitriones»: `GTable` en esta entrega, el resto en la segunda; hallazgos del inventario a `PENDIENTES.md` (#540) |
| L11 | Fronteras | «Cuándo usarlo» (#541) |
| L12 | Personalidad | #542 |
| L13 | Reservas | #543 |
| L14 | Pruebas | «Verificación» |

## Fuera de v0.1 (reservado con nombre, #543)

`appearance="phrase"` (C, en `GLoadRegion` y `GEmpty`); props `delay` y `minimum`; «Cancelar» en la espera larga (evento `cancel`, sin `fetch`); cuenta de avance en el texto de 5 s (`labels.slow` con `{done}`/`{total}`); tope de filas del molde para listas largas (`moldLimit`); B y molde en los anfitriones (tabla anterior).

## Límites conocidos (para el README)

- **Δ0 del total** depende de que `sample` tenga el tamaño de una respuesta típica; si llegan más o menos elementos, el alto cambia por elementos enteros.
- La **barra de fallo** empuja el contenido una vez (en flujo, para no tapar datos).
- **Molde:** sin barra para el texto directo de un elemento con hijos; controles de formulario como cajas vacías; coste de pintar la plantilla real.
- **`items` se sustituye, no se muta** en el sitio.
- `inert` en el refresco `keep` saca lo de antes del árbol de accesibilidad mientras dura la carga: quien usa lector no lee datos que se van (decidido), pero tampoco puede releerlos hasta la llegada.
- Un anfitrión con región propia dentro de una `GLoadRegion` habla por la suya (no se coordinan).

## Verificación (cómo se da por hecho)

### bruno (vitest + jsdom, temporizadores falsos)

`GLoadRegion.test.js` y `loadPhase.test.js`: fases y clases a 100, 250, 900 y 6000 ms; el mínimo de 400 ms y la herencia de una carga que empieza mientras otra se ve; `aria-busy` desde el inicio; molde con `aria-hidden` e `inert` y slot con `mold: true` y la muestra; la copia (sustituir `items` antes del final no cambia lo pintado); `refresh` `keep` y `replace`; `fresh` e `itemAttrs` (`data-g-key`, `data-g-fresh`); barra de fallo solo con contenido conocido, `retry`, slot `failed`; anuncios (inicio solo si se ve, 5 s una vez, fin con el orden de la tabla, `announceError`), fusión y no repetición en el canal, anidación y grupo; foco (fuera, por clave e índice, raíz, nunca `body`, también fuera de una carga y al desmontarse un `GEmpty`); los ocho avisos; sin efectos al importar ni en el servidor.

### Playwright (`design/lab/theme-playground/`, puerto propio; las de `verificar.mjs` como base, L14)

`tests/load-region.spec.mjs` y `tests/personalidad-load-region.spec.mjs`, en los tres motores: tiempos reales (100/250/900/6000 ms); **Δ0** (lista, teselas y ficha en texto libre; molde de lo último conocido con el mismo alto); revelado sin desplazamiento ni escala y que termina; **0 animaciones en curso a 5,2 s**; anuncios y fusión leyendo el canal; canal dentro de un `GDialog` modal abierto; foco por clave; refresco `keep` (filo, píldora, sin saturación, inerte), error que conserva; movimiento reducido (revelado en `--g-duration-fast`); RTL; `forced-colors` en Chromium (molde en `GrayText`, la muestra sin tinta); tono ≥ 1,3:1 en claro y oscuro con el tema por defecto y otro; 390 px con `pointer: coarse` (`GBtn` ≥ 44 × 44); consola limpia. Para `GTable`: `tests/table-load.spec.mjs` (retraso, mínimo, filas del esqueleto = filas a la vista, sin pulso, error con filas, vacío con `GEmpty`, foco por `rowKey`).

### coco (CSS y auditoría, Opus)

`GLoadRegion.css` sin literales ni respaldos (salvo `0.72em`, constante registrada) con el `!important` del molde limitado al molde; `--g-color-mold` en `defaults.css` (claro y oscuro); auditoría del componente real con un tema distinto al por defecto, verificación propia en `design/lab/load-region/`.

### No verificado (entorno real)

Lector de pantalla real (VoiceOver, NVDA, TalkBack): si `aria-busy` silencia la región, la frase fusionada, la raíz `group` enfocada, el molde oculto en exploración; `forced-colors` real (Windows) y en Firefox/WebKit; zoom 200/400 % y texto grande; CJK y nombres muy largos en el molde; rendimiento del molde con 50 a 200 filas; táctil real; imágenes de tamaño desconocido.

## Encargos

- **coco (Opus):** `GLoadRegion.css` y `GEmpty.css`; `--g-color-mold` en `defaults.css` (valor propuesto por kiwi: `color-mix(in srgb, var(--g-color-text) 18%, var(--g-color-surface))`, en claro y en oscuro, con la regla de §42); los cambios de CSS de `GTable` (sin pulso, tono, barras en la caja de línea, `forced-colors`, `g-table__slow`, `g-table__failed`); banco de estilo y `estilo.md`; después, la auditoría.
- **bruno (Opus: lleva motor de estado):** `utils/loadPhase.js`, canal de página en `utils/liveRegion.js`, `GEmpty` (`empty.md`), `GLoadRegion` y su entrada propia, la adopción de `GTable` (`table.md`), `meta.json`, `overrides.mjs`, specs y compuertas; playground `#sec-load-region`.
- **Segunda entrega** (contrato fijado aquí; lanzar tras cerrar la primera): bruno y coco en `GCard`, `GWidget`, `GCalendar`; coco en `GDialog` y `GSummary`.
- **mora-docs:** `GLoadRegion/README.md` y `GEmpty/README.md` tras la auditoría; recetas: `items: null` hasta la primera respuesta, `sample` del tamaño típico, «Nueva» con `fresh`, `GDataList`/`GMetric` envueltos, isla + `announceError: false` + `GStatusMark` en `failed`.
