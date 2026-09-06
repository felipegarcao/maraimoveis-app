import type { CredencialInquilinoRepository } from "@/domain/repositories";
import type { CredencialInquilino } from "@/domain/entities";
import { obterPrisma } from "../../persistence/prisma-client";

export class PrismaCredencialInquilinoRepository implements CredencialInquilinoRepository {
  private get db() {
    return obterPrisma();
  }

  async buscarPorInquilino(inquilinoId: string): Promise<CredencialInquilino | null> {
    const linha = await this.db.credencialInquilino.findUnique({ where: { inquilinoId } });
    if (!linha) return null;
    return {
      id: linha.inquilinoId,
      senhaHash: linha.senhaHash,
      atualizadoEm: linha.atualizadoEm.toISOString(),
    };
  }

  async salvar(inquilinoId: string, senhaHash: string): Promise<CredencialInquilino> {
    const atualizadoEm = new Date();
    const linha = await this.db.credencialInquilino.upsert({
      where: { inquilinoId },
      create: { inquilinoId, senhaHash, atualizadoEm },
      update: { senhaHash, atualizadoEm },
    });
    return {
      id: linha.inquilinoId,
      senhaHash: linha.senhaHash,
      atualizadoEm: linha.atualizadoEm.toISOString(),
    };
  }

  async remover(inquilinoId: string): Promise<void> {
    // Idempotente: quem já usa a senha padrão não tem credencial para apagar.
    await this.db.credencialInquilino.deleteMany({ where: { inquilinoId } });
  }
}
