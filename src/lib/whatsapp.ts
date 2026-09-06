import { apenasDigitos } from "./utils";
import { siteConfig } from "./config";

/**
 * Monta um link wa.me com mensagem pré-preenchida.
 * `telefone` aceita qualquer formatação; assume DDI 55 quando ausente.
 */
export function linkWhatsApp(telefone: string | undefined, mensagem: string): string {
  let numero = apenasDigitos(telefone || siteConfig.whatsapp || "");
  if (!numero) return "https://wa.me/";
  if (numero.length <= 11) numero = `55${numero}`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}

export function mensagemInteresseImovel(titulo: string, endereco: string): string {
  return `Olá! Vi o imóvel "${titulo}" (${endereco}) no site e gostaria de mais informações.`;
}

export function mensagemCobranca(nome: string, mesReferencia: string, valor: string): string {
  return `Olá, ${nome}! Passando para lembrar do aluguel referente a ${mesReferencia}. Valor em aberto: ${valor}. Qualquer dúvida estou à disposição.`;
}
