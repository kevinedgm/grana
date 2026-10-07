## Qué cambia

<!-- Una o dos frases. Un PR, un tema. -->

## Por qué

<!-- El problema, el issue (#...) o la decisión (#NNN de DECISIONS.md) que lo motiva. -->

## Qué toca

- [ ] Componente (`*.vue`, CSS, pruebas, `meta.json`): indica cuál
- [ ] Tema o tokens (`defaults.css`, `docs/contract/`, `@grana/cli`)
- [ ] Documentación (README, contratos, `CHANGELOG.md`)
- [ ] Otro:

## Cómo lo verifiqué

<!-- Qué corriste y en qué motores. Una corrección pequeña: el archivo afectado, y confirma que fallaba antes y pasa después. -->

- [ ] `npm test`
- [ ] `npm run build` y las compuertas `grep` de `CONTRIBUTING.md`
- [ ] `node packages/vue/scripts/check-icons.mjs` (si tocas iconos)
- [ ] Pruebas de navegador en Chromium, Firefox y WebKit (si cambia comportamiento o aspecto): indica cuáles

## Qué NO verifiqué

<!-- Lector de pantalla, Safari real, táctil, forced-colors, otros motores… Sé explícito. -->

## Reglas que no se rompen

- [ ] Los componentes solo leen `var(--g-*)` o `var(--_*)`: sin valores de respaldo ni literales de tema
- [ ] Sin `<style>` en el `.vue`, sin `fetch` ni globals de la aplicación
- [ ] Iconos solo de Lucide (sin caracteres como icono ni pictogramas dibujados con CSS)
- [ ] Mínimos de accesibilidad intactos (área táctil, texto ≥ 12 px, contraste, foco visible)
- [ ] Respeto «un archivo, un dueño» (`AGENTS.md`): los archivos de otro rol los dejo a su dueño, o lo explico arriba
- [ ] No contradigo una decisión de `DECISIONS.md` (o cito su número y explico qué cambió)
