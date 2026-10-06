# Contrato · GTooltip

**Dueño:** lima · **Estado:** aprobado (forma **A «Pestaña que viaja»** por defecto con la **segunda etapa de C** para `detail`; viaje con `--g-ease-out`, sin muelle; en táctil la pulsación larga muestra y **no** activa; atajo `<GBtn tooltip>` además del envoltorio: decisiones del usuario del 2026-10-06. **B «La barra habla»** queda reservada. El resto deriva de WAI-ARIA APG (Tooltip), WCAG 2.2 y los contratos vigentes; **ninguna pregunta de producto abierta**) · **Basado en:** `design/lab/tooltip/r01/` (kiwi, base funcional, L1 a L21) y `design/lab/tooltip/r02/` (kiwi, commit `e4308c6`; conceptos A, B y C, comparativa, L22 a L28; `verificar.mjs` 246/246 en los tres motores).
**Tag:** `g-tooltip` · **Categoría:** superposiciones · **Entrada del paquete:** `@grana/vue` (principal, #380)
**Decisiones:** #380 a #393.
**Componente complejo** (CLAUDE.md, «Modelos por rol»: se posiciona sobre otros elementos y lo usarán otros componentes por dentro): **coco y bruno en Opus**.

Un **nombre visible** para lo que solo tiene icono (`GBtn icon` en una barra, las acciones de una fila o de una tarjeta) y, en segundo lugar, una **descripción corta** y el **atajo** de un control que ya tiene nombre. Aparece al pasar el puntero, al llegar navegando con el teclado y con la pulsación larga en táctil.

---

## Principios

- **Texto corto, sin controles.** No se pulsa, no se enfoca, no contiene enlaces ni botones y no anuncia nada por su cuenta. Lo que dice ya está en el nombre o la descripción del control (referencias ARIA desde el montaje).
- **El tooltip va en el control, nunca en el icono ni en un texto** (`icons.md` §2): sin un elemento enfocable no hay tooltip.
- **No añade elementos al DOM salvo su propio nodo**, que es **hermano del control** (§«Nodo hermano»).
- **Un comportamiento para toda la librería**: tiempos, grupo, foco, Esc y táctil viven en un motor interno (`utils/tooltip.js`) que también usarán los componentes con pista propia (#392).
- Sin `fetch`, sin globals de la aplicación, sin textos propios (Grana es internacional): todo texto lo da el consumidor.

## Qué es y qué no (frontera, #380)

| | `GTooltip` | `GHelper` (`helper.md`) |
| --- | --- | --- |
| Se abre con | Puntero encima (350 ms), foco **por navegación** (al instante), pulsación larga en táctil | Pulsar su disparador |
| Contenido | Un nombre (`text`), una descripción breve (`detail`) y un atajo (`shortcut`); solo texto | Agnóstico: texto largo, enlaces, botones, formularios |
| Rol | `role="tooltip"`, referido por `aria-labelledby`/`aria-describedby` del control | `role="dialog"` no modal |
| Foco | Nunca entra | Tab entra en el contenido |
| Disparador | **El control de la aplicación** (no lo crea) | Un `<button>` propio |
| Persiste | Mientras dure el puntero o el foco | Hasta cerrarlo |

**Regla de uso:** si el texto tiene un enlace o un botón, pasa de una frase, o hay que poder leerlo con calma en táctil, va en **`GHelper`**, que es el *toggletip* de Grana. **No se crea `GToggletip`** (sería un segundo componente para lo mismo, con peor semántica: un anuncio que no se relee frente a un diálogo con nombre).

**Tampoco es:** un aviso (`GToast`, isla de estado), una etiqueta de texto recortado (`GSummary` deja todo lo cedido legible, #352), ni el sustituto de la etiqueta visible de un campo (los campos tienen etiqueta siempre, `form.md`; su descripción es `hint`, visible). El atributo **`title` no se usa** nunca (#113): no aparece con teclado ni en táctil, su tiempo no se controla y los lectores lo leen de forma desigual.

## Qué lo hace distinto (#387 a #389; decisión del usuario 1 y 2)

1. **La pestaña que viaja (A).** El nombre cuelga del control por una **pestaña que mide exactamente lo que mide el control** (ancho en una barra, alto en un riel): no hay duda de a cuál nombra (una flecha centrada señala un punto, que en una barra de iconos de 28px cae entre dos con facilidad), y se lee como **el nombre que le faltaba al control**, no como una nota pegada encima. Al recorrer un grupo, en lugar de ocho globos que se encienden y apagan en ocho sitios, **una etiqueta acompaña** de un control al siguiente (medido por kiwi: 1 aparición frente a 8; el ojo a 49px del control frente a 143px del globo).
2. **Dos tiempos (segunda etapa de C).** Con `detail`, primero se lee **solo el nombre** (etiquetas pequeñas que tapan poco al recorrer); si el puntero se queda **quieto** o el foco se mantiene, la etiqueta **crece hacia fuera del control** con la descripción y el atajo, justo cuando hay intención (y cuando aprender el atajo tiene sentido). El lector de pantalla lo oye todo al instante: el crecimiento es solo visual.
3. **Lo que ya traía la base:** el foco que la interfaz pone (un diálogo que se abre, un error que enfoca su campo) **no** enciende el tooltip, solo el que la persona mueve; **pulsar es usar** (se va y no tapa el menú que el botón abre); **la pulsación larga pregunta, no actúa**; **nunca se lee dos veces** (`kind="auto"`).

Movimiento sobrio por decisión del usuario: el viaje usa `--g-ease-out` (sin muelle, no es un uso nuevo de `--g-ease-spring`) y con movimiento reducido **salta**.

## Uso

```vue
<!-- Nombre de un botón de solo icono, con atajo -->
<GTooltip text="Duplicar" shortcut="Ctrl D" keyshortcuts="Control+D">
  <GBtn icon variant="ghost"><GIcon name="copy" /></GBtn>
</GTooltip>

<!-- Nombre + descripción en dos tiempos -->
<GTooltip text="Marcar para revisión" detail="Avisa al responsable del expediente">
  <GBtn icon variant="ghost"><GIcon name="flag" /></GBtn>
</GTooltip>

<!-- Un control que ya tiene nombre: el texto pasa a describir (kind="auto") -->
<GTooltip text="Visible para todo el equipo"><GBtn>Publicar</GBtn></GTooltip>

<!-- Atajo para el caso más común (#390) -->
<GBtn icon variant="ghost" tooltip="Duplicar"><GIcon name="copy" /></GBtn>
```

## Entrega y empaquetado (#380)

- **`GTooltip` va en el paquete principal `@grana/vue`** (global UMD `Grana`): es pequeño, `GBtn` lo usa con `tooltip` (#390) y lo usarán `GTabs`, `GRadioGroup` y `GSidebar` (#392). El CSS va en `grana.css`.
- **Tope de peso:** el criterio de #328 (8 KB gzip). bruno mide `GTooltip` + motor interno sobre el principal; si lo supera, **vuelve a lima** antes de seguir (una entrada propia rompería el atajo de `GBtn`).

## Props (#381)

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `text` | String | texto de la aplicación | **obligatorio** | propia |
| `detail` | String | texto de la aplicación | sin valor | propia |
| `kind` | String | `auto` `label` `description` | `auto` | propia |
| `placement` | String | `top-start` `top` `top-end` `right-start` `right` `right-end` `bottom-end` `bottom` `bottom-start` `left-end` `left` `left-start` | sin valor (ver reglas) | propia (los 12 de `GHelper`) |
| `shortcut` | String | texto visible del atajo | sin valor | propia (par de `menu.md`) |
| `keyshortcuts` | String | sintaxis de `aria-keyshortcuts` («Control+D») | sin valor | propia (par de `menu.md`) |
| `disabled` | Boolean | | `false` | compartida |
| `id` | String | | generado (estable en SSR) | propia (como `GHelper`) |

### Reglas de props

- **`text`:** el nombre o la descripción, según `kind`. Una frase corta; nunca se recorta ni se abrevia (se parte en líneas). Vacío o ausente: el tooltip no se activa, no pone referencias y avisa en desarrollo.
- **`detail`:** segunda parte, **siempre descripción** (`aria-describedby` → `ID-detail`, añadido). Activa la segunda etapa (#389). Sin `detail` no hay segunda etapa.
- **`kind`:** cómo se refiere el control al texto (§«Semántica»). `auto` decide por el nombre real del control.
- **`placement`:** preferencia de lado (se voltea si no cabe, §«Posición»). **Sin valor:** `bottom` (la etiqueta cuelga del control); `right` (fin de línea; en RTL a la izquierda) si el control está en un **grupo vertical** (§«Grupo»). `left`/`right` son **lógicos**, como en `GHelper` (#101).
- **`shortcut`/`keyshortcuts`:** el texto visible (`<kbd>`, `aria-hidden`) lo escribe la aplicación tal cual («Ctrl D», «Strg D», «⌘ D»; sin traducción automática de teclas) y `keyshortcuts` va a `aria-keyshortcuts` **del control**. Uno sin el otro es válido; `shortcut` sin `keyshortcuts` avisa en desarrollo (el atajo no llegaría a la tecnología de apoyo).
- **`disabled`:** no abre; **las referencias ARIA se conservan** (apagar la pista no puede quitarle el nombre al control). Si estaba abierto, se cierra.
- **Sin props de tiempo** por instancia (un retraso distinto en cada botón rompe el grupo), sin `open`/`v-model` (es efímero y lo decide la persona) y sin slot de contenido (solo texto).

## El hijo: un control, sin elementos añadidos (#381)

- **Slot `default`: un único hijo**, el control (un elemento o un componente). `GTooltip` lo renderiza **clonado** con sus atributos fusionados y, justo detrás, su nodo `role="tooltip"`. No hay raíz propia ni envoltorio.
- **Atributos que pasa al hijo:** `aria-labelledby` o `aria-describedby` (§«Semántica»), `aria-keyshortcuts` (si hay `keyshortcuts`) y **`data-g-tooltip`** (vacío; marca para el CSS táctil de coco, §«Táctil»). `aria-describedby` se **añade** a la lista que traiga el hijo, nunca la reemplaza; en los componentes de Grana que ya fusionan un `aria-describedby` externo con los suyos (`GInput`, `GSelect`, `GSwitch`, `GCheckbox`…) llega con ellos.
- **Elemento resuelto** (donde caen escuchas y ancla): la raíz del hijo; si es un fragmento (`GBtn` con su región `g-btn__status`), su **primer elemento**; si ese elemento no es enfocable, su **primer descendiente enfocable** (el `<input>` de un campo). **Enfocable** = `button`, `a[href]`, `input`, `select`, `textarea`, `summary`, o cualquier elemento con atributo `tabindex` (también `-1`: los elementos de una barra con `tabindex` itinerante, APG, se enfocan con flechas).
- **Sin elemento enfocable** (un `GIcon` con `label`, un texto, un `GAvatar`): **no se activa en absoluto** (ni por puntero: una pista que solo ve el ratón excluye al teclado, 2.1.1), no pone referencias y avisa en desarrollo: «el tooltip va en el control».
- **Por qué no una directiva** (`v-g-tooltip`): sobre un componente cae en su raíz, que no siempre es el control (en `GInput` es la caja); no puede renderizar el nodo persistente con Vue; sin SSR sin `getSSRProps`.
- **Componentes de Grana como hijo:** los tres atributos ARIA y `data-g-tooltip` deben llegar al elemento enfocable. bruno lo verifica en `GBtn` (`button` y `a`), `GInput`, `GTextarea`, `GSelect`, `GNumberField`, `GCombobox`, `GDatePicker`, `GSwitch`, `GCheckbox` y `GHelper` (este último, tras la enmienda de #391). Un componente donde no lleguen, o donde la caja del elemento resuelto no coincida con el control visible (un `<input>` nativo oculto bajo su dibujo), **se devuelve a lima** como pendiente; no se parchea escribiendo en el DOM del otro componente.

## Semántica (#382)

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

Con `detail` (segunda etapa, #389):

```html
<div class="g-tooltip g-tooltip--detail" id="ID" role="tooltip" popover="manual" data-side="bottom">
  <span class="g-tooltip__tab" aria-hidden="true"></span>
  <span class="g-tooltip__body">
    <span class="g-tooltip__text" id="ID-name">Marcar para revisión</span>
    <span class="g-tooltip__more"><span class="g-tooltip__more-in">
      <span class="g-tooltip__detail" id="ID-detail">Avisa al responsable del expediente</span>
      <kbd class="g-tooltip__kbd" aria-hidden="true">Ctrl M</kbd>
    </span></span>
  </span>
</div>
```

1. **Un nodo por control, persistente, `popover="manual"`**, renderizado desde el montaje y cerrado (no se ve ni ocupa). El nombre y la descripción están disponibles **antes** de que se vea (el foco que llega ya los lee) y no dependen de que se abra. No `popover="hint"`: no está en los tres motores (se anota en «Fuera de v0.1»).
2. **Las referencias apuntan al texto, no a la raíz:** `ID-name` y `ID-detail`. Medido por kiwi: referenciando la raíz, el `<kbd>` `aria-hidden` se colaba en el nombre («DeshacerCtrl Z»), porque el contenido oculto referenciado entra entero en el cálculo.
3. **`kind`:**
   - `label`: `aria-labelledby="ID-name"` (gana sobre un `aria-label` existente, por la regla de ARIA).
   - `description`: `aria-describedby` += `ID-name`.
   - `auto` (por defecto): si el control **no tiene nombre** (ni texto, ni `aria-label`, ni `aria-labelledby` ajeno) o su nombre **es el mismo texto** (sin distinguir mayúsculas ni espacios) → `label`; si tiene **otro** nombre → `description`. Así nunca se lee dos veces lo mismo («Compartir, botón, Compartir»). **Antes de medir el DOM** (SSR y primer render) `auto` se comporta como `label`, para que `GBtn icon` no avise por falta de nombre; tras el montaje se corrige si hace falta y se vuelve a evaluar cuando cambian `text` o el contenido del control.
   - Con `detail`, además, `aria-describedby` += `ID-detail` en los tres casos.
4. **Atajo:** `<kbd>` visible `aria-hidden` y `aria-keyshortcuts` en el control (el mismo par que los elementos de `GMenu`).
5. **Nunca región viva y nunca `title`.** El tooltip no se anuncia al aparecer. Si el control trae `title`, aviso en desarrollo (dos pistas para lo mismo).
6. **El nodo recibe el puntero** (no `pointer-events: none`) y su texto se puede seleccionar (útil con lupa); nunca recibe foco (sin `tabindex`).

## Nodo hermano y selectores estructurales (#383; L19)

El nodo va **inmediatamente después** del elemento raíz del hijo, nunca antes: así no altera el `:first-child` del control ni de los anteriores. Cerrado no ocupa sitio ni genera hueco de `gap` (`display: none` del agente de usuario mientras no está abierto: **coco no fija `display` en `.g-tooltip` fuera de `:popover-open`**, o anularía el cierre); abierto vive en la capa superior, fuera del flujo. Pero **cuenta** para los selectores estructurales: `:last-child`, `:only-child`, `:nth-child()` de los hermanos siguientes, `:nth-last-child()`, y las combinaciones `+` y `~` que parten del control.

**Regla transversal** (`api.md`, «Nodos hermanos de `GTooltip`»): el CSS de Grana que selecciona por estructura **hijos que pone la aplicación** ignora `.g-tooltip`: `:nth-last-child(1 of :not(.g-tooltip))` en lugar de `:last-child`, y en las combinaciones adyacentes, la variante con el nodo intermedio (`A + .g-tooltip + B` junto a `A + B`) o `:has()`. Los tres motores admiten `:nth-child(… of S)`.

Revisado en el CSS de hoy (lo corrige coco, encargo 6):

| Archivo | Selector | Riesgo |
| --- | --- | --- |
| `GDialog.css` | `.g-dialog__body > :last-child` (margen final 0) | Un control con tooltip al final del cuerpo deja de ser `:last-child` |
| `GInputGroup.css` | `.g-input-group__part:is(--input, --select) + .g-input-group__part:is(…)` (líneas 124 y 406: la línea entre dos partes) | Una parte con tooltip rompe la adyacencia y desaparece la línea |
| `GInputGroup.css` | `.is-warning .g-input-group__box > :last-child` (margen del borde doble) | La última parte con tooltip deja de ser `:last-child` |

Los `:first-child` (`GDialog`, `GFormSection`, `GInputGroup`) no se ven afectados por ir el nodo detrás. Los selectores estructurales sobre piezas **internas** de un componente (`GStepper`, `GCalendar`, `GTable`…) no cambian mientras esas piezas no lleven tooltip; cuando el motor interno llegue a `GTabs`, `GRadioGroup` y `GSidebar` (#392), su pista es un nodo del propio componente y cada encargo revisa su CSS. **Límite para el consumidor** (README): sus propios selectores estructurales también ven el nodo; la receta es la misma.

## Comportamiento (#384)

### Tiempos (constantes de JS, no tokens; como `HOVER_MS` de `GMenu`, #308)

| Constante | Valor | Qué |
| --- | --- | --- |
| `OPEN` | 350 ms | Reposo del puntero antes de abrir (el de la pista de `GSidebar`) |
| `CLOSE` | 100 ms | Gracia al salir del control o del tooltip |
| `SKIP` | 600 ms | Ventana de grupo: con otro abierto o cerrado hace menos de esto, el siguiente abre **al instante y sin entrada** (el de `GSidebar`) |
| `NAV` | 1000 ms | Un foco cuenta como «por navegación» si hubo una tecla de navegación hace menos de esto y ningún puntero después |
| `DWELL` | 700 ms | Reposo (puntero quieto o foco mantenido) que abre la segunda etapa (#389) |
| `LONG` | 500 ms | Pulsación larga en táctil |
| `MOVE` | 10 px | Movimiento que cancela la pulsación larga |
| `LINGER` | 1500 ms | Mínimo visible al soltar en táctil |
| `READ_BASE`, `READ_CHAR`, `READ_MAX` | 1000 ms, 50 ms por carácter, 6000 ms | Tiempo de lectura en táctil: `min(READ_MAX, max(LINGER, READ_BASE + READ_CHAR × caracteres))` (#385) |

Teclas de navegación: Tab, flechas, Inicio, Fin, Av Pág, Re Pág, F6.

### Abrir y cerrar

| Suceso | Efecto |
| --- | --- |
| Puntero (ratón o lápiz) entra en el control | Abre a los `OPEN`; **al instante** si hay otro abierto o se cerró hace menos de `SKIP` (`data-instant`, o viaje, #388) |
| Puntero sale del control | Cierra a los `CLOSE`, salvo que entre en el tooltip (o su pestaña) |
| Puntero entra en el tooltip | Sigue abierto (1.4.13); al salir, cierra a los `CLOSE` |
| Foco **por navegación** (`:focus-visible` **y** tecla de navegación en los últimos `NAV`, sin puntero después) | Abre **al instante** |
| Foco por clic o por programa (un `GDialog` que enfoca su primer control, un `GForm` que enfoca un campo con error, una isla que devuelve el foco) | **No abre** |
| El control pierde el foco | Cierra, salvo que el puntero siga encima |
| Pulsar el control (botón principal) | **Cierra** y queda suprimido hasta que el puntero salga y vuelva («pulsar es usar») |
| Esc | Cierra **sin mover el foco**; suprimido hasta salir o perder el foco |
| Pulsar fuera | Cierra |
| Se abre otro tooltip | El anterior se cierra: **uno solo abierto en el documento** |
| El control tiene `aria-expanded="true"` | **No abre** (su menú o panel ya está abierto; si estaba abierto, cierra) |
| El control tiene `disabled` nativo | **No abre** (no recibe foco: solo el ratón vería la explicación). Aviso en desarrollo, una vez: «usa `aria-disabled` si el motivo importa» |
| El control tiene `aria-disabled="true"` | Abre con normalidad: es la forma de explicar por qué no se puede usar |
| `GTooltip disabled` | No abre; referencias conservadas |
| Desplazamiento de la página o de un contenedor | Sigue al control una vez por cuadro **sin cambiar de lado**; si el control sale del visor o de su contenedor, cierra sin mover el foco (#386) |
| Cambio de tamaño del visor | Se recoloca conservando el lado |
| Pulsación larga en táctil | §«Táctil» |

**Sin cierre por tiempo** mientras dure el puntero o el foco (1.4.13, «persistente»); el único cierre por tiempo es el de táctil. `loading` de `GBtn` no cambia nada (el tooltip nombra; el estado lo anuncia `GBtn`).

### Esc

Una escucha de documento **en captura, solo mientras hay un tooltip abierto**: cierra, pone `preventDefault()` y **no** detiene la propagación. Es la convención de Grana: un componente ignora un Esc con `defaultPrevented` (`GDialog`, `GToaster`, `GMenu`, `GSelect`). Medido por kiwi con `GDialog` real: el primer Esc cierra el tooltip y el diálogo sigue; el segundo cierra el diálogo. **`GDialog` no cambia.** Como el foco que pone el diálogo al abrirse no enciende el tooltip, no hay que pulsar Esc dos veces sin motivo.

### WCAG 1.4.13 (descartable, «hoverable», persistente)

- **Descartable:** Esc, sin mover el foco ni el puntero.
- **Hoverable:** el puntero cruza al tooltip sin que se cierre: **la pestaña es el puente** (cubre el hueco entre el control y la etiqueta en todo el ancho del control); la gracia `CLOSE` cubre el resto.
- **Persistente:** §«Abrir y cerrar».
- **Límite conocido (por diseño):** ir **en diagonal** hacia la etiqueta en una barra pasa por los vecinos, que toman el relevo. Sin «triángulo de seguridad»: retrasaría el relevo, que es lo que hace rápida la lectura de una barra, y el tooltip no tiene nada que pulsar (se alcanza en línea recta, medido).

### Escuchas

Una sola escucha de documento para todos los tooltips (teclas de navegación, Esc, pulsar fuera, puntero); las del control (puntero, foco, pulsación) son nativas sobre el elemento resuelto, no por `$attrs` (no dependen de los `emits` del hijo). Se quitan al desmontar.

## Táctil (#385; decisión del usuario 3)

En táctil no hay *hover*, y un icono sin nombre visible es justo el problema que el tooltip resuelve:

- **Pulsación larga** (`LONG`, cancelada si el dedo se mueve más de `MOVE`) muestra el tooltip **entero**, ya en la segunda etapa si hay `detail` (no hay reposo que esperar).
- **Soltar no activa el control**: el clic que sigue a la pulsación larga se cancela (la persona preguntó «qué es», no «hazlo»). Un toque normal activa y no muestra nada.
- Al soltar queda visible **el tiempo de lectura** de su texto (nombre + detalle + atajo; `READ_*`), mínimo `LINGER` y máximo `READ_MAX`; tocar en otro sitio lo cierra antes. Se puede volver a pedir con otra pulsación larga.
- El menú contextual del sistema se cancela **solo durante esa pulsación**. CSS de coco con `@media (pointer: coarse)` sobre `[data-g-tooltip]`: `-webkit-touch-callout: none` y, salvo en `input` y `textarea`, `user-select: none`.
- Con lector de pantalla en móvil no hace falta nada: nombre y descripción ya se leen al llegar al control.

## Posición (#386)

- **`placeAround` de `utils/anchor.js`**, sin utilidad nueva: el lado pedido, el opuesto y los perpendiculares; en el primero que cabe, desplazado en el eje secundario hasta quedar dentro con margen `space × 2`. Lado por defecto: §«Reglas de props».
- **Ancla:** el elemento resuelto (§«El hijo»).
- **Capa superior** (`popover="manual"`, posición fija): ningún `overflow: hidden` lo recorta (el límite que anotaba `card.md` no aplica). Por ser **hermano del control**, dentro de un `<dialog>` modal vive dentro del diálogo y no queda inerte (medido por kiwi).
- **Paneles anclados (`api.md`, #358):** regla **1** sí, en su forma estricta (el lado se decide al abrir y **no cambia mientras está abierto**, sin histéresis: se reevalúa al reabrir y al viajar; con `followFrame` y `setVar`); regla **3** sí (`anchorGone`: si el control sale del visor o de su contenedor con desplazamiento, cierra sin mover el foco). Reglas **2** (`--_max`) y **4** (lista) **no aplican**: el tooltip no tiene alto máximo ni lista. Sin hoja móvil: en un visor estrecho sigue siendo un tooltip (cabe: `space × 70` + 2 márgenes = 296px en 320px).
- Hueco entre control y etiqueta: el largo de la pestaña (constante de diseño de coco desde `space`; kiwi: `space × 1.5`). Ancho máximo de la etiqueta **`space × 70`** (280px con `space` 4); el texto se parte (`overflow-wrap: anywhere`) y **nunca se recorta**.

## Forma: la pestaña (#387; decisión del usuario 1)

- **Etiqueta** (`g-tooltip__body`): superficie **inversa** (`--g-color-text` de fondo, `--g-color-surface` de texto; #325), `--g-radius-md`, `--g-shadow-2`, borde transparente de `--g-border-width` (aparece en `forced-colors`). Nombre con el peso de acción; atajo en `<kbd>` con borde `currentColor`; detalle debajo, a ancho completo.
- **Pestaña** (`g-tooltip__tab`, `aria-hidden`): del mismo fondo que la etiqueta, une su borde con el del control y **mide lo que mide el control** en el eje del lado (ancho con `top`/`bottom`, alto con `left`/`right`); su geometría llega en `--_tooltip-ax`, `--_tooltip-ay`, `--_tooltip-aw`, `--_tooltip-ah` (px, relativos a la etiqueta; los escribe el `.vue`). Medido por kiwi: Δ 0px de ancho y Δ < 0,01px del borde del control en los tres motores.
- **Control más ancho que su etiqueta:** la etiqueta mide **al menos lo que la pestaña** (la pestaña nunca sobresale de la etiqueta), hasta el ancho máximo; con un control más ancho que `space × 70` (un botón `block`), la pestaña se acota a la etiqueta, centrada sobre el control. coco lo comprueba con un `GBtn` de texto de 120px y uno `block`.
- **Un control suelto** lleva la misma forma. No hay flecha.
- **`forced-colors`:** la pestaña es un **fondo** y desaparecería (hallazgo de kiwi): coco la mantiene visible y unida a la etiqueta con colores del sistema (p. ej. `CanvasText`/`Canvas` y su borde) y lo mide.

## El viaje y el grupo (#388; decisión del usuario 2)

**Mecanismo: relevo con continuidad, sin superficie compartida.** La etiqueta visible es **siempre el nodo `role="tooltip"` del control actual**; no hay un nodo de grupo ni copia `aria-hidden` del texto (el prototipo usaba una superficie compartida; se sustituye porque necesitaría un dueño en el DOM —un componente de grupo o escribir junto al grupo del consumidor— y fuera de su `<dialog>` modal quedaría inerte). Al viajar, en el mismo cuadro, el nodo saliente se oculta sin salida y el entrante se abre **partiendo de la geometría del saliente** (posición, ancho, pestaña) y transiciona a la suya. El texto cambia en el acto (leer no espera).

**Hay viaje** cuando se cumplen las tres:

1. el entrante abre **mientras el saliente sigue abierto** (relevo del grupo: puntero que pasa al vecino dentro de `CLOSE`, flechas en una barra, Tab al siguiente);
2. los dos controles están en el **mismo grupo**;
3. el entrante resuelve el **mismo lado** que el saliente (se le pide ese lado; si no cabe y voltea, no viaja).

Si no, aparece en su sitio (al instante si toca, `data-instant`, o con fundido).

**Qué es un grupo (L22, opción a: sin componente nuevo):** el ancestro más cercano del elemento resuelto que sea `[role="toolbar"]`, `[role="tablist"]`, `[role="radiogroup"]`, `[role="menubar"]`, `[role="group"]`, `nav` o `[role="navigation"]`; **si no hay ninguno, el elemento padre** de la raíz del hijo (las acciones de una fila o de una tarjeta, que la aplicación pone juntas en un contenedor). **Grupo vertical:** el ancestro de grupo tiene `aria-orientation="vertical"` (decide el lado por defecto, `right`). No hay `GTooltipGroup` (B lo exigiría; queda reservado).

**Movimiento:** viaje con `--g-duration-press` + **`--g-ease-out`** (`translate`, `inline-size` y la geometría de la pestaña juntos). **No es un uso de `--g-ease-spring`** (§29.1 de `tokens.md`): el usuario eligió el viaje sobrio. **Con `prefers-reduced-motion: reduce`, salta** (solo opacidad, §29.3; medido por kiwi: la transición queda en opacidad). Aparecer: fundido `--g-duration-fast`; en el grupo, sin entrada (`data-instant`). Nada se anima al montar.

## Segunda etapa: `detail` (#389; decisión del usuario 1)

- **Sin `detail`:** una sola etapa: nombre y, si hay, el atajo en la misma línea.
- **Con `detail`:** primero **solo el nombre**. Tras `DWELL` con el puntero **quieto** sobre el control o la etiqueta (cualquier `pointermove` reinicia la cuenta), o con el foco mantenido ese tiempo, la etiqueta **crece** con la **descripción y el atajo** (`data-dwell`). Recorrer sin pararse no la hace crecer (medido por kiwi).
- **Crece hacia fuera del control:** el borde junto al control no se mueve (Δ 0px medido); con `data-side="top"` el ancla es el borde inferior (`--_yb`), con `bottom` el superior. El ancho final se aplica en el acto (una sola recolocación en el eje secundario, conservando el lado) y el alto crece con `grid-template-rows` en `g-tooltip__more`, `--g-duration-press` + `--g-ease-out`. Con movimiento reducido, aparece sin crecer.
- **Al viajar**, la etapa vuelve a la primera en el acto (sin animar la altura) y la cuenta de `DWELL` empieza de nuevo en el control siguiente.
- **En táctil**, todo de una vez (§«Táctil»). **Con lector de pantalla**, el detalle se oye al llegar (está en `aria-describedby` desde el montaje): el crecimiento es solo visual.
- **El atajo pasa a la segunda etapa solo cuando hay `detail`** (lectura literal de la decisión del usuario: «crece con la descripción y el atajo»): sin descripción, la etiqueta ya es pequeña y hacer esperar el atajo no ahorra nada.

## Atajo `GBtn tooltip` (#390; decisión del usuario 4)

Nueva prop de `GBtn` (`btn.md`): **`tooltip`** (String, sin valor por defecto). Es azúcar del caso más común:

```vue
<GBtn icon variant="ghost" tooltip="Duplicar"><GIcon name="copy" /></GBtn>
<!-- equivale a -->
<GTooltip text="Duplicar"><GBtn icon variant="ghost"><GIcon name="copy" /></GBtn></GTooltip>
```

- **Equivale exactamente al envoltorio con `text` y todo lo demás por defecto** (`kind="auto"`, sin `detail`, sin atajo, lado por defecto). Para `detail`, `shortcut`, `kind` o `placement`, el envoltorio. **Solo `GBtn`** recibe esta prop en v0.1; el nombre `tooltip` queda reservado con este significado si otro componente la pide (decisión nueva).
- **Nombre accesible:** no cambia salvo por `kind="auto"`: un `GBtn icon` sin `aria-label` toma el `tooltip` como nombre (`aria-labelledby`); con `aria-label` igual al `tooltip`, un solo nombre; con `aria-label` distinto o con texto propio («Publicar»), el `tooltip` **describe**. El aviso de `GBtn icon` sin nombre no salta si hay `tooltip`.
- **Estructura:** `button` (o `a`), el nodo del tooltip y, si hay `loadingText`, `g-btn__status`, en ese orden.
- **Los dos a la vez** (`<GTooltip><GBtn tooltip>`): **gana el envoltorio** (es explícito y más rico); `GBtn` no crea el suyo y avisa en desarrollo. Solo cuenta el **hijo directo** del `GTooltip`: un `GBtn tooltip` más adentro (en el `append` de un `GInput` envuelto) conserva el suyo. bruno elige el mecanismo (inyección que solo reconoce al hijo directo) y lo prueba en ese caso.
- `disabled` de `GBtn` es nativo: el tooltip no abre y avisa (§«Abrir y cerrar»); para explicar el motivo, `aria-disabled` (#236).

## `GHelper` como hijo (#391; L21)

Hoy `GHelper` deja los atributos que recibe en su raíz `span` (`helper.md`: «los `aria-*` del botón se controlan con las props»), así que un `GTooltip` sobre él caería en el `span`. **Enmienda de `helper.md`:** `aria-labelledby`, `aria-describedby`, `aria-keyshortcuts` y `data-g-tooltip` recibidos en `$attrs` van **al botón**; el resto sigue en la raíz. Un solo mecanismo (el reenvío de atributos), sin escribir en el DOM de otro componente. Con `aria-labelledby` recibido, el aviso de `ariaLabel` ausente no salta. El tooltip no aparece con el `GHelper` abierto (`aria-expanded="true"`).

## Motor interno y clientes de Grana (#392; L17, L20)

- **`utils/tooltip.js`** (interno, no público): tiempos, grupo, foco, Esc, puente, táctil, posición, viaje y segunda etapa. Lo usan `GTooltip` y, en **encargos aparte, uno por componente, tras `GTooltip` `candidate`**, los componentes cuyo nombre ya vive en su DOM: **`GTabs`** y **`GRadioGroup`** en `labelMode="icon"` (cierran el pendiente de #113) y el **riel de `GSidebar`** (sustituye la lógica de `g-sidebar__tip`, mismos tiempos 350/600).
- En esos clientes la pista va en **modo `none`**: la misma forma A, `aria-hidden`, sin `role="tooltip"` ni referencias (regla de `sidebar.md`: el tooltip es ayuda visual y **nunca la única fuente del nombre**). `none` **no es un valor público** de `kind` en v0.1. Cada encargo enmienda su contrato (`tabs.md`, `radio-group.md`, `sidebar.md`) y revisa su CSS por #383.
- Contratos que decían «sin tooltip propio en v0.1» (`card.md`, `tabs.md`, `radio-group.md`, `icons.md`): pasan a remitir aquí (hecho en esta entrega).

## Movimiento (resumen)

| Qué | Duración y curva | Con `reduce` |
| --- | --- | --- |
| Aparecer | Fundido `--g-duration-fast` | Igual (fundido) |
| Relevo del grupo sin viaje | Sin entrada (`data-instant`) | Igual |
| Viaje | `--g-duration-press` + `--g-ease-out` (`translate`, `inline-size`, pestaña) | **Salta** (solo opacidad) |
| Segunda etapa | Alto con `grid-template-rows`, `--g-duration-press` + `--g-ease-out`; ancho en el acto | Aparece sin crecer |
| Cerrar | Fundido `--g-duration-fast` (más corto o igual que la entrada, #152) | Igual |

Transiciones, no keyframes (§29.4). Ningún uso nuevo de `--g-ease-spring` ni de `--g-ease-bounce`.

## Tokens consumidos (#393)

Existentes: `--g-color-text` (fondo de etiqueta y pestaña), `--g-color-surface` (texto, detalle y borde del `<kbd>` vía `currentColor`), `--g-radius-md` (etiqueta), `--g-radius-sm` (esquinas de la pestaña), `--g-radius-xs` (`<kbd>`), `--g-shadow-2`, `--g-space-1` (relleno, separación, hueco/pestaña, ancho máximo `× 70`, márgenes al visor `× 2`), `--g-border-width`, `--g-font-ui`, `--g-text-body-sm-{size|line}` (nombre y detalle), `--g-text-caption-{size|line}` (`<kbd>`), `--g-text-action-weight` (nombre), `--g-duration-fast`, `--g-duration-press`, `--g-ease-out`.

**Sin tokens nuevos** (`tokens.md` §36; §17.6: ningún existente se queda corto). Superficie inversa como la isla de estado (#325) y la paleta de `GCombobox`; se invierte sola en el oscuro (§15). Contraste medido por kiwi con el tema por defecto: 17,40:1 en nombre, detalle y atajo.

**No son tokens:** las constantes de tiempo (§«Tiempos»; `tokens.md` §29.6); el largo de la pestaña y el relleno de la etiqueta (constantes de diseño de coco desde `space`, en su `estilo.md`); `24px`/`44px` (§7) no aplican (el tooltip no es diana).

## Clases y datos (contrato bruno ↔ coco)

| Clase o dato | Elemento | Cuándo |
| --- | --- | --- |
| `g-tooltip` | Nodo `role="tooltip"` | Siempre |
| `g-tooltip--detail` | Nodo | Con `detail` |
| `g-tooltip__tab` | Pestaña (`aria-hidden`) | Siempre |
| `g-tooltip__body` | Etiqueta | Siempre |
| `g-tooltip__text` | Nombre (`ID-name`) | Siempre |
| `g-tooltip__kbd` | `<kbd>` `aria-hidden` | Con `shortcut` (en `__body` sin `detail`; en `__more-in` con `detail`) |
| `g-tooltip__more`, `g-tooltip__more-in` | Segunda etapa (rejilla que crece y su contenido) | Con `detail` |
| `g-tooltip__detail` | Detalle (`ID-detail`) | Con `detail` |
| `:popover-open` | Nodo | Abierto |
| `data-side` | Nodo | Abierto: lado real tras el volteo (`top` `right` `bottom` `left`, lógico) |
| `data-instant` | Nodo | Abre en el grupo sin entrada |
| `data-travel` | Nodo | Abre viajando desde el anterior |
| `data-dwell` | Nodo | Segunda etapa abierta |
| `data-touch` | Nodo | Abierto por pulsación larga |
| `--_x`, `--_y`, `--_yb` (en línea) | Nodo | Posición (px; `--_yb` desde el borde inferior del visor, para crecer hacia arriba) |
| `--_tooltip-ax`, `--_tooltip-ay`, `--_tooltip-aw`, `--_tooltip-ah` (en línea) | Nodo | Geometría de la pestaña relativa a la etiqueta (px). Si coco las registra con `@property`, con estos nombres (§29.7: `@property` es global) |
| `data-g-tooltip` | Elemento resuelto del hijo | Siempre que el tooltip esté activo (marca para el CSS táctil) |

## RTL

`left`/`right` lógicos (kiwi: `placement="left"` abre a la derecha en RTL); en un grupo vertical, el lado por defecto es el fin de línea; la pestaña y el viaje siguen a `anchor.js` (coordenadas físicas calculadas con `rtl`). El texto toma la dirección del documento; el `<kbd>` no se espeja.

## SSR

El nodo y las referencias se renderizan en el servidor (ids estables, como `GMenu`); `auto` como `label` hasta medir; ninguna escucha ni lectura de `document`/`window` fuera de `onMounted`.

## Avisos de desarrollo (`[Grana GTooltip]`, una vez por instancia y motivo)

Con `typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'`. Sin el texto del usuario en el mensaje.

1. El slot no tiene **un único hijo** (vacío, varios nodos o texto suelto).
2. El hijo **no tiene elemento enfocable** (incluido un `GIcon` con `label`): no se activa.
3. El control tiene **`disabled` nativo**: «usa `aria-disabled` si el motivo importa».
4. `text` vacío o ausente.
5. `shortcut` sin `keyshortcuts`.
6. El control trae **`title`**.
7. **`GBtn` con `tooltip` como hijo directo** de un `GTooltip`: gana el envoltorio (aviso de `GBtn`).

`placement` y `kind` fuera de su lista: validador de la prop.

## Accesibilidad y mínimos (no son tema)

- Texto **`body-sm`** (14px con el tema por defecto); el atajo en `caption` (12px, el suelo).
- Contraste ≥ 4.5:1 en nombre, detalle y atajo (inversa por construcción del tema; medir en claro, oscuro y un tema distinto).
- Foco: el tooltip nunca lo recibe ni lo mueve; el anillo del control es el del control.
- Zoom al 400 %: cabe en 320px por cálculo (`space × 70` + márgenes); verificarlo.
- `forced-colors`: borde de la etiqueta visible y pestaña visible (§«Forma»).
- Nunca se recorta ni se abrevia; sin icono propio dentro.

## Resolución de hallazgos

### r01 (`design/lab/tooltip/r01/declaracion.md`)

| # | Hallazgo | Resolución | Decisión |
| --- | --- | --- | --- |
| L1 | Componente, categoría, paquete | `GTooltip`, superposiciones, principal; tope 8 KB gzip | #380 |
| L2 | Frontera | Sin controles; el toggletip es `GHelper`; sin `GToggletip` | #380 |
| L3 | API | Envoltorio de un hijo; `text`, `detail`, `kind`, `placement`, `shortcut`, `keyshortcuts`, `disabled`, `id`; sin directiva; `GBtn tooltip` **sí** (decisión del usuario) | #381, #390 |
| L4 | Nodo | Por control, persistente, hermano **detrás**, `popover="manual"`; referencias a `ID-name`/`ID-detail` | #382, #383 |
| L5 | `kind="auto"` | Adoptado; provisional `label`; `aria-describedby` se añade | #382 |
| L6 | Atajo | Par `shortcut`/`keyshortcuts` de `menu.md` | #382 |
| L7 | Tiempos | Constantes de JS; se añaden `DWELL` y `READ_*` | #384, #389, #393 |
| L8 | Uno abierto, grupo por tiempo | Adoptado; el viaje añade grupo por estructura | #384, #388 |
| L9 | Foco por navegación | Adoptado | #384 |
| L10 | Pulsar, `aria-expanded`, `disabled`, `aria-disabled` | Adoptado | #384 |
| L11 | Esc | Captura, `preventDefault` sin detener; `GDialog` sin cambios | #384 |
| L12 | 1.4.13 | Adoptado; la pestaña es el puente | #384, #387 |
| L13 | Táctil | Adoptado; soltar no activa (decisión del usuario) | #385 |
| L14 | Posición y #358 | `placeAround`; reglas 1 (estricta) y 3; 2 y 4 no; añadido a `api.md` | #386 |
| L15 | Capa superior, hermano | Adoptado; `hint` fuera de v0.1 | #386 |
| L16 | Hijo no enfocable | No se activa en absoluto; aviso | #381 |
| L17 | Motor interno, modo `none` | Encargos aparte para `GTabs`, `GRadioGroup`, `GSidebar` | #392 |
| L18 | Tokens | Ninguno nuevo | #393 |
| L19 | Hermano y selectores estructurales | Nodo detrás; regla transversal en `api.md`; coco corrige `GDialog.css` y `GInputGroup.css` | #383 |
| L20 | Contratos «sin tooltip propio» | `card.md`, `tabs.md`, `radio-group.md`, `icons.md` remiten aquí | #392 |
| L21 | Referencias en `GHelper` | `GHelper` reenvía al botón (enmienda de `helper.md`) | #391 |

### r02 (`design/lab/tooltip/r02/declaracion.md`)

| # | Hallazgo | Resolución | Decisión |
| --- | --- | --- | --- |
| L22 | Grupo | Opción (a): ancestro con rol de grupo o `nav`; si no, el padre; sin `GTooltipGroup` | #388 |
| L23 | `detail` | Adoptado; siempre `aria-describedby` | #382, #389 |
| L24 | Superficie inversa | Adoptada; sin tokens nuevos | #387, #393 |
| L25 | Curva del viaje | `--g-ease-out` (decisión del usuario); no es un uso del muelle | #388 |
| L26 | Propiedades privadas registradas | Con el nombre del componente: `--_tooltip-ax/ay/aw/ah` | #388 |
| L27 | Tiempo de lectura en táctil | Adoptado, constantes de JS | #385 |
| L28 | Superficies compartidas visuales | **Sustituido:** sin superficie compartida; el nodo visible es siempre el semántico (relevo con continuidad) | #388 |

## Límites conocidos (para el README)

- La diagonal hacia la etiqueta pasa por los vecinos (§1.4.13).
- Los selectores estructurales de la aplicación ven el nodo hermano (#383).
- Un tooltip no sustituye la etiqueta de un campo ni su `hint`.
- Sin `popover="hint"` (soporte desigual): el cierre por Esc y por pulsar fuera lo hace el motor, no el navegador; abrir el tooltip no cierra los `popover="auto"` de otras bibliotecas ni ellos lo cierran a él.
- La caja del elemento resuelto es el ancla: en un control cuyo elemento enfocable no coincide con su dibujo, la pestaña mediría el elemento (§«El hijo»: se devuelve a lima si aparece).

## Verificación (cómo se da por hecho)

### bruno (vitest + jsdom)

Props y validadores; un hijo / varios / ninguno / no enfocable (avisos 1 y 2); referencias en `GBtn` (`button` y `a`), `GInput`, `GTextarea`, `GSelect`, `GNumberField`, `GCombobox`, `GDatePicker`, `GSwitch`, `GCheckbox` y `GHelper` (tras #391): `aria-labelledby`/`aria-describedby` añadido sin reemplazar/`aria-keyshortcuts`/`data-g-tooltip` en el elemento enfocable; `kind` (`auto` sin nombre, mismo nombre, otro nombre, provisional antes de montar, reevaluado al cambiar `text`); `detail` siempre en `describedby`; nodo detrás del hijo; `disabled` conserva referencias; SSR sin globals; desmontaje sin escuchas; `GBtn tooltip` (nombre, descripción, aviso de nombre que no salta, gana el envoltorio solo con el hijo directo, `GBtn tooltip` dentro del `append` de un `GInput` envuelto conserva el suyo); temporizadores con relojes falsos (`OPEN`, `CLOSE`, `SKIP`, `DWELL`, `LONG`, lectura).

### Playwright (Chromium, Firefox, WebKit; `design/lab/theme-playground/`, puerto propio)

La batería de kiwi trasladada al componente real (`tests/tooltip.spec.mjs`): nada a 200 ms y abierto a 500 ms; relevo del grupo < 200 ms y uno solo visible; **viaje**: barrido de ocho iconos con **una sola etiqueta visible en todo momento** (ningún cuadro sin etiqueta ni con dos), la pestaña llega al nuevo control (Δ 0px de ancho, Δ < 0,5px del borde), sin viaje entre grupos distintos ni si voltea el lado; con `reduce`, sin `translate` ni `inline-size` en la transición; segunda etapa a los 700 ms quieto, no crece con el puntero en movimiento, borde junto al control Δ 0px, se pliega al viajar; puntero que cruza a la etiqueta; Esc sin mover el foco y sin reaparecer; Tab (Opción+Tab en WebKit) y flechas abren al instante; foco por clic y por programa no; volteo; `placement` lógico en RTL; seguir al desplazar y cerrar al salir (#358, `tests/panel-estable.spec.mjs` amplía con `GTooltip`); `disabled` nativo, `aria-disabled`, `aria-expanded`; `GDialog` (foco al abrir no muestra; primer Esc cierra el tooltip, segundo el diálogo); táctil sintético (abre a 650 ms, clic bloqueado, lectura, toque normal activa y no muestra); `GHelper` envuelto; el control al final de un `GDialog` y una parte de `GInputGroup` con tooltip conservan su aspecto (#383); contraste y 14/12px; sin errores en consola.

### coco (CSS y auditoría)

Pestaña Δ frente al control en los tres motores y en RTL; control más ancho que la etiqueta y `block`; `forced-colors` (pestaña y borde visibles); claro, oscuro y un tema distinto (contraste); zoom al 400 %.

### No verificado (entorno real)

Lector de pantalla real (VoiceOver, NVDA, TalkBack) con nombre, descripción, `aria-keyshortcuts` y `detail`; táctil real; Safari real con Tab por defecto; `forced-colors` real.

## Fuera de v0.1 (reservado)

- **B «La barra habla»** (leyenda fija del grupo con marca de acento y su variante reservada en el flujo): reservada como **opción de un grupo** (`legend`), si se pide para editores densos; exigiría un componente de grupo con su API (decisión nueva).
- **`popover="hint"`** cuando esté en los tres motores.
- `tooltip` en otros componentes (el nombre queda reservado con el significado de #390).
- `kind="none"` público; props de tiempo por instancia; `open` controlado; contenido rico o slot de contenido; flecha; triángulo de seguridad; directiva `v-g-tooltip`.
- **Nunca:** `GToggletip` (es `GHelper`), `title`, tooltip en contenido no enfocable, un muelle en el viaje (decisión del usuario: sobrio).

## Encargos

### coco (Opus) · `GTooltip.css`

1. Forma A con tokens: etiqueta inversa, pestaña del ancho/alto del control unida al borde (es también el puente 1.4.13), `<kbd>`, detalle; `display` solo bajo `:popover-open` (#383).
2. Etiqueta ≥ pestaña; acotada a `space × 70`; control `block`.
3. Viaje (`data-travel`): `translate`, `inline-size` y pestaña con `--g-duration-press` + `--g-ease-out`; con `reduce`, solo opacidad. Aparecer y cerrar con fundido `--g-duration-fast`; `data-instant` sin entrada; nada al montar.
4. Segunda etapa (`data-dwell`): `grid-template-rows` 0fr → 1fr, crece hacia fuera (`--_yb` con `data-side="top"`); con `reduce`, sin crecer.
5. Táctil: `[data-g-tooltip]` con `pointer: coarse` (`-webkit-touch-callout: none`; `user-select: none` salvo `input`/`textarea`). `forced-colors`: pestaña y borde visibles.
6. **#383:** corregir `GDialog.css` (`.g-dialog__body > :last-child`) y `GInputGroup.css` (líneas 124 y 406, y `__box > :last-child` en `is-warning`) para ignorar `.g-tooltip`; repasar el resto del CSS por si algún selector estructural toca hijos de la aplicación.
7. Estilo en `design/lab/tooltip/estilo.md` con las constantes de diseño (largo de la pestaña, relleno) y las medidas; luego, auditoría sobre el componente real.

### bruno (Opus) · `GTooltip.vue`, `utils/tooltip.js`, pruebas, registro

1. Motor interno con las constantes de §«Tiempos», una escucha de documento, uno abierto, foco por navegación, Esc en captura, puente, táctil con lectura, `placeAround` + `followFrame` + `setVar` + `anchorGone`, viaje (relevo con continuidad, grupo de #388) y segunda etapa.
2. `GTooltip.vue`: clon del hijo con atributos fusionados (`aria-describedby` añadido), resolución del elemento, nodo hermano detrás, `kind`, avisos, SSR.
3. `GBtn`: prop `tooltip` (#390) y aviso de nombre que la acepta; `GBtn.meta.json`.
4. `GHelper`: reenvío de los cuatro atributos al botón (#391); prueba con `GTooltip`.
5. Registro en `src/index.js` y `components.css`; medir el peso (tope #380); `GTooltip.meta.json`; compuertas nuevas (`grep -q "g-tooltip__tab" packages/vue/dist/grana.css`).
6. Pruebas de §«Verificación»; playground con barra, riel, acciones por fila, controles sueltos con `detail`, `GDialog` y `GHelper`.
7. Lo que no llegue a su sitio en la matriz de componentes hijo: a lima, sin parche.

### mora-docs · `GTooltip/README.md` (tras la auditoría)

Desde `GTooltip.meta.json` y este contrato: cuándo `GTooltip` y cuándo `GHelper`, el atajo de `GBtn`, `kind`, `detail`, táctil, grupo y viaje, límites (#383).

### Después de `candidate` (encargos aparte, #392)

Motor interno en `GTabs` y `GRadioGroup` (`labelMode="icon"`) y en el riel de `GSidebar`, uno por componente, cada uno con su enmienda de contrato (lima) y su CSS (coco).

## Dudas para el usuario

Ninguna. La única interpretación tomada (el atajo va con el nombre cuando no hay `detail`, y pasa a la segunda etapa cuando lo hay) se anota en #389.
