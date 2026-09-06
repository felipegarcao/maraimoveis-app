import Link from "next/link";
import { SearchX } from "lucide-react";
import { Card, EmptyState, classesBotao } from "@/presentation/components/ui";

export default function NaoEncontradoAdmin() {
  return (
    <Card>
      <EmptyState
        icone={SearchX}
        titulo="Registro não encontrado"
        descricao="O item que você procura não existe ou foi removido."
        acao={
          <Link href="/admin/dashboard" className={classesBotao("primario", "md")}>
            Voltar ao dashboard
          </Link>
        }
      />
    </Card>
  );
}
