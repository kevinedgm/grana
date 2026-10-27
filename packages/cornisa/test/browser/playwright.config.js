import { defineConfig, devices } from '@playwright/test';
const PORT = process.env.CORNISA_PORT || '4510';
// Viewports del perfil: [1440, 834, 393, 320] + Firefox + WebKit (móvil)
const chromium = [1440, 834, 393, 320].map((w) => ({
  name: `chromium-${w}`,
  use: { ...devices['Desktop Chrome'], viewport: { width: w, height: w < 600 ? 780 : 900 }, ...(w < 600 ? { isMobile: true, hasTouch: true } : {}) },
}));
export default defineConfig({
  testDir: '.',
  timeout: 30000,
  fullyParallel: true,
  workers: 3,
  reporter: [['list']],
  webServer: { command: `python3 -m http.server ${PORT} --directory ../..`, url: `http://localhost:${PORT}/package.json`, reuseExistingServer: true },
  use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure' },
  projects: [
    ...chromium,
    { name: 'firefox-1440', use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 900 } } },
    { name: 'webkit-393', use: { ...devices['iPhone 15'], viewport: { width: 393, height: 780 } } },
    { name: 'webkit-1440', use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } } },
  ],
});
