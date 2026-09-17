-- ═══════════════════════════════════════════════════════════
-- 001_esquema.sql — Esquema relacional del Gestor PMBOK 8
-- ───────────────────────────────────────────────────────────
-- Criterio de modelado:
--   · Entidades y series temporales en tablas propias
--     (riesgos, tareas, burndown diario, scorecard semanal…).
--   · Listas pequeñas de configuración que la interfaz edita
--     enteras (fases, hitos, DoD, metas de una roca, orden del
--     flujo, estado de la verificación de calidad) en JSONB.
--   · Los identificadores son TEXT para conservar los que ya
--     genera el navegador al importar sus datos.
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION fijar_actualizado() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.actualizado := now();
  RETURN NEW;
END;
$$;

-- ══════════════ Catálogo de la guía ══════════════
-- Se sincroniza desde assets/js/datos al migrar y al arrancar.

CREATE TABLE catalogo_procesos (
  id        TEXT PRIMARY KEY,
  codigo    TEXT NOT NULL,
  nombre    TEXT NOT NULL,
  dominio   TEXT NOT NULL,
  banda     TEXT NOT NULL CHECK (banda IN ('inicio','planificacion','ejecucion','monitoreo','cierre')),
  orden     INTEGER NOT NULL
);

CREATE TABLE catalogo_artefactos (
  id        TEXT PRIMARY KEY,
  nombre    TEXT NOT NULL,
  categoria TEXT NOT NULL,
  bloques   INTEGER NOT NULL DEFAULT 0
);

-- ══════════════ Usuarios y sesiones ══════════════

CREATE TABLE usuarios (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nombre      TEXT NOT NULL CHECK (length(btrim(nombre)) > 0),
  correo      TEXT NOT NULL CHECK (correo = lower(btrim(correo)) AND correo ~ '^[^@\s]+@[^@\s]+$'),
  clave_hash  TEXT NOT NULL,
  rol         TEXT NOT NULL DEFAULT 'miembro' CHECK (rol IN ('admin','director','miembro','ejecutor')),
  activo      BOOLEAN NOT NULL DEFAULT true,
  creado      TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado TIMESTAMPTZ
);
CREATE UNIQUE INDEX usuarios_correo_uk ON usuarios (correo);

CREATE TABLE sesiones (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  usuario_id  TEXT NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  creada      TIMESTAMPTZ NOT NULL DEFAULT now(),
  expira      TIMESTAMPTZ NOT NULL,
  revocada    TIMESTAMPTZ,
  ip          TEXT,
  agente      TEXT
);
CREATE INDEX sesiones_usuario_ix ON sesiones (usuario_id) WHERE revocada IS NULL;

-- ══════════════ Portafolios, programas y EOS ══════════════

CREATE TABLE portafolios (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nombre      TEXT NOT NULL CHECK (length(btrim(nombre)) > 0),
  descripcion TEXT NOT NULL DEFAULT '',
  creado      TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado TIMESTAMPTZ
);

CREATE TABLE programas (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  portafolio_id TEXT NOT NULL REFERENCES portafolios (id) ON DELETE CASCADE,
  nombre        TEXT NOT NULL CHECK (length(btrim(nombre)) > 0),
  descripcion   TEXT NOT NULL DEFAULT '',
  creado        TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado   TIMESTAMPTZ
);
CREATE INDEX programas_portafolio_ix ON programas (portafolio_id);

CREATE TABLE rocas (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  trimestre      TEXT NOT NULL CHECK (trimestre ~ '^Q[1-4]-[0-9]{4}$'),
  titulo         TEXT NOT NULL CHECK (length(btrim(titulo)) > 0),
  descripcion    TEXT NOT NULL DEFAULT '',
  responsable_id TEXT REFERENCES usuarios (id) ON DELETE SET NULL,
  estado         TEXT NOT NULL DEFAULT 'encamino' CHECK (estado IN ('encamino','riesgo','fuera','lograda')),
  metas          JSONB NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(metas) = 'array'),
  creado         TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado    TIMESTAMPTZ
);
CREATE INDEX rocas_trimestre_ix ON rocas (trimestre);

CREATE TABLE metricas (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nombre         TEXT NOT NULL CHECK (length(btrim(nombre)) > 0),
  meta           TEXT NOT NULL DEFAULT '',
  responsable_id TEXT REFERENCES usuarios (id) ON DELETE SET NULL,
  direccion      TEXT NOT NULL DEFAULT 'mayor' CHECK (direccion IN ('mayor','menor')),
  creado         TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado    TIMESTAMPTZ
);

