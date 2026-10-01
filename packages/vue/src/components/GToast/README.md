# GToast (`createToaster`, `useToast`, `GToaster`)

Avisos **breves y no modales** que confirman o informan del resultado de algo que el usuario acaba de hacer o que acaba de pasar en segundo plano: «Cambios guardados», «No se pudo subir el archivo», «Proyecto archivado · Deshacer». Aparecen en una zona fija del visor, **no interrumpen la tarea y nunca reciben el foco por su cuenta**. Es un **servicio imperativo**: tu aplicación crea su gestor (`createToaster`), lo instala como plugin, lo usa con `useToast()` y monta **una** región `<GToaster />`. No hay `<GToast>` declarativo ni instancia global de Grana.

**Etiqueta:** `<g-toaster>` (región; cada aviso es un `li.g-toast` sin componente público) · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/toast/auditoria.md`](../../../../../design/lab/toast/auditoria.md)) · **Desde:** 0.1.0

> `@grana/vue` está en la versión 0.0.0 y aún no se publica. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`, sección «Avisos (GToaster)»). Exige Vue `^3.5.0`; la región usa la API `popover`.

> **No pongas nada imprescindible solo en un aviso.** Un aviso se cierra y no se recupera (no hay historial). Lo que el usuario necesita para continuar (el error de un campo, un estado que dura, una decisión) va en la página, junto al campo o en un `GDialog` (WCAG 2.2.1, 3.3.1).

## Uso

```js
// main.js de la aplicación
import { createApp } from 'vue'
import Grana, { createToaster } from '@grana/vue'
import '@grana/vue/style.css'

export const toaster = createToaster({
  labels: {
    region: 'Notificaciones ({hotkey})',
    close: 'Cerrar notificación',
    types: { info: 'Información', success: 'Correcto', warning: 'Advertencia', error: 'Error', loading: 'En curso' },
    repeated: '{count} veces',
    queued: '{count} más en espera',
    actionHint: 'Pulsa {hotkey} para {action}.'
  }
})

createApp(App).use(Grana).use(toaster).mount('#app')
```

```vue
<!-- App.vue: una sola región, lo más alto posible -->
<template>
  <RouterView />
  <GToaster />
</template>
```

```js
// en cualquier componente
import { useToast } from '@grana/vue'
const toast = useToast()

toast.success('Cambios guardados')
toast.error('No se pudo sincronizar', { description: 'Revisa la conexión.', action: { label: 'Reintentar', onClick: sincronizar } })
toast.show({ title: 'Proyecto archivado', action: { label: 'Deshacer', onClick: restaurar } })
```

```js
// fuera de componentes (interceptor HTTP, guardia del router): importa el mismo gestor
import { toaster } from './main.js'
toaster.error('Sesión caducada', { description: 'Vuelve a entrar para seguir.' })
```

- **`app.use(toaster)`** hace `provide(toasterKey, toaster)`; `useToast()` lo inyecta. Sin gestor provisto, o llamado fuera de `setup`, `useToast()` devuelve `undefined` con un aviso en desarrollo (no inventa un gestor).
- **Una `GToaster` por gestor.** Una segunda para el mismo gestor no pinta nada y avisa. `<GToaster :toaster="otro" />` pinta un gestor que no es el provisto (microfrontends, pruebas); `toasterKey` sirve para un `provide` manual.
- **Los textos no tienen valor por defecto** (Grana es internacional): todo va en `labels` (ver abajo).

> **En plantillas dentro del HTML** (sin compilar), escribe `<g-toaster></g-toaster>`: Vue no admite etiquetas de componente autocerradas.

### Tipos

```js
toast.show({ title: 'Proyecto archivado' })                     // neutral: sin icono
toast.info('Nueva versión disponible', { description: 'Recarga para usar la última versión.' })
toast.success('Cambios guardados')
toast.warning('Sin conexión', { description: 'Los cambios se guardarán al volver.' })
toast.error('No se pudo guardar', { description: 'El nombre ya existe.' })
toast.show({ type: 'loading', title: 'Subiendo informe…' })
```

