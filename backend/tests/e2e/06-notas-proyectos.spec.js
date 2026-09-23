/* E2E-06 · El apartado de notas: cada proyecto se califica de 1.0 a 5.0
   según el avance de su flujo, solo lo ve quien administra, y desde ahí
   se pueden borrar los proyectos de prueba. */

'use strict';

const path = require('path');
const { pathToFileURL } = require('url');
const { test, expect } = require('@playwright/test');

const INDICE = pathToFileURL(path.resolve(__dirname, '..', '..', '..', 'index.html')).href;

/* Deja un proyecto con «completados» procesos marcados y devuelve su id */
async function proyectoCon(page, nombre, completados) {
  await page.goto(INDICE + '#/panel/nuevo');
  await page.fill('#np-nombre', nombre);
  await page.click('[data-g="crear-proyecto"]');
  await expect(page).toHaveURL(/#\/proyectos\//);
  const pid = page.url().split('#/proyectos/')[1].split('/')[0];

  if (completados) {
    await page.evaluate(({ pid, n }) => {
      PMBOK.procesos.slice(0, n).forEach(function (p) {
        Gestor.fijarEstadoProceso(pid, p.id, { estado: 'completado' });
      });
    }, { pid, n: completados });
  }
  return pid;
}

test('la nota sale del avance del flujo, de 1.0 a 5.0', async ({ page }) => {
  await page.goto(INDICE);
  await page.click('[data-g="acceso-demo"]');

  /* 0 de 40 -> 1.0 · 20 de 40 (50 %) -> 3.0 · 40 de 40 -> 5.0 */
  await proyectoCon(page, 'Proyecto sin empezar', 0);
  await proyectoCon(page, 'Proyecto a medias', 20);
  await proyectoCon(page, 'Proyecto terminado', 40);

  await page.goto(INDICE + '#/admin/notas');
  const nota = (nombre) => page.locator('tr', { hasText: nombre }).locator('.nt-nota');
  await expect(nota('Proyecto sin empezar')).toHaveText('1.0');
  await expect(nota('Proyecto a medias')).toHaveText('3.0');
  await expect(nota('Proyecto terminado')).toHaveText('5.0');

  /* Y el veredicto que acompaña a cada nota */
  const veredicto = (nombre) => page.locator('tr', { hasText: nombre }).locator('.pa-pastilla');
  await expect(veredicto('Proyecto sin empezar')).toHaveText('Reprobado');
  await expect(veredicto('Proyecto a medias')).toHaveText('Aprobado');
  await expect(veredicto('Proyecto terminado')).toHaveText('Aprobado');

  /* El promedio de 1.0, 3.0 y 5.0 es 3.0 */
  await expect(page.locator('.cifra', { hasText: 'Nota promedio' }).locator('b')).toHaveText('3.0');
  await expect(page.locator('.cifra', { hasText: 'Aprobados' }).locator('b')).toHaveText('2');

  /* El más avanzado aparece primero */
  await expect(page.locator('.nt-tabla tbody tr').first()).toContainText('Proyecto terminado');
});

test('el administrador borra un proyecto de prueba escribiendo ELIMINAR', async ({ page }) => {
  await page.goto(INDICE);
  await page.click('[data-g="acceso-demo"]');
  await proyectoCon(page, 'Proyecto que se queda', 8);
  await proyectoCon(page, 'Proyecto de prueba desechable', 0);

  await page.goto(INDICE + '#/admin/notas');
  await expect(page.locator('.nt-tabla tbody tr')).toHaveCount(2);

  const fila = page.locator('tr', { hasText: 'Proyecto de prueba desechable' });

  /* Una confirmación que no coincide no borra nada */
  await fila.locator('[data-g="borrar-proyecto"]').click();
  await page.fill('#d-confirma', 'si');
  await page.click('[data-d="aceptar"]');
  await expect(page.locator('.nt-tabla tbody tr')).toHaveCount(2);

  await fila.locator('[data-g="borrar-proyecto"]').click();
  await page.fill('#d-confirma', 'ELIMINAR');
  await page.click('[data-d="aceptar"]');

  await expect(page.locator('.nt-tabla tbody tr')).toHaveCount(1);
  await expect(page.locator('.nt-tabla')).toContainText('Proyecto que se queda');
  await expect(page.locator('.nt-tabla')).not.toContainText('desechable');

  /* Y se fue de verdad de la base del navegador, no solo de la pantalla */
  const quedan = await page.evaluate(() => Gestor.lista('proyectos').map((p) => p.nombre));
  expect(quedan).toEqual(['Proyecto que se queda']);
});

test('sin cuenta de administrador las notas no se abren', async ({ page }) => {
  await page.goto(INDICE);
  await page.click('[data-g="acceso-demo"]');
  await proyectoCon(page, 'Proyecto de la clase', 12);

  await page.goto(INDICE + '#/admin');
  await page.click('[data-g="abrir-nuevo-usuario"]');
  await page.fill('#nu-nombre', 'Director sin administración');
  await page.fill('#nu-correo', 'director.notas@pmbok.local');
  await page.fill('#nu-clave', 'director123');
  await page.selectOption('#nu-rol', 'director');
  await page.click('[data-g="crear-usuario"]');

  await page.click('#btn-salir');
  await page.click('[data-d="aceptar"]');
  await page.fill('#acc-correo', 'director.notas@pmbok.local');
  await page.fill('#acc-clave', 'director123');
  await page.click('[data-g="entrar"]');
  await expect(page).toHaveURL(/#\/panel$/);

  await expect(page.locator('[data-ruta="#/admin/notas"]')).toHaveCount(0);
  await page.goto(INDICE + '#/admin/notas');
  await expect(page.locator('.vacio-titulo')).toHaveText('Apartado de administrador');
  await expect(page.locator('.nt-tabla')).toHaveCount(0);
  await expect(page.locator('[data-g="borrar-proyecto"]')).toHaveCount(0);
});
