import { randomBytes, scrypt, scryptSync, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const derivar = promisify(scrypt) as (
  senha: string,
  sal: Buffer,
  tamanho: number,
) => Promise<Buffer>;

const TAMANHO_HASH = 64;

/**
 * Hash de senha com scrypt.
 *
 * Diferente do login do painel (que é um mock com senha em texto para
 * demonstração), a senha do inquilino é escolhida por ele — então nunca fica
 * legível no arquivo de dados. Formato: `scrypt$<sal>$<hash>`.
 */
export async function gerarHashSenha(senha: string): Promise<string> {
  const sal = randomBytes(16);
  const hash = await derivar(senha, sal, TAMANHO_HASH);
  return `scrypt$${sal.toString("hex")}$${hash.toString("hex")}`;
}

export async function conferirSenha(senha: string, armazenado: string): Promise<boolean> {
  const [algoritmo, salHex, hashHex] = armazenado.split("$");
  if (algoritmo !== "scrypt" || !salHex || !hashHex) return false;

  const esperado = Buffer.from(hashHex, "hex");
  const calculado = await derivar(senha, Buffer.from(salHex, "hex"), esperado.length);
  return esperado.length === calculado.length && timingSafeEqual(esperado, calculado);
}

/**
 * Versão síncrona, usada só na criação do seed de usuários — o `JsonStore`
 * monta os dados iniciais de forma síncrona e isso acontece uma única vez.
 */
export function gerarHashSenhaSync(senha: string): string {
  const sal = randomBytes(16);
  const hash = scryptSync(senha, sal, TAMANHO_HASH);
  return `scrypt$${sal.toString("hex")}$${hash.toString("hex")}`;
}
