# Contrato · GAppShell (chasis de aplicación)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #708 a #718, 2026-10-21; cambios en archivos compartidos aplicados en `api.md` «Piezas pegadas», «Cabecera fija de la aplicación», «Contención en línea», «Paquete, entradas y tipos» y «Convivencia de servicios», `tokens.md` §48, `status.md` «Borde compartido» y `page-header.md` «Geometría pública» y «Bordes compartidos») · **Basado en:** `design/lab/app-shell/r01/` (kiwi, commit 0c202e3: `brief.md` con la auditoría previa del chasis del playground, `declaracion.md` con 19 decisiones de base, conceptos A/B/C, hallazgos S1 a S11 y L1 a L15, `index.html`, `shell.js`, `shell.css`, `verificar.mjs` 352/352 en Chromium, Firefox y WebKit, puerto 4211)
**Tag:** `g-app-shell` · **Categoría:** estructura de aplicación · **Paquete:** entrada propia **`@grana/vue/app-shell`** (global UMD `GranaAppShell`; #716) · **Hermanos de la misma ronda:** `GStack` (`stack.md`) y `GSection` (`section.md`); la columna de la página es `GContainer` (`container.md`)

**Componente complejo** (L12: se posiciona sobre otros elementos —sidebar fijo, cabecera pegada—, se solapa con `GSidebar`, `GPageHeader`, `GContainer` y `edgeReserve`): **coco y bruno en Opus** (regla de `CLAUDE.md`).

## Promesa

Reparte el visor entre **cabecera de la aplicación**, **navegación** (`GSidebar`), **región principal** y **pie**, con sus puntos de referencia y su enlace de salto, y **escribe una sola vez** la cifra de la cabecera para todo lo que se pega debajo (`GPageHeader`, `GAccordion sticky`, la isla, los avisos, el FAB). La aplicación deja de reservar el sitio del sidebar escuchando `mode-change` y deja de escribir la receta de «Cabecera fija» (`api.md`).

**Forma (decisión del usuario del 2026-10-21, #708):** «base + A · Cortina por defecto, con B · Relevo de franja como opción (`header="relay"`). C · Escenario reservada.»

- **Base:** landmarks, salto, reserva del sidebar por CSS, sidebar fijo, cabecera de alto de contrato con una cifra publicada, presupuesto del cuarto, registro de bordes, desplaza el documento.
- **A · Cortina (por defecto, sin API):** al **contraer**, la página se ensancha al instante y el riel se encoge **sobre** ella; al **expandir**, el sidebar crece **sobre** la página y la página se aparta **una sola vez**, cuando ya la cubre (tras `--g-duration-slow`).
- **B · Relevo de franja (opción, `header="relay"`):** al bajar leyendo con el zócalo de `GPageHeader` pegado, la cabecera **cede el borde** y el zócalo sube a 0; al subir, al volver arriba o al entrar el foco en la cabecera, vuelve. Nunca queda la pantalla sin franja.
- **C · Escenario: reservada** (`appearance="stage"` reservado; «Fuera de v1»).

---

## Principios

1. **Un solo `main`**, salto incorporado, orden del DOM = orden de lectura = orden de Tab.
2. **El chasis lee la forma de la navegación, no la escucha:** la reserva sale de las clases públicas de `GSidebar` con `:has()`, correcta en el primer pintado (SSR) y en cada cambio de formato, sin JS.
3. **Una cifra, escrita una vez:** el alto de la cabecera es de contrato y el chasis publica lo que ocupa (`--g-app-shell-top`).
4. **Lo pegado nunca pasa del cuarto del visor** (WCAG 1.4.10): si no cabe, la cabecera se despega sola.
5. **Enfocar algo pegado no desplaza la página** (S1, regla común de `api.md` «Piezas pegadas»).
6. **Desplaza el documento, no una caja** (teclado sin foco, barra del navegador móvil, restauración, impresión, «buscar en la página»).
7. **La página no se recompone delante de quien lee** al plegar o desplegar la navegación (A).
8. **No navega, no pide datos, no abre el drawer por su cuenta**: el botón de menú lo pone la aplicación en la cabecera.

## Qué lo hace distinto (#709)

Un chasis que **reserva el sitio de la navegación leyendo su forma, sin eventos ni medidas**, que **escribe una sola vez la cifra de la cabecera** para el encabezado de página, el acordeón, la isla y los avisos, que **se despega solo cuando lo pegado ya no cabe** (zoom 400 %, teléfono apaisado), en el que **enfocar la navegación o la cabecera nunca mueve la página** (un fallo de Chromium y WebKit que hoy tiene cualquier receta de cabecera pegada) y en el que, al plegar o desplegar la navegación, **la página no se recompone delante de quien lee** (A · Cortina: la navegación se mueve como una cortina sobre una página quieta y la página cambia de ancho una sola vez, en el momento en que la navegación la tapa). Con `header="relay"`, **la cabecera y el encabezado de la página se pasan el borde**: siempre hay una sola franja arriba, la que más sirve en ese momento.

## Cuándo usarlo (fronteras)

| Necesito | Uso | No |
| --- | --- | --- |
| El chasis de toda la aplicación (cabecera, navegación, página, pie) | **`GAppShell`**, una vez por documento | Dos chasis (aviso 2) ni un chasis dentro de un `<dialog>` (aviso 7) |
| La columna de la página (ancho, margen, sangrado) | `GContainer` **dentro** de `main`, con `as="div"` (S10, #718) | `GContainer as="main"` dentro del chasis (duplica `main`, aviso 3) |
| Apilar bloques de la página con un ritmo | `GStack` | Márgenes escritos a mano |
| Una sección con título y acciones | `GSection` | `GFormSection` (solo formularios) |
| Abrir la página con su `h1`, pestañas y acciones | `GPageHeader`, **hijo directo** del contenedor largo (`main` o el cuerpo de `GContainer`) | El encabezado en la cabecera del chasis |
| La navegación | `GSidebar` en el slot `nav`, **hijo directo** del chasis | Un envoltorio entre el chasis y el sidebar (aviso 4); `GSidebar contained` (aviso 5) |
| Superficie de la página como hoja | Reservado (C, `appearance="stage"`) | — |
| Rutas, búsqueda, sesión, botón de menú del drawer | La aplicación | El chasis |

## Uso

```vue
<GAppShell :labels="{ skip: 'Saltar al contenido' }">
  <template #header>
    <GBtn v-if="sidebarMovil" icon="menu" label="Menú" variant="ghost" @click="nav.open()" />
    <MiMarca />
    <MiBuscador />
  </template>
  <template #nav>
    <GSidebar ref="nav" v-model="actual" :items="destinos" label="Principal" @mode-change="sidebarMovil = $event.mode === 'drawer'" />
  </template>
  <GContainer>
    <GPageHeader title="Muestras" :labels="{ actions: 'Acciones de la página' }">…</GPageHeader>
    <GStack gap="lg">
      <GSection title="Pendientes">…</GSection>
      <GSection title="Validadas">…</GSection>
    </GStack>
  </GContainer>
  <template #footer>…</template>
</GAppShell>
```

Sin receta de cabecera: ni `--g-page-header-top`, ni `--g-accordion-sticky-top`, ni `scroll-padding-block-start`, ni `offset.top` en `GStatusIsland` y `GToaster` (#713, #714). `mode-change` solo hace falta para lo que la aplicación decida (el botón de menú del drawer), no para reservar sitio.

## Anatomía (base)

```
div.g-app-shell                                   ← raíz: rejilla [pista del sidebar | marco]; la caja que GSidebar mide (su parentElement)
├─ a.g-app-shell__skip  href="#{id}-main"         ← «Saltar al contenido» (labels.skip); primer enfocable; visible solo con foco
├─ header.g-app-shell__header  [data-g-zone]      ← [slot header] → landmark banner; banda pegada de alto de contrato (solo con slot)
├─ [slot nav] → <GSidebar>                        ← HIJO DIRECTO de la raíz; fijo al visor (expandida, riel, superpuesto, flotante);
│                                                    el navbar y el drawer los coloca el propio GSidebar
└─ div.g-app-shell__frame                         ← el marco: columna de la página (min-inline-size: 0; overflow-x: clip)
   ├─ main.g-app-shell__main#{id}-main tabindex="-1"   ← [slot default] → landmark main ÚNICO; destino del salto
   └─ footer.g-app-shell__footer                  ← [slot footer] → landmark contentinfo, fuera de main (solo con slot)
```

- **La reserva del sidebar es la pista de la rejilla**, no un relleno de la página: el marco empieza donde acaba la pista y todo lo de dentro (el contenedor, una banda `g-bleed`, una tabla) mide **su** caja, nunca el visor.
- **Orden del DOM:** salto → cabecera → navegación → página → pie (WCAG 1.3.2, 2.4.3). Ni `order` ni `grid-area` que reordenen la lectura: las áreas de la rejilla solo colocan la pista a un lado.
- Sin slot `header`: no se pinta el `header`, el alto es 0 y no hay banda. Sin slot `footer`: no hay `footer`. Sin slot `nav`: pista 0.

## Props (#711)

| Prop | Tipo | Valores | Default | Nota |
| --- | --- | --- | --- | --- |
| `header` | String | `pinned` `relay` | `pinned` | Comportamiento de la cabecera al desplazar. `relay` = B · Relevo de franja (§«B»). Fuera de lista: aviso 9 y `pinned` |
| `headerZone` | String | `none` `brand` | `none` | Zona de marca **de la banda de cabecera** (`api.md` «Zona de marca», regla 1): `brand` pone `data-g-zone="brand"` en el `header`, nunca en la raíz (pintaría la página entera) ni en un envoltorio. Valores de `zone` (`inverse` reservado). Fuera de lista o sin slot `header`: aviso 8 y `none` |
| `labels` | Object | `{ skip }` | `{}` (**sin valores por defecto**, #226) | `skip`: texto del enlace de salto. **Obligatorio** (aviso 1); sin él, el enlace se pinta vacío pero sigue siendo el primer enfocable |
| `id` | String | | generado (SSR-seguro) | Base de ids: `{id}-main` (destino del salto) |

**Por qué `headerZone` y no `zone`:** la regla 1 de la zona pide `zone` en la raíz del componente; aquí la raíz es el chasis entero y la zona es de **una región** que el chasis posee (la banda). En el sidebar, la zona es el atributo `data-g-zone="brand"` en la raíz de `GSidebar` (los atributos van a su raíz), sin prop del chasis.

**No existen** (y por qué): `mode`, `sidebarWidth`, `collapsed` (son de `GSidebar` y el chasis los lee por clase); `stickyOffset`, `headerHeight` (la distancia es CSS: `--g-app-shell-header`); `scroll` o `scrollContainer` (el chasis desplaza el documento, #713); `appearance` (reservado para C, `stage`); `labels.menu` (el botón de menú es de la aplicación).

### Reglas de props

- `header` en vivo: al pasar de `relay` a `pinned` con la cabecera cedida, vuelve al instante (sin deslizarse) y se retira el manejador de desplazamiento.
- `labels.skip` vacío o solo espacios cuenta como ausente (aviso 1).

## Slots

| Slot | Ámbito | Qué va | Regla |
| --- | --- | --- | --- |
| `header` | — | Marca, buscador, cuenta, el botón de menú del drawer | Va **dentro** de la banda de alto fijo. Si el contenido mide más que la banda, aviso 6 (declarar `--g-app-shell-header`). Sin `GPageHeader` aquí (el encabezado de página va en `main`) |
| `nav` | — | **Un** `GSidebar` | Hijo directo de la raíz (#712): su `auto` mide su `parentElement`. Un envoltorio lo haría medir su propia pista y caer a móvil (aviso 4). Sin `contained` (aviso 5) |
| `default` | — | La página: `GContainer`, `GPageHeader`, `GStack`… | Se pinta dentro del `main` del chasis. **Ningún `main` dentro** (ni `<main>`, ni `role="main"`, ni `GContainer as="main"`; aviso 3) |
| `footer` | — | Pie de la aplicación | Fuera de `main`: `contentinfo` |

## Eventos y métodos

**Ningún evento ni método.** El chasis no emite intención propia (las piezas de dentro emiten la suya) y el estado de la cabecera (pegada, despegada, cedida) no es un suceso del usuario (reservado si aparece un caso). Para el foco al cambiar de ruta, la aplicación usa `GPageHeader.focus()`.

## Estructura accesible

- **Landmarks:** `header` (banner, solo con slot), `nav` (el de `GSidebar`, con su `label`), **un solo `main`** y `footer` (contentinfo, solo con slot) fuera de `main`. El chasis **no añade** `role`, `aria-label` ni regiones propias. Medido por kiwi con el árbol de accesibilidad en los tres motores: `banner`, `navigation "Principal"`, `main`, `contentinfo`.
- **Enlace de salto (2.4.1):** `a.g-app-shell__skip`, primer enfocable del documento, visible **solo con foco** (`translate`, no `display` ni `visibility`, para que siga en el orden de Tab). Clic primario sin modificadores o Intro: `preventDefault` (no cambia el `hash`, así no interfiere con un enrutador por `hash`), `main` recibe el foco con `preventScroll` y se coloca al inicio respetando el `scroll-padding` del chasis. Con modificadores o botón central, lo hace el navegador (regla de #505 por analogía, sin evento).
- **`main` con `tabindex="-1"`:** destino del salto; **sin anillo** sobre la región entera (no es un control operable; 2.4.7 se cumple en el enlace, que sí lo pinta, y en el siguiente Tab, que cae en el primer enfocable de la página).
- **El chasis no es enfocable** y no mueve el foco por su cuenta (salvo el salto, que es la intención de la persona).
- **Sin anuncios:** pegarse, despegarse y ceder la franja son consecuencia del desplazamiento o del zoom (4.1.3 no aplica).
- **Límite de WebKit (S7, para el README):** Safari por defecto no lleva el Tab a los enlaces (hace falta Opción+Tab o la preferencia del sistema). No se cambia el enlace por un botón: es navegación.

## Teclado

| Tecla | Dónde | Qué hace |
| --- | --- | --- |
| Tab (primera) | Documento | Enfoca el enlace de salto |
| Intro | Enlace de salto | Lleva el foco a `main` (siguiente Tab: primer enfocable de la página) |
| Av Pág, Re Pág, Espacio, ↑/↓ | Sin foco o en `main` | Desplazan el documento (base, medido: una caja interior no desplazaría sin foco) |
| Tab hacia la cabecera cedida (B) | Cabecera | La cabecera vuelve antes de que el foco se pinte (§«B») |

El resto del teclado es de las piezas (`GSidebar`, `GPageHeader`…).

## Reserva del sidebar: por CSS, sin `mode-change` (#712)

**`GSidebar` es hijo directo de la raíz** (en `drawer`, su raíz es un `span[hidden]` y su `<dialog class="g-sidebar__drawer">`, los dos hijos directos). La pista de la rejilla sale de los tokens de estructura de §13 según la clase de formato, leída con `:has(> …)` sobre hijos directos:

| Formato (clases públicas de `GSidebar` en su raíz) | Pista | Reserva abajo |
| --- | --- | --- |
| `g-sidebar--mode-expanded` sin `g-sidebar--overlay` | `--g-sidebar-width` | — |
| `g-sidebar--mode-rail`, o `g-sidebar--overlay` (expandido superpuesto) | `--g-sidebar-rail` (la expansión superpuesta no desplaza) | — |
| Lo anterior con `g-sidebar--variant-floating` | El de su formato + `space-3 × 2` (el margen de la superficie flotante) | — |
| `g-sidebar--mode-navbar` | 0 | `--g-sidebar-bar` **+ `env(safe-area-inset-bottom)`** (relleno de bloque al final del marco; la barra deja el área segura debajo, así con muesca el pie no queda bajo ella; 0 en escritorio; #749) |
| `drawer` (raíz `span[hidden]`, sin clase de formato) | 0 | — |

- **Estas clases pasan a contrato entre componentes** (L6, #712; como el mapa de anfitrionas de #484): `g-sidebar`, `g-sidebar--mode-expanded`, `g-sidebar--mode-rail`, `g-sidebar--mode-navbar`, `g-sidebar--overlay`, `g-sidebar--variant-floating`, `g-sidebar--contained`, `g-sidebar__drawer` y **`is-ready`** (el sidebar ya montado, dos cuadros después de montar: la espera de A solo actúa con él, así la primera reserva al hidratar —de `drawer` a `expanded`— no espera `--g-duration-slow` con la página tapada; medido por coco con el real: al cargar, la pista reserva 264 sin espera; #749). Cambiar su nombre o su significado en `GSidebar` es un cambio de contrato (vuelve a lima). Que `drawer` no tenga clase de formato en la raíz también es contrato: cualquier forma no listada reserva 0.
- **El sidebar no ocupa su pista: es `position: fixed`** al visor (inicio lógico, de arriba abajo), en expandida, riel, superpuesto y flotante. Lo fijo no está en el desplazador: enfocarlo nunca desplaza la página (S1). Medido por kiwi tras desplazar 1200 px: 1200 → 1200 en los tres motores al enfocar el botón de contraer (antes, pegado, 1200 → 730).
- **Superpuesto en una página que desplaza (S2):** dentro del chasis, la expansión superpuesta también es fija (no `absolute; inset-block: 0` contra un padre de alto fijo, como hace `GSidebar.css` fuera del chasis); medido: tras desplazar, la expansión sigue en 0 con el alto del visor. Fuera del chasis, S2 sigue abierto para coco (`PENDIENTES.md`).
- **El navbar y el drawer** los coloca el propio `GSidebar` (fijo abajo / `<dialog>`); el chasis solo reserva el alto del navbar al final del marco y lo publica en el registro de bordes (§«Bordes compartidos»).
- **RTL:** todo lógico; el sidebar en el borde derecho y la página a su izquierda (medido).
- **Medido por kiwi** en los tres motores: pista 264 (expandida), 64 (riel y superpuesto), 288 (flotante), 0 (drawer y navbar); con el navbar a 390 px el pie termina encima de la barra.

## Cabecera: una cifra, escrita una vez (#713)

**Alto de contrato de la banda: `max(var(--g-space-1) * 14, 44px, var(--g-app-shell-header))`** (56 px con `space` 4; `block-size` fijo con el borde incluido, en reposo y pegada). Es la constante que deja escribir todo lo demás sin medir, como el zócalo de `GPageHeader` (#629). Cambiar el factor `14` es decisión de lima.

**Propiedad pública de entrada `--g-app-shell-header`** (longitud; `@property` `<length>`, `inherits: true`, `initial-value: 0px`; no es del tema). Solo si la cabecera de la aplicación mide **más** que el alto de contrato: entra en el `max()`. **Se declara en `:root`** (o `html`), no en el chasis: el `scroll-padding` vive en `<html>` y tiene que ver el mismo valor (aviso 11 si el valor calculado en el chasis y en `<html>` difieren). Medido por kiwi con 72 px: banda 72, `--g-page-header-top` 72, `scroll-padding` 120.

**Propiedad publicada `--g-app-shell-top`** (solo lectura; `@property` `<length>`, `inherits: true`, `initial-value: 0px`; px resueltos): lo que la cabecera ocupa arriba **mientras está pegada**: el alto de la banda, o **0** si no hay cabecera, si se despegó por el presupuesto (§«Presupuesto») o si cedió el borde (B). La escribe `GAppShell.css` en la raíz; la aplicación la puede leer (una barra propia pegada bajo la cabecera), nunca escribir.

**El chasis escribe la receta de `api.md` «Cabecera fija»** (que hasta ahora escribía cada aplicación; **enmienda** de esa sección, #713):

| Qué | Dónde | Valor |
| --- | --- | --- |
| `--g-page-header-top` | Raíz del chasis (hereda a `main`) | `var(--g-app-shell-top)` |
| `--g-accordion-sticky-top` | Raíz del chasis | `--g-app-shell-top` + el zócalo **si** hay un `GPageHeader` pegado (`.g-page-header.is-sticky`) en `main` y fuera de un `<dialog>` |
| `scroll-padding-block-start` | El desplazador, `<html>` (por `:root:has(.g-app-shell)`) | Lo mismo que el acordeón: la banda pegada + el zócalo pegado |

- **El zócalo cuenta solo con `is-sticky`** (corrige el `:has(.g-page-header.has-base)` del prototipo, #713): un zócalo que no se pega (`sticky: false`, o la regla del cuarto de `GPageHeader`) no ocupa nada arriba. Su alto es la constante de contrato `max(var(--g-space-12), 44px)` (#629).
- **Va en la capa de Grana** (`grana.components`): una aplicación que ya escribía la receta sin capa sigue ganando (migración sin roturas), pero entonces la cifra se cuenta con su valor y el chasis lo avisa (aviso 10).
- **Dentro de `.g-dialog__body`** los componentes siguen poniendo sus propiedades a 0 (#517): el chasis no cambia eso.
- **Lo enfocable de la cabecera no se «desentierra» a sí mismo (S1):** la banda y todo lo de dentro llevan `scroll-margin-block-start: calc(-1 * (<banda pegada> + <zócalo pegado>))`, es decir, menos la banda del `scroll-padding` (regla común de `api.md` «Piezas pegadas», #715). Medido por kiwi: enfocar un botón de la cabecera con la página desplazada, 1200 → 1200 en los tres motores (antes, 1200 → 726).
- **`forced-colors`:** la banda se separa de la página con un **borde real** (`border-block-end`), no solo con fondo (medido en Chromium emulado).

## Presupuesto del cuarto (#713; WCAG 1.4.10)

Lo pegado arriba (banda + zócalo pegado) **no pasa del 25 % del visor pequeño** (`100svh`, estable aunque se recoja la barra del navegador). Si no cabe, **la cabecera se despega** (se va con la página: `--g-app-shell-top` = 0) y solo queda el zócalo, que es lo más cercano al contenido. **Sin JS:** una función escalón en CSS que vale la banda o 0,

```
--g-app-shell-top = min(<banda>, max(0px, (100svh − 4 × (<banda> + <zócalo pegado>)) × 9999))
```

con la misma expresión en `<html>` para el `scroll-padding`. Constantes: **`4`** (el cuarto) y **`9999`** (factor del escalón; convierte cualquier holgura positiva en «cabe»), §48 de `tokens.md`. Medido por kiwi en los tres motores: 1440×900 y 800×430, pegada; **320×256 (≈ zoom 400 %) y 800×400 (teléfono apaisado), despegada**, con `scroll-padding` 48 y sin desplazamiento horizontal. Extiende la regla del cuarto de `GPageHeader` (#629.3) al chasis entero; el zócalo conserva su propia regla.

**Límite (S9, para `GSidebar`):** el presupuesto solo cuenta arriba; a 320×256 el navbar fijo tapa 68 px abajo (27 % del visor). Se valora en `GSidebar` (`PENDIENTES.md`), no en el chasis.

## Región principal (#713)

- **Desplaza el documento, no una caja.** Medido por kiwi contra C: con el documento, Av Pág al cargar desplaza sin haber enfocado nada (una caja interior: 0 px en los tres motores); además el navegador móvil recoge su barra, tocar la barra de estado sube, la restauración del desplazamiento al volver y la impresión funcionan (argumento, no medido), y el `scroll-padding` vive donde la receta de #515 ya lo pone.
- **Sin desplazamiento horizontal de página sin romper el pegado:** el marco lleva `overflow-x: clip` (no `hidden`: no crea contenedor de desplazamiento, así `position: sticky` y el «contenedor largo» de `GPageHeader` siguen funcionando). Lo que sangre más allá del marco se recorta (afecta a `g-bleed` de `GContainer`, que llega al borde del marco y nunca bajo el sidebar). Medido: sin desbordamiento a 1440, 390 y 320.
- **`min-block-size: 100dvh`** en la raíz: el pie queda abajo en una página corta. El sidebar fijo usa el alto del visor.
- **Sin contención de tamaño** en la raíz, el marco ni `main` (`api.md` «Contención en línea»): el chasis no es contenedor de consultas. `GSidebar` mide su padre con su observador; `GContainer` es su propio contenedor.
- **Δ0 del foco al cambiar de formato:** contraer y expandir no mueven el foco (sigue en el botón) ni el contenido que se lee (Δ 0 px del párrafo de referencia, medido a 1440, donde la columna está en su máximo).

## A · Cortina (por defecto; #709)

**Qué cambia respecto a la base:** **cuándo** cambia la pista, no cómo es.

| Cambio de formato | La pista | Lo que se ve |
| --- | --- | --- |
| Contraer (expandida → riel) y cualquier cambio cuyo destino no sea `expanded` sin superposición | **Al instante** | La página se ensancha (o cambia) y el riel se encoge **sobre** ella |
| Expandir: destino `g-sidebar--mode-expanded` sin `g-sidebar--overlay` (desde el riel o desde un formato móvil al ensanchar) | **Después de `--g-duration-slow`** | El sidebar crece **sobre** la página; cuando ya la cubre, la página se aparta |

- **Mecanismo:** una transición **discreta** de la propiedad registrada privada de la pista (`--_app-shell-nav`, `<length>`) con retardo: `transition: --_app-shell-nav 0s linear <espera>`, donde la espera vale `--g-duration-slow` cuando el formato de destino es `expanded` (sin `overlay`) y `0s` en el resto. Solo CSS, sin JS ni estado temporal.
- **La espera es la duración del ancho de `GSidebar`** (`GSidebar.css`: `transition: inline-size var(--g-duration-slow) …`). **Están acopladas a propósito (L9, #709):** si coco cambia una, cambia la otra en el mismo commit; su auditoría lo comprueba en las dos hojas.
- **Interrumpible** desde cualquier punto: expandir y contraer a los 80 ms deja la página en el riel sin haber saltado (medido).
- **Un solo reflujo por cambio** (el patrón genérico, la pista que sigue al ancho cuadro a cuadro, dio 15 posiciones del borde de la página en 450 ms, medido por kiwi). El chasis **nunca anima la rejilla**.
- **Movimiento reducido:** sin espera (la pista y el sidebar cambian a la vez; el sidebar ya no anima su ancho, §29.3).
- **Límite aceptado:** durante `--g-duration-slow` el sidebar tapa los primeros px de la página al expandir (es lo buscado: con un clic la vista está en el sidebar).

**Medido por kiwi (tres motores):** contraer, 2 posiciones de la página (264 → 64) al empezar (≤ 60 ms); expandir, a mitad (90–160 ms) página en 64 y sidebar creciendo encima, la página se aparta a ≥ 200 ms; interrumpir a 80 ms sin salto; Δ0 del párrafo y foco en el botón; reducido sin espera.

## B · Relevo de franja (`header="relay"`; #710)

**Regla.** Con `header="relay"`, hay cabecera pegada (`--g-app-shell-top` > 0 sin ceder) y un `GPageHeader` **pegado ahora** (`is-stuck`, con zócalo) en `main` y fuera de un `<dialog>`:

1. **Cede** al **bajar** `space × 4` seguidos (px de `--g-space-1 × 4` leídos al montar y al redimensionar; un temblor menor no reacciona): la raíz pasa a **`is-yielded`**, la banda sale por arriba **siguiendo a la cifra, sin `translate`** (#748: con `translate` y la cifra animada a la vez la banda se movía el doble que el zócalo y asomaba la página entre las dos franjas, hasta 29 px en Chromium y 51 px en WebKit; sin él, la junta es ≤ 1 px en cada cuadro en los tres motores con el componente real), `--g-app-shell-top` pasa a **0** y, con él, `--g-page-header-top` y el `scroll-padding` (que solo cuenta el zócalo). El zócalo sube a 0 **en la misma transición** (propiedad registrada). **Tras un salto** (Fin, un ancla, `scrollIntoView`) que ya bajó el umbral antes de que el zócalo se pegue, cede **en cuanto `GPageHeader` se pega** (con las mismas condiciones: foco fuera de la cabecera, cabecera pegada). **El umbral se cuenta desde cero tras cada relevo** (al ceder y al volver): nada encadena una cesión con la vuelta (#748).
2. **Vuelve** al **subir** `space × 4` seguidos, **en cuanto el zócalo deja de estar pegado** (al volver arriba: nunca te quedas sin franja), **al entrar el foco en la cabecera** (`focusin`, antes de pintar el anillo; 2.4.11) y al pasar `header` a `pinned`. Mientras el foco esté dentro de la cabecera, no cede. **El foco que entra en la banda cedida la devuelve al instante, sin deslizarse** (#748): en CSS, `:focus-within` en la banda anula `is-yielded` (en la raíz y en `:root`) y quita la transición de la cifra, así en el cuadro en que llega el foco, antes de que el `focusin` quite la clase, la banda ya está en su sitio. Medido por coco con el real: `.focus()` y Mayús+Tab desde el sidebar, Δ0.
3. **Nunca sin franja:** sin un zócalo pegado que tome el relevo (sin `GPageHeader`, sin zócalo, `sticky: false`, la regla del cuarto del encabezado), la cabecera **no cede**: B equivale a la base.
4. **Con la cabecera ya despegada por el presupuesto**, B no hace nada.

- **Movimiento:** banda y cifra con `--g-duration-fast` + `--g-ease-out` (una banda, 120 ms con el tema por defecto). **Sin `--g-ease-spring`** (#299: no es una entrada de forma). Movimiento reducido: instantáneo, sin deslizarse.
- **JS mínimo:** un manejador **pasivo** de `scroll` en `window` que solo decide «cede / no cede» y escribe la clase al cambiar **con `classList` en la raíz** (no es estado reactivo: no repinta Vue; #748) (ninguna escritura de estilo por evento, ninguna lectura de geometría salvo `scrollY` y el estado `is-stuck` ya puesto por `GPageHeader`). Sin guardas de avisos dentro (#653, regla de coste c).
- **El encabezado tiene que saber la cifra nueva (S6):** `GPageHeader` lee `--g-page-header-top` al medir (redimensionar, cambiar de tamaño) y B la cambia en caliente. **Canal interno** (#710; no es API pública): el chasis provee una clave de `provide/inject` en un módulo compartido por `__shared` (`utils/appShell.js`, `appShellKey`) con **`top`** (`Readonly<Ref<number>>`, px, **el sitio final**, no el valor a mitad de transición) y **`notify()`** (el encabezado lo llama cuando cambia su `is-sticky`, para que el chasis vuelva a calcular su cifra). `GPageHeader`, si lo recibe, mide (`is-stuck`, `--_p`) con **`max(top, valor actual de --g-page-header-top)`** y vuelve a medir al cambiar `top` (#747, S6 de bruno): al volver de B, `top` ya es el sitio final pero la variable sigue animándose y el zócalo aún está arriba; medir solo con el final daba en Chromium un `is-stuck` falso a mitad de la transición y el chasis entraba en un bucle de ceder y volver. Con el mayor de los dos, relevo sin costura y zócalo pegado correcto (medido por coco con el real en los tres motores); su CSS sigue leyendo la variable, que llega animada al mismo valor. Sin chasis, `GPageHeader` no cambia. Es un cambio en `GPageHeader.vue` (bruno) y un módulo compartido nuevo.
- **Bordes:** al ceder, el chasis publica `top` = 0 con su sitio final (no a mitad de transición), así la isla y los avisos suben con su propia transición (§«Bordes compartidos»).

**Medido por kiwi (tres motores):** bajar 1600 px, cabecera fuera del visor, zócalo en 0, lo pegado suma 48 (no 104), `GPageHeader` sigue `is-stuck`; subir 160 px en dos pasos de 80, cabecera en 0 y zócalo de vuelta en 56; foco en un botón de la cabecera cedida, vuelve; reducido, sin deslizarse.

**Qué lo hace distinto (B).** No es el «ocultar al desplazar» genérico, que deja la pantalla sin nada que diga dónde estás: la cabecera y el encabezado de la página **se pasan el borde**. Siempre hay una sola franja arriba: la de la aplicación cuando navegas, la de la página cuando lees. Recupera 56 px de lectura en cada pantalla (más del 20 % en un teléfono apaisado) sin perder el título ni las acciones, y el teclado la devuelve con solo entrar en ella.

## Bordes compartidos (`edgeReserve`; #714)

**Primer cliente del registro por orden:** `EDGE_ORDER = { appShell: 5, speech: 10, pageHeader: 15, bookingDock: 20, fab: 25, status: 30 }` (`bookingDock`, #740, lee al chasis y queda encima de su navbar; cambio interno en el principal, bruno; enmienda #631 y #699).

| Pieza | Borde | Publica | Lee |
| --- | --- | --- | --- |
| Banda de cabecera | `top` | `--g-app-shell-top` resuelto en px (el sitio final: 0 si despegada o cedida), `order: EDGE_ORDER.appShell` | Nada |
| Navbar de `GSidebar` (`g-sidebar--mode-navbar`) | `bottom` | El **`padding-block-end` resuelto del marco** en px (`--g-sidebar-bar` + el área segura: lo que de verdad reserva; 68 sin muesca con el tema por defecto), `order: EDGE_ORDER.appShell`. Publicar solo `--g-sidebar-bar` dejaría con muesca el muelle y el FAB el área segura más bajos que el pie (#749) | Nada |

- **Un dueño por borde y por instancia**; se retira al desaparecer (sin cabecera, sin navbar) y al desmontar. Se vuelve a calcular al montar, al `resize` del visor, al cambiar el tamaño de la banda (`ResizeObserver`), al ceder o volver (B) y cuando `GPageHeader` llama a `notify()`.
- **Con chasis, la aplicación deja de pasar `offset.top`** a `GStatusIsland` y `GToaster` (y a un `GFab` de arriba): la banda ya está en el registro y se contaría dos veces (enmienda de la receta de `api.md` «Cabecera fija», #714). La isla (`before: 30`) queda bajo la banda, la voz, el zócalo pegado y un FAB de arriba; `GToaster` suma todo.
- **Abajo, el muelle de `GPageHeader` y el FAB quedan encima del navbar** (leen `before` 15 y 25, que incluyen el 5 del chasis), y los avisos encima de todo.
- **La pill de la voz no lee reservas (#322, no se reabre; S4):** arriba, quedaría sobre la banda. Receta: la aplicación le pasa a `GSpeechHost` `offset.top` con el alto de la banda (o lee `--g-app-shell-top`). Como la voz publica su alto (order 10), la isla sigue sumando bien.
- **`edgeReserve.js` llega a la entrada por `__shared`** (#240): una copia propia crearía otro registro (lo prueba bruno con las entradas `app-shell`, `page-header` y `status` cargadas).
- **Nada se publica** si el chasis estuviera dentro de un `<dialog>` (aviso 7).

## Zona de marca (#711)

- **En la cabecera:** `headerZone="brand"` pone `data-g-zone="brand"` en `header.g-app-shell__header` (la banda entera, no un envoltorio: el pegado y la medida de la caja siguen intactos, Z2 de `GPageHeader`). Lo que vive dentro (botones, buscador, menús abiertos en su sitio) hereda la zona (`api.md` «Zona de marca», regla 3).
- **En el sidebar:** `data-g-zone="brand"` en `<GSidebar>` (los atributos van a su raíz). **No verificado en `drawer`** (allí la raíz es un `span[hidden]` y los atributos podrían no llegar al `<dialog>`): pendiente de bruno en `GSidebar` (`PENDIENTES.md`).
- **Nunca** en la raíz del chasis (pintaría la página entera) ni en `<html>` (#637).
- **Tokens:** los que lee `GAppShell.css` del grupo de color (`bg`, `surface`, `text`, `text-muted`, `border`, `border-strong`, `focus`) están en la lista de `tokens.md` §44.5: no se añade ninguno.

## Movimiento (rúbrica `docs/documentacion/rubrica-movimiento.md`, de la declaración de kiwi)

| Qué | Cómo | Movimiento reducido |
| --- | --- | --- |
| Pista del sidebar (A) | Discreta: al instante al encoger, tras `--g-duration-slow` al crecer | Sin espera |
| Ancho del sidebar | De `GSidebar.css` (`--g-duration-slow`), no del chasis | El de `GSidebar` |
| Banda y cifra al ceder o volver (B) | `--g-app-shell-top` con `--g-duration-fast` + `--g-ease-out`; la banda sigue a la cifra, **sin `translate`** (#748) | Instantáneo |
| Foco que entra en la banda cedida (B) | Vuelve al instante: `:focus-within` anula la cesión y la transición (#748) | Igual |
| Pegarse y despegarse | Sin animación: el desplazamiento es el movimiento (como #632) | Igual |
| Enlace de salto | Entra con el foco (`translate`), `--g-duration-fast` | Sin `translate`: aparece |
| Rejilla | **Nunca** se anima (reflujaría la página cuadro a cuadro) | Igual |

| Dimensión | Base | A | B | Riesgo |
| --- | --- | --- | --- | --- |
| A. Propósito | Cumple (sin movimiento propio) | Cumple: causa-efecto, 2 posiciones | Parcial: útil, ligado al desplazamiento | B es opción, no defecto |
| B. Comodidad | Cumple | Cumple: un cambio en vez de 15 | Cumple: 120 ms, una banda | — |
| C. Estabilidad | Cumple: marco quieto, Δ0 | Cumple: objeto grande sobre referencia quieta | Parcial: banda ancha en la periferia | Reducido: sin deslizarse (medido) |
| D. Transiciones | N/A | Cumple: interrumpible (80 ms) | Cumple: se revierte subiendo | — |
| E. Control | Cumple | Cumple | Parcial: no pedido; vuelve subiendo o con el foco (medido) | Opción de la aplicación |
| F. Accesibilidad | Cumple: cuarto, 2.4.11, 2.4.1 | Cumple: reducido sin espera | Cumple: nunca sin contexto | — |
| G. Rendimiento | Cumple: CSS; `:has()` sobre hijos directos | Cumple: un reflujo | Parcial: manejador pasivo | Medir `:root:has(.g-app-shell …)` en una página grande (coco y bruno; no verificado) |
| H. Inmersión | N/A | N/A | N/A | — |

## Tokens consumidos (L3; `tokens.md` §48)

**Ningún token del tema nuevo.** Existentes: `--g-sidebar-width`, `--g-sidebar-rail`, `--g-sidebar-bar` (§13), `--g-color-bg`, `--g-color-surface` (enlace de salto), `--g-color-text`, `--g-color-text-muted` (pie), `--g-color-border` (borde de la banda y del pie), `--g-color-border-strong` (enlace de salto), `--g-color-focus`, `--g-focus-width`, `--g-focus-offset`, `--g-border-width`, `--g-radius-md`, `--g-shadow-2` (enlace de salto), `--g-space-*`, `--g-font-ui`, `--g-text-body-sm-*`, `--g-text-action-weight`, `--g-duration-fast`, `--g-duration-slow`, `--g-ease-out`. Coco puede ajustar los del enlace de salto y del pie en su estilo; cualquier token fuera de esta lista se anota aquí.

**Propiedad pública de entrada:** `--g-app-shell-header`. **Propiedad publicada (solo lectura):** `--g-app-shell-top`. **Propiedades que el chasis escribe** (entradas públicas de otros componentes): `--g-page-header-top`, `--g-accordion-sticky-top`.

**No son tokens:**

- **Constante de contrato:** alto de la banda `max(var(--g-space-1) * 14, 44px, var(--g-app-shell-header))`.
- **Constantes de diseño:** presupuesto `× 4` (25 % del visor pequeño); factor del escalón `9999`; umbral de B `space × 4`; margen de la pista flotante `space-3 × 2` (el de `GSidebar` flotante).
- **Literales de unidad** (amplían #187, #717): `100svh` (presupuesto), `100dvh` (alto mínimo de la raíz y del sidebar fijo).
- **Propiedades registradas privadas** (§29.7; llevan el nombre del componente porque `@property` es global): `--_app-shell-nav` (`<length>`, la pista), `--_app-shell-delay` (`<time>`, la espera de A), `--_app-shell-bar` (`<length>`, la reserva del navbar), `--_app-shell-base` (`<length>`, el zócalo pegado contado).
- `24px` / `44px` (§7).

## Clases y datos (contrato bruno ↔ coco)

| Clase o dato | Dónde | Cuándo |
| --- | --- | --- |
| `g-app-shell` | Raíz | Siempre |
| `g-app-shell--header-relay` | Raíz | `header="relay"` |
| `is-yielded` | Raíz | B: la cabecera cedió el borde |
| `has-header`, `has-footer` | Raíz | Slot presente |
| `g-app-shell__skip` | `a` | Siempre |
| `g-app-shell__header` | `header` | Con slot `header` |
| `data-g-zone="brand"` | `__header` | `headerZone="brand"` |
| `g-app-shell__frame`, `g-app-shell__main`, `g-app-shell__footer` | Marco, `main`, `footer` | Siempre / con slot |
| Clases públicas de `GSidebar` (§«Reserva») | Hijos directos de la raíz | Las lee `GAppShell.css` con `:has(> …)`; las pone `GSidebar` |
| `.g-page-header.is-sticky` | Descendiente de `__main` | Lo lee `GAppShell.css` para contar el zócalo; lo pone `GPageHeader` |

**Selectores sobre hijos de la aplicación** (`__header > *`): con la exclusión de `.g-tooltip` de #383 (`:not(:where(.g-tooltip))`). El chasis estiliza la **posición** de `GSidebar` (fijo) y nada más de él.

## Avisos de desarrollo (`[Grana GAppShell]`, una vez por instancia y motivo; L8)

Con la guarda canónica de #653 (`try { if (process.env.NODE_ENV !== 'production' …) … } catch {}`, `api.md` «Avisos de desarrollo»), al montar y al cambiar la prop que comprueban; **ninguno** en el manejador de desplazamiento ni en `resize`.

1. Falta `labels.skip` (o está vacío).
2. Hay más de un `GAppShell` en el documento.
3. Hay un `main` (`<main>` o `[role="main"]`) dentro de `main` del chasis (incluye `GContainer as="main"`, S10).
4. Hay slot `nav` y ningún hijo directo de la raíz es `.g-sidebar` ni `.g-sidebar__drawer` (un envoltorio de la aplicación: `GSidebar` mediría su propia pista y caería a móvil).
5. Un `GSidebar` con `contained` (`.g-sidebar--contained`) dentro del chasis.
6. El contenido de la cabecera es más alto que la banda (sugiere declarar `--g-app-shell-header` en `:root`).
7. El chasis está dentro de un `<dialog>` (no publica bordes ni escribe la receta).
8. `headerZone` fuera de lista (se usa `none`), o `headerZone="brand"` sin slot `header`.
9. `header` fuera de lista (se usa `pinned`).
10. La aplicación escribe su propia receta: `--g-page-header-top` calculado en `main` distinto de `--g-app-shell-top`, o el `scroll-padding-block-start` de `<html>` distinto del que escribe el chasis (con chasis no hace falta; se contaría con el valor de la aplicación).
11. `--g-app-shell-header` calculado en el chasis distinto del de `<html>` (se declaró en el chasis o en un ancestro que no es `:root`: el `scroll-padding` no lo ve).

## Accesibilidad y mínimos (no son tema)

| Criterio | Cómo se cumple |
| --- | --- |
| 1.3.1 / 1.3.2 | Landmarks del chasis, un solo `main`, orden del DOM = lectura = Tab |
| 1.4.10 | Presupuesto del cuarto; sin desplazamiento horizontal a 320; `overflow-x: clip` en el marco |
| 1.4.11 | Borde real de la banda (también en `forced-colors`) |
| 2.4.1 | Enlace de salto incorporado, primer enfocable |
| 2.4.3 / 2.4.7 | Foco nunca movido por el chasis; anillo en el enlace de salto |
| 2.4.11 | `scroll-padding` del chasis; S1 (lo pegado no se desentierra); B vuelve al entrar el foco |
| 2.5.8 | El enlace de salto ≥ 24 px de alto y ≥ 44 con `pointer: coarse` |
| 2.3.3 | A y B sin movimiento con `prefers-reduced-motion` |

## Colores forzados, RTL, SSR

- **`forced-colors`:** borde `CanvasText` de la banda y del pie; foco del sistema. Medido por kiwi en Chromium emulado; Firefox y WebKit no emulan (coco).
- **RTL:** todo lógico (pista, sidebar fijo al inicio, B solo en el eje de bloque); medido.
- **SSR:** ids SSR-seguros; la reserva y la cifra son CSS y salen bien en el primer pintado; sin `window`/`document` al importar ni en el servidor; el registro de bordes y B empiezan al montar en el cliente.

## Paquete y peso (#716)

- **Entrada propia `@grana/vue/app-shell`** (global UMD `GranaAppShell`; L1): exporta `GAppShell` y un plugin que lo registra (`app.use(AppShell)`); `@grana/vue` no lo exporta ni lo registra. Llegan por `__shared` (#240, sin copias): `utils/edgeReserve.js` (**obligatorio**: un solo registro por documento) y **`utils/appShell.js`** (nuevo, con `appShellKey`; obligatorio por `__shared` porque `GPageHeader`, en otra entrada, lo inyecta: dos copias serían dos claves). El CSS sigue en `grana.css`.
- **Por qué no el principal:** #550 (margen agotado, entrada propia por defecto) y lo que lleva: registro de bordes, manejador de B, once avisos. En el principal solo crece `EDGE_ORDER.appShell` (bytes) y, si `utils/appShell.js` cae en el principal por `__shared`, la clave (bytes).
- **Tope de peso:** **4 KiB (4096 B) gzip** de `dist/app-shell.js` con base + A + B y los avisos (sin estimación medida de kiwi; lima estima ≈ 3 KiB). Si lo supera, vuelve a lima.
- Se declara en **`exports`** (`./app-shell`, con `types`, `import` y `default`), **`typesVersions`**, **`ENTRIES`** de `scripts/build-types.mjs` y **`src/types.test.js`** (#442, #443).
- **Compuertas de `dist`** (bruno las añade a `gates.sh`): `grep -q "g-app-shell__frame" packages/vue/dist/grana.css`, `! grep -q "GAppShell" packages/vue/dist/grana.js`, `test -f packages/vue/dist/app-shell.js`.

## `meta.json` y tipos (#443)

`GAppShell.meta.json`: las cuatro props (`header` `'pinned' | 'relay'`, `headerZone` `'none' | 'brand'`, `labels` `{ skip?: string }`, `id`); los cuatro slots sin ámbito; `events: []`; `methods: []`; `status: "draft"` hasta la auditoría de coco. Lo que el JSON no exprese, en `packages/vue/types/overrides.mjs` (`GAppShell.…`).

## Resolución de hallazgos de kiwi (S1 a S11, L1 a L12)

| # | Hallazgo | Resolución |
| --- | --- | --- |
| S1 / L7 | Enfocar lo pegado desplaza la página (Chromium, WebKit) | Regla común en `api.md` «Piezas pegadas» (#715); en el chasis, sidebar fijo y la banda resta la banda |
| S2 | `overlay` de `GSidebar.css` contra un padre de alto fijo | En el chasis, fijo (§«Reserva»); fuera, pendiente de coco (`PENDIENTES.md`) |
| S3 / L8 | Envoltorio entre chasis y sidebar | Aviso 4 |
| S4 | La pill de la voz no lee reservas | Receta: `offset.top` de la voz con el alto de la banda; #322 no se reabre (§«Bordes») |
| S5 | Enfocar una acción del zócalo pegado desplaza la página | Encargo a coco en `GPageHeader.css` (§«Encargos»; enmienda de `page-header.md`, #715) |
| S6 | `GPageHeader` lee su `top` solo al medir | Canal interno `appShellKey` (#710); cambio en `GPageHeader.vue` |
| S7 | WebKit no lleva el Tab a los enlaces | Límite para el README (mora-docs) |
| S8 | Foco del drawer en WebKit (`from` en `GSidebar`) | Fuera de este lote (`PENDIENTES.md`) |
| S9 | Navbar al 27 % a 320×256 | Fuera de este lote, en `GSidebar` (`PENDIENTES.md`) |
| S10 | `GContainer as="main"` dentro del chasis | Aviso 3 aquí y aviso del contenedor; receta `as="div"` (#718) |
| S11 | Playground sin guarda de `scroll-behavior` ni salto | Fuera de este lote (bruno, `PENDIENTES.md`) |
| L1 | Nombre y paquete | `GAppShell`, entrada propia (#716) |
| L2 | API | §«Props» y §«Slots» (#711) |
| L3 | Tokens y constantes | Ninguno del tema; §48 de `tokens.md` (#717) |
| L4 | Receta | El chasis la escribe; enmienda de `api.md` (#713) |
| L5 | Bordes | `EDGE_ORDER.appShell = 5`; sin `offset.top` (#714) |
| L6 | Clases de `GSidebar` | Contrato entre componentes (#712) |
| L8 | Avisos | 1 a 11 |
| L9 | Espera de A | `--g-duration-slow`, acoplada al ancho de `GSidebar` (#709) |
| L10 | B | §«B» (#710) |
| L11 | C | Reservada (§«Fuera de v1») |
| L12 | Complejidad | Complejo: coco y bruno en Opus (#716) |

## Fuera de v1 (reservado con nombre)

**C · Escenario** (`appearance="stage"`: la página como hoja sobre el marco, que desplaza por dentro en escritorio y se funde en móvil; `tabindex="-1"` en la hoja por #570; límites medidos por kiwi: el teclado no desplaza la hoja al cargar, WebKit sigue desplazándola al enfocar una acción del zócalo, se pierden restauración e impresión en escritorio, las bandas `g-bleed` se recortan en las esquinas; A se combina con ella). Un `toggleNav` en el ámbito del slot `header` (S8). Presupuesto inferior para el navbar (S9). Evento de pegado o de relevo. Lectura de la clave de anidación de `GSection` por `GCard`, `GFormSection` y `GDialog` (L14).

## Límites conocidos (para el README)

- **`GSidebar` hijo directo** del chasis (aviso 4); sin `contained` (aviso 5).
- **`--g-app-shell-header` en `:root`**, no en el chasis (aviso 11).
- **Con chasis, sin receta propia** ni `offset.top` en isla, avisos y FAB (aviso 10); la voz sí lleva su `offset` (S4).
- **El marco recorta lo horizontal** (`overflow-x: clip`): una banda que sangre más allá del marco se corta.
- **WebKit y el enlace de salto:** Opción+Tab (S7).
- **`GPageHeader` dentro de un `GContainer`** (L4 del contenedor): su `h1` queda `space × 6` por dentro del texto de la columna hasta que se decida (`container.md` «Límites»; #751).
- **B y `GPageHeader`:** sin zócalo pegado, B no hace nada.
- **Navbar y zoom:** el presupuesto solo cuenta arriba (S9).

## Verificación (cómo se da por hecho)

### bruno (vitest + jsdom)

`GAppShell.test.js`: landmarks y orden del DOM; `header`/`footer` solo con slot; `id` y `{id}-main` con `tabindex="-1"`; el salto hace `preventDefault`, no toca `location.hash` y enfoca `main` con `preventScroll` (y con modificadores no actúa); `headerZone` en el `header`; clases `is-yielded`, `--header-relay`, `has-*`; `edgeReserve` publica `top` y `bottom` con `order` 5 y los retira al desaparecer y al desmontar; `appShellKey` provisto con `top` y `notify`; B: cede al bajar el umbral, vuelve al subir, al perder el zócalo `is-stuck` y con `focusin`, no cede sin zócalo pegado ni despegado; los once avisos; sin efectos al importar ni en el servidor. `GPageHeader.test.js` (S6): con el canal usa `top` y vuelve a medir al cambiar; sin él, igual que hoy.

### Playwright (`design/lab/theme-playground/`, **puerto propio**; las de `verificar.mjs` de kiwi como base)

`tests/app-shell.spec.mjs` y `tests/personalidad-app-shell.spec.mjs`, en Chromium, Firefox y WebKit, con `GSidebar`, `GPageHeader`, `GContainer`, `GAccordion sticky`, `GStatusIsland`, `GToaster` y `GFab` **reales**: landmarks; salto con el primer Tab; pista 264/64/288/0 por formato y navbar abajo; superpuesto fijo tras desplazar; RTL; S1 (enfocar sidebar, cabecera y acción del zócalo con la página desplazada: Δ0 de `scrollY`); cifra 56 / 104 y zócalo pegado en 56; `--g-app-shell-header` de 72; presupuesto a 1440×900, 800×430, 800×400 y 320×256; isla y avisos bajo la banda **sin** `offset.top`; muelle y FAB encima del navbar; A (dos posiciones, espera, interrupción a 80 ms, reducido); B (ceder, volver, foco, reducido, sin zócalo no cede); `forced-colors` en Chromium; consola limpia. Rendimiento: el desplazamiento con B no vuelve a pintar Vue; `:root:has(.g-app-shell …)` en una página de 2000 nodos (medida, no compuerta).

### coco (Opus) · CSS y auditoría

`GAppShell.css` sin literales ni respaldos (salvo §«No son tokens»); `@property` de las cuatro privadas y las dos públicas; auditoría del componente real con verificación propia en `design/lab/app-shell/` y con un tema distinto del por defecto; la espera de A igual al ancho de `GSidebar` en las dos hojas.

### No verificado (entorno real)

Lector de pantalla real (landmarks medidos con el árbol de accesibilidad, no con VoiceOver ni NVDA); móvil real (`svh`/`dvh` con la barra que se recoge, área segura, toque en la barra de estado, gesto de recargar, teclado virtual sobre la banda pegada); zoom real del navegador; `forced-colors` en Firefox y WebKit; restauración del desplazamiento e impresión; tema oscuro.

## Encargos

- **coco (Opus):** `GAppShell.css` (raíz en rejilla con la pista por `:has()`, sidebar y superpuesto fijos, banda pegada de alto de contrato con S1, cifra y presupuesto en la raíz y en `:root:has()`, receta en la capa de Grana, marco con `overflow-x: clip` y la reserva del navbar, enlace de salto, pie, `forced-colors`, A con la espera, B con `is-yielded`, reducido, RTL, zona en la banda) y `@property` de §«No son tokens»; **S5 en `GPageHeader.css`**: `.g-page-header.is-sticky .g-page-header__base` (**`is-sticky`, no `is-stuck`**, #749: mientras el encabezado se hunde y aún no está pegado, el zócalo ya cae dentro de la banda del `scroll-padding`; medido por coco Δ0 también antes de pegarse) y sus descendientes con `scroll-margin-block-start: calc(-1 * (var(--g-page-header-top) + max(var(--g-space-12), 44px)))` (y lo mismo en el muelle si su medida lo pide), medido en los tres motores con y sin chasis; medir si el encabezado pegado de `GAccordion` sufre S1 (**medido por coco: no lo sufre**, Δ0 en los tres motores, también con B; #750). Banco y `design/lab/app-shell/estilo.md`; después, la auditoría. Sin cambios en `defaults.css`.
- **bruno (Opus):** `GAppShell.vue` (render, ids, salto, `edgeReserve` con dos bordes, `appShellKey`, B, avisos), `utils/appShell.js`, `EDGE_ORDER.appShell` en `utils/edgeReserve.js`, **S6 en `GPageHeader.vue`** (inyectar el canal y llamar a `notify()` al cambiar `is-sticky`), entrada `@grana/vue/app-shell` (`exports`, `typesVersions`, `ENTRIES`, `types.test.js`, `__shared`), `meta.json`, `overrides.mjs`, compuertas en `gates.sh`, excepciones de `levels.test.js` (`--g-app-shell-header`, `--g-app-shell-top`), specs y una página de banco del chasis en el playground (el chasis no cabe en una sección del índice: `packages/vue/playground/app-shell.html`).
- **mora-docs (Sonnet):** `GAppShell/README.md` tras la auditoría: uso, sin receta, `GSidebar` hijo directo, `--g-app-shell-header` en `:root`, la voz con su `offset`, B y cuándo elegirlo, límites (S7, recorte horizontal, navbar con zoom).

## Dudas para el usuario (no bloquean)

Ninguna abierta sobre el chasis: la forma la eligió el usuario (#708). Si quiere C más adelante, se contrata como `appearance="stage"` con sus límites escritos.
