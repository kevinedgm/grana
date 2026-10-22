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
  g-status-island__shape g-status-island__peek g-summary__more g-adaptive-layout g-file-field__chip \
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
# GTag + GTagGroup (tag.md §«Paquete», #472): la huella y el racimo
for cls in g-tag__undo g-tag-group__facet; do
  must_have grana.css "$cls" "$CSS_MSG"
done
# GEmpty (principal) y GLoadRegion (entrada propia, CSS en grana.css; #530): la cuenta de la salida y la píldora de B.
# (#530 nombra g-empty__relax, pero GEmpty.css no tiene regla para esa clase —es solo marcado—: la señal es __count)
for cls in g-empty__count g-load-region__pill; do
  must_have grana.css "$cls" "$CSS_MSG"
done

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

# GTag + GTagGroup: entrada propia `@grana/vue/tag` (#472)
must_not_have grana.js "GTagGroup" "GTagGroup viajó en el paquete principal grana.js; debe vivir solo en su entrada propia tag.js"
must_exist "tag.js" "No se generó la entrada propia tag.js (revisar vite.tag.config.js y el script build de packages/vue)"

# GLoadRegion: entrada propia `@grana/vue/load-region` (#530); GEmpty, el motor y el canal llegan por __shared, sin copia
must_not_have grana.js "GLoadRegion" "GLoadRegion viajó en el paquete principal grana.js; debe vivir solo en su entrada propia load-region.js"
must_exist "load-region.js" "No se generó la entrada propia load-region.js (revisar vite.load-region.config.js y el script build de packages/vue)"
must_not_have load-region.js "g-empty__" "GEmpty quedó copiado en load-region.js; debe llegar por __shared sin copia"

# GFormFold: entrada propia `@grana/vue/form-fold` (#590); el motor de formulario, las claves y el plegado llegan por
# __shared, sin copia (sus Symbol deben ser los del principal). GDialogStep y la llegada van en el principal
must_have grana.css "g-form-fold__body" "$CSS_MSG"
must_have grana.css "data-g-landed" "$CSS_MSG"
must_have grana.js "GDialogStep" "GDialogStep no está en el paquete principal grana.js (#590: el modo pasos va con GDialog)"
must_not_have grana.js "g-form-fold__" "GFormFold (sus clases BEM __*) viajó en el paquete principal grana.js; debe vivir solo en su entrada propia form-fold.js"
must_exist "form-fold.js" "No se generó la entrada propia form-fold.js (revisar vite.form-fold.config.js y el script build de packages/vue)"
must_not_have form-fold.js "Symbol(\"GForm\")" "formContext.js quedó copiado en form-fold.js; sus claves deben llegar por __shared"

# GCardGroup: entrada propia `@grana/vue/card-group` (#610); GCard sigue en el principal y la clave del contexto llega por
# __shared, sin copia (g-card__selectbox es marcado propio de GCard.vue que el grupo no escribe)
must_have grana.css "g-card-group__bridge" "$CSS_MSG"
must_not_have grana.js "GCardGroup" "GCardGroup viajó en el paquete principal grana.js; debe vivir solo en su entrada propia card-group.js"
must_exist "card-group.js" "No se generó la entrada propia card-group.js (revisar vite.card-group.config.js y el script build de packages/vue)"
must_not_have card-group.js "g-card__selectbox" "GCard quedó copiado en card-group.js; debe llegar por el paquete principal, sin copia"

# GPageHeader: entrada propia `@grana/vue/page-header` (#633); el registro de reservas de borde (edgeReserve) llega por
# __shared, sin copia: una sola instancia por documento para que la isla y los avisos vean el zócalo y el muelle
must_have grana.css "g-page-header__base" "$CSS_MSG"
must_not_have grana.js "GPageHeader" "GPageHeader viajó en el paquete principal grana.js; debe vivir solo en su entrada propia page-header.js"
must_exist "page-header.js" "No se generó la entrada propia page-header.js (revisar vite.page-header.config.js y el script build de packages/vue)"

# GFab: entrada propia `@grana/vue/fab` (#656); GBtn, GTooltip, el motor de menú (menuNav, compartido con GMenu, #657) y
# el registro de reservas de borde llegan por __shared, sin copia (uno por documento: los avisos quedan más allá del FAB)
must_have grana.css "g-fab" "$CSS_MSG"
must_have grana.css "g-fab__item" "$CSS_MSG"
must_not_have grana.js "GFab" "GFab viajó en el paquete principal grana.js; debe vivir solo en su entrada propia fab.js"
must_exist "fab.js" "No se generó la entrada propia fab.js (revisar vite.fab.config.js y el script build de packages/vue)"
must_not_have fab.js "is-highlight-instant" "El motor de menú (utils/menuNav.js) quedó copiado en fab.js; debe llegar por __shared sin copia"

