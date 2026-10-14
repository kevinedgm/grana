import { defineConfig, devices } from '@playwright/test'

// Pruebas de navegador del sitio sobre el build (`npm run docs:build` antes): `vitepress preview`
// en el puerto 4219 (GRANA_SITE_PORT), con la base de GitHub Pages (/grana/).
const PORT = Number(process.env.GRANA_SITE_PORT) || 4219
export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  fullyParallel: true,
  reporter: [['list']],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ],
  use: { baseURL: `http://localhost:${PORT}/grana/`, viewport: { width: 1280, height: 900 }, colorScheme: 'light', actionTimeout: 10_000 },
  webServer: {
    command: `npx vitepress preview . --port ${PORT}`,
    url: `http://localhost:${PORT}/grana/`,
    reuseExistingServer: true,
    timeout: 30_000
  }
})
