# Brief — Sistema de construcción de formularios adaptables (r01)

> Brief del usuario, tal como lo entregó (listas compactadas en línea; el contenido es el suyo).

Quiero crear un sistema genérico para construir formularios dentro de un Design System. No quiero únicamente componentes individuales como Input, Select o Checkbox: quiero definir cómo deben componerse formularios completos, desde formularios muy pequeños hasta formularios extensos con decenas de campos.

El sistema debe ayudar a decidir: cómo distribuir campos; cuándo usar una o varias columnas; cómo agrupar información; cómo manejar campos pequeños y grandes; cómo organizar secciones opcionales; cómo presentar información avanzada; cómo adaptar todo a desktop, tablet y móvil.

## Objetivo

El formulario debe sentirse claro, progresivo y fácil de escanear. El usuario no debería percibir una lista interminable de campos. La estructura debe comunicar: qué información se solicita; qué campos están relacionados; qué información es obligatoria; qué partes son opcionales; qué secciones pueden omitirse; qué pasos faltan.

## Tipos de formularios

Cortos; medianos; largos; de configuración; administrativos; de captura; dentro de dialogs; en drawers; de varios pasos; con secciones opcionales.

## Componentes de campo

Debe poder combinar: text input; number input; textarea; select; autocomplete; date picker; time picker; checkbox; radio; switch; phone input; email input; address fields; currency; percentage; temperature; quantity; file input; custom fields.

## Principio de ancho por contenido

Los campos no deben ocupar siempre el 100% del ancho. El ancho responde al tipo de información.

- **Compactos** (fracción pequeña del grid): temperatura; edad; código; porcentaje; número de habitación; cantidad; sexo o género; estado corto; prefijo telefónico.
- **Medios:** teléfono; correo; nombre; apellido; ciudad; código postal; identificadores.
- **Amplios:** dirección; razón social; descripción; observaciones; comentarios; notas; búsqueda compleja.

No quiero que todos los inputs tengan el mismo ancho sólo para hacerlos «ordenados». La longitud visual debe ayudar a anticipar la longitud esperada del contenido.

## Grid de formulario

Grid flexible; en desktop puede aprovechar múltiples columnas. Conceptualmente: corto 2 o 3 columnas; medio 4 o 6; largo 8 o 12; textarea ancho completo. Composiciones naturales como:

- Nombre | Apellido
- Código país | Teléfono
- Temperatura | Unidad | Fecha
- Calle y número / Colonia | Código postal / Ciudad | Estado / País

## Agrupación semántica

Campos relacionados en secciones (Información básica; Contacto; Dirección; Datos fiscales; Configuración; Preferencias; Seguridad; Información adicional). Cada sección puede tener: título; descripción; campos; acciones secundarias; ayuda contextual.

## Secciones opcionales

No deben ocupar espacio permanente. Ej.: «Datos fiscales» como sección colapsada, accordion, disclosure u opción «Agregar datos fiscales»; al expandirse, muestra sus campos. La interfaz debe comunicar claramente que es opcional.

## Progressive disclosure

Lo avanzado o poco frecuente se revela sólo cuando hace falta (Datos fiscales; Información adicional; Configuración avanzada; Dirección secundaria; Datos de facturación; Preferencias especiales). Primero lo esencial.

## Campos condicionales

Campos que aparecen según otras respuestas. «¿Requiere factura?» No → sin datos fiscales; Sí → sección de datos fiscales. «Tipo de persona»: Física → CURP; Moral → Razón social y representante. La aparición debe sentirse natural, sin saltos visuales agresivos.

## Secciones colapsables

Cuando son opcionales, secundarias, ya completas o avanzadas. No usar accordion para todo: las secciones principales necesarias para completar la tarea permanecen visibles.

## Formularios largos

Evitar una sola superficie interminable: secciones; stepper; navegación lateral; tabs; accordions secundarios, según la relación entre los datos.

- **Stepper:** proceso secuencial; decisiones que afectan a las siguientes; grupos con contenido suficiente; todo en una pantalla sería abrumador (1 Información básica, 2 Contacto, 3 Dirección, 4 Datos fiscales, 5 Confirmación). No para un formulario que cabe fácilmente en una página.
- **Tabs:** secciones independientes entre las que se cambia libremente (General, Facturación, Permisos, Configuración). No con dependencia secuencial.
- **Navegación lateral** (desktop, administrativos extensos): indica sección actual, completa, incompleta, error; al seleccionar hace scroll a la sección.

## Labels, helper y placeholder

