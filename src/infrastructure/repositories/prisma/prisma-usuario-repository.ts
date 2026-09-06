import type { UsuarioRepository } from "@/domain/repositories";
import type { Usuario } from "@/domain/entities";
import { gerarId } from "@/lib/utils";
import { obterPrisma } from "../../persistence/prisma-client";
import { paraUsuario } from "../../persistence/prisma-mappers";
import { conferirSenha, gerarHashSenha } from "../../auth/senha";

export class PrismaUsuarioRepository implements UsuarioRepository {
  private get db() {
    return obterPrisma();
  }

  async listar(): Promise<Usuario[]> {
    const linhas = await this.db.usuario.findMany({ orderBy: { nome: "asc" } });
    return linhas.map(paraUsuario);
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    const linha = await this.db.usuario.findUnique({ where: { id } });
    return linha ? paraUsuario(linha) : null;
  }

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    const linha = await this.db.usuario.findUnique({ where: { email: email.trim().toLowerCase() } });
    return linha ? paraUsuario(linha) : null;
  }

  async validarCredenciais(email: string, senha: string): Promise<Usuario | null> {
    const linha = await this.db.usuario.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!linha || !linha.ativo) return null;
    return (await conferirSenha(senha, linha.senhaHash)) ? paraUsuario(linha) : null;
  }

  async criar(dados: Omit<Usuario, "id" | "criadoEm">, senha: string): Promise<Usuario> {
    const linha = await this.db.usuario.create({
      data: {
        id: gerarId("usr"),
        nome: dados.nome,
        email: dados.email.trim().toLowerCase(),
        papel: dados.papel,
        ativo: dados.ativo,
        senhaHash: await gerarHashSenha(senha),
        criadoEm: new Date(),
      },
    });
    return paraUsuario(linha);
  }
}
