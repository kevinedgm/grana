# Sitio de documentación de Grana

Sitio estático con [VitePress](https://vitepress.dev) 1.6, en español (fuente) e inglés, publicado en GitHub Pages en cada push a `main` (`.github/workflows/docs.yml`): **https://kevinedgm.github.io/grana/**.

```bash
npm run docs:dev       # genera las páginas y abre el servidor de desarrollo (http://localhost:5173/grana/)
npm run docs:build     # genera y construye en site/.vitepress/dist (falla si hay un enlace interno roto)
npm run docs:preview   # sirve el build
npm test -w @grana/site               # prueba del generador
cd site && npx playwright test        # pruebas de navegador sobre el build (puerto 4219)
```

Los ejemplos vivos importan el **paquete construido** (`@grana/vue` → `packages/vue/dist/`): antes de `docs:dev` o `docs:build`, `npm run build -w @grana/vue`.

## Una sola fuente de verdad

Nada del contenido se escribe en `site/`: `site/scripts/generate.mjs` lo genera en `site/src/` (ignorado por git) en cada `docs:dev` y `docs:build`.

| Página | Fuente |
| --- | --- |
| Inicio | Preámbulo y «Qué es Grana» del `README.md` raíz (las viñetas `- **Título.** texto` del preámbulo son las tarjetas) |
| Empezar, Tematización, Accesibilidad, Personalidad, Proyecto | Secciones `##` del `README.md` raíz (plan en `GUIDE`, `generate.mjs`) |
| Componentes (índice y barra lateral) | «## Componentes» del `README.md` raíz: cada `###` es una categoría y cada enlace a un README de componente, una entrada |
| `@grana/cli` | `packages/cli/README.md` |
| Cambios | `CHANGELOG.md` |
| Una página por componente | `packages/vue/src/components/G<Nombre>/README.md` + sus `*.meta.json` (cabecera con etiqueta, estado, entrada y desde; importación; tabla de props, eventos, slots y métodos). Una carpeta con `meta.json` y sin README (`GTagGroup`) se suma a la página de su prefijo (`GTag`) |

Los enlaces se reescriben solos: a otro README de componente → su página; a una sección del README raíz → la página que la contiene (con el ancla de VitePress); a cualquier otro archivo del repositorio (`DECISIONS.md`, contratos, auditorías) → GitHub. El texto de los README va en `<div v-pre>`: `{{ }}` y etiquetas se muestran tal cual.

La prueba `site/scripts/generate.test.mjs` (en `npm test`) falla si un componente con README no genera su página en los dos idiomas, si no está en el índice del README raíz, si no tiene ejemplo vivo, si una sección `##` del README raíz no tiene página o si queda un enlace relativo sin resolver.

## Convención para mora-docs

### Ejemplo vivo en el README: ` ```vue demo `

Un bloque de código **de primer nivel** (sin sangría, fuera de listas y citas) con la información `vue demo` se pinta en vivo en el sitio, con los componentes reales y el tema por defecto, y debajo se muestra su código. En GitHub se ve como un bloque `vue` normal.

````md
```vue demo
<g-badge color="success" shape="circle">Activo</g-badge>
<g-badge :count="120" label="120 mensajes sin leer" variant="solid" color="danger" />
```
````

- **Solo plantilla** (como arriba): se envuelve en una fila que salta de línea; lo que es de bloque (`<hr>`, `<div>`, `<p>`, botones `block`…) ocupa la línea entera.
- **SFC completo** (`<script setup>` + `<template>`): para estado (`v-model`), datos o una entrada propia (`import { GCombobox } from '@grana/vue/combobox'`). Es lo preferible cuando el ejemplo tiene `v-model`.
- **Autónomo:** sin variables ni manejadores sin definir (`@click="guardar"` sin `guardar` es un aviso de Vue), sin `fetch`, sin imágenes de red, con todos los `labels` que el componente exige (Grana no trae textos por defecto). Si un bloque del README es ilustrativo y no se puede ejecutar tal cual, no se marca.
- **Iconos:** la lista de la librería y los que registra el sitio (`site/.vitepress/theme/icons.js`, como una aplicación con `createIcons`).
- **Disponible en el sitio sin importar:** todo `@grana/vue` y los plugins de `combobox`, `file-field`, `time-field`, `slider`, `tag`, `load-region`, `card-group`, `page-header`, `fab`, `form-fold`, `app-shell`, `hero`, `gallery` y `booking`. La voz (`speech`), la isla de estado (`status`) y `GToast` son servicios: el ejemplo crea el suyo (ver `site/demos/GSpeechHost.vue`, `GStatusIsland.vue`, `GToast.vue`).
- Puede haber varios por README; cada uno se pinta donde está.

Hoy lo llevan `GBtn` (iconos en los huecos), `GBadge`, `GTag` (grupo con huella) y `GDivider` (con texto).

**Respaldo:** si un README no marca ningún bloque, la página muestra `site/demos/G<Nombre>.vue` en una sección «Ejemplo» antes del texto. Al marcar un bloque en el README, el respaldo deja de usarse y se puede borrar. La prueba exige que cada componente tenga uno de los dos.

### Traducción: `README.en.md`

- Español es la fuente. La traducción va **al lado** del original: `G<Nombre>/README.en.md`, `README.en.md` (raíz), `CHANGELOG.en.md`, `packages/cli/README.en.md`.
- Sin traducción, la página inglesa muestra el español con el aviso **«Translation pending»** y el texto marcado con `lang="es"`. La interfaz del sitio (navegación, búsqueda, cabeceras de las tablas) ya está en inglés.
- `README.en.md` raíz: **las mismas secciones `##` en el mismo orden** que `README.md` (el plan de páginas las toma por posición) y las mismas viñetas del preámbulo.
- Los enlaces pueden apuntar al README español o al inglés (`../GIcon/README.md`): el generador los lleva a la página inglesa.
- Los bloques `vue demo` del README inglés se pintan en la página inglesa; si no tiene ninguno, se usa el respaldo de `site/demos/`.
- Las tablas de API salen de los `meta.json` (en español) en los dos idiomas.

## Tema: el sitio vestido con Grana

- `site/.vitepress/theme/grana-site.css` (sin capa, como el tema de una aplicación) hace que las variables de VitePress lean los tokens `--g-*` del tema por defecto. `data-theme` sigue a la apariencia de VitePress (script del `<head>` y `Layout.vue`), así que el sitio y los ejemplos cambian juntos de claro a oscuro.
- **Capas (DECISIONS #516):** todo el CSS de VitePress va en la capa `vitepress`, declarada antes que las de Grana (`theme/layers.css`, `postcss-layer.mjs`), para que sus reinicios de elemento no ganen a los componentes. Además, los ejemplos van en `.vp-raw` (`postcssIsolateStyles`).
- **Solo Lucide:** los iconos del tema de VitePress se regeneran desde `lucide-static` (`src/.lucide.css`), incluida la hamburguesa (`menu`/`x`, en lugar de rayas dibujadas con CSS).
- Accesibilidad: foco con `--g-color-focus`, interruptor de apariencia de 24 px, ≥ 44 px con puntero grueso, contraste medido en `site/tests/site.spec.mjs`.
