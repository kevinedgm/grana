# Brief — GFormReveal (r01)

> Brief de kiwi a partir del encargo (2026-10-02), verificado contra el repo. Fase 3 del sistema de formularios (`design/contracts/form.md`, «Fases siguientes», y tabla de resolución r01, fila 13: «Divulgación es un bloque propio»).

## Qué es

Un **bloque de campos condicionales**: aparece justo después de la pregunta que lo condiciona cuando la respuesta lo pide y desaparece cuando no. «¿Requiere factura? Sí → datos fiscales»; «Tipo de persona: Física → CURP · Moral → razón social y representante». No es una sección plegable (esa la abre el usuario con un botón y sus datos siguen contando) ni «Agregar…» (el usuario decide incluir un bloque opcional): aquí **la respuesta decide** y, mientras no aplica, el bloque no existe para el formulario.

## Lo que ya está decidido y no se reabre

| Fuente | Qué fija |
| --- | --- |
| `form/r01/declaracion.md` §1 (pieza 6), §4, §11 | `GFormReveal when` es un **componente** (hay comportamiento); bloque **inmediatamente después** de la pregunta; cerrado = `inert` y controles **fuera del envío** (ni `FormData`, ni Tab, ni errores, ni resumen); **conserva lo escrito** al cerrar y reabrir (WCAG 3.3.7); aparición **sin saltos**: el disparador no se mueve (Δ 0px), altura y opacidad intermedias, `overflow` visible al terminar, movimiento reducido sin movimiento; anidables; foco quieto en el control |
| `form/r01/declaracion.md` §11, `form.md` §1 l. 83 | «Mostrar todo y deshabilitar» es la alternativa **rechazada**: `disabled` (visible, atenuado) es para un dato que existe pero no se puede tocar ahora, no para uno que no aplica |
| `form.md` §1–§2, #157, #158 | `GForm` no valida: recibe `errors` de la aplicación y decide **cuándo** se ven (`shown`); registro de campos con `useFormField`; `submit` revela todos; errores que bloquean = de campos **registrados y no deshabilitados** + claves de `errors` sin campo registrado (generales) |
| `form.md` §7, #162 | `GErrorSummary`: errores del último envío en orden del DOM, un enlace por pregunta, salen en silencio al corregirse, `navigate` desplaza y enfoca |
| `form.md` §4, #171 a #175, #184 | Filas explícitas `GFormRow` que siempre llenan el ancho; `GFormLayout` apila con `--g-form-gap` × densidad; prueba obligatoria de distribución |
| #267 a #273 | `GRadioGroup` (radios nativos, `inline` y `segmented` comparten línea, teclado nativo sin normalizar WebKit) |
| #71, plan 012, plan 007 | Precedentes de movimiento: submenú de `GSidebar` cerrado `inert` sin `hidden`; no animar al montar; movimiento reducido = conservar el fundido, quitar el desplazamiento |
| `form.md` «Fases siguientes», fila 3 | Reserva de ideas: `GFormReveal` (`when`, `exclude`, `keepValues`, `indent`; `grid-template-rows` sin saltos; `inert` + deshabilitado al cerrar). Esta ronda decide cuáles quedan |

## Componentes que se solapan (revisados para no duplicar)

| Existe / reservado | Por qué no sirve para esto |
| --- | --- |
| `GFormSection mode="collapsible"` (Fase 3, reservado) | La abre el usuario con un botón `aria-expanded`; cerrada **sigue enviándose y validándose** |
| `GFormSection mode="addable"` (Fase 3, reservado) | El usuario decide incluir; botón «Agregar…», foco al título |
| `GFieldGroup` | Una **pregunta** compuesta con `fieldset`/`legend`; no aparece ni desaparece |
| `GTabs` / `GStepper` | Grupos independientes / pasos; no dependen de una respuesta en la misma vista |
| Submenú de `GSidebar` (#71) | Mismo mecanismo visual (altura + opacidad, `inert`), otra semántica (navegación, botón `aria-expanded`) |
| `GDialog` (#152) | Desmonta su contenido al cerrar; aquí el contenido **debe** seguir montado para conservar valores y estado |

## Lo que decide esta ronda (estructura)

Anatomía y elemento raíz; señal visual de pertenencia; relación con el disparador y qué se anuncia; foco al abrir y al cerrar; qué pasa con errores, resumen, envío, `shown` y `required` al cerrar y reabrir; si puede vivir dentro de una `GFormRow`; API mínima (`when` y qué más); técnica de transición y cómo se compensa la separación del contenedor; estados (cerrado, abriendo, abierto, cerrando, anidado, con error dentro, `readonly`/`disabled` de `GForm`, RTL, `forced-colors`).

## Lo que NO es esta ronda

- No es `GFormSection collapsible`/`addable` ni `GFormNav` (otras piezas de la Fase 3).
- No escribe contrato, CSS ni `.vue`; no toca `GForm`, `useFormField` ni `GDialog` (los cambios que hacen falta van como hallazgos).
- No decide valores estéticos (grosor y color de la barra, sangría, duraciones): el prototipo usa valores de wireframe.

## Prototipo

`index.html` monta los **componentes reales** de `packages/vue/dist/` (`GForm`, `GFormSection`, `GFormLayout`, `GFormRow`, `GRadioGroup inline`, `GInput`, `GErrorSummary`, `GFormActions`, `GBtn`, `GDialog`) con Vue global, y un **`XFormReveal` de prototipo** (Vue, en la propia página) que implementa la estructura propuesta, incluida la parte que necesita de `GForm` (registro «inactivo») mediante un contexto intermedio. Casos: factura Sí/No con persona Física/Moral anidada, dentro de una sección, con resumen de errores; contenedor ancho (960) y estrecho (320); RTL; contraejemplo dentro de una `GFormRow`; dentro de `GDialog` centrado y como hoja. Verificación: `node design/lab/form-reveal/r01/verificar.mjs` (Playwright de `design/lab/theme-playground/`, Chromium, Firefox y WebKit).
