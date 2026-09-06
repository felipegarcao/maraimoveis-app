import type { Prisma } from "@prisma/client";
import type {
  AtualizacaoInquilino,
  FiltroInquilinos,
  InquilinoRepository,
  NovoInquilino,
} from "@/domain/repositories";
import type { Inquilino } from "@/domain/entities";
import { RecursoNaoEncontrado } from "@/domain/errors";
import { apenasDigitos, gerarId, normalizarTexto } from "@/lib/utils";
import { obterPrisma } from "../../persistence/prisma-client";
import { paraInquilino } from "../../persistence/prisma-mappers";

function textoDeBusca(dados: NovoInquilino): string {
  return normalizarTexto(
    [dados.nome, dados.email ?? "", dados.documento, dados.telefone].join(" "),
  );
}

export class PrismaInquilinoRepository implements InquilinoRepository {
  private get db() {
    return obterPrisma();
  }

  async listar(filtro: FiltroInquilinos = {}): Promise<Inquilino[]> {
    const where: Prisma.InquilinoWhereInput = {
      ...(filtro.ativo !== undefined && { ativo: filtro.ativo }),
      ...(filtro.termo && { busca: { contains: normalizarTexto(filtro.termo) } }),
    };
    const linhas = await this.db.inquilino.findMany({ where, orderBy: { nome: "asc" } });
    return linhas.map(paraInquilino);
  }

  async buscarPorId(id: string): Promise<Inquilino | null> {
    const linha = await this.db.inquilino.findUnique({ where: { id } });
    return linha ? paraInquilino(linha) : null;
  }

  async buscarPorDocumento(documento: string): Promise<Inquilino | null> {
    const linha = await this.db.inquilino.findUnique({
      where: { documento: apenasDigitos(documento) },
    });
    return linha ? paraInquilino(linha) : null;
  }

  async criar(dados: NovoInquilino): Promise<Inquilino> {
    const agora = new Date();
    const linha = await this.db.inquilino.create({
      data: {
        id: gerarId("inq"),
        nome: dados.nome,
        tipoDocumento: dados.tipoDocumento,
        documento: apenasDigitos(dados.documento),
        email: dados.email ?? null,
        telefone: dados.telefone,
        profissao: dados.profissao ?? null,
        observacoes: dados.observacoes ?? null,
        ativo: dados.ativo,
        busca: textoDeBusca(dados),
        dataCadastro: agora,
        atualizadoEm: agora,
      },
    });
    return paraInquilino(linha);
  }

  async atualizar(id: string, dados: AtualizacaoInquilino): Promise<Inquilino> {
    const atual = await this.buscarPorId(id);
    if (!atual) throw new RecursoNaoEncontrado("Inquilino", id);

    const completo: NovoInquilino = {
      nome: dados.nome ?? atual.nome,
      tipoDocumento: dados.tipoDocumento ?? atual.tipoDocumento,
      documento: dados.documento ?? atual.documento,
      email: dados.email ?? atual.email,
      telefone: dados.telefone ?? atual.telefone,
      profissao: dados.profissao ?? atual.profissao,
      observacoes: dados.observacoes ?? atual.observacoes,
      ativo: dados.ativo ?? atual.ativo,
    };

    const linha = await this.db.inquilino.update({
      where: { id },
      data: {
        nome: completo.nome,
        tipoDocumento: completo.tipoDocumento,
        documento: apenasDigitos(completo.documento),
        // `email` cai para null quando o campo é limpo no formulário.
        email: dados.email !== undefined ? (dados.email ?? null) : undefined,
        telefone: completo.telefone,
        profissao: dados.profissao !== undefined ? (dados.profissao ?? null) : undefined,
        observacoes: dados.observacoes !== undefined ? (dados.observacoes ?? null) : undefined,
        ativo: completo.ativo,
        busca: textoDeBusca({ ...completo, email: dados.email !== undefined ? dados.email : atual.email }),
        atualizadoEm: new Date(),
      },
    });
    return paraInquilino(linha);
  }

  async excluir(id: string): Promise<void> {
    try {
      await this.db.inquilino.delete({ where: { id } });
    } catch {
      throw new RecursoNaoEncontrado("Inquilino", id);
    }
  }
}
