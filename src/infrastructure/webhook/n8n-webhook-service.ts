import type { EnvioContratoWebhook, WebhookContratoService } from "@/domain/services";

/** Fluxo lento (o n8n pode estar montando a mensagem) sem travar a tela para sempre. */
const TIMEOUT_MS = 20_000;

/**
 * Dispara o contrato para um webhook do n8n.
 *
 * O corpo é JSON com o PDF em base64 — no n8n basta um nó "Convert to File"
 * sobre `pdf.base64` para ter o binário pronto para enviar por WhatsApp. O
 * número de destino é decidido no fluxo; aqui só vai o telefone do inquilino,
 * caso o fluxo prefira usá-lo.
 */
export class N8nWebhookContratoService implements WebhookContratoService {
  constructor(
    private readonly url: string,
    private readonly token?: string,
  ) {}

  configurado(): boolean {
    return this.url.length > 0;
  }

  async enviar(payload: EnvioContratoWebhook): Promise<void> {
    const resposta = await fetch(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!resposta.ok) {
      const detalhe = (await resposta.text().catch(() => "")).slice(0, 200);
      throw new Error(
        `O fluxo do n8n respondeu ${resposta.status}${detalhe ? `: ${detalhe}` : "."}`,
      );
    }
  }
}

/**
 * Stand-in de desenvolvimento: sem `N8N_WEBHOOK_CONTRATO_URL` o envio não
 * existe, e a tela esconde o botão em vez de oferecer uma ação que falharia.
 */
export class WebhookContratoDesativado implements WebhookContratoService {
  configurado(): boolean {
    return false;
  }

  async enviar(): Promise<void> {
    throw new Error(
      "Envio para o n8n não configurado. Defina N8N_WEBHOOK_CONTRATO_URL no .env.",
    );
  }
}
