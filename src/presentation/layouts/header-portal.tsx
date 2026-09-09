"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, KeyRound, LogOut } from "lucide-react";
import type { InquilinoSessao } from "@/domain/entities";
import { sairPortal } from "@/app/_actions/portal";
import { siteConfig } from "@/lib/config";
import { ThemeToggle } from "@/presentation/components/ui";
import { cn } from "@/lib/utils";

export function HeaderPortal({ inquilino }: { inquilino: InquilinoSessao }) {
  const caminho = usePathname();

  const iniciais = inquilino.nome
    .split(" ")
    .filter(Boolean)
    .map((parte) => parte[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/portal" className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Building2 aria-hidden className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-slate-900">
              {siteConfig.nome}
            </span>
            <span className="block text-xs text-slate-500">Portal do inquilino</span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <ThemeToggle />

          <Link
            href="/portal/senha"
            aria-current={caminho === "/portal/senha" ? "page" : undefined}
            className={cn(
              "rounded-lg p-2 transition-colors sm:px-3",
              caminho === "/portal/senha"
                ? "bg-brand-50 text-brand-700"
                : "text-slate-600 hover:bg-slate-100",
            )}
          >
            <KeyRound aria-hidden className="size-4 sm:hidden" />
            <span className="hidden text-sm font-medium sm:inline">Alterar senha</span>
            <span className="sr-only sm:hidden">Alterar senha</span>
          </Link>

          <form action={sairPortal}>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg p-2 text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600 sm:px-3"
            >
              <LogOut aria-hidden className="size-4" />
              <span className="hidden text-sm font-medium sm:inline">Sair</span>
              <span className="sr-only sm:hidden">Sair</span>
            </button>
          </form>

          <span
            aria-hidden
            className="ml-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white"
          >
            {iniciais}
          </span>
        </div>
      </div>
    </header>
  );
}