| `type` | Icono (Lucide) | Marca de inicio | Canal | Se cierra solo |
| --- | --- | --- | --- | --- |
| `neutral` (por defecto) | ninguno | ninguna | cortés (`status`) | sí |
| `info` | `info` | ninguna | cortés | sí |
| `success` | `circle-check` | ninguna | cortés | sí |
| `warning` | `triangle-alert` | **discontinua** | cortés | sí |
| `error` | `circle-alert` | **sólida** | **enérgico** (`alert`) | **no** |
| `loading` | `loader-circle` (gira; quieto con movimiento reducido) | ninguna | cortés | **no**; `aria-busy="true"` |

El tipo **nunca depende solo del color**: se distingue por la forma del icono, por la marca de borde (sólida o discontinua) y por un **prefijo de texto oculto** (`labels.types.<type>`, «Error: ») que precede al título y se anuncia. **Cualquier aviso con `action` tampoco se cierra solo.**

### Acción

```js
toast.show({
  title: 'Proyecto archivado',
  action: { label: 'Deshacer', onClick: (t) => restaurar(t.id) },
  onDismiss: (reason, t) => { if (reason !== 'action') confirmarArchivo() }
})
```

**Una** acción como máximo, solo texto. Al activarla se llama a `onClick` con una copia del aviso y el aviso se cierra con motivo `action`. Un aviso con acción no se cierra solo; el anuncio termina con la pista `labels.actionHint` («Pulsa F8 para Deshacer.»), porque para llegar a la acción con teclado hace falta el atajo.

### Promesa

```js
const subida = toast.promise(subir(archivo), {
  loading: 'Subiendo informe…',
  success: (r) => ({ title: 'Informe subido', description: r.nombre }),
  error: (e) => ({ title: 'No se pudo subir el informe', description: e.message, action: { label: 'Reintentar', onClick: reintentar } })
}, { duration: 6000 })

await subida   // es la misma promesa: el rechazo sigue siendo tuyo
```

- Crea un aviso `loading` que pasa **en su sitio** a `success` (cortés, se cierra solo) o a `error` (enérgico, no se cierra solo) y anuncia el desenlace.
- Cada mensaje es un String (título), un Object (opciones sin `type`) o una Function que recibe el valor o el error. `loading` es obligatorio; sin `success` o `error`, ese desenlace **cierra** el aviso en vez de transformarlo.
- Cada desenlace **sustituye** `description` y `action`: lo que no traiga queda vacío (no hereda la descripción de «Subiendo…»). `options.duration` solo aplica a `success`.
- **Devuelve la misma promesa** (no la envuelve ni traga el rechazo). Cerrar el aviso en `loading` **no cancela** la promesa y el desenlace no lo vuelve a mostrar.

### Deduplicación y actualización

```js
toast.success('Enlace copiado')
toast.success('Enlace copiado')            // mismo type + title + description: no se duplica, contador «2»

const id = toast.show({ id: 'sync', type: 'loading', title: 'Sincronizando…' })
toast.show({ id: 'sync', type: 'success', title: 'Sincronizado' })   // mismo id = update: en su sitio
toast.update('sync', { description: '12 archivos' })                 // true si existía
```

- **Por contenido** (sin `id`): suma `count` (un `GBadge` con `labels.repeated` como nombre accesible), sustituye `action` y `onDismiss`, reinicia su tiempo y **vuelve a anunciarse** con «2 veces».
- **Por `id`:** actualiza en su sitio sin reiniciar el contador; si cambia `type`, cambian icono, canal y autocierre; se reanuncia si cambian `type`, `title` o `description` (no si solo cambian `duration` o `action`). Con el foco dentro, el foco se queda en el control equivalente.
- Un aviso que ya está saliendo no cuenta para deduplicar.

### Cola

```js
['Uno', 'Dos', 'Tres', 'Cuatro', 'Cinco', 'Seis'].forEach((n) => toast.info('Archivo ' + n + ' movido'))
// 3 visibles (limit) y «3 más en espera» (labels.queued)
```

Visibles a la vez: `limit` (3) en escritorio y `mobileLimit` (1) en móvil; el resto espera en **cola FIFO**, sin anunciarse y sin que corra su tiempo. Un `error` nuevo **se adelanta** al primer puesto de la cola (no expulsa a ningún visible). Cerrar un visible promueve el primero de la cola, que entonces se anuncia. La pila está siempre desplegada (sin montón que se abra al pasar el puntero).

### Posiciones, móvil y `safe-area`

```js
createToaster({ position: 'top-center', offset: { top: 56 } })     // bajo una cabecera fija de 56px
toaster.configure({ position: 'bottom-start', offset: { bottom: '4rem' } })
```

