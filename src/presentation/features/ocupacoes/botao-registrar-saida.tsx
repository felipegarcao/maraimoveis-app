"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/presentation/components/ui";
import { FormularioSaida } from "./formulario-saida";

export function BotaoRegistrarSaida({
  ocupacaoId,
  saldoDevedor,
  tamanho = "md",
}: {
  ocupacaoId: string;
  saldoDevedor: number;
  tamanho?: "sm" | "md";
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <Button variante="secundario" tamanho={tamanho} onClick={() => setAberto(true)}>
        <LogOut aria-hidden className="size-4" />
        Registrar saída
      </Button>
      {aberto ? (
        <FormularioSaida
          aberto={aberto}
          aoFechar={() => setAberto(false)}
          ocupacaoId={ocupacaoId}
          saldoDevedor={saldoDevedor}
        />
      ) : null}
    </>
  );
}
