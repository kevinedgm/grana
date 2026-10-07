# GTooltip

El **nombre visible** de un control que solo tiene icono (un `GBtn icon` en una barra, las acciones de una fila o de una tarjeta) y, en segundo lugar, la **descripción corta** y el **atajo** de un control que ya tiene nombre. Aparece al pasar el puntero, al llegar al control navegando con el teclado y con la pulsación larga en táctil. Es texto: no se pulsa, no se enfoca y no contiene enlaces ni botones. Lo que contiene ya está en el nombre o la descripción del control (referencias ARIA desde el montaje); el tooltip nunca se anuncia por su cuenta.

**Etiqueta:** `<g-tooltip>` · **Estado:** `candidate` (auditoría de coco aprobada, sin defectos bloqueantes; ver [`design/lab/tooltip/auditoria.md`](../../../../../design/lab/tooltip/auditoria.md)) · **Desde:** 0.1.0 · **Entrada:** el paquete principal `@grana/vue` (global UMD `Grana`)

> `@grana/vue` está en la versión 0.0.0 y aún no se publica. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`, sección `GTooltip`, `#sec-tooltip`). Exige Vue `^3.5.0` (usa `useId`) y un navegador actual con `popover` (`popover="manual"`).

## Registro

`GTooltip` viaja en el paquete principal: no hay entrada propia. Lo registra el plugin y se exporta con el resto:

```js
import { createApp } from 'vue'
import Grana, { GTooltip } from '@grana/vue'
import '@grana/vue/style.css'

createApp(App).use(Grana).mount('#app')   // registra <g-tooltip>
// o, sin plugin: components: { GTooltip }
```

