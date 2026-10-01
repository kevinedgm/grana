# Brief funcional · GTable + GFilterBar · r02

**Agente:** kiwi · **Ruta:** R1 · **Fidelidad:** F2 · **Parte de:** `design/lab/table/r01/` (aprobada; todo lo de r01 se mantiene).

## Decisiones del usuario

- **Filtros como en Stripe:** no fijos; chips sugeridos que «van apareciendo», el usuario **decide qué filtrar**, filtro **por columna** y con **reglas** (operador + valor).
- **Combinación:** todos los filtros se cumplen (**Y**). Dentro de un filtro de lista, «es cualquiera de» (O entre opciones).
- **Integrado en la tabla** (aparece si alguna columna declara `filter`), implementado como componente propio `GFilterBar` reutilizable sin tabla (como `GPagination`).

## Enunciado

El usuario de una colección grande necesita **reducirla a lo que le importa** («vencidos de más de $2,000 dados de alta este año») **sin conocer de antemano** qué filtros existen ni rellenar un formulario de búsqueda.

## Pregunta de diseño

¿Qué anatomía y comportamiento necesita la barra de filtros para que **descubrir** (chips sugeridos y «Agregar filtro»), **definir** (regla + valor en un popover), **leer** (chip sólido con resumen) y **quitar** un filtro sean evidentes, accesibles por teclado y funcionen igual en tabla y en tarjetas?

## Anatomía nueva

| Parte | Nota |
| --- | --- |
| Barra de filtros | Encima de la tabla; envuelve en varias líneas |
| Chip aplicado | Botón con el resumen («Total > $1,000») que reabre el editor + botón × para quitarlo |
| Chip sugerido | Botón punteado «+ Estado»: atajo a un filtro aún no aplicado |
| «+ Agregar filtro» | Menú con las columnas filtrables no aplicadas |
| Editor | Popover no modal: regla + valor + Aplicar/Cancelar |
| «Limpiar filtros» | Solo con algún filtro aplicado |
| Recuento | «5 resultados», anunciado |
| Vacío por filtros | Mensaje distinto del vacío real, con «Limpiar filtros» |
