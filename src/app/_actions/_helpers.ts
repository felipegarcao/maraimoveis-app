import { ZodError, type ZodSchema } from "zod";
import type { ResultadoAcao } from "@/application/dtos";
import { mensagemDeErro } from "@/domain/errors";
import { casosDeUso } from "@/casos-de-uso";

/**
 * Envelopa uma Server Action: valida a entrada com zod, executa e devolve
 * sempre `ResultadoAcao` — os formulários nunca precisam de try/catch.
 */
export async function executarAcao<Entrada, Saida>(
  schema: ZodSchema<Entrada>,
  entrada: unknown,
  acao: (dados: Entrada) => Promise<Saida>,
): Promise<ResultadoAcao<Saida>> {
  const validacao = schema.safeParse(entrada);
  if (!validacao.success) {
    return { sucesso: false, erro: "Confira os campos destacados.", camposInvalidos: mapearErros(validacao.error) };
  }

  try {
    return { sucesso: true, dados: await acao(validacao.data) };
  } catch (erro) {
    console.error("[acao]", erro);
    return { sucesso: false, erro: mensagemDeErro(erro) };
  }
}

/** Versão sem validação de schema, para ações que recebem só um id. */
export async function executarSimples<Saida>(
  acao: () => Promise<Saida>,
): Promise<ResultadoAcao<Saida>> {
  try {
    return { sucesso: true, dados: await acao() };
  } catch (erro) {
    console.error("[acao]", erro);
    return { sucesso: false, erro: mensagemDeErro(erro) };
  }
}

/** Toda ação administrativa passa por aqui — o middleware sozinho não basta. */
export async function exigirSessao() {
  return casosDeUso.auth.sessaoAtual.exigir();
}

function mapearErros(erro: ZodError): Record<string, string> {
  const campos: Record<string, string> = {};
  for (const problema of erro.errors) {
    const caminho = problema.path.join(".");
    if (caminho && !campos[caminho]) campos[caminho] = problema.message;
  }
  return campos;
}
