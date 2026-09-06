-- CreateEnum
CREATE TYPE "TipoImovel" AS ENUM ('apartamento', 'casa', 'kitnet', 'sobrado', 'comercial', 'galpao');

-- CreateEnum
CREATE TYPE "StatusImovel" AS ENUM ('disponivel', 'alugado', 'manutencao', 'inativo');

-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('cpf', 'cnpj');

-- CreateEnum
CREATE TYPE "StatusOcupacao" AS ENUM ('ativa', 'encerrada');

-- CreateEnum
CREATE TYPE "MotivoSaida" AS ENUM ('fim_contrato', 'rescisao_inquilino', 'rescisao_proprietario', 'inadimplencia', 'outro');

-- CreateEnum
CREATE TYPE "StatusContrato" AS ENUM ('rascunho', 'vigente', 'encerrado');

-- CreateEnum
CREATE TYPE "FormaPagamento" AS ENUM ('pix', 'transferencia', 'dinheiro', 'boleto', 'cartao');

-- CreateEnum
CREATE TYPE "PapelUsuario" AS ENUM ('admin', 'gestor');

-- CreateEnum
CREATE TYPE "OrigemLead" AS ENUM ('site_imovel', 'site_contato');

-- CreateEnum
CREATE TYPE "StatusLead" AS ENUM ('novo', 'em_atendimento', 'convertido', 'descartado');

