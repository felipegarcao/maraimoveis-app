import { HeaderPublico } from "@/presentation/layouts/header-publico";
import { RodapePublico } from "@/presentation/layouts/rodape-publico";

export default function LayoutPublico({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <HeaderPublico />
      <main className="flex-1">{children}</main>
      <RodapePublico />
    </div>
  );
}
