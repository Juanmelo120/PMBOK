-- ═══════════════════════════════════════════════════════════
-- 002_cambio_de_clave.sql — Contraseña que su dueño debe cambiar
-- ───────────────────────────────────────────────────────────
-- Se marca en las cuentas cuya contraseña conoce otra persona:
-- la inicial (admin123), las que crea o restablece un administrador
-- y las importadas con la contraseña provisional. Mientras esté
-- marcada, la API solo permite ver el perfil, cambiarla o salir.
-- ═══════════════════════════════════════════════════════════

ALTER TABLE usuarios ADD COLUMN debe_cambiar_clave BOOLEAN NOT NULL DEFAULT false;

-- Las cuentas que ya existen con la clave inicial también deben cambiarla
UPDATE usuarios SET debe_cambiar_clave = true WHERE id = 'u-admin';

-- Sesiones: la purga periódica busca por caducidad
CREATE INDEX sesiones_expira_ix ON sesiones (expira);
