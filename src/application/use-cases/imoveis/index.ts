import type { Imovel } from "@/domain/entities";
import { RecursoNaoEncontrado, RegraDeNegocioViolada } from "@/domain/errors";
import type {
  AtualizacaoImovel,
  FiltroImoveis,
  ImovelRepository,
  NovoImovel,
  OcupacaoRepository,
} from "@/domain/repositories";
import type { StorageService } from "@/domain/services";

/** Vitrine pública: força o status `disponivel` independentemente do filtro recebido. */
export class ListarImoveisDisponiveis {
  constructor(private readonly imoveis: ImovelRepository) {}

  async executar(filtro: Omit<FiltroImoveis, "status"> = {}): Promise<Imovel[]> {
    return this.imoveis.listar({ ...filtro, status: "disponivel" });
  }
}

export class ListarImoveis {
  constructor(private readonly imoveis: ImovelRepository) {}

  async executar(filtro: FiltroImoveis = {}): Promise<Imovel[]> {
    return this.imoveis.listar(filtro);
  }
}

export class ObterImovel {
  constructor(private readonly imoveis: ImovelRepository) {}

  async executar(id: string): Promise<Imovel> {
    const imovel = await this.imoveis.buscarPorId(id);
    if (!imovel) throw new RecursoNaoEncontrado("Imóvel", id);
    return imovel;
  }
}

export class CriarImovel {
  constructor(private readonly imoveis: ImovelRepository) {}

  async executar(dados: NovoImovel): Promise<Imovel> {
    return this.imoveis.criar(dados);
  }
}

export class EditarImovel {
  constructor(private readonly imoveis: ImovelRepository) {}

  async executar(id: string, dados: AtualizacaoImovel): Promise<Imovel> {
    const atual = await this.imoveis.buscarPorId(id);
    if (!atual) throw new RecursoNaoEncontrado("Imóvel", id);
    return this.imoveis.atualizar(id, dados);
  }
}

/**
 * Exclusão protegida: um imóvel com histórico de ocupações nunca é apagado,
 * apenas inativado — o histórico do inquilino precisa continuar íntegro.
 */
export class ExcluirImovel {
  constructor(
    private readonly imoveis: ImovelRepository,
    private readonly ocupacoes: OcupacaoRepository,
  ) {}

  async executar(id: string): Promise<{ excluido: boolean }> {
    const imovel = await this.imoveis.buscarPorId(id);
    if (!imovel) throw new RecursoNaoEncontrado("Imóvel", id);

    const ocupacoes = await this.ocupacoes.listar({ imovelId: id });
    if (ocupacoes.some((o) => o.status === "ativa")) {
      throw new RegraDeNegocioViolada(
        "Este imóvel possui uma ocupação ativa. Registre a saída do inquilino antes de excluí-lo.",
      );
    }

    if (ocupacoes.length > 0) {
      await this.imoveis.atualizar(id, { status: "inativo" });
      return { excluido: false };
    }

    await this.imoveis.excluir(id);
    return { excluido: true };
  }
}

export class AlterarStatusImovel {
  constructor(
    private readonly imoveis: ImovelRepository,
    private readonly ocupacoes: OcupacaoRepository,
  ) {}

  async executar(id: string, status: Imovel["status"]): Promise<Imovel> {
    if (status === "disponivel") {
      const ativa = await this.ocupacoes.buscarAtivaPorImovel(id);
      if (ativa) {
        throw new RegraDeNegocioViolada(
          "Não é possível marcar como disponível: há uma ocupação ativa neste imóvel.",
        );
      }
    }
    return this.imoveis.atualizar(id, { status });
  }
}

export class ListarLocalidades {
  constructor(private readonly imoveis: ImovelRepository) {}

  async executar() {
    return this.imoveis.listarLocalidades();
  }
}

/** Limites do upload de fotos — validados no servidor, não só no input. */
const TIPOS_IMAGEM_ACEITOS = ["image/jpeg", "image/png", "image/webp"];
const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024;

export interface ArquivoFoto {
  nome: string;
  tipo: string;
  /** Data URL (base64) vinda do input de arquivo. */
  conteudo: string;
}

/**
 * Persiste a imagem no StorageService e devolve a URL pública.
 * O caso de uso não sabe se o destino é disco local, S3 ou Supabase.
 */
export class EnviarFotoImovel {
  constructor(private readonly storage: StorageService) {}

  async executar(arquivo: ArquivoFoto): Promise<{ url: string; chave: string }> {
    if (!TIPOS_IMAGEM_ACEITOS.includes(arquivo.tipo)) {
      throw new RegraDeNegocioViolada("Formato não aceito. Envie JPG, PNG ou WebP.");
    }

    const base64 = arquivo.conteudo.split("base64,")[1] ?? "";
    // 4 caracteres de base64 representam 3 bytes.
    const tamanhoAproximado = Math.floor((base64.length * 3) / 4);
    if (tamanhoAproximado > TAMANHO_MAXIMO_BYTES) {
      throw new RegraDeNegocioViolada("Imagem muito grande. O limite é 5 MB por foto.");
    }

    const salvo = await this.storage.salvar("imoveis", {
      nome: arquivo.nome,
      tipo: arquivo.tipo,
      conteudo: arquivo.conteudo,
    });
    return { url: salvo.url, chave: salvo.chave };
  }
}
