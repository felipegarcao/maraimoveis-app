import type { HashSenhaService } from "@/domain/services";
import { conferirSenha, gerarHashSenha } from "./senha";

export class ScryptHashSenhaService implements HashSenhaService {
  gerar(senha: string): Promise<string> {
    return gerarHashSenha(senha);
  }

  conferir(senha: string, armazenado: string): Promise<boolean> {
    return conferirSenha(senha, armazenado);
  }
}
