# Política de seguridad

## Versiones con soporte

Grana está en **beta** (`0.1.0-beta`). Solo se corrigen vulnerabilidades en la **última versión publicada**; no hay ramas de mantenimiento.

| Versión | Soporte de seguridad |
| --- | --- |
| `0.1.0-beta` (la última publicada) | Sí |
| Cualquier versión anterior | No |

## Cómo reportar una vulnerabilidad

**No abras un issue público ni un pull request con los detalles.** Usa el reporte privado de GitHub (*Security Advisories*) del repositorio:

1. Ve a <https://github.com/kevinedgm/grana/security/advisories/new> (o a la pestaña **Security** del repositorio, «Report a vulnerability»).
2. Describe el problema con el mayor detalle posible.

Incluye, si puedes:

- el paquete y la versión afectados (`@grana/vue`, `@grana/cli`) y el componente o la entrada (`@grana/vue/speech`, `status`, `combobox`, `file-field`, `time-field`, `testing`);
- los pasos para reproducirlo o una prueba de concepto mínima;
- el impacto que crees que tiene (qué consigue quien lo explota) y en qué condiciones;
- tu entorno (navegador, Vue, Node si es del CLI).

Recibirás respuesta en el propio aviso privado. El reporte se mantiene confidencial hasta que haya una corrección o un acuerdo sobre cuándo divulgarlo; indica en el aviso si quieres que se te mencione. Grana es un proyecto de código abierto sin equipo de respuesta dedicado: no se promete un plazo, pero cada reporte se revisa.

## Qué se considera una vulnerabilidad

Algunos ejemplos dentro del alcance:

- Inyección de marcado o de código a través de lo que un componente pinta con datos de la aplicación (por ejemplo, el registro de iconos de `createIcons`, que valida las cadenas por su forma y solo admite Lucide, o los textos que los componentes insertan en la página).
- Ejecución de código o escritura de archivos fuera de lo esperado en `@grana/cli` al leer una configuración o generar el tema.
- Fuga de datos desde un servicio de Grana (avisos, voz, estado, subida de archivos) hacia un destino que la aplicación no eligió.

## Qué queda fuera de alcance

- Vulnerabilidades en Vue, `lucide-static`, tu empaquetador o cualquier otra dependencia de tu aplicación: repórtalas a sus proyectos.
- Lo que hagan los **adaptadores que escribe tu aplicación** (el motor de transcripción de voz, la subida de archivos): Grana no hace red por sí misma ni lee globals de la aplicación, y esos adaptadores son tuyos.
- Las herramientas de investigación y los bancos de prueba de `design/lab/`, que no se publican en los paquetes.
- Problemas de accesibilidad, que son errores normales: abre un issue con la plantilla «Error».
