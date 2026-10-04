# Contrato · Isla de estado (gestor `createStatus`, región `GStatusIsland`, marca `GStatusMark`, declarativo `GStatus`)

**Dueño:** lima · **Estado:** aprobado (forma, marca, dos píldoras y curva: decisiones del usuario del 2026-10-04; el resto deriva de WCAG 2.2, APG y los contratos vigentes; **dos puntos para confirmar con el usuario**, al final) · **Basado en:** `design/lab/alert/r01/` (kiwi; base funcional: frontera del `brief.md`, 27 puntos, L1 a L12) y `design/lab/alert/r02/` (kiwi, commit `19b0655`; **B · Isla de estado**, §2 a §9, D1 a D5, L1 a L12; `index.html?c=B`, `verificar.mjs` 56/56 en tres motores) · **Compone:** `dialog.md` (hoja móvil), `btn.md`, `GIcon` interno · **Convive con:** `toast.md`, `speech.md` §6.7, `form.md` (`GErrorSummary`, `GFormActions`), `dialog.md` (traslado al modal superior) · **Decisiones:** DECISIONS.md #315 a #327
**Tags:** `g-status-island` (región, una por aplicación) · `g-status-mark` (marca junto al origen) · `g-status` (declarativo, sin pintura) · **Categoría:** comunicación y estado
**Componente complejo** (CLAUDE.md «Modelos por rol»: servicio con estado, se posiciona sobre otros elementos, traslado al modal, compone `GDialog` y `GBtn`): **coco en Opus, bruno en Fable**.

Una **región única y persistente** de la aplicación que reúne lo que **está pasando y dura**: condiciones de página (sin conexión, sesión por caducar, mantenimiento, solo lectura), fallos del servidor al guardar o al cargar, y resultados que deben quedarse (éxito con enlace). Vive en el borde superior del visor, **fuera del flujo: nunca empuja ni mueve el contenido**. Cubre el hueco que `toast.md` dejaba («Información persistente de página»).

---

## Principios

