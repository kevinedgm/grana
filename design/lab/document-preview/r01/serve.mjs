// Servidor estático mínimo para la verificación del visor de documentos (kiwi r01). Puerto 4219 (GRANA_PW_PORT lo cambia).
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
export const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))
export const PORT = Number(process.env.GRANA_PW_PORT || 4219)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json', '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.png': 'image/png' }
export async function serve() {
  const server = http.createServer(async (req, res) => {
    try {
      const path = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
      if (!path.startsWith(ROOT)) throw new Error('fuera')
      const body = await readFile(path)
      res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }).end(body)
    } catch { if (!res.headersSent) res.writeHead(404).end() }
  })
  await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
  return { server, base: `http://127.0.0.1:${PORT}/design/lab/document-preview/r01` }
}
export const pw = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
// node serve.mjs --keep  → deja el servidor abierto para mirar el prototipo a mano
if (process.argv.includes('--keep')) { const { base } = await serve(); console.log(base + '/index.html') }
