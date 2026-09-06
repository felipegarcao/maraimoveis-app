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
  whatsapp: process.env.WHATSAPP ?? "5511999998888",
  emailContato: process.env.EMAIL_DESTINO_CONTATO ?? "contato@maraimoveis.com.br",
  emailRemetente: process.env.EMAIL_REMETENTE ?? "Mara Imóveis <onboarding@resend.dev>",
  endereco: "Av. Paulista, 1000 — Bela Vista, São Paulo/SP",
} as const;

export const ITENS_POR_PAGINA = 12;