CREATE TABLE metrica_valores (
  metrica_id TEXT NOT NULL REFERENCES metricas (id) ON DELETE CASCADE,
  semana     TEXT NOT NULL CHECK (length(semana) BETWEEN 1 AND 20),
  valor      TEXT NOT NULL CHECK (length(btrim(valor)) > 0),
  PRIMARY KEY (metrica_id, semana)
);

CREATE TABLE asientos (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nombre      TEXT NOT NULL CHECK (length(btrim(nombre)) > 0),
  gwt         TEXT NOT NULL DEFAULT '',
  persona_id  TEXT REFERENCES usuarios (id) ON DELETE SET NULL,
  padre_id    TEXT REFERENCES asientos (id) ON DELETE CASCADE,
  creado      TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado TIMESTAMPTZ,
  CHECK (padre_id IS NULL OR padre_id <> id)
);
CREATE INDEX asientos_padre_ix ON asientos (padre_id);

CREATE TABLE vto (
  bloque_id   TEXT PRIMARY KEY,
  texto       TEXT NOT NULL,
  actualizado TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ══════════════ Proyectos ══════════════

CREATE TABLE proyectos (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nombre        TEXT NOT NULL CHECK (length(btrim(nombre)) > 0),
  descripcion   TEXT NOT NULL DEFAULT '',
  metodologia   TEXT NOT NULL DEFAULT 'predictivo' CHECK (metodologia IN ('predictivo','agil','hibrido','kanban')),
  portafolio_id TEXT REFERENCES portafolios (id) ON DELETE SET NULL,
  programa_id   TEXT REFERENCES programas (id) ON DELETE SET NULL,
  roca_id       TEXT REFERENCES rocas (id) ON DELETE SET NULL,
  inicio        DATE,
  fin           DATE,
  presupuesto   NUMERIC(18,2) CHECK (presupuesto IS NULL OR presupuesto >= 0),
  moneda        TEXT NOT NULL DEFAULT 'USD' CHECK (moneda ~ '^[A-Z]{3}$'),
  estado        TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo','pausa','cerrado','cancelado')),
  director_id   TEXT REFERENCES usuarios (id) ON DELETE SET NULL,
  wip           INTEGER NOT NULL DEFAULT 3 CHECK (wip >= 1),
  fases         JSONB NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(fases) = 'array'),
  orden         JSONB NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(orden) = 'object'),
  hitos         JSONB NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(hitos) = 'array'),
  dod           JSONB CHECK (dod IS NULL OR jsonb_typeof(dod) = 'array'),
  calidad       JSONB CHECK (calidad IS NULL OR jsonb_typeof(calidad) = 'object'),
  creado        TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado   TIMESTAMPTZ,
  CONSTRAINT proyectos_fechas_ck CHECK (inicio IS NULL OR fin IS NULL OR fin >= inicio)
);
CREATE INDEX proyectos_portafolio_ix ON proyectos (portafolio_id);
CREATE INDEX proyectos_programa_ix ON proyectos (programa_id);
CREATE INDEX proyectos_director_ix ON proyectos (director_id);

CREATE TABLE miembros (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  proyecto_id TEXT NOT NULL REFERENCES proyectos (id) ON DELETE CASCADE,
  usuario_id  TEXT NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  rol         TEXT NOT NULL DEFAULT 'equipo' CHECK (rol IN ('lider','po','sm','equipo','ejecutor','observador')),
  creado      TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado TIMESTAMPTZ,
  CONSTRAINT miembros_proyecto_usuario_uk UNIQUE (proyecto_id, usuario_id)
);
CREATE INDEX miembros_usuario_ix ON miembros (usuario_id);

CREATE TABLE permisos (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  usuario_id  TEXT NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  ambito      TEXT NOT NULL CHECK (ambito IN ('portafolio','programa','proyecto')),
  ref_id      TEXT NOT NULL,
  nivel       TEXT NOT NULL CHECK (nivel IN ('ver','editar','dirigir')),
  creado      TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado TIMESTAMPTZ,
  CONSTRAINT permisos_usuario_ambito_ref_uk UNIQUE (usuario_id, ambito, ref_id)
);
CREATE INDEX permisos_ref_ix ON permisos (ambito, ref_id);

