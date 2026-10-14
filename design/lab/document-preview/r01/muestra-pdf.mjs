// Genera muestra.pdf (3 páginas, Helvetica, sin dependencias) para la demo del renderizador nativo del prototipo de kiwi.
// Ejecutar: node design/lab/document-preview/r01/muestra-pdf.mjs
import { writeFileSync } from 'node:fs'
const pages = [1, 2, 3].map((n) => [
  'BT /F1 22 Tf 72 740 Td (Contrato de prestacion de servicios) Tj ET',
  `BT /F1 12 Tf 72 712 Td (Muestra de Grana para el visor de documentos - pagina ${n} de 3) Tj ET`,
  ...Array.from({ length: 22 }, (_, i) => `BT /F1 11 Tf 72 ${670 - i * 24} Td (Clausula ${n}.${i + 1}. Texto de ejemplo que ocupa una linea completa del documento.) Tj ET`),
  `BT /F1 10 Tf 290 40 Td (${n} / 3) Tj ET`
].join('\n'))
const objs = []
objs.push('<< /Type /Catalog /Pages 2 0 R >>')
objs.push(`<< /Type /Pages /Kids [${pages.map((_, i) => `${4 + i * 2} 0 R`).join(' ')}] /Count ${pages.length} >>`)
objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
pages.forEach((c, i) => {
  objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${5 + i * 2} 0 R >>`)
  objs.push(`<< /Length ${Buffer.byteLength(c)} >>\nstream\n${c}\nendstream`)
})
let out = '%PDF-1.4\n'
const offs = []
objs.forEach((o, i) => { offs.push(Buffer.byteLength(out)); out += `${i + 1} 0 obj\n${o}\nendobj\n` })
const xref = Buffer.byteLength(out)
out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('')
out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
writeFileSync(new URL('./muestra.pdf', import.meta.url), out)
console.log('muestra.pdf', Buffer.byteLength(out), 'B')
