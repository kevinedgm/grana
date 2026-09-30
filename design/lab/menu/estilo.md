# Entrega de coco · menú (GMenu)

**Archivos:** `packages/vue/src/components/GMenu/GMenu.css` · se **retira** de `GWidget.css` el CSS del menú antiguo (`g-widget__actions`, `g-widget__action` y sus reglas de movimiento y de colores forzados; queda solo el botón `g-widget__menu`).
**Contrato:** `design/contracts/menu.md` y `design/contracts/widget.md` (DECISIONS.md #82 a #84). **Sin tokens nuevos** (ni cambios en `defaults.css`).
**Estado:** listo para bruno. **Registro pendiente en `components.css`** (es de bruno) y **`GWidget.vue` todavía emite las clases antiguas**: hasta que bruno lo migre a `GMenu`, el menú del widget en el playground saldrá sin estilo.
**Banco de pruebas:** `design/lab/menu/estilo-banco.html` (desde la raíz: `/design/lab/menu/estilo-banco.html`): el marcado exacto del contrato con el CSS real y un motor mínimo que imita lo que hará bruno; botones de tema de prueba, oscuro, RTL y densidad compacta. El banco de widgets (`design/lab/widget/estilo-banco.html`) se actualizó al menú nuevo.

## Decisiones estéticas

| Detalle | Cómo |
| --- | --- |
| **Lista** | Superficie con borde `--g-color-border-control` (3:1), `--g-radius-lg`, `--g-shadow-2` y relleno de `space × 1.5`; ancho mínimo `space × 50` (200px) y máximo `space × 80` (320px); entra con un fundido y una escala de 0.96 desde su esquina de inicio (espejada en RTL); con `prefers-reduced-motion` solo el fundido |
| **Coordenadas físicas** | La lista se coloca con `left` y `top` (`--_x`, `--_y`): el componente calcula coordenadas del visor, y con propiedades lógicas el menú salía en el lado equivocado en RTL (hallazgo de kiwi) |
| **Elemento** | Alto `max(24px, space × 9)` (44px con `pointer: coarse`), radio `md`; el activo (foco, ratón o submenú abierto) en `--g-color-surface-sunken`; el foco visible es un contorno de `--g-focus-width` **hacia dentro** |
| **Icono y atajo** | Icono de `space × 4.5` en `text-muted`; atajo en `caption` y `text-subtle`, a la derecha |
| **Deshabilitado** | `text-subtle` y **tachado**; sigue enfocable (el foco sí lo destaca) |
| **Peligroso** | `danger-text`, **negrita** y un **triángulo** recortado con `clip-path` antes de la etiqueta |
| **Casilla y opción** | Marca de `space × 4.5`, borde `border-control`; marcada: relleno de `brand`, con un **✓** hecho con dos bordes girados (casilla) o un **punto** (opción), en `on-brand`; la opción es un círculo |
| **Submenú** | Chevron dibujado con dos bordes; **en RTL se gira +45°** (los bordes son lógicos, así que la esquina ya está en el lado contrario) y apunta a la izquierda |
| **Grupo y separador** | Título en `caption` y `text-subtle`; separador de `border-strong` |
| **Colores forzados** | Borde, marcas, foco y deshabilitado pasan a colores del sistema; la marca de la casilla y el punto de la opción se siguen viendo (`CanvasText` sobre `Canvas`) |
| **Sin literales de tema** | Solo tokens y `space`; únicos literales de medida: `24px` y `44px`. Sin consultas de medios de ancho |

## Verificación en Chromium (banco de pruebas)

| Prueba | Resultado |
| --- | --- |
| Literales | Sin colores literales ni valores de respaldo; sin `@layer` ni `<style>` |
| Medidas por defecto | Lista de 200px (mínimo), elemento de 36px, marca de 18px; con `space` 5, lista de 250px, elemento de 45px y marca de 23px |
| Contraste (tema por defecto) | Etiqueta 17.4:1 · atajo, deshabilitado y título de grupo **5.1** · peligroso **5.49** · borde de la lista **3.45:1** · casilla sin marcar (borde) 3.45 · casilla marcada (relleno) 16.48 |
| Contraste (tema propio) | Etiqueta 13.3 · atajo 7.28 · peligroso 7.46 · borde 5.22 · casilla marcada 4.6 · sin marcar 6.05 |
| Contraste (oscuro) | Etiqueta 15.22 · atajo y deshabilitado 6.21 · peligroso **4.52** · borde 4.66 · casilla marcada 15.22 · sin marcar 4.32 |
| Separador | 1.45:1 (decorativo: no lleva información) |
| Foco | El elemento activo recibe un contorno de 3px en el color de foco (tema por defecto, en el banco con teclado) |
| Submenús y RTL | Submenú a la derecha del padre; en RTL, a la izquierda, con el chevron apuntando a la izquierda (**corregido en la verificación**: salía apuntando hacia arriba) |
| Posición | Debajo del disparador del widget (verificado en el banco de widgets); lista larga con `--_max` y desplazamiento |
| Oscuro | Con `data-theme="dark"`, lista y marcas legibles y coherentes |
| Consola | Sin errores |

## Hallazgos y observaciones

1. **El chevron de RTL salía mal** con `rotate: 135deg` (apuntaba hacia arriba): con bordes lógicos hay que girar +45°. Corregido y verificado.
2. **El texto peligroso en oscuro queda en 4.52:1**, el mínimo de la regla de derivación del tema oscuro (los semánticos como texto rozan 4.5:1; ver `design/lab/tema-oscuro/estilo.md`).
3. **`GWidget.vue` y `GWidgetGrid.vue`** aún generan el menú antiguo: bruno debe migrarlos a `GMenu` (contrato `widget.md`), y sus pruebas esperan las clases `g-widget__action`.

## Sin verificar (no bloquea `candidate`)

Lector de pantalla; `forced-colors` y `pointer: coarse` reales (solo comprobé que las reglas existen); Firefox y Safari (`popover`, `:dir()`, `@starting-style`); textos largos o traducidos; el menú dentro de un `GDialog`.
