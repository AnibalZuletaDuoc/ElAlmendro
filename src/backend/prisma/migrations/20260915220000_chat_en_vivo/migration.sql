-- CreateTable
CREATE TABLE "mensajes_chat" (
    "id" UUID NOT NULL,
    "emisorId" UUID NOT NULL,
    "receptorId" UUID,
    "cuerpo" TEXT NOT NULL,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leidoEn" TIMESTAMPTZ(3),

    CONSTRAINT "mensajes_chat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mensajes_chat_emisorId_receptorId_creadoEn_idx" ON "mensajes_chat"("emisorId", "receptorId", "creadoEn");

-- CreateIndex
CREATE INDEX "mensajes_chat_receptorId_leidoEn_idx" ON "mensajes_chat"("receptorId", "leidoEn");

-- CreateIndex
CREATE INDEX "mensajes_chat_creadoEn_idx" ON "mensajes_chat"("creadoEn");

-- AddForeignKey
ALTER TABLE "mensajes_chat" ADD CONSTRAINT "mensajes_chat_emisorId_fkey" FOREIGN KEY ("emisorId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes_chat" ADD CONSTRAINT "mensajes_chat_receptorId_fkey" FOREIGN KEY ("receptorId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
