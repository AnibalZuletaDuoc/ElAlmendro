-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMINISTRADOR', 'TRABAJADOR');

-- CreateEnum
CREATE TYPE "EstadoProyecto" AS ENUM ('ACTIVO', 'PAUSADO', 'CERRADO');

-- CreateEnum
CREATE TYPE "EstadoSprint" AS ENUM ('PLANIFICADO', 'EN_CURSO', 'CERRADO');

-- CreateEnum
CREATE TYPE "EstadoActividad" AS ENUM ('PENDIENTE', 'EN_PROGRESO', 'BLOQUEADA', 'INCONCLUSA', 'COMPLETADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "Prioridad" AS ENUM ('BAJA', 'MEDIA', 'ALTA', 'CRITICA');

-- CreateEnum
CREATE TYPE "EstadoJornada" AS ENUM ('ABIERTA', 'CERRADA');

-- CreateEnum
CREATE TYPE "EstadoSesion" AS ENUM ('ACTIVA', 'PAUSADA', 'CERRADA', 'AUTOCERRADA');

-- CreateEnum
CREATE TYPE "DesenlaceSesion" AS ENUM ('COMPLETADA', 'INCONCLUSA');

-- CreateEnum
CREATE TYPE "RolEnProyecto" AS ENUM ('LIDER', 'MIEMBRO', 'OBSERVADOR');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "hashContrasena" TEXT NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'TRABAJADOR',
    "zonaHoraria" TEXT NOT NULL DEFAULT 'America/Santiago',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens_refresco" (
    "id" UUID NOT NULL,
    "usuarioId" UUID NOT NULL,
    "hashToken" TEXT NOT NULL,
    "familiaId" UUID NOT NULL,
    "expiraEn" TIMESTAMPTZ(3) NOT NULL,
    "revocadoEn" TIMESTAMPTZ(3),
    "reemplazadoPor" UUID,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_refresco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proyectos" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "propietarioId" UUID NOT NULL,
    "estado" "EstadoProyecto" NOT NULL DEFAULT 'ACTIVO',
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proyectos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "miembros_proyecto" (
    "proyectoId" UUID NOT NULL,
    "usuarioId" UUID NOT NULL,
    "rolEnProyecto" "RolEnProyecto" NOT NULL DEFAULT 'MIEMBRO',
    "agregadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "miembros_proyecto_pkey" PRIMARY KEY ("proyectoId","usuarioId")
);

-- CreateTable
CREATE TABLE "sprints" (
    "id" UUID NOT NULL,
    "proyectoId" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "fechaInicio" TIMESTAMPTZ(3) NOT NULL,
    "fechaTermino" TIMESTAMPTZ(3) NOT NULL,
    "objetivo" TEXT,
    "estado" "EstadoSprint" NOT NULL DEFAULT 'PLANIFICADO',

    CONSTRAINT "sprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actividades" (
    "id" UUID NOT NULL,
    "proyectoId" UUID NOT NULL,
    "sprintId" UUID,
    "actividadPadreId" UUID,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" "EstadoActividad" NOT NULL DEFAULT 'PENDIENTE',
    "prioridad" "Prioridad" NOT NULL DEFAULT 'MEDIA',
    "responsableId" UUID NOT NULL,
    "minutosEstimados" INTEGER,
    "fechaLimite" TIMESTAMPTZ(3),
    "posicionNodo" JSONB,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMPTZ(3) NOT NULL,
    "eliminadoEn" TIMESTAMPTZ(3),

    CONSTRAINT "actividades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subtareas" (
    "id" UUID NOT NULL,
    "actividadId" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "subtareas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "derivaciones" (
    "id" UUID NOT NULL,
    "actividadId" UUID NOT NULL,
    "nodoOrigenId" UUID,
    "nodoDestinoId" UUID,
    "deUsuarioId" UUID NOT NULL,
    "aUsuarioId" UUID NOT NULL,
    "motivo" TEXT NOT NULL,
    "ocurridoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "derivaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jornadas" (
    "id" UUID NOT NULL,
    "usuarioId" UUID NOT NULL,
    "inicioEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "terminoEn" TIMESTAMPTZ(3),
    "estado" "EstadoJornada" NOT NULL DEFAULT 'ABIERTA',
    "cerradaAutomaticamente" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "jornadas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesiones_trabajo" (
    "id" UUID NOT NULL,
    "actividadId" UUID NOT NULL,
    "usuarioId" UUID NOT NULL,
    "jornadaId" UUID,
    "inicioEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "terminoEn" TIMESTAMPTZ(3),
    "estado" "EstadoSesion" NOT NULL DEFAULT 'ACTIVA',
    "desenlace" "DesenlaceSesion",
    "notaCierre" TEXT,
    "cerradaAutomaticamente" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "sesiones_trabajo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tramos_sesion" (
    "id" UUID NOT NULL,
    "sesionId" UUID NOT NULL,
    "usuarioId" UUID NOT NULL,
    "inicioEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "terminoEn" TIMESTAMPTZ(3),

    CONSTRAINT "tramos_sesion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidencias" (
    "id" UUID NOT NULL,
    "actividadId" UUID,
    "sesionId" UUID,
    "subidaPorId" UUID NOT NULL,
    "claveObjeto" TEXT NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "tipoMime" TEXT NOT NULL,
    "tamanoBytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "subidaEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comentarios" (
    "id" UUID NOT NULL,
    "actividadId" UUID NOT NULL,
    "autorId" UUID NOT NULL,
    "cuerpo" TEXT NOT NULL,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comentarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_auditoria" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "accion" TEXT NOT NULL,
    "tipoEntidad" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "valorAnterior" JSONB,
    "valorNuevo" JSONB,
    "direccionIp" TEXT,
    "ocurridoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registros_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_rol_activo_idx" ON "usuarios"("rol", "activo");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_refresco_hashToken_key" ON "tokens_refresco"("hashToken");

-- CreateIndex
CREATE INDEX "tokens_refresco_usuarioId_familiaId_idx" ON "tokens_refresco"("usuarioId", "familiaId");

-- CreateIndex
CREATE INDEX "sprints_proyectoId_estado_idx" ON "sprints"("proyectoId", "estado");

-- CreateIndex
CREATE INDEX "actividades_proyectoId_estado_idx" ON "actividades"("proyectoId", "estado");

-- CreateIndex
CREATE INDEX "actividades_responsableId_estado_idx" ON "actividades"("responsableId", "estado");

-- CreateIndex
CREATE INDEX "actividades_actividadPadreId_idx" ON "actividades"("actividadPadreId");

-- CreateIndex
CREATE INDEX "subtareas_actividadId_idx" ON "subtareas"("actividadId");

-- CreateIndex
CREATE INDEX "derivaciones_actividadId_ocurridoEn_idx" ON "derivaciones"("actividadId", "ocurridoEn");

-- CreateIndex
CREATE INDEX "jornadas_usuarioId_inicioEn_idx" ON "jornadas"("usuarioId", "inicioEn");

-- CreateIndex
CREATE INDEX "sesiones_trabajo_usuarioId_inicioEn_idx" ON "sesiones_trabajo"("usuarioId", "inicioEn");

-- CreateIndex
CREATE INDEX "sesiones_trabajo_actividadId_idx" ON "sesiones_trabajo"("actividadId");

-- CreateIndex
CREATE INDEX "tramos_sesion_sesionId_idx" ON "tramos_sesion"("sesionId");

-- CreateIndex
CREATE INDEX "tramos_sesion_usuarioId_inicioEn_idx" ON "tramos_sesion"("usuarioId", "inicioEn");

-- CreateIndex
CREATE UNIQUE INDEX "evidencias_claveObjeto_key" ON "evidencias"("claveObjeto");

-- CreateIndex
CREATE INDEX "evidencias_actividadId_idx" ON "evidencias"("actividadId");

-- CreateIndex
CREATE INDEX "evidencias_sesionId_idx" ON "evidencias"("sesionId");

-- CreateIndex
CREATE INDEX "comentarios_actividadId_creadoEn_idx" ON "comentarios"("actividadId", "creadoEn");

-- CreateIndex
CREATE INDEX "registros_auditoria_tipoEntidad_entidadId_ocurridoEn_idx" ON "registros_auditoria"("tipoEntidad", "entidadId", "ocurridoEn");

-- AddForeignKey
ALTER TABLE "tokens_refresco" ADD CONSTRAINT "tokens_refresco_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_propietarioId_fkey" FOREIGN KEY ("propietarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "miembros_proyecto" ADD CONSTRAINT "miembros_proyecto_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "miembros_proyecto" ADD CONSTRAINT "miembros_proyecto_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sprints" ADD CONSTRAINT "sprints_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades" ADD CONSTRAINT "actividades_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades" ADD CONSTRAINT "actividades_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "sprints"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades" ADD CONSTRAINT "actividades_actividadPadreId_fkey" FOREIGN KEY ("actividadPadreId") REFERENCES "actividades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades" ADD CONSTRAINT "actividades_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subtareas" ADD CONSTRAINT "subtareas_actividadId_fkey" FOREIGN KEY ("actividadId") REFERENCES "actividades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "derivaciones" ADD CONSTRAINT "derivaciones_actividadId_fkey" FOREIGN KEY ("actividadId") REFERENCES "actividades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "derivaciones" ADD CONSTRAINT "derivaciones_nodoOrigenId_fkey" FOREIGN KEY ("nodoOrigenId") REFERENCES "actividades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "derivaciones" ADD CONSTRAINT "derivaciones_nodoDestinoId_fkey" FOREIGN KEY ("nodoDestinoId") REFERENCES "actividades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "derivaciones" ADD CONSTRAINT "derivaciones_deUsuarioId_fkey" FOREIGN KEY ("deUsuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "derivaciones" ADD CONSTRAINT "derivaciones_aUsuarioId_fkey" FOREIGN KEY ("aUsuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jornadas" ADD CONSTRAINT "jornadas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones_trabajo" ADD CONSTRAINT "sesiones_trabajo_actividadId_fkey" FOREIGN KEY ("actividadId") REFERENCES "actividades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones_trabajo" ADD CONSTRAINT "sesiones_trabajo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones_trabajo" ADD CONSTRAINT "sesiones_trabajo_jornadaId_fkey" FOREIGN KEY ("jornadaId") REFERENCES "jornadas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tramos_sesion" ADD CONSTRAINT "tramos_sesion_sesionId_fkey" FOREIGN KEY ("sesionId") REFERENCES "sesiones_trabajo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidencias" ADD CONSTRAINT "evidencias_actividadId_fkey" FOREIGN KEY ("actividadId") REFERENCES "actividades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidencias" ADD CONSTRAINT "evidencias_sesionId_fkey" FOREIGN KEY ("sesionId") REFERENCES "sesiones_trabajo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidencias" ADD CONSTRAINT "evidencias_subidaPorId_fkey" FOREIGN KEY ("subidaPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_actividadId_fkey" FOREIGN KEY ("actividadId") REFERENCES "actividades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_auditoria" ADD CONSTRAINT "registros_auditoria_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
