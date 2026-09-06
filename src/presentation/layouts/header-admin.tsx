"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ExternalLink, LogOut, UserRound } from "lucide-react";
import type { UsuarioSessao } from "@/domain/entities";
import { ROTULOS_PAPEL } from "@/domain/entities";
import { sair } from "@/app/_actions/auth";
import { cn } from "@/lib/utils";

export function HeaderAdmin({ usuario, titulo }: { usuario: UsuarioSessao; titulo: string }) {
  const [aberto, setAberto] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    function aoClicarFora(evento: MouseEvent) {
      if (!container.current?.contains(evento.target as Node)) setAberto(false);
    }
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") setAberto(false);
    }
    document.addEventListener("mousedown", aoClicarFora);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  const iniciais = usuario.nome
    .split(" ")
    .filter(Boolean)
    .map((parte) => parte[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-line bg-surface/90 px-4 backdrop-blur sm:px-6">
      <h1 className="truncate text-base font-semibold text-slate-900 sm:text-lg">{titulo}</h1>

      <div className="flex items-center gap-2">
        <Link
          href="/"
          target="_blank"
          className="hidden items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 sm:inline-flex"
        >
          <ExternalLink aria-hidden className="size-4" />
          Ver site
        </Link>

        <div ref={container} className="relative">
          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            aria-expanded={aberto}
            aria-haspopup="menu"
            className="flex items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-2 transition-colors hover:bg-slate-100"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
              {iniciais}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-medium leading-tight text-slate-900">
                {usuario.nome}
              </span>
              <span className="block text-xs leading-tight text-slate-500">
                {ROTULOS_PAPEL[usuario.papel]}
              </span>
            </span>
          </button>

          <div
            role="menu"
            hidden={!aberto}
            className={cn(
              "absolute right-0 top-full mt-1.5 w-56 rounded-card border border-line bg-surface p-1.5 shadow-lift",
            )}
          >
            <div className="border-b border-line px-2.5 py-2">
              <p className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                <UserRound aria-hidden className="size-4 text-slate-400" />
                {usuario.nome}
              </p>
              <p className="mt-0.5 truncate text-xs text-slate-500">{usuario.email}</p>
            </div>
            <Link
              href="/"
              target="_blank"
              role="menuitem"
              className="mt-1 flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-700 hover:bg-slate-100 sm:hidden"
            >
              <ExternalLink aria-hidden className="size-4" />
              Ver site público
            </Link>
            <form action={sair}>
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut aria-hidden className="size-4" />
                Sair da conta
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
