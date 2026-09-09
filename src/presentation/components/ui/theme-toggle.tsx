"use client";

import { Moon, Sun } from "lucide-react";
import { useTema } from "@/presentation/providers/theme-provider";
import { cn } from "@/lib/utils";

/**
 * Alterna entre o tema padrão (claro) e o tema preto. Um único botão de
 * ícone, no mesmo estilo dos demais controles do header — não é um switch
 * com rótulo porque só existem dois estados, autoexplicados pelo ícone.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { tema, alternarTema } = useTema();
  const preto = tema === "black";

  return (
    <button
      type="button"
      onClick={alternarTema}
      aria-label={preto ? "Usar tema padrão" : "Usar tema preto"}
      title={preto ? "Usar tema padrão" : "Usar tema preto"}
      className={cn(
        "rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900",
        className,
      )}
    >
      {preto ? <Sun aria-hidden className="size-4" /> : <Moon aria-hidden className="size-4" />}
    </button>
  );
}
