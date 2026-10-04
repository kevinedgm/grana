# Declaración — ficha de resumen (`GSummary`, nombre de trabajo), r01: base funcional

> kiwi, 2026-10-04. Prototipo: `index.html` (kit neutro; motor `summary.js` + `summary.css`, banco `lab.js`; componentes reales `GAvatar`, `GBadge`, `GSurface`, `GTable`, `GBtn` de `dist/`). Verificación: `verificar.mjs` en Chromium, Firefox y WebKit; cifras en «Comprobaciones». Frontera y nombre: `brief.md`. La forma: `../r02/`.

## Anatomía

```
raíz  (span; contenido de frase; sin rol salvo `group` cuando va suelta)
├─ identidad      avatar (GAvatar) | icono (GIcon) — decorativa, aria-hidden
├─ cuerpo
│  ├─ cabecera    [código] título · estado (GBadge)
│  ├─ línea secundaria (subtitle)
│  └─ datos       identificador (el dato de mayor prioridad) · datos… · «+N»
└─ acción         (slot; solo en bloque)
```

## Decisiones (numeradas)

**Semántica**

1. **Todo es contenido de frase** (`span`): la ficha vive dentro de `option`, `button`, `a`, `td` y de la ficha `aria-hidden` de un campo. Dentro de un anfitrión interactivo **no lleva roles ni controles**; el nombre accesible del anfitrión es su texto.
2. **Suelta** (en una tarjeta, una vista previa, una lista propia): `role="group"` con `aria-labelledby` = el título. **No es `article`** (no es contenido sindicable) **ni lleva encabezado propio**: si la página necesita un encabezado, lo pone el anfitrión (`GCard` con `headingLevel`) y la ficha va sin título repetido, o el anfitrión envuelve la ficha. Sin `dl`: dentro de `option` no es válido, y una misma marca en todos los modos evita dos árboles distintos; cada dato es «rótulo valor» en texto.
3. **Identidad decorativa** (`aria-hidden`): el título ya nombra. `GAvatar` sin `label` (#295); el hueco adopta su caja.
4. **Separadores para el lector:** cada parte termina con un separador oculto («; »), para que el nombre de una opción no se lea «001000Edad».

**Datos y prioridad**

5. Cada dato es `{ label, value, priority?, short? }`. **`priority`**: número, menor = más importante; sin ella, después de los que la declaran y en el orden del arreglo. El orden del DOM es el de prioridad: orden visual = orden de lectura (WCAG 1.3.2).
6. **Identificador = el dato de mayor prioridad**, o `code` si la entidad lo tiene (diagnóstico «E11.9»). No hace falta una prop aparte. Regla dura: **es lo último en ceder** (10 y 11).
7. `short` es el rótulo abreviado visible («Exp.»); el lector recibe el mismo texto (no se duplica con `aria-label`: dentro de `option` no se puede).
8. **Formato:** la ficha no formatea. Números y fechas llegan como texto ya formateado por la aplicación (sin `Intl` propio: la aplicación conoce idioma, zona y unidad; como `facts` de #335). La ficha solo pone `font-variant-numeric: tabular-nums`.

**Adaptación (intrínseca, sin umbrales)**

9. **Nada se oculta con `display: none` ni `visibility: hidden`.** Los datos van en una línea flexible con salto (`flex-wrap`) y alto máximo de N líneas (`max-block-size: N lh; overflow: hidden`): el que no cabe **salta entero** a una línea recortada. Deja de verse, sigue en el árbol de accesibilidad. No hay umbrales en píxeles: depende del texto real, del idioma y de la fuente del tema. Un centinela de ancho cero y una línea de alto evita que el primer dato se quede cortado a medias.
10. **Orden de cesión** al estrechar: (1) datos, por el final; (2) el estado (salta a una línea recortada de la cabecera); (3) el título, con elipsis, hasta su suelo (7ch en bloque, 4ch en línea); (4) la marca «+N» y el rótulo del identificador (estado **apretado**, `data-tight`); (5) el valor del identificador, con elipsis. La acción no cede: es un control (un control recortado seguiría recibiendo foco sin verse).
11. **El identificador nunca desaparece antes que otro dato** y, en línea, **gana al título**: entre cuatro «María García López», «Mar… 001000» distingue y «María García Ló…» no (coherente con #335: el dato que distingue nunca tiene una sola fuente).
12. **«+N»**: cuenta de datos recortados, medida (un `ResizeObserver` en la raíz). Es **decorativa** (`aria-hidden`): el lector ya recibe todos los datos. No aparece si no hay recorte.
13. **Elipsis:** el texto completo sigue en el DOM (el lector lo lee entero). Para puntero, `title` nativo **solo** en la parte que quedó cortada (medido). `title` no llega a teclado ni a táctil: por eso la ficha **nunca es la única fuente** de un dato cortado; el anfitrión ofrece la vista completa (vista previa, detalle, tarjeta).
14. **El ancho lo da el contenedor** (`contain: inline-size` + `inline-size: 100%`): la ficha no aporta ancho a su anfitrión. Sin esto, en una celda de `GTable` ensancha la tabla (medido). El anfitrión de ancho automático (celda, fila flex) le da un mínimo.

**Modos (los decide el anfitrión, que conoce su alto)**

15. **`inline`**: una línea; para dentro de un campo, una celda densa, un item de menú. **Δ0**: no cambia el alto de su anfitrión. Estado y línea secundaria (si hay datos) solo para el lector. Sin acción.
16. **`row`** (por defecto): cabecera + datos, `lines` líneas en total (2 por defecto; 3 o más: identificador y datos fluyen juntos; 0 = sin límite). Alto constante en cualquier ancho. Sin acción (el anfitrión es lo accionable).
17. **`stack`**: cabecera + rejilla de pares (rótulo sobre valor, `auto-fill`); crece en alto, no oculta. Acción al pie.
18. **`panel`**: identidad grande al lado, título de sección, pares en rejilla. Acción al lado.
19. **`auto`**: elige `row` / `stack` / `panel` por el **ancho propio** medido: < `space × 60` (240px), < `space × 130` (520px), ≥. Constantes de diseño derivadas de `space`, como `GCard` (#130); sin `@container` (no admite `var()`, #34). Sin medición (SSR), `row`.
20. **Tamaños = los de `GAvatar`** (`xs` 20, `sm` 24, `md` 32, `lg` 40, `xl` 64 con `space` 4). Por defecto: `inline` `xs`, `row` `md` (2 líneas = 44px: cabe en la fila de lista, tabla y opción), `stack` `lg`, `panel` `xl`. Texto ≥ 12px en todos.

**Estados**

21. **Carga:** `aria-busy="true"` y formas decorativas (identidad + una o dos barras) con el alto del modo: Δ0 al llegar los datos. El anuncio es del anfitrión.
22. **Vacío** (sin título): un texto atenuado que entrega la aplicación (sin texto por defecto, #226).
23. **Sin identidad, sin datos, sin estado:** cada parte es opcional; solo con título y línea secundaria equivale a la fila rica de hoy.
24. **RTL:** todo con propiedades lógicas; identidad al inicio. `forced-colors`: sin fondos como única señal; borde de «+N» y barras del esqueleto con colores del sistema.

## Estados de la ficha

| Estado | Marca | Qué cambia |
| --- | --- | --- |
| Normal | — | Todo lo que cabe |
| Con recorte | `data-clipped` en cada dato recortado; «+N» visible | Los datos del final no se ven; se leen |
| Apretado | `data-tight` | Sin «+N», identificador sin rótulo visible |
| Carga | `aria-busy`, `su--loading` | Formas |
| Vacío | `su--empty` | Texto atenuado |
| Tramo (`auto`) | `data-tier` | `row` / `stack` / `panel` |

## Comprobaciones

`node design/lab/summary/r01/verificar.mjs` · 2026-10-04 · Chromium, Firefox, WebKit · **4 694 comprobaciones**. Pasada completa en los tres motores: 4 693 pasan y 1 falla (WebKit: un 404 de un recurso de `dist/` mientras otro agente reconstruía; no es de la ficha). Repetido WebKit solo: 1 564 de 1 564.

| Qué | Cómo | Resultado |
| --- | --- | --- |
| Sin desborde | Seis casos (opción ×5 fichas, campo, campo con código, vista previa, tarjeta, celda ×5) × 29 anchos (160 a 720px, paso 20) × LTR y RTL: ninguna parte visible cruza el borde de la ficha; la ficha no sale de su anfitrión; el anfitrión no desplaza | Pasa |
| Nada cortado a medias | Toda parte visible está entera o tiene elipsis; un dato o cabe entero o no se ve | Pasa |
| Identificador siempre entero | Dato ancla o código visible y sin elipsis en todos los anchos y casos | Pasa (de 160 a 720px) |
| Título visible | ≥ 20px en todos los anchos | Pasa |
| Lector lee todo | Ningún rótulo, valor, título, código ni estado con `display: none`, `visibility: hidden` ni ancestro `aria-hidden`; a 240px el texto de la opción contiene los cuatro datos con sus rótulos; en Chromium, el árbol accesible (`ariaSnapshot`) de la opción los incluye | Pasa |
| «+N» = recortados | La cifra coincide con los `data-clipped` | Pasa |
| Alto por contexto | Opción y celda: mismo alto en los 29 anchos (ficha 44px = 2 líneas). Campo: igual que el campo de referencia con texto plano (Δ0) en los 29 anchos | Pasa |
| Tarjeta `auto` | Con 16px de relleno en la tarjeta, cambia de tramo a 276px (`stack`, ficha de 242px) y a 556px (`panel`, ficha de 522px). Alto: `row` 78px; `stack` 208px (164px cuando caben cuatro pares en una fila); `panel` 154px | Informado |
| Rejilla | 200 a 928px (paso 52), mínimo 224px por tarjeta: ninguna ficha desborda | Pasa |
| Móvil 320 | La página no tiene desplazamiento horizontal | Pasa |
| RTL | Identidad al inicio (derecha); batería completa repetida | Pasa |
| Movimiento reducido | Sin animaciones propias en curso tras cinco cambios de ancho | Pasa (la base no anima) |
| Contraste | Mínimo medido de texto: 6.9:1 (rótulo atenuado sobre la opción activa) | Pasa (≥ 4.5:1) |
| Consola | Sin errores | Pasa |

**No comprobado:** lector de pantalla real (VoiceOver, NVDA: que el texto recortado por `overflow` se lea igual que en el árbol de Chromium); `forced-colors` (reglas escritas, sin medir); táctil real; zoom de texto al 200 %; idiomas con palabras largas (alemán) y CJK; la ficha dentro de `GCombobox`, `GMenu` y `GSelect` reales (aquí, opción estática); esqueleto con Δ0 medido; rendimiento con cientos de fichas (un `ResizeObserver` por ficha).

## Qué lo hace distinto

La tarjeta de resumen genérica tiene dos versiones (compacta y completa) y un umbral que las cambia, o deja que el texto se parta y crezca. Aquí **no hay versiones ni umbrales para los datos**: la ficha contesta en cada ancho «qué cabe, con este texto», dato a dato, por prioridad declarada, y lo que calla lo dice («+N») y lo sigue leyendo el lector. Y hay una regla que ninguna librería tiene: **el identificador gana al título**, porque en una lista de homónimos el nombre no distingue. La identidad visual (cómo se ve esa corriente, qué pasa entre vecinas, qué forma toma el objeto) se decide en r02.

## Hallazgos para lima

| # | Tema | Propuesta |
| --- | --- | --- |
| L1 | Nombre | `GSummary` (`g-summary`) o `GEntity`; pregunta al usuario en r02. Entrada: paquete principal (sin motor, sin capa) |
| L2 | Datos | `title`, `subtitle`, `code`, `avatar` (`true` \| `{ src, name }`), `icon`, `facts` (`{ label, value, priority?, short? }`), `status` (`{ label, color }` → `GBadge`). Mismos nombres que la opción de `GCombobox` (#335) salvo `label` → `title` y `description` → `subtitle`: decidir si la ficha acepta también `label`/`description` o si `GCombobox` traduce |
| L3 | Disposición | `layout` (`inline` `row` `stack` `panel` `auto`; por defecto `row`), `lines` (Number, 2; 0 = sin límite; solo `row`), `size` (los de `GAvatar`; por defecto según `layout`) |
| L4 | Slots | `lead` (identidad propia), `action` (solo `stack`/`panel`), `status`. Sin slot por dato en v0.1 |
| L5 | Identificador | Sin prop: dato de mayor prioridad, o `code`. Documentar la regla de cesión (10, 11) como contrato, no como estilo |
| L6 | Accesibilidad | Prop `group` (o `as`/`role`) para la ficha suelta; dentro de anfitrión, sin rol. «+N» `aria-hidden`. Separadores ocultos. `title` nativo solo en lo cortado |
| L7 | Clases de estado | `data-clipped` (por dato), `data-tight`, `data-tier`, `is-anchor`: contrato entre bruno (mide) y coco (pinta) |
| L8 | Adopción en `GCombobox` sin romper #335 | La opción por defecto, `__token` y la vista previa pasan a pintar la ficha (`row`, `inline`, `stack`); la opción conserva sus campos; `facts[].priority` es aditivo. La descripción accesible (`ID-about`) no cambia. Los slots `option`, `value` y `preview` siguen ganando. Las clases `g-combobox__main`, `__facts`, `__fact`, `__token-label`, `__token-meta`, `__preview-facts` dejarían de pintarse: decidir si se retiran o conviven una versión |
| L9 | Tokens | Ninguno nuevo en la base: `space`, roles de texto, `color-text`/`-muted`, `border-strong`, `radius-pill`. El suelo del título (7ch, 4ch) y los tramos (`space × 60`, `× 130`) son constantes de diseño |
| L10 | Bidi | Un valor latino o numérico dentro de RTL se une al rótulo en una sola tirada: `<bdi>` o `dir="auto"` en rótulo y valor (como #282). Sin medir con texto árabe o hebreo real |
| L11 | Anfitriones de ancho automático | La ficha no aporta ancho (14): `GTable` debe dar ancho a la columna (`min`), y un padre `inline-flex` necesita `min-inline-size`. Aviso de desarrollo si la ficha mide 0 |
| L12 | Avisos de desarrollo | Más de un dato con la misma `label`; `action` en `inline`/`row`; `lines` fuera de `row` |

## Para bruno y coco (anotado, no decidido aquí)

- El `ResizeObserver` cambia el alto observado (tramo, «+N»): aplazar un cuadro (`requestAnimationFrame`) o WebKit avisa «ResizeObserver loop» (medido y corregido en el prototipo).
- La medida de «+N» converge en tres pasadas como máximo (sin marca → con marca → apretado); no usa estado reactivo por dato.
- El centinela de la línea de datos necesita **alto de una línea**: con alto cero, la primera línea mide cero y el primer dato no salta (medido en Chromium).
- Los textos ocultos accesibles deben quedar contenidos en su parte (`position: relative` en la parte): si no, en RTL ensanchan el desplazamiento del anfitrión (medido).

## Preguntas de producto

Ninguna en r01 (todo deriva de WCAG, APG y contratos vigentes). El nombre y la forma se preguntan en `../r02/declaracion.md`.
