# Declaración de cumplimiento · GSidebar · r01

**Estado:** aprobada. Las decisiones de estructura y accesibilidad se derivan de estándares (WCAG 2.2 AA: 1.3.1, 1.4.1, 1.4.10, 2.1.1, 2.4.3, 2.4.7, 2.5.8, 4.1.2; patrón *disclosure navigation menu* de APG). El usuario decidió el alcance: navegación por **arreglo `items` + slots**, búsqueda **solo disparador**, y adaptación **expandida → riel → drawer** por el ancho del contenedor con `mode` manual. **Añadido después:** en móvil, un **navbar inferior** (primeros N items + «Más» que abre el drawer completo).
**Ruta:** R1 · **Fidelidad:** F2 · **Material:** kit neutral de grises (el significado se lee por forma, peso y texto, no por color).
**Siguiente dueño:** lima → `design/contracts/sidebar.md`.

Prototipo: `index.html` (sin dependencias). Contiene: el sistema completo en un escenario de ancho variable (expandida, riel, **navbar inferior** y drawer; controles de flotante, superpuesto, modo, búsqueda, usuario y «muchos items»), el muestrario de estados de un item (default, hover, focus, active, rama activa, expanded, disabled), el panel flotante del riel, la pista del riel, el menú del usuario y el drawer con `<dialog>`.

## Decisiones de estructura

