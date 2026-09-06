import { ROTULOS_STATUS_PAGAMENTO, type StatusPagamento } from "@/domain/entities";
import { Badge, type TomBadge } from "@/presentation/components/ui";

const TOM_POR_STATUS: Record<StatusPagamento, TomBadge> = {
  pago: "sucesso",
  parcial: "alerta",
  aberto: "neutro",
  atrasado: "perigo",
};

export function StatusPagamentoBadge({ status }: { status: StatusPagamento }) {
  return (
    <Badge tom={TOM_POR_STATUS[status]} ponto>
      {ROTULOS_STATUS_PAGAMENTO[status]}
    </Badge>
  );
}
