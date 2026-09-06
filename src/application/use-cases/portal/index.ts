import type { InquilinoSessao } from "@/domain/entities";
import { NaoAutorizado, RecursoNaoEncontrado, RegraDeNegocioViolada } from "@/domain/errors";
import { Dinheiro } from "@/domain/value-objects";
import type {
  ContratoRepository,
  CredencialInquilinoRepository,
  ImovelRepository,
  InquilinoRepository,
  OcupacaoRepository,
  PagamentoRepository,
} from "@/domain/repositories";
import type { HashSenhaService, SessionService } from "@/domain/services";
import type { CobrancaMensal, PainelInquilino } from "@/application/dtos";
import { paraCobranca, paraResumoInquilino } from "@/application/mappers";
import { detalharOcupacao, type FontesDeDetalhe } from "../ocupacoes";
import { apenasDigitos } from "@/lib/utils";

/**
 * Verifica a senha do inquilino.
 *
 * Enquanto não existe credencial salva, a senha válida é o próprio documento —
 * é o "primeiro acesso com CPF". Assim que ele define uma senha, só o hash vale.
 */
async function senhaConfere(
  senhaInformada: string,
  documento: string,
  senhaHash: string | undefined,
  hashSenha: HashSenhaService,
): Promise<boolean> {
  if (senhaHash) return hashSenha.conferir(senhaInformada, senhaHash);
  return apenasDigitos(senhaInformada) === apenasDigitos(documento);
}

export interface ResultadoAutenticacao {
  readonly sessao: InquilinoSessao;
  readonly usandoSenhaPadrao: boolean;
}

export class AutenticarInquilino {
  constructor(
    private readonly inquilinos: InquilinoRepository,
    private readonly credenciais: CredencialInquilinoRepository,
    private readonly hashSenha: HashSenhaService,
    private readonly sessao: SessionService<InquilinoSessao>,
  ) {}

  async executar(documento: string, senha: string): Promise<ResultadoAutenticacao> {
    const inquilino = await this.inquilinos.buscarPorDocumento(documento);
    // Mensagem única de propósito: não revela se o documento está cadastrado.
    const invalido = new NaoAutorizado("Documento ou senha inválidos.");
    if (!inquilino) throw invalido;

    const credencial = await this.credenciais.buscarPorInquilino(inquilino.id);
    const confere = await senhaConfere(
      senha,
      inquilino.documento,
      credencial?.senhaHash,
      this.hashSenha,
    );
    if (!confere) throw invalido;

    if (!inquilino.ativo) {
      throw new NaoAutorizado(
        "Este cadastro está inativo. Fale com a administração para reativar seu acesso.",
      );
    }

    const sessao: InquilinoSessao = {
      id: inquilino.id,
      nome: inquilino.nome,
      documento: inquilino.documento,
    };
    await this.sessao.criarSessao(sessao);

    return { sessao, usandoSenhaPadrao: credencial === null };
  }
}

export class ObterSessaoInquilino {
  constructor(private readonly sessao: SessionService<InquilinoSessao>) {}

  async executar(): Promise<InquilinoSessao | null> {
    return this.sessao.obterSessao();
  }

  async exigir(): Promise<InquilinoSessao> {
    const sessao = await this.sessao.obterSessao();
    if (!sessao) throw new NaoAutorizado("Faça login para acessar o portal.");
    return sessao;
  }
}

export class EncerrarSessaoInquilino {
  constructor(private readonly sessao: SessionService<InquilinoSessao>) {}

  async executar(): Promise<void> {
    await this.sessao.encerrarSessao();
  }
}

export class AlterarSenhaInquilino {
  constructor(
    private readonly inquilinos: InquilinoRepository,
    private readonly credenciais: CredencialInquilinoRepository,
    private readonly hashSenha: HashSenhaService,
  ) {}

  async executar(inquilinoId: string, senhaAtual: string, novaSenha: string): Promise<void> {
    const inquilino = await this.inquilinos.buscarPorId(inquilinoId);
    if (!inquilino) throw new RecursoNaoEncontrado("Inquilino", inquilinoId);

    const credencial = await this.credenciais.buscarPorInquilino(inquilinoId);
    const confere = await senhaConfere(
      senhaAtual,
      inquilino.documento,
      credencial?.senhaHash,
      this.hashSenha,
    );
    if (!confere) {
      throw new RegraDeNegocioViolada("A senha atual está incorreta.");
    }

    // Impede voltar para a senha padrão, que é pública por definição.
    if (apenasDigitos(novaSenha) === apenasDigitos(inquilino.documento)) {
      throw new RegraDeNegocioViolada(
        "A nova senha não pode ser o seu documento. Escolha uma senha só sua.",
      );
    }
    if (novaSenha === senhaAtual) {
      throw new RegraDeNegocioViolada("A nova senha precisa ser diferente da atual.");
    }

    await this.credenciais.salvar(inquilinoId, await this.hashSenha.gerar(novaSenha));
  }
}

