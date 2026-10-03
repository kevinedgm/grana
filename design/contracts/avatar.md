# Contrato · GAvatar

**Dueño:** lima · **Estado:** aprobado (aprobación autónoma: todo deriva de WCAG 2.2 AA, HTML, contratos vigentes o de las medidas de la ronda; kiwi §13 «sin preguntas de producto») · **Basado en:** `design/lab/avatar/r01/` (kiwi, commit 3b36672: `brief.md`, `declaracion.md` con los hallazgos L1 a L13, `index.html`, `verificar.mjs` 504/504 en Chromium, Firefox y WebKit) · **Decisiones:** DECISIONS.md #293 a #297 (reabre la reserva de #123 con el motivo que pedía: cinco huecos que lo reciben)
**Tag:** `g-avatar` · **Categoría:** primitivas de identidad · **Complejidad:** **componente complejo** (CLAUDE.md, «Modelos por rol»: se solapa con `GAvatarMotion`, `GBadge`, el `leading` de `GTable` y la marca de `GTranscript`, y cambia el CSS de los huecos de `GCard`, `GTable`, `GMenu` y `GSelect`) → **coco y bruno en Opus**.

La **cara de una persona o de una entidad** (organización, equipo, espacio) en una caja cuadrada de lado fijo. Muestra, por orden, una **imagen**, unas **iniciales** o un **icono**, y la caja **nunca cambia** al pasar de uno a otro. No es interactivo, no lleva estado de presencia y no se apila.

---

## Principios

- **Identidad, no estado.** Sin color semántico, sin `status`, sin animación propia más allá del fundido de la imagen. La presencia es una `GBadge` anclada (§ «Presencia»).
- **Una caja, siempre la misma.** El lado es `space × n` del `size`; imagen, iniciales e icono se dibujan **dentro** sin moverla. Cargar o fallar la imagen no desplaza nada (medido: 0px).
- **Decorativo por defecto.** El nombre de la persona casi siempre está escrito al lado o en el control que envuelve al avatar. Con `label`, es una imagen con nombre.
- **Nunca interactivo.** Si hace falta pulsarlo, lo envuelve un `<button>` de la aplicación con su nombre, y el avatar dentro es decorativo.
- **El contenido es dato.** `src`, `name`, `initials`, `icon` y `colorKey` llegan de una API o una lista de usuarios: todos son cadenas. **Sin slots** (un slot abriría la caja a controles o texto suelto).
- **Convive con `GAvatarMotion` sin absorberlo** (tabla del brief): `GAvatarMotion` es una personalidad que reacciona; `GAvatar`, la identidad de alguien concreto.
- **Iconos solo Lucide** (`icons.md`): el de respaldo, `user`, es propio y sale **solo de la librería**; el de `icon` es un nombre de la aplicación (registro → librería).

## Frontera con otros componentes

