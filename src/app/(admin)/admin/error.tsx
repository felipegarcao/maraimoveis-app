"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, Card, ErrorState, classesBotao } from "@/presentation/components/ui";

export default function ErroAdmin({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin]", error);
  }, [error]);

  return (
    <Card>
      <ErrorState
        titulo="Não foi possível carregar esta tela"
        descricao="Ocorreu um erro ao buscar os dados. Tente novamente ou volte ao painel."
        acao={
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={reset}>Tentar novamente</Button>
            <Link href="/admin/dashboard" className={classesBotao("secundario", "md")}>
              Ir para o dashboard
            </Link>
          </div>
        }
      />
    </Card>
  );
}
