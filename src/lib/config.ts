/**
 * Configuração pública da imobiliária.
 * Valores vêm de env quando existirem, com fallback para o mock de desenvolvimento.
 */
export const siteConfig = {
  nome: "Mara Imóveis",
  descricao: "Aluguel de imóveis residenciais e comerciais com atendimento próximo e transparente.",
  /**
   * Telefone em formato internacional, apenas dígitos (para links wa.me).
   * Lido em runtime (sem prefixo NEXT_PUBLIC_) para poder mudar via variável de
   * ambiente no container, sem precisar reconstruir a imagem.
   */
  whatsapp: process.env.WHATSAPP ?? "5518997943842",
  emailContato: "felipe-mara2003@hotmail.com",
  emailRemetente: process.env.EMAIL_REMETENTE ?? "Mara Imóveis <onboarding@resend.dev>",
  endereco: process.env.ENDERECO_IMOBILIARIA ?? "Presidente Prudente — SP",
} as const;

/**
 * Qualificação da LOCADORA impressa no contrato de locação.
 *
 * Fixa: há uma única locadora, e os dados são os do contrato em papel que a
 * imobiliária já usa. Quando existir mais de uma, isto vira cadastro — o
 * template do PDF já recebe tudo por parâmetro e não precisa mudar.
 *
 * Campo vazio não é impresso: sem CPF cadastrado, o PDF não ganha linha em branco.
 */
export const locadorConfig = {
  nome: "Maria Alice Garção Silva",
  /**
   * Como a locadora é tratada no contrato. O feminino não é enfeite: o texto
   * das cláusulas concorda com este rótulo ("a LOCADORA dá em locação").
   */
  rotulo: "LOCADORA",
  profissao: "Do lar",
  rg: "33.209.174-0",
  documento: "",
  endereco:
    "Rua Maria do Espírito Santo, 59 — Residencial Daiane, Vila Montalvão, Presidente Prudente/SP",
} as const;

export const ITENS_POR_PAGINA = 12;
