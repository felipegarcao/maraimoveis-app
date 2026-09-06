import type { Metadata } from "next";
import { FormularioInquilino } from "@/presentation/features/inquilinos/formulario-inquilino";

export const metadata: Metadata = { title: "Novo inquilino" };

export default function PaginaNovoInquilino() {
  return (
    <div className="mx-auto max-w-3xl">
      <FormularioInquilino />
    </div>
  );
}
