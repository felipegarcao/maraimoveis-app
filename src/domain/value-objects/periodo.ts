import { differenceInCalendarDays, differenceInCalendarMonths, isWithinInterval } from "date-fns";
import { paraDataLocal } from "./data";

/** Intervalo de datas em ISO (yyyy-MM-dd). `fim` nulo significa "em aberto". */
export interface Periodo {
  readonly inicio: string;
  readonly fim: string | null;
}

export const Periodo = {
  criar(inicio: string, fim: string | null = null): Periodo {
    if (fim && paraDataLocal(fim) < paraDataLocal(inicio)) {
      throw new Error("A data de término não pode ser anterior à data de início.");
    }
    return { inicio, fim };
  },

  estaAberto(periodo: Periodo): boolean {
    return periodo.fim === null;
  },

  /** Duração em dias; períodos abertos contam até hoje. */
  duracaoEmDias(periodo: Periodo, referencia: Date = new Date()): number {
    const fim = periodo.fim ? paraDataLocal(periodo.fim) : referencia;
    return Math.max(0, differenceInCalendarDays(fim, paraDataLocal(periodo.inicio)));
  },

  /** Duração em meses cheios; períodos abertos contam até hoje. */
  duracaoEmMeses(periodo: Periodo, referencia: Date = new Date()): number {
    const fim = periodo.fim ? paraDataLocal(periodo.fim) : referencia;
    return Math.max(0, differenceInCalendarMonths(fim, paraDataLocal(periodo.inicio)));
  },

  contem(periodo: Periodo, data: Date, referencia: Date = new Date()): boolean {
    return isWithinInterval(data, {
      start: paraDataLocal(periodo.inicio),
      end: periodo.fim ? paraDataLocal(periodo.fim) : referencia,
    });
  },

  /** Dias de vacância entre o fim de um período e o início do próximo. */
  intervaloEntre(anterior: Periodo, proximo: Periodo): number | null {
    if (!anterior.fim) return null;
    return Math.max(
      0,
      differenceInCalendarDays(paraDataLocal(proximo.inicio), paraDataLocal(anterior.fim)),
    );
  },
};
