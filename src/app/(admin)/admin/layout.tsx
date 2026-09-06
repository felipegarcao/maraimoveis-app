import { redirect } from "next/navigation";
import { casosDeUso } from "@/casos-de-uso";
import { SidebarAdmin } from "@/presentation/layouts/sidebar-admin";
import { HeaderAdminServidor } from "@/presentation/layouts/header-admin-servidor";

/**
 * Camada de layout do painel. A sessão é resolvida no servidor e passada para
 * baixo — nenhuma tela do admin busca o usuário por conta própria.
 */
export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const usuario = await casosDeUso.auth.sessaoAtual.executar();
  if (!usuario) redirect("/login");

  return (
    <SidebarAdmin>
      <div className="flex min-h-dvh flex-col">
        <HeaderAdminServidor usuario={usuario} />
        <main className="flex-1 px-4 pb-24 pt-5 sm:px-6 sm:pb-10 sm:pt-6">{children}</main>
      </div>
    </SidebarAdmin>
  );
}
