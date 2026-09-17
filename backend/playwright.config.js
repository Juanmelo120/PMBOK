/* Pruebas de extremo a extremo en el navegador (Microsoft Edge ya instalado).
   Arranca su propia API en el puerto 3100 con la base «pmbok8_e2e». */

'use strict';

const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: 'tests/e2e',
  testMatch: '*.spec.js',
  timeout: 60000,
  expect: { timeout: 10000 },
  workers: 1,
  fullyParallel: false,
  reporter: [['list']],
  outputDir: 'tests/e2e/resultados',
  use: {
    baseURL: 'http://127.0.0.1:3100',
    channel: 'msedge',
    headless: true,
    viewport: { width: 1360, height: 900 },
    locale: 'es-CO',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'node tests/e2e/servidor-e2e.js',
    url: 'http://127.0.0.1:3100/api/salud',
    reuseExistingServer: false,
    timeout: 60000,
    stdout: 'pipe'
  }
});