- Label visible siempre; placeholder nunca como sustituto permanente. El label puede llevar indicador de obligatorio u opcional, helper, tooltip.
- Helper text para formato, restricciones, propósito, ejemplos; no bajo todos los campos.
- Placeholder para ejemplos o formato; no repite el label (Label «Teléfono», placeholder «951 123 4567»).

## Campos obligatorios

Convención consistente: marcar los obligatorios **o** los opcionales, sin mezclar. Si casi todo es obligatorio, marcar sólo los opcionales.

## Validación

Cerca del campo. Estados: default; focus; valid; warning; error; disabled; readonly. Los errores explican qué ocurrió y cómo corregirlo (nada de «Campo inválido»). Sin errores agresivos antes de que el usuario complete el campo: al salir, tras interacción, al enviar, o en tiempo real cuando sea útil. En formularios muy largos, **resumen de errores** superior que permite navegar al campo.

## Acciones y footer

Principales claras (Guardar, Continuar, Crear, Actualizar, Enviar); secundarias (Cancelar, Volver, Guardar borrador); sin muchas acciones con el mismo peso. En formularios largos, **footer sticky** con las principales (dialogs, drawers, administrativos), sin cubrir campos.

## En dialogs y drawers

- **Dialogs** medianos/grandes: header separado, contenido scrollable, secciones claras, footer con acciones; puede reutilizar Inset Surface. El formulario vive en una superficie estructurada, no como inputs pegados al dialog.
- **Drawers:** una sola columna, jerarquía vertical, acciones sticky, sin campos comprimidos.

## Responsive

Una sola estructura que se adapta. Desktop: varias columnas, secciones lado a lado, campos compactos, navegación lateral. Tablet: menos columnas. Mobile: una columna; campos relacionados muy pequeños pueden compartir fila cuando sea cómodo (Código país | Teléfono), sin filas con demasiados controles. Al colapsar a una columna, el orden sigue la lógica de lectura, no el orden visual de columnas.

## Densidad

compact; comfortable; spacious. Afecta altura de campos, spacing y separación entre secciones. No afecta accesibilidad ni targets táctiles.

## Campos específicos

- **Pequeños** (temperatura, edad, porcentaje, unidades): sin inputs excesivamente largos. «Temperatura [ 36.5 ] [ °C ]». Compacto en desktop; en móvil amplía target sin ocupar toda la pantalla.
- **Dirección:** no un único input gigante si el dominio necesita partes (calle; número; interior; colonia; código postal; ciudad; estado; país), distribuidas por longitud esperada.
- **Teléfono:** prefijo; número; extensión opcional; formatos internacionales cuando haga falta.
- **Selects con pocas opciones:** considerar radio, segmented control o chips seleccionables (sexo/género, estado simple, Sí/No). No usar Select sólo porque funciona.
- **Checkbox:** selección múltiple o confirmaciones independientes. **Radio:** una sola opción entre pocas y visibles. **Switch:** binarios que se aplican de inmediato (no como sustituto de checkbox cuando se aplica al guardar). **Textarea:** contenido realmente variable o largo; puede crecer hasta un límite antes de scroll interno.
- **Readonly:** no debe parecer disabled; buen contraste y seleccionable cuando corresponda.

## Guardado automático y cambios sin guardar

Autosave en ciertos contextos, comunicando Guardando / Guardado / Error al guardar; no en formularios donde se espera confirmación explícita. Advertir al abandonar con cambios sin guardar.

## Accesibilidad

Todos los campos: labels asociados; teclado; focus visible; comunican errores, required, disabled y readonly; orden de navegación lógico. Agrupación semántica para conjuntos relacionados.

## Estructura visual y estética

No una pila uniforme de inputs: ritmo con secciones, spacing, títulos, descripciones, divisores sólo cuando ayuden, cambios controlados de layout. Jerarquía principalmente por espacio y tipografía, no encerrando cada sección en otra Card.

Estética: minimalista; limpia; moderna; refinada; ligera; clara; adaptable; consistente con el resto del Design System. Evitar: formularios excesivamente densos; todos los inputs a ancho completo; exceso de cards; exceso de divisores; accordions innecesarios; labels flotantes difíciles de leer; formularios largos sin jerarquía.

## Objetivo final

Un sistema que permita diseñar desde formularios pequeños hasta flujos administrativos complejos. El formulario se adapta a la naturaleza de la información: los campos pequeños se sienten pequeños, los grandes reciben espacio, lo relacionado se agrupa, lo opcional se revela progresivamente, los formularios largos se dividen sólo cuando hace falta. Evitar que todo termine siendo una columna infinita de inputs al 100% de ancho.
