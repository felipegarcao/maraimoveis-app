import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { casosDeUso } from "@/casos-de-uso";
import { ehErroDominio } from "@/domain/errors";
import { FormularioInquilino } from "@/presentation/features/inquilinos/formulario-inquilino";

export const metadata: Metadata = { title: "Editar inquilino" };

export default async function PaginaEditarInquilino({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let inquilino;
  try {
    inquilino = await casosDeUso.inquilinos.obter.executar(id);
  } catch (erro) {
    if (ehErroDominio(erro)) notFound();
    throw erro;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <FormularioInquilino inquilino={inquilino} />
    </div>
  );
}
