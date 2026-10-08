# Declaración — estado vacío y carga genéricos (`GEmpty` y la región que carga, nombres de trabajo), r01: base funcional y conceptos A, B y C

> kiwi, 2026-10-08. Prototipo: `index.html?c=base|A|B|C` (`&dir=rtl`, `&theme=dark`, `&lat=`, `&out=`), motor `load.js`, CSS `load.css` (base con el tono del tema; A, B y C con los tokens reales del tema por defecto, `dist/grana.css`, y el marcado real de `GBtn`). Iconos solo Lucide vía `design/lab/lucide-icons.js`. Verificación: `node design/lab/empty-skeleton/r01/verificar.mjs` (puerto 4212), cifras en «Comprobaciones». La base deriva de WAI-ARIA (`aria-busy`, regiones vivas), WCAG 2.2 (1.3.1, 1.4.1, 1.4.3, 1.4.11, 2.2.2, 2.4.3, 2.4.7, 2.5.8, 4.1.3), del lenguaje de movimiento (#299) y de los contratos vigentes; **la única pregunta de producto es la elección de concepto**.

## Uno o dos componentes

**Dos componentes y un motor compartido.**

- **`GEmpty`** (`g-empty`): el vacío **es contenido**. Tiene texto real, a veces un control enfocable, una causa y una acción; vive en el árbol de accesibilidad como cualquier párrafo. Se usa suelto o dentro de los slots `empty`/`error` que ya existen.
- **La región que carga** (nombre de trabajo **`GSkeleton`**; alternativas en L1): el marcador **no es contenido**. Es decorativo (`aria-hidden`, `inert`), transitorio, y lo importante no es su dibujo sino su **comportamiento**: cuándo aparece, cuánto se queda, qué se anuncia, qué pasa con el foco, que no mueva la página.
- **El motor** (`utils/loadPhase.js`, interno): retraso, mínimo, espera larga, anuncios y foco. Lo usa la región y lo **adoptan los anfitriones que ya cargan** (`GTable`, `GCard`, `GWidget`, `GCalendar`) sin cambiar su API ni su dibujo.

Por qué no uno: semántica opuesta (contenido frente a decorativo), vida distinta (persistente frente a transitorio), adopción distinta (`GEmpty` entra por los slots que ya existen; el motor entra por dentro de los `loading` que ya existen), y cada uno se necesita sin el otro (un espacio de trabajo nuevo está vacío sin haber cargado; una ficha carga y nunca está vacía). Un componente único obligaría a un `state="loading|empty|error|ready"` que duplica lo que `GTable`, `GWidget` y `GCard` ya poseen.

## Anatomía (base)

```
p#ld-live.ld-live  aria-live="polite" aria-atomic="true"         ← un canal por página, fuera de toda zona aria-busy, desde el montaje
…
div.ld  role="group" aria-labelledby="{encabezado}" tabindex="-1" aria-busy="true|false" data-phase="pending|skeleton|stale|content|empty" [data-slow]
├─ div.ld-content                                                    ← lo de antes (inerte mientras carga) o el resultado
│  └─ div.ld-ghost  aria-hidden="true" inert                         ← el marcador (barras / molde / frase)
├─ p.ld-slow                                                         ← «Sigue cargando…», visible a los 5 s
└─ [B] span.b-pill aria-hidden="true"                                ← «Actualizando», solo en la fase stale

GEmpty
div.e-*  data-cause="none|filtered|error|forbidden"
├─ span.e-icon aria-hidden="true" > svg (Lucide)                     ← decorativo; nunca la única pista de la causa
├─ p.e-title                                                          ← el nombre del vacío (y lo que se anuncia)
├─ p.e-desc                                                           ← por qué y qué hacer
└─ div.e-actions > GBtn…                                              ← una principal, como mucho una secundaria
```

## Decisiones de la base

**Semántica y anuncios**

1. **`aria-busy="true"` en el elemento cuyo contenido se sustituye**, no en la página ni en el marcador (como `GTable` en su `<table>`, #265). Desde el inicio de la carga, aunque aún no se vea nada; `false` al terminar. `aria-busy` solo no se anuncia (WCAG 4.1.3), así que no es el mecanismo de anuncio: es la señal para las tecnologías que lo respetan de que no lean contenido a medias.
2. **El marcador es decorativo:** `aria-hidden="true"` e `inert`, sin texto en el árbol, sin nada enfocable (medido: 0 enfocables), **nunca `role="progressbar"`** (no mide nada; ver frontera con `GProgress`, L11). Cero anuncios por pieza: **un esqueleto no se anuncia**, se anuncia la región.
3. **Un canal cortés por página, compartido** (`createLiveWriter` con dos cambios: lo escrito en el mismo ciclo de 50 ms se **fusiona** en una sola escritura y un texto idéntico pendiente **no se repite**). Existe desde el primer montaje, fuera de toda zona `aria-busy` (medido). Motivo: un panel con diez regiones que cargan a la vez no puede abrir diez canales que compitan; la fusión convierte tres «cargando» simultáneos en una frase (medido: «Cargando muestras. Cargando el panel. Cargando el lote» en **una** escritura). Los anfitriones con región propia (#265) la conservan (L10).
4. **Frecuencia: como mucho tres anuncios por carga y región, siempre corteses.**
   - **Al empezar, solo si se llega a ver** (tras el retraso): una carga que no se ve no se oye. Medido: a 100 ms no se anuncia «Cargando».
   - **A los 5 s, una vez:** «Sigue cargando…» (`labels.slow`).
   - **Al terminar, siempre:** el resultado (`labels.loaded` con `{count}`) o, si quedó vacío, **el título del `GEmpty`**, una vez. Lo que se ve al final es lo que se oye.
   - Nunca `assertive`: el error de una región es cortés; lo que deba interrumpir es de la isla (L11).
   - **Regiones anidadas o agrupadas:** solo habla la más externa que tenga `labels` (medido: tres teselas → «Cargando el panel» al ver la primera, «Panel actualizado» al terminar la última; ninguna tesela habla).
   - Sin `labels.loading` una región carga en silencio (regiones secundarias); el aviso de desarrollo lo da solo la que tenga `labels.loaded` sin `labels.loading` o al revés.

**Tiempos (sin parpadeo)**

5. **Retraso de 200 ms antes de enseñar el marcador.** Por debajo, la respuesta se percibe inmediata; un esqueleto que aparece 80 ms es un destello. Durante el retraso **lo que había sigue a la vista** (inerte, para que nadie actúe sobre datos que se van) y, si no había nada, **el marcador ya ocupa su sitio, invisible** (`visibility: hidden`): la página no salta cuando aparece (medido: Δ 0 entre el inicio y el contenido a 100 ms).
6. **Tiempo mínimo a la vista: 400 ms.** Si el marcador llegó a verse, se queda al menos 400 ms (medido: a 250 ms aparece a los ~200 y el contenido llega a los ≥ 600). Coste máximo: 400 ms añadidos a una respuesta de 201 ms; a cambio, nada aparece y desaparece antes de leerse. Constantes de diseño (como #187), no tokens (L4).
7. **Espera larga: a los 5 s, texto visible y quietud.** Aparece «Sigue cargando…» (texto real, ≥ 4,5:1, medido 7,46:1) y **toda animación de la región ha terminado** (medido: 0 animaciones en curso a 5,2 s). Es el límite de WCAG 2.2.2 para contenido en movimiento que convive con otro contenido, y es también quien dice «cargando» con contraste a quien no distingue el marcador (punto 15).

**Foco**

8. **El marcador nunca toma el foco y la carga nunca lo roba.** Si el foco estaba fuera de la región, no se toca (medido: «Refrescar» conserva el foco).
9. **Si el foco estaba dentro de lo que va a quedar inerte o desaparecer**, pasa a la región (`tabindex="-1"`, nombrada por su encabezado) al empezar, **nunca a `body`**; al llegar, vuelve al **mismo elemento por clave** (`data-key` / `keyBy`) si sigue existiendo, y si no, se queda en la región. Medido: foco en la fila M-0008 → refresco automático → foco en la región → llega → foco en la fila M-0008. «Reintentar» desde el teclado → el botón desaparece → foco en la región, y allí sigue al llegar.

**Forma (Δ0)**

10. **El marcador reserva la forma real.** Con forma conocida (filas, teselas) la base dibuja barras **dentro de cajas de línea reales** (la receta de `GSummary`, #352: cada barra mide `1lh − space × 2` en una línea con la tipografía de su texto) y el contenido llega sin mover nada (medido: Δ 0 en la lista y en las teselas). Con texto libre la base solo puede adivinar el número de líneas (medido: la ficha con la forma convencional mide 48 px más de lo que llega y todo lo de debajo **sube 48 px** al llegar); es el motivo de A.

**Vacío con causa**

11. **Cuatro causas, cuatro acciones:**

| Causa (`cause`) | Cuándo | Título de ejemplo | Acción principal | Icono por defecto (Lucide, decorativo) |
| --- | --- | --- | --- | --- |
| `none` | Aún no hay datos (primer uso) | «Aún no hay muestras» | Crear o importar | ninguno de la librería (`inbox`, de la aplicación; L5) |
| `filtered` | Filtros o búsqueda dejan cero | «Ninguna muestra con estos filtros» | Quitar filtros (y los nombra) | `search` |
| `error` | La carga de esta región falló | «No se pudieron cargar las muestras» | Reintentar | `circle-alert` |
| `forbidden` | Sin permiso | «No tienes permiso para ver estas muestras» | Pedir acceso, o ninguna (nunca un botón deshabilitado) | `lock` |

   La causa la dice **el texto** (título y descripción, ≥ 4,5:1), no el icono ni el color (1.4.1). Acciones con `GBtn` real (área de 44 × 44 con puntero grueso por su `::after`, medido). `GEmpty` **no tiene región viva propia** (punto 4) ni encabezado propio por defecto: es un párrafo dentro de una sección que ya tiene el suyo (un `h3` por cada vacío ensuciaría el índice de encabezados); `headingLevel` opcional (L2).
12. **Vacío por filtro: nombra los filtros y ofrece quitarlos.** «Quitar filtros» devuelve el foco a la región y los resultados (medido). En `GTable` es el `{ filtered, clear }` de su slot.

**Movimiento, contraste, idioma**

13. **Sin barrido ni pulso.** El marcador de la base es quieto (medido: 0 animaciones). Un pulso infinito choca con #299 (keyframes solo para reacciones únicas y el giro de carga) y con WCAG 2.2.2 pasados 5 s. Con `prefers-reduced-motion` no cambia nada en la carga (ya es quieta); la llegada de A pasa a un fundido de `--g-duration-fast`; el giro de C, más lento y finito (patrón de `GBtn`: × 2,5).
14. **Tono del marcador: un solo tono, opaco, derivado del tema.** Propuesta: `color-mix(in srgb, text 18%, surface)` (L7). Hoy conviven `surface-sunken` (`GTable`, `GWidget`, `GCalendar`: ≈ 1,08:1, casi invisible) y `border-strong` (`GCard`, `GSummary`: con alfa, que se oscurece al solaparse). Medido: 1,46:1 en claro y 1,71:1 en oscuro.
15. **Qué mínimo aplica:** ninguno de WCAG al relleno. No es texto (1.4.3) ni un componente de interfaz, y la información que da («aquí viene algo») tiene redundancia: `aria-busy` + anuncio para quien no ve, y **texto visible a los 5 s** para quien no distingue el tono. Criterio propio de Grana: **≥ 1,3:1** frente a su superficie (que se perciba la forma), comprobado en claro y oscuro. Lo que sí es control o texto cumple lo suyo: el filo de B 5,69:1 (≥ 3:1), «Actualizando» 5,00:1 y la frase de C 17,40:1.
16. **Colores forzados:** el marcador se pinta con `GrayText` y `forced-color-adjust: none` (sin esto el sistema anula los fondos y el marcador desaparece, que es lo que pasa hoy en `GTable`, `GWidget` y `GCalendar`); en A, además, la tinta de la muestra **sigue transparente**: si el sistema fuerza `color`, el texto de ejemplo («Tipo · Nombre Apellido») se leería como dato real (medido en Chromium).
17. **RTL:** todo con propiedades lógicas; el marcador empieza por la derecha (medido); los nombres llevan `dir="auto"` (#282). En A el molde hereda la dirección real del texto de cada línea, también la de `dir="auto"`.

## Estados medidos

Reposo · pendiente (invisible, reservado) · marcador · espera larga (5 s) · contenido · vacío `none`/`filtered`/`error`/`forbidden` · refresco (B: `stale`) · error al refrescar (B) · foco fuera, foco en una fila, foco en «Reintentar» · grupo de tres · claro y oscuro · RTL · movimiento reducido · colores forzados (Chromium) · táctil 390 px · consola limpia.

---

## A · Molde

**Estructura.** La premisa cuestionada: «un esqueleto es un dibujo». Aquí **no hay esqueleto que dibujar**: la región pinta **la plantilla real de la aplicación** con datos de muestra (`sample`) o, al refrescar, con los últimos que llegaron, y le **quita la tinta**. Cada hoja de texto se vuelve una barra de su largo real (tinta transparente y `line-through` de `0.72em` en el tono, solo en elementos sin hijos para que no se propague ni se apile); las cajas pierden el relleno y quedan en contorno (el avatar es un círculo, la insignia una píldora); imágenes ocultas con su caja. **Lo que ya se sabe conserva la tinta** (el rótulo de una tesela: «Muestras hoy»), así que el molde solo cubre lo que falta.

**Comportamiento.** Δ0 **por construcción**, también en texto libre: el párrafo se parte en las mismas líneas porque es el mismo elemento con la misma fuente (medido: la ficha, Δ 0 donde la base mueve 48 px). Al refrescar, el molde de lo último conocido mide exactamente lo que medía (medido: el alto del molde = el del contenido anterior). El vacío no es un póster: es **el primer hueco**, un elemento discontinuo del alto de una fila, en el sitio donde aparecerá el primero, con el icono donde irá el avatar y la acción donde irá el estado.

**Movimiento.** **La tinta aparece sobre las barras:** al llegar, el contenido real se pinta un cuadro en molde y pasa a tinta con una transición de color (`--g-duration-slow`, `--g-ease-out`): las barras se convierten en el texto en su sitio. Es un fundido de color, la categoría que #299 conserva incluso con movimiento reducido (allí, `--g-duration-fast`). Ninguna curva ni keyframe nuevos.

### Qué lo hace distinto (A)

Los esqueletos de los frameworks son un segundo dibujo de cada pantalla, que alguien mantiene a mano y que nunca coincide. Este **es la pantalla**: no se escribe, no se desfasa cuando cambia la plantilla, mide lo que medirá, y al llegar los datos **no hay sustitución**: la misma forma recibe su tinta. Para quien mira, la página no se mueve y el ojo ya está donde estará el dato.

### Gana y arriesga

- **Gana:** cero código de esqueleto por plantilla (la aplicación da `sample` o nada); Δ0 incluso en texto libre; continuidad visual a la llegada; sirve a cualquier plantilla de la aplicación, no solo a las de Grana; generaliza #132 de `GCard`.
- **Arriesga:** la plantilla se ejecuta con datos de muestra (la aplicación debe darlos o tolerar campos vacíos); un elemento con texto y elementos mezclados no recibe barra para su texto directo (límite de la técnica de hojas, L8); controles de formulario dentro del molde quedan como cajas vacías; coste de pintar la plantilla real (una lista de 50 filas en molde).

**Coste:** medio (slot con alcance `{ items, mold }`, CSS del molde, revelado).

---

## B · Lo último conocido

**Estructura.** La premisa cuestionada: «cargar es vaciar y volver a llenar». **Nada se queda en blanco si ya se vio algo.** La primera carga usa el marcador de la base; al refrescar (filtro, orden, página, reintento, refresco automático), **lo de antes sigue a la vista**, inerte desde el primer instante (nadie actúa sobre datos que se van) y, tras el retraso, con un **filo de acento** en el borde superior de la región (5,69:1) y una píldora **«Actualizando»** sobre ese filo (sin tapar contenido; 5,00:1), y lo viejo sin saturación (el texto conserva su contraste).

**Comportamiento.** Al llegar, las filas nuevas llevan una marca de acento en su borde de inicio **y el texto «Nueva»** (no solo color, 1.4.1), y el anuncio lo dice: «4 muestras, 1 nueva». **El error no borra:** si el refresco falla, lo conocido se queda, vuelve a ser usable y lleva el fallo encima con «Reintentar» (medido: 4 filas, interactivas, con el aviso). **El vacío por filtro es una salida:** dice cuántas había antes y ofrece quitar **solo los filtros que devuelven algo**, ordenados de más a menos, con la cuenta en el botón («Quitar «Cerradas» · 2»); si ninguno devuelve nada, «Quitar todos» (medido: quitar «Cerradas» devuelve las 2 anunciadas). Sin icono: el vacío de B es texto y salidas.

**Movimiento.** Ninguno. El filo aparece y se va con el estado; la marca «Nueva» se queda hasta la siguiente carga.

### Qué lo hace distinto (B)

Los frameworks tratan cada refresco como una primera visita: borran, enseñan rectángulos y vuelven a pintar. B trata a la persona como alguien que **ya estaba mirando**: no le quita lo que leía, le dice qué cambió al llegar, no le borra la pantalla cuando el servidor falla, y cuando un filtro la deja en cero le dice **qué filtro quitar y cuánto recupera**, en vez de un póster.

### Gana y arriesga

- **Gana:** contexto continuo al filtrar y paginar (lo más frecuente en una administración); error sin pérdida; vacío accionable con cuentas; en Vue es casi gratis (la aplicación no vacía su arreglo mientras pide el siguiente; la región ve contenido y lo deja inerte); generaliza el `stale` de `GWidget`.
- **Arriesga:** se ven datos viejos durante la espera (marcados, inertes); en dominios donde un dato viejo confunde (clínico, financiero) puede preferirse vaciar (`refresh="replace"`, L3); las cuentas por filtro las tiene que calcular la aplicación; la primera carga sigue siendo convencional.

**Coste:** bajo en la región; medio en el vacío por filtro (datos de cuentas).

---

## C · La frase

**Estructura.** La premisa cuestionada: «la espera hay que dibujarla». Aquí **no hay formas inventadas**: la región reserva su alto (el de lo último conocido o el de la muestra pintada sin verse en la plantilla, la medida de A; medido: Δ 0 también en la ficha) y dice en una línea, en el sitio del primer elemento y en palabras de la aplicación, lo que pasa: «Cargando muestras…», con el giro de `loader-circle`. Lo que se sabe se dice (la tesela enseña su rótulo). El vacío es **una frase con sus acciones dentro**: un icono en una tesela pequeña de `neutral-soft` (`danger-soft` en el error), el título y la descripción en la misma línea, y las acciones como enlaces (`GBtn variant="link"`).

**Comportamiento.** **Lo que se ve es lo que se oye:** el texto visible y el anuncio son la misma cadena. El giro es **finito** (6 vueltas = 4,8 s) y a los 5 s la frase cambia a «Sigue cargando muestras · tarda más de lo normal» (medido). Sirve igual en una celda, una tesela o una página.

**Movimiento.** Solo el giro, finito; con movimiento reducido, 2 vueltas lentas.

### Qué lo hace distinto (C)

Ningún esqueleto miente sobre lo que viene y ningún vacío ocupa media pantalla: una línea que cualquiera lee, en cualquier tamaño, igual para el ojo y para el oído.

### Gana y arriesga

- **Gana:** lo más honesto y lo más barato; cabe en cualquier contenedor; el texto visible cubre de entrada el mínimo de contraste; misma cadena para todos.
- **Arriesga:** sin forma no hay anticipación (el ojo no sabe dónde estará el dato); un hueco grande con una sola línea arriba parece vacío; el giro es lo que los esqueletos querían evitar.

**Coste:** bajo.

---

## Comparativa

| | Base | A · Molde | B · Lo último conocido | C · La frase |
| --- | --- | --- | --- | --- |
| Pregunta que contesta | ¿Está cargando? | ¿Cómo será lo que viene? | ¿Qué cambió de lo que miraba? | ¿Qué está pasando, en palabras? |
| Primera carga | Barras en cajas de línea | La plantilla real sin tinta | Como la base | Una frase, alto reservado |
| Refresco | Lo de antes, luego barras | Lo de antes, luego su molde exacto | **Lo de antes sigue**, inerte, con filo | Lo de antes, luego la frase |
| Δ al llegar · lista / teselas / ficha | 0 / 0 / **−48 px** | 0 / 0 / **0** | 0 / 0 / −48 px | 0 / 0 / 0 (alto medido de la muestra en la plantilla) |
| Llegada | Sustitución | La tinta aparece en las barras | Las nuevas, marcadas «Nueva» | Sustitución |
| Vacío | Póster centrado | El primer hueco | La salida, con cuentas | Una frase con acciones |
| Error al refrescar | Vacío de error | Hueco de error | **Lo conocido se queda** | Frase de error |
| Esqueleto que escribir | Uno por plantilla | **Ninguno** | Uno (primera carga) | Ninguno |
| Movimiento | Ninguno | Tinta que aparece (color) | Ninguno | Giro finito |
| Coste | Bajo | Medio | Bajo / medio | Bajo |
| Riesgo principal | Genérico; adivina el texto libre | Plantilla con datos de muestra | Datos viejos a la vista | Sin anticipación de forma |

## Recomendación

**A + B: el molde para la primera carga, lo último conocido para el refresco, y el vacío como primer hueco que se convierte en salida cuando la causa es un filtro.** C queda reservada como forma compacta (una celda, un panel pequeño) para una ronda futura.

- **A** porque resuelve los dos defectos estructurales del esqueleto (que hay que dibujarlo y que no mide lo que medirá) **sin dibujar nada**: es la plantilla de la aplicación; y porque la llegada deja de ser una sustitución.
- **B** porque lo más frecuente en las aplicaciones de Grana no es la primera carga sino **refrescar lo que se está mirando**, y ahí ningún esqueleto es mejor que lo que la persona ya tenía; y porque el error no debe borrar la pantalla.
- **El vacío** toma la forma de A (en su sitio, del tamaño de un elemento, nunca un póster) y el contenido de B cuando es un filtro (qué quitar y cuánto vuelve).

## Qué lo hace distinto (resumen de la recomendación)

La carga en Grana **no es un dibujo aparte**: es la propia pantalla sin tinta, que la recibe en su sitio cuando llegan los datos, sin moverse un píxel ni parpadear. Al refrescar, **nada se borra**: lo que se miraba sigue, quieto y marcado, hasta que lo sustituye lo nuevo, que llega señalado. Si falla, lo conocido se queda. Y el vacío no es un póster con ilustración: es **el primer hueco** de la lista, que dice por qué está vacío y, si es por un filtro, **cuál quitar y cuántas vuelven**. Todo con un solo anuncio por momento, el foco que nunca cae en `body` y ninguna animación pasados 5 s.

## Comprobaciones

`node design/lab/empty-skeleton/r01/verificar.mjs` · 2026-10-08 · puerto 4212 · **577 de 577 pasan**.

| Motor | Base | A | B | C |
| --- | --- | --- | --- | --- |
| Chromium | 44/44 | 52/52 | 51/51 | 48/48 |
| Firefox | 43/43 | 51/51 | 50/50 | 47/47 |
| WebKit | 43/43 | 51/51 | 50/50 | 47/47 |

La base (puntos 1 a 17) se comprueba **en los cuatro conceptos**: retraso, mínimo, Δ0, anuncios y fusión, `aria-busy`, marcador oculto e inerte, foco (fuera, por clave, al reintentar), las cuatro causas con su título anunciado una vez y ≥ 4,5:1, vacío por filtro y su salida, espera larga (texto, quietud, un anuncio), movimiento reducido, RTL, táctil 390 px (área de `GBtn` ≥ 44 × 44), tono ≥ 1,3:1 en claro y oscuro, consola limpia. Colores forzados, solo en Chromium (`emulateMedia({ forcedColors })`; los otros motores no lo emulan): por eso Firefox y WebKit tienen una comprobación menos por concepto.

Diferencias por motor: ninguna en los resultados. En WebKit de Playwright `focus()` sobre un enlace funciona aunque el Tab no llegue a los enlaces (como Safari sin «Tab resalta cada elemento»); el foco por clave se comprueba con `focus()`.

**No comprobado:** lector de pantalla real (VoiceOver, NVDA, TalkBack): si `aria-busy` silencia la región mientras carga, la lectura de la frase fusionada, la región `group` enfocada al perder el foco, y el árbol del molde (oculto) en exploración; `forced-colors` real (Windows) y en Firefox/WebKit; zoom 200/400 % y texto grande (el molde lo seguiría por construcción, sin medir); CJK y nombres muy largos en el molde; rendimiento del molde con 50 a 200 filas; táctil real; una plantilla con imágenes de tamaño desconocido; un tema distinto al por defecto.

## Hallazgos para lima

| # | Tema | Propuesta |
| --- | --- | --- |
| L1 | Nombres y entrega | **`GEmpty`** (`g-empty`) y la región que carga: **`GSkeleton`** (`g-skeleton`) si se elige A (el molde es un esqueleto), o `GLoading` si se elige C; descartados `GAsync` y `GSuspense` (prometen datos o choca con `<Suspense>` de Vue). Motor interno `utils/loadPhase.js` (dueño bruno). **Paquete principal**: los necesita cualquier aplicación con datos, como la isla (#317) pero mucho más pequeños (estimación de kiwi: `GEmpty` ≈ 1 KB gzip, región + motor ≈ 2,5 KB). **Componente complejo** (motor de estado y tiempos, se solapa con cinco anfitriones): coco y bruno en Opus |
| L2 | API de `GEmpty` | `cause` (`none` · `filtered` · `error` · `forbidden`, obligatoria), `title` (obligatorio), `description`, `icon` (nombre de Lucide; por defecto según la causa, `none` sin icono por defecto), slot por defecto (descripción rica) y slot `actions` (`GBtn`), `headingLevel` opcional (por defecto párrafo). Para `filtered` (B): `filters` = `[{ key, label, count? }]` y eventos `relax(key)` y `clear`; con `count`, solo se ofrecen los que devuelven algo, de más a menos. Sin región viva. Textos sin valores por defecto (#226) |
| L3 | API de la región | `loading` (Boolean), `labels` (`loading`, `slow`, `loaded` con `{count}`, `refreshing`; sin valores por defecto), `label`/`labelledby` (nombre del `group`), **slot con alcance `{ items, mold }`** con `items` (los reales) y `sample` (muestra para el molde de A), `keyBy` (foco por clave; por defecto `data-key`), **`refresh`** `keep` (B, por defecto si se elige B) · `replace`, `error` (Boolean o texto: con contenido conocido, B lo conserva y pone el aviso encima; sin contenido, la aplicación pone su `GEmpty cause="error"`). La región **no decide** el vacío: la aplicación pinta `GEmpty` dentro cuando no hay datos (la región solo lo anuncia por su título, L5) |
| L4 | Constantes de tiempo | `200 ms` de retraso, `400 ms` mínimo a la vista, `5000 ms` de espera larga: **constantes de diseño** (#187, como `HOVER_MS`), no tokens: no son movimiento ni tema. Sin props `delay`/`minimum` en v1 (reservadas, L13). Los anfitriones las heredan del motor |
| L5 | Anuncios | Canal cortés **compartido por página** (`createLiveWriter` + fusión en el ciclo + sin repetir idénticos), creado en el primer montaje; regla de frecuencia del punto 4; el resultado vacío anuncia el `title` del `GEmpty` hijo (la región lo encuentra por un `provide`/registro, sin leer el DOM). Avisos de desarrollo: `loading` sin `labels.loading` solo si la región no está dentro de otra que hable. `inbox` (`none`) no entra en la lista de la librería: lo registra la aplicación (#201) |
| L6 | Foco | Puntos 8 y 9: al empezar, si el foco está dentro de lo que queda inerte, a la región (`tabindex="-1"`, `role="group"` con nombre); al llegar, al mismo `keyBy` si existe; si no, la región; nunca `body`. Igual en los anfitriones que adopten el motor (hoy `GTable` lo resuelve solo al limpiar filtros) |
| L7 | Tono | **Un solo tono de marcador** para todos los componentes, opaco: `color-mix(in srgb, var(--g-color-text) 18%, var(--g-color-surface))` (1,46:1 claro, 1,71:1 oscuro). Decidir si es **token nuevo** (`--g-color-placeholder`, que el CLI derive y valide ≥ 1,3:1) o alias local repetido. Sustituye a `surface-sunken` (≈ 1,08:1) en `GTable`, `GWidget` y `GCalendar` y a `border-strong` (con alfa) en `GCard` y `GSummary`. Criterio ≥ 1,3:1 del punto 15 (no es un mínimo de WCAG) |
| L8 | Técnica del molde (A) | `.mold` sobre el contenido real: `color: transparent`, fondos fuera, bordes en el tono, sombras fuera; **barra solo en hojas** (`:not(:has(*))`, `line-through`, grosor `0.72em`, `skip-ink: none`); `img`/`svg`/`video`/`canvas` ocultos con su caja; `.known` (o `data-g-known`) conserva la tinta. En forzados, `forced-color-adjust: none` y `GrayText`. Límites: texto directo de un elemento con hijos sin barra; controles de formulario como cajas vacías. Constante `0.72em` para tokens.md (#187) |
| L9 | Movimiento | Sin keyframes nuevos ni pulsos. A: transición de `color`, `text-decoration-color`, `background-color` y `border-color` con `--g-duration-slow` + `--g-ease-out` (con reducido, `--g-duration-fast`), nada se desplaza ni escala. B: ninguno. C: giro finito (`iteration-count` 6) que acaba antes de 5 s. Regla general para todos: **ninguna animación de carga pasa de 5 s** (2.2.2) |
| L10 | Adopción por los anfitriones | `GTable`, `GCard`, `GWidget`, `GCalendar`: adoptan el motor dentro de su `loading` (retraso, mínimo, 5 s, foco) sin cambiar API ni dibujo; **retiran el pulso infinito** (`g-table-pulse`, `g-widget-pulse`, `g-card-pulse`, `g-calendar-pulse`; #299 §5 y 2.2.2) y adoptan el tono de L7 y `GrayText` en forzados (hoy `GTable`, `GWidget` y `GCalendar` no tienen regla). Sus slots `empty`/`error` reciben `GEmpty`. `GTable` #327: el `error` reservado se pinta con `GEmpty cause="error"` y suprime `labels.results`. `GDataList` y `GMetric` no cargan: se envuelven en la región. `GSummary`, `GCombobox`, `GSelect`, `GBtn` no cambian. Otros hallazgos del inventario: `GWidget` crea su `role="status"` **con** el esqueleto y no desde el montaje (#14: puede no anunciarse); `GCalendar` pone `aria-label` en un `div` genérico (nombre prohibido en `generic`); `widget.md` dice `duration-fast/press` para el pulso y el CSS usa `duration-spin` |
| L11 | Fronteras | `GProgress`: **cuánto** de una tarea con medida (`progressbar`); la región: **qué forma** tendrá algo de avance desconocido (sin rol). Isla: lo que afecta a la página y dura; `GEmpty cause="error"`: esta región, aquí; con las dos, la región no anuncia su error (`announce: false` o vínculo con la condición) y lleva `GStatusMark` (#327). `GToast`: resultado de una acción. Líneas de estado de `GCombobox`/`GSelect`: se quedan |
| L12 | Personalidad | Registrar en `DECISIONS.md` la elegida. Con la recomendación: A «la tinta llega a su sitio» (fundido de color, sin curva nueva) y «el molde es la plantilla»; B «nada se borra» (refresco sin vaciar, error sin pérdida, «Nueva» con texto); el vacío «primer hueco» y «la salida con cuentas» |
| L13 | Reservas | Causa `done` (bandeja al día: vacío positivo); props `delay`/`minimum`; «Cancelar» en la espera larga (con un evento, sin `fetch`); cuenta de avance en el texto de 5 s («3 de 24»); C como forma compacta (`appearance="phrase"`) para celdas y paneles; molde de listas largas con un tope de filas |
| L14 | Pruebas de bruno | Las de `verificar.mjs` como base de `tests/empty-skeleton.spec.mjs` (o el nombre que fije L1): tiempos (100/250/900/6000 ms), Δ0, anuncios y fusión, grupo, foco (fuera, por clave, reintentar), causas, salida con cuentas, refresco `keep`, error que conserva, espera larga sin animaciones, reducido, RTL, forzados, táctil |

## Pregunta de producto (una)

**¿Qué forma tienen la carga y el vacío en Grana?**

1. **A + B (recomendada):** la primera carga es la plantilla real sin tinta, que la recibe en su sitio; al refrescar, lo de antes sigue (inerte, con un filo y «Actualizando») y el error no lo borra; el vacío es el primer hueco y, si es por un filtro, dice cuál quitar y cuántas vuelven.
2. **Solo A:** molde en la primera carga y en el refresco (el molde de lo último conocido); vacío como primer hueco.
3. **B con la base:** barras convencionales (bien medidas) en la primera carga; al refrescar, lo último conocido; vacío como salida con cuentas.
4. **C:** sin formas: una frase que se ve y se oye igual; vacío como frase con sus acciones.
