import { z } from "zod";
import {
  FORMAS_PAGAMENTO,
  MOTIVOS_SAIDA,
  STATUS_IMOVEL,
  STATUS_LEAD,
  TIPOS_DOCUMENTO,
  TIPOS_IMOVEL,
} from "@/domain/entities";
import { ehCnpjValido, ehCpfValido, ehTelefoneValido } from "./validadores";

/**
 * Fonte única de validação: os mesmos schemas rodam no formulário (react-hook-form)
 * e dentro da Server Action, então o servidor nunca confia no cliente.
 */

const dinheiro = (rotulo: string) =>
  z.coerce
    .number({ invalid_type_error: `Informe ${rotulo} em números.` })
    .min(0, `${rotulo} não pode ser negativo.`)
    .max(9_999_999, `${rotulo} parece alto demais. Confira o valor.`);

/**
 * Número que o formulário pode deixar em branco. O campo entrega `undefined`
 * (via `setValueAs`) em vez de "": `z.coerce.number()` leria "" como 0, e o
 * cadastro gravaria "0 m²" onde o certo é "não informado".
 */
const numeroOpcional = (min: number, max: number, rotulo: string) =>
  z.coerce
    .number({ invalid_type_error: `Informe ${rotulo} em números.` })
    .min(min, `${rotulo} deve ser maior que ${min - 1}.`)
    .max(max, `${rotulo} parece alto demais. Confira o valor.`)
    .optional();

const dataISO = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.");

const mesReferencia = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Informe o mês no formato AAAA-MM.");

const telefone = z
  .string()
  .min(1, "Informe um telefone.")
  .refine(ehTelefoneValido, "Telefone inválido. Use DDD + número.");

// ---------------------------------------------------------------- área pública

export const contatoSchema = z.object({
  nome: z.string().trim().min(3, "Informe seu nome completo.").max(120),
  email: z.string().trim().email("Informe um e-mail válido."),
  telefone,
  mensagem: z
    .string()
    .trim()
    .min(10, "Conte um pouco mais — pelo menos 10 caracteres.")
    .max(1500, "Mensagem muito longa (máximo 1500 caracteres)."),
  imovelId: z.string().optional().nullable(),
});
export type DadosContato = z.infer<typeof contatoSchema>;

// ------------------------------------------------------------------ autenticação

export const loginSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido."),
  senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
});
export type DadosLogin = z.infer<typeof loginSchema>;

// ------------------------------------------------------- portal do inquilino

export const loginInquilinoSchema = z.object({
  documento: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length === 11 || v.length === 14, "Informe um CPF ou CNPJ válido."),
  senha: z.string().min(1, "Informe sua senha."),
});
export type DadosLoginInquilino = z.infer<typeof loginInquilinoSchema>;

export const alterarSenhaSchema = z
  .object({
    senhaAtual: z.string().min(1, "Informe a senha atual."),
    novaSenha: z
      .string()
      .min(8, "A nova senha deve ter pelo menos 8 caracteres.")
      .max(72, "Senha muito longa."),
    confirmacao: z.string().min(1, "Repita a nova senha."),
  })
  .refine((v) => v.novaSenha === v.confirmacao, {
    message: "As senhas não conferem.",
    path: ["confirmacao"],
  });
export type DadosAlterarSenha = z.infer<typeof alterarSenhaSchema>;

// ---------------------------------------------------------------------- imóveis

export const fotoSchema = z.object({
  id: z.string(),
  url: z.string().min(1),
  descricao: z.string().trim().min(1, "Descreva a foto para leitores de tela.").max(160),
  ordem: z.number().int().min(0),
});

export const imovelSchema = z.object({
  titulo: z.string().trim().min(8, "O título deve ter pelo menos 8 caracteres.").max(120),
  // Opcional: o cadastro não trava por falta de texto de anúncio.
  descricao: z.string().trim().max(4000).optional().or(z.literal("")),
  tipo: z.enum(TIPOS_IMOVEL),
  status: z.enum(STATUS_IMOVEL),
  endereco: z.object({
    logradouro: z.string().trim().min(3, "Informe o logradouro."),
    numero: z.string().trim().min(1, "Informe o número."),
    complemento: z.string().trim().max(60).optional().or(z.literal("")),
    bairro: z.string().trim().min(2, "Informe o bairro."),
    cidade: z.string().trim().min(2, "Informe a cidade."),
    estado: z.string().trim().length(2, "Use a sigla do estado (ex: SP).").toUpperCase(),
    cep: z
      .string()
      .transform((v) => v.replace(/\D/g, ""))
      .refine((v) => v.length === 8, "CEP deve ter 8 dígitos."),
  }),
  valorAluguel: dinheiro("o valor do aluguel").refine((v) => v > 0, "O aluguel deve ser maior que zero."),
  valorCondominio: dinheiro("o condomínio"),
  valorIptu: dinheiro("o IPTU"),
  caracteristicas: z.object({
    quartos: z.coerce.number().int().min(0).max(30),
    suites: z.coerce.number().int().min(0).max(30),
    banheiros: z.coerce.number().int().min(0).max(30),
    vagas: z.coerce.number().int().min(0).max(50),
    // Opcional: parte do acervo não tem a metragem levantada.
    areaM2: numeroOpcional(1, 100000, "a área em m²"),
    mobiliado: z.coerce.boolean(),
    aceitaPet: z.coerce.boolean(),
    condominio: z.coerce.boolean(),
  }),
  fotos: z.array(fotoSchema).max(20, "Máximo de 20 fotos por imóvel."),
})
  .refine((v) => v.caracteristicas.suites <= v.caracteristicas.quartos, {
    message: "O número de suítes não pode ser maior que o de quartos.",
    path: ["caracteristicas", "suites"],
  });
