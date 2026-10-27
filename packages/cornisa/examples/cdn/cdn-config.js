/* Configuración compartida por los ejemplos CDN.
 * cornisa AÚN NO ESTÁ PUBLICADO en npm: las URLs de jsDelivr/unpkg dan 404 hoy (comprobado el 2026-10-26).
 * Por eso cada ejemplo intenta el CDN y, si falla, usa la copia local de ../../dist/ y lo indica en pantalla.
 * Cuando se publique la versión, estos ejemplos funcionarán desde el CDN sin cambios. */
window.CORNISA_CDN = {
  version: '0.2.0-alpha.0',
  // Elige una: jsDelivr (por defecto) o unpkg
  base: 'https://cdn.jsdelivr.net/npm/cornisa@0.2.0-alpha.0/dist/',
  // base: 'https://unpkg.com/cornisa@0.2.0-alpha.0/dist/',
  local: '../../dist/',
};
/** Respaldo del CSS: copia local SIN integrity ni crossorigin (con file:// cualquier petición CORS se bloquea). */
window.cornisaCssFallback = function (link) {
  link.onerror = null;
  link.removeAttribute('integrity');
  link.removeAttribute('crossorigin');
  link.href = window.CORNISA_CDN.local + 'cornisa.min.css';
};
/** Último recurso para los ejemplos ESM: el build clásico (window.Cornisa) sí funciona abierto como file://. */
window.cornisaClassicFallback = function () {
  return new Promise(function (resolve, reject) {
    if (window.Cornisa) return resolve(window.Cornisa);
    var s = document.createElement('script');
    s.src = window.CORNISA_CDN.local + 'cornisa.iife.min.js';
    s.onload = function () { resolve(window.Cornisa); };
    s.onerror = reject;
    document.head.appendChild(s);
  });
};
/** Muestra en la página de dónde se cargó la librería. */
window.cornisaOrigin = function (origin) {
  var el = document.getElementById('origen');
  if (!el) return;
  el.dataset.origin = origin;
  var file = location.protocol === 'file:';
  el.textContent = origin === 'cdn'
    ? 'Cargado desde el CDN (' + window.CORNISA_CDN.base + ')'
    : origin === 'local-script'
      ? 'CDN no disponible y los módulos ES no cargan desde file:// → respaldo con el script clásico local. Para probar el módulo de verdad, sirve la carpeta por HTTP (p. ej. python3 -m http.server).'
      : 'CDN no disponible (el paquete aún no está publicado) → respaldo local ' + window.CORNISA_CDN.local + (file ? ' (abierto como file://)' : '');
};
