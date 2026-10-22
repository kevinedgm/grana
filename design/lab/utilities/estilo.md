# Utilidades · estilo (coco)

**CSS:** `packages/vue/src/styles/utilities.css` · **Origen y contrato:** `design/contracts/utilities.json` y `utilities.md` (#804 a #811) · **Banco:** `design/lab/utilities/estilo-banco.html` · **Verificación propia:** `GRANA_PW_PORT=4209 node design/lab/utilities/verificar.mjs` (Playwright de `design/lab/theme-playground`; **553/553 en Chromium, Firefox y WebKit**, cada motor con seis configuraciones: defecto claro, defecto oscuro, «Tema de prueba» con `space` 5, un tema del CLI con `space` 5 y `fontSize` 14, RTL y `utilities.css` cargado antes que `grana.css`).

No es un componente: no hay forma, estados ni movimiento. Esto es la transcripción fiel del JSON y la medición de que se comporta como promete el contrato. La auditoría (`auditoria.md`) queda para cuando bruno integre el import y exista `dist/utilities.css`.

## Qué le da personalidad

- **La escala es la del tema.** `g-p-4` no es `16px`, es `var(--g-space-4)`. Medido: 16 px con el tema por defecto, 20 px con el «Tema de prueba» y con un tema del CLI de `space` 5, y `g-gap-6` = 24 / 30 px. Una pantalla armada con utilidades se re-ritma entera, junto con los componentes, cuando cambia `space`. Los roles de texto igual: `g-text-title` mide lo que el rol `title` del tema en cada tema (comparado contra una sonda con las cuatro `var(--g-text-title-*)`).
- **Ejes lógicos.** No hay `l` ni `r`. `g-ms-4` cae a la izquierda en LTR y a la derecha en RTL (medido: margen y posición de la caja); `g-text-start`/`g-text-end` y `g-justify-*` siguen la dirección. `align-items: start|end` y `justify-content: start|end` (en lugar de `flex-start|flex-end`) funcionan igual en flex y en rejilla, **también en WebKit** (medido en los tres motores, en LTR y en RTL).
- **Sin breakpoints ni variantes de estado:** no hay una sola regla con consulta de medios, `:hover` ni `:focus`.
- **Gana por capa, no por fuerza.** Medido: `g-mt-4` sobre un hijo directo de `GStack` (que lo pone a 0 en `grana.components`) mide 16 px y **se suma** al `gap`; gana a una regla de `grana.components` de especificidad 1,3,0; y **pierde** ante una regla de la aplicación sin capa (3 px). Con `utilities.css` cargado *antes* que `grana.css` sigue ganando a los componentes porque la declaración de orden completo va primera.
- **Respeta `hidden`.** Las seis de `display` llevan `:where(:not([hidden]))`: `class="g-flex" hidden` sigue oculto (también `g-inline-block`), y `g-hidden` gana a cualquiera de ellas en ambos órdenes de clase. Con `hidden="until-found"` la guarda no las muestra como flex/grid.

## Decisiones de transcripción

- **Formato:** una regla por línea, `.clase { prop: valor; }`, sin comentarios por regla, con un comentario corto de grupo (margen, relleno, separación, disposición, texto, forma, accesibilidad) y cabecera de dueño/origen. Es el formato más fácil de comparar con el JSON (la prueba (a) de bruno). El orden es el del arreglo del JSON, una a una.
- **Sin `@layer` dentro del archivo**, y la cabecera evita las cadenas `@layer` e `!important` para que una comprobación textual de bruno no se confunda con un comentario.
- **Literales:** solo los de `allowedLiterals` (`0`, `auto`, `1`, `100%`, `none` y palabras clave) y los de `g-sr-only` (`absolute`, `1px`, `-1px`, `inset(50%)`); comprobado contra el JSON con un script: 229 reglas, mismo orden, 0 valores fuera de lista, 0 respaldos.
- **`g-text-{rol}` fija tamaño, línea, tracking y peso, no la familia** (como pide el contrato): medido que `g-text-title` hereda la del cuerpo. `g-font-title` lee `--g-font-title` (existe en `defaults.css`, `var(--g-font-ui)` por defecto; con el «Tema de prueba» es Georgia y `g-font-ui` no cambia). Ningún token nuevo hizo falta.
- **`g-text-muted` y `g-text-subtle`** siguen el esquema y la zona: dentro de `data-g-zone="brand"` leen el de la zona (medido ≠ al de la página y ≥ 4,5:1).
- **Mínimo de texto:** `caption` es 12 px en el tema por defecto y en el del CLI (el motor rechaza `fontSize` < 14 porque `body-sm` bajaría de 12 px); ninguno de los seis roles baja de 12 px.

## Mediciones destacadas

| Qué | Resultado |
| --- | --- |
| Cobertura | 229/229 clases con regla en la hoja cargada y estilos computados idénticos a su declaración del JSON en línea; 199 se distinguen además de un nodo sin clase (las 30 restantes coinciden con el valor inicial del `div`: `g-m-0`, `g-block`, `g-text-body`… y se cubren por la regla) |
| `g-p-4` | 16 px (defecto) · 20 px (`space` 5, «Tema de prueba» y CLI); `g-p-4 g-pt-0` deja 0 arriba |
| Orden de la hoja | `g-m-0 g-mb-3 g-mb-5` → margen inferior de `g-mb-5`; `g-mx-auto g-ms-0` → el auto solo al final |
| `g-gap-6` / `g-gap-x-2` + `g-gap-y-4` | 24 px entre hijos (30 con `space` 5); 8 entre columnas y 16 entre filas, en flex con `wrap` y en rejilla |
| Reparto | `between`, `around` (½, 1, ½), `evenly` (tres huecos iguales), `center`, `start`, `end` y `g-self-*` medidos por posiciones, LTR y RTL |
| `g-grow` / `g-shrink-0` / `g-min-w-0` | ocupa el resto de la fila / no se encoge / el texto sin partir se encoge a su fila (sin ella desborda) |
| `g-text-muted` / `-subtle` sobre la página | 7,46:1 / 5,10:1 (claro) · 9,29:1 / 6,71:1 (oscuro); cambian con `data-theme="dark"` |
| `g-sr-only` | el botón conserva su nombre accesible «Guardar cambios» (`getByRole`), caja 1×1, el botón mide lo mismo que su gemelo y la caja vecina no se mueve; `g-hidden` lo saca del árbol |
| `GStack divided` | un hijo con `g-hidden` o `g-sr-only` cuenta como `[hidden]` (ver abajo) |
| Consola | limpia en los tres motores |

La prueba detecta fallos: con la guarda de `g-flex` quitada y `g-pt-0` borrada fallan 13 comprobaciones.

## Cambio opcional hecho: `GStack divided`

En `GStack.css`, `divided` trata `.g-hidden` y `.g-sr-only` como `[hidden]` (se suman a las exclusiones de los dos lados del selector `~`). Es trivial, no cambia la especificidad ni ninguna medida de GStack (`node design/lab/stack/estilo-verificar.mjs`, 1975/1975 en Chromium y WebKit) y cierra el límite anotado en el contrato (`utilities.md` «Límites conocidos»): una clase de Grana sí es detectable. **Límite que sigue:** una clase propia de la aplicación que oculte con `display: none` no es detectable. `dist/` aún no trae el cambio; el banco lo parcha en memoria hasta que se reconstruya.

## Límites de esta verificación

- Se mide contra el `dist/grana.css` actual, **sin el import integrado**: el banco carga `utilities.css` con `layer(grana.utilities)` y declara el orden de capas completo. No se ha medido `dist/utilities.css` suelto ni `grana.css` con el import de bruno (eso es la auditoría).
- Con `fontSize` 14 como mínimo del CLI no se pudo medir un tema con `body-sm` < 12 px (el motor lo rechaza, a propósito).
- Sin lector de pantalla real: `g-sr-only` se comprueba por el nombre accesible que calculan los motores (`getByRole`).
- `forced-colors` y `prefers-reduced-motion` no aplican (las utilidades no pintan ni animan).
- Peso: `utilities.css` suelto, **2409 B gzip con comentarios y espacios** (`gzip -9`); minificado a mano (sin comentarios ni espacios) **9764 B → 1753 B gzip**, en línea con la estimación de lima (≈ 1,8 KiB). Dentro de `grana.css` pesará algo menos.

## Para otros roles

**bruno:** el archivo es de una regla por línea con la forma `.sel { a: b; c: d; }` (las seis de `display` con `:where(:not([hidden]))` pegado al nombre de clase); los comentarios de grupo son de bloque `/* … */` de una línea. Una prueba que cuente `{` o busque `@layer` / `!important` en el archivo crudo no se confunde con los comentarios. El import y la declaración de orden los puso bruno (58be30c); el banco ya carga solo hojas de `dist/` (auditoría U-A1).

**lima:** (1) `tokens.md` §8 y el contrato citan `--g-font-title`: existe en `defaults.css`; nada que añadir. (2) Con el cambio opcional de `GStack divided`, el límite 3 de «Límites conocidos» de `utilities.md` y la regla 4 de «Reglas de los hijos» de `stack.md` pueden decir que `g-hidden` y `g-sr-only` sí se detectan. (3) Medido: el algoritmo de WebKit devuelve el *valor usado* (no el declarado) del margen del lado final de una caja de ancho fijo en `getComputedStyle`; no afecta a las utilidades, solo a cómo se mide (la posición real es correcta).
