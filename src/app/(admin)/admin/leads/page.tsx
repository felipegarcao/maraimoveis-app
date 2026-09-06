import type { Metadata } from "next";
import Link from "next/link";
import { Inbox, Mail } from "lucide-react";
import { casosDeUso } from "@/casos-de-uso";
import { ROTULOS_STATUS_LEAD, STATUS_LEAD, type StatusLead } from "@/domain/entities";
import { formatarDataHora, formatarTelefone, formatarTempoRelativo } from "@/lib/formatters";
import { Badge, Card, EmptyState, classesBotao, type TomBadge } from "@/presentation/components/ui";
import { BotaoWhatsApp } from "@/presentation/features/publico/botao-whatsapp";
import { SeletorStatusLead } from "@/presentation/features/leads/seletor-status-lead";

export const metadata: Metadata = { title: "Leads" };

const TOM_POR_STATUS: Record<StatusLead, TomBadge> = {
  novo: "marca",
  em_atendimento: "alerta",
  convertido: "sucesso",
  descartado: "neutro",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const texto = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

export default async function PaginaLeads({ searchParams }: Props) {
  const params = await searchParams;
  const status = texto(params.status);

  const [leads, imoveis] = await Promise.all([
    casosDeUso.leads.listar.executar({
      status: STATUS_LEAD.includes(status as StatusLead) ? (status as StatusLead) : undefined,
    }),
    casosDeUso.imoveis.listar.executar(),
  ]);

  const porImovel = new Map(imoveis.map((i) => [i.id, i]));

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        {leads.length} {leads.length === 1 ? "contato recebido" : "contatos recebidos"} pelo site
      </p>

      <Card className="p-3 sm:p-4">
        <nav aria-label="Filtrar leads" className="flex flex-wrap gap-2">
          {[{ valor: "", rotulo: "Todos" }, ...STATUS_LEAD.map((s) => ({ valor: s, rotulo: ROTULOS_STATUS_LEAD[s] }))].map(
            (opcao) => (
              <Link
                key={opcao.valor || "todos"}
                href={opcao.valor ? `/admin/leads?status=${opcao.valor}` : "/admin/leads"}
                aria-current={status === opcao.valor ? "page" : undefined}
                className={classesBotao(status === opcao.valor ? "suave" : "fantasma", "sm")}
              >
                {opcao.rotulo}
              </Link>
            ),
          )}
        </nav>
      </Card>

      {leads.length === 0 ? (
        <Card>
          <EmptyState
            icone={Inbox}
            titulo="Nenhum lead por aqui"
            descricao="Os contatos enviados pelo formulário do site aparecem nesta lista, prontos para responder."
          />
        </Card>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {leads.map((lead) => {
            const imovel = lead.imovelId ? porImovel.get(lead.imovelId) : null;
            return (
              <li key={lead.id} className="min-w-0">
                <Card className="flex h-full min-w-0 flex-col p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-sm font-semibold text-slate-900">{lead.nome}</h2>
                        <Badge tom={TOM_POR_STATUS[lead.status]} ponto>
                          {ROTULOS_STATUS_LEAD[lead.status]}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatarTempoRelativo(lead.criadoEm)} ·{" "}
                        <time dateTime={lead.criadoEm}>{formatarDataHora(lead.criadoEm)}</time>
                      </p>
                    </div>
                    <div className="w-36 shrink-0">
                      <SeletorStatusLead id={lead.id} status={lead.status} />
                    </div>
                  </div>

                  {imovel ? (
                    <Link
                      href={`/admin/imoveis/${imovel.id}`}
                      className="mt-2.5 inline-flex max-w-full items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100"
                    >
                      <span className="truncate">Interesse: {imovel.titulo}</span>
                    </Link>
                  ) : (
                    <p className="mt-2.5 text-xs text-slate-500">Contato geral (sem imóvel específico)</p>
                  )}

                  <p className="mt-3 flex-1 whitespace-pre-line rounded-lg bg-slate-50 px-3 py-2.5 text-sm leading-relaxed text-slate-700">
                    {lead.mensagem}
                  </p>

                  <dl className="mt-3 space-y-1 text-xs text-slate-600">
                    <div className="flex gap-2">
                      <dt className="text-slate-500">E-mail</dt>
                      <dd className="min-w-0 truncate">
                        <a href={`mailto:${lead.email}`} className="hover:text-brand-700">
                          {lead.email}
                        </a>
                      </dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-slate-500">Telefone</dt>
                      <dd>{formatarTelefone(lead.telefone)}</dd>
                    </div>
                  </dl>

                  <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                    <BotaoWhatsApp
                      telefone={lead.telefone}
                      tamanho="sm"
                      rotulo="Responder no WhatsApp"
                      mensagem={
                        imovel
                          ? `Olá, ${lead.nome.split(" ")[0]}! Aqui é da Mara Imóveis. Recebemos seu contato sobre o imóvel "${imovel.titulo}".`
                          : `Olá, ${lead.nome.split(" ")[0]}! Aqui é da Mara Imóveis. Recebemos seu contato pelo site.`
                      }
                    />
                    <a
                      href={`mailto:${lead.email}?subject=${encodeURIComponent("Mara Imóveis — seu contato pelo site")}`}
                      className={classesBotao("secundario", "sm")}
                    >
                      <Mail aria-hidden className="size-4" />
                      E-mail
                    </a>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
