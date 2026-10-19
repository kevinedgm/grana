# Declaración — isla de estado, r03: que se entienda

**kiwi · 2026-10-18.** Reproducción sobre la isla **real** del playground (`reproducir.mjs`, tres motores) y tres conceptos de comportamiento sobre una base común (`base.js`, `index.html?c=A|B|C`, tokens reales del tema por defecto). Verificación: `node design/lab/alert/r03/verificar.mjs` (`GRANA_PW_PORT=4213`), **381/381** en Chromium, Firefox y WebKit (A, B, C y D). Solo lectura sobre código y contrato: los cambios van como hallazgos a sus dueños (§8).

> **Addendum del 2026-10-19 · D · Isla dinámica.** Tras leer A, B y C, el usuario dio una dirección que ninguna cumple del todo: que un error se muestre **y desaparezca**, sin quedarse estorbando, y que caiga del borde con suavidad, «como la isla dinámica de los iPhone», sin fogonazos. D está en §5bis (`index.html?c=D`); la comparativa (§6) y la pregunta (§9) ya incluyen D.

## 0. En una frase

La isla cumple casi todo su contrato, pero el contrato le pide a la persona que adivine tres reglas que nadie le dice: que un error es *estado* y lo quita la aplicación, que «Entendido» no cierra sino que guarda, y que el punto es esa memoria. A eso se suma un defecto real al nacer (una franja oscura a todo el ancho durante 1 a 4 cuadros) que explica «abrupta y tosca».

## 1. El ciclo, como lo vive alguien que no conoce el contrato

Playground, sección «Isla de estado», 1280×800, tema por defecto. `reproducir.mjs` repite cada paso y mide.

| # | La persona hace | Espera | Pasa (medido) | Manda |
| --- | --- | --- | --- | --- |
| 1 | Pulsa «Guardar»; el servidor falla | Ver el error cerca del botón y poder cerrarlo | La isla nace **ya abierta**, arriba al centro (416×244px), lejos del botón; junto a «Guardar» aparece «No se guardó». Botones: «Detalle técnico», «Reintentar», «Ir al formulario», «Entendido». **Ninguno dice cerrar.** Un anuncio enérgico; el foco sigue en «Guardar» | #319 apertura automática (D3), #323, #320 |
| 1b | (el nacimiento, cuadro a cuadro) | Ver de dónde sale | **Antes de tener tamaño, la superficie se pinta a todo el ancho del visor** (1264px; 4 cuadros en Chromium, 3 en Firefox, 1 en WebKit, opacidad hasta 1) y luego salta a 416px. El fundido y la escala de 0,86 casi no se ven: el primer cuadro pintado ya está opaco. `evidencia-nacer.png` | **Defecto** frente a #324 y D4 |
| 2 | Lee y espera | Que se vaya sola, como un aviso | A los 8 s sigue abierta. Nada dice que no se irá ni cómo cerrarla | #319 «nunca se cierra por tiempo» |
| 3 | Pulsa fuera | Que se cierre | Se repliega a una píldora (255×48px) con el título. **No se va** | #319 «cerrar la abierta» |
| 4 | La abre y pulsa «Entendido» | Que desaparezca | Queda un **círculo de 32px** con el icono del tipo, sin texto, sin `title`, sin pista al pasar el puntero (cursor `pointer`). Solo el lector oye «Estado: 1 aviso. Error: No se pudo guardar la factura» | #316 D2, #319 punto |
| 5 | Abre el punto y «Reintentar» | Que se arregle o poder quitarlo | Gira 0,9 s y **vuelve el mismo error**: la demo trae «El servidor falla al guardar» marcado. El error no es `dismissible`: **no hay forma de quitarlo** salvo «Quitar todas» (un botón de la demo, no de la isla) | #318; playground |
| 6 | «Sin conexión» y luego «Vuelve la conexión» | Que el aviso de conexión se vaya | Con el error delante, el resumen sigue diciendo «No se pudo guardar la factura +1»: **lo nuevo no se ve**. Al volver la conexión: «**Correcto: Conexión restablecida. Los cambios se guardarán al volver.**» (la descripción vieja sobrevive a `resolve`) y se queda hasta «Entendido» | #319 orden; #318 `resolve` |
| 7 | Mantenimiento y un éxito | Ver cada uno | El resumen sigue en el error, «+3». Lo nuevo solo se ve abriendo | #319 |
| 8 | El servidor vuelve; «Reintentar» | Que el error desaparezca | Pasa a «Factura guardada…» en el mismo sitio (bien, D4), pero **conserva el «Detalle técnico» del 500** («POST /api/facturas · 500 Internal Server Error») y se queda hasta «Entendido» | #318 `update` fusiona |
| 9 | «Entendido» con varias | Que se cierre todo | Se van los éxitos; **queda el punto** por el mantenimiento | #319 |
| 10 | Móvil, 375px | Ver el error | Replegada arriba; al tocar, hoja. Tras «Entendido», el mismo punto mudo | #322 |

