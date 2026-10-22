# Declaración — héroe de marketing (`GHero`), r01

> kiwi, 2026-10-21. **Estado: en revisión** (la base deriva de estándar y se aprueba sola; la forma es decisión del usuario: una pregunta al final). Prototipo: `index.html?c=base|A|B|C` (`&tpl=hotel|restaurante|tour`, `&theme=minimal|rustico|lujo`, `&motion=1`, `&photo=cielo|noche|papel-picado`, `&dir=rtl`). Tokens **reales** del tema por defecto (`packages/vue/dist/grana.css`), `GBtn` real por sus clases, **zona de marca real** (`data-g-zone="brand"`) en B; los temas «rústico» y «lujo» son temas de usuario escritos a mano para juzgar identidad (no derivados por el CLI). Iconos solo Lucide (`design/lab/lucide-icons.js`: `pause`, `play`). Fotos: marcadores locales de `design/lab/marketing/r01/fotos.js`, sin recursos externos. Verificación: `node design/lab/hero/r01/verificar.mjs` (puerto 4231), **767 de 767** en Chromium, Firefox y WebKit. Capturas en `capturas/` (`SHOTS=1`). Auditoría previa y solapes: `brief.md`.
>
> **Nombres del prototipo → propuesta:** `.hero` = `.g-hero`, `.hero__*` = `.g-hero__*`; `.hero--window|views|threshold` = las apariencias A, B y C.

## Anatomía (base)

```
section.g-hero  aria-labelledby="ID-title"     ← región de la apertura; container-type: inline-size (todo mide su caja, no el visor)
├─ div.g-hero__content                          ← PRIMERO en el DOM (orden de lectura y de foco: 1.3.2, 2.4.3)
│  ├─ p.g-hero__eyebrow                         ← opcional: qué es y dónde («Hotel boutique · Centro histórico»)
│  ├─ h1.g-hero__title#ID-title  dir="auto"     ← el único h1 de la página (headingLevel 1 por defecto)
│  ├─ p.g-hero__lead                            ← opcional: la promesa en una frase
│  ├─ [slot consult]                            ← opcional (C): el hueco de la consulta rápida (GBookingBar)
│  ├─ div.g-hero__actions                       ← GBtn lg: principal sólida + secundaria (contorno o enlace)
│  └─ p.g-hero__aside                           ← opcional: el dato que decide («Desayuno incluido · Llegada 15:00»)
└─ figure.g-hero__media                         ← la foto (o el vídeo) de la aplicación
   ├─ img  loading=eager fetchpriority=high width height alt   ← LA prioritaria de la página (LCP)
   ├─ button.g-hero__motion  aria-pressed       ← solo con media en movimiento: «Pausar movimiento» / «Reanudar movimiento»
   └─ figcaption.g-hero__credit                 ← opcional: crédito de la foto
```

## Decisiones de la base (derivan de estándar; se aprueban solas)

