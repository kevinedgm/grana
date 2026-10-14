# Contrato · GDocumentPreview (visor de documentos)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md **#638 a #649**, 2026-10-14; cambios en archivos compartidos aplicados en `api.md` «Entradas propias que no son servicios», «Paquete, entradas y tipos», «Acciones con acuse» (nueva) y el mapa de huecos; `tokens.md` §29.1, §29.5, §29.6 y §46; `icons.md` v0.12; `file-field.md` «Entrega y empaquetado») · **Basado en:** `design/lab/document-preview/r01/` (kiwi: `brief.md`, `declaracion.md` con la auditoría, la base funcional, los conceptos A, B y C y los hallazgos L1 a L15; `index.html`, `doc.js`, `doc.css`, `verificar.mjs` 135/135 en Chromium, Firefox y WebKit, puerto 4219; la forma elegida se ve con el concepto A)
**Tag:** `g-document-preview` · **Categoría:** contenido y archivos · **Paquete:** entrada propia **`@grana/vue/document-preview`** (global UMD `GranaDocumentPreview`) y adaptador de pdf.js en **`@grana/vue/document-preview/pdfjs`** (global UMD `GranaDocumentPreviewPdfjs`), #638

**Componente complejo** (compone `GBtn`, `GMenu`, `GDialog`, `GEmpty`, `GSummary`, `GProgress`, `GInput` y `GTooltip`; tiene teclado compuesto propio —lomo, miniaturas, escenario—; abre una profundidad sobre la página; lleva un motor de carga y de estado): **coco y bruno en Opus** (regla de `CLAUDE.md`).

Un visor para **ver, recorrer y usar** un archivo dentro de la aplicación: el contrato de un expediente, el plano de una obra, la receta escaneada. Foco en **PDF e imágenes**; lo demás se presenta como ficha sin vista previa con lo que se puede hacer con él. Grana **no hace red** ni trae un motor de PDF: la aplicación elige los renderizadores.

**Decisiones del usuario (2026-10-14), firmes:**

