# Entrega de coco · iconos públicos (paso 3)

**Archivos:** `packages/vue/src/components/GIcon/GIcon.css` (regla `flip-rtl`) y `packages/vue/src/components/GFormSection/GFormSection.css` (hueco `__lead`).
**Contratos:** `docs/contract/icons.md` v0.2 §2 (DECISIONS #197, #199), `design/contracts/form.md` §3 (#203).
**Estado:** listo para bruno (`GIcon.vue` público con `label` y `flipRtl`, slot `lead` de `GFormSection`, `createIcons`).
**Banco:** `design/lab/icons/estilo-banco.html` (desde la raíz, `python3 -m http.server 4191`): marcado exacto del contrato (§2.3 de `icons.md` y «Estructura» de `form.md`) con una fábrica que imita lo que hará bruno. Tres secciones: `GIcon` decorativo y con `label`; `flip-rtl` en LTR y RTL (y heredado, y con el giro de un hueco, y en un `GBtn`); `__lead` con y sin icono. Controles de tema (por defecto, «Tema de prueba», diez generados), oscuro, RTL y ancho. Parámetros `?dark=1`, `?rtl=1`, `?theme=<nombre>`, `?test=1`.
**Verificación:** `node design/lab/icons/estilo-verificar.mjs [--engines=chromium,firefox,webkit]`: 1855/1855 en los tres motores.

## `flip-rtl` (GIcon.css)

`.g-icon--flip-rtl:dir(rtl) { scale: -1 1; }`. Tres decisiones:

| Decisión | Por qué |
| --- | --- |
| **`:dir(rtl)`** | Dirección **efectiva** (la del antecesor), no un atributo del propio icono. Verificado: dentro de `dir="rtl"` espeja; un `dir="ltr"` local dentro de un RTL no; con `dir="rtl"` en `<html>` los hosts locales `ltr` siguen sin espejar |
| **Propiedad individual `scale`, no `transform`** | `scale` se compone con `transform` y con `rotate` en vez de pisarlos. Verificado con un hueco que gira su icono con `transform: rotate(90deg)` y con otro que usa `rotate: 90deg`: ambos conservan su giro y el espejo se aplica. Es el mismo mecanismo de `GSidebar` (chevron), `GCard` («actual»), `GTabs`, `GCalendar` y `GDatePicker` para sus espejos internos |
| **Sin `:where()`** | Especificidad (0,2,0): no se pierde frente a la regla de tamaño de un hueco (que no toca `scale`). La base `:where(.g-icon)` sigue en 0 |

- Solo mira la clase: un `check` con la clase se espeja (el contrato dice «nunca automático»; quien la pone, la quiere), y un chevron sin la clase nunca.
- Orden de composición (`translate · rotate · scale`): el espejo se aplica **antes** del giro. Un hueco que gire un chevron espejado debe compensar en RTL, como hace `GSidebar` (`rotate: -90deg` en RTL). **Pendiente para quien use `flip-rtl` dentro de un hueco que gira**: probarlo en RTL; el contrato lo dice en una frase (`icons.md` §2.5) y no se resuelve en CSS.
- Sin animación nueva (el cambio de dirección no se anima). `forced-colors`: el trazo es `currentColor` (verificado: `stroke` = color del contenedor).

## Tamaño: manda el hueco

Todas las reglas de tamaño de los componentes (`__lead` de `GCard`, `__icon` de `GMenu`/`GTabs`/`GSidebar`, `> .g-icon` de `GCard`, `GDialog`, `GDatePicker`…) son selectores descendientes con especificidad ≥ (0,1,1), así que ganan a `:where(.g-icon)` (0), también con `GIcon.css` importado el último en `components.css`. Un `grep` no encuentra ningún `:where(.g-icon)` ni `!important` fuera de la base. Fuera de un hueco, una clase de la aplicación (0,1,0) gana sin `!important`: 48px verificado. Dentro de un hueco que dimensiona el icono, el hueco gana a la clase de la aplicación (por diseño: `icons.md` §2.2).

Dos huecos **no** dimensionan el icono y lo dejan en 1em: `GBtn` (`__prepend`/`__append`: 14px en `md`, el tamaño de su texto) y `GInput` (`__prepend`/`__append`, 1em de su texto). Es coherente con el contrato («1em del texto que lo rodea»); ahí una clase de la aplicación sí cambiaría el tamaño. Nada que corregir en CSS; se anota para lima/bruno por si algún día se quiere `--_icon` en esos huecos (el pendiente de `GBtn.meta.json` sobre el token de tamaño de icono sigue abierto).

## `GFormSection__lead` (#203)

| Detalle | Cómo |
| --- | --- |
| **Referencia** | La primera línea del título. La caja del hueco mide el **interlineado** del título (`--_lead-line` = `--g-text-body-line`, 24px) y centra al icono; `align-self: flex-start` la ancla a la primera línea aunque el título ocupe varias (verificado con 4 líneas en 220px) |
| **Tamaño del icono** | `--_lead-size` = `--g-text-body-size` (el tamaño del título, 16px): `1em` del título, igual que el hueco de `GCard` fija el suyo. El icono llena un cuadrado de ese tamaño; manda sobre `1em` de `GIcon` y sobre una clase de la aplicación |
| **Alias** | `--_lead-size` y `--_lead-line` viven en `__heading` (no en el lead) porque los lee también el título que lo sigue; una variable no pasa de un hermano a otro. Sin tokens nuevos, sin literales |
| **Color** | `--g-color-text-muted`: el icono acompaña al título sin competir con él. Decorativo, pero medido: ≥ 3:1 sobre `surface` en el tema por defecto, «Tema de prueba» y los diez generados, en claro y oscuro |
| **Título largo** | `.g-form-section__lead + .g-form-section__title { max-inline-size: calc(100% - lead - gap) }`: sin él, un título cuyo ancho natural no cabe junto al icono salta a otra fila (`flex-wrap`) y deja el lead solo. Con el tope, lead y título comparten fila y el título se parte dentro. La insignia `optional` sigue el comportamiento de siempre (baja de fila si no cabe) |
| **Sin lead** | No existe el elemento ni queda aire: el título abre la fila, descripción y título siguen a sangre. Con lead el encabezado no crece (24px de alto en ambos) |
| **RTL** | Solo flex y propiedades lógicas: el lead queda a la derecha del título, separado por el `gap` del heading (8px) |
| **Mediciones (tema por defecto, 1280px)** | Hueco 16×24, icono 16×16, centro del icono = centro de la primera línea (0px de diferencia; criterio ±1px), separación 8px = `gap` del heading; 320px y 375px sin desplazamiento horizontal |

## Verificado

Chromium, Firefox y WebKit (1855 comprobaciones): flip solo en RTL (también heredado) y nunca sin la clase; composición con `transform` y con `rotate`; tamaños (1em en 14/16/24px, clase de la aplicación 48px, alias del hueco); árbol de decorativo (`aria-hidden`) y con `label` (`role="img"`); `__lead` alineado ±1px en tema por defecto claro/oscuro, «Tema de prueba» y diez generados (claro y oscuro), 320 y 375px, RTL local y global; contraste del lead; `forced-colors` en Chromium; consola limpia (sin avisos ni errores ni peticiones fallidas).

## No verificado

Lector de pantalla real sobre el icono con `label` ni sobre el encabezado con `lead` (el nombre del encabezado = solo el texto del título se comprobó por estructura: el lead es `aria-hidden` y está fuera del `hN`); Safari real; el `GIcon.vue` real (aún no existe; el banco imita su marcado).

## Para bruno

- `GIcon.vue`: emitir `g-icon--flip-rtl` con `flipRtl`; nada más cambia en el CSS. Atributos y clases tal como el §2.3 de `icons.md`.
- `GFormSection.vue`: `<span class="g-form-section__lead" aria-hidden="true">` como **primer hijo de `__heading`** y **solo con el slot `lead`** (el CSS del título con max-inline-size depende de `lead + title` adyacentes: no intercalar nada entre ambos). Sin icono por defecto.
- Un `GIcon` con `label` dentro del lead avisa en desarrollo (`icons.md` §2.4).
- `design/lab/icons/estilo-banco.html` usa la fábrica `icon()` y `section()` como referencia del marcado exacto.
