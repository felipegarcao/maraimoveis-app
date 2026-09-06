import type { Usuario, UsuarioSessao } from "@/domain/entities";
import { NaoAutorizado } from "@/domain/errors";
import type { UsuarioRepository } from "@/domain/repositories";
import type { SessionService } from "@/domain/services";

export class AutenticarUsuario {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly sessao: SessionService,
  ) {}

  async executar(email: string, senha: string): Promise<UsuarioSessao> {
    const usuario = await this.usuarios.validarCredenciais(email, senha);
    if (!usuario) {
      // Mensagem genérica de propósito: não revela se o e-mail existe.
      throw new NaoAutorizado("E-mail ou senha inválidos.");
    }

    const sessao = paraSessao(usuario);
    await this.sessao.criarSessao(sessao);
    return sessao;
  }
}

export class ObterSessaoAtual {
  constructor(private readonly sessao: SessionService) {}

  async executar(): Promise<UsuarioSessao | null> {
    return this.sessao.obterSessao();
  }

  /** Versão que lança quando não há sessão — usada nas Server Actions do admin. */
  async exigir(): Promise<UsuarioSessao> {
    const usuario = await this.sessao.obterSessao();
    if (!usuario) throw new NaoAutorizado("Faça login para continuar.");
    return usuario;
  }
}

export class EncerrarSessao {
  constructor(private readonly sessao: SessionService) {}

  async executar(): Promise<void> {
    await this.sessao.encerrarSessao();
  }
}

function paraSessao(usuario: Usuario): UsuarioSessao {
  return { id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel };
}
