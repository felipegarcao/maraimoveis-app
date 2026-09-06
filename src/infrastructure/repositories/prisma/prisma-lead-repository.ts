import type { LeadRepository, NovoLead } from "@/domain/repositories";
import type { Lead, StatusLead } from "@/domain/entities";
import { RecursoNaoEncontrado } from "@/domain/errors";
import { gerarId } from "@/lib/utils";
import { obterPrisma } from "../../persistence/prisma-client";
import { paraLead } from "../../persistence/prisma-mappers";

export class PrismaLeadRepository implements LeadRepository {
  private get db() {
    return obterPrisma();
  }

  async listar(filtro: { status?: StatusLead } = {}): Promise<Lead[]> {
    const linhas = await this.db.lead.findMany({
      where: filtro.status ? { status: filtro.status } : undefined,
      orderBy: { criadoEm: "desc" },
    });
    return linhas.map(paraLead);
  }

  async buscarPorId(id: string): Promise<Lead | null> {
    const linha = await this.db.lead.findUnique({ where: { id } });
    return linha ? paraLead(linha) : null;
  }

  async criar(dados: NovoLead): Promise<Lead> {
    const linha = await this.db.lead.create({
      data: {
        id: gerarId("led"),
        nome: dados.nome,
        email: dados.email,
        telefone: dados.telefone,
        mensagem: dados.mensagem,
        origem: dados.origem,
        imovelId: dados.imovelId,
        status: dados.status ?? "novo",
        criadoEm: new Date(),
      },
    });
    return paraLead(linha);
  }

  async atualizar(id: string, dados: Partial<Omit<Lead, "id" | "criadoEm">>): Promise<Lead> {
    try {
      const linha = await this.db.lead.update({
        where: { id },
        data: {
          ...(dados.nome !== undefined && { nome: dados.nome }),
          ...(dados.email !== undefined && { email: dados.email }),
          ...(dados.telefone !== undefined && { telefone: dados.telefone }),
          ...(dados.mensagem !== undefined && { mensagem: dados.mensagem }),
          ...(dados.origem !== undefined && { origem: dados.origem }),
          ...(dados.imovelId !== undefined && { imovelId: dados.imovelId }),
          ...(dados.status !== undefined && { status: dados.status }),
        },
      });
      return paraLead(linha);
    } catch {
      throw new RecursoNaoEncontrado("Lead", id);
    }
  }
}
