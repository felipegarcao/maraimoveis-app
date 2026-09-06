"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { excluirInquilino } from "@/app/_actions/inquilinos";
import { Button, ConfirmDialog, classesBotao } from "@/presentation/components/ui";

export function AcoesInquilino({
  id,
  nome,
  compacto = false,
}: {
  id: string;
  nome: string;
  compacto?: boolean;
}) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);

  async function confirmarExclusao() {
    const resultado = await excluirInquilino(id);
    if (!resultado.sucesso) {
      toast.error(resultado.erro);
      return;
    }
    toast.success(
      resultado.dados.excluido
        ? "Inquilino excluído."
        : "Cadastro inativado — o histórico de ocupações continua acessível.",
    );
    router.push("/admin/inquilinos");
    router.refresh();
  }

  return (
    <>
      <div className="flex gap-2">
        <Link
          href={`/admin/inquilinos/${id}/editar`}
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
        titulo="Excluir inquilino"
        textoConfirmar="Excluir"
        descricao={
          <>
            <p>
              Tem certeza que deseja excluir o cadastro de <strong>{nome}</strong>?
            </p>
            <p className="mt-2 text-slate-500">
              Se houver ocupações registradas, o cadastro será apenas inativado — o histórico de
              imóveis, contratos e pagamentos permanece intacto.
            </p>
          </>
        }
      />
    </>
  );
}
