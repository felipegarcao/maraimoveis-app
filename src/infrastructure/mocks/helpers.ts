import { addMonths, format, startOfMonth, subMonths } from "date-fns";

/**
 * Os mocks usam datas relativas a "hoje" para que o histórico continue
 * fazendo sentido independentemente de quando o projeto for aberto.
 */
export const HOJE = new Date();

export function mesesAtras(quantidade: number, dia = 1): string {
  const data = subMonths(startOfMonth(HOJE), quantidade);
  data.setDate(dia);
  return format(data, "yyyy-MM-dd");
}

export function mesReferenciaDe(data: Date | string): string {
  return format(typeof data === "string" ? new Date(`${data}T12:00:00`) : data, "yyyy-MM");
}

/** Lista de meses (yyyy-MM) entre duas datas, inclusive. */
export function mesesEntre(inicio: string, fim: string): string[] {
  const meses: string[] = [];
  let cursor = startOfMonth(new Date(`${inicio}T12:00:00`));
  const limite = startOfMonth(new Date(`${fim}T12:00:00`));
  while (cursor <= limite) {
    meses.push(format(cursor, "yyyy-MM"));
    cursor = addMonths(cursor, 1);
  }
  return meses;
}

/**
 * PRNG determinístico (mulberry32) — os mocks precisam parecer variados
 * mas serem sempre idênticos entre execuções.
 */
export function criarAleatorio(semente: number): () => number {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function entre(aleatorio: () => number, min: number, max: number, casas = 2): number {
  const valor = min + aleatorio() * (max - min);
  return Number(valor.toFixed(casas));
}