| Necesidad | Usar | No usar |
| --- | --- | --- |
| Foto, iniciales o icono de una persona o entidad | `GAvatar` | Un círculo con texto dibujado a mano (pie del playground, l. 965) |
| Asistente o mascota que reacciona a estados | `GAvatarMotion` | `GAvatar` con `color` semántico |
| Estado de presencia («En línea», «Ausente») | `GBadge` anclada con el avatar en `anchor` (#59) | Una prop `status` |
| Marca «A/B» de un hablante en `GTranscript` | La marca propia `g-transcript__mark` (#247, #259) | `GAvatar` (§ «Resolución», L12) |
| Iniciales de texto en una columna compuesta de `GTable` | `leading` (campo de texto) **o** `leading-{key}` con `GAvatar` (L6) | — |
| Pila de avatares («+3») | **Reservada** (`GAvatarGroup`) | Varios `GAvatar` con márgenes negativos a mano |
| Icono de una acción o de un estado | `GIcon` | `GAvatar icon="…"` |

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `src` | String | URL de la imagen | sin valor | propia |
| `name` | String | nombre de la persona o entidad | sin valor | propia |
| `initials` | String | 1 o 2 grafemas | sin valor | propia |
| `icon` | String | nombre de Lucide (registro de la aplicación → librería) | sin valor | propia |
| `size` | String | `xs` `sm` `md` `lg` `xl` | `md` | compartida (`api.md`: aquí es el **lado**) |
| `shape` | String | `circle` `square` | `circle` | propia |
| `color` | String \| Number | `'neutral'` o una categoría `1` a `12` | sin valor | compartida, con valores propios (`api.md`: nunca semántico) |
| `categories` | Number | `0` a `12` | `0` | propia (mismo nombre y valor que la entrada `categories` del tema, `tokens.md` §16.3) |
| `colorKey` | String \| Number | id estable | sin valor | propia |
| `label` | String | texto libre | sin valor | propia (misma semántica que `GIcon` y `GAvatarMotion`) |

**Sin** `alt`, `status`, `variant`, `rounded`, `density`, `loading`, `srcset`, `sizes`, `crossorigin` ni `referrerpolicy`. Cada prop enumerada declara `validator` con su lista (`api.md`). Una cadena vacía (`""`, o solo espacios) en `src`, `name`, `initials`, `icon`, `colorKey` o `label` **cuenta como ausente**.

### Reglas de props

- **Precedencia del contenido** (kiwi 1.2): **imagen** (`src`, mientras no falle) **>** `initials` **>** `icon` **>** iniciales derivadas de `name` **>** icono `user`. Lo explícito gana a lo derivado: con `name="Asistente" icon="bot"` se ve el icono (y `name` sigue sirviendo para el color). La imagen se apila **sobre** el respaldo, que siempre existe en el DOM.
- **`src`:** la `<img>` va encima del respaldo, invisible hasta `load` (§ «Imagen»). Si falla, se **quita** la `<img>` y queda el respaldo. Cambiar `src` vuelve a «cargando». Con la imagen ya en caché al montar (o tras hidratar en SSR), se comprueba `complete` y `naturalWidth` en `onMounted` (sin parpadeo ni evento perdido).
- **`name`:** **solo** deriva iniciales y es la clave del color cuando no hay `colorKey`. **No** es el nombre accesible (kiwi 1.8: el nombre casi siempre está escrito al lado; exponerlo por defecto lo leería dos veces).
- **`initials`:** se respetan **tal cual** (sin mayúsculas forzadas; admiten emoji), normalizadas a NFC, recortadas y sin grafemas de espacio; se cortan al **máximo de letras** (§ «Iniciales»). Cortar por encima del máximo absoluto avisa (aviso 2); la reducción a una letra en `xs`/`sm` es silenciosa (es lo esperado al reutilizar las mismas iniciales en varios tamaños).
- **`icon`:** un **nombre** de Lucide que la aplicación elige como dato (organización → `building-2`, bot → `bot`), resuelto como cualquier nombre de la aplicación (`icons.md` §5.4: registro más cercano → librería). Un nombre que **no resuelve cuenta como ausente**: la cadena sigue (iniciales de `name` → `user`) y avisa (aviso 6). El icono por defecto `user` es **propio** del componente: sale **solo de la librería** (`icons.md` §4, #200) y la aplicación no lo cambia con el registro.
- **`size`:** lado = `space × n` (§ «Escala»). Decide también el **número de letras** y el rol tipográfico. El avatar **nunca se estira ni se encoge** para llenar un hueco: es el hueco el que adopta su caja (#295).
- **`shape`:** `circle` = **persona** (por defecto); `square` = **entidad**. La forma dice **qué es** lo representado, no la personalidad del tema: **no** lee `--g-radius-shape` (#8, #23: es la forma de las acciones; con `shape: "pill"` las entidades parecerían personas). El cuadrado lleva un radio de la escala del tema que crece con el tamaño (alias local de coco; sin token).
- **`color`:** `'neutral'` = neutro (y **gana** a `categories`); `k` (1 a 12, número o cadena numérica `"3"`) = **categoría fija** `k`. Cualquier otro valor (incluidos `brand`, `danger` y el resto de semánticos: un avatar rojo diría «peligro», `tokens.md` §17.7) **se ignora** como si no estuviera (sigue el color derivado o el neutro) y avisa (aviso 3). Sin valor: derivado si `categories > 0`; si no, neutro.
- **`categories`:** cuántas categorías declara el tema de la aplicación (`categories: N` del CLI). Con `n > 0` y sin `color`, la categoría se **deriva** de `colorKey ?? name` con el hash de § «Color». Fuera de 0..12 o no entero: se trata como `0` y avisa (aviso 4). Grana no puede saber cuántas `--g-color-cat-*` hay sin leer el tema ni usar valores de respaldo: lo declara la aplicación, como `speakerColors` (#247).
- **`colorKey`:** clave estable del color (un id): con ella, el color de una persona **no cambia al renombrarla** y dos homónimos pueden diferir. Un número se convierte con `String()`. Sin `colorKey` ni `name` (o vacíos tras normalizar): neutro.
- **`label`:** sin valor, **decorativo** (`aria-hidden="true"` en la raíz). Con valor, `role="img"` y `aria-label` en la raíz; la `<img>` lleva **siempre** `alt=""`. **No hay prop `alt`**: una sola fuente de nombre, que no cambia al pasar de cargando a imagen o a fallida (WCAG 4.1.2).
- **Resto de atributos** (`inheritAttrs: false`): `class`, `style`, `id`, `title`, `data-*` y `lang` van a la **raíz**. **`role`, `aria-*` y `tabindex` se ignoran** y avisan (aviso 5): romperían el contrato decorativo/con nombre (como `GIcon`, #199). **Escuchas de puntero o teclado** (`onClick`, `onKeydown`…) **no se enlazan** y avisan (aviso 5): un `<span>` con clic sería un control sin rol ni teclado (WCAG 2.1.1, 4.1.2). Los atributos **nunca** llegan a la `<img>` (`srcset`, `crossorigin` y `referrerpolicy` quedan reservados).

## Semántica

| Caso | Raíz | Árbol de accesibilidad | Ejemplo |
| --- | --- | --- | --- |
| Sin `label` (por defecto) | `aria-hidden="true"` | Fuera del árbol | Tarjeta, menú, select, pie expandido de `GSidebar`, compuesta de `GTable` |
| Dentro de un control | Sin `label`; el nombre lo da el control (`aria-label` o su texto) | El control con su nombre | Riel de `GSidebar`, botón de cuenta |
| Única identificación | `label` → `role="img"` + `aria-label` | `img "Ana María López"` | Columna densa solo con avatar (`cell-{key}`), avatar suelto |
| `label` dentro de un ancestro `aria-hidden` | Igual que con `label` | El nombre no llega | Aviso 1 (comprobado al montar, como `GIcon`) |

- **La `<img>` lleva siempre `alt=""`**, en todos los casos: la imagen nunca es la fuente del nombre.
- **Las iniciales** van en un `<span>` con `dir="auto"` (en una página RTL, «AL» no se lee «LA»; «مع» toma su orden) y `translate="no"` (un traductor automático no debe convertir «AL» en otra cosa; HTML `translate`).
- **Ningún elemento** del avatar lleva `tabindex`, foco ni manejadores.

## Estructura

```html
<!-- Decorativo, con iniciales y categoría derivada -->
<span class="g-avatar g-avatar--size-md g-avatar--shape-circle g-avatar--content-initials" data-cat="3" aria-hidden="true">
  <span class="g-avatar__initials" dir="auto" translate="no">AL</span>
</span>

<!-- Con imagen (cargando → cargada) y nombre; respaldo de icono -->
<span class="g-avatar g-avatar--size-lg g-avatar--shape-square g-avatar--content-icon is-loaded" role="img" aria-label="Grana Labs">
  <svg class="g-icon g-avatar__icon" aria-hidden="true" focusable="false">…building-2…</svg>
  <img class="g-avatar__img" src="…" alt="" loading="lazy" decoding="async" draggable="false">
</span>
```

- **Orden de los hijos:** primero el **respaldo** (`__initials` o `__icon`), después la `__img`. El respaldo existe **siempre**; la `<img>` solo con `src` y mientras no haya fallado (con `key` = `src`, para que un cambio de `src` cree una imagen nueva).
- **El icono** es el `GIcon` interno (`GLibIcon` para `user`; el `GIcon` público con resolución de la aplicación para `icon`) con la clase `g-avatar__icon`; decorativo (la raíz ya decide el árbol).
- **Una sola caja** de lado fijo; la `<img>` se apila encima (`inset: 0`, `object-fit: cover`). Con `is-loaded`, el respaldo queda **oculto sin salir del flujo** (`visibility: hidden`, nunca `display: none`): la caja no depende del contenido.
- **`data-cat="k"`** en la raíz **solo** cuando hay categoría (fija o derivada), como la marca de `GTranscript` (#259).

## Iniciales

### Regla de derivación (de `name`)

1. Normalizar a **NFC**, recortar y partir por espacios Unicode (`/\s+/u`).
2. De cada palabra, tomar el **primer grafema** (`Intl.Segmenter` con granularidad `grapheme`; sin él, punto de código) **que empiece por letra o número** (`/^[\p{L}\p{N}]/u`). Las palabras sin letras ni números (emoji, signos) se saltan.
3. Una palabra: su letra. Varias: la de la **primera** y la de la **última** («Ana María López» → «AL»).
4. **Una sola letra** si el tamaño es `xs` o `sm`, o si alguna de las elegidas es de escritura **ancha** (`\p{Script=Han}`, `Hiragana`, `Katakana`, `Hangul`).
5. Mayúscula con **`toUpperCase()` sin configuración regional**, **solo si sigue siendo un grafema** («ß» no pasa a «SS»). Sin configuración regional para que el servidor y el cliente den lo mismo (SSR sin desajuste de hidratación); con nombres turcos, la aplicación pasa `initials` (§ «Límites»).
6. Sin resultado: el icono (`icon` o `user`).

**Máximo de letras:** 2; **1** en `xs`/`sm` (medido: «WM» y «ЖШ» a 12px miden 23,8 y 24,5px y la cuerda útil del círculo es 16px en `xs` y 20,4px en `sm`; bajar de 12px no está permitido, `tokens.md` §7) y **1** con escritura ancha en cualquier tamaño.

**`initials` explícitas:** NFC, recorte, sin grafemas de espacio; se cortan al máximo (2, o 1 si uno de los dos primeros es ancho; 1 en `xs`/`sm`). **No** se pasan a mayúsculas.

### Casos (deben pasar como pruebas unitarias; verificados por kiwi en los tres motores)

| Entrada | `md` | `xs` | Nota |
| --- | --- | --- | --- |
| `name="Ana María López"` | AL | A | Primera y última |
| `name="李小龙"` | 李 | 李 | Una palabra, ancha |
| `name="山田 太郎"` | 山 | 山 | Dos palabras, ancha → una |
| `name="김민수"` | 김 | 김 | Hangul |
| `name="ØRSTED"` | Ø | Ø | Una palabra |
| `name="Madonna"` | M | M | Un solo nombre |
| `name=""`, `name="   "` | icono `user` | icono `user` | Vacío |
| `name="🦊"` | icono `user` | icono `user` | Sin letras |
| `name="🦊 Zorro Plateado"` | ZP | Z | El emoji se salta |
| `name="jean-luc picard"` | JP | J | El guion no parte; mayúsculas |
| `name="O'Brien"` | O | O | Signo dentro de la palabra |
| `name="Émile Zola"` (NFD) | ÉZ | É | NFC une la tilde |
| `name="łukasz żółw"` | ŁŻ | Ł | Mayúscula fuera del ASCII |
| `name="محمد علي"` | مع | م | Árabe, con `dir="auto"` |
| `name="Straße"` | S | S | — |
| `name="ßeta"` | ß | ß | «ß» no pasa a «SS» |
| `initials="ABC"` | AB | A | Recorte con aviso 2 (no en `xs`) |
| `initials="ab"` | ab | a | Sin mayúsculas forzadas |
| `initials="🦊"` | 🦊 | 🦊 | Las explícitas admiten emoji |
| `name="Ana" icon="users"` | icono `users` | icono `users` | Lo explícito gana |
| `name="Ana" icon="no-existe"` | A | A | Icono que no resuelve: sigue la cadena (aviso 6); «Ana» es una palabra |

## Escala

| `size` | Lado | Con `space` 4 | Letras | Hueco que lo recibe (guía de uso) |
| --- | --- | --- | --- | --- |
| `xs` | `space × 5` | 20px | 1 | Icono de `GMenu` y de `GSelect`; en línea con texto `body-sm` |
| `sm` | `space × 6` | 24px | 1 | Celda densa solo con avatar (`cell-{key}` de `GTable`, con `label`) |
| `md` | `space × 8` | 32px | 2 | `leading-{key}` de `GTable`; slot `user` de `GSidebar` (también en el riel) |
| `lg` | `space × 10` | 40px | 2 | `lead` de `GCard` (= su caja, #123) |
| `xl` | `space × 16` | 64px | 2 | Perfil, cabecera de detalle |

- **Tipografía por tamaño** (la elige coco; la restricción es estructural): el rol de las iniciales es **≥ 12px** en todos los tamaños y deja caber **dos letras anchas** («WM», «ЖШ») en `md`, `lg` y `xl` con 1px de aire a la altura de las mayúsculas. Propuesta medida por kiwi: `xs`/`sm` `caption`, `md` `body-sm`, `lg` `body`, `xl` `title-sm`. **No** cambia con `density` (no hay `density`).
- **Icono de respaldo:** proporcional al lado (alias local de coco), nunca menor que el de un `GIcon` en el mismo tamaño de texto.
- **Sin área táctil:** no es interactivo (como `GBadge`).

## Color

| Entrada | Resultado | `data-cat` |
| --- | --- | --- |
| Sin `color` y `categories` 0 | **Neutro:** `--g-color-neutral-soft` / `--g-color-on-neutral-soft` | — |
| `color="neutral"` | Neutro (gana a `categories`) | — |
| `color="k"` (1 a 12) | `--g-color-cat-k-soft` / `--g-color-on-cat-k-soft` | `k` |
| `categories="n"` (1 a 12), sin `color`, con clave | `k = hash(clave) mod n + 1` | `k` |
| `categories="n"` sin clave | Neutro | — |
| `k` mayor que las categorías del tema | Sin relleno (el `var()` sin respaldo no resuelve): letra en el color heredado, legible. **El componente no puede detectarlo** sin leer estilos: límite documentado | `k` |

- **Contraste:** `on-cat-k-soft` sobre `cat-k-soft` ≥ 4,5:1 está **garantizado por derivación** (`tokens.md` §2, §16.3); medido por kiwi: mínimo 4,52:1 (tema por defecto + 12, oscuro, `cat-7`; marca roja + 8, oscuro, `cat-6`); en el motor, 7 marcas × N ∈ {1, 4, 6, 8, 12}, claro y oscuro, mínimo 4,50:1. Neutro: 6,54:1 claro, 4,56:1 oscuro (tema por defecto). Texto **e** icono usan el mismo color.
- **Imagen:** el relleno queda debajo (útil para PNG con transparencia).
- **Nunca color semántico ni libre** (aviso 3).

### Hash (contrato estable; #294)

```js
function avatarCategory(key, n) {               // key: colorKey ?? name; n: categories (1..12)
  const s = String(key).normalize('NFC').trim().replace(/\s+/gu, ' ').toLowerCase()
  if (!s) return null                           // sin clave → neutro
  let h = 0x811c9dc5                            // FNV-1a de 32 bits…
  for (const b of new TextEncoder().encode(s)) { // …sobre los octetos UTF-8 de la clave normalizada
    h ^= b
    h = Math.imul(h, 0x01000193)
  }
  h ^= h >>> 16                                 // finalizador fmix32 (MurmurHash3)
  h = Math.imul(h, 0x85ebca6b)
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b2ae35)
  h ^= h >>> 16
  return ((h >>> 0) % n) + 1
}
```

- **Normalización:** NFC, recorte, espacios Unicode colapsados a uno, `toLowerCase()` sin configuración regional. Mayúsculas, espacios y NFD dan la **misma** categoría.
- **UTF-8, no unidades UTF-16:** FNV está definido sobre octetos y UTF-8 es lo que produce cualquier servidor, base de datos u otro lenguaje; así otra vista (un correo, un PDF, el servidor) reproduce el color sin JavaScript. `TextEncoder` existe en los tres motores y en Node (SSR).
- **Finalizador `fmix32`:** FNV-1a solo, módulo una potencia de dos, usa sus bits bajos, que reparten mal claves parecidas. Medido por lima con 2 000 nombres compuestos en español: FNV-1a solo da 217 a 321 por categoría con `n = 8` (χ² = 33,6, 7 g. l.; con unidades UTF-16, 29,4); con `fmix32`, **232 a 265** (χ² = 3,9) y con `n = 12`, 139 a 181 (χ² = 6,9). Con claves `persona i` (las de kiwi): 223 a 282 en 8.
- **Vectores de prueba** (bruno los fija como pruebas unitarias; el resultado no puede cambiar entre versiones sin decisión de lima):

  | Clave | FNV-1a UTF-8 | Final | `n = 4` | `n = 8` | `n = 12` |
  | --- | --- | --- | --- | --- | --- |
  | `a` | `0xe40c292c` | `0x1a80b1b3` | 4 | 4 | 4 |
  | `Ana María López` (y `  ANA   MARÍA lópez `, y la forma NFD) | `0x99aed0a5` | `0x90e9d871` | 2 | 2 | 2 |
  | `李小龙` | `0x785baf5e` | `0xd8b5db68` | 1 | 1 | 1 |
  | `محمد علي` | `0x645a7758` | `0xd8e7ecf5` | 2 | 6 | 2 |
  | `Grana Labs` | `0xf799e056` | `0x66b94592` | 3 | 3 | 11 |
  | `u_8f3a2c` | `0x2f0f4238` | `0x9870e929` | 2 | 2 | 2 |
  | `Zoë` | `0x4314427c` | `0xe8433722` | 3 | 3 | 11 |

- **Cambiar `n` reparte de nuevo** (inherente a un módulo): se documenta, y por eso existe `color` fijo.
- **No se exporta** una función en v0.1 (sin consumidor); el algoritmo está aquí para reproducirlo fuera.

## Imagen

| Estado | Clase en la raíz | Se ve | `<img>` |
| --- | --- | --- | --- |
| Sin `src` | — | respaldo | no existe |
| Cargando | `is-loading` | respaldo; `<img>` invisible encima | existe |
| Cargada | `is-loaded` | imagen (`cover`); respaldo `visibility: hidden` | existe |
| Fallida | `is-failed` | respaldo | **se quita** (sin icono de imagen rota del navegador) |
| Cambio de `src` | vuelve a `is-loading` | respaldo hasta `load` | nueva (`key` = `src`) |

- **`loading="lazy"` y `decoding="async"`** en la `<img>`: en tablas y listas largas evita descargar caras fuera de vista; la caja fija impide el salto. **`draggable="false"`**.
- **SSR:** el servidor emite `is-loading` con `src`; al montar se comprueba `complete`/`naturalWidth` (la `load` pudo ocurrir antes de hidratar).
- **Movimiento:** un fundido de entrada de la imagen es **opcional** (coco), con `--g-duration-fast` y `--g-ease-standard`, **solo** con `prefers-reduced-motion: no-preference`.
- Sin eventos `load`/`error` (reservados, § «Eventos»).

## Eventos

**Ninguno.** No es interactivo. `load` y `error` de la imagen quedan **reservados** (sin consumidor; el estado se ve en la clase). `emits: []` declarado (las escuchas del consumidor no se enlazan: aviso 5).

## Slots

**Ninguno.** Un logotipo es `src`; un pictograma, `icon`; un nombre, `label`. Un slot dejaría meter controles o texto suelto en una caja decorativa (kiwi §2). Contenido en el slot por defecto no se pinta y avisa (aviso 7).

## Teclado

No aplica: **nunca** enfocable ni interactivo (sin `tabindex`; aviso 5 si se pasa). Si el avatar abre algo, el `<button>` lo pone la aplicación y el avatar dentro va sin `label`.

## Presencia (composición con `GBadge`; #297)

Sin prop `status`. La presencia es una **`GBadge` anclada** (#59) con el avatar en el slot `anchor`: figura + `label` + `placement` lógico, «nunca solo color» (WCAG 1.4.1) y espejo en RTL ya resueltos.

```html
<GBadge shape="circle" color="success" label="En línea" placement="bottom-end">
  <template #anchor><GAvatar name="Ana María López" size="lg" :categories="8" /></template>
</GBadge>
```

- **Convención sugerida** (la ratifica la aplicación, como en `badge.md`): en línea = `circle`, ausente = `diamond`, ocupado = `square`; desconectado = sin insignia.
- **Sobre un círculo**, la insignia se centra en el **contorno** (punto a 45°), no en la esquina de la caja (hoy queda 8,3px fuera en `lg`, medido por kiwi). Lo resuelve coco en `GBadge.css` cuando el destino es `.g-avatar--shape-circle` (constante geométrica `1 − 1/√2` del lado, no un token). En `square`, la esquina como hoy.
- Con el avatar **decorativo**, se lee solo «En línea» junto al nombre visible; con `label`, «Ana María López, En línea» (el destino va antes, `badge.md`).

## Avatar en un hueco de otro componente (#295)

**Regla:** el avatar mide **siempre** `space × n` de su `size`; **el hueco que lo recibe adopta su caja y pierde su marco** (borde, relleno, radio y recorte propios), para que se vea **una sola forma**. Se detecta en CSS con el **hijo directo** `.g-avatar` (`:has(> .g-avatar)`): el nombre de clase es el contrato (L2); ningún componente importa `GAvatar` (criterio de #123). El avatar debe ser **hijo directo** del slot.

| Anfitrión | Hueco | `size` recomendado | Cambio en el anfitrión (coco, CSS) | Contrato |
| --- | --- | --- | --- | --- |
| `GCard`, slot `lead` | `space × 10`, con marco | `lg` | Con avatar: **sin** borde, relleno ni radio propios y **sin estirar** al hijo (la regla `> * { 100% }` no aplica a `.g-avatar`); el esqueleto de carga no cambia | `card.md` |
| `GTable`, slot `leading-{key}` | `space × 8`, círculo `surface-sunken` recortado | `md` | Con avatar: **sin** relleno, radio ni `overflow: hidden` propios (un `square` se ve cuadrado). El `leading` de texto **no cambia** (L6) | `table.md` |
| `GMenu`, slot `icon` | `space × 4.5` | `xs` | Con avatar: el hueco mide `space × 5`; en un menú que mezcla iconos y avatares, **todos** los huecos no vacíos miden `space × 5` (etiquetas alineadas; el icono, centrado a su tamaño). Alto del elemento sin cambio (36 = 36, medido) | `menu.md` |
| `GSelect`, slot `icon` | `1.25em` | `xs` | Con avatar: el hueco mide `space × 5` y el avatar se **centra en la línea de texto** (hoy queda 2,0 a 2,4px por debajo), en la lista y junto al valor; alto del control sin cambio (34 = 34, medido) | `select.md` |
| `GSidebar`, slot `user` | Libre (botón de la aplicación) | `md` | Ninguno | `sidebar.md` |
| `GTranscript` | — | — | **No se migra** (L12) | `speech.md` |

## Tokens consumidos

| Token | Para qué |
| --- | --- |
| `--g-space-1` | Lado (`× 5, 6, 8, 10, 16`) y tamaño del icono (alias local) |
| `--g-color-neutral-soft`, `--g-color-on-neutral-soft` | Relleno y texto/icono neutros |
| `--g-color-cat-k-soft`, `--g-color-on-cat-k-soft` (k = 1 a 12) | Relleno y texto/icono de la categoría `k` (familia **condicional**: solo existe con `categories: N` en el tema, `tokens.md` §16.3) |
| `--g-text-{rol}-size`, `-line`, `-weight`, `-tracking` | Iniciales (roles por tamaño: coco, ≥ 12px) |
| `--g-font-ui` | Iniciales |
| `--g-radius-xs` … `--g-radius-lg` | Radio del `square` por tamaño (alias local de coco; el `circle` es 50 %, geometría) |
| `--g-border-width` | Borde `CanvasText` en `forced-colors` |
| `--g-duration-fast`, `--g-ease-standard` | Fundido opcional de la imagen |

**Tokens nuevos: ninguno** (`tokens.md` §28; §17.6: ningún existente se queda corto). **Excepción nombrada:** `GAvatar.css` entra en **`CAT_FAMILY_READERS`** de `levels.test.js` junto a `GTranscript.css` (#260, #294): puede leer `--g-color-cat-k-soft` y `--g-color-on-cat-k-soft` (k de 1 a 12) sin que existan en `defaults.css` y sin respaldo. **No** lee `-strong`, `-text` ni `cat-k` (sin borde de categoría: el avatar no es un control).

## Clases (contrato entre bruno y coco)

| Clase / atributo | Elemento | Cuándo |
| --- | --- | --- |
| `g-avatar` | Raíz `<span>` | Siempre |
| `g-avatar--size-{xs\|sm\|md\|lg\|xl}` | Raíz | Siempre |
| `g-avatar--shape-{circle\|square}` | Raíz | Siempre |
| `g-avatar--content-{initials\|icon}` | Raíz | Siempre: qué **respaldo** hay (también con la imagen cargada) |
| `is-loading` · `is-loaded` · `is-failed` | Raíz | Solo con `src` (uno a la vez) |
| `data-cat="k"` | Raíz | Solo con categoría (fija o derivada) |
| `g-avatar__initials` | `<span dir="auto" translate="no">` | Con respaldo de iniciales |
| `g-avatar__icon` | `GIcon` interno (`g-icon g-avatar__icon`) | Con respaldo de icono |
| `g-avatar__img` | `<img alt="">` | Con `src` y sin fallo |

`label` no tiene clase (se expresa con `role`/`aria-label`).

## Estados que coco debe cubrir

Imagen cargada · cargando · fallida (con iniciales o con icono) · iniciales · icono (por defecto o explícito) · neutro · categoría (fija o derivada) · `circle` · `square` · decorativo · con nombre · con presencia (`GBadge` anclada) · **`forced-colors`**: el relleno desaparece y un **borde `CanvasText`** de `--g-border-width` conserva la forma **sin cambiar el tamaño** (borde por dentro o con `box-sizing`; medido por kiwi: 32 = 32) · **movimiento reducido**: sin fundido · **RTL**: sin efecto en el avatar (las iniciales no se invierten); la insignia anclada se espeja. Sin hover, foco ni pulsado.

## Avisos de desarrollo (bruno; L11)

`typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'` (nunca `import.meta.env.DEV`), una vez por causa y valor, prefijo `[Grana GAvatar]`:

| # | Causa | Qué hace el componente |
| --- | --- | --- |
| 1 | `label` con un antecesor `aria-hidden="true"` (comprobado al montar) | Dibuja igual. El aviso dice que el nombre no llega y que, dentro de un hueco decorativo, el nombre va en el control o en el texto vecino |
| 2 | `initials` con más grafemas que el máximo absoluto (2, o 1 con escritura ancha) | Las corta. No avisa por la reducción a 1 en `xs`/`sm` |
| 3 | `color` que no es `'neutral'` ni un entero de 1 a 12 (un semántico como `danger` tiene su propio texto: «un avatar no lleva color semántico») | Lo ignora: color derivado o neutro |
| 4 | `categories` fuera de 0..12 o no entero | Lo trata como `0` |
| 5 | `role`, `aria-*`, `tabindex` o escuchas (`onClick`, `onKeydown`…) como atributos | No los pasa a la raíz. El aviso remite a `label` (nombre) o a envolver el avatar en un `<button>` (acción) |
| 6 | `icon` que no está en el registro ni en la librería | Sigue la cadena (iniciales de `name` → `user`). Mismo texto de ayuda que `GIcon` (cómo registrarlo) |
| 7 | Contenido en el slot por defecto | No lo pinta. «Usa `src`, `initials`, `icon` o `label`» |

**No avisa** (imposible sin leer estilos): `k` mayor que las categorías del tema; `categories` distinto del `categories` real del tema.

## Verificación (cómo se comprueba)

**Unitarias (bruno, vitest):** la tabla de iniciales completa (`md` y `xs`); los vectores del hash y su invariancia (mayúsculas, espacios, NFD); precedencia del contenido (las cinco fuentes, `icon` que no resuelve, cadenas vacías); `color` frente a `categories`, `color` numérico y en cadena, semánticos ignorados; `data-cat` solo con categoría; estados de la imagen (`load`, `error`, `src` cambiado, imagen en caché al montar); `alt=""` siempre; `aria-hidden` sin `label`, `role="img"` + `aria-label` con él; atributos filtrados (aviso 5) y `class`/`style`/`data-*` en la raíz; los siete avisos; instantánea del marcado; `user` sale de la librería aunque el registro de la aplicación tenga otro `user`.

**Navegador (Playwright, tres motores; adaptar `design/lab/avatar/r01/verificar.mjs` al componente real):** lado = `space × n` con `space` 4 y 5 en los cinco tamaños y las dos formas; dos letras anchas caben en `md`..`xl` y texto ≥ 12px; contraste ≥ 4,5:1 (texto e icono) en neutro y en todas las categorías declaradas, claro y oscuro, con los dos temas de la ronda; hash idéntico entre motores (los vectores); sin salto de caja ni del texto vecino al cargar y al fallar; fundido `0s` con `reduce`; `forced-colors` (Chromium) con borde y sin cambio de tamaño; los huecos de la tabla anterior (una forma, sin desborde, centrado en `GSelect`, alineación de etiquetas en `GMenu`, altura de fila de `GTable`); `GBadge` en el contorno del círculo en LTR y RTL; `ariaSnapshot` de los casos de § «Semántica»; 320px sin desplazamiento horizontal; consola sin errores.

**Compuerta de build:** `grep -q "g-avatar--shape-square" packages/vue/dist/grana.css`.

## Resolución de hallazgos

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| L1 | API de `GAvatar` | **Confirmada** con un cambio: `src`, `name`, `initials`, `icon`, `size`, `shape`, `color`, **`categories`** (en lugar de `colors`), `colorKey`, `label`. `color` acepta número o cadena numérica; `colorKey`, cadena o número. Sin `alt`, `status`, slots ni eventos; `srcset`/`crossorigin`/`referrerpolicy`/`load`/`error` reservados. `colors` se descarta porque se confunde con `color` por una letra y ambos aceptan números válidos con efectos distintos (`:colors="3"` repartiría entre 3, `:color="3"` fija la 3), un error silencioso; `categories` es además el **mismo nombre y valor** que la entrada del tema que la aplicación ya escribió. Mayúsculas de las iniciales con `toUpperCase()` sin configuración regional (SSR) | #293; heurística de prevención de errores; `tokens.md` §16.3; #199 |
| L2 | Clases | **Confirmadas** (§ «Clases») y `data-cat` en la raíz solo con categoría; las iniciales añaden `translate="no"` | #293; HTML `translate`; #259 |
| L3 | Tokens: ninguno nuevo; `CAT_FAMILY_READERS` | **Confirmado.** `tokens.md` §28 «Avatar (sin tokens nuevos)»; §24 deja de decir «solo `GTranscript.css`». **Para bruno:** añadir `'GAvatar/GAvatar.css': 'relleno del avatar por categoría (color / categories)'` a `CAT_FAMILY_READERS` de `packages/vue/src/tokens/levels.test.js`. **Para el CLI (bruno):** sin cambio (la familia ya se emite con `categories`) | #294; #260 |
| L4 | `GCard` `lead` con avatar: dos formas | **Aceptado.** Con un hijo directo `.g-avatar`, el `lead` pierde borde, relleno y radio y no estira al avatar; la caja sigue en `space × 10` con `lg`; el esqueleto no cambia. Regla en `card.md` (Slots, `lead`) para coco (`GCard.css`) | #295 |
| L5 | Huecos que no llenan | **Los huecos crecen; el avatar no se adapta.** Sin `size="fill"` ni `inherit`: el avatar mide siempre `space × n` (las reglas de letras y de ≥ 12px están medidas por tamaño; un hueco en `em`, como el de `GSelect`, haría depender la caja del tamaño de letra). `GMenu` y `GSelect`: hueco de `space × 5` con avatar (alineación de etiquetas en `GMenu`, centrado en la línea en `GSelect`); `GTable` `leading`: sin relleno, radio ni recorte propios con avatar. Reglas en `menu.md`, `select.md` y `table.md` para coco | #295 |
| L6 | `GTable` `leading` de texto | **Se queda** sin cambios (no se acopla `GTable` a `GAvatar`); `table.md` recomienda `leading-{key}` + `GAvatar` para imagen, color o derivación | #123; #295 |
| L7 | Icono `user` en la librería | **Aceptado.** Entra en `icons.md` §4 (v0.6) como respaldo propio de `GAvatar`. **Para bruno:** añadir `user` a la lista `library` de `packages/vue/scripts/icons.json` antes de usarlo (nombre canónico comprobado: `lucide-static` 1.49.0, `dist/esm/icons/user.mjs`, marca `lucide-user`) | #296; #201 |
| L8 | `GMenu`: dato del avatar | **Sin `item.avatar`.** El dato del avatar va en `item.icon` como **valor opaco** (un objeto `{ name, src, … }`), que ya hoy solo recibe el slot `icon` (#202); el slot dibuja `<GAvatar v-bind="item.icon" size="xs" />`. Un `item.avatar` que dibujara `GAvatar` por sí solo acoplaría `GMenu` a `GAvatar` (criterio de #123) y abriría la misma pregunta en `GSidebar`, `GTabs` y `GRadioGroup`; queda **candidato** si un segundo componente lo pide. Ejemplo en `menu.md` | #296; #202; #123 |
| L9 | Hash como contrato | **Aceptado con dos cambios medidos:** FNV-1a de 32 bits sobre **octetos UTF-8** (no unidades UTF-16: reproducible fuera de JavaScript) **más el finalizador `fmix32`** (FNV-1a solo reparte mal nombres parecidos: χ² 33,6 frente a 3,9). Clave `colorKey ?? name`, normalización de kiwi, `mod n + 1`, vectores de prueba en el contrato; no se exporta en v0.1 | #294 |
| L10 | Escalas de `GAvatarMotion` frente a `GAvatar`; `GBadge` sobre un círculo | **Escalas: no se unifican**, se documentan en los dos contratos (cada una sale de sus huecos: `GAvatarMotion` necesita 48 y 96px para que el dibujo se lea; `GAvatar`, 40px del `lead` de `GCard`; cambiar `GAvatarMotion` rompería a quien ya lo usa sin motivo funcional). **`GBadge`:** se retira «Sin avatar» de los límites de `badge.md`; sobre un `.g-avatar--shape-circle`, la insignia se centra en el contorno a 45° (coco, `GBadge.css`) | #297 |
| L11 | Avisos de desarrollo | **Aceptados y ampliados** a siete (§ «Avisos»): `icon` que no resuelve sigue la cadena; las escuchas no se enlazan; semánticos en `color` con texto propio; contenido en el slot por defecto | #293; #199 |
| L12 | `speech.md` | **Aceptado.** Una línea en §23.6: la marca de hablante no es `GAvatar` (etiqueta de posición con borde ≥ 3:1, discontinua sin asignar y ancho que crece con «AA»); solo comparte la familia `cat-k` y `CAT_FAMILY_READERS` | #294; #247 |
| L13 | `sidebar.md` y el playground | **Aceptado.** Ejemplo del slot `user` en `sidebar.md` con `GAvatar size="md"` decorativo dentro del botón de la aplicación y el nombre en el botón (texto expandido, `aria-label` en el riel). **Para bruno:** sustituir el círculo dibujado a mano de `packages/vue/playground/index.html` (l. 965) por `GAvatar` cuando exista | #295 |

## Límites conocidos

- **Lectores de pantalla reales** (VoiceOver, NVDA) sobre `<span role="img" aria-label>` con `<img alt="">` dentro, en celda, en botón y en elemento de menú: sin verificar (solo el árbol de Playwright).
- **`forced-colors` real** (Windows) y en Firefox/WebKit (no se emula).
- **Carga diferida** por motor, imágenes de alta densidad, SSR con imagen en caché: sin verificar.
- **Escrituras complejas** sin validar con hablantes: Devanagari (`Intl.Segmenter` da «प्रि» + «श»), árabe con ligadura, tailandés, secuencias ZWJ en `initials`. **Turco:** `toUpperCase()` sin configuración regional da «I» para «i» (no «İ»); la aplicación pasa `initials` si le importa.
- **Temas con `space` y `fontSize` desacoplados:** `xs` deja de igualar el interlineado de `body-sm`.
- **Categoría inexistente en el tema** (`k` > `categories` real): sin relleno, sin aviso.
- **Cambiar `categories` reparte los colores** de nuevo.

## Fuera de v0.1 (reservado)

- **`GAvatarGroup`** (pila, «+N» con nombre, solapado lógico en RTL): ronda propia cuando un consumidor la necesite.
- **`status`** en `GAvatar`: no; la vía es `GBadge` anclada.
- **Eventos `load`/`error`**, `srcset`, `sizes`, `crossorigin`, `referrerpolicy`.
- **`categories` por aplicación** (un `provide` para no repetirlo en cada avatar): candidato si se pide.
- **`item.avatar`** en `GMenu` (y equivalentes en otros datos): candidato (L8).
- **Exportar el hash** (`avatarCategory`): solo con consumidor.