-- CreateTable
CREATE TABLE "imoveis" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo" "TipoImovel" NOT NULL,
    "status" "StatusImovel" NOT NULL,
    "logradouro" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "complemento" TEXT,
    "bairro" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" CHAR(2) NOT NULL,
    "cep" VARCHAR(8) NOT NULL,
    "valor_aluguel" DECIMAL(12,2) NOT NULL,
    "valor_condominio" DECIMAL(12,2) NOT NULL,
    "valor_iptu" DECIMAL(12,2) NOT NULL,
    "quartos" INTEGER NOT NULL,
    "suites" INTEGER NOT NULL,
    "banheiros" INTEGER NOT NULL,
    "vagas" INTEGER NOT NULL,
    "area_m2" DECIMAL(10,2) NOT NULL,
    "mobiliado" BOOLEAN NOT NULL,
    "aceita_pet" BOOLEAN NOT NULL,
    "condominio" BOOLEAN NOT NULL,
    "busca" TEXT NOT NULL,
    "criado_em" TIMESTAMPTZ(3) NOT NULL,
    "atualizado_em" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "imoveis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fotos_imovel" (
    "id" TEXT NOT NULL,
    "imovel_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "fotos_imovel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquilinos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo_documento" "TipoDocumento" NOT NULL,
    "documento" VARCHAR(14) NOT NULL,
    "email" TEXT,
    "telefone" VARCHAR(13) NOT NULL,
    "profissao" TEXT,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL,
    "busca" TEXT NOT NULL,
    "data_cadastro" TIMESTAMPTZ(3) NOT NULL,
    "atualizado_em" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "inquilinos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credenciais_inquilinos" (
    "inquilino_id" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "atualizado_em" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "credenciais_inquilinos_pkey" PRIMARY KEY ("inquilino_id")
);

-- CreateTable
CREATE TABLE "ocupacoes" (
    "id" TEXT NOT NULL,
    "imovel_id" TEXT NOT NULL,
    "inquilino_id" TEXT NOT NULL,
    "data_entrada" DATE NOT NULL,
    "data_saida" DATE,
    "status" "StatusOcupacao" NOT NULL,
    "valor_aluguel" DECIMAL(12,2) NOT NULL,
    "dia_vencimento" INTEGER NOT NULL,
    "valor_caucao" DECIMAL(12,2) NOT NULL,
    "motivo_saida" "MotivoSaida",
    "condicoes_entrega" TEXT,
    "observacoes" TEXT,
    "criado_em" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ocupacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contratos" (
    "id" TEXT NOT NULL,
    "ocupacao_id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "status" "StatusContrato" NOT NULL,
    "valor_aluguel" DECIMAL(12,2) NOT NULL,
    "valor_caucao" DECIMAL(12,2) NOT NULL,
    "dia_vencimento" INTEGER NOT NULL,
    "prazo_meses" INTEGER NOT NULL,
    "indice_reajuste" TEXT NOT NULL,
    "data_inicio" DATE NOT NULL,
    "data_fim" DATE NOT NULL,
    "clausulas_adicionais" TEXT,
    "arquivo_pdf_url" TEXT,
    "data_geracao" TIMESTAMPTZ(3),
    "criado_em" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "contratos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamentos" (
    "id" TEXT NOT NULL,
    "ocupacao_id" TEXT NOT NULL,
    "mes_referencia" VARCHAR(7) NOT NULL,
    "valor_aluguel" DECIMAL(12,2) NOT NULL,
    "valor_agua" DECIMAL(12,2) NOT NULL,
    "valor_luz" DECIMAL(12,2) NOT NULL,
    "outros_valores" DECIMAL(12,2) NOT NULL,
    "descricao_outros" TEXT,
    "data_vencimento" DATE NOT NULL,
    "criado_em" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "pagamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recebimentos" (
    "id" TEXT NOT NULL,
    "pagamento_id" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "data" DATE NOT NULL,
    "forma" "FormaPagamento" NOT NULL,
    "observacao" TEXT,

    CONSTRAINT "recebimentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "papel" "PapelUsuario" NOT NULL,
    "ativo" BOOLEAN NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "criado_em" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" VARCHAR(13) NOT NULL,
    "mensagem" TEXT NOT NULL,
    "origem" "OrigemLead" NOT NULL,
    "imovel_id" TEXT,
    "status" "StatusLead" NOT NULL,
    "criado_em" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "imoveis_status_idx" ON "imoveis"("status");

-- CreateIndex
CREATE INDEX "imoveis_cidade_bairro_idx" ON "imoveis"("cidade", "bairro");

-- CreateIndex
CREATE INDEX "fotos_imovel_imovel_id_ordem_idx" ON "fotos_imovel"("imovel_id", "ordem");

-- CreateIndex
CREATE UNIQUE INDEX "inquilinos_documento_key" ON "inquilinos"("documento");

-- CreateIndex
CREATE INDEX "inquilinos_ativo_idx" ON "inquilinos"("ativo");

-- CreateIndex
CREATE INDEX "ocupacoes_imovel_id_status_idx" ON "ocupacoes"("imovel_id", "status");

-- CreateIndex
CREATE INDEX "ocupacoes_inquilino_id_status_idx" ON "ocupacoes"("inquilino_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "contratos_numero_key" ON "contratos"("numero");

-- CreateIndex
CREATE INDEX "contratos_ocupacao_id_idx" ON "contratos"("ocupacao_id");

-- CreateIndex
CREATE INDEX "contratos_status_idx" ON "contratos"("status");

-- CreateIndex
CREATE INDEX "pagamentos_mes_referencia_idx" ON "pagamentos"("mes_referencia");

-- CreateIndex
CREATE UNIQUE INDEX "pagamentos_ocupacao_id_mes_referencia_key" ON "pagamentos"("ocupacao_id", "mes_referencia");

-- CreateIndex
CREATE INDEX "recebimentos_pagamento_id_idx" ON "recebimentos"("pagamento_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- AddForeignKey
ALTER TABLE "fotos_imovel" ADD CONSTRAINT "fotos_imovel_imovel_id_fkey" FOREIGN KEY ("imovel_id") REFERENCES "imoveis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credenciais_inquilinos" ADD CONSTRAINT "credenciais_inquilinos_inquilino_id_fkey" FOREIGN KEY ("inquilino_id") REFERENCES "inquilinos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocupacoes" ADD CONSTRAINT "ocupacoes_imovel_id_fkey" FOREIGN KEY ("imovel_id") REFERENCES "imoveis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocupacoes" ADD CONSTRAINT "ocupacoes_inquilino_id_fkey" FOREIGN KEY ("inquilino_id") REFERENCES "inquilinos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_ocupacao_id_fkey" FOREIGN KEY ("ocupacao_id") REFERENCES "ocupacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_ocupacao_id_fkey" FOREIGN KEY ("ocupacao_id") REFERENCES "ocupacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recebimentos" ADD CONSTRAINT "recebimentos_pagamento_id_fkey" FOREIGN KEY ("pagamento_id") REFERENCES "pagamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_imovel_id_fkey" FOREIGN KEY ("imovel_id") REFERENCES "imoveis"("id") ON DELETE SET NULL ON UPDATE CASCADE;
