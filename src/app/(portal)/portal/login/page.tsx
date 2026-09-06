import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, Building2, Info } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { Card, CardBody, Skeleton } from "@/presentation/components/ui";
import { FormularioLoginInquilino } from "@/presentation/features/portal/formulario-login-inquilino";

export const metadata: Metadata = { title: "Portal do inquilino" };

export default function PaginaLoginPortal() {
  return (
    <div className="flex min-h-dvh flex-col justify-center bg-gradient-to-b from-brand-50/60 to-canvas px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-brand-700"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Voltar ao site
        </Link>

        <div className="mt-6 flex items-center gap-2.5">
          <span className="flex size-10 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Building2 aria-hidden className="size-5" />
          </span>
          <div>
            <p className="text-base font-semibold text-slate-900">{siteConfig.nome}</p>
            <p className="text-xs text-slate-500">Portal do inquilino</p>
          </div>
        </div>

        <Card className="mt-5">
          <CardBody className="sm:p-6">
            <h1 className="text-lg font-semibold text-slate-900">Acesse seu portal</h1>
            <p className="mt-1 text-sm text-slate-500">
              Veja seu imóvel, contrato e a situação dos pagamentos.
            </p>
            <div className="mt-5">
              <Suspense fallback={<Skeleton className="h-56 w-full" />}>
                <FormularioLoginInquilino />
              </Suspense>
            </div>
          </CardBody>
        </Card>

        <div className="mt-4 flex items-start gap-2.5 rounded-card border border-dashed border-brand-200 bg-brand-50/50 p-4">
          <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-600" />
          <p className="text-xs leading-relaxed text-slate-600">
            <strong className="font-semibold text-brand-800">Primeiro acesso?</strong> Use o seu
            CPF (ou CNPJ) como login <em>e</em> como senha. Depois de entrar, você pode definir uma
            senha própria. Esqueceu a senha? Fale com a administração para reiniciar o acesso.
          </p>
        </div>
      </div>
    </div>
  );
}
