import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Junta classes Tailwind resolvendo conflitos (ex: `p-2` + `p-4` → `p-4`). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Gera um id curto e legível, usado pelos repositórios mock. */
export function gerarId(prefixo: string): string {
  const aleatorio = Math.random().toString(36).slice(2, 8);
  return `${prefixo}_${Date.now().toString(36)}${aleatorio}`;
}

/** Remove acentos e normaliza para busca textual case-insensitive. */
export function normalizarTexto(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function slugify(valor: string): string {
  return normalizarTexto(valor)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Mantém apenas dígitos (documentos, telefones, CEP). */
export function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

export function agrupar<T, K extends string>(
  itens: readonly T[],
  chave: (item: T) => K,
): Record<K, T[]> {
  return itens.reduce(
    (acc, item) => {
      const k = chave(item);
      (acc[k] ??= []).push(item);
      return acc;
    },
    {} as Record<K, T[]>,
  );
}

export function ordenarPor<T>(
  itens: readonly T[],
  seletor: (item: T) => string | number,
  direcao: "asc" | "desc" = "asc",
): T[] {
  const fator = direcao === "asc" ? 1 : -1;
  return [...itens].sort((a, b) => {
    const va = seletor(a);
    const vb = seletor(b);
    if (va === vb) return 0;
    return va > vb ? fator : -fator;
  });
}
