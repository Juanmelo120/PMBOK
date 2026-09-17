/* E2E-04 · Cada compañero crea su cuenta. Quien lidera crea el proyecto y
   añade a los demás por correo (o les da un código); todos trabajan sobre
   los mismos datos, guardados en el servidor, y lo del líder sigue siendo
   solo del líder. */

'use strict';

const path = require('path');
const { pathToFileURL } = require('url');
const { test, expect } = require('@playwright/test');
const { entrar, entrarComoAdmin, esperarGuardado, api } = require('./ayuda-e2e');

const INDICE = pathToFileURL(path.resolve(__dirname, '..', '..', '..', 'index.html')).href;

async function registrarse(page, nombre, correo, clave, base = '/') {
  await page.goto(base + '#/entrar');
  await page.getByRole('link', { name: 'Crear cuenta' }).click();
  await expect(page).toHaveURL(/#\/registro$/);
  await page.fill('#rg-nombre', nombre);
  await page.fill('#rg-correo', correo);
  await page.fill('#rg-clave', clave);
  await page.fill('#rg-repetir', clave);
  await page.click('[data-g="registrarse"]');
  await expect(page).toHaveURL(/#\/panel$/);
}

async function salir(page) {
  await page.click('#btn-salir');
  await page.click('[data-d="aceptar"]');
  await expect(page).toHaveURL(/#\/entrar$/);
}

async function anadirPorCorreo(page, correo, rol) {
  await page.fill('#nmb-correo', correo);
  await page.selectOption('#nmb-rol', rol);
  await page.click('[data-o="agregar-miembro"]');
}

async function generarCodigo(page, rol) {
  await page.selectOption('#ninv-rol', rol);
  await page.click('[data-o="crear-invitacion"]');
  const codigo = page.locator('.g-codigo').first();
  await expect(codigo).toHaveText(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
  return codigo.textContent();
}

async function unirse(page, codigo) {
  await page.goto(page.url().split('#')[0] + '#/panel');
  await page.locator('[data-g="unirse-proyecto"]').first().click();
  await page.fill('#d-codigo', codigo);
  await page.click('[data-d="aceptar"]');
}

test('servidor: registrarse, crear el proyecto, añadir compañeros por correo y guardar juntos', async ({ page, request, browser }) => {
  test.setTimeout(150000);
  /* Dos compañeros crean su cuenta antes */
  const ctxAna = await browser.newContext();
  const pAna = await ctxAna.newPage();
  await registrarse(pAna, 'Ana Compañera', 'ana@aula.local', 'ana-clave');
  const ctxBeto = await browser.newContext();
  const pBeto = await ctxBeto.newPage();
  await registrarse(pBeto, 'Beto Compañero', 'beto@aula.local', 'beto-clave');
  await salir(pAna);

  /* La líder se registra y, sin pasar por un administrador, crea su proyecto */
  const ctxLia = await browser.newContext();
  const pl = await ctxLia.newPage();
  await registrarse(pl, 'Lía Líder', 'lia@aula.local', 'lia-clave');
  await expect(pl.locator('.g-usuario-datos em')).toHaveText('Director de proyecto');
  await expect(pl.locator('#np-nombre')).toBeVisible();
  await pl.fill('#np-nombre', 'Proyecto del grupo 3');
  await pl.click('[data-opcion="metodologia"][data-valor="agil"]');
  await pl.click('[data-g="crear-proyecto"]');
  await expect(pl).toHaveURL(/#\/proyectos\/pro-[^/]+$/);
  const pid = pl.url().split('#/proyectos/')[1];
  await esperarGuardado(pl);

  /* Añade a los dos por correo */
  await pl.goto('/#/proyectos/' + pid + '/equipo');
  await anadirPorCorreo(pl, 'no-existe@aula.local', 'equipo');
  await expect(pl.locator('#nmb-error')).toContainText('No hay ninguna cuenta');
  await anadirPorCorreo(pl, 'ANA@aula.local', 'equipo');
  await expect(pl.getByText('Ana Compañera se unió al equipo')).toBeVisible();
  await anadirPorCorreo(pl, 'beto@aula.local', 'observador');
  await expect(pl.locator('.g-miembro')).toHaveCount(3);
  await esperarGuardado(pl);

  /* Ana vuelve a entrar con su correo y contraseña, abre el proyecto y guarda el acta */
  await entrar(pAna, 'ana@aula.local', 'ana-clave');
  await expect(pAna.locator('.g-proyecto-nombre')).toHaveText(['Proyecto del grupo 3']);
  await pAna.goto('/#/proyectos/' + pid + '/proceso/p-gob-01');
  await pAna.click('[data-o="generar-salida"][data-art="art-acta-proyecto"]');
  await expect(pAna).toHaveURL(/\/documento\//);
  const docId = pAna.url().split('/documento/')[1];
  const bloque = pAna.locator('.g-bloque').first();
  await bloque.fill('Reservar libros sin ir a la biblioteca');
  await bloque.blur();
  await esperarGuardado(pAna);
  await pAna.reload();
  await pAna.goto('/#/proyectos/' + pid + '/documento/' + docId);
  await expect(pAna.locator('.g-bloque').first()).toHaveValue('Reservar libros sin ir a la biblioteca');

  /* La líder lo lee tras recargar: viene de la base */
  await pl.goto('/#/proyectos/' + pid + '/documento/' + docId);
  await pl.reload();
  await expect(pl.locator('.g-bloque').first()).toHaveValue('Reservar libros sin ir a la biblioteca');

  /* Ana edita el trabajo, pero no lo del líder */
  await pAna.goto('/#/proyectos/' + pid + '/equipo');
  await expect(pAna.getByText('Solo el líder del proyecto o un administrador pueden cambiar la configuración.')).toBeVisible();
  await expect(pAna.locator('#nmb-correo')).toHaveCount(0);
  await expect(pAna.locator('[data-o="crear-invitacion"]')).toHaveCount(0);

  /* Beto, observador, lo ve todo pero no puede escribir */
  await pBeto.reload();
  await expect(pBeto.locator('.g-proyecto-nombre')).toHaveText(['Proyecto del grupo 3']);
  await pBeto.goto('/#/proyectos/' + pid + '/dominios');
  await expect(pBeto.locator('#nr2-titulo')).toHaveCount(0);

  /* Un cuarto compañero entra con un código que genera la líder */
  await pl.goto('/#/proyectos/' + pid + '/equipo');
  const codigo = await generarCodigo(pl, 'equipo');
  await esperarGuardado(pl);
  const ctxCarla = await browser.newContext();
  const pc = await ctxCarla.newPage();
  await registrarse(pc, 'Carla Código', 'carla@aula.local', 'carla-clave');
  await unirse(pc, 'ZZZZ-2222');
  await expect(pc.getByText('Ese código no existe')).toBeVisible();
  await unirse(pc, codigo.toLowerCase());
  await expect(pc).toHaveURL(new RegExp('#/proyectos/' + pid + '$'));

  /* Administración reconoce las cuentas registradas */
  await entrarComoAdmin(page, request);
  await page.goto('/#/admin');
  await expect(page.locator('tr', { hasText: 'ana@aula.local' })).toContainText('se registró solo');
  const miembros = (await api(page, 'GET', '/proyectos/' + pid + '/miembros')).datos;
  expect(miembros.map((m) => m.rol).sort()).toEqual(['equipo', 'equipo', 'lider', 'observador']);

  for (const c of [ctxAna, ctxBeto, ctxLia, ctxCarla]) await c.close();
});

test('local: registro, proyecto propio y compañero añadido por correo, sin servidor', async ({ page }) => {
  const llamadas = [];
  page.on('request', (r) => { if (r.url().includes('/api/')) llamadas.push(r.url()); });

  await registrarse(page, 'Ana Local', 'ana@aula.local', 'ana-clave', INDICE);
  await salir(page);

  await registrarse(page, 'Lía Local', 'lia@aula.local', 'lia-clave', INDICE);
  await page.fill('#np-nombre', 'Proyecto local del aula');
  await page.click('[data-g="crear-proyecto"]');
  await expect(page).toHaveURL(/#\/proyectos\//);
  const pid = page.url().split('#/proyectos/')[1];
  await page.goto(INDICE + '#/proyectos/' + pid + '/equipo');
  await anadirPorCorreo(page, 'ana@aula.local', 'equipo');
  await expect(page.locator('.g-miembro')).toHaveCount(2);
  await salir(page);

  await page.fill('#acc-correo', 'ana@aula.local');
  await page.fill('#acc-clave', 'ana-clave');
  await page.click('[data-g="entrar"]');
  await expect(page).toHaveURL(/#\/panel$/);
  await expect(page.locator('.g-proyecto-nombre')).toHaveText(['Proyecto local del aula']);

  const guardado = await page.evaluate(() => JSON.parse(localStorage.getItem('pmbok8.bd')));
  const lia = guardado.usuarios.find((u) => u.correo === 'lia@aula.local');
  const ana = guardado.usuarios.find((u) => u.correo === 'ana@aula.local');
  expect([lia.rol, lia.origen]).toEqual(['director', 'registro']);
  expect(guardado.miembros.filter((m) => m.usuarioId === ana.id).map((m) => m.rol)).toEqual(['equipo']);
  expect(llamadas).toEqual([]);
});
