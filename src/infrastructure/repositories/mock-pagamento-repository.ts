import type {
  AtualizacaoPagamento,
  FiltroPagamentos,
  NovoPagamento,
  PagamentoRepository,
} from "@/domain/repositories";
import type { Pagamento } from "@/domain/entities";
import { RecursoNaoEncontrado } from "@/domain/errors";
import { gerarId } from "@/lib/utils";
import { seedPagamentos } from "../mocks";
import { JsonStore } from "../persistence/json-store";

export class MockPagamentoRepository implements PagamentoRepository {
  private readonly store = new JsonStore<Pagamento>("pagamentos", seedPagamentos);

  async listar(filtro: FiltroPagamentos = {}): Promise<Pagamento[]> {
    const itens = await this.store.ler();
    const ids = filtro.ocupacaoIds ? new Set(filtro.ocupacaoIds) : null;

    return itens
      .filter((pagamento) => {
        if (filtro.ocupacaoId && pagamento.ocupacaoId !== filtro.ocupacaoId) return false;
        if (ids && !ids.has(pagamento.ocupacaoId)) return false;
        if (filtro.mesReferencia && pagamento.mesReferencia !== filtro.mesReferencia) return false;
        if (filtro.mesDe && pagamento.mesReferencia < filtro.mesDe) return false;
        if (filtro.mesAte && pagamento.mesReferencia > filtro.mesAte) return false;
        return true;
      })
      .sort((a, b) => (a.mesReferencia > b.mesReferencia ? -1 : 1));
  }

  async buscarPorId(id: string): Promise<Pagamento | null> {
    const itens = await this.store.ler();
    return itens.find((pagamento) => pagamento.id === id) ?? null;
  }

  async buscarPorMes(ocupacaoId: string, mesReferencia: string): Promise<Pagamento | null> {
    const itens = await this.store.ler();
    return (
      itens.find(
        (pagamento) =>
          pagamento.ocupacaoId === ocupacaoId && pagamento.mesReferencia === mesReferencia,
      ) ?? null
    );
  }

  async criar(dados: NovoPagamento): Promise<Pagamento> {
    const pagamento: Pagamento = {
      ...dados,
      recebimentos: dados.recebimentos ?? [],
      id: gerarId("pgt"),
      criadoEm: new Date().toISOString(),
    };
    return this.store.mutar((itens) => ({ itens: [pagamento, ...itens], resultado: pagamento }));
  }

  async atualizar(id: string, dados: AtualizacaoPagamento): Promise<Pagamento> {
    return this.store.mutar((itens) => {
      const indice = itens.findIndex((pagamento) => pagamento.id === id);
      if (indice === -1) throw new RecursoNaoEncontrado("Pagamento", id);
      const atualizado: Pagamento = { ...itens[indice], ...dados };
      itens[indice] = atualizado;
      return { itens, resultado: atualizado };
    });
  }

  async excluir(id: string): Promise<void> {
    return this.store.mutar((itens) => {
      const restantes = itens.filter((pagamento) => pagamento.id !== id);
      if (restantes.length === itens.length) throw new RecursoNaoEncontrado("Pagamento", id);
      return { itens: restantes, resultado: undefined };
    });
  }
}
