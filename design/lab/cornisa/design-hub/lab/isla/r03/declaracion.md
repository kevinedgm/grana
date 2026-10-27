# Declaración de cumplimiento · cornisa · r03

| Campo | Valor |
|---|---|
| Ruta | R1 → R3 (conceptos aprobados por el usuario el 2026-10-26) |
| Fidelidad | F1 textual + implementación real como evidencia |
| Modifica producción | Sí (`cornisa/src`), sin publicar |

## Desviaciones del protocolo
- **No hay wireframe F2 en grises en esta ronda.** El cambio afecta solo a la fila compacta y el usuario ya aprobó el concepto. La geometría (D3-01) se fijó por escrito y se validó sobre la implementación real (`cornisa/evidence/r03-hoja.png`). Si el usuario quiere un F2 aislado, se abre r03b.
- Kiwi, Lima, Coco y impeccable se siguieron **a mano**. Ninguno se invocó como agente o skill instalada. El lanzador y el detector de impeccable sí se ejecutaron de verdad.

## Comprobaciones ejecutadas
- Núcleo 21/21 (incluye `parseShortcut`) · tsc 0 errores · navegador **189/189** (27 pruebas × 7 proyectos, 2 workers).
- Pruebas nuevas: la acción rápida funciona sin expandir, no se duplica en expandido, mide ≥ 44 px, tiene estilo propio (sin estilos del navegador) y respeta el orden de tabulación; con título largo en 320 se recorta el título, nunca la acción; atajo desactivado por defecto (no intercepta la tecla); atajo activo con conmutación del foco y sin efecto si no hay actividad.
- Mutaciones detectadas: acción duplicada en expandido · salto instantáneo de ancho.
- Detector de impeccable: 1 hallazgo (`marquee`, excepción ya revisada).
- Defecto encontrado en las capturas y corregido: la acción rápida salía con esquinas rectas y estilos del navegador (faltaba en el selector común).
- Prueba de continuidad rehecha: se mide contra el **tiempo simulado** de la física. La anterior, basada en el reloj del muestreador, daba picos intermitentes por el orden de los callbacks de rAF bajo carga. Con la nueva: 42/42 en ejecución cargada (4 workers × 6 repeticiones), y la mutación de salto sigue fallando.

## Comprobaciones NO ejecutadas
Lectores de pantalla reales (incluido el anuncio de `aria-keyshortcuts`) · Safari, Edge y dispositivos reales · zoom nativo · forced-colors en navegador.

## Abierto
D3-03 (¿persistentes por defecto cuando hay acciones?) → decisión del usuario.
