# Vocabulario y versionado de Grana

> **Estado:** propuesta para la Fase 0. Este documento convierte palabras ya usadas en el repositorio en reglas públicas; debe aprobarse antes de declararse contrato estable.

## Por qué existe

Una librería pública necesita que la misma palabra signifique lo mismo para quien la usa, quien la mantiene y quien revisa un cambio. En Grana, el contrato, los tokens, las pruebas y la documentación deben usar este vocabulario.

## Vocabulario público

<table header-row="true">
  <tr>
    <td>Término</td>
    <td>Significado</td>
    <td>Consecuencia práctica</td>
  </tr>
  <tr>
    <td>Token</td>
    <td>Una decisión de tema con nombre y propósito: color, espaciado, radio, tipografía o elevación.</td>
    <td>Las aplicaciones personalizan Grana cambiando tokens; los componentes no fijan valores visuales finales.</td>
  </tr>
  <tr>
    <td>Contrato</td>
    <td>Regla verificable que fija una interfaz o un mínimo de calidad.</td>
    <td>Puede definir API, tokens consumidos, accesibilidad, estados o compatibilidad.</td>
  </tr>
  <tr>
    <td>Primitiva</td>
    <td>Pieza de bajo nivel destinada a composición, no necesariamente a resolver una tarea completa de producto.</td>
    <td>Su documentación explica cómo combinarla de forma segura con otros componentes.</td>
  </tr>
  <tr>
    <td>Componente</td>
    <td>Unidad Vue con propósito de interfaz, API, comportamiento y accesibilidad definidos.</td>
    <td>Debe documentar uso, API, estados, teclado y tokens antes de ser estable.</td>
  </tr>
  <tr>
    <td>Variante</td>
    <td>Forma semántica de un mismo componente que no altera su propósito central.</td>
    <td>Se expresa mediante API y tokens; no mediante copias visuales sin contrato.</td>
  </tr>
  <tr>
    <td>Estado</td>
    <td>Situación observable del componente, como foco, carga, error, vacío, selección o deshabilitado.</td>
    <td>Los estados relevantes se prueban y documentan.</td>
  </tr>
  <tr>
    <td>Contrato de accesibilidad</td>
    <td>Comportamiento no negociable para semántica, teclado, foco, contraste y anuncios.</td>
    <td>El tema puede cambiar el look, pero no puede degradar estos mínimos.</td>
  </tr>
</table>

## Madurez de componentes

Grana usa tres niveles de madurez. Un componente muestra su estado junto a su documentación y sus cambios de versión.

<table header-row="true">
  <tr>
    <td>Estado</td>
    <td>Qué significa</td>
    <td>Qué puede cambiar</td>
    <td>Condición para avanzar</td>
  </tr>
  <tr>
    <td>Draft</td>
    <td>Está en exploración o construcción.</td>
    <td>API, tokens, estructura y comportamiento pueden cambiar sin compatibilidad garantizada.</td>
    <td>Contrato, implementación y pruebas iniciales existen.</td>
  </tr>
  <tr>
    <td>Candidate</td>
    <td>Está listo para validación en proyectos reales.</td>
    <td>Puede cambiar, pero cualquier ruptura debe aparecer en changelog.</td>
    <td>Auditoría de tokens, accesibilidad, documentación y ejemplos verificados.</td>
  </tr>
  <tr>
    <td>Stable</td>
    <td>Es parte confiable de la API pública.</td>
    <td>Los cambios incompatibles siguen la política de versionado.</td>
    <td>Uso real validado, pruebas automatizadas y documentación pública completa.</td>
  </tr>
</table>

La progresión es la misma que define el flujo interno: **draft → candidate → stable**. Un componente no se marca como estable por estar terminado visualmente: debe cumplir su contrato.

## Propuesta de versionado

### Paquetes

Cada paquete publicable, como `@grana/vue` y `@grana/cli`, usa [versionado semántico](https://semver.org/lang/es/):

- **Patch** (`0.1.1`): corrección compatible, documentación o mejora interna sin cambiar la API pública.
- **Minor** (`0.2.0`): funcionalidad compatible o un cambio incompatible durante la serie `0.x`, anunciado de forma explícita.
- **Major** (`1.0.0`): primera promesa amplia de estabilidad; después, cualquier cambio incompatible requiere una nueva versión major.

Mientras Grana esté en pre-alfa, las publicaciones de prueba usan el formato `0.1.0-alpha.N`. La etiqueta `alpha` comunica que ninguna API está garantizada todavía.

### Componentes

El estado de madurez no sustituye el versionado del paquete:

- Un componente **draft** puede cambiar incluso en un patch o prerelease, porque no tiene garantía pública.
- Un componente **candidate** puede cambiar con nota de migración.
- Un componente **stable** sólo puede tener cambios incompatibles siguiendo la política SemVer del paquete y con guía de migración.

### Tokens y contratos

Un cambio es incompatible cuando elimina o cambia el significado de:

- una prop, evento, slot o modelo público;
- un token documentado;
- una regla de accesibilidad publicada;
- una convención del CLI que una aplicación pueda automatizar.

En ese caso, el cambio debe incluir:

1. una entrada de changelog;
2. una nota de migración;
3. la versión correspondiente;
4. actualización de la documentación y de los ejemplos afectados.

## Registro de cambios

Cada release público debe incluir:

- paquetes y versiones;
- componentes añadidos, promovidos o deprecados;
- cambios incompatibles y ruta de migración;
- cambios en tokens, validación o accesibilidad;
- enlaces a las páginas de documentación afectadas.

## Qué falta decidir

Antes de congelar esta propuesta se requiere decisión de producto sobre:

- el criterio exacto para pasar de `0.x` a `1.0.0`;
- si todos los paquetes se publicarán de forma sincronizada o tendrán versiones independientes;
- el canal inicial de publicación: sólo prerelease, `next` o una primera versión pública `0.1.0`.

Hasta entonces, esta página sirve como lenguaje compartido y guía de documentación, no como promesa de compatibilidad definitiva.
