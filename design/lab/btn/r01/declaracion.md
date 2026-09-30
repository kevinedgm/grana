# Declaración de cumplimiento · GBtn · r01

**Estado:** aprobada (aprobación autónoma del squad: todas las decisiones se derivan de un estándar o del contrato vigente; ninguna es de producto o identidad).
**Ruta:** R1 · **Fidelidad:** F2 · **Material:** kit neutral de grises.
**Siguiente dueño:** lima → `design/contracts/btn.md`.

## Estados cubiertos

`default`, `hover`, `focus-visible`, `active`, `disabled`, `loading`. En combinación con: 5 variantes, 5 tamaños, 3 densidades, iconos inicial y final, solo icono, `block`, render como enlace, contenedor estrecho y texto largo.

## Decisiones de estructura

| # | Decisión | Fundamento |
| --- | --- | --- |
| 1 | `type="button"` por defecto | Dentro de un `<form>` el valor nativo es `submit`: se evitan envíos accidentales (prevención de errores) |
| 2 | `loading` = `aria-disabled` + `aria-busy`, sin `disabled` nativo | Deshabilitar un botón enfocado hace perder el foco (WCAG 2.4.3, orden del foco) |
| 3 | `disabled` = atributo nativo | El botón no debe recibir foco ni activarse |
| 4 | Indicador de carga superpuesto; etiqueta con `visibility: hidden` | El ancho no cambia (verificado: 201.17px antes y después) |
| 5 | Activaciones ignoradas durante `loading` | Prevención de acciones repetidas (verificado: 1 emitida, 2 ignoradas) |
| 6 | Área táctil con pseudo-elemento: ≥ 24px, ≥ 44px con `pointer: coarse` | WCAG 2.5.8; el aspecto visual no crece |
| 7 | Solo icono: cuadrado y `aria-label` obligatorio | WCAG 4.1.2 (nombre, función, valor) |
| 8 | Iconos siempre `aria-hidden` | El nombre accesible viene de la etiqueta |
| 9 | La etiqueta salta de línea; altura mínima, no fija | WCAG 1.4.4 y 1.4.10; traducciones largas |
| 10 | `href` → `<a>`; con `disabled`, sin `href`, `aria-disabled` y fuera del orden de tabulación | Semántica de navegación frente a acción |
| 11 | Sin manejadores de teclado propios | El `<button>` nativo ya activa con Enter y Espacio |
| 12 | Foco solo con `:focus-visible`, separado del borde | WCAG 2.4.7 y 2.4.11 |

## Criterios revisados

| Criterio | Resultado | Cómo |
| --- | --- | --- |
| WCAG 2.1.1 Teclado | Cumple | Prueba automatizada: Tab, Enter, Espacio |
| WCAG 2.4.3 Orden del foco | Cumple | El foco permanece en el botón durante `loading` (verificado) |
| WCAG 2.4.7 Foco visible | Cumple en el prototipo | Contorno de 3px con separación de 3px; el estilo final es de coco |
| WCAG 2.5.8 Tamaño del objetivo | Cumple por diseño | Piso de 24px en la tabla de tamaños; pseudo-elemento para 44px |
| WCAG 4.1.2 Nombre, función, valor | Cumple por diseño | `aria-label` obligatorio en solo icono |
| WCAG 1.4.10 Reajuste | Cumple | Sin desborde horizontal de la página a 320px |
| Heurística: visibilidad del estado del sistema | Cumple | `loading` visible y anunciado con `aria-busy` |
| Heurística: prevención de errores | Cumple | `type="button"`; activaciones repetidas bloqueadas |
| Heurística: consistencia | Cumple | Usa exclusivamente la API compartida de `docs/contract/api.md` |

## Comprobaciones ejecutadas

- Render a 320, 768 y 1440 px con Chromium (Playwright): sin desborde horizontal de la página (`scrollWidth` igual al ancho de la ventana). A 320px las tablas se desplazan dentro de su propio contenedor.
- Consola del navegador sin errores.
- Teclado: foco con Tab, activación con Enter, dos activaciones durante `loading` ignoradas, foco conservado, ancho estable.

## Comprobaciones NO ejecutadas

- `scripts/check_artifact.py` del protocolo de gobernanza de interfaz: el archivo no existe en el entorno.
- Referencias del protocolo (`references/*.md`, plantillas, kit de wireframe): no existen en el entorno; se siguió el `SKILL.md` del protocolo.
- Lector de pantalla real (VoiceOver, NVDA): no ejecutado. Pendiente confirmar cómo se anuncia `aria-busy`.
- Zoom al 200% del navegador: no ejecutado (el reajuste se probó por ancho de ventana, no por zoom).
- `forced-colors` y `prefers-reduced-motion`: definidos en el brief, no probados. Su estilo final es de coco.
- Dispositivo táctil real (`pointer: coarse`): no ejecutado.
- Contraste: no aplica a un wireframe en grises; lo audita coco con el tema real.

## Hallazgos para lima

| # | Hallazgo | Severidad | Propuesta de la ronda |
| --- | --- | --- | --- |
| 1 | `docs/contract/tokens.md` §4 no precisa si `density` reduce la altura | Media | Reduce la altura (× 1, 0.875, 0.75) con piso de 24px |
| 2 | Falta decidir si `loading` necesita un texto para lectores de pantalla | Media | `aria-busy` como mínimo; evaluar un prop `loadingText` |
| 3 | Regla de `href` + `disabled` no está en el contrato | Baja | Incorporar la decisión 10 |
| 4 | `type` no está en la API compartida | Baja | Prop propia de `GBtn`: `button` · `submit` · `reset`, por defecto `button` |
