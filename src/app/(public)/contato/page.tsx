import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { formatarTelefone } from "@/lib/formatters";
import { Card, CardBody } from "@/presentation/components/ui";
import { BotaoWhatsApp } from "@/presentation/features/publico/botao-whatsapp";
import { FormularioContato } from "@/presentation/features/publico/formulario-contato";

export const metadata: Metadata = {
  title: "Contato",
  description: "Fale com a equipe da Mara Imóveis por WhatsApp, e-mail ou formulário.",
};

export default function PaginaContato() {
  const canais = [
    {
      icone: Phone,
      rotulo: "WhatsApp",
      valor: formatarTelefone(siteConfig.whatsapp),
      href: null,
    },
    { icone: Mail, rotulo: "E-mail", valor: siteConfig.emailContato, href: `mailto:${siteConfig.emailContato}` },
    { icone: MapPin, rotulo: "Endereço", valor: siteConfig.endereco, href: null },
    { icone: Clock, rotulo: "Atendimento", valor: "Segunda a sexta, 9h às 18h", href: null },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Fale com a gente
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600">
          Procurando um imóvel específico, quer agendar uma visita ou tem uma dúvida sobre contrato?
          Escreva pra gente — respondemos no mesmo dia útil.
        </p>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
        <Card>
          <CardBody className="sm:p-6">
            <FormularioContato />
          </CardBody>
        </Card>

        <aside className="space-y-4">
          <Card>
            <CardBody>
              <h2 className="text-base font-semibold text-slate-900">Canais diretos</h2>
              <dl className="mt-4 space-y-4">
                {canais.map(({ icone: Icone, rotulo, valor, href }) => (
                  <div key={rotulo} className="flex items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <Icone aria-hidden className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        {rotulo}
                      </dt>
                      <dd className="text-sm text-slate-800">
                        {href ? (
                          <a href={href} className="break-words hover:text-brand-700">
                            {valor}
                          </a>
                        ) : (
                          valor
                        )}
                      </dd>
                    </div>
                  </div>
                ))}
              </dl>

              <div className="mt-5 border-t border-line pt-5">
                <BotaoWhatsApp
                  mensagem="Olá! Vim pelo site da Mara Imóveis e gostaria de informações."
                  className="w-full"
                  tamanho="lg"
                />
              </div>
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}
