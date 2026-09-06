import { redirect } from "next/navigation";
import { casosDeUso } from "@/casos-de-uso";
import { HeaderPortal } from "@/presentation/layouts/header-portal";

/**
 * A sessão é resolvida aqui, no servidor. O middleware só evita a navegação
 * inútil — a fronteira de verdade é esta.
 */
export default async function LayoutPortalAutenticado({
  children,
}: {
  children: React.ReactNode;
}) {
  const inquilino = await casosDeUso.portal.sessaoAtual.executar();
  if (!inquilino) redirect("/portal/login");

  return (
    <div className="flex min-h-dvh flex-col">
      <HeaderPortal inquilino={inquilino} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