| # | Decisión | Fundamento |
| --- | --- | --- |
| 1 | La raíz contiene un `<nav aria-label>` con **solo** los grupos, enlaces y botones de submenú; la cabecera (logo, contraer, búsqueda) y el pie (usuario) van **fuera** de la región de navegación. Verificado: la búsqueda no está dentro del `<nav>` | WCAG 1.3.1; una región de navegación no debe mezclar acciones ajenas |
| 2 | Item = `<a href>`; el actual lleva `aria-current="page"`. Item con hijos = `<button aria-expanded aria-controls>`; un **padre con un hijo activo** se marca como **rama activa** (peso y color), **no** con `aria-current` (que es solo del destino) | APG disclosure navigation; WCAG 4.1.2 |
| 3 | **Un solo nivel de hijos** (item → hijos), con sangría corta (20px) y línea de conexión sutil a su izquierda; no hay nietos | Petición del usuario: profundidad contenida |
| 4 | Cada grupo es un `<ul>` con nombre por `aria-labelledby` (su título). En el riel el título se oculta **visualmente** pero **queda en el DOM** (verificado: 4 títulos, `clip-path: inset(50%)`) | WCAG 1.3.1 |
| 5 | **Riel:** las etiquetas se ocultan visualmente y **siguen en el DOM**: el nombre accesible es el texto real, no un `aria-label` ni un tooltip. Verificado: 14 etiquetas en el DOM, recortadas; nombres «Inicio», «Bandeja, 12 sin leer», «Mensajes, Hay mensajes nuevos» | WCAG 2.5.3, 4.1.2; petición del usuario |
| 6 | **Indicadores** (contador, punto): la parte visible es `aria-hidden` y el texto oculto lo da la aplicación (`badgeLabel`); en el riel pasan a una marca pequeña sobre el icono | WCAG 1.4.1, 1.1.1 |
| 7 | **Pista del riel:** un solo elemento `popover` `aria-hidden`, a la derecha del item, que aparece con **retardo** con el puntero y con **foco visible** (sin retardo); no es la única fuente del nombre | Petición del usuario; WCAG 1.4.13 (no es la única fuente) |
| 8 | **Panel flotante del riel:** un padre lo abre con **clic, Enter, Espacio o →** y con el **puntero encima** (150ms); **el foco solo no lo abre** (verificado). Está **pegado al item** (hueco de 4px), con una muesca que lo conecta, y lleva el nombre del padre como `role="group"` con `aria-label` y un título visible | Petición del usuario (conectado al item original); WCAG 2.1.1 (no depende del puntero) |
| 9 | Panel abierto **con teclado**: el foco va al hijo actual (o al primero); ↑ ↓ Inicio Fin se mueven; **Esc o ← lo cierran y devuelven el foco al padre**; Tab hacia fuera lo cierra. Verificado: → abre y enfoca «Todos»; Esc cierra y el foco vuelve al padre; elegir un hijo navega, cierra y marca la rama | APG; WCAG 2.4.3 |
| 10 | Con el puntero: al salir del item o del panel hay **220ms de gracia** para llegar al otro; salir sin volver lo cierra (verificado) | Evitar cierres accidentales |
| 11 | **Teclado en la lista:** Tab recorre los enlaces (patrón de disclosure); además ↑ ↓ Inicio Fin mueven entre los items **visibles** y no deshabilitados. Verificado: Inicio → Bandeja → Mensajes; Fin → Ajustes | APG; WCAG 2.1.1 |
| 12 | **Deshabilitado:** un `<a role="link" aria-disabled="true">` **sin `href`**: no recibe foco (verificado) pero se lee en modo de exploración; tachado y atenuado (no depende del color) | WCAG 1.4.1 |
| 13 | **Estado activo:** fondo de la superficie con un contorno de 1px y una sombra tenue, más peso; sin barras ni colores de acento. Hover: fondo apenas más oscuro. Foco: contorno de 3px | Petición del usuario (silencioso, integrado); WCAG 2.4.7 |
| 14 | **Adaptación automática por el ancho del contenedor:** ≥ ~960px expandida, ~600–959px riel, < ~600px **navbar** (o drawer si la aplicación elige `mobile="drawer"`); constantes del prototipo, el contrato las derivará de `space`. Verificado: 998px expandida, 798px riel, 418px navbar | Petición del usuario: un solo sistema |
| 15 | **Elección manual** (botón de contraer/expandir): **se conserva mientras el ancho no cambie de clase**; al cambiar de clase se descarta y vuelve a decidir el ancho. `mode` manual fija el estado. El botón lleva `aria-expanded` y un nombre que cambia («Contraer…»/«Expandir…»). Verificado | Petición del usuario: no depender solo de breakpoints |
| 16 | **Drawer:** `<dialog>` modal desde el borde inicial (ancho `min(320px, 86vw)`) con **el mismo contenido expandido**; atrapa el foco, cierra con Esc, con el fondo y **al elegir un destino** (`closeOnNavigate`), y **devuelve el foco al botón que lo abrió**. La aplicación pone el botón de abrir. Verificado: 320px, `left: 0`, foco dentro, elegir cierra y el foco vuelve | Foco y Esc nativos (APG dialog); petición del usuario |
| 17 | **Scroll:** la región de navegación hace scroll propio; **cabecera y pie quedan fijos** (verificado con «muchos items») | Petición del usuario |
| 18 | **Variantes:** fija (borde a la derecha) y flotante (margen, radio y sombra), y **superpuesta** (`overlay`: el riel se expande **sobre** el contenido sin moverlo) | Petición del usuario |
| 19 | **Búsqueda:** un botón con aspecto de campo compacto (icono, «Buscar», atajo) que **solo emite** `search`; en riel, un botón de icono de 44px con su nombre en texto oculto. La aplicación decide qué abre | Decisión del usuario |
| 20 | **Usuario:** un botón con avatar, nombre y rol (`aria-haspopup`); en riel, solo el avatar con nombre en texto oculto. El menú del prototipo es un popover con botones **sin** `role="menu"`: el menú completo (roles y flechas) será un componente aparte | Alcance; APG menu button exige más de lo que este componente debe resolver |
| 21 | **Objetivos:** item de 40px (44px con `pointer: coarse`); botones del riel de 44px; hijos de 36px (44px táctil) | WCAG 2.5.8 |
| 22 | **RTL:** propiedades lógicas; el panel, la pista y la muesca salen hacia el lado final (el prototipo las espeja) | Internacionalización |
| 23 | **Navbar móvil (abajo):** `<nav aria-label>` inferior de ancho completo con `<ul>`: N items (icono de 22px sobre etiqueta de 12px, al menos 44×52px; el prototipo mide 79×52 con 5 celdas en 418px) y un botón final **«Más»**. El activo lleva la misma superficie elevada del sidebar; los contadores son una marca sobre el icono con texto oculto. Deja el relleno inferior del área segura (`env(safe-area-inset-bottom)`). Verificado a 418px: pegado abajo, 65px de alto, etiquetas de 12px | Petición del usuario; WCAG 2.5.8, 1.4.4 (texto ≥ 12px) |
| 24 | **Qué entra en la barra:** los items marcados `primary` o, si no hay, los **primeros N** no deshabilitados (N = 3, 4 o 5; 4 por defecto). Un **padre** en la barra es un botón `aria-haspopup="dialog"` que **abre el drawer con su rama abierta**; no hay submenús dentro de la barra. Verificado | Decisión del usuario (primeros N + «Más»); contener la profundidad |
| 25 | **«Más»** abre el mismo drawer del modo `drawer` (`<dialog>` modal, 320px): toda la navegación con grupos, **búsqueda y usuario**. Elegir un destino lo cierra y **el foco vuelve al botón que lo abrió** («Más» o el padre). Verificado: abre con foco dentro, elegir «Equipo» cierra y el foco queda en «Más»; «Proyectos» abre con su rama abierta y elegir «Todos» devuelve el foco a «Proyectos» | Decisión del usuario; APG dialog; WCAG 2.4.3 |
| 26 | **Orientación con la página actual fuera de la barra:** «Más» (o el padre) se marca como **rama activa** (peso y color) con el texto oculto «contiene la página actual»; **no** lleva `aria-current` (solo el destino real). Verificado: elegir «Equipo» marca «Más»; elegir «Inicio» lo desmarca | WCAG 1.4.1, 4.1.2 |
| 27 | **Teclado en la barra:** Tab recorre los items y «Más»; ← → (invertidas en RTL), Inicio y Fin mueven entre ellos. Verificado: Inicio → Bandeja; Fin → «Más»; Inicio → «Inicio» | APG; WCAG 2.1.1 |
| 28 | **Un solo estado de navegación** (página actual y ramas abiertas) compartido por las tres formas: al pasar 1000 → 800 → 420px la página actual se conserva (expandida marca «Todos»; en el navbar, «Proyectos» queda como rama activa). Verificado | Petición del usuario: mismo sistema |
| 29 | `mobile`: `navbar` (por defecto) o `drawer` decide qué es «móvil» en el modo automático; con `drawer`, el botón de menú lo pone la aplicación y la barra inferior no existe. Verificado con el selector «en móvil» | Alcance: sigue siendo posible el drawer solo |
| 30 | **Personalidad del navbar — decisión del usuario: «píldora activa».** Los otros estilos (indicador deslizante, acción central) y el liso se descartaron; quedan en el prototipo solo como referencia. Tres estilos evaluados con la misma estructura y el mismo marcado: (a) **píldora activa flotante**: barra flotante de esquinas amplias con sombra; el item actual se **expande en una píldora** oscura con icono y etiqueta y los demás quedan como icono (su etiqueta sigue en el DOM); el ancho de la píldora se anima al cambiar de página; (b) **indicador deslizante flotante**: todas las etiquetas visibles y una **superficie que se desliza** bajo el item actual; (c) **acción central**: barra de borde a borde con «Más» como botón **circular elevado** en el centro (el DOM sigue el orden visual). El **liso** (borde a borde) queda como referencia. Verificados a 338px, con el cambio de página animado (el indicador pasó de «Inicio» a «Mensajes» y la píldora se reacomodó) | Petición del usuario («le falta personalidad»); la estructura, los nombres y el teclado no cambian |
| 31 | En la **píldora activa** (estilo elegido), los items inactivos muestran **solo el icono** (etiqueta oculta visualmente, siempre en el DOM): es el precio de la personalidad; la etiqueta visible del actual mantiene el contexto. **Riesgo de descubribilidad:** un usuario nuevo no ve los nombres de los demás | WCAG 4.1.2 (el nombre existe); a decidir con el usuario |
| 32 | En el **indicador deslizante**, con 5 celdas en 338px las etiquetas de 12px se **recortan** («Mensaj…», «Proyect…»): las etiquetas del navbar deben ser cortas (una palabra) o la barra tener ≤ 4 items | WCAG 1.4.4 (texto ≥ 12px, no se reduce) |
| 33 | **Movimiento:** la píldora y el indicador usan transiciones de ~0.3s; con `prefers-reduced-motion: reduce` se quitan (el cambio es inmediato). La animación no transmite información que el estado (`aria-current`) no tenga | WCAG 2.3.3 |

