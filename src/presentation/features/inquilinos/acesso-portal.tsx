"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, RotateCcw } from "lucide-react";
import { redefinirSenhaPortal } from "@/app/_actions/inquilinos";
import { formatarCpfCnpj, formatarData } from "@/lib/formatters";
import { Badge, Button, CardBody, ConfirmDialog } from "@/presentation/components/ui";

/**
 * Situação do acesso do inquilino ao portal, com a única recuperação possível:
 * devolver o login à senha padrão (o documento).
 */
export function AcessoPortalInquilino({
  inquilinoId,
  nome,
  documento,
  definiuSenha,
  atualizadoEm,
}: {
  inquilinoId: string;
  nome: string;
  documento: string;
  definiuSenha: boolean;
  atualizadoEm: string | null;
}) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);

  async function confirmar() {
    const resultado = await redefinirSenhaPortal(inquilinoId);
    if (!resultado.sucesso) {
      toast.error(resultado.erro);
      return;
    }
    toast.success("Acesso redefinido. A senha voltou a ser o documento do inquilino.");
    router.refresh();
  }

  return (
    <>
      <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-900">
            <KeyRound aria-hidden className="size-4 text-slate-400" />
            Acesso ao portal
            <Badge tom={definiuSenha ? "sucesso" : "alerta"} ponto>
              {definiuSenha ? "Senha própria definida" : "Usando senha padrão"}
            </Badge>
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            Login: <span className="font-medium">{formatarCpfCnpj(documento)}</span>
            {definiuSenha
              ? atualizadoEm
                ? ` · senha alterada em ${formatarData(atualizadoEm)}`
                : ""
              : " · a senha ainda é o próprio documento"}
          </p>
        </div>

        {definiuSenha ? (
          <Button variante="secundario" onClick={() => setConfirmando(true)} className="shrink-0">
            <RotateCcw aria-hidden className="size-4" />
            Redefinir acesso
          </Button>
        ) : null}
      </CardBody>

      <ConfirmDialog
        aberto={confirmando}
        aoFechar={() => setConfirmando(false)}
        aoConfirmar={confirmar}
        destrutivo={false}
        titulo="Redefinir acesso ao portal"
        textoConfirmar="Redefinir"
        descricao={
          <>
            <p>
              A senha de <strong>{nome}</strong> volta a ser o documento{" "}
              <strong>{formatarCpfCnpj(documento)}</strong>.
            </p>
            <p className="mt-2 text-slate-500">
              Use isso quando o inquilino esquecer a senha. Avise que ele deve criar uma nova senha
              logo no próximo acesso.
            </p>
          </>
        }
      />
    </>
  );
}
