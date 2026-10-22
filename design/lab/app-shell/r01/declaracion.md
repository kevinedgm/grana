# Declaración — chasis de aplicación (`GAppShell`), pila (`GStack`) y sección (`GSection`), r01

> kiwi, 2026-10-21. Prototipo: `index.html?c=base|A|B|C` (`&mode=auto|expanded|rail|navbar|drawer`, `&mobile=drawer`, `&overlay=1`, `&variant=floating`, `&dir=rtl`, `&zone=header|side`, `&ph=0`). `GSidebar`, `GPageHeader`, `GBtn` y `GIcon` **reales** de `packages/vue/dist/` con Vue global; el chasis, la pila y la sección son del prototipo (`shell.js`, `shell.css`), con los **tokens reales del tema por defecto**. Iconos solo Lucide (`design/lab/lucide-icons.js`, registrados con `createIcons`). Verificación: `node design/lab/app-shell/r01/verificar.mjs` (puerto 4211), **352 de 352** en Chromium, Firefox y WebKit (§«Comprobaciones»). Auditoría previa del chasis del playground y solapes: `brief.md`. La base deriva de HTML (landmarks), WAI-ARIA APG (*Landmark Regions*), WCAG 2.2 (1.3.1, 1.4.10, 2.4.1, 2.4.3, 2.4.11, 2.3.3) y los contratos vigentes. **Preguntas de producto: una (la forma del chasis).**
>
> **Nombres del prototipo → propuesta:** `.as` = `.g-app-shell`, `.st` = `.g-stack`, `.sec` = `.g-section`; prop `level` del prototipo = `headingLevel` (nombre compartido con `GCard` y `GPageHeader`).

---

# Parte 1 · `GAppShell`

## Anatomía (base)

```
div.g-app-shell                           ← raíz: rejilla [pista del sidebar | marco]; la caja que GSidebar mide (su parentElement)
├─ a.g-app-shell__skip  href="#<main>"    ← «Saltar al contenido» (labels.skip); primer enfocable; visible solo con foco
├─ header.g-app-shell__header             ← [slot header] → landmark banner; banda pegada de alto de contrato; data-g-zone opcional
├─ [slot nav]  → <GSidebar>               ← HIJO DIRECTO de la raíz; fijo al visor (expandida, riel, superpuesto, flotante);
│                                            el navbar y el drawer los pone el propio GSidebar (fijo abajo / <dialog>)
└─ div.g-app-shell__frame                 ← el marco: columna de la página (min-inline-size: 0; overflow-x: clip)
   ├─ main.g-app-shell__main  tabindex=-1 ← [slot default] → landmark main ÚNICO; destino del salto
   └─ footer.g-app-shell__footer          ← [slot footer] → landmark contentinfo (fuera de main)
```

La reserva del sidebar es la **pista** de la rejilla, no un relleno de la página: el marco empieza donde acaba la pista y todo lo que va dentro (el contenedor, una banda `g-bleed`, una tabla) mide **su** caja, nunca el visor.

## Decisiones de la base

**Regiones y teclado**

