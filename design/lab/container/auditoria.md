# Auditoría · GContainer (paso 5, coco)

**Componente:** `GContainer` (`GContainer.vue` de bruno, 199f170; principal) sobre `GContainer.css` (coco, 2971e33) y `container.md` (lima, 86297b9; #717, #721 a #724) · **Fecha:** 2026-10-21 · **Resultado:** sin defecto bloqueante → **`candidate`**

**Verificación propia:** `GRANA_PW_PORT=4215 node design/lab/container/auditoria-verificar.mjs` (requiere `npm run build`). Dos bancos con componentes **reales** de `dist/`: el de bruno (`packages/vue/playground/container.html`, sin chasis: el contenedor es el `main`) y el de esta auditoría (`design/lab/container/auditoria-banco.html`): la página del prototipo r01 de kiwi reconstruida con piezas reales dentro de `GAppShell` + `GSidebar` (`GPageHeader` de primer hijo, prosa, `GSection` con un contenedor anidado, tabla desplazable `g-bleed`, banda `g-bleed` con `data-g-zone="brand"`, `GTable` con `g-bleed`, `GSurface` con un contenedor y `GDialog` abierto con otro).

| Motor | Comprobaciones |
| --- | --- |
| Chromium | 159/159 |
| Firefox | 157/157 |
| WebKit | 157/157 |
| **Total** | **473/473** |

Además, los specs de bruno sobre el estado final (`GRANA_PW_PORT=4217 npx playwright test tests/app-shell.spec.mjs tests/app-shell-perf.spec.mjs tests/container.spec.mjs tests/stack-section.spec.mjs`, tres motores): **196 pasan, 2 omitidos por diseño** (`forced-colors` solo en Chromium); aquí cuentan `container.spec.mjs`.

**Temas:** por defecto, `spotify` y `medium` de `generated/`, `spotify` y `grana` derivados por `@grana/cli` en el momento (con su zona de marca), el de prueba (`space` 5, títulos serif, borde 2 px), todos en claro y oscuro; además el texto al 200 %. Capturas lado a lado prototipo ↔ real: `auditoria-bleed.png` (B · `g-bleed`), `auditoria-prose.png` (`xl` + `prose`) y `auditoria-reading.png` (`width="reading"`).

## Auditoría previa

- **Estructura:** dos cajas (raíz que se mide, columna que se coloca); ni relleno de bloque, ni separación entre hijos, ni pintura. El ritmo lo pone `GStack` y la superficie `GSurface`: el contenedor no reconstruye ninguno.
- **Riesgos al empezar:** L4 (relleno de `GPageHeader` dentro de la columna), anfitrionas (`GSurface`, `.g-dialog__body`), `GTable` con `g-bleed` (L10), `prose` con primitivas de página, `reading` con fuentes de otro tema, desplazable alineado al final en WebKit.

## Auditoría posterior

| Aspecto | Estado | Evidencia (componente real, tres motores) |
| --- | --- | --- |
| Columna y margen | Cumple | En el chasis, a 1440×900, 1024×768, 390×800 y 320×256, LTR y RTL: columna `md` = `min(caja − 2 × clamp(space-4, 4cqi, space-12), 768)` centrada al píxel, márgenes publicados = reales, la caja es el marco del chasis; sin chasis (`as="main"`): `sm`, `lg`, `xl`, `full` con su máximo |
| Anidado sin acumular | Cumple | Contenedor `sm` al inicio dentro de la columna (en una `GSection`): empieza en la columna; dentro de `GSurface`: empieza en su relleno, publicados 0; dentro de `.g-dialog__body` de un `GDialog` abierto: sin margen propio |
| B · Sangrado | Cumple | A 1440 (LTR y RTL) y 390: la banda con zona de marca y la tabla desplazable llegan a los dos bordes de la caja (nunca bajo el sidebar); título y botón de la banda en la columna; el desplazable arranca alineado con el texto y termina alineado con el final de la columna (WebKit ±2 px al final, desplazamiento a píxel entero, límite del motor ya anotado en `estilo.md`); sin desplazamiento horizontal |
| `GTable` con `g-bleed` | Cumple (con límite) | La raíz llega a los bordes de la caja y, como `g-bleed` le da relleno en línea, su leyenda y sus celdas arrancan en la columna en reposo (LTR y RTL). El límite L10 se precisa: lo que no llega al borde es el **desplazable interno** de la tabla cuando es más ancha que la columna |
| A · `prose` | Cumple | Con la fuente de cada tema (por defecto, `medium`, prueba): el párrafo en `66ch` al inicio; lista y título comparten su borde final; la prosa dentro de `GSection` y de una banda `g-bleed` también se mide (primitivas transparentes); la de `GSurface` queda fuera; el desplazable y `GTable` usan el ancho entero; texto al 200 %: sin desbordar |
| A · `reading` | Cumple | La columna es `66ch` de su fuente en los tres temas |
| `GPageHeader` de primer hijo | Cumple (L4 anotado) | El zócalo se pega bajo la banda del chasis a toda la página (#724) y ocupa la columna. **L4 medido:** el `h1` queda **24 px (= `space × 6`) por dentro** del texto de la página y las acciones terminan 24 px antes del final de la columna, en los tres motores; no se arregla aquí (decisión pendiente en `GPageHeader.css`, `PENDIENTES.md`) |
| Reflujo (1.4.10) | Cumple | 320×256 con y sin chasis: sin desplazamiento horizontal; la URL larga se parte dentro de la columna |
| Contraste | Cumple | El contenedor no pinta (fondo transparente en los 12 temas); la banda `g-bleed` con zona de marca, título y texto ≥ 4,5:1 en todos |
| `forced-colors` (Chromium) | Cumple | Sin fondo, borde ni contorno: nada que perder |
| Estados, carga, vacío, error | N/A | No interactivo, sin datos |
| Movimiento | N/A | Ninguno (contrato); con el chasis el cambio de ancho llega una vez por A · Cortina (auditoría de `GAppShell`) |
| Consola | Cumple | Sin errores ni avisos en ningún banco |

**Prototipo ↔ real:** misma columna y mismo sangrado; el real lleva además el zócalo pegado de `GPageHeader` y la zona de marca real (`--g-color-brand-zone`). En los dos se ve el desfase L4.

**Nota de temas:** los CSS de `design/lab/tema-oscuro/dark-color-presence/generated/` no traen `--g-color-brand-zone` (se generaron antes de #620): con ellos, la zona de marca es la del tema por defecto. Por eso la auditoría deriva también `spotify` y `grana` con el CLI actual.

## Correcciones de esta auditoría

Ninguna en `GContainer.css`.

## Para lima (consolidado desde `estilo.md`)

1. **Primitivas transparentes para `prose`** (enmienda de «A · Medida»): `.g-stack`, `.g-section`, `.g-section__body`, `.g-bleed`, `.g-bleed-raw` no cortan la medida; el título y la descripción de `GSection` siguen fuera. Medido con el real: la prosa de una `GSection` y de una banda `g-bleed` se mide. Registrar la lista (una primitiva nueva se añade, como el mapa de anfitrionas).
2. **`box-sizing: border-box` en la prosa medida** (la lista con sangría termina donde el párrafo; medido con el real).
3. **`sign()` para `--g-container-max`**: sin constante nueva.
4. **L4 medido:** 24 px (`space × 6`) de `h1` y de acciones, en los tres motores, con y sin chasis. Sigue pendiente la decisión en `GPageHeader.css`.
5. **L10 precisado:** `GTable` con `g-bleed` alinea su leyenda y sus celdas con la columna en reposo; lo que no llega al borde de la caja es su desplazable interno cuando la tabla es más ancha. Ajustar el texto de «Límites conocidos».

## Para bruno

Nada bloqueante. (Las notas de `estilo.md` —clases de los cuatro ejes siempre, `--g-container-max` en la raíz, aviso 5 contra la columna— están cumplidas en el `.vue`.)

## Para mora-docs (`GContainer/README.md`)

Las dos recetas (con chasis `as="div"`, sin chasis `as="main"` con `GPageHeader` de primer hijo); `g-bleed` con la receta del relleno propio; `prose`, `g-wide` y las primitivas que no cortan la medida; límites: L4 (24 px), `GTable` con `g-bleed` (desplazable interno), `--g-container-max` no se hereda.

## Cumplimientos / Correcciones / Pendientes

**Cumplimientos.** Columna, margen continuo, anidado y anfitrionas (`GSurface`, `.g-dialog__body`), B con piezas reales y zona de marca, A (`prose`, `reading`) con la fuente de cada tema, reflujo a 320×256, RTL, nada pintado en 12 temas, `forced-colors`, consola limpia, en los tres motores.

**Correcciones.** Ninguna.

**Pendientes.** L4 (decisión en `GPageHeader.css`); las notas a lima; `forced-colors` en Firefox y WebKit y zoom real del navegador, no verificables aquí.
