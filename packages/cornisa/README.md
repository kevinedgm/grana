# cornisa

Superficie de actividad **no modal** que **nace del borde superior** del navegador como una gota: avisos breves, progreso, temporizadores, controles multimedia y acciones contextuales. Sin framework y con **0 dependencias en runtime**.

> **Estado: `0.2.0-alpha.0` (candidate en el registro del Design Hub), sin publicar** (`"private": true`). Licencia **MIT** ([LICENSE](LICENSE)). Ver [Criterios de publicación](docs/criterios-de-publicacion.md).

## Dentro del monorepo de Grana
Cornisa vive en `packages/cornisa/` como **paquete independiente** del workspace (nombre `cornisa`, `private`). No depende de `@grana/vue` ni de Vue, y **no sigue las reglas de los componentes de Grana**: usa sus propios tokens `--cornisa-*` (no `--g-*`), su propio CSS sin las capas `grana.*` y sus iconos SVG propios (no Lucide). La historia de diseño (rondas r01 a r03, decisiones, intake y QA del prototipo) está en `design/lab/cornisa/`; las capturas y vídeos de evidencia no se copiaron al repo.

- `npm test` (también desde la raíz) corre solo el núcleo (`node:test`); las pruebas de navegador van aparte con `npm run test:all` o `npm run test:browser` (Playwright, siete proyectos).
- `npm run build` genera `dist/` (ignorado por git, como en el resto del monorepo) y regenera los ejemplos de `examples/cdn/`.
- Se solapa en propósito con la isla de estado de Grana (`GStatusIsland`, `@grana/vue/status`): las dos son una superficie de actividad que nace del borde superior. Esta incorporación no decide cuál manda ni las une.

## Qué la diferencia
- **Una sola superficie viva**: `update()` cambia la misma instancia sin destruirla. Las demás actividades esperan en cola y se muestran como «+N».
- **Movimiento «Top-Edge Droplet»**: la silueta es un path SVG anclado al borde y movido por muelles interrumpibles. El texto nunca se deforma.
- **Accesibilidad para contenido que cambia**: los anuncios tienen frecuencia limitada, el progreso solo se anuncia en hitos del 25 % y la isla nunca roba el foco.
- **Núcleo sin DOM** (`cornisa/core`), que se puede probar en Node.

## Uso
```html
<link rel="stylesheet" href="cornisa/src/cornisa.css">
<script type="module">
  import { createIsland } from 'cornisa';
  const island = createIsland({ labels: { close: 'Cerrar', more: (n) => `Mostrar la siguiente (${n} en espera)` } });

  island.show({ title: 'Cambios guardados', intent: 'success' });

  const up = island.show({ title: 'Subiendo informe.pdf', progress: 0, duration: 'persistent' });
  up.update({ progress: 40 });
  up.update({ title: 'Informe subido', intent: 'success', progress: null, duration: 5000,
              actions: [{ label: 'Abrir', onSelect: (h) => { abrir(); h.dismiss(); } }] });

  island.promise(fetch('/api/export'), { loading: 'Exportando', success: 'Exportación lista', error: 'No se pudo exportar' });
</script>
```

## Uso desde CDN
> **Todavía no funciona desde el CDN:** `cornisa` no está publicado en npm, así que estas URLs dan 404 (comprobado el 2026-10-26). Funcionarán sin cambios en cuanto se publique `0.2.0-alpha.0`. Hay ejemplos listos en [`examples/cdn/`](examples/cdn/index.html) que, mientras tanto, usan la copia local y lo indican en pantalla.

**Script clásico** (`window.Cornisa`), con integridad (SRI):
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/cornisa@0.2.0-alpha.0/dist/cornisa.min.css"
      integrity="(ver dist/sri.json)" crossorigin="anonymous">
<script src="https://cdn.jsdelivr.net/npm/cornisa@0.2.0-alpha.0/dist/cornisa.iife.min.js"
        integrity="(ver dist/sri.json)" crossorigin="anonymous"></script>
<script>
  const island = Cornisa.createIsland();
  island.show({ title: 'Cambios guardados', intent: 'success' });
</script>
```
**Módulo ESM:** `import { createIsland } from 'https://cdn.jsdelivr.net/npm/cornisa@0.2.0-alpha.0/dist/cornisa.esm.min.js'`.
**Import map:** `{ "imports": { "cornisa": "https://cdn.jsdelivr.net/npm/cornisa@0.2.0-alpha.0/dist/cornisa.esm.min.js" } }` (los import maps exigen Chrome/Edge 89, Firefox 108, Safari 16.4).
unpkg también vale: `https://unpkg.com/cornisa@0.2.0-alpha.0/dist/…`.

