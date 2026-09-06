import type { CredencialInquilinoRepository } from "@/domain/repositories";
import type { CredencialInquilino } from "@/domain/entities";
import { JsonStore } from "../persistence/json-store";

export class MockCredencialInquilinoRepository implements CredencialInquilinoRepository {
  // Começa vazio: todo inquilino nasce usando a senha padrão.
  private readonly store = new JsonStore<CredencialInquilino>("credenciais-inquilinos", () => []);

  async buscarPorInquilino(inquilinoId: string): Promise<CredencialInquilino | null> {
    const itens = await this.store.ler();
    return itens.find((credencial) => credencial.id === inquilinoId) ?? null;
  }

  async salvar(inquilinoId: string, senhaHash: string): Promise<CredencialInquilino> {
    const credencial: CredencialInquilino = {
      id: inquilinoId,
      senhaHash,
      atualizadoEm: new Date().toISOString(),
    };
    return this.store.mutar((itens) => ({
      itens: [...itens.filter((c) => c.id !== inquilinoId), credencial],
      resultado: credencial,
    }));
  }

  async remover(inquilinoId: string): Promise<void> {
    return this.store.mutar((itens) => ({
      itens: itens.filter((credencial) => credencial.id !== inquilinoId),
      resultado: undefined,
    }));
  }
}
