"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/presentation/components/ui";

export default function ErroGlobal({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[erro-nao-tratado]", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-red-50 text-red-500">
        <RotateCcw aria-hidden className="size-7" />
      </div>
      <h1 className="mt-5 text-2xl font-semibold text-slate-900">Algo deu errado</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-600">
        Não conseguimos carregar esta página. Tente novamente — se continuar, avise a gente.
      </p>
      {error.digest ? (
        <p className="mt-1 font-mono text-xs text-slate-400">Código: {error.digest}</p>
      ) : null}
      <Button className="mt-6" onClick={reset}>
        Tentar novamente
      </Button>
    </div>
  );
}
