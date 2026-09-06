import Link from "next/link";
import { Building2, Mail, MapPin, Phone } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { formatarTelefone } from "@/lib/formatters";
import { linkWhatsApp } from "@/lib/whatsapp";

export function RodapePublico() {
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Building2 aria-hidden className="size-5" />
            </span>
            <span className="text-base font-semibold text-slate-900">{siteConfig.nome}</span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-600">
            {siteConfig.descricao}
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-900">Navegação</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>
              <Link href="/" className="hover:text-brand-700">
                Imóveis disponíveis
              </Link>
            </li>
            <li>
              <Link href="/contato" className="hover:text-brand-700">
                Fale com a gente
              </Link>
            </li>
            <li>
              <Link href="/portal" className="hover:text-brand-700">
                Portal do inquilino
              </Link>
            </li>
            <li>
              <Link href="/admin/dashboard" className="hover:text-brand-700">
                Área do gestor
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-900">Contato</h2>
          <ul className="mt-3 space-y-2.5 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <Phone aria-hidden className="mt-0.5 size-4 shrink-0 text-slate-400" />
              <a
                href={linkWhatsApp(undefined, "Olá! Vim pelo site e gostaria de informações.")}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand-700"
              >
                {formatarTelefone(siteConfig.whatsapp)}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <Mail aria-hidden className="mt-0.5 size-4 shrink-0 text-slate-400" />
              <a href={`mailto:${siteConfig.emailContato}`} className="break-all hover:text-brand-700">
                {siteConfig.emailContato}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-slate-400" />
              <span>{siteConfig.endereco}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line px-4 py-5 text-center text-xs text-slate-500 sm:px-6">
        © {new Date().getFullYear()} {siteConfig.nome}. Todos os direitos reservados.
      </div>
    </footer>
  );
}
