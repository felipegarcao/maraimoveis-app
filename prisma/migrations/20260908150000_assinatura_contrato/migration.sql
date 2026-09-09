-- CreateEnum
CREATE TYPE "StatusAssinatura" AS ENUM ('pendente', 'enviada', 'assinada');

-- CreateEnum
CREATE TYPE "OrigemAssinatura" AS ENUM ('digital', 'sistema');

-- AlterTable
ALTER TABLE "contratos" ADD COLUMN "status_assinatura" "StatusAssinatura" NOT NULL DEFAULT 'pendente',
ADD COLUMN "assinatura_telefone" TEXT,
ADD COLUMN "assinatura_enviada_em" TIMESTAMPTZ(3),
ADD COLUMN "assinatura_origem" "OrigemAssinatura",
ADD COLUMN "arquivo_assinado_url" TEXT,
ADD COLUMN "assinado_em" TIMESTAMPTZ(3);
