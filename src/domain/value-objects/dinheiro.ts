/**
 * Value Object Dinheiro.
 *
 * Representado como `number` em reais para atravessar a fronteira Server → Client
 * do React sem serialização customizada, mas toda aritmética acontece em centavos
 * (inteiros) para evitar erro de ponto flutuante — R$ 0,1 + R$ 0,2 nunca vira 0,30000000000000004.
 */
export type Dinheiro = number;

const CENTAVOS = 100;

export const Dinheiro = {
  zero: 0 as Dinheiro,

  criar(valor: number): Dinheiro {
    if (!Number.isFinite(valor)) {
      throw new Error("Valor monetário inválido.");
    }
    return Math.round(valor * CENTAVOS) / CENTAVOS;
  },

  somar(...valores: readonly Dinheiro[]): Dinheiro {
    const total = valores.reduce((acc, v) => acc + Math.round(v * CENTAVOS), 0);
    return total / CENTAVOS;
  },

  subtrair(a: Dinheiro, b: Dinheiro): Dinheiro {
    return (Math.round(a * CENTAVOS) - Math.round(b * CENTAVOS)) / CENTAVOS;
  },

  multiplicar(valor: Dinheiro, fator: number): Dinheiro {
    return Math.round(valor * CENTAVOS * fator) / CENTAVOS;
  },

  /** Nunca deixa o resultado ficar negativo (usado em saldo devedor). */
  naoNegativo(valor: Dinheiro): Dinheiro {
    return valor > 0 ? Dinheiro.criar(valor) : 0;
  },

  ehZero(valor: Dinheiro): boolean {
    return Math.round(valor * CENTAVOS) === 0;
  },

  maiorQue(a: Dinheiro, b: Dinheiro): boolean {
    return Math.round(a * CENTAVOS) > Math.round(b * CENTAVOS);
  },
};
