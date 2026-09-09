import { ROTULOS_STATUS_ASSINATURA, type StatusAssinatura } from "@/domain/entities";
import { Badge, type TomBadge } from "@/presentation/components/ui";

const TOM_POR_STATUS: Record<StatusAssinatura, TomBadge> = {
  pendente: "neutro",
  enviada: "alerta",
  assinada: "sucesso",
};

export function StatusAssinaturaBadge({ status }: { status: StatusAssinatura }) {
  return <Badge tom={TOM_POR_STATUS[status]}>{ROTULOS_STATUS_ASSINATURA[status]}</Badge>;
}
