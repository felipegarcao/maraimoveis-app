import type {
  CredencialInquilinoRepository,
  ContratoRepository,
  ImovelRepository,
  InquilinoRepository,
  LeadRepository,
  OcupacaoRepository,
  PagamentoRepository,
  UsuarioRepository,
} from "@/domain/repositories";
import type {
  ContratoPdfService,
  EmailService,
  HashSenhaService,
  SessionService,
  StorageService,
} from "@/domain/services";
import type { InquilinoSessao } from "@/domain/entities";

/**
 * Tudo que a camada de aplicação precisa do mundo externo, expresso apenas
 * em interfaces do domínio. Quem satisfaz este contrato é o container da
 * infraestrutura — a aplicação nunca vê uma classe concreta.
 */
export interface Dependencias {
  readonly imoveis: ImovelRepository;
  readonly inquilinos: InquilinoRepository;
  readonly ocupacoes: OcupacaoRepository;
  readonly contratos: ContratoRepository;
  readonly pagamentos: PagamentoRepository;
  readonly usuarios: UsuarioRepository;
  readonly leads: LeadRepository;
  readonly credenciaisInquilinos: CredencialInquilinoRepository;
  readonly storage: StorageService;
  readonly email: EmailService;
  readonly sessao: SessionService;
  /** Sessão do portal do inquilino — independente da do painel. */
  readonly sessaoInquilino: SessionService<InquilinoSessao>;
  readonly pdf: ContratoPdfService;
  readonly hashSenha: HashSenhaService;
}
