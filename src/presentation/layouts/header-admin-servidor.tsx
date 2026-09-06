"use client";

import { usePathname } from "next/navigation";
import type { UsuarioSessao } from "@/domain/entities";
import { HeaderAdmin } from "./header-admin";
import { ITENS_MENU } from "./sidebar-admin";

const TITULOS_EXTRA: Record<string, string> = {
  "/admin/imoveis/novo": "Novo imóvel",
  "/admin/inquilinos/novo": "Novo inquilino",
};

/** Deriva o título da página a partir da rota — evita repetir isso em cada tela. */
export function HeaderAdminServidor({ usuario }: { usuario: UsuarioSessao }) {
  const caminho = usePathname();

  const titulo =
    TITULOS_EXTRA[caminho] ??
    [...ITENS_MENU]
      .sort((a, b) => b.href.length - a.href.length)
      .find((item) => caminho === item.href || caminho.startsWith(`${item.href}/`))?.rotulo ??
    "Painel";

  return <HeaderAdmin usuario={usuario} titulo={titulo} />;
}