1. **Landmarks del chasis:** `header` (banner, solo con slot), `nav` (el de `GSidebar`, con su `label`), **un solo `main`** y `footer` (contentinfo, solo con slot) fuera de `main`. Medido con el árbol de accesibilidad en los tres motores: `banner`, `navigation "Principal"`, `main`, `contentinfo`. El chasis **no añade** `role` ni `region` propios.
2. **Enlace de salto incorporado** (2.4.1): primer enfocable, visible solo con foco (`translate`, no `display`), lleva a `main` (`tabindex="-1"`, sin anillo sobre la región entera). Texto en `labels.skip`, **sin valor por defecto** (#226). Medido: el primer Tab llega a él y Intro enfoca `main` en los tres motores. **Límite de WebKit (S7):** Safari por defecto no lleva el Tab a los enlaces (hace falta Opción+Tab o la preferencia del sistema); no se cambia el enlace por un botón (es navegación), se documenta.
3. **Lo pegado no mueve la página al enfocarlo (S1, hallazgo nuevo).** Medido: con la receta de #515 (`scroll-padding-block-start` en `<html>`), **enfocar** un control que vive en algo pegado y cae dentro de esa banda (el botón de contraer del sidebar, un botón de la cabecera, una acción del zócalo de `GPageHeader`) hace que **Chromium y WebKit desplacen la página** para «sacarlo» de la banda: de 1200 px a 730 (sidebar), 726 (cabecera) y 778 (zócalo); Firefox no. Dos remedios en la base: **(a)** el sidebar es **`position: fixed`** (lo fijo no está en el desplazador: enfocarlo nunca desplaza) y **(b)** los enfocables de la cabecera restan la banda (`scroll-margin-block-start` negativo = `--g-app-shell-top` + zócalo). Medido tras el remedio: 1200 → 1200 en los tres motores para el sidebar, la cabecera y el zócalo (este último con la regla que corresponde a `GPageHeader.css`, simulada en el prototipo; S5).
4. **El chasis no es enfocable ni cambia el orden del DOM:** salto → cabecera → navegación → página → pie. En `drawer`, el botón de menú lo pone la aplicación en la cabecera (receta; S8 sobre devolver el foco en WebKit).

**Reserva del sidebar: por CSS, sin escuchar `mode-change`**

5. **`GSidebar` es hijo directo de la raíz** porque su `auto` mide **su `parentElement`** (`GSidebar.vue`, `resolveContainer`): metido en una celda o un envoltorio mediría su propia pista y caería a móvil. Aviso de desarrollo si no lo es (L8).
6. **La pista sale de los tokens de estructura según la clase de formato**, con `:has()` sobre las clases públicas de `GSidebar` (`g-sidebar--mode-*`, `--overlay`, `--variant-floating`): expandida = `--g-sidebar-width`; riel **o superpuesto** = `--g-sidebar-rail`; flotante = el de su formato + `space-3 × 2`; `navbar` y `drawer` = 0, y el navbar reserva **abajo** `--g-sidebar-bar` (relleno del marco). Sin JS, correcto en el primer pintado (SSR) y en cuanto `GSidebar` cambia de formato. Medido en los tres motores: 264, 64, 288 (flotante), 0 (drawer, navbar); con el navbar a 390 el pie termina por encima de la barra.
7. **Superpuesto en una página que desplaza (S2):** `GSidebar.css` pone la expansión superpuesta en `position: absolute; inset-block: 0` contra un padre de alto fijo (la demo del playground tiene `block-size: 520px`); en una página que desplaza mediría **el documento entero** y quedaría arriba del todo. En el chasis es fijo como el resto: medido, tras desplazar 1200 px la expansión sigue en 0 con el alto del visor y la página sigue en 64.
8. **RTL:** todo lógico; medido, el sidebar en el borde derecho y la página a su izquierda.

**Cabecera: una cifra, escrita una vez por el chasis**

9. **Alto de contrato `max(space × 14, 44px)`** (56 px con `space` 4), como el zócalo de `GPageHeader` (#629): es lo que deja escribir todo lo demás **sin medir**. Si la cabecera de la aplicación mide más, la aplicación declara la **propiedad pública de entrada `--g-app-shell-header`** (longitud, `@property`, `inherits: true`, `0px`; no es del tema), que entra en un `max()`: medido con 72 px → banda 72, `--g-page-header-top` 72, `scroll-padding` 120. Sin valores de respaldo.
10. **El chasis escribe la receta de `api.md` «Cabecera fija»** que hoy escribe cada aplicación: publica **`--g-app-shell-top`** (solo lectura, px resueltos: lo que la cabecera ocupa arriba mientras está pegada) y de ella `--g-page-header-top`, `--g-accordion-sticky-top` (+ zócalo si hay un `GPageHeader` con zócalo, detectado con `:has(.g-page-header.has-base)`) y el `scroll-padding-block-start` del desplazador (`<html>`, por `:root:has(.g-app-shell)`). Medido: 56 / 104 / 104 y el zócalo pegado exactamente en 56; `scrollIntoView` y `focus()` dejan el destino en ≥ 104 (2.4.11). Va en la capa de Grana: una aplicación que ya escribió la receta sin capa sigue ganando (migración sin roturas).
11. **Presupuesto del cuarto (1.4.10), sin JS.** Lo pegado arriba (cabecera + zócalo) no pasa del 25 % del **visor pequeño** (`100svh`, estable aunque se recoja la barra del navegador). Si no cabe, **la cabecera se despega** (se va con la página) y solo queda el zócalo, que es lo más cercano al contenido. Es una función escalón en CSS: `min(alto, max(0, (100svh − 4 × (alto + zócalo)) × 9999))`, que vale el alto o 0. Medido en los tres motores: 1440×900 y 800×430 pegada; **320×256 (≈ zoom 400 %) y 800×400 (teléfono apaisado) despegada**, `scroll-padding` 48 y sin desplazamiento horizontal. Extiende la regla del cuarto de `GPageHeader` (#629.3) al chasis entero.
12. **Registro de bordes (`edgeReserve`):** el chasis publica arriba `--g-app-shell-top` (0 si está despegada) y abajo `--g-sidebar-bar` con el navbar, para que la isla, los avisos y el FAB los sumen solos. Medido (cálculo del prototipo): 56/0 en escritorio, 56/68 con navbar. Va **antes de la voz** (`EDGE_ORDER.appShell = 5`); con el chasis, la aplicación **deja de pasar** `offset.top` a `GStatusIsland` y `GToaster` (se contaría dos veces). La pill de la voz no lee reservas (#322, no se reabre): sigue con su `offset` (S4).

**Región principal**

13. **Desplaza el documento, no una caja** (decisión de base, medida contra C): con el documento, el teclado desplaza sin haber enfocado nada (Av Pág al cargar: el documento baja; una caja interior **no**, 0 px en los tres motores), el navegador móvil recoge su barra, tocar la barra de estado sube, el gesto de recargar y la restauración del desplazamiento al volver funcionan, imprimir no corta la página y `scroll-padding` vive donde la receta de #515 ya lo pone. El sidebar fijo y la cabecera pegada dan el mismo efecto visual de chasis inmóvil.
14. **Sin desplazamiento horizontal de página sin romper el pegado:** el marco lleva `overflow-x: clip` (no `hidden`: no crea contenedor de desplazamiento, así que `sticky` y el «contenedor largo» de `GPageHeader` siguen funcionando). Medido: sin desbordamiento a 1440, 390 y 320.
15. **`min-block-size: 100dvh`** en la raíz (el pie queda abajo en una página corta); el sidebar fijo usa el alto del visor.
16. **Δ0 del foco al cambiar de formato:** contraer y expandir no mueven el foco (sigue en el botón) ni la página que se lee (Δ 0 px del párrafo de referencia en los tres motores; S1 lo rompía: antes del remedio contraer subía la página 112 px).

**Zona de marca, `forced-colors`, movimiento**

17. **Zona de marca en la cabecera o en el sidebar** (#620 a #625, #637): en el sidebar, `data-g-zone="brand"` en la raíz de `GSidebar` (los atributos van a su raíz, regla 1); en la cabecera, la banda es del chasis, así que el chasis ofrece **una prop para esa región** (propuesta `headerZone` `none`/`brand`, L2) que pone el atributo en el `header`, no en un envoltorio. Medido: atributo y fondo de marca. Nunca en la raíz del chasis (pintaría la página entera) ni en `<html>` (#637).
18. **`forced-colors`:** la cabecera se separa de la página con un **borde real** (`border-block-end`), no solo con fondo: medido en Chromium emulado, borde sólido ≥ 1 px.
19. **Movimiento de la base: ninguno propio.** El sidebar anima su ancho (coco, `GSidebar.css`); el chasis cambia su pista **en un paso** (sin animar la rejilla: animarla reflujaría la página cuadro a cuadro). El pegado no se anima (el desplazamiento es el movimiento, como #632).

**Lo que no hace:** columnas de la página (es del contenedor), distribución de hijos (pila, `GAdaptiveLayout`, `GFormLayout`), superficie de la página (salvo C), carga, rutas, el botón de menú del drawer, la búsqueda.

## Estados medidos (base)

Expandida · riel · superpuesto expandido tras desplazar · flotante · navbar a 390 · drawer abierto y cerrado con Esc · RTL · zona de marca en cabecera y en sidebar · cabecera de 72 · presupuesto a 1440×900, 800×430, 800×400 y 320×256 · `forced-colors` (Chromium) · enfoque de lo pegado con la página desplazada · contraer y expandir con el foco en el botón · consola limpia (sin avisos de `GPageHeader` ni de `GSidebar`).

---

## A · Cortina

**Premisa cuestionada:** «cuando la navegación cambia de ancho, la página la acompaña». El patrón de los frameworks anima el relleno de la página junto con la barra: la página **refluye en cada cuadro** (medido en Chromium con una primera versión del prototipo en la que la pista seguía al sidebar, el patrón genérico: 15 posiciones distintas del borde de la página en 450 ms) y el texto se recompone una docena de veces mientras se lee. Con la pista en un paso (la base), la página salta **al empezar** en los dos sentidos y, al expandir, el sidebar crece en un hueco vacío.

**Estructura.** La misma de la base. Lo que cambia es **cuándo** cambia la pista: al **contraer**, al instante (el riel se encoge **sobre** la página ya ensanchada); al **expandir**, **después** de `--g-duration-slow` (el sidebar crece **sobre** la página y, cuando ya la cubre, la página se aparta). Es una transición discreta de la propiedad registrada de la pista (`transition: --_nav 0s linear <espera>`), solo CSS.

**Comportamiento.** Interrumpible (expandir y contraer a los 80 ms deja la página en el riel sin haber saltado; medido). El foco no se mueve. Con movimiento reducido, sin espera: la pista y el sidebar cambian a la vez (el sidebar ya no anima su ancho).

### Qué lo hace distinto (A)

La página **nunca se ve refluir a medias**: cambia de ancho una sola vez y en el momento en que la navegación la tapa, así que quien lee no ve su texto recomponerse ni la tabla bailar. La navegación se mueve como una cortina sobre una página quieta, que es lo que el ojo espera (lo que se mueve es lo que tocaste).

### Gana y arriesga

- **Gana:** CSS puro (una transición); un solo reflujo por cambio; interrumpible; Δ0 del foco y del párrafo; sin coste en el primer pintado.
- **Arriesga:** acopla la espera a la duración del ancho de `GSidebar` (`--g-duration-slow` en los dos CSS de coco; si cambia una, cambia la otra: L9); durante 240 ms el sidebar tapa los primeros 200 px de la página al expandir (es lo buscado; con un clic de ratón la vista está en el sidebar).

### Medidas (A)

| Medida | Chromium | Firefox | WebKit |
| --- | --- | --- | --- |
| Contraer: posiciones de la página | 2 (264 → 64), al empezar (≤ 60 ms) | 2 | 2 |
| Expandir: a mitad (90–160 ms) | página en 64, sidebar creciendo encima | igual | igual |
| Expandir: la página se aparta | ≥ 200 ms | ≥ 200 ms | ≥ 200 ms |
| Interrumpir a 80 ms | página en 64, sin salto | igual | igual |
| Δ del párrafo y foco | 0 px, foco en el botón | igual | igual |
| Movimiento reducido | sin espera | igual | igual |

**Coste:** muy bajo.

---

## B · Relevo de franja

**Premisa cuestionada:** «la cabecera de la aplicación siempre está». Con la cabecera (56) y el zócalo de la página (48) apilados, lo pegado se come 104 px de cada pantalla, el doble en un teléfono con la barra del navegador. Pero mientras se baja leyendo, lo útil arriba es **el contexto de la página** (su título compacto y sus acciones, que ya están en el zócalo), no la marca y la búsqueda global.

**Estructura.** La base, más una regla de relevo. Al **bajar** (≥ `space × 4` seguidos) con el zócalo de `GPageHeader` ya pegado, **la cabecera cede el borde** (sube fuera del visor) y el zócalo **sube a 0** en la misma transición (`--g-app-shell-top` registrada pasa a 0 con `--g-duration-fast` + `--g-ease-out`; el `scroll-padding` pasa a 48). Al **subir** (≥ `space × 4`), al volver arriba del todo o **en cuanto el foco entra en la cabecera**, vuelve. **Nunca te quedas sin franja:** sin un zócalo pegado que tome el relevo, la cabecera no cede.

**Comportamiento.** Sin JS de posición: el chasis solo decide «cede / no cede» con el sentido del desplazamiento; todo lo demás es la cifra de la base. Movimiento reducido: el cambio es instantáneo, sin deslizarse.

### Qué lo hace distinto (B)

No es el «ocultar al desplazar» genérico (que deja la pantalla sin nada que diga dónde estás): **la cabecera y el encabezado de la página se pasan el borde**. Siempre hay una sola franja arriba, la que más sirve en ese momento: la de la aplicación cuando navegas, la de la página cuando lees. Recupera 56 px de lectura en cada pantalla (más del 20 % en un teléfono apaisado) sin perder el título ni las acciones de la página, y el teclado la devuelve con solo entrar en ella (2.4.11).

### Gana y arriesga

- **Gana:** la mitad de altura pegada mientras se lee; contexto siempre visible; reversible con el gesto natural (subir).
- **Arriesga:** **JS de desplazamiento en el chasis** (un manejador pasivo, sin escrituras de posición); **`GPageHeader` lee `--g-page-header-top` solo al medir** (al redimensionar o cambiar de tamaño): en el prototipo se le provoca una nueva medida al ceder y al volver; en el componente real hace falta un canal propio (S6); movimiento ligado al sentido del desplazamiento (pequeño y corto, pero es movimiento que la persona no pidió explícitamente: rúbrica C/E); con `GPageHeader` sin zócalo, B equivale a la base.

### Medidas (B)

| Medida | Resultado (tres motores) |
| --- | --- |
| Bajar 1600 px | Cabecera fuera del visor; zócalo en 0; lo pegado suma 48 (no 104); `GPageHeader` sigue `is-stuck` |
| Subir 160 px (dos pasos de 80) | Cabecera en 0; zócalo de vuelta en 56 |
| Foco en un botón de la cabecera (cedida) | Vuelve |
| Movimiento reducido | Sin deslizarse |

**Coste:** bajo (un manejador de desplazamiento) + el canal de `GPageHeader` (S6).

---

## C · Escenario

**Premisa cuestionada:** «el chasis es invisible». En una aplicación de trabajo, la navegación y la cabecera son el marco y la página es el documento; los frameworks los pintan igual (mismo fondo, separados por una línea) y la página no se distingue de su marco.

**Estructura.** El marco (cabecera + sidebar) pinta la superficie de chasis del tema (`--g-surface-shell`, la que ya usa `GSidebar`) sin bordes; **la página es una hoja** (`--g-color-bg`, borde `--g-color-border`, radio `--g-surface-radius`, `--g-shadow-1`) separada del marco por `space-2` al final y abajo. **La hoja desplaza por dentro** (es su propio desplazador: el marco no se mueve nunca, ni la cabecera necesita pegarse): `--g-page-header-top` = 0 y su `scroll-padding` = el zócalo. Con navegación móvil (`navbar` o `drawer`) la hoja **se funde** con la página y desplaza el documento (barra del navegador, tocar arriba). La hoja lleva `tabindex="-1"` (#570: Firefox le daba una parada de Tab propia; medido, sin ella ahora).

### Qué lo hace distinto (C)

La página se lee como un documento puesto sobre la mesa de trabajo: el marco retrocede (un solo plano, sin líneas) y el contenido se levanta. La jerarquía «esto es la aplicación / esto es lo que estás haciendo» se ve sin leer nada, y al cambiar de formato el marco se reorganiza alrededor de una hoja que no pierde su sitio.

### Gana y arriesga

- **Gana:** identidad visible y moderna; jerarquía marco/contenido; nada pegado sobre la página (la cabecera está fuera de la hoja); en el teléfono se comporta como la base.
- **Arriesga (medido):** **el teclado no desplaza la hoja al cargar** (Av Pág sin foco ni clic: 0 px en los tres motores; tras un clic en la hoja o el enlace de salto, sí); **WebKit sigue desplazando la hoja al enfocar una acción del zócalo** aunque reste la banda (1200 → 807; S5 no se resuelve en un desplazador interior); pierde en escritorio lo que da el documento (restauración del desplazamiento al volver, impresión, «buscar en la página» que desplaza la hoja y no el documento) y gasta `space-2` de cada borde; las bandas `g-bleed` del contenedor se recortan en las esquinas redondeadas de la hoja.

### Medidas (C)

| Medida | Chromium | Firefox | WebKit |
| --- | --- | --- | --- |
| Hoja separada (radio, margen 8 al final) y desplaza ella | sí | sí | sí |
| Zócalo pegado en el borde de la hoja | sí | sí | sí |
| Enfocar sidebar / cabecera con la hoja desplazada | sin mover | sin mover | sin mover |
| Enfocar la acción del zócalo | sin mover | sin mover | **1200 → 807** |
| Av Pág al cargar, sin foco | 0 | 0 | 0 |
| Av Pág tras clic en la hoja / tras el salto | 746 / sí | 746 / sí | 746 / sí |
| Parada de Tab propia de la hoja | no | no (con `tabindex=-1`) | no |
| 390 (navbar): se funde y desplaza el documento | sí | sí | sí |

**Coste:** medio (dos modelos de desplazamiento según el formato; el CSS de la hoja; la receta de `scroll-padding` en dos sitios).

---

## Comparativa

| | Base | A · Cortina | B · Relevo de franja | C · Escenario |
| --- | --- | --- | --- | --- |
| Al cambiar de formato | La página salta al empezar | **Un reflujo, cuando el sidebar la tapa** | Como la base | Como la base (combinable con A) |
| Al desplazar | Cabecera + zócalo pegados (104) | Igual | **Una sola franja (48)** | Nada pegado sobre la hoja; el zócalo dentro |
| Forma visible | Marco y página en el mismo plano | Igual | Igual | **Hoja sobre el marco** |
| Desplazador | Documento | Documento | Documento | Hoja (escritorio) / documento (móvil) |
| Teclado sin foco | Desplaza | Desplaza | Desplaza | **No desplaza** hasta el primer clic o el salto |
| JS propio | Registro de bordes | Igual | + manejador de desplazamiento | Igual que la base |
| Toca a otros componentes | — (S1/S5 son de antes) | — | `GPageHeader` relee su `top` (S6) | `GPageHeader` en WebKit (S5) |
| Riesgo principal | — | Acoplar duraciones | Movimiento no pedido; S6 | Teclado y WebKit; plataforma móvil distinta de escritorio |
| Coste | Bajo | Muy bajo | Bajo | Medio |

## Recomendación

**Base + A · Cortina por defecto, B · Relevo de franja como opción del chasis y C · Escenario reservada.**

- **A por defecto:** es CSS, no tiene coste en el primer pintado, mejora un momento que hoy es feo (la página que refluye) y no cambia nada de lo que la persona ve en reposo.
- **B como opción** (propuesta `header="relay"`, por defecto `pinned`): da la ganancia más grande para quien lee (la mitad de altura pegada) y se justifica en teléfonos y con zoom, pero es movimiento ligado al desplazamiento y necesita que `GPageHeader` relea su distancia (S6); que la aplicación lo elija.
- **C reservada** (propuesta `appearance="stage"` cuando se haga): es la que más se ve, pero lo medido la penaliza en lo que más importa en una aplicación de trabajo (teclado al cargar, WebKit con el zócalo, restauración e impresión en escritorio). Si el usuario la quiere ahora, entra como apariencia opcional con esos límites escritos; A se combina con ella.

## Qué lo hace distinto (resumen de la recomendación y de la base)

Un chasis que **reserva el sitio de la navegación leyendo su forma, sin eventos ni medidas**, que **escribe una sola vez la cifra de la cabecera** para el encabezado de página, el acordeón, la isla y los avisos, que **se despega solo cuando lo pegado ya no cabe** (zoom 400 %, teléfono apaisado), en el que **enfocar la navegación o la cabecera nunca mueve la página** (un fallo de Chromium y WebKit que hoy tiene cualquier receta de cabecera pegada) y en el que, al plegar o desplegar la navegación, **la página no se recompone delante de quien lee**.

## Rúbrica de movimiento (`docs/documentacion/rubrica-movimiento.md`)

Componente: chasis de una aplicación web de gestión; escritorio, portátil y teléfono; ratón, teclado y toque; uso frecuente y lectura prolongada. Evidencia = medido en `verificar.mjs`; inferencia = razonado sin medir.

| Dimensión | Base | A · Cortina | B · Relevo | C · Escenario | Riesgo y recomendación |
| --- | --- | --- | --- | --- | --- |
| **A. Propósito** | **Cumple** (no hay movimiento propio; el del sidebar es de `GSidebar`) | **Cumple**: el retraso comunica causa-efecto (la navegación se abre y luego la página cede); evidencia: 2 posiciones | **Parcial**: útil (gana lectura) pero ligado al desplazamiento, no a una orden | **Cumple** (sin movimiento propio) | B: umbral de `space × 4` para no reaccionar a temblores; opción, no defecto |
| **B. Comodidad visual** | **Cumple** | **Cumple**: un solo cambio en vez de 15 | **Cumple**: 120 ms, `ease-out`, una banda | **Cumple**: sombra `shadow-1`, sin capas contradictorias | — |
| **C. Estabilidad** | **Cumple**: el marco no se mueve (sidebar fijo, cabecera pegada); Δ0 del párrafo | **Cumple**: objeto grande (sidebar) sobre referencia quieta (la página) | **Parcial**: una banda de ancho completo se desliza en la visión periférica | **Cumple**: el marco es la referencia estacionaria | B: con movimiento reducido, sin deslizarse (medido) |
| **D. Transiciones** | **N/A** | **Cumple**: interrumpible desde cualquier punto (medido a 80 ms); sin estado temporal en JS | **Cumple**: la transición es de una propiedad registrada; se revierte subiendo | **N/A** | — |
| **E. Control** | **Cumple** | **Cumple**: solo responde a contraer/expandir o a un cambio de ancho | **Parcial**: la persona no pidió que la cabecera se fuera; la devuelve subiendo o entrando con el foco (medido) | **Cumple** | B como opción de la aplicación |
| **F. Accesibilidad y opcionalidad** | **Cumple**: presupuesto del cuarto (1.4.10), foco nunca bajo lo pegado (2.4.11, medido), salto (2.4.1) | **Cumple**: reducido = sin espera (medido) | **Cumple**: reducido = sin deslizarse; nunca sin contexto | **Parcial**: teclado al cargar (medido) | C: documentar el primer clic/salto; o descartar |
| **G. Rendimiento** | **Cumple**: CSS, sin medidas; `:has()` sobre hijos directos | **Cumple**: un reflujo por cambio (antes 15) | **Parcial**: manejador pasivo por evento de desplazamiento (sin escrituras de estilo salvo al cambiar) | **Cumple** | coco/bruno: medir `:root:has(.g-app-shell …)` en una página grande (No verificable aquí) |
| **H. Inmersión** | **N/A** | **N/A** | **N/A** | **N/A** | — |

---

# Parte 2 · `GStack`

Sin forma visible propia: no aplica «conceptos antes que caja» (#362). Sí «Qué lo hace distinto».

## Anatomía

```
<as> .g-stack [--gap-*] [--horizontal] [--h-*|--v-*] [--density-*] [--divided]    ← flex en un eje; ningún envoltorio por hijo
└─ [slot default]  hijos directos en el orden del DOM
```

## Decisiones

1. **Un eje, una escala, ninguna superficie.** `orientation` `vertical` (por defecto) · `horizontal` (nombre de `GDivider`/`GTabs`). Sin fondo, borde, relleno ni radio (eso es `GSurface`).
2. **`gap` `none` · `sm` · `md` · `lg`, factor 0 · 0,5 · 1 · 2 (#360)** sobre **`space × 6`** (24 px): 0 · 12 · 24 · 48. **`md` por defecto.** Sin números sueltos ni px por prop. Base de página distinta de la de formulario (`--g-form-gap`, que es de `GAdaptiveLayout` y `GFormLayout`): la pila no es un formulario. Medido: 24 / 12 / 48 en los tres motores.
3. **`density` `default` · `comfortable` · `compact`** (1 · 0,875 · 0,75, como el resto). Medido: `compact` = 18.
4. **Alineación lógica:** `horizontal` `start` · `center` · `end` (en vertical, el ancho de los hijos; sin valor = estirar) y `vertical` `top` · `center` · `bottom` en horizontal (nombres de `GAdaptiveLayout`, #339 y #359). Sin `between` ni `around` (eso reparte: es de `GAdaptiveLayout`).
5. **En línea, siempre se parte** (`flex-wrap: wrap`) con la misma separación en los dos ejes: **no hay `nowrap`**. Medido a 320: varias filas y sin desplazamiento horizontal (1.4.10).
6. **Sin `reverse`** ni orden visual distinto del DOM (1.3.2, 2.4.3).
7. **`as`** (`div` por defecto, `ul`, `ol`, `section`, `nav`…): la pila no añade roles. Con `ul`/`ol` la aplicación pone los `li`.
8. **Una sola fuente de aire:** los márgenes de bloque de los hijos directos valen 0 dentro de la pila (en la capa de Grana: una regla de la aplicación sin capa gana, #516). Medido: el margen del `p` hijo = 0. Ignora el nodo hermano de `GTooltip` (`:not(:where(.g-tooltip))`, #383).
9. **`divided`:** una línea `--g-color-border` entre hijos, con el aire repartido a los dos lados de la línea; nunca antes del primero ni tras el último. Medido: línea en el segundo, ninguna en el primero, 18 + 18 en `compact`.
10. **Puro, sin JS** (#444).

## Qué lo hace distinto (`GStack`)

La separación **es una relación, no una cifra**: `sm` «va con lo anterior», `md` «lo siguiente», `lg` «otro tema», el mismo vocabulario que `GAdaptiveLayout`, `GSection` y la densidad del tema, así que una pantalla entera cambia de ritmo con `space` y nunca con un número escrito a mano. Y la pila **no puede romper el reflujo**: en línea siempre se parte, y es la única fuente de aire entre sus hijos (ni márgenes que se suman ni dos aires distintos según quién escribió el `p`).

## Frontera

| Pieza | Cuándo |
| --- | --- |
| `GFormLayout` + `GFormRow` | Formularios: filas que llenan el ancho y ritmo `--g-form-*` (#171, #361). Una pila **no** va dentro de un formulario para distribuir campos |
| `GAdaptiveLayout` | Reparto automático en líneas por necesidades de tamaño (#339 a #365). La pila **no reparte**: apila |
| `GCardGroup` | Grupo de tarjetas que filtran, con su teclado (#603) |
| `GSurface` | Relleno y superficie; una pila dentro de una superficie no añade relleno |
| `GContainer` | La columna (eje en línea); la pila es el ritmo vertical que el contenedor deja fuera (su decisión 1) |

---

# Parte 3 · `GSection`

## ¿Componente o receta? Componente

Argumentos (los tres primeros no se pueden hacer con una receta de pila + encabezado):

1. **El nivel del encabezado sale del documento.** Con `provide`/`inject`, la primera sección es `h2` (bajo el `h1` de `GPageHeader`), una anidada `h3`, otra `h4` (tope). Una receta obliga a cada pantalla a contar niveles y es justo donde se saltan (1.3.1, H42). Medido: h2 › h3 › h4 por anidación.
2. **El título lo decide el contenedor** (`tokens.md` §23.4): un componente fija su rol tipográfico; una receta deja que cada aplicación elija un tamaño.
3. **El nombre accesible y el landmark** (`aria-labelledby` con un id propio) solo cuando se pide.
4. Coste mínimo (un render, sin estado).

## Anatomía

```
section.g-section [aria-labelledby si landmark]
├─ div.g-section__head                          ← flex-wrap: las acciones bajan bajo el título sin punto de corte
│  ├─ div.g-section__titles
│  │  ├─ h{2|3|4}.g-section__title  dir="auto"   [title | slot title]
│  │  └─ p.g-section__desc                       [description | slot description]
│  └─ div.g-section__actions role="group" aria-label={labels.actions}   [slot actions]
└─ div.g-section__body                          ← pila vertical (md); los márgenes de bloque de los hijos a 0
```

## Decisiones

1. **`headingLevel` `2` · `3` · `4`** (nombre compartido), **por defecto automático** por anidación de `GSection` (2, 3, 4 con tope). Fijado, gana y **no cambia el tamaño** (#196); las secciones de dentro siguen contando desde él.
2. **Rol del título por anidación, no por nivel:** primera **title-sm 20/28, 600** (como `GDialog`: la sección de página está entre el `h1` de `GPageHeader` y las tarjetas), anidada **body 16/24, 600** (como `GFormSection` y `GCard`), tercera **body-sm 14/20, 600** (el criterio de §23.5(b): nunca menos de 14). Descripción body-sm `muted` (§23.4). Medido: 20 › 16 › 14. Para lima, en §23.1.
3. **Landmark solo si se pide** (`landmark`): APG *Landmark Regions* pide usar `region` con moderación; por defecto la estructura la dan los encabezados (la navegación por encabezados es la principal en lector). Medido: `region "Firmantes"` con `landmark`, ninguna sin él.
4. **Acciones** en `role="group"` con `labels.actions` (sin valor por defecto, como `GPageHeader`), al final de la fila del título; con poco ancho bajan solas (medido a 320, sin punto de corte).
5. **Sin superficie, sin plegado, sin pegado:** plegar es `GAccordion`; una superficie con título es `GCard`; el pegado de un encabezado de sección queda fuera de esta ronda.
6. `scroll-margin-block-start` de `space-4` en la raíz (un `#id` de sección deja aire bajo lo pegado; lo pegado lo suma el `scroll-padding` del chasis, #515).
7. Puro (#444); usa la pila de la Parte 2 como cuerpo (mismo CSS, no un `GStack` anidado).

## Qué lo hace distinto (`GSection`)

**El encabezado sabe dónde está:** el nivel lo pone el documento (una sección dentro de otra baja un nivel sola, nunca se salta uno) y el tamaño lo pone la anidación (cada nivel un rol menos, con suelo en 14), de modo que el esquema que oye el lector de pantalla y la jerarquía que ve el ojo **no pueden desalinearse**. La región con nombre es opt-in, así una página con seis secciones no llena de puntos de referencia la lista del lector.

## Frontera

| Pieza | Diferencia |
| --- | --- |
| `GFormSection` | Solo formularios (registro de campos, modos `collapsible`/`addable`, errores por sección) |
| `GSurface as="section"` | Superficie sin título |
| `GCard` | Un objeto con superficie y su propio título (body 16) |
| `GPageHeader` | Nivel página (`h1`, zócalo, muelle) |
| `GAccordion` | Secciones que se pliegan |

---

# Relación chasis ↔ contenedor (sin reabrir A/B/C de `GContainer`)

- **El chasis da el chasis del visor; el contenedor, la columna.** El contenedor va **dentro** de `main` y mide **su** caja, que es el marco del chasis (la pista del sidebar ya está fuera): la hipótesis B del contenedor («mide su sitio, no el visor») funciona tal cual. Una banda `g-bleed` llega al borde del marco, **nunca bajo el sidebar** (es fijo y está fuera del marco).
- **`as="main"` del contenedor deja de ser la receta dentro del chasis:** el chasis ya pone el `main`. El contenedor va con `as="div"` (su defecto); su aviso de `main` duplicado lo detecta (S10).
- **Lo que el chasis condiciona de B:** (a) el marco tiene `overflow-x: clip`: lo que sangre más allá del borde de la caja se recorta (no da desplazamiento horizontal); (b) en C, las esquinas redondeadas de la hoja recortan las bandas `g-bleed` de arriba y de abajo. Nada más: ni margen propio, ni relleno, ni consultas.
- **`GPageHeader` dentro del contenedor:** sin avisos en el prototipo (la columna del laboratorio simula el contenedor sin `container-type`); el hallazgo L4(b) del contenedor (aviso 8 de `GPageHeader` por `container-type`) sigue abierto para lima.

# Frontera del chasis con lo que existe

| Pieza | Del chasis | De la pieza |
| --- | --- | --- |
| `GSidebar` | Ser su padre (la caja que mide), su pista, fijarlo al visor, la reserva del navbar | Formatos, umbrales (`breakpoints`), drawer, movimiento |
| `GPageHeader` | `--g-page-header-top`, `scroll-padding`, el registro de su borde lo sigue publicando él | Zócalo, muelle, título compacto |
| `GAccordion sticky` | `--g-accordion-sticky-top` | Su pegado y su `scroll-margin` |
| `GStatusIsland`, `GToaster`, `GFab` | Publicar cabecera y navbar en el registro | Leer el registro |
| `GSpeechHost` | Nada (no lee reservas, #322) | Su `offset` |
| `GContainer` | La caja | La columna |
| `GDialog` | Nada: dentro de un diálogo no hay chasis (aviso si un `GAppShell` va dentro) | — |
| Rutas, búsqueda, sesión | Nada | La aplicación |

---

## Hallazgos para otros roles (de lo medido)

| # | Dueño | Hallazgo | Propuesta |
| --- | --- | --- | --- |
| S1 | lima (`api.md` «Piezas pegadas» y «Cabecera fija»), coco, bruno | **Enfocar algo pegado que cae en la banda del `scroll-padding` desplaza la página en Chromium y WebKit** (no en Firefox). Le pasa a la receta vigente de #515 sin chasis | Regla común: los enfocables de una pieza pegada restan la banda (`scroll-margin-block-start` negativo = la banda); lo lateral, fijo |
| S2 | coco (`GSidebar.css`) | `overlay` expandido es `absolute; inset-block: 0` contra un padre de alto fijo; en una página que desplaza mide el documento | Documentar (el chasis lo corrige) o pasar a `fixed` sin `contained` |
| S3 | lima / bruno | `GSidebar` `auto` mide su `parentElement`; un envoltorio de la aplicación entre el chasis y el sidebar lo hace caer a móvil | Aviso del chasis (L8) |
| S4 | lima | La pill de la voz no lee reservas (#322): arriba queda sobre la cabecera del chasis | La aplicación le pasa su `offset` (receta); no se reabre #322 |
| S5 | coco (`GPageHeader.css`) | Enfocar una acción del zócalo pegado desplaza la página (1200 → 778 en Chromium, → 1158 en WebKit). Con la regla del prototipo se arregla en el documento; **en un desplazador interior WebKit sigue moviéndolo** (→ 807) | `.g-page-header.is-stuck .g-page-header__base *` con `scroll-margin-block-start: calc(-1 * (var(--g-page-header-top) + <alto del zócalo>))`; probable lo mismo en el encabezado pegado de `GAccordion` (no medido) |
| S6 | bruno (`GPageHeader.vue`) | Lee `--g-page-header-top` solo al medir (redimensionar, tamaño); B lo cambia en caliente | Solo si se elige B: releerlo al cambiar (evento interno del chasis o lectura en `update` cuando cambie) |
| S7 | mora-docs | WebKit por defecto no lleva el Tab a los enlaces: el salto necesita Opción+Tab | Nota en el README |
| S8 | lima / bruno (`GSidebar`) | Con el drawer abierto por el botón de la aplicación (`open`), WebKit no enfoca el botón al hacer clic (#307) y el foco no vuelve al cerrar | `from` (nombre compartido, #581) en `GSidebar`, o el chasis da a la cabecera un `toggleNav(event)` por ámbito de slot |
| S9 | lima (`GSidebar`) | A 320×256 el navbar fijo tapa 68 px (27 % del visor); el presupuesto del chasis solo cuenta arriba | Valorar un presupuesto inferior en `GSidebar` |
| S10 | lima (`GContainer`) | Dentro del chasis, `GContainer as="main"` duplica `main` | La receta de página del contenedor pasa a `as="div"` con chasis |
| S11 | bruno (playground) | `html { scroll-behavior: smooth }` sin guarda de movimiento reducido; sin enlace de salto | Guarda `prefers-reduced-motion: no-preference`; el chasis lo traerá cuando exista |

## Hallazgos para lima

| # | Tema | Hallazgo | Propuesta |
| --- | --- | --- | --- |
| L1 | Nombre y paquete | `GAppShell` / `g-app-shell` | **Entrada propia `@grana/vue/app-shell`** (global UMD `GranaAppShell`), como `page-header` (#633): usa `edgeReserve` (obligatorio por `__shared`), avisos y, con B, un manejador de desplazamiento; #550 sin margen |
| L2 | API | Slots `header`, `nav`, `default`, `footer`; `labels` `{ skip }` (obligatorio, sin valores); `headerZone` `none`/`brand` (la zona por región; regla 1 de #620 dice `zone` en la raíz, aquí la raíz es todo el chasis); A sin API; B `header` `pinned`/`relay`; C `appearance` `flush`/`stage` (reservado). Sin `mode`, sin `sidebarWidth`, sin `stickyOffset` | Contrato |
| L3 | Tokens y constantes | **Ningún token del tema.** Constante de contrato: alto de la cabecera `max(space × 14, 44px)`. Propiedad de entrada `--g-app-shell-header`; publicada `--g-app-shell-top` (solo lectura). Constantes de diseño: presupuesto 1/4 (`× 4`), factor del escalón `9999`, umbral de B `space × 4`. Literales de unidad: `100svh`, `100dvh` | Registrar (`tokens.md`, sección nueva; `levels.test.js` como `--g-page-header-top`) |
| L4 | Receta | El chasis escribe la receta de `api.md` «Cabecera fija» (`--g-page-header-top`, `--g-accordion-sticky-top`, `scroll-padding` por `:root:has()`) en la capa de Grana | Enmienda de `api.md`: con chasis, la aplicación no la escribe |
| L5 | Bordes | `EDGE_ORDER.appShell = 5` (cabecera arriba, navbar abajo), antes de la voz; con chasis, `offset.top` de isla y avisos deja de pasarse | Enmienda de #631/#699; S4 |
| L6 | Contrato entre componentes | La reserva lee clases públicas de `GSidebar` (`g-sidebar--mode-*`, `--overlay`, `--variant-floating`) con `:has()` | Fijarlas como contrato (como el mapa de anfitrionas, #484) |
| L7 | Regla común | S1 | `api.md` «Piezas pegadas» |
| L8 | Avisos | Dos chasis; `main` dentro del slot o `GContainer as="main"`; `GSidebar` que no es hijo directo; `GSidebar contained` dentro del chasis; contenido de la cabecera más alto que la banda (sugiere `--g-app-shell-header`); chasis dentro de un `<dialog>` | Lista de avisos con la guarda de #653 |
| L9 | Personalidad (A) | La espera de A es `--g-duration-slow`, la misma duración del ancho de `GSidebar` | Registrar en `DECISIONS.md`; si coco cambia una, cambia la otra |
| L10 | B | `header="relay"`, umbral `space × 4`, S6 | Contrato, si se elige |
| L11 | C | `appearance="stage"`, hoja con `tabindex="-1"` (#570), límites medidos (teclado, S5 en WebKit, restauración, impresión) | Reservado, si no se elige |
| L12 | Complejidad | Se posiciona sobre otros (sidebar fijo) y se solapa con `GSidebar`, `GPageHeader`, `GContainer`, `edgeReserve`: **complejo** → coco y bruno en Opus | — |
| L13 | `GStack` | `as`, `gap` (`none`/`sm`/`md`/`lg`, `md`), `orientation`, `horizontal`, `vertical`, `density`, `divided`. Constantes `space × 3/6/12` (sin token: no es del tema); regla de márgenes de hijos (#516) y exclusión de `.g-tooltip` (#383) | Contrato |
| L14 | `GSection` | `title`, `description`, `headingLevel` (2/3/4, automático), `landmark`, `labels` `{ actions }`; slots `title`, `description`, `actions`, default. Roles title-sm › body › body-sm con 600; clave de anidación interna. ¿`GCard`, `GFormSection` y `GDialog` leen la misma clave para su `headingLevel` por defecto? (después; hoy no se tocan) | Contrato y §23.1 |
| L15 | Peso | `GStack` + `GSection`: puros, sin estado (estimo < 1 KiB gzip juntos). #550: entrada propia por defecto | Recomiendo **principal con compuerta conjunta ≤ 1 KiB** (son las primitivas que las recetas de página citan, como `GContainer` en su L11); si no, una entrada `@grana/vue/layout` con las dos (y el contenedor). El chasis, entrada propia |

## Pregunta para el usuario

**¿Qué forma quieres para el chasis de aplicación?**
1. **Base + A · Cortina por defecto, con B · Relevo de franja como opción** (recomendado): la página no se recompone al plegar la navegación y, si la aplicación lo pide, la cabecera cede el borde al encabezado de la página mientras se lee.
2. **Base + A + C · Escenario como apariencia opcional:** además, la página como hoja sobre el marco en escritorio, con los límites medidos (teclado al cargar, WebKit con el zócalo).
3. **Base + A**, sin B ni C.
4. **Base + A + B + C.**

## Comprobaciones

`node design/lab/app-shell/r01/verificar.mjs` · 2026-10-21 · puerto 4211 · Playwright 1.63 · resultado:

**352 de 352 pasan** (y 19 medidas informativas: Δ del párrafo, `is-stuck` en B, teclado y WebKit en C).

| Motor | Base | Presupuesto | A | B | C | Pila y sección |
| --- | --- | --- | --- | --- | --- | --- |
| Chromium | 52/52 | 20/20 | 10/10 | 8/8 | 15/15 | 14/14 |
| Firefox | 50/50 | 20/20 | 10/10 | 8/8 | 15/15 | 14/14 |
| WebKit | 50/50 | 20/20 | 10/10 | 8/8 | 14/14 | 14/14 |

(Firefox y WebKit no emulan `forced-colors`: 2 casos menos en la base. En WebKit, el enfoque de la acción del zócalo en C queda como medida, no como caso: es el límite S5.)

**No verificado:** lector de pantalla real (landmarks medidos con el árbol de accesibilidad de Playwright, no con VoiceOver ni NVDA); móvil real (barra del navegador que se recoge con `svh`/`dvh`, área segura, toque en la barra de estado, gesto de recargar, teclado virtual sobre la cabecera pegada); zoom real del navegador (simulado con visor de 320×256); `forced-colors` en Firefox y WebKit; restauración del desplazamiento al volver e impresión (argumento de la base, no medido); rendimiento de `:root:has(.g-app-shell …)` en una página grande; `GAccordion sticky`, `GStatusIsland`, `GToaster`, `GFab` y `GSpeechHost` reales dentro del chasis (el registro de bordes se calcula en el prototipo, no se publica en el `edgeReserve` real); el reflujo de A a anchos donde la columna cambia de ancho (a 1440 la columna del laboratorio ya está en su máximo y el párrafo no se recompone); el contenedor real (simulado con una columna del laboratorio); tema oscuro (hay `?theme=dark`, no medido).

## Cumplimientos / Correcciones / Pendientes

**Cumplimientos** (de la auditoría visual y de la rúbrica): estructura de regiones con landmarks y un solo `main`; jerarquía cabecera → navegación → página → pie; delimitación por borde real (también en `forced-colors`); espaciado solo con tokens (`space`, sin literales salvo 24/44 y las constantes de L3); reutiliza `GSidebar`, `GPageHeader`, `GBtn`, `GIcon` y la zona de marca reales, sin reconstruirlos; sin desplazamiento horizontal a 1440, 390 y 320; foco visible y nunca bajo lo pegado (2.4.11, medido); salto de bloques (2.4.1); reflujo a 400 % con el presupuesto (1.4.10); RTL; movimiento reducido en A y B; consola limpia.

**Correcciones** (hechas dentro de la ronda, sobre el prototipo): el sidebar pegado desplazaba la página al enfocarlo (S1) → fijo; la cabecera igual → resta la banda; el zócalo igual → regla simulada para coco (S5); la expansión superpuesta medía el documento (S2) → fija; la hoja de C tenía parada de Tab propia en Firefox → `tabindex="-1"` (#570); el navbar no se publicaba en el registro → propiedad registrada. Frente al playground (`brief.md`): una cifra en lugar de cuatro, `svh`/`dvh` en lugar de `100vh`, sin punto de corte literal, enlace de salto.

**Pendientes:** la elección del usuario (una pregunta); lima: contrato del chasis, de la pila y de la sección (L1 a L15) y las enmiendas S1, S4, S5, S8, S9, S10; coco: S2, S5 y el CSS de los tres; bruno: S6 si se elige B, S11 en el playground, los avisos de L8; lo no verificado de arriba (lector, móvil, zoom y `forced-colors` reales).
