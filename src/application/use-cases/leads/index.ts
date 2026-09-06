import type { Lead, OrigemLead, StatusLead } from "@/domain/entities";
import { Endereco } from "@/domain/value-objects";
import { RecursoNaoEncontrado } from "@/domain/errors";
import type { ImovelRepository, LeadRepository } from "@/domain/repositories";
import type { EmailService } from "@/domain/services";
import { emailNovoLead } from "@/application/templates/email-lead";
import { siteConfig } from "@/lib/config";

export interface DadosLead {
  nome: string;
  email: string;
  telefone: string;
  mensagem: string;
  origem: OrigemLead;
  imovelId?: string | null;
  /** Base do site, para montar o link do anúncio no e-mail. */
  urlBase?: string;
}

/**
 * Registra o contato e notifica por e-mail.
 *
 * O envio de e-mail não pode derrubar o formulário: se o Resend falhar, o lead
 * já está salvo e aparece no painel — o usuário não perde o contato.
 */
export class RegistrarLead {
  constructor(
    private readonly leads: LeadRepository,
    private readonly imoveis: ImovelRepository,
    private readonly email: EmailService,
  ) {}

  async executar(dados: DadosLead): Promise<{ lead: Lead; emailEnviado: boolean }> {
    const imovel = dados.imovelId ? await this.imoveis.buscarPorId(dados.imovelId) : null;

    const lead = await this.leads.criar({
      nome: dados.nome,
      email: dados.email,
      telefone: dados.telefone,
      mensagem: dados.mensagem,
      origem: dados.origem,
      imovelId: imovel?.id ?? null,
    });

    let emailEnviado = false;
    try {
      await this.email.enviar({
        para: siteConfig.emailContato,
        assunto: imovel
          ? `Novo interesse: ${imovel.titulo}`
          : `Novo contato pelo site — ${dados.nome}`,
        responderPara: dados.email,
        html: emailNovoLead({
          nome: dados.nome,
          email: dados.email,
          telefone: dados.telefone,
          mensagem: dados.mensagem,
          imovel: imovel
            ? {
                titulo: imovel.titulo,
                endereco: Endereco.completo(imovel.endereco),
                url: `${dados.urlBase ?? ""}/imoveis/${imovel.id}`,
              }
            : null,
        }),
      });
      emailEnviado = true;
    } catch (erro) {
      console.error("[leads] Falha ao notificar por e-mail:", erro);
    }

    return { lead, emailEnviado };
  }
}

export class ListarLeads {
  constructor(private readonly leads: LeadRepository) {}

  async executar(filtro: { status?: StatusLead } = {}): Promise<Lead[]> {
    return this.leads.listar(filtro);
  }
}

export class AtualizarStatusLead {
  constructor(private readonly leads: LeadRepository) {}

  async executar(id: string, status: StatusLead): Promise<Lead> {
    const lead = await this.leads.buscarPorId(id);
    if (!lead) throw new RecursoNaoEncontrado("Lead", id);
    return this.leads.atualizar(id, { status });
  }
}
