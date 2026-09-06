import { format, formatDistanceToNowStrict, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apenasDigitos } from "./utils";

/** Converte string ISO ou Date em Date de forma tolerante. */
export function paraData(valor: string | Date): Date {
  return typeof valor === "string" ? parseISO(valor) : valor;
}

export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

/** Versão compacta para eixos de gráfico: R$ 12,5 mil. */
export function formatarMoedaCompacta(valor: number): string {
  if (Math.abs(valor) >= 1000) {
    return `R$ ${(valor / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
  }
  return formatarMoeda(valor);
}

export function formatarData(valor: string | Date): string {
  return format(paraData(valor), "dd/MM/yyyy", { locale: ptBR });
}

export function formatarDataHora(valor: string | Date): string {
  return format(paraData(valor), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

/** "2025-03" → "Março de 2025" */
export function formatarMesReferencia(mesReferencia: string): string {
  const [ano, mes] = mesReferencia.split("-").map(Number);
  const data = new Date(ano, (mes ?? 1) - 1, 1);
  const texto = format(data, "MMMM 'de' yyyy", { locale: ptBR });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** "2025-03" → "mar/25" (rótulos curtos de gráfico) */
export function formatarMesCurto(mesReferencia: string): string {
  const [ano, mes] = mesReferencia.split("-").map(Number);
  return format(new Date(ano, (mes ?? 1) - 1, 1), "MMM/yy", { locale: ptBR });
}

export function formatarTempoRelativo(valor: string | Date): string {
  return formatDistanceToNowStrict(paraData(valor), {
    locale: ptBR,
    addSuffix: true,
  });
}

export function formatarArea(metrosQuadrados: number): string {
  return `${metrosQuadrados.toLocaleString("pt-BR")} m²`;
}

export function formatarCpfCnpj(documento: string): string {
  const d = apenasDigitos(documento);
  if (d.length === 11) {
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  if (d.length === 14) {
    return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }
  return documento;
}

export function formatarTelefone(telefone: string): string {
  const d = apenasDigitos(telefone).replace(/^55/, "");
  if (d.length === 11) return d.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (d.length === 10) return d.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return telefone;
}

export function formatarCep(cep: string): string {
  const d = apenasDigitos(cep);
  return d.length === 8 ? d.replace(/(\d{5})(\d{3})/, "$1-$2") : cep;
}

/** Pluraliza rótulos curtos: 1 quarto / 2 quartos. */
export function pluralizar(quantidade: number, singular: string, plural: string): string {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`;
}
