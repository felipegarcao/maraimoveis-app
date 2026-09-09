import type { Prisma } from "@prisma/client";
import type {
  AtualizacaoContrato,
  ContratoRepository,
  FiltroContratos,
  NovoContrato,
} from "@/domain/repositories";
import type { Contrato } from "@/domain/entities";
import { RecursoNaoEncontrado } from "@/domain/errors";
import { gerarId } from "@/lib/utils";
import { obterPrisma } from "../../persistence/prisma-client";
import { paraColunaData, paraContrato } from "../../persistence/prisma-mappers";

export class PrismaContratoRepository implements ContratoRepository {
  private get db() {
    return obterPrisma();
  }

  async listar(filtro: FiltroContratos = {}): Promise<Contrato[]> {
    const where: Prisma.ContratoWhereInput = {
      ...(filtro.ocupacaoId && { ocupacaoId: filtro.ocupacaoId }),
      ...(filtro.status && { status: filtro.status }),
    };
    const linhas = await this.db.contrato.findMany({ where, orderBy: { criadoEm: "desc" } });
    return linhas.map(paraContrato);
  }

  async buscarPorId(id: string): Promise<Contrato | null> {
    const linha = await this.db.contrato.findUnique({ where: { id } });
    return linha ? paraContrato(linha) : null;
  }

  async buscarPorOcupacao(ocupacaoId: string): Promise<Contrato[]> {
    return this.listar({ ocupacaoId });
  }

  async criar(dados: NovoContrato): Promise<Contrato> {
    const numero = dados.numero ?? (await this.proximoNumero());
    const c = dados.condicoes;

    const linha = await this.db.contrato.create({
      data: {
        id: gerarId("ctr"),
        ocupacaoId: dados.ocupacaoId,
        numero,
        status: dados.status,
        valorAluguel: c.valorAluguel,
        valorCaucao: c.valorCaucao,
        diaVencimento: c.diaVencimento,
        prazoMeses: c.prazoMeses,
        indiceReajuste: c.indiceReajuste,
        dataInicio: paraColunaData(c.dataInicio),
        dataFim: paraColunaData(c.dataFim),
        clausulasAdicionais: c.clausulasAdicionais ?? null,
        arquivoPdfUrl: dados.arquivoPdfUrl,
        dataGeracao: dados.dataGeracao ? new Date(dados.dataGeracao) : null,
        statusAssinatura: dados.statusAssinatura,
        assinaturaTelefone: dados.assinaturaTelefone,
        assinaturaEnviadaEm: dados.assinaturaEnviadaEm ? new Date(dados.assinaturaEnviadaEm) : null,
        assinaturaOrigem: dados.assinaturaOrigem,
        arquivoAssinadoUrl: dados.arquivoAssinadoUrl,
        assinadoEm: dados.assinadoEm ? new Date(dados.assinadoEm) : null,
        criadoEm: new Date(),
      },
    });
    return paraContrato(linha);
  }

  async atualizar(id: string, dados: AtualizacaoContrato): Promise<Contrato> {
    const c = dados.condicoes;
    try {
      const linha = await this.db.contrato.update({
        where: { id },
        data: {
          ...(dados.status !== undefined && { status: dados.status }),
          ...(dados.numero !== undefined && { numero: dados.numero }),
          ...(dados.arquivoPdfUrl !== undefined && { arquivoPdfUrl: dados.arquivoPdfUrl }),
          ...(dados.dataGeracao !== undefined && {
            dataGeracao: dados.dataGeracao ? new Date(dados.dataGeracao) : null,
          }),
          ...(dados.statusAssinatura !== undefined && { statusAssinatura: dados.statusAssinatura }),
          ...(dados.assinaturaTelefone !== undefined && {
            assinaturaTelefone: dados.assinaturaTelefone,
          }),
          ...(dados.assinaturaEnviadaEm !== undefined && {
            assinaturaEnviadaEm: dados.assinaturaEnviadaEm ? new Date(dados.assinaturaEnviadaEm) : null,
          }),
          ...(dados.assinaturaOrigem !== undefined && { assinaturaOrigem: dados.assinaturaOrigem }),
          ...(dados.arquivoAssinadoUrl !== undefined && {
            arquivoAssinadoUrl: dados.arquivoAssinadoUrl,
          }),
          ...(dados.assinadoEm !== undefined && {
            assinadoEm: dados.assinadoEm ? new Date(dados.assinadoEm) : null,
          }),
          ...(c && {
            valorAluguel: c.valorAluguel,
            valorCaucao: c.valorCaucao,
            diaVencimento: c.diaVencimento,
            prazoMeses: c.prazoMeses,
            indiceReajuste: c.indiceReajuste,
            dataInicio: paraColunaData(c.dataInicio),
            dataFim: paraColunaData(c.dataFim),
            clausulasAdicionais: c.clausulasAdicionais ?? null,
          }),
        },
      });
      return paraContrato(linha);
    } catch {
      throw new RecursoNaoEncontrado("Contrato", id);
    }
  }

  async excluir(id: string): Promise<void> {
    try {
      await this.db.contrato.delete({ where: { id } });
    } catch {
      throw new RecursoNaoEncontrado("Contrato", id);
    }
  }

  /** Numeração sequencial por ano: 2026/0001, 2026/0002... */
  private async proximoNumero(): Promise<string> {
    const ano = new Date().getFullYear();
    const ultimo = await this.db.contrato.findFirst({
      where: { numero: { startsWith: `${ano}/` } },
      orderBy: { numero: "desc" },
      select: { numero: true },
    });
    const sequencia = ultimo ? Number(ultimo.numero.split("/")[1]) || 0 : 0;
    return `${ano}/${String(sequencia + 1).padStart(4, "0")}`;
  }
}
