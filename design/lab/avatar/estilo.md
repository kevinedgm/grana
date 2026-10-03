# Estilo · GAvatar (coco)

**Contrato:** `design/contracts/avatar.md` (lima, #293 a #297). **Estructura:** `design/lab/avatar/r01/` (kiwi).
**CSS:** `packages/vue/src/components/GAvatar/GAvatar.css` y las reglas del avatar en `GCard.css`, `GTable.css`, `GMenu.css`, `GSelect.css` y `GBadge.css`.
**Banco:** `estilo-banco.html` (componentes reales de `dist/` + el marcado exacto del contrato en `XAvatar`; el CSS de las seis hojas se carga desde `src/` dentro de `grana.components`). **Verificación:** `node design/lab/avatar/estilo-verificar.mjs` (Chromium, Firefox y WebKit).

## 1. Caja

| `size` | Lado | Rol de las iniciales | Radio del `square` | Icono de respaldo |
| --- | --- | --- | --- | --- |
| `xs` | `space × 5` | `caption` (12px) | `radius-xs` | `max(1em, lado × 0,5)` = 12px |
| `sm` | `space × 6` | `caption` | `radius-xs` | 12px |
| `md` | `space × 8` | `body-sm` (14px) | `radius-sm` | 16px |
| `lg` | `space × 10` | `body` (16px) | `radius-md` | 20px |
| `xl` | `space × 16` | `title-sm` (20px) | `radius-lg` | 32px |

- `inline-grid` centrado, `box-sizing: border-box`, `overflow: hidden`, `flex: none` y `min-inline-size` = lado: nunca se estira ni se encoge en una fila flex.
- `circle` = `50%` (geometría, `tokens.md` §28); `square` = un paso de la escala que sube con el tamaño. **Nunca** `--g-radius-shape`.
- Peso de las iniciales: `--g-text-title-sm-weight` en todos los tamaños (un monograma en 400 se lee flojo sobre el relleno suave); tamaño, interlineado y *tracking* del rol de cada tamaño.
- Todos los alias son `--_av-*` y se declaran en la raíz: el avatar vive dentro de huecos ajenos (`--_lead`, `--_mark`, `--_lh`…) y no hereda nada de ellos.

## 2. Color

- Neutro: `--g-color-neutral-soft` / `--g-color-on-neutral-soft`. `[data-cat="k"]`: `--g-color-cat-k-soft` / `--g-color-on-cat-k-soft` (k 1 a 12; nada de `-strong`, `-text` ni `cat-k`). Texto e icono, el mismo color.
- `k` que el tema no declara: el alias queda sin resolver, sin relleno y con la letra heredada (límite del contrato; el banco lo comprueba con la marca de 8 categorías).

## 3. Imagen

`<img>` en `inset: 0`, `object-fit: cover`, `border-radius: inherit`, opaca solo con `is-loaded`. Con `is-loaded` el respaldo pasa a `opacity: 0` + `visibility: hidden` (nunca `display: none`): la caja no depende del contenido.

## 4. Qué le da personalidad

**Implementado (solo con `prefers-reduced-motion: no-preference`; con `reduce`, todo instantáneo):**

1. **La imagen se revela desde las iniciales**, no aparece encima. Al cargar, las iniciales (o el icono) se desvanecen mientras la foto entra con `scale: 1.06` y se **asienta** a `1` en `--g-duration-fast × 2` con `--g-ease-standard`, como un enfoque. `visibility` es discreta: el respaldo sigue visible hasta el final del fundido al ocultarse (no hay un instante de relleno vacío) y vuelve al instante cuando cambia `src`. El círculo recorta la escala (sin salto de caja: medido 0px). Sirve al usuario: en una tabla que carga 50 caras, el cambio se percibe como la misma persona «enfocándose», no como 50 parpadeos.
2. **La forma se transforma**: cambiar `shape` anima `border-radius` (`--g-duration-fast`) en vez de saltar; útil cuando una vista alterna entre persona y entidad (p. ej. «Actuar como organización»).
3. **Monograma con ajuste tipográfico propio**: `font-variant-numeric: lining-nums` (un «3M» o «Ø» a la altura de las mayúsculas), `font-variant-ligatures: none` (dos iniciales nunca se funden en una ligadura) y `font-kerning: normal`; peso de `title-sm` en todos los tamaños.

**Para lima / kiwi (requieren contrato o estructura; no implementado):**

- **Revelado desde el color de la imagen**: un `placeholder` (color dominante o LQIP de pocos bytes que da la API) pintado como relleno mientras carga, para que la foto aparezca desde su propio tono. Necesita una prop nueva y decidir si es color libre (hoy prohibido: §Color) o una `data:` de baja resolución; además, un límite de tamaño.
- **Anillo de pila para `GAvatarGroup`**: separar avatares solapados con un recorte (`mask`) del color de la superficie en lugar de un borde, con el solapado lógico en RTL. Llega con la ronda de `GAvatarGroup` (reservado en el contrato).

## 5. Huecos de otros componentes (#295)

| Anfitrión | Regla | Resultado medido |
| --- | --- | --- |
| `GCard` `lead` | `.g-card:not(.is-loading) .g-card__lead:has(> .g-avatar)`: `border-width: 0`, `border-radius: 0`, `background: none`, `overflow: visible`. La regla «llenar la caja» pasa a `> :not(.g-avatar)` | Caja 40 = avatar `lg` 40, centrado; una sola forma; con icono, marco intacto; esqueleto idéntico con y sin avatar |
| `GTable` `leading-{key}` | `.g-table__leading:has(> .g-avatar)`: tamaño `auto` (adopta la caja del avatar), sin radio, relleno ni recorte | 32 = 32; `square` cuadrado; altura de fila igual al `leading` de texto, que no cambia |
| `GMenu` `icon` | Alias `--_slot` (= `--_mark`) declarado en cada lista; con algún `.g-avatar` hijo directo de un hueco de la lista (o de sus grupos), `--_slot: space × 5`. El `svg` del icono mide siempre `--_mark` | Todos los huecos no vacíos a 20; icono de 18 centrado; etiquetas alineadas; alto 36 = 36; un menú solo de iconos no cambia; un submenú decide por sí mismo |
| `GSelect` `icon` | `.g-select__icon:has(> .g-avatar)` a `space × 5`. Junto al valor: `vertical-align: top` y margen `(interlineado − lado) / 2`, así el centro del avatar cae en el centro de la línea (= el del texto) y su caja de margen mide el interlineado; si el lado lo supera (p. ej. `space` 5), el valor gana el exceso como relleno y lo devuelve con margen negativo (su `overflow: hidden` no recorta) | Δ centro 0,00px en `sm`/`md`/`lg`/`xl` y con `space` 5; avatar entero; alto del control y de la opción sin cambio |
| `GBadge` anclada | Sobre `.g-avatar--shape-circle`, los `inset` de la colocación pasan a `--_contour: calc(50% − 50% / sqrt(2))` (el punto a 45° está a `(1 − 1/√2)·r` de la esquina en cada eje; los `%` se resuelven contra la caja del ancla, que es la del avatar) | Centro de la insignia en el contorno (±1px) en las cuatro colocaciones, LTR y RTL, `sm`, `lg` y `xl`; sobre `square`, en la esquina |

**Constante geométrica** `1 − 1/√2` en `GBadge.css` y los factores `0,5` (icono) y `1,06` (asentamiento) en `GAvatar.css`: proporciones del componente, no tema (criterio de #187 y #205). **Para lima:** registrarlas junto a las de #187 en `tokens.md` si lo considera necesario.

## 6. Accesibilidad y preferencias

- Contraste (medido): iniciales ≥ 4,5 e icono ≥ 3 (mismo color) en neutro y las 12 categorías (`tema-cat12`) y las 8 (`tema-marca-cat8`), claro y oscuro: mínimo **4,52** (oscuro, `cat-7` y `cat-6`). Neutro en los once temas generados, claro y oscuro: mínimo **4,53** (`stripe`).
- `forced-colors`: borde `--g-border-width solid CanvasText` dentro de la caja (`border-box`; tamaño sin cambio) y texto `CanvasText`.
- RTL: el avatar no cambia; las iniciales llevan `dir="auto"`; la insignia anclada se espeja.
- Sin hover, foco ni pulsado (no es interactivo); sin área táctil.

## 7. Qué espera el CSS (para bruno)

```html
<span class="g-avatar g-avatar--size-{xs|sm|md|lg|xl} g-avatar--shape-{circle|square} g-avatar--content-{initials|icon} [is-loading|is-loaded|is-failed]" [data-cat="k"] aria-hidden="true" | role="img" aria-label="…">
  <span class="g-avatar__initials" dir="auto" translate="no">AL</span>   <!-- o: <svg class="g-icon g-avatar__icon" aria-hidden="true" focusable="false">…</svg> -->
  <img class="g-avatar__img" src="…" alt="" loading="lazy" decoding="async" draggable="false">   <!-- solo con src y sin fallo, siempre la ÚLTIMA hija -->
</span>
```

- El respaldo es **hijo directo** de la raíz y va **antes** de la `<img>`; ningún envoltorio entre ellos (las reglas usan `> :not(.g-avatar__img)` y `> .g-avatar__img`).
- `is-loaded` solo tras `load` (o `complete && naturalWidth` al montar); `is-failed` quita la `<img>`.
- En los anfitriones, el `GAvatar` debe ser **hijo directo** del hueco (`g-card__lead`, `g-table__leading`, `g-menu__icon`, `g-select__icon`) o del ancla de `GBadge` (`g-badge-anchor > .g-avatar`).
- `GAvatar.css` entra en `CAT_FAMILY_READERS` de `levels.test.js` (lo añade bruno) y en `components.css`.

## 8. No verificado

`forced-colors` real (Windows) y en Firefox/WebKit (no se emula); lectores de pantalla; carga diferida real por motor; escrituras complejas (devanagari, tailandés, ZWJ); temas con `space` y tipografía desacoplados más allá de `space` 5.
