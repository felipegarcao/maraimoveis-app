export { ehCnpjValido, ehCpfValido, ehDocumentoValido } from "@/domain/value-objects";

/** Aceita telefones brasileiros com DDD, com ou sem o DDI 55. */
export function ehTelefoneValido(valor: string): boolean {
  const d = valor.replace(/\D/g, "").replace(/^55/, "");
  return d.length === 10 || d.length === 11;
}
