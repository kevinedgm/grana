# Requisitos y compatibilidad

> **Estado:** `pre-alpha` · **Paquetes:** `aún no publicados` · **Versión actual:** `0.0.0`

## Requisitos verificados

| Dependencia | Requisito | Por qué |
| --- | --- | --- |
| Vue | `^3.5.0` | `@grana/vue` usa Vue 3 como peer dependency. |
| Node.js | 20 o superior | Necesario para ejecutar `@grana/cli`. |
| npm | El incluido con Node 20 | Es el gestor utilizado por el monorepo. |

## Integración recomendada

La ruta principal es una aplicación **Vue 3 creada con Vite**. Vite no es una dependencia de producción de `@grana/vue`; es el entorno recomendado para aplicaciones modernas, TypeScript, PWA y builds de producción.

Sigue el [Quick Start con Vue 3 y Vite](quick-start.md).

## Paquetes

| Paquete | Instalación futura | Responsabilidad |
| --- | --- | --- |
| `@grana/vue` | `npm install @grana/vue` | Componentes Vue, plugin y estilos base. |
| `@grana/cli` | `npm install -D @grana/cli` | Generación y validación de tokens CSS. |

## Navegadores

La matriz de navegadores todavía no está certificada públicamente. No declares soporte para una versión concreta basándote sólo en Grana hasta que se publique esa matriz.

La primera certificación debe incluir Chrome, Edge, Firefox y Safari actuales; teclado, foco visible, claro, oscuro, `prefers-reduced-motion` y área táctil en `pointer: coarse`.

## Entornos fuera del alcance inicial

- **Vue 2:** no es compatible.
- **CDN sin build:** se documentará como alternativa después de la publicación, no como onboarding principal.
- **React, Angular, Svelte y otros frameworks:** no son compatibles con `@grana/vue`.
- **SSR:** requiere verificación y documentación antes de declararse soportado.

## Al reportar un problema de compatibilidad

Incluye la versión de Vue, Node, gestor de paquetes, entorno de build, navegador, sistema operativo, componente afectado y pasos mínimos para reproducirlo.