- Seis posiciones **lógicas**: `top-start`, `top-center`, `top-end`, `bottom-start`, `bottom-center`, `bottom-end` (por defecto). `start`/`end` se invierten en RTL (medido: `bottom-start` queda a la derecha con `dir="rtl"`). Medido: la pila queda a 16px de cada borde (`space × 4`); cada aviso mide 360px de ancho (`space × 90`).
- **Móvil:** con un visor de menos de `--g-space-1 × 130` (520px con `space` 4; el umbral de hoja de `GDialog`) la región va **siempre abajo**, a ancho completo menos 8px por lado, con `mobileLimit` visibles; la acción baja bajo el texto y el cierre se queda arriba. Se reevalúa al cambiar el tamaño.
- **`offset`** reserva sitio para una cabecera o barra inferior fija de tu app (Number en px o longitud CSS); se suma al margen. Medido: `offset.bottom: 56` → la pila a 72px del borde.
- **`safe-area`:** el margen de cada lado es `max(margen, env(safe-area-inset-*))`. Para que `env()` tenga valor en un iPhone con muesca o isla, tu página necesita **`viewport-fit=cover`**:

  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  ```

  Medido (emulado en Chromium, 320×640 con 34px abajo): la pila a 34px del borde inferior; con `offset.bottom: 56`, a 90px.
- **No tapa el foco:** si el elemento enfocado fuera de la región queda debajo de la pila, la región pasa al borde vertical contrario mientras siga así (WCAG 2.4.11).

### Dentro de un diálogo modal

No hay que hacer nada. Con un `<dialog>` modal abierto (`GDialog` u otro) todo lo de fuera es inerte, así que la región **se traslada al modal superior** (los mismos nodos: los canales vivos, la cola y los tiempos no se reinician) y **vuelve al `body`** al cerrarse. Medido en Chromium, Firefox y WebKit con `GDialog`: los avisos se ven y se pulsan por encima del diálogo, **Esc en un aviso lo cierra sin cerrar el diálogo**, y Esc fuera de los avisos cierra el diálogo como siempre.

## Opciones del gestor (`createToaster(options)` y `configure(patch)`)

| Opción | Tipo | Valores | Por defecto | Regla |
| --- | --- | --- | --- | --- |
| `position` | String | `top-start` `top-center` `top-end` `bottom-start` `bottom-center` `bottom-end` | `bottom-end` | Lógica; en móvil siempre abajo |
| `limit` | Number | entero ≥ 1 | `3` | Visibles a la vez en escritorio |
| `mobileLimit` | Number | entero ≥ 1 | `1` | Visibles a la vez en móvil |
| `duration` | String \| Number | `'auto'` · ms > 0 · `Infinity` | `'auto'` | Duración de los avisos que se cierran solos |
| `autoClose` | Boolean | | `true` | `false` = **ningún** aviso se cierra solo (ofrécelo como preferencia: WCAG 2.2.1). Cambiable en vivo |
| `hotkey` | String \| `false` | sintaxis de `aria-keyshortcuts` (`F8`, `Alt+Shift+N`) | `'F8'` | Atajo que va y vuelve a la región; `false` lo desactiva (se sigue llegando con Tab). `F6` se rechaza (es del navegador) |
| `swipe` | Boolean | | `true` | Deslizar para cerrar con dedo o lápiz |
| `offset` | Object | `{ top?, bottom? }`: Number (px) o longitud CSS | `{}` | Se suma al margen y a `safe-area` |
| `labels` | Object | ver abajo | `{}` | **Sin valores por defecto** |

`configure(patch)` fusiona (`labels` y `offset` por clave), aplica en vivo (posición, límites, tiempos de los visibles con su resto) y no reanuncia nada. Un valor fuera de lista avisa en desarrollo y conserva el anterior.

**`'auto'`** = tiempo de lectura: `clamp(5000, 2000 + 60 × n, 12000)` ms, con `n` = caracteres de título + descripción. El tiempo corre solo mientras el aviso está visible en una región montada, y **se pausa** para todos mientras el puntero está sobre la pila, el foco está dentro de la región, la pestaña está oculta o hay un dedo apoyado sobre un aviso; al reanudar conserva **lo que quedaba** (mínimo 1 s). `autoClose: false` en vivo congela todos; volver a `true` reanuda los que se cierran solos con su duración completa.

## Opciones de cada aviso (`show(options)`)

| Opción | Tipo | Valores | Por defecto | Regla |
| --- | --- | --- | --- | --- |
| `id` | String \| Number | | `toast-<n>` | Con un `id` existente, `show` actualiza en su sitio |
| `type` | String | `neutral` `info` `success` `warning` `error` `loading` | `neutral` | Icono, canal y autocierre (ver «Tipos») |
| `title` | String | **obligatorio** | | Sin título: aviso en desarrollo y no se muestra (`show` devuelve `null`) |
| `description` | String | | sin valor | Varias líneas; **nunca se recorta** |
| `action` | Object | `{ label, onClick(toast) }` | sin valor | Una como máximo; `label` obligatorio |
| `duration` | String \| Number | `'auto'` · ms · `Infinity` | la del gestor | Se ignora (con aviso) en `error`, `loading` y con `action` |
| `politeness` | String | `polite` `assertive` | según `type` | Sube un `warning` a enérgico; bajar un `error` a `polite` avisa |
| `onDismiss` | Function | `(reason, toast) => void` | sin valor | Una vez, al cerrarse por cualquier vía |

**Solo texto:** no hay `icon`, `component`, slots, HTML, varias acciones, `dismissible: false`, posición por aviso ni barra de cuenta atrás. Una opción desconocida se ignora con aviso en desarrollo. Se avisa también de títulos de más de 60 caracteres y descripciones de más de 140 (no se recortan: un aviso no es para textos largos).

### Motivos de cierre (`reason`)

`timeout` (se agotó el tiempo) · `close` (botón cerrar) · `escape` (Esc con el foco en el aviso) · `swipe` (deslizado) · `action` (se activó la acción) · `api` (`dismiss`) · `clear` (`clear`).

## Métodos

| Método | Firma | Devuelve | Hace |
| --- | --- | --- | --- |
| `show` | `show(options)` | `id` o `null` | Crea, deduplica o actualiza |
| `info` · `success` · `warning` · `error` | `(title, options?)` | `id` | Atajos de `show({ ...options, type, title })` |
| `promise` | `promise(p, { loading, success, error }, options?)` | la misma `p` | Ver «Promesa» |
| `update` | `update(id, patch)` | `true` / `false` | Fusiona sobre un aviso visible o en cola, sin moverlo |
| `dismiss` | `dismiss(id?)` | | Con `id`, cierra ese (motivo `api`); sin `id`, todos, visibles y en cola |
| `clear` | `clear()` | | Vacía todo **sin animación**; cada aviso recibe `onDismiss('clear')` |
| `configure` | `configure(patch)` | | Ver «Opciones del gestor» |
| `toasts` | propiedad de solo lectura (reactiva) | `Toast[]` congelados | Visibles y en cola, en orden de llegada (pruebas, un futuro historial). No la mutes |
| `install` | `install(app)` | | Plugin de Vue |

```ts
// Toast (solo lectura; onDismiss y action.onClick reciben una copia)
{ id, type, title, description?, action?, politeness: 'polite' | 'assertive', duration: number /* ms; Infinity */,
  count: number, state: 'queued' | 'visible' | 'leaving', createdAt: number }
