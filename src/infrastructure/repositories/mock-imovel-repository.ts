import type {
  AtualizacaoImovel,
  FiltroImoveis,
  ImovelRepository,
  NovoImovel,
} from "@/domain/repositories";
import type { Imovel } from "@/domain/entities";
import { RecursoNaoEncontrado } from "@/domain/errors";
import { gerarId, normalizarTexto } from "@/lib/utils";
import { seedImoveis } from "../mocks";
import { JsonStore } from "../persistence/json-store";

export class MockImovelRepository implements ImovelRepository {
  private readonly store = new JsonStore<Imovel>("imoveis", seedImoveis);

  async listar(filtro: FiltroImoveis = {}): Promise<Imovel[]> {
    const itens = await this.store.ler();
    const termo = filtro.termo ? normalizarTexto(filtro.termo) : null;

    return itens
      .filter((imovel) => {
        if (filtro.status && imovel.status !== filtro.status) return false;
        if (filtro.tipo && imovel.tipo !== filtro.tipo) return false;
        if (filtro.cidade && imovel.endereco.cidade !== filtro.cidade) return false;
        if (filtro.bairro && imovel.endereco.bairro !== filtro.bairro) return false;
        if (filtro.precoMin !== undefined && imovel.valorAluguel < filtro.precoMin) return false;
        if (filtro.precoMax !== undefined && imovel.valorAluguel > filtro.precoMax) return false;
        if (
          filtro.quartosMin !== undefined &&
          imovel.caracteristicas.quartos < filtro.quartosMin
        ) {
          return false;
        }
        if (filtro.aceitaPet && !imovel.caracteristicas.aceitaPet) return false;
        if (filtro.mobiliado && !imovel.caracteristicas.mobiliado) return false;
        if (termo) {
          const alvo = normalizarTexto(
            [
              imovel.titulo,
              imovel.descricao,
              imovel.endereco.bairro,
              imovel.endereco.cidade,
              imovel.endereco.logradouro,
            ].join(" "),
          );
          if (!alvo.includes(termo)) return false;
        }
        return true;
      })
      .sort((a, b) => (a.criadoEm > b.criadoEm ? -1 : 1));
  }

  async buscarPorId(id: string): Promise<Imovel | null> {
    const itens = await this.store.ler();
    return itens.find((imovel) => imovel.id === id) ?? null;
  }

  async criar(dados: NovoImovel): Promise<Imovel> {
    const agora = new Date().toISOString();
    const imovel: Imovel = { ...dados, id: gerarId("imv"), criadoEm: agora, atualizadoEm: agora };
    return this.store.mutar((itens) => ({ itens: [imovel, ...itens], resultado: imovel }));
  }

  async atualizar(id: string, dados: AtualizacaoImovel): Promise<Imovel> {
    return this.store.mutar((itens) => {
      const indice = itens.findIndex((imovel) => imovel.id === id);
      if (indice === -1) throw new RecursoNaoEncontrado("Imóvel", id);
      const atualizado: Imovel = {
        ...itens[indice],
        ...dados,
        atualizadoEm: new Date().toISOString(),
      };
      itens[indice] = atualizado;
      return { itens, resultado: atualizado };
    });
  }

  async excluir(id: string): Promise<void> {
    return this.store.mutar((itens) => {
      const restantes = itens.filter((imovel) => imovel.id !== id);
      if (restantes.length === itens.length) throw new RecursoNaoEncontrado("Imóvel", id);
      return { itens: restantes, resultado: undefined };
    });
  }

  async listarLocalidades(): Promise<{ cidades: string[]; bairros: string[] }> {
    const itens = await this.store.ler();
    const cidades = [...new Set(itens.map((i) => i.endereco.cidade))].sort();
    const bairros = [...new Set(itens.map((i) => i.endereco.bairro))].sort();
    return { cidades, bairros };
  }
}
