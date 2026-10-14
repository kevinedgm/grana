# Declaración — visor de documentos (`GDocumentPreview`, nombre de trabajo), r01: auditoría, base funcional y conceptos A, B y C

Prototipo: `design/lab/document-preview/r01/index.html` (servir la raíz del repo; `node design/lab/document-preview/r01/serve.mjs --keep` abre el puerto 4219). Verificación: `node design/lab/document-preview/r01/verificar.mjs` (**135/135 en Chromium, Firefox y WebKit**, §16). El prototipo usa `GBtn`, `GMenu`, `GDialog`, `GEmpty`, `GSummary`, `GProgress` y `GInput` reales de `dist/` con el tema por defecto; lo de laboratorio es el motor del visor, tres renderizadores y la geometría de cada concepto. Iconos: solo Lucide (`design/lab/lucide-icons.js` y, los que faltan, `lucide-static` registrados con `Grana.createIcons`, como en `speech/r02`).

---

## 1. Auditoría del repositorio

### 1.1 Lo que se compone (no se duplica)

| Pieza del visor | Componente o útil existente | Cómo se usa |
| --- | --- | --- |
| Botones de herramienta | `GBtn icon variant="ghost" size="sm" tooltip` | Nombre por el tooltip (#390); `loading` mientras la acción está en curso; `aria-disabled` + motivo cuando no está disponible (convención de `tooltip.md`: con `disabled` nativo el motivo no se puede explicar) |
| Menús «Más» y «Zoom» | `GMenu` | Elementos, grupo de opciones (`radio`) para el zoom, elemento-enlace para «Abrir el original» (#572), `aria-disabled` que sigue enfocable |
| Profundidad diálogo y pantalla completa | `GDialog` (`size="lg"`, `mobile="fullscreen"`, `fullscreen`) | Foco, Esc, capas, traslado de canales vivos al modal, crece desde el disparador (#301); **pantalla completa = cambiar `fullscreen` del mismo diálogo** (medido: sin cerrar ni recargar) |
| Errores y «sin acceso» | `GEmpty` (`cause="error"` / `"forbidden"`, slot `icon` y `actions`) | En el sitio, nunca `role="alert"` (#541) |
| Carga | motor `utils/loadPhase.js` (200/400/5000 ms), canal cortés `announcePage` (#533), `--g-color-mold` (#538) | El molde es la **página** que llega; `aria-busy` en el escenario; texto y «Cancelar» a los 5 s |
| Progreso | `GProgress` con `label` | Solo si el renderizador informa `loaded/total` |
| Identidad del archivo y metadatos | `GSummary` (`facts` con `priority`) | Ficha sin vista previa, sello de A, ficha de B; los datos ceden por prioridad |
| Contraseña de un PDF | `GInput type="password"` dentro de un `<form>` | Solo con un renderizador que la pida |
| Tamaño en texto | `formatFileSize` (hoy en `@grana/vue/file-field`) | Ver L9: hay que llevarla a `__shared` |
| Iconos | `GLibIcon` (librería) | Faltan en la lista: `download`, `printer`, `share-2`, `link`, `mail`, `zoom-in`, `zoom-out`, `maximize-2`, `minimize-2`, `panel-left`, `rotate-cw`, `file-lock`, `file-question-mark`, `file-exclamation-point`, `wifi-off`, `book-open`, `ellipsis` (L10). **`file-question` y `file-warning` no existen en lucide-static v1.49**: son `file-question-mark` y `file-exclamation-point` |
| Reglas comunes | `api.md`: toolbar con foco itinerante, contenedor desplazable con `tabindex="-1"` solo si tiene hijos enfocables (#570), piezas pegadas suman su `scroll-margin` (#595), enlaces y `navigate` (#505, #574), zona de marca (#620), «dato → nombre; plantilla → slot» (#202) | Se citan, no se reinventan |

### 1.2 Solapes revisados

- **`GFileField`** muestra **miniaturas** y el modelo trae `url`; su B «Mesa de luz» (`appearance="gallery"`, reservado) es para *comprobar* fotos al subir. El visor es para *leer y usar*. Frontera: una ficha de `GFileField` puede **abrir** un `GDocumentPreview` (en su profundidad de diálogo); el visor no sube nada. Punto de integración pendiente para cuando lima cierre la API (L12).
- **`GCard`/`GSurface`**: el panel no anida una tarjeta; la raíz del visor ya es su superficie (evita «cajas dentro de cajas», #44).
- **`GSidebar`** no sirve para miniaturas (es navegación de la aplicación con su modelo de rutas). Las miniaturas son una lista de botones propia con `aria-current="page"`.
- **`GSlider`** no tiene orientación vertical; el lomo de A es un `slider` vertical propio (o una ampliación del motor `utils/slider.js`, L5).
- **`GLoadRegion`** es para listas con `items`/`sample`/`keyBy`; el visor no la compone: reutiliza su **motor** (`loadPhase`) y su canal.
- **`GToast`**: el acuse de una acción va **junto a la acción** (proximidad) y por el canal cortés; un aviso flotante es decisión de la aplicación, no del visor.
- **Nada en el repo renderiza PDF**: no hay `pdfjs-dist` ni otra dependencia (comprobado en `node_modules` y en `PENDIENTES.md`).

### 1.3 Peso y entradas

El margen del principal está agotado (#550): **todo componente nuevo abre la valoración de #506** con entrada propia por defecto. Ver §13.

---

## 2. Nombre y partes

`GDocumentPreview` (`<g-document-preview>`), raíz `g-document-preview`. Partes (BEM, nombres de trabajo para lima): `__stage` (escenario), `__page` (cada página), `__mold`, `__tools` (barra; en A `__spine` y `__seal`, en B `__dock` y `__card`, en C `__phrase`), `__pages` (navegación de página), `__page-field`, `__zoom`, `__thumbs`, `__actions`, `__meta`, `__receipt` (acuse de la última acción), `__fallback` (ficha sin vista previa). Una sola pieza, sin subcomponentes públicos en v1 (L1).

---

## 3. El renderizador: la decisión gorda

### 3.1 Opciones medidas o investigadas

| Opción | Qué da | Qué no da | Peso | Límites |
| --- | --- | --- | --- | --- |
| **`<img>` del navegador** (imágenes) | PNG, JPEG, GIF, WebP, AVIF, BMP; SVG **solo** como `<img>` (sin scripts); `decode()`; proporción | — | 0 | HEIC/TIFF no en todos los motores: el anfitrión decide qué tipos acepta y los otros van a la ficha sin vista previa |
| **Visor PDF nativo** en `<iframe>`/`<object>` | Todo lo del navegador: páginas, zoom, búsqueda, texto, impresión, con **su** barra | **Ninguna API**: ni página actual, ni total, ni zoom, ni eventos; nuestra barra no lo puede gobernar (solo el fragmento `#page=N&zoom=` al cargar, y no en todos) | 0 | **Medido en este banco:** `navigator.pdfViewerEnabled` es `false` en Chromium y Firefox sin interfaz y `true` en WebKit; en Android Chrome no pinta PDF en la página (descarga), en iOS Safari solo pinta de forma limitada (no verificado aquí, §17). **No admite `sandbox`** (Chromium no pinta PDF en un iframe con sandbox): el PDF y el iframe tienen que ser de un origen que la aplicación confíe. CSP: `frame-src`/`object-src` para ese origen o `blob:`. **Mover el iframe en el DOM lo recarga** (medido en los tres motores con `append`; `moveBefore` lo conserva en Chromium y Firefox; WebKit no lo tiene) |
| **pdf.js** (`pdfjs-dist`, Apache-2.0, **v6.4.299** hoy en npm; `engines` Node ≥ 22.13; 34,9 MB desempaquetado) | Páginas en `<canvas>`, total, tamaños, **capa de texto** (selección y lector), **búsqueda**, **enlaces** (capa de anotaciones), **giro**, miniaturas, **carga progresiva** por rangos, contraseña | Impresión del original (la hace mejor el original en un iframe oculto) | Del orden de cientos de KB gzip entre la biblioteca y su *worker* (lo mide bruno; no se adivina aquí) | Necesita *worker* (`worker-src` en la CSP), APIs recientes del motor (comprobar Safari mínimo antes de fijar la versión), solo en el cliente (SSR: importación dinámica), `isEvalSupported: false` y mantenerla al día (hubo ejecución de código por fuentes manipuladas, CVE-2024-4367) |
| Servicio de la aplicación (convertir en servidor a imágenes por página) | Lo que el servidor dé | — | 0 en Grana | Es de la aplicación; encaja como un renderizador más |

### 3.2 Propuesta: renderizadores por **adaptador**, como la voz y `GFileField`

Grana define la **interfaz** y la aplicación elige. Nada de `fetch` en el componente; nada de pdf.js dentro de `@grana/vue`.

```js
// Interfaz (nombres de trabajo)
{
  id: 'pdfjs',
  accepts (source) → Boolean,                  // por el tipo DECLARADO por el anfitrión (MIME validado), nunca por la extensión
  fit: 'fit-width' | 'fit-page',              // ajuste inicial
  capabilities: { pages, zoom, thumbnails, rotate, text, search, links, print: 'original'|'render'|'browser'|false, progress },
  load (source, { signal, onProgress, password }) → Promise<Doc>,  // rechaza { kind: 'network'|'not-found'|'forbidden'|'password'|'corrupt'|'empty'|'unknown' }
}
// Doc: { pageCount, size(i) → { w, h }, render(i, canvas, { scale, rotation, signal }), text?(i), search?(q), destroy() }
```

- **En Grana, sin dependencias:** `image` (el `<img>`) y `native-pdf` (el iframe, con sus capacidades reducidas y solo si `navigator.pdfViewerEnabled`; si no, la ficha «Tu navegador no muestra PDF dentro de la página» con Descargar y «Abrir el original»).
- **Opcional, entrada aparte:** `createPdfjsRenderer(pdfjs, { workerSrc })` en `@grana/vue/document-preview/pdfjs`: **la aplicación instala `pdfjs-dist` y le pasa el módulo**; Grana no lo declara como dependencia (como mucho `peerDependencies` opcional). Así la versión, la CSP del *worker* y las actualizaciones de seguridad son de la aplicación (L3).
- **La interfaz manda la interfaz:** la barra **solo** enseña lo que el renderizador declara en `capabilities` (en el prototipo: el PDF simulado muestra páginas, zoom, miniaturas y girar; la imagen, zoom y girar sin paginación; el nativo, solo acciones). Así no hay paginación en una imagen ni zoom propio sobre el visor nativo.
- **Texto, búsqueda y enlaces** quedan **fuera del contrato de v1** salvo con el adaptador de pdf.js (que los da); se declaran como capacidades reservadas y se prototipan en una ronda propia (L4). Con canvas sin capa de texto el contenido **no es accesible al lector**: el visor lo dice (§8.6) y Descargar es la alternativa.

---

## 4. Base funcional

### 4.1 Anatomía y roles

```
section  (región con nombre: «Vista previa de Contrato de arrendamiento.pdf»; la aplicación puede quitar el landmark, L6)
├─ div role="toolbar" aria-label="Herramientas del documento"     (una parada de Tab; flechas)
│   ├─ GBtn «Miniaturas» aria-pressed
│   ├─ GBtn «Página anterior» · input role="spinbutton" aria-valuetext="Página 3 de 12" · «de 12» · GBtn «Página siguiente»
│   ├─ GBtn «Alejar» · GMenu «Zoom: Al ancho» (opciones) · GBtn «Acercar»
│   └─ acuse · GBtn «Descargar» · GBtn «Imprimir» · GMenu «Más acciones» · GBtn «Ampliar» aria-haspopup="dialog"
├─ nav aria-label="Páginas" > ol tabindex="-1" > li > button aria-current="page"   (miniaturas, opcional)
├─ div.__stage role="document" tabindex="0" aria-label aria-describedby=estado aria-busy   (escenario)
│   └─ div.__page role="img" aria-label="Página 3 de 12" > canvas aria-hidden          (o <img alt="">, o el iframe con title)
├─ dl.__meta (opcional)
└─ estado: texto oculto «Página 3 de 12. Ajustado al ancho.» (se consulta; no es región viva)
```

- El **escenario** es un contenedor que se desplaza **sin hijos enfocables**: lleva su parada de Tab (WCAG 2.1.1; #570 no aplica) y `role="document"` para que el lector pase a lectura dentro de una interfaz (L7). Con la capa de texto de pdf.js, el texto es DOM real y se lee.
- Cada página es `role="img"` con «Página n de N» mientras no haya capa de texto; con capa, la página es un grupo con su texto (L4).
- Sin documento (`idle`), sin vista previa o en error, el escenario es `role="group"` sin parada.

### 4.2 Teclado

| Dónde | Tecla | Efecto |
| --- | --- | --- |
| Barra (A: lomo y sello; B: pie; C: frase) | ←/→ (espejo en RTL), Inicio/Fin | Herramienta anterior/siguiente, extremos (APG toolbar). Tab sale |
| Campo de página (`spinbutton`) | ↑/↓ | Página anterior/siguiente (al momento, anunciada) |
| | cifras · Intro · Esc | Al enfocar se selecciona todo; las cifras sustituyen; Intro aplica (fuera de rango se ajusta); Esc revierte sin salir |
| | Inicio/Fin | Primera/última página (dentro del campo ganan sobre las de la barra) |
| | ←/→ | Mueven a la herramienta vecina (como el `spinbutton` del ejemplo de barra de APG) |
| Escenario | Re Pág/Av Pág, Espacio, flechas, Inicio/Fin | Desplazamiento nativo |
| | `+` / `-` / `0` | Acercar / alejar / volver al ajuste. Solo con el foco en el escenario (excepción de WCAG 2.1.4) |
| | Ctrl/⌘ + rueda, pellizco del panel táctil | Zoom del documento con ancla. **Ctrl/⌘ + `=` no se intercepta**: el zoom de página del navegador sigue funcionando (1.4.4, 1.4.10) |
| | Arrastrar (imagen ampliada) | Mover; también con flechas |
| Miniaturas | ↑/↓, Inicio/Fin, Intro/Espacio | Una parada; Intro va a la página |
| Lomo de A (`slider` vertical) | ↓/→ siguiente, ↑/← anterior, Re Pág/Av Pág ±10 %, Inicio/Fin | Ver riesgo en §9 A y L5 |
| Diálogo | Esc | Cierra (un nivel por gesto, #565), el foco vuelve al disparador |

### 4.3 Foco

- Nunca se roba. Cambiar de página o de zoom desde la barra deja el foco en la herramienta.
- Si el contenido que tenía el foco se sustituye (recargar, error), el foco va a la raíz con nombre, como `GLoadRegion` (#534).
- Ampliar abre `GDialog` y el foco entra según #292; cerrar lo devuelve a «Ampliar» (o a la portada en B).
- El **anillo** de todas las piezas es el de siempre (`--g-color-focus`, `--g-focus-width`, `--g-focus-offset`).

### 4.4 Anuncios (canal cortés de página, `announcePage`, #533)

Se anuncian **gestos explícitos y resultados**, nunca el desplazamiento libre:

- Carga: «Cargando X» **solo si el molde llegó a verse** (≥ 200 ms), «X sigue cargando…» a los 5 s, «X listo, 12 páginas» al terminar si hubo espera. Una carga rápida no dice nada.
- Navegación por botón, campo, lomo o miniatura: «Página 7 de 12». Al **soltar** el lomo, una vez.
- Zoom: «Zoom 150 %», «Ajustado al ancho».
- Error: título y descripción del `GEmpty`, una vez.
- Acciones: el texto del acuse (§7.3).
- El estado actual (página y zoom) está siempre en la descripción del escenario, para consultarlo sin que se narre.

### 4.5 Zoom y página con ancla

El zoom guarda `{ página, fracción dentro de la página, centro horizontal }` antes de cambiar y lo restaura después: **la página no cambia al acercar, alejar, ajustar, girar ni al redimensionar** (medido). Pasos: 25, 50, 75, 100, 125, 150, 200, 300, 400 %; desde un ajuste, el paso siguiente parte de la escala efectiva. 100 % de un PDF = 96/72 px por punto (como pdf.js); de una imagen = un píxel por píxel.

### 4.6 Rendimiento

- **Páginas perezosas:** se pinta solo lo visible y un visor de margen (medido: al cargar el contrato de 12 páginas al ancho solo se pinta la página 1). Cada página reserva su caja con su tamaño real antes de pintarse (sin saltos).
- No se pinta nada antes de medir el escenario (el prototipo lo pintaba todo a escala mínima en el primer cuadro: corregido; lección para bruno, L13).
- Un cambio de escala repinta solo las visibles; los lienzos llevan su clave de escala y giro.
- Miniaturas: escala fija pequeña, perezosas también.

---

## 5. Máquina de estados

```
idle ──source──▶ (validar en el anfitrión: tipo declarado, tamaño, renderizador)
                   ├─ sin renderizador ──────────▶ unsupported   (ficha: nombre, tipo, tamaño, icono, Descargar)
                   ├─ tamaño > límite del modo ──▶ too-large     (ficha + motivo + Descargar)
                   ├─ nativo sin visor en el navegador ▶ no-inline (ficha + Descargar + «Abrir el original»)
                   └─▶ loading ── 200 ms ─▶ (molde visible; progreso si lo hay) ── 5 s ─▶ (texto + Cancelar)
                         ├─ ok ─────────────▶ ready  (páginas perezosas)
                         ├─ password ───────▶ password (formulario en el sitio) ── enviar ─▶ loading
                         ├─ cancelar ───────▶ error{canceled} (Reintentar)
                         └─ error{kind} ────▶ error   network: Reintentar + reintento solo al volver `online`
                                                       not-found: Reintentar · forbidden: sin salida propia (texto de la aplicación)
                                                       corrupt: «Descargar el original» · empty: ninguna · unknown: Reintentar
source cambia → abort(signal) del anterior → loading      (la página vuelve a 1; el zoom al ajuste del renderizador)
```

Por acción (independiente del documento): `idle → busy → done | started | failed → idle` (los acuses se retiran a los 4 s; un fallo se queda hasta otra acción). Ver §7.3.

**Mínimo 400 ms a la vista** si el molde llegó a verse (motor común). **Ninguna animación de carga** pasa de 5 s; el molde no late (#539).

---

## 6. Variantes y profundidades: un solo estado

- `variant="embedded"`: dentro del flujo, sin superficie propia que compita; alto del escenario fijo (`--g-document-preview-height` o prop, L8). Alternativa estudiada: **flujo de página** (el documento crece y la página se desplaza) para no anidar desplazamientos en móvil; queda como pregunta para lima (L8).
- `variant="panel"`: su propia superficie delimitada (borde, radio), barra compacta, metadatos plegados.
- **Diálogo y pantalla completa no son variantes que la aplicación monte aparte: son profundidades que el propio visor abre** («Ampliar»). Dentro va **el mismo estado** (página, zoom, giro, miniaturas) y **el mismo documento ya cargado** (no se vuelve a pedir: medido, `phase` sigue `ready` al cerrar). Pantalla completa = `fullscreen` del mismo `GDialog`; en móvil el diálogo ya es pantalla completa (`mobile="fullscreen"`).
- **Al cerrar**, el visor en línea vuelve a la página donde lo dejaste.
- **Sin la Fullscreen API en v1:** iPhone no la admite para elementos, el Esc del sistema la consume antes que el diálogo (dos Esc para salir) y la capa superior del `GDialog` ya cubre el visor en todos los motores. Reservada (L11).
- **Mover el DOM en lugar de duplicarlo** (`<Teleport :disabled>` hacia el diálogo) conservaría los lienzos sin repintar, pero **recarga un iframe** (visor nativo) salvo con `moveBefore`, que Vue no usa y WebKit no tiene (medido). La propuesta es **dos escenarios sobre un estado y un documento compartidos**, con uno solo activo (el que registra la página al desplazarse). Decisión técnica para bruno, no de producto (L13).
- Una aplicación que ya tiene su propio `GDialog` puede poner el visor dentro con `variant="embedded"` y `expand: false` (sin «Ampliar»).

---

## 7. Acciones

### 7.1 Capa de acciones

Grana **emite la intención y espera** a la aplicación. Cada acción tiene un comportamiento **por defecto solo cuando es seguro y comprobable en el navegador**, y un manejador de la aplicación que lo sustituye (forma de trabajo: `actions: { download?, print?, share?, email?, … }`, funciones que devuelven `Promise`; L2).

### 7.2 Matriz acción × tipo × disponibilidad

| Acción | PDF (pdf.js) | PDF (nativo) | Imagen | Sin vista previa | Por defecto en el navegador | Sin manejador ni mecanismo |
| --- | --- | --- | --- | --- | --- | --- |
| **Descargar** | Original | Original | Original | Original | `<a download="nombre">` **solo** con `Blob`/`File` o URL del **mismo origen** (el atributo se ignora en otro origen). Conserva el nombre, no convierte. El navegador **no confirma**: acuse «Descargando X», nunca «Descargado» | Otro origen o URL firmada: necesita el manejador de la aplicación (en curso → iniciada / fallida). Sin él: **se oculta** |
| **Imprimir** | **Original completo** en `<iframe>` oculto del mismo origen + `print()` (todas las páginas, vectorial) | El original igual, o la impresión del propio visor nativo | Documento propio en `srcdoc` con la imagen contenida en la hoja (`max-width:100%`, `max-height:100vh`, `object-fit: contain`, `@page` con margen): **sin recortes** | **No** (oculta) | Igual que la columna; tras `print()` **no hay acuse**: el navegador no dice si se imprimió o se canceló | Otro origen: no se puede imprimir desde la página → texto «Abre el original para imprimirlo» con el enlace. **Durante la carga: `aria-disabled` con motivo** |
| **Compartir** (archivo o enlace) | Sí | Sí | Sí | Sí | `navigator.share({ files })` si `navigator.canShare({ files })` y hay bytes (`File`); si no, `{ url }`. Requiere **activación del usuario**: el `File` tiene que estar ya en la mano (un manejador que tarde lo pierde, L2). Cancelar no es un fallo | Navegador sin `navigator.share` (Firefox de escritorio, Chromium sin interfaz): **se oculta** (medido: WebKit lo tiene; Chromium y Firefox de prueba, no) |
| **Copiar enlace** | Sí | Sí | Sí | Sí | `navigator.clipboard.writeText(link)` en contexto seguro; «Enlace copiado» **solo si la promesa resuelve** | Sin `link` de la aplicación o sin portapapeles: se oculta |
| **Enviar por correo** | Sí | Sí | Sí | Sí | **Ninguno.** `mailto:` no adjunta archivos ni confirma nada | Solo con manejador de la aplicación: en curso → «Enviado a …» con lo que **devuelva** la aplicación → o fallo con «Reintentar». Sin manejador: se oculta. **Nunca se simula un envío** |
| **Abrir el original** | Sí | Sí | Sí | Sí | `<a href target="_blank" rel="noopener">` como elemento-enlace de `GMenu` (no emite `navigate`, #574) | Sin URL: se oculta |
| **Girar** | Sí | No (el visor nativo gira solo) | Sí | — | Del visor | — |
| **Detalles** | Sí | Sí | Sí | Siempre visibles | Despliega los metadatos | — |
| **Ampliar / pantalla completa** | Sí | Sí | Sí | Sí | `GDialog` | — |

**Reglas de disponibilidad** (L2):

1. **El entorno no puede** (sin `navigator.share`, sin portapapeles, sin visor PDF): **se oculta**. La persona no puede hacer nada para cambiarlo.
2. **La aplicación no lo permite** (permiso, política): **se oculta** por defecto; si la aplicación da un motivo, `aria-disabled` + motivo en el tooltip (`detail`) o en el menú. **Ocultar no protege nada:** el servidor debe negar la URL; el visor nunca recibe lo que la persona no puede ver.
3. **Aún no se puede** (cargando, sin conexión, otra acción igual en curso): **`aria-disabled` con el motivo** («Sin conexión», «Disponible cuando termine de cargar»).

### 7.3 Acuse honesto

| Acción | En curso | Bien | Mal |
| --- | --- | --- | --- |
| Descargar (defecto) | — | «Descargando X» | No detectable |
| Descargar (aplicación) | `GBtn loading` «Preparando la descarga…» | «Descargando X» | «No se pudo descargar» + Reintentar |
| Imprimir | «Preparando la impresión…» | **Nada** | «No se pudo imprimir aquí: abre el original…» |
| Copiar enlace | — | «Enlace copiado» tras resolver | «No se pudo copiar el enlace» |
| Compartir | — | «Compartido» tras resolver | «No se pudo compartir» (cancelar: nada) |
| Enviar por correo | «Enviando…» | «Enviado a {lo que devuelve la aplicación}» | Mensaje de la aplicación + Reintentar |

El acuse se ve **junto a las acciones** (base: antes de los botones; A: ocupa el sitio de los datos del sello; B: tras los botones de la ficha y del pie; C: cola de la frase) y va por el canal cortés. Nunca solo por color: icono + texto.

---

## 8. Seguridad

1. **Tipo declarado por el anfitrión** (MIME que la aplicación validó en su servidor), nunca la extensión del nombre; el renderizador decide por `accepts(source)`.
2. **Nada del archivo entra al DOM como HTML.** Imagen: `<img>` (también SVG: en `<img>` no ejecuta scripts). PDF: lienzo (pdf.js) o iframe del visor del navegador. Ningún `innerHTML` de contenido del documento; el nombre del archivo se escapa (en la impresión de imagen el prototipo lo escapa en el `<title>`).
3. **pdf.js:** `isEvalSupported: false`, *worker* de la aplicación, versión de la aplicación al día (§3.1).
4. **Iframe del visor nativo:** sin `sandbox` (no pintaría), así que **solo** con URL del mismo origen, `blob:` creado por el componente o un origen que la política de la aplicación admita (CSP `frame-src`). Una URL arbitraria de otro sitio **no** se carga en el iframe (L3).
5. **URL de objeto propias** (`File`/`Blob`): el componente las crea y las **revoca** al cambiar de archivo y al desmontar (como `GFileField`).
6. **Sin red en Grana:** las URL remotas las resuelve el navegador (`<img>`, iframe) o el adaptador de la aplicación (pdf.js con sus cabeceras y credenciales). Sin `fetch` en el componente.
7. **Ocultar un botón no protege el recurso** (§7.2, regla 2).
8. **Canvas sin capa de texto no es accesible:** el visor lo dice en la descripción del escenario cuando el renderizador no declara `text` (texto de la aplicación) y Descargar queda como alternativa (L4).

---

## 9. Conceptos

Los tres comparten **todo** lo anterior (máquina de estados, teclado, anuncios, acuses, matriz). Cambia dónde vive cada pieza y cómo se mueve.

### A · Lomo

**Forma.** Sin barra arriba: el documento empieza en el borde. Al inicio (izquierda en LTR) un **lomo** de `space × 12`: una muesca por página y una **marca con el número** de la actual que se arrastra, se pulsa o se recorre con flechas (`role="slider"` vertical). Al pasar el puntero o al enfocarlo, **asoma la página** que vas a ver (miniatura `aria-hidden`, solo visual: el valor lo da `aria-valuetext`). El lomo se abre en miniaturas (la misma columna crece a `space × 30`) y lleva el **zoom al pie** (+, porcentaje efectivo con menú, −). Abajo, un **sello** flotante une **quién es y qué hacer**: icono del tipo, nombre, «PDF · 12 págs. · 2,3 MB», y Descargar, Imprimir, Más y Ampliar (`role="toolbar"`, una parada). El escenario reserva el alto del sello abajo (medido: el pie de la última página queda por encima).

#### Qué lo hace distinto (A)

- **La navegación es el lomo, no un número:** la posición en el todo se ve (muescas proporcionales y la marca), y saltar es arrastrar por el documento. En un expediente de 80 páginas, «voy por el último tercio» se ve sin leer cifras.
- **La página asoma antes de ir:** al recorrer el lomo con el puntero o el teclado ves la página destino; reduce los saltos de prueba y error.
- **Identidad y acciones juntas:** «qué es esto» y «qué hago con esto» son una sola pregunta; el sello las responde en un sitio, y el acuse de una acción ocupa el lugar de los datos (sin cajas nuevas).
- **Movimiento:** la marca **llega** a la página con `--g-ease-spring` (desplazamiento que llega, #299); la página que asoma sigue al puntero con `--g-ease-out`. Reducido: sin desplazamientos.

**Gana:** documentos largos; el documento empieza arriba. **Arriesga:** el `slider` vertical con ↓ = siguiente **se aparta** de APG (↑ aumenta): está elegido para que coincida con desplazarse y con la página que se ve debajo; hay que medirlo con lectores (§17, L5). El sello tapa contenido en pantallas bajas si no se reserva su alto. En 375 px el sello pierde los datos (solo nombre).

### B · Crece desde la ficha

**Forma.** En reposo (página o panel) el archivo es una **ficha**: la portada es **la página donde ibas**, recortada arriba, con el folio («7 / 12») y el borde de un pliego detrás; al lado, nombre (`hN`), datos y Abrir, Descargar, Más. **Abrir hace crecer la ficha hasta el lector** (el `GDialog` nace desde su disparador, #301): las herramientas van **abajo**, en el pie (página, zoom, acciones, pantalla completa), al alcance del pulgar. Pantalla completa es la tercera profundidad del mismo diálogo. Al cerrar, la portada **se asienta** (escala 1,06 → 1 con `--g-ease-spring`) en la página donde lo dejaste y dice «Ibas en la página 7 · Volver al inicio».

#### Qué lo hace distinto (B)

- **Un objeto, tres profundidades** (ficha → diálogo → pantalla completa) con el mismo estado; no son variantes que la aplicación cablee: el archivo «se abre» como se abre una carpeta.
- **Memoria de lectura visible:** la portada es la página donde ibas, no la primera; volver a un contrato a medio revisar empieza donde lo dejaste, y «Volver al inicio» está a un clic.
- **Herramientas abajo:** en móvil el lector es pantalla completa con todo al alcance del pulgar.

**Gana:** gestores de archivos, paneles, listas con muchos documentos (la ficha es compacta). **Arriesga:** dos pasos para leer; no sirve cuando el documento **debe** leerse en la página (expediente administrativo). La memoria es de la sesión salvo que la aplicación la guarde (`v-model:page`).

### C · La frase

**Forma.** El pie del documento es una **frase**: «‹ Página _3_ de 12 › · vista _al ancho_ · _Contrato de arrendamiento.pdf_ PDF, 2,3 MB · _Descargar_ · _Imprimir_ · _más_ · _ampliar_». Cada valor subrayado con puntos es su control: la página se **escribe en el sitio** (el mismo `spinbutton`), «al ancho» abre las opciones de vista, el nombre despliega los detalles (`aria-expanded`). El acuse se añade **al final** («· Enlace copiado»), así nada se mueve bajo el puntero. Se parte como texto en móvil.

#### Qué lo hace distinto (C)

- **Los valores son los controles:** se lee el estado y se cambia en el mismo sitio, sin aprender iconos. Familia de «La frase» de `GCardGroup` y «La hora dicha» de `GTimeField`.
- **Densidad de texto:** una línea en escritorio, la mínima cromada para documentos incrustados en formularios o expedientes.

**Gana:** incrustado denso, lectura del estado. **Arriesga:** orden y plurales de la frase en otros idiomas (son de la aplicación por `labels` con plantillas); el nombre largo compite con las acciones; descubrir que «vista al ancho» se pulsa depende del subrayado.

---

## 10. Comparativa

| | Base (barra arriba) | A · Lomo | B · Crece desde la ficha | C · La frase |
| --- | --- | --- | --- | --- |
| Qué cuestiona | — | Que la navegación sea un número | Que el visor sea un sitio | Que las herramientas sean iconos |
| Documentos largos | Número + miniaturas | **Lo mejor** | Bien en el lector | Número escrito |
| Paneles y gestores | Barra apretada | Cabe; aprieta en 375 px | **Lo mejor** | Bien |
| Móvil 375 px | Barra en dos filas | Sello sin datos | Ficha compacta; lector a pantalla completa | Frase en 2–3 líneas |
| Movimiento propio | — | Marca con muelle, página que asoma | Crecer y asentarse | Ninguno |
| Riesgo | Genérico | Slider vertical ↓ = siguiente (APG) | Dos pasos para leer | Idiomas y descubrimiento |
| Semántica y estados | Iguales en todos | | | |

---

## 11. Recomendación de kiwi

**A · Lomo por defecto** (el caso fuerte del brief son expedientes y documentos largos en la página), con **B como `appearance="card"`** para gestores de archivos y paneles: al abrir, la ficha crece hasta **el lector de A** (lomo y sello dentro del diálogo), así B no trae un tercer lector. **C reservada** como apariencia compacta si se pide.

---

## 12. Qué lo hace distinto (resumen de la recomendación)

Un visor que **enseña dónde estás en el todo** (lomo con la página que asoma), **junta qué es el archivo con qué puedes hacer** (sello), **recuerda dónde ibas** entre profundidades (ficha que se asienta en tu página) y **nunca dice «hecho» sin que la aplicación lo confirme**. Todo con tokens, sin pulsos, con movimiento reducido y el mismo teclado en todas las formas.

---

## 13. Entradas propias, peso y composición

- **`@grana/vue/document-preview`** (global UMD `GranaDocumentPreview`): `GDocumentPreview`, el motor, los renderizadores `image` y `native-pdf` y un plugin. Por defecto, entrada propia (#550; kiwi estima > 8 KB gzip: motor, escenario, lomo, miniaturas, acciones). Lo compartido por `__shared`: `GBtn`, `GMenu`, `GDialog`, `GEmpty`, `GSummary`, `GProgress`, `GInput`, `GLibIcon`, `GTooltip`, `loadPhase`, `announcePage`, `topModal`, `keyFocus`.
- **`@grana/vue/document-preview/pdfjs`** (o `@grana/vue/pdfjs`): `createPdfjsRenderer(pdfjs, options)`, sin pdf.js dentro; la aplicación lo instala. Entrada separada para que quien solo vea imágenes no cargue el adaptador.
- **`formatFileSize`** pasa de `file-field` a `__shared` (L9).
- **CSS en `grana.css`**, como las demás entradas.
- Compone, sin cambiarlos: `GBtn`, `GMenu`, `GDialog`, `GEmpty`, `GSummary`, `GProgress`, `GInput`, `GTooltip` (por `GBtn tooltip`).

---

## 14. Hallazgos para lima

| # | Tema | Propuesta de kiwi |
| --- | --- | --- |
| L1 | Nombre y forma | `GDocumentPreview`, una pieza; sin subcomponentes públicos en v1. Partes en §2 |
| L2 | API de acciones | Props de archivo (`source`: `{ src \| file, name, type, size?, modified?, pages?, link? }`, el `type` lo valida la aplicación), de vista (`v-model:page`, `v-model:zoom` `{ mode, scale }`, `rotation`, `v-model:expanded`), visuales (`variant` `embedded`/`panel`, `appearance`, `density`, `meta`, `tools`: lista o `'all'`) y externas (`actions: { download, print, share, email, … }` que devuelven `Promise`; resultado de `email` = texto del acuse). Eventos `load` `{ pageCount }` y `error` `{ kind }` además de las promesas; `labels` sin valores por defecto. Reglas de disponibilidad de §7.2 (ocultar / `aria-disabled` con motivo). Compartir pierde la activación si el manejador tarda: contrato de «el `File` ya en la mano» |
| L3 | Renderizadores | Interfaz de §3.2; `renderers` como prop o en un plugin; en Grana `image` y `native-pdf`; pdf.js por adaptador en entrada aparte sin dependencia. Lista de orígenes admitidos para el iframe nativo (o solo mismo origen y `blob:`) |
| L4 | Texto, búsqueda, enlaces | Capacidades reservadas; ronda propia con pdf.js real (capa de texto accesible, búsqueda con `role="search"`, enlaces que respeten #505) |
| L5 | Lomo de A | `slider` vertical con ↓ = siguiente: decisión de lima con APG a la vista (alternativa: lista de páginas con `aria-current`, peor con cientos de páginas). Posible ampliación de `utils/slider.js` con orientación vertical |
| L6 | Landmark | `section` con nombre por defecto; prop para quitarlo cuando haya varios visores en una lista (demasiadas regiones) |
| L7 | `role="document"` en el escenario | Confirmar (alternativa: `group`) |
| L8 | Alto en `embedded` | Prop o propiedad pública de entrada (`--g-document-preview-height`, como `--g-page-header-top`) frente a flujo de página. ¿Token nuevo? kiwi propone **ninguno** (todo sale de `space`, `surface-sunken`, `mold`, `shadow-1/2`, `radius-*`) |
| L9 | `formatFileSize` | A `__shared` (hoy en `@grana/vue/file-field`) |
| L10 | Iconos | Lista de §1.1 a la librería (`icons.md`); ojo con los nombres de v1.49 (`file-question-mark`, `file-exclamation-point`) |
| L11 | Fullscreen API | Fuera de v1 (§6) |
| L12 | `GFileField` abre el visor | Punto de integración pendiente (ficha → profundidad de diálogo) |
| L13 | Para bruno | Dos escenarios sobre un estado y un documento; no pintar antes de medir; comprobación geométrica de lo visible; `watch` sin getters de arreglos nuevos (lección de bd888df) |
| L14 | Zona de marca | El escenario usa `surface-sunken` y las páginas su propio papel: medir dentro de `data-g-zone="brand"` en la auditoría; los paneles (`GMenu`) heredan la zona (no se teletransportan a `body`) |
| L15 | Personalidad | Registrar en `DECISIONS.md` la forma elegida y su «Qué lo hace distinto» |

---

## 15. Preguntas de producto (solo las abiertas)

1. **La de elección:** ¿qué forma por defecto: **A · Lomo**, **B · Crece desde la ficha** o **C · La frase**? (Recomendación: A por defecto + B como `appearance="card"`, C reservada.)
2. **Enviar por correo:** ¿Grana ofrece un diálogo de destinatarios, asunto y mensaje (compuesto con `GForm` dentro de `GDialog`), o solo emite la intención y el diálogo es de la aplicación? kiwi propone **solo la intención en v1** (cada aplicación tiene su libreta de direcciones y sus reglas).
3. **pdf.js:** ¿se acepta el adaptador opcional en una entrada aparte (la aplicación instala `pdfjs-dist`), o v1 se queda con imagen + visor nativo y el adaptador llega después?

---

## 16. Comprobaciones (medidas en el prototipo)

`node design/lab/document-preview/r01/verificar.mjs` — **135/135** (45 por motor) en Chromium 153, Firefox 155 y WebKit 26.6:

- Base: barra `toolbar` con nombre y **una** parada; → mueve el foco; escenario `role="document"` con parada, nombre y descripción «Página 1 de 12»; `spinbutton` con `aria-valuetext`; 12 páginas `role="img"`; **al cargar solo se pinta la página 1** (al ancho, cada página mide más que el escenario); ↓ en el campo → página 2 y anuncio; escribir 7 + Intro → la página 7 arriba del escenario; acercar y ajustar **conservan la página**; `+` y `0` en el escenario; miniatura actual con `aria-current="page"`; contenedor de miniaturas `tabindex="-1"` y una parada (#570).
- Carga: `aria-busy` desde el inicio; molde **oculto antes de 200 ms y visible después**; anuncio al verse.
- Acciones: correo en curso → «Enviado a …» solo tras resolver; con fallo, «failed» y nunca «Enviado»; descarga de un `File` → «Descargando», no «Descargado»; copiar enlace solo con la promesa resuelta; compartir oculto donde no existe; sin conexión, descargar `aria-disabled` con «Sin conexión».
- A: lomo `slider` vertical (↓ → 2, Fin → 12), la página asoma al enfocar (`aria-hidden`), sello `toolbar` con una parada, el sello no tapa el pie de la última página.
- B: la portada abre un `GDialog` con el lector y el foco dentro; Esc cierra; la ficha dice «Ibas en la página 7»; el documento sigue `ready` (sin recargar).
- C: frase `toolbar` con una parada que se lee de corrido.
- Mínimos: toda diana ≥ 24 × 24; sin errores de consola; a 375 px sin desplazamiento horizontal de la página.
- Plataforma: `pdfViewerEnabled` `false` en Chromium y Firefox de prueba, `true` en WebKit; `navigator.share` solo en WebKit; **mover un iframe lo recarga** en los tres; `moveBefore` lo conserva en Chromium y Firefox y no existe en WebKit.
- Revisión visual (capturas, no automatizada): tema claro y oscuro (`?theme=dark`), 1280 y 375 px, diálogo de B.

## 17. Lo que NO se verificó

- **pdf.js real** (peso, *worker*, CSP, Safari mínimo, capa de texto, búsqueda, enlaces): el PDF del prototipo está **simulado** con sus capacidades.
- **El visor PDF nativo pintando** (los navegadores sin interfaz no lo tienen); iOS Safari y Android Chrome reales.
- **Impresión real** (el banco no abre el diálogo de imprimir; se comprueba la disponibilidad): que el PDF se imprima completo y la imagen sin recortes hay que verlo en un navegador real.
- `navigator.share` con archivos en un dispositivo real.
- Lectores de pantalla (VoiceOver, NVDA) sobre el escenario `role="document"`, las páginas `role="img"`, el `spinbutton` en la barra y sobre todo **el lomo vertical con ↓ = siguiente**.
- RTL (`?dir=rtl` existe y espeja las flechas y el lomo, sin verificación automática), `forced-colors` y zoom de página al 200/400 %.
