#!/usr/bin/env bash
# Compuertas de verificación de Grana (CLAUDE.md, «Verificación antes de cada commit»).
# Comprueban el build ya hecho (packages/vue/dist): lo que DEBE estar y lo que NO debe estar.
# Se ejecutan todas y se informa de cada fallo (con anotación de GitHub); sale con 1 si falla alguna.
#
# Uso:   bash .github/scripts/gates.sh            (desde la raíz del repositorio, tras `npm run build`)
#        GRANA_DIST=otra/ruta bash .github/scripts/gates.sh
# Para añadir una compuerta: una línea en `must_have`, `must_not_have` o `must_exist`.
set -u

cd "$(dirname "${BASH_SOURCE[0]}")/../.."
DIST="${GRANA_DIST:-packages/vue/dist}"

total=0
failed=0
CI_ANNOTATE="${GITHUB_ACTIONS:-}"

fail() { # fail "<compuerta>" "<qué significa>"
  failed=$((failed + 1))
  echo "FALLA  $1"
  echo "       -> $2"
  if [ -n "$CI_ANNOTATE" ]; then
    echo "::error title=Compuerta fallida::$1. $2"
  fi
}
pass() { echo "ok     $1"; }

# must_have <archivo> <patrón> <por qué debe estar>
must_have() {
  total=$((total + 1))
  local file="$DIST/$1" gate="grep -q \"$2\" $DIST/$1"
  if [ ! -f "$file" ]; then fail "$gate" "No existe $file (¿falta \`npm run build\`?)"; return; fi
  if grep -q -- "$2" "$file"; then pass "$gate"; else fail "$gate" "$3"; fi
}
# must_not_have <archivo> <patrón> <por qué NO debe estar>
must_not_have() {
  total=$((total + 1))
  local file="$DIST/$1" gate="! grep -q \"$2\" $DIST/$1"
  if [ ! -f "$file" ]; then fail "$gate" "No existe $file (¿falta \`npm run build\`?)"; return; fi
  if grep -q -- "$2" "$file"; then fail "$gate" "$3"; else pass "$gate"; fi
}
# must_exist <archivo> <por qué debe existir>
must_exist() {
  total=$((total + 1))
  local gate="test -f $DIST/$1"
  if [ -f "$DIST/$1" ]; then pass "$gate"; else fail "$gate" "$2"; fi
}

echo "== Compuertas sobre $DIST =="

# --- Estilos registrados en grana.css (lo que debe estar) ---------------------------------------
CSS_MSG="El estilo del componente no quedó registrado en grana.css (¿falta en components.css?)"
for cls in \
  g-btn--variant-soft g-input-group__part g-card--media-background g-toast--type-error \
  g-divider--labeled g-icon--flip-rtl g-form-section__lead g-speech-panel__privacy \
  g-transcript__orig g-radio-group__segment g-form-reveal__body g-form-section__panel \
  g-avatar--shape-square g-reject-shake g-menu__highlight g-number-field \
  g-status-island__shape g-summary__more g-adaptive-layout g-file-field__chip \
  g-tooltip__tab g-time-field__reading g-combobox__sentence g-combobox__trace g-combobox__ghost \
  g-slider__pill
do
  must_have grana.css "$cls" "$CSS_MSG"
done
# GBreadcrumbs (#490): en el paquete principal (+6,3 KB gzip, bajo el tope de 8 KB)
for cls in g-breadcrumbs__door g-breadcrumbs__stairs; do
  must_have grana.css "$cls" "$CSS_MSG"
done
# GAccordion + GAccordionItem (#476): en el paquete principal (+5,7 KB gzip, bajo el tope de 8 KB)
must_have grana.css "g-accordion-item__peek" "$CSS_MSG"
must_have grana.js "g-accordion-item" "GAccordionItem no está en el paquete principal grana.js (#476: va en el principal)"

# --- Lo que NO debe estar -----------------------------------------------------------------------
must_not_have grana.css "data:font" "La fuente quedó incrustada en base64 en grana.css (Vite incrusta todo recurso que el CSS referencie; debe copiarla scripts/build-fonts.mjs)"
must_not_have grana.umd.js "createApp" "Vue quedó empaquetado en grana.umd.js (debe estar externalizado: external: ['vue'])"
# Las entradas propias no viajan en el paquete principal (#238, #328, #337 y siguientes)
for sym in createSpeech createTranscript createStatus GCombobox GFileField GTimeField GSlider; do
  must_not_have grana.js "$sym" "$sym viajó en el paquete principal grana.js; debe vivir solo en su entrada propia"
done
must_not_have combobox.js "g-summary__" "GSummary quedó copiado en combobox.js; debe llegar por __shared sin copia"

# --- Entradas propias generadas -----------------------------------------------------------------
for entry in speech status combobox file-field time-field slider; do
  must_exist "$entry.js" "No se generó la entrada propia $entry.js (revisar vite.$entry.config.js y el script build de packages/vue)"
done

echo
if [ "$failed" -eq 0 ]; then
  echo "Compuertas: $total/$total superadas."
  exit 0
fi
echo "Compuertas: $failed de $total fallaron (arriba, las líneas FALLA)."
exit 1
