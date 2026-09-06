import Link from "next/link";
import { Home, SearchX } from "lucide-react";
import { classesBotao } from "@/presentation/components/ui";

export default function NaoEncontrado() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <SearchX aria-hidden className="size-7" />
      </div>
      <h1 className="mt-5 text-2xl font-semibold text-slate-900">Página não encontrada</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-600">
        O endereço que você acessou não existe, ou o imóvel que procurava não está mais disponível.
      </p>
      <Link href="/" className={classesBotao("primario", "md", "mt-6")}>
        <Home aria-hidden className="size-4" />
        Ver imóveis disponíveis
      </Link>
    </div>
  );
}