**Por qué confunde, en cinco líneas:**
1. Nace como una franja a todo el ancho que se encoge de golpe, y nace ya abierta, lejos de lo que la persona tocó: no se ve de dónde sale ni por qué.
2. Abierta no ofrece ningún «cerrar»; «Entendido» suena a cerrar y no cierra; pulsar fuera tampoco la quita.
3. El punto es memoria, pero no dice nada a la vista: ni qué guarda, ni cuántos, ni que se puede abrir.
4. Un error es «estado que retira la aplicación», no algo que la persona pueda despachar; nada lo dice, y en la demo el error no se retira nunca.
5. El resumen enseña siempre lo más grave: lo que acaba de llegar no se ve, y los resultados se quedan aunque ya no digan nada nuevo.

## 2. Clasificación

### Defectos (no cumplen el contrato o lo contradicen)

| | Defecto | Contrato | Dueño |
| --- | --- | --- | --- |
| **F1** | Al nacer, `__shape` se pinta sin `--_island-w/-h` (`inline-size: calc(var(--_island-w) …)` inválido → `auto` = todo el ancho) durante 1 a 4 cuadros, opaca, y luego salta. En nacimientos posteriores arranca con el tamaño **viejo** de la condición anterior | #324 «nacer: fundido + escala» a su tamaño; D4 continuidad | bruno (medir antes de quitar `hidden`, como ya hace `openRect()`), coco revisa |
| **F2** | El primer cuadro pintado ya está opaco: el fundido de `--g-duration-press` se consume durante la tarea larga del montaje (≈ 120ms en Chromium, 150ms en WebKit) | #324 | bruno (escribir tamaño y quitar `hidden` en un cuadro; la clase de entrada en el siguiente) |
| **F3** | El playground y el README enseñan un error que **no se retira nunca**: «El servidor falla al guardar» viene marcado, el error no es descartable y solo «Quitar todas» lo quita | Frontera: «dura hasta que la aplicación la quita» | bruno (playground), mora-docs (README) |
| **F4** | En el playground y en el ejemplo del README, el éxito tras «Reintentar» **conserva `details` del 500** (el objeto devuelto no pone `details: undefined`) | #318 (`update` fusiona: correcto); el ejemplo es el que falla | bruno, mora-docs |

### Intenciones que no se comunican (cumple, pero no se puede saber)

