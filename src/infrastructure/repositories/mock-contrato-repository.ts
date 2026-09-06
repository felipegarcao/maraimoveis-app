import type {
  AtualizacaoContrato,
  ContratoRepository,
  FiltroContratos,
  NovoContrato,
} from "@/domain/repositories";
import type { Contrato } from "@/domain/entities";
import { RecursoNaoEncontrado } from "@/domain/errors";
import { gerarId } from "@/lib/utils";
import { seedContratos } from "../mocks";
import { JsonStore } from "../persistence/json-store";

export class MockContratoRepository implements ContratoRepository {
  private readonly store = new JsonStore<Contrato>("contratos", seedContratos);

  async listar(filtro: FiltroContratos = {}): Promise<Contrato[]> {
    const itens = await this.store.ler();
    return itens
      .filter((contrato) => {
        if (filtro.ocupacaoId && contrato.ocupacaoId !== filtro.ocupacaoId) return false;
        if (filtro.status && contrato.status !== filtro.status) return false;
        return true;
      })
      .sort((a, b) => (a.criadoEm > b.criadoEm ? -1 : 1));
  }

  async buscarPorId(id: string): Promise<Contrato | null> {
    const itens = await this.store.ler();
    return itens.find((contrato) => contrato.id === id) ?? null;
  }

  async buscarPorOcupacao(ocupacaoId: string): Promise<Contrato[]> {
    return this.listar({ ocupacaoId });
  }

  async criar(dados: NovoContrato): Promise<Contrato> {
    return this.store.mutar((itens) => {
      const contrato: Contrato = {
        ...dados,
        numero: dados.numero ?? proximoNumero(itens),
        id: gerarId("ctr"),
        criadoEm: new Date().toISOString(),
      };
      return { itens: [contrato, ...itens], resultado: contrato };
    });
  }

  async atualizar(id: string, dados: AtualizacaoContrato): Promise<Contrato> {
    return this.store.mutar((itens) => {
      const indice = itens.findIndex((contrato) => contrato.id === id);
      if (indice === -1) throw new RecursoNaoEncontrado("Contrato", id);
      const atualizado: Contrato = { ...itens[indice], ...dados };
      itens[indice] = atualizado;
      return { itens, resultado: atualizado };
    });
  }

  async excluir(id: string): Promise<void> {
    return this.store.mutar((itens) => {
      const restantes = itens.filter((contrato) => contrato.id !== id);
      if (restantes.length === itens.length) throw new RecursoNaoEncontrado("Contrato", id);
      return { itens: restantes, resultado: undefined };
    });
  }
}

/** Numeração sequencial por ano: 2026/0001, 2026/0002... */
function proximoNumero(contratos: readonly Contrato[]): string {
  const ano = new Date().getFullYear();
  const doAno = contratos.filter((c) => c.numero.startsWith(`${ano}/`));
  const maior = doAno.reduce((max, c) => Math.max(max, Number(c.numero.split("/")[1]) || 0), 0);
  return `${ano}/${String(maior + 1).padStart(4, "0")}`;
}
