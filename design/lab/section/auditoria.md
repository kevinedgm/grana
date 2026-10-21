# Auditoría · GSection (paso 5, coco)

**Componente:** `GSection` (`GSection.vue` de bruno, 6cb6e76; principal) sobre `GSection.css` (coco, ebd961d) y `section.md` (lima, 86297b9; #717, #720, #723) · **Fecha:** 2026-10-21 · **Resultado:** sin defecto bloqueante → **`candidate`**

**Verificación propia:** `GRANA_PW_PORT=4215 node design/lab/section/auditoria-verificar.mjs` (requiere `npm run build`), sobre `design/lab/section/auditoria-banco.html` con `GSection`, `GPageHeader`, `GStack`, `GSurface`, `GCard` y `GBtn` **reales** de `dist/`, y dentro de `GAppShell` real (`packages/vue/playground/app-shell.html`).

| Motor | Comprobaciones |
| --- | --- |
| Chromium | 224/224 |
| Firefox | 222/222 |
| WebKit | 222/222 |
| **Total** | **668/668** |

Además, los specs de bruno sobre el estado final (`GRANA_PW_PORT=4217 npx playwright test tests/app-shell.spec.mjs tests/app-shell-perf.spec.mjs tests/container.spec.mjs tests/stack-section.spec.mjs`, tres motores): **196 pasan, 2 omitidos por diseño** (`forced-colors` solo en Chromium); aquí cuentan `stack-section.spec.mjs`.

**Temas:** por defecto, `spotify` y `medium` de `generated/`, `grana` derivado por `@grana/cli`, el de prueba (`space` 5, `--g-font-title` serif, borde 2 px), todos en claro y oscuro, y uno **solo con títulos serif** (`--g-font-title: Georgia`, la pregunta de la familia). Captura: `auditoria-familia.png` (tema por defecto ↔ títulos serif).

## Auditoría previa

Sin superficie: la jerarquía la hacen la tipografía y el aire. Riesgos al empezar: que el esquema (`hN`) y el tamaño se desalineen, la familia de los títulos anidados con un `--g-font-title` distinto del de la interfaz (anotado a lima), el contraste de la descripción `muted` sobre superficies, y las acciones en poco ancho.

## Auditoría posterior

| Aspecto | Estado | Evidencia (componente real, tres motores, 11 temas) |
| --- | --- | --- |
| Anidación real | Cumple | Bajo el único `h1` (de `GPageHeader`): `h2 → h3 → h4 → h4` por anidación, sin saltos |
| Tamaño por profundidad | Cumple | `title-sm › body › body-sm › body-sm` de cada tema (20 › 16 › 14 › 14 con la escala por defecto), estrictamente decreciente y con suelo en 14; peso 600 y `dir="auto"` en todos |
| Nivel fijado (#196) | Cumple | `headingLevel` 3 en profundidad 2 → `h3` de 16; `headingLevel` 4 en profundidad 1 (dentro de una `GCard`) → `h4` con el tamaño de la profundidad 1 |
| Familia | Cumple el contrato · **decisión de lima** | Profundidad 1 = `--g-font-title`; 2 y 3 = `--g-font-ui`. Con títulos serif: `h1` y `h2` serif, `h3` y `h4` en la de interfaz, igual que los títulos de `GCard` y `GFormSection` (ver «Para lima») |
| Aire | Cumple | Título → descripción `space × 1`, cabecera → cuerpo `space × 4`, entre hijos del cuerpo `space × 6`, con el `space` de cada tema |
| Contraste | Cumple | Título y descripción ≥ 4,5:1 sobre la página, `GSurface`, superficie hundida y `GCard` en los 11 temas; descripción ≥ 12 px |
| Acciones | Cumple | En un grupo con nombre (`role="group"`, `labels.actions`), en la fila del título; a 320 px bajan bajo el título sin desbordar (LTR y RTL); el título largo se parte en varias líneas sin recortarse |
| Región con nombre | Cumple | Una sola `region`, la que pide `landmark`, con el nombre del título (árbol de accesibilidad) |
| Sin descripción ni acciones | Cumple | No se pintan ni el `p` ni el grupo; la sección no tiene fondo ni borde |
| Dentro de `GAppShell` | Cumple | Un `#id` de sección queda bajo banda + zócalo pegados con `space × 4` de aire (`scroll-padding` del chasis + `scroll-margin` de la sección) |
| RTL | Cumple | El título empieza a la derecha |
| `forced-colors` (Chromium) | Cumple | Título y descripción con colores del sistema distintos del fondo |
| Estados, carga, vacío, error | N/A | No interactiva (las acciones son `GBtn`) |
| Movimiento | N/A | Ninguno (rúbrica: no aplica) |
| Consola | Cumple | Limpia |

## Correcciones de esta auditoría

- Ninguna en `GSection.css`.
- `design/lab/section/estilo-banco.html`: el glifo `›` del texto del banco pasó a `→` (lo marcaba `src/icons/icons.test.js` y `check-icons.mjs`).

## Para lima

1. **Familia de los títulos anidados.** Medido (`auditoria-familia.png`): con un `--g-font-title` serif, `h1` (de `GPageHeader`) y `h2` salen serif y `h3`/`h4` en la de interfaz. Mi recomendación: **mantener** `--g-font-ui` en las profundidades 2 y 3, por tres razones: (a) es el rol de los títulos de `GCard` y `GFormSection`, que suelen vivir dentro de una sección, así que una sección de profundidad 2 y una tarjeta hermana tienen la misma voz; (b) una serif de visualización a 16 y 14 px pierde legibilidad (es una familia de titular); (c) el cambio de familia entre `h2` y `h3` refuerza la jerarquía que ya marca el tamaño. Si decides lo contrario, es una línea en `GSection.css`. En los dos casos, añadir a `tokens.md` §23.1, fila de `GSection`: «las anidadas, `--g-font-ui`».
2. La base `space × 60` del bloque de títulos (el punto en que las acciones bajan) es constante de coco; si quieres, a `tokens.md` §49.
3. Ningún token nuevo.

## Para bruno

Nada. Las clases, los niveles, `aria-labelledby` solo con `landmark`, `dir="auto"` y el grupo de acciones son los del contrato.

## Para mora-docs (`GSection/README.md`)

La regla del nivel (lo pone el documento) y del tamaño (lo pone la anidación; `headingLevel` cambia la etiqueta, no el tamaño); la frontera con `GCard`, `GFormSection` y `GAccordion`; `landmark` con moderación; con un tema de títulos serif, solo la primera profundidad es serif.

## Cumplimientos / Correcciones / Pendientes

**Cumplimientos.** Esquema y tamaño alineados con la anidación real, nivel fijado sin cambiar el tamaño, aire con el `space` del tema, contraste ≥ 4,5:1 sobre cuatro fondos en 11 temas, acciones y título largo a 320, región con nombre, `#id` bajo lo pegado del chasis, RTL, `forced-colors`, consola limpia, en los tres motores.

**Correcciones.** Glifo del banco de estilo (vitest de iconos).

**Pendientes.** Decisión de lima sobre la familia (recomendación arriba); lector de pantalla real (la región y los niveles se midieron con el árbol de accesibilidad, no con VoiceOver ni NVDA); `forced-colors` en Firefox y WebKit.
