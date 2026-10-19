# Regla obligatoria: auditoría visual y estructural de vistas de gestión

> Regla del usuario (2026-10-18). Se aplica a toda vista de gestión y a los componentes de Grana que la componen; la cita `CLAUDE.md` («Auditoría visual y estructural»). Texto del usuario sin cambios.

**Instrucción:** Antes de crear, modificar o implementar cualquier vista de gestión de datos, CRUD, dashboard, tabla, lista o formulario, debes revisar y aplicar los lineamientos del Brief de Diseño UI: Vistas de Gestión y Formularios.

## 1. Revisión previa obligatoria

Antes de comenzar la implementación, analiza la vista e identifica si cumple con los siguientes aspectos:

- **Estructura:** jerarquía clara entre cabecera, barra de herramientas, área de datos y pie de tabla.
- **Jerarquía visual:** títulos, subtítulos, acciones principales y contenido correctamente diferenciados.
- **Contraste y delimitación:** tarjetas, tablas, formularios e inputs deben distinguirse claramente del fondo y de los elementos adyacentes.
- **Espaciado:** márgenes, padding, separación entre secciones y alineación consistentes.
- **Controles:** buscadores, filtros, selectores, acciones por registro y operaciones masivas correctamente organizados.
- **Tablas y listas:** encabezados diferenciados, filas legibles, divisores sutiles, estados interactivos y paginación cuando corresponda.
- **Formularios:** campos con límites visuales reconocibles, etiquetas claras, agrupación lógica y estados de foco visibles.
- **Estados de interfaz:** carga, contenido vacío, errores, deshabilitado, hover y focus, según corresponda.
- **Consistencia:** reutilización de los componentes, tokens de diseño, patrones y convenciones existentes en el proyecto.

## 2. Criterio de calidad visual

Evita interfaces visualmente planas, desorganizadas o ambiguas. Ningún elemento debe parecer que flota sin una relación visual clara con su sección.

Utiliza fondos, bordes, divisores, espaciado, tipografía y jerarquía de acciones para establecer una estructura visual comprensible. No agregues decoración innecesaria ni apliques colores, sombras o bordes indiscriminadamente.

Los valores visuales específicos del brief son referencias iniciales. Si el proyecto dispone de un sistema de diseño establecido, utiliza sus tokens y componentes equivalentes en lugar de introducir valores arbitrarios o estilos duplicados.

## 3. Proceso de auditoría

**Antes de implementar:**

1. Inspecciona la estructura actual de la vista y los componentes reutilizables disponibles.
2. Compara el diseño existente con los lineamientos del brief.
3. Identifica los incumplimientos, las inconsistencias y los estados faltantes.
4. Determina qué cambios son necesarios y cuáles podrían afectar el comportamiento existente.

**Después de implementar:**

1. Verifica que la estructura visual y la jerarquía sean correctas.
2. Comprueba los estados de interacción y los escenarios de carga, vacío y error aplicables.
3. Revisa la alineación, el espaciado, el contraste y la consistencia con el sistema de diseño.
4. Corrige los incumplimientos detectados antes de dar por terminada la tarea.

## 4. Restricciones

- No omitas la auditoría previa, aunque la solicitud parezca sencilla.
- No reconstruyas componentes existentes sin comprobar primero si pueden reutilizarse.
- No inventes patrones visuales que contradigan el sistema de diseño del proyecto.
- No sacrifiques accesibilidad, legibilidad o funcionalidad para conseguir una apariencia más estética.
- No declares que una vista está verificada si no has realizado las comprobaciones correspondientes.
- No modifiques elementos ajenos al alcance de la solicitud sin una justificación técnica.

## 5. Informe de cumplimiento

Al finalizar, informa brevemente:

- **Cumplimientos:** aspectos que ya respetaban el brief.
- **Correcciones:** incumplimientos encontrados y cambios realizados.
- **Pendientes:** aspectos que no pudieron verificarse o requieren una decisión adicional.

**Regla de cierre:** Una vista no se considera terminada únicamente porque funciona o compila. Debe cumplir los criterios visuales, estructurales y funcionales aplicables al contexto, y cualquier limitación de verificación debe quedar explícita.
