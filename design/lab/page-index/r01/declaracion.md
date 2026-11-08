# Declaración · GPageIndex `appearance="list"` (columna «En esta página»), r01

> kiwi, 2026-11-08. Prototipo: `index.html?p=comp|guide|blocks` (`&theme=dark`, `&follow=0` sin PI-P1, `&landing=1` PI-P2): el **mismo marco calcado** de `navbar/r01` (componentes reales: `GAppShell`, `GSidebar` con filtro y números, `GMenu`, `GSwitch`, `GDialog` + `GCombobox`) con el prototipo de esta ronda en `page-index.js`/`page-index.css` (→ `GPageIndex appearance="list"`). Las secciones son las **reales** del sitio anterior (`secciones.js`: 62 en GCombobox, 37 de ellas `h3`). Referencia: `design/lab/sitio/referencia/medidas.md` §5. Verificación: `node design/lab/page-index/r01/verificar.mjs` (puerto 4238) **198/198** en Chromium, Firefox y WebKit. Paridad con la referencia (x, y y alto del título y de los enlaces, Δ 0 a 1280; desplegable Δ 0 a 1024) en `../../navbar/r01/paridad.json`. **Pregunta de producto: una** (peso, §7).
>
> **La forma no se elige:** la fija la referencia. La personalidad es de comportamiento y no cambia el aspecto en reposo.

---

## 1. Qué forma es: `list`, no `rail` (y su relación con `relay`)

1. **Es `appearance="list"`.** El contrato reservó `list` como «columna clásica pegada, para ajustes y formularios largos» y `rail` como «estaciones numeradas» (concepto B de `sitio/r01`, con números de §). La columna de VitePress es exactamente la primera: título, lista de enlaces, sangrado de `h3`, marcador sobre una línea. `rail` sigue reservada.
2. **Mismo motor que `relay`**, otra semántica: `relay` es un **botón de menú** (APG *Menu Button*: flechas, letras, `role="menu"`) porque vive en un zócalo donde solo cabe un control; `list` es una **navegación de enlaces** (`nav` + `ul` + `a`), que se recorre con Tab y se lee como lista. No se pinta un `GMenu`: con 62 secciones, una lista siempre visible no necesita abrirse.
3. **Las dos formas pueden convivir en la misma página** (la aplicación elige: el sitio usaba columna en ancho y desplegable en estrecho; `relay` queda para el zócalo de `GPageHeader`). Comparten `items`, `modelValue` y eventos.

## 2. Anatomía (contrato propuesto; prototipo `.pi` → `.g-page-index`)

```html
<nav class="g-page-index g-page-index--appearance-list [has-current]" aria-labelledby="ID-title" id="ID">
  <div class="g-page-index__body">                                   <!-- línea guía: borde inicial -->
    <span class="g-page-index__marker" aria-hidden="true"></span>    <!-- 2 × 18 sobre la línea, centrado en la actual -->
    <p class="g-page-index__title" id="ID-title" dir="auto">En esta página</p>
    <div class="g-page-index__scroll" tabindex="-1">                 <!-- desplazamiento propio (#570) -->
      <ul class="g-page-index__list">
        <li><a class="g-page-index__link" href="#uso" dir="auto" title="Uso">Uso</a>
          <ul class="g-page-index__sub"><li><a class="g-page-index__link" href="#…" aria-current="location">…</a></li></ul></li>
      </ul>
    </div>
  </div>
</nav>
```

