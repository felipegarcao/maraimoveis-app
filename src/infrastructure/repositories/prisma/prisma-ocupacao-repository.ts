import type { Prisma } from "@prisma/client";
import type {
  AtualizacaoOcupacao,
  FiltroOcupacoes,
  NovaOcupacao,
  OcupacaoRepository,
} from "@/domain/repositories";
import type { Ocupacao } from "@/domain/entities";
import { RecursoNaoEncontrado } from "@/domain/errors";
import { gerarId } from "@/lib/utils";
import { obterPrisma } from "../../persistence/prisma-client";
import { paraColunaData, paraOcupacao } from "../../persistence/prisma-mappers";

export class PrismaOcupacaoRepository implements OcupacaoRepository {
  private get db() {
    return obterPrisma();
  }

  async listar(filtro: FiltroOcupacoes = {}): Promise<Ocupacao[]> {
    const where: Prisma.OcupacaoWhereInput = {
      ...(filtro.imovelId && { imovelId: filtro.imovelId }),
      ...(filtro.inquilinoId && { inquilinoId: filtro.inquilinoId }),
      ...(filtro.status && { status: filtro.status }),
    };
    const linhas = await this.db.ocupacao.findMany({ where, orderBy: { dataEntrada: "desc" } });
    return linhas.map(paraOcupacao);
  }

  async buscarPorId(id: string): Promise<Ocupacao | null> {
    const linha = await this.db.ocupacao.findUnique({ where: { id } });
    return linha ? paraOcupacao(linha) : null;
  }

  async buscarAtivaPorImovel(imovelId: string): Promise<Ocupacao | null> {
    const linha = await this.db.ocupacao.findFirst({ where: { imovelId, status: "ativa" } });
    return linha ? paraOcupacao(linha) : null;
  }

  async criar(dados: NovaOcupacao): Promise<Ocupacao> {
    const linha = await this.db.ocupacao.create({
      data: {
        id: gerarId("ocp"),
        imovelId: dados.imovelId,
        inquilinoId: dados.inquilinoId,
        dataEntrada: paraColunaData(dados.dataEntrada),
        dataSaida: dados.dataSaida ? paraColunaData(dados.dataSaida) : null,
        status: dados.status ?? "ativa",
        valorAluguel: dados.valorAluguel,
        diaVencimento: dados.diaVencimento,
        valorCaucao: dados.valorCaucao,
        motivoSaida: dados.motivoSaida ?? null,
        condicoesEntrega: dados.condicoesEntrega ?? null,
        observacoes: dados.observacoes ?? null,
        criadoEm: new Date(),
      },
    });
    return paraOcupacao(linha);
  }

  async atualizar(id: string, dados: AtualizacaoOcupacao): Promise<Ocupacao> {
    try {
      const linha = await this.db.ocupacao.update({
        where: { id },
        data: {
          ...(dados.imovelId !== undefined && { imovelId: dados.imovelId }),
          ...(dados.inquilinoId !== undefined && { inquilinoId: dados.inquilinoId }),
          ...(dados.dataEntrada !== undefined && { dataEntrada: paraColunaData(dados.dataEntrada) }),
          ...(dados.dataSaida !== undefined && {
            dataSaida: dados.dataSaida ? paraColunaData(dados.dataSaida) : null,
          }),
          ...(dados.status !== undefined && { status: dados.status }),
          ...(dados.valorAluguel !== undefined && { valorAluguel: dados.valorAluguel }),
          ...(dados.diaVencimento !== undefined && { diaVencimento: dados.diaVencimento }),
          ...(dados.valorCaucao !== undefined && { valorCaucao: dados.valorCaucao }),
          ...(dados.motivoSaida !== undefined && { motivoSaida: dados.motivoSaida ?? null }),
          ...(dados.condicoesEntrega !== undefined && {
            condicoesEntrega: dados.condicoesEntrega ?? null,
          }),
          ...(dados.observacoes !== undefined && { observacoes: dados.observacoes ?? null }),
        },
      });
      return paraOcupacao(linha);
    } catch {
      throw new RecursoNaoEncontrado("Ocupação", id);
    }
  }

  async excluir(id: string): Promise<void> {
    try {
      await this.db.ocupacao.delete({ where: { id } });
    } catch {
      throw new RecursoNaoEncontrado("Ocupação", id);
    }
  }
}
