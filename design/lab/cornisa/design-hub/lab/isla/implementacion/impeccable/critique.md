⚠️ DEGRADED: single-context (no hay herramienta de subagentes en esta sesión; A se completó y se guardó antes de ejecutar B)

# impeccable critique · cornisa (examples/index.html + librería)

## Puntuación de salud del diseño
| # | Heurística | Nota | Problema clave |
|---|---|---|---|
| 1 | Visibilidad del estado | 3 | «+N» sin sustantivo visible |
| 2 | Relación con el mundo real | 3 | «+N» críptico la primera vez |
| 3 | Control y libertad | 2 | En compacto no se puede actuar ni cerrar sin expandir |
| 4 | Consistencia | 3 | «Cerrar» discontinuo, residuo del kit de wireframes |
| 5 | Prevención de errores | 3 | — |
| 6 | Reconocer > recordar | 2 | Sin pista de que se puede expandir |
| 7 | Flexibilidad | 2 | Sin atajo de teclado; la isla queda al final del documento |
| 8 | Estética y minimalismo | 3 | Sin hover ni active |
| 9 | Recuperación de errores | 3 | «Reintentar» oculto hasta expandir |
| 10 | Ayuda | n/a | Componente de feedback |
| **Total** | | **24/36** | Aceptable con problemas relevantes |

## Veredicto de especificidad
**Evaluación de diseño:** la silueta y el movimiento son propios del producto; el interior (píldora oscura, glifos Unicode como iconos) es intercambiable.
**Escaneo determinista:** CLI `impeccable detect` → 2 hallazgos en `examples/index.html`: `cramped-padding` (la sección de relleno del ejemplo) y `marquee` (la animación infinita de la barra de progreso indeterminado). Sobre la fixture de pruebas: solo `marquee`. Overlay en el navegador: 7 (1440) / 6 (393) antipatrones; los visibles marcan `cramped padding` en los **botones de la página de ejemplo** (no en la isla).
**Coincidencias y discrepancias:** el detector no ve lo que más pesa en A (expandido inalcanzable, acciones ocultas, glifos como iconos), porque no son mecánicos. A no había visto el `cramped-padding` del ejemplo (real, aunque sea de la demo).
**Falso positivo (parcial):** `marquee` sobre el progreso indeterminado. No es contenido que se desplace ni oculta información: es el indicador de un estado en curso, y ya se detiene con `prefers-reduced-motion`. Se mantiene la animación, se documenta la excepción y se acota (ver polish).

## Impresión general
La gota cumple su promesa visual. El mayor riesgo está en lo práctico: lo que hay dentro de la gota no siempre se puede alcanzar o descubrir.

## Lo que funciona
1. Una sola superficie viva (de progreso a resultado sin recrearse).
2. El contenido no se deforma y aparece solo cuando cabe.
3. No modal de verdad.

## Problemas prioritarios
1. **[P1] Expandido inalcanzable en pantallas bajas** (844×390 con texto al 200 %: 677 px de alto; «Cerrar» en y = 662). → adapt
2. **[P1] Acciones ocultas en compacto** («Deshacer» con tiempo limitado exige expandir). → cambio de anatomía: **necesita una nueva ronda de kiwi y tu aprobación**
3. **[P1] Glifos Unicode como iconos.** → polish
4. **[P2] Sin pista visual de expansión.** → polish
5. **[P2] Sin hover/active; «Cerrar» discontinuo; padding apretado en el ejemplo.** → polish

## Alertas por persona
Jordan (primera vez): «+2» y el expandir no se descubren; el Deshacer caduca. Sam (accesibilidad): «Cerrar» fuera de pantalla con texto ampliado en horizontal; la isla está al final del orden de tabulación. Casey (móvil): zona superior lejos del pulgar (inherente al brief).

## Observaciones menores
Selección de texto y caret sin tematizar dentro de la isla. % + barra redundantes pero útiles.

## Preguntas para pensar
¿Acción primaria en la fila compacta? ¿«+N» como «+2 más»? ¿Atajo opcional de teclado?
