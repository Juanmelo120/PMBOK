/* E2E-01 · La interfaz trabaja contra el servidor y lo que se hace
   en pantalla queda guardado en PostgreSQL. */

'use strict';

const fs = require('fs');
const { test, expect } = require('@playwright/test');
const { ADMIN, entrar, entrarComoAdmin, esperarGuardado, api } = require('./ayuda-e2e');

test.describe.configure({ mode: 'serial' });

let pid = null;

test('la primera entrada exige elegir una contraseña propia', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-modo', 'servidor');
  await expect(page.getByText('Conectado al servidor')).toBeVisible();

  await page.click('[data-g="acceso-demo"]');
  await expect(page).toHaveURL(/#\/clave$/);
  await expect(page.locator('#arbol .arbol-enlace')).toHaveCount(0);

  await page.fill('#cc-actual', ADMIN.inicial);
  await page.fill('#cc-nueva', ADMIN.propia);
  await page.fill('#cc-repetir', 'otra-distinta');
  await page.click('[data-g="cambiar-clave"]');
  await expect(page.locator('#g-error-clave')).toContainText('no coinciden');

  await page.goto('/#/panel');
  await expect(page).toHaveURL(/#\/clave$/, { timeout: 5000 });

  await page.fill('#cc-actual', ADMIN.inicial);
  await page.fill('#cc-nueva', ADMIN.propia);
  await page.fill('#cc-repetir', ADMIN.propia);
  await page.click('[data-g="cambiar-clave"]');
  await expect(page).toHaveURL(/#\/panel$/);
  await expect(page.getByRole('heading', { name: 'Hola, Administrador' })).toBeVisible();

  await page.goto('/#/entrar');
  await expect(page).toHaveURL(/#\/panel$/, { timeout: 5000 });
});

test('crear un proyecto y trabajar su primer proceso queda guardado', async ({ page, request }) => {
  await entrarComoAdmin(page, request);
  await page.fill('#np-nombre', 'Portal E2E');
  await page.click('[data-opcion="metodologia"][data-valor="agil"]');
  await page.fill('#np-presupuesto', '50000');
  await page.click('[data-g="crear-proyecto"]');
  await expect(page).toHaveURL(/#\/proyectos\/pro-[^/]+$/);
  pid = page.url().split('#/proyectos/')[1];

  await page.goto('/#/proyectos/' + pid + '/proceso/p-gob-01');
  await page.click('[data-o="estado-proceso"][data-valor="iniciado"]');
  await page.click('[data-o="generar-salida"][data-art="art-acta-proyecto"]');
  await expect(page).toHaveURL(/\/documento\//);
  const docId = page.url().split('/documento/')[1];

  const bloque = page.locator('.g-bloque').first();
  await bloque.fill('Reducir un 30 % el tiempo de atención');
  await bloque.blur();
  await expect(page.locator('#g-doc-completitud')).toContainText('11 %');

  await page.goto('/#/proyectos/' + pid + '/proceso/p-gob-01');
  await page.click('[data-o="estado-proceso"][data-valor="completado"]');
  await esperarGuardado(page);

  /* Otra carga de la página: todo sale del servidor */
  await page.reload();
  await page.goto('/#/proyectos/' + pid + '/documento/' + docId);
  await expect(page.locator('.g-bloque').first()).toHaveValue('Reducir un 30 % el tiempo de atención');

  const p = await api(page, 'GET', '/proyectos/' + pid);
  expect(p.datos.metodologia).toBe('agil');
  expect(p.datos.presupuesto).toBe(50000);
  expect(p.datos.progreso.completados).toBe(1);
  const d = await api(page, 'GET', '/documentos/' + docId);
  expect(d.datos.contenido['0']).toBe('Reducir un 30 % el tiempo de atención');
  expect(d.datos.completitud).toBe(11);
});

test('el trabajo del sprint se mueve en el tablero y deja su burndown', async ({ page, request }) => {
  await entrarComoAdmin(page, request);
  await page.goto('/#/proyectos/' + pid + '/trabajo');
  await page.fill('#nt-titulo', 'Como cliente quiero pagar en línea');
  await page.fill('#nt-puntos', '5');
  await page.click('[data-o="crear-tarea"]');
  await expect(page.locator('.g-historia')).toContainText('pagar en línea');

  await page.click('.g-historia [data-o="al-sprint"]');
  await expect(page.locator('.g-columna[data-columna="pendiente"] .g-tarea')).toHaveCount(1);
  for (const columna of ['curso', 'revision', 'hecho']) {
    await page.click('.g-tarea [data-o="avanzar-tarea"]');
    await expect(page.locator('.g-columna[data-columna="' + columna + '"] .g-tarea')).toHaveCount(1);
  }
  await esperarGuardado(page);

  await page.reload();
  await page.goto('/#/proyectos/' + pid + '/trabajo');
  await expect(page.locator('.g-columna[data-columna="hecho"] .g-tarea')).toContainText('pagar en línea');

  const activo = (await api(page, 'GET', '/proyectos/' + pid + '/sprint-activo')).datos.sprint;
  const fotos = Object.values(activo.historial);
  expect(fotos.length).toBe(1);
  expect(fotos[0]).toEqual({ restante: 0, comprometido: 5 });
});

test('riesgos, interesados y valor ganado se registran desde sus pestañas', async ({ page, request }) => {
  await entrarComoAdmin(page, request);
  await page.goto('/#/proyectos/' + pid + '/dominios');
  await page.fill('#nr2-titulo', 'Debido a la pasarela podría fallar el pago');
  await page.fill('#nr2-p', '4');
  await page.fill('#nr2-i', '5');
  await page.click('[data-o="crear-riesgo"]');
  await expect(page.getByText('Debido a la pasarela podría fallar el pago').first()).toBeVisible();

  await page.goto('/#/proyectos/' + pid + '/dominios/interesados');
  await page.fill('#ni-nombre', 'Gerencia comercial');
  await page.click('[data-o="crear-interesado"]');
  await expect(page.getByText('Gerencia comercial').first()).toBeVisible();

  await page.goto('/#/proyectos/' + pid + '/control');
  await page.fill('#nm2-fecha', '2026-09-30');
  await page.fill('#nm2-pv', '10000');
  await page.fill('#nm2-ev', '9000');
  await page.fill('#nm2-ac', '12000');
  await page.click('[data-o="crear-medicion"]');
  await esperarGuardado(page);

  await page.reload();
  await page.goto('/#/proyectos/' + pid + '/dominios');
  await expect(page.getByText('Debido a la pasarela podría fallar el pago').first()).toBeVisible();
  const riesgos = (await api(page, 'GET', '/proyectos/' + pid + '/riesgos')).datos;
  expect(riesgos.map((r) => [r.p, r.i, r.severidad.nivel])).toEqual([[4, 5, 'critico']]);
  const evm = (await api(page, 'GET', '/proyectos/' + pid + '/evm')).datos;
  expect(evm.ultima.cpi).toBe(0.75);
  expect((await api(page, 'GET', '/proyectos/' + pid + '/interesados')).datos[0].nombre).toBe('Gerencia comercial');
});

test('un archivo subido se guarda en la base y se descarga intacto', async ({ page, request }) => {
  await entrarComoAdmin(page, request);
  await page.goto('/#/proyectos/' + pid + '/archivos');
  await page.setInputFiles('#g-archivo-input', {
    name: 'Acta firmada ñ.txt', mimeType: 'text/plain', buffer: Buffer.from('contenido de prueba — ñandú')
  });
  await expect(page.getByText('Acta firmada ñ.txt')).toBeVisible();

  await page.reload();
  await page.goto('/#/proyectos/' + pid + '/archivos');
  const [descarga] = await Promise.all([
    page.waitForEvent('download'),
    page.click('[data-o="descargar-archivo"]')
  ]);
  expect(descarga.suggestedFilename()).toBe('Acta firmada ñ.txt');
  expect(fs.readFileSync(await descarga.path(), 'utf8')).toBe('contenido de prueba — ñandú');
});

test('si el servidor rechaza un cambio, se avisa y la pantalla vuelve al estado real', async ({ page, request }) => {
  await entrarComoAdmin(page, request);
  await page.route('**/api/proyectos/*/lecciones', (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    return route.fulfill({
      status: 400, contentType: 'application/json',
      body: JSON.stringify({ error: 'rechazado en la prueba', codigo: 'PETICION_INVALIDA' })
    });
  });
  await page.goto('/#/proyectos/' + pid + '/dominios/lecciones');
  await page.fill('#nl-situacion', 'Lección que el servidor rechaza');
  await page.click('[data-o="crear-leccion"]');
  await expect(page.locator('.d-aviso.error')).toContainText('rechazado en la prueba');
  await expect(page.getByText('Lección que el servidor rechaza')).toHaveCount(0);
  expect((await api(page, 'GET', '/proyectos/' + pid + '/lecciones')).datos).toEqual([]);
});

test('una cuenta creada desde Administración ve solo lo permitido y según su rol', async ({ page, request, browser }) => {
  await entrarComoAdmin(page, request);
  await api(page, 'POST', '/proyectos', { nombre: 'Proyecto oculto' });

  await page.goto('/#/admin');
  await page.click('[data-g="abrir-nuevo-usuario"]');
  await page.fill('#nu-nombre', 'Mara Miembro');
  await page.fill('#nu-correo', 'mara@e2e.local');
  await page.fill('#nu-clave', 'temporal1');
  await page.selectOption('#nu-rol', 'miembro');
  await page.click('[data-g="crear-usuario"]');
  await expect(page.getByText('mara@e2e.local')).toBeVisible();
  await esperarGuardado(page);

  const maraId = await page.evaluate(() => Gestor.lista('usuarios').find((u) => u.correo === 'mara@e2e.local').id);
  await page.click('[data-g="permisos"][data-id="' + maraId + '"]');
  await page.selectOption('#perm-ambito', 'proyecto:' + pid);
  await page.selectOption('#perm-nivel', 'ver');
  await page.click('[data-g="conceder"]');
  await esperarGuardado(page);

  const otra = await browser.newContext();
  const mara = await otra.newPage();
  await entrar(mara, 'mara@e2e.local', 'temporal1', /#\/clave$/);
  await mara.fill('#cc-actual', 'temporal1');
  await mara.fill('#cc-nueva', 'mara-propia-1');
  await mara.fill('#cc-repetir', 'mara-propia-1');
  await mara.click('[data-g="cambiar-clave"]');
  await expect(mara).toHaveURL(/#\/panel$/);

  await expect(mara.locator('.g-proyecto-nombre')).toHaveText(['Portal E2E']);
  await expect(mara.locator('[data-g="abrir-nuevo-proyecto"]')).toHaveCount(0);
  await expect(mara.getByRole('link', { name: 'Administración' })).toHaveCount(0);

  await mara.goto('/#/proyectos/' + pid + '/trabajo');
  await expect(mara.locator('.g-columna[data-columna="hecho"] .g-tarea')).toHaveCount(1);
  await expect(mara.locator('#nt-titulo')).toHaveCount(0);

  await mara.goto('/#/eos');
  await expect(mara.getByText('Solo lectura')).toBeVisible();
  await expect(mara.locator('[data-g="abrir-nueva-roca"]')).toHaveCount(0);
  await otra.close();
});

test('un número fuera de rango se ajusta antes de salir del navegador', async ({ page, request }) => {
  await entrarComoAdmin(page, request);
  const rechazos = [];
  page.on('response', (r) => {
    if (r.status() === 400 && r.request().method() === 'POST') rechazos.push(r.url());
  });

  await page.goto('/#/proyectos/' + pid + '/dominios/riesgos');
  await page.fill('#nr2-titulo', 'Riesgo fuera de escala');
  await page.fill('#nr2-p', '9');
  await page.fill('#nr2-i', '0');
  await page.click('[data-o="crear-riesgo"]');
  await esperarGuardado(page);

  const riesgo = (await api(page, 'GET', '/proyectos/' + pid + '/riesgos')).datos
    .find((r) => r.titulo === 'Riesgo fuera de escala');
  expect(riesgo).toBeTruthy();
  expect([riesgo.p, riesgo.i]).toEqual([5, 1]);

  await page.goto('/#/proyectos/' + pid + '/control');
  await page.fill('#nm2-fecha', '2026-10-31');
  await page.fill('#nm2-pv', '-500');
  await page.fill('#nm2-ev', '1000');
  await page.fill('#nm2-ac', '-1');
  await page.click('[data-o="crear-medicion"]');
  await esperarGuardado(page);

  const corte = (await api(page, 'GET', '/proyectos/' + pid + '/mediciones')).datos
    .find((m) => m.fecha === '2026-10-31');
  expect([corte.pv, corte.ev, corte.ac]).toEqual([0, 1000, 0]);

  /* Lo que la interfaz envía nunca debería volver rechazado */
  expect(rechazos).toEqual([]);
});

test('cerrar sesión devuelve al acceso y olvida el token', async ({ page, request }) => {
  await entrarComoAdmin(page, request);
  await page.click('#btn-salir');
  await page.click('[data-d="aceptar"]');
  await expect(page).toHaveURL(/#\/entrar$/);
  expect(await page.evaluate(() => localStorage.getItem('pmbok8.token'))).toBeNull();
  await page.reload();
  await expect(page.locator('#acc-correo')).toBeVisible();
  await page.goto('/#/panel');
  await expect(page).toHaveURL(/#\/entrar$/);
});
