# impeccable critique · Evaluación A (revisión de diseño), escrita ANTES de ver el detector

Objetivo: `cornisa/examples/index.html` (la librería real en contexto) + `cornisa/src/cornisa.css` + `src/dom/renderer.js`.
Modo de superficie: **Operate** (feedback de tareas dentro de una app).
Método: en un solo contexto, sin subagentes en esta sesión. Revisión del código + capturas en 1440/393/320 (Chromium, WebKit, Firefox) + teléfono horizontal 844×390.

## Especificidad del diseño
La **silueta** (gota anclada al borde, unión cóncava, muelles) es propia del producto: no se puede confundir con otra librería de toasts. El **interior**, en cambio, es intercambiable: píldora oscura, texto blanco y glifos Unicode (i ✓ ! ×) dentro de bordes CSS. La identidad neutra fue una decisión del usuario, pero los glifos como iconos están en la lista «Refuse» del craft floor: es un defecto, no neutralidad.

## Heurísticas de Nielsen (0–4)
| # | Heurística | Nota | Problema clave |
|---|---|---|---|
| 1 | Visibilidad del estado | 3 | Progreso y temporizador claros; «+2» es un número sin sustantivo visible |
| 2 | Relación con el mundo real | 3 | Lenguaje claro; «+N» críptico para quien llega por primera vez |
| 3 | Control y libertad | 2 | En compacto no se puede cerrar ni actuar: hay que expandir primero (2 pasos), también en un «Deshacer» con tiempo limitado |
| 4 | Consistencia y estándares | 3 | «Cerrar» con borde discontinuo: convención del kit de wireframes de kiwi (discontinuo = destructiva) filtrada al producto |
| 5 | Prevención de errores | 3 | Validación estricta de la API; acciones sin confirmación (las decide el consumidor) |
| 6 | Reconocer antes que recordar | 2 | La píldora no indica que se pueda expandir (sin chevron ni pista) |
| 7 | Flexibilidad y eficiencia | 2 | Sin atajo: el teclado llega a la isla al final del documento (D-09) |
| 8 | Estética y minimalismo | 3 | Sobria; sin estados hover ni active (0 reglas `:hover`) |
| 9 | Recuperación de errores | 3 | El error es persistente y tiene «Reintentar», pero la acción está oculta hasta expandir |
| 10 | Ayuda y documentación | n/a | Componente de feedback sin ayuda propia; la documentación es el README |
| **Total** | | **24/36** | Aceptable con problemas relevantes |

## Carga cognitiva
Checklist: 1 fallo (descubrir que se puede expandir). Ninguna decisión con más de 4 opciones (máximo: 2 acciones + Cerrar). Carga baja.

## Recorrido emocional
Pico: la gota que nace del borde (momento con autoría). Valle: el «Deshacer» que caduca mientras el usuario descubre que tiene que tocar la píldora para verlo. Es justo el momento de mayor tensión (acabo de archivar algo) y peor resuelto.

## Lo que funciona
1. Continuidad: una sola superficie que se actualiza (de progreso a éxito) sin destruirse.
2. El contenido nunca se deforma y aparece solo cuando cabe.
3. No modal de verdad: el foco y la página quedan intactos.

## Problemas prioritarios
1. **[P1] Expandido inalcanzable en pantallas bajas.** En teléfono horizontal (844×390) con texto al 200 %, el expandido mide 677 px y «Cerrar» queda en y = 662, fuera de la pantalla y sin scroll posible (es fixed). Incumple 1.4.10 / 1.4.4. *Arreglo:* limitar el alto al viewport y hacer el detalle desplazable. *Comando:* adapt.
2. **[P1] Acciones ocultas en compacto.** «Deshacer» o «Reintentar» exigen expandir antes. Con tiempo limitado es un patrón roto. *Arreglo propuesto:* mostrar la acción primaria dentro de la fila compacta. **Esto cambia la anatomía congelada de r02**, así que va a kiwi (r03) con aprobación del usuario; no se puede colar en polish. *Comando:* shape/distill (decisión de producto).
3. **[P1] Glifos Unicode como sistema de iconos** (craft floor «Refuse»). *Arreglo:* iconos SVG dibujados, con un solo trazo y peso, creados con `createElementNS` (sin innerHTML). *Comando:* polish.
4. **[P2] Sin pista de que se puede expandir.** *Arreglo:* chevron SVG (`aria-hidden`) en el conmutador; `aria-expanded` ya transmite el estado a los lectores de pantalla. *Comando:* polish.
5. **[P2] Sin estados hover/active; «Cerrar» con borde discontinuo heredado del wireframe.** *Arreglo:* hover/active con `(hover: hover)`; «Cerrar» como botón discreto, no discontinuo. *Comando:* polish.

## Alertas por persona
- **Jordan (primera vez):** ve «+2» sin saber qué es; no sabe que la píldora se abre; el «Deshacer» le caduca.
- **Sam (accesibilidad, teclado o lector de pantalla):** con texto ampliado en horizontal no llega a «Cerrar»; para llegar a la isla tiene que tabular hasta el final de la página.
- **Casey (móvil, con prisa):** la isla está en la zona superior, la más difícil de alcanzar con el pulgar. Es inherente al brief (el borde superior), así que no se cambia; cuenta como argumento a favor de mostrar la acción primaria en compacto.

## Observaciones menores
- El `%` del compacto y la barra dicen lo mismo; aceptable (precisión + forma).
- `--cornisa-muted` a 0,78 sobre #111: contraste suficiente (lo verificó axe).
- Selección de texto y caret sin tematizar dentro de la isla (craft floor «browser surfaces»).

## Preguntas para pensar
- ¿Y si la acción primaria viviera en la fila compacta y el expandido fuera solo para leer?
- ¿Debe «+N» decir «+2 más» o abrir una lista?
- ¿Un atajo opcional (configurable y desactivado por defecto) para llegar a la isla con el teclado?
