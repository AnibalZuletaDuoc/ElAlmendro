-- ---------------------------------------------------------------------------
-- TimeFlow - reglas de integridad exigidas al motor
-- Fuente: "Arquitectura del Sistema TimeFlow", seccion 4.4.1.
--
-- Estas invariantes NO se implementan solo en la aplicacion: su violacion
-- comprometeria la credibilidad del registro de tiempo, de modo que no deben
-- depender de la correccion del codigo.
--
-- Este archivo es idempotente: se puede ejecutar todas las veces que haga
-- falta. Se aplica automaticamente despues de cada `prisma migrate`.
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 1. Un trabajador no puede tener mas de una sesion activa.
--    Indice unico parcial sobre usuarioId con condicion de estado activo.
DROP INDEX IF EXISTS ux_sesion_activa_por_usuario;
CREATE UNIQUE INDEX ux_sesion_activa_por_usuario
  ON sesiones_trabajo ("usuarioId")
  WHERE estado IN ('ACTIVA', 'PAUSADA');

-- 2. Un trabajador no puede tener mas de una jornada abierta.
DROP INDEX IF EXISTS ux_jornada_abierta_por_usuario;
CREATE UNIQUE INDEX ux_jornada_abierta_por_usuario
  ON jornadas ("usuarioId")
  WHERE "terminoEn" IS NULL;

-- 3. El termino debe ser posterior al inicio (sesiones, tramos y jornadas).
ALTER TABLE jornadas DROP CONSTRAINT IF EXISTS ck_jornada_termino_posterior;
ALTER TABLE jornadas ADD CONSTRAINT ck_jornada_termino_posterior
  CHECK ("terminoEn" IS NULL OR "terminoEn" > "inicioEn");

ALTER TABLE sesiones_trabajo DROP CONSTRAINT IF EXISTS ck_sesion_termino_posterior;
ALTER TABLE sesiones_trabajo ADD CONSTRAINT ck_sesion_termino_posterior
  CHECK ("terminoEn" IS NULL OR "terminoEn" > "inicioEn");

ALTER TABLE tramos_sesion DROP CONSTRAINT IF EXISTS ck_tramo_termino_posterior;
ALTER TABLE tramos_sesion ADD CONSTRAINT ck_tramo_termino_posterior
  CHECK ("terminoEn" IS NULL OR "terminoEn" > "inicioEn");

-- 4. Los tramos de un mismo usuario no pueden solaparse.
--    Restriccion de exclusion mediante btree_gist: garantiza que la suma de
--    tramos represente tiempo real y no tiempo contabilizado dos veces.
ALTER TABLE tramos_sesion DROP CONSTRAINT IF EXISTS ex_tramos_sin_solape;
ALTER TABLE tramos_sesion ADD CONSTRAINT ex_tramos_sin_solape
  EXCLUDE USING gist (
    "usuarioId" WITH =,
    tstzrange("inicioEn", COALESCE("terminoEn", 'infinity'::timestamptz)) WITH &&
  );

-- 5. Una sesion inconclusa exige nota de cierre (flujo 5.2).
ALTER TABLE sesiones_trabajo DROP CONSTRAINT IF EXISTS ck_sesion_nota_si_inconclusa;
ALTER TABLE sesiones_trabajo ADD CONSTRAINT ck_sesion_nota_si_inconclusa
  CHECK (desenlace IS DISTINCT FROM 'INCONCLUSA' OR length(coalesce("notaCierre", '')) > 0);

-- 6. Una evidencia cuelga de una actividad o de una sesion, pero no de nada.
ALTER TABLE evidencias DROP CONSTRAINT IF EXISTS ck_evidencia_tiene_dueno;
ALTER TABLE evidencias ADD CONSTRAINT ck_evidencia_tiene_dueno
  CHECK ("actividadId" IS NOT NULL OR "sesionId" IS NOT NULL);

-- 7. La derivacion exige motivo no vacio (criterio de aceptacion de US-06).
ALTER TABLE derivaciones DROP CONSTRAINT IF EXISTS ck_derivacion_motivo;
ALTER TABLE derivaciones ADD CONSTRAINT ck_derivacion_motivo
  CHECK (length(btrim(motivo)) > 0);

-- 8. La auditoria es inmutable: solo escritura.
--    Se implementa con disparador porque en desarrollo la aplicacion usa el
--    mismo rol que las migraciones; en produccion se acompana ademas de
--    REVOKE UPDATE, DELETE ON registros_auditoria al rol de la aplicacion.
CREATE OR REPLACE FUNCTION fn_auditoria_inmutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'La bitacora de auditoria es de solo escritura (%).', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tg_auditoria_inmutable ON registros_auditoria;
CREATE TRIGGER tg_auditoria_inmutable
  BEFORE UPDATE OR DELETE ON registros_auditoria
  FOR EACH ROW EXECUTE FUNCTION fn_auditoria_inmutable();

-- 9. Las sesiones y evidencias no se eliminan: el borrado logico existe solo
--    en actividades. La evidencia debe permanecer disponible para revision.
CREATE OR REPLACE FUNCTION fn_prohibir_borrado() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Los registros de % no pueden eliminarse.', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tg_no_borrar_sesiones ON sesiones_trabajo;
CREATE TRIGGER tg_no_borrar_sesiones
  BEFORE DELETE ON sesiones_trabajo
  FOR EACH ROW EXECUTE FUNCTION fn_prohibir_borrado();

DROP TRIGGER IF EXISTS tg_no_borrar_evidencias ON evidencias;
CREATE TRIGGER tg_no_borrar_evidencias
  BEFORE DELETE ON evidencias
  FOR EACH ROW EXECUTE FUNCTION fn_prohibir_borrado();
