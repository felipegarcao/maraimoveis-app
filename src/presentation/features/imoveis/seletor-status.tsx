"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { ROTULOS_STATUS_IMOVEL, STATUS_IMOVEL, type StatusImovel } from "@/domain/entities";
import { alterarStatusImovel } from "@/app/_actions/imoveis";
import { Select } from "@/presentation/components/ui";

export function SeletorStatusImovel({ id, status }: { id: string; status: StatusImovel }) {
  const router = useRouter();
  const [pendente, iniciarTransicao] = useTransition();

  function alterar(novo: string) {
    iniciarTransicao(async () => {
      const resultado = await alterarStatusImovel(id, novo);
      if (!resultado.sucesso) {
        toast.error(resultado.erro);
        return;
      }
      toast.success(`Situação alterada para ${ROTULOS_STATUS_IMOVEL[resultado.dados.status]}.`);
      router.refresh();
    });
  }

  return (
    <div>
      <label htmlFor="alterar-status" className="sr-only">
        Alterar situação do imóvel
      </label>
      <Select
        id="alterar-status"
        value={status}
        disabled={pendente}
        onChange={(e) => alterar(e.target.value)}
        className="w-full sm:w-48"
      >
        {STATUS_IMOVEL.map((s) => (
          <option key={s} value={s}>
            {ROTULOS_STATUS_IMOVEL[s]}
          </option>
        ))}
      </Select>
    </div>
  );
}
