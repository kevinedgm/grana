# Iconografía y diferenciación

Una interfaz no genérica no es una interfaz decorada. La diferenciación tiene que mejorar comprensión, confianza o descubrimiento; la novedad que solo decora es un riesgo, no un logro.

## Hipótesis de personalidad

Cuando el brief pide modernidad, personalidad o una solución no genérica, registra antes de la Fase 2:

| Elemento | Qué contiene |
|---|---|
| Hipótesis de personalidad | Cómo debe sentirse el producto, conectado con la intención emocional del brief |
| Diferenciación | Qué decisión concreta lo separa de la competencia o de la plantilla, y qué beneficio da al usuario |
| Riesgo de novedad | Qué parte es novedosa sin beneficio estructural y cómo se mitiga |

En la Fase 1, cada alternativa A/B/C declara una dirección conceptual distinguible y la decisión estructural que deriva de ella. En la Fase 2, el material traduce esa personalidad a superficie, luz y movimiento.

## Iconografía

### Cuándo usar un icono

- Cuando reduce carga cognitiva (una acción frecuente que se reconoce más rápido que se lee).
- Cuando indica estado junto a un texto (éxito, advertencia, sincronizando).
- Cuando orienta la navegación junto a su etiqueta.
- Cuando refuerza una acción ya nombrada.

No uses un icono ambiguo como única señal. Si hay que explicarlo con un tooltip para que se entienda, probablemente necesita etiqueta visible.

### Registro por icono

Para cada icono registra: significado, acción o estado que representa, etiqueta accesible, texto visible o tooltip, alternativa textual si el icono no carga y tamaño del target que lo contiene.

### Familias

Usa las familias permitidas en `SKILL.md`: Phosphor Light, Remix Line o Tabler Icons outline. Elige una sola familia por producto y un solo grosor de trazo; mezclar familias es una de las señales más rápidas de plantilla ensamblada.

El grosor del trazo acompaña al material: trazos finos para materiales ligeros (vidrio, papel, seda), trazos medios para materiales densos (hormigón, metal). Un icono propio para la acción o el objeto central del producto es una forma eficaz de motivo distintivo.

### Accesibilidad de iconos

- Botón solo con icono: `aria-label` con el verbo de la acción, y el SVG con `aria-hidden="true"`.
- Icono junto a texto: el SVG con `aria-hidden="true"`; el texto ya nombra la acción.
- Icono informativo sin texto: `role="img"` y `aria-label`.
- El icono tiene contraste de al menos 3:1 contra su fondo cuando es necesario para entender la interfaz.
- El target que contiene el icono mide al menos 44×44 px en móvil, aunque el dibujo sea de 20 px.

```html
<button type="button" class="icon-action" aria-label="Archivar conversación">
  <svg aria-hidden="true" focusable="false" width="20" height="20"><use href="#ph-archive-light"></use></svg>
</button>
```

## Diferenciación sin perder usabilidad

En cualquier dirección, por arriesgada que sea, se conservan: foco visible, navegación por teclado, targets de 44 px, orden de lectura, alternativa con movimiento reducido y alternativa textual de cada icono.

Prueba de riesgo de novedad para cada decisión distintiva:

1. ¿Qué entiende, decide o descubre mejor el usuario gracias a ella?
2. ¿Qué pierde un usuario que la ve por primera vez, con prisa o con tecnología de asistencia?
3. Si la respuesta a la primera es «nada», la decisión es decorativa: se simplifica o se mueve a un lugar donde no estorbe a la tarea.
