# Brief funcional · Isla «Top-Edge Droplet» · r02 (delta sobre r01)

**Ruta:** R1 · **Fidelidad:** F2 con movimiento funcional (desviación declarada) · **Fecha:** 2026-10-26
**Por qué una ronda nueva:** el usuario cambió materialmente la dirección de interacción. La superficie ya no es una cápsula flotante que cambia de ancho: es una **gota que nace del borde superior**. Según kiwi, un cambio material abre `rNN+1`, así que r01 se conserva sin tocar.
**Fuentes leídas:** el brief del usuario («Top-Edge Droplet»), r01 completo, `skills/impeccable/reference/animate.md` y `skills/improve-animations/AUDIT.md` §3–§6 (solo leídos; no invocados).

## Qué se conserva de r01 (sin cambios)
Fases de la máquina de estados, contrato de accesibilidad (no roba el foco, disclosure, regiones vivas persistentes, Esc, foco o clic fuera contraen por WCAG 2.4.11), timers con pausa, API v0, seguridad.

## Qué cambia
| Aspecto | r01 | r02 |
|---|---|---|
| Silueta | Cápsula separada del borde (8 px) | **Path SVG único anclado a y=0**, unido al borde por filetes cóncavos de 12 px |
| Entrada | translateY + scale + fundido | **Nace** como gota de 30 px de ancho, desciende estirada y luego se ensancha con un muelle |
| Cambio de tamaño | WAAPI width/height | Modelo de **muelles** (alto, ancho) + curvatura inferior por inercia, recalculado cada frame |
| Salida | translateY hacia arriba + fundido | El contenido se recoge (120 ms) → la gota se **estrecha** → **asciende** y se reintegra en el borde |
| Movimiento reducido | Solo fundido | Solo fundido de la silueta ya asentada; sin bucle de animación |
| Safe-area | La cápsula baja por debajo del inset | La gota **cubre** la zona del notch (sigue unida al borde) y el contenido queda por debajo del inset |

## Secuencia (verificada en el filmstrip, 393 px)
| Tiempo | Fase | Qué se ve |
|---|---|---|
| 0 ms | vacío | Solo el borde |
| 40–120 ms | nacimiento | Gota estrecha que asoma, unida por un cuello cóncavo |
| 120–600 ms | descenso / deformación | Se estira hacia abajo, se abomba y se ensancha con un rebote leve |
| ≈ 900 ms | reposo | Píldora de ≈172×52, extremo inferior totalmente redondo |
| +100–500 ms | expansión | La misma silueta se despliega a ≈369×150 |
| | contracción | El detalle se recoge primero y después la silueta vuelve al reposo |
| ≈ 600 ms totales | retirada | Contenido fuera → se estrecha → asciende → desaparece en el borde |

## Fuera de esta ronda (pendiente)
- **Varias actividades simultáneas en el modelo de gota.** El planteamiento de r01 (dos cápsulas lado a lado) no encaja con una superficie única unida al borde. Está por decidir (D2-06).