-- Estado de cada uno de los 40 procesos dentro de un proyecto
CREATE TABLE proyecto_procesos (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  proyecto_id TEXT NOT NULL REFERENCES proyectos (id) ON DELETE CASCADE,
  proceso_id  TEXT NOT NULL REFERENCES catalogo_procesos (id),
  estado      TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','iniciado','completado','omitido')),
  notas       TEXT NOT NULL DEFAULT '',
  fecha       TIMESTAMPTZ,
  creado      TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado TIMESTAMPTZ,
  CONSTRAINT proyecto_procesos_uk UNIQUE (proyecto_id, proceso_id)
);

CREATE TABLE documentos (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  proyecto_id  TEXT NOT NULL REFERENCES proyectos (id) ON DELETE CASCADE,
  artefacto_id TEXT NOT NULL REFERENCES catalogo_artefactos (id),
  nombre       TEXT NOT NULL,
  categoria    TEXT NOT NULL DEFAULT '',
  version      INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  estado       TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador','revision','aprobado')),
  proceso_id   TEXT REFERENCES catalogo_procesos (id),
  contenido    JSONB NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(contenido) = 'object'),
  autor_id     TEXT REFERENCES usuarios (id) ON DELETE SET NULL,
  aprobado     TIMESTAMPTZ,
  creado       TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado  TIMESTAMPTZ,
  CONSTRAINT documentos_proyecto_artefacto_uk UNIQUE (proyecto_id, artefacto_id)
);

CREATE TABLE archivos (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  proyecto_id TEXT NOT NULL REFERENCES proyectos (id) ON DELETE CASCADE,
  nombre      TEXT NOT NULL CHECK (length(btrim(nombre)) > 0),
  tipo        TEXT NOT NULL DEFAULT 'application/octet-stream',
  tamano      BIGINT NOT NULL DEFAULT 0 CHECK (tamano >= 0),
  categoria   TEXT NOT NULL DEFAULT 'general',
  autor_id    TEXT REFERENCES usuarios (id) ON DELETE SET NULL,
  almacen     TEXT NOT NULL DEFAULT 'bd',
  creado      TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado TIMESTAMPTZ
);
CREATE INDEX archivos_proyecto_ix ON archivos (proyecto_id);

-- El binario va aparte: listar archivos no arrastra su contenido
CREATE TABLE archivo_contenidos (
  archivo_id TEXT PRIMARY KEY REFERENCES archivos (id) ON DELETE CASCADE,
  datos      BYTEA NOT NULL
);

CREATE TABLE riesgos (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  proyecto_id    TEXT NOT NULL REFERENCES proyectos (id) ON DELETE CASCADE,
  titulo         TEXT NOT NULL CHECK (length(btrim(titulo)) > 0),
  p              SMALLINT NOT NULL DEFAULT 3 CHECK (p BETWEEN 1 AND 5),
  i              SMALLINT NOT NULL DEFAULT 3 CHECK (i BETWEEN 1 AND 5),
  estrategia     TEXT NOT NULL DEFAULT 'mitigar'
                 CHECK (estrategia IN ('','mitigar','evitar','transferir','aceptar','escalar','explotar','mejorar','compartir')),
  respuesta      TEXT NOT NULL DEFAULT '',
  responsable_id TEXT REFERENCES usuarios (id) ON DELETE SET NULL,
  estado         TEXT NOT NULL DEFAULT 'activo',
  creado         TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado    TIMESTAMPTZ
);
CREATE INDEX riesgos_proyecto_ix ON riesgos (proyecto_id);

CREATE TABLE interesados (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  proyecto_id TEXT NOT NULL REFERENCES proyectos (id) ON DELETE CASCADE,
  nombre      TEXT NOT NULL CHECK (length(btrim(nombre)) > 0),
  rol         TEXT NOT NULL DEFAULT '',
  poder       SMALLINT NOT NULL DEFAULT 3 CHECK (poder BETWEEN 1 AND 5),
  influencia  SMALLINT NOT NULL DEFAULT 3 CHECK (influencia BETWEEN 1 AND 5),
  actual      TEXT NOT NULL DEFAULT '',
  deseado     TEXT NOT NULL DEFAULT '',
  estrategia  TEXT NOT NULL DEFAULT '',
  creado      TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado TIMESTAMPTZ
);
CREATE INDEX interesados_proyecto_ix ON interesados (proyecto_id);

