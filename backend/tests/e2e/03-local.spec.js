/* E2E-03 · Abierta con doble clic, la aplicación sigue funcionando sin
   servidor y guarda en el navegador, como siempre. */

'use strict';

const path = require('path');
const { pathToFileURL } = require('url');
const { test, expect } = require('@playwright/test');

const INDICE = pathToFileURL(path.resolve(__dirname, '..', '..', '..', 'index.html')).href;

test('modo local: sin llamadas a la API y con los datos en el navegador', async ({ page }) => {
  const llamadas = [];
  page.on('request', (r) => { if (r.url().includes('/api/')) llamadas.push(r.url()); });

  await page.goto(INDICE);
  await expect(page.locator('html')).toHaveAttribute('data-modo', 'local');
  await expect(page.getByText('Modo local')).toBeVisible();

  await page.click('[data-g="acceso-demo"]');
  await expect(page).toHaveURL(/#\/panel$/);
  await page.fill('#np-nombre', 'Proyecto local E2E');
  await page.click('[data-g="crear-proyecto"]');
  await expect(page).toHaveURL(/#\/proyectos\//);
  const pid = page.url().split('#/proyectos/')[1];

  await page.goto(INDICE + '#/proyectos/' + pid + '/proceso/p-gob-01');
  await page.click('[data-o="estado-proceso"][data-valor="completado"]');

  await page.reload();
  await page.goto(INDICE + '#/panel');
  await expect(page.locator('.g-proyecto-nombre')).toHaveText(['Proyecto local E2E']);
  const guardado = await page.evaluate(() => JSON.parse(localStorage.getItem('pmbok8.bd')));
  expect(guardado.proyectos.map((p) => p.nombre)).toEqual(['Proyecto local E2E']);
  expect(guardado.procesos[0].estado).toBe('completado');
  expect(llamadas).toEqual([]);
});

/* Sin servidor no hay nadie que corrija un número imposible: lo que el
   navegador guarde aquí tiene que poder llevarse después al servidor. */
test('modo local: un número fuera de rango no llega a guardarse', async ({ page }) => {
  await page.goto(INDICE);
  await page.click('[data-g="acceso-demo"]');
  await page.fill('#np-nombre', 'Proyecto local de rangos');
  await page.click('[data-g="crear-proyecto"]');
  await expect(page).toHaveURL(/#\/proyectos\//);
  const pid = page.url().split('#/proyectos/')[1];

  await page.goto(INDICE + '#/proyectos/' + pid + '/dominios/riesgos');
  await page.fill('#nr2-titulo', 'Riesgo fuera de escala');
  await page.fill('#nr2-p', '9');
  await page.fill('#nr2-i', '0');
  await page.click('[data-o="crear-riesgo"]');

  await page.goto(INDICE + '#/proyectos/' + pid + '/control');
  await page.fill('#nm2-fecha', '2026-09-30');
  await page.fill('#nm2-pv', '-500');
  await page.fill('#nm2-ev', '1000');
  await page.fill('#nm2-ac', '-1');
  await page.click('[data-o="crear-medicion"]');

  const bd = await page.evaluate(() => JSON.parse(localStorage.getItem('pmbok8.bd')));
  const riesgo = bd.riesgos.find((r) => r.titulo === 'Riesgo fuera de escala');
  expect([riesgo.p, riesgo.i]).toEqual([5, 1]);
  const corte = bd.mediciones.find((m) => m.fecha === '2026-09-30');
  expect([corte.pv, corte.ev, corte.ac]).toEqual([0, 1000, 0]);
});
