# Declaración de cumplimiento · GTable + GFilterBar · r02

**Estado:** aprobada. Amplía r01 (aprobada; todo se mantiene) con la barra de filtros pedida por el usuario: filtros **no fijos** al estilo Stripe, **por columna**, con **reglas** (operador + valor), combinados con **Y** (decisión del usuario). Las decisiones de estructura se derivan de WCAG 2.2 AA y de APG (botón de menú, diálogo no modal, grupo de casillas).
**Ruta:** R1 · **Fidelidad:** F2 · **Material:** kit neutral; iconos de Lucide `plus` y `x`.
**Siguiente dueño:** lima → `design/contracts/table.md`, `pagination.md` y `filter-bar.md`.

## El modelo de filtros

```js
// la columna declara cómo se filtra; el tipo decide las reglas
{ key: 'estado',  label: 'Estado',  filter: { type: 'enum', options: ['activo', 'pausado', 'vencido'], suggest: true } }
{ key: 'total',   label: 'Total',   filter: { type: 'number', unit: '$', suggest: true } }
{ key: 'alta',    label: 'Alta',    filter: { type: 'date', suggest: true } }
{ key: 'cliente', label: 'Cliente', filter: { type: 'text', fields: ['nombre', 'correo'] } }  // compuesta: busca en sus campos

// el resultado es un modelo de datos (v-model:filters), no HTML
[{ key: 'estado', op: 'in', value: ['pausado', 'vencido'] }, { key: 'total', op: 'gt', value: 3000 }]
```

| Tipo | Reglas |
| --- | --- |
| `text` | contiene · es · empieza por |
| `number` | mayor que · menor que · igual a · entre |
| `date` | después de · antes de · entre · últimos N días |
| `enum` | es cualquiera de |

## Decisiones de estructura

| # | Decisión | Fundamento |
| --- | --- | --- |
| 1 | Barra de filtros encima de la tabla, `role="group"` con nombre; envuelve en varias líneas | WCAG 1.3.1, 1.4.10 |
| 2 | **Tres clases de elemento:** chip **sugerido** (botón punteado «+ Estado», `suggest: true`), chip **aplicado** (resumen + ×), y **«+ Agregar filtro»** (botón de menú con las columnas filtrables no aplicadas). Un filtro aplicado deja de sugerirse | Decisión del usuario (Stripe); descubrir sin conocer los filtros de antemano |
| 3 | El chip aplicado son **dos botones**: el resumen reabre el editor («Editar filtro: Estado: pausado, vencido») y la × lo quita («Quitar filtro: …»), cada uno con nombre completo | WCAG 2.5.3 y 4.1.2: el nombre incluye el texto visible; dos acciones, dos controles |
| 4 | **Editor:** diálogo no modal (`role="dialog"`, `aria-labelledby` «Filtrar por Total») con la regla (`select`), el valor (campo según tipo; casillas en `enum`; dos campos en «entre») y Cancelar/Aplicar. El foco entra al primer control; **Enter aplica**; **Esc cancela**; al aplicar o cancelar, el foco vuelve al chip (verificado) | APG diálogo no modal; WCAG 2.4.3 |
| 5 | **Validación:** sin valor no se aplica; mensaje visible y anunciado («Indica un valor para aplicar el filtro»). Un campo numérico vacío **no es 0** (hallazgo propio corregido en la ronda: `+''` daba 0 y aplicaba «últimos 0 días») | WCAG 3.3.1 |
| 6 | **Y entre filtros; O dentro de una lista** («Estado: pausado, vencido»). Verificado: Estado {pausado, vencido} → 8 de 12; + Total > 3000 → solo filas que cumplen ambos | Decisión del usuario |
| 7 | **Recuento** visible («6 resultados») y **anunciado** (región viva cortés) tras cada cambio; la paginación vuelve a la página 1 | WCAG 4.1.3 |
| 8 | **Quitar** un filtro mueve el foco al chip siguiente (o a «Agregar filtro»); **Limpiar filtros** aparece solo con filtros y lleva el foco a «Agregar filtro» | WCAG 2.4.3 (el control pulsado desaparece) |
| 9 | **Vacío por filtros** distinto del vacío real: «Ningún cliente cumple estos filtros» + «Limpiar filtros» | Heurística: salida clara del callejón sin resultados |
| 10 | **Columna compuesta filtrable** por texto en varios campos (`fields`: nombre y correo) | Coherencia con el modelo campo ≠ columna |
| 11 | El menú «Agregar filtro» sigue el patrón de botón de menú (flechas, Esc devuelve el foco); en el componente final será **`GMenu`** | APG; reutilización |
| 12 | El editor se posiciona como el contenido de `GHelper` (`utils/anchor.js`, volteo) y, **por debajo de `space × 130`, se abre como hoja** (`GDialog`), igual que `GHelper` (DECISIONS.md #103) | Reutilización; en móvil un popover con campos es incómodo |
| 13 | Tarjetas (r01) siguen funcionando con filtros: la barra envuelve; 360px sin desborde (verificado) | WCAG 1.4.10 |

## Comprobaciones ejecutadas

Chromium: sugerido → editor → aplicar (resumen, foco y anuncio); «Agregar filtro» por teclado (Enter, flechas, Enter); regla numérica con Enter; validación de vacío; Esc devuelve el foco al chip; quitar y limpiar con foco correcto; vacío por filtros; tarjetas a 360px con un filtro aplicado.

## Comprobaciones NO ejecutadas

- La hoja del editor en un visor móvil real (en el prototipo el editor es siempre popover; la hoja la aporta `GDialog` en el componente).
- Lector de pantalla real con los chips y el editor.
- Rangos inválidos («entre 5000 y 1000») y fechas en otros formatos regionales.
- Persistir los filtros en la URL: fuera de alcance.

## Hallazgos para lima

| # | Hallazgo | Severidad | Propuesta de la ronda |
| --- | --- | --- | --- |
| 1 | Modelo | Alta | `columns[].filter`: `{ type, options?, unit?, fields?, suggest? }`; `v-model:filters` = lista de `{ key, op, value }` |
| 2 | Filtrado local o externo | Alta | Como el orden: local por defecto; `filterMode="external"` solo emite (datos del servidor) |
| 3 | Componente | Alta | `GFilterBar` público y reutilizable (`fields` + `v-model:filters`); `GTable` lo integra cuando alguna columna declara `filter` (y emite lo mismo) |
| 4 | Textos | Alta | Sin valores por defecto: nombres de reglas, «Agregar filtro», «Limpiar filtros», «Filtrar por {label}», «Editar/Quitar filtro: {resumen}», Aplicar, Cancelar, validación, recuento, vacío por filtros. Formato de valores (`unit`, fechas) con `Intl` según el idioma del documento |
| 5 | Operadores | Media | Lista cerrada por tipo (tabla de arriba); extensible más adelante; el valor de `enum` siempre es lista |
| 6 | Validación de rangos | Media | «entre» exige desde ≤ hasta; lo valida el editor |
| 7 | Hoja en móvil | Media | Reutilizar el criterio y la presentación de `GHelper` (`space × 130`, `GDialog`) |
| 8 | Recuento | Baja | `total` externo cuando `filterMode="external"` |
