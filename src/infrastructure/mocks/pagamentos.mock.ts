import type { FormaPagamento, Pagamento, RegistroPagamento } from "@/domain/entities";
import { Dinheiro } from "@/domain/value-objects";
import { criarAleatorio, entre, HOJE, mesesEntre } from "./helpers";
import { ocupacoesMock } from "./ocupacoes.mock";
import { format, lastDayOfMonth } from "date-fns";

const FORMAS: FormaPagamento[] = ["pix", "transferencia", "boleto", "dinheiro"];

/** Comportamento de pagamento por inquilino — deixa os relatórios com variação real. */
const PERFIL_INADIMPLENCIA: Record<string, number> = {
  ocp_01: 0.05,
  ocp_02: 0.12,
  ocp_03: 0.35, // Marcos Antônio: atrasos recorrentes
  ocp_04: 0.02, // Ana Beatriz: sempre em dia
  ocp_05: 0.08,
  ocp_06: 0.15,
};

function dataNoMes(mes: string, dia: number): string {
  const [ano, mesNumero] = mes.split("-").map(Number);
  const ultimoDia = lastDayOfMonth(new Date(ano, mesNumero - 1, 1)).getDate();
  return format(new Date(ano, mesNumero - 1, Math.min(dia, ultimoDia)), "yyyy-MM-dd");
}

function gerarPagamentos(): Pagamento[] {
  const mesAtual = format(HOJE, "yyyy-MM");
  const pagamentos: Pagamento[] = [];
  let contador = 0;

  for (const [indiceOcupacao, ocupacao] of ocupacoesMock.entries()) {
    const aleatorio = criarAleatorio(1000 + indiceOcupacao * 97);
    const risco = PERFIL_INADIMPLENCIA[ocupacao.id] ?? 0.1;
    const fimReferencia = ocupacao.dataSaida ?? format(HOJE, "yyyy-MM-dd");
    const meses = mesesEntre(ocupacao.dataEntrada, fimReferencia);

    for (const [indiceMes, mes] of meses.entries()) {
      const ehMesCorrente = mes === mesAtual && ocupacao.status === "ativa";
      const ehMesAnterior = indiceMes === meses.length - 2 && ocupacao.status === "ativa";

      const valorAgua = entre(aleatorio, 55, 190);
      const valorLuz = entre(aleatorio, 95, 340);
      // A cada ~12 meses entra o IPTU parcelado como "outros".
      const temExtra = indiceMes > 0 && indiceMes % 12 === 0;
      const outrosValores = temExtra ? entre(aleatorio, 120, 380) : 0;

      const total = Dinheiro.somar(ocupacao.valorAluguel, valorAgua, valorLuz, outrosValores);
      const dataVencimento = dataNoMes(mes, ocupacao.diaVencimento);

      const recebimentos: RegistroPagamento[] = [];
      const sorteio = aleatorio();

      if (ehMesCorrente) {
        // Mês corrente fica em aberto — é o que o admin precisa cobrar hoje.
      } else if (ehMesAnterior && risco > 0.25) {
        // Pagamento parcial recente: exercita o cálculo de saldo devedor.
        recebimentos.push({
          id: `rcb_${++contador}`,
          valor: Dinheiro.multiplicar(total, 0.6),
          data: dataNoMes(mes, ocupacao.diaVencimento + 4),
          forma: "pix",
          observacao: "Pagamento parcial acordado por telefone.",
        });
      } else if (sorteio < risco * 0.35) {
        // Mês antigo que ficou parcialmente em aberto.
        recebimentos.push({
          id: `rcb_${++contador}`,
          valor: Dinheiro.multiplicar(total, entre(aleatorio, 0.4, 0.8, 2)),
          data: dataNoMes(mes, ocupacao.diaVencimento + 9),
          forma: FORMAS[Math.floor(aleatorio() * FORMAS.length)],
        });
      } else {
        const atrasado = sorteio < risco;
        recebimentos.push({
          id: `rcb_${++contador}`,
          valor: total,
          data: dataNoMes(mes, ocupacao.diaVencimento + (atrasado ? 8 : -2)),
          forma: FORMAS[Math.floor(aleatorio() * FORMAS.length)],
          observacao: atrasado ? "Pagamento em atraso." : undefined,
        });
      }

      pagamentos.push({
        id: `pgt_${ocupacao.id}_${mes}`,
        ocupacaoId: ocupacao.id,
        mesReferencia: mes,
        valorAluguel: ocupacao.valorAluguel,
        valorAgua,
        valorLuz,
        outrosValores,
        descricaoOutros: temExtra ? "IPTU parcelado" : undefined,
        dataVencimento,
        recebimentos,
        criadoEm: dataNoMes(mes, 1),
      });
    }
  }

  return pagamentos;
}

export const pagamentosMock: Pagamento[] = gerarPagamentos();
