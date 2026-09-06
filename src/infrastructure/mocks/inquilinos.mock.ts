import type { Inquilino } from "@/domain/entities";
import { ehDocumentoValido } from "@/domain/value-objects";
import { mesesAtras } from "./helpers";

export const inquilinosMock: Inquilino[] = [
  {
    id: "inq_01",
    nome: "Ana Beatriz Moraes",
    tipoDocumento: "cpf",
    documento: "38472619087",
    email: "ana.moraes@email.com",
    telefone: "11987654321",
    profissao: "Arquiteta",
    observacoes: "Mora com dois gatos. Sempre paga antes do vencimento.",
    ativo: true,
    dataCadastro: mesesAtras(25),
    atualizadoEm: mesesAtras(24),
  },
  {
    id: "inq_02",
    nome: "Carlos Eduardo Lima",
    tipoDocumento: "cpf",
    documento: "21598734032",
    email: "carlos.lima@email.com",
    telefone: "11991234567",
    profissao: "Analista de sistemas",
    observacoes: "Ocupou o sobrado de Santo André até o fim do contrato.",
    ativo: true,
    dataCadastro: mesesAtras(59),
    atualizadoEm: mesesAtras(41),
  },
  {
    id: "inq_03",
    nome: "Fernanda Rocha Alves",
    tipoDocumento: "cpf",
    documento: "45012398750",
    email: "fernanda.alves@email.com",
    telefone: "11996547890",
    profissao: "Professora",
    observacoes: "Saiu antes do fim do contrato por mudança de cidade.",
    ativo: false,
    dataCadastro: mesesAtras(38),
    atualizadoEm: mesesAtras(19),
  },
  {
    id: "inq_04",
    nome: "Marcos Antônio Pereira",
    tipoDocumento: "cpf",
    documento: "30987654373",
    email: "marcos.pereira@email.com",
    telefone: "11982223344",
    profissao: "Representante comercial",
    observacoes: "Atrasos recorrentes na conta de luz. Acompanhar de perto.",
    ativo: true,
    dataCadastro: mesesAtras(16),
    atualizadoEm: mesesAtras(15),
  },
  {
    id: "inq_05",
    nome: "Juliana Castro Nogueira",
    tipoDocumento: "cpf",
    documento: "27461809369",
    telefone: "11974445566",
    profissao: "Enfermeira",
    ativo: true,
    dataCadastro: mesesAtras(43),
    atualizadoEm: mesesAtras(4),
  },
  {
    id: "inq_06",
    nome: "Distribuidora Verde Vale LTDA",
    tipoDocumento: "cnpj",
    documento: "18452396000173",
    email: "financeiro@verdevale.com.br",
    telefone: "11933337788",
    profissao: "Distribuição de alimentos",
    observacoes: "Contato principal: Roberto Menezes (diretor de operações).",
    ativo: true,
    dataCadastro: mesesAtras(21),
    atualizadoEm: mesesAtras(20),
  },
];

/**
 * Os documentos do seed passam pela mesma validação do cadastro. Sem isto, um
 * CPF com dígito verificador errado só apareceria muito depois — na hora de
 * editar o inquilino, quando o formulário recusa salvar.
 */
if (process.env.NODE_ENV !== "production") {
  for (const inquilino of inquilinosMock) {
    if (!ehDocumentoValido(inquilino.tipoDocumento, inquilino.documento)) {
      throw new Error(
        `Seed inválido: o documento de ${inquilino.nome} (${inquilino.documento}) não passa na validação de dígitos.`,
      );
    }
  }
}
