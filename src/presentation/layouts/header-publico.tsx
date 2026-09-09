"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Building2, Menu, UserRound, X } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import { classesBotao, ThemeToggle } from "@/presentation/components/ui";

const LINKS = [
  { href: "/", rotulo: "Imóveis" },
  { href: "/contato", rotulo: "Contato" },
  { href: "/admin/dashboard", rotulo: "Área do gestor" },
];

export function HeaderPublico() {
  const [aberto, setAberto] = useState(false);
  const caminho = usePathname();
  const [caminhoAnterior, setCaminhoAnterior] = useState(caminho);

  // Fecha o menu ao navegar: ajuste durante o render, sem efeito.
  if (caminho !== caminhoAnterior) {
    setCaminhoAnterior(caminho);
    setAberto(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Building2 aria-hidden className="size-5" />
          </span>
          <span className="text-base font-semibold tracking-tight text-slate-900">
            {siteConfig.nome}
          </span>
        </Link>

        <nav aria-label="Navegação principal" className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={caminho === link.href ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                caminho === link.href
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              {link.rotulo}
            </Link>
          ))}
          <Link href="/portal" className={classesBotao("primario", "sm", "ml-2")}>
            <UserRound aria-hidden className="size-4" />
            Área do inquilino
          </Link>
        </nav>

        <div className="flex items-center gap-1">
          <ThemeToggle />

          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            aria-expanded={aberto}
            aria-controls="menu-mobile"
            aria-label={aberto ? "Fechar menu" : "Abrir menu"}
            className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 md:hidden"
          >
            {aberto ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
          </button>
        </div>
      </div>

      {aberto ? (
        <nav
          id="menu-mobile"
          aria-label="Navegação principal"
          className="border-t border-line bg-surface px-4 py-3 md:hidden"
        >
          <ul className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "block rounded-lg px-3 py-2.5 text-sm font-medium",
                    caminho === link.href
                      ? "bg-brand-50 text-brand-700"
                      : "text-slate-700 hover:bg-slate-100",
                  )}
                >
                  {link.rotulo}
                </Link>
              </li>
            ))}
            <li className="pt-1">
              <Link href="/portal" className={classesBotao("primario", "md", "w-full")}>
                <UserRound aria-hidden className="size-4" />
                Área do inquilino
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
