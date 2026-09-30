# @grana/cli · pendiente

**Dueño:** bruno (Flujo A). Implementa `docs/contract/tokens.md`.

```bash
npx @grana/cli theme grana.config.json   # escribe tokens.css
```

Responsabilidades:

1. Leer la configuración (9 claves opcionales, contrato §1) y rechazar claves desconocidas.
2. Derivar color en OKLCH y calcular contrastes WCAG (contrato §2).
3. Derivar radios, espaciado y tipografía (§3–§5).
4. Rechazar temas que rompan los mínimos de accesibilidad (§7), explicando cuál y por qué.
5. Escribir `tokens.css` **sin capa**, con bloque claro y oscuro.
6. Generar el propio `defaults.css` de `@grana/vue` a partir de la configuración por defecto de coco.
