# Entrega de coco · tema oscuro

**Archivos:** `packages/vue/src/styles/defaults.css` (capa `grana.defaults`; bloque oscuro al final) y `packages/cli/src/defaults.js` (sincronizado con `scripts/sync-defaults.mjs`, que ahora lee solo el tema claro).
**Contrato:** `docs/contract/tokens.md` §15 (DECISIONS.md #79 a #81).
**Estado:** listo para bruno (derivación oscura en el CLI; el script de sincronización y su prueba se ajustaron solo para ignorar el bloque oscuro: la extracción de `DARK` es de bruno).
**Banco de pruebas:** `design/lab/tema-oscuro/estilo-banco.html` (desde la raíz: `/design/lab/tema-oscuro/estilo-banco.html`): el claro y el oscuro lado a lado con `data-theme` y los 26 pares del contrato calculados en vivo, más botones para automático, forzar claro y forzar oscuro.

## Cómo quedó `defaults.css`

| Bloque | Selector | Contenido |
| --- | --- | --- |
| Color, claro | `:root, [data-theme="light"]` | `color-scheme: light` y el grupo de color del claro (**132 valores sin cambio**: verificado contra el archivo anterior) |
| Resto | `:root` | Radios, bordes, movimiento, superficies (`gap`, `radius`), sidebar, widgets, espaciado y tipografía: no cambian con el esquema |
| Color, oscuro (automático) | `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }` | `color-scheme: dark` y el grupo de color del oscuro |
| Color, oscuro (forzado) | `[data-theme="dark"]` | Lo mismo |

Orden obligatorio: claro, consulta oscura, `[data-theme="dark"]`. Cada bloque redeclara **también los tokens definidos con `var()`** (`focus`, `surface-shell`, `surface-inset`, `calendar-*`): se resuelven donde se declaran, y sin eso una sección oscura heredaría los valores claros.

## Valores del oscuro

| Token | Valor | Nota |
| --- | --- | --- |
| `bg` · `surface` · `surface-sunken` | `#141414` · `#1C1C1C` · `#101010` | Gris casi negro; lo elevado es más claro |
| `text` · `text-muted` · `text-subtle` | `#F2F2F2` · `#B8B8B8` · `#9C9C9C` | |
| `border` · `border-strong` | blanco al 10 % y al 20 % | Decorativos (1.34:1 y 1.9:1) |
| `border-control` | `#808080` | |
| `brand` | `#F2F2F2` (strong `#FFFFFF`, soft `#2A2A2A`, `on` `#17151A`) | Tinta invertida: casi blanco con texto casi negro |
| `accent` · `info` | `#3383F0` (strong `#4D96FF`, soft `#0E2442`) | Derivados con las reglas del contrato |
| `neutral` · `success` · `warning` · `danger` | `#858585` · `#3F9560` · `#AF792F` · `#E4523D` | Derivados con las reglas del contrato (script de derivación de coco sobre las funciones del CLI) |
| Cristal | `tint #1C1C1C`, opacidad **0.72**, borde y brillo blancos al 18 % y 10 % | Mínimo 0.63 para texto claro; peor caso sobre blanco 6.01:1 |
| Fondo de diálogos | negro al 60 % | |
| Sombras | alfa 0.30, 0.50 y 0.60 | El tema sigue prefiriendo bordes |

## Verificación (Chromium)

| Prueba | Resultado |
| --- | --- |
| Activación | Con el sistema oscuro emulado y sin atributo: `surface #1C1C1C`, `color-scheme: dark`, fondo `rgb(20,20,20)`. `data-theme="light"` fuerza `#FFFFFF`; `data-theme="dark"` fuerza el oscuro |
| Anidado | Una sección `data-theme="light"` dentro del oscuro automático restablece los tokens claros (el botón `brand` vuelve a la tinta oscura) y una sección `data-theme="dark"` dentro de un claro forzado resuelve el foco con el `accent-text` **oscuro** |
| Pares de tokens del contrato | **Los 26 pasan en los dos esquemas** (banco): `text` 15.22:1 sobre `surface` (8.59 el atenuado, 6.21 el sutil); `border-control` 4.32:1; semánticos como texto sobre `surface` **4.52 a 4.62**; `on` sobre cada base 4.81 a 4.93 (16.19 en `brand`); `on-soft` sobre `soft` 4.51 a 4.66; foco 4.58:1 |
| Barrido de componentes reales (playground) | **462 textos visibles** con el contraste calculado contra su fondo compuesto: **0 fallos** en componentes. Las 4 excepciones son del playground: tres `<pre>` con fondo blanco fijo y un avatar con clase `g-btn` sobre `surface-sunken` |
| Literales | Los componentes no cambian; ninguno lleva colores literales (los valores de tema solo están en `defaults.css`) |
| Claro sin cambio | Los 132 tokens del claro coinciden con los del archivo anterior; el CLI conserva sus 51 pruebas |
| Consola | Sin errores |

## Observaciones (no bloquean)

- **Los semánticos como texto sobre `surface` rozan 4.5:1** (4.52 a 4.62): es el mínimo de la regla de derivación, no un margen. Cualquier superficie más clara que `surface` los bajaría del mínimo; hoy no existe ninguna en el tema.
- **El texto de color sobre su propio fondo `soft` no es un par del contrato** (da 4.1 a 4.2): para eso existe `on-soft`. Los componentes ya lo usan.
- **Los bordes (1.34:1) y la diferencia `bg`/`surface` son sutiles**: es lo que define el contrato (profundidad por luminosidad y bordes finos); en tarjetas sin borde de control el límite se ve poco. No es información: los controles usan `border-control` (4.32:1).
- **`brand` casi blanco** da un botón principal muy luminoso sobre un fondo oscuro; es la inversión de la tinta del claro (decisión #80).

## Sin verificar (no bloquea)

Lector de pantalla y Firefox y Safari (`color-scheme`, `:not([data-theme])` con `prefers-color-scheme`); el tema oscuro con un tema propio del usuario (depende de la derivación del CLI, que es el paso siguiente); una auditoría componente por componente con capturas (se hizo el barrido numérico y una revisión visual del playground); `forced-colors` junto al oscuro; imágenes e iconos de la aplicación.
