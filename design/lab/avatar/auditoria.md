# Auditoría de coco · GAvatar (paso 5)

**Componente:** `packages/vue/src/components/GAvatar/` (`GAvatar.vue` de bruno, `b09d5cf`; `GAvatar.css` y las reglas del avatar en `GCard.css`, `GTable.css`, `GMenu.css`, `GSelect.css` y `GBadge.css` de coco, `ca8628d`; contrato `design/contracts/avatar.md`, #293 a #297), el real con `dist/` reconstruido, en el **playground** (`packages/vue/playground/`, `#sec-gavatar` y los huecos reales de `GSidebar` `user`, `GBadge` anclada, la lista de `GCard`, `GTable` `#leading-cliente`, `GMenu` «Asignar a…» y `GSelect` «Responsable (avatares)»). Donde el playground no muestra un caso (las 12 categorías, una escritura, una tarjeta cargando con avatar, una tabla gemela con `leading` de texto) se monta el `GAvatar` real del UMD dentro de la misma página.

**Método:** `node design/lab/avatar/auditoria-verificar.mjs` (Playwright de `design/lab/theme-playground/`) en **Chromium, Firefox y WebKit**: **1084/1084** comprobaciones, más un hallazgo abierto de bruno que el script informa aparte (H1). Además: `estilo-verificar.mjs` sobre el banco 2269/2269 tras la corrección; `npx vitest run` 1864/1864; `npm run build` y compuertas (incluida `g-avatar--shape-square`); `avatar.spec.mjs` + `library.spec.mjs` + `playground.spec.mjs` en los tres motores: 189 pasan, 3 se omiten por diseño (`forced-colors` fuera de Chromium y similares).

**Temas:** por defecto claro y oscuro con el `app-categories` del playground (`categories: 8`); `tema-cat12.css` (12 categorías) y `tema-marca-cat8.css` (marca `#C8102E`, 8 categorías) de kiwi, salida de `grana theme`; el tema alterno del playground («themed»), claro y oscuro; `space` 5.

## Resultado: sin defecto bloqueante. Una corrección en `GAvatar.css`; `status: "candidate"`

### Medidas

| Prueba | Resultado (tres motores) |
| --- | --- |
| `dist/grana.css` | 41 reglas con `.g-avatar` (GAvatar y las cinco anfitrionas), todas dentro de `@layer grana.components`; sin color literal, sin `var()` con respaldo, sin `!important`, sin medidas ni duraciones literales (solo `0px` en un `max()` de `GSelect`), solo `var(--g-*)` existentes o `cat-K-soft`/`on-cat-K-soft`, sin `--g-radius-shape`; `CanvasText` solo en `forced-colors`; transiciones y escala solo en `prefers-reduced-motion: no-preference`. Las únicas propiedades físicas son `top/right/bottom/left: 0`, la bajada de `inset: 0` que hace esbuild (simétrica, no depende de la dirección) |
| Marcado real | 74 avatares en la página: respaldo (`g-avatar__initials` o `g-avatar__icon`) hijo directo y primero, `<img class="g-avatar__img">` siempre la última, un solo estado `is-*` y solo con imagen, ningún nodo de texto suelto. El comentario `<!---->` de Vue (58 a 60 avatares sin imagen) no genera caja: las iniciales siguen centradas (Δ 0) |
| Lado | `space × n` exacto (±0,01px) en los 5 tamaños × imagen, iniciales, icono y `square`, con `space` 4 y 5; también a zoom 200 % aproximado y a 320px |
| Iniciales | 15 nombres (latino, cirílico, han, japonés, coreano, árabe, Ø, emoji, polaco, ß, devanagari, tailandés) × 5 tamaños × 2 formas: caben, ≥ 12px, centradas (±1px), una sola letra en `xs`/`sm`. Aire mínimo de dos letras: **0,1px** en círculo (`md`, «ЖШ»), 1,7px en `square` |
| Contraste (iniciales ≥ 4,5; icono ≥ 3, mismo color) | Mínimo: playground claro 4,60 / oscuro 4,52; `tema-cat12` 4,64 / 4,52; `tema-marca-cat8` 4,65 / 4,52; tema alterno, neutro ≥ 4,5. Categorías que el tema no declara (9 a 12 con 8): sin relleno, como dice el contrato. El banco añade el neutro en los once temas generados (mínimo 4,53, `stripe`) |
| Imagen | Cargando: respaldo visible, foto a 0. Cargada: foto a 1 y respaldo `visibility: hidden`. Sin salto de caja ni del texto vecino **en ningún fotograma**. Fallida: sin `<img>`, iniciales (o `user` sin nombre), misma caja. 3:1: `cover` en 40×40. Cambio de `src`: caja y botón vecino quietos, nunca dos `<img>`, termina cargada |
| Revelado (personalidad) | Foto: 5 fotogramas intermedios de opacidad y 11 de escala 1,06 → 1, monótonos, asentada en ~250ms (2 × `--g-duration-fast` = 240ms). El respaldo se queda entero debajo y se retira al final: **ningún fotograma con el relleno vacío**, tampoco al cambiar de foto (tras el hallazgo 2) |
| Morfo de forma | `circle` → `square` pasa por varios radios intermedios y termina en el paso de la escala |
| `reduce` | Duración `0s` en raíz, foto y respaldo; sin escala; la foto aparece a 1 en el primer fotograma cargado, sin intermedios |
| Remontaje | Ver hallazgo 3 |
| `GCard` lista | Los tres `lead`: sin borde, relleno, radio ni recorte; caja 40 = avatar `lg` centrado, una sola forma. Cargando: esqueleto **idéntico** con avatar y con texto (mismo `lead` y mismo alto de tarjeta); un `lead` de texto conserva su marco |
| `GTable` | Los 5 `leading` del playground: 32 = avatar `md`, sin relleno, radio ni recorte. Tablas gemelas (avatar / texto): **mismo alto de fila** en `default` y `compact` |
| `GMenu` | «Asignar a…»: los cuatro huecos a 20 (`space × 5`), avatares enteros y centrados, el icono «Invitar» conserva 18 centrado, etiquetas alineadas (Δ 0), hueco fuera del árbol accesible. «Acciones» (solo iconos): hueco e icono 18 sin cambio. Alto del elemento igual en los dos |
| `GSelect` | Valor con avatar: hueco = avatar 20, entero, centrado en la línea (Δ 0,00); alto del control igual vacío, con avatar y que el de «Cliente» con icono. Lista: hueco 20, avatar centrado, alto de opción igual que con icono |
| `GSidebar` `user` | Avatar `md` 32 decorativo, centrado (±0,5px) en un botón ≥ 44, contraste ≥ 4,5 |
| `GBadge` anclada | Sobre círculos `lg`/`xl`: centro de la insignia en el contorno a 45° (±1px) en las cuatro colocaciones, LTR y RTL (espejada); sobre `square`, en la esquina |
| `forced-colors` (Chromium) | Borde sólido ≥ 1px en los avatares reales de la sección, la tarjeta y la tabla, borde y letra en `CanvasText`, **sin cambio de tamaño**; la foto cargada sigue visible |
| Zoom 200 % (640 CSS px a escala 2) y 320px | Sin desplazamiento horizontal de la página, ningún avatar fuera de la sección, lados sin cambio |
| Consola | Sin errores ni avisos de Vue o de Grana en ninguna configuración |

## Hallazgos

| # | Severidad | Dueño | Hallazgo y resolución |
| --- | --- | --- | --- |
| 1 | **Media** (no bloquea el componente) | bruno | **`<style id="app-categories">` del playground no tiene el `@media (prefers-color-scheme: dark) {`** que abre el segundo bloque (`packages/vue/playground/index.html`, hacia la línea 123): `:root:not([data-theme="light"])` se aplica siempre, así que **en claro automático** (sin `data-theme`, el caso por defecto de una aplicación) los avatares del playground salen con las categorías **oscuras** (`cat-1-soft` = `#361B1A` sobre la página clara). El `}` que sobra deja además sin efecto la regla `[data-theme="dark"]` (en oscuro no se nota porque la anterior ya pone esos valores). El contraste del par sigue ≥ 4,5 y por eso `avatar.spec` no lo detectó. **Arreglo:** envolver ese bloque en `@media (prefers-color-scheme: dark) { … }`, como la salida de `grana theme`. Medido por `auditoria-verificar.mjs` como **ABIERTO H1**; pasa a CERRADO cuando se corrija. Conviene que `avatar.spec` compare el relleno en claro automático con el valor claro |
| 2 | Menor | coco | **Corregido.** En el revelado, la foto y las iniciales se fundían a la vez: a mitad de camino asomaba el relleno, y al **cambiar de `src`** el respaldo volvía desde opacidad 0 con su transición mientras la foto nueva estaba a 0 (mínimo de max(foto, respaldo) **0,00** en un fotograma). Ahora el respaldo se queda entero debajo y se retira al **final** del fundido (`step-end` en `opacity` y `visibility`, solo en `is-loaded`); al volver a «cargando» reaparece al instante. Medido: ningún fotograma con el relleno vacío, al cargar y al cambiar de foto, en los tres motores. Sin cambio de caja ni de tokens |
| 3 | Informativo | bruno (nota de su entrega) | **¿El fundido se repite en cada remontaje?** Medido: **no**. Abrir dos veces la lista de `GSelect`: la primera apertura funde (la `<img loading="lazy">` del menú aún no estaba decodificada), la segunda aparece cargada en el primer fotograma en los tres motores (WebKit, ni la primera). Remontar con `v-if` una foto ya decodificada: instantáneo (Firefox funde una vez la primera). Con una imagen por HTTP en caché: Chromium y Firefox funden el **primer** remontaje y después ya no. Lo decide `complete` en `onMounted`, como pide el contrato. Que la foto se revele la primera vez que aparece en un contexto es lo buscado; **sin cambios**. Forzar «nunca en remontaje» exigiría un estado nuevo en el `.vue` y en el contrato, y no lo recomiendo |
| 4 | Menor | lima | El contrato dice «sin animación propia más allá del fundido de la imagen» (`avatar.md`, principio «Identidad, no estado»). La personalidad implementada añade el **asentamiento** de la foto (parte del revelado) y el **morfo de forma** al cambiar `shape`. Ninguno expresa un estado (la intención de esa línea), pero hay que **registrarlo** en `DECISIONS.md` como decisión de personalidad de `GAvatar` (regla «Personalidad e innovación») y ajustar la frase del contrato. Si lima lo rechaza, coco retira el morfo (una línea de `GAvatar.css`) |
| 5 | Informativo | bruno | `GAvatar.meta.json` (aquí solo se cambió `status`): quitar de `pending` «Auditoría de coco…» y, tras el README, «README (mora-docs)»; se puede añadir `design/lab/avatar/auditoria-verificar.mjs` a `tests`. Siguen vigentes los de lector de pantalla, `forced-colors` real, carga diferida real y escrituras validadas por hablantes |
| 6 | Informativo | coco | «ЖШ» en `md` circular deja **0,1px** de aire dentro del margen de 1px que se exige con la Instrument Sans. Una fuente de tema más ancha podría tocar el borde del círculo en dos letras anchas. No se corrige (el contrato fija dos letras desde `md` y el rol `body-sm`); queda como límite para un tema con tipografía propia |

## Personalidad

**Implementado** (siempre con tokens; con `reduce`, todo instantáneo; contraste y caja intactos):

1. **La foto se revela sobre las iniciales.** Se funde (`--g-duration-fast`) y se asienta de `scale: 1.06` a `1` (`× 2`, `--g-ease-standard`) sobre el respaldo, que se retira al final (`step-end`). Parece la misma persona enfocándose y no un parpadeo; ningún fotograma vacío (hallazgo 2).
2. **La forma se transforma**: `circle` ↔ `square` anima `border-radius` en vez de saltar (pendiente de registrar por lima, hallazgo 4).
3. **Monograma con ajuste propio**: `lining-nums`, sin ligaduras, `kerning` y el peso de `title-sm` en todos los tamaños.
4. **Presencia en el contorno**: la `GBadge` anclada se centra en el punto a 45° del círculo y no en la esquina de la caja (#297).

**Ideas para la ronda transversal** (no implementadas; cada una con su dueño):

- **Fundido entre la foto anterior y la nueva** al cambiar `src`: mantener la `<img>` vieja hasta el `load` de la nueva, en vez de pasar por las iniciales. Requiere el `.vue` (hoy `key = src`) y el contrato (bruno + lima).
- **Revelado desde el color de la propia foto**: un `placeholder` (color dominante o LQIP) como relleno mientras carga. Requiere una prop nueva y decidir sobre el color libre, hoy prohibido (lima + kiwi).
- **Centrado óptico del monograma** con `text-box: trim-both cap alphabetic` (mejora progresiva en Chromium y Safari): el centro de las mayúsculas en el centro del círculo, y no el de la caja de línea. Es de coco; requiere medir en los tres motores y rehacer el criterio de ajuste.
- **Presencia que nace del contorno**: la insignia anclada entra con escala desde el punto a 45° cuando cambia de estado (coco en `GBadge.css` + lima: hoy `GBadge` no anima su aparición).
- **Anillo de pila para `GAvatarGroup`**: recorte con `mask` del color de la superficie en vez de borde, solapado lógico en RTL (llega con la ronda de kiwi de `GAvatarGroup`).
- **Iniciales que cambian con fundido** al renombrar (`name` → nuevas iniciales). Requiere `key` en el `.vue` (bruno) y decidir si un cambio de identidad debe animarse (lima).

## Verificado

Todo lo de la tabla «Medidas», en Chromium, Firefox y WebKit (el `forced-colors`, solo en Chromium), sobre el componente real con `dist/` reconstruido tras la corrección.

## Sin verificar

- **Lectores de pantalla reales** (VoiceOver, NVDA) sobre `role="img"` con `<img alt="">` dentro, en celda, botón y elemento de menú.
- **`forced-colors` real** (Windows) y en Firefox/WebKit (no se emula).
- **Carga diferida real por red** y por motor, imágenes de alta densidad, SSR con imagen en caché e hidratación real (aquí, `data:`, una ruta retenida por Playwright y un PNG local).
- **Zoom real del navegador** (aquí, aproximado: visor de 640 CSS px a escala 2).
- **Escrituras complejas validadas por hablantes**: devanagari y tailandés solo se midieron (caben); el turco, por `initials`.
- Temas con **tipografía propia más ancha** (hallazgo 6).