Va en el principal (DECISIONS #380) porque [`GBtn`](../GBtn/README.md) lo usa con su prop `tooltip` y su motor interno también da la pista de solo icono de `GTabs`, `GRadioGroup` y el riel de `GSidebar` (ver «Modo visual»). **Peso:** según la construcción de bruno, `GTooltip` más su motor interno añaden **+5,3 KB gzip** al paquete principal, por debajo del tope de 8 KB que fija #328 y que #380 aplica a este componente (cifra de la construcción, **no remedida al documentar**; no puedo separar aquí el aporte de `GTooltip` del resto de `dist/grana.js`). El CSS va en `grana.css`. Sin empaquetador, `dist/grana.umd.js` lo trae junto con el resto (global `Grana`). En plantillas dentro del HTML (sin compilar), Vue no admite etiquetas de componente autocerradas: escribe `<g-tooltip ...></g-tooltip>`.

## Cuándo `GTooltip` y cuándo `GHelper`

Los dos dan texto de ayuda, pero son cosas distintas y no se intercambian:

| | `GTooltip` | [`GHelper`](../GHelper/README.md) |
| --- | --- | --- |
| Se abre con | Puntero encima (350 ms), foco **por navegación** (al instante), pulsación larga en táctil | Pulsar su disparador |
| Contenido | Un nombre (`text`), una descripción breve (`detail`) y un atajo (`shortcut`): **solo texto** | Agnóstico: texto largo, enlaces, botones, formularios |
| Rol | `role="tooltip"`, referido por `aria-labelledby` o `aria-describedby` del control | `role="dialog"` no modal |
| Foco | Nunca entra | Tab entra en el contenido |
| Disparador | **El control de tu aplicación** (no lo crea) | Un `<button>` propio |
| Persiste | Mientras dure el puntero o el foco | Hasta cerrarlo |

**Regla de uso:** si el texto lleva un enlace o un botón, pasa de una frase, o hay que poder leerlo con calma en táctil, va en **`GHelper`**, que es el *toggletip* de Grana. **No existe `GToggletip`** y no se va a crear (DECISIONS #380): sería un segundo componente para lo mismo y con peor semántica (un anuncio que no se relee frente a un diálogo con nombre).

**Tampoco es** un aviso (`GToast`, la isla de estado), ni una etiqueta de texto recortado (`GSummary` deja todo lo cedido legible), ni el sustituto de la etiqueta visible de un campo (los campos tienen etiqueta siempre; su descripción es el `hint`, visible). El atributo **`title` no se usa nunca** (#113): no aparece con teclado ni en táctil, su tiempo no se controla y los lectores lo leen de forma desigual. Si el control trae `title`, `GTooltip` avisa en desarrollo.

## Qué lo hace distinto

Concepto **A «Pestaña que viaja»** con la **segunda etapa de C** para `detail`, elegidos por el usuario mirando los prototipos de kiwi (`design/lab/tooltip/r02/`, decisiones del 2026-10-06). El concepto B «La barra habla» queda reservado.

| | Qué hace | Por qué sirve |
| --- | --- | --- |
| **La pestaña** | El nombre cuelga del control por una pestaña que **mide exactamente lo que mide el control** (su ancho en una barra, su alto en un riel) y se une al borde de la etiqueta con dos curvas cóncavas, como la pestaña de una carpeta. No hay flecha | Nunca hay duda de a cuál control nombra: una flecha centrada señala un punto, que en una barra de iconos de 28 px cae entre dos con facilidad. Y se lee como el nombre que le faltaba al control, no como una nota pegada encima |
| **Una etiqueta que acompaña** | En un grupo (una barra, un riel, un menú de iconos) el siguiente control **no enciende otra etiqueta en otro sitio**: la que está abierta **viaja** hasta él, con la pestaña cambiando de ancho a la vez | Una barra de ocho iconos se recorre con una sola etiqueta que se mueve, no con ocho que se encienden y apagan. La vista sigue un objeto |
| **Dos tiempos** | Con `detail`, primero se lee **solo el nombre**; si el puntero se queda quieto (o el foco se mantiene), la etiqueta **crece hacia fuera del control** con la descripción y el atajo | Recorrer una barra tapa poco; leer con intención recibe más. El lector de pantalla oye todo al instante: el crecimiento es solo visual |
| **El foco de la interfaz no la enciende** | Solo abre el foco que la persona mueve con el teclado. El foco que pone la aplicación (un diálogo que se abre, un error que enfoca su campo) no | Abrir un diálogo con Intro no deja una etiqueta flotando sobre su primer botón |
| **Pulsar es usar; la pulsación larga pregunta** | Pulsar el control cierra la etiqueta (no tapa el menú que el botón abre). En táctil, la pulsación larga la muestra y **soltar no activa el control** | Quien pregunta «qué es esto» no dispara la acción |

Movimiento sobrio por decisión del usuario: el viaje usa `--g-ease-out`, **sin muelle** (no es un uso nuevo de `--g-ease-spring` ni de `--g-ease-bounce`), y con movimiento reducido **salta**.

## Uso

### Con el envoltorio

`GTooltip` envuelve **un único hijo: el control**. No crea un contenedor: renderiza el control clonado con sus referencias ARIA y, **justo detrás**, su nodo `role="tooltip"`.

```vue
<script setup>
import { GBtn, GIcon, GTooltip } from '@grana/vue'
</script>

<template>
  <!-- Nombre de un botón de solo icono, con atajo -->
  <GTooltip text="Duplicar" shortcut="Ctrl D" keyshortcuts="Control+D">
    <GBtn icon variant="ghost"><GIcon name="copy" /></GBtn>
  </GTooltip>

  <!-- Nombre y descripción en dos tiempos -->
  <GTooltip text="Marcar para revisión" detail="Avisa al responsable del expediente">
    <GBtn icon variant="ghost"><GIcon name="flag" /></GBtn>
  </GTooltip>

  <!-- Un control que ya tiene nombre: el texto pasa a describir (kind="auto") -->
  <GTooltip text="Visible para todo el equipo"><GBtn>Publicar</GBtn></GTooltip>
</template>
```

### Con `<GBtn tooltip>`

El caso más común tiene atajo. La prop `tooltip` de [`GBtn`](../GBtn/README.md) es azúcar de `<GTooltip :text="tooltip"><GBtn …/></GTooltip>` con **todo lo demás por defecto** (`kind="auto"`, sin `detail`, sin atajo, lado por defecto):

```vue
<GBtn icon variant="ghost" tooltip="Duplicar"><GIcon name="copy" /></GBtn>
<!-- equivale a -->
<GTooltip text="Duplicar"><GBtn icon variant="ghost"><GIcon name="copy" /></GBtn></GTooltip>
```

- Para `detail`, `shortcut`, `kind` o `placement`, usa el envoltorio. **Solo `GBtn`** recibe esta prop en 0.1; el nombre `tooltip` queda reservado con este significado si otro componente lo pide.
- **Nombre accesible:** un `GBtn icon` sin `aria-label` toma el `tooltip` como su nombre (`aria-labelledby`) y su aviso de «sin nombre» no salta. Con un `aria-label` igual, hay un solo nombre; con un `aria-label` distinto o con texto propio («Publicar»), el `tooltip` **describe**.
- **Estructura:** `button` (o `a`), el nodo del tooltip y, si hay `loadingText`, `g-btn__status`, en ese orden.
- **Los dos a la vez** (`<GTooltip><GBtn tooltip="…">`): **gana el envoltorio**; `GBtn` no crea el suyo y avisa en desarrollo. Solo cuenta el hijo directo: un `GBtn tooltip` más adentro, por ejemplo en el slot **`action`** de un `GInput` envuelto, conserva el suyo.
- Con `disabled` (nativo) el tooltip no abre (ver «Control deshabilitado»); con `loading`, sigue nombrando.

### Grupos

En una barra no hace falta nada más: los controles que comparten contenedor forman un grupo y la etiqueta viaja entre ellos.

```vue
<div role="toolbar" aria-label="Formato">
  <GBtn icon variant="ghost" tooltip="Negrita"><GIcon name="bold" /></GBtn>
  <GBtn icon variant="ghost" tooltip="Cursiva"><GIcon name="italic" /></GBtn>
  <GBtn icon variant="ghost" tooltip="Subrayado"><GIcon name="underline" /></GBtn>
</div>
```

Ver «Viaje y grupo» para saber qué cuenta como grupo.

## Props

| Prop | Tipo | Valores | Default | Qué |
| --- | --- | --- | --- | --- |
| `text` | String | texto de tu aplicación | **obligatorio** | El nombre o la descripción, según `kind`. Una frase corta; **nunca se recorta ni se abrevia** (se parte en líneas). Vacío o ausente: el tooltip no se activa, no pone referencias y avisa en desarrollo |
| `detail` | String | texto de tu aplicación | sin valor | Segunda parte, **siempre descripción** (`aria-describedby` → `ID-detail`, añadido). Activa la segunda etapa. Sin `detail` no hay segunda etapa |
| `kind` | String | `auto` `label` `description` | `auto` | Cómo se refiere el control al texto (ver «Nombre frente a descripción») |
| `placement` | String | `top-start` `top` `top-end` `right-start` `right` `right-end` `bottom-end` `bottom` `bottom-start` `left-end` `left` `left-start` | sin valor | Preferencia de lado. **Sin valor:** `bottom`, o `right` si el control está en un **grupo vertical** (`aria-orientation="vertical"`). `left` y `right` son **lógicos** (en RTL se espejan). Si no cabe, se voltea |
| `shortcut` | String | texto visible del atajo | sin valor | Se pinta tal cual en un `<kbd>` `aria-hidden` («Ctrl D», «Strg D»); no hay traducción automática de teclas |
| `keyshortcuts` | String | sintaxis de `aria-keyshortcuts` («Control+D») | sin valor | Va a `aria-keyshortcuts` **del control**. Uno sin el otro es válido; `shortcut` sin `keyshortcuts` avisa (el atajo no llegaría a la tecnología de apoyo) |
| `disabled` | Boolean | | `false` | No abre; **las referencias ARIA se conservan** (apagar la pista no puede quitarle el nombre al control). Si estaba abierto, se cierra |
| `id` | String | | generado | Id del nodo; el nombre es `ID-name` y el detalle `ID-detail`. Sin `id`, `g-tooltip-<useId>` (estable en SSR) |

**Sin props de tiempo** por instancia (un retraso distinto en cada botón rompería el grupo), sin `open` ni `v-model` (es efímero y lo decide la persona) y sin slot de contenido (solo texto).

**Eventos:** ninguno. **Métodos expuestos:** ninguno.

### Slot

| Slot | Contenido |
| --- | --- |
| `default` | **Un único hijo: el control** (un elemento o un componente). Se clona con `aria-labelledby` o `aria-describedby` (el segundo, **añadido** a lo que el hijo ya traiga), `aria-keyshortcuts` si hay `keyshortcuts` y `data-g-tooltip` (vacío), en su elemento enfocable. Vacío, con varios nodos o con texto suelto: aviso 1 |

No hay raíz propia ni envoltorio, y por eso tampoco una directiva `v-g-tooltip` (sobre un componente caería en su raíz, que no siempre es el control; en `GInput` es la caja).

## Nombre frente a descripción: `kind`

`kind` decide a qué referencia ARIA va el `text`:

| `kind` | Qué pone en el control |
| --- | --- |
| `label` | `aria-labelledby="ID-name"` (gana sobre un `aria-label` existente, por la regla de ARIA) |
| `description` | `aria-describedby` += `ID-name` |
| `auto` (por defecto) | Decide por el **nombre real** del control. Si **no tiene nombre** (ni texto, ni `aria-label`, ni `aria-labelledby` ajeno) **o su nombre es el mismo texto** (sin distinguir mayúsculas ni espacios), es `label`; si tiene **otro** nombre, es `description` |

Con `detail`, además, `aria-describedby` += `ID-detail` en los tres casos. Con `auto` el control **nunca se lee dos veces** lo mismo («Compartir, botón, Compartir»).

Detalles de `auto`:

- **Antes de medir el DOM** (SSR y primer render) se comporta como `label`, para que un `GBtn icon` no avise por falta de nombre. Al montar se corrige si el control ya tenía otro nombre.
- Se **vuelve a evaluar** cuando cambia `text` y cuando cambia el nombre del control (un `MutationObserver` sobre `aria-label`, `aria-labelledby` y su contenido).
- En un campo con **etiqueta visible**, `auto` siempre describe: el tooltip no sustituye la etiqueta.

```html
<button class="g-btn g-btn--icon …" aria-labelledby="ID-name" aria-keyshortcuts="Control+D" data-g-tooltip>
  <svg class="g-icon" aria-hidden="true">…</svg>
</button>
<div class="g-tooltip" id="ID" role="tooltip" popover="manual" data-side="bottom">
  <span class="g-tooltip__tab" aria-hidden="true"></span>
  <span class="g-tooltip__body">
    <span class="g-tooltip__text" id="ID-name">Duplicar</span>
    <kbd class="g-tooltip__kbd" aria-hidden="true">Ctrl D</kbd>
  </span>
</div>
```

Las referencias apuntan **al texto**, no a la raíz del nodo (`ID-name`, `ID-detail`): si apuntaran a la raíz, el `<kbd>` `aria-hidden` se colaría en el nombre («DeshacerCtrl Z»). El nodo es **persistente**: se renderiza desde el montaje, cerrado (no se ve ni ocupa), de modo que el nombre y la descripción están disponibles antes de que se vea. **Nunca es región viva y nunca usa `title`.** El nodo recibe el puntero (no lleva `pointer-events: none`) y su texto se puede seleccionar (útil con lupa); nunca recibe foco.

## Qué hijos admite

El tooltip va **en el control, nunca en un icono ni en un texto**. El hijo debe tener un elemento enfocable (`button`, `a[href]`, `input`, `select`, `textarea`, `summary`, o cualquier elemento con atributo `tabindex`, también `-1`: los de una barra con `tabindex` itinerante se enfocan con flechas).

### Hijos probados

Los componentes de Grana que reciben los tres atributos ARIA y `data-g-tooltip` en su elemento enfocable (pruebas de bruno en `GTooltip.test.js`, y la matriz completa de la auditoría de coco):

| Hijo | Nota |
| --- | --- |
| [`GBtn`](../GBtn/README.md) (`button` y `a`) | Con `loadingText` el hijo es un fragmento: el nodo va detrás de todo (ver «Nodos hermanos») |
| [`GInput`](../GInput/README.md), `GTextarea`, `GSelect` | Ancla en la caja visible (ver «Caja visible»); con etiqueta visible, `auto` describe |
| `GNumberField`, `GCombobox` (campo y `palette`) | Heredan la caja de `GInput`; los −/+ y los botones propios de la caja muestran el tooltip **del campo** al pasar el puntero |
| `GDatePicker`, `GSwitch`, `GCheckbox` | La caja visible coincide con el control |
| `GHelper` | Reenvía los cuatro atributos a su botón (DECISIONS #391); con el `GHelper` abierto (`aria-expanded="true"`) el tooltip no aparece |
| `GFileField` | Ancla en `g-file-field__add`; con archivos, el elemento resuelto sigue siendo su `<input type="file">`, no el «Quitar» de la primera ficha (#399) |

Dentro de un `GInput`, el slot **`action`** admite un `GBtn tooltip` (conserva el suyo aunque el `GInput` entero esté envuelto). `append` y `prepend` son `aria-hidden` y no admiten controles.

### Lo que no admite

| Hijo | Qué pasa | Por qué |
| --- | --- | --- |
| **Sin elemento enfocable** (un `GIcon` con `label`, un texto, un `GAvatar`) | **No se activa en absoluto** (ni por puntero: una pista que solo ve el ratón excluye al teclado), sin referencias ni nodo; aviso 2 | El tooltip va en el control |
| **`GInputGroupInput` y `GInputGroupSelect`** | No se activan; aviso 8 | La caja visible de la parte es la **parte**, y la parte fija su propio `aria-labelledby` (etiqueta más parte), que gana al recibido. El consejo de una parte va en el `hint` del grupo |
| **`GInputGroup` entero** | No es un hijo | Su raíz es un `fieldset`, no un control |
| Un `GBtn tooltip` como **parte** de `GInputGroup` | Aviso propio de `GInputGroup` («no es una parte»): correcto | `GInputGroup` solo admite `GInputGroupInput`, `GInputGroupSelect` y `GInputGroupText` |
| Más de un hijo, ninguno o texto suelto | Aviso 1 | Es un envoltorio de un control |

### El elemento resuelto

Donde caen las referencias ARIA y el foco es el **elemento resuelto**. La regla (DECISIONS #399): se parte de la raíz del hijo (si es un fragmento, de su primer elemento) y se toma el elemento **enfocable que lleva `data-g-tooltip` y referencia los ids de este tooltip** (en `aria-labelledby` o `aria-describedby`) dentro de ese primer elemento, él incluido; si no hay, el primer enfocable. Las dos condiciones evitan tomar por resuelto el `data-g-tooltip` de un **tooltip anidado** (el `GBtn tooltip` del `action` de un `GInput`). Antes de montar, sin ids propios, basta cualquier `data-g-tooltip` enfocable. Foco y referencias nunca se separan porque la marca la pone el propio `GTooltip`, exactamente donde caen las referencias.

## Caja visible y `data-g-tooltip-box`

El elemento enfocable no siempre es lo que la persona ve como control: en un `GInput` el `<input>` va **dentro** de la caja con prefijo, sufijo y huecos. Por eso el tooltip no ancla en el enfocable sino en la **caja visible**: el ancestro más cercano del elemento resuelto (él incluido) que lleve el atributo **`data-g-tooltip-box`** y esté **dentro del primer elemento del hijo**. Sin marca, el ancla es el propio elemento resuelto. Una marca **fuera del hijo se ignora**. El motor no conoce ninguna clase de ningún componente: cada componente cuyo enfocable no coincide con su dibujo marca su caja con ese atributo (vacío, estático, también en SSR). No es una prop.

Quién lo marca hoy: `GInput` (en `g-input__control`; lo heredan `GNumberField` y `GCombobox`), `GTextarea` (`g-textarea__control`), `GSelect` (`g-select__control`) y `GFileField` (`g-file-field__add`, porque su `<input type="file">` es texto oculto accesible: sin marca el ancla mediría 1 px). No lo necesitan (coinciden): `GBtn`, `GDatePicker`, `GSwitch`, `GCheckbox`, `GHelper`.

Qué usa cada pieza:

| El **ancla** (caja) | El **elemento resuelto** |
| --- | --- |
| Posición y volteo, geometría de la pestaña, seguimiento y salida del visor, puntero (entrar, salir, quieto), pulsar para usar, pulsación larga, menú contextual, pulsar fuera, clic bloqueado tras la pulsación larga | Referencias ARIA y `data-g-tooltip`, foco y `:focus-visible`, `aria-expanded`, `disabled`, el nombre que mide `kind="auto"` |

**El más interno gana el puntero:** si dentro de la caja hay otro control con su propio tooltip, el puntero sobre él (o sobre su nodo) no abre ni mantiene el tooltip exterior.

### Receta para un control compuesto de tu aplicación

Marcar la caja **solo funciona si el componente reenvía los atributos a su elemento enfocable**: `GTooltip` pone `aria-labelledby`, `aria-describedby`, `aria-keyshortcuts` y `data-g-tooltip` en la **raíz** del hijo, y con ellos el elemento resuelto es el que los recibe. En un `<div data-g-tooltip-box><input></div>` plano, o en un componente con herencia automática de atributos, los atributos caen en el `div`: el elemento resuelto es la caja, que no es enfocable, y el tooltip no se activa (aviso 2) o queda con las referencias en algo que nadie enfoca. La forma correcta mínima: `inheritAttrs: false`, la caja con el atributo estático y `v-bind="$attrs"` en el control.

```vue
<script setup>
defineOptions({ inheritAttrs: false })
</script>
<template>
  <div class="mi-campo" data-g-tooltip-box>
    <span class="mi-campo__prefijo">@</span>
    <input class="mi-campo__input" v-bind="$attrs" />
  </div>
</template>
```

Uso: `<GTooltip text="Usuario público"><MiCampo /></GTooltip>`. El `input` recibe las referencias y `data-g-tooltip`; la caja `div` marcada es el ancla de la pestaña. Con `inheritAttrs: false`, `class` y `style` también van al `input`; si los quieres en la caja, repártelos a mano. El componente sigue siendo tuyo: Grana no escribe en su DOM. Un control cuyo enfocable no coincide con su dibujo y que **no** marca su caja tendrá la pestaña del tamaño del enfocable.

## Comportamiento

### Tiempos

Constantes de JavaScript del motor interno (`utils/tooltip.js`, no público), no tokens ni props:

| Constante | Valor | Qué |
| --- | --- | --- |
| `OPEN` | 350 ms | Reposo del puntero antes de abrir |
| `CLOSE` | 100 ms | Gracia al salir del control o del tooltip |
| `SKIP` | 600 ms | Ventana de grupo: con otro abierto o cerrado hace menos de esto, el siguiente abre **al instante y sin entrada** |
| `NAV` | 1000 ms | Un foco cuenta como «por navegación» si hubo una tecla de navegación hace menos de esto y, después, ningún puntero ni tecla que no navega |
| `DWELL` | 700 ms | Reposo (puntero quieto o foco mantenido) que abre la segunda etapa |
| `LONG` | 500 ms | Pulsación larga en táctil |
| `MOVE` | 10 px | Movimiento que cancela la pulsación larga |
| `LINGER` | 1500 ms | Mínimo visible al soltar en táctil |
| `READ_BASE`, `READ_CHAR`, `READ_MAX` | 1000 ms, 50 ms por carácter, 6000 ms | Tiempo de lectura en táctil: `min(READ_MAX, max(LINGER, READ_BASE + READ_CHAR × caracteres))` |

Los valores se leyeron en `utils/tooltip.js` al documentar y coinciden con el contrato.

### Abrir y cerrar

Para el puntero y la pulsación, «el control» es su **caja visible** (el ancla); para el foco, el elemento resuelto.

| Suceso | Efecto |
| --- | --- |
| Puntero (ratón o lápiz) entra en el control | Abre a los `OPEN`; **al instante** si hay otro abierto o se cerró hace menos de `SKIP` |
| Puntero sale del control | Cierra a los `CLOSE`, salvo que entre en el tooltip (o su pestaña) |
| Puntero entra en el tooltip | Sigue abierto; al salir, cierra a los `CLOSE` |
| Foco **por navegación** (`:focus-visible` y una tecla de navegación en los últimos `NAV`, sin puntero después) | Abre **al instante** |
| Foco por clic o **por programa** (un `GDialog` que enfoca su primer control, un `GForm` que enfoca un campo con error) | **No abre** |
| El control pierde el foco | Cierra tras un ciclo de tareas, salvo que el puntero siga encima. El ciclo deja que el control siguiente (Tab o flechas en un grupo) tome el relevo y la etiqueta viaje |
| Pulsar el control (botón principal) | **Cierra** y queda suprimido hasta que el puntero salga y vuelva |
| Esc | Cierra **sin mover el foco**; suprimido hasta salir o perder el foco |
| Pulsar fuera | Cierra |
| Se abre otro tooltip | El anterior se cierra: **uno solo abierto en el documento** |
| El control tiene `aria-expanded="true"` | **No abre** (su menú o panel ya está abierto; si estaba abierto, cierra) |
| Desplazamiento de la página o de un contenedor | Sigue al control una vez por cuadro **sin cambiar de lado**; si el control sale del visor o de su contenedor, cierra sin mover el foco |
| Cambio de tamaño del visor | Se recoloca conservando el lado |

**Sin cierre por tiempo** mientras dure el puntero o el foco (WCAG 1.4.13, «persistente»); el único cierre por tiempo es el de táctil.

Teclas de navegación: Tab, flechas, Inicio, Fin, Av Pág, Re Pág y F6. **Una tecla que no navega** (Intro, Espacio, Esc, letras…) y no es un modificador anula la marca de navegación: así, Tab hasta «Nuevo», Intro, y el `GDialog` que se abre enfoca su primer control **sin** mostrar su tooltip. Los modificadores no anulan (Mayús+Tab y Opción+Tab de WebKit siguen contando). No cierra un tooltip ya abierto: escribir en un campo con la pista visible no la quita. Consecuencia aceptada: el foco que mueve la búsqueda por letras de una lista no abre tooltips.

### Control deshabilitado

- **`disabled` nativo:** el control no recibe foco y el tooltip **no abre**; avisa en desarrollo una vez (aviso 3): **usa `aria-disabled` si el motivo importa**.
- **`aria-disabled="true"`:** abre con normalidad, y es la forma de explicar por qué no se puede usar.
- **`<GTooltip disabled>`:** no abre y conserva las referencias.

### Esc

Una escucha de documento **en captura, solo mientras hay un tooltip abierto**: cierra, pone `preventDefault()` y **no detiene la propagación**. Es la convención de Grana: un componente ignora un Esc con `defaultPrevented` (`GDialog`, `GToaster`, `GMenu`, `GSelect`). Con un tooltip abierto dentro de un `GDialog`, el primer Esc cierra el tooltip y el diálogo sigue; el segundo cierra el diálogo. `GDialog` no cambia.

### Viaje y grupo

**Hay viaje** cuando se cumplen las tres: (1) el entrante abre **mientras el saliente sigue abierto** (el puntero que pasa al vecino dentro de `CLOSE`, las flechas en una barra, Tab al siguiente); (2) los dos controles están en el **mismo grupo**; (3) el entrante resuelve el **mismo lado** que el saliente (si no cabe y voltea, no viaja). Si no, aparece en su sitio (al instante si toca).

**Qué cuenta como grupo:** el ancestro más cercano del elemento resuelto que sea `[role="toolbar"]`, `[role="tablist"]`, `[role="radiogroup"]`, `[role="menubar"]`, `[role="group"]`, `nav` o `[role="navigation"]`. **Si no hay ninguno, el elemento padre** de la raíz del hijo (las acciones de una fila o de una tarjeta, que pones juntas en un contenedor). Un ancestro de grupo con `aria-orientation="vertical"` decide el lado por defecto (`right`). No hay `GTooltipGroup`.

El mecanismo es un **relevo con continuidad, sin superficie compartida**: la etiqueta visible es siempre el nodo `role="tooltip"` del control actual (no hay un nodo de grupo ni una copia `aria-hidden` del texto). Al viajar, en el mismo cuadro, el saliente se oculta sin salida y el entrante parte de la geometría del saliente (posición, ancho, pestaña) y transiciona a la suya. El texto cambia en el acto: leer no espera. Con `prefers-reduced-motion: reduce`, **salta**.

### Segunda etapa: `detail`

- **Sin `detail`:** una sola etapa: el nombre y, si hay, el atajo en la misma línea.
- **Con `detail`:** primero **solo el nombre**. Tras `DWELL` con el puntero **quieto** sobre el control o la etiqueta (cualquier `pointermove` reinicia la cuenta), o con el foco mantenido ese tiempo, la etiqueta **crece** con la descripción y el atajo. Recorrer sin pararse no la hace crecer.
- **Crece hacia fuera del control:** el borde junto al control no se mueve. El ancho final se aplica en el acto y el alto crece con `--g-duration-press` y `--g-ease-out`. Con movimiento reducido, aparece sin crecer.
- **Al viajar**, la etapa vuelve a la primera en el acto y la cuenta de `DWELL` empieza de nuevo en el control siguiente.
- **El atajo pasa a la segunda etapa solo cuando hay `detail`** (lectura literal de la decisión del usuario: «crece con la descripción y el atajo»); sin descripción, la etiqueta ya es pequeña y hacer esperar el atajo no ahorra nada (#389).

### Táctil

En táctil no hay *hover*, y un icono sin nombre visible es justo el problema que el tooltip resuelve:

- **Pulsación larga** (`LONG`, cancelada si el dedo se mueve más de `MOVE`): muestra el tooltip **entero**, ya en la segunda etapa si hay `detail`.
- **Soltar no activa el control:** el clic que sigue a la pulsación larga se cancela. Un toque normal activa y no muestra nada.
- Al soltar queda visible **el tiempo de lectura** de su texto (nombre, detalle y atajo), mínimo `LINGER` y máximo `READ_MAX`; tocar en otro sitio lo cierra antes. Otra pulsación larga lo vuelve a pedir.
- El menú contextual del sistema y la selección de texto se anulan solo en el control y en su caja (`-webkit-touch-callout: none` y `user-select: none` bajo `@media (pointer: coarse)`, **salvo en `input` y `textarea`**, que conservan su selección).
- Con lector de pantalla en móvil no hace falta nada: nombre y descripción ya se leen al llegar al control.

### WCAG 1.4.13

- **Descartable:** Esc, sin mover el foco ni el puntero.
- **«Hoverable»:** el puntero cruza al tooltip sin que se cierre: **la pestaña es el puente** (cubre el hueco entre el control y la etiqueta en todo el ancho del control) y la gracia `CLOSE` cubre el resto.
- **Persistente:** ver «Abrir y cerrar».

## Teclado

El tooltip **nunca recibe foco** ni lo mueve: no añade paradas de Tab.

| Tecla | Qué |
| --- | --- |
| Tab / Mayús+Tab, flechas, Inicio, Fin, Av Pág, Re Pág, F6 | Al llegar a un control con tooltip, **abre al instante** (foco por navegación). En un grupo, la etiqueta **viaja** al control siguiente |
| Esc | Cierra el tooltip abierto, sin mover el foco. Un segundo Esc llega al componente que lo contenga (un `GDialog`) |
| Intro / Espacio | Usan el control como siempre y anulan la marca de navegación: el foco que ponga la interfaz tras esa tecla no abre otro tooltip (#396). Una tecla que no navega no cierra por sí misma un tooltip ya abierto |

WebKit con los ajustes por defecto de Safari llega a los controles con **Opción+Tab**, como a cualquier botón: no es propio de este componente (la auditoría usó `Alt+Tab` en WebKit).

## Accesibilidad

- **Semántica:** `role="tooltip"` en un nodo persistente (`popover="manual"`), hermano del control, referido por `aria-labelledby` o `aria-describedby` (según `kind`) con ids estables en SSR; `aria-keyshortcuts` en el control; `<kbd>` y pestaña `aria-hidden`.
- **No es región viva:** no anuncia nada al aparecer; el lector de pantalla oye nombre, descripción y atajo al llegar al control, y el `detail` con él, porque `aria-describedby` va desde el montaje.
- **Foco:** el tooltip no lo recibe ni lo mueve; el anillo es el del control.
- **Hijo sin elemento enfocable:** no se activa (2.1.1: una pista que solo ve el ratón excluye al teclado).
- **Contraste** (nombre, detalle y atajo, borde del atajo, pestaña y etiqueta frente a la página, superficie inversa): mínimo **15,2:1** en Chromium sobre 26 temas (defecto, el de auditoría, los once generados de `dark-color-presence`, claro y oscuro) y 15,22:1 en Firefox y WebKit (cuatro temas); **17,40:1** con el tema por defecto. El mínimo del proyecto es 4,5:1.
- **Texto:** el nombre y el detalle en `body-sm` (14 px con el tema por defecto, 15,75 px en el tema de la entrega de estilo) y el atajo en `caption` (12 px, el suelo; 12,75 px con el tema de la auditoría). Sin recorte en ningún caso medido.
- **Zoom al 400 % (320 px):** el ancho máximo es `min(space × 70, visor − space × 4)`; medido, la etiqueta cabe con sus dos márgenes (de 8 a 288 px con `space` 4, de 10 a 310 px con `space` 5).
- **Pestaña frente a la caja visible** (matriz de hijos, tres motores): Δ ≤ 0,25 px de ancho; nunca sobresale de la etiqueta.
- **`forced-colors`** (emulado en los tres motores): la pestaña es un fondo y desaparecería; se mantiene como `Canvas` con sus dos lados largos en `CanvasText`, y el borde de la etiqueta es `CanvasText`. El contraste `CanvasText`/`Canvas` es ≥ 3:1.
- **Movimiento reducido:** el viaje salta, la segunda etapa aparece sin crecer; el fundido de opacidad se queda.
- **Idioma:** Grana no trae textos propios en el tooltip; todo texto lo das tú, también `shortcut`.

## Posición

Una capa superior (`popover="manual"`, posición fija): ningún `overflow: hidden` lo recorta. Por ser **hermano del control**, dentro de un `<dialog>` modal vive dentro del diálogo y no queda inerte. Usa `placeAround` de `utils/anchor.js`: el lado pedido, el opuesto y los perpendiculares, en el primero que cabe, desplazado en el eje secundario hasta quedar dentro con margen `space × 2`. Hueco control–etiqueta: `space × 1,5` (el largo de la pestaña).

Sigue las reglas de **paneles anclados estables** (`docs/contract/api.md`, #358): el **lado se decide al abrir** y no cambia mientras está abierto (se reevalúa al reabrir y al viajar), y si el control sale del visor o de su contenedor con el desplazamiento, **cierra sin mover el foco**. No tiene alto máximo ni lista, y no hay hoja móvil: en un visor estrecho sigue siendo un tooltip.

Con el control más ancho que su etiqueta, la etiqueta mide **al menos lo que la pestaña**, hasta el ancho máximo; con uno más ancho que ese máximo (un botón `block`), la pestaña se acota a la etiqueta, centrada sobre el control. A los lados (`left` y `right`, un riel), el alto mínimo de la etiqueta es `min(alto del control, visor − space × 4)`.

**RTL:** `left` y `right` son lógicos (`placement="left"` abre a la derecha en RTL); en un grupo vertical el lado por defecto es el fin de línea; la pestaña y el viaje usan coordenadas físicas calculadas con `rtl`. El `<kbd>` no se espeja.

## Nodos hermanos y tus selectores

El nodo va **inmediatamente después** del elemento raíz del hijo, nunca antes: así no altera el `:first-child` del control ni de los anteriores. Con un hijo que es un fragmento (`GBtn` con `loadingText`: `button` + `g-btn__status`), `<GTooltip>` lo pone **detrás de todo el fragmento** (`button`, `g-btn__status`, nodo) y `<GBtn tooltip>` lo pone entre el botón y su estado (`button`, nodo, `g-btn__status`). Las dos órdenes son válidas (#398): no hay diferencia observable.

Cerrado no ocupa sitio ni genera hueco de `gap` (`display: none` del agente de usuario mientras no está abierto; el CSS de Grana no fija `display` en `.g-tooltip` fuera de `:popover-open`); abierto vive en la capa superior, fuera del flujo. Pero **cuenta para los selectores estructurales**: `:last-child`, `:only-child`, `:nth-child()` de los hermanos siguientes, `:nth-last-child()` y las combinaciones `+` y `~` que parten del control.

**Regla para tu CSS** (la misma que sigue Grana, `api.md` «Nodos hermanos de `GTooltip`»): todo selector que ponga estilo por estructura a **hijos que pone tu aplicación** ignora `.g-tooltip`, **siempre con `:where(.g-tooltip)`** (no suma especificidad, así el selector conserva la que tenía):

```css
/* en lugar de  .barra > :last-child */
.barra > :nth-last-child(1 of :not(:where(.g-tooltip))) { margin-inline-end: 0 }

/* en lugar de  .barra > *   (display, inline-size, márgenes o white-space para todos los hijos) */
.barra > :not(:where(.g-tooltip)) { white-space: nowrap }

/* en lugar de  .a + .b   (dos controles con tooltip entre ellos): la variante con el nodo intermedio */
.a + .b,
.a + :where(.g-tooltip) + .b { margin-inline-start: 0 }
```

Un `> *` sin exclusión daría `display`, `inline-size` o márgenes al nodo, que es fijo y oculto: lo heredaría y quedaría **visible estando cerrado** o del ancho del visor. Un `:first-child` no se ve afectado. Los tres motores admiten `:nth-child(… of S)`. El CSS de Grana ya está corregido en todos los componentes donde esto importaba (`GDialog`, `GInputGroup`, `GFormRow`, `GAdaptiveLayout`, `GCard`, `GInput`; medido Δ0 frente al mismo marcado sin tooltip, ver «Verificación»), y `GFormRow`, `GAdaptiveLayout`, `GInputGroup`, `GFormSection` y `GFieldGroup` saltan el nodo cuando recorren sus hijos con JavaScript.

Dentro de un `GInput`, el tooltip de un `GBtn` del slot `action` no cambia el aspecto del campo; y el último control de un `GDialog` con tooltip conserva su margen final de 0.

## Tema

`GTooltip` solo lee `var(--g-*)` y alias locales `var(--_*)`: sin literales de tema ni valores de respaldo, y **sin tokens nuevos** (`tokens.md` §36). La etiqueta es una **superficie inversa** (la de la isla de estado y la paleta de `GCombobox`): se invierte sola en el tema oscuro.

| Token | Uso |
| --- | --- |
| `--g-color-text` | Fondo de la etiqueta y de la pestaña |
| `--g-color-surface` | Texto, detalle y borde del `<kbd>` (vía `currentColor`) |
| `--g-radius-md` | Esquinas de la etiqueta |
| `--g-radius-sm` | Esquinas de la pestaña del lado del control y curvas de unión |
| `--g-radius-xs` | El `<kbd>` |
| `--g-shadow-2` | Sombra de la etiqueta |
| `--g-space-1` | Relleno (`× 1` arriba y abajo, `× 2,5` a los lados), separaciones, largo de la pestaña (`× 1,5`), ancho máximo (`min(× 70, visor − × 4)`), márgenes al visor (`× 2`) |
| `--g-border-width` | Borde transparente de la etiqueta (visible en `forced-colors`) y entrada de la pestaña en la etiqueta |
| `--g-font-ui` | Familia |
| `--g-text-body-sm-size`, `-line`, `-weight`, `-tracking` | Nombre y detalle |
| `--g-text-caption-size`, `-line`, `-weight`, `-tracking` | `<kbd>` |
| `--g-text-action-weight` | Peso del nombre |
| `--g-duration-fast` | Fundido de entrada y salida |
| `--g-duration-press` | Viaje y crecimiento de la segunda etapa |
| `--g-ease-out` | Curva del viaje y de la segunda etapa |

**No son tokens** (constantes de diseño): las constantes de tiempo (JavaScript, ver «Tiempos»), el largo de la pestaña y el relleno de la etiqueta, que se derivan de `space`. Para cambiar el aspecto del tooltip cambias el tema: `space`, `radius`, `borde`, el cuerpo de texto y los colores de texto y superficie. Sus colores salen de `--g-color-text` y `--g-color-surface`, que también usa el resto de la interfaz: no hay un token específico del tooltip. Las reglas de Grana van en la capa `grana.components`; una regla tuya **sin capa** gana siempre: acótala con un selector más específico para no tocar al tooltip sin querer (por ejemplo, una regla global sobre `div`). Mínimos fuera del tema: la etiqueta no es diana (`24px` y `44px` no aplican), el texto ≥ 12 px y el contraste ≥ 4,5:1.

### Clases y atributos

Para quien escribe CSS sobre el tooltip. Una clase o dato de esta lista es API; nada más lo es.

| Clase o dato | Elemento | Cuándo |
| --- | --- | --- |
| `g-tooltip`, `g-tooltip--detail` | Nodo `role="tooltip"` | Siempre; la segunda, con `detail` |
| `g-tooltip__tab`, `g-tooltip__body`, `g-tooltip__text`, `g-tooltip__kbd` | Pestaña, etiqueta, nombre, atajo | Siempre (`__kbd` con `shortcut`) |
| `g-tooltip__more`, `g-tooltip__more-in`, `g-tooltip__detail` | Segunda etapa | Con `detail` |
| `:popover-open` | Nodo | Abierto |
| `data-side` | Nodo | Abierto: lado real tras el volteo (`top` `right` `bottom` `left`, lógico) |
| `data-instant`, `data-travel`, `data-dwell`, `data-touch` | Nodo | Sin entrada, viajando, segunda etapa, abierto por pulsación larga |
| `data-g-tooltip` | Elemento resuelto del hijo | Siempre que el tooltip esté activo |
| `data-g-tooltip-box` | Caja visible de un control (la pone **ese componente**) | Siempre (estático) |

## Avisos de desarrollo

Prefijo `[Grana GTooltip]`, **una vez por instancia y motivo**, solo con `process.env.NODE_ENV !== 'production'` (sin el texto del usuario en el mensaje; un `placement` o un `kind` fuera de su lista lo avisa el validador de la prop).

| # | Cuándo |
| --- | --- |
| 1 | El slot no tiene **un único hijo** (vacío, varios nodos o texto suelto) |
| 2 | El hijo **no tiene elemento enfocable** (incluido un `GIcon` con `label`): no se activa |
| 3 | El control tiene `disabled` nativo: «usa `aria-disabled` si el motivo importa» |
| 4 | `text` vacío o ausente |
| 5 | `shortcut` sin `keyshortcuts` |
| 6 | El control trae `title` |
| 7 | **`GBtn` con `tooltip` como hijo directo** de un `GTooltip`: gana el envoltorio (lo emite `GBtn`, con su prefijo `[Grana]`) |
| 8 | El hijo es `GInputGroupInput` o `GInputGroupSelect`: no se admite; usa el `hint` del grupo |

## SSR

El nodo y las referencias se renderizan en el servidor, con ids estables (`useId`) y `kind="auto"` como `label` hasta medir. Ninguna escucha ni lectura de `document` o `window` fuera de `onMounted`. `GTooltip.ssr.test.js` fija el marcado exacto y comprueba que dos renders consecutivos coinciden, que `GBtn tooltip` renderiza y que `data-g-tooltip-box` sale también del servidor (`GInput`, `GTextarea`).

## Modo visual (clientes internos)

El motor interno de `GTooltip` (`utils/tooltip.js`, no público) tiene un **modo visual** para controles de Grana cuyo **nombre ya está en su DOM** como etiqueta oculta visualmente (DECISIONS #433). Lo usan tres componentes, cada uno con su sección:

| Cliente | Dónde sale la pista | Detalle |
| --- | --- | --- |
| [`GTabs`](../GTabs/README.md#pista-de-solo-icono) | Pestañas solo icono y «Más» | Viaja por el `tablist`; debajo, o a la derecha lógica en vertical (#434) |
| [`GRadioGroup`](../GRadioGroup/README.md#pista-de-solo-icono) | Opciones solo icono de `segmented` y `chip` | La pestaña mide el segmento o el chip; viaja con las flechas (#435) |
| [`GSidebar`](../GSidebar/README.md#riel) | Items, padres, búsqueda y contraer del riel | Viaja por el `<nav>`; a la derecha lógica; la navbar no lleva pista (#436 y #437) |

Tiene la misma forma, el mismo CSS y el mismo comportamiento que `GTooltip` (tiempos, foco por navegación, Esc, pulsación larga que muestra y no activa, viaje en el grupo, una sola pista abierta en el documento, compartida con los `GTooltip` de tu aplicación). Se distingue en tres cosas:

- **Es solo visual:** el nodo lleva `aria-hidden="true"` y **ningún** `role`, `id`, `aria-describedby` ni `aria-labelledby`. El nombre ya está en el DOM del control, así que con y sin pista el árbol de accesibilidad es el mismo (no se duplica el anuncio). En `GTooltip`, en cambio, el nodo es siempre `role="tooltip"` y no hay copia `aria-hidden` del texto.
- **El texto es la etiqueta oculta** del control (`item.label`, `option.label`), sin estado, insignia ni contador, y no hay `detail`, atajo ni segunda etapa.
- **Un nodo por control**, persistente y cerrado desde el montaje, que solo se activa mientras la etiqueta del control está oculta. Vive dentro de la raíz del componente, nunca dentro de un `tablist` ni de una `<label>`.

Ninguno de los tres añade props, textos ni tokens. El peso lo mide cada `meta.json` (`GTabs` +884 B gzip en `grana.js`, `GRadioGroup` +253 B sobre `GTabs`, `GSidebar` −5 B). Auditoría de coco con el componente real: [`design/lab/tooltip/auditoria-pista.md`](../../../../../design/lab/tooltip/auditoria-pista.md), 31 347/31 347 en Chromium, Firefox y WebKit.

## Limitaciones conocidas

- **La diagonal hacia la etiqueta pasa por los vecinos** (WCAG 1.4.13): en una barra, ir en diagonal hacia la etiqueta cruza controles vecinos, que toman el relevo. Sin «triángulo de seguridad» (retrasaría el relevo, que es lo que hace rápida la lectura de una barra) y el tooltip no tiene nada que pulsar: se alcanza en línea recta (medido: baja del control a la etiqueta cruzando la pestaña en 12 pasos sin cerrarse).
- **Fundido de salida solo en Chromium:** Firefox y WebKit no transicionan `display` de un popover y cierran en el acto, igual que `GMenu` y `GSelect`.
- **Esquinas junto a controles rellenos con radio grande** (hallazgo 2 de la auditoría, abierto, no bloqueante): con un control relleno y la pestaña a ancho completo de la etiqueta, las esquinas `--g-radius-sm` de la pestaña asoman en la curva del control. ~2 px con el tema por defecto; mayor con un radio grande (el tema de la auditoría, `--g-radius-md` de 14 px), y más visible en oscuro, donde pestaña y botón son claros. Cerrarlo exigiría un token con el radio de cada control: decisión de lima, no está.
- **Pestaña recortada en el borde del visor** (hallazgo 3, por diseño): con un control pegado al borde del visor, la etiqueta conserva su margen `space × 2` y la pestaña se acota a la parte de la caja que la etiqueta cubre: unos 10 px menos que el control en las esquinas (9,5 a 10,4 px medidos en los tres motores). Con `placement="left"` o `right-end` en las esquinas inferiores, el lado pedido no cabe y la etiqueta pasa a `top`; queda dentro del visor y con la forma correcta.
- **Tus selectores estructurales ven el nodo** (ver «Nodos hermanos y tus selectores»).
- **Un tooltip no sustituye la etiqueta de un campo ni su `hint`.**
- **Sin `popover="hint"`** (soporte desigual): el cierre por Esc y por pulsar fuera lo hace el motor, no el navegador; abrir el tooltip no cierra los `popover="auto"` de otras bibliotecas ni ellos lo cierran a él.
- **Sin tooltip en el contenido no enfocable:** si necesitas explicar un texto, hazlo en un `GHelper` o en un `hint`.
- **`GInputGroupInput` y `GInputGroupSelect` no se admiten como hijo.**
- **Un control de tu aplicación sin `data-g-tooltip-box`** (o que no reenvía los atributos a su enfocable) tendrá la pestaña del tamaño del enfocable o no se activará: ver la receta.
- **La pista visual de los componentes internos** (`GTabs`, `GRadioGroup` y el riel de `GSidebar`) no es API: no se configura ni hay `kind="none"` público. Ver «Modo visual».

## Reservado (fuera de 0.1)

Hoy **no existen**: la opción **B «La barra habla»** (leyenda fija de un grupo; exigiría un componente de grupo con su API), `popover="hint"` cuando esté en los tres motores, `tooltip` en otros componentes además de `GBtn`, `kind="none"` público, props de tiempo por instancia, `open` controlado, contenido rico o slot de contenido, flecha, triángulo de seguridad y la directiva `v-g-tooltip`. **Nunca:** `GToggletip` (es `GHelper`), `title`, un tooltip en contenido no enfocable y un muelle en el viaje.

## Verificación

- **Pruebas** (vitest con jsdom y, para el servidor, entorno node), **91 en verde al documentar** (ejecutadas de nuevo): `GTooltip.test.js` (51), `GTooltip.ssr.test.js` (4) y `utils/tooltip.test.js` (36). Cubren props y validadores, un hijo o varios o ninguno, referencias en cada hijo probado, `kind` (incluido el provisional antes de montar y la reevaluación), `detail` siempre en `describedby`, el nodo detrás del hijo, `disabled`, los avisos 1 a 6 y 8, la caja visible (ancla elegida, marca fuera del hijo ignorada, el más interno gana), el elemento resuelto de `GFileField` con 1 y con 3 archivos, `GHelper`, `GBtn tooltip` (nombre, descripción, envoltorio, `action` de un `GInput`, las dos órdenes del nodo), la estabilidad de `GFormRow`, `GAdaptiveLayout` y `GInputGroup` con el nodo, y los temporizadores con relojes falsos.
- **Navegador** (Playwright en Chromium, Firefox y WebKit, `design/lab/theme-playground/tests/tooltip.spec.mjs`): según el commit de bruno (`0b521b5`), 75/75 en los tres motores; la auditoría de coco lo ejecutó de nuevo con el CSS corregido, 29/29 en Chromium. **No se repitió al documentar.** Cobertura: nada a 200 ms y abierto a 500 ms, relevo del grupo, **barrido de ocho iconos con una sola etiqueta visible en todo momento**, pestaña Δ 0 frente al control, sin viaje entre grupos distintos, segunda etapa, Esc, Tab y flechas abren al instante, foco por clic y por programa no, `GDialog`, táctil sintético, `GHelper` envuelto y la matriz de hijos con la caja visible.
- **Auditoría de coco** con el componente real y un tema distinto al por defecto (`@grana/cli`: marca `#14532D`, acento `#B45309`, **radius 14, `space` 5, borde de 2 px**, claro y oscuro): `GRANA_PW_PORT=4209 node design/lab/tooltip/auditoria-verificar.mjs`, **6944/6944** comprobaciones (Chromium 2344, Firefox 2300, WebKit 2300), sin defectos bloqueantes. Cifras tomadas de `auditoria.md`; **no se repitió esa pasada al documentar**. El hallazgo 1 (una mota de la curva de unión asomaba fuera de la etiqueta; 113 fallos en Chromium) estaba corregido en `GTooltip.css` antes de esa cifra. Mide la matriz de hijos contra la caja visible, el relleno a los doce lados, 120 px, `block`, las esquinas del visor, RTL, 320 px, el viaje y la segunda etapa cuadro a cuadro, movimiento reducido, WCAG 1.4.13, el foco por navegación, `forced-colors`, el táctil emulado y el efecto sobre `GDialog`, `GInput`, `GInputGroup`, `GFormRow`, `GAdaptiveLayout` y `GCard` (Δ0 frente al mismo marcado sin tooltip). Banco de estilo previo: 1454/1454 (Chromium) tras la corrección.
- **Viaje** (tema de auditoría, `--g-duration-press` a 1000 ms para contar cuadros, los tres motores): una sola etiqueta visible en los 97 cuadros y ninguno vacío; el entrante sin fundido de entrada; 43 cuadros intermedios, monótono, sin rebase, la pestaña dentro de la etiqueta en cada cuadro y Δ0 al llegar con `data-travel` e `inline-size` retirados. Con movimiento reducido, 0 cuadros intermedios.
- **Segunda etapa:** abajo (`bottom`) y arriba (`top`), el borde junto al control no se mueve (Δ ≤ 0,5 px) mientras el alto crece de forma monótona (≥ 8 cuadros), sin cambiar de lado.
- **Táctil emulado** (pulsación sintética): nada a 300 ms; nombre a unos 500 ms con `data-touch`; soltar no activa (0 clics); queda el tiempo de lectura; un toque corto activa una vez y no muestra.
- **Empaquetado** (al documentar): `dist/grana.css` contiene `g-tooltip__tab` (compuerta), no contiene `data:font`, y `dist/grana.umd.js` no contiene `createApp`; `dist/grana.js` contiene `GTooltip`.
- **CSS:** sin literales de tema, sin valores de respaldo, solo `--g-*` del contrato (la lista de «Tema» sale de leer `GTooltip.css`); `display` solo bajo `:popover-open`.
- **Iconos:** el tooltip no lleva icono propio; `node packages/vue/scripts/check-icons.mjs` sale en verde (comprobado al documentar, README incluido).

## No verificado

- **Lector de pantalla real** (VoiceOver, NVDA, JAWS, TalkBack): cómo se leen nombre, descripción, `aria-keyshortcuts` y `detail` al llegar al control. Solo se comprobó el árbol de accesibilidad y las referencias en el DOM.
- **Táctil real:** el menú contextual y la lupa de iOS (`-webkit-touch-callout` no existe en los motores de escritorio) y la pulsación larga real. Lo medido es `pointer: coarse` emulado y una pulsación **sintética** (`PointerEvent` con `pointerType: "touch"`). En el táctil emulado, `GSwitch`, `GCheckbox` y `GFileField` resuelven a un `<input>` que conserva su `user-select` por diseño.
- **Safari real** con Tab por defecto (solo el WebKit de Playwright).
- **`forced-colors` real** (Windows): solo emulado en los tres motores.
- **El peso** de +5,3 KB gzip: cifra de la construcción de bruno, no remedida al documentar.
- **El zoom de página al 400 % del navegador**: lo medido es un visor de 320 px y el zoom emulado a partir de 1280 px.
- **Cifras de este README tomadas de otros informes** (auditoría y estilo de coco, peso y 75/75 de bruno) y no remedidas al documentar, salvo las marcadas como «ejecutadas de nuevo» o «comprobado al documentar».

## Fuentes

- API: [`GTooltip.meta.json`](./GTooltip.meta.json) · Contrato: [`design/contracts/tooltip.md`](../../../../../design/contracts/tooltip.md) (DECISIONS #380 a #399) · Contrato transversal: [`docs/contract/api.md`](../../../../../docs/contract/api.md) («Paneles anclados» y «Nodos hermanos de `GTooltip`») · Atajo del botón: [`design/contracts/btn.md`](../../../../../design/contracts/btn.md) y [`GBtn`](../GBtn/README.md) · Prototipos: [`design/lab/tooltip/r01/`](../../../../../design/lab/tooltip/r01/) y [`r02/`](../../../../../design/lab/tooltip/r02/) · Estilo: [`design/lab/tooltip/estilo.md`](../../../../../design/lab/tooltip/estilo.md) · Auditoría: [`design/lab/tooltip/auditoria.md`](../../../../../design/lab/tooltip/auditoria.md) · Toggletip: [`GHelper`](../GHelper/README.md) · Campos: [`GInput`](../GInput/README.md) y [`GFileField`](../GFileField/README.md)
