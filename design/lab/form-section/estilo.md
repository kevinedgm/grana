# GFormSection · estilo (coco) · Fase 3

**CSS:** `packages/vue/src/components/GFormSection/GFormSection.css` (Fase 1 + Fase 3). **Contrato:** `design/contracts/form.md` §3 (#161, #192, #283 a #291). **Estructura:** `design/lab/form-section/r01/` (kiwi). **Tokens:** `tokens.md` §27, ninguno nuevo; `defaults.css` sin cambios.
**Banco:** `estilo-banco.html` (componentes reales de `dist/` + marcado de la Fase 3 hecho a mano en `XSection`, que pinta las clases del contrato y simula las medidas de bruno). **Verificación:** `node design/lab/form-section/estilo-verificar.mjs` → **948/948** en Chromium, Firefox y WebKit, consola limpia.

## Carácter

La sección sigue sin caja, fondo ni línea propia. Plegable: **el título entero es el botón** y lo único que se añade es un chevron gris al inicio; el botón no dibuja nada (sin fondo, borde ni relleno) y tiene exactamente la tipografía del título fijo. Agregable sin agregar: un `GBtn outline` en el sitio de la sección, con su descripción debajo. La línea de `divider` es un `GDivider subtle` dentro del hueco que ya existía.

## Decisiones

| Qué | Valor | Por qué |
| --- | --- | --- |
| Botón del título | `display: flex` dentro del `hN`, `font: inherit`, `letter-spacing: inherit`, `color: inherit`, sin caja | Bloque y no en línea: un `inline-flex` hereda la caja de línea del `hN` y el título crecía 1–2px frente al fijo. Medido: título plegable de una línea = título fijo (24px) |
| Objetivo | `::after` centrado, `max(100%, 24px)`; `max(100%, 44px)` con `pointer: coarse` | Precedente `GHelper`/`GBtn`: el objetivo crece sin mover el título entre punteros (2.5.8) |
| Anillo | `--g-focus-width` sólido `--g-color-focus`, `--g-focus-offset`, `--g-radius-xs` en el botón | Igual que el título enfocado de una agregada |
| Chevron | Caja del interlineado del título, icono de 1em del título (16px), centrado en la **primera línea**; `--g-color-text-muted`; hover (solo `hover: hover`) a `--g-color-text` | Mismo hueco que `lead` (#203); gris porque es una señal del botón, no el nombre |
| Giro | Abierta `rotate: 90deg`; RTL `scale: -1 1` y abierta `rotate: -90deg` (`:dir(rtl)`); `--g-duration-fast`, `--g-ease-out`; sin transición sin `is-ready`, con `is-instant` o con movimiento reducido | Precedente `GSidebar` (#71); el giro es corto (contrato: «fundido y giro» con `fast`). Medido como dirección de la punta: LTR →, ↓; RTL ←, ↓ |
| Sangría del texto | Resumen, descripción, ayuda y acciones abajo: `margin-inline-start: calc(título + space-2)` | Se alinean con el texto del título (contrato punto 4); con `lead`, con el icono. El cuerpo **no** se sangra: los campos conservan el borde de inicio de las demás secciones (#171) |
| Línea de estado | body-sm, `--g-color-text-muted`; `__status` `--g-color-danger-text` + `circle-alert` de 1em, separación `space-1`; entre estado y texto `space-3`; envuelve | Texto + icono (1.4.1). Contraste del estado: 5,49 claro / 4,51–4,55 oscuro en los doce temas |
| «Agregar …» | `__add` en columna, botón de su tamaño, descripción a `space-2` | El botón tiene borde: 4px de su caja al texto quedaba apretado |
| Panel | La transición de `GFormReveal` (§14) en `__panel`: `0fr → 1fr` con `--g-duration-slow`, fundido `--g-duration-fast` (al abrir con retraso, al plegar desde el principio), `visibility` al final; cerrado `margin-block-start: −gap propio` (`--_gap` = `space-4 × densidad`, el mismo del `gap` de la sección) | Sin hueco plegada y lo de abajo se mueve de forma continua. `:not(.is-instant)` en las reglas de transición (sin `!important`) |
| Recorte | `__body` `overflow: hidden` + `min-block-size: 0`; asentado y abierto, `overflow: visible`; reinicio del `fieldset` | No recorta anillos; el `fieldset` de `addable` no desborda a 320 |
| Acciones abajo (L9) | `is-actions-below` (y al lado): encabezado de una columna, acciones al inicio, `margin-block-start: space-2`, tras la descripción | Orden visual = DOM. Medido: el título de la Fase 1 real a 320 pasa de 58,7px a 286px |
| Acción ghost apilada | Abajo o al lado, la primera acción `ghost` (no de solo icono) lleva `margin-inline-start: −(--_px × --_density + --g-border-width)` (alias del propio `GBtn`) | Sin caja visible en reposo, lo que se lee es su texto: se alinea con el de la descripción (auditoría, hallazgo 2). Medido: texto = descripción ±0,5px a 320 en la Fase 1 y en la plegable. `GBtn.css` avisa de que `--_px`/`--_density` se leen aquí |
| Al lado | Rejilla `minmax(0,1fr) minmax(0,2fr)`, separación `--g-form-section-gap × densidad`, `align-items: start`, panel sin margen | 1 : 2 como el *wireframe* de kiwi y las páginas de ajustes; separación de sección (40px). Título alineado con la primera etiqueta (Δ 0) |
| `divider` | `position: absolute` (la sección es `relative` solo con `:has(> __divider)`), `inset-inline: 0`, `inset-block-start: −(section-gap × densidad) / 2`, `translate: 0 −50%`; `display: none` salvo con `.g-form-section:not([hidden]) ~` | Un mecanismo dentro y fuera de `GForm`; `relative` solo cuando hace falta para no cambiar el bloque contenedor de nadie más |
| `[hidden]` | `.g-form-section[hidden] { display: none }` | La raíz es flex y ganaba al estilo del agente para `hidden` (agregable sin agregar en `readonly`) |
| `forced-colors` | Chevron `ButtonText` | Es parte del botón; el resto (anillo, línea, estado) ya lo resuelve el sistema |

## `:disabled` heredado al quitar (cambio en otras hojas de coco)

Al quitar una agregable el `fieldset disabled` se pone en el acto y el panel se funde: el mismo «salto a gris» de `GFormReveal`. Las reglas `:disabled` de `GBtn.css` (4), `GCheckboxGroup.css` (2), `GFieldGroup.css` (1) y `GHelper.css` (1) llevan ahora, además del `:where` de §14, `:where(:not(.g-form-section--mode-addable:not(.is-open) > .g-form-section__panel *))` (especificidad intacta). Medido: el `GBtn` de dentro conserva color, fondo, borde y cursor en el primer cuadro del fundido. `estilo-verificar.mjs` de `GFormReveal` sigue en 143/143 (Chromium).

## Qué mide `estilo-verificar.mjs`

Estático: sin literales (solo 24px y 44px), sin respaldos, sin `@layer`, sin `!important`, propiedades lógicas, `:hover` solo en `@media (hover: hover)`, tokens existentes, ninguno declarado, sin `--g-divider-inset`, sin `accent`/`brand`/`primary`/`active`; las cuatro hojas con el `:where` nuevo. En página: sin transición al cargar; plegada y sin agregar sin hueco (altura 0, `hidden`, `inert`, margen = −gap; la sección mide su encabezado); tipografía y altura del título del botón = la del fijo; sangría del texto (LTR, RTL, con `lead`); chevron centrado en la primera línea, dirección y giro con `fast`, el de otra sección no gira; **Δ0 del botón y del desplazamiento en cada cuadro** al abrir y plegar (a media vista, pegado arriba, RTL, al lado) y de la sección al agregar y quitar; intermedios (altura, margen y opacidad); `is-instant` sin transiciones y abierta en el primer cuadro; quitar sin salto a gris; `divider` 40/35/30 dentro y 40 fuera, centrada ±0,5px, a todo el ancho, sin línea en la primera, plegadas y abiertas, con fija y agregable sin agregar; L9 a 320 (Fase 1 real y plegable) y 480 sin bajar; al lado 1 : 2, título = primera etiqueta ±1px, plegada mide el encabezado, «Agregar …» a todo el ancho; 320 todo abierto sin desborde; `readonly` sin hueco; anillo con Tab; objetivo ≥ 24px y 44px con puntero grueso (Chromium y WebKit; Firefox no lo emula); contraste de título, chevron, estado, resumen y descripción en 24 combinaciones de tema; movimiento reducido; `forced-colors` (Chromium).

## Observaciones (no bloquean; para lima/kiwi)

- **La línea de estado aparece y desaparece en el acto** (es un `v-if` del contrato): en el primer cuadro, lo que hay debajo de la sección se mueve su altura (22px: −22 al abrir, +22 al plegar) y luego sigue el panel de forma continua. El botón no se mueve (Δ0). Si se quiere continuo del todo, la línea tendría que quedarse montada hasta el final de `is-animating`; es estructura, no CSS.
- ~~Una acción `ghost` abajo se alinea por su caja~~: resuelto en la auditoría (hallazgo 2), el texto se alinea con la descripción.
- Con un título largo a 320, la insignia «Opcional» de una plegable salta a la línea siguiente al inicio del encabezado (bajo el chevron), como hoy bajo el `lead` de una fija.

## No verificado

`forced-colors` real y en Firefox/WebKit; Safari, iOS y táctil reales; lector de pantalla. El componente real se auditó en el paso 5: `auditoria.md` y `node design/lab/form-section/auditoria-verificar.mjs`.

## Para bruno: marcado que espera el CSS

```
section.g-form-section.g-form-section--mode-{static|collapsible|addable}
       [.g-form-section--optional][.is-open][.is-added][.is-ready][.is-animating][.is-instant][.is-header-side][.is-actions-below][hidden]
  hr.g-divider.g-form-section__divider                        primer hijo, solo con divider (GDivider decorative subtle inset none)
  div.g-form-section__header                                  hijo directo (static, collapsible, addable agregada)
    div.g-form-section__heading
      span.g-form-section__lead                               static/addable, inmediatamente antes del hN
      hN.g-form-section__title
        button.g-form-section__toggle                         collapsible; hijos en este orden ↓
          span.g-form-section__chevron > svg.g-icon           chevron-right, hijo directo (sin flip-rtl: el espejo es del CSS)
          span.g-form-section__lead                           opcional
          span.g-form-section__toggle-text
      .g-badge
    p.g-form-section__summary                                 hijo directo del header, antes de __description
      span.g-form-section__status > svg.g-icon + texto        icono hijo directo
      span.g-form-section__summary-text
    p.g-form-section__description · div.g-form-section__actions · div.g-form-section__help   hijos directos
  div.g-form-section__add > .g-btn.g-form-section__add-button + p.g-form-section__description
  div.g-form-section__body                                    static: hijo directo de la raíz
  div.g-form-section__panel[inert] > (div | fieldset[role=none][disabled]).g-form-section__body   hijo directo y único
  dialog.g-form-section__confirm                              último hijo (cerrado no ocupa sitio)
```

- `is-open` = panel visible (`collapsible` abierta o `addable` agregada), en el mismo parche que `inert`/`disabled`. `is-added` solo en `addable`. Sin `is-ready` no hay transiciones: ponlo **después de escribir la primera medida** (`is-header-side`/`is-actions-below`); si no, el paso a «al lado» de un panel plegado anima su margen al cargar (lo vio WebKit en el banco).
- `is-instant` en el mismo parche que `is-open`; quítalo tras doble rAF. `transitionend` de `grid-template-rows` con diana el panel; con movimiento reducido solo hay `opacity`/`visibility` (respaldo con temporizador, como `GFormReveal`).
- L9: ancho de `__header` − ancho natural de `__actions` (hijos + `column-gap` de `__actions`) − `column-gap` de `__header` < `space × 40` → `is-actions-below`. Al lado no aplica. Vale también para `static`.
- El `id` de la raíz no hace falta para el CSS; el `:has(> .g-form-section__divider)` sí necesita el `<hr>` como hijo directo.