CREATE TABLE cambios (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  proyecto_id TEXT NOT NULL REFERENCES proyectos (id) ON DELETE CASCADE,
  titulo      TEXT NOT NULL CHECK (length(btrim(titulo)) > 0),
  descripcion TEXT NOT NULL DEFAULT '',
  solicitante TEXT NOT NULL DEFAULT '',
  impacto     TEXT NOT NULL DEFAULT '',
  decision    TEXT NOT NULL DEFAULT 'pendiente' CHECK (decision IN ('pendiente','aprobado','rechazado','diferido')),
  creado      TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado TIMESTAMPTZ
);
CREATE INDEX cambios_proyecto_ix ON cambios (proyecto_id);

CREATE TABLE lecciones (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  proyecto_id   TEXT NOT NULL REFERENCES proyectos (id) ON DELETE CASCADE,
  situacion     TEXT NOT NULL CHECK (length(btrim(situacion)) > 0),
  causa         TEXT NOT NULL DEFAULT '',
  recomendacion TEXT NOT NULL DEFAULT '',
  dominio       TEXT NOT NULL DEFAULT '',
  creado        TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado   TIMESTAMPTZ
);
CREATE INDEX lecciones_proyecto_ix ON lecciones (proyecto_id);

CREATE TABLE sprints (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  proyecto_id  TEXT NOT NULL REFERENCES proyectos (id) ON DELETE CASCADE,
  nombre       TEXT NOT NULL CHECK (length(btrim(nombre)) > 0),
  objetivo     TEXT NOT NULL DEFAULT '',
  dias         INTEGER NOT NULL DEFAULT 14 CHECK (dias BETWEEN 1 AND 365),
  estado       TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('planificado','activo','cerrado')),
  comprometido NUMERIC(10,2) NOT NULL DEFAULT 0,
  entregado    NUMERIC(10,2) NOT NULL DEFAULT 0,
  inicio       DATE,
  fin          DATE,
  cierre       TIMESTAMPTZ,
  creado       TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado  TIMESTAMPTZ,
  CONSTRAINT sprints_proyecto_id_uk UNIQUE (proyecto_id, id)
);
-- Un proyecto tiene como mucho un sprint activo
CREATE UNIQUE INDEX sprints_un_activo_uk ON sprints (proyecto_id) WHERE estado = 'activo';

-- Fotografía diaria de puntos pendientes: el burndown real
CREATE TABLE sprint_burndown (
  sprint_id    TEXT NOT NULL REFERENCES sprints (id) ON DELETE CASCADE,
  fecha        DATE NOT NULL,
  restante     NUMERIC(10,2) NOT NULL DEFAULT 0,
  comprometido NUMERIC(10,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (sprint_id, fecha)
);

CREATE TABLE tareas (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  proyecto_id    TEXT NOT NULL REFERENCES proyectos (id) ON DELETE CASCADE,
  sprint_id      TEXT,
  titulo         TEXT NOT NULL CHECK (length(btrim(titulo)) > 0),
  puntos         NUMERIC(10,2) CHECK (puntos IS NULL OR puntos >= 0),
  fecha_limite   DATE,
  responsable_id TEXT REFERENCES usuarios (id) ON DELETE SET NULL,
  criterios      TEXT NOT NULL DEFAULT '',
  estado         TEXT NOT NULL DEFAULT 'backlog' CHECK (estado IN ('backlog','pendiente','curso','revision','hecho')),
  prioridad      INTEGER,
  creado         TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado    TIMESTAMPTZ,
  -- La tarea solo puede pertenecer a un sprint de su mismo proyecto
  CONSTRAINT tareas_sprint_fk FOREIGN KEY (proyecto_id, sprint_id)
    REFERENCES sprints (proyecto_id, id) ON DELETE SET NULL (sprint_id)
);
CREATE INDEX tareas_proyecto_ix ON tareas (proyecto_id);
CREATE INDEX tareas_sprint_ix ON tareas (sprint_id);

CREATE TABLE mediciones (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  proyecto_id TEXT NOT NULL REFERENCES proyectos (id) ON DELETE CASCADE,
  fecha       DATE NOT NULL DEFAULT CURRENT_DATE,
  pv          NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (pv >= 0),
  ev          NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (ev >= 0),
  ac          NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (ac >= 0),
  nota        TEXT NOT NULL DEFAULT '',
  creado      TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado TIMESTAMPTZ
);
CREATE INDEX mediciones_proyecto_fecha_ix ON mediciones (proyecto_id, fecha);

CREATE TABLE comentarios (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  proyecto_id TEXT NOT NULL REFERENCES proyectos (id) ON DELETE CASCADE,
  autor_id    TEXT REFERENCES usuarios (id) ON DELETE SET NULL,
  ref_tipo    TEXT NOT NULL DEFAULT '',
  ref_id      TEXT,
  texto       TEXT NOT NULL CHECK (length(btrim(texto)) > 0),
  creado      TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado TIMESTAMPTZ
);
CREATE INDEX comentarios_proyecto_ix ON comentarios (proyecto_id);

-- ══════════════ Disparadores de «actualizado» ══════════════

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'usuarios','portafolios','programas','rocas','metricas','asientos','proyectos','miembros',
    'permisos','proyecto_procesos','documentos','archivos','riesgos','interesados','cambios',
    'lecciones','sprints','tareas','mediciones','comentarios'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION fijar_actualizado()',
      t || '_actualizado_tg', t);
  END LOOP;
