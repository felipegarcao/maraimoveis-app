import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { casosDeUso } from "@/casos-de-uso";
import { ehErroDominio } from "@/domain/errors";
import { FormularioImovel } from "@/presentation/features/imoveis/formulario-imovel";

export const metadata: Metadata = { title: "Editar imóvel" };

export default async function PaginaEditarImovel({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let imovel;
  try {
    imovel = await casosDeUso.imoveis.obter.executar(id);
  } catch (erro) {
    if (ehErroDominio(erro)) notFound();
    throw erro;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <FormularioImovel imovel={imovel} />
    </div>
  );
}