## Criterios revisados

| Criterio | Resultado | Cómo |
| --- | --- | --- |
| WCAG 1.3.1 Información y relaciones | Cumple | `nav` con `aria-label`; grupos con `aria-labelledby`; títulos presentes en el riel |
| WCAG 1.4.1 Uso del color | Cumple por diseño | Prototipo en grises: activo por contorno y peso, rama por peso, disabled por tachado |
| WCAG 1.4.13 Contenido al hover o foco | Cumple por diseño | La pista no es la única fuente del nombre; el panel se abre también con teclado y se cierra con Esc |
| WCAG 2.1.1 / 2.4.3 Teclado y foco | Cumple | Tab, ↑ ↓ Inicio Fin, →, Esc, ←; foco al abrir y al cerrar (panel y drawer) |
| WCAG 2.5.8 Tamaño del objetivo | Cumple | 40 a 44px |
| WCAG 4.1.2 Nombre, función, valor | Cumple por diseño, sin confirmar con lector real | `aria-current`, `aria-expanded`, `aria-controls`, `aria-haspopup`, nombres por texto |
| WCAG 1.4.10 Reajuste | Cumple | El drawer usa `min(320px, 86vw)`; sin desborde del escenario |
| WCAG 1.4.3 / 1.4.11 Contraste | Sin verificar con tema real | Grises del kit; el texto atenuado usa #757575 (4.6:1); lo audita coco |

