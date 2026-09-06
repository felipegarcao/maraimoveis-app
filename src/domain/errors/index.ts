/** Erro de domínio: previsível, exibível ao usuário. Distingue de bugs de infraestrutura. */
export class ErroDominio extends Error {
  constructor(
    message: string,
    readonly codigo: string = "ERRO_DOMINIO",
  ) {
    super(message);
    this.name = "ErroDominio";
  }
}

export class RecursoNaoEncontrado extends ErroDominio {
  constructor(recurso: string, id: string) {
    super(`${recurso} não encontrado (id: ${id}).`, "NAO_ENCONTRADO");
    this.name = "RecursoNaoEncontrado";
  }
}

export class RegraDeNegocioViolada extends ErroDominio {
  constructor(message: string) {
    super(message, "REGRA_VIOLADA");
    this.name = "RegraDeNegocioViolada";
  }
}

export class NaoAutorizado extends ErroDominio {
  constructor(message = "Você não tem permissão para executar esta ação.") {
    super(message, "NAO_AUTORIZADO");
    this.name = "NaoAutorizado";
  }
}

export function ehErroDominio(erro: unknown): erro is ErroDominio {
  return erro instanceof ErroDominio;
}

/** Extrai uma mensagem segura para exibir na UI a partir de qualquer erro. */
export function mensagemDeErro(erro: unknown, fallback = "Algo deu errado. Tente novamente."): string {
  if (ehErroDominio(erro)) return erro.message;
  if (erro instanceof Error && process.env.NODE_ENV === "development") return erro.message;
  return fallback;
}
