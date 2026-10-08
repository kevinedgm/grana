# Brief — estado vacío y carga genéricos (`GEmpty` y la región que carga, nombres de trabajo), r01: base funcional y tres conceptos

> kiwi, 2026-10-08. Origen: Fase C del plan de v1, punto 14 («estado vacío y esqueleto de carga genéricos»). Componente nuevo: base funcional (WAI-ARIA, WCAG 2.2) **y** tres conceptos divergentes de forma y comportamiento (A/B/C) en la misma ronda, con los tokens reales del tema por defecto (regla del usuario, CLAUDE.md «Personalidad e innovación»).

## Para qué

Dos momentos que toda aplicación con datos tiene y que hoy cada componente de Grana resuelve a su manera:

- **Mientras llega algo**: la lista de muestras de un lote, las teselas de un panel, la ficha de un expediente. Se espera entre 100 ms y varios segundos, a veces con la página entera usable alrededor.
- **Cuando no hay nada que enseñar**, y no por la misma razón: aún no se ha registrado nada; los filtros lo dejaron en cero; el servidor falló; la persona no tiene permiso. Cada causa pide una acción distinta (crear, quitar filtros, reintentar, pedir acceso).

Lo usan administraciones, laboratorios, expedientes y paneles; con puntero, teclado, táctil y lector de pantalla. La aplicación sabe qué carga y por qué está vacío; el componente no pide datos (sin `fetch`).

## El problema de lo que hay