## Comprobaciones ejecutadas

- Chromium, `localhost:4174`, ventanas de 1240px y de 688px. Sin errores en consola.
- **Adaptación:** 998px → expandida (264px), 798px → riel (64px), 498px → drawer; de vuelta a 998px → expandida. La elección manual se conserva al mover el ancho dentro de la clase y se descarta al cambiar de clase.
- **Estructura:** `<nav aria-label="Principal">`; la búsqueda queda fuera; 4 grupos; padres con `aria-expanded` y `aria-controls`; deshabilitado sin foco.
- **Riel:** 14 etiquetas en el DOM (recortadas), 4 títulos de grupo en el DOM, items de 44px; nombres con contador («Bandeja, 12 sin leer»).
- **Panel flotante:** clic lo abre (hueco de 4px, nombre «Proyectos», 3 hijos, foco en «Todos»); Esc lo cierra y devuelve el foco; el foco solo **no** lo abre; el puntero lo abre (con retardo) y salir lo cierra; → lo abre con foco en el primer hijo; elegir un hijo navega, cierra, marca la rama y el hijo actual.
- **Teclado en la lista:** ↓ ↓ → «Mensajes»; Fin → «Ajustes»; Inicio → «Inicio».
- **Submenú en línea** (expandida): el botón alterna `aria-expanded` y muestra u oculta sus hijos.
- **Navbar:** a 418px, 5 celdas de 79×52px pegadas abajo (`<nav>` «Principal»); con 3 items en la barra hay 4 celdas; contador y nombre «Bandeja, 12 sin leer»; ← → Inicio Fin; «Más» abre el drawer (320px, 4 grupos, con búsqueda y usuario); elegir un destino cierra y devuelve el foco a «Más»; el padre «Proyectos» abre el drawer con la rama abierta; «Más» y «Proyectos» se marcan como rama activa cuando corresponde; pasar a `mobile="drawer"` sustituye la barra por el botón de menú.
- **Drawer:** abre como `dialog` modal de 320px pegado al borde, foco dentro; elegir un destino cierra y el foco vuelve al botón; cerrar con Esc/`close` deja `open` en falso.
- **Scroll:** con «muchos items», la región central hace scroll y cabecera y pie no se mueven.

## Comprobaciones NO ejecutadas

- **Lector de pantalla real** (VoiceOver, NVDA, TalkBack): cómo se anuncian el riel (etiquetas ocultas visualmente), las ramas, los contadores y el panel.
- **Contraste**, `forced-colors` y `prefers-reduced-motion` reales con el tema real: lo audita coco.
- **Pista con foco por teclado:** se comprobó la ruta de código, no la aparición visual con un Tab real.
- **RTL** con un idioma RTL real (propiedades lógicas escritas, no recorridas).
- **Táctil real:** en un riel táctil no hay «hover»; se abre con toque (comprobado solo por clic sintético).
- **Firefox y Safari** (`popover`, `<dialog>`, `:has`).
- **Muchos items reales** (cientos) y rendimiento; el estado persistido lo hace la aplicación.
- **Superpuesto y flotante:** revisados visualmente una vez; sin mediciones detalladas.