/** Ação do painel: devolve o acesso do inquilino à senha padrão (o documento). */
export class RedefinirSenhaInquilino {
  constructor(
    private readonly inquilinos: InquilinoRepository,
    private readonly credenciais: CredencialInquilinoRepository,
  ) {}

  async executar(inquilinoId: string): Promise<void> {
    const inquilino = await this.inquilinos.buscarPorId(inquilinoId);
    if (!inquilino) throw new RecursoNaoEncontrado("Inquilino", inquilinoId);
    await this.credenciais.remover(inquilinoId);
  }
}

/** Consulta única que monta a tela inteira do portal. */
export class ObterPainelInquilino {
  constructor(
    private readonly inquilinos: InquilinoRepository,
    private readonly ocupacoes: OcupacaoRepository,
    private readonly imoveis: ImovelRepository,
    private readonly contratos: ContratoRepository,
    private readonly pagamentos: PagamentoRepository,
    private readonly credenciais: CredencialInquilinoRepository,
  ) {}

  async executar(inquilinoId: string): Promise<PainelInquilino> {
    const inquilino = await this.inquilinos.buscarPorId(inquilinoId);
    if (!inquilino) throw new RecursoNaoEncontrado("Inquilino", inquilinoId);

    const fontes: FontesDeDetalhe = {
      imoveis: this.imoveis,
      inquilinos: this.inquilinos,
      contratos: this.contratos,
      pagamentos: this.pagamentos,
    };

    const [ocupacoes, credencial] = await Promise.all([
      this.ocupacoes.listar({ inquilinoId }),
      this.credenciais.buscarPorInquilino(inquilinoId),
    ]);

    const detalhadas = await Promise.all(
      ocupacoes.map((ocupacao) => detalharOcupacao(ocupacao, fontes)),
    );
    const ocupacaoAtual = detalhadas.find((d) => d.ocupacao.status === "ativa") ?? null;

    const [imovelAtual, cobrancas] = await Promise.all([
      ocupacaoAtual ? this.imoveis.buscarPorId(ocupacaoAtual.ocupacao.imovelId) : null,
      ocupacoes.length > 0
        ? this.pagamentos.listar({ ocupacaoIds: ocupacoes.map((o) => o.id) })
        : Promise.resolve([]),
    ]);

    const porOcupacao = new Map(detalhadas.map((d) => [d.ocupacao.id, d]));
    const resumoInquilino = paraResumoInquilino(inquilino);
    const agora = new Date();

    const todas: CobrancaMensal[] = cobrancas.flatMap((pagamento) => {
      const detalhe = porOcupacao.get(pagamento.ocupacaoId);
      if (!detalhe) return [];
      return [paraCobranca(pagamento, detalhe.imovel, resumoInquilino, agora)];
    });

    const pendentes = todas
      .filter((c) => c.saldoDevedor > 0)
      .sort((a, b) => (a.pagamento.dataVencimento > b.pagamento.dataVencimento ? 1 : -1));
    const pagas = todas
      .filter((c) => c.saldoDevedor === 0)
      .sort((a, b) => (a.pagamento.mesReferencia > b.pagamento.mesReferencia ? -1 : 1));

    return {
      inquilino,
      usandoSenhaPadrao: credencial === null,
      ocupacaoAtual,
      imovelAtual: imovelAtual ?? null,
      contratoAtual: ocupacaoAtual?.contrato ?? null,
      ocupacoesAnteriores: detalhadas.filter((d) => d.ocupacao.status === "encerrada"),
      cobrancasPendentes: pendentes,
      cobrancasPagas: pagas,
      totalPago: Dinheiro.somar(...todas.map((c) => c.valorPago)),
      totalEmAberto: Dinheiro.somar(...pendentes.map((c) => c.saldoDevedor)),
      // A próxima a vencer é a pendência mais antiga ainda não paga.
      proximaCobranca: pendentes[0] ?? null,
    };
  }
}

export interface SituacaoAcessoPortal {
  /** `false` quando o inquilino ainda entra com o documento como senha. */
  readonly definiuSenha: boolean;
  readonly atualizadoEm: string | null;
}

/** Usado no painel para saber se o inquilino já criou a própria senha. */
export class ConsultarAcessoPortal {
  constructor(private readonly credenciais: CredencialInquilinoRepository) {}

  async executar(inquilinoId: string): Promise<SituacaoAcessoPortal> {
    const credencial = await this.credenciais.buscarPorInquilino(inquilinoId);
    return {
      definiuSenha: credencial !== null,
      atualizadoEm: credencial?.atualizadoEm ?? null,
    };
  }
}
