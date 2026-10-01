# Contrato · GToast (gestor `createToaster`, región `GToaster`)

**Dueño:** lima · **Estado:** aprobado · CSS entregado por coco (`GToast.css`, `design/lab/toast/estilo.md`; #148) · construido por bruno (`GToast.meta.json`; reconciliado en #149) · pendiente de auditoría de coco · **Basado en:** `design/lab/toast/r01/` (kiwi; `brief.md`, `declaracion.md` con 16 puntos, `index.html` con el gestor de prueba) · **Compone:** `surface.md` (`level="floating"`), `btn.md`, `badge.md`, `GIcon` (interno) · **Convive con:** `dialog.md` (región dentro del modal superior; Esc)
**Tag:** `g-toaster` (región) · `g-toast` (cada aviso, sin componente público) · **Categoría:** comunicación y estado

Un **aviso breve y no modal** que confirma o informa del resultado de algo que el usuario acaba de hacer o que acaba de pasar en segundo plano («Cambios guardados», «No se pudo subir el archivo», «Proyecto archivado · Deshacer»). Aparece en una zona fija del visor, **no interrumpe la tarea y nunca recibe el foco por su cuenta**. Decisiones delegadas por el usuario («decide tú»): DECISIONS.md #138 y #139; propuestas de kiwi aprobadas y derivadas de estándar: #140 a #147.

---

## Principios

- **Imperativo, no declarativo** (#140). Un aviso nace de un **evento** (guardar, fallar), no de un estado de la vista. La aplicación crea **su** gestor (`createToaster`), lo instala como plugin, lo usa con `useToast()` (o importándolo, fuera de componentes) y monta **una** región `<GToaster />`. **No hay `<GToast>` declarativo en v0.1 ni instancia global de Grana.**
- **Una región viva única y permanente por gestor** (#141): dos canales vivos vacíos (`status` cortés y `alert` enérgico) existen **antes** del primer aviso (WCAG 4.1.3; precedentes #14, #137). La lista visible **no** es viva: se anuncia un texto compuesto en el canal.
- **Nunca roba el foco** (#143). Se llega con un atajo (`hotkey`, F8 por defecto) o tabulando; Esc cierra el aviso enfocado **sin** cerrar el diálogo anfitrión.
- **Tiempo ajustable** (WCAG 2.2.1; #142): pausa con puntero, foco, pestaña oculta y deslizamiento conservando el tiempo restante; `error`, `loading` y cualquier aviso **con acción** no se cierran solos; `autoClose: false` desactiva todo autocierre.
- **Nada imprescindible solo en un aviso.** Lo que el usuario necesita para continuar va en la página (WCAG 2.2.1, 3.3.1); un aviso que se cierra no se recupera (sin historial en v0.1, #138).
- **Solo texto** (#139): título, descripción y una acción. Sin slots, VNodes ni HTML: garantiza el anuncio y evita interactivos anidados.
- **Sin textos por defecto** (Grana es internacional): `labels` del gestor, todos sin valor.
- **Sin dependencias ni globals de la app**: el gestor no usa `fetch`, no toca `document` ni `window` al importarse ni al crearse (SSR), y Grana no exporta una instancia.
- **Se reutiliza, no se duplica:** `GSurface` (`floating`), `GBtn`, `GBadge`, `GIcon`, el umbral de hoja de `GDialog` (`space × 130`, #103), `utils/template.js` (`fill`). **No** usa `utils/anchor.js`: se coloca respecto al visor, no a un elemento.

## Frontera con otros componentes

| Necesidad | No es un aviso | Usar |
| --- | --- | --- |
| Algo que exige decisión antes de seguir | Interrumpe y necesita foco | `GDialog role="alertdialog"` (#42) |
| Error de un campo o formulario | Debe estar junto al campo (3.3.1) | Error de `GInput`, `GSelect`… |
| Estado de una tarjeta o widget | Vive en su contenedor | `status` de `GCard` (#133), estados de `GWidget` (#73) |
| Ayuda contextual | Se abre a petición | `GHelper` (#101) |
| Información persistente de página | No desaparece | Banner o contenido (fuera de alcance) |
| Bandeja o historial de notificaciones | Es una vista, no un aviso | Fuera de v0.1 (#138); si entra, **componente propio que lea del mismo gestor** (`toaster.toasts`) |

## Entrega (API pública)

Exportaciones de `@grana/vue` (bruno las registra en `src/index.js`):

| Exportación | Qué es |
| --- | --- |
| `createToaster(options?)` | Crea un **gestor** (objeto). También es **plugin de Vue**: `app.use(toaster)` lo provee a toda la app |
| `useToast()` | Devuelve el gestor provisto (dentro de `setup` o de un componente montado bajo la app) |
| `GToaster` | Componente que pinta **la** región del gestor. Se monta **una vez**, lo más alto posible (raíz de la app, junto al `<RouterView>`) |
| `toasterKey` | Clave de inyección (`InjectionKey`) para quien necesite `provide` manual (pruebas, microfrontends) |

```js
// main.js de la aplicación
import { createApp } from 'vue'
import { createToaster } from '@grana/vue'
export const toaster = createToaster({ labels: { /* textos de la app */ } })
createApp(App).use(toaster).mount('#app')
```

```vue
<!-- App.vue -->
<template>
  <RouterView />
  <GToaster />
</template>
```

```js
// en un componente
const toast = useToast()
toast.success('Cambios guardados')
toast.show({ title: 'Proyecto archivado', action: { label: 'Deshacer', onClick: restore } })
toast.promise(upload(file), { loading: 'Subiendo informe…', success: (r) => ({ title: 'Informe subido', description: r.name }), error: 'No se pudo subir' })
// fuera de componentes (interceptor, guardia del router): se importa el mismo `toaster`
```

### Opciones del gestor (`createToaster(options)` y `configure(patch)`)

| Opción | Tipo | Valores | Default | Regla |
| --- | --- | --- | --- | --- |
| `position` | String | `top-start` `top-center` `top-end` `bottom-start` `bottom-center` `bottom-end` | `bottom-end` | Lógica: `start`/`end` se invierten en RTL. En móvil se ignora (ver «Posición») |
| `limit` | Number | entero ≥ 1 | `3` | Avisos **visibles** a la vez en escritorio; el resto, en cola |
| `mobileLimit` | Number | entero ≥ 1 | `1` | Visibles a la vez en móvil |
| `duration` | String \| Number | `'auto'` · ms (entero > 0) · `Infinity` | `'auto'` | Duración por defecto de los avisos que se cierran solos (ver «Duración») |
| `autoClose` | Boolean | | `true` | `false` = **ningún** aviso se cierra solo (preferencia del usuario, vía «desactivar» de WCAG 2.2.1). Cambiable en vivo con `configure` |
| `hotkey` | String \| `false` | sintaxis de `aria-keyshortcuts` (`F8`, `Alt+Shift+N`) | `'F8'` | Atajo que va y vuelve a la región; `false` lo desactiva (sigue llegándose con Tab). No usar `F6` (lo usa el navegador) |
| `swipe` | Boolean | | `true` | Deslizar para cerrar con táctil o lápiz; el botón cerrar siempre existe (WCAG 2.5.1) |
| `offset` | Object | `{ top?, bottom? }`: Number (px) o String (longitud CSS) | `{}` (función) | Reserva para una cabecera fija o una barra inferior de la app; se suma al margen y a `safe-area` |
| `labels` | Object | ver «Textos» | `{}` (función) | **Sin valores por defecto** |

`configure(patch)` fusiona superficialmente (y `labels` y `offset` por clave), aplica en vivo (posición, límites, temporizadores de los visibles recalculados con su tiempo restante) y no reanuncia nada. Valores fuera de lista: aviso en desarrollo y se conserva el anterior.

### Opciones de cada aviso (`show(options)`)

| Opción | Tipo | Valores | Default | Regla |
| --- | --- | --- | --- | --- |
| `id` | String \| Number | | generado (`toast-<n>`) | Con un `id` existente, `show` **actualiza en su sitio** (= `update`) |
| `type` | String | `neutral` `info` `success` `warning` `error` `loading` | `neutral` | Elige icono, color semántico, canal y autocierre (tabla «Tipos») |
| `title` | String | texto libre, **obligatorio** | | Sin título (o vacío): aviso en desarrollo y **no se muestra** (`show` devuelve `null`) |
| `description` | String | texto libre | sin valor | Varias líneas; **nunca se recorta** |
| `action` | Object | `{ label: String, onClick(toast) }` | sin valor | **Una** como máximo. `label` obligatorio. Al activarla se llama a `onClick` y el aviso se cierra con motivo `action` |
| `duration` | String \| Number | `'auto'` · ms · `Infinity` | la del gestor | Se ignora (con aviso en desarrollo) en los avisos **sin autocierre forzado**: `error`, `loading`, con `action` |
| `politeness` | String | `polite` `assertive` | según `type` | Sube un `warning` a enérgico. Bajar un `error` a `polite` se permite pero avisa en desarrollo |
| `onDismiss` | Function | `(reason, toast) => void` | sin valor | Se llama **una vez** al cerrarse por cualquier vía (ver «Motivos de cierre») |

**Rechazados en v0.1** (#139): `icon`, `component`, `render`, slots, HTML en textos, `actions` en plural, `dismissible: false`, `position` por aviso, barra de cuenta atrás. Una opción desconocida se ignora con aviso en desarrollo.

### El gestor

| Método | Firma | Devuelve | Hace |
| --- | --- | --- | --- |
| `show` | `show(options)` | `id` (o `null` si no se mostró) | Crea, deduplica o actualiza (ver «Deduplicación») |
| `info` · `success` · `warning` · `error` | `(title, options?)` | `id` | Atajos de `show({ ...options, type, title })` |
| `promise` | `promise(p, { loading, success, error }, options?)` | **la misma promesa `p`** | Un aviso `loading` que pasa **en su sitio** a `success` o a `error` (ver «Promesa») |
| `update` | `update(id, patch)` | `true` si existía, `false` si no | Fusiona `patch` sobre el aviso (visible o en cola), sin cambiar su sitio |
| `dismiss` | `dismiss(id?)` | | Con `id`: cierra ese aviso (motivo `api`). Sin `id`: cierra **todos**, visibles y en cola (motivo `api`) |
| `clear` | `clear()` | | Vacía todo **sin animación de salida**; cada aviso recibe `onDismiss('clear')` |
| `configure` | `configure(patch)` | | Ver arriba |
| `toasts` | propiedad, solo lectura (reactiva) | `Toast[]` | Avisos visibles y en cola, en orden de llegada. Para pruebas y para un futuro componente de historial; **no se muta desde fuera** |
| `install` | `install(app)` | | Plugin de Vue (`app.use`): `provide(toasterKey, toaster)` |

Llamar a cualquier método en el servidor (SSR) no falla: guarda el estado y no arranca temporizadores (ver «SSR»).

### Forma del objeto aviso (`Toast`, de solo lectura)

```ts
{
  id: string | number,
  type: 'neutral' | 'info' | 'success' | 'warning' | 'error' | 'loading',
  title: string,
  description?: string,
  action?: { label: string, onClick: (toast) => void },
  politeness: 'polite' | 'assertive',   // resuelta
  duration: number,                      // resuelta en ms; Infinity si no se cierra solo
  count: number,                         // ≥ 1; repeticiones deduplicadas
  state: 'queued' | 'visible' | 'leaving',
  createdAt: number                      // marca de llegada (orden de la cola)
}
```

El objeto que recibe `onDismiss` y `action.onClick` es una **copia** de esta forma.

### Motivos de cierre (`reason`)

| `reason` | Cuándo |
| --- | --- |
| `timeout` | Se agotó su tiempo |
| `close` | Botón cerrar |
| `escape` | Esc con el foco dentro del aviso |
| `swipe` | Deslizado fuera |
| `action` | Se activó su acción |
| `api` | `dismiss(id)` o `dismiss()` |
| `clear` | `clear()` |

`GToaster` **no emite eventos públicos** (#140): todo va por las opciones del aviso. No hay `onShow` ni `onAction` aparte (la acción es `action.onClick`).

### Tipos, color, icono, canal y autocierre

| `type` | Color semántico | Icono (Lucide vía `GIcon`) | Canal | Autocierre |
| --- | --- | --- | --- | --- |
| `neutral` | `neutral` | ninguno | cortés (`status`) | sí |
| `info` | `info` | `info` | cortés | sí |
| `success` | `success` | `circle-check` | cortés | sí |
| `warning` | `warning` | `triangle-alert` | cortés | sí |
| `error` | **`danger`** (precedente #133) | `circle-alert` | **enérgico** (`alert`) | **no** |
| `loading` | `neutral` | `loader-circle` (gira; quieto con movimiento reducido) | cortés | **no**; `aria-busy="true"` en el aviso |

Nunca solo color (WCAG 1.4.1): el tipo se distingue por la **forma del icono** y por el **prefijo de texto** oculto (`labels.types.<type>`) que precede al título y se anuncia. Cualquier aviso **con `action`** tampoco se cierra solo.

### Duración (#142)

- **`'auto'`** = tiempo de lectura: `clamp(5000, 2000 + 60 × n, 12000)` ms, con `n` = caracteres de título + descripción. Son **constantes de comportamiento** del gestor (no de tema); bruno las expone como `TOAST_DURATION = { min, base, perChar, max }` interno y las prueba.
- **Sin autocierre** (`Infinity`): `error`, `loading`, con `action`, o `autoClose: false`.
- **El tiempo corre solo mientras el aviso es visible** en una región montada; en cola no corre.
- **Pausa de todos los avisos** mientras: el puntero está sobre la lista, el foco está dentro de la región, `document.visibilityState === 'hidden'`, o hay un dedo/lápiz apoyado sobre un aviso. Al reanudar se conserva **el tiempo que quedaba**, con un mínimo de 1000 ms; no se reinicia.
- `configure({ autoClose })` en vivo: a `false` congela todos; a `true` reanuda los que se cierran solos con su duración completa.

## Textos (`labels`, sin valores por defecto)

| Clave | Marcadores (`fill`) | Dónde | Si falta |
| --- | --- | --- | --- |
| `region` | `{hotkey}` | `aria-label` de la `section` (p. ej. «Notificaciones ({hotkey})») | Aviso en desarrollo; la `section` queda sin nombre (no es hito) |
| `close` | | `aria-label` del botón cerrar | Aviso en desarrollo; **el botón se dibuja igual** (la salida es obligatoria, 2.2.1 y 1.4.13) |
| `types.info` · `types.success` · `types.warning` · `types.error` · `types.loading` | | Prefijo oculto del título y del anuncio («Error: ») | Aviso en desarrollo **al usar ese tipo**; sin prefijo (el tipo queda solo en el icono para la vista) |
| `repeated` | `{count}` | `label` del `GBadge` contador y parte del anuncio («3 veces») | Aviso en desarrollo al primer repetido; el contador se dibuja sin nombre accesible propio |
| `queued` | `{count}` | Texto de cola («3 más en espera») | Aviso en desarrollo al haber cola; no se dibuja el texto |
| `actionHint` | `{action}`, `{hotkey}` | Final del anuncio de un aviso con acción («Pulsa {hotkey} para {action}.») | Aviso en desarrollo al primer aviso con acción; el anuncio va sin pista |

`neutral` no lleva prefijo. Con `hotkey: false`, `{hotkey}` queda vacío y `actionHint` no se añade. Los marcadores se rellenan con `utils/template.js` (`fill`).

## Anuncio (canales vivos)

- El texto anunciado es: `[types.<type>:] título[.] [descripción] [repeated] [actionHint]`, unidos por espacios (se añade «.» al título si no termina en `.`, `!` o `?`).
- Canal: el de `politeness` resuelta. Escritura: se **vacía** el canal y se escribe el texto en el siguiente ciclo (bruno fija el retardo, del orden de decenas de ms, y lo prueba), para que un texto idéntico se vuelva a anunciar (`ANNOUNCE.delay` = 50 ms). **Los anuncios del mismo ciclo y del mismo canal se unen en un solo texto** (separados por espacio, en orden de llegada): escribir dos veces seguidas haría que el lector perdiera el primero (#149). El canal se **vacía** pasado `ANNOUNCE.clear` = 5000 ms para no dejar texto que el cursor virtual relea. **Pendiente de lector real.**
- **Se anuncia** al hacerse visible (un aviso en cola, cuando sale de la cola), al deduplicarse (repetido) y al actualizarse con cambio de `type`, `title` o `description` (así la promesa anuncia su resultado). **No** se anuncia al cambiar solo `duration` o `action`.
- **Antes de montar la región** (o en SSR) no se anuncia nada: los avisos visibles pendientes se anuncian tras montar la región y esperar un ciclo (la región debe estar en el árbol de accesibilidad antes del cambio).
- La lista visible **no** tiene `aria-live`: si lo tuviera se leerían los nombres de los botones y los cambios de orden.

## Estructura accesible

Orden del DOM = orden de lectura = orden de foco. El más reciente queda **junto al borde** (abajo: último de la lista; arriba: primero).

```html
<div class="g-toaster g-toaster--position-bottom-end" id="ID" popover="manual"
     data-position="bottom-end" data-edge="bottom" data-align="end">           <!-- + data-mobile, data-flipped, is-paused -->
  <div class="g-toaster__live" role="status" aria-live="polite" aria-atomic="true"></div>
  <div class="g-toaster__live" role="alert" aria-atomic="true"></div>
  <section class="g-toaster__region" aria-label="Notificaciones (F8)" aria-keyshortcuts="F8">   <!-- hidden sin avisos -->
    <ol class="g-toaster__list">
      <li class="g-toast g-surface g-surface--level-floating g-surface--padding-sm g-toast--type-error has-action has-description"
          id="ID-t1" data-type="error" data-state="visible">                    <!-- loading: aria-busy="true" e is-loading -->
        <span class="g-toast__icon" aria-hidden="true"><svg class="g-icon">…</svg></span>   <!-- sin icono en neutral -->
        <div class="g-toast__content">
          <p class="g-toast__title" id="ID-t1-title">
            <span class="g-toast__type">Error: </span>No se pudo sincronizar     <!-- texto oculto accesible -->
            <span class="g-badge g-badge--kind-count g-toast__count">…</span>   <!-- solo con count > 1 -->
          </p>
          <p class="g-toast__description" id="ID-t1-desc">…</p>
        </div>
        <div class="g-toast__actions">
          <button class="g-btn g-btn--size-sm g-toast__action" type="button">Reintentar</button>
          <button class="g-btn g-btn--icon g-btn--size-sm g-toast__close" type="button"
                  aria-label="Cerrar" aria-describedby="ID-t1-title ID-t1-desc"><svg class="g-icon">…</svg></button>
        </div>
      </li>
    </ol>
    <p class="g-toaster__queued">3 más en espera</p>                             <!-- solo con cola y labels.queued -->
  </section>
</div>
```

- **Raíz `g-toaster`:** `popover="manual"`, **abierta siempre** desde el montaje (`showPopover()`), capa superior como `GSelect` (#55) y `GHelper` (#101). Sin rol. La raíz no captura el puntero; **la lista `g-toaster__list` sí** (mide exactamente la pila: cruzar el hueco entre avisos no reanuda los temporizadores; #148). El texto de cola no captura.
- **Canales:** dos `g-toaster__live` con el patrón de texto oculto accesible, **presentes y vacíos** desde el montaje; nunca se desmontan mientras viva `GToaster`.
- **Región:** `section` con nombre (`labels.region`) y `aria-keyshortcuts` (= `hotkey`; sin atributo con `hotkey: false`). Con **cero** avisos visibles, `hidden` (no se deja un hito vacío). Los canales están **fuera** de la `section` para que `hidden` no los afecte.
- **Aviso `g-toast`:** es una **`GSurface as="li" level="floating" padding="sm"`** (#146; sombra `--g-shadow-2` y radio de `floating`, #100) y lleva **todas** las clases de `GSurface` (`g-surface g-surface--level-floating g-surface--padding-sm …`): `GToast.css` reasigna su relleno y su borde de inicio (por eso se registra después de `GSurface.css`).
- **Icono:** `.g-icon` es **hijo directo** de `.g-toast__icon` (el giro de `loading` lo selecciona así). Sin rol propio (es un elemento de lista). `id` estable derivado del `id` del aviso.
- **Prefijo de tipo** `g-toast__type`: texto oculto accesible dentro del título; no visible.
- **Contador:** `GBadge` con `count` y `label = fill(labels.repeated, { count })`, `size="sm"`, `variant="soft"`, `color="neutral"`; el número es `aria-hidden` y el nombre va en `g-badge__sr` (`badge.md`). Solo con `count > 1`.
- **`g-btn__status` y `g-btn__loader` de `GBtn` se aceptan dentro del aviso** (#149): el aviso **nunca** pone `loading` en sus botones, así que la región `role="status"` de cada `GBtn` queda vacía siempre y no anuncia nada (una región viva vacía que no cambia no habla); el `loader` está oculto sin `loading`. `GBtn` no cambia: su región debe existir antes de la carga (#14). La lista sigue sin `aria-live` propio. Verificar con lector real que esas regiones vacías no añaden ruido al recorrer.
- **Acción:** `GBtn size="sm" variant="outline" color="neutral"` (fijado por coco; `GToast.css` reasigna texto a `--g-color-text` y borde a `--g-color-border-control`). **Cerrar:** `GBtn icon size="sm" variant="ghost" color="neutral"` con `GIcon x`, `aria-label = labels.close`, `aria-describedby` → título (+ descripción). La acción va **antes** del cierre.
- **Texto de cola** `g-toaster__queued`: texto plano, no vivo.
- **Sin interactivos anidados** y **sin contenido del consumidor** (solo texto, #139).

## Foco y teclado (#143)

| Tecla | Dónde | Acción |
| --- | --- | --- |
| `hotkey` (F8) | Documento, con ≥ 1 aviso visible y foco **fuera** de la región | Guarda el elemento enfocado y lleva el foco a la **acción** del aviso más reciente (o a su **cierre**). `preventDefault` |
| `hotkey` (F8) | Con el foco **dentro** de la región | Devuelve el foco al elemento guardado (si sigue conectado y no es inerte) |
| `hotkey` sin avisos | | **No se intercepta** (el evento sigue su curso) |
| Tab / Shift+Tab | | Acción → cerrar → siguiente aviso; la región está al final del `body` (o del modal), así que también se llega tabulando |
| Esc | Foco dentro de un aviso | Lo cierra (motivo `escape`), con **`preventDefault()` y `stopPropagation()`** en su `keydown` (fase de burbuja, en la región): no llega a `GDialog` ni a otros manejadores de ancestros; el `cancel` nativo del `<dialog>` no se dispara (ver `dialog.md`) |
| Esc | Foco fuera de los avisos | No hace nada con los avisos |
| Enter / Espacio | Acción o cerrar | Nativo del botón |

- **Nunca roba el foco:** ni al aparecer, ni al actualizarse, ni con un modal abierto.
- **Composición IME:** con `event.isComposing` no se trata ni el atajo ni Esc.
- **Coincidencia del atajo:** `event.key` (sin distinguir mayúsculas en letras) y los modificadores declarados exactos (`Alt`, `Control`, `Shift`, `Meta`).
- **Foco tras cerrar** (cerrar, Esc, acción, deslizar): al **cierre** del aviso vecino más reciente si queda alguno visible; si no, al elemento guardado (al entrar con el atajo o con Tab, `relatedTarget` del `focusin`) si sigue conectado y no es inerte; si no, al primer control enfocable del anfitrión de la región (`body` o el modal); nunca se pierde en `body` si el anfitrión es un modal.
- **Actualizar un aviso con el foco dentro** conserva el foco en el control equivalente (acción → acción; si la acción desaparece, cerrar).

## Apilado, límite y cola (#144)

- Pila **desplegada**: sin montón 3D que se abra con hover (sería contenido que aparece al pasar, WCAG 1.4.13).
- Visibles: `limit` (escritorio) o `mobileLimit` (móvil). **Al bajar el límite** (paso a móvil o `configure`) se quedan visibles **los `error` primero y, después, los más recientes**; los sobrantes vuelven **al principio de la cola**, en su orden y **con los `error` delante**, **conservando su tiempo restante**, y se **reanuncian** al volver a hacerse visibles (#149, #150). El resto, en **cola FIFO**; un `error` **se adelanta** al primer puesto de la cola (no expulsa a ningún visible). Cerrar un visible promueve el primero de la cola.
- Un aviso en cola **no se anuncia** hasta hacerse visible y **su tiempo no corre**.
- `g-toaster__queued` muestra cuántos esperan (`labels.queued`).

## Deduplicación y actualización (#144)

- **Por `id`:** `show({ id })` con un `id` existente (visible o en cola) = `update(id, options)`: actualiza **en su sitio**, sin reiniciar el contador; si cambia `type`, cambian icono, canal y autocierre; se reanuncia si cambian `type`, `title` o `description`; el tiempo se recalcula completo.
- **Por contenido** (sin `id`): mismo `type` + `title` + `description` que un aviso visible o en cola → **no se duplica**: `count + 1`, la `action` y `onDismiss` nuevos sustituyen a los anteriores, **se reinicia** su tiempo y **se vuelve a anunciar** (con «N veces»). `show` devuelve el `id` existente.
- Un aviso con `state: 'leaving'` no cuenta para deduplicar.

## Promesa (#144)

`promise(p, { loading, success, error }, options?)`:

- Cada mensaje es **String** (título), **Object** (opciones de aviso sin `type`) o **Function** (`(valor | error) => String | Object`). `loading` es obligatorio; sin `success` o `error`, ese desenlace **cierra** el aviso (motivo `api`) en vez de transformarlo.
- Crea un aviso `type: 'loading'` (cortés, sin autocierre, `aria-busy`). Al resolverse pasa **en su sitio** a `success` (cortés, con autocierre); al rechazarse, a `error` (enérgico, sin autocierre). `options.id` permite fijar el `id`.
- **`options.duration` solo aplica a `success`** (`loading` y `error` no se cierran solos). **Cada desenlace sustituye `description` y `action`**: lo que no traiga el mensaje del desenlace queda vacío (no se hereda la descripción de «Subiendo…») (#149).
- **Devuelve la misma promesa `p`** (no la envuelve ni traga el rechazo: el rechazo sigue siendo del llamador).
- **Cerrar el aviso en `loading` no cancela la promesa** y el desenlace **no lo vuelve a mostrar** (el usuario ya lo descartó). Si el `id` se reutiliza después, es un aviso nuevo.

## Posición, RTL, móvil y `safe-area` (#145)

- `position` → `data-edge` (`top`/`bottom`) y `data-align` (`start`/`center`/`end`), clase `g-toaster--position-*`. Propiedades lógicas: `start`/`end` siguen el `dir` heredado por la raíz (el de `<html>`, o el del modal cuando la región está dentro).
- **Móvil:** visor de ancho < `--g-space-1 × 130` (520px con `space` 4; el umbral de hoja de `GDialog`, #103), **medido** (excepción vigente #42/#56/#103) → `data-mobile`: **siempre abajo, ancho completo** menos el margen, `mobileLimit` visibles, la acción baja bajo el texto. Se reevalúa con `resize`.
- **Márgenes:** `max(margen, env(safe-area-inset-*))` por lado, más `offset.top`/`offset.bottom`. `offset` llega al CSS como variables dinámicas en línea `--_toaster-offset-top` y `--_toaster-offset-bottom` (excepción justificada como `--_mark-*` de `GTabs`). `env()` exige `viewport-fit=cover` en la app (README).
- **Deslizar para cerrar** (`swipe: true`): solo `pointerType` `touch` o `pen`, **horizontal** en cualquier sentido, `touch-action: pan-y` en el aviso (no roba el desplazamiento vertical). Cierra si el desplazamiento supera **un tercio del ancho** del aviso o la velocidad supera **0,5 px/ms con un recorrido de al menos el 10 % del ancho** (un toque rápido no cierra; #149); si no, vuelve a su sitio. Mientras se arrastra: `is-swiping` y la variable dinámica `--_toast-swipe` (px). Constantes de comportamiento de bruno. **Alternativa no gestual siempre presente:** el botón cerrar (2.5.1).
- **No tapar el foco** (WCAG 2.4.11/2.4.12): si el elemento enfocado **fuera** de la región se solapa con la lista, la región pasa al **borde vertical contrario** (`data-flipped`, que invierte `data-edge`) mientras siga así; vuelve cuando el foco va a otra cosa. Con el foco **dentro** de la región no se mueve. Si en ningún borde queda libre, se queda donde estaba.
- **Teclado virtual:** no se trata en v0.1 (no verificado).

## Convivencia con `<dialog>` modal (#141)

- Con `showModal()` todo lo que está fuera del diálogo es inerte y sale del árbol de accesibilidad, **también un popover** abierto después (verificado por kiwi). Por eso la raíz **se traslada al `<dialog>` modal superior** mientras haya uno abierto y **vuelve al `body`** al cerrarse.
- Detección: cualquier `<dialog>` que esté `open` y `:modal` (no solo `GDialog`); un `MutationObserver` sobre el documento **filtrado al atributo `open`** mantiene la pila de modales; el anfitrión es el último abierto.
- **Mismos nodos, sin remontar** (los canales vivos deben seguir existiendo): bruno usa un `Teleport` con destino reactivo (`body` o el modal) o un traslado equivalente; tras cada traslado vuelve a llamar a `showPopover()` (sacar un popover abierto del documento lo cierra) para quedar por encima del modal.
- Los avisos visibles, la cola y los temporizadores no se reinician con el traslado. Esc en un aviso no cierra el diálogo (ver «Foco y teclado» y `dialog.md`).

## Movimiento

- Entrada: desplazamiento corto desde el borde (derivado de `space`) + fundido; salida: fundido (y desplazamiento lateral si se deslizó); recolocación de la pila con transición. Tokens **existentes** `--g-duration-*` y `--g-ease-*` (#71); coco elige cuáles. Nada se repite ni parpadea (2.2.2).
- `data-state` en el aviso: `entering` → `visible` **dos fotogramas después de insertar** (dos `requestAnimationFrame`) → `leaving`. **Retirada por tiempo fijo:** el nodo sale del DOM tras la duración de transición **calculada** del propio aviso (`getComputedStyle`: duración + retardo máximos); si es 0 (movimiento reducido sin transición, jsdom), en el siguiente ciclo. No se espera `transitionend` (#149).
- **El aviso en `leaving` es `inert`** (no recibe foco ni clics mientras sale; el foco ya se movió según «Foco tras cerrar»; #149).
- **Recolocación (FLIP propio, no `TransitionGroup`):** bruno mide las posiciones antes y después del cambio y escribe `transform` en los avisos que se mueven (la entrada y el arrastre usan `translate`, no se pisan). `TransitionGroup` no sirve: decide la clase de movimiento por el primer hijo y un aviso en `leaving` (fuera del flujo) no transiciona `transform` (#149).
- **Salida sin salto:** al pasar a `leaving`, el aviso sale del flujo y bruno escribe en línea **`--_toast-y`**: con `data-edge="top"`, su `offsetTop`; con `bottom`, `lista.clientHeight − offsetTop − offsetHeight` (px). El resto se recoloca con FLIP.
- **Deslizar:** mientras se arrastra, `is-swiping` (sin transición) y `--_toast-swipe`. Al soltar: si cierra, `--_toast-swipe` = ± el ancho del aviso, se quita `is-swiping` y luego `leaving`; si no, `--_toast-swipe: 0px` y se quita `is-swiping`.
- **Valores de coco:** entrada `space × 4` desde el borde + fundido; entrada y recolocación `--g-duration-press` + `--g-ease-out`; salida `--g-duration-fast` + `--g-ease-standard`; giro `--g-duration-spin`.
- **`prefers-reduced-motion: reduce`:** solo fundido; sin desplazamiento ni giro del `loader-circle`.

## Tokens consumidos

**Ningún token nuevo** (#146; `tokens.md` §20). Todo deriva de existentes:

| Necesidad | Fuente |
| --- | --- |
| Superficie, sombra, radio, borde, relleno | `GSurface level="floating"` (`--g-shadow-2`, radio de `floating`, `--g-color-border`, escala de `padding`) |
| Marca e icono de tipo | Icono en `--g-color-{info\|success\|warning\|danger}-text`; `loading` en `--g-color-text-muted`. **Marca de borde de inicio solo en `error` (sólida) y `warning` (discontinua)**, de `space-1`; `info`, `success` y `neutral` sin marca (fijado por coco, #148) |
| Texto | `--g-color-text`, `--g-color-text-muted`, `--g-font-ui`, `--g-text-{body-sm\|body\|caption}-{size\|line}`, `--g-text-title-weight` |
| Foco | `--g-color-focus`, `--g-focus-width`, `--g-focus-offset` |
| Movimiento | `--g-duration-*`, `--g-ease-*` |
| Ancho del aviso | `min(space × 90, 100% − 2 × margen)` (360px con `space` 4; fijado por coco) |
| Separación entre avisos y margen al borde | Separación `space × 2`; margen `space × 4`, `space × 2` con `data-mobile` (fijados por coco) |
| Objetivos | Los de `GBtn` (≥ 24px; ≥ 44px con `pointer: coarse`) |

## Clases (contrato entre bruno y coco)

| Clase o atributo | Elemento | Cuándo |
| --- | --- | --- |
| `g-toaster` | Raíz (`popover`) | Siempre |
| `g-toaster--position-{top\|bottom}-{start\|center\|end}` y `data-position` | Raíz | Siempre (el valor de `position`) |
| `data-edge="top\|bottom"`, `data-align="start\|center\|end"` | Raíz | **Siempre presentes** (el CSS los necesita); **efectivos** (con `data-mobile`: `bottom`; con `data-flipped`: borde invertido) |
| `data-mobile` | Raíz | Visor < `space × 130` |
| `data-flipped` | Raíz | Pasó al borde contrario para no tapar el foco |
| `is-paused` | Raíz | Temporizadores en pausa (informativa; coco no la necesita) |
| `g-toaster__live` | Canales vivos | Siempre (2) |
| `g-toaster__region` | `section` | Siempre; `hidden` sin avisos visibles |
| `g-toaster__list` | `ol` | Siempre |
| `g-toaster__queued` | Texto de cola | Con cola y `labels.queued`; cuando se muestra, **sin `hidden`** (si no hay cola, no se renderiza) |
| `g-toast` (+ clases de `GSurface floating`) | `li` | Cada aviso visible |
| `g-toast--type-{neutral\|info\|success\|warning\|error\|loading}` y `data-type` | `li` | Siempre |
| `data-state="entering\|visible\|leaving"` | `li` | Ciclo de vida |
| `has-action`, `has-description` | `li` | Según contenido |
| `is-loading` (+ `aria-busy="true"`) | `li` | `type: 'loading'` |
| `is-swiping` y `--_toast-swipe` | `li` | Durante el arrastre (ver «Movimiento») |
| `--_toast-y` | `li` (en línea) | Al pasar a `leaving` (ver «Movimiento») |
| `g-toast__icon` (con `.g-icon` hijo directo), `__content`, `__title`, `__type`, `__count`, `__description`, `__actions`, `__action`, `__close` | Partes | Según contenido |
| `--_toaster-offset-top`, `--_toaster-offset-bottom` | Raíz (en línea) | Con `offset` |

## Avisos de desarrollo

Con `typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'`, `console.warn` con prefijo `[Grana GToaster]`:

1. `show` en el cliente sin **ninguna** `GToaster` montada para ese gestor (se comprueba tras el siguiente ciclo del primer `show`; los avisos esperan y se muestran al montar).
2. Dos `GToaster` montadas para el **mismo gestor**: la segunda no pinta nada.
3. **Varias regiones** de gestores distintos montadas a la vez (regiones vivas que compiten; se permite).
4. `GToaster` sin prop `toaster` y sin gestor provisto: no pinta nada.
5. `useToast()` sin gestor provisto (no se hizo `app.use(toaster)`) o llamado fuera de `setup`: devuelve `undefined` (no inventa un gestor).
6. Aviso sin `title`: no se muestra.
7. `action` sin `label`, o `actions` (plural) / más de una acción: se ignora la acción.
8. `type`, `position`, `politeness` o `duration` fuera de lista; opción desconocida.
9. `duration` numérica en un aviso sin autocierre forzado (`error`, `loading`, con `action`): se ignora.
10. `error` con `politeness: 'polite'`.
11. Falta `labels.region` o `labels.close` (al montar); falta `labels.types.<type>` al usar ese tipo; falta `labels.repeated`, `labels.queued` o `labels.actionHint` la primera vez que se necesitan.
12. Descripción de más de **140 caracteres** o título de más de **60** (un aviso no es para textos largos; no se recorta).
13. `hotkey` igual a `F6`, o con una sintaxis que no se puede interpretar: **se rechaza y se conserva el anterior** (en `createToaster`, el de defecto `F8`; #149).

En producción no hay avisos ni comprobaciones extra.

## SSR

- **Importar `@grana/vue` y llamar a `createToaster` no toca `document`, `window`, `navigator` ni `matchMedia`.** El gestor es estado puro (reactivo) y métodos.
- En el servidor `GToaster` **no renderiza nada** (ni la raíz ni el `Teleport`); en el cliente crea la región en `onMounted` y la abre (`showPopover`). Sin desajuste de hidratación.
- Temporizadores, escuchas de documento (`keydown` del atajo, `visibilitychange`, `focusin`, `resize`) y el `MutationObserver` se crean **solo** al montar `GToaster` y se retiran al desmontarla.
- Avisos creados antes de montar (o en el servidor) esperan; se muestran y anuncian tras montar la región y esperar un ciclo.

## Verificación (qué y cómo)

- **bruno** (pruebas, vitest + jsdom donde baste; Playwright para capa superior, modal, foco y tiempo real):
  - **API:** exportaciones (`createToaster`, `useToast`, `GToaster`, `toasterKey`); `app.use` provee; `useToast` sin gestor avisa y devuelve `undefined`; importación sin `document` (prueba en entorno `node`).
  - **Región:** una raíz `popover` abierta y en el árbol de accesibilidad **antes** del primer aviso; 2 canales (`status`/`polite` + `alert`), cero `aria-live` en la lista; `section` `hidden` sin avisos, con nombre y `aria-keyshortcuts` con ellos; dos `GToaster` del mismo gestor → aviso y una sola región.
  - **Anuncio:** texto compuesto exacto por tipo (prefijo, punto, descripción, «N veces», pista de acción); canal según `politeness`; repetir el mismo texto lo reescribe; un aviso en cola se anuncia al hacerse visible; promesa anuncia `loading` y luego el desenlace.
  - **Tiempo** (relojes falsos): `auto` con la fórmula y sus topes; `Infinity` en `error`, `loading`, con acción y con `autoClose: false`; pausa por hover, foco, `visibilityState` y puntero táctil apoyado, con reanudación del **resto** (mínimo 1000 ms); en cola no corre; `configure({ autoClose })` en vivo.
  - **Foco y teclado:** no roba el foco al aparecer ni al actualizarse; F8 → acción del más reciente (o cierre) → F8 vuelve; F8 sin avisos no hace `preventDefault`; Tab: acción → cerrar → siguiente; Esc cierra el enfocado con `defaultPrevented` y sin propagarse; foco tras cerrar (vecino, guardado, primer control del anfitrión); IME.
  - **Modal:** con un **`GDialog` real** abierto, la región está dentro del `<dialog>`, abierta y pulsable; Esc en un aviso **no** emite `dismiss` del `GDialog` ni lo cierra; Esc fuera sí; al cerrar el modal vuelve a `body` con los avisos y temporizadores intactos.
  - **Cola y deduplicación:** 6 → `limit` visibles + cola con texto; `error` se adelanta; `mobileLimit` en móvil; mismo contenido → `count` y `GBadge` con `label`; mismo `id` → actualiza en su sitio.
  - **Promesa:** misma promesa devuelta; rechazo no tragado (sin `unhandledrejection` extra del gestor); cerrar en `loading` no la cancela y el desenlace no reaparece.
  - **Cierre:** `onDismiss` una vez con cada `reason`; `action.onClick` recibe la copia y cierra con `action`; `dismiss()` y `clear()`.
  - **Posición:** las 6 posiciones; RTL; `data-mobile` bajo `space × 130`; `offset`; `data-flipped` con un campo al pie del visor; deslizar (umbral y vuelta, solo `touch`/`pen`, `touch-action: pan-y`).
  - **Avisos de desarrollo** de la lista; **SSR** (render en servidor sin errores y sin markup de la región).
  - `check-icons.mjs` y `levels.test.js` sin infracciones.
- **coco** (auditoría con un tema distinto al de defecto): texto 4.5:1 y borde/icono/marca 3:1 sobre la superficie `floating` en claro y oscuro, por tipo; tipo reconocible en escala de grises; `forced-colors` (borde visible, icono visible); `prefers-contrast: more`; texto de cola sobre la página (en móvil queda fuera de la tarjeta); objetivos 24/44px; anillo de foco visible dentro de la capa superior; movimiento reducido (solo opacidad, sin giro); 320×640 sin desbordamiento; RTL; zoom 200 % (reflujo de la acción).
- **No verificado y pendiente:** **lector de pantalla real** (VoiceOver, NVDA, JAWS, TalkBack): lectura tras vaciar y reescribir el canal, interrupción del `alert`, que el traslado al modal no repita ni pierda anuncios, retardos de escritura y vaciado, duplicación con el cursor virtual (**riesgo principal**); Firefox y WebKit (`popover`, `:modal`, traslado y re-apertura, que `preventDefault` del `keydown` de Esc suprima el `cancel` del `<dialog>`, `env(safe-area-inset-*)`; Playwright cubre lo automatizable, #108); táctil real (inercia, gesto «atrás» del sistema en los bordes); teclado virtual; varios modales apilados; un `GMenu` abierto sobre un aviso; rendimiento del `MutationObserver` en apps grandes; 2.4.12 en general.

## Fuera de v0.1 (diferido)

- **Historial o bandeja de notificaciones** (#138): si entra, componente propio que lea `toaster.toasts` (y un registro de cerrados que el gestor tendría que conservar; decisión de esa ronda).
- **Contenido enriquecido** (#139): enlaces en la descripción, avatar, slots, `component`, varias acciones.
- **`<GToast>` declarativo**, instancia global de Grana, avisos anclados a un elemento, barra de cuenta atrás, sonido o vibración, Notification API del sistema, teclado virtual (`visualViewport`), posición por aviso.
- **Preguntas de producto abiertas: ninguna** (las dos de kiwi las resolvió el usuario por delegación: #138 y #139).
