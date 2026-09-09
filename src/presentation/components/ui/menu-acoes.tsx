"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Loader2, MoreVertical, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// useLayoutEffect avisa no console quando roda durante SSR — este componente
// só usa o efeito depois de aberto (nunca no primeiro render do servidor),
// mas o aviso dispara mesmo assim; no server cai para useEffect, que é inerte.
const useEfeitoDeLayout = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Menu de ações em popover — reúne ações secundárias sob um botão "⋮" em vez
 * de espalhar um botão por ação na tela (linhas de tabela ficam ilegíveis com
 * muitos botões lado a lado). O menu fecha ao clicar fora, no Escape ou ao
 * escolher qualquer item.
 *
 * Renderizado num portal, com posição calculada a partir do botão: uma tabela
 * usa `overflow-hidden` no Card para arredondar os cantos, e um popover
 * `absolute` comum seria cortado nas últimas linhas.
 */
export function MenuAcoes({
  rotulo = "Mais ações",
  align = "right",
  className,
  children,
}: {
  rotulo?: string;
  align?: "left" | "right";
  className?: string;
  children: ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  const [posicao, setPosicao] = useState<{ top: number; left: number } | null>(null);
  const botao = useRef<HTMLButtonElement>(null);
  const painel = useRef<HTMLDivElement>(null);

  useEfeitoDeLayout(() => {
    if (!aberto) return;

    function reposicionar() {
      const rect = botao.current?.getBoundingClientRect();
      if (!rect) return;
      const LARGURA_PAINEL = 224; // w-56
      setPosicao({
        top: rect.bottom + 6,
        left: align === "right" ? rect.right - LARGURA_PAINEL : rect.left,
      });
    }

    reposicionar();
    window.addEventListener("scroll", reposicionar, true);
    window.addEventListener("resize", reposicionar);
    return () => {
      window.removeEventListener("scroll", reposicionar, true);
      window.removeEventListener("resize", reposicionar);
    };
  }, [aberto, align]);

  useEffect(() => {
    if (!aberto) return;
    function aoClicarFora(evento: MouseEvent) {
      const alvo = evento.target as Node;
      if (botao.current?.contains(alvo) || painel.current?.contains(alvo)) return;
      setAberto(false);
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

  return (
    <div className={cn("inline-block", className)}>
      <button
        ref={botao}
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-haspopup="menu"
        aria-label={rotulo}
        title={rotulo}
        className="flex size-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
      >
        <MoreVertical aria-hidden className="size-4" />
      </button>

      {aberto && posicao && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={painel}
              role="menu"
              style={{ top: posicao.top, left: posicao.left }}
              // Fecha ao escolher qualquer item — cada ItemMenu dispara sua
              // própria ação antes do bubble chegar aqui.
              onClick={() => setAberto(false)}
              className="fixed z-40 w-56 rounded-card border border-line bg-surface p-1.5 shadow-lift"
            >
              {children}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

const TONS_ITEM = {
  padrao: "text-slate-700 hover:bg-slate-100",
  perigo: "text-red-600 hover:bg-red-50",
} as const;

export function ItemMenu({
  icone: Icone,
  tom = "padrao",
  carregando = false,
  className,
  children,
  disabled,
  ...props
}: ComponentPropsWithRef<"button"> & {
  icone?: LucideIcon;
  tom?: keyof typeof TONS_ITEM;
  carregando?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-55",
        TONS_ITEM[tom],
        className,
      )}
      {...props}
    >
      {carregando ? (
        <Loader2 aria-hidden className="size-4 animate-spin" />
      ) : Icone ? (
        <Icone aria-hidden className="size-4" />
      ) : null}
      {children}
    </button>
  );
}

/** Mesmo visual do ItemMenu aplicado a `<a>`/`<Link>` — para downloads e navegação. */
export function LinkMenu({
  icone: Icone,
  className,
  children,
  ...props
}: ComponentPropsWithRef<"a"> & { icone?: LucideIcon }) {
  return (
    <a
      role="menuitem"
      className={cn(
        "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
        TONS_ITEM.padrao,
        className,
      )}
      {...props}
    >
      {Icone ? <Icone aria-hidden className="size-4" /> : null}
      {children}
    </a>
  );
}
