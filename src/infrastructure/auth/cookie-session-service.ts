import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { SessionService } from "@/domain/services";

export const COOKIE_SESSAO_ADMIN = "mara_sessao";
export const COOKIE_SESSAO_INQUILINO = "mara_sessao_inquilino";

const DURACAO_SEGUNDOS = 60 * 60 * 8; // 8 horas
/**
 * O segredo é lido sob demanda, e não na carga do módulo, para que a checagem
 * aconteça em runtime — falhar durante o build não ajudaria ninguém.
 */
function obterSegredo(): string {
  const segredo = process.env.SESSAO_SECRET;
  if (segredo && segredo.length >= 16) return segredo;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Defina SESSAO_SECRET com pelo menos 16 caracteres. Sem isso, qualquer pessoa pode forjar um cookie de sessão.",
    );
  }
  return "mara-imoveis-dev-secret-nao-usar-em-producao";
}

/**
 * Sessão mock em cookie httpOnly assinado com HMAC.
 *
 * Não substitui autenticação real (não há refresh nem revogação), mas implementa
 * a porta `SessionService`: plugar NextAuth/Clerk/Supabase depois é trocar este
 * adapter no container.
 *
 * É genérica e recebe o nome do cookie no construtor porque o painel e o portal
 * do inquilino mantêm sessões separadas — entrar em um não dá acesso ao outro.
 */
export class CookieSessionService<T> implements SessionService<T> {
  constructor(private readonly nomeCookie: string) {}

  async obterSessao(): Promise<T | null> {
    const bruto = (await cookies()).get(this.nomeCookie)?.value;
    if (!bruto) return null;
    return verificar<T>(bruto);
  }

  async criarSessao(dados: T): Promise<void> {
    (await cookies()).set(this.nomeCookie, assinar(dados), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: DURACAO_SEGUNDOS,
    });
  }

  async encerrarSessao(): Promise<void> {
    (await cookies()).delete(this.nomeCookie);
  }
}

function assinar(dados: unknown): string {
  const payload = Buffer.from(JSON.stringify(dados)).toString("base64url");
  return `${payload}.${hmac(payload)}`;
}

function verificar<T>(token: string): T | null {
  const [payload, assinatura] = token.split(".");
  if (!payload || !assinatura) return null;

  const esperada = Buffer.from(hmac(payload));
  const recebida = Buffer.from(assinatura);
  if (esperada.length !== recebida.length || !timingSafeEqual(esperada, recebida)) return null;

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString()) as T;
  } catch {
    return null;
  }
}

function hmac(valor: string): string {
  return createHmac("sha256", obterSegredo()).update(valor).digest("base64url");
}
