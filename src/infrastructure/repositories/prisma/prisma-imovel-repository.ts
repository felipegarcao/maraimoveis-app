import type { Prisma } from "@prisma/client";
import type {
  AtualizacaoImovel,
  FiltroImoveis,
  ImovelRepository,
  NovoImovel,
} from "@/domain/repositories";
import type { Imovel } from "@/domain/entities";
import { RecursoNaoEncontrado } from "@/domain/errors";
import { gerarId, normalizarTexto } from "@/lib/utils";
import { obterPrisma } from "../../persistence/prisma-client";
import { paraImovel } from "../../persistence/prisma-mappers";

/** Texto usado pela coluna de busca: tudo que faz sentido procurar num imóvel. */
function textoDeBusca(dados: NovoImovel): string {
  return normalizarTexto(
    [
      dados.titulo,
      dados.descricao,
      dados.endereco.logradouro,
      dados.endereco.bairro,
      dados.endereco.cidade,
    ].join(" "),
  );
}

function colunasDoImovel(dados: NovoImovel) {
  return {
    titulo: dados.titulo,
    descricao: dados.descricao,
    tipo: dados.tipo,
    status: dados.status,
    logradouro: dados.endereco.logradouro,
    numero: dados.endereco.numero,
    complemento: dados.endereco.complemento ?? null,
    bairro: dados.endereco.bairro,
    cidade: dados.endereco.cidade,
    estado: dados.endereco.estado,
    cep: dados.endereco.cep,
    valorAluguel: dados.valorAluguel,
    valorCondominio: dados.valorCondominio,
    valorIptu: dados.valorIptu,
    quartos: dados.caracteristicas.quartos,
    suites: dados.caracteristicas.suites,
    banheiros: dados.caracteristicas.banheiros,
    vagas: dados.caracteristicas.vagas,
    areaM2: dados.caracteristicas.areaM2,
    mobiliado: dados.caracteristicas.mobiliado,
    aceitaPet: dados.caracteristicas.aceitaPet,
    condominio: dados.caracteristicas.condominio,
    busca: textoDeBusca(dados),
  };
}

export class PrismaImovelRepository implements ImovelRepository {
  private get db() {
    return obterPrisma();
  }

  async listar(filtro: FiltroImoveis = {}): Promise<Imovel[]> {
    const where: Prisma.ImovelWhereInput = {
      ...(filtro.status && { status: filtro.status }),
      ...(filtro.tipo && { tipo: filtro.tipo }),
      ...(filtro.cidade && { cidade: filtro.cidade }),
      ...(filtro.bairro && { bairro: filtro.bairro }),
      ...(filtro.aceitaPet && { aceitaPet: true }),
      ...(filtro.mobiliado && { mobiliado: true }),
      ...(filtro.quartosMin !== undefined && { quartos: { gte: filtro.quartosMin } }),
      ...((filtro.precoMin !== undefined || filtro.precoMax !== undefined) && {
        valorAluguel: {
          ...(filtro.precoMin !== undefined && { gte: filtro.precoMin }),
          ...(filtro.precoMax !== undefined && { lte: filtro.precoMax }),
        },
      }),
      ...(filtro.termo && { busca: { contains: normalizarTexto(filtro.termo) } }),
    };

    const linhas = await this.db.imovel.findMany({
      where,
      include: { fotos: true },
      orderBy: { criadoEm: "desc" },
    });
    return linhas.map(paraImovel);
  }

  async buscarPorId(id: string): Promise<Imovel | null> {
    const linha = await this.db.imovel.findUnique({ where: { id }, include: { fotos: true } });
    return linha ? paraImovel(linha) : null;
  }

  async criar(dados: NovoImovel): Promise<Imovel> {
    const agora = new Date();
    const linha = await this.db.imovel.create({
      data: {
        id: gerarId("imv"),
        ...colunasDoImovel(dados),
        criadoEm: agora,
        atualizadoEm: agora,
        fotos: {
          create: dados.fotos.map((foto) => ({
            id: foto.id,
            url: foto.url,
            descricao: foto.descricao,
            ordem: foto.ordem,
          })),
        },
      },
      include: { fotos: true },
    });
    return paraImovel(linha);
  }

  async atualizar(id: string, dados: AtualizacaoImovel): Promise<Imovel> {
    const atual = await this.buscarPorId(id);
    if (!atual) throw new RecursoNaoEncontrado("Imóvel", id);

    // A atualização é parcial: completamos com o estado atual para recalcular
    // colunas derivadas (como a de busca) sem perder nada.
    const completo: NovoImovel = {
      titulo: dados.titulo ?? atual.titulo,
      descricao: dados.descricao ?? atual.descricao,
      tipo: dados.tipo ?? atual.tipo,
      status: dados.status ?? atual.status,
      endereco: dados.endereco ?? atual.endereco,
      valorAluguel: dados.valorAluguel ?? atual.valorAluguel,
      valorCondominio: dados.valorCondominio ?? atual.valorCondominio,
      valorIptu: dados.valorIptu ?? atual.valorIptu,
      caracteristicas: dados.caracteristicas ?? atual.caracteristicas,
      fotos: dados.fotos ?? atual.fotos,
    };

    const linha = await this.db.imovel.update({
      where: { id },
      data: {
        ...colunasDoImovel(completo),
        atualizadoEm: new Date(),
        // Substituição completa: a ordem e a capa vêm prontas do formulário.
        ...(dados.fotos && {
          fotos: {
            deleteMany: {},
            create: dados.fotos.map((foto) => ({
              id: foto.id,
              url: foto.url,
              descricao: foto.descricao,
              ordem: foto.ordem,
            })),
          },
        }),
      },
      include: { fotos: true },
    });
    return paraImovel(linha);
  }

  async excluir(id: string): Promise<void> {
    try {
      await this.db.imovel.delete({ where: { id } });
    } catch {
      throw new RecursoNaoEncontrado("Imóvel", id);
    }
  }

  async listarLocalidades(): Promise<{ cidades: string[]; bairros: string[] }> {
    const [cidades, bairros] = await Promise.all([
      this.db.imovel.findMany({ distinct: ["cidade"], select: { cidade: true }, orderBy: { cidade: "asc" } }),
      this.db.imovel.findMany({ distinct: ["bairro"], select: { bairro: true }, orderBy: { bairro: "asc" } }),
    ]);
    return { cidades: cidades.map((c) => c.cidade), bairros: bairros.map((b) => b.bairro) };
  }
}
