# Brief — GNumberField (r01)

> Brief de kiwi a partir del encargo (2026-10-03), verificado contra el repo. Fase 2 del sistema de formularios (`form.md` fila 17, «Fases siguientes»), **sin moneda** (#154, #168: moneda es la Fase 4/5 con ronda propia).

## Qué es

Un campo para **un número que la persona escribe**: edad, peso, temperatura, porcentaje, cantidad. Es texto con forma de número: se escribe libre, se lee con el formato del idioma y, si se pide, se ajusta con −/+ o con las flechas del teclado. El modelo es un `Number` o `null`.

## Lo que ya está decidido y no se reabre

| Fuente | Qué fija |
| --- | --- |
| `design/lab/form/r01/declaracion.md` §12 (l. 206–209, 223) | `<input type="text" inputmode="decimal\|numeric">`, **no** `type=number` (rueda, flechas y validación nativa confusas; GOV.UK); `min` `max` `step` `precision`; formato con `Intl` al salir y texto crudo al entrar; −/+ opcionales (patrón *spinbutton* de APG); prefijo/sufijo de texto accesible; unidad fija como sufijo o elegible con un selector al lado |
| #166, `form.md` C13 y l. 1069 | `prefix`/`suffix` + `prefixLabel`/`suffixLabel` de `GInput`: el texto (o su expansión oculta) entra en `aria-describedby` antes de ayuda y mensaje; no interactivos; pulsar enfoca el `<input>`. `GNumberField` reutiliza la regla |
| `form.md` §2 `useFormField`, §4, C10/C12 | Tres hijos (etiqueta · caja · pie) para compartir línea en `GFormRow` por subgrid; registro por `name`; manejadores del contexto primero |
| #157, `form.md` §1 | **Grana no valida**: la aplicación da `errors`; `GForm` decide cuándo se ven («castigar tarde, premiar pronto») |
| #266, C7 | `readonly` enfocable, legible y dentro del envío; nunca `disabled` para bloquear |
| #270 | `aria-required` en vez de `required` nativo **solo** donde se midió; extenderlo a campos de texto exige medir Chromium (pendiente `PENDIENTES.md` §2) |
| #304, #306, `input.md` «Personalidad» | `is-ready` (I1, mensaje que sale del campo) e `is-rejected` (I2, una sacudida al enviar) en la raíz del campo |
| #299 | Lenguaje de movimiento: `--g-ease-spring`/`--g-ease-bounce` solo en los usos aprobados; un uso nuevo es decisión nueva |
| `icons.md`, #85 a #87 | Iconos solo Lucide (`minus`, `plus`) |

## Precedentes directos

- `GInput` (`design/contracts/input.md`, `GInput.vue`, `GInput.css`): la caja, el prefijo/sufijo, la región de mensaje, `is-ready`, `is-rejected`, la colocación en `GFormRow`.
- `GSelect` y `GInputGroupSelect`: `<input type="hidden">` con el valor canónico cuando lo visible no es el valor.
- `GInputGroup` (`form.md` §13): la receta de signos vitales con unidad elegible; «`GNumberField` como parte» reservado para la Fase 2.
- `GDatePicker`: `inputmode` en el campo y teclado propio sobre un campo de texto.

## Lo que decide esta ronda (estructura)

Anatomía (dónde van −/+, RTL, `size`/`density`); teclado (flechas, Shift, Re Pág/Av Pág, Inicio/Fin, caracteres no numéricos, separador decimal por idioma); modelo (`Number` o `null`, texto parcial, `precision`, fuera de rango); roles (`spinbutton` o caja de texto, medido en el árbol de Chromium); botones −/+ (en el árbol o no, Tab, nombre, repetición, límites); envío (qué llega en `FormData`); estados; si entra como parte de `GInputGroup`; y «Qué lo hace distinto».

## Casos del prototipo

Edad (entero), peso con `kg`, temperatura con decimales y coma, porcentaje, cantidad con −/+, dentro de una `GFormRow` con `GInput` y `GSelect` (alineación de las tres pistas), unidad elegible al lado (`GSelect`), estados, tamaños y densidad, RTL (árabe con cifras arábigo-índicas y hebreo), 320px, envío con errores de la aplicación.

## Lo que NO es esta ronda

- No es moneda (`style: currency`, símbolo por idioma, formato mientras se escribe): Fase 4/5 (#154).
- No es un deslizador (`slider`) ni un rango de dos valores.
- No escribe contrato, CSS ni `.vue`.