1. **Forma por defecto: A «Lomo».** Sin barra arriba: el documento empieza en el borde. Al inicio un **lomo** con una muesca por página y una **marca con el número** de la actual; al pasar o recorrerlo, **asoma la página** destino. Abajo, un **sello** une **quién es** (nombre y datos) y **qué hacer** (acciones). **B «Crece desde la ficha»** queda como `appearance="card"` posterior (reservada, sin especificar a fondo) y **C «La frase»**, como `appearance="phrase"` (reservada).
2. **Enviar por correo:** en v1 el componente **solo emite la intención**; el diálogo de destinatarios, asunto y mensaje es de la aplicación. **Nunca** muestra éxito sin la confirmación del anfitrión (acuse honesto).
3. **pdf.js por adaptador** en una entrada aparte, instalado por la aplicación y **sin empaquetarse** en Grana; el componente, en su entrada propia (#550, #506).

---

## Principios

1. **La interfaz enseña lo que el renderizador declara.** Sin paginación en una imagen ni zoom propio sobre el visor nativo: cada herramienta aparece solo si el renderizador la declara en `capabilities` (#640).
2. **Sin red en Grana** (`AGENTS.md`): las URL las pide el navegador (`<img>`, `<iframe>`) o el renderizador de la aplicación (pdf.js con sus cabeceras). Ningún `fetch` en el componente ni en sus entradas.
3. **Nada del archivo entra al DOM como HTML** (#641): imagen en `<img>`, PDF en lienzo o en el visor del navegador; ni `innerHTML` ni plantillas con datos del documento.
4. **Acuse honesto** (#643): «hecho» solo cuando el navegador o la aplicación lo confirman; nunca «Descargado» ni «Impreso» (el navegador no lo dice).
5. **Un estado, varias profundidades** (#646): en línea, diálogo y pantalla completa comparten documento cargado, página, zoom, giro y miniaturas; ampliar no vuelve a pedir el archivo.
6. **El foco no se roba ni se pierde** (#534): cambiar de página o de zoom deja el foco en la herramienta; lo sustituido devuelve el foco a la raíz con nombre.
7. **Ocultar un botón no protege nada:** el servidor niega la URL; el visor nunca recibe lo que la persona no puede ver.
8. **Sin textos propios** (#226): todo en `labels`, sin valores por defecto.

## Qué lo hace distinto (personalidad, #639)

| | Qué hace | Por qué sirve |
| --- | --- | --- |
| **La navegación es el lomo, no un número** | Una muesca por página y la marca con la actual: la posición en el todo **se ve**; saltar es pulsar o arrastrar por el documento | En un expediente de 80 páginas, «voy por el último tercio» se ve sin leer cifras |
| **La página asoma antes de ir** | Al recorrer el lomo con el puntero o el teclado, una miniatura de la página destino sale junto a la marca | Menos saltos de prueba y error |
| **Identidad y acciones juntas** | El sello responde «qué es esto» y «qué hago con esto» en un sitio; el acuse de una acción **ocupa el lugar de los datos**, sin cajas nuevas | Una sola mirada; nada se mueve bajo el puntero |
| **Nunca dice «hecho» sin confirmación** | Descargar dice «Descargando», imprimir no dice nada, enviar dice lo que la aplicación confirma | Nadie cree enviado un contrato que no salió |
| **Movimiento** | La marca **llega** a la página en los saltos explícitos con `--g-ease-spring` (octavo uso, #639); la página que asoma sigue al puntero con `--g-ease-out` | Con movimiento reducido, todo aparece en su sitio |

## Cuándo usarlo (fronteras)

| Necesito | Uso | No |
| --- | --- | --- |
| Leer, recorrer, descargar, imprimir o compartir un archivo | **`GDocumentPreview`** | Un `<iframe>` suelto (sin estados, sin acuses, sin teclado) |
| Adjuntar archivos a un formulario | `GFileField` | El visor no sube nada |
| Abrir el visor desde una ficha de `GFileField` | **Punto de integración pendiente** (§«Relación con `GFileField`», #649) | — |
| Galería de fotos para **comprobar** al subir | `GFileField appearance="gallery"` (reservado, #378) | El visor es para leer y usar |
| El archivo como ficha que se abre (gestores, paneles con muchos documentos) | `appearance="card"` (B, **reservada**) | Hoy: `GDocumentPreview` dentro de la ficha propia de la aplicación con `actions.expand` |
| Un visor dentro de un `GDialog` de la aplicación | `GDocumentPreview` con `actions: { expand: false }` | Abrir la profundidad de diálogo dentro de otro diálogo |
| Resultado de una acción («Enlace copiado») | El **acuse** del sello (§«Acciones») | `GToast` (un aviso flotante es decisión de la aplicación, no del visor) |
| Lo que afecta a la página y dura («Sin conexión») | La isla de estado de la aplicación | El visor solo marca sus acciones no disponibles |
| Superficie o tarjeta alrededor | Nada: la raíz con `variant="panel"` ya es su superficie | `GCard` o `GSurface` envolviendo (cajas dentro de cajas, #44) |

---

## Entrega y empaquetado (#638)

```js
import DocumentPreview, { GDocumentPreview, defaultRenderers, documentRenderersKey } from '@grana/vue/document-preview'
import { createPdfjsRenderer } from '@grana/vue/document-preview/pdfjs'
import * as pdfjs from 'pdfjs-dist'                       // la instala la aplicación

app.use(DocumentPreview)                                   // registra <g-document-preview>
app.provide(documentRenderersKey, [
  createPdfjsRenderer(pdfjs, { workerSrc: new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href }),
  ...defaultRenderers,
])
```

- **`@grana/vue/document-preview`** (`dist/document-preview.js` y `.umd.js`, global **`GranaDocumentPreview`**, requiere `Vue` y `Grana`). Exporta `GDocumentPreview`, `createImageRenderer`, `createNativePdfRenderer`, `defaultRenderers` (arreglo congelado con los dos anteriores, opciones por defecto), `documentRenderersKey` (`InjectionKey`) y, por defecto, un plugin que solo registra el componente (sin opciones, #200). `@grana/vue` no lo exporta ni lo registra.
- **`@grana/vue/document-preview/pdfjs`** (global **`GranaDocumentPreviewPdfjs`**): exporta `createPdfjsRenderer(pdfjs, options)` y nada más. **No importa `pdfjs-dist`**: recibe el módulo de la aplicación. `pdfjs-dist` es **dependencia par opcional** (`peerDependencies` + `peerDependenciesMeta.optional`) con el rango de las versiones mayores que bruno pruebe; la versión, la CSP del *worker* y las actualizaciones de seguridad son de la aplicación.
- **Lo compartido llega por `__shared`** (#240), sin copias: `GBtn`, `GMenu`, `GDialog`, `GEmpty`, `GSummary`, `GProgress`, `GInput`, `GTooltip`, `GLibIcon`, `utils/loadPhase.js` (`createLoadPhase`, `rememberFocus`, `restoreFocus`), `utils/liveRegion.js` (`announcePage`), `utils/topModal.js`, `utils/sizeObserver.js`, `utils/keyFocus.js` si lo usa, `utils/anchor.js` (`isPhone`), `utils/template.js`, `utils/oneOf.js`, la clave `formKey` (para aislar, §«Contraseña») y **`formatFileSize`** (que pasa al principal, #647).
- **El CSS sigue en `grana.css`** (`GDocumentPreview.css`, registrado en `components.css`).
- **Pruebas:** `@grana/vue/testing` gana **`createSimulatedRenderer(options)`** (el PDF simulado de kiwi: páginas, progreso, contraseña, fallos por `kind`, lento, colgado; sin red). Sus opciones las fija bruno en el `meta.json`; no son contrato del renderizador.
- **Peso:** bruno mide y registra (KiB gzip, #550) las dos entradas en el `meta.json`, `CHANGELOG.md` y `CLAUDE.md`. Presupuestos: **`document-preview` ≤ 20 KiB** gzip (kiwi estima > 8 KB), **`document-preview/pdfjs` ≤ 4 KiB**. Por encima, vuelve a lima. **Crecimiento del principal** (iconos y `formatFileSize`, #647): **≤ 1 KiB** gzip; por encima, vuelve a lima (alternativa: mapa de iconos propio de la entrada).
- Se declara en **`exports`** (`./document-preview` y `./document-preview/pdfjs`, con `types`, `import` y `default`), **`typesVersions`**, **`ENTRIES`** de `scripts/build-types.mjs` y **`src/types.test.js`** (#442, #443).
- **Compuertas de `dist`** (bruno, `gates.sh`): `grep -q "g-document-preview__spine" packages/vue/dist/grana.css`, `! grep -q "GDocumentPreview" packages/vue/dist/grana.js`, `test -f` de las dos entradas, `! grep -q "pdfjs-dist" packages/vue/dist/document-preview.js` (tampoco en la del adaptador ni en `grana.js`), `! grep -q "fetch(" ` sobre las dos entradas y `! grep -q "g-summary__" packages/vue/dist/document-preview.js` (la ficha llega por `__shared`).

---

## Uso

```vue
<GDocumentPreview
  :source="{ key: doc.id, src: doc.url, name: doc.nombre, type: doc.mime, size: doc.bytes, modified: doc.fecha, link: doc.enlace }"
  v-model:page="pagina"
  :actions="{ email: true, share: puedeCompartir ? undefined : 'Solo el titular puede compartirlo' }"
  :labels="textos"
  @action="onAction"
/>
```

```js
// Enviar por correo: la intención llega; el diálogo es de la aplicación; el acuse, también.
function onAction (e) {
  if (e.action !== 'email') return
  abrirDialogoDeCorreo(e.source, {
    onSend: (datos) => e.waitUntil(api.enviar(datos).then((r) => `Enviado a ${r.destinatario}`)),
    onCancel: () => e.cancel(),
  })
}
```

## Anatomía (A · Lomo)

```
section.g-document-preview  aria-label="{labels.region}"            ← con landmark=false: div role="group" con el mismo nombre
├─ div.g-document-preview__body
│  ├─ div.__spine  role="group" aria-label="{labels.navigation}"     (solo si tiene controles)
│  │  ├─ GBtn.__thumbs-toggle  icon tooltip="{labels.thumbnails}" aria-pressed      (capabilities.thumbnails y pageCount > 1)
│  │  ├─ div.__rail  role="slider" aria-orientation="vertical" tabindex="0"           (capabilities.pages y pageCount > 1, miniaturas cerradas)
│  │  │     aria-label="{labels.page}" aria-valuemin=1 aria-valuemax=N aria-valuenow=n aria-valuetext="{labels.pageOf}"
│  │  │  ├─ span.__tick × N  aria-hidden          (sin muescas sueltas con is-dense)
│  │  │  ├─ span.__mark      aria-hidden          (el número de la actual, o lo tecleado)
│  │  │  └─ span.__peek      aria-hidden          (miniatura de la página destino + «Página n de N»)
│  │  ├─ nav.__thumbs  aria-label="{labels.pages}"                                   (miniaturas abiertas: sustituye al riel)
│  │  │  └─ ol tabindex="-1" > li > button.__thumb aria-current="page"? (nombre {labels.pageOf}; texto visible «n»)
│  │  └─ div.__zoom  role="toolbar" aria-orientation="vertical" aria-label="{labels.zoom}"   (capabilities.zoom)
│  │     ├─ GBtn  icon tooltip="{labels.zoomIn}"
│  │     ├─ GMenu  (disparador: botón con nombre «{labels.zoom}: {valor}»; grupo de opciones radio)
│  │     └─ GBtn  icon tooltip="{labels.zoomOut}"
│  ├─ div.__stage  role="document" tabindex="0" aria-label="{labels.region}" aria-describedby="{id}-status" aria-busy?
│  │  ├─ div.__pages > div.__page role="img" aria-label="{labels.pageOf}" > canvas aria-hidden       (lienzo)
│  │  │               o > img.__image alt=""                                                      (imagen o páginas como imagen)
│  │  ├─ iframe.__frame  title="{labels.region}"                                                  (visor PDF nativo)
│  │  ├─ div.__mold  aria-hidden (molde de la página que llega) · GProgress · div.__long (texto + «Cancelar»)
│  │  └─ GEmpty / div.__password                                                                 (estados sin vista)
│  └─ div.__seal  role="toolbar" aria-label="{labels.actions}"
│     ├─ GSummary  layout="inline" (icono del tipo, nombre, datos)  ·  span.__receipt (acuse, en el sitio de los datos)
│     └─ div.__actions:  GBtn Descargar · GBtn Imprimir · GMenu «Más acciones» · GBtn Ampliar | Pantalla completa
├─ div.__meta  id="{id}-meta"  (Detalles: GSummary layout="stack"; solo abierto)
├─ span.__status  id="{id}-status" (oculto: «Página 3 de 12. Ajustado al ancho.» y, si no hay texto, labels.noText)
└─ GDialog.__dialog  (profundidad de diálogo y pantalla completa; dentro de la raíz, sin Teleport)
   └─ div.g-document-preview__body.is-in-dialog  (el mismo lomo, escenario y sello sobre el mismo estado)
```

- **Orden del DOM = lectura = Tab:** lomo (miniaturas, página, zoom) → documento → sello (identidad y acciones) → detalles. Ni `order` ni `grid-area` que reordenen. El sello flota abajo **visualmente** sin salir de su sitio en el DOM.
- **Paradas de Tab** (en línea, PDF de varias páginas): conmutador de miniaturas · lomo (o la lista de miniaturas) · barra de zoom · escenario · sello. Imagen: barra de zoom · escenario · sello. Visor nativo: escenario (el `iframe`) · sello.
- **El lomo no es una barra de herramientas** (#644): mezclar un `slider` vertical con el foco itinerante vertical de una barra deja las flechas con dos dueños (APG *Toolbar*: evitar controles que usen las flechas de la barra). Son tres paradas: el conmutador, el riel y la barra de zoom (tres botones, ↑/↓ entre ellos).
- **Sin documento** (`idle`) no se pinta nada salvo la raíz con su nombre (`labels.region` sin `name`, o la región se omite: aviso 1).

## Props (#638, #641, #643, #646, #648)

| Prop | Tipo | Valores | Default | Nota |
| --- | --- | --- | --- | --- |
| `source` | Object \| null | ver «La fuente» | `null` | El archivo. Cambiarlo aborta la carga anterior |
| `renderers` | Array | renderizadores (§«Renderizadores») | sin valor → inyectado por `documentRenderersKey` → `defaultRenderers` | El primero cuyo `accepts` devuelve `true` gana; no se mezclan listas (como `iconsKey`, #200) |
| `page` | Number | entero ≥ 1 | `undefined` (sin `v-model`, el componente la guarda) | `v-model:page`. 1 = primera |
| `zoom` | String \| Number | `fit-width` `fit-page` o escala (1 = 100 %) | `undefined` → el `fit` del renderizador | `v-model:zoom`. Un número se acota a [0,25; 4] |
| `rotation` | Number | `0` `90` `180` `270` | `undefined` → `0` | `v-model:rotation`; giro a la derecha |
| `depth` | String | `inline` `dialog` `fullscreen` | `inline` | `v-model:depth`. Profundidad actual (§«Profundidades») |
| `appearance` | String | `spine` | `spine` | `card` (B) y `phrase` (C) **reservados**: avisan y se usa `spine` (aviso 5) |
| `variant` | String | `embedded` `panel` | `embedded` | Forma de la superficie (como `GSidebar`, fuera de la lista compartida): `embedded` sin superficie propia; `panel`, delimitada (borde y radio) |
| `height` | String | longitud CSS | sin valor (alto por defecto de coco) | Alto del cuerpo (lomo, escenario y sello) en línea; variable en línea `--_height` (como `maxHeight` de `GTable`). En el diálogo, el que dé la carcasa |
| `maxSize` | Number | bytes, > 0 | sin valor (sin límite) | Por encima de `source.size`: estado `too-large` sin pedir nada (nombre de `GFileField`) |
| `actions` | Object | ver «Acciones» | `{}` (función) | Disponibilidad de cada acción y herramienta |
| `customActions` | Array | `{ id, label, icon?, disabled? }` | `[]` (función) | Acciones de la aplicación en «Más acciones» (§«Acciones») |
| `facts` | Array | datos de `GSummary` (`label`, `value`, `priority`…) | `[]` (función) | Datos de la aplicación que se añaden a los del archivo en «Detalles» |
| `landmark` | Boolean | | `true` | `false`: la raíz es `div role="group"` con el mismo nombre (listas con varios visores: sin proliferar regiones, L6) |
| `locale` | String | etiqueta BCP 47 | sin valor (cadena de `GNumberField`) | Cifras, porcentajes, tamaños y fechas (`api.md`) |
| `labels` | Object | ver «Textos» | `{}` | Sin valores por defecto (#226) |
| `id` | String | | generado (SSR-seguro) | Base de ids internos |

**No existen** (y por qué): `tools` (lo que se ve lo deciden `capabilities` y `actions`); `expandable` (es `actions.expand: false`, un solo mecanismo); `src`/`file`/`name` sueltos (van en `source`); `size`, `density` (las herramientas son `GBtn size="sm"` y la diana es de los mínimos); `color`; `fullscreen` (es `depth="fullscreen"`); `text`, `search`, `links` (capacidades reservadas, #640); `password` (lo escribe la persona en el sitio, nunca la aplicación); `layout="flow"` (flujo de página, reservado, #648).

### Reglas de props

- **`page`, `zoom`, `rotation` con o sin `v-model`:** con valor (controlado), la aplicación manda y el componente emite `update:*`; sin valor (`undefined`), el componente guarda el suyo y lo emite igual. Una `page` fuera de `[1, pageCount]` se acota al cargar (aviso 10). Cambiar `page` desde fuera coloca el escenario en esa página **sin anuncio** (la aplicación lo cambió; anunciarlo es suyo).
- **Cambio de `source`** (identidad = `source.key` si existe; si no, `src` y `file`; **no** por cambios internos del objeto ni por un objeto nuevo con la misma identidad: lección de bd888df, fuentes separadas y nunca un getter que devuelva un arreglo nuevo): aborta la carga anterior (`signal`), revoca su URL de objeto, destruye el documento (`destroy`), cierra miniaturas y detalles y retira el acuse; **página:** la controlada se conserva si cabe tras cargar (permite reanudar: la aplicación pone `source` y `page` juntos), la no controlada vuelve a 1; **zoom:** el controlado se conserva, el no controlado vuelve al `fit` del renderizador; **giro:** vuelve a 0 (emite `update:rotation` si cambia).
- **`zoom` numérico:** escala sobre el 100 % del renderizador (PDF: 96/72 px por punto, como pdf.js; imagen: un píxel por píxel). Acercar y alejar recorren los pasos `ZOOM_STEPS` (constante de JS: 0,25 · 0,5 · 0,75 · 1 · 1,25 · 1,5 · 2 · 3 · 4); desde un ajuste, el paso siguiente parte de la escala efectiva.
- **`rotation`:** solo múltiplos de 90 (otro valor: aviso 10 y se redondea al múltiplo más cercano).
- **`actions` y `customActions`:** §«Acciones».
- **`maxSize`:** con `source.size` desconocido no se comprueba (el renderizador puede rechazar).
- **Atributos** (`class`, `style`, `data-*`, `aria-*` no declarados) van a la raíz. `aria-label` del consumidor **sustituye** a `labels.region`.

## La fuente (`source`, #641)

```ts
type DocumentSource = {
  key?: string | number      // identidad estable (recomendada)
  src?: string               // URL: http(s), relativa o blob:
  file?: Blob | File         // bytes en la mano; gana a src para pintar, descargar y compartir
  name: string               // obligatorio (lo que se ve y el nombre de la descarga)
  type: string               // obligatorio: MIME DECLARADO y validado por la aplicación en su servidor
  typeLabel?: string         // nombre del tipo para la persona («Contrato en PDF»); sin él, la extensión del nombre en mayúsculas, solo para mostrar
  size?: number              // bytes (sin él, file.size)
  modified?: string | number | Date
  pages?: number             // dato de la aplicación para la ficha antes de cargar; no se usa para navegar
  link?: string              // enlace para compartir y copiar (la página del documento en la aplicación)
}
```

- **El tipo lo declara la aplicación** (MIME que validó en su servidor); **nunca** se deduce de la extensión ni de los bytes. Un `File` elegido por la persona trae un `type` que el navegador deduce de la extensión: si la aplicación lo pasa como `type`, es su decisión (el contenido acaba en `<img>` o lienzo, sin ejecución). Sin `name` o sin `type`: estado `unsupported` y aviso 1.
- **Esquemas admitidos en `src`:** `https:`, `http:`, relativo (se resuelve contra el documento) y `blob:`. Cualquier otro (`javascript:`, `data:`, `file:`…): estado `error` con `kind: 'unknown'` y aviso 2. Las `data:` de imagen se pasan como `file` (un `Blob`).
- **URL de objeto propia:** con `file`, el componente crea **una** URL de objeto, la da a los renderizadores y a las acciones, y la **revoca** al cambiar de fuente y al desmontar (como `GFileField`). Una pestaña ya abierta con ella sigue mostrando el archivo.
- **«Mismo origen»** = el origen de la URL resuelta es el del documento, o es la URL de objeto propia. Las acciones por defecto lo exigen donde el navegador lo exige (§«Acciones»).

## Renderizadores (#640)

**Grana define la interfaz; la aplicación elige.** Un renderizador es un objeto sin estado (se comparte entre instancias); cada carga devuelve un documento.

```ts
interface DocumentRenderer {
  id: string
  accepts(source: DocumentSource): boolean          // por source.type (el declarado), nunca por la extensión
  fit?: 'fit-width' | 'fit-page'                    // ajuste inicial (por defecto 'fit-width')
  capabilities: {
    pages?: boolean        // varias páginas navegables (lomo, miniaturas si además thumbnails)
    zoom?: boolean
    thumbnails?: boolean
    rotate?: boolean
    progress?: boolean     // llama a progress() durante la carga
    password?: boolean     // puede pedir contraseña
    print?: 'original' | 'image' | false   // cómo se imprime por defecto (§«Acciones»)
    // reservadas (#640): text, search, links — si llegan en true se ignoran (aviso 4)
  }
  load(input: DocumentSource & { url: string | null }, ctx: {
    signal: AbortSignal
    progress(loaded: number, total: number): void
    password?: string
  }): Promise<DocumentHandle>
}

type DocumentHandle =
  | { kind: 'canvas', pageCount: number, pageSize(i: number): { width: number, height: number },
      render(i: number, canvas: HTMLCanvasElement, o: { scale: number, rotation: number, signal: AbortSignal }): Promise<void>,
      destroy?(): void }
  | { kind: 'image',  pageCount: number, pageSize(i: number): { width: number, height: number },
      pageSrc(i: number): string, destroy?(): void }       // <img> por página (imagen suelta o páginas que convierte el servidor)
  | { kind: 'frame',  src: string, destroy?(): void }      // SOLO el visor nativo de Grana
```

- **Errores:** `load` rechaza con `{ kind, message? }`; `kind` ∈ `network` · `not-found` · `forbidden` · `password` (con `wrong: true` si la que se dio no vale) · `corrupt` · `empty` · `no-inline` · `unknown`. Otro `kind` cuenta como `unknown`. Un `AbortError` pedido por el componente se ignora; uno no pedido es `unknown` (una carga nunca se queda en `loading`). `message` es texto de la aplicación y sustituye a la descripción de `labels.errors[kind]`.
- **`pageSize`** en px CSS al 100 %, antes de girar. Cada página reserva su caja con su tamaño real **antes** de pintarse (sin saltos).
- **`render`** pinta en el lienzo que da el componente, a la escala y el giro pedidos, con su resolución (DPR acotada a 2) y respeta `signal` (el componente lo aborta al cambiar escala, giro o fuente y al salir de la vista).
- **`kind: 'frame'` solo lo produce `createNativePdfRenderer`** (el componente comprueba una marca interna): un `iframe` sin `sandbox` con una URL que no ha validado Grana sería ejecutar cualquier sitio dentro de la aplicación. Un `frame` de otro renderizador es `error` `unknown` con aviso 3.
- **Contrato con el adaptador** (como `uploader` de `GFileField` y el motor de la voz): la aplicación respeta `signal`; Grana no puede comprobar lo que el renderizador hace.

### Los de Grana (sin dependencias)

| Fábrica | Acepta | `kind` | Capacidades | Notas |
| --- | --- | --- | --- | --- |
| `createImageRenderer({ types? })` | `types` (por defecto `image/png`, `image/jpeg`, `image/gif`, `image/webp`, `image/avif`, `image/bmp`, `image/svg+xml`) | `image`, 1 página | `zoom`, `rotate`, `print: 'image'`; `fit: 'fit-page'` | `<img decoding="async">` + `decode()`; un fallo al decodificar es `corrupt` (también el códec que el motor no tenga: HEIC, TIFF, AVIF en motores viejos; límite conocido). **SVG solo como `<img>`** (no ejecuta scripts) |
| `createNativePdfRenderer({ origins? })` | `application/pdf` | `frame` | `print: 'original'` y nada más (sin API: ni página, ni zoom, ni eventos) | Rechaza con `no-inline` si `navigator.pdfViewerEnabled !== true` **o** si la URL no es del mismo origen, la URL de objeto propia o un origen de `origins` (lista explícita de orígenes que la CSP `frame-src` de la aplicación admite). Sin `sandbox` (Chromium no pinta PDF en un `iframe` con `sandbox`) |

`defaultRenderers = Object.freeze([createImageRenderer(), createNativePdfRenderer()])`. Sin PDF por pdf.js, un PDF en un navegador sin visor (Android Chrome, Chromium y Firefox sin interfaz) da la ficha `no-inline` con Descargar y «Abrir el original».

### Adaptador de pdf.js (`@grana/vue/document-preview/pdfjs`, decisión del usuario 3)

```ts
createPdfjsRenderer(pdfjs, {
  workerSrc?: string,             // o workerPort; uno de los dos (aviso 13 si falta: pdf.js caería a un worker falso en el hilo principal)
  workerPort?: Worker,
  cMapUrl?: string, cMapPacked?: boolean, standardFontDataUrl?: string,
  withCredentials?: boolean, httpHeaders?: Record<string, string>,   // la red la hace pdf.js con lo que la aplicación pase
}): DocumentRenderer
```

- **`id: 'pdfjs'`**, acepta `application/pdf`, `kind: 'canvas'`, `fit: 'fit-width'`, capacidades `pages`, `zoom`, `thumbnails`, `rotate`, `progress`, `password`, `print: 'original'`. **Sin capa de texto, búsqueda ni enlaces en v1** (reservados, L4: ronda propia con pdf.js real).
- **Seguridad:** `isEvalSupported: false` **siempre** (una opción contraria se ignora con aviso 13; CVE-2024-4367); el *worker* es de la aplicación (`worker-src` de su CSP). Con `file`, pasa `data` (`await file.arrayBuffer()`); con `src`, `url`. Abortar = `loadingTask.destroy()`; `render` usa `renderTask.cancel()` con `signal`.
- **Errores:** `PasswordException` → `password` (`wrong` si el código es de contraseña incorrecta); `InvalidPDFException` → `corrupt`; respuesta 404 / `MissingPDFException` → `not-found`; 401 y 403 → `forbidden`; fallo de red → `network`; 0 bytes → `empty`; el resto → `unknown`.
- **Versión:** al crear, si `pdfjs.version` está fuera del rango probado, aviso 13 (no impide usarla). Solo en el cliente: con SSR, la aplicación importa `pdfjs-dist` de forma dinámica.

## Estados (#642)

| `data-phase` | Cuándo | El escenario | El sello | Salida |
| --- | --- | --- | --- | --- |
| `idle` | `source` `null` | Vacío (`role="group"`, sin parada) | No se pinta | — |
| `loading` | Renderizador elegido, `load` en curso | `aria-busy="true"` desde el inicio; **molde** de la página que llega a los 200 ms; `GProgress` con `label` si hay `progress`; a los 5 s, texto `labels.loadingLong` y «Cancelar» | Nombre y datos; Imprimir `aria-disabled` con motivo | Cancelar → `error` `canceled` |
| `ready` | `load` resolvió | Páginas perezosas | Completo | — |
| `password` | `load` rechazó `password` | Formulario en el sitio (§«Contraseña») | Completo (Descargar sigue) | Enviar → `loading` |
| `error` | `load` rechazó (o cancelar) | `GEmpty` (tabla de abajo) | Completo | Según `kind` |
| `unsupported` | Ningún renderizador acepta, o falta `name`/`type` | `GEmpty cause="none"` + icono `file-question-mark` | Completo | Descargar si se puede |
| `too-large` | `source.size > maxSize` | `GEmpty cause="none"` + `file-exclamation-point`, descripción con `{limit}` (`formatFileSize`) | Completo | Descargar si se puede |
| `no-inline` | El visor nativo rechazó `no-inline` | `GEmpty cause="none"` + `file-question-mark` | Completo | Descargar · «Abrir el original» |

| `kind` del error | `GEmpty` | Icono (slot `icon`) | Acción en el sitio |
| --- | --- | --- | --- |
| `network` | `error` | `wifi-off` | «Reintentar»; además **un** reintento solo cuando llega el evento `online` (sin bucles) |
| `not-found`, `unknown`, `canceled` | `error` | el de `GEmpty` (`circle-alert`) | «Reintentar» |
| `forbidden` | `forbidden` | el de `GEmpty` (`lock`) | Ninguna propia (el texto de la aplicación dice qué hacer; `message`) |
| `corrupt`, `empty` | `error` | `file-exclamation-point` | `corrupt`: «Descargar el original» si Descargar está disponible; `empty`: ninguna |

- **Motor común** (`api.md` §«Carga y vacío», #531 a #541): 200 ms antes del molde (antes, nada se ve y no se anuncia), **400 ms** mínimos a la vista si se vio, **5000 ms** espera larga; el molde **no late** (#539) y usa `--g-color-mold`; nunca `progressbar` en el molde. Una carga rápida no se ve ni se oye.
- **Títulos y descripciones** de `labels.errors[kind]`, `labels.unsupported`, `labels.tooLarge`, `labels.noInline`; `GEmpty` nunca `role="alert"` (#541).
- **Foco** (#534): si el foco estaba en lo que se sustituye (el escenario al pasar a `error`, una acción del `GEmpty` al reintentar), va a la **raíz con nombre** (`tabindex="-1"` solo para eso) y, al volver a `ready`, al escenario. Nunca a `body`.

### Contraseña (#642)

- Solo con un renderizador con `capabilities.password`. En el escenario: título `labels.password.title`, **`GInput type="password"`** con `labels.password.label`, `autocomplete="off"`, y `GBtn` `labels.password.submit`, en un **`div role="group"`** con nombre `labels.password.title` — **no** un `<form>` (el visor puede estar dentro del formulario de la aplicación y un `<form>` anidado no es HTML válido). Intro en el campo envía.
- Contraseña incorrecta: el campo muestra `labels.password.wrong` como `error` (región del propio `GInput`) y conserva el foco. La contraseña **no se guarda**: va a `ctx.password` en ese `load` y se olvida.
- **Aislado del `GForm` de la aplicación:** el componente hace `provide(formKey, null)` (como `GDialog`, #566): el campo no hereda `readonly`, `disabled` ni errores, ni se registra.
- Foco: si el foco estaba en el escenario cuando llega `password`, va al campo; si no, no se mueve.

## Lomo (A, #644)

### Teclado del riel (`slider` vertical)

| Tecla | Efecto |
| --- | --- |
| **↓** · **→** (← en RTL) | Página siguiente |
| **↑** · **←** (→ en RTL) | Página anterior |
| **Av Pág** · **Re Pág** | ±`max(1, round(N / 10))` páginas (adelante · atrás) |
| Inicio · Fin | Primera · última |
| Cifras | **Página tecleada** (regla B4 de `GSlider`, #452): la marca muestra lo tecleado (`is-typing`), `aria-valuetext` no cambia hasta confirmar; confirma Intro, una pausa de `TYPE_MS` (900 ms), otra tecla (que luego actúa) o perder el foco; Esc anula; fuera de rango va al límite. Cifras latinas y las del idioma |
| Tab | Sale |

**↓ = siguiente: desviación justificada de APG** (#644). APG *Slider* dice «↑ aumenta» sin distinguir la orientación; aquí la página 1 está **arriba** y el valor crece hacia abajo, como el documento. Criterio:
1. **Coherencia dentro del componente:** en el escenario, en las miniaturas y con Av Pág, «abajo» es siempre «más adelante en el documento»; un lomo al revés sería la única pieza que lo contradice, a un Tab de distancia.
2. **Dirección visual** (WCAG 1.3.3 y la heurística de correspondencia con el mundo real): con ↑ = siguiente, la marca **baja** al pulsar ↑.
3. **No hay convención de plataforma única** (medido por lima el 2026-10-14 con `<input type="range" style="writing-mode: vertical-lr">`, mínimo arriba): **Chromium** sube el valor con ↓; **Firefox y WebKit** lo bajan. La plataforma no decide; el componente elige lo coherente.
4. **Mitigación:** `aria-valuetext` dice siempre «Página n de N» tras cada paso (el lector oye el resultado, no la dirección), → / ← siguen la lectura, y la persona tiene además el escenario y las miniaturas.
- **Revisión:** el guion de lector real de la Fase D (VoiceOver, NVDA, TalkBack) lo comprueba; si se demuestra confusión, se vuelve a APG estricto (↑ = siguiente) como decisión de lima, sin cambio de API.

### Puntero, táctil y la página que asoma

- **Pulsar** el riel lleva a la página de esa altura (la marca **llega**, §«Movimiento») y anuncia «Página n de N» **al soltar**, una vez. **Arrastrar** la marca recorre las páginas (el escenario la sigue) y anuncia al soltar. Pulsar es la alternativa de un solo puntero al arrastre (WCAG 2.5.7).
- **La página que asoma** (`__peek`, `aria-hidden`): al pasar el puntero, al arrastrar y mientras el riel tiene el foco y se mueve con teclado, una miniatura de la página destino con «Página n de N» sale junto a la marca, a la altura de esa página. Se retira al salir el puntero (sin arrastre) y al perder el foco. Se pinta con el mismo renderizador (lienzo pequeño, perezoso; con `kind: 'image'`, su `pageSrc`). En táctil, solo durante el arrastre.
- **Muescas:** una por página, proporcionales. Si `N × space` supera el alto del riel, **`is-dense`**: sin muescas sueltas (coco pinta un riel continuo); la marca y la página que asoma siguen igual.
- El riel sigue la página **del escenario** (al desplazar el documento, la marca se mueve sin muelle y sin anuncio).

### Miniaturas

- Conmutador `GBtn icon` con `aria-pressed` y **nombre constante** (`labels.thumbnails`); abrirlas **sustituye el riel** por la lista (el lomo crece de `space × 12` a `space × 30`; coco) y el foco se queda en el conmutador.
- Lista: `nav` (`labels.pages`) > `ol tabindex="-1"` (#570) > botones con nombre `labels.pageOf` y texto visible «n» (2.5.3), `aria-current="page"` en la actual. **Una parada** (foco itinerante en la actual): ↑/↓, Inicio/Fin; Intro/Espacio va a la página, anuncia «Página n de N» y el foco se queda en la miniatura. Pintado perezoso a escala fija.

### Zoom (barra vertical al pie del lomo)

- `role="toolbar"` `aria-orientation="vertical"`, una parada, ↑/↓ e Inicio/Fin entre **Acercar** (arriba), el **valor** (disparador de `GMenu` con nombre «`labels.zoom`: valor», texto visible el porcentaje efectivo o el ajuste) y **Alejar** (abajo). El menú: grupo de opciones `radio` con `labels.fitWidth`, `labels.fitPage` y 50, 75, 100, 150, 200 y 400 %.
- En el límite, el botón queda `aria-disabled` (sigue enfocable) y no hace nada.

## Escenario (#645)

- **`role="document"` con parada de Tab** cuando hay documento que se desplaza (`ready` con lienzo o imagen): contenedor desplazable **sin hijos enfocables**, así que necesita su parada (WCAG 2.1.1; #570 no aplica) y un rol que admita nombre (un `div` genérico no lo admite en ARIA 1.2); `document` además pide al lector el modo de lectura. Con el visor nativo, la parada es el `iframe` (con `title`) y el escenario es `role="group"` sin parada. En los demás estados, `role="group"` sin parada.
- **Nombre** `labels.region`; **descripción** el estado oculto (`{id}-status`): «`labels.pageOf`. `labels.zoomState`.» y, si el renderizador no declara texto (hoy todos), además **`labels.noText`** («El texto de este documento no llega al lector de pantalla; descárgalo para leerlo con otra aplicación»): el contenido en lienzo **no es accesible** y el visor lo dice (§8.8 de kiwi). El estado se **consulta**; no es región viva.
- **Teclado** (solo con el foco en el escenario, excepción de 2.1.4): flechas, Re Pág/Av Pág, Espacio, Inicio/Fin desplazan (nativo); **`+` o `=`** acerca, **`-`** aleja, **`0`** vuelve al `fit` del renderizador, siempre **sin** Ctrl, ⌘ ni Alt. **Ctrl/⌘ + rueda** y el pellizco del panel táctil (rueda con `ctrlKey`) acercan con ancla bajo el puntero, continuo dentro de [0,25; 4]. **Ctrl/⌘ + `=`/`-`/`0` no se interceptan** (zoom de página del navegador, 1.4.4 y 1.4.10). El pellizco con dos dedos en pantallas táctiles **no se intercepta** en v1 (zoom de la página; el del documento queda reservado).
- **Imagen ampliada:** arrastrar con el puntero principal la mueve (`is-pannable`, `is-panning`); con teclado, flechas.
- **Ancla** (kiwi §4.5): antes de acercar, alejar, ajustar, girar o redimensionar se guarda `{ página, fracción dentro de la página, centro horizontal }` y se restaura después: **la página no cambia**.
- **Página actual:** la que cruza el 30 % superior del escenario; se actualiza una vez por cuadro al desplazar, sin anuncio.
- **El sello flota abajo**: el escenario reserva su alto (`padding-block-end` y `scroll-padding-block-end` con `--_seal-size`, medido; #595): el pie de la última página queda por encima del sello.
- **Rendimiento** (L13, para bruno): solo se pintan las páginas visibles y un visor de margen (comprobación geométrica además del `IntersectionObserver`, que puede ir un cuadro atrás); **nada se pinta antes de medir el escenario**; un cambio de escala repinta solo las visibles (clave escala + giro por lienzo); un cambio de tamaño del escenario recalcula la escala **una vez por cuadro** y repinta al asentarse (entre tanto, los lienzos se escalan por CSS); ningún `watch` con getter que devuelva un arreglo nuevo (bd888df).

## Profundidades (#646)

- **`depth`** `inline` → `dialog` → `fullscreen`: **el mismo estado y el mismo documento cargado** (no se vuelve a pedir; `phase` sigue `ready`). Diálogo y pantalla completa son **un solo `GDialog`** (`size="lg"`, `mobile="fullscreen"`, `title` = `source.name`, `description` = los datos, `closeLabel` = `labels.close`, `from` = el botón Ampliar) cuyo `fullscreen` sigue a `depth`.
- **Dos escenarios sobre un estado** (L13): el del diálogo es el activo mientras está abierto (registra la página al desplazarse); el de la página queda montado e inerte detrás del modal. Al cerrar, el escenario en línea **vuelve a la página donde lo dejaste**. Con el visor nativo, el `iframe` del diálogo **carga otra vez** el PDF y no conserva su posición (sin API; límite conocido).
- **Ampliar** (`GBtn icon`, `aria-haspopup="dialog"`, `labels.expand`, `maximize-2`) en el sello en línea; en el diálogo, en su sitio, **Pantalla completa** (`aria-pressed`, **nombre constante** `labels.fullscreen`; el icono cambia `maximize-2` → `minimize-2`). **Corrige el prototipo**, que cambiaba el nombre y el estado a la vez (APG *Button*: un conmutador no cambia de nombre). En teléfono (`isPhone`), el diálogo ya es pantalla completa: el conmutador no se pinta.
- **Foco al abrir:** el escenario del diálogo lleva `autofocus` (paso 1 de #292): se amplía para leer, y las flechas desplazan en el acto. **Al cerrar** vuelve a Ampliar (`from`).
- **Esc** (un nivel por gesto, #565, #581 regla 3): en `fullscreen`, el componente impide el `dismiss` con `reason: 'escape'` (`preventDefault()`) y baja a `dialog`; en `dialog`, cierra. El botón de cierre cierra desde las dos.
- **Sin la Fullscreen API en v1** (L11): iPhone no la admite para elementos, el Esc del sistema la consume antes que el diálogo y la capa superior del `GDialog` ya cubre la página. Reservada.
- `actions.expand: false` quita Ampliar (visor dentro de un `GDialog` de la aplicación); un `depth` distinto de `inline` con `expand: false` avisa (aviso 14) y se ignora.
- El `GDialog` va **dentro de la raíz** (sin `Teleport`): hereda la zona de marca (§«Zona de marca»).

## Acciones (#643; decisión del usuario 2)

### Disponibilidad: el prop `actions`

`actions` es un mapa por nombre. Acciones: `download`, `print`, `share`, `copyLink`, `open`, `email`. Herramientas: `rotate`, `details`, `expand`.

| Valor | Acción | Herramienta |
| --- | --- | --- |
| ausente | **Automática**: se ve si existe un comportamiento por defecto y el entorno lo permite (matriz de abajo); si no, se oculta. `email` no tiene: oculta | Se ve si el renderizador lo permite |
| `true` | **La lleva la aplicación**: se ve siempre (salvo regla 3), el componente emite `action` y **nunca** ejecuta el comportamiento por defecto | Sin efecto (aviso 8) |
| `false` | Oculta | Oculta |
| String | Se ve con **`aria-disabled`** y ese texto como **motivo** (permiso con explicación) | Sin efecto (aviso 8) |

**Reglas de disponibilidad** (kiwi §7.2):

1. **El entorno no puede** (sin `navigator.share`, sin portapapeles o fuera de contexto seguro, sin visor PDF, URL de otro origen para una descarga por defecto): **se oculta**. La persona no puede hacer nada para cambiarlo.
2. **La aplicación no lo permite:** `false` (oculta) o un String (motivo).
3. **Aún no se puede:** `aria-disabled` con motivo: cargando (`labels.unavailable.loading`; Imprimir y Girar), sin conexión (`navigator.onLine === false`: las que la aplicación lleva y las que piden una URL remota; no las que usan los bytes en la mano ni Copiar enlace; `labels.unavailable.offline`), la misma acción en curso (`labels.unavailable.busy`).

- **Motivo:** en un `GBtn` del sello, `GTooltip` con `text` = nombre y `detail` = motivo (segunda etapa, `aria-describedby`; `tooltip.md`); nunca `disabled` nativo (el motivo no se podría leer). En un elemento de «Más acciones», `disabled: true` y la etiqueta `labels.withReason` (`{label}`, `{reason}`).
- **Ocultar no protege:** el servidor niega la URL (Principios 7).

### Matriz por defecto (acciones ausentes de `actions`)

| Acción | Dónde | Por defecto | Se oculta si |
| --- | --- | --- | --- |
| **Descargar** | Sello (`download`) | `<a download="{name}">` sobre la URL de objeto propia o una URL **del mismo origen** (el atributo se ignora en otro origen). Conserva el nombre; no convierte. Acuse «`labels.receipts.download.started`» (el navegador no confirma: nunca «Descargado») | URL de otro origen (lo lleva la aplicación con `true`: URL firmada, otro dominio) |
| **Imprimir** | Sello (`printer`) | `print: 'original'`: el original en un `iframe` oculto del mismo origen y `print()` (todas las páginas, vectorial). `print: 'image'`: un documento propio en un `iframe` oculto, **construido con el DOM** (título por `textContent`, `img.src` por propiedad; nunca interpolando datos en HTML), con la imagen contenida en la hoja (`max-inline-size: 100%`, `max-block-size: 100vh`, `object-fit: contain`, `@page` con margen): **sin recortes**. Sin acuse de éxito (el navegador no dice si se imprimió) | El renderizador declara `print: false`. **Original de otro origen:** `aria-disabled` con `labels.unavailable.printOriginal` («Abre el original para imprimirlo»; «Abrir el original» sigue en el menú) |
| **Compartir** | Más (`share-2`) | `navigator.share({ files: [file], title })` si hay `file` y `navigator.canShare({ files })`; si no, `{ url: link, title }`. Cancelar (`AbortError`) **no es un fallo**: sin acuse. Acuse `labels.receipts.share.done` al resolver | Sin `navigator.share`, o sin `file` compartible ni `link` |
| **Copiar enlace** | Más (`link`) | `navigator.clipboard.writeText(link)`; acuse `labels.receipts.copyLink.done` **solo si la promesa resuelve** | Sin `link`, sin portapapeles o fuera de contexto seguro |
| **Abrir el original** | Más (`external-link`) | Elemento-enlace de `GMenu` (#572): `href` = la URL resuelta, `target="_blank"`, `rel="noopener"`, `external`; no emite `navigate` (#574) ni acuse | Sin URL |
| **Enviar por correo** | Más (`mail`) | **Ninguno** (`mailto:` no adjunta ni confirma) | Siempre, salvo `email: true` (decisión del usuario 2) |
| Girar a la derecha | Más (`rotate-cw`) | Del visor (`rotation` + 90) | `capabilities.rotate` falso o `rotate: false` |
| Detalles | Más (casilla, `aria-checked`) | Abre `__meta` | `details: false` |
| Ampliar / Pantalla completa | Sello | §«Profundidades» | `expand: false` |

Orden de «Más acciones»: Girar · Compartir · Copiar enlace · Enviar por correo · Abrir el original · las de `customActions` · separador · Detalles. Imprimir y Descargar viven en el sello (en estrecho también: no se mudan).

### La intención: evento `action` y su ticket

Toda acción (salvo Girar, Detalles y Ampliar, que son del visor) emite **`action`** de forma **síncrona** en el gesto, **antes** del comportamiento por defecto:

```ts
type ActionEvent = {
  action: 'download' | 'print' | 'share' | 'copyLink' | 'open' | 'email' | string   // o el id de customActions
  source: DocumentSource
  retry: boolean                     // viene de «Reintentar» de un acuse fallido
  defaultPrevented: boolean
  preventDefault(): void             // síncrono: evita el comportamiento por defecto (ausente en actions)
  // Acuse (el ticket): solo lo que la aplicación confirma se dice
  busy(text?: string): void          // en curso: GBtn loading o elemento aria-disabled; texto o labels.receipts[action].busy
  done(text?: string): void          // hecho: texto o labels.receipts[action].done
  failed(text?: string): void        // fallo: texto o labels.receipts[action].failed, con «Reintentar»
  cancel(): void                     // sin acuse (la persona cerró el diálogo de la aplicación)
  waitUntil(p: Promise<string | { message?: string } | boolean | null | void>): void
}
```

- **`waitUntil(p)`** = `busy()` y, al asentarse: resuelve String o `{ message }` → `done(texto)`; `true` → `done()`; `false`, `null` o `undefined` → `cancel()`; rechaza `{ message? }` → `failed(message)`.
- **Ciclo** (kiwi §7.3): `busy` → `done` | `failed` | cancelado. El ticket vale hasta asentarse o hasta que la misma acción vuelve a empezar (el anterior queda cancelado); una llamada fuera de tiempo se ignora (aviso 11). Los métodos pueden llamarse **más tarde** (el correo: la aplicación llama a `busy()` cuando la persona pulsa Enviar en **su** diálogo, no al abrirlo; así el acuse no dice «Enviando…» mientras se escribe).
- **Con `true` en `actions`** el componente solo emite y escucha el ticket. **Ausente**, si nadie llama a `preventDefault()`, ejecuta el comportamiento por defecto (que pone su propio acuse); con `preventDefault()` y sin ticket, no dice nada (la aplicación da su propio aviso).
- **Activación del usuario** (Compartir): el evento se emite dentro del gesto; una aplicación que lleve Compartir llama a `navigator.share` **en el propio manejador**, con el `File` ya en la mano (un manejador que espera pierde la activación). README.
- **`customActions`**: `{ id: String (obligatorio, distinto de las acciones de Grana), label: String (obligatorio), icon?: String (nombre de Lucide, «dato → nombre», #202), disabled?: String (motivo) }`; siempre las lleva la aplicación (como `true`).

### El acuse (`__receipt`)

| Acción | En curso | Bien | Mal |
| --- | --- | --- | --- |
| Descargar (defecto) | — | `started` «Descargando {name}» | No detectable |
| Descargar (aplicación) | `busy` «Preparando la descarga…» | lo que diga `done` | `failed` + Reintentar |
| Imprimir (defecto) | `busy` mientras se prepara el `iframe` | **Nada** | «No se pudo imprimir aquí: abre el original…» |
| Copiar enlace | — | «Enlace copiado» tras resolver | «No se pudo copiar el enlace» |
| Compartir | — | «Compartido» tras resolver | «No se pudo compartir» (cancelar: nada) |
| Enviar por correo (aplicación) | `busy` «Enviando…» cuando la aplicación lo diga | **lo que la aplicación confirme** («Enviado a ana.ruiz@…») | lo que diga, + Reintentar |

- **Dónde:** en el sello, **en el sitio de los datos** del archivo (el `GSummary` del sello se queda con el nombre y el acuse ocupa el lugar de sus datos): nada nuevo se abre ni se mueve bajo el puntero. Icono + texto, nunca solo color: en curso `loader-circle` (gira; quieto con movimiento reducido), bien `circle-check`, mal `circle-alert`.
- **Anuncio:** cada texto del acuse va al **canal cortés de página** (`announcePage`, #533), una vez.
- **Duración:** `done` y `started` se retiran a los **`RECEIPT_MS` = 4000 ms** (constante de JS) y vuelven los datos; `failed` se queda hasta otra acción o fuente. Un fallo lleva **«Reintentar»** (`labels.retry`, botón de texto dentro de la barra del sello; emite `action` con `retry: true`). Imprimir por defecto no lleva Reintentar.
- **Nunca** se simula un envío ni un éxito: sin ticket, no hay acuse.

## Detalles (`__meta`)

`GSummary layout="stack"` con el icono del tipo, `title` = nombre y los datos del archivo (`labels.facts.type` → `typeLabel` o la extensión; `labels.facts.pages` → `pageCount` o `source.pages`; `labels.facts.size` → `formatFileSize(size, locale)`; `labels.facts.modified` → `Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' })`) seguidos de `facts` de la aplicación. Se abre con la casilla «Detalles» del menú; está **después** del cuerpo en el DOM; con `id` para `aria-controls` del elemento si `GMenu` lo admite (si no, sin él). En el sello, el mismo `GSummary` en `layout="inline"`, con los datos con prioridad (tipo, páginas, tamaño): **ceden solos** en estrecho (#349 a #357), y el nombre (identificador anclado) se recorta con elipsis y `dir="auto"`.

## Estrecho

`is-narrow` por el ancho de la **raíz** (no del dispositivo) por debajo de **`space × 120`** (480 px con `space` 4), medido con `utils/sizeObserver.js` (constante de diseño, como #130; coco puede ajustar el factor en múltiplos de `space`). En estrecho: el sello solo lleva el nombre (los datos ceden; el acuse sigue ocupando su sitio), las acciones **no se mudan** (Descargar, Imprimir, Más y Ampliar siguen en el sello) y las miniaturas abiertas cubren el escenario en lugar de estrecharlo (coco). A 375 px, sin desplazamiento horizontal de la página.

## Anuncios (canal cortés de página, `announcePage`, #533)

Gestos explícitos y resultados; **nunca** el desplazamiento libre:

- **Carga:** `labels.loading` solo si el molde llegó a verse; `labels.loadingLong` a los 5 s; `labels.ready` (`{name}`, `{count}`) al terminar **si hubo espera** o tras una contraseña. Error: título y descripción del estado, una vez.
- **Navegación por pulsar o arrastrar el lomo** (al soltar), **miniatura**: `labels.pageOf`. Por teclado en el riel **no** (el `slider` ya dice su `aria-valuetext`: sería doble).
- **Zoom:** `labels.zoomState` («Zoom 150 %», «Ajustado al ancho»). **Giro:** `labels.rotated` (`{degrees}`).
- **Acuses:** su texto (§«El acuse»).

## Zona de marca (L14)

**Solo lee tokens:** todo lo que pinta del grupo de color (`bg`, `surface`, `surface-sunken`, `text`, `text-muted`, `border`, `border-strong`, `mold`, `focus`, `primary`/`on-primary` si coco los usa en la marca) está en la lista de `tokens.md` §44.5: no se añade ninguno. **Las páginas son píxeles del documento** (papel y tinta del PDF o de la imagen), no del tema: no cambian dentro de la zona. Los paneles que abre (`GMenu`, el `GDialog` de las profundidades) van **en su sitio**, sin `Teleport`, y heredan la zona (`api.md` §«Zona de marca», regla 3). coco mide el lomo, el sello y el escenario dentro de `data-g-zone="brand"`.

## Movimiento (#639; amplía `tokens.md` §29)

| Qué | Cómo | Movimiento reducido |
| --- | --- | --- |
| La marca **llega** a la página en un salto explícito (pulsar el riel, teclado, cifra, miniatura, botón de la aplicación) | `translate` con **`--g-duration-slow` + `--g-ease-spring`** (octavo uso de §29.1, #639); `is-arriving` mientras dura | En su sitio, sin `translate` |
| La marca **sigue** al desplazar el escenario o al arrastrar | Sin transición (ligada al gesto) | Igual |
| La página que asoma | Aparece con opacidad `--g-duration-fast` + `--g-ease-out`; sigue al puntero con `translate` `--g-duration-press` + `--g-ease-out` | Aparece en su sitio, sin seguir con transición |
| Lomo que se abre en miniaturas | `inline-size` con `--g-duration-slow` + `--g-ease-out`; el escenario conserva la página (ancla) y repinta al asentarse | Instantáneo |
| Acuse que ocupa el sitio de los datos | Fundido `--g-duration-fast` | Igual (es opacidad) |
| Molde | **Quieto** (#539) | Igual |
| Diálogo | El de `GDialog` (D1 desde el disparador, #301) | El de `GDialog` |

Nada se anima al montar; nada pasa de 240 ms (#71); la curva con muelle va dentro de `@supports (transition-timing-function: linear(0, 1))` (§29.1). **Sin `--g-ease-bounce`.**

## Tokens consumidos (L8; `tokens.md` §46)

**Ningún token del tema nuevo** (como propuso kiwi). Existentes: `--g-color-surface-sunken` (escenario), `--g-color-surface` (lomo y sello, raíz en `panel`), `--g-color-bg`, `--g-color-text`, `--g-color-text-muted` (datos del sello, «de N» de la página que asoma), `--g-color-border` (lomo, raíz en `panel`), `--g-color-border-strong` (muescas), `--g-color-primary` / `--g-color-on-primary` (la marca, si coco la rellena; con contorno `--g-color-primary-text` por §7.1 si lo pide el contraste), `--g-color-mold`, `--g-color-success-text` y `--g-color-danger-text` (icono del acuse; el texto queda en `text`), `--g-color-focus`, `--g-focus-width`, `--g-focus-offset`, `--g-border-width`, `--g-radius-*`, `--g-shadow-1` (páginas), `--g-shadow-2` (sello flotante), `--g-shadow-3` (página que asoma), `--g-text-body-sm-*`, `--g-text-caption-*`, `--g-text-action-weight`, `--g-font-ui`, `--g-space-*`, `--g-duration-fast`, `--g-duration-press`, `--g-duration-slow`, `--g-ease-out`, `--g-ease-spring`.

**No son tokens:** alto del cuerpo por defecto (coco, múltiplo de `space`, nunca mayor que el visor dinámico); ancho del lomo `space × 12` y abierto `space × 30` (coco puede ajustarlos en múltiplos de `space`); umbral de estrecho `space × 120`; `ZOOM_STEPS`, [0,25; 4], `TYPE_MS` (900 ms, de `GSlider`), `RECEIPT_MS` (4000 ms), el 30 % de la página actual, ±10 % de Av Pág, DPR acotada a 2 (constantes de JS); `24px`/`44px` (§7). **Datos del `.vue` al CSS** (§29.5): `--_height`, `--_seal-size`, `--_y` de la marca y de la página que asoma, `--_w`/`--_h` de cada página.

## Clases y datos (contrato bruno ↔ coco)

| Clase o dato | Dónde | Cuándo |
| --- | --- | --- |
| `g-document-preview` | Raíz (`section` o `div`) | Siempre |
| `g-document-preview--variant-{embedded\|panel}`, `--appearance-spine` | Raíz | Según props |
| `is-narrow` | Raíz | Ancho < `space × 120` |
| `data-phase` | Raíz | `idle` `loading` `ready` `password` `error` `unsupported` `too-large` `no-inline` |
| `--_height` | Raíz, en línea | Con `height` |
| `g-document-preview__body` (`is-in-dialog` dentro del diálogo), `is-thumbs` | Cuerpo | Siempre / miniaturas abiertas |
| `__spine`, `__thumbs-toggle`, `__rail` (`is-dense`, `is-typing`), `__tick` (`is-current`), `__mark` (`is-arriving`, `--_y`), `__peek` (`is-shown`, `--_y`) | Lomo | Según capacidades |
| `__thumbs`, `__thumb` | Lomo | Miniaturas abiertas |
| `__zoom`, `__zoom-value` | Lomo | `capabilities.zoom` |
| `__stage` (`is-pannable`, `is-panning`), `__pages`, `__page` (`--_w`, `--_h`, `data-drawn`), `__image`, `__frame` | Escenario | Según `kind` |
| `__mold` (`is-shown`), `__progress`, `__long` | Escenario | `loading` |
| `__empty`, `__password` | Escenario | Estados sin vista |
| `__seal` (`--_seal-size` en el cuerpo), `__actions`, `__receipt` (`is-busy`, `is-done`, `is-started`, `is-failed`) | Sello | Con `source` |
| `__meta` | Raíz | Detalles abiertos |
| `__status` | Raíz | Siempre con documento (texto oculto, patrón accesible) |
| `__dialog` | El `GDialog` | Siempre montado (el `<dialog>` de `GDialog` está siempre en el DOM) |

**Selectores sobre hijos de la aplicación:** no hay slots; los iconos de `customActions` los pinta `GMenu`. El CSS de coco no estiliza el interior de `GBtn`, `GMenu`, `GSummary`, `GEmpty` ni `GDialog`.

## Iconos (solo Lucide; `icons.md` v0.12, #647)

**Nuevos en la lista de la librería:** `panel-left` (miniaturas), `zoom-in`, `zoom-out`, `download`, `printer`, `maximize-2` (Ampliar y Pantalla completa; estaba reservado por #338), `minimize-2` (pantalla completa activa), `rotate-cw` (Girar), `share-2`, `link` (Copiar enlace), `mail`, `file-lock` (contraseña), `file-question-mark` (sin vista previa, sin visor), `file-exclamation-point` (dañado, vacío, demasiado grande), `wifi-off` (sin conexión). Nombres canónicos comprobados por lima en `lucide-static` 1.49.0 (`dist/esm/icons/<nombre>.mjs`, marca `lucide-<nombre>`; **`file-question` y `file-warning` no existen**). **Ya en la lista:** `chevron-down` (disparador del zoom), `ellipsis-vertical` («Más acciones», como `GWidget` y `GCard`; **no** se añade `ellipsis`), `external-link`, `file-text` e `image` (icono del tipo en el sello y los detalles), `loader-circle`, `circle-check`, `circle-alert`. **No entran:** `book-open` (era de B), `ellipsis`, `file`. Ningún icono gira con `flip-rtl` (ninguno tiene sentido de lectura).

## Relación con `GFileField` (L12, #649)

- **Frontera:** `GFileField` adjunta (y su B, reservado, comprueba fotos al subir); `GDocumentPreview` lee y usa. El visor no sube nada.
- **Punto de integración pendiente:** abrir el visor desde una ficha de `GFileField`. Hoy la aplicación construye la fuente desde una entrada del modelo: `{ key, name, size, type, file }` (archivo nuevo) o `{ key, name, size, type, src }` (guardado, con la URL **del original**, que no es la `url` de la entrada: allí puede ser una miniatura). `GFileField` no cambia en v1; la acción «Ver» en su ficha es una ronda propia (kiwi) cuando se pida.
- **`formatFileSize`** pasa al principal (`utils/fileSize.js`, por `__shared`): la misma función en los dos componentes. `@grana/vue/file-field` la sigue exportando (sin cambio de API).

## Colores forzados, RTL, SSR

- **`forced-colors`:** muescas, marca, borde del lomo y del sello en `CanvasText`; la marca actual, `Highlight`; el molde, `GrayText`. Lo mide coco.
- **RTL:** el lomo va al **inicio lógico** (derecha); → / ← del riel siguen la lectura (§«Lomo»); ↑/↓ no cambian. Las páginas no se espejan (son el documento).
- **SSR:** ids SSR-seguros; sin `window`, `document`, `navigator` ni `URL.createObjectURL` al importar ni en el servidor; la carga empieza al montar en el cliente. En el HTML del servidor, la raíz con su nombre y el sello con nombre y datos.

## Avisos de desarrollo (`[Grana GDocumentPreview]`, una vez por instancia y motivo)

Con la guarda en línea de #636 (`api.md` «Avisos de desarrollo»).

1. `source` sin `name` o sin `type`; o falta `labels.region`.
2. `src` con un esquema no admitido.
3. Un renderizador sin `id`, `accepts` o `load`; un documento con `kind` desconocido; un `frame` que no viene del visor nativo de Grana.
4. Un renderizador declara una capacidad reservada (`text`, `search`, `links`): se ignora.
5. `appearance` `card` o `phrase` (reservados) o fuera de lista: se usa `spine`.
6. `variant` fuera de lista: se usa `embedded`.
7. Falta un texto de `labels` que se va a usar (una vez por clave).
8. Clave desconocida en `actions`; `true` o String en una herramienta (`rotate`, `details`, `expand`).
9. `customActions` sin `id` o `label`, o con un `id` de una acción de Grana.
10. `zoom` fuera de [0,25; 4] o no válido; `page` fuera de rango tras cargar (se acota); `rotation` no múltiplo de 90.
11. Un método del ticket de `action` llamado después de asentarse o de ser sustituido.
12. Dos `GDocumentPreview` con `landmark` y el mismo `labels.region` en el documento (regiones con el mismo nombre).
13. Adaptador de pdf.js: sin `workerSrc` ni `workerPort`; `pdfjs.version` fuera del rango probado; `isEvalSupported` en las opciones (se fuerza `false`).
14. `depth` distinto de `inline` con `actions.expand: false`.

## Textos (`labels`, sin valores por defecto; #226)

Marcadores con `{…}` o funciones (`utils/template.js`, como `GFileField`); cifras con `Intl.NumberFormat(locale)`.

| Clave | Marcadores | Dónde |
| --- | --- | --- |
| `region` | `{name}` | Nombre de la raíz, del escenario y del `iframe` |
| `navigation` | | Grupo del lomo |
| `page` | | Nombre del riel |
| `pageOf` | `{page}`, `{count}` | `aria-valuetext`, páginas, miniaturas, la página que asoma, anuncios |
| `thumbnails`, `pages` | | Conmutador · `nav` de miniaturas |
| `zoom`, `zoomIn`, `zoomOut`, `fitWidth`, `fitPage` | | Barra y menú de zoom |
| `zoomValue` | `{percent}` | Texto del disparador y opciones numéricas |
| `zoomState` | `{mode}`, `{percent}` | Estado oculto y anuncio («Ajustado al ancho», «Zoom 150 %») |
| `rotate` · `rotated` | — · `{degrees}` | Menú · anuncio |
| `actions` | | Nombre de la barra del sello |
| `download`, `print`, `more`, `share`, `copyLink`, `email`, `open`, `details`, `expand`, `fullscreen`, `close` | | Acciones y herramientas (`close`: cierre del `GDialog`) |
| `withReason` | `{label}`, `{reason}` | Elemento de menú no disponible |
| `unavailable` | `{ loading, offline, busy, printOriginal }` | Motivos de la regla 3 |
| `receipts` | `{ download: { busy, started({name}), done, failed }, print: { busy, failed }, share: { done, failed }, copyLink: { done, failed }, email: { busy, done, failed } }` y por cada `customActions[].id` | Acuses por defecto (cuando el ticket no trae texto) |
| `retry`, `cancel`, `downloadOriginal` | | Acciones de estado |
| `loading`, `loadingLong` | `{name}` | Carga |
| `ready` | `{name}`, `{count}` | Fin de una carga con espera |
| `errors` | `{ network, notFound, forbidden, corrupt, empty, canceled, unknown }`, cada uno `{ title, description }` | Estados de error |
| `unsupported`, `noInline` | `{ title, description }` | Estados sin vista |
| `tooLarge` | `{ title, description({limit}) }` | Estado sin vista |
| `password` | `{ title, label, submit, wrong }` | Contraseña |
| `noText` | | Descripción del escenario sin capa de texto |
| `facts` | `{ type, pages, size, modified }` | Rótulos de los datos del archivo |

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:page` | Number | Cambia la página (desplazamiento, lomo, miniatura, teclado, fuente nueva) |
| `update:zoom` | String \| Number | Cambia el zoom |
| `update:rotation` | Number | Cambia el giro |
| `update:depth` | String | Cambia la profundidad (Ampliar, Pantalla completa, Esc, cierre) |
| `load` | `{ pageCount, renderer }` (`renderer` = su `id`) | Pasa a `ready` |
| `error` | `{ kind, message? }` | Pasa a `error` (incluido `canceled`), `unsupported`, `too-large` o `no-inline` (`kind` = el nombre del estado) |
| `action` | `ActionEvent` (§«Acciones») | Una acción, antes de su comportamiento por defecto |

## Métodos (`defineExpose`)

| Método | Firma | Qué hace |
| --- | --- | --- |
| `focus` | `(options?: FocusOptions) => void` | Enfoca el escenario (o la raíz si no hay escenario enfocable) |
| `reload` | `() => void` | Vuelve a cargar la fuente actual (lo mismo que «Reintentar») |

## Accesibilidad y mínimos (no son tema)

| Criterio | Cómo se cumple |
| --- | --- |
| 1.1.1 | Páginas `role="img"` con «Página n de N»; la imagen suelta con `role="img"` y el nombre del archivo; lienzos y miniaturas `aria-hidden`; `labels.noText` dice que el texto no llega |
| 1.3.1 / 1.3.2 | Región con nombre (o grupo), `slider`, `toolbar` y `nav` con nombre; orden del DOM = lectura = Tab |
| 1.4.4 / 1.4.10 | Zoom del navegador intacto; sin desplazamiento horizontal de la página a 375 px |
| 1.4.11 | Muescas, marca, bordes del lomo y del sello ≥ 3:1 donde son información (coco) |
| 2.1.1 / 2.1.4 | Todo por teclado; atajos de una tecla solo con el foco en el escenario |
| 2.4.3 / 2.4.7 | Foco que no se roba; anillo de siempre en todas las piezas |
| 2.5.3 | Miniaturas: el texto visible está en el nombre |
| 2.5.7 | Pulsar el riel es la alternativa al arrastre |
| 2.5.8 | Toda diana ≥ 24 × 24; ≥ 44 × 44 con `pointer: coarse` (el riel también, en su ancho) |
| 4.1.2 | Conmutadores con `aria-pressed` y nombre constante; `aria-disabled` que sigue enfocable con motivo |
| 4.1.3 | Canal cortés de página para carga, navegación por gesto, zoom y acuses; nunca `role="alert"` |

## `meta.json` y tipos (#443)

`GDocumentPreview.meta.json`: las 17 props con tipo, valores y default (`page`, `zoom`, `rotation` sin default; `depth` `'inline' | 'dialog' | 'fullscreen'`; `appearance` `'spine'`; `variant` `'embedded' | 'panel'`), los siete eventos con su payload, `methods` (`focus`, `reload`), sin slots, `labels` con la forma de la tabla y las exportaciones de la entrada (`createImageRenderer`, `createNativePdfRenderer`, `defaultRenderers`, `documentRenderersKey`) y de la del adaptador (`createPdfjsRenderer`). En `packages/vue/types/`: `DocumentSource`, `DocumentRenderer`, `DocumentHandle`, `ActionEvent` y `PdfjsRendererOptions` (`api/document-preview.d.ts`), y `GDocumentPreview.actions: Partial<Record<'download' | 'print' | 'share' | 'copyLink' | 'open' | 'email', boolean | string>> & Partial<Record<'rotate' | 'details' | 'expand', false>>` en `overrides.mjs`. El parámetro `pdfjs` se tipa como `unknown` estructural (sin depender de los tipos de `pdfjs-dist`).

## Resolución de hallazgos de kiwi (L1 a L15)

| # | Hallazgo | Resolución |
| --- | --- | --- |
| L1 | Nombre y forma | `GDocumentPreview` / `g-document-preview`, una pieza sin subcomponentes públicos; partes en §«Clases» (#638) |
| L2 | API de acciones | `actions` como mapa de disponibilidad (ausente / `true` / `false` / motivo), evento `action` síncrono con ticket (`busy`, `done`, `failed`, `cancel`, `waitUntil`, `preventDefault`), `customActions`; `v-model:page`, `zoom` (`fit-width`/`fit-page`/número), `rotation`, `depth`; `load` y `error`; `labels` sin valores (#643, #646). Compartir y la activación: el evento es síncrono (README) |
| L3 | Renderizadores | Interfaz con `kind` `canvas`/`image`/`frame` (`frame` solo el nativo); prop `renderers` › `documentRenderersKey` › `defaultRenderers` (sin opciones de `install`, #200); visor nativo con `origins` explícitos; pdf.js en `@grana/vue/document-preview/pdfjs` con dependencia par opcional (#640) |
| L4 | Texto, búsqueda, enlaces | Capacidades reservadas; el visor dice que el texto no llega (`labels.noText`); ronda propia con pdf.js real (#640) |
| L5 | Lomo | `slider` vertical con **↓ = siguiente**, desviación de APG justificada y medida; cifra tecleada de `GSlider`; el lomo no es `toolbar` (tres paradas); sin ampliar `utils/slider.js` (el riel no comparte el motor del deslizador: una sola asa, sin rango ni marcas con nombre) (#644) |
| L6 | Landmark | `section` con nombre por defecto; `landmark: false` → `div role="group"` (#645) |
| L7 | `role="document"` | Confirmado en el escenario desplazable; `group` en los demás estados (#645) |
| L8 | Alto en `embedded` | Prop `height` (como `maxHeight` de `GTable`); ningún token; flujo de página reservado (#648) |
| L9 | `formatFileSize` | Al principal por `__shared` (#647) |
| L10 | Iconos | 15 nuevos con nombres canónicos de `lucide-static` 1.49; `ellipsis-vertical` en lugar de `ellipsis`; `book-open` no (#647) |
| L11 | Fullscreen API | Fuera de v1 (#646) |
| L12 | `GFileField` | Punto de integración pendiente; mapeo de la fuente (#649) |
| L13 | Para bruno | Dos escenarios sobre un estado; no pintar antes de medir; comprobación geométrica; escala por cuadro; `watch` con fuentes separadas (§«Escenario», §«Profundidades») |
| L14 | Zona de marca | Sin tokens nuevos; paneles en su sitio heredan la zona; coco mide dentro (§«Zona de marca») |
| L15 | Personalidad | #639 |
| (base) | `spinbutton` de página (formas reservadas B y C) | **↑ = siguiente** (APG *Spinbutton* y `GNumberField`: un número sube con ↑); **corrige el prototipo**, que bajaba con ↑. En A no hay campo de página: la cifra se teclea en el riel (#644) |

## Fuera de v1 (reservado con nombre)

`appearance="card"` (**B · Crece desde la ficha**: portada = la página donde ibas, `v-model:page` como memoria, «Ibas en la página n · Volver al inicio», asiento de la portada; un uso nuevo de `--g-ease-spring` que se decidirá con su contrato) y `appearance="phrase"` (**C · La frase**); capacidades `text`, `search` (`role="search"`) y `links` (con #505) con pdf.js real; la Fullscreen API; el pellizco táctil propio; el flujo de página (`layout="flow"`); la acción «Ver» en la ficha de `GFileField`; un diálogo de correo de Grana (decisión del usuario 2: no en v1).

## Límites conocidos (para el README)

- **Sin capa de texto en v1:** el contenido en lienzo no llega al lector de pantalla ni se puede seleccionar ni buscar; el visor lo dice y Descargar es la alternativa. El visor nativo sí lo tiene (es el del navegador).
- **Visor nativo:** sin API (ni página, ni zoom, ni miniaturas; nuestra barra solo pone acciones); no pinta en Android Chrome, ni en Chromium y Firefox sin interfaz; solo para el mismo origen, la URL de objeto propia u `origins` de la CSP; al ampliar, el `iframe` vuelve a cargar.
- **Descargar por defecto** solo con bytes en la mano o URL del mismo origen; **imprimir el original**, solo del mismo origen. Para otro origen (URL firmada), `actions.download: true` y la aplicación.
- **Imagen:** los formatos que el motor decodifique; un códec que falta se ve como «dañado».
- **pdf.js:** su peso, su *worker*, su CSP y sus actualizaciones son de la aplicación; `isEvalSupported` siempre `false`.
- **↓ = siguiente en el lomo** (desviación de APG, §«Lomo»).
- **Compartir llevado por la aplicación** pierde la activación si su manejador espera antes de `navigator.share`.

## Verificación (cómo se da por hecho)

### bruno (vitest + jsdom)

`GDocumentPreview.test.js`: identidad de `source` (cambiar el objeto con la misma `key` no recarga; otra `key` aborta con `signal` y revoca la URL de objeto); elección de renderizador por `accepts` y orden, `documentRenderersKey`, `defaultRenderers` congelado; `frame` de otro renderizador rechazado; capacidades → herramientas visibles (imagen sin lomo de páginas; nativo solo acciones); estados y `GEmpty` por `kind`; `maxSize`; esquemas de `src`; contraseña (sin `<form>`, `provide(formKey, null)`, `wrong`, no se guarda); `page`/`zoom`/`rotation` controlados y no; disponibilidad de acciones (ausente, `true`, `false`, motivo; reglas 1 a 3, `navigator.onLine`); `action` síncrono antes del defecto, `preventDefault`, ticket (`busy`/`done`/`failed`/`cancel`/`waitUntil`, sustitución, llamada tardía), acuse que se retira a 4 s y el fallo que se queda; descarga por defecto solo mismo origen o `blob:`; nunca «Descargado» ni «Impreso»; `customActions` en el menú; teclado del riel (↓/→ siguiente, ↑/← anterior, espejo de ←/→ en RTL, Av Pág ±10 %, cifra con `TYPE_MS`, Esc); miniaturas (una parada, `aria-current`); `depth` y Esc desde `fullscreen`; los catorce avisos; sin efectos al importar ni en el servidor; `createPdfjsRenderer` con un `pdfjs` simulado (opciones a `getDocument`, `isEvalSupported: false`, mapa de errores, `destroy` al abortar).

### Playwright (`design/lab/theme-playground/`, **puerto propio**; las 45 de `verificar.mjs` como base)

`tests/document-preview.spec.mjs` y `tests/personalidad-document-preview.spec.mjs`, en Chromium, Firefox y WebKit, con `createSimulatedRenderer`, el de imagen y el nativo: una parada por pieza (conmutador, riel, zoom, escenario, sello) y Tab sale; `slider` vertical con nombre y `aria-valuetext`; ↓ → 2, Fin → N, cifra 7 + pausa → 7; la página que asoma al enfocar y al pasar (`aria-hidden`); pulsar el riel lleva a la página y anuncia al soltar; la marca llega con `is-arriving` (y sin `translate` con movimiento reducido); al cargar solo se pinta lo visible; zoom, ajuste y giro **conservan la página**; `+`/`-`/`0` en el escenario y Ctrl+`=` sin interceptar; carga (`aria-busy` desde el inicio, molde oculto antes de 200 ms y visible después, mínimo 400 ms, texto y «Cancelar» a los 5 s); errores con su salida; contraseña; acuses (correo: «Enviado…» solo tras `done`, nunca con fallo; descarga «Descargando»; copiar solo tras resolver; compartir oculto donde no existe; sin conexión `aria-disabled` con motivo); profundidades (diálogo con el foco en el escenario, mismo estado sin recargar, pantalla completa con `aria-pressed` y nombre constante, Esc baja un nivel, cierre devuelve el foco a Ampliar y la página en línea es la del diálogo); el sello no tapa el pie de la última página; 375 px sin desplazamiento horizontal y dianas ≥ 44 con `pointer: coarse`; RTL (lomo a la derecha, ←/→ espejados); dentro de una zona de marca; consola limpia. Una prueba con **pdf.js real** si bruno instala `pdfjs-dist` como dependencia de desarrollo del banco (nunca del paquete): carga, páginas, contraseña y error de PDF dañado.

### coco (Opus) · CSS y auditoría

`GDocumentPreview.css` sin literales ni respaldos (salvo `24px`/`44px`); lomo, muescas (`is-dense`), marca, página que asoma, miniaturas, barra de zoom, escenario con páginas y su sombra, molde quieto, sello flotante con su reserva, acuse, detalles, `panel`, estrecho, `pointer: coarse`, RTL, forzados, movimiento y reducido; contraste en el tema por defecto, claro y oscuro, y dentro de la zona; auditoría del componente real con verificación propia en `design/lab/document-preview/`.

### No verificado (entorno real)

Lector de pantalla real (VoiceOver, NVDA, TalkBack) sobre el escenario `role="document"`, las páginas `role="img"`, el lomo con **↓ = siguiente** y los acuses; el visor PDF nativo pintando (navegadores con interfaz, iOS Safari, Android Chrome); la impresión real (PDF completo e imagen sin recortes en papel); `navigator.share` con archivos en un dispositivo; pdf.js real en Safari mínimo, con CSP estricta; `forced-colors` real; zoom de página al 200 % y 400 %.

## Encargos

- **coco (Opus):** `GDocumentPreview.css` (lo de §«Clases», §«Movimiento» y §«Zona de marca»), alto por defecto del cuerpo y anchos del lomo; banco y `design/lab/document-preview/estilo.md`; después, la auditoría. Sin cambios en `defaults.css`.
- **bruno (Opus):** `GDocumentPreview.vue` y su motor (estado compartido, carga con `loadPhase`, escenarios, lomo, miniaturas, zoom con ancla, profundidades, acciones con ticket y acuse), `createImageRenderer`, `createNativePdfRenderer`, `createPdfjsRenderer`, `createSimulatedRenderer` en `@grana/vue/testing`, `utils/fileSize.js` (sacar `formatFileSize` de `GFileField/engine.js` sin cambiar su exportación pública), los 15 iconos en `library` de `scripts/icons.json` (y `check-icons.mjs` en verde), las dos entradas (`exports`, `typesVersions`, `ENTRIES`, `types.test.js`, `__shared`, `peerDependencies` opcional de `pdfjs-dist`), `meta.json`, `overrides.mjs`, compuertas en `gates.sh`, specs y playground `#sec-document-preview`; medir y registrar los pesos (§«Entrega»).
- **mora-docs (Sonnet):** `GDocumentPreview/README.md` tras la auditoría: cómo elegir renderizadores (`documentRenderersKey`, pdf.js con su *worker* y su CSP, `origins` del nativo), el mapa `actions` y el evento `action` con el ejemplo del correo, la activación de Compartir, la fuente (tipo declarado, `src`/`file`, mismo origen), las entradas y sus globales UMD en el `README.md` raíz, y los límites.

## Dudas para el usuario (no bloquean)

1. **↓ = siguiente en el lomo** (#644): decidido con criterio (coherencia con el escenario y las miniaturas, dirección visual; la plataforma no tiene convención única: Chromium sube con ↓, Firefox y WebKit bajan). Si prefieres APG estricto (↑ = siguiente aunque la marca baje), cambia solo el teclado.
2. **Octavo uso de `--g-ease-spring`** (#639): la marca que llega a su página. Formaba parte del concepto A que elegiste tal como se prototipó; lo registro como aprobado con esa elección. Si prefieres sin muelle, la marca llega con `--g-ease-out` y nada más cambia.
