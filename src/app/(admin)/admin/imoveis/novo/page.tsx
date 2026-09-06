import type { Metadata } from "next";
import { FormularioImovel } from "@/presentation/features/imoveis/formulario-imovel";

export const metadata: Metadata = { title: "Novo imóvel" };

export default function PaginaNovoImovel() {
  return (
    <div className="mx-auto max-w-4xl">
      <FormularioImovel />
    </div>
  );
}
