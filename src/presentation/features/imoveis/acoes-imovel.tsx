"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { excluirImovel } from "@/app/_actions/imoveis";
import { Button, ConfirmDialog, classesBotao } from "@/presentation/components/ui";

export function AcoesImovel({
  id,
  titulo,
  compacto = false,
}: {
  id: string;
  titulo: string;
  compacto?: boolean;
}) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);

  async function confirmarExclusao() {
    const resultado = await excluirImovel(id);
    if (!resultado.sucesso) {
      toast.error(resultado.erro);
      return;
    }
    toast.success(
      resultado.dados.excluido
        ? "Imóvel excluído."
        : "Imóvel inativado — o histórico de ocupações foi preservado.",
    );
    router.push("/admin/imoveis");
    router.refresh();
  }

  return (
    <>
      <div className="flex gap-2">
        <Link
          href={`/admin/imoveis/${id}/editar`}
          className={classesBotao("secundario", compacto ? "sm" : "md")}
        >
          <Pencil aria-hidden className="size-4" />
          {compacto ? <span className="sr-only">Editar</span> : "Editar"}
        </Link>
        <Button
          variante="perigoSuave"
          tamanho={compacto ? "sm" : "md"}
          onClick={() => setConfirmando(true)}
        >
          <Trash2 aria-hidden className="size-4" />
          {compacto ? <span className="sr-only">Excluir</span> : "Excluir"}
        </Button>
      </div>

      <ConfirmDialog
        aberto={confirmando}
        aoFechar={() => setConfirmando(false)}
        aoConfirmar={confirmarExclusao}
        titulo="Excluir imóvel"
        textoConfirmar="Excluir"
        descricao={
          <>
            <p>
              Tem certeza que deseja excluir <strong>{titulo}</strong>?
            </p>
            <p className="mt-2 text-slate-500">
              Se o imóvel já teve inquilinos, ele será apenas inativado para preservar o histórico
              de ocupações e o financeiro.
            </p>
          </>
        }
      />
    </>
  );
}