```

## `GToaster`

| Prop | Tipo | Por defecto | Qué es |
| --- | --- | --- | --- |
| `toaster` | Object | el inyectado | Gestor que pinta esta región |

Sin eventos ni slots: todo va por las opciones de cada aviso. Los atributos (`id`, `class`, `data-*`) van a la raíz.

## `labels`

| Clave | Marcadores | Dónde | Si falta |
| --- | --- | --- | --- |
| `region` | `{hotkey}` | Nombre de la región («Notificaciones (F8)») | Aviso al montar; la región queda sin nombre |
| `close` | | Nombre del botón cerrar | Aviso al montar; **el botón se dibuja igual** |
| `types.info` · `types.success` · `types.warning` · `types.error` · `types.loading` | | Prefijo oculto del título y del anuncio («Error: ») | Aviso al usar ese tipo; sin prefijo |
| `repeated` | `{count}` | Nombre del contador y parte del anuncio («3 veces») | Aviso al primer repetido; contador sin nombre propio |
| `queued` | `{count}` | Texto de cola («3 más en espera») | Aviso al haber cola; no se dibuja |
| `actionHint` | `{action}`, `{hotkey}` | Final del anuncio de un aviso con acción | Aviso al primer aviso con acción; sin pista |

`neutral` no lleva prefijo. Con `hotkey: false`, `{hotkey}` queda vacío y no se añade `actionHint`.

## Teclado

| Tecla | Dónde | Acción |
| --- | --- | --- |
| **F8** (`hotkey`) | En cualquier parte, con al menos un aviso visible | Lleva el foco a la **acción** del aviso más reciente (o a su **cerrar**) |
| **F8** | Con el foco dentro de un aviso | Devuelve el foco a donde estaba |
| **F8** sin avisos | | No se intercepta (el navegador o tu app lo reciben) |
| **Tab** / **Shift+Tab** | | Acción → cerrar → siguiente aviso; la región está al final del `body` (o del modal), así que también se llega tabulando |
| **Esc** | Foco en un aviso | Lo cierra; **no** llega a un `GDialog` anfitrión |
| **Enter** / **Espacio** | Acción o cerrar | Nativo del botón |

**Nunca roba el foco:** ni al aparecer, ni al actualizarse, ni con un modal abierto. Al cerrar un aviso con el foco dentro, el foco va al **cerrar** del aviso vecino más reciente; si no queda ninguno, a donde estaba antes de entrar; si ya no existe, al primer control del `body` o del modal. Con composición de texto (IME) ni F8 ni Esc hacen nada. Verificado F8 → acción, F8 de vuelta y Esc dentro de un modal en Chromium, Firefox y WebKit.

## Anuncios y accesibilidad

- **Región viva única y permanente:** al montar `GToaster` se crean dos canales ocultos y vacíos, `role="status"` (cortés) y `role="alert"` (enérgico), **antes** del primer aviso, y no se desmontan (WCAG 4.1.3). La lista visible **no** es viva: se anuncia un texto compuesto, `[Tipo:] Título. [Descripción] [N veces] [Pulsa F8 para Acción.]` (medido: «Error: Falló. Pulsa F8 para Reintentar.»). El canal se vacía y se reescribe 50 ms después (un texto idéntico se vuelve a anunciar), los anuncios del mismo momento se unen en uno y el canal se vacía a los 5 s.
- **Se anuncia** al hacerse visible (también al salir de la cola), al repetirse y al cambiar `type`, `title` o `description`. Nada se anuncia antes de montar la región.
- **Estructura:** `section` con nombre (`labels.region`) y `aria-keyshortcuts`, `hidden` sin avisos; `ol` con un `li` por aviso (una `GSurface floating`); el botón cerrar se nombra con `labels.close` y se describe con el título y la descripción del aviso. Icono decorativo (`aria-hidden`). Cada `GBtn` conserva su región `role="status"` propia, **vacía siempre** (el aviso nunca pone sus botones en carga).
- **Tiempo ajustable** (WCAG 2.2.1): pausas con resto conservado; `error`, `loading` y avisos con acción no se cierran solos; `autoClose: false` como preferencia.
- **Contraste medido** sobre el componente real (tema por defecto, Spotify con marca pálida, lustre, GitHub y un tema de prueba; claro y oscuro): título ≥ 15.22:1, descripción ≥ 7.38:1, acción ≥ 15.22:1 (borde ≥ 3.43:1), icono de cerrar ≥ 7.38:1, contador ≥ 4.56:1, texto de cola ≥ 7.38:1; iconos de tipo y marcas de error y aviso ≥ 4.52:1 (umbral 3:1); anillo de foco ≥ 4.57:1 sobre el aviso. Mismas cifras en Chromium, Firefox y WebKit.
- **Tamaños:** cerrar 28×28 y acción de 28px de alto, con área ≥ 24px con ratón y **44px** con `pointer: coarse` (las áreas no se pisan); un aviso de una línea mide 46px.
- **Movimiento:** entrada desde 16px + fundido (160 ms), salida por fundido; el aviso que sale **no se mueve** y el resto se recoloca con transición. Con `prefers-reduced-motion`: **solo fundido**, sin desplazamiento y sin giro del icono de carga.
- **Colores forzados** (emulados): borde, iconos, marcas (conservan su forma sólida o discontinua), acción, cerrar y texto de cola en `CanvasText`; foco visible. **`prefers-contrast: more`:** bordes a `border-control`, descripción y cola a `text`.
- **Deslizar** (dedo o lápiz) cierra si el gesto horizontal supera un tercio del ancho o es rápido (0,5 px/ms con al menos el 10 %); el desplazamiento vertical de la página no se roba (`touch-action: pan-y`). El botón cerrar siempre existe (WCAG 2.5.1).

## SSR

Importar `@grana/vue` y llamar a `createToaster` no toca `document`, `window` ni `matchMedia`. En el servidor `GToaster` no renderiza nada (sin desajuste de hidratación); en el cliente crea la región al montar, y solo entonces empiezan temporizadores, escuchas y el `MutationObserver`. Los avisos creados antes (o en el servidor) esperan y se muestran y anuncian tras montar. Llamar a cualquier método en el servidor no falla.

## Tema

**Sin tokens propios.** El aviso es una `GSurface level="floating"` (fondo, borde, radio y `--g-shadow-2`) y consume `--g-color-{info|success|warning|danger}-text` (icono y marca), `--g-color-text`, `--g-color-text-muted`, `--g-color-surface`, `--g-color-border`, `--g-color-border-control`, `--g-color-focus`, `--g-focus-width`, `--g-border-width`, `--g-radius-pill` (ficha de cola), `--g-shadow-1`, `--g-space-*`, `--g-font-ui`, `--g-text-{body-sm|caption}-*`, `--g-text-title-weight`, `--g-duration-{press|fast|spin}` y `--g-ease-{out|standard}`. Ancho (`space × 90`), separación (`× 2`), margen (`× 4`, `× 2` en móvil), entrada (`× 4`) y umbral de móvil (`× 130`) son constantes derivadas de `space`, no tokens: un tema con `--g-space-1: 5px` da avisos de 450px. La acción y el cerrar no usan la marca, así que una marca pálida no los afecta.

## Clases

- **Raíz:** `g-toaster`, `g-toaster--position-*`; `data-position`, `data-edge`, `data-align` (efectivos), `data-mobile`, `data-flipped`, `is-paused`; `--_toaster-offset-top`/`-bottom` en línea.
- **Partes:** `g-toaster__live` (2), `g-toaster__region`, `g-toaster__list`, `g-toaster__queued`; cada aviso `g-toast` + clases de `GSurface` + `g-toast--type-*`, `data-type`, `data-state` (`entering` → `visible` → `leaving`), `has-action`, `has-description`, `is-loading`, `is-swiping`; `g-toast__icon`, `__content`, `__title`, `__type`, `__count`, `__description`, `__actions`, `__action`, `__close`.

## Limitaciones conocidas

- **Sin historial ni bandeja:** un aviso cerrado no se recupera (`toaster.toasts` solo tiene visibles y en cola).
- **Solo texto:** sin enlaces en la descripción, avatar, iconos propios, slots ni varias acciones.
- **Al bajar el límite** (paso a móvil, `configure`), hoy se quedan visibles los avisos más antiguos y los recientes vuelven a la cola, también un `error` recién mostrado; el contrato dice lo contrario. Pendiente de decisión (auditoría, hallazgo 1).
- **Sin verificar con lector de pantalla real** (VoiceOver, NVDA, JAWS, TalkBack): la lectura tras vaciar y reescribir el canal, la interrupción del `alert`, que el traslado al modal no repita ni pierda anuncios y que las regiones vacías de los botones no añadan ruido. Es el riesgo principal.
- **Sin verificar en táctil real** (inercia del gesto, gesto «atrás» del sistema en los bordes), con **teclado virtual** (la región no se recoloca sobre él), con **varios modales apilados** ni con un `GMenu` abierto sobre un aviso; `safe-area` solo emulada en Chromium.
- **Rendimiento:** un `MutationObserver` sobre todo el documento filtrado al atributo `open` (para seguir los modales); sin medir en aplicaciones grandes.

## Fuentes

- API: [`GToast.meta.json`](./GToast.meta.json) · Contrato: [`design/contracts/toast.md`](../../../../../design/contracts/toast.md) · Prototipo: [`design/lab/toast/r01/`](../../../../../design/lab/toast/r01/) · Estilo: [`design/lab/toast/estilo.md`](../../../../../design/lab/toast/estilo.md) · Auditoría: [`design/lab/toast/auditoria.md`](../../../../../design/lab/toast/auditoria.md)
