import { Imovel, Pagamento, type Inquilino } from "@/domain/entities";
import { Dinheiro } from "@/domain/value-objects";
import type { CobrancaMensal, ResumoFinanceiroOcupacao, ResumoImovel, ResumoInquilino } from "./dtos";

export function paraResumoImovel(imovel: Imovel): ResumoImovel {
  return {
    id: imovel.id,
    titulo: imovel.titulo,
    enderecoResumo: `${imovel.endereco.bairro}, ${imovel.endereco.cidade}`,
    fotoCapaUrl: Imovel.fotoCapa(imovel)?.url ?? null,
  };
}

export function paraResumoInquilino(inquilino: Inquilino): ResumoInquilino {
  return {
    id: inquilino.id,
    nome: inquilino.nome,
    telefone: inquilino.telefone,
    email: inquilino.email,
    documento: inquilino.documento,
  };
}

export function paraCobranca(
  pagamento: Pagamento,
  imovel: ResumoImovel,
  inquilino: ResumoInquilino,
  referencia: Date = new Date(),
): CobrancaMensal {
  return {
    pagamento,
    valorTotal: Pagamento.valorTotal(pagamento),
    valorPago: Pagamento.valorPago(pagamento),
    saldoDevedor: Pagamento.saldoDevedor(pagamento),
    status: Pagamento.status(pagamento, referencia),
    dataUltimoPagamento: Pagamento.dataPagamento(pagamento),
    imovel,
    inquilino,
  };
}

/** Consolida os totais financeiros de uma ocupação a partir das suas cobranças. */
export function resumirFinanceiro(pagamentos: readonly Pagamento[]): ResumoFinanceiroOcupacao {
  const totalCobrado = Dinheiro.somar(...pagamentos.map(Pagamento.valorTotal));
  const totalRecebido = Dinheiro.somar(...pagamentos.map(Pagamento.valorPago));
  const saldoDevedor = Dinheiro.naoNegativo(Dinheiro.subtrair(totalCobrado, totalRecebido));
  const mesesEmAberto = pagamentos.filter((p) => !Pagamento.estaQuitado(p)).length;

  return {
    totalCobrado,
    totalRecebido,
    saldoDevedor,
    mesesCobrados: pagamentos.length,
    mesesEmAberto,
    taxaAdimplencia:
      totalCobrado > 0 ? Math.round((totalRecebido / totalCobrado) * 1000) / 10 : 100,
  };
}
