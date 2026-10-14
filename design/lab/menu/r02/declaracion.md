# GMenu · r02 · Elementos que son enlaces · declaración

**Dueño:** kiwi · **Fecha:** 2026-10-13 · **Origen:** hallazgo 12 (P2) de la integración real · **Prototipo:** `index.html` (`?c=base|A|B|C`, `&dir=rtl`), con el CSS real de `GMenu` y los tokens del tema por defecto (`packages/vue/dist/grana.css`) · **Verificación:** `node design/lab/menu/r02/verificar.mjs` (puerto 4216), **160/160** (Chromium 54, Firefox 53, WebKit 53).

Extensión de API sobre el contrato vigente (`design/contracts/menu.md`), sin tocar M1, M4, densidades ni marcas. Los puntos 1 a 14 derivan de APG, HTML, WCAG y de la regla común de enlaces (#505); **la única decisión de producto abierta es la elección entre A, B y C** (al final).

## Base funcional

### 1. Frontera

- `GMenu` sigue siendo un **botón de menú de acciones** (`role="menu"`). Un elemento con `href` es un **destino dentro de ese menú** (menú de cuenta, «Abrir ficha», «Ver documentación»), como el ejemplo «Navigation Menu Button» de APG.
- La **navegación del sitio** sigue en `GSidebar`; los hermanos de un nivel, en las puertas de `GBreadcrumbs` (que descartan `role="menu"` a propósito). Esta ronda no las sustituye ni las duplica: comparte con ellas los nombres de campo, la regla de `navigate` y el trato del deshabilitado.

### 2. Campos nuevos de `items`

| Campo | Tipo | Uso |
| --- | --- | --- |
| `href` | String | Con valor (no vacío ni solo espacios), el elemento es un enlace `<a role="menuitem" href>` |
| `target` | String | Atributo del `<a>` (`_blank`, nombre de ventana); sin valor, la misma pestaña |
| `rel` | String | Atributo del `<a>`; Grana no añade nada (con `_blank` los navegadores ya aplican `noopener`) |
| `external` | Boolean | El destino es **otro sitio**: marca «sale de aquí» y texto para lectores. Explícito: Grana no compara orígenes (sin `location` en el render, sin desajuste en SSR) |
| `current` | Boolean | Es la **página actual**: `aria-current="page"` |

- Solo en `type: 'item'` **sin** `items` (no padre de submenú). En `checkbox`, `radio`, `group`, `separator` o un padre de submenú, `href` se ignora y **avisa** una vez en desarrollo (un padre que también navega sería un botón dividido: fuera de alcance).
- `id` sigue siendo obligatorio (clave, payload y pruebas), igual que en cualquier `item`.
- `download`, `hreflang` y `referrerpolicy`: **reservados** (no hay caso en la integración).

### 3. Anatomía y ARIA

```html
<li role="none">
  <a class="g-menu__item" role="menuitem" href="https://example.org/docs" target="_blank" tabindex="-1" id="ID-i-4">
    <span class="g-menu__icon" aria-hidden="true">…</span>
    <span class="g-menu__label">Documentación</span>
    <span class="g-menu__sr">, otro sitio, abre en una pestaña nueva</span>   <!-- texto oculto accesible -->
    <span class="g-menu__leave" aria-hidden="true">(GIcon external-link)</span>
  </a>
</li>
<li role="none"><a class="g-menu__item" role="menuitem" href="/perfil" aria-current="page" tabindex="0">…Mi perfil</a></li>
<li role="none"><a class="g-menu__item" role="menuitem" aria-disabled="true" tabindex="-1">…Facturación</a></li>  <!-- sin href -->
```

- El resto del elemento (icono, etiqueta, atajo, peligroso, slots `icon` e `item`) es idéntico al de un `<button>`; el slot `item` pinta dentro del `<a>`.
- Sin slot `link` ni `RouterLink` dentro del menú: el router entra por `navigate` (punto 6). Por eso **no aplica la excepción #523**.

### 4. Teclado

| Tecla (foco en un enlace) | Qué hace | Origen |
| --- | --- | --- |
| Intro | Activación del navegador sobre el `<a>` → punto 6 (emite `navigate`, cierra, foco al disparador) | HTML |
| **Espacio** | El `<a>` no se activa con Espacio y desplazaría la página: **`GMenu` lo cancela y lo trata como Intro sin modificadores**, para que todo elemento del menú responda igual | APG (coherencia con los `<button>` del menú) |
| Ctrl/⌘+Intro, Mayús+Intro | Lo del navegador (pestaña en segundo plano, ventana nueva); **sin `navigate`** | HTML, #505 |
| Espacio con modificadores | Nada (sin equivalente en el navegador) | — |
| Menú contextual, Mayús+F10 | Menú contextual **de enlace** del navegador (abrir en pestaña, copiar enlace). `GMenu` no lo intercepta y sigue abierto | Navegador |
| ↑ ↓ Inicio Fin, letra, Esc, Tab, → ← | Sin cambios (la letra busca en la etiqueta, no en el texto oculto) | `menu.md` |

### 5. Puntero y toque

| Gesto | Navegador | `navigate` | Menú |
| --- | --- | --- | --- |
| Clic primario sin modificadores | Sigue el `href` (o el router lo cancela) | **Sí** | Cierra, foco al disparador |
| Ctrl/⌘+clic | Pestaña en segundo plano | No | **Concepto**: cierra (A, B) o sigue abierto (C) |
| Clic central (`auxclick`) | Pestaña en segundo plano | No | Como Ctrl/⌘+clic |
| Mayús+clic | Ventana nueva (toma el foco) | No | Cierra, foco al disparador |
| Alt+clic | Descarga (algunos navegadores) | No | Cierra, foco al disparador |
| Clic derecho (o Ctrl+clic en macOS) | Menú contextual de enlace | No | Sigue abierto |
| Toque | Como clic primario | Sí | Cierra |
| Toque largo | Vista previa / menú de enlace del sistema (iOS, Android) | No | Sigue abierto; **coco no debe anular `-webkit-touch-callout`** |
| Arrastrar | El enlace se puede soltar en la barra de pestañas | No | Sin cambios |
| Puntero encima (M1) | — | No | El puntero mueve el foco como en cualquier elemento; no se posa en un deshabilitado |

### 6. `navigate` y su relación con `select`

- Un enlace **emite `navigate`**, nunca `select`: un gesto, una intención. `select` queda para acciones, casillas y opciones. Payload `{ id, item, event }` (como `select` y como `GSidebar`, `{ item, event }` + `id`).
- **Regla común #505** sin excepciones: solo con clic primario (`button === 0`) sin Ctrl, ⌘, Mayús ni Alt y con `event.defaultPrevented` falso, o con Intro/Espacio sin modificadores. `event.preventDefault()` (síncrono) deja la navegación al router.
- **Con `target` distinto de `_self` no se emite** (como `RouterLink`): un destino en otra pestaña no pasa por el router; si se emitiera, el manejador típico `event.preventDefault(); router.push(item.href)` rompería la pestaña nueva. Es una **enmienda propuesta a #505** (hallazgo L2).
- **Diferencia con `select`:** en `select`, `preventDefault()` impide el cierre; en `navigate` significa «lo navego yo» y **no** impide el cierre (la aplicación cierra el menú en cualquier caso; si quiere dejarlo abierto, `closeOnSelect="never"`).
- `closeOnSelect`: un enlace cuenta como `item` (`auto` y `always` cierran; `never` no).

### 7. Cierre y foco

- Activación sin modificadores (navegue el navegador o el router): **cierra y devuelve el foco al disparador** (APG). Si la ruta nueva desmonta el disparador, el foco es de la gestión de rutas de la aplicación (README).
- Con modificadores: según el concepto elegido (A y B cierran como los menús nativos; C sigue abierto).
- Menú contextual del navegador y toque largo: el menú sigue abierto; cerrarlo es Esc, Tab o un clic fuera, como hoy.

### 8. Enlace que sale de aquí

- Marca **«sale de aquí»** al final del elemento (columna del atajo), icono de Lucide decorativo, en `text-muted` (medido ≥ 3:1). Se pinta si `external` **o** `target` abre otra pestaña. Glifo recomendado: **`external-link`**; el prototipo usa `globe` porque `external-link` no está en la lista de la librería ni en la del laboratorio (hallazgo L4).
- Para lectores, **texto oculto** dentro del enlace, de la aplicación: `labels.external` («otro sitio») y/o `labels.newTab` («abre en una pestaña nueva»; WCAG 3.2.5, técnica G201). Sin el texto necesario, aviso de desarrollo.
- Sin subrayado: en un menú todo es activable; lo que el usuario necesita distinguir no es «enlace o acción» sino **«me saca de aquí o no»**.

### 9. Página actual

- `current: true` → `aria-current="page"` en el `<a>`. Como mucho **uno** por menú (si hay más, se marca el primero y avisa).
- Se ve con una **barra al inicio** en `--g-color-accent-text` (la misma idea que la barra activa de `GSidebar`, #228; medida ≥ 3:1) **y peso** de acción: nunca solo color (1.4.1). En `forced-colors`, `CanvasText`.
- Sigue siendo un enlace activable (copiar, pestaña nueva, recargar): qué hace la aplicación al «navegar» a la página actual es suyo.
- **Rama:** el padre de un submenú que contiene la página actual lleva peso (clase nueva, como `is-branch` de `GSidebar`), sin `aria-current`.
- No cambia dónde se abre el menú: el foco sigue empezando en el primero (APG); el resaltado M1 sigue al foco.

### 10. Enlace deshabilitado

- `<a role="menuitem" aria-disabled="true">` **sin `href`**: no se abre en otra pestaña, no se copia, el clic central y el menú contextual no ofrecen el enlace.
- **Sigue enfocable** con flechas (regla de `GMenu`, distinta de `GSidebar`, que lo saca del orden de Tab: dentro de un compuesto los deshabilitados se descubren). Atenuado y tachado como hoy; Intro y Espacio no hacen nada y el menú sigue abierto; el puntero no se posa (M1).

### 11. Enlaces y acciones mezclados

- Mismo aspecto, mismo resaltado único, misma búsqueda por letra, mismo *roving tabindex*. Solo cambian el elemento (`<a>` o `<button>`), el evento (`navigate` o `select`) y lo que el navegador ofrece.
- Recomendación de uso (README): acciones arriba o abajo agrupadas con separadores; las salidas a otro sitio juntas.

### 12. Lo que no cambia

M1 (luz que viaja, el puntero mueve el foco), M4 (diagonal hacia el submenú), densidades, `align`/`side`, paneles anclados estables (#358), disparador con `id` propio (#308), sin anuncios propios en la base.

### 13. Movimiento reducido y colores forzados

Nada nuevo se desplaza en la base. Pie de B: solo fundido de su texto (`--g-duration-fast`), que se queda con `reduce`. Huellas de C: fundido. En `forced-colors`: barra en `CanvasText`, pie con borde `CanvasText`.

### 14. Peso

Cambio pequeño en un componente del principal (un `<a>` alternativo, la guarda, Espacio, texto oculto). Con el margen de #506 agotado, bruno mide el crecimiento; B añade un `li` y una función de URL; C, dos textos y un anuncio.

## Conceptos

### A · Enlace llano

La base tal cual: los enlaces parecen acciones; solo se marcan **lo que sale de aquí** y **la página actual**. Ctrl/⌘+clic y clic central cierran el menú, como los menús nativos (marcadores de Chrome y Firefox por defecto).

### B · Pie de destino (recomendado)

A + una **franja al pie de la lista** que dice adónde lleva el elemento activo: dominio en tinta (`text`), ruta atenuada (`text-muted`), y «Pestaña nueva» u «Otro sitio», sobre `surface-sunken`, pegada abajo (`sticky`).

- **Solo existe en un menú que tiene algo que sale de la aplicación** (`external` o `target` de otra pestaña); el menú de una fila con enlaces internos no la lleva. Sin prop.
- Sigue al **mismo activo que M1** (puntero o teclado); con una acción o un deshabilitado se calla (texto transparente) **sin cambiar el alto** de la lista (medido: 0 px).
- Es un `li role="none" aria-hidden="true"`, como el resaltado de M1: fuera del árbol accesible (el lector ya oye «otro sitio, abre en una pestaña nueva» en el nombre).
- La URL se lee en LTR también en RTL (`direction: ltr` aislado; medido).
- **Por qué sirve:** la barra de estado del navegador, que es quien dice adónde lleva un enlace, **no existe** en una PWA instalada, en pantalla completa ni en muchos móviles, y con el foco de teclado no todos los navegadores la muestran. En un menú de cuenta es justo donde aparecen salidas a terceros (documentación, facturación de un proveedor, estado del servicio): ver el dominio antes de salir es confianza y protección frente a suplantación. Llevar el destino dentro del menú no es el patrón habitual de los frameworks.

### C · Varias pestañas

A + tres gestos de experto:

- **Ctrl/⌘+clic y clic central no cierran**: el menú sigue abierto y el elemento muestra la huella **«Abierta»** (`labels.opened`, en la columna del atajo) con un anuncio cortés (`labels.openedLive`). Una pestaña en segundo plano no da ninguna señal en la página actual; la huella dice que funcionó y deja abrir otra sin reabrir el menú.
- **Con Ctrl/⌘ pulsado** (teclado o puntero sobre la lista), lo que no puede abrirse aparte (acciones, casillas, deshabilitados) pasa a `text-subtle` (medido ≥ 4.5:1): se ve qué responde al gesto antes de hacerlo.
- **Ctrl/⌘+C** sobre un enlace enfocado copia su URL absoluta, con huella **«Enlace copiado»** y anuncio. Sin controles anidados en el elemento (prohibidos en `menuitem`).
- **Coste:** se aparta de los menús nativos (que cierran), necesita cuatro textos nuevos y un canal de anuncio (hoy la base no anuncia), y Ctrl/⌘+C no se descubre solo (README, o el pie de B si se eligen juntos).

## Qué lo hace distinto

1. **El destino se ve dentro del menú (B).** Grana no confía en la barra de estado del navegador, que falta justo donde Grana se usa (PWA instaladas, pantalla completa, móvil): la franja de destino sigue a la misma luz de M1 y solo aparece cuando hay algo que sale de la aplicación. Sirve a la decisión del usuario («¿me voy a otro sitio?»), no adorna, y no añade ningún nodo accesible.
2. **Lo que se marca es «me saca de aquí», no «soy un enlace».** En lugar de subrayar enlaces dentro de un menú (ruido: todo es activable), una sola marca para lo que abre otra pestaña u otro sitio, y una barra de «estás aquí» compartida con `GSidebar`.
3. **Espacio también abre un enlace del menú**, y los gestos del navegador (pestaña, ventana, menú contextual, toque largo, arrastrar) quedan intactos: el enlace es de verdad, no un botón que finge.
4. (Si se elige C) **un menú que deja abrir varias pestañas** con prueba visible de que cada una se abrió, y que enseña con Ctrl/⌘ pulsado qué responde al gesto.

## Comparativa

| | A · Enlace llano | B · Pie de destino | C · Varias pestañas |
| --- | --- | --- | --- |
| Qué añade | Base | + destino visible del activo | + no cierra con Ctrl/⌘/central, huellas, vista previa del modificador, Ctrl/⌘+C |
| A quién sirve | A todos, como un menú nativo | A quien no tiene barra de estado y a quien quiere ver el dominio antes de salir | A quien abre varios destinos seguidos |
| Cuándo se ve | Siempre que hay `href` | Solo si algo sale de la aplicación | Siempre (comportamiento) |
| API nueva | `href`, `target`, `rel`, `external`, `current`, `labels.external`, `labels.newTab` | Ninguna más | `labels.opened`, `labels.openedLive`, `labels.copied`, `labels.copiedLive` |
| Accesibilidad | Nombre con texto oculto | Igual (pie oculto a lectores) | + anuncios corteses; huellas también para quien ve |
| Riesgo | Ninguno nuevo | Ruido si la URL es opaca (identificadores largos: se recorta con elipsis) | Sorprende a quien espera que cierre; atajo poco descubrible |
| Combinable | — | Con C | Con B |

## Criterios

| Criterio | Cómo se cumple |
| --- | --- |
| APG Menu Button / Menu | `<a role="menuitem">` dentro de `role="menu"`, *roving tabindex*, Esc, Tab, flechas sin cambios |
| WCAG 2.4.4 propósito del enlace | La etiqueta + «otro sitio» / «abre en una pestaña nueva» en el nombre |
| WCAG 3.2.5 cambio a petición (G201) | Aviso de pestaña nueva visible (marca) y en el nombre |
| WCAG 1.4.1 uso del color | Página actual: barra + peso; deshabilitado: tachado; acciones apartadas en C: además el icono no cambia de forma, y el pie dice el destino en texto |
| WCAG 1.4.3 / 1.4.11 contraste | Medido: texto del pie ≥ 4.5:1, marca y barra ≥ 3:1, acción apartada ≥ 4.5:1 (tema por defecto) |
| WCAG 2.5.8 tamaño del objetivo | Sin cambio (alto del elemento de `GMenu`, 24/44 px) |
| WCAG 4.1.2 | `aria-current`, `aria-disabled`, rol y nombre medidos con el árbol de accesibilidad de Playwright |
| #505 | `navigate` solo con activación primaria sin modificadores; probado Ctrl/⌘, Mayús, central, derecho |

## Verificación (`verificar.mjs`, 160/160)

Base (cada motor): anatomía (seis `<a role="menuitem">`, deshabilitado sin `href` con `tabindex="-1"`, un `aria-current`, acciones y casilla siguen en `<button>`); nombres accesibles con el texto oculto; Intro → `navigate`, cierre y foco al disparador, URL intacta con router simulado y seguida sin él; Espacio → `navigate` sin desplazar; deshabilitado alcanzable, inerte y sin cerrar; M1 (el puntero mueve el foco, no se posa en el deshabilitado); Ctrl/⌘+clic, Mayús+clic, clic central y `target="_blank"` sin `navigate`; clic derecho sin `navigate` y con el menú abierto; casilla sin cerrar; contraste de barra y marca; sin desborde a 375 px; RTL (barra al inicio lógico, URL del pie en LTR). B: pie solo en el menú que sale, `aria-hidden`, contenido por caso (interno, externo en pestaña nueva, externo misma pestaña, acción callada), sigue al teclado, alto constante, pegado abajo, contraste y ≥ 12 px. C: sigue abierto con Ctrl/⌘+clic y central, huellas, anuncio, Ctrl/⌘+C con la URL absoluta, vista previa del modificador y su contraste, huellas borradas al cerrar.

**No verificado:**

- Lectores de pantalla reales: cómo leen VoiceOver y NVDA un `<a role="menuitem">` con `aria-current`, y si VoiceOver ofrece sus acciones de enlace sobre un `menuitem` (entorno real).
- Toque largo real en iOS y Android dentro de un `popover` (vista previa del enlace).
- Que Firefox y WebKit **abran** la pestaña con un clic modificado: en headless solo Chromium lo hace con un clic sintético; en los otros dos se comprueba que no hay `navigate` y el estado del menú.
- La escritura real del portapapeles en C (el prototipo registra la URL; `navigator.clipboard` depende de permisos y del contexto seguro).
- Safari con ⌘+Intro en un enlace enfocado.
- El componente real: todo esto es un prototipo de comportamiento sobre el CSS real.

## Hallazgos para lima

| # | Hallazgo | Propuesta |
| --- | --- | --- |
| L1 | Contrato del enlace en `menu.md` | Campos `href`, `target`, `rel`, `external`, `current` (punto 2); `navigate` `{ id, item, event }`; `select` no se emite en enlaces; `preventDefault` en `navigate` no impide el cierre; `closeOnSelect` trata el enlace como `item` |
| L2 | `target` en la regla común | **Enmienda a #505** (`api.md` «Enlaces y `navigate`»): con `target` distinto de `_self` no se emite `navigate` (como `RouterLink`). Afecta también a `GTag`/`GCard`, que reciben `target` por atributos: hoy un manejador con `router.push` rompería su pestaña nueva |
| L3 | Textos | `labels.external` y `labels.newTab` (sin valor por defecto; aviso si falta el que hace falta). Si se elige C: `labels.opened`, `labels.openedLive`, `labels.copied`, `labels.copiedLive` |
| L4 | Glifo | `external-link` (Lucide) no está en la lista de la librería (`GLibIcon`) ni en `design/lab/lucide-icons.js`: bruno lo añade. Decidir si una sola marca para «otro sitio» y «pestaña nueva» (propuesta) o dos (`globe` + `external-link`) |
| L5 | Página actual | `aria-current="page"`, como mucho uno (aviso); barra con `--g-color-accent-text` + peso (sin tokens nuevos); clase de rama para el padre de submenú (nombre: lima, p. ej. `is-branch` como `GSidebar`) |
| L6 | Combinaciones ignoradas | `href` en `checkbox`, `radio`, `group`, `separator` o padre de submenú: se ignora y avisa; `href` vacío o solo espacios = ausente (como `tag.md`) |
| L7 | CSS (coco) | `a.g-menu__item`: sin subrayado y color heredado también en `:visited`; no anular `-webkit-touch-callout` ni `user-drag`; clases nuevas `g-menu__leave` y `g-menu__sr` (texto oculto); B: `g-menu__dest` y partes; C: `g-menu__trace` |
| L8 | Nombre con texto oculto | Chromium une las piezas con un espacio («Documentación , otro sitio»), igual que `g-sidebar__sr`: es una pausa, no un error; se prefiere al `aria-describedby`, que los lectores no siempre leen en un `menuitem` |
| L9 | Espacio (bruno) | Cancelar Espacio en un `<a>` del menú y activarlo como Intro sin modificadores (`el.click()` sintético pasa por la guarda) |
| L10 | Sin slot `link` | El router entra por `navigate`; un slot `link` con `RouterLink` (y la excepción #523) queda **reservado** |
| L11 | Reservados | `download`, `hreflang`, `referrerpolicy`; abrir el menú en la página actual |
| L12 | Peso | `GMenu` está en el principal y el margen de #506 está agotado: bruno mide; B y C se valoran con su peso medido |

## Pregunta para el usuario

**¿Qué forma adopta `GMenu` para los elementos-enlace?**

- **A · Enlace llano:** solo la base (marca «sale de aquí» y barra de página actual); con modificadores cierra como un menú nativo.
- **B · Pie de destino** (recomendada): A + la franja que dice adónde lleva el elemento activo, solo en los menús con salidas fuera de la aplicación.
- **C · Varias pestañas:** A + Ctrl/⌘/central sin cerrar con huella «Abierta», vista previa con Ctrl/⌘ pulsado y Ctrl/⌘+C para copiar el enlace.
- **B + C.**
