// El banco de GbFooter (src/blocks/GbFooter/footer.bank.js) pone GbNewsletter01 en el slot `subscribe` importando su .vue,
// que el navegador no sabe cargar. footer.html remite esa URL aquí con su importmap: la variante REAL de dist/marketing.js.
export { GbNewsletter01 as default } from '@grana/blocks/marketing'
