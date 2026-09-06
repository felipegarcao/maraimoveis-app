import { ROTULOS_STATUS_CONTRATO, type StatusContrato } from "@/domain/entities";
import { Badge, type TomBadge } from "@/presentation/components/ui";

const TOM_POR_STATUS: Record<StatusContrato, TomBadge> = {
  rascunho: "neutro",
  vigente: "sucesso",
  encerrado: "info",
};

export function StatusContratoBadge({ status }: { status: StatusContrato }) {
  return <Badge tom={TOM_POR_STATUS[status]}>{ROTULOS_STATUS_CONTRATO[status]}</Badge>;
}
