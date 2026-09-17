/* Utilidades de las pruebas en navegador */

'use strict';

const { expect } = require('@playwright/test');

const ADMIN = { correo: 'admin@pmbok.local', inicial: 'admin123', propia: 'Admin-e2e-1' };

/* Deja la cuenta inicial con su contraseña propia (por si esta prueba corre sola) */
async function asegurarAdmin(request) {
  const r = await request.post('/api/auth/entrar', { data: { correo: ADMIN.correo, clave: ADMIN.inicial } });
  if (r.status() !== 200) return;
  const { token, usuario } = await r.json();
  if (!usuario.debeCambiarClave) return;
  await request.put('/api/auth/clave', {
    headers: { Authorization: 'Bearer ' + token },
    data: { actual: ADMIN.inicial, nueva: ADMIN.propia }
  });
}

async function entrar(page, correo, clave, destino = /#\/panel$/) {
  await page.goto('/#/entrar');
  await page.fill('#acc-correo', correo);
  await page.fill('#acc-clave', clave);
  await page.click('[data-g="entrar"]');
  await expect(page).toHaveURL(destino);
}

async function entrarComoAdmin(page, request) {
  await asegurarAdmin(request);
  await entrar(page, ADMIN.correo, ADMIN.propia);
}

/* Espera a que la cola de escrituras llegue al servidor */
async function esperarGuardado(page) {
  await page.waitForFunction(() => window.Remoto && Remoto.pendientes() === 0);
}

/* Llama a la API con la sesión de la página */
async function api(page, metodo, ruta, cuerpo) {
  return page.evaluate(async ({ metodo, ruta, cuerpo }) => {
    const r = await fetch('api' + ruta, {
      method: metodo,
      headers: {
        Authorization: 'Bearer ' + localStorage.getItem('pmbok8.token'),
        'Content-Type': 'application/json'
      },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo)
    });
    return { estado: r.status, datos: r.status === 204 ? null : await r.json() };
  }, { metodo, ruta, cuerpo });
}

module.exports = { ADMIN, asegurarAdmin, entrar, entrarComoAdmin, esperarGuardado, api };
