import { ROTULOS_STATUS_IMOVEL, type StatusImovel } from "@/domain/entities";
import { Badge, type TomBadge } from "@/presentation/components/ui";

const TOM_POR_STATUS: Record<StatusImovel, TomBadge> = {
  disponivel: "sucesso",
  alugado: "info",
  manutencao: "alerta",
  inativo: "neutro",
};

export function StatusImovelBadge({ status }: { status: StatusImovel }) {
  return (
    <Badge tom={TOM_POR_STATUS[status]} ponto>
      {ROTULOS_STATUS_IMOVEL[status]}
    </Badge>
  );
}
