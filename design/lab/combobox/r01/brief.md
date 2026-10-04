# Brief — `GCombobox`, r01: base funcional

> kiwi, 2026-10-04. Origen: `design/lab/form/r01/declaracion.md` (tabla de controles y tabla de huecos: «`GSelect` filtra por tecleo pero no admite texto libre ni búsqueda remota → `GCombobox`, sin `fetch`: emite `search`»), `form.md` «Fases siguientes» (Fase 5, prioridad alta) y `PENDIENTES.md` §3.

## Para qué

Formularios clínicos y administrativos donde la respuesta está en un catálogo demasiado grande para un `GSelect`: paciente entre miles, diagnóstico CIE-10, medicamento, cliente, código postal o colonia. Los resultados vienen del servidor; Grana no pide datos.

## Qué es esta ronda

La **base funcional**: semántica, teclado, estados de la lista, valor frente a texto, anuncios, encaje en formularios, diálogo y móvil. Deriva de WAI-ARIA APG (*Combobox with list autocomplete*), WCAG 2.2 y los contratos vigentes; **no se pregunta al usuario**. La forma de esta página es la convencional a propósito: la identidad se decide en `../r02/` (tres conceptos).

## Frontera (leída en los contratos)

| Componente | Qué es | Cuándo se usa | Por qué no cubre el caso |
| --- | --- | --- | --- |
| `GSelect` (`select.md`) | *Select-only combobox*: `<button role="combobox">` + `listbox` | Una opción entre una lista conocida y corta (hasta decenas) | Sin escritura: solo prefijo por tecleo. Sin búsqueda remota, sin texto libre, sin `multiple`, sin virtualización («Límites conocidos»). Su fila «Agregar nuevo…» (#57) **pide**, no crea |
| `GCombobox` (esta ronda) | `<input role="combobox">` + `listbox` | Una opción entre cientos o miles, o resultados del servidor, o texto libre permitido | — |
| `GInput` + `<datalist>` nativo | Sugerencias del navegador (el atributo `list` llega al `<input>` por `$attrs`) | Sugerencias de **texto** sin valor asociado, sin estados | No hay `value` distinto de la etiqueta, ni carga, vacío, error, grupos, opciones ricas ni estilo; el anuncio depende del navegador |
| `GMenu` (`menu.md`) | `role="menu"`: **acciones** | Ejecutar algo | No es un valor de formulario; sin modelo |
| `GFilterBar` (`filter-bar.md`) | Filtros de una tabla con su propio editor y fichas | Acotar una colección | Su editor elige operador y valor de un filtro; puede **componer** `GCombobox` como editor de valor más adelante, no al revés |
| `GInputGroup` (`form.md` §6) | Campos fusionados en una caja | Unidad + cantidad, país + teléfono | Es disposición; un `GCombobox` puede ser una de sus partes (hallazgo L12) |
| `GTagInput` / selección múltiple | Reservado (`PENDIENTES.md` §3) | Varias opciones con etiquetas | **Fuera de esta ronda** (ver abajo) |

**Regla de elección para la documentación:** ≤ 7 visibles → `GRadioGroup`; lista conocida de hasta unas decenas → `GSelect`; más, remota o con texto libre → `GCombobox`.

## Selección múltiple: recomendación

No entra en esta ronda. Se recomienda que sea **un modo del mismo componente (`multiple`) en una Fase 2 con ronda propia**, no un componente aparte: comparte el motor (búsqueda, lista, estados, anuncios, hoja), pero cambia cuatro cosas que merecen su medida: el modelo (arreglo), la anatomía del campo (etiquetas que hacen crecer la caja: choca con el principio «sin saltos»), el teclado (Retroceso quita, flechas entre etiquetas) y los anuncios (agregado y quitado). `GTagInput` queda como nombre reservado solo para el caso sin catálogo (etiquetas de texto libre). Es la pregunta de producto 3 de r02.

## Entregables

- `combo.js`: motor de la maqueta (`XCombo`) y aplicación de ejemplo con «servidor» simulado. Lo comparte r02.
- `combo.css`: kit de la maqueta (clases `xc-*`, solo `var(--g-*)`).
- `index.html`: siete casos. `verificar.mjs`: 105 comprobaciones por motor.
- `declaracion.md`: decisiones numeradas, estados, comprobaciones y hallazgos para lima.

## Ver

`index.html` (`?dir=rtl`). Verificación: `node design/lab/combobox/r01/verificar.mjs` (`GRANA_PW_PORT=4209`; requiere `npm run build`).