- **Una condición es estado, no suceso** (#318). Tiene **clave** (`id`): declararla otra vez la actualiza **en el mismo elemento**; dura hasta que la aplicación la quita. Por eso hay API imperativa **con clave** y, a diferencia de `GToast` (#140), **también** un componente declarativo (`<GStatus>`) que limpia al desmontarse: el fallo de carga de una vista no debe sobrevivir a la vista.
- **Nada se mueve, nunca** (D1). La isla y sus cambios no alteran la posición de ningún elemento de la página. La marca en línea ocupa un sitio que no empuja (regla de uso, «`GStatusMark`»).
- **Un solo sitio con memoria** (D2). Reconocer no borra: la isla se repliega a un **punto** y sigue ahí mientras dure alguna condición.
- **Nunca toma el foco** (D3). Ni al aparecer, ni al abrirse sola, ni al actualizarse. Al cerrar, descartar o vaciarse, el foco **nunca** acaba en `body`.
- **Un suceso, un canal.** O aviso flotante (`GToast`) o isla; o resumen de validación (`GErrorSummary`) o isla. La validación (también los 422 y los errores generales de `errors`) **nunca** va a la isla.
- **Solo texto** (como #139): título, descripción, un enlace, una acción, un detalle técnico. Sin slots ni HTML en la isla: garantiza el anuncio y evita interactivos anidados.
- **Sin textos por defecto** (#226): `labels` del gestor, todos sin valor.
- **Sin red ni globals:** el gestor no usa `fetch` ni toca `document`/`window` al importarse ni al crearse (SSR). «Reintentar» llama a una función de la aplicación.
- **Se reutiliza:** `GDialog` (hoja móvil), `GBtn`, `GIcon` interno, `utils/liveRegion.js`, `utils/topModal.js`, `utils/edgeReserve.js` (generalizado, §«Borde compartido»), `utils/template.js` (`fill`), el umbral de hoja `space × 130` (#103).

## Frontera (de `r01/brief.md`, sin cambios)

| Necesidad | Usar |
| --- | --- |
| Confirmar algo breve que puede perderse | `GToast` |
| Validación de un `GForm` (incluidos 422 y errores generales de `errors`) | `GErrorSummary` + mensaje del campo |
| Error o ayuda de un campo | mensaje del campo |
| Decisión obligatoria antes de seguir | `GDialog role="alertdialog"` |
| Estado breve del envío junto a los botones («Guardado hace 2 min») | `status` de `GFormActions` |
| Estado de una tarjeta | `status` + `retryable` de `GCard` |
| **El servidor falló** (500, tiempo agotado, sin red) y no se arregla en un campo | **isla** + marca enlace junto al origen |
| **Condición de página que dura** (mantenimiento, solo lectura, sesión por caducar, sin conexión) | **isla** |
| **Resultado que debe quedarse** (éxito con enlace a lo creado) | **isla** (se va al reconocerlo) |
| Advertencia o información que es **contenido** de una sección, tarjeta o diálogo | **marca de texto** (`GStatusMark` sin `for`); **no entra en la isla** |

## Entrega (API pública)

Exportaciones de **`@grana/vue`** (paquete principal, #317; bruno las registra en `src/index.js` y `app.use(Grana)` registra los tres componentes):

| Exportación | Qué es |
| --- | --- |
| `createStatus(options?)` | Crea el **gestor** de la aplicación. Es plugin de Vue: `app.use(status)` lo provee |
| `useStatus()` | Devuelve el gestor provisto; sin gestor, aviso y `undefined` |
| `statusKey` | Clave de inyección |
| `GStatusIsland` | Pinta **la** isla del gestor. Se monta **una vez**, lo más alto posible y **después** de `<GToaster />` y `<GSpeechHost />` si existen (orden de capa, «Límites conocidos») |
| `GStatusMark` | Marca junto al origen (enlace a la isla) o línea de texto de una sección |
| `GStatus` | Declarativo sin pintura: registra una condición mientras está montado |

```js
// main.js
export const status = createStatus({ labels: { /* textos de la app */ } })
createApp(App).use(status).mount('#app')
```

```vue
<!-- App.vue -->
<RouterView /> <GToaster /> <GStatusIsland />
```

```js
const status = useStatus()
status.set('save', {
  type: 'error', title: 'No se pudo guardar la factura', description: 'El servidor no respondió.',
  action: { label: 'Reintentar', busyLabel: 'Reintentando…', onClick: () => save().then((f) => ({
    type: 'success', title: 'Factura guardada', description: '', action: undefined, persistent: false,
    link: { label: 'Ver factura', href: f.url } })) },
  origin: { label: 'Ir al formulario', target: 'invoice-form' }
})
status.resolve('offline', 'Conexión restablecida')   // condición → resultado, en el mismo elemento
status.remove('maintenance')
```

```vue
<!-- en la vista: vive mientras la vista esté montada y el fallo dure -->
<GStatus v-if="loadFailed" id="invoices" type="error" title="No se pudieron cargar las facturas"
         :action="{ label: 'Reintentar', onClick: reload }" :origin="{ label: 'Ir a Facturas', target: 'invoices-table' }" />
<!-- junto al origen -->
<GStatusMark for="invoices">No se pudieron cargar</GStatusMark>
```

### Opciones del gestor (`createStatus(options)` y `configure(patch)`)

| Opción | Tipo | Valores | Default | Regla |
| --- | --- | --- | --- | --- |
| `position` | String | `top-center` `top-start` `top-end` | `top-center` | Lógica (`start`/`end` siguen el `dir`). Siempre arriba, también en móvil |
| `offset` | Object | `{ top? }`: Number (px) o String (longitud CSS) | `{}` (función) | Reserva para una cabecera fija; se suma al margen, a `safe-area` y a la reserva del borde |
| `hotkey` | String \| `false` | sintaxis de `aria-keyshortcuts` | `'Alt+F8'` | Va a la isla y vuelve. `false` lo quita (se llega con Tab y con la marca). `F6` o ilegible: se rechaza y se conserva el anterior. `F8` o `Shift+F8`: se acepta con aviso (atajos de `GToaster` y de la voz) |
| `autoOpen` | Boolean | | `true` | Un `error` nuevo abre la isla sola, con los límites de «Apertura automática». `false`: nunca se abre sola (da el toque) |
| `labels` | Object | ver «Textos» | `{}` (función) | Sin valores por defecto |

`configure(patch)` fusiona (y `labels` y `offset` por clave), aplica en vivo y no reanuncia. Valor fuera de lista: aviso y se conserva el anterior. **Rechazados en v0.1:** `limit` (no hay máximo: el panel desplaza), `position` abajo (borde de la voz en móvil y de los avisos), cierre automático (lo transitorio es de `GToast`).

### Modelo de una condición (`set(id, options)`)

| Opción | Tipo | Valores | Default | Regla |
| --- | --- | --- | --- | --- |
| `type` | String | `info` `success` `warning` `error` | `info` | Icono, color, canal y gravedad. `error` lee el color `danger` (#133). Sin `neutral` ni `loading`: la isla necesita una insignia con forma, y «cargando» no es una condición que dura |
| `title` | String | **obligatorio** | | Sin título: aviso y no se registra (`set` devuelve `null`) |
| `description` | String | texto libre | sin valor | Mismo nombre que en `GToast`. Varias líneas; no se recorta en el panel |
| `details` | String | texto libre (traza, código, id de petición) | sin valor | **Detalle técnico**: Disclosure cerrado por defecto, `dir="ltr"`, se parte en 320px, con «Copiar» |
| `action` | Object | `{ label, busyLabel?, onClick(condition) }` | sin valor | **Una**. Ver «Acción y resolución en el sitio» |
| `link` | Object | `{ label, href, target?, rel?, onClick?(event, condition) }` | sin valor | **Uno**. `<a>` nativo; `onClick` recibe el evento nativo **cancelable** (la aplicación con router hace `preventDefault()` y navega; sin dependencia de router, #70). Activarlo repliega la isla |
| `origin` | Object | `{ label, target }`; `target`: `id` (String), `Element` o función que lo devuelve | sin valor | Botón «Ir a…»: repliega la isla y enfoca el origen (`tabindex="-1"` temporal si no es enfocable, `scrollIntoView` `nearest`). Si el destino no existe al pulsar: aviso y no hace nada |
| `persistent` | Boolean | | `type !== 'success'` (se recalcula con `type` mientras la aplicación no lo fije) | `true` = **condición**: al reconocerla se queda (punto). `false` = **resultado**: al reconocerlo se retira |
| `dismissible` | Boolean | | `false` | Botón de descartar propio: quita **solo** esa condición (motivo `dismiss`) |
| `deadline` | Number \| Date | marca de tiempo | sin valor | Cuenta atrás (WCAG 2.2.1): visible en `role="timer"` con `aria-live="off"`; anuncios solo en los umbrales; `onExpire` al llegar a cero (la condición **no** se quita sola) |
| `politeness` | String | `polite` `assertive` | `assertive` en `error`; `polite` en el resto | Como `GToast` (bajar un `error` avisa en desarrollo) |
| `onRemove` | Function | `(reason, condition) => void` | sin valor | Una vez, al retirarse por cualquier vía (motivos abajo) |
| `onExpire` | Function | `(condition) => void` | sin valor | Una vez, cuando `deadline` llega a cero |

**Rechazados en v0.1:** `icon` (la insignia es del tipo; r01 L10: no entra un reloj ni iconos de caso), `actions` en plural, slots/HTML/`component`, `sticky` y `headingLevel` (eran de la banda de r01: la isla siempre es fija y no lleva encabezados), `duration`. Opción desconocida: se ignora con aviso.

**Forma de solo lectura** (`status.conditions[i]`, `get(id)`, y la **copia** que reciben `onClick`, `onRemove` y `onExpire`): las opciones resueltas más `id`, `acknowledged: boolean`, `busy: boolean`, `since: number` (creación o último cambio de `type`; ordena) y `updatedAt: number`.

**Motivos de retirada (`reason`):** `dismiss` (botón descartar) · `acknowledge` (un resultado al reconocerlo) · `api` (`remove`, `resolve` sin resultado) · `clear` · `unmount` (`<GStatus>` desmontado).

### El gestor

| Método | Firma | Devuelve | Hace |
| --- | --- | --- | --- |
| `set` | `set(id, options)` | `id` o `null` | **Declara** la condición. `id` nuevo: la crea. `id` existente: **sustituye** su declaración en el mismo elemento (conserva `acknowledged` salvo que cambie `type`) |
| `info` · `success` · `warning` · `error` | `(id, title, options?)` | `id` | Atajos de `set(id, { ...options, type, title })` |
| `update` | `update(id, patch)` | `true` si existía | Fusiona `patch` en el sitio |
| `resolve` | `resolve(id, result?)` | `true` si existía | Con `result` (String = título, u Object): pasa **en el mismo elemento** a `type: 'success'`, `persistent: false`, sin `action`, sin `busy`, sin `deadline`, más lo que traiga `result` (p. ej. `link`). Sin `result`: `remove(id)` |
| `remove` | `remove(id)` | `true` si existía | La retira (motivo `api`) |
| `clear` | `clear()` | | Retira todas (motivo `clear`) |
| `announce` | `announce(id)` | `true` si existía | **Vuelve a anunciar** la condición tal como está y le quita el reconocimiento (r01 L5: un segundo fallo idéntico no cambia `type` ni `title`). Si es `error`, aplica «Apertura automática» |
| `acknowledge` | `acknowledge()` | | Reconoce **todas** las actuales (lo mismo que «Entendido») |
| `open` | `open(id?, { focus = false }?)` | `true` si hay condiciones | Abre la isla (en móvil, la hoja); con `id`, desplaza a esa condición. **No mueve el foco** salvo `focus: true` (solo para gestos de la persona; la marca lo usa) |
| `close` | `close()` | | Repliega (no mueve el foco si estaba fuera) |
| `has` · `get` | `(id)` | Boolean · copia o `undefined` | Lectura |
| `configure` | `configure(patch)` | | Ver arriba |
| `conditions` | propiedad reactiva de solo lectura | `Condition[]` | En el **orden de la isla** |
| `state` | propiedad reactiva de solo lectura | `{ form: 'empty' \| 'dot' \| 'compact' \| 'open', count: number, mobile: boolean }` | Para la aplicación y las pruebas |
| `install` | `install(app)` | | `provide(statusKey, status)` |

Ningún método lanza: devuelven `false`/`null` y avisan en desarrollo. En el servidor guardan estado y no arrancan nada. **Nombres:** `set` y no `add` (declarar dos veces la misma clave no añade otra); no hay `promise` ni `type: 'loading'` (esa transición es de `GToast.promise`; aquí el paso error → reintentando → éxito lo da `action`).

### Acción y resolución en el sitio (#318)

1. La persona activa la acción: se llama a `action.onClick(copia)`.
2. Si devuelve una **promesa** (*thenable*), la condición pasa a **`busy`**: `aria-busy="true"` e `is-busy` en su `li`, la insignia cambia a `loader-circle` y gira (también la del resumen si es la primera y la de su marca), el botón queda **enfocable** con `aria-disabled="true"` y muestra `busyLabel` (si existe; se anuncia por el canal cortés). Otra pulsación no hace nada. **Nunca** `loading` ni `loadingText` de `GBtn` (no se pinta `g-btn__status`, #257).
3. **Se cumple con un objeto:** `update(id, objeto)` (el desenlace que decida la aplicación: éxito, u otro error). **Se cumple con otra cosa:** solo termina `busy` (la aplicación ya llamó a `resolve`, `remove` o `update`).
4. **Se rechaza:** termina `busy`, la condición queda como estaba y **se vuelve a anunciar** (`announce(id)`: el reintento falló otra vez). El gestor **consume** el rechazo (la promesa es suya: nadie más la espera); no lo relanza.
5. Si no devuelve promesa, no hay `busy`.
6. Todo ocurre en el **mismo `li`** (identidad del nodo medida por kiwi). Si el cambio de `type` reordena la lista, el nodo se mueve, no se recrea, y bruno restituye el foco si estaba dentro.
7. Si la condición se retira con la promesa pendiente, el desenlace **no la vuelve a crear**.

## Las tres formas (#319)

Una sola superficie (`g-status-island__shape`) que cambia de tamaño con continuidad (D4). `data-form` en la raíz:

| Forma | `data-form` | Cuándo | Qué se ve |
| --- | --- | --- | --- |
| Vacía | `empty` | Cero condiciones | La `section` está `hidden`; la raíz y los canales siguen montados |
| **Compacta** | `compact` | Hay alguna condición **sin reconocer** y la isla no está abierta | Resumen de una línea: insignia de la primera, su título (elipsis si no cabe; el texto completo está en el nombre accesible y en el panel), cuenta atrás si la tiene, «+N» |
| **Abierta** | `open` | La abre la persona (clic, Enter/Espacio, atajo, marca) o un `error` nuevo («Apertura automática») | Resumen + panel con la lista y «Entendido». En móvil, el panel es una hoja (`GDialog`) |
| **Punto** | `dot` | **Todas** las condiciones actuales están reconocidas | Solo la insignia de la primera; el texto del resumen queda con el patrón de texto oculto accesible (el nombre accesible no cambia) |

- **Orden** (DOM = lectura = foco; nunca `order` de CSS): gravedad `error` → `warning` → `info` → `success`; dentro, `since` más reciente primero. El resumen muestra la primera. **Sin máximo**: el panel desplaza (`max-block-size` del visor menos su posición y el margen; `overscroll-behavior: contain`).
- **Reconocer** («Entendido» o `acknowledge()`): las `persistent` quedan `acknowledged` (y `is-acknowledged`); las que no, se retiran (motivo `acknowledge`). La isla se repliega: **punto** si queda alguna, vacía si no. **No desaparece mientras dure alguna condición.** El reconocimiento vive en memoria (no sobrevive a una recarga).
- **De punto a compacta:** llega una condición nueva, una reconocida cambia de `type`, o `announce(id)`. Esa condición pierde `acknowledged`.
- **Descartar** (`dismissible`): quita solo esa condición.
- **Cerrar la abierta:** Esc con el foco dentro, pulsar fuera (`pointerdown` fuera de la isla y de toda `g-status-mark--link`; **no mueve el foco**), «Entendido», «Ir a…», el enlace, el atajo, o **que el foco vaya fuera a un elemento que la isla abierta tapa** (WCAG 2.4.11). Vuelve a compacta o a punto según el reconocimiento.
- **Toque:** cuando llega (o se reanuncia) una condición con la isla ya visible y **no** se abre sola, la isla da un toque (`is-nudge`, «Movimiento»). También el paso de vacía a visible es su «nacer».

### Apertura automática (lo grave se abre solo)

Un `error` que **aparece**, una condición que **pasa a** `error`, o `announce(id)` de un `error`, abre la isla **solo si se cumplen las cuatro**:

1. `autoOpen` es `true`.
2. **No es móvil** (visor ≥ `space × 130`): en móvil abrir es una hoja modal y solo la abre la persona.
3. La isla estaba montada **antes** del suceso (las condiciones que existen al montar no abren, no anuncian y no dan toque).
4. **El rectángulo de la isla abierta no se solapa con el elemento en uso**: `document.activeElement` si no es `body` y está fuera de la isla; si es `body`, el destino del último `pointerdown` que siga conectado (WebKit no enfoca botones con el ratón). bruno mide el rectángulo abierto **antes de pintarlo** (en el mismo cuadro). Si se solaparía: se queda compacta, muestra el error en su línea y da el toque.

Nunca toma el foco. No hay cierre automático por tiempo.

## `GStatusIsland`

### Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `status` | Object (gestor) | | el inyectado (`statusKey`) | propia (patrón de servicios, `api.md`) |

Sin eventos públicos ni slots (todo va por el gestor). Dos `GStatusIsland` del mismo gestor: la segunda no pinta nada y avisa.

### Estructura accesible

```html
<div class="g-status-island g-status-island--position-top-center" id="ID" popover="manual"
     data-position="top-center" data-align="center" data-form="compact" data-type="error">   <!-- + data-mobile, is-ready, is-nudge -->
  <div class="g-status-island__live" role="status" aria-live="polite" aria-atomic="true"></div>
  <div class="g-status-island__live" role="alert" aria-atomic="true"></div>
  <section class="g-status-island__shape" aria-label="Estado de la aplicación (Alt+F8)"
           style="--_island-w: 312px; --_island-h: 48px">                                       <!-- hidden sin condiciones -->
    <div class="g-status-island__inner">
      <button class="g-status-island__summary" id="ID-summary" type="button"
              aria-expanded="false" aria-controls="ID-panel" aria-keyshortcuts="Alt+F8">        <!-- móvil: aria-haspopup="dialog", sin aria-controls -->
        <span class="g-status-island__badge" data-type="error" aria-hidden="true"><svg class="g-icon">…</svg></span>
        <span class="g-status-island__text">
          <span class="g-status-island__sr">Estado: 3 avisos. Error: </span>No se pudo guardar la factura</span>
        <span class="g-status-island__timer" role="timer" aria-live="off">4:59</span>            <!-- solo con deadline en la primera -->
        <span class="g-status-island__more"><span aria-hidden="true">+2</span><span class="g-status-island__sr">y 2 más</span></span>
      </button>
      <div class="g-status-island__panel" id="ID-panel" hidden>                                  <!-- escritorio -->
        <ul class="g-status-island__list">
          <li class="g-status-item g-status-item--type-error has-action" id="ID-i-1" data-type="error">   <!-- is-busy + aria-busy, is-acknowledged, has-details -->
            <span class="g-status-item__badge" data-type="error" aria-hidden="true"><svg class="g-icon">…</svg></span>
            <div class="g-status-item__content">
              <p class="g-status-item__title" id="ID-i-1-title"><span class="g-status-item__type">Error: </span>No se pudo guardar la factura</p>
              <p class="g-status-item__description">El servidor no respondió.</p>
              <span class="g-status-item__timer" role="timer" aria-live="off">4:59</span>
              <a class="g-status-item__link" href="…">Ver factura</a>
              <button class="g-btn … g-status-item__details-toggle" type="button" aria-expanded="false" aria-controls="ID-i-1-details">Detalle técnico</button>
              <div class="g-status-item__details" id="ID-i-1-details" hidden>
                <pre class="g-status-item__details-text" dir="ltr">…</pre>
                <button class="g-btn … g-status-item__copy" type="button">Copiar</button>
              </div>
            </div>
            <div class="g-status-item__actions">
              <button class="g-btn … g-status-item__action" type="button">Reintentar</button>
              <button class="g-btn … g-status-item__origin" type="button">Ir al formulario</button>
            </div>
            <button class="g-btn g-btn--icon … g-status-item__dismiss" type="button" aria-label="Descartar: …"><svg class="g-icon">…</svg></button>
          </li>
        </ul>
        <div class="g-status-island__foot"><button class="g-btn … g-status-island__ack" type="button">Entendido</button></div>
      </div>
    </div>
  </section>
  <dialog class="g-dialog g-dialog--mobile-sheet g-status-sheet">…</dialog>                     <!-- móvil: GDialog real con la misma lista y pie -->
</div>
```

- **Raíz:** `popover="manual"` **abierta siempre** desde el montaje (`showPopover()`), capa superior como `GToaster` (#141). Sin rol. No captura el puntero; `__shape` sí.
- **Canales:** dos `g-status-island__live` (patrón de texto oculto accesible), presentes y vacíos desde el montaje, **fuera** de la `section` (para que `hidden` no los afecte); viajan con la raíz al modal.
- **`__shape`:** `section` con nombre (`fill(labels.region, { hotkey })`); `hidden` sin condiciones. Es la superficie que cambia de tamaño: lee `--_island-w` y `--_island-h` (px) que escribe bruno con el tamaño natural de `__inner` (`ResizeObserver`); el resto es de coco.
- **Resumen:** un `button`. Nombre accesible = contenido: `labels.summary` (`{count}`) + prefijo de tipo + título + `labels.more` (`{count}` = las demás; solo con más de una). `aria-expanded`; `aria-controls` → panel (escritorio); `aria-keyshortcuts` = `hotkey` (sin atributo con `false`). Área ≥ 24px (≥ 44px con `pointer: coarse`, también en punto: con un `::after` como `GBtn` si la forma mide menos).
- **Insignia:** icono por tipo (`info` · `circle-check` · `triangle-alert` · `circle-alert`; `loader-circle` con `busy`), `.g-icon` hijo directo. **Tipo sin color** (WCAG 1.4.1): forma del icono + prefijo oculto + estilo del borde de la insignia (**sólido** `error`, **discontinuo** `warning`, **punteado** `info`, sin borde propio `success`; convención de `GToast`/`GCard`).
- **Aviso (`li`):** orden del DOM = contenido (título, descripción, cuenta atrás, enlace, detalle) → acciones (acción, «Ir a…») → descartar. Sin rol propio. `id` derivado de un contador interno (no del `id` de la aplicación, que puede llevar espacios).
- **Detalle técnico:** Disclosure (`aria-expanded`, `aria-controls`, panel `hidden`). «Copiar» escribe `details` con `navigator.clipboard.writeText` (solo al pulsar) y, si se cumple, anuncia `labels.copied` (cortés). Abrir o cerrar el detalle no anuncia.
- **Botones:** `GBtn` con las props que fije coco (acción y «Entendido» `size="sm"`; descartar `icon size="sm"` con `x` y `aria-label = fill(labels.dismiss, { title })`; «Ir a…» y el conmutador del detalle, discretos). Coco reasigna sus alias de color sobre la superficie inversa, como `GToast.css` con sus botones.
- **Cuenta atrás:** texto `m:ss` (`h:mm:ss` desde una hora), cifras tabulares; un solo intervalo de 1 s para todas, solo en el cliente y con la isla montada.

## `GStatusMark` (#323)

Complemento en línea de la isla (decisión del usuario 2). Dos usos, según `for`:

| | **Enlace** (`for`) | **Texto** (sin `for`) |
| --- | --- | --- |
| Para qué | Junto al origen de una condición de la isla (el botón «Guardar», el hueco de las filas) | Advertencia o información que es **contenido** de una sección, tarjeta o diálogo |
| Elemento | `button` cápsula | `div` con un `p` |
| En la isla | Sí: la abre **en su condición** | **No entra en la isla** |
| Anuncia | Nunca | Nunca (es contenido; si debe anunciarse al aparecer, es una condición de la isla) |

### Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `for` | String \| Number | `id` de una condición | sin valor | propia |
| `type` | String | `info` `success` `warning` `error` | `info` | propia. **Solo sin `for`** (con `for`, el tipo es el de la condición; pasar los dos avisa) |
| `typeLabel` | String | texto libre | `labels.types[type]` del gestor | propia. Prefijo oculto de tipo de la marca de texto sin gestor, o para cambiarlo |
| `status` | Object (gestor) | | el inyectado | propia |

### Slots

| Slot | Propósito | Anatomía que debe conservar |
| --- | --- | --- |
| `default` | Texto **corto** de la marca. Alcance `{ condition, type, busy }` (con `for`), para decir «No se guardó» / «Guardada» según el tipo. Con `for` y sin slot: el `title` de la condición | Solo texto: va dentro del `button` (enlace) o del `p` (texto); sin interactivos |
| `action` | **Solo sin `for`:** una acción opcional (`GBtn size="sm"`) | Después del texto, fuera del `p` |

Sin eventos propios.

### Estructura

```html
<!-- enlace -->
<button class="g-status-mark g-status-mark--link g-status-mark--type-error" type="button" data-type="error"
        aria-expanded="false" aria-controls="ISLA-panel">                       <!-- móvil: aria-haspopup="dialog", sin aria-expanded ni aria-controls; busy: is-busy + aria-busy="true" -->
  <span class="g-status-mark__badge" data-type="error" aria-hidden="true"><svg class="g-icon">…</svg></span>
  <span class="g-status-mark__text"><span class="g-status-mark__type">Error: </span>No se guardó</span>
</button>
<!-- texto -->
<div class="g-status-mark g-status-mark--text g-status-mark--type-warning" data-type="warning">
  <span class="g-status-mark__badge" data-type="warning" aria-hidden="true"><svg class="g-icon">…</svg></span>
  <p class="g-status-mark__text"><span class="g-status-mark__type">Advertencia: </span>Tu tarjeta caduca este mes.</p>
  <div class="g-status-mark__action">…</div>
</div>
```

### Reglas

- **Enlace:** existe **solo mientras exista la condición `for`** (sin ella no renderiza nada); tipo y `busy` salen de la condición (nunca se desincroniza). En el servidor no renderiza (aparece al montar). Al activarla: guarda la marca como elemento de vuelta, `open(id, { focus: true })` y el foco va, dentro de la condición, a la **acción** si está habilitada; si no, a «Ir a…», al enlace, a descartar o al propio `li` (`tabindex="-1"`). **Sin anuncios** a la ida ni a la vuelta. `aria-expanded` = la isla está abierta.
- **Vuelta** (D5): el atajo devuelve el foco a la marca; «Ir a…» lo lleva al `origin`; al cerrar la hoja móvil vuelve a la marca. Si la marca ya no está, rige «Foco».
- **No empuja:** la marca enlace se coloca donde su aparición no desplace nada: en `GFormActions`, como hijo del slot por defecto **antes** del botón (la fila alinea al final: medido por kiwi, Δ 0px); en `GTable`, dentro del slot `empty`. **Nunca en el slot `status` de `GFormActions`** (es `role="status"`: duplicaría el anuncio).
- **Texto:** una línea de insignia + texto + una acción opcional, sin caja, sin detalle ni varias acciones (eso es de la isla). Estática: no anuncia, no se cierra.
- Área de la cápsula ≥ 24px (≥ 44px con `pointer: coarse`).

## `GStatus` (declarativo, sin pintura)

No renderiza nada. Mientras está montado, su condición existe.

| Prop | Tipo | Default | Regla |
| --- | --- | --- | --- |
| `id` | String \| Number | **obligatoria** | Clave de la condición |
| `type` · `title` · `description` · `details` · `action` · `link` · `origin` · `persistent` · `dismissible` · `deadline` · `politeness` | como en «Modelo de una condición» | los del modelo | `title` obligatorio |
| `status` | Object (gestor) | el inyectado | |

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `remove` | `(reason)` | La condición se retiró por una vía distinta de su propio desmontaje (`dismiss`, `acknowledge`, `api`, `clear`): la aplicación apaga su `v-if` |
| `expire` | — | `deadline` llegó a cero |

- Al montar: `set(id, props)`. Al cambiar una prop: `update`. Al desmontar: `remove(id)` (motivo `unmount`).
- Retirada con el componente aún montado (la persona la descartó): **no se vuelve a registrar** hasta que el componente se monte de nuevo.
- Montado junto con la isla al cargar: no anuncia (regla 3 de «Apertura automática»). Montado después (una vista nueva, un fallo): anuncia como cualquier condición nueva.
- En el servidor no hace nada.

## Textos (`labels`, sin valores por defecto; #226)

| Clave | Marcadores | Dónde | Si falta |
| --- | --- | --- | --- |
| `region` | `{hotkey}` | `aria-label` de la `section` | Aviso al montar; sin nombre |
| `summary` | `{count}` (String o Function, #51) | Prefijo oculto del resumen («Estado: {count} avisos.») | Aviso; sin prefijo |
| `more` | `{count}` (String o Function) | Texto oculto de «+N» («y {count} más») | Aviso al haber más de una; «+N» queda sin texto |
| `types.info` · `types.success` · `types.warning` · `types.error` | | Prefijo oculto del título, del resumen, de la marca y del anuncio | Aviso al usar ese tipo; sin prefijo |
| `acknowledge` | | «Entendido» | Aviso al montar; **el botón no se dibuja** (sin texto no tiene nombre) y no hay forma de punto |
| `dismiss` | `{title}` | `aria-label` de descartar | Aviso al primer `dismissible`; el botón se dibuja igual |
| `details` · `copy` · `copied` | | Conmutador del detalle, «Copiar», anuncio tras copiar | Aviso al primer `details`; sin `details` no hay conmutador (ni detalle); sin `copy` no hay botón |
| `remaining` | `{time}` (String) o Function `(ms) => String` | Anuncio de los umbrales de la cuenta atrás | Aviso al primer `deadline`; no se anuncian los umbrales |
| `sheetTitle` · `close` | | `title` y `closeLabel` del `GDialog` de la hoja | Aviso al montar en móvil |

`{hotkey}` vacío con `hotkey: false`. Marcadores con `utils/template.js` (`fill`).

## Anuncios (#320; WCAG 4.1.3)

- **Mecanismo:** el **par propio de canales** de la isla, escrito con `createLiveWriter` (`utils/liveRegion.js`, `delay` 50 ms, `clear` 5000 ms, como `GToaster`). La isla, la lista, el resumen y las marcas **no** son regiones vivas. Cada servicio conserva su par (`api.md` «Convivencia de servicios»): no se comparte con `GToaster` (puede no estar montado) ni hay anunciador por anfitrión (el de los prototipos; efecto medido idéntico).
- **Texto:** `[types.<type>:] título[.] [descripción]` (sin nombres de botones).
- **Se anuncia, una vez por suceso:** una condición que aparece; un cambio de `type`, `title` o `description`; `announce(id)`; el rechazo de la promesa de la acción; `busyLabel` al empezar a reintentar (cortés); los umbrales de la cuenta atrás (**5 min, 1 min, 30 s**: `labels.remaining`, cortés); `labels.copied`.
- **No se anuncia:** lo que ya existe al montar la isla (**0 anuncios al cargar**); abrir, replegar, reconocer, descartar, «Ir a…», abrir el detalle, la marca; el traslado al modal; un cambio que **quita el control con foco** y lleva el foco al resumen (el foco ya lee el nombre nuevo: r01 punto 13).
- **Sin duplicados:** nunca el mismo texto en dos regiones vivas del documento. Con `GToaster` y `GErrorSummary` lo garantiza la regla de uso «un suceso, un canal» (Grana no lo detecta).

## Teclado

| Tecla | Dónde | Acción |
| --- | --- | --- |
| `hotkey` (**Alt+F8**) | Documento, con ≥ 1 condición y el foco **fuera** de la isla | Guarda el elemento enfocado, **abre** la isla y lleva el foco al resumen (en móvil, abre la hoja y el foco sigue la regla de `GDialog`, #292). `preventDefault` |
| `hotkey` | Foco **dentro** de la isla (o de su hoja) | Repliega y devuelve el foco al elemento guardado (si sigue conectado y no es inerte; si no, «Foco») |
| `hotkey` sin condiciones | | **No se intercepta** |
| Enter / Espacio | Resumen | Abre o repliega (nativo del botón) |
| Tab / Mayús+Tab | Abierta | Resumen → por condición: enlace, detalle, acción, «Ir a…», descartar → «Entendido». **No está atrapado** (no modal) |
| Esc | Foco dentro de la isla abierta | Repliega con `preventDefault()` + `stopPropagation()` (no cierra el `GDialog` anfitrión) y deja el foco en el resumen |
| Esc | Isla replegada o foco fuera | Nada |

Coincidencia del atajo como `GToaster`: `event.key` y modificadores **exactos**; con `event.isComposing` no se trata. F8 y Mayús+F8 no se interceptan.

## Foco

- **Nunca lo toma** al aparecer, actualizarse o abrirse sola.
- **Si el control con foco desaparece** («Reintentar» al resolverse, una condición descartada o retirada): el foco va al **resumen** (en la hoja móvil, al `li` de la condición con `tabindex="-1"`, o al cierre de la hoja si la condición ya no está; **nunca fuera del modal**).
- **Si la isla se vacía con el foco dentro:** al elemento guardado (atajo o marca) si sigue conectado y no es inerte; si no, al **siguiente elemento tabulable** del anfitrión (documento o modal); si no hay, al anterior. **Nunca a `body`.** La hoja móvil se cierra.
- **«Entendido»** con el foco en él: al resumen si la isla sigue (punto); si se vacía, regla anterior.
- **«Ir a…»** y el enlace: repliegan; «Ir a…» enfoca el origen.
- **Pulsar fuera** repliega sin mover el foco.
- **Hoja móvil:** foco y Esc de `GDialog`; al cerrarse, el foco vuelve al resumen o a la marca que la abrió.

## Borde compartido: voz → isla → avisos (#322)

Orden desde el borde superior: **pill de voz** (garantía, #213) → **isla** → **avisos flotantes**. La isla **lee** la reserva de quien va antes y se coloca debajo; **publica** el alto de su forma **replegada** en ese momento (alto medido de `__summary`, compacta o punto, **nunca** el de la abierta) más su margen, mientras no esté vacía. Los avisos suman todo lo publicado, como hoy.

### `utils/edgeReserve.js` generalizado (encargo a bruno; interno, no es API)

Hoy solo escribe la voz y solo lee `GToaster`, y la suma no distingue orden. Cambio mínimo y compatible:

```js
export const EDGE_ORDER = { speech: 10, status: 20 }          // menor = más cerca del borde; los avisos no publican
setEdgeReserve(owner, edge, px, { order = 0 } = {}, doc?)     // antes: (owner, edge, px, doc)
clearEdgeReserve(owner, doc?)                                  // sin cambio
edgeReserve(edge, { doc, except, before } = {})                // before: solo suma reservas con order < before
```

- **Orden por prioridad, no por montaje** (L5): cada reserva guarda su `order`.
- `GSpeechHost` publica con `order: EDGE_ORDER.speech` (su comportamiento no cambia: sigue sin leer nada).
- `GStatusIsland` lee `edgeReserve('top', { before: EDGE_ORDER.status })` y lo suma a su posición (variable en línea **`--_status-offset-top`** = `calc(<offset.top> + <reserva>px)`), y publica en `top` con `order: EDGE_ORDER.status`.
- `GToaster` **no cambia su llamada** (`edgeReserve(lado)` sin `before` suma todo): con el borde efectivo arriba, sus avisos quedan bajo la isla replegada.
- El cuarto parámetro posicional `doc` de `setEdgeReserve` pasa a quinto: bruno revisa las llamadas (hoy ninguna lo pasa) y `__shared`.
- Por **borde**, sin mirar la alineación (la isla abierta ocupa el centro y en visores estrechos todo se solapa).
- La isla **no** cambia de borde (`data-flipped` no existe aquí). Si la pill de voz aparece o cambia de borde, la isla se recoloca con una transición de `--g-duration-press` (sin muelle).

Cambios mínimos anotados en `speech.md` §6.7 y en `toast.md` «Convivencia» (ningún comportamiento de la voz ni de los avisos cambia).

## Convivencia

- **`<dialog>` modal (#141):** la raíz se **traslada al modal superior** (mismos nodos, canales incluidos, `utils/topModal.js` con `ignore` = su propia hoja) y vuelve a `showPopover()`; al cerrarse el modal vuelve a `body`. Las condiciones, el reconocimiento, la forma y la cuenta atrás no se reinician. El traslado no anuncia.
- **Móvil** (visor < `--g-space-1 × 130`, **medido**; `data-mobile`): la isla replegada sigue arriba; **abierta es una hoja inferior modal** con un **`GDialog` real** (`mobile="sheet"`, `title = labels.sheetTitle`, `closeLabel = labels.close`, clase `g-status-sheet`) con la misma lista y «Entendido». Solo la abre la persona (resumen, marca, atajo, `open()`). Al **cruzar el umbral** con la isla abierta, se repliega. `GToaster` y la voz se trasladan a la hoja como a cualquier modal.
- **`GToaster`:** canales, atajos y textos distintos. Los avisos nunca tapan la isla replegada (reserva).
- **Voz (`GSpeechHost`):** dos píldoras apiladas, la voz primero (decisión del usuario 3; `speech.md` no se reabre). Tres pares de canales en la página, cada uno con lo suyo.
- **`GErrorSummary`:** no se tocan.

## Movimiento (#324)

- **Cambio de forma** (punto ↔ compacta ↔ abierta): transición de `inline-size` y `block-size` de `__shape` entre los px de `--_island-w`/`--_island-h`, con **`--g-ease-spring`** y **`--g-duration-slow`** (tercer uso aprobado de la curva; el `× 1,6` del prototipo se descarta: nada supera 240ms, #71 y #280). Dentro de `@supports (transition-timing-function: linear(0, 1))`; fuera, `--g-ease-out`.
- **Toque** (`is-nudge`, una vez por suceso): keyframes `g-status-nudge`, escala desde **0,86** hasta 1 con `--g-ease-spring` y `--g-duration-slow`. bruno pone la clase y la quita en `animationend`.
- **Nacer** (de vacía a visible) y **vaciarse:** entrada con fundido y la misma escala en `--g-duration-press` + `--g-ease-out` (es una entrada: sin muelle, #299); salida con fundido de `--g-duration-fast`.
- **Contenido del panel y de la lista:** fundido (coco). Una condición que se retira sale en el acto; la superficie se ajusta con la transición de forma. Sin FLIP por elemento.
- **Giro** de `loader-circle`: `--g-duration-spin`.
- **Nada se anima al montar:** la primera escritura de `--_island-w/h` va sin transición; bruno pone `is-ready` dos cuadros después (plan 012).
- **`prefers-reduced-motion: reduce`:** sin cambio de tamaño animado, sin toque, sin giro, sin escala; solo fundidos de `--g-duration-fast` (patrón único, `tokens.md` §29.3). **Con movimiento reducido la isla no se mueve.**

## Tokens consumidos

**Ningún token nuevo** (`tokens.md` §31).

| Token | Para qué |
| --- | --- |
| `--g-color-text` (fondo) y `--g-color-surface` (texto, iconos, borde de insignia, anillo de foco interior) | **Superficie inversa** de la isla y de la marca enlace (#325). **No** `brand`: «un solo elemento sólido de `brand` por vista» (`tokens.md` §2). Se invierte sola en el tema oscuro |
| `--g-color-{info\|success\|warning\|danger}` + `--g-color-on-{…}` | Insignia de tipo sobre la isla (icono sobre relleno) |
| `--g-color-{info\|success\|warning\|danger}-text`, `--g-color-text`, `--g-color-text-muted` | Marca de texto (insignia y texto sobre la superficie de la página) |
| `--g-color-focus`, `--g-focus-width`, `--g-focus-offset` | Foco de la marca; dentro de la isla el anillo usa `--g-color-surface` (alias local) |
| `--g-radius-pill`, `--g-radius-xl`, `--g-radius-lg` | Píldora, isla abierta, cada aviso |
| `--g-shadow-2` | Elevación de la isla |
| `--g-border-width` | Borde de insignia (sólido, discontinuo, punteado) y `forced-colors` |
| `--g-space-*` | Tamaños, separación, margen al borde (con `env(safe-area-inset-top)`) |
| `--g-font-ui`, `--g-text-{body-sm\|body\|caption}-{size\|line}`, `--g-text-action-weight` | Texto |
| `--g-duration-{fast\|press\|slow\|spin}`, `--g-ease-{out\|standard\|spring}` | Movimiento |

**No son tokens** (constantes neutras, `tokens.md` §29.6 y §31): `0,86` (toque y nacer); umbrales de la cuenta atrás `300 000 · 60 000 · 30 000` ms y `ANNOUNCE` 50/5000 ms (JS); ancho de la abierta `min(space × 104, 100% − 2 × margen)`; alto de la compacta `space × 12`; insignia `space × 8` (`× 6` en punto y en la marca); margen `space × 2`. **Variables en línea** (datos del `.vue`, no tokens): `--_island-w`, `--_island-h`, `--_status-offset-top`. Medidas literales: solo `24px`/`44px`.

## Clases y datos (contrato bruno ↔ coco)

| Clase o atributo | Elemento | Cuándo |
| --- | --- | --- |
| `g-status-island`, `g-status-island--position-top-{start\|center\|end}`, `data-position`, `data-align` | Raíz | Siempre |
| `data-form="empty\|compact\|open\|dot"` | Raíz | Siempre (en móvil con la hoja abierta: `open`) |
| `data-type` | Raíz | Tipo de la primera condición (sin atributo si vacía) |
| `data-mobile` | Raíz | Visor < `space × 130` |
| `is-ready` | Raíz | Dos cuadros tras montar |
| `is-nudge` | Raíz | Durante el toque |
| `--_status-offset-top` | Raíz (en línea) | Con `offset.top` o reserva de borde |
| `g-status-island__live` (2), `__shape` (`hidden` vacía; `--_island-w`, `--_island-h` en línea), `__inner`, `__summary`, `__badge` (`data-type`, `is-busy`), `__text`, `__sr`, `__timer`, `__more`, `__panel` (`hidden` replegada o en móvil), `__list`, `__foot`, `__ack` | Partes de la isla | Según contenido |
| `g-status-item`, `g-status-item--type-{info\|success\|warning\|error}`, `data-type` | `li` | Cada condición |
| `is-busy` (+ `aria-busy="true"`), `is-acknowledged`, `has-action`, `has-details`, `is-dismissible` | `li` | Según estado |
| `g-status-item__badge` (`.g-icon` hijo directo), `__content`, `__title`, `__type`, `__description`, `__timer`, `__link`, `__details-toggle`, `__details` (`hidden`), `__details-text`, `__copy`, `__actions`, `__action`, `__origin`, `__dismiss` | Partes del aviso | Según contenido |
| `g-status-sheet` | `GDialog` de la hoja | Móvil |
| `g-status-mark`, `g-status-mark--link` \| `--text`, `g-status-mark--type-*`, `data-type`, `is-busy` | Marca | Siempre / con `busy` |
| `g-status-mark__badge`, `__text`, `__type`, `__action` | Partes de la marca | Según contenido |

`__sr`, `__type` y `__live` usan el patrón de texto oculto accesible. Estados que coco cubre: hover (`@media (hover: hover)`), `:focus-visible`, activo, `is-busy`, `prefers-reduced-motion`, `forced-colors` (borde `CanvasText` en la isla, la marca enlace y las insignias).

## Avisos de desarrollo

`console.warn` con prefijo `[Grana Status]`, una vez por caso, con la guarda `typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'`:

1. `set` en el cliente sin ninguna `GStatusIsland` montada para ese gestor (tras el siguiente ciclo; las condiciones esperan).
2. Dos `GStatusIsland` del mismo gestor (la segunda no pinta nada).
3. `GStatusIsland`, `GStatus` o `GStatusMark` con `for` sin gestor; `useStatus()` sin gestor o fuera de `setup` (`undefined`).
4. Condición sin `title` o sin `id`: no se registra.
5. `type`, `position`, `politeness` fuera de lista; opción desconocida; `actions` en plural; `action` sin `label` o sin `onClick`; `link` sin `label` o `href`; `origin` sin `label` o `target`.
6. `error` con `politeness: 'polite'`.
7. `hotkey` `F6` o ilegible (rechazado); `F8` o `Shift+F8` (aceptado; choca con `GToaster` o con la voz).
8. Falta un `labels` la primera vez que se necesita (tabla «Textos»).
9. `origin.target` que no existe al pulsar «Ir a…».
10. Título de más de 60 caracteres (el resumen lo recorta con elipsis).
11. Dos `<GStatus>` montados con el mismo `id`; `GStatusMark` con `for` y `type` a la vez; `GStatusMark` de texto sin prefijo de tipo (ni `typeLabel` ni `labels.types`).
12. `GStatusMark` con `for` activada sin isla montada.
13. La isla **replegada tapa por completo** el elemento enfocado (usar `position` u `offset`; «Límites conocidos»).

En producción no hay avisos ni comprobaciones extra.

## SSR

Importar `@grana/vue` y `createStatus` no tocan `document`, `window` ni `navigator`. En el servidor: `GStatusIsland` no renderiza nada; `GStatus` no hace nada; `GStatusMark` de texto renderiza normal y con `for` no renderiza. Escuchas (`keydown`, `pointerdown`, `resize`, `focusin`), el intervalo de la cuenta atrás, el `ResizeObserver` y el seguimiento del modal se crean al montar la isla y se retiran al desmontarla.

## Resolución de hallazgos

### r02 (`design/lab/alert/r02/declaracion.md` §12)

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| L1 | Nombres | `createStatus` / `useStatus` / `statusKey`, `GStatusIsland`, `GStatusMark`, `GStatus`. `GNotice`/`GAlert`/`GBanner` descartados | #317 |
| L2 | Imperativo con clave y declarativo | `set` / `update` / `resolve` / `remove` / `clear` / `announce` / `acknowledge` / `open` / `close`; `<GStatus>` limpia al desmontarse. **Sin `promise`**: la transición la da `action.onClick` que devuelve promesa | #318 |
| L3 | Solo texto | Sí: título, descripción, un enlace, una acción, detalle técnico; sin slots en la isla | #318, #139 |
| L4 | `labels` sin valores | Tabla «Textos» (añade `details`, `copy`, `copied`) | #325, #226 |
| L5 | `edgeReserve.js` | Generalizado con `order` y `before`; orden por prioridad; la isla lee y escribe | #322 |
| L6 | `GStatusMark` | `for`, `type`, `typeLabel`; **`busy` y tipo se derivan de la condición** (no son props: no se desincroniza); slots `default` y `action` | #323 |
| L7 | `GFormActions` | Marca en el slot por defecto antes del botón; nunca en `status` | «`GStatusMark`» |
| L8 | `GTable` sin estado de error | **Aplazado** con nombres reservados (`error` + slot `error`); hoy, marca en `empty`. A `PENDIENTES.md` | #327, `table.md` |
| L9 | Atajo | `Alt+F8`, validado como en `speech.md`. Límite: en escritorios Linux el gestor de ventanas suele reservarlo | #321 |
| L10 | Entrada del paquete | **Paquete principal**, con compuerta de peso de 8 KB gzip | #317 |
| L11 | Personalidad | D1 a D5 registradas; curva con `--g-duration-slow` (no `× 1,6`); toque `0,86`; punto | #316, #324 |
| L12 | De r01 siguen vigentes | L5 → `announce(id)` y rechazo de la acción; L6 → #327; L7 → #326 | abajo |

### r01 (`design/lab/alert/r01/declaracion.md`)

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| L1 | `GNotice` y su API | Sustituido por la isla. Se conservan `type`, `title`, `dismissible`, detalle, copia, cuenta atrás; caen `density`, `headingLevel`, `modelValue`, `icon` y los slots | #315, #318 |
| L2 | Canal compartido | Par propio de la isla con `createLiveWriter`; ni anunciador por anfitrión ni el de `GToaster` | #320 |
| L3 | Canal desde el inicio | Existe desde que se monta `GStatusIsland` (se monta una vez, en la raíz) | #320 |
| L4 | «Vista nueva» por contexto | No hace falta: lo que existe al montar la isla no se anuncia; lo demás sí. Las marcas no anuncian | #320 |
| L5 | Segundo fallo idéntico | `announce(id)`; el rechazo de la promesa de la acción lo hace solo | #318 |
| L6 | `GTable` sin error | Ver r02 L8 | #327 |
| L7 | `GForm`: el mensaje al perder el foco mueve «Guardar» y el clic se pierde | **Regla nueva en `form.md`**: el revelado por `blur` se aplaza mientras dure una pulsación de puntero. Encargo a bruno | #326 |
| L8 | Banda fija y reserva | No hay banda. La isla publica reserva siempre que no esté vacía | #322 |
| L9 | El aviso crece en un `GDialog` centrado | No aplica: la isla está fuera del flujo; la marca de texto es contenido estático | — |
| L10 | Iconos de caso, reloj | Sin `icon` en v0.1; ningún icono nuevo en la librería | #325 |
| L11 | Salida animada exige `v-model` | No aplica: la salida la pinta la isla, no quien declara | — |
| L12 | Firefox, anclaje del desplazamiento | No aplica: no se construye la compensación del punto 24 (nada entra en el flujo) | — |

## Límites conocidos (para el README)

- **`Alt+F8` en Linux:** GNOME y Xfce lo reservan para redimensionar la ventana y no llega a la página (**conocido, no comprobado en esta ronda**). La isla se alcanza con Tab y con la marca; la aplicación puede cambiar `hotkey`.
- **La isla replegada puede tapar por completo un control pequeño** situado bajo ella (p. ej. un buscador centrado en la cabecera): no cambia de borde (un elemento persistente no salta). Se evita con `position` u `offset`; aviso de desarrollo 13. WCAG 2.4.11 solo se garantiza para la isla **abierta**.
- **Orden de capa:** en la capa superior manda el último `showPopover()`. Montar `GStatusIsland` después de `GToaster` y `GSpeechHost`. La isla abierta y el panel de voz abierto (los dos bajo `top-center`) pueden solaparse cuando se abren con teclado; con puntero, pulsar en uno cierra el otro.
- El reconocimiento no sobrevive a una recarga. No hay historial.
- Sin duplicados entre servicios solo por regla de uso.
- «0 resultados» de `GTable` tras una carga fallida se anuncia junto al error de la isla hasta que `GTable` tenga estado de error (#327).

## Verificación (cómo se da por hecho)

- **bruno** (vitest + jsdom; Playwright en los tres motores para capa superior, modal, foco y medidas; puerto propio):
  - **API:** exportaciones; `app.use`; `useStatus` sin gestor; importación sin `document` (entorno `node`); SSR sin marcado de la isla.
  - **Modelo:** `set` crea y sustituye en el **mismo nodo**; `update`; `resolve` con y sin resultado; `remove`; `clear`; `onRemove` una vez con cada motivo; orden por gravedad y `since`; `persistent` por defecto según `type`.
  - **Acción:** promesa → `busy` (`aria-busy`, `aria-disabled`, `busyLabel`, insignia); cumplida con objeto → `update`; rechazada → reanuncio y sin rechazo sin manejar; retirada en curso no reaparece; error → reintentando → éxito con identidad de nodo.
  - **Formas:** `data-form` en cada paso; reconocer → punto con nombre accesible intacto; resultado reconocido se retira; nueva condición o cambio de tipo → compacta; vacía → `hidden` con canales montados.
  - **Apertura automática:** abre sin tomar el foco; no abre si taparía el elemento en uso (da el toque); nunca en móvil; nada al cargar; se repliega si el foco va debajo.
  - **Anuncios:** 0 al cargar; texto exacto y canal por tipo; uno por suceso; umbrales con reloj falso; ningún texto repetido entre regiones vivas con `GToaster` y `GErrorSummary` reales montados.
  - **Teclado y foco:** Alt+F8 ida y vuelta, sin condiciones no intercepta; Esc repliega con `defaultPrevented` sin cerrar el `GDialog` anfitrión; control que desaparece → resumen; isla que se vacía → guardado o siguiente tabulable, nunca `body`; hoja móvil sin foco fuera del modal.
  - **D1:** posiciones de elementos de referencia y del botón con foco idénticas (Δ 0px) antes y después de cada cambio, también en 320px.
  - **Convivencia:** `edgeReserve` (`order`, `before`, compatibilidad de `GToaster` y `GSpeechHost`: sus pruebas siguen en verde); con la voz real, voz → isla → avisos; traslado a un `GDialog` real y vuelta con estado intacto; hoja móvil con `GDialog` real.
  - **Marca:** enlace solo con condición; abre en su condición y enfoca su acción; vuelta; sin anuncios; texto estática; en `GFormActions` Δ 0px.
  - **Peso:** delta de `dist/grana.js` gzip medido y anotado en el `meta.json`; **si supera 8 KB, se detiene y devuelve a lima** (#317).
  - Avisos de desarrollo; `check-icons.mjs`; `levels.test.js`. Compuerta nueva: `grep -q "g-status-island__shape" packages/vue/dist/grana.css`.
- **coco** (auditoría con un tema distinto): texto ≥ 4.5:1 y insignia, borde y foco ≥ 3:1 sobre la superficie inversa, en claro y oscuro y **por tipo** (kiwi solo midió `error` y `warning`); tipo reconocible sin color; `forced-colors`; 24/44px (también en punto); 320px sin desplazamiento horizontal; RTL; zoom 200 % y 400 %; movimiento reducido (0 animaciones en curso); más de 6 condiciones y desplazamiento del panel; rebase del muelle medido.
- **`GForm` (#326):** spec propio `tests/form-blur-click.spec.mjs`.
- **No verificado y pendiente (entorno real):** lector de pantalla (nombre del resumen al cambiar, canales tras el traslado, `role="timer"`, `Alt+F8` con lector y en teclados sin fila de función); Safari y táctil reales; `forced-colors` real; convivencia real con la voz (especificada, no prototipada); el atajo en Linux.

## Para confirmar con el usuario

1. **Color de la isla:** superficie inversa (`text`/`surface`) en vez de `brand`/`on-brand` del prototipo. Con el tema por defecto se ve igual (casi negro); con un `brand` de color, la isla **no** se tiñe de marca. Deriva de la regla «un solo sólido de `brand` por vista» (#325).
2. **`Alt+F8`** se mantiene pese al límite en Linux (#321). Alternativa si se prefiere: `Alt+Shift+F8`.

## Fuera de v0.1

Historial; persistir el reconocimiento; `icon` por condición; varias acciones; contenido rico; agrupar condiciones repetidas; conceptos **A** (el control pasa a «Reintentar») y **C** (línea de tiempo dentro de un aviso), reservados (#315); la sesión de voz como aviso de la isla (decisión del usuario 3).
