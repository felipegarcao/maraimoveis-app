import type { Dependencias } from "@/application/ports";
import {
  MockContratoRepository,
  MockImovelRepository,
  MockInquilinoRepository,
  MockCredencialInquilinoRepository,
  MockLeadRepository,
  MockOcupacaoRepository,
  MockPagamentoRepository,
  MockUsuarioRepository,
} from "./repositories";
import {
  PrismaContratoRepository,
  PrismaCredencialInquilinoRepository,
  PrismaImovelRepository,
  PrismaInquilinoRepository,
  PrismaLeadRepository,
  PrismaOcupacaoRepository,
  PrismaPagamentoRepository,
  PrismaUsuarioRepository,
} from "./repositories/prisma";
import { usarPostgres } from "./persistence/prisma-client";
import {
  COOKIE_SESSAO_ADMIN,
  COOKIE_SESSAO_INQUILINO,
  CookieSessionService,
} from "./auth/cookie-session-service";
import { ConsoleEmailService, ResendEmailService } from "./email/resend-email-service";
import { LocalStorageService } from "./storage/local-storage-service";
import { ReactPdfContratoService } from "./pdf/react-pdf-contrato-service";
import { ScryptHashSenhaService } from "./auth/scrypt-hash-service";
import {
  N8nWebhookContratoService,
  WebhookContratoDesativado,
} from "./webhook/n8n-webhook-service";

/**
 * Composition root — o ÚNICO lugar que conhece implementações concretas.
 *
 * Casos de uso recebem as portas por parâmetro; as rotas pedem os casos de uso
 * já montados. Migrar para Prisma/Supabase é editar apenas este arquivo.
 */
export type Container = Dependencias;

function criarContainer(): Container {
  const apiKeyResend = process.env.RESEND_API_KEY;
  const urlWebhookContrato = process.env.N8N_WEBHOOK_CONTRATO_URL;

  /**
   * A persistência é escolhida aqui e em nenhum outro lugar: com `DATABASE_URL`
   * definida, tudo vai para o PostgreSQL; sem ela, para os arquivos JSON. As
   * duas famílias implementam as mesmas interfaces de `domain/repositories`,
   * então nenhum caso de uso, schema ou tela percebe a diferença.
   */
  const comPostgres = usarPostgres();

  return {
    imoveis: comPostgres ? new PrismaImovelRepository() : new MockImovelRepository(),
    inquilinos: comPostgres ? new PrismaInquilinoRepository() : new MockInquilinoRepository(),
    ocupacoes: comPostgres ? new PrismaOcupacaoRepository() : new MockOcupacaoRepository(),
    contratos: comPostgres ? new PrismaContratoRepository() : new MockContratoRepository(),
    pagamentos: comPostgres ? new PrismaPagamentoRepository() : new MockPagamentoRepository(),
    usuarios: comPostgres ? new PrismaUsuarioRepository() : new MockUsuarioRepository(),
    leads: comPostgres ? new PrismaLeadRepository() : new MockLeadRepository(),
    credenciaisInquilinos: comPostgres
      ? new PrismaCredencialInquilinoRepository()
      : new MockCredencialInquilinoRepository(),
    storage: new LocalStorageService(),
    email: apiKeyResend ? new ResendEmailService(apiKeyResend) : new ConsoleEmailService(),
    sessao: new CookieSessionService(COOKIE_SESSAO_ADMIN),
    sessaoInquilino: new CookieSessionService(COOKIE_SESSAO_INQUILINO),
    pdf: new ReactPdfContratoService(),
    webhookContrato: urlWebhookContrato
      ? new N8nWebhookContratoService(urlWebhookContrato, process.env.N8N_WEBHOOK_TOKEN)
      : new WebhookContratoDesativado(),
    hashSenha: new ScryptHashSenhaService(),
  };
}

/**
 * Singleton preservado entre hot reloads do Next — sem isso cada recompilação
 * criaria novos JsonStore e perderia o cache em memória.
 */
const globalParaContainer = globalThis as unknown as { __maraContainer?: Container };

export const container: Container = globalParaContainer.__maraContainer ?? criarContainer();

if (process.env.NODE_ENV !== "production") {
  globalParaContainer.__maraContainer = container;
}
