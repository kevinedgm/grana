#!/usr/bin/env bash
# Compuertas de @grana/blocks (dueño: bruno; design/contracts/blocks/_comun.md §9 y §21, #763, #793, #807, #815, #860).
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
check "sin utilidades en src/blocks/Gb*/*.vue" "Los bloques no usan clases utilitarias: la hoja es opcional (#807; g-text y g-text--* son de GText, #856)" \
  none grep -qE 'class="[^"]*\bg-(m|p)[tbsexy]?-[0-9]|\bg-text-[a-z]|\bg-(font|gap|flex|grid|block|hidden|w-|h-|items|justify|self|grow|shrink|truncate|radius|sr-only)' src/blocks/Gb*/*.vue
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
check "dist/marketing.js con sus trozos ≤ 18 432 B gzip" "marketing.js (con el trozo compartido de common/) supera el tope de #844 (18432 B gzip -c); con más, vuelve a lima" \
  node scripts/measure-entry.mjs marketing 18432
check "cada variante de Marketing importada sola ≤ 4 096 B gzip" "Una variante arrastra a las demás o supera el tope de #844 (scripts/measure-partial.mjs lista cuál)" \
  node scripts/measure-partial.mjs 4096
check "bundle.cap: 18432 en los meta.json de Marketing" "Falta bundle.cap o difiere del tope de #844" \
  none bash -c "for f in \$(grep -l '\"family\": \"marketing\"' src/blocks/Gb*/Gb*.meta.json); do grep -q '\"cap\": 18432' \$f || echo \$f; done | grep -q ."
# Entrada de Booking (_comun.md §19 y §21, #860): externos, sin Marketing ni Gestión dentro, y Marketing no paga Booking
check "dist/booking.js y dist/booking.d.ts existen" "No se generó la entrada de Booking (vite.config.js, scripts/build-types.mjs)" \
  test -f dist/booking.js -a -f dist/booking.d.ts
check "! grep -q createApp dist/booking.js" "Vue quedó empaquetado en booking.js (debe ser externo)" none grep -q "createApp" dist/booking.js
check "! grep -q __shared dist/booking.js" "Un bloque usa __shared de @grana/vue: solo API pública (#792)" none grep -q "__shared" dist/booking.js
check "sin clases internas de componentes en dist/booking.js" "Un bloque nombra una clase interna (.g-x__y) de lo que compone (#792)" none grep -qE "g-[a-z-]+__[a-z]" dist/booking.js
check "sin .css en dist/booking.js" "La entrada de Booking importa una hoja de estilo (no hay CSS)" none grep -q "\.css" dist/booking.js
check "! grep -q GbHero01 dist/booking.js" "Booking arrastra Marketing (#860)" none grep -q "GbHero01" dist/booking.js
check "! grep -q GbOfferList01 dist/marketing.js" "Marketing arrastra Booking (#860)" none grep -q "GbOfferList01" dist/marketing.js
check "! grep -q GbOfferList01 dist/blocks.js" "Gestión arrastra Booking (#860)" none grep -q "GbOfferList01" dist/blocks.js
check "sin fetch ni XMLHttpRequest en dist/booking.js" "Un bloque hace red (#780, #792)" none grep -qE "fetch\(|XMLHttpRequest" dist/booking.js
# Peso de Booking (#886, #887): la entrada con su trozo compartido y cada variante importada sola
check "dist/booking.js con sus trozos ≤ 37 888 B gzip" "booking.js (con el trozo compartido de common/) supera el tope de #886 (37888 B gzip -c); con más, vuelve a lima" \
  node scripts/measure-entry.mjs booking 37888
check "cada variante de Booking importada sola ≤ 5 120 B gzip (Guest form ≤ 7 168 B)" "Una variante arrastra a las demás o supera el tope de #887 (scripts/measure-partial.mjs lista cuál)" \
  node scripts/measure-partial.mjs 5120 booking GbGuestForm=7168
check "bundle.cap en los meta.json de Booking (37888; variante 5120, Guest form 7168)" "Falta bundle.cap/variantCap o difiere de los topes de #886 y #887" \
  none bash -c "for f in \$(grep -l '\"family\": \"booking\"' src/blocks/Gb*/Gb*.meta.json); do v=5120; case \$f in *GbGuestForm*) v=7168;; esac; grep -q '\"cap\": 37888' \$f && grep -q \"\\\"variantCap\\\": \$v\" \$f || echo \$f; done | grep -q ."

echo
if [ "$failed" -eq 0 ]; then echo "Compuertas de blocks: $total/$total superadas."; exit 0; fi
echo "Compuertas de blocks: $failed de $total fallaron."
exit 1
