# Registro de decisiones

Cada entrada: qué se decidió, por qué, y qué alternativa se descartó.

| # | Decisión | Porqué | Descartado |
| --- | --- | --- | --- |
| 1 | Nombre **Grana**, org npm `@grana` | Se escribe igual al oírlo en inglés y español; tres capas (tinte oaxaqueño, *bug*, *granular*) | VueGrana, Vuebrije, Vuelaguetza, Cobalto |
| 2 | Prefijo `g-` (`<g-btn>`, `GBtn`, `--g-*`) | Una letra, sin dueño conocido en el ecosistema Vue | `v-`, `q-`, `n-`, `o-`, `a-`, `b-`, `c-` |
| 3 | Paquetes separados `@grana/vue` y `@grana/cli` | Quien usa CDN no descarga código de terminal | Un solo paquete |
| 4 | Tema por **capas CSS** (`grana.defaults`, `grana.components`) | Las declaraciones sin capa ganan siempre: el tema del usuario gana sin depender del orden de carga | Valores de respaldo `var(--x, valor)` en cada componente |
| 5 | Tema generado **en build** (CLI / plugin de Vite); modo en tiempo de ejecución solo como opción | Sin parpadeo; los contrastes se calculan antes de publicar | Descargar el JSON al arrancar como modo principal |
| 6 | Dos colores de marca: **`brand`** (actuar) y **`accent`** (señalar) | Nombres por trabajo, no por orden; evita el choque con la variante "secondary" | `primary`/`secondary` |
| 7 | Derivación de color en **OKLCH** | Su luminosidad es perceptual: la misma regla sirve para cualquier color | HSL |
| 8 | Radios en escala **geométrica** (× 1.4) + entrada `shape` | Las diferencias se perciben relativas; la píldora es personalidad, no un paso | Escala lineal; píldora por componente |
| 9 | Espaciado **lineal** (múltiplos de `space`) | Los espacios se suman: múltiplos de la unidad mantienen la cuadrícula | Escala geométrica |
| 10 | Tipografía: escala modular hacia arriba, fracciones fijas hacia abajo | Los títulos piden jerarquía; el texto pequeño, legibilidad | Una sola escala modular |
| 11 | Dos familias: `font` y `fontDisplay` (solo rol `display` y acentos) | Personalidad sin forzar títulos serif | Una sola familia |
| 12 | Mínimos de accesibilidad **fuera del tema** | Protegen al usuario final | Mínimos configurables |
| 13 | Sombras fijas y tema oscuro derivado en la v0.1 | No bloquean la primera versión | Diseñarlos antes de tener un componente |
| 14 | `GBtn` con `loadingText`, anunciado en una región `role="status"` **fuera** del botón | Los hijos de un botón son presentacionales; la región debe existir antes del cambio | Solo `aria-busy`; región viva dentro del botón |
| 15 | `density` reduce altura, padding y separación, con piso de 24px | Una interfaz compacta con controles de altura completa no gana densidad | Solo padding |
| 16 | Mínimos de accesibilidad como literales (`24px`, `44px`), no como tokens | Un token sería sobrescribible por el tema del usuario | Tokens `--g-a11y-*` |
| 17 | `loading` usa `aria-disabled`, no `disabled` | Deshabilitar un botón enfocado hace perder el foco | `disabled` nativo |
| 18 | Tema por defecto **neutro y minimalista** (referencias: Notion, Medium, Apple): `brand` tinta #1F1F1F, `accent` azul #0B63CE, grises neutros, radio 6 | Un tema neutro no compite con la marca de quien instala Grana | Grana + añil como tema por defecto (queda como tema opcional) |
| 19 | Fuente por defecto **Instrument Sans**, incluida en el paquete (fontsource, OFL) | Personalidad sin costo para quien usa su propia fuente: `@font-face` es perezoso | Pila del sistema; Google Fonts por CDN (privacidad y dependencia externa) |
| 20 | Sin serif por defecto (`fontDisplay` = `font`) | Evita una segunda descarga a todos; la personalidad la da Instrument Sans | Fraunces como `fontDisplay` por defecto |
| 22 | Fuente en `dist/fonts.css` + `dist/fonts/*.woff2`, generados por `scripts/build-fonts.mjs` fuera de Vite | Vite en modo librería incrustaba la fuente en base64 dentro de `grana.css` (1.98 kB → 58.84 kB) y anulaba la descarga perezosa | Importar fontsource desde `grana.css` |
| 23 | Tokens de estructura: `radius-shape`, `border-width`, `focus-width/offset`, `duration-fast/spin`, `ease-standard`, `text-action-weight` | Sin ellos, el CSS de un componente necesita literales | Literales en el CSS de cada componente |
| 24 | Padding vertical calculado desde la altura objetivo | `min-block-size` es un mínimo: con padding fijo, los tamaños pequeños crecían y la densidad no actuaba | Padding fijo |
| 25 | Avisos de desarrollo con `typeof process` y `process.env.NODE_ENV`, no `import.meta.env.DEV` | Vite reemplaza `import.meta.env.DEV` al construir la librería; `process` no existe en el UMD | `import.meta.env.DEV` |
| 26 | Enlace deshabilitado con `role="link"` | Un `<a>` sin `href` pierde su rol | Solo `aria-disabled` |
| 21 | Regla de `strong` corregida: oscurece; aclara solo si L < 0.3; invierte si el contraste con `on` baja de 4.5:1 | La regla anterior dejaba texto blanco en 4.4:1 sobre el hover de un azul medio | Moverse "hacia el centro" |
| 27 | `GInput`: campo completo (etiqueta, ayuda, error, iconos, contador) en un solo componente; tipos `text email password search tel url` | Decisión del usuario: sale accesible sin que el desarrollador conecte etiqueta, ayuda y error a mano | `GField` aparte; solo el control; todos los tipos nativos |
| 28 | `GInput` acepta `variant` `outline` (por defecto) y `soft`; `solid`, `ghost` y `link` no aplican a un campo | Decisión del usuario | Aceptar las cinco variantes de la API compartida |
