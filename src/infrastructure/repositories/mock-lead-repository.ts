import type { LeadRepository, NovoLead } from "@/domain/repositories";
import type { Lead, StatusLead } from "@/domain/entities";
import { RecursoNaoEncontrado } from "@/domain/errors";
import { gerarId } from "@/lib/utils";
import { seedLeads } from "../mocks";
import { JsonStore } from "../persistence/json-store";

export class MockLeadRepository implements LeadRepository {
  private readonly store = new JsonStore<Lead>("leads", seedLeads);

  async listar(filtro: { status?: StatusLead } = {}): Promise<Lead[]> {
    const itens = await this.store.ler();
    return itens
      .filter((lead) => !filtro.status || lead.status === filtro.status)
      .sort((a, b) => (a.criadoEm > b.criadoEm ? -1 : 1));
  }

  async buscarPorId(id: string): Promise<Lead | null> {
    const itens = await this.store.ler();
    return itens.find((lead) => lead.id === id) ?? null;
  }

  async criar(dados: NovoLead): Promise<Lead> {
    const lead: Lead = {
      ...dados,
      status: dados.status ?? "novo",
      id: gerarId("led"),
      criadoEm: new Date().toISOString(),
    };
    return this.store.mutar((itens) => ({ itens: [lead, ...itens], resultado: lead }));
  }

  async atualizar(id: string, dados: Partial<Omit<Lead, "id" | "criadoEm">>): Promise<Lead> {
    return this.store.mutar((itens) => {
      const indice = itens.findIndex((lead) => lead.id === id);
      if (indice === -1) throw new RecursoNaoEncontrado("Lead", id);
      const atualizado: Lead = { ...itens[indice], ...dados };
      itens[indice] = atualizado;
      return { itens, resultado: atualizado };
    });
  }
}
