import type { Prisma } from "@prisma/client";
import type {
  AtualizacaoPagamento,
  FiltroPagamentos,
  NovoPagamento,
  PagamentoRepository,
} from "@/domain/repositories";
import type { Pagamento } from "@/domain/entities";
import { RecursoNaoEncontrado } from "@/domain/errors";
import { gerarId } from "@/lib/utils";
import { obterPrisma } from "../../persistence/prisma-client";
import { paraColunaData, paraPagamento } from "../../persistence/prisma-mappers";

const COM_RECEBIMENTOS = { recebimentos: true } as const;

export class PrismaPagamentoRepository implements PagamentoRepository {
  private get db() {
    return obterPrisma();
  }

  async listar(filtro: FiltroPagamentos = {}): Promise<Pagamento[]> {
    const where: Prisma.PagamentoWhereInput = {
      ...(filtro.ocupacaoId && { ocupacaoId: filtro.ocupacaoId }),
      ...(filtro.ocupacaoIds && { ocupacaoId: { in: [...filtro.ocupacaoIds] } }),
      ...(filtro.mesReferencia && { mesReferencia: filtro.mesReferencia }),
      // mesReferencia é "yyyy-MM": a ordem lexicográfica é a ordem cronológica.
      ...((filtro.mesDe || filtro.mesAte) && {
        mesReferencia: {
          ...(filtro.mesDe && { gte: filtro.mesDe }),
          ...(filtro.mesAte && { lte: filtro.mesAte }),
        },
      }),
    };

    const linhas = await this.db.pagamento.findMany({
      where,
      include: COM_RECEBIMENTOS,
      orderBy: { mesReferencia: "desc" },
    });
    return linhas.map(paraPagamento);
  }

  async buscarPorId(id: string): Promise<Pagamento | null> {
    const linha = await this.db.pagamento.findUnique({ where: { id }, include: COM_RECEBIMENTOS });
    return linha ? paraPagamento(linha) : null;
  }

  async buscarPorMes(ocupacaoId: string, mesReferencia: string): Promise<Pagamento | null> {
    const linha = await this.db.pagamento.findUnique({
      where: { ocupacaoId_mesReferencia: { ocupacaoId, mesReferencia } },
      include: COM_RECEBIMENTOS,
    });
    return linha ? paraPagamento(linha) : null;
  }

  async criar(dados: NovoPagamento): Promise<Pagamento> {
    const linha = await this.db.pagamento.create({
      data: {
        id: gerarId("pgt"),
        ocupacaoId: dados.ocupacaoId,
        mesReferencia: dados.mesReferencia,
        valorAluguel: dados.valorAluguel,
        valorAgua: dados.valorAgua,
        valorLuz: dados.valorLuz,
        outrosValores: dados.outrosValores,
        descricaoOutros: dados.descricaoOutros ?? null,
        dataVencimento: paraColunaData(dados.dataVencimento),
        criadoEm: new Date(),
        recebimentos: {
          create: (dados.recebimentos ?? []).map((r) => ({
            id: r.id,
            valor: r.valor,
            data: paraColunaData(r.data),
            forma: r.forma,
            observacao: r.observacao ?? null,
          })),
        },
      },
      include: COM_RECEBIMENTOS,
    });
    return paraPagamento(linha);
  }

  async atualizar(id: string, dados: AtualizacaoPagamento): Promise<Pagamento> {
    try {
      const linha = await this.db.pagamento.update({
        where: { id },
        data: {
          ...(dados.mesReferencia !== undefined && { mesReferencia: dados.mesReferencia }),
          ...(dados.valorAluguel !== undefined && { valorAluguel: dados.valorAluguel }),
          ...(dados.valorAgua !== undefined && { valorAgua: dados.valorAgua }),
          ...(dados.valorLuz !== undefined && { valorLuz: dados.valorLuz }),
          ...(dados.outrosValores !== undefined && { outrosValores: dados.outrosValores }),
          ...(dados.descricaoOutros !== undefined && {
            descricaoOutros: dados.descricaoOutros ?? null,
          }),
          ...(dados.dataVencimento !== undefined && {
            dataVencimento: paraColunaData(dados.dataVencimento),
          }),
          // A lista de recebimentos chega inteira do caso de uso; substituímos
          // tudo para que o saldo derivado nunca fique meio atualizado.
          ...(dados.recebimentos !== undefined && {
            recebimentos: {
              deleteMany: {},
              create: dados.recebimentos.map((r) => ({
                id: r.id,
                valor: r.valor,
                data: paraColunaData(r.data),
                forma: r.forma,
                observacao: r.observacao ?? null,
              })),
            },
          }),
        },
        include: COM_RECEBIMENTOS,
      });
      return paraPagamento(linha);
    } catch {
      throw new RecursoNaoEncontrado("Pagamento", id);
    }
  }

  async excluir(id: string): Promise<void> {
    try {
      await this.db.pagamento.delete({ where: { id } });
    } catch {
      throw new RecursoNaoEncontrado("Pagamento", id);
    }
  }
}
