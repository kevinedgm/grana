// Ejemplos CDN (examples/cdn). Toda petición a cdn.jsdelivr.net se intercepta: nunca se usa la red real.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const VERSION = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;
const CDN = `https://cdn.jsdelivr.net/npm/cornisa@${VERSION}/dist/`;
const TYPES = { js: 'text/javascript', css: 'text/css', json: 'application/json' };
const PAGES = ['01-script-clasico.html', '02-modulo-esm.html', '03-import-map.html', '04-casos-de-uso.html'];

async function prepare(page, mode) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    // En modo «sin publicar» el 404 del CDN es esperado; cualquier otro error, no.
    if (m.type() === 'error' && !(mode === 'unpublished' && /404|Failed to load|net::ERR|Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Cross-Origin Request Blocked|integrity attribute/i.test(m.text()))) errors.push(m.text());
  });
  const served = [];
  await page.route('https://cdn.jsdelivr.net/**', async (route) => {
    const url = route.request().url();
    if (mode === 'unpublished' || !url.startsWith(CDN)) return route.fulfill({ status: 404, body: 'Not found', headers: { 'access-control-allow-origin': '*' } });
    const file = url.slice(CDN.length).split('?')[0];
    served.push(file);
    return route.fulfill({ status: 200, body: readFileSync(join(ROOT, 'dist', file)),
      headers: { 'content-type': TYPES[file.split('.').pop()], 'access-control-allow-origin': '*' } });
  });
  return { errors, served };
}

for (const mode of ['unpublished', 'cdn']) {
  for (const file of PAGES) {
    test(`ejemplo ${file} · ${mode === 'cdn' ? 'CDN simulado' : 'sin publicar (respaldo local)'}`, async ({ page }) => {
      const { errors, served } = await prepare(page, mode);
      await page.goto(`/examples/cdn/${file}`);
      await page.waitForFunction(() => window.ready === true, null, { timeout: 10000 });
      await expect(page.locator('#origen')).toHaveAttribute('data-origin', mode === 'cdn' ? 'cdn' : 'local');
      if (mode === 'cdn') {
        expect(served.some((f) => f.endsWith('.js'))).toBe(true);
        expect(served.some((f) => f.endsWith('.css'))).toBe(true);
      }
      // la librería funciona y sus estilos se aplicaron (CSS del CDN o del respaldo)
      const btn = page.locator('[data-caso="aviso"], #b-aviso').first();
      await btn.click();
      await expect(page.locator('.cornisa-title')).toHaveText('Cambios guardados');
      expect(await page.locator('.cornisa').evaluate((n) => getComputedStyle(n).position)).toBe('fixed');
      await expect(page.locator('#origen')).toBeVisible();
      expect(errors, 'sin errores inesperados').toEqual([]);
    });
  }
}

test('01 · el SRI se aplica: un archivo alterado en el CDN se bloquea y se usa el respaldo', async ({ page }) => {
  await page.route('https://cdn.jsdelivr.net/**', (route) => {
    const url = route.request().url();
    const file = url.slice(CDN.length);
    let body = readFileSync(join(ROOT, 'dist', file));
    if (file === 'cornisa.iife.min.js') body = Buffer.concat([body, Buffer.from('\n/* alterado */')]);
    return route.fulfill({ status: 200, body, headers: { 'content-type': TYPES[file.split('.').pop()], 'access-control-allow-origin': '*' } });
  });
  await page.goto('/examples/cdn/01-script-clasico.html');
  await page.waitForFunction(() => window.ready === true, null, { timeout: 10000 });
  await expect(page.locator('#origen')).toHaveAttribute('data-origin', 'local');
});

test('04 · todos los casos de uso se ejecutan sin errores; atajo y tema por tokens', async ({ page }) => {
  const { errors } = await prepare(page, 'cdn');
  await page.goto('/examples/cdn/04-casos-de-uso.html');
  await page.waitForFunction(() => window.ready === true);
  for (const caso of ['aviso', 'progreso', 'promise', 'promise-error', 'temporizador', 'multimedia', 'deshacer', 'error', 'cola', 'largo', 'icono']) {
    await page.click(`[data-caso="${caso}"]`);
    await expect(page.locator('#codigo')).not.toHaveText(/Pulsa un caso/);
    await page.waitForTimeout(150);
  }
  await expect(page.locator('.cornisa-title')).toBeVisible();
  await expect(page.locator('.cornisa-more')).toBeVisible();      // hay cola: +N
  // atajo Alt+Shift+N
  await page.focus('[data-caso="aviso"]');
  await page.keyboard.press('Alt+Shift+KeyN');
  await expect(page.locator('.cornisa-toggle')).toBeFocused();
  await page.keyboard.press('Alt+Shift+KeyN');
  await expect(page.locator('[data-caso="aviso"]')).toBeFocused();
  // tema solo con tokens
  await page.check('#tema');
  expect(await page.locator('.cornisa-shape path').evaluate((n) => getComputedStyle(n).fill)).toBe('rgb(31, 58, 95)');
  await page.click('[data-caso="todo"]');
  await expect.poll(() => page.evaluate(() => window.island._internals.renderer.phase), { timeout: 5000 }).toBe('gone');
  expect(errors).toEqual([]);
});

/* Abierto como file:// (doble clic en el HTML) con el CDN respondiendo 404 text/plain, como jsDelivr hoy.
   Caso real reportado por el usuario: el CSS de respaldo no se aplicaba y 02/03 no arrancaban. */
for (const file of PAGES) {
  test(`file:// · ${file}: funciona con estilos y lo explica`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.route('https://cdn.jsdelivr.net/**', (r) => r.fulfill({ status: 404, contentType: 'text/plain', body: "Couldn't find the requested release version." }));
    await page.goto('file://' + join(ROOT, 'examples', 'cdn', file));
    await page.waitForFunction(() => window.ready === true, null, { timeout: 10000 });
    const origin = await page.locator('#origen').getAttribute('data-origin');
    expect(['local', 'local-script']).toContain(origin);
    if (origin === 'local-script') await expect(page.locator('#origen')).toContainText('file://');
    await page.locator('[data-caso="aviso"], #b-aviso').first().click();
    await expect(page.locator('.cornisa-title')).toHaveText('Cambios guardados');
    expect(await page.locator('.cornisa').evaluate((n) => getComputedStyle(n).position)).toBe('fixed');   // CSS aplicado
    expect(await page.locator('.cornisa-shape path').evaluate((n) => getComputedStyle(n).fill)).toBe('rgb(17, 17, 17)');
    expect(errors).toEqual([]);
  });
}
