# Declaración de cumplimiento · GInput con botón de acción · r02

**Estado:** aprobada. Las decisiones de estructura se derivan de estándares (WCAG 2.2 AA, heurísticas) y de los contratos vigentes de `GInput` y `GBtn`. El usuario aprobó las dos decisiones de producto: el botón se entrega como **slot con alcance `action`** en `GInput` (DECISIONS.md #33) y se autoriza la **excepción del umbral de apilado** como constante literal de diseño (DECISIONS.md #34).
**Ruta:** R1 · **Fidelidad:** F2 · **Material:** kit neutral de grises.
**Extiende:** `design/lab/input/r01/` (aprobada) y `design/lab/btn/r01/` (aprobada).
**Siguiente dueño:** lima → contrato (tras la aprobación del usuario).
**Siguiente dueño:** lima → `design/contracts/input.md` (sección de la acción).
## Estados cubiertos

`default`, foco en el campo, foco en el botón, `invalid` (error del campo), `disabled` (campo y botón), acción en `loading`, acción solo icono, tamaños `xs` y `lg`, contenedor estrecho (con texto y con solo icono), con formulario y sin formulario.

## Decisiones de estructura

| # | Decisión | Fundamento |
| --- | --- | --- |
| 1 | Botón **acoplado** a la caja: misma altura, esquinas exteriores redondeadas, interiores rectas | Proximidad (Gestalt): valor y acción se leen como una sola unidad |
| 2 | El botón es un `GBtn` del consumidor, no un botón propio de `GInput` | Conserva variantes, `loading` y accesibilidad ya aprobadas; sin duplicar código |
| 3 | La altura coincide porque `GBtn` y `GInput` usan la misma tabla de tamaños y densidad; el campo entrega `size`, `density` y `disabled` al botón | Evita que la altura difiera por un descuido del consumidor |
| 4 | Una sola etiqueta para el conjunto, asociada al `<input>`; el botón tiene su propio nombre accesible (texto o `aria-label`) | WCAG 1.3.1, 4.1.2 |
| 5 | Sin manejadores de teclado propios: Enter en el campo envía el formulario **solo** si hay un `<form>` con un botón `type="submit"`; Enter y Espacio activan el botón | Comportamiento nativo; WCAG 2.1.1 |
| 6 | Con la acción en `loading` (`aria-disabled` + `aria-busy`, sin `disabled` nativo) un segundo Enter no ejecuta la acción de nuevo | Prevención de acciones repetidas; el clic llega y se cancela, como en `GBtn` |
| 7 | Foco: el anillo del campo rodea la caja; el del botón queda hacia dentro; el elemento enfocado pasa por encima del vecino | WCAG 2.4.7 y 2.4.11: nunca se tapan entre sí |
| 8 | El error describe el **campo** y va debajo del conjunto, enlazado al `<input>` | WCAG 3.3.1; el botón no lo hereda |
| 9 | Contenedor estrecho (< ~300px): el botón **con texto** pasa debajo, a ancho completo y separado; el botón **solo icono** no se apila | WCAG 1.4.10 (reajuste); sin apilar, el campo quedaba en 51px |
| 10 | Solo icono: nombre accesible obligatorio (`aria-label`, ya exigido por `GBtn icon`) | WCAG 4.1.2 |
| 11 | Con `pointer: coarse`, la altura real de caja y botón es de 44px | WCAG 2.5.8 y `tokens.md` §7 |

## Criterios revisados

| Criterio | Resultado | Cómo |
| --- | --- | --- |
| WCAG 1.3.1 Información y relaciones | Cumple | Una etiqueta por `for`/`id`; error enlazado por `aria-describedby` |
| WCAG 1.4.10 Reajuste | Cumple | En 220px de contenedor, sin desborde; el botón con texto pasa debajo (caja 186px, botón 186px); el solo icono sigue a la derecha (151 + 36px) |
| WCAG 2.1.1 Teclado | Cumple | Tab: campo → botón; Enter en el campo ejecuta la acción; Enter y Espacio activan el botón |
| WCAG 2.4.3 Orden del foco | Cumple | Campo → botón, en el orden del documento |
| WCAG 2.4.7 Foco visible | Cumple en el prototipo | Botón: contorno sólido de 3px hacia dentro (verificado con Tab, `:focus-visible` verdadero); campo: anillo de r01 |
| WCAG 2.5.8 Tamaño del objetivo | Cumple por diseño | Altura de 24px mínimo; 44px con `pointer: coarse` |
| WCAG 4.1.2 Nombre, función, valor | Cumple | Texto o `aria-label` en el botón; `disabled` nativo en el campo y el botón |
| Heurística: prevención de errores | Cumple | Segundo Enter con la acción en curso: ignorado (verificado) |
| Heurística: visibilidad del estado | Cumple | `loading` visible y con `aria-busy` |
| Heurística: consistencia | Cumple | Reutiliza `GBtn` y las reglas de `GInput` |

## Comprobaciones ejecutadas

- Chromium, `localhost:4174`. Consola sin errores.
- Teclado con eventos reales: en el campo del cupón, dos Enter seguidos: el primero ejecuta la acción y activa `loading`, el segundo se ignora («Ignorado: la acción ya está en curso»). Con Tab desde el campo, el foco pasa al botón con contorno de 3px.
- Alturas: caja y botón miden lo mismo en las 14 filas del prototipo.
- Contenedor de 220px: caja y botón apilados (186px de ancho cada uno, separados 8px), sin desborde del marco; el botón solo icono conserva 36px de lado; en un contenedor ancho el conjunto se mantiene acoplado.

## Corrección hecha durante la ronda

La primera versión afirmaba que en anchos estrechos "el campo se encoge y sigue siendo usable". Al medirlo, en 220px con "Suscribirse" (110px) el campo quedaba en **51px**: no era usable. Se sustituyó por el apilado de la decisión 9.

## Comprobaciones NO ejecutadas

- **Lector de pantalla real:** cómo se anuncia el conjunto (etiqueta, botón, error) y la carga de la acción.
- **Área táctil con `pointer: coarse`** en este prototipo (la regla está escrita; no se emuló en esta ronda).
- **Zoom al 200%** del navegador y **dispositivo táctil real**.
- `forced-colors` y `prefers-reduced-motion`: el estilo final es de coco.
- Contraste: no aplica a un wireframe en grises; lo audita coco con el tema real.
- `scripts/check_artifact.py` y referencias del protocolo de gobernanza: no existen en el entorno.

## Hallazgos para lima

| # | Hallazgo | Severidad | Propuesta de la ronda |
| --- | --- | --- | --- |
| 1 | **API:** ¿cómo se entrega el botón? | Alta | Slot con alcance `action` en `GInput`, con `size`, `density` y `disabled` como propiedades del slot; el consumidor pone su `GBtn`. Alternativa: un componente aparte (`GInputGroup`). **Aprobado por el usuario: slot `action`** (DECISIONS.md #33) |
| 2 | Las esquinas interiores rectas y la altura igual las debe aplicar el CSS de `GInput` sobre el botón del slot (`.g-input__action > .g-btn`) | Media | Aceptar que `GInput.css` estile al `GBtn` del slot, solo en radio y foco |
| 3 | El apilado bajo ~300px exige un **umbral de ancho**; una consulta de contenedor no admite `var()`, así que el umbral sería un literal | Media | Permitir una constante literal de diseño para el umbral (excepción en `tokens.md` §7), o usar un umbral en `rem`. **Aprobado por el usuario** (DECISIONS.md #34) |
| 4 | Clases nuevas: contenedor del conjunto y de la acción, y un modificador cuando hay acción | Baja | `g-input__row`, `g-input__action`, `g-input--has-action` |
| 5 | `disabled` del campo ¿se propaga al botón? | Baja | Sí, vía las propiedades del slot; el consumidor puede sobrescribirlo |
| 6 | Mientras la acción está pendiente, ¿el campo pasa a `readonly`? | Baja | No lo decide el componente: lo decide el consumidor |
