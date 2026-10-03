# Declaración de cumplimiento · GAvatar · r01

**Estado:** en revisión. Fuente de verdad: `brief.md` de esta ronda.
**Ruta:** R1 · **Fidelidad:** F2 · **Material:** kit neutral de grises para la página; `XAvatar` lee los tokens reales de color y tipo **solo para medir** (las parejas de tokens son propuesta de kiwi; los valores, del tema). Iconos solo Lucide (`design/lab/lucide-icons.js`).
**Siguiente dueño:** lima → `design/contracts/avatar.md` (y las líneas de `card.md`, `table.md`, `menu.md`, `select.md`, `badge.md`, `sidebar.md`, `icons.md` y `tokens.md` que tocan los hallazgos).
**Prototipo:** `index.html` (8 secciones; componentes reales de `dist/`: `GCard`, `GTable`, `GSelect`, `GMenu`, `GSidebar`, `GBadge`, `GTranscript` de `speech.umd.js`). Temas de prueba: `tema-cat12.css` (tema por defecto + 12 categorías) y `tema-marca-cat8.css` (marca `#C8102E` + 8), generados con `@grana/cli` por `generar-temas.mjs`.
**Verificación:** `node design/lab/avatar/r01/verificar.mjs` (Playwright de `theme-playground`; Chromium, Firefox y WebKit): **504/504** (169 + 167 + 167 + hash idéntico entre motores).
**Complejidad (CLAUDE.md, «Modelos por rol»):** se solapa con `GAvatarMotion`, `GBadge`, el `leading` de `GTable` y la marca de `GTranscript`, y entra en los huecos de cinco componentes → **componente complejo: coco y bruno en Opus**.
**Convención:** «propuesta kiwi» = recomendación que se asume si nadie la objeta. Grises, radios del cuadrado y tamaños de icono del prototipo son de wireframe.

## 0. Solapes revisados antes de proponer

