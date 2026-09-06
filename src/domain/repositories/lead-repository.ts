import type { Lead, StatusLead } from "../entities";

export type NovoLead = Omit<Lead, "id" | "criadoEm" | "status"> & { readonly status?: StatusLead };

export interface LeadRepository {
  listar(filtro?: { status?: StatusLead }): Promise<Lead[]>;
  buscarPorId(id: string): Promise<Lead | null>;
  criar(dados: NovoLead): Promise<Lead>;
  atualizar(id: string, dados: Partial<Omit<Lead, "id" | "criadoEm">>): Promise<Lead>;
}
