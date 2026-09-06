import { Resend } from "resend";
import type { EmailService, MensagemEmail } from "@/domain/services";
import { siteConfig } from "@/lib/config";

/** Adapter de e-mail sobre a API do Resend. */
export class ResendEmailService implements EmailService {
  private readonly cliente: Resend;

  constructor(apiKey: string) {
    this.cliente = new Resend(apiKey);
  }

  async enviar(mensagem: MensagemEmail): Promise<{ id: string }> {
    const { data, error } = await this.cliente.emails.send({
      from: siteConfig.emailRemetente,
      to: mensagem.para,
      subject: mensagem.assunto,
      html: mensagem.html,
      replyTo: mensagem.responderPara,
    });

    if (error) {
      throw new Error(`Falha ao enviar e-mail: ${error.message}`);
    }
    return { id: data?.id ?? "sem-id" };
  }
}

/**
 * Fallback usado quando RESEND_API_KEY não está configurada.
 * Mantém o fluxo funcionando em desenvolvimento sem engolir o erro em silêncio.
 */
export class ConsoleEmailService implements EmailService {
  async enviar(mensagem: MensagemEmail): Promise<{ id: string }> {
    console.info(
      `[email:mock] Para: ${mensagem.para} | Assunto: ${mensagem.assunto}\n` +
        `Configure RESEND_API_KEY no .env.local para enviar de verdade.`,
    );
    return { id: `mock_${Date.now()}` };
  }
}