END;
$$;

-- ══════════════ Integridad de los permisos ══════════════
-- ref_id apunta a una tabla distinta según el ámbito, así que la
-- clave foránea se garantiza con disparadores.

CREATE OR REPLACE FUNCTION validar_permiso() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE existe BOOLEAN;
BEGIN
  EXECUTE format('SELECT EXISTS (SELECT 1 FROM %I WHERE id = $1)',
    CASE NEW.ambito WHEN 'portafolio' THEN 'portafolios'
                    WHEN 'programa'   THEN 'programas'
                    ELSE 'proyectos' END)
    INTO existe USING NEW.ref_id;
  IF NOT existe THEN
    RAISE EXCEPTION 'El % % no existe', NEW.ambito, NEW.ref_id
      USING ERRCODE = 'foreign_key_violation', CONSTRAINT = 'permisos_ref_fk';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER permisos_validar_tg
  BEFORE INSERT OR UPDATE OF ambito, ref_id ON permisos
  FOR EACH ROW EXECUTE FUNCTION validar_permiso();

CREATE OR REPLACE FUNCTION limpiar_permisos() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM permisos WHERE ambito = TG_ARGV[0] AND ref_id = OLD.id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER portafolios_limpiar_permisos_tg AFTER DELETE ON portafolios
  FOR EACH ROW EXECUTE FUNCTION limpiar_permisos('portafolio');
CREATE TRIGGER programas_limpiar_permisos_tg AFTER DELETE ON programas
  FOR EACH ROW EXECUTE FUNCTION limpiar_permisos('programa');
CREATE TRIGGER proyectos_limpiar_permisos_tg AFTER DELETE ON proyectos
  FOR EACH ROW EXECUTE FUNCTION limpiar_permisos('proyecto');

-- ══════════════ Nivel efectivo de acceso ══════════════
-- 0 sin acceso · 1 ver · 2 editar · 3 dirigir.
-- Administrador y director del proyecto: dirigir. Después se toma
-- el mayor entre los permisos por ámbito y la membresía (líder
-- dirige; el resto de miembros edita). Los permisos se suman y
-- gana el más alto.

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
        SELECT max(CASE WHEN m.rol = 'lider' THEN 3 ELSE 2 END)
        FROM miembros m
        WHERE m.proyecto_id = p.id AND m.usuario_id = u.id
      ), 0))
  END
  FROM (SELECT 1) AS uno
  LEFT JOIN usuarios u ON u.id = p_usuario
  LEFT JOIN proyectos p ON p.id = p_proyecto;
$$;

-- Avance de los procesos por proyecto
CREATE VIEW v_progreso_proyecto AS
SELECT pr.id AS proyecto_id,
       count(pp.id) FILTER (WHERE pp.estado = 'completado') AS completados,
       count(pp.id) FILTER (WHERE pp.estado = 'omitido')    AS omitidos,
       (SELECT count(*) FROM catalogo_procesos)             AS total
FROM proyectos pr
LEFT JOIN proyecto_procesos pp ON pp.proyecto_id = pr.id
GROUP BY pr.id;
