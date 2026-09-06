import type {
  AtualizacaoOcupacao,
  FiltroOcupacoes,
  NovaOcupacao,
  OcupacaoRepository,
} from "@/domain/repositories";
import type { Ocupacao } from "@/domain/entities";
import { RecursoNaoEncontrado } from "@/domain/errors";
import { gerarId } from "@/lib/utils";
import { seedOcupacoes } from "../mocks";
import { JsonStore } from "../persistence/json-store";

export class MockOcupacaoRepository implements OcupacaoRepository {
  private readonly store = new JsonStore<Ocupacao>("ocupacoes", seedOcupacoes);

  async listar(filtro: FiltroOcupacoes = {}): Promise<Ocupacao[]> {
    const itens = await this.store.ler();
    return itens
      .filter((ocupacao) => {
        if (filtro.imovelId && ocupacao.imovelId !== filtro.imovelId) return false;
        if (filtro.inquilinoId && ocupacao.inquilinoId !== filtro.inquilinoId) return false;
        if (filtro.status && ocupacao.status !== filtro.status) return false;
        return true;
      })
      .sort((a, b) => (a.dataEntrada > b.dataEntrada ? -1 : 1));
  }

  async buscarPorId(id: string): Promise<Ocupacao | null> {
    const itens = await this.store.ler();
    return itens.find((ocupacao) => ocupacao.id === id) ?? null;
  }

  async buscarAtivaPorImovel(imovelId: string): Promise<Ocupacao | null> {
    const itens = await this.store.ler();
    return (
      itens.find((ocupacao) => ocupacao.imovelId === imovelId && ocupacao.status === "ativa") ?? null
    );
  }

  async criar(dados: NovaOcupacao): Promise<Ocupacao> {
    const ocupacao: Ocupacao = {
      ...dados,
      dataSaida: dados.dataSaida ?? null,
      status: dados.status ?? "ativa",
      id: gerarId("ocp"),
      criadoEm: new Date().toISOString(),
    };
    return this.store.mutar((itens) => ({ itens: [ocupacao, ...itens], resultado: ocupacao }));
  }

  async atualizar(id: string, dados: AtualizacaoOcupacao): Promise<Ocupacao> {
    return this.store.mutar((itens) => {
      const indice = itens.findIndex((ocupacao) => ocupacao.id === id);
      if (indice === -1) throw new RecursoNaoEncontrado("Ocupação", id);
      const atualizada: Ocupacao = { ...itens[indice], ...dados };
      itens[indice] = atualizada;
      return { itens, resultado: atualizada };
    });
  }

  async excluir(id: string): Promise<void> {
    return this.store.mutar((itens) => {
      const restantes = itens.filter((ocupacao) => ocupacao.id !== id);
      if (restantes.length === itens.length) throw new RecursoNaoEncontrado("Ocupação", id);
      return { itens: restantes, resultado: undefined };
    });
  }
}
