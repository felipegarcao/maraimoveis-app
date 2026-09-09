import type {
  AtualizacaoInquilino,
  FiltroInquilinos,
  InquilinoRepository,
  NovoInquilino,
} from "@/domain/repositories";
import type { Inquilino } from "@/domain/entities";
import { RecursoNaoEncontrado } from "@/domain/errors";
import { apenasDigitos, gerarId, normalizarTexto } from "@/lib/utils";
import { seedInquilinos } from "../mocks";
import { JsonStore } from "../persistence/json-store";

export class MockInquilinoRepository implements InquilinoRepository {
  private readonly store = new JsonStore<Inquilino>("inquilinos", seedInquilinos);

  async listar(filtro: FiltroInquilinos = {}): Promise<Inquilino[]> {
    const itens = await this.store.ler();
    const termo = filtro.termo ? normalizarTexto(filtro.termo) : null;

    return itens
      .filter((inquilino) => {
        if (filtro.ativo !== undefined && inquilino.ativo !== filtro.ativo) return false;
        if (termo) {
          const alvo = normalizarTexto(
            [
              inquilino.nome,
              inquilino.email ?? "",
              inquilino.documento,
              inquilino.rg ?? "",
              inquilino.telefone,
            ].join(" "),
          );
          if (!alvo.includes(termo)) return false;
        }
        return true;
      })
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }

  async buscarPorId(id: string): Promise<Inquilino | null> {
    const itens = await this.store.ler();
    return itens.find((inquilino) => inquilino.id === id) ?? null;
  }

  async buscarPorDocumento(documento: string): Promise<Inquilino | null> {
    const alvo = apenasDigitos(documento);
    const itens = await this.store.ler();
    return itens.find((inquilino) => apenasDigitos(inquilino.documento) === alvo) ?? null;
  }

  async criar(dados: NovoInquilino): Promise<Inquilino> {
    const agora = new Date().toISOString();
    const inquilino: Inquilino = {
      ...dados,
      id: gerarId("inq"),
      dataCadastro: agora,
      atualizadoEm: agora,
    };
    return this.store.mutar((itens) => ({ itens: [inquilino, ...itens], resultado: inquilino }));
  }

  async atualizar(id: string, dados: AtualizacaoInquilino): Promise<Inquilino> {
    return this.store.mutar((itens) => {
      const indice = itens.findIndex((inquilino) => inquilino.id === id);
      if (indice === -1) throw new RecursoNaoEncontrado("Inquilino", id);
      const atualizado: Inquilino = {
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
      const restantes = itens.filter((inquilino) => inquilino.id !== id);
      if (restantes.length === itens.length) throw new RecursoNaoEncontrado("Inquilino", id);
      return { itens: restantes, resultado: undefined };
    });
  }
}
