# Declaración — aviso en línea y de página (`GNotice`), r01 · base funcional

**kiwi · 2026-10-04.** Prototipo: `index.html` (componentes reales de `dist/`: `GForm`, `GErrorSummary`, `GInput`, `GFormActions`, `GDialog`, `GCard`, `GTable`, `GBtn`, `GToaster`; `XNotice` de prototipo). Verificación: `node design/lab/alert/r01/verificar.mjs` (`GRANA_PW_PORT=4209`).

> **Estado.** El usuario vio r01 y lo encontró genérico («la caja de aviso de siempre»). Tiene razón: r01 se cierra como **base funcional**. Se conserva lo de comportamiento (puntos 1 a 27); **la forma no está aprobada** y se decide en `r02/` entre tres conceptos. Lo que r01 llamaba «N1/N2/N3» pasa a ser comportamiento base, no personalidad.

## A. Semántica y anuncio

1. **El aviso no es una región viva.** Ni `role="alert"` ni `role="status"` ni `aria-live` en el aviso ni dentro. Razón medida: lleva botones, un detalle que se abre, una cuenta atrás y cambia de tipo; como región viva releería todo en cada cambio.
2. **Se anuncia un texto compuesto por un canal compartido**: `tipo: título. cuerpo` (sin nombres de botones), con el algoritmo de `utils/liveRegion.js` (vaciar, escribir en el ciclo siguiente, vaciar a los 5 s). Un **par de canales por anfitrión** (`status` cortés + `alert` enérgico, `aria-atomic`): el `body`, o el `<dialog>` modal que contiene al aviso (lo de fuera de un modal es inerte). El número de regiones vivas no crece con el número de avisos.
3. **Cuándo se anuncia** (`announce="auto"`): solo si el aviso **aparece** en una vista que ya estaba a la vista (se monta con su componente padre ya montado, o su modelo pasa a `true`). Presente desde la carga, o montado junto con una vista nueva (un diálogo que se abre): **no** se anuncia (WCAG 4.1.3 habla de cambios de estado, no de contenido estático). `error` → enérgico; el resto → cortés (misma tabla que `GToast`). `announce` admite `polite`, `assertive`, `off`.
4. **También se anuncia** el cambio de `type` o `title` con el aviso a la vista, y los umbrales de la cuenta atrás (punto 22). Abrir el detalle o cerrar no anuncian. «Copiar» anuncia «Copiado» (cortés).
5. **Raíz = `role="group"` con nombre**: `aria-labelledby` al título (que empieza por el prefijo oculto de tipo: «Error: No se pudo guardar») o, sin título, al tipo. Sin tipo ni título: sin rol.
6. **Tipo sin color** (WCAG 1.4.1): forma del icono Lucide (`info`, `circle-check`, `triangle-alert`, `circle-alert`; `neutral` sin icono), prefijo oculto y la convención de borde de `GToast`/`GCard` (sólido en error, discontinuo en advertencia). El prototipo no usa color y los tipos se distinguen. `error` usa el color `danger` (#133).
7. **Título**: `<p>` fuerte por defecto; con `headingLevel` (2 a 6), encabezado. Un aviso que aparece no debe alterar el esquema de encabezados.
8. **Con `GErrorSummary`**: validación → resumen (toma el foco, su `role="alert"`); fallo del servidor → aviso (no toma el foco, canal enérgico). Medido: nunca hay dos `role="alert"` visibles con texto ni textos repetidos entre regiones vivas.
9. **Con `GToaster`**: canales distintos, textos distintos, cada uno una vez. `GBtn` con `loadingText` trae su propia región (#14); no se duplica con el aviso.

## B. Foco

10. **Nunca toma el foco al aparecer** (APG Alert). Medido en formulario, tabla, diálogo y banda.
11. **`focus()` a petición** de la aplicación (error que bloquea): la raíz recibe `tabindex="-1"` solo mientras tiene el foco (pulsar su texto no mueve el foco). Con `announce="off"` no hay doble lectura.
12. **Al cerrar o retirarse con el foco dentro**, el foco pasa al **siguiente elemento tabulable** del documento (o del diálogo); si no hay, al anterior. Nunca al `body`. Vale para el botón de cierre, para el modelo y para el `v-if` de la aplicación.
13. **Si el aviso cambia y el control con foco desaparece** («Reintentar» al resolverse), el foco pasa a la raíz del aviso y **no** se anuncia por el canal (el foco ya lee el nombre nuevo).
14. **Esc no cierra** un aviso (no es una capa; chocaría con `GDialog`).
15. Orden del DOM y del teclado: contenido (título, cuerpo, conmutador de detalle) → acciones → cierre.

## C. Contenido

16. **Acciones**: slot con `GBtn`. «Reintentar» usa `loading`/`loadingText` de `GBtn`.
17. **Detalle técnico**: Disclosure (`aria-expanded`, `aria-controls`, panel `hidden`), texto en `dir="ltr"`, se parte en 320px. «Copiar» escribe en el portapapeles y emite `copy`.
18. **Cierre**: `dismissible` + `closeLabel` sin valor por defecto (#226). Modelo `modelValue` opcional (sin él, estado propio). No hay cierre automático: lo transitorio es de `GToast`.
19. **Densidad** `default`/`compact` (título y cuerpo en una línea).

## D. Página

20. **Posición en el DOM**: primer contenido del documento, **antes de `main`** y del shell. La coloca la aplicación; el componente no se teletransporta.
21. **Varias condiciones**: orden por gravedad (error, advertencia, información, éxito, neutro) en el DOM (nunca con `order` de CSS) y **como máximo 2 a la vista**; el resto espera. Lo ordena la aplicación en v0.1.
22. **Cuenta atrás** (sesión por caducar; WCAG 2.2.1): `deadline` + función de texto. Visible en `role="timer"` con `aria-live="off"`; se anuncia solo al cruzar 5 min, 1 min y 30 s; `expire` al llegar a cero.
23. **No fija por defecto**; `sticky` opcional. Fija: publica su alto como reserva del borde superior (en Grana, `edgeReserve.js` #225; el prototipo usa `offset` de `GToaster`) y la página lo pone en `scroll-padding-top` (WCAG 2.4.11). Se suelta en visores de ≤ 420px de alto. Una banda fija debe ser **hija directa del contenedor que desplaza** (un envoltorio de su alto anula `sticky`: medido).

## E. Sin saltos (base de comportamiento)

24. **No mueve lo que la persona está usando.** Al entrar o salir, si el elemento con foco (o el último pulsado, para WebKit, que no enfoca botones con ratón) queda **debajo** del aviso y hay desplazamiento disponible, el aviso crece hacia arriba: se corrige el desplazamiento cuadro a cuadro y ese elemento no se mueve. Si el aviso está por encima del visor, lo mismo (anclaje propio: WebKit no tiene el nativo). Si no, empuja hacia abajo de forma continua.
25. **Cambia en el sitio**: de error a éxito (o de «sin conexión» a «conexión restablecida») es el mismo nodo; no se desmonta.
26. **Movimiento reducido**: sin animación, la compensación sigue.
27. **Salida animada solo con modelo.** Vue no ejecuta la salida de un `<Transition>` cuyo componente se desmonta (`v-if` de la aplicación): la retirada es inmediata, con el foco rescatado y una sola corrección de desplazamiento.

## Comprobaciones hechas (los tres motores)

`verificar.mjs`: Chromium 94, Firefox 92, WebKit 92, 0 fallos (pasada final de r01; en Firefox, un aviso de consola intermitente, L12). Carga sin anuncios (14 avisos); árbol accesible; señal no cromática; orden del DOM y Tab; ≥ 24×24; validación frente a servidor; detalle y copia; cambio de tipo en el sitio con rescate del foco; cierre con foco; «Guardar» Δ ≤ 1px (≤ 1,5px en WebKit, que redondea `scrollTop`) mientras el aviso entra y sale, con teclado y con ratón; tabla; éxito persistente; `GCard`; `GDialog` (advertencia estática sin anuncio, error anunciado en el canal del diálogo, foco en «Guardar», borde superior Δ0); `focus()`; `GToaster`; bandas (orden, máximo, página arriba y desplazada, `sticky` con reserva y 2.4.11, visor bajo); cuenta atrás con reloj simulado; 320px; RTL; movimiento reducido; `forced-colors` (solo Chromium lo emula).

## No comprobado

Lector de pantalla real (VoiceOver, NVDA): que el canal recién creado en un diálogo se lea, que el grupo con nombre se lea al recibir el foco. Safari real y táctil real. `forced-colors` real y en Firefox/WebKit. Lectura del portapapeles. Zoom 400 %. SSR. El contraste (no hay color en r01).

## Hallazgos para lima

- **L1** Nombre `GNotice`; `type` (`neutral` por defecto, como `GToast`), `title`, `icon` (nombre o `false`), `density`, `headingLevel`, `dismissible`, `closeLabel`, `modelValue`, `announce`; textos sin valor por defecto (`typeLabel`, `detailsLabel`, `copyLabel`, `copiedLabel`; quizá un `labels`). Slots `default`, `title`, `icon`, `actions`, `details`. Eventos `close`, `update:modelValue`, `copy`, `expire`. Métodos `focus()`, `announce()`.
- **L2** Canal compartido: útil interno (ampliar `liveRegion.js` con un anunciador por anfitrión). Recomendado: que `GToaster`, si está montado, sea ese anunciador (ya vive en el modal superior) para quedar en **un** par de canales.
- **L3** El canal del `body` debería existir desde `app.use(Grana)` o desde el primer aviso montado, no desde el primer anuncio.
- **L4** «Vista nueva»: el prototipo observa el atributo `open` del `<dialog>`. En Grana, los contenedores que montan su contenido al abrirse (`GDialog`, `GTabPanel` perezoso) deberían darlo por contexto.
- **L5** Un segundo fallo idéntico no cambia `type` ni `title`: la aplicación llama a `announce()`.
- **L6** `GTable` no tiene estado de error: documentarlo en su README remitiendo a este componente (o valorar un slot).
- **L7** `GForm`: al pulsar «Guardar» con un campo recién editado, el mensaje que aparece al perder el foco **mueve el botón bajo el puntero** entre `mousedown` y `mouseup` y el clic se pierde (medido con Playwright en este prototipo). Es de `GForm`, anterior a este componente; el punto 24 lo resolvería si se generaliza.
- **L8** Banda fija y su contenedor (punto 23); reserva solo cuando es fija.
- **L9** En `GDialog` centrado el aviso crece hacia abajo (#301) y «Guardar» baja 79px: el punto 24 no aplica porque el diálogo no desplaza. Mismo límite que #281.
- **L10** Iconos de caso (`lock`, `unplug`) ya están en la lista de la librería; un reloj para la sesión no.
- **L11** Salida con `v-if` (punto 27): documentar que la salida animada requiere `v-model`.
- **L12** Firefox escribe a veces en consola «Scroll anchoring was disabled… too many consecutive adjustments» durante la compensación del punto 24 (intermitente; las medidas pasan). Para bruno: corregir con menos pasos (redondear a píxel entero) si el punto 24 se construye.

## Preguntas al usuario

Se trasladan a `r02/` (forma y nombre).
