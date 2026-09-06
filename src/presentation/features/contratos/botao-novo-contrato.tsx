"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { FilePlus2 } from "lucide-react";
import type { OcupacaoDetalhada } from "@/application/dtos";
import { Button } from "@/presentation/components/ui";
import { FormularioContrato } from "./formulario-contrato";

export function BotaoNovoContrato({ ocupacoes }: { ocupacoes: OcupacaoDetalhada[] }) {
  const searchParams = useSearchParams();
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <Button onClick={() => setAberto(true)}>
        <FilePlus2 aria-hidden className="size-4" />
        Novo contrato
      </Button>
      {aberto ? (
        <FormularioContrato
          aberto={aberto}
          aoFechar={() => setAberto(false)}
          ocupacoes={ocupacoes}
          ocupacaoPreSelecionada={searchParams.get("ocupacaoId") ?? undefined}
        />
      ) : null}
    </>
  );
}
