export interface Endereco {
  readonly logradouro: string;
  readonly numero: string;
  readonly complemento?: string;
  readonly bairro: string;
  readonly cidade: string;
  readonly estado: string;
  readonly cep: string;
}

export const Endereco = {
  /** "Rua das Acácias, 240 — Apto 32" */
  linha1(endereco: Endereco): string {
    const base = `${endereco.logradouro}, ${endereco.numero}`;
    return endereco.complemento ? `${base} — ${endereco.complemento}` : base;
  },

  /** "Pinheiros, São Paulo/SP" */
  linha2(endereco: Endereco): string {
    return `${endereco.bairro}, ${endereco.cidade}/${endereco.estado}`;
  },

  /** Resumo curto usado nos cards da listagem pública. */
  resumo(endereco: Endereco): string {
    return `${endereco.bairro}, ${endereco.cidade}`;
  },

  /** CEP formatado como 00000-000. */
  cepFormatado(endereco: Endereco): string {
    const digitos = endereco.cep.replace(/\D/g, "");
    return digitos.length === 8 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : endereco.cep;
  },

  /** Endereço completo, usado no contrato em PDF. */
  completo(endereco: Endereco): string {
    return `${Endereco.linha1(endereco)}, ${Endereco.linha2(endereco)}, CEP ${Endereco.cepFormatado(endereco)}`;
  },
};
