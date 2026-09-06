import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { casosDeUso } from "@/casos-de-uso";
import { Card, CardBody, CardHeader, Skeleton } from "@/presentation/components/ui";
import { FormularioSenhaInquilino } from "@/presentation/features/portal/formulario-senha-inquilino";

export const metadata: Metadata = { title: "Alterar senha" };

export default async function PaginaSenhaPortal() {
  const sessao = await casosDeUso.portal.sessaoAtual.executar();
  if (!sessao) redirect("/portal/login");

  const painel = await casosDeUso.portal.painel.executar(sessao.id);

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader
          titulo="Alterar senha"
          descricao="Defina uma senha só sua para acessar o portal."
        />
        <CardBody>
          <Suspense fallback={<Skeleton className="h-80 w-full" />}>
            <FormularioSenhaInquilino usandoSenhaPadrao={painel.usandoSenhaPadrao} />
          </Suspense>
        </CardBody>
      </Card>
    </div>
  );
}
