"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Building2,
  ChevronsLeft,
  FileText,
  Inbox,
  KeyRound,
  LayoutDashboard,
  Menu,
  PieChart,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePreferenciaBooleana } from "@/presentation/hooks/use-preferencia-local";

export const ITENS_MENU = [
  { href: "/admin/dashboard", rotulo: "Dashboard", icone: LayoutDashboard },
  { href: "/admin/imoveis", rotulo: "Imóveis", icone: Building2 },
  { href: "/admin/inquilinos", rotulo: "Inquilinos", icone: Users },
  { href: "/admin/ocupacoes", rotulo: "Ocupações", icone: KeyRound },
  { href: "/admin/contratos", rotulo: "Contratos", icone: FileText },
  { href: "/admin/financeiro", rotulo: "Financeiro", icone: Wallet },
  { href: "/admin/relatorios", rotulo: "Relatórios", icone: PieChart },
  { href: "/admin/leads", rotulo: "Leads", icone: Inbox },
] as const;

/** Itens que cabem na barra inferior do mobile; o resto vai para o drawer. */
const ITENS_MOBILE = ITENS_MENU.slice(0, 4);

function estaAtivo(caminho: string, href: string): boolean {
  return caminho === href || caminho.startsWith(`${href}/`);
}

export function SidebarAdmin({ children }: { children: React.ReactNode }) {
  const caminho = usePathname();
  // Preferência de sidebar é conveniência local do navegador.
  const [colapsada, definirColapsada] = usePreferenciaBooleana("sidebar-colapsada");
  const [drawerAberto, setDrawerAberto] = useState(false);
  const [caminhoAnterior, setCaminhoAnterior] = useState(caminho);

  // Fecha o drawer ao navegar: ajuste durante o render, sem efeito.
  if (caminho !== caminhoAnterior) {
    setCaminhoAnterior(caminho);
    setDrawerAberto(false);
  }

  function alternarColapso() {
    definirColapsada(!colapsada);
  }

  return (
    <>
      {/* Sidebar — desktop */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-line bg-surface transition-[width] duration-200 lg:flex",
          colapsada ? "w-[68px]" : "w-60",
        )}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-line px-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Building2 aria-hidden className="size-5" />
          </span>
          {!colapsada ? (
            <span className="truncate text-sm font-semibold text-slate-900">Mara Imóveis</span>
          ) : null}
        </div>

        <nav aria-label="Menu administrativo" className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-0.5">
            {ITENS_MENU.map(({ href, rotulo, icone: Icone }) => {
              const ativo = estaAtivo(caminho, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    title={colapsada ? rotulo : undefined}
                    aria-current={ativo ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      colapsada && "justify-center px-0",
                      ativo
                        ? "bg-brand-50 text-brand-700"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                    )}
                  >
                    <Icone aria-hidden className="size-4 shrink-0" />
                    {!colapsada ? <span className="truncate">{rotulo}</span> : null}
                    {colapsada ? <span className="sr-only">{rotulo}</span> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <button
          type="button"
          onClick={alternarColapso}
          aria-label={colapsada ? "Expandir menu" : "Recolher menu"}
          className="flex items-center gap-3 border-t border-line px-4 py-3 text-sm text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
        >
          <ChevronsLeft
            aria-hidden
            className={cn("size-4 shrink-0 transition-transform", colapsada && "rotate-180")}
          />
          {!colapsada ? "Recolher" : null}
        </button>
      </aside>

      <div className={cn("lg:transition-[padding]", colapsada ? "lg:pl-[68px]" : "lg:pl-60")}>
        {children}
      </div>

      {/* Barra inferior — mobile */}
      <nav
        aria-label="Menu administrativo"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur lg:hidden"
      >
        <ul className="grid grid-cols-5">
          {ITENS_MOBILE.map(({ href, rotulo, icone: Icone }) => {
            const ativo = estaAtivo(caminho, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={ativo ? "page" : undefined}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                    ativo ? "text-brand-700" : "text-slate-500",
                  )}
                >
                  <Icone aria-hidden className="size-5" />
                  {rotulo}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setDrawerAberto(true)}
              aria-label="Mais opções"
              className="flex w-full flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-slate-500"
            >
              <Menu aria-hidden className="size-5" />
              Mais
            </button>
          </li>
        </ul>
      </nav>

      {drawerAberto ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            aria-hidden
            onClick={() => setDrawerAberto(false)}
            className="absolute inset-0 bg-slate-900/50"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu completo"
            className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-surface pb-[env(safe-area-inset-bottom)] shadow-lift"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-900">Menu</h2>
              <button
                type="button"
                onClick={() => setDrawerAberto(false)}
                aria-label="Fechar menu"
                autoFocus
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>
            <ul className="grid grid-cols-2 gap-2 p-3">
              {ITENS_MENU.map(({ href, rotulo, icone: Icone }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg border border-line px-3 py-3 text-sm font-medium",
                      estaAtivo(caminho, href)
                        ? "border-brand-200 bg-brand-50 text-brand-700"
                        : "text-slate-700",
                    )}
                  >
                    <Icone aria-hidden className="size-4" />
                    {rotulo}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
