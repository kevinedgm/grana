// Servidor estático mínimo para las verificaciones del tooltip (kiwi). GRANA_PW_PORT, por defecto 4212.
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
export const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
export const PORT = Number(process.env.GRANA_PW_PORT || 4212)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json' }
export async function serve() {
  const server = http.createServer(async (req, res) => {
    try {
      let path = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
      if (!path.startsWith(ROOT)) throw new Error('fuera')
      if (path.endsWith('/')) path += 'index.html'
      const body = await readFile(path)
      res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream', 'cache-control': 'no-store' }).end(body)
    } catch { if (!res.headersSent) res.writeHead(404).end() }
  })
  await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
  return { server, base: `http://127.0.0.1:${PORT}/design/lab/tooltip` }
}
export const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
// Ver a mano: node design/lab/tooltip/serve.mjs --keep  →  http://127.0.0.1:4212/design/lab/tooltip/r01/
if (process.argv.includes('--keep')) { const { base } = await serve(); console.log(base + '/r01/  ·  ' + base + '/r02/') }
