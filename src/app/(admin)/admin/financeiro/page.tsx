import type { Metadata } from "next";
import Link from "next/link";
import { CircleDollarSign, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { casosDeUso } from "@/casos-de-uso";
import { STATUS_PAGAMENTO, type StatusPagamento } from "@/domain/entities";
import { Dinheiro } from "@/domain/value-objects";
import { formatarMoeda } from "@/lib/formatters";
import { Card, StatCard, classesBotao } from "@/presentation/components/ui";
import { PainelCobrancas } from "@/presentation/features/financeiro/painel-cobrancas";
import { FiltrosFinanceiro } from "@/presentation/features/financeiro/filtros-financeiro";

export const metadata: Metadata = { title: "Financeiro" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const texto = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

export default async function PaginaFinanceiro({ searchParams }: Props) {
  const params = await searchParams;
  const status = texto(params.status);
  const ocupacaoId = texto(params.ocupacaoId);
  const mesDe = texto(params.mesDe);
  const mesAte = texto(params.mesAte);

  const [cobrancas, ocupacoes] = await Promise.all([
    casosDeUso.financeiro.listarCobrancas.executar({
      ocupacaoId: ocupacaoId || undefined,
      status: STATUS_PAGAMENTO.includes(status as StatusPagamento)
        ? (status as StatusPagamento)
        : undefined,
      mesDe: mesDe || undefined,
      mesAte: mesAte || undefined,
    }),
    casosDeUso.ocupacoes.listar.executar(),
  ]);

  const ocupacoesAtivas = ocupacoes.filter((o) => o.ocupacao.status === "ativa");

  const totalCobrado = Dinheiro.somar(...cobrancas.map((c) => c.valorTotal));
  const totalRecebido = Dinheiro.somar(...cobrancas.map((c) => c.valorPago));
  const totalEmAberto = Dinheiro.somar(...cobrancas.map((c) => c.saldoDevedor));
  const emAtraso = cobrancas.filter((c) => c.status === "atrasado");

  const ocupacaoFiltrada = ocupacoes.find((o) => o.ocupacao.id === ocupacaoId);

  return (
    <div className="space-y-4">
      {ocupacaoFiltrada ? (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-slate-700">
            Mostrando o financeiro de{" "}
            <strong>{ocupacaoFiltrada.inquilino.nome}</strong> em{" "}
            <strong>{ocupacaoFiltrada.imovel.titulo}</strong>
          </p>
          <Link href="/admin/financeiro" className={classesBotao("secundario", "sm")}>
            Ver todas as cobranças
          </Link>
        </Card>
      ) : null}

      <section aria-label="Resumo financeiro" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          rotulo="Total cobrado"
          valor={formatarMoeda(totalCobrado)}
          auxiliar={`${cobrancas.length} ${cobrancas.length === 1 ? "cobrança" : "cobranças"}`}
          icone={Wallet}
        />
        <StatCard
          rotulo="Recebido"
          valor={formatarMoeda(totalRecebido)}
          auxiliar={
            totalCobrado > 0
              ? `${Math.round((totalRecebido / totalCobrado) * 100)}% do cobrado`
              : undefined
          }
          icone={TrendingUp}
          tom="sucesso"
        />
        <StatCard
          rotulo="Em aberto"
          valor={formatarMoeda(totalEmAberto)}
          auxiliar={`${cobrancas.filter((c) => c.saldoDevedor > 0).length} cobranças pendentes`}
          icone={TrendingDown}
          tom={totalEmAberto > 0 ? "alerta" : "sucesso"}
        />
        <StatCard
          rotulo="Em atraso"
          valor={String(emAtraso.length)}
          auxiliar={formatarMoeda(Dinheiro.somar(...emAtraso.map((c) => c.saldoDevedor)))}
          icone={CircleDollarSign}
          tom={emAtraso.length > 0 ? "perigo" : "sucesso"}
        />
      </section>

      <Card className="p-4 sm:p-5">
        <FiltrosFinanceiro
          status={status}
          ocupacaoId={ocupacaoId}
          mesDe={mesDe}
          mesAte={mesAte}
          ocupacoes={ocupacoes}
        />
      </Card>

      <PainelCobrancas
        cobrancas={cobrancas}
        ocupacoesAtivas={ocupacoesAtivas}
        ocupacaoPreSelecionada={ocupacaoId || undefined}
      />
    </div>
  );
}