| Ya existe | Qué hace | Relación con `GAvatar` |
| --- | --- | --- |
| `GAvatarMotion` (#104 a #106) | Mascota ilustrada con 9 estados y color semántico | **Convive** (tabla del brief). No se absorbe nada en ningún sentido. Comparten la semántica (decorativo / `label`), «nunca interactivo» y el lado en `space` |
| `GBadge` (#59) | Insignia no interactiva con figura + `label`, anclable con `placement` lógico | **Es** el indicador de presencia: `GBadge` anclada sobre el avatar (§9). `GAvatar` **no** gana `status` |
| `GIcon` público (#197 a #203) | Icono Lucide decorativo o con `label` | Fuente de respaldo del avatar. `icon` es un **nombre** (dato) que se resuelve como los nombres de la aplicación (registro → librería); el icono por defecto `user` es propio del componente y sale **solo de la librería** (hallazgo L7) |
| `GTable` `leading` (texto) y `leading-{key}` | Círculo `space × 8` con iniciales que escribe la aplicación en el dato | `GAvatar size="md"` entra en `leading-{key}` sin cambiar la altura de la fila (medido). `leading` de texto **se queda** (L6) |
| `GTranscript`, `__mark` (#247, #259, #260) | Etiqueta de **posición** «A/B», borde de control, discontinua sin asignar, crece con «AA», color por posición si `speakerColors` | **No se migra.** No es una identidad (sin nombres propios por #247) y perdería tres señales que el avatar no tiene: borde ≥ 3:1, discontinua y ancho que crece (vistas lado a lado en §6.5). Solo comparte la regla de color (`cat-k-soft` / `on-cat-k-soft`) y la excepción `CAT_FAMILY_READERS` (L3) |
| `GCard` `lead` (#123) | Caja `space × 10` con marco pensada para un icono | `GAvatar size="lg"` la llena exactamente; el marco sobra con un avatar (L4) |

## 1. Decisiones estructurales

| # | Pregunta | Decisión | Fundamento |
| --- | --- | --- | --- |
| 1.1 | ¿Qué elemento? | **`<span>`** raíz (contenido de frase), con la `<img>` **dentro** | Una `<img>` sola no puede mostrar el respaldo; un `<span>` cabe en `<button>`, `<td>`, `role="menuitem"`, `<p>` y en los huecos `aria-hidden` sin romper el modelo de contenido |
| 1.2 | ¿Fuentes y orden? | **Imagen > `initials` explícitas > `icon` explícito > iniciales del `name` > icono `user`** | Lo explícito gana a lo derivado: con `name="Asistente" icon="bot"` sale el icono (el nombre sigue sirviendo para el color). Sin nada: `user` (el icono genérico de persona) |
| 1.3 | ¿Mientras carga la imagen? | Se pinta **el respaldo** (iniciales o icono) y la `<img>` encima, invisible hasta `load`. **Sin esqueleto** | El respaldo ya es contenido útil; un esqueleto añadiría un tercer estado visual. Medido: 0px de salto de la caja y del texto vecino al cargar y al fallar |
| 1.4 | ¿Si falla? | Se **quita** la `<img>` (sin icono de imagen rota) y queda el respaldo. Cambiar `src` vuelve a «cargando» | HTML: una `<img>` rota pinta un indicador del navegador. Con la imagen ya en caché al montar, se comprueba `complete` y `naturalWidth` (sin parpadeo) |
| 1.5 | ¿Nombre accesible? | **Sin `label`: decorativo** (`aria-hidden="true"` en la raíz). **Con `label`: `role="img"` + `aria-label` en la raíz.** La `<img>` lleva **siempre `alt=""`**. **No hay prop `alt`** | Igual que `GIcon` (#199) y `GAvatarMotion`. El nombre en la raíz no cambia al pasar de cargando a imagen o a fallida (WCAG 4.1.2); una sola fuente de nombre. Medido con `ariaSnapshot` en los tres motores: `img "Ana María López"`, y los decorativos no aparecen |
| 1.6 | ¿Decorativo por defecto? | **Sí** | En casi todos los huecos el nombre está al lado (tarjeta, menú, select, transcript, pie de sidebar expandido) o en el control que lo envuelve (riel). Con nombre: tabla densa o un avatar suelto que es la única identificación (WCAG 1.1.1) |
| 1.7 | ¿Interactivo? | **Nunca** (sin `tabindex`, sin eventos propios). Si es un botón, lo envuelve el consumidor y el avatar dentro es decorativo | Como `GBadge` y `GIcon`. Un `<span>` con clic sería un control sin rol ni teclado (2.1.1, 4.1.2) |
| 1.8 | ¿`name` es el nombre accesible? | **No.** `name` solo deriva iniciales y color; el nombre accesible es `label` | Un mismo nombre está casi siempre escrito al lado: leerlo dos veces es ruido. Que `name` no exponga nada evita la duplicación por defecto |
| 1.9 | ¿Forma? | Prop **`shape`**: `circle` (por defecto, **persona**) · `square` (**entidad**: organización, equipo, espacio). **No** la fija el tema | La forma distingue **qué es** lo representado, no la personalidad del tema. `--g-radius-shape` (#8, #23) es la forma de las **acciones** (`md` o `pill`): aplicarla al avatar haría que con `shape: "pill"` las entidades parecieran personas. El círculo es geometría (50 %), no un paso de radio |
| 1.10 | ¿Color? | **Neutro por defecto**; `color` fija una **categoría** `k` (1 a 12); `colors="n"` la **deriva** de `colorKey` (o de `name`) con un hash estable. **Nunca** color semántico ni libre | Las categorías solo existen si el tema declara `categories` (por defecto 0, `tokens.md` §1): el componente no puede saber cuántas hay sin que se lo digan, como `speakerColors` (#247). Un avatar `danger` diría «peligro» (§17.7) |
| 1.11 | ¿Tamaño? | Prop **`size`**: `xs` 5 · `sm` 6 · `md` 8 · `lg` 10 · `xl` 16 (× `space`), por defecto `md`. **El hueco del anfitrión manda** cuando lo hay | `lg` = `lead` de `GCard`; `md` = `__leading` de `GTable`; `xs` = interlineado de `body-sm` (20px con el tema por defecto) para ir en línea. Medido con `space` 4 y 5 |
| 1.12 | ¿Cuántas letras? | **Una en `xs` y `sm`; dos desde `md`**. Escrituras anchas: siempre una | Medido (§3): «WM» y «ЖШ» a 12px miden 23.8 y 24.5px; la cuerda útil del círculo es 16px (`xs`) y 20.4px (`sm`). Bajar de 12px no está permitido (§7 de tokens) |

## 2. Anatomía

```html
<!-- Decorativo (por defecto) -->
<span class="g-avatar g-avatar--size-md g-avatar--shape-circle g-avatar--content-initials [is-loading|is-loaded|is-failed]"
      [data-cat="k"] aria-hidden="true">
  <span class="g-avatar__initials" dir="auto">AL</span>                 <!-- o, sin iniciales: -->
  <!-- <svg class="g-icon g-avatar__icon" aria-hidden="true">…user…</svg> -->
  <img class="g-avatar__img" src="…" alt="" loading="lazy" decoding="async" draggable="false">  <!-- solo con src y sin fallo -->
</span>

<!-- Con nombre -->
<span class="g-avatar …" role="img" aria-label="Ana María López">…</span>
```

- **Una sola caja** de lado fijo: el respaldo (iniciales o icono) está siempre en el DOM y la imagen se **apila** encima (`inset: 0`, `object-fit: cover`). Con `is-loaded`, el respaldo queda `visibility: hidden` (no `display: none`: la caja no depende del contenido).
- **`dir="auto"`** en las iniciales: en una página RTL, «AL» no se lee «LA», y «مع» toma su propio orden.
- **`--content-{initials|icon}`** dice qué respaldo hay (coco ajusta tipo o icono); **`is-loading` / `is-loaded` / `is-failed`** dice el estado de la imagen (solo con `src`). **`data-cat="k"`** solo cuando hay categoría (como `GTranscript`, #259).
- **Atributos del consumidor** (`class`, `style`, `id`, `data-*`) van a la raíz. `role`, `aria-*` y `tabindex` como atributos: aviso (L11).
- **Sin slots** en v0.1: un slot permitiría meter controles o texto suelto en la caja. Un logotipo es `src`; un icono, `icon`.

## 3. Iniciales

### Regla de derivación (de `name`)

1. Normalizar a **NFC**, recortar, partir por espacios Unicode (`\s+`).
2. De cada palabra, tomar el **primer grafema** (`Intl.Segmenter`, granularidad `grapheme`; sin él, punto de código) **que empiece por letra o número** (`\p{L}` o `\p{N}`). Las palabras sin letras ni números (emoji, signos) se ignoran.
3. Con una palabra: su letra. Con varias: la de la **primera** y la de la **última** («Ana María López» → «AL»).
4. Si alguna es de escritura **ancha** (han, hiragana, katakana, hangul) o el tamaño es `xs`/`sm`: **solo la primera**.
5. Mayúscula con `toLocaleUpperCase()` **solo si sigue siendo un grafema** («ß» no pasa a «SS»).
6. Sin resultado: icono.

`initials` explícitas: se respetan tal cual (sin mayúsculas forzadas; admiten emoji) y se **recortan** a 2 grafemas (1 en `xs`/`sm` o si hay escritura ancha), con aviso en desarrollo. `initials=""` cuenta como ausente.

### Casos (verificados en los tres motores, columna `md` y `xs`)

| Entrada | `md` | `xs` | Nota |
| --- | --- | --- | --- |
| Ana María López | AL | A | Compuesto: primera y última |
| 李小龙 | 李 | 李 | Una palabra, ancha |
| 山田 太郎 | 山 | 山 | Dos palabras, ancha → una |
| 김민수 | 김 | 김 | Hangul |
| ØRSTED | Ø | Ø | Una palabra |
| Madonna | M | M | Un solo nombre → una letra |
| `""`, `"   "` | icono | icono | Vacío |
| 🦊 | icono | icono | Sin letras |
| 🦊 Zorro Plateado | ZP | Z | El emoji se salta |
| jean-luc picard | JP | J | El guion no parte; mayúsculas |
| O'Brien | O | O | Signo dentro de la palabra |
| e + U+0301 + mile zola (NFD) | ÉZ | É | NFC une la tilde |
| łukasz żółw | ŁŻ | Ł | Mayúscula fuera del ASCII |
| محمد علي | مع | م | Árabe, con `dir="auto"` |
| प्रिया शर्मा | प्रिश | प्रि | Lo que da `Intl.Segmenter` (sin validar con hablantes: §11) |
| `initials="ABC"` | AB | A | Recorte con aviso |
| `initials="🦊"` | 🦊 | 🦊 | Explícitas admiten emoji |
| `name` + `icon="users"` | icono | icono | Lo explícito gana |

### Ajuste (medido con Instrument Sans, peso del prototipo)

| Tamaño | Lado | Texto | «WM» / «ЖШ» | Cuerda útil (1px de aire a la altura de las mayúsculas) | Letras |
| --- | --- | --- | --- | --- | --- |
| xs | 20 | 12px | 23.8 / 24.5 | 16.0 | **1** |
| sm | 24 | 12px | 23.8 / 24.5 | 20.4 | **1** |
| md | 32 | `body-sm` (14px) | cabe | ≥ 28.4 | 2 |
| lg | 40 | `body` (16px) | cabe | — | 2 |
| xl | 64 | `title-sm` (20px) | cabe | — | 2 |

Los roles de tipo por tamaño son de wireframe; **la restricción es estructural**: el rol que elija coco debe ser ≥ 12px y dejar caber dos letras anchas en `md`, `lg` y `xl` (la verificación lo comprueba).

## 4. Escala y encaje (medido en los componentes reales)

| Anfitrión | Hueco | `size` | Modo | Resultado medido |
| --- | --- | --- | --- | --- |
| `GCard` `lead` | `space × 10`, llena | `lg` | decorativo (el hueco es `aria-hidden`) | 40 = 40. Con el marco actual se ven dos formas (L4) |
| `GTable` `leading-{key}` | `space × 8` | `md` | decorativo | 32 = 32; misma altura de fila que con `leading` de texto (`compact`). Por lectura de `GTable.css` (no medido): el hueco recorta a círculo (`radius-pill` + `overflow: hidden`), así que un `square` saldría redondo (L5) |
| `GTable` `cell-{key}` solo avatar | — | `sm` | **con `label`** | `ariaSnapshot`: `img "Luis Torres"` dentro de la celda |
| `GSelect` slot `icon` | `1.25em` (17.5px) | `xs` | decorativo | La altura del control no cambia (34 = 34), pero el avatar (20px) **desborda** el hueco y queda 2.0 a 2.4px por debajo del centro del texto (L5) |
| `GMenu` slot `icon` | `space × 4.5` (18px) | `xs` | decorativo | Elemento de 36px sin cambio; avatar de 20px **desborda** el hueco 1px por lado (L5). El slot solo se pinta si `item.icon` existe: los datos del avatar van en `item.icon` como **dato opaco** (#202) |
| `GSidebar` `user` | libre (botón de la aplicación) | `md` | decorativo; en el riel el nombre lo da el botón (`aria-label`) | Cabe en el riel (32px en `space × 16`) |
| En línea con texto | interlineado `body-sm` | `xs` | según el caso | 20px = interlineado de `body-sm` con el tema por defecto |

**Regla de encaje (propuesta kiwi):** cuando un componente de Grana tiene un **hueco** para un avatar, el hueco decide la caja y el avatar la **llena** (como ya hace `GCard`, #123); `size` sigue eligiendo el tipo y el número de letras, y la guía de uso dice qué `size` va en cada hueco (tabla de arriba). Fuera de un hueco, manda `size`.

## 5. Forma

`circle` = persona (por defecto); `square` = entidad. El cuadrado lleva un radio de la escala del tema que **crece con el tamaño** (en el prototipo, `xs`/`sm` `radius-xs`, `md` `radius-sm`, `lg` `radius-md` —el del `lead` de `GCard`—, `xl` `radius-lg`); los pasos los fija coco con alias locales, **sin token nuevo**. El tema no cambia la forma (1.9).

## 6. Color

| Entrada | Resultado |
| --- | --- |
| Sin `color` ni `colors` | **Neutro:** `neutral-soft` / `on-neutral-soft` (6.54:1 claro, 4.56:1 oscuro con el tema por defecto) |
| `color="neutral"` | Neutro (gana a `colors`) |
| `color="k"` (1 a 12) | `cat-k-soft` / `on-cat-k-soft` (`data-cat="k"`) |
| `colors="n"` (1 a 12) sin `color` | `k = FNV-1a(clave) mod n + 1`, clave = `colorKey` ?? `name`, normalizada (NFC, recorte, espacios colapsados, `toLowerCase()` sin configuración regional). Sin clave: neutro |
| `k` mayor que las categorías del tema | Sin relleno (el `var()` sin respaldo no resuelve): letra en el color heredado, legible. Aviso imposible sin leer estilos: se documenta |

- **Hash (FNV-1a de 32 bits sobre unidades UTF-16):** idéntico en los tres motores (10 nombres, incluidos 李小龙 y محمد علي); mayúsculas, espacios y NFD dan la misma categoría; 2 000 claves en 8 categorías: 248 a 253 por categoría. **Cambiar `n` reparte de nuevo** (inherente): se documenta y por eso existe `color` fijo.
- **`colorKey`** existe porque el nombre puede cambiar o repetirse; con un id estable, el color de una persona no cambia al renombrarla.
- **Contraste medido** (texto e icono sobre el relleno, claro y oscuro, todas las categorías declaradas + neutro): mínimo **4.52:1** con el tema por defecto + 12 categorías (oscuro, `cat-7`) y **4.52:1** con marca roja + 8 (oscuro, `cat-6`). En el motor (`@grana/cli`, 7 marcas × N ∈ {1, 4, 6, 8, 12}, claro y oscuro): mínimo **4.50:1** (`on-cat-k-soft` sobre `cat-k-soft`, garantizado por §2 de tokens).
- **Imagen:** el relleno queda debajo (útil para PNG con transparencia).

## 7. Imagen: estados

| Estado | Clase | Se ve | Medido |
| --- | --- | --- | --- |
| Sin `src` | — | respaldo | — |
| Cargando | `is-loading` | respaldo; `<img>` con opacidad 0 encima | Iniciales visibles con la respuesta retenida |
| Cargada | `is-loaded` | imagen; respaldo `hidden` | Misma caja (40×40) y mismo `x` del texto vecino antes y después |
| Fallida | `is-failed` | respaldo; **sin `<img>`** | 40×40; texto vecino en el mismo sitio que en la cargada; sin nombre → icono |
| Imagen no cuadrada (3:1) | `is-loaded` | recorte `cover` | Caja 40×40 |
| Cambio de `src` | vuelve a `is-loading` | respaldo hasta `load` | Sin salto |

- **`loading="lazy"` y `decoding="async"`** (propuesta kiwi): en tablas y listas largas evita descargar caras fuera de vista; la caja fija impide el salto al llegar. Comportamiento de carga diferida por motor **no medido** (§11).
- **Movimiento:** un fundido de entrada de la imagen es opcional (coco) y **solo** con `prefers-reduced-motion: no-preference` (medido: `0s` con `reduce`).

## 8. Semántica (resumen)

| Caso | Marcado | Por qué |
| --- | --- | --- |
| Nombre al lado (tarjeta, menú, select, transcript, pie expandido) | sin `label` → `aria-hidden` | El nombre ya se lee una vez |
| Dentro de un control (riel, botón de cuenta) | sin `label`; el nombre en el control | 4.1.2: el nombre es del control |
| Única identificación (columna densa, avatar suelto) | `label` → `role="img"` + `aria-label` | 1.1.1 |
| Con `label` dentro de un ancestro `aria-hidden` | aviso en desarrollo (como `GIcon`, #199) | El nombre no llegaría |

## 9. Opcionales: qué entra en v0.1

| Pieza | Decisión | Fundamento |
| --- | --- | --- |
| **Estado de presencia** | **No es prop de `GAvatar`.** Se compone con `GBadge` anclada: `<g-badge shape="circle" color="success" label="En línea" placement="bottom-end">` + slot `anchor`. Forma por estado (en línea círculo, ausente rombo, ocupado cuadrado; desconectado sin insignia), **convención de la aplicación** como en `badge.md` | `GBadge` ya cumple «nunca solo color» (forma + `label`, WCAG 1.4.1) y espeja `placement` en RTL (medido). Un `status` en `GAvatar` duplicaría figura, texto y anclaje. Medido: sobre un círculo `lg`, el centro de la insignia queda **8.3px fuera** del borde del círculo (L10) |
| **Pila (`GAvatarGroup`)** | **Reservada** | Ningún consumidor actual la necesita (ni `GCard`, ni `GTable`, ni `GSidebar`, ni `GTranscript`). Cuando llegue, su ronda decide: orden de lectura = orden del DOM, `+N` con nombre («y 3 más»), solapado lógico en RTL, nombre del grupo, y si cada avatar es decorativo |
| Eventos `load`/`error` | **Reservados** | Sin consumidor; el estado se ve en la clase |
| `srcset`, `sizes`, `crossorigin`, `referrerpolicy` | **Reservados** (L1) | Sin consumidor; los atributos del consumidor van a la raíz, no a la `<img>` |

## 10. Estados

Imagen cargada · cargando · fallida (con iniciales o icono) · iniciales · icono (por defecto o explícito) · neutro · categoría fija · categoría derivada · `circle` · `square` · decorativo · con nombre · con presencia (`GBadge` anclada) · **`forced-colors`**: el relleno desaparece y un **borde `CanvasText`** de `--g-border-width` conserva la forma, sin cambiar el tamaño (medido en Chromium: 32 = 32) · **movimiento reducido**: sin fundido · **RTL**: sin efecto en el avatar («AL» no se invierte); la insignia anclada se espeja.

## 11. Comprobaciones

### Hechas (`verificar.mjs`, 504/504)

| Área | Qué | Motores |
| --- | --- | --- |
| Tamaños | 5 tamaños × 3 fuentes con `space` 4 y en `square`; 5 tamaños con `space` 5: lado = `space × n` exacto | Los tres |
| Iniciales | 18 casos con esperado (`md` y `xs`) + Devanagari registrado; `dir="auto"` | Los tres |
| Ajuste | «WM»/«ЖШ» caben en `md`..`xl`; no caben en `xs`/`sm` (justifica una letra); texto ≥ 12px | Los tres |
| Contraste | Neutro + 12 categorías + icono, claro y oscuro, dos temas (≥ 4.5:1); neutro en oscuro con el control de la página | Los tres |
| Hash | Igual entre motores; insensible a mayúsculas/espacios/NFD; reparto en 8 | Los tres |
| Semántica | `aria-hidden` / `role="img"`+`aria-label`; `alt=""` siempre; nada enfocable; `ariaSnapshot` (dos imágenes con nombre, botón del consumidor, celda densa, elemento de menú con solo la etiqueta) | Los tres |
| Imagen | Cargando (respuesta retenida), cargada, fallida, fallida sin nombre, 3:1, cambio de `src`; sin salto de caja ni del texto vecino | Los tres |
| Movimiento | Fundido sin preferencia; `0s` con `reduce` | Los tres |
| `forced-colors` | Borde visible en todos, sin cambio de tamaño | Chromium (único que lo emula) |
| Encaje | `GCard` lead (y la propuesta sin marco), `GTable` (lado y altura de fila), `GSelect` (altura, desborde, desplazamiento), `GMenu` (desborde, `aria-hidden` del hueco), `GSidebar` riel (cabe, nombre en el botón), `GTranscript` real montado | Los tres |
| Presencia | `GBadge` abajo-final en LTR, espejada en RTL, texto accesible | Los tres |
| Página | 320px sin desplazamiento horizontal; consola sin errores ni avisos | Los tres |

### No hechas

- **Lectores de pantalla reales** (VoiceOver, NVDA) sobre `<span role="img" aria-label>` con `<img alt="">` dentro, en celda, en botón y en elemento de menú. Solo el árbol de accesibilidad de Playwright.
- **`forced-colors` real** (Windows) y en Firefox/WebKit (no se emula).
- **Carga diferida** (`loading="lazy"`) por motor, imágenes de alta densidad y `srcset`; SSR e hidratación con imagen en caché.
- **Escrituras complejas** validadas con hablantes: Devanagari (`प्रि` + `श`), árabe con ligadura, tailandés, secuencias ZWJ en `initials`; `toLocaleUpperCase()` con configuración regional turca.
- **Temas con `space` y `fontSize` desacoplados** (p. ej. `space` 8 con `fontSize` 14): `xs` dejaría de igualar el interlineado de `body-sm`.
- Safari, táctil y móvil reales.

## 12. Hallazgos para lima

| # | Hallazgo | Propuesta kiwi |
| --- | --- | --- |
| **L1** | **API de `GAvatar`** | Props: `src` (String), `name` (String), `initials` (String), `icon` (String, nombre; resolución de la aplicación: registro → librería), `size` (`xs` `sm` `md` `lg` `xl`, por defecto `md`), `shape` (`circle` `square`, por defecto `circle`), `color` (`'neutral'` o entero 1 a 12; sin valor = derivado o neutro), `colors` (Number 0 a 12, por defecto 0), `colorKey` (String), `label` (String; sin valor = decorativo). **Sin** `alt`, `status`, slots ni eventos en v0.1; `srcset`/`crossorigin`/`referrerpolicy`/`load`/`error` reservados. Nombres a confirmar por lima (`colors` sigue a `speakerColors`; `colorKey` a falta de otro mejor) |
| **L2** | **Clases** | `g-avatar`, `g-avatar--size-{xs\|sm\|md\|lg\|xl}`, `--shape-{circle\|square}`, `--content-{initials\|icon}`, `is-loading`, `is-loaded`, `is-failed`, `data-cat="k"`; partes `__initials`, `__icon` (con `g-icon`), `__img` |
| **L3** | **Tokens: ninguno nuevo** | Consume `--g-space-1`, `--g-color-neutral-soft`, `--g-color-on-neutral-soft`, la familia condicional `--g-color-cat-k-soft` / `--g-color-on-cat-k-soft`, `--g-text-*-size`/`-weight`, `--g-font-ui`, `--g-radius-*` (cuadrado), `--g-border-width` (`forced-colors`), `--g-duration-fast`, `--g-ease-standard`. **`GAvatar.css` entra en `CAT_FAMILY_READERS`** (#260, `levels.test.js`, bruno) junto a `GTranscript.css`. Registrar en `tokens.md` como sección «Avatar (sin tokens nuevos)» |
| **L4** | **`GCard` `lead` con avatar: dos formas** | Con un hijo `.g-avatar`, el `lead` **pierde su marco** (sin borde, relleno ni radio propio; la caja sigue en `space × 10`). En `card.md` («Slots», `lead`) y en `GCard.css` (coco). Probado en el prototipo con `:has(> .x-avatar)`. El esqueleto de carga del `lead` no cambia |
| **L5** | **Huecos que no llenan** | `GMenu` `__icon` (18px) y `GSelect` `__icon` (17.5px) son menores que `xs` (20px): el avatar desborda y en `GSelect` queda 2px bajo el texto. `GTable` `__leading` (por lectura de su CSS) recorta a círculo (`radius-pill` + `overflow: hidden`) un avatar `square` y pinta su propio relleno debajo. Regla (§4): **el hueco manda y el avatar lo llena**; sin marco propio cuando el hijo es `.g-avatar`. Cambia `menu.md`, `select.md`, `table.md` y el CSS de coco de los tres |
| **L6** | **`GTable` `leading` de texto** | **Se queda** como está (no se acopla `GTable` a `GAvatar`, mismo criterio que #123). La documentación recomienda `leading-{key}` + `GAvatar` para imagen, color o derivación |
| **L7** | **Icono `user` en la lista de la librería** | `GAvatar` lo usa como respaldo propio: entra en `icons.md` §4 y en `packages/vue/scripts/icons.json` (`library`). Hoy solo está en la lista de laboratorio |
| **L8** | **`GMenu`: dato del avatar en `item.icon`** | El slot `icon` solo se pinta con `item.icon` definido. Documentar en `menu.md` que, para una persona, `item.icon` lleva un **dato opaco** (`{ name, src }`) que el slot pasa a `GAvatar`. Sin cambio de API |
| **L9** | **Hash como contrato** | Fijar en el contrato el algoritmo exacto (FNV-1a 32 bits, unidades UTF-16 de `clave.normalize('NFC').trim().replace(/\s+/gu, ' ').toLowerCase()`, `mod n + 1`) para que el color sea reproducible en otras vistas y no cambie entre versiones. **No exportar** una función en v0.1 (sin consumidor) |
| **L10** | **`GAvatarMotion` y `GAvatar` con escalas distintas** | `sm`/`md` coinciden (6, 8); `lg`/`xl` no (12/24 frente a 10/16). Aceptarlo y decirlo en ambos contratos: cada escala sale de sus huecos. **`GBadge` sobre un círculo:** la insignia queda 8.3px fuera del borde (en un cuadrado, en la esquina); que coco valore acercarla con un alias local cuando el ancla es `.g-avatar--shape-circle`, y retirar «Sin avatar» de los límites de `badge.md` (la composición es la vía documentada) |
| **L11** | **Avisos de desarrollo** (bruno) | `label` con un ancestro `aria-hidden` (al montar, como `GIcon`); `initials` recortadas; `color` fuera de `'neutral'`/1..12 y `colors` fuera de 0..12 (se ignoran); `role`, `aria-*`, `tabindex` u `onClick` como atributos (no interactivo) |
| **L12** | **`speech.md`** | Una línea: la marca de hablante **no** es `GAvatar` (etiqueta de posición con borde, discontinua y ancho variable); solo comparte la familia `cat-k` |
| **L13** | **`sidebar.md` y el playground** | El ejemplo del slot `user` usa `GAvatar size="md"` decorativo dentro del botón, con `aria-label` en el riel. El círculo dibujado a mano de `playground/index.html` l. 965 se sustituye cuando exista (bruno) |

## 13. Preguntas de producto abiertas

**Ninguna.** Todo lo de arriba se deriva de WCAG (1.1.1, 1.4.1, 1.4.3, 1.4.11, 2.1.1, 4.1.2), de contratos vigentes (#59, #123, #199, #202, #247, #260, `tokens.md` §7 y §16.3) o de medidas de esta ronda. La reserva de la pila y de `status` sigue la propuesta del encargo y la regla «sin consumidor no entra»; si el usuario quiere la pila en v0.1, es una ronda r02 aparte.
