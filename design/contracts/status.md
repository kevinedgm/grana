# Contrato · Isla de estado (gestor `createStatus`, región `GStatusIsland`, marca `GStatusMark`, declarativo `GStatus`)

**Dueño:** lima · **Estado:** aprobado y **enmendado por la ronda r03/r04** (2026-10-19, DECISIONS.md **#693 a #705**): la isla pasa a ser **transitoria** (decisión del usuario: «un error no se queda», «siento que estorba») con la forma **D1 · Cápsula de relevo** (`design/lab/alert/r04/declaracion.md`, elegida por el usuario) y la estética **V2C · Cristal con filo** en oscuro y **L1 · Grafito esmerilado** en claro (`design/lab/alert/r04/estilo.md`, elegidas por el usuario). **Construida** por coco (`GStatusIsland.css`, `GStatusMark.css`, 74e2404) y bruno (`.vue`, motor y pruebas, 3f8f39b), en `draft`; **pendiente la auditoría de coco** sobre el componente real. Peso y precisiones de construcción: **#706** y **#707**. · **Basado en:** `design/lab/alert/r01/` (base funcional, 27 puntos), `r02/` (B · isla, D1 a D5), **`r03/declaracion.md`** (ciclo reproducido, F1 a F4, R1 a R5, concepto D), **`r04/declaracion.md`** (D1, §6 y §7), `auditoria-movimiento.md` (coco: F1 a F3, M1 a M3, I1 a I5), `r04/estilo.md` (coco) y la rúbrica `docs/documentacion/rubrica-movimiento.md` · **Compone:** `dialog.md` (hoja móvil), `btn.md`, `GIcon` interno · **Convive con:** `toast.md`, `speech.md` §6.7, `page-header.md`, `fab.md`, `form.md` (`GErrorSummary`, `GFormActions`), `dialog.md` (traslado al modal superior) · **Decisiones:** DECISIONS.md #315 a #328 y **#693 a #707** (#319, #324 y #325 sustituidas; #315, #316, #318, #320, #322, #323 y #692 enmendadas)
**Tags:** `g-status-island` (región, una por aplicación) · `g-status-mark` (marca junto al origen) · `g-status` (declarativo, sin pintura) · **Categoría:** comunicación y estado
**Componente complejo** (CLAUDE.md «Modelos por rol»: servicio con estado y motor de tiempo, se posiciona sobre otros elementos, traslado al modal, compone `GDialog` y `GBtn`): **coco y bruno en Opus**.

Una **cápsula transitoria** en el borde superior del visor que dice **lo que está pasando y tiene estado** (sin conexión, sesión por caducar, mantenimiento, el servidor falló al guardar o al cargar, un resultado que vuelve a su origen) y **se va**: cae del borde, se lee, se recoge subiendo. **La memoria no flota:** lo que sigue pendiente se queda en el **modelo**, en la **marca** junto a su control (`GStatusMark`) y en **Alt+F8**. Vive **fuera del flujo: nunca empuja ni mueve el contenido.**

---

## Principios

- **Una condición es estado, no suceso** (#318). Tiene **clave** (`id`): declararla otra vez la actualiza en el mismo elemento; dura en el **modelo** hasta que la aplicación la quita, se resuelve, la persona la descarta o **su origen sale del documento** (#697). Por eso hay API imperativa con clave y el declarativo `<GStatus>`, que limpia al desmontarse.
- **Transitoria a la vista, persistente en el modelo** (#693). La isla **muestra** y **se recoge sola** tras el tiempo de lectura (#142), en pausa mientras se usa. «No desaparece mientras dure alguna condición» vale para el **modelo**, no para la pantalla: la vuelta a lo pendiente es la marca y Alt+F8, y la lista que abren.
- **Nada se mueve, nunca** (D1, #316). La isla y sus cambios no alteran la posición de ningún elemento de la página.
- **Nada se abre solo** (#696). Ni el asomo ni la lista se abren sin un gesto de la persona. Sin apertura automática, sin punto, sin «Entendido».
- **Nunca toma el foco** (#320, #698). Ni al aparecer ni al relevarse. Al recogerse con el foco dentro, el foco **nunca** acaba en `body`.
- **Lo que hay que hacer no se pierde** (WCAG 2.2.1, #696). Lo que lleva acción o cuenta atrás solo se recoge por tiempo si tiene otra vuelta **visible** (su marca enlace montada); una cuenta atrás **no se recoge nunca por tiempo**.
- **Un suceso, un canal.** O aviso flotante (`GToast`) o isla (frontera abajo, #704); o resumen de validación (`GErrorSummary`) o isla. La validación **nunca** va a la isla.
- **Toda transición parte del estado actual** (#702): ninguna acción espera a que termine un movimiento, todo movimiento se puede interrumpir o invertir.
- **Solo texto** (#139): título, descripción, un enlace, una acción, un detalle técnico. Sin slots ni HTML en la isla.
- **Sin textos por defecto** (#226): `labels` del gestor, todos sin valor.
- **Sin red ni globals:** el gestor no usa `fetch` ni toca `document`/`window` al importarse ni al crearse (SSR).
- **Se reutiliza:** `GDialog` (hoja móvil), `GBtn`, `GIcon` interno, `utils/liveRegion.js`, `utils/topModal.js`, `utils/edgeReserve.js`, `utils/template.js` (`fill`), las constantes de lectura de `GToast` (`TOAST_DURATION` y el mínimo al reanudar `RESUME_MIN`, #142, por `__shared`, sin copia; #707), el umbral de hoja `space × 130` (#103).

## Frontera (#704; sustituye la tabla de r01)

**Regla:** si cuando el aviso se va **no queda nada pendiente**, es `GToast`; si **queda algo pendiente** (reintentar, esperar la conexión, renovar la sesión, volver a lo creado desde su origen), es la isla. **Dos servicios con una regla, no uno**: fusionar la isla en `GToaster` duplicaría su gestor con reglas de error contrarias (un error de `GToast` no se cierra solo porque no tiene otro sitio donde vivir, #142; el de la isla se recoge porque vive en su marca).

| Necesidad | Usar |
| --- | --- |
| Algo que **pasó** y no deja nada que hacer («Copiado», «Cambios guardados», «Informe subido») | `GToast` |
| Validación de un `GForm` (incluidos 422 y errores generales de `errors`) | `GErrorSummary` + mensaje del campo |
| Error o ayuda de un campo | mensaje del campo |
| Decisión obligatoria antes de seguir | `GDialog role="alertdialog"` |
| Estado breve del envío junto a los botones («Guardado hace 2 min») | `status` de `GFormActions` |
| Estado de una tarjeta | `status` + `retryable` de `GCard` |
| **El servidor falló** (500, tiempo agotado, sin red) y no se arregla en un campo | **isla** + marca enlace junto al origen |
| **Condición que dura** (mantenimiento, solo lectura, sesión por caducar, sin conexión) | **isla** (y, si debe verse siempre, una `GStatusMark` de texto en la cabecera de la aplicación) |
| **Resultado de una condición** (error → reintentando → «Factura guardada · Ver factura») | **isla**, en el mismo elemento (D4); vuelve a su marca si tiene enlace |
| Advertencia o información que es **contenido** de una sección, tarjeta o diálogo | **marca de texto** (`GStatusMark` sin `for`); **no entra en la isla** |

## Entrega (API pública)

Exportaciones de la **entrada propia `@grana/vue/status`** (#317, #328; global UMD `GranaStatus`; `app.use(status)` registra también `GStatusIsland`, `GStatusMark` y `GStatus`; **no** están en el paquete principal):

| Exportación | Qué es |
| --- | --- |
| `createStatus(options?)` | Crea el **gestor**. Es plugin de Vue: `app.use(status)` lo provee |
| `useStatus()` | Devuelve el gestor provisto; sin gestor, aviso y `undefined` |
| `statusKey` | Clave de inyección |
| `GStatusIsland` | Pinta **la** isla del gestor. Se monta **una vez**, lo más alto posible y **después** de `<GToaster />` y `<GSpeechHost />` si existen |
| `GStatusMark` | Marca junto al origen (enlace a la isla, memoria de lo pendiente) o línea de texto de una sección |
| `GStatus` | Declarativo sin pintura: registra una condición mientras está montado |

```js
// main.js
import { createStatus } from '@grana/vue/status'
export const status = createStatus({ labels: { /* textos de la app */ } })
createApp(App).use(status).mount('#app')
```

**Empaquetado (#328, #705, #706).** `dist/status.js` y `dist/status.umd.js`; lo compartido con el principal (`GBtn`, `GDialog`, `GIcon`, `liveRegion.js`, `topModal.js`, `edgeReserve.js`, `TOAST_DURATION`) llega por `__shared` (#240) **sin duplicarse**. El CSS sigue en `grana.css`. Peso: «Encargos y peso».

```vue
<!-- App.vue -->
<RouterView /> <GToaster /> <GStatusIsland />
```

```js
const status = useStatus()
status.error('save', 'No se pudo guardar la factura', {
  description: 'El servidor no respondió.',
  details: 'POST /api/facturas · 500',
  action: { label: 'Reintentar', busyLabel: 'Reintentando…',
    // cumplida con un objeto de type 'success' = resolve: limpia description, details, action y deadline (#697)
    onClick: () => save().then((f) => ({ type: 'success', title: 'Factura guardada', link: { label: 'Ver factura', href: f.url } })) },
  origin: { label: 'Ir al formulario', target: 'invoice-form' }   // vive con su origen: si el formulario sale del documento, se retira
})
status.resolve('offline', 'Conexión restablecida')   // condición → resultado en el mismo elemento, sin la descripción vieja
status.remove('maintenance')
```

```vue
<!-- junto al origen: la memoria de lo pendiente -->
<GFormActions><GStatusMark for="save">No se guardó</GStatusMark><GBtn type="submit">Guardar</GBtn></GFormActions>
<!-- en la vista: vive mientras la vista esté montada y el fallo dure -->
<GStatus v-if="loadFailed" id="invoices" type="error" title="No se pudieron cargar las facturas"
         :action="{ label: 'Reintentar', onClick: reload }" :origin="{ label: 'Ir a Facturas', target: 'invoices-table' }" />
```

### Opciones del gestor (`createStatus(options)` y `configure(patch)`)

| Opción | Tipo | Valores | Default | Regla |
| --- | --- | --- | --- | --- |
| `position` | String | `top-center` `top-start` `top-end` | `top-center` | Lógica (`start`/`end` siguen el `dir`). Siempre arriba, también en móvil |
| `offset` | Object | `{ top? }`: Number (px) o String (longitud CSS) | `{}` (función) | Reserva para una cabecera fija; se suma al margen, a `safe-area` y a la reserva del borde |
| `hotkey` | String \| `false` | sintaxis de `aria-keyshortcuts` | `'Alt+F8'` | Abre la lista y vuelve. `false` lo quita. `F6` o ilegible: se rechaza y se conserva el anterior. `F8` o `Shift+F8`: se acepta con aviso |
| **`duration`** | `'auto'` \| Number \| `false` | `'auto'`; ms ≥ 5000; `false` | `'auto'` | **Tiempo de lectura** de cada titular (#696). `'auto'` = `clamp(5000, 2000 + 60 × n, 12000)` ms con `n` = caracteres de título + descripción (`TOAST_DURATION`, #142). Un número < 5000: aviso y 5000. **`false`: la isla no se recoge por tiempo** (el titular se queda hasta que la persona lo oculta o la condición cambia); es la preferencia «no ocultar solo» que la aplicación ofrece a quien la necesite (WCAG 2.2.1 «desactivar»). En vivo: el tramo en curso sigue con su tiempo y el siguiente usa el nuevo |
| `labels` | Object | ver «Textos» | `{}` (función) | Sin valores por defecto |

`configure(patch)` fusiona (y `labels` y `offset` por clave), aplica en vivo y no reanuncia. Valor fuera de lista: aviso y se conserva el anterior. **Retirada (#696): `autoOpen`** (nada se abre solo); pasarla avisa y se ignora. **Rechazados:** `limit` (la lista desplaza), `position` abajo, `duration` por condición (la lectura depende del texto; la aplicación elige el tiempo para todas).

### Modelo de una condición (`set(id, options)`)

| Opción | Tipo | Valores | Default | Regla |
| --- | --- | --- | --- | --- |
| `type` | String | `info` `success` `warning` `error` | `info` | Icono, color, canal y gravedad. `error` lee el color `danger` (#133) |
| `title` | String | **obligatorio** | | Sin título: aviso y no se registra (`set` devuelve `null`) |
| `description` | String | texto libre | sin valor | Se ve en el **asomo** y en la lista; entra en el anuncio y en el tiempo de lectura |
| `details` | String | texto libre | sin valor | **Detalle técnico**, solo en la lista: Disclosure cerrado, `dir="ltr"`, se parte en 320px, con «Copiar» |
| `action` | Object | `{ label, busyLabel?, onClick(condition) }` | sin valor | **Una**. Ver «Acción y resolución en el sitio» |
| `link` | Object | `{ label, href, target?, rel?, onClick?(event, condition) }` | sin valor | **Uno**. `<a>` nativo; `onClick` recibe el evento **cancelable** (router de la aplicación). Activarlo recoge la isla |
| `origin` | Object | `{ label, target }`; `target`: `id`, `Element` o función que lo devuelve | sin valor | Botón «Ir a…»: recoge la isla y enfoca el origen (`tabindex="-1"` temporal si no es enfocable, `scrollIntoView` `nearest`). **Vive con su origen** (#697): ver «Retirada» |
| `persistent` | Boolean | | `type !== 'success'` (se recalcula con `type` mientras la aplicación no lo fije) | `true` = **condición**: tras recogerse sigue en el modelo. `false` = **resultado**: tras recogerse se retira, salvo la excepción de «Qué queda al recogerse» |
| `dismissible` | Boolean | | `false` | «Descartar» en la lista: quita **solo** esa condición del modelo (motivo `dismiss`) |
| `deadline` | Number \| Date | marca de tiempo | sin valor | Cuenta atrás (WCAG 2.2.1): `m:ss` en lugar del anillo, `role="timer"` con `aria-live="off"`; anuncios en los umbrales; **no se recoge por tiempo**; `onExpire` al llegar a cero (la condición **no** se quita sola) |
| `politeness` | String | `polite` `assertive` | `assertive` en `error`; `polite` en el resto | Como `GToast` |
| `onRemove` | Function | `(reason, condition) => void` | sin valor | Una vez, al retirarse del modelo |
| `onExpire` | Function | `(condition) => void` | sin valor | Una vez, cuando `deadline` llega a cero |

**Rechazados:** `icon`, `actions` en plural, slots/HTML/`component`, `sticky`, `headingLevel`, `duration` por condición. Opción desconocida: se ignora con aviso.

**Forma de solo lectura** (`status.conditions[i]`, `get(id)`, y la **copia** que reciben `onClick`, `onRemove` y `onExpire`): las opciones resueltas más `id`, **`seen: boolean`** (sustituye a `acknowledged`, #697: la condición ya se mostró y se leyó, se ocultó o se vio en la lista), `busy: boolean`, `since: number` (creación o último cambio de `type`) y `updatedAt: number`.

**Motivos de retirada del modelo (`reason`):** `dismiss` («Descartar») · **`read`** (un resultado que se recogió, #697; sustituye a `acknowledge`) · `api` (`remove`, `resolve` sin resultado) · `clear` · `unmount` (`<GStatus>` desmontado) · **`origin`** (su origen salió del documento, #697).

### El gestor

| Método | Firma | Devuelve | Hace |
| --- | --- | --- | --- |
| `set` | `set(id, options)` | `id` o `null` | **Declara**. `id` nuevo: la crea y la pone a mostrar. `id` existente: **sustituye** su declaración en el mismo elemento; si cambia `type`, `title` o `description`, vuelve a `seen: false` (se anuncia y se vuelve a mostrar) |
| `info` · `success` · `warning` · `error` | `(id, title, options?)` | `id` | Atajos de `set(id, { ...options, type, title })` |
| `update` | `update(id, patch)` | `true` si existía | Fusiona `patch` en el sitio (mismas reglas de `seen` que `set`) |
| `resolve` | `resolve(id, result?)` | `true` si existía | Con `result` (String = título, u Object): pasa **en el mismo elemento** a `type: 'success'`, `persistent: false`, **sin `description`, sin `details`**, sin `action`, sin `busy`, sin `deadline`, más **solo** lo que traiga `result` (R5, #697). Sin `result`: `remove(id)` |
| `remove` | `remove(id)` | `true` si existía | La retira (motivo `api`) |
| `clear` | `clear()` | | Retira todas (motivo `clear`) |
| `announce` | `announce(id)` | `true` si existía | **Vuelve a anunciar** y a **mostrar** la condición tal como está (`seen: false`; segundo fallo idéntico, r01 L5) |
| **`hide`** | `hide()` | | Recoge la isla ya: lo que se mostraba y lo que esperaba pasa a `seen` (lo mismo que Esc). Sustituye a `acknowledge()` (#697) |
| `open` | `open(id?, { focus = false }?)` | `true` si hay condiciones | Abre la **lista** (en móvil, la hoja); con `id`, desplaza a esa condición. **No mueve el foco** salvo `focus: true` (solo para gestos de la persona; la marca lo usa) |
| `close` | `close()` | | Cierra la lista y recoge la isla (no mueve el foco si estaba fuera) |
| `has` · `get` | `(id)` | Boolean · copia o `undefined` | Lectura |
| `configure` | `configure(patch)` | | Ver arriba |
| `conditions` | propiedad reactiva de solo lectura | `Condition[]` | En el **orden de la lista** |
| `state` | propiedad reactiva de solo lectura | `{ form: 'empty' \| 'line' \| 'list', peek: boolean, paused: boolean, current: id \| null, waiting: number, count: number, mobile: boolean }` | Para la aplicación y las pruebas (`current` = la que muestra el titular; `waiting` = las que esperan su turno; `count` = las del modelo) |
| `install` | `install(app)` | | `provide(statusKey, status)` |

Ningún método lanza: devuelven `false`/`null` y avisan en desarrollo. En el servidor guardan estado y no arrancan nada. **Retirado: `acknowledge()`** (llamarlo avisa y hace `hide()`).

### Acción y resolución en el sitio (#318, enmendado por #697)

1. La persona activa la acción: se llama a `action.onClick(copia)`.
2. Si devuelve una **promesa**, la condición pasa a **`busy`**: `aria-busy="true"` e `is-busy` en su elemento, insignia `loader-circle` que gira (también en su marca), botón **enfocable** con `aria-disabled="true"` y `busyLabel` (se anuncia por el canal cortés). Otra pulsación no hace nada. **Mientras dura `busy`, la lectura está en pausa** (no se recoge lo que está en curso). Nunca `loading` ni `loadingText` de `GBtn`.
3. **Se cumple con un objeto:** si el objeto trae `type: 'success'`, se aplica como **`resolve(id, objeto)`** (limpia descripción, detalle, acción y cuenta atrás: así un éxito no arrastra la traza del 500, F4); si no, `update(id, objeto)`. **Se cumple con otra cosa:** solo termina `busy`.
4. **Se rechaza:** termina `busy`, la condición queda como estaba y **se vuelve a anunciar y a mostrar** (`announce(id)`). El gestor consume el rechazo.
5. Si no devuelve promesa, no hay `busy`.
6. Todo ocurre en el **mismo elemento** (D4): en el titular, el texto nuevo entra con el relevo; en la lista, el mismo `li`. Si el cambio reordena la lista, el nodo se mueve y bruno restituye el foco si estaba dentro.
7. Si la condición se retira con la promesa pendiente, el desenlace **no la vuelve a crear**.

### Retirada: una condición vive con su origen (R4, #697)

Una condición con `origin` se retira del modelo (motivo `origin`, **sin anuncio**) cuando su destino, **que llegó a existir**, deja de estar en el documento (la vista se fue). Un destino que aún no existe al declarar no la retira. bruno lo comprueba **sin coste por cuadro**: un `MutationObserver` (`childList`, `subtree`) sobre el documento **solo mientras haya alguna condición con `origin`**, con las comprobaciones agrupadas en un cuadro; con `target` función, se evalúa en esa comprobación. Sin `origin`, la retira la aplicación (o `<GStatus>` al desmontarse).

## Formas (#696; sustituye «Las tres formas» de #319)

Una sola superficie (`g-status-island__shape`) que cuenta la vida del aviso: **cápsula vacía → titular → (asomo · lista) → cápsula vacía → nada** (D4). `data-form` en la raíz:

| Forma | `data-form` | Cuándo | Qué se ve |
| --- | --- | --- | --- |
| Vacía | `empty` | Nada que mostrar (el modelo puede tener condiciones ya vistas) | La `section` está `hidden`; la raíz y los canales siguen montados |
| **Titular** | `line` | Hay una condición mostrándose, entrando o recogiéndose | Una línea: insignia con el **anillo de tiempo** (o `m:ss` con `deadline`), título (elipsis si no cabe; el texto completo está en el nombre accesible y en la lista), «+N» si esperan otras, chevrón decorativo |
| **Asomo** | `line` + `is-peek` | Puntero encima, foco dentro, o un toque (ver «Asomo táctil») | El titular **crece hacia abajo** y enseña la descripción, la acción, «Ir a…», el enlace y «Ocultar». La cuenta atrás **no se repite**: sigue en el titular, que el asomo no tapa (#707). La lectura está en pausa |
| **Lista** | `list` | La persona la abre: activar el titular, la marca, Alt+F8, `open()` | El resumen dice `labels.listTitle` («Pendiente (N)»); debajo, **todas** las condiciones del modelo con su detalle técnico y «Descartar»; «Cerrar». En móvil, la lista es una **hoja** (`GDialog`) |

**Etapas** (`data-stage` en la raíz, **solo mientras dura el movimiento**; sin atributo en reposo):

| `data-stage` | Qué pasa | Forma |
| --- | --- | --- |
| `drop` | La cápsula **sin texto** cae del borde superior hasta su sitio | `line`; tamaño de cápsula (`space × 24` × fila), no el medido |
| `grow` | La cápsula se ensancha hasta el titular medido; entra el texto | `line`; de la cápsula a `--_island-w/-h` |
| `fold` | El texto sale y la cápsula se estrecha hasta el tamaño de cápsula | `line` |
| `rise` | La cápsula sube por el borde y se funde | `line`; al terminar, `empty` |

bruno avanza de etapa al terminar las transiciones de esa etapa en `__shape` (`transitionend`/`transitioncancel` de su propio elemento) o, si la etapa no tiene ninguna en curso (`getAnimations()` vacío: movimiento reducido), en el cuadro siguiente. **El primer cuadro visible nunca tiene un tamaño ajeno** (F1/F2 convertidas en regla, #701): en `drop` el tamaño es el de la cápsula (constante del CSS), y bruno escribe `--_island-w/-h` del destino **medido antes de mostrarlo** (contenido de destino montado e invisible, sin transición) antes de pasar a `grow`; al vaciarse, `--_island-w/-h` se borran. **La isla nunca se funde vacía** (I4): lo que se recoge se va con su texto; bruno conserva la copia de la condición mostrada hasta el fin de `rise` aunque el modelo ya la haya retirado. Así `hidden` llega **después** de la salida y no hace falta transición de `display` (F3, Firefox).

## Lectura y relevo (#696)

### Tiempo

- Cada titular se muestra su **tiempo de lectura**: `duration` del gestor (`'auto'`: `clamp(5000, 2000 + 60 × n, 12000)` ms, `n` = caracteres de título + descripción; constantes de `GToast`, #142).
- **El tiempo empieza cuando el texto ya se ve** (fin de `grow`), no durante la caída.
- **Se ve:** un **anillo alrededor de la insignia** que se vacía con el tiempo y se queda quieto en pausa (`is-paused`: la pista del anillo se completa; ninguna animación). Es solo visual (`aria-hidden`). Con `deadline`, el anillo cede el sitio a `m:ss`. **Sin tiempo que contar** (#707): con `duration: false` no hay tramo y el anillo queda **lleno y quieto** (`is-paused`, porque `duration: false` es causa de pausa); una condición que **no puede recogerse** (abajo) gasta su tramo y deja el anillo **vacío y quieto**, sin `is-paused`: su tiempo de lectura pasó y espera a la persona. Ese anillo vacío es lo contratado; no hay otro estado visible (la acción está en el asomo y el titular no se va).
- **Pausa** (`is-paused`), mientras se cumpla cualquiera: puntero sobre la isla o sobre una marca enlace de una condición mostrada o en espera; foco dentro de la isla o en esa marca; un dedo o lápiz apoyado en la isla; el asomo abierto por un toque; la lista abierta; la condición mostrada `busy`; `document.visibilityState === 'hidden'`; `duration: false`. **Al reanudar** sigue el tiempo que quedaba, **con un mínimo de 1000 ms** (#142); nunca se reinicia.
- **Datos para el anillo** (sin escrituras por cuadro): bruno escribe en `__shape` **`--_left`** (número 0–1: fracción que queda al empezar el tramo) y **`--_run-ms`** (número: ms del tramo) al empezar cada tramo (inicio de lectura, reanudación) y, al pausar, `--_left` con la fracción actual más `is-paused`. Cada tramo es un elemento nuevo de `g-status-island__ring` (clave por tramo en el `.vue`) para que su animación empiece desde `--_left`. coco lo anima de `--_left` a 0 en `--_run-ms`, detenido con `is-paused`. El gestor manda: el anillo es indicativo.

### Relevo por gravedad

- **Cola de lo que hay que mostrar:** las condiciones con `seen: false`. Orden de turno: gravedad (`error` → `warning` → `info` → `success`) y, dentro, **por orden de llegada** (se leen en el orden en que pasaron). La lista (forma `list`) conserva el orden de siempre: gravedad y, dentro, la más reciente primero.
- **Una cada vez, en la misma cápsula:** al acabar el tiempo de la actual, pasa a `seen` y entra la siguiente con el **relevo** (el texto nuevo entra desde abajo y el ancho se ajusta), **sin que la cápsula desaparezca** entre una y otra.
- **Lo más grave pasa delante:** si llega una condición de **más gravedad** que la mostrada, la **releva al momento**; la relevada vuelve a la **cabeza** de la cola con el tiempo que le quedaba (mínimo 1000 ms). Una de igual o menor gravedad espera su turno.
- **Nunca se releva bajo la mano** (#702): mientras la lectura está en pausa por la persona (puntero, foco, dedo, asomo, lista) o la mostrada está `busy`, **nada la releva**; lo nuevo espera, sube «+N» y se anuncia igual (por su canal, al llegar). El relevo pendiente ocurre al terminar la pausa.
- **La copia que sale** (#707): el titular viejo se queda un `--g-duration-slow` como **otro `__text` con `aria-hidden="true"`** (mismo elemento de clase, clave por condición; fuera del nombre accesible del resumen) y sale hacia arriba mientras el nuevo entra desde abajo en la misma celda; bruno la quita al terminar su transición. Con la lista abierta no hay copia.
- **«+N»** = cuántas **esperan** su turno (no el total). Texto oculto `fill(labels.waiting, { count })`. Sin espera, no hay «+N».
- **El relevo no anuncia** (#698): cada condición se anunció al llegar.
- **En el sitio** (D4): un cambio de la condición mostrada (`resolve`, el desenlace de la acción, `update` que cambia título o descripción) entra con el mismo relevo de texto y empieza **su** tiempo.
- **Si la mostrada se retira del modelo:** entra la siguiente con el relevo; si no hay, se recoge con su texto (I4).

### Qué queda al recogerse

| La condición | Tras recogerse |
| --- | --- |
| **Condición** (`persistent: true`) | Sigue en el modelo (`seen: true`): en su **marca** enlace, en **Alt+F8** y en la lista |
| **Resultado** (`persistent: false`) **sin `link`** | Se retira del modelo (motivo `read`) |
| **Resultado con `link`** | Se queda mientras su **marca enlace esté montada** (vuelve con ella: «Guardada · Ver factura»); sin marca montada, se retira (motivo `read`). El enlace es una comodidad, no lo que hay que hacer |

### Lo que no se recoge solo (WCAG 2.2.1)

- **Cuenta atrás (`deadline`):** el titular **no se recoge por tiempo** (avisar y dejar ampliar). La persona puede ocultarlo; **cada umbral de anuncio** (5 min, 1 min, 30 s) **lo vuelve a mostrar** (`seen: false`), con su anuncio.
- **Condición con `action` sin otra vuelta visible:** si su marca enlace (`GStatusMark for`) **no está montada** (conectada y con caja), el titular **no se recoge por tiempo**: se queda con su acción al alcance (asomo) hasta que la persona lo oculte o la condición cambie. Con marca montada, se recoge y la acción sigue en la marca y en Alt+F8. Una acción con tiempo es una carrera (#142); con la marca deja de serlo. Aviso de desarrollo 14. **Cómo se queda** (#707): lee su tramo como cualquiera; al acabar, si espera algo **aún sin leer** (de cualquier gravedad), le cede el turno y vuelve a la cabeza con 1000 ms; cuando no queda nada sin leer, se queda en el titular con el anillo vacío hasta «Ocultar», Esc, `hide()`, la lista, el foco tapado o un cambio de la condición. Que su marca se monte **después** no la recoge (no se vuelve a evaluar mientras se queda).
- **`duration: false`:** nada se recoge por tiempo.
- En esos casos **sigue habiendo relevo**: lo más grave pasa delante con las reglas de arriba, y lo que no puede recogerse vuelve a la cabeza de la cola.

### Recogerse

Se recoge (`fold` → `rise`) cuando:
1. Acaba el tiempo de la mostrada, no queda nada en la cola y nada impide recogerla (apartado anterior).
2. **«Ocultar»** en el asomo: la mostrada pasa a `seen`; si esperan otras, relevo; si no, se recoge.
3. **Esc** (ver «Teclado»), **`hide()`**: todo lo mostrado y en espera pasa a `seen` y se recoge.
4. **Cerrar la lista** («Cerrar», activar el resumen, Esc, pulsar fuera, Alt+F8 desde dentro, `close()`): abrir la lista ya enseñó todo, así que todo pasa a `seen` y se recoge.
5. **«Ir a…»** y el **enlace**: se recoge (y «Ir a…» enfoca el origen).
6. **El foco va a algo que la isla tapa** (WCAG 2.4.11): si el foco, fuera de la isla, cae en un elemento que el titular, el asomo o la lista tapan aunque sea en parte, la lista y el asomo se cierran y la isla **se recoge al momento sin mover el foco**. **Es `hide()`** (#707): lo mostrado **y lo que espera** pasa a `seen`; si solo pasara lo mostrado, lo que espera caería otra vez sobre el foco. Sin motivo propio: `seen` no retira del modelo, y un resultado sin enlace se retira con `read`, como en cualquier recogida. Sustituye al aviso 13 de la versión anterior: la isla ya no tapa nada que se use.
7. El modelo se vacía.

### Eco en la marca (#700)

Al empezar **`rise`**, cada condición mostrada en este ciclo que **sigue en el modelo** y tiene una marca enlace **visible** (conectada, sin `inert` ni `hidden` en sus ancestros y con su caja dentro del visor) recibe **un eco**: `is-echo` en la marca, una vez (bruno la pone y la quita en `animationend`/`animationcancel`). **Sin marca visible, no hay eco** (ni se guarda para después): la marca fuera del visor o bajo un modal no se anima (riesgo 5 de la rúbrica). El eco no anuncia.

## Interrupciones (#702; riesgo 1 de la rúbrica)

**Toda transición parte del estado actual.** Todo lo interrumpible (caída, ensanche, asomo, lista, relevo, recogida, subida) son **transiciones de CSS**, no keyframes, y bruno **nunca** reinicia un movimiento desde su origen (sin «quitar clase, forzar estilo, poner clase» a mitad de un movimiento). Keyframes solo para lo que no se interrumpe: el eco, el giro y el anillo (que se para con `animation-play-state`).

| Pasa esto | Durante | Resultado |
| --- | --- | --- |
| Llega algo nuevo (o `announce`, o un cambio de la mostrada) | `fold` | **Se cancela la recogida:** vuelve a `grow` desde el ancho actual, con el texto de lo que toca mostrar |
| Llega algo nuevo | `rise` | Vuelve a `drop` desde la posición actual (baja otra vez, sin reaparecer desde fuera) y sigue a `grow` |
| Puntero, foco o dedo sobre la isla, o sobre la marca de lo mostrado | `fold` o `rise` | **Se cancela la recogida** igual; la lectura queda en pausa y, al reanudar, tiene 1000 ms |
| Puntero, foco o dedo | `drop` o `grow` | **La entrada sigue** (no es un tiempo de la persona: ≤ 480 ms). La lectura empezará en pausa |
| «Ocultar», Esc, `hide()` | `drop` o `grow` | Pasa a `fold` desde el tamaño y la posición actuales |
| Activar el titular, la marca, Alt+F8, `open()` | cualquier etapa | La lista se abre desde el estado actual (se quita `data-stage`) |
| La mostrada cambia de texto | `grow` | El destino se vuelve a medir y el ensanche sigue hacia el nuevo tamaño desde el actual |
| El modelo se vacía | `drop` o `grow` | Pasa a `fold` con la copia de lo mostrado |
| Cruzar el umbral móvil | lista abierta | La lista (o la hoja) se cierra y la isla se recoge, como antes |

**Ninguna acción espera a que acabe un movimiento**: el resumen, la acción, «Ocultar» y Esc responden en todas las etapas (los controles del asomo solo existen cuando el asomo se ve). Con movimiento reducido, las mismas reglas (los cambios son fundidos de `--g-duration-fast`).

## Asomo táctil y asomo por puntero (#703; riesgo 2 de la rúbrica)

| Modalidad | Asomo | Lista |
| --- | --- | --- |
| **Ratón o lápiz con hover** (`pointerType` `mouse`/`pen` y `@media (hover: hover)`) | Al pasar el puntero por la isla; se cierra al salir (la lectura reanuda con lo que quedaba, mínimo 1000 ms) | Clic en el titular |
| **Teclado** | Al enfocar el resumen o cualquier control del asomo; Tab recorre la acción, «Ir a…», el enlace y «Ocultar»; se cierra al salir el foco | Enter o Espacio en el resumen, Alt+F8 |
| **Toque** (`pointerType` `touch`, o `pen` sin hover) | **Primer toque en el titular = asomo** (el `click` de ese toque no abre la lista). La lectura queda en pausa mientras el asomo esté abierto | **Segundo toque en el titular** (ya en asomo) |

- **Cerrar el asomo táctil:** tocar fuera de la isla (`pointerdown` fuera de la isla y de toda `g-status-mark--link`), «Ocultar» (recoge), o activar la acción, «Ir a…» o el enlace. Al cerrarse por un toque fuera, la lectura **reanuda** con lo que quedaba (mínimo 1000 ms). No mueve el foco.
- **Seguridad del toque** (WCAG 2.5.2): el asomo **crece hacia abajo** y nada aparece bajo el punto del primer toque; la acción nunca queda donde estaba el dedo. bruno lo prueba: el rectángulo de la acción no contiene el punto del toque.
- **Por qué el toque y no la acción siempre visible** con `pointer: coarse`: el titular sigue siendo **una línea** (proporción de isla en 320px), el primer toque no puede activar nada por error, y la pausa mientras el asomo está abierto da el tiempo que con puntero da el hover. La acción también sigue en la marca.
- **Esc con el asomo abierto por el puntero y el foco fuera** (WCAG 1.4.13, «descartable»): una escucha de documento **en captura, solo mientras el asomo está abierto por el puntero**, cierra el asomo y **recoge la isla**, con `preventDefault()` y **sin** detener la propagación (convención de `tooltip.md`: un componente ignora un Esc con `defaultPrevented`).
- **1.4.13:** el asomo por puntero es **persistente** mientras el puntero está sobre la isla y **se puede recorrer** con él (el asomo es parte de la misma superficie, sin hueco); se descarta con Esc.

## `GStatusIsland`

### Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `status` | Object (gestor) | | el inyectado (`statusKey`) | propia |

Sin eventos públicos ni slots. Dos `GStatusIsland` del mismo gestor: la segunda no pinta nada y avisa.

### Estructura accesible

```html
<div class="g-status-island g-status-island--position-top-center" id="ID" popover="manual"
     data-position="top-center" data-align="center" data-form="line" data-type="error">   <!-- + data-stage, data-mobile, is-ready, is-peek, is-paused -->
  <div class="g-status-island__live" role="status" aria-live="polite" aria-atomic="true"></div>
  <div class="g-status-island__live" role="alert" aria-atomic="true"></div>
  <section class="g-status-island__shape" aria-label="Estado de la aplicación (Alt+F8)"
           style="--_island-w: 310px; --_island-h: 42px; --_left: 1; --_run-ms: 7340">         <!-- hidden en empty; w/h sin el borde: fila de 44px = 42 + 2 -->
    <div class="g-status-island__inner">
      <button class="g-status-island__summary" id="ID-summary" type="button"
              aria-expanded="false" aria-controls="ID-panel" aria-keyshortcuts="Alt+F8"
              aria-describedby="ID-desc">                                                   <!-- móvil: aria-haspopup="dialog", sin aria-controls -->
        <span class="g-status-island__badge" data-type="error" aria-hidden="true">
          <svg class="g-icon">…</svg><span class="g-status-island__ring"></span></span>    <!-- ring: un elemento nuevo por tramo -->
        <span class="g-status-island__text"><span class="g-status-island__sr">Error: </span>No se pudo guardar la factura</span>
        <span class="g-status-island__timer" role="timer" aria-live="off">4:59</span>        <!-- solo con deadline, en lugar del anillo -->
        <span class="g-status-island__tail">
          <span class="g-status-island__more"><span aria-hidden="true">+2</span><span class="g-status-island__sr">y 2 más en espera</span></span>
          <span class="g-status-island__chevron" aria-hidden="true"><svg class="g-icon">…</svg></span></span>
      </button>
      <div class="g-status-island__peek" id="ID-peek" hidden>                                <!-- asomo: visible con is-peek -->
        <p class="g-status-island__desc" id="ID-desc">El servidor no respondió.</p>
        <div class="g-status-island__acts">
          <button class="g-btn … g-status-island__action" type="button">Reintentar</button>
          <button class="g-btn … g-status-island__origin" type="button">Ir al formulario</button>
          <a class="g-status-island__link" href="…">Ver factura</a>
          <button class="g-btn … g-status-island__hide" type="button">Ocultar</button>
        </div>
      </div>
      <div class="g-status-island__panel" id="ID-panel" hidden>                              <!-- lista, escritorio -->
        <ul class="g-status-island__list" aria-labelledby="ID-summary">
          <li class="g-status-item g-status-item--type-error has-action" id="ID-i-1" data-type="error">  <!-- is-busy + aria-busy, has-details, is-dismissible -->
            … (como hasta ahora: badge, content, title, description, timer, link, details-toggle, details, actions, dismiss)
          </li>
        </ul>
        <div class="g-status-island__foot"><button class="g-btn … g-status-island__close" type="button">Cerrar</button></div>
      </div>
    </div>
  </section>
  <dialog class="g-dialog g-dialog--mobile-sheet g-status-sheet">…</dialog>                   <!-- móvil: GDialog real con la lista y «Cerrar» -->
</div>
```

- **Raíz:** `popover="manual"` **abierta siempre** desde el montaje (`showPopover()`), capa superior como `GToaster` (#141). Sin rol. No captura el puntero; `__shape` sí.
- **Canales:** dos `__live` (texto oculto accesible), presentes y vacíos desde el montaje, **fuera** de la `section`; viajan con la raíz al modal.
- **`__shape`:** `section` con nombre (`fill(labels.region, { hotkey })`); `hidden` solo en `empty` (después de `rise`). Lee `--_island-w`/`--_island-h` (px del destino medido) salvo en `drop`/`fold`, donde coco usa el tamaño de cápsula. **Son `offsetWidth`/`offsetHeight` de `__inner`, sin el borde de `__shape`** (#707): el CSS suma `2 × --g-border-width`, así que con la fila de 44px y un borde de 1px el `.vue` escribe `--_island-h: 42px`. Puede escribirlas ya durante `drop` (el CSS usa la cápsula hasta `grow`).
- **Resumen:** un `button` con todo el titular dentro (insignia, texto, cuenta atrás, «+N» y chevrón: pulsar el chevrón es pulsar el resumen). Nombre accesible = contenido: prefijo de tipo + título + `labels.waiting` (con espera); en `list`, `fill(labels.listTitle, { count })`. `aria-expanded` = lista abierta; `aria-controls` → panel (escritorio); `aria-describedby` → la descripción del asomo cuando existe (quien enfoca oye la descripción). `aria-keyshortcuts` = `hotkey`. Área ≥ 24px (≥ 44px con `pointer: coarse`), **medida en el resumen, por dentro del borde** (#707: la fila es esa diana más 2 bordes).
- **Insignia:** icono por tipo (`info` · `circle-check` · `triangle-alert` · `circle-alert`; `loader-circle` con `busy`), `.g-icon` hijo directo. **Tipo sin color** (WCAG 1.4.1): forma del icono + prefijo oculto. El borde de estilo por tipo (sólido, discontinuo, punteado) **deja de ser obligatorio en la cápsula** (el anillo de tiempo ocupa ese sitio, #694); en la marca enlace y en la lista coco decide si se conserva. La forma del icono basta y es la misma convención que `GToast`.
- **Asomo (`__peek`):** `hidden` fuera de `is-peek`; orden del DOM: descripción → acción → «Ir a…» → enlace → «Ocultar» (la cuenta atrás no se repite: está en el titular, #707; un segundo `role="timer"` diría lo mismo dos veces). Sin detalle técnico ni «Descartar» (son de la lista).
- **Lista (`__panel`):** los `li` como hasta ahora (orden: contenido → acciones → descartar); `id` derivado de un contador interno. Detalle técnico: Disclosure; «Copiar» con `navigator.clipboard.writeText` (solo al pulsar) y `labels.copied`. «Cerrar» (`labels.close`) al pie.
- **Botones:** `GBtn` con las props que fije coco (`size="sm"`; «Ocultar», «Ir a…» y el conmutador del detalle, discretos). coco reasigna sus alias sobre el material de la isla.
- **Cuenta atrás:** `m:ss` (`h:mm:ss` desde una hora), cifras tabulares; un solo intervalo de 1 s para todas, solo en el cliente y con la isla montada.

## `GStatusMark` (#323, enmendado por #700)

Complemento en línea de la isla y **memoria de lo pendiente**. Dos usos, según `for`:

| | **Enlace** (`for`) | **Texto** (sin `for`) |
| --- | --- | --- |
| Para qué | Junto al origen de una condición: **guarda lo vigente** cuando la isla se recoge | Advertencia o información que es **contenido** de una sección, tarjeta o diálogo; o un indicador permanente de la aplicación («Sin conexión» en la cabecera) |
| Elemento | `button` cápsula | `div` con un `p` |
| En la isla | Sí: abre la **lista** en su condición | **No entra en la isla** |
| Anuncia | Nunca | Nunca |

### Props, slots y estructura

Sin cambios: `for`, `type` (solo sin `for`), `typeLabel`, `status`; slots `default` (alcance `{ condition, type, busy }`) y `action` (solo sin `for`); sin eventos. Estructura como hasta ahora, más **`is-echo`** en la marca enlace durante el eco.

### Reglas

- **Enlace:** existe **solo mientras exista la condición `for`** en el modelo (también vista, `seen: true`); tipo y `busy` salen de la condición. En el servidor no renderiza. Al activarla: guarda la marca como elemento de vuelta, `open(id, { focus: true })` y el foco va, dentro de la condición, a la **acción** si está habilitada; si no, a «Ir a…», al enlace, a «Descartar» o al propio `li` (`tabindex="-1"`). **Sin anuncios.** `aria-expanded` = la lista está abierta.
- **Pausa:** puntero o foco sobre una marca enlace cuya condición se muestra o espera ponen la lectura en pausa (#696).
- **Eco** (#700): ver «Eco en la marca». Solo si es visible; una vez por recogida; nunca al montar.
- **Vuelta** (D5): Alt+F8 desde la lista devuelve el foco a la marca; «Ir a…» lo lleva al `origin`; al cerrar la hoja móvil vuelve a la marca. Si la marca ya no está, rige «Foco».
- **No empuja:** en `GFormActions`, como hijo del slot por defecto **antes** del botón (Δ 0px); en `GTable`, dentro del slot `empty`. **Nunca en el slot `status` de `GFormActions`**.
- **Texto:** una línea de insignia + texto + una acción opcional; estática, no anuncia, no se cierra.
- Área de la cápsula ≥ 24px (≥ 44px con `pointer: coarse`).
- **El mismo material que la isla, a escala de control** (#694): coco la pinta con el cristal de la isla (`light-dark()`); **dentro de una zona de marca** la marca sigue el `color-scheme` de la zona (la oscura toma la rama oscura) y coco la mide ahí (`tokens.md` §44.9).

## `GStatus` (declarativo, sin pintura)

No renderiza nada. Mientras está montado, su condición existe.

| Prop | Tipo | Default | Regla |
| --- | --- | --- | --- |
| `id` | String \| Number | **obligatoria** | Clave de la condición |
| `type` · `title` · `description` · `details` · `action` · `link` · `origin` · `persistent` · `dismissible` · `deadline` · `politeness` | como en «Modelo de una condición» | los del modelo | `title` obligatorio |
| `status` | Object (gestor) | el inyectado | |

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `remove` | `(reason)` | La condición se retiró por una vía distinta de su propio desmontaje (`dismiss`, `read`, `api`, `clear`, `origin`): la aplicación apaga su `v-if` |
| `expire` | — | `deadline` llegó a cero |

- Al montar: `set(id, props)`. Al cambiar una prop: `update`. Al desmontar: `remove(id)` (motivo `unmount`).
- Retirada con el componente aún montado: **no se vuelve a registrar** hasta que se monte de nuevo.
- Montado junto con la isla al cargar: no anuncia (#698). Montado después: anuncia como cualquier condición nueva.
- En el servidor no hace nada.

## Textos (`labels`, sin valores por defecto; #226)

| Clave | Marcadores | Dónde | Si falta |
| --- | --- | --- | --- |
| `region` | `{hotkey}` | `aria-label` de la `section` | Aviso al montar; sin nombre |
| **`waiting`** | `{count}` (String o Function, #51) | Texto oculto de «+N» («y {count} más en espera») | Aviso al haber espera; «+N» queda sin texto |
| **`listTitle`** | `{count}` (String o Function) | Texto del resumen en la lista y nombre de la lista («Pendiente ({count})») | Aviso al abrir la lista; el resumen conserva el titular |
| **`hide`** | | «Ocultar» en el asomo | Aviso al primer asomo; **el botón no se dibuja** (Esc y tocar fuera siguen) |
| `close` | | «Cerrar» de la lista y `closeLabel` de la hoja móvil | Aviso al abrir la lista; **el botón no se dibuja** (Esc, activar el resumen y pulsar fuera siguen) |
| `types.info` · `types.success` · `types.warning` · `types.error` | | Prefijo oculto del título, de la marca y del anuncio | Aviso al usar ese tipo; sin prefijo |
| `dismiss` | `{title}` | `aria-label` de «Descartar» | Aviso al primer `dismissible` |
| `details` · `copy` · `copied` | | Conmutador del detalle, «Copiar», anuncio tras copiar | Aviso al primer `details` |
| `remaining` | `{time}` (String) o Function `(ms) => String` | Anuncio de los umbrales de la cuenta atrás | Aviso al primer `deadline` |
| `sheetTitle` | | `title` del `GDialog` de la hoja | Aviso al montar en móvil |

**Retiradas (#697):** `acknowledge` (no hay «Entendido»), `summary` (el prefijo «Estado: N avisos.»: el nombre de la región y `waiting`/`listTitle` ya lo dicen) y `more` (sustituida por `waiting`: el número ahora cuenta lo que **espera**, no el total). Pasarlas avisa una vez y se ignoran. `{hotkey}` vacío con `hotkey: false`. Marcadores con `fill`.

## Anuncios (#320, enmendado por #698; WCAG 4.1.3)

- **Mecanismo sin cambios:** el par propio de canales de la isla (`createLiveWriter`, 50 ms / 5000 ms). La isla, la lista, el resumen y las marcas **no** son regiones vivas.
- **Texto:** `[types.<type>:] título[.] [descripción]`.
- **Se anuncia, una vez por suceso:** una condición que aparece (aunque espere su turno en la cola); un cambio de `type`, `title` o `description`; `announce(id)`; el rechazo de la acción; `busyLabel`; los umbrales de la cuenta atrás (cortés); `labels.copied`.
- **No se anuncia:** lo que ya existe al montar la isla (**0 anuncios al cargar**; sí se muestra, con su entrada, tras `is-ready`); el **relevo**; el asomo, la lista, recogerse, «Ocultar», «Descartar», «Ir a…», el eco, la marca; la retirada por `read` o por `origin`; el traslado al modal; el cambio que quita el control con foco **cuando el foco queda leyendo esa misma condición** (#328).
- **Sin duplicados:** nunca el mismo texto en dos regiones vivas (regla de uso con `GToaster` y `GErrorSummary`).
- **Límite asumido:** el texto visible es temporal; quien usa lector recibe el anuncio completo al llegar y vuelve con Alt+F8 o la marca (como con `GToast`). Una aplicación que necesite que el lector oiga una condición presente al cargar llama a `announce(id)` tras montar.

## Teclado

| Tecla | Dónde | Acción |
| --- | --- | --- |
| `hotkey` (**Alt+F8**) | Documento, con ≥ 1 condición en el modelo y el foco **fuera** de la isla | Guarda el elemento enfocado, **abre la lista** y lleva el foco al resumen (móvil: la hoja, foco según `GDialog`, #292). `preventDefault` |
| `hotkey` | Foco **dentro** de la isla (o de su hoja) | Cierra la lista, recoge y devuelve el foco al elemento guardado (si sigue conectado y no es inerte; si no, «Foco») |
| `hotkey` sin condiciones | | **No se intercepta** |
| Tab | Hacia el resumen (con la isla visible) | Abre el asomo; Tab sigue por acción, «Ir a…», enlace, «Ocultar». **No está atrapado** |
| Enter / Espacio | Resumen | Abre la lista; en la lista, la cierra y recoge |
| Tab / Mayús+Tab | Lista | Resumen → por condición: enlace, detalle, acción, «Ir a…», «Descartar» → «Cerrar» |
| Esc | Foco dentro de la isla (asomo o lista) | Recoge (todo pasa a `seen`) con `preventDefault()` + `stopPropagation()` (no cierra el `GDialog` anfitrión); foco según «Foco» |
| Esc | Asomo abierto por el puntero, foco fuera | Cierra el asomo y recoge; `preventDefault()`, sin detener la propagación (#703) |
| Esc | Isla en titular sin asomo, foco fuera | Nada |

Coincidencia del atajo como `GToaster`: `event.key` y modificadores **exactos**; con `event.isComposing` no se trata.

## Foco

- **Nunca lo toma** al aparecer, relevarse o cambiar.
- **Nunca se recoge por tiempo con el foco dentro** (el foco dentro es pausa).
- **Si el control con foco desaparece** («Reintentar» al resolverse, una condición descartada): al **resumen** si la isla sigue (en la hoja, al `li` con `tabindex="-1"` o al cierre de la hoja; nunca fuera del modal).
- **Si la isla se recoge con el foco dentro** (Esc, «Ocultar», cerrar la lista, Alt+F8): al elemento guardado (atajo o marca) si sigue conectado y no es inerte; si no, a la **marca enlace** de la condición que se mostraba, si existe; si no, al **siguiente elemento tabulable** del anfitrión (documento o modal), y si no hay, al anterior. **Nunca a `body`.**
- **«Ir a…»** enfoca el origen; el enlace sigue su navegación.
- **Pulsar o tocar fuera** cierra lista o asomo sin mover el foco.
- **Hoja móvil:** foco y Esc de `GDialog`; al cerrarse, el foco vuelve a la marca o al elemento guardado.

## Borde compartido (#322, enmendado por #699)

- **La isla publica su reserva solo mientras se ve** (#699): desde el empiece de `drop` hasta el **final** de `rise` (los avisos no se cruzan con la cápsula que sube), con el alto del **titular** (fila + margen), **nunca** el del asomo ni el de la lista. En `empty` no publica.
- **`EDGE_ORDER.status` pasa de 20 a 30**, detrás de `fab` (25): `EDGE_ORDER = { speech: 10, pageHeader: 15, fab: 25, status: 30 }` (**vigente**, con el chasis delante y el muelle de reservas, #714, #740 y #750: `{ appShell: 5, speech: 10, pageHeader: 15, bookingDock: 20, fab: 25, status: 30 }`). La isla es ahora **transitoria** y la regla de #225 manda: **lo persistente conserva el borde y lo transitorio se apila por dentro**. Un FAB arriba ya no baja cada vez que cae la isla; la isla queda debajo de la voz, del zócalo pegado y de un FAB de arriba.
- La isla lee `edgeReserve('top', { before: EDGE_ORDER.status })` y lo suma a `--_status-offset-top` = `calc(<offset.top> + <reserva>px)`. `GToaster` no cambia su llamada (suma todo): con los avisos arriba, quedan bajo la isla mientras se ve y se recolocan con su propia transición cuando se va.
- **Por borde, sin mirar la alineación** (como hasta ahora): un FAB en `top-end` también baja la isla centrada. Se acepta (raro, y sin solape).
- Si la voz, el zócalo o el FAB aparecen o cambian, la isla se recoloca con `--g-duration-press` (sin muelle).
- `utils/edgeReserve.js` no cambia de firma; solo la constante (bruno: `fab.md` y `page-header.md` anotan el cambio).
- **`GAppShell` delante de todos (#714):** `EDGE_ORDER = { appShell: 5, speech: 10, pageHeader: 15, bookingDock: 20, fab: 25, status: 30 }`. El chasis publica arriba su banda de cabecera pegada (el sitio final; 0 despegada o cedida), así que **con chasis la aplicación no pasa `offset.top`** a la isla (`app-shell.md` «Bordes compartidos»).

## Convivencia

- **`<dialog>` modal (#141):** la raíz se **traslada al modal superior** (mismos nodos, canales incluidos, `utils/topModal.js` con `ignore` = su hoja) y vuelve a `showPopover()`; al cerrarse el modal vuelve a `body`. El modelo, la cola, la lectura y la cuenta atrás no se reinician; una etapa en curso sigue desde su estado. El traslado no anuncia.
- **Móvil** (visor < `--g-space-1 × 130`, medido; `data-mobile`): el titular cae arriba igual; el asomo crece hacia abajo; **la lista es una hoja inferior modal** con un **`GDialog` real** (`mobile="sheet"`, `title = labels.sheetTitle`, `closeLabel = labels.close`, clase `g-status-sheet`) que **solo abre la persona** (segundo toque, marca, `open()`). Al cerrarla, la isla se recoge.
- **`GToaster`:** canales, atajos y textos distintos; reserva arriba.
- **Voz (`GSpeechHost`):** la voz primero (#322; `speech.md` no se reabre).
- **`GErrorSummary`:** no se tocan.

## Movimiento (#701; sustituye #324 salvo el uso del muelle en el cambio de tamaño)

Estructura de kiwi (r04 §6.3); duraciones y curvas son tokens; **cada paso ≤ 240 ms** (#71, #280, #299). Una **coreografía de varios pasos** (la entrada, la salida) es válida si cada paso respeta el techo y **nada bloquea a la persona** mientras dura (#702).

| Paso | Qué | Duración y curva |
| --- | --- | --- |
| **Nacer** (`drop`) | Cápsula sin texto (`space × 24` × fila) cae del borde: `translate` desde `-(100% + margen)` en el eje de bloque, escala **0,9** → 1, fundido | `--g-duration-slow`, `--g-ease-out` (entrada: sin muelle, #299) |
| **Ensancharse** (`grow`) | De la cápsula al titular medido | `--g-duration-slow`, **`--g-ease-spring`** (uso (a) de #324: el cambio de tamaño de la isla) |
| **Texto** | Entra al terminar la caída | `--g-duration-press`, `--g-ease-out` |
| **Asomo / lista** | Crecen hacia abajo con continuidad, desde el titular; su contenido se funde | Tamaño: `--g-duration-slow` + `--g-ease-spring` (mismo uso (a)); contenido: `--g-duration-press` + `--g-ease-out` |
| **Cerrar asomo / lista** | Vuelven al titular; el contenido sale primero | Contenido: `--g-duration-fast`; tamaño: `--g-duration-slow` + `--g-ease-out` (**sin** muelle al encoger: M1, nunca por debajo del titular ni de la cápsula) |
| **Relevo** | El texto nuevo entra desde abajo, el viejo sale hacia arriba; el ancho se ajusta | Texto: `--g-duration-slow` + `--g-ease-out`; ancho: `--g-duration-slow` + `--g-ease-spring` |
| **Recogerse** (`fold` → `rise`) | Texto fuera; se estrecha a la cápsula; sube y se funde | Texto: `--g-duration-fast` + `--g-ease-standard`; estrecharse: `--g-duration-slow` + `--g-ease-out`; subir: `--g-duration-slow` + `--g-ease-standard`. **Los pasos pueden solaparse y la salida entera no dura más que la entrada** (#152): coco fija el solape |
| **Pausa** | El anillo se para; su pista se completa | Sin movimiento (cambio de estilo) |
| **Eco en la marca** | Un anillo que se abre desde la marca y se apaga, una vez | **`--g-duration-slow`**, `--g-ease-out`; keyframes `g-status-echo` (#701: el `slow × 3` de kiwi se descarta por el techo de 240 ms) |
| **Giro** de `loader-circle` | | `--g-duration-spin` |
| **Recolocación** por la reserva | | `--g-duration-press`, `--g-ease-out` (sin muelle) |
| **Movimiento reducido** | **Solo fundidos** de `--g-duration-fast`: sin caída, sin escala, sin cambio de tamaño animado (el estado final aparece en su sitio), sin rodillo (fundido cruzado), sin anillo que se abra en el eco (coco: un fundido de color o nada); el anillo de tiempo **sigue diciendo el tiempo** sin desplazar nada (coco decide si por pasos). **Con movimiento reducido la isla no se mueve** | §29.3 |

- **Retirados (#701):** el **toque** (`is-nudge`, `g-status-nudge`, escala 0,86): sin isla que se quede, no hay a quién dar el toque; lo que llega mientras se lee otra cosa sube «+N». El **nacer** en `--g-duration-press` (I1 de coco: el 86 % en ~50 ms).
- **Nada se anima al montar:** `is-ready` dos cuadros después del montaje (plan 012); lo presente al cargar entra después, con su caída.
- **Rendimiento** (riesgo 4 de la rúbrica, para bruno y coco): el ancho y el alto se animan en **una sola superficie** pequeña; coco puede usar `clip-path`/`scale` si mide mejor, sin cambiar lo que se ve. `backdrop-filter` (cristal) sobre una superficie que cambia de tamaño se mide en la auditoría (rúbrica G).

## Estética (#694; sustituye #325 y la ratificación de #692)

- **Material:** **cristal oscuro en los dos esquemas** — el mismo objeto con otra luz (decisión del usuario, «estilo Apple»): **oscuro = V2C · Cristal** (el material del sistema, `tokens.md` §12) **con filo** (hilo de control con un poco de tinta y filo exterior del color de la página, para delimitar sobre una zona de marca oscura); **claro = L1 · Grafito esmerilado** (cuerpo translúcido de `--g-color-text` que desenfoca, filo de luz y brillo de `--g-color-surface`, filo exterior de la tinta de la zona para delimitar frente a una cabecera de marca). Valores, mezclas y medidas: coco (`r04/estilo.md` «Decisión»).
- **`light-dark()`** en `GStatusIsland.css` y `GStatusMark.css`: cada valor del material es `light-dark(claro, oscuro)`, con `var(--g-*)` en las dos ramas (regla en `tokens.md` §12.1).
- **La isla deja la superficie inversa** (#325, #692): ya no es `--g-color-text` de fondo con `--g-color-surface` de texto como losa opaca; tampoco `brand` (`tokens.md` §2). Neutra con cualquier marca.
- **Insignia callada** en los dos esquemas (disco del tipo atenuado, glifo legible): el tipo se lee por la forma del icono y el prefijo oculto.
- **Mínimos** (no son tema): texto ≥ 4,5:1 y glifo, anillo, acción, foco y **delimitación** ≥ 3:1 frente a la página, la superficie y la zona de marca, en claro y en oscuro, **en los temas de referencia del CLI**. Medido por coco con el filo (`r04/estilo.md` §10, 191/191 en tres motores y 11 temas): texto ≥ 5,99; gráficos ≥ 4,51; **delimitación ≥ 3,10** (antes del filo, 2,03–2,69 frente a 4 zonas oscuras).
- **Guardas del CLI** (#694, `tokens.md` §12.1): la tinta `surface` sobre el cuerpo del claro (`text` al 84 %) compuesto sobre el **peor fondo** (blanco), y el glifo `surface` sobre el disco del tipo al 40 % del claro, se validan como la regla de legibilidad de §12.
- **Respaldos** (§12): sin `backdrop-filter`, con `prefers-reduced-transparency: reduce` y con `forced-colors: active`, el cristal se ve **opaco** (borde `CanvasText` en `forced-colors`).

## Tokens consumidos (#694)

**Ningún token nuevo.** Todo sale de tokens existentes con `light-dark()`.

| Token | Para qué |
| --- | --- |
Lista exacta de coco (`r04/estilo.md` §10.3), con lo que fija este contrato:

| Token | Para qué |
| --- | --- |
| `--g-glass-tint`, `--g-glass-opacity`, `--g-glass-filter`, `--g-glass-edge`, `--g-glass-sheen` | Cuerpo, filo de luz y brillo de la rama oscura (V2C); el filtro, en las dos ramas |
| `--g-color-text` | Cuerpo del claro (L1, al 84 %); tinta del oscuro; capa de sombra propia del claro (al 22 %); el hilo del oscuro (al 30 % sobre `border-control`) |
| `--g-color-surface` | Tinta del claro; filo de luz (22 %) y brillo (12 %) del claro; relleno de la acción en claro y su texto en oscuro |
| `--g-color-border-control` | Hilo exterior del oscuro (con un 30 % de la tinta: **el filo**, #694) |
| `--g-color-border` | Separadores de la lista y contorno de «+N» en oscuro |
| `--g-color-bg` | Anillo exterior de 2 bordes en oscuro: el color de la **página** (invisible sobre ella; separa de las zonas oscuras) |
| **`--g-color-on-brand-zone`** | **Anillo exterior en claro** (al 75 %): la tinta de la zona, que por construcción contrasta ≥ 4,5:1 con cualquier zona de marca; la isla flota sobre la zona sin estar dentro. **Excepción a `tokens.md` §44.2** (#694), como `zone-edge` en `GSurface.css`: **solo `GStatusIsland.css`**, y `roles.test.js` la lista. Se descarta un alias nuevo (`--g-color-zone-ink`): un solo consumidor no justifica un token |
| `--g-color-{info\|success\|warning\|danger}` | Disco de la insignia en claro (al 40 %, glifo `surface`: **par derivado** que valida el CLI, `tokens.md` §12.1) |
| `--g-color-{info\|success\|warning\|danger}-soft`, `--g-color-on-{…}-soft` | Disco y glifo de la insignia en oscuro (par garantizado) |
| `--g-color-{info\|success\|warning\|danger}-text`, `--g-color-text-muted` | Marca de **texto** sobre la superficie de la página (sin cambios) |
| `--g-color-focus`, `--g-focus-width`, `--g-focus-offset` | Foco exterior de la marca y **eco**; dentro de la isla, el anillo interior va en la tinta |
| `--g-shadow-1`, `--g-shadow-3` | Sombra cercana y lejana (sustituyen a `--g-shadow-2`) |
| `--g-radius-pill` | Marca enlace (la isla usa la mitad de su fila en todas sus formas: deriva de `space`) |
| `--g-border-width` | Hilo, anillos, grosor del anillo de tiempo y `forced-colors` |
| `--g-space-1`, `-2`, `-3`, `-4`, `-8` | Tamaños, separación, margen al borde (con `env(safe-area-inset-top)`), capa de sombra propia |
| `--g-font-ui`, `--g-text-body-sm-{size\|line\|tracking}`, `--g-text-title-sm-weight`, `--g-text-action-weight`, `--g-text-caption-{size\|line\|weight}` | Texto (título `body-sm`/600; «+N» y cuenta atrás en `caption`) |
| `--g-duration-{fast\|press\|slow\|spin}`, `--g-ease-{out\|standard\|spring}` | Movimiento |

**Ya no consume:** la superficie inversa como losa, `--g-color-on-{tipo}` en las insignias y `--g-shadow-2`. **Sin `--g-shadow-lift`** (#694): la capa de sombra propia del claro es una receta de `space` y la tinta al 22 % con un solo consumidor; se valora si un segundo componente la repite.

**El chevrón** gira con `--g-duration-slow` + **`--g-ease-out`**, no con el muelle (el banco de coco lo giraba con muelle: un giro no es un uso aprobado de `--g-ease-spring`, §29.1; el muelle de la isla es solo el cambio de tamaño).

**No son tokens** (constantes, `tokens.md` §29.6 y §31): escala de partida **0,9** (sustituye a 0,86); cápsula `space × 24` × fila; **fila** `max(space × 11, 24px + 2 × --g-border-width)` con el borde y, con `pointer: coarse`, `max(space × 11, 44px + 2 × --g-border-width)`: la diana es el resumen, por dentro del borde (44 y 46px con el tema por defecto; #707); insignia `space × 6` (marca: cápsula `space × 8`, insignia `space × 5`); margen `space × 2`; ancho de la lista `min(space × 104, 100% − 2 × margen)`; los porcentajes de mezcla del material (84, 30, 75, 40, 22, 12, 18 y 14 %, el 86 % de la acción al pasar y el 55 % del brillo; constantes de diseño de coco en su `estilo.md`, como #532); **el relevo** una línea (`100%`, geometría de la celda, como P2 de `GNumberField`); **media vuelta** `0.5turn` del chevrón (= 180°, como la divulgación de `GBreadcrumbs`) y `1turn` del anillo; **`1ms`**, unidad que convierte el número `--_run-ms` en tiempo, y `0px`/`0` como `initial-value` (literales de unidad de `tokens.md` §7, #187); las **propiedades registradas privadas** `--_status-w`, `--_status-w-out`, `--_status-h`, `--_status-h-out` (`<length>`: el tamaño animado, muelle solo al crecer) y `--_status-ring` (`<number>`: el avance del anillo) (`tokens.md` §29.7; #707); los umbrales de la cuenta atrás y `ANNOUNCE` (JS); `TOAST_DURATION` y el mínimo de 1000 ms al reanudar (JS, #142). **Datos del `.vue`** (§29.5): `--_island-w`, `--_island-h`, `--_left`, `--_run-ms`, `--_status-offset-top`, `data-form`, `data-stage`. Medidas literales: solo `24px`/`44px`.

## Clases y datos (contrato bruno ↔ coco)

| Clase o atributo | Elemento | Cuándo |
| --- | --- | --- |
| `g-status-island`, `g-status-island--position-top-{start\|center\|end}`, `data-position`, `data-align` | Raíz | Siempre |
| `data-form="empty\|line\|list"` | Raíz | Siempre (en móvil con la hoja abierta: `list`) |
| **`data-stage="drop\|grow\|fold\|rise"`** | Raíz | Solo durante esa etapa |
| `data-type` | Raíz | Tipo de la condición mostrada (sin atributo en `empty`) |
| `data-mobile` | Raíz | Visor < `space × 130` |
| `is-ready` | Raíz | Dos cuadros tras montar |
| **`is-peek`** | Raíz | Asomo abierto |
| **`is-paused`** | Raíz | Lectura en pausa (cualquier causa) |
| `--_status-offset-top` | Raíz (en línea) | Con `offset.top` o reserva |
| `--_island-w`, `--_island-h`, **`--_left`**, **`--_run-ms`** | `__shape` (en línea) | Tamaño de destino medido; tramo del anillo |
| `g-status-island__live` (2), `__shape` (`hidden` en `empty`), `__inner`, `__summary`, `__badge` (`data-type`, `is-busy`), **`__ring`**, `__text` (y **`__text[aria-hidden="true"]`**: la copia que sale en el relevo, #707), `__sr`, `__timer`, **`__tail`**, `__more`, **`__chevron`**, **`__peek`** (`hidden` sin `is-peek`), **`__desc`**, **`__acts`**, **`__action`**, **`__origin`**, **`__link`**, **`__hide`**, `__panel` (`hidden` fuera de `list` o en móvil), `__list`, `__foot`, **`__close`** | Partes de la isla | Según contenido |
| `g-status-item`, `g-status-item--type-*`, `data-type`, `is-busy` (+ `aria-busy`), `has-action`, `has-details`, `is-dismissible`, y sus partes (`__badge`, `__content`, `__title`, `__type`, `__description`, `__timer`, `__link`, `__details-toggle`, `__details`, `__details-text`, `__copy`, `__actions`, `__action`, `__origin`, `__dismiss`) | `li` de la lista | Sin cambios |
| `g-status-sheet` | `GDialog` de la hoja | Móvil |
| `g-status-mark`, `--link` \| `--text`, `--type-*`, `data-type`, `is-busy`, **`is-echo`** | Marca | Siempre / con `busy` / durante el eco |
| `g-status-mark__badge`, `__text`, `__type`, `__action` | Partes de la marca | Según contenido |

**Retirados:** `data-form="compact\|dot\|open"`, `is-nudge`, `is-acknowledged`, `__ack`. `__sr`, `__type` y `__live` usan el patrón de texto oculto accesible. Estados que coco cubre: hover (`@media (hover: hover)`), `:focus-visible`, activo, `is-busy`, `is-paused`, `is-peek`, cada `data-stage`, `prefers-reduced-motion`, `prefers-reduced-transparency`, `forced-colors`, RTL (el anillo arranca arriba y gira en el sentido del texto o del reloj: coco lo fija y lo mide).

## Avisos de desarrollo

`console.warn` con prefijo `[Grana Status]`, una vez por caso, con la guarda canónica de #653:

1. `set` en el cliente sin ninguna `GStatusIsland` montada para ese gestor (tras el siguiente ciclo).
2. Dos `GStatusIsland` del mismo gestor.
3. `GStatusIsland`, `GStatus` o `GStatusMark` con `for` sin gestor; `useStatus()` sin gestor o fuera de `setup`.
4. Condición sin `title` o sin `id`: no se registra.
5. `type`, `position`, `politeness` fuera de lista; opción desconocida; `actions` en plural; `action` sin `label` u `onClick`; `link` sin `label` o `href`; `origin` sin `label` o `target`.
6. `error` con `politeness: 'polite'`.
7. `hotkey` `F6` o ilegible (rechazado); `F8` o `Shift+F8` (aceptado).
8. Falta un `labels` la primera vez que se necesita.
9. `origin.target` que no existe al pulsar «Ir a…».
10. Título de más de 60 caracteres (el titular lo recorta con elipsis).
11. Dos `<GStatus>` montados con el mismo `id`; `GStatusMark` con `for` y `type` a la vez; `GStatusMark` de texto sin prefijo de tipo.
12. `GStatusMark` con `for` activada sin isla montada.
13. **Opción o método retirado:** `autoOpen`, `acknowledge()`, `labels.acknowledge`/`summary`/`more` (se ignoran; `acknowledge()` hace `hide()`).
14. **Condición con `action` sin marca enlace montada** cuando le llegaría el momento de recogerse: «se queda en la isla hasta que la persona la oculte; pon una `GStatusMark for="…"` junto a su control».
15. `duration` < 5000 o fuera de lista (se usa 5000 o se conserva el anterior).

En producción no hay avisos ni comprobaciones extra.

## SSR

Importar `@grana/vue` y `createStatus` no tocan `document`, `window` ni `navigator`. En el servidor: `GStatusIsland` no renderiza nada; `GStatus` no hace nada; `GStatusMark` de texto renderiza normal y con `for` no renderiza. Escuchas (`keydown`, `pointerdown`, `pointerover`/`pointerout`, `focusin`/`focusout`, `resize`, `visibilitychange`), el intervalo de la cuenta atrás, los temporizadores de lectura, el `ResizeObserver`, el `MutationObserver` de los orígenes y el seguimiento del modal se crean al montar la isla y se retiran al desmontarla.

## Encargos y peso (#705, #706)

### coco (Opus)

- **`GStatusIsland.css` nuevo** desde el banco de `r04/estilo-banco.html` (V2C oscuro con filo + L1 claro, `light-dark()`), sobre las clases de este contrato: formas, etapas (`drop`, `grow`, `fold`, `rise`) con transiciones que **parten del estado actual**, asomo y lista que crecen hacia abajo sin muelle al encoger (M1), anillo de tiempo (degradado cónico, funciona en Firefox) con `--_left`/`--_run-ms` y `is-paused`, relevo (rodillo), movimiento reducido, `prefers-reduced-transparency`, `forced-colors`, RTL, 320px, dianas 24/44.
- **`GStatusMark.css`:** el material a escala de control y el **eco** (`g-status-echo`, **`--g-duration-slow`**, no el `slow × 3` del banco; con movimiento reducido, fundido o nada).
- Valores: los de `estilo.md` §10.2 tal cual (sin variantes en el CSS real), con dos cambios de contrato: el **chevrón** con `--g-ease-out` y el **eco** en `slow`. Fijar en `estilo.md` el **solape de la salida** (salida ≤ entrada).
- Auditoría posterior con la rúbrica (B, D, F, G): delimitación sobre página, superficie y zona en claro y oscuro; coste de `backdrop-filter` al cambiar de tamaño.

### bruno (Opus)

- **F1 y F2** del `.vue` (`auditoria-movimiento.md`): medir antes de mostrar; no cancelar la entrada (sin `transition: none` en la forma visible); el primer cuadro visible con su tamaño; `--_island-w/-h` borrados al vaciarse. Con la nueva forma, `openRect()` y la apertura automática desaparecen.
- **Motor de lectura y relevo:** cola por gravedad y llegada, tiempo de `TOAST_DURATION` (por `__shared`), pausas y reanudación con 1000 ms, relevo, «+N», lo que no se recoge solo, qué queda al recogerse, `duration`.
- **Etapas e interrupciones** (tabla de «Interrupciones»), sin reinicios.
- **Asomo** por puntero, teclado y toque; Esc del asomo por puntero; foco tapado (2.4.11) → recoger.
- **Modelo:** `resolve` limpio; acción cumplida con éxito = `resolve`; vive con su origen (`MutationObserver` solo con `origin`); `seen`; `hide()`; motivos `read` y `origin`; retiradas con aviso.
- **Eco** solo con marca visible; pausa por la marca.
- **CLI** (`packages/cli/`): las dos guardas del cristal grafito en claro (`tokens.md` §12.1) y la excepción de `--g-color-on-brand-zone` para `GStatusIsland.css` en `roles.test.js`.
- **`EDGE_ORDER.status = 30`** en `utils/edgeReserve.js` y reserva solo mientras se ve (las pruebas de `GFab`, `GPageHeader`, `GToaster` y la voz siguen en verde).
- `meta.json` (tipos: `duration`, `hide`, `seen`, `state`, motivos; fuera `autoOpen` y `acknowledge`), playground **sin el error que no se retira nunca** (F3: «El servidor falla al guardar» desmarcado o el error con `origin`) y con el éxito sin la traza (F4), specs `tests/status.spec.mjs` reescrito y uno de movimiento (cuadro a cuadro).

### mora-docs (Sonnet)

- `GStatusIsland/README.md` (y `GStatusMark/README.md`) desde el `meta.json` verificado: «qué es» con la frontera de #704 (si queda algo pendiente, isla; si no, `GToast`); la marca como memoria; ejemplos con `resolve` y `origin` (sin F3 ni F4); `duration: false` como preferencia de la persona; límites (abajo).

### Peso

**Tope vigente (#706, enmienda #705): 19,5 KiB = 19 968 B** de `gzip` (nivel por defecto) de `dist/status.js`, en KiB como todo el repo (#550). Con más, vuelve a lima y **no se sube otra vez**: la salida es una decisión de producto del usuario (ver #706).

| Medida (lima, copia aislada del `src` de 3f8f39b; ruido ±60 B, #636) | Antes (74e2404) | Ahora |
| --- | --- | --- |
| `dist/status.js` gzip | 16 156 B | **19 591 B** (+3 435 B) |
| `dist/status.umd.js` gzip (Vite) | 13 910 B | 17 240 B |
| Minificado para producción, sin avisos (esbuild, informativo, #653 punto 6) | 11 565 B | 14 830 B |
| Avisos de desarrollo (minificado con avisos − sin avisos) | ≈ 2 099 B | ≈ 2 146 B |

El crecimiento es **código del comportamiento elegido**, no avisos: el motor de lectura y relevo (`status.js`, fuente gzip 7 989 → 12 309 B) y las etapas, el asomo, la copia del relevo y el eco (`GStatusIsland.vue` 10 005 → 12 334 B; `GStatusMark.vue` 1 900 → 2 787 B). La estimación de #705 (≈ 17,5–18 KB) se quedó corta en ≈ 1,4 KiB. `dist/grana.js` crece **+30 B** (`TOAST_DURATION` y `RESUME_MIN` en `__shared`, `EDGE_ORDER.status`), dentro de los ≤ 100 B de #705. El CSS va en `grana.css` (sin tope propio): 90 080 → 91 320 B gzip. bruno pone `bundle.cap` 19 968 en `GStatusIsland.meta.json` y corrige `overCap` y la línea de `CHANGELOG.md` (el exceso sobre 19,0 KiB era de 135 B, no de 580: la cifra de 19 000 B contaba en kB, #550).

## Verificación (cómo se da por hecho)

- **bruno** (vitest + jsdom con reloj falso; Playwright en los tres motores, puerto propio):
  - **API:** exportaciones; `app.use`; `useStatus` sin gestor; importación sin `document`; SSR sin marcado; opciones y métodos retirados avisan.
  - **Modelo:** `set` crea y sustituye en el mismo nodo; `seen` vuelve a `false` con cambios de tipo, título o descripción y con `announce`; `resolve` limpia descripción y detalle; acción cumplida con éxito = `resolve`; vive con su origen (retirada `origin` sin anuncio; destino que aún no existía no retira); `onRemove` una vez con cada motivo; resultados sin enlace → `read`.
  - **Lectura:** tiempo `auto` exacto; empieza al terminar `grow`; pausa con puntero, foco, dedo, asomo táctil, lista, `busy`, pestaña oculta; reanuda con lo que quedaba (≥ 1000 ms); `duration` número y `false`.
  - **Relevo:** cola por gravedad y llegada; lo más grave releva al momento salvo en pausa; «+N» = espera; relevo sin anuncio; mismo nodo.
  - **No se recoge solo:** `deadline` (y vuelve en cada umbral); acción sin marca montada (aviso 14); con marca, sí.
  - **Etapas e interrupciones:** cada fila de la tabla; ningún reinicio desde el origen (posición y tamaño continuos cuadro a cuadro); ninguna acción bloqueada durante una etapa.
  - **F1/F2/I4 como regla:** ningún cuadro visible más ancho o alto que su destino o que la cápsula (salvo el sobrepaso del muelle ≤ 4 %); primer cuadro visible entrando desde el borde, sin texto; la isla nunca se funde vacía; Firefox con fundido de salida.
  - **Asomo:** puntero, teclado y toque (primer toque asomo, segundo lista; el rectángulo de la acción no contiene el punto del primer toque); Esc del asomo por puntero con `defaultPrevented` y sin detener la propagación; foco tapado → se recoge sin mover el foco.
  - **Anuncios:** 0 al cargar (pero se muestran); uno por suceso aunque esperen turno; relevo, recoger, eco y `origin` sin anuncio; sin duplicados con `GToaster` y `GErrorSummary` reales.
  - **Teclado y foco:** Alt+F8 ida y vuelta; Esc recoge con `stopPropagation` sin cerrar el `GDialog` anfitrión; al recogerse con el foco dentro → guardado, marca o siguiente tabulable, nunca `body`.
  - **Marca y eco:** la marca vive con la condición vista; abre la lista con el foco en su acción; eco una vez y solo con la marca visible (fuera del visor o bajo un modal, ninguno).
  - **D1:** posiciones de referencia y del control con foco Δ 0px en cada etapa, también en 320px.
  - **Convivencia:** `EDGE_ORDER` nuevo con voz, zócalo, FAB y avisos reales (un FAB de arriba no se mueve al caer la isla); reserva solo mientras se ve; traslado al modal con la etapa intacta; hoja móvil.
  - **Peso** y compuertas: `grep -q "g-status-island__shape"`, `! grep -q "createStatus" packages/vue/dist/grana.js`, `test -f packages/vue/dist/status.js`, y nueva `grep -q "g-status-island__peek" packages/vue/dist/grana.css`.
- **coco:** «Encargos» y la rúbrica; contraste por tipo en claro y oscuro con 3+ temas del CLI; `forced-colors`; zoom 200 % y 400 %; movimiento reducido (0 animaciones de desplazamiento ni escala en curso).
- **No verificado y pendiente (entorno real):** lector de pantalla (el titular que se va solo, el relevo sin anuncio, el asomo con `aria-describedby`, Alt+F8 con lector); táctil real (primer y segundo toque, pausa del asomo); Safari real a 60/120 Hz; `forced-colors` real; coste de `backdrop-filter` en equipos modestos; el atajo en un escritorio Linux real (#692).

## Límites conocidos (para el README)

- **El texto visible es temporal.** Lo pendiente vuelve con su marca y con Alt+F8. **Sin marca y en táctil, una condición sin acción no tiene vuelta** tras recogerse: si debe verse siempre («Sin conexión»), la aplicación pone una `GStatusMark` de texto en su cabecera. Una condición con acción sin marca no se recoge sola (se queda hasta «Ocultar»).
- **Quien usa lector** recibe el anuncio completo al llegar; lo presente al cargar no se anuncia (la aplicación puede `announce(id)`).
- **`Alt+F8` en Linux:** GNOME y Xfce lo reservan (límite de alcance, #692); la aplicación usa `hotkey`.
- **Orden de capa:** manda el último `showPopover()`; montar `GStatusIsland` después de `GToaster` y `GSpeechHost`.
- **Un FAB de arriba** baja la isla aunque esté en otra esquina (reserva por borde).
- **`light-dark()`** necesita Chrome 123, Firefox 120 y Safari 17.5; un tema que redeclare el grupo de color **sin** `color-scheme` toma la rama equivocada (`tokens.md` §12.1).
- Sin historial; lo visto vive en memoria (no sobrevive a una recarga).

## Resolución de hallazgos

### r03 y r04 (`design/lab/alert/r03/declaracion.md` §2 y §8; `r04/declaracion.md` §7; `auditoria-movimiento.md`)

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| F1 (kiwi r03) / F2 (coco) | Barra a todo el ancho al nacer; nace con el tamaño anterior | Cápsula de tamaño fijo en `drop`; destino medido antes de `grow`; vars borradas al vaciarse | #701 |
| F2 (kiwi) / F1 (coco) | El error aparece abierto de golpe con «Guardar» en uso | Sin apertura automática ni `openRect`; la entrada nunca se cancela | #696, #701 |
| F3 (coco) | Vaciarse sin fundido en Firefox | `hidden` llega tras `rise`; no se usa la transición de `display` | #701 |
| F3, F4 (kiwi r03) | Error de la demo que no se retira; éxito con la traza del 500 | Playground y README (bruno, mora-docs); acción cumplida con éxito = `resolve` | #697 |
| M1, M2, M3 | Muelle que encoge por debajo; insignia que cruza; panel que se va en el acto | Sin muelle al encoger; sin punto; contenido que sale con fundido antes del tamaño | #701 |
| I1 a I5 | Nacer brusco; nace abierto; punto mudo; caja vacía; «se queda» | Caída en `slow`; nada se abre solo; sin punto; nunca se funde vacía; transitoria | #693, #696, #701 |
| R1 | D2 y el punto | D2 sale: la memoria es la marca y Alt+F8 | #695 |
| R2 | «Nunca se cierra por tiempo» | Se recoge por tiempo de lectura con pausa; lo que hay que hacer no se pierde | #696 |
| R3 | Apertura automática (D3) | Retirada | #695, #696 |
| R4 | Errores que nadie retira | Vive con su origen (motivo `origin`) | #697 |
| R5 | `resolve` conserva la descripción | `resolve` limpia descripción y detalle | #697 |
| r04 §5 | «Fijar» en el asomo; duración | «Fijar» **no**: la pausa del asomo (puntero, foco, toque), la marca y `duration: false` ya cubren 2.2.1 sin otro botón; duración = la de `GToast` | #696 |
| r04 §6.5 y estilo | Estética | V2C con filo + L1, `light-dark()` | #694 |
| Rúbrica 1, 2, 5 | Interrupciones, asomo táctil, eco sin marca visible | «Interrupciones», «Asomo táctil», «Eco en la marca» | #702, #703, #700 |
| Rúbrica 3, 4 | Delimitación sobre fondos oscuros; coste de animar tamaño | coco (filo y medida); bruno y coco (una sola superficie, `backdrop-filter` medido) | #694, #701 |

Las resoluciones de r01 y r02 siguen vigentes salvo lo que sustituyen #693 a #705 (`git log` de este archivo).

## Fuera de v0.1

Historial; persistir lo visto; `icon` por condición; varias acciones; contenido rico; agrupar condiciones repetidas; **«Fijar»** (reservado, #696); `duration` por condición; conceptos **A** (hilo desde la marca), **B** (punto que habla) y **C** (titular con cifras) de r03, y **D2** (mazo) y **D3** (repisa) de r04, prototipados y descartados (#695); la sesión de voz como aviso de la isla.
