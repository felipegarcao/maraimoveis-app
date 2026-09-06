"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { KeyRound } from "lucide-react";
import type { Imovel, Inquilino } from "@/domain/entities";
import { Button } from "@/presentation/components/ui";
import { FormularioEntrada } from "./formulario-entrada";

export function BotaoNovaEntrada({
  imoveisDisponiveis,
  inquilinos,
  tamanho = "md",
}: {
  imoveisDisponiveis: Imovel[];
  inquilinos: Inquilino[];
  tamanho?: "sm" | "md";
}) {
  const searchParams = useSearchParams();
  const preSelecionado = searchParams.get("novaOcupacao") ?? undefined;
  // Abre direto quando chega de "Registrar entrada" na página do imóvel.
  const [aberto, setAberto] = useState(Boolean(preSelecionado));

  return (
    <>
      <Button tamanho={tamanho} onClick={() => setAberto(true)}>
        <KeyRound aria-hidden className="size-4" />
        Registrar entrada
      </Button>
      {aberto ? (
        <FormularioEntrada
          aberto={aberto}
          aoFechar={() => setAberto(false)}
          imoveisDisponiveis={imoveisDisponiveis}
          inquilinos={inquilinos}
          imovelPreSelecionado={preSelecionado}
        />
      ) : null}
    </>
  );
}