# GStack y GSection (principal, #723; peso conjunto <= 1,5 KiB (1536 B) gzip en grana.js, #746 (medido +1381 B); la compuerta no mide peso, solo presencia): el CSS va en grana.css
must_have grana.css "g-stack--divided" "$CSS_MSG"
must_have grana.css "g-section__title" "$CSS_MSG"
must_have grana.css "g-section__actions" "$CSS_MSG"

# GAppShell (entrada propia @grana/vue/app-shell, #716; tope 4 KiB gzip): el CSS en grana.css, el código fuera del principal
must_have grana.css "g-app-shell__skip" "$CSS_MSG"
must_have grana.css "g-app-shell__frame" "$CSS_MSG"
must_not_have grana.js "GAppShell" "GAppShell viajó en el paquete principal grana.js; debe ir solo en la entrada app-shell.js (#716)"
must_exist "app-shell.js" "No se generó la entrada propia app-shell.js (revisar vite.app-shell.config.js y el script build de packages/vue)"
must_not_have app-shell.js "new WeakMap" "El registro de bordes (utils/edgeReserve.js) quedó copiado en app-shell.js; debe llegar por __shared sin copia"

# GContainer (principal, #723; <= 1 KiB gzip en grana.js, medido en el commit)
must_have grana.css "g-container__body" "$CSS_MSG"
must_have grana.css "g-container--width-reading" "$CSS_MSG"

# Marketing (#742): tres entradas propias con tope (hero 4 KiB, gallery 12 KiB, booking 14 KiB gzip); el CSS en grana.css
must_have grana.css "g-hero__media" "$CSS_MSG"
must_have grana.css "g-hero__frame" "$CSS_MSG"
must_not_have grana.js "GHero" "GHero viajó en el paquete principal grana.js; debe ir solo en la entrada hero.js (#742)"
must_exist "hero.js" "No se generó la entrada propia hero.js (revisar vite.hero.config.js y el script build de packages/vue)"
must_have grana.css "g-gallery-viewer__stage" "$CSS_MSG"
must_have grana.css "g-dialog--bare" "$CSS_MSG"
must_not_have grana.js "GGallery" "GGallery viajó en el paquete principal grana.js; debe ir solo en la entrada gallery.js (#742)"
must_exist "gallery.js" "No se generó la entrada propia gallery.js (revisar vite.gallery.config.js y el script build de packages/vue)"
must_have grana.css "g-booking-bar__phrase" "$CSS_MSG"
must_have grana.css "g-party-field__panel" "$CSS_MSG"
must_have grana.css "is-checkout-only" "$CSS_MSG"
must_not_have grana.js "GBookingBar" "GBookingBar viajó en el paquete principal grana.js; debe ir solo en la entrada booking.js (#742)"
must_not_have grana.js "GPartyField" "GPartyField viajó en el paquete principal grana.js; debe ir solo en la entrada booking.js (#742)"
must_exist "booking.js" "No se generó la entrada propia booking.js (revisar vite.booking.config.js y el script build de packages/vue)"
must_not_have booking.js "new WeakMap" "El registro de bordes (utils/edgeReserve.js) quedó copiado en booking.js; debe llegar por __shared sin copia (EDGE_ORDER.bookingDock)"
# Moneda y precio (#776): entrada propia price.js (tope 6 KiB gzip); utils/currency.js y la tabla de símbolos en el principal
must_have grana.css "g-price__spoken" "$CSS_MSG"
must_have grana.css "g-price-scope__legend" "$CSS_MSG"
must_have grana.css "g-datepicker--day-content" "$CSS_MSG"
must_not_have grana.js "GPriceScope" "GPriceScope viajó en el paquete principal grana.js; debe ir solo en la entrada price.js (#776)"
must_not_have grana.js "formatPrice" "formatPrice viajó en el paquete principal grana.js; se exporta solo desde @grana/vue/price (#776)"
must_exist "price.js" "No se generó la entrada propia price.js (revisar vite.price.config.js y el script build de packages/vue)"
must_not_have grana.js "supportedValuesOf" "La tabla de símbolos se calcula en el navegador; debe venir generada en el build (scripts/currency-symbols.mjs, #770)"
must_not_have price.js "supportedValuesOf" "La tabla de símbolos se calcula en el navegador; debe venir generada en el build (scripts/currency-symbols.mjs, #770)"
must_not_have price.js "\"Rs\"" "La tabla de símbolos quedó copiada en price.js; debe llegar por __shared desde utils/currency.js (#776)"

echo
if [ "$failed" -eq 0 ]; then
  echo "Compuertas: $total/$total superadas."
  exit 0
fi
echo "Compuertas: $failed de $total fallaron (arriba, las líneas FALLA)."
exit 1