## Hallazgos para lima

| # | Hallazgo | Severidad | Propuesta de la ronda |
| --- | --- | --- | --- |
| 1 | Nombre y modelo | Alta | `GSidebar`; `items`: arreglo de grupos `{ id?, label, items }` con items `{ id, label, href?, icon?, badge?, badgeLabel?, dot?, disabled?, children? }` (un nivel de hijos); `activeId` (o `v-model:active`) y `label` (nombre del `<nav>`, sin valor por defecto) |
| 2 | Estado | Alta | `mode`: `auto` (por defecto) `expanded` `rail` `drawer`; `collapsed` (Boolean, `v-model:collapsed`, solo con el estado manual); `open` (`v-model:open`, solo drawer); `variant`: `fixed` `floating`; `overlay` (Boolean) |
| 3 | Umbrales del `auto` | Alta | Sin valores literales de tema: derivar de `--g-space-1` (≈ 960 y 600 del prototipo) y decidir con el ancho del contenedor (no del visor); consulta de medios literal solo si hace falta (excepción documentada, como #42, #56 y #65) |
| 4 | Textos | Alta | **Sin textos por defecto**: `labels` (`collapse`, `expand`, `close`, `search`, `menu`…) como en `GDatePicker`; `badgeLabel` y `label` de la aplicación |
| 5 | Búsqueda | Media | `search` (Boolean) o slot `search`; texto (`searchLabel`/`searchPlaceholder`) y atajo (`searchHint`) de la aplicación; evento `search` |
| 6 | Usuario | Media | Slot `user` con `{ collapsed }` (avatar y nombre de la aplicación); evento `user-click` o slot `user-menu`; el menú completo será `GMenu` |
| 7 | Slots | Alta | `logo` (`{ collapsed }`), `search`, `item` (`{ item, active, collapsed }`), `icon` (`{ item }`), `footer`/`user`, `header` |
| 8 | Eventos | Alta | `update:collapsed`, `update:open`, `navigate` (`{ item }`, cancelable si la app usa un router), `search`, `toggle` |
| 9 | Router | Media | Sin dependencia: con `href`, un enlace normal; con un router, `item.to` + slot `item` o un componente de enlace (`linkComponent`) — decisión de lima |
| 10 | Panel flotante y pista | Media | `popover` y elementos propios; tokens de superficie/sombra existentes (`--g-surface-*`, `--g-shadow-*`); tiempos (150/220/350ms) como tokens o constantes de bruno |
| 11 | Persistencia | Baja | La aplicación (guardar `collapsed`); el componente no toca `localStorage` |
| 12 | Cantidad de items y densidad | Baja | `auto` no usa el número de items (el scroll lo resuelve); `density` para la altura del item |
| 13 | Drawer | Media | `closeOnNavigate` (por defecto verdadero); `dialog` nativo; el botón de abrir lo pone la aplicación y debe recibir el foco al cerrar |
| 14 | Navbar móvil | Alta | `mode`: `navbar` además de `auto`, `expanded`, `rail` y `drawer`; `mobile` (`navbar` por defecto, `drawer`) para el modo automático; `barItems`/`primary` (items de la barra) y `barCount` (3 a 5, por defecto 4); las etiquetas de «Más» y «contiene la página actual» las da la aplicación (`labels.more`, `labels.moreActive`) |
| 15 | Espacio del navbar | Media | El componente en modo `navbar` va **fijo abajo**; la aplicación necesita reservar el espacio en su contenido: proponer un token de estructura (p. ej. `--g-sidebar-bar-size`) o una variable expuesta; safe area con `env()` |
| 16 | Padres en el navbar | Media | Un padre en la barra abre el drawer con su rama abierta (`onMore` con la rama); alternativa descartada: submenús dentro de la barra |
| 17 | Estilos del navbar | Media | `navbarStyle`: `pill` `slide` `fab` `plain` (según la decisión del usuario; el marcado y los nombres son los mismos); la superficie flotante y el indicador usan `--g-surface-*`, `--g-shadow-*`, el color de la selección (`color`) y `--g-radius-*`; el indicador deslizante se posiciona con variables CSS dinámicas |
