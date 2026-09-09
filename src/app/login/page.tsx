import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, Building2 } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { Card, CardBody, Skeleton } from "@/presentation/components/ui";
import { FormularioLogin } from "@/presentation/features/auth/formulario-login";

export const metadata: Metadata = { title: "Entrar" };

export default function PaginaLogin() {
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
            <p className="text-xs text-slate-500">Painel administrativo</p>
          </div>
        </div>

        <Card className="mt-5">
          <CardBody className="sm:p-6">
            <h1 className="text-lg font-semibold text-slate-900">Entrar na sua conta</h1>
            <p className="mt-1 text-sm text-slate-500">
              Use suas credenciais para acessar a gestão de imóveis.
            </p>
            <div className="mt-5">
              <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                <FormularioLogin />
              </Suspense>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