export type DadosImovel = z.infer<typeof imovelSchema>;

// -------------------------------------------------------------------- inquilinos

export const inquilinoSchema = z
  .object({
    nome: z.string().trim().min(3, "Informe o nome completo.").max(140),
    tipoDocumento: z.enum(TIPOS_DOCUMENTO),
    documento: z.string().transform((v) => v.replace(/\D/g, "")),
    // RG acompanha o CPF/CNPJ (é assim que ele aparece no contrato), não o substitui.
    rg: z.string().trim().max(20, "RG muito longo.").optional().or(z.literal("")),
    // O contato obrigatório é o telefone; e-mail é complemento.
    email: z.string().trim().email("Informe um e-mail válido.").optional().or(z.literal("")),
    telefone,
    profissao: z.string().trim().max(80).optional().or(z.literal("")),
    observacoes: z.string().trim().max(1000).optional().or(z.literal("")),
    ativo: z.coerce.boolean(),
  })
  .refine(
    (v) => (v.tipoDocumento === "cpf" ? ehCpfValido(v.documento) : ehCnpjValido(v.documento)),
    { message: "Documento inválido. Confira os dígitos.", path: ["documento"] },
  );
export type DadosInquilino = z.infer<typeof inquilinoSchema>;

// --------------------------------------------------------------------- ocupações

export const entradaSchema = z.object({
  imovelId: z.string().min(1, "Selecione o imóvel."),
  inquilinoId: z.string().min(1, "Selecione o inquilino."),
  dataEntrada: dataISO,
  valorAluguel: dinheiro("o aluguel combinado").refine((v) => v > 0, "Informe o aluguel combinado."),
  diaVencimento: z.coerce.number().int().min(1, "Dia entre 1 e 28.").max(28, "Use um dia até 28."),
  valorCaucao: dinheiro("a caução"),
  observacoes: z.string().trim().max(1000).optional().or(z.literal("")),
});
export type DadosEntradaForm = z.infer<typeof entradaSchema>;

export const saidaSchema = z.object({
  dataSaida: dataISO,
  motivoSaida: z.enum(MOTIVOS_SAIDA),
  condicoesEntrega: z.string().trim().max(1500).optional().or(z.literal("")),
  novoStatusImovel: z.enum(["disponivel", "manutencao"]),
});
export type DadosSaidaForm = z.infer<typeof saidaSchema>;

// --------------------------------------------------------------------- contratos

export const contratoSchema = z.object({
  ocupacaoId: z.string().min(1, "Selecione a ocupação."),
  prazoMeses: z.coerce.number().int().min(1, "Prazo mínimo de 1 mês.").max(120),
  indiceReajuste: z.string().trim().min(2, "Informe o índice de reajuste."),
  valorAluguel: dinheiro("o aluguel"),
  valorCaucao: dinheiro("a caução"),
  diaVencimento: z.coerce.number().int().min(1).max(28),
  dataInicio: dataISO,
  clausulasAdicionais: z.string().trim().max(3000).optional().or(z.literal("")),
});
export type DadosContrato = z.infer<typeof contratoSchema>;

// -------------------------------------------------------------------- financeiro

export const cobrancaSchema = z.object({
  ocupacaoId: z.string().min(1, "Selecione a ocupação."),
  mesReferencia,
  valorAluguel: dinheiro("o aluguel"),
  valorAgua: dinheiro("a água"),
  valorLuz: dinheiro("a luz"),
  outrosValores: dinheiro("os outros valores").optional(),
  descricaoOutros: z.string().trim().max(120).optional().or(z.literal("")),
  dataVencimento: dataISO.optional().or(z.literal("")),
});
export type DadosCobrancaForm = z.infer<typeof cobrancaSchema>;

export const recebimentoSchema = z.object({
  pagamentoId: z.string().min(1),
  valor: dinheiro("o valor recebido").refine((v) => v > 0, "O valor deve ser maior que zero."),
  data: dataISO,
  forma: z.enum(FORMAS_PAGAMENTO),
  observacao: z.string().trim().max(200).optional().or(z.literal("")),
});
export type DadosRecebimentoForm = z.infer<typeof recebimentoSchema>;

// -------------------------------------------------------------------------- leads

export const statusLeadSchema = z.object({
  id: z.string().min(1),
  status: z.enum(STATUS_LEAD),
});
