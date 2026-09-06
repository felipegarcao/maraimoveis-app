import type { UsuarioRepository } from "@/domain/repositories";
import type { Usuario } from "@/domain/entities";
import { gerarId } from "@/lib/utils";
import { usuariosSeed, type UsuarioComSenha } from "../mocks";
import { conferirSenha, gerarHashSenha } from "../auth/senha";
import { JsonStore } from "../persistence/json-store";

export class MockUsuarioRepository implements UsuarioRepository {
  private readonly store = new JsonStore<UsuarioComSenha>("usuarios", usuariosSeed);

  async listar(): Promise<Usuario[]> {
    const itens = await this.store.ler();
    return itens.map(semSenha);
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    const itens = await this.store.ler();
    const encontrado = itens.find((usuario) => usuario.id === id);
    return encontrado ? semSenha(encontrado) : null;
  }

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    const itens = await this.store.ler();
    const alvo = email.trim().toLowerCase();
    const encontrado = itens.find((usuario) => usuario.email.toLowerCase() === alvo);
    return encontrado ? semSenha(encontrado) : null;
  }

  async validarCredenciais(email: string, senha: string): Promise<Usuario | null> {
    const itens = await this.store.ler();
    const alvo = email.trim().toLowerCase();
    const encontrado = itens.find((usuario) => usuario.email.toLowerCase() === alvo);

    if (!encontrado || !encontrado.ativo) return null;
    return (await conferirSenha(senha, encontrado.senhaHash)) ? semSenha(encontrado) : null;
  }

  async criar(dados: Omit<Usuario, "id" | "criadoEm">, senha: string): Promise<Usuario> {
    const usuario: UsuarioComSenha = {
      ...dados,
      senhaHash: await gerarHashSenha(senha),
      id: gerarId("usr"),
      criadoEm: new Date().toISOString(),
    };
    return this.store.mutar((itens) => ({
      itens: [...itens, usuario],
      resultado: semSenha(usuario),
    }));
  }
}

/** O hash da senha nunca sai do repositório. */
function semSenha(registro: UsuarioComSenha): Usuario {
  return {
    id: registro.id,
    nome: registro.nome,
    email: registro.email,
    papel: registro.papel,
    ativo: registro.ativo,
    criadoEm: registro.criadoEm,
  };
}
