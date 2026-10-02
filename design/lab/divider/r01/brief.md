# Brief — GDivider (r01)

> Brief de kiwi a partir de la propuesta del usuario (2026-10-02), verificada contra el repo. El usuario aprobó construir `GDivider` y pidió a lima decidir si reabrir «separación entre secciones = espacio, no línea» (`design/contracts/form.md:529`) para que `GFormSection` pueda ofrecer un divider opcional en su Fase 3.

## Qué es

Una línea de separación entre grupos de contenido, para cuando el espacio por sí solo no basta. Componente pequeño, deliberadamente simple.

## Variantes pedidas (propuesta del usuario; kiwi decide cuáles entran en v0.1)

- horizontal / vertical
- con label (texto centrado sobre la línea, o «O bien»)
- inset (no llega a los bordes del contenedor)
- full width
- sutil / fuerte (dos pesos visuales, no colores)

## Regla de producto (ya aceptada)

> No usar `GDivider` como sustituto sistemático del spacing. Si dos secciones ya quedan claramente separadas por título + espacio, no hace falta una línea por instinto.

Esto es una guía de uso (va en el README y en la declaración de kiwi), no algo que el componente deba imponer por software.

## Lo que NO es esta ronda

- No es la Fase 3 de `GFormSection` (secciones colapsables, «Agregar…», condicionales): eso ya estaba en el mapa, independiente de este brief.
- No decide si `GFormSection` ofrece un divider interno entre secciones — **eso se lo pide el usuario a lima**, porque reabre la decisión de `form.md:529` («la sección se distingue por espacio, no por cajas»). Kiwi deja el hallazgo listo para lima; no lo decide él mismo salvo que derive de estándar.

## Verificado contra el repo (no reabrir sin motivo)

- No existe `GDivider` ni `<hr>` en ningún `.vue` de `packages/vue/src` (ver auditoría del 2026-10-02).
- `GInputGroup.css` tiene una variable interna `--_divider`/`--_divider-style` para el borde entre partes fusionadas — es un detalle de implementación local, no del `GDivider` público; no lo toques.
- Escala tipográfica para el label del divider: ya existe (`--g-text-caption-*` o `--g-text-body-sm-*`, a decidir por lima/coco con el contrato de tokens §5).
