/**
 * Validação de CPF/CNPJ pelos dígitos verificadores.
 *
 * Vive no domínio porque "um inquilino tem documento válido" é regra de negócio,
 * não detalhe de formulário: o schema de UI e os dados de seed usam a mesma fonte.
 */
function digitos(valor: string): number[] {
  return valor.replace(/\D/g, "").split("").map(Number);
}

export function ehCpfValido(valor: string): boolean {
  const d = digitos(valor);
  if (d.length !== 11 || d.every((n) => n === d[0])) return false;

  for (const tamanho of [9, 10]) {
    let soma = 0;
    for (let i = 0; i < tamanho; i += 1) soma += d[i] * (tamanho + 1 - i);
    const resto = ((soma * 10) % 11) % 10;
    if (resto !== d[tamanho]) return false;
  }
  return true;
}

export function ehCnpjValido(valor: string): boolean {
  const d = digitos(valor);
  if (d.length !== 14 || d.every((n) => n === d[0])) return false;

  const pesos = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (const tamanho of [12, 13]) {
    const usados = pesos.slice(pesos.length - tamanho);
    let soma = 0;
    for (let i = 0; i < tamanho; i += 1) soma += d[i] * usados[i];
    const resto = soma % 11;
    const esperado = resto < 2 ? 0 : 11 - resto;
    if (esperado !== d[tamanho]) return false;
  }
  return true;
}

export function ehDocumentoValido(tipo: "cpf" | "cnpj", valor: string): boolean {
  return tipo === "cpf" ? ehCpfValido(valor) : ehCnpjValido(valor);
}
