import { defineConfig, devices } from '@playwright/test'

// El playground se sirve desde la raíz del repositorio (http://localhost:4180/design/lab/theme-playground/).
// GRANA_PW_PORT cambia el puerto (p. ej. si otro árbol de trabajo ya sirve el 4180: reuseExistingServer lo reutilizaría).
const PORT = Number(process.env.GRANA_PW_PORT) || 4180
export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  fullyParallel: true,
  reporter: [['list']],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } } // WebKit: el motor de Safari (no es Safari con su sistema)
  ],
  use: { baseURL: `http://localhost:${PORT}`, viewport: { width: 1280, height: 900 }, colorScheme: 'light', actionTimeout: 10_000 },
  webServer: {
    command: `python3 -m http.server ${PORT} --directory ../../..`,
    url: `http://localhost:${PORT}/design/lab/theme-playground/index.html`,
    reuseExistingServer: true,
    timeout: 30_000
  }
})