1. **Región nombrada por su título.** `section` con `aria-labelledby` al `h1` (WCAG 1.3.1; APG *Landmark Regions*: una `section` con nombre es `region`). No añade `role` propio. Medido: un solo `h1` en las 12 combinaciones (4 formas × 3 plantillas) y la sección se nombra por él.
2. **Un solo `h1`, nivel cambiable.** `headingLevel` 1 por defecto; 2 cuando el héroe no abre la página (un héroe de «Experiencias» bajo otro). El logo del sitio no es `h1` (receta de la cabecera). El tamaño **no** sigue al nivel (#196).
3. **El texto va antes que la foto en el DOM** y la acción principal antes que la secundaria (1.3.2, 2.4.3). Medido: h1 antes de la acción y orden de foco `cta → sec → lo demás` en las cuatro formas. En estrecho, la acción principal queda **sin desplazar** a 390×844 en la base, A y C (B pone la foto primero a propósito: ver su «arriesga»).
4. **El texto nunca se pinta sobre la foto sin una placa opaca** (1.4.3 garantizable, no «según la foto»). La base y A no se tocan con la foto (medido: sin solape de cajas); B y C llevan el texto en una placa con fondo opaco (medido: alfa 1, el texto dentro de la placa) y el contraste **no cambia** con las fotos extremas `cielo` (casi blanca), `noche` (casi negra) y `papel-picado` (alto contraste): 16,48 / 10,9 en B y 17,4 / 7,46 en C con las tres. Se descarta el velo `--g-card-scrim` para el héroe (ver H-L4).
5. **La foto principal es la prioritaria de la página.** `img` en el DOM (no fondo CSS), `loading="eager"`, `fetchpriority="high"`, `width`/`height` (sin salto de diseño, 1.4.10 y CLS) y `decoding="async"`; **una sola** `fetchpriority="high"` por página (medido). Las demás fotos del héroe (la segunda ventana de A, las otras vistas de B) no la llevan.
6. **Foto informativa o decorativa.** Con `alt` de la aplicación es informativa (medido: `alt` presente); la segunda ventana de A es decorativa (`aria-hidden`, `alt=""`, medido). Sin `alt` → aviso de desarrollo (H-L2).
7. **Movimiento con pausa siempre visible** (2.2.2: lo que se mueve más de 5 s y arranca solo necesita pausar). Botón con texto («Pausar movimiento» / «Reanudar movimiento»), `aria-pressed`, 44 px, fuera del texto, en la esquina de la media (medido en B: corre → pausa → el nombre cambia). **Con movimiento reducido arranca en pausa** y la foto queda quieta (medido: `animation-name: none` y el botón ofrece reanudar). En el prototipo el «vídeo» es un movimiento lento de la foto; un vídeo real sigue la misma regla (`muted playsinline loop poster`; `autoplay` solo sin movimiento reducido).
8. **Sin carrusel que avance solo.** Ninguna forma cambia la foto por tiempo (medido en B: 3 s sin tocar, la foto no cambia). Si hay varias fotos, las elige la persona (B) o van en la galería (`design/lab/gallery/r01/`).
9. **Alto por contenido, nunca recortado.** Sin `height: 100vh`; la media usa `aspect-ratio` con `min-block-size` y un tope en `svh` (la barra del navegador móvil no lo corta) y el héroe crece con su texto. Medido a 390×844, 320×640 y **320×256** (≈ 400 %): sin desplazamiento horizontal, título y acción dentro del héroe y nada recortado (1.4.10), en las cuatro formas y los tres motores.
10. **El margen respira con la caja, sin puntos de corte.** `clamp(space×4, 4cqi, space×12)`, como `GContainer` (#722); el título fluye por `cqi` entre title-lg y display × typeScale² (H-L3) y **nunca baja de title-lg** (medido ≥ 31 px a 320). El texto y la foto se parten por su mínimo intrínseco (`flex-wrap`), no por el ancho del visor.
11. **Acciones con `GBtn lg`** (44 px, medido) y jerarquía de una sola principal: sólida + secundaria en contorno (base, B) o enlace (A, C). Dentro de la zona de marca la principal es la tinta invertida (§44.1), sin hacer nada.
12. **RTL por propiedades lógicas** (medido en A: la ventana se espeja a la izquierda, sin desbordar). **`forced-colors`:** la placa de B conserva un borde visible (medido en Chromium); la vista elegida usa `Highlight`. **Foco visible** en la acción principal y en las vistas (medido; en WebKit, las vistas usan la modalidad de foco de `utils/keyFocus.js`, #441/#450, porque WebKit no aplica `:focus-visible` al mover con flechas entre radios).
13. **Carga y error de la foto.** Mientras llega, el marco muestra `surface-sunken` (sin salto: el tamaño ya está reservado); si falla, el navegador muestra el `alt` sobre ese marcador. Sin esqueleto animado: el héroe es lo primero que pinta.

## Estados

| Estado | Qué se ve | Cómo se anuncia |
| --- | --- | --- |
| Reposo | Texto + foto (según forma) | `region` con el nombre del `h1` |
| Foto cargando | Marco `surface-sunken` del tamaño final | — |
| Foto rota | `alt` sobre el marcador | El `alt` |
| Media en movimiento | Movimiento lento + botón «Pausar movimiento» | `aria-pressed="false"` |
| Movimiento en pausa / reducido | Foto quieta + «Reanudar movimiento» | `aria-pressed="true"` |
| B · vista elegida | Foto de la vista; la vista con borde doble y peso de acción | Radio marcado («Habitación, botón de opción, 2 de 3») |
| B · cambiando de vista | Fundido de `--g-duration-slow` (`fast` con reducido) | — (el radio ya lo dice) |
| C · consulta | Tres preguntas con su valor | Lo define `GBookingBar` (su ronda) |
| Foco | Anillo `--g-color-focus` (en la zona, `on-brand-accent`) | — |

## Teclado y ARIA

- Tab: eyebrow y título no son enfocables; `cta` → secundaria → (B) grupo de vistas → (con movimiento) pausa. En C, la consulta va **antes** de la acción: la acción envía lo consultado.
- B: el grupo de vistas es un `fieldset` con `legend` («Vistas») de radios nativos: una parada de Tab, flechas para cambiar (medido: → elige la siguiente, cambia la foto y su `alt`, el foco sigue en el radio). Las capas que no se ven quedan fuera del árbol (`aria-hidden`, `alt=""`, medido).
- Pausa: `button` con `aria-pressed`; Espacio/Intro.
- Sin `aria-live`: nada cambia solo.

## A · La ventana

La foto se ve **por un vano de arco** (semicírculo arriba, radio de tarjeta abajo) junto al texto, con una segunda ventana pequeña de detalle (el mezcal, el plato) que la solapa en la esquina, separada por el color de la página como por un muro. El texto vive en la página, nunca toca la foto. Con línea de tiempo de vista (`animation-timeline: view()`) y sin movimiento reducido, **lo de dentro del vano se desplaza un 3 % al pasar** («la mirada»), como cuando uno camina frente a una ventana; Firefox no lo soporta y queda quieto (medido: Chromium y WebKit `hero-look`, Firefox `none`; reducido `none` en los tres).

### Qué lo hace distinto (A)

El héroe habitual es un rectángulo a sangre; aquí la foto tiene **forma de lugar**: el arco de cantera de los portales de Oaxaca, que un tema minimalista sigue mostrando como arco y un tema de lujo con radios 0 deja como arco puro con esquinas rectas abajo. La segunda ventana da el detalle que vende (la copa, el plato) sin carrusel. Y el contraste está garantizado por construcción: no hay foto que lo rompa.

### Gana y arriesga

- **Gana:** contraste garantizado sin placa; editorial y tranquilo (lujo, minimalista); la acción principal arriba en el teléfono; sin JS (la mirada es CSS).
- **Arriesga:** el arco es un motivo cultural fuerte que puede no servir a todos los productos (H-L10 propone `frame="arch|rect"`); la foto vertical (4:5) obliga a elegir bien el encuadre; la mirada es movimiento ligado al desplazamiento (rúbrica E).

## B · Vistas a elegir

Foto a sangre; una **placa de tinta** (la zona de marca real) se pega al borde inferior de la foto, la solapa un labio (`min(space×40, 12cqi)`) y lleva el texto, las acciones y **las vistas**: dos a cuatro miniaturas con nombre (Patio · Habitación · Terraza de noche) que la persona elige para cambiar la foto. Nada cambia solo.

### Qué lo hace distinto (B)

Sustituye el carrusel por **una elección**: el huésped ve la habitación cuando la pide, con un nombre que le dice qué va a ver, en una sola parada de Tab. La placa es la zona de marca, así que el contraste lo garantiza el CLI con cualquier marca (medido en la placa con el tema «lujo», verde profundo: ≥ 4,5; el «rústico» terracota solo se midió en A) y la acción principal se invierte sola.

### Gana y arriesga

- **Gana:** la foto grande del patrón habitual sin su contraste roto; tres fotos sin carrusel; identidad fuerte con la marca.
- **Arriesga:** en el teléfono la foto va primero y la acción principal queda bajo el pliegue (medido a 390×844); a 1440×900 las vistas quedan bajo el pliegue; descarga 3 fotos (H-L5); la placa oscura con el tema por defecto se lee pesada en «minimalista».

## C · El umbral

Foto a sangre arriba, **sin nada encima** salvo el crédito; una tarjeta blanca cruza su borde inferior (labio `min(space×28, 16cqi)`) con el título, la bajada y **el hueco de la consulta rápida** (llegada · noches · huéspedes; día · hora · personas; fecha · recorrido · personas) antes de la acción.

### Qué lo hace distinto (C)

La consulta no es una barra suelta que flota sobre la foto: **es parte del héroe y está en el umbral**, entre la foto que invita y la página que informa. La acción principal envía lo que se acaba de decir, así que el primer gesto de la página ya es reservar.

### Gana y arriesga

- **Gana:** convierte; la foto a sangre sin texto encima; la tarjeta sigue clara con cualquier foto.
- **Arriesga:** depende de `GBookingBar` (su ronda está en revisión); la tarjeta tapa hasta media foto en estrecho (medido: nunca más de la mitad); es el más «producto de reservas» de los tres y menos editorial.

## Comparativa

| | Base | A · La ventana | B · Vistas a elegir | C · El umbral |
| --- | --- | --- | --- | --- |
| Texto sobre foto | No | No | Sí, en placa de la zona de marca | Sí, en tarjeta |
| Contraste con foto extrema | Independiente | Independiente | Independiente (medido) | Independiente (medido) |
| Fotos | 1 | 1 + detalle | 2–4, elegidas | 1 |
| Acción a 390 sin desplazar | Sí | Sí | No | Sí |
| Identidad | Neutra | Forma de lugar (arco) | Marca (placa) | Conversión |
| Movimiento propio | Pausa del vídeo | La mirada (opcional, CSS) | Fundido al elegir | — |
| JS | Pausa | Ninguno | Radios + capas | Lo de `GBookingBar` |
| Riesgo principal | Genérico | Motivo cultural fijo | Pliegue en el teléfono | Depende de otra ronda |
| Mejor para | — | Hotel boutique, lujo | Hotel con varios espacios, tour | Hotel y restaurante que venden directo |

## Recomendación

**Base + A · La ventana por defecto, C · El umbral como apariencia (`appearance="threshold"`, con el slot `consult`) y B · Vistas a elegir como apariencia (`appearance="views"`).** A es la que mejor sirve al usuario final con cualquier foto y cualquier tema sin coste de JS; C es la que más vende y solo pide un hueco; B es la más llamativa pero su pliegue en el teléfono la hace opción, no defecto. Si se quiere un héroe sin motivo cultural, A lleva `frame="rect"` (H-L10).

## Qué lo hace distinto (resumen)

Un héroe en el que **ninguna foto puede romper el contraste** (el texto vive en la página o en una placa opaca, nunca sobre la foto con un degradado que «suele» funcionar), **la foto principal es siempre la primera en llegar** (una sola prioritaria, sin fondo CSS), **nada cambia ni se mueve sin que la persona lo pida o lo pueda parar**, y que en lugar de un rectángulo a sangre ofrece una **forma de lugar** (A), una **elección de vistas** (B) o **la reserva en el umbral** (C).

## Rúbrica de movimiento (`docs/documentacion/rubrica-movimiento.md`)

Componente: apertura de un sitio de marketing; teléfono y escritorio; toque, ratón y teclado; uso ocasional (una vez por visita), lectura breve. Evidencia = medido en `verificar.mjs`; inferencia = razonado.

| Dimensión | Base | A · Ventana | B · Vistas | C · Umbral | Riesgo y recomendación |
| --- | --- | --- | --- | --- | --- |
| **A. Propósito** | **Cumple**: solo el vídeo de la aplicación, con pausa | **Parcial**: la mirada da profundidad (ventana) pero es decorativa | **Cumple**: el fundido une la elección con su efecto | **N/A** | A: la mirada es opcional (H-L11) |
| **B. Comodidad visual** | **Cumple**: vídeo lento (18 s, escala 1,08) | **Cumple**: 3 % de recorrido, escala fija | **Cumple**: un fundido, sin desplazamiento | **N/A** | — |
| **C. Estabilidad** | **Cumple**: el texto no se mueve | **Parcial**: el interior del vano se mueve con el desplazamiento; el marco y el texto, quietos | **Cumple**: la placa es la referencia | **Cumple** | A: ≤ 3 % y solo dentro del vano |
| **D. Transiciones** | **N/A** | **Cumple**: ligada al desplazamiento, sin estado | **Cumple**: transición de opacidad, interrumpible (inferencia: elegir otra vista a mitad la revierte) | **N/A** | — |
| **E. Control** | **Cumple**: pausa visible (medido) | **Parcial**: la persona no la pide; no hay control propio | **Cumple**: solo cambia al elegir (medido) | **Cumple** | A: sin la mirada si el usuario lo prefiere |
| **F. Accesibilidad y opcionalidad** | **Cumple**: reducido = en pausa (medido) | **Cumple**: reducido = quieta (medido); Firefox = quieta | **Cumple**: reducido = fundido corto | **Cumple** | — |
| **G. Rendimiento** | **Cumple**: `transform` en la foto | **Cumple**: `transform` por línea de tiempo, sin JS | **Parcial**: tres fotos descargadas (H-L5) | **Cumple** | B: diferir las otras vistas |
| **H. Inmersión** | **N/A** | **N/A** | **N/A** | **N/A** | — |

## Frontera con lo que existe

| Componente | Frontera |
| --- | --- |
| `GPageHeader` | Página de **aplicación**: se pega, lleva migas y acciones de registro, no tiene media. `GHero` abre un **sitio**, no se pega y lleva la foto. Nunca los dos en la misma página |
| `GCard media background` | Tarjeta (`article`, `h3`, velo); el héroe no usa velo |
| `GSurface zone="brand"` | La placa de B **es** la zona; no hay tokens nuevos de color |
| `GContainer` | El héroe puede ir dentro (columna) o fuera (a sangre); su margen sigue la misma regla `cqi` |
| `GAppShell` | El héroe va en el `main`, bajo la cabecera; no la atraviesa (H-L6) |
| Galería (`design/lab/gallery/r01/`) | Si hay más de 4 fotos, la acción secundaria abre la galería; el héroe no es una galería |
| `GBookingBar` (`design/lab/booking-bar/r01/`) | C le reserva el slot `consult`; el héroe no sabe de fechas |

## Hallazgos para lima

- **H-L1 · Nombre y paquete.** `GHero` (`g-hero`). Por peso, la base y A son casi solo CSS; B añade los radios y las capas. Propuesta: en el principal con compuerta (≤ 1 KiB, como #723) o, si el usuario elige B o C, en una entrada de marketing compartida (`@grana/vue/marketing` con galería y consulta, o una por componente como #716). Decide lima (#506).
- **H-L2 · Datos y avisos.** Props: `title`, `eyebrow`, `lead`, `aside`, `headingLevel` (1), `media` (`{ src, srcset, sizes, width, height, alt }`, `width`/`height` obligatorios), `appearance`; slots `actions`, `consult` (C), `media` (vídeo de la aplicación), `aside`. Avisos: sin `alt` ni `decorative`; sin `width`/`height`; más de un `GHero` con `headingLevel` 1; un `GHero` y un `GPageHeader` en la misma página.
- **H-L3 · Título fluido.** La escala acaba en `display` 39 px, poco para una apertura de marketing. El prototipo usa `clamp(title-lg, 7.5cqi, display × 1.5625)` (1,5625 = typeScale²) con `line-height: 1.08` y `text-wrap: balance`. Decidir si es una regla derivada (sin token nuevo, como `--g-container-*`) o un rol nuevo `--g-text-hero-*` en `tokens.md` §5; el CLI tendría que escalarlo con `typeScale`. Comprobar 1.4.4 (texto a 200 %) con zoom de solo texto: **no verificado**.
- **H-L4 · El texto nunca sobre la foto sin placa.** Regla de contrato del héroe. `--g-card-scrim` no se reutiliza; si en el futuro se pide «texto sobre la foto», que sea con la zona de marca como placa (B), no con un velo.
- **H-L5 · Prioridad de carga.** Una sola `fetchpriority="high"`; en B las vistas no visibles se cargan después del `load` de la principal (bruno). La segunda ventana de A no se difiere (está en el primer pliegue) pero no es prioritaria.
- **H-L6 · Cabecera sobre el héroe.** El patrón «cabecera transparente encima de la foto» no está en esta ronda: obligaría a `GAppShell` a una cabecera que cambia de fondo al desplazar (enmienda del chasis, #713) y a medir el contraste de su navegación contra la foto. Se deja anotado; no se propone.
- **H-L7 · Vistas de B.** Grupo de radios nativos con `legend` (`labels.views`, sin valor por defecto), modalidad de foco de `utils/keyFocus.js`; ¿se compone `GRadioGroup` con una apariencia de miniatura o es marcado propio? Recomendación: marcado propio (la miniatura no es una de las cinco apariencias de #282).
- **H-L8 · Pausa del movimiento.** `labels.pause` y `labels.resume` sin valor por defecto (#226); arranca en pausa con `prefers-reduced-motion`; `motion` en la media de la aplicación (`<video>` del slot) con la misma regla. Iconos `pause` y `play`, ya en la lista: **ningún icono nuevo**.
- **H-L9 · Placa de B.** `data-g-zone="brand"` en la placa (no en el héroe): la foto queda fuera de la zona. Labio `min(space × 40, 12cqi)`; nunca tapa más de la mitad de la foto (medido). Con `forced-colors`, borde `CanvasText`.
- **H-L10 · Marco de A.** `frame` `arch` (por defecto en A) | `rect`. Proporciones del arco (50 % / 40 % en 4:5) y el muro de `space × 2` con `--g-color-bg` como constantes de geometría (#187), no tokens.
- **H-L11 · La mirada de A.** Uso nuevo de movimiento ligado al desplazamiento (`animation-timeline: view()`), lineal, ≤ 3 %, sin curva de Grana. Es una decisión nueva de movimiento (§29.1 «un uso nuevo… es una decisión nueva»); si el usuario la quiere apagada, A funciona igual sin ella.
- **H-L12 · Fundido de B.** `--g-duration-slow` + `--g-ease-out` (sin muelle); con reducido, `--g-duration-fast`.
- **H-L13 · Slot `consult` de C.** Tarjeta de `min(100% − 2 × margen, space × 220)`; la consulta va antes de la acción. Depende de la elección de `GBookingBar`.
- **H-L14 · Para coco.** El botón de pausa va sobre la foto: su borde `border-strong` + `shadow-1` puede no llegar a 3:1 contra una foto casi blanca (1.4.11); medirlo con `cielo` y, si falla, un anillo de `--g-color-text`. El labio y el tamaño del título son propuestas suyas para afinar.

## Pregunta para el usuario

**¿Qué forma quieres para el héroe?**
1. **Base + A · La ventana por defecto, con C · El umbral y B · Vistas a elegir como apariencias** (recomendado).
2. **Base + C · El umbral por defecto** (el héroe que reserva), con A como apariencia.
3. **Base + B · Vistas a elegir por defecto**, con A y C como apariencias.
4. **Base + A**, sin B ni C.

## Comprobaciones

`node design/lab/hero/r01/verificar.mjs` · 2026-10-21 · puerto 4231 · Playwright de `design/lab/theme-playground/node_modules` · sobre el `dist/` reconstruido a las 11:58 por otra sesión · resultado **767 de 767**:

| Motor | Base | A | B | C | Anchos y temas | Total |
| --- | --- | --- | --- | --- | --- | --- |
| Chromium | 36/36 | 46/46 | 61/61 | 51/51 | 63/63 | 257/257 |
| Firefox | 36/36 | 46/46 | 59/59 | 51/51 | 63/63 | 255/255 |
| WebKit | 36/36 | 46/46 | 59/59 | 51/51 | 63/63 | 255/255 |

(Firefox y WebKit no emulan `forced-colors`: 2 casos menos en B. En WebKit, el Tab no llega a los enlaces por un ajuste del sistema; el foco visible de la acción se mide enfocándola y pulsando una tecla.)

**Corregido durante la ronda:** `--g-space-10` no existe en la escala (1, 2, 3, 4, 5, 6, 8, 12, 16) e invalidaba el relleno de la placa → `space-1 × 10`; la banda de C desbordaba a 390 porque `aspect-ratio` convertía el mínimo de alto en mínimo de ancho → `inline-size: 100%`; el crédito de B quedaba bajo la placa en estrecho → arriba; WebKit no mostraba el foco de las vistas con flechas → modalidad de foco.

**No verificado:** lector de pantalla real (VoiceOver, NVDA, TalkBack: el nombre de la región y el anuncio del radio se infieren del marcado); teléfono real (sol de frente, barra del navegador con `svh`, datos móviles y LCP medido con fotos reales y `srcset`); zoom de solo texto a 200 % (1.4.4) con el título fluido; vídeo real (el movimiento es una simulación); `forced-colors` en Firefox y WebKit; tema oscuro; los temas «rústico» y «lujo» derivados por el CLI (son a mano); el contraste del botón de pausa contra la foto (H-L14); `GBookingBar` real en el slot de C (hay tres botones de muestra).

## Cumplimientos / Correcciones / Pendientes

**Cumplimientos:** estructura con región nombrada y un solo `h1`; jerarquía eyebrow → título → bajada → acciones → dato, con una sola acción principal; delimitación por placa o tarjeta opaca y borde en `forced-colors`; espaciado solo con tokens y `cqi`; reutiliza `GBtn`, la zona de marca y los iconos de Lucide de la lista sin reconstruir nada; foco visible; reflujo a 400 %; RTL; movimiento reducido; sin desplazamiento horizontal a 1440, 390 y 320; consola limpia; nada se anima al montar.

**Correcciones:** las cuatro del apartado anterior; frente al patrón habitual (`brief.md`): texto fuera de la foto, `img` prioritaria en vez de fondo CSS, sin carrusel, pausa del movimiento, alto por contenido.

**Pendientes:** la elección del usuario (una pregunta); lima: H-L1 a H-L13 (contrato, paquete, título fluido, uso nuevo de movimiento en A); coco: H-L14 y el CSS; bruno: la carga diferida de B (H-L5) y los avisos de H-L2; lo no verificado de arriba.
