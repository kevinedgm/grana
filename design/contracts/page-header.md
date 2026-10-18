# Contrato · GPageHeader (encabezado de página)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #626 a #634, 2026-10-13; cambios en archivos compartidos aplicados en `api.md` «Paquete, entradas y tipos», «Entradas propias que no son servicios», «Convivencia de servicios» y «Cabecera fija de la aplicación», `tokens.md` §45 y `status.md` «`utils/edgeReserve.js` generalizado») · **Basado en:** `design/lab/page-header/r01/` (kiwi: `brief.md`, `declaracion.md` con 24 decisiones de base, hallazgos L1 a L16 y Z1 a Z4, `index.html`, `ph.js`, `ph.css`, `verificar.mjs` 258/258 en Chromium, Firefox y WebKit, puerto 4215; la forma elegida se ve en `index.html?c=B&final=C`)
**Tag:** `g-page-header` · **Categoría:** estructura de página · **Paquete:** entrada propia **`@grana/vue/page-header`** (global UMD `GranaPageHeader`; #633) · **Origen:** hallazgo 9 (P2) de la integración real en NisaNabani (`nsa-encabezado`)

**Componente complejo** (compone `GBreadcrumbs`, `GTabs`, `GBtn`/`GMenu` y `GMetric` por slots; se posiciona sobre otros elementos: pegado y muelle fijo; convive con `edgeReserve`): **coco y bruno en Opus** (regla de `CLAUDE.md`).

Abre una página de la aplicación: **dónde estoy** (ruta), **qué es** (`h1`, antetítulo, descripción, estado), **qué puedo hacer** (acciones), **cómo va** (contenido: métricas) y **qué secciones tiene** (pestañas). Al desplazarse por una página larga **no se pierden** las pestañas ni las acciones.

**Forma (decisión del usuario del 2026-10-13, #626): B · Zócalo, con el muelle de C solo en estrecho.**
- **B · Zócalo:** las pestañas y las acciones viven en la **última fila** del encabezado (el zócalo), también en reposo. Al desplazar, el encabezado **entero se hunde** bajo el borde (`position: sticky` con `top` negativo) hasta que solo asoma el zócalo, y ahí se queda. No encoge, no se copia, no se muda nada. Al pasar el `h1`, aparece al principio del zócalo un **título compacto** (copia visual oculta al lector), ligado al desplazamiento.
- **Muelle de C en estrecho:** cuando el encabezado es estrecho (teléfono, columna estrecha) y está pegado, el zócalo se queda con **las pestañas a todo el ancho** y **las mismas acciones bajan al muelle**, una barra de borde a borde en la zona del pulgar, con un enlace al `h1`. Al volver arriba, regresan al zócalo.
- **A · Relevo** y **C · Muelle** como formas completas **no se contratan** (reservadas, «Fuera de v1»).

---

## Principios

1. **Nada se duplica en el árbol.** Ni el `h1` (el título compacto es `aria-hidden`; el del muelle es un **enlace** al `h1`, no un encabezado) ni las acciones (en escritorio no se mueven; en estrecho se mudan **los mismos nodos**, con su estado).
2. **Δ0: la página no se mueve.** Pegarse, hundirse, abrir el muelle y volver no cambian la posición del contenido que sigue al encabezado. El zócalo tiene alto fijo (§«Geometría pública»): mudar las acciones no cambia su alto.
3. **Lo que tiene el foco no se muda** (ni lo que tiene un panel anclado abierto).
4. **Lo pegado nunca ocupa más de un cuarto del alto visible** (WCAG 1.4.10 con zoom de 200–400 % o un teléfono apaisado).
5. **La cabecera fija es de la aplicación** y se cuenta una sola vez (#515): el encabezado lee su alto de una entrada pública y la aplicación pone una receta de una variable.
6. **Un cliente más de los bordes compartidos** (`edgeReserve`, #322): la isla y los avisos saben dónde está el zócalo pegado y el muelle.
7. **No navega, no pide datos, no mueve el foco por su cuenta.** Ofrece `focus()` para que la aplicación lleve el foco al `h1` al cambiar de ruta.

## Cuándo usarlo (fronteras; L14)

| Necesito | Uso | No |
| --- | --- | --- |
| Abrir una página o vista con su `h1` | **`GPageHeader`** | `GCard` (resume **una entidad entre otras**: `h2`–`h6`, enlace estirado, superficie elevada) |
| La barra de la aplicación (marca, buscador, cuenta) | La de la aplicación (`banner`) | `GPageHeader` (va **dentro de `main`**, sin `banner`) |
| Superficie o profundidad | `GSurface` | `GPageHeader` no compone `GSurface` ni tiene `level`/`elevation` |
| La ruta | `GBreadcrumbs` en el slot `trail` | Una prop `items`/`breadcrumbs` (no existe) |
| Acciones | `GBtn`, `GMenu` en el slot `actions` | Acciones como datos (no existe en v1) |
| Secciones de la página | `GTabs detached` en el slot `tabs` + `GTabPanel` en el cuerpo (#118) | `GTabs` con paneles integrados dentro del encabezado (aviso 9) |
| Encabezado de un panel o de un `GDialog` a pantalla completa | `GPageHeader` con `headingLevel` 2 o 3 | — |
| La banda de marca | La zona de marca en la **raíz** (§«Zona de marca») | Un `GSurface` envolvente (rompe el pegado) |

**Vocabulario común con `GCard`** (`eyebrow`, `title`, `description`, `meta`, `actions`, `headingLevel`, `labels` sin valores): mismos nombres para no inventar sinónimos; ningún código común.

## Uso

```vue
<main id="main" tabindex="-1">
  <GPageHeader
    ref="header"
    title="Muestra M-0007"
    eyebrow="Hematología · Ambulatorio"
    description="Hemograma completo. Recibida el 12 de octubre de 2026 a las 08:14."
    :labels="{ actions: 'Acciones de la página' }"
  >
    <template #trail><GBreadcrumbs :items="ruta" label="Ruta de navegación" /></template>
    <template #meta><GBadge color="info">En análisis</GBadge></template>
    <template #actions="{ narrow, docked }">
      <GBtn v-if="!narrow" variant="outline" color="neutral">Editar</GBtn>
      <!-- La principal: SIEMPRE el mismo GBtn. Con narrow && !docked, su forma de solo icono
           (icon + nombre accesible + tooltip) cambiando props; nunca un v-if entre dos botones -->
      <GBtn v-bind="principal(narrow && !docked)">Validar resultados</GBtn>
      <GMenu :items="masAcciones" label="Más acciones" />
    </template>
    <GMetric label="Analitos" :value="18" size="sm" />
    <template #tabs>
      <GTabs id="muestra" v-model="seccion" :items="secciones" detached label="Secciones de la muestra" />
    </template>
  </GPageHeader>
  <GTabPanel tabs="muestra" value="resumen" :active="seccion === 'resumen'">…</GTabPanel>
</main>
```

Receta de la aplicación (§«Geometría pública»):

```css
:root {
  --app-header: 56px;                                   /* la barra fija de la aplicación */
  --g-page-header-top: var(--app-header);
  scroll-padding-block-start: calc(var(--app-header) + max(var(--g-space-12), 44px));
}
```

El ejemplo del slot `actions` es ilustrativo: `principal()` es de la aplicación y la forma exacta de un `GBtn` de solo icono con nombre la documenta mora-docs con lo que bruno construya.

## Anatomía (forma elegida)

```
main                                                    ← de la aplicación; el encabezado es su PRIMER hijo y su hijo directo
└─ header.g-page-header                                  ← sin role, sin aria-label (dentro de main no es banner)
   ├─ [slot trail]           <GBreadcrumbs>              ← nav[aria-label]: el único landmark del encabezado
   ├─ div.g-page-header__head
   │  └─ div.g-page-header__titles
   │     ├─ p.g-page-header__eyebrow                     (prop eyebrow o slot)
   │     ├─ hN.g-page-header__title#{id}-title tabindex="-1" dir="auto"     ← h1 por defecto
   │     ├─ p.g-page-header__desc                        (prop description o slot)
   │     └─ div.g-page-header__meta   [slot meta]
   ├─ div.g-page-header__content      [slot default]     (GMetric, GAdaptiveLayout…)
   ├─ div.g-page-header__base         («zócalo»; solo si hay tabs o actions)
   │  ├─ span.g-page-header__base-title aria-hidden="true" dir="auto"     (título compacto; copia visual de `title`)
   │  ├─ div.g-page-header__tabs      [slot tabs]        (GTabs detached)
   │  └─ div.g-page-header__actions-home
   │     └─ div.g-page-header__actions role="group" aria-label="{labels.actions}"   [slot actions]
   └─ div.g-page-header__dock         (solo en estrecho y pegado; si no, hidden + inert; sin role)
      ├─ a.g-page-header__dock-title href="#{id}-title" dir="auto"        (texto: `title`)
      └─ div.g-page-header__dock-host  ← destino de la mudanza de .g-page-header__actions
```

- **Orden del DOM = orden de lectura = orden de Tab** (WCAG 1.3.2, 2.4.3): ruta → antetítulo → `h1` → descripción → `meta` → contenido → pestañas → acciones. Ni `order` ni `grid-area` que reordenen. Las acciones van **después** de las pestañas porque viven en el zócalo, que es la última fila (medido por kiwi en B).
- **El muelle está en el DOM justo después del zócalo** (último hijo de la raíz): mudadas, las acciones siguen después de las pestañas y antes del cuerpo de la página. **Corrige el prototipo**, que tenía el muelle antes del contenido (correcto para C, donde las acciones vivían en la cabecera; en B su hogar es el zócalo).
- Sin zócalo (ni `tabs` ni `actions`): no se pinta `__base` ni `__dock`, y el encabezado **no se pega** (no hay nada que dejar a la vista).

## Props (#627)

| Prop | Tipo | Valores | Default | Nota |
| --- | --- | --- | --- | --- |
| `title` | String | texto | — (**obligatoria**) | Texto del encabezado, del título compacto y del enlace del muelle. Sin ella, aviso 1. El slot `title` sustituye el contenido del `hN`, nunca el texto de las copias |
| `headingLevel` | Number | `1` `2` `3` | `1` | Como `GCard` (nombre compartido). 2 o 3 para un encabezado dentro de una vista anidada (panel de detalle, `GDialog` a pantalla completa). Fuera de lista: aviso 3 y se usa `1` |
| `eyebrow` | String | texto | sin valor | Antetítulo, antes del `hN` (como `GCard`) |
| `description` | String | texto | sin valor | Párrafo bajo el título |
| `sticky` | Boolean | | **`true`** | Pegado de serie **cuando hay zócalo** (#628, revisable). `false`: el encabezado se va con la página, sin muelle; las acciones se quedan en el zócalo |
| `zone` | String | `none` `brand` | `none` | Zona de marca (`api.md` §«Zona de marca», `surface.md`, `tokens.md` §44): `brand` pone `data-g-zone="brand"` **en la raíz** (Z2). Nombre y valores compartidos (`inverse` reservado, como en `GSurface`). Fuera de lista: aviso 10 y `none` |
| `labels` | Object | `{ actions }` | `{}` (**sin valores por defecto**, #226) | `actions`: nombre del grupo de acciones. Obligatorio si hay acciones (aviso 4) |
| `id` | String | | generado (SSR-seguro) | Base de ids: `{id}-title` (el `hN`, destino del enlace del muelle) |

**No existen** (y por qué): `actions` como datos (las acciones de la aplicación ya tienen estado propio: carga, menú abierto, `tooltip`); `items`/`breadcrumbs` (la ruta es `GBreadcrumbs` en `trail`); `size`, `level`, `elevation` (no es superficie); `tone` (la zona se llama `zone`, como en `GSurface`); `stickyOffset` (la distancia es CSS, `--g-page-header-top`, #484); `labels.up` (era de A, no elegido).

### Reglas de props

- `title` vacío o solo espacios cuenta como ausente (aviso 1); el `hN` se pinta igualmente (con el slot, si lo hay).
- Cambiar `headingLevel` en vivo cambia la etiqueta; el `id` del título se conserva.
- `sticky` en vivo: al pasar a `false` con el muelle abierto, las acciones vuelven al zócalo (con la regla del foco) y se retiran las reservas de borde.

## Slots

| Slot | Ámbito | Qué va | Regla |
| --- | --- | --- | --- |
| `trail` | — | `GBreadcrumbs` | Primer hijo de la raíz. Sin registro con el encabezado (era para «Subir» de A) |
| `eyebrow` | — | Texto en línea | Sustituye a la prop |
| `title` | — | Contenido en línea del `hN` (p. ej. un código con `<bdi>`) | **Nunca** elementos interactivos. Las copias usan siempre la prop `title` |
| `description` | — | Texto | Sustituye a la prop |
| `meta` | — | `GBadge`, `GTag`, `GSummary`, texto | Estado de la página |
| `default` | — | Contenido: `GMetric`, `GAdaptiveLayout` | No va al zócalo |
| `tabs` | — | **Un** `GTabs` con `detached` | Los paneles (`GTabPanel`) van en el cuerpo de la página (#118). Con paneles integrados, aviso 9 |
| `actions` | `{ narrow: boolean, docked: boolean }` | `GBtn`, `GMenu` | `narrow`: el encabezado es estrecho (la aplicación pasa las secundarias a su `GMenu` «Más acciones» y, en el zócalo, la principal a solo icono con nombre accesible y `tooltip`). `docked`: las acciones están en el muelle (hay ancho para la principal con su texto). **Lo que depende de `docked` cambia props, no instancias:** un `v-if`/`v-else` entre dos botones según `docked` desmontaría la acción al mudarse y rompería «los mismos nodos» (el foco y el estado se perderían). `narrow` sí puede quitar o poner secundarias (no cambia a la vez que la mudanza). **Una sola acción sólida de marca** (`tokens.md` §2; aviso 7) |

Sin motor de prioridad de acciones en v1 (L5): qué pasa a «Más acciones» lo decide la aplicación con `narrow`.

## Eventos

**Ninguno.** El encabezado no emite intención propia: la ruta emite por `GBreadcrumbs` (`navigate`, #505), las pestañas por `GTabs`, las acciones por `GBtn`/`GMenu`. El estado pegado no es un evento (reservado si aparece un caso).

## Métodos

| Método | Firma | Qué hace |
| --- | --- | --- |
| `focus` | `focus(options?: FocusOptions): void` | Enfoca el `hN` (`tabindex="-1"`), pasando `options` a `HTMLElement.focus`. Es **dónde** llevar el foco al cambiar de ruta; **cuándo** lo decide la aplicación (`GBreadcrumbs` no mueve el foco al navegar). El anillo solo con `:focus-visible` |

Expuesto con `defineExpose`; consta en el `meta.json` (`methods`).

## Estructura accesible

- **Raíz `header` dentro de `main`, sin `role` ni `aria-label`** (HTML-AAM: un `header` dentro de `main` no es `banner`). El encabezado es el **primer hijo de `main`**: «Saltar al contenido» cae en él. Medido por kiwi: un solo `banner` en los tres motores.
- **Un `h1` por página** con `headingLevel` 1 (aviso 2 si al montar hay otro `h1` en el documento). `dir="auto"` en el título, el título compacto y el enlace del muelle (#282).
- **Acciones en `role="group"`** con `aria-label` = `labels.actions`. El grupo es el mismo nodo en el zócalo y en el muelle.
- **Título compacto:** `span` con `aria-hidden="true"`; no es enfocable ni pulsable.
- **Muelle:** sin rol (no es un punto de referencia: no hay nada nuevo que encontrar). Cerrado: `hidden` + `inert`. Su enlace lleva al `hN` con el foco (§«Muelle»).
- **Sin anuncios:** pegarse, hundirse y abrir el muelle son consecuencia del desplazamiento del propio usuario y no cambian el contenido (4.1.3 no aplica). Sin regiones vivas.
- **Táctil:** con `pointer: coarse`, todo lo que se pulsa en el encabezado, el zócalo y el muelle mide ≥ 44 × 44 (WCAG 2.5.8 y el mínimo de Grana). Los componentes compuestos traen el suyo; el enlace del muelle lo garantiza `GPageHeader.css`.

## Estrecho (L5)

- **Por el ancho del propio encabezado, no del dispositivo:** el `.vue` mide la raíz con el observador compartido (`utils/sizeObserver.js`) y pone **`is-narrow`** por debajo de **`space × 150`** (600 px con `space` 4: el valor medido de la ronda). Constante de diseño derivada de `space`, sin token (como #130: `@container` no admite `var()`); coco puede ajustar el factor en su auditoría, siempre en múltiplos de `space`.
- En estrecho: el ámbito `narrow` del slot `actions` es `true`; el título compacto **no se pinta** (el zócalo es para las pestañas); el muelle está disponible (§«Muelle»).
- Medido por kiwi a 390 px: sin desbordamiento horizontal.

## Pegado: el encabezado se hunde (#628, #629)

**Cuándo se pega.** Solo si se cumplen todas: `sticky` es `true`; hay zócalo; el JS ha medido (`--_lift`); la regla del cuarto se cumple. Entonces la raíz lleva **`is-sticky`** y el CSS la hace `position: sticky` con `inset-block-start: calc(var(--g-page-header-top) − var(--_lift))`, donde **`--_lift`** (px, en línea) es la distancia del borde de arriba de la raíz al del zócalo. Sin `is-sticky`, la raíz es estática.

**Pegado ahora.** **`is-stuck`** cuando la raíz llegó a su posición pegada (su borde de arriba ≤ `--g-page-header-top − --_lift`, con medio píxel de tolerancia). Con `is-stuck`, el zócalo gana su borde y `--g-shadow-2` (coco).

**Reglas comunes:**

1. **Nada se copia ni se muda en escritorio.** Las pestañas y las acciones que estaban en el zócalo siguen ahí. 0 mudanzas medidas por kiwi.
2. **Δ0.** El encabezado mantiene su alto: se hunde, no encoge. El contenido que sigue no se mueve al pegarse ni al volver (medido: Δ 0 px).
3. **El foco no se muda** (solo aplica al muelle; en escritorio nada se mueve).
4. **Regla del cuarto.** Si el alto del zócalo pasa del **25 % del alto del visor** (`innerHeight`), no hay `is-sticky` (el encabezado se va con la página) y no hay muelle. Se reevalúa al redimensionar (zoom incluido). Constante de diseño (L10). Medido por kiwi con un visor de 1280 × 180: estático.
5. **Primer pintado sin JS (SSR):** sin `--_lift` no hay pegado ni muelle; nada salta al hidratar (el pegado solo cambia algo al desplazar).
6. **Hijo directo del contenedor largo** (kiwi 22): `position: sticky` se limita a su bloque contenedor. La raíz debe ser hija directa del contenedor que se desplaza (normalmente `main`). Un envoltorio de la aplicación (o un `GSurface` de zona) alrededor del encabezado limita el pegado a ese envoltorio: aviso 5.
7. **El muelle es `position: fixed` dentro de la raíz:** ni la raíz ni sus ancestros pueden llevar `transform`, `translate`, `scale`, `filter`, `backdrop-filter`, `perspective`, `contain` (layout o paint), `container-type` ni `will-change` de esas propiedades (crean bloque contenedor para lo fijo y atraparían el muelle). Regla para coco en `GPageHeader.css` y límite para la aplicación (aviso 8). El encabezado mide con `ResizeObserver`, no con consultas de contenedor.

**Título compacto (B).** Aparece al principio del zócalo cuando el `hN` pasa bajo el borde: el `.vue` escribe **`--_p`** (0 a 1, en línea en la raíz) = cuánto del `hN` quedó por encima de `--g-page-header-top`, una vez por cuadro y solo si cambia; coco lo traduce a `opacity` y `translate` (y a su propio ancho, para no ocupar con `--_p` = 0). La fila del zócalo **no cambia de alto**; las pestañas pueden ceder ancho al título, ligadas al desplazamiento (no a un temporizador). Con movimiento reducido, `--_p` ∈ {0, 1} (umbral 0,5). En estrecho no se pinta.

**Cambio de pestaña con el encabezado pegado.** Si cambia la pestaña seleccionada del zócalo mientras hay `is-stuck`, la página se coloca **al instante** (sin desplazamiento suave, también sin movimiento reducido) en la posición justa de pegado: el principio del cuerpo que sigue al encabezado queda bajo el zócalo, y el panel nuevo empieza ahí. Si la página no da para tanto, el panel queda visible justo debajo (medido por kiwi con un panel corto). Sin pegado, no se mueve nada. **Detección sin acoplarse a `GTabs`:** un `MutationObserver` sobre `aria-selected` dentro de `__tabs` (la aplicación no tiene que avisar). El foco sigue en la pestaña (que no se mueve).

## Geometría pública: `--g-page-header-top`, alto del zócalo y `scroll-padding` (#629)

**Propiedad pública de entrada `--g-page-header-top`** (L6; como `--g-accordion-sticky-top`, #484). Longitud que pone la aplicación (en `:root`, en un contenedor o en el encabezado) con el alto de **su** cabecera fija: el zócalo pegado se queda a esa distancia del borde del contenedor que se desplaza. coco la registra con `@property` (`syntax: '<length>'`, `inherits: true`, `initial-value: 0px`). **No es del tema**: no va en `defaults.css` ni en `tokens.json`; excepción en `levels.test.js` como `--g-accordion-sticky-top` y `--g-form-min`. Dentro de `.g-dialog__body` el componente la pone a 0 (como #517).

**Alto del zócalo: `max(var(--g-space-12), 44px)`, fijo y de contrato** (L7). Es `block-size` (no un mínimo) con el borde incluido, en reposo y pegado, con cualquier puntero. Es la constante que permite escribir la receta sin JS y la que garantiza Δ0 al mudar las acciones. Cambiarla es una decisión de lima (rompe recetas de aplicaciones). Lo que va dentro tiene que caber: `GTabs` horizontal en una fila (`density` `default` o `compact`; el desbordamiento de pestañas es el de `GTabs`, `overflow`), `GBtn` hasta `size="lg"` (44 px); si el contenido mide más que el zócalo, aviso 6. coco centra el contenido en el bloque y alinea la cabecera de `GTabs` con `--g-tabs-inset` en `__base` (anfitriona, como `GDialog`).

**Receta de una sola variable (#515: la cabecera de la aplicación se cuenta una vez y es de la aplicación).** El encabezado **no pone `scroll-margin`** en nada: la aplicación suma el zócalo en su `scroll-padding-block-start` (para que un `#id` o el foco no queden bajo el zócalo, WCAG 2.4.11):

```css
:root {
  --g-page-header-top: var(--app-header);
  scroll-padding-block-start: calc(var(--app-header) + max(var(--g-space-12), 44px));
  /* un GAccordion sticky bajo el encabezado pegado: */
  --g-accordion-sticky-top: calc(var(--app-header) + max(var(--g-space-12), 44px));
}
```

- **Contenedor propio con desplazamiento** (un `main` con `overflow: auto` bajo la barra): `--g-page-header-top: 0px` y el `scroll-padding` en ese contenedor, sin la barra.
- **Sin `sticky`** (o sin zócalo): basta `scroll-padding-block-start: var(--app-header)`.
- **`GStatusIsland` y `GToaster`:** su `offset.top` es la misma `--app-header` (receta vigente); el zócalo lo suman por `edgeReserve` (§«Bordes compartidos»).
- Medido por kiwi: el enlace del título lleva al `h1` y queda visible bajo la barra.

## Muelle en estrecho (#630)

**Cuándo pasa a muelle.** **`is-docked`** (acciones en el muelle) si y solo si: `is-narrow` **y** `is-stuck` **y** hay acciones **y** el encabezado **no** está dentro de un `<dialog>` **y** la regla del cuarto se cumple para **zócalo + muelle** (la suma de sus altos ≤ 25 % del visor; el alto del muelle se mide la primera vez que se abre y se recuerda; si no cabe, las acciones se quedan en el zócalo pegado). Al dejar de cumplirse cualquiera (volver arriba, ensanchar, `sticky: false`), vuelven al zócalo. Sin histéresis: `is-stuck` es un hecho geométrico estable (no hay umbral que titubee).

**Mudanza (L8).**

1. **Los mismos nodos:** las acciones se mudan con **`Teleport` a `__dock-host` con `disabled` conmutado** (conserva instancias, estado, `loading`, menú). Nunca se pinta una segunda copia. Medido por kiwi: cada acción existe una vez antes, durante y después.
2. **Lo enfocado no se muda.** Si el foco está dentro de `__actions` (o en un panel que cuelga de ellas en el DOM), la mudanza **espera** al `focusout` que lo saca; entonces se aplica el estado vigente (si para entonces ya no toca mudar, no se muda).
3. **Lo abierto no se muda:** si un descendiente de `__actions` tiene `aria-expanded="true"` (un `GMenu`, un `GHelper` o un panel anclado con el panel fuera del DOM de las acciones), la mudanza espera a que se cierre. Así un panel anclado no pierde su ancla (#358, regla 3).
4. **El zócalo no cambia de alto** (alto fijo): al irse las acciones, las pestañas toman todo el ancho; la página no se mueve (Δ0).
5. **Orden de lectura estable:** el muelle es el último hijo de la raíz, justo después del zócalo (§«Anatomía»).
6. **Cerrado:** `hidden` + `inert` (fuera del árbol y del Tab); abierto: sin `hidden`, sin `inert`, con **`is-open`**. Al cerrarse, `hidden` se pone cuando termina la salida (o al instante con movimiento reducido).

**Forma.** Barra **de borde a borde de la caja del encabezado** (no de la ventana: nunca sobre una barra lateral), pegada al borde inferior con el área segura (`env(safe-area-inset-bottom)` dentro de su relleno). El `.vue` escribe la caja física en línea: **`--_dock-left`**, **`--_dock-right`** (px, desde los bordes del visor; espejado sin cambios en RTL porque son físicos) y **`--_dock-offset`** (px, la reserva anterior del borde inferior, §«Bordes compartidos»). Contenido: el **enlace al título** (`href="#{id}-title"`, texto `title`, se recorta con elipsis) y el grupo de acciones. Fondo `--g-color-surface`, borde de arriba `--g-color-border-strong`, sombra de coco; hereda la zona de marca (Z4).

**Enlace del muelle.** Clic primario sin modificadores (o Intro): `preventDefault`, el `hN` se desplaza al inicio (respetando el `scroll-padding` de la aplicación) y recibe el foco con `preventScroll`. Con modificadores o botón central, lo hace el navegador (es un enlace a un `#id`; regla de #505 por analogía, sin evento). Al subir, el encabezado deja de estar pegado y el muelle se cierra (el foco está en el `hN`, no en las acciones: la mudanza de vuelta no espera).

**Convivencia (resumen; detalle en §«Bordes compartidos»).** El muelle **no tapa** la pill de la voz (se coloca encima de ella si la voz está abajo); los **avisos** (`GToaster`) se apilan **encima** del muelle; la **isla** es siempre de arriba y no se cruza con el muelle (en móvil, abierta, es una hoja modal con `GDialog`, que deja todo lo demás inerte).

**Dentro de un `<dialog>`** (un `GDialog` a pantalla completa con su `GPageHeader headingLevel="2"`): sin muelle (el borde inferior del visor no es del diálogo) y sin reservas. El pegado dentro de `.g-dialog__body` funciona con `--g-page-header-top` a 0.

## Bordes compartidos (`edgeReserve`, #631)

**Un cliente más de `utils/edgeReserve.js`** (#322). Cambio interno en el principal (bruno): `EDGE_ORDER = { speech: 10, pageHeader: 15, status: 20 }`. **Corrige L9 de kiwi** (que ponía el encabezado antes que la voz): con el orden de kiwi, la voz —que no lee reservas y no se reabre (#322, decisión del usuario 3)— quedaría encima del muelle tapando sus acciones.

| Pieza | Borde | Publica | Lee | Efecto |
| --- | --- | --- | --- | --- |
| Zócalo pegado (`is-stuck`) | `top` | Alto del zócalo (px; el sitio final) con `order: EDGE_ORDER.pageHeader` | Nada (es `sticky` en `--g-page-header-top`; no puede moverse por una reserva) | La isla (`before: 20`) y los avisos de arriba se colocan **debajo** del zócalo |
| Muelle abierto (`is-open`) | `bottom` | Alto del muelle con su área segura (px; el sitio final, no la traslación en curso) con `order: EDGE_ORDER.pageHeader` | `edgeReserve('bottom', { before: EDGE_ORDER.pageHeader })` → la pill de la voz, si está abajo | Se coloca **encima** de la voz; los avisos de abajo (`GToaster`, que suma todo) **encima** del muelle |

- **Dos dueños por instancia** (el registro guarda un borde por dueño): uno para el zócalo y otro para el muelle. Cada uno se retira al dejar de estar pegado / abierto y al desmontar.
- **La reserva del zócalo es su alto**, no `--g-page-header-top` + alto: la isla y el toaster ya suman su `offset.top`, que la receta iguala a la cabecera de la aplicación.
- **No se publica dentro de un `<dialog>`.**
- **`edgeReserve.js` llega a la entrada por `__shared`** (#240): una copia propia crearía otro registro y la isla no vería las reservas (lo prueba bruno con las dos entradas cargadas).
- **Límite conocido (para el README):** la pill flotante de la voz arriba (`top-center`, escritorio) **no lee reservas** y puede quedar sobre el zócalo pegado mientras se graba; su cambio de borde cuando tapa el elemento enfocado (`speech.md` §6.3, WCAG 2.4.11) protege el foco. La isla suma voz y zócalo aunque se solapen (queda algo más baja de lo justo). No se reabre `speech.md`.
- Medido por kiwi con un aviso de prueba: debajo del zócalo y encima del muelle.

## Personalidad (#626, #632)

**Qué lo hace distinto.** Un encabezado que **no encoge ni se copia: se hunde**. Al desplazar, la página sigue quieta bajo el dedo y lo único que asoma es la fila que ya tenía lo que se usa a media página, las pestañas y las acciones, con el título que sube a su sitio al ritmo de la mano. Es el único encabezado en el que se cambia de sección sin volver arriba, y el panel nuevo empieza justo bajo el zócalo. En un teléfono, las acciones **bajan al pulgar** con su estado y las pestañas se quedan arriba con todo el ancho. Nada se duplica, nada pierde su estado ni el foco, nada se pega si el zoom no lo permite, y la isla y los avisos saben dónde está.

## Movimiento (#632; amplía `tokens.md` §29)

| Qué | Cómo | Movimiento reducido |
| --- | --- | --- |
| Hundirse y pegarse | **Sin animación propia:** el desplazamiento es el movimiento | Igual |
| Título compacto | Ligado a `--_p` por cuadro (solo `opacity`, `translate` de `space × 4` como máximo, y su ancho); sin temporizadores ni transiciones | `--_p` ∈ {0, 1}; sin `translate` |
| Borde y sombra al pegarse | Fundido `--g-duration-fast` + `--g-ease-out` | Se queda (color y sombra) |
| Muelle que entra | `translate` desde abajo con **`--g-duration-slow` + `--g-ease-spring`** (#635); opacidad `--g-duration-fast` | Sin `translate`: fundido `--g-duration-fast` |
| Muelle que sale | `--g-duration-press` + `--g-ease-out` (la salida, más corta, #152) | Sin `translate`: fundido `--g-duration-fast` |
| Acciones que se mudan | Sin FLIP (llegan con el muelle) | Igual |
| Cambio de pestaña pegado | Desplazamiento **instantáneo** | Igual |

**`--g-ease-spring` en la entrada del muelle** (como el prototipo de kiwi; decisión del usuario del 2026-10-13, #635, que enmienda #632 y amplía #299): solo el `translate` de entrada; la opacidad sigue con `--g-duration-fast` y la salida con `--g-duration-press` + `--g-ease-out`. Es el séptimo uso de `tokens.md` §29.1. **Detalles de implementación contratados (#652):** el muelle usa `--g-ease-spring` **dentro de `@supports (transition-timing-function: linear(0, 1))`**, con **respaldo `--g-ease-out`** fuera de él; lleva **`--g-shadow-3`**; y bajo el muelle hay un **faldón** (un relleno de la superficie por debajo del borde inferior, que no se anima por separado) para que el rebote del muelle no deje ver la página en el hueco. Nada supera 240 ms (#71). Las transiciones de curva usan la regla de soporte de §29.1 (sin `linear()`, cae a `--g-ease-out`). Con movimiento reducido no hay `translate`: fundido.

## Zona de marca (Z1 a Z4, #634)

**No se contrata aquí: se consume.** La zona la contrata otra entrega de lima a partir de `design/lab/surface/r02/` (concepto **C · Plano de tinta**, marca profunda en oscuro; `surface.md` §«Zona de marca», `tokens.md` §44, `api.md` §«Zona de marca», DECISIONS.md #620 a #625). **Dependencia explícita:** si ese contrato cambia su mecanismo (atributo `data-g-zone="brand"` aplicable a cualquier raíz) o su lista de tokens redeclarados (§44.5), esta sección vuelve a lima. Lo que `GPageHeader` necesita y promete:

- **El encabezado solo lee tokens.** No pinta una banda propia ni reasigna tokens: dentro de la zona, ruta, `h1`, descripción, acciones, métricas y pestañas funcionan porque la zona redeclara lo que leen (`api.md` §«Zona de marca», regla 2).
- **Z2 · La zona va en la raíz del encabezado**, nunca en un envoltorio (un envoltorio limita el pegado, §«Pegado», regla 6). Dos formas equivalentes: la prop **`zone="brand"`** (el componente pone el atributo en su raíz) o el atributo público `data-g-zone="brand"` pasado a `<GPageHeader>` (los atributos no declarados llegan a la raíz). **Nunca** un `GSurface zone="brand"` alrededor.
- **Z1 · Los alias siguen a la zona** (`primary*` y `brand*` se invierten juntos, `tokens.md` §44.1): **la acción principal dentro de la zona es la tinta invertida** (relleno `on-brand-zone`, texto la marca), con el mismo `GBtn` sólido de siempre. **Corrige el prototipo de kiwi**, que rellenaba la principal con la lima (`accent` + `on-accent`): §2 dice que el acento nunca rellena la acción principal. La aplicación no pone `color="accent"` en la principal para «verla de marca».
- **Z3 · Acento y foco** los da la zona (`on-brand-accent`); el encabezado no los elige.
- **Z4 · El zócalo pegado y el muelle heredan la zona** porque están dentro de la raíz: el muelle es `fixed` pero sigue siendo descendiente, y las acciones mudadas con `Teleport` van a `__dock-host`, dentro de la raíz. **Regla para bruno:** el `Teleport` nunca va a `body` (regla 3 de `api.md` §«Zona de marca»). Los paneles de las acciones que se abren **en su sitio** en el top layer (`popover` de `GMenu`, `<dialog>`) también heredan la zona; solo sale lo que un `<Teleport>` lleve fuera de la raíz.
- **Tokens:** todos los que lee `GPageHeader.css` del grupo de color (`bg`, `surface`, `text`, `text-muted`, `border`, `border-strong`, `focus`) están en la lista de §44.5 (regla 5): no se añade ninguno.
- **Filo frente a la página (medido por coco; límite aceptado en v1, #652):** en el oscuro del tema por defecto la banda de la zona, **en reposo**, no se separa de la página (1,12:1, sin línea); **pegada** sí, por la línea del zócalo (`--g-color-border`, 1,86:1). `GPageHeader` **no** lee `--g-color-zone-edge` en v1 (la excepción de `tokens.md` §44.2 sigue siendo solo de `GSurface.css`). Se documenta como límite conocido: la zona del encabezado ya se lee por su contenido (título, ruta, acciones) y por el color de la banda en claro; el usuario aceptó que en oscuro la zona sea casi negra sobre una página casi negra (§44.2). **Propuesta, no decidida (decisión del usuario si la quiere):** ampliar la excepción de §44.2 a `GPageHeader.css` para un filo en reposo con `--g-color-zone-edge`, **como `box-shadow: inset` o descontado del alto**, nunca como borde que sume, porque el zócalo mide un alto fijo (`--g-page-header-top`, geometría pública). No cambia la elección del usuario (B con muelle, zona C).
- **Contraste medido por kiwi con la zona supuesta** (prototipo): tema por defecto `h1` 16,48:1, descripción y ruta 10,37:1; NisaNabani `h1` 11,57:1, descripción y ruta 7,78:1, foco lima 6,95:1. La cifra del prototipo para la principal en lima (10,88:1) **no vale**: la principal es la tinta invertida. coco lo vuelve a medir todo con la zona contratada, en claro y en oscuro.

## Tokens consumidos (L13; `tokens.md` §45)

**Ningún token del tema nuevo.** Existentes: `--g-color-bg` (fondo opaco de la raíz, también pegada; alias local `--_bg` con mapa de anfitrionas de coco si va sobre otra superficie, como `--_sticky-bg` de `GAccordion`), `--g-color-surface` (muelle), `--g-color-text`, `--g-color-text-muted` (descripción, antetítulo), `--g-color-border` (borde del zócalo pegado), `--g-color-border-strong` (borde del muelle), `--g-color-focus`, `--g-focus-width`, `--g-focus-offset`, `--g-border-width`, `--g-shadow-2` (pegado), `--g-shadow-3` (muelle, si coco la elige), `--g-text-title-lg-*` (`h1`; nivel 2 y 3 de coco), `--g-text-title-sm-*` (título compacto), `--g-text-body-*` (descripción), `--g-text-body-sm-*` y `--g-text-caption-*` (antetítulo, enlace del muelle), `--g-text-action-weight`, `--g-font-title`, `--g-font-ui`, `--g-space-*`, `--g-duration-fast`, `--g-duration-press`, `--g-duration-slow`, `--g-ease-out`. Los de la zona son del contrato de la zona (§44); todos los que lee el encabezado están en su lista (§44.5).

**Propiedad pública de entrada:** `--g-page-header-top` (§«Geometría pública»).

**No son tokens:** el umbral de estrecho `space × 150`; el alto del zócalo `max(space × 12, 44px)` (constante de contrato); la regla del cuarto (25 %); la tolerancia de medio píxel de `is-stuck`; el umbral 0,5 de `--_p` con movimiento reducido; `translate` del título compacto `space × 4`; `24px`/`44px` (§7). **Datos del `.vue` al CSS** (§29.5): `--_lift`, `--_p`, `--_dock-left`, `--_dock-right`, `--_dock-offset`.

## Clases y datos (contrato bruno ↔ coco)

| Clase o dato | Dónde | Cuándo |
| --- | --- | --- |
| `g-page-header` | Raíz `header` | Siempre |
| `is-narrow` | Raíz | Ancho de la raíz < `space × 150` |
| `has-base` | Raíz | Hay zócalo (`tabs` o `actions`) |
| `has-tabs`, `has-actions` | Raíz | Slot presente |
| `data-g-zone="brand"` | Raíz | Con `zone="brand"` (mecanismo de la zona; el componente no añade clase propia) |
| `is-sticky` | Raíz | Pegado activo (§«Pegado»: `sticky`, zócalo, medido, regla del cuarto) |
| `is-stuck` | Raíz | Llegó a la posición pegada |
| `is-docked` | Raíz | Las acciones están en el muelle |
| `--_lift`, `--_p` | Raíz, en línea | Con `is-sticky` (`--_p` solo mientras el `hN` cruza o al cambiar de 0/1) |
| `g-page-header__head`, `__titles`, `__eyebrow`, `__title`, `__desc`, `__meta`, `__content` | Cabecera | Según props/slots |
| `g-page-header__base`, `__base-title`, `__tabs`, `__actions-home`, `__actions` | Zócalo | Con `has-base` |
| `g-page-header__dock`, `__dock-title`, `__dock-host` | Muelle | Con `has-actions` y sin `<dialog>` ancestro; `hidden` + `inert` cerrado |
| `is-open` | `__dock` | Muelle abierto |
| `--_dock-left`, `--_dock-right`, `--_dock-offset` | `__dock`, en línea | Abierto |

**Selectores sobre hijos de la aplicación** (`__actions > *`, `__meta > *`, `__content > *`): con la exclusión de `.g-tooltip` de #383 (`:not(:where(.g-tooltip))`). El encabezado **no** estiliza las piezas internas de `GBtn`, `GTabs` ni `GBreadcrumbs` (la principal de solo icono es `icon` + `tooltip` de `GBtn`, que pone la aplicación con el ámbito).

**Estilos de elemento de la aplicación** (`h1 { margin… }` sin capa): límite general y receta de capas de #516 (`api.md`); el contrato no promete más.

## Colores forzados, RTL, SSR

- **`forced-colors`:** borde `CanvasText` en el zócalo pegado y en el muelle (para no fundirse con la página cuando desaparecen fondo y sombra); el foco, el del sistema. Reglas escritas por kiwi, sin medir: las mide coco.
- **RTL:** todo lógico; el título compacto va al principio lógico del zócalo; el muelle usa la caja física del encabezado (`--_dock-left`/`--_dock-right`), que ya es correcta en los dos sentidos. Medido por kiwi.
- **SSR:** ids SSR-seguros; sin `window`/`document` al importar ni en el servidor; sin pegado ni muelle hasta medir en el cliente.

## Avisos de desarrollo (`[Grana GPageHeader]`, una vez por instancia y motivo)

Con la guarda canónica de #653 (`try { if (process.env.NODE_ENV !== 'production' …) … } catch {}`, `api.md` «Avisos de desarrollo»).

1. Falta `title` (o está vacío).
2. `headingLevel` 1 y al montar ya hay otro `h1` en el documento.
3. `headingLevel` fuera de `1`–`3` (se usa `1`).
4. Hay acciones y falta `labels.actions`.
5. Con `is-sticky`, el padre de la raíz mide lo mismo que ella en bloque (no hay contenedor largo: el pegado no hará nada; envoltorio de la aplicación o de zona).
6. El contenido del zócalo es más alto que el zócalo (una pestaña o una acción de más de `max(space × 12, 44px)`).
7. Más de una acción `solid` de `color="brand"` en el grupo (`tokens.md` §2: una sola principal).
8. Al abrir el muelle, su borde inferior no coincide con el del visor (un ancestro con `transform`, `filter`, `contain`, `container-type`… lo atrapa; §«Pegado», regla 7).
9. En el slot `tabs` hay un `GTabs` con paneles integrados (`.g-tabs__panels` presente): debe ir con `detached` (#118).
10. `zone` fuera de lista (se usa `none`); o `zone="brand"` y `data-theme` en la raíz a la vez (`api.md` §«Zona de marca», regla 4: el tema ganaría a la zona).

## Accesibilidad y mínimos (no son tema)

| Criterio | Cómo se cumple |
| --- | --- |
| 1.3.1 / 1.3.2 | `header` en `main` sin `banner`; un `h1`; orden del DOM = lectura = Tab; el muelle detrás del zócalo |
| 1.4.10 | Regla del cuarto; sin desbordamiento horizontal a 390 px; pegado y muelle se retiran con zoom |
| 1.4.3 / 1.4.11 | Texto ≥ 4,5:1 y bordes de control ≥ 3:1 en el tema por defecto, otro tema y la zona (coco) |
| 2.4.3 / 2.4.7 | Foco nunca se muda; `focus()` al `hN`; anillo visible en el `hN` con `:focus-visible` |
| 2.4.11 | Receta de `scroll-padding` de la aplicación con el alto de contrato del zócalo; reservas de borde para isla y avisos |
| 2.5.8 | ≥ 24 × 24 siempre; ≥ 44 × 44 con `pointer: coarse` |
| 4.1.3 | Sin anuncios (nada cambia de contenido) |

## Paquete y peso (#633)

- **Entrada propia `@grana/vue/page-header`** (global UMD `GranaPageHeader`; L1): exporta `GPageHeader` y un plugin que lo registra (`app.use(PageHeader)`); `@grana/vue` no lo exporta ni lo registra. Llegan por `__shared` (#240, sin copias): `utils/edgeReserve.js` (**obligatorio**: un solo registro por documento), `utils/sizeObserver.js`, `utils/topModal.js` si lo usa para detectar el `<dialog>`, `utils/motion.js` si lo usa. `GBreadcrumbs`, `GTabs`, `GBtn`, `GMenu` y `GMetric` no los importa (son de la aplicación por slot). El CSS sigue en `grana.css`.
- **Por qué no el principal:** #550 («el margen está agotado: todo componente nuevo que entre al principal abre la valoración de #506; entrada propia por defecto»). Lo único que crece el principal es `EDGE_ORDER.pageHeader` (bytes).
- Se declara en **`exports`** (`./page-header`, con `types`, `import` y `default`), **`typesVersions`**, **`ENTRIES`** de `scripts/build-types.mjs` y **`src/types.test.js`** (#442, #443).
- **Compuertas de `dist`** (bruno las añade a `gates.sh`): `grep -q "g-page-header__base" packages/vue/dist/grana.css`, `! grep -q "GPageHeader" packages/vue/dist/grana.js`, `test -f packages/vue/dist/page-header.js`.
- bruno mide y registra el peso gzip (KiB, #550) de la entrada en el `meta.json`, `CHANGELOG.md` y `CLAUDE.md`. Estimación de kiwi para base + B + muelle: ≈ 3,5 KB.

## `meta.json` y tipos (#443)

`GPageHeader.meta.json`: las ocho props con tipo, valores, default y obligatoriedad (`title` obligatoria; `headingLevel` `1 | 2 | 3`; `sticky` `true`; `zone` `'none' | 'brand'`); los ocho slots, con el ámbito de `actions` `{ narrow: boolean; docked: boolean }`; `events: []`; `methods: [{ name: 'focus', signature: '(options?: FocusOptions) => void' }]`; `labels` `{ actions?: string }`. Lo que el JSON no exprese, en `packages/vue/types/overrides.mjs` (`GPageHeader.…`).

## Resolución de hallazgos de kiwi (L1 a L16, Z1 a Z4)

| # | Hallazgo | Resolución |
| --- | --- | --- |
| L1 | Nombre y entrega | `GPageHeader` / `g-page-header`; entrada propia `@grana/vue/page-header` (`GranaPageHeader`); complejo: coco y bruno en Opus (#633) |
| L2 | Props | `title` (obligatoria), `headingLevel`, `eyebrow`, `description`, `sticky` (`true`), `zone` (`none`/`brand`, nombre compartido de la zona), `labels` (`actions`), `id`. Sin `labels.up` (A) (#627, #628, #634) |
| L3 | Nivel | `headingLevel` 1 a 3, avisos 2 y 3; `focus()` (#627) |
| L4 | Composición | Slots `trail`, `eyebrow`, `title`, `description`, `meta`, `default`, `tabs`, `actions` `{ narrow, docked }`. **Sin registro** de `GBreadcrumbs` por `provide/inject` (era para «Subir» de A, no elegido) (#627) |
| L5 | Estrecho | `is-narrow` por el ancho de la raíz, `space × 150`; sin motor de prioridad (§«Estrecho») |
| L6 | Entrada pública | `--g-page-header-top` (#629) |
| L7 | Alto del zócalo | `max(space × 12, 44px)`, fijo y de contrato; receta de una variable (#629) |
| L8 | Mudanza | Solo en estrecho: `Teleport` conmutado, foco y paneles abiertos esperan, orden estable, `hidden` + `inert` (#630) |
| L9 | Bordes | `EDGE_ORDER.pageHeader = 15` (**después** de la voz, no antes: corrige la propuesta), dos dueños, el muelle lee la voz (#631) |
| L10 | Regla del cuarto | 25 % del visor; zócalo para pegarse, zócalo + muelle para abrir el muelle (§«Pegado») |
| L11 | Avisos | 1 a 10 (§«Avisos») |
| L12 | Movimiento y personalidad | #626, #632, #635; el muelle **con** `--g-ease-spring` (aprobado por el usuario) |
| L13 | Tokens | Ninguno del tema nuevo (§«Tokens») |
| L14 | Fronteras | §«Cuándo usarlo» |
| L15 | Reservas | §«Fuera de v1» |
| L16 | Pruebas | §«Verificación» |
| Z1–Z4 | Zona de marca | Dependencia explícita (§«Zona de marca», #634) |
| Pregunta menor | ¿Pegado de serie o con prop? | De serie cuando hay zócalo, con `sticky` para quitarlo; revisable (#628) |

## Fuera de v1 (reservado con nombre)

**A · Relevo** completo (franja de arriba con «Subir», título y acciones mudadas; `labels.up`; registro de `GBreadcrumbs`); **C · Muelle** en escritorio (píldora flotante); `--g-ease-spring` en el muelle (aprobado, #635); carga del encabezado como molde de `GLoadRegion`; acciones como datos con prioridad automática; botón «volver arriba» (no: el enlace del muelle y el título ya llevan al `h1`); `animation-timeline: view()` como única vía del título compacto (cuando los tres motores lo tengan; coco puede usarlo antes como mejora si da el mismo resultado que `--_p`); evento de pegado.

## Límites conocidos (para el README)

- **Acciones abajo en escritorio:** viven en el zócalo, no arriba a la derecha (lo eligió el usuario; A queda reservado si el producto lo pide).
- **Hijo directo del contenedor largo:** un envoltorio limita el pegado (aviso 5); la zona de marca va en la raíz.
- **Ancestros que atrapan lo fijo** (`transform`, `filter`, `contain`, `container-type`…): el muelle queda mal colocado (aviso 8).
- **Contenido del zócalo de alto fijo:** `GTabs` en una fila y `GBtn` hasta `lg` (aviso 6).
- **La pill de la voz arriba** puede quedar sobre el zócalo mientras se graba (cambia de borde si tapa el foco).
- **Lector de pantalla con cursor virtual:** al recorrer la página, el lector la desplaza y en estrecho eso puede mudar las acciones mientras se leen; la regla del foco protege el foco, no el cursor virtual (no verificado en entorno real).
- **Estilos de elemento de la aplicación** sin capa ganan (#516).

## Verificación (cómo se da por hecho)

### bruno (vitest + jsdom)

`GPageHeader.test.js`: etiqueta del `hN` por `headingLevel` y fallback; `id` y `{id}-title`; `tabindex="-1"` y `focus()` con opciones; orden de los slots en el DOM; zócalo solo con `tabs` o `actions`; grupo con `aria-label`; título compacto `aria-hidden`; muelle `hidden` + `inert` cerrado; ámbito `{ narrow, docked }`; `Teleport` con `disabled` conmutado que conserva la instancia (un hijo con estado y `onMounted` una sola vez); la mudanza espera al `focusout` y al cierre de un `aria-expanded="true"`; `edgeReserve` publica y retira con dos dueños y `order` 15, y el muelle lee la voz (`before`); sin reservas ni muelle dentro de un `<dialog>`; los diez avisos; sin efectos al importar ni en el servidor.

### Playwright (`design/lab/theme-playground/`, **puerto propio**; las de `verificar.mjs` como base, L16)

`tests/page-header.spec.mjs` y `tests/personalidad-page-header.spec.mjs`, en Chromium, Firefox y WebKit: un `banner` y el encabezado en `main`; un `h1`; orden de lectura; pegado en `--g-page-header-top` con el alto intacto y **Δ0** del contenido al pegar y al volver; 0 mudanzas en escritorio; cada acción **una vez** en todo momento; título compacto con `--_p` intermedio a medio pasar; cambio de pestaña pegado (panel largo: empieza bajo el zócalo; corto: visible justo debajo); ←/→ en las pestañas pegadas; regla del cuarto (visor 1280 × 180: estático); estrecho a 390 px con `pointer: coarse` (zócalo con pestañas a todo el ancho, acciones en el muelle con la principal y su texto, objetivos ≥ 44 × 44, sin desbordamiento, vuelta al zócalo arriba); foco en una acción que no se muda hasta salir; `GMenu` abierto que no se muda; enlace del muelle que enfoca el `h1` visible bajo la barra; **la isla real** (`@grana/vue/status`) debajo del zócalo y **`GToaster`** encima del muelle; voz simulada abajo con el muelle encima; movimiento reducido (`--_p` ∈ {0, 1}, muelle sin `translate`); RTL; dentro de un `GDialog` (pegado en el cuerpo, sin muelle); con la zona de marca contratada (contraste); consola limpia. Con `GBreadcrumbs`, `GTabs detached`, `GBtn`, `GMenu` y `GMetric` **reales**. Rendimiento: el desplazamiento no vuelve a pintar Vue (escrituras de `--_p` solo si cambia; **lección de bd888df**: ningún `watch` con getter que devuelva un arreglo nuevo).

### coco (Opus) · CSS y auditoría

`GPageHeader.css` sin literales ni respaldos (salvo `24px`/`44px`); `@property --g-page-header-top`; 0 en `.g-dialog__body`; zócalo de alto `max(space × 12, 44px)`; ningún ancestro-trampa en la raíz (regla 7); contraste en el tema por defecto, NisaNabani (`design/lab/page-header/r01/nsa-tokens.css`) y la zona; `forced-colors` en Chromium; auditoría del componente real con verificación propia en `design/lab/page-header/`.

### No verificado (entorno real)

Lector de pantalla real (VoiceOver, NVDA, TalkBack): `header` en `main` sin `banner`, el grupo de acciones, la mudanza con el cursor virtual; inercia de iOS con `sticky` negativo; `forced-colors` real; zoom real al 200 % y 400 %; teclado en pantalla de móvil con el muelle abierto; tema oscuro con la zona.

## Encargos

- **coco (Opus):** `GPageHeader.css` (raíz, cabecera, contenido, zócalo de alto fijo, título compacto con `--_p`, pegado con borde y sombra, muelle, estrecho, `pointer: coarse`, RTL, forzados, movimiento y reducido), `@property --g-page-header-top`, anfitriona de `--g-tabs-inset` en `__base`; banco y `design/lab/page-header/estilo.md`; después, la auditoría. Sin cambios en `defaults.css`.
- **bruno (Opus):** `GPageHeader.vue` (medidas con `sizeObserver`, `--_lift`, `--_p` por cuadro, `is-*`, `Teleport` conmutado con sus esperas, `MutationObserver` de `aria-selected`, enlace del muelle, `edgeReserve` con dos dueños), `EDGE_ORDER.pageHeader` en `utils/edgeReserve.js`, entrada `@grana/vue/page-header` (`exports`, `typesVersions`, `ENTRIES`, `types.test.js`, `__shared`), `meta.json`, `overrides.mjs`, compuertas en `gates.sh`, specs y playground `#sec-page-header`; añadir `levels.test.js` (excepción de `--g-page-header-top`).
- **mora-docs (Sonnet):** `GPageHeader/README.md` tras la auditoría: la receta de una variable (`--g-page-header-top`, `scroll-padding`, `offset.top` de isla y toaster, `--g-accordion-sticky-top`), el encabezado como primer hijo directo de `main`, `focus()` al cambiar de ruta, el ámbito `{ narrow, docked }` con «Más acciones», la zona en la raíz, la entrada y el global UMD en el `README.md` raíz, y los límites.
- **Dependencia:** la zona de marca la construyen coco y bruno con su propio contrato (`surface.md`); las pruebas del encabezado dentro de la zona necesitan ese bloque de `defaults.css`. Si aún no está, se marcan como pendientes y el resto avanza.

## Dudas para el usuario (no bloquean)

1. ~~`--g-ease-spring` en la entrada del muelle~~ **Resuelta (#635):** el usuario la aprobó; contratado con él.
2. **Pegado de serie** (#628): contratado de serie con `sticky` para quitarlo; si prefiere que sea opcional, como `GAccordion`, cambia solo el valor por defecto.
