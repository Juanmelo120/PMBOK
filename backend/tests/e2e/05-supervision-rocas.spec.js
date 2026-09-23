/* E2E-05 · El apartado de administrador «Supervisión de rocas»: solo entra
   quien administra, cada roca muestra su avance y sus integrantes, y al
   abrirla se ve lo que hicieron. Se prueba en los dos modos: local
   (file://), donde todo se calcula en el navegador, y servidor, que es
   como está desplegado. */

'use strict';

const path = require('path');
const { pathToFileURL } = require('url');
const { test, expect } = require('@playwright/test');
const { entrarComoAdmin, esperarGuardado, api } = require('./ayuda-e2e');

const INDICE = pathToFileURL(path.resolve(__dirname, '..', '..', '..', 'index.html')).href;

/* Deja lista una roca con dos metas, una marcada, y un proyecto vinculado
   con una tarea terminada. Devuelve el id del proyecto. */
async function prepararRoca(page, titulo) {
  await page.goto(INDICE);
  await page.click('[data-g="acceso-demo"]');
  await expect(page).toHaveURL(/#\/panel$/);

  await page.goto(INDICE + '#/eos/rocas');
  await page.click('[data-g="abrir-nueva-roca"]');
  await page.fill('#nr-titulo', titulo);
  await page.fill('#nr-metas', 'Primera meta medible\nSegunda meta medible');
  await page.click('[data-g="crear-roca"]');
  await expect(page.locator('.g-roca h3')).toHaveText([titulo]);
  await page.click('.g-roca [data-g="meta-roca"][data-i="0"]');
  await expect(page.locator('.g-roca-pie')).toContainText('1/2 metas');

  const rocaId = await page.evaluate(
    (t) => Gestor.lista('rocas').filter((r) => r.titulo === t)[0].id, titulo);

  await page.goto(INDICE + '#/panel/nuevo');
  await page.fill('#np-nombre', 'Proyecto de la roca');
  await page.selectOption('#np-roca', rocaId);
  await page.click('[data-g="crear-proyecto"]');
  await expect(page).toHaveURL(/#\/proyectos\//);
  const pid = page.url().split('#/proyectos/')[1].split('/')[0];

  await page.goto(INDICE + '#/proyectos/' + pid + '/trabajo');
  await page.fill('#nt-titulo', 'Tarea que quedó terminada');
  await page.selectOption('#nt-responsable', 'u-admin');
  await page.click('[data-o="crear-tarea"]');
  await page.evaluate(() => {
    const t = Gestor.lista('tareas')[0];
    Gestor.actualizar('tareas', t.id, { estado: 'hecho' });
  });

  return pid;
}

test('el administrador ve el avance y los integrantes de cada roca', async ({ page }) => {
  await prepararRoca(page, 'Roca supervisada del trimestre');

  await page.goto(INDICE + '#/admin/rocas');
  const tarjeta = page.locator('a.sv-roca').filter({ hasText: 'Roca supervisada del trimestre' });
  await expect(tarjeta).toHaveCount(1);

  /* Media de: metas 50 % (peso 50), flujo 0 % (peso 30), tareas 100 % (peso 20) */
  await expect(tarjeta.locator('.sv-avance b')).toHaveText('45%');
  await expect(tarjeta.locator('.sv-desglose')).toContainText('1/2 metas');
  await expect(tarjeta.locator('.sv-desglose')).toContainText('1 proyecto');
  await expect(tarjeta.locator('.sv-desglose')).toContainText('1/1 tareas');
  await expect(tarjeta.locator('.sv-caras-texto')).toContainText('Administrador');
});

test('al tocar una roca se ve lo que hicieron', async ({ page }) => {
  await prepararRoca(page, 'Roca con bitácora');

  await page.goto(INDICE + '#/admin/rocas');
  await page.locator('a.sv-roca').filter({ hasText: 'Roca con bitácora' }).click();
  await expect(page).toHaveURL(/#\/admin\/rocas\/.+/);
  await expect(page.locator('h1.titulo-pagina')).toHaveText('Roca con bitácora');

  /* Quiénes la empujan */
  await expect(page.getByRole('heading', { name: 'Integrantes de la roca' })).toBeVisible();
  await expect(page.locator('.g-usuario b').first()).toHaveText('Administrador');
  await expect(page.locator('.sv-papel').first()).toContainText('Responsable de la roca');

  /* Y qué hicieron */
  await expect(page.getByRole('heading', { name: 'Lo que hicieron' })).toBeVisible();
  const bitacora = page.locator('.sv-evento');
  await expect(bitacora.filter({ hasText: 'Terminó la tarea' })).toHaveCount(1);
  const evento = bitacora.filter({ hasText: 'Tarea que quedó terminada' });
  await expect(evento).toContainText('Administrador');
  await expect(evento).toContainText('Proyecto de la roca');
});

test('sin cuenta de administrador el apartado no se abre', async ({ page }) => {
  await prepararRoca(page, 'Roca que no debe verse');

  await page.goto(INDICE + '#/admin');
  await page.click('[data-g="abrir-nuevo-usuario"]');
  await page.fill('#nu-nombre', 'Directora sin administración');
  await page.fill('#nu-correo', 'directora@pmbok.local');
  await page.fill('#nu-clave', 'directora123');
  await page.selectOption('#nu-rol', 'director');
  await page.click('[data-g="crear-usuario"]');
  await expect(page.locator('.pa-tabla')).toContainText('directora@pmbok.local');

  await page.click('#btn-salir');
  await page.click('[data-d="aceptar"]');
  await expect(page).toHaveURL(/#\/entrar$/);
  await page.fill('#acc-correo', 'directora@pmbok.local');
  await page.fill('#acc-clave', 'directora123');
  await page.click('[data-g="entrar"]');
  await expect(page).toHaveURL(/#\/panel$/);

  /* Ni el enlace en la navegación ni la pantalla por su dirección */
  await expect(page.locator('[data-ruta="#/admin/rocas"]')).toHaveCount(0);
  await page.goto(INDICE + '#/admin/rocas');
  await expect(page.locator('.vacio-titulo')).toHaveText('Apartado de administrador');
  await expect(page.locator('a.sv-roca')).toHaveCount(0);
});

/* El despliegue real es el modo servidor: allí los datos llegan de
   /api/estado y la pantalla se calcula sobre esa copia en memoria. */
test('servidor: la supervisión se pinta con los datos que llegan de la API', async ({ page, request }) => {
  await entrarComoAdmin(page, request);

  await page.goto('/#/eos/rocas');
  await page.click('[data-g="abrir-nueva-roca"]');
  await page.fill('#nr-titulo', 'Roca del servidor');
  await page.fill('#nr-metas', 'Primera meta del servidor\nSegunda meta del servidor');
  await page.click('[data-g="crear-roca"]');
  const roca = page.locator('.g-roca').filter({ hasText: 'Roca del servidor' });
  await roca.locator('[data-g="meta-roca"][data-i="0"]').click();
  await esperarGuardado(page);

  const rocaId = await page.evaluate(
    () => Gestor.lista('rocas').filter((r) => r.titulo === 'Roca del servidor')[0].id);

  await page.goto('/#/panel/nuevo');
  await page.fill('#np-nombre', 'Proyecto del servidor');
  await page.selectOption('#np-roca', rocaId);
  await page.click('[data-g="crear-proyecto"]');
  await expect(page).toHaveURL(/#\/proyectos\/pro-[^/]+$/);
  const pid = page.url().split('#/proyectos/')[1];

  await page.goto('/#/proyectos/' + pid + '/trabajo');
  await page.fill('#nt-titulo', 'Tarea terminada en el servidor');
  await page.click('[data-o="crear-tarea"]');
  await esperarGuardado(page);
  const tid = await page.evaluate(() => Gestor.lista('tareas')[0].id);
  await api(page, 'PATCH', '/tareas/' + tid, { estado: 'hecho' });

  /* Recargar obliga a reconstruir la pantalla desde /api/estado,
     no desde lo que quedó en memoria tras editar. */
  await page.goto('/#/admin/rocas');
  await page.reload();
  const tarjeta = page.locator('a.sv-roca').filter({ hasText: 'Roca del servidor' });
  await expect(tarjeta).toHaveCount(1);
  await expect(tarjeta.locator('.sv-desglose')).toContainText('1/2 metas');
  await expect(tarjeta.locator('.sv-desglose')).toContainText('1/1 tareas');

  await tarjeta.click();
  await expect(page.locator('h1.titulo-pagina')).toHaveText('Roca del servidor');
  await expect(page.locator('.sv-evento').filter({ hasText: 'Terminó la tarea' })).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Integrantes de la roca' })).toBeVisible();
  await expect(page.locator('.g-usuario b').first()).toHaveText('Administrador');
});