**Mensajes de consola esperados mientras no esté publicado:** jsDelivr responde 404 con `text/plain`, así que el navegador muestra «Refused to apply style… MIME type ('text/plain')» y «Refused to execute script… MIME type». Es el CDN diciendo que la versión no existe; los ejemplos pasan al respaldo local.
**Abrir los ejemplos con doble clic (`file://`):** funcionan, pero los ejemplos de módulos (02 y 03) no pueden cargar módulos ES desde `file://` (lo bloquea el navegador) y usan el script clásico, avisándolo en pantalla. Para probar los módulos de verdad, sirve la carpeta por HTTP: `python3 -m http.server` o `npx serve`.

| Archivo de `dist/` | Uso | Tamaño (gzip) |
|---|---|---|
| `cornisa.iife.min.js` | `<script>` → `window.Cornisa` | ≈ 9,9 KiB |
| `cornisa.esm.min.js` | módulo / import map | ≈ 9,7 KiB |
| `cornisa.min.css` | estilos neutros | ≈ 1,8 KiB |
| `sri.json` | hashes SRI sha384 de la versión | — |

Los hashes SRI de `dist/sri.json` y de `examples/cdn/01-script-clasico.html` se regeneran con `npm run build` y **solo valen si el CDN sirve exactamente esos bytes**: hay que revisarlos en cada release.

## API
| Llamada | Descripción |
|---|---|
| `createIsland({ container?, labels?, announceGap?, shortcut? })` | Una por documento. Crea las regiones vivas desde el principio. `shortcut` (p. ej. `'Alt+Shift+N'`) está desactivado por defecto |
| `island.show(options) → handle` | Encola y muestra. Si llega un `id` existente, equivale a `update()` |
| `island.get(id)` · `island.dismissAll()` · `island.destroy()` | `destroy()` quita nodos, listeners, temporizadores y `--cornisa-reserved` |
| `island.promise(p, { loading, success?, error? })` | Una sola instancia: cargando → resultado. Devuelve `p` sin modificarla |
| `island.on('reservedchange' \| 'error', fn) → off` | `reservedchange`: `{ height }` en px (alto en reposo, o 0 si no hay gota) |
| `handle.update(patch)` | `null` borra un campo opcional. Devuelve `false` si ya se está descartando |
| `handle.expand()` · `handle.collapse()` | Si la actividad está en cola, se guarda la intención para cuando se muestre |
| `handle.dismiss(reason?) → Promise` | Se resuelve cuando la gota termina de retirarse |
| `handle.state` · `handle.on('statechange' \| 'action' \| 'dismiss', fn)` | Estados: `queued · entering · compact · expanded · dismissing · removed` |

**Opciones:** `title` (obligatorio) · `body` · `intent: neutral|success|warning|error` · `icon: Node` (se clona; **no** acepta cadenas HTML) · `progress: 0–100 | 'indeterminate' | null` · `timer: { endsAt }` · `actions` (máx. 2) · `duration: ms | 'persistent'` (por defecto 5000; los errores son persistentes) · `priority: low|normal|high`.

**A propósito no hay** props de color, radio ni posición: se personaliza con tokens CSS. Tampoco se acepta HTML como cadena.

### Comportamiento
- **Una visible + cola.** `high` desplaza a la visible, salvo que esté expandida o tenga el foco dentro. El botón «+N» pasa a la siguiente.
- **Temporizador:** solo corre en compacto, con la pestaña visible y sin hover ni foco dentro. Las actividades en cola no consumen tiempo.
- **Acción rápida:** la **primera** acción también aparece en la fila compacta, así que se puede usar sin expandir. En expandido se oculta y todas las acciones viven en el detalle (nunca se duplican). Si no cabe todo, se recorta el título, nunca la acción.
- **Las acciones no descartan automáticamente**: llama a `h.dismiss()` en `onSelect` si lo necesitas.
- **Atajo opcional** (`shortcut`): debe incluir Alt, Ctrl o Meta (WCAG 2.1.4). Lleva el foco al conmutador de la isla y, pulsado otra vez, lo devuelve al elemento previo. Sin actividad visible no intercepta la tecla. Se expone con `aria-keyshortcuts`.
- **Pantallas bajas:** el expandido nunca supera el alto del viewport; el detalle se desplaza dentro.

