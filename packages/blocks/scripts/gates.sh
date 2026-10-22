#!/usr/bin/env bash
# Compuertas de @grana/blocks (dueño: bruno; design/contracts/blocks/_comun.md §9, #763, #793, #807, #815).
# Comprueban el código y el build ya hecho (packages/blocks/dist): lo que DEBE estar y lo que NO debe estar.
# Uso: bash packages/blocks/scripts/gates.sh   (tras `npm run build -w @grana/blocks`); también lo llama
#      .github/scripts/gates.sh. Sale con 1 si falla alguna. Formato de línea: «ok     …» o «FALLA  …».
set -u
cd "$(dirname "${BASH_SOURCE[0]}")/.."

total=0
failed=0
check() { # check "<compuerta>" "<por qué falla>" <orden…>: pasa si la orden sale con 0
  local gate="$1" why="$2"; shift 2
  total=$((total + 1))
  if "$@" >/dev/null 2>&1; then echo "ok     $gate"; else failed=$((failed + 1)); echo "FALLA  $gate"; echo "       -> $why"; fi
}
none() { ! "$@"; } # niega una orden (para las compuertas de «no debe estar»)

# Bloques estructurales: cero CSS, cero <style>, cero utilidades (#763, #807, #814)
check "ningún .css/.scss bajo src/blocks/Gb*" "Un bloque estructural no lleva CSS: lo que falte es un hallazgo para lima (#763)" \
  none bash -c "find src/blocks -path '*/Gb*' \\( -name '*.css' -o -name '*.scss' \\) | grep -q ."
check "ningún <style> en src/blocks/Gb*/*.vue" "Un bloque estructural no lleva <style> (#763)" \
  none bash -c "grep -l '<style' src/blocks/Gb*/*.vue"
check "sin utilidades en src/blocks/Gb*/*.vue" "Los bloques no usan clases utilitarias: la hoja es opcional (#807)" \
  none grep -qE 'class="[^"]*\bg-(m|p)[tbsexy]?-[0-9]|\bg-(text|font|gap|flex|grid|block|hidden|w-|h-|items|justify|self|grow|shrink|truncate|radius|sr-only)' src/blocks/Gb*/*.vue
# Entrada de Marketing (#815)
check "dist/marketing.js y dist/marketing.d.ts existen" "No se generó la entrada de Marketing (vite.config.js, scripts/build-types.mjs)" \
  test -f dist/marketing.js -a -f dist/marketing.d.ts
check "! grep -q createApp dist/marketing.js" "Vue quedó empaquetado en marketing.js (debe ser externo)" none grep -q "createApp" dist/marketing.js
check "! grep -q __shared dist/marketing.js" "Un bloque usa __shared de @grana/vue: solo API pública (#792)" none grep -q "__shared" dist/marketing.js
check "sin clases internas de componentes en dist/marketing.js" "Un bloque nombra una clase interna (.g-x__y) de lo que compone (#792)" none grep -qE "g-[a-z-]+__[a-z]" dist/marketing.js
check "sin .css en dist/marketing.js" "La entrada de Marketing importa una hoja de estilo (no hay CSS, #815)" none grep -q "\.css" dist/marketing.js
# Gestión no paga Marketing y no crece (#793)
check "! grep -q GbHero01 dist/blocks.js" "Gestión arrastra Marketing (#815)" none grep -q "GbHero01" dist/blocks.js
check "dist/blocks.js ≤ 8 KiB gzip" "blocks.js supera el tope de #793 (8192 B gzip)" bash -c "[ \$(gzip -c dist/blocks.js | wc -c) -le 8192 ]"
# Peso de Marketing (#844): el conjunto y cada variante importada sola
check "dist/marketing.js ≤ 18 432 B gzip" "marketing.js supera el tope de #844 (18432 B gzip -c); con más, vuelve a lima" \
  bash -c "[ \$(gzip -c dist/marketing.js | wc -c) -le 18432 ]"
check "cada variante de Marketing importada sola ≤ 4 096 B gzip" "Una variante arrastra a las demás o supera el tope de #844 (scripts/measure-partial.mjs lista cuál)" \
  node scripts/measure-partial.mjs 4096
check "bundle.cap: 18432 en los nueve meta.json" "Falta bundle.cap o difiere del tope de #844" \
  none bash -c "for f in src/blocks/Gb*/Gb*.meta.json; do grep -q '\"cap\": 18432' \$f || echo \$f; done | grep -q ."

echo
if [ "$failed" -eq 0 ]; then echo "Compuertas de blocks: $total/$total superadas."; exit 0; fi
echo "Compuertas de blocks: $failed de $total fallaron."
exit 1
