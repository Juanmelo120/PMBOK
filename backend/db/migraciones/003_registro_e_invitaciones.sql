-- ═══════════════════════════════════════════════════════════
-- 003_registro_e_invitaciones.sql — Cuentas propias y equipos por código
-- ───────────────────────────────────────────────────────────
-- Pensado para un aula: cada alumno crea su cuenta, el líder de
-- cada grupo genera un código de invitación y sus compañeros
-- entran con él al proyecto.
--   · usuarios.origen: quién creó la cuenta (administrador,
--     registro propio o importación).
--   · invitaciones: códigos de un proyecto con el rol que dan.
--   · nivel_en: el rol «observador» pasa a ser solo lectura.
-- ═══════════════════════════════════════════════════════════

ALTER TABLE usuarios ADD COLUMN origen TEXT NOT NULL DEFAULT 'admin'
  CHECK (origen IN ('admin', 'registro', 'importacion'));

CREATE TABLE invitaciones (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  proyecto_id TEXT NOT NULL REFERENCES proyectos (id) ON DELETE CASCADE,
  -- 8 caracteres sin los que se confunden (0/O, 1/I)
  codigo      TEXT NOT NULL CHECK (codigo ~ '^[A-HJ-NP-Z2-9]{8}$'),
  -- «lider» nunca se regala con un código: lo concede el líder a mano
  rol         TEXT NOT NULL DEFAULT 'equipo' CHECK (rol IN ('po','sm','equipo','ejecutor','observador')),
  expira      TIMESTAMPTZ,
  usos        INTEGER NOT NULL DEFAULT 0 CHECK (usos >= 0),
  creado_por  TEXT REFERENCES usuarios (id) ON DELETE SET NULL,
  creado      TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado TIMESTAMPTZ,
  CONSTRAINT invitaciones_codigo_uk UNIQUE (codigo)
);
CREATE INDEX invitaciones_proyecto_ix ON invitaciones (proyecto_id);

CREATE TRIGGER invitaciones_actualizado_tg BEFORE UPDATE ON invitaciones
  FOR EACH ROW EXECUTE FUNCTION fijar_actualizado();

-- Nivel efectivo: igual que en 001, salvo que el observador solo ve
CREATE OR REPLACE FUNCTION nivel_en(p_proyecto TEXT, p_usuario TEXT) RETURNS INTEGER
LANGUAGE sql STABLE AS $$
  SELECT CASE
    WHEN u.id IS NULL OR NOT u.activo THEN 0
    WHEN u.rol = 'admin' THEN 3
    WHEN p.id IS NULL THEN 0
    WHEN p.director_id = u.id THEN 3
    ELSE GREATEST(
      COALESCE((
        SELECT max(CASE pe.nivel WHEN 'ver' THEN 1 WHEN 'editar' THEN 2 WHEN 'dirigir' THEN 3 END)
        FROM permisos pe
        WHERE pe.usuario_id = u.id AND (
             (pe.ambito = 'proyecto'   AND pe.ref_id = p.id)
          OR (pe.ambito = 'programa'   AND pe.ref_id = p.programa_id)
          OR (pe.ambito = 'portafolio' AND pe.ref_id = p.portafolio_id))
      ), 0),
      COALESCE((
        SELECT max(CASE m.rol WHEN 'lider' THEN 3 WHEN 'observador' THEN 1 ELSE 2 END)
        FROM miembros m
        WHERE m.proyecto_id = p.id AND m.usuario_id = u.id
      ), 0))
  END
  FROM (SELECT 1) AS uno
  LEFT JOIN usuarios u ON u.id = p_usuario
  LEFT JOIN proyectos p ON p.id = p_proyecto;
$$;