4. **`nav` con nombre = el título visible** (`label`, la misma prop obligatoria de `relay`) por `aria-labelledby`. El título es un `<p>`, **no un encabezado**: no ensucia el esquema de la página (el sitio anterior tampoco lo era) y el punto de referencia ya lo anuncia. Medido en los tres motores.
5. **Dos niveles (`level`) en `list`:** la reserva de #1038 era por el menú (una lista larga de dos niveles no se recorre bien con flechas); en una lista de enlaces sí. `items` admite `level: 2 | 3` (sin `level`, 2); un 3 cuelga del 2 anterior en un `ul` anidado sangrado `space-4` (Δ x 0 con la referencia); un 3 sin 2 previo, a la raíz. **Sigue reservado en `relay`.**
6. **Una línea por enlace con elipsis** y `title` con el texto entero (el calco); el nombre accesible es siempre el texto completo.
7. **`aria-current="location"` en un solo enlace** (api.md #1039). Medido: una sola actual y la que dice la regla, en cuatro posiciones de lectura y al final del documento.
8. **Desplazamiento propio (PI-N3, corrige el defecto 8 de la referencia):** la lista cabe en el visor bajo la banda (`max-block-size` con `--g-app-shell-top`) y desplaza dentro con `overscroll-behavior: contain`; el contenedor lleva `tabindex="-1"` (#570) para que el lector y la rueda no se pierdan. Así se cumplen las condiciones de K11 de `GSplit` (lo pegado más alto que el visor dejaba el último foco fuera de la vista) sin que `GPageIndex` se pegue él mismo.
9. **El pegado es de la maqueta, no del componente:** la columna derecha (`position: sticky` bajo la banda) es del `Layout` del sitio, igual que hoy la columna de la izquierda es del chasis. `GSplit sticky` sigue reservado (#951); si un día se resuelve, la columna podrá ir en su región final.

## 3. La forma plegada (`fold`): el desplegable de la barra local

10. **`fold` (Boolean):** la misma instancia se pinta como **botón de texto + panel** (APG *Disclosure*): `button aria-expanded aria-controls` con `label` y un `chevron-right` que gira 90° al abrir (calco), y un panel con **«Volver arriba»** (`labels.top`, nuevo) seguido de la misma lista. El botón del original no tenía `aria-expanded`: se corrige.
11. **Cómo cambia de forma (SSR sin CLS):** como en VitePress, la aplicación pone **dos instancias** —la columna en la columna derecha y la plegada en la barra local— y su maqueta enseña una u otra con su CSS (el corte es de la maqueta, no del índice). **La instancia que no se pinta no lee ni emite** (PI-L5): sin trabajo doble y sin que las dos se disputen la actual si comparten `v-model` (lo destapó la prueba: la plegada, oculta, deshacía la elegida sostenida de la columna). Medido: la elegida se sostiene con las dos montadas.
12. **`align` (`start` | `end`, ya existe en el contrato):** el borde del botón con el que se alinea el panel. Con el índice izquierdo a la vista el botón va al inicio de la barra local (x = 308 a 1024, Δ 0) y el panel se abre hacia el final; en estrecho, al revés. El panel nunca sale del visor (medido a 1024 y 375: dentro).
13. **Elegir** cierra el panel y lleva el foco al destino; **Esc** cierra y devuelve el foco al botón; **pulsar fuera** cierra. «Volver arriba» desplaza a 0 y lleva el foco al `h1` de `main` (si no hay, a `main`, que `GAppShell` ya hace enfocable). Medido en los tres motores.
14. **La barra local también está pegada**, así que el destino de un ancla debe quedar bajo ella: la maqueta suma su alto al `scroll-padding` (PI-L6). Medido: el destino queda bajo la barra local (no tapado) a 1024 y 375.
15. **Táctil:** con `pointer: coarse`, botón y filas ≥ 44 (medido 44; las filas siguen con elipsis).

## 4. Motor (el del contrato, sin cambios)

16. Línea de lectura de #1039 (`scroll-padding` + un tercio del visible; la última visible al final del documento) y **la elegida se sostiene** de #1048 hasta el primer desplazamiento posterior al salto. Medido: elegir una de las últimas secciones la deja actual tras el salto; un desplazamiento con la rueda reanuda la lectura y coincide con la regla.
17. **Una lectura de cajas por cuadro**, leyendo todas antes de escribir (lección de #964). El marcador se coloca con una lectura más (la fila y el cuerpo) cuando cambia la actual.
18. **Foco al elegir:** al destino (con `tabindex="-1"` si no es enfocable), sin desplazar (`preventScroll`). Ni el puntero ni el foco mueven la actual.

## 5. Movimiento

| Qué | Cómo | Reducido |
| --- | --- | --- |
| Marcador al cambiar de sección | `translate` con `--g-duration-slow` + `--g-ease-out` (el calco: `top .25s cubic-bezier(0,1,.5,1)`; 240 ms es el nivel más cercano de la escala, sin duración nueva) | Solo `opacity` `fast` (medido en los tres motores) |
| Color del enlace | `--g-duration-slow` (calco `.5s`, sin token: se traduce a `slow`) | Igual |
| Chevron del plegado | `rotate` 90° con `slow` + `ease-out` | Sin giro |
| PI-P1 · la lista se sigue | `scrollBy` suave dentro de la columna; **instantáneo** si el salto es mayor que la columna | Instantáneo |
| Nada al montar | La primera actual se pinta sin viajar (`is-instant` dos cuadros) | — |

Rúbrica: A cumple (el marcador dice dónde se lee); C cumple (nada mueve la página: el marcador y la lista se mueven **dentro** de la columna); D cumple (transiciones); E cumple (lo provoca el desplazamiento del usuario); F cumple; G a medir por bruno (prueba de 200 secciones de `page-index.md`, tareas < 50 ms). **No verificable aquí:** comodidad con desplazamiento inercial táctil.

## 6. Qué lo hace distinto (regla del usuario)

El aspecto es el del original; lo distinto es el comportamiento, y nada se ve en reposo.

- **PI-P1 · La lista se sigue sola (`follow`, activa por defecto).** Cuando la sección actual sale de la vista **de la columna**, la columna se desplaza **ella sola** lo justo para traerla de vuelta (con dos filas de margen), nunca la página. **Se detiene mientras el puntero está sobre la columna o el foco dentro** (quien está mirando la lista manda; regla 4 de #358). **Por qué sirve:** en la ficha de GCombobox el original perdía el marcador por debajo del visor a partir de la sección 20; ahora quien lee siempre ve dónde está sin tocar la columna. Medido: la actual visible dentro de la columna en las secciones 1, 6, 20, 40 y al final, sin mover la página; con el puntero encima, la columna no se mueve (tres motores). Captura: `proto-columna-1280-*-sigue.png`.
- **PI-P2 · Llegada (`landing`, opcional).** Al elegir una sección, el encabezado de destino lleva un instante la marca de llegada de Grana (`data-g-landed`, la de los niveles de `GDialog`, #589; `utils/landing.js`), decorativa. **Por qué sirve:** tras un salto largo el ojo encuentra el título al que llegó sin buscarlo, sobre todo cuando cae a media pantalla por estar al final del documento. Medido: el destino lleva `data-g-landed` al llegar. Reutiliza pieza y estilo: cero CSS nuevo en el índice.
- **No se propone** que el marcador «estire» o lea el progreso de la sección: cambiaría el aspecto calcado.

## 7. Pregunta de producto

- **PI-Q1 · Peso.** `@grana/vue/page-index` tiene tope de **3 KiB (3 072 B)** gzip (#1051) y mide 2 905 B con `relay`. `list` + `fold` + `level` (lista anidada, marcador, desplazamiento propio, disclosure) no cabe en los 167 B que quedan: **estimación de kiwi ≈ +1,2 KiB, sin medir** (el prototipo no es el `.vue`). Opciones: **(a)** subir el tope de la entrada (≈ 4,25 KiB con la estimación); **(b)** extensión aparte `@grana/vue/page-index-list` (como el filtro de `GSidebar`, #1050), de modo que quien solo usa `relay` no pague la columna. **Recomendación de kiwi: (b)**, por el mismo motivo que #1050.

## 8. Enmiendas y piezas para lima

| Id | Qué | Dónde |
| --- | --- | --- |
| **PI-L1** | `appearance="list"` sale de la reserva: §1 a §6 (anatomía, `nav` con `aria-labelledby` al título, sin encabezado, desplazamiento propio con `tabindex="-1"`, marcador, `follow`) | `page-index.md`, `DECISIONS.md` |
| **PI-L2** | Prop `fold` (Boolean, solo con `list`): *disclosure* con `labels.top` («Volver arriba») | `page-index.md` |
| **PI-L3** | `level` (2 \| 3) vale en `list`; sigue reservado en `relay` (#1038) | `page-index.md` «Modelo» |
| **PI-L4** | Textos: `labels.top` (obligatorio con `fold`; sin él, aviso). `list` no usa los textos de `GMenu` (no hay menú) | `page-index.md` «Props» |
| **PI-L5** | La instancia que no se pinta no lee ni emite (vale para todas las formas; `checkVisibility()` o `getClientRects().length` en el cuadro de lectura) | `page-index.md` «Motor» |
| **PI-L6** | Una barra pegada de la aplicación bajo la banda (la barra local) debe sumar su alto al `scroll-padding`: hoy el chasis solo cuenta banda y zócalo. Receta en `api.md` «Piezas pegadas» o entrada pública (`--g-app-shell-extra-top`) | `api.md`, `app-shell.md` |
| **PI-L7** | Tokens: **ninguno nuevo** (línea `border`, marcador `accent-text`, enlaces `text-muted`/`text`, título `title-sm-weight`, panel `surface` + `border-strong` + `shadow-2` + `radius-md`). El marcador de 2 px y las filas de 32 (`space × 8`) son medidas de coco | `tokens.md` §59 |
| **PI-L8** | Clases nuevas: `__body`, `__marker`, `__title`, `__scroll`, `__list`, `__sub`, `__link`, `__fold`, `__chev`, `__drop`, `__top`, `has-current`, `is-instant`, `g-page-index--fold`, `--align-start/end` | `page-index.md` «Clases» |
| **PI-L9** | Entrada y tope según PI-Q1 | `api.md` «Paquete» |

## 9. Hallazgos para otros dueños

- **PI-H1 (bruno):** el motor de `relay` debe exportar la lectura para que `list` la comparta sin copia (misma entrada o extensión por `__shared`).
- **PI-H2 (coco):** el calco usa `cubic-bezier(0,1,.5,1)` en el marcador; con `--g-ease-out` el viaje es algo más «blando». Medir con la rúbrica y decidir si basta.
- **PI-H3 (mora-docs):** el original titulaba las secciones de la ficha con duplicados («Props» y «Referencia de la API», S-H2); con la columna completa se nota más.

## Paridad · «En esta página» del sitio anterior → Grana

| Elemento | Lo hará | Δ medido / qué falta |
| --- | --- | --- |
| Columna de 224 a x = 1024 con línea guía | `list` | Δ x 0, Δ y del título 0, filas de 32 (Δ alto 0) |
| Título «En esta página» 14/600 | `list` (`label`) | Δ 0 |
| Enlaces `h2` 14/400 `text-muted`, `h3` sangrados 16 | `list` + `level` | Δ x 0 (PI-L3) |
| Actual en `text` + marcador 2 × 18 `accent-text` | `list` | Δ marcador centrado ±1,5 px (medido) |
| Columna pegada bajo la banda | Maqueta del sitio (`sticky`) | Cubre (no es del componente, §9) |
| Columna sin desplazamiento propio (defecto) | `list` con desplazamiento propio + PI-P1 | Corregido a propósito |
| Desplegable «En esta página ›» en la barra local | `list` + `fold` | Δ x 0 a 1024; −12 a 768; −4 a 375 (la barra local, no el componente) |
| «Volver arriba» | `fold` + `labels.top` | PI-L4 |
| Barra local de 48 pegada | Maqueta + `scroll-padding` | PI-L6 |

## Comprobaciones (`verificar.mjs`)

Por motor × tema: `nav` nombrado por su título sin encabezado propio y desplazador con `tabindex="-1"`; la columna cabe en el visor; en cuatro posiciones de lectura, una sola actual (`location`) y es la de la regla, marcador centrado y visible, actual visible dentro de la columna (PI-P1); al final del documento, la última visible; elegir una sección del final: actual al instante, sostenida tras el salto, foco en el destino, llegada (PI-P2); la rueda reanuda la lectura; con el puntero encima la columna no se mueve; consola limpia; con movimiento reducido el marcador solo funde. Plegada a 1024 y 375: oculta la columna, `aria-expanded`, «Volver arriba» primero, panel dentro del visor, táctil ≥ 44 (375), Esc devuelve el foco, elegir cierra y deja el destino bajo lo pegado; «Volver arriba» desplaza a 0, cierra y enfoca el `h1`. **198/198** (66 por motor), 2026-11-08. Capturas (Chromium): `proto-columna-1280-{claro,oscuro}-{lectura,sigue}.png`, `proto-plegada-{1024,375}-{claro,oscuro}.png`.

**No verificado:** lector de pantalla real con `aria-current="location"` en una lista larga y con la *disclosure*; desplazamiento inercial táctil; SSR real (la garantía es de diseño: el primer render solo pinta `items` y `modelValue`).
