/* E2E-02 · Lo que se guardó en el navegador en modo local se lleva al
   servidor desde Administración, archivos incluidos. */

'use strict';

const fs = require('fs');
const { test, expect } = require('@playwright/test');
const { entrar, entrarComoAdmin, esperarGuardado, api } = require('./ayuda-e2e');

test('los datos del modo local pasan al servidor con sus archivos', async ({ page, request }) => {
  await page.goto('/');

  /* Base y archivo tal como los deja el modo local en este navegador */
  await page.evaluate(async () => {
    const t = Date.now();
    const vacias = ['permisos', 'portafolios', 'programas', 'documentos', 'riesgos', 'interesados', 'cambios',
      'lecciones', 'tareas', 'sprints', 'mediciones', 'comentarios', 'rocas', 'metricas', 'asientos'];
    const base = {
      version: 1, creada: t, sesion: null, vto: { valores: 'Servicio desde el navegador' },
      usuarios: [
        { id: 'u-admin', nombre: 'Administrador', correo: 'admin@pmbok.local', clave: 'hlocal', rol: 'admin', activo: true, creado: t },
        { id: 'usu-lola', nombre: 'Lola Local', correo: 'lola@local.test', clave: 'hlola', rol: 'director', activo: true, creado: t }
      ],
      proyectos: [{
        id: 'pro-local-1', nombre: 'Proyecto del navegador', descripcion: '', metodologia: 'predictivo',
        portafolioId: null, programaId: null, rocaId: null, inicio: '2026-09-01', fin: null,
        presupuesto: 1000, moneda: 'USD', estado: 'activo', directorId: 'usu-lola',
        fases: [{ id: 'fase-1', nombre: 'Inicio', orden: 1 }], orden: {}, creado: t
      }],
      miembros: [{ id: 'mie-1', proyectoId: 'pro-local-1', usuarioId: 'usu-lola', rol: 'lider', creado: t }],
      procesos: [{ id: 'est-1', proyectoId: 'pro-local-1', procesoId: 'p-gob-01', estado: 'completado', notas: '', creado: t }],
      archivos: [{
        id: 'arch-local-1', proyectoId: 'pro-local-1', nombre: 'evidencia local.txt', tipo: 'text/plain',
        tamano: 14, categoria: 'evidencia', autorId: 'usu-lola', almacen: 'idb', creado: t
      }]
    };
    vacias.forEach((c) => { base[c] = []; });
    localStorage.setItem('pmbok8.bd', JSON.stringify(base));

    await new Promise((resolver, rechazar) => {
      const sol = indexedDB.open('pmbok8-archivos', 1);
      sol.onupgradeneeded = () => sol.result.createObjectStore('blobs', { keyPath: 'id' });
      sol.onerror = rechazar;
      sol.onsuccess = () => {
        const tx = sol.result.transaction('blobs', 'readwrite');
        tx.objectStore('blobs').put({ id: 'arch-local-1', blob: new Blob(['desde el local'], { type: 'text/plain' }) });
        tx.oncomplete = () => { sol.result.close(); resolver(); };
        tx.onerror = rechazar;
      };
    });
  });

  await entrarComoAdmin(page, request);
  await page.goto('/#/admin');
  const panel = page.locator('#g-migracion');
  await expect(panel).toContainText('1 proyecto · 0 documentos · 1 archivo · 2 cuentas');

  await page.click('[data-g="llevar-al-servidor"]');
  await page.click('[data-d="aceptar"]');
  const aviso = page.locator('.d-panel[role="dialog"]').filter({ hasText: 'Datos llevados al servidor' });
  await expect(aviso).toContainText('1 archivo(s) subidos', { timeout: 20000 });
  await expect(aviso).toContainText('cambiar123');
  await page.click('[data-d="aceptar"]');
  await esperarGuardado(page);

  /* El servidor tiene ahora lo del navegador, con el archivo */
  await page.goto('/#/panel');
  await expect(page.locator('.g-proyecto-nombre')).toHaveText(['Proyecto del navegador']);
  await page.goto('/#/proyectos/pro-local-1/archivos');
  const [descarga] = await Promise.all([
    page.waitForEvent('download'),
    page.click('[data-o="descargar-archivo"]')
  ]);
  expect(fs.readFileSync(await descarga.path(), 'utf8')).toBe('desde el local');
  const p = (await api(page, 'GET', '/proyectos/pro-local-1')).datos;
  expect(p.progreso.completados).toBe(1);
  expect((await api(page, 'GET', '/vto')).datos).toEqual({ valores: 'Servicio desde el navegador' });

  /* La cuenta que venía del navegador entra con la provisional y debe cambiarla */
  await page.click('#btn-salir');
  await page.click('[data-d="aceptar"]');
  await entrar(page, 'lola@local.test', 'cambiar123', /#\/clave$/);
});
