# Brief funcional · cornisa · r03 (delta sobre r02)

**Ruta:** R1 → R3 · **Fidelidad:** F1 textual + evidencia de la implementación real (desviación declarada abajo) · **Fecha:** 2026-10-26
**Origen:** critique de impeccable (P1 «acciones ocultas en compacto») y D-09 (alcance por teclado). El usuario aprobó los dos conceptos el 2026-10-26.

## Cambio 1 · Acción rápida en compacto (D3-01)
- La **primera** acción de la actividad aparece en la fila compacta como un botón **hermano** del conmutador (no anidado): `[icono título meta ⌄] [Acción] [+N]`.
- En expandido, la acción rápida **se oculta**: las acciones completas viven en el detalle. Nunca hay dos botones iguales visibles.
- La segunda acción y «Cerrar» siguen solo en el expandido.
- **Geometría:** 36 px visuales dentro de 44 px de área (borde transparente de 4 px). Si no cabe todo, el título se recorta primero; la acción nunca se recorta.
- **Orden de tabulación:** conmutador → acción rápida → «+N».

## Cambio 2 · Atajo de teclado opcional (D3-02)
- `createIsland({ shortcut: 'Alt+Shift+N' })`. **Desactivado por defecto** (`null`).
- Exige al menos un modificador entre Alt, Ctrl y Meta (WCAG 2.1.4: sin atajos de un solo carácter).
- Pulsado con la isla visible: el foco va al conmutador. Pulsado con el foco dentro: vuelve al elemento previo. Sin actividad visible: no hace nada (no se roba ninguna tecla).
- `aria-keyshortcuts` en el conmutador cuando está activo.

## Riesgo detectado (NO resuelto en esta ronda)
Una acción en un aviso que caduca (p. ej. «Deshacer» con 5 s por defecto) sigue siendo frágil para lectores de pantalla y usuarios lentos, aunque se pause con hover o foco. Propuesta: **las actividades con acciones son persistentes por defecto**. Cambia un valor por defecto de la API aprobada, así que es **decisión del usuario** (D3-03).

## Hechos · Supuestos · Incógnitas
Hechos: decisiones 1 y 2 del usuario. Supuestos: 36/44 px; tabulación en orden DOM. Incógnita: D3-03.