- **I1 · No hay «cerrar».** La abierta solo tiene «Entendido», que repliega a punto (#319). Esc y pulsar fuera repliegan a compacta, pero nada lo enseña.
- **I2 · No hay cierre por tiempo** (decisión deliberada, #319) y nada lo dice: la persona espera.
- **I3 · El punto no dice qué es** (D2): sin texto, sin cuenta, sin pista visual; solo el nombre accesible.
- **I4 · Un error es estado.** Que lo retira la aplicación (y no la persona) no consta en ningún sitio visible.
- **I5 · El resumen muestra lo más grave, no lo nuevo** (#319): lo que acaba de llegar solo da un toque y suma «+N».
- **I6 · Los resultados se quedan** hasta «Entendido» aunque no lleven enlace («Conexión restablecida»).
- **I7 · Nace lejos de su causa.** El error de «Guardar» aparece arriba al centro; la marca ayuda, pero la isla no sale de ella.

### Decisiones que conviene reabrir

- **R1 · D2 «un solo sitio con memoria» (#316) y la forma punto (#319).** La memoria es buena idea; el punto mudo, no. O habla (B), o la memoria vive junto a su origen (A), o es una cifra legible (C).
- **R2 · «Nunca se cierra por tiempo» (#319).** Recoger lo **abierto automáticamente** a compacta cuando la persona no lo usa no quita información (sigue arriba con su título): no es un límite de tiempo de WCAG 2.2.1 sobre contenido, y aun así se pausa con puntero o foco dentro. Quitar por tiempo un resultado **sin enlace** («Conexión restablecida») es lo que haría `GToast`.
- **R3 · La apertura automática (D3).** Es la causa directa de «abrupta»: una caja de 416×244 aparece sin que la persona la pida. Las tres variantes la cambian (dos tiempos en B; ninguna en A y C).
- **R4 · Errores que nadie retira (#318).** Hoy solo `<GStatus>` limpia al desmontarse; el imperativo (`status.error('save', …)`, que es lo que enseña el README) sobrevive a que la persona se vaya del formulario. Propuesta común: una condición con `origin` **vive con su origen** (si el destino de `origin.target` sale del documento, se retira con motivo `origin`).
- **R5 · `resolve(id, 'texto')` conserva `description` y `details` (#318).** El anuncio sale contradictorio («Conexión restablecida. Los cambios se guardarán al volver.»). Propuesta común: `resolve` también limpia `description` y `details` salvo que `result` los traiga.

## 3. Fronteras y uso real

- **NisaNabani no usa la isla.** No hay `createStatus`, `GStatusIsland` ni `@grana/vue/status` en `nisanabaniCDMX/redesign` ni en `k-oax-table`, y los 22 hallazgos de integración (`PENDIENTES.md` §9) no la nombran. El único uso real es el playground, y la confusión del usuario nace ahí.
- **El playground respeta la frontera** (fallos del servidor, condiciones de página, resultados; la validación no entra; los sucesos breves van a `GToaster`), pero sus casos producen la confusión: error que no se retira (F3), éxito con la traza del 500 (F4), «Conexión restablecida» que repite la descripción vieja (R5), «Más de 6 condiciones» todas descartables (no enseña la diferencia entre condición y resultado).
- **Toast frente a isla.** «Éxito con enlace» y «Conexión restablecida» están en la frontera de `GToast`: si no llevan enlace, son sucesos. R2 lo ordena: resultado sin enlace = se lee y se va.

## 4. Base funcional de r03 (la comparten A, B y C)

Se conserva todo lo que funciona del contrato: condición con clave y mismo elemento (D4), orden por gravedad, par propio de canales (`status` + `alert`, 50/5000 ms, **0 anuncios al cargar**), texto `Tipo: título. descripción`, abrir/replegar/ocultar **no** anuncian, **nunca toma el foco**, **nada se mueve** (todo fijo, fuera del flujo; Δ0 medido en cuatro referencias), Alt+F8 ida y vuelta, Esc repliega sin propagar, el foco nunca acaba en `body`, la marca junto al origen, móvil sin apertura sola.

Tres cambios para los tres conceptos (corrigen F1, R4 y R5):

1. **Medir antes de mostrar.** El tamaño se escribe con la superficie invisible y sin transición; después se revela. Medido: ningún cuadro visible es más ancho que la isla (antes, hasta 1264px).
2. **`resolve` limpia** `description`, `details` y `action`, salvo lo que traiga el resultado.
3. **Vive con su origen.** Una condición con `origin` se retira (motivo `origin`, sin anuncio) cuando su destino sale del documento.
4. Además, en los tres: **un botón de replegar o cerrar visible** en la abierta, con texto («Replegar» / «Cerrar»), y **un resultado sin enlace se lee y se va** (pausado con puntero o foco dentro).

## 5. Conceptos

### A · Hilo: nace de su causa y vuelve a ella

- **Nacer:** si la condición tiene marca (el error de «Guardar»), una cápsula sale **de la marca** y viaja al borde superior (240ms, `--g-ease-out`, solo `transform`; clon `aria-hidden`); sin origen (sin conexión), cae del borde. Aterriza **replegada**, con el título a la vista y un chevron: **nada se abre solo**.
- **Abrir y cerrar:** la abre la persona; arriba a la derecha, «Replegar». Cada condición con origen ofrece **«Ocultar»**: la isla la suelta y la marca sigue junto al botón (recibe el foco). Pulsar la marca la devuelve, con el foco en «Reintentar».
- **Memoria sin punto:** lo que nace de un control **se recuerda en el control** (la marca); lo que no tiene origen (sin conexión) se queda replegado con su texto. No hay círculo mudo.
- **Cierre que se ve:** resuelto («Factura guardada»), se lee arriba unos segundos (pausa con puntero o foco) y **vuelve volando a su marca**, que pasa a «Guardada». Al salir del formulario, todo lo que nació ahí se retira.
- **Qué lo hace distinto:** el aviso tiene trayectoria. La persona ve de dónde sale y adónde vuelve; ningún sistema de avisos conecta el borde de la pantalla con el control que falló. Sirve al usuario porque responde a «¿esto de qué es?» sin leer, y el cierre deja de ser una regla oculta: se ve ocurrir.
- **Coste de accesibilidad:** bajo. El vuelo es un clon `aria-hidden` y con movimiento reducido no existe (fundido). Lo grave ya no se abre solo: se anuncia (enérgico) y se lee en la replegada; quien no ve la pantalla no pierde nada. «Ocultar» no borra: la marca y Alt+F8 lo devuelven.
- **Decisiones que cambia:** #316 D2 (la memoria pasa al origen) y D3 (sin apertura sola), #319 (sin punto; resultados que vuelven a su marca), #323 (la marca guarda la condición oculta), #318 (vive con su origen), #324 (el nacer con origen es un vuelo). Medido: 32/32 por motor.

### B · Punto que habla: la isla de hoy, explicada

- **Nacer en dos tiempos:** cae del borde como píldora (recorte vertical, `--g-duration-press`) y, si es grave y no tapa lo que se usa, **se abre 360ms después**: el ojo sigue borde → píldora → panel.
- **Abierta sola, se recoge sola:** una **línea de lectura** bajo el pie se vacía (8 s); con el puntero o el foco dentro se detiene. Al acabar, vuelve a replegada (no a punto, no se borra nada). Abierta por la persona no se recoge. «Replegar» siempre a la vista; en el pie, una línea que dice lo que va a pasar («Se recoge sola si no la usas» / «Lo que siga vigente queda arriba»).
- **Cada condición dice si es estado:** «Se quitará sola cuando se resuelva» bajo las condiciones persistentes no descartables.
- **El punto habla:** lleva la **cuenta** (≥ 2), un **anillo** único cuando llega algo nuevo y, al pasar el puntero o enfocarlo, una **pestaña visual** (`aria-hidden`, el nombre accesible ya lo dice): «2 avisos siguen vigentes: No se pudo guardar la factura · pulsa para ver».
- **Qué lo hace distinto:** conserva lo que el usuario eligió (un sitio con memoria, apertura sola sin estorbar) y añade algo que los avisos no tienen: **dice su propio plan** (la línea que se vacía, la nota de estado, la pestaña del punto). Sirve porque cada regla oculta pasa a estar a la vista en el momento en que importa.
- **Coste de accesibilidad:** medio. La línea de lectura es un tiempo (se pausa con puntero y foco, y lo que se recoge sigue visible: 2.2.1 no se pierde información); con movimiento reducido no se dibuja. La pestaña del punto depende de puntero o foco: en táctil no hay pasar el dedo (el toque abre). El punto sigue siendo lo menos explícito de los tres.
- **Decisiones que cambia:** #319 (lo abierto automáticamente se recoge por inactividad; resultados sin enlace se van), #324 (nacer en dos tiempos), D2 se mantiene, D3 se mantiene con el segundo tiempo. Medido: 34/34 por motor.

### C · Titular: una cifra por tipo colgada del borde

- **Forma:** una **lengüeta pegada al borde** (esquinas superiores rectas) con una cifra por tipo: insignia + número. Nunca un punto: siempre se lee cuántos y de qué.
- **Llegar:** baja del borde con el **titular** («Error: No se pudo guardar la factura · Ver») y, a los segundos (pausa con puntero o foco), el titular **se recoge en su cifra**, que rueda al número nuevo. **Nada se abre solo.**
- **Abrir y cerrar:** al pulsarla cae la «carta» con la lista y «Cerrar» con su icono. Cada condición: **«Visto»** (su cifra pasa a contorno: sigue vigente, ya leída; el nombre accesible dice «visto») y **«Ocultar»** (sale de la cuenta; queda en «Ocultos» dentro de la carta y Alt+F8 la alcanza). Ocultar lo último retira la lengüeta y deja el foco en la marca.
- **Qué lo hace distinto:** el aviso se comporta como un titular de noticia que se archiva a la vista: se lee, se recoge, y el número que queda dice exactamente qué sigue pendiente. Sirve porque la persona siempre puede contar lo pendiente sin abrir nada y decide ella qué ya vio.
- **Coste de accesibilidad:** medio. El titular es temporal (pausable; el contenido sigue en la carta y en el anuncio). Las cifras dependen de reconocer las insignias (forma + borde + prefijo oculto, como hoy); «visto» se distingue por contorno frente a relleno (no solo color). Pegada al borde, convive con `GPageHeader` por la reserva de borde (#631) igual que hoy.
- **Decisiones que cambia:** #316 D2 (memoria = cifra) y D3 (sin apertura sola), #319 (formas `headline`/`tab`/`open`; «Visto» y «Ocultar» por condición en vez de «Entendido» global), #324 (bajar del borde y cifra que rueda; reutiliza la idea P2 de `GNumberField`, #313). Medido: 29/29 por motor.

### 5bis. D · Isla dinámica: cae, se lee y se recoge subiendo

Es **A sin su vuelo y sin quedarse**: toma de A que la memoria vive junto al control (la marca) y que la condición vive con su origen, y le añade lo que pidió el usuario: la isla es **transitoria** y se mueve como la isla dinámica.

- **Nacer:** una cápsula sin texto (`space × 24` de ancho, la altura de la fila) **cae del borde superior**: `translate` desde fuera del borde, escala 0,9 → 1 y fundido, `--g-duration-slow` con `--g-ease-out` (es una entrada: sin muelle, #299 y #324). Al tocar su sitio **se ensancha** hasta el titular con `--g-duration-slow` y `--g-ease-spring` (el mismo uso aprobado del muelle: el cambio de tamaño, #324 a), y el texto aparece con `--g-duration-press`. Entrada completa ≈ 480ms. **Nada se abre solo.**
- **Leer y recogerse:** el titular se queda el **tiempo de lectura de `GToast`** (#142): `clamp(5000, 2000 + 60 × caracteres, 12000)` ms; el error de «Guardar» (89 caracteres) dura 7,3 s. **Se pausa** con el puntero sobre la isla o sobre su marca, con el foco dentro y con la pestaña oculta; al reanudar sigue el tiempo que quedaba. Al acabar se recoge al revés: el texto se apaga (`--g-duration-fast`), la cápsula **se estrecha** (`--g-duration-slow`, `--g-ease-out`, sin muelle: es una salida) y **sube** por el borde mientras se funde (`--g-duration-slow`, `--g-ease-standard`). Esc con el foco dentro la recoge al momento.
- **Lo que exige acción** («Reintentar», «Ir a…») **no se pierde, pero no se queda flotando:** la isla se recoge y la condición sigue **vigente en la marca** junto a su control («No se guardó»). Pulsar la marca trae la isla **abierta** con el foco en «Reintentar»; Alt+F8 trae todo lo vigente. Sin marca (sin conexión), Alt+F8 es la única vuelta: si la aplicación necesita un indicador permanente de «sin conexión», es una `GStatusMark` de texto en su cabecera, no la isla. **Única excepción: una cuenta atrás** (`deadline`, sesión por caducar) **se queda hasta que la persona actúe**: WCAG 2.2.1 exige avisar y dejar ampliar el tiempo, y un aviso que se va solo no lo cumple.
- **Resultados:** sin enlace («Conexión restablecida») se leen, se recogen y se van del modelo; con enlace («Factura guardada · Ver factura») se recogen y quedan en la marca («Guardada») hasta que el origen se va.
- **Abierta:** la abre la persona (titular, marca, Alt+F8); se expande con continuidad desde la cápsula; «Cerrar» con su icono, Esc o pulsar fuera la cierran **y se recoge**. El foco vuelve al elemento guardado, a la marca o al siguiente tabulable; nunca a `body`.
- **Qué lo hace distinto:** no hay superficie de avisos que *ocupe* la pantalla: hay una cápsula que **nace del borde, dice una cosa y vuelve al borde**, y la memoria está donde la persona la necesita (junto al botón que falló), no flotando. La forma cuenta la vida del aviso: cápsula vacía → titular → cápsula vacía → nada. Sirve porque lo urgente se lee sin estorbar y lo pendiente se recupera desde su sitio.
- **Coste de accesibilidad:** medio y conocido. El texto visible es temporal: se mitiga con el anuncio (enérgico para `error`, sin cambios), la pausa con puntero y foco, Esc, la marca, Alt+F8 y la excepción de `deadline`. **El lector de pantalla no se detecta**: quien lo usa recibe el anuncio completo y vuelve con Alt+F8 o la marca, igual que con `GToast`. 1.4.13 se respeta en su espíritu (se mantiene mientras el puntero está encima, se descarta con Esc, no desaparece mientras se usa). Con movimiento reducido: solo fundidos de `--g-duration-fast`.
- **Decisiones que reabre:** **#316 D2** (desaparece: ya no hay un sitio visible con memoria; la memoria es la marca y Alt+F8) y **D3** (sin apertura sola); **#319** (formas `empty`/`compact`/`open`, sin punto, sin «Entendido», recogida por tiempo, «no desaparece mientras dure alguna condición» pasa a valer para el **modelo**, no para la pantalla); **#315** y la frontera de `toast.md` (la isla deja de ser «información persistente de página»); **#324** (caer y subir; muelle solo al ensancharse); **#323** (la marca guarda lo vigente); **#318** (vive con su origen). Se conservan D1 (nada se mueve) y D4 (continuidad, mismo elemento).
- **Medido** (Chromium; tres motores en §7): primer cuadro visible = cápsula de 91px a media caída (y=31 frente a 72) con opacidad 0,29 y **sin texto**; 5 anchos intermedios al ensancharse, salto máximo 56px de 211; opacidad como máximo +0,24 por cuadro; al recogerse, 29 cuadros estrechando y 14 subiendo. Tira de cuadros: `evidencia-d.png` (arriba: caer y ensancharse; abajo: apagarse, estrecharse y subir).

#### D frente a `GToast`, con honestidad

Con D, **a la vista** la isla se parece mucho a un aviso flotante: aparece, se lee y se va. Lo que la sigue separando no es la forma, es **lo que queda cuando se va**:

| | `GToast` | Isla D |
| --- | --- | --- |
| Qué cuenta | Algo que **pasó** («Copiado», «Cambios guardados», «Informe subido») | Algo que **está pasando** y tiene estado («No se pudo guardar», «Sin conexión», «La sesión caduca») |
| Cuando se va | Se fue: no hay nada a lo que volver | La condición sigue vigente: **la marca** junto a su control y **Alt+F8** la traen de vuelta, abierta y con su acción |
| Modelo | Suceso (sin clave salvo la promesa) | Condición con clave: se actualiza en el mismo elemento (error → reintentando → éxito), `resolve`, vive con su origen, `<GStatus>` |
| Error | No se cierra solo (#142: no tiene otro sitio donde vivir) | Se recoge, porque vive en su marca |
| Dónde | Esquina, pila | Arriba al centro, una sola cápsula |

**Regla que propongo:** si cuando el aviso se va **no queda nada que hacer**, es `GToast`; si **queda algo pendiente** (reintentar, esperar a la conexión, renovar la sesión), es la isla. «Un suceso, un canal» se mantiene. Si el usuario no ve valor en esa diferencia, la alternativa honesta es **fusionar**: que la isla sea un modo de `GToaster` (aviso con clave, arriba al centro) y la marca su memoria. No lo recomiendo hoy: duplicaría el gestor de `GToast` con reglas de error contrarias.

## 6. Comparativa

| | A · Hilo | B · Punto que habla | C · Titular | **D · Isla dinámica** |
| --- | --- | --- | --- | --- |
| Nacer | Sale de la marca y vuela al borde | Cae del borde como píldora; si es grave, se abre 360ms después | Baja del borde como titular | **Cae del borde como cápsula y se ensancha con el titular** |
| ¿Se abre sola? | No | Sí, y se recoge sola si no la usas | No | No |
| ¿Se va sola? | No (sin origen se queda replegada) | No (queda el punto) | No (queda la lengüeta) | **Sí**: se lee y se recoge subiendo; solo una cuenta atrás se queda |
| Lo que queda a la vista | Replegada con texto o la marca | Punto con cuenta y pestaña | Lengüeta con cifras | **Nada flotando**; la marca junto al control |
| Volver a lo pendiente | Marca, Alt+F8 | Punto, marca, Alt+F8 | Lengüeta, marca, Alt+F8 | Marca, Alt+F8 |
| Frontera con `GToast` | Clara (persistente) | Clara (persistente) | Clara (persistente) | **Se acerca**: la separa lo que queda (marca y estado), no la forma |
| Cuánto cambia el contrato | Medio | Poco | Alto | **Medio-alto** (D2, D3, #319, #315 y la frontera de `toast.md`) |
| Riesgo | Sin origen, sigue fija | El punto sigue siendo lo menos claro | Cifras por tipo; dos verbos nuevos | Sin marca, lo pendiente solo vuelve con Alt+F8 |
| Verificado (3 motores) | 32/32 × 3 | 34/34 × 3 | 29/29 × 3 | 32/32 × 3 |

**Recomendación de kiwi tras la dirección del usuario: D.** Cumple las dos cosas que pidió (mostrar y desaparecer; caer del borde sin fogonazos) y conserva lo que A tenía de bueno: lo pendiente se recuerda junto a su botón. A, B y C quedan como alternativas medidas. **F1 a F4 y la base de §4 se corrigen elija lo que elija.**

## 7. Verificación

**Hecha** (`verificar.mjs`, Chromium, Firefox y WebKit; **381/381**: A 32, B 34, C 29 y D 32 por motor): carga sin anuncios; error al guardar con un anuncio enérgico exacto, foco en «Guardar» y Δ0 en cuatro referencias; **ningún cuadro del nacimiento más ancho que la isla** (máx. medido 309px en A, 422px en B con el sobrepaso del muelle, 360px en C; antes, 1264px); dentro del visor; comportamiento propio de cada concepto (A: aterriza replegada, vuelo sin clones, «Replegar», «Ocultar» con el foco a la marca, la marca devuelve la condición y enfoca «Reintentar», `aria-busy`, éxito anunciado, vuelta a la marca, salida del formulario sin anuncio; B: dos tiempos, línea de lectura, nota de estado, pausa con puntero, recogida sin mover el foco, abierta por la persona no se recoge, punto ≥ 24px con cuenta y pestaña, `resolve` limpio; C: titular sin panel, recogida en la cifra, «Cerrar», «Visto» con contorno y nombre accesible, ocultar con foco en la marca, Alt+F8 llega a lo oculto; D: el primer cuadro visible es una cápsula que cae sin texto, se ensancha con anchos intermedios y sin saltos de más del 65 % ni de opacidad de más de 0,7 por cuadro, titular sin abrirse, pausa con el puntero, se recoge estrechándose y subiendo, sin punto y con el error vigente en la marca, la marca la trae abierta con el foco en «Reintentar», Esc la recoge con el foco en la marca, resultado sin enlace que se va, cuenta atrás que se queda, Esc y Alt+F8 con la isla ya ida); Alt+F8 ida y vuelta, Esc, Enter; un solo par de canales y la isla no es región viva; sin anuncios repetidos; abrir y replegar no anuncian; contraste con el tema por defecto (texto 17,4:1, descripción 13,97:1, iconos sobre insignia 5,35 a 5,73:1 en los cuatro tipos, anillo y bordes 13,97:1); controles ≥ 24×24; 320px sin desplazamiento horizontal; móvil sin apertura sola (B); movimiento reducido sin nada que se mueva ni cambie de tamaño, sin vuelo. `reproducir.mjs` mide F1 en los tres motores (4, 3 y 1 cuadros a 1264px).

**No hecha:** la medida de movimiento de coco sobre D (su `auditoria-movimiento-verificar.mjs`, puerto 4214, mide el componente real; aún sin informe en el repositorio): D usa solo tokens existentes y la misma regla de muelle que #324; lector de pantalla real (que el anuncio basta cuando el titular se va solo en D; el nombre que cambia en el titular de C; la pestaña del punto de B, que es solo visual); táctil real (pulsación en el punto de B; el vuelo de A con el teclado virtual abierto); `forced-colors` real; RTL de los conceptos (el vuelo usa coordenadas físicas: hay que comprobarlo); la hoja móvil real en los conceptos (los prototipos abren el panel no modal en 320px: la regla de `GDialog` de #322 no cambia); convivencia con la voz y con `GPageHeader` (especificada, no prototipada); tema oscuro de los conceptos.

## 8. Hallazgos para sus dueños

- **bruno · F1 y F2:** al pasar de vacía a visible, escribir `--_island-w/-h` con la superficie aún invisible y sin transición (el mismo truco de `openRect()`), y solo entonces quitar `hidden`; poner la entrada en el cuadro siguiente. Prueba que falle hoy: ningún cuadro visible de `__shape` más ancho que su tamaño final (`reproducir.mjs` paso 1b). **Corrige el «abrupta» con cualquier concepto.**
- **bruno · F3 y F4 (playground):** «El servidor falla al guardar» desmarcado por defecto, o el error con `dismissible`; el éxito devuelto por `saveRequest` con `details: undefined`.
- **mora-docs · F3 y F4 (README):** el ejemplo de «Reintentar» limpia `details`; el de guardar retira la condición al salir de la vista (o usa `<GStatus>`); decir en «Qué es» que un error es estado y que lo retira la aplicación.
- **lima · R4 y R5:** `resolve` limpia `description` y `details`; regla «vive con su origen» (motivo `origin`); y, según el concepto elegido, las enmiendas de §5 a #316, #319, #323 y #324.
- **coco:** la auditoría de movimiento en curso (puerto 4214) debería incluir el nacimiento cuadro a cuadro (F1): la duración y la curva están bien; el problema es el primer cuadro.

## 9. Pregunta al usuario

**¿Construimos D · Isla dinámica?** (recomendada; A, B y C quedan como alternativas). Si es que sí, solo hay tres cosas que decidir, cada una con una recomendación:

1. **Cuánto se queda a la vista.** Recomendado: el tiempo de lectura de `GToast`, de 5 a 12 s según el largo del texto (7,3 s para «No se pudo guardar la factura» con su descripción), en pausa mientras el puntero o el foco están encima. Alternativa: un tiempo fijo.
2. **Qué pasa con lo que exige acción** («Reintentar»). Recomendado: **se recoge igual** y queda en la marca junto a su botón (y en Alt+F8); solo una cuenta atrás (sesión por caducar) se queda hasta que actúes, porque WCAG lo exige. Alternativa: que todo lo que lleva acción se quede hasta actuar (vuelve a «se queda ahí»).
3. **Frontera con `GToast`.** Recomendado: **dos servicios con una regla**: si al irse no queda nada pendiente, `GToast`; si queda algo pendiente (reintentar, esperar la conexión, renovar), la isla. Alternativa: fusionar la isla en `GToaster` como «aviso con clave arriba al centro».

Con cualquier respuesta se corrigen el nacimiento (franja a todo el ancho), la descripción vieja de `resolve`, el detalle del 500 en el éxito y el error de la demo que no se retira nunca.
