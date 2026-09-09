-- RG do inquilino: acompanha o CPF/CNPJ no contrato de locação, não o substitui.
ALTER TABLE "inquilinos" ADD COLUMN "rg" VARCHAR(20);

-- Descrição e metragem do imóvel passam a ser opcionais: parte do acervo é
-- cadastrada sem texto de anúncio e sem a área levantada.
ALTER TABLE "imoveis" ALTER COLUMN "descricao" DROP NOT NULL;
ALTER TABLE "imoveis" ALTER COLUMN "area_m2" DROP NOT NULL;

-- Registros existentes que usavam 0 como "não informado" viram NULL de verdade.
UPDATE "imoveis" SET "area_m2" = NULL WHERE "area_m2" = 0;
UPDATE "imoveis" SET "descricao" = NULL WHERE btrim("descricao") = '';