### Tokens (`:root`)
`--cornisa-bg` `--cornisa-fg` `--cornisa-muted` `--cornisa-track` `--cornisa-focus` `--cornisa-max-width` (400px) `--cornisa-radius-expanded` (24px) `--cornisa-z` (solo sin Popover API) `--cornisa-safe-top` (`env(safe-area-inset-top)`) `--cornisa-font`.
De solo lectura: `--cornisa-reserved`. Ejemplo: `:root { scroll-padding-top: var(--cornisa-reserved, 0px) }`.

### Etiquetas por defecto
En inglés: `close: 'Close'`, `more: (n) => \`Show next notification (${n} waiting)\``. Para traducirlas, pasa `labels` a `createIsland()`.

### `island._internals`: INESTABLE
Propiedad no enumerable con `{ manager, renderer }` para pruebas y depuración (por ejemplo `renderer.running`, `renderer.usesPopover` o `renderer._debug()`). **No forma parte del contrato semver:** puede cambiar o desaparecer en cualquier versión, incluidas las de parche. No la uses en código de producción.

### Núcleo sin DOM
```js
import { createManager, Drop, silhouette } from 'cornisa/core';
const m = createManager({ clock }); // reloj inyectable para tests deterministas
```

## Accesibilidad (objetivo: WCAG 2.2 AA)
Es una superficie no modal: no mueve el foco ni usa `inert` o `aria-modal`. Expandir es un *disclosure* (`aria-expanded`). Esc contrae. Si el foco o un clic salen de la isla, el expandido se contrae (2.4.11). Al descartar con el foco dentro, el foco vuelve al disparador. Las regiones `status`/`alert` son persistentes. Los targets miden al menos 44 px. Con `prefers-reduced-motion`, solo hay fundido. En `forced-colors` se usan colores del sistema.

**Verificado automáticamente** (ver más abajo): teclado, foco, ARIA, axe-core sin violaciones (WCAG 2.x A/AA), atajo con modificador y texto al 200 % (aproximado, incluido en pantalla baja de 844×390).
**No verificado:** lectores de pantalla reales (VoiceOver, NVDA, JAWS, TalkBack), forced-colors en navegador y zoom nativo.

## Compatibilidad
Suelo declarado para **`dist/`** (la entrada del paquete y del CDN, transpilada con esbuild): Chrome/Edge ≥ 84 · Firefox ≥ 69 · Safari/iOS ≥ 14. Se ha comprobado mediante **análisis estático** de todas las APIs, la sintaxis y el CSS usados, contra `@mdn/browser-compat-data` 8.1.7. **No se ha probado en esas versiones.**
`src/` (ESM sin transpilar, subruta `cornisa/source`) usa `?.` y `??`: exige **Firefox ≥ 74**.
Mejora progresiva por debajo de esas versiones: `forced-colors`, `:focus-visible` (con respaldo `:focus`), el `gap` en flex (Safari 14.0), `contain`, `overscroll-behavior`, `preventScroll` (Safari < 15) y `::selection` en iOS.
Probado: Chromium 156 (en 1440/834/393/320 px), Firefox 157 y WebKit 27.2 (perfiles iPhone 15 y escritorio), todos en las builds de Playwright 1.64.1. **No** son Safari, Edge ni dispositivos reales.
Si existe Popover API, la isla usa `popover="manual"` y se ve por encima de un `<dialog>` modal abierto antes. **Mientras haya un modal abierto, la isla es inerte**, como el resto de la página. Sin Popover API se usa `position: fixed` + `--cornisa-z`.

## Seguridad
El contenido se inserta con `textContent` y los iconos son `Node` clonados. Funciona con una CSP estricta (`script-src 'self'; style-src 'self'`) sin violaciones (verificado). No hace peticiones de red ni usa almacenamiento o telemetría, y no tiene código condicional por dominio o idioma.

## Desarrollo
```bash
npm test              # núcleo (node:test) + navegador (Playwright)
npm run typecheck     # tsc sobre JS + JSDoc + tipos públicos
npm run size          # tamaño gzip/brotli
npm run build         # dist/ (esm, iife, css, minificados, sri.json) + regenera examples/cdn/01–03
npm run serve         # http://localhost:4500/examples/  ·  /examples/cdn/
```
Últimos resultados registrados (2026-10-26): núcleo 21/21 · navegador 259/259 (37 pruebas × 7 proyectos, incluidas las de los ejemplos CDN) · tsc 0 errores · JS 13,5 KiB gzip sin minificar · CSS 2,0 KiB gzip.
