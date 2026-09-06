"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { ROTULOS_STATUS_LEAD, STATUS_LEAD, type StatusLead } from "@/domain/entities";
import { atualizarStatusLead } from "@/app/_actions/leads";
import { Select } from "@/presentation/components/ui";

export function SeletorStatusLead({ id, status }: { id: string; status: StatusLead }) {
  const router = useRouter();
  const [pendente, iniciarTransicao] = useTransition();

  return (
    <>
      <label htmlFor={`status-lead-${id}`} className="sr-only">
        Situação do atendimento
      </label>
      <Select
        id={`status-lead-${id}`}
        value={status}
        disabled={pendente}
        className="h-8 text-xs"
        onChange={(e) => {
          const novo = e.target.value;
          iniciarTransicao(async () => {
            const resultado = await atualizarStatusLead({ id, status: novo });
            if (!resultado.sucesso) {
              toast.error(resultado.erro);
              return;
            }
            toast.success(`Lead marcado como ${ROTULOS_STATUS_LEAD[resultado.dados.status]}.`);
            router.refresh();
          });
        }}
      >
        {STATUS_LEAD.map((s) => (
          <option key={s} value={s}>
            {ROTULOS_STATUS_LEAD[s]}
          </option>
        ))}
      </Select>
    </>
  );
}
