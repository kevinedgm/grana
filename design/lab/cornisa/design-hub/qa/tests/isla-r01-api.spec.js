import { test, expect } from '@playwright/test';
test('show(...).expand() inmediato se respeta (intención en cola)', async ({ page }) => {
  await page.goto('/lab/isla/r01/index.html');
  await page.evaluate(() => window.__proto.show({ title: 'X', duration: 'persistent', body: 'b' }).expand());
  await expect(page.locator('#isl .isl-act')).toHaveAttribute('data-phase', 'expanded', { timeout: 3000 });
});

test('WCAG 2.4.11: al tabular a la página, el expandido se contrae y no tapa el foco', async ({ page }) => {
  await page.goto('/lab/isla/r01/index.html');
  await page.evaluate(() => window.__proto.show({ title: 'Largo', duration: 'persistent', body: 'texto '.repeat(30), actions: [{ label: 'A' }] }).expand());
  await expect(page.locator('#isl .isl-act')).toHaveAttribute('data-phase', 'expanded');
  await page.locator('#isl [data-close]').focus();
  await page.locator('#host-primary').focus();   // equivalente a mover el foco fuera
  await expect(page.locator('#isl .isl-act')).toHaveAttribute('data-phase', 'compact');
  const [b, i] = await Promise.all([page.locator('#host-primary').boundingBox(), page.locator('#isl .isl-act').boundingBox()]);
  await page.waitForTimeout(400);
  const i2 = await page.locator('#isl .isl-act').boundingBox();
  const overlap = !(i2.y + i2.height <= b.y || i2.y >= b.y + b.height || i2.x + i2.width <= b.x || i2.x >= b.x + b.width);
  expect(overlap).toBe(false);
});

test('clic fuera contrae el expandido sin descartarlo', async ({ page }) => {
  await page.goto('/lab/isla/r01/index.html');
  await page.evaluate(() => window.__proto.show({ title: 'Y', duration: 'persistent', body: 'b' }).expand());
  await expect(page.locator('#isl .isl-act')).toHaveAttribute('data-phase', 'expanded');
  await page.locator('.page-filler').click();   // contenido de la página, fuera de la isla
  await expect(page.locator('#isl .isl-act')).toHaveAttribute('data-phase', 'compact');
});