- **La premisa común de la carga: rectángulos grises con un brillo que barre.** Son un dibujo aproximado que alguien tiene que escribir por cada plantilla, casi nunca miden lo que medirá el contenido (la página salta al llegar), el brillo dura lo que dure la espera (WCAG 2.2.2 pide poder pararlo si pasa de 5 s junto a otro contenido) y, si la respuesta tarda 150 ms, el esqueleto **parpadea**: aparece y se va antes de leerse.
- **La premisa común del vacío: ilustración + título + texto + botón, centrados.** Un póster que ocupa media pantalla, igual para «aún no hay nada» que para «tus filtros lo dejaron en cero» o «falló el servidor», y que no dice **cómo salir**.
- **Al refrescar, se borra lo que la persona estaba mirando** para enseñar un esqueleto, y vuelve a pintarse. El contexto se pierde dos veces por segundo al teclear en un filtro.
- **En Grana** (inventario de esta ronda): `GTable`, `GWidget`, `GCard` y `GCalendar` tienen esqueleto propio con un **pulso infinito** (keyframes `g-*-pulse`); `GSummary` y `GCard` usan `border-strong` como tono y `GTable`/`GWidget`/`GCalendar` `surface-sunken` (≈ 1,08:1, casi invisible); **ninguno tiene retraso ni tiempo mínimo**; cada uno anuncia por su región; el vacío existe como slot `empty` en `GTable` (distingue filtrado), `GCard`, `GWidget`, `GWidgetGrid`, `GWidgetGallery`, `GTabs`, `GCalendar`, `GSelect`, `GTagGroup`, `GTranscript`, pero sin causa común, sin error (#327) y sin «sin permiso». `GDataList` y `GMetric` no tienen ninguno de los dos.

## Qué es esta ronda

1. **Base funcional** (forma convencional, a propósito, con el tono del tema): región con `aria-busy`, marcador decorativo e inerte, canal cortés compartido con fusión, retraso de 200 ms y 400 ms mínimos a la vista, texto visible y quietud a los 5 s, Δ0 en lo de forma conocida, foco que vuelve por clave y nunca cae en `body`, vacío con cuatro causas y su acción, RTL, movimiento reducido y colores forzados.
2. **Tres conceptos** que cuestionan las dos premisas: **A · Molde** (no hay esqueleto que dibujar: la plantilla real sin tinta; el vacío es el primer hueco), **B · Lo último conocido** (nada se queda en blanco: al refrescar, lo de antes sigue; el error no borra; el vacío por filtro dice cuántas vuelven), **C · La frase** (sin formas: la carga y el vacío se dicen con una línea, lo que se ve es lo que se oye).
3. **Comparativa, recomendación y una pregunta de elección.**

## Solapes revisados antes de proponer

| Componente | Qué comparte | Decisión |
| --- | --- | --- |
| `GTable` (#265, #327) | `loading` + `loadingRows`, filas esqueleto `aria-hidden`, región `g-table__sr` con `labels.loading`/`results`, slot `empty` con `{ filtered, clear }`, error reservado | **No se toca su forma.** Adopta el **motor** (retraso, mínimo, 5 s) sin cambiar API; su slot `empty` recibe `GEmpty` (`cause` = `filtered` si `filtered`); el `error` reservado de #327 será `GEmpty cause="error"` |
| `GCard` (#132, #136) | Esqueleto derivado de las regiones declaradas, `labels.loading`/`loaded`, `empty` con borde discontinuo | Mismo caso: adopta el motor; su slot `empty` acepta `GEmpty`. El molde de A **generaliza** su idea («la forma sale de lo declarado») a cualquier plantilla |
| `GWidget`, `GWidgetGrid`, `GWidgetGallery` | `state` con `loading`/`empty`/`error`/`stale`, mismo espacio en todos los estados | Adoptan el motor; sus slots `empty`/`error` aceptan `GEmpty`. El `stale` de `GWidget` es la idea de B en pequeño: B la lleva a cualquier región |
| `GSummary` (#352, «carga Δ0») | Huesos en cajas de línea reales, sin pulso, tono `border-strong` | **La base copia su receta** (barras en `1lh − space × 2`, sin pulso). Sus huesos se quedan: son una ficha dentro de un anfitrión que anuncia |
| `GProgress` | Barra con `role="progressbar"` y valor | **Frontera:** `GProgress` dice **cuánto** de una tarea con medida (subir, importar). El marcador de carga dice **qué forma** tendrá algo cuyo avance se desconoce; nunca lleva `role="progressbar"`. Si la aplicación conoce el avance de una espera larga, pone un `GProgress` (o la cuenta de C) |
| Isla de estado (#315 a #328) | Condiciones `error` persistentes, reintento con `busy` | **Frontera:** la isla guarda lo que afecta a la página y dura (sin conexión, servidor caído). El vacío de error dice que **esta región** no llegó y ofrece reintentar **aquí**. Si las dos existen, la región no anuncia su error (lo anunció la isla) y puede llevar una `GStatusMark` (patrón de #327) |
| `GToast` | Resultado transitorio de una acción | Sin solape: el vacío es contenido de la región, no un aviso |
| `GBtn` / `GInput` / `GSelect` / `GSwitch` `loading` | Giro de `loader-circle` en un control | Sin solape: un control que espera no es una región que carga |
| `GCombobox` / `GSelect` (líneas de estado del panel) | «Cargando», «Sin resultados», error de carga | Se quedan: son líneas de un panel con su propio teclado. `GEmpty` no entra en paneles de opciones |
| `liveRegion.js` | `createLiveWriter` (50 ms / 5000 ms) | **Se reutiliza** con un cambio: un canal cortés **compartido por la página** con fusión de lo escrito en el mismo ciclo y sin repetir textos idénticos |

## Entregables

- `index.html` (`?c=base|A|B|C`, `&dir=rtl`, `&theme=dark`, `&lat=` latencia, `&out=` respuesta, `&manual=1`), `load.js` (motor del prototipo: fases, tiempos, anuncios, foco, vacío con causa, conceptos), `load.css` (base con el tono del tema; A/B/C con los tokens reales del tema por defecto y el marcado real de `GBtn`).
- `verificar.mjs` (Playwright en Chromium, Firefox y WebKit, **solo puerto 4212**).
- `declaracion.md`: decisiones numeradas, «Qué lo hace distinto», comparativa, recomendación, comprobaciones, hallazgos L1… para lima y la pregunta de elección.

## Ver

`node design/lab/empty-skeleton/r01/verificar.mjs` (levanta su servidor en 4212; `ENGINES=chromium`, `PARTS=A`, `VERBOSE=1`, `SHOTS=<carpeta>`). Para mirar a mano, `python3 -m http.server 4212` desde la raíz y abrir `/design/lab/empty-skeleton/r01/index.html`. Requiere `packages/vue/dist` (`npm run build`) para los tokens y la fuente.
